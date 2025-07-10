// BeamDeformationVisualization.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

type SupportType = 'pin' | 'roller' | 'fixed' | 'free';

interface Load {
  id: number;
  type: 'point' | 'distributed' | 'moment' | 'torsion';
  position: number;
  magnitude: number;
  length?: number;
  momentDirection?: 'clockwise' | 'anticlockwise';
}

interface DiagramPoint {
  position: number;
  deflection: number;
  scaledDeflection: number;
  beamLine: number;
}

interface BeamDeformationVisualizationProps {
  beamLength: number;
  deflectionData: { position: number; deflection: number }[];
  startSupport: SupportType;
  endSupport: SupportType;
  startSupportPosition: number;
  endSupportPosition: number;
  loads: Load[];
  elasticModulus: number;
  momentOfInertia: number;
}

const BeamDeformationVisualization: React.FC<BeamDeformationVisualizationProps> = ({
  beamLength,
  deflectionData = [],
  startSupport,
  endSupport,
  startSupportPosition = 0,
  endSupportPosition,
  loads = [],
  elasticModulus = 0,
  momentOfInertia = 0,
}) => {
  const [scaledDeflectionData, setScaledDeflectionData] = useState<DiagramPoint[]>([]);
  const [activeTab, setActiveTab] = useState<'graph' | 'diagram'>('graph');

  useEffect(() => {
    if (deflectionData.length === 0) return;

    const maxDefl = Math.max(...deflectionData.map((d) => Math.abs(d.deflection)));
    const reasonableMaxDeflection = beamLength / 20;
    const scaleFactor = maxDefl === 0 ? 1 : Math.min(50 / maxDefl, 50 / reasonableMaxDeflection);

    const scaled = deflectionData.map((point) => ({
      position: point.position,
      deflection: point.deflection,
      scaledDeflection: -point.deflection * scaleFactor,
      beamLine: 0,
    }));

    setScaledDeflectionData(scaled);
  }, [deflectionData, beamLength]);

  const maxDefl = deflectionData.length > 0 ? Math.max(...deflectionData.map((d) => Math.abs(d.deflection))) : 0;
  const maxDeflPoint = deflectionData.find((d) => Math.abs(d.deflection) === maxDefl);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="font-medium dark:text-gray-200">Position: {payload[0].payload.position.toFixed(2)} m</p>
          <p className="text-blue-600 dark:text-blue-400">Deflection: {payload[0].payload.deflection.toFixed(3)} mm</p>
        </div>
      );
    }
    return null;
  };

  const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
        active
          ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t border-x border-gray-200 dark:border-gray-700'
          : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  const renderBeamDiagram = () => {
    // Polyline points for deflected shape
    const points = scaledDeflectionData.map(point => `${(point.position / beamLength) * 1000},${250 + point.scaledDeflection}`).join(' ');
    
    // Check if it's a cantilever beam
    const isCantilever = (startSupport === 'fixed' && endSupport === 'free') || 
                        (startSupport === 'free' && endSupport === 'fixed');
    const fixedEnd = startSupport === 'fixed' ? 'start' : 'end';
    
    return (
      <svg className="w-full h-[500px] md:h-[600px] dark:text-gray-200" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
        {/* Background grid with improved styling */}
        <g className="opacity-30">
          {Array.from({ length: 21 }).map((_, i) => (
            <line
              key={`grid-v-${i}`}
              x1={i * 50}
              y1="0"
              x2={i * 50}
              y2="500"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-gray-400 dark:text-gray-600"
            />
          ))}
          {Array.from({ length: 13 }).map((_, i) => (
            <line
              key={`grid-h-${i}`}
              x1="0"
              y1={i * 40}
              x2="1000"
              y2={i * 40}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-gray-400 dark:text-gray-600"
            />
          ))}
        </g>
  
        {/* Original beam position with subtle styling */}
        <line
          x1={(startSupportPosition / beamLength) * 1000}
          y1="250"
          x2={(endSupportPosition / beamLength) * 1000}
          y2="250"
          stroke="currentColor"
          className="text-gray-300 dark:text-gray-600"
          strokeWidth="6"
          strokeDasharray="8 4"
          strokeLinecap="round"
        />
  
        {/* Deflected beam polyline */}
        <polyline
          points={points}
          fill="none"
          stroke="#2563eb"
          strokeWidth="4"
          className="stroke-blue-600 dark:stroke-blue-400 transition-all duration-300"
        />
  
        {/* Enhanced supports with shadow and depth */}
        {[
          { type: startSupport, position: startSupportPosition },
          { type: endSupport, position: endSupportPosition },
        ].map((support, index) => (
          <g key={`support-${index}`} transform={`translate(${(support.position / beamLength) * 1000}, 250)`}>
            {support.type === 'fixed' ? (
              <g className="transform transition hover:scale-110">
                <rect x="-12" y="-80" width="24" height="140" className="fill-slate-700 dark:fill-slate-500" rx="3" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <line
                    key={`fixed-line-${i}`}
                    x1="-8"
                    y1={-70 + i * 20}
                    x2="8"
                    y2={-70 + i * 20}
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="2"
                  />
                ))}
                <path d="M-12 -80 L12 -80 L0 -110" className="fill-slate-700 dark:fill-slate-500" />
              </g>
            ) : support.type !== 'free' ? (
              <g className="transform transition hover:scale-105">
                <path
                  d="M-30,50 L30,50 L0,-30"
                  className="fill-slate-700 dark:fill-slate-500 stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="2"
                />
                <circle cx="0" cy="0" r="8" className="fill-slate-100 dark:fill-slate-800 stroke-slate-700 dark:stroke-slate-500" strokeWidth="2" />
                {support.type === 'roller' && (
                  <g transform="translate(0, 55)">
                    <circle cx="-18" cy="0" r="6" className="fill-slate-700 dark:fill-slate-500" />
                    <circle cx="0" cy="0" r="6" className="fill-slate-700 dark:fill-slate-500" />
                    <circle cx="18" cy="0" r="6" className="fill-slate-700 dark:fill-slate-500" />
                  </g>
                )}
              </g>
            ) : null}
          </g>
        ))}
  
        {/* Enhanced loads with animations */}
        {loads.map((load, index) => {
          const x = (load.position / beamLength) * 1000;
          const loadLength = load.length || 0;
  
          return (
            <g key={`load-${index}`} transform={`translate(${x}, 250)`} className="transition-all duration-300">
              {load.type === 'point' && (
                <g className="hover:drop-shadow-lg">
                  <line x1="0" y1="-80" x2="0" y2="0" className="stroke-red-600 dark:stroke-red-500" strokeWidth="4" strokeLinecap="round">
                    <animate attributeName="y1" values="-80;-70;-80" dur="1s" repeatCount="indefinite" />
                  </line>
                  <polygon points="-12,-60 12,-60 0,-80" className="fill-red-600 dark:fill-red-500" />
                  <text 
                    x="0" 
                    y="-100" 
                    textAnchor="middle" 
                    className="fill-red-600 dark:fill-red-500 text-sm font-bold drop-shadow-sm dark:hidden"
                    filter="url(#text-background)"
                  >
                    {load.magnitude} kN
                  </text>
                  <text 
                    x="0" 
                    y="-100" 
                    textAnchor="middle" 
                    className="fill-red-600 dark:fill-red-500 text-sm font-bold drop-shadow-sm hidden dark:block"
                    filter="url(#text-background-dark)"
                  >
                    {load.magnitude} kN
                  </text>
                </g>
              )}
              
              {load.type === 'distributed' && load.length && (
                <g className="hover:drop-shadow-lg">
                  <line x1="0" y1="-60" x2={(loadLength / beamLength) * 1000} y2="-60" className="stroke-red-600 dark:stroke-red-500" strokeWidth="4" />
                  {Array.from({ length: Math.ceil(loadLength / beamLength * 1000 / 20) }).map((_, i) => (
                    <line
                      key={`dist-line-${i}`}
                      x1={i * 20}
                      y1="-60"
                      x2={i * 20}
                      y2="0"
                      className="stroke-red-600 dark:stroke-red-500"
                      strokeWidth="2"
                    />
                  ))}
                  <text 
                    x={(loadLength / beamLength) * 500} 
                    y="-80" 
                    textAnchor="middle" 
                    className="fill-red-600 dark:fill-red-500 text-sm font-bold drop-shadow-sm dark:hidden"
                    filter="url(#text-background)"
                  >
                    {load.magnitude} kN/m
                  </text>
                  <text 
                    x={(loadLength / beamLength) * 500} 
                    y="-80" 
                    textAnchor="middle" 
                    className="fill-red-600 dark:fill-red-500 text-sm font-bold drop-shadow-sm hidden dark:block"
                    filter="url(#text-background-dark)"
                  >
                    {load.magnitude} kN/m
                  </text>
                </g>
              )}
              
              {load.type === 'moment' && (
                <g className="hover:drop-shadow-lg">
                  <path
                    d={`M0,-40 A20,20 0 0 ${load.momentDirection === 'clockwise' ? '1' : '0'} 0,-80`}
                    fill="none"
                    className="stroke-red-600 dark:stroke-red-500"
                    strokeWidth="3"
                  />
                  <polygon
                    points={load.momentDirection === 'clockwise' ? "0,-80 -8,-72 0,-64" : "0,-80 8,-72 0,-64"}
                    className="fill-red-600 dark:fill-red-500"
                  />
                  <text 
                    x="0" 
                    y="-100" 
                    textAnchor="middle" 
                    className="fill-red-600 dark:fill-red-500 text-sm font-bold drop-shadow-sm dark:hidden"
                    filter="url(#text-background)"
                  >
                    {load.magnitude} kN·m
                  </text>
                  <text 
                    x="0" 
                    y="-100" 
                    textAnchor="middle" 
                    className="fill-red-600 dark:fill-red-500 text-sm font-bold drop-shadow-sm hidden dark:block"
                    filter="url(#text-background-dark)"
                  >
                    {load.magnitude} kN·m
                  </text>
                </g>
              )}
            </g>
          );
        })}
  
        {/* Text background filter */}
        <filter id="text-background" x="-0.2" y="-0.2" width="1.4" height="1.4">
          <feFlood floodColor="white" floodOpacity="0.8" className="dark:flood-color-gray-800" />
          <feComposite in="SourceGraphic" />
        </filter>
        <filter id="text-background-dark" x="-0.2" y="-0.2" width="1.4" height="1.4" className="hidden dark:block">
          <feFlood floodColor="#1f2937" floodOpacity="0.8" />
          <feComposite in="SourceGraphic" />
        </filter>
      </svg>
    );
  };

  const renderSupport = (type: SupportType, position: number, isStart: boolean) => {
    if (type === 'free') return null; // Don't render anything for free supports

    const x = position * 1000;
    const y = 250;
    const supportSize = 15;

    switch (type) {
      case 'pin':
        return (
          <g transform={`translate(${x}, ${y})`}>
            <circle cx="0" cy="0" r={supportSize} fill="none" stroke="#374151" strokeWidth="2" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#374151" strokeWidth="2" />
          </g>
        );
      case 'roller':
        return (
          <g transform={`translate(${x}, ${y})`}>
            <circle cx="0" cy="0" r={supportSize} fill="none" stroke="#374151" strokeWidth="2" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#374151" strokeWidth="2" />
            <line x1="-8" y1="5" x2="8" y2="5" stroke="#374151" strokeWidth="2" />
          </g>
        );
      case 'fixed':
        return (
          <g transform={`translate(${x}, ${y})`}>
            <rect x="-10" y="-20" width="20" height="20" fill="#374151" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl transition-colors duration-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Beam Deformation Analysis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-950">
            <p className="text-sm text-gray-500 dark:text-gray-400">Maximum Deflection</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{maxDefl.toFixed(3)} mm</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Absolute value</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-950">
            <p className="text-sm text-gray-500 dark:text-gray-400">Critical Position</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {maxDeflPoint?.position.toFixed(2) ?? 'N/A'} m
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Location of max deflection</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-950">
            <p className="text-sm text-gray-500 dark:text-gray-400">Elastic Modulus</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{elasticModulus.toFixed(0)} MPa</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Material property</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-950">
            <p className="text-sm text-gray-500 dark:text-gray-400">Moment of Inertia</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{momentOfInertia.toFixed(6)} m⁴</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Cross-sectional property</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <TabButton label="Graph View" active={activeTab === 'graph'} onClick={() => setActiveTab('graph')} />
        <TabButton label="Diagram View" active={activeTab === 'diagram'} onClick={() => setActiveTab('diagram')} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-950 p-6 transition-colors duration-200">
        <div className="h-96">
          {activeTab === 'graph' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={scaledDeflectionData}
                margin={{ top: 20, right: 30, bottom: 20, left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="text-gray-300 dark:text-gray-700" stroke="currentColor" />
                <XAxis
                  dataKey="position"
                  type="number"
                  domain={[0, beamLength]}
                  label={{ value: 'Position (m)', position: 'bottom', className: 'fill-gray-700 dark:fill-gray-300' }}
                  tickFormatter={(value) => value.toFixed(1)}
                  stroke="currentColor"
                  className="text-gray-700 dark:text-gray-300"
                />
                <YAxis
                  label={{ value: 'Deflection (mm)', angle: -90, position: 'insideLeft', className: 'fill-gray-700 dark:fill-gray-300' }}
                  type="number"
                  tickFormatter={(value) => value.toFixed(2)}
                  stroke="currentColor"
                  className="text-gray-700 dark:text-gray-300"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" wrapperStyle={{ color: 'var(--tw-text-opacity)' }} />
                <Line
                  type="monotone"
                  dataKey="beamLine"
                  name="Original Position"
                  stroke="currentColor"
                  className="text-gray-400 dark:text-gray-600"
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="scaledDeflection"
                  name="Deflection"
                  stroke="#2563eb"
                  className="dark:stroke-blue-400"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            renderBeamDiagram()
          )}
        </div>
      </div>
    </div>
  );
};

export default BeamDeformationVisualization;