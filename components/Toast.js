'use client';

import { useEffect } from 'react';

export default function Toast({ message, onClear }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => onClear(), 2400);
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  return (
    <div className={`toast ${message ? 'show' : ''}`}>
      {message}
    </div>
  );
}
