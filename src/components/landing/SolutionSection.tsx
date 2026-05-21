import { SectionHeading, IconBox } from "./ui";

const benefits = [
  {
    title: "Diagnóstico claro",
    description:
      "Resúmenes comprensibles y priorizados: qué importa primero y por qué.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Multi-organización",
    description:
      "Cada cliente o negocio en su espacio, con el mismo rigor y sin mezclar información.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: "Listo para actuar",
    description:
      "Recomendaciones orientadas a la ejecución, no solo reportes que nadie lee.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export function SolutionSection() {
  return (
    <section className="bg-brand-950 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="La solución"
          title="Pupi convierte datos operativos en decisiones concretas"
          description="Una plataforma de inteligencia operativa que centraliza el análisis y lo hace accionable para tu equipo o tus clientes."
        />
        <ul className="mt-16 grid gap-8 sm:grid-cols-3">
          {benefits.map((item) => (
            <li key={item.title} className="text-center sm:text-left">
              <div className="flex justify-center sm:justify-start">
                <IconBox>{item.icon}</IconBox>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-white/65 leading-relaxed">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
