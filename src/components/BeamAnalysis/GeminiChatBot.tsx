import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BeamCalculator } from './calculations';
import { Load, MaterialProperties, DiagramPoint, Reactions } from './types';

type Message = {
  role: "user" | "assistant";
  text: string;
  isStreaming?: boolean;
};

interface BeamData {
  beamLength: number;
  beamHeight: number;
  beamWidth: number;
  materialProps: MaterialProperties;
  startSupport: 'pin' | 'roller' | 'fixed' | 'free';
  endSupport: 'pin' | 'roller' | 'fixed' | 'free';
  startSupportPosition: number;
  endSupportPosition: number;
  loads: Load[];
  reactions?: Reactions;
  diagramData?: DiagramPoint[];
}

interface BeamChatBotProps {
  beamData: BeamData | null;
  onAnalyze?: (analysisResults: any) => void;
}

const BeamChatBot: React.FC<BeamChatBotProps> = ({ beamData, onAnalyze }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not defined");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const analyzeBeam = useCallback(() => {
    if (!beamData) return null;

    try {
      const calculator = new BeamCalculator(
        beamData.beamLength,
        beamData.beamHeight,
        beamData.beamWidth,
        beamData.materialProps,
        beamData.startSupportPosition,
        beamData.endSupportPosition,
        beamData.startSupport,
        beamData.endSupport,
        beamData.loads
      );

      const reactions = calculator.calculateReactions();
      const diagramData = calculator.generateDiagramData();
      const sectionProps = calculator.calculateSectionProperties();

      return {
        reactions,
        diagramData,
        sectionProps
      };
    } catch (error) {
      console.error("Analysis error:", error);
      return null;
    }
  }, [beamData]);

  const formatBeamData = useCallback((): string => {
    if (!beamData) return "No beam data available.";

    const analysis = analyzeBeam();
    if (!analysis) return "Analysis failed or no data available.";

    let dataString = "Beam Analysis Data:\n\n";

    // Beam Properties
    dataString += "Beam Properties:\n";
    dataString += `  - Length: ${beamData.beamLength} m\n`;
    dataString += `  - Height: ${beamData.beamHeight} m\n`;
    dataString += `  - Width: ${beamData.beamWidth} m\n`;

    // Material Properties
    dataString += "\nMaterial Properties:\n";
    dataString += `  - Elastic Modulus: ${beamData.materialProps.elasticModulus} MPa\n`;
    dataString += `  - Shear Modulus: ${beamData.materialProps.shearModulus} MPa\n`;

    // Section Properties
    dataString += "\nSection Properties:\n";
    dataString += `  - Area: ${analysis.sectionProps.area.toFixed(6)} m²\n`;
    dataString += `  - Moment of Inertia: ${analysis.sectionProps.momentOfInertia.toFixed(6)} m⁴\n`;
    dataString += `  - Section Modulus: ${analysis.sectionProps.sectionModulus.toFixed(6)} m³\n`;

    // Support Configuration
    dataString += "\nSupport Configuration:\n";
    dataString += `  - Start Support: ${beamData.startSupport} at ${beamData.startSupportPosition} m\n`;
    dataString += `  - End Support: ${beamData.endSupport} at ${beamData.endSupportPosition} m\n`;

    // Loads
    dataString += "\nLoads:\n";
    beamData.loads.forEach((load, index) => {
      dataString += `  - Load ${index + 1}: ${load.type}\n`;
      dataString += `    - Position: ${load.position} m\n`;
      dataString += `    - Magnitude: ${load.magnitude} ${
        load.type === "distributed" ? "kN/m" : load.type === 'moment' || load.type === 'torsion' ? "kNm" : "kN"
      }\n`;
      if (load.type === "distributed" && load.length) {
        dataString += `    - Length: ${load.length} m\n`;
      }
      if ((load.type === "moment" || load.type === "torsion") && load.momentDirection) {
        dataString += `    - Direction: ${load.momentDirection}\n`;
      }
    });

    // Reactions
    dataString += "\nReactions:\n";
    dataString += `  - Reaction A: ${analysis.reactions.reactionA.toFixed(2)} kN\n`;
    dataString += `  - Reaction B: ${analysis.reactions.reactionB.toFixed(2)} kN\n`;
    dataString += `  - Moment A: ${analysis.reactions.momentA.toFixed(2)} kN·m\n`;
    dataString += `  - Moment B: ${analysis.reactions.momentB.toFixed(2)} kN·m\n`;

    // Maximum Values
    if (analysis.diagramData && analysis.diagramData.length > 0) {
      const maxShear = Math.max(...analysis.diagramData.map(d => Math.abs(d.shear)));
      const maxMoment = Math.max(...analysis.diagramData.map(d => Math.abs(d.moment)));
      const maxDeflection = Math.max(...analysis.diagramData.map(d => Math.abs(d.deflection)));

      dataString += "\nMaximum Values:\n";
      dataString += `  - Maximum Shear Force: ${maxShear.toFixed(2)} kN\n`;
      dataString += `  - Maximum Bending Moment: ${maxMoment.toFixed(2)} kN·m\n`;
      dataString += `  - Maximum Deflection: ${maxDeflection.toFixed(3)} mm\n`;
    }

    return dataString;
  }, [beamData, analyzeBeam]);

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const assistantPlaceholder: Message = {
      role: "assistant",
      text: "",
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const beamDataString = formatBeamData();
      const chat = model.startChat({
        history: messages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })),
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.9,
        },
      });

      const prompt = `You are a structural engineering assistant named Miata. 
        Here is the data for the current beam analysis:
        
        ${beamDataString}
        
        Answer the following user question politely , don't make any self-introductory, making sure to use the provided beam data:

        User Question: ${input}`;
      const result = await chat.sendMessageStream(prompt);

      let streamedResponse = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        streamedResponse += chunkText;

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          const placeholderIndex = updatedMessages.findIndex(
            (msg) => msg.isStreaming
          );
          if (placeholderIndex !== -1) {
            updatedMessages[placeholderIndex] = {
              role: "assistant",
              text: streamedResponse,
              isStreaming: true,
            };
          }
          return updatedMessages;
        });
      }

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const placeholderIndex = updatedMessages.findIndex((msg) => msg.isStreaming);
        if (placeholderIndex !== -1) {
          updatedMessages[placeholderIndex] = {
            ...updatedMessages[placeholderIndex],
            isStreaming: false,
          };
        }
        return updatedMessages;
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError("Sorry, something went wrong. Please try again.");
      setMessages(prevMessages => prevMessages.filter(msg => !msg.isStreaming));
    } finally {
      setIsLoading(false);
    }
  }, [input, model, messages, formatBeamData]);

  const clearChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {/* Chat toggle button */}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full p-4 shadow-lg dark:shadow-gray-900/30 transition-all duration-300 flex items-center justify-center"
          aria-label="Toggle chat assistant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300 ease-in-out">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-t-2xl flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Miata</h2>
        <div>
          <button
            onClick={clearChat}
            className="text-white hover:text-gray-200 mr-3 transition duration-200"
            title="Clear Chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </button>
          <button
            onClick={toggleVisibility}
            className="text-white hover:text-gray-200 transition duration-200"
            title="Minimize Chatbot"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 dark:bg-gray-800" ref={chatHistoryRef}>
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index}>
            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] p-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-200 dark:bg-blue-700 text-gray-800 dark:text-gray-100"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                } ${msg.isStreaming ? "animate-pulse" : ""} shadow dark:shadow-gray-900/30`}
              >
                <div className="text-sm font-medium mb-1">
                  {msg.role === "user" ? "You" : "Miata"}
                </div>
                <div className="text-sm whitespace-pre-line">{msg.text}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 rounded-b-2xl">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me questions about your beam analysis..."
            disabled={isLoading}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-full ${isLoading || !input.trim() ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'} text-white transition duration-200`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BeamChatBot;