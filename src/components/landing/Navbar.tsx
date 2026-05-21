import Link from "next/link";
import { ButtonLink } from "./ui";

const navLinks = [
  { href: "#producto", label: "Producto" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#para-quien", label: "Para quién" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-950/90 backdrop-blur-md">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
        aria-label="Principal"
      >
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Pupi
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light rounded"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">
            Iniciar sesión
          </ButtonLink>
          <ButtonLink href="/registro" variant="primary" className="text-xs sm:text-sm px-4 sm:px-5">
            Probar gratis
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}
