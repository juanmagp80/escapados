"use client";

import { useRouter } from "next/navigation";

export default function CityFilter({ cities, currentFilter }) {
  const router = useRouter();

  const handleChange = (e) => {
    const value = e.target.value;
    const url = new URL(window.location);
    if (value === "todas") {
      url.searchParams.delete("city");
    } else {
      url.searchParams.set("city", value);
    }
    router.push(url.toString());
  };

  return (
    <label className="mb-3 block text-sm">
      <span className="text-stone-500">Filtrar ciudad:</span>
      <select
        value={currentFilter}
        onChange={handleChange}
        className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      >
        <option value="todas">Todas las ciudades ({cities.length})</option>
        {cities.map((city) => (
          <option key={city.slug} value={city.slug}>
            {city.name} ({city.options.length})
          </option>
        ))}
      </select>
    </label>
  );
}
