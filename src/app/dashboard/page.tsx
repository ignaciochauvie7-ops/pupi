"use client"

import { useState, useEffect, useRef } from "react"
import {
  Users,
  TrendingUp,
  Megaphone,
  UserCheck,
  Calculator,
  LayoutDashboard,
} from "lucide-react"

type Status = "completed" | "in-progress" | "pending"

interface TimelineItem {
  id: number
  title: string
  date: string
  content: string
  category: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  relatedIds: number[]
  status: Status
  energy: number
}

const timelineData: TimelineItem[] = [
  {
    id: 1,
    title: "CRM",
    date: "",
    content: "Clientes, historial y temperatura de compra",
    category: "crm",
    icon: Users,
    relatedIds: [2, 5],
    status: "completed",
    energy: 90,
  },
  {
    id: 2,
    title: "Ventas",
    date: "",
    content: "Pipeline, pronóstico y comisiones",
    category: "ventas",
    icon: TrendingUp,
    relatedIds: [1, 3, 6],
    status: "completed",
    energy: 75,
  },
  {
    id: 3,
    title: "Marketing",
    date: "",
    content: "Campañas, insights y análisis",
    category: "marketing",
    icon: Megaphone,
    relatedIds: [2, 1],
    status: "completed",
    energy: 60,
  },
  {
    id: 4,
    title: "RRHH",
    date: "",
    content: "Equipo, desempeño y satisfacción",
    category: "rrhh",
    icon: UserCheck,
    relatedIds: [5, 6],
    status: "completed",
    energy: 80,
  },
  {
    id: 5,
    title: "Contabilidad",
    date: "",
    content: "Ingresos, gastos y flujo de caja",
    category: "contabilidad",
    icon: Calculator,
    relatedIds: [1, 2, 4],
    status: "in-progress",
    energy: 45,
  },
  {
    id: 6,
    title: "Workspace",
    date: "",
    content: "Tareas, alertas y resumen diario",
    category: "workspace",
    icon: LayoutDashboard,
    relatedIds: [1, 2, 3, 4, 5],
    status: "completed",
    energy: 95,
  },
]

const STATUS_COLORS: Record<Status, string> = {
  completed: "#22c55e",
  "in-progress": "#f59e0b",
  pending: "#6b7280",
}

const ORBIT_RADIUS = 220

type Temp = "Todos" | "Caliente" | "Tibio" | "Frío"

interface Client {
  id: number
  name: string
  company: string
  temp: "Caliente" | "Tibio" | "Frío"
  lastContact: string
  ticket: string
  seller: string
}

const CRM_CLIENTS: Client[] = [
  { id: 1, name: "María González",  company: "Distribuidora Norte", temp: "Caliente", lastContact: "Hace 2 días",  ticket: "$4.200",  seller: "MR" },
  { id: 2, name: "Carlos Mendoza",  company: "Tech Solutions",      temp: "Tibio",    lastContact: "Hace 8 días",  ticket: "$12.800", seller: "JP" },
  { id: 3, name: "Ana Rodríguez",   company: "Sin empresa",         temp: "Frío",     lastContact: "Hace 31 días", ticket: "$890",    seller: "MR" },
  { id: 4, name: "Luis Herrera",    company: "Grupo Herrera SA",    temp: "Caliente", lastContact: "Hace 1 día",   ticket: "$28.500", seller: "CA" },
  { id: 5, name: "Sofía Martínez",  company: "Retail Express",      temp: "Tibio",    lastContact: "Hace 12 días", ticket: "$3.100",  seller: "JP" },
  { id: 6, name: "Diego López",     company: "Importadora DL",      temp: "Caliente", lastContact: "Hace 3 días",  ticket: "$9.750",  seller: "CA" },
  { id: 7, name: "Valentina Cruz",  company: "Sin empresa",         temp: "Frío",     lastContact: "Hace 45 días", ticket: "$560",    seller: "MR" },
  { id: 8, name: "Martín Pérez",    company: "Constructora MP",     temp: "Tibio",    lastContact: "Hace 7 días",  ticket: "$15.200", seller: "JP" },
]

const TEMP_STYLES: Record<"Caliente" | "Tibio" | "Frío", { bg: string; color: string; emoji: string }> = {
  Caliente: { bg: "rgba(239,68,68,0.15)",   color: "#ef4444",  emoji: "🔴" },
  Tibio:    { bg: "rgba(234,179,8,0.15)",   color: "#eab308",  emoji: "🟡" },
  Frío:     { bg: "rgba(37,99,235,0.15)",   color: "#60a5fa",  emoji: "🔵" },
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("")
}

export default function DashboardPage() {
  const [activeNode, setActiveNode] = useState<TimelineItem | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)
  const [transformOrigin, setTransformOrigin] = useState("50% 50%")
  const [rotation, setRotation] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [centerHovered, setCenterHovered] = useState(false)
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null)
  const [crmClients, setCrmClients] = useState<Client[]>(CRM_CLIENTS)
  const [crmView, setCrmView] = useState<"list" | "detail" | "new" | "import" | "duplicates" | "map">("list")
  const [mapPinHover, setMapPinHover] = useState<number | null>(null)
  const [showDupBanner, setShowDupBanner] = useState(true)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [visitBtnHover, setVisitBtnHover] = useState(false)
  const [dupResolved, setDupResolved] = useState<boolean[]>([false, false])
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1)
  const [importFile, setImportFile] = useState(false)
  const [importDropHover, setImportDropHover] = useState(false)
  const [crmListMode, setCrmListMode] = useState<"Lista" | "Ranking">("Lista")
  const [crmGroupBy, setCrmGroupBy] = useState<"todos" | "empresa">("todos")
  const [crmTempFilter, setCrmTempFilter] = useState<Temp>("Todos")
  const [crmSearch, setCrmSearch] = useState("")
  const [crmSelectedClient, setCrmSelectedClient] = useState<Client | null>(null)
  const [crmTab, setCrmTab] = useState<"Historial" | "Ciclo de vida" | "Interacciones" | "Documentos" | "Notas">("Historial")
  const [crmBarHover, setCrmBarHover] = useState<number | null>(null)
  const [crmInterFilter, setCrmInterFilter] = useState<"Todas" | "Llamada" | "Visita" | "Email" | "Compra">("Todas")
  const [crmShowRegisterForm, setCrmShowRegisterForm] = useState(false)
  const [crmRegisterType, setCrmRegisterType] = useState<"Llamada" | "Visita" | "Email" | "Compra">("Llamada")
  const [crmRegisterNote, setCrmRegisterNote] = useState("")
  const [crmRegisterAmount, setCrmRegisterAmount] = useState("")
  // New client form
  const [newName, setNewName] = useState("")
  const [newCompany, setNewCompany] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [newTemp, setNewTemp] = useState<"Caliente" | "Tibio" | "Frío">("Tibio")
  const [newTags, setNewTags] = useState("")
  const [newSeller, setNewSeller] = useState("MR")
  const [newTicket, setNewTicket] = useState("")
  const [newFrequency, setNewFrequency] = useState("")
  const [newB2B, setNewB2B] = useState("")
  const [newNotes, setNewNotes] = useState("")
  const [newStreet, setNewStreet] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newCountry, setNewCountry] = useState("")

  const resetNewForm = () => {
    setNewName(""); setNewCompany(""); setNewEmail(""); setNewPhone("")
    setNewLocation(""); setNewTemp("Tibio"); setNewTags(""); setNewSeller("MR")
    setNewTicket(""); setNewFrequency(""); setNewB2B(""); setNewNotes("")
    setNewStreet(""); setNewCity(""); setNewCountry("")
  }

  const saveNewClient = () => {
    if (!newName.trim()) return
    const client: Client = {
      id: Date.now(),
      name: newName.trim(),
      company: newCompany.trim() || "Sin empresa",
      temp: newTemp,
      lastContact: "Hoy",
      ticket: newTicket ? `$${newTicket}` : "$0",
      seller: newSeller,
    }
    setCrmClients((prev) => [client, ...prev])
    resetNewForm()
    setCrmView("list")
  }
  const animationRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (activeNode) {
      const raf = requestAnimationFrame(() => setPanelVisible(true))
      return () => cancelAnimationFrame(raf)
    } else {
      setPanelVisible(false)
    }
  }, [activeNode])

  const openPanel = (node: TimelineItem, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const nx = rect.left + rect.width / 2
    const ny = rect.top + rect.height / 2
    // Panel is fixed: top 40px, left 40px
    const originX = nx - 40
    const originY = ny - 40
    setTransformOrigin(`${originX}px ${originY}px`)
    setActiveNode(node)
    setIsPaused(true)
  }

  const closePanel = () => {
    setPanelVisible(false)
    setTimeout(() => {
      setActiveNode(null)
      setIsPaused(false)
    }, 250)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current !== undefined && !isPaused) {
        const delta = time - lastTimeRef.current
        setRotation((prev) => (prev + delta * 0.008) % 360)
      }
      lastTimeRef.current = time
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPaused])

  const nodePositions = timelineData.map((item, index) => {
    const angle = (index / timelineData.length) * 360 + rotation
    const rad = (angle * Math.PI) / 180
    return {
      ...item,
      x: Math.cos(rad) * ORBIT_RADIUS,
      y: Math.sin(rad) * ORBIT_RADIUS,
    }
  })

  const containerSize = ORBIT_RADIUS * 2 + 140

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: "#0A0A0F" }}
      onClick={(e) => {
        if (showVoiceInput && (e.target as HTMLElement).closest("[data-voice-input]") === null) {
          setShowVoiceInput(false)
        }
      }}
    >
      {/* Logo */}
      <div className="absolute top-6 left-8 z-20">
        <span style={{ color: "white", fontWeight: 700 }}>Pupi</span>
        <span style={{ color: "#2563EB", fontWeight: 400 }}> AI</span>
      </div>

      {/* Orbital container */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          if (!activeNode) setIsPaused(false)
        }}
      >
        {/* SVG layer: rings + lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={containerSize}
          height={containerSize}
          viewBox={`${-containerSize / 2} ${-containerSize / 2} ${containerSize} ${containerSize}`}
        >
          <circle
            cx="0" cy="0" r={ORBIT_RADIUS * 0.6}
            fill="none" stroke="rgba(37,99,235,0.06)" strokeWidth="1"
          />
          <circle
            cx="0" cy="0" r={ORBIT_RADIUS}
            fill="none" stroke="rgba(37,99,235,0.12)" strokeWidth="1" strokeDasharray="5 5"
          />
          {nodePositions.map((node) => {
            const isActive = activeNode?.id === node.id
            const isRelated = activeNode?.relatedIds.includes(node.id) ?? false
            let stroke = "rgba(37,99,235,0.15)"
            let strokeWidth = 1
            if (isActive) { stroke = "rgba(37,99,235,0.6)"; strokeWidth = 1.5 }
            else if (isRelated) { stroke = "rgba(37,99,235,0.35)" }
            return (
              <line
                key={`center-line-${node.id}`}
                x1={node.x} y1={node.y} x2={0} y2={0}
                stroke={stroke} strokeWidth={strokeWidth}
              />
            )
          })}
          {activeNode &&
            nodePositions
              .filter((node) => activeNode.relatedIds.includes(node.id))
              .map((node) => {
                const origin = nodePositions.find((n) => n.id === activeNode.id)!
                return (
                  <line
                    key={`rel-line-${node.id}`}
                    x1={origin.x} y1={origin.y} x2={node.x} y2={node.y}
                    stroke="rgba(37,99,235,0.4)" strokeWidth="1"
                  />
                )
              })}
        </svg>

        {/* Center circle */}
        <div className="relative z-10">
          {centerHovered && !showVoiceInput && (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
                left: "50%",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                color: "rgba(255,255,255,0.7)",
                fontSize: 11,
                pointerEvents: "none",
              }}
            >
              Hablá con Pupi
            </div>
          )}
          <div
            className="rounded-full cursor-pointer"
            style={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              overflow: "hidden",
              backgroundImage: "url(/pupi-logo-circle.png)",
              backgroundSize: "108%",
              backgroundPosition: "center center",
              backgroundRepeat: "no-repeat",
              boxShadow: centerHovered
                ? "0 0 40px #2563EB, 0 0 90px rgba(37,99,235,0.5)"
                : "0 0 30px #2563EB, 0 0 70px rgba(37,99,235,0.35)",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={() => setCenterHovered(true)}
            onMouseLeave={() => setCenterHovered(false)}
            onClick={() => setShowVoiceInput((v) => !v)}
          />
        </div>

        {/* Nodes */}
        {nodePositions.map((node) => {
          const Icon = node.icon
          const isActive = activeNode?.id === node.id
          const isRelated = activeNode?.relatedIds.includes(node.id) ?? false
          const isHovered = hoveredNodeId === node.id
          const isAlert = node.status === "in-progress"

          let glowColor = "rgba(37,99,235,0.15)"
          let glowSize = "0 0 12px"
          if (isAlert) glowColor = "rgba(239,68,68,0.3)"
          if (isHovered) {
            glowColor = isAlert ? "rgba(239,68,68,0.5)" : "rgba(37,99,235,0.4)"
            glowSize = "0 0 20px"
          }
          if (isActive) {
            glowColor = "rgba(37,99,235,0.7)"
            glowSize = "0 0 30px"
          }

          return (
            <button
              key={node.id}
              className="absolute flex flex-col items-center gap-1 z-10"
              style={{
                top: "50%",
                left: "50%",
                transform: `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))`,
                opacity: activeNode && !isActive && !isRelated ? 0.3 : 1,
                transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={(e) => {
                if (isActive) {
                  closePanel()
                } else {
                  openPanel(node, e)
                }
              }}
            >
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 62,
                  height: 62,
                  backgroundColor: isActive
                    ? "#2563EB"
                    : isRelated
                    ? "rgba(37,99,235,0.25)"
                    : "rgba(37,99,235,0.1)",
                  border: `1px solid ${isActive ? "#2563EB" : isAlert ? "rgba(239,68,68,0.4)" : "rgba(37,99,235,0.3)"}`,
                  boxShadow: `${glowSize} ${glowColor}`,
                  transform: isActive ? "scale(1.12)" : isHovered ? "scale(1.07)" : "scale(1)",
                  transition: "background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.4s ease, transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)",
                }}
              >
                <Icon size={26} style={{ color: "white" }} />
              </div>
              <span style={{ color: "white", fontSize: 13, whiteSpace: "nowrap" }}>
                {node.title}
              </span>
              <span style={{ fontSize: 11, color: STATUS_COLORS[node.status], whiteSpace: "nowrap" }}>
                {node.status === "completed" ? "Activo" : node.status === "in-progress" ? "Alerta" : "Inactivo"}
              </span>
            </button>
          )
        })}
      </div>

      {/* Voice input bar */}
      {showVoiceInput && (
        <div
          data-voice-input
          className="absolute z-30"
          style={{
            bottom: "calc(50% + 80px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 360,
          }}
        >
          <input
            autoFocus
            type="text"
            placeholder="Preguntale algo a Pupi..."
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: "rgba(10,10,15,0.97)",
              border: "1px solid #2563EB",
              borderRadius: 12,
              color: "white",
              fontSize: 14,
              outline: "none",
              boxShadow: "0 0 20px rgba(37,99,235,0.25)",
            }}
          />
        </div>
      )}

      {/* Overlay */}
      <div
        onClick={closePanel}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 40,
          opacity: panelVisible ? 1 : 0,
          pointerEvents: activeNode ? "auto" : "none",
          transition: "opacity 300ms ease-out",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 40,
          left: 40,
          width: "calc(100vw - 80px)",
          height: "calc(100vh - 80px)",
          backgroundColor: "#0D0D14",
          border: "1px solid rgba(37,99,235,0.15)",
          borderRadius: 16,
          zIndex: 50,
          transform: panelVisible ? "scale(1)" : "scale(0)",
          transformOrigin: transformOrigin,
          transition: panelVisible
            ? "transform 420ms cubic-bezier(0.16, 1, 0.3, 1)"
            : "transform 220ms cubic-bezier(0.4, 0, 1, 1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pointerEvents: activeNode ? "auto" : "none",
        }}
      >
        {activeNode && (() => {
          const Icon = activeNode.icon
          return (
            <>
              {/* Header */}
              <div
                style={{
                  height: 64,
                  padding: "0 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={closePanel}
                    style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, lineHeight: 1, background: "none", border: "none", cursor: "pointer", padding: "4px 6px", transition: "color 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                  >←</button>
                  <Icon size={18} style={{ color: "#2563EB" }} />
                  {activeNode.id === 1 && crmView === "detail" && crmSelectedClient ? (
                    <>
                      <button onClick={() => { setCrmView("list"); setCrmTab("Historial") }} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{activeNode.title}</button>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{crmSelectedClient.name}</span>
                    </>
                  ) : activeNode.id === 1 && crmView === "new" ? (
                    <>
                      <button onClick={() => { setCrmView("list"); resetNewForm() }} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{activeNode.title}</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Nuevo cliente</span>
                    </>
                  ) : activeNode.id === 1 && crmView === "import" ? (
                    <>
                      <button onClick={() => { setCrmView("list"); setImportStep(1); setImportFile(false) }} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{activeNode.title}</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Importar clientes</span>
                    </>
                  ) : activeNode.id === 1 && crmView === "duplicates" ? (
                    <>
                      <button onClick={() => setCrmView("list")} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{activeNode.title}</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Duplicados detectados</span>
                    </>
                  ) : activeNode.id === 1 && crmView === "map" ? (
                    <>
                      <button onClick={() => setCrmView("list")} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{activeNode.title}</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Mapa de clientes</span>
                    </>
                  ) : (
                    <span style={{ color: "white", fontSize: 16, fontWeight: 500 }}>{activeNode.title}</span>
                  )}
                </div>
                <button
                  onClick={closePanel}
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 24,
                    lineHeight: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                >
                  ×
                </button>
              </div>

              {/* Body */}
              {activeNode.id === 1 ? (
                // ── CRM MODULE ──
                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                  {crmView === "detail" && crmSelectedClient ? (
                    // ── CLIENT DETAIL VIEW ──
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
                      {/* Two columns */}
                      <div style={{ flex: 1, display: "flex", gap: 24, padding: "24px", overflow: "hidden" }}>

                        {/* Left column — client card */}
                        <div style={{ width: "35%", flexShrink: 0, overflowY: "auto" }}>
                          {(() => {
                            const c = crmSelectedClient
                            const ts = TEMP_STYLES[c.temp]
                            return (
                              <>
                                {/* Avatar + name */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 16 }}>
                                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(37,99,235,0.2)", color: "#2563EB", fontSize: 18, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {getInitials(c.name)}
                                  </div>
                                  <div style={{ color: "white", fontSize: 16, fontWeight: 500, textAlign: "center" }}>{c.name}</div>
                                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center" }}>{c.company}</div>
                                  <div style={{ background: ts.bg, color: ts.color, fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>{c.temp}</div>
                                </div>

                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0 0 16px" }} />

                                {/* Info rows */}
                                {[
                                  ["ÚLTIMO CONTACTO", c.lastContact],
                                  ["TICKET PROMEDIO", c.ticket],
                                  ["FRECUENCIA DE COMPRA", "Cada 28 días"],
                                  ["VENDEDOR ASIGNADO", `${c.seller} — María Ruiz`],
                                  ["ETIQUETA", "Cliente VIP"],
                                ].map(([label, value]) => (
                                  <div key={label} style={{ marginBottom: 12 }}>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</div>
                                    <div style={{ color: "white", fontSize: 13 }}>{value}</div>
                                  </div>
                                ))}

                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "16px 0" }} />

                                {/* AI section */}
                                <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>✦ Inteligencia Pupi</div>

                                {/* Temperature bar */}
                                {(() => {
                                  const fillPct = c.temp === "Caliente" ? 90 : c.temp === "Tibio" ? 50 : 15
                                  const fillColor = c.temp === "Caliente" ? "#ef4444" : c.temp === "Tibio" ? "#eab308" : "#3b82f6"
                                  return (
                                    <div style={{ marginBottom: 14 }}>
                                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Temperatura</div>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
                                          <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${fillPct}%`, borderRadius: 3, background: "linear-gradient(to right, #3b82f6, #ef4444)" }} />
                                        </div>
                                        <span style={{ color: fillColor, fontSize: 11, flexShrink: 0 }}>{c.temp}</span>
                                      </div>
                                    </div>
                                  )
                                })()}

                                {/* Card 1 — Próxima compra */}
                                <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Próxima compra</span>
                                  </div>
                                  <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>En 6 días</div>
                                </div>

                                {/* Card 2 — Riesgo de abandono */}
                                {(() => {
                                  const riskColor = c.temp === "Caliente" ? "#22c55e" : c.temp === "Tibio" ? "#eab308" : "#ef4444"
                                  const riskLabel = c.temp === "Caliente" ? "Bajo" : c.temp === "Tibio" ? "Medio" : "Alto"
                                  return (
                                    <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={riskColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Riesgo de abandono</span>
                                      </div>
                                      <div style={{ color: riskColor, fontSize: 13, fontWeight: 500 }}>{riskLabel}</div>
                                    </div>
                                  )
                                })()}

                                {/* Card 3 — Valor del cliente */}
                                <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Valor del cliente</span>
                                  </div>
                                  <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>Alto — top 15%</div>
                                </div>

                                {/* Card 4 — Acción sugerida */}
                                <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Acción sugerida</span>
                                  </div>
                                  <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Llamar esta semana</div>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>No compra desde hace 28 días, su ciclo promedio es 28 días</div>
                                </div>
                              </>
                            )
                          })()}

                          {/* Preparar visita button */}
                          <button
                            onClick={() => setShowVisitModal(true)}
                            onMouseEnter={() => setVisitBtnHover(true)}
                            onMouseLeave={() => setVisitBtnHover(false)}
                            style={{
                              width: "100%", marginTop: 12,
                              background: visitBtnHover ? "rgba(37,99,235,0.18)" : "rgba(37,99,235,0.1)",
                              border: `1px solid ${visitBtnHover ? "rgba(37,99,235,0.4)" : "rgba(37,99,235,0.25)"}`,
                              borderRadius: 8, padding: "10px 16px",
                              display: "flex", alignItems: "center", gap: 8,
                              cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span style={{ color: "#2563EB", fontSize: 13, fontWeight: 500 }}>Preparar visita</span>
                          </button>
                        </div>

                        {/* Right column — tabs */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          {/* Tab bar */}
                          <div style={{ display: "flex", gap: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 20, flexShrink: 0 }}>
                            {(["Historial", "Ciclo de vida", "Interacciones", "Documentos", "Notas"] as const).map((tab) => (
                              <button
                                key={tab}
                                onClick={() => setCrmTab(tab)}
                                style={{
                                  background: "none", border: "none", cursor: "pointer",
                                  fontSize: 13, paddingBottom: 8,
                                  color: crmTab === tab ? "white" : "rgba(255,255,255,0.35)",
                                  borderBottom: crmTab === tab ? "2px solid #2563EB" : "2px solid transparent",
                                  transition: "color 0.15s, border-color 0.15s",
                                }}
                              >{tab}</button>
                            ))}
                          </div>

                          {/* Tab content */}
                          <div style={{ flex: 1, overflowY: "auto" }}>

                            {crmTab === "Historial" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                                {[
                                  ["Compra realizada — $4.200", "Hace 2 días"],
                                  ["Llamada de seguimiento", "Hace 9 días"],
                                  ["Email — propuesta enviada", "Hace 15 días"],
                                  ["Visita presencial", "Hace 28 días"],
                                  ["Primera compra — $3.800", "Hace 56 días"],
                                ].map(([action, date], i) => (
                                  <div key={i} style={{ display: "flex", gap: 16, paddingBottom: 20, position: "relative" }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB", marginTop: 4, flexShrink: 0 }} />
                                      <div style={{ width: 1, flex: 1, background: "rgba(37,99,235,0.3)", marginTop: 4 }} />
                                    </div>
                                    <div style={{ paddingBottom: 4 }}>
                                      <div style={{ color: "white", fontSize: 13, marginBottom: 4 }}>{action}</div>
                                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{date}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {crmTab === "Ciclo de vida" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                {/* Stat boxes */}
                                <div style={{ display: "flex", gap: 12 }}>
                                  {[
                                    { label: "Cliente desde", value: "56 días" },
                                    { label: "Total compras", value: "$8.000" },
                                    { label: "Interacciones", value: "5 contactos" },
                                  ].map(({ label, value }) => (
                                    <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px" }}>
                                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 6 }}>{label}</div>
                                      <div style={{ color: "white", fontSize: 18, fontWeight: 600 }}>{value}</div>
                                    </div>
                                  ))}
                                </div>

                                {/* Horizontal milestone timeline */}
                                <div>
                                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Hitos del ciclo</div>
                                  <div style={{ position: "relative", paddingTop: 48 }}>
                                    {/* Connector line */}
                                    <div style={{ position: "absolute", top: "calc(48px + 6px)", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.08)" }} />
                                    {(() => {
                                      const milestones = [
                                        { label: "Primer contacto",        sub: "Hace 56 días",     done: true,  above: true  },
                                        { label: "Primera compra $3.800",  sub: "Hace 56 días",     done: true,  above: false },
                                        { label: "Visita presencial",      sub: "Hace 28 días",     done: true,  above: true  },
                                        { label: "Compra reciente $4.200", sub: "Hace 2 días",      done: true,  above: false },
                                        { label: "Próxima compra estimada",sub: "En 6 días",        done: false, above: true  },
                                      ]
                                      return (
                                        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                                          {milestones.map((m, i) => (
                                            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}>
                                              {/* Above label */}
                                              <div style={{
                                                position: "absolute", top: m.above ? -40 : undefined, bottom: m.above ? undefined : -36,
                                                textAlign: "center", width: "100%",
                                              }}>
                                                {m.above && (
                                                  <>
                                                    <div style={{ color: m.done ? "white" : "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: m.done ? 500 : 400, lineHeight: 1.3 }}>{m.label}</div>
                                                    <div style={{ color: m.done ? "#2563EB" : "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 2 }}>{m.sub}</div>
                                                  </>
                                                )}
                                              </div>
                                              {/* Dot */}
                                              <div style={{
                                                width: 12, height: 12, borderRadius: "50%",
                                                background: m.done ? "#2563EB" : "transparent",
                                                border: m.done ? "none" : "2px solid rgba(255,255,255,0.2)",
                                                zIndex: 1, flexShrink: 0,
                                                boxShadow: m.done ? "0 0 8px rgba(37,99,235,0.6)" : "none",
                                              }} />
                                              {/* Below label */}
                                              {!m.above && (
                                                <div style={{ position: "absolute", top: 20, textAlign: "center", width: "100%" }}>
                                                  <div style={{ color: m.done ? "white" : "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: m.done ? 500 : 400, lineHeight: 1.3 }}>{m.label}</div>
                                                  <div style={{ color: m.done ? "#2563EB" : "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 2 }}>{m.sub}</div>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )
                                    })()}
                                  </div>
                                </div>

                                {/* Bar chart */}
                                <div style={{ marginTop: 32 }}>
                                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Evolución de compras</div>
                                  {(() => {
                                    const bars = [
                                      { label: "Oct", amount: "$1.200", value: 1200 },
                                      { label: "Nov", amount: "$2.400", value: 2400 },
                                      { label: "Dic", amount: "$3.800", value: 3800 },
                                      { label: "Ene", amount: "$2.100", value: 2100 },
                                      { label: "Feb", amount: "$4.200", value: 4200 },
                                    ]
                                    const maxVal = Math.max(...bars.map(b => b.value))
                                    return (
                                      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 120 }}>
                                        {bars.map((b, i) => {
                                          const h = Math.round((b.value / maxVal) * 100)
                                          const hovered = crmBarHover === i
                                          return (
                                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}
                                              onMouseEnter={() => setCrmBarHover(i)}
                                              onMouseLeave={() => setCrmBarHover(null)}
                                            >
                                              {hovered && (
                                                <div style={{ color: "white", fontSize: 10, fontWeight: 600, background: "rgba(37,99,235,0.8)", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap" }}>{b.amount}</div>
                                              )}
                                              <div style={{
                                                width: "100%", height: `${h}%`,
                                                background: hovered ? "#2563EB" : "rgba(37,99,235,0.35)",
                                                borderRadius: "4px 4px 0 0",
                                                transition: "background 0.15s, height 0.2s",
                                              }} />
                                              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{b.label}</div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            )}

                            {crmTab === "Interacciones" && (() => {
                              type InterType = "Llamada" | "Visita" | "Email" | "Compra"
                              const INTERACTIONS: { type: InterType; title: string; date: string; amount?: string }[] = [
                                { type: "Compra",  title: "Compra realizada",               date: "Hace 2 días",  amount: "$4.200" },
                                { type: "Llamada", title: "Llamada de seguimiento",         date: "Hace 9 días"  },
                                { type: "Email",   title: "Propuesta enviada por email",    date: "Hace 15 días" },
                                { type: "Visita",  title: "Visita presencial en oficina",   date: "Hace 28 días" },
                                { type: "Llamada", title: "Llamada inicial",                date: "Hace 56 días" },
                              ]
                              const TYPE_META: Record<InterType, { color: string; icon: React.ReactNode }> = {
                                Llamada: { color: "#2563EB", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
                                Visita:  { color: "#22c55e", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
                                Email:   { color: "#eab308", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                                Compra:  { color: "#a855f7", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
                              }
                              const filtered = crmInterFilter === "Todas" ? INTERACTIONS : INTERACTIONS.filter(i => i.type === crmInterFilter)
                              return (
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  {/* Filter pills */}
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                                    {(["Todas", "Llamada", "Visita", "Email", "Compra"] as const).map((f) => (
                                      <button key={f} onClick={() => setCrmInterFilter(f)} style={{
                                        padding: "4px 10px", borderRadius: 20, fontSize: 11, border: "none", cursor: "pointer",
                                        background: crmInterFilter === f ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.06)",
                                        color: crmInterFilter === f ? "#2563EB" : "rgba(255,255,255,0.5)",
                                        transition: "background 0.15s, color 0.15s",
                                      }}>{f}</button>
                                    ))}
                                  </div>

                                  {/* Interaction list */}
                                  {filtered.map((item, i) => {
                                    const meta = TYPE_META[item.type]
                                    return (
                                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${meta.color}1a`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                          {meta.icon}
                                        </div>
                                        <div>
                                          <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{item.title}</div>
                                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{item.date}</div>
                                          {item.amount && <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>{item.amount}</div>}
                                        </div>
                                      </div>
                                    )
                                  })}

                                  {/* Register button + inline form */}
                                  <div style={{ marginTop: 16 }}>
                                    <button
                                      onClick={() => setCrmShowRegisterForm((v) => !v)}
                                      style={{ border: "1px solid rgba(37,99,235,0.3)", color: "#2563EB", fontSize: 12, borderRadius: 6, padding: "7px 14px", background: "none", cursor: "pointer" }}
                                    >+ Registrar interacción</button>

                                    {crmShowRegisterForm && (
                                      <div style={{ marginTop: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                        <select
                                          value={crmRegisterType}
                                          onChange={(e) => setCrmRegisterType(e.target.value as InterType)}
                                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "white", fontSize: 13, padding: "6px 10px", outline: "none" }}
                                        >
                                          {(["Llamada", "Visita", "Email", "Compra"] as const).map((t) => <option key={t} value={t} style={{ background: "#0D0D14" }}>{t}</option>)}
                                        </select>
                                        <input
                                          type="text"
                                          placeholder="Descripción..."
                                          value={crmRegisterNote}
                                          onChange={(e) => setCrmRegisterNote(e.target.value)}
                                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "white", fontSize: 13, padding: "6px 10px", outline: "none" }}
                                        />
                                        {crmRegisterType === "Compra" && (
                                          <input
                                            type="text"
                                            placeholder="Monto..."
                                            value={crmRegisterAmount}
                                            onChange={(e) => setCrmRegisterAmount(e.target.value)}
                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "white", fontSize: 13, padding: "6px 10px", outline: "none" }}
                                          />
                                        )}
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                          <button style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>Guardar</button>
                                          <button onClick={() => { setCrmShowRegisterForm(false); setCrmRegisterNote(""); setCrmRegisterAmount("") }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>Cancelar</button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })()}

                            {crmTab === "Documentos" && (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 40 }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                </svg>
                                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Sin documentos adjuntos</div>
                                <button style={{ border: "1px solid rgba(37,99,235,0.3)", color: "#2563EB", fontSize: 12, borderRadius: 6, padding: "7px 14px", background: "none", cursor: "pointer" }}>
                                  + Adjuntar archivo
                                </button>
                              </div>
                            )}

                            {crmTab === "Notas" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <textarea
                                  placeholder="Escribí una nota sobre este cliente..."
                                  style={{
                                    width: "100%", minHeight: 120,
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 8, color: "white", fontSize: 13,
                                    padding: 12, resize: "vertical", outline: "none",
                                    boxSizing: "border-box",
                                  }}
                                />
                                <button style={{ alignSelf: "flex-start", background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>
                                  Guardar nota
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Visit prep modal */}
                      {showVisitModal && crmSelectedClient && (
                        <div
                          onClick={(e) => { if (e.target === e.currentTarget) setShowVisitModal(false) }}
                          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
                        >
                          <div style={{ background: "#0D0D14", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 14, width: 480, maxHeight: "80%", overflowY: "auto", padding: 24 }}>
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                              <div>
                                <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>✦ Resumen pre-visita</div>
                                <div style={{ color: "white", fontSize: 16, fontWeight: 500 }}>{crmSelectedClient.name}</div>
                              </div>
                              <button onClick={() => setShowVisitModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 2px", marginTop: -2 }}>×</button>
                            </div>

                            {/* Section label helper */}
                            {(() => {
                              const sLabel = (text: string) => (
                                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 10 }}>{text}</div>
                              )
                              const infoCard = (content: React.ReactNode) => (
                                <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.12)", borderRadius: 8, padding: 14, marginBottom: 20 }}>{content}</div>
                              )
                              return (
                                <>
                                  {/* Section 1 — Resumen */}
                                  {sLabel("Resumen")}
                                  {infoCard(
                                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.6 }}>
                                      {crmSelectedClient.name.split(" ")[0]} es una cliente {crmSelectedClient.temp.toLowerCase()} con alta frecuencia de compra. Su último pedido fue {crmSelectedClient.lastContact.toLowerCase()} por {crmSelectedClient.ticket}. Tiene un ciclo promedio de 28 días, por lo que una nueva compra es esperada en los próximos días. Es un cliente de alto valor — top 15% de la cartera.
                                    </div>
                                  )}

                                  {/* Section 2 — Puntos clave */}
                                  {sLabel("Puntos clave")}
                                  <div style={{ marginBottom: 20 }}>
                                    {[
                                      "Recordar mencionar el nuevo catálogo de temporada",
                                      "Última compra del producto X — preguntar satisfacción",
                                      "Prefiere contacto por teléfono según historial",
                                      "Tiene saldo pendiente de seguimiento — verificar",
                                    ].map((item, i) => (
                                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB", flexShrink: 0, marginTop: 6 }} />
                                        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{item}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Section 3 — Últimas interacciones */}
                                  {sLabel("Últimas interacciones")}
                                  <div style={{ marginBottom: 20 }}>
                                    {[
                                      ["Compra realizada — $4.200", "Hace 2 días"],
                                      ["Llamada de seguimiento",    "Hace 9 días"],
                                      ["Email — propuesta enviada", "Hace 15 días"],
                                    ].map(([action, date], i) => (
                                      <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 12, position: "relative" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#2563EB", marginTop: 4 }} />
                                          {i < 2 && <div style={{ width: 1, flex: 1, background: "rgba(37,99,235,0.25)", marginTop: 3 }} />}
                                        </div>
                                        <div>
                                          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{action}</div>
                                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{date}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Section 4 — Objetivo */}
                                  {sLabel("Objetivo de la visita")}
                                  {infoCard(
                                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.6 }}>
                                      Cerrar recompra del pedido mensual y presentar nuevas opciones de producto según su perfil de compra.
                                    </div>
                                  )}

                                  {/* Footer */}
                                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16, marginTop: 4, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                    <button onClick={() => setShowVisitModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>Cerrar</button>
                                    <button style={{ background: "none", border: "1px solid rgba(37,99,235,0.3)", color: "#2563EB", fontSize: 12, borderRadius: 6, padding: "7px 16px", cursor: "pointer" }}>Exportar resumen</button>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : crmView === "new" ? (
                    // ── NEW CLIENT VIEW ──
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
                      {/* Scrollable form body */}
                      <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 100px" }}>
                        {(() => {
                          const inputStyle: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: 13, width: "100%", outline: "none", boxSizing: "border-box" }
                          const labelStyle: React.CSSProperties = { color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 6, display: "block" }
                          const sectionTitle: React.CSSProperties = { color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }
                          const field = (label: string, el: React.ReactNode, optional?: boolean) => (
                            <div style={{ marginBottom: 12 }}>
                              <label style={labelStyle}>{label}{optional && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginLeft: 4 }}>(opcional)</span>}</label>
                              {el}
                            </div>
                          )
                          const TEMP_BTNS: { key: "Caliente" | "Tibio" | "Frío"; color: string }[] = [
                            { key: "Caliente", color: "#ef4444" },
                            { key: "Tibio",    color: "#eab308" },
                            { key: "Frío",     color: "#60a5fa" },
                          ]
                          return (
                            <div style={{ display: "flex", gap: 24 }}>
                              {/* Left column — 40% */}
                              <div style={{ width: "40%", flexShrink: 0 }}>
                                <div style={sectionTitle}>Datos personales</div>
                                {field("Nombre completo", <input style={inputStyle} placeholder="Ej: María González" value={newName} onChange={e => setNewName(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />)}
                                {field("Empresa", <input style={inputStyle} placeholder="Ej: Distribuidora Norte" value={newCompany} onChange={e => setNewCompany(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />, true)}
                                {field("Email", <input type="email" style={inputStyle} placeholder="email@empresa.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />)}
                                {field("Teléfono", <input style={inputStyle} placeholder="+54 11 0000-0000" value={newPhone} onChange={e => setNewPhone(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />)}
                                {field("Ubicación", <input style={inputStyle} placeholder="Ciudad, País" value={newLocation} onChange={e => setNewLocation(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />)}

                                <div style={{ ...sectionTitle, marginTop: 24 }}>Clasificación</div>
                                <div style={{ marginBottom: 12 }}>
                                  <label style={labelStyle}>Temperatura</label>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    {TEMP_BTNS.map(({ key, color }) => (
                                      <button key={key} onClick={() => setNewTemp(key)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, border: `1px solid ${newTemp === key ? color : "rgba(255,255,255,0.08)"}`, background: newTemp === key ? `${color}20` : "rgba(255,255,255,0.03)", color: newTemp === key ? color : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.15s" }}>{key}</button>
                                    ))}
                                  </div>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                  <label style={labelStyle}>Etiquetas</label>
                                  <input style={inputStyle} placeholder="Cliente VIP, Distribuidor..." value={newTags} onChange={e => setNewTags(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 4 }}>Separadas por coma</div>
                                </div>
                              </div>

                              {/* Right column — 60% */}
                              <div style={{ flex: 1 }}>
                                <div style={sectionTitle}>Información comercial</div>
                                <div style={{ marginBottom: 12 }}>
                                  <label style={labelStyle}>Vendedor asignado</label>
                                  <select value={newSeller} onChange={e => setNewSeller(e.target.value)} style={{ ...inputStyle, appearance: "none" as const }}>
                                    <option value="MR" style={{ background: "#0D0D14" }}>MR — María Ruiz</option>
                                    <option value="JP" style={{ background: "#0D0D14" }}>JP — Juan Pérez</option>
                                    <option value="CA" style={{ background: "#0D0D14" }}>CA — Carlos Acosta</option>
                                  </select>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                  <label style={labelStyle}>Ticket promedio</label>
                                  <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", fontSize: 13, pointerEvents: "none" }}>$</span>
                                    <input type="number" style={{ ...inputStyle, paddingLeft: 24 }} placeholder="0" value={newTicket} onChange={e => setNewTicket(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                                  </div>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                  <label style={labelStyle}>Frecuencia de compra</label>
                                  <div style={{ position: "relative" }}>
                                    <input type="number" style={{ ...inputStyle, paddingRight: 48 }} placeholder="30" value={newFrequency} onChange={e => setNewFrequency(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", fontSize: 13, pointerEvents: "none" }}>días</span>
                                  </div>
                                </div>
                                {field("Grupo / Cuenta B2B", <input style={inputStyle} placeholder="Ej: Grupo Herrera" value={newB2B} onChange={e => setNewB2B(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />, true)}
                                <div style={{ marginBottom: 12 }}>
                                  <label style={labelStyle}>Notas iniciales</label>
                                  <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} placeholder="Información relevante sobre el cliente..." value={newNotes} onChange={e => setNewNotes(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                                </div>

                                <div style={{ ...sectionTitle, marginTop: 24 }}>Dirección</div>
                                {field("Calle y número", <input style={inputStyle} placeholder="Ej: Av. Corrientes 1234" value={newStreet} onChange={e => setNewStreet(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />)}
                                {field("Ciudad", <input style={inputStyle} placeholder="Buenos Aires" value={newCity} onChange={e => setNewCity(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />)}
                                {field("País", <input style={inputStyle} placeholder="Argentina" value={newCountry} onChange={e => setNewCountry(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />)}
                              </div>
                            </div>
                          )
                        })()}
                      </div>

                      {/* Bottom bar */}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#0D0D14", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button onClick={() => { setCrmView("list"); resetNewForm() }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", transition: "color 0.15s" }} onMouseEnter={e => (e.currentTarget.style.color = "white")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>Cancelar</button>
                        <button onClick={saveNewClient} style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Guardar cliente</button>
                      </div>
                    </div>
                  ) : crmView === "import" ? (
                    // ── IMPORT VIEW ──
                    <div style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", padding: "32px 32px 40px" }}>
                      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 32 }}>

                        {/* Step indicator */}
                        {(() => {
                          const steps = ["Subir archivo", "Revisar datos", "Confirmar"]
                          return (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
                              {steps.map((label, idx) => {
                                const n = idx + 1
                                const isActive = importStep === n
                                const isDone = importStep > n
                                const isPending = importStep < n
                                return (
                                  <div key={n} style={{ display: "flex", alignItems: "flex-start", flex: 1 }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                      <div style={{
                                        width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600,
                                        background: isActive ? "#2563EB" : isDone ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.06)",
                                        color: isActive ? "white" : isDone ? "#2563EB" : "rgba(255,255,255,0.3)",
                                      }}>{n}</div>
                                      <div style={{ fontSize: 11, color: isActive ? "white" : "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{n}. {label}</div>
                                    </div>
                                    {idx < steps.length - 1 && (
                                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)", marginTop: 10, marginLeft: 8, marginRight: 8 }} />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}

                        {/* Step 1 — Upload */}
                        {importStep === 1 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            {!importFile ? (
                              <>
                                <div
                                  onClick={() => setImportFile(true)}
                                  onMouseEnter={() => setImportDropHover(true)}
                                  onMouseLeave={() => setImportDropHover(false)}
                                  style={{
                                    border: `2px dashed ${importDropHover ? "rgba(37,99,235,0.6)" : "rgba(37,99,235,0.3)"}`,
                                    borderRadius: 12, padding: 40,
                                    textAlign: "center",
                                    background: importDropHover ? "rgba(37,99,235,0.06)" : "rgba(37,99,235,0.03)",
                                    cursor: "pointer",
                                    transition: "border-color 0.15s, background 0.15s",
                                  }}
                                >
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(37,99,235,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
                                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                                  </svg>
                                  <div style={{ color: "white", fontSize: 14, fontWeight: 500, marginTop: 12 }}>Arrastrá tu archivo aquí</div>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 4 }}>o hacé clic para seleccionar</div>
                                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 16 }}>Formatos aceptados: .xlsx .csv</div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                                  <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>o</span>
                                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                                </div>

                                <div style={{ display: "flex", justifyContent: "center" }}>
                                  <button style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12, borderRadius: 6, padding: "7px 16px", background: "none", cursor: "pointer" }}>
                                    Usar plantilla de ejemplo
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                  </svg>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ color: "white", fontSize: 13 }}>clientes.xlsx</div>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>24 KB</div>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); setImportFile(false) }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 4 }}>×</button>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                  <button onClick={() => setImportStep(2)} style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "9px 24px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                                    Siguiente →
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Step 2 — Review */}
                        {importStep === 2 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                                    {["Nombre", "Empresa", "Email", "Teléfono", "Temperatura"].map(col => (
                                      <th key={col} style={{ padding: "8px 12px", color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase" as const, textAlign: "left" as const, fontWeight: 600, letterSpacing: "0.04em" }}>{col}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    ["Martín Pérez",   "Distribuidora Sur",   "mperez@sur.com",    "+54 11 4123-4567", "Caliente"],
                                    ["Laura Gómez",    "Tech Solutions",      "lgomez@tech.com",   "+54 11 5234-5678", "Tibio"   ],
                                    ["Carlos Ruiz",    "Importadora Norte",   "cruiz@norte.com",   "+54 11 6345-6789", "Frío"    ],
                                    ["Ana Rodríguez",  "Servicios Rápidos",   "arodriguez@sr.com", "+54 11 7456-7890", "Caliente"],
                                    ["Diego Molina",   "Consultoría Omega",   "dmolina@omega.com", "+54 11 8567-8901", "Tibio"   ],
                                  ].map((row, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                      {row.map((cell, j) => (
                                        <td key={j} style={{ padding: "8px 12px", color: "white", fontSize: 12 }}>{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>5 clientes detectados — 0 duplicados encontrados</div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                              <button onClick={() => setImportStep(1)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 13, borderRadius: 8, padding: "9px 20px", cursor: "pointer" }}>← Volver</button>
                              <button onClick={() => setImportStep(3)} style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Confirmar importación →</button>
                            </div>
                          </div>
                        )}

                        {/* Step 3 — Success */}
                        {importStep === 3 && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 40 }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                            <div style={{ color: "white", fontSize: 16, fontWeight: 600, marginTop: 4 }}>¡Importación exitosa!</div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" }}>5 clientes agregados correctamente</div>
                            <button onClick={() => { setCrmView("list"); setImportStep(1); setImportFile(false) }} style={{ marginTop: 24, background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                              Ver clientes importados
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  ) : crmView === "duplicates" ? (
                    // ── DUPLICATES VIEW ──
                    <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Duplicados detectados</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 4 }}>Revisá y unificá los registros</div>
                      </div>

                      {dupResolved.every(Boolean) ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 40 }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>Todo resuelto</div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>No hay más duplicados pendientes</div>
                          <button onClick={() => setCrmView("list")} style={{ marginTop: 20, background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Volver a clientes</button>
                        </div>
                      ) : (
                        <>
                          {[
                            {
                              a: { name: "María González",  company: "Distribuidora Norte", email: "maria@dnorte.com",   phone: "+54 11 4000-0001" },
                              b: { name: "M. González",     company: "Dist. Norte",         email: "mariag@dnorte.com",  phone: "+54 11 4000-0002" },
                            },
                            {
                              a: { name: "Carlos Mendoza",    company: "Tech Solutions", email: "carlos@tech.com",    phone: "+54 11 5000-0001" },
                              b: { name: "Carlos R. Mendoza", company: "Tech Solutions", email: "cmendoza@tech.com",  phone: "+54 11 5000-0002" },
                            },
                          ].map((group, gi) => {
                            const resolved = dupResolved[gi]
                            const miniAvatar = (name: string) => {
                              const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
                              const colors = ["#2563EB", "#7c3aed", "#0891b2", "#059669"]
                              const bg = colors[name.charCodeAt(0) % colors.length]
                              return (
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", fontWeight: 600, flexShrink: 0 }}>{initials}</div>
                              )
                            }
                            const card = (c: typeof group.a) => (
                              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  {miniAvatar(c.name)}
                                  <div>
                                    <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{c.company}</div>
                                  </div>
                                </div>
                                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{c.email}</div>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{c.phone}</div>
                                </div>
                              </div>
                            )
                            return (
                              <div key={gi} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>Posible duplicado</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  {card(group.a)}
                                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, flexShrink: 0 }}>vs</span>
                                  {card(group.b)}
                                </div>
                                <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                  {resolved ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      <span style={{ color: "#22c55e", fontSize: 11 }}>Resuelto</span>
                                    </div>
                                  ) : (
                                    <>
                                      <button onClick={() => setDupResolved(prev => prev.map((v, i) => i === gi ? true : v))} style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Mantener ambos</button>
                                      <button onClick={() => setDupResolved(prev => prev.map((v, i) => i === gi ? true : v))} style={{ background: "rgba(37,99,235,0.15)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Unificar registros</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </>
                      )}
                    </div>
                  ) : crmView === "map" ? (
                    // ── MAP VIEW ──
                    (() => {
                      const PIN_POSITIONS: Record<string, { left: string; top: string }> = {
                        "María González": { left: "25%", top: "35%" },
                        "Carlos Mendoza":  { left: "55%", top: "25%" },
                        "Ana Rodríguez":   { left: "70%", top: "60%" },
                        "Luis Herrera":    { left: "35%", top: "55%" },
                        "Sofía Martínez":  { left: "60%", top: "45%" },
                        "Diego López":     { left: "45%", top: "30%" },
                        "Valentina Cruz":  { left: "80%", top: "35%" },
                        "Martín Pérez":    { left: "30%", top: "70%" },
                      }
                      const TEMP_PIN: Record<string, { outer: string; outerBorder: string; inner: string; pointer: string }> = {
                        Caliente: { outer: "rgba(239,68,68,0.15)", outerBorder: "rgba(239,68,68,0.4)", inner: "rgba(239,68,68,0.3)", pointer: "#ef4444" },
                        Tibio:    { outer: "rgba(234,179,8,0.15)",  outerBorder: "rgba(234,179,8,0.4)",  inner: "rgba(234,179,8,0.3)",  pointer: "#eab308" },
                        Frío:     { outer: "rgba(37,99,235,0.15)",  outerBorder: "rgba(37,99,235,0.4)",  inner: "rgba(37,99,235,0.3)",  pointer: "#2563EB" },
                      }
                      const visibleClients = crmClients.filter(c =>
                        (crmTempFilter === "Todos" || c.temp === crmTempFilter) && PIN_POSITIONS[c.name]
                      )
                      const countByTemp = (t: string) => crmClients.filter(c => c.temp === t).length
                      return (
                        <div style={{ flex: 1, position: "relative", background: "#0a0f1a", overflow: "hidden" }}>
                          {/* Grid lines */}
                          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                            {Array.from({ length: 30 }, (_, i) => (
                              <line key={`h${i}`} x1="0" y1={i * 40} x2="100%" y2={i * 40} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                            ))}
                            {Array.from({ length: 50 }, (_, i) => (
                              <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="100%" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                            ))}
                            {/* Fake streets */}
                            <path d="M 0 180 Q 200 160 400 200 T 900 180" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none" />
                            <path d="M 100 0 L 150 500" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none" />
                            <path d="M 0 320 L 900 340" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none" />
                            <path d="M 300 0 Q 320 200 280 500" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none" />
                            <path d="M 500 0 L 480 500" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none" />
                            <path d="M 0 420 Q 400 400 900 440" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none" />
                            <path d="M 650 0 L 700 500" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none" />
                          </svg>

                          {/* Client pins */}
                          {visibleClients.map((client) => {
                            const pos = PIN_POSITIONS[client.name]
                            const pin = TEMP_PIN[client.temp] ?? TEMP_PIN.Frío
                            const hovered = mapPinHover === client.id
                            const initials = getInitials(client.name)
                            const ts = TEMP_STYLES[client.temp as keyof typeof TEMP_STYLES]
                            return (
                              <div
                                key={client.id}
                                style={{ position: "absolute", left: pos.left, top: pos.top, transform: `translate(-50%, -100%) scale(${hovered ? 1.1 : 1})`, transition: "transform 0.15s", cursor: "pointer", zIndex: hovered ? 10 : 1 }}
                                onMouseEnter={() => setMapPinHover(client.id)}
                                onMouseLeave={() => setMapPinHover(null)}
                                onClick={() => { setCrmSelectedClient(client); setCrmView("detail"); setCrmTab("Historial") }}
                              >
                                {/* Tooltip */}
                                {hovered && (
                                  <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "rgba(10,10,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", whiteSpace: "nowrap", pointerEvents: "none" }}>
                                    <div style={{ color: "white", fontSize: 12, fontWeight: 500 }}>{client.name}</div>
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{client.company}</div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
                                      <span style={{ background: ts.bg, color: ts.color, fontSize: 10, borderRadius: 4, padding: "2px 6px" }}>{client.temp}</span>
                                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{client.lastContact}</span>
                                    </div>
                                  </div>
                                )}
                                {/* Outer circle */}
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: pin.outer, border: `1px solid ${pin.outerBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {/* Inner circle */}
                                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: pin.inner, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ color: "white", fontSize: 9, fontWeight: 500 }}>{initials}</span>
                                  </div>
                                </div>
                                {/* Triangle pointer */}
                                <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `8px solid ${pin.outerBorder}`, margin: "0 auto" }} />
                              </div>
                            )
                          })}

                          {/* Top-left legend overlay */}
                          <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(10,10,20,0.8)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px" }}>
                            <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>Clientes en el mapa</div>
                            {[
                              { color: "#ef4444", label: `Caliente (${countByTemp("Caliente")})` },
                              { color: "#eab308", label: `Tibio (${countByTemp("Tibio")})` },
                              { color: "#60a5fa", label: `Frío (${countByTemp("Frío")})` },
                            ].map(({ color, label }) => (
                              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{label}</span>
                              </div>
                            ))}
                          </div>

                          {/* Bottom-right zoom controls */}
                          <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                            {["+", "−"].map((sym) => (
                              <button key={sym} style={{ width: 32, height: 32, background: "rgba(10,10,20,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "white", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{sym}</button>
                            ))}
                          </div>
                        </div>
                      )
                    })()
                  ) : (
                    // ── CLIENT LIST VIEW ──
                    <>
                      {/* Left sidebar */}
                      <div style={{
                        width: "25%", flexShrink: 0,
                        background: "rgba(255,255,255,0.02)",
                        borderRight: "1px solid rgba(255,255,255,0.06)",
                        padding: "20px 16px", display: "flex", flexDirection: "column", overflowY: "auto",
                      }}>
                        <input
                          type="text"
                          placeholder="Buscar cliente..."
                          value={crmSearch}
                          onChange={(e) => setCrmSearch(e.target.value)}
                          style={{
                            width: "100%", padding: "8px 12px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 8, color: "white", fontSize: 13,
                            outline: "none", boxSizing: "border-box",
                          }}
                        />
                        <div style={{ marginTop: 20, marginBottom: 6, color: "rgba(255,255,255,0.3)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Temperatura</div>
                        {(["Todos", "Caliente 🔴", "Tibio 🟡", "Frío 🔵"] as const).map((label) => {
                          const key = label.split(" ")[0] as Temp
                          const selected = crmTempFilter === key
                          return (
                            <button key={key} onClick={() => setCrmTempFilter(key)} style={{
                              width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: 6, fontSize: 13,
                              background: selected ? "rgba(37,99,235,0.15)" : "transparent",
                              color: selected ? "#2563EB" : "rgba(255,255,255,0.4)",
                              border: "none", cursor: "pointer", marginBottom: 2,
                              transition: "background 0.15s, color 0.15s",
                            }}>{label}</button>
                          )
                        })}
                        <div style={{ marginTop: 20, marginBottom: 8, color: "rgba(255,255,255,0.3)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Etiquetas</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {["Cliente VIP", "Distribuidor", "Nuevo"].map((tag) => (
                            <button key={tag} style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", borderRadius: 20, padding: "4px 10px", fontSize: 11, border: "none", cursor: "pointer" }}>{tag}</button>
                          ))}
                        </div>
                        <div style={{ marginTop: 20, marginBottom: 8, color: "rgba(255,255,255,0.3)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Vista</div>
                        {(["todos", "empresa"] as const).map((v) => (
                          <button key={v} onClick={() => setCrmGroupBy(v)} style={{
                            width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: 6, fontSize: 13,
                            background: crmGroupBy === v ? "rgba(37,99,235,0.15)" : "transparent",
                            color: crmGroupBy === v ? "#2563EB" : "rgba(255,255,255,0.4)",
                            border: "none", cursor: "pointer", marginBottom: 2,
                            transition: "background 0.15s, color 0.15s",
                          }}>{v === "todos" ? "Todos los clientes" : "Agrupar por empresa"}</button>
                        ))}
                      </div>

                      {/* Right — client list / ranking */}
                      <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        {/* Top bar */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Clientes</span>
                            {(["Lista", "Ranking"] as const).map((m) => (
                              <button key={m} onClick={() => setCrmListMode(m)} style={{
                                padding: "5px 12px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer",
                                background: crmListMode === m ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)",
                                color: crmListMode === m ? "#2563EB" : "rgba(255,255,255,0.4)",
                                transition: "background 0.15s, color 0.15s",
                              }}>{m}</button>
                            ))}
                            <button onClick={() => setCrmView("map")} style={{
                              padding: "5px 12px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer",
                              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
                              transition: "background 0.15s, color 0.15s",
                            }}>Mapa</button>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setCrmView("import"); setImportStep(1); setImportFile(false) }} style={{ padding: "7px 14px", fontSize: 13, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, cursor: "pointer" }}>Importar</button>
                            <button onClick={() => setCrmView("new")} style={{ padding: "7px 14px", fontSize: 13, background: "#2563EB", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Nuevo cliente +</button>
                          </div>
                        </div>

                        {/* Duplicate alert banner */}
                        {showDupBanner && (
                          <div style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                              <span style={{ color: "#eab308", fontSize: 13 }}>Se detectaron 2 posibles duplicados</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button onClick={() => { setCrmView("duplicates"); setDupResolved([false, false]) }} style={{ background: "rgba(234,179,8,0.15)", color: "#eab308", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Revisar</button>
                              <button onClick={() => setShowDupBanner(false)} style={{ background: "none", border: "none", color: "rgba(234,179,8,0.4)", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>×</button>
                            </div>
                          </div>
                        )}

                        <div style={{ flex: 1, overflowY: "auto" }}>
                          {(() => {
                            const filtered = crmClients
                              .filter((c) => crmTempFilter === "Todos" || c.temp === crmTempFilter)
                              .filter((c) => { const q = crmSearch.toLowerCase(); return !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) })

                            // ── RANKING VIEW ──
                            if (crmListMode === "Ranking") {
                              const ticketVal = (t: string) => parseFloat(t.replace(/[$.,]/g, "")) || 0
                              const sorted = [...filtered].sort((a, b) => ticketVal(b.ticket) - ticketVal(a.ticket))
                              const maxTicket = ticketVal(sorted[0]?.ticket ?? "$0")
                              const posColor = (i: number) => i === 0 ? "#2563EB" : i === 1 ? "rgba(255,255,255,0.5)" : i === 2 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.2)"
                              return sorted.map((client, i) => {
                                const ts = TEMP_STYLES[client.temp]
                                const pct = maxTicket > 0 ? (ticketVal(client.ticket) / maxTicket) * 100 : 0
                                return (
                                  <div key={client.id}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 12px", height: 52, cursor: "pointer", borderRadius: 6, transition: "background 0.15s" }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                      <div style={{ width: 24, fontSize: 13, fontWeight: 600, color: posColor(i), flexShrink: 0, textAlign: "center" }}>#{i + 1}</div>
                                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(37,99,235,0.2)", color: "#2563EB", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{getInitials(client.name)}</div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.name}</div>
                                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.company}</div>
                                      </div>
                                      <div style={{ color: "white", fontSize: 14, fontWeight: 500, flexShrink: 0, marginRight: 8 }}>{client.ticket}</div>
                                      <div style={{ background: ts.bg, color: ts.color, fontSize: 11, padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>{client.temp}</div>
                                      <button onClick={() => { setCrmSelectedClient(client); setCrmView("detail"); setCrmTab("Historial") }} style={{ background: "none", border: "none", color: "#2563EB", fontSize: 11, cursor: "pointer", flexShrink: 0, padding: "0 4px" }}>Ver ficha →</button>
                                    </div>
                                    <div style={{ margin: "0 12px 4px", height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
                                      <div style={{ height: "100%", width: `${pct}%`, background: "rgba(37,99,235,0.4)", borderRadius: 2 }} />
                                    </div>
                                  </div>
                                )
                              })
                            }

                            // ── LIST VIEW (flat or grouped) ──
                            const ClientRow = ({ client, indent }: { client: Client; indent?: boolean }) => {
                              const ts = TEMP_STYLES[client.temp]
                              return (
                                <div
                                  onClick={() => { setCrmSelectedClient(client); setCrmView("detail"); setCrmTab("Historial") }}
                                  style={{ height: 56, display: "flex", alignItems: "center", gap: 12, paddingLeft: indent ? 24 : 12, paddingRight: 12, borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", borderRadius: 6, transition: "background 0.15s" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(37,99,235,0.2)", color: "#2563EB", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{getInitials(client.name)}</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: "white", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.name}</div>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.company}</div>
                                  </div>
                                  <div style={{ background: ts.bg, color: ts.color, fontSize: 11, padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>{client.temp}</div>
                                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, flexShrink: 0, width: 90, textAlign: "right" }}>{client.lastContact}</div>
                                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, flexShrink: 0, width: 70, textAlign: "right" }}>{client.ticket}</div>
                                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{client.seller}</div>
                                </div>
                              )
                            }

                            if (crmGroupBy === "empresa") {
                              const groups: Record<string, Client[]> = {}
                              filtered.forEach((c) => {
                                const key = c.company === "Sin empresa" ? "Sin empresa" : c.company
                                groups[key] = groups[key] ? [...groups[key], c] : [c]
                              })
                              return Object.entries(groups).map(([company, clients]) => (
                                <div key={company}>
                                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{company}</span>
                                    <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>({clients.length} {clients.length === 1 ? "cliente" : "clientes"})</span>
                                  </div>
                                  {clients.map((c) => <ClientRow key={c.id} client={c} indent />)}
                                </div>
                              ))
                            }

                            return filtered.map((client) => <ClientRow key={client.id} client={client} />)
                          })()}
                        </div>
                      </div>
                    </>
                  )}                </div>
              ) : (
                // ── PLACEHOLDER for other modules ──
                <div
                  style={{
                    flex: 1,
                    padding: "32px 24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <Icon size={32} style={{ color: "rgba(37,99,235,0.3)" }} />
                  <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 13 }}>
                    {activeNode.title}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 11 }}>
                    Próximamente
                  </span>
                </div>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}
