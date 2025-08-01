import React, { useState } from 'react';

interface ReinforcementDetailsPanelProps {
  concreteStrength: number;
  steelYieldStrength: number;
  cover: number;
  stirrupSpacing: number;
  tensionBarDiameter: number;
  tensionBarCount: number;
  tensionBarLayers: number;
  barsPerLayer: number;
  compressionBarDiameter: number;
  compressionBarCount: number;
  compressionBarLayers: number;
  compressionBarsPerLayer: number;
  stirrupDiameter: number;
  setReinforcementDetails: (details: any) => void;
}

const minValues = {
  concreteStrength: 10,
  steelYieldStrength: 10,
  cover: 10,
  stirrupSpacing: 10,
  tensionBarDiameter: 6,
  tensionBarCount: 1,
  tensionBarLayers: 1,
  barsPerLayer: 1,
  compressionBarDiameter: 6,
  compressionBarCount: 0,
  compressionBarLayers: 1,
  compressionBarsPerLayer: 1,
  stirrupDiameter: 6,
};

const ReinforcementDetailsPanel: React.FC<ReinforcementDetailsPanelProps> = (props) => {
  const [errors, setErrors] = useState<{[key: string]: string | null}>({});
  const validate = (field: string, value: number) => {
    if (value < minValues[field as keyof typeof minValues]) {
      return `Minimum value is ${minValues[field as keyof typeof minValues]}`;
    }
    return null;
  };
  const handleChange = (field: string, value: number) => {
    const error = validate(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    if (!error) props.setReinforcementDetails((d: any) => ({ ...d, [field]: value }));
  };
  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">Reinforcement Details</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Concrete f&apos;c (MPa)", field: 'concreteStrength', value: props.concreteStrength, tooltip: 'Concrete compressive strength (MPa)' },
          { label: 'Steel fy (MPa)', field: 'steelYieldStrength', value: props.steelYieldStrength, tooltip: 'Steel yield strength (MPa)' },
          { label: 'Cover (mm)', field: 'cover', value: props.cover, tooltip: 'Concrete cover (mm)' },
          { label: 'Stirrup Spacing (mm)', field: 'stirrupSpacing', value: props.stirrupSpacing, tooltip: 'Stirrup spacing (mm)' },
        ].map(({ label, field, value, tooltip }) => (
          <div className="relative group" key={field}>
            <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">{label}</label>
            <input
              type="number"
              value={value}
              onChange={e => handleChange(field, Number(e.target.value))}
              min={minValues[field as keyof typeof minValues]}
              step="1"
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 dark:text-blue-100 ${errors[field] ? 'border-blue-500' : 'border-gray-300 dark:border-blue-600'} ${!errors[field] && value >= minValues[field as keyof typeof minValues] ? 'border-green-500' : ''}`}
              aria-label={label}
              aria-invalid={!!errors[field]}
              aria-describedby={`${field}-error`}
            />
            {errors[field] && <span id={`${field}-error`} className="text-xs text-blue-500 mt-1">{errors[field]}</span>}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-blue-800 dark:bg-blue-700 text-white text-xs rounded px-2 py-1">{tooltip}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Tension Reinforcement */}
      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700 mb-3">
        <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">Tension Reinforcement (Bottom)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Bar Diameter (mm)', field: 'tensionBarDiameter', value: props.tensionBarDiameter, tooltip: 'Tension bar diameter (mm)' },
            { label: 'Number of Bars', field: 'tensionBarCount', value: props.tensionBarCount, tooltip: 'Number of tension bars' },
            { label: 'Number of Layers', field: 'tensionBarLayers', value: props.tensionBarLayers, tooltip: 'Number of tension bar layers' },
            { label: 'Bars per Layer', field: 'barsPerLayer', value: props.barsPerLayer, tooltip: 'Bars per tension layer' },
          ].map(({ label, field, value, tooltip }) => (
            <div className="relative group" key={field}>
              <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">{label}</label>
              <input
                type="number"
                value={value}
                onChange={e => handleChange(field, Number(e.target.value))}
                min={minValues[field as keyof typeof minValues]}
                step="1"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 dark:text-blue-100 ${errors[field] ? 'border-blue-500' : 'border-gray-300 dark:border-blue-600'} ${!errors[field] && value >= minValues[field as keyof typeof minValues] ? 'border-green-500' : ''}`}
                aria-label={label}
                aria-invalid={!!errors[field]}
                aria-describedby={`${field}-error`}
              />
              {errors[field] && <span id={`${field}-error`} className="text-xs text-blue-500 mt-1">{errors[field]}</span>}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-blue-800 dark:bg-blue-700 text-white text-xs rounded px-2 py-1">{tooltip}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Compression Reinforcement */}
      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700 mb-3">
        <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">Compression Reinforcement (Top)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Bar Diameter (mm)', field: 'compressionBarDiameter', value: props.compressionBarDiameter, tooltip: 'Compression bar diameter (mm)' },
            { label: 'Number of Bars', field: 'compressionBarCount', value: props.compressionBarCount, tooltip: 'Number of compression bars' },
            { label: 'Number of Layers', field: 'compressionBarLayers', value: props.compressionBarLayers, tooltip: 'Number of compression bar layers' },
            { label: 'Bars per Layer', field: 'compressionBarsPerLayer', value: props.compressionBarsPerLayer, tooltip: 'Bars per compression layer' },
          ].map(({ label, field, value, tooltip }) => (
            <div className="relative group" key={field}>
              <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">{label}</label>
              <input
                type="number"
                value={value}
                onChange={e => handleChange(field, Number(e.target.value))}
                min={minValues[field as keyof typeof minValues]}
                step="1"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 dark:text-blue-100 ${errors[field] ? 'border-blue-500' : 'border-gray-300 dark:border-blue-600'} ${!errors[field] && value >= minValues[field as keyof typeof minValues] ? 'border-green-500' : ''}`}
                aria-label={label}
                aria-invalid={!!errors[field]}
                aria-describedby={`${field}-error`}
              />
              {errors[field] && <span id={`${field}-error`} className="text-xs text-blue-500 mt-1">{errors[field]}</span>}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-blue-800 dark:bg-blue-700 text-white text-xs rounded px-2 py-1">{tooltip}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Shear Reinforcement */}
      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700">
        <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">Shear Reinforcement (Stirrups)</h4>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {[
            { label: 'Stirrup Diameter (mm)', field: 'stirrupDiameter', value: props.stirrupDiameter, tooltip: 'Stirrup diameter (mm)' },
            { label: 'Spacing (mm)', field: 'stirrupSpacing', value: props.stirrupSpacing, tooltip: 'Stirrup spacing (mm)' },
          ].map(({ label, field, value, tooltip }) => (
            <div className="relative group" key={field}>
              <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">{label}</label>
              <input
                type="number"
                value={value}
                onChange={e => handleChange(field, Number(e.target.value))}
                min={minValues[field as keyof typeof minValues]}
                step="1"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 dark:text-blue-100 ${errors[field] ? 'border-blue-500' : 'border-gray-300 dark:border-blue-600'} ${!errors[field] && value >= minValues[field as keyof typeof minValues] ? 'border-green-500' : ''}`}
                aria-label={label}
                aria-invalid={!!errors[field]}
                aria-describedby={`${field}-error`}
              />
              {errors[field] && <span id={`${field}-error`} className="text-xs text-blue-500 mt-1">{errors[field]}</span>}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-blue-800 dark:bg-blue-700 text-white text-xs rounded px-2 py-1">{tooltip}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReinforcementDetailsPanel;