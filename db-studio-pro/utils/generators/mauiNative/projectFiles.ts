import { Table, BackendConfig, VirtualFile } from '../../../types/index';
import { toCamelCase } from '../common';

export const generateMauiNativeProjectFiles = (
  tables: Table[],
  config: BackendConfig,
  namespace: string,
  root: string,
  targetFramework: string,
  version: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // 1. CSPROJ
  const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFrameworks>${targetFramework}-android;${targetFramework}-ios;${targetFramework}-maccatalyst</TargetFrameworks>
    ${targetFramework === 'net8.0' ? '<TargetFrameworks Condition="\'$(MSBuildProjectExtension)\' == \'.csproj\'">$(TargetFrameworks);net8.0-windows10.0.19041.0</TargetFrameworks>' : '<TargetFrameworks Condition="\'$(MSBuildProjectExtension)\' == \'.csproj\'">$(TargetFrameworks);net9.0-windows10.0.19041.0</TargetFrameworks>'}
    <!-- Platforms: Android, iOS, Mac Catalyst, Windows -->
    <OutputType>Exe</OutputType>
    <RootNamespace>${namespace}</RootNamespace>
    <UseMaui>true</UseMaui>
    <SingleProject>true</SingleProject>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>

    <!-- Display name -->
    <ApplicationTitle>${config.projectName}</ApplicationTitle>

    <!-- App Identifier -->
    <ApplicationId>com.companyname.${toCamelCase(config.projectName)}</ApplicationId>

    <!-- Versions -->
    <ApplicationDisplayVersion>1.0</ApplicationDisplayVersion>
    <ApplicationVersion>1</ApplicationVersion>

    <SupportedOSPlatformVersion Condition="'$(TargetFramework)' == '${targetFramework}-ios'">14.2</SupportedOSPlatformVersion>
    <SupportedOSPlatformVersion Condition="'$(TargetFramework)' == '${targetFramework}-maccatalyst'">14.0</SupportedOSPlatformVersion>
    <SupportedOSPlatformVersion Condition="'$(TargetFramework)' == '${targetFramework}-android'">21.0</SupportedOSPlatformVersion>
    <SupportedOSPlatformVersion Condition="'$(TargetFramework)' == 'net8.0-windows10.0.19041.0'">10.0.17763.0</SupportedOSPlatformVersion>
    <SupportedOSPlatformVersion Condition="'$(TargetFramework)' == 'net9.0-windows10.0.19041.0'">10.0.17763.0</SupportedOSPlatformVersion>
    <TargetPlatformMinVersion Condition="'$(TargetFramework)' == 'net8.0-windows10.0.19041.0'">10.0.17763.0</TargetPlatformMinVersion>
    <TargetPlatformMinVersion Condition="'$(TargetFramework)' == 'net9.0-windows10.0.19041.0'">10.0.17763.0</TargetPlatformMinVersion>
  </PropertyGroup>

  <ItemGroup>
    <!-- App Icon -->
    <MauiIcon Include="Resources\\AppIcon\\appicon.svg" ForegroundFile="Resources\\AppIcon\\appiconfg.svg" Color="#512BD4" />

    <!-- Splash Screen -->
    <MauiSplashScreen Include="Resources\\Splash\\splash.svg" Color="#512BD4" BaseSize="128,128" />

    <!-- Images -->
    <MauiImage Include="Resources\\Images\\*" />

    <!-- Custom Fonts -->
    <MauiFont Include="Resources\\Fonts\\*" />

    <!-- Raw Assets (such as HTML/CSS/JS) -->
    <MauiAsset Include="Resources\\Raw\\*" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Maui.Controls" Version="$(MauiVersion)" />
    <PackageReference Include="Microsoft.Maui.Controls.Compatibility" Version="$(MauiVersion)" />
    <PackageReference Include="Microsoft.Extensions.Logging.Debug" Version="${version}.0" Condition="'$(Configuration)' == 'Debug'" />
  </ItemGroup>

</Project>`;
  files.push({ name: `${namespace}.csproj`, path: `${root}/${namespace}.csproj`, content: csprojContent, language: 'xml' });

  // 2. MauiProgram.cs
  const mauiProgramContent = `using Microsoft.Extensions.Logging;
using ${namespace}.Services;
using ${namespace}.Views;

namespace ${namespace};

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
            });

#if DEBUG
        builder.Logging.AddDebug();
#endif

        // Dynamic API BaseUri Config
        builder.Services.AddScoped(sp => 
        {
            return new HttpClient { BaseAddress = new Uri("http://localhost:${config.port}/api/") };
        });

        // Register Repository Services
        builder.Services.AddSingleton<JsonFileStorageService>();
        builder.Services.AddScoped<ApiService>();

        // Register StorageServiceManager to dynamically swap storage at runtime
        builder.Services.AddSingleton<StorageServiceManager>();

        // Register Views & Pages for DI
        builder.Services.AddTransient<DashboardPage>();
        ${tables.map(t => `builder.Services.AddTransient<${t.name}ListPage>();`).join('\n        ')}

        return builder.Build();
    }
}`;
  files.push({ name: 'MauiProgram.cs', path: `${root}/MauiProgram.cs`, content: mauiProgramContent, language: 'csharp' });

  // 3. App.xaml & App.xaml.cs
  files.push({
      name: 'App.xaml',
      path: `${root}/App.xaml`,
      content: `<Application xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:${namespace}"
             x:Class="${namespace}.App">
    <Application.Resources>
        <ResourceDictionary>
        </ResourceDictionary>
    </Application.Resources>
</Application>`,
      language: 'xml'
  });

  files.push({
      name: 'App.xaml.cs',
      path: `${root}/App.xaml.cs`,
      content: `namespace ${namespace};

public partial class App : Application
{
    public App()
    {
        InitializeComponent();

        MainPage = new AppShell();
    }
}`,
      language: 'csharp'
  });

  // 12. APIs.md specifications documentation
  const apisMdContent = `# .NET MAUI Native - API & Storage-Spezifikation

Dieses Dokument beschreibt die Architektur und Datenhaltung der cross-platform **.NET MAUI Native** Applikation.

## Architekturübersicht

Die App ist nach dem **Repository-Muster** (über das C#-Interface \`IStorageService\`) strukturiert. Dadurch wird die UI-Schicht vollständig von der Datenhaltung entkoppelt:

1. **\`IStorageService.cs\`**: Definiert generische CRUD-Schnittstellen für Tabellen.
2. **\`JsonFileStorageService.cs\`**: Speichert alle Datensätze lokal im Anwendungsdaten-Verzeichnis (\`FileSystem.AppDataDirectory\`) als JSON-Dateien. Dies ist komplett offline-fähig und extrem robust.
3. **\`ApiService.cs\`**: Implementiert dieselbe Schnittstelle über HTTP-Verbindungen zum REST-API-Backend.

---

## Datenquellen-Umschaltung zur Laufzeit

Der \`StorageServiceManager\` ermöglicht das Umschalten der Datenquelle zur Laufzeit über den Dashboard-Umschalter:

- **Offline-Modus**: Daten werden in der lokalen JSON-Datei gespeichert. Perfekt für den mobilen Betrieb ohne Internet.
- **Online-Modus**: Daten werden mit dem Server-Backend synchronisiert, um sie auf einer zentralen relationalen SQL-Datenbank abzuspeichern.

---

## Technische Details

- **Tabellen**: ${tables.map(t => `\\\`${t.name}\\\``).join(', ')}
`;

  files.push({
      name: 'APIs.md',
      path: `${root}/APIs.md`,
      content: apisMdContent,
      language: 'markdown'
  });

  // --- ADD DUMMY SVG RESOURCE FILES ---
  const dummySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#512BD4" />
</svg>`;

  files.push({
      name: 'appicon.svg',
      path: `${root}/Resources/AppIcon/appicon.svg`,
      content: dummySvg,
      language: 'xml'
  });
  files.push({
      name: 'appiconfg.svg',
      path: `${root}/Resources/AppIcon/appiconfg.svg`,
      content: dummySvg,
      language: 'xml'
  });
  files.push({
      name: 'splash.svg',
      path: `${root}/Resources/Splash/splash.svg`,
      content: dummySvg,
      language: 'xml'
  });

  // --- PLATFORM FILES (ANDROID, IOS, MACCATALYST, WINDOWS) ---

  // Android
  files.push({
      name: 'AndroidManifest.xml',
      path: `${root}/Platforms/Android/AndroidManifest.xml`,
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
	<application android:allowBackup="true" android:icon="@mipmap/appicon" android:roundIcon="@mipmap/appicon_round" android:supportsRtl="true"></application>
	<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
	<uses-permission android:name="android.permission.INTERNET" />
</manifest>`,
      language: 'xml'
  });

  files.push({
      name: 'MainActivity.cs',
      path: `${root}/Platforms/Android/MainActivity.cs`,
      content: `using Android.App;
using Android.Content.PM;
using Android.OS;

namespace ${namespace};

[Activity(Theme = "@style/Maui.SplashTheme", MainLauncher = true, ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation | ConfigChanges.UiMode | ConfigChanges.ScreenLayout | ConfigChanges.SmallestScreenSize | ConfigChanges.Density)]
public class MainActivity : MauiAppCompatActivity
{
}`,
      language: 'csharp'
  });

  files.push({
      name: 'MainApplication.cs',
      path: `${root}/Platforms/Android/MainApplication.cs`,
      content: `using Android.App;
using Android.Runtime;

namespace ${namespace};

[Application]
public class MainApplication : MauiApplication
{
	public MainApplication(IntPtr handle, JniHandleOwnership ownership)
		: base(handle, ownership)
	{
	}

	protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}`,
      language: 'csharp'
  });

  // iOS
  files.push({
      name: 'AppDelegate.cs',
      path: `${root}/Platforms/iOS/AppDelegate.cs`,
      content: `using Foundation;

namespace ${namespace};

[Register("AppDelegate")]
public class AppDelegate : MauiUIApplicationDelegate
{
	protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}`,
      language: 'csharp'
  });

  files.push({
      name: 'Info.plist',
      path: `${root}/Platforms/iOS/Info.plist`,
      content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>UIDeviceFamily</key>
	<array>
		<integer>1</integer>
		<integer>2</integer>
	</array>
	<key>UIRequiredDeviceCapabilities</key>
	<array>
		<string>arm64</string>
	</array>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UISupportedInterfaceOrientations~ipad</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationPortraitUpsideDown</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>XSAppIconAssets</key>
	<string>Assets.xcassets/AppIcon.appiconset</string>
</dict>
</plist>`,
      language: 'xml'
  });

  // MacCatalyst
  files.push({
      name: 'AppDelegate.cs',
      path: `${root}/Platforms/MacCatalyst/AppDelegate.cs`,
      content: `using Foundation;

namespace ${namespace};

[Register("AppDelegate")]
public class AppDelegate : MauiUIApplicationDelegate
{
	protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}`,
      language: 'csharp'
  });

  files.push({
      name: 'Info.plist',
      path: `${root}/Platforms/MacCatalyst/Info.plist`,
      content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>UIDeviceFamily</key>
	<array>
		<integer>2</integer>
	</array>
	<key>UIRequiredDeviceCapabilities</key>
	<array>
		<string>arm64</string>
	</array>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>XSAppIconAssets</key>
	<string>Assets.xcassets/AppIcon.appiconset</string>
</dict>
</plist>`,
      language: 'xml'
  });

  // Windows
  files.push({
      name: 'App.xaml',
      path: `${root}/Platforms/Windows/App.xaml`,
      content: `<maui:MauiWinUIApplication
    x:Class="${namespace}.WinUI.App"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:maui="using:Microsoft.Maui">

</maui:MauiWinUIApplication>`,
      language: 'xml'
  });

  files.push({
      name: 'App.xaml.cs',
      path: `${root}/Platforms/Windows/App.xaml.cs`,
      content: `using Microsoft.Maui;
using Microsoft.Maui.Hosting;

namespace ${namespace}.WinUI;

public partial class App : MauiWinUIApplication
{
	public App()
	{
		this.InitializeComponent();
	}

	protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}`,
      language: 'csharp'
  });

  files.push({
      name: 'Package.appxmanifest',
      path: `${root}/Platforms/Windows/Package.appxmanifest`,
      content: `<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap rescap">

  <Identity
    Name="com.companyname.${toCamelCase(config.projectName).toLowerCase()}"
    Publisher="CN=CompanyName"
    Version="1.0.0.0" />

  <Properties>
    <DisplayName>${config.projectName}</DisplayName>
    <PublisherDisplayName>CompanyName</PublisherDisplayName>
    <Logo>Images\\StoreLogo.png</Logo>
  </Properties>

  <Dependencies>
    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.17763.0" MaxVersionTested="10.0.19041.0" />
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.19041.0" />
  </Dependencies>

  <Resources>
    <Resource Language="x-generate"/>
  </Resources>

  <Applications>
    <Application Id="App"
      Executable="$targetnametoken$.exe"
      EntryPoint="$targetentrypoint$">
      <uap:VisualElements
        DisplayName="${config.projectName}"
        Description="${config.projectName}"
        BackgroundColor="transparent"
        Square150x150Logo="Images\\Square150x150Logo.png"
        Square44x44Logo="Images\\Square44x44Logo.png">
        <uap:DefaultTile Wide310x150Logo="Images\\Wide310x150Logo.png" />
        <uap:SplashScreen Image="Images\\SplashScreen.png" />
      </uap:VisualElements>
    </Application>
  </Applications>

  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>

</Package>`,
      language: 'xml'
  });

  // --- LAUNCH SETTINGS FOR WINDOWS DEPLOYMENT (MSIX) ---
  files.push({
      name: 'launchSettings.json',
      path: `${root}/Properties/launchSettings.json`,
      content: `{
  "profiles": {
    "Windows Machine": {
      "commandName": "MsixPackage",
      "nativeDebugging": false
    }
  }
}`,
      language: 'json'
  });

  return files;
};
