import { useState, useRef, useEffect } from 'react';
import './InputPrompt.css';

interface InputPromptProps {
  prompt: string;
  onSubmit: (value: string) => void;
}

export function InputPrompt({ prompt, onSubmit }: InputPromptProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement;
    inputRef.current?.focus();
    
    return () => {
      // Small timeout to allow React to render elements before focusing
      setTimeout(() => {
        if (previousFocus && previousFocus.focus) {
          previousFocus.focus();
        }
      }, 10);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
    setValue('');
  };

  return (
    <div className="input-prompt-container" role="dialog" aria-label="Python is asking for input">
      <p className="input-prompt-text">
        {prompt || 'The program is waiting for your input:'}
      </p>
      <form onSubmit={handleSubmit} className="input-prompt-form">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input-prompt-input"
          placeholder="Type your answer here..."
          aria-label="Your input"
          autoComplete="off"
        />
        <button type="submit" className="input-prompt-submit">
          Submit ↵
        </button>
      </form>
    </div>
  );
}
