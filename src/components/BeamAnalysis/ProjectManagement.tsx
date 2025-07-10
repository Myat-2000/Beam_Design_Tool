import React, { useState, useCallback, useEffect } from 'react';
import { Save, FolderOpen, FileText, Moon, Sun } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BeamProject, MaterialProperties, Load, DiagramPoint, Reactions } from './types';

interface ProjectManagementProps {
  beamLength: number;
  beamHeight: number;
  beamWidth: number;
  materialProps: MaterialProperties;
  loads: Load[];
  startSupportPosition: number;
  endSupportPosition: number;
  startSupport: 'pin' | 'roller' | 'fixed' | 'free';
  endSupport: 'pin' | 'roller' | 'fixed' | 'free';
  reactions: Reactions;
  diagramData: DiagramPoint[];
  showStressInfo: boolean;
  showLoadHelp: boolean;
  setBeamLength: React.Dispatch<React.SetStateAction<number>>;
  setBeamHeight: React.Dispatch<React.SetStateAction<number>>;
  setBeamWidth: React.Dispatch<React.SetStateAction<number>>;
  setMaterialProps: React.Dispatch<React.SetStateAction<MaterialProperties>>;
  setLoads: React.Dispatch<React.SetStateAction<Load[]>>;
  setStartSupportPosition: React.Dispatch<React.SetStateAction<number>>;
  setEndSupportPosition: React.Dispatch<React.SetStateAction<number>>;
  setStartSupport: React.Dispatch<React.SetStateAction<'pin' | 'roller' | 'fixed' | 'free'>>;
  setEndSupport: React.Dispatch<React.SetStateAction<'pin' | 'roller' | 'fixed' | 'free'>>;
  setReactions: React.Dispatch<React.SetStateAction<Reactions>>;
  setDiagramData: React.Dispatch<React.SetStateAction<DiagramPoint[]>>;
  setShowStressInfo: React.Dispatch<React.SetStateAction<boolean>>;
  setShowLoadHelp: React.Dispatch<React.SetStateAction<boolean>>;
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({
  beamLength,
  beamHeight,
  beamWidth,
  materialProps,
  loads,
  startSupportPosition,
  endSupportPosition,
  startSupport,
  endSupport,
  reactions,
  diagramData,
  showStressInfo,
  showLoadHelp,
  setBeamLength,
  setBeamHeight,
  setBeamWidth,
  setMaterialProps,
  setLoads,
  setStartSupportPosition,
  setEndSupportPosition,
  setStartSupport,
  setEndSupport,
  setReactions,
  setDiagramData,
  setShowStressInfo,
  setShowLoadHelp,
}) => {
  const [projects, setProjects] = useState<BeamProject[]>(() => {
    const savedProjects = localStorage.getItem('beamProjects');
    return savedProjects ? JSON.parse(savedProjects) : [];
  });
  const [currentProject, setCurrentProject] = useState<BeamProject | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');

  // Save projects to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('beamProjects', JSON.stringify(projects));
  }, [projects]);

  // Handle saving a project
  const handleSaveProject = useCallback(() => {
    if (!projectName.trim()) return;

    const newProject: BeamProject = {
      id: uuidv4(),
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
      version: 1
    };

    setProjects(prev => [...prev, newProject]);
    setCurrentProject(newProject);
    setIsProjectModalOpen(false);
    setProjectName('');
  }, [projectName, beamLength, beamHeight, beamWidth, materialProps, loads, startSupport, endSupport, startSupportPosition, endSupportPosition, diagramData, reactions, showStressInfo, showLoadHelp]);

  // Handle loading a project
  const handleLoadProject = useCallback((project: BeamProject) => {
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
    setShowStressInfo(project.showStressInfo);
    setShowLoadHelp(project.showLoadHelp);
    setIsProjectModalOpen(false);
  }, [setBeamLength, setBeamHeight, setBeamWidth, setMaterialProps, setLoads, setStartSupport, setEndSupport, setStartSupportPosition, setEndSupportPosition, setDiagramData, setReactions, setShowStressInfo, setShowLoadHelp]);

  // Handle deleting a project
  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
  }, [currentProject]);

  // Auto-save functionality
  useEffect(() => {
    if (!currentProject) return;

    const autoSaveTimer = setInterval(() => {
      if (currentProject) {
        const updatedProject: BeamProject = {
          ...currentProject,
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
          history: [
            ...currentProject.history,
            {
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
              version: currentProject.version + 1,
              timestamp: new Date(),
              changes: 'Auto-saved changes'
            }
          ],
          updatedAt: new Date()
        };
        setProjects(prevProjects =>
          prevProjects.map(p => p.id === currentProject.id ? updatedProject : p)
        );
        setCurrentProject(updatedProject);
      }
    }, 300000); // Auto-save every 5 minutes

    return () => clearInterval(autoSaveTimer);
  }, [currentProject, beamLength, beamHeight, beamWidth, materialProps, loads, startSupport, endSupport, startSupportPosition, endSupportPosition, diagramData, reactions, showStressInfo, showLoadHelp]);

  // Export project
  const handleExportProject = useCallback(() => {
    if (!currentProject) return;
    
    const projectData = JSON.stringify(currentProject, null, 2);
    const blob = new Blob([projectData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}_v${currentProject.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentProject]);

  // Import project
  const handleImportProject = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedProject = JSON.parse(e.target?.result as string) as BeamProject;
        setProjects(prev => [...prev, importedProject]);
        setCurrentProject(importedProject);
      } catch (error) {
        console.error('Error importing project:', error);
        // Add error handling UI feedback here
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <>
      <div className="flex justify-between items-center p-4 bg-white shadow-sm" role="toolbar" aria-label="Project management">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="btn btn-primary"
            aria-label="Save current project"
          >
            <Save className="w-4 h-4 mr-1" aria-hidden="true" />
            Save Project
          </button>
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="btn btn-secondary"
            aria-label="Load existing project"
          >
            <FolderOpen className="w-4 h-4 mr-1" aria-hidden="true" />
            Load Project
          </button>
        </div>
        <div className="flex items-center space-x-4">
          {currentProject && (
            <div className="text-sm text-gray-600" role="status" aria-live="polite">
              Current Project: {currentProject.name}
            </div>
          )}
        </div>
      </div>
      
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 transition-colors">
            <h2 className="text-xl font-bold mb-4">Project Management</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                placeholder="Enter project name"
              />
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Saved Projects</h3>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
                {projects.map(project => (
                  <div 
                    key={project.id}
                    className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => handleLoadProject(project)}
                  >
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date(project.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!projectName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectManagement;