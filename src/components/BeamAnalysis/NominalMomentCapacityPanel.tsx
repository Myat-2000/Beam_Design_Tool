import React from 'react';

interface NominalMomentCapacityPanelProps {
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

const NominalMomentCapacityPanel: React.FC<NominalMomentCapacityPanelProps> = (props) => (
  <div>{/* ...Nominal moment capacity UI as in original... */}</div>
);

export default NominalMomentCapacityPanel; 