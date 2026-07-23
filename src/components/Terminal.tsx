import { useEffect, useRef, useMemo } from 'react';
import type { TerminalLine } from '../types/project';
import './Terminal.css';

interface TerminalProps {
  lines: TerminalLine[];
  maxLines?: number;
}

export function Terminal({ lines, maxLines = 1000 }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive truncated lines
  const displayLines = useMemo(() => {
    if (lines.length <= maxLines) return lines;
    
    // We'll keep the first 50 lines (useful startup), and the rest will be the most recent
    const firstPart = lines.slice(0, 50);
    const lastPart = lines.slice(lines.length - (maxLines - 50));
    
    const warningLine: TerminalLine = {
      id: -1,
      type: 'system',
      text: `\n[... Output truncated due to length: ${lines.length - maxLines} lines hidden ...]\n`
    };
    
    return [...firstPart, warningLine, ...lastPart];
  }, [lines, maxLines]);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayLines]);

  return (
    <div className="terminal-container" ref={containerRef} role="log" aria-live="polite">
      {displayLines.map((line, idx) => (
        <div key={idx} className={`terminal-line ${line.type}`}>
          {line.text}
        </div>
      ))}
      <div className="terminal-line">
        <span className="terminal-cursor"></span>
      </div>
    </div>
  );
}
