import { SectionHeading } from "./ui";

const audiences = [
  {
    title: "Consultores",
    description:
      "Gestioná varios clientes desde un mismo estándar y entregá diagnósticos profesionales que generan confianza y continuidad.",
    highlights: ["Portafolio de organizaciones", "Diagnósticos reutilizables", "Entrega clara al cliente"],
  },
  {
    title: "Dueños de negocio",
    description:
      "Entendé tu operación sin depender de planillas sueltas ni de interpretaciones distintas en cada reunión.",
    highlights: ["Visión unificada", "Prioridades claras", "Menos tiempo perdido en reportes"],
  },
];

export function AudienceSection() {
  return (
    <section id="para-quien" className="scroll-mt-24 bg-brand-950 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Para quién"
          title="Hecho para quien necesita claridad operativa, no más ruido"
        />
        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {audiences.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-accent-muted/50 bg-gradient-to-br from-brand-800/80 to-brand-900/80 p-8"
            >
              <h3 className="text-2xl font-bold text-white">{item.title}</h3>
              <p className="mt-4 text-white/65 leading-relaxed">{item.description}</p>
              <ul className="mt-6 space-y-2">
                {item.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-2 text-sm text-white/80">
                    <span className="text-accent-light" aria-hidden>
                      ✓
                    </span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
