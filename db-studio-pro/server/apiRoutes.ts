import { Router } from "express";
import crypto from "crypto";
import fs from "fs";
import { 
  loadApiConfigs, 
  saveApiConfigs, 
  getCacheFilePath, 
  fetchExternalApi 
} from "./utils";

export const apiRouter = Router();

// Get all registered API configurations
apiRouter.get("/", (req, res) => {
  try {
    const configs = loadApiConfigs();
    res.json(configs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Register or update an API configuration
apiRouter.post("/", async (req, res) => {
  try {
    const config = req.body;
    if (!config.name || !config.url) {
      res.status(400).json({ error: "Name und URL sind erforderlich." });
      return;
    }

    const configs = loadApiConfigs();
    const existingIdx = configs.findIndex(c => c.name.toLowerCase() === config.name.toLowerCase());
    
    const newConfig = {
      id: config.id || crypto.randomUUID(),
      name: config.name,
      url: config.url,
      method: config.method || "GET",
      headers: config.headers || "{}",
      queryParams: config.queryParams || [],
      option: config.option || "A", // "A" = Live-Proxy, "B" = Server-Storage / Cache
      refreshInterval: Number(config.refreshInterval || 0),
      fields: config.fields || [],
      lastSync: Date.now(),
      // Optional Auth configuration:
      authType: config.authType || 'none',
      authApiKeyName: config.authApiKeyName || '',
      authApiKeyValue: config.authApiKeyValue || '',
      authApiKeyPrefix: config.authApiKeyPrefix || '',
      authApiKeyLocation: config.authApiKeyLocation || 'header',
      authBearerToken: config.authBearerToken || '',
      authUsername: config.authUsername || '',
      authPassword: config.authPassword || ''
    };

    if (existingIdx >= 0) {
      configs[existingIdx] = newConfig;
    } else {
      configs.push(newConfig);
    }

    saveApiConfigs(configs);

    // If Option B is chosen or cachedData is supplied, write initial cache file
    if (newConfig.option === "B") {
      const cacheFile = getCacheFilePath(newConfig.name);
      const initialData = config.data || [];
      if (initialData.length > 0 || !fs.existsSync(cacheFile)) {
        fs.writeFileSync(cacheFile, JSON.stringify(initialData, null, 2), "utf-8");
      }
    }

    res.json({ success: true, config: newConfig });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an API configuration
apiRouter.delete("/:name", (req, res) => {
  try {
    const { name } = req.params;
    const configs = loadApiConfigs();
    const filtered = configs.filter(c => c.name.toLowerCase() !== name.toLowerCase());
    saveApiConfigs(filtered);

    const cacheFile = getCacheFilePath(name);
    if (fs.existsSync(cacheFile)) {
      try {
        fs.unlinkSync(cacheFile);
      } catch (e) {
        // ignore
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Force synchronizing / caching the API on the server
apiRouter.post("/:name/refresh", async (req, res) => {
  try {
    const { name } = req.params;
    const configs = loadApiConfigs();
    const config = configs.find(c => c.name.toLowerCase() === name.toLowerCase());

    if (!config) {
      res.status(404).json({ error: "API-Konfiguration nicht gefunden." });
      return;
    }

    // Fetch external data on server
    const rows = await fetchExternalApi(config.url, config.method, config.headers, config.queryParams, config);

    // Save to server-side cache file
    const cacheFile = getCacheFilePath(name);
    fs.writeFileSync(cacheFile, JSON.stringify(rows, null, 2), "utf-8");

    // Update sync timestamp
    config.lastSync = Date.now();
    saveApiConfigs(configs);

    res.json({ success: true, count: rows.length, data: rows });
  } catch (err: any) {
    console.error("Refresh Error:", err);
    res.status(500).json({ error: `Synchronisierungsfehler: ${err.message}` });
  }
});

// Get data of a registered API (Option A proxies live, Option B returns cache)
apiRouter.get("/:name/data", async (req, res) => {
  try {
    const { name } = req.params;
    const configs = loadApiConfigs();
    const config = configs.find(c => c.name.toLowerCase() === name.toLowerCase());

    if (!config) {
      res.status(404).json({ error: "API-Konfiguration nicht gefunden." });
      return;
    }

    if (config.option === "A") {
      // Option A: Live-Proxy
      console.log(`[Proxy] Fetching live data for ${name} from ${config.url}`);
      const rows = await fetchExternalApi(config.url, config.method, config.headers, config.queryParams, config);
      res.json(rows);
      return;
    } else {
      // Option B: Server-Cache
      const cacheFile = getCacheFilePath(name);
      if (fs.existsSync(cacheFile)) {
        const content = fs.readFileSync(cacheFile, "utf-8");
        res.json(JSON.parse(content) || []);
        return;
      } else {
        // Cache doesn't exist yet, trigger initial sync
        console.log(`[Cache-Init] Triggering first sync for Option B API: ${name}`);
        const rows = await fetchExternalApi(config.url, config.method, config.headers, config.queryParams, config);
        fs.writeFileSync(cacheFile, JSON.stringify(rows, null, 2), "utf-8");
        
        config.lastSync = Date.now();
        saveApiConfigs(configs);
        res.json(rows);
        return;
      }
    }
  } catch (err: any) {
    console.error("Get API Data Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update cached data on the server (Allows full editing of the cache directly in backend)
apiRouter.put("/:name/data", (req, res) => {
  try {
    const { name } = req.params;
    const updatedData = req.body; // Full array of rows

    if (!Array.isArray(updatedData)) {
      res.status(400).json({ error: "Daten müssen als Array vorliegen." });
      return;
    }

    const cacheFile = getCacheFilePath(name);
    fs.writeFileSync(cacheFile, JSON.stringify(updatedData, null, 2), "utf-8");
    res.json({ success: true, count: updatedData.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
