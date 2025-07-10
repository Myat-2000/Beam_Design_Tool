import { useState, useEffect } from 'react';
import {
  calcEffectiveDepth,
  flexuralDesign,
  selectBars,
  calcActualEffectiveDepth,
  shearDesign,
  calculateMomentCapacity,
  BeamReinforcementInput,
  torsionDesign,
  TorsionDesignResult,
} from './BeamReinforcementCalculations';

const defaultInput: BeamReinforcementInput = {
  f_c: 28,
  f_y: 420,
  b: 300,
  h: 600,
  cover: 40,
  stirrup_dia: 10,
  tension_bar_dia: 25,
  M_u: 350e6,
  V_u: 250e3,
  bar_areas: { 10: 71, 16: 199, 20: 314, 25: 491, 28: 616, 32: 804 },
  stirrup_sizes: [8, 10, 12],
  phi_flexure: 0.9,
  phi_shear: 0.75,
  phi_torsion: 0.75,
  T_u: 0,
};

const availableBarSizes = Object.keys(defaultInput.bar_areas).map(Number);
const availableStirrupSizes = defaultInput.stirrup_sizes;

export function useBeamReinforcementDesign(width?: number, height?: number, M_u?: number, V_u?: number) {
  const [input, setInput] = useState<BeamReinforcementInput>({
    ...defaultInput,
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
      const d = calcEffectiveDepth(input.h, input.cover, stirrupDia, input.tension_bar_dia);
      const flexural = flexuralDesign(input.f_c, input.f_y, input.b, d, input.M_u, input.phi_flexure);
      const bar_area = input.bar_areas[input.tension_bar_dia];
      if (!bar_area) throw new Error('Selected bar size not available');
      let n_bars = Math.ceil(flexural.A_s_req / bar_area);
      let clear_spacing = Math.max(25, input.tension_bar_dia);
      let fit = false;
      let n_layers = 1;
      let bars_per_layer = n_bars;
      let width_required = 0;
      if (useSideBars) {
        const side_bar_area = input.bar_areas[sideBarDia];
        if (!side_bar_area) throw new Error('Selected side bar size not available');
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
      const A_s_prov = n_bars * bar_area;
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
      const d_actual = calcActualEffectiveDepth(input.h, input.cover, stirrupDia, tension.bar_dia);
      const shear = shearDesign(input.f_c, input.f_y, input.b, d_actual, input.V_u, stirrupDia, input.phi_shear);
      let comp = { bar_dia: 0, n_bars: 0, A_s_prov: 0, width_required: 0, n_comp_layers: 1, comp_bars_per_layer: 0 };
      let d_prime_actual = 0;
      if (flexural.is_doubly && flexural.A_s_prime > 0) {
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

  return {
    input,
    setInput,
    compBarDia,
    setCompBarDia,
    stirrupDia,
    setStirrupDia,
    showSteps,
    setShowSteps,
    showCompliance,
    setShowCompliance,
    torsionResult,
    useSideBars,
    setUseSideBars,
    sideBarDia,
    setSideBarDia,
    results,
    setResults,
    error,
    setError,
    handleChange,
    handleBarSizeChange,
    handleCompBarSizeChange,
    handleStirrupSizeChange,
    handleSubmit,
    availableBarSizes,
    availableStirrupSizes,
  };
} 