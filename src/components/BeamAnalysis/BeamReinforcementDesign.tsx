import React, { useState, useEffect } from 'react';
import {
  calcEffectiveDepth,
  flexuralDesign,
  selectBars,
  calcActualEffectiveDepth,
  shearDesign,
  calculateMomentCapacity,
  BeamReinforcementInput,
  E_s,
  torsionDesign,
  TorsionDesignResult,
} from './BeamReinforcementCalculations';
import { BarChart2, Settings, Ruler, Zap, Shield, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import BeamCrossSection from './BeamCrossSection';
import BeamSideView from './BeamSideView';
import BeamReinforcementInputPanel from './BeamReinforcementInputPanel';
import BeamReinforcementResultsPanel from './BeamReinforcementResultsPanel';
import { useBeamReinforcementDesign } from './useBeamReinforcementDesign';

interface BeamReinforcementDesignProps {
  width?: number;
  height?: number;
  M_u?: number;
  V_u?: number;
}

const defaultInput: BeamReinforcementInput = {
  f_c: 28, // ACI 318-19 Section 19.2.1.1 - Standard concrete strength
  f_y: 420, // ACI 318-19 Section 20.2.2.2 - Grade 60 reinforcement
  b: 300,
  h: 600,
  cover: 40, // ACI 318-19 Section 20.6.1.3.1 - Minimum cover
  stirrup_dia: 10,
  tension_bar_dia: 25,
  M_u: 350e6,
  V_u: 250e3,
  bar_areas: { 10: 71, 16: 199, 20: 314, 25: 491, 28: 616, 32: 804 },
  stirrup_sizes: [8, 10, 12],
  // ACI 318-19 Section 21.2.2 - Strength reduction factors
  phi_flexure: 0.9, // Tension controlled (εt ≥ 0.005)
  phi_shear: 0.75, // Shear and torsion
  phi_torsion: 0.75, // Shear and torsion
  T_u: 0, // Factored torsion (N·mm)
};

const availableBarSizes = Object.keys(defaultInput.bar_areas).map(Number);
const availableStirrupSizes = defaultInput.stirrup_sizes;

const BeamReinforcementDesign: React.FC<BeamReinforcementDesignProps> = ({ width, height, M_u, V_u }) => {
  const {
    input,
    setInput,
    compBarDia,
    setCompBarDia,
    stirrupDia,
    setStirrupDia,
    showSteps,
    setShowSteps,
    showCompliance,
    setShowCompliance,
    torsionResult,
    useSideBars,
    setUseSideBars,
    sideBarDia,
    setSideBarDia,
    results,
    setResults,
    error,
    setError,
    handleChange,
    handleBarSizeChange,
    handleCompBarSizeChange,
    handleStirrupSizeChange,
    handleSubmit,
    availableBarSizes,
    availableStirrupSizes,
  } = useBeamReinforcementDesign(width, height, M_u, V_u);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mt-12 transition-colors">
      <div className="flex items-center mb-6">
        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
        <BarChart2 className="w-6 h-6 text-yellow-500 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reinforced Concrete Beam Design</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Input Form */}
        <div className="lg:col-span-4">
          <BeamReinforcementInputPanel
            input={input}
            setInput={setInput}
            compBarDia={compBarDia}
            setCompBarDia={setCompBarDia}
            stirrupDia={stirrupDia}
            setStirrupDia={setStirrupDia}
            useSideBars={useSideBars}
            setUseSideBars={setUseSideBars}
            sideBarDia={sideBarDia}
            setSideBarDia={setSideBarDia}
            error={error}
            handleChange={handleChange}
            handleBarSizeChange={handleBarSizeChange}
            handleCompBarSizeChange={handleCompBarSizeChange}
            handleStirrupSizeChange={handleStirrupSizeChange}
            handleSubmit={handleSubmit}
            availableBarSizes={availableBarSizes}
            availableStirrupSizes={availableStirrupSizes}
            showCompliance={showCompliance}
            setShowCompliance={setShowCompliance}
          />
        </div>
        {/* Right Side: Results and Visualization */}
        <div className="lg:col-span-8">
          <BeamReinforcementResultsPanel
            input={input}
            results={results}
            torsionResult={torsionResult}
            stirrupDia={stirrupDia}
            useSideBars={useSideBars}
            sideBarDia={sideBarDia}
            showSteps={showSteps}
            setShowSteps={setShowSteps}
          />
        </div>
      </div>
    </div>
  );
};

export default BeamReinforcementDesign; 