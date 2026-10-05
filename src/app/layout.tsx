import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Bora Vôlei",
  description: "Marque o vôlei com a galera e encontre jogos com vaga.",
};

export const viewport: Viewport = {
  themeColor: "#f3f2f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} antialiased`}>
      <body>
        {/* Coluna de celular; no desktop fica centralizada com as bordas do protótipo. */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-paper sm:border-x-2 sm:border-ink sm:shadow-lg">
          {children}
        </div>
      </body>
    </html>
  );
}
