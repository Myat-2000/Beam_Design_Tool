import { useState, useCallback, useEffect } from 'react';
import { BeamCalculator } from './calculations';
import { Load, MaterialProperties, Reactions, SectionProperties, DiagramPoint, BeamProject } from './types';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

export function useBeamAnalysis(onBeamDataChange?: (data: any) => void) {
  const [beamLength, setBeamLength] = useState<number>(5);
  const [beamHeight, setBeamHeight] = useState<number>(600);
  const [beamWidth, setBeamWidth] = useState<number>(300);
  const [materialProps, setMaterialProps] = useState<MaterialProperties>({
    elasticModulus: 200000,
    shearModulus: 77000
  });
  const [loads, setLoads] = useState<Load[]>([]);
  const [startSupportPosition, setStartSupportPosition] = useState<number>(0);
  const [endSupportPosition, setEndSupportPosition] = useState<number>(4);
  const [startSupport, setStartSupport] = useState<'pin' | 'roller' | 'fixed' | 'free'>('pin');
  const [endSupport, setEndSupport] = useState<'pin' | 'roller' | 'fixed' | 'free'>('roller');
  const [reactions, setReactions] = useState<Reactions>({
    reactionA: 0,
    reactionB: 0,
    momentA: 0,
    momentB: 0
  });
  const [showStressInfo, setShowStressInfo] = useState<boolean>(false);
  const [diagramData, setDiagramData] = useState<DiagramPoint[]>([]);
  const [showLoadHelp, setShowLoadHelp] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState<BeamProject[]>(() => {
    if (typeof window !== 'undefined') {
      const savedProjects = localStorage.getItem('beamProjects');
      return savedProjects ? JSON.parse(savedProjects) : [];
    }
    return [];
  });
  const [currentProject, setCurrentProject] = useState<BeamProject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [factBanner, setFactBanner] = useState<string | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [beamLengthError, setBeamLengthError] = useState<string | null>(null);
  const [beamHeightError, setBeamHeightError] = useState<string | null>(null);
  const [beamWidthError, setBeamWidthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('beamProjects', JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (onBeamDataChange) {
      const maxShear = Math.max(...diagramData.map(d => Math.abs(d.shear)), 0);
      const maxMoment = Math.max(...diagramData.map(d => Math.abs(d.moment)), 0);
      onBeamDataChange({
        width: beamWidth,
        height: beamHeight,
        materialProps: {
          elasticModulus: materialProps.elasticModulus,
          shearModulus: materialProps.shearModulus,
          yieldStrength: 250,
          ultimateStrength: 400
        },
        loads: {
          axialForce: 0,
          shearForce: maxShear,
          bendingMoment: maxMoment,
          torsion: 0
        }
      });
    }
  }, [beamWidth, beamHeight, materialProps, diagramData, onBeamDataChange]);

  const handleSaveProject = useCallback(() => {
    if (!projectName.trim()) {
      toast.error('Project name is required!');
      return;
    }
    setIsSaving(true);
    try {
      const newProject: BeamProject = {
        id: Date.now().toString(),
        name: projectName,
        beamLength,
        beamHeight,
        beamWidth,
        materialProps,
        loads,
        startSupport,
        endSupport,
        startSupportPosition,
        endSupportPosition,
        diagramData,
        reactions,
        showStressInfo,
        showLoadHelp,
        createdAt: new Date(),
        updatedAt: new Date(),
        history: [],
        version: 1,
      };
      setProjects(prev => [...prev, newProject]);
      setCurrentProject(newProject);
      setIsProjectModalOpen(false);
      setProjectName('');
      toast.success('Project saved successfully!');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      toast.error('Failed to save project.');
    } finally {
      setIsSaving(false);
    }
  }, [projectName, beamLength, beamHeight, beamWidth, materialProps, loads, startSupport, endSupport, startSupportPosition, endSupportPosition, diagramData, reactions, showStressInfo, showLoadHelp]);

  const handleLoadProject = useCallback((project: BeamProject) => {
    setIsLoadingProject(true);
    try {
      setCurrentProject(project);
      setBeamLength(project.beamLength);
      setBeamHeight(project.beamHeight);
      setBeamWidth(project.beamWidth);
      setMaterialProps(project.materialProps);
      setLoads(project.loads);
      setStartSupport(project.startSupport);
      setEndSupport(project.endSupport);
      setStartSupportPosition(project.startSupportPosition);
      setEndSupportPosition(project.endSupportPosition);
      setDiagramData(project.diagramData);
      setReactions(project.reactions);
      setIsProjectModalOpen(false);
      toast.success(`Project "${project.name}" loaded!`);
    } catch (err) {
      toast.error('Failed to load project.');
    } finally {
      setIsLoadingProject(false);
    }
  }, []);

  const validateLoads = useCallback(() => {
    if (loads.length === 0) return true;
    for (const load of loads) {
      if (Math.abs(load.magnitude) < 0.001) {
        alert(`Load magnitude cannot be zero. Please set a non-zero value for the ${load.type} load.`);
        return false;
      }
    }
    return true;
  }, [loads]);

  useEffect(() => {
    if (startSupportPosition >= endSupportPosition) {
      setStartSupportPosition(Math.max(0, endSupportPosition - 0.1));
    }
    if (endSupportPosition > beamLength) {
      setEndSupportPosition(beamLength);
    }
  }, [startSupportPosition, endSupportPosition, beamLength]);

  const validateBeamLength = (value: number) => {
    if (value <= 0) return 'Beam length must be greater than 0.';
    return null;
  };
  const validateBeamHeight = (value: number) => {
    if (value < 10) return 'Beam height must be at least 10 mm.';
    return null;
  };
  const validateBeamWidth = (value: number) => {
    if (value < 10) return 'Beam width must be at least 10 mm.';
    return null;
  };

  const handleBeamLengthChange = useCallback((newLength: number) => {
    const error = validateBeamLength(newLength);
    setBeamLengthError(error);
    if (!error) setBeamLength(newLength);
  }, []);
  const handleBeamHeightChange = (value: number) => {
    const error = validateBeamHeight(value);
    setBeamHeightError(error);
    if (!error) setBeamHeight(value);
  };
  const handleBeamWidthChange = (value: number) => {
    const error = validateBeamWidth(value);
    setBeamWidthError(error);
    if (!error) setBeamWidth(value);
  };

  const handleSupportPositionChange = useCallback((position: number, isStart: boolean) => {
    setCalculationError(null);
    if (isStart) {
      const newPosition = Math.max(0, Math.min(position, endSupportPosition - 0.1));
      setStartSupportPosition(newPosition);
    } else {
      const newPosition = Math.min(beamLength, Math.max(position, startSupportPosition + 0.1));
      setEndSupportPosition(newPosition);
    }
  }, [beamLength, endSupportPosition, startSupportPosition]);

  const calculateSectionProperties = useCallback((): SectionProperties => {
    try {
      if (!validateLoads()) {
        return { momentOfInertia: 0, sectionModulus: 0, area: 0, polarMomentOfInertia: 0, torsionalConstant: 0 };
      }
      const calculator = new BeamCalculator(
        beamLength,
        beamHeight,
        beamWidth,
        materialProps,
        startSupportPosition,
        endSupportPosition,
        startSupport,
        endSupport,
        loads
      );
      return calculator.calculateSectionProperties();
    } catch (error) {
      console.error('Error calculating section properties:', error);
      return { momentOfInertia: 0, sectionModulus: 0, area: 0, polarMomentOfInertia: 0, torsionalConstant: 0 };
    }
  }, [beamLength, beamHeight, beamWidth, materialProps, startSupportPosition, endSupportPosition, startSupport, endSupport, loads, validateLoads]);

  const checkLoadOverlap = useCallback((newLoad: Load) => {
    if (newLoad.type !== 'distributed' || !newLoad.length) return false;
    return loads.some(existingLoad =>
      existingLoad.type === 'distributed' && existingLoad.length &&
      newLoad.position < (existingLoad.position + existingLoad.length) &&
      (newLoad.position + (newLoad.length ?? 0)) > existingLoad.position
    );
  }, [loads]);

  const addLoad = useCallback(() => {
    const newLoad: Load = {
      id: Math.max(0, ...loads.map(l => l.id)) + 1,
      type: 'point',
      position: 0,
      magnitude: 1,
    };
    if (checkLoadOverlap(newLoad)) {
      alert("Load overlaps with an existing load!");
      return;
    }
    setLoads([...loads, newLoad]);
  }, [loads, checkLoadOverlap]);

  const updateLoad = useCallback((id: number, field: keyof Load, value: number | string | undefined) => {
    setLoads(prevLoads =>
      prevLoads.map(load => {
        if (load.id !== id) return load;
        let newValue = value;
        if (field === 'position' && typeof value === 'number') {
          newValue = Math.max(0, Math.min(value, beamLength));
        }
        if (field === 'magnitude' && typeof value === 'number') {
          if (Math.abs(value) < 0.001) {
            newValue = value > 0 ? 0.001 : -0.001;
          }
        }
        if (field === 'length' && load.type === 'distributed' && typeof value === 'number') {
          newValue = Math.max(0.1, Math.min(value, beamLength - (load.position || 0)));
        }
        return { ...load, [field]: newValue };
      })
    );
  }, [beamLength]);

  const generateDiagramData = useCallback(() => {
    try {
      if (!validateLoads()) {
        return [];
      }
      const calculator = new BeamCalculator(
        beamLength,
        beamHeight,
        beamWidth,
        materialProps,
        startSupportPosition,
        endSupportPosition,
        startSupport,
        endSupport,
        loads
      );
      const calculatedReactions = calculator.calculateReactions();
      setReactions(calculatedReactions);
      const data = calculator.generateDiagramData();
      setDiagramData(data);
      setCalculationError(null);
      return data;
    } catch (error: any) {
      console.error('Error generating diagram data:', error);
      setCalculationError(error.message || 'Calculation error');
      setDiagramData([]);
      setReactions({ reactionA: 0, reactionB: 0, momentA: 0, momentB: 0 });
      return [];
    }
  }, [beamLength, beamHeight, beamWidth, materialProps, startSupportPosition, endSupportPosition, startSupport, endSupport, loads, validateLoads]);

  return {
    beamLength, setBeamLength, beamHeight, setBeamHeight, beamWidth, setBeamWidth,
    materialProps, setMaterialProps, loads, setLoads, startSupportPosition, setStartSupportPosition, endSupportPosition, setEndSupportPosition,
    startSupport, setStartSupport, endSupport, setEndSupport, reactions, setReactions, showStressInfo, setShowStressInfo, diagramData, setDiagramData,
    showLoadHelp, setShowLoadHelp, isProjectModalOpen, setIsProjectModalOpen, projectName, setProjectName, projects, setProjects, currentProject, setCurrentProject,
    isSaving, setIsSaving, isLoadingProject, setIsLoadingProject, factBanner, setFactBanner, calculationError, setCalculationError,
    beamLengthError, setBeamLengthError, beamHeightError, setBeamHeightError, beamWidthError, setBeamWidthError,
    handleSaveProject, handleLoadProject, validateLoads, validateBeamLength, validateBeamHeight, validateBeamWidth,
    handleBeamLengthChange, handleBeamHeightChange, handleBeamWidthChange, handleSupportPositionChange,
    calculateSectionProperties, checkLoadOverlap, addLoad, updateLoad, generateDiagramData
  };
} 