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
  let barCircles: React.JSX.Element[] = [];
  let barsLeft = n_bars;
  for (let layer = 0; layer < layers && barsLeft > 0; layer++) {
    const thisLayerBars = Math.min(barsInLayer, barsLeft);
    const y = y0 + beamH - stirrupOffset - barR - layer * barLayerSpacing;
    let xs: number[];
    let isSideBar: boolean[] = [];
    if (useSideBars && thisLayerBars >= 2 && sideBarDia) {
      // Always place two side bars at the sides, rest are main bars
      xs = [x0 + stirrupOffset + sideBarDia * scale / 2];
      isSideBar = [false]; // bottom left corner is tension bar
      const n_middle = thisLayerBars - 2;
      for (let i = 1; i <= n_middle; i++) {
        xs.push(x0 + stirrupOffset + barR + i * ((stirrupW - 2 * barR) / (thisLayerBars - 1)));
        isSideBar.push(false);
      }
      xs.push(x0 + stirrupOffset + stirrupW - sideBarDia * scale / 2);
      isSideBar.push(false); // bottom right corner is tension bar
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
            <circle cx={cx} cy={y} r={r} fill="#22c55e" stroke="#166534" strokeWidth={2} />
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
  let compBarCircles: React.JSX.Element[] = [];
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
  let torsionBarCircles: React.JSX.Element[] = [];
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

  // Enhanced stirrup visualization with clearer hooks and better visibility
  const hookLen = Math.max(6 * stirrup_dia, 60) * scale; // 6d or 60mm
  const sx = x0 + stirrupOffset;
  const sy = y0 + stirrupOffset;
  const ex = sx + stirrupW;
  const ey = sy + stirrupH;
  
  // --- Stirrup with rounded corners (radius = barR) ---
  const stirrupCornerR = barR;

  // --- Label arrow positions (offset to avoid overlap) ---
  // Stirrup label: left of section, points to top-left corner
  const stirrupLabelArrow = [
    [sx - 48, sy + stirrupCornerR + 24], // label position (moved down)
    [sx + stirrupCornerR - 8, sy + stirrupCornerR + 24], // arrow tip (just left of top-left corner, moved down)
  ];
  // Tension bar label: right of section, points to bottom-right bar
  const tensionBarLabelArrow = [
    [ex + 48, ey - stirrupCornerR], // label position
    [ex - stirrupCornerR + 8, ey - stirrupCornerR], // arrow tip (just right of bottom-right bar)
  ];
  // Compression bar label: left of section, points to top-left bar (if present)
  let compressionBarLabelArrow = null;
  if (comp_bar_dia && n_comp_bars && n_comp_bars > 0) {
    const compressionLabelX = sx - 16; // Move label just a little inside
    compressionBarLabelArrow = [
      [compressionLabelX, sy + stirrupCornerR - 48], // label position (upward and just a little inside)
      [sx + stirrupCornerR - 8, sy + stirrupCornerR], // arrow tip (top-left bar)
    ];
  }

  // --- Improved stirrup hook geometry ---
  // Draw the stirrup as a rectangle with a 135° hook at the bottom left
  // The hook starts at the bottom left corner and bends outwards
  const hookAngle = (135 * Math.PI) / 180; // radians
  const hookTailLen = Math.max(6 * stirrup_dia, 60) * scale;
  // Start at (sx, ey - bendR), go left, then up at 135°
  const hookStartX = sx;
  const hookStartY = ey - bendR;
  const hookMidX = hookStartX - Math.cos(hookAngle) * (bendR * 1.2);
  const hookMidY = hookStartY + Math.sin(hookAngle) * (bendR * 1.2);
  const hookEndX = hookMidX - Math.cos(hookAngle) * hookTailLen;
  const hookEndY = hookMidY + Math.sin(hookAngle) * hookTailLen;

  // --- Simple stirrup visualization: closed rectangle with rounded corners, no hooks ---
  const stirrupRect = [
    [sx + bendR, sy], // top-left
    [ex - bendR, sy], // top-right
    [ex, sy + bendR], // top-right corner
    [ex, ey - bendR], // bottom-right
    [ex - bendR, ey], // bottom-right corner
    [sx + bendR, ey], // bottom-left
    [sx, ey - bendR], // bottom-left corner
    [sx, sy + bendR], // top-left corner
    [sx + bendR, sy], // close the loop
  ];

  // Polyline for the hook
  const stirrupHook = [
    [sx, ey - bendR],
    [hookMidX, hookMidY],
    [hookEndX, hookEndY],
  ];

  // --- 90-degree stirrup rectangle (no rounded corners) ---
  const stirrupRect90 = [
    [sx, sy], // top-left
    [ex, sy], // top-right
    [ex, ey], // bottom-right
    [sx, ey], // bottom-left
    [sx, sy], // close the loop
  ];

  // --- Stirrup with rounded corners (radius = barR) ---
  const stirrupRectRounded = [
    // Start at top-left arc center
    [sx + stirrupCornerR, sy], // top edge start
    [ex - stirrupCornerR, sy], // top edge end
    [ex, sy + stirrupCornerR], // right edge start
    [ex, ey - stirrupCornerR], // right edge end
    [ex - stirrupCornerR, ey], // bottom edge end
    [sx + stirrupCornerR, ey], // bottom edge start
    [sx, ey - stirrupCornerR], // left edge end
    [sx, sy + stirrupCornerR], // left edge start
    [sx + stirrupCornerR, sy], // close the loop
  ];

  // Main bars at the center of each rounded corner
  const barCornerCenters: [number, number][] = [
    [sx + stirrupCornerR, sy + stirrupCornerR], // top-left
    [ex - stirrupCornerR, sy + stirrupCornerR], // top-right
    [ex - stirrupCornerR, ey - stirrupCornerR], // bottom-right
    [sx + stirrupCornerR, ey - stirrupCornerR], // bottom-left
  ];

  // For 2-bar case (tension): use bottom-left and bottom-right
  // For 2-bar case (compression): use top-left and top-right
  let barPositions: [number, number][] = [];
  if (n_bars === 2) {
    barPositions = [barCornerCenters[3], barCornerCenters[2]];
  } else if (n_bars > 2) {
    // Distribute along bottom edge, first/last at corners
    for (let i = 0; i < n_bars; i++) {
      const frac = n_bars === 1 ? 0.5 : i / (n_bars - 1);
      barPositions.push([
        sx + stirrupCornerR + frac * (stirrupW - 2 * stirrupCornerR),
        ey - stirrupCornerR,
      ]);
    }
  } else if (n_bars === 1) {
    barPositions = [[sx + stirrupW / 2, ey - stirrupCornerR]];
  }

  let compBarPositions: [number, number][] = [];
  if (comp_bar_dia && n_comp_bars) {
    if (n_comp_bars === 2) {
      compBarPositions = [barCornerCenters[0], barCornerCenters[1]];
    } else if (n_comp_bars > 2) {
      for (let i = 0; i < n_comp_bars; i++) {
        const frac = n_comp_bars === 1 ? 0.5 : i / (n_comp_bars - 1);
        compBarPositions.push([
          sx + stirrupCornerR + frac * (stirrupW - 2 * stirrupCornerR),
          sy + stirrupCornerR,
        ]);
      }
    } else if (n_comp_bars === 1) {
      compBarPositions = [[sx + stirrupW / 2, sy + stirrupCornerR]];
    }
  }

  // Torsion bar label: right of section, points to top-right torsion bar (if present)
  let torsionBarLabelArrow = null;
  if (show_torsion_bars && n_torsion_legs > 0) {
    torsionBarLabelArrow = [
      [ex + 56, sy + stirrupCornerR], // label position (right of top-right corner)
      [ex - stirrupCornerR + 8, sy + stirrupCornerR], // arrow tip (just right of top-right bar)
    ];
  }

  // --- Side bars at mid-height (realistic arrangement) ---
  let sideBarCircles: React.JSX.Element[] = [];
  if (useSideBars && sideBarDia) {
    const r = Math.max((sideBarDia * scale) / 2, 5);
    const leftX = sx + sideBarDia * scale / 2;
    const rightX = ex - sideBarDia * scale / 2;
    const midY = sy + stirrupH / 2;
    sideBarCircles = [
      <g key="side-bar-left">
        <title>Side Bar (Left, Mid-Height)</title>
        <circle cx={leftX} cy={midY} r={r} fill="#22c55e" stroke="#166534" strokeWidth={2} />
        <circle cx={leftX} cy={midY} r={r + 2.2} fill="none" stroke="#fff" strokeWidth={2.2} />
      </g>,
      <g key="side-bar-right">
        <title>Side Bar (Right, Mid-Height)</title>
        <circle cx={rightX} cy={midY} r={r} fill="#22c55e" stroke="#166534" strokeWidth={2} />
        <circle cx={rightX} cy={midY} r={r + 2.2} fill="none" stroke="#fff" strokeWidth={2.2} />
      </g>
    ];
  }

  return (
    <svg width={SVG_W} height={SVG_H + 120} viewBox={`0 0 ${SVG_W} ${SVG_H + 120}`} className="mx-auto block" style={{ background: '#f9fafb' }}>
      {/* Grid background */}
      <g>{gridLines}</g>
      
      {/* Beam outline */}
      <rect x={x0} y={y0} width={beamW} height={beamH} rx={8} fill="#f3f4f6" stroke="#374151" strokeWidth={2} />
      
      {/* Enhanced stirrup visualization */}
      {/* 90-degree stirrup visualization */}
      <polyline
        points={stirrupRect90.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="#1e40af"
        strokeWidth={Math.max(stirrup_dia * scale * 1.5, 4)}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Main bars (tension, at rounded corners or distributed) */}
      {barCircles}
      {/* Side bars at mid-height (realistic arrangement) */}
      {sideBarCircles}
      {/* Compression bars (at rounded corners or distributed) */}
      {compBarCircles}
      
      {/* Torsion longitudinal bars (gold, at corners/sides) */}
      {torsionBarCircles}
      
      {/* Dimension lines for width */}
      <line x1={x0} y1={y0 + beamH + 18} x2={x0 + beamW} y2={y0 + beamH + 18} stroke="#6b7280" strokeWidth={2} markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
      <text x={x0 + beamW / 2} y={y0 + beamH + 34} textAnchor="middle" fontSize={16} fill="#374151" fontFamily="monospace">{width} mm</text>
      
      {/* Dimension lines for height */}
      <line x1={x0 - 18} y1={y0} x2={x0 - 18} y2={y0 + beamH} stroke="#6b7280" strokeWidth={2} markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
      <text x={x0 - 28} y={y0 + beamH / 2} textAnchor="middle" fontSize={16} fill="#374151" fontFamily="monospace" transform={`rotate(-90,${x0 - 28},${y0 + beamH / 2})`}>{height} mm</text>
      
      {/* Arrow labels instead of text lines */}
      {/* Stirrup label arrow */}
      <line 
        x1={stirrupLabelArrow[0][0]} y1={stirrupLabelArrow[0][1]} 
        x2={stirrupLabelArrow[1][0]} y2={stirrupLabelArrow[1][1]} 
        stroke="#1e40af" strokeWidth={2} markerEnd="url(#arrowEndBlue)" 
      />
      <text x={stirrupLabelArrow[0][0] - 2} y={stirrupLabelArrow[0][1] + 4} textAnchor="end" fontSize={14} fill="#1e40af" fontFamily="monospace" fontWeight="bold">
        Stirrup: {stirrup_dia} mm
      </text>
      {/* Tension bar label arrow */}
      <line 
        x1={tensionBarLabelArrow[0][0]} y1={tensionBarLabelArrow[0][1]} 
        x2={tensionBarLabelArrow[1][0]} y2={tensionBarLabelArrow[1][1]} 
        stroke="#991b1b" strokeWidth={2} markerEnd="url(#arrowEndRed)" 
      />
      <text x={tensionBarLabelArrow[0][0] + 2} y={tensionBarLabelArrow[0][1] + 4} textAnchor="start" fontSize={14} fill="#991b1b" fontFamily="monospace" fontWeight="bold">
        Tension: {n_bars} × {bar_dia} mm
      </text>
      {/* Compression bar label arrow (if present) */}
      {compressionBarLabelArrow && (
        <>
          <line 
            x1={compressionBarLabelArrow[0][0]} y1={compressionBarLabelArrow[0][1]} 
            x2={compressionBarLabelArrow[1][0]} y2={compressionBarLabelArrow[1][1]} 
            stroke="#1e40af" strokeWidth={2} markerEnd="url(#arrowEndBlue)" 
          />
          <text x={compressionBarLabelArrow[0][0] - 2} y={compressionBarLabelArrow[0][1] + 4} textAnchor="end" fontSize={14} fill="#1e40af" fontFamily="monospace" fontWeight="bold">
            Compression: {n_comp_bars} × {comp_bar_dia} mm
          </text>
        </>
      )}
      {/* Torsion bar label arrow and text (if present) */}
      {torsionBarLabelArrow && (
        <>
          <line 
            x1={torsionBarLabelArrow[0][0]} y1={torsionBarLabelArrow[0][1]} 
            x2={torsionBarLabelArrow[1][0]} y2={torsionBarLabelArrow[1][1]} 
            stroke="#b45309" strokeWidth={2} markerEnd="url(#arrowEndGold)" 
          />
          <text x={torsionBarLabelArrow[0][0] + 2} y={torsionBarLabelArrow[0][1] + 4} textAnchor="start" fontSize={14} fill="#b45309" fontFamily="monospace" fontWeight="bold">
            Torsion bar
          </text>
        </>
      )}
      
      {/* Legend */}
      <g>
        <rect x={x0} y={SVG_H + 30} width={320} height={70} rx={10} fill="#fff" stroke="#d1d5db" strokeWidth={1.5} />
        <circle cx={x0 + 24} cy={SVG_H + 50} r={10} fill="#ef4444" stroke="#991b1b" strokeWidth={2} />
        <text x={x0 + 44} y={SVG_H + 54} fontSize={14} fill="#991b1b" fontFamily="monospace">Tension bar</text>
        <circle cx={x0 + 24} cy={SVG_H + 80} r={10} fill="#22c55e" stroke="#166534" strokeWidth={2} />
        <text x={x0 + 44} y={SVG_H + 84} fontSize={14} fill="#166534" fontFamily="monospace">Side bar</text>
        <rect x={x0 + 140} y={SVG_H + 40} width={24} height={12} rx={6} fill="none" stroke="#1e40af" strokeWidth={4} />
        <text x={x0 + 170} y={SVG_H + 54} fontSize={14} fill="#1e40af" fontFamily="monospace">Stirrup</text>
        <circle cx={x0 + 140 + 12} cy={SVG_H + 80} r={10} fill="#fbbf24" stroke="#b45309" strokeWidth={2} />
        <text x={x0 + 170} y={SVG_H + 84} fontSize={14} fill="#b45309" fontFamily="monospace">Torsion bar</text>
      </g>
      
      {/* Arrow marker definitions for different colors */}
      <defs>
        <marker id="arrowEnd" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#6b7280" />
        </marker>
        <marker id="arrowStart" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse" markerUnits="strokeWidth">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#6b7280" />
        </marker>
        <marker id="arrowEndBlue" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#1e40af" />
        </marker>
        <marker id="arrowEndRed" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#991b1b" />
        </marker>
        <marker id="arrowEndGold" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#b45309" />
        </marker>
      </defs>
    </svg>
  );
};

export default BeamCrossSection; 