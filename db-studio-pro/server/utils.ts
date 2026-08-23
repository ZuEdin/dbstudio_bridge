import path from "path";
import fs from "fs";

// Ensure data folder exists
export const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const API_CONFIG_FILE = path.join(DATA_DIR, "backend_api_configs.json");
export const SENT_EMAILS_FILE = path.join(DATA_DIR, "sent_emails.json");

export const getCacheFilePath = (name: string) => {
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  return path.join(DATA_DIR, `api_cache_${safeName}.json`);
};

// Helper to load registered API configurations
export const loadApiConfigs = (): any[] => {
  if (!fs.existsSync(API_CONFIG_FILE)) return [];
  try {
    const content = fs.readFileSync(API_CONFIG_FILE, "utf-8");
    return JSON.parse(content) || [];
  } catch (e) {
    console.error("Error loading API configs:", e);
    return [];
  }
};

// Helper to save API configurations
export const saveApiConfigs = (configs: any[]) => {
  try {
    fs.writeFileSync(API_CONFIG_FILE, JSON.stringify(configs, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving API configs:", e);
  }
};

// Lightweight XML-to-JSON parser and normalizer helpers for Backend XML API support
export function parseXmlString(xml: string): any {
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

      // Remove namespace prefix for clean keys (e.g. d:Title -> Title)
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
}

export function normalizeParsedXml(obj: any): any[] {
  if (!obj || typeof obj !== 'object') return [];

  // SharePoint / Atom feed
  const feedNode = obj.feed || obj;
  if (feedNode && feedNode.entry) {
    const entries = Array.isArray(feedNode.entry) ? feedNode.entry : [feedNode.entry];
    return entries.map((entry: any) => {
      return entry.content?.properties || entry.properties || entry.content || entry;
    });
  }

  // Generic XML array extraction
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

  return [obj];
}

// Helper to fetch from external API on the server
export async function fetchExternalApi(
  url: string, 
  method: string, 
  headersStr?: string, 
  queryParams?: any[],
  auth?: {
    authType?: string;
    authApiKeyName?: string;
    authApiKeyValue?: string;
    authApiKeyPrefix?: string;
    authApiKeyLocation?: string;
    authBearerToken?: string;
    authUsername?: string;
    authPassword?: string;
  }
) {
  let finalUrl = url;
  const searchParams = new URLSearchParams();

  if (queryParams && queryParams.length > 0) {
    queryParams.forEach(p => {
      const isParamActive = p.isActive !== false;
      const paramKey = p.key || p.name;
      if (isParamActive && paramKey && p.value !== undefined) {
        searchParams.append(paramKey, p.value);
      }
    });
  }

  // Inject Api Key if location is query
  if (auth && auth.authType === 'apiKey' && auth.authApiKeyLocation === 'query' && auth.authApiKeyName) {
    searchParams.append(auth.authApiKeyName, auth.authApiKeyValue || '');
  }

  const qs = searchParams.toString();
  if (qs) {
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs;
  }

  let headersObj: Record<string, string> = {
    'Accept': 'application/json, application/xml, text/xml, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DB-Studio-Pro/1.0'
  };

  if (headersStr) {
    try {
      const parsed = typeof headersStr === 'string' ? JSON.parse(headersStr) : headersStr;
      headersObj = { ...headersObj, ...parsed };
    } catch (e) {
      // ignore
    }
  }

  // Inject auth headers if configured
  if (auth) {
    if (auth.authType === 'bearer' && auth.authBearerToken) {
      headersObj['Authorization'] = `Bearer ${auth.authBearerToken}`;
    } else if (auth.authType === 'apiKey' && auth.authApiKeyLocation === 'header' && auth.authApiKeyName) {
      const prefix = auth.authApiKeyPrefix || '';
      headersObj[auth.authApiKeyName] = `${prefix}${auth.authApiKeyValue || ''}`;
    } else if (auth.authType === 'basic' && (auth.authUsername || auth.authPassword)) {
      const credentials = `${auth.authUsername || ''}:${auth.authPassword || ''}`;
      const encoded = Buffer.from(credentials).toString('base64');
      headersObj['Authorization'] = `Basic ${encoded}`;
    }
  }

  const response = await fetch(finalUrl, {
    method: method || 'GET',
    headers: headersObj
  });

  if (!response.ok) {
    throw new Error(`External API returned status ${response.status}`);
  }

  const textData = await response.text();
  const trimmed = textData.trim();
  
  let rows: any[] = [];

  // Auto-detect format
  if (trimmed.startsWith('<')) {
    console.log(`[Backend API] XML response detected. Parsing...`);
    const parsedXml = parseXmlString(trimmed);
    rows = normalizeParsedXml(parsedXml);
  } else {
    const rawData = JSON.parse(trimmed);
    // Extract array if nested (e.g. dummyjson.com returns { products: [...] })
    if (Array.isArray(rawData)) {
      rows = rawData;
    } else if (rawData && typeof rawData === 'object') {
      const arrayKey = Object.keys(rawData).find(key => Array.isArray(rawData[key]));
      if (arrayKey) {
        rows = rawData[arrayKey];
      } else {
        rows = [rawData]; // Wrap single object
      }
    }
  }
  return rows;
}
