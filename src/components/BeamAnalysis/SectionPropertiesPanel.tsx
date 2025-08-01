import React from 'react';

interface SectionPropertiesPanelProps {
  width: number;
  height: number;
  area: number;
  momentOfInertiaX: number;
  momentOfInertiaY: number;
  sectionModulusX: number;
  sectionModulusY: number;
  radiusOfGyrationX: number;
  radiusOfGyrationY: number;
  plasticModulusX: number;
  plasticModulusY: number;
}

const SectionPropertiesPanel: React.FC<SectionPropertiesPanelProps> = ({
  width,
  height,
  area,
  momentOfInertiaX,
  momentOfInertiaY,
  sectionModulusX,
  sectionModulusY,
  radiusOfGyrationX,
  radiusOfGyrationY,
  plasticModulusX,
  plasticModulusY
}) => (
  <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
    <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
      Section Properties (Calculated)
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div>
        <label className="text-xs font-medium text-purple-700 dark:text-purple-300">Width (mm)</label>
        <input type="number" value={width} disabled className="w-full px-2 py-1 text-sm rounded border border-purple-300 dark:border-purple-600 dark:bg-purple-600/20 dark:text-purple-100 bg-gray-100" />
      </div>
      <div>
        <label className="text-xs font-medium text-purple-700 dark:text-purple-300">Height (mm)</label>
        <input type="number" value={height} disabled className="w-full px-2 py-1 text-sm rounded border border-purple-300 dark:border-purple-600 dark:bg-purple-600/20 dark:text-purple-100 bg-gray-100" />
      </div>
      <div>
        <label className="text-xs font-medium text-purple-700 dark:text-purple-300">Area (m²)</label>
        <input type="text" value={(area / 1000000).toFixed(4)} disabled className="w-full px-2 py-1 text-sm rounded border border-purple-300 dark:border-purple-600 dark:bg-purple-600/20 dark:text-purple-100 bg-gray-100" />
      </div>
      <div>
        <label className="text-xs font-medium text-purple-700 dark:text-purple-300">Ix (m⁴)</label>
        <input type="text" value={(momentOfInertiaX / 1e12).toFixed(6)} disabled className="w-full px-2 py-1 text-sm rounded border border-purple-300 dark:border-purple-600 dark:bg-purple-600/20 dark:text-purple-100 bg-gray-100" />
      </div>
    </div>
  </div>
);

export default SectionPropertiesPanel; 