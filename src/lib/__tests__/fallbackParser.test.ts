import { describe, it, expect } from 'vitest';
import { parseActivityFallback } from '../fallbackParser';

describe('parseActivityFallback', () => {
  it('should parse car transport accurately', () => {
    const result = parseActivityFallback('I drove 15.5 km today');
    expect(result.clarificationNeeded).toBe(false);
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]).toMatchObject({
      category: 'transport',
      subcategory: 'car',
      quantity: 15.5,
      unit: 'km',
    });
    expect(result.activities[0].co2eKg).toBeGreaterThan(0);
  });

  it('should convert miles to km for car transport', () => {
    const result = parseActivityFallback('car ride for 10 miles');
    expect(result.activities[0].quantity).toBeCloseTo(16.1, 1); // 10 * 1.60934
    expect(result.activities[0].unit).toBe('km');
  });

  it('should parse bus transport', () => {
    const result = parseActivityFallback('took the bus for 5.2 km');
    expect(result.activities[0]).toMatchObject({
      category: 'transport',
      subcategory: 'bus',
      quantity: 5.2,
      unit: 'km',
    });
  });

  it('should parse metro transport', () => {
    const result = parseActivityFallback('subway for 4 miles');
    expect(result.activities[0]).toMatchObject({
      category: 'transport',
      subcategory: 'metro',
      quantity: 6.4, // 4 * 1.609
    });
  });

  it('should parse flight transport', () => {
    const result = parseActivityFallback('flew 500.5km');
    expect(result.activities[0]).toMatchObject({
      category: 'transport',
      subcategory: 'flight',
      quantity: 500.5,
    });
  });

  it('should parse food activities', () => {
    const beefResult = parseActivityFallback('had a steak for lunch');
    expect(beefResult.activities[0]).toMatchObject({
      category: 'food',
      subcategory: 'beef',
      quantity: 1,
    });

    const veganResult = parseActivityFallback('ate vegan today');
    expect(veganResult.activities[0]).toMatchObject({
      category: 'food',
      subcategory: 'vegan',
      quantity: 1,
    });
  });

  it('should parse electricity usage in kWh', () => {
    const result = parseActivityFallback('used 12.5 kwh of electricity');
    expect(result.activities[0]).toMatchObject({
      category: 'electricity',
      subcategory: 'grid',
      quantity: 12.5,
      unit: 'kWh',
    });
  });

  it('should parse AC usage and convert to estimated kWh', () => {
    const result = parseActivityFallback('ac running for 3 hours');
    expect(result.activities[0]).toMatchObject({
      category: 'electricity',
      subcategory: 'grid',
      quantity: 4.5, // 3 * 1.5
      unit: 'kWh',
    });
  });

  it('should parse shower minutes to estimated liters', () => {
    const result = parseActivityFallback('15 minute shower');
    expect(result.activities[0]).toMatchObject({
      category: 'water',
      subcategory: 'water_use',
      quantity: 143, // 15 * 9.5 = 142.5 -> rounded to 143
      unit: 'liters',
    });
  });

  it('should parse exact water liters', () => {
    const result = parseActivityFallback('used 50 liters of water');
    expect(result.activities[0]).toMatchObject({
      category: 'water',
      subcategory: 'water_use',
      quantity: 50,
      unit: 'liters',
    });
  });

  it('should parse waste in kg and convert lbs', () => {
    const kgResult = parseActivityFallback('thrown away 5.5 kg of trash');
    expect(kgResult.activities[0]).toMatchObject({
      category: 'waste',
      quantity: 5.5,
      unit: 'kg',
    });

    const lbsResult = parseActivityFallback('10 lbs landfill');
    expect(lbsResult.activities[0].quantity).toBeCloseTo(4.5, 1); // 10 * 0.453592
  });

  it('should parse shopping spend', () => {
    const result = parseActivityFallback('spent $45.50 on clothes');
    expect(result.activities[0]).toMatchObject({
      category: 'shopping',
      subcategory: 'goods',
      quantity: 45.5,
      unit: 'usd',
    });
  });

  it('should handle unparseable text by requesting clarification', () => {
    const result = parseActivityFallback('hello world');
    expect(result.clarificationNeeded).toBe(true);
    expect(result.activities).toHaveLength(0);
    expect(result.clarificationQuestion).toContain('specify your activity category');
  });

  it('should provide targeted clarification for specific keywords', () => {
    const driveResult = parseActivityFallback('I commute today');
    expect(driveResult.clarificationNeeded).toBe(true);
    expect(driveResult.clarificationQuestion).toContain('distance driven');

    const foodResult = parseActivityFallback('I ate lunch');
    expect(foodResult.clarificationQuestion).toContain('what kind of meal');
  });
});
