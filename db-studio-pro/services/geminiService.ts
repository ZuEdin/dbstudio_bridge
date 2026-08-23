import { Table } from "../types/index";
import { getApiUrl } from "../stores/useConfigStore";

export const generateTableSchema = async (description: string): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/gemini/generateTableSchema'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Gemini Service client-side fallback used:", error);
    return generateFallbackSchema(description);
  }
};

export const generateSqlExplanation = async (tables: Table[], queryGoal: string): Promise<string> => {
  try {
    const response = await fetch(getApiUrl('/api/gemini/generateSqlExplanation'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tables, queryGoal })
    });
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }
    const data = await response.json();
    return data.explanation || "Keine Erklärung erhalten.";
  } catch (error) {
    console.warn("Gemini Service client-side explanation fallback used:", error);
    return `Konnte Erklärung nicht live laden (offline/keine API-Verbindung). Ziel-SQL für: ${queryGoal}`;
  }
};

export const generateFallbackSchema = (description: string): any => {
  const descLower = description.toLowerCase();
  const fields: any[] = [{ name: 'id', type: 'INTEGER' }];
  
  if (descLower.includes('name')) fields.push({ name: 'name', type: 'VARCHAR' });
  if (descLower.includes('email') || descLower.includes('e-mail') || descLower.includes('mail')) fields.push({ name: 'email', type: 'VARCHAR' });
  if (descLower.includes('telefon') || descLower.includes('phone') || descLower.includes('tel')) fields.push({ name: 'phone', type: 'VARCHAR' });
  if (descLower.includes('adresse') || descLower.includes('address') || descLower.includes('strasse')) fields.push({ name: 'address', type: 'TEXT' });
  if (descLower.includes('datum') || descLower.includes('date') || descLower.includes('zeit')) fields.push({ name: 'created_at', type: 'DATE' });
  if (descLower.includes('beschreibung') || descLower.includes('description') || descLower.includes('text')) fields.push({ name: 'description', type: 'TEXT' });
  if (descLower.includes('preis') || descLower.includes('price') || descLower.includes('betrag')) fields.push({ name: 'price', type: 'INTEGER' });
  if (descLower.includes('status')) fields.push({ name: 'status', type: 'VARCHAR' });
  if (descLower.includes('aktiv') || descLower.includes('active')) fields.push({ name: 'is_active', type: 'BOOLEAN' });

  // Default fields if nothing matched
  if (fields.length === 1) {
    fields.push({ name: 'title', type: 'VARCHAR' });
    fields.push({ name: 'description', type: 'TEXT' });
    fields.push({ name: 'created_at', type: 'DATE' });
  }

  let tableName = 'tabelle';
  const words = description.split(/\s+/);
  for (const word of words) {
    if (word.length > 3 && !['eine', 'tabelle', 'liste', 'über', 'fuer', 'für', 'erstellen', 'datenbank', 'db'].includes(word.toLowerCase())) {
      tableName = word.toLowerCase().replace(/[^a-z0-9_]/g, '');
      break;
    }
  }

  return { tableName, fields };
};
