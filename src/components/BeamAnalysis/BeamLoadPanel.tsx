import React from 'react';
import { Load } from './types';
import { Info, Plus, Box, BarChart2, Sun, Ruler } from 'lucide-react';

interface BeamLoadPanelProps {
  loads: Load[];
  setLoads: (loads: Load[]) => void;
  addLoad: () => void;
  updateLoad: (id: number, field: keyof Load, value: number | string | undefined) => void;
  showLoadHelp: boolean;
  setShowLoadHelp: (show: boolean) => void;
  beamLength: number;
}

const BeamLoadPanel: React.FC<BeamLoadPanelProps> = ({
  loads,
  setLoads,
  addLoad,
  updateLoad,
  showLoadHelp,
  setShowLoadHelp,
  beamLength,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Box className="w-6 h-6 text-red-500" />
          Applied Loads
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLoadHelp(!showLoadHelp)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            title="Load Help"
            aria-label="Show load help"
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={addLoad}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            aria-label="Add new load"
          >
            <Plus className="w-5 h-5" />
            Add New Load
          </button>
        </div>
      </div>
      {showLoadHelp && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Load Types Guide</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-700">Point Load</p>
              <p className="text-gray-600 dark:text-gray-300">Concentrated force at a specific point (kN)</p>
            </div>
            <div>
              <p className="font-medium text-blue-700">Distributed Load</p>
              <p className="text-gray-600 dark:text-gray-300">Force spread over a length (kN/m)</p>
            </div>
            <div>
              <p className="font-medium text-blue-700">Moment</p>
              <p className="text-gray-600 dark:text-gray-300">Rotational force (kN⋅m)</p>
            </div>
            <div>
              <p className="font-medium text-blue-700">Torsion</p>
              <p className="text-gray-600 dark:text-gray-300">Twisting force (kN⋅m)</p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {loads.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No loads applied yet. Click "Add New Load" to start.</p>
          </div>
        ) : (
          loads.map(load => (
            <div
              key={load.id}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="relative group">
                <select
                  value={load.type}
                  onChange={e => updateLoad(load.id, 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="point">Point Load</option>
                  <option value="distributed">Distributed Load</option>
                  <option value="moment">Moment</option>
                  <option value="torsion">Torsion</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {load.type === 'point' && <Box className="w-5 h-5 text-blue-500" />}
                  {load.type === 'distributed' && <BarChart2 className="w-5 h-5 text-green-500" />}
                  {load.type === 'moment' && <Sun className="w-5 h-5 text-purple-500" />}
                  {load.type === 'torsion' && <Ruler className="w-5 h-5 text-orange-500" />}
                </div>
              </div>
              <div className="relative group">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Position (m)</label>
                <input
                  type="number"
                  value={load.position ?? ''}
                  onChange={e => updateLoad(load.id, 'position', Number(e.target.value))}
                  min="0"
                  max={beamLength}
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    Position along beam length
                  </div>
                </div>
              </div>
              <div className="relative group">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {load.type === 'point' ? 'Force (kN)' :
                   load.type === 'distributed' ? 'Load (kN/m)' :
                   load.type === 'moment' ? 'Moment (kN⋅m)' :
                   'Torque (kN⋅m)'}
                </label>
                <input
                  type="number"
                  value={load.magnitude ?? ''}
                  onChange={e => updateLoad(load.id, 'magnitude', Number(e.target.value))}
                  step="0.1"
                  min="-1000"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    Enter a non-zero value
                  </div>
                </div>
              </div>
              <div className="relative group">
                {load.type === 'distributed' && (
                  <>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Length (m)</label>
                    <input
                      type="number"
                      value={load.length ?? ''}
                      onChange={e => updateLoad(load.id, 'length', Number(e.target.value))}
                      min="0.1"
                      max={beamLength - (load.position ?? 0)}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </>
                )}
                {load.type === 'moment' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">(applied at position)</span>
                )}
                {load.type === 'torsion' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">(applied at position)</span>
                )}
              </div>
              {/* Optionally, add a delete button for each load */}
              {/* <button onClick={() => ...} className="text-red-500 hover:text-red-700">Delete</button> */}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BeamLoadPanel; 