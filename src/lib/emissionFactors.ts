export interface EmissionFactor {
  factor: number; // kg CO2e per unit standard
  unit: string;
}

export const emissionFactors: Record<string, Record<string, EmissionFactor>> = {
  transport: {
    car: { factor: 0.192, unit: 'km' },
    bus: { factor: 0.105, unit: 'km' },
    metro: { factor: 0.041, unit: 'km' },
    subway: { factor: 0.041, unit: 'km' },
    flight: { factor: 0.255, unit: 'km' }
  },
  food: {
    beef: { factor: 6.61, unit: 'meal' },
    chicken: { factor: 1.57, unit: 'meal' },
    vegetarian: { factor: 0.84, unit: 'meal' },
    vegan: { factor: 0.59, unit: 'meal' }
  },
  electricity: {
    grid: { factor: 0.45, unit: 'kWh' }
  },
  water: {
    water_use: { factor: 0.34, unit: '100 liters' }
  },
  waste: {
    landfill: { factor: 0.58, unit: 'kg' }
  },
  shopping: {
    goods: { factor: 0.6, unit: '$10' }
  }
};

/**
 * Calculates CO2e emissions in kg for a given activity
 */
export function calculateCo2e(
  category: string,
  subcategory: string,
  quantity: number,
  unit: string
): number {
  const cat = category.toLowerCase().trim();
  const sub = subcategory.toLowerCase().trim();

  // Handle category synonyms
  const mappedCat = cat === 'utilities' ? 'electricity' : cat;

  const categoryFactors = emissionFactors[mappedCat];
  if (!categoryFactors) {
    return 0;
  }

  // Resolve subcategory synonyms
  let mappedSub = sub;
  if (mappedCat === 'transport') {
    if (sub.includes('car') || sub.includes('petrol') || sub.includes('drive')) mappedSub = 'car';
    else if (sub.includes('bus')) mappedSub = 'bus';
    else if (sub.includes('metro') || sub.includes('subway') || sub.includes('train')) mappedSub = 'metro';
    else if (sub.includes('flight') || sub.includes('plane') || sub.includes('fly')) mappedSub = 'flight';
  } else if (mappedCat === 'food') {
    if (sub.includes('beef') || sub.includes('steak') || sub.includes('meat')) mappedSub = 'beef';
    else if (sub.includes('chicken') || sub.includes('poultry')) mappedSub = 'chicken';
    else if (sub.includes('vegan')) mappedSub = 'vegan';
    else if (sub.includes('vegetarian') || sub.includes('veg')) mappedSub = 'vegetarian';
  } else if (mappedCat === 'electricity' || mappedCat === 'utility') {
    mappedSub = 'grid';
  } else if (mappedCat === 'water') {
    mappedSub = 'water_use';
  } else if (mappedCat === 'waste') {
    mappedSub = 'landfill';
  } else if (mappedCat === 'shopping') {
    mappedSub = 'goods';
  }

  const factorConfig = categoryFactors[mappedSub] || Object.values(categoryFactors)[0];
  if (!factorConfig) {
    return 0;
  }

  const normalizedUnit = unit.toLowerCase().trim();

  // Unit conversion rules
  if (mappedCat === 'water') {
    // factor is per 100 liters
    if (normalizedUnit === 'liters' || normalizedUnit === 'liter' || normalizedUnit === 'l') {
      return quantity * (factorConfig.factor / 100);
    }
  }

  if (mappedCat === 'shopping') {
    // factor is per $10 spent
    if (normalizedUnit === 'usd' || normalizedUnit === 'dollars' || normalizedUnit === 'dollar' || normalizedUnit === '$') {
      return quantity * (factorConfig.factor / 10);
    }
  }

  // Otherwise, apply factor directly
  return quantity * factorConfig.factor;
}
