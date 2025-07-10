import React from 'react';

interface BeamCrossSectionProps {
  width: number; // mm
  height: number; // mm
  cover: number; // mm
  bar_dia: number; // mm
  n_bars: number;
  stirrup_dia: number; // mm
  comp_bar_dia?: number; // mm (optional)
  n_comp_bars?: number; // (optional)
  stirrup_positions?: number[]; // mm from left edge
  strain_gage_positions?: number[]; // mm from left edge
  n_layers?: number; // number of tension bar layers
  bars_per_layer?: number; // bars per layer (max)
  n_comp_layers?: number; // number of compression bar layers
  comp_bars_per_layer?: number; // compression bars per layer (max)
  // Torsion reinforcement
  show_torsion_bars?: boolean;
  n_torsion_legs?: number;
  torsion_bar_dia?: number;
  useSideBars?: boolean;
  sideBarDia?: number;
}

const SVG_W = 520;
const SVG_H = 400;
const MARGIN = 56;

const BeamCrossSection: React.FC<BeamCrossSectionProps> = ({ width, height, cover, bar_dia, n_bars, stirrup_dia, comp_bar_dia, n_comp_bars, stirrup_positions = [], strain_gage_positions = [], n_layers = 1, bars_per_layer, n_comp_layers = 1, comp_bars_per_layer, show_torsion_bars = false, n_torsion_legs = 0, torsion_bar_dia = 16, useSideBars = false, sideBarDia }) => {
  // Scale beam to fit SVG
  const scale = Math.min((SVG_W - 2 * MARGIN) / width, (SVG_H - 2 * MARGIN) / height);
  const beamW = width * scale;
  const beamH = height * scale;
  const x0 = (SVG_W - beamW) / 2;
  const y0 = (SVG_H - beamH) / 2;

  // Stirrups (rectangle inside beam, offset by cover)
  const stirrupOffset = cover * scale + stirrup_dia * scale / 2;
  const stirrupW = beamW - 2 * stirrupOffset;
  const stirrupH = beamH - 2 * stirrupOffset;
  // Hooping (bend radius)
  // Exaggerate for visualization: use 8x stirrup_dia or at least 32mm
  const minBendDia = Math.max(8 * stirrup_dia, 32);
  const bendR = (minBendDia / 2) * scale;
  // Check if bend radius plus cover fits in beam
  const hoopingWarning = (bendR + cover * scale > stirrupW / 2 || bendR + cover * scale > stirrupH / 2);

  // Main bars (multiple layers)
  const layers = n_layers || 1;
  const barsInLayer = bars_per_layer || n_bars;
  const minLayerSpacing = 18;
  const barR = Math.min((bar_dia * scale) / 2, (SVG_H - 2 * MARGIN) / (layers * 3));
  const barLayerSpacing = Math.max(bar_dia * scale * 2.1, minLayerSpacing + barR * 2);
  let barCircles: React.ReactElement[] = [];
  let barsLeft = n_bars;
  for (let layer = 0; layer < layers && barsLeft > 0; layer++) {
    const thisLayerBars = Math.min(barsInLayer, barsLeft);
    const y = y0 + beamH - stirrupOffset - barR - layer * barLayerSpacing;
    let xs: number[];
    let isSideBar: boolean[] = [];
    if (useSideBars && thisLayerBars >= 2 && sideBarDia) {
      // Always place two side bars at the sides, rest are main bars
      xs = [x0 + stirrupOffset + sideBarDia * scale / 2];
      isSideBar = [true];
      const n_middle = thisLayerBars - 2;
      for (let i = 1; i <= n_middle; i++) {
        xs.push(x0 + stirrupOffset + barR + i * ((stirrupW - 2 * barR) / (thisLayerBars - 1)));
        isSideBar.push(false);
      }
      xs.push(x0 + stirrupOffset + stirrupW - sideBarDia * scale / 2);
      isSideBar.push(true);
    } else if (thisLayerBars === 1) {
      xs = [x0 + beamW / 2];
      isSideBar = [false];
    } else if (thisLayerBars === 2) {
      xs = [x0 + stirrupOffset + barR, x0 + stirrupOffset + stirrupW - barR];
      isSideBar = [false, false];
    } else {
      xs = [x0 + stirrupOffset + barR];
      isSideBar = [false];
      const n_middle = thisLayerBars - 2;
      for (let i = 1; i <= n_middle; i++) {
        xs.push(x0 + stirrupOffset + barR + i * ((stirrupW - 2 * barR) / (thisLayerBars - 1)));
        isSideBar.push(false);
      }
      xs.push(x0 + stirrupOffset + stirrupW - barR);
      isSideBar.push(false);
    }
    // Highlight background for this layer
    barCircles.push(
      <rect
        key={`tension-layer-bg-${layer}`}
        x={x0 + stirrupOffset + 2}
        y={y - barR - 4}
        width={stirrupW - 4}
        height={barR * 2 + 8}
        fill="#fee2e2"
        opacity={0.35}
        rx={6}
      />
    );
    barCircles.push(...xs.map((cx, i) => {
      if (useSideBars && isSideBar[i] && sideBarDia) {
        const r = Math.max((sideBarDia * scale) / 2, 5);
        return (
          <g key={`side-bar-${layer}-${i}`}>
            <title>Side Bar (Layer {layer + 1})</title>
            <circle cx={cx} cy={y} r={r} fill="#fb923c" stroke="#b45309" strokeWidth={2} />
            <circle cx={cx} cy={y} r={r + 2.2} fill="none" stroke="#fff" strokeWidth={2.2} />
          </g>
        );
      } else {
        return (
          <g key={`bar-${layer}-${i}`}>
            <title>Layer {layer + 1}, Bar {i + 1}</title>
            <circle cx={cx} cy={y} r={barR} fill="#ef4444" stroke="#991b1b" strokeWidth={1.5} />
            <circle cx={cx} cy={y} r={barR + 2.2} fill="none" stroke="#fff" strokeWidth={2.2} />
          </g>
        );
      }
    }));
    barsLeft -= thisLayerBars;
  }

  // Compression bars (multiple layers)
  let compBarCircles: React.ReactElement[] = [];
  if (comp_bar_dia && n_comp_bars && n_comp_bars > 0) {
    const compLayers = n_comp_layers || 1;
    const compBarsInLayer = comp_bars_per_layer || n_comp_bars;
    const compBarR = Math.min((comp_bar_dia * scale) / 2, (SVG_H - 2 * MARGIN) / (compLayers * 3));
    const compBarLayerSpacing = Math.max(comp_bar_dia * scale * 2.1, minLayerSpacing + compBarR * 2);
    let compBarsLeft = n_comp_bars;
    for (let layer = 0; layer < compLayers; layer++) {
      const thisLayerBars = Math.min(compBarsInLayer, compBarsLeft);
      const y = y0 + stirrupOffset + compBarR + layer * compBarLayerSpacing;
      let xs: number[];
      if (thisLayerBars === 1) {
        xs = [x0 + beamW / 2];
      } else if (thisLayerBars === 2) {
        xs = [x0 + stirrupOffset + compBarR, x0 + stirrupOffset + stirrupW - compBarR];
      } else {
        // Always place one bar near each side (within cover), distribute remaining evenly
        xs = [x0 + stirrupOffset + compBarR];
        const n_middle = thisLayerBars - 2;
        for (let i = 1; i <= n_middle; i++) {
          xs.push(x0 + stirrupOffset + compBarR + i * ((stirrupW - 2 * compBarR) / (thisLayerBars - 1)));
        }
        xs.push(x0 + stirrupOffset + stirrupW - compBarR);
      }
      // Highlight background for this compression layer
      compBarCircles.push(
        <rect
          key={`comp-layer-bg-${layer}`}
          x={x0 + stirrupOffset + 2}
          y={y - compBarR - 4}
          width={stirrupW - 4}
          height={compBarR * 2 + 8}
          fill="#dbeafe"
          opacity={0.35}
          rx={6}
        />
      );
      compBarCircles.push(...xs.map((cx, i) => (
        <g key={`comp-bar-${layer}-${i}`}>
          <title>Compression Layer {layer + 1}, Bar {i + 1}</title>
          <circle cx={cx} cy={y} r={compBarR} fill="#2563eb" stroke="#1e40af" strokeWidth={1.5} />
          <circle cx={cx} cy={y} r={compBarR + 2.2} fill="none" stroke="#fff" strokeWidth={2.2} />
        </g>
      )));
      compBarsLeft -= thisLayerBars;
    }
  }

  // Strain gages (small horizontal lines at specified positions)
  const strainGageLines = strain_gage_positions.map((pos, i) => {
    const x = x0 + (pos / width) * beamW;
    const y = y0 + beamH / 2;
    return (
      <rect
        key={`strain-gage-${i}`}
        x={x - 8}
        y={y - 3}
        width={16}
        height={6}
        fill="#dc2626"
        stroke="#991b1b"
        strokeWidth={1}
        rx={2}
      />
    );
  });

  // Torsion longitudinal bars (gold, at corners/sides)
  let torsionBarCircles: JSX.Element[] = [];
  if (show_torsion_bars && n_torsion_legs > 0) {
    // Place bars at corners first, then mid-sides if more than 4
    const positions: [number, number][] = [];
    // Four corners
    positions.push([x0 + stirrupOffset, y0 + stirrupOffset]); // top-left
    positions.push([x0 + stirrupOffset + stirrupW, y0 + stirrupOffset]); // top-right
    positions.push([x0 + stirrupOffset, y0 + stirrupOffset + stirrupH]); // bottom-left
    positions.push([x0 + stirrupOffset + stirrupW, y0 + stirrupOffset + stirrupH]); // bottom-right
    // If more than 4, add mid-sides
    if (n_torsion_legs > 4) {
      const extra = n_torsion_legs - 4;
      if (extra >= 1) positions.push([x0 + stirrupOffset + stirrupW / 2, y0 + stirrupOffset]); // top-mid
      if (extra >= 2) positions.push([x0 + stirrupOffset + stirrupW, y0 + stirrupOffset + stirrupH / 2]); // right-mid
      if (extra >= 3) positions.push([x0 + stirrupOffset + stirrupW / 2, y0 + stirrupOffset + stirrupH]); // bottom-mid
      if (extra >= 4) positions.push([x0 + stirrupOffset, y0 + stirrupOffset + stirrupH / 2]); // left-mid
    }
    // If even more, distribute evenly along perimeter (not common, but fallback)
    if (n_torsion_legs > 8) {
      const total = n_torsion_legs;
      for (let i = 0; i < total; i++) {
        const t = i / total;
        let px, py;
        if (t < 0.25) { // top
          px = x0 + stirrupOffset + t * 4 * stirrupW;
          py = y0 + stirrupOffset;
        } else if (t < 0.5) { // right
          px = x0 + stirrupOffset + stirrupW;
          py = y0 + stirrupOffset + (t - 0.25) * 4 * stirrupH;
        } else if (t < 0.75) { // bottom
          px = x0 + stirrupOffset + stirrupW - (t - 0.5) * 4 * stirrupW;
          py = y0 + stirrupOffset + stirrupH;
        } else { // left
          px = x0 + stirrupOffset;
          py = y0 + stirrupOffset + stirrupH - (t - 0.75) * 4 * stirrupH;
        }
        positions[i] = [px, py];
      }
    }
    const torsionBarR = Math.max((torsion_bar_dia * scale) / 2, 5);
    for (let i = 0; i < Math.min(n_torsion_legs, positions.length); i++) {
      const [cx, cy] = positions[i];
      torsionBarCircles.push(
        <g key={`torsion-bar-${i}`}>
          <title>Torsion Bar {i + 1}</title>
          <circle cx={cx} cy={cy} r={torsionBarR} fill="#fbbf24" stroke="#b45309" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={torsionBarR + 2.2} fill="none" stroke="#fff" strokeWidth={2.2} />
        </g>
      );
    }
  }

  // Grid background for scale reference
  const gridSpacing = 40; // mm
  const gridLines = [];
  for (let gx = 0; gx <= width; gx += gridSpacing) {
    const x = x0 + (gx / width) * beamW;
    gridLines.push(<line key={`grid-x-${gx}`} x1={x} y1={y0} x2={x} y2={y0 + beamH} stroke="#e5e7eb" strokeWidth={1} />);
  }
  for (let gy = 0; gy <= height; gy += gridSpacing) {
    const y = y0 + (gy / height) * beamH;
    gridLines.push(<line key={`grid-y-${gy}`} x1={x0} y1={y} x2={x0 + beamW} y2={y} stroke="#e5e7eb" strokeWidth={1} />);
  }

  // Stirrup as polyline with hooks (135°)
  const hookLen = Math.max(6 * stirrup_dia, 60) * scale; // 6d or 60mm
  const sx = x0 + stirrupOffset;
  const sy = y0 + stirrupOffset;
  const ex = sx + stirrupW;
  const ey = sy + stirrupH;
  // Polyline points (clockwise, starting at bottom left, with hooks)
  const stirrupPts = [
    [sx + bendR, ey],
    [ex - bendR, ey],
    [ex, ey - bendR],
    [ex, sy + bendR],
    [ex - bendR, sy],
    [sx + bendR, sy],
    [sx, sy + bendR],
    [sx, ey - bendR],
    [sx + bendR, ey],
  ];
  // Add hooks at both ends (bottom left and top left)
  const hook1 = [
    [sx + bendR, ey],
    [sx + bendR - hookLen * 0.7, ey + hookLen * 0.7], // 135°
  ];
  const hook2 = [
    [sx + bendR, sy],
    [sx + bendR - hookLen * 0.7, sy - hookLen * 0.7], // 135°
  ];

  return (
    <svg width={SVG_W} height={SVG_H + 120} viewBox={`0 0 ${SVG_W} ${SVG_H + 120}`} className="mx-auto block" style={{ background: '#f9fafb' }}>
      {/* Grid background */}
      <g>{gridLines}</g>
      {/* Beam outline */}
      <rect x={x0} y={y0} width={beamW} height={beamH} rx={8} fill="#f3f4f6" stroke="#374151" strokeWidth={2} />
      {/* Stirrup as polyline with hooks, dashed blue */}
      <polyline
        points={stirrupPts.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="#2563eb"
        strokeWidth={stirrup_dia * scale}
        strokeDasharray="12,8"
      />
      {/* Hooks */}
      <polyline points={hook1.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth={stirrup_dia * scale} />
      <polyline points={hook2.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth={stirrup_dia * scale} />
      {/* Main bars (tension, multiple layers) */}
      {barCircles}
      {/* Compression bars (multiple layers, if any) */}
      {compBarCircles}
      {/* Torsion longitudinal bars (gold, at corners/sides) */}
      {torsionBarCircles}
      {/* Dimension lines for width */}
      <line x1={x0} y1={y0 + beamH + 18} x2={x0 + beamW} y2={y0 + beamH + 18} stroke="#6b7280" strokeWidth={2} markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
      <text x={x0 + beamW / 2} y={y0 + beamH + 34} textAnchor="middle" fontSize={16} fill="#374151" fontFamily="monospace">{width} mm</text>
      {/* Dimension lines for height */}
      <line x1={x0 - 18} y1={y0} x2={x0 - 18} y2={y0 + beamH} stroke="#6b7280" strokeWidth={2} markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
      <text x={x0 - 28} y={y0 + beamH / 2} textAnchor="middle" fontSize={16} fill="#374151" fontFamily="monospace" transform={`rotate(-90,${x0 - 28},${y0 + beamH / 2})`}>{height} mm</text>
      {/* Bar annotation (bottom) */}
      <text x={x0 + beamW / 2} y={ey + 70} textAnchor="middle" fontSize={15} fill="#991b1b" fontFamily="monospace">Tension bars: {n_bars} × {bar_dia} mm</text>
      {/* Stirrup annotation (top) */}
      <text x={x0 + beamW / 2} y={y0 - 24} textAnchor="middle" fontSize={15} fill="#2563eb" fontFamily="monospace">Stirrup: {stirrup_dia} mm, hooks 135°, min bend {Math.round(bendR * 2 / scale)} mm</text>
      {/* Legend */}
      <g>
        <rect x={x0} y={SVG_H + 30} width={320} height={70} rx={10} fill="#fff" stroke="#d1d5db" strokeWidth={1.5} />
        <circle cx={x0 + 24} cy={SVG_H + 50} r={10} fill="#ef4444" stroke="#991b1b" strokeWidth={2} />
        <text x={x0 + 44} y={SVG_H + 54} fontSize={14} fill="#991b1b" fontFamily="monospace">Tension bar</text>
        <circle cx={x0 + 24} cy={SVG_H + 80} r={10} fill="#fb923c" stroke="#b45309" strokeWidth={2} />
        <text x={x0 + 44} y={SVG_H + 84} fontSize={14} fill="#b45309" fontFamily="monospace">Side bar</text>
        <rect x={x0 + 140} y={SVG_H + 40} width={24} height={12} rx={6} fill="none" stroke="#2563eb" strokeWidth={4} strokeDasharray="12,8" />
        <text x={x0 + 170} y={SVG_H + 54} fontSize={14} fill="#2563eb" fontFamily="monospace">Stirrup</text>
        <circle cx={x0 + 140 + 12} cy={SVG_H + 80} r={10} fill="#fbbf24" stroke="#b45309" strokeWidth={2} />
        <text x={x0 + 170} y={SVG_H + 84} fontSize={14} fill="#b45309" fontFamily="monospace">Torsion bar</text>
      </g>
      {/* Arrow marker definitions for inward-pointing arrows */}
      <defs>
        <marker id="arrowEnd" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#6b7280" />
        </marker>
        <marker id="arrowStart" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse" markerUnits="strokeWidth">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#6b7280" />
        </marker>
      </defs>
    </svg>
  );
};

export default BeamCrossSection; 