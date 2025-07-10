import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Info, ClipboardCheck } from 'lucide-react';
import BeamDeformationVisualization from './BeamDeformationVisualization';
import toast from 'react-hot-toast';
import { SupportType } from './BeamDeformationVisualization';

interface BeamDiagramPanelProps {
  diagramData: any[];
  theme: string;
  beamLength: number;
  materialProps: { elasticModulus: number; shearModulus: number };
  startSupport: SupportType;
  endSupport: SupportType;
  startSupportPosition: number;
  endSupportPosition: number;
  loads: any[];
  reactions: any;
  showStressInfo: boolean;
  setShowStressInfo: (show: boolean) => void;
  calculateSectionProperties: () => any;
}

const BeamDiagramPanel: React.FC<BeamDiagramPanelProps> = ({
  diagramData,
  theme,
  beamLength,
  materialProps,
  startSupport,
  endSupport,
  startSupportPosition,
  endSupportPosition,
  loads,
  reactions,
  showStressInfo,
  setShowStressInfo,
  calculateSectionProperties,
}) => {
  return (
    <div className="space-y-6">
      {/* Shear Force Diagram */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Shear Force Diagram</h3>
        <div className="h-96">
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
              <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
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
        <div className="h-96">
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
              <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
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
    </div>
  );
};

export default BeamDiagramPanel; 