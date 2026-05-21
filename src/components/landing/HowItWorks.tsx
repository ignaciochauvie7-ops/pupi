import { SectionHeading } from "./ui";

const steps = [
  {
    step: "1",
    title: "Conectá o cargá información operativa",
    description:
      "Reuní los datos relevantes de la operación en un solo flujo, sin depender de diez herramientas distintas.",
  },
  {
    step: "2",
    title: "Pupi procesa y genera el diagnóstico",
    description:
      "La plataforma analiza la información y produce un informe claro con hallazgos y prioridades.",
  },
  {
    step: "3",
    title: "Priorizá acciones con tu equipo o cliente",
    description:
      "Compartí conclusiones accionables y avanzá en mejoras concretas, con trazabilidad del análisis.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 bg-brand-900 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="De los datos al plan de acción en tres pasos"
        />
        <ol className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((item) => (
            <li
              key={item.step}
              className="relative rounded-2xl border border-white/10 bg-brand-800/50 p-8"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-white"
                aria-hidden
              >
                {item.step}
              </span>
              <h3 className="mt-6 text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-white/65 leading-relaxed">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
