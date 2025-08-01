import { useMemo } from 'react';
import { AppliedLoads, SectionProperties, StressAnalysis } from '../types';

interface UseStressAnalysisProps {
  appliedLoads: AppliedLoads;
  sectionProps: SectionProperties;
  height: number;
  width: number;
  steelYieldStrength: number;
}

/**
 * Custom hook for calculating stress analysis based on applied loads and section properties
 * This hook is optimized to only recalculate when dependencies change
 */
export function useStressAnalysis({
  appliedLoads,
  sectionProps,
  height,
  width,
  steelYieldStrength
}: UseStressAnalysisProps): StressAnalysis {
  // Memoize stress analysis calculations to prevent unnecessary recalculations
  return useMemo(() => {
    // Default return if area is zero to prevent division by zero
    if (sectionProps.area === 0) {
      return {
        normalStress: 0,
        shearStressX: 0,
        shearStressY: 0,
        vonMisesStress: 0,
        maxCompression: 0,
        maxTension: 0,
        safetyFactor: 999,
        adequacyStatus: 'safe'
      };
    }

    // Calculate stresses
    const axialStress = appliedLoads.axialForce / sectionProps.area;
    const bendingStressX = appliedLoads.bendingMomentX / sectionProps.sectionModulus;
    const bendingStressY = appliedLoads.bendingMomentY / sectionProps.sectionModulus;
    const normalStress = Math.abs(axialStress) + Math.abs(bendingStressX) + Math.abs(bendingStressY);
    const shearStressX = Math.abs(appliedLoads.shearForceX / sectionProps.area);
    const shearStressY = Math.abs(appliedLoads.shearForceY / sectionProps.area);
    const torsionalStress = Math.abs(appliedLoads.torsion * 1000) / (0.208 * width * Math.pow(height, 2));
    
    // Calculate von Mises stress
    const vonMisesStress = Math.sqrt(
      Math.pow(normalStress, 2) + 
      3 * (Math.pow(shearStressX, 2) + Math.pow(shearStressY, 2) + Math.pow(torsionalStress, 2))
    );
    
    // Calculate max compression and tension
    const maxCompression = normalStress + Math.sqrt(Math.pow(shearStressX, 2) + Math.pow(shearStressY, 2));
    const maxTension = normalStress - Math.sqrt(Math.pow(shearStressX, 2) + Math.pow(shearStressY, 2));
    
    // Calculate safety factor and adequacy status
    const safetyFactor = vonMisesStress > 0 ? steelYieldStrength / vonMisesStress : 999;
    let adequacyStatus: 'safe' | 'marginal' | 'unsafe' = 'safe';
    if (safetyFactor < 1.0) adequacyStatus = 'unsafe';
    else if (safetyFactor < 1.5) adequacyStatus = 'marginal';

    return {
      normalStress,
      shearStressX,
      shearStressY,
      vonMisesStress,
      maxCompression,
      maxTension,
      safetyFactor,
      adequacyStatus
    };
  }, [appliedLoads, sectionProps, height, width, steelYieldStrength]); // Only recalculate when dependencies change
}