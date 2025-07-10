import React from 'react';
import { MaterialProperties } from './types';

interface BeamPropertiesPanelProps {
  beamLength: number;
  beamHeight: number;
  beamWidth: number;
  materialProps: MaterialProperties;
  beamLengthError: string | null;
  beamHeightError: string | null;
  beamWidthError: string | null;
  handleBeamLengthChange: (value: number) => void;
  handleBeamHeightChange: (value: number) => void;
  handleBeamWidthChange: (value: number) => void;
  setMaterialProps: (props: MaterialProperties) => void;
}

const BeamPropertiesPanel: React.FC<BeamPropertiesPanelProps> = ({
  beamLength,
  beamHeight,
  beamWidth,
  materialProps,
  beamLengthError,
  beamHeightError,
  beamWidthError,
  handleBeamLengthChange,
  handleBeamHeightChange,
  handleBeamWidthChange,
  setMaterialProps,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Beam Properties</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">Length (m)</label>
          <input
            type="number"
            value={beamLength}
            onChange={e => handleBeamLengthChange(Number(e.target.value))}
            min={0.1}
            step={0.01}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
          />
          {beamLengthError && <div className="text-red-500 text-xs mt-1">{beamLengthError}</div>}
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">Height (mm)</label>
          <input
            type="number"
            value={beamHeight}
            onChange={e => handleBeamHeightChange(Number(e.target.value))}
            min={10}
            step={1}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
          />
          {beamHeightError && <div className="text-red-500 text-xs mt-1">{beamHeightError}</div>}
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">Width (mm)</label>
          <input
            type="number"
            value={beamWidth}
            onChange={e => handleBeamWidthChange(Number(e.target.value))}
            min={10}
            step={1}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
          />
          {beamWidthError && <div className="text-red-500 text-xs mt-1">{beamWidthError}</div>}
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">Elastic Modulus (MPa)</label>
          <input
            type="number"
            value={materialProps.elasticModulus}
            onChange={e => setMaterialProps({ ...materialProps, elasticModulus: Number(e.target.value) })}
            min={1}
            step={1}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">Shear Modulus (MPa)</label>
          <input
            type="number"
            value={materialProps.shearModulus}
            onChange={e => setMaterialProps({ ...materialProps, shearModulus: Number(e.target.value) })}
            min={1}
            step={1}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default BeamPropertiesPanel; 