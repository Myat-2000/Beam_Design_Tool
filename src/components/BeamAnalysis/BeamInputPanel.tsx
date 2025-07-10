import React from 'react';
import { Box } from 'lucide-react';

interface BeamInputPanelProps {
  beamLength: number;
  beamHeight: number;
  beamWidth: number;
  materialProps: { elasticModulus: number; shearModulus: number };
  startSupportPosition: number;
  endSupportPosition: number;
  startSupport: 'pin' | 'roller' | 'fixed' | 'free';
  endSupport: 'pin' | 'roller' | 'fixed' | 'free';
  beamLengthError: string | null;
  beamHeightError: string | null;
  beamWidthError: string | null;
  handleBeamLengthChange: (value: number) => void;
  handleBeamHeightChange: (value: number) => void;
  handleBeamWidthChange: (value: number) => void;
  handleSupportPositionChange: (value: number, isStart: boolean) => void;
  setStartSupport: (type: 'pin' | 'roller' | 'fixed' | 'free') => void;
  setEndSupport: (type: 'pin' | 'roller' | 'fixed' | 'free') => void;
  setMaterialProps: (props: { elasticModulus: number; shearModulus: number }) => void;
}

const BeamInputPanel: React.FC<BeamInputPanelProps> = ({
  beamLength,
  beamHeight,
  beamWidth,
  materialProps,
  startSupportPosition,
  endSupportPosition,
  startSupport,
  endSupport,
  beamLengthError,
  beamHeightError,
  beamWidthError,
  handleBeamLengthChange,
  handleBeamHeightChange,
  handleBeamWidthChange,
  handleSupportPositionChange,
  setStartSupport,
  setEndSupport,
  setMaterialProps,
}) => (
  <div className="space-y-6">
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
        </div>
      </div>
    </section>
  </div>
);

export default BeamInputPanel; 