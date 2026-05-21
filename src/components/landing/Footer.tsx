import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-brand-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-lg font-bold text-white">Pupi</p>
          <p className="mt-1 text-sm text-white/50">© {year} Pupi. Todos los derechos reservados.</p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm" aria-label="Legal y contacto">
          <Link
            href="#"
            className="text-white/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light rounded"
          >
            Privacidad
          </Link>
          <Link
            href="#"
            className="text-white/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light rounded"
          >
            Términos
          </Link>
          <a
            href="mailto:hola@pupi.app"
            className="text-white/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light rounded"
          >
            hola@pupi.app
          </a>
        </nav>
      </div>
    </footer>
  );
}
