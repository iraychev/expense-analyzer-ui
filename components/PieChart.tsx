import React from "react";
import Svg, { Path, G } from "react-native-svg";

interface ChartDataItem {
  value: number;
  color: string;
  name?: string;
  amount?: string;
}

interface PieChartProps {
  data: ChartDataItem[];
  width: number;
  height: number;
  borderWidth?: number;
  borderColor?: string;
}

const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  width, 
  height, 
  borderWidth = 2,
  borderColor = "#FFFFFF" 
}) => {
  const radius = Math.min(width, height) / 2 - 10;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return <Svg width={width} height={height} />;
  }
  
  let cumulativeAngle = -90;
  
  const slices = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    
    if (angle === 0) return null;
    
    const startAngle = cumulativeAngle;
    const endAngle = startAngle + angle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX},${centerY}`,
      `L ${x1},${y1}`,
      `A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2}`,
      'Z'
    ].join(' ');
    
    cumulativeAngle = endAngle;
    
    return (
      <Path
        key={`slice-${index}`}
        d={pathData}
        fill={item.color}
        stroke={borderColor}
        strokeWidth={borderWidth}
        strokeLinejoin="round"
      />
    );
  });
  
  return (
    <Svg width={width} height={height}>
      <G>{slices}</G>
    </Svg>
  );
};

export default PieChart;