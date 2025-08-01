import { useMemo } from 'react';
import { NominalMomentCapacity, SectionProperties } from '../types';

interface UseNominalMomentCapacityProps {
  sectionProps: SectionProperties;
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
 * Custom hook for calculating nominal moment capacity based on section properties and reinforcement details
 * This hook is optimized to only recalculate when dependencies change
 */
export function useNominalMomentCapacity({
  sectionProps,
  reinforcementDetails,
  height,
  width
}: UseNominalMomentCapacityProps): NominalMomentCapacity {
  // Memoize nominal moment capacity calculations to prevent unnecessary recalculations
  return useMemo(() => {
    // Default return if area is zero or no tension bars to prevent division by zero
    if (sectionProps.area === 0 || reinforcementDetails.tensionBarCount === 0) {
      return {
        M_n: 0,
        M_n_concrete: 0,
        M_n_steel: 0,
        a_depth: 0,
        c_depth: 0,
        beta1: 0,
        epsilon_t: 0,
        phi: 0,
        phiM_n: 0,
        failureMode: 'tension_controlled'
      };
    }

    // Get material strengths and properties
    const f_c = reinforcementDetails.concreteStrength;
    const f_y = reinforcementDetails.steelYieldStrength;
    
    // Calculate beta1 based on ACI 318-19
    let beta1 = 0.85;
    if (f_c > 28) {
      beta1 = Math.max(0.85 - 0.05 * (f_c - 28) / 7, 0.65);
    }
    
    // Calculate reinforcement areas
    const A_s = reinforcementDetails.tensionBarCount * Math.PI * Math.pow(reinforcementDetails.tensionBarDiameter / 2, 2);
    const A_s_prime = reinforcementDetails.compressionBarCount * Math.PI * Math.pow(reinforcementDetails.compressionBarDiameter / 2, 2);
    
    // Calculate effective depth
    const d = height - reinforcementDetails.cover;
    
    // Calculate depth of equivalent rectangular stress block
    const a = A_s * f_y / (0.85 * f_c * width);
    
    // Calculate neutral axis depth
    const c = a / beta1;
    
    // Calculate strain in tension reinforcement
    const epsilon_t = 0.003 * (d - c) / c;
    
    // Determine failure mode and phi factor based on ACI 318-19
    let failureMode: 'tension_controlled' | 'compression_controlled' | 'transition' = 'tension_controlled';
    let phi = 0.9; // Default for tension-controlled sections
    
    if (epsilon_t <= 0.002) {
      failureMode = 'compression_controlled';
      phi = 0.65;
    } else if (epsilon_t < 0.005) {
      failureMode = 'transition';
      phi = 0.65 + 0.25 * (epsilon_t - 0.002) / 0.003;
    }
    
    // Calculate nominal moment capacity
    const M_n_concrete = 0.85 * f_c * a * width * (d - a / 2);
    const M_n_steel = A_s_prime * f_y * (d - reinforcementDetails.cover);
    const M_n = M_n_concrete + M_n_steel;
    const phiM_n = phi * M_n;

    return {
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
    };
  }, [sectionProps, reinforcementDetails, height, width]); // Only recalculate when dependencies change
}