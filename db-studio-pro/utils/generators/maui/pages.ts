import { Table, BackendConfig, VirtualFile } from '../../../types/index';
import { toPascalCase, toCamelCase } from '../common';

export const generateMauiPages = (
  tables: Table[],
  config: BackendConfig,
  namespace: string,
  root: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // Index.razor
  let tableCardStats = '';
  tables.forEach(t => {
      tableCardStats += `
            <div class="col-md-4 mb-3">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-body">
                        <h6 class="text-uppercase text-secondary mb-1" style="font-size: 0.8rem; letter-spacing: 0.05em;">${t.name}</h6>
                        <h3 class="card-title text-primary font-bold">@counts["${t.name}"] Einträge</h3>
                        <p class="card-text text-secondary text-xs">Tabellenschema für ${t.name} bereitgestellt.</p>
                        <a href="${toCamelCase(t.name)}" class="btn btn-outline-primary btn-sm mt-2">Öffnen</a>
                    </div>
                </div>
            </div>`;
  });

  const indexRazor = `@page "/"
@inject StorageServiceManager StorageManager
@implements IDisposable

<div class="container-fluid">
    <div class="p-5 mb-4 bg-white rounded-3 shadow-sm border">
        <div class="container-fluid py-2">
            <h1 class="display-5 fw-bold text-primary">${config.projectName} MAUI App</h1>
            <p class="col-md-8 fs-5 text-secondary">
                Willkommen in Ihrer cross-platform .NET MAUI Blazor Hybrid Anwendung. Entwickelt für erstklassige Performance auf Windows, Android, macOS und iOS.
            </p>
            <hr class="my-4" />
            <div class="row">
                <div class="col-md-6">
                    <h5 class="fw-bold"><i class="bi bi-shield-check text-success"></i> Offline-First Priorität</h5>
                    <p class="text-secondary">
                        Standardmäßig speichert die App alle Einträge in der hochperformanten **IndexedDB** des Gerätes. Sie können die Datenquelle jederzeit oben links umschalten.
                    </p>
                </div>
                <div class="col-md-6">
                    <h5 class="fw-bold"><i class="bi bi-cloud-arrow-up text-primary"></i> Multi-Backend fähig</h5>
                    <p class="text-secondary">
                        Durch das generische Repository-Muster lässt sich die Datenhaltung mühelos auf SQL-Server, MySQL oder eine Cloud-Datenbank migrieren.
                    </p>
                </div>
            </div>
        </div>
    </div>

    <h4 class="fw-bold mb-3 text-slate-800">Tabellenübersicht</h4>
    <div class="row">
        ${tableCardStats}
    </div>
</div>

@code {
    private Dictionary<string, int> counts = new() {
        ${tables.map(t => `{"${t.name}", 0}`).join(',\n        ')}
    };

    protected override async Task OnInitializedAsync()
    {
        StorageManager.OnStorageChanged += HandleStorageChanged;
        await LoadCounts();
    }

    private async Task HandleStorageChanged()
    {
        await LoadCounts();
        StateHasChanged();
    }

    private async Task LoadCounts()
    {
        var service = StorageManager.CurrentService;
        ${tables.map(t => `
        try {
            var ${toCamelCase(t.name)}List = await service.GetAll<${toPascalCase(t.name)}>("${t.name}");
            counts["${t.name}"] = ${toCamelCase(t.name)}List.Count;
        } catch { counts["${t.name}"] = 0; }
        `).join('\n')}
    }

    public void Dispose()
    {
        StorageManager.OnStorageChanged -= HandleStorageChanged;
    }
}`;
  files.push({ name: 'Index.razor', path: `${root}/Pages/Index.razor`, content: indexRazor, language: 'razor' });

  // CRUD Pages for all tables!
  tables.forEach(table => {
      const className = toPascalCase(table.name);
      
      // Fields rendering
      let tableHeaders = '';
      let tableRows = '';
      let formFields = '';

      table.fields.forEach(f => {
          const propName = toPascalCase(f.name);
          tableHeaders += `                        <th>${propName}</th>\n`;
          tableRows += `                        <td>@item.${propName}</td>\n`;

          if (f.isPrimaryKey) {
              // Primary key read-only
              formFields += `                    <div class="mb-3">
                        <label class="form-label">${propName} (Primärschlüssel)</label>
                        <input type="text" class="form-control" value="@activeItem.${propName}" disabled />
                    </div>\n`;
          } else {
              // Edit inputs based on type
              if (f.type === 'BOOLEAN') {
                  formFields += `                    <div class="mb-3 form-check">
                        <InputCheckbox id="${f.name}" class="form-check-input" @bind-Value="activeItem.${propName}" />
                        <label for="${f.name}" class="form-check-label">${propName}</label>
                    </div>\n`;
              } else if (f.type === 'INTEGER' || f.type === 'DOUBLE' || f.type === 'DECIMAL') {
                  formFields += `                    <div class="mb-3">
                        <label class="form-label">${propName}</label>
                        <InputNumber class="form-control" @bind-Value="activeItem.${propName}" />
                    </div>\n`;
              } else if (f.type === 'DATE' || f.type === 'DATETIME') {
                  formFields += `                    <div class="mb-3">
                        <label class="form-label">${propName}</label>
                        <InputDate class="form-control" @bind-Value="activeItem.${propName}" />
                    </div>\n`;
              } else {
                  formFields += `                    <div class="mb-3">
                        <label class="form-label">${propName}</label>
                        <InputText class="form-control" @bind-Value="activeItem.${propName}" />
                    </div>\n`;
              }
          }
      });

      const listContent = `@page "/${toCamelCase(table.name)}"
@inject StorageServiceManager StorageManager
@implements IDisposable
@using ${namespace}.Models

<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="fw-bold text-slate-800">${table.name}</h2>
            <p class="text-secondary text-sm">Verwalten Sie Ihre ${table.name}-Datenbankeinträge direkt.</p>
        </div>
        <button class="btn btn-primary" @onclick="OpenAddModal">
            <i class="bi bi-plus-lg"></i> Neuer Eintrag
        </button>
    </div>

    <div class="card shadow-sm border-0">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
${tableHeaders}
                            <th class="text-end" style="width: 150px;">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        @if (items == null)
                        {
                            <tr>
                                <td colspan="${table.fields.length + 1}" class="text-center py-4">
                                    <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
                                    <span class="ms-2">Lade Datensätze...</span>
                                </td>
                            </tr>
                        }
                        else if (!items.Any())
                        {
                            <tr>
                                <td colspan="${table.fields.length + 1}" class="text-center py-4 text-secondary">
                                    Keine Datensätze vorhanden. Klicken Sie auf "Neuer Eintrag", um welche zu erstellen.
                                </td>
                            </tr>
                        }
                        else
                        {
                            @foreach (var item in items)
                            {
                                <tr>
${tableRows}
                                    <td class="text-end">
                                        <button class="btn btn-sm btn-outline-secondary me-1" @onclick="() => OpenEditModal(item)">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" @onclick="() => DeleteItem(item)">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            }
                        }
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

@if (showModal)
{
    <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold">@(isEditMode ? "Eintrag bearbeiten" : "Neuer Eintrag")</h5>
                    <button type="button" class="btn-close" @onclick="CloseModal"></button>
                </div>
                <EditForm Model="activeItem" OnValidSubmit="SaveItem">
                    <div class="modal-body">
                        <DataAnnotationsValidator />
                        <ValidationSummary />
                        
${formFields}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @onclick="CloseModal">Abbrechen</button>
                        <button type="submit" class="btn btn-primary">Speichern</button>
                    </div>
                </EditForm>
            </div>
        </div>
    </div>
}

@code {
    private List<${className}>? items;
    private ${className} activeItem = new();
    private bool showModal = false;
    private bool isEditMode = false;

    protected override async Task OnInitializedAsync()
    {
        StorageManager.OnStorageChanged += HandleStorageChanged;
        await LoadData();
    }

    private async Task HandleStorageChanged()
    {
        await LoadData();
        StateHasChanged();
    }

    private async Task LoadData()
    {
        items = null;
        try
        {
            items = await StorageManager.CurrentService.GetAll<${className}>("${table.name}");
        }
        catch
        {
            items = new List<${className}>();
        }
    }

    private void OpenAddModal()
    {
        activeItem = new ${className}();
        isEditMode = false;
        showModal = true;
    }

    private void OpenEditModal(${className} item)
    {
        // Shallow copy for editing
        activeItem = new ${className}();
        foreach (var prop in typeof(${className}).GetProperties())
        {
            prop.SetValue(activeItem, prop.GetValue(item));
        }
        isEditMode = true;
        showModal = true;
    }

    private void CloseModal()
    {
        showModal = false;
    }

    private async Task SaveItem()
    {
        var service = StorageManager.CurrentService;
        if (isEditMode)
        {
            var idProp = typeof(${className}).GetProperty("Id") ?? typeof(${className}).GetProperty("id");
            var idVal = idProp?.GetValue(activeItem) ?? 0;
            await service.Update("${table.name}", idVal, activeItem);
        }
        else
        {
            await service.Add("${table.name}", activeItem);
        }

        CloseModal();
        await LoadData();
    }

    private async Task DeleteItem(${className} item)
    {
        var idProp = typeof(${className}).GetProperty("Id") ?? typeof(${className}).GetProperty("id");
        var idVal = idProp?.GetValue(item) ?? 0;
        await StorageManager.CurrentService.Delete("${table.name}", idVal);
        await LoadData();
    }

    public void Dispose()
    {
        StorageManager.OnStorageChanged -= HandleStorageChanged;
    }
}
`;
      files.push({ name: `${className}List.razor`, path: `${root}/Pages/${className}List.razor`, content: listContent, language: 'razor' });
  });

  return files;
};
