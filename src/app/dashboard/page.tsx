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
  const [ventasView, setVentasView] = useState<"pipeline" | "detail" | "new" | "forecast" | "risk" | "sellers" | "products" | "ranking">("pipeline")
  const [showRiskBanner, setShowRiskBanner] = useState(true)
  const [mktView, setMktView] = useState<"campaigns" | "detail" | "new" | "insights">("campaigns")
  const [mktNavTab, setMktNavTab] = useState<"Campañas" | "Insights" | "Investigaciones">("Campañas")
  const [mktSearch, setMktSearch] = useState("")
  const [mktStatusFilter, setMktStatusFilter] = useState("Todas")
  const [mktChannelFilter, setMktChannelFilter] = useState("Todos")
  const [mktPeriodFilter, setMktPeriodFilter] = useState("Este mes")
  const [mktSelectedCamp, setMktSelectedCamp] = useState<{ id: number; name: string; channel: string; date: string; status: string; roi: string; roiDir: string; budget: string } | null>(null)
  const [mktDetailTab, setMktDetailTab] = useState<"Resultados" | "Audiencia" | "Contenido" | "Notas">("Resultados")
  const [newCampName, setNewCampName] = useState("")
  const [newCampChannel, setNewCampChannel] = useState<string | null>(null)
  const [newCampObjective, setNewCampObjective] = useState("Generar nuevas ventas")
  const [newCampSegments, setNewCampSegments] = useState<string[]>([])
  const [newCampBudget, setNewCampBudget] = useState("")
  const [newCampStart, setNewCampStart] = useState("")
  const [newCampEnd, setNewCampEnd] = useState("")
  const [newCampOwner, setNewCampOwner] = useState("JP")
  const [newCampSubject, setNewCampSubject] = useState("")
  const [newCampMessage, setNewCampMessage] = useState("")
  const [newCampCTA, setNewCampCTA] = useState("")
  const [newCampTargetOpen, setNewCampTargetOpen] = useState("")
  const [newCampTargetClick, setNewCampTargetClick] = useState("")
  const [newCampTargetConv, setNewCampTargetConv] = useState("")
  const [prodSearch, setProdSearch] = useState("")
  const [ventasNavTab, setVentasNavTab] = useState<"Pipeline" | "Pronóstico" | "Comisiones" | "Vendedores" | "Productos">("Pipeline")
  const [ventasPipeMode, setVentasPipeMode] = useState<"Kanban" | "Embudo" | "Ranking">("Kanban")
  const [ventasCardHover, setVentasCardHover] = useState<string | null>(null)
  const [ventasSelectedOpp, setVentasSelectedOpp] = useState<{ id: string; name: string; company: string; amount: string; seller: string; close: string; prob: number; stage: string; won?: boolean } | null>(null)
  const [ventasTab, setVentasTab] = useState<"Customer Journey" | "Actividad" | "Propuestas" | "Notas">("Customer Journey")
  const [ventasActFilter, setVentasActFilter] = useState<"Todas" | "Llamada" | "Email" | "Reunión">("Todas")
  const [ventasStageHover, setVentasStageHover] = useState<string | null>(null)
  const [ventasCommExpanded, setVentasCommExpanded] = useState<string | null>(null)
  const [newOppClient, setNewOppClient] = useState("")
  const [newOppClientSearch, setNewOppClientSearch] = useState("")
  const [newOppClientOpen, setNewOppClientOpen] = useState(false)
  const [newOppAmount, setNewOppAmount] = useState("")
  const [newOppStage, setNewOppStage] = useState("Prospecto")
  const [newOppProb, setNewOppProb] = useState(25)
  const [newOppDate, setNewOppDate] = useState("")
  const [newOppSeller, setNewOppSeller] = useState("JP")
  const [newOppOrigin, setNewOppOrigin] = useState("Campaña digital")
  const [newOppDesc, setNewOppDesc] = useState("")
  const [newOppNotes, setNewOppNotes] = useState("")
  const [newOppContactType, setNewOppContactType] = useState("Llamada")
  const [newOppContactDate, setNewOppContactDate] = useState("")
  const [newOppContactDesc, setNewOppContactDesc] = useState("")
  const [showCommModal, setShowCommModal] = useState(false)
  const [commType, setCommType] = useState<0 | 1 | 2>(0)
  const [commPeriod, setCommPeriod] = useState<0 | 1>(0)
  const [commRates, setCommRates] = useState<Record<string, string>>({ JP: "8", CA: "7", MR: "8" })
  const [showGoalsModal, setShowGoalsModal] = useState(false)
  const [goalsType, setGoalsType] = useState<0 | 1>(0)
  const [goalRates, setGoalRates] = useState<Record<string, string>>({ JP: "50000", CA: "50000", MR: "50000" })
  const [goalTeam, setGoalTeam] = useState("150000")
  const [goalsAlertBelow, setGoalsAlertBelow] = useState(true)
  const [goalsAlertRisk, setGoalsAlertRisk] = useState(true)
  const [showGoalsBanner, setShowGoalsBanner] = useState(true)
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
                  ) : activeNode.id === 2 && ventasView === "detail" && ventasSelectedOpp ? (
                    <>
                      <button onClick={() => setVentasView("pipeline")} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{activeNode.title}</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{ventasSelectedOpp.name}</span>
                    </>
                  ) : activeNode.id === 2 && ventasView === "new" ? (
                    <>
                      <button onClick={() => setVentasView("pipeline")} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{activeNode.title}</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Nueva oportunidad</span>
                    </>
                  ) : activeNode.id === 2 && ventasView === "risk" ? (
                    <>
                      <button onClick={() => setVentasView("pipeline")} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{activeNode.title}</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Oportunidades en riesgo</span>
                    </>
                  ) : activeNode.id === 3 && mktView === "new" ? (
                    <>
                      <button onClick={() => setMktView("campaigns")} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{activeNode.title}</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Nueva campaña</span>
                    </>
                  ) : activeNode.id === 3 && mktView === "detail" && mktSelectedCamp ? (
                    <>
                      <button onClick={() => setMktView("campaigns")} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{activeNode.title}</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{mktSelectedCamp.name}</span>
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
              ) : activeNode.id === 2 ? (
                // ── VENTAS MODULE ──
                (() => {
                  type Stage = "Prospecto" | "Propuesta" | "Negociación" | "Cerrado"
                  const STAGE_COLOR: Record<Stage, string> = {
                    Prospecto:   "rgba(99,102,241,0.6)",
                    Propuesta:   "rgba(234,179,8,0.6)",
                    Negociación: "rgba(249,115,22,0.6)",
                    Cerrado:     "rgba(34,197,94,0.6)",
                  }
                  const STAGE_FILL: Record<Stage, string> = {
                    Prospecto:   "rgba(99,102,241,0.5)",
                    Propuesta:   "rgba(234,179,8,0.5)",
                    Negociación: "rgba(249,115,22,0.5)",
                    Cerrado:     "rgba(34,197,94,0.5)",
                  }
                  const OPPS: { id: string; name: string; company: string; amount: string; seller: string; close: string; prob: number; stage: Stage; won?: boolean }[] = [
                    { id: "o1", name: "Luis Herrera",    company: "Grupo Herrera SA",    amount: "$28.500", seller: "CA", close: "Cierre en 12 días", prob: 30,  stage: "Prospecto"   },
                    { id: "o2", name: "Valentina Cruz",  company: "Sin empresa",          amount: "$1.200",  seller: "MR", close: "Cierre en 20 días", prob: 20,  stage: "Prospecto"   },
                    { id: "o3", name: "Sofía Martínez",  company: "Retail Express",       amount: "$8.900",  seller: "JP", close: "Cierre en 7 días",  prob: 60,  stage: "Propuesta"   },
                    { id: "o4", name: "Carlos Mendoza",  company: "Tech Solutions",       amount: "$18.500", seller: "JP", close: "Cierre en 3 días",  prob: 80,  stage: "Negociación" },
                    { id: "o5", name: "Martín Pérez",    company: "Constructora MP",      amount: "$9.350",  seller: "JP", close: "Cierre en 5 días",  prob: 75,  stage: "Negociación" },
                    { id: "o6", name: "María González",  company: "Distribuidora Norte",  amount: "$4.200",  seller: "MR", close: "Cerrado hoy",        prob: 100, stage: "Cerrado", won: true },
                  ]
                  const stages: Stage[] = ["Prospecto", "Propuesta", "Negociación", "Cerrado"]
                  const byStage = (s: Stage) => OPPS.filter(o => o.stage === s)
                  const stageTotal = (s: Stage) => {
                    const sum = byStage(s).reduce((acc, o) => acc + parseFloat(o.amount.replace(/[$.,]/g, "")), 0)
                    return "$" + sum.toLocaleString("es-AR")
                  }

                  const STAGE_BADGE_COLOR: Record<string, string> = {
                    Prospecto:   "rgba(99,102,241,0.6)",
                    Propuesta:   "rgba(234,179,8,0.6)",
                    Negociación: "rgba(249,115,22,0.6)",
                    Cerrado:     "rgba(34,197,94,0.6)",
                  }
                  const STAGE_BADGE_BG: Record<string, string> = {
                    Prospecto:   "rgba(99,102,241,0.15)",
                    Propuesta:   "rgba(234,179,8,0.15)",
                    Negociación: "rgba(249,115,22,0.15)",
                    Cerrado:     "rgba(34,197,94,0.15)",
                  }

                  if (ventasView === "detail" && ventasSelectedOpp) {
                    const opp = ventasSelectedOpp
                    const stageColor = STAGE_BADGE_COLOR[opp.stage] ?? "rgba(255,255,255,0.3)"
                    const stageBg    = STAGE_BADGE_BG[opp.stage]    ?? "rgba(255,255,255,0.06)"
                    const SELLER_MAP: Record<string, string> = { CA: "Carlos A.", MR: "María R.", JP: "Juan P." }
                    const JOURNEY_STEPS = [
                      { title: "Primer contacto",    desc: "Llamada inicial de prospección",                     date: "Hace 14 días", state: "done"    },
                      { title: "Calificación",       desc: "Cliente confirmó presupuesto e interés real",        date: "Hace 12 días", state: "done"    },
                      { title: "Propuesta enviada",  desc: `Propuesta por ${opp.amount} enviada por email`,     date: "Hace 8 días",  state: "done"    },
                      { title: "Seguimiento",        desc: "Llamada de seguimiento realizada",                   date: "Hace 3 días",  state: "done"    },
                      { title: "Negociación",        desc: "En proceso de negociación activa",                  date: "Hoy",          state: "current" },
                      { title: "Cierre",             desc: "Firma del contrato y primer pago",                  date: "Estimado en 3 días", state: "future" },
                    ]
                    const ALL_ACTS = [
                      { type: "Llamada", title: "Llamada de seguimiento — 8 min", date: "Hace 3 días"  },
                      { type: "Email",   title: "Email con propuesta adjunta",    date: "Hace 8 días"  },
                      { type: "Reunión", title: "Reunión de presentación",        date: "Hace 12 días" },
                      { type: "Llamada", title: "Llamada inicial",                date: "Hace 14 días" },
                    ]
                    const ACT_META: Record<string, { color: string; icon: React.ReactNode }> = {
                      Llamada: { color: "#2563EB", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
                      Email:   { color: "#eab308", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                      Reunión: { color: "#22c55e", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                    }
                    const filteredActs = ventasActFilter === "Todas" ? ALL_ACTS : ALL_ACTS.filter(a => a.type === ventasActFilter)
                    const STAGES_ALL: string[] = ["Prospecto", "Propuesta", "Negociación", "Cerrado"]
                    return (
                      <div style={{ flex: 1, display: "flex", gap: 24, padding: 24, overflow: "hidden" }}>
                        {/* Left column */}
                        <div style={{ width: "35%", flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
                          {/* Client card */}
                          <div style={{ textAlign: "center", marginBottom: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                              <span style={{ color: "#2563EB", fontSize: 16, fontWeight: 600 }}>{opp.name.split(" ").map((w: string) => w[0]).slice(0,2).join("")}</span>
                            </div>
                            <div style={{ color: "white", fontSize: 16, fontWeight: 500 }}>{opp.name}</div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{opp.company}</div>
                            <div style={{ color: "white", fontSize: 22, fontWeight: 600, marginTop: 12 }}>{opp.amount}</div>
                            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                              <span style={{ background: stageBg, color: stageColor, border: `1px solid ${stageColor}`, borderRadius: 20, padding: "4px 12px", fontSize: 12 }}>{opp.stage}</span>
                            </div>
                          </div>

                          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />

                          {/* Info rows */}
                          {[
                            ["PROBABILIDAD DE CIERRE", `${opp.prob}%`],
                            ["CIERRE ESTIMADO", opp.close],
                            ["VENDEDOR", `${opp.seller} — ${SELLER_MAP[opp.seller] ?? opp.seller}`],
                            ["TIEMPO EN PIPELINE", "14 días"],
                            ["ORIGEN", "Campaña digital"],
                          ].map(([label, value]) => (
                            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", paddingTop: 1 }}>{label}</span>
                              <span style={{ color: "white", fontSize: 12, textAlign: "right" as const, maxWidth: "55%" }}>{value}</span>
                            </div>
                          ))}

                          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />

                          {/* AI section */}
                          <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>✦ Inteligencia Pupi</div>
                          {[
                            {
                              icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
                              label: "Probabilidad real", value: "Alta — 82%", valueColor: "#22c55e", sub: null,
                            },
                            {
                              icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                              label: "Riesgo de demora", value: opp.prob >= 70 ? "Bajo" : opp.prob >= 50 ? "Medio" : "Alto", valueColor: opp.prob >= 70 ? "#22c55e" : opp.prob >= 50 ? "#eab308" : "#ef4444", sub: null,
                            },
                            {
                              icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
                              label: "Acción sugerida", value: "Enviar propuesta final", valueColor: "white", sub: "Lleva 14 días en negociación, promedio de cierre es 18 días",
                            },
                          ].map(({ icon, label, value, valueColor, sub }) => (
                            <div key={label} style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                {icon}
                                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</span>
                              </div>
                              <div style={{ color: valueColor, fontSize: 13, fontWeight: 500 }}>{value}</div>
                              {sub && <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 3 }}>{sub}</div>}
                            </div>
                          ))}

                          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />

                          {/* Move stage */}
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Mover a</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                            {STAGES_ALL.map(s => {
                              const sc = STAGE_BADGE_COLOR[s]
                              const sb = STAGE_BADGE_BG[s]
                              const isCurrent = s === opp.stage
                              return (
                                <button
                                  key={s}
                                  onMouseEnter={() => setVentasStageHover(s)}
                                  onMouseLeave={() => setVentasStageHover(null)}
                                  style={{ borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", border: `1px solid ${sc}`, background: isCurrent ? sb : "transparent", color: isCurrent ? sc : sc, transition: "background 0.15s", fontWeight: isCurrent ? 600 : 400 }}
                                >{s}</button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Right column */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          {/* Tab bar */}
                          <div style={{ display: "flex", gap: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 20, flexShrink: 0 }}>
                            {(["Customer Journey", "Actividad", "Propuestas", "Notas"] as const).map(tab => (
                              <button key={tab} onClick={() => setVentasTab(tab)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, paddingBottom: 8, color: ventasTab === tab ? "white" : "rgba(255,255,255,0.35)", borderBottom: ventasTab === tab ? "2px solid #2563EB" : "2px solid transparent", transition: "color 0.15s, border-color 0.15s" }}>{tab}</button>
                            ))}
                          </div>

                          <div style={{ flex: 1, overflowY: "auto" }}>
                            {/* Customer Journey */}
                            {ventasTab === "Customer Journey" && (
                              <div style={{ position: "relative", paddingLeft: 24 }}>
                                <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 1, background: "rgba(37,99,235,0.2)" }} />
                                {JOURNEY_STEPS.map((step, i) => (
                                  <div key={i} style={{ display: "flex", gap: 16, marginBottom: 20, position: "relative" }}>
                                    <div style={{ position: "absolute", left: -20, top: 3, width: 10, height: 10, borderRadius: "50%", background: step.state === "future" ? "transparent" : "#2563EB", border: step.state === "future" ? "1px solid rgba(255,255,255,0.2)" : "none", boxShadow: step.state === "current" ? "0 0 0 3px rgba(37,99,235,0.2)" : "none", animation: step.state === "current" ? "pulse 2s infinite" : "none" }} />
                                    <div>
                                      <div style={{ color: step.state === "future" ? "rgba(255,255,255,0.35)" : "white", fontSize: 13, fontWeight: 500 }}>{step.title}</div>
                                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{step.desc}</div>
                                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 3 }}>{step.date}</div>
                                    </div>
                                  </div>
                                ))}
                                <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 3px rgba(37,99,235,0.2)} 50%{box-shadow:0 0 0 6px rgba(37,99,235,0.1)} }`}</style>
                              </div>
                            )}

                            {/* Actividad */}
                            {ventasTab === "Actividad" && (
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                                  {(["Todas", "Llamada", "Email", "Reunión"] as const).map(f => (
                                    <button key={f} onClick={() => setVentasActFilter(f)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, border: "none", cursor: "pointer", background: ventasActFilter === f ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.06)", color: ventasActFilter === f ? "#2563EB" : "rgba(255,255,255,0.5)", transition: "background 0.15s, color 0.15s" }}>{f}</button>
                                  ))}
                                </div>
                                {filteredActs.map((act, i) => {
                                  const meta = ACT_META[act.type] ?? ACT_META["Llamada"]
                                  return (
                                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${meta.color}1a`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{meta.icon}</div>
                                      <div>
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{act.title}</div>
                                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{act.date}</div>
                                      </div>
                                    </div>
                                  )
                                })}
                                <button style={{ marginTop: 16, border: "1px solid rgba(37,99,235,0.3)", color: "#2563EB", fontSize: 12, borderRadius: 6, padding: "7px 14px", background: "none", cursor: "pointer", alignSelf: "flex-start" }}>+ Registrar actividad</button>
                              </div>
                            )}

                            {/* Propuestas */}
                            {ventasTab === "Propuestas" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>Propuesta #001</span>
                                    <span style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>Enviada</span>
                                  </div>
                                  <div style={{ color: "white", fontSize: 18, fontWeight: 500, marginTop: 8 }}>{opp.amount}</div>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>Enviada hace 8 días</div>
                                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                    <button style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 12, borderRadius: 6, padding: "6px 14px", background: "none", cursor: "pointer" }}>Ver propuesta</button>
                                    <button style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Enviar recordatorio</button>
                                  </div>
                                </div>
                                <button style={{ border: "1px solid rgba(37,99,235,0.3)", color: "#2563EB", fontSize: 12, borderRadius: 6, padding: "7px 14px", background: "none", cursor: "pointer", alignSelf: "flex-start" }}>+ Nueva propuesta</button>
                              </div>
                            )}

                            {/* Notas */}
                            {ventasTab === "Notas" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <textarea placeholder="Escribí una nota sobre esta oportunidad..." style={{ width: "100%", minHeight: 120, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "white", fontSize: 13, padding: 12, resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const }} />
                                <button style={{ alignSelf: "flex-start", background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>Guardar nota</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  if (ventasView === "new") {
                    const STAGE_PROB: Record<string, number> = { Prospecto: 25, Propuesta: 50, Negociación: 75, Cerrado: 100 }
                    const inputStyle: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: 13, width: "100%", outline: "none", boxSizing: "border-box" }
                    const labelStyle: React.CSSProperties = { color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 6, display: "block" }
                    const field = (label: string, el: React.ReactNode) => (
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>{label}</label>
                        {el}
                      </div>
                    )
                    const filteredClients = crmClients.filter(c =>
                      !newOppClientSearch || c.name.toLowerCase().includes(newOppClientSearch.toLowerCase()) || c.company.toLowerCase().includes(newOppClientSearch.toLowerCase())
                    )
                    return (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
                        <div style={{ flex: 1, overflowY: "auto", padding: 24, paddingBottom: 80 }}>
                          <div style={{ display: "flex", gap: 24 }}>
                            {/* Left column */}
                            <div style={{ width: "45%", flexShrink: 0 }}>
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Datos de la oportunidad</div>

                              {/* Cliente dropdown */}
                              <div style={{ marginBottom: 12, position: "relative" }}>
                                <label style={labelStyle}>Cliente</label>
                                <div
                                  onClick={() => setNewOppClientOpen(v => !v)}
                                  style={{ ...inputStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                >
                                  <span style={{ color: newOppClient ? "white" : "rgba(255,255,255,0.25)" }}>{newOppClient || "Seleccionar cliente..."}</span>
                                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>▾</span>
                                </div>
                                {newOppClientOpen && (
                                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#0D0D14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, zIndex: 50, overflow: "hidden" }}>
                                    <input
                                      autoFocus
                                      placeholder="Buscar cliente..."
                                      value={newOppClientSearch}
                                      onChange={e => setNewOppClientSearch(e.target.value)}
                                      onClick={e => e.stopPropagation()}
                                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "8px 12px", color: "white", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                                    />
                                    <div style={{ maxHeight: 160, overflowY: "auto" }}>
                                      {filteredClients.map(c => (
                                        <div key={c.id} onClick={() => { setNewOppClient(c.name); setNewOppClientOpen(false); setNewOppClientSearch("") }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer" }}
                                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        >
                                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <span style={{ color: "#2563EB", fontSize: 8, fontWeight: 600 }}>{c.name.split(" ").map((w: string) => w[0]).slice(0,2).join("")}</span>
                                          </div>
                                          <div>
                                            <div style={{ color: "white", fontSize: 12 }}>{c.name}</div>
                                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{c.company}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                      <span style={{ color: "#2563EB", fontSize: 12, cursor: "pointer" }}>Crear cliente nuevo →</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Monto */}
                              {field("Monto estimado",
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>$</span>
                                  <input type="number" placeholder="0" value={newOppAmount} onChange={e => setNewOppAmount(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                </div>
                              )}

                              {/* Etapa */}
                              <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Etapa inicial</label>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                                  {["Prospecto", "Propuesta", "Negociación", "Cerrado"].map(s => {
                                    const sc = STAGE_BADGE_COLOR[s]
                                    const sb = STAGE_BADGE_BG[s]
                                    const active = newOppStage === s
                                    return (
                                      <button key={s} onClick={() => { setNewOppStage(s); setNewOppProb(STAGE_PROB[s]) }} style={{ borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", border: `1px solid ${sc}`, background: active ? sb : "transparent", color: sc, fontWeight: active ? 600 : 400 }}>{s}</button>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Probabilidad slider */}
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                  <label style={{ ...labelStyle, marginBottom: 0 }}>Probabilidad de cierre</label>
                                  <span style={{ color: "white", fontSize: 12, fontWeight: 500 }}>{newOppProb}%</span>
                                </div>
                                <input type="range" min={0} max={100} value={newOppProb} onChange={e => setNewOppProb(Number(e.target.value))}
                                  style={{ width: "100%", accentColor: "#2563EB", cursor: "pointer" }} />
                              </div>

                              {field("Fecha de cierre estimada",
                                <input type="date" value={newOppDate} onChange={e => setNewOppDate(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" as const }} />
                              )}

                              {field("Vendedor asignado",
                                <select value={newOppSeller} onChange={e => setNewOppSeller(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                                  {[["JP", "Juan Pérez"], ["CA", "Carlos Acosta"], ["MR", "María Ruiz"]].map(([id, name]) => (
                                    <option key={id} value={id} style={{ background: "#0D0D14" }}>{id} — {name}</option>
                                  ))}
                                </select>
                              )}

                              {field("Origen del lead",
                                <select value={newOppOrigin} onChange={e => setNewOppOrigin(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                                  {["Campaña digital", "Referido", "Contacto directo", "Red social", "Evento", "Otro"].map(o => (
                                    <option key={o} value={o} style={{ background: "#0D0D14" }}>{o}</option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Right column */}
                            <div style={{ flex: 1 }}>
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Descripción y contexto</div>

                              {field("Descripción de la oportunidad",
                                <textarea placeholder={"Describí brevemente qué busca este cliente y por qué es una oportunidad..."} value={newOppDesc} onChange={e => setNewOppDesc(e.target.value)} style={{ ...inputStyle, minHeight: 100, resize: "vertical" as const }} />
                              )}

                              {field("Notas del vendedor",
                                <textarea placeholder={"Contexto adicional, objeciones detectadas, próximos pasos..."} value={newOppNotes} onChange={e => setNewOppNotes(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical" as const }} />
                              )}

                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginTop: 20, marginBottom: 16 }}>Primer contacto</div>

                              <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Tipo de contacto</label>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {["Llamada", "Email", "Reunión", "Visita"].map(t => (
                                    <button key={t} onClick={() => setNewOppContactType(t)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, border: "none", cursor: "pointer", background: newOppContactType === t ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.06)", color: newOppContactType === t ? "#2563EB" : "rgba(255,255,255,0.5)", transition: "background 0.15s, color 0.15s" }}>{t}</button>
                                  ))}
                                </div>
                              </div>

                              {field("Fecha",
                                <input type="date" value={newOppContactDate} onChange={e => setNewOppContactDate(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" as const }} />
                              )}

                              {field("¿Cómo fue el primer contacto?",
                                <textarea placeholder="Resumí brevemente..." value={newOppContactDesc} onChange={e => setNewOppContactDesc(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical" as const }} />
                              )}

                              {/* AI suggestion */}
                              <div style={{ marginTop: 20, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 10, padding: 14 }}>
                                <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>✦ Pupi sugiere</div>
                                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.5 }}>
                                  Basado en el perfil de este cliente, el tiempo promedio de cierre es 18 días y la probabilidad estimada es 65%. Te recomendamos asignarla a JP según su historial con clientes similares.
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom bar */}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#0D0D14", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <button onClick={() => setVentasView("pipeline")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", transition: "color 0.15s" }} onMouseEnter={e => (e.currentTarget.style.color = "white")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>Cancelar</button>
                          <button onClick={() => setVentasView("pipeline")} style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Crear oportunidad</button>
                        </div>
                      </div>
                    )
                  }

                  if (ventasView === "risk") {
                    const RISK_OPPS = [
                      { name: "Carlos Mendoza", company: "Tech Solutions", amount: "$18.500", stage: "Negociación", reason: "Lleva 14 días en negociación sin actividad registrada. El promedio de cierre es 18 días — está cerca del límite.", action: "Llamar hoy y preguntar por objeciones pendientes", opp: OPPS.find(o => o.name === "Carlos Mendoza") },
                      { name: "Sofía Martínez",  company: "Retail Express",  amount: "$8.900",  stage: "Propuesta",   reason: "La propuesta fue enviada hace 7 días sin respuesta. Clientes similares responden en promedio en 3 días.",        action: "Enviar email de seguimiento con nueva propuesta o descuento", opp: OPPS.find(o => o.name === "Sofía Martínez") },
                    ]
                    return (
                      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                        <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Oportunidades en riesgo</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 4, marginBottom: 24 }}>Requieren atención inmediata</div>
                        {RISK_OPPS.map((r, i) => {
                          const sc = STAGE_BADGE_COLOR[r.stage] ?? "rgba(255,255,255,0.3)"
                          const sb = STAGE_BADGE_BG[r.stage] ?? "rgba(255,255,255,0.06)"
                          return (
                            <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderLeft: "3px solid #ef4444", borderTop: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 10px 10px 0", padding: "16px 20px", marginBottom: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                  <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{r.name}</div>
                                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{r.company}</div>
                                </div>
                                <div style={{ textAlign: "right" as const }}>
                                  <div style={{ color: "white", fontSize: 16, fontWeight: 600 }}>{r.amount}</div>
                                  <span style={{ background: sb, color: sc, border: `1px solid ${sc}`, borderRadius: 20, padding: "2px 8px", fontSize: 11, marginTop: 4, display: "inline-block" }}>{r.stage}</span>
                                </div>
                              </div>
                              <div style={{ marginTop: 12, background: "rgba(239,68,68,0.06)", borderRadius: 6, padding: "10px 12px", display: "flex", gap: 8 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                                <div>
                                  <div style={{ color: "#ef4444", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 }}>Por qué está en riesgo</div>
                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{r.reason}</div>
                                </div>
                              </div>
                              <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                <span style={{ color: "#2563EB", fontSize: 11 }}>Acción sugerida: </span>
                                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{r.action}</span>
                              </div>
                              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                                <button style={{ border: "1px solid rgba(37,99,235,0.3)", color: "#2563EB", fontSize: 12, borderRadius: 6, padding: "6px 14px", background: "none", cursor: "pointer" }}>Registrar contacto</button>
                                <button onClick={() => { if (r.opp) { setVentasSelectedOpp(r.opp); setVentasView("detail"); setVentasTab("Customer Journey") } }} style={{ background: "rgba(37,99,235,0.1)", color: "#2563EB", fontSize: 12, borderRadius: 6, padding: "6px 14px", border: "none", cursor: "pointer" }}>Ver oportunidad →</button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  }

                  return (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      {/* Secondary nav */}
                      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", flexShrink: 0 }}>
                        {(["Pipeline", "Pronóstico", "Comisiones", "Vendedores", "Productos"] as const).map(nav => (
                          <button key={nav} onClick={() => setVentasNavTab(nav)} style={{ padding: "12px 16px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: ventasNavTab === nav ? "white" : "rgba(255,255,255,0.35)", borderBottom: `2px solid ${ventasNavTab === nav ? "#2563EB" : "transparent"}`, transition: "color 0.15s, border-color 0.15s", marginBottom: -1 }}>{nav}</button>
                        ))}
                      </div>

                      {/* Forecast view */}
                      {ventasNavTab === "Pronóstico" && (
                        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                          {/* Summary cards */}
                          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Pronóstico este mes</div>
                              <div style={{ color: "white", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>$56.350</div>
                              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: "68%", background: "rgba(37,99,235,0.6)", borderRadius: 2 }} />
                              </div>
                              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 6 }}>68% alcanzado</div>
                            </div>
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Mejor escenario</div>
                              <div style={{ color: "#22c55e", fontSize: 20, fontWeight: 600, marginBottom: 6 }}>$72.800</div>
                              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Si cierran todas las oportunidades activas</div>
                            </div>
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Peor escenario</div>
                              <div style={{ color: "#ef4444", fontSize: 20, fontWeight: 600, marginBottom: 6 }}>$31.200</div>
                              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Solo oportunidades en negociación</div>
                            </div>
                          </div>

                          {/* Monthly chart */}
                          <div style={{ marginBottom: 24 }}>
                            <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Evolución mensual</div>
                            {(() => {
                              const months = [
                                { label: "Ene", real: 28, pron: 30, forecast: false },
                                { label: "Feb", real: 35, pron: 32, forecast: false },
                                { label: "Mar", real: 31, pron: 35, forecast: false },
                                { label: "Abr", real: 42, pron: 38, forecast: false },
                                { label: "May", real: 38, pron: 40, forecast: false },
                                { label: "Jun", real: 0,  pron: 56, forecast: true  },
                              ]
                              const maxVal = 60
                              const H = 120
                              return (
                                <>
                                  <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: H }}>
                                    {months.map((m) => (
                                      <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, height: "100%", justifyContent: "flex-end" }}>
                                        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", width: "100%" }}>
                                          {!m.forecast && (
                                            <div style={{ flex: 1, height: Math.round((m.real / maxVal) * H), background: "rgba(37,99,235,0.5)", borderRadius: "4px 4px 0 0" }} />
                                          )}
                                          <div style={{ flex: 1, height: Math.round((m.pron / maxVal) * H), background: m.forecast ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.15)", border: m.forecast ? "1px dashed rgba(37,99,235,0.4)" : "1px solid rgba(37,99,235,0.2)", borderRadius: "4px 4px 0 0", boxSizing: "border-box" as const }} />
                                        </div>
                                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 4 }}>{m.label}</div>
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <div style={{ width: 10, height: 10, background: "rgba(37,99,235,0.5)", borderRadius: 2 }} />
                                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Real</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <div style={{ width: 10, height: 10, background: "transparent", border: "1px solid rgba(37,99,235,0.4)", borderRadius: 2 }} />
                                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Pronóstico</span>
                                    </div>
                                  </div>
                                </>
                              )
                            })()}
                          </div>

                          {/* AI recommendations */}
                          <div>
                            <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>✦ Recomendaciones Pupi</div>
                            {[
                              { priority: "Alta",  color: "#ef4444", title: "Contactar a Carlos Mendoza hoy", reason: "Lleva 14 días en negociación. Su probabilidad de cierre baja un 5% por cada día adicional." },
                              { priority: "Alta",  color: "#ef4444", title: "Mover propuesta de Sofía Martínez a negociación", reason: "Enviaste la propuesta hace 7 días sin respuesta — ideal para seguimiento." },
                              { priority: "Media", color: "#eab308", title: "Agregar 3 nuevos prospectos esta semana", reason: "El pipeline tiene pocas oportunidades en etapa inicial para sostener el mes que viene." },
                            ].map((rec, i) => (
                              <div key={i} style={{ display: "flex", gap: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: rec.color, flexShrink: 0, marginTop: 4 }} />
                                <div>
                                  <div style={{ color: rec.color, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 }}>{rec.priority} prioridad</div>
                                  <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{rec.title}</div>
                                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{rec.reason}</div>
                                  <button style={{ background: "none", border: "none", color: "#2563EB", fontSize: 11, cursor: "pointer", padding: 0, marginTop: 8 }}>Aplicar →</button>
                                </div>
                              </div>
                            ))}
                            {/* Retargeting section */}
                            <div style={{ marginTop: 24 }}>
                              <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>✦ Retargeting interno</div>
                              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 16 }}>Clientes que compraron antes y están fuera de su ciclo habitual</div>
                              {[
                                { name: "Ana Rodríguez",  company: "Sin empresa",      last: "31 días", cycle: "20 días", overdue: "+11 días fuera de ciclo" },
                                { name: "Valentina Cruz",  company: "Sin empresa",      last: "45 días", cycle: "30 días", overdue: "+15 días fuera de ciclo" },
                                { name: "Martín Pérez",    company: "Constructora MP",  last: "7 días",  cycle: "6 días",  overdue: "+1 día fuera de ciclo"   },
                              ].map((r, i) => {
                                const initials = r.name.split(" ").map((w: string) => w[0]).slice(0,2).join("")
                                const colors = ["#2563EB", "#7c3aed", "#0891b2"]
                                return (
                                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${colors[i]}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <span style={{ color: colors[i], fontSize: 11, fontWeight: 600 }}>{initials}</span>
                                      </div>
                                      <div>
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{r.company}</div>
                                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>Último pedido hace {r.last} · Ciclo promedio: {r.cycle}</div>
                                      </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                                      <span style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{r.overdue}</span>
                                      <button style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", color: "#2563EB", fontSize: 12, borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>Contactar →</button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comisiones view */}
                      {ventasNavTab === "Comisiones" && (
                        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                          {/* Top bar */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <div>
                              <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Comisiones</div>
                              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>Mayo 2026</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button onClick={() => setShowCommModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                                </svg>
                                Configurar comisiones
                              </button>
                              <button style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.4)", borderRadius: 6, padding: "4px 8px", fontSize: 13, cursor: "pointer" }}>←</button>
                              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Mayo 2026</span>
                              <button style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.4)", borderRadius: 6, padding: "4px 8px", fontSize: 13, cursor: "pointer" }}>→</button>
                            </div>
                          </div>

                          {/* Commission config modal */}
                          {showCommModal && (
                            <div onClick={(e) => { if (e.target === e.currentTarget) setShowCommModal(false) }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
                              <div style={{ background: "#0D0D14", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 14, width: 480, maxHeight: "80vh", overflowY: "auto", padding: 24 }}>
                                {/* Modal header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                  <div style={{ color: "white", fontSize: 16, fontWeight: 500 }}>Configuración de comisiones</div>
                                  <button onClick={() => setShowCommModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>×</button>
                                </div>

                                {/* Section 1 — Tipo */}
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 8 }}>Tipo de comisión</div>
                                {[
                                  { label: "Porcentaje fijo por vendedor",   desc: "Cada vendedor tiene su propio %" },
                                  { label: "Porcentaje por tramo de venta",  desc: "El % cambia según el monto vendido" },
                                  { label: "Monto fijo por venta cerrada",   desc: "Monto fijo independiente del valor" },
                                ].map((opt, idx) => (
                                  <div key={idx} onClick={() => setCommType(idx as 0|1|2)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 6, background: commType === idx ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${commType === idx ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.07)"}`, transition: "background 0.15s, border-color 0.15s" }}>
                                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: commType === idx ? "#2563EB" : "transparent", border: commType === idx ? "none" : "1px solid rgba(255,255,255,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      {commType === idx && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
                                    </div>
                                    <div>
                                      <div style={{ color: "white", fontSize: 13 }}>{opt.label}</div>
                                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{opt.desc}</div>
                                    </div>
                                  </div>
                                ))}

                                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0" }} />

                                {/* Section 2a — Porcentaje por vendedor */}
                                {commType === 0 && (
                                  <div>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 12 }}>Comisión por vendedor</div>
                                    {[{ id: "JP", name: "Juan Pérez" }, { id: "CA", name: "Carlos Acosta" }, { id: "MR", name: "María Ruiz" }].map(s => (
                                      <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ color: "#2563EB", fontSize: 10, fontWeight: 600 }}>{s.id}</span>
                                          </div>
                                          <span style={{ color: "white", fontSize: 13 }}>{s.name}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          <input type="number" value={commRates[s.id]} onChange={e => setCommRates(prev => ({ ...prev, [s.id]: e.target.value }))} style={{ width: 60, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "white", fontSize: 13, textAlign: "right" as const, outline: "none" }} />
                                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>%</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Section 2b — Tramos */}
                                {commType === 1 && (
                                  <div>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 12 }}>Tramos</div>
                                    {[["Hasta $10.000", "6"], ["Hasta $30.000", "8"], ["Más de $30.000", "10"]].map(([label, pct], i) => (
                                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                        <input defaultValue={label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "white", fontSize: 12, outline: "none" }} />
                                        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>→</span>
                                        <input defaultValue={pct} type="number" style={{ width: 56, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "white", fontSize: 13, textAlign: "right" as const, outline: "none" }} />
                                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>%</span>
                                      </div>
                                    ))}
                                    <button style={{ background: "none", border: "none", color: "#2563EB", fontSize: 11, cursor: "pointer", padding: 0, marginTop: 4 }}>+ Agregar tramo</button>
                                  </div>
                                )}

                                {/* Section 2c — Monto fijo */}
                                {commType === 2 && (
                                  <div>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 12 }}>Monto fijo por venta</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>$</span>
                                      <input type="number" defaultValue="500" style={{ width: 120, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "white", fontSize: 13, outline: "none" }} />
                                    </div>
                                  </div>
                                )}

                                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0" }} />

                                {/* Section 3 — Periodicidad */}
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 8 }}>Pago de comisiones</div>
                                {[
                                  { label: "Mensual — al cierre del mes" },
                                  { label: "Por venta — al cerrar cada venta" },
                                ].map((opt, idx) => (
                                  <div key={idx} onClick={() => setCommPeriod(idx as 0|1)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 6, background: commPeriod === idx ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${commPeriod === idx ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.07)"}`, transition: "background 0.15s, border-color 0.15s" }}>
                                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: commPeriod === idx ? "#2563EB" : "transparent", border: commPeriod === idx ? "none" : "1px solid rgba(255,255,255,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      {commPeriod === idx && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
                                    </div>
                                    <span style={{ color: "white", fontSize: 13 }}>{opt.label}</span>
                                  </div>
                                ))}

                                {/* Footer */}
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16, marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                  <button onClick={() => setShowCommModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                                  <button onClick={() => setShowCommModal(false)} style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Guardar configuración</button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Summary cards */}
                          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                            {[
                              { label: "Total comisiones", value: "$8.420", valueSize: 20, valueColor: "white", sub: "3 vendedores activos" },
                              { label: "Mayor comisión",   value: "JP — $3.890", valueSize: 16, valueColor: "white", sub: "Juan Pérez · 8 ventas" },
                              { label: "Tasa promedio",    value: "8%",  valueSize: 20, valueColor: "white", sub: "Sobre ventas cerradas" },
                            ].map(({ label, value, valueSize, valueColor, sub }) => (
                              <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
                                <div style={{ color: valueColor, fontSize: valueSize, fontWeight: 500, marginBottom: 6 }}>{value}</div>
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{sub}</div>
                              </div>
                            ))}
                          </div>

                          {/* Sellers table */}
                          {(() => {
                            const sellers = [
                              { id: "JP", name: "Juan Pérez",    ventas: 8, monto: "$48.750", tasa: "8%", comision: "$3.890", estado: "Pendiente" as const,
                                deals: [["Tech Solutions",  "$18.500", "$1.480"], ["Constructora MP", "$9.350", "$748"], ["Retail Express", "$8.900", "$712"]] },
                              { id: "CA", name: "Carlos Acosta", ventas: 5, monto: "$31.200", tasa: "8%", comision: "$2.496", estado: "Pagada" as const, deals: [] },
                              { id: "MR", name: "María Ruiz",    ventas: 4, monto: "$25.420", tasa: "8%", comision: "$2.034", estado: "Pagada" as const, deals: [] },
                            ]
                            const ESTADO_STYLE: Record<"Pagada" | "Pendiente", { bg: string; color: string; border: string }> = {
                              Pagada:    { bg: "rgba(34,197,94,0.1)",  color: "#22c55e", border: "rgba(34,197,94,0.2)"  },
                              Pendiente: { bg: "rgba(234,179,8,0.1)",  color: "#eab308", border: "rgba(234,179,8,0.2)"  },
                            }
                            const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 0 }
                            return (
                              <div style={{ marginBottom: 24, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
                                {/* Header */}
                                <div style={{ ...gridStyle, background: "rgba(255,255,255,0.03)", padding: "10px 16px" }}>
                                  {["Vendedor", "Ventas", "Monto total", "Tasa", "Comisión", "Estado"].map(col => (
                                    <div key={col} style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{col}</div>
                                  ))}
                                </div>
                                {/* Rows */}
                                {sellers.map(seller => {
                                  const es = ESTADO_STYLE[seller.estado]
                                  const expanded = ventasCommExpanded === seller.id
                                  return (
                                    <div key={seller.id}>
                                      <div
                                        onClick={() => setVentasCommExpanded(expanded ? null : seller.id)}
                                        style={{ ...gridStyle, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: expanded ? "rgba(255,255,255,0.02)" : "transparent", transition: "background 0.15s", alignItems: "center" }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <span style={{ color: "#2563EB", fontSize: 10, fontWeight: 600 }}>{seller.id}</span>
                                          </div>
                                          <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{seller.name}</span>
                                        </div>
                                        <div style={{ color: "white", fontSize: 13 }}>{seller.ventas}</div>
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{seller.monto}</div>
                                        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{seller.tasa}</div>
                                        <div style={{ color: "#22c55e", fontSize: 13, fontWeight: 500 }}>{seller.comision}</div>
                                        <div>
                                          <span style={{ background: es.bg, color: es.color, border: `1px solid ${es.border}`, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{seller.estado}</span>
                                        </div>
                                      </div>
                                      {expanded && seller.deals.length > 0 && (
                                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px 16px 12px 48px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                          {seller.deals.map(([client, amount, comm], i) => (
                                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                                              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{client}</span>
                                              <div style={{ display: "flex", gap: 12 }}>
                                                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{amount}</span>
                                                <span style={{ color: "#22c55e", fontSize: 11 }}>→ {comm}</span>
                                              </div>
                                            </div>
                                          ))}
                                          <div style={{ color: "rgba(37,99,235,0.6)", fontSize: 11, marginTop: 6, cursor: "pointer" }}>+ 5 ventas más...</div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}

                          {/* AI insights */}
                          <div>
                            <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>✦ Análisis Pupi</div>
                            <div style={{ display: "flex", gap: 12 }}>
                              {[
                                {
                                  iconPath: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
                                  title: "JP cierra mejor los martes",
                                  text: "El 62% de sus cierres ocurren entre martes y miércoles. Agendá visitas clave esos días.",
                                },
                                {
                                  iconPath: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
                                  title: "MR tiene mejor tasa con clientes nuevos",
                                  text: "Convierte el 78% de los primeros contactos. Ideal para asignarle prospectos nuevos.",
                                },
                              ].map(({ iconPath, title, text }, i) => (
                                <div key={i} style={{ flex: 1, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.12)", borderRadius: 10, padding: 14 }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{iconPath}</svg>
                                  <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginTop: 6 }}>{title}</div>
                                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{text}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Vendedores view */}
                      {ventasNavTab === "Vendedores" && (() => {
                        const SELLERS = [
                          { key: "JP", name: "Juan Pérez",    ventas: 8, montoNum: 48750, monto: "$48.750", cierre: "80%", ticket: "$6.094", tiempo: "16 días", vsAnt: "↑ 18%", vsColor: "#22c55e" },
                          { key: "CA", name: "Carlos Acosta", ventas: 5, montoNum: 31200, monto: "$31.200", cierre: "63%", ticket: "$6.240", tiempo: "21 días", vsAnt: "↓ 5%",  vsColor: "#ef4444" },
                          { key: "MR", name: "María Ruiz",    ventas: 4, montoNum: 25420, monto: "$25.420", cierre: "57%", ticket: "$6.355", tiempo: "19 días", vsAnt: "↑ 3%",  vsColor: "#22c55e" },
                        ]
                        const metaColor = (pct: number) => pct >= 80 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444"
                        const PATTERNS = [
                          { key: "JP", title: "JP cierra mejor los martes",              body: "62% de sus cierres son entre martes y miércoles. Agendá sus visitas clave esos días." },
                          { key: "MR", title: "MR convierte mejor clientes nuevos",      body: "Tasa de conversión de 78% en primeros contactos. Ideal para asignarle nuevos prospectos." },
                          { key: "CA", title: "CA necesita más seguimiento post-propuesta", body: "Sus propuestas tardan 8 días más en cerrarse que el promedio. Revisar proceso de seguimiento." },
                        ]
                        const fmtNum = (n: number) => "$" + n.toLocaleString("es-AR")
                        const totalActual = SELLERS.reduce((a, s) => a + s.montoNum, 0)
                        const teamGoalNum = parseInt(goalTeam.replace(/\D/g, "")) || 150000
                        const teamPct = Math.round((totalActual / teamGoalNum) * 100)
                        const sumIndividual = SELLERS.reduce((a, s) => a + (parseInt(goalRates[s.key]?.replace(/\D/g,"") || "50000")), 0)
                        const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
                          <div onClick={onToggle} style={{ width: 36, height: 20, borderRadius: 10, background: on ? "#2563EB" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative" as const, flexShrink: 0, transition: "background 0.2s" }}>
                            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", position: "absolute" as const, top: 2, left: on ? 18 : 2, transition: "left 0.2s" }} />
                          </div>
                        )
                        return (
                          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                            {/* Goals modal */}
                            {showGoalsModal && (
                              <div style={{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowGoalsModal(false)}>
                                <div style={{ background: "#0f1e35", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: 420, maxHeight: "85vh", overflowY: "auto" as const }} onClick={e => e.stopPropagation()}>
                                  <div style={{ color: "white", fontSize: 16, fontWeight: 500 }}>Metas de ventas</div>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 20, marginTop: 2 }}>Mayo 2026</div>

                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Tipo de meta</div>
                                  {[["Por monto vendido — $", 0], ["Por cantidad de ventas — unidades", 1]].map(([label, val]) => (
                                    <div key={val} onClick={() => setGoalsType(val as 0 | 1)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: `1px solid ${goalsType === val ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`, background: goalsType === val ? "rgba(37,99,235,0.1)" : "rgba(255,255,255,0.02)", cursor: "pointer", marginBottom: 8, transition: "all 0.15s" }}>
                                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${goalsType === val ? "#2563EB" : "rgba(255,255,255,0.2)"}`, background: goalsType === val ? "#2563EB" : "transparent", transition: "all 0.15s" }} />
                                      <span style={{ color: goalsType === val ? "white" : "rgba(255,255,255,0.5)", fontSize: 13 }}>{label}</span>
                                    </div>
                                  ))}

                                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>Meta por vendedor</div>
                                  {SELLERS.map(s => {
                                    const goalVal = parseInt(goalRates[s.key]?.replace(/\D/g,"") || "50000")
                                    const pct = Math.round((s.montoNum / goalVal) * 100)
                                    return (
                                      <div key={s.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", fontSize: 11, fontWeight: 700 }}>{s.key}</div>
                                          <div>
                                            <div style={{ color: "white", fontSize: 13 }}>{s.name}</div>
                                            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Progreso actual: {s.monto} ({pct}%)</div>
                                          </div>
                                        </div>
                                        <div style={{ position: "relative" as const, width: 110 }}>
                                          {goalsType === 0 && <span style={{ position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", fontSize: 13, pointerEvents: "none" }}>$</span>}
                                          <input type="text" value={goalRates[s.key] || ""} onChange={e => setGoalRates(p => ({ ...p, [s.key]: e.target.value }))}
                                            style={{ width: "100%", padding: goalsType === 0 ? "7px 8px 7px 22px" : "7px 50px 7px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
                                          {goalsType === 1 && <span style={{ position: "absolute" as const, right: 8, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 11, pointerEvents: "none" }}>ventas</span>}
                                        </div>
                                      </div>
                                    )
                                  })}

                                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Meta global del equipo</div>
                                  <div style={{ marginBottom: 4 }}>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 5 }}>Meta total del equipo</div>
                                    <div style={{ position: "relative" as const }}>
                                      <span style={{ position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", fontSize: 13, pointerEvents: "none" }}>$</span>
                                      <input type="text" value={goalTeam} onChange={e => setGoalTeam(e.target.value)}
                                        style={{ width: "100%", padding: "8px 8px 8px 22px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
                                    </div>
                                  </div>
                                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>Suma de metas individuales: ${sumIndividual.toLocaleString("es-AR")}</div>

                                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Alertas</div>
                                  {[
                                    { label: "Alertar cuando un vendedor está por debajo del 50% a mitad de mes", on: goalsAlertBelow, toggle: () => setGoalsAlertBelow(p => !p) },
                                    { label: "Alertar cuando la meta global está en riesgo", on: goalsAlertRisk, toggle: () => setGoalsAlertRisk(p => !p) },
                                  ].map(row => (
                                    <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                      <Toggle on={row.on} onToggle={row.toggle} />
                                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, flex: 1 }}>{row.label}</span>
                                    </div>
                                  ))}

                                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                                    <button onClick={() => setShowGoalsModal(false)} style={{ padding: "9px 16px", fontSize: 13, background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Cancelar</button>
                                    <button onClick={() => setShowGoalsModal(false)} style={{ padding: "9px 16px", fontSize: 13, background: "#2563EB", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontWeight: 500 }}>Guardar metas</button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Top bar */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                              <div>
                                <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Rendimiento de vendedores</div>
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>Mayo 2026 · 3 vendedores activos</div>
                              </div>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <select style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: 12, outline: "none", cursor: "pointer" }}>
                                  {["Mayo 2026","Abril 2026","Marzo 2026","Q2 2026"].map(m => <option key={m}>{m}</option>)}
                                </select>
                                <button onClick={() => setShowGoalsModal(true)} style={{ padding: "6px 12px", fontSize: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                                  Configurar metas
                                </button>
                              </div>
                            </div>

                            {/* Global goal card */}
                            <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 12, padding: 18, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                              <div>
                                <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>Meta global del equipo</div>
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>Mayo 2026</div>
                              </div>
                              <div style={{ flex: 1, maxWidth: 300 }}>
                                <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                                  <div style={{ width: `${Math.min(teamPct, 100)}%`, height: "100%", background: "#2563EB", borderRadius: 4 }} />
                                </div>
                                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{fmtNum(totalActual)} de {fmtNum(teamGoalNum)}</div>
                              </div>
                              <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                                <div style={{ color: "white", fontSize: 28, fontWeight: 600 }}>{teamPct}%</div>
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>alcanzado</div>
                              </div>
                            </div>

                            {/* Seller cards row */}
                            <div style={{ display: "flex", gap: 14, marginBottom: showGoalsBanner ? 0 : 24 }}>
                              {SELLERS.map(s => {
                                const goalVal = parseInt(goalRates[s.key]?.replace(/\D/g,"") || "50000")
                                const pct = Math.round((s.montoNum / goalVal) * 100)
                                const diff = goalVal - s.montoNum
                                const tooltip = diff > 0 ? `Faltan ${fmtNum(diff)} para la meta` : `¡Meta superada! +${fmtNum(-diff)}`
                                return (
                                  <div key={s.key} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 18, cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.2)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.key}</div>
                                      <div>
                                        <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{s.name}</div>
                                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{s.ventas} ventas este mes</div>
                                      </div>
                                    </div>
                                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
                                    {[["MONTO TOTAL", s.monto],["TASA DE CIERRE", s.cierre],["TICKET PROMEDIO", s.ticket],["TIEMPO CIERRE", s.tiempo]].map(([k, v]) => (
                                      <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{k}</span>
                                        <span style={{ color: "white", fontSize: 12, fontWeight: 500 }}>{v}</span>
                                      </div>
                                    ))}
                                    <div style={{ marginTop: 4 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>META MENSUAL</span>
                                        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{s.monto} / {fmtNum(goalVal)}</span>
                                      </div>
                                      <div title={tooltip} style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", cursor: "help" }}>
                                        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: metaColor(pct), borderRadius: 2 }} />
                                      </div>
                                      <div style={{ color: metaColor(pct), fontSize: 11, marginTop: 4, textAlign: "right" as const }}>{pct}%</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Goal alerts banner */}
                            {showGoalsBanner && (
                              <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 16px", margin: "16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                  <span style={{ color: "#ef4444", fontSize: 13 }}>CA y MR están por debajo del 50% de su meta mensual</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                  <button style={{ padding: "4px 10px", background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Ver detalles</button>
                                  <button onClick={() => setShowGoalsBanner(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>×</button>
                                </div>
                              </div>
                            )}

                            {/* Comparison table */}
                            <div style={{ marginTop: showGoalsBanner ? 0 : 8 }}>
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Comparativo detallado</div>
                              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px 8px 0 0" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 16px" }}>
                                  {["VENDEDOR","VENTAS","MONTO","CIERRE %","TICKET","TIEMPO","VS MES ANT"].map(h => (
                                    <span key={h} style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{h}</span>
                                  ))}
                                </div>
                              </div>
                              {SELLERS.map(s => (
                                <div key={s.key} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", fontSize: 10, fontWeight: 700 }}>{s.key}</div>
                                    <span style={{ color: "white", fontSize: 13 }}>{s.name}</span>
                                  </div>
                                  <span style={{ color: "white", fontSize: 13 }}>{s.ventas}</span>
                                  <span style={{ color: "white", fontSize: 13 }}>{s.monto}</span>
                                  <span style={{ color: "white", fontSize: 13 }}>{s.cierre}</span>
                                  <span style={{ color: "white", fontSize: 13 }}>{s.ticket}</span>
                                  <span style={{ color: "white", fontSize: 13 }}>{s.tiempo}</span>
                                  <span style={{ color: s.vsColor, fontSize: 13, fontWeight: 500 }}>{s.vsAnt}</span>
                                </div>
                              ))}
                            </div>

                            {/* AI patterns */}
                            <div style={{ marginTop: 24 }}>
                              <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>✦ Patrones detectados por Pupi</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {PATTERNS.map(p => (
                                  <div key={p.key} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{p.key}</div>
                                    <div>
                                      <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{p.title}</div>
                                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{p.body}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div style={{ height: 24 }} />
                          </div>
                        )
                      })()}

                      {/* Productos view */}
                      {ventasNavTab === "Productos" && (() => {
                        // prodSearch/setProdSearch lifted to component state
                        const PRODUCTS = [
                          { name: "Producto A", cat: "Categoría 1", dot: "#2563EB", units: 32, revenue: "$28.800", margin: 62, trend: "up",   vs: "↑ 24%", vsColor: "#22c55e" },
                          { name: "Producto B", cat: "Categoría 1", dot: "#a855f7", units: 18, revenue: "$48.750", margin: 45, trend: "up",   vs: "↑ 12%", vsColor: "#22c55e" },
                          { name: "Producto C", cat: "Categoría 2", dot: "#22c55e", units: 24, revenue: "$14.400", margin: 68, trend: "flat", vs: "→ 0%",  vsColor: "rgba(255,255,255,0.4)" },
                          { name: "Producto D", cat: "Categoría 2", dot: "#eab308", units: 11, revenue: "$9.900",  margin: 38, trend: "down", vs: "↓ 8%",  vsColor: "#ef4444" },
                          { name: "Producto E", cat: "Categoría 3", dot: "#f97316", units: 8,  revenue: "$6.400",  margin: 52, trend: "up",   vs: "↑ 5%",  vsColor: "#22c55e" },
                          { name: "Producto F", cat: "Categoría 3", dot: "#ef4444", units: 5,  revenue: "$3.750",  margin: 28, trend: "down", vs: "↓ 15%", vsColor: "#ef4444" },
                        ]
                        const marginColor = (m: number) => m >= 50 ? "#22c55e" : m >= 30 ? "#eab308" : "#ef4444"
                        const Sparkline = ({ trend }: { trend: string }) => {
                          const pts: Record<string, number[]> = {
                            up:   [8,10,7,12,14,18],
                            down: [18,15,14,12,10,8],
                            flat: [12,11,13,12,12,13],
                          }
                          const vals = pts[trend] || pts.flat
                          const maxV = Math.max(...vals), minV = Math.min(...vals)
                          const W = 60, H = 20
                          const px = (i: number) => (i / (vals.length - 1)) * W
                          const py = (v: number) => H - ((v - minV) / (maxV - minV + 0.01)) * H
                          const color = trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "rgba(255,255,255,0.3)"
                          const points = vals.map((v, i) => `${px(i)},${py(v)}`).join(" ")
                          return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}><polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>
                        }
                        const COMBOS = [
                          { a: { name: "Producto A", dot: "#2563EB" }, b: { name: "Producto C", dot: "#22c55e" }, pct: "68%" },
                          { a: { name: "Producto B", dot: "#a855f7" }, b: { name: "Producto D", dot: "#eab308" }, pct: "45%" },
                          { a: { name: "Producto A", dot: "#2563EB" }, b: { name: "Producto B", dot: "#a855f7" }, pct: "32%" },
                        ]
                        const filtered = PRODUCTS.filter(p => !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase()))
                        return (
                          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                            {/* Top bar */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                              <div>
                                <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Ventas por producto</div>
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>Historial y análisis</div>
                              </div>
                              <select style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: 12, outline: "none", cursor: "pointer" }}>
                                {["Mayo 2026","Abril 2026","Marzo 2026","Q2 2026"].map(m => <option key={m}>{m}</option>)}
                              </select>
                            </div>

                            {/* Summary cards */}
                            <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                              {[
                                { label: "Producto más vendido", value: "Producto A", sub: "32 unidades este mes" },
                                { label: "Mayor ingreso",        value: "Producto B", sub: "$48.750 este mes" },
                                { label: "Mejor margen",         value: "Producto C", sub: "68% margen bruto" },
                              ].map(c => (
                                <div key={c.label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 6 }}>{c.label}</div>
                                  <div style={{ color: "white", fontSize: 16, fontWeight: 500 }}>{c.value}</div>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>{c.sub}</div>
                                </div>
                              ))}
                            </div>

                            {/* Search */}
                            <input type="text" placeholder="Buscar producto..." value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                              style={{ width: 260, padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", marginBottom: 16 }} />

                            {/* Table */}
                            <div style={{ marginBottom: 24 }}>
                              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px 8px 0 0" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 16px" }}>
                                  {["PRODUCTO","UNIDADES","INGRESOS","MARGEN","TENDENCIA","VS MES ANT"].map(h => (
                                    <span key={h} style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{h}</span>
                                  ))}
                                </div>
                              </div>
                              {filtered.map(p => (
                                <div key={p.name}
                                  style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", cursor: "pointer", transition: "background 0.15s" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.dot, flexShrink: 0 }} />
                                    <div>
                                      <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{p.cat}</div>
                                    </div>
                                  </div>
                                  <span style={{ color: "white", fontSize: 13 }}>{p.units}</span>
                                  <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{p.revenue}</span>
                                  <span style={{ color: marginColor(p.margin), fontSize: 13, fontWeight: 500 }}>{p.margin}%</span>
                                  <Sparkline trend={p.trend} />
                                  <span style={{ color: p.vsColor, fontSize: 13, fontWeight: 500 }}>{p.vs}</span>
                                </div>
                              ))}
                              {filtered.length === 0 && (
                                <div style={{ padding: "24px 16px", textAlign: "center" as const, color: "rgba(255,255,255,0.15)", fontSize: 13 }}>Sin resultados</div>
                              )}
                            </div>

                            {/* Product combos */}
                            <div style={{ marginTop: 24 }}>
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Productos que se venden juntos</div>
                              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 16 }}>Basado en historial de compras</div>
                              {COMBOS.map(c => (
                                <div key={c.a.name + c.b.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
                                  <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.a.dot }} />
                                      <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{c.a.name}</span>
                                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>+</span>
                                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.b.dot }} />
                                      <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{c.b.name}</span>
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>Se compran juntos en el {c.pct} de los casos</div>
                                  </div>
                                  <button style={{ padding: "5px 12px", background: "transparent", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 6, color: "#2563EB", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>Sugerir combo →</button>
                                </div>
                              ))}
                            </div>

                            {/* AI insights */}
                            <div style={{ marginTop: 24 }}>
                              <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>✦ Análisis Pupi</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {[
                                  { prio: "Alta prioridad",  pColor: "#ef4444",  title: "Producto D está perdiendo terreno",           body: "Caída del 8% este mes y tendencia negativa hace 3 meses. Revisá precio o estrategia de comunicación." },
                                  { prio: "Media prioridad", pColor: "#eab308",  title: "Producto C tiene el mejor margen",             body: "Con 68% de margen y tendencia estable, es ideal para priorizar en campañas." },
                                  { prio: "Media prioridad", pColor: "#eab308",  title: "Estacionalidad detectada en Producto A",       body: "Histórico muestra pico de ventas en mayo y noviembre. Preparar stock con anticipación." },
                                ].map(r => (
                                  <div key={r.title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.pColor, marginTop: 5, flexShrink: 0 }} />
                                    <div>
                                      <div style={{ color: r.pColor, fontSize: 10, marginBottom: 3 }}>{r.prio}</div>
                                      <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{r.title}</div>
                                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{r.body}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div style={{ height: 24 }} />
                          </div>
                        )
                      })()}

                      {/* Pipeline content */}
                      {ventasNavTab === "Pipeline" && (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 24 }}>
                      {/* Top bar */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div>
                            <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Pipeline</div>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>4 oportunidades activas · $66.450 en juego</div>
                          </div>
                          <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                            {(["Kanban", "Embudo", "Ranking"] as const).map((m) => (
                              <button key={m} onClick={() => setVentasPipeMode(m)} style={{
                                padding: "5px 12px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer",
                                background: ventasPipeMode === m ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)",
                                color: ventasPipeMode === m ? "#2563EB" : "rgba(255,255,255,0.4)",
                                transition: "background 0.15s, color 0.15s",
                              }}>{m}</button>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => setVentasView("new")} style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer" }}>Nueva oportunidad +</button>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexShrink: 0 }}>
                        {[
                          { label: "Este mes",       value: "$28.500", sub: "↑ 12% vs mes anterior",  subColor: "#22c55e" },
                          { label: "Tasa de cierre", value: "68%",     sub: "↑ 5% vs mes anterior",   subColor: "#22c55e" },
                          { label: "Ticket promedio",value: "$9.240",  sub: "→ Sin cambios",           subColor: "rgba(255,255,255,0.35)" },
                          { label: "Tiempo de cierre",value: "18 días",sub: "↓ 3 días menos",         subColor: "#22c55e" },
                        ].map(({ label, value, sub, subColor }) => (
                          <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
                            <div style={{ color: "white", fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{value}</div>
                            <div style={{ color: subColor, fontSize: 11 }}>{sub}</div>
                          </div>
                        ))}
                      </div>

                      {/* Risk alert banner */}
                      {showRiskBanner && (
                        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            <span style={{ color: "#ef4444", fontSize: 13 }}>2 oportunidades en riesgo de perderse</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={() => setVentasView("risk")} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Ver detalles</button>
                            <button onClick={() => setShowRiskBanner(false)} style={{ background: "none", border: "none", color: "rgba(239,68,68,0.4)", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>×</button>
                          </div>
                        </div>
                      )}

                      {/* Ranking view */}
                      {ventasPipeMode === "Ranking" && (() => {
                        const RANK_DATA = [
                          { pos: 1, name: "Carlos Mendoza",  company: "Tech Solutions",   amount: "$18.500", stage: "Negociación", prob: 80, days: 3,  score: 96, action: "Cerrar →" },
                          { pos: 2, name: "Martín Pérez",    company: "Constructora MP",  amount: "$9.350",  stage: "Negociación", prob: 75, days: 5,  score: 88, action: "Cerrar →" },
                          { pos: 3, name: "Sofía Martínez",  company: "Retail Express",   amount: "$8.900",  stage: "Propuesta",   prob: 60, days: 7,  score: 74, action: "Hacer seguimiento →" },
                          { pos: 4, name: "Luis Herrera",    company: "Sin empresa",       amount: "$3.500",  stage: "Prospecto",   prob: 30, days: 12, score: 52, action: "Calificar →" },
                          { pos: 5, name: "Valentina Cruz",  company: "Sin empresa",       amount: "$1.200",  stage: "Prospecto",   prob: 20, days: 20, score: 31, action: "Calificar →" },
                        ]
                        const posColor = (p: number) => p === 1 ? "#2563EB" : p === 2 ? "rgba(255,255,255,0.6)" : p === 3 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)"
                        const probColor = (p: number) => p >= 75 ? "#22c55e" : p >= 50 ? "#eab308" : "#ef4444"
                        const scoreColor = (s: number) => s >= 90 ? "#22c55e" : s >= 70 ? "#2563EB" : s >= 50 ? "#eab308" : "#ef4444"
                        const STAGE_COLOR_MAP: Record<string, string> = { "Negociación": "#22c55e", "Propuesta": "#2563EB", "Prospecto": "#eab308", "Cerrado": "rgba(255,255,255,0.2)" }
                        return (
                          <div style={{ flex: 1, overflowY: "auto" }}>
                            {/* Ranking header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                              <div>
                                <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>Oportunidades por prioridad</div>
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>Ordenadas por IA según probabilidad, urgencia y valor</div>
                              </div>
                              <select style={{ width: 180, padding: "6px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: 12, outline: "none", cursor: "pointer" }}>
                                {["Prioridad IA","Mayor monto","Cierre más próximo","Mayor probabilidad"].map(o => <option key={o}>{o}</option>)}
                              </select>
                            </div>

                            {/* Ranking rows */}
                            {RANK_DATA.map(r => (
                              <div key={r.pos}
                                onClick={() => { setVentasSelectedOpp({ id: String(r.pos), name: r.name, company: r.company, amount: r.amount, seller: "JP", close: "2026-05-" + String(20 + r.days), prob: r.prob, stage: r.stage }); setVentasView("detail"); setVentasTab("Customer Journey") }}
                                style={{ display: "grid", gridTemplateColumns: "40px 1fr 100px 100px 120px 140px 120px", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "16px 20px", marginBottom: 8, cursor: "pointer", transition: "background 0.15s, border-color 0.15s" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)" }}
                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)" }}>
                                {/* Position */}
                                <div style={{ color: posColor(r.pos), fontSize: 18, fontWeight: 600, textAlign: "center" as const }}>#{r.pos}</div>
                                {/* Client info */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{r.name.split(" ").map(w => w[0]).join("").slice(0,2)}</div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ color: "white", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.company}</div>
                                    <span style={{ background: `${STAGE_COLOR_MAP[r.stage]}20`, color: STAGE_COLOR_MAP[r.stage], border: `1px solid ${STAGE_COLOR_MAP[r.stage]}40`, borderRadius: 4, padding: "1px 6px", fontSize: 10, marginTop: 2, display: "inline-block" }}>{r.stage}</span>
                                  </div>
                                </div>
                                {/* Amount */}
                                <div>
                                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 3 }}>Monto</div>
                                  <div style={{ color: "white", fontSize: 14, fontWeight: 600 }}>{r.amount}</div>
                                </div>
                                {/* Probability */}
                                <div>
                                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 3 }}>Prob. cierre</div>
                                  <div style={{ color: probColor(r.prob), fontSize: 14, fontWeight: 600 }}>{r.prob}%</div>
                                </div>
                                {/* Closing date */}
                                <div>
                                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 3 }}>Cierre estimado</div>
                                  <div style={{ color: r.days < 5 ? "#ef4444" : "white", fontSize: 13, fontWeight: 500 }}>En {r.days} días</div>
                                </div>
                                {/* AI priority bar */}
                                <div>
                                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
                                    <div style={{ width: `${r.score}%`, height: "100%", background: scoreColor(r.score), borderRadius: 3 }} />
                                  </div>
                                  <div style={{ color: scoreColor(r.score), fontSize: 11, fontWeight: 500 }}>{r.score}/100</div>
                                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Prioridad Pupi</div>
                                </div>
                                {/* Quick action */}
                                <div>
                                  <button onClick={e => e.stopPropagation()} style={{ border: "1px solid rgba(37,99,235,0.3)", background: "transparent", color: "#2563EB", fontSize: 12, borderRadius: 6, padding: "6px 12px", cursor: "pointer", whiteSpace: "nowrap" as const }}>{r.action}</button>
                                </div>
                              </div>
                            ))}

                            {/* AI explanation box */}
                            <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 10, padding: 16, marginTop: 16 }}>
                              <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>✦ Cómo Pupi calcula la prioridad</div>
                              <div style={{ display: "flex", alignItems: "stretch" }}>
                                {([["35%","Probabilidad"],["25%","Urgencia"],["25%","Valor del trato"],["15%","Actividad reciente"]] as [string,string][]).map(([pct, label], i, arr) => (
                                  <div key={label} style={{ display: "contents" }}>
                                    <div style={{ flex: 1, textAlign: "center" as const }}>
                                      <div style={{ color: "white", fontSize: 16, fontWeight: 600 }}>{pct}</div>
                                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>{label}</div>
                                    </div>
                                    {i < arr.length - 1 && <div style={{ width: 1, background: "rgba(255,255,255,0.06)", margin: "0 8px", alignSelf: "stretch" }} />}
                                  </div>
                                ))}
                              </div>
                              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center" as const, marginTop: 12 }}>La prioridad se recalcula automáticamente cada 24 horas</div>
                            </div>

                            <div style={{ height: 16 }} />
                          </div>
                        )
                      })()}

                      {/* Kanban / Embudo toggle content */}
                      {ventasPipeMode === "Kanban" ? (
                        <div style={{ display: "flex", gap: 16, overflowX: "auto", flex: 1, paddingBottom: 8, minHeight: 0 }}>
                          {stages.map((stage) => {
                            const cards = byStage(stage)
                            return (
                              <div key={stage} style={{ minWidth: 220, flexShrink: 0, display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderTop: `2px solid ${STAGE_COLOR[stage]}`, paddingTop: 10 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{stage}</span>
                                    <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{cards.length}</span>
                                  </div>
                                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{stageTotal(stage)}</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
                                  {cards.map((opp) => {
                                    const hovered = ventasCardHover === opp.id
                                    return (
                                      <div
                                        key={opp.id}
                                        onMouseEnter={() => setVentasCardHover(opp.id)}
                                        onMouseLeave={() => setVentasCardHover(null)}
                                        onClick={() => { setVentasSelectedOpp(opp); setVentasView("detail"); setVentasTab("Customer Journey") }}
                                        style={{
                                          background: opp.won ? (hovered ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.05)") : (hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)"),
                                          border: `1px solid ${opp.won ? (hovered ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.15)") : (hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)")}`,
                                          borderRadius: 10, padding: 14, cursor: "pointer",
                                          transition: "background 0.15s, border-color 0.15s",
                                        }}
                                      >
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{opp.name}</div>
                                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{opp.company}</div>
                                        <div style={{ color: "white", fontSize: 15, fontWeight: 500, marginTop: 10 }}>{opp.amount}</div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ color: "#2563EB", fontSize: 9, fontWeight: 600 }}>{opp.seller}</span>
                                          </div>
                                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{opp.close}</span>
                                        </div>
                                        <div style={{ marginTop: 10, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                                          <div style={{ height: "100%", width: `${opp.prob}%`, background: STAGE_FILL[stage], borderRadius: 2 }} />
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        /* ── EMBUDO VIEW ── */
                        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "24px 40px", width: "100%" }}>
                            {([
                              { stage: "Prospecto"   as Stage, width: "100%", bg: "rgba(99,102,241,0.15)",  border: "rgba(99,102,241,0.3)",  conv: null,    count: 2, total: "$29.700" },
                              { stage: "Propuesta"   as Stage, width: "78%",  bg: "rgba(234,179,8,0.15)",   border: "rgba(234,179,8,0.3)",   conv: "50%",   count: 1, total: "$8.900"  },
                              { stage: "Negociación" as Stage, width: "58%",  bg: "rgba(249,115,22,0.15)",  border: "rgba(249,115,22,0.3)",  conv: "200%",  count: 2, total: "$27.850" },
                              { stage: "Cerrado"     as Stage, width: "38%",  bg: "rgba(34,197,94,0.15)",   border: "rgba(34,197,94,0.3)",   conv: "50%",   count: 1, total: "$4.200"  },
                            ]).map(({ stage, width, bg, border, conv, count, total }, idx) => (
                              <div key={stage} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                                {idx > 0 && (
                                  <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 16, marginBottom: 4, lineHeight: 1 }}>▼</div>
                                )}
                                <div style={{ width, height: 64, background: bg, border: `1px solid ${border}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", transition: "width 0.3s" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{stage}</span>
                                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{count} {count === 1 ? "oportunidad" : "oportunidades"}</span>
                                  </div>
                                  <div style={{ textAlign: "right" as const }}>
                                    <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{total}</div>
                                    {conv && <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>→ {conv} conversión</div>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Insight cards */}
                          <div style={{ display: "flex", gap: 16, marginTop: 32, padding: "0 40px 32px" }}>
                            <div style={{ flex: 1, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 10, padding: 16 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                                <span style={{ color: "#f97316", fontSize: 12, fontWeight: 500 }}>Cuello de botella detectado</span>
                              </div>
                              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                                La etapa Propuesta tiene la mayor caída de conversión (22%). Revisá el proceso de seguimiento post-propuesta.
                              </p>
                            </div>
                            <div style={{ flex: 1, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: 16 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                                </svg>
                                <span style={{ color: "#2563EB", fontSize: 12, fontWeight: 500 }}>Proyección del mes</span>
                              </div>
                              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                                Si se cierran las oportunidades en negociación, el mes terminaría en $56.350 — un 28% por encima del mes anterior.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                      )}
                    </div>
                  )
                })()
              ) : activeNode.id === 3 ? (
                // ── MARKETING MODULE ──
                (() => {
                  type CampStatus = "Activa" | "Pausada" | "Finalizada"
                  type CampChannel = "Email" | "Redes sociales" | "Google Ads" | "WhatsApp" | "Evento"
                  const CAMPAIGNS: { id: number; name: string; channel: CampChannel; date: string; status: CampStatus; roi: string; roiDir: "up" | "down" | "flat"; budget: string }[] = [
                    { id: 1, name: "Campaña Primavera 2026",    channel: "Email",           date: "Mayo 2026",  status: "Activa",    roi: "↑ 340%", roiDir: "up",   budget: "$2.400" },
                    { id: 2, name: "Remarketing clientes fríos",channel: "Redes sociales",  date: "Mayo 2026",  status: "Activa",    roi: "↑ 180%", roiDir: "up",   budget: "$800"   },
                    { id: 3, name: "Google Ads — Producto X",   channel: "Google Ads",      date: "Abril 2026", status: "Activa",    roi: "↑ 95%",  roiDir: "up",   budget: "$3.200" },
                    { id: 4, name: "Newsletter mensual",        channel: "Email",           date: "Abril 2026", status: "Finalizada",roi: "↑ 220%", roiDir: "up",   budget: "$400"   },
                    { id: 5, name: "Lanzamiento temporada",     channel: "Evento",          date: "Marzo 2026", status: "Finalizada",roi: "→",      roiDir: "flat", budget: "$5.000" },
                    { id: 6, name: "WhatsApp broadcast",        channel: "WhatsApp",        date: "Marzo 2026", status: "Pausada",   roi: "↓ 20%",  roiDir: "down", budget: "$600"   },
                  ]
                  const CHANNEL_ICON: Record<CampChannel, { bg: string; color: string; icon: React.ReactNode }> = {
                    "Email":          { bg: "rgba(37,99,235,0.2)",   color: "#2563EB", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                    "Redes sociales": { bg: "rgba(168,85,247,0.2)",  color: "#a855f7", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
                    "Google Ads":     { bg: "rgba(234,179,8,0.2)",   color: "#eab308", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
                    "WhatsApp":       { bg: "rgba(34,197,94,0.2)",   color: "#22c55e", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                    "Evento":         { bg: "rgba(249,115,22,0.2)",  color: "#f97316", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                  }
                  const STATUS_STYLE: Record<CampStatus, { bg: string; color: string; border: string }> = {
                    Activa:     { bg: "rgba(34,197,94,0.1)",  color: "#22c55e", border: "rgba(34,197,94,0.2)"  },
                    Pausada:    { bg: "rgba(234,179,8,0.1)",  color: "#eab308", border: "rgba(234,179,8,0.2)"  },
                    Finalizada: { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.1)" },
                  }
                  const ROI_COLOR: Record<string, string> = { up: "#22c55e", down: "#ef4444", flat: "rgba(255,255,255,0.4)" }
                  const filterLabel: React.CSSProperties = { color: "rgba(255,255,255,0.3)", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em" }
                  const filteredCampaigns = CAMPAIGNS
                    .filter(c => mktStatusFilter === "Todas" || c.status === mktStatusFilter.replace(/\s.*/, ""))
                    .filter(c => mktChannelFilter === "Todos" || c.channel === mktChannelFilter)
                    .filter(c => !mktSearch || c.name.toLowerCase().includes(mktSearch.toLowerCase()))

                  // ── NEW CAMPAIGN FORM VIEW ──
                  if (mktView === "new") {
                    const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" }
                    const labelStyle: React.CSSProperties = { color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 5, display: "block", textTransform: "uppercase" as const, letterSpacing: "0.04em" }
                    const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none" as const }
                    const CHANNELS: { key: string; label: string; color: string; icon: React.ReactNode }[] = [
                      { key: "Email",          label: "Email",    color: "#2563EB", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                      { key: "Redes sociales", label: "Redes",    color: "#a855f7", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
                      { key: "Google Ads",     label: "Google",   color: "#eab308", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
                      { key: "WhatsApp",       label: "WhatsApp", color: "#22c55e", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                      { key: "Evento",         label: "Evento",   color: "#f97316", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                      { key: "Otro",           label: "Otro",     color: "rgba(255,255,255,0.4)", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg> },
                    ]
                    const SEGS = ["Todos los clientes","Calientes","Tibios","Frío","Clientes VIP","Clientes nuevos"]
                    const subjectScore = newCampSubject.length === 0 ? 0 : newCampSubject.length < 20 ? 4 : newCampSubject.length < 45 ? 8 : newCampSubject.length < 60 ? 9 : 6
                    const scoreDesc: Record<number, string> = { 0: "", 4: "Asunto muy corto, sé más específico", 6: "Asunto largo, puede truncarse", 8: "Buen asunto, claro y directo", 9: "Excelente asunto" }
                    const toggleSeg = (s: string) => setNewCampSegments(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
                    const handleLaunch = () => {
                      const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
                      const now = new Date()
                      const monthLabel = monthNames[now.getMonth()] + " " + now.getFullYear()
                      const newEntry = {
                        id: Date.now(),
                        name: newCampName || "Nueva campaña",
                        channel: (newCampChannel || "Email") as CampChannel,
                        date: monthLabel,
                        status: "Activa" as CampStatus,
                        roi: "→",
                        roiDir: "flat" as "flat",
                        budget: newCampBudget ? "$" + newCampBudget : "$0",
                      }
                      CAMPAIGNS.unshift(newEntry)
                      setNewCampName(""); setNewCampChannel(null); setNewCampObjective("Generar nuevas ventas")
                      setNewCampSegments([]); setNewCampBudget(""); setNewCampStart(""); setNewCampEnd("")
                      setNewCampOwner("JP"); setNewCampSubject(""); setNewCampMessage(""); setNewCampCTA("")
                      setNewCampTargetOpen(""); setNewCampTargetClick(""); setNewCampTargetConv("")
                      setMktView("campaigns")
                    }
                    return (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        {/* Form body */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 0 24px" }}>
                          <div style={{ display: "flex", gap: 24 }}>
                            {/* LEFT COLUMN */}
                            <div style={{ width: "45%", flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Datos de la campaña</div>

                              {/* Nombre */}
                              <div>
                                <label style={labelStyle}>Nombre de la campaña</label>
                                <input type="text" value={newCampName} onChange={e => setNewCampName(e.target.value)} placeholder="Ej: Campaña Primavera 2026" style={inputStyle} />
                              </div>

                              {/* Canal */}
                              <div>
                                <label style={labelStyle}>Canal</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                  {CHANNELS.map(ch => {
                                    const sel = newCampChannel === ch.key
                                    return (
                                      <button key={ch.key} onClick={() => setNewCampChannel(sel ? null : ch.key)}
                                        style={{ borderRadius: 8, padding: "10px 14px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6, cursor: "pointer", flex: 1, border: `1px solid ${sel ? ch.color : "rgba(255,255,255,0.08)"}`, background: sel ? `rgba(${ch.color === "#2563EB" ? "37,99,235" : ch.color === "#a855f7" ? "168,85,247" : ch.color === "#eab308" ? "234,179,8" : ch.color === "#22c55e" ? "34,197,94" : ch.color === "#f97316" ? "249,115,22" : "255,255,255"},0.1)` : "rgba(255,255,255,0.03)", transition: "border 0.15s, background 0.15s" }}>
                                        {ch.icon}
                                        <span style={{ fontSize: 11, color: sel ? ch.color : "rgba(255,255,255,0.5)" }}>{ch.label}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Objetivo */}
                              <div>
                                <label style={labelStyle}>Objetivo principal</label>
                                <select value={newCampObjective} onChange={e => setNewCampObjective(e.target.value)} style={selectStyle}>
                                  {["Generar nuevas ventas","Recuperar clientes inactivos","Fidelizar clientes actuales","Dar a conocer producto nuevo","Aumentar ticket promedio"].map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              </div>

                              {/* Segmento */}
                              <div>
                                <label style={labelStyle}>Segmento objetivo</label>
                                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                                  {SEGS.map(s => {
                                    const sel = newCampSegments.includes(s)
                                    return <button key={s} onClick={() => toggleSeg(s)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, border: `1px solid ${sel ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.1)"}`, background: sel ? "rgba(37,99,235,0.15)" : "transparent", color: sel ? "#2563EB" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.15s" }}>{s}</button>
                                  })}
                                </div>
                              </div>

                              {/* Presupuesto */}
                              <div>
                                <label style={labelStyle}>Presupuesto</label>
                                <div style={{ position: "relative" as const }}>
                                  <span style={{ position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", fontSize: 13, pointerEvents: "none" }}>$</span>
                                  <input type="number" value={newCampBudget} onChange={e => setNewCampBudget(e.target.value)} placeholder="0" style={{ ...inputStyle, paddingLeft: 24 }} />
                                </div>
                              </div>

                              {/* Fechas */}
                              <div>
                                <label style={labelStyle}>Período</label>
                                <div style={{ display: "flex", gap: 12 }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 4 }}>Inicio</div>
                                    <input type="date" value={newCampStart} onChange={e => setNewCampStart(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 4 }}>Fin</div>
                                    <input type="date" value={newCampEnd} onChange={e => setNewCampEnd(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
                                  </div>
                                </div>
                              </div>

                              {/* Responsable */}
                              <div>
                                <label style={labelStyle}>Responsable</label>
                                <select value={newCampOwner} onChange={e => setNewCampOwner(e.target.value)} style={selectStyle}>
                                  {[["JP","Juan Pérez"],["CA","Carla Andrés"],["MR","Marcos Ruiz"],["LP","Laura Pinto"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                              </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Contenido y mensaje</div>

                              {/* Asunto */}
                              <div>
                                <label style={labelStyle}>Asunto / Título</label>
                                <input type="text" value={newCampSubject} onChange={e => setNewCampSubject(e.target.value)} placeholder='Ej: "Tu oferta vence esta semana"' style={inputStyle} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                                  <div style={{ color: "#2563EB", fontSize: 11 }}>
                                    {newCampSubject.length > 0 && `✦ Puntuación Pupi: ${subjectScore}/10 — ${scoreDesc[subjectScore]}`}
                                  </div>
                                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{newCampSubject.length}/60 caracteres</div>
                                </div>
                              </div>

                              {/* Mensaje */}
                              <div>
                                <label style={labelStyle}>Mensaje o descripción</label>
                                <textarea value={newCampMessage} onChange={e => setNewCampMessage(e.target.value)} placeholder="Escribí el mensaje principal de la campaña..." style={{ ...inputStyle, minHeight: 100, resize: "vertical" as const }} />
                              </div>

                              {/* CTA */}
                              <div>
                                <label style={labelStyle}>Llamado a la acción (CTA)</label>
                                <input type="text" value={newCampCTA} onChange={e => setNewCampCTA(e.target.value)} placeholder="Ej: Ver ofertas, Comprar ahora, Reservar lugar" style={inputStyle} />
                              </div>

                              {/* Upload area */}
                              <div>
                                <label style={labelStyle}>Material adjunto</label>
                                <div style={{ border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 8, padding: 16, textAlign: "center" as const }}>
                                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginBottom: 8 }}>Arrastrá imágenes o archivos</div>
                                  <button style={{ padding: "5px 12px", fontSize: 11, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>+ Adjuntar</button>
                                </div>
                              </div>

                              {/* Métricas objetivo */}
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginTop: 8, marginBottom: 4 }}>Métricas objetivo</div>
                              <div style={{ display: "flex", gap: 10 }}>
                                {[
                                  { label: "APERTURA OBJETIVO", suffix: "%",      placeholder: "40", val: newCampTargetOpen,  set: setNewCampTargetOpen  },
                                  { label: "CLICKS OBJETIVO",   suffix: "%",      placeholder: "15", val: newCampTargetClick, set: setNewCampTargetClick },
                                  { label: "CONVERSIONES",      suffix: "ventas", placeholder: "10", val: newCampTargetConv,  set: setNewCampTargetConv  },
                                ].map(m => (
                                  <div key={m.label} style={{ flex: 1 }}>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{m.label}</div>
                                    <div style={{ position: "relative" as const }}>
                                      <input type="number" value={m.val} onChange={e => m.set(e.target.value)} placeholder={m.placeholder} style={{ ...inputStyle, paddingRight: m.suffix === "ventas" ? 48 : 28 }} />
                                      <span style={{ position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 11, pointerEvents: "none" }}>{m.suffix}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* AI suggestion */}
                              <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
                                <div style={{ color: "#60a5fa", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>✦ Pupi sugiere</div>
                                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.6 }}>Basado en campañas anteriores de email, el mejor día para enviar es el martes a las 10am. La tasa de apertura promedio de tu base es 42%.</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom bar */}
                        <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                          <button onClick={() => setMktView("campaigns")} style={{ padding: "9px 16px", fontSize: 13, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Cancelar</button>
                          <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setMktView("campaigns")} style={{ padding: "9px 16px", fontSize: 13, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Guardar borrador</button>
                            <button onClick={handleLaunch} style={{ padding: "9px 16px", fontSize: 13, background: "#2563EB", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontWeight: 500 }}>Lanzar campaña</button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // ── CAMPAIGN DETAIL VIEW ──
                  if (mktView === "detail" && mktSelectedCamp) {
                    const camp = mktSelectedCamp
                    const ch = CHANNEL_ICON[camp.channel as CampChannel]
                    const st = STATUS_STYLE[camp.status as CampStatus]
                    const metricCard = (label: string, value: string, sub: string, color: string) => (
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px", flex: 1 }}>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 4 }}>{label}</div>
                        <div style={{ color, fontSize: 20, fontWeight: 700 }}>{value}</div>
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 2 }}>{sub}</div>
                      </div>
                    )
                    const aiCard = (icon: string, label: string, value: string, valueColor: string, sub: string) => (
                      <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</div>
                          <div style={{ color: valueColor, fontSize: 16, fontWeight: 700, marginTop: 1 }}>{value}</div>
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{sub}</div>
                        </div>
                      </div>
                    )
                    // SVG line chart data
                    const days = ["L","M","X","J","V","S","D"]
                    const opens  = [410, 620, 580, 710, 680, 750, 700]
                    const clicks = [120, 190, 160, 220, 200, 240, 210]
                    const maxVal = 800
                    const W = 360, H = 100
                    const px = (i: number) => (i / (days.length - 1)) * W
                    const py = (v: number) => H - (v / maxVal) * H
                    const polyline = (arr: number[]) => arr.map((v, i) => `${px(i)},${py(v)}`).join(" ")
                    // Funnel
                    const funnel = [
                      { label: "Enviados",     val: 2840, pct: 100 },
                      { label: "Abiertos",     val: 1931, pct: 68  },
                      { label: "Clicks",       val: 683,  pct: 24  },
                      { label: "Conversiones", val: 8,    pct: 0.3 },
                    ]
                    return (
                      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                        {/* Left column */}
                        <div style={{ width: "32%", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
                          {/* Channel icon + name */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: ch.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ch.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {camp.channel === "Email"          && <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>}
                                {camp.channel === "Redes sociales" && <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>}
                                {camp.channel === "Google Ads"     && <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}
                                {camp.channel === "WhatsApp"       && <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}
                                {camp.channel === "Evento"         && <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
                              </svg>
                            </div>
                            <div style={{ textAlign: "center" as const }}>
                              <div style={{ color: "white", fontSize: 14, fontWeight: 600 }}>{camp.name}</div>
                              <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, display: "inline-block", marginTop: 6 }}>{camp.status}</span>
                            </div>
                          </div>

                          {/* Info rows */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {[
                              ["Canal",         camp.channel],
                              ["Estado",        camp.status],
                              ["Inicio",        "01 " + camp.date],
                              ["Fin estimado",  "31 " + camp.date],
                              ["Presupuesto",   camp.budget],
                              ["Responsable",   "Equipo Marketing"],
                              ["Segmento",      "Clientes activos"],
                            ].map(([k, v]) => (
                              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{k}</span>
                                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 500 }}>{v}</span>
                              </div>
                            ))}
                          </div>

                          {/* Budget progress */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Presupuesto ejecutado</span>
                              <span style={{ color: "white", fontSize: 11, fontWeight: 600 }}>65%</span>
                            </div>
                            <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: "65%", height: "100%", background: "linear-gradient(90deg, #2563EB, #60a5fa)", borderRadius: 3 }} />
                            </div>
                          </div>

                          {/* AI cards */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Análisis IA</div>
                            {aiCard("📈", "ROI",                  camp.roi === "→" ? "Plano" : camp.roi, ROI_COLOR[camp.roiDir], "vs. promedio de campañas")}
                            {aiCard("👥", "Clientes generados",   "8",    "white", "en este período")}
                            {aiCard("💰", "Costo por cliente",    "$195", "white", "por conversión")}
                            {aiCard("🤖", "Recomendación",        "Aumentar presupuesto", "#60a5fa", "canal con mejor CPL del trimestre")}
                          </div>
                        </div>

                        {/* Right column */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          {/* Tabs */}
                          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", flexShrink: 0 }}>
                            {(["Resultados","Audiencia","Contenido","Notas"] as const).map(t => (
                              <button key={t} onClick={() => setMktDetailTab(t)} style={{ padding: "12px 14px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: mktDetailTab === t ? "white" : "rgba(255,255,255,0.35)", borderBottom: `2px solid ${mktDetailTab === t ? "#2563EB" : "transparent"}`, marginBottom: -1, transition: "color 0.15s, border-color 0.15s" }}>{t}</button>
                            ))}
                          </div>

                          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                            {/* ── RESULTADOS ── */}
                            {mktDetailTab === "Resultados" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                {/* Metric cards */}
                                <div style={{ display: "flex", gap: 10 }}>
                                  {metricCard("Enviados",     "2.840", "Total destinatarios", "white")}
                                  {metricCard("Tasa apertura","68%",   "↑ 12 pp vs. anterior", "#22c55e")}
                                  {metricCard("CTR",          "24%",   "Clicks / abiertos",   "white")}
                                  {metricCard("Conversiones", "8",     "Últimos 30 días",     "#60a5fa")}
                                </div>

                                {/* Line chart */}
                                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px" }}>
                                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 12, display: "flex", gap: 16 }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 2, background: "#2563EB", display: "inline-block", borderRadius: 2 }}/>Aperturas</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 2, background: "#22c55e", display: "inline-block", borderRadius: 2 }}/>Clicks</span>
                                  </div>
                                  <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: "visible" }}>
                                    {/* Grid lines */}
                                    {[0, 0.25, 0.5, 0.75, 1].map(t => (
                                      <line key={t} x1="0" y1={py(maxVal * t)} x2={W} y2={py(maxVal * t)} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                                    ))}
                                    {/* Opens area */}
                                    <polyline points={polyline(opens)}  fill="none" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round"/>
                                    {/* Clicks area */}
                                    <polyline points={polyline(clicks)} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round"/>
                                    {/* Day labels */}
                                    {days.map((d, i) => (
                                      <text key={d} x={px(i)} y={H + 16} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="10">{d}</text>
                                    ))}
                                  </svg>
                                </div>

                                {/* Funnel */}
                                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px" }}>
                                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 14 }}>Embudo de conversión</div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {funnel.map((f, i) => {
                                      const colors = ["#2563EB","#3b82f6","#60a5fa","#22c55e"]
                                      return (
                                        <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                          <div style={{ width: 90, color: "rgba(255,255,255,0.4)", fontSize: 11, textAlign: "right" as const, flexShrink: 0 }}>{f.label}</div>
                                          <div style={{ flex: 1, height: 20, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                                            <div style={{ width: `${f.pct}%`, height: "100%", background: colors[i], borderRadius: 4, minWidth: 4 }} />
                                          </div>
                                          <div style={{ width: 56, color: "white", fontSize: 12, fontWeight: 600, textAlign: "right" as const, flexShrink: 0 }}>{f.val.toLocaleString()}</div>
                                          <div style={{ width: 36, color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "right" as const, flexShrink: 0 }}>{f.pct}%</div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ── AUDIENCIA ── */}
                            {mktDetailTab === "Audiencia" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px" }}>
                                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 12 }}>Segmento</div>
                                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
                                    {[["Clientes activos","68%"],["Clientes inactivos","20%"],["Prospectos","12%"]].map(([seg, pct]) => (
                                      <div key={seg} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{seg}</div>
                                        <div style={{ color: "white", fontSize: 20, fontWeight: 700 }}>{pct}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Top respondentes</div>
                                  {[
                                    { name: "Farmacia Central",      email: "central@farmacia.com",   opens: 14 },
                                    { name: "Distribuidora Norte",   email: "norte@distribuidora.com",opens: 11 },
                                    { name: "Clínica San Martín",    email: "info@clinicasm.com",     opens: 9  },
                                  ].map(r => (
                                    <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{r.name[0]}</div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: "white", fontSize: 13 }}>{r.name}</div>
                                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{r.email}</div>
                                      </div>
                                      <div style={{ color: "#60a5fa", fontSize: 12, fontWeight: 600 }}>{r.opens} aperturas</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ── CONTENIDO ── */}
                            {mktDetailTab === "Contenido" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px" }}>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 4 }}>Asunto del email</div>
                                  <div style={{ color: "white", fontSize: 14, fontWeight: 500, marginBottom: 12 }}>🌸 ¡Llegó la Primavera! Descubrí nuestras novedades</div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Puntuación IA</span>
                                    <div style={{ display: "flex", gap: 2 }}>
                                      {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= 4 ? "#eab308" : "rgba(255,255,255,0.15)", fontSize: 16 }}>★</span>)}
                                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginLeft: 6, alignSelf: "center" }}>4/5</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Sugerencias IA</div>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                                    {["Agregar CTA más específico", "Reducir longitud en 20%"].map(sug => (
                                      <span key={sug} style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 20, padding: "5px 12px", color: "#60a5fa", fontSize: 12 }}>{sug}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ── NOTAS ── */}
                            {mktDetailTab === "Notas" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Notas internas de la campaña</div>
                                <textarea placeholder="Escribí tus notas aquí..." style={{ width: "100%", minHeight: 180, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "white", fontSize: 13, padding: "12px 14px", resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      {/* Secondary nav */}
                      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", flexShrink: 0 }}>
                        {(["Campañas", "Insights", "Investigaciones"] as const).map(nav => (
                          <button key={nav} onClick={() => setMktNavTab(nav)} style={{ padding: "12px 16px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: mktNavTab === nav ? "white" : "rgba(255,255,255,0.35)", borderBottom: `2px solid ${mktNavTab === nav ? "#2563EB" : "transparent"}`, transition: "color 0.15s, border-color 0.15s", marginBottom: -1 }}>{nav}</button>
                        ))}
                      </div>

                      {/* Placeholders for non-campaigns tabs */}
                      {mktNavTab === "Investigaciones" && (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 13 }}>Investigaciones</span>
                          <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 11 }}>Próximamente</span>
                        </div>
                      )}

                      {mktNavTab === "Insights" && (
                        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                          {/* Top summary cards */}
                          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                            {[
                              { label: "ROI promedio campañas", value: "209%", valueColor: "#22c55e", sub: "↑ 34% vs trimestre anterior", subColor: "#22c55e" },
                              { label: "Canal más efectivo",    value: "Email", valueColor: "white",   sub: "68% apertura promedio",       subColor: "rgba(255,255,255,0.35)" },
                              { label: "Costo por cliente",     value: "$195",  valueColor: "white",   sub: "↓ $40 vs mes anterior",       subColor: "#22c55e" },
                            ].map(c => (
                              <div key={c.label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 6 }}>{c.label}</div>
                                <div style={{ color: c.valueColor, fontSize: 20, fontWeight: 600 }}>{c.value}</div>
                                <div style={{ color: c.subColor, fontSize: 11, marginTop: 4 }}>{c.sub}</div>
                              </div>
                            ))}
                          </div>

                          {/* Channel comparison */}
                          <div style={{ marginBottom: 4 }}>
                            <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Rendimiento por canal</div>
                            {[
                              { key: "Email",          label: "Email",          campañas: 3, roi: 280,  barPct: 100, color: "#2563EB", bg: "rgba(37,99,235,0.2)",   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                              { key: "Redes",          label: "Redes sociales", campañas: 1, roi: 180,  barPct: 64,  color: "#a855f7", bg: "rgba(168,85,247,0.2)", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
                              { key: "Google",         label: "Google Ads",     campañas: 1, roi: 95,   barPct: 34,  color: "#eab308", bg: "rgba(234,179,8,0.2)",  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
                              { key: "WhatsApp",       label: "WhatsApp",       campañas: 1, roi: -20,  barPct: 0,   color: "#22c55e", bg: "rgba(34,197,94,0.2)",  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                              { key: "Evento",         label: "Evento",         campañas: 1, roi: 0,    barPct: 0,   color: "#f97316", bg: "rgba(249,115,22,0.2)", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                            ].map(ch => (
                              <div key={ch.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: ch.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ch.icon}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{ch.label}</div>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{ch.campañas} {ch.campañas === 1 ? "campaña" : "campañas"}</div>
                                </div>
                                <div style={{ flex: 1, maxWidth: 180, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ width: `${ch.barPct}%`, height: "100%", background: ch.color, borderRadius: 2, minWidth: ch.barPct > 0 ? 4 : 0 }} />
                                </div>
                                <div style={{ width: 52, textAlign: "right" as const, flexShrink: 0, color: ch.roi > 0 ? "#22c55e" : ch.roi < 0 ? "#ef4444" : "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 500 }}>{ch.roi > 0 ? `+${ch.roi}%` : ch.roi < 0 ? `${ch.roi}%` : "—"}</div>
                              </div>
                            ))}
                          </div>

                          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "24px 0" }} />

                          {/* Segment insights */}
                          <div>
                            <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Insights por segmento</div>
                            <div style={{ display: "flex", gap: 12 }}>
                              {[
                                { name: "Clientes calientes", count: "284 clientes", stats: [["Apertura","74%"],["Clicks","31%"],["Conversión","12%"]], ai: "Mayor conversión del portfolio" },
                                { name: "Clientes tibios",    count: "156 clientes", stats: [["Apertura","52%"],["Clicks","18%"],["Conversión","6%"]],  ai: "Potencial de mejora con personalización" },
                                { name: "Clientes fríos",     count: "89 clientes",  stats: [["Apertura","28%"],["Clicks","8%"],["Conversión","2%"]],   ai: "Requieren campaña de re-engagement" },
                              ].map(seg => (
                                <div key={seg.name} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16 }}>
                                  <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{seg.name}</div>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 12 }}>{seg.count}</div>
                                  {seg.stats.map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{k}</span>
                                      <span style={{ color: "white", fontSize: 12, fontWeight: 500 }}>{v}</span>
                                    </div>
                                  ))}
                                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />
                                  <div style={{ color: "#2563EB", fontSize: 11 }}>✦ {seg.ai}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "24px 0" }} />

                          {/* AI Recommendations */}
                          <div>
                            <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>✦ Recomendaciones Pupi</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {[
                                { prio: "Alta prioridad",  pct: "#ef4444", title: "Pausar campaña de WhatsApp",                     body: "ROI negativo de -20% en los últimos 30 días. Redistribuir presupuesto a Email." },
                                { prio: "Alta prioridad",  pct: "#ef4444", title: "Crear campaña de re-engagement para clientes fríos", body: "89 clientes sin comprar. Un descuento puede recuperar hasta 20% de ellos." },
                                { prio: "Media prioridad", pct: "#eab308", title: "Personalizar asuntos de email con nombre del cliente", body: "Campañas personalizadas muestran +15% de apertura en tu industria." },
                                { prio: "Baja prioridad",  pct: "rgba(255,255,255,0.3)", title: "Probar canal Google Ads con mayor presupuesto", body: "ROI de 95% con bajo presupuesto. Escalarlo puede multiplicar resultados." },
                              ].map(r => (
                                <div key={r.title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.pct, marginTop: 5, flexShrink: 0 }} />
                                  <div>
                                    <div style={{ color: r.pct, fontSize: 10, marginBottom: 3 }}>{r.prio}</div>
                                    <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{r.title}</div>
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{r.body}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "24px 0" }} />

                          {/* Ideal client profile */}
                          <div>
                            <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>✦ Perfil del cliente ideal</div>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 16 }}>Generado desde datos reales de conversión</div>
                            <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 12, padding: 20 }}>
                              <div style={{ display: "flex", gap: 24 }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, minWidth: 80 }}>
                                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                  </div>
                                  <div style={{ color: "white", fontSize: 14, fontWeight: 500, marginTop: 10, textAlign: "center" as const }}>Cliente ideal</div>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textAlign: "center" as const }}>Top 15% de conversión</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                  {[
                                    ["TEMPERATURA",      "Caliente"],
                                    ["TICKET PROMEDIO",  "+$8.000"],
                                    ["FRECUENCIA",       "Cada 20-30 días"],
                                    ["ANTIGÜEDAD",       "+6 meses"],
                                    ["CANAL PREFERIDO",  "Email"],
                                    ["MEJOR MOMENTO",    "Martes 10am"],
                                  ].map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{k}</span>
                                      <span style={{ color: "white", fontSize: 12, fontWeight: 500 }}>{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div style={{ height: 24 }} />
                        </div>
                      )}

                      {mktNavTab === "Campañas" && (
                        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                          {/* Left sidebar */}
                          <div style={{ width: "25%", flexShrink: 0, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "20px 16px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
                            <input type="text" placeholder="Buscar campaña..." value={mktSearch} onChange={e => setMktSearch(e.target.value)} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />

                            <div style={{ marginTop: 20, marginBottom: 8, ...filterLabel }}>Estado</div>
                            {["Todas", "Activa 🟢", "Pausada 🟡", "Finalizada ⚫"].map(f => (
                              <button key={f} onClick={() => setMktStatusFilter(f)} style={{ textAlign: "left" as const, padding: "7px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", marginBottom: 2, background: mktStatusFilter === f ? "rgba(37,99,235,0.15)" : "transparent", color: mktStatusFilter === f ? "#2563EB" : "rgba(255,255,255,0.4)", transition: "background 0.15s, color 0.15s" }}>{f}</button>
                            ))}

                            <div style={{ marginTop: 16, marginBottom: 8, ...filterLabel }}>Canal</div>
                            {["Todos", "Email", "Redes sociales", "Google Ads", "WhatsApp", "Evento"].map(f => (
                              <button key={f} onClick={() => setMktChannelFilter(f)} style={{ textAlign: "left" as const, padding: "7px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", marginBottom: 2, background: mktChannelFilter === f ? "rgba(37,99,235,0.15)" : "transparent", color: mktChannelFilter === f ? "#2563EB" : "rgba(255,255,255,0.4)", transition: "background 0.15s, color 0.15s" }}>{f}</button>
                            ))}

                            <div style={{ marginTop: 16, marginBottom: 8, ...filterLabel }}>Período</div>
                            {["Este mes", "Último trimestre", "Este año"].map(f => (
                              <button key={f} onClick={() => setMktPeriodFilter(f)} style={{ textAlign: "left" as const, padding: "7px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", marginBottom: 2, background: mktPeriodFilter === f ? "rgba(37,99,235,0.15)" : "transparent", color: mktPeriodFilter === f ? "#2563EB" : "rgba(255,255,255,0.4)", transition: "background 0.15s, color 0.15s" }}>{f}</button>
                            ))}
                          </div>

                          {/* Right section */}
                          <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
                              <div>
                                <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Campañas</div>
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>6 campañas · 3 activas</div>
                              </div>
                              <button onClick={() => setMktView("new")} style={{ padding: "7px 14px", fontSize: 13, background: "#2563EB", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Nueva campaña +</button>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto" }}>
                              {filteredCampaigns.map(camp => {
                                const ch = CHANNEL_ICON[camp.channel]
                                const st = STATUS_STYLE[camp.status]
                                return (
                                  <div key={camp.id} style={{ display: "flex", alignItems: "center", gap: 12, height: 64, borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 12px", cursor: "pointer", transition: "background 0.15s" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                    onClick={() => { setMktSelectedCamp(camp); setMktView("detail"); setMktDetailTab("Resultados"); }}
                                  >
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: ch.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ch.icon}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ color: "white", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{camp.name}</div>
                                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{camp.channel} · {camp.date}</div>
                                    </div>
                                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: "2px 8px", fontSize: 11, flexShrink: 0 }}>{camp.status}</span>
                                    <span style={{ color: ROI_COLOR[camp.roiDir], fontSize: 12, fontWeight: 500, width: 64, textAlign: "right" as const, flexShrink: 0 }}>{camp.roi}</span>
                                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, width: 56, textAlign: "right" as const, flexShrink: 0 }}>{camp.budget}</span>
                                  </div>
                                )
                              })}
                              {filteredCampaigns.length === 0 && (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 48 }}>
                                  <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 13 }}>Sin campañas</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
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
