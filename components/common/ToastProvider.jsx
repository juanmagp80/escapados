"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext({ notify: () => {} });

export function useToast() {
  return useContext(ToastContext).notify;
}

const TYPES = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  info: "bg-stone-800",
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = "success") => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-sm rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-card ${
              TYPES[t.type] || TYPES.info
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}