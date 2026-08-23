import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Package, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Link2, 
  Sparkles, 
  FolderGit2, 
  Layers, 
  Terminal, 
  ShieldCheck,
  RotateCw,
  FolderOpen,
  ArrowUpCircle
} from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';
import { DependencyTarget, DirectoryDependenciesResponse, InstalledDependency } from '../../types/bridge';

const QUICK_PRESETS = [
  { name: 'axios', manager: 'npm', desc: 'HTTP-Client für API-Requests', isDev: false },
  { name: 'zod', manager: 'npm', desc: 'TypeScript-First Schema-Validierung', isDev: false },
  { name: 'lucide-react', manager: 'npm', desc: 'Modernes Icon-Set für React', isDev: false },
  { name: 'chart.js', manager: 'npm', desc: 'Diagramme & Visualisierungen', isDev: false },
  { name: 'recharts', manager: 'npm', desc: 'Deklarative React-Chart-Bibliothek', isDev: false },
  { name: 'clsx', manager: 'npm', desc: 'Utility für bedingte CSS-Klassennamen', isDev: false },
  { name: 'tailwind-merge', manager: 'npm', desc: 'Konfliktfreies Mergen von Tailwind-Klassen', isDev: false },
  { name: 'zustand', manager: 'npm', desc: 'Leichtgewichtiges React State Management', isDev: false },
  { name: 'date-fns', manager: 'npm', desc: 'Moderne Datums- & Zeit-Bibliothek', isDev: false },
  { name: 'framer-motion', manager: 'npm', desc: 'Fluid UI & Micro-Animationen', isDev: false },
  { name: 'Newtonsoft.Json', manager: 'nuget', desc: '.NET JSON Serializer & Tools', isDev: false },
  { name: 'Microsoft.EntityFrameworkCore.Sqlite', manager: 'nuget', desc: '.NET EF Core SQLite Provider', isDev: false }
];

export const DependenciesTab: React.FC = () => {
  const [targets, setTargets] = useState<DependencyTarget[]>([]);
  const [selectedTargetPath, setSelectedTargetPath] = useState<string>('');
  const [dependenciesData, setDependenciesData] = useState<DirectoryDependenciesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'production' | 'development' | 'nuget' | 'cargo'>('all');

  // Formular-State für manuelle Installation
  const [packageName, setPackageName] = useState('');
  const [packageVersion, setPackageVersion] = useState('');
  const [packageManager, setPackageManager] = useState<'npm' | 'nuget' | 'cargo'>('npm');
  const [isDevDependency, setIsDevDependency] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<{ success?: boolean; message?: string; output?: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRelinking, setIsRelinking] = useState(false);
  const [updatingPackages, setUpdatingPackages] = useState<Record<string, boolean>>({});
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);

  // Targets laden
  const loadTargets = async () => {
    setIsLoading(true);
    try {
      const list = await bridgeApi.getDependencyTargets();
      setTargets(list);
      if (list.length > 0 && !selectedTargetPath) {
        // Standard: Zentraler Shared Store oder erstes Projekt
        setSelectedTargetPath(list[0].path);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Dependencies für das aktuell ausgewählte Target laden
  const loadDependencies = async (targetPath: string) => {
    if (!targetPath) return;
    setIsLoading(true);
    try {
      const data = await bridgeApi.getDependencies(targetPath);
      setDependenciesData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
  }, []);

  useEffect(() => {
    if (selectedTargetPath) {
      loadDependencies(selectedTargetPath);
      setInstallStatus(null);
    }
  }, [selectedTargetPath]);

  // Manuelle Paketinstallation
  const handleInstallPackage = async (customPkg?: { name: string; manager: 'npm' | 'nuget' | 'cargo'; isDev?: boolean }) => {
    const pkgToInstall = customPkg ? customPkg.name : packageName.trim();
    const mgrToUse = customPkg ? customPkg.manager : packageManager;
    const isDevToUse = customPkg ? Boolean(customPkg.isDev) : isDevDependency;

    if (!pkgToInstall) {
      setInstallStatus({ success: false, message: 'Bitte geben Sie einen Paketnamen ein.' });
      return;
    }

    setIsInstalling(true);
    setInstallStatus({ message: `Installiere '${pkgToInstall}' via ${mgrToUse}...` });

    try {
      const res = await bridgeApi.installDependency({
        targetDir: selectedTargetPath,
        packageManager: mgrToUse,
        packageName: pkgToInstall,
        isDev: isDevToUse,
        version: customPkg ? undefined : packageVersion.trim()
      });

      if (res.success) {
        setInstallStatus({ success: true, message: res.message, output: res.output });
        setPackageName('');
        setPackageVersion('');
        await loadDependencies(selectedTargetPath);
      } else {
        setInstallStatus({ success: false, message: res.message || res.error, output: res.output });
      }
    } catch (e: any) {
      setInstallStatus({ success: false, message: `Fehler: ${e.message}` });
    } finally {
      setIsInstalling(false);
    }
  };

  // Paket deinstallieren
  const handleUninstall = async (pkg: InstalledDependency) => {
    if (!window.confirm(`Möchten Sie das Paket '${pkg.name}' wirklich deinstallieren?`)) {
      return;
    }

    setIsInstalling(true);
    setInstallStatus({ message: `Deinstalliere '${pkg.name}'...` });

    try {
      const res = await bridgeApi.uninstallDependency({
        targetDir: selectedTargetPath,
        packageManager: pkg.manager,
        packageName: pkg.name
      });

      if (res.success) {
        setInstallStatus({ success: true, message: res.message, output: res.output });
        await loadDependencies(selectedTargetPath);
      } else {
        setInstallStatus({ success: false, message: res.message || res.error, output: res.output });
      }
    } catch (e: any) {
      setInstallStatus({ success: false, message: `Fehler: ${e.message}` });
    } finally {
      setIsInstalling(false);
    }
  };

  // Einzelnes Paket auf Latest aktualisieren
  const handleUpdatePackage = async (pkg: InstalledDependency) => {
    setUpdatingPackages(prev => ({ ...prev, [pkg.name]: true }));
    setInstallStatus({ message: `Aktualisiere '${pkg.name}' auf die neueste Version...` });

    try {
      const res = await bridgeApi.updateDependency({
        targetDir: selectedTargetPath,
        packageManager: pkg.manager,
        packageName: pkg.name,
        isDev: pkg.type === 'development'
      });

      if (res.success) {
        setInstallStatus({ success: true, message: res.message, output: res.output });
        await loadDependencies(selectedTargetPath);
      } else {
        setInstallStatus({ success: false, message: res.message || res.error, output: res.output });
      }
    } catch (e: any) {
      setInstallStatus({ success: false, message: `Fehler: ${e.message}` });
    } finally {
      setUpdatingPackages(prev => ({ ...prev, [pkg.name]: false }));
    }
  };

  // Alle Pakete im Verzeichnis aktualisieren
  const handleUpdateAll = async () => {
    setIsUpdatingAll(true);
    setInstallStatus({ message: `Aktualisiere alle Pakete in '${selectedTargetPath}'...` });

    try {
      const res = await bridgeApi.updateAllDependencies({
        targetDir: selectedTargetPath,
        packageManager: packageManager
      });

      if (res.success) {
        setInstallStatus({ success: true, message: res.message, output: res.output });
        await loadDependencies(selectedTargetPath);
      } else {
        setInstallStatus({ success: false, message: res.message || res.error, output: res.output });
      }
    } catch (e: any) {
      setInstallStatus({ success: false, message: `Fehler: ${e.message}` });
    } finally {
      setIsUpdatingAll(false);
    }
  };

  // Vollständiger Restore / Alle neu installieren
  const handleRestoreAll = async () => {
    setIsRestoring(true);
    setInstallStatus({ message: `Führe vollständigen Dependency-Restore für Verzeichnis aus...` });

    try {
      const res = await bridgeApi.restoreDependencies({
        targetDir: selectedTargetPath,
        packageManager: packageManager
      });

      if (res.success) {
        setInstallStatus({ success: true, message: res.message, output: res.output });
        await loadDependencies(selectedTargetPath);
      } else {
        setInstallStatus({ success: false, message: res.message || res.error, output: res.output });
      }
    } catch (e: any) {
      setInstallStatus({ success: false, message: `Fehler: ${e.message}` });
    } finally {
      setIsRestoring(false);
    }
  };

  // Shared node_modules Symlink neu verknüpfen
  const handleRelink = async () => {
    setIsRelinking(true);
    try {
      const res = await bridgeApi.relinkNodeModules(selectedTargetPath);
      if (res.success) {
        setInstallStatus({ success: true, message: `Shared node_modules Symlink erfolgreich erstellt.` });
        await loadDependencies(selectedTargetPath);
      } else {
        setInstallStatus({ success: false, message: `Symlink-Fehler: ${res.error}` });
      }
    } catch (e: any) {
      setInstallStatus({ success: false, message: `Fehler: ${e.message}` });
    } finally {
      setIsRelinking(false);
    }
  };

  // Dokumentations-URL generieren
  const getDocUrl = (name: string, mgr: string) => {
    if (mgr === 'npm') return `https://www.npmjs.com/package/${name}`;
    if (mgr === 'nuget') return `https://www.nuget.org/packages/${name}`;
    if (mgr === 'cargo') return `https://crates.io/crates/${name}`;
    return '#';
  };

  // Alle Dependencies aus npm, nuget, cargo zusammenführen
  const allDeps: InstalledDependency[] = [];
  if (dependenciesData?.npm) {
    allDeps.push(...dependenciesData.npm.dependencies);
    allDeps.push(...dependenciesData.npm.devDependencies);
  }
  if (dependenciesData?.nuget) {
    allDeps.push(...dependenciesData.nuget.packages);
  }
  if (dependenciesData?.cargo) {
    allDeps.push(...dependenciesData.cargo.crates);
  }

  // Filterung anwenden
  const filteredDeps = allDeps.filter((dep) => {
    const matchesSearch = dep.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dep.version.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    if (filterType === 'production') return dep.type === 'production' && dep.manager === 'npm';
    if (filterType === 'development') return dep.type === 'development' && dep.manager === 'npm';
    if (filterType === 'nuget') return dep.manager === 'nuget';
    if (filterType === 'cargo') return dep.manager === 'cargo';
    return true;
  });

  const isSharedStore = targets.find(t => t.path === selectedTargetPath)?.type === 'global_shared';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#0E1526] to-[#0A0F1D] border border-slate-800/90 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/5 border border-emerald-500/30 text-emerald-400 glow-emerald">
                <Boxes className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Pakete & Dependency-Verwaltung
                <span className="text-xs font-mono uppercase bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  Offline & Extensible
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Verwalten und installieren Sie zusätzliche npm-Pakete, .NET NuGet-Libraries und Cargo Crates für Ihre Projekte oder den zentralen Shared Store.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => loadDependencies(selectedTargetPath)}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              title="Aktualisieren"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Aktualisieren</span>
            </button>
            <button
              onClick={handleUpdateAll}
              disabled={isUpdatingAll || isLoading}
              className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all glow-emerald shadow-sm"
              title="Alle Pakete in diesem Verzeichnis mit 1 Klick auf die neueste Version aktualisieren"
            >
              <ArrowUpCircle className={`w-3.5 h-3.5 ${isUpdatingAll ? 'animate-spin' : ''}`} />
              <span>{isUpdatingAll ? 'Aktualisiere...' : '1-Klick Update (Alle)'}</span>
            </button>
            <button
              onClick={handleRestoreAll}
              disabled={isRestoring || isLoading}
              className="flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              title="Alle Dependencies im Ordner neu installieren / reparieren"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
              <span>{isRestoring ? 'Wiederherstellen...' : 'Alle Restore / Sync'}</span>
            </button>
            {!isSharedStore && (
              <button
                onClick={handleRelink}
                disabled={isRelinking}
                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                title="Windows-Junction / Symlink zu Shared_Dependencies erneuern"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{isRelinking ? 'Verknüpfe...' : 'Symlink reparieren'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Target Selector & Environment Overview Card */}
      <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-emerald-400" />
              Aktives Ziel / Verzeichnis auswählen
            </label>
            <select
              value={selectedTargetPath}
              onChange={(e) => setSelectedTargetPath(e.target.value)}
              className="w-full bg-[#080D17] border border-slate-700/80 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            >
              {targets.map((t) => (
                <React.Fragment key={t.id}>
                  <option value={t.path}>{t.name} ({t.path})</option>
                  {t.subTargets?.map((st) => (
                    <option key={st.id} value={st.fullPath}>
                      &nbsp;&nbsp;↳ {st.name} ({st.subPath})
                    </option>
                  ))}
                </React.Fragment>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end pt-2">
            <div className="bg-[#080D17] px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono shadow-inner">
              <span className="text-slate-500">Gefundene Pakete: </span>
              <strong className="text-emerald-400 font-bold">{allDeps.length}</strong>
            </div>

            {dependenciesData?.npm?.isSymlinked && (
              <div className="bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-1.5 shadow-sm">
                <Link2 className="w-3.5 h-3.5" />
                <span>Shared Store verknüpft</span>
              </div>
            )}
          </div>
        </div>

        {/* Selected Path Badge */}
        <div className="bg-[#080D17] p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-400 flex items-center justify-between gap-2 truncate shadow-inner">
          <span className="truncate">📂 Aktiver Pfad: <strong className="text-slate-200 font-bold">{selectedTargetPath}</strong></span>
          <span className="text-[10px] text-slate-400 uppercase px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 shrink-0 font-semibold">
            {isSharedStore ? 'Zentraler Store' : 'Lokales Projekt'}
          </span>
        </div>
      </div>

      {/* Manual Install Section & Quick Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Manual Install Form */}
        <div className="lg:col-span-2 bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Neues Paket / Dependency manuell installieren
            </h3>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              npm • NuGet • Cargo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Package Manager Select */}
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Paketmanager</label>
              <select
                value={packageManager}
                onChange={(e) => setPackageManager(e.target.value as any)}
                className="w-full bg-[#080D17] border border-slate-700/80 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
              >
                <option value="npm">npm (Node/React/Tauri)</option>
                <option value="nuget">NuGet (.NET C#)</option>
                <option value="cargo">Cargo (Rust/Tauri)</option>
              </select>
            </div>

            {/* Package Name Input */}
            <div className="sm:col-span-6 space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Paket-Name</label>
              <input
                type="text"
                placeholder="z. B. axios, zod, recharts, Newtonsoft.Json"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleInstallPackage(); }}
                className="w-full bg-[#080D17] border border-slate-700/80 text-slate-100 text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 shadow-inner"
              />
            </div>

            {/* Version Input */}
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Version (opt.)</label>
              <input
                type="text"
                placeholder="z. B. ^1.6.0"
                value={packageVersion}
                onChange={(e) => setPackageVersion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleInstallPackage(); }}
                className="w-full bg-[#080D17] border border-slate-700/80 text-slate-100 text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {packageManager === 'npm' ? (
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDevDependency}
                  onChange={(e) => setIsDevDependency(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Als Dev-Dependency speichern (<code className="text-emerald-400 font-mono">--save-dev</code>)</span>
              </label>
            ) : <div />}

            <button
              onClick={() => handleInstallPackage()}
              disabled={isInstalling || !packageName.trim()}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/50"
            >
              {isInstalling ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{isInstalling ? 'Installiere...' : 'Paket installieren'}</span>
            </button>
          </div>

          {/* Execution Status / Log Output Banner */}
          {installStatus && (
            <div className={`p-3.5 rounded-xl border text-xs font-mono transition-all shadow-sm ${
              installStatus.success === true
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : installStatus.success === false
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                {installStatus.success === true ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : installStatus.success === false ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <RotateCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                )}
                <span>{installStatus.message}</span>
              </div>
              {installStatus.output && (
                <pre className="mt-2 p-2.5 bg-[#080D17] rounded-lg border border-slate-800 text-[10px] text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap shadow-inner">
                  {installStatus.output}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick-Install Presets */}
        <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                1-Klick Schnell-Presets
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Beliebte Bibliotheken für Offline-Erweiterungen direkt mit einem Klick hinzufügen:
            </p>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleInstallPackage(preset as any)}
                  disabled={isInstalling}
                  className="px-2.5 py-1.5 rounded-xl bg-[#080D17] hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-white text-[11px] font-mono transition-all flex items-center gap-1.5 group shadow-sm"
                  title={preset.desc}
                >
                  <span className="font-semibold">{preset.name}</span>
                  <span className="text-[9px] text-slate-500 uppercase">({preset.manager})</span>
                  <Plus className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#080D17] p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 font-mono shadow-inner">
            <span className="text-emerald-400 font-bold">Tipp:</span> Pakete im <strong className="text-slate-200">Shared Store</strong> stehen allen Projekten automatisch zur Verfügung.
          </div>
        </div>
      </div>

      {/* Installed Packages List & Table */}
      <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Table Header & Search Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080D17]">
          {/* Tabs Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/80 flex-wrap shadow-inner">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Alle ({allDeps.length})
            </button>
            <button
              onClick={() => setFilterType('production')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'production' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Produktion ({dependenciesData?.npm?.dependencies.length || 0})
            </button>
            <button
              onClick={() => setFilterType('development')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'development' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dev ({dependenciesData?.npm?.devDependencies.length || 0})
            </button>
            {dependenciesData?.nuget && (
              <button
                onClick={() => setFilterType('nuget')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'nuget' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                NuGet ({dependenciesData.nuget.packages.length})
              </button>
            )}
            {dependenciesData?.cargo && (
              <button
                onClick={() => setFilterType('cargo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'cargo' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cargo ({dependenciesData.cargo.crates.length})
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Paket nach Name suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080D17] border border-slate-700/80 text-slate-200 text-xs rounded-xl pl-9 pr-3.5 py-2 focus:outline-none focus:border-emerald-500 font-mono shadow-inner transition-colors placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Packages Table */}
        {filteredDeps.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#080D17] border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500 shadow-inner">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-200">Keine Pakete gefunden</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'Keine Treffer für Ihre Suchanfrage.' : 'In diesem Verzeichnis wurden keine Dependencies erkannt.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#080D17] text-slate-400 font-mono border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Paketname & Dokumentation</th>
                  <th className="px-4 py-3.5 font-semibold">Typ</th>
                  <th className="px-4 py-3.5 font-semibold">Version</th>
                  <th className="px-4 py-3.5 font-semibold">Paketmanager</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredDeps.map((pkg) => (
                  <tr key={`${pkg.manager}_${pkg.name}`} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-5 py-3 font-semibold text-slate-100 flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-emerald-400 transition-colors" />
                      <span className="font-mono text-xs font-bold text-slate-100">{pkg.name}</span>
                      <a
                        href={getDocUrl(pkg.name, pkg.manager)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-emerald-400 transition-colors p-0.5 rounded"
                        title="Offizielle Dokumentation öffnen"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {pkg.manager === 'nuget' ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                          NuGet Package
                        </span>
                      ) : pkg.manager === 'cargo' ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                          Cargo Crate
                        </span>
                      ) : pkg.type === 'development' ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold">
                          Dev-Dependency
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                          Produktion
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      <span className="bg-[#080D17] px-2 py-0.5 rounded border border-slate-800 text-slate-200 font-bold">
                        {pkg.version}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 uppercase font-semibold">
                      {pkg.manager}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => handleUpdatePackage(pkg)}
                        disabled={isInstalling || Boolean(updatingPackages[pkg.name])}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all inline-flex items-center gap-1 font-semibold text-xs glow-emerald shadow-sm"
                        title={`'${pkg.name}' mit 1 Klick auf die neueste Version (Latest) aktualisieren`}
                      >
                        <ArrowUpCircle className={`w-3.5 h-3.5 ${updatingPackages[pkg.name] ? 'animate-spin text-emerald-300' : ''}`} />
                        <span className="hidden sm:inline text-[11px]">Update</span>
                      </button>
                      <button
                        onClick={() => handleUninstall(pkg)}
                        disabled={isInstalling || Boolean(updatingPackages[pkg.name])}
                        className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors inline-flex items-center shadow-sm"
                        title={`'${pkg.name}' deinstallieren`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
