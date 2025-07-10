import React from 'react';

interface BeamSideViewProps {
  beamLength: number; // mm
  beamHeight: number; // mm (for visual scale)
  n_bars: number; // number of main bars
  bar_dia: number; // diameter of main bars (mm)
}

const SVG_W = 650;
const SVG_H = 200;
const MARGIN_X = 70;
const MARGIN_Y = 50;
const BG_RADIUS = 32;

const BeamSideView: React.FC<BeamSideViewProps> = ({
  beamLength,
  beamHeight,
  n_bars,
  bar_dia,
}) => {
  // Scale beam to fit SVG
  const scale = (SVG_W - 2 * MARGIN_X) / beamLength;
  const beamW = beamLength * scale;
  const beamH = Math.min(beamHeight * scale, SVG_H - 2 * MARGIN_Y - 40);
  const x0 = (SVG_W - beamW) / 2;
  const y0 = (SVG_H - beamH) / 2 + 10;

  // Main bars layout (equally spaced at bottom, with isometric effect)
  const barRadius = (bar_dia * scale) / 2;
  const barY = y0 + beamH - barRadius - 8; // 8px margin from bottom
  const barSpacing = n_bars > 1 ? (beamW - 2 * barRadius) / (n_bars - 1) : 0;
  const isoOffset = barRadius * 0.5; // isometric vertical offset for 3D effect

  const bars = Array.from({ length: n_bars }).map((_, i) => {
    const x = x0 + barRadius + i * barSpacing;
    return (
      <g key={i}>
        {/* Shadow ellipse */}
        <ellipse
          cx={x + isoOffset * 0.5}
          cy={barY + isoOffset * 0.9}
          rx={barRadius * 1.25}
          ry={barRadius * 0.55}
          fill="#000"
          opacity={0.18}
          filter="url(#shadowBlur)"
        />
        {/* Main bar body (isometric) */}
        <ellipse
          cx={x + isoOffset}
          cy={barY + isoOffset}
          rx={barRadius * 1.2}
          ry={barRadius}
          fill="url(#bar3d)"
          stroke="#1e293b"
          strokeWidth={1.5}
        />
        {/* Top highlight */}
        <ellipse
          cx={x + isoOffset}
          cy={barY + isoOffset - barRadius * 0.5}
          rx={barRadius * 0.7}
          ry={barRadius * 0.22}
          fill="url(#barHighlight)"
          opacity={0.7}
        />
        {/* Gloss/reflection */}
        <ellipse
          cx={x + isoOffset + barRadius * 0.3}
          cy={barY + isoOffset - barRadius * 0.1}
          rx={barRadius * 0.25}
          ry={barRadius * 0.09}
          fill="#fff"
          opacity={0.25}
        />
      </g>
    );
  });

  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mx-auto block">
      <defs>
        <linearGradient id="bar3d" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0e7ef" />
          <stop offset="40%" stopColor="#a3b2c7" />
          <stop offset="80%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="barHighlight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#e0e7ef" />
        </linearGradient>
        <filter id="bgShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.10" />
        </filter>
        <filter id="shadowBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* Background rectangle */}
      <rect x={24} y={18} width={SVG_W - 48} height={SVG_H - 36} rx={BG_RADIUS} fill="#f8fafc" filter="url(#bgShadow)" />
      {/* Beam outline */}
      <rect x={x0} y={y0} width={beamW} height={beamH} rx={10} fill="#f3f4f6" stroke="#374151" strokeWidth={2.5} />
      {/* Main bars (enhanced 3D effect) */}
      {bars}
    </svg>
  );
};

export default BeamSideView; 