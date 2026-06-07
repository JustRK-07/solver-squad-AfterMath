"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
}

interface ToastApi {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // safe no-op when used outside a provider
    return { show: () => {} };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3500);
    return () => clearTimeout(t);
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* toast stack — bottom right */}
      <div className="fixed bottom-6 right-6 z-[100] grid gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="bg-success-bg text-success-fg border-hairline border-success-fg rounded-lg px-3.5 py-2.5 text-[13px] shadow-sm"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
