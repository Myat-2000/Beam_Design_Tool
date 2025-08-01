import React from 'react';
import { StressAnalysis, CapacityAnalysis } from './types';

interface AdequacyAnalysisPanelProps {
  stressAnalysis: StressAnalysis;
  capacityAnalysis: CapacityAnalysis;
}

const AdequacyAnalysisPanel: React.FC<AdequacyAnalysisPanelProps> = ({ stressAnalysis, capacityAnalysis }) => (
  <div>{/* ...Adequacy analysis UI as in original... */}</div>
);

export default AdequacyAnalysisPanel; 