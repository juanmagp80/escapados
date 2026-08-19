"use client";

export default function CityFilter({ cities, value, onChange }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="text-stone-500">Filtrar ciudad:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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