import React from 'react';

const CATEGORIES = ['All', 'Tech', 'Music', 'Sports', 'Arts', 'Food', 'Business', 'Education'];
const CITIES = ['All', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune'];

const FilterSidebar = ({ filters, setFilters, clearFilters }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-md font-bold text-slate-800 dark:text-white">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-5">
        {/* Category */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Category
          </label>
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            City
          </label>
          <select
            name="city"
            value={filters.city}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Pricing */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Pricing
          </label>
          <div className="flex gap-2">
            {['All', 'free', 'paid'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, pricing: p }))}
                className={`flex-1 rounded-xl py-2 text-xs font-bold uppercase tracking-wide border transition-all ${
                  filters.pricing === p
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Date Bounds
          </label>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-1">From</p>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-1">To</p>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
