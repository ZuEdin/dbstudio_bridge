
import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report, SelectQuery } from '../../types/index';
import { toPascalCase, toCamelCase, resolveType, isNullable } from './common';
import { DATA_TYPES } from '../../config/dataTypes';

export const generateBlazor = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, forms: Form[], reports: Report[]): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Frontend/${config.projectName}.Client`;
  const safeNamespace = config.projectName.replace(/[^a-zA-Z0-9_]/g, '_');
  const namespace = `${safeNamespace}.Client`;
  const useAuth = config.authConfig?.useUserLogin;
  const clientPort = config.port + 2;

  let version = config.backendVersion || '9.0';
  if (parseFloat(version) > 9.0) {
    version = '9.0';
  }
  const targetFramework = `net${version}`;
  const packageVersion = `${version}.0`; 

  // 1. CSPROJ
  const csprojContent = `<Project Sdk="Microsoft.NET.Sdk.BlazorWebAssembly">
  <PropertyGroup>
    <TargetFramework>${targetFramework}</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly" Version="${packageVersion}" />
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly.DevServer" Version="${packageVersion}" PrivateAssets="all" />
    ${useAuth ? `<PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly.Authentication" Version="${packageVersion}" />
    <PackageReference Include="Microsoft.AspNetCore.Components.Authorization" Version="${packageVersion}" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="7.0.3" />` : ''}
  </ItemGroup>
</Project>`;
  files.push({ name: `${namespace}.csproj`, path: `${root}/${namespace}.csproj`, content: csprojContent, language: 'xml' });

  // launchSettings.json
  const launchSettings = { "profiles": { "http": { "commandName": "Project", "dotnetRunMessages": true, "launchBrowser": true, "applicationUrl": `http://localhost:${clientPort}`, "environmentVariables": { "ASPNETCORE_ENVIRONMENT": "Development" } } } };
  files.push({ name: 'launchSettings.json', path: `${root}/Properties/launchSettings.json`, content: JSON.stringify(launchSettings, null, 2), language: 'json' });

  // 2. _Imports.razor
  const importsContent = `@using System.Net.Http
@using System.Net.Http.Json
@using Microsoft.AspNetCore.Components.Forms
@using Microsoft.AspNetCore.Components.Routing
@using Microsoft.AspNetCore.Components.Web
@using Microsoft.AspNetCore.Components.Web.Virtualization
@using Microsoft.AspNetCore.Components.WebAssembly.Http
@using Microsoft.JSInterop
@using ${namespace}
@using ${namespace}.Layout
@using ${namespace}.Models
@using ${namespace}.Services
${useAuth ? '@using Microsoft.AspNetCore.Components.Authorization' : ''}
${useAuth ? '@using Microsoft.AspNetCore.Authorization' : ''}
`;
  files.push({ name: '_Imports.razor', path: `${root}/_Imports.razor`, content: importsContent, language: 'razor' });

  // 3. Program.cs
  let programContent = `using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using ${namespace};
using ${namespace}.Services;
${useAuth ? 'using Microsoft.AspNetCore.Components.Authorization;' : ''}

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => {
    var navigationManager = sp.GetRequiredService<NavigationManager>();
    var baseUri = navigationManager.BaseUri;
    string apiUri = baseUri.Contains("localhost") || baseUri.Contains("127.0.0.1") ? "http://localhost:${config.port}/api/" : $"{baseUri}api/";
    return new HttpClient { BaseAddress = new Uri(apiUri) };
});
builder.Services.AddScoped<ApiService>();
`;

  if (useAuth) {
      programContent += `
builder.Services.AddAuthorizationCore();
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthStateProvider>();
builder.Services.AddScoped<AuthService>();
`;
  }

  programContent += `await builder.Build().RunAsync();`;
  files.push({ name: 'Program.cs', path: `${root}/Program.cs`, content: programContent, language: 'csharp' });

  // 4. index.html & CSS (Standard)
  files.push({ name: 'index.html', path: `${root}/wwwroot/index.html`, content: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${config.projectName}</title><base href="/" /><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet"><link href="css/app.css" rel="stylesheet" /><link href="${namespace}.styles.css" rel="stylesheet" /></head><body><div id="app">Loading...</div><script src="_framework/blazor.webassembly.js"></script></body></html>`, language: 'html' });
  files.push({ name: 'app.css', path: `${root}/wwwroot/css/app.css`, content: `body { font-family: sans-serif; } .sidebar { background-color: #f8f9fa; height: 100vh; }`, language: 'css' });

  // 6. Layouts & Routing
  const appRazor = useAuth ? `<CascadingAuthenticationState>
    <Router AppAssembly="@typeof(App).Assembly">
        <Found Context="routeData">
            <AuthorizeRouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)">
                <NotAuthorized>
                    <div class="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4 font-sans text-center">
                        <h1 class="display-1 fw-bold text-danger mb-2">NO ACCESS</h1>
                        <p class="fs-5 text-secondary mb-4">Sie haben keine Berechtigung für diese Seite.</p>
                        <a href="login" class="btn btn-danger btn-lg fw-bold shadow-sm">Zum Login</a>
                    </div>
                </NotAuthorized>
            </AuthorizeRouteView>
        </Found>
        <NotFound><PageTitle>Not found</PageTitle><LayoutView Layout="@typeof(MainLayout)"><p>Not found.</p></LayoutView></NotFound>
    </Router>
</CascadingAuthenticationState>` : `<Router AppAssembly="@typeof(App).Assembly"><Found Context="routeData"><RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" /></Found><NotFound>Not Found</NotFound></Router>`;
  files.push({ name: 'App.razor', path: `${root}/App.razor`, content: appRazor, language: 'razor' });

  const mainLayout = `@inherits LayoutComponentBase
${useAuth ? '@inject AuthService Auth' : ''}
${useAuth ? '@inject NavigationManager Nav' : ''}
<div class="page"><div class="sidebar"><NavMenu /></div><main><div class="top-row px-4">${useAuth ? `<AuthorizeView><Authorized>Hallo, @context.User.Identity?.Name | <a href="profile">Profil</a> | <button class="btn btn-link" @onclick="Logout">Logout</button></Authorized><NotAuthorized><a href="login">Login</a></NotAuthorized></AuthorizeView>` : ''}</div><article class="content px-4">@Body</article></main></div>
${useAuth ? `@code { async Task Logout() { await Auth.Logout(); Nav.NavigateTo("/login"); } }` : ''}`;
  files.push({ name: 'MainLayout.razor', path: `${root}/Layout/MainLayout.razor`, content: mainLayout, language: 'razor' });

  // NavMenu with Role Checks
  let navLinks = '';
  tables.forEach(t => {
      const isSystem = t.name.startsWith('sys_');
      const link = `<div class="nav-item px-3"><NavLink class="nav-link" href="${toCamelCase(t.name)}"><span class="bi bi-table"></span> ${t.name}</NavLink></div>`;
      
      if (useAuth && isSystem) {
          navLinks += `<AuthorizeView Roles="Admin">${link}</AuthorizeView>`;
      } else {
          navLinks += link;
      }
  });

  files.push({ name: 'NavMenu.razor', path: `${root}/Layout/NavMenu.razor`, content: `<div class="top-row ps-3 navbar navbar-dark"><a class="navbar-brand" href="">${config.projectName}</a></div><div class="nav-scrollable"><nav class="flex-column">${navLinks}</nav></div>`, language: 'razor' });
  files.push({ name: 'NavMenu.razor.css', path: `${root}/Layout/NavMenu.razor.css`, content: `.nav-item a { color: #333; }`, language: 'css' });

  // 7. Models & Services
  // (Models generation omitted for brevity, assumes same as previous)
  tables.forEach(table => {
      const className = toPascalCase(table.name);
      const props = table.fields.map(f => `    public ${resolveType(f, 'csharp')}${isNullable(f) ? '?' : ''} ${toPascalCase(f.name)} { get; set; }`).join('\n');
      files.push({ name: `${className}.cs`, path: `${root}/Models/${className}.cs`, content: `namespace ${namespace}.Models { public class ${className} { \n${props}\n } }`, language: 'csharp' });
  });

  // Always generate ApiService
  files.push({ name: 'ApiService.cs', path: `${root}/Services/ApiService.cs`, content: `using System.Net.Http; using System.Net.Http.Json; using System.Collections.Generic; using System.Threading.Tasks; using Microsoft.JSInterop; namespace ${namespace}.Services { public class ApiService { private readonly HttpClient _http; private readonly IJSRuntime _js; public ApiService(HttpClient http, IJSRuntime js) { _http = http; _js = js; } private async Task AddHeader() { var token = await _js.InvokeAsync<string>("localStorage.getItem", "auth_token"); if(!string.IsNullOrEmpty(token)) _http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token); } public async Task<List<T>> Get<T>(string uri) { await AddHeader(); return await _http.GetFromJsonAsync<List<T>>(uri) ?? new(); } public async Task<T> GetById<T>(string uri, object id) { await AddHeader(); return await _http.GetFromJsonAsync<T>($"{uri}/{id}"); } public async Task Create<T>(string uri, T val) { await AddHeader(); await _http.PostAsJsonAsync(uri, val); } public async Task Update<T>(string uri, object id, T val) { await AddHeader(); await _http.PutAsJsonAsync($"{uri}/{id}", val); } public async Task Delete(string uri, object id) { await AddHeader(); await _http.DeleteAsync($"{uri}/{id}"); } } }`, language: 'csharp' });

  if (useAuth) {
      files.push({
          name: 'CustomAuthStateProvider.cs',
          path: `${root}/Services/CustomAuthStateProvider.cs`,
          content: `using System.Security.Claims;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.JSInterop;
using System.Text.Json;

namespace ${namespace}.Services {
    public class CustomAuthStateProvider : AuthenticationStateProvider {
        private readonly IJSRuntime _js;
        public CustomAuthStateProvider(IJSRuntime js) { _js = js; }

        public override async Task<AuthenticationState> GetAuthenticationStateAsync() {
            var token = await _js.InvokeAsync<string>("localStorage.getItem", "auth_token");
            var identity = string.IsNullOrEmpty(token) ? new ClaimsIdentity() : new ClaimsIdentity(ParseClaimsFromJwt(token), "jwt");
            return new AuthenticationState(new ClaimsPrincipal(identity));
        }

        public void NotifyUserAuthentication(string token) {
            var identity = new ClaimsIdentity(ParseClaimsFromJwt(token), "jwt");
            var user = new ClaimsPrincipal(identity);
            NotifyAuthenticationStateChanged(Task.FromResult(new AuthenticationState(user)));
        }

        public void NotifyUserLogout() {
            NotifyAuthenticationStateChanged(Task.FromResult(new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity()))));
        }

        private IEnumerable<Claim> ParseClaimsFromJwt(string jwt) {
            var claims = new List<Claim>();
            var payload = jwt.Split('.')[1];
            var jsonBytes = ParseBase64WithoutPadding(payload);
            var keyValuePairs = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonBytes);

            foreach (var kvp in keyValuePairs!) {
                // Handle Role mapping specifically
                if (kvp.Key == "role" || kvp.Key == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role") {
                    if (kvp.Value is JsonElement element && element.ValueKind == JsonValueKind.Array) {
                        foreach (var role in element.EnumerateArray()) {
                            claims.Add(new Claim(ClaimTypes.Role, role.ToString()));
                        }
                    } else {
                        claims.Add(new Claim(ClaimTypes.Role, kvp.Value.ToString()!));
                    }
                } else {
                    claims.Add(new Claim(kvp.Key, kvp.Value.ToString()!));
                }
            }
            return claims;
        }

        private byte[] ParseBase64WithoutPadding(string base64) {
            switch (base64.Length % 4) {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }
            return Convert.FromBase64String(base64);
        }
    }
}`, language: 'csharp'
      });
      
      files.push({ name: 'LoginModel.cs', path: `${root}/Models/LoginModel.cs`, content: `namespace ${namespace}.Models { public class LoginModel { public string Username { get; set; } = ""; public string Password { get; set; } = ""; } public class RegisterModel { public string Username { get; set; } = ""; public string Email { get; set; } = ""; public string Password { get; set; } = ""; } public class ChangePasswordModel { public string OldPassword { get; set; } = ""; public string NewPassword { get; set; } = ""; } public class AuthResponse { public string Token { get; set; } = ""; } }`, language: 'csharp' });
      files.push({ name: 'AuthService.cs', path: `${root}/Services/AuthService.cs`, content: `using System.Net.Http; using System.Net.Http.Json; using System.Threading.Tasks; using System.Collections.Generic; using Microsoft.AspNetCore.Components.Authorization; using Microsoft.JSInterop; using ${namespace}.Models; namespace ${namespace}.Services { public class AuthService { private readonly HttpClient _http; private readonly AuthenticationStateProvider _provider; private readonly IJSRuntime _js; public AuthService(HttpClient http, AuthenticationStateProvider provider, IJSRuntime js) { _http = http; _provider = provider; _js = js; } public async Task Login(LoginModel model) { var res = await _http.PostAsJsonAsync("auth/login", model); if(!res.IsSuccessStatusCode) throw new Exception("Login failed"); var data = await res.Content.ReadFromJsonAsync<AuthResponse>(); await _js.InvokeVoidAsync("localStorage.setItem", "auth_token", data.Token); ((CustomAuthStateProvider)_provider).NotifyUserAuthentication(data.Token); } public async Task Register(RegisterModel model) { await _http.PostAsJsonAsync("auth/register", model); } public async Task ChangePassword(ChangePasswordModel model) { await _http.PostAsJsonAsync("auth/change-password", model); } public async Task Logout() { await _js.InvokeVoidAsync("localStorage.removeItem", "auth_token"); ((CustomAuthStateProvider)_provider).NotifyUserLogout(); } } }`, language: 'csharp' });
      
      files.push({ name: 'Login.razor', path: `${root}/Pages/Login.razor`, content: `@page "/login"\n@inject AuthService Auth\n@inject NavigationManager Nav\n@using ${namespace}.Models\n<div class="col-md-4 mx-auto mt-5"><h3>Login</h3><EditForm Model="model" OnValidSubmit="DoLogin"><DataAnnotationsValidator/><div class="mb-3"><label>User</label><InputText @bind-Value="model.Username" class="form-control"/></div><div class="mb-3"><label>Pass</label><InputText @bind-Value="model.Password" type="password" class="form-control"/></div><button class="btn btn-primary w-100">Login</button></EditForm><div class="mt-2 text-center"><a href="forgot-password">Passwort vergessen?</a></div></div>\n@code { LoginModel model = new(); async Task DoLogin() { await Auth.Login(model); Nav.NavigateTo("/"); } }`, language: 'razor' });
      files.push({ name: 'Register.razor', path: `${root}/Pages/Register.razor`, content: `@page "/register"\n@inject AuthService Auth\n@inject NavigationManager Nav\n@using ${namespace}.Models\n<div class="col-md-4 mx-auto mt-5"><h3>Register</h3><EditForm Model="model" OnValidSubmit="DoReg"><DataAnnotationsValidator/><div class="mb-3"><label>User</label><InputText @bind-Value="model.Username" class="form-control"/></div><div class="mb-3"><label>Email</label><InputText @bind-Value="model.Email" class="form-control"/></div><div class="mb-3"><label>Pass</label><InputText @bind-Value="model.Password" type="password" class="form-control"/></div><button class="btn btn-success w-100">Register</button></EditForm></div>\n@code { RegisterModel model = new(); async Task DoReg() { await Auth.Register(model); Nav.NavigateTo("/login"); } }`, language: 'razor' });
      
      // Forgot Password Page
      files.push({ name: 'ForgotPassword.razor', path: `${root}/Pages/ForgotPassword.razor`, content: `@page "/forgot-password"\n<div class="col-md-4 mx-auto mt-5"><h3>Passwort vergessen</h3><p>Bitte E-Mail eingeben.</p><input class="form-control mb-2" placeholder="E-Mail"/><button class="btn btn-primary w-100" onclick="alert('Simuliert: Mail gesendet')">Senden</button><a href="login" class="d-block mt-2 text-center">Zurück</a></div>`, language: 'razor' });

      // Profile Page
      files.push({ name: 'Profile.razor', path: `${root}/Pages/Profile.razor`, content: `@page "/profile"\n@attribute [Authorize]\n@inject AuthService Auth\n@using ${namespace}.Models\n<h3>Mein Profil</h3><hr/><div class="col-md-4"><h5 class="mb-3">Passwort ändern</h5><EditForm Model="model" OnValidSubmit="ChangePw"><div class="mb-3"><label>Alt</label><InputText @bind-Value="model.OldPassword" type="password" class="form-control"/></div><div class="mb-3"><label>Neu</label><InputText @bind-Value="model.NewPassword" type="password" class="form-control"/></div><button class="btn btn-secondary">Ändern</button></EditForm></div>\n@code { ChangePasswordModel model = new(); async Task ChangePw() { await Auth.ChangePassword(model); } }`, language: 'razor' });
  }

  // 9. Index Page
  files.push({
      name: 'Index.razor',
      path: `${root}/Pages/Index.razor`,
      content: `@page "/"\n${useAuth ? '@attribute [Authorize]\n' : ''}<div class="container mt-5"><div class="p-5 mb-4 bg-light rounded-3 shadow-sm border"><div class="container-fluid py-5"><h1 class="display-5 fw-bold text-primary">${config.projectName}</h1><p class="col-md-8 fs-4 text-muted">Willkommen in Ihrer C#- und Blazor-Anwendung. Verwalten Sie Ihre Tabellen, führen Sie Abfragen aus und erstellen Sie Berichte.</p><hr class="my-4"/><div class="row mt-4"><div class="col-md-6"><h5>Schnellstart</h5><p class="text-secondary">Wählen Sie links im Menü eine Tabelle aus, um Datensätze anzuzeigen, zu erstellen oder zu bearbeiten.</p></div><div class="col-md-6"><h5>Datenbank-Studio Pro</h5><p class="text-secondary">Diese Anwendung wurde mit dem modernen ASP.NET Core Backend und dem Blazor WebAssembly Frontend generiert.</p></div></div></div></div></div>`,
      language: 'razor'
  });

  // 10. Pages with [Authorize(Roles="Admin")] for System Tables
  tables.forEach(table => {
      const className = toPascalCase(table.name);
      const isSystem = table.name.startsWith('sys_');
      let attributes = '';
      if (useAuth) {
          attributes = isSystem ? '@attribute [Authorize(Roles = "Admin")]' : '@attribute [Authorize]';
      }

      const listContent = `@page "/${toCamelCase(table.name)}"
${attributes}
@inject ApiService Api
@using ${namespace}.Models

<h3>${table.name}</h3>
<p>Auto-generated page.</p>
<!-- Table listing logic omitted for brevity -->
`;
      files.push({ name: `${className}List.razor`, path: `${root}/Pages/${className}List.razor`, content: listContent, language: 'razor' });
  });

  return files;
};
