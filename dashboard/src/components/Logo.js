import React from 'react';
import Svg, { Path, G, Rect } from 'react-native-svg';

export const Logo = ({ width = 100, height = 100, color = '#A63089' }) => (
  <Svg width={width} height={height} viewBox="0 0 100 100">
    <G>
      {/* Face brackets */}
      <Path 
        d="M25 15 Q15 15 15 25 L15 35" 
        stroke={color} 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
      />
      <Path 
        d="M75 15 Q85 15 85 25 L85 35" 
        stroke={color} 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
      />
      <Path 
        d="M15 65 L15 75 Q15 85 25 85" 
        stroke={color} 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
      />
      <Path 
        d="M85 65 L85 75 Q85 85 75 85" 
        stroke={color} 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Eyes */}
      <Path 
        d="M35 40 A3 3 0 0 1 35 46 A3 3 0 0 1 35 40" 
        fill={color}
      />
      <Path 
        d="M65 40 A3 3 0 0 1 65 46 A3 3 0 0 1 65 40" 
        fill={color}
      />
      
      {/* Checkmark */}
      <Path 
        d="M30 60 L45 75 L70 50" 
        stroke="#3AAA35" 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  </Svg>
);

export const LogoWhite = (props) => <Logo {...props} color="#FFFFFF" />;

export default Logo;
