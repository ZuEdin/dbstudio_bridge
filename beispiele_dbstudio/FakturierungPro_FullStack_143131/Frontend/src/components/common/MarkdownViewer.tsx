import React from 'react';
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
    /^#{1,6}\s+/m,
    /\*\*[^*]+\*\*/,
    /\*[^*]+\*/,
    /~~[^~]+~~/,
    /^>\s+/m,
    /^[\s]*[-*+]\s+/m,
    /^[\s]*\d+\.\s+/m,
    /^[\s]*- \[[ xX]\]\s+/m,
    /`[^`]+`/,
    /```[\s\S]*?```/,
    /\[[^\]]+\]\([^)]+\)/,
    /\|.+\|.+\|/m,
    /^---{3,}$/m,
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = '' }) => {
  if (!content || content.trim().length === 0) {
    return <span className="text-slate-400 dark:text-slate-500 italic text-xs">(Kein Inhalt)</span>;
  }

  return (
    <div className={`markdown-body text-slate-800 dark:text-slate-200 text-sm leading-relaxed max-w-none break-words ${className}`}>
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
