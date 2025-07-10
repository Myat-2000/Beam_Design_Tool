export type Load = {
  id: number;
  type: 'point' | 'distributed' | 'moment' | 'torsion';
  position: number;
  magnitude: number;
  length?: number;
  momentDirection?: 'clockwise' | 'anticlockwise';
} & (
  | { type: 'moment' | 'torsion'; momentDirection: 'clockwise' | 'anticlockwise' }
  | { type: 'point' | 'distributed'; momentDirection?: never }
);
  
  export interface MaterialProperties {
  elasticModulus: number;  // E in MPa
  shearModulus: number;    // G in MPa
  yieldStrength?: number;  // σy in MPa
  ultimateStrength?: number; // σu in MPa
}
  
  export interface DiagramPoint {
    position: number;
    shear: number;
    moment: number;
    torsion: number;
    normalStress: number;
    shearStress: number;
    torsionalStress: number;
    vonMisesStress: number;
    deflection: number;
  }
  
  export interface SectionProperties {
    area: number;             // m²
    momentOfInertia: number;  // m⁴
    sectionModulus: number;   // m³
    polarMomentOfInertia: number;  // m⁴
    torsionalConstant: number;     // m⁴
  }
  
  export interface Reactions {
    reactionA: number;
    reactionB: number;
    momentA: number;
    momentB: number;
  }
  
  export interface BeamDeformationVisualizationProps {
    beamLength: number;
    deflectionData: DiagramPoint[];
    startSupport: 'pin' | 'roller' | 'fixed' | 'free';
    endSupport: 'pin' | 'roller' | 'fixed' | 'free';
    startSupportPosition: number;
    endSupportPosition: number;
    loads: Load[];
    elasticModulus: number;
    momentOfInertia: number;
  }

export interface BeamProject {
  id: string;
  name: string;
  beamLength: number;
  beamHeight: number;
  beamWidth: number;
  materialProps: MaterialProperties;
  loads: Load[];
  startSupport: 'pin' | 'roller' | 'fixed' | 'free';
  endSupport: 'pin' | 'roller' | 'fixed' | 'free';
  startSupportPosition: number;
  endSupportPosition: number;
  diagramData: DiagramPoint[];
  reactions: Reactions;
  showStressInfo: boolean;
  showLoadHelp: boolean;
  createdAt: Date;
  updatedAt: Date;
  history: any[];
  version: number;
}

export type { TorsionDesignResult } from './BeamReinforcementCalculations';