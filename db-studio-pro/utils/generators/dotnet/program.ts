
import { BackendConfig, DbType, VirtualFile, Table, Relationship, Query, SelectQuery } from '../../../types/index';
import { generateSqlSelect } from '../../sqlHelper';
import { toPascalCase } from '../common';

export const generateProgram = (config: BackendConfig, tables: Table[], relationships: Relationship[], queries: Query[], root: string): VirtualFile => {
  const safeNamespace = config.projectName.replace(/[^a-zA-Z0-9_]/g, '_');
  const isBlazor = config.frontendFramework === 'blazor';
  let dbConfigCode = `builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));`;
  if (config.dbType === DbType.SQLite) dbConfigCode = `builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));`;
  if (config.dbType === DbType.MySQL) dbConfigCode = `builder.Services.AddDbContext<AppDbContext>(options => options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"), ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))));`;

  const swaggerSetup = config.useSwagger ? `builder.Services.AddEndpointsApiExplorer(); builder.Services.AddSwaggerGen();` : '';
  const swaggerUse = config.useSwagger ? `app.UseSwagger(); app.UseSwaggerUI();` : '';

  let authServices = '';
  let authAppUse = '';
  let namespaces = 'using System.Security.Claims;\nusing Quartz;\nusing Microsoft.AspNetCore.Authentication;';

  const authConfig = config.authConfig;

  // Always register CurrentUserService and HttpContextAccessor for Audit
  authServices += `
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<${safeNamespace}.Services.ICurrentUserService, ${safeNamespace}.Services.CurrentUserService>();
`;

  if (authConfig?.useWindowsAuth) {
      namespaces += '\nusing Microsoft.AspNetCore.Authentication.Negotiate;';
      authServices += `
builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme).AddNegotiate();
builder.Services.AddScoped<${safeNamespace}.Services.IAdService, ${safeNamespace}.Services.AdService>();
`;
      if (authConfig.adMapping && authConfig.adMapping.length > 0) {
          namespaces += `\nusing ${safeNamespace}.Services;`;
          authServices += `\nbuilder.Services.AddTransient<IClaimsTransformation, AdRoleTransformer>();\n`;
      }
      if (authConfig.devBypass) {
          authAppUse += `app.UseAuthentication(); app.UseMiddleware<WindowsDevBypassMiddleware>(); app.UseAuthorization();`;
      } else {
          authAppUse += `app.UseAuthentication(); app.UseAuthorization();`;
      }
  } else if (authConfig?.useUserLogin) {
      namespaces += `\nusing ${safeNamespace}.Services;`;
      authServices += `\nbuilder.Services.AddScoped<IPermissionService, PermissionService>();\n`;
  }

  // ROBUST CORS POLICY: Always allow credentials and reflect origin to avoid "Status 0" errors in browsers
  const corsPolicy = `app.UseCors(x => x
    .SetIsOriginAllowed(origin => true) // Allow any origin but reflect it back (required for Credentials)
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());`;

  let bypassMiddlewareSection = '';
  if (authConfig?.devBypass) {
      bypassMiddlewareSection = `

#region Bypass Middleware
public class WindowsDevBypassMiddleware
{
    private readonly RequestDelegate _next;
    public WindowsDevBypassMiddleware(RequestDelegate next) { _next = next; }
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, "COMPANY\\\\Dev User"),
                new Claim(ClaimTypes.NameIdentifier, "S-1-5-21-dev-user-id"),
                new Claim(ClaimTypes.Email, "dev-user@company.local"),
                new Claim(ClaimTypes.Role, "User"),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, "WindowsDevBypass");
            context.User = new ClaimsPrincipal(identity);
        }
        await _next(context);
    }
}
#endregion`;
  }

  const contentRawNamespaces = `using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using ${safeNamespace}.Data;
${namespaces}
${config.multiTenancy?.enabled ? `using ${safeNamespace}.Services;\nusing ${safeNamespace}.Middleware;` : ''}`;

  const uniqueNamespaces = Array.from(new Set(contentRawNamespaces.split('\n').map(l => l.trim()).filter(l => l.startsWith('using')))).join('\n');

  const content = `#pragma warning disable CA1416
${uniqueNamespaces}

var builder = WebApplication.CreateBuilder(args);

// Note: "AllowedHosts" is configured in appsettings.json. 
// By default it is set to "*" (all).
// We explicitly bind to all interfaces here to ensure accessibility (e.g. from LAN).
if (builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://*:${config.port};https://*:${config.port + 1}");
}
else
{
    builder.WebHost.UseUrls("http://*:${config.port}");
}

builder.Services.AddControllers().AddJsonOptions(options => { 
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles; 
    options.JsonSerializerOptions.Converters.Add(new SafeDateTimeConverter());
    options.JsonSerializerOptions.Converters.Add(new SafeNullableDateTimeConverter());
});
${config.multiTenancy?.enabled ? `builder.Services.AddScoped<ITenantService, TenantService>();` : ''}

${dbConfigCode}
${swaggerSetup}

builder.Services.AddQuartz();
builder.Services.AddQuartzHostedService(opt => { opt.WaitForJobsToComplete = true; });

${authServices}

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
        DbInitializer.Initialize(context);
    } catch (Exception ex) {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "DB Init Error");
    }
}

${swaggerUse}
${isBlazor ? 'app.UseBlazorFrameworkFiles();' : ''}
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
${config.multiTenancy?.enabled ? `app.UseMiddleware<TenantMiddleware>();` : ''}

// CORS Config
${corsPolicy}

${authAppUse}
app.MapControllers();
${isBlazor ? 'app.MapFallbackToFile("index.html");' : 'app.MapFallbackToFile("index.html");'}

app.Run();${bypassMiddlewareSection}

#region Safe DateTime Converters
public class SafeDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            string? val = reader.GetString();
            if (string.IsNullOrEmpty(val))
            {
                return DateTime.MinValue;
            }
            if (DateTime.TryParse(val, out DateTime dt))
            {
                return dt;
            }
        }
        return reader.GetDateTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString("o"));
    }
}

public class SafeNullableDateTimeConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }
        if (reader.TokenType == JsonTokenType.String)
        {
            string? val = reader.GetString();
            if (string.IsNullOrEmpty(val))
            {
                return null;
            }
            if (DateTime.TryParse(val, out DateTime dt))
            {
                return dt;
            }
        }
        try {
            return reader.GetDateTime();
        } catch {
            return null;
        }
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value == null) writer.WriteNullValue();
        else writer.WriteStringValue(value.Value.ToString("o"));
    }
}
#endregion`;

  return { name: 'Program.cs', path: `${root}/Program.cs`, content: content, language: 'csharp' };
};
