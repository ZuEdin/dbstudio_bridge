import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateMauiServices = (
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
        Task Add<T>(string tableName, T record) where T : class;
        Task Update<T>(string tableName, object id, T record) where T : class;
        Task Delete(string tableName, object id);
    }
}`;
  files.push({ name: 'IStorageService.cs', path: `${root}/Services/IStorageService.cs`, content: iStorageService, language: 'csharp' });

  // IndexedDbService.cs
  const indexedDbService = `using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.JSInterop;

namespace ${namespace}.Services
{
    public class IndexedDbService : IStorageService
    {
        private readonly IJSRuntime _js;
        public string BackendName => "IndexedDB (Lokal & Offline)";

        public IndexedDbService(IJSRuntime js)
        {
            _js = js;
        }

        public async Task<List<T>> GetAll<T>(string tableName) where T : class, new()
        {
            try
            {
                var result = await _js.InvokeAsync<List<T>>("mauiIndexedDb.getAll", tableName);
                return result ?? new List<T>();
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
                return await _js.InvokeAsync<T?>("mauiIndexedDb.getById", tableName, id);
            }
            catch
            {
                return null;
            }
        }

        public async Task Add<T>(string tableName, T record) where T : class
        {
            await _js.InvokeVoidAsync("mauiIndexedDb.add", tableName, record);
        }

        public async Task Update<T>(string tableName, object id, T record) where T : class
        {
            await _js.InvokeVoidAsync("mauiIndexedDb.update", tableName, id, record);
        }

        public async Task Delete(string tableName, object id)
        {
            await _js.InvokeVoidAsync("mauiIndexedDb.delete", tableName, id);
        }
    }
}`;
  files.push({ name: 'IndexedDbService.cs', path: `${root}/Services/IndexedDbService.cs`, content: indexedDbService, language: 'csharp' });

  // ApiService.cs
  const apiService = `using System.Net.Http;
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
                return new List<T>(); // Fallback on connection error
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

        public async Task Add<T>(string tableName, T record) where T : class
        {
            await _http.PostAsJsonAsync($"data/{tableName}", record);
        }

        public async Task Update<T>(string tableName, object id, T record) where T : class
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

        public StorageServiceManager(IServiceProvider serviceProvider, IndexedDbService indexedDbService)
        {
            _serviceProvider = serviceProvider;
            CurrentService = indexedDbService; // Default to IndexedDB as requested
        }

        public void SetStorageType(string type)
        {
            if (type == "IndexedDB")
            {
                CurrentService = (IStorageService)_serviceProvider.GetService(typeof(IndexedDbService))!;
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
