// Code for Beam Analysis Component
"use client";
import React from "react";
import { useTheme } from "../ThemeProvider";
import { useTabContext } from "../TabContext";
import { useBeamAnalysis } from "./useBeamAnalysis";
import BeamPropertiesPanel from "./BeamPropertiesPanel";
import BeamSupportPanel from "./BeamSupportPanel";
import BeamLoadPanel from "./BeamLoadPanel";
import BeamDiagramPanel from "./BeamDiagramPanel";

interface BeamAnalysisProps {
  onBeamDataChange?: (data: {
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
  }) => void;
}

const BeamAnalysis: React.FC<BeamAnalysisProps> = ({ onBeamDataChange }) => {
  const { theme } = useTheme();
  const { activeTab } = useTabContext();
  const analysis = useBeamAnalysis(onBeamDataChange);

  const {
    beamLength, setBeamLength, beamHeight, setBeamHeight, beamWidth, setBeamWidth,
    materialProps, setMaterialProps,
    beamLengthError, beamHeightError, beamWidthError,
    startSupport, setStartSupport, endSupport, setEndSupport,
    startSupportPosition, endSupportPosition, handleSupportPositionChange,
    loads, setLoads, addLoad, updateLoad, showLoadHelp, setShowLoadHelp,
    diagramData, reactions, showStressInfo, setShowStressInfo,
    calculateSectionProperties,
  } = analysis;

  return (
    <div>
      <BeamPropertiesPanel
        beamLength={beamLength}
        beamHeight={beamHeight}
        beamWidth={beamWidth}
        materialProps={materialProps}
        beamLengthError={beamLengthError}
        beamHeightError={beamHeightError}
        beamWidthError={beamWidthError}
        handleBeamLengthChange={setBeamLength}
        handleBeamHeightChange={setBeamHeight}
        handleBeamWidthChange={setBeamWidth}
        setMaterialProps={setMaterialProps}
      />
      <BeamSupportPanel
        startSupport={startSupport}
        endSupport={endSupport}
        startSupportPosition={startSupportPosition}
        endSupportPosition={endSupportPosition}
        handleSupportPositionChange={handleSupportPositionChange}
        setStartSupport={setStartSupport}
        setEndSupport={setEndSupport}
        beamLength={beamLength}
      />
      <BeamLoadPanel
        loads={loads}
        setLoads={setLoads}
        addLoad={addLoad}
        updateLoad={updateLoad}
        showLoadHelp={showLoadHelp}
        setShowLoadHelp={setShowLoadHelp}
        beamLength={beamLength}
      />
      <BeamDiagramPanel
        diagramData={diagramData}
        theme={theme}
        beamLength={beamLength}
        materialProps={materialProps}
        startSupport={startSupport}
        endSupport={endSupport}
        startSupportPosition={startSupportPosition}
        endSupportPosition={endSupportPosition}
        loads={loads}
        reactions={reactions}
        showStressInfo={showStressInfo}
        setShowStressInfo={setShowStressInfo}
        calculateSectionProperties={calculateSectionProperties}
      />
    </div>
  );
};

export default BeamAnalysis;