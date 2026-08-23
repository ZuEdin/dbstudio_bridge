import { Table, BackendConfig, VirtualFile } from '../../../types/index';
import { toCamelCase } from '../common';

export const generateMauiLayouts = (
  tables: Table[],
  config: BackendConfig,
  namespace: string,
  root: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // MainLayout.razor
  const mainLayout = `@inherits LayoutComponentBase
@inject StorageServiceManager StorageManager
@implements IDisposable

<div class="page">
    <div class="sidebar">
        <NavMenu />
    </div>
    <main>
        <div class="top-row px-4 shadow-sm">
            <div class="d-flex align-items-center gap-3">
                <span class="fw-bold text-slate-700">Datenquelle:</span>
                <select class="form-select form-select-sm" style="width: auto;" @value="currentStorage" @onchange="OnStorageChanged">
                    <option value="IndexedDB">IndexedDB (Lokal &amp; Offline)</option>
                    <option value="API">REST API (Server &amp; SQL-Verbindung)</option>
                </select>
            </div>
            <div class="text-secondary text-xs">
                <span>Modus: <b>@StorageManager.CurrentService.BackendName</b></span>
            </div>
        </div>
        <article class="content px-4">
            @Body
        </article>
    </main>
</div>

@code {
    private string currentStorage = "IndexedDB";

    protected override void OnInitialized()
    {
        StorageManager.OnStorageChanged += StateHasChanged;
    }

    private void OnStorageChanged(ChangeEventArgs e)
    {
        var val = e.Value?.ToString() ?? "IndexedDB";
        currentStorage = val;
        StorageManager.SetStorageType(val);
    }

    public void Dispose()
    {
        StorageManager.OnStorageChanged -= StateHasChanged;
    }
}`;
  files.push({ name: 'MainLayout.razor', path: `${root}/Layout/MainLayout.razor`, content: mainLayout, language: 'razor' });

  // NavMenu.razor
  let navLinks = '';
  tables.forEach(t => {
      navLinks += `        <div class="nav-item px-3">
            <NavLink class="nav-link" href="${toCamelCase(t.name)}">
                <i class="bi bi-table"></i> ${t.name}
            </NavLink>
        </div>\n`;
  });

  files.push({ 
      name: 'NavMenu.razor', 
      path: `${root}/Layout/NavMenu.razor`, 
      content: `<div class="top-row ps-3 navbar navbar-dark bg-dark">
    <a class="navbar-brand text-truncate fw-bold" href="">${config.projectName}</a>
</div>
<div class="nav-scrollable flex-grow-1 py-3" style="overflow-y: auto;">
    <nav class="flex-column">
        <div class="nav-item px-3">
            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
                <i class="bi bi-speedometer2"></i> Dashboard
            </NavLink>
        </div>
        <hr class="text-secondary my-2 mx-3" />
        <div class="px-3 text-uppercase text-secondary fw-bold" style="font-size: 0.75rem; letter-spacing: 0.05em;">Tabellen</div>
${navLinks}
    </nav>
</div>`, 
      language: 'razor' 
  });

  return files;
};
