import { useMemo } from 'react';
import { AppliedLoads, CompressionTensionAnalysis, NominalMomentCapacity, SectionProperties } from '../types';

interface UseCompressionTensionAnalysisProps {
  appliedLoads: AppliedLoads;
  sectionProps: SectionProperties;
  nominalMomentCapacity: NominalMomentCapacity;
  reinforcementDetails: {
    concreteStrength: number;
    steelYieldStrength: number;
  };
  height: number;
  width: number;
}

/**
 * Custom hook for calculating compression/tension analysis based on applied loads and section properties
 * This hook is optimized to only recalculate when dependencies change
 */
export function useCompressionTensionAnalysis({
  appliedLoads,
  sectionProps,
  nominalMomentCapacity,
  reinforcementDetails,
  height,
  width
}: UseCompressionTensionAnalysisProps): CompressionTensionAnalysis {
  // Memoize compression/tension analysis calculations to prevent unnecessary recalculations
  return useMemo(() => {
    // Default return if area is zero to prevent division by zero
    if (sectionProps.area === 0) {
      return {
        neutralAxisPosition: 0,
        compressionZoneArea: 0,
        tensionZoneArea: 0,
        compressionForce: 0,
        tensionForce: 0,
        compressionDepth: 0,
        tensionDepth: 0,
        compressionStress: 0,
        tensionStress: 0
      };
    }

    // Calculate neutral axis position based on applied loads
    const axialStress = appliedLoads.axialForce / sectionProps.area;
    const bendingStress = appliedLoads.bendingMomentX / sectionProps.sectionModulus;
    
    // Calculate neutral axis position (where stress is zero)
    // For pure bending, neutral axis is at mid-height
    // For combined axial and bending, neutral axis shifts
    let neutralAxisPosition = height / 2;
    if (Math.abs(bendingStress) > 0) {
      neutralAxisPosition = height / 2 * (1 - axialStress / bendingStress);
    }
    
    // Constrain neutral axis position to be within the section height
    neutralAxisPosition = Math.max(0, Math.min(height, neutralAxisPosition));
    
    // Calculate compression and tension zone areas
    const compressionZoneArea = (neutralAxisPosition / height) * sectionProps.area;
    const tensionZoneArea = sectionProps.area - compressionZoneArea;
    
    // Calculate compression and tension depths
    const compressionDepth = neutralAxisPosition;
    const tensionDepth = height - neutralAxisPosition;
    
    // Calculate compression and tension stresses
    const f_c = reinforcementDetails.concreteStrength;
    const f_y = reinforcementDetails.steelYieldStrength;
    
    // Use nominal moment capacity's stress block depth for stress calculations
    const compressionStress = 0.85 * f_c;
    const tensionStress = f_y;
    
    // Calculate compression and tension forces
    const compressionForce = compressionStress * compressionZoneArea;
    const tensionForce = tensionStress * tensionZoneArea;

    return {
      neutralAxisPosition,
      compressionZoneArea,
      tensionZoneArea,
      compressionForce,
      tensionForce,
      compressionDepth,
      tensionDepth,
      compressionStress,
      tensionStress
    };
  }, [appliedLoads, sectionProps, reinforcementDetails, height]); // Only recalculate when dependencies change
}