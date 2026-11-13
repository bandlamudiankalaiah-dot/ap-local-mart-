import React from 'react';
import { FilterState, Category } from '../../types';
import { Star, RotateCcw, Sparkles } from 'lucide-react';

interface FilterSidebarProps {
  categories: Category[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availableBrands: string[];
  availableDistricts: string[];
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  filters,
  onFilterChange,
  availableBrands,
  availableDistricts
}) => {
  const resetFilters = () => {
    onFilterChange({
      sortBy: 'popularity',
      brands: []
    });
  };

  const handleBrandToggle = (brand: string) => {
    const nextBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    onFilterChange({ ...filters, brands: nextBrands });
  };

  return (
    <aside className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-6 text-xs text-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Andhra Special Only Toggle */}
      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-700 fill-amber-700" />
          <div>
            <span className="font-bold text-xs text-amber-950 block">AP Specials Only</span>
            <span className="text-[10px] text-amber-800/80">GI Tag & Andhra Heritage</span>
          </div>
        </div>
        <input
          id="filter-ap-special"
          type="checkbox"
          checked={!!filters.andhraSpecialOnly}
          onChange={e => onFilterChange({ ...filters, andhraSpecialOnly: e.target.checked || undefined })}
          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
        />
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Category</h4>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50">
            <input
              type="radio"
              name="filter-cat"
              checked={!filters.categoryId}
              onChange={() => onFilterChange({ ...filters, categoryId: undefined })}
              className="text-amber-600 focus:ring-amber-500 accent-amber-600"
            />
            <span className={!filters.categoryId ? 'font-bold text-amber-800' : 'text-slate-600'}>
              All Categories
            </span>
          </label>
          {categories.map(cat => (
            <label
              key={cat.id}
              className="flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50"
            >
              <input
                type="radio"
                name="filter-cat"
                checked={filters.categoryId === cat.id}
                onChange={() => onFilterChange({ ...filters, categoryId: cat.id })}
                className="text-amber-600 focus:ring-amber-500 accent-amber-600"
              />
              <span className={filters.categoryId === cat.id ? 'font-bold text-amber-800' : 'text-slate-600'}>
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2 border-t border-slate-100 pt-4">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Price (₹)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Min</label>
            <input
              type="number"
              value={filters.minPrice || ''}
              onChange={e => onFilterChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="₹0"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Max</label>
            <input
              type="number"
              value={filters.maxPrice || ''}
              onChange={e => onFilterChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="₹25000"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Customer Rating Filter */}
      <div className="space-y-2 border-t border-slate-100 pt-4">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Customer Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map(rating => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50">
              <input
                type="radio"
                name="filter-rating"
                checked={filters.minRating === rating}
                onChange={() => onFilterChange({ ...filters, minRating: rating })}
                className="text-amber-600 focus:ring-amber-500 accent-amber-600"
              />
              <div className="flex items-center gap-1 font-semibold text-slate-700">
                <span>{rating}★ & above</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      {availableBrands.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Brands & Cooperatives</h4>
          <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
            {availableBrands.map(b => (
              <label key={b} className="flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={filters.brands.includes(b)}
                  onChange={() => handleBrandToggle(b)}
                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                />
                <span className="text-slate-700 truncate">{b}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* In Stock Only */}
      <div className="border-t border-slate-100 pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            id="filter-in-stock"
            type="checkbox"
            checked={!!filters.inStockOnly}
            onChange={e => onFilterChange({ ...filters, inStockOnly: e.target.checked || undefined })}
            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
          />
          <span className="font-bold text-slate-800">In Stock Only</span>
        </label>
      </div>
    </aside>
  );
};
