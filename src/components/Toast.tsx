"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconCheck } from "./icons";

export function useToast() {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const avisar = useCallback((texto: string) => {
    clearTimeout(timer.current);
    setMensagem(texto);
    timer.current = setTimeout(() => setMensagem(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { mensagem, avisar };
}

export function Toast({ mensagem }: { mensagem: string | null }) {
  if (!mensagem) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[132px] z-50 mx-auto w-full max-w-[480px] px-4">
      <div
        role="status"
        className="flex items-center gap-2.5 bg-ink px-4 py-3.5 text-[15px] font-semibold text-paper shadow-lg"
      >
        <IconCheck size={18} />
        {mensagem}
      </div>
    </div>
  );
}
