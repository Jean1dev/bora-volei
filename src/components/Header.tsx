import Link from "next/link";
import { IconBack } from "./icons";

/** Barra do topo: "BORA VÔLEI" com voltar opcional à esquerda e uma ação à direita. */
export function Header({ voltar, children }: { voltar?: string | (() => void); children?: React.ReactNode }) {
  const marca = (
    <Link href="/" className="text-[18px] font-extrabold tracking-[-0.02em] text-ink no-underline hover:text-ink">
      BORA VÔLEI
    </Link>
  );
  if (voltar) {
    const cls = "btn btn-icon h-11 w-11";
    return (
      <header className="flex items-center gap-2 border-b-2 border-ink px-3 py-2.5">
        {typeof voltar === "string" ? (
          <Link href={voltar} aria-label="Voltar" className={cls}>
            <IconBack />
          </Link>
        ) : (
          <button type="button" aria-label="Voltar" className={cls} onClick={voltar}>
            <IconBack />
          </button>
        )}
        {marca}
        <div className="ml-auto">{children}</div>
      </header>
    );
  }
  return (
    <header className="flex min-h-[56px] items-center justify-between border-b-2 border-ink px-5 py-2.5">
      {marca}
      {children}
    </header>
  );
}
