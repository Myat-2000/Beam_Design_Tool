import React, { useState } from 'react';

interface ReductionFactorsPanelProps {
  phi_flexure: number;
  phi_shear: number;
  phi_torsion: number;
  setReductionFactors: (factors: any) => void;
}

const minMax = {
  phi_flexure: { min: 0.65, max: 0.9 },
  phi_shear: { min: 0.75, max: 0.75 },
  phi_torsion: { min: 0.75, max: 0.75 },
};

const ReductionFactorsPanel: React.FC<ReductionFactorsPanelProps> = ({ phi_flexure, phi_shear, phi_torsion, setReductionFactors }) => {
  const [errors, setErrors] = useState<{[key: string]: string | null}>({});
  const validate = (field: string, value: number) => {
    const { min, max } = minMax[field as keyof typeof minMax];
    if (value < min || value > max) {
      return `Value must be between ${min} and ${max}`;
    }
    return null;
  };
  const handleChange = (field: string, value: number) => {
    const error = validate(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    if (!error) setReductionFactors((f: any) => ({ ...f, [field]: value }));
  };
  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">Reduction Factors (φ) - ACI 318-19</h3>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'φ Flexure', field: 'phi_flexure', value: phi_flexure, tooltip: 'Flexural strength reduction factor (0.65-0.9)' },
          { label: 'φ Shear', field: 'phi_shear', value: phi_shear, tooltip: 'Shear strength reduction factor (0.75)' },
          { label: 'φ Torsion', field: 'phi_torsion', value: phi_torsion, tooltip: 'Torsional strength reduction factor (0.75)' },
        ].map(({ label, field, value, tooltip }) => (
          <div className="relative group" key={field}>
            <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">{label}</label>
            <input
              type="number"
              value={value}
              onChange={e => handleChange(field, Number(e.target.value))}
              min={minMax[field as keyof typeof minMax].min}
              max={minMax[field as keyof typeof minMax].max}
              step="0.01"
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 dark:text-blue-100 ${errors[field] ? 'border-blue-500' : 'border-gray-300 dark:border-blue-600'} ${!errors[field] && value >= minMax[field as keyof typeof minMax].min && value <= minMax[field as keyof typeof minMax].max ? 'border-green-500' : ''}`}
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
  );
};

export default ReductionFactorsPanel; 