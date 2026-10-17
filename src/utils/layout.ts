import { Dimensions, Platform } from 'react-native';

const BASE_WIDTH = 390;

export function getScreenMetrics() {
  const { width, height } = Dimensions.get('window');
  const shortest = Math.min(width, height);
  const scale = Math.min(Math.max(shortest / BASE_WIDTH, 0.85), 1.25);

  return {
    width,
    height,
    isCompact: shortest < 360,
    isTablet: shortest >= 768,
    scale,
    horizontalPadding: shortest < 360 ? 16 : shortest >= 768 ? 32 : 24,
    contentMaxWidth: shortest >= 768 ? 560 : undefined,
  };
}

export function scaledFont(size: number, scale: number): number {
  return Math.round(size * scale);
}

export const keyboardBehavior =
  Platform.OS === 'ios' ? ('padding' as const) : ('height' as const);
