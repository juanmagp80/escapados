export const DEFAULT_SCORING_WEIGHTS = {
  distance: 0.2,
  price: 0.2,
  budgetCompliance: 0.2,
  rating: 0.15,
  region: 0.1,
  travelTime: 0.05,
  interests: 0.1,
};

export function scoreDestination(destination, { budget, maxDistanceKm, weights = DEFAULT_SCORING_WEIGHTS, interests = [] } = {}) {
  const w = { ...DEFAULT_SCORING_WEIGHTS, ...weights };
  let score = 0;
  const reasons = [];

  // Intereses del usuario: si el destino encaja, suma puntos.
  if (Array.isArray(interests) && interests.length > 0) {
    const destInterests = destination.interests || [];
    const matches = destInterests.filter((i) => interests.includes(i));
    if (matches.length > 0) {
      const interestScore = Math.min(100, matches.length * 35);
      score += interestScore * w.interests * 100;
      reasons.push(`💕 Encaja con tus intereses (${matches.join(", ")})`);
    }
  }

  const distKm = destination.distanceKm || (destination.distanceMeters ? destination.distanceMeters / 1000 : null);

  if (distKm !== null && maxDistanceKm) {
    const distanceScore = Math.max(0, 100 - (distKm / maxDistanceKm) * 100);
    score += distanceScore * w.distance * 100;
    if (distKm < maxDistanceKm * 0.3) reasons.push("🚀 Muy cerca");
    else if (distKm < maxDistanceKm * 0.6) reasons.push("🚗 Distancia cómoda");
  }

  const estCost = destination.estimatedCost;
  if (typeof estCost === "number") {
    if (budget) {
      if (estCost <= budget) {
        score += 100 * w.budgetCompliance;
        reasons.push("💰 Dentro del presupuesto");
      } else if (estCost <= budget * 1.15) {
        score += 60 * w.budgetCompliance;
        reasons.push("🟡 Cerca del presupuesto");
      } else if (estCost <= budget * 1.3) {
        score += 30 * w.budgetCompliance;
        reasons.push("🟠 Ligeramente por encima");
      }
    }
    const priceScore = Math.max(0, 100 - estCost / 20);
    score += priceScore * w.price * 100;
  }

  if (typeof destination.rating === "number" && destination.rating > 0) {
    const ratingScore = Math.min(100, destination.rating * 20);
    score += ratingScore * w.rating * 100;
    if (destination.rating >= 4.5) reasons.push("⭐ Excelente valoración");
    else if (destination.rating >= 4.0) reasons.push("⭐ Muy buena valoración");
  }

  if (destination.region === "costa") {
    score += 50 * w.region * 100;
    reasons.push("🏖️ Destino de costa");
  } else if (destination.region === "interior") {
    score += 30 * w.region * 100;
    reasons.push("🏞️ Destino de interior");
  }

  if (destination.distanceKm !== null && destination.durationSeconds !== null) {
    const hours = destination.durationSeconds / 3600;
    const timeScore = Math.max(0, 100 - hours * 15);
    score += timeScore * w.travelTime * 100;
  }

  return { score: Math.round(score * 10) / 10, reasons };
}

export function getScoringWeights() {
  return DEFAULT_SCORING_WEIGHTS;
}