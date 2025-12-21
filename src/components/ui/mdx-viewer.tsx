'use client';

import React from 'react';
import { MDXViewer as MDXViewerComp } from 'mdx-craft';

interface MDXViewerProps {
  content: string;
  className?: string;
}

export function MDXViewer({ content, className = '' }: MDXViewerProps) {
  if (!content) {
    return <div className={`text-muted-foreground ${className}`}>No content to display</div>;
  }

  return (
    <div className={className}>
      <MDXViewerComp source={content} />
    </div>
  );
}

export default MDXViewer;