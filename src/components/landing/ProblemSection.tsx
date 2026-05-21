import { SectionHeading, IconBox } from "./ui";

const problems = [
  {
    title: "Datos dispersos",
    description:
      "Planillas, correos y herramientas sueltas hacen imposible ver el panorama completo de la operación.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  {
    title: "Decisiones sin visibilidad",
    description:
      "Sin un diagnóstico unificado, cada reunión repite el mismo análisis desde cero.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-8 8" />
      </svg>
    ),
  },
  {
    title: "Sin un lugar para el diagnóstico",
    description:
      "Consultores y empresas necesitan un espacio compartido donde el análisis viva y evolucione.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export function ProblemSection() {
  return (
    <section id="producto" className="scroll-mt-24 bg-brand-900 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="El desafío"
          title="La operación es compleja cuando no hay un solo lugar para entenderla"
          description="Equipos con buenos datos pero mala síntesis pierden tiempo y oportunidades."
        />
        <ul className="mt-16 grid gap-8 sm:grid-cols-3">
          {problems.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-white/10 bg-brand-800/60 p-6"
            >
              <IconBox>{item.icon}</IconBox>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-white/65 leading-relaxed">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
