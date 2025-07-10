'use client';
import React, { useState } from 'react';
import ClientLayout from './ClientLayout';
import BeamAnalysis from '@/components/BeamAnalysis/BeamAnalysis';
import ErrorBoundary from '@/components/BeamAnalysis/ErrorBoundary';

export default function Home() {
  const [beamData, setBeamData] = useState({
    width: 300,
    height: 600,
    materialProps: {
      elasticModulus: 200000,
      shearModulus: 77000,
      yieldStrength: 250,
      ultimateStrength: 400
    },
    loads: {
      axialForce: 0,
      shearForce: 0,
      bendingMoment: 0,
      torsion: 0
    }
  });

  return (
    <ClientLayout>
      <main className="w-full h-full min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4">
        <ErrorBoundary>
          <BeamAnalysis 
            onBeamDataChange={setBeamData}
          />
        </ErrorBoundary>
      </main>
    </ClientLayout>
  );
}