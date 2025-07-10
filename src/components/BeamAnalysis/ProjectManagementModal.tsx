import React from 'react';
import { Loader2, Save, FolderOpen, FileText } from 'lucide-react';

// Define the props for the modal
interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onLoad: (project: any) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  projects: any[];
  isSaving: boolean;
  isLoadingProject: boolean;
}

const ProjectManagementModal: React.FC<ProjectManagementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onLoad,
  projectName,
  setProjectName,
  projects,
  isSaving,
  isLoadingProject,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 transition-colors">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Project Management</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            placeholder="Enter project name"
          />
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Saved Projects</h3>
          <div className="max-h-48 overflow-y-auto border dark:border-gray-600 rounded">
            {projects.map(project => (
              <div
                key={project.id}
                className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => onLoad(project)}
              >
                <div>
                  <div className="font-medium dark:text-gray-200">{project.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(project.updatedAt).toLocaleString()}
                  </div>
                </div>
                {isLoadingProject ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={isSaving || !projectName.trim()}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" aria-hidden="true" />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagementModal; 