
import React from 'react';
import { InventoryItem, CATEGORIES } from '../types';

interface WagonWheelProps {
  items: InventoryItem[];
}

export const WagonWheel: React.FC<WagonWheelProps> = ({ items }) => {
  // Configuration
  const size = 300;
  const center = size / 2;
  const radius = 100;
  const labelRadius = radius + 40; // Push labels out slightly to clear the wooden rim
  
  // Calculate stats per category
  const data = CATEGORIES.map(category => {
    const catItems = items.filter(i => i.category === category);
    if (catItems.length === 0) return { category, ratio: 0, label: category, totalQty: 0 };

    const totalQty = catItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalPar = catItems.reduce((sum, i) => sum + i.minStock, 0);

    // If Par is 0, we can't divide by it. 
    // If we have items but Par is 0, treat it as healthy (100% or 1.0).
    // If we have 0 items and 0 Par, it's empty but technically met (0). Let's say 0 for visual clarity.
    let ratio = 0;
    if (totalPar > 0) {
      ratio = totalQty / totalPar;
    } else if (totalQty > 0) {
      ratio = 1; // Arbitrary "Healthy" level for items without strict pars
    }

    // Cap the visual ratio at 1.5x Par so the chart doesn't explode
    const cappedRatio = Math.min(ratio, 1.5);
    
    return {
      category,
      ratio: cappedRatio,
      rawRatio: ratio,
      totalQty
    };
  });

  // Helper to convert polar to cartesian
  const getCoordinates = (angleInDegrees: number, dist: number) => {
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
    return {
      x: center + dist * Math.cos(angleInRadians),
      y: center + dist * Math.sin(angleInRadians)
    };
  };

  // Generate polygon points
  const points = data.map((d, i) => {
    const angle = (360 / CATEGORIES.length) * i;
    // Scale ratio: 1.0 (100% Par) = radius. 
    // Max visual is 1.5 * radius.
    const dist = d.ratio * radius; 
    const coords = getCoordinates(angle, dist);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
      <h3 className="text-lg font-bold text-gray-900 mb-1 z-10">Inventory Balance Wheel</h3>
      <p className="text-xs text-gray-500 mb-4 z-10">The green line is your Par Level. Spokes are categories.</p>
      
      <div className="relative z-10">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full h-auto">
          {/* Gradients */}
          <defs>
            <radialGradient id="wheelGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.5" />
            </radialGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* --- LAYER 1: CLASSICAL WOODEN WAGON WHEEL BACKGROUND --- */}
          <g className="wagon-wheel-art opacity-20">
               {/* Iron Tire (Outer Band) */}
               <circle cx={center} cy={center} r={radius * 1.5 + 4} stroke="#3E2723" strokeWidth="6" fill="none" />
               
               {/* Wooden Felloes (Rim) */}
               <circle cx={center} cy={center} r={radius * 1.5 - 10} stroke="#8D6E63" strokeWidth="24" fill="none" />
               <circle cx={center} cy={center} r={radius * 1.5 - 22} stroke="#5D4037" strokeWidth="1" fill="none" />

               {/* Hub */}
               <circle cx={center} cy={center} r="28" fill="#8D6E63" stroke="#5D4037" strokeWidth="2" />
               {/* Axle Nut */}
               <circle cx={center} cy={center} r="12" fill="#3E2723" />

               {/* Wooden Spokes */}
               {CATEGORIES.map((_, i) => {
                  const angle = (360 / CATEGORIES.length) * i;
                  const start = getCoordinates(angle, 28); // Start at hub
                  const end = getCoordinates(angle, radius * 1.5 - 22); // End at inner rim
                  return (
                    <line 
                      key={`wood-spoke-${i}`}
                      x1={start.x} y1={start.y}
                      x2={end.x} y2={end.y}
                      stroke="#8D6E63"
                      strokeWidth="14"
                      strokeLinecap="butt"
                    />
                  );
               })}
               
               {/* Spoke Detail (Inner shadow line) */}
               {CATEGORIES.map((_, i) => {
                  const angle = (360 / CATEGORIES.length) * i;
                  const start = getCoordinates(angle, 28);
                  const end = getCoordinates(angle, radius * 1.5 - 22);
                  return (
                    <line 
                      key={`wood-spoke-detail-${i}`}
                      x1={start.x} y1={start.y}
                      x2={end.x} y2={end.y}
                      stroke="#5D4037"
                      strokeWidth="2"
                      strokeOpacity="0.3"
                    />
                  );
               })}
          </g>

          {/* --- LAYER 2: CHART DATA OVERLAY --- */}

          {/* Guide Circle: 100% Par (The Green Target) */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 4" opacity="0.8" />
          
          {/* Guide Circle: 50% Par */}
          <circle cx={center} cy={center} r={radius * 0.5} fill="none" stroke="#9ca3af" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />

          {/* Data Polygon */}
          <polygon 
            points={points} 
            fill="url(#wheelGradient)" 
            stroke="#4f46e5" 
            strokeWidth="3"
            strokeLinejoin="round"
            filter="url(#shadow)"
          />

          {/* Data Points (Knobs on the wheel) */}
          {data.map((d, i) => {
            const angle = (360 / CATEGORIES.length) * i;
            const dist = d.ratio * radius;
            const coords = getCoordinates(angle, dist);
            const isLow = d.rawRatio < 1 && d.totalQty > 0;
            return (
              <g key={`dot-${i}`}>
                 <circle 
                  cx={coords.x} 
                  cy={coords.y} 
                  r="5" 
                  fill={isLow ? "#ef4444" : "#4f46e5"} 
                  stroke="white" 
                  strokeWidth="2" 
                />
              </g>
            );
          })}

          {/* Labels */}
          {CATEGORIES.map((cat, i) => {
            const angle = (360 / CATEGORIES.length) * i;
            const coords = getCoordinates(angle, labelRadius);
            
            // Adjust text anchor based on position
            let textAnchor = 'middle';
            let dominantBaseline = 'middle';
            
            if (angle > 0 && angle < 180) textAnchor = 'start';
            if (angle > 180) textAnchor = 'end';
            if (angle === 0 || angle === 180) textAnchor = 'middle';

            // Fine tuning for specific angles
            const xOffset = angle > 180 ? -5 : angle < 180 && angle > 0 ? 5 : 0;

            return (
              <g key={`label-${i}`}>
                <text 
                  x={coords.x + xOffset} 
                  y={coords.y} 
                  textAnchor={textAnchor} 
                  dominantBaseline={dominantBaseline}
                  className="text-[11px] font-bold fill-gray-700"
                  style={{ fontWeight: 600 }}
                >
                  {cat}
                </text>
                <text 
                  x={coords.x + xOffset} 
                  y={coords.y + 12} 
                  textAnchor={textAnchor} 
                  dominantBaseline={dominantBaseline}
                  className="text-[9px] fill-gray-500 font-mono"
                >
                   {Math.round(data[i].rawRatio * 100)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
