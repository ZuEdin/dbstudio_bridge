import { Table, BackendConfig, VirtualFile } from '../../../types/index';
import { toPascalCase, toCamelCase, resolveType } from '../common';

export const generateMauiNativeViews = (
  tables: Table[],
  config: BackendConfig,
  namespace: string,
  root: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // 1. AppShell.xaml & AppShell.xaml.cs
  const shellItems = tables.map(t => {
    const className = toPascalCase(t.name);
    return `    <ShellContent
        Title="${t.name}"
        ContentTemplate="{DataTemplate views:${className}ListPage}"
        Route="${toCamelCase(t.name)}" />`;
  }).join('\n');

  const appShellXaml = `<Shell
    x:Class="${namespace}.AppShell"
    xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
    xmlns:views="clr-namespace:${namespace}.Views"
    Shell.FlyoutBehavior="Flyout"
    Title="${config.projectName} MAUI Native">

    <Shell.FlyoutHeader>
        <Grid BackgroundColor="#512BD4" HeightRequest="150" Padding="20">
            <VerticalStackLayout VerticalOptions="End">
                <Label Text="${config.projectName}" FontSize="24" TextColor="White" FontAttributes="Bold" />
                <Label Text="Native .NET MAUI App" FontSize="14" TextColor="#D1C4E9" />
            </VerticalStackLayout>
        </Grid>
    </Shell.FlyoutHeader>

    <ShellContent
        Title="Dashboard"
        ContentTemplate="{DataTemplate views:DashboardPage}"
        Route="dashboard" />

${shellItems}

</Shell>`;

  const appShellCs = `using Microsoft.Maui.Controls;

namespace ${namespace}
{
    public partial class AppShell : Shell
    {
        public AppShell()
        {
            InitializeComponent();
        }
    }
}`;
  files.push({ name: 'AppShell.xaml', path: `${root}/AppShell.xaml`, content: appShellXaml, language: 'xml' });
  files.push({ name: 'AppShell.xaml.cs', path: `${root}/AppShell.xaml.cs`, content: appShellCs, language: 'csharp' });

  // 2. DashboardPage (MainPage replacement / starting screen)
  let dashboardCards = '';
  tables.forEach(t => {
      const className = toPascalCase(t.name);
      dashboardCards += `
                <Border StrokeShape="RoundRectangle 8" BackgroundColor="White" Padding="15" Margin="0,0,0,10">
                    <Grid ColumnDefinitions="*, Auto">
                        <VerticalStackLayout Grid.Column="0">
                            <Label Text="${t.name}" FontSize="18" FontAttributes="Bold" TextColor="#2C3E50" />
                            <Label Text="Tabellen-Einträge verwalten" FontSize="12" TextColor="Gray" />
                        </VerticalStackLayout>
                        <Button Grid.Column="1" Text="Öffnen" Command="{Binding NavigateTo${className}Command}" BackgroundColor="#512BD4" TextColor="White" HeightRequest="40" VerticalOptions="Center" />
                    </Grid>
                </Border>`;
  });

  const dashboardPageXaml = `<ContentPage
    x:Class="${namespace}.Views.DashboardPage"
    xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
    Title="Dashboard"
    BackgroundColor="#F4F6F9">

    <ScrollView>
        <VerticalStackLayout Padding="20" Spacing="15">
            <Border StrokeShape="RoundRectangle 12" BackgroundColor="White" Padding="20" StrokeThickness="0">
                <VerticalStackLayout Spacing="10">
                    <Label Text="Willkommen bei ${config.projectName}" FontSize="26" FontAttributes="Bold" TextColor="#512BD4" />
                    <Label Text="Diese cross-platform Client-App läuft vollkommen nativ auf Ihrem Gerät unter Verwendung von .NET MAUI XAML Steuerelementen." FontSize="14" TextColor="#555" />
                    
                    <BoxView HeightRequest="1" BackgroundColor="#E0E0E0" Margin="0,10" />

                    <Grid ColumnDefinitions="*, *" ColumnSpacing="15">
                        <VerticalStackLayout Grid.Column="0" Spacing="5">
                            <Label Text="Offline-First Modus" FontAttributes="Bold" FontSize="16" TextColor="#27AE60" />
                            <Label Text="Daten werden standardmäßig lokal in einer performanten, offline-fähigen JSON-Datei abgespeichert." FontSize="12" TextColor="Gray" />
                        </VerticalStackLayout>
                        <VerticalStackLayout Grid.Column="1" Spacing="5">
                            <Label Text="Schnittstellen-Umschalter" FontAttributes="Bold" FontSize="16" TextColor="#2980B9" />
                            <Label Text="Unten können Sie die Schnittstelle jederzeit auf Online (REST API) oder Offline umschalten." FontSize="12" TextColor="Gray" />
                        </VerticalStackLayout>
                    </Grid>
                </VerticalStackLayout>
            </Border>

            <!-- Storage Selection Control -->
            <Border StrokeShape="RoundRectangle 8" BackgroundColor="#EAECEE" Padding="15">
                <Grid ColumnDefinitions="*, Auto" RowDefinitions="Auto, Auto">
                    <VerticalStackLayout Grid.Column="0">
                        <Label Text="Datenquelle auswählen" FontAttributes="Bold" FontSize="14" TextColor="#2C3E50" />
                        <Label x:Name="StatusLabel" Text="Aktiver Modus: Offline" FontSize="12" TextColor="Gray" />
                    </VerticalStackLayout>
                    <HorizontalStackLayout Grid.Column="1" Spacing="10" VerticalOptions="Center">
                        <Button x:Name="BtnOffline" Text="Offline (Lokal)" Clicked="OnOfflineClicked" BackgroundColor="#27AE60" TextColor="White" />
                        <Button x:Name="BtnOnline" Text="Online (API)" Clicked="OnOnlineClicked" BackgroundColor="Gray" TextColor="White" />
                    </HorizontalStackLayout>
                </Grid>
            </Border>

            <Label Text="Verfügbare Tabellen" FontSize="20" FontAttributes="Bold" TextColor="#2C3E50" Margin="0,10,0,0" />

            ${dashboardCards}

        </VerticalStackLayout>
    </ScrollView>
</ContentPage>`;

  const dashboardPageCs = `using System;
using Microsoft.Maui.Controls;
using ${namespace}.Services;

namespace ${namespace}.Views
{
    public partial class DashboardPage : ContentPage
    {
        private readonly StorageServiceManager _storageManager;

        public DashboardPage()
        {
            InitializeComponent();
            _storageManager = Handler?.MauiContext?.Services.GetService<StorageServiceManager>() 
                ?? App.Current?.Handler?.MauiContext?.Services.GetService<StorageServiceManager>()!;
            
            UpdateStatusUI();
        }

        protected override void OnAppearing()
        {
            base.OnAppearing();
            UpdateStatusUI();
        }

        private void OnOfflineClicked(object sender, EventArgs e)
        {
            _storageManager.SetStorageType("Offline");
            UpdateStatusUI();
        }

        private void OnOnlineClicked(object sender, EventArgs e)
        {
            _storageManager.SetStorageType("API");
            UpdateStatusUI();
        }

        private void UpdateStatusUI()
        {
            if (_storageManager == null) return;
            StatusLabel.Text = $"Aktiver Modus: {_storageManager.CurrentService.BackendName}";
            
            if (_storageManager.CurrentService is JsonFileStorageService)
            {
                BtnOffline.BackgroundColor = Color.FromArgb("#27AE60");
                BtnOnline.BackgroundColor = Color.FromArgb("#BDC3C7");
            }
            else
            {
                BtnOffline.BackgroundColor = Color.FromArgb("#BDC3C7");
                BtnOnline.BackgroundColor = Color.FromArgb("#2980B9");
            }
        }

        ${tables.map(t => `
        private async void NavigateTo${toPascalCase(t.name)}Command(object sender, EventArgs e)
        {
            await Shell.Current.GoToAsync("//${toCamelCase(t.name)}");
        }`).join('\n')}
    }
}`;

  files.push({ name: 'DashboardPage.xaml', path: `${root}/Views/DashboardPage.xaml`, content: dashboardPageXaml, language: 'xml' });
  files.push({ name: 'DashboardPage.xaml.cs', path: `${root}/Views/DashboardPage.xaml.cs`, content: dashboardPageCs, language: 'csharp' });

  // 3. Table Pages (List and Detail views for each table!)
  tables.forEach(table => {
      const className = toPascalCase(table.name);
      
      // Detail Page Form inputs
      let entryInputs = '';
      let saveBindings = '';
      let loadFields = '';

      table.fields.forEach(f => {
          const propName = toPascalCase(f.name);
          if (f.isPrimaryKey) {
              entryInputs += `            <Label Text="${propName} (Primärschlüssel)" FontSize="12" TextColor="Gray" />
            <Entry x:Name="Txt${propName}" IsReadOnly="True" Margin="0,0,0,15" BackgroundColor="#EAECEE" />\n`;
              loadFields += `            Txt${propName}.Text = Item != null ? Item.${propName}.ToString() : "0";\n`;
          } else {
              if (f.type === 'BOOLEAN') {
                  entryInputs += `            <HorizontalStackLayout Spacing="10" Margin="0,0,0,15">
                <CheckBox x:Name="Chk${propName}" />
                <Label Text="${propName}" VerticalOptions="Center" />
            </HorizontalStackLayout>\n`;
                  loadFields += `            Chk${propName}.IsChecked = Item != null && Item.${propName};\n`;
                  saveBindings += `            Item.${propName} = Chk${propName}.IsChecked;\n`;
              } else if (f.type === 'INTEGER' || f.type === 'DOUBLE' || f.type === 'DECIMAL') {
                  entryInputs += `            <Label Text="${propName}" FontSize="12" TextColor="Gray" />
            <Entry x:Name="Txt${propName}" Keyboard="Numeric" Margin="0,0,0,15" />\n`;
                  loadFields += `            Txt${propName}.Text = Item != null ? Item.${propName}.ToString() : "0";\n`;
                  saveBindings += `            Item.${propName} = ${resolveType(f, 'csharp')}.Parse(Txt${propName}.Text ?? "0");\n`;
              } else if (f.type === 'DATE' || f.type === 'DATETIME') {
                  entryInputs += `            <Label Text="${propName}" FontSize="12" TextColor="Gray" />
            <DatePicker x:Name="Dp${propName}" Margin="0,0,0,15" />\n`;
                  loadFields += `            Dp${propName}.Date = Item != null ? Item.${propName} : DateTime.Now;\n`;
                  saveBindings += `            Item.${propName} = Dp${propName}.Date;\n`;
              } else {
                  entryInputs += `            <Label Text="${propName}" FontSize="12" TextColor="Gray" />
            <Entry x:Name="Txt${propName}" Margin="0,0,0,15" />\n`;
                  loadFields += `            Txt${propName}.Text = Item != null ? Item.${propName} : "";\n`;
                  saveBindings += `            Item.${propName} = Txt${propName}.Text ?? "";\n`;
              }
          }
      });

      // Data Template inside CollectionView
      const colItems = table.fields.map(f => {
          const propName = toPascalCase(f.name);
          return `<Label Text="${propName}: {Binding ${propName}}" FontSize="14" TextColor="#2C3E50" />`;
      }).join('\n                        ');

      const listXaml = `<ContentPage
    x:Class="${namespace}.Views.${className}ListPage"
    xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
    Title="${table.name} List"
    BackgroundColor="#F4F6F9">

    <Grid RowDefinitions="Auto, *">
        <!-- Top Toolbar -->
        <Border Grid.Row="0" StrokeShape="RoundRectangle 0" BackgroundColor="White" Padding="15" StrokeThickness="0">
            <Grid ColumnDefinitions="*, Auto">
                <VerticalStackLayout Grid.Column="0">
                    <Label Text="${table.name} Einträge" FontSize="20" FontAttributes="Bold" TextColor="#512BD4" />
                    <Label x:Name="SourceLabel" Text="Schnittstelle: Offline" FontSize="11" TextColor="Gray" />
                </VerticalStackLayout>
                <Button Grid.Column="1" Text="+ Neu" Clicked="OnAddClicked" BackgroundColor="#512BD4" TextColor="White" HeightRequest="40" />
            </Grid>
        </Border>

        <!-- List View -->
        <CollectionView Grid.Row="1" x:Name="ItemsListView" Margin="15">
            <CollectionView.ItemTemplate>
                <DataTemplate>
                    <Border StrokeShape="RoundRectangle 8" BackgroundColor="White" Padding="15" Margin="0,0,0,10" StrokeThickness="0">
                        <Grid ColumnDefinitions="*, Auto">
                            <VerticalStackLayout Grid.Column="0" Spacing="5">
                                ${colItems}
                            </VerticalStackLayout>
                            <HorizontalStackLayout Grid.Column="1" Spacing="5" VerticalOptions="Center">
                                <Button Text="Edit" Clicked="OnEditClicked" CommandParameter="{Binding .}" BackgroundColor="#F39C12" TextColor="White" HeightRequest="35" WidthRequest="60" />
                                <Button Text="Löschen" Clicked="OnDeleteClicked" CommandParameter="{Binding .}" BackgroundColor="#E74C3C" TextColor="White" HeightRequest="35" WidthRequest="80" />
                            </HorizontalStackLayout>
                        </Grid>
                    </Border>
                </DataTemplate>
            </CollectionView.ItemTemplate>
        </CollectionView>
    </Grid>
</ContentPage>`;

      const listCs = `using System;
using System.Collections.Generic;
using Microsoft.Maui.Controls;
using ${namespace}.Models;
using ${namespace}.Services;

namespace ${namespace}.Views
{
    public partial class ${className}ListPage : ContentPage
    {
        private readonly StorageServiceManager _storageManager;

        public ${className}ListPage()
        {
            InitializeComponent();
            _storageManager = App.Current?.Handler?.MauiContext?.Services.GetService<StorageServiceManager>()!;
        }

        protected override async void OnAppearing()
        {
            base.OnAppearing();
            await RefreshData();
        }

        private async Task RefreshData()
        {
            SourceLabel.Text = $"Datenquelle: {_storageManager.CurrentService.BackendName}";
            try
            {
                var list = await _storageManager.CurrentService.GetAll<${className}>("${table.name}");
                ItemsListView.ItemsSource = list;
            }
            catch (Exception ex)
            {
                await DisplayAlert("Fehler", $"Fehler beim Laden: {ex.Message}", "OK");
            }
        }

        private async void OnAddClicked(object sender, EventArgs e)
        {
            var detailPage = new ${className}DetailPage(null);
            await Navigation.PushModalAsync(detailPage);
        }

        private async void OnEditClicked(object sender, EventArgs e)
        {
            var button = (Button)sender;
            var item = (${className})button.CommandParameter;
            var detailPage = new ${className}DetailPage(item);
            await Navigation.PushModalAsync(detailPage);
        }

        private async void OnDeleteClicked(object sender, EventArgs e)
        {
            var button = (Button)sender;
            var item = (${className})button.CommandParameter;
            bool confirm = await DisplayAlert("Löschen", "Möchten Sie diesen Eintrag wirklich löschen?", "Ja", "Nein");
            if (confirm)
            {
                var idProp = typeof(${className}).GetProperty("Id") ?? typeof(${className}).GetProperty("id");
                var idVal = idProp?.GetValue(item) ?? 0;
                await _storageManager.CurrentService.Delete("${table.name}", idVal);
                await RefreshData();
            }
        }
    }
}`;

      const detailXaml = `<ContentPage
    x:Class="${namespace}.Views.${className}DetailPage"
    xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
    Title="Eintrag Details"
    BackgroundColor="#F4F6F9">

    <ScrollView>
        <VerticalStackLayout Padding="20" Spacing="15">
            <Label x:Name="TitleLabel" Text="Details" FontSize="22" FontAttributes="Bold" TextColor="#512BD4" />

            <Border StrokeShape="RoundRectangle 8" BackgroundColor="White" Padding="20" StrokeThickness="0">
                <VerticalStackLayout>
                    ${entryInputs}
                </VerticalStackLayout>
            </Border>

            <Grid ColumnDefinitions="*, *" ColumnSpacing="15">
                <Button Grid.Column="0" Text="Abbrechen" Clicked="OnCancelClicked" BackgroundColor="Gray" TextColor="White" />
                <Button Grid.Column="1" Text="Speichern" Clicked="OnSaveClicked" BackgroundColor="#27AE60" TextColor="White" />
            </Grid>
        </VerticalStackLayout>
    </ScrollView>
</ContentPage>`;

      const detailCs = `using System;
using Microsoft.Maui.Controls;
using ${namespace}.Models;
using ${namespace}.Services;

namespace ${namespace}.Views
{
    public partial class ${className}DetailPage : ContentPage
    {
        private readonly StorageServiceManager _storageManager;
        public ${className} Item { get; private set; }
        public bool IsNew { get; private set; }

        public ${className}DetailPage(${className}? item)
        {
            InitializeComponent();
            _storageManager = App.Current?.Handler?.MauiContext?.Services.GetService<StorageServiceManager>()!;
            
            if (item == null)
            {
                Item = new ${className}();
                IsNew = true;
                TitleLabel.Text = "Neuer Eintrag für ${table.name}";
            }
            else
            {
                Item = item;
                IsNew = false;
                TitleLabel.Text = "Eintrag bearbeiten";
            }

            LoadItemData();
        }

        private void LoadItemData()
        {
${loadFields}
        }

        private async void OnSaveClicked(object sender, EventArgs e)
        {
            try
            {
${saveBindings}
                if (IsNew)
                {
                    await _storageManager.CurrentService.Add("${table.name}", Item);
                }
                else
                {
                    var idProp = typeof(${className}).GetProperty("Id") ?? typeof(${className}).GetProperty("id");
                    var idVal = idProp?.GetValue(Item) ?? 0;
                    await _storageManager.CurrentService.Update("${table.name}", idVal, Item);
                }

                await Navigation.PopModalAsync();
            }
            catch (Exception ex)
            {
                await DisplayAlert("Fehler beim Speichern", ex.Message, "OK");
            }
        }

        private async void OnCancelClicked(object sender, EventArgs e)
        {
            await Navigation.PopModalAsync();
        }
    }
}`;

      files.push({ name: `${className}ListPage.xaml`, path: `${root}/Views/${className}ListPage.xaml`, content: listXaml, language: 'xml' });
      files.push({ name: `${className}ListPage.xaml.cs`, path: `${root}/Views/${className}ListPage.xaml.cs`, content: listCs, language: 'csharp' });
      files.push({ name: `${className}DetailPage.xaml`, path: `${root}/Views/${className}DetailPage.xaml`, content: detailXaml, language: 'xml' });
      files.push({ name: `${className}DetailPage.xaml.cs`, path: `${root}/Views/${className}DetailPage.xaml.cs`, content: detailCs, language: 'csharp' });
  });

  return files;
};
