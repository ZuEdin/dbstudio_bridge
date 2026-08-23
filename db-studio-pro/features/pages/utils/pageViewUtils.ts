import { createContext } from 'react';

// Context for managing page parameters (e.g. selectedId, activeTab)
export const PageParamsContext = createContext<{
    params: Record<string, any>;
    setParam: (key: string, value: any) => void;
}>({
    params: {},
    setParam: () => {}
});

// Context for managing page interactions (modals, confirmation overlays, page-navigation, macros)
export const PageViewContext = createContext<{
    openFormModal: (formId: string, mode: 'create' | 'edit', recordId?: any, callback?: () => void, defaultValues?: Record<string, any>) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void) => void;
    navigate: (pageId: string, initialParams?: Record<string, any>) => void;
    openMacroModal?: () => void;
    openSmartImportModal?: (targetTableId?: string) => void;
    activeRole?: string;
}>({
    openFormModal: () => {},
    showConfirm: () => {},
    navigate: () => {},
    openMacroModal: () => {},
    openSmartImportModal: () => {},
    activeRole: 'Admin'
});

// Helper to get nested properties case-insensitively, supporting row.xyz, item.xyz notation
export const getNestedValueCaseInsensitive = (obj: any, path: string): any => {
    if (!obj || typeof obj !== 'object') return undefined;
    
    let cleanPath = path.trim();
    // Support row.xyz, item.xyz, etc.
    if (cleanPath.startsWith('row.')) {
        cleanPath = cleanPath.substring(4);
    } else if (cleanPath.startsWith("row['") && cleanPath.endsWith("']")) {
        cleanPath = cleanPath.substring(5, cleanPath.length - 2);
    } else if (cleanPath.startsWith('row["') && cleanPath.endsWith('"]')) {
        cleanPath = cleanPath.substring(5, cleanPath.length - 2);
    } else if (cleanPath.startsWith('item.')) {
        cleanPath = cleanPath.substring(5);
    } else if (cleanPath.startsWith("item['") && cleanPath.endsWith("']")) {
        cleanPath = cleanPath.substring(6, cleanPath.length - 2);
    } else if (cleanPath.startsWith('item["') && cleanPath.endsWith('"]')) {
        cleanPath = cleanPath.substring(6, cleanPath.length - 2);
    }

    // Try exact lookup first
    if (obj[cleanPath] !== undefined) return obj[cleanPath];

    // Case-insensitive lookup of cleanPath in obj
    const lowerKey = cleanPath.toLowerCase();
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
    if (foundKey) return obj[foundKey];

    // Fallback: search in deep children if obj has a property like row or item
    for (const key of Object.keys(obj)) {
        if (obj[key] && typeof obj[key] === 'object' && (key === 'row' || key === 'item')) {
            const nestedVal = getNestedValueCaseInsensitive(obj[key], cleanPath);
            if (nestedVal !== undefined) return nestedVal;
        }
    }

    return undefined;
};

// Helper to safely replace placeholders like {{name}} or {{selectedId}}
export const resolvePlaceholders = (text: string, context?: Record<string, any>, params?: Record<string, any>): string => {
    if (!text) return '';
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        // 1. Check local loop context first (case-insensitive)
        if (context) {
            const contextVal = getNestedValueCaseInsensitive(context, trimmedKey);
            if (contextVal !== undefined && contextVal !== null) {
                return String(contextVal);
            }
        }
        // 2. Check page-level parameters (case-insensitive)
        if (params) {
            const paramVal = getNestedValueCaseInsensitive(params, trimmedKey);
            if (paramVal !== undefined && paramVal !== null) {
                return String(paramVal);
            }
        }
        return '';
    });
};

// Helper to determine the label and value of lookup rows
export const getRowLabelAndValue = (row: any, props: any, idx: number) => {
    if (!row || typeof row !== 'object') {
        return { val: idx, label: String(row ?? '') };
    }

    const keys = Object.keys(row);
    if (keys.length === 0) {
        return { val: idx, label: `Eintrag ${idx + 1}` };
    }

    let val: any = idx;
    const valueFieldVal = props.valueField ? getNestedValueCaseInsensitive(row, props.valueField) : undefined;
    if (valueFieldVal !== undefined && valueFieldVal !== null) {
        val = valueFieldVal;
    } else {
        const idKey = keys.find(k => k.toLowerCase() === 'id' || k.toLowerCase().endsWith('_id') || k.toLowerCase() === 'uuid');
        if (idKey && row[idKey] !== undefined && row[idKey] !== null) {
            val = row[idKey];
        } else if (row.id !== undefined && row.id !== null) {
            val = row.id;
        } else {
            const firstVal = Object.values(row)[0];
            val = (firstVal !== undefined && firstVal !== null) ? firstVal : idx;
        }
    }

    let label = '';
    const labelFieldVal = props.labelField ? getNestedValueCaseInsensitive(row, props.labelField) : undefined;
    if (labelFieldVal !== undefined && labelFieldVal !== null) {
        label = String(labelFieldVal);
    } else {
        const labelKeywords = ['name', 'label', 'title', 'titel', 'text', 'bezeichnung', 'username', 'email', 'description'];
        const matchedKey = keys.find(k => {
            const kl = k.toLowerCase();
            return labelKeywords.some(kw => kl.includes(kw));
        });

        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
            label = String(row[matchedKey]);
        } else {
            const nonIdKey = keys.find(k => {
                const kl = k.toLowerCase();
                return kl !== 'id' && !kl.endsWith('_id') && kl !== 'uuid' && row[k] !== null && row[k] !== undefined;
            });
            if (nonIdKey) {
                label = String(nonIdKey);
            } else {
                const firstVal = Object.values(row)[0];
                label = (firstVal !== undefined && firstVal !== null) ? String(firstVal) : `Eintrag ${idx + 1}`;
            }
        }
    }

    return { val, label };
};
