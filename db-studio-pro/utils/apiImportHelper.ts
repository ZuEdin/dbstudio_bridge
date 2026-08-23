
import { FieldType, ApiQueryParam } from '../types/index';

// Infers the best matching field type for a given value
export const inferFieldType = (value: any): FieldType => {
    if (value instanceof Date) {
        return 'DATE';
    }
    if (typeof value === 'number') {
        // Check for potential timestamps (e.g. > 1990-01-01 in seconds)
        if (value > 631152000 && Number.isInteger(value)) {
            return 'DATETIME';
        }
        return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
    }
    if (typeof value === 'boolean') return 'BOOLEAN';
    
    // Simple Date check (YYYY-MM-DD or ISO)
    if (typeof value === 'string' && value.length > 5) {
        if (!isNaN(Date.parse(value)) && (value.includes('-') || value.includes('/') || value.includes('T'))) {
            if (value.length <= 10 && !value.includes('T')) return 'DATE';
            return 'DATETIME'; 
        }
    }
    if (typeof value === 'string' && value.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
        return 'TIME';
    }
    return 'VARCHAR';
};

// Extremely lightweight, robust regex-based XML to JSON parser for Client and Backend
export const parseXmlString = (xml: string): any => {
    // Strip XML header
    xml = xml.replace(/<\?xml[^>]*\?>/g, "");
    // Strip comments
    xml = xml.replace(/<!--[\s\S]*?-->/g, "");

    const parseNode = (str: string): any => {
        const tags: any = {};
        const tagRegex = /<([a-zA-Z0-9_:.-]+)([^>]*?)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9_:.-]+)([^>]*?)\/>/g;
        let match;
        let hasChildren = false;

        while ((match = tagRegex.exec(str)) !== null) {
            hasChildren = true;
            const tagName = match[1] || match[4];
            const content = match[3] || "";

            // Remove namespace prefix for clean property keys (e.g. d:Title -> Title)
            const cleanTagName = tagName.includes(":") ? tagName.split(":")[1] : tagName;

            const childObj = parseNode(content);

            if (tags[cleanTagName] === undefined) {
                tags[cleanTagName] = childObj;
            } else {
                if (!Array.isArray(tags[cleanTagName])) {
                    tags[cleanTagName] = [tags[cleanTagName]];
                }
                tags[cleanTagName].push(childObj);
            }
        }

        if (!hasChildren) {
            const trimmed = str.trim();
            if (trimmed === "true") return true;
            if (trimmed === "false") return false;
            if (!isNaN(Number(trimmed)) && trimmed !== "") return Number(trimmed);
            return trimmed;
        }

        return tags;
    };

    return parseNode(xml);
};

// Detects XML list patterns (like SharePoint feed/entry) or generic XML arrays and returns flat objects
export const normalizeParsedXml = (obj: any): any[] => {
    if (!obj || typeof obj !== 'object') return [];

    // 1. SharePoint/Atom Feed detection (feed -> entry)
    const feedNode = obj.feed || obj;
    if (feedNode && feedNode.entry) {
        const entries = Array.isArray(feedNode.entry) ? feedNode.entry : [feedNode.entry];
        return entries.map((entry: any) => {
            // SharePoint REST items live in entry.content.properties, entry.properties or fallback
            return entry.content?.properties || entry.properties || entry.content || entry;
        });
    }

    // 2. Generic XML: Find the largest nested array of objects
    const arrays: any[][] = [];
    const searchArrays = (current: any) => {
        if (!current || typeof current !== 'object') return;
        for (const key in current) {
            if (Array.isArray(current[key])) {
                arrays.push(current[key]);
            } else if (typeof current[key] === 'object') {
                searchArrays(current[key]);
            }
        }
    };
    
    searchArrays(obj);
    if (arrays.length > 0) {
        arrays.sort((a, b) => b.length - a.length);
        return arrays[0];
    }

    // 3. Fallback: single record
    return [obj];
};

// Flattens nested JSON objects to a single level, BUT keeps Arrays intact for extraction tools
export const flattenApiData = (data: any[]): any[] => {
    return data.map((row, index) => {
        const newRow: any = { _ImportId: index + 1 }; // Add stable ID for linking
        for (const key in row) {
            if (Array.isArray(row[key])) {
                // KEEP ARRAYS as raw data for the Extraction Wizard
                newRow[key] = row[key];
            } else if (typeof row[key] === 'object' && row[key] !== null) {
                // Flatten simple objects or stringify to avoid [object Object] in grid
                newRow[key] = JSON.stringify(row[key]);
            } else {
                newRow[key] = row[key];
            }
        }
        return newRow;
    });
};

export interface FetchResult {
    data: any[];
    error: string | null;
    fullUrl: string; // Return the constructed URL for debugging
}

export const fetchApiData = async (
    baseUrl: string, 
    method: string, 
    headersStr?: string, 
    queryParams?: ApiQueryParam[],
    auth?: {
        authType?: 'none' | 'apiKey' | 'bearer' | 'basic';
        authApiKeyName?: string;
        authApiKeyValue?: string;
        authApiKeyPrefix?: string;
        authApiKeyLocation?: 'header' | 'query';
        authBearerToken?: string;
        authUsername?: string;
        authPassword?: string;
    }
): Promise<FetchResult> => {
    try {
        const headers: Record<string, string> = headersStr ? JSON.parse(headersStr) : {};
        
        if (auth) {
            if (auth.authType === 'bearer' && auth.authBearerToken) {
                headers['Authorization'] = `Bearer ${auth.authBearerToken}`;
            } else if (auth.authType === 'apiKey' && auth.authApiKeyLocation === 'header' && auth.authApiKeyName) {
                const prefix = auth.authApiKeyPrefix || '';
                headers[auth.authApiKeyName] = `${prefix}${auth.authApiKeyValue || ''}`;
            } else if (auth.authType === 'basic' && (auth.authUsername || auth.authPassword)) {
                const credentials = `${auth.authUsername || ''}:${auth.authPassword || ''}`;
                const encoded = btoa(unescape(encodeURIComponent(credentials)));
                headers['Authorization'] = `Basic ${encoded}`;
            }
        }

        // Construct URL with params
        let finalUrl = baseUrl;
        try {
            const urlObj = new URL(baseUrl);
            if (queryParams && queryParams.length > 0) {
                queryParams.forEach(p => {
                    if (p.isActive && p.key) {
                        urlObj.searchParams.append(p.key, p.value);
                    }
                });
            }
            if (auth && auth.authType === 'apiKey' && auth.authApiKeyLocation === 'query' && auth.authApiKeyName) {
                urlObj.searchParams.append(auth.authApiKeyName, auth.authApiKeyValue || '');
            }
            finalUrl = urlObj.toString();
        } catch (e) {
            console.warn("Invalid Base URL for param appending", e);
            const searchParams = new URLSearchParams();
            if (queryParams && queryParams.length > 0) {
                queryParams.forEach(p => {
                    if (p.isActive && p.key) {
                        searchParams.append(p.key, p.value);
                    }
                });
            }
            if (auth && auth.authType === 'apiKey' && auth.authApiKeyLocation === 'query' && auth.authApiKeyName) {
                searchParams.append(auth.authApiKeyName, auth.authApiKeyValue || '');
            }
            const qs = searchParams.toString();
            if (qs) {
                finalUrl = baseUrl.includes('?') ? `${baseUrl}&${qs}` : `${baseUrl}?${qs}`;
            }
        }

        const response = await fetch(finalUrl, {
            method,
            headers: {
                ...headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const textData = await response.text();
        const trimmed = textData.trim();
        
        let tableData: any[] = [];

        // 1. Automatic Type Detection (JSON or XML)
        if (trimmed.startsWith('<')) {
            // Parse XML
            console.log("XML response detected. Parsing via XML processor...");
            const parsedXml = parseXmlString(trimmed);
            tableData = normalizeParsedXml(parsedXml);
        } else {
            // Parse JSON
            const jsonData = JSON.parse(trimmed);
            if (Array.isArray(jsonData)) {
                tableData = jsonData;
            } else if (typeof jsonData === 'object' && jsonData !== null) {
                // Find potential arrays
                const possibleArray = Object.values(jsonData).find(val => Array.isArray(val));
                if (possibleArray) {
                    tableData = possibleArray as any[];
                } else {
                    tableData = [jsonData];
                }
            }
        }

        return { data: flattenApiData(tableData), error: null, fullUrl: finalUrl };
    } catch (err: any) {
        return { data: [], error: err.message || 'Fehler beim Abrufen der Daten', fullUrl: baseUrl };
    }
};
