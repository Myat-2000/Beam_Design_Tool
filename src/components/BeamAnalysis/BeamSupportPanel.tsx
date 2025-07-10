import React from 'react';

interface BeamSupportPanelProps {
  startSupport: 'pin' | 'roller' | 'fixed' | 'free';
  endSupport: 'pin' | 'roller' | 'fixed' | 'free';
  startSupportPosition: number;
  endSupportPosition: number;
  handleSupportPositionChange: (position: number, isStart: boolean) => void;
  setStartSupport: (type: 'pin' | 'roller' | 'fixed' | 'free') => void;
  setEndSupport: (type: 'pin' | 'roller' | 'fixed' | 'free') => void;
  beamLength: number;
}

const supportOptions = [
  { value: 'pin', label: 'Pin' },
  { value: 'roller', label: 'Roller' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'free', label: 'Free' },
];

const BeamSupportPanel: React.FC<BeamSupportPanelProps> = ({
  startSupport,
  endSupport,
  startSupportPosition,
  endSupportPosition,
  handleSupportPositionChange,
  setStartSupport,
  setEndSupport,
  beamLength,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Supports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">Start Support Type</label>
          <select
            value={startSupport}
            onChange={e => setStartSupport(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
          >
            {supportOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">End Support Type</label>
          <select
            value={endSupport}
            onChange={e => setEndSupport(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
          >
            {supportOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">Start Support Position (m)</label>
          <input
            type="number"
            value={startSupportPosition}
            min={0}
            max={endSupportPosition - 0.1}
            step={0.01}
            onChange={e => handleSupportPositionChange(Number(e.target.value), true)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">End Support Position (m)</label>
          <input
            type="number"
            value={endSupportPosition}
            min={startSupportPosition + 0.1}
            max={beamLength}
            step={0.01}
            onChange={e => handleSupportPositionChange(Number(e.target.value), false)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default BeamSupportPanel; 