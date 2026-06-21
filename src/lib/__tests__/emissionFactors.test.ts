import { describe, it, expect } from 'vitest';
import { calculateCo2e } from '../emissionFactors';

describe('calculateCo2e', () => {
  it('should calculate transport car emissions correctly', () => {
    // 10 km * 0.192 = 1.92
    expect(calculateCo2e('transport', 'car', 10, 'km')).toBeCloseTo(1.92, 3);
  });

  it('should handle transport synonyms (drive, petrol, flight)', () => {
    expect(calculateCo2e('transport', 'drive', 10, 'km')).toBeCloseTo(1.92, 3);
    expect(calculateCo2e('transport', 'petrol car', 10, 'km')).toBeCloseTo(1.92, 3);
    expect(calculateCo2e('transport', 'fly', 100, 'km')).toBeCloseTo(25.5, 3); // 100 * 0.255
  });

  it('should handle food synonyms (steak, poultry, veg)', () => {
    expect(calculateCo2e('food', 'steak', 2, 'meal')).toBeCloseTo(13.22, 3); // 2 * 6.61
    expect(calculateCo2e('food', 'poultry', 1, 'meal')).toBeCloseTo(1.57, 3); // 1 * 1.57
    expect(calculateCo2e('food', 'veg', 1, 'meal')).toBeCloseTo(0.84, 3); // 1 * 0.84
  });

  it('should calculate water usage per 100 liters', () => {
    // 50 liters * (0.34 / 100) = 0.17
    expect(calculateCo2e('water', 'water_use', 50, 'liters')).toBeCloseTo(0.17, 3);
    expect(calculateCo2e('water', 'shower', 200, 'l')).toBeCloseTo(0.68, 3); // Synonym check & 'l' unit
  });

  it('should calculate shopping emissions per $10 spent', () => {
    // 50 usd * (0.6 / 10) = 3.0
    expect(calculateCo2e('shopping', 'goods', 50, 'usd')).toBeCloseTo(3.0, 3);
    expect(calculateCo2e('shopping', 'clothes', 100, '$')).toBeCloseTo(6.0, 3);
  });

  it('should map utilities category to electricity', () => {
    expect(calculateCo2e('utilities', 'ac', 10, 'kWh')).toBeCloseTo(4.5, 3); // 10 * 0.45
  });

  it('should return 0 for unknown category', () => {
    expect(calculateCo2e('unknown_category', 'car', 10, 'km')).toBe(0);
  });

  it('should return default factor if unknown subcategory', () => {
    // Default for transport is 'car' (the first one)
    expect(calculateCo2e('transport', 'unknown_sub', 10, 'km')).toBeCloseTo(1.92, 3);
  });

  it('should handle negative quantities (returns negative emissions)', () => {
    expect(calculateCo2e('transport', 'car', -10, 'km')).toBeCloseTo(-1.92, 3);
  });

  it('should handle case-insensitive inputs and extra spaces', () => {
    expect(calculateCo2e('  TrAnSpOrT ', ' CaR ', 10, ' KM ')).toBeCloseTo(1.92, 3);
  });
});
