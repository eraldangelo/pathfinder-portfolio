const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toRgba = (color: string, opacity: number) => {
  const value = String(color || '').trim();
  const clampedOpacity = clamp(opacity, 0, 1);
  const shortHex = /^#([0-9a-f]{3})$/i.exec(value);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split('').map((char) => parseInt(char + char, 16));
    return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`;
  }
  const fullHex = /^#([0-9a-f]{6})$/i.exec(value);
  if (fullHex) {
    const hex = fullHex[1];
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`;
  }
  return value;
};

const createMarkerNode = ({
  diameter,
  fillColor,
  fillOpacity,
  strokeColor,
  strokeWeight,
  labelText,
  labelColor,
  fontSize,
  fontWeight,
}: {
  diameter: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWeight: number;
  labelText: string;
  labelColor: string;
  fontSize: number;
  fontWeight: number;
}) => {
  const node = document.createElement('div');
  node.style.width = `${diameter}px`;
  node.style.height = `${diameter}px`;
  node.style.display = 'flex';
  node.style.alignItems = 'center';
  node.style.justifyContent = 'center';
  node.style.borderRadius = '9999px';
  node.style.boxSizing = 'border-box';
  node.style.border = `${strokeWeight}px solid ${strokeColor}`;
  node.style.backgroundColor = toRgba(fillColor, fillOpacity);
  if (labelText) {
    node.style.color = labelColor;
    node.style.fontSize = `${fontSize}px`;
    node.style.fontWeight = String(fontWeight);
    node.style.lineHeight = '1';
    node.textContent = labelText;
  }
  return node;
};

export const createAdvancedMarker = ({
  maps,
  position,
  diameter,
  fillColor,
  fillOpacity,
  strokeColor,
  strokeWeight,
  labelText,
  labelColor,
  fontSize,
  fontWeight,
  zIndex,
  title,
}: {
  maps: any;
  position: any;
  diameter: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWeight: number;
  labelText: string;
  labelColor: string;
  fontSize: number;
  fontWeight: number;
  zIndex: number;
  title?: string;
}) => {
  const AdvancedMarkerElement = maps?.marker?.AdvancedMarkerElement;
  if (typeof AdvancedMarkerElement !== 'function' || typeof document === 'undefined') {
    throw new Error('AdvancedMarkerElement API is unavailable.');
  }
  return new AdvancedMarkerElement({
    position,
    content: createMarkerNode({
      diameter,
      fillColor,
      fillOpacity,
      strokeColor,
      strokeWeight,
      labelText,
      labelColor,
      fontSize,
      fontWeight,
    }),
    zIndex,
    title,
  });
};
