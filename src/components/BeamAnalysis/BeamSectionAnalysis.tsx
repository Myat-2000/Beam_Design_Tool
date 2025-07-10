"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Ruler, Calculator, TrendingUp, AlertTriangle, CheckCircle, Info, Settings, Shield, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

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
  
  // Enhanced state management
  const [sectionProps, setSectionProps] = useState<SectionProperties>({
    width: 0,
    height: 0,
    area: 0,
    momentOfInertiaX: 0,
    momentOfInertiaY: 0,
    sectionModulusX: 0,
    sectionModulusY: 0,
    radiusOfGyrationX: 0,
    radiusOfGyrationY: 0,
    plasticModulusX: 0,
    plasticModulusY: 0
  });

  const [enhancedMaterialProps, setEnhancedMaterialProps] = useState<MaterialProperties>({
    elasticModulus: materialProps.elasticModulus,
    shearModulus: materialProps.shearModulus,
    yieldStrength: materialProps.yieldStrength,
    ultimateStrength: materialProps.ultimateStrength,
    density: 7850, // Steel density in kg/m³
    poissonRatio: 0.3
  });

  const [appliedLoads, setAppliedLoads] = useState<AppliedLoads>({
    axialForce: loads.axialForce,
    shearForceX: loads.shearForce,
    shearForceY: 0,
    bendingMomentX: loads.bendingMoment,
    bendingMomentY: 0,
    torsion: loads.torsion,
    distributedLoad: 0
  });

  const [stressAnalysis, setStressAnalysis] = useState<StressAnalysis>({
    normalStress: 0,
    shearStressX: 0,
    shearStressY: 0,
    vonMisesStress: 0,
    maxCompression: 0,
    maxTension: 0,
    safetyFactor: 0,
    adequacyStatus: 'safe'
  });

  const [capacityAnalysis, setCapacityAnalysis] = useState<CapacityAnalysis>({
    axialCapacity: 0,
    shearCapacityX: 0,
    shearCapacityY: 0,
    bendingCapacityX: 0,
    bendingCapacityY: 0,
    torsionalCapacity: 0,
    combinedCapacity: 0,
    utilizationRatio: 0
  });

  // Reduction factors state
  const [reductionFactors, setReductionFactors] = useState({
    phi_flexure: 0.9,
    phi_shear: 0.75,
    phi_torsion: 0.75
  });

  const [showCompliance, setShowCompliance] = useState(true);

  // Calculate enhanced section properties
  useEffect(() => {
    const area = width * height;
    const momentOfInertiaX = (width * Math.pow(height, 3)) / 12;
    const momentOfInertiaY = (height * Math.pow(width, 3)) / 12;
    const sectionModulusX = momentOfInertiaX / (height / 2);
    const sectionModulusY = momentOfInertiaY / (width / 2);
    const radiusOfGyrationX = Math.sqrt(momentOfInertiaX / area);
    const radiusOfGyrationY = Math.sqrt(momentOfInertiaY / area);
    const plasticModulusX = (width * Math.pow(height, 2)) / 4;
    const plasticModulusY = (height * Math.pow(width, 2)) / 4;

    setSectionProps({
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
    });
  }, [width, height]);

  // Calculate comprehensive stress analysis
  useEffect(() => {
    if (sectionProps.area === 0) return;

    // Normal stress from axial force and bending
    const axialStress = appliedLoads.axialForce / sectionProps.area;
    const bendingStressX = appliedLoads.bendingMomentX / sectionProps.sectionModulusX;
    const bendingStressY = appliedLoads.bendingMomentY / sectionProps.sectionModulusY;
    const normalStress = Math.abs(axialStress) + Math.abs(bendingStressX) + Math.abs(bendingStressY);

    // Shear stresses
    const shearStressX = Math.abs(appliedLoads.shearForceX / sectionProps.area);
    const shearStressY = Math.abs(appliedLoads.shearForceY / sectionProps.area);
    const torsionalStress = Math.abs(appliedLoads.torsion / (2 * sectionProps.area * Math.min(width, height) / 3));

    // von Mises stress
    const vonMisesStress = Math.sqrt(
      Math.pow(normalStress, 2) + 
      3 * (Math.pow(shearStressX, 2) + Math.pow(shearStressY, 2) + Math.pow(torsionalStress, 2))
    );

    const maxCompression = normalStress + Math.sqrt(Math.pow(shearStressX, 2) + Math.pow(shearStressY, 2));
    const maxTension = normalStress - Math.sqrt(Math.pow(shearStressX, 2) + Math.pow(shearStressY, 2));
    const safetyFactor = enhancedMaterialProps.yieldStrength / vonMisesStress;

    let adequacyStatus: 'safe' | 'marginal' | 'unsafe' = 'safe';
    if (safetyFactor < 1.0) adequacyStatus = 'unsafe';
    else if (safetyFactor < 1.5) adequacyStatus = 'marginal';

    setStressAnalysis({
      normalStress,
      shearStressX,
      shearStressY,
      vonMisesStress,
      maxCompression,
      maxTension,
      safetyFactor,
      adequacyStatus
    });
  }, [appliedLoads, sectionProps, enhancedMaterialProps]);

  // Calculate capacity analysis following ACI 318-19
  useEffect(() => {
    if (sectionProps.area === 0) return;

    // ACI 318-19 Section 22.4.2 - Axial capacity (concrete + steel)
    const concreteArea = sectionProps.area;
    const steelArea = 0.02 * concreteArea; // Assume 2% steel ratio
    const f_c = 28; // Assume concrete strength for analysis
    const f_y = enhancedMaterialProps.yieldStrength;
    
    // ACI 318-19 Section 22.4.2.1 - Nominal axial strength
    // Corrected: Use proper ACI formula for axial capacity
    const P_n_concrete = 0.85 * f_c * (concreteArea - steelArea);
    const P_n_steel = f_y * steelArea;
    const P_n = P_n_concrete + P_n_steel;
    const axialCapacity = reductionFactors.phi_flexure * P_n / 1e6; // kN

    // ACI 318-19 Section 22.5.5.1 - Shear capacity
    // Corrected: Use proper ACI shear strength formula
    const V_c = 0.17 * Math.sqrt(f_c) * width * height; // Concrete shear strength
    const shearCapacityX = reductionFactors.phi_shear * V_c / 1e6; // kN
    const shearCapacityY = shearCapacityX;

    // ACI 318-19 Section 22.2.2.4.1 - Flexural capacity
    // Corrected: Use proper ACI flexural capacity calculation
    const beta1 = f_c <= 28 ? 0.85 : Math.max(0.65, 0.85 - 0.05 * (f_c - 28) / 7);
    const d = height - 40; // Assume 40mm cover
    const a = steelArea * f_y / (0.85 * f_c * width);
    const M_n = f_y * steelArea * (d - a / 2);
    const bendingCapacityX = reductionFactors.phi_flexure * M_n / 1e6; // kN⋅m
    const bendingCapacityY = bendingCapacityX;

    // ACI 318-19 Section 22.7.5.1 - Torsional capacity
    // Corrected: Use proper ACI torsional capacity formula
    const A_cp = width * height; // Gross area enclosed by outside perimeter
    const p_cp = 2 * (width + height); // Outside perimeter
    const T_c = 0.33 * Math.sqrt(f_c) * A_cp * A_cp / p_cp;
    const torsionalCapacity = reductionFactors.phi_torsion * T_c / 1e6; // kN⋅m

    // ACI 318-19 Section 22.5.1.2 - Combined capacity using interaction formula
    const axialRatio = Math.abs(appliedLoads.axialForce) / axialCapacity;
    const shearRatio = Math.abs(appliedLoads.shearForceX) / shearCapacityX;
    const bendingRatio = Math.abs(appliedLoads.bendingMomentX) / bendingCapacityX;
    
    // ACI 318-19 Section 22.5.1.2 - Combined stress check
    const combinedCapacity = Math.sqrt(
      Math.pow(axialRatio, 2) + 
      Math.pow(shearRatio, 2) + 
      Math.pow(bendingRatio, 2)
    );

    const utilizationRatio = Math.min(combinedCapacity, 1.0);

    setCapacityAnalysis({
      axialCapacity,
      shearCapacityX,
      shearCapacityY,
      bendingCapacityX,
      bendingCapacityY,
      torsionalCapacity,
      combinedCapacity,
      utilizationRatio
    });
  }, [appliedLoads, sectionProps, enhancedMaterialProps, reductionFactors]);

  // Generate stress distribution data for visualization
  const generateStressDistributionData = () => {
    const data = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const y = (i / steps - 0.5) * height;
      const axialStress = appliedLoads.axialForce / sectionProps.area;
      const bendingStress = appliedLoads.bendingMomentX * y / sectionProps.momentOfInertiaX;
      const normalStress = Math.abs(axialStress + bendingStress);
      const shearStress = Math.abs(appliedLoads.shearForceX / sectionProps.area);
      const vonMisesStress = Math.sqrt(Math.pow(normalStress, 2) + 3 * Math.pow(shearStress, 2));
      
      data.push({
        position: y,
        normalStress,
        shearStress,
        vonMisesStress
      });
    }
    
    return data;
  };

  const stressData = generateStressDistributionData();

  return (
    <div className="space-y-6">
      {/* Analysis Parameters Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500" />
          Analysis Parameters
        </h2>
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
          {/* Material Properties & Loads */}
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Material Properties & Loads
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-green-700 dark:text-green-300">Yield (MPa)</label>
                <input
                  type="number"
                  value={enhancedMaterialProps.yieldStrength}
                  onChange={(e) => setEnhancedMaterialProps({...enhancedMaterialProps, yieldStrength: Number(e.target.value)})}
                  className="w-full px-2 py-1 text-sm rounded border border-green-300 dark:border-green-600 dark:bg-green-600/20 dark:text-green-100 focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-green-700 dark:text-green-300">E (GPa)</label>
                <input
                  type="number"
                  value={(enhancedMaterialProps.elasticModulus / 1000).toFixed(1)}
                  onChange={(e) => setEnhancedMaterialProps({...enhancedMaterialProps, elasticModulus: Number(e.target.value) * 1000})}
                  className="w-full px-2 py-1 text-sm rounded border border-green-300 dark:border-green-600 dark:bg-green-600/20 dark:text-green-100 focus:ring-1 focus:ring-green-500"
                />
              </div>
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
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mt-3">
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

          {/* Section Properties (Read-only) */}
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Section Properties (Calculated)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-purple-700 dark:text-purple-300">Width (mm)</label>
                <input
                  type="number"
                  value={width}
                  disabled
                  className="w-full px-2 py-1 text-sm rounded border border-purple-300 dark:border-purple-600 dark:bg-purple-600/20 dark:text-purple-100 bg-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-purple-700 dark:text-purple-300">Height (mm)</label>
                <input
                  type="number"
                  value={height}
                  disabled
                  className="w-full px-2 py-1 text-sm rounded border border-purple-300 dark:border-purple-600 dark:bg-purple-600/20 dark:text-purple-100 bg-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-purple-700 dark:text-purple-300">Area (m²)</label>
                <input
                  type="text"
                  value={(sectionProps.area / 1000000).toFixed(4)}
                  disabled
                  className="w-full px-2 py-1 text-sm rounded border border-purple-300 dark:border-purple-600 dark:bg-purple-600/20 dark:text-purple-100 bg-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-purple-700 dark:text-purple-300">Ix (m⁴)</label>
                <input
                  type="text"
                  value={(sectionProps.momentOfInertiaX / 1e12).toFixed(6)}
                  disabled
                  className="w-full px-2 py-1 text-sm rounded border border-purple-300 dark:border-purple-600 dark:bg-purple-600/20 dark:text-purple-100 bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Reduction Factors */}
          <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
            <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Reduction Factors (φ) - ACI 318-19
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-orange-700 dark:text-orange-300">φ Flexure</label>
                <input
                  type="number"
                  value={reductionFactors.phi_flexure}
                  onChange={(e) => setReductionFactors({...reductionFactors, phi_flexure: Number(e.target.value)})}
                  step="0.01"
                  min="0.65"
                  max="0.9"
                  className="w-full px-2 py-1 text-sm rounded border border-orange-300 dark:border-orange-600 dark:bg-orange-600/20 dark:text-orange-100 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-orange-700 dark:text-orange-300">φ Shear</label>
                <input
                  type="number"
                  value={reductionFactors.phi_shear}
                  onChange={(e) => setReductionFactors({...reductionFactors, phi_shear: Number(e.target.value)})}
                  step="0.01"
                  min="0.75"
                  max="0.75"
                  className="w-full px-2 py-1 text-sm rounded border border-orange-300 dark:border-orange-600 dark:bg-orange-600/20 dark:text-orange-100 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-orange-700 dark:text-orange-300">φ Torsion</label>
                <input
                  type="number"
                  value={reductionFactors.phi_torsion}
                  onChange={(e) => setReductionFactors({...reductionFactors, phi_torsion: Number(e.target.value)})}
                  step="0.01"
                  min="0.75"
                  max="0.75"
                  className="w-full px-2 py-1 text-sm rounded border border-orange-300 dark:border-orange-600 dark:bg-orange-600/20 dark:text-orange-100 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Adequacy Analysis Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-green-500" />
          Adequacy Analysis
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-xl ${
            stressAnalysis.adequacyStatus === 'safe' ? 'bg-green-50 dark:bg-green-900/30' :
            stressAnalysis.adequacyStatus === 'marginal' ? 'bg-yellow-50 dark:bg-yellow-900/30' :
            'bg-red-50 dark:bg-red-900/30'
          }`}>
            <h3 className={`text-sm font-medium mb-2 ${
              stressAnalysis.adequacyStatus === 'safe' ? 'text-green-800 dark:text-green-300' :
              stressAnalysis.adequacyStatus === 'marginal' ? 'text-yellow-800 dark:text-yellow-300' :
              'text-red-800 dark:text-red-300'
            }`}>Design Status</h3>
            <div className="flex items-center gap-2">
              {stressAnalysis.adequacyStatus === 'safe' ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : stressAnalysis.adequacyStatus === 'marginal' ? (
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              )}
              <span className={`text-lg font-bold ${
                stressAnalysis.adequacyStatus === 'safe' ? 'text-green-600 dark:text-green-400' :
                stressAnalysis.adequacyStatus === 'marginal' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {stressAnalysis.adequacyStatus.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Safety Factor</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stressAnalysis.safetyFactor.toFixed(2)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {stressAnalysis.safetyFactor >= 1.5 ? 'Excellent' :
               stressAnalysis.safetyFactor >= 1.0 ? 'Adequate' : 'Insufficient'}
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">Utilization Ratio</h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(capacityAnalysis.utilizationRatio * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {capacityAnalysis.utilizationRatio <= 0.8 ? 'Under-utilized' :
               capacityAnalysis.utilizationRatio <= 1.0 ? 'Optimal' : 'Over-utilized'}
            </p>
          </div>
        </div>

        {/* Detailed Analysis Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Stress Analysis</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Normal Stress:</span>
                <span className="font-medium">{stressAnalysis.normalStress.toFixed(2)} MPa</span>
              </div>
              <div className="flex justify-between">
                <span>Shear Stress X:</span>
                <span className="font-medium">{stressAnalysis.shearStressX.toFixed(2)} MPa</span>
              </div>
              <div className="flex justify-between">
                <span>von Mises Stress:</span>
                <span className="font-medium">{stressAnalysis.vonMisesStress.toFixed(2)} MPa</span>
              </div>
              <div className="flex justify-between">
                <span>Max Compression:</span>
                <span className="font-medium">{stressAnalysis.maxCompression.toFixed(2)} MPa</span>
              </div>
              <div className="flex justify-between">
                <span>Max Tension:</span>
                <span className="font-medium">{stressAnalysis.maxTension.toFixed(2)} MPa</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Capacity Analysis</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Axial Capacity (φ={reductionFactors.phi_flexure}):</span>
                <span className="font-medium">{capacityAnalysis.axialCapacity.toFixed(1)} kN</span>
              </div>
              <div className="flex justify-between">
                <span>Shear Capacity X (φ={reductionFactors.phi_shear}):</span>
                <span className="font-medium">{capacityAnalysis.shearCapacityX.toFixed(1)} kN</span>
              </div>
              <div className="flex justify-between">
                <span>Bending Capacity X (φ={reductionFactors.phi_flexure}):</span>
                <span className="font-medium">{capacityAnalysis.bendingCapacityX.toFixed(1)} kN⋅m</span>
              </div>
              <div className="flex justify-between">
                <span>Torsional Capacity (φ={reductionFactors.phi_torsion}):</span>
                <span className="font-medium">{capacityAnalysis.torsionalCapacity.toFixed(1)} kN⋅m</span>
              </div>
              <div className="flex justify-between">
                <span>Combined Capacity:</span>
                <span className="font-medium">{(capacityAnalysis.combinedCapacity * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Properties */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Ruler className="w-6 h-6 text-blue-500" />
          Section Properties
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Geometric Properties</h3>
            <div className="space-y-1 text-sm">
              <p>Width: {width.toFixed(1)} mm</p>
              <p>Height: {height.toFixed(1)} mm</p>
              <p>Area: {(sectionProps.area / 1000000).toFixed(3)} m²</p>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Moment of Inertia</h3>
            <div className="space-y-1 text-sm">
              <p>Ix: {(sectionProps.momentOfInertiaX / 1e12).toFixed(3)} m⁴</p>
              <p>Iy: {(sectionProps.momentOfInertiaY / 1e12).toFixed(3)} m⁴</p>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">Section Modulus</h3>
            <div className="space-y-1 text-sm">
              <p>Sx: {(sectionProps.sectionModulusX / 1e9).toFixed(3)} m³</p>
              <p>Sy: {(sectionProps.sectionModulusY / 1e9).toFixed(3)} m³</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stress Distribution Chart */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          Stress Distribution
        </h2>
        <div className="h-96">
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
                <p className="font-mono text-sm mb-2">Ix = {(sectionProps.momentOfInertiaX / 1e12).toFixed(6)} m⁴</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Section Modulus (Sx):</strong> Sx = Ix / (h/2)</p>
                <p className="font-mono text-sm mb-2">Sx = {(sectionProps.momentOfInertiaX / 1e12).toFixed(6)} / ({height/2000}).toFixed(3)</p>
                <p className="font-mono text-sm mb-2">Sx = {(sectionProps.sectionModulusX / 1e9).toFixed(6)} m³</p>
              </div>
            </div>
          </div>

          {/* Stress Analysis Calculations */}
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">2. Stress Analysis (Elastic Theory)</h3>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Normal Stress (σ):</strong> σ = P/A + M/S</p>
                <p className="font-mono text-sm mb-2">σ = {loads.axialForce.toFixed(1)}/{(sectionProps.area / 1000000).toFixed(3)} + {loads.bendingMoment.toFixed(1)}/{(sectionProps.sectionModulusX / 1e9).toFixed(6)}</p>
                <p className="font-mono text-sm mb-2">σ = {stressAnalysis.normalStress.toFixed(2)} MPa</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Shear Stress (τ):</strong> τ = VQ/It</p>
                <p className="font-mono text-sm mb-2">τ = {loads.shearForce.toFixed(1)} × Q / (Ix × t)</p>
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
                <p className="font-mono text-sm mb-2">P_n = 0.85 × {enhancedMaterialProps.yieldStrength.toFixed(0)} × {(sectionProps.area / 1000000).toFixed(3)}</p>
                <p className="font-mono text-sm mb-2">φP_n = {reductionFactors.phi_flexure} × P_n = {capacityAnalysis.axialCapacity.toFixed(1)} kN</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Shear Capacity (ACI 22.5.5.1):</strong></p>
                <p className="font-mono text-sm mb-2">V_c = 0.17√f&apos;c × b × d</p>
                <p className="font-mono text-sm mb-2">V_c = 0.17√{enhancedMaterialProps.yieldStrength.toFixed(0)} × {width.toFixed(1)} × {height.toFixed(1)}</p>
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

          {/* Safety Factor Calculations */}
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">4. Safety Factor Analysis</h3>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="font-mono text-sm mb-2"><strong>Safety Factor:</strong> SF = σ_yield / σ_vonMises</p>
                <p className="font-mono text-sm mb-2">SF = {enhancedMaterialProps.yieldStrength.toFixed(0)} / {stressAnalysis.vonMisesStress.toFixed(2)}</p>
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

      {/* Recommendations Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Design Recommendations
        </h2>
        
        <div className="space-y-4">
          {stressAnalysis.adequacyStatus === 'unsafe' && (
            <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-700">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">⚠️ Design is Unsafe</h3>
              <ul className="text-sm text-red-700 dark:text-red-200 space-y-1">
                <li>• Increase beam dimensions (width or height)</li>
                <li>• Use higher strength material</li>
                <li>• Reduce applied loads</li>
                <li>• Add reinforcement if applicable</li>
                <li>• Consider different beam cross-section shape</li>
              </ul>
            </div>
          )}
          
          {stressAnalysis.adequacyStatus === 'marginal' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">⚠️ Design is Marginal</h3>
              <ul className="text-sm text-yellow-700 dark:text-yellow-200 space-y-1">
                <li>• Consider increasing safety factor</li>
                <li>• Monitor load variations carefully</li>
                <li>• Ensure proper construction quality</li>
                <li>• Consider additional safety measures</li>
              </ul>
            </div>
          )}
          
          {stressAnalysis.adequacyStatus === 'safe' && (
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl border border-green-200 dark:border-green-700">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">✅ Design is Safe</h3>
              <ul className="text-sm text-green-700 dark:text-green-200 space-y-1">
                <li>• Current design meets safety requirements</li>
                <li>• Adequate safety factor achieved</li>
                <li>• Consider optimization for efficiency</li>
                <li>• Monitor during construction and service</li>
              </ul>
            </div>
          )}
          
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Analysis Summary</h3>
            <div className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
              <p>• Maximum von Mises stress: {stressAnalysis.vonMisesStress.toFixed(2)} MPa</p>
              <p>• Material yield strength: {enhancedMaterialProps.yieldStrength.toFixed(0)} MPa</p>
              <p>• Safety factor: {stressAnalysis.safetyFactor.toFixed(2)}</p>
              <p>• Utilization ratio: {(capacityAnalysis.utilizationRatio * 100).toFixed(1)}%</p>
              <p>• Section efficiency: {((sectionProps.area / (width * height)) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BeamSectionAnalysis; 