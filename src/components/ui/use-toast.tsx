'use client';

import { useState } from 'react';

type ToastVariant = 'default' | 'destructive';
interface ToastProps {
  title?: string;
  description: string;
  variant?: ToastVariant;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    setToasts((prev) => [...prev, { title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000); // Auto-dismiss after 3 seconds
  };

  const ToastComponent = () => (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((t, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg shadow-lg max-w-sm ${
            t.variant === 'destructive'
              ? 'bg-red-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          {t.title && <h3 className="font-semibold">{t.title}</h3>}
          <p>{t.description}</p>
        </div>
      ))}
    </div>
  );

  return { toast, ToastComponent };
}