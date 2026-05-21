import { ButtonLink } from "./ui";

export function FinalCta() {
  return (
    <section className="bg-brand-900 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Empezá a tomar decisiones con diagnósticos que importan
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
          Creá tu cuenta y explorá cómo Pupi puede ordenar la inteligencia operativa de tu
          negocio o de tus clientes.
        </p>
        <div className="mt-10">
          <ButtonLink href="/registro" className="px-8 py-3 text-base">
            Crear cuenta gratis
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
