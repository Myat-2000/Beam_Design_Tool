import React, { useState, useEffect } from 'react';
import {
  calcEffectiveDepth,
  flexuralDesign,
  selectBars,
  calcActualEffectiveDepth,
  shearDesign,
  calculateMomentCapacity,
  BeamReinforcementInput,
  E_s,
  torsionDesign,
  TorsionDesignResult,
} from './BeamReinforcementCalculations';
import { BarChart2, Settings, Ruler, Zap, Shield, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import BeamCrossSection from './BeamCrossSection';
import BeamSideView from './BeamSideView';

interface BeamReinforcementDesignProps {
  width?: number;
  height?: number;
  M_u?: number;
  V_u?: number;
}

const defaultInput: BeamReinforcementInput = {
  f_c: 28, // ACI 318-19 Section 19.2.1.1 - Standard concrete strength
  f_y: 420, // ACI 318-19 Section 20.2.2.2 - Grade 60 reinforcement
  b: 300,
  h: 600,
  cover: 40, // ACI 318-19 Section 20.6.1.3.1 - Minimum cover
  stirrup_dia: 10,
  tension_bar_dia: 25,
  M_u: 350e6,
  V_u: 250e3,
  bar_areas: { 10: 71, 16: 199, 20: 314, 25: 491, 28: 616, 32: 804 },
  stirrup_sizes: [8, 10, 12],
  // ACI 318-19 Section 21.2.2 - Strength reduction factors
  phi_flexure: 0.9, // Tension controlled (εt ≥ 0.005)
  phi_shear: 0.75, // Shear and torsion
  phi_torsion: 0.75, // Shear and torsion
  T_u: 0, // Factored torsion (N·mm)
};

const availableBarSizes = Object.keys(defaultInput.bar_areas).map(Number);
const availableStirrupSizes = defaultInput.stirrup_sizes;

const BeamReinforcementDesign: React.FC<BeamReinforcementDesignProps> = ({ width, height, M_u, V_u }) => {
  const [input, setInput] = useState<BeamReinforcementInput>({
    ...defaultInput,
    stirrup_spacing: defaultInput.stirrup_spacing ?? 100,
    b: width ?? defaultInput.b,
    h: height ?? defaultInput.h,
    M_u: M_u ?? defaultInput.M_u,
    V_u: V_u ?? defaultInput.V_u,
    tension_bar_dia: defaultInput.tension_bar_dia,
  });
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [compBarDia, setCompBarDia] = useState<number>(availableBarSizes[0]);
  const [stirrupDia, setStirrupDia] = useState<number>(availableStirrupSizes[0]);
  const [showSteps, setShowSteps] = useState(false);
  const [showCompliance, setShowCompliance] = useState(true);
  const [torsionResult, setTorsionResult] = useState<TorsionDesignResult | null>(null);
  const [useSideBars, setUseSideBars] = useState(false);
  const [sideBarDia, setSideBarDia] = useState(16);

  useEffect(() => {
    setInput(prev => ({
      ...prev,
      b: width ?? prev.b,
      h: height ?? prev.h,
      M_u: M_u ?? prev.M_u,
      V_u: V_u ?? prev.V_u,
    }));
  }, [width, height, M_u, V_u]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleBarSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInput(prev => ({ ...prev, tension_bar_dia: Number(e.target.value) }));
  };

  const handleCompBarSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompBarDia(Number(e.target.value));
  };

  const handleStirrupSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStirrupDia(Number(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Step 2: Effective depth
      const d = calcEffectiveDepth(input.h, input.cover, stirrupDia, input.tension_bar_dia);
      // Step 3: Flexural design
      const flexural = flexuralDesign(input.f_c, input.f_y, input.b, d, input.M_u, input.phi_flexure);
      // Step 4: Select tension bars (use only selected bar size, allow multiple layers)
      const bar_area = input.bar_areas[input.tension_bar_dia];
      if (!bar_area) throw new Error('Selected bar size not available');
      let n_bars = Math.ceil(flexural.A_s_req / bar_area);
      let clear_spacing = Math.max(25, input.tension_bar_dia);
      let fit = false;
      let n_layers = 1;
      let bars_per_layer = n_bars;
      let width_required = 0;
      if (useSideBars) {
        // Always reserve 2 side bars per layer (if n_bars >= 2)
        const side_bar_area = input.bar_areas[sideBarDia];
        if (!side_bar_area) throw new Error('Selected side bar size not available');
        // For now, only support 1 layer for simplicity (can extend to multilayer)
        n_layers = 1;
        let n_side_bars = 2;
        let n_main_bars = Math.max(n_bars - n_side_bars, 0);
        let A_s_side = n_side_bars * side_bar_area;
        let A_s_main = Math.max(flexural.A_s_req - A_s_side, 0);
        let n_main_bars_needed = Math.ceil(A_s_main / bar_area);
        bars_per_layer = n_main_bars_needed + n_side_bars;
        width_required = 2 * input.cover + 2 * stirrupDia + n_main_bars_needed * input.tension_bar_dia + n_side_bars * sideBarDia + (bars_per_layer - 1) * clear_spacing;
        if (width_required <= input.b) {
          fit = true;
          n_bars = n_main_bars_needed + n_side_bars;
        }
        if (!fit) throw new Error('Cannot fit bars in width with side bars - increase b or use smaller bars');
      } else {
        for (let layers = 1; layers <= 4; layers++) {
          const bars_in_layer = Math.ceil(n_bars / layers);
          width_required = 2 * input.cover + 2 * stirrupDia + bars_in_layer * input.tension_bar_dia + (bars_in_layer - 1) * clear_spacing;
          if (width_required <= input.b) {
            fit = true;
            n_layers = layers;
            bars_per_layer = bars_in_layer;
            break;
          }
        }
        if (!fit) throw new Error('Cannot fit bars in width even with multiple layers - increase b or use smaller bars');
      }
      let A_s_prov = n_bars * bar_area;
      if (useSideBars && sideBarDia && input.bar_areas[sideBarDia]) {
        const side_bar_area = input.bar_areas[sideBarDia];
        A_s_prov += 2 * side_bar_area; // Add two side bars
      }
      const tension = {
        bar_dia: input.tension_bar_dia,
        n_bars,
        A_s_prov,
        width_required,
        n_layers,
        bars_per_layer,
        useSideBars,
        sideBarDia: useSideBars ? sideBarDia : undefined,
      };
      // Step 5: Update effective depth
      const d_actual = calcActualEffectiveDepth(input.h, input.cover, stirrupDia, tension.bar_dia);
      // Step 6: Shear design (use only selected stirrup size)
      const shear = shearDesign(input.f_c, input.f_y, input.b, d_actual, input.V_u, stirrupDia, input.phi_shear);

      // Use user-provided stirrup spacing if available and valid, otherwise use calculated
      let stirrup_spacing = shear.s;
      let spacing_note = '';
      if (typeof input.stirrup_spacing === 'number' && input.stirrup_spacing > 0) {
        // Validate user input against code min/max
        const minSpacing = 20;
        const maxSpacing = 600;
        if (input.stirrup_spacing < minSpacing) {
          stirrup_spacing = minSpacing;
          spacing_note = `Minimum allowed spacing is ${minSpacing} mm.`;
        } else if (input.stirrup_spacing > maxSpacing) {
          stirrup_spacing = maxSpacing;
          spacing_note = `Maximum allowed spacing is ${maxSpacing} mm.`;
        } else {
          stirrup_spacing = input.stirrup_spacing;
          if (Math.abs(stirrup_spacing - (shear.s ?? 0)) > 1) {
            spacing_note = `User spacing: ${stirrup_spacing} mm, recommended: ${(shear.s ?? 0).toFixed(1)} mm.`;
          }
        }
      }

      // Calculate V_n (shear capacity provided by stirrups + concrete) using the selected spacing
      let V_n = 0;
      if (
        shear &&
        typeof stirrup_spacing === 'number' && stirrup_spacing > 0 &&
        typeof shear.A_v === 'number' && shear.A_v > 0
      ) {
        const V_s = shear.A_v * input.f_y * d_actual / stirrup_spacing;
        const V_c = 0.17 * Math.sqrt(input.f_c) * input.b * d_actual;
        V_n = (V_c + V_s) * input.phi_shear;
      }
      // Step 7: Compression reinforcement if needed
      let comp = { bar_dia: 0, n_bars: 0, A_s_prov: 0, width_required: 0, n_comp_layers: 1, comp_bars_per_layer: 0 };
      let d_prime_actual = 0;
      if (flexural.is_doubly && flexural.A_s_prime > 0) {
        // Use only selected compression bar size, allow multiple layers
        const comp_bar_area = input.bar_areas[compBarDia];
        if (!comp_bar_area) throw new Error('Selected compression bar size not available');
        const n_comp_bars = Math.ceil(flexural.A_s_prime / comp_bar_area);
        const comp_clear_spacing = Math.max(25, compBarDia);
        let fit = false;
        let n_comp_layers = 1;
        let comp_bars_per_layer = n_comp_bars;
        let comp_width_required = 0;
        for (let layers = 1; layers <= 4; layers++) {
          const bars_in_layer = Math.ceil(n_comp_bars / layers);
          comp_width_required = 2 * input.cover + 2 * stirrupDia + bars_in_layer * compBarDia + (bars_in_layer - 1) * comp_clear_spacing;
          if (comp_width_required <= input.b) {
            fit = true;
            n_comp_layers = layers;
            comp_bars_per_layer = bars_in_layer;
            break;
          }
        }
        if (!fit) throw new Error('Cannot fit compression bars in width even with multiple layers - increase b or use smaller bars');
        const A_s_comp_prov = n_comp_bars * comp_bar_area;
        comp = {
          bar_dia: compBarDia,
          n_bars: n_comp_bars,
          A_s_prov: A_s_comp_prov,
          width_required: comp_width_required,
          n_comp_layers,
          comp_bars_per_layer,
        };
        d_prime_actual = input.cover + stirrupDia + comp.bar_dia / 2;
      }
      // Step 8: Moment capacity verification
      const { phiM_n, eps_t } = calculateMomentCapacity(
        input.b,
        d_actual,
        d_prime_actual,
        tension.A_s_prov,
        comp.A_s_prov,
        input.f_c,
        input.f_y,
        input.phi_flexure
      );
      const capacity_ratio = phiM_n / input.M_u;
      // Step 9: Torsion design (if T_u > 0)
      if (input.T_u && input.T_u > 0) {
        const torsion = torsionDesign(
          input.f_c,
          input.f_y,
          input.b,
          input.h,
          input.T_u,
          stirrupDia,
          input.phi_torsion
        );
        setTorsionResult(torsion);
      } else {
        setTorsionResult(null);
      }
      setResults({
        d,
        ...flexural,
        ...tension,
        d_actual,
        ...shear,
        stirrup_spacing, // add the used spacing
        spacing_note, // add note for user
        V_n,
        comp,
        d_prime_actual,
        phiM_n,
        eps_t,
        capacity_ratio,
        is_doubly: flexural.is_doubly,
      });
    } catch (err: any) {
      setResults(null);
      setTorsionResult(null);
      setError(err.message || 'Calculation error');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mt-12 transition-colors">
      <div className="flex items-center mb-6">
        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
        <BarChart2 className="w-6 h-6 text-yellow-500 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reinforced Concrete Beam Design</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Input Form */}
        <div className="lg:col-span-4">
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 relative">
            <button
              type="button"
              aria-label={showCompliance ? 'Hide compliance info' : 'Show compliance info'}
              onClick={() => setShowCompliance((v) => !v)}
              className="absolute top-3 right-3 text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white transition-colors"
            >
              {showCompliance ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>ACI 318-19 Compliance:</strong> All calculations follow ACI 318-19 Building Code Requirements for Structural Concrete.
            </p>
            <div
              className={`mt-2 text-xs text-blue-700 dark:text-blue-300 transition-all duration-300 overflow-hidden ${showCompliance ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
              style={{ transitionProperty: 'max-height, opacity' }}
            >
              <p><strong>Verified Sections:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Section 22.2.2.4.1 - Flexural strength calculation</li>
                <li>Section 9.6.1.2 - Minimum and maximum steel ratios</li>
                <li>Section 22.5.5.1 - Shear strength calculation</li>
                <li>Section 21.2.2 - Strength reduction factors</li>
                <li>Section 22.5.10.5.3 - Shear reinforcement design</li>
                <li>Section 9.7.6.2.2 - Spacing requirements</li>
              </ul>
            </div>
          </div>
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Note:</strong> Input values are now displayed in engineering units (kN·m for moments, kN for shear) for easier input. 
              The values are automatically converted to the required units for ACI calculations.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            {/* Dimensions Section */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors mb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-blue-500" /> Dimensions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Width (mm)</label>
                  <input
                    type="number"
                    name="b"
                    value={input.b}
                    onChange={handleChange}
                    min={10}
                    step={1}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Width (mm)"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Beam width</span>
                </div>
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height (mm)</label>
                  <input
                    type="number"
                    name="h"
                    value={input.h}
                    onChange={handleChange}
                    min={10}
                    step={1}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Height (mm)"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Beam height</span>
                </div>
              </div>
            </section>
            {/* Material Properties Section */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors mb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-500" /> Material Properties
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Concrete Strength f<sub>c</sub> (MPa)</label>
                  <input
                    type="number"
                    name="f_c"
                    value={input.f_c}
                    onChange={handleChange}
                    min={1}
                    step={1}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Concrete strength (MPa)"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Cylinder compressive strength</span>
                </div>
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Steel Yield Strength f<sub>y</sub> (MPa)</label>
                  <input
                    type="number"
                    name="f_y"
                    value={input.f_y}
                    onChange={handleChange}
                    min={1}
                    step={1}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Steel yield strength (MPa)"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Rebar yield strength</span>
                </div>
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cover (mm)</label>
                  <input
                    type="number"
                    name="cover"
                    value={input.cover}
                    onChange={handleChange}
                    min={0}
                    step={1}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Concrete cover (mm)"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Distance from surface to main bars</span>
                </div>
              </div>
            </section>
            {/* Loads Section */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors mb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-500" /> Loads
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Factored Moment M<sub>u</sub> (kN·m)</label>
                  <input
                    type="number"
                    name="M_u"
                    value={input.M_u !== undefined && input.M_u !== null ? (input.M_u / 1e6).toFixed(2) : ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setInput(prev => ({ ...prev, M_u: value * 1e6 }));
                    }}
                    min={0}
                    step={0.01}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Factored moment (kN·m)"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Maximum bending moment</span>
                </div>
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Factored Shear V<sub>u</sub> (kN)</label>
                  <input
                    type="number"
                    name="V_u"
                    value={input.V_u !== undefined && input.V_u !== null ? (input.V_u / 1e3).toFixed(2) : ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setInput(prev => ({ ...prev, V_u: value * 1e3 }));
                    }}
                    min={0}
                    step={0.01}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Factored shear (kN)"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Maximum shear force</span>
                </div>
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Factored Torsion T<sub>u</sub> (kN·m)</label>
                  <input
                    type="number"
                    name="T_u"
                    value={input.T_u !== undefined && input.T_u !== null ? (input.T_u / 1e6).toFixed(2) : ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setInput(prev => ({ ...prev, T_u: value * 1e6 }));
                    }}
                    min={0}
                    step={0.01}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Factored torsion (kN·m)"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Maximum torsional moment</span>
                </div>
              </div>
            </section>
            {/* Reinforcement Details Section (already improved) */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 mt-4 mb-2">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2 border-b border-gray-300 dark:border-gray-600 pb-2">
                <BarChart2 className="w-5 h-5" />
                Reinforcement Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1" htmlFor="stirrup_dia">
                    Stirrup (mm)
                    <span className="text-xs text-gray-400 ml-1" title="Diameter of stirrup bars">?</span>
                  </label>
                  <select
                    id="stirrup_dia"
                    name="stirrup_dia"
                    value={String(stirrupDia)}
                    onChange={handleStirrupSizeChange}
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gray-400 dark:border-gray-600"
                  >
                    {availableStirrupSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Transverse reinforcement</span>
                </div>
                {/* Stirrup Spacing Input - Improved UI, no Reset button, more prominent */}
                <div className="flex flex-col gap-1 relative">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1" htmlFor="stirrup_spacing">
                    <Ruler className="inline w-4 h-4 text-blue-500" />
                    Stirrup Spacing (mm)
                    <span className="text-xs text-gray-400 ml-1 cursor-pointer" title="Spacing between stirrups (center to center). Code: 20–600 mm. Leave blank for recommended.">?</span>
                  </label>
                  <input
                    id="stirrup_spacing"
                    type="number"
                    name="stirrup_spacing"
                    value={input.stirrup_spacing ?? ''}
                    onChange={handleChange}
                    placeholder="e.g. 150"
                    className={`w-full px-4 py-3 text-lg rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gray-400 dark:border-gray-600 ${typeof input.stirrup_spacing === 'number' && (input.stirrup_spacing < 20 || input.stirrup_spacing > 600) ? 'border-red-500 bg-red-50 dark:bg-red-900' : ''}`}
                    min={20}
                    max={600}
                    step={1}
                  />
                  {/* Warning message for invalid input */}
                  {typeof input.stirrup_spacing === 'number' && (input.stirrup_spacing < 20 || input.stirrup_spacing > 600) && (
                    <span className="text-xs text-red-600 mt-1">Spacing must be between 20 and 600 mm.</span>
                  )}
                  <span className="text-xs text-gray-500 mt-1">Spacing between stirrups (center to center). Code: 20–600 mm. Leave blank for recommended.</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1" htmlFor="tension_bar_dia">
                    Tension Bar (mm)
                    <span className="text-xs text-gray-400 ml-1" title="Diameter of main tension bars">?</span>
                  </label>
                  <select
                    id="tension_bar_dia"
                    name="tension_bar_dia"
                    value={String(input.tension_bar_dia)}
                    onChange={handleBarSizeChange}
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gray-400 dark:border-gray-600"
                  >
                    {availableBarSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Main bottom bars</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={`text-sm font-medium flex items-center gap-1 ${results && results.is_doubly ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`} htmlFor="comp_bar_dia">
                    Comp. Bar (mm)
                    <span className="text-xs text-gray-400 ml-1" title="Diameter of compression bars">?</span>
                  </label>
                  <select
                    id="comp_bar_dia"
                    name="comp_bar_dia"
                    value={String(compBarDia)}
                    onChange={handleCompBarSizeChange}
                    className={`w-full px-4 py-3 text-lg rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gray-400 dark:border-gray-600 ${results && results.is_doubly ? 'border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}
                    disabled={!results || !results.is_doubly}
                  >
                    {availableBarSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Top bars (only if doubly reinforced)</span>
                </div>
              </div>
            </div>
            {/* Reduction Factors */}
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Reduction Factors (φ) - ACI 318-19
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-blue-700 dark:text-blue-300">φ Flexure</label>
                  <input type="number" name="phi_flexure" value={input.phi_flexure} onChange={handleChange} step="0.01" min="0.65" max="0.9" className="w-full px-2 py-1 text-sm rounded border border-blue-300 dark:border-blue-600 dark:bg-blue-600/20 dark:text-blue-100 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-blue-700 dark:text-blue-300">φ Shear</label>
                  <input type="number" name="phi_shear" value={input.phi_shear} onChange={handleChange} step="0.01" min="0.75" max="0.75" className="w-full px-2 py-1 text-sm rounded border border-blue-300 dark:border-blue-600 dark:bg-blue-600/20 dark:text-blue-100 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-blue-700 dark:text-blue-300">φ Torsion</label>
                  <input type="number" name="phi_torsion" value={input.phi_torsion} onChange={handleChange} step="0.01" min="0.75" max="0.75" className="w-full px-2 py-1 text-sm rounded border border-blue-300 dark:border-blue-600 dark:bg-blue-600/20 dark:text-blue-100 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="md:col-span-2 mt-2">
              <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Modern toggle switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="useSideBars"
                        checked={useSideBars}
                        onChange={e => setUseSideBars(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-all duration-200"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform duration-200"></div>
                    </label>
                    <label htmlFor="useSideBars" className="font-semibold text-blue-800 dark:text-blue-200 text-lg cursor-pointer select-none">
                      Include Side Bars <span className="font-normal text-base">(Longitudinal Bars at Sides)</span>
                    </label>
                  </div>
                  <span className="ml-2 text-blue-600 dark:text-blue-300 text-xs cursor-help flex items-center" title="Side bars are recommended for wide beams, improved crack control, and code compliance. They are placed near the sides inside the stirrups.">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
                    Why?
                  </span>
                </div>
                <div className="ml-7 mt-1 flex items-center gap-3">
                  {useSideBars && (
                    <>
                      <label htmlFor="sideBarDia" className="font-medium text-blue-800 dark:text-blue-200">Side bar diameter (mm):</label>
                      <input
                        type="number"
                        id="sideBarDia"
                        min={6}
                        max={40}
                        step={1}
                        value={sideBarDia}
                        onChange={e => setSideBarDia(Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-blue-200 dark:border-blue-700 rounded bg-gray-50 dark:bg-gray-800 dark:text-blue-100 focus:ring-2 focus:ring-blue-400"
                      />
                    </>
                  )}
                </div>
                <div className="ml-7 mt-1 text-xs text-blue-700 dark:text-blue-300 max-w-xl">
                  <span>
                    <b>Tip:</b> Side bars are especially important for beams wider than 300 mm, for torsion, or where enhanced crack control is needed. If unchecked, all bars will be distributed as main bars only.
                  </span>
                </div>
              </div>
            </div>
          </form>
          <button type="submit" onClick={handleSubmit} className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors font-semibold text-lg mb-4" disabled={typeof input.stirrup_spacing === 'number' && (input.stirrup_spacing < 20 || input.stirrup_spacing > 600)}>Calculate</button>
          {error && <div className="text-red-500 mb-4">{error}</div>}
        </div>
        {/* Right Side: Results and Visualization */}
        <div className="lg:col-span-8">
          {results && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-2xl mt-4 transition-colors flex flex-col items-center w-full">
                <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">Cross-Section Visualization</h3>
                <div className="w-full flex justify-center items-center" style={{ minHeight: 480 }}>
                  <BeamCrossSection
                    width={input.b}
                    height={input.h}
                    cover={input.cover}
                    bar_dia={results.bar_dia}
                    n_bars={results.n_bars}
                    stirrup_dia={stirrupDia}
                    comp_bar_dia={results.comp && results.comp.bar_dia ? results.comp.bar_dia : undefined}
                    n_comp_bars={results.comp && results.comp.n_bars ? results.comp.n_bars : undefined}
                    stirrup_positions={[600, 1400, 1800]}
                    n_layers={results.n_layers}
                    bars_per_layer={results.bars_per_layer}
                    n_comp_layers={results.comp && results.comp.n_comp_layers ? results.comp.n_comp_layers : undefined}
                    comp_bars_per_layer={results.comp && results.comp.comp_bars_per_layer ? results.comp.comp_bars_per_layer : undefined}
                    show_torsion_bars={!!torsionResult}
                    n_torsion_legs={torsionResult ? torsionResult.n_legs : 0}
                    torsion_bar_dia={16}
                    useSideBars={useSideBars}
                    sideBarDia={useSideBars ? sideBarDia : undefined}
                  />
                </div>
              </div>
              {/* Grouped Results Sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-6 mt-6">
                {/* Total Design Summary */}
                <div className="bg-white dark:bg-gray-900 border border-blue-400 dark:border-blue-700 rounded-xl p-4 shadow flex flex-col">
                  <h4 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-3">Total Design Summary</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
                    <li><span className="font-semibold">Section:</span> {input.b} × {input.h} mm</li>
                    <li><span className="font-semibold">Concrete Strength (f&#39;c):</span> {input.f_c} MPa</li>
                    <li><span className="font-semibold">Steel Yield Strength (f<sub>y</sub>):</span> {input.f_y} MPa</li>
                    <li><span className="font-semibold">Cover:</span> {input.cover} mm</li>
                    <li className="pt-2 border-t border-blue-100 dark:border-blue-800"><span className="font-semibold">Capacity Ratio:</span> <span className="font-bold text-pink-700 dark:text-pink-300">{results.capacity_ratio.toFixed(4)}</span></li>
                    <li><span className="font-semibold">Moment Capacity (φM<sub>n</sub>):</span> {(results.phiM_n / 1e6).toFixed(2)} kN·m</li>
                    <li><span className="font-semibold">Required Moment (M<sub>u</sub>):</span> {(input.M_u / 1e6).toFixed(2)} kN·m</li>
                  </ul>
                </div>
                {/* Flexural Design Details */}
                <div className="bg-white dark:bg-gray-900 border border-blue-400 dark:border-blue-700 rounded-xl p-4 shadow flex flex-col">
                  <h4 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-3">Flexural Design</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
                    <li><span className="font-semibold">Required A<sub>s</sub>:</span> {results.A_s_req.toFixed(2)} mm²</li>
                    <li><span className="font-semibold">Provided A<sub>s</sub>:</span> {results.A_s_prov.toFixed(2)} mm²</li>
                    <li><span className="font-semibold">Bar Size:</span> {results.bar_dia} mm</li>
                    <li><span className="font-semibold">Number of Bars:</span> {results.n_bars}</li>
                    <li><span className="font-semibold">Layers:</span> {results.n_layers}</li>
                    <li><span className="font-semibold">Bars/Layer:</span> {results.bars_per_layer}</li>
                  </ul>
                </div>
                {/* Shear Design Details */}
                <div className="bg-white dark:bg-gray-900 border border-blue-400 dark:border-blue-700 rounded-xl p-4 shadow flex flex-col">
                  <h4 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-3">Shear Design</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
                    <li><span className="font-semibold">Stirrup Size:</span> {stirrupDia} mm</li>
                    <li><span className="font-semibold">Spacing:</span> {results.stirrup_spacing ? results.stirrup_spacing.toFixed(1) : 'N/A'} mm
                      {results.spacing_note && <span className="text-xs text-yellow-700 ml-2">({results.spacing_note})</span>}
                    </li>
                    <li><span className="font-semibold">Shear Capacity:</span> {(results.V_n / 1e3).toFixed(2)} kN</li>
                    <li><span className="font-semibold">Required Shear:</span> {(input.V_u / 1e3).toFixed(2)} kN</li>
                  </ul>
                  {results.shear && results.shear.message && results.shear.message.length > 0 && (
                    <div className="mt-2 text-blue-800 dark:text-blue-100 text-xs">{results.shear.message}</div>
                  )}
                </div>
                {/* Torsion Design Details */}
                {torsionResult && (
                  <div className="bg-white border border-blue-400 rounded-xl p-4 shadow flex flex-col" style={{ marginBottom: 16 }}>
                    <h4 className="text-lg font-bold text-blue-700 mb-3">Torsion Design</h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li><span className="font-semibold">Stirrup Area/Leg (A<sub>t</sub>):</span> {torsionResult.A_t_min.toFixed(2)} mm²</li>
                      <li><span className="font-semibold">Stirrup Spacing (Shear):</span> {results.shear && results.shear.s ? results.shear.s.toFixed(1) : 'N/A'} mm</li>
                      <li><span className="font-semibold">Stirrup Spacing (Torsion, s<sub>t</sub>):</span> {torsionResult.s_t.toFixed(2)} mm</li>
                      <li><span className="font-semibold">Number of Legs:</span> {torsionResult.n_legs}</li>
                      <li><span className="font-semibold">Longitudinal Torsion Steel (A<sub>lt</sub>):</span> {torsionResult.A_lt.toFixed(2)} mm²</li>
                    </ul>
                    {torsionResult.message && <div className="mt-2 text-blue-800 text-xs">{torsionResult.message}</div>}
                  </div>
                )}
                {/* Hooks Design Details */}
                <div className="bg-white dark:bg-gray-900 border border-blue-400 dark:border-blue-700 rounded-xl p-4 shadow flex flex-col" style={{ marginBottom: 16 }}>
                  <h4 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-3">Hooks Design</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
                    <li><span className="font-semibold">Hook Type:</span> 135° standard (beam stirrup)</li>
                    <li><span className="font-semibold">Minimum Bend Diameter:</span> {Math.max(8 * stirrupDia, 32)} mm</li>
                    <li><span className="font-semibold">Hook Extension (tail):</span> {Math.max(6 * stirrupDia, 60)} mm</li>
                  </ul>
                  <div className="mt-2 text-blue-800 dark:text-blue-200 text-xs">Per ACI 318: 135° hooks, min bend 8d, min tail 6d or 60 mm</div>
                </div>
              </div>
              {/* Calculation Steps Section */}
              {showSteps && results && (
                <div className="bg-white dark:bg-gray-900 border border-blue-400 dark:border-blue-700 rounded-xl p-4 shadow flex flex-col mt-6">
                  <h4 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Calculator className="w-5 h-5" /> Calculation Steps with Equations
                  </h4>
                  <div className="space-y-6">
                    {/* ACI 318-19 Reference */}
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">ACI 318-19 Standards Applied</h3>
                      <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <p><strong>Flexural Design:</strong> Section 22.2.2.4.1</p>
                        <p><strong>Shear Design:</strong> Section 22.5.5.1</p>
                        <p><strong>Torsion Design:</strong> Section 22.7.5.1</p>
                        <p><strong>Strength Reduction Factors:</strong> Section 21.2.2</p>
                      </div>
                    </div>
                    {/* Flexural Design Steps */}
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">1. Flexural Design</h3>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border mb-3">
                        <p className="font-mono text-sm mb-2"><strong>Equations Used:</strong></p>
                        <p className="font-mono text-sm mb-2">d = h - cover - stirrup_dia - tension_bar_dia / 2</p>
                        <p className="font-mono text-sm mb-2">A<sub>s,min</sub> = 0.25 × √f<sub>c</sub> / f<sub>y</sub> × b × d</p>
                        <p className="font-mono text-sm mb-2">A<sub>s,max</sub> = 0.85 × β₁ × (f<sub>c</sub> / f<sub>y</sub>) × (0.003/0.005) × b × d</p>
                        <p className="font-mono text-sm mb-2">A<sub>s,req</sub> = (from quadratic: M<sub>u</sub> = φ × A<sub>s</sub> × f<sub>y</sub> × (d - A<sub>s</sub> × f<sub>y</sub> / (1.7 × f<sub>c</sub> × b)))</p>
                        <p className="font-mono text-sm mb-2">a = A<sub>s</sub> × f<sub>y</sub> / (0.85 × f<sub>c</sub> × b)</p>
                        <p className="font-mono text-sm mb-2">φM<sub>n</sub> = φ × 0.85 × f<sub>c</sub> × a × b × (d - a/2)</p>
                        <p className="font-mono text-sm mb-2">(If doubly reinforced) A<sub>s,comp</sub> = (M<sub>u2</sub> / (φ × f<sub>y</sub> × (d - d')))</p>
                        <div className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                          <strong>Parameters:</strong><br/>
                          d: Effective depth (mm)<br/>
                          h: Total depth (mm)<br/>
                          cover: Concrete cover (mm)<br/>
                          stirrup_dia: Stirrup diameter (mm)<br/>
                          tension_bar_dia: Tension bar diameter (mm)<br/>
                          A<sub>s,min</sub>: Minimum steel area (mm²)<br/>
                          A<sub>s,max</sub>: Maximum steel area (mm²)<br/>
                          β₁: Stress block factor<br/>
                          f<sub>c</sub>: Concrete strength (MPa)<br/>
                          f<sub>y</sub>: Steel yield strength (MPa)<br/>
                          b: Width (mm)<br/>
                          φ: Strength reduction factor<br/>
                          a: Depth of equivalent stress block (mm)<br/>
                          d': Effective cover to compression steel (mm)<br/>
                          M<sub>u</sub>: Factored moment (N·mm)<br/>
                          M<sub>u2</sub>: Remaining moment for compression steel (N·mm)
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                          <p className="font-mono text-sm mb-2"><strong>Effective Depth (d):</strong> d = {input.h} - {input.cover} - {stirrupDia} - {input.tension_bar_dia}/2 = {(input.h - input.cover - stirrupDia - input.tension_bar_dia/2).toFixed(2)} mm</p>
                          <p className="font-mono text-sm mb-2"><strong>Minimum Steel (A<sub>s,min</sub>):</strong> {results.A_s_min.toFixed(2)} mm²</p>
                          <p className="font-mono text-sm mb-2"><strong>Maximum Steel (A<sub>s,max</sub>):</strong> {results.A_s_max_singly.toFixed(2)} mm²</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                          <p className="font-mono text-sm mb-2"><strong>Required Steel Area (A<sub>s</sub>):</strong> {results.A_s_req.toFixed(2)} mm²</p>
                          <p className="font-mono text-sm mb-2">Bar Size: {results.bar_dia} mm, Number of Bars: {results.n_bars}</p>
                          <p className="font-mono text-sm mb-2">Layers: {results.n_layers}, Bars/Layer: {results.bars_per_layer}</p>
                          {results.useSideBars && results.sideBarDia && (
                            <p className="font-mono text-sm mb-2 text-green-700 dark:text-green-300">
                              <strong>Provided Steel Area (A<sub>s,prov</sub>):</strong> {results.n_bars} × {results.bar_dia} mm + 2 × {results.sideBarDia} mm side bars = {(results.n_bars * (input.bar_areas[results.bar_dia] || 0) + 2 * (input.bar_areas[results.sideBarDia] || 0)).toFixed(2)} mm²
                            </p>
                          )}
                          {!results.useSideBars && (
                            <p className="font-mono text-sm mb-2">
                              <strong>Provided Steel Area (A<sub>s,prov</sub>):</strong> {results.n_bars} × {results.bar_dia} mm = {(results.n_bars * (input.bar_areas[results.bar_dia] || 0)).toFixed(2)} mm²
                            </p>
                          )}
                        </div>
                        {results.is_doubly && results.comp && (
                          <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                            <p className="font-mono text-sm mb-2"><strong>Compression Steel (A<sub>s,comp</sub>):</strong> {results.comp.A_s_prov.toFixed(2)} mm²</p>
                            <p className="font-mono text-sm mb-2">Bar Size: {results.comp.bar_dia} mm, Number of Bars: {results.comp.n_bars}</p>
                          </div>
                        )}
                        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                          <p className="font-mono text-sm mb-2"><strong>Input Values:</strong></p>
                          <p className="font-mono text-sm mb-2">Required Moment (M<sub>u</sub>): {(input.M_u / 1e6).toFixed(2)} kN·m</p>
                          <p className="font-mono text-sm mb-2">Required Shear (V<sub>u</sub>): {(input.V_u / 1e3).toFixed(2)} kN</p>
                          {input.T_u > 0 && <p className="font-mono text-sm mb-2">Required Torsion (T<sub>u</sub>): {(input.T_u / 1e6).toFixed(2)} kN·m</p>}
                          <p className="font-mono text-sm mb-2"><strong>Results:</strong></p>
                          <p className="font-mono text-sm mb-2">Moment Capacity (φM<sub>n</sub>): {(results.phiM_n / 1e6).toFixed(2)} kN·m</p>
                          <p className="font-mono text-sm mb-2">Capacity Ratio: {results.capacity_ratio.toFixed(4)}</p>
                        </div>
                      </div>
                    </div>
                    {/* Shear Design Steps */}
                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">2. Shear Design</h3>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border mb-3">
                        <p className="font-mono text-sm mb-2"><strong>Equations Used:</strong></p>
                        <p className="font-mono text-sm mb-2">V<sub>c</sub> = 0.17 × √f<sub>c</sub> × b × d</p>
                        <p className="font-mono text-sm mb-2">V<sub>s,req</sub> = (V<sub>u</sub> / φ) - V<sub>c</sub></p>
                        <p className="font-mono text-sm mb-2">A<sub>v</sub> = 2 × (π × (stirrup size / 2)<sup>2</sup>)</p>
                        <p className="font-mono text-sm mb-2">s = (A<sub>v</sub> × f<sub>y</sub> × d) / V<sub>s,req</sub></p>
                        <p className="font-mono text-sm mb-2">s<sub>min</sub> = min[(A<sub>v</sub> × f<sub>y</sub>) / (0.062 × √f<sub>c</sub> × b), (A<sub>v</sub> × f<sub>y</sub>) / (0.35 × b)]</p>
                        <p className="font-mono text-sm mb-2">s<sub>max</sub> = min[d/2, 600] or min[d/4, 300] (depending on V<sub>s,req</sub>)</p>
                        <div className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                          <strong>Parameters:</strong><br/>
                          V<sub>c</sub>: Concrete shear strength (N)<br/>
                          f<sub>c</sub>: Concrete strength (MPa)<br/>
                          b: Width (mm)<br/>
                          d: Effective depth (mm)<br/>
                          V<sub>u</sub>: Factored shear (N)<br/>
                          φ: Strength reduction factor<br/>
                          A<sub>v</sub>: Area of stirrup legs (mm²)<br/>
                          f<sub>y</sub>: Steel yield strength (MPa)<br/>
                          s: Stirrup spacing (mm)<br/>
                          s<sub>min</sub>: Minimum spacing (mm)<br/>
                          s<sub>max</sub>: Maximum spacing (mm)
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                          <p className="font-mono text-sm mb-2"><strong>Stirrup Size:</strong> {stirrupDia} mm</p>
                          <p className="font-mono text-sm mb-2">Spacing: 100 mm</p>
                          <p className="font-mono text-sm mb-2">Shear Capacity: {(results.V_n ? (results.V_n / 1e3).toFixed(2) : 'N/A')} kN</p>
                          <p className="font-mono text-sm mb-2">Required Shear: {(input.V_u / 1e3).toFixed(2)} kN</p>
                        </div>
                      </div>
                    </div>
                    {/* Torsion Design Steps */}
                    {torsionResult && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">3. Torsion Design</h3>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded border mb-3">
                          <p className="font-mono text-sm mb-2"><strong>Equations Used:</strong></p>
                          <p className="font-mono text-sm mb-2">A<sub>t</sub>/s = (T<sub>u</sub> / φ) × p<sub>c</sub> / (2 × f<sub>y</sub> × A<sub>c</sub>)</p>
                          <p className="font-mono text-sm mb-2">A<sub>t</sub> = Area of one stirrup leg (mm²)</p>
                          <p className="font-mono text-sm mb-2">s = Spacing of stirrups (mm)</p>
                          <p className="font-mono text-sm mb-2">A<sub>lt</sub> = 0.42 × (A<sub>c</sub> × f<sub>c</sub>) / f<sub>y</sub></p>
                          <div className="text-xs text-yellow-800 dark:text-yellow-200 mt-2">
                            <strong>Parameters:</strong><br/>
                            T<sub>u</sub>: Factored torsion (N·mm)<br/>
                            φ: Strength reduction factor<br/>
                            p<sub>c</sub>: Perimeter of stirrup centerline (mm)<br/>
                            f<sub>y</sub>: Steel yield strength (MPa)<br/>
                            A<sub>c</sub>: Area enclosed by stirrup centerline (mm²)<br/>
                            f<sub>c</sub>: Concrete strength (MPa)
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                            <p className="font-mono text-sm mb-2"><strong>Stirrup Area/Leg (A<sub>t</sub>):</strong> {torsionResult.A_t_min.toFixed(2)} mm²</p>
                            <p className="font-mono text-sm mb-2"><strong>Stirrup Spacing (Torsion, s<sub>t</sub>):</strong> {torsionResult.s_t.toFixed(2)} mm</p>
                            <p className="font-mono text-sm mb-2"><strong>Number of Legs:</strong> {torsionResult.n_legs}</p>
                            <p className="font-mono text-sm mb-2"><strong>Longitudinal Torsion Steel (A<sub>lt</sub>):</strong> {torsionResult.A_lt.toFixed(2)} mm²</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Hook Design Steps */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">4. Hook Design</h3>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border mb-3">
                        <p className="font-mono text-sm mb-2"><strong>Equations Used:</strong></p>
                        <p className="font-mono text-sm mb-2">Minimum Bend Diameter = max(8 × d<sub>bar</sub>, 32 mm)</p>
                        <p className="font-mono text-sm mb-2">Hook Extension (tail) = max(6 × d<sub>bar</sub>, 60 mm)</p>
                        <div className="text-xs text-yellow-800 dark:text-yellow-200 mt-2">
                          <strong>Parameters:</strong><br/>
                          d<sub>bar</sub>: Stirrup bar diameter (mm)
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                          <p className="font-mono text-sm mb-2"><strong>Minimum Bend Diameter:</strong> {Math.max(8 * stirrupDia, 32)} mm</p>
                          <p className="font-mono text-sm mb-2"><strong>Hook Extension (tail):</strong> {Math.max(6 * stirrupDia, 60)} mm</p>
                          <p className="font-mono text-sm mb-2"><strong>Hook Type:</strong> 135° standard (beam stirrup)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors font-semibold"
                onClick={() => setShowSteps((v) => !v)}
              >
                {showSteps ? 'Hide Calculation Steps' : 'Show Calculation Steps'}
              </button>
            </>
          )}
          {torsionResult && (
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
              <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-200 mb-2">Torsion Reinforcement Design</h3>
              {torsionResult.message && <div className="mb-2 text-yellow-800 dark:text-yellow-100">{torsionResult.message}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Stirrup area per leg (A<sub>t</sub>):</span> {torsionResult.A_t_min.toFixed(1)} mm²
                </div>
                <div>
                  <span className="font-semibold">Stirrup spacing (s<sub>t</sub>):</span> {torsionResult.s_t.toFixed(1)} mm
                </div>
                <div>
                  <span className="font-semibold">Number of legs:</span> {torsionResult.n_legs}
                </div>
                <div>
                  <span className="font-semibold">Longitudinal torsion steel (A<sub>lt</sub>):</span> {torsionResult.A_lt.toFixed(1)} mm²
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BeamReinforcementDesign; 