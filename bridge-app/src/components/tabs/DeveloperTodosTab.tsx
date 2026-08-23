import React, { useState, useEffect } from 'react';
import { 
  ListTodo, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Filter, 
  Search, 
  Sparkles, 
  Save, 
  Check, 
  Edit3,
  Layers,
  FolderGit2
} from 'lucide-react';
import { DeveloperTodo } from '../../types/bridge';
import { bridgeApi } from '../../services/bridgeApi';

export const DeveloperTodosTab: React.FC = () => {
  const [todos, setTodos] = useState<DeveloperTodo[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('Alle');
  const [filterStatus, setFilterStatus] = useState<string>('Alle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSavedBanner, setIsSavedBanner] = useState<boolean>(false);

  // New Todo Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Tauri & Desktop');
  const [newPriority, setNewPriority] = useState<DeveloperTodo['priority']>('Hoch');
  const [newAssignee, setNewAssignee] = useState('Developer');
  const [newDescription, setNewDescription] = useState('');

  const loadTodos = async () => {
    setIsLoading(true);
    try {
      const data = await bridgeApi.getTodos();
      if (Array.isArray(data) && data.length > 0) {
        setTodos(data);
      }
    } catch (e) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const saveUpdatedTodos = async (updated: DeveloperTodo[]) => {
    setTodos(updated);
    await bridgeApi.saveTodos(updated);
    setIsSavedBanner(true);
    setTimeout(() => setIsSavedBanner(false), 2000);
  };

  const handleToggleStatus = async (id: string) => {
    const updated = todos.map(t => {
      if (t.id === id) {
        const nextStatus: DeveloperTodo['status'] = 
          t.status === 'Erledigt' ? 'Offen' : 
          t.status === 'Offen' ? 'In Bearbeitung' : 'Erledigt';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    await saveUpdatedTodos(updated);
  };

  const handleDelete = async (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    await saveUpdatedTodos(updated);
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTodo: DeveloperTodo = {
      id: 'todo_' + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'Offen',
      assignee: newAssignee.trim() || 'Developer',
      description: newDescription.trim()
    };

    const updated = [newTodo, ...todos];
    await saveUpdatedTodos(updated);
    
    // Reset Form
    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  const categories = ['Alle', ...Array.from(new Set(todos.map(t => t.category)))];

  const filteredTodos = todos.filter(todo => {
    const matchesCategory = filterCategory === 'Alle' || todo.category === filterCategory;
    const matchesStatus = filterStatus === 'Alle' || todo.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      todo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      todo.assignee.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const priorityColor = (p: DeveloperTodo['priority']) => {
    switch (p) {
      case 'Kritisch': return 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-bold';
      case 'Hoch': return 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold';
      case 'Mittel': return 'bg-sky-500/15 text-sky-300 border-sky-500/30 font-medium';
      case 'Niedrig': return 'bg-slate-800 text-slate-400 border-slate-700 font-normal';
    }
  };

  const statusColor = (s: DeveloperTodo['status']) => {
    switch (s) {
      case 'Erledigt': return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
      case 'In Bearbeitung': return 'text-amber-300 bg-amber-500/15 border-amber-500/30 glow-amber';
      case 'Offen': return 'text-slate-400 bg-[#080D17] border-slate-800';
    }
  };

  const completedCount = todos.filter(t => t.status === 'Erledigt').length;
  const inProgressCount = todos.filter(t => t.status === 'In Bearbeitung').length;
  const openCount = todos.filter(t => t.status === 'Offen').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#0E1526] to-[#0A0F1D] border border-slate-800/90 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/5 border border-emerald-500/30 text-emerald-400 glow-emerald">
                <ListTodo className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Entwickler-Roadmap & TODO-Liste</h2>
            </div>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
              Zentrale Aufgabenliste für das DB Studio Bridge Entwicklungsteam. Aufgaben werden automatisch persistent in der Bridge und lokal synchronisiert.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#080D17]/80 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-2xl text-center shadow-inner">
              <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Fortschritt</div>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                {completedCount} / {todos.length} Erledigt
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-emerald-950/50 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Aufgabe hinzufügen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics & Filter Bar */}
      <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Aufgaben, Beschreibungen oder Bearbeiter suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080D17] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono shadow-inner transition-colors placeholder:text-slate-600"
            />
          </div>

          {/* Status Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterStatus('Alle')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'Alle' ? 'bg-slate-800 text-white shadow-sm' : 'bg-[#080D17] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Alle ({todos.length})
            </button>
            <button
              onClick={() => setFilterStatus('Offen')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'Offen' ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-[#080D17] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Offen ({openCount})
            </button>
            <button
              onClick={() => setFilterStatus('In Bearbeitung')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'In Bearbeitung' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 glow-amber' : 'bg-[#080D17] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              In Bearbeitung ({inProgressCount})
            </button>
            <button
              onClick={() => setFilterStatus('Erledigt')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'Erledigt' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 glow-emerald' : 'bg-[#080D17] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Erledigt ({completedCount})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 overflow-x-auto">
          <span className="text-[11px] text-slate-500 font-mono shrink-0">Kategorie:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                  : 'bg-[#080D17] text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Todo List Items */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-10 text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#080D17] border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500 shadow-inner">
              <CheckCircle2 className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Keine Aufgaben gefunden</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Es gibt aktuell keine Aufgaben, die dem gewählten Filter entsprechen.
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const isCompleted = todo.status === 'Erledigt';
            const isInProgress = todo.status === 'In Bearbeitung';

            return (
              <div
                key={todo.id}
                className={`bg-[#0E1524]/80 backdrop-blur-md border rounded-2xl p-4.5 shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted 
                    ? 'border-slate-800/50 opacity-70 bg-[#0A0E18]/60' 
                    : 'border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleStatus(todo.id)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-400 transition-colors p-0.5 rounded"
                    title="Status umschalten (Offen -> In Bearbeitung -> Erledigt)"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isInProgress ? (
                      <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-bold truncate ${isCompleted ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {todo.title}
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono border ${priorityColor(todo.priority)}`}>
                        {todo.priority}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono border ${statusColor(todo.status)}`}>
                        {todo.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-[#080D17] text-slate-400 border border-slate-800">
                        {todo.category}
                      </span>
                    </div>

                    {todo.description && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {todo.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 font-mono">
                      <span>Bearbeiter: <strong className="text-slate-300">{todo.assignee}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleToggleStatus(todo.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                      isCompleted 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 glow-emerald'
                    }`}
                  >
                    {isCompleted ? 'Wiedereröffnen' : isInProgress ? 'Als Erledigt markieren' : 'Starten'}
                  </button>

                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors shadow-sm"
                    title="Aufgabe löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Todo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E1524] border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ListTodo className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Neue Entwickler-Aufgabe anlegen</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTodo} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Titel der Aufgabe *</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Automatisches Deployment absichern"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kategorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                  >
                    <option value="Tauri & Desktop">Tauri & Desktop</option>
                    <option value="Frontend & UI">Frontend & UI</option>
                    <option value="Backend & Daemon">Backend & Daemon</option>
                    <option value="Deployments">Deployments</option>
                    <option value="Sicherheit & CORS">Sicherheit & CORS</option>
                    <option value="Sonstiges">Sonstiges</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Priorität</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                  >
                    <option value="Kritisch">Kritisch</option>
                    <option value="Hoch">Hoch</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Niedrig">Niedrig</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Zugewiesen an</label>
                <input
                  type="text"
                  placeholder="z.B. Frontend Team, Backend Team"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Beschreibung / Details</label>
                <textarea
                  rows={3}
                  placeholder="Details zur Umsetzung..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-950/50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aufgabe speichern</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
