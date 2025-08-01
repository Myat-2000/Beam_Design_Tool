"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, BarChart, Bar, AreaChart, Area, ComposedChart } from 'recharts';
import { Ruler, Calculator, TrendingUp, AlertTriangle, CheckCircle, Info, Settings, Shield, Zap, ChevronDown, ChevronUp, BookOpen, Target, Layers } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import BeamCrossSection from './BeamCrossSection';
import { useBeamSectionAnalysis } from './calculations/useBeamSectionAnalysisOptimized';
import SectionPropertiesPanel from './SectionPropertiesPanel';
import ReinforcementDetailsPanel from './ReinforcementDetailsPanel';
import ReductionFactorsPanel from './ReductionFactorsPanel';
import AdequacyAnalysisPanel from './AdequacyAnalysisPanel';
import NominalMomentCapacityPanel from './NominalMomentCapacityPanel';
import TheoriesPanel from './TheoriesPanel';
import RecommendationsPanel from './RecommendationsPanel';

interface SectionProperties {
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

interface MaterialProperties {
  elasticModulus: number;
  shearModulus: number;
  yieldStrength: number;
  ultimateStrength: number;
  density: number;
  poissonRatio: number;
}

interface AppliedLoads {
  axialForce: number;
  shearForceX: number;
  shearForceY: number;
  bendingMomentX: number;
  bendingMomentY: number;
  torsion: number;
  distributedLoad: number;
}

interface StressAnalysis {
  normalStress: number;
  shearStressX: number;
  shearStressY: number;
  vonMisesStress: number;
  maxCompression: number;
  maxTension: number;
  safetyFactor: number;
  adequacyStatus: 'safe' | 'marginal' | 'unsafe';
}

interface CapacityAnalysis {
  axialCapacity: number;
  shearCapacityX: number;
  shearCapacityY: number;
  bendingCapacityX: number;
  bendingCapacityY: number;
  torsionalCapacity: number;
  combinedCapacity: number;
  utilizationRatio: number;
}

// New interfaces for enhanced analysis
interface CompressionTensionAnalysis {
  neutralAxisPosition: number;
  compressionZoneArea: number;
  tensionZoneArea: number;
  compressionForce: number;
  tensionForce: number;
  compressionDepth: number;
  tensionDepth: number;
  compressionStress: number;
  tensionStress: number;
}

interface NominalMomentCapacity {
  M_n: number;
  M_n_concrete: number;
  M_n_steel: number;
  a_depth: number;
  c_depth: number;
  beta1: number;
  epsilon_t: number;
  phi: number;
  phiM_n: number;
  failureMode: 'tension_controlled' | 'compression_controlled' | 'transition';
}

interface BeamSectionAnalysisProps {
  width: number;
  height: number;
  materialProps: {
    elasticModulus: number;
    shearModulus: number;
    yieldStrength: number;
    ultimateStrength: number;
  };
  loads: {
    axialForce: number;
    shearForce: number;
    bendingMoment: number;
    torsion: number;
  };
}

const BeamSectionAnalysis: React.FC<BeamSectionAnalysisProps> = ({
  width,
  height,
  materialProps,
  loads
}) => {
  const { theme } = useTheme();
  
  // Add validation state for width and height
  const [widthError, setWidthError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);

  const validateWidth = (value: number) => {
    if (value < 10) return 'Width must be at least 10 mm.';
    return null;
  };
  const validateHeight = (value: number) => {
    if (value < 10) return 'Height must be at least 10 mm.';
    return null;
  };

  const handleWidthChange = (value: number) => {
    const error = validateWidth(value);
    setWidthError(error);
    if (!error) setAppliedLoads((prev) => ({ ...prev, width: value }));
  };
  const handleHeightChange = (value: number) => {
    const error = validateHeight(value);
    setHeightError(error);
    if (!error) setAppliedLoads((prev) => ({ ...prev, height: value }));
  };

  // Use the custom hook for all calculation and state logic
  const {
    sectionProps,
    enhancedMaterialProps,
    setEnhancedMaterialProps,
    appliedLoads,
    setAppliedLoads,
    stressAnalysis,
    capacityAnalysis,
    compressionTensionAnalysis,
    nominalMomentCapacity,
    reductionFactors,
    setReductionFactors,
    reinforcementDetails,
    setReinforcementDetails,
    showCompliance,
    setShowCompliance,
    showCalculationSteps,
    setShowCalculationSteps,
    showTheories,
    setShowTheories,
    generateStressDistributionData,
    generateCompressionTensionData
  } = useBeamSectionAnalysis({ width, height, materialProps, loads });

  const stressData = generateStressDistributionData;
  const compressionTensionData = generateCompressionTensionData;

  return (
    <div className="bg-white dark:bg-gray-800 w-full min-h-screen flex flex-col transition-colors">
      <div className="flex items-center mb-6 px-8 pt-8">
        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
        <Settings className="w-6 h-6 text-blue-500 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Beam Cross-Section Analysis</h2>
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 px-8 pb-8">
        {/* Left Side: Input Panels */}
        <div className="lg:col-span-4 space-y-6">
      {/* Analysis Parameters Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500" />
          Analysis Parameters
        </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Width (mm)</label>
                <input
                  type="number"
                  value={width}
                  onChange={e => handleWidthChange(Number(e.target.value))}
                  min="10"
                  step="1"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 ${widthError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${!widthError && width >= 10 ? 'border-green-500' : ''}`}
                  placeholder="Width (mm)"
                  aria-label="Beam width in millimeters"
                  aria-invalid={!!widthError}
                  aria-describedby="width-error"
                />
                {widthError && <span id="width-error" className="text-xs text-red-500 mt-1">{widthError}</span>}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1">
                    Enter the width of the beam cross-section (mm)
                  </div>
                </div>
              </div>
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height (mm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={e => handleHeightChange(Number(e.target.value))}
                  min="10"
                  step="1"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 ${heightError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${!heightError && height >= 10 ? 'border-green-500' : ''}`}
                  placeholder="Height (mm)"
                  aria-label="Beam height in millimeters"
                  aria-invalid={!!heightError}
                  aria-describedby="height-error"
                />
                {heightError && <span id="height-error" className="text-xs text-red-500 mt-1">{heightError}</span>}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1">
                    Enter the height of the beam cross-section (mm)
                  </div>
                </div>
              </div>
            </div>
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 relative">
          <button
            type="button"
            aria-label={showCompliance ? 'Hide compliance info' : 'Show compliance info'}
            onClick={() => setShowCompliance((v) => !v)}
            className="absolute top-3 right-3 text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white transition-colors"
          >
            {showCompliance ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>ACI 318-19 Compliance:</strong> Cross-section analysis follows ACI 318-19 Building Code Requirements for Structural Concrete.
          </p>
          <div
            className={`mt-2 text-xs text-blue-700 dark:text-blue-300 transition-all duration-300 overflow-hidden ${showCompliance ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
            style={{ transitionProperty: 'max-height, opacity' }}
          >
            <p><strong>Verified Sections:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Section 22.4.2.1 - Axial strength calculation</li>
              <li>Section 22.5.5.1 - Shear strength calculation</li>
              <li>Section 22.2.2.4.1 - Flexural strength calculation</li>
              <li>Section 22.7.5.1 - Torsional strength calculation</li>
              <li>Section 21.2.2 - Strength reduction factors</li>
              <li>Section 22.5.1.2 - Combined stress analysis</li>
            </ul>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Applied Loads */}
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Applied Loads
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-green-700 dark:text-green-300">Axial (kN)</label>
                <input
                  type="number"
                  value={appliedLoads.axialForce}
                  onChange={(e) => setAppliedLoads({...appliedLoads, axialForce: Number(e.target.value)})}
                  className="w-full px-2 py-1 text-sm rounded border border-green-300 dark:border-green-600 dark:bg-green-600/20 dark:text-green-100 focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-green-700 dark:text-green-300">Shear (kN)</label>
                <input
                  type="number"
                  value={appliedLoads.shearForceX}
                  onChange={(e) => setAppliedLoads({...appliedLoads, shearForceX: Number(e.target.value)})}
                  className="w-full px-2 py-1 text-sm rounded border border-green-300 dark:border-green-600 dark:bg-green-600/20 dark:text-green-100 focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-green-700 dark:text-green-300">Moment (kN·m)</label>
                <input
                  type="number"
                  value={appliedLoads.bendingMomentX}
                  onChange={(e) => setAppliedLoads({...appliedLoads, bendingMomentX: Number(e.target.value)})}
                  className="w-full px-2 py-1 text-sm rounded border border-green-300 dark:border-green-600 dark:bg-green-600/20 dark:text-green-100 focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-green-700 dark:text-green-300">Torsion (kN·m)</label>
                <input
                  type="number"
                  value={appliedLoads.torsion}
                  onChange={(e) => setAppliedLoads({...appliedLoads, torsion: Number(e.target.value)})}
                  className="w-full px-2 py-1 text-sm rounded border border-green-300 dark:border-green-600 dark:bg-green-600/20 dark:text-green-100 focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Reinforcement Details */}
              <ReinforcementDetailsPanel
                concreteStrength={reinforcementDetails.concreteStrength}
                steelYieldStrength={reinforcementDetails.steelYieldStrength}
                cover={reinforcementDetails.cover}
                stirrupSpacing={reinforcementDetails.stirrupSpacing}
                tensionBarDiameter={reinforcementDetails.tensionBarDiameter}
                tensionBarCount={reinforcementDetails.tensionBarCount}
                tensionBarLayers={reinforcementDetails.tensionBarLayers}
                barsPerLayer={reinforcementDetails.barsPerLayer}
                compressionBarDiameter={reinforcementDetails.compressionBarDiameter}
                compressionBarCount={reinforcementDetails.compressionBarCount}
                compressionBarLayers={reinforcementDetails.compressionBarLayers}
                compressionBarsPerLayer={reinforcementDetails.compressionBarsPerLayer}
                stirrupDiameter={reinforcementDetails.stirrupDiameter}
                setReinforcementDetails={setReinforcementDetails}
              />

              {/* Reduction Factors */}
              <ReductionFactorsPanel
                phi_flexure={reductionFactors.phi_flexure}
                phi_shear={reductionFactors.phi_shear}
                phi_torsion={reductionFactors.phi_torsion}
                setReductionFactors={setReductionFactors}
                  />
                </div>
          </section>
          {/* Reinforcement Details */}
          <ReinforcementDetailsPanel
            concreteStrength={reinforcementDetails.concreteStrength}
            steelYieldStrength={reinforcementDetails.steelYieldStrength}
            cover={reinforcementDetails.cover}
            stirrupSpacing={reinforcementDetails.stirrupSpacing}
            tensionBarDiameter={reinforcementDetails.tensionBarDiameter}
            tensionBarCount={reinforcementDetails.tensionBarCount}
            tensionBarLayers={reinforcementDetails.tensionBarLayers}
            barsPerLayer={reinforcementDetails.barsPerLayer}
            compressionBarDiameter={reinforcementDetails.compressionBarDiameter}
            compressionBarCount={reinforcementDetails.compressionBarCount}
            compressionBarLayers={reinforcementDetails.compressionBarLayers}
            compressionBarsPerLayer={reinforcementDetails.compressionBarsPerLayer}
            stirrupDiameter={reinforcementDetails.stirrupDiameter}
            setReinforcementDetails={setReinforcementDetails}
          />
          {/* Reduction Factors */}
          <ReductionFactorsPanel
            phi_flexure={reductionFactors.phi_flexure}
            phi_shear={reductionFactors.phi_shear}
            phi_torsion={reductionFactors.phi_torsion}
            setReductionFactors={setReductionFactors}
                />
              </div>
        {/* Right Side: Visualization and Results */}
        <div className="lg:col-span-8 space-y-6">
      {/* Cross-Section Visualization */}
      <section className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl shadow-lg p-6 border border-blue-200 dark:border-blue-700 transition-colors flex flex-col items-center w-full mb-6">
        <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">Cross-Section Visualization</h3>
        <div className="w-full flex justify-center items-center" style={{ minHeight: 400 }}>
          <BeamCrossSection
            width={width}
            height={height}
            cover={reinforcementDetails.cover}
            bar_dia={reinforcementDetails.tensionBarDiameter}
            n_bars={reinforcementDetails.tensionBarCount}
            stirrup_dia={reinforcementDetails.stirrupDiameter}
            comp_bar_dia={reinforcementDetails.compressionBarDiameter}
            n_comp_bars={reinforcementDetails.compressionBarCount}
            stirrup_positions={[reinforcementDetails.stirrupSpacing/2, reinforcementDetails.stirrupSpacing, reinforcementDetails.stirrupSpacing*1.5]}
            n_layers={reinforcementDetails.tensionBarLayers}
            bars_per_layer={reinforcementDetails.barsPerLayer}
            n_comp_layers={reinforcementDetails.compressionBarLayers}
            comp_bars_per_layer={reinforcementDetails.compressionBarsPerLayer}
            show_torsion_bars={false}
            n_torsion_legs={0}
            torsion_bar_dia={16}
            useSideBars={false}
          />
        </div>
      </section>
      {/* Result Boxes for Adequacy Checks */}
      <section className="w-full flex flex-wrap gap-4 justify-center mb-6">
        {/* Moment Check */}
        <div className={`flex-1 min-w-[220px] max-w-[320px] rounded-2xl p-4 border shadow-lg ${capacityAnalysis.bendingCapacityX > Math.abs(appliedLoads.bendingMomentX) ? 'border-green-400 bg-green-50 dark:bg-green-900/30' : capacityAnalysis.bendingCapacityX === Math.abs(appliedLoads.bendingMomentX) ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' : 'border-red-400 bg-red-50 dark:bg-red-900/30'}`}>
          <h4 className="font-bold text-lg mb-2">Moment Check</h4>
          <div className="text-sm">Demand (Mu): <span className="font-mono">{Math.abs(appliedLoads.bendingMomentX).toFixed(2)} kN·m</span></div>
          <div className="text-sm">Capacity (φMn): <span className="font-mono">{capacityAnalysis.bendingCapacityX.toFixed(2)} kN·m</span></div>
          <div className="text-sm">Ratio: <span className="font-mono">{(Math.abs(appliedLoads.bendingMomentX) / (capacityAnalysis.bendingCapacityX || 1)).toFixed(3)}</span></div>
          <div className="text-sm font-semibold mt-2">{capacityAnalysis.bendingCapacityX > Math.abs(appliedLoads.bendingMomentX) ? 'Safe' : capacityAnalysis.bendingCapacityX === Math.abs(appliedLoads.bendingMomentX) ? 'Marginal' : 'Unsafe'}</div>
        </div>
        {/* Shear Check */}
        <div className={`flex-1 min-w-[220px] max-w-[320px] rounded-2xl p-4 border shadow-lg ${capacityAnalysis.shearCapacityX > Math.abs(appliedLoads.shearForceX) ? 'border-green-400 bg-green-50 dark:bg-green-900/30' : capacityAnalysis.shearCapacityX === Math.abs(appliedLoads.shearForceX) ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' : 'border-red-400 bg-red-50 dark:bg-red-900/30'}`}>
          <h4 className="font-bold text-lg mb-2">Shear Check</h4>
          <div className="text-sm">Demand (Vu): <span className="font-mono">{Math.abs(appliedLoads.shearForceX).toFixed(2)} kN</span></div>
          <div className="text-sm">Capacity (φVc): <span className="font-mono">{capacityAnalysis.shearCapacityX.toFixed(2)} kN</span></div>
          <div className="text-sm">Ratio: <span className="font-mono">{(Math.abs(appliedLoads.shearForceX) / (capacityAnalysis.shearCapacityX || 1)).toFixed(3)}</span></div>
          <div className="text-sm font-semibold mt-2">{capacityAnalysis.shearCapacityX > Math.abs(appliedLoads.shearForceX) ? 'Safe' : capacityAnalysis.shearCapacityX === Math.abs(appliedLoads.shearForceX) ? 'Marginal' : 'Unsafe'}</div>
        </div>
        {/* Axial Check */}
        <div className={`flex-1 min-w-[220px] max-w-[320px] rounded-2xl p-4 border shadow-lg ${capacityAnalysis.axialCapacity > Math.abs(appliedLoads.axialForce) ? 'border-green-400 bg-green-50 dark:bg-green-900/30' : capacityAnalysis.axialCapacity === Math.abs(appliedLoads.axialForce) ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' : 'border-red-400 bg-red-50 dark:bg-red-900/30'}`}>
          <h4 className="font-bold text-lg mb-2">Axial Check</h4>
          <div className="text-sm">Demand (Pu): <span className="font-mono">{Math.abs(appliedLoads.axialForce).toFixed(2)} kN</span></div>
          <div className="text-sm">Capacity (φPn): <span className="font-mono">{capacityAnalysis.axialCapacity.toFixed(2)} kN</span></div>
          <div className="text-sm">Ratio: <span className="font-mono">{(Math.abs(appliedLoads.axialForce) / (capacityAnalysis.axialCapacity || 1)).toFixed(3)}</span></div>
          <div className="text-sm font-semibold mt-2">{capacityAnalysis.axialCapacity > Math.abs(appliedLoads.axialForce) ? 'Safe' : capacityAnalysis.axialCapacity === Math.abs(appliedLoads.axialForce) ? 'Marginal' : 'Unsafe'}</div>
        </div>
      </section>
      {/* Adequacy Analysis Section */}
          <AdequacyAnalysisPanel
            stressAnalysis={stressAnalysis}
            capacityAnalysis={capacityAnalysis}
          />
      {/* Section Properties */}
          <SectionPropertiesPanel
            width={width}
            height={height}
            area={sectionProps.area}
            momentOfInertiaX={sectionProps.momentOfInertia}
            momentOfInertiaY={sectionProps.momentOfInertia}
            sectionModulusX={sectionProps.sectionModulus}
            sectionModulusY={sectionProps.sectionModulus}
            radiusOfGyrationX={0}
            radiusOfGyrationY={0}
            plasticModulusX={0}
            plasticModulusY={0}
          />
      {/* Stress Distribution Chart */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          Stress Distribution
        </h2>
        <div className="h-96">
          {stressData && stressData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stressData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#374151" : "#e5e7eb"} />
              <XAxis
                dataKey="position"
                label={{ value: 'Position (mm)', position: 'bottom', offset: 0, style: { fontSize: '12px', fill: theme === 'dark' ? '#d1d5db' : '#666' } }}
                tick={{ fill: theme === 'dark' ? '#d1d5db' : '#666', fontSize: '12px' }}
                axisLine={{ stroke: theme === 'dark' ? '#d1d5db' : '#666', strokeWidth: 1 }}
              />
              <YAxis
                tickFormatter={(value) => `${value.toFixed(1)}`}
                label={{
                  value: 'Stress (MPa)',
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
                formatter={(value: number, name: string) => [`${value.toFixed(2)} MPa`, name]}
                labelFormatter={(label) => `Position: ${label} mm`}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              <Line
                type="monotone"
                dataKey="normalStress"
                stroke={theme === 'dark' ? "#60a5fa" : "#3b82f6"}
                strokeWidth={2}
                dot={false}
                name="Normal Stress"
              />
              <Line
                type="monotone"
                dataKey="shearStress"
                stroke={theme === 'dark' ? "#f87171" : "#ef4444"}
                strokeWidth={2}
                dot={false}
                name="Shear Stress"
              />
              <Line
                type="monotone"
                dataKey="vonMisesStress"
                stroke={theme === 'dark' ? "#a78bfa" : "#8b5cf6"}
                strokeWidth={2}
                dot={false}
                name="von Mises Stress"
              />
                          </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>No stress data available</p>
            </div>
          )}
        </div>
      </section>
      {/* Compression/Tension Zone Chart */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Layers className="w-6 h-6 text-purple-500" />
          Compression/Tension Zone Analysis
        </h2>
        <div className="h-96">
          {compressionTensionData && compressionTensionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={compressionTensionData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#374151" : "#e5e7eb"} />
              <XAxis
                dataKey="position"
                label={{ value: 'Position (mm)', position: 'bottom', offset: 0, style: { fontSize: '12px', fill: theme === 'dark' ? '#d1d5db' : '#666' } }}
                tick={{ fill: theme === 'dark' ? '#d1d5db' : '#666', fontSize: '12px' }}
                axisLine={{ stroke: theme === 'dark' ? '#d1d5db' : '#666', strokeWidth: 1 }}
              />
              <YAxis
                tickFormatter={(value) => `${value.toFixed(1)}`}
                label={{
                  value: 'Stress (MPa)',
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
                formatter={(value: number, name: string) => [`${value.toFixed(2)} MPa`, name]}
                labelFormatter={(label) => `Position: ${label} mm`}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              <Bar
                dataKey="stress"
                fill={theme === 'dark' ? "#8b5cf6" : "#4f46e5"}
                name="Stress Magnitude"
              />
              <Line
                type="monotone"
                dataKey="stress"
                stroke={theme === 'dark' ? "#f59e0b" : "#d97706"}
                strokeWidth={2}
                dot={false}
                name="Stress Distribution"
              />
            </ComposedChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>No compression/tension data available</p>
            </div>
          )}
        </div>
      </section>

      {/* Calculation Steps Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-500" />
          Calculation Steps with Equations
        </h2>
        
        <div className="space-y-6">
          {/* ACI 318-19 Reference */}
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">ACI 318-19 Standards Applied</h3>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>Flexural Capacity:</strong> Section 22.2.2.4.1</p>
              <p><strong>Shear Capacity:</strong> Section 22.5.5.1</p>
              <p><strong>Torsional Capacity:</strong> Section 22.7.3.1</p>
              <p><strong>Strength Reduction Factors:</strong> Section 21.2.2</p>
            </div>
          </div>

          {/* Section Properties Calculations */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">1. Section Properties (Geometric)</h3>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Area:</strong> A = b × h</p>
                <p className="font-mono text-sm mb-2">A = {width.toFixed(1)} × {height.toFixed(1)} = {(sectionProps.area / 1000000).toFixed(3)} m²</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Moment of Inertia (Ix):</strong> Ix = bh³/12</p>
                <p className="font-mono text-sm mb-2">Ix = {width.toFixed(1)} × {height.toFixed(1)}³ / 12</p>
                <p className="font-mono text-sm mb-2">Ix = {(sectionProps.momentOfInertia / 1e12).toFixed(6)} m⁴</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Section Modulus (Sx):</strong> Sx = Ix / (h/2)</p>
                <p className="font-mono text-sm mb-2">Sx = {(sectionProps.momentOfInertia / 1e12).toFixed(6)} / {(height/2000).toFixed(3)}</p>
                <p className="font-mono text-sm mb-2">Sx = {(sectionProps.sectionModulus / 1e9).toFixed(6)} m³</p>
              </div>
            </div>
          </div>

          {/* Stress Analysis Calculations */}
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">2. Stress Analysis (Elastic Theory)</h3>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Normal Stress (σ):</strong> σ = P/A + M/S</p>
                <p className="font-mono text-sm mb-2">σ = {appliedLoads.axialForce.toFixed(1)}/{(sectionProps.area / 1000000).toFixed(3)} + {appliedLoads.bendingMomentX.toFixed(1)}/{(sectionProps.sectionModulus / 1e9).toFixed(6)}</p>
                <p className="font-mono text-sm mb-2">σ = {stressAnalysis.normalStress.toFixed(2)} MPa</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Shear Stress (τ):</strong> τ = VQ/It</p>
                <p className="font-mono text-sm mb-2">τ = {appliedLoads.shearForceX.toFixed(1)} × Q / (Ix × t)</p>
                <p className="font-mono text-sm mb-2">τ = {stressAnalysis.shearStressX.toFixed(2)} MPa</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>von Mises Stress:</strong> σ_vm = √(σ² + 3τ²)</p>
                <p className="font-mono text-sm mb-2">σ_vm = √({stressAnalysis.normalStress.toFixed(2)}² + 3×{stressAnalysis.shearStressX.toFixed(2)}²)</p>
                <p className="font-mono text-sm mb-2">σ_vm = {stressAnalysis.vonMisesStress.toFixed(2)} MPa</p>
              </div>
            </div>
          </div>

          {/* Capacity Analysis Calculations */}
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">3. Capacity Analysis (ACI 318-19)</h3>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Axial Capacity (ACI 22.4.2.1):</strong></p>
                <p className="font-mono text-sm mb-2">P_n = 0.85f&apos;c × A_g + f_y × A_s</p>
                <p className="font-mono text-sm mb-2">P_n = 0.85 × {reinforcementDetails.concreteStrength.toFixed(0)} × {(sectionProps.area / 1000000).toFixed(3)}</p>
                <p className="font-mono text-sm mb-2">φP_n = {reductionFactors.phi_flexure} × P_n = {capacityAnalysis.axialCapacity.toFixed(1)} kN</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Shear Capacity (ACI 22.5.5.1):</strong></p>
                <p className="font-mono text-sm mb-2">V_c = 0.17√f&apos;c × b × d</p>
                <p className="font-mono text-sm mb-2">V_c = 0.17√{reinforcementDetails.concreteStrength.toFixed(0)} × {width.toFixed(1)} × {height.toFixed(1)}</p>
                <p className="font-mono text-sm mb-2">φV_c = {reductionFactors.phi_shear} × V_c = {capacityAnalysis.shearCapacityX.toFixed(1)} kN</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Flexural Capacity (ACI 22.2.2.4.1):</strong></p>
                <p className="font-mono text-sm mb-2">M_n = 0.85f&apos;c × a × b × (d - a/2)</p>
                <p className="font-mono text-sm mb-2">where a = β₁ × c (β₁ = 0.85 for normal strength)</p>
                <p className="font-mono text-sm mb-2">φM_n = {reductionFactors.phi_flexure} × M_n = {capacityAnalysis.bendingCapacityX.toFixed(1)} kN⋅m</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Torsional Capacity (ACI 22.7.3.1):</strong></p>
                <p className="font-mono text-sm mb-2">T_c = 0.33√f&apos;c × A_cp²/p_cp</p>
                <p className="font-mono text-sm mb-2">where A_cp = area enclosed by perimeter, p_cp = perimeter</p>
                <p className="font-mono text-sm mb-2">φT_c = {reductionFactors.phi_torsion} × T_c = {capacityAnalysis.torsionalCapacity.toFixed(1)} kN⋅m</p>
              </div>
            </div>
          </div>

          {/* β₁ Factor and Stress Block Calculations */}
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">4. β₁ Factor and Stress Block Depth (a)</h3>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>β₁ Factor (ACI 22.2.2.4.1):</strong></p>
                <p className="font-mono text-sm mb-2">For f&apos;c ≤ 28 MPa: β₁ = 0.85</p>
                <p className="font-mono text-sm mb-2">For f&apos;c &gt; 28 MPa: β₁ = 0.85 - 0.05 × (f&apos;c - 28) / 7</p>
                <p className="font-mono text-sm mb-2">
                  β₁ = {reinforcementDetails.concreteStrength <= 28
                    ? "0.85"
                    : "0.85 - 0.05 × (" + reinforcementDetails.concreteStrength + " - 28) / 7"}
                </p>
                <p className="font-mono text-sm mb-2">β₁ = {nominalMomentCapacity.beta1.toFixed(2)}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Stress Block Depth (a):</strong> a = (A_s × f_y - A_s&apos; × f_y) / (0.85 × f&apos;c × b)</p>
                <p className="font-mono text-sm mb-2">A_s = π × (d_bar/2)² × n_bars = π × ({reinforcementDetails.tensionBarDiameter/2}²) × {reinforcementDetails.tensionBarCount}</p>
                <p className="font-mono text-sm mb-2">A_s = {(Math.PI * Math.pow(reinforcementDetails.tensionBarDiameter / 2, 2) * reinforcementDetails.tensionBarCount).toFixed(1)} mm²</p>
                <p className="font-mono text-sm mb-2">A_s' = π × (d_bar/2)² × n_bars = π × ({reinforcementDetails.compressionBarDiameter/2}²) × {reinforcementDetails.compressionBarCount}</p>
                <p className="font-mono text-sm mb-2">A_s' = {(Math.PI * Math.pow(reinforcementDetails.compressionBarDiameter / 2, 2) * reinforcementDetails.compressionBarCount).toFixed(1)} mm²</p>
                <p className="font-mono text-sm mb-2">a = ({(Math.PI * Math.pow(reinforcementDetails.tensionBarDiameter / 2, 2) * reinforcementDetails.tensionBarCount).toFixed(1)} × {reinforcementDetails.steelYieldStrength} - {(Math.PI * Math.pow(reinforcementDetails.compressionBarDiameter / 2, 2) * reinforcementDetails.compressionBarCount).toFixed(1)} × {reinforcementDetails.steelYieldStrength}) / (0.85 × {reinforcementDetails.concreteStrength} × {width})</p>
                <p className="font-mono text-sm mb-2">a = {nominalMomentCapacity.a_depth.toFixed(2)} mm</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Neutral Axis Depth (c):</strong> c = a / β₁</p>
                <p className="font-mono text-sm mb-2">c = {nominalMomentCapacity.a_depth.toFixed(2)} / {nominalMomentCapacity.beta1.toFixed(2)}</p>
                <p className="font-mono text-sm mb-2">c = {nominalMomentCapacity.c_depth.toFixed(2)} mm</p>
              </div>
            </div>
          </div>

          {/* Compression/Tension Zone Analysis */}
          <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-3">5. Compression/Tension Zone Analysis</h3>
            <div className="space-y-3">
                             <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                 <p className="font-mono text-sm mb-2"><strong>Neutral Axis Position:</strong> c = a / β₁</p>
                 <p className="font-mono text-sm mb-2">c = {nominalMomentCapacity.a_depth.toFixed(2)} / {nominalMomentCapacity.beta1.toFixed(2)}</p>
                 <p className="font-mono text-sm mb-2">c = {nominalMomentCapacity.c_depth.toFixed(2)} mm</p>
               </div>
               
               <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                 <p className="font-mono text-sm mb-2"><strong>Compression Zone Area:</strong> A_c = b × c</p>
                 <p className="font-mono text-sm mb-2">A_c = {width.toFixed(1)} × {nominalMomentCapacity.c_depth.toFixed(2)}</p>
                 <p className="font-mono text-sm mb-2">A_c = {compressionTensionAnalysis.compressionZoneArea.toFixed(3)} m²</p>
               </div>
               
               <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                 <p className="font-mono text-sm mb-2"><strong>Tension Zone Area:</strong> A_t = b × (h - c)</p>
                 <p className="font-mono text-sm mb-2">A_t = {width.toFixed(1)} × ({(height - reinforcementDetails.cover).toFixed(1)} - {nominalMomentCapacity.c_depth.toFixed(2)})</p>
                 <p className="font-mono text-sm mb-2">A_t = {compressionTensionAnalysis.tensionZoneArea.toFixed(3)} m²</p>
               </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Compression Force:</strong> F_c = σ_c × A_c</p>
                <p className="font-mono text-sm mb-2">F_c = {compressionTensionAnalysis.compressionStress.toFixed(2)} × {compressionTensionAnalysis.compressionZoneArea.toFixed(3)}</p>
                <p className="font-mono text-sm mb-2">F_c = {compressionTensionAnalysis.compressionForce.toFixed(1)} kN</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Tension Force:</strong> F_t = σ_t × A_t</p>
                <p className="font-mono text-sm mb-2">F_t = {compressionTensionAnalysis.tensionStress.toFixed(2)} × {compressionTensionAnalysis.tensionZoneArea.toFixed(3)}</p>
                <p className="font-mono text-sm mb-2">F_t = {compressionTensionAnalysis.tensionForce.toFixed(1)} kN</p>
              </div>
            </div>
          </div>



          {/* Nominal Moment Capacity Calculations */}
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">6. Nominal Moment Capacity (M_n)</h3>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Nominal Moment (M_n):</strong> M_n = M_n_concrete + M_n_steel</p>
                <p className="font-mono text-sm mb-2">M_n = {nominalMomentCapacity.M_n_concrete.toFixed(1)} + {nominalMomentCapacity.M_n_steel.toFixed(1)}</p>
                <p className="font-mono text-sm mb-2">M_n = {nominalMomentCapacity.M_n.toFixed(1)} kN⋅m</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>&phi; Factor:</strong> &phi; = 0.9 (Tension Controlled)</p>
                <p className="font-mono text-sm mb-2">&phi; = 0.65 + (&epsilon;_t - 0.002) &times; (0.25 / 0.003)</p>
                <p className="font-mono text-sm mb-2">&phi; = 0.65 + ({nominalMomentCapacity.epsilon_t.toFixed(4)} - 0.002) &times; (0.25 / 0.003)</p>
                <p className="font-mono text-sm mb-2">&phi; = {nominalMomentCapacity.phi.toFixed(2)}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>φ-Modified Nominal Moment (φM_n):</strong> φM_n = φ × M_n</p>
                <p className="font-mono text-sm mb-2">φM_n = {nominalMomentCapacity.phi.toFixed(2)} × {nominalMomentCapacity.M_n.toFixed(1)}</p>
                <p className="font-mono text-sm mb-2">φM_n = {nominalMomentCapacity.phiM_n.toFixed(1)} kN⋅m</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                                 <p className="font-mono text-sm mb-2"><strong>Failure Mode:</strong> {nominalMomentCapacity.failureMode}</p>
                 <p className="font-mono text-sm mb-2">ε_t = 0.003 × (d - c) / c</p>
                 <p className="font-mono text-sm mb-2">ε_t = 0.003 × ({(height - reinforcementDetails.cover).toFixed(1)} - {nominalMomentCapacity.c_depth.toFixed(2)}) / {nominalMomentCapacity.c_depth.toFixed(2)}</p>
                 <p className="font-mono text-sm mb-2">&epsilon;_t = {nominalMomentCapacity.epsilon_t.toFixed(4)}</p>
              </div>
            </div>
          </div>

          {/* Safety Factor Calculations */}
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">7. Safety Factor Analysis</h3>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Safety Factor:</strong> SF = σ_yield / σ_vonMises</p>
                <p className="font-mono text-sm mb-2">SF = {reinforcementDetails.steelYieldStrength.toFixed(0)} / {stressAnalysis.vonMisesStress.toFixed(2)}</p>
                <p className="font-mono text-sm mb-2">SF = {stressAnalysis.safetyFactor.toFixed(2)}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Utilization Ratio:</strong> UR = Applied Load / Capacity</p>
                <p className="font-mono text-sm mb-2">UR = Combined Applied Load / Combined Capacity</p>
                <p className="font-mono text-sm mb-2">UR = {(capacityAnalysis.utilizationRatio * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nominal Moment Capacity Analysis Section */}
          <NominalMomentCapacityPanel
            M_n={nominalMomentCapacity.M_n}
            M_n_concrete={nominalMomentCapacity.M_n_concrete}
            M_n_steel={nominalMomentCapacity.M_n_steel}
            a_depth={nominalMomentCapacity.a_depth}
            c_depth={nominalMomentCapacity.c_depth}
            beta1={nominalMomentCapacity.beta1}
            epsilon_t={nominalMomentCapacity.epsilon_t}
            phi={nominalMomentCapacity.phi}
            phiM_n={nominalMomentCapacity.phiM_n}
            failureMode={nominalMomentCapacity.failureMode}
          />

      {/* Theories and Concepts Section */}
          <TheoriesPanel />

      {/* Recommendations Section */}
          <RecommendationsPanel />

            </div>
            </div>
    </div>
  );
};

export default BeamSectionAnalysis;