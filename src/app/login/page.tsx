import Link from "next/link";

export const metadata = {
  title: "Iniciar sesión — Pupi",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-950 px-4">
      <div className="max-w-md text-center">
        <Link
          href="/"
          className="text-xl font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Pupi
        </Link>
        <h1 className="mt-8 text-2xl font-bold text-white">Iniciar sesión</h1>
        <p className="mt-4 text-white/70">
          El acceso a tu cuenta estará disponible pronto. Mientras tanto, conocé el
          producto en la página principal.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
