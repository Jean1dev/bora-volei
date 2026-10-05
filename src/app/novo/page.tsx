import type { Metadata } from "next";
import { NovoJogo } from "./NovoJogo";

export const metadata: Metadata = { title: "Marcar um jogo · Bora Vôlei" };

export default function Page() {
  return <NovoJogo />;
}
