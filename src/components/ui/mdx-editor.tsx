'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface MDXEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MDXEditor({ value, onChange, placeholder = 'Enter book summary in markdown format...', className = '' }: MDXEditorProps) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`resize-none min-h-[150px] ${className}`}
    />
  );
}

export default MDXEditor;