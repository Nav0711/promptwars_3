import { calculateCo2e } from './emissionFactors';

interface ParsedActivity {
  category: string;
  subcategory: string;
  description: string;
  quantity: number;
  unit: string;
  confidence: number;
  co2eKg?: number;
}

interface ParserResult {
  activities: ParsedActivity[];
  clarificationNeeded: boolean;
  clarificationQuestion: string | null;
}

export function parseActivityFallback(text: string): ParserResult {
  const normalized = text.toLowerCase().trim();
  const activities: ParsedActivity[] = [];

  // 1. CAR / TRANSPORT REGEXES
  // matches: "drove 15 km", "drive 10km", "car 20 km", "car ride for 5 miles"
  const carRegex = /(?:drove|drive|car|taxi|uber|ride)(?:\s+for)?\s+(\d+(?:\.\d+)?)\s*(km|miles|mi)/i;
  const carMatch = normalized.match(carRegex);
  if (carMatch) {
    let distance = parseFloat(carMatch[1]);
    const unit = carMatch[2];
    // Convert miles to km for base factor
    if (unit.startsWith('mi')) {
      distance = distance * 1.60934;
    }
    activities.push({
      category: 'transport',
      subcategory: 'car',
      description: `Car travel (${Math.round(distance)} km)`,
      quantity: Math.round(distance * 10) / 10,
      unit: 'km',
      confidence: 0.85
    });
  }

  // BUS REGEXES
  // matches: "bus 10 km", "took the bus for 5 km"
  const busRegex = /(?:bus|took the bus)(?:\s+for)?\s+(\d+(?:\.\d+)?)\s*(km|miles|mi)/i;
  const busMatch = normalized.match(busRegex);
  if (busMatch) {
    let distance = parseFloat(busMatch[1]);
    const unit = busMatch[2];
    if (unit.startsWith('mi')) {
      distance = distance * 1.60934;
    }
    activities.push({
      category: 'transport',
      subcategory: 'bus',
      description: `Bus commute (${Math.round(distance)} km)`,
      quantity: Math.round(distance * 10) / 10,
      unit: 'km',
      confidence: 0.85
    });
  }

  // METRO REGEXES
  // matches: "metro 12 km", "subway for 4 km", "train for 20 km"
  const metroRegex = /(?:metro|subway|train|tube)(?:\s+for)?\s+(\d+(?:\.\d+)?)\s*(km|miles|mi)/i;
  const metroMatch = normalized.match(metroRegex);
  if (metroMatch) {
    let distance = parseFloat(metroMatch[1]);
    const unit = metroMatch[2];
    if (unit.startsWith('mi')) {
      distance = distance * 1.60934;
    }
    activities.push({
      category: 'transport',
      subcategory: 'metro',
      description: `Metro/Subway transit (${Math.round(distance)} km)`,
      quantity: Math.round(distance * 10) / 10,
      unit: 'km',
      confidence: 0.85
    });
  }

  // FLIGHT REGEXES
  // matches: "flight 400 km", "flew 500km"
  const flightRegex = /(?:flight|flew|fly|plane)(?:\s+for)?\s+(\d+(?:\.\d+)?)\s*(km|miles|mi)/i;
  const flightMatch = normalized.match(flightRegex);
  if (flightMatch) {
    let distance = parseFloat(flightMatch[1]);
    const unit = flightMatch[2];
    if (unit.startsWith('mi')) {
      distance = distance * 1.60934;
    }
    activities.push({
      category: 'transport',
      subcategory: 'flight',
      description: `Short-haul flight (${Math.round(distance)} km)`,
      quantity: Math.round(distance * 10) / 10,
      unit: 'km',
      confidence: 0.80
    });
  }

  // 2. FOOD REGEXES
  // matches: "ate beef", "had beef lunch", "beef meal", "beef burger"
  if (normalized.includes('beef') || normalized.includes('steak') || normalized.includes('pork') || normalized.includes('red meat')) {
    activities.push({
      category: 'food',
      subcategory: 'beef',
      description: 'Beef/Red meat meal',
      quantity: 1,
      unit: 'meal',
      confidence: 0.90
    });
  } else if (normalized.includes('chicken') || normalized.includes('poultry') || normalized.includes('turkey')) {
    activities.push({
      category: 'food',
      subcategory: 'chicken',
      description: 'Chicken/Poultry meal',
      quantity: 1,
      unit: 'meal',
      confidence: 0.90
    });
  } else if (normalized.includes('vegan')) {
    activities.push({
      category: 'food',
      subcategory: 'vegan',
      description: 'Vegan meal',
      quantity: 1,
      unit: 'meal',
      confidence: 0.90
    });
  } else if (normalized.includes('vegetarian') || normalized.includes('veggie') || normalized.includes('salad')) {
    activities.push({
      category: 'food',
      subcategory: 'vegetarian',
      description: 'Vegetarian meal',
      quantity: 1,
      unit: 'meal',
      confidence: 0.80
    });
  }

  // 3. UTILITIES/AC REGEXES
  // matches: "electricity 5 kwh", "used 10 kwh"
  const elecRegex = /(\d+(?:\.\d+)?)\s*(kwh|kilowatt)/i;
  const elecMatch = normalized.match(elecRegex);
  if (elecMatch) {
    activities.push({
      category: 'electricity',
      subcategory: 'grid',
      description: `Electricity usage (${elecMatch[1]} kWh)`,
      quantity: parseFloat(elecMatch[1]),
      unit: 'kWh',
      confidence: 0.90
    });
  }

  // matches: "ac for 4 hours", "ac running for 3 hrs"
  const acRegex = /(?:ac|air conditioning|air conditioner)(?:\s+\w+){0,3}\s+(\d+(?:\.\d+)?)\s*(?:hour|hr|h)/i;
  const acMatch = normalized.match(acRegex);
  if (acMatch) {
    const hours = parseFloat(acMatch[1]);
    const kwh = hours * 1.5; // Heuristic: Standard AC unit consumes ~1.5 kWh/hour
    activities.push({
      category: 'electricity',
      subcategory: 'grid',
      description: `Air Conditioning running for ${hours} hours (~${kwh.toFixed(1)} kWh)`,
      quantity: parseFloat(kwh.toFixed(2)),
      unit: 'kWh',
      confidence: 0.75
    });
  }

  // 4. WATER REGEXES
  // matches: "shower for 10 minutes", "15 minute shower"
  const showerRegex = /(?:shower)(?:\s+\w+){0,3}\s+(\d+(?:\.\d+)?)\s*(?:minute|min|m)/i;
  const showerRegex2 = /(\d+(?:\.\d+)?)\s*(?:minute|min)\s+shower/i;
  const showerMatch = normalized.match(showerRegex) || normalized.match(showerRegex2);
  if (showerMatch) {
    const minutes = parseFloat(showerMatch[1]);
    const liters = minutes * 9.5; // Heuristic: average low-flow showerhead is ~9.5 liters/min
    activities.push({
      category: 'water',
      subcategory: 'water_use',
      description: `Shower for ${minutes} minutes (~${Math.round(liters)} liters)`,
      quantity: Math.round(liters),
      unit: 'liters',
      confidence: 0.75
    });
  }

  // matches: "100 liters of water", "used 50 l of water"
  const waterRegex = /(\d+(?:\.\d+)?)\s*(?:liter|liters|l)(?:\s+of)?\s+water/i;
  const waterMatch = normalized.match(waterRegex);
  if (waterMatch) {
    activities.push({
      category: 'water',
      subcategory: 'water_use',
      description: `Water usage (${waterMatch[1]} liters)`,
      quantity: parseFloat(waterMatch[1]),
      unit: 'liters',
      confidence: 0.85
    });
  }

  // 5. WASTE REGEXES
  // matches: "5 kg of trash", "10kg landfill", "waste 2 kg"
  const wasteRegex = /(\d+(?:\.\d+)?)\s*(kg|kilogram|kilograms|lbs|pounds|lb)(?:\s+of)?\s*(trash|waste|garbage|landfill)/i;
  const wasteMatch = normalized.match(wasteRegex);
  if (wasteMatch) {
    let weight = parseFloat(wasteMatch[1]);
    const unit = wasteMatch[2];
    if (unit.startsWith('lb')) {
      weight = weight * 0.453592; // lbs to kg
    }
    activities.push({
      category: 'waste',
      subcategory: 'landfill',
      description: `Landfill waste (${Math.round(weight)} kg)`,
      quantity: Math.round(weight * 10) / 10,
      unit: 'kg',
      confidence: 0.85
    });
  }

  // 6. SHOPPING REGEXES
  // matches: "spent $50", "bought clothes for $40", "spent 100 dollars"
  const shoppingRegex = /(?:spent|bought|spent\s+\$|cost)\s*(?:\$)?\s*(\d+(?:\.\d+)?)(?:\s*usd|\s*dollars)?/i;
  const shoppingMatch = normalized.match(shoppingRegex);
  if (shoppingMatch) {
    const spend = parseFloat(shoppingMatch[1]);
    activities.push({
      category: 'shopping',
      subcategory: 'goods',
      description: `Shopping spend ($${spend})`,
      quantity: spend,
      unit: 'usd',
      confidence: 0.80
    });
  }

  // Calculate CO2e for all matched activities
  const finalizedActivities = activities.map(act => ({
    ...act,
    co2eKg: parseFloat(calculateCo2e(act.category, act.subcategory, act.quantity, act.unit).toFixed(3))
  }));

  // If no activities were parsed, request clarification
  if (finalizedActivities.length === 0) {
    // Check if the input mentions a specific category to tailor the clarification
    let categoryHint = '';
    if (normalized.includes('drive') || normalized.includes('car') || normalized.includes('travel') || normalized.includes('commute')) {
      categoryHint = 'transport (like distance driven)';
    } else if (normalized.includes('eat') || normalized.includes('food') || normalized.includes('meal') || normalized.includes('lunch')) {
      categoryHint = 'food (like what kind of meal)';
    } else if (normalized.includes('ac') || normalized.includes('electricity') || normalized.includes('light')) {
      categoryHint = 'energy (like hours run or kWh)';
    } else if (normalized.includes('shower') || normalized.includes('water') || normalized.includes('wash')) {
      categoryHint = 'water (like shower minutes or liters)';
    }

    const question = categoryHint
      ? `I detected you're logging something related to ${categoryHint}. Could you specify the details like the distance, meal type, or minutes?`
      : "I couldn't quite extract the exact quantities. Could you please specify your activity category (e.g. drove 10 km, ate beef, shower for 15 minutes) and the amounts?";

    return {
      activities: [],
      clarificationNeeded: true,
      clarificationQuestion: question
    };
  }

  return {
    activities: finalizedActivities,
    clarificationNeeded: false,
    clarificationQuestion: null
  };
}
