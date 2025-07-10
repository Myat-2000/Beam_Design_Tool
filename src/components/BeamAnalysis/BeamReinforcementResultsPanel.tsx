import React from 'react';
import BeamCrossSection from './BeamCrossSection';
import { Calculator } from 'lucide-react';

interface BeamReinforcementResultsPanelProps {
  input: any;
  results: any;
  torsionResult: any;
  stirrupDia: any;
  useSideBars: any;
  sideBarDia: any;
  showSteps: any;
  setShowSteps: any;
}

const BeamReinforcementResultsPanel: React.FC<BeamReinforcementResultsPanelProps> = ({
  input,
  results,
  torsionResult,
  stirrupDia,
  useSideBars,
  sideBarDia,
  showSteps,
  setShowSteps,
}) => {
  if (!results) return null;
  return (
    <>
      <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-2xl mt-4 transition-colors flex flex-col items-center w-full">
        <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">Cross-Section Visualization</h3>
        <div className="w-full flex justify-center items-center" style={{ minHeight: 480 }}>
          <BeamCrossSection
            width={input.b}
            height={input.h}
            cover={input.cover}
            bar_dia={results.bar_dia}
            n_bars={results.n_bars}
            stirrup_dia={stirrupDia}
            comp_bar_dia={results.is_doubly ? results.comp.bar_dia : undefined}
            n_comp_bars={results.is_doubly ? results.comp.n_bars : undefined}
            stirrup_positions={[600, 1400, 1800]}
            n_layers={results.n_layers}
            bars_per_layer={results.bars_per_layer}
            n_comp_layers={results.is_doubly ? results.comp.n_comp_layers : undefined}
            comp_bars_per_layer={results.is_doubly ? results.comp.comp_bars_per_layer : undefined}
            show_torsion_bars={!!torsionResult}
            n_torsion_legs={torsionResult ? torsionResult.n_legs : 0}
            torsion_bar_dia={16}
            useSideBars={useSideBars}
            sideBarDia={useSideBars ? sideBarDia : undefined}
          />
        </div>
        {/* Legend and Explanation */}
        {/* ... (copy legend/explanation JSX here) ... */}
      </div>
      {/* Grouped Results Sections (summary, flexure, shear, torsion, hooks) */}
      {/* ... (copy grouped results JSX here) ... */}
      {/* Calculation Steps Section */}
      {showSteps && results && (
        <div className="bg-white dark:bg-gray-900 border border-blue-400 dark:border-blue-700 rounded-xl p-4 shadow flex flex-col mt-6">
          <h4 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
            <Calculator className="w-5 h-5" /> Calculation Steps with Equations
          </h4>
          <div className="space-y-6">
            {/* ... (copy calculation steps JSX here) ... */}
          </div>
        </div>
      )}
    </>
  );
};

export default BeamReinforcementResultsPanel; 