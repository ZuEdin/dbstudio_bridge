import React, { useState, useEffect } from 'react';

export const LocalInput = ({ value, onChange, onBlur, className, placeholder, onMouseDown, ...props }: any) => {
  const [val, setVal] = useState(value);
  useEffect(() => {
    setVal(value);
  }, [value]);
  
  return (
    <input
      {...props}
      className={className}
      placeholder={placeholder}
      value={val}
      onMouseDown={onMouseDown}
      onChange={(e) => setVal(e.target.value)}
      onBlur={(e) => {
        if (val !== value) {
          onChange(e);
        }
        if (onBlur) onBlur(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
    />
  );
};

export const LocalTextarea = ({ value, onChange, onBlur, className, placeholder, onMouseDown, ...props }: any) => {
  const [val, setVal] = useState(value);
  useEffect(() => {
    setVal(value);
  }, [value]);

  return (
    <textarea
      {...props}
      className={className}
      placeholder={placeholder}
      value={val}
      onMouseDown={onMouseDown}
      onChange={(e) => setVal(e.target.value)}
      onBlur={(e) => {
        if (val !== value) {
          onChange(e);
        }
        if (onBlur) onBlur(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.currentTarget.blur();
        }
      }}
    />
  );
};
