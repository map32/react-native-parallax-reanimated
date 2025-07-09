import { interpolate, type Extrapolation } from 'react-native-reanimated';


type ExtrapolationString = 'clamp' | 'identity' | 'extend';

type ExtrapolationType = ExtrapolationString | {
  extrapolateLeft?: Extrapolation;
  extrapolateRight?: Extrapolation;
};

/**
 * Parses a value string (e.g., "100%", "90deg", "1.5rad", "0.5turn", "100")
 * and extracts its numerical value and unit.
 * @param {string | number} value - The value to parse.
 * @returns {{value: number, unit: string | null}} - An object containing the numerical value and its unit.
 */
const parseValueAndUnit = (value: string | number) => {
    'worklet';
  if (typeof value === 'number') {
    return { value, unit: null };
  }

  const strValue = String(value).trim();
  const match = strValue.match(/^([-+]?\d*\.?\d+)(%|deg|rad|turn)?$/);

  if (!match) {
    // If the value is a string but doesn't match expected units, try parsing as a number
    const numValue = parseFloat(strValue);
    if (!isNaN(numValue)) {
      return { value: numValue, unit: null };
    }
    throw new Error(`Invalid value format: ${value}. Expected a number or a number followed by %, deg, rad, or turn.`);
  }

  const numValue = parseFloat(match[1]!);
  const unit = match[2] || null; // null if no unit specified

  return { value: numValue, unit };
};

/**
 * Converts a value from its specific unit to a base numerical representation (radians for angles, decimal for percentages).
 * - Degrees, radians, turns are converted to radians.
 * - Percentages are converted to a decimal (e.g., "100%" -> 1.0).
 * - Plain numbers remain as is.
 * @param {number} value - The numerical part of the value.
 * @param {string | null} unit - The unit of the value (e.g., "deg", "rad", "turn", "%", null).
 * @returns {number} - The value in its base numerical representation.
 */
const convertToBaseUnit = (value: number, unit: string | null) => {
    'worklet';
  switch (unit) {
    case 'deg':
      return value * (Math.PI / 180); // Degrees to Radians
    case 'rad':
      return value; // Radians are already base
    case 'turn':
      return value * (2 * Math.PI); // Turns to Radians
    case '%':
      return value / 100; // Percentage to Decimal
    default:
      return value; // Plain number
  }
};

/**
 * Custom interpolation hook that accepts percentage, rads, turns, and degree values
 * in its outputRange, leveraging react-native-reanimated's interpolate function (v3).
 *
 * @param {number | string} value - The value to interpolate.
 * @param {(string | number)[]} inputRange - An array of input values. Must be sorted in ascending order.
 * @param {(string | number)[]} outputRange - An array of output values, which can include units (e.g., "100%", "90deg").
 * @param {Object} [options] - Optional configuration for reanimated's interpolate.
 * @param {'extend' | 'clamp' | 'identity'} [options.extrapolate='extend'] - How to handle values outside the inputRange.
 * @param {'extend' | 'clamp' | 'identity'} [options.extrapolateLeft] - How to handle values below the first inputRange value.
 * @param {'extend' | 'clamp' | 'identity'} [options.extrapolateRight] - How to handle values above the last inputRange value.
 * @returns {DerivedValue<string | number>} - A DerivedValue representing the interpolated value, with the unit of the first outputRange element.
 */
const augmentedInterpolate = (value: number | string, inputRange: readonly (string | number)[], outputRange: readonly (string | number)[], options?: ExtrapolationType) => {
    'worklet'; // Mark as worklet for Reanimated 3 to run on UI thread
    if (inputRange.length < 2 || outputRange.length < 2) {
        console.error('Input and output ranges must have at least 2 elements.');
        // Return a derived value that holds a static value in case of error
        const { value: numVal, unit } = parseValueAndUnit(outputRange[0]!);
        return convertToBaseUnit(numVal, unit); // Default to first output value's base
    }

    const { unit: targetUnit } = parseValueAndUnit(outputRange[0]!);
    const valueNumberAndUnit = parseValueAndUnit(value);

    const normalizedOutputRange = outputRange.map(val => {
        const { value: numVal, unit } = parseValueAndUnit(val);
        return convertToBaseUnit(numVal, unit);
    });

    const normalizedInputRange = inputRange.map(val => {
        const { value: numVal, unit } = parseValueAndUnit(val);
        return convertToBaseUnit(numVal, unit);
    });

    const interpolatedBaseValue = interpolate(
        valueNumberAndUnit.value, // Access the .value of SharedValue
        normalizedInputRange,
        normalizedOutputRange,
        options
        );

    if (targetUnit === null) {
        return interpolatedBaseValue; // If no unit, return the number directly
    }

    let scaledValue = interpolatedBaseValue;
    switch (targetUnit) {
        case 'deg':
        scaledValue = interpolatedBaseValue * (180 / Math.PI);
        break;
        case 'rad':
        // Already in radians, no scaling needed
        break;
        case 'turn':
        scaledValue = interpolatedBaseValue / (2 * Math.PI);
        break;
        case '%':
        scaledValue = interpolatedBaseValue * 100;
        break;
    }

    // Template literals work directly inside worklets for string concatenation
    return `${scaledValue}${targetUnit}`;
};

// Export the functions for use in other files
export { parseValueAndUnit, convertToBaseUnit, augmentedInterpolate };
