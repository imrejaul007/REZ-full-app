// Type declarations for packages without bundled types

declare module 'react-native-qrcode-svg' {
  import { ComponentProps } from 'react';
  import { ViewStyle } from 'react-native';

  interface QRCodeProps {
    value: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    logo?: any;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoMargin?: number;
    logoBorderRadius?: number;
    quietZone?: number;
    enableLinearGradient?: boolean;
    linearGradient?: string[];
    gradientDirection?: string[];
    ecl?: 'L' | 'M' | 'Q' | 'H';
    getRef?: (ref: any) => void;
    onError?: (error: any) => void;
    style?: ViewStyle;
  }

  const QRCode: React.FC<QRCodeProps>;
  export default QRCode;
}

declare module 'victory-native' {
  import { ComponentProps, ReactNode } from 'react';
  import { ViewStyle } from 'react-native';

  interface VictoryThemeDefinition {
    [key: string]: any;
  }

  interface VictoryTheme {
    material: VictoryThemeDefinition;
    grayscale: VictoryThemeDefinition;
  }

  export const VictoryTheme: VictoryTheme;

  interface CommonProps {
    style?: { [key: string]: any };
    width?: number;
    height?: number;
    padding?: number | { top?: number; bottom?: number; left?: number; right?: number };
    theme?: VictoryThemeDefinition;
    animate?: boolean | { [key: string]: any };
  }

  interface VictoryChartProps extends CommonProps {
    children?: ReactNode;
    domain?: { x?: [number, number]; y?: [number, number] };
    domainPadding?: number | { x?: number | [number, number]; y?: number | [number, number] };
    scale?: { x?: string; y?: string };
  }

  interface VictoryBarProps extends CommonProps {
    data?: Array<{ x?: any; y?: any; [key: string]: any }>;
    x?: string | ((datum: any) => any);
    y?: string | ((datum: any) => any);
    barWidth?: number;
    cornerRadius?: number | { top?: number; bottom?: number };
    alignment?: 'start' | 'middle' | 'end';
    labels?: ((datum: any) => string) | string[];
    labelComponent?: ReactNode;
    events?: any[];
  }

  interface VictoryLineProps extends CommonProps {
    data?: Array<{ x?: any; y?: any; [key: string]: any }>;
    x?: string | ((datum: any) => any);
    y?: string | ((datum: any) => any);
    interpolation?: string;
    labels?: ((datum: any) => string) | string[];
    labelComponent?: ReactNode;
  }

  interface VictoryAxisProps extends CommonProps {
    dependentAxis?: boolean;
    tickFormat?: ((tick: any, index: number, ticks: any[]) => string) | string[];
    tickValues?: any[];
    tickCount?: number;
    label?: string;
    crossAxis?: boolean;
    orientation?: 'top' | 'bottom' | 'left' | 'right';
  }

  interface VictoryPieProps extends CommonProps {
    data?: Array<{ x?: any; y?: any; [key: string]: any }>;
    x?: string | ((datum: any) => any);
    y?: string | ((datum: any) => any);
    colorScale?: string[] | string;
    innerRadius?: number;
    padAngle?: number;
    labels?: ((datum: any) => string) | string[];
    labelComponent?: ReactNode;
  }

  interface VictoryTooltipProps {
    [key: string]: any;
  }

  interface VictoryLabelProps {
    text?: string | ((datum: any) => string);
    style?: { [key: string]: any };
    [key: string]: any;
  }

  interface VictoryGroupProps extends CommonProps {
    children?: ReactNode;
    offset?: number;
    colorScale?: string[] | string;
  }

  export const VictoryGroup: React.FC<VictoryGroupProps>;
  export const VictoryChart: React.FC<VictoryChartProps>;
  export const VictoryBar: React.FC<VictoryBarProps>;
  export const VictoryLine: React.FC<VictoryLineProps>;
  export const VictoryAxis: React.FC<VictoryAxisProps>;
  export const VictoryPie: React.FC<VictoryPieProps>;
  export const VictoryTooltip: React.FC<VictoryTooltipProps>;
  export const VictoryLabel: React.FC<VictoryLabelProps>;
}
