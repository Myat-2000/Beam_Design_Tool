import { useMemo } from 'react';
import { SectionProperties } from '../types';

interface UseSectionPropertiesProps {
  width: number;
  height: number;
}

/**
 * Custom hook for calculating section properties based on width and height
 * This hook is optimized to only recalculate when width or height changes
 */
export function useSectionProperties({ width, height }: UseSectionPropertiesProps): SectionProperties {
  // Memoize section properties calculations to prevent unnecessary recalculations
  return useMemo(() => {
    // Calculate section properties
    const area = width * height / 1e6; // Convert mm² to m²
    const momentOfInertiaX = width * Math.pow(height, 3) / 12 / 1e12; // Convert mm⁴ to m⁴
    const momentOfInertiaY = height * Math.pow(width, 3) / 12 / 1e12; // Convert mm⁴ to m⁴
    const sectionModulusX = momentOfInertiaX / (height / 2 / 1000); // Convert mm³ to m³
    const sectionModulusY = momentOfInertiaY / (width / 2 / 1000); // Convert mm³ to m³
    const radiusOfGyrationX = Math.sqrt(momentOfInertiaX / area); // m
    const radiusOfGyrationY = Math.sqrt(momentOfInertiaY / area); // m
    const plasticModulusX = width * height * height / 4 / 1e9; // Convert mm³ to m³
    const plasticModulusY = height * width * width / 4 / 1e9; // Convert mm³ to m³
    const polarMomentOfInertia = momentOfInertiaX + momentOfInertiaY; // m⁴
    const torsionalConstant = width * Math.pow(height, 3) * (1/3 - 0.21 * (height/width) * (1 - Math.pow(height/width, 4) / 12)) / 1e12; // m⁴

    return {
      width,
      height,
      area,
      momentOfInertia: momentOfInertiaX, // For backward compatibility
      sectionModulus: sectionModulusX, // For backward compatibility
      momentOfInertiaX,
      momentOfInertiaY,
      sectionModulusX,
      sectionModulusY,
      radiusOfGyrationX,
      radiusOfGyrationY,
      plasticModulusX,
      plasticModulusY,
      polarMomentOfInertia,
      torsionalConstant
    };
  }, [width, height]); // Only recalculate when width or height changes
}