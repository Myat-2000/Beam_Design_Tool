import { useMemo } from 'react';
import { AppliedLoads, SectionProperties } from '../types';

interface UseChartDataProps {
  appliedLoads: AppliedLoads;
  sectionProps: SectionProperties;
  height: number;
}

/**
 * Custom hook for generating stress distribution chart data
 * This hook is optimized to only recalculate when dependencies change
 */
export function useStressDistributionData({
  appliedLoads,
  sectionProps,
  height
}: UseChartDataProps) {
  return useMemo(() => {
    const data = [];
    const steps = 50;
    
    // Return empty array if no loads are applied
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
  }, [appliedLoads, sectionProps, height]); // Only recalculate when dependencies change
}

/**
 * Custom hook for generating compression/tension zone chart data
 * This hook is optimized to only recalculate when dependencies change
 */
export function useCompressionTensionData({
  appliedLoads,
  sectionProps,
  height
}: UseChartDataProps) {
  return useMemo(() => {
    const data = [];
    const steps = 50;
    
    // Return empty array if no loads are applied
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
  }, [appliedLoads, sectionProps, height]); // Only recalculate when dependencies change
}