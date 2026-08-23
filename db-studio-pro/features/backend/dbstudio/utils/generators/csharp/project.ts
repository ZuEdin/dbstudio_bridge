import JSZip from "jszip";

export function generateProjectFiles(
  zip: JSZip,
  normalizedSubfolder: string,
  includeWwwroot: boolean
) {
  zip.file("DBStudioBackend.csproj", `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <NoWarn>$(NoWarn);NU1903</NoWarn>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="10.0.0" />
    <PackageReference Include="Microsoft.Data.SqlClient" Version="6.0.1" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="7.2.0" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.0" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.Negotiate" Version="10.0.0" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.1.0" />
    <PackageReference Include="System.DirectoryServices.AccountManagement" Version="10.0.0" />
  </ItemGroup>
</Project>`);

  if (includeWwwroot) {
    const subfolderHtml = normalizedSubfolder 
      ? '<div class="subfolder-badge">Unterordner: ' + normalizedSubfolder + '</div>' 
      : '';

    zip.file("wwwroot/index.html", `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DB Studio Pro Backend</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2rem; border-radius: 0.75rem; border: 1px solid #334155; text-align: center; max-width: 480px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); }
        h1 { color: #38bdf8; margin-top: 0; font-size: 1.5rem; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
        .subfolder-badge { background: #312e81; color: #a5b4fc; border: 1px solid #4338ca; padding: 0.35rem 0.85rem; border-radius: 0.5rem; font-family: monospace; font-weight: 600; font-size: 0.85rem; display: inline-block; margin: 0.5rem 0; }
        .status { background: #0284c7; color: white; padding: 0.35rem 0.85rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; margin-top: 1rem; display: inline-block; }
        a { color: #38bdf8; text-decoration: none; font-weight: 500; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="card">
        <h1>DB Studio Pro Backend (.NET 10)</h1>
        <p>Das C# ASP.NET Core Backend ist aktiv und einsatzbereit.</p>
        ${subfolderHtml}
        <p><a href="${normalizedSubfolder}/swagger">Swagger API Dokumentation öffnen &rarr;</a></p>
        <div class="status">System Status: Online</div>
    </div>
</body>
</html>
`);

    const actionUrl = (normalizedSubfolder ? normalizedSubfolder + '/' : '') + 'index.html';

    zip.file("wwwroot/web.config", `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" arguments=".\\\DBStudioBackend.dll" stdoutLogEnabled="true" stdoutLogFile=".\\\logs\\\stdout" hostingModel="inprocess" />
      <rewrite>
        <rules>
          <rule name="Subfolder Rewrite" stopProcessing="true">
            <match url=".*" />
            <conditions logicalGrouping="MatchAll">
              <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
              <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            </conditions>
            <action type="Rewrite" url="${actionUrl}" />
          </rule>
        </rules>
      </rewrite>
    </system.webServer>
  </location>
</configuration>`);
  }

  zip.file("Program.cs", `using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using DBStudioBackend.Data;
using DBStudioBackend.Services;
using DBStudioBackend.Hubs;
using Microsoft.AspNetCore.Authentication;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "DB Studio Pro API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme {
        Description = "JWT Authorization Header in Bearer Format",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});
builder.Services.AddHttpClient(); // For external API caching and Gemini AI integration
builder.Services.AddSignalR();    // Realtime capabilities via SignalR

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAdService, AdService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddTransient<IClaimsTransformation, AdRoleTransformer>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();

// Register Webhook Dispatcher & Inbound Services
builder.Services.AddSingleton<WebhookDispatcher>();
builder.Services.AddSingleton<InboundWebhookService>();

// CORS konfiguriert für Credentials & dynamische Origins (React App, Swagger, Localhost)
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReactApp", p => p
        .SetIsOriginAllowed(origin => true)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});

builder.Services.AddDbContext<MetaDbContext>(options =>
    options.UseSqlite("Data Source=dbstudio_meta.db"));

// Configure Authentication (supports both Windows/Negotiate and JWT Bearer)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "db_studio_pro_enterprise_security_key_2026";
builder.Services.AddAuthentication(options => {
    options.DefaultScheme = NegotiateDefaults.AuthenticationScheme;
})
.AddNegotiate()
.AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "dbstudio.local",
        ValidAudience = "dbstudio-clients",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

var app = builder.Build();

// Configure Subfolder Base Path if specified
var basePath = builder.Configuration["BASE_PATH"] ?? "${normalizedSubfolder}";
if (!string.IsNullOrEmpty(basePath) && basePath != "/") {
    app.UsePathBase(basePath);
}

app.UseCors("AllowReactApp");

// Always enable Swagger for ease of self-hosted schema verification and testing
app.UseSwagger();
app.UseSwaggerUI();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

// Database Initialization and default user seed
using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<MetaDbContext>();
    db.Database.EnsureCreated();
    
    // Seed default admin user if database is freshly created
    if (!db.SysUsers.Any()) {
        db.SysUsers.Add(new DBStudioBackend.Models.SysUser {
            Id = "admin_usr_1",
            Username = "admin",
            Email = "admin@dbstudio.local",
            PasswordHash = "$2b$10$hash_demo",
            Role = "Admin",
            IsActive = 1
        });
        db.SaveChanges();
    }
}

app.MapGet("/api/health", () => new { 
    Status = "ok", 
    Service = "DB Studio Self-Host (.NET 10 with SignalR & Auth)", 
    Version = "1.0.0",
    Time = DateTime.UtcNow 
});

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat"); // Register SignalR route
app.MapFallbackToFile("index.html");

app.Run();
`);

  zip.file("start.bat", `@echo off
echo Starte DB Studio Pro .NET 10 Enterprise Backend...
dotnet run
pause`);

  zip.file("start.sh", `#!/bin/bash
echo "Starte DB Studio Pro .NET 10 Enterprise Backend..."
dotnet run`);

  zip.file("build_webserver.bat", `@echo off
echo [DB Studio Pro] Erstelle Production Build / IIS Publish Bundle...
dotnet restore
dotnet publish DBStudioBackend.csproj -c Release -o ./publish
echo.
echo [OK] Build abgeschlossen!
echo Der Ordner .\\publish enthaelt alle Dateien fuer IIS / Windows Server / Kestrel.
pause`);

  zip.file("build_webserver.sh", `#!/bin/bash
echo "[DB Studio Pro] Erstelle Production Build / Linux Webserver Bundle..."
dotnet restore
dotnet publish DBStudioBackend.csproj -c Release -o ./publish
echo "[OK] Build abgeschlossen! Ordner: ./publish"`);
}
