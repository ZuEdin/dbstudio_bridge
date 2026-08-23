import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

export const aiRouter = Router();

// Local helper for fallback schema generation when no API key is available
function generateFallbackSchemaLocal(description: string): any {
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
}

aiRouter.post("/refactor", async (req, res) => {
  try {
    const { prompt, currentCode, fileName, language, projectName } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      return;
    }

    const genAI = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const contentPrompt = `Du bist ein Senior Developer. Hier ist der Code der Datei '${fileName}' (${language}).\nProjekt-Kontext: ${language}, ${projectName}.\n\nCode:\n${currentCode}\n\nAufgabe: ${prompt}\n\nGib NUR den kompletten, neuen Code zurück, ohne Markdown-Formatierung.`;

    const response = await genAI.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentPrompt
    });
    
    let text = response.text || "";
    
    // Clean up markdown if AI included it anyway
    text = text.trim().replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');

    res.json({ code: text });
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

aiRouter.post("/gemini/generateTableSchema", async (req, res) => {
  try {
    const { description } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallback = generateFallbackSchemaLocal(description || "");
      res.json(fallback);
      return;
    }

    const genAI = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // We can import Type from @google/genai as indicated in the skill to define response schema
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Erstelle ein JSON-Schema für eine Datenbanktabelle basierend auf dieser Beschreibung: "${description}". \n        Gib ein Objekt zurück mit 'tableName' (string) und 'fields' (Array von Objekten mit 'name' und 'type' [INTEGER, VARCHAR, TEXT, DATE, BOOLEAN]).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: 'OBJECT',
          properties: {
            tableName: { type: 'STRING' },
            fields: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING' },
                  type: { type: 'STRING' }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI Schema Gen Error:", error);
    const fallback = generateFallbackSchemaLocal(req.body.description || "");
    res.json(fallback);
  }
});

aiRouter.post("/gemini/generateSqlExplanation", async (req, res) => {
  try {
    const { tables, queryGoal } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.json({ explanation: `Konnte Erklärung nicht live laden (keine API-Verbindung). Ziel-SQL für: ${queryGoal}` });
      return;
    }

    const genAI = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const schemaContext = tables.map((t: any) => `${t.name}(${t.fields.map((f: any) => f.name).join(', ')})`).join('\n');

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Hier ist das Datenbankschema:\n${schemaContext}\n\nErstelle eine SQL-Abfrage für folgendes Ziel: "${queryGoal}". Gib nur den SQL-Code und eine kurze Erklärung auf Deutsch zurück.`
    });

    res.json({ explanation: response.text || "Keine Antwort erhalten." });
  } catch (error: any) {
    console.error("AI SQL Explanation Error:", error);
    res.json({ explanation: `Fehler bei der Anfrage: ${error.message || error}` });
  }
});
