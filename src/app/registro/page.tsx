import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Crear cuenta — Pupi",
};

export default function RegistroPage() {
  return (
    <main className="pupi-auth-page flex min-h-screen flex-col items-center justify-center bg-brand-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link
            href="/"
            className="text-xl font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            Pupi
          </Link>
          <h1 className="mt-8 text-2xl font-bold text-white">Probar gratis</h1>
          <p className="mt-2 text-white/70">
            Creá tu cuenta y empezá a explorar Pupi sin costo.
          </p>
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-white/60">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-accent-light hover:text-white">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
