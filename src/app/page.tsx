"use client";

import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";
import Link from "next/link";
import {
  Brain,
  Mic,
  ArrowRight,
  Play,
  Menu,
  X,
  Check,
  MessageSquare,
  Sparkles,
  Zap,
  Users,
  TrendingUp,
  Calculator,
  UserCheck,
  Megaphone,
  Database,
  ShieldCheck,
  Building2,
  Briefcase,
  Quote,
  Workflow,
  Star,
  CalendarDays,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Scroll reveal                                                      */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "reveal-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  Orbital brain visual                                               */
/* ------------------------------------------------------------------ */

const ORBIT_MODULES = [
  { icon: Users, label: "CRM", color: "#2563EB", floatDelay: "0s" },
  { icon: TrendingUp, label: "Ventas", color: "#22c55e", floatDelay: "0.8s" },
  { icon: Megaphone, label: "Marketing", color: "#a855f7", floatDelay: "1.6s" },
  { icon: UserCheck, label: "RRHH", color: "#f97316", floatDelay: "2.4s" },
  { icon: Calculator, label: "Contabilidad", color: "#eab308", floatDelay: "3.2s" },
];

const ORBIT_SIZE = 520;
const ORBIT_RADIUS = 185;
const ORBIT_CENTER = ORBIT_SIZE / 2;

function OrbitalBrain() {
  const moduleAngles = ORBIT_MODULES.map(
    (_, i) => (i / ORBIT_MODULES.length) * 360
  );

  return (
    <div className="orbit-stage" aria-hidden>
      <div className="orbit-bg-glow" />

      <div className="orbit-center-node">
        <Brain size={40} className="text-white" />
        <span className="orbit-center-label">Pupi</span>
      </div>

      <div className="orbit-rotor">
        <svg
          className="orbit-lines"
          viewBox={`0 0 ${ORBIT_SIZE} ${ORBIT_SIZE}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <circle
            className="orbit-track"
            cx={ORBIT_CENTER}
            cy={ORBIT_CENTER}
            r={ORBIT_RADIUS}
          />
          {moduleAngles.map((angleDeg, i) => {
            const angleRad = (angleDeg * Math.PI) / 180;
            const x2 = ORBIT_CENTER + ORBIT_RADIUS * Math.sin(angleRad);
            const y2 = ORBIT_CENTER - ORBIT_RADIUS * Math.cos(angleRad);
            return (
              <line
                key={`line-${i}`}
                className="orbit-line"
                x1={ORBIT_CENTER}
                y1={ORBIT_CENTER}
                x2={x2}
                y2={y2}
              />
            );
          })}
        </svg>

        {ORBIT_MODULES.map((m, i) => {
          const Icon = m.icon;
          const angleDeg = moduleAngles[i];
          return (
            <div
              key={m.label}
              className="orbit-module"
              style={{
                transform: `rotate(${angleDeg}deg) translateY(-${ORBIT_RADIUS}px)`,
                ["--module-color" as string]: m.color,
              }}
            >
              <div className="orbit-module-inner">
                <div
                  className="orbit-module-upright"
                  style={{ transform: `rotate(-${angleDeg}deg)` }}
                >
                  <div
                    className="orbit-module-content"
                    style={{ animationDelay: m.floatDelay }}
                  >
                    <Icon size={22} style={{ color: m.color }} />
                    <span className="orbit-module-label">{m.label}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: "Producto", href: "#producto" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
  { label: "Nosotros", href: "#nosotros" },
];

const TRUST_LOGOS = ["Distribuidora Norte", "Tech Solutions", "Grupo Herrera", "Retail Express", "Importadora DL", "Constructora MP"];

const PROBLEMS = [
  { icon: Database, title: "Datos dispersos", desc: "Excel por acá, WhatsApp por allá, mails sin responder. Nada conversa entre sí." },
  { icon: TrendingUp, title: "Cero visibilidad", desc: "No sabés qué cliente está por irse, qué venta peligra ni dónde se fuga la plata." },
  { icon: Workflow, title: "Decisiones a ciegas", desc: "Se decide por intuición porque armar un reporte lleva días que no tenés." },
  { icon: Zap, title: "Todo manual", desc: "Tareas repetitivas que comen horas y que nadie debería estar haciendo a mano." },
];

const STEPS = [
  { icon: Database, title: "Conectá tu negocio", desc: "Cargá o conectá tus datos: clientes, ventas, finanzas, equipo. Pupi se integra con Google Workspace y más." },
  { icon: Brain, title: "Pupi analiza todo", desc: "Procesa la operación de punta a punta y aprende cómo funciona tu empresa, cruzando todas las áreas." },
  { icon: Sparkles, title: "Preguntá o delegá", desc: "Hacele cualquier pregunta y respondé al instante — o dejá que Pupi ejecute la acción por vos." },
];

const FEATURES = [
  { icon: MessageSquare, title: "Preguntale cualquier cosa", desc: "Chat con IA que conoce tu empresa entera. Respuestas precisas con tus datos reales, al instante.", span: "lg:col-span-2", tone: "#2563EB" },
  { icon: Mic, title: "Hablá con Pupi", desc: "Activación por voz. Pedile lo que necesites sin escribir.", span: "", tone: "#60a5fa" },
  { icon: Users, title: "CRM con temperatura", desc: "Clientes calientes, tibios y fríos. Sabé a quién contactar hoy.", span: "", tone: "#34d399" },
  { icon: TrendingUp, title: "Pipeline y pronóstico", desc: "Oportunidades, probabilidades y proyección de cierres en tiempo real.", span: "", tone: "#fbbf24" },
  { icon: Calculator, title: "Contabilidad automática", desc: "Ingresos, gastos y flujo de caja ordenados sin planillas.", span: "", tone: "#f87171" },
  { icon: UserCheck, title: "Equipo y clima", desc: "Desempeño, alertas de riesgo y clima laboral del equipo, monitoreados.", span: "", tone: "#c084fc" },
  { icon: Brain, title: "Memoria que aprende", desc: "Cuanto más la usás, más conoce tu negocio y mejores son sus respuestas.", span: "", tone: "#60a5fa" },
  { icon: Zap, title: "Acciones, no solo respuestas", desc: "El diferencial: Pupi no solo te dice qué hacer, lo hace por vos con tu confirmación.", span: "lg:col-span-2", tone: "#2563EB" },
];

const AUDIENCES = [
  {
    icon: Building2,
    title: "Dueños de PYMEs",
    desc: "Tené el control total de tu negocio sin perder horas armando reportes.",
    points: ["Visibilidad completa en un solo lugar", "Alertas antes de que sea tarde", "Decisiones con datos, no corazonadas", "Menos tareas manuales, más estrategia"],
  },
  {
    icon: Briefcase,
    title: "Consultores",
    desc: "Implementá Pupi en las empresas que asesorás y multiplicá tu impacto.",
    points: ["Diagnósticos operativos en minutos", "Gestioná múltiples clientes a la vez", "Recomendaciones accionables al instante", "Una herramienta que te diferencia"],
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "79",
    desc: "Para arrancar a ordenar tu negocio.",
    features: ["3 usuarios", "50 consultas IA / día", "5 GB de storage", "1.000 emails / mes", "Todos los módulos incluidos"],
    cta: "Probar gratis",
    highlight: false,
  },
  {
    name: "Growth",
    price: "199",
    desc: "El favorito de las PYMEs en crecimiento.",
    features: ["15 usuarios", "200 consultas IA / día", "20 GB de storage", "5.000 emails / mes", "Todos los módulos incluidos", "Soporte prioritario"],
    cta: "Probar gratis",
    highlight: true,
  },
  {
    name: "Pro",
    price: "449",
    desc: "Para equipos que escalan en serio.",
    features: ["50 usuarios", "500 consultas IA / día", "50 GB de storage", "20.000 emails / mes", "Todos los módulos incluidos", "Soporte prioritario"],
    cta: "Probar gratis",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: null,
    desc: "Volumen y necesidades a medida.",
    features: ["Usuarios ilimitados", "Consultas IA ilimitadas", "Storage a medida", "Emails a medida", "Onboarding dedicado", "SLA y soporte premium"],
    cta: "Hablar con ventas",
    highlight: false,
  },
];

const FOOTER_COLUMNS = [
  { title: "Producto", links: ["Funcionalidades", "Cómo funciona", "Precios", "Integraciones"] },
  { title: "Empresa", links: ["Nosotros", "Clientes", "Contacto", "Blog"] },
  { title: "Recursos", links: ["Documentación", "Soporte", "Estado", "Comunidad"] },
  { title: "Legal", links: ["Privacidad", "Términos", "Seguridad", "Cookies"] },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0A0A0F] text-white antialiased">
      {/* ============================== NAVBAR ============================== */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] shadow-lg shadow-[#2563EB]/30">
              <Brain size={18} className="text-white" />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">Pupi AI</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="group inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition-all hover:bg-[#1d4ed8] hover:shadow-[#2563EB]/40"
            >
              Probar gratis
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Menú"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0A0A0F]/95 backdrop-blur-xl md:hidden">
            <div className="space-y-1 px-5 py-4">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3">
                <Link href="/login" className="rounded-lg border border-white/10 px-4 py-2.5 text-center text-sm font-medium text-white/80">
                  Iniciar sesión
                </Link>
                <Link href="/registro" className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-center text-sm font-semibold text-white">
                  Probar gratis
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ============================== HERO ============================== */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-5 pt-28 pb-16 sm:px-8">
        <div className="hero-grid" aria-hidden />
        <div className="hero-glow" aria-hidden />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
              <Sparkles size={13} className="text-[#60a5fa]" />
              El cerebro con IA para tu empresa
            </span>
          </Reveal>

          <Reveal delay={80} as="h1">
            <h1 className="mt-7 text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              El cerebro de{" "}
              <span className="hero-gradient-text">tu empresa</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">
              Preguntale a Pupi lo que sea sobre tu negocio y obtené respuestas
              al instante. Conoce tu operación de punta a punta — y puede tomar
              acciones por vos.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/registro"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-[#2563EB]/30 transition-all hover:bg-[#1d4ed8] hover:shadow-[#2563EB]/50"
              >
                Probar gratis
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#producto"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10"
              >
                <Play size={15} className="text-[#60a5fa]" />
                Ver demo
              </a>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <p className="mt-6 text-sm text-white/40">
              Sin tarjeta de crédito · Configuralo en minutos
            </p>
          </Reveal>
        </div>

        <Reveal delay={360} className="relative z-10 mt-16 flex w-full justify-center">
          <OrbitalBrain />
        </Reveal>
      </section>

      {/* ============================== SOCIAL PROOF ============================== */}
      <section className="relative border-y border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="text-center text-xs font-medium uppercase tracking-widest text-white/40">
              Empresas que confían en Pupi
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
              {TRUST_LOGOS.map((logo) => (
                <div
                  key={logo}
                  className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-white/30 grayscale transition-all hover:text-white/55"
                >
                  <Building2 size={16} />
                  <span className="whitespace-nowrap">{logo}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== PROBLEM ============================== */}
      <section id="producto" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <SectionTag>El problema</SectionTag>
            </Reveal>
            <Reveal delay={80} as="h2">
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Tu negocio está lleno de datos.
                <br />
                <span className="text-white/40">Pero nadie los entiende.</span>
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/55">
                La información vive dispersa en Excel, WhatsApp y correos.
                Tomar una buena decisión se vuelve casi imposible.
              </p>
            </Reveal>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={i * 80}>
                  <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-white/20 hover:bg-white/[0.04]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{p.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== HOW IT WORKS ============================== */}
      <section id="como-funciona" className="relative py-24 sm:py-32">
        <div className="section-glow" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <SectionTag>Cómo funciona</SectionTag>
            </Reveal>
            <Reveal delay={80} as="h2">
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                De caos a claridad en tres pasos
              </h2>
            </Reveal>
          </div>

          <div className="relative mt-16 grid gap-8 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block" />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i * 120} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-[#0A0A0F]">
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#2563EB]/20 to-transparent" />
                      <Icon size={30} className="relative text-[#60a5fa]" />
                      <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shadow-lg shadow-[#2563EB]/40">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">{s.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== FEATURES BENTO ============================== */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <SectionTag>Funcionalidades</SectionTag>
            </Reveal>
            <Reveal delay={80} as="h2">
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Todo tu negocio, un solo cerebro
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/55">
                Cada área conectada e inteligente. Pupi cruza la información para
                darte respuestas que ninguna planilla podría.
              </p>
            </Reveal>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={(i % 4) * 70} className={f.span}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.04]">
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: f.tone }}
                    />
                    <div
                      className="relative flex h-11 w-11 items-center justify-center rounded-xl border"
                      style={{ borderColor: `${f.tone}33`, background: `${f.tone}1a`, color: f.tone }}
                    >
                      <Icon size={20} />
                    </div>
                    <h3 className="relative mt-5 text-lg font-semibold">{f.title}</h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-white/55">{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== DIFFERENTIATOR ============================== */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0d1530] to-[#0A0A0F] px-6 py-16 sm:px-12 lg:px-16">
            <div className="diff-glow" aria-hidden />
            <div className="relative grid items-center gap-12 lg:grid-cols-2">
              <div>
                <Reveal>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10 px-4 py-1.5 text-xs font-semibold text-[#60a5fa]">
                    <Zap size={13} />
                    El diferencial
                  </span>
                </Reveal>
                <Reveal delay={80} as="h2">
                  <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                    No solo responde.
                    <br />
                    <span className="hero-gradient-text">Hace.</span>
                  </h2>
                </Reveal>
                <Reveal delay={160}>
                  <p className="mt-6 max-w-md text-lg leading-relaxed text-white/60">
                    Otras herramientas te muestran datos. Pupi ejecuta. Pedíselo
                    por voz o texto y se encarga — siempre con tu confirmación.
                  </p>
                </Reveal>
                <Reveal delay={240}>
                  <ul className="mt-8 space-y-3">
                    {["Actúa sobre tus datos reales", "Confirmación antes de cada acción", "Por voz o por texto, como prefieras"].map((t) => (
                      <li key={t} className="flex items-center gap-3 text-sm text-white/75">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB]/20 text-[#60a5fa]">
                          <Check size={12} />
                        </span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>

              {/* command demo */}
              <Reveal delay={200}>
                <div className="rounded-2xl border border-white/10 bg-[#0A0A0F]/80 p-5 shadow-2xl shadow-black/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1d4ed8]">
                      <Brain size={15} className="text-white" />
                    </span>
                    <span className="text-sm font-medium text-white/70">Pupi</span>
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-white/40">
                      <Mic size={12} className="text-[#60a5fa]" />
                      Escuchando
                    </span>
                  </div>

                  <div className="space-y-4 pt-5">
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-[#2563EB] px-4 py-2.5 text-sm text-white">
                        “Pupi, subile la cuota a Juan un 30% y avisale”
                      </p>
                    </div>

                    <div className="flex justify-start">
                      <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                        <p>Voy a hacer lo siguiente:</p>
                        <ul className="mt-2.5 space-y-1.5 text-white/65">
                          <li className="flex items-center gap-2">
                            <Check size={13} className="text-emerald-400" />
                            Actualizar cuota de Juan Pérez: $1.000 → $1.300
                          </li>
                          <li className="flex items-center gap-2">
                            <Check size={13} className="text-emerald-400" />
                            Enviar WhatsApp de aviso a Juan
                          </li>
                        </ul>
                        <div className="mt-3.5 flex gap-2">
                          <span className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white">Confirmar</span>
                          <span className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60">Cancelar</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <p className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
                        <Check size={14} />
                        Hecho. Cuota actualizada y Juan notificado.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== AUDIENCE ============================== */}
      <section id="nosotros" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <SectionTag>Para quién es</SectionTag>
            </Reveal>
            <Reveal delay={80} as="h2">
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Pensado para hacer crecer negocios
              </h2>
            </Reveal>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-2">
            {AUDIENCES.map((a, i) => {
              const Icon = a.icon;
              return (
                <Reveal key={a.title} delay={i * 120}>
                  <div className="group h-full rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all hover:border-white/20 hover:bg-white/[0.04] sm:p-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2563EB]/30 bg-[#2563EB]/10 text-[#60a5fa]">
                      <Icon size={26} />
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold">{a.title}</h3>
                    <p className="mt-3 text-white/55">{a.desc}</p>
                    <ul className="mt-6 space-y-3">
                      {a.points.map((p) => (
                        <li key={p} className="flex items-start gap-3 text-sm text-white/75">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/20 text-[#60a5fa]">
                            <Check size={12} />
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== PRICING ============================== */}
      <section id="precios" className="relative py-24 sm:py-32">
        <div className="section-glow" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <SectionTag>Precios</SectionTag>
            </Reveal>
            <Reveal delay={80} as="h2">
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Un plan para cada etapa
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/55">
                Todos los planes incluyen todos los módulos. Solo cambian los
                límites de uso.
              </p>
            </Reveal>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-4">
            {PRICING.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 80}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl border p-7 transition-all ${
                    plan.highlight
                      ? "border-[#2563EB]/50 bg-gradient-to-b from-[#2563EB]/10 to-white/[0.02] shadow-2xl shadow-[#2563EB]/20"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-[#2563EB]/40">
                      <Star size={11} className="fill-white" />
                      Recomendado
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1.5 text-sm text-white/50">{plan.desc}</p>
                  <div className="mt-5 flex items-end gap-1">
                    {plan.price ? (
                      <>
                        <span className="text-4xl font-bold tracking-tight">${plan.price}</span>
                        <span className="mb-1 text-sm text-white/45">/mes</span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold tracking-tight">A medida</span>
                    )}
                  </div>

                  <Link
                    href={plan.name === "Enterprise" ? "#contacto" : "/registro"}
                    className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      plan.highlight
                        ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30 hover:bg-[#1d4ed8]"
                        : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  <ul className="mt-7 space-y-3 border-t border-white/5 pt-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                        <Check size={15} className="mt-0.5 shrink-0 text-[#60a5fa]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== TESTIMONIAL ============================== */}
      <section className="relative py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <Reveal>
            <figure className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center sm:p-12">
              <Quote size={32} className="mx-auto text-[#2563EB]" />
              <blockquote className="mt-6 text-balance text-xl font-medium leading-relaxed text-white/85 sm:text-2xl">
                “Pupi nos dio en minutos la claridad que antes nos llevaba
                semanas. Es como tener un analista que nunca duerme.”
              </blockquote>
              <figcaption className="mt-6 flex items-center justify-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] text-sm font-semibold">
                  MG
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold">María González</p>
                  <p className="text-xs text-white/50">Directora, Distribuidora Norte</p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* ============================== FINAL CTA ============================== */}
      <section id="contacto" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-[#2563EB]/20 bg-gradient-to-b from-[#0d1530] to-[#0A0A0F] px-6 py-16 text-center sm:px-12 sm:py-20">
              <div className="cta-glow" aria-hidden />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Dale a tu empresa el cerebro que se merece
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">
                  Empezá gratis hoy. En minutos vas a estar conversando con tu
                  negocio.
                </p>

                <form
                  className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row"
                  action="/registro"
                  method="get"
                >
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="tu@empresa.com"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 backdrop-blur-sm transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  />
                  <button
                    type="submit"
                    className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/30 transition-all hover:bg-[#1d4ed8] hover:shadow-[#2563EB]/50"
                  >
                    Empezar gratis
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/45">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-[#60a5fa]" />
                    Datos seguros
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check size={13} className="text-[#60a5fa]" />
                    Sin tarjeta de crédito
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={13} className="text-[#60a5fa]" />
                    Configuralo en minutos
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer className="relative border-t border-white/10 py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_2fr]">
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1d4ed8]">
                  <Brain size={18} className="text-white" />
                </span>
                <span className="text-[17px] font-semibold tracking-tight">Pupi AI</span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
                El cerebro con inteligencia artificial que conoce tu empresa de
                punta a punta.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {FOOTER_COLUMNS.map((col) => (
                <div key={col.title}>
                  <p className="text-sm font-semibold text-white/90">{col.title}</p>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-sm text-white/45 transition-colors hover:text-white/80">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Pupi AI. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-3">
              {["X", "in", "IG"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-xs font-semibold text-white/50 transition-colors hover:border-white/25 hover:text-white"
                  aria-label={s}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ============================== STYLES ============================== */}
      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .reveal-in {
          opacity: 1;
          transform: none;
        }
        .text-balance {
          text-wrap: balance;
        }

        /* hero background */
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 35%, #000 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 35%, #000 30%, transparent 75%);
        }
        .hero-glow {
          position: absolute;
          left: 50%;
          top: -10%;
          height: 700px;
          width: 1100px;
          max-width: 130vw;
          transform: translateX(-50%);
          background: radial-gradient(
            ellipse 50% 50% at 50% 50%,
            rgba(37, 99, 235, 0.28),
            transparent 70%
          );
          filter: blur(20px);
          pointer-events: none;
        }
        .hero-gradient-text {
          background: linear-gradient(120deg, #60a5fa 0%, #2563eb 45%, #818cf8 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradient-pan 6s ease infinite;
        }
        @keyframes gradient-pan {
          0%,
          100% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
        }

        .section-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          height: 500px;
          width: 800px;
          max-width: 100vw;
          transform: translate(-50%, -50%);
          background: radial-gradient(ellipse 50% 50% at 50% 50%, rgba(37, 99, 235, 0.1), transparent 70%);
          pointer-events: none;
        }
        .diff-glow {
          position: absolute;
          right: -10%;
          top: -20%;
          height: 500px;
          width: 500px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.35), transparent 65%);
          filter: blur(40px);
          pointer-events: none;
        }
        .cta-glow {
          position: absolute;
          left: 50%;
          bottom: -60%;
          height: 600px;
          width: 900px;
          max-width: 120vw;
          transform: translateX(-50%);
          background: radial-gradient(ellipse 50% 50% at 50% 50%, rgba(37, 99, 235, 0.4), transparent 70%);
          filter: blur(30px);
          pointer-events: none;
        }

        /* orbital brain */
        .orbit-stage {
          position: relative;
          width: min(100%, 520px);
          aspect-ratio: 1;
          height: auto;
          margin: 0 auto;
        }
        .orbit-bg-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 72%;
          height: 72%;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(37, 99, 235, 0.12) 0%,
            transparent 70%
          );
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .orbit-rotor {
          position: absolute;
          inset: 0;
          animation: orbit-spin 48s linear infinite;
        }
        .orbit-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }
        .orbit-line {
          stroke: rgba(37, 99, 235, 0.25);
          stroke-width: 1;
          stroke-dasharray: 4 4;
          animation: orbit-line-flow 2s linear infinite;
        }
        .orbit-track {
          fill: none;
          stroke: rgba(37, 99, 235, 0.08);
          stroke-width: 1;
        }
        .orbit-center-node {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(37, 99, 235, 0.9) 0%,
            rgba(37, 99, 235, 0.6) 60%,
            rgba(37, 99, 235, 0.1) 100%
          );
          box-shadow:
            0 0 60px rgba(37, 99, 235, 0.6),
            0 0 120px rgba(37, 99, 235, 0.3),
            0 0 200px rgba(37, 99, 235, 0.1);
          transform: translate(-50%, -50%);
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .orbit-center-label {
          margin-top: 4px;
          font-size: 13px;
          font-weight: 500;
          color: #ffffff;
          line-height: 1;
        }
        .orbit-module {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 10;
          width: 72px;
          height: 72px;
          margin-left: -36px;
          margin-top: -36px;
          cursor: pointer;
          transition: filter 300ms;
        }
        .orbit-module-inner {
          width: 100%;
          height: 100%;
          animation: orbit-counter-spin 48s linear infinite;
        }
        .orbit-module-upright {
          width: 100%;
          height: 100%;
        }
        .orbit-module-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(15, 15, 25, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          transition: all 300ms;
          animation: float-node 4s ease-in-out infinite;
        }
        .orbit-module:hover .orbit-module-content {
          transform: scale(1.1);
          border-color: var(--module-color);
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.4),
            0 0 20px color-mix(in srgb, var(--module-color) 30%, transparent);
        }
        .orbit-module-label {
          font-size: 10px;
          font-weight: 500;
          color: #ffffff;
          white-space: nowrap;
        }
        @keyframes orbit-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes orbit-counter-spin {
          to {
            transform: rotate(-360deg);
          }
        }
        @keyframes pulse-glow {
          0% {
            box-shadow:
              0 0 60px rgba(37, 99, 235, 0.6),
              0 0 120px rgba(37, 99, 235, 0.3),
              0 0 200px rgba(37, 99, 235, 0.1);
          }
          50% {
            box-shadow:
              0 0 80px rgba(37, 99, 235, 0.9),
              0 0 140px rgba(37, 99, 235, 0.4),
              0 0 220px rgba(37, 99, 235, 0.15);
          }
          100% {
            box-shadow:
              0 0 60px rgba(37, 99, 235, 0.6),
              0 0 120px rgba(37, 99, 235, 0.3),
              0 0 200px rgba(37, 99, 235, 0.1);
          }
        }
        @keyframes orbit-line-flow {
          to {
            stroke-dashoffset: -20;
          }
        }
        @keyframes float-node {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
          100% {
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .orbit-center-node {
            width: 96px;
            height: 96px;
          }
          .orbit-center-label {
            font-size: 11px;
          }
          .orbit-module {
            width: 60px;
            height: 60px;
            margin-left: -30px;
            margin-top: -30px;
          }
          .orbit-module-content {
            width: 60px;
            height: 60px;
          }
          .orbit-module-label {
            font-size: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
          .orbit-rotor,
          .orbit-module-inner,
          .orbit-module-content,
          .orbit-center-node,
          .orbit-line,
          .hero-gradient-text {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function SectionTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-[#60a5fa]">
      {children}
    </span>
  );
}
