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
    width?: number;           // m
    height?: number;          // m
    area: number;             // m²
    momentOfInertia: number;  // m⁴
    sectionModulus: number;   // m³
    polarMomentOfInertia: number;  // m⁴
    torsionalConstant: number;     // m⁴
    momentOfInertiaX?: number;  // m⁴
    momentOfInertiaY?: number;  // m⁴
    sectionModulusX?: number;   // m³
    sectionModulusY?: number;   // m³
    radiusOfGyrationX?: number; // m
    radiusOfGyrationY?: number; // m
    plasticModulusX?: number;   // m³
    plasticModulusY?: number;   // m³
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

// --- Added for BeamSectionAnalysis and useBeamSectionAnalysis ---
export interface MaterialProperties {
  elasticModulus: number;
  shearModulus: number;
  yieldStrength?: number;
  ultimateStrength?: number;
  density?: number;
  poissonRatio?: number;
}

export interface AppliedLoads {
  axialForce: number;
  shearForceX: number;
  shearForceY: number;
  bendingMomentX: number;
  bendingMomentY: number;
  torsion: number;
  distributedLoad: number;
}

export interface StressAnalysis {
  normalStress: number;
  shearStressX: number;
  shearStressY: number;
  vonMisesStress: number;
  maxCompression: number;
  maxTension: number;
  safetyFactor: number;
  adequacyStatus: 'safe' | 'marginal' | 'unsafe';
}

export interface CapacityAnalysis {
  axialCapacity: number;
  shearCapacityX: number;
  shearCapacityY: number;
  bendingCapacityX: number;
  bendingCapacityY: number;
  torsionalCapacity: number;
  combinedCapacity: number;
  utilizationRatio: number;
}

export interface CompressionTensionAnalysis {
  neutralAxisPosition: number;
  compressionZoneArea: number;
  tensionZoneArea: number;
  compressionForce: number;
  tensionForce: number;
  compressionDepth: number;
  tensionDepth: number;
  compressionStress: number;
  tensionStress: number;
}

export interface NominalMomentCapacity {
  M_n: number;
  M_n_concrete: number;
  M_n_steel: number;
  a_depth: number;
  c_depth: number;
  beta1: number;
  epsilon_t: number;
  phi: number;
  phiM_n: number;
  failureMode: 'tension_controlled' | 'compression_controlled' | 'transition';
}

export interface BeamSectionAnalysisProps {
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