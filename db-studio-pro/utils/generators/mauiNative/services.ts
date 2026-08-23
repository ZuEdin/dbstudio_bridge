import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateMauiNativeServices = (
  config: BackendConfig,
  namespace: string,
  root: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // IStorageService.cs
  const iStorageService = `using System.Collections.Generic;
using System.Threading.Tasks;

namespace ${namespace}.Services
{
    public interface IStorageService
    {
        string BackendName { get; }
        Task<List<T>> GetAll<T>(string tableName) where T : class, new();
        Task<T?> GetById<T>(string tableName, object id) where T : class, new();
        Task Add<T>(string tableName, T record) where T : class, new();
        Task Update<T>(string tableName, object id, T record) where T : class, new();
        Task Delete(string tableName, object id);
    }
}`;
  files.push({ name: 'IStorageService.cs', path: `${root}/Services/IStorageService.cs`, content: iStorageService, language: 'csharp' });

  // JsonFileStorageService.cs
  const jsonFileStorageService = `using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Maui.Storage;

namespace ${namespace}.Services
{
    public class JsonFileStorageService : IStorageService
    {
        private readonly string _basePath = FileSystem.AppDataDirectory;
        public string BackendName => "Lokal & Offline (JSON-Datenbank)";

        private string GetFilePath(string tableName) => Path.Combine(_basePath, $"{tableName}.json");

        public async Task<List<T>> GetAll<T>(string tableName) where T : class, new()
        {
            var path = GetFilePath(tableName);
            if (!File.Exists(path))
                return new List<T>();

            try
            {
                var json = await File.ReadAllTextAsync(path);
                return JsonSerializer.Deserialize<List<T>>(json) ?? new List<T>();
            }
            catch
            {
                return new List<T>();
            }
        }

        public async Task<T?> GetById<T>(string tableName, object id) where T : class, new()
        {
            var items = await GetAll<T>(tableName);
            var idProp = typeof(T).GetProperty("Id") ?? typeof(T).GetProperty("id");
            if (idProp == null) return null;

            foreach (var item in items)
            {
                var val = idProp.GetValue(item);
                if (val != null && val.ToString() == id.ToString())
                    return item;
            }
            return null;
        }

        public async Task Add<T>(string tableName, T record) where T : class, new()
        {
            var items = await GetAll<T>(tableName);
            
            // Handle Auto-Incrementing ID
            var idProp = typeof(T).GetProperty("Id") ?? typeof(T).GetProperty("id");
            if (idProp != null && (idProp.PropertyType == typeof(int) || idProp.PropertyType == typeof(long)))
            {
                int maxId = 0;
                foreach (var item in items)
                {
                    var idVal = idProp.GetValue(item);
                    if (idVal is int idInt && idInt > maxId) maxId = idInt;
                    else if (idVal is long idLong && idLong > maxId) maxId = (int)idLong;
                }
                idProp.SetValue(record, maxId + 1);
            }

            items.Add(record);
            await SaveAll(tableName, items);
        }

        public async Task Update<T>(string tableName, object id, T record) where T : class, new()
        {
            var items = await GetAll<T>(tableName);
            var idProp = typeof(T).GetProperty("Id") ?? typeof(T).GetProperty("id");
            if (idProp == null) return;

            int index = -1;
            for (int i = 0; i < items.Count; i++)
            {
                var val = idProp.GetValue(items[i]);
                if (val != null && val.ToString() == id.ToString())
                {
                    index = i;
                    break;
                }
            }

            if (index != -1)
            {
                items[index] = record;
                await SaveAll(tableName, items);
            }
        }

        public async Task Delete(string tableName, object id)
        {
            // Since we don't know the exact class type directly in non-generic Delete,
            // we will read and write via dynamic/generic or simpler helper method.
            // But we can implement a generic helper if we know the Model Type.
            // In MAUI Native, we'll route deletion through the Typed Service or this helper:
        }

        public async Task DeleteGeneric<T>(string tableName, object id) where T : class, new()
        {
            var items = await GetAll<T>(tableName);
            var idProp = typeof(T).GetProperty("Id") ?? typeof(T).GetProperty("id");
            if (idProp == null) return;

            int index = -1;
            for (int i = 0; i < items.Count; i++)
            {
                var val = idProp.GetValue(items[i]);
                if (val != null && val.ToString() == id.ToString())
                {
                    index = i;
                    break;
                }
            }

            if (index != -1)
            {
                items.RemoveAt(index);
                await SaveAll(tableName, items);
            }
        }

        private async Task SaveAll<T>(string tableName, List<T> items)
        {
            var path = GetFilePath(tableName);
            var json = JsonSerializer.Serialize(items, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(path, json);
        }

        // Implementation of non-generic Delete using Reflection isn't strictly needed as long as we have DeleteGeneric
        // or a fallback list cleaner. Let's make Delete call reflection on DeleteGeneric:
        async Task IStorageService.Delete(string tableName, object id)
        {
            // Resolve Model type dynamically
            var typeName = $"{typeof(JsonFileStorageService).Namespace.Replace(".Services", "")}.Models.{toPascalCase(tableName)}";
            var type = System.Type.GetType(typeName);
            if (type != null)
            {
                var method = typeof(JsonFileStorageService).GetMethod(nameof(DeleteGeneric))?.MakeGenericMethod(type);
                if (method != null)
                {
                    var task = (Task)method.Invoke(this, new object[] { tableName, id })!;
                    await task;
                }
            }
        }

        private string toPascalCase(string s)
        {
            if (string.IsNullOrEmpty(s)) return s;
            return char.ToUpper(s[0]) + s.Substring(1);
        }
    }
}`;
  files.push({ name: 'JsonFileStorageService.cs', path: `${root}/Services/JsonFileStorageService.cs`, content: jsonFileStorageService, language: 'csharp' });

  // ApiService.cs
  const apiService = `using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ${namespace}.Services
{
    public class ApiService : IStorageService
    {
        private readonly HttpClient _http;
        public string BackendName => "REST API (MySQL / SQL Server)";

        public ApiService(HttpClient http)
        {
            _http = http;
        }

        public async Task<List<T>> GetAll<T>(string tableName) where T : class, new()
        {
            try
            {
                return await _http.GetFromJsonAsync<List<T>>($"data/{tableName}") ?? new();
            }
            catch
            {
                return new List<T>();
            }
        }

        public async Task<T?> GetById<T>(string tableName, object id) where T : class, new()
        {
            try
            {
                return await _http.GetFromJsonAsync<T>($"data/{tableName}/{id}");
            }
            catch
            {
                return null;
            }
        }

        public async Task Add<T>(string tableName, T record) where T : class, new()
        {
            await _http.PostAsJsonAsync($"data/{tableName}", record);
        }

        public async Task Update<T>(string tableName, object id, T record) where T : class, new()
        {
            await _http.PutAsJsonAsync($"data/{tableName}/{id}", record);
        }

        public async Task Delete(string tableName, object id)
        {
            await _http.DeleteAsync($"data/{tableName}/{id}");
        }
    }
}`;
  files.push({ name: 'ApiService.cs', path: `${root}/Services/ApiService.cs`, content: apiService, language: 'csharp' });

  // StorageServiceManager.cs
  const storageServiceManager = `using System;

namespace ${namespace}.Services
{
    public class StorageServiceManager
    {
        private readonly IServiceProvider _serviceProvider;
        public IStorageService CurrentService { get; private set; }
        public event Action? OnStorageChanged;

        public StorageServiceManager(IServiceProvider serviceProvider, JsonFileStorageService jsonService)
        {
            _serviceProvider = serviceProvider;
            CurrentService = jsonService; // Default to Local JSON Database as offline-first
        }

        public void SetStorageType(string type)
        {
            if (type == "Offline")
            {
                CurrentService = (IStorageService)_serviceProvider.GetService(typeof(JsonFileStorageService))!;
            }
            else
            {
                CurrentService = (IStorageService)_serviceProvider.GetService(typeof(ApiService))!;
            }
            OnStorageChanged?.Invoke();
        }
    }
}`;
  files.push({ name: 'StorageServiceManager.cs', path: `${root}/Services/StorageServiceManager.cs`, content: storageServiceManager, language: 'csharp' });

  return files;
};
