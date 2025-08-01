import { useMemo } from 'react';
import { AppliedLoads, CapacityAnalysis, NominalMomentCapacity, SectionProperties } from '../types';

interface UseCapacityAnalysisProps {
  appliedLoads: AppliedLoads;
  sectionProps: SectionProperties;
  nominalMomentCapacity: NominalMomentCapacity;
  reductionFactors: {
    phi_flexure: number;
    phi_shear: number;
    phi_torsion: number;
  };
  reinforcementDetails: {
    concreteStrength: number;
    steelYieldStrength: number;
    cover: number;
    tensionBarDiameter: number;
    tensionBarCount: number;
    compressionBarDiameter: number;
    compressionBarCount: number;
  };
  height: number;
  width: number;
}

/**
 * Custom hook for calculating capacity analysis based on section properties, reinforcement details, and applied loads
 * This hook is optimized to only recalculate when dependencies change
 */
export function useCapacityAnalysis({
  appliedLoads,
  sectionProps,
  nominalMomentCapacity,
  reductionFactors,
  reinforcementDetails,
  height,
  width
}: UseCapacityAnalysisProps): CapacityAnalysis {
  // Memoize capacity analysis calculations to prevent unnecessary recalculations
  return useMemo(() => {
    // Default return if area is zero or no tension bars to prevent division by zero
    if (sectionProps.area === 0 || reinforcementDetails.tensionBarCount === 0) {
      return {
        axialCapacity: 0,
        shearCapacityX: 0,
        shearCapacityY: 0,
        bendingCapacityX: 0,
        bendingCapacityY: 0,
        torsionalCapacity: 0,
        combinedCapacity: 0,
        utilizationRatio: 0
      };
    }

    // Calculate concrete and steel areas
    const concreteArea = sectionProps.area;
    const tensionBarArea = Math.PI * Math.pow(reinforcementDetails.tensionBarDiameter / 2, 2);
    const compressionBarArea = Math.PI * Math.pow(reinforcementDetails.compressionBarDiameter / 2, 2);
    const totalSteelArea = tensionBarArea * reinforcementDetails.tensionBarCount + 
                          compressionBarArea * reinforcementDetails.compressionBarCount;
    
    // Get material strengths
    const f_c = reinforcementDetails.concreteStrength;
    const f_y = reinforcementDetails.steelYieldStrength;
    
    // Calculate axial capacity
    const P_n_concrete = 0.85 * f_c * (concreteArea - totalSteelArea);
    const P_n_steel = f_y * totalSteelArea;
    const P_n = P_n_concrete + P_n_steel;
    const axialCapacity = reductionFactors.phi_flexure * P_n / 1e6;
    
    // Calculate shear capacity
    const d = height - reinforcementDetails.cover;
    const V_c = 0.17 * Math.sqrt(f_c) * width * d;
    const shearCapacityX = reductionFactors.phi_shear * V_c / 1e6;
    const shearCapacityY = shearCapacityX;
    
    // Calculate bending capacity
    const bendingCapacityX = nominalMomentCapacity.phiM_n / 1e6;
    const bendingCapacityY = bendingCapacityX;
    
    // Calculate torsional capacity
    const A_cp = width * height;
    const p_cp = 2 * (width + height);
    const T_c = 0.33 * Math.sqrt(f_c) * A_cp * A_cp / p_cp;
    const torsionalCapacity = reductionFactors.phi_torsion * T_c / 1e6;
    
    // Calculate capacity ratios
    const axialRatio = axialCapacity > 0 ? Math.abs(appliedLoads.axialForce) / axialCapacity : 0;
    const shearRatio = shearCapacityX > 0 ? Math.abs(appliedLoads.shearForceX) / shearCapacityX : 0;
    const bendingRatio = bendingCapacityX > 0 ? Math.abs(appliedLoads.bendingMomentX) / bendingCapacityX : 0;
    
    // Calculate combined capacity
    const combinedCapacity = Math.sqrt(
      Math.pow(axialRatio, 2) + 
      Math.pow(shearRatio, 2) + 
      Math.pow(bendingRatio, 2)
    );
    
    // Calculate utilization ratio
    const utilizationRatio = Math.min(combinedCapacity, 1.0);

    return {
      axialCapacity,
      shearCapacityX,
      shearCapacityY,
      bendingCapacityX,
      bendingCapacityY,
      torsionalCapacity,
      combinedCapacity,
      utilizationRatio
    };
  }, [appliedLoads, sectionProps, nominalMomentCapacity, reductionFactors, reinforcementDetails, height, width]); // Only recalculate when dependencies change
}