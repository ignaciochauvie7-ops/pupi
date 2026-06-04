import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Iniciar sesión — Pupi",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link
            href="/"
            className="text-xl font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            Pupi
          </Link>
          <h1 className="mt-8 text-2xl font-bold text-white">Iniciar sesión</h1>
          <p className="mt-2 text-white/70">
            Accedé a tu panel de inteligencia operativa.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-white/60">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="font-medium text-accent-light hover:text-white">
            Probar gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
