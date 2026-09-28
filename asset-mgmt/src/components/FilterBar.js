'use client';

/**
 * FilterBar — search + dropdown filters for asset/issue listing pages.
 * 
 * Props:
 *   searchValue    — current search string
 *   onSearchChange — callback(value)
 *   searchPlaceholder — input placeholder
 *   filters        — Array of { key, label, value, options: [{value, label}], onChange }
 *   onClear        — callback to reset all filters
 *   showClear      — whether to show the clear button
 */

export default function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  onClear,
  showClear = false,
}) {
  return (
    <div className="filter-bar" id="filter-bar">
      {onSearchChange && (
        <div className="filter-search">
          <span className="filter-search-icon">🔍</span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            id="filter-search-input"
          />
        </div>
      )}

      {filters.map((filter) => (
        <select
          key={filter.key}
          className="filter-select"
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          id={`filter-${filter.key}`}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {showClear && onClear && (
        <button className="filter-clear" onClick={onClear} id="filter-clear-btn">
          ✕ Clear filters
        </button>
      )}
    </div>
  );
}
