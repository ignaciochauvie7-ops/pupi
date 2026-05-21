import Link from "next/link";
import { ButtonLink } from "./ui";

function DashboardMock() {
  return (
    <div
      className="relative mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-brand-800/80 p-4 shadow-2xl shadow-black/40 sm:p-6"
      aria-hidden
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        <span className="ml-2 h-2 flex-1 rounded bg-white/10" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-brand-900/90 p-4 ring-1 ring-white/10">
          <p className="text-xs font-medium text-white/50">Salud operativa</p>
          <p className="mt-1 text-2xl font-bold text-accent-light">78%</p>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div className="h-2 w-[78%] rounded-full bg-accent" />
          </div>
        </div>
        <div className="rounded-xl bg-brand-900/90 p-4 ring-1 ring-white/10">
          <p className="text-xs font-medium text-white/50">Prioridades</p>
          <ul className="mt-2 space-y-2">
            <li className="h-2 rounded bg-accent-muted" />
            <li className="h-2 w-4/5 rounded bg-white/10" />
            <li className="h-2 w-3/5 rounded bg-white/10" />
          </ul>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-brand-900/90 p-4 ring-1 ring-white/10">
        <p className="text-xs font-medium text-white/50">Diagnóstico</p>
        <p className="mt-2 text-sm text-white/70 leading-relaxed">
          Tres áreas con margen de mejora identificadas. Acciones sugeridas listas para revisar.
        </p>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-800 via-brand-900 to-brand-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.18),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-semibold text-accent-light">
            Inteligencia operativa
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Claridad operativa para tu negocio
          </h1>
          <p className="mt-6 text-lg text-white/70 leading-relaxed sm:text-xl">
            Pupi analiza la operación y entrega diagnósticos accionables para que
            decidas con datos, no con suposiciones.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <ButtonLink href="/registro">Empezar gratis</ButtonLink>
            <Link
              href="#como-funciona"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:text-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
            >
              Ver cómo funciona →
            </Link>
          </div>
        </div>
        <DashboardMock />
      </div>
    </section>
  );
}
