import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Crear cuenta — Pupi",
};

async function register() {
  "use server";
  redirect("/dashboard");
}

export default function RegistroPage() {
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
          <h1 className="mt-8 text-2xl font-bold text-white">Probar gratis</h1>
          <p className="mt-2 text-white/70">
            Creá tu cuenta y empezá a explorar Pupi sin costo.
          </p>
        </div>

        <form action={register} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/80">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Tu nombre"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-brand-900 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-accent-light focus:outline-none focus:ring-2 focus:ring-accent-light/30"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@empresa.com"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-brand-900 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-accent-light focus:outline-none focus:ring-2 focus:ring-accent-light/30"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-brand-900 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-accent-light focus:outline-none focus:ring-2 focus:ring-accent-light/30"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            Crear cuenta y empezar
          </button>
        </form>

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
