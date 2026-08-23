import React, { useState, useEffect } from 'react';

interface CommaSeparatedInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const CommaSeparatedInput: React.FC<CommaSeparatedInputProps> = ({ value, onChange, placeholder, className }) => {
  const [localValue, setLocalValue] = useState(value.join(', '));

  useEffect(() => {
    const normalizedProp = value.join(', ');
    const normalizedLocal = localValue.split(',').map(v => v.trim()).filter(Boolean).join(', ');
    if (normalizedProp !== normalizedLocal) {
      setLocalValue(normalizedProp);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);
    const parsed = raw.split(',').map(v => v.trim());
    const filtered = parsed.filter(v => v !== '');
    onChange(filtered);
  };

  const handleBlur = () => {
    const parsed = localValue.split(',').map(v => v.trim()).filter(Boolean);
    setLocalValue(parsed.join(', '));
    onChange(parsed);
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};
