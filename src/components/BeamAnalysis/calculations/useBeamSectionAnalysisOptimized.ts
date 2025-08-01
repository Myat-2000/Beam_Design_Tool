import { useState } from 'react';
import {
  AppliedLoads,
  CapacityAnalysis,
  CompressionTensionAnalysis,
  NominalMomentCapacity,
  SectionProperties,
  StressAnalysis
} from '../types';
import {
  useSectionProperties,
  useStressAnalysis,
  useCapacityAnalysis,
  useNominalMomentCapacity,
  useCompressionTensionAnalysis,
  useStressDistributionData,
  useCompressionTensionData
} from '../hooks';

interface UseBeamSectionAnalysisProps {
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

/**
 * Optimized custom hook for beam section analysis
 * This hook uses individual specialized hooks for different calculations
 * to improve performance and maintainability
 */
export function useBeamSectionAnalysis({
  width,
  height,
  materialProps,
  loads
}: UseBeamSectionAnalysisProps) {
  // UI state
  const [showCompliance, setShowCompliance] = useState(false);
  const [showCalculationSteps, setShowCalculationSteps] = useState(false);
  const [showTheories, setShowTheories] = useState(false);

  // Material properties state
  const [enhancedMaterialProps, setEnhancedMaterialProps] = useState({
    elasticModulus: materialProps.elasticModulus,
    shearModulus: materialProps.shearModulus,
    yieldStrength: materialProps.yieldStrength,
    ultimateStrength: materialProps.ultimateStrength,
    density: 7850, // kg/m³ (default for steel)
    poissonRatio: 0.3 // default for steel
  });

  // Applied loads state
  const [appliedLoads, setAppliedLoads] = useState<AppliedLoads>({
    axialForce: loads.axialForce,
    shearForceX: loads.shearForce,
    shearForceY: 0,
    bendingMomentX: loads.bendingMoment,
    bendingMomentY: 0,
    torsion: loads.torsion,
    distributedLoad: 0
  });

  // Reduction factors state
  const [reductionFactors, setReductionFactors] = useState({
    phi_flexure: 0.9,
    phi_shear: 0.75,
    phi_torsion: 0.75,
    phi_axial: 0.65
  });

  // Reinforcement details state
  const [reinforcementDetails, setReinforcementDetails] = useState({
    concreteStrength: 30, // MPa
    steelYieldStrength: 420, // MPa
    cover: 40, // mm
    stirrupSpacing: 150, // mm
    tensionBarDiameter: 16, // mm
    tensionBarCount: 4,
    tensionBarLayers: 1, // Number of layers for tension bars
    barsPerLayer: 4, // Number of bars per layer
    compressionBarDiameter: 16, // mm
    compressionBarCount: 2,
    compressionBarLayers: 1, // Number of layers for compression bars
    compressionBarsPerLayer: 2, // Number of compression bars per layer
    stirrupDiameter: 10 // mm
  });

  // Use specialized hooks for calculations
  const sectionProps = useSectionProperties({ width, height });

  const nominalMomentCapacity = useNominalMomentCapacity({
    sectionProps,
    reinforcementDetails,
    height,
    width
  });

  const stressAnalysis = useStressAnalysis({
    appliedLoads,
    sectionProps,
    height,
    width,
    steelYieldStrength: reinforcementDetails.steelYieldStrength
  });

  const capacityAnalysis = useCapacityAnalysis({
    appliedLoads,
    sectionProps,
    nominalMomentCapacity,
    reductionFactors,
    reinforcementDetails,
    height,
    width
  });

  const compressionTensionAnalysis = useCompressionTensionAnalysis({
    appliedLoads,
    sectionProps,
    nominalMomentCapacity,
    reinforcementDetails,
    height,
    width
  });

  // Use chart data generation hooks
  const generateStressDistributionData = useStressDistributionData({
    appliedLoads,
    sectionProps,
    height
  });

  const generateCompressionTensionData = useCompressionTensionData({
    appliedLoads,
    sectionProps,
    height
  });

  // Return all the state and calculated values
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