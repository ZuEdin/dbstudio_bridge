using System.Diagnostics;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Port auf 5050 setzen
builder.WebHost.UseUrls("http://0.0.0.0:5050");

var app = builder.Build();

// 1. CORS & Chrome Private Network Access (PNA) Middleware
app.Use(async (context, next) =>
{
    var origin = context.Request.Headers["Origin"].ToString();
    context.Response.Headers.Append("Access-Control-Allow-Origin", string.IsNullOrEmpty(origin) ? "*" : origin);
    context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    context.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Bridge-Token, Access-Control-Request-Private-Network, *");
    context.Response.Headers.Append("Access-Control-Allow-Private-Network", "true");
    context.Response.Headers.Append("Access-Control-Allow-Credentials", "true");

    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        return;
    }

    await next();
});

app.UseWebSockets();

// Basis-Ordner
var baseProjectsDir = Path.Combine(Directory.GetCurrentDirectory(), "Projects");
Directory.CreateDirectory(baseProjectsDir);

// 2. Health & Status Endpunkt
app.MapGet("/api/status", () =>
{
    return Results.Ok(new
    {
        status = "online",
        version = "1.0.0",
        bridgeType = "CSharp_DotNet10_Bridge",
        osPlatform = Environment.OSVersion.ToString(),
        runtimes = new
        {
            dotnetSdk = new { installed = true, version = Environment.Version.ToString() },
            nodejs = new { installed = CheckCliAvailable("node") }
        },
        bridgePort = 5050,
        projectsDir = baseProjectsDir
    });
});

// 3. Deploy Endpunkt (Empfängt Code & startet Prozess)
app.MapPost("/api/deploy", async (HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var body = await reader.ReadToEndAsync();
    using var doc = JsonDocument.Parse(body);
    
    var root = doc.RootElement;
    var projectId = root.TryGetProperty("projectId", out var pid) ? pid.GetString() : "Project_" + DateTime.Now.Ticks;
    var projectDir = Path.Combine(baseProjectsDir, projectId!);
    Directory.CreateDirectory(projectDir);

    // Dateien schreiben
    if (root.TryGetProperty("files", out var files))
    {
        foreach (var file in files.EnumerateArray())
        {
            var relativePath = file.GetProperty("path").GetString()!;
            var content = file.GetProperty("content").GetString()!;
            var fullPath = Path.Combine(projectDir, relativePath);
            
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
            await File.WriteAllTextAsync(fullPath, content);
        }
    }

    // Automatischer Start (z. B. dotnet run oder npm run dev)
    var startCmd = root.TryGetProperty("startCommand", out var sc) ? sc.GetString() : "dotnet run";
    Console.WriteLine($"[C# Bridge] Starte Projekt '{projectId}' mit Befehl: {startCmd} in {projectDir}");

    // Prozess im Hintergrund starten
    _ = Task.Run(() => StartProcess(projectDir, startCmd!));

    return Results.Ok(new
    {
        success = true,
        projectId,
        message = $"Projekt '{projectId}' erfolgreich in .NET Bridge empfangen und gestartet!"
    });
});

// 4. WebSocket Live Terminal Streaming
app.Map("/logs", async (HttpContext context) =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        var buffer = new byte[1024 * 4];
        
        var welcomeMsg = Encoding.UTF8.GetBytes("[C# Bridge Live Terminal] Verbunden mit .NET Daemon...\n");
        await webSocket.SendAsync(new ArraySegment<byte>(welcomeMsg), WebSocketMessageType.Text, true, CancellationToken.None);

        while (webSocket.State == WebSocketState.Open)
        {
            await Task.Delay(1000);
        }
    }
    else
    {
        context.Response.StatusCode = 400;
    }
});

Console.WriteLine("=================================================");
Console.WriteLine("🚀 DB Studio C# .NET 10 Bridge läuft auf Port 5050");
Console.WriteLine("=================================================");

app.Run();

static bool CheckCliAvailable(string cmd)
{
    try
    {
        var p = Process.Start(new ProcessStartInfo { FileName = cmd, Arguments = "--version", RedirectStandardOutput = true, UseShellExecute = false });
        p?.WaitForExit();
        return true;
    }
    catch { return false; }
}

static void StartProcess(string dir, string command)
{
    try
    {
        var psi = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = $"/C {command}",
            WorkingDirectory = dir,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };
        var process = Process.Start(psi);
        process?.WaitForExit();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Fehler beim Starten: {ex.Message}");
    }
}
