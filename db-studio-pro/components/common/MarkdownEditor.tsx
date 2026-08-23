import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Link,
  Table,
  Eye,
  Edit3,
  Columns,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
  onFocus?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  id,
  value = '',
  onChange,
  placeholder = 'Markdown Text eingeben... (z. B. **fett**, # Überschrift, - Liste)',
  disabled = false,
  minHeight = '140px',
  className = '',
  onFocus,
  onContextMenu,
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to wrap or insert text around current selection in textarea
  const insertFormatting = (before: string, after: string = '', defaultText: string = 'Text') => {
    if (disabled) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + before + defaultText + after);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selected = currentText.substring(start, end);
    const replacement = selected.length > 0 ? selected : defaultText;

    const newText = currentText.substring(0, start) + before + replacement + after + currentText.substring(end);
    onChange(newText);

    // Restore selection focus
    setTimeout(() => {
      textarea.focus();
      const newCursorStart = start + before.length;
      const newCursorEnd = newCursorStart + replacement.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 10);
  };

  // Helper to insert a block/line prefix
  const insertLinePrefix = (prefix: string) => {
    if (disabled) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + '\n' + prefix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    // Find start of current line
    const lastNewline = currentText.lastIndexOf('\n', start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const newText = currentText.substring(0, lineStart) + prefix + currentText.substring(lineStart);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    // Ctrl+B for Bold
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertFormatting('**', '**', 'fett');
    }
    // Ctrl+I for Italic
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertFormatting('*', '*', 'kursiv');
    }
    // Tab key indents
    else if (e.key === 'Tab') {
      e.preventDefault();
      insertFormatting('  ', '', '');
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div
      className={`border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs transition-all ${
        disabled ? 'bg-slate-50 opacity-90' : 'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
      } ${className}`}
      onContextMenu={onContextMenu}
    >
      {/* Toolbar */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 select-none text-slate-700">
        {/* Formatting Actions */}
        <div className="flex items-center flex-wrap gap-0.5">
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertFormatting('**', '**', 'Fetter Text')}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Fett (Ctrl+B)"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertFormatting('*', '*', 'Kursiver Text')}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Kursiv (Ctrl+I)"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertFormatting('~~', '~~', 'Durchgestrichen')}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Durchgestrichen"
          >
            <Strikethrough size={14} />
          </button>

          <span className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('# ')}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Überschrift 1"
          >
            <Heading1 size={14} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('## ')}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Überschrift 2"
          >
            <Heading2 size={14} />
          </button>

          <span className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('- ')}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Aufzählung (- Punkt)"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('1. ')}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Nummerierte Liste (1. Punkt)"
          >
            <ListOrdered size={14} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('- [ ] ')}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Checkliste (- [ ] Aufgabe)"
          >
            <CheckSquare size={14} />
          </button>

          <span className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('> ')}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Zitat / Blockquote"
          >
            <Quote size={14} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertFormatting('```\n', '\n```', 'Code hier...')}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Code-Block"
          >
            <Code size={14} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertFormatting('[', '](https://example.com)', 'Linktext')}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Link einfügen"
          >
            <Link size={14} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() =>
              insertFormatting(
                '\n| Spalte 1 | Spalte 2 | Spalte 3 |\n| :--- | :--- | :--- |\n| Eintrag A | Eintrag B | Eintrag C |\n',
                '',
                ''
              )
            }
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition-colors"
            title="Tabelle einfügen"
          >
            <Table size={14} />
          </button>

          <button
            type="button"
            onClick={() => setShowCheatsheet(!showCheatsheet)}
            className={`p-1 rounded transition-colors ml-1 ${
              showCheatsheet ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-500'
            }`}
            title="Markdown Hilfe anzeigen"
          >
            <HelpCircle size={14} />
          </button>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-0.5 bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('edit')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
              viewMode === 'edit'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 size={12} />
            Editor
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`hidden sm:flex px-2 py-0.5 rounded-md items-center gap-1 transition-all ${
              viewMode === 'split'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns size={12} />
            Split
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
              viewMode === 'preview'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye size={12} />
            Vorschau
          </button>
        </div>
      </div>

      {/* Markdown Cheatsheet Banner */}
      {showCheatsheet && (
        <div className="bg-blue-50/90 border-b border-blue-200 p-2.5 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2 animate-in slide-in-from-top-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold flex items-center gap-1">
              <Sparkles size={13} className="text-blue-600" />
              Markdown-Formatierung:
            </span>
            <span><code>**fett**</code></span>
            <span><code>*kursiv*</code></span>
            <span><code># H1</code></span>
            <span><code>## H2</code></span>
            <span><code>- Liste</code></span>
            <span><code>- [ ] Task</code></span>
            <span><code>[Link](url)</code></span>
            <span><code>`code`</code></span>
            <span><code>| Tabellen |</code></span>
          </div>
          <button
            type="button"
            onClick={() => setShowCheatsheet(false)}
            className="text-blue-700 hover:text-blue-900 font-bold text-xs"
          >
            Schließen
          </button>
        </div>
      )}

      {/* Editor & Preview Workspace */}
      <div className={`grid ${viewMode === 'split' ? 'grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200' : 'grid-cols-1'}`}>
        {/* Editor Area */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="relative">
            <textarea
              ref={textareaRef}
              id={id}
              disabled={disabled}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              placeholder={placeholder}
              style={{ minHeight }}
              className="w-full p-3 font-mono text-xs sm:text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none resize-y leading-relaxed border-0"
            />
          </div>
        )}

        {/* Live Preview Area */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            style={{ minHeight }}
            className="p-3 bg-slate-50/50 overflow-y-auto max-h-[400px] border-0"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Eye size={12} />
              Markdown Live-Vorschau:
            </div>
            <MarkdownViewer content={value} />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 py-1 text-[11px] text-slate-500 flex items-center justify-between select-none">
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-700">Markdown</span>
          <span>•</span>
          <span>{charCount} Zeichen</span>
          <span>•</span>
          <span>{wordCount} Wörter</span>
        </span>
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          GFM (GitHub-Flavored) Tabellen, Listen & Formatierung aktiv
        </span>
      </div>
    </div>
  );
};
