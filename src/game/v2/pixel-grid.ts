/** The world has one authored pixel grid. Resize its window, never stretch that grid. */
export function pixelViewport(cssWidth: number, cssHeight: number): { width: number; height: number; scale: number } {
  const scale = cssWidth >= 960 ? 3 : 2;
  // Cover odd viewport sizes by at most two CSS pixels. The parent crops those
  // spare edge pixels instead of squeezing every pixel or letterboxing a phone.
  return {
    width: Math.max(1, Math.ceil(cssWidth / scale)),
    height: Math.max(1, Math.ceil(cssHeight / scale)),
    scale,
  };
}
