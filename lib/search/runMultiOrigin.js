import { runSearch } from "./runSearch";

// Karma: `splitOrigins` vive en lib/search/splitOrigins.js (módulo puro,
// importable desde cliente). Aquí lo reexportamos para mantener la API.
export { splitOrigins } from "./splitOrigins";

// Cuando el usuario busca "mes completo" o "vacaciones" en avión, cada vuelo
// es una opción distinta del mismo destino, así que no deduplicamos por ciudad.
function shouldDedupe(rest) {
  return !(rest.transport === "plane" && (rest.wholeMonth || rest.vacations));
}

// Decide si el candidato es mejor que el actual para un mismo destino.
// Avión: gana el más barato (y a igualdad, mejor score).
// Coche: gana el de mejor score (y a igualdad, más barato).
function isBetter(candidate, current, isPlane) {
  if (isPlane) {
    const c = candidate.estimatedCost ?? Number.MAX_SAFE_INTEGER;
    const cur = current.estimatedCost ?? Number.MAX_SAFE_INTEGER;
    if (c !== cur) return c < cur;
    return (candidate.score || 0) > (current.score || 0);
  }
  if ((candidate.score || 0) !== (current.score || 0)) {
    return (candidate.score || 0) > (current.score || 0);
  }
  return (
    (candidate.estimatedCost ?? Number.MAX_SAFE_INTEGER) <
    (current.estimatedCost ?? Number.MAX_SAFE_INTEGER)
  );
}

// Resumen compacto de una alternativa para mostrarla en la tarjeta.
function altInfo(d, origin) {
  return {
    origin,
    score: d.score,
    estimatedCost: d.estimatedCost,
    transportCost: d.transportCost,
    distanceLabel: d.distanceLabel,
    flight: d.flight
      ? { airline: d.flight.airline, totalPrice: d.flight.totalPrice }
      : null,
  };
}

function tagFlightOptions(d, originName) {
  for (const opt of d.flightOptions || []) {
    if (opt && typeof opt === "object") opt.originRef = originName;
  }
  return d;
}

// Busca escapadas desde varios orígenes y fusiona los resultados.
// Un mismo destino puede salir de varios orígenes; nos quedamos con el
// origen más favorable y guardamos el resto en `altOrigins`.
export async function runMultiOriginSearch({ origins, ...rest }) {
  const results = await Promise.all(
    (origins || []).map(async (originName) => {
      try {
        return {
          originName,
          result: await runSearch({ ...rest, origin: originName }),
        };
      } catch {
        return { originName, result: { error: "no-origin" } };
      }
    })
  );

  const valid = results.filter((r) => r.result && !r.result.error);
  const failedOrigins = results
    .filter((r) => r.result && r.result.error)
    .map((r) => r.originName);

  if (valid.length === 0) {
    return {
      error: "no-origin",
      originsSearched: (origins || []).length,
      failedOrigins,
    };
  }

  let list;
  if (shouldDedupe(rest)) {
    const bySlug = new Map();
    for (const { originName, result } of valid) {
      for (const raw of result.destinations || []) {
        const d = tagFlightOptions({ ...raw }, originName);
        const existing = bySlug.get(d.slug);
        if (!existing) {
          bySlug.set(d.slug, { best: { ...d, originRef: originName }, alts: [] });
          continue;
        }
        if (isBetter(d, existing.best, rest.transport === "plane")) {
          existing.alts.push(altInfo(existing.best, existing.best.originRef));
          existing.best = { ...d, originRef: originName };
        } else {
          existing.alts.push(altInfo(d, originName));
        }
      }
    }
    list = [...bySlug.values()].map(({ best, alts }) => ({
      ...best,
      altOrigins: alts,
    }));
  } else {
    // Mes completo: conservamos cada opción de cada origen, etiquetada.
    list = [];
    for (const { originName, result } of valid) {
      for (const raw of result.destinations || []) {
        list.push(
          tagFlightOptions({ ...raw, originRef: originName }, originName)
        );
      }
    }
  }

  if (rest.transport === "plane") {
    const withPrice = list.filter((d) => d.estimatedCost != null);
    withPrice.sort((a, b) => a.estimatedCost - b.estimatedCost);
    const noPrice = list.filter((d) => d.estimatedCost == null);
    noPrice.sort((a, b) => (b.score || 0) - (a.score || 0));
    list = [...withPrice, ...noPrice];
  } else {
    list.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  return {
    origins: valid.map((r) => r.originName),
    originsSearched: (origins || []).length,
    failedOrigins,
    destinations: list,
    best: list[0] || null,
    transport: rest.transport,
  };
}