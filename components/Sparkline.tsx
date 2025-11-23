
import React from 'react';
import { StockHistoryEntry } from '../types';

interface SparklineProps {
  history: StockHistoryEntry[];
  color?: string;
  className?: string;
  showArea?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({ 
  history, 
  color = "#6366f1", // indigo-500
  className = "",
  showArea = true
}) => {
  if (!history || history.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-gray-300 text-xs ${className}`}>
        No data
      </div>
    );
  }

  // Clone and sort history by timestamp
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  
  // If only one point, fake a previous point for visualization
  let data = sorted;
  if (data.length === 1) {
    data = [
        { ...data[0], timestamp: data[0].timestamp - 3600000 }, // 1 hour ago
        data[0]
    ];
  }

  const values = data.map(d => d.newQuantity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Add some padding to the range so it's not hugging top/bottom exactly
  const range = max - min || 1; 
  
  const timeValues = data.map(d => d.timestamp);
  const minTime = Math.min(...timeValues);
  const maxTime = Math.max(...timeValues);
  const timeRange = maxTime - minTime || 1;

  // ViewBox dimensions
  const width = 100;
  const height = 40;
  const paddingX = 0;
  const paddingY = 4; // internal padding to prevent clipping of stroke

  // Helper to scale values
  const getX = (t: number) => ((t - minTime) / timeRange) * (width - 2 * paddingX) + paddingX;
  const getY = (v: number) => height - (((v - min) / range) * (height - 2 * paddingY) + paddingY);

  // Calculate points
  const points = data.map(d => {
    return `${getX(d.timestamp)},${getY(d.newQuantity)}`;
  }).join(' ');

  // Area path (closed loop)
  const areaPoints = `
    ${getX(minTime)},${height} 
    ${points} 
    ${getX(maxTime)},${height}
  `;

  // Last point coordinates for the dot
  const lastPoint = data[data.length - 1];
  const lastX = getX(lastPoint.timestamp);
  const lastY = getY(lastPoint.newQuantity);

  return (
    <div className={`w-full h-full ${className}`}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {showArea && (
           <polygon points={areaPoints} fill={`url(#gradient-${color.replace('#', '')})`} stroke="none" />
        )}
        
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Dot on the last point */}
        <circle 
          cx={lastX}
          cy={lastY}
          r="2"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};
