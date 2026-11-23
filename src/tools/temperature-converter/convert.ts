export const units = ['C', 'F', 'K'] as const;
export type TemperatureUnit = typeof units[number];

export function convertTemperature(text: string, unit: TemperatureUnit) {
  const input = text.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(input)) return;
  const value = Number(input);
  const minimum = { C: -273.15, F: -459.67, K: 0 }[unit];
  if (!Number.isFinite(value) || value < minimum) return;
  const kelvin = value === minimum ? 0 : unit === 'K' ? value
    : unit === 'C' ? value + 273.15 : (value + 459.67) / 1.8;
  const result = {
    K: kelvin,
    C: unit === 'C' ? value : kelvin - 273.15,
    F: unit === 'F' ? value : kelvin * 1.8 - 459.67,
  };
  if (Object.values(result).every(Number.isFinite)) return result;
}
