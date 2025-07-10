// Code for Beam Analysis Component
"use client";
import React, { useState, useCallback, useEffect } from 'react';
import { BeamCalculator } from './calculations';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Trash2, Info, ChevronDown, ChevronUp, Plus, Box, BarChart2, Ruler, Save, FolderOpen, Sun, Moon, FileText, Loader2, ClipboardCheck } from 'lucide-react';
import BeamDeformationVisualization from './BeamDeformationVisualization';
import { Load, MaterialProperties, Reactions, SectionProperties, DiagramPoint, BeamProject } from './types';
import ProjectManagement from './ProjectManagement';
import { useTheme } from '../ThemeProvider';
import { useTabContext } from '../TabContext';
import BeamReinforcementDesign from './BeamReinforcementDesign';
import BeamSectionAnalysis from './BeamSectionAnalysis';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';

const engineeringFacts = [
  "The world's longest beam bridge is the Lake Pontchartrain Causeway in Louisiana, USA, at nearly 24 miles (38 km) long.",
  'Steel beams can be recycled indefinitely without losing their strength.',
  'The I-beam shape is one of the most efficient for carrying bending and shear loads.',
  'Concrete beams are often reinforced with steel to resist tension forces.',
  'The first iron bridge was built in 1779 in Shropshire, England, and is still standing today.',
  'Deflection limits for beams are typically set to L/360 for live loads in building codes.',
  'Prestressed concrete beams can span much longer distances than regular reinforced concrete beams.',
  "The Golden Gate Bridge's main span is supported by cables, but its approach spans use steel beams.",
  'Shear cracks in beams usually form at about 45 degrees to the axis of the beam.',
  'The modulus of elasticity for steel is about 200 GPa, much higher than for concrete.'
];

const getRandomFact = () => engineeringFacts[Math.floor(Math.random() * engineeringFacts.length)];

// Add prop types
interface BeamAnalysisProps {
  onBeamDataChange?: (data: {
    width: number;
    height: number;
    materialProps: {
      elasticModulus: number;
      shearModulus: number;
      yieldStrength: number;
      ultimateStrength: number;
    };
    loads: {
      axialForce: number;
      shearForce: number;
      bendingMoment: number;
      torsion: number;
    };
  }) => void;
}

// Update function signature
const BeamAnalysis: React.FC<BeamAnalysisProps> = ({ onBeamDataChange, ...rest }) => {
  const { theme, toggleTheme } = useTheme();
  const { activeTab } = useTabContext();
  const [showChatbot, setShowChatbot] = useState(true);

  const [beamLength, setBeamLength] = useState<number>(5);
  const [beamHeight, setBeamHeight] = useState<number>(600); // mm
  const [beamWidth, setBeamWidth] = useState<number>(300); // mm
  const [materialProps, setMaterialProps] = useState<MaterialProperties>({
    elasticModulus: 200000,
    shearModulus: 77000
  });
  // Initialize loads with proper typing
  const [loads, setLoads] = useState<Load[]>([]);
  const [startSupportPosition, setStartSupportPosition] = useState<number>(0);
  const [endSupportPosition, setEndSupportPosition] = useState<number>(4);
  const [startSupport, setStartSupport] = useState<'pin' | 'roller' | 'fixed' | 'free'>('pin');
  const [endSupport, setEndSupport] = useState<'pin' | 'roller' | 'fixed' | 'free'>('roller');
  const [reactions, setReactions] = useState<Reactions>({
    reactionA: 0,
    reactionB: 0,
    momentA: 0,
    momentB: 0
  });
  const [showStressInfo, setShowStressInfo] = useState<boolean>(false);
  const [diagramData, setDiagramData] = useState<DiagramPoint[]>([]); // Store diagram data

  const [showLoadHelp, setShowLoadHelp] = useState(false);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState<BeamProject[]>(() => {
    if (typeof window !== 'undefined') {
      const savedProjects = localStorage.getItem('beamProjects');
      return savedProjects ? JSON.parse(savedProjects) : [];
    }
    return [];
  });
  const [currentProject, setCurrentProject] = useState<BeamProject | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const [factBanner, setFactBanner] = useState<string | null>(getRandomFact());

  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Save projects to local storage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('beamProjects', JSON.stringify(projects));
    }
  }, [projects]);

  // Call onBeamDataChange when beam data changes
  useEffect(() => {
    if (onBeamDataChange) {
      const maxShear = Math.max(...diagramData.map(d => Math.abs(d.shear)), 0);
      const maxMoment = Math.max(...diagramData.map(d => Math.abs(d.moment)), 0);
      
      onBeamDataChange({
        width: beamWidth,
        height: beamHeight,
        materialProps: {
          elasticModulus: materialProps.elasticModulus,
          shearModulus: materialProps.shearModulus,
          yieldStrength: 250, // Default steel yield strength
          ultimateStrength: 400 // Default steel ultimate strength
        },
        loads: {
          axialForce: 0, // Could be calculated from loads if needed
          shearForce: maxShear,
          bendingMoment: maxMoment,
          torsion: 0 // Could be calculated from loads if needed
        }
      });
    }
  }, [beamWidth, beamHeight, materialProps, diagramData, onBeamDataChange]);

  const handleSaveProject = useCallback(() => {
    if (!projectName.trim()) {
      toast.error('Project name is required!');
      return;
    }
    setIsSaving(true);
    try {
      const newProject: BeamProject = {
        id: Date.now().toString(),
        name: projectName,
        beamLength,
        beamHeight,
        beamWidth,
        materialProps,
        loads,
        startSupport,
        endSupport,
        startSupportPosition,
        endSupportPosition,
        diagramData,
        reactions,
        showStressInfo,
        showLoadHelp,
        createdAt: new Date(),
        updatedAt: new Date(),
        history: [],
        version: 1,
      };
      setProjects(prev => [...prev, newProject]);
      setCurrentProject(newProject);
      setIsProjectModalOpen(false);
      setProjectName('');
      toast.success('Project saved successfully!');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast(getRandomFact(), { icon: '💡', duration: 6000 });
    } catch (err) {
      toast.error('Failed to save project.');
    } finally {
      setIsSaving(false);
    }
  }, [projectName, beamLength, beamHeight, beamWidth, materialProps, loads, startSupport, endSupport, startSupportPosition, endSupportPosition, diagramData, reactions, showStressInfo, showLoadHelp]);

  const handleLoadProject = useCallback((project: BeamProject) => {
    setIsLoadingProject(true);
    try {
      setCurrentProject(project);
      setBeamLength(project.beamLength);
      setBeamHeight(project.beamHeight);
      setBeamWidth(project.beamWidth);
      setMaterialProps(project.materialProps);
      setLoads(project.loads);
      setStartSupport(project.startSupport);
      setEndSupport(project.endSupport);
      setStartSupportPosition(project.startSupportPosition);
      setEndSupportPosition(project.endSupportPosition);
      setDiagramData(project.diagramData);
      setReactions(project.reactions);
      setIsProjectModalOpen(false);
      toast.success(`Project "${project.name}" loaded!`);
    } catch (err) {
      toast.error('Failed to load project.');
    } finally {
      setIsLoadingProject(false);
    }
  }, []);

  // Add validation before calculations
  const validateLoads = useCallback(() => {
    if (loads.length === 0) return true;
    
    for (const load of loads) {
      if (Math.abs(load.magnitude) < 0.001) {
        alert(`Load magnitude cannot be zero. Please set a non-zero value for the ${load.type} load.`);
        return false;
      }
    }
    return true;
  }, [loads]);

  // Create a beamData object to pass to GeminiChatBot
  const beamData = {
    beamLength,
    beamHeight,
    beamWidth,
    materialProps,
    startSupport,
    endSupport,
    startSupportPosition,
    endSupportPosition,
    loads,
    reactions,
    diagramData
  };

  // This useEffect is crucial for preventing the infinite loop
  useEffect(() => {
    if (startSupportPosition >= endSupportPosition) {
      setStartSupportPosition(Math.max(0, endSupportPosition - 0.1));
    }
    // Ensure end support position doesn't exceed beam length
    if (endSupportPosition > beamLength) {
      setEndSupportPosition(beamLength);
    }
  }, [startSupportPosition, endSupportPosition, beamLength]);

  // Add validation state for beam properties
  const [beamLengthError, setBeamLengthError] = useState<string | null>(null);
  const [beamHeightError, setBeamHeightError] = useState<string | null>(null);
  const [beamWidthError, setBeamWidthError] = useState<string | null>(null);

  const validateBeamLength = (value: number) => {
    if (value <= 0) return 'Beam length must be greater than 0.';
    return null;
  };
  const validateBeamHeight = (value: number) => {
    if (value < 10) return 'Beam height must be at least 10 mm.';
    return null;
  };
  const validateBeamWidth = (value: number) => {
    if (value < 10) return 'Beam width must be at least 10 mm.';
    return null;
  };

  const handleBeamLengthChange = useCallback((newLength: number) => {
    const error = validateBeamLength(newLength);
    setBeamLengthError(error);
    if (!error) setBeamLength(newLength);
  }, []);
  const handleBeamHeightChange = (value: number) => {
    const error = validateBeamHeight(value);
    setBeamHeightError(error);
    if (!error) setBeamHeight(value);
  };
  const handleBeamWidthChange = (value: number) => {
    const error = validateBeamWidth(value);
    setBeamWidthError(error);
    if (!error) setBeamWidth(value);
  };

  // Update support position handler with proper validation
  const handleSupportPositionChange = useCallback((position: number, isStart: boolean) => {
    setCalculationError(null); // Clear error on change
    if (isStart) {
      const newPosition = Math.max(0, Math.min(position, endSupportPosition - 0.1));
      setStartSupportPosition(newPosition);
    } else {
      const newPosition = Math.min(beamLength, Math.max(position, startSupportPosition + 0.1));
      setEndSupportPosition(newPosition);
    }
  }, [beamLength, endSupportPosition, startSupportPosition]);


  const calculateSectionProperties = useCallback((): SectionProperties => {
    try {
      if (!validateLoads()) {
        return { momentOfInertia: 0, sectionModulus: 0, area: 0, polarMomentOfInertia: 0, torsionalConstant: 0 };
      }

      const calculator = new BeamCalculator(
        beamLength,
        beamHeight,
        beamWidth,
        materialProps,
        startSupportPosition,
        endSupportPosition,
        startSupport,
        endSupport,
        loads
      );
      return calculator.calculateSectionProperties();


    } catch (error) {
      console.error('Error calculating section properties:', error);
      return { momentOfInertia: 0, sectionModulus: 0, area: 0, polarMomentOfInertia: 0, torsionalConstant: 0 }; // Return default values
    }
  }, [beamLength, beamHeight, beamWidth, materialProps, startSupportPosition, endSupportPosition, startSupport, endSupport, loads, validateLoads]);


  const checkLoadOverlap = useCallback((newLoad: Load) => {
    if (newLoad.type !== 'distributed' || !newLoad.length) return false;
    return loads.some(existingLoad =>
      existingLoad.type === 'distributed' && existingLoad.length &&
      newLoad.position < (existingLoad.position + existingLoad.length) &&
      (newLoad.position + (newLoad.length ?? 0)) > existingLoad.position
    );
  }, [loads]);

  const addLoad = useCallback(() => {
    const newLoad: Load = {
      id: Math.max(0, ...loads.map(l => l.id)) + 1,
      type: 'point',
      position: 0,
      magnitude: 1, // Set a default non-zero magnitude
    };

    if (checkLoadOverlap(newLoad)) {
      alert("Load overlaps with an existing load!");
      return;
    }

    setLoads([...loads, newLoad]);
  }, [loads, checkLoadOverlap]);

  const updateLoad = useCallback((id: number, field: keyof Load, value: number | string | undefined) => {
    setLoads(prevLoads =>
      prevLoads.map(load => {
        if (load.id !== id) return load;
        // Validate position
        let newValue = value;
        if (field === 'position' && typeof value === 'number') {
          newValue = Math.max(0, Math.min(value, beamLength));
        }
        // Validate magnitude
        if (field === 'magnitude' && typeof value === 'number') {
          if (Math.abs(value) < 0.001) {
            newValue = value > 0 ? 0.001 : -0.001;
          }
        }
        // Validate length for distributed loads
        if (field === 'length' && load.type === 'distributed' && typeof value === 'number') {
          newValue = Math.max(0.1, Math.min(value, beamLength - (load.position || 0)));
        }
        return { ...load, [field]: newValue };
      })
    );
  }, [beamLength]);

  // Generate diagram data with error handling and memoization
  const generateDiagramData = useCallback(() => {
    try {
      if (!validateLoads()) {
        return [];
      }

      const calculator = new BeamCalculator(
        beamLength,
        beamHeight,
        beamWidth,
        materialProps,
        startSupportPosition,
        endSupportPosition,
        startSupport,
        endSupport,
        loads
      );

      // calculate and set reactions:
      const calculatedReactions = calculator.calculateReactions();
      setReactions(calculatedReactions);
      const data = calculator.generateDiagramData();
      setDiagramData(data); // Store the data in state
      setCalculationError(null); // Clear error if successful
      return data; // important
    } catch (error: any) {
      console.error('Error generating diagram data:', error);
      setCalculationError(error.message || 'Calculation error');
      setDiagramData([]);
      setReactions({ reactionA: 0, reactionB: 0, momentA: 0, momentB: 0 });
      return [];
    }
  }, [beamLength, beamHeight, beamWidth, materialProps, startSupportPosition, endSupportPosition, startSupport, endSupport, loads, validateLoads]);


  // UseEffect for generating and update the diagram
  useEffect(() => {

    generateDiagramData();
  }, [generateDiagramData]) // depends on generateDiagramData

  // Add validation functions
  const validateBeamParameters = useCallback(() => {
    if (beamLength <= 0) {
      alert('Beam length must be greater than 0');
      return false;
    }
    if (beamHeight <= 0 || beamWidth <= 0) {
      alert('Beam dimensions must be greater than 0');
      return false;
    }
    if (materialProps.elasticModulus <= 0 || materialProps.shearModulus <= 0) {
      alert('Material properties must be greater than 0');
      return false;
    }
    if (startSupportPosition < 0 || endSupportPosition > beamLength || startSupportPosition >= endSupportPosition) {
      alert('Invalid support positions');
      return false;
    }
    return true;
  }, [beamLength, beamHeight, beamWidth, materialProps, startSupportPosition, endSupportPosition]);

  // Add validation to state setters
  const setBeamLengthWithValidation = (value: number) => {
    if (value > 0) {
      setBeamLength(value);
    }
  };

  const setBeamHeightWithValidation = (value: number) => {
    if (value > 0) {
      setBeamHeight(value);
    }
  };

  const setBeamWidthWithValidation = (value: number) => {
    if (value > 0) {
      setBeamWidth(value);
    }
  };

  const setMaterialPropsWithValidation = (props: MaterialProperties) => {
    if (props.elasticModulus > 0 && props.shearModulus > 0) {
      setMaterialProps(props);
    }
  };

  const maxMoment = diagramData.length > 0 ? Math.max(...diagramData.map(d => Math.abs(d.moment))) : 0;
  const maxShear = diagramData.length > 0 ? Math.max(...diagramData.map(d => Math.abs(d.shear))) : 0;

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-right" />
      {/* Add project management UI */}
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-sm" role="toolbar" aria-label="Project management">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="btn btn-primary"
            aria-label="Save current project"
          >
            <Save className="w-4 h-4 mr-1" aria-hidden="true" />
            Save Project
          </button>
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="btn btn-secondary"
            aria-label="Load existing project"
          >
            <FolderOpen className="w-4 h-4 mr-1" aria-hidden="true" />
            Load Project
          </button>
        </div>
        <div className="flex items-center space-x-4">
          {currentProject && (
            <div className="text-sm text-gray-600 dark:text-gray-300" role="status" aria-live="polite">
              Current Project: {currentProject.name}
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-500" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      
      {/* Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 transition-colors">
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Project Management</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                placeholder="Enter project name"
              />
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Saved Projects</h3>
              <div className="max-h-48 overflow-y-auto border dark:border-gray-600 rounded">
                {projects.map(project => (
                  <div 
                    key={project.id}
                    className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleLoadProject(project)}
                  >
                    <div>
                      <div className="font-medium dark:text-gray-200">{project.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last updated: {new Date(project.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    {isLoadingProject ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="px-4 py-2 border dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center gap-2"
                disabled={isSaving || !projectName.trim()}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" aria-hidden="true" />}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      


      {/* Main Content Grid - Full width for design tab */}
      {activeTab === 'design' ? (
        <div className="w-full">
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors w-full">
            <BeamReinforcementDesign
              width={beamWidth}
              height={beamHeight}
              M_u={maxMoment * 1e6}
              V_u={maxShear * 1e3}
            />
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Input Controls */}
          {activeTab === 'analysis' && (
            <div className="lg:col-span-3 space-y-6">
              {/* Beam Properties Panel */}
              <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors" aria-labelledby="beam-properties-header">
                <h2 id="beam-properties-header" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Box className="w-6 h-6 text-blue-500" />
                  Beam Properties
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Beam Length (m)</label>
                      <input
                        type="number"
                        value={beamLength}
                        onChange={(e) => handleBeamLengthChange(Number(e.target.value))}
                        min="0.1"
                        step="0.1"
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 ${beamLengthError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${!beamLengthError && beamLength > 0 ? 'border-green-500' : ''}`}
                        aria-label="Beam length in meters"
                        aria-invalid={!!beamLengthError}
                        aria-describedby="beam-length-error"
                      />
                      {beamLengthError && <span id="beam-length-error" className="text-xs text-red-500 mt-1">{beamLengthError}</span>}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1">
                          Enter the total length of the beam
                        </div>
                      </div>
                    </div>
                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height (mm)</label>
                      <input
                        type="number"
                        value={beamHeight}
                        onChange={(e) => handleBeamHeightChange(Number(e.target.value))}
                        min="10"
                        step="1"
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 ${beamHeightError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${!beamHeightError && beamHeight >= 10 ? 'border-green-500' : ''}`}
                        placeholder="Height (mm)"
                        aria-label="Beam height in millimeters"
                        aria-invalid={!!beamHeightError}
                        aria-describedby="beam-height-error"
                      />
                      {beamHeightError && <span id="beam-height-error" className="text-xs text-red-500 mt-1">{beamHeightError}</span>}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1">
                          Enter the height of the beam cross-section (mm)
                        </div>
                      </div>
                    </div>
                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Width (mm)</label>
                      <input
                        type="number"
                        value={beamWidth}
                        onChange={(e) => handleBeamWidthChange(Number(e.target.value))}
                        min="10"
                        step="1"
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 ${beamWidthError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${!beamWidthError && beamWidth >= 10 ? 'border-green-500' : ''}`}
                        placeholder="Width (mm)"
                        aria-label="Beam width in millimeters"
                        aria-invalid={!!beamWidthError}
                        aria-describedby="beam-width-error"
                      />
                      {beamWidthError && <span id="beam-width-error" className="text-xs text-red-500 mt-1">{beamWidthError}</span>}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1">
                          Enter the width of the beam cross-section (mm)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

                {/* Support Properties Panel */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors" aria-labelledby="support-properties-header">
                  <h2 id="support-properties-header" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Box className="w-6 h-6 text-green-500" />
                    Support Configuration
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Position</label>
                        <input
                          type="number"
                          value={startSupportPosition}
                          onChange={(e) => handleSupportPositionChange(Number(e.target.value), true)}
                          min="0"
                          max={endSupportPosition}
                          step="0.1"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Start Position"
                          aria-label="Start support position"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Type</label>
                        <select
                          value={startSupport}
                          onChange={(e) => setStartSupport(e.target.value as 'pin' | 'roller' | 'fixed')}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                          aria-label="Start support type"
                        >
                          <option value="pin">Pin</option>
                          <option value="roller">Roller</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Position</label>
                        <input
                          type="number"
                          value={endSupportPosition}
                          onChange={(e) => handleSupportPositionChange(Number(e.target.value), false)}
                          min={startSupportPosition}
                          max={beamLength}
                          step="0.1"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-all"
                          aria-label="End support position"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Type</label>
                        <select
                          value={endSupport}
                          onChange={(e) => setEndSupport(e.target.value as 'pin' | 'roller' | 'fixed')}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-all"
                          aria-label="End support type"
                        >
                          <option value="pin">Pin</option>
                          <option value="roller">Roller</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

              {/* Material Properties Card */}
              <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors border border-gray-200 dark:border-gray-700" aria-labelledby="material-properties-header">
                <h2 id="material-properties-header" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Box className="w-6 h-6 text-purple-500" />
                  Material Properties
                </h2>
                <div className="space-y-4">
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Elastic Modulus (GPa)
                    </label>
                    <input
                      type="number"
                      value={materialProps.elasticModulus}
                      onChange={(e) => setMaterialProps({
                        ...materialProps,
                        elasticModulus: Number(e.target.value)
                      })}
                      min="0.1"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-all"
                      aria-label="Elastic modulus in gigapascals"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1">
                        Enter the elastic modulus (Young's modulus) of the material
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shear Modulus (GPa)
                    </label>
                    <input
                      type="number"
                      value={materialProps.shearModulus}
                      onChange={(e) => setMaterialProps({
                        ...materialProps,
                        shearModulus: Number(e.target.value)
                      })}
                      min="0.1"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      aria-label="Shear modulus in gigapascals"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-gray-800 text-white text-xs rounded px-2 py-1">
                        Enter the shear modulus (modulus of rigidity) of the material
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Right Column - Conditional Content */}
          <div className="lg:col-span-9 space-y-6">
            {activeTab === 'analysis' ? (
              <>
                {/* Loads Section */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors" aria-labelledby="loads-header">
                  <div className="flex items-center justify-between mb-6">
                    <h2 id="loads-header" className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Box className="w-6 h-6 text-red-500" />
                      Applied Loads
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowLoadHelp(!showLoadHelp)}
                        className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                        title="Load Help"
                        aria-label="Show load help"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                      <button
                        onClick={addLoad}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        aria-label="Add new load"
                      >
                        <Plus className="w-5 h-5" />
                        Add New Load
                      </button>
                    </div>
                  </div>
                  {/* Load Help Tooltip */}
                  {showLoadHelp && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                      <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Load Types Guide</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-blue-700">Point Load</p>
                          <p className="text-gray-600 dark:text-gray-300">Concentrated force at a specific point (kN)</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-700">Distributed Load</p>
                          <p className="text-gray-600 dark:text-gray-300">Force spread over a length (kN/m)</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-700">Moment</p>
                          <p className="text-gray-600 dark:text-gray-300">Rotational force (kN⋅m)</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-700">Torsion</p>
                          <p className="text-gray-600 dark:text-gray-300">Twisting force (kN⋅m)</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    {loads.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>No loads applied yet. Click "Add New Load" to start.</p>
                      </div>
                    ) : (
                      loads.map(load => (
                        <div 
                          key={load.id} 
                          className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {/* Load Type with Icon */}
                          <div className="relative group">
                            <select
                              value={load.type}
                              onChange={(e) => updateLoad(load.id, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="point">Point Load</option>
                              <option value="distributed">Distributed Load</option>
                              <option value="moment">Moment</option>
                              <option value="torsion">Torsion</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              {load.type === 'point' && <Box className="w-5 h-5 text-blue-500" />}
                              {load.type === 'distributed' && <BarChart2 className="w-5 h-5 text-green-500" />}
                              {load.type === 'moment' && <Sun className="w-5 h-5 text-purple-500" />}
                              {load.type === 'torsion' && <Ruler className="w-5 h-5 text-orange-500" />}
                            </div>
                          </div>

                          {/* Position with Visual Indicator */}
                          <div className="relative group">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Position (m)</label>
                            <input
                              type="number"
                              value={load.position ?? ''}
                              onChange={(e) => updateLoad(load.id, 'position', Number(e.target.value))}
                              min="0"
                              max={beamLength}
                              step="0.1"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                Position along beam length
                              </div>
                            </div>
                          </div>

                          {/* Magnitude with Unit */}
                          <div className="relative group">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {load.type === 'point' ? 'Force (kN)' :
                               load.type === 'distributed' ? 'Load (kN/m)' :
                               load.type === 'moment' ? 'Moment (kN⋅m)' :
                               'Torque (kN⋅m)'}
                            </label>
                            <input
                              type="number"
                              value={load.magnitude ?? ''}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                if (Math.abs(value) < 0.001) {
                                  // Show warning tooltip
                                  const input = e.target;
                                  input.classList.add('border-red-500');
                                  setTimeout(() => input.classList.remove('border-red-500'), 2000);
                                }
                                updateLoad(load.id, 'magnitude', value);
                              }}
                              step="0.1"
                              min="-1000"
                              max="1000"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                Enter a non-zero value
                              </div>
                            </div>
                          </div>

                          {/* Additional Fields */}
                          <div className="relative group">
                            {load.type === 'distributed' && (
                              <>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Length (m)</label>
                                <input
                                  type="number"
                                  value={load.length ?? ''}
                                  onChange={(e) => updateLoad(load.id, 'length', Number(e.target.value))}
                                  min="0.1"
                                  max={beamLength - (load.position ?? 0)}
                                  step="0.1"
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                              </>
                            )}
                            {load.type === 'moment' && (
                              <>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Direction</label>
                                <select
                                  value={load.momentDirection || 'clockwise'}
                                  onChange={(e) => updateLoad(load.id, 'momentDirection', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                  <option value="clockwise">Clockwise</option>
                                  <option value="anticlockwise">Anti-clockwise</option>
                                </select>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setLoads(loads.filter(l => l.id !== load.id))}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
                              title="Remove Load"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Analysis Charts Section */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors" aria-labelledby="charts-header">
                  <h2 id="charts-header" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Box className="w-6 h-6 text-blue-500" />
                    Analysis Charts
                  </h2>
                  {/* Shear and Moment Diagrams Row */}
                  <div className="grid grid-cols-1 gap-6">
                    {/* Shear Force Diagram */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Shear Force Diagram</h3>
                      <div className="h-96"> {/* Increased height */}
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={diagramData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#374151" : "#e5e7eb"} />
                            <XAxis
                              dataKey="position"
                              label={{ value: 'Position (m)', position: 'bottom', offset: 0, style: { fontSize: '12px', fill: theme === 'dark' ? '#d1d5db' : '#666' } }}
                              tick={{ fill: theme === 'dark' ? '#d1d5db' : '#666', fontSize: '12px' }}
                              axisLine={{ stroke: theme === 'dark' ? '#d1d5db' : '#666', strokeWidth: 1 }}
                            />
                            <YAxis
                              tickFormatter={(value) => `${value.toFixed(1)}`}
                              label={{
                                value: 'Shear Force (kN)',
                                angle: -90,
                                position: 'left',
                                style: { fontSize: '12px', fill: theme === 'dark' ? '#d1d5db' : '#666' }
                              }}
                              tick={{ fill: theme === 'dark' ? '#d1d5db' : '#666' }}
                            />
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', 
                                border: theme === 'dark' ? '1px solid #374151' : '1px solid #ddd', 
                                borderRadius: '4px', 
                                boxShadow: theme === 'dark' ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                                color: theme === 'dark' ? '#d1d5db' : 'inherit'
                              }}
                              formatter={(value: number) => [`${value.toFixed(2)} kN`, 'Shear Force']}
                              labelFormatter={(label) => `Position: ${label} m`}
                            />
                            <Legend
                              verticalAlign="top"
                              height={36}
                              wrapperStyle={{ paddingBottom: '10px' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="shear"
                              stroke={theme === 'dark' ? "#60a5fa" : "#3b82f6"}
                              strokeWidth={2}
                              dot={false}
                              name="Shear Force"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  {/* Bending Moment Diagram */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Bending Moment Diagram</h3>
                    <div className="h-96"> {/* Increased height */}
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={diagramData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#374151" : "#e5e7eb"} />
                          <XAxis
                            dataKey="position"
                            label={{ value: 'Position (m)', position: 'bottom', offset: 0, style: { fontSize: '12px', fill: theme === 'dark' ? '#d1d5db' : '#666' } }}
                            tick={{ fill: theme === 'dark' ? '#d1d5db' : '#666', fontSize: '12px' }}
                            axisLine={{ stroke: theme === 'dark' ? '#d1d5db' : '#666', strokeWidth: 1 }}
                          />

                          <YAxis
                            tickFormatter={(value) => `${value.toFixed(1)}`}
                            label={{
                              value: 'Bending Moment (kN⋅m)',
                              angle: -90,
                              position: 'left',
                              style: { fontSize: '12px', fill: theme === 'dark' ? '#d1d5db' : '#666' }
                            }}
                            tick={{ fill: theme === 'dark' ? '#d1d5db' : '#666' }}
                          />
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', 
                              border: theme === 'dark' ? '1px solid #374151' : '1px solid #ddd', 
                              borderRadius: '4px', 
                              boxShadow: theme === 'dark' ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                              color: theme === 'dark' ? '#d1d5db' : 'inherit'
                            }}
                            formatter={(value: number) => [`${value.toFixed(2)} kN⋅m`, 'Bending Moment']}
                            labelFormatter={(label) => `Position: ${label} m`}
                          />
                          <Legend
                            verticalAlign="top"
                            height={36}
                            wrapperStyle={{ paddingBottom: '10px' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="moment"
                            stroke={theme === 'dark' ? "#f87171" : "#ef4444"}
                            strokeWidth={2}
                            dot={false}
                            name="Bending Moment"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                    {/* Beam Deformation */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Beam Deformation</h3>
                      <div className="h-120">
                        <BeamDeformationVisualization
                          beamLength={beamLength}
                          deflectionData={diagramData}
                          startSupport={startSupport}
                          endSupport={endSupport}
                          startSupportPosition={startSupportPosition}
                          endSupportPosition={endSupportPosition}
                          loads={loads}
                          elasticModulus={materialProps.elasticModulus}
                          momentOfInertia={calculateSectionProperties().momentOfInertia}
                        />
                      </div>
                    </div>

                    {/* Stress Analysis Button */}
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => setShowStressInfo(!showStressInfo)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Info className="w-4 h-4" />
                        {showStressInfo ? 'Hide Stress Analysis' : 'Show Stress Analysis'}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Results Summary */}
                {showStressInfo && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analysis Results</h3>
                      <button
                        className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-sm"
                        onClick={() => {
                          const summary = `Support Reactions:\nSupport A: ${reactions.reactionA.toFixed(2)} kN\nSupport B: ${reactions.reactionB.toFixed(2)} kN\nMoment A: ${reactions.momentA.toFixed(2)} kN·m\nMoment B: ${reactions.momentB.toFixed(2)} kN·m\n\nMaximum Values:\nMax Shear: ${Math.max(...diagramData.map(d => Math.abs(d.shear))).toFixed(2)} kN\nMax Moment: ${Math.max(...diagramData.map(d => Math.abs(d.moment))).toFixed(2)} kN·m\nMax Deflection: ${Math.max(...diagramData.map(d => Math.abs(d.deflection))).toFixed(3)} mm\n\nStress Analysis:\nMax Normal Stress: ${Math.max(...diagramData.map(d => Math.abs(d.normalStress))).toFixed(2)} MPa\nMax Shear Stress: ${Math.max(...diagramData.map(d => Math.abs(d.shearStress))).toFixed(2)} MPa\nMax von Mises: ${Math.max(...diagramData.map(d => Math.abs(d.vonMisesStress))).toFixed(2)} MPa`;
                          navigator.clipboard.writeText(summary);
                          toast.success('Results copied to clipboard!');
                        }}
                        aria-label="Copy analysis results to clipboard"
                      >
                        <ClipboardCheck className="w-4 h-4" /> Copy Results
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl transition-colors">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Support Reactions</h4>
                        <div className="space-y-2 text-sm dark:text-gray-300">
                          <p>Support A: {reactions.reactionA.toFixed(2)} kN</p>
                          <p>Support B: {reactions.reactionB.toFixed(2)} kN</p>
                          <p>Moment A: {reactions.momentA.toFixed(2)} kN·m {reactions.momentA > 0 ? '↻' : '↺'}</p>
                          <p>Moment B: {reactions.momentB.toFixed(2)} kN·m {reactions.momentB > 0 ? '↻' : '↺'}</p>
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl transition-colors">
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Maximum Values</h4>
                        <div className="space-y-2 text-sm dark:text-gray-300">
                          <p>Max Shear: {Math.max(...diagramData.map(d => Math.abs(d.shear))).toFixed(2)} kN</p>
                          <p>Max Moment: {Math.max(...diagramData.map(d => Math.abs(d.moment))).toFixed(2)} kN⋅m</p>
                          <p>Max Deflection: {Math.max(...diagramData.map(d => Math.abs(d.deflection))).toFixed(3)} mm</p>
                        </div>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl transition-colors">
                        <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">Stress Analysis</h4>
                        <div className="space-y-2 text-sm dark:text-gray-300">
                          <p>Max Normal Stress: {Math.max(...diagramData.map(d => Math.abs(d.normalStress))).toFixed(2)} MPa</p>
                          <p>Max Shear Stress: {Math.max(...diagramData.map(d => Math.abs(d.shearStress))).toFixed(2)} MPa</p>
                          <p>Max von Mises: {Math.max(...diagramData.map(d => Math.abs(d.vonMisesStress))).toFixed(2)} MPa</p>
                        </div>
                      </div>

                    </div>

                  </div>

                )}
              </>
            ) : (
              <BeamSectionAnalysis
                width={beamWidth}
                height={beamHeight}
                materialProps={{
                  elasticModulus: materialProps.elasticModulus,
                  shearModulus: materialProps.shearModulus,
                  yieldStrength: 250,
                  ultimateStrength: 400
                }}
                loads={{
                  axialForce: 0,
                  shearForce: Math.max(...diagramData.map(d => Math.abs(d.shear)), 0),
                  bendingMoment: Math.max(...diagramData.map(d => Math.abs(d.moment)), 0),
                  torsion: 0
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Project Management Section (anchor for navigation) */}
      <section id="projects" className="transition-colors">
        {/* ...project management/modal code if needed... */}
      </section>

      {factBanner && (
        <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 px-4 py-2 rounded-xl shadow mb-4 max-w-4xl mx-auto mt-4">
          <span className="text-sm font-medium">💡 Engineering Fact: {factBanner}</span>
          <button
            className="ml-4 text-yellow-700 dark:text-yellow-200 hover:underline text-xs"
            onClick={() => setFactBanner(null)}
            aria-label="Dismiss fact banner"
          >
            Dismiss
          </button>
        </div>
      )}

      {calculationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error:</strong> {calculationError}
        </div>
      )}
    </div>
  );

};

export default BeamAnalysis;