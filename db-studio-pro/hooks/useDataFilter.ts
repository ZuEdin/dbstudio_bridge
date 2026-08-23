
import { useState, useMemo } from 'react';

export interface FilterState {
  [columnName: string]: string;
}

export type SortDirection = 'asc' | 'desc' | null;

export type FilterOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'starts_with' 
  | 'ends_with' 
  | 'greater_than' 
  | 'greater_equal' 
  | 'less_than' 
  | 'less_equal' 
  | 'is_empty' 
  | 'is_not_empty';

export interface AdvancedFilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
}

export type MatchMode = 'AND' | 'OR';

export const matchWildcard = (text: any, pattern: string): boolean => {
  const strVal = String(text ?? '').toLowerCase();
  const search = String(pattern ?? '').toLowerCase().trim();

  if (!search) return true;

  // If pattern contains wildcards * or ? or %
  if (search.includes('*') || search.includes('?') || search.includes('%')) {
    const escaped = search
      .replace(/[-\/\\^$+.()|[\]{}]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/%/g, '.*')
      .replace(/\?/g, '.');
    try {
      const regex = new RegExp(`^${escaped}$`, 'i');
      return regex.test(strVal);
    } catch {
      return strVal.includes(search);
    }
  }

  return strVal.includes(search);
};

export const useDataFilter = (
  data: Record<string, any>[], 
  fields?: { name: string; type: string }[]
) => {
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Advanced Filters
  const [advancedRules, setAdvancedRules] = useState<AdvancedFilterRule[]>([]);
  const [matchMode, setMatchMode] = useState<MatchMode>('AND');

  // 1. Analyze Data to find unique values for Dropdowns
  const columnStats = useMemo(() => {
    if (!data.length) return {};
    
    const stats: Record<string, { uniqueValues: string[], isLowCardinality: boolean }> = {};
    const columns = Object.keys(data[0]);
    const MAX_DROPDOWN_ITEMS = 50; // Threshold: if more unique values, show text input

    columns.forEach(col => {
      const values = new Set<string>();
      data.forEach(row => {
        const val = row[col];
        if (val !== undefined && val !== null && val !== '') {
          values.add(String(val));
        }
      });
      
      const uniqueValues = Array.from(values).sort();
      stats[col] = {
        uniqueValues,
        isLowCardinality: uniqueValues.length > 0 && uniqueValues.length <= MAX_DROPDOWN_ITEMS
      };
    });

    return stats;
  }, [data]);

  // Helper to evaluate an individual rule
  const evaluateRule = (row: Record<string, any>, rule: AdvancedFilterRule) => {
    const cellVal = row[rule.field];
    const strVal = String(cellVal ?? '').toLowerCase();
    const searchVal = String(rule.value ?? '').toLowerCase();

    // Support wildcard patterns (*, ?, %) across string rules
    if (searchVal.includes('*') || searchVal.includes('?') || searchVal.includes('%')) {
      if (rule.operator === 'not_equals' || rule.operator === 'not_contains') {
        return !matchWildcard(strVal, searchVal);
      }
      if (['equals', 'contains', 'starts_with', 'ends_with'].includes(rule.operator)) {
        return matchWildcard(strVal, searchVal);
      }
    }

    switch (rule.operator) {
      case 'equals':
        return strVal === searchVal;
      case 'not_equals':
        return strVal !== searchVal;
      case 'contains':
        return strVal.includes(searchVal);
      case 'not_contains':
        return !strVal.includes(searchVal);
      case 'starts_with':
        return strVal.startsWith(searchVal);
      case 'ends_with':
        return strVal.endsWith(searchVal);
      case 'greater_than': {
        const numA = Number(cellVal);
        const numB = Number(rule.value);
        if (!isNaN(numA) && !isNaN(numB)) return numA > numB;
        return strVal > searchVal;
      }
      case 'greater_equal': {
        const numA = Number(cellVal);
        const numB = Number(rule.value);
        if (!isNaN(numA) && !isNaN(numB)) return numA >= numB;
        return strVal >= searchVal;
      }
      case 'less_than': {
        const numA = Number(cellVal);
        const numB = Number(rule.value);
        if (!isNaN(numA) && !isNaN(numB)) return numA < numB;
        return strVal < searchVal;
      }
      case 'less_equal': {
        const numA = Number(cellVal);
        const numB = Number(rule.value);
        if (!isNaN(numA) && !isNaN(numB)) return numA <= numB;
        return strVal <= searchVal;
      }
      case 'is_empty':
        return cellVal === undefined || cellVal === null || String(cellVal).trim() === '';
      case 'is_not_empty':
        return cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== '';
      default:
        return true;
    }
  };

  // 2. Filter & Sort Logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply Column Header Quick Filters
    if (Object.keys(filters).length > 0) {
      result = result.filter(row => {
        return Object.entries(filters).every(([col, filterVal]) => {
          if (!filterVal) return true;
          
          const cellValue = String(row[col] ?? '').toLowerCase();
          const search = String(filterVal).toLowerCase();

          // Exact match for Dropdowns (unless wildcard is entered)
          if (columnStats[col]?.isLowCardinality && !search.includes('*') && !search.includes('?') && !search.includes('%')) {
              return cellValue === search;
          }
          
          const searchTerms = search.trim().split(/\s+/).filter(Boolean);
          if (searchTerms.length === 0) return true;
          return searchTerms.every(term => matchWildcard(cellValue, term));
        });
      });
    }

    // Apply Advanced Multi-Rule Filters
    if (advancedRules.length > 0) {
      result = result.filter(row => {
        if (matchMode === 'AND') {
          return advancedRules.every(rule => evaluateRule(row, rule));
        } else {
          return advancedRules.some(rule => evaluateRule(row, rule));
        }
      });
    }

    // Apply Sorting
    if (sortColumn && sortDirection) {
      const fieldType = fields?.find(f => f.name === sortColumn)?.type;

      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        // Empty / null checks
        const isNilA = valA === undefined || valA === null || valA === '';
        const isNilB = valB === undefined || valB === null || valB === '';

        if (isNilA && isNilB) return 0;
        if (isNilA) return 1;
        if (isNilB) return -1;

        let comp = 0;

        if (fieldType === 'INTEGER' || fieldType === 'DECIMAL' || fieldType === 'REAL' || typeof valA === 'number' || typeof valB === 'number') {
          const numA = Number(valA);
          const numB = Number(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
            comp = numA - numB;
          } else {
            comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
          }
        } else if (fieldType === 'DATE' || fieldType === 'DATETIME' || fieldType === 'TIMESTAMP' || fieldType === 'TIME') {
          const dateA = new Date(valA).getTime();
          const dateB = new Date(valB).getTime();
          if (!isNaN(dateA) && !isNaN(dateB)) {
            comp = dateA - dateB;
          } else {
            comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
          }
        } else if (typeof valA === 'boolean' || typeof valB === 'boolean' || fieldType === 'BOOLEAN') {
          const boolA = Boolean(valA);
          const boolB = Boolean(valB);
          comp = (boolA === boolB) ? 0 : boolA ? 1 : -1;
        } else {
          comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        }

        return sortDirection === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [data, filters, advancedRules, matchMode, columnStats, sortColumn, sortDirection, fields]);

  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  const setSort = (colName: string, dir: SortDirection) => {
    setSortColumn(colName);
    setSortDirection(dir);
  };

  const clearSort = () => {
    setSortColumn(null);
    setSortDirection(null);
  };

  const setFilter = (col: string, val: string) => {
    setFilters(prev => {
      const next = { ...prev, [col]: val };
      if (!val) delete next[col];
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({});
    setAdvancedRules([]);
    clearSort();
  };

  return {
    filters,
    setFilter,
    clearFilters,
    filteredData,
    showFilters,
    setShowFilters,
    columnStats,
    sortColumn,
    sortDirection,
    handleSort,
    setSort,
    clearSort,
    advancedRules,
    setAdvancedRules,
    matchMode,
    setMatchMode
  };
};