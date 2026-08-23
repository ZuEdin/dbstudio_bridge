import { VirtualFile } from '../../../../types/index';

export const generateMarkdownEditorComponent = (root: string): VirtualFile => {
  const code = `import React, { useState, useRef } from 'react';
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
  Table as TableIcon,
  Eye,
  Edit3,
  Columns,
  HelpCircle,
  FileText
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

    setTimeout(() => {
      textarea.focus();
      const newCursorStart = start + before.length;
      const newCursorEnd = newCursorStart + replacement.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 10);
  };

  const insertLinePrefix = (prefix: string) => {
    if (disabled) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + '\\n' + prefix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    const lastNewline = currentText.lastIndexOf('\\n', start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const newText = currentText.substring(0, lineStart) + prefix + currentText.substring(lineStart);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  const insertTable = () => {
    const tableTemplate = \`
| Spalte 1 | Spalte 2 | Spalte 3 |
| :--- | :--- | :--- |
| Zeile 1 | Daten A | Daten B |
| Zeile 2 | Daten C | Daten D |
\`;
    insertFormatting(tableTemplate, '', '');
  };

  const wordCount = (value || '').trim() ? (value || '').trim().split(/\\s+/).length : 0;
  const charCount = (value || '').length;

  return (
    <div className={\`border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 \${className}\`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-0.5 flex-wrap">
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertFormatting('**', '**', 'Fett')}
            title="Fett (**text**)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertFormatting('*', '*', 'Kursiv')}
            title="Kursiv (*text*)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertFormatting('~~', '~~', 'Durchgestrichen')}
            title="Durchgestrichen (~~text~~)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <Strikethrough size={15} />
          </button>

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('# ')}
            title="Überschrift 1 (# )"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <Heading1 size={15} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('## ')}
            title="Überschrift 2 (## )"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <Heading2 size={15} />
          </button>

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('- ')}
            title="Aufzählungsliste (- )"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('1. ')}
            title="Nummerierte Liste (1. )"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <ListOrdered size={15} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('- [ ] ')}
            title="Aufgaben-Checkbox (- [ ] )"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <CheckSquare size={15} />
          </button>

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertFormatting('\`', '\`', 'code')}
            title="Inline-Code (\`code\`)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <Code size={15} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertLinePrefix('> ')}
            title="Zitat (> )"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <Quote size={15} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={() => insertFormatting('[', '](https://)', 'Link-Text')}
            title="Hyperlink [Text](URL)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <Link size={15} />
          </button>
          <button
            type="button"
            disabled={disabled || viewMode === 'preview'}
            onClick={insertTable}
            title="Tabelle einfügen"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <TableIcon size={15} />
          </button>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={\`px-2 py-1 rounded flex items-center gap-1 font-medium transition-all \${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }\`}
            >
              <Edit3 size={13} />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={\`px-2 py-1 rounded hidden sm:flex items-center gap-1 font-medium transition-all \${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }\`}
            >
              <Columns size={13} />
              <span>Geteilt</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={\`px-2 py-1 rounded flex items-center gap-1 font-medium transition-all \${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }\`}
            >
              <Eye size={13} />
              <span>Vorschau</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCheatsheet(!showCheatsheet)}
            title="Markdown Spickzettel"
            className={\`p-1.5 rounded transition-colors \${
              showCheatsheet ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }\`}
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* Cheatsheet Accordion */}
      {showCheatsheet && (
        <div className="bg-blue-50/60 dark:bg-slate-800/90 border-b border-blue-100 dark:border-slate-700 p-3 text-xs text-slate-700 dark:text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div><span className="font-mono font-bold">**fett**</span> ➔ <b>fett</b></div>
          <div><span className="font-mono font-bold">*kursiv*</span> ➔ <i>kursiv</i></div>
          <div><span className="font-mono font-bold"># Titel</span> ➔ H1 Überschrift</div>
          <div><span className="font-mono font-bold">## Untertitel</span> ➔ H2</div>
          <div><span className="font-mono font-bold">- Punkt</span> ➔ Liste</div>
          <div><span className="font-mono font-bold">1. Nummer</span> ➔ Nummeriert</div>
          <div><span className="font-mono font-bold">- [x] Erledigt</span> ➔ Aufgabe</div>
          <div><span className="font-mono font-bold">\`code\`</span> ➔ Code</div>
        </div>
      )}

      {/* Editor & Preview Area */}
      <div className="relative">
        {viewMode === 'edit' && (
          <textarea
            id={id}
            ref={textareaRef}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onContextMenu={onContextMenu}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full p-3 font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 resize-y outline-none border-0 focus:ring-0 placeholder-slate-400 disabled:opacity-50"
          />
        )}

        {viewMode === 'preview' && (
          <div style={{ minHeight }} className="p-4 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto max-h-[500px]">
            <MarkdownViewer content={value} />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
            <textarea
              id={id}
              ref={textareaRef}
              disabled={disabled}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              onContextMenu={onContextMenu}
              placeholder={placeholder}
              style={{ minHeight }}
              className="w-full p-3 font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 resize-y outline-none border-0 focus:ring-0 placeholder-slate-400 disabled:opacity-50"
            />
            <div style={{ minHeight }} className="p-4 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto max-h-[500px]">
              <MarkdownViewer content={value} />
            </div>
          </div>
        )}
      </div>

      {/* Footer info bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1 font-mono">
          <FileText size={11} /> Markdown unterstützt
        </span>
        <div className="flex items-center gap-3">
          <span>{wordCount} Wörter</span>
          <span>{charCount} Zeichen</span>
        </div>
      </div>
    </div>
  );
};
`;

  return {
    name: 'MarkdownEditor.tsx',
    path: `${root}/src/components/common/MarkdownEditor.tsx`,
    content: code,
    language: 'typescript'
  };
};

export const generateMarkdownViewerComponent = (root: string): VirtualFile => {
  const code = `import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  content: string | undefined | null;
  className?: string;
}

export function isLikelyMarkdown(text: any): boolean {
  if (typeof text !== 'string') return false;
  if (!text || text.trim().length === 0) return false;

  const markdownPatterns = [
    /^#{1,6}\\s+/m,
    /\\*\\*[^*]+\\*\\*/,
    /\\*[^*]+\\*/,
    /~~[^~]+~~/,
    /^>\\s+/m,
    /^[\\s]*[-*+]\\s+/m,
    /^[\\s]*\\d+\\.\\s+/m,
    /^[\\s]*- \\[[ xX]\\]\\s+/m,
    /\`[^\`]+\`/,
    /\`\`\`[\\s\\S]*?\`\`\`/,
    /\\[[^\\]]+\\]\\([^)]+\\)/,
    /\\|.+\\|.+\\|/m,
    /^---{3,}$/m,
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = '' }) => {
  if (!content || content.trim().length === 0) {
    return <span className="text-slate-400 dark:text-slate-500 italic text-xs">(Kein Inhalt)</span>;
  }

  return (
    <div className={\`markdown-body text-slate-800 dark:text-slate-200 text-sm leading-relaxed max-w-none break-words \${className}\`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-700" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-3 mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-800" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-2.5 mb-1" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-2 mb-1" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1 mb-3 pl-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 pl-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-slate-700 dark:text-slate-300 leading-snug" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 bg-blue-50/60 dark:bg-blue-900/20 pl-3 py-1.5 my-2 text-slate-700 dark:text-slate-300 italic rounded-r-md" {...props} />
          ),
          code: ({ inline, className: codeClassName, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono border border-slate-800 shadow-inner">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-xs" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-3 py-2 text-slate-700 dark:text-slate-200" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-blue-600 dark:text-blue-400 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-slate-200 dark:border-slate-700" {...props} />
          ),
          input: ({ node, ...props }) => (
            <input className="mr-1 rounded text-blue-600 focus:ring-blue-500" disabled {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
`;

  return {
    name: 'MarkdownViewer.tsx',
    path: `${root}/src/components/common/MarkdownViewer.tsx`,
    content: code,
    language: 'typescript'
  };
};
