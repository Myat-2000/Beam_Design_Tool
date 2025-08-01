import { useState, useEffect, useMemo } from 'react';
import { SectionProperties, MaterialProperties, AppliedLoads, StressAnalysis, CapacityAnalysis, CompressionTensionAnalysis, NominalMomentCapacity, BeamSectionAnalysisProps } from '../types';

// Custom hook for beam section analysis
export function useBeamSectionAnalysis({ width, height, materialProps, loads }: BeamSectionAnalysisProps) {
  // --- State ---
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
    plasticModulusY: 0,
    momentOfInertia: 0,
    sectionModulus: 0,
    polarMomentOfInertia: 0,
    torsionalConstant: 0
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

  const [compressionTensionAnalysis, setCompressionTensionAnalysis] = useState<CompressionTensionAnalysis>({
    neutralAxisPosition: 0,
    compressionZoneArea: 0,
    tensionZoneArea: 0,
    compressionForce: 0,
    tensionForce: 0,
    compressionDepth: 0,
    tensionDepth: 0,
    compressionStress: 0,
    tensionStress: 0
  });

  const [nominalMomentCapacity, setNominalMomentCapacity] = useState<NominalMomentCapacity>({
    M_n: 0,
    M_n_concrete: 0,
    M_n_steel: 0,
    a_depth: 0,
    c_depth: 0,
    beta1: 0.85,
    epsilon_t: 0,
    phi: 0.9,
    phiM_n: 0,
    failureMode: 'tension_controlled'
  });

  const [reductionFactors, setReductionFactors] = useState({
    phi_flexure: 0.9,
    phi_shear: 0.75,
    phi_torsion: 0.75
  });

  const [reinforcementDetails, setReinforcementDetails] = useState({
    cover: 40,
    tensionBarDiameter: 20,
    tensionBarCount: 4,
    tensionBarLayers: 1,
    barsPerLayer: 4,
    compressionBarDiameter: 16,
    compressionBarCount: 2,
    compressionBarLayers: 1,
    compressionBarsPerLayer: 2,
    stirrupDiameter: 10,
    stirrupSpacing: 200,
    concreteStrength: 28,
    steelYieldStrength: 420
  });

  const [showCompliance, setShowCompliance] = useState(true);
  const [showCalculationSteps, setShowCalculationSteps] = useState(true);
  const [showTheories, setShowTheories] = useState(true);

  // --- Calculation Effects ---
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
      plasticModulusY,
      momentOfInertia: momentOfInertiaX, // fallback for compatibility
      sectionModulus: sectionModulusX,   // fallback for compatibility
      polarMomentOfInertia: momentOfInertiaX * 2,
      torsionalConstant: 0 // You can add the correct formula if needed
    });
  }, [width, height]);

  useEffect(() => {
    if (sectionProps.area === 0) return;
    const neutralAxisPosition = nominalMomentCapacity.c_depth || height / 2;
    const compressionZoneArea = width * neutralAxisPosition;
    const tensionZoneArea = width * (height - neutralAxisPosition);
    const tensionBarArea = Math.PI * Math.pow(reinforcementDetails.tensionBarDiameter / 2, 2);
    const compressionBarArea = Math.PI * Math.pow(reinforcementDetails.compressionBarDiameter / 2, 2);
    const A_s = tensionBarArea * reinforcementDetails.tensionBarCount;
    const A_s_prime = compressionBarArea * reinforcementDetails.compressionBarCount;
    const compressionForce = A_s_prime * reinforcementDetails.steelYieldStrength / 1000;
    const tensionForce = A_s * reinforcementDetails.steelYieldStrength / 1000;
    const compressionStress = compressionForce * 1000 / compressionZoneArea;
    const tensionStress = tensionForce * 1000 / tensionZoneArea;
    setCompressionTensionAnalysis({
      neutralAxisPosition,
      compressionZoneArea,
      tensionZoneArea,
      compressionForce,
      tensionForce,
      compressionDepth: neutralAxisPosition,
      tensionDepth: height - neutralAxisPosition,
      compressionStress,
      tensionStress
    });
  }, [appliedLoads, sectionProps, nominalMomentCapacity, reinforcementDetails, width, height]);

  useEffect(() => {
    if (sectionProps.area === 0 || reinforcementDetails.tensionBarCount === 0) return;
    const f_c = reinforcementDetails.concreteStrength;
    const f_y = reinforcementDetails.steelYieldStrength;
    const cover = reinforcementDetails.cover;
    const d = height - cover;
    const tensionBarArea = Math.PI * Math.pow(reinforcementDetails.tensionBarDiameter / 2, 2);
    const A_s = tensionBarArea * reinforcementDetails.tensionBarCount;
    const compressionBarArea = Math.PI * Math.pow(reinforcementDetails.compressionBarDiameter / 2, 2);
    const A_s_prime = compressionBarArea * reinforcementDetails.compressionBarCount;
    const beta1 = f_c <= 28 ? 0.85 : Math.max(0.65, 0.85 - 0.05 * (f_c - 28) / 7);
    const a = (A_s * f_y - A_s_prime * f_y) / (0.85 * f_c * width);
    const c = a / beta1;
    const epsilon_t = 0.003 * (d - c) / c;
    let phi = 0.9;
    let failureMode: 'tension_controlled' | 'compression_controlled' | 'transition' = 'tension_controlled';
    if (epsilon_t >= 0.005) {
      phi = 0.9;
      failureMode = 'tension_controlled';
    } else if (epsilon_t >= 0.002) {
      phi = 0.65 + (epsilon_t - 0.002) * (0.25 / 0.003);
      failureMode = 'transition';
    } else {
      phi = 0.65;
      failureMode = 'compression_controlled';
    }
    const M_n_concrete = 0.85 * f_c * a * width * (d - a / 2);
    const M_n_steel = A_s_prime * f_y * (d - cover);
    const M_n = M_n_concrete + M_n_steel;
    const phiM_n = phi * M_n;
    setNominalMomentCapacity({
      M_n,
      M_n_concrete,
      M_n_steel,
      a_depth: a,
      c_depth: c,
      beta1,
      epsilon_t,
      phi,
      phiM_n,
      failureMode
    });
  }, [sectionProps, enhancedMaterialProps, reinforcementDetails, height, width]);

  useEffect(() => {
    if (sectionProps.area === 0) return;
    const axialStress = appliedLoads.axialForce / sectionProps.area;
    const bendingStressX = appliedLoads.bendingMomentX / sectionProps.sectionModulus;
    const bendingStressY = appliedLoads.bendingMomentY / sectionProps.sectionModulus;
    const normalStress = Math.abs(axialStress) + Math.abs(bendingStressX) + Math.abs(bendingStressY);
    const shearStressX = Math.abs(appliedLoads.shearForceX / sectionProps.area);
    const shearStressY = Math.abs(appliedLoads.shearForceY / sectionProps.area);
    const torsionalStress = Math.abs(appliedLoads.torsion * 1000) / (0.208 * width * Math.pow(height, 2));
    const vonMisesStress = Math.sqrt(
      Math.pow(normalStress, 2) + 
      3 * (Math.pow(shearStressX, 2) + Math.pow(shearStressY, 2) + Math.pow(torsionalStress, 2))
    );
    const maxCompression = normalStress + Math.sqrt(Math.pow(shearStressX, 2) + Math.pow(shearStressY, 2));
    const maxTension = normalStress - Math.sqrt(Math.pow(shearStressX, 2) + Math.pow(shearStressY, 2));
    const safetyFactor = vonMisesStress > 0 ? reinforcementDetails.steelYieldStrength / vonMisesStress : 999;
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
  }, [appliedLoads, sectionProps, enhancedMaterialProps, height, width, reinforcementDetails.steelYieldStrength]);

  useEffect(() => {
    if (sectionProps.area === 0 || reinforcementDetails.tensionBarCount === 0) return;
    const concreteArea = sectionProps.area;
    const tensionBarArea = Math.PI * Math.pow(reinforcementDetails.tensionBarDiameter / 2, 2);
    const compressionBarArea = Math.PI * Math.pow(reinforcementDetails.compressionBarDiameter / 2, 2);
    const totalSteelArea = tensionBarArea * reinforcementDetails.tensionBarCount + 
                          compressionBarArea * reinforcementDetails.compressionBarCount;
    const f_c = reinforcementDetails.concreteStrength;
    const f_y = reinforcementDetails.steelYieldStrength;
    const P_n_concrete = 0.85 * f_c * (concreteArea - totalSteelArea);
    const P_n_steel = f_y * totalSteelArea;
    const P_n = P_n_concrete + P_n_steel;
    const axialCapacity = reductionFactors.phi_flexure * P_n / 1e6;
    const d = height - reinforcementDetails.cover;
    const V_c = 0.17 * Math.sqrt(f_c) * width * d;
    const shearCapacityX = reductionFactors.phi_shear * V_c / 1e6;
    const shearCapacityY = shearCapacityX;
    const bendingCapacityX = nominalMomentCapacity.phiM_n / 1e6;
    const bendingCapacityY = bendingCapacityX;
    const A_cp = width * height;
    const p_cp = 2 * (width + height);
    const T_c = 0.33 * Math.sqrt(f_c) * A_cp * A_cp / p_cp;
    const torsionalCapacity = reductionFactors.phi_torsion * T_c / 1e6;
    const axialRatio = axialCapacity > 0 ? Math.abs(appliedLoads.axialForce) / axialCapacity : 0;
    const shearRatio = shearCapacityX > 0 ? Math.abs(appliedLoads.shearForceX) / shearCapacityX : 0;
    const bendingRatio = bendingCapacityX > 0 ? Math.abs(appliedLoads.bendingMomentX) / bendingCapacityX : 0;
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
  }, [appliedLoads, sectionProps, enhancedMaterialProps, reductionFactors, nominalMomentCapacity, reinforcementDetails, height, width]);

  // --- Data Generation Helpers ---
  const generateStressDistributionData = useMemo(() => {
    return () => {
      const data = [];
      const steps = 50;
      if (!appliedLoads.axialForce && !appliedLoads.bendingMomentX && !appliedLoads.shearForceX) {
        return [];
      }
      for (let i = 0; i <= steps; i++) {
        const y = (i / steps - 0.5) * height;
        const axialStress = appliedLoads.axialForce * 1000 / (sectionProps.area || 1);
        const bendingStress = appliedLoads.bendingMomentX * 1000 * y / (sectionProps.momentOfInertiaX || 1);
        const normalStress = axialStress + bendingStress;
        const shearStress = appliedLoads.shearForceX * 1000 * (height * height / 4 - y * y) / (2 * (sectionProps.momentOfInertiaX || 1));
        const vonMisesStress = Math.sqrt(Math.pow(normalStress, 2) + 3 * Math.pow(shearStress, 2));
        data.push({
          position: y,
          normalStress: Math.abs(normalStress),
          shearStress: Math.abs(shearStress),
          vonMisesStress
        });
      }
      return data;
    };
  }, [appliedLoads, sectionProps, height]);

  const generateCompressionTensionData = useMemo(() => {
    return () => {
      const data = [];
      const steps = 50;
      if (!appliedLoads.axialForce && !appliedLoads.bendingMomentX) {
        return [];
      }
      for (let i = 0; i <= steps; i++) {
        const y = (i / steps - 0.5) * height;
        const axialStress = appliedLoads.axialForce * 1000 / (sectionProps.area || 1);
        const bendingStress = appliedLoads.bendingMomentX * 1000 * y / (sectionProps.momentOfInertiaX || 1);
        const totalStress = axialStress + bendingStress;
        const zone = totalStress >= 0 ? 'Tension' : 'Compression';
        data.push({
          position: y,
          stress: Math.abs(totalStress),
          zone
        });
      }
      return data;
    };
  }, [appliedLoads, sectionProps, height]);

  // --- Return ---
  return {
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
  };
}
