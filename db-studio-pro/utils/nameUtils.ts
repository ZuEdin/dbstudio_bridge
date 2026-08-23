/**
 * Sanitizes project, folder, file, and package names so they contain ONLY:
 * - ASCII Alphanumeric characters (a-z, A-Z, 0-9)
 * - Hyphens (-)
 * - Underscores (_)
 * 
 * German umlauts and special characters (&, spaces, slashes, etc.) are converted or removed.
 */
export function sanitizeProjectName(name: string): string {
  if (!name || typeof name !== 'string') return 'MyProject';
  
  let clean = name.trim()
    .replace(/ä/g, 'ae').replace(/Ä/g, 'Ae')
    .replace(/ö/g, 'oe').replace(/Ö/g, 'Oe')
    .replace(/ü/g, 'ue').replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
    
  return clean || 'MyProject';
}

/**
 * Returns a unique name by appending a numeric suffix (e.g., "_1", "_2") if the baseName is already present in existingNames.
 * Case-insensitive.
 */
export function getUniqueName(baseName: string, existingNames: string[]): string {
  const existingSet = new Set(existingNames.map(n => n.toLowerCase().trim()));
  if (!existingSet.has(baseName.toLowerCase().trim())) {
    return baseName;
  }
  let counter = 1;
  let base = baseName;
  const match = baseName.match(/^(.*?)(_(\d+))?$/);
  if (match) {
    base = match[1];
    if (match[3]) {
      counter = parseInt(match[3], 10);
    }
  }
  while (counter < 1000) {
    const candidate = `${base}_${counter}`;
    if (!existingSet.has(candidate.toLowerCase().trim())) {
      return candidate;
    }
    counter++;
  }
  return `${baseName}_${crypto.randomUUID().slice(0, 4)}`;
}

