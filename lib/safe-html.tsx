'use client';
import DOMPurify from 'dompurify';

interface SafeHTMLProps {
  html: string;
  className?: string;
}

export function SafeHTML({ html, className = '' }: SafeHTMLProps) {
  // Server-side rendering: return empty div
  if (typeof window === 'undefined') {
    return <div className={className}></div>;
  }
  
  // Client-side: sanitize and render
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 
      'a', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'pre', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
  });
  
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
