import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useCallback } from 'react';
import './CodeViewer.css';

SyntaxHighlighter.registerLanguage('python', python);

interface CodeViewerProps {
  code: string;
  isEditing: boolean;
  onChange: (newCode: string) => void;
}

export function CodeViewer({ code, isEditing, onChange }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '    ';
      const newValue = code.substring(0, start) + spaces + code.substring(end);
      onChange(newValue);
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      });
    }
  }, [code, onChange]);

  if (isEditing) {
    return (
      <div className="code-viewer-container editing">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="code-textarea"
          spellCheck="false"
          placeholder="Write your Python code here..."
          aria-label="Python code editor"
        />
      </div>
    );
  }

  return (
    <div className="code-viewer-container">
      <button
        className={`copy-btn ${copied ? 'copied' : ''}`}
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
        title="Copy code"
      >
        {copied ? '✓ Copied!' : '📋 Copy'}
      </button>
      <SyntaxHighlighter
        language="python"
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1.5rem',
          height: '100%',
          borderRadius: '0 0 16px 16px',
          fontSize: '1rem',
          lineHeight: '1.5',
          background: '#1E1E1E'
        }}
        showLineNumbers={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
