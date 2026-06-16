"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Users,
  TrendingUp,
  Megaphone,
  UserCheck,
  Calculator,
  LayoutDashboard,
  BarChart2,
  FileText,
  Crown,
  Briefcase,
  User,
  Camera,
  Brain,
  Zap,
  AlertTriangle,
  Clock,
  Heart,
  TrendingDown,
  Target,
  Mic,
  RefreshCw,
  Settings,
  Building2,
  CreditCard,
  Bell,
  Plug,
  Shield,
  Download,
  Monitor,
  Smartphone,
  Check,
} from "lucide-react"
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'
import {
  sendChatMessage as apiSendChat,
  fetchSettings,
  saveSettings,
  fetchTeamUsers,
  fetchMe,
  saveProfile,
  fetchCompany,
  saveCompany,
  fetchBilling,
  fetchGoogleStatus,
} from '@/lib/dashboard-api'
import { GoogleToolsPanel } from '@/components/tools/GoogleToolsPanel'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps"

// Web Speech API (Chrome) — minimal types to avoid DOM lib coupling
interface SpeechRecognitionResultLike { readonly 0: { transcript: string }; isFinal: boolean }
interface SpeechRecognitionEventLike { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> }
interface SpeechRecognitionInstance {
  continuous: boolean
  lang: string
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function getPupiChatReply(text: string) {
  const t = text.toLowerCase()
  if (t.includes("venta") || t.includes("pipeline")) {
    return "Tenés 5 oportunidades activas por $56.350 en total. Carlos Mendoza está a punto de cerrar $18.500 — te recomiendo darle seguimiento hoy."
  }
  if (t.includes("cliente") || t.includes("crm")) {
    return "Tu base tiene 284 clientes. Hay 32 sin contacto en más de 30 días que requieren atención esta semana."
  }
  if (t.includes("equipo") || t.includes("rrhh") || t.includes("empleado")) {
    return "El clima laboral está en 7.8/10. Carlos Acosta está sobrecargado y Laura muestra riesgo de renuncia — conviene actuar esta semana."
  }
  if (t.includes("marketing") || t.includes("campaña")) {
    return "La campaña de WhatsApp tiene ROI negativo. Tu mejor canal este mes es Email con 4.2x de retorno."
  }
  return "Entiendo. Basado en los datos de tu empresa, puedo ayudarte con ventas, clientes, equipo, finanzas o marketing. ¿Qué querés revisar?"
}

type Status = "completed" | "in-progress" | "pending"

interface TimelineItem {
  id: number
  title: string
  date: string
  content: string
  category: string
  icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>
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
    relatedIds: [2, 5, 7],
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
    relatedIds: [1, 3, 6, 7],
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
    relatedIds: [2, 1, 7],
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
    relatedIds: [5, 6, 7],
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
    relatedIds: [1, 2, 4, 7],
    status: "completed",
    energy: 45,
  },
  {
    id: 6,
    title: "Workspace",
    date: "",
    content: "Tareas, alertas y resumen diario",
    category: "workspace",
    icon: LayoutDashboard,
    relatedIds: [1, 2, 3, 4, 5, 7],
    status: "completed",
    energy: 95,
  },
  {
    id: 7,
    title: "Herramientas",
    date: "",
    content: "Google Sheets, Docs, Calendar y Drive",
    category: "herramientas",
    icon: Plug,
    relatedIds: [1, 2, 3, 4, 5, 6],
    status: "completed",
    energy: 85,
  },
]

const ORBIT_RADIUS = 220

const STATIC_NODE_POSITIONS = timelineData.map((item, index) => {
  const angle = (index / timelineData.length) * 360
  const rad = (angle * Math.PI) / 180
  return {
    ...item,
    x: Math.cos(rad) * ORBIT_RADIUS,
    y: Math.sin(rad) * ORBIT_RADIUS,
  }
})

type Temp = "Todos" | "Caliente" | "Tibio" | "Frío"

interface Client {
  id: number | string
  name: string
  company: string
  temp: "Caliente" | "Tibio" | "Frío"
  lastContact: string
  ticket: string
  seller: string
  email?: string
  phone?: string
  tags?: string[]
  avatar?: string
  lat?: number
  lng?: number
}

const defaultClientsData: Client[] = [
  { id: 1, name: "María González",  company: "Distribuidora Norte", temp: "Caliente", lastContact: "Hace 2 días",  ticket: "$4.200",  seller: "MR", lat: -34.9011, lng: -56.1645 },
  { id: 2, name: "Carlos Mendoza",  company: "Tech Solutions",      temp: "Tibio",    lastContact: "Hace 8 días",  ticket: "$12.800", seller: "JP", lat: -34.8167, lng: -56.2000 },
  { id: 3, name: "Ana Rodríguez",   company: "Sin empresa",         temp: "Frío",     lastContact: "Hace 31 días", ticket: "$890",    seller: "MR", lat: -33.5000, lng: -56.3833 },
  { id: 4, name: "Luis Herrera",    company: "Grupo Herrera SA",    temp: "Caliente", lastContact: "Hace 1 día",   ticket: "$28.500", seller: "CA", lat: -34.9011, lng: -56.2000 },
  { id: 5, name: "Sofía Martínez",  company: "Retail Express",      temp: "Tibio",    lastContact: "Hace 12 días", ticket: "$3.100",  seller: "JP", lat: -31.3833, lng: -57.9667 },
  { id: 6, name: "Diego López",     company: "Importadora DL",      temp: "Caliente", lastContact: "Hace 3 días",  ticket: "$9.750",  seller: "CA", lat: -34.9500, lng: -56.1000 },
  { id: 7, name: "Valentina Cruz",  company: "Sin empresa",         temp: "Frío",     lastContact: "Hace 45 días", ticket: "$560",    seller: "MR", lat: -34.7500, lng: -56.3000 },
  { id: 8, name: "Martín Pérez",    company: "Constructora MP",     temp: "Tibio",    lastContact: "Hace 7 días",  ticket: "$15.200", seller: "JP", lat: -34.8500, lng: -56.1500 },
]

const CRM_MAP_DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0a0a0f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#050510" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
]

const CRM_MAP_PIN_STYLES: Record<"Caliente" | "Tibio" | "Frío", { border: string; background: string }> = {
  Caliente: { border: "rgba(239,68,68,0.8)", background: "rgba(239,68,68,0.2)" },
  Tibio:    { border: "rgba(234,179,8,0.8)",  background: "rgba(234,179,8,0.2)" },
  Frío:     { border: "rgba(37,99,235,0.8)",  background: "rgba(37,99,235,0.2)" },
}

function CrmMapZoomControls() {
  const map = useMap()
  const btnStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    background: "rgba(10,10,20,0.8)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    color: "white",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }
  return (
    <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 4, zIndex: 2, pointerEvents: "auto" }}>
      <button type="button" style={btnStyle} onClick={() => map?.setZoom((map.getZoom() ?? 6) + 1)}>+</button>
      <button type="button" style={btnStyle} onClick={() => map?.setZoom((map.getZoom() ?? 6) - 1)}>−</button>
    </div>
  )
}

const TEMP_STYLES: Record<"Caliente" | "Tibio" | "Frío", { bg: string; color: string; emoji: string }> = {
  Caliente: { bg: "rgba(239,68,68,0.15)",   color: "#ef4444",  emoji: "🔴" },
  Tibio:    { bg: "rgba(234,179,8,0.15)",   color: "#eab308",  emoji: "🟡" },
  Frío:     { bg: "rgba(37,99,235,0.15)",   color: "#60a5fa",  emoji: "🔵" },
}

type WorkspaceReportIcon = "trending-up" | "users" | "calculator" | "megaphone" | "bar-chart-2" | "file-text"

type WorkspaceReportTemplate = {
  id: string
  icon: WorkspaceReportIcon
  color: string
  bg: string
  title: string
  description: string
  tags: string[]
}

type WorkspaceGeneratedReport = {
  id: number
  icon: WorkspaceReportIcon
  color: string
  bg: string
  name: string
  generated: string
  period: string
  format: string
  size: string
}

const WS_REPORT_TEMPLATES: WorkspaceReportTemplate[] = [
  { id: "sales", icon: "trending-up", color: "#22c55e", bg: "rgba(34,197,94,0.15)", title: "Reporte de ventas", description: "Pipeline, cierres y pronóstico", tags: ["Semanal", "PDF"] },
  { id: "team", icon: "users", color: "#2563EB", bg: "rgba(37,99,235,0.15)", title: "Estado del equipo", description: "Desempeño, clima y alertas RRHH", tags: ["Semanal", "PDF"] },
  { id: "finance", icon: "calculator", color: "#eab308", bg: "rgba(234,179,8,0.15)", title: "Resumen financiero", description: "Ingresos, gastos y proyecciones", tags: ["Mensual", "Excel"] },
  { id: "marketing", icon: "megaphone", color: "#a855f7", bg: "rgba(168,85,247,0.15)", title: "Performance de marketing", description: "Campañas, ROI e insights", tags: ["Mensual", "PDF"] },
  { id: "executive", icon: "bar-chart-2", color: "rgba(249,115,22,1)", bg: "rgba(249,115,22,0.15)", title: "Reporte ejecutivo", description: "Resumen completo de la empresa", tags: ["Mensual", "PDF"] },
  { id: "custom", icon: "file-text", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.08)", title: "Reporte personalizado", description: "Elegí qué incluir y el período", tags: ["Manual", "PDF/Excel"] },
]

const WS_GENERATED_REPORTS: WorkspaceGeneratedReport[] = [
  { id: 1, icon: "trending-up", color: "#22c55e", bg: "rgba(34,197,94,0.15)", name: "Reporte de ventas — Semana 20", generated: "Generado el 25 Mayo · Por Pupi AI", period: "Semana 20", format: "PDF", size: "248 KB" },
  { id: 2, icon: "users", color: "#2563EB", bg: "rgba(37,99,235,0.15)", name: "Estado del equipo — Semana 20", generated: "Generado el 25 Mayo · Por Pupi AI", period: "Semana 20", format: "PDF", size: "186 KB" },
  { id: 3, icon: "calculator", color: "#eab308", bg: "rgba(234,179,8,0.15)", name: "Resumen financiero — Abril 2026", generated: "Generado el 1 Mayo · Por Pupi AI", period: "Abril 2026", format: "Excel", size: "412 KB" },
  { id: 4, icon: "bar-chart-2", color: "#f97316", bg: "rgba(249,115,22,0.15)", name: "Reporte ejecutivo — Abril 2026", generated: "Generado el 1 Mayo · Por Pupi AI", period: "Abril 2026", format: "PDF", size: "1.2 MB" },
  { id: 5, icon: "megaphone", color: "#a855f7", bg: "rgba(168,85,247,0.15)", name: "Performance marketing — Marzo 2026", generated: "Generado el 1 Abril · Por Pupi AI", period: "Marzo 2026", format: "PDF", size: "334 KB" },
]

type WsPermLevel = "full" | "partial" | "none"
type WsSettingsTab = "roles" | "empresa" | "notificaciones" | "integraciones"
type WsPermModule = "crm" | "ventas" | "mktg" | "rrhh" | "cont" | "config"

const WS_PERM_MODULES: { key: WsPermModule; label: string }[] = [
  { key: "crm", label: "CRM" },
  { key: "ventas", label: "Ventas" },
  { key: "mktg", label: "Mktg" },
  { key: "rrhh", label: "RRHH" },
  { key: "cont", label: "Cont" },
  { key: "config", label: "Config" },
]

const WS_DEFAULT_ROLE_PERMS: Record<string, Record<WsPermModule, WsPermLevel>> = {
  dueno: { crm: "full", ventas: "full", mktg: "full", rrhh: "full", cont: "full", config: "full" },
  gerente: { crm: "full", ventas: "full", mktg: "full", rrhh: "partial", cont: "partial", config: "none" },
  vendedor: { crm: "partial", ventas: "full", mktg: "none", rrhh: "none", cont: "none", config: "none" },
  empleado: { crm: "none", ventas: "none", mktg: "none", rrhh: "partial", cont: "none", config: "none" },
}

const WS_PARTIAL_SUB_OPTS: Record<string, string[]> = {
  crm: ["Ver clientes asignados", "Registrar interacciones", "Ver historial propio"],
  ventas: ["Ver su pipeline", "Crear oportunidades", "Ver comisiones propias"],
  rrhh: ["Ver sus tareas", "Ver su desempeño", "Ver sus documentos"],
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("")
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const companyId = session?.user?.company_id ?? ''
  const [activeNode, setActiveNode] = useState<TimelineItem | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)
  const [transformOrigin, setTransformOrigin] = useState("50% 50%")
  const [isPaused, setIsPaused] = useState(false)
  const [voiceReady, setVoiceReady] = useState(false)
  const [centerHovered, setCenterHovered] = useState(false)
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [showChatPanel, setShowChatPanel] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [voiceListening, setVoiceListening] = useState(false)
  const [showWakeGreeting, setShowWakeGreeting] = useState(false)
  const [chatButtonPulse, setChatButtonPulse] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "¡Hola! Soy Pupi. Preguntame lo que necesites sobre tu negocio." },
  ])
  const [chatInput, setChatInput] = useState("")
  const [showMicTooltip, setShowMicTooltip] = useState(false)
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null)
  const [crmClients, setCrmClients] = useState<Client[]>(defaultClientsData)
  const [crmView, setCrmView] = useState<"list" | "detail" | "new" | "import" | "duplicates" | "map">("list")
  const [mapPinHover, setMapPinHover] = useState<number | string | null>(null)
  const [showDupBanner, setShowDupBanner] = useState(true)
  const [ventasView, setVentasView] = useState<"pipeline" | "detail" | "new" | "forecast" | "risk" | "sellers" | "products" | "ranking">("pipeline")
  const [showRiskBanner, setShowRiskBanner] = useState(true)
  const [mktView, setMktView] = useState<"campaigns" | "detail" | "new" | "insights" | "research" | "newresearch" | "researchdetail">("campaigns")
  const [mktNavTab, setMktNavTab] = useState<"Campañas" | "Insights" | "Investigaciones">("Campañas")
  const [mktSearch, setMktSearch] = useState("")
  const [mktStatusFilter, setMktStatusFilter] = useState("Todas")
  const [mktChannelFilter, setMktChannelFilter] = useState("Todos")
  const [mktPeriodFilter, setMktPeriodFilter] = useState("Este mes")
  const [mktLocalCampaigns, setMktLocalCampaigns] = useState<any[]>([])
  const [resSearch, setResSearch] = useState("")
  const [resTipoFilter, setResTipoFilter] = useState("Todos")
  const [resStatusFilter, setResStatusFilter] = useState("Todos")
  const [resAuthorFilter, setResAuthorFilter] = useState("Todos")
  const [resSelected, setResSelected] = useState<{ title: string; type: string; author: string; date: string; desc: string; tags: string[]; status: string; files: number; ai: boolean } | null>(null)
  const [resDetailTab, setResDetailTab] = useState<"Resumen" | "Hallazgos" | "Documentos" | "Notas">("Resumen")
  const [showExportModal, setShowExportModal] = useState(false)
  const [rrhhView, setRrhhView] = useState<"team" | "detail" | "new" | "orgchart" | "pulse" | "payroll">("team")
  const [rrhhNavTab, setRrhhNavTab] = useState<"Equipo" | "Organigrama" | "Clima laboral" | "Sueldos" | "Resumen semanal">("Equipo")
  const [rrhhSearch, setRrhhSearch] = useState("")
  const [rrhhStatusFilter, setRrhhStatusFilter] = useState("Todos")
  const [rrhhAreaFilter, setRrhhAreaFilter] = useState("Todas")
  const [rrhhAlertFilter, setRrhhAlertFilter] = useState("Sin alertas")
  const [rrhhSelectedEmp, setRrhhSelectedEmp] = useState<{ id: string; name: string; role: string; area: string; status: string; score: number; alert: string; seniority: string; initials: string } | null>(null)
  const [showRrhhAlertBanner, setShowRrhhAlertBanner] = useState(true)
  const [rrhhDetailTab, setRrhhDetailTab] = useState<"Actividad" | "Tareas" | "Evaluaciones" | "Capacitaciones" | "Documentos" | "Feedback" | "Ausencias">("Actividad")
  const [rrhhTaskFilter, setRrhhTaskFilter] = useState("Todas")
  const [rrhhOrgZoom, setRrhhOrgZoom] = useState(100)
  const [showPayrollDetailModal, setShowPayrollDetailModal] = useState(false)
  const [payrollSelectedId, setPayrollSelectedId] = useState<number | null>(null)
  const [showPayrollConfigModal, setShowPayrollConfigModal] = useState(false)
  const [showLiquidateModal, setShowLiquidateModal] = useState(false)
  const [payrollStatuses, setPayrollStatuses] = useState<Record<number, string>>({ 1: "Pendiente", 2: "Pendiente", 3: "Pendiente", 4: "Pendiente", 5: "Liquidado", 6: "Pendiente", 7: "Pendiente", 8: "Pendiente" })
  const [payrollAntiguedadOn, setPayrollAntiguedadOn] = useState(true)
  const [payrollPresentismoOn, setPayrollPresentismoOn] = useState(true)
  const [payrollCargasOn, setPayrollCargasOn] = useState(true)
  const [payrollAntiguedadPct, setPayrollAntiguedadPct] = useState("5")
  const [payrollPresentismoAmt, setPayrollPresentismoAmt] = useState("8000")
  const [climateSubTab, setClimateSubTab] = useState<'indice'|'equipo'|'encuestas'>('indice')
  const [climateThermometers, setClimateThermometers] = useState({
    motivacion: 72,
    satisfaccion: 68,
    productividad: 75,
    ideas: 65,
    eficacia: 78,
    carga: 85,
    burnout: 42,
  })
  const [showSurveyAlert, setShowSurveyAlert] = useState(true)
  const [surveyStatus, setSurveyStatus] = useState<'idle'|'sent'|'collecting'|'done'>('idle')
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [surveyResponses, setSurveyResponses] = useState(0)
  const [showAssignTaskForm, setShowAssignTaskForm] = useState(false)
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("Media")
  const [newTaskCategory, setNewTaskCategory] = useState("Ventas")
  const [newTaskDue, setNewTaskDue] = useState("")
  const [taskMenuOpenId, setTaskMenuOpenId] = useState<string | null>(null)
  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [newEmployeeRole, setNewEmployeeRole] = useState("")
  const [newEmployeeArea, setNewEmployeeArea] = useState("")
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("")
  const [newEmployeePhone, setNewEmployeePhone] = useState("")
  const [newEmployeeHireDate, setNewEmployeeHireDate] = useState("")
  const [newEmployeeSalary, setNewEmployeeSalary] = useState("")
  const [newEmployeeContract, setNewEmployeeContract] = useState("dependency")
  const [contabNavTab, setContabNavTab] = useState<"Dashboard" | "Movimientos" | "Análisis" | "Proyecciones" | "Exportar">("Dashboard")
  const [showContabAlertBanner, setShowContabAlertBanner] = useState(true)
  const [movSearch, setMovSearch] = useState("")
  const [movTipoFilter, setMovTipoFilter] = useState("Todos")
  const [movCatFilter, setMovCatFilter] = useState("Todas")
  const [movPeriodoFilter, setMovPeriodoFilter] = useState("Este mes")
  const [movOrigenFilter, setMovOrigenFilter] = useState("Todos")
  const [movMenuOpenId, setMovMenuOpenId] = useState<string | null>(null)
  const [showRegGasto, setShowRegGasto] = useState(false)
  const [showRegIngreso, setShowRegIngreso] = useState(false)
  const [regDesc, setRegDesc] = useState("")
  const [regMonto, setRegMonto] = useState("")
  const [regCat, setRegCat] = useState("Operaciones")
  const [regFecha, setRegFecha] = useState("2026-05-25")
  const [regDescIn, setRegDescIn] = useState("")
  const [regMontoIn, setRegMontoIn] = useState("")
  const [regCatIn, setRegCatIn] = useState("Ventas")
  const [regFechaIn, setRegFechaIn] = useState("2026-05-25")
  const [regVincularCliente, setRegVincularCliente] = useState(false)
  const [regClienteIn, setRegClienteIn] = useState("Tech Solutions")
  const [analisisPeriod, setAnalisisPeriod] = useState("Este mes")
  const [proyPeriod, setProyPeriod] = useState("6 meses")
  const [exportHistSearch, setExportHistSearch] = useState("")
  const [exportHistPeriod, setExportHistPeriod] = useState("Todos los períodos")
  const [exportHistType, setExportHistType] = useState("Todos")
  const [exportHistExpanded, setExportHistExpanded] = useState(false)
  const [exportCustomFmt, setExportCustomFmt] = useState("Excel")
  const [exportCustomFrom2, setExportCustomFrom2] = useState("2026-01-01")
  const [exportCustomTo2, setExportCustomTo2] = useState("2026-05-25")
  const [exportCustomChecks, setExportCustomChecks] = useState<Record<string,boolean>>({ Ingresos:true, Gastos:true, Comisiones:true, Sueldos:true, IVA:false, Comprobantes:false })
  const [exportGenState, setExportGenState] = useState<"idle"|"loading"|"done">("idle")
  const [wsView, setWsView] = useState<"home"|"history"|"search"|"reports"|"settings"|"onboarding"|"memory">("home")
  const [wsTasks, setWsTasks] = useState<Record<number,boolean>>({ 4: true })
  const [wsGeneratedReports, setWsGeneratedReports] = useState<WorkspaceGeneratedReport[]>(WS_GENERATED_REPORTS)
  const [showWsReportModal, setShowWsReportModal] = useState(false)
  const [wsSelectedReportTemplate, setWsSelectedReportTemplate] = useState<string | null>(null)
  const [wsReportPeriod, setWsReportPeriod] = useState("Este mes")
  const [wsReportFrom, setWsReportFrom] = useState("2026-05-01")
  const [wsReportTo, setWsReportTo] = useState("2026-05-25")
  const [wsReportChecks, setWsReportChecks] = useState<Record<string, boolean>>({
    "Resumen de ventas": true,
    "Estado del equipo": true,
    "Situación financiera": true,
    "Alertas activas": true,
    "Recomendaciones Pupi": true,
    "Próximos pasos": true,
  })
  const [wsReportFormat, setWsReportFormat] = useState("PDF")
  const [wsReportTitle, setWsReportTitle] = useState("")
  const [wsReportBrand, setWsReportBrand] = useState(true)
  const [wsReportGenState, setWsReportGenState] = useState<"idle" | "loading" | "done">("idle")
  const [wsDownloadStates, setWsDownloadStates] = useState<Record<number, "idle" | "loading" | "done">>({})
  const [wsScheduledOn, setWsScheduledOn] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: false })
  const [wsSettingsTab, setWsSettingsTab] = useState<WsSettingsTab>("roles")
  const [wsSettingsDirty, setWsSettingsDirty] = useState(false)
  const [wsRolePerms, setWsRolePerms] = useState(WS_DEFAULT_ROLE_PERMS)
  const [wsPartialSubChecks, setWsPartialSubChecks] = useState<Record<string, Record<string, boolean>>>({
    crm: { "Ver clientes asignados": true, "Registrar interacciones": true, "Ver historial propio": false },
    ventas: { "Ver su pipeline": true, "Crear oportunidades": true, "Ver comisiones propias": true },
    rrhh: { "Ver sus tareas": true, "Ver su desempeño": false, "Ver sus documentos": false },
  })
  const [showWsPermModal, setShowWsPermModal] = useState(false)
  const [wsPermModalRole, setWsPermModalRole] = useState<string | null>(null)
  const [wsDraftPerms, setWsDraftPerms] = useState<Record<WsPermModule, WsPermLevel>>(WS_DEFAULT_ROLE_PERMS.dueno)
  const [wsDraftPartialSubs, setWsDraftPartialSubs] = useState<Record<string, boolean>>({})
  const [wsRoleExpanded, setWsRoleExpanded] = useState<Record<string, boolean>>({ dueno: true, vendedor: false, empleado: false })
  const [wsEmpresaNombre, setWsEmpresaNombre] = useState("Distribuidora Norte S.A.")
  const [wsEmpresaRubro, setWsEmpresaRubro] = useState("Distribución y logística")
  const [wsEmpresaAnios, setWsEmpresaAnios] = useState("12")
  const [wsEmpresaEmpleados, setWsEmpresaEmpleados] = useState("24")
  const [wsEmpresaPais, setWsEmpresaPais] = useState("Argentina")
  const [wsEmpresaCiudad, setWsEmpresaCiudad] = useState("Buenos Aires")
  const [wsEmpresaWeb, setWsEmpresaWeb] = useState("www.distribuidoranorte.com")
  const [wsEmpresaDesc, setWsEmpresaDesc] = useState("Empresa líder en distribución B2B con operaciones en todo el país.")
  const [wsBrandColor, setWsBrandColor] = useState("#2563EB")
  const [wsNotifAlerts, setWsNotifAlerts] = useState({
    ventasCerradas: true, nuevasOportunidades: true, clientesRiesgo: true, alertasFinancieras: true,
    estadoEquipo: true, campanasBajo: true, metasRiesgo: false, resumenDiario: true,
  })
  const [wsNotifFreq, setWsNotifFreq] = useState({ diario: true, semanal: true, mensual: true })
  const [wsNotifChannels, setWsNotifChannels] = useState({ pupi: true, email: true, whatsapp: false })
  const [wsIntegrations, setWsIntegrations] = useState<Record<string, boolean>>({
    whatsapp: false, google: false, mercadopago: false, slack: false, sheets: false, zapier: false,
  })
  const [wsOnbStage, setWsOnbStage] = useState<"form" | "upload" | "diagnosis">("form")
  const [wsOnbEmpresa, setWsOnbEmpresa] = useState("")
  const [wsOnbRubro, setWsOnbRubro] = useState("Distribución / Mayorista")
  const [wsOnbAnios, setWsOnbAnios] = useState("")
  const [wsOnbFacturacion, setWsOnbFacturacion] = useState("$50.000 - $200.000 USD")
  const [wsOnbDescNegocio, setWsOnbDescNegocio] = useState("")
  const [wsOnbEmpleados, setWsOnbEmpleados] = useState("")
  const [wsOnbVendedores, setWsOnbVendedores] = useState("")
  const [wsOnbSucursales, setWsOnbSucursales] = useState(false)
  const [wsOnbSucursalesCount, setWsOnbSucursalesCount] = useState("")
  const [wsOnbPerfilCliente, setWsOnbPerfilCliente] = useState("Empresas (B2B)")
  const [wsOnbTicket, setWsOnbTicket] = useState("")
  const [wsOnbFrecuencia, setWsOnbFrecuencia] = useState("Mensual")
  const [wsOnbZona, setWsOnbZona] = useState("")
  const [wsOnbPainPoints, setWsOnbPainPoints] = useState<Record<string, boolean>>({})
  const [wsOnbGoals, setWsOnbGoals] = useState<Record<string, boolean>>({})
  const [wsOnbTools, setWsOnbTools] = useState<Record<string, boolean>>({ "Excel / Google Sheets": true, "WhatsApp": true })
  const [wsOnbUploads, setWsOnbUploads] = useState<Record<string, { name: string; size: string } | null>>({})
  const [wsOnboardingProcessing, setWsOnboardingProcessing] = useState(false)
  const [wsOnbProgress, setWsOnbProgress] = useState(0)
  const [wsOnbProcSteps, setWsOnbProcSteps] = useState<string[]>([])
  const [histSearch, setHistSearch] = useState("")
  const [histModulo, setHistModulo] = useState("Todos")
  const [histTipo, setHistTipo] = useState("Todos")
  const [histPeriodo, setHistPeriodo] = useState("Esta semana")
  const [exportChecks, setExportChecks] = useState<boolean[]>([true, true, true, true, true, true])
  const [exportPeriod, setExportPeriod] = useState("Este mes")
  const [exportCustomFrom, setExportCustomFrom] = useState("")
  const [exportCustomTo, setExportCustomTo] = useState("")
  const [exportFormat, setExportFormat] = useState(0)
  const [exportLogo, setExportLogo] = useState(true)
  const [exportBrand, setExportBrand] = useState(true)
  const [exportTitle, setExportTitle] = useState("Reporte de Marketing — Mayo 2026")
  const [exportState, setExportState] = useState<"idle" | "loading" | "done">("idle")
  const [mktSelectedCamp, setMktSelectedCamp] = useState<{ id: string; name: string; channel: string; date: string; status: string; roi: string; roiDir: string; budget: string } | null>(null)
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

  // Settings panel state
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'users'|'profile'|'company'|'billing'|'notifications'|'integrations'|'voice'|'security'>('users')
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState('employee')
  const [newUserEmailError, setNewUserEmailError] = useState('')
  const [newUserPermissions, setNewUserPermissions] = useState<Record<string, { enabled: boolean; access: 'reader'|'editor'; sections: string[] }>>({
    crm: { enabled: false, access: 'reader', sections: [] },
    ventas: { enabled: false, access: 'reader', sections: [] },
    marketing: { enabled: false, access: 'reader', sections: [] },
    rrhh: { enabled: false, access: 'reader', sections: [] },
    contabilidad: { enabled: false, access: 'reader', sections: [] },
    workspace: { enabled: false, access: 'reader', sections: [] },
  })
  const [settingsUsers, setSettingsUsers] = useState([
    { id: '1', name: 'Nacho', email: 'nacho@test.com', role: 'owner', avatar: 'NA', modules: 'Todo' },
    { id: '2', name: 'Juan Pérez', email: 'jp@test.com', role: 'seller', avatar: 'JP', modules: 'CRM, Ventas' },
    { id: '3', name: 'Carlos Acosta', email: 'ca@test.com', role: 'seller', avatar: 'CA', modules: 'CRM, Ventas' },
    { id: '4', name: 'María Ruiz', email: 'mr@test.com', role: 'seller', avatar: 'MR', modules: 'CRM, Ventas' },
  ])
  const [profileName, setProfileName] = useState('Nacho')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileCargo, setProfileCargo] = useState('Dueño')
  const [profilePhone, setProfilePhone] = useState('')
  const [profilePassCurrent, setProfilePassCurrent] = useState('')
  const [profilePassNew, setProfilePassNew] = useState('')
  const [profilePassConfirm, setProfilePassConfirm] = useState('')

  const [settingsNotifAlerts, setSettingsNotifAlerts] = useState({
    ventasCerradas: true, oportunidadesRiesgo: true, clientesSinContacto: true, anomaliasFinancieras: true,
    alertasEquipo: true, campanasBajoRoi: true, metasRiesgo: false, resumenSemanal: true,
  })
  const [settingsNotifChannels, setSettingsNotifChannels] = useState({ pupi: true, email: true, whatsapp: false })
  const [settingsNotifWhatsAppPhone, setSettingsNotifWhatsAppPhone] = useState('')
  const [settingsNotifFreq, setSettingsNotifFreq] = useState({ diario: true, semanal: true, mensual: true })
  const [settingsIntegrations, setSettingsIntegrations] = useState<Record<string, boolean>>({
    mercadopago: false, fiserv: false, whatsapp: false, google: false, slack: false, zapier: false,
  })
  const [voiceIdioma, setVoiceIdioma] = useState('Español (Latino)')
  const [voiceTipo, setVoiceTipo] = useState('Natural')
  const [billingData, setBillingData] = useState<{
    plan: { id: string; name: string; price: number; status: string; renewal: string | null }
    usage: { users: { used: number; limit: number }; queries: { used: number; limit: number }; storage: { used_gb: number; limit_gb: number } }
    invoices: Array<{ description: string; amount: number; status: string; date: string }>
    polar_configured?: boolean
    checkout_url?: string
    portal_url?: string
    payment?: { provider: 'polar' } | null
  } | null>(null)
  const [googleStatus, setGoogleStatus] = useState<{
    configured: boolean
    connected: boolean
    email: string | null
  } | null>(null)

  // Push-to-talk state
  const [isListening, setIsListening] = useState(false)
  const [spaceHoldProgress, setSpaceHoldProgress] = useState(0)
  const [spaceHoldTimer, setSpaceHoldTimer] = useState<NodeJS.Timeout | null>(null)
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)

  // Voice settings state
  const [voiceSpaceEnabled, setVoiceSpaceEnabled] = useState(true)
  const [voiceWakeEnabled, setVoiceWakeEnabled] = useState(false)
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(false)

  const syncBackendData = useCallback(async () => {
    if (!companyId) return
    const [settings, team, me, company, billing] = await Promise.all([
      fetchSettings(), fetchTeamUsers(), fetchMe(), fetchCompany(), fetchBilling(),
    ])
    if (settings) {
      setSettingsNotifAlerts(prev => ({ ...prev, ...settings.notifications.alerts }))
      setSettingsNotifChannels(prev => ({ ...prev, ...settings.notifications.channels }))
      setSettingsNotifFreq(prev => ({ ...prev, ...settings.notifications.freq }))
      setSettingsNotifWhatsAppPhone(settings.notifications.whatsappPhone || '')
      const v = settings.voice
      if (typeof v.spaceEnabled === 'boolean') setVoiceSpaceEnabled(v.spaceEnabled)
      if (typeof v.wakeEnabled === 'boolean') setVoiceWakeEnabled(v.wakeEnabled)
      if (typeof v.responseEnabled === 'boolean') setVoiceResponseEnabled(v.responseEnabled)
      if (typeof v.idioma === 'string') setVoiceIdioma(v.idioma)
      if (typeof v.tipo === 'string') setVoiceTipo(v.tipo)
      setSettingsIntegrations(prev => ({ ...prev, ...settings.integrations }))
    }
    if (team?.users?.length) {
      setSettingsUsers(team.users.map(u => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        avatar: u.avatar, modules: u.modules,
      })))
    }
    if (me) {
      setProfileName(me.name)
      setProfileEmail(me.email)
      if (me.phone) setProfilePhone(me.phone)
      if (me.role === 'owner') setProfileCargo('Dueño')
    }
    if (company) {
      setWsEmpresaNombre(company.name || '')
      setWsEmpresaRubro(company.industry || '')
      if (company.size) setWsEmpresaEmpleados(String(company.size))
      if (company.anios) setWsEmpresaAnios(company.anios)
      if (company.ciudad) setWsEmpresaCiudad(company.ciudad)
      if (company.pais) setWsEmpresaPais(company.pais)
      if (company.web) setWsEmpresaWeb(company.web)
      if (company.desc) setWsEmpresaDesc(company.desc)
    }
    if (billing) setBillingData(billing)
  }, [companyId])

  const [realClients, setRealClients] =
    useState(defaultClientsData)
  const [crmLoading, setCrmLoading] =
    useState(false)

  const fetchClients = async () => {
    setCrmLoading(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          company_name,
          email,
          phone,
          temperature,
          average_ticket,
          purchase_frequency_days,
          last_contact_at,
          last_purchase_at,
          total_purchases,
          purchase_count,
          tags,
          assigned_seller_id
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = data.map(client => ({
          id: client.id,
          name: client.name,
          company: client.company_name ||
            'Sin empresa',
          email: client.email || '',
          phone: client.phone || '',
          temp: client.temperature === 'hot'
            ? 'Caliente' as const
            : client.temperature === 'warm'
            ? 'Tibio' as const
            : 'Frío' as const,
          lastContact: client.last_contact_at
            ? `Hace ${Math.floor(
                (Date.now() - new Date(
                  client.last_contact_at
                ).getTime()) / 86400000
              )} días`
            : 'Sin contacto',
          ticket: `$${(
            client.average_ticket || 0
          ).toLocaleString()}`,
          seller: 'MR',
          tags: client.tags || [],
          avatar: client.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase(),
        }))
        setRealClients(mapped)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setCrmLoading(false)
    }
  }

  const [realOpportunities, setRealOpportunities] =
    useState<any[]>([])
  const [ventasLoading, setVentasLoading] =
    useState(false)

  const fetchOpportunities = async () => {
    setVentasLoading(true)
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          id,
          amount,
          stage,
          probability,
          estimated_close_date,
          created_at,
          client_id,
          seller_id,
          clients (
            name,
            company_name
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = data.map(opp => ({
          id: opp.id,
          client: (opp.clients as any)?.name
            || 'Cliente',
          company: (opp.clients as any)
            ?.company_name || 'Sin empresa',
          amount: opp.amount,
          stage: opp.stage === 'prospect'
            ? 'Prospecto'
            : opp.stage === 'proposal'
            ? 'Propuesta'
            : opp.stage === 'negotiation'
            ? 'Negociación'
            : opp.stage === 'closed_won'
            ? 'Cerrado'
            : 'Perdido',
          probability: opp.probability,
          daysToClose: opp.estimated_close_date
            ? Math.max(0, Math.floor(
                (new Date(opp.estimated_close_date)
                  .getTime() - Date.now()
                ) / 86400000
              ))
            : 0,
          seller: 'JP',
          avatar: 'JP',
        }))
        setRealOpportunities(mapped)
      }
    } catch (error) {
      console.error('Error fetching opportunities:',
        error)
    } finally {
      setVentasLoading(false)
    }
  }

  const [realMovements, setRealMovements] =
    useState<any[]>([])
  const [contabilidadLoading, setContabilidadLoading] =
    useState(false)

  const fetchMovements = async () => {
    setContabilidadLoading(true)
    try {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = data.map(m => ({
          id: m.id,
          type: m.type,
          description: m.description,
          amount: Number(m.amount),
          category: m.category || 'General',
          date: m.date,
          origin: m.origin,
          is_anomaly: m.is_anomaly || false,
          displayDate: new Date(m.date)
            .toLocaleDateString('es-UY', {
              day: 'numeric',
              month: 'long',
            }),
          displayAmount: m.type === 'income'
            ? `+$${Number(m.amount).toLocaleString()}`
            : `-$${Number(m.amount).toLocaleString()}`,
        }))
        setRealMovements(mapped)
      }
    } catch (error) {
      console.error('Error fetching movements:',
        error)
    } finally {
      setContabilidadLoading(false)
    }
  }

  const [realEmployees, setRealEmployees] =
    useState<any[]>([])
  const [rrhhLoading, setRrhhLoading] =
    useState(false)
  const [realTasks, setRealTasks] =
    useState<any[]>([])

  const fetchEmployees = async () => {
    setRrhhLoading(true)
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = data.map(emp => ({
          id: emp.id,
          name: emp.name,
          role: emp.role,
          area: emp.area || 'General',
          status: emp.status === 'active'
            ? 'Activo'
            : emp.status === 'leave'
            ? 'Licencia'
            : 'Baja',
          performance: Number(emp.performance_score) || 0,
          satisfaction: Number(emp.satisfaction_score) || 0,
          salary: Number(emp.gross_salary) || 0,
          hireDate: emp.hire_date,
          seniority: emp.hire_date
            ? `${Math.floor(
                (Date.now() - new Date(emp.hire_date)
                  .getTime()) / 31536000000
              )} años`
            : 'Nuevo',
          avatar: emp.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase(),
          ai_churn_risk: emp.ai_churn_risk,
          ai_recommendation: emp.ai_recommendation,
        }))
        setRealEmployees(mapped)
      }
    } catch (error) {
      console.error('Error fetching employees:',
        error)
    } finally {
      setRrhhLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_tasks')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority === 'high'
            ? 'Alta'
            : task.priority === 'medium'
            ? 'Media'
            : 'Baja',
          status: task.status === 'completed'
            ? 'Completada'
            : task.status === 'in_progress'
            ? 'En proceso'
            : 'Pendiente',
          dueDate: task.due_date,
          category: task.category || 'General',
          employee_id: task.employee_id,
        }))
        setRealTasks(mapped)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const [realCampaigns, setRealCampaigns] =
    useState<any[]>([])
  const [marketingLoading, setMarketingLoading] =
    useState(false)
  const [realResearch, setRealResearch] =
    useState<any[]>([])

  const fetchCampaigns = async () => {
    setMarketingLoading(true)
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = data.map(c => ({
          id: c.id,
          name: c.name,
          channel: c.channel === 'email'
            ? 'Email'
            : c.channel === 'social'
            ? 'Redes sociales'
            : c.channel === 'google'
            ? 'Google Ads'
            : c.channel === 'whatsapp'
            ? 'WhatsApp'
            : c.channel === 'event'
            ? 'Evento'
            : 'Otro',
          status: c.status === 'active'
            ? 'Activa'
            : c.status === 'paused'
            ? 'Pausada'
            : c.status === 'finished'
            ? 'Finalizada'
            : 'Borrador',
          budget: Number(c.budget) || 0,
          spent: Number(c.spent) || 0,
          metrics: c.metrics || {},
          startDate: c.start_date,
          endDate: c.end_date,
          objective: c.objective,
          segment: c.segment,
          displayBudget: `$${(
            Number(c.budget) || 0
          ).toLocaleString()}`,
        }))
        setRealCampaigns(mapped)
      }
    } catch (error) {
      console.error('Error fetching campaigns:',
        error)
    } finally {
      setMarketingLoading(false)
    }
  }

  const fetchResearch = async () => {
    try {
      const { data, error } = await supabase
        .from('research')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = data.map(r => ({
          id: r.id,
          title: r.title,
          type: r.type,
          status: r.status === 'in_progress'
            ? 'En proceso'
            : r.status === 'finished'
            ? 'Finalizado'
            : 'Archivado',
          summary: r.summary,
          findings: r.findings || [],
          tags: r.tags || [],
          files: r.files || [],
          ai_analyzed: r.ai_analyzed || false,
          ai_insights: r.ai_insights || {},
          created_at: r.created_at,
        }))
        setRealResearch(mapped)
      }
    } catch (error) {
      console.error('Error fetching research:',
        error)
    }
  }

  const [realNotifications, setRealNotifications] =
    useState<any[]>([])
  const [workspaceLoading, setWorkspaceLoading] =
    useState(false)
  const [chatHistory, setChatHistory] =
    useState<any[]>([])
  const [companyMemory, setCompanyMemory] =
    useState<any>(null)
  const [realReports, setRealReports] =
    useState<any[]>([])

  const fetchNotifications = async () => {
    setWorkspaceLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = data.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          module: n.module,
          priority: n.priority,
          read: n.read,
          created_at: n.created_at,
          displayTime: new Date(n.created_at)
            .toLocaleDateString('es-UY', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
        }))
        setRealNotifications(mapped)
      }
    } catch (error) {
      console.error('Error fetching notifications:',
        error)
    } finally {
      setWorkspaceLoading(false)
    }
  }

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error

      if (data && data.length > 0) {
        setChatHistory(data.map(m => ({
          id: m.id,
          role: m.role,
          message: m.message,
          created_at: m.created_at,
        })))
      }
    } catch (error) {
      console.error('Error fetching chat:', error)
    }
  }

  const fetchCompanyMemory = async () => {
    try {
      const { data, error } = await supabase
        .from('company_memory')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle()

      if (error) throw error
      if (data) setCompanyMemory(data)
    } catch (error) {
      console.error('Error fetching memory:', error)
    }
  }

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setRealReports(data)
    } catch (error) {
      console.error('Error fetching reports:',
        error)
    }
  }

  useEffect(() => {
    if (!companyId) return
    fetchClients()
    fetchOpportunities()
    fetchMovements()
    fetchEmployees()
    fetchTasks()
    fetchCampaigns()
    fetchResearch()
    fetchNotifications()
    fetchChatHistory()
    fetchCompanyMemory()
    fetchReports()
    syncBackendData()
  }, [companyId])

  useEffect(() => {
    if (showSettings && companyId) syncBackendData()
  }, [showSettings, companyId, syncBackendData])

  useEffect(() => {
    if (chatHistory.length > 0) {
      setChatMessages(chatHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        text: m.message,
      })))
    }
  }, [chatHistory])

  const [showSuccessToast, setShowSuccessToast] =
    useState(false)
  const [toastMessage, setToastMessage] =
    useState('')

  const showToast = (message: string) => {
    setToastMessage(message)
    setShowSuccessToast(true)
    setTimeout(() =>
      setShowSuccessToast(false), 2000)
  }

  const refreshGoogleStatus = useCallback(async () => {
    if (!companyId) return
    const status = await fetchGoogleStatus()
    if (status) setGoogleStatus(status)
  }, [companyId])

  useEffect(() => {
    refreshGoogleStatus()
  }, [refreshGoogleStatus])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const tools = params.get('tools')
    if (tools === 'connected') {
      showToast('Google Workspace conectado')
      refreshGoogleStatus()
      window.history.replaceState({}, '', '/dashboard')
    } else if (tools === 'error') {
      showToast('No se pudo conectar Google')
      window.history.replaceState({}, '', '/dashboard')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resolveClientId = (clientName: string): string | null => {
    const found = realClients.find(c => c.name === clientName)
      || crmClients.find(c => c.name === clientName)
    if (!found) return null
    return typeof found.id === 'string' ? found.id : null
  }

  const resetNewForm = () => {
    setNewName(""); setNewCompany(""); setNewEmail(""); setNewPhone("")
    setNewLocation(""); setNewTemp("Tibio"); setNewTags(""); setNewSeller("MR")
    setNewTicket(""); setNewFrequency(""); setNewB2B(""); setNewNotes("")
    setNewStreet(""); setNewCity(""); setNewCountry("")
  }

  const saveNewClient = async () => {
    if (!newName.trim()) return
    try {
      const { error } = await supabase
        .from('clients')
        .insert({
          company_id: companyId,
          name: newName.trim(),
          company_name: newCompany || null,
          email: newEmail || null,
          phone: newPhone || null,
          location: newLocation || null,
          city: newCity || null,
          country: newCountry || null,
          temperature: newTemp === 'Caliente'
            ? 'hot'
            : newTemp === 'Tibio'
            ? 'warm'
            : 'cold',
          average_ticket: parseFloat(
            newTicket || '0'
          ),
          purchase_frequency_days: parseInt(
            newFrequency || '30'
          ),
          tags: newTags
            ? newTags.split(',')
              .map((t: string) => t.trim())
            : [],
          b2b_group: newB2B || null,
          notes: newNotes || null,
        })
        .select()
        .single()

      if (error) throw error

      await fetchClients()
      resetNewForm()
      setCrmView('list')
      showToast('Cliente guardado')
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  const saveNewOpportunity = async () => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .insert({
          company_id: companyId,
          client_id: resolveClientId(newOppClient),
          title: newOppDesc || newOppClient || 'Nueva oportunidad',
          amount: parseFloat(
            newOppAmount || '0'
          ),
          stage: newOppStage === 'Prospecto'
            ? 'prospect'
            : newOppStage === 'Propuesta'
            ? 'proposal'
            : newOppStage === 'Negociación'
            ? 'negotiation'
            : newOppStage === 'Cerrado'
            ? 'closed_won'
            : 'prospect',
          probability: newOppProb,
          estimated_close_date:
            newOppDate || null,
          origin: newOppOrigin || null,
          notes: newOppNotes || null,
        })

      if (error) throw error

      await fetchOpportunities()
      setVentasView('pipeline')
      showToast('Oportunidad creada')
    } catch (error) {
      console.error('Error saving opportunity:',
        error)
    }
  }

  const handleSaveExpense = async () => {
    try {
      const { error } = await supabase
        .from('movements')
        .insert({
          company_id: companyId,
          type: 'expense',
          description: regDesc,
          amount: parseFloat(
            regMonto || '0'
          ),
          category: regCat || 'Otros',
          date: regFecha ||
            new Date().toISOString().split('T')[0],
          origin: 'manual',
        })

      if (error) throw error

      await fetchMovements()
      setShowRegGasto(false)
      setRegDesc('')
      setRegMonto('')
      showToast('Movimiento registrado')
    } catch (error) {
      console.error('Error saving expense:', error)
    }
  }

  const handleSaveIncome = async () => {
    try {
      const { error } = await supabase
        .from('movements')
        .insert({
          company_id: companyId,
          type: 'income',
          description: regDescIn,
          amount: parseFloat(
            regMontoIn || '0'
          ),
          category: regCatIn || 'Ventas',
          date: regFechaIn ||
            new Date().toISOString().split('T')[0],
          origin: 'manual',
        })

      if (error) throw error

      await fetchMovements()
      setShowRegIngreso(false)
      setRegDescIn('')
      setRegMontoIn('')
      showToast('Movimiento registrado')
    } catch (error) {
      console.error('Error saving income:', error)
    }
  }

  const handleSaveNewEmployee = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .insert({
          company_id: companyId,
          name: newEmployeeName,
          role: newEmployeeRole,
          area: newEmployeeArea || null,
          email: newEmployeeEmail || null,
          phone: newEmployeePhone || null,
          hire_date: newEmployeeHireDate ||
            new Date().toISOString().split('T')[0],
          gross_salary: parseFloat(
            newEmployeeSalary || '0'
          ),
          contract_type:
            newEmployeeContract || 'dependency',
          status: 'active',
        })

      if (error) throw error

      await fetchEmployees()
      setRrhhView('team')
      showToast('Empleado guardado')
    } catch (error) {
      console.error('Error saving employee:', error)
    }
  }

  const handleSaveTask = async (
    employeeId: string
  ) => {
    try {
      const { error } = await supabase
        .from('employee_tasks')
        .insert({
          company_id: companyId,
          employee_id: employeeId,
          title: newTaskName,
          priority: newTaskPriority === 'Alta'
            ? 'high'
            : newTaskPriority === 'Media'
            ? 'medium'
            : 'low',
          status: 'pending',
          category: newTaskCategory || null,
          due_date: newTaskDue || null,
        })

      if (error) throw error

      await fetchTasks()
      setShowAssignTaskForm(false)
      setNewTaskName('')
      setNewTaskDue('')
      showToast('Tarea asignada')
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const handleSaveNewCampaign = async () => {
    try {
      const channelKey = newCampChannel || 'Email'
      const { error } = await supabase
        .from('campaigns')
        .insert({
          company_id: companyId,
          name: newCampName || 'Nueva campaña',
          channel: channelKey === 'Email'
            ? 'email'
            : channelKey === 'Redes sociales'
            ? 'social'
            : channelKey === 'Google Ads'
            ? 'google'
            : channelKey === 'WhatsApp'
            ? 'whatsapp'
            : channelKey === 'Evento'
            ? 'event'
            : 'other',
          objective: newCampObjective || null,
          segment: newCampSegments.length > 0
            ? newCampSegments.join(', ')
            : null,
          budget: parseFloat(
            newCampBudget || '0'
          ),
          status: 'active',
          start_date: newCampStart || null,
          end_date: newCampEnd || null,
        })

      if (error) throw error

      await fetchCampaigns()
      setNewCampName(''); setNewCampChannel(null)
      setNewCampObjective('Generar nuevas ventas')
      setNewCampSegments([]); setNewCampBudget('')
      setNewCampStart(''); setNewCampEnd('')
      setNewCampOwner('JP'); setNewCampSubject('')
      setNewCampMessage(''); setNewCampCTA('')
      setNewCampTargetOpen(''); setNewCampTargetClick('')
      setNewCampTargetConv('')
      setMktView('campaigns')
      showToast('Campaña creada')
    } catch (error) {
      console.error('Error saving campaign:', error)
    }
  }

  const handleSaveInteraction = async (
    clientId: string
  ) => {
    try {
      const { error } = await supabase
        .from('interactions')
        .insert({
          company_id: companyId,
          client_id: clientId,
          type: crmRegisterType === 'Llamada'
            ? 'call'
            : crmRegisterType === 'Visita'
            ? 'visit'
            : crmRegisterType === 'Email'
            ? 'email'
            : 'purchase',
          description: crmRegisterNote,
          amount: crmRegisterType === 'Compra'
            ? parseFloat(
                crmRegisterAmount || '0'
              )
            : null,
        })

      if (error) throw error

      await supabase
        .from('clients')
        .update({
          last_contact_at: new Date().toISOString()
        })
        .eq('id', clientId)

      await fetchClients()
      setCrmShowRegisterForm(false)
      setCrmRegisterNote('')
      setCrmRegisterAmount('')
      showToast('Interacción registrada')
    } catch (error) {
      console.error('Error saving interaction:',
        error)
    }
  }
  const recognitionRef = useRef<any>(null)
  const wakeRecRef = useRef<SpeechRecognitionInstance | null>(null)
  const commandRecRef = useRef<SpeechRecognitionInstance | null>(null)
  const voiceModeRef = useRef<"wake" | "command" | "idle">("idle")
  const commandTextRef = useRef("")
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startWakeRef = useRef<(() => void) | null>(null)

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
    setIsPaused(false)
    setTimeout(() => {
      setActiveNode(null)
    }, 250)
  }

  const stopWakeRecognition = useCallback(() => {
    const rec = wakeRecRef.current
    wakeRecRef.current = null
    if (rec) {
      try { rec.abort() } catch { try { rec.stop() } catch { /* noop */ } }
    }
  }, [])

  const stopCommandRecognition = useCallback(() => {
    const rec = commandRecRef.current
    commandRecRef.current = null
    if (rec) {
      try { rec.abort() } catch { try { rec.stop() } catch { /* noop */ } }
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const finishVoiceCommand = useCallback((rawText: string) => {
    const text = rawText.replace(/\bpupi\b/gi, "").trim() || rawText.trim()
    if (!text) {
      voiceModeRef.current = "wake"
      setVoiceListening(false)
      stopCommandRecognition()
      startWakeRef.current?.()
      return
    }
    voiceModeRef.current = "wake"
    setVoiceListening(false)
    stopCommandRecognition()
    setChatMessages(prev => [...prev, { role: "user", text }])
    apiSendChat(text).then(reply => {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        text: reply || getPupiChatReply(text),
      }])
    })
    startWakeRef.current?.()
  }, [stopCommandRecognition])

  const startCommandVoice = useCallback(() => {
    const win = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition
    if (!SR) return
    voiceModeRef.current = "command"
    stopWakeRecognition()
    stopCommandRecognition()
    setVoiceListening(true)
    commandTextRef.current = ""
    const rec = new SR()
    rec.continuous = true
    rec.lang = "es-ES"
    rec.interimResults = true
    rec.onresult = (event: SpeechRecognitionEventLike) => {
      let text = ""
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript
      }
      text = text.trim()
      if (!text) return
      commandTextRef.current = text
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => finishVoiceCommand(commandTextRef.current), 2000)
    }
    rec.onend = () => {
      if (voiceModeRef.current === "command" && commandRecRef.current === rec) {
        try { rec.start() } catch { setTimeout(() => { try { rec.start() } catch { /* noop */ } }, 400) }
      }
    }
    rec.onerror = () => {
      if (voiceModeRef.current === "command") {
        setTimeout(() => {
          if (voiceModeRef.current === "command") {
            try { rec.start() } catch { /* noop */ }
          }
        }, 400)
      }
    }
    commandRecRef.current = rec
    try { rec.start() } catch { setTimeout(() => { try { rec.start() } catch { /* noop */ } }, 400) }
  }, [stopWakeRecognition, stopCommandRecognition, finishVoiceCommand])

  const triggerWakeWord = useCallback(() => {
    setShowChatPanel(true)
    setShowWakeGreeting(true)
    setChatButtonPulse(true)
    setTimeout(() => setChatButtonPulse(false), 300)
    setTimeout(() => setShowWakeGreeting(false), 2500)
    startCommandVoice()
  }, [startCommandVoice])

  const toggleChatPanel = useCallback(() => {
    setShowChatPanel(prev => !prev)
    setShowWakeGreeting(false)
  }, [])

  const sendChatMessage = useCallback(() => {
    const text = chatInput.trim()
    if (!text) return
    setChatInput("")
    setChatMessages(prev => [...prev, { role: "user", text }])
    apiSendChat(text).then(reply => {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        text: reply || getPupiChatReply(text),
      }])
    })
  }, [chatInput])

  useEffect(() => {
    const enableVoice = () => setVoiceReady(true)
    window.addEventListener("pointerdown", enableVoice, { once: true })
    return () => window.removeEventListener("pointerdown", enableVoice)
  }, [])

  useEffect(() => {
    if (!voiceReady || activeNode) return
    const win = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition
    if (!SR) {
      setSpeechSupported(false)
      return
    }
    setSpeechSupported(true)
    voiceModeRef.current = "wake"

    const startWake = () => {
      if (voiceModeRef.current !== "wake" || activeNode) return
      stopWakeRecognition()
      const rec = new SR()
      rec.continuous = true
      rec.lang = "es-ES"
      rec.interimResults = false
      rec.onresult = (event: SpeechRecognitionEventLike) => {
        if (voiceModeRef.current !== "wake") return
        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (transcript.toLowerCase().includes("pupi")) {
          triggerWakeWord()
        }
      }
      rec.onend = () => {
        if (voiceModeRef.current === "wake" && wakeRecRef.current === rec) {
          try { rec.start() } catch { setTimeout(startWake, 500) }
        }
      }
      rec.onerror = () => {
        if (voiceModeRef.current === "wake") {
          setTimeout(startWake, 500)
        }
      }
      wakeRecRef.current = rec
      try { rec.start() } catch { setTimeout(startWake, 500) }
    }

    startWakeRef.current = startWake
    startWake()

    return () => {
      stopWakeRecognition()
    }
  }, [voiceReady, activeNode, triggerWakeWord, stopWakeRecognition])

  useEffect(() => {
    if (activeNode) {
      voiceModeRef.current = "idle"
      stopWakeRecognition()
      stopCommandRecognition()
    } else if (voiceReady && !voiceListening) {
      voiceModeRef.current = "wake"
      startWakeRef.current?.()
    }
  }, [activeNode, voiceReady, voiceListening, stopWakeRecognition, stopCommandRecognition])

  useEffect(() => {
    return () => {
      voiceModeRef.current = "idle"
      stopWakeRecognition()
      stopCommandRecognition()
    }
  }, [stopWakeRecognition, stopCommandRecognition])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const isUserTyping = () => {
    const activeElement = document.activeElement
    if (!activeElement) return false
    const typingElements = ["INPUT", "TEXTAREA", "SELECT"]
    if (typingElements.includes(activeElement.tagName)) return true
    if (activeElement.getAttribute("contenteditable") === "true") return true
    return false
  }

  const startVoiceRecognition = () => {
    const win = window as any
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = "es-ES"
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.onstart = () => {
      setIsListening(true)
      setVoiceTranscript("")
      setShowChatPanel(true)
    }
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((result: any) => result[0].transcript)
        .join("")
      setVoiceTranscript(transcript)
    }
    recognition.onend = () => {
      setIsListening(false)
      setIsProcessingVoice(false)
      setVoiceTranscript(t => { if (t) setChatInput(t); return t })
    }
    recognition.onerror = () => {
      setIsListening(false)
      setIsProcessingVoice(false)
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      setIsProcessingVoice(true)
      recognitionRef.current.stop()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return
      if (e.repeat) return
      if (isUserTyping()) return
      if (isListening) return
      e.preventDefault()
      setSpaceHoldProgress(0)
      let progress = 0
      const interval = setInterval(() => {
        progress += 5
        setSpaceHoldProgress(progress)
        if (progress >= 100) clearInterval(interval)
      }, 100)
      setProgressInterval(interval)
      const timer = setTimeout(() => {
        if (!isUserTyping()) startVoiceRecognition()
      }, 2000)
      setSpaceHoldTimer(timer)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return
      if (spaceHoldTimer) { clearTimeout(spaceHoldTimer); setSpaceHoldTimer(null) }
      if (progressInterval) { clearInterval(progressInterval); setProgressInterval(null) }
      setSpaceHoldProgress(0)
      if (isListening) stopVoiceRecognition()
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [isListening, spaceHoldTimer, progressInterval])

  const containerSize = ORBIT_RADIUS * 2 + 160

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
      <style>{`@keyframes orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {/* Logo */}
      <div className="absolute top-6 left-8 z-20" style={{ display: "flex", alignItems: "center" }}>
        <span style={{ color: "white", fontWeight: 700 }}>Pupi</span>
        <span style={{ color: "#2563EB", fontWeight: 400 }}> AI</span>
        <span style={{ display: "inline-block", width: 1, height: 14, background: "rgba(255,255,255,0.15)", margin: "0 12px", verticalAlign: "middle" }} />
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 400 }}>Distribuidora Norte</span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 6px" }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Dueño</span>
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
        {/* Rings (static) */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={containerSize}
          height={containerSize}
          viewBox={`${-containerSize / 2} ${-containerSize / 2} ${containerSize} ${containerSize}`}
        >
          <circle cx="0" cy="0" r={ORBIT_RADIUS * 0.6} fill="none" stroke="rgba(37,99,235,0.06)" strokeWidth="1" />
          <circle cx="0" cy="0" r={ORBIT_RADIUS} fill="none" stroke="rgba(37,99,235,0.12)" strokeWidth="1" strokeDasharray="5 5" />
        </svg>

        {/* Orbiting layer — CSS animation (no React re-renders per frame) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            animation: "orbitSpin 80s linear infinite",
            animationPlayState: isPaused ? "paused" : "running",
            willChange: "transform",
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            width={containerSize}
            height={containerSize}
            viewBox={`${-containerSize / 2} ${-containerSize / 2} ${containerSize} ${containerSize}`}
          >
            {STATIC_NODE_POSITIONS.map((node) => {
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
              STATIC_NODE_POSITIONS
                .filter((node) => activeNode.relatedIds.includes(node.id))
                .map((node) => {
                  const origin = STATIC_NODE_POSITIONS.find((n) => n.id === activeNode.id)!
                  return (
                    <line
                      key={`rel-line-${node.id}`}
                      x1={origin.x} y1={origin.y} x2={node.x} y2={node.y}
                      stroke="rgba(37,99,235,0.4)" strokeWidth="1"
                    />
                  )
                })}
          </svg>

          {STATIC_NODE_POSITIONS.map((node) => {
            const Icon = node.icon
            const isActive = activeNode?.id === node.id
            const isRelated = activeNode?.relatedIds.includes(node.id) ?? false
            const isHovered = hoveredNodeId === node.id

            let glowColor = "rgba(37,99,235,0.15)"
            let glowSize = "0 0 12px"
            if (isHovered) {
              glowColor = "rgba(37,99,235,0.4)"
              glowSize = "0 0 20px"
            }
            if (isActive) {
              glowColor = "rgba(37,99,235,0.7)"
              glowSize = "0 0 30px"
            }

            const orbitAnim = isPaused ? "paused" : "running"
            return (
              <div
                key={node.id}
                className="absolute z-10"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))`,
                  opacity: activeNode && !isActive && !isRelated ? 0.3 : 1,
                  transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <div
                  style={{
                    animation: "orbitSpin 80s linear infinite reverse",
                    animationPlayState: orbitAnim,
                  }}
                >
                  <button
                    type="button"
                    className="flex flex-col items-center"
                    style={{ gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
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
                        width: 72,
                        height: 72,
                        backgroundColor: isActive ? "#2563EB" : isRelated ? "rgba(37,99,235,0.25)" : "rgba(37,99,235,0.1)",
                        border: `1px solid ${isActive ? "#2563EB" : "rgba(37,99,235,0.3)"}`,
                        boxShadow: `${glowSize} ${glowColor}`,
                        transform: isActive ? "scale(1.12)" : isHovered ? "scale(1.07)" : "scale(1)",
                        transition: "background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.4s ease, transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)",
                      }}
                    >
                      <Icon size={30} style={{ color: "white" }} />
                    </div>
                    <span style={{ color: "white", fontSize: 15, fontWeight: 500, whiteSpace: "nowrap" }}>
                      {node.title}
                    </span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Center circle */}
        <div className="relative z-10">
          {spaceHoldProgress > 0 && spaceHoldProgress < 100 && (
            <div style={{ position: "absolute", bottom: "calc(100% + 14px)", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", background: "rgba(10,10,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "rgba(255,255,255,0.5)", pointerEvents: "none", zIndex: 20 }}>
              Mantené para hablar con Pupi
            </div>
          )}
          {spaceHoldProgress > 0 && (
            <svg style={{ position: "absolute", inset: -8, width: "calc(100% + 16px)", height: "calc(100% + 16px)", transform: "rotate(-90deg)", pointerEvents: "none", zIndex: 20 }} viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="66" strokeWidth="2.5" stroke="#2563EB" fill="none"
                strokeDasharray="415"
                strokeDashoffset={415 - (415 * spaceHoldProgress / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 100ms linear" }}
              />
            </svg>
          )}
          {centerHovered && !showVoiceInput && spaceHoldProgress === 0 && (
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
              width: 124,
              height: 124,
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
          <div style={{ position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", color: "rgba(255,255,255,0.5)", fontSize: 12, textAlign: "center", pointerEvents: "none" }}>
            Tocá cualquier área para explorar
          </div>
        </div>
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
          backgroundColor: "rgba(0,0,0,0.65)",
          zIndex: 40,
          opacity: panelVisible ? 1 : 0,
          pointerEvents: panelVisible ? "auto" : "none",
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
          pointerEvents: panelVisible ? "auto" : "none",
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
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>/</span>
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
                  ) : activeNode.id === 3 && mktView === "researchdetail" && resSelected ? (
                    <>
                      <button onClick={() => setMktView("campaigns")} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{activeNode.title}</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <button onClick={() => { setMktNavTab("Investigaciones"); setMktView("campaigns") }} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>Investigaciones</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{resSelected.title}</span>
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
                  ) : activeNode.id === 4 && rrhhView === "detail" && rrhhSelectedEmp ? (
                    <>
                      <button onClick={() => setRrhhView("team")} style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>Recursos Humanos</button>
                      <span style={{ color: "rgba(255,255,235,0.2)", fontSize: 14 }}>/</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{rrhhSelectedEmp.name}</span>
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
                                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textAlign: "center" }}>{c.company}</div>
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
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</div>
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
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Temperatura</div>
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
                                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Próxima compra</span>
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
                                        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Riesgo de abandono</span>
                                      </div>
                                      <div style={{ color: riskColor, fontSize: 13, fontWeight: 500 }}>{riskLabel}</div>
                                    </div>
                                  )
                                })()}

                                {/* Card 3 — Valor del cliente */}
                                <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Valor del cliente</span>
                                  </div>
                                  <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>Alto — top 15%</div>
                                </div>

                                {/* Card 4 — Acción sugerida */}
                                <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Acción sugerida</span>
                                  </div>
                                  <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Llamar esta semana</div>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>No compra desde hace 28 días, su ciclo promedio es 28 días</div>
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
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{date}</div>
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
                                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginBottom: 6 }}>{label}</div>
                                      <div style={{ color: "white", fontSize: 18, fontWeight: 600 }}>{value}</div>
                                    </div>
                                  ))}
                                </div>

                                {/* Horizontal milestone timeline */}
                                <div>
                                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Hitos del ciclo</div>
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
                                                    <div style={{ color: m.done ? "white" : "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: m.done ? 500 : 400, lineHeight: 1.3 }}>{m.label}</div>
                                                    <div style={{ color: m.done ? "#2563EB" : "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 2 }}>{m.sub}</div>
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
                                                  <div style={{ color: m.done ? "white" : "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: m.done ? 500 : 400, lineHeight: 1.3 }}>{m.label}</div>
                                                  <div style={{ color: m.done ? "#2563EB" : "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 2 }}>{m.sub}</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Evolución de compras</div>
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
                                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10 }}>{b.label}</div>
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
                                          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{item.date}</div>
                                          {item.amount && <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 }}>{item.amount}</div>}
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
                                          <button
                                            onClick={() => {
                                              const clientId = crmSelectedClient && typeof crmSelectedClient.id === 'string'
                                                ? crmSelectedClient.id
                                                : null
                                              if (clientId) handleSaveInteraction(clientId)
                                            }}
                                            style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}
                                          >Guardar</button>
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
                                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>Sin documentos adjuntos</div>
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
                                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 10 }}>{text}</div>
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
                                          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>{date}</div>
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
                          const labelStyle: React.CSSProperties = { color: "rgba(255,255,255,0.7)", fontSize: 11, marginBottom: 6, display: "block" }
                          const sectionTitle: React.CSSProperties = { color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }
                          const field = (label: string, el: React.ReactNode, optional?: boolean) => (
                            <div style={{ marginBottom: 12 }}>
                              <label style={labelStyle}>{label}{optional && <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginLeft: 4 }}>(opcional)</span>}</label>
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
                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 4 }}>Separadas por coma</div>
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
                                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 13, pointerEvents: "none" }}>$</span>
                                    <input type="number" style={{ ...inputStyle, paddingLeft: 24 }} placeholder="0" value={newTicket} onChange={e => setNewTicket(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                                  </div>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                  <label style={labelStyle}>Frecuencia de compra</label>
                                  <div style={{ position: "relative" }}>
                                    <input type="number" style={{ ...inputStyle, paddingRight: 48 }} placeholder="30" value={newFrequency} onChange={e => setNewFrequency(e.target.value)} onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 13, pointerEvents: "none" }}>días</span>
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
                                        color: isActive ? "white" : isDone ? "#2563EB" : "rgba(255,255,255,0.6)",
                                      }}>{n}</div>
                                      <div style={{ fontSize: 11, color: isActive ? "white" : "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>{n}. {label}</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 }}>o hacé clic para seleccionar</div>
                                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 16 }}>Formatos aceptados: .xlsx .csv</div>
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
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>24 KB</div>
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
                                      <th key={col} style={{ padding: "8px 12px", color: "rgba(255,255,255,0.65)", fontSize: 11, textTransform: "uppercase" as const, textAlign: "left" as const, fontWeight: 600, letterSpacing: "0.04em" }}>{col}</th>
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

                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>5 clientes detectados — 0 duplicados encontrados</div>

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
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center" }}>5 clientes agregados correctamente</div>
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
                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 }}>Revisá y unificá los registros</div>
                      </div>

                      {dupResolved.every(Boolean) ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 40 }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>Todo resuelto</div>
                          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>No hay más duplicados pendientes</div>
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
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{c.company}</div>
                                  </div>
                                </div>
                                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{c.email}</div>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{c.phone}</div>
                                </div>
                              </div>
                            )
                            return (
                              <div key={gi} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>Posible duplicado</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  {card(group.a)}
                                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, flexShrink: 0 }}>vs</span>
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
                      const visibleClients = crmClients.filter((c) =>
                        (crmTempFilter === "Todos" || c.temp === crmTempFilter) &&
                        c.lat != null &&
                        c.lng != null
                      )
                      const countByTemp = (t: string) => crmClients.filter((c) => c.temp === t).length
                      const selectedClient = mapPinHover != null
                        ? visibleClients.find((c) => c.id === mapPinHover) ?? null
                        : null

                      return (
                        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                          <div style={{ flex: 1, position: "relative", background: "#0a0f1a", overflow: "hidden" }}>
                            {/* Temperature filter pills */}
                            <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", flexWrap: "wrap", gap: 8, zIndex: 2, pointerEvents: "auto" }}>
                              {(["Todos", "Caliente 🔴", "Tibio 🟡", "Frío 🔵"] as const).map((label) => {
                                const key = label.split(" ")[0] as Temp
                                const selected = crmTempFilter === key
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => { setCrmTempFilter(key); setMapPinHover(null) }}
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: 20,
                                      fontSize: 12,
                                      border: "none",
                                      cursor: "pointer",
                                      background: selected ? "rgba(37,99,235,0.2)" : "rgba(10,10,20,0.8)",
                                      color: selected ? "#2563EB" : "rgba(255,255,255,0.5)",
                                      backdropFilter: "blur(8px)",
                                      WebkitBackdropFilter: "blur(8px)",
                                    }}
                                  >
                                    {label}
                                  </button>
                                )
                              })}
                            </div>

                            <Map
                              style={{ width: "100%", height: "100%" }}
                              mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
                              defaultCenter={{ lat: -32.5228, lng: -55.7658 }}
                              defaultZoom={6}
                              styles={CRM_MAP_DARK_STYLES}
                              disableDefaultUI
                              gestureHandling="greedy"
                              onClick={() => setMapPinHover(null)}
                            >
                              {visibleClients.map((client) => {
                                const pin = CRM_MAP_PIN_STYLES[client.temp]
                                const initials = getInitials(client.name)
                                const selected = mapPinHover === client.id
                                return (
                                  <AdvancedMarker
                                    key={client.id}
                                    position={{ lat: client.lat!, lng: client.lng! }}
                                    onClick={(e) => {
                                      e.domEvent?.stopPropagation()
                                      setMapPinHover(client.id)
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        background: pin.background,
                                        border: `2px solid ${pin.border}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        transform: selected ? "scale(1.1)" : "scale(1)",
                                        transition: "transform 0.15s",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                                      }}
                                    >
                                      <span style={{ color: "#ffffff", fontSize: 11, fontWeight: 500 }}>{initials}</span>
                                    </div>
                                  </AdvancedMarker>
                                )
                              })}

                              {selectedClient && (
                                <InfoWindow
                                  position={{ lat: selectedClient.lat!, lng: selectedClient.lng! }}
                                  onCloseClick={() => setMapPinHover(null)}
                                  pixelOffset={[0, -44]}
                                >
                                  <div style={{ background: "rgba(10,10,20,0.95)", borderRadius: 8, padding: "10px 12px", minWidth: 180 }}>
                                    <div style={{ color: "#ffffff", fontSize: 13, fontWeight: 500 }}>{selectedClient.name}</div>
                                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{
                                        background: TEMP_STYLES[selectedClient.temp].bg,
                                        color: TEMP_STYLES[selectedClient.temp].color,
                                        fontSize: 11,
                                        borderRadius: 4,
                                        padding: "2px 8px",
                                      }}>
                                        {selectedClient.temp}
                                      </span>
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 8 }}>
                                      Último contacto: {selectedClient.lastContact}
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 4 }}>
                                      Ticket promedio: {selectedClient.ticket}
                                    </div>
                                  </div>
                                </InfoWindow>
                              )}

                              <CrmMapZoomControls />
                            </Map>

                            {/* Bottom-left legend overlay */}
                            <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(10,10,20,0.8)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", zIndex: 2, pointerEvents: "none" }}>
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>Clientes en el mapa</div>
                              {[
                                { color: "#ef4444", label: `Caliente (${countByTemp("Caliente")})` },
                                { color: "#eab308", label: `Tibio (${countByTemp("Tibio")})` },
                                { color: "#60a5fa", label: `Frío (${countByTemp("Frío")})` },
                              ].map(({ color, label }) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </APIProvider>
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
                        <div style={{ marginTop: 20, marginBottom: 6, color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Temperatura</div>
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
                        <div style={{ marginTop: 20, marginBottom: 8, color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Etiquetas</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {["Cliente VIP", "Distribuidor", "Nuevo"].map((tag) => (
                            <button key={tag} style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", borderRadius: 20, padding: "4px 10px", fontSize: 11, border: "none", cursor: "pointer" }}>{tag}</button>
                          ))}
                        </div>
                        <div style={{ marginTop: 20, marginBottom: 8, color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Vista</div>
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
                            <div>
                              <span style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Clientes</span>
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>{`${realClients.length} clientes`}</div>
                            </div>
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
                            <button
                              type="button"
                              onClick={() => fetchClients()}
                              title="Actualizar"
                              style={{ padding: "7px 10px", fontSize: 13, background: "none", color: "rgba(255,255,255,0.4)", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                            >
                              <RefreshCw size={16} />
                            </button>
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
                          {crmLoading && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '32px',
                              color: 'rgba(255,255,255,0.6)',
                              fontSize: '13px',
                              gap: '8px',
                            }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(37,99,235,0.3)',
                                borderTop: '2px solid #2563EB',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                              }} />
                              Cargando clientes...
                            </div>
                          )}
                          {(() => {
                            const filtered = realClients
                              .filter((c) => crmTempFilter === "Todos" || c.temp === crmTempFilter)
                              .filter((c) => { const q = crmSearch.toLowerCase(); return !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) })

                            // ── RANKING VIEW ──
                            if (crmListMode === "Ranking") {
                              const ticketVal = (t: string) => parseFloat(t.replace(/[$.,]/g, "")) || 0
                              const sorted = [...filtered].sort((a, b) => ticketVal(b.ticket) - ticketVal(a.ticket))
                              const maxTicket = ticketVal(sorted[0]?.ticket ?? "$0")
                              const posColor = (i: number) => i === 0 ? "#2563EB" : i === 1 ? "rgba(255,255,255,0.8)" : i === 2 ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.5)"
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
                                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.company}</div>
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
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.company}</div>
                                  </div>
                                  <div style={{ background: ts.bg, color: ts.color, fontSize: 11, padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>{client.temp}</div>
                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, flexShrink: 0, width: 90, textAlign: "right" }}>{client.lastContact}</div>
                                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, flexShrink: 0, width: 70, textAlign: "right" }}>{client.ticket}</div>
                                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{client.seller}</div>
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
                                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{company}</span>
                                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>({clients.length} {clients.length === 1 ? "cliente" : "clientes"})</span>
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
                  type OppCard = { id: string; name: string; company: string; amount: string; seller: string; close: string; prob: number; stage: Stage; won?: boolean }
                  const DEFAULT_OPPS: OppCard[] = [
                    { id: "o1", name: "Luis Herrera",    company: "Grupo Herrera SA",    amount: "$28.500", seller: "CA", close: "Cierre en 12 días", prob: 30,  stage: "Prospecto"   },
                    { id: "o2", name: "Valentina Cruz",  company: "Sin empresa",          amount: "$1.200",  seller: "MR", close: "Cierre en 20 días", prob: 20,  stage: "Prospecto"   },
                    { id: "o3", name: "Sofía Martínez",  company: "Retail Express",       amount: "$8.900",  seller: "JP", close: "Cierre en 7 días",  prob: 60,  stage: "Propuesta"   },
                    { id: "o4", name: "Carlos Mendoza",  company: "Tech Solutions",       amount: "$18.500", seller: "JP", close: "Cierre en 3 días",  prob: 80,  stage: "Negociación" },
                    { id: "o5", name: "Martín Pérez",    company: "Constructora MP",      amount: "$9.350",  seller: "JP", close: "Cierre en 5 días",  prob: 75,  stage: "Negociación" },
                    { id: "o6", name: "María González",  company: "Distribuidora Norte",  amount: "$4.200",  seller: "MR", close: "Cerrado hoy",        prob: 100, stage: "Cerrado", won: true },
                  ]
                  const OPPS = DEFAULT_OPPS
                  const kanbanOpps: OppCard[] = realOpportunities.length > 0
                    ? realOpportunities.map((o) => ({
                        id: String(o.id),
                        name: o.client,
                        company: o.company,
                        amount: `$${Number(o.amount || 0).toLocaleString()}`,
                        seller: o.seller,
                        close: o.stage === 'Cerrado'
                          ? 'Cerrado hoy'
                          : o.daysToClose === 0
                          ? 'Cierre hoy'
                          : `Cierre en ${o.daysToClose} días`,
                        prob: o.probability,
                        stage: o.stage as Stage,
                        won: o.stage === 'Cerrado',
                      }))
                    : DEFAULT_OPPS
                  const prospectOpps = kanbanOpps.filter(o => o.stage === 'Prospecto')
                  const proposalOpps = kanbanOpps.filter(o => o.stage === 'Propuesta')
                  const negotiationOpps = kanbanOpps.filter(o => o.stage === 'Negociación')
                  const closedOpps = kanbanOpps.filter(o => o.stage === 'Cerrado')
                  const totalPipeline = realOpportunities
                    .filter(o => o.stage !== 'Cerrado')
                    .reduce((sum, o) => sum + (o.amount || 0), 0)
                  const activeOpps = realOpportunities
                    .filter(o => o.stage !== 'Cerrado').length
                  const headerActiveOpps = realOpportunities.length > 0
                    ? activeOpps
                    : kanbanOpps.filter(o => o.stage !== 'Cerrado').length
                  const headerTotalPipeline = realOpportunities.length > 0
                    ? totalPipeline
                    : kanbanOpps
                      .filter(o => o.stage !== 'Cerrado')
                      .reduce((sum, o) => sum + parseFloat(o.amount.replace(/[$.,]/g, "")), 0)
                  const stages: Stage[] = ["Prospecto", "Propuesta", "Negociación", "Cerrado"]
                  const byStage = (s: Stage) => kanbanOpps.filter(o => o.stage === s)
                  const stageTotal = (s: Stage) => {
                    const sum = byStage(s).reduce((acc, o) => acc + parseFloat(o.amount.replace(/[$.,]/g, "")), 0)
                    return "$" + sum.toLocaleString("es-AR")
                  }

                  const forecastOpps = realOpportunities.length > 0
                    ? realOpportunities
                    : DEFAULT_OPPS.map((o) => ({
                        id: o.id,
                        client: o.name,
                        company: o.company,
                        amount: parseFloat(o.amount.replace(/[$.,]/g, "")),
                        stage: o.stage,
                        probability: o.prob,
                        daysToClose: 0,
                        seller: o.seller,
                      }))
                  const weightedOppValue = (o: { amount?: number; probability?: number }) =>
                    (o.amount || 0) * ((o.probability || 0) / 100)
                  const activeForecastOpps = forecastOpps.filter(
                    (o) => o.stage !== 'Cerrado' && o.stage !== 'Perdido'
                  )
                  const closedForecastOpps = forecastOpps.filter(
                    (o) => o.stage === 'Cerrado'
                  )
                  const weightedForecast = activeForecastOpps.reduce(
                    (sum, o) => sum + weightedOppValue(o), 0
                  )
                  const bestScenario = activeForecastOpps.reduce(
                    (sum, o) => sum + (o.amount || 0), 0
                  )
                  const worstScenario = forecastOpps
                    .filter((o) => o.stage === 'Negociación')
                    .reduce((sum, o) => sum + weightedOppValue(o), 0)
                  const closedWonAmount = closedForecastOpps.reduce(
                    (sum, o) => sum + (o.amount || 0), 0
                  )
                  const forecastProgress = (weightedForecast + closedWonAmount) > 0
                    ? Math.min(100, Math.round(
                        (closedWonAmount / (weightedForecast + closedWonAmount)) * 100
                      ))
                    : 0
                  const stageWeightedForecast = (stage: Stage) =>
                    forecastOpps
                      .filter((o) => o.stage === stage)
                      .reduce((sum, o) => sum + weightedOppValue(o), 0)
                  const fmtForecast = (n: number) =>
                    `$${Math.round(n).toLocaleString()}`

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
                    const stageColor = STAGE_BADGE_COLOR[opp.stage] ?? "rgba(255,255,255,0.6)"
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
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>{opp.company}</div>
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
                              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", paddingTop: 1 }}>{label}</span>
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
                                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</span>
                              </div>
                              <div style={{ color: valueColor, fontSize: 13, fontWeight: 500 }}>{value}</div>
                              {sub && <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 3 }}>{sub}</div>}
                            </div>
                          ))}

                          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />

                          {/* Move stage */}
                          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Mover a</div>
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
                                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>{step.desc}</div>
                                      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 3 }}>{step.date}</div>
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
                                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{act.date}</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 4 }}>Enviada hace 8 días</div>
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
                    const labelStyle: React.CSSProperties = { color: "rgba(255,255,255,0.7)", fontSize: 11, marginBottom: 6, display: "block" }
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
                                  <span style={{ color: newOppClient ? "white" : "rgba(255,255,255,0.55)" }}>{newOppClient || "Seleccionar cliente..."}</span>
                                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>▾</span>
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
                                            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10 }}>{c.company}</div>
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
                                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>$</span>
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
                          <button onClick={saveNewOpportunity} style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Crear oportunidad</button>
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
                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4, marginBottom: 24 }}>Requieren atención inmediata</div>
                        {RISK_OPPS.map((r, i) => {
                          const sc = STAGE_BADGE_COLOR[r.stage] ?? "rgba(255,255,255,0.3)"
                          const sb = STAGE_BADGE_BG[r.stage] ?? "rgba(255,255,255,0.06)"
                          return (
                            <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderLeft: "3px solid #ef4444", borderTop: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 10px 10px 0", padding: "16px 20px", marginBottom: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                  <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{r.name}</div>
                                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>{r.company}</div>
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
                          {ventasLoading && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '32px',
                              color: 'rgba(255,255,255,0.6)',
                              fontSize: '13px',
                              gap: '8px',
                            }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(37,99,235,0.3)',
                                borderTop: '2px solid #2563EB',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                              }} />
                              Cargando pronóstico...
                            </div>
                          )}

                          {/* Summary cards */}
                          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Pronóstico este mes</div>
                              <div style={{ color: "white", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{fmtForecast(weightedForecast)}</div>
                              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${forecastProgress}%`, background: "rgba(37,99,235,0.6)", borderRadius: 2 }} />
                              </div>
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 6 }}>{forecastProgress}% alcanzado</div>
                            </div>
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Mejor escenario</div>
                              <div style={{ color: "#22c55e", fontSize: 20, fontWeight: 600, marginBottom: 6 }}>{fmtForecast(bestScenario)}</div>
                              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Si cierran todas las oportunidades activas</div>
                            </div>
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Peor escenario</div>
                              <div style={{ color: "#ef4444", fontSize: 20, fontWeight: 600, marginBottom: 6 }}>{fmtForecast(worstScenario)}</div>
                              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Solo oportunidades en negociación</div>
                            </div>
                          </div>

                          {/* Weighted forecast by stage */}
                          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                            {([
                              { label: "Prospecto", value: stageWeightedForecast("Prospecto"), color: STAGE_COLOR.Prospecto },
                              { label: "Propuesta", value: stageWeightedForecast("Propuesta"), color: STAGE_COLOR.Propuesta },
                              { label: "Negociación", value: stageWeightedForecast("Negociación"), color: STAGE_COLOR["Negociación"] },
                              { label: "Cerrado", value: closedWonAmount, color: STAGE_COLOR.Cerrado },
                            ] as const).map(({ label, value, color }) => (
                              <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6, borderTop: `2px solid ${color}`, paddingTop: 8 }}>{label}</div>
                                <div style={{ color: "white", fontSize: 16, fontWeight: 500 }}>{fmtForecast(value)}</div>
                                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 4 }}>
                                  {label === "Cerrado" ? "Ventas cerradas" : "Monto × probabilidad"}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Monthly chart */}
                          <div style={{ marginBottom: 24 }}>
                            <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Evolución mensual</div>
                            {(() => {
                              const forecastMonthK = Math.round(weightedForecast / 1000)
                              const months = [
                                { label: "Ene", real: 28, pron: 30, forecast: false },
                                { label: "Feb", real: 35, pron: 32, forecast: false },
                                { label: "Mar", real: 31, pron: 35, forecast: false },
                                { label: "Abr", real: 42, pron: 38, forecast: false },
                                { label: "May", real: 38, pron: 40, forecast: false },
                                { label: "Jun", real: Math.round(closedWonAmount / 1000), pron: forecastMonthK, forecast: true },
                              ]
                              const maxVal = Math.max(60, ...months.map((m) => Math.max(m.real, m.pron)))
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
                                        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 4 }}>{m.label}</div>
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <div style={{ width: 10, height: 10, background: "rgba(37,99,235,0.5)", borderRadius: 2 }} />
                                      <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>Real</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <div style={{ width: 10, height: 10, background: "transparent", border: "1px solid rgba(37,99,235,0.4)", borderRadius: 2 }} />
                                      <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>Pronóstico</span>
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
                                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{rec.reason}</div>
                                  <button style={{ background: "none", border: "none", color: "#2563EB", fontSize: 11, cursor: "pointer", padding: 0, marginTop: 8 }}>Aplicar →</button>
                                </div>
                              </div>
                            ))}
                            {/* Retargeting section */}
                            <div style={{ marginTop: 24 }}>
                              <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>✦ Retargeting interno</div>
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 16 }}>Clientes que compraron antes y están fuera de su ciclo habitual</div>
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
                                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{r.company}</div>
                                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 4 }}>Último pedido hace {r.last} · Ciclo promedio: {r.cycle}</div>
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
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>Mayo 2026</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button onClick={() => setShowCommModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                                </svg>
                                Configurar comisiones
                              </button>
                              <button style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.4)", borderRadius: 6, padding: "4px 8px", fontSize: 13, cursor: "pointer" }}>←</button>
                              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Mayo 2026</span>
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
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 8 }}>Tipo de comisión</div>
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
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>{opt.desc}</div>
                                    </div>
                                  </div>
                                ))}

                                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0" }} />

                                {/* Section 2a — Porcentaje por vendedor */}
                                {commType === 0 && (
                                  <div>
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 12 }}>Comisión por vendedor</div>
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
                                          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>%</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Section 2b — Tramos */}
                                {commType === 1 && (
                                  <div>
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 12 }}>Tramos</div>
                                    {[["Hasta $10.000", "6"], ["Hasta $30.000", "8"], ["Más de $30.000", "10"]].map(([label, pct], i) => (
                                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                        <input defaultValue={label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "white", fontSize: 12, outline: "none" }} />
                                        <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>→</span>
                                        <input defaultValue={pct} type="number" style={{ width: 56, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "white", fontSize: 13, textAlign: "right" as const, outline: "none" }} />
                                        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>%</span>
                                      </div>
                                    ))}
                                    <button style={{ background: "none", border: "none", color: "#2563EB", fontSize: 11, cursor: "pointer", padding: 0, marginTop: 4 }}>+ Agregar tramo</button>
                                  </div>
                                )}

                                {/* Section 2c — Monto fijo */}
                                {commType === 2 && (
                                  <div>
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 12 }}>Monto fijo por venta</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>$</span>
                                      <input type="number" defaultValue="500" style={{ width: 120, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "white", fontSize: 13, outline: "none" }} />
                                    </div>
                                  </div>
                                )}

                                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0" }} />

                                {/* Section 3 — Periodicidad */}
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 8 }}>Pago de comisiones</div>
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
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
                                <div style={{ color: valueColor, fontSize: valueSize, fontWeight: 500, marginBottom: 6 }}>{value}</div>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{sub}</div>
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
                                    <div key={col} style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{col}</div>
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
                                        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{seller.tasa}</div>
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
                                                <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{amount}</span>
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
                                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{text}</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 20, marginTop: 2 }}>Mayo 2026</div>

                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Tipo de meta</div>
                                  {[["Por monto vendido — $", 0], ["Por cantidad de ventas — unidades", 1]].map(([label, val]) => (
                                    <div key={val} onClick={() => setGoalsType(val as 0 | 1)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: `1px solid ${goalsType === val ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`, background: goalsType === val ? "rgba(37,99,235,0.1)" : "rgba(255,255,255,0.02)", cursor: "pointer", marginBottom: 8, transition: "all 0.15s" }}>
                                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${goalsType === val ? "#2563EB" : "rgba(255,255,255,0.2)"}`, background: goalsType === val ? "#2563EB" : "transparent", transition: "all 0.15s" }} />
                                      <span style={{ color: goalsType === val ? "white" : "rgba(255,255,255,0.8)", fontSize: 13 }}>{label}</span>
                                    </div>
                                  ))}

                                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>Meta por vendedor</div>
                                  {SELLERS.map(s => {
                                    const goalVal = parseInt(goalRates[s.key]?.replace(/\D/g,"") || "50000")
                                    const pct = Math.round((s.montoNum / goalVal) * 100)
                                    return (
                                      <div key={s.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", fontSize: 11, fontWeight: 700 }}>{s.key}</div>
                                          <div>
                                            <div style={{ color: "white", fontSize: 13 }}>{s.name}</div>
                                            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Progreso actual: {s.monto} ({pct}%)</div>
                                          </div>
                                        </div>
                                        <div style={{ position: "relative" as const, width: 110 }}>
                                          {goalsType === 0 && <span style={{ position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 13, pointerEvents: "none" }}>$</span>}
                                          <input type="text" value={goalRates[s.key] || ""} onChange={e => setGoalRates(p => ({ ...p, [s.key]: e.target.value }))}
                                            style={{ width: "100%", padding: goalsType === 0 ? "7px 8px 7px 22px" : "7px 50px 7px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
                                          {goalsType === 1 && <span style={{ position: "absolute" as const, right: 8, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.6)", fontSize: 11, pointerEvents: "none" }}>ventas</span>}
                                        </div>
                                      </div>
                                    )
                                  })}

                                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Meta global del equipo</div>
                                  <div style={{ marginBottom: 4 }}>
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 5 }}>Meta total del equipo</div>
                                    <div style={{ position: "relative" as const }}>
                                      <span style={{ position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 13, pointerEvents: "none" }}>$</span>
                                      <input type="text" value={goalTeam} onChange={e => setGoalTeam(e.target.value)}
                                        style={{ width: "100%", padding: "8px 8px 8px 22px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
                                    </div>
                                  </div>
                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 4 }}>Suma de metas individuales: ${sumIndividual.toLocaleString("es-AR")}</div>

                                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Alertas</div>
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
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 3 }}>Mayo 2026 · 3 vendedores activos</div>
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
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>Mayo 2026</div>
                              </div>
                              <div style={{ flex: 1, maxWidth: 300 }}>
                                <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                                  <div style={{ width: `${Math.min(teamPct, 100)}%`, height: "100%", background: "#2563EB", borderRadius: 4 }} />
                                </div>
                                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{fmtNum(totalActual)} de {fmtNum(teamGoalNum)}</div>
                              </div>
                              <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                                <div style={{ color: "white", fontSize: 28, fontWeight: 600 }}>{teamPct}%</div>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>alcanzado</div>
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
                                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>{s.ventas} ventas este mes</div>
                                      </div>
                                    </div>
                                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
                                    {[["MONTO TOTAL", s.monto],["TASA DE CIERRE", s.cierre],["TICKET PROMEDIO", s.ticket],["TIEMPO CIERRE", s.tiempo]].map(([k, v]) => (
                                      <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{k}</span>
                                        <span style={{ color: "white", fontSize: 12, fontWeight: 500 }}>{v}</span>
                                      </div>
                                    ))}
                                    <div style={{ marginTop: 4 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>META MENSUAL</span>
                                        <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 10 }}>{s.monto} / {fmtNum(goalVal)}</span>
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
                                    <span key={h} style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{h}</span>
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
                                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{p.body}</div>
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
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 3 }}>Historial y análisis</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 6 }}>{c.label}</div>
                                  <div style={{ color: "white", fontSize: 16, fontWeight: 500 }}>{c.value}</div>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 4 }}>{c.sub}</div>
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
                                    <span key={h} style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{h}</span>
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
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{p.cat}</div>
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
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 16 }}>Basado en historial de compras</div>
                              {COMBOS.map(c => (
                                <div key={c.a.name + c.b.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
                                  <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.a.dot }} />
                                      <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{c.a.name}</span>
                                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>+</span>
                                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.b.dot }} />
                                      <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{c.b.name}</span>
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 4 }}>Se compran juntos en el {c.pct} de los casos</div>
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
                                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{r.body}</div>
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
                            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 3 }}>{`${headerActiveOpps} oportunidades activas · $${headerTotalPipeline.toLocaleString()} en juego`}</div>
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
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => fetchOpportunities()}
                            title="Actualizar"
                            style={{ padding: "7px 10px", fontSize: 13, background: "none", color: "rgba(255,255,255,0.4)", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button onClick={() => setVentasView("new")} style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer" }}>Nueva oportunidad +</button>
                        </div>
                      </div>

                      {ventasLoading && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '32px',
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '13px',
                          gap: '8px',
                        }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(37,99,235,0.3)',
                            borderTop: '2px solid #2563EB',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                          }} />
                          Cargando oportunidades...
                        </div>
                      )}

                      {/* Stats row */}
                      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexShrink: 0 }}>
                        {[
                          { label: "Este mes",       value: "$28.500", sub: "↑ 12% vs mes anterior",  subColor: "#22c55e" },
                          { label: "Tasa de cierre", value: "68%",     sub: "↑ 5% vs mes anterior",   subColor: "#22c55e" },
                          { label: "Ticket promedio",value: "$9.240",  sub: "→ Sin cambios",           subColor: "rgba(255,255,255,0.35)" },
                          { label: "Tiempo de cierre",value: "18 días",sub: "↓ 3 días menos",         subColor: "#22c55e" },
                        ].map(({ label, value, sub, subColor }) => (
                          <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
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
                        const posColor = (p: number) => p === 1 ? "#2563EB" : p === 2 ? "rgba(255,255,255,0.6)" : p === 3 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)"
                        const probColor = (p: number) => p >= 75 ? "#22c55e" : p >= 50 ? "#eab308" : "#ef4444"
                        const scoreColor = (s: number) => s >= 90 ? "#22c55e" : s >= 70 ? "#2563EB" : s >= 50 ? "#eab308" : "#ef4444"
                        const STAGE_COLOR_MAP: Record<string, string> = { "Negociación": "#22c55e", "Propuesta": "#2563EB", "Prospecto": "#eab308", "Cerrado": "rgba(255,255,255,0.2)" }
                        return (
                          <div style={{ flex: 1, overflowY: "auto" }}>
                            {/* Ranking header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                              <div>
                                <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>Oportunidades por prioridad</div>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 3 }}>Ordenadas por IA según probabilidad, urgencia y valor</div>
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
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.company}</div>
                                    <span style={{ background: `${STAGE_COLOR_MAP[r.stage]}20`, color: STAGE_COLOR_MAP[r.stage], border: `1px solid ${STAGE_COLOR_MAP[r.stage]}40`, borderRadius: 4, padding: "1px 6px", fontSize: 10, marginTop: 2, display: "inline-block" }}>{r.stage}</span>
                                  </div>
                                </div>
                                {/* Amount */}
                                <div>
                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 3 }}>Monto</div>
                                  <div style={{ color: "white", fontSize: 14, fontWeight: 600 }}>{r.amount}</div>
                                </div>
                                {/* Probability */}
                                <div>
                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 3 }}>Prob. cierre</div>
                                  <div style={{ color: probColor(r.prob), fontSize: 14, fontWeight: 600 }}>{r.prob}%</div>
                                </div>
                                {/* Closing date */}
                                <div>
                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 3 }}>Cierre estimado</div>
                                  <div style={{ color: r.days < 5 ? "#ef4444" : "white", fontSize: 13, fontWeight: 500 }}>En {r.days} días</div>
                                </div>
                                {/* AI priority bar */}
                                <div>
                                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
                                    <div style={{ width: `${r.score}%`, height: "100%", background: scoreColor(r.score), borderRadius: 3 }} />
                                  </div>
                                  <div style={{ color: scoreColor(r.score), fontSize: 11, fontWeight: 500 }}>{r.score}/100</div>
                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Prioridad Pupi</div>
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
                                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 4 }}>{label}</div>
                                    </div>
                                    {i < arr.length - 1 && <div style={{ width: 1, background: "rgba(255,255,255,0.06)", margin: "0 8px", alignSelf: "stretch" }} />}
                                  </div>
                                ))}
                              </div>
                              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textAlign: "center" as const, marginTop: 12 }}>La prioridad se recalcula automáticamente cada 24 horas</div>
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
                                    <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{cards.length}</span>
                                  </div>
                                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{stageTotal(stage)}</span>
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
                                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>{opp.company}</div>
                                        <div style={{ color: "white", fontSize: 15, fontWeight: 500, marginTop: 10 }}>{opp.amount}</div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ color: "#2563EB", fontSize: 9, fontWeight: 600 }}>{opp.seller}</span>
                                          </div>
                                          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>{opp.close}</span>
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
                          {/* SVG Funnel */}
                          <div style={{ padding: "24px 32px 0" }}>
                            <svg viewBox="0 0 680 270" style={{ width: "100%", height: "auto", overflow: "visible" }}>
                              <defs>
                                <linearGradient id="efg0" x1="0" x2="1" y1="0" y2="0">
                                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.85" />
                                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.45" />
                                </linearGradient>
                                <linearGradient id="efg1" x1="0" x2="1" y1="0" y2="0">
                                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.85" />
                                  <stop offset="100%" stopColor="#eab308" stopOpacity="0.45" />
                                </linearGradient>
                                <linearGradient id="efg2" x1="0" x2="1" y1="0" y2="0">
                                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
                                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.45" />
                                </linearGradient>
                                <linearGradient id="efg3" x1="0" x2="1" y1="0" y2="0">
                                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.85" />
                                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.45" />
                                </linearGradient>
                              </defs>
                              {([
                                { d: "M 0 42 L 164 60 L 164 190 L 0 208 Z",       grad: "efg0", color: "#6366f1", label: "Prospecto",   total: "$29.700", count: "2 oportunidades", cx: 82,  pct: "100%" },
                                { d: "M 172 60 L 336 77 L 336 173 L 172 190 Z",   grad: "efg1", color: "#eab308", label: "Propuesta",   total: "$8.900",  count: "1 oportunidad",   cx: 254, pct: "78%"  },
                                { d: "M 344 77 L 508 94 L 508 156 L 344 173 Z",   grad: "efg2", color: "#f97316", label: "Negociación", total: "$27.850", count: "2 oportunidades", cx: 426, pct: "58%"  },
                                { d: "M 516 94 L 680 107 L 680 143 L 516 156 Z",  grad: "efg3", color: "#22c55e", label: "Cerrado",     total: "$4.200",  count: "1 oportunidad",   cx: 598, pct: "38%"  },
                              ] as { d: string; grad: string; color: string; label: string; total: string; count: string; cx: number; pct: string }[]).map((seg) => (
                                <g key={seg.label}>
                                  <path d={seg.d} fill={seg.color} opacity={0.08} />
                                  <path d={seg.d} fill={`url(#${seg.grad})`} opacity={0.8} />
                                  <text x={seg.cx} y={22} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="inherit">{seg.label}</text>
                                  <text x={seg.cx} y={37} textAnchor="middle" fill={seg.color} fontSize="10" fontFamily="inherit" opacity={0.9}>{seg.pct}</text>
                                  <text x={seg.cx} y={129} textAnchor="middle" fill="white" fontSize="13" fontWeight="600" fontFamily="inherit">{seg.total}</text>
                                  <text x={seg.cx} y={228} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="inherit">{seg.count}</text>
                                </g>
                              ))}
                            </svg>
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
                  type CampStatus = "Activa" | "Pausada" | "Finalizada" | "Borrador"
                  type CampChannel = "Email" | "Redes sociales" | "Google Ads" | "WhatsApp" | "Evento" | "Otro"
                  const formatCampDate = (startDate: string | null) => {
                    if (!startDate) return 'Sin fecha'
                    const d = new Date(startDate)
                    const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
                    return months[d.getMonth()] + " " + d.getFullYear()
                  }
                  const formatRoi = (roi: number) => {
                    if (roi > 0) return { roi: `↑ ${Math.round(roi)}%`, roiDir: "up" as const }
                    if (roi < 0) return { roi: `↓ ${Math.abs(Math.round(roi))}%`, roiDir: "down" as const }
                    return { roi: "→", roiDir: "flat" as const }
                  }
                  const mapCampaign = (c: typeof realCampaigns[0]) => {
                    const roiVal = Number(c.metrics?.roi) || 0
                    const { roi, roiDir } = formatRoi(roiVal)
                    return {
                      id: c.id,
                      name: c.name,
                      channel: c.channel as CampChannel,
                      date: formatCampDate(c.startDate),
                      status: c.status as CampStatus,
                      roi,
                      roiDir,
                      budget: c.displayBudget,
                    }
                  }
                  const CAMPAIGNS: { id: string; name: string; channel: CampChannel; date: string; status: CampStatus; roi: string; roiDir: "up" | "down" | "flat"; budget: string }[] = [
                    ...mktLocalCampaigns,
                    ...realCampaigns.map(mapCampaign),
                  ]
                  const activeCampaignCount = realCampaigns
                    .filter(c => c.status === 'Activa').length
                  const avgROI = realCampaigns.length > 0
                    ? realCampaigns.reduce((sum, c) => {
                        const roi = c.metrics?.roi || 0
                        return sum + Number(roi)
                      }, 0) / realCampaigns.length
                    : 0
                  const bestChannel = realCampaigns.length > 0
                    ? [...realCampaigns].sort((a, b) =>
                        (Number(b.metrics?.roi) || 0) -
                        (Number(a.metrics?.roi) || 0)
                      )[0]?.channel || 'Email'
                    : 'Email'
                  const avgCostPerClient = realCampaigns.length > 0
                    ? realCampaigns.reduce((sum, c) =>
                        sum + (Number(c.metrics?.cost_per_client) || 0), 0
                      ) / realCampaigns.length
                    : 0
                  const researchInProgress = realResearch
                    .filter(r => r.status === 'En proceso').length
                  const CHANNEL_ICON: Record<CampChannel, { bg: string; color: string; icon: React.ReactNode }> = {
                    "Email":          { bg: "rgba(37,99,235,0.2)",   color: "#2563EB", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                    "Redes sociales": { bg: "rgba(168,85,247,0.2)",  color: "#a855f7", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
                    "Google Ads":     { bg: "rgba(234,179,8,0.2)",   color: "#eab308", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
                    "WhatsApp":       { bg: "rgba(34,197,94,0.2)",   color: "#22c55e", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                    "Evento":         { bg: "rgba(249,115,22,0.2)",  color: "#f97316", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                    "Otro":           { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg> },
                  }
                  const STATUS_STYLE: Record<CampStatus, { bg: string; color: string; border: string }> = {
                    Activa:     { bg: "rgba(34,197,94,0.1)",  color: "#22c55e", border: "rgba(34,197,94,0.2)"  },
                    Pausada:    { bg: "rgba(234,179,8,0.1)",  color: "#eab308", border: "rgba(234,179,8,0.2)"  },
                    Finalizada: { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.1)" },
                    Borrador:   { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.1)" },
                  }
                  const ROI_COLOR: Record<string, string> = { up: "#22c55e", down: "#ef4444", flat: "rgba(255,255,255,0.4)" }
                  const filterLabel: React.CSSProperties = { color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em" }
                  const filteredCampaigns = CAMPAIGNS
                    .filter(c => mktStatusFilter === "Todas" || c.status === mktStatusFilter.replace(/\s.*/, ""))
                    .filter(c => mktChannelFilter === "Todos" || c.channel === mktChannelFilter)
                    .filter(c => !mktSearch || c.name.toLowerCase().includes(mktSearch.toLowerCase()))

                  // ── NEW CAMPAIGN FORM VIEW ──
                  if (mktView === "new") {
                    const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" }
                    const labelStyle: React.CSSProperties = { color: "rgba(255,255,255,0.7)", fontSize: 11, marginBottom: 5, display: "block", textTransform: "uppercase" as const, letterSpacing: "0.04em" }
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
                      handleSaveNewCampaign()
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
                                  <span style={{ position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 13, pointerEvents: "none" }}>$</span>
                                  <input type="number" value={newCampBudget} onChange={e => setNewCampBudget(e.target.value)} placeholder="0" style={{ ...inputStyle, paddingLeft: 24 }} />
                                </div>
                              </div>

                              {/* Fechas */}
                              <div>
                                <label style={labelStyle}>Período</label>
                                <div style={{ display: "flex", gap: 12 }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 4 }}>Inicio</div>
                                    <input type="date" value={newCampStart} onChange={e => setNewCampStart(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 4 }}>Fin</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>{newCampSubject.length}/60 caracteres</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8 }}>Arrastrá imágenes o archivos</div>
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
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{m.label}</div>
                                    <div style={{ position: "relative" as const }}>
                                      <input type="number" value={m.val} onChange={e => m.set(e.target.value)} placeholder={m.placeholder} style={{ ...inputStyle, paddingRight: m.suffix === "ventas" ? 48 : 28 }} />
                                      <span style={{ position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.6)", fontSize: 11, pointerEvents: "none" }}>{m.suffix}</span>
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
                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 4 }}>{label}</div>
                        <div style={{ color, fontSize: 20, fontWeight: 700 }}>{value}</div>
                        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 2 }}>{sub}</div>
                      </div>
                    )
                    const aiCard = (icon: string, label: string, value: string, valueColor: string, sub: string) => (
                      <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</div>
                          <div style={{ color: valueColor, fontSize: 16, fontWeight: 700, marginTop: 1 }}>{value}</div>
                          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>{sub}</div>
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
                                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{k}</span>
                                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 500 }}>{v}</span>
                              </div>
                            ))}
                          </div>

                          {/* Budget progress */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>Presupuesto ejecutado</span>
                              <span style={{ color: "white", fontSize: 11, fontWeight: 600 }}>65%</span>
                            </div>
                            <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: "65%", height: "100%", background: "linear-gradient(90deg, #2563EB, #60a5fa)", borderRadius: 3 }} />
                            </div>
                          </div>

                          {/* AI cards */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Análisis IA</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 12, display: "flex", gap: 16 }}>
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
                                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 14 }}>Embudo de conversión</div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {funnel.map((f, i) => {
                                      const colors = ["#2563EB","#3b82f6","#60a5fa","#22c55e"]
                                      return (
                                        <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                          <div style={{ width: 90, color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "right" as const, flexShrink: 0 }}>{f.label}</div>
                                          <div style={{ flex: 1, height: 20, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                                            <div style={{ width: `${f.pct}%`, height: "100%", background: colors[i], borderRadius: 4, minWidth: 4 }} />
                                          </div>
                                          <div style={{ width: 56, color: "white", fontSize: 12, fontWeight: 600, textAlign: "right" as const, flexShrink: 0 }}>{f.val.toLocaleString()}</div>
                                          <div style={{ width: 36, color: "rgba(255,255,255,0.6)", fontSize: 11, textAlign: "right" as const, flexShrink: 0 }}>{f.pct}%</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 12 }}>Segmento</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Top respondentes</div>
                                  {[
                                    { name: "Farmacia Central",      email: "central@farmacia.com",   opens: 14 },
                                    { name: "Distribuidora Norte",   email: "norte@distribuidora.com",opens: 11 },
                                    { name: "Clínica San Martín",    email: "info@clinicasm.com",     opens: 9  },
                                  ].map(r => (
                                    <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{r.name[0]}</div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: "white", fontSize: 13 }}>{r.name}</div>
                                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{r.email}</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 4 }}>Asunto del email</div>
                                  <div style={{ color: "white", fontSize: 14, fontWeight: 500, marginBottom: 12 }}>🌸 ¡Llegó la Primavera! Descubrí nuestras novedades</div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Puntuación IA</span>
                                    <div style={{ display: "flex", gap: 2 }}>
                                      {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= 4 ? "#eab308" : "rgba(255,255,255,0.15)", fontSize: 16 }}>★</span>)}
                                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginLeft: 6, alignSelf: "center" }}>4/5</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Sugerencias IA</div>
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
                                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Notas internas de la campaña</div>
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
                      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", flexShrink: 0, position: "relative" as const, alignItems: "center" }}>
                        {(["Campañas", "Insights", "Investigaciones"] as const).map(nav => (
                          <button key={nav} onClick={() => setMktNavTab(nav)} style={{ padding: "12px 16px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: mktNavTab === nav ? "white" : "rgba(255,255,255,0.35)", borderBottom: `2px solid ${mktNavTab === nav ? "#2563EB" : "transparent"}`, transition: "color 0.15s, border-color 0.15s", marginBottom: -1 }}>{nav}</button>
                        ))}
                        <div style={{ position: "absolute" as const, right: 24, display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => { fetchCampaigns(); fetchResearch() }}
                            title="Actualizar"
                            style={{ padding: "7px 10px", fontSize: 13, background: "none", color: "rgba(255,255,255,0.4)", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button onClick={() => { setShowExportModal(true); setExportState("idle") }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 12, background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Exportar reporte
                          </button>
                        </div>

                        {/* Export modal */}
                        {showExportModal && (
                          <div style={{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowExportModal(false)}>
                            <div style={{ background: "#0f1e35", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: 480, maxHeight: "88vh", overflowY: "auto" as const }} onClick={e => e.stopPropagation()}>
                              <div style={{ color: "white", fontSize: 16, fontWeight: 500 }}>Exportar reporte</div>
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 20, marginTop: 2 }}>Generado por Pupi AI</div>

                              {/* Checkboxes */}
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>¿Qué querés exportar?</div>
                              {[
                                ["Resumen de campañas",     "Performance, ROI y métricas clave"],
                                ["Análisis por canal",       "Comparativo de todos los canales"],
                                ["Insights de segmentos",   "Rendimiento por tipo de cliente"],
                                ["Atribución de clientes",  "Qué campañas generan más valor"],
                                ["Estacionalidad",          "Calendario anual de demanda"],
                                ["Recomendaciones Pupi",    "Acciones sugeridas por la IA"],
                              ].map(([label, desc], i) => (
                                <div key={label} onClick={() => setExportChecks(p => p.map((v, j) => j === i ? !v : v))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${exportChecks[i] ? "#2563EB" : "rgba(255,255,255,0.2)"}`, background: exportChecks[i] ? "#2563EB" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                                    {exportChecks[i] && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ color: "white", fontSize: 13 }}>{label}</div>
                                  </div>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textAlign: "right" as const, maxWidth: 160 }}>{desc}</div>
                                </div>
                              ))}

                              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0" }} />

                              {/* Period */}
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>Período</div>
                              <div style={{ display: "flex", gap: 6, marginBottom: exportPeriod === "Personalizado" ? 12 : 0 }}>
                                {["Este mes","Último trimestre","Este año","Personalizado"].map(p => (
                                  <button key={p} onClick={() => setExportPeriod(p)} style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: `1px solid ${exportPeriod === p ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`, background: exportPeriod === p ? "rgba(37,99,235,0.1)" : "transparent", color: exportPeriod === p ? "#2563EB" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.15s" }}>{p}</button>
                                ))}
                              </div>
                              {exportPeriod === "Personalizado" && (
                                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 4 }}>Desde</div>
                                    <input type="date" value={exportCustomFrom} onChange={e => setExportCustomFrom(e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 12, outline: "none", colorScheme: "dark", boxSizing: "border-box" as const }} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 4 }}>Hasta</div>
                                    <input type="date" value={exportCustomTo} onChange={e => setExportCustomTo(e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 12, outline: "none", colorScheme: "dark", boxSizing: "border-box" as const }} />
                                  </div>
                                </div>
                              )}

                              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0" }} />

                              {/* Format */}
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>Formato</div>
                              {[
                                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label: "Reporte PDF",      desc: "Ideal para presentaciones y reuniones con clientes" },
                                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>, label: "Planilla Excel",   desc: "Datos crudos para análisis personalizado" },
                                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>, label: "Presentación",    desc: "Slides listos para presentar al equipo" },
                              ].map((f, i) => (
                                <div key={f.label} onClick={() => setExportFormat(i)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", borderRadius: 8, border: `1px solid ${exportFormat === i ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`, background: exportFormat === i ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.02)", cursor: "pointer", marginBottom: 8, transition: "all 0.15s" }}>
                                  <div style={{ marginTop: 2 }}>{f.icon}</div>
                                  <div>
                                    <div style={{ color: "white", fontSize: 13 }}>{f.label}</div>
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>{f.desc}</div>
                                  </div>
                                  <div style={{ marginLeft: "auto", width: 14, height: 14, borderRadius: "50%", border: `2px solid ${exportFormat === i ? "#2563EB" : "rgba(255,255,255,0.2)"}`, background: exportFormat === i ? "#2563EB" : "transparent", flexShrink: 0, marginTop: 3 }} />
                                </div>
                              ))}

                              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0" }} />

                              {/* Personalización */}
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>Personalización</div>
                              {[
                                { label: "Incluir logo de la empresa", on: exportLogo, toggle: () => setExportLogo(p => !p) },
                                { label: "Incluir marca Pupi AI",      on: exportBrand, toggle: () => setExportBrand(p => !p) },
                              ].map(row => (
                                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                                  <div onClick={row.toggle} style={{ width: 36, height: 20, borderRadius: 10, background: row.on ? "#2563EB" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative" as const, flexShrink: 0, transition: "background 0.2s" }}>
                                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", position: "absolute" as const, top: 2, left: row.on ? 18 : 2, transition: "left 0.2s" }} />
                                  </div>
                                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{row.label}</span>
                                </div>
                              ))}
                              <div style={{ marginTop: 12 }}>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 5 }}>Título del reporte</div>
                                <input type="text" value={exportTitle} onChange={e => setExportTitle(e.target.value)} placeholder="Reporte de Marketing — Mayo 2026" style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
                              </div>

                              {/* Preview card */}
                              <div style={{ marginTop: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16 }}>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Vista previa</div>
                                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 16, textAlign: "center" as const }}>
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 10 }}>{exportTitle || "Reporte de Marketing — Mayo 2026"}</div>
                                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 4 }}>{exportChecks.filter(Boolean).length} secciones · {["PDF","Excel","PowerPoint"][exportFormat]} · ~{exportChecks.filter(Boolean).length + 2} páginas</div>
                                  <div style={{ color: "#2563EB", fontSize: 11, marginTop: 6 }}>✦ Generado por Pupi AI</div>
                                </div>
                              </div>

                              {/* Footer */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
                                <button onClick={() => setShowExportModal(false)} style={{ padding: "8px 16px", fontSize: 13, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Cancelar</button>
                                <div style={{ display: "flex", gap: 10 }}>
                                  <button style={{ padding: "8px 16px", fontSize: 13, background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Vista previa</button>
                                  <button
                                    onClick={() => {
                                      if (exportState !== "idle") return
                                      setExportState("loading")
                                      setTimeout(() => {
                                        setExportState("done")
                                        setTimeout(() => setShowExportModal(false), 1000)
                                      }, 2000)
                                    }}
                                    style={{ padding: "8px 16px", fontSize: 13, background: exportState === "done" ? "#22c55e" : "#2563EB", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 6, minWidth: 150, justifyContent: "center", transition: "background 0.3s" }}>
                                    {exportState === "idle"    && "Exportar reporte →"}
                                    {exportState === "loading" && <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>Generando...</>}
                                    {exportState === "done"    && <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>¡Reporte listo!</>}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Placeholders for non-campaigns tabs */}
                      {mktNavTab === "Investigaciones" && (() => {
                        type ResType = "Análisis de mercado" | "Estudio de competencia" | "Encuesta" | "Focus group" | "Tendencias"
                        type ResStatus = "En proceso" | "Finalizado" | "Archivado"
                        const mapResearchType = (type: string): ResType => {
                          const map: Record<string, ResType> = {
                            market_analysis: 'Análisis de mercado',
                            competition: 'Estudio de competencia',
                            survey: 'Encuesta',
                            focus_group: 'Focus group',
                            trends: 'Tendencias',
                            other: 'Análisis de mercado',
                          }
                          return map[type] || 'Análisis de mercado'
                        }
                        const RESEARCH: { title: string; type: ResType; author: string; date: string; desc: string; tags: string[]; status: ResStatus; files: number; ai: boolean }[] =
                          realResearch.map(r => ({
                            title: r.title,
                            type: mapResearchType(r.type),
                            author: 'JP',
                            date: r.created_at
                              ? new Date(r.created_at).toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' })
                              : '—',
                            desc: r.summary || '',
                            tags: r.tags,
                            status: r.status as ResStatus,
                            files: Array.isArray(r.files) ? r.files.length : 0,
                            ai: r.ai_analyzed,
                          }))
                        const TYPE_ICON: Record<ResType, { bg: string; color: string; icon: React.ReactNode }> = {
                          "Análisis de mercado":    { bg: "rgba(37,99,235,0.2)",  color: "#2563EB", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
                          "Estudio de competencia": { bg: "rgba(239,68,68,0.2)",  color: "#ef4444", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
                          "Encuesta":               { bg: "rgba(34,197,94,0.2)",  color: "#22c55e", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> },
                          "Focus group":            { bg: "rgba(168,85,247,0.2)", color: "#a855f7", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                          "Tendencias":             { bg: "rgba(234,179,8,0.2)",  color: "#eab308", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
                        }
                        const STATUS_STYLE: Record<ResStatus, { bg: string; color: string; border: string }> = {
                          "En proceso": { bg: "rgba(37,99,235,0.1)",    color: "#2563EB", border: "rgba(37,99,235,0.2)"  },
                          "Finalizado": { bg: "rgba(34,197,94,0.1)",    color: "#22c55e", border: "rgba(34,197,94,0.2)"  },
                          "Archivado":  { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.1)" },
                        }
                        const AUTHOR_MAP: Record<string, string> = { "JP": "JP — Juan Pérez", "CA": "CA — Carlos Acosta", "MR": "MR — María Ruiz", "Consultor externo": "Consultor externo" }
                        const filterLabel: React.CSSProperties = { color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em" }
                        const filtered = RESEARCH
                          .filter(r => !resSearch || r.title.toLowerCase().includes(resSearch.toLowerCase()))
                          .filter(r => resTipoFilter === "Todos" || r.type === resTipoFilter)
                          .filter(r => resStatusFilter === "Todos" || r.status === resStatusFilter)
                          .filter(r => resAuthorFilter === "Todos" || AUTHOR_MAP[r.author] === resAuthorFilter || r.author === resAuthorFilter)

                        // ── RESEARCH DETAIL VIEW ──
                        if (mktView === "researchdetail" && resSelected) {
                          const r = resSelected
                          const ti = TYPE_ICON[r.type as ResType] || TYPE_ICON["Análisis de mercado"]
                          const st = STATUS_STYLE[r.status as ResStatus] || STATUS_STYLE["Finalizado"]
                          const AUTHOR_DISPLAY: Record<string, string> = { "JP": "JP — Juan Pérez", "CA": "CA — Carlos Acosta", "MR": "MR — María Ruiz", "Consultor externo": "Consultor externo" }
                          const FILES_DATA = [
                            { name: "análisis-mercado-q2.pdf",    size: "2.4 MB",  color: "#ef4444" },
                            { name: "datos-encuesta.xlsx",         size: "840 KB",  color: "#22c55e" },
                            { name: "resumen-ejecutivo.docx",      size: "156 KB",  color: "#2563EB" },
                          ]
                          const FINDINGS = [
                            { title: "Demanda creciente en B2B norte",    desc: "El segmento creció 34% interanual con baja presencia competidora.",             impact: "Alto impacto",  impactBg: "rgba(239,68,68,0.1)",   impactColor: "#ef4444" },
                            { title: "Precio percibido como competitivo", desc: "84% de los relevados considera el precio igual o mejor al mercado.",            impact: "Medio impacto", impactBg: "rgba(234,179,8,0.1)",   impactColor: "#eab308" },
                            { title: "Canal digital sub-utilizado",        desc: "Solo el 23% de empresas del segmento usa email marketing.",                     impact: "Alto impacto",  impactBg: "rgba(239,68,68,0.1)",   impactColor: "#ef4444" },
                            { title: "Preferencia por contacto presencial",desc: "62% prefiere reunión presencial para primera compra.",                          impact: "Medio impacto", impactBg: "rgba(234,179,8,0.1)",   impactColor: "#eab308" },
                            { title: "Estacionalidad en mayo y noviembre", desc: "Picos de demanda detectados en ambos períodos históricos.",                     impact: "Bajo impacto",  impactBg: "rgba(34,197,94,0.1)",   impactColor: "#22c55e" },
                          ]
                          return (
                            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                              {/* LEFT COLUMN */}
                              <div style={{ width: "35%", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
                                {/* Icon + title + status */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: ti.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ti.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      {r.type === "Análisis de mercado"    && <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>}
                                      {r.type === "Estudio de competencia" && <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}
                                      {r.type === "Encuesta"               && <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>}
                                      {r.type === "Focus group"            && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
                                      {r.type === "Tendencias"             && <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}
                                    </svg>
                                  </div>
                                  <div style={{ color: "white", fontSize: 16, fontWeight: 500, textAlign: "center" as const, marginTop: 12 }}>{r.title}</div>
                                  <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, marginTop: 6, display: "inline-block" }}>{r.status}</span>
                                </div>

                                {/* Info rows */}
                                <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
                                  {[
                                    ["TIPO",     r.type],
                                    ["AUTOR",    AUTHOR_DISPLAY[r.author] || r.author],
                                    ["FECHA",    r.date],
                                    ["ESTADO",   r.status],
                                    ["ARCHIVOS", `${r.files} ${r.files === 1 ? "archivo" : "archivos"}`],
                                  ].map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{k}</span>
                                      <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 500, textAlign: "right" as const, maxWidth: "60%" }}>{v}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Files */}
                                <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Archivos adjuntos</div>
                                  {FILES_DATA.slice(0, r.files).map(f => (
                                    <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: "white", fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>{f.size}</div>
                                      </div>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "pointer" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    </div>
                                  ))}
                                  <button style={{ marginTop: 10, padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>+ Adjuntar archivo</button>
                                </div>

                                {/* Tags */}
                                <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Etiquetas</div>
                                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                                    {r.tags.map(tag => (
                                      <span key={tag} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{tag}</span>
                                    ))}
                                  </div>
                                  <button style={{ marginTop: 8, background: "none", border: "none", color: "#2563EB", fontSize: 11, cursor: "pointer", padding: 0 }}>+ Agregar etiqueta</button>
                                </div>

                                {/* AI section */}
                                <div style={{ paddingTop: 16 }}>
                                  <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>✦ Inteligencia Pupi</div>
                                  {r.ai ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                      {[
                                        { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>, title: "Hallazgo principal", value: "Demanda creciente en segmento B2B", color: "#2563EB" },
                                        { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, title: "Oportunidad detectada", value: "Mercado sub-atendido en región norte", color: "#22c55e" },
                                        { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, title: "Riesgo identificado", value: "Competidor X expandiendo presupuesto en digital", color: "#eab308" },
                                        { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title: "Acción sugerida", value: "Lanzar campaña en región norte antes de junio", color: "#2563EB" },
                                      ].map(card => (
                                        <div key={card.title} style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.12)", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                                          <div style={{ marginTop: 2, flexShrink: 0 }}>{card.icon}</div>
                                          <div>
                                            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginBottom: 2 }}>{card.title}</div>
                                            <div style={{ color: "white", fontSize: 12, fontWeight: 500 }}>{card.value}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14, textAlign: "center" as const }}>
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 8px" }}><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/><circle cx="12" cy="12" r="10"/></svg>
                                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 10 }}>Sin análisis de IA</div>
                                      <button style={{ padding: "7px 14px", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 6, color: "#2563EB", fontSize: 12, cursor: "pointer" }}>Analizar con Pupi</button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* RIGHT COLUMN */}
                              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                {/* Tabs */}
                                <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", flexShrink: 0 }}>
                                  {(["Resumen","Hallazgos","Documentos","Notas"] as const).map(t => (
                                    <button key={t} onClick={() => setResDetailTab(t)} style={{ padding: "12px 14px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: resDetailTab === t ? "white" : "rgba(255,255,255,0.35)", borderBottom: `2px solid ${resDetailTab === t ? "#2563EB" : "transparent"}`, marginBottom: -1, transition: "color 0.15s, border-color 0.15s" }}>{t}</button>
                                  ))}
                                </div>

                                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                                  {/* RESUMEN TAB */}
                                  {resDetailTab === "Resumen" && (
                                    <div>
                                      {/* Executive summary */}
                                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 18, marginBottom: 20 }}>
                                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Resumen ejecutivo</div>
                                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>El análisis de mercado Q2 2026 revela una demanda creciente en el segmento B2B, especialmente en la región norte. Se identificaron oportunidades de expansión en tres categorías de producto y un riesgo competitivo en el canal digital.</p>
                                        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                                          {[["284","EMPRESAS RELEVADAS"],["3","OPORTUNIDADES"],["1","RIESGO CRÍTICO"]].map(([v, l]) => (
                                            <div key={l} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px" }}>
                                              <div style={{ color: "white", fontSize: 18, fontWeight: 600 }}>{v}</div>
                                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{l}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* AI analysis */}
                                      <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>✦ Análisis Pupi</div>
                                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                                        {[
                                          { stroke: "#22c55e", icon: "trend",    prio: "Oportunidad principal",       body: "El segmento B2B en la región norte muestra un crecimiento del 34% interanual con baja penetración de competidores directos. Ventana de oportunidad estimada: 3-6 meses." },
                                          { stroke: "#eab308", icon: "alert",    prio: "Amenaza a monitorear",         body: "Competidor X aumentó su presupuesto digital un 180% en los últimos 90 días. Está apuntando al mismo segmento objetivo." },
                                          { stroke: "#2563EB", icon: "zap",      prio: "Recomendación estratégica",    body: "Lanzar campaña de penetración en región norte antes de junio, priorizando canal email y visitas presenciales según perfil del segmento." },
                                        ].map(c => (
                                          <div key={c.prio} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}>
                                              {c.icon === "trend" && <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}
                                              {c.icon === "alert" && <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
                                              {c.icon === "zap"   && <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}
                                            </svg>
                                            <div>
                                              <div style={{ color: c.stroke, fontSize: 11, fontWeight: 500, marginBottom: 3 }}>{c.prio}</div>
                                              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.6 }}>{c.body}</div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Connected campaigns */}
                                      <div>
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Campañas relacionadas</div>
                                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 8 }}>
                                          {["Campaña Primavera 2026","Google Ads — Producto X"].map(name => (
                                            <div key={name} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "5px 12px", cursor: "pointer" }}>
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                              <span style={{ color: "white", fontSize: 12 }}>{name}</span>
                                              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>→</span>
                                            </div>
                                          ))}
                                        </div>
                                        <button style={{ background: "none", border: "none", color: "#2563EB", fontSize: 11, cursor: "pointer", padding: 0 }}>+ Vincular campaña</button>
                                      </div>
                                    </div>
                                  )}

                                  {/* HALLAZGOS TAB */}
                                  {resDetailTab === "Hallazgos" && (
                                    <div>
                                      {FINDINGS.map((f, i) => (
                                        <div key={i} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                                          <div>
                                            <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{f.title}</div>
                                            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{f.desc}</div>
                                            <span style={{ display: "inline-block", marginTop: 6, background: f.impactBg, color: f.impactColor, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{f.impact}</span>
                                          </div>
                                        </div>
                                      ))}
                                      <button style={{ marginTop: 16, padding: "7px 14px", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 8, color: "#2563EB", fontSize: 12, cursor: "pointer" }}>+ Agregar hallazgo</button>
                                    </div>
                                  )}

                                  {/* DOCUMENTOS TAB */}
                                  {resDetailTab === "Documentos" && (
                                    <div>
                                      {FILES_DATA.slice(0, r.files).map(f => (
                                        <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{f.name}</div>
                                            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{f.size}</div>
                                          </div>
                                          <button style={{ padding: "4px 10px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer" }}>Ver preview</button>
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "pointer" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* NOTAS TAB */}
                                  {resDetailTab === "Notas" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Notas internas de la investigación</div>
                                      <textarea placeholder="Escribí tus notas aquí..." style={{ width: "100%", minHeight: 180, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "white", fontSize: 13, padding: "12px 14px", resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" }} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                            {/* Left sidebar */}
                            <div style={{ width: "25%", flexShrink: 0, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "20px 16px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
                              <input type="text" placeholder="Buscar investigación..." value={resSearch} onChange={e => setResSearch(e.target.value)} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />

                              <div style={{ marginTop: 20, marginBottom: 8, ...filterLabel }}>Tipo</div>
                              {["Todos","Análisis de mercado","Estudio de competencia","Encuesta","Focus group","Tendencias"].map(f => (
                                <button key={f} onClick={() => setResTipoFilter(f)} style={{ textAlign: "left" as const, padding: "7px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", marginBottom: 2, background: resTipoFilter === f ? "rgba(37,99,235,0.15)" : "transparent", color: resTipoFilter === f ? "#2563EB" : "rgba(255,255,255,0.4)", transition: "background 0.15s, color 0.15s" }}>{f}</button>
                              ))}

                              <div style={{ marginTop: 16, marginBottom: 8, ...filterLabel }}>Estado</div>
                              {["Todos","En proceso","Finalizado","Archivado"].map(f => (
                                <button key={f} onClick={() => setResStatusFilter(f)} style={{ textAlign: "left" as const, padding: "7px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", marginBottom: 2, background: resStatusFilter === f ? "rgba(37,99,235,0.15)" : "transparent", color: resStatusFilter === f ? "#2563EB" : "rgba(255,255,255,0.4)", transition: "background 0.15s, color 0.15s" }}>{f}</button>
                              ))}

                              <div style={{ marginTop: 16, marginBottom: 8, ...filterLabel }}>Autor</div>
                              {["Todos","JP — Juan Pérez","CA — Carlos Acosta","MR — María Ruiz","Consultor externo"].map(f => (
                                <button key={f} onClick={() => setResAuthorFilter(f)} style={{ textAlign: "left" as const, padding: "7px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", marginBottom: 2, background: resAuthorFilter === f ? "rgba(37,99,235,0.15)" : "transparent", color: resAuthorFilter === f ? "#2563EB" : "rgba(255,255,255,0.4)", transition: "background 0.15s, color 0.15s" }}>{f}</button>
                              ))}
                            </div>

                            {/* Right section */}
                            <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                              {marketingLoading && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '32px',
                                  color: 'rgba(255,255,255,0.6)',
                                  fontSize: '13px',
                                  gap: '8px',
                                }}>
                                  <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid rgba(37,99,235,0.3)',
                                    borderTop: '2px solid #2563EB',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                  }} />
                                  Cargando investigaciones...
                                </div>
                              )}

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
                                <div>
                                  <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Investigaciones</div>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>{`${realResearch.length} investigaciones · ${researchInProgress} en proceso`}</div>
                                </div>
                                <button onClick={() => setMktView("newresearch")} style={{ padding: "7px 14px", fontSize: 13, background: "#2563EB", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Nueva investigación +</button>
                              </div>

                              <div style={{ flex: 1, overflowY: "auto" }}>
                                {filtered.map((r, idx) => {
                                  const ti = TYPE_ICON[r.type]
                                  const st = STATUS_STYLE[r.status]
                                  return (
                                    <div key={idx}
                                      onClick={() => { setResSelected(r); setMktView("researchdetail"); setResDetailTab("Resumen") }}
                                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16, marginBottom: 8, cursor: "pointer", display: "flex", gap: 16, alignItems: "flex-start", transition: "background 0.15s, border-color 0.15s" }}
                                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)" }}
                                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)" }}>
                                      {/* Type icon */}
                                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: ti.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ti.icon}</div>
                                      {/* Center */}
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: "white", fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{r.title}</div>
                                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 6 }}>{r.type} · {r.author} · {r.date}</div>
                                        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{r.desc}</div>
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginTop: 8 }}>
                                          {r.tags.map(tag => (
                                            <span key={tag} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{tag}</span>
                                          ))}
                                        </div>
                                      </div>
                                      {/* Right */}
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                                        <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>{r.status}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{r.files} {r.files === 1 ? "archivo" : "archivos"}</span>
                                        </div>
                                        {r.ai && <span style={{ color: "#2563EB", fontSize: 11 }}>✦ Analizado por Pupi</span>}
                                      </div>
                                    </div>
                                  )
                                })}
                                {filtered.length === 0 && (
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 48, gap: 8 }}>
                                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 13 }}>Sin investigaciones</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {mktNavTab === "Insights" && (
                        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                          {marketingLoading && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '32px',
                              color: 'rgba(255,255,255,0.6)',
                              fontSize: '13px',
                              gap: '8px',
                              marginBottom: 16,
                            }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(37,99,235,0.3)',
                                borderTop: '2px solid #2563EB',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                              }} />
                              Cargando insights...
                            </div>
                          )}

                          {/* Top summary cards */}
                          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                            {[
                              { label: "ROI promedio campañas", value: `${Math.round(avgROI)}%`, valueColor: "#22c55e", sub: "↑ 34% vs trimestre anterior", subColor: "#22c55e" },
                              { label: "Canal más efectivo",    value: bestChannel, valueColor: "white",   sub: "68% apertura promedio",       subColor: "rgba(255,255,255,0.35)" },
                              { label: "Costo por cliente",     value: `$${Math.round(avgCostPerClient).toLocaleString()}`,  valueColor: "white",   sub: "↓ $40 vs mes anterior",       subColor: "#22c55e" },
                            ].map(c => (
                              <div key={c.label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 6 }}>{c.label}</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{ch.campañas} {ch.campañas === 1 ? "campaña" : "campañas"}</div>
                                </div>
                                <div style={{ flex: 1, maxWidth: 180, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ width: `${ch.barPct}%`, height: "100%", background: ch.color, borderRadius: 2, minWidth: ch.barPct > 0 ? 4 : 0 }} />
                                </div>
                                <div style={{ width: 52, textAlign: "right" as const, flexShrink: 0, color: ch.roi > 0 ? "#22c55e" : ch.roi < 0 ? "#ef4444" : "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500 }}>{ch.roi > 0 ? `+${ch.roi}%` : ch.roi < 0 ? `${ch.roi}%` : "—"}</div>
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
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 12 }}>{seg.count}</div>
                                  {seg.stats.map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{k}</span>
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
                                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{r.body}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "24px 0" }} />

                          {/* Seasonality section */}
                          {(() => {
                            const MONTHS = [
                              { abbr: "Ene", pct: 35,  bg: "rgba(37,99,235,0.20)", peak: false },
                              { abbr: "Feb", pct: 42,  bg: "rgba(37,99,235,0.25)", peak: false },
                              { abbr: "Mar", pct: 58,  bg: "rgba(37,99,235,0.35)", peak: false },
                              { abbr: "Abr", pct: 71,  bg: "rgba(37,99,235,0.44)", peak: false },
                              { abbr: "May", pct: 88,  bg: "rgba(37,99,235,0.60)", peak: true,  current: true },
                              { abbr: "Jun", pct: 45,  bg: "rgba(37,99,235,0.28)", peak: false },
                              { abbr: "Jul", pct: 32,  bg: "rgba(37,99,235,0.20)", peak: false },
                              { abbr: "Ago", pct: 38,  bg: "rgba(37,99,235,0.22)", peak: false },
                              { abbr: "Sep", pct: 65,  bg: "rgba(37,99,235,0.40)", peak: false },
                              { abbr: "Oct", pct: 72,  bg: "rgba(37,99,235,0.46)", peak: false },
                              { abbr: "Nov", pct: 91,  bg: "rgba(37,99,235,0.65)", peak: true  },
                              { abbr: "Dic", pct: 55,  bg: "rgba(37,99,235,0.34)", peak: false },
                            ]
                            const TOOLTIPS: Record<string, { label: string; avg: string; vs: string }> = {
                              "Ene": { label: "Enero — Volumen bajo",        avg: "$18.200",  vs: "↓ 35% vs mes base" },
                              "Feb": { label: "Febrero — Volumen moderado",  avg: "$22.500",  vs: "↓ 18% vs mes base" },
                              "Mar": { label: "Marzo — Volumen medio",       avg: "$31.400",  vs: "↑ 12% vs mes base" },
                              "Abr": { label: "Abril — Volumen alto",        avg: "$38.900",  vs: "↑ 40% vs mes base" },
                              "May": { label: "Mayo — Alto volumen",         avg: "$48.750",  vs: "↑ 88% vs mes base" },
                              "Jun": { label: "Junio — Volumen moderado",    avg: "$24.100",  vs: "↓ 14% vs mes base" },
                              "Jul": { label: "Julio — Temporada baja",      avg: "$17.300",  vs: "↓ 42% vs mes base" },
                              "Ago": { label: "Agosto — Temporada baja",     avg: "$19.800",  vs: "↓ 35% vs mes base" },
                              "Sep": { label: "Septiembre — Recuperación",   avg: "$35.200",  vs: "↑ 28% vs mes base" },
                              "Oct": { label: "Octubre — Volumen alto",      avg: "$39.400",  vs: "↑ 43% vs mes base" },
                              "Nov": { label: "Noviembre — Pico máximo",     avg: "$52.100",  vs: "↑ 91% vs mes base" },
                              "Dic": { label: "Diciembre — Cierre de año",   avg: "$29.800",  vs: "↑ 9% vs mes base" },
                            }
                            return (
                              <div>
                                <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>✦ Estacionalidad detectada</div>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 20 }}>Basado en historial de ventas de los últimos 12 meses</div>

                                {/* Calendar grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6, marginBottom: 12 }}>
                                  {MONTHS.map(m => {
                                    const tip = TOOLTIPS[m.abbr]
                                    return (
                                      <div key={m.abbr} style={{ borderRadius: 8, padding: "10px 6px", textAlign: "center" as const, cursor: "pointer", border: m.current ? "1px solid rgba(37,99,235,0.6)" : m.peak ? "1px solid rgba(234,179,8,0.4)" : "1px solid transparent", transition: "all 0.2s", position: "relative" as const }}
                                        onMouseEnter={e => {
                                          const el = e.currentTarget
                                          const tt = el.querySelector(".seas-tooltip") as HTMLElement
                                          if (tt) { tt.style.opacity = "1"; tt.style.pointerEvents = "auto" }
                                        }}
                                        onMouseLeave={e => {
                                          const el = e.currentTarget
                                          const tt = el.querySelector(".seas-tooltip") as HTMLElement
                                          if (tt) { tt.style.opacity = "0"; tt.style.pointerEvents = "none" }
                                        }}>
                                        {/* Tooltip */}
                                        <div className="seas-tooltip" style={{ position: "absolute" as const, bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "rgba(10,10,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", width: 170, zIndex: 50, opacity: 0, pointerEvents: "none", transition: "opacity 0.15s", textAlign: "left" as const, whiteSpace: "nowrap" as const }}>
                                          <div style={{ color: "white", fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{tip.label}</div>
                                          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginBottom: 2 }}>{tip.avg} promedio histórico</div>
                                          <div style={{ color: tip.vs.startsWith("↑") ? "#22c55e" : "#ef4444", fontSize: 11 }}>{tip.vs}</div>
                                        </div>
                                        {/* Peak indicator */}
                                        {m.peak && <div style={{ fontSize: 9, marginBottom: 2, color: "#eab308" }}>★</div>}
                                        {/* Month name */}
                                        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, marginBottom: m.peak ? 2 : 6 }}>{m.abbr}</div>
                                        {m.current && <div style={{ color: "#2563EB", fontSize: 9, marginBottom: 3 }}>Hoy</div>}
                                        {/* Intensity bar */}
                                        <div style={{ width: "100%", height: 32, borderRadius: 3, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                          <span style={{ color: "white", fontSize: 11, fontWeight: 500 }}>{m.pct}%</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>

                                {/* Legend */}
                                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
                                  {[
                                    { bg: "rgba(37,99,235,0.2)",  label: "Bajo volumen"  },
                                    { bg: "rgba(37,99,235,0.4)",  label: "Volumen medio" },
                                    { bg: "rgba(37,99,235,0.65)", label: "Alto volumen"  },
                                  ].map(l => (
                                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <div style={{ width: 10, height: 10, borderRadius: 2, background: l.bg, flexShrink: 0 }} />
                                      <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{l.label}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Peak period cards */}
                                <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                                  <div style={{ flex: 1, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: 16 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                      <span style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Pico principal</span>
                                    </div>
                                    <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Mayo — Noviembre</div>
                                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>Estos meses concentran el 42% de las ventas anuales. Preparar campañas con 6 semanas de anticipación.</div>
                                  </div>
                                  <div style={{ flex: 1, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: 16 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                                      <span style={{ color: "#ef4444", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Temporada baja</span>
                                    </div>
                                    <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Julio — Agosto</div>
                                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>Ventas caen un 35% en estos meses. Ideal para campañas de fidelización y reactivación de clientes tibios.</div>
                                  </div>
                                </div>

                                {/* Seasonality AI recommendations */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                  {[
                                    { prio: "Alta prioridad",  pColor: "#ef4444", title: "Preparar campaña de noviembre ya",                  body: "Faltan 6 meses para el segundo pico de ventas. Las campañas preparadas con anticipación generan 40% más de conversión." },
                                    { prio: "Media prioridad", pColor: "#eab308", title: "Crear campaña de reactivación para julio",            body: "La temporada baja puede aprovecharse para recuperar clientes fríos con descuentos o promociones especiales." },
                                    { prio: "Baja prioridad",  pColor: "rgba(255,255,255,0.3)", title: "Aumentar stock en abril para responder al pico de mayo", body: "Históricamente mayo supera la capacidad de respuesta. Coordiná con operaciones." },
                                  ].map(r => (
                                    <div key={r.title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.pColor, marginTop: 5, flexShrink: 0 }} />
                                      <div>
                                        <div style={{ color: r.pColor, fontSize: 10, marginBottom: 3 }}>{r.prio}</div>
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{r.title}</div>
                                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{r.body}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}

                          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "24px 0" }} />

                          {/* Attribution section */}
                          {(() => {
                            const chIcon = (ch: string, sz = 14) => {
                              const props = { width: sz, height: sz, viewBox: "0 0 24 24", fill: "none", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
                              if (ch === "Email")    return <svg {...props} stroke="#2563EB"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                              if (ch === "Redes")    return <svg {...props} stroke="#a855f7"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                              if (ch === "Google")   return <svg {...props} stroke="#eab308"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                              if (ch === "WhatsApp") return <svg {...props} stroke="#22c55e"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              return null
                            }
                            const ROWS = [
                              { name: "Campaña Primavera 2026",         ch: "Email",    chLabel: "Email",          clientes: 8, ticket: "$4.200",  tickUp: true,  ltv: "$28.400", score: 4.8 },
                              { name: "Google Ads — Producto X",        ch: "Google",   chLabel: "Google Ads",     clientes: 3, ticket: "$12.800", tickUp: true,  ltv: "$48.200", score: 4.5 },
                              { name: "Remarketing clientes fríos",     ch: "Redes",    chLabel: "Redes sociales", clientes: 5, ticket: "$2.100",  tickUp: false, ltv: "$12.600", score: 3.2 },
                              { name: "Newsletter mensual",             ch: "Email",    chLabel: "Email",          clientes: 4, ticket: "$6.400",  tickUp: true,  ltv: "$32.100", score: 4.1 },
                              { name: "WhatsApp broadcast",             ch: "WhatsApp", chLabel: "WhatsApp",       clientes: 1, ticket: "$890",    tickUp: false, ltv: "$4.200",  score: 2.1 },
                            ]
                            const Stars = ({ score }: { score: number }) => {
                              const filled = Math.round(score)
                              return (
                                <div>
                                  <div style={{ display: "flex", gap: 3 }}>
                                    {[1,2,3,4,5].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= filled ? "#2563EB" : "rgba(255,255,255,0.1)" }} />)}
                                  </div>
                                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 3 }}>{score.toFixed(1)}/5</div>
                                </div>
                              )
                            }
                            const CLIENTS = [
                              { initials: "MG", name: "María González",  company: "Distribuidora Norte",  camp: "Campaña Primavera 2026",  ticket: "$4.200",  temp: "Caliente" },
                              { initials: "LH", name: "Luis Herrera",    company: "Grupo Herrera SA",     camp: "Google Ads — Producto X", ticket: "$28.500", temp: "Caliente" },
                              { initials: "DL", name: "Diego López",     company: "Importadora DL",       camp: "Newsletter mensual",      ticket: "$9.750",  temp: "Caliente" },
                            ]
                            const tempColor = (t: string) => t === "Caliente" ? { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.2)" } : t === "Tibio" ? { bg: "rgba(234,179,8,0.1)", color: "#eab308", border: "rgba(234,179,8,0.2)" } : { bg: "rgba(37,99,235,0.1)", color: "#2563EB", border: "rgba(37,99,235,0.2)" }
                            return (
                              <div>
                                <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>✦ Atribución de campañas</div>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 20 }}>Qué campañas generan los clientes más rentables</div>

                                {/* Attribution table */}
                                <div style={{ marginBottom: 24 }}>
                                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px 8px 0 0" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 16px" }}>
                                      {["CAMPAÑA","CLIENTES","TICKET PROM","LTV EST","CALIDAD"].map(h => (
                                        <span key={h} style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{h}</span>
                                      ))}
                                    </div>
                                  </div>
                                  {ROWS.map(r => (
                                    <div key={r.name}
                                      style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", transition: "background 0.15s", cursor: "pointer" }}
                                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        {chIcon(r.ch)}
                                        <div>
                                          <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                                          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{r.chLabel}</div>
                                        </div>
                                      </div>
                                      <div>
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{r.clientes}</div>
                                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>nuevos clientes</div>
                                      </div>
                                      <div>
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{r.ticket}</div>
                                        <div style={{ color: r.tickUp ? "#22c55e" : "#ef4444", fontSize: 10 }}>{r.tickUp ? "↑ vs promedio" : "↓ vs promedio"}</div>
                                      </div>
                                      <div>
                                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginBottom: 2 }}>Lifetime value est.</div>
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{r.ltv}</div>
                                      </div>
                                      <Stars score={r.score} />
                                    </div>
                                  ))}
                                </div>

                                {/* Best source card */}
                                <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 10, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
                                  <div>
                                    <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>✦ Mejor fuente de clientes rentables</div>
                                    <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Google Ads — Producto X</div>
                                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>Genera el menor volumen pero los clientes más rentables: ticket promedio $12.800 y LTV estimado de $48.200 por cliente. Recomendamos aumentar el presupuesto.</div>
                                  </div>
                                </div>

                                {/* CRM connection */}
                                <div style={{ marginBottom: 24 }}>
                                  <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Clientes generados por campaña</div>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 16 }}>Conectado con CRM en tiempo real</div>
                                  <div style={{ display: "flex", gap: 12 }}>
                                    {CLIENTS.map(c => {
                                      const tc = tempColor(c.temp)
                                      return (
                                        <div key={c.name} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14 }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{c.initials}</div>
                                            <div style={{ minWidth: 0 }}>
                                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.company}</div>
                                            </div>
                                          </div>
                                          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>Origen: <span style={{ color: "#2563EB" }}>{c.camp}</span></div>
                                          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 4 }}>Ticket: {c.ticket}</div>
                                          <span style={{ display: "inline-block", marginTop: 6, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, borderRadius: 20, padding: "1px 8px", fontSize: 10 }}>{c.temp}</span>
                                          <div><button style={{ marginTop: 8, background: "none", border: "none", color: "#2563EB", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver en CRM →</button></div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )
                          })()}

                          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "24px 0" }} />

                          {/* Ideal client profile */}
                          <div>
                            <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>✦ Perfil del cliente ideal</div>
                            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 16 }}>Generado desde datos reales de conversión</div>
                            <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 12, padding: 20 }}>
                              <div style={{ display: "flex", gap: 24 }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, minWidth: 80 }}>
                                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                  </div>
                                  <div style={{ color: "white", fontSize: 14, fontWeight: 500, marginTop: 10, textAlign: "center" as const }}>Cliente ideal</div>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textAlign: "center" as const }}>Top 15% de conversión</div>
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
                                      <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{k}</span>
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
                            {marketingLoading && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '32px',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '13px',
                                gap: '8px',
                              }}>
                                <div style={{
                                  width: '16px',
                                  height: '16px',
                                  border: '2px solid rgba(37,99,235,0.3)',
                                  borderTop: '2px solid #2563EB',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite',
                                }} />
                                Cargando campañas...
                              </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
                              <div>
                                <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Campañas</div>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>{`${realCampaigns.length} campañas · ${activeCampaignCount} activas`}</div>
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
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>{camp.channel} · {camp.date}</div>
                                    </div>
                                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: "2px 8px", fontSize: 11, flexShrink: 0 }}>{camp.status}</span>
                                    <span style={{ color: ROI_COLOR[camp.roiDir], fontSize: 12, fontWeight: 500, width: 64, textAlign: "right" as const, flexShrink: 0 }}>{camp.roi}</span>
                                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, width: 56, textAlign: "right" as const, flexShrink: 0 }}>{camp.budget}</span>
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
              ) : activeNode.id === 4 ? (
                // ── RRHH MODULE ──
                (() => {
                  type EmpStatus = "Activo" | "Licencia" | "Baja"
                  const getEmpAlert = (e: {
                    ai_churn_risk?: string | null
                    performance?: number
                  }) => {
                    if (e.ai_churn_risk === 'high') return 'Riesgo renuncia'
                    if ((e.performance || 0) > 0 && (e.performance || 0) < 3.5)
                      return 'Bajo desempeño'
                    return ''
                  }
                  const toScore = (p: number) =>
                    p > 5 ? p / 20 : p
                  const EMPLOYEES: { id: string; name: string; initials: string; role: string; area: string; status: EmpStatus; score: number; alert: string; seniority: string }[] =
                    realEmployees.map(emp => ({
                      id: emp.id,
                      name: emp.name,
                      initials: emp.avatar,
                      role: emp.role,
                      area: emp.area,
                      status: emp.status as EmpStatus,
                      score: toScore(Number(emp.performance) || 0),
                      alert: getEmpAlert(emp),
                      seniority: emp.seniority,
                    }))
                  const employeesAtRisk = realEmployees.filter(e =>
                    e.ai_churn_risk === 'high' ||
                    e.status !== 'Activo'
                  )
                  const onLeaveCount = realEmployees
                    .filter(e => e.status === 'Licencia').length
                  const totalGrossSalary = realEmployees
                    .reduce((sum, e) => sum + e.salary, 0)
                  const totalSocialCharges =
                    totalGrossSalary * 0.30
                  const totalCost =
                    totalGrossSalary + totalSocialCharges
                  const totalNet = totalGrossSalary * 0.75
                  const STATUS_STYLE: Record<EmpStatus, { bg: string; color: string; border: string }> = {
                    Activo:   { bg: "rgba(34,197,94,0.1)",    color: "#22c55e", border: "rgba(34,197,94,0.2)"  },
                    Licencia: { bg: "rgba(234,179,8,0.1)",    color: "#eab308", border: "rgba(234,179,8,0.2)"  },
                    Baja:     { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.1)" },
                  }
                  const filterLabel: React.CSSProperties = { color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em" }
                  const ScoreDots = ({ score }: { score: number }) => {
                    const filled = Math.round(score)
                    return (
                      <div>
                        <div style={{ display: "flex", gap: 3 }}>
                          {[1,2,3,4,5].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i <= filled ? "#2563EB" : "rgba(255,255,255,0.1)" }} />)}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 2 }}>{score.toFixed(1)}/5</div>
                      </div>
                    )
                  }
                  const filtered = EMPLOYEES
                    .filter(e => !rrhhSearch || e.name.toLowerCase().includes(rrhhSearch.toLowerCase()))
                    .filter(e => rrhhStatusFilter === "Todos" || e.status === rrhhStatusFilter.replace(/\s.*/, ""))
                    .filter(e => rrhhAreaFilter === "Todas" || e.area === rrhhAreaFilter)
                    .filter(e => {
                      if (rrhhAlertFilter === "Sin alertas") return true
                      if (rrhhAlertFilter === "Riesgo renuncia") return e.alert === "Riesgo renuncia"
                      if (rrhhAlertFilter === "Sobrecargado") return e.alert === "Sobrecargado"
                      if (rrhhAlertFilter === "Bajo desempeño") return e.alert === "Bajo desempeño"
                      return true
                    })

                  // ── EMPLOYEE DETAIL VIEW ──
                  if (rrhhView === "detail" && rrhhSelectedEmp) {
                    const emp = rrhhSelectedEmp
                    const st = STATUS_STYLE[emp.status as EmpStatus] ?? STATUS_STYLE["Activo"]
                    const filledStars = Math.round(emp.score)
                    const riskColor = emp.alert === "Riesgo renuncia" ? "#ef4444" : emp.alert === "Bajo desempeño" ? "#ef4444" : emp.alert === "Sobrecargado" ? "#eab308" : "#22c55e"
                    const riskLabel = emp.alert === "Riesgo renuncia" ? "Alto" : emp.alert === "Bajo desempeño" ? "Medio" : emp.alert === "Sobrecargado" ? "Medio" : "Bajo"
                    const aiCard: React.CSSProperties = { background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }
                    const aiCardLabel: React.CSSProperties = { color: "rgba(255,255,255,0.8)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }
                    const divider = <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "16px 0" }} />
                    const realEmp = realEmployees.find(e => e.id === emp.id)
                    const info = realEmp ? {
                      email: '—',
                      phone: '—',
                      salary: `$${realEmp.salary.toLocaleString()}`,
                      joinDate: realEmp.hireDate
                        ? new Date(realEmp.hireDate).toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '—',
                      goalAmt: '—',
                      goalTotal: '—',
                      goalPct: 0,
                      vacLeft: 0,
                      vacUsed: 0,
                    } : {
                      email: '—',
                      phone: '—',
                      salary: '—',
                      joinDate: '—',
                      goalAmt: '—',
                      goalTotal: '—',
                      goalPct: 0,
                      vacLeft: 0,
                      vacUsed: 0,
                    }
                    const employeeTasks = realTasks.filter(t =>
                      t.employee_id === emp.id
                    )
                    const formatTaskDue = (dueDate: string | null) => {
                      if (!dueDate) return 'Sin fecha'
                      const d = new Date(dueDate)
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const due = new Date(d)
                      due.setHours(0, 0, 0, 0)
                      const diff = Math.round(
                        (due.getTime() - today.getTime()) / 86400000
                      )
                      if (diff === 0) return 'Vence hoy'
                      if (diff === 1) return 'Vence mañana'
                      if (diff === -1) return 'Venció ayer'
                      if (diff < 0) return `Venció hace ${Math.abs(diff)} días`
                      if (diff <= 7) return 'Vence esta semana'
                      return d.toLocaleDateString('es-UY', { day: 'numeric', month: 'long' })
                    }
                    const TASKS = employeeTasks.map(t => ({
                      id: t.id,
                      name: t.title,
                      due: formatTaskDue(t.dueDate),
                      priority: t.priority,
                      status: t.status,
                      by: 'Dueño',
                      cat: t.category,
                    }))
                    const pendingTasks = employeeTasks
                      .filter(t => t.status === 'Pendiente').length
                    const inProgressTasks = employeeTasks
                      .filter(t => t.status === 'En proceso').length
                    const completedTasks = employeeTasks
                      .filter(t => t.status === 'Completada').length
                    const filteredTasks = rrhhTaskFilter === "Todas" ? TASKS
                      : rrhhTaskFilter === "Hoy"          ? TASKS.filter(t => t.due.toLowerCase().includes("hoy"))
                      : rrhhTaskFilter === "Esta semana"  ? TASKS.filter(t => t.due.toLowerCase().includes("semana") || t.due.toLowerCase().includes("viernes") || t.due.toLowerCase().includes("mañana") || t.due.toLowerCase().includes("hoy"))
                      : rrhhTaskFilter === "Pendientes"   ? TASKS.filter(t => t.status === "Pendiente")
                      : rrhhTaskFilter === "En proceso"   ? TASKS.filter(t => t.status === "En proceso")
                      : rrhhTaskFilter === "Completadas"  ? TASKS.filter(t => t.status === "Completada")
                      : TASKS
                    const prioColor = (p: string) => p === "Alta" ? "#ef4444" : p === "Media" ? "#eab308" : "#22c55e"
                    const catColor = "#2563EB"
                    const taskCount = (s: string) => s === 'Pendiente' ? pendingTasks
                      : s === 'En proceso' ? inProgressTasks
                      : completedTasks
                    return (
                      <div style={{ flex: 1, display: "flex", gap: 24, padding: "24px", overflow: "hidden" }}>
                        {rrhhLoading && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(13,13,20,0.6)',
                            zIndex: 10,
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '13px',
                            gap: '8px',
                          }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid rgba(37,99,235,0.3)',
                              borderTop: '2px solid #2563EB',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                            }} />
                            Cargando empleado...
                          </div>
                        )}
                        {/* LEFT COLUMN */}
                        <div style={{ width: "35%", flexShrink: 0, overflowY: "auto" }}>
                          {/* Avatar + name */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 20, fontWeight: 500 }}>{emp.initials}</div>
                            <div style={{ color: "white", fontSize: 16, fontWeight: 500, textAlign: "center" as const, marginTop: 12 }}>{emp.name}</div>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textAlign: "center" as const }}>{emp.role} · {emp.area}</div>
                            <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: "2px 8px", fontSize: 11, marginTop: 6 }}>{emp.status}</span>
                          </div>

                          {divider}

                          {/* Info rows */}
                          {([
                            ["ÁREA",          emp.area],
                            ["CARGO",         emp.role],
                            ["ANTIGÜEDAD",    emp.seniority],
                            ["FECHA INGRESO", info.joinDate],
                            ["EMAIL",         info.email],
                            ["TELÉFONO",      info.phone],
                            ["SUELDO BASE",   info.salary],
                          ] as [string, string][]).map(([label, val]) => (
                            <div key={label} style={{ marginBottom: 12 }}>
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>{label}</div>
                              <div style={{ color: "white", fontSize: 13 }}>{val}</div>
                            </div>
                          ))}

                          {divider}

                          {/* Performance */}
                          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>DESEMPEÑO GENERAL</div>
                          <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                            <span style={{ color: "white", fontSize: 32, fontWeight: 600 }}>{emp.score.toFixed(1)}</span>
                            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>/5</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 6 }}>
                            {[1,2,3,4,5].map(i => (
                              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i <= filledStars ? "#2563EB" : "rgba(255,255,255,0.1)"} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            ))}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textAlign: "center" as const, marginTop: 6 }}>Top 10% del equipo</div>

                          {divider}

                          {/* Metas del mes */}
                          {(() => {
                            const isSeller = emp.area === "Ventas"
                            const goals = isSeller
                              ? [
                                  { name: "Ventas cerradas",   actual: "8",       meta: "10",        pct: 80,  label: "8 / 10"              },
                                  { name: "Monto vendido",     actual: "$48.750", meta: "$50.000",   pct: 97,  label: "$48.750 / $50.000"   },
                                  { name: "Nuevos prospectos", actual: "3",       meta: "5",         pct: 60,  label: "3 / 5"               },
                                ]
                              : [
                                  { name: "Tareas completadas",   actual: "18", meta: "20", pct: 90,  label: "18 / 20" },
                                  { name: "Capacitaciones",       actual: "2",  meta: "3",  pct: 67,  label: "2 / 3"   },
                                  { name: "Proyectos entregados", actual: "4",  meta: "4",  pct: 100, label: "4 / 4"   },
                                ]
                            const goalColor = (p: number) => p >= 80 ? "#22c55e" : p >= 50 ? "#eab308" : "#ef4444"
                            return (
                              <>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Metas del mes</div>
                                {goals.map(g => {
                                  const c = goalColor(g.pct)
                                  return (
                                    <div key={g.name} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <span style={{ color: "white", fontSize: 12, fontWeight: 500 }}>{g.name}</span>
                                        <span style={{ color: c, fontSize: 12, fontWeight: 500 }}>{g.pct}%</span>
                                      </div>
                                      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 5 }}>
                                        <div style={{ height: "100%", width: `${g.pct}%`, background: c, borderRadius: 2 }} />
                                      </div>
                                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Actual: {g.actual} / Meta: {g.meta}</div>
                                    </div>
                                  )
                                })}
                                <div style={{ color: "#2563EB", fontSize: 11, marginTop: 8, cursor: "pointer" }}>+ Agregar meta</div>
                                {divider}
                              </>
                            )
                          })()}

                          {/* Vacaciones */}
                          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>VACACIONES</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ color: "white", fontSize: 13 }}>Días disponibles</span>
                            <span style={{ color: "white", fontSize: 13 }}>{info.vacLeft} días</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Días tomados</span>
                            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{info.vacUsed} días</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.round(info.vacUsed / 20 * 100)}%`, background: "rgba(37,99,235,0.5)", borderRadius: 3 }} />
                          </div>

                          {divider}

                          {/* AI section */}
                          <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>✦ Inteligencia Pupi</div>

                          <div style={aiCard}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                              <span style={aiCardLabel}>Tendencia de desempeño</span>
                            </div>
                            <div style={{ color: "#22c55e", fontSize: 13, fontWeight: 500 }}>En crecimiento</div>
                            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 3 }}>+0.3 puntos vs mes anterior</div>
                          </div>

                          <div style={aiCard}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                              <span style={aiCardLabel}>Satisfacción estimada</span>
                            </div>
                            <div style={{ color: "white", fontSize: 13 }}>Alta — 8.4/10</div>
                          </div>

                          <div style={aiCard}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={riskColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                              <span style={aiCardLabel}>Riesgo de renuncia</span>
                            </div>
                            <div style={{ color: riskColor, fontSize: 13, fontWeight: 500 }}>{riskLabel}</div>
                          </div>

                          <div style={aiCard}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                              <span style={aiCardLabel}>Recomendación</span>
                            </div>
                            <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 3 }}>Candidato para ascenso</div>
                            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>Alto desempeño sostenido por 3 meses consecutivos</div>
                          </div>

                          {divider}

                          {/* Notifications button */}
                          <button style={{ width: "100%", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#2563EB", fontSize: 13 }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(37,99,235,0.18)"; e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(37,99,235,0.1)"; e.currentTarget.style.borderColor = "rgba(37,99,235,0.25)" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            Ver notificaciones privadas
                          </button>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          {/* Tabs */}
                          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                            {(["Actividad","Tareas","Evaluaciones","Capacitaciones","Documentos","Feedback","Ausencias"] as const).map(tab => (
                              <button key={tab} onClick={() => setRrhhDetailTab(tab)} style={{ padding: "10px 14px", fontSize: 12, background: "none", border: "none", cursor: "pointer", color: rrhhDetailTab === tab ? "white" : "rgba(255,255,255,0.35)", borderBottom: `2px solid ${rrhhDetailTab === tab ? "#2563EB" : "transparent"}`, transition: "color 0.15s", marginBottom: -1, whiteSpace: "nowrap" as const }}>{tab}</button>
                            ))}
                          </div>

                          <div style={{ flex: 1, overflowY: "auto", padding: "20px 0 20px 4px" }}>

                            {/* ACTIVIDAD TAB */}
                            {rrhhDetailTab === "Actividad" && (
                              <div>
                                {[
                                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, color: "#22c55e", title: "Meta mensual alcanzada al 97%", when: "Hoy" },
                                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>, color: "#2563EB", title: "Evaluación de desempeño completada", when: "Hace 3 días" },
                                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, color: "#a855f7", title: "Capacitación CRM finalizada", when: "Hace 1 semana" },
                                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, color: "#22c55e", title: "8 ventas cerradas este mes", when: "Hace 2 semanas" },
                                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, color: "#2563EB", title: "Ingresó al equipo", when: "Hace 3 años" },
                                ].map((item, i) => (
                                  <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${item.color}15`, border: `1px solid ${item.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div>
                                    <div>
                                      <div style={{ color: "white", fontSize: 13 }}>{item.title}</div>
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 3 }}>{item.when}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* TAREAS TAB */}
                            {rrhhDetailTab === "Tareas" && (
                              <div onClick={() => taskMenuOpenId !== null && setTaskMenuOpenId(null)}>
                                {/* Summary mini cards */}
                                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                                  {[
                                    { label: "Pendientes",  count: taskCount("Pendiente"),  color: "#eab308" },
                                    { label: "En proceso",  count: taskCount("En proceso"),  color: "#2563EB" },
                                    { label: "Completadas", count: taskCount("Completada"), color: "#22c55e" },
                                  ].map(c => (
                                    <div key={c.label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px" }}>
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginBottom: 4 }}>{c.label}</div>
                                      <div style={{ color: c.color, fontSize: 18, fontWeight: 600 }}>{c.count}</div>
                                    </div>
                                  ))}
                                </div>
                                {/* Filter pills */}
                                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const, marginBottom: 14 }}>
                                  {["Todas","Hoy","Esta semana","Pendientes","En proceso","Completadas"].map(f => (
                                    <button key={f} onClick={() => setRrhhTaskFilter(f)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, border: "none", cursor: "pointer", background: rrhhTaskFilter === f ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.05)", color: rrhhTaskFilter === f ? "#2563EB" : "rgba(255,255,255,0.4)", transition: "background 0.15s, color 0.15s" }}>{f}</button>
                                  ))}
                                </div>
                                {/* Task list */}
                                {filteredTasks.map(task => {
                                  const isDone = task.status === "Completada"
                                  const isInProgress = task.status === "En proceso"
                                  const pc = prioColor(task.priority)
                                  const checkBg = isDone ? "#2563EB" : "transparent"
                                  const checkBorder = isDone ? "none" : isInProgress ? "1px solid #2563EB" : "1px solid rgba(255,255,255,0.15)"
                                  return (
                                    <div key={task.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 14px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start", position: "relative" as const }}>
                                      {/* Checkbox */}
                                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: checkBg, border: checkBorder, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                        {isDone && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                      </div>
                                      {/* Content */}
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500, opacity: isDone ? 0.4 : 1, textDecoration: isDone ? "line-through" : "none", marginBottom: 6 }}>{task.name}</div>
                                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const, alignItems: "center" }}>
                                          {/* Due date */}
                                          <span style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", borderRadius: 20, padding: "2px 8px", fontSize: 10 }}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            {task.due}
                                          </span>
                                          {/* Priority */}
                                          <span style={{ background: `${pc}18`, color: pc, borderRadius: 20, padding: "2px 8px", fontSize: 10 }}>{task.priority}</span>
                                          {/* Category */}
                                          <span style={{ background: "rgba(37,99,235,0.1)", color: catColor, borderRadius: 20, padding: "2px 8px", fontSize: 10 }}>{task.cat}</span>
                                        </div>
                                      </div>
                                      {/* Right: assigned by + menu */}
                                      <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Por: {task.by}</span>
                                        <div style={{ position: "relative" as const }}>
                                          <button onClick={e => { e.stopPropagation(); setTaskMenuOpenId(taskMenuOpenId === task.id ? null : task.id) }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}
                                            onMouseEnter={e => (e.currentTarget.style.color = "white")}
                                            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>⋯</button>
                                          {taskMenuOpenId === task.id && (
                                            <div onClick={e => e.stopPropagation()} style={{ position: "absolute" as const, right: 0, top: "100%", background: "#0f1623", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 0", zIndex: 10, minWidth: 140, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                                              {["Marcar completada","Editar","Eliminar"].map((opt, oi) => (
                                                <button key={opt} onClick={() => setTaskMenuOpenId(null)} style={{ display: "block", width: "100%", padding: "8px 14px", background: "none", border: "none", color: oi === 2 ? "#ef4444" : "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", textAlign: "left" as const }}
                                                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                                                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>{opt}</button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                                {/* Assign task button + inline form */}
                                {!showAssignTaskForm && (
                                  <button onClick={() => setShowAssignTaskForm(true)} style={{ marginTop: 8, padding: "7px 14px", fontSize: 13, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 8, color: "#2563EB", cursor: "pointer" }}>+ Asignar tarea</button>
                                )}
                                {showAssignTaskForm && (
                                  <div style={{ marginTop: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                                    <input type="text" placeholder="Descripción de la tarea..." value={newTaskName} onChange={e => setNewTaskName(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const, marginBottom: 10 }} />
                                    <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                                      {["Alta","Media","Baja"].map(p => (
                                        <button key={p} onClick={() => setNewTaskPriority(p)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, border: "none", cursor: "pointer", background: newTaskPriority === p ? `${prioColor(p)}20` : "rgba(255,255,255,0.05)", color: newTaskPriority === p ? prioColor(p) : "rgba(255,255,255,0.4)" }}>{p}</button>
                                      ))}
                                      <select value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value)} style={{ marginLeft: 4, padding: "4px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.6)", fontSize: 11, outline: "none" }}>
                                        {["Ventas","Admin","Capacitación","Otro"].map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                    </div>
                                    <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} style={{ width: "100%", padding: "6px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.6)", fontSize: 12, outline: "none", boxSizing: "border-box" as const, marginBottom: 10 }} />
                                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                      <button onClick={() => { setShowAssignTaskForm(false); setNewTaskName(""); setNewTaskDue("") }} style={{ padding: "6px 14px", fontSize: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Cancelar</button>
                                      <button onClick={() => {
                                        if (rrhhSelectedEmp) handleSaveTask(rrhhSelectedEmp.id)
                                      }} style={{ padding: "6px 14px", fontSize: 12, background: "#2563EB", border: "none", borderRadius: 6, color: "white", cursor: "pointer" }}>Guardar</button>
                                    </div>
                                  </div>
                                )}
                                {/* AI recommendations */}
                                <div style={{ marginTop: 20 }}>
                                  <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 10 }}>✦ Distribución sugerida por Pupi</div>
                                  {[
                                    { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title: "Carlos está sobrecargado", body: "Tiene 12 tareas pendientes vs promedio de 6. Reasignar 3 tareas a María Ruiz que tiene capacidad.", cta: "Redistribuir →" },
                                    { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title: "2 tareas llevan más de 5 días sin movimiento", body: "Recordar a JP sobre propuesta Tech Solutions y seguimiento Retail Express.", cta: "Enviar recordatorio →" },
                                  ].map((rec, i) => (
                                    <div key={i} style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                        {rec.icon}
                                        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{rec.title}</span>
                                      </div>
                                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.5, marginBottom: 6 }}>{rec.body}</div>
                                      <div style={{ color: "#2563EB", fontSize: 11, cursor: "pointer" }}>{rec.cta}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* EVALUACIONES TAB */}
                            {rrhhDetailTab === "Evaluaciones" && (
                              <div>
                                {[
                                  { title: "Evaluación Q1 2026", date: "15 Enero 2026", score: "4.8/5", criteria: [["Productividad",4.8],["Trabajo en equipo",4.2],["Comunicación",4.7],["Iniciativa",4.5],["Cumplimiento",5.0],["Actitud",4.8]], comment: "Excelente rendimiento trimestral. Destacó en cumplimiento de metas y actitud proactiva." },
                                  { title: "Evaluación Q4 2025", date: "20 Octubre 2025", score: "4.6/5", criteria: [["Productividad",4.5],["Trabajo en equipo",4.3],["Comunicación",4.4],["Iniciativa",4.7],["Cumplimiento",4.8],["Actitud",4.9]], comment: "Muy buen desempeño. Mejoró notablemente en iniciativa respecto al trimestre anterior." },
                                  { title: "Evaluación Q3 2025", date: "15 Julio 2025", score: "4.4/5", criteria: [["Productividad",4.3],["Trabajo en equipo",4.5],["Comunicación",4.2],["Iniciativa",4.1],["Cumplimiento",4.6],["Actitud",4.8]], comment: "Buen trabajo en equipo. Oportunidad de mejora en comunicación con clientes." },
                                ].map((ev, i) => (
                                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16, marginBottom: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                      <div>
                                        <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{ev.title}</div>
                                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>{ev.date}</div>
                                      </div>
                                      <span style={{ background: "rgba(37,99,235,0.1)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 500 }}>{ev.score}</span>
                                    </div>
                                    {(ev.criteria as [string, number][]).map(([label, val]) => (
                                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, width: 120, flexShrink: 0 }}>{label}</span>
                                        <div style={{ width: 80, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden", flexShrink: 0 }}>
                                          <div style={{ height: "100%", width: `${val / 5 * 100}%`, background: "rgba(37,99,235,0.6)", borderRadius: 2 }} />
                                        </div>
                                        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{val.toFixed(1)}</span>
                                      </div>
                                    ))}
                                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontStyle: "italic" as const, marginTop: 8 }}>{ev.comment}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* CAPACITACIONES TAB */}
                            {rrhhDetailTab === "Capacitaciones" && (
                              <div>
                                {[
                                  { name: "Capacitación CRM Pupi AI",          duration: "4 horas",  date: "Completada hace 1 semana", pct: 100, status: "done"       },
                                  { name: "Técnicas de cierre de ventas",       duration: "8 horas",  date: "Completada hace 1 mes",    pct: 100, status: "done"       },
                                  { name: "Negociación avanzada",               duration: "12 horas", date: "En progreso",              pct: 65,  status: "inprogress" },
                                  { name: "Liderazgo y comunicación",           duration: "6 horas",  date: "Pendiente",                pct: 0,   status: "pending"    },
                                ].map((tr, i) => (
                                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: tr.status === "done" ? "#22c55e" : tr.status === "inprogress" ? "#2563EB" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{tr.name}</div>
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>{tr.duration} · {tr.date}</div>
                                    </div>
                                    <span style={{ background: tr.status === "done" ? "rgba(34,197,94,0.1)" : tr.status === "inprogress" ? "rgba(37,99,235,0.1)" : "rgba(255,255,255,0.05)", color: tr.status === "done" ? "#22c55e" : tr.status === "inprogress" ? "#2563EB" : "rgba(255,255,255,0.6)", borderRadius: 6, padding: "2px 8px", fontSize: 11, flexShrink: 0 }}>{tr.pct}%</span>
                                  </div>
                                ))}
                                <button style={{ marginTop: 16, padding: "7px 14px", fontSize: 13, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 8, color: "#2563EB", cursor: "pointer" }}>+ Asignar capacitación</button>
                              </div>
                            )}

                            {/* DOCUMENTOS TAB */}
                            {rrhhDetailTab === "Documentos" && (
                              <div>
                                {[
                                  { name: "contrato-laboral.pdf",               size: "340 KB" },
                                  { name: "acuerdo-confidencialidad.pdf",        size: "128 KB" },
                                  { name: "evaluacion-q1-2026.pdf",              size: "89 KB"  },
                                ].map((doc, i) => (
                                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ color: "white", fontSize: 13 }}>{doc.name}</div>
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>{doc.size}</div>
                                    </div>
                                    <button style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 10px", color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer" }}>↓</button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* FEEDBACK TAB */}
                            {rrhhDetailTab === "Feedback" && (
                              <div>
                                {[
                                  { from: "Dueño", fromInit: "D", to: emp.initials, text: "Excelente trabajo este mes. Seguí así con los cierres.", when: "Hace 3 días" },
                                  { from: emp.initials, fromInit: emp.initials, to: "Dueño", text: "Necesitaría apoyo con la propuesta de Tech Solutions.", when: "Hace 5 días" },
                                  { from: "Dueño", fromInit: "D", to: emp.initials, text: "Bien manejado el cliente Distribuidora Norte.", when: "Hace 2 semanas" },
                                ].map((fb, i) => (
                                  <div key={i} style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 9, fontWeight: 500 }}>{fb.fromInit.slice(0,2)}</div>
                                      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{fb.from}</span>
                                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>→</span>
                                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 9, fontWeight: 500 }}>{fb.to.slice(0,2)}</div>
                                      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{fb.to}</span>
                                      <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.55)", fontSize: 11 }}>{fb.when}</span>
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, paddingLeft: 26 }}>{fb.text}</div>
                                  </div>
                                ))}
                                <button style={{ padding: "7px 14px", fontSize: 13, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 8, color: "#2563EB", cursor: "pointer" }}>+ Dar feedback</button>
                              </div>
                            )}

                            {/* AUSENCIAS TAB */}
                            {rrhhDetailTab === "Ausencias" && (
                              <div>
                                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                                  {[["Ausencias","2 este mes"],["Tardanzas","0 este mes"],["Licencias","0 activas"]].map(([label, val]) => (
                                    <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px" }}>
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                                      <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{val}</div>
                                    </div>
                                  ))}
                                </div>
                                {[
                                  { type: "Ausencia justificada", date: "15 Abril", duration: "1 día", status: "Aprobada" },
                                  { type: "Ausencia justificada", date: "3 Marzo",  duration: "1 día", status: "Aprobada" },
                                ].map((ab, i) => (
                                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ color: "white", fontSize: 13 }}>{ab.type}</div>
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>{ab.date} · {ab.duration}</div>
                                    </div>
                                    <span style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{ab.status}</span>
                                  </div>
                                ))}
                                <button style={{ marginTop: 16, padding: "7px 14px", fontSize: 13, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 8, color: "#2563EB", cursor: "pointer" }}>+ Registrar ausencia</button>
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
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", flexShrink: 0 }}>
                        <div style={{ display: "flex", gap: 0 }}>
                          {(["Equipo","Organigrama","Clima laboral","Sueldos","Resumen semanal"] as const).map(nav => (
                            <button key={nav} onClick={() => setRrhhNavTab(nav)} style={{ padding: "12px 16px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: rrhhNavTab === nav ? "white" : "rgba(255,255,255,0.35)", borderBottom: `2px solid ${rrhhNavTab === nav ? "#2563EB" : "transparent"}`, transition: "color 0.15s, border-color 0.15s", marginBottom: -1 }}>{nav}</button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => { fetchEmployees(); fetchTasks() }}
                          title="Actualizar"
                          style={{ padding: "7px 10px", fontSize: 13, background: "none", color: "rgba(255,255,255,0.4)", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s", marginBottom: -1 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>

                      {/* Organigrama tab */}
                      {rrhhNavTab === "Organigrama" && (() => {
                        type OrgMember = { id: number; initials: string; name: string; role: string; alert: string; status: string }
                        type OrgArea = { id: string; label: string; leader: { id: number; initials: string; name: string; role: string }; members: (OrgMember | { id: -1; vacant: true })[] }
                        const orgAreas: OrgArea[] = [
                          {
                            id: "ventas", label: "Ventas",
                            leader: { id: 1, initials: "JP", name: "Juan Pérez",     role: "Líder" },
                            members: [
                              { id: 2, initials: "CA", name: "Carlos Acosta",  role: "Vendedor",      alert: "Sobrecargado",   status: "Activo"   },
                              { id: 3, initials: "MR", name: "María Ruiz",     role: "Vendedora",     alert: "",               status: "Activo"   },
                              { id: -1, vacant: true },
                            ],
                          },
                          {
                            id: "marketing", label: "Marketing",
                            leader: { id: 4, initials: "AG", name: "Ana González",   role: "Líder" },
                            members: [],
                          },
                          {
                            id: "operaciones", label: "Operaciones",
                            leader: { id: 6, initials: "LS", name: "Laura Sánchez",  role: "Líder" },
                            members: [
                              { id: 7, initials: "DT", name: "Diego Torres",   role: "Asistente",     alert: "Bajo desempeño", status: "Activo"   },
                              { id: 8, initials: "SR", name: "Sofía Reyes",    role: "Analista",      alert: "",               status: "Activo"   },
                              { id: 5, initials: "PM", name: "Pedro Martínez", role: "Administrativo",alert: "",               status: "Licencia" },
                            ],
                          },
                        ]
                        const alertDotColor = (alert: string) => alert === "Riesgo renuncia" ? "#ef4444" : alert === "Bajo desempeño" ? "#ef4444" : alert === "Sobrecargado" ? "#eab308" : null
                        const connV = (h = 24) => <div style={{ width: 1, height: h, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                        const connLine = "1px solid rgba(255,255,255,0.08)"
                        const nodeBase: React.CSSProperties = { position: "relative", textAlign: "center" as const, borderRadius: 12, userSelect: "none" as const }
                        const OwnerNode = () => (
                          <div style={{ ...nodeBase, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.4)", padding: "14px 20px", minWidth: 160 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(37,99,235,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 14, fontWeight: 500, margin: "0 auto" }}>D</div>
                            <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginTop: 8 }}>Propietario</div>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>Dueño del negocio</div>
                            <span style={{ display: "inline-block", background: "rgba(37,99,235,0.2)", color: "#2563EB", fontSize: 10, borderRadius: 20, padding: "2px 8px", marginTop: 6 }}>Dueño</span>
                          </div>
                        )
                        const AreaNode = ({ area }: { area: OrgArea }) => {
                          const emp = EMPLOYEES.find(e => e.name === area.leader.name)
                          const dot = alertDotColor(emp?.alert ?? "")
                          return (
                            <div
                              style={{ ...nodeBase, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px 16px", minWidth: 160, cursor: "pointer" }}
                              onClick={() => { if (emp) { setRrhhSelectedEmp(emp); setRrhhView("detail"); setRrhhDetailTab("Actividad") } }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)" }}
                              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)" }}>
                              {dot && <div title={emp?.alert} style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: "50%", background: dot, border: "2px solid #0D0D14" }} />}
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 14, fontWeight: 500, margin: "0 auto" }}>{area.leader.initials}</div>
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginTop: 8 }}>{area.leader.name}</div>
                              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>{area.label}</div>
                              <span style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#2563EB", fontSize: 10, borderRadius: 20, padding: "2px 8px", marginTop: 6 }}>Líder</span>
                            </div>
                          )
                        }
                        const MemberNode = ({ m }: { m: OrgMember }) => {
                          const emp = EMPLOYEES.find(e => e.name === m.name)
                          const dot = alertDotColor(m.alert)
                          const isLicencia = m.status === "Licencia"
                          return (
                            <div
                              style={{ ...nodeBase, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", minWidth: 130, cursor: "pointer" }}
                              onClick={() => { if (emp) { setRrhhSelectedEmp(emp); setRrhhView("detail"); setRrhhDetailTab("Actividad") } }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(37,99,235,0.3)" }}
                              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}>
                              {dot && <div title={m.alert} style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: "50%", background: dot, border: "2px solid #0D0D14" }} />}
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 11, fontWeight: 500, margin: "0 auto" }}>{m.initials}</div>
                              <div style={{ color: "white", fontSize: 12, fontWeight: 500, marginTop: 6 }}>{m.name}</div>
                              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>{m.role}</div>
                              {isLicencia && <span style={{ display: "inline-block", background: "rgba(234,179,8,0.1)", color: "#eab308", fontSize: 9, borderRadius: 20, padding: "1px 6px", marginTop: 4 }}>Licencia</span>}
                            </div>
                          )
                        }
                        const VacantNode = () => (
                          <div style={{ ...nodeBase, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 14px", minWidth: 130, cursor: "pointer" }}>
                            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 20, lineHeight: 1 }}>+</div>
                            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 6 }}>Posición vacante</div>
                            <div style={{ color: "#2563EB", fontSize: 10, marginTop: 4 }}>Buscar candidato →</div>
                          </div>
                        )
                        // H-connector for N branches: left arm, N-2 middle arms, right arm
                        const HConn = ({ count, h = 20 }: { count: number; h?: number }) => (
                          <div style={{ display: "flex", width: "100%", flexShrink: 0 }}>
                            {Array.from({ length: count }).map((_, i) => (
                              <div key={i} style={{ flex: 1, height: h, borderTop: connLine, borderRight: i < count - 1 ? connLine : "none", borderLeft: i > 0 ? connLine : "none" }} />
                            ))}
                          </div>
                        )
                        return (
                          <div style={{ flex: 1, overflow: "auto", padding: 24, position: "relative" }}>
                            {/* Top bar */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                              <div>
                                <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Organigrama</div>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>Estructura actual del equipo</div>
                              </div>
                              <button style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Editar estructura
                              </button>
                            </div>

                            {/* Tree container */}
                            <div style={{ transform: `scale(${rrhhOrgZoom / 100})`, transformOrigin: "top center", display: "inline-flex", flexDirection: "column", alignItems: "center", minWidth: "100%" }}>

                              {/* LEVEL 1: Owner */}
                              <OwnerNode />
                              {connV(32)}

                              {/* L1→L2 H connector */}
                              <div style={{ display: "flex", width: "100%", flexShrink: 0 }}>
                                <div style={{ flex: 1, height: 20, borderTop: connLine, borderRight: connLine }} />
                                <div style={{ flex: 1, height: 20, borderTop: connLine }} />
                                <div style={{ flex: 1, height: 20, borderTop: connLine, borderLeft: connLine }} />
                              </div>

                              {/* LEVEL 2: Area leaders row */}
                              <div style={{ display: "flex", width: "100%", alignItems: "flex-start" }}>
                                {orgAreas.map((area, ai) => (
                                  <div key={area.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 32px" }}>
                                    <AreaNode area={area} />

                                    {area.members.length > 0 ? (
                                      <>
                                        {connV(24)}
                                        {/* L2→L3 H connector */}
                                        <HConn count={area.members.length} h={16} />
                                        {/* LEVEL 3: members row */}
                                        <div style={{ display: "flex", width: "100%", alignItems: "flex-start" }}>
                                          {area.members.map((m, mi) => (
                                            <div key={mi} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 8px" }}>
                                              {connV(16)}
                                              {"vacant" in m ? <VacantNode /> : <MemberNode m={m} />}
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    ) : (
                                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontStyle: "italic" as const, marginTop: 20, paddingTop: 4 }}>Sin equipo a cargo</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Zoom controls */}
                            <div style={{ position: "absolute", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 4 }}>
                              {(["+", "−"] as const).map(sym => (
                                <button key={sym} onClick={() => setRrhhOrgZoom(z => sym === "+" ? Math.min(z + 10, 150) : Math.max(z - 10, 50))} style={{ width: 32, height: 32, background: "rgba(10,10,20,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "white", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{sym}</button>
                              ))}
                            </div>

                            {/* Legend */}
                            <div style={{ position: "absolute", bottom: 24, left: 24, background: "rgba(10,10,20,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 14px" }}>
                              {[
                                { sample: <div style={{ width: 24, height: 16, borderRadius: 4, border: "1px solid rgba(37,99,235,0.4)", background: "rgba(37,99,235,0.15)" }} />, label: "Dueño" },
                                { sample: <div style={{ width: 24, height: 16, borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }} />, label: "Líder de área" },
                                { sample: <div style={{ width: 20, height: 14, borderRadius: 4, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }} />, label: "Empleado" },
                                { sample: <div style={{ width: 20, height: 14, borderRadius: 4, border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }} />, label: "Vacante" },
                              ].map(({ sample, label }) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                  {sample}
                                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Clima laboral tab */}
                      {rrhhNavTab === "Clima laboral" && (() => {
                        const DIMS = [
                          { name: "Satisfacción general",    score: 8.4 },
                          { name: "Comunicación interna",    score: 7.2 },
                          { name: "Carga de trabajo",        score: 6.1 },
                          { name: "Reconocimiento",          score: 7.8 },
                          { name: "Desarrollo profesional",  score: 8.1 },
                          { name: "Relación con líderes",    score: 7.5 },
                        ]
                        const EMP_SAT = [
                          { initials: "JP", name: "Juan Pérez",      score: 8.4, trend: "↑" },
                          { initials: "CA", name: "Carlos Acosta",   score: 6.2, trend: "↓" },
                          { initials: "MR", name: "María Ruiz",      score: 7.9, trend: "↑" },
                          { initials: "AG", name: "Ana González",    score: 8.8, trend: "↑" },
                          { initials: "LS", name: "Laura Sánchez",   score: 5.4, trend: "↓" },
                          { initials: "DT", name: "Diego Torres",    score: 6.8, trend: "↓" },
                          { initials: "SR", name: "Sofía Reyes",     score: 8.6, trend: "↑" },
                        ]
                        const dimColor = (s: number) => s >= 8 ? "#22c55e" : s >= 6 ? "#2563EB" : "#ef4444"
                        const trendColor = (t: string) => t === "↑" ? "#22c55e" : t === "↓" ? "#ef4444" : "rgba(255,255,255,0.6)"
                        // SVG chart points — 6 weeks: 6.8 7.1 7.4 7.2 7.6 7.8 scaled to viewBox 500x60
                        const weeks = [6.8, 7.1, 7.4, 7.2, 7.6, 7.8]
                        const minV = 6.5, maxV = 8.0
                        const ptX = (i: number) => 30 + i * 88
                        const ptY = (v: number) => 54 - ((v - minV) / (maxV - minV)) * 48
                        const pts = weeks.map((v, i) => ({ x: ptX(i), y: ptY(v) }))
                        const cubicPath = pts.reduce((acc, pt, i) => {
                          if (i === 0) return `M ${pt.x} ${pt.y}`
                          const prev = pts[i - 1]
                          const cx1 = prev.x + (pt.x - prev.x) / 3
                          const cx2 = pt.x - (pt.x - prev.x) / 3
                          return `${acc} C ${cx1} ${prev.y} ${cx2} ${pt.y} ${pt.x} ${pt.y}`
                        }, "")
                        const detectWorkloadLevel = () => {
                          const pendingTasks = realTasks.filter(
                            t => t.status === 'Pendiente' || t.status === 'En proceso'
                          ).length
                          const avgTasksPerEmployee = realEmployees.length > 0
                            ? pendingTasks / realEmployees.length
                            : 0
                          return {
                            isHigh: avgTasksPerEmployee > 4 || climateThermometers.carga > 80,
                            level: avgTasksPerEmployee > 6 ? 'crítica' : avgTasksPerEmployee > 4 ? 'alta' : 'normal',
                            pendingTasks,
                            avgPerEmployee: Math.round(avgTasksPerEmployee)
                          }
                        }
                        const workload = detectWorkloadLevel()
                        const thermoColor = (key: string, value: number): string => {
                          const inverted = key === 'carga' || key === 'burnout'
                          if (!inverted) {
                            if (value >= 80) return '#22c55e'
                            if (value >= 60) return '#2563EB'
                            if (value >= 40) return '#eab308'
                            return '#ef4444'
                          } else {
                            if (value <= 40) return '#22c55e'
                            if (value <= 60) return '#eab308'
                            if (value <= 80) return '#f97316'
                            return '#ef4444'
                          }
                        }
                        const thermoLabel = (key: string, value: number): string => {
                          const inverted = key === 'carga' || key === 'burnout'
                          if (!inverted) {
                            if (value >= 80) return 'Excelente'
                            if (value >= 60) return 'Bien'
                            if (value >= 40) return 'Atención'
                            return 'Crítico'
                          } else {
                            if (value <= 40) return 'Normal'
                            if (value <= 60) return 'Moderada'
                            if (value <= 80) return 'Alta'
                            return 'Crítica'
                          }
                        }
                        const THERMOS: { key: keyof typeof climateThermometers; label: string }[] = [
                          { key: 'motivacion',    label: 'MOTIVACIÓN' },
                          { key: 'satisfaccion',  label: 'SATISFACCIÓN' },
                          { key: 'productividad', label: 'PRODUCTIVIDAD' },
                          { key: 'ideas',         label: 'IDEAS' },
                          { key: 'eficacia',      label: 'EFICACIA' },
                          { key: 'carga',         label: 'CARGA' },
                          { key: 'burnout',       label: 'RIESGO BURNOUT' },
                        ]
                        return (
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            {/* Survey modal */}
                            {showSurveyModal && (
                              <div style={{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(e) => { if (e.target === e.currentTarget) setShowSurveyModal(false) }}>
                                <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: 480, maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto" }}>
                                  <div style={{ color: "white", fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Enviar encuesta de clima</div>
                                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 20 }}>Los empleados recibirán una notificación para responder</div>
                                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 12 }}>Preguntas de la encuesta</div>
                                  {[
                                    "¿Cómo te sentís con tu carga de trabajo esta semana?",
                                    "¿Te sentís motivado/a con lo que estás haciendo?",
                                    "¿Tenés todo lo que necesitás para hacer bien tu trabajo?",
                                    "¿Cómo está tu nivel de energía y bienestar general?",
                                    "¿Hay algo que te esté frenando o preocupando?",
                                  ].map((q, i) => (
                                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, flexShrink: 0 }}>{i + 1}</div>
                                      <div style={{ color: "white", fontSize: 13 }}>{q}</div>
                                    </div>
                                  ))}
                                  <div style={{ marginTop: 16 }}>
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>Se enviará a</div>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, alignItems: "center" }}>
                                      {realEmployees.slice(0, 6).map((emp: any) => (
                                        <div key={emp.id} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 10, fontWeight: 500 }}>{emp.initials || emp.name?.slice(0,2).toUpperCase()}</div>
                                      ))}
                                      {realEmployees.length > 6 && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>+{realEmployees.length - 6} más</div>}
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 8 }}>{realEmployees.length} empleados recibirán la encuesta</div>
                                  </div>
                                  <div style={{ marginTop: 16 }}>
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Respuestas anónimas</div>
                                    <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, padding: 12, display: "flex", gap: 8 }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Las respuestas son anónimas. El dueño ve los resultados agregados, no individuales.</div>
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                                    <button onClick={() => setShowSurveyModal(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "9px 18px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                                    <button onClick={() => {
                                      setShowSurveyModal(false)
                                      setSurveyStatus('collecting')
                                      setSurveyResponses(0)
                                      setShowSurveyAlert(false)
                                      setClimateSubTab('encuestas')
                                      setTimeout(() => setSurveyResponses(2), 3000)
                                      setTimeout(() => setSurveyResponses(4), 6000)
                                      setTimeout(() => setSurveyResponses(realEmployees.length || 5), 9000)
                                      setTimeout(() => {
                                        setSurveyStatus('done')
                                        setClimateThermometers(prev => ({ ...prev, satisfaccion: 74, motivacion: 76, carga: 78 }))
                                      }, 10000)
                                    }} style={{ background: "#eab308", color: "#000000", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Enviar encuesta →</button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Fixed header */}
                            <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <div>
                                  <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Clima laboral</div>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>Última actualización: hoy</div>
                                </div>
                                <button onClick={() => setShowSurveyModal(true)} style={{ padding: "7px 14px", fontSize: 13, background: "#2563EB", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Enviar encuesta</button>
                              </div>
                              {/* Sub-tabs */}
                              <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                {([ ['indice', 'Índice'], ['equipo', 'Equipo'], ['encuestas', 'Encuestas'] ] as const).map(([tab, label]) => {
                                  const active = climateSubTab === tab
                                  return (
                                    <button key={tab} onClick={() => setClimateSubTab(tab)} style={{ padding: "10px 16px", fontSize: 12, background: "none", border: "none", cursor: "pointer", color: active ? "white" : "rgba(255,255,255,0.35)", borderBottom: `2px solid ${active ? "#2563EB" : "transparent"}`, transition: "color 0.15s, border-color 0.15s", marginBottom: -1, display: "flex", alignItems: "center", gap: 5 }}>
                                      {label}
                                      {tab === 'encuestas' && showSurveyAlert && surveyStatus === 'idle' && (
                                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#eab308", display: "inline-block", flexShrink: 0 }} />
                                      )}
                                      {tab === 'encuestas' && surveyStatus === 'collecting' && (
                                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB", display: "inline-block", flexShrink: 0 }} />
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Scrollable content */}
                            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

                              {/* ── ÍNDICE TAB ── */}
                              {climateSubTab === 'indice' && (
                                <>
                                  <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 14, padding: 24, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div>
                                      <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>✦ Índice de clima laboral</div>
                                      <div style={{ lineHeight: 1 }}>
                                        <span style={{ color: "white", fontSize: 48, fontWeight: 600 }}>7.8</span>
                                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 24, marginLeft: 4 }}>/10</span>
                                      </div>
                                      <div style={{ color: "#22c55e", fontSize: 12, marginTop: 6 }}>↑ 0.4 vs semana anterior</div>
                                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>Clima positivo</div>
                                    </div>
                                    <div style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", background: "conic-gradient(#2563EB 0deg 281deg, rgba(255,255,255,0.06) 281deg 360deg)", flexShrink: 0 }}>
                                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 60, height: 60, borderRadius: "50%", background: "#0D0D14", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 500 }}>78%</div>
                                    </div>
                                  </div>
                                  <div style={{ marginBottom: 24 }}>
                                    <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Por dimensión</div>
                                    {DIMS.map(d => {
                                      const c = dimColor(d.score)
                                      return (
                                        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                          <span style={{ color: "white", fontSize: 13, width: 160, flexShrink: 0 }}>{d.name}</span>
                                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${d.score / 10 * 100}%`, background: c, borderRadius: 3 }} />
                                          </div>
                                          <span style={{ color: c, fontSize: 12, fontWeight: 500, width: 28, textAlign: "right" as const }}>{d.score.toFixed(1)}</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                  <div style={{ marginBottom: 24 }}>
                                    <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>✦ Correlación satisfacción vs productividad</div>
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 16 }}>Detectada por Pupi AI</div>
                                    <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 10, padding: 16 }}>
                                      <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Empleados satisfechos (+7/10)</div>
                                          <div style={{ color: "#22c55e", fontSize: 24, fontWeight: 600 }}>94%</div>
                                          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>cumplimiento de metas</div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Empleados insatisfechos (-6/10)</div>
                                          <div style={{ color: "#ef4444", fontSize: 24, fontWeight: 600 }}>61%</div>
                                          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>cumplimiento de metas</div>
                                        </div>
                                      </div>
                                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.6 }}>
                                        Los empleados con mayor satisfacción tienen un 54% más de cumplimiento de metas. Mejorar el clima laboral impacta directamente en resultados.
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ marginBottom: 24 }}>
                                    <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Evolución semanal del clima</div>
                                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "16px 16px 8px" }}>
                                      <svg viewBox="0 0 500 60" width="100%" height="60" style={{ display: "block" }}>
                                        <path d={cubicPath} fill="none" stroke="#2563EB" strokeWidth="2" />
                                        {pts.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#2563EB" />)}
                                      </svg>
                                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
                                        {["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6"].map(l => (
                                          <span key={l} style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, flex: 1, textAlign: "center" as const }}>{l}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* ── EQUIPO TAB ── */}
                              {climateSubTab === 'equipo' && (
                                <>
                                  <div style={{ marginBottom: 24 }}>
                                    <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>✦ Alertas de Pupi AI</div>
                                    {[
                                      { color: "#ef4444", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, title: "Laura Sánchez — Riesgo de renuncia", body: "Satisfacción cayó 1.8 puntos en las últimas 3 semanas. Historial muestra patrón previo a renuncias anteriores.", cta: "Hablar con Laura esta semana →" },
                                      { color: "#eab308", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title: "Carlos Acosta — Sobrecargado", body: "Tiene 12 tareas pendientes, 40% más que el promedio del equipo. Productividad bajó un 15% esta semana.", cta: "Redistribuir tareas →" },
                                      { color: "#f97316", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: "Posible tensión en área de Ventas", body: "Comunicación entre JP y CA disminuyó un 60% en los últimos 10 días según registro de interacciones.", cta: "Ver detalles →" },
                                    ].map((alert, i) => (
                                      <div key={i} style={{ display: "flex", gap: 12, background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${alert.color}`, borderTop: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 10px 10px 0", padding: "14px 16px", marginBottom: 8 }}>
                                        <div style={{ flexShrink: 0, marginTop: 1 }}>{alert.icon}</div>
                                        <div>
                                          <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{alert.title}</div>
                                          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{alert.body}</div>
                                          <div style={{ color: alert.color, fontSize: 11, marginTop: 8, cursor: "pointer" }}>{alert.cta}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ marginBottom: 24 }}>
                                    <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Satisfacción por empleado</div>
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 16 }}>Basado en últimas encuestas</div>
                                    {EMP_SAT.map(e => {
                                      const c = dimColor(e.score)
                                      return (
                                        <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{e.initials}</div>
                                          <span style={{ color: "white", fontSize: 13, flex: 1 }}>{e.name}</span>
                                          <div style={{ width: 120, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden", flexShrink: 0 }}>
                                            <div style={{ height: "100%", width: `${e.score / 10 * 100}%`, background: c, borderRadius: 2 }} />
                                          </div>
                                          <span style={{ color: c, fontSize: 12, fontWeight: 500, width: 40, textAlign: "right" as const, flexShrink: 0 }}>{e.score.toFixed(1)}/10</span>
                                          <span style={{ color: trendColor(e.trend), fontSize: 12, flexShrink: 0, width: 16, textAlign: "center" as const }}>{e.trend}</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </>
                              )}

                              {/* ── ENCUESTAS TAB ── */}
                              {climateSubTab === 'encuestas' && (
                                <div>
                                  {showSurveyAlert && surveyStatus === 'idle' && (
                                    <div style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ color: "#eab308", fontSize: 12, textTransform: "uppercase" as const, fontWeight: 500, marginBottom: 6, letterSpacing: "0.05em" }}>✦ Pupi detectó alta carga de trabajo</div>
                                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>El equipo tiene una carga de trabajo elevada esta semana. Es un buen momento para enviar una encuesta rápida y saber cómo se están sintiendo antes de que afecte la productividad.</div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                          <button onClick={() => setShowSurveyModal(true)} style={{ background: "#eab308", color: "#000000", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Enviar encuesta ahora</button>
                                          <button onClick={() => setShowSurveyAlert(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", borderRadius: 6, padding: "7px 16px", fontSize: 12, cursor: "pointer" }}>Ignorar por ahora</button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {surveyStatus === 'collecting' && (
                                    <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <div>
                                        <div style={{ color: "#2563EB", fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 }}>✦ Encuesta en curso</div>
                                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 8 }}>{surveyResponses} de {realEmployees.length} empleados respondieron</div>
                                        <div style={{ width: 200, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                                          <div style={{ height: "100%", width: `${realEmployees.length > 0 ? (surveyResponses / realEmployees.length) * 100 : 0}%`, background: "#2563EB", borderRadius: 2, transition: "width 0.5s ease" }} />
                                        </div>
                                      </div>
                                      <button style={{ border: "1px solid rgba(37,99,235,0.3)", color: "#2563EB", background: "transparent", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Ver respuestas →</button>
                                    </div>
                                  )}
                                  {surveyStatus === 'done' && (
                                    <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                        <div>
                                          <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>Encuesta completada — {realEmployees.length} respuestas</div>
                                          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>Los termómetros se actualizaron con los resultados</div>
                                        </div>
                                      </div>
                                      <button onClick={() => { setSurveyStatus('idle'); setShowSurveyAlert(true) }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.5)", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Nueva encuesta</button>
                                    </div>
                                  )}

                                  {/* Thermometers as survey results */}
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>Termómetros de clima</div>
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Actualizado con última encuesta</div>
                                  </div>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
                                    {THERMOS.map(({ key, label }) => {
                                      const value = climateThermometers[key]
                                      const color = thermoColor(key, value)
                                      const statusLabel = thermoLabel(key, value)
                                      return (
                                        <div key={key} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 14px", textAlign: "center" as const }}>
                                          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>{label}</div>
                                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, margin: "0 auto" }}>
                                            <div style={{ width: 12, height: 80, background: "rgba(255,255,255,0.06)", borderRadius: "6px 6px 0 0", position: "relative" as const, overflow: "hidden", margin: "0 auto" }}>
                                              <div style={{ position: "absolute" as const, bottom: 0, left: 0, width: "100%", borderRadius: "6px 6px 0 0", height: `${value}%`, background: color, transition: "height 800ms ease" }} />
                                            </div>
                                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}`, marginTop: -2, flexShrink: 0 }} />
                                          </div>
                                          <div style={{ fontSize: 18, fontWeight: 600, color, marginTop: 8 }}>{value}%</div>
                                          <div style={{ fontSize: 10, color }}>{statusLabel}</div>
                                        </div>
                                      )
                                    })}
                                  </div>

                                  <div style={{ marginBottom: 24 }}>
                                  <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Última encuesta enviada</div>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 16 }}>Hace 3 días · 7 de 8 respondieron</div>
                                  {[
                                    { q: "¿Cómo te sentiste esta semana en el trabajo?", score: 7.6 },
                                    { q: "¿Sentís que tu trabajo es valorado?",           score: 7.1 },
                                    { q: "¿Tenés todo lo que necesitás para hacer bien tu trabajo?", score: 8.1 },
                                  ].map((item, i) => {
                                    const c = dimColor(item.score)
                                    return (
                                      <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14, marginBottom: 8 }}>
                                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 10 }}>{item.q}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${item.score / 10 * 100}%`, background: c, borderRadius: 3 }} />
                                          </div>
                                          <span style={{ color: c, fontSize: 12, fontWeight: 500, flexShrink: 0 }}>{item.score.toFixed(1)}</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                  <div style={{ color: "#2563EB", fontSize: 12, marginTop: 8, cursor: "pointer" }}>Ver respuestas completas →</div>
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>
                        )
                      })()}

                      {/* Sueldos tab */}
                      {rrhhNavTab === "Sueldos" && (() => {
                        type PayRow = { id: number; name: string; initials: string; role: string; bruto: number; comision: number }
                        const PAYROLL: PayRow[] = [
                          { id: 1, name: "Juan Pérez",      initials: "JP", role: "Vendedor Senior",    bruto: 280000, comision: 3890 },
                          { id: 2, name: "Carlos Acosta",   initials: "CA", role: "Vendedor",           bruto: 220000, comision: 2496 },
                          { id: 3, name: "María Ruiz",      initials: "MR", role: "Vendedora",          bruto: 220000, comision: 2034 },
                          { id: 4, name: "Ana González",    initials: "AG", role: "Analista Marketing", bruto: 240000, comision: 0    },
                          { id: 5, name: "Pedro Martínez",  initials: "PM", role: "Administrativo",     bruto: 200000, comision: 0    },
                          { id: 6, name: "Laura Sánchez",   initials: "LS", role: "Coordinadora",       bruto: 260000, comision: 0    },
                          { id: 7, name: "Diego Torres",    initials: "DT", role: "Asistente",          bruto: 160000, comision: 0    },
                          { id: 8, name: "Sofía Reyes",     initials: "SR", role: "Analista Ops",       bruto: 230000, comision: 0    },
                        ]
                        const fmt = (n: number) => "$" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                        const ded30 = (b: number) => Math.round(b * 0.30)
                        const netOf = (b: number) => b - ded30(b)
                        const calc = (r: PayRow) => {
                          const ant = Math.round(r.bruto * 0.05)
                          const pres = 8000
                          const totalH = r.bruto + ant + pres
                          const jub   = Math.round(totalH * 0.11)
                          const obra  = Math.round(totalH * 0.03)
                          const pami  = Math.round(totalH * 0.03)
                          const sind  = Math.round(totalH * 0.02)
                          const totalD = jub + obra + pami + sind
                          return { ant, pres, totalH, jub, obra, pami, sind, totalD, netoF: totalH - totalD + r.comision }
                        }
                        const stSty = (s: string) => s === "Liquidado" ? { bg: "rgba(34,197,94,0.1)",  color: "#22c55e", border: "rgba(34,197,94,0.2)"  }
                                                    : s === "En proceso" ? { bg: "rgba(37,99,235,0.1)", color: "#2563EB", border: "rgba(37,99,235,0.2)"  }
                                                    :                      { bg: "rgba(234,179,8,0.1)", color: "#eab308", border: "rgba(234,179,8,0.2)"  }
                        const totalBruto = totalGrossSalary
                        const totalCargas = Math.round(totalSocialCharges)
                        const totalCosto  = totalCost
                        const totalNeto   = Math.round(totalNet)
                        const gridCols = "2fr 1fr 1fr 1fr 1fr 1fr 1fr"
                        const selRow  = PAYROLL.find(r => r.id === payrollSelectedId) ?? null
                        const selCalc = selRow ? calc(selRow) : null
                        const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
                          <div onClick={onToggle} style={{ width: 36, height: 20, borderRadius: 10, background: on ? "#2563EB" : "rgba(255,255,255,0.1)", position: "relative" as const, cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}>
                            <div style={{ position: "absolute" as const, top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.15s" }} />
                          </div>
                        )
                        const summaryCards = [
                          { label: "Total sueldos brutos",  value: fmt(totalBruto),  sub: `${realEmployees.filter(e => e.status === 'Activo').length} empleados activos` },
                          { label: "Cargas sociales",       value: fmt(totalCargas),  sub: "30% sobre bruto"    },
                          { label: "Costo total empresa",   value: fmt(totalCosto),   sub: "Bruto + cargas"     },
                          { label: "Neto a pagar",          value: fmt(totalNeto),    sub: "Estimado este mes"  },
                        ]
                        return (
                          <div style={{ flex: 1, overflowY: "auto", padding: 24, position: "relative" as const }}>
                            {/* Top bar */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                              <div>
                                <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Sueldos y liquidación</div>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>Mayo 2026</div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => setShowPayrollConfigModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
                                  Configurar sueldos
                                </button>
                                <button onClick={() => setShowLiquidateModal(true)} style={{ padding: "7px 14px", fontSize: 13, background: "#2563EB", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Liquidar mes</button>
                              </div>
                            </div>

                            {/* Summary cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
                              {summaryCards.map(c => (
                                <div key={c.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 6 }}>{c.label}</div>
                                  <div style={{ color: "white", fontSize: 20, fontWeight: 600 }}>{c.value}</div>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 4 }}>{c.sub}</div>
                                </div>
                              ))}
                            </div>

                            {/* Table */}
                            <div style={{ marginBottom: 24 }}>
                              {/* Header */}
                              <div style={{ display: "grid", gridTemplateColumns: gridCols, background: "rgba(255,255,255,0.03)", borderRadius: "8px 8px 0 0", padding: "10px 16px" }}>
                                {["EMPLEADO","CARGO","SUELDO BRUTO","DEDUCCIONES","NETO","COMISIONES","ESTADO"].map(h => (
                                  <span key={h} style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</span>
                                ))}
                              </div>
                              {/* Rows */}
                              {PAYROLL.map(row => {
                                const d = ded30(row.bruto)
                                const n = netOf(row.bruto)
                                const c = calc(row)
                                const st = stSty(payrollStatuses[row.id] ?? "Pendiente")
                                return (
                                  <div key={row.id}
                                    onClick={() => { setPayrollSelectedId(row.id); setShowPayrollDetailModal(true) }}
                                    style={{ display: "grid", gridTemplateColumns: gridCols, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    {/* Empleado */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{row.initials}</div>
                                      <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{row.name}</span>
                                    </div>
                                    {/* Cargo */}
                                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, alignSelf: "center" }}>{row.role}</span>
                                    {/* Bruto */}
                                    <span style={{ color: "white", fontSize: 13, fontWeight: 500, alignSelf: "center" }}>{fmt(row.bruto)}</span>
                                    {/* Deducciones */}
                                    <span title={`Jubilación: ${fmt(c.jub)}\nObra social: ${fmt(c.obra)}\nPAMI: ${fmt(c.pami)}`} style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, alignSelf: "center", cursor: "help" }}>{fmt(d)}</span>
                                    {/* Neto */}
                                    <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 500, alignSelf: "center" }}>{fmt(n)}</span>
                                    {/* Comisiones */}
                                    <span style={{ color: row.comision > 0 ? "#2563EB" : "rgba(255,255,255,0.6)", fontSize: 12, alignSelf: "center" }}>{row.comision > 0 ? fmt(row.comision) : "—"}</span>
                                    {/* Estado */}
                                    <div style={{ alignSelf: "center" }}>
                                      <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{payrollStatuses[row.id] ?? "Pendiente"}</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* SALARY DETAIL MODAL */}
                            {showPayrollDetailModal && selRow && selCalc && (
                              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowPayrollDetailModal(false)}>
                                <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, width: 420, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                                  <div style={{ marginBottom: 16 }}>
                                    <div style={{ color: "white", fontSize: 16, fontWeight: 500 }}>{selRow.name}</div>
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>Liquidación Mayo 2026</div>
                                  </div>
                                  {/* HABERES */}
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Haberes</div>
                                  {[["Sueldo básico", fmt(selRow.bruto)],["Antigüedad", fmt(selCalc.ant)],["Presentismo", fmt(selCalc.pres)]].map(([k,v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{k}</span>
                                      <span style={{ color: "white", fontSize: 13 }}>{v}</span>
                                    </div>
                                  ))}
                                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "10px 0" }} />
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                    <span style={{ color: "white", fontSize: 13 }}>Total haberes</span>
                                    <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{fmt(selCalc.totalH)}</span>
                                  </div>
                                  {/* DEDUCCIONES */}
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Deducciones</div>
                                  {[["Jubilación (11%)", fmt(selCalc.jub)],["Obra social (3%)", fmt(selCalc.obra)],["PAMI (3%)", fmt(selCalc.pami)],["Sindicato (2%)", fmt(selCalc.sind)]].map(([k,v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{k}</span>
                                      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{v}</span>
                                    </div>
                                  ))}
                                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "10px 0" }} />
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Total deducciones</span>
                                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500 }}>{fmt(selCalc.totalD)}</span>
                                  </div>
                                  {/* ADICIONALES */}
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Adicionales</div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Comisiones Mayo</span>
                                    <span style={{ color: selRow.comision > 0 ? "#2563EB" : "rgba(255,255,255,0.6)", fontSize: 13 }}>{selRow.comision > 0 ? fmt(selRow.comision) : "$0"}</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Horas extra</span>
                                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>$0</span>
                                  </div>
                                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "16px 0" }} />
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Neto a cobrar</div>
                                  <div style={{ color: "#22c55e", fontSize: 24, fontWeight: 600 }}>{fmt(selCalc.netoF)}</div>
                                  {/* Footer */}
                                  <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
                                    <button onClick={() => setShowPayrollDetailModal(false)} style={{ padding: "8px 16px", fontSize: 13, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Cancelar</button>
                                    <button style={{ padding: "8px 16px", fontSize: 13, background: "transparent", border: "1px solid rgba(37,99,235,0.4)", borderRadius: 8, color: "#2563EB", cursor: "pointer" }}>Descargar recibo</button>
                                    <button onClick={() => { setPayrollStatuses(prev => ({ ...prev, [selRow.id]: "Liquidado" })); setShowPayrollDetailModal(false) }} style={{ padding: "8px 16px", fontSize: 13, background: "#2563EB", border: "none", borderRadius: 8, color: "white", cursor: "pointer" }}>Marcar como liquidado</button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* CONFIG MODAL */}
                            {showPayrollConfigModal && (
                              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowPayrollConfigModal(false)}>
                                <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, width: 480, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                                  <div style={{ color: "white", fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Configuración de sueldos</div>
                                  {/* Employee salary rows */}
                                  {PAYROLL.map(row => (
                                    <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{row.initials}</div>
                                      <span style={{ color: "white", fontSize: 13, flex: 1 }}>{row.name}</span>
                                      <input type="text" defaultValue={fmt(row.bruto)} style={{ width: 100, padding: "5px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", fontSize: 12, outline: "none", textAlign: "right" as const }} />
                                    </div>
                                  ))}
                                  {/* Toggles */}
                                  <div style={{ marginTop: 20 }}>
                                    {[
                                      { label: "Incluir antigüedad automática", on: payrollAntiguedadOn, toggle: () => setPayrollAntiguedadOn(v => !v), extra: <><span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginLeft: 8 }}>%/año:</span><input type="number" value={payrollAntiguedadPct} onChange={e => setPayrollAntiguedadPct(e.target.value)} style={{ width: 56, marginLeft: 4, padding: "3px 6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", fontSize: 12, outline: "none" }} /></> },
                                      { label: "Incluir presentismo", on: payrollPresentismoOn, toggle: () => setPayrollPresentismoOn(v => !v), extra: <><span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginLeft: 8 }}>$:</span><input type="number" value={payrollPresentismoAmt} onChange={e => setPayrollPresentismoAmt(e.target.value)} style={{ width: 80, marginLeft: 4, padding: "3px 6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", fontSize: 12, outline: "none" }} /></> },
                                      { label: "Cargas sociales automáticas (30%)", on: payrollCargasOn, toggle: () => setPayrollCargasOn(v => !v), extra: null },
                                    ].map(item => (
                                      <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                        <Toggle on={item.on} onToggle={item.toggle} />
                                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{item.label}</span>
                                        {item.extra}
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
                                    <button onClick={() => setShowPayrollConfigModal(false)} style={{ padding: "8px 16px", fontSize: 13, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Cancelar</button>
                                    <button onClick={() => setShowPayrollConfigModal(false)} style={{ padding: "8px 16px", fontSize: 13, background: "#2563EB", border: "none", borderRadius: 8, color: "white", cursor: "pointer" }}>Guardar configuración</button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* LIQUIDATE MODAL */}
                            {showLiquidateModal && (
                              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowLiquidateModal(false)}>
                                <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, width: 400 }} onClick={e => e.stopPropagation()}>
                                  <div style={{ color: "white", fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Liquidar Mayo 2026</div>
                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.5 }}>¿Confirmar liquidación de 8 empleados por {fmt(totalNeto)} neto?</div>
                                  <div style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, padding: 12, marginTop: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.5 }}>Esta acción marcará todos los sueldos como liquidados y no podrá deshacerse.</span>
                                  </div>
                                  <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
                                    <button onClick={() => setShowLiquidateModal(false)} style={{ padding: "8px 16px", fontSize: 13, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Cancelar</button>
                                    <button onClick={() => { setPayrollStatuses(Object.fromEntries(PAYROLL.map(r => [r.id, "Liquidado"]))); setShowLiquidateModal(false) }} style={{ padding: "8px 16px", fontSize: 13, background: "#2563EB", border: "none", borderRadius: 8, color: "white", cursor: "pointer" }}>Confirmar liquidación</button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Resumen semanal tab */}
                      {rrhhNavTab === "Resumen semanal" && (() => {
                        const EMP_WEEK = [
                          { id:1, initials:"JP", name:"Juan Pérez",      role:"Vendedor Senior",    score:4.9, trend:"↑ +0.1", alert:""                },
                          { id:2, initials:"CA", name:"Carlos Acosta",   role:"Vendedor",           score:3.7, trend:"↓ -0.3", alert:"Sobrecargado"    },
                          { id:3, initials:"MR", name:"María Ruiz",      role:"Vendedora",          score:4.3, trend:"↑ +0.2", alert:""                },
                          { id:4, initials:"AG", name:"Ana González",    role:"Analista Marketing", score:4.6, trend:"↑ +0.1", alert:""                },
                          { id:5, initials:"PM", name:"Pedro Martínez",  role:"Administrativo",     score:-1,  trend:"Licencia", alert:""              },
                          { id:6, initials:"LS", name:"Laura Sánchez",   role:"Coordinadora Ops",   score:3.9, trend:"↓ -0.4", alert:"Riesgo renuncia" },
                          { id:7, initials:"DT", name:"Diego Torres",    role:"Asistente Admin",    score:3.1, trend:"↓ -0.2", alert:"Bajo desempeño"  },
                          { id:8, initials:"SR", name:"Sofía Reyes",     role:"Analista Ops",       score:4.7, trend:"↑ +0.3", alert:""                },
                        ]
                        const alertColor = (a: string) => a === "Riesgo renuncia" ? { bg:"rgba(239,68,68,0.1)",  color:"#ef4444", border:"rgba(239,68,68,0.2)"  }
                                                         : a === "Sobrecargado"   ? { bg:"rgba(234,179,8,0.1)",  color:"#eab308", border:"rgba(234,179,8,0.2)"  }
                                                         : a === "Bajo desempeño" ? { bg:"rgba(239,68,68,0.1)",  color:"#ef4444", border:"rgba(239,68,68,0.2)"  }
                                                         :                          { bg:"rgba(34,197,94,0.1)",   color:"#22c55e", border:"rgba(34,197,94,0.2)"  }
                        const trendColor = (t: string) => t.startsWith("↑") ? "#22c55e" : t.startsWith("↓") ? "#ef4444" : "rgba(255,255,255,0.6)"
                        const TASK_ROWS = [
                          { initials:"JP", name:"Juan Pérez",    done:12, inprog:2, pend:1 },
                          { initials:"CA", name:"Carlos Acosta", done:6,  inprog:2, pend:12 },
                          { initials:"MR", name:"María Ruiz",    done:10, inprog:1, pend:2  },
                          { initials:"AG", name:"Ana González",  done:11, inprog:1, pend:1  },
                          { initials:"SR", name:"Sofía Reyes",   done:8,  inprog:0, pend:0  },
                        ]
                        const ABSENCES = [
                          { initials:"PM", name:"Pedro Martínez", reason:"Licencia médica",         dates:"20–24 Mayo", dur:"5 días",  status:"Aprobada",       sc:{ bg:"rgba(34,197,94,0.1)",  color:"#22c55e", border:"rgba(34,197,94,0.2)"  } },
                          { initials:"DT", name:"Diego Torres",   reason:"Ausencia injustificada",  dates:"22 Mayo",    dur:"1 día",   status:"Sin justificar",  sc:{ bg:"rgba(239,68,68,0.1)",  color:"#ef4444", border:"rgba(239,68,68,0.2)"  } },
                          { initials:"CA", name:"Carlos Acosta",  reason:"Llegada tarde",           dates:"23 Mayo",    dur:"45 min",  status:"Registrada",      sc:{ bg:"rgba(234,179,8,0.1)",  color:"#eab308", border:"rgba(234,179,8,0.2)"  } },
                        ]
                        const RECS = [
                          { priority:"Urgente", pColor:"#ef4444", title:"Hablar con Laura Sánchez",       body:"Riesgo de renuncia en aumento. Agendar reunión privada para entender situación y retenerla."           },
                          { priority:"Alta",    pColor:"#eab308", title:"Redistribuir tareas de Carlos",  body:"Reasignar al menos 4 tareas a María Ruiz que tiene capacidad disponible esta semana."                   },
                          { priority:"Media",   pColor:"#2563EB", title:"Iniciar plan de mejora con Diego",body:"Tercer mes consecutivo bajo. Definir objetivos claros y seguimiento semanal."                          },
                          { priority:"Baja",    pColor:"#22c55e", title:"Reconocer logros de JP y Sofía", body:"El reconocimiento aumenta satisfacción y retención. Un mensaje o reunión esta semana."                  },
                        ]
                        return (
                          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                            {/* Top bar */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                              <div>
                                <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Resumen semanal del equipo</div>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>Semana del 19 al 25 de Mayo 2026</div>
                              </div>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 0, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, overflow: "hidden" }}>
                                  <button style={{ padding: "6px 10px", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14 }}>←</button>
                                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, padding: "0 4px" }}>Sem 20</span>
                                  <button style={{ padding: "6px 10px", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14 }}>→</button>
                                </div>
                                <button style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                  Exportar resumen
                                </button>
                              </div>
                            </div>

                            {/* AI executive summary */}
                            <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 14, padding: 20, marginBottom: 24 }}>
                              <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>✦ Resumen ejecutivo de Pupi</div>
                              <div style={{ color: "white", fontSize: 14, lineHeight: 1.8 }}>
                                Esta semana el equipo tuvo un rendimiento general positivo. JP lideró en ventas con 3 cierres. Carlos está sobrecargado y requiere atención. Laura muestra señales de insatisfacción por tercer semana consecutiva. El clima laboral subió 0.4 puntos llegando a 7.8/10.
                              </div>
                              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" as const }}>
                                {[
                                  { text: "✓ 3 logros destacados",    bg: "rgba(34,197,94,0.1)",  color: "#22c55e", border: "rgba(34,197,94,0.2)"  },
                                  { text: "⚠ 2 situaciones a atender",bg: "rgba(234,179,8,0.1)",  color: "#eab308", border: "rgba(234,179,8,0.2)"  },
                                  { text: "! 1 alerta crítica",        bg: "rgba(239,68,68,0.1)",  color: "#ef4444", border: "rgba(239,68,68,0.2)"  },
                                ].map(p => (
                                  <span key={p.text} style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12 }}>{p.text}</span>
                                ))}
                              </div>
                            </div>

                            {/* Team performance grid */}
                            <div style={{ marginBottom: 24 }}>
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Desempeño individual</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                                {EMP_WEEK.map(e => (
                                  <div key={e.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14, textAlign: "center" as const }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 12, fontWeight: 500, margin: "0 auto" }}>{e.initials}</div>
                                    <div style={{ color: "white", fontSize: 12, fontWeight: 500, marginTop: 8 }}>{e.name}</div>
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>{e.role}</div>
                                    {e.score >= 0 ? (
                                      <>
                                        <div style={{ marginTop: 8, lineHeight: 1 }}>
                                          <span style={{ color: "white", fontSize: 20, fontWeight: 600 }}>{e.score.toFixed(1)}</span>
                                          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>/5</span>
                                        </div>
                                        <div style={{ color: trendColor(e.trend), fontSize: 11, marginTop: 4 }}>{e.trend}</div>
                                      </>
                                    ) : (
                                      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 8 }}>Licencia</div>
                                    )}
                                    {e.alert && (() => {
                                      const ac = alertColor(e.alert)
                                      return <span style={{ display: "inline-block", background: ac.bg, color: ac.color, border: `1px solid ${ac.border}`, borderRadius: 20, padding: "2px 6px", fontSize: 9, marginTop: 6 }}>{e.alert}</span>
                                    })()}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Key metrics row */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
                              {[
                                { label: "Tareas completadas", value: "47",     sub: "de 58 asignadas · 81%",          valueColor: "white"    },
                                { label: "Ausencias esta semana", value: "3",   sub: "1 justificada · 2 sin justificar",valueColor: "white"    },
                                { label: "Clima laboral",       value: "7.8/10",sub: "↑ +0.4 vs semana anterior",      valueColor: "white", subColor: "#22c55e" },
                                { label: "Metas en riesgo",     value: "2",     sub: "CA y Diego por debajo del 50%",  valueColor: "#eab308"  },
                              ].map(c => (
                                <div key={c.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 6 }}>{c.label}</div>
                                  <div style={{ color: c.valueColor, fontSize: 20, fontWeight: 600 }}>{c.value}</div>
                                  <div style={{ color: c.subColor ?? "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>{c.sub}</div>
                                </div>
                              ))}
                            </div>

                            {/* Highlights + Alerts side by side */}
                            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                              {/* Logros */}
                              <div style={{ flex: 1 }}>
                                <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 12 }}>🏆 Logros de la semana</div>
                                {[
                                  { title: "JP cerró 3 ventas esta semana",            detail: "$56.350 en total · mejor semana del mes"               },
                                  { title: "Sofía entregó proyecto antes del plazo",   detail: "2 días de adelanto · calidad 5/5"                      },
                                  { title: "Clima laboral en máximo histórico",         detail: "7.8/10 · cuarta semana consecutiva subiendo"           },
                                ].map((a, i) => (
                                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 8, padding: "12px 14px", marginBottom: 6 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                                    <div>
                                      <div style={{ color: "white", fontSize: 12, fontWeight: 500 }}>{a.title}</div>
                                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>{a.detail}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {/* Alerts */}
                              <div style={{ flex: 1 }}>
                                <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 12 }}>⚠ Requieren atención</div>
                                {[
                                  { color:"#ef4444", title:"Laura — Riesgo de renuncia",  body:"Tercer semana con satisfacción en caída. Requiere conversación urgente con el dueño.", cta:"Agendar reunión →"  },
                                  { color:"#eab308", title:"Carlos — Sobrecargado",        body:"12 tareas pendientes. Productividad cayó 15%. Redistribuir carga urgente.",           cta:"Ver tareas →"       },
                                  { color:"#eab308", title:"Diego — Bajo desempeño",       body:"Tercer mes consecutivo por debajo del promedio. Evaluar plan de mejora.",            cta:"Ver evaluación →"   },
                                ].map((al, i) => (
                                  <div key={i} style={{ display: "flex", gap: 12, background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${al.color}`, borderTop: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 8px 8px 0", padding: "12px 14px", marginBottom: 6 }}>
                                    <div>
                                      <div style={{ color: "white", fontSize: 12, fontWeight: 500 }}>{al.title}</div>
                                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, lineHeight: 1.5, marginTop: 3 }}>{al.body}</div>
                                      <div style={{ color: al.color, fontSize: 11, marginTop: 6, cursor: "pointer" }}>{al.cta}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Tasks summary */}
                            <div style={{ marginBottom: 24 }}>
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Resumen de tareas</div>
                              {/* Stacked bar */}
                              <div style={{ width: "100%", height: 8, borderRadius: 4, display: "flex", overflow: "hidden", marginBottom: 10 }}>
                                <div style={{ width: "81%", background: "#22c55e" }} />
                                <div style={{ width: "10%", background: "#2563EB" }} />
                                <div style={{ flex: 1, background: "rgba(255,255,255,0.1)" }} />
                              </div>
                              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                                {[["#22c55e","Completadas 47"],["#2563EB","En proceso 6"],["rgba(255,255,255,0.3)","Pendientes 5"]].map(([c,l]) => (
                                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />
                                    <span style={{ color: c, fontSize: 11 }}>{l}</span>
                                  </div>
                                ))}
                              </div>
                              {/* Per-employee rows */}
                              {TASK_ROWS.map(r => {
                                const total = r.done + r.inprog + r.pend
                                const donePct  = total ? r.done  / total * 100 : 0
                                const inpPct   = total ? r.inprog / total * 100 : 0
                                return (
                                  <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 10, fontWeight: 500, flexShrink: 0 }}>{r.initials}</div>
                                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, flex: 1 }}>{r.name}</span>
                                    <div style={{ width: 120, height: 4, borderRadius: 2, display: "flex", overflow: "hidden", background: "rgba(255,255,255,0.06)", flexShrink: 0 }}>
                                      <div style={{ width: `${donePct}%`, background: "#22c55e" }} />
                                      <div style={{ width: `${inpPct}%`, background: "#2563EB" }} />
                                    </div>
                                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, width: 36, textAlign: "right" as const, flexShrink: 0 }}>{r.done}/{total}</span>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Absences */}
                            <div style={{ marginBottom: 24 }}>
                              <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Ausencias de la semana</div>
                              {ABSENCES.map((ab, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{ab.initials}</div>
                                    <div>
                                      <div style={{ color: "white", fontSize: 13 }}>{ab.name}</div>
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 1 }}>{ab.reason}</div>
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "center" as const }}>
                                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{ab.dates}</div>
                                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 1 }}>{ab.dur}</div>
                                  </div>
                                  <span style={{ background: ab.sc.bg, color: ab.sc.color, border: `1px solid ${ab.sc.border}`, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{ab.status}</span>
                                </div>
                              ))}
                            </div>

                            {/* AI next week recommendations */}
                            <div>
                              <div style={{ color: "#2563EB", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>✦ Recomendaciones para la próxima semana</div>
                              {RECS.map((r, i) => (
                                <div key={i} style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, padding: "12px 14px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
                                  <span style={{ background: `${r.pColor}20`, color: r.pColor, borderRadius: 20, padding: "1px 7px", fontSize: 9, flexShrink: 0, marginTop: 1 }}>{r.priority}</span>
                                  <div>
                                    <div style={{ color: "white", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{r.title}</div>
                                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.5 }}>{r.body}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Equipo tab */}
                      {rrhhNavTab === "Equipo" && (
                        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                          {/* Left sidebar */}
                          <div style={{ width: "25%", flexShrink: 0, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "20px 16px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
                            <input type="text" placeholder="Buscar empleado..." value={rrhhSearch} onChange={e => setRrhhSearch(e.target.value)} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />

                            <div style={{ marginTop: 20, marginBottom: 8, ...filterLabel }}>Estado</div>
                            {["Todos","Activo 🟢","Licencia 🟡","Baja ⚫"].map(f => (
                              <button key={f} onClick={() => setRrhhStatusFilter(f)} style={{ textAlign: "left" as const, padding: "7px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", marginBottom: 2, background: rrhhStatusFilter === f ? "rgba(37,99,235,0.15)" : "transparent", color: rrhhStatusFilter === f ? "#2563EB" : "rgba(255,255,255,0.4)", transition: "background 0.15s, color 0.15s" }}>{f}</button>
                            ))}

                            <div style={{ marginTop: 16, marginBottom: 8, ...filterLabel }}>Área</div>
                            {["Todas","Ventas","Marketing","Administración","Operaciones"].map(f => (
                              <button key={f} onClick={() => setRrhhAreaFilter(f)} style={{ textAlign: "left" as const, padding: "7px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", marginBottom: 2, background: rrhhAreaFilter === f ? "rgba(37,99,235,0.15)" : "transparent", color: rrhhAreaFilter === f ? "#2563EB" : "rgba(255,255,255,0.4)", transition: "background 0.15s, color 0.15s" }}>{f}</button>
                            ))}

                            <div style={{ marginTop: 16, marginBottom: 8, ...filterLabel }}>Alerta</div>
                            {["Sin alertas","Riesgo renuncia","Sobrecargado","Bajo desempeño"].map(f => (
                              <button key={f} onClick={() => setRrhhAlertFilter(f)} style={{ textAlign: "left" as const, padding: "7px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", marginBottom: 2, background: rrhhAlertFilter === f ? "rgba(37,99,235,0.15)" : "transparent", color: rrhhAlertFilter === f ? "#2563EB" : "rgba(255,255,255,0.4)", transition: "background 0.15s, color 0.15s" }}>{f}</button>
                            ))}
                          </div>

                          {/* Right section */}
                          <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            {rrhhLoading && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '32px',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '13px',
                                gap: '8px',
                              }}>
                                <div style={{
                                  width: '16px',
                                  height: '16px',
                                  border: '2px solid rgba(37,99,235,0.3)',
                                  borderTop: '2px solid #2563EB',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite',
                                }} />
                                Cargando equipo...
                              </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
                              <div>
                                <div style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Empleados</div>
                                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>{`${realEmployees.length} empleados · ${onLeaveCount} en licencia`}</div>
                              </div>
                              <button style={{ padding: "7px 14px", fontSize: 13, background: "#2563EB", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Nuevo empleado +</button>
                            </div>

                            {/* Alert banner */}
                            {showRrhhAlertBanner && employeesAtRisk.length > 0 && (
                              <div style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, padding: "10px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                  <span style={{ color: "#eab308", fontSize: 13 }}>{`${employeesAtRisk.length} empleados requieren atención`}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <button style={{ padding: "4px 10px", background: "rgba(234,179,8,0.1)", border: "none", borderRadius: 6, color: "#eab308", fontSize: 12, cursor: "pointer" }}>Ver alertas →</button>
                                  <button onClick={() => setShowRrhhAlertBanner(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>×</button>
                                </div>
                              </div>
                            )}

                            {/* Employee list */}
                            <div style={{ flex: 1, overflowY: "auto" }}>
                              {filtered.map(emp => {
                                const st = STATUS_STYLE[emp.status]
                                return (
                                  <div key={emp.id}
                                    onClick={() => { setRrhhSelectedEmp(emp); setRrhhView("detail") }}
                                    style={{ display: "flex", alignItems: "center", gap: 12, height: 64, borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 12px", cursor: "pointer", transition: "background 0.15s" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    {/* Avatar */}
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>{emp.initials}</div>
                                    {/* Name + role */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{emp.name}</div>
                                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>{emp.role} · {emp.area}</div>
                                    </div>
                                    {/* Status badge */}
                                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: "2px 8px", fontSize: 11, flexShrink: 0 }}>{emp.status}</span>
                                    {/* Score dots */}
                                    <div style={{ flexShrink: 0, minWidth: 60 }}><ScoreDots score={emp.score} /></div>
                                    {/* Alert */}
                                    <div style={{ width: 120, flexShrink: 0 }}>
                                      {emp.alert === "Riesgo renuncia" && <span style={{ color: "#ef4444", fontSize: 11 }}>⚠ Riesgo renuncia</span>}
                                      {emp.alert === "Sobrecargado"    && <span style={{ color: "#eab308", fontSize: 11 }}>⚡ Sobrecargado</span>}
                                      {emp.alert === "Bajo desempeño"  && <span style={{ color: "#ef4444", fontSize: 11 }}>⚠ Bajo desempeño</span>}
                                    </div>
                                    {/* Seniority */}
                                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, flexShrink: 0, width: 56, textAlign: "right" as const }}>{emp.seniority}</span>
                                  </div>
                                )
                              })}
                              {filtered.length === 0 && (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 48, gap: 8 }}>
                                  <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 13 }}>Sin empleados</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : activeNode.id === 5 ? (
                // ── CONTABILIDAD MODULE ──
                (() => {
                  const currentMonth = new Date().getMonth()
                  const currentYear = new Date().getFullYear()

                  const monthMovements = realMovements.filter(m => {
                    const d = new Date(m.date)
                    return d.getMonth() === currentMonth &&
                      d.getFullYear() === currentYear
                  })

                  const totalIncome = monthMovements
                    .filter(m => m.type === 'income')
                    .reduce((sum, m) => sum + m.amount, 0)

                  const totalExpenses = monthMovements
                    .filter(m => m.type === 'expense')
                    .reduce((sum, m) => sum + m.amount, 0)

                  const netResult = totalIncome - totalExpenses

                  const cashFlow = realMovements
                    .filter(m => m.type === 'income')
                    .reduce((sum, m) => sum + m.amount, 0)
                    - realMovements
                    .filter(m => m.type === 'expense')
                    .reduce((sum, m) => sum + m.amount, 0)

                  const fmtContab = (n: number) =>
                    `$${Math.round(n).toLocaleString()}`

                  const marginPct = totalIncome > 0
                    ? ((netResult / totalIncome) * 100).toFixed(1)
                    : '0'

                  const expenseArr = realMovements
                    .filter(m => m.type === 'expense')
                  const avgExpense = expenseArr.length > 0
                    ? expenseArr.reduce((sum, m) =>
                        sum + m.amount, 0) / expenseArr.length
                    : 0

                  const anomalies = realMovements.filter(m =>
                    m.type === 'expense' &&
                    m.amount > avgExpense * 2
                  )

                  const MONTHS = [
                    { m:"Dic", ing:68000, gas:52000 },
                    { m:"Ene", ing:72000, gas:55000 },
                    { m:"Feb", ing:81000, gas:58000 },
                    { m:"Mar", ing:94000, gas:62000 },
                    { m:"Abr", ing:88000, gas:63000 },
                    { m:"May", ing:105000,gas:68000 },
                  ]
                  const maxVal = Math.max(...MONTHS.flatMap(m => [m.ing, m.gas]))
                  const barH = 110
                  const CATS = [
                    { color:"#2563EB", name:"Sueldos",     amt:"$45.200", pct:66 },
                    { color:"#a855f7", name:"Marketing",   amt:"$8.400",  pct:12 },
                    { color:"#22c55e", name:"Operaciones", amt:"$6.800",  pct:10 },
                    { color:"#eab308", name:"Servicios",   amt:"$4.200",  pct:6  },
                    { color:"#f97316", name:"Impuestos",   amt:"$2.840",  pct:4  },
                    { color:"#ef4444", name:"Otros",       amt:"$1.400",  pct:2  },
                  ]
                  const COBRAR = [
                    { name:"Tech Solutions",   amt:"$18.500", days:"Vence en 3 días",  urgColor:"#eab308" },
                    { name:"Grupo Herrera",    amt:"$28.500", days:"Vence en 12 días", urgColor:"rgba(255,255,255,0.3)" },
                    { name:"Retail Express",   amt:"$8.900",  days:"Vence en 7 días",  urgColor:"rgba(255,255,255,0.3)" },
                  ]
                  const PAGAR = [
                    { name:"Proveedor A", amt:"$12.400", days:"Vence hoy",          urgColor:"#ef4444" },
                    { name:"Proveedor B", amt:"$8.200",  days:"Vence en 5 días",    urgColor:"#eab308" },
                    { name:"Alquiler",    amt:"$45.000", days:"Vence en 15 días",   urgColor:"rgba(255,255,255,0.3)" },
                  ]
                  const MOVEMENTS = realMovements.slice(0, 5).map(mv => ({
                    type: mv.type === 'income' ? 'in' as const : 'out' as const,
                    desc: mv.description,
                    cat: mv.category,
                    when: mv.displayDate,
                    amt: mv.displayAmount,
                    auto: mv.origin === 'automatic',
                    anomaly: mv.is_anomaly ||
                      (mv.type === 'expense' && mv.amount > avgExpense * 2),
                  }))
                  const aiCard: React.CSSProperties = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"12px 14px", marginBottom:0 }
                  const aiLabel: React.CSSProperties = { color:"rgba(255,255,255,0.8)", fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.05em" }
                  return (
                    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                      {/* Secondary nav */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 24px", flexShrink:0 }}>
                        <div style={{ display:"flex", gap:0 }}>
                          {(["Dashboard","Movimientos","Análisis","Proyecciones","Exportar"] as const).map(nav => (
                            <button key={nav} onClick={() => setContabNavTab(nav)} style={{ padding:"12px 16px", fontSize:13, background:"none", border:"none", cursor:"pointer", color:contabNavTab===nav?"white":"rgba(255,255,255,0.35)", borderBottom:`2px solid ${contabNavTab===nav?"#2563EB":"transparent"}`, transition:"color 0.15s, border-color 0.15s", marginBottom:-1 }}>{nav}</button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => fetchMovements()}
                          title="Actualizar"
                          style={{ padding:"7px 10px", fontSize:13, background:"none", color:"rgba(255,255,255,0.4)", border:"none", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"color 0.15s", marginBottom:-1 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>

                      {/* Dashboard view */}
                      {contabNavTab === "Dashboard" && (
                        <div style={{ flex:1, overflowY:"auto", padding:24 }}>

                          {contabilidadLoading && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '32px',
                              color: 'rgba(255,255,255,0.6)',
                              fontSize: '13px',
                              gap: '8px',
                            }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(37,99,235,0.3)',
                                borderTop: '2px solid #2563EB',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                              }} />
                              Cargando contabilidad...
                            </div>
                          )}

                          {/* Alert banner */}
                          {showContabAlertBanner && anomalies.length > 0 && (
                            <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.22)", borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 2px 8px rgba(239,68,68,0.08)" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                <span style={{ color:"#ef4444", fontSize:13 }}>{`Gasto inusual detectado — ${anomalies[0].description}`}</span>
                              </div>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <button style={{ padding:"4px 10px", background:"rgba(239,68,68,0.1)", border:"none", borderRadius:6, color:"#ef4444", fontSize:12, cursor:"pointer" }}>Ver detalle</button>
                                <button onClick={() => setShowContabAlertBanner(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:16, cursor:"pointer", padding:"0 2px" }}>×</button>
                              </div>
                            </div>
                          )}

                          {/* Metrics row */}
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
                            {[
                              { label:"Ingresos este mes",  value:fmtContab(totalIncome), valueColor:"#22c55e", sub:"↑ 28% vs mes anterior",  subColor:"#22c55e",               accent:"#22c55e" },
                              { label:"Gastos este mes",    value:fmtContab(totalExpenses),  valueColor:"white",   sub:"↑ 8% vs mes anterior",   subColor:"rgba(255,255,255,0.35)", accent:"#ef4444" },
                              { label:"Resultado neto",     value:fmtContab(netResult),  valueColor:netResult >= 0 ? "#22c55e" : "#ef4444", sub:`Margen ${marginPct}%`,            subColor:"rgba(255,255,255,0.35)", accent:netResult >= 0 ? "#22c55e" : "#ef4444" },
                              { label:"Flujo de caja",      value:fmtContab(cashFlow),  valueColor:"white",   sub:"Disponible actual",       subColor:"rgba(255,255,255,0.35)", accent:"#2563EB" },
                            ].map(c => (
                              <div key={c.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderTop:`2px solid ${c.accent}`, borderRadius:10, padding:"16px 18px", boxShadow:"0 2px 10px rgba(0,0,0,0.2)" }}>
                                <div style={{ color:"rgba(255,255,255,0.7)", fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:8 }}>{c.label}</div>
                                <div style={{ color:c.valueColor, fontSize:22, fontWeight:600, marginBottom:4 }}>{c.value}</div>
                                <div style={{ color:c.subColor, fontSize:11 }}>{c.sub}</div>
                              </div>
                            ))}
                          </div>

                          {/* Bar chart */}
                          <div style={{ marginBottom:24 }}>
                            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
                              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ color:"white", fontSize:13, fontWeight:500 }}>Ingresos vs Gastos</div>
                                <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>Últimos 6 meses</div>
                              </div>
                              <div style={{ padding:"16px 18px" }}>
                              <div style={{ display:"flex", alignItems:"flex-end", gap:12, height:barH }}>
                                {MONTHS.map(mo => (
                                  <div key={mo.m} style={{ flex:1, display:"flex", alignItems:"flex-end", gap:3 }}>
                                    <div style={{ flex:1, background:"rgba(34,197,94,0.6)", borderRadius:"4px 4px 0 0", height:`${(mo.ing/maxVal)*barH}px` }} />
                                    <div style={{ flex:1, background:"rgba(239,68,68,0.4)", borderRadius:"4px 4px 0 0", height:`${(mo.gas/maxVal)*barH}px` }} />
                                  </div>
                                ))}
                              </div>
                              <div style={{ display:"flex", gap:12, marginTop:8 }}>
                                {MONTHS.map(mo => (
                                  <div key={mo.m} style={{ flex:1, textAlign:"center" as const, color:"rgba(255,255,255,0.55)", fontSize:10 }}>{mo.m}</div>
                                ))}
                              </div>
                              <div style={{ display:"flex", gap:16, marginTop:10 }}>
                                {[["rgba(34,197,94,0.6)","#22c55e","Ingresos"],["rgba(239,68,68,0.4)","#ef4444","Gastos"]].map(([bg,tc,lbl]) => (
                                  <div key={lbl} style={{ display:"flex", alignItems:"center", gap:5 }}>
                                    <div style={{ width:10, height:10, borderRadius:2, background:bg, flexShrink:0 }} />
                                    <span style={{ color:tc, fontSize:11 }}>{lbl}</span>
                                  </div>
                                ))}
                              </div>
                              </div>
                            </div>
                          </div>

                          {/* Expense breakdown + Pending */}
                          <div style={{ display:"flex", gap:16, marginBottom:24 }}>
                            {/* Categories */}
                            <div style={{ flex:1, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px" }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:14 }}>Gastos por categoría</div>
                              {CATS.map(cat => (
                                <div key={cat.name} style={{ marginBottom:12 }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                                    <div style={{ width:8, height:8, borderRadius:"50%", background:cat.color, flexShrink:0 }} />
                                    <span style={{ color:"white", fontSize:12, flex:1 }}>{cat.name}</span>
                                    <span style={{ color:"rgba(255,255,255,0.8)", fontSize:12 }}>{cat.amt}</span>
                                    <span style={{ color:"rgba(255,255,255,0.6)", fontSize:11, width:28, textAlign:"right" as const }}>{cat.pct}%</span>
                                  </div>
                                  <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden" }}>
                                    <div style={{ height:"100%", width:`${cat.pct}%`, background:cat.color, borderRadius:2, opacity:0.8 }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Pending */}
                            <div style={{ flex:1, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px" }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:14 }}>Pendientes</div>
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:8 }}>Por cobrar</div>
                              {COBRAR.map(r => (
                                <div key={r.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                                  <span style={{ color:"white", fontSize:12 }}>{r.name}</span>
                                  <span style={{ color:"rgba(255,255,255,0.8)", fontSize:12 }}>{r.amt}</span>
                                  <span style={{ color:r.urgColor, fontSize:10 }}>{r.days}</span>
                                </div>
                              ))}
                              <div style={{ color:"white", fontSize:12, fontWeight:500, marginTop:8, marginBottom:12 }}>$55.900 por cobrar</div>
                              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", marginBottom:12 }} />
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:8 }}>Por pagar</div>
                              {PAGAR.map(r => (
                                <div key={r.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                                  <span style={{ color:"white", fontSize:12 }}>{r.name}</span>
                                  <span style={{ color:"rgba(255,255,255,0.8)", fontSize:12 }}>{r.amt}</span>
                                  <span style={{ color:r.urgColor, fontSize:10 }}>{r.days}</span>
                                </div>
                              ))}
                              <div style={{ color:"white", fontSize:12, fontWeight:500, marginTop:8 }}>$65.600 por pagar</div>
                            </div>
                          </div>

                          {/* AI insights */}
                          <div style={{ marginBottom:24, background:"rgba(37,99,235,0.04)", border:"1px solid rgba(37,99,235,0.12)", borderRadius:12, padding:"16px 18px" }}>
                            <div style={{ color:"#2563EB", fontSize:11, textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:14 }}>✦ Inteligencia Pupi</div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
                              <div style={aiCard}>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                  <span style={aiLabel}>Tendencia financiera</span>
                                </div>
                                <div style={{ color:"#22c55e", fontSize:13, fontWeight:500 }}>Positiva</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:3 }}>Ingresos crecen 28% vs mes anterior</div>
                              </div>
                              <div style={aiCard}>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                  <span style={aiLabel}>Anomalía detectada</span>
                                </div>
                                <div style={{ color:"#ef4444", fontSize:13, fontWeight:500 }}>Gasto inusual</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:3 }}>Marketing +180% vs promedio histórico</div>
                              </div>
                              <div style={aiCard}>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                  <span style={aiLabel}>Mes de baja recurrente</span>
                                </div>
                                <div style={{ color:"white", fontSize:13 }}>Julio — Agosto</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:3 }}>Historial muestra caída del 35% en esos meses</div>
                              </div>
                              <div style={aiCard}>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                  <span style={aiLabel}>Recomendación</span>
                                </div>
                                <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:3 }}>Cobrar Tech Solutions</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11 }}>Vence en 3 días y es el mayor monto pendiente</div>
                              </div>
                            </div>
                          </div>

                          {/* Recent movements */}
                          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500 }}>Últimos movimientos</div>
                            </div>
                            <div style={{ padding:"8px 18px 4px" }}>
                            {MOVEMENTS.map((mv, i) => {
                              const isIn = mv.type === "in"
                              const iconColor = isIn ? "#22c55e" : "#ef4444"
                              const iconBg = isIn ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"
                              return (
                                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", borderLeft: mv.anomaly ? "2px solid #ef4444" : "2px solid transparent", background: mv.anomaly ? "rgba(239,68,68,0.02)" : "transparent" }}>
                                  <div style={{ width:32, height:32, borderRadius:"50%", background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                    {isIn
                                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                                    }
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ color:"white", fontSize:13 }}>{mv.desc}</div>
                                    <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:2 }}>{mv.cat} · {mv.when}</div>
                                  </div>
                                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                    {mv.auto && <span style={{ background:"rgba(37,99,235,0.1)", color:"#2563EB", borderRadius:20, padding:"1px 6px", fontSize:10 }}>Auto</span>}
                                    <span style={{ color:isIn?"#22c55e":"#ef4444", fontSize:13, fontWeight:500 }}>{mv.amt}</span>
                                  </div>
                                </div>
                              )
                            })}
                            <div onClick={() => setContabNavTab("Movimientos")} style={{ color:"#2563EB", fontSize:12, marginTop:12, cursor:"pointer" }}>Ver todos los movimientos →</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Movimientos view */}
                      {contabNavTab === "Movimientos" && (() => {
                        type MovRow = { id:string; type:"in"|"out"; desc:string; cat:string; dateGroup:string; auto:boolean; amt:number; anomaly?:boolean }
                        const ALL_MOVS: MovRow[] = realMovements.map(m => ({
                          id: m.id,
                          type: m.type === 'income' ? 'in' as const : 'out' as const,
                          desc: m.description,
                          cat: m.category,
                          dateGroup: m.displayDate,
                          auto: m.origin === 'automatic',
                          amt: m.amount,
                          anomaly: m.is_anomaly ||
                            (m.type === 'expense' && m.amount > avgExpense * 2),
                        }))
                        const catMeta: Record<string,{color:string;icon:string}> = {
                          "Ventas":      { color:"#22c55e", icon:"↑" },
                          "Sueldos":     { color:"#2563EB", icon:"👤" },
                          "Marketing":   { color:"#a855f7", icon:"📢" },
                          "Operaciones": { color:"#f97316", icon:"⚙" },
                          "Servicios":   { color:"#eab308", icon:"📶" },
                          "Impuestos":   { color:"#ef4444", icon:"📄" },
                          "Otros":       { color:"rgba(255,255,255,0.3)", icon:"•••" },
                        }
                        const fmtM = (n:number) => "$" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                        let filtered = ALL_MOVS
                        if (movSearch.trim()) filtered = filtered.filter(m => m.desc.toLowerCase().includes(movSearch.toLowerCase()))
                        if (movTipoFilter === "Ingresos 🟢") filtered = filtered.filter(m => m.type === "in")
                        if (movTipoFilter === "Gastos 🔴")   filtered = filtered.filter(m => m.type === "out")
                        if (movCatFilter !== "Todas")        filtered = filtered.filter(m => m.cat === movCatFilter)
                        if (movOrigenFilter === "Automático") filtered = filtered.filter(m => m.auto)
                        if (movOrigenFilter === "Manual")     filtered = filtered.filter(m => !m.auto)
                        const groupedMovements = filtered.reduce((groups, movement) => {
                          const date = movement.dateGroup
                          if (!groups[date]) groups[date] = []
                          groups[date].push(movement)
                          return groups
                        }, {} as Record<string, MovRow[]>)
                        const groups = Array.from(new Set(filtered.map(m => m.dateGroup)))
                        const totalIn  = totalIncome
                        const totalOut = totalExpenses
                        const neto = netResult
                        const sideBtn = (label:string, active:boolean, onClick:()=>void) => (
                          <button key={label} onClick={onClick} style={{ display:"block", width:"100%", textAlign:"left", padding:"6px 10px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, background:active?"rgba(37,99,235,0.15)":"none", color:active?"white":"rgba(255,255,255,0.4)", marginBottom:2 }}>{label}</button>
                        )
                        const inputStyle: React.CSSProperties = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"7px 10px", color:"white", fontSize:12, width:"100%", outline:"none", boxSizing:"border-box" as const }
                        const selectStyle: React.CSSProperties = { ...inputStyle, appearance:"none" as const }
                        return (
                          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
                            {/* LEFT SIDEBAR */}
                            <div style={{ width:"25%", minWidth:160, borderRight:"1px solid rgba(255,255,255,0.06)", padding:"20px 16px", display:"flex", flexDirection:"column", gap:0, overflowY:"auto" }}>
                              <input
                                placeholder="Buscar movimiento..."
                                value={movSearch}
                                onChange={e => setMovSearch(e.target.value)}
                                style={{ ...inputStyle, marginBottom:0 }}
                              />
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:20, marginBottom:8 }}>Tipo</div>
                              {["Todos","Ingresos 🟢","Gastos 🔴"].map(v => sideBtn(v, movTipoFilter===v, ()=>setMovTipoFilter(v)))}
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:16, marginBottom:8 }}>Categoría</div>
                              {["Todas","Ventas","Sueldos","Marketing","Operaciones","Servicios","Impuestos","Otros"].map(v => sideBtn(v, movCatFilter===v, ()=>setMovCatFilter(v)))}
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:16, marginBottom:8 }}>Período</div>
                              {["Este mes","Mes anterior","Último trimestre","Este año"].map(v => sideBtn(v, movPeriodoFilter===v, ()=>setMovPeriodoFilter(v)))}
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:16, marginBottom:8 }}>Origen</div>
                              {["Todos","Automático","Manual"].map(v => sideBtn(v, movOrigenFilter===v, ()=>setMovOrigenFilter(v)))}
                            </div>

                            {/* RIGHT SECTION */}
                            <div style={{ flex:1, padding:"20px 24px", display:"flex", flexDirection:"column", overflowY:"auto" }} onClick={()=>setMovMenuOpenId(null)}>
                              {contabilidadLoading && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '32px',
                                  color: 'rgba(255,255,255,0.6)',
                                  fontSize: '13px',
                                  gap: '8px',
                                }}>
                                  <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid rgba(37,99,235,0.3)',
                                    borderTop: '2px solid #2563EB',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                  }} />
                                  Cargando movimientos...
                                </div>
                              )}

                              {/* Top bar */}
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexShrink:0 }}>
                                <div>
                                  <div style={{ color:"white", fontSize:15, fontWeight:500 }}>Movimientos</div>
                                  <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginTop:2 }}>Mayo 2026</div>
                                </div>
                                <div style={{ display:"flex", gap:8 }}>
                                  <button onClick={e=>{e.stopPropagation();setShowRegGasto(v=>!v);setShowRegIngreso(false)}} style={{ padding:"6px 14px", fontSize:12, background:"none", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>+ Registrar gasto</button>
                                  <button onClick={e=>{e.stopPropagation();setShowRegIngreso(v=>!v);setShowRegGasto(false)}} style={{ padding:"6px 14px", fontSize:12, background:"#2563EB", border:"none", borderRadius:6, color:"white", cursor:"pointer", fontWeight:500 }}>+ Registrar ingreso</button>
                                </div>
                              </div>

                              {/* Register expense form */}
                              {showRegGasto && (
                                <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:16, marginBottom:16, flexShrink:0 }}>
                                  <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:14 }}>Nuevo gasto</div>
                                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                                    <div>
                                      <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:4 }}>Descripción</div>
                                      <input placeholder="Ej: Alquiler oficina" value={regDesc} onChange={e=>setRegDesc(e.target.value)} style={inputStyle} />
                                    </div>
                                    <div>
                                      <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:4 }}>Monto</div>
                                      <div style={{ position:"relative" }}>
                                        <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.7)", fontSize:12 }}>$</span>
                                        <input placeholder="0" type="number" value={regMonto} onChange={e=>setRegMonto(e.target.value)} style={{ ...inputStyle, paddingLeft:22 }} />
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:4 }}>Categoría</div>
                                      <select value={regCat} onChange={e=>setRegCat(e.target.value)} style={selectStyle}>
                                        {["Operaciones","Sueldos","Marketing","Servicios","Impuestos","Otros"].map(c=><option key={c} value={c}>{c}</option>)}
                                      </select>
                                      <div style={{ color:"#2563EB", fontSize:10, marginTop:4 }}>✦ IA sugiere: Operaciones</div>
                                    </div>
                                    <div>
                                      <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:4 }}>Fecha</div>
                                      <input type="date" value={regFecha} onChange={e=>setRegFecha(e.target.value)} style={inputStyle} />
                                    </div>
                                  </div>
                                  <div style={{ border:"1px dashed rgba(255,255,255,0.1)", borderRadius:6, padding:8, textAlign:"center", color:"rgba(255,255,255,0.6)", fontSize:11, marginBottom:12, cursor:"pointer" }}>+ Adjuntar comprobante</div>
                                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                                    <button onClick={()=>setShowRegGasto(false)} style={{ padding:"6px 14px", fontSize:12, background:"none", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>Cancelar</button>
                                    <button onClick={handleSaveExpense} style={{ padding:"6px 14px", fontSize:12, background:"#2563EB", border:"none", borderRadius:6, color:"white", cursor:"pointer" }}>Guardar</button>
                                  </div>
                                </div>
                              )}

                              {/* Register income form */}
                              {showRegIngreso && (
                                <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:16, marginBottom:16, flexShrink:0 }}>
                                  <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:14 }}>Nuevo ingreso</div>
                                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                                    <div>
                                      <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:4 }}>Descripción</div>
                                      <input placeholder="Ej: Venta a cliente" value={regDescIn} onChange={e=>setRegDescIn(e.target.value)} style={inputStyle} />
                                    </div>
                                    <div>
                                      <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:4 }}>Monto</div>
                                      <div style={{ position:"relative" }}>
                                        <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.7)", fontSize:12 }}>$</span>
                                        <input placeholder="0" type="number" value={regMontoIn} onChange={e=>setRegMontoIn(e.target.value)} style={{ ...inputStyle, paddingLeft:22 }} />
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:4 }}>Categoría</div>
                                      <select value={regCatIn} onChange={e=>setRegCatIn(e.target.value)} style={selectStyle}>
                                        {["Ventas","Otros"].map(c=><option key={c} value={c}>{c}</option>)}
                                      </select>
                                      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
                                        <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11 }}>Vincular a cliente</div>
                                        <div onClick={()=>setRegVincularCliente(v=>!v)} style={{ width:32, height:18, borderRadius:9, background:regVincularCliente?"#2563EB":"rgba(255,255,255,0.1)", position:"relative", cursor:"pointer", transition:"background 0.2s" }}>
                                          <div style={{ position:"absolute", top:2, left:regVincularCliente?14:2, width:14, height:14, borderRadius:"50%", background:"white", transition:"left 0.2s" }} />
                                        </div>
                                      </div>
                                      {regVincularCliente && (
                                        <select value={regClienteIn} onChange={e=>setRegClienteIn(e.target.value)} style={{ ...selectStyle, marginTop:6 }}>
                                          {["Tech Solutions","Grupo Herrera SA","Retail Express","Importadora DL","Distribuidora Norte"].map(c=><option key={c} value={c}>{c}</option>)}
                                        </select>
                                      )}
                                    </div>
                                    <div>
                                      <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:4 }}>Fecha</div>
                                      <input type="date" value={regFechaIn} onChange={e=>setRegFechaIn(e.target.value)} style={inputStyle} />
                                    </div>
                                  </div>
                                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                                    <button onClick={()=>setShowRegIngreso(false)} style={{ padding:"6px 14px", fontSize:12, background:"none", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>Cancelar</button>
                                    <button onClick={handleSaveIncome} style={{ padding:"6px 14px", fontSize:12, background:"#2563EB", border:"none", borderRadius:6, color:"white", cursor:"pointer" }}>Guardar</button>
                                  </div>
                                </div>
                              )}

                              {/* Summary bar */}
                              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"12px 16px", marginBottom:16, flexShrink:0 }}>
                                <span style={{ color:"#22c55e", fontSize:13, fontWeight:500 }}>Ingresos: +{fmtM(totalIn)}</span>
                                <div style={{ width:1, height:16, background:"rgba(255,255,255,0.08)" }} />
                                <span style={{ color:"#ef4444", fontSize:13, fontWeight:500 }}>Gastos: -{fmtM(totalOut)}</span>
                                <div style={{ width:1, height:16, background:"rgba(255,255,255,0.08)" }} />
                                <span style={{ color:"white", fontSize:13, fontWeight:500 }}>{neto>=0?"Neto: +":"Neto: -"}{fmtM(Math.abs(neto))}</span>
                              </div>

                              {/* Movement groups */}
                              {groups.length === 0 && (
                                <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, textAlign:"center", marginTop:40 }}>Sin movimientos</div>
                              )}
                              {groups.map((grp, gi) => (
                                <div key={grp}>
                                  <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em", padding:"8px 0", marginTop: gi===0 ? 0 : 20 }}>{grp}</div>
                                  {(groupedMovements[grp] ?? []).map(mov => {
                                    const meta = catMeta[mov.cat] ?? catMeta["Otros"]
                                    const isMenuOpen = movMenuOpenId === mov.id
                                    return (
                                      <div key={mov.id} style={{ display:"flex", alignItems:"center", gap:12, padding:12, borderRadius:8, cursor:"pointer", marginBottom:2, position:"relative", borderLeft: mov.anomaly ? "2px solid #ef4444" : "2px solid transparent", background: mov.anomaly ? "rgba(239,68,68,0.02)" : "transparent" }}
                                        onMouseEnter={e=>(e.currentTarget.style.background = mov.anomaly ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)")}
                                        onMouseLeave={e=>(e.currentTarget.style.background = mov.anomaly ? "rgba(239,68,68,0.02)" : "transparent")}>
                                        {/* Category icon */}
                                        <div style={{ width:36, height:36, borderRadius:"50%", background: meta.color + "22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:meta.color, flexShrink:0 }}>{meta.icon}</div>
                                        {/* Center */}
                                        <div style={{ flex:1, minWidth:0 }}>
                                          <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>{mov.desc}</div>
                                          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                                            <span style={{ background:meta.color+"1a", color:meta.color, borderRadius:20, padding:"2px 8px", fontSize:10 }}>{mov.cat}</span>
                                            {mov.auto && <span style={{ background:"rgba(37,99,235,0.1)", color:"#2563EB", borderRadius:20, padding:"2px 8px", fontSize:10 }}>✦ Automático</span>}
                                            {mov.anomaly && <span style={{ background:"rgba(239,68,68,0.1)", color:"#ef4444", borderRadius:20, padding:"1px 6px", fontSize:10 }}>⚠ Inusual</span>}
                                          </div>
                                        </div>
                                        {/* Amount */}
                                        <div style={{ color: mov.type==="in" ? "#22c55e" : "#ef4444", fontSize:14, fontWeight:500, flexShrink:0, marginRight:8 }}>
                                          {mov.type==="in" ? "+" : "-"}{fmtM(mov.amt)}
                                        </div>
                                        {/* Three-dot menu */}
                                        <div style={{ position:"relative", flexShrink:0 }}>
                                          <button onClick={e=>{e.stopPropagation();setMovMenuOpenId(isMenuOpen?null:mov.id)}} style={{ background:"none", border:"none", cursor:"pointer", color: isMenuOpen ? "white" : "rgba(255,255,255,0.2)", fontSize:16, padding:"2px 6px", borderRadius:4 }}>⋯</button>
                                          {isMenuOpen && (
                                            <div onClick={e=>e.stopPropagation()} style={{ position:"absolute", right:0, top:"100%", background:"#1a2640", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"4px 0", zIndex:50, minWidth:148, boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}>
                                              {["Editar categoría","Ver detalle","Eliminar"].map(opt => (
                                                <button key={opt} onClick={()=>setMovMenuOpenId(null)} style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 14px", background:"none", border:"none", color: opt==="Eliminar" ? "#ef4444" : "rgba(255,255,255,0.7)", fontSize:12, cursor:"pointer" }}>{opt}</button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Análisis view */}
                      {contabNavTab === "Análisis" && (() => {
                        const fmtA = (n: number) => "$" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                        const varRow = (concepto: string, actual: string, anterior: string, varPct: string, dir: "up"|"down"|"flat", anomaly?: boolean) => {
                          const varColor = dir==="up" ? "#22c55e" : dir==="down" ? "#ef4444" : "rgba(255,255,255,0.6)"
                          const varArrow = dir==="up" ? "↑" : dir==="down" ? "↓" : "→"
                          return (
                            <div key={concepto} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", borderLeft: anomaly ? "2px solid #ef4444" : "2px solid transparent", background: anomaly ? "rgba(239,68,68,0.02)" : "transparent" }}>
                              <div>
                                <div style={{ color:"white", fontSize:13 }}>{concepto}</div>
                                {anomaly && <div style={{ color:"#ef4444", fontSize:10, marginTop:3 }}>⚠ Variación significativa</div>}
                              </div>
                              <div style={{ color:"white", fontSize:13, fontWeight:500 }}>{actual}</div>
                              <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13 }}>{anterior}</div>
                              <div style={{ color:varColor, fontSize:13 }}>{varArrow} {varPct}</div>
                            </div>
                          )
                        }
                        const marginColor = (pct: number) => pct >= 60 ? "#22c55e" : pct >= 40 ? "#2563EB" : pct >= 20 ? "#eab308" : "#ef4444"
                        const PRODUCTS = [
                          { name:"Producto A", color:"#2563EB",  ing:28800,  cost:10944, margin:62 },
                          { name:"Producto B", color:"#a855f7",  ing:48750,  cost:26813, margin:45 },
                          { name:"Producto C", color:"#22c55e",  ing:14400,  cost:4608,  margin:68 },
                          { name:"Producto D", color:"#eab308",  ing:9900,   cost:6138,  margin:38 },
                          { name:"Producto E", color:"#f97316",  ing:6400,   cost:3072,  margin:52 },
                          { name:"Producto F", color:"#ef4444",  ing:3750,   cost:2700,  margin:28 },
                        ]
                        const AREAS = [
                          { name:"Ventas",         ing:105370, cost:48750, pct:68, label:"Rentable",       labelColor:"#22c55e", conic:`conic-gradient(#22c55e 0deg 245deg, rgba(255,255,255,0.06) 245deg 360deg)` },
                          { name:"Marketing",      ing:28500,  cost:11400, pct:60, label:"Rentable",       labelColor:"#22c55e", conic:`conic-gradient(#2563EB 0deg 216deg, rgba(255,255,255,0.06) 216deg 360deg)` },
                          { name:"Operaciones",    ing:0,      cost:15000, pct:0,  label:"Break even",     labelColor:"#eab308", conic:`conic-gradient(#eab308 0deg 0deg, rgba(255,255,255,0.06) 0deg 360deg)` },
                          { name:"Administración", ing:0,      cost:48200, pct:0,  label:"Break even",     labelColor:"#eab308", conic:`conic-gradient(#eab308 0deg 0deg, rgba(255,255,255,0.06) 0deg 360deg)` },
                        ]
                        const CALENDAR = [
                          { m:"Ene", v:72,  level:"low",      peak:false, low:false },
                          { m:"Feb", v:81,  level:"medium",   peak:false, low:false },
                          { m:"Mar", v:94,  level:"medium",   peak:false, low:false },
                          { m:"Abr", v:88,  level:"medium",   peak:false, low:false },
                          { m:"May", v:105, level:"high",     peak:true,  low:false },
                          { m:"Jun", v:58,  level:"low",      peak:false, low:false },
                          { m:"Jul", v:45,  level:"verylow",  peak:false, low:true  },
                          { m:"Ago", v:48,  level:"verylow",  peak:false, low:true  },
                          { m:"Sep", v:78,  level:"medium",   peak:false, low:false },
                          { m:"Oct", v:92,  level:"medium",   peak:false, low:false },
                          { m:"Nov", v:112, level:"high",     peak:true,  low:false },
                          { m:"Dic", v:68,  level:"low",      peak:false, low:false },
                        ]
                        const calBg = (l: string) => l==="verylow" ? "rgba(239,68,68,0.12)" : l==="low" ? "rgba(255,255,255,0.03)" : l==="medium" ? "rgba(37,99,235,0.1)" : "rgba(34,197,94,0.12)"
                        const calText = (l: string) => l==="verylow" ? "#ef4444" : l==="low" ? "rgba(255,255,255,0.35)" : l==="medium" ? "#2563EB" : "#22c55e"
                        const aiCard: React.CSSProperties = { background:"rgba(37,99,235,0.06)", border:"1px solid rgba(37,99,235,0.15)", borderRadius:8, padding:"12px 14px", marginBottom:8 }
                        const RECS = [
                          { prio:"Alta",  title:"Revisar gasto en Marketing",   body:"Subió 180% vs mes anterior sin aumento proporcional en ingresos. Evaluar ROI real de cada campaña activa." },
                          { prio:"Alta",  title:"Preparar reserva para julio",  body:"Históricamente julio cae 57% vs mayo. Con el ritmo actual, se proyecta un déficit de $18.000." },
                          { prio:"Media", title:"Aumentar precio de Producto F", body:"Margen del 28% es el más bajo del portfolio. Revisar precio o reducir costos de producción." },
                        ]
                        const prioColor = (p: string) => p==="Alta" ? "#ef4444" : "#eab308"
                        return (
                          <div style={{ flex:1, overflowY:"auto", padding:24 }}>
                            {/* Top bar */}
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
                              <div>
                                <div style={{ color:"white", fontSize:15, fontWeight:500 }}>Análisis financiero</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginTop:2 }}>Comparativos y rentabilidad</div>
                              </div>
                              <div style={{ display:"flex", gap:4 }}>
                                {["Este mes","Trimestre","Este año"].map(p => (
                                  <button key={p} onClick={()=>setAnalisisPeriod(p)} style={{ padding:"5px 12px", fontSize:12, borderRadius:20, border:"none", cursor:"pointer", background:analisisPeriod===p?"#2563EB":"rgba(255,255,255,0.06)", color:analisisPeriod===p?"white":"rgba(255,255,255,0.4)" }}>{p}</button>
                                ))}
                              </div>
                            </div>

                            {/* Period comparison table */}
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:16 }}>Comparativo de períodos</div>
                              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, overflow:"hidden" }}>
                                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"10px 16px", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.6)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                                  <div>Concepto</div><div>Este mes</div><div>Mes anterior</div><div>Variación</div>
                                </div>
                                {varRow("Ingresos totales",    "$105.370","$88.200","19.5%", "up")}
                                {varRow("Gastos totales",      "$67.840", "$62.800","8.0%",  "up")}
                                {varRow("Resultado neto",      "$37.530", "$25.400","47.8%", "up")}
                                {varRow("Margen neto",         "35.6%",   "28.8%",  "6.8pp","up")}
                                {varRow("Gastos en sueldos",   "$45.200", "$45.200","0%",    "flat")}
                                {varRow("Gastos en marketing", "$8.400",  "$3.000", "180%",  "up", true)}
                              </div>
                            </div>

                            {/* Product margins */}
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Margen por producto</div>
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:16 }}>Rentabilidad real por línea</div>
                              {PRODUCTS.map(p => {
                                const mc = marginColor(p.margin)
                                return (
                                  <div key={p.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, marginBottom:6 }}>
                                    <div style={{ width:10, height:10, borderRadius:"50%", background:p.color, flexShrink:0 }} />
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ color:"white", fontSize:13, fontWeight:500 }}>{p.name}</div>
                                      <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:2 }}>{fmtA(p.ing)} ingresos · {fmtA(p.cost)} costo</div>
                                    </div>
                                    <div style={{ width:80, height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, flexShrink:0 }}>
                                      <div style={{ width:`${p.margin}%`, height:"100%", background:mc, borderRadius:2 }} />
                                    </div>
                                    <div style={{ color:mc, fontSize:13, fontWeight:500, width:40, textAlign:"right", flexShrink:0 }}>{p.margin}%</div>
                                  </div>
                                )
                              })}
                              <div style={{ display:"flex", gap:10, background:"rgba(37,99,235,0.06)", border:"1px solid rgba(37,99,235,0.15)", borderRadius:8, padding:"12px 16px", marginTop:8 }}>
                                <span style={{ fontSize:14 }}>💡</span>
                                <span style={{ color:"rgba(255,255,255,0.6)", fontSize:12, lineHeight:1.5 }}>Producto C tiene el mejor margen (68%) pero representa solo el 10% de los ingresos. Priorizarlo en campañas podría aumentar la rentabilidad global.</span>
                              </div>
                            </div>

                            {/* Area profitability */}
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Rentabilidad por área</div>
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:16 }}>Ingresos generados vs costos del área</div>
                              <div style={{ display:"flex", gap:12 }}>
                                {AREAS.map(a => (
                                  <div key={a.name} style={{ flex:1, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:16, textAlign:"center" }}>
                                    <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:12 }}>{a.name}</div>
                                    <div style={{ position:"relative", width:56, height:56, margin:"0 auto 8px", borderRadius:"50%", background:a.conic, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                      <div style={{ width:40, height:40, borderRadius:"50%", background:"#0D0D14", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                        <span style={{ color:"white", fontSize:12, fontWeight:500 }}>{a.pct}%</span>
                                      </div>
                                    </div>
                                    <div style={{ color:"rgba(255,255,255,0.8)", fontSize:10 }}>Ingresos: {fmtA(a.ing)}</div>
                                    <div style={{ color:"rgba(255,255,255,0.7)", fontSize:10, marginTop:2 }}>Costos: {fmtA(a.cost)}</div>
                                    <div style={{ color:a.labelColor, fontSize:11, marginTop:8 }}>{a.label}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Low billing calendar */}
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>✦ Meses de baja facturación</div>
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:16 }}>Detectados por Pupi en historial de 12 meses</div>
                              <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:8 }}>
                                {CALENDAR.map(c => (
                                  <div key={c.m} style={{ background:calBg(c.level), border: c.peak ? "1px solid rgba(34,197,94,0.3)" : c.low ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.04)", borderRadius:8, padding:"10px 8px", textAlign:"center" }}>
                                    <div style={{ color:"rgba(255,255,255,0.7)", fontSize:10, marginBottom:4 }}>{c.m}</div>
                                    <div style={{ color:calText(c.level), fontSize:12, fontWeight:500 }}>${c.v}k</div>
                                    {c.low  && <div style={{ color:"#ef4444", fontSize:9, marginTop:4 }}>Baja recurrente</div>}
                                    {c.peak && <div style={{ color:"#22c55e", fontSize:9, marginTop:4 }}>Pico</div>}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* AI Recommendations */}
                            <div>
                              <div style={{ color:"#2563EB", fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>✦ Recomendaciones Pupi</div>
                              {RECS.map(r => (
                                <div key={r.title} style={aiCard}>
                                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                                    <span style={{ background:prioColor(r.prio)+"22", color:prioColor(r.prio), fontSize:10, borderRadius:20, padding:"1px 8px" }}>{r.prio}</span>
                                    <span style={{ color:"white", fontSize:13, fontWeight:500 }}>{r.title}</span>
                                  </div>
                                  <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12, lineHeight:1.5 }}>{r.body}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Placeholder for remaining contab tabs */}
                      {/* Proyecciones view */}
                      {contabNavTab === "Proyecciones" && (() => {
                        const fmtP = (n: number) => "$" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                        // Chart data
                        const REAL_PTS  = [{ m:"Mar", v:94 }, { m:"Abr", v:88 }, { m:"May", v:105 }]
                        const PROJ_PTS  = [{ m:"Jun", v:68 }, { m:"Jul", v:45 }, { m:"Ago", v:48 }, { m:"Sep", v:78 }, { m:"Oct", v:92 }, { m:"Nov", v:112 }]
                        const ALL_PTS   = [...REAL_PTS, ...PROJ_PTS]
                        const svgW = 600, svgH = 120, padL = 44, padR = 16, padT = 18, padB = 24
                        const chartW = svgW - padL - padR
                        const chartH = svgH - padT - padB
                        const minV = 0, maxV = 130
                        const xStep = chartW / (ALL_PTS.length - 1)
                        const px = (i: number) => padL + i * xStep
                        const py = (v: number) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH
                        const cubicPath = (pts: {m:string;v:number}[], startIdx: number) =>
                          pts.reduce((acc, pt, i) => {
                            const gi = startIdx + i
                            const x = px(gi), y = py(pt.v)
                            if (i === 0) return `M ${x} ${y}`
                            const prev = pts[i - 1], gp = startIdx + i - 1
                            const cx1 = px(gp) + xStep / 3
                            const cx2 = x - xStep / 3
                            return `${acc} C ${cx1} ${py(prev.v)} ${cx2} ${y} ${x} ${y}`
                          }, "")
                        const realPath = cubicPath(REAL_PTS, 0)
                        const dividerX = px(REAL_PTS.length - 1)
                        // Projection continues from last real point
                        const projAllPts = [REAL_PTS[REAL_PTS.length - 1], ...PROJ_PTS]
                        const projPath = cubicPath(projAllPts, REAL_PTS.length - 1)
                        // Danger zone: Jul(idx4) to Ago(idx5)
                        const dzX1 = px(4), dzX2 = px(5)
                        // Monthly table
                        const MONTHS_PROJ = [
                          { m:"Jun", ing:68000, gas:65000, result:3000,   alert:"low"  },
                          { m:"Jul", ing:45000, gas:62000, result:-17000, alert:"def"  },
                          { m:"Ago", ing:48000, gas:62000, result:-14000, alert:"def"  },
                          { m:"Sep", ing:78000, gas:64000, result:14000,  alert:"ok"   },
                          { m:"Oct", ing:92000, gas:65000, result:27000,  alert:"ok"   },
                          { m:"Nov", ing:112000,gas:66000, result:46000,  alert:"ok"   },
                        ]
                        const alertLabel = (a: string) => a==="def" ? "⚠ Déficit proyectado" : a==="low" ? "⚡ Mes bajo" : "✓ Proyección positiva"
                        const alertColor = (a: string) => a==="def" ? "#ef4444" : a==="low" ? "#eab308" : "#22c55e"
                        const SCENARIOS = [
                          { icon:"↑", iconColor:"#22c55e", name:"Escenario optimista",    desc:"Si ventas crecen 20% y gastos se mantienen", result:"+$341.400", rc:"#22c55e" },
                          { icon:"—", iconColor:"#2563EB", name:"Escenario base",         desc:"Proyección actual sin cambios",               result:"+$284.500", rc:"#2563EB" },
                          { icon:"↓", iconColor:"#ef4444", name:"Escenario conservador",  desc:"Si ventas caen 15% en meses bajos",           result:"+$198.200", rc:"#eab308" },
                        ]
                        const RECS = [
                          { prio:"Urgente", title:"Cobrar $55.900 pendiente antes de junio",       body:"Tech Solutions vence en 3 días y Grupo Herrera en 12. Cobrar ambos garantiza cubrir el déficit de julio sin tocar reservas." },
                          { prio:"Alta",    title:"Reducir gasto en marketing en junio",           body:"Bajar de $8.400 a $4.000 en junio libera $4.400 para el mes bajo siguiente." },
                          { prio:"Media",   title:"Crear reserva de $30.000",                     body:"Con el flujo actual es posible apartar $30.000 en mayo para cubrir julio y agosto sin estrés financiero." },
                          { prio:"Baja",    title:"Aumentar precios en noviembre",                body:"El pico de noviembre es ideal para probar aumentos del 8-10% sin afectar la demanda." },
                        ]
                        const prioColor = (p: string) => p==="Urgente" ? "#ef4444" : p==="Alta" ? "#f97316" : p==="Media" ? "#eab308" : "rgba(255,255,255,0.6)"
                        const aiCard: React.CSSProperties = { background:"rgba(37,99,235,0.06)", border:"1px solid rgba(37,99,235,0.15)", borderRadius:8, padding:"12px 14px", marginBottom:8 }
                        const metricCard: React.CSSProperties = { flex:1, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"16px 20px" }
                        return (
                          <div style={{ flex:1, overflowY:"auto", padding:24 }}>
                            {/* Top bar */}
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
                              <div>
                                <div style={{ color:"white", fontSize:15, fontWeight:500 }}>Proyecciones financieras</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginTop:2 }}>Próximos 6 meses</div>
                              </div>
                              <div style={{ display:"flex", gap:4 }}>
                                {["6 meses","12 meses"].map(p => (
                                  <button key={p} onClick={()=>setProyPeriod(p)} style={{ padding:"5px 12px", fontSize:12, borderRadius:20, border:"none", cursor:"pointer", background:proyPeriod===p?"#2563EB":"rgba(255,255,255,0.06)", color:proyPeriod===p?"white":"rgba(255,255,255,0.4)" }}>{p}</button>
                                ))}
                              </div>
                            </div>

                            {/* Cash flow summary cards */}
                            <div style={{ display:"flex", gap:12, marginBottom:24 }}>
                              <div style={metricCard}>
                                <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:6 }}>Flujo de caja actual</div>
                                <div style={{ color:"white", fontSize:20, fontWeight:600 }}>$52.180</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:4 }}>Disponible hoy</div>
                              </div>
                              <div style={metricCard}>
                                <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:6 }}>Proyección próximo mes</div>
                                <div style={{ color:"#eab308", fontSize:20, fontWeight:600 }}>$38.420</div>
                                <div style={{ color:"#eab308", fontSize:11, marginTop:4 }}>↓ Julio es mes bajo</div>
                              </div>
                              <div style={metricCard}>
                                <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:6 }}>Proyección 6 meses</div>
                                <div style={{ color:"#22c55e", fontSize:20, fontWeight:600 }}>$284.500</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:4 }}>Acumulado estimado</div>
                              </div>
                            </div>

                            {/* Cash flow chart */}
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Flujo de caja proyectado</div>
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:12 }}>Línea real + proyección IA</div>
                              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"16px 16px 8px" }}>
                                <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width:"100%", display:"block" }}>
                                  {/* Danger zone Jul-Ago */}
                                  <rect x={dzX1} y={padT} width={dzX2-dzX1} height={chartH} fill="rgba(239,68,68,0.06)" />
                                  {/* Y axis labels */}
                                  {[0,50,100].map(v => (
                                    <text key={v} x={padL-6} y={py(v)+4} textAnchor="end" fontSize={10} fill="rgba(255,255,255,0.15)">${v}k</text>
                                  ))}
                                  {/* X axis labels */}
                                  {ALL_PTS.map((pt, i) => (
                                    <text key={pt.m} x={px(i)} y={svgH-4} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.2)">{pt.m}</text>
                                  ))}
                                  {/* Divider */}
                                  <line x1={dividerX} y1={padT-10} x2={dividerX} y2={padT+chartH} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4 4" />
                                  <text x={dividerX} y={padT-2} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)">Hoy</text>
                                  {/* Real line */}
                                  <path d={realPath} fill="none" stroke="#22c55e" strokeWidth={2} />
                                  {/* Projection line */}
                                  <path d={projPath} fill="none" stroke="rgba(37,99,235,0.7)" strokeWidth={2} strokeDasharray="6 3" />
                                  {/* Real dots */}
                                  {REAL_PTS.map((pt, i) => (
                                    <circle key={pt.m} cx={px(i)} cy={py(pt.v)} r={4} fill="#22c55e"><title>{pt.m}: ${pt.v}k</title></circle>
                                  ))}
                                  {/* Proj dots */}
                                  {PROJ_PTS.map((pt, i) => (
                                    <circle key={pt.m} cx={px(REAL_PTS.length+i)} cy={py(pt.v)} r={4} fill="#2563EB"><title>{pt.m}: ${pt.v}k</title></circle>
                                  ))}
                                </svg>
                                {/* Legend */}
                                <div style={{ display:"flex", gap:16, marginTop:4, paddingLeft:padL }}>
                                  <span style={{ color:"rgba(255,255,255,0.65)", fontSize:11, display:"flex", alignItems:"center", gap:6 }}><span style={{ display:"inline-block", width:20, height:2, background:"#22c55e", borderRadius:1 }} />Real</span>
                                  <span style={{ color:"rgba(255,255,255,0.65)", fontSize:11, display:"flex", alignItems:"center", gap:6 }}><span style={{ display:"inline-block", width:20, height:0, borderTop:"2px dashed rgba(37,99,235,0.7)" }} />Proyectado</span>
                                </div>
                              </div>
                            </div>

                            {/* Monthly projection table */}
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:16 }}>Detalle mensual proyectado</div>
                              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, overflow:"hidden" }}>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", padding:"10px 16px", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.6)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                                  <div>Mes</div><div>Ingresos est.</div><div>Gastos est.</div><div>Resultado</div><div>Alerta</div>
                                </div>
                                {MONTHS_PROJ.map(row => (
                                  <div key={row.m} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", borderLeft: row.alert==="def" ? "2px solid #ef4444" : "2px solid transparent", background: row.alert==="def" ? "rgba(239,68,68,0.02)" : "transparent" }}>
                                    <div style={{ color:"white", fontSize:13 }}>{row.m}</div>
                                    <div style={{ color:"white", fontSize:13, fontWeight:500 }}>{fmtP(row.ing)}</div>
                                    <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13 }}>{fmtP(row.gas)}</div>
                                    <div style={{ color: row.result >= 0 ? "#22c55e" : "#ef4444", fontSize:13, fontWeight:500 }}>{row.result >= 0 ? "+" : ""}{fmtP(Math.abs(row.result))}</div>
                                    <div style={{ color:alertColor(row.alert), fontSize:11 }}>{alertLabel(row.alert)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Deficit alert card */}
                            <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:16, marginBottom:24, display:"flex", gap:14 }}>
                              <span style={{ fontSize:20, flexShrink:0, marginTop:2 }}>⚠</span>
                              <div>
                                <div style={{ color:"white", fontSize:14, fontWeight:500, marginBottom:6 }}>Déficit proyectado en julio y agosto</div>
                                <div style={{ color:"rgba(255,255,255,0.6)", fontSize:12, lineHeight:1.6, marginBottom:12 }}>Pupi proyecta un déficit combinado de $31.000 en los meses de julio y agosto basado en el historial de los últimos 3 años. Con el flujo actual de $52.180 disponible, podés cubrirlo, pero quedará poco margen.</div>
                                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                                  {["Adelantar cobros pendientes →","Reducir gastos en junio →","Crear reserva ahora →"].map(a => (
                                    <button key={a} style={{ padding:"5px 10px", fontSize:11, background:"none", border:"1px solid rgba(239,68,68,0.3)", borderRadius:6, color:"#ef4444", cursor:"pointer" }}>{a}</button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Scenario analysis */}
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Análisis de escenarios</div>
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:16 }}>Qué pasa si las condiciones cambian</div>
                              {SCENARIOS.map(s => (
                                <div key={s.name} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:16, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <div>
                                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                                      <span style={{ color:s.iconColor, fontSize:16, fontWeight:700 }}>{s.icon}</span>
                                      <span style={{ color:"white", fontSize:13, fontWeight:500 }}>{s.name}</span>
                                    </div>
                                    <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12 }}>{s.desc}</div>
                                  </div>
                                  <div style={{ color:s.rc, fontSize:16, fontWeight:600, flexShrink:0, marginLeft:16 }}>{s.result}</div>
                                </div>
                              ))}
                            </div>

                            {/* AI action plan */}
                            <div>
                              <div style={{ color:"#2563EB", fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>✦ Plan de acción Pupi</div>
                              {RECS.map(r => (
                                <div key={r.title} style={aiCard}>
                                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                                    <span style={{ background:prioColor(r.prio)+"22", color:prioColor(r.prio), fontSize:10, borderRadius:20, padding:"1px 8px" }}>{r.prio}</span>
                                    <span style={{ color:"white", fontSize:13, fontWeight:500 }}>{r.title}</span>
                                  </div>
                                  <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12, lineHeight:1.5 }}>{r.body}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Exportar view */}
                      {contabNavTab === "Exportar" && (() => {
                        const fmtE = (n: number) => "$" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                        const HIST_ALL = [
                          { id:1,  type:"in",  desc:"Venta — Tech Solutions",           cat:"Ventas",      month:"Mayo 2026",   auto:true,  amt:18500 },
                          { id:2,  type:"out", desc:"Google Ads — Campaña mayo",         cat:"Marketing",   month:"Mayo 2026",   auto:false, amt:3200,  anomaly:true },
                          { id:3,  type:"in",  desc:"Venta — Distribuidora Norte",       cat:"Ventas",      month:"Mayo 2026",   auto:true,  amt:4200  },
                          { id:4,  type:"out", desc:"Servicios de internet y telefonía", cat:"Servicios",   month:"Mayo 2026",   auto:false, amt:4200  },
                          { id:5,  type:"out", desc:"Sueldos Mayo — anticipo",           cat:"Sueldos",     month:"Mayo 2026",   auto:false, amt:45200 },
                          { id:6,  type:"in",  desc:"Venta — Grupo Herrera SA",          cat:"Ventas",      month:"Mayo 2026",   auto:true,  amt:28500 },
                          { id:7,  type:"out", desc:"Impuesto IVA — Abril",              cat:"Impuestos",   month:"Abril 2026",  auto:false, amt:12400 },
                          { id:8,  type:"in",  desc:"Venta — Retail Express",            cat:"Ventas",      month:"Abril 2026",  auto:true,  amt:8900  },
                          { id:9,  type:"out", desc:"Sueldos Abril",                     cat:"Sueldos",     month:"Abril 2026",  auto:false, amt:45200 },
                          { id:10, type:"in",  desc:"Venta — Importadora DL",            cat:"Ventas",      month:"Marzo 2026",  auto:true,  amt:9750  },
                          { id:11, type:"out", desc:"Proveedor materiales",               cat:"Operaciones", month:"Marzo 2026",  auto:false, amt:8200  },
                          { id:12, type:"in",  desc:"Venta — Tech Solutions",            cat:"Ventas",      month:"Febrero 2026",auto:true,  amt:22000 },
                          { id:13, type:"out", desc:"Sueldos Febrero",                   cat:"Sueldos",     month:"Febrero 2026",auto:false, amt:44000 },
                          { id:14, type:"in",  desc:"Venta — Distribuidora Norte",       cat:"Ventas",      month:"Enero 2026",  auto:true,  amt:18000 },
                          { id:15, type:"out", desc:"Sueldos Enero",                     cat:"Sueldos",     month:"Enero 2026",  auto:false, amt:43000 },
                        ]
                        const PERIODS_OPTS = ["Todos los períodos","Mayo 2026","Abril 2026","Marzo 2026","Febrero 2026","Enero 2026"]
                        let filtHist = HIST_ALL
                        if (exportHistSearch.trim()) filtHist = filtHist.filter(m => m.desc.toLowerCase().includes(exportHistSearch.toLowerCase()))
                        if (exportHistPeriod !== "Todos los períodos") filtHist = filtHist.filter(m => m.month === exportHistPeriod)
                        if (exportHistType === "Ingresos") filtHist = filtHist.filter(m => m.type === "in")
                        if (exportHistType === "Gastos")   filtHist = filtHist.filter(m => m.type === "out")
                        const visibleHist = exportHistExpanded ? filtHist : filtHist.slice(0, 10)
                        const catMetaE: Record<string,{color:string;icon:string}> = {
                          "Ventas":      { color:"#22c55e", icon:"↑" },
                          "Sueldos":     { color:"#2563EB", icon:"👤" },
                          "Marketing":   { color:"#a855f7", icon:"📢" },
                          "Operaciones": { color:"#f97316", icon:"⚙" },
                          "Servicios":   { color:"#eab308", icon:"📶" },
                          "Impuestos":   { color:"#ef4444", icon:"📄" },
                          "Otros":       { color:"rgba(255,255,255,0.3)", icon:"•••" },
                        }
                        const inputStyle: React.CSSProperties = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"7px 10px", color:"white", fontSize:12, outline:"none", boxSizing:"border-box" as const }
                        const PERIOD_TABLE = [
                          { m:"Enero 2026",    ing:72000,  gas:55000, res:17000, cnt:18 },
                          { m:"Febrero 2026",  ing:81000,  gas:58000, res:23000, cnt:21 },
                          { m:"Marzo 2026",    ing:94000,  gas:62000, res:32000, cnt:24 },
                          { m:"Abril 2026",    ing:88000,  gas:63000, res:25000, cnt:22 },
                          { m:"Mayo 2026",     ing:105000, gas:68000, res:37000, cnt:24, actual:true },
                        ]
                        const EXPORT_CARDS = [
                          { icon:"📄", color:"#2563EB", title:"Libro de IVA",         desc:"Ingresos y gastos con IVA discriminado por período",                     btn:"Exportar .xlsx" },
                          { icon:"📊", color:"#22c55e", title:"Balance mensual",      desc:"Resumen de ingresos, gastos y resultado por mes",                        btn:"Exportar .pdf"  },
                          { icon:"📋", color:"#a855f7", title:"Detalle completo",     desc:"Todos los movimientos con categoría, fecha y comprobante",               btn:"Exportar .xlsx" },
                        ]
                        const CHECK_LABELS = ["Ingresos","Gastos","Comisiones","Sueldos","IVA","Comprobantes"]
                        const CHECK_KEYS:   Record<string,string> = { Ingresos:"Ingresos", Gastos:"Gastos", Comisiones:"Comisiones", Sueldos:"Sueldos", "IVA":"IVA", "Comprobantes":"Comprobantes" }
                        return (
                          <div style={{ flex:1, overflowY:"auto", padding:24 }}>
                            {/* Top bar */}
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
                              <div>
                                <div style={{ color:"white", fontSize:15, fontWeight:500 }}>Historial y exportación</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginTop:2 }}>Registro completo desde el inicio de la empresa en Pupi</div>
                              </div>
                              <button style={{ padding:"8px 16px", fontSize:13, background:"#2563EB", border:"none", borderRadius:6, color:"white", cursor:"pointer", fontWeight:500 }}>Exportar para contador →</button>
                            </div>

                            {/* Section 1 — Historial */}
                            <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Historial financiero completo</div>
                            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:20 }}>Desde el onboarding — todos los movimientos registrados</div>

                            {/* Timeline milestone cards */}
                            <div style={{ display:"flex", gap:12, marginBottom:24 }}>
                              {[
                                { icon:"📅", iconColor:"#2563EB", label:"Inicio en Pupi",             value:"1 Enero 2026",  sub:"Hace 4 meses" },
                                { icon:"↑",  iconColor:"#22c55e", label:"Total ingresos históricos",  value:"$458.920",      sub:"en 5 meses",  valueColor:"#22c55e" },
                                { icon:"↓",  iconColor:"#ef4444", label:"Total gastos históricos",    value:"$312.640",      sub:"en 5 meses",  valueColor:"#ef4444" },
                              ].map(c => (
                                <div key={c.label} style={{ flex:1, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:16, textAlign:"center" }}>
                                  <div style={{ fontSize:20, color:c.iconColor }}>{c.icon}</div>
                                  <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em", marginTop:8 }}>{c.label}</div>
                                  <div style={{ color:c.valueColor ?? "white", fontSize: c.valueColor ? 18 : 14, fontWeight: c.valueColor ? 600 : 500, marginTop:4 }}>{c.value}</div>
                                  <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11, marginTop:4 }}>{c.sub}</div>
                                </div>
                              ))}
                            </div>

                            {/* Period breakdown table */}
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:16 }}>Resumen por período</div>
                              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, overflow:"hidden" }}>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", padding:"10px 16px", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.6)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                                  <div>Período</div><div>Ingresos</div><div>Gastos</div><div>Resultado</div><div>Movimientos</div>
                                </div>
                                {PERIOD_TABLE.map(r => (
                                  <div key={r.m} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                    <div style={{ color:"white", fontSize:13, fontWeight: r.actual ? 600 : 400, display:"flex", alignItems:"center", gap:6 }}>
                                      {r.m}
                                      {r.actual && <span style={{ background:"rgba(37,99,235,0.15)", color:"#2563EB", fontSize:9, borderRadius:20, padding:"1px 6px" }}>actual</span>}
                                    </div>
                                    <div style={{ color:"#22c55e", fontSize:13, fontWeight:500 }}>{fmtE(r.ing)}</div>
                                    <div style={{ color:"#ef4444", fontSize:13 }}>{fmtE(r.gas)}</div>
                                    <div style={{ color:"#22c55e", fontSize:13, fontWeight:500 }}>+{fmtE(r.res)}</div>
                                    <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12 }}>{r.cnt}</div>
                                  </div>
                                ))}
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", padding:"12px 16px", background:"rgba(255,255,255,0.04)" }}>
                                  <div style={{ color:"white", fontSize:13, fontWeight:500 }}>Total</div>
                                  <div style={{ color:"#22c55e", fontSize:13, fontWeight:500 }}>$440.000</div>
                                  <div style={{ color:"#ef4444", fontSize:13, fontWeight:500 }}>$306.000</div>
                                  <div style={{ color:"#22c55e", fontSize:13, fontWeight:500 }}>+$134.000</div>
                                  <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, fontWeight:500 }}>109</div>
                                </div>
                              </div>
                            </div>

                            {/* Full movement history */}
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Todos los movimientos</div>
                              <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center" }}>
                                <input placeholder="Buscar en historial..." value={exportHistSearch} onChange={e=>setExportHistSearch(e.target.value)} style={{ ...inputStyle, flex:1 }} />
                                <select value={exportHistPeriod} onChange={e=>setExportHistPeriod(e.target.value)} style={{ ...inputStyle, width:160, appearance:"none" as const }}>
                                  {PERIODS_OPTS.map(p=><option key={p} value={p}>{p}</option>)}
                                </select>
                                <div style={{ display:"flex", gap:4 }}>
                                  {["Todos","Ingresos","Gastos"].map(t => (
                                    <button key={t} onClick={()=>setExportHistType(t)} style={{ padding:"5px 10px", fontSize:11, borderRadius:20, border:"none", cursor:"pointer", background:exportHistType===t?"#2563EB":"rgba(255,255,255,0.06)", color:exportHistType===t?"white":"rgba(255,255,255,0.4)" }}>{t}</button>
                                  ))}
                                </div>
                              </div>
                              {visibleHist.map(mov => {
                                const meta = catMetaE[mov.cat] ?? catMetaE["Otros"]
                                return (
                                  <div key={mov.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, marginBottom:2, borderLeft: mov.anomaly ? "2px solid #ef4444" : "2px solid transparent", background: mov.anomaly ? "rgba(239,68,68,0.02)" : "transparent" }}>
                                    <div style={{ width:30, height:30, borderRadius:"50%", background:meta.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:meta.color, flexShrink:0 }}>{meta.icon}</div>
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ color:"white", fontSize:12, fontWeight:500 }}>{mov.desc}</div>
                                      <div style={{ display:"flex", gap:6, marginTop:3, alignItems:"center" }}>
                                        <span style={{ color:"rgba(255,255,255,0.6)", fontSize:10 }}>{mov.month}</span>
                                        <span style={{ background:meta.color+"1a", color:meta.color, borderRadius:20, padding:"1px 6px", fontSize:9 }}>{mov.cat}</span>
                                        {mov.auto && <span style={{ background:"rgba(37,99,235,0.1)", color:"#2563EB", borderRadius:20, padding:"1px 6px", fontSize:9 }}>✦ Auto</span>}
                                        {mov.anomaly && <span style={{ background:"rgba(239,68,68,0.1)", color:"#ef4444", borderRadius:20, padding:"1px 6px", fontSize:9 }}>⚠ Inusual</span>}
                                      </div>
                                    </div>
                                    <div style={{ color:mov.type==="in"?"#22c55e":"#ef4444", fontSize:13, fontWeight:500, flexShrink:0 }}>{mov.type==="in"?"+":"-"}{fmtE(mov.amt)}</div>
                                  </div>
                                )
                              })}
                              {!exportHistExpanded && filtHist.length > 10 && (
                                <div onClick={()=>setExportHistExpanded(true)} style={{ color:"#2563EB", fontSize:12, textAlign:"center", marginTop:12, cursor:"pointer" }}>Ver los {filtHist.length} movimientos completos</div>
                              )}
                            </div>

                            {/* AI financial summary */}
                            <div style={{ background:"rgba(37,99,235,0.06)", border:"1px solid rgba(37,99,235,0.15)", borderRadius:12, padding:20, marginBottom:24 }}>
                              <div style={{ color:"#2563EB", fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>✦ Resumen financiero Pupi</div>
                              <div style={{ color:"rgba(255,255,255,0.7)", fontSize:13, lineHeight:1.8 }}>En los últimos 5 meses la empresa generó $458.920 en ingresos con un resultado neto positivo de $146.280. El margen promedio fue del 31.9%. Mayo es el mejor mes registrado. Los gastos crecen a menor ritmo que los ingresos — señal de eficiencia operativa.</div>
                              <div style={{ display:"flex", gap:0, marginTop:16 }}>
                                {[
                                  { label:"Margen promedio", value:"31.9%" },
                                  { label:"Mejor mes",       value:"Mayo 2026" },
                                  { label:"Crecimiento",     value:"+28% mensual" },
                                ].map((s, i, arr) => (
                                  <div key={s.label} style={{ flex:1, borderRight: i < arr.length-1 ? "1px solid rgba(255,255,255,0.08)" : "none", paddingRight:16, paddingLeft: i>0 ? 16 : 0 }}>
                                    <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</div>
                                    <div style={{ color:"white", fontSize:18, fontWeight:600, marginTop:4 }}>{s.value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Divider */}
                            <div style={{ display:"flex", alignItems:"center", gap:12, margin:"32px 0" }}>
                              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
                              <span style={{ color:"rgba(255,255,255,0.5)", fontSize:12 }}>Exportación</span>
                              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
                            </div>

                            {/* Section 2 — Export for accountant */}
                            <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Exportar para contador</div>
                            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:20 }}>Generá reportes listos para tu contador externo</div>

                            {/* Export option cards */}
                            {EXPORT_CARDS.map(c => (
                              <div key={c.title} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:18, marginBottom:10 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                                  <div style={{ width:40, height:40, borderRadius:"50%", background:c.color+"1a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{c.icon}</div>
                                  <div>
                                    <div style={{ color:"white", fontSize:14, fontWeight:500 }}>{c.title}</div>
                                    <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginTop:4 }}>{c.desc}</div>
                                  </div>
                                </div>
                                <button style={{ padding:"6px 16px", fontSize:12, background:"none", border:`1px solid ${c.color}4d`, borderRadius:6, color:c.color, cursor:"pointer", flexShrink:0 }}>{c.btn}</button>
                              </div>
                            ))}

                            {/* Custom export */}
                            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:18, marginTop:20 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:16 }}>Exportación personalizada</div>
                              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                                <div>
                                  <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:4 }}>Desde</div>
                                  <input type="date" value={exportCustomFrom2} onChange={e=>setExportCustomFrom2(e.target.value)} style={{ ...inputStyle, width:"100%" }} />
                                </div>
                                <div>
                                  <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:4 }}>Hasta</div>
                                  <input type="date" value={exportCustomTo2} onChange={e=>setExportCustomTo2(e.target.value)} style={{ ...inputStyle, width:"100%" }} />
                                </div>
                              </div>
                              <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:8 }}>Incluir</div>
                              <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:16 }}>
                                {CHECK_LABELS.map(lbl => {
                                  const key = CHECK_KEYS[lbl]
                                  const checked = exportCustomChecks[key]
                                  return (
                                    <div key={lbl} onClick={()=>setExportCustomChecks(prev=>({...prev,[key]:!prev[key]}))} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
                                      <div style={{ width:18, height:18, borderRadius:4, background:checked?"#2563EB":"none", border:checked?"none":"1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                        {checked && <span style={{ color:"white", fontSize:11 }}>✓</span>}
                                      </div>
                                      <span style={{ color:checked?"white":"rgba(255,255,255,0.7)", fontSize:12 }}>{lbl}</span>
                                    </div>
                                  )
                                })}
                              </div>
                              <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:8 }}>Formato</div>
                              <div style={{ display:"flex", gap:4, marginBottom:16 }}>
                                {["Excel","PDF","CSV"].map(f => (
                                  <button key={f} onClick={()=>setExportCustomFmt(f)} style={{ padding:"5px 14px", fontSize:12, borderRadius:20, border:"none", cursor:"pointer", background:exportCustomFmt===f?"#2563EB":"rgba(255,255,255,0.06)", color:exportCustomFmt===f?"white":"rgba(255,255,255,0.4)" }}>{f}</button>
                                ))}
                              </div>
                              <button
                                onClick={()=>{
                                  if(exportGenState==="idle"){
                                    setExportGenState("loading")
                                    setTimeout(()=>setExportGenState("done"),2000)
                                  }
                                }}
                                style={{ width:"100%", padding:10, background:exportGenState==="done"?"rgba(34,197,94,0.15)":"#2563EB", border:exportGenState==="done"?"1px solid rgba(34,197,94,0.3)":"none", borderRadius:8, color:exportGenState==="done"?"#22c55e":"white", fontSize:13, fontWeight:500, cursor:"pointer" }}
                              >
                                {exportGenState==="idle" && "Generar exportación"}
                                {exportGenState==="loading" && "Generando reporte..."}
                                {exportGenState==="done" && "✓ ¡Reporte listo!"}
                              </button>
                              {exportGenState==="done" && (
                                <div style={{ textAlign:"center", marginTop:10 }}>
                                  <span style={{ color:"#2563EB", fontSize:12, cursor:"pointer" }}>Descargar ahora</span>
                                </div>
                              )}
                            </div>

                            {/* Accountant note */}
                            <div style={{ display:"flex", gap:10, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:14, marginTop:20 }}>
                              <span style={{ color:"rgba(255,255,255,0.6)", fontSize:16, flexShrink:0 }}>ℹ</span>
                              <span style={{ color:"rgba(255,255,255,0.8)", fontSize:12, lineHeight:1.6 }}>Los reportes exportados son compatibles con los principales software contables. Si tu contador necesita un formato específico, podés exportar el detalle completo en Excel y él lo adapta.</span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )
                })()
              ) : activeNode.id === 6 ? (
                // ── WORKSPACE MODULE ──
                (() => {
                  const WS_NAV: { key: typeof wsView; label: string }[] = [
                    { key:"home",       label:"Inicio"        },
                    { key:"history",    label:"Historial"     },
                    { key:"search",     label:"Buscador"      },
                    { key:"reports",    label:"Reportes"      },
                    { key:"settings",   label:"Configuración" },
                    { key:"onboarding", label:"Onboarding"    },
                    { key:"memory",     label:"Memoria"       },
                  ]
                  const ALERTS = [
                    { color:"#ef4444", title:"Laura Sánchez — Riesgo renuncia",      sub:"RRHH · Hace 3 semanas"  },
                    { color:"#ef4444", title:"Proveedor A vence — $12.400",           sub:"Contabilidad · Hoy"     },
                    { color:"#eab308", title:"Carlos Mendoza — 14 días sin cierre",  sub:"Ventas · Hace 2 días"   },
                    { color:"#eab308", title:"Carlos Acosta — Sobrecargado",          sub:"RRHH · Esta semana"     },
                    { color:"#2563EB", title:"Campaña WhatsApp — ROI negativo",       sub:"Marketing · Esta semana"},
                  ]
                  const TASKS = [
                    { id:1, text:"Llamar a Laura Sánchez",            sub:"Urgente · RRHH · Alta prioridad",              prio:"Alta"  },
                    { id:2, text:"Cobrar a Tech Solutions — $18.500", sub:"Contabilidad · Vence hoy · Alta",               prio:"Alta"  },
                    { id:3, text:"Revisar cierre Carlos Mendoza",     sub:"Ventas · Alta prioridad",                       prio:"Alta"  },
                    { id:4, text:"Revisar resumen semanal equipo",    sub:"RRHH · Completada",                             prio:"done"  },
                    { id:5, text:"Aprobar campaña noviembre",         sub:"Marketing · Esta semana · Media",               prio:"Media" },
                    { id:6, text:"Liquidar sueldos mayo",             sub:"Contabilidad · Vence viernes · Media",          prio:"Media" },
                  ]
                  const MODULES_STATUS = [
                    { name:"CRM",          icon:"👥", status:"8 clientes activos",             dot:"#22c55e" },
                    { name:"Ventas",       icon:"💰", status:"2 cierres esta semana",          dot:"#22c55e" },
                    { name:"Marketing",    icon:"📢", status:"1 campaña con alerta",            dot:"#eab308" },
                    { name:"RRHH",         icon:"👤", status:"2 empleados requieren atención", dot:"#ef4444" },
                    { name:"Contabilidad", icon:"📊", status:"Gasto inusual detectado",         dot:"#eab308" },
                    { name:"Workspace",    icon:"⚡", status:"Todo actualizado",                dot:"#22c55e" },
                  ]
                  const QUICK_STATS_DEFAULT = [
                    { label:"Ventas del mes",    value:"$105.370", color:"#22c55e" },
                    { label:"Clima laboral",      value:"7.8/10",   color:"#22c55e" },
                    { label:"Tareas pendientes",  value:"4",        color:"#eab308" },
                    { label:"Alertas activas",    value:"3",        color:"#ef4444" },
                  ]
                  const prioColor = (p: string) => p==="Alta" ? "#ef4444" : p==="Media" ? "#eab308" : p==="done" ? "#22c55e" : "rgba(255,255,255,0.6)"
                  const cardStyle: React.CSSProperties = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"14px 16px" }
                  const renderReportIcon = (icon: WorkspaceReportIcon, color: string, size = 18) => {
                    const iconMap = { "trending-up": TrendingUp, users: Users, calculator: Calculator, megaphone: Megaphone, "bar-chart-2": BarChart2, "file-text": FileText }
                    const ReportIcon = iconMap[icon]
                    return <ReportIcon size={size} style={{ color }} />
                  }
                  const openReportModal = (templateId: string | null) => {
                    const template = WS_REPORT_TEMPLATES.find(t => t.id === templateId)
                    setWsSelectedReportTemplate(templateId)
                    setWsReportPeriod("Este mes")
                    setWsReportFormat(template?.tags.includes("Excel") ? "Excel" : "PDF")
                    setWsReportTitle(template ? `${template.title} Mayo 2026` : "")
                    setWsReportBrand(true)
                    setWsReportGenState("idle")
                    setShowWsReportModal(true)
                  }
                  const reportIncludeOptions = (templateId: string | null) => {
                    if (templateId === "sales") return ["Resumen de ventas", "Pipeline activo", "Cierres recientes", "Pronóstico", "Recomendaciones Pupi"]
                    if (templateId === "team") return ["Estado del equipo", "Clima laboral", "Alertas RRHH", "Desempeño individual", "Próximos pasos"]
                    if (templateId === "finance") return ["Situación financiera", "Ingresos y gastos", "Flujo de caja", "Proyecciones", "Alertas activas"]
                    if (templateId === "marketing") return ["Performance de campañas", "ROI por canal", "Insights", "Recomendaciones Pupi", "Próximos pasos"]
                    return ["Resumen de ventas", "Estado del equipo", "Situación financiera", "Alertas activas", "Recomendaciones Pupi", "Próximos pasos"]
                  }
                  const selectedTemplate = WS_REPORT_TEMPLATES.find(t => t.id === wsSelectedReportTemplate)
                  const selectedIncludeOptions = reportIncludeOptions(wsSelectedReportTemplate)
                  const pillStyle: React.CSSProperties = { background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.7)", borderRadius:20, padding:"2px 8px", fontSize:10 }
                  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
                    <button onClick={onToggle} style={{ width:36, height:20, borderRadius:10, background:on ? "#2563EB" : "rgba(255,255,255,0.1)", border:"none", cursor:"pointer", position:"relative", flexShrink:0, transition:"background 0.2s" }}>
                      <span style={{ width:16, height:16, borderRadius:"50%", background:"white", position:"absolute", top:2, left:on ? 18 : 2, transition:"left 0.2s" }} />
                    </button>
                  )
                  const SCHEDULED_REPORTS = [
                    { id:1, icon:"trending-up" as const, color:"#22c55e", bg:"rgba(34,197,94,0.15)", name:"Reporte de ventas semanal", schedule:"Todos los lunes a las 8:00 AM" },
                    { id:2, icon:"calculator" as const, color:"#eab308", bg:"rgba(234,179,8,0.15)", name:"Resumen financiero mensual", schedule:"Primer día de cada mes · 8:00 AM" },
                    { id:3, icon:"bar-chart-2" as const, color:"#f97316", bg:"rgba(249,115,22,0.15)", name:"Reporte ejecutivo mensual", schedule:"Primer lunes de cada mes · 9:00 AM" },
                  ]
                  const realAlerts = realNotifications
                    .filter(n => !n.read)
                    .map(n => ({
                      color: n.priority === 'urgent'
                        ? '#ef4444'
                        : n.priority === 'high'
                        ? '#ef4444'
                        : '#eab308',
                      title: n.title,
                      subtitle: `${n.module} · ${n.displayTime}`,
                    }))
                  const allAlerts = realAlerts.length > 0
                    ? realAlerts.map(a => ({ color: a.color, title: a.title, sub: a.subtitle }))
                    : ALERTS.map(a => ({ color: a.color, title: a.title, sub: a.sub }))
                  const wsKpis = companyMemory?.kpis
                  const QUICK_STATS = wsKpis ? [
                    { label:"Ventas del mes",    value:`$${Number(wsKpis.monthly_revenue || 0).toLocaleString()}`, color:"#22c55e" },
                    { label:"Clima laboral",      value:"7.8/10",   color:"#22c55e" },
                    { label:"Tareas pendientes",  value:"4",        color:"#eab308" },
                    { label:"Alertas activas",    value:String(realAlerts.length || 3), color:"#ef4444" },
                  ] : QUICK_STATS_DEFAULT
                  const reportTypeStyle = (type: string): { icon: WorkspaceReportIcon; color: string; bg: string } => {
                    const t = (type || '').toLowerCase()
                    if (t.includes('sales') || t.includes('venta')) return { icon: "trending-up", color: "#22c55e", bg: "rgba(34,197,94,0.15)" }
                    if (t.includes('team') || t.includes('equipo')) return { icon: "users", color: "#2563EB", bg: "rgba(37,99,235,0.15)" }
                    if (t.includes('finance') || t.includes('financ')) return { icon: "calculator", color: "#eab308", bg: "rgba(234,179,8,0.15)" }
                    if (t.includes('marketing') || t.includes('mkt')) return { icon: "megaphone", color: "#a855f7", bg: "rgba(168,85,247,0.15)" }
                    if (t.includes('executive') || t.includes('ejecut')) return { icon: "bar-chart-2", color: "#f97316", bg: "rgba(249,115,22,0.15)" }
                    return { icon: "file-text", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.08)" }
                  }
                  const mappedRealReports: WorkspaceGeneratedReport[] = realReports.map((r, i) => {
                    const style = reportTypeStyle(r.type)
                    return {
                      id: 1000 + i,
                      icon: style.icon,
                      color: style.color,
                      bg: style.bg,
                      name: r.title,
                      generated: `Generado el ${new Date(r.created_at).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' })} · Por Pupi AI`,
                      period: r.period || '',
                      format: (r.format || 'pdf').toUpperCase(),
                      size: r.size_kb ? `${r.size_kb} KB` : '',
                    }
                  })
                  const displayReports = mappedRealReports.length > 0
                    ? mappedRealReports
                    : wsGeneratedReports
                  return (
                    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                      {/* Secondary nav */}
                      <div style={{ display:"flex", gap:0, borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 24px", flexShrink:0, position:"relative" as const, alignItems:"center" }}>
                        {WS_NAV.map(n => (
                          <button key={n.key} onClick={()=>setWsView(n.key)} style={{ padding:"12px 16px", fontSize:13, background:"none", border:"none", cursor:"pointer", color:wsView===n.key?"white":"rgba(255,255,255,0.35)", borderBottom:`2px solid ${wsView===n.key?"#2563EB":"transparent"}`, transition:"color 0.15s, border-color 0.15s", marginBottom:-1, whiteSpace:"nowrap" as const }}>{n.label}</button>
                        ))}
                        <div style={{ position:"absolute" as const, right:24, display:"flex", alignItems:"center", gap:8 }}>
                          <button
                            type="button"
                            onClick={() => {
                              fetchNotifications()
                              fetchChatHistory()
                              fetchCompanyMemory()
                              fetchReports()
                            }}
                            title="Actualizar"
                            style={{ padding:"7px 10px", fontSize:13, background:"none", color:"rgba(255,255,255,0.4)", border:"none", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"color 0.15s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Home view */}
                      {wsView === "home" && (
                        <div style={{ flex:1, overflowY:"auto", padding:24 }}>
                          {workspaceLoading && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '32px',
                              color: 'rgba(255,255,255,0.6)',
                              fontSize: '13px',
                              gap: '8px',
                            }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(37,99,235,0.3)',
                                borderTop: '2px solid #2563EB',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                              }} />
                              Cargando...
                            </div>
                          )}
                          {/* Greeting */}
                          <div style={{ marginBottom:24 }}>
                            <div style={{ color:"white", fontSize:20, fontWeight:600 }}>Buenos días, Nacho 👋</div>
                            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:13, marginTop:4 }}>Lunes 25 de Mayo, 2026</div>
                          </div>

                          {/* AI daily summary */}
                          <div style={{ background:"rgba(37,99,235,0.06)", border:"1px solid rgba(37,99,235,0.15)", borderRadius:14, padding:20, marginBottom:24 }}>
                            <div style={{ color:"#2563EB", fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>✦ Resumen del día — Pupi AI</div>
                            <div style={{ color:"white", fontSize:14, lineHeight:1.8, marginBottom:16 }}>Hoy tenés 3 alertas que requieren atención: Carlos Acosta está sobrecargado, Laura muestra riesgo de renuncia y hay un gasto inusual en marketing. En ventas, Carlos Mendoza está a punto de cerrar por $18.500. El clima laboral subió a 7.8/10 — el mejor registro histórico.</div>
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                              {[
                                { label:"⚠ 3 alertas activas",      color:"#ef4444" },
                                { label:"💰 1 cierre próximo",       color:"#22c55e" },
                                { label:"📈 Mes récord en ventas",   color:"#2563EB" },
                              ].map(p => (
                                <span key={p.label} style={{ background:p.color+"22", color:p.color, border:`1px solid ${p.color}44`, borderRadius:20, padding:"4px 12px", fontSize:11 }}>{p.label}</span>
                              ))}
                            </div>
                          </div>

                          {/* Priority alerts */}
                          <div style={{ marginBottom:24 }}>
                            <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:12 }}>Alertas prioritarias</div>
                            {allAlerts.map(a => (
                              <div key={a.title} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.02)", borderLeft:`3px solid ${a.color}`, borderTop:"1px solid rgba(255,255,255,0.06)", borderRight:"1px solid rgba(255,255,255,0.06)", borderBottom:"1px solid rgba(255,255,255,0.06)", borderRadius:"0 8px 8px 0", padding:"12px 16px", marginBottom:6, cursor:"pointer" }}>
                                <span style={{ color:a.color, fontSize:16, flexShrink:0 }}>●</span>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ color:"white", fontSize:13, fontWeight:500 }}>{a.title}</div>
                                  <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:2 }}>{a.sub}</div>
                                </div>
                                <span style={{ color:a.color, fontSize:11, flexShrink:0 }}>Ver →</span>
                              </div>
                            ))}
                          </div>

                          {/* Today's tasks */}
                          <div style={{ marginBottom:24 }}>
                            <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Mis tareas de hoy</div>
                            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:12 }}>Generadas por Pupi según prioridad y contexto</div>
                            {TASKS.map(t => {
                              const done = wsTasks[t.id] ?? false
                              const pc = prioColor(done ? "done" : t.prio)
                              return (
                                <div key={t.id} onClick={()=>setWsTasks(prev=>({...prev,[t.id]:!prev[t.id]}))} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, marginBottom:4, cursor:"pointer", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                                  <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${pc}`, background:done?"#22c55e":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                    {done && <span style={{ color:"white", fontSize:9 }}>✓</span>}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ color:done?"rgba(255,255,255,0.35)":"white", fontSize:13, textDecoration:done?"line-through":"none" }}>{t.text}</div>
                                    <div style={{ color:"rgba(255,255,255,0.6)", fontSize:10, marginTop:2 }}>{t.sub}</div>
                                  </div>
                                  <span style={{ background:pc+"22", color:pc, fontSize:10, borderRadius:20, padding:"1px 8px", flexShrink:0 }}>{done?"Completada":t.prio}</span>
                                </div>
                              )
                            })}
                          </div>

                          {/* Module status */}
                          <div style={{ marginBottom:24 }}>
                            <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:12 }}>Estado de módulos</div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                              {MODULES_STATUS.map(m => (
                                <div key={m.name} style={{ ...cardStyle, display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                                  <span style={{ fontSize:16, flexShrink:0 }}>{m.icon}</span>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ color:"white", fontSize:12, fontWeight:500 }}>{m.name}</div>
                                    <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:2 }}>{m.status}</div>
                                  </div>
                                  <div style={{ width:8, height:8, borderRadius:"50%", background:m.dot, flexShrink:0 }} />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quick stats */}
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                            {QUICK_STATS.map(s => (
                              <div key={s.label} style={cardStyle}>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>{s.label}</div>
                                <div style={{ color:s.color, fontSize:20, fontWeight:600 }}>{s.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* History view */}
                      {wsView === "history" && (() => {
                        type HistEvent = { id:number; mod:string; title:string; time:string; detail:string; group:string; tipo:string }
                        const ALL_EVENTS: HistEvent[] = [
                          { id:1,  mod:"Ventas",       title:"Venta cerrada — Tech Solutions",       time:"Hace 2 horas",     detail:"JP cerró venta por $18.500. Registrado automáticamente en contabilidad.",               group:"HOY — 25 Mayo 2026",       tipo:"Ventas cerradas"    },
                          { id:2,  mod:"Contabilidad", title:"Movimiento automático registrado",       time:"Hace 2 horas",     detail:"Ingreso de $18.500 categorizado como Ventas automáticamente.",                          group:"HOY — 25 Mayo 2026",       tipo:"Movimientos"        },
                          { id:3,  mod:"RRHH",         title:"Alerta de riesgo — Laura Sánchez",      time:"Hace 4 horas",     detail:"Tercer semana consecutiva con satisfacción en caída. Pupi generó alerta automática.",    group:"HOY — 25 Mayo 2026",       tipo:"Alertas"            },
                          { id:4,  mod:"CRM",          title:"Cliente actualizado — Tech Solutions",   time:"Hace 4 horas",     detail:"Temperatura actualizada a Caliente. Historial de compra actualizado.",                   group:"HOY — 25 Mayo 2026",       tipo:"Clientes nuevos"    },
                          { id:5,  mod:"Marketing",    title:"Campaña pausada — WhatsApp broadcast",  time:"Ayer 15:30",       detail:"ROI negativo detectado. Pupi recomendó pausar la campaña.",                              group:"AYER — 24 Mayo 2026",      tipo:"Campañas"           },
                          { id:6,  mod:"Ventas",       title:"Nueva oportunidad creada",               time:"Ayer 11:20",       detail:"Luis Herrera agregado al pipeline en etapa Prospecto por $28.500.",                      group:"AYER — 24 Mayo 2026",      tipo:"Ventas cerradas"    },
                          { id:7,  mod:"CRM",          title:"3 clientes importados",                  time:"Ayer 10:00",       detail:"Importación desde Excel completada. Sin duplicados detectados.",                          group:"AYER — 24 Mayo 2026",      tipo:"Clientes nuevos"    },
                          { id:8,  mod:"RRHH",         title:"Evaluación completada — Juan Pérez",     time:"22 Mayo 16:00",    detail:"Evaluación Q2 registrada. Puntuación: 4.8/5.",                                          group:"HACE 3 DÍAS — 22 Mayo 2026", tipo:"Cambios de equipo" },
                          { id:9,  mod:"Contabilidad", title:"Alerta de gasto inusual",                time:"22 Mayo 09:30",    detail:"Gasto en marketing 180% sobre promedio histórico. Alerta generada.",                     group:"HACE 3 DÍAS — 22 Mayo 2026", tipo:"Alertas"           },
                          { id:10, mod:"Ventas",       title:"Meta semanal alcanzada",                 time:"22 Mayo 09:00",    detail:"El equipo alcanzó el 94% de la meta semanal de ventas.",                                 group:"HACE 3 DÍAS — 22 Mayo 2026", tipo:"Ventas cerradas"   },
                          { id:11, mod:"RRHH",         title:"Nuevo empleado — Sofía Reyes",          time:"20 Mayo 10:00",    detail:"Sofía Reyes incorporada como Analista de Operaciones. Onboarding iniciado.",              group:"HACE 5 DÍAS — 20 Mayo 2026", tipo:"Cambios de equipo" },
                          { id:12, mod:"CRM",          title:"Cliente en riesgo — Ana Rodríguez",      time:"20 Mayo 08:00",    detail:"Sin contacto hace 31 días. Alerta automática generada.",                                  group:"HACE 5 DÍAS — 20 Mayo 2026", tipo:"Alertas"           },
                          { id:13, mod:"Marketing",    title:"Nueva campaña lanzada",                  time:"20 Mayo 08:00",    detail:"Campaña Primavera 2026 lanzada. 2.840 contactos en segmento.",                            group:"HACE 5 DÍAS — 20 Mayo 2026", tipo:"Campañas"          },
                        ]
                        const modColor: Record<string,string> = { CRM:"#2563EB", Ventas:"#22c55e", Marketing:"#a855f7", RRHH:"#f97316", Contabilidad:"#eab308" }
                        const modIcon: Record<string,string>  = { CRM:"👥", Ventas:"💰", Marketing:"📢", RRHH:"👤", Contabilidad:"📊" }
                        let filtered = ALL_EVENTS
                        if (histSearch.trim()) filtered = filtered.filter(e => e.title.toLowerCase().includes(histSearch.toLowerCase()) || e.detail.toLowerCase().includes(histSearch.toLowerCase()))
                        if (histModulo !== "Todos") filtered = filtered.filter(e => e.mod === histModulo)
                        if (histTipo   !== "Todos") filtered = filtered.filter(e => e.tipo === histTipo)
                        const groups = Array.from(new Set(filtered.map(e => e.group)))
                        const inputStyle: React.CSSProperties = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"7px 10px", color:"white", fontSize:12, outline:"none", width:"100%", boxSizing:"border-box" as const }
                        const sideBtn = (label: string, active: boolean, onClick: ()=>void) => (
                          <button key={label} onClick={onClick} style={{ display:"block", width:"100%", textAlign:"left", padding:"6px 10px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, background:active?"rgba(37,99,235,0.15)":"none", color:active?"white":"rgba(255,255,255,0.4)", marginBottom:2 }}>{label}</button>
                        )
                        return (
                          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
                            {/* LEFT SIDEBAR */}
                            <div style={{ width:"25%", minWidth:160, borderRight:"1px solid rgba(255,255,255,0.06)", padding:"20px 16px", display:"flex", flexDirection:"column", overflowY:"auto" }}>
                              <input placeholder="Buscar en historial..." value={histSearch} onChange={e=>setHistSearch(e.target.value)} style={inputStyle} />
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:20, marginBottom:8 }}>Módulo</div>
                              {["Todos","CRM","Ventas","Marketing","RRHH","Contabilidad"].map(v => sideBtn(v, histModulo===v, ()=>setHistModulo(v)))}
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:16, marginBottom:8 }}>Tipo</div>
                              {["Todos","Ventas cerradas","Clientes nuevos","Alertas","Movimientos","Cambios de equipo","Campañas"].map(v => sideBtn(v, histTipo===v, ()=>setHistTipo(v)))}
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:16, marginBottom:8 }}>Período</div>
                              {["Hoy","Esta semana","Este mes","Todo el historial"].map(v => sideBtn(v, histPeriodo===v, ()=>setHistPeriodo(v)))}
                              {/* AI summary */}
                              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", marginTop:20, paddingTop:16 }}>
                                <div style={{ color:"#2563EB", fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>✦ Resumen Pupi</div>
                                <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12, lineHeight:1.6, marginBottom:12 }}>Esta semana hubo 14 eventos. 3 alertas generadas, 2 ventas cerradas y 1 empleado nuevo.</div>
                                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                                  <span style={{ color:"white", fontSize:13 }}>14 eventos</span>
                                  <span style={{ color:"#ef4444", fontSize:13 }}>3 alertas</span>
                                  <span style={{ color:"#22c55e", fontSize:13 }}>2 ventas</span>
                                </div>
                              </div>
                            </div>

                            {/* RIGHT SECTION */}
                            <div style={{ flex:1, padding:"20px 24px", display:"flex", flexDirection:"column", overflowY:"auto" }}>
                              {/* Top bar */}
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexShrink:0 }}>
                                <div>
                                  <div style={{ color:"white", fontSize:15, fontWeight:500 }}>Historial de la empresa</div>
                                  <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginTop:2 }}>Todo lo que pasó en Pupi</div>
                                </div>
                                <button style={{ padding:"6px 14px", fontSize:12, background:"none", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>↓ Exportar</button>
                              </div>

                              {/* Timeline */}
                              {groups.length === 0 && (
                                <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, textAlign:"center", marginTop:40 }}>Sin eventos</div>
                              )}
                              {groups.map((grp, gi) => (
                                <div key={grp}>
                                  <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em", padding:"8px 0", marginTop: gi===0 ? 0 : 16 }}>{grp}</div>
                                  {filtered.filter(e=>e.group===grp).map(evt => {
                                    const mc = modColor[evt.mod] ?? "#2563EB"
                                    const mi = modIcon[evt.mod] ?? "●"
                                    return (
                                      <div key={evt.id} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                        {/* Timeline line + dot */}
                                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, width:20 }}>
                                          <div style={{ width:8, height:8, borderRadius:"50%", background:mc, marginTop:4, flexShrink:0 }} />
                                          <div style={{ flex:1, width:1, background:"rgba(37,99,235,0.2)", marginTop:4 }} />
                                        </div>
                                        {/* Content */}
                                        <div style={{ flex:1, minWidth:0, paddingBottom:4 }}>
                                          <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:3 }}>{evt.title}</div>
                                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                                            <span style={{ background:mc+"22", color:mc, borderRadius:20, padding:"1px 8px", fontSize:10 }}>{evt.mod}</span>
                                            <span style={{ color:"rgba(255,255,255,0.65)", fontSize:11 }}>{evt.time}</span>
                                          </div>
                                          <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12, lineHeight:1.5 }}>{evt.detail}</div>
                                        </div>
                                        {/* Module icon */}
                                        <div style={{ width:28, height:28, borderRadius:"50%", background:mc+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0, marginTop:2 }}>{mi}</div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ))}
                              {filtered.length > 0 && (
                                <div style={{ color:"#2563EB", fontSize:12, textAlign:"center", marginTop:16, cursor:"pointer" }}>Ver más eventos →</div>
                              )}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Reports view */}
                      {wsView === "reports" && (
                        <div style={{ flex:1, overflowY:"auto", padding:24 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                            <div>
                              <div style={{ color:"white", fontSize:15, fontWeight:500 }}>Reportes automáticos</div>
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginTop:3 }}>Generados por Pupi AI<br />listos para presentar</div>
                            </div>
                            <button onClick={() => openReportModal(null)} style={{ padding:"7px 14px", fontSize:13, background:"#2563EB", color:"white", border:"none", borderRadius:8, cursor:"pointer", fontWeight:500 }}>+ Nuevo reporte</button>
                          </div>

                          <div>
                            <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:16 }}>Plantillas disponibles</div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12 }}>
                              {WS_REPORT_TEMPLATES.map(template => (
                                <div
                                  key={template.id}
                                  onClick={() => openReportModal(template.id)}
                                  style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:18, cursor:"pointer", transition:"all 200ms" }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.3)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)" }}
                                >
                                  <div style={{ width:40, height:40, borderRadius:"50%", background:template.bg, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}>
                                    {renderReportIcon(template.icon, template.color)}
                                  </div>
                                  <div style={{ color:"white", fontSize:13, fontWeight:500, textAlign:"center", marginTop:10 }}>{template.title}</div>
                                  <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, textAlign:"center", marginTop:4, lineHeight:1.5 }}>{template.description}</div>
                                  <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:10 }}>
                                    {template.tags.map(tag => <span key={tag} style={pillStyle}>{tag}</span>)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ marginTop:32 }}>
                            <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Reportes generados</div>
                            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:16 }}>Historial de reportes<br />creados automáticamente</div>
                            {displayReports.map(report => {
                              const downloadState = wsDownloadStates[report.id] || "idle"
                              return (
                                <div
                                  key={report.id}
                                  style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:16, marginBottom:8, cursor:"pointer", transition:"all 200ms" }}
                                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)" }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)" }}
                                >
                                  <div style={{ width:40, height:40, borderRadius:"50%", background:report.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                    {renderReportIcon(report.icon, report.color)}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ color:"white", fontSize:13, fontWeight:500 }}>{report.name}</div>
                                    <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:4 }}>{report.generated}</div>
                                    <div style={{ display:"flex", gap:6, marginTop:6 }}>
                                      <span style={pillStyle}>{report.period}</span>
                                      <span style={pillStyle}>{report.format}</span>
                                    </div>
                                  </div>
                                  <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11, flexShrink:0 }}>{report.size}</div>
                                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                                    <button style={{ border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", fontSize:11, borderRadius:6, padding:"4px 10px", cursor:"pointer" }}>Ver</button>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation()
                                        if (downloadState !== "idle") return
                                        setWsDownloadStates(prev => ({ ...prev, [report.id]: "loading" }))
                                        setTimeout(() => {
                                          setWsDownloadStates(prev => ({ ...prev, [report.id]: "done" }))
                                          setTimeout(() => setWsDownloadStates(prev => ({ ...prev, [report.id]: "idle" })), 2000)
                                        }, 1500)
                                      }}
                                      style={{ border:`1px solid ${downloadState === "done" ? "#22c55e" : "rgba(37,99,235,0.3)"}`, background:downloadState === "done" ? "#22c55e" : "transparent", color:downloadState === "done" ? "white" : "#2563EB", fontSize:11, borderRadius:6, padding:"4px 10px", cursor:"pointer", minWidth:92, transition:"all 0.2s" }}
                                    >
                                      {downloadState === "idle" && "↓ Descargar"}
                                      {downloadState === "loading" && "Descndo..."}
                                      {downloadState === "done" && "✓ Descargado"}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div style={{ marginTop:32 }}>
                            <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Reportes programados</div>
                            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:16 }}>Se generan automáticamente</div>
                            {SCHEDULED_REPORTS.map(report => (
                              <div key={report.id} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"14px 16px", marginBottom:8 }}>
                                <div style={{ width:36, height:36, borderRadius:"50%", background:report.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                  {renderReportIcon(report.icon, report.color)}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ color:"white", fontSize:13, fontWeight:500 }}>{report.name}</div>
                                  <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:3 }}>{report.schedule}</div>
                                </div>
                                <Toggle on={wsScheduledOn[report.id]} onToggle={() => setWsScheduledOn(prev => ({ ...prev, [report.id]: !prev[report.id] }))} />
                                <button style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:11, marginLeft:12, cursor:"pointer" }}>Editar</button>
                              </div>
                            ))}
                          </div>

                          {showWsReportModal && (
                            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setShowWsReportModal(false)}>
                              <div style={{ background:"#0f1e35", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:24, width:480, maxHeight:"88vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
                                <div style={{ color:"white", fontSize:16, fontWeight:500 }}>{selectedTemplate?.title || "Nuevo reporte"}</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginTop:2, marginBottom:20 }}>Generado por Pupi AI</div>

                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>Período</div>
                                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:wsReportPeriod === "Personalizado" ? 12 : 0 }}>
                                  {["Esta semana", "Este mes", "Último trimestre", "Personalizado"].map(period => (
                                    <button key={period} onClick={() => setWsReportPeriod(period)} style={{ padding:"6px 12px", fontSize:12, borderRadius:6, border:`1px solid ${wsReportPeriod === period ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`, background:wsReportPeriod === period ? "rgba(37,99,235,0.1)" : "transparent", color:wsReportPeriod === period ? "#2563EB" : "rgba(255,255,255,0.4)", cursor:"pointer", transition:"all 0.15s" }}>{period}</button>
                                  ))}
                                </div>
                                {wsReportPeriod === "Personalizado" && (
                                  <div style={{ display:"flex", gap:12, marginTop:10 }}>
                                    <input type="date" value={wsReportFrom} onChange={e => setWsReportFrom(e.target.value)} style={{ flex:1, padding:"7px 10px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"white", fontSize:12, outline:"none", colorScheme:"dark" }} />
                                    <input type="date" value={wsReportTo} onChange={e => setWsReportTo(e.target.value)} style={{ flex:1, padding:"7px 10px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"white", fontSize:12, outline:"none", colorScheme:"dark" }} />
                                  </div>
                                )}

                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12, marginTop:20 }}>Incluir</div>
                                {selectedIncludeOptions.map(label => (
                                  <div key={label} onClick={() => setWsReportChecks(prev => ({ ...prev, [label]: !(prev[label] ?? true) }))} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", cursor:"pointer" }}>
                                    <div style={{ width:16, height:16, borderRadius:4, border:`1px solid ${(wsReportChecks[label] ?? true) ? "#2563EB" : "rgba(255,255,255,0.2)"}`, background:(wsReportChecks[label] ?? true) ? "#2563EB" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:10 }}>✓</div>
                                    <span style={{ color:"rgba(255,255,255,0.65)", fontSize:13 }}>✓ {label}</span>
                                  </div>
                                ))}

                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12, marginTop:20 }}>Formato</div>
                                <div style={{ display:"flex", gap:8 }}>
                                  {["PDF", "Excel", "PowerPoint"].map(format => (
                                    <button key={format} onClick={() => setWsReportFormat(format)} style={{ flex:1, padding:"8px 12px", fontSize:12, borderRadius:8, border:`1px solid ${wsReportFormat === format ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`, background:wsReportFormat === format ? "rgba(37,99,235,0.1)" : "rgba(255,255,255,0.02)", color:wsReportFormat === format ? "#2563EB" : "rgba(255,255,255,0.45)", cursor:"pointer" }}>{format}</button>
                                  ))}
                                </div>

                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8, marginTop:20 }}>Destinatario</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginBottom:5 }}>Título del reporte</div>
                                <input type="text" value={wsReportTitle} onChange={e => setWsReportTitle(e.target.value)} placeholder={"Ej: Reporte ejecutivo\nMayo 2026"} style={{ width:"100%", padding:"8px 12px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"white", fontSize:13, outline:"none", boxSizing:"border-box" }} />
                                <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:14 }}>
                                  <Toggle on={wsReportBrand} onToggle={() => setWsReportBrand(v => !v)} />
                                  <span style={{ color:"rgba(255,255,255,0.6)", fontSize:13 }}>Incluir marca Pupi AI</span>
                                </div>

                                <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:24 }}>
                                  <button onClick={() => setShowWsReportModal(false)} style={{ padding:"8px 16px", fontSize:13, background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>Cancelar</button>
                                  <button
                                    onClick={() => {
                                      if (wsReportGenState !== "idle") return
                                      setWsReportGenState("loading")
                                      setTimeout(() => {
                                        setWsReportGenState("done")
                                        const base = selectedTemplate || WS_REPORT_TEMPLATES[4]
                                        setWsGeneratedReports(prev => [{
                                          id: Date.now(),
                                          icon: base.icon,
                                          color: base.color,
                                          bg: base.bg,
                                          name: wsReportTitle.trim() || `${base.title} — Mayo 2026`,
                                          generated: "Generado el 25 Mayo · Por Pupi AI",
                                          period: wsReportPeriod === "Personalizado" ? "Personalizado" : wsReportPeriod,
                                          format: wsReportFormat,
                                          size: wsReportFormat === "Excel" ? "410 KB" : "296 KB",
                                        }, ...prev])
                                        setTimeout(() => setShowWsReportModal(false), 1000)
                                      }, 2000)
                                    }}
                                    style={{ padding:"8px 16px", fontSize:13, background:wsReportGenState === "done" ? "#22c55e" : "#2563EB", border:"none", borderRadius:8, color:"white", cursor:"pointer", fontWeight:500, minWidth:148, display:"flex", justifyContent:"center", alignItems:"center", gap:6, transition:"background 0.3s" }}
                                  >
                                    {wsReportGenState === "idle" && "Generar reporte"}
                                    {wsReportGenState === "loading" && <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"spin 1s linear infinite" }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>Generando...</>}
                                    {wsReportGenState === "done" && "✓ Reporte listo"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Settings view */}
                      {wsView === "settings" && (() => {
                        const markDirty = () => setWsSettingsDirty(true)
                        const settingsInput: React.CSSProperties = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"8px 12px", color:"white", fontSize:13, width:"100%", outline:"none", boxSizing:"border-box" }
                        const settingsLabel: React.CSSProperties = { color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:6, display:"block" }
                        const sectionLabel: React.CSSProperties = { color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:16 }
                        const SETTINGS_TABS: { key: WsSettingsTab; label: string }[] = [
                          { key:"roles", label:"Roles y permisos" },
                          { key:"empresa", label:"Empresa" },
                          { key:"notificaciones", label:"Notificaciones" },
                          { key:"integraciones", label:"Integraciones" },
                        ]
                        const ROLES = [
                          { id:"dueno", name:"Dueño", count:1, icon:"crown" as const, color:"#eab308", bg:"rgba(234,179,8,0.15)" },
                          { id:"gerente", name:"Gerente", count:0, icon:"briefcase" as const, color:"#2563EB", bg:"rgba(37,99,235,0.15)" },
                          { id:"vendedor", name:"Vendedor", count:3, icon:"trending" as const, color:"#22c55e", bg:"rgba(34,197,94,0.15)" },
                          { id:"empleado", name:"Empleado", count:5, icon:"user" as const, color:"rgba(255,255,255,0.4)", bg:"rgba(255,255,255,0.08)" },
                        ]
                        const USERS_BY_ROLE: Record<string, { name: string; email: string }[]> = {
                          dueno: [{ name:"Nacho", email:"nacho@empresa.com" }],
                          gerente: [],
                          vendedor: [
                            { name:"Juan Pérez", email:"jp@empresa.com" },
                            { name:"Carlos Acosta", email:"ca@empresa.com" },
                            { name:"María Ruiz", email:"mr@empresa.com" },
                          ],
                          empleado: [
                            { name:"Ana González", email:"ana@empresa.com" },
                            { name:"Pedro Martínez", email:"pedro@empresa.com" },
                            { name:"Laura Sánchez", email:"laura@empresa.com" },
                            { name:"Diego Torres", email:"diego@empresa.com" },
                            { name:"Sofía Reyes", email:"sofia@empresa.com" },
                          ],
                        }
                        const MODAL_MODULES: { key: WsPermModule; label: string; icon: React.ReactNode }[] = [
                          { key:"crm", label:"CRM", icon:<Users size={14} style={{ color:"#2563EB" }} /> },
                          { key:"ventas", label:"Ventas", icon:<TrendingUp size={14} style={{ color:"#22c55e" }} /> },
                          { key:"mktg", label:"Marketing", icon:<Megaphone size={14} style={{ color:"#a855f7" }} /> },
                          { key:"rrhh", label:"RRHH", icon:<UserCheck size={14} style={{ color:"#f97316" }} /> },
                          { key:"cont", label:"Contabilidad", icon:<Calculator size={14} style={{ color:"#eab308" }} /> },
                          { key:"config", label:"Configuración", icon:<LayoutDashboard size={14} style={{ color:"rgba(255,255,255,0.5)" }} /> },
                        ]
                        const INTEGRATIONS = [
                          { id:"whatsapp", letter:"W", color:"#22c55e", bg:"rgba(34,197,94,0.15)", name:"WhatsApp Business", desc:"Envío de notificaciones y alertas" },
                          { id:"google", letter:"G", color:"#2563EB", bg:"rgba(37,99,235,0.15)", name:"Google Workspace", desc:"Sincronización de calendario y email" },
                          { id:"mercadopago", letter:"M", color:"#60a5fa", bg:"rgba(96,165,250,0.15)", name:"Mercado Pago", desc:"Registro automático de pagos" },
                          { id:"slack", letter:"S", color:"#a855f7", bg:"rgba(168,85,247,0.15)", name:"Slack", desc:"Alertas y notificaciones al equipo" },
                          { id:"sheets", letter:"G", color:"#22c55e", bg:"rgba(34,197,94,0.15)", name:"Google Sheets", desc:"Exportación automática de datos" },
                          { id:"zapier", letter:"Z", color:"#f97316", bg:"rgba(249,115,22,0.15)", name:"Zapier", desc:"Conectá Pupi con miles de apps" },
                        ]
                        const BRAND_COLORS = ["#2563EB", "#7c3aed", "#db2777", "#059669", "#d97706", "#dc2626"]
                        const permDot = (level: WsPermLevel) => (
                          <div style={{
                            width:20, height:20, borderRadius:"50%", margin:"0 auto",
                            background: level === "full" ? "#22c55e" : level === "partial" ? "#eab308" : "transparent",
                            border: level === "none" ? "1px solid rgba(255,255,255,0.08)" : "none",
                          }} />
                        )
                        const RoleIcon = ({ type, color, bg }: { type: string; color: string; bg: string }) => (
                          <div style={{ width:36, height:36, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            {type === "crown" && <Crown size={16} style={{ color }} />}
                            {type === "briefcase" && <Briefcase size={16} style={{ color }} />}
                            {type === "trending" && <TrendingUp size={16} style={{ color }} />}
                            {type === "user" && <User size={16} style={{ color }} />}
                          </div>
                        )
                        const openPermModal = (roleId: string) => {
                          const perms = wsRolePerms[roleId] || WS_DEFAULT_ROLE_PERMS.dueno
                          setWsPermModalRole(roleId)
                          setWsDraftPerms({ ...perms })
                          const subs: Record<string, boolean> = {}
                          Object.entries(wsPartialSubChecks).forEach(([mod, opts]) => {
                            Object.entries(opts).forEach(([k, v]) => { subs[`${mod}:${k}`] = v })
                          })
                          setWsDraftPartialSubs(subs)
                          setShowWsPermModal(true)
                        }
                        const permPill = (label: string, active: boolean, color: string, onClick: () => void) => (
                          <button onClick={onClick} style={{
                            padding:"4px 10px", fontSize:11, borderRadius:6, cursor:"pointer",
                            background: active ? `${color}22` : "rgba(255,255,255,0.05)",
                            color: active ? color : "rgba(255,255,255,0.4)",
                            border: active ? `1px solid ${color}55` : "1px solid transparent",
                          }}>{label}</button>
                        )
                        const editingRole = ROLES.find(r => r.id === wsPermModalRole)
                        return (
                          <div style={{ flex:1, overflowY:"auto", padding:24 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                              <div>
                                <div style={{ color:"white", fontSize:15, fontWeight:500 }}>Configuración</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginTop:3 }}>Roles, permisos y preferencias</div>
                              </div>
                              <button
                                disabled={!wsSettingsDirty}
                                onClick={() => setWsSettingsDirty(false)}
                                style={{
                                  padding:"7px 14px", fontSize:13, fontWeight:500, border:"none", borderRadius:8, cursor: wsSettingsDirty ? "pointer" : "not-allowed",
                                  background:"#2563EB", color:"white", opacity: wsSettingsDirty ? 1 : 0.5, transition:"opacity 0.15s",
                                }}
                              >Guardar cambios</button>
                            </div>

                            <div style={{ display:"flex", gap:0, borderBottom:"1px solid rgba(255,255,255,0.06)", marginBottom:24 }}>
                              {SETTINGS_TABS.map(tab => (
                                <button key={tab.key} onClick={() => setWsSettingsTab(tab.key)} style={{
                                  padding:"12px 16px", fontSize:13, background:"none", border:"none", cursor:"pointer",
                                  color: wsSettingsTab === tab.key ? "white" : "rgba(255,255,255,0.35)",
                                  borderBottom:`2px solid ${wsSettingsTab === tab.key ? "#2563EB" : "transparent"}`,
                                  marginBottom:-1, transition:"color 0.15s, border-color 0.15s", whiteSpace:"nowrap" as const,
                                }}>{tab.label}</button>
                              ))}
                            </div>

                            {wsSettingsTab === "roles" && (
                              <div>
                                <div style={sectionLabel}>ROLES DEL SISTEMA</div>
                                {ROLES.map(role => (
                                  <div key={role.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"18px 20px", marginBottom:10 }}>
                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                      <div style={{ display:"flex", alignItems:"center" }}>
                                        <RoleIcon type={role.icon} color={role.color} bg={role.bg} />
                                        <span style={{ color:"white", fontSize:14, fontWeight:500, marginLeft:10 }}>{role.name}</span>
                                        <span style={{ marginLeft:10, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", borderRadius:20, padding:"2px 8px", fontSize:11 }}>{role.count} {role.count === 1 ? "usuario" : "usuarios"}</span>
                                      </div>
                                      <button onClick={() => openPermModal(role.id)} style={{ background:"none", border:"none", color:"#2563EB", fontSize:12, cursor:"pointer" }}>Editar permisos</button>
                                    </div>
                                    <div style={{ marginTop:14 }}>
                                      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:6 }}>
                                        {WS_PERM_MODULES.map(m => (
                                          <div key={m.key} style={{ color:"rgba(255,255,255,0.6)", fontSize:10, textAlign:"center", marginBottom:4 }}>{m.label}</div>
                                        ))}
                                        {WS_PERM_MODULES.map(m => (
                                          <div key={`dot-${m.key}`}>{permDot((wsRolePerms[role.id] || WS_DEFAULT_ROLE_PERMS.dueno)[m.key])}</div>
                                        ))}
                                      </div>
                                      <div style={{ display:"flex", gap:12, marginTop:10 }}>
                                        <span style={{ color:"#22c55e", fontSize:10 }}>● Acceso completo</span>
                                        <span style={{ color:"#eab308", fontSize:10 }}>● Acceso parcial</span>
                                        <span style={{ color:"rgba(255,255,255,0.6)", fontSize:10 }}>○ Sin acceso</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                <div style={{ ...sectionLabel, marginTop:24 }}>USUARIOS POR ROL</div>
                                {ROLES.map(role => {
                                  const users = USERS_BY_ROLE[role.id] || []
                                  const expanded = wsRoleExpanded[role.id] ?? false
                                  return (
                                    <div key={`grp-${role.id}`} style={{ marginBottom:6 }}>
                                      <div
                                        onClick={() => { setWsRoleExpanded(prev => ({ ...prev, [role.id]: !expanded })); markDirty() }}
                                        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, cursor:"pointer" }}
                                      >
                                        <span style={{ color:"white", fontSize:13, fontWeight:500 }}>{role.name}</span>
                                        <span style={{ color:"rgba(255,255,255,0.7)", fontSize:12 }}>{users.length} {expanded ? "▲" : "▼"}</span>
                                      </div>
                                      {expanded && (
                                        <div style={{ borderLeft:"1px solid rgba(255,255,255,0.06)", marginLeft:8, marginTop:4 }}>
                                          {users.length === 0 ? (
                                            <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:8 }}>
                                              <span style={{ color:"rgba(255,255,255,0.55)", fontSize:12, fontStyle:"italic" }}>Sin gerentes asignados</span>
                                              {role.id === "gerente" && <button onClick={markDirty} style={{ background:"none", border:"none", color:"#2563EB", fontSize:11, cursor:"pointer" }}>+ Asignar gerente</button>}
                                            </div>
                                          ) : users.map(u => (
                                            <div key={u.email} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                              <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(37,99,235,0.2)", color:"#2563EB", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{getInitials(u.name)}</div>
                                              <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ color:"white", fontSize:13 }}>{u.name}</div>
                                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11 }}>{u.email}</div>
                                              </div>
                                              <button onClick={markDirty} style={{ background:"none", border:"none", color:"#2563EB", fontSize:11, cursor:"pointer", marginLeft:"auto", flexShrink:0 }}>Cambiar rol</button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {wsSettingsTab === "empresa" && (
                              <div style={{ display:"flex", gap:32, maxWidth:720 }}>
                                <div style={{ flex:1 }}>
                                  {[
                                    { label:"Nombre de la empresa", el:<input style={settingsInput} value={wsEmpresaNombre} onChange={e => { setWsEmpresaNombre(e.target.value); markDirty() }} /> },
                                    { label:"Rubro / Industria", el:<input style={settingsInput} value={wsEmpresaRubro} onChange={e => { setWsEmpresaRubro(e.target.value); markDirty() }} /> },
                                    { label:"Años en el mercado", el:<input type="number" style={settingsInput} value={wsEmpresaAnios} onChange={e => { setWsEmpresaAnios(e.target.value); markDirty() }} /> },
                                    { label:"Cantidad de empleados", el:<input type="number" style={settingsInput} value={wsEmpresaEmpleados} onChange={e => { setWsEmpresaEmpleados(e.target.value); markDirty() }} /> },
                                    { label:"País", el:(
                                      <select style={{ ...settingsInput, appearance:"none" as const }} value={wsEmpresaPais} onChange={e => { setWsEmpresaPais(e.target.value); markDirty() }}>
                                        <option value="Argentina" style={{ background:"#0D0D14" }}>Argentina</option>
                                        <option value="Chile" style={{ background:"#0D0D14" }}>Chile</option>
                                        <option value="Uruguay" style={{ background:"#0D0D14" }}>Uruguay</option>
                                      </select>
                                    )},
                                    { label:"Ciudad", el:<input style={settingsInput} value={wsEmpresaCiudad} onChange={e => { setWsEmpresaCiudad(e.target.value); markDirty() }} /> },
                                    { label:"Sitio web (opcional)", el:<input style={settingsInput} value={wsEmpresaWeb} onChange={e => { setWsEmpresaWeb(e.target.value); markDirty() }} /> },
                                    { label:"Descripción breve", el:<textarea style={{ ...settingsInput, minHeight:80, resize:"vertical" }} value={wsEmpresaDesc} onChange={e => { setWsEmpresaDesc(e.target.value); markDirty() }} /> },
                                  ].map(f => (
                                    <div key={f.label} style={{ marginBottom:14 }}>
                                      <label style={settingsLabel}>{f.label}</label>
                                      {f.el}
                                    </div>
                                  ))}
                                </div>
                                <div style={{ width:200, flexShrink:0 }}>
                                  <label style={settingsLabel}>Logo</label>
                                  <div onClick={markDirty} style={{ width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1px dashed rgba(255,255,255,0.1)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", marginBottom:24 }}>
                                    <Camera size={24} style={{ color:"rgba(255,255,255,0.5)" }} />
                                    <span style={{ color:"rgba(255,255,255,0.6)", fontSize:11, marginTop:6 }}>Subir logo</span>
                                  </div>
                                  <label style={settingsLabel}>Color de marca</label>
                                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                                    {BRAND_COLORS.map(c => (
                                      <button key={c} onClick={() => { setWsBrandColor(c); markDirty() }} style={{
                                        width:24, height:24, borderRadius:"50%", background:c, border:"none", cursor:"pointer",
                                        outline: wsBrandColor === c ? "2px solid white" : "none", outlineOffset:2,
                                      }} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {wsSettingsTab === "notificaciones" && (
                              <div style={{ maxWidth:560 }}>
                                <div style={sectionLabel}>ALERTAS EN TIEMPO REAL</div>
                                {([
                                  { key:"ventasCerradas", label:"Ventas cerradas", desc:"Aviso cuando se cierra una venta" },
                                  { key:"nuevasOportunidades", label:"Nuevas oportunidades", desc:"Cuando se crea una oportunidad en el pipeline" },
                                  { key:"clientesRiesgo", label:"Clientes en riesgo", desc:"Cliente sin contacto según su ciclo" },
                                  { key:"alertasFinancieras", label:"Alertas financieras", desc:"Gastos inusuales o vencimientos" },
                                  { key:"estadoEquipo", label:"Estado del equipo", desc:"Cambios en clima laboral o alertas RRHH" },
                                  { key:"campanasBajo", label:"Campañas con bajo rendimiento", desc:"ROI negativo o bajo en marketing" },
                                  { key:"metasRiesgo", label:"Metas en riesgo", desc:"Cuando una meta semanal está en peligro" },
                                  { key:"resumenDiario", label:"Resumen diario automático", desc:"Resumen de Pupi AI cada mañana" },
                                ] as const).map(row => (
                                  <div key={row.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                    <div>
                                      <div style={{ color:"white", fontSize:13 }}>{row.label}</div>
                                      <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>{row.desc}</div>
                                    </div>
                                    <Toggle on={wsNotifAlerts[row.key]} onToggle={() => { setWsNotifAlerts(prev => ({ ...prev, [row.key]: !prev[row.key] })); markDirty() }} />
                                  </div>
                                ))}
                                <div style={{ ...sectionLabel, marginTop:24 }}>FRECUENCIA DE RESÚMENES</div>
                                {([
                                  { key:"diario" as const, label:"Resumen diario", desc:"Cada mañana a las 8:00" },
                                  { key:"semanal" as const, label:"Resumen semanal", desc:"Todos los lunes" },
                                  { key:"mensual" as const, label:"Resumen mensual", desc:"Primer día del mes" },
                                ]).map(row => (
                                  <div key={row.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                    <div>
                                      <div style={{ color:"white", fontSize:13 }}>{row.label}</div>
                                      <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>{row.desc}</div>
                                    </div>
                                    <Toggle on={wsNotifFreq[row.key]} onToggle={() => { setWsNotifFreq(prev => ({ ...prev, [row.key]: !prev[row.key] })); markDirty() }} />
                                  </div>
                                ))}
                                <div style={{ ...sectionLabel, marginTop:24 }}>CANALES</div>
                                {([
                                  { key:"pupi" as const, label:"Notificaciones en Pupi", desc:"Dentro de la plataforma" },
                                  { key:"email" as const, label:"Email", desc:"A tu correo registrado" },
                                  { key:"whatsapp" as const, label:"WhatsApp", desc:"Alertas por mensaje" },
                                ]).map(row => (
                                  <div key={row.key}>
                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                      <div>
                                        <div style={{ color:"white", fontSize:13 }}>{row.label}</div>
                                        <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>{row.desc}</div>
                                      </div>
                                      <Toggle on={wsNotifChannels[row.key]} onToggle={() => { setWsNotifChannels(prev => ({ ...prev, [row.key]: !prev[row.key] })); markDirty() }} />
                                    </div>
                                    {row.key === "whatsapp" && wsNotifChannels.whatsapp && (
                                      <button onClick={markDirty} style={{ background:"none", border:"none", color:"#2563EB", fontSize:11, cursor:"pointer", marginBottom:8, paddingLeft:0 }}>+ Configurar número</button>
                                    )}
                                  </div>
                                ))}

                                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", marginTop:24, marginBottom:16 }}>VOZ Y ASISTENTE</div>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                  <div>
                                    <div style={{ color:"white", fontSize:13 }}>Activación por espacio</div>
                                    <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>Mantené ␣ 2 segundos para hablar</div>
                                  </div>
                                  <Toggle on={voiceSpaceEnabled} onToggle={() => setVoiceSpaceEnabled(v => !v)} />
                                </div>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                  <div>
                                    <div style={{ color:"white", fontSize:13 }}>Palabra de activación — &ldquo;Pupi&rdquo;</div>
                                    <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>Desactivado: solo te escucha al decir &ldquo;Pupi&rdquo;. Activá para que escuche constantemente.</div>
                                  </div>
                                  <Toggle on={voiceWakeEnabled} onToggle={() => setVoiceWakeEnabled(v => !v)} />
                                </div>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                  <div>
                                    <div style={{ color:"white", fontSize:13 }}>Respuesta por voz</div>
                                    <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>Pupi te responde hablando</div>
                                  </div>
                                  <Toggle on={voiceResponseEnabled} onToggle={() => setVoiceResponseEnabled(v => !v)} />
                                </div>
                              </div>
                            )}

                            {wsSettingsTab === "integraciones" && (
                              <div style={{ maxWidth:640 }}>
                                <div style={sectionLabel}>INTEGRACIONES DISPONIBLES</div>
                                {INTEGRATIONS.map(integ => {
                                  const connected = wsIntegrations[integ.id]
                                  return (
                                    <div key={integ.id} style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:16, marginBottom:8 }}>
                                      <div style={{ width:40, height:40, borderRadius:"50%", background:integ.bg, color:integ.color, fontSize:16, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{integ.letter}</div>
                                      <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{ color:"white", fontSize:13, fontWeight:500 }}>{integ.name}</div>
                                        <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginTop:2 }}>{integ.desc}</div>
                                      </div>
                                      {connected ? (
                                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                                          <span style={{ color:"#22c55e", fontSize:12 }}>✓ Conectado</span>
                                          <button onClick={() => { setWsIntegrations(prev => ({ ...prev, [integ.id]: false })); markDirty() }} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:11, cursor:"pointer" }}>Desconectar</button>
                                        </div>
                                      ) : (
                                        <button onClick={() => { setWsIntegrations(prev => ({ ...prev, [integ.id]: true })); markDirty() }} style={{ border:"1px solid rgba(37,99,235,0.3)", background:"transparent", color:"#2563EB", fontSize:12, borderRadius:6, padding:"5px 12px", cursor:"pointer", flexShrink:0 }}>Conectar →</button>
                                      )}
                                    </div>
                                  )
                                })}
                                <div style={{ color:"rgba(255,255,255,0.5)", fontSize:12, textAlign:"center", marginTop:16 }}>Más integraciones próximamente</div>
                              </div>
                            )}

                            {showWsPermModal && editingRole && (
                              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setShowWsPermModal(false)}>
                                <div style={{ background:"#0f1e35", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:24, width:520, maxHeight:"88vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
                                  <div style={{ color:"white", fontSize:16, fontWeight:500, marginBottom:20 }}>Permisos — {editingRole.name}</div>
                                  {MODAL_MODULES.map(mod => {
                                    const level = wsDraftPerms[mod.key]
                                    const setLevel = (l: WsPermLevel) => {
                                      setWsDraftPerms(prev => ({ ...prev, [mod.key]: l }))
                                      markDirty()
                                    }
                                    const subOpts = WS_PARTIAL_SUB_OPTS[mod.key]
                                    return (
                                      <div key={mod.key} style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"14px 0" }}>
                                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                            {mod.icon}
                                            <span style={{ color:"white", fontSize:13 }}>{mod.label}</span>
                                          </div>
                                          <div style={{ display:"flex", gap:6 }}>
                                            {permPill("Sin acceso", level === "none", "rgba(255,255,255,0.3)", () => setLevel("none"))}
                                            {permPill("Parcial", level === "partial", "#eab308", () => setLevel("partial"))}
                                            {permPill("Completo", level === "full", "#22c55e", () => setLevel("full"))}
                                          </div>
                                        </div>
                                        {level === "partial" && subOpts && (
                                          <div style={{ marginTop:10, paddingLeft:22 }}>
                                            {subOpts.map(opt => {
                                              const ck = `${mod.key}:${opt}`
                                              return (
                                                <label key={opt} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, cursor:"pointer" }}>
                                                  <input
                                                    type="checkbox"
                                                    checked={wsDraftPartialSubs[ck] ?? false}
                                                    onChange={() => {
                                                      setWsDraftPartialSubs(prev => ({ ...prev, [ck]: !prev[ck] }))
                                                      markDirty()
                                                    }}
                                                    style={{ accentColor:"#2563EB" }}
                                                  />
                                                  <span style={{ color:"rgba(255,255,255,0.6)", fontSize:12 }}>{opt}</span>
                                                </label>
                                              )
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:20 }}>
                                    <button onClick={() => setShowWsPermModal(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer" }}>Cancelar</button>
                                    <button
                                      onClick={() => {
                                        if (wsPermModalRole) {
                                          setWsRolePerms(prev => ({ ...prev, [wsPermModalRole]: { ...wsDraftPerms } }))
                                        }
                                        setShowWsPermModal(false)
                                        markDirty()
                                      }}
                                      style={{ padding:"8px 16px", fontSize:13, background:"#2563EB", color:"white", border:"none", borderRadius:8, cursor:"pointer", fontWeight:500 }}
                                    >Guardar permisos</button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}


                      {wsView === "onboarding" && (() => {
                        const onbInput: React.CSSProperties = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"8px 12px", color:"white", fontSize:13, width:"100%", outline:"none", boxSizing:"border-box" }
                        const onbField = (label: string, child: React.ReactNode) => (
                          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            <span style={{ color:"rgba(255,255,255,0.7)", fontSize:11 }}>{label}</span>
                            {child}
                          </div>
                        )
                        const stepNum = wsOnbStage === "form" ? 1 : wsOnbStage === "upload" ? 2 : 3
                        const onbSteps = ["Información", "Archivos históricos", "Diagnóstico inicial"]
                        const painPoints = ["Pierdo clientes sin darme cuenta","No sé qué hace mi equipo","La contabilidad es un caos","Mis vendedores no tienen seguimiento","No sé qué campañas funcionan","Tomo decisiones sin datos","Demasiado trabajo manual","No tengo visibilidad del negocio"]
                        const goals = ["Aumentar ventas","Reducir costos","Mejorar el equipo","Ordenar la contabilidad","Crecer con marketing","Automatizar procesos"]
                        const tools = ["Excel / Google Sheets","WhatsApp","Email","Otro CRM","Software contable","Papel y lápiz","Nada / memoria","Otro"]
                        const rubros = ["Comercio / Retail","Distribución / Mayorista","Servicios profesionales","Tecnología","Construcción","Gastronomía","Salud","Educación","Manufactura","Otro"]
                        const factOpts = ["Menos de $10.000 USD","$10.000 - $50.000 USD","$50.000 - $200.000 USD","Más de $200.000 USD","Prefiero no decir"]
                        const freqOpts = ["Diaria","Semanal","Quincenal","Mensual","Trimestral","Variable"]
                        const togglePill = (label: string, map: Record<string, boolean>, setMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, sel: { bg: string; color: string; border: string }) => {
                          const on = !!map[label]
                          return (
                            <span key={label} onClick={() => setMap(prev => ({ ...prev, [label]: !prev[label] }))} style={{ borderRadius:8, padding:"8px 14px", fontSize:12, cursor:"pointer", background:on ? sel.bg : "rgba(255,255,255,0.04)", color:on ? sel.color : "rgba(255,255,255,0.7)", border:`1px solid ${on ? sel.border : "rgba(255,255,255,0.08)"}` }}>{label}</span>
                          )
                        }
                        const UPLOAD_ZONES = [
                          { id:"users", icon:Users, color:"#2563EB", required:true, title:"Lista de clientes", desc:"Exportá tu base de clientes existente", formats:"Excel, CSV · Máx 10MB" },
                          { id:"sales", icon:TrendingUp, color:"#22c55e", required:true, title:"Historial de ventas", desc:"Ventas o transacciones anteriores", formats:"Excel, CSV · Máx 10MB" },
                          { id:"payroll", icon:UserCheck, color:"#f97316", required:false, title:"Nómina de empleados", desc:"Lista del equipo y sus datos", formats:"Excel, CSV, PDF · Máx 5MB" },
                          { id:"financial", icon:Calculator, color:"#eab308", required:false, title:"Estados financieros", desc:"Balance, P&L o extractos bancarios", formats:"Excel, PDF · Máx 10MB" },
                          { id:"campaigns", icon:Megaphone, color:"#a855f7", required:false, title:"Campañas anteriores", desc:"Resultados de marketing previos", formats:"Excel, CSV · Máx 5MB" },
                          { id:"other", icon:FileText, color:"rgba(255,255,255,0.4)", required:false, title:"Otros documentos", desc:"Cualquier info relevante del negocio", formats:"PDF, Word, Excel · Máx 20MB" },
                        ]
                        const startAnalysis = () => {
                          setWsOnboardingProcessing(true)
                          setWsOnbProgress(0)
                          setWsOnbProcSteps([])
                          const procMsgs = ["✓ Importando clientes...","✓ Procesando historial de ventas...","✓ Analizando movimientos financieros...","✓ Detectando patrones...","⟳ Generando diagnóstico..."]
                          const start = Date.now()
                          const progressTimer = setInterval(() => {
                            const elapsed = Date.now() - start
                            setWsOnbProgress(Math.min(100, (elapsed / 3000) * 100))
                          }, 40)
                          procMsgs.forEach((msg, i) => {
                            setTimeout(() => setWsOnbProcSteps(prev => [...prev, msg]), i * 600)
                          })
                          setTimeout(() => {
                            clearInterval(progressTimer)
                            setWsOnbProgress(100)
                            setWsOnboardingProcessing(false)
                            setWsOnbStage("diagnosis")
                          }, 3200)
                        }
                        const aiCard: React.CSSProperties = { background:"rgba(37,99,235,0.06)", border:"1px solid rgba(37,99,235,0.15)", borderRadius:8, padding:"12px 14px", marginBottom:8 }
                        const prioColor = (p: string) => p === "Urgente" ? "#ef4444" : p === "Alta" ? "#f97316" : "#eab308"
                        return (
                          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
                            <div style={{ flex:1, overflowY:"auto", padding:24 }}>
                              <div style={{ display:"flex", alignItems:"flex-start", marginBottom:32 }}>
                                {onbSteps.map((label, idx) => {
                                  const n = idx + 1
                                  const isActive = stepNum === n
                                  const isDone = stepNum > n
                                  return (
                                    <div key={n} style={{ display:"flex", alignItems:"flex-start", flex:1 }}>
                                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flexShrink:0 }}>
                                        <div style={{ width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, background:isActive?"#2563EB":isDone?"rgba(37,99,235,0.2)":"rgba(255,255,255,0.06)", color:isActive?"white":isDone?"#2563EB":"rgba(255,255,255,0.6)" }}>{n}</div>
                                        <div style={{ fontSize:11, color:isActive?"white":"rgba(255,255,255,0.6)", whiteSpace:"nowrap" }}>{n}. {label}</div>
                                      </div>
                                      {idx < onbSteps.length - 1 && <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)", marginTop:10, marginLeft:8, marginRight:8 }} />}
                                    </div>
                                  )
                                })}
                              </div>

                              {wsOnbStage === "form" && (
                                <>
                                  <div style={{ color:"white", fontSize:18, fontWeight:500, marginBottom:4 }}>Contanos sobre tu empresa</div>
                                  <div style={{ color:"rgba(255,255,255,0.7)", fontSize:13, marginBottom:28 }}>Esta información permite a Pupi entender tu negocio desde el primer día</div>
                                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
                                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                                      <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Tu negocio</div>
                                      {onbField("Nombre de la empresa", <input style={onbInput} placeholder="Ej: Distribuidora Norte" value={wsOnbEmpresa} onChange={e=>setWsOnbEmpresa(e.target.value)} />)}
                                      {onbField("Rubro", <select value={wsOnbRubro} onChange={e=>setWsOnbRubro(e.target.value)} style={{ ...onbInput, appearance:"none" as const }}>{["Comercio / Retail","Distribución / Mayorista","Servicios profesionales","Tecnología","Construcción","Gastronomía","Salud","Educación","Manufactura","Otro"].map(o=><option key={o} value={o}>{o}</option>)}</select>)}
                                      {onbField("Años en el mercado", <input type="number" style={onbInput} placeholder="Ej: 5" value={wsOnbAnios} onChange={e=>setWsOnbAnios(e.target.value)} />)}
                                      {onbField("Facturación mensual aprox", <select value={wsOnbFacturacion} onChange={e=>setWsOnbFacturacion(e.target.value)} style={{ ...onbInput, appearance:"none" as const }}>{["Menos de $10.000 USD","$10.000 - $50.000 USD","$50.000 - $200.000 USD","Más de $200.000 USD","Prefiero no decir"].map(o=><option key={o}>{o}</option>)}</select>)}
                                      {onbField("Descripción del negocio", <textarea style={{ ...onbInput, minHeight:80, resize:"vertical" }} placeholder="Describí brevemente qué hace tu empresa, a quién le vendés y cómo trabajás..." value={wsOnbDescNegocio} onChange={e=>setWsOnbDescNegocio(e.target.value)} />)}
                                      <div style={{ color:"white", fontSize:13, fontWeight:500, marginTop:8, marginBottom:4 }}>Tu equipo</div>
                                      {onbField("Cantidad de empleados", <input type="number" style={onbInput} placeholder="Ej: 8" value={wsOnbEmpleados} onChange={e=>setWsOnbEmpleados(e.target.value)} />)}
                                      {onbField("Cantidad de vendedores", <input type="number" style={onbInput} placeholder="Ej: 3" value={wsOnbVendedores} onChange={e=>setWsOnbVendedores(e.target.value)} />)}
                                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                        <span style={{ color:"rgba(255,255,255,0.7)", fontSize:11 }}>¿Tenés sucursales?</span>
                                        <Toggle on={wsOnbSucursales} onToggle={()=>setWsOnbSucursales(v=>!v)} />
                                      </div>
                                      {wsOnbSucursales && onbField("¿Cuántas?", <input type="number" style={onbInput} placeholder="Ej: 2" value={wsOnbSucursalesCount} onChange={e=>setWsOnbSucursalesCount(e.target.value)} />)}
                                    </div>
                                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                                      <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Tus clientes</div>
                                      {onbField("Perfil del cliente típico", <select value={wsOnbPerfilCliente} onChange={e=>setWsOnbPerfilCliente(e.target.value)} style={{ ...onbInput, appearance:"none" as const }}>{["Empresas (B2B)","Consumidor final (B2C)","Ambos"].map(o=><option key={o}>{o}</option>)}</select>)}
                                      {onbField("Ticket promedio", <div style={{ position:"relative" }}><span style={{ position:"absolute", left:12, top:9, color:"rgba(255,255,255,0.6)", fontSize:13 }}>$</span><input type="number" style={{ ...onbInput, paddingLeft:24 }} placeholder="0" value={wsOnbTicket} onChange={e=>setWsOnbTicket(e.target.value)} /></div>)}
                                      {onbField("Frecuencia de compra promedio", <select value={wsOnbFrecuencia} onChange={e=>setWsOnbFrecuencia(e.target.value)} style={{ ...onbInput, appearance:"none" as const }}>{["Diaria","Semanal","Quincenal","Mensual","Trimestral","Variable"].map(o=><option key={o}>{o}</option>)}</select>)}
                                      {onbField("Zona geográfica", <input style={onbInput} placeholder="Ej: Montevideo, todo Uruguay, América Latina" value={wsOnbZona} onChange={e=>setWsOnbZona(e.target.value)} />)}
                                      <div style={{ color:"white", fontSize:13, fontWeight:500, marginTop:8 }}>Tus dolores actuales</div>
                                      <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:4 }}>Seleccioná los que apliquen</div>
                                      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{painPoints.map(p=>togglePill(p,wsOnbPainPoints,setWsOnbPainPoints,{ bg:"rgba(239,68,68,0.1)", color:"#ef4444", border:"rgba(239,68,68,0.3)" }))}</div>
                                      <div style={{ color:"white", fontSize:13, fontWeight:500, marginTop:8 }}>Tus objetivos</div>
                                      <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:4 }}>¿Qué querés lograr en 6 meses?</div>
                                      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{goals.map(g=>togglePill(g,wsOnbGoals,setWsOnbGoals,{ bg:"rgba(34,197,94,0.1)", color:"#22c55e", border:"rgba(34,197,94,0.3)" }))}</div>
                                      <div style={{ color:"white", fontSize:13, fontWeight:500, marginTop:8 }}>Herramientas actuales</div>
                                      <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:4 }}>¿Qué usás hoy para gestionar?</div>
                                      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{tools.map(t=>togglePill(t,wsOnbTools,setWsOnbTools,{ bg:"rgba(37,99,235,0.1)", color:"#2563EB", border:"rgba(37,99,235,0.3)" }))}</div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {wsOnbStage === "upload" && (
                                <>
                                  <div style={{ color:"white", fontSize:18, fontWeight:500, marginBottom:4 }}>Cargá tu historial</div>
                                  <div style={{ color:"rgba(255,255,255,0.7)", fontSize:13, marginBottom:28 }}>Pupi analizará todo lo que tenés y lo convertirá en insights desde el día uno</div>
                                  {UPLOAD_ZONES.map(z => {
                                    const Icon = z.icon
                                    const file = wsOnbUploads[z.id]
                                    return (
                                      <div key={z.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:18, marginBottom:10, display:"flex", alignItems:"center", gap:16 }}>
                                        <div style={{ width:44, height:44, borderRadius:"50%", background:z.color+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon size={20} style={{ color:z.color }} /></div>
                                        <div style={{ flex:1, minWidth:0 }}>
                                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                            <span style={{ color:"white", fontSize:13, fontWeight:500 }}>{z.title}</span>
                                            {!z.required && <span style={{ color:"rgba(255,255,255,0.6)", fontSize:10, border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"1px 6px" }}>Opcional</span>}
                                          </div>
                                          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginTop:2 }}>{z.desc}</div>
                                          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, marginTop:2 }}>{z.formats}</div>
                                        </div>
                                        {file ? (
                                          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                                            <div style={{ textAlign:"right" }}>
                                              <div style={{ color:"white", fontSize:12 }}>{file.name}</div>
                                              <div style={{ color:"rgba(255,255,255,0.6)", fontSize:10 }}>{file.size}</div>
                                            </div>
                                            <button onClick={()=>setWsOnbUploads(prev=>({...prev,[z.id]:null}))} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:14 }}>✕</button>
                                          </div>
                                        ) : (
                                          <button onClick={()=>setWsOnbUploads(prev=>({...prev,[z.id]:{ name:`${z.id}.csv`, size:"1.2 MB" }}))} style={{ border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", fontSize:12, borderRadius:6, padding:"6px 14px", background:"none", cursor:"pointer", flexShrink:0 }}>Subir archivo</button>
                                        )}
                                      </div>
                                    )
                                  })}
                                  <div style={{ marginTop:20, background:"rgba(37,99,235,0.06)", border:"1px solid rgba(37,99,235,0.15)", borderRadius:10, padding:16, display:"flex", gap:12 }}>
                                    <Brain size={20} style={{ color:"#2563EB", flexShrink:0 }} />
                                    <div style={{ color:"rgba(255,255,255,0.6)", fontSize:12, lineHeight:1.6 }}>Pupi procesará todos los archivos automáticamente. Detectará patrones, importará clientes, categorizará movimientos y preparará un diagnóstico personalizado de tu negocio. Esto puede tardar 1-2 minutos.</div>
                                  </div>
                                </>
                              )}

                              {wsOnbStage === "diagnosis" && (
                                <>
                                  <div style={{ color:"#2563EB", fontSize:18, fontWeight:500, marginBottom:4 }}>✦ Diagnóstico inicial de Pupi</div>
                                  <div style={{ color:"rgba(255,255,255,0.7)", fontSize:13, marginBottom:28 }}>Basado en todo lo que cargaste — actualizado en tiempo real</div>
                                  <div style={{ background:"rgba(37,99,235,0.06)", border:"1px solid rgba(37,99,235,0.15)", borderRadius:14, padding:22, marginBottom:24 }}>
                                    <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", marginBottom:12 }}>RESUMEN DE TU NEGOCIO</div>
                                    <div style={{ color:"white", fontSize:14, lineHeight:1.8 }}>Distribuidora Norte es una empresa con 5 años en el mercado en el sector de distribución mayorista. Cuenta con 8 empleados y 3 vendedores. Tu base tiene 284 clientes con un ticket promedio de $4.200 y frecuencia de compra mensual. Las ventas muestran estacionalidad en mayo y noviembre.</div>
                                    <div style={{ display:"flex", borderTop:"1px solid rgba(255,255,255,0.06)", marginTop:16, paddingTop:16 }}>
                                      {[{v:"284",l:"CLIENTES"},{v:"$4.200",l:"TICKET PROM"},{v:"8",l:"EMPLEADOS"},{v:"5 años",l:"TRAYECTORIA"}].map((s,i,a)=>(
                                        <div key={s.l} style={{ flex:1, textAlign:"center", borderRight:i<a.length-1?"1px solid rgba(255,255,255,0.06)":"none" }}>
                                          <div style={{ color:"white", fontSize:20, fontWeight:600 }}>{s.v}</div>
                                          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", marginTop:4 }}>{s.l}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div style={{ marginBottom:24 }}>
                                    <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:16 }}>Hallazgos principales</div>
                                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                                      {[
                                        { icon:TrendingUp, color:"#22c55e", title:"Pico de ventas en mayo y noviembre", detail:"Tus mejores meses concentran el 42% de las ventas anuales. Podés prepararte con anticipación.", badge:"Oportunidad", bColor:"#22c55e" },
                                        { icon:AlertTriangle, color:"#ef4444", title:"32 clientes sin contacto +30 días", detail:"El 11% de tu base está en riesgo de abandono. Requieren contacto esta semana.", badge:"Atención urgente", bColor:"#ef4444" },
                                        { icon:Users, color:"#2563EB", title:"3 vendedores con rendimiento dispar", detail:"JP duplica en ventas a CA. Hay oportunidad de mejorar el proceso de seguimiento.", badge:"Alto impacto", bColor:"#2563EB" },
                                        { icon:Calculator, color:"#eab308", title:"Flujo de caja vulnerable en julio", detail:"Históricamente julio cae 57%. Con el ritmo actual, hay riesgo de déficit de $17.000.", badge:"Atención", bColor:"#eab308" },
                                      ].map(f => {
                                        const FIcon = f.icon
                                        return (
                                          <div key={f.title} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:16 }}>
                                            <FIcon size={16} style={{ color:f.color }} />
                                            <div style={{ color:"white", fontSize:13, fontWeight:500, marginTop:8 }}>{f.title}</div>
                                            <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12, lineHeight:1.5, marginTop:6 }}>{f.detail}</div>
                                            <span style={{ display:"inline-block", marginTop:10, background:f.bColor+"22", color:f.bColor, border:`1px solid ${f.bColor}44`, borderRadius:20, padding:"2px 8px", fontSize:10 }}>{f.badge}</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                  <div style={{ marginBottom:24 }}>
                                    <div style={{ color:"#2563EB", fontSize:11, textTransform:"uppercase", marginBottom:12 }}>✦ Primeras recomendaciones</div>
                                    {[
                                      { priority:"Urgente", title:"Contactar 32 clientes en riesgo", body:"Llamar esta semana a los clientes sin contacto en +30 días. Históricamente se recupera el 40%.", impact:"Impacto estimado: +$12.600/mes" },
                                      { priority:"Alta", title:"Implementar seguimiento post-venta", body:"JP cierra 3x más que CA. Documentar su proceso y replicarlo en el equipo.", impact:"Impacto estimado: +$18.000/mes" },
                                      { priority:"Alta", title:"Preparar campaña para noviembre", body:"Tu segundo pico está en 6 meses. Empezar ahora garantiza mejor ROI.", impact:"Impacto estimado: +$22.000 ese mes" },
                                      { priority:"Media", title:"Crear reserva para julio", body:"Apartar $17.000 en mayo y junio para cubrir el mes bajo sin estrés.", impact:"Riesgo reducido: 85%" },
                                      { priority:"Media", title:"Unificar gestión en Pupi", body:"Tu equipo usa WhatsApp y Excel. Migrar todo a Pupi en 2 semanas.", impact:"Eficiencia: +40% tiempo del equipo" },
                                    ].map(r => (
                                      <div key={r.title} style={aiCard}>
                                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                                          <span style={{ background:prioColor(r.priority)+"22", color:prioColor(r.priority), fontSize:10, borderRadius:20, padding:"1px 8px" }}>{r.priority}</span>
                                          <span style={{ color:"white", fontSize:13, fontWeight:500 }}>{r.title}</span>
                                        </div>
                                        <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12, lineHeight:1.5 }}>{r.body}</div>
                                        <div style={{ color:"#22c55e", fontSize:11, marginTop:6 }}>{r.impact}</div>
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ marginBottom:24 }}>
                                    <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>KPIs establecidos como base</div>
                                    <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:16 }}>Pupi medirá tu progreso contra estos números</div>
                                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                                      {(companyMemory?.kpis ? [
                                        { v:`$${Number(companyMemory.kpis.monthly_revenue || 0).toLocaleString()}`, n:"VENTAS MENSUALES" },
                                        { v:String(companyMemory.kpis.active_clients ?? 284), n:"CLIENTES ACTIVOS" },
                                        { v:`${companyMemory.kpis.close_rate ?? 68}%`, n:"TASA DE CIERRE" },
                                        { v:"7.8/10", n:"CLIMA LABORAL" },
                                        { v:"35.6%", n:"MARGEN NETO" },
                                        { v:`$${Number(companyMemory.kpis.avg_ticket || 0).toLocaleString()}`, n:"TICKET PROMEDIO" },
                                      ] : [
                                        {v:"$88.200",n:"VENTAS MENSUALES"},
                                        {v:"284",n:"CLIENTES ACTIVOS"},
                                        {v:"68%",n:"TASA DE CIERRE"},
                                        {v:"7.8/10",n:"CLIMA LABORAL"},
                                        {v:"35.6%",n:"MARGEN NETO"},
                                        {v:"$4.200",n:"TICKET PROMEDIO"},
                                      ]).map(k=>(
                                        <div key={k.n} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:14, textAlign:"center" }}>
                                          <div style={{ color:"white", fontSize:18, fontWeight:600 }}>{k.v}</div>
                                          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, textTransform:"uppercase", marginTop:6 }}>{k.n}</div>
                                          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, marginTop:2 }}>Baseline hoy</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div style={{ background:"rgba(37,99,235,0.08)", border:"1px solid rgba(37,99,235,0.2)", borderRadius:14, padding:24, textAlign:"center", marginTop:8 }}>
                                    <div style={{ color:"white", fontSize:18, fontWeight:500 }}>🎉 ¡Tu empresa está lista en Pupi!</div>
                                    <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginTop:8, lineHeight:1.6 }}>Todo está configurado y analizado. Pupi ya conoce tu negocio y está listo para ayudarte.</div>
                                    <button onClick={()=>{ closePanel(); setWsView("home") }} style={{ marginTop:20, background:"#2563EB", color:"white", border:"none", borderRadius:10, padding:"12px 32px", fontSize:14, fontWeight:500, cursor:"pointer" }}>Ir al dashboard →</button>
                                  </div>
                                </>
                              )}
                            </div>
                            {wsOnbStage !== "diagnosis" && !wsOnboardingProcessing && (
                              <div style={{ flexShrink:0, background:"#0D0D14", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                                  {wsOnbStage === "upload" && <button onClick={()=>setWsOnbStage("form")} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer" }}>← Volver</button>}
                                  <span style={{ color:"rgba(255,255,255,0.6)", fontSize:12 }}>Paso {stepNum} de 3</span>
                                </div>
                                {wsOnbStage === "form" ? (
                                  <button onClick={()=>setWsOnbStage("upload")} style={{ background:"#2563EB", color:"white", border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:500, cursor:"pointer" }}>Siguiente →</button>
                                ) : (
                                  <button onClick={startAnalysis} style={{ background:"#2563EB", color:"white", border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:500, cursor:"pointer" }}>Analizar con Pupi →</button>
                                )}
                              </div>
                            )}
                            {wsOnboardingProcessing && (
                              <div style={{ position:"absolute", inset:0, background:"rgba(10,10,20,0.95)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, zIndex:10 }}>
                                <style>{`@keyframes onbPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.05);opacity:0.85} }`}</style>
                                <div style={{ width:64, height:64, borderRadius:"50%", background:"#2563EB", display:"flex", alignItems:"center", justifyContent:"center", animation:"onbPulse 1.5s ease-in-out infinite" }}>
                                  <Brain size={28} color="white" />
                                </div>
                                <div style={{ color:"white", fontSize:16, fontWeight:500 }}>Pupi está analizando tu empresa...</div>
                                <div style={{ width:"100%", maxWidth:400, height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, overflow:"hidden" }}>
                                  <div style={{ height:"100%", background:"#2563EB", width:`${wsOnbProgress}%`, transition:"width 0.1s linear" }} />
                                </div>
                                <div style={{ display:"flex", flexDirection:"column", gap:8, minHeight:120 }}>
                                  {wsOnbProcSteps.map((s,i)=>(
                                    <div key={i} style={{ color:s.startsWith("✓")?"#22c55e":"rgba(255,255,255,0.6)", fontSize:13 }}>{s}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {wsView === "memory" && (() => {
                        const goUpload = () => { setWsView("onboarding"); setWsOnbStage("upload") }
                        const badgeStyle = (status: string) => {
                          const c = status === "Completo" ? "#22c55e" : status === "Parcial" ? "#eab308" : "rgba(255,255,255,0.3)"
                          return { color:c, fontSize:10, borderRadius:20, padding:"1px 6px", border:`1px solid ${c}44`, flexShrink:0 as const }
                        }
                        const KNOWLEDGE = [
                          { icon:Users, color:"#2563EB", area:"Clientes", status:"Completo", detail:"284 clientes, historial de compras, temperaturas, segmentación y patrones de comportamiento", count:"1.847 datos registrados", empty:false },
                          { icon:TrendingUp, color:"#22c55e", area:"Ventas", status:"Completo", detail:"Pipeline, historial de cierres, rendimiento por vendedor y estacionalidad detectada", count:"643 datos registrados", empty:false },
                          { icon:Megaphone, color:"#a855f7", area:"Marketing", status:"Parcial", detail:"6 campañas, ROI por canal e insights de segmento. Falta historial anterior al onboarding", count:"284 datos registrados", empty:false },
                          { icon:UserCheck, color:"#f97316", area:"Equipo", status:"Completo", detail:"8 empleados, desempeño, clima laboral, satisfacción y patrones de productividad", count:"412 datos registrados", empty:false },
                          { icon:Calculator, color:"#eab308", area:"Finanzas", status:"Parcial", detail:"5 meses de movimientos, márgenes y proyecciones. Falta historial de años anteriores", count:"529 datos registrados", empty:false },
                          { icon:BarChart2, color:"rgba(255,255,255,0.4)", area:"Mercado", status:"Vacío", detail:"Sin investigaciones de mercado cargadas todavía. Subí estudios para completar este módulo", count:"0 datos registrados", empty:true },
                        ]
                        const PATTERNS_DEFAULT = [
                          { icon:TrendingUp, color:"#22c55e", desc:"Pico de ventas en mayo y noviembre", source:"Aprendido de: 5 meses de datos", conf:"Alta confianza", confColor:"#22c55e" },
                          { icon:Clock, color:"#2563EB", desc:"JP cierra más los martes y miércoles", source:"Aprendido de: 47 cierres registrados", conf:"Alta confianza", confColor:"#22c55e" },
                          { icon:Users, color:"#ef4444", desc:"Clientes sin contacto +30 días tienen 68% más riesgo de abandono", source:"Aprendido de: comportamiento 284 clientes", conf:"Alta confianza", confColor:"#22c55e" },
                          { icon:Heart, color:"#f97316", desc:"Satisfacción del equipo correlaciona con productividad — 54% más rendimiento", source:"Aprendido de: 8 semanas de pulsos", conf:"Media confianza", confColor:"#eab308" },
                          { icon:Calculator, color:"#eab308", desc:"Julio y agosto son meses de déficit", source:"Aprendido de: historial financiero", conf:"Alta confianza", confColor:"#22c55e" },
                          { icon:TrendingDown, color:"#a855f7", desc:"WhatsApp tiene ROI negativo como canal", source:"Aprendido de: 1 campaña — poca data", conf:"Media confianza", confColor:"#eab308" },
                          { icon:User, color:"#22c55e", desc:"MR convierte mejor clientes nuevos", source:"Aprendido de: 38 primeros contactos", conf:"Alta confianza", confColor:"#22c55e" },
                          { icon:Target, color:"#2563EB", desc:"Producto C tiene mejor margen (68%)", source:"Aprendido de: 5 meses de ventas", conf:"Alta confianza", confColor:"#22c55e" },
                        ]
                        const patternKeyLabels: Record<string, string> = {
                          best_sales_day: "Mejor día de ventas",
                          peak_months: "Meses pico de demanda",
                          avg_deal_cycle_days: "Ciclo promedio de cierre",
                        }
                        const formatPatternValue = (key: string, val: unknown) => {
                          if (Array.isArray(val)) return `${patternKeyLabels[key] || key}: ${val.join(", ")}`
                          if (key === 'best_sales_day') return `Mejor día de ventas: ${String(val)}`
                          if (key === 'avg_deal_cycle_days') return `Ciclo promedio de cierre: ${String(val)} días`
                          return `${patternKeyLabels[key] || key}: ${String(val)}`
                        }
                        const memoryPatterns = companyMemory?.patterns && Object.keys(companyMemory.patterns).length > 0
                          ? Object.entries(companyMemory.patterns).map(([key, val]) => ({
                              icon: TrendingUp,
                              color: "#22c55e",
                              desc: formatPatternValue(key, val),
                              source: "Aprendido de datos reales",
                              conf: "Alta confianza",
                              confColor: "#22c55e",
                            }))
                          : []
                        const memoryInsights = companyMemory?.insights && Object.keys(companyMemory.insights).length > 0
                          ? Object.entries(companyMemory.insights).map(([, val]) => ({
                              icon: Brain,
                              color: "#2563EB",
                              desc: typeof val === 'string' ? val : String(val),
                              source: "Insight de Pupi AI",
                              conf: "Alta confianza",
                              confColor: "#22c55e",
                            }))
                          : []
                        const PATTERNS = memoryPatterns.length > 0 || memoryInsights.length > 0
                          ? [...memoryPatterns, ...memoryInsights]
                          : PATTERNS_DEFAULT
                        const MONITORING = [
                          { title:"Temperatura de 284 clientes", freq:"Frecuencia: cada 6 horas", last:"Hace 2 horas" },
                          { title:"Pipeline de ventas — 5 oportunidades", freq:"Frecuencia: en tiempo real", last:"Hace 5 min" },
                          { title:"Clima laboral del equipo", freq:"Frecuencia: diaria", last:"Hace 8 horas" },
                          { title:"Flujo de caja y anomalías", freq:"Frecuencia: cada 24 horas", last:"Hace 1 hora" },
                          { title:"Rendimiento de campañas activas", freq:"Frecuencia: cada 12 horas", last:"Hace 3 horas" },
                          { title:"Metas de vendedores", freq:"Frecuencia: diaria", last:"Hace 8 horas" },
                        ]
                        const IMPROVE = [
                          { icon:BarChart2, color:"rgba(255,255,255,0.4)", title:"Subir investigaciones de mercado", desc:"El módulo de Mercado está vacío. Subí estudios para completarlo.", btn:"Subir archivos →" },
                          { icon:Calculator, color:"#eab308", title:"Cargar historial financiero anterior", desc:"Solo tenemos 5 meses. Subí años anteriores para mejorar las proyecciones.", btn:"Cargar historial →" },
                          { icon:Megaphone, color:"#a855f7", title:"Agregar campañas anteriores", desc:"Marketing tiene datos parciales. Subí campañas previas al onboarding.", btn:"Agregar campañas →" },
                        ]
                        return (
                          <div style={{ flex:1, overflowY:"auto", padding:24 }}>
                            <style>{`@keyframes memPulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 50%{opacity:0.7;box-shadow:0 0 0 4px rgba(34,197,94,0)} }`}</style>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                              <div>
                                <div style={{ color:"white", fontSize:15, fontWeight:500 }}>Memoria empresarial</div>
                                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginTop:2 }}>Lo que Pupi conoce y aprende sobre tu empresa</div>
                              </div>
                              <span style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.65)", fontSize:11, borderRadius:20, padding:"4px 12px" }}>Actualizado hace 2 horas</span>
                            </div>
                            <div style={{ background:"rgba(37,99,235,0.06)", border:"1px solid rgba(37,99,235,0.15)", borderRadius:14, padding:20, marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <div>
                                <div style={{ color:"#2563EB", fontSize:11, textTransform:"uppercase", marginBottom:8 }}>✦ Salud de la memoria</div>
                                <div>
                                  <span style={{ color:"white", fontSize:36, fontWeight:600 }}>92%</span>
                                  <span style={{ color:"rgba(255,255,255,0.7)", fontSize:13, marginLeft:8 }}>completada</span>
                                </div>
                                <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12, marginTop:8 }}>Pupi tiene suficiente información para generar insights precisos</div>
                              </div>
                              <div style={{ width:80, height:80, borderRadius:"50%", background:"conic-gradient(#2563EB 0deg 331deg, rgba(255,255,255,0.06) 331deg)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                <div style={{ width:60, height:60, borderRadius:"50%", background:"#0D0D14", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:13, fontWeight:500 }}>92%</div>
                              </div>
                            </div>
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:16 }}>Qué sabe Pupi sobre tu empresa</div>
                              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                                {KNOWLEDGE.map(k => {
                                  const KIcon = k.icon
                                  return (
                                    <div key={k.area} style={{ background:k.empty?"rgba(255,255,255,0.01)":"rgba(255,255,255,0.03)", border:k.empty?"1px dashed rgba(255,255,255,0.08)":"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:16 }}>
                                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                                        <div style={{ display:"flex", alignItems:"center", minWidth:0 }}>
                                          <KIcon size={14} style={{ color:k.color, flexShrink:0 }} />
                                          <span style={{ color:"white", fontSize:12, fontWeight:500, marginLeft:8 }}>{k.area}</span>
                                        </div>
                                        <span style={badgeStyle(k.status)}>{k.status}</span>
                                      </div>
                                      <div style={{ color:"rgba(255,255,255,0.75)", fontSize:11, lineHeight:1.5, marginTop:8 }}>{k.detail}</div>
                                      <div style={{ color:"rgba(255,255,255,0.55)", fontSize:10, marginTop:8 }}>{k.count}</div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:16 }}>✦ Patrones que Pupi aprendió</div>
                              {PATTERNS.map(p => {
                                const PIcon = p.icon
                                return (
                                  <div key={p.desc} style={{ display:"flex", gap:12, padding:"12px 16px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, marginBottom:6, alignItems:"center" }}>
                                    <PIcon size={14} style={{ color:p.color, flexShrink:0 }} />
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ color:"white", fontSize:13 }}>{p.desc}</div>
                                      <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:2 }}>{p.source}</div>
                                    </div>
                                    <span style={{ color:p.confColor, fontSize:10, borderRadius:20, padding:"2px 8px", border:`1px solid ${p.confColor}44`, flexShrink:0 }}>{p.conf}</span>
                                  </div>
                                )
                              })}
                            </div>
                            <div style={{ marginBottom:24 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:16 }}>Qué está monitoreando ahora</div>
                              {MONITORING.map(m => (
                                <div key={m.title} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, marginBottom:6 }}>
                                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", flexShrink:0, animation:"memPulse 2s infinite" }} />
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ color:"white", fontSize:13, fontWeight:500 }}>{m.title}</div>
                                    <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:2 }}>{m.freq}</div>
                                  </div>
                                  <span style={{ color:"rgba(255,255,255,0.55)", fontSize:10, flexShrink:0 }}>{m.last}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ marginBottom:0 }}>
                              <div style={{ color:"white", fontSize:13, fontWeight:500, marginBottom:4 }}>Mejorá la memoria de Pupi</div>
                              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:16 }}>Más datos = mejores insights</div>
                              {IMPROVE.map(im => {
                                const IIcon = im.icon
                                return (
                                  <div key={im.title} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:16, marginBottom:8, gap:16 }}>
                                    <div style={{ display:"flex", gap:12, alignItems:"flex-start", flex:1, minWidth:0 }}>
                                      <IIcon size={16} style={{ color:im.color, flexShrink:0, marginTop:2 }} />
                                      <div>
                                        <div style={{ color:"white", fontSize:13, fontWeight:500 }}>{im.title}</div>
                                        <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginTop:4, lineHeight:1.5 }}>{im.desc}</div>
                                      </div>
                                    </div>
                                    <button onClick={goUpload} style={{ border:"1px solid rgba(255,255,255,0.1)", background:"none", color:"rgba(255,255,255,0.5)", fontSize:12, borderRadius:6, padding:"6px 14px", cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>{im.btn}</button>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Placeholder for other ws views */}
                      {wsView !== "home" && wsView !== "history" && wsView !== "reports" && wsView !== "settings" && wsView !== "onboarding" && wsView !== "memory" && (
                        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
                          <span style={{ color:"rgba(255,255,255,0.15)", fontSize:13 }}>{WS_NAV.find(n=>n.key===wsView)?.label}</span>
                          <span style={{ color:"rgba(255,255,255,0.1)", fontSize:11 }}>Próximamente</span>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : activeNode.id === 7 ? (
                <GoogleToolsPanel
                  googleStatus={googleStatus}
                  onRefreshStatus={refreshGoogleStatus}
                  showToast={showToast}
                  exportCounts={{
                    clients: realClients.length,
                    opportunities: realOpportunities.length,
                    movements: realMovements.length,
                  }}
                />
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

      {showSuccessToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#22c55e',
          fontSize: '13px',
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
        }}>
          ✓ {toastMessage}
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 1001 }}>
          <div style={{ background: "rgba(10,10,20,0.95)", border: "1px solid rgba(37,99,235,0.4)", borderRadius: 30, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10, backdropFilter: "blur(8px)" }}>
            <style>{`@keyframes pttPulse { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.5; transform:scale(1.2) } }`}</style>
            <Mic size={16} style={{ color: "#2563EB", animation: "pttPulse 1s infinite" }} />
            <span style={{ color: isProcessingVoice ? "rgba(255,255,255,0.5)" : (voiceTranscript ? "white" : "rgba(255,255,255,0.7)"), fontSize: 13, fontStyle: isProcessingVoice ? "italic" : "normal", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isProcessingVoice ? "Procesando..." : voiceTranscript || "Escuchando..."}
            </span>
            {!isProcessingVoice && (
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Soltá para enviar</span>
            )}
          </div>
        </div>
      )}


      {/* Chat panel */}
      {showChatPanel && (
        <div style={{ position: "fixed", bottom: 88, right: 24, width: 360, height: 480, background: "#0D0D14", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 16, zIndex: 60, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "white", fontSize: 14, fontWeight: 500 }}>Pupi AI</span>
            <button type="button" onClick={toggleChatPanel} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
          {showWakeGreeting && (
            <div style={{ padding: "8px 16px", background: "rgba(37,99,235,0.1)", color: "#2563EB", fontSize: 12 }}>
              Te escucho — decime en qué te ayudo
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", background: msg.role === "user" ? "#2563EB" : "rgba(255,255,255,0.06)", color: "white", fontSize: 13, lineHeight: 1.5, padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px" }}>
                {msg.text}
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage() }}
                placeholder="Preguntale algo a Pupi..."
                style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
              />
              <button type="button" onClick={sendChatMessage} style={{ padding: "10px 14px", background: "#2563EB", color: "white", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>→</button>
            </div>
            {typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) && (
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, textAlign: "center", marginTop: 6 }}>
                Mantené ␣ para hablar · Pupi te escucha
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings button — fixed bottom-right */}
      {!showSettings && (
      <button
        type="button"
        onClick={() => setShowSettings(true)}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)' }}
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 200ms' }}
      >
        <Settings size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
      </button>
      )}

      {/* Settings panel overlay */}
      {showSettings && (() => {
        const si: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: 'white', fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box' }
        const sl: React.CSSProperties = { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 6, display: 'block' }
        const sec: React.CSSProperties = { color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }

        const modulesSections: Record<string, string[]> = {
          crm: ['Lista de clientes', 'Ficha de cliente', 'Interacciones', 'Mapa de clientes', 'Importar clientes'],
          ventas: ['Pipeline', 'Pronóstico', 'Comisiones', 'Vendedores', 'Productos'],
          marketing: ['Campañas', 'Insights', 'Investigaciones'],
          rrhh: ['Equipo', 'Organigrama', 'Clima laboral', 'Sueldos', 'Resumen semanal'],
          contabilidad: ['Dashboard', 'Movimientos', 'Análisis', 'Proyecciones', 'Exportar'],
          workspace: ['Inicio', 'Historial', 'Buscador', 'Reportes', 'Memoria'],
        }
        const moduleLabels: Record<string, string> = { crm: 'CRM', ventas: 'Ventas', marketing: 'Marketing', rrhh: 'RRHH', contabilidad: 'Contabilidad', workspace: 'Workspace' }
        const moduleColors: Record<string, string> = { crm: '#2563EB', ventas: '#22c55e', marketing: '#a855f7', rrhh: '#f97316', contabilidad: '#eab308', workspace: 'rgba(255,255,255,0.5)' }
        const moduleIcons: Record<string, React.ReactNode> = {
          crm: <Users size={16} style={{ color: '#2563EB' }} />,
          ventas: <TrendingUp size={16} style={{ color: '#22c55e' }} />,
          marketing: <Megaphone size={16} style={{ color: '#a855f7' }} />,
          rrhh: <UserCheck size={16} style={{ color: '#f97316' }} />,
          contabilidad: <Calculator size={16} style={{ color: '#eab308' }} />,
          workspace: <LayoutDashboard size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />,
        }

        const applyRoleDefaults = (role: string) => {
          const base: Record<string, { enabled: boolean; access: 'reader'|'editor'; sections: string[] }> = {
            crm: { enabled: false, access: 'reader', sections: [] },
            ventas: { enabled: false, access: 'reader', sections: [] },
            marketing: { enabled: false, access: 'reader', sections: [] },
            rrhh: { enabled: false, access: 'reader', sections: [] },
            contabilidad: { enabled: false, access: 'reader', sections: [] },
            workspace: { enabled: false, access: 'reader', sections: [] },
          }
          if (role === 'manager') {
            Object.keys(base).forEach(k => { base[k] = { enabled: true, access: 'editor', sections: [...modulesSections[k]] } })
          } else if (role === 'seller') {
            base.crm = { enabled: true, access: 'reader', sections: [...modulesSections.crm] }
            base.ventas = { enabled: true, access: 'editor', sections: [...modulesSections.ventas] }
            base.workspace = { enabled: true, access: 'reader', sections: [...modulesSections.workspace] }
          } else if (role === 'employee') {
            base.workspace = { enabled: true, access: 'reader', sections: [...modulesSections.workspace] }
          }
          setNewUserPermissions(base)
        }

        const roleBadge = (role: string) => {
          const map: Record<string, { label: string; bg: string; color: string }> = {
            owner: { label: 'Dueño', bg: 'rgba(234,179,8,0.15)', color: '#eab308' },
            manager: { label: 'Gerente', bg: 'rgba(37,99,235,0.15)', color: '#2563EB' },
            seller: { label: 'Vendedor', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
            employee: { label: 'Empleado', bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
          }
          const s = map[role] || map.employee
          return <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{s.label}</span>
        }

        const resetAddUser = () => {
          setNewUserName(''); setNewUserEmail(''); setNewUserRole('employee'); setNewUserEmailError('')
          setNewUserPermissions({ crm: { enabled: false, access: 'reader', sections: [] }, ventas: { enabled: false, access: 'reader', sections: [] }, marketing: { enabled: false, access: 'reader', sections: [] }, rrhh: { enabled: false, access: 'reader', sections: [] }, contabilidad: { enabled: false, access: 'reader', sections: [] }, workspace: { enabled: false, access: 'reader', sections: [] } })
          setShowAddUser(false)
          setEditingUserId(null)
        }

        const openEditUser = (u: typeof settingsUsers[0]) => {
          setEditingUserId(u.id)
          setNewUserName(u.name)
          setNewUserEmail(u.email)
          setNewUserRole(u.role === 'owner' || u.role === 'seller' || u.role === 'manager' || u.role === 'employee' ? u.role : u.role)
          setNewUserEmailError('')
          setNewUserPermissions({ crm: { enabled: false, access: 'reader', sections: [] }, ventas: { enabled: false, access: 'reader', sections: [] }, marketing: { enabled: false, access: 'reader', sections: [] }, rrhh: { enabled: false, access: 'reader', sections: [] }, contabilidad: { enabled: false, access: 'reader', sections: [] }, workspace: { enabled: false, access: 'reader', sections: [] } })
          setShowAddUser(true)
        }

        const submitAddUser = async () => {
          if (!newUserEmail.trim() || !newUserEmail.includes('@')) { setNewUserEmailError('Ingresá un email válido'); return }
          const enabledMods = Object.entries(newUserPermissions).filter(([,v]) => v.enabled).map(([k]) => moduleLabels[k]).join(', ') || 'Sin acceso'
          if (editingUserId) {
            const res = await fetch('/api/users', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: editingUserId, name: newUserName, email: newUserEmail, role: newUserRole, permissions: newUserPermissions }),
            })
            if (res.ok) {
              const data = await res.json()
              setSettingsUsers(prev => prev.map(u => u.id === editingUserId ? { ...u, ...data.user, modules: enabledMods } : u))
              showToast('Usuario actualizado')
            } else showToast('Error al actualizar usuario')
          } else {
            const res = await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newUserName || newUserEmail.split('@')[0], email: newUserEmail, role: newUserRole, permissions: newUserPermissions }),
            })
            if (res.ok) {
              const data = await res.json()
              setSettingsUsers(prev => [...prev, { ...data.user, modules: enabledMods }])
              showToast('Invitación enviada a ' + newUserEmail)
            } else {
              const err = await res.json().catch(() => ({}))
              setNewUserEmailError(err.error || 'Error al crear usuario')
              return
            }
          }
          resetAddUser()
        }

        const persistNotifications = async () => {
          const ok = await saveSettings({
            notifications: {
              alerts: settingsNotifAlerts,
              channels: settingsNotifChannels,
              freq: settingsNotifFreq,
              whatsappPhone: settingsNotifWhatsAppPhone,
            },
          })
          showToast(ok ? 'Preferencias guardadas' : 'Error al guardar')
        }

        const persistVoice = async (patch: Record<string, unknown>) => {
          await saveSettings({
            voice: {
              spaceEnabled: voiceSpaceEnabled,
              wakeEnabled: voiceWakeEnabled,
              responseEnabled: voiceResponseEnabled,
              idioma: voiceIdioma,
              tipo: voiceTipo,
              ...patch,
            },
          })
        }

        const persistIntegration = async (provider: string, connected: boolean) => {
          setSettingsIntegrations(prev => ({ ...prev, [provider]: connected }))
          await saveSettings({ integrations: { ...settingsIntegrations, [provider]: connected } })
        }

        const navItems = [
          { key: 'profile' as const, icon: <User size={16} />, label: 'Mi perfil' },
          { key: 'company' as const, icon: <Building2 size={16} />, label: 'Empresa' },
          { key: 'users' as const, icon: <Users size={16} />, label: 'Usuarios' },
        ]
        const extraNavItems = [
          { key: 'billing' as const, icon: <CreditCard size={16} />, label: 'Facturación' },
          { key: 'notifications' as const, icon: <Bell size={16} />, label: 'Notificaciones' },
          { key: 'integrations' as const, icon: <Plug size={16} />, label: 'Integraciones' },
          { key: 'voice' as const, icon: <Mic size={16} />, label: 'Voz y asistente' },
          { key: 'security' as const, icon: <Shield size={16} />, label: 'Seguridad' },
        ]
        const renderSettingsNavBtn = (item: typeof navItems[number] | typeof extraNavItems[number]) => (
          <button key={item.key} type="button" onClick={() => setSettingsTab(item.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, border: 'none', background: settingsTab === item.key ? 'rgba(37,99,235,0.15)' : 'transparent', color: settingsTab === item.key ? '#2563EB' : 'rgba(255,255,255,0.6)', fontSize: 13, transition: 'background 150ms' }}
            onMouseEnter={e => { if (settingsTab !== item.key) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { if (settingsTab !== item.key) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            {item.icon}
            {item.label}
          </button>
        )
        const SettingsToggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
          <div onClick={onToggle} style={{ width: 36, height: 20, borderRadius: 10, background: on ? '#2563EB' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 200ms' }}>
            <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 200ms' }} />
          </div>
        )

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}>
            <div style={{ position: 'absolute', top: 40, left: 40, right: 40, bottom: 40, background: '#0D0D14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Settings size={18} style={{ color: '#2563EB' }} />
                  <span style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>Configuración</span>
                </div>
                <button type="button" onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '4px 8px' }}>×</button>
              </div>

              {/* Body */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
                  {navItems.map(item => renderSettingsNavBtn(item))}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
                  {extraNavItems.map(item => renderSettingsNavBtn(item))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

                  {/* ── USERS TAB ── */}
                  {settingsTab === 'users' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                          <div style={{ color: 'white', fontSize: 15, fontWeight: 500 }}>Usuarios</div>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>{settingsUsers.length} usuarios activos en tu plan</div>
                        </div>
                        <button type="button" onClick={() => setShowAddUser(true)} style={{ background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>+ Agregar usuario</button>
                      </div>

                      {/* Table */}
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 2fr 1fr', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px 8px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          <span>Usuario</span><span>Email</span><span>Rol</span><span>Acceso</span><span>Acción</span>
                        </div>
                        {settingsUsers.map(u => (
                          <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 2fr 1fr', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}
                            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(37,99,235,0.2)', color: '#2563EB', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{u.avatar}</div>
                              <span style={{ color: 'white', fontSize: 13 }}>{u.name}</span>
                            </div>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{u.email}</span>
                            <span>{roleBadge(u.role)}</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{u.modules}</span>
                            <div style={{ display: 'flex', gap: 12 }}>
                              {u.role !== 'owner' && <>
                                <button type="button" onClick={() => openEditUser(u)} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, cursor: 'pointer', padding: 0 }}>Editar</button>
                                <button type="button" onClick={() => setDeleteConfirmId(u.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: 0 }}>Eliminar</button>
                              </>}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Delete confirmation */}
                      {deleteConfirmId && (() => {
                        const target = settingsUsers.find(u => u.id === deleteConfirmId)
                        return (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) setDeleteConfirmId(null) }}>
                            <div style={{ background: '#0D0D14', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, width: 400, padding: 28 }} onClick={e => e.stopPropagation()}>
                              <div style={{ color: 'white', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Eliminar usuario</div>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24 }}>
                                ¿Seguro que querés eliminar a <span style={{ color: 'white' }}>{target?.name}</span>? Esta acción no se puede deshacer.
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button type="button" onClick={() => setDeleteConfirmId(null)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                                <button type="button" onClick={async () => {
                                  const ok = await fetch(`/api/users?id=${deleteConfirmId}`, { method: 'DELETE' })
                                  if (ok.ok) {
                                    setSettingsUsers(prev => prev.filter(x => x.id !== deleteConfirmId))
                                    setDeleteConfirmId(null)
                                    showToast('Usuario eliminado')
                                  } else showToast('Error al eliminar')
                                }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Eliminar</button>
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Add / edit user modal */}
                      {showAddUser && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) resetAddUser() }}>
                          <div style={{ background: '#0D0D14', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 14, width: 560, maxHeight: '85vh', overflowY: 'auto', padding: 28 }} onClick={e => e.stopPropagation()}>
                            {/* Modal header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                              <div>
                                <div style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>{editingUserId ? 'Editar usuario' : 'Agregar usuario'}</div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>{editingUserId ? 'Modificá los datos del usuario' : 'Invitá a alguien a tu equipo en Pupi'}</div>
                              </div>
                              <button type="button" onClick={resetAddUser} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '2px 6px' }}>×</button>
                            </div>

                            {/* Section 1 — user data */}
                            <div style={{ ...sec, marginTop: 20 }}>DATOS DEL USUARIO</div>
                            <div style={{ marginBottom: 14 }}>
                              <label style={sl}>Nombre completo</label>
                              <input style={si} value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Ej: Juan Pérez" />
                            </div>
                            <div style={{ marginBottom: 14 }}>
                              <label style={sl}>Email</label>
                              <input style={{ ...si, borderColor: newUserEmailError ? '#ef4444' : 'rgba(255,255,255,0.08)' }} type="email" value={newUserEmail} onChange={e => { setNewUserEmail(e.target.value); setNewUserEmailError('') }} placeholder="juan@empresa.com" />
                              {newUserEmailError && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{newUserEmailError}</div>}
                            </div>

                            {/* Role field */}
                            <div style={{ marginBottom: 14 }}>
                              <label style={sl}>Rol</label>
                              <input style={si} value={newUserRole === 'employee' ? '' : newUserRole} onChange={e => setNewUserRole(e.target.value)} placeholder="Ej: Gerente, Vendedor, Diseñador..." />
                            </div>

                            {/* Section 2 — permissions */}
                            <div style={{ ...sec, marginTop: 24 }}>PERMISOS POR ÁREA</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 16 }}>Elegí qué puede ver y hacer en cada área</div>

                            {Object.keys(modulesSections).map(mod => {
                              const perm = newUserPermissions[mod]
                              const allChecked = perm.sections.length === modulesSections[mod].length
                              return (
                                <div key={mod} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                                  {/* Card header */}
                                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {moduleIcons[mod]}
                                    <span style={{ color: 'white', fontSize: 13, fontWeight: 500, flex: 0 }}>{moduleLabels[mod]}</span>
                                    <div style={{ flex: 1, display: 'flex', gap: 6, marginLeft: 8 }}>
                                      {perm.enabled && (['reader', 'editor'] as const).map(a => (
                                        <button key={a} type="button" onClick={() => setNewUserPermissions(prev => ({ ...prev, [mod]: { ...prev[mod], access: a } }))} style={{ borderRadius: 20, padding: '3px 10px', fontSize: 11, cursor: 'pointer', border: `1px solid ${perm.access === a ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.08)'}`, background: perm.access === a ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.05)', color: perm.access === a ? '#2563EB' : 'rgba(255,255,255,0.4)' }}>
                                          {a === 'reader' ? 'Lector' : 'Editor'}
                                        </button>
                                      ))}
                                    </div>
                                    {/* Toggle */}
                                    <div onClick={() => setNewUserPermissions(prev => ({ ...prev, [mod]: { ...prev[mod], enabled: !prev[mod].enabled, sections: !prev[mod].enabled ? [] : prev[mod].sections } }))} style={{ width: 36, height: 20, borderRadius: 10, background: perm.enabled ? '#2563EB' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}>
                                      <div style={{ position: 'absolute', top: 2, left: perm.enabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 200ms' }} />
                                    </div>
                                  </div>
                                  {/* Sections */}
                                  {perm.enabled && (
                                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer' }} onClick={() => {
                                        const all = modulesSections[mod]
                                        setNewUserPermissions(prev => ({ ...prev, [mod]: { ...prev[mod], sections: allChecked ? [] : [...all] } }))
                                      }}>
                                        <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${allChecked ? '#2563EB' : 'rgba(255,255,255,0.2)'}`, background: allChecked ? '#2563EB' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                          {allChecked && <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>✓</span>}
                                        </div>
                                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Seleccionar todo</span>
                                      </label>
                                      {modulesSections[mod].map(sec2 => {
                                        const checked = perm.sections.includes(sec2)
                                        return (
                                          <label key={sec2} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, paddingTop: 4, paddingBottom: 4, cursor: 'pointer' }} onClick={() => setNewUserPermissions(prev => ({ ...prev, [mod]: { ...prev[mod], sections: checked ? prev[mod].sections.filter(s => s !== sec2) : [...prev[mod].sections, sec2] } }))}>
                                            <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${checked ? '#2563EB' : 'rgba(255,255,255,0.2)'}`, background: checked ? '#2563EB' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                              {checked && <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>✓</span>}
                                            </div>
                                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{sec2}</span>
                                          </label>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}

                            {/* Modal footer */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <button type="button" onClick={resetAddUser} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '9px 20px', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                              <button type="button" onClick={submitAddUser} style={{ background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{editingUserId ? 'Guardar cambios' : 'Enviar invitación'}</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── PROFILE TAB ── */}
                  {settingsTab === 'profile' && (
                    <div style={{ maxWidth: 480 }}>
                      <div style={{ color: 'white', fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Mi perfil</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(37,99,235,0.2)', color: '#2563EB', fontSize: 24, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>NA</div>
                        <button type="button" style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 11, cursor: 'pointer', marginTop: 6 }}>Cambiar foto</button>
                      </div>
                      {[
                        { label: 'Nombre completo', value: profileName, set: setProfileName, type: 'text' },
                        { label: 'Email', value: profileEmail, set: null as any, type: 'email' },
                        { label: 'Cargo', value: profileCargo, set: setProfileCargo, type: 'text' },
                        { label: 'Teléfono', value: profilePhone, set: setProfilePhone, type: 'tel', placeholder: '+598 99 000 000' },
                      ].map(f => (
                        <div key={f.label} style={{ marginBottom: 14 }}>
                          <label style={sl}>{f.label}</label>
                          <input style={{ ...si, opacity: f.set ? 1 : 0.5 }} type={f.type} value={f.value} readOnly={!f.set} placeholder={('placeholder' in f ? f.placeholder : '') as string} onChange={f.set ? e => f.set(e.target.value) : undefined} />
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />
                      <div style={{ ...sec }}>SEGURIDAD</div>
                      {[
                        { label: 'Contraseña actual', value: profilePassCurrent, set: setProfilePassCurrent },
                        { label: 'Nueva contraseña', value: profilePassNew, set: setProfilePassNew },
                        { label: 'Confirmar nueva contraseña', value: profilePassConfirm, set: setProfilePassConfirm },
                      ].map(f => (
                        <div key={f.label} style={{ marginBottom: 14 }}>
                          <label style={sl}>{f.label}</label>
                          <input style={si} type="password" value={f.value} onChange={e => f.set(e.target.value)} />
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                        <button type="button" onClick={async () => {
                          const ok = await saveProfile({
                            name: profileName,
                            phone: profilePhone,
                            currentPassword: profilePassCurrent,
                            newPassword: profilePassNew,
                            confirmPassword: profilePassConfirm,
                          })
                          if (ok) {
                            setProfilePassCurrent(''); setProfilePassNew(''); setProfilePassConfirm('')
                            showToast('Cambios guardados')
                          } else showToast('Error al guardar perfil')
                        }} style={{ background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Guardar cambios</button>
                      </div>
                    </div>
                  )}

                  {/* ── COMPANY TAB ── */}
                  {settingsTab === 'company' && (
                    <div style={{ display: 'flex', gap: 32, maxWidth: 720 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Empresa</div>
                        {[
                          { label: 'Nombre de la empresa', value: wsEmpresaNombre, set: setWsEmpresaNombre, type: 'text' },
                          { label: 'Rubro / Industria', value: wsEmpresaRubro, set: setWsEmpresaRubro, type: 'text' },
                          { label: 'Años en el mercado', value: wsEmpresaAnios, set: setWsEmpresaAnios, type: 'number' },
                          { label: 'Cantidad de empleados', value: wsEmpresaEmpleados, set: setWsEmpresaEmpleados, type: 'number' },
                          { label: 'Ciudad', value: wsEmpresaCiudad, set: setWsEmpresaCiudad, type: 'text' },
                          { label: 'Sitio web (opcional)', value: wsEmpresaWeb, set: setWsEmpresaWeb, type: 'text' },
                        ].map(f => (
                          <div key={f.label} style={{ marginBottom: 14 }}>
                            <label style={sl}>{f.label}</label>
                            <input style={si} type={f.type} value={f.value} onChange={e => f.set(e.target.value)} />
                          </div>
                        ))}
                        <div style={{ marginBottom: 14 }}>
                          <label style={sl}>País</label>
                          <select style={{ ...si, appearance: 'none' as const }} value={wsEmpresaPais} onChange={e => setWsEmpresaPais(e.target.value)}>
                            {['Argentina','Chile','Uruguay'].map(o => <option key={o} value={o} style={{ background: '#0D0D14' }}>{o}</option>)}
                          </select>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <label style={sl}>Descripción breve</label>
                          <textarea style={{ ...si, minHeight: 80, resize: 'vertical' as const }} value={wsEmpresaDesc} onChange={e => setWsEmpresaDesc(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                          <button type="button" onClick={async () => {
                            const ok = await saveCompany({
                              name: wsEmpresaNombre,
                              industry: wsEmpresaRubro,
                              size: wsEmpresaEmpleados,
                              anios: wsEmpresaAnios,
                              ciudad: wsEmpresaCiudad,
                              pais: wsEmpresaPais,
                              web: wsEmpresaWeb,
                              desc: wsEmpresaDesc,
                            })
                            showToast(ok ? 'Cambios guardados' : 'Error al guardar empresa')
                          }} style={{ background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Guardar cambios</button>
                        </div>
                      </div>
                      <div style={{ width: 200, flexShrink: 0 }}>
                        <label style={sl}>Logo</label>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 24 }}>
                          <Camera size={24} style={{ color: 'rgba(255,255,255,0.5)' }} />
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 }}>Subir logo</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── BILLING TAB ── */}
                  {settingsTab === 'billing' && (() => {
                    const plan = billingData?.plan ?? { id: 'growth', name: 'Growth', price: 199, status: 'active', renewal: null }
                    const usage = billingData?.usage ?? { users: { used: 4, limit: 15 }, queries: { used: 50, limit: 200 }, storage: { used_gb: 2.1, limit_gb: 20 } }
                    const invoices = billingData?.invoices?.length ? billingData.invoices : [
                      { description: 'Plan Growth — Mayo 2026', amount: 199, status: 'paid', date: '2026-05-01' },
                      { description: 'Plan Growth — Abril 2026', amount: 199, status: 'paid', date: '2026-04-01' },
                      { description: 'Plan Growth — Marzo 2026', amount: 199, status: 'paid', date: '2026-03-01' },
                    ]
                    const polarConfigured = billingData?.polar_configured ?? false
                    const checkoutBase = billingData?.checkout_url ?? '/api/checkout'
                    const portalUrl = billingData?.portal_url ?? '/api/portal'
                    const renewalLabel = plan.renewal
                      ? `Renovación: ${new Date(plan.renewal).toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : 'Renovación: 1 Julio 2026'
                    const planCards = [
                      { id: 'starter', name: 'Starter', price: 79, features: ['3 usuarios', '50 consultas/día', '5 GB storage', '1.000 emails/mes'], current: plan.id === 'starter', btn: 'Cambiar', btnFilled: false },
                      { id: 'growth', name: 'Growth', price: 199, features: ['15 usuarios', '200 consultas/día', '20 GB storage', '5.000 emails/mes'], current: plan.id === 'growth', btn: null, btnFilled: false },
                      { id: 'pro', name: 'Pro', price: 449, features: ['50 usuarios', '500 consultas/día', '50 GB storage', '20.000 emails/mes'], current: plan.id === 'pro', btn: 'Actualizar', btnFilled: true },
                    ] as const
                    return (
                    <div style={{ maxWidth: 720 }}>
                      <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                        <div style={{ color: '#2563EB', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>✦ Plan actual</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ color: 'white', fontSize: 22, fontWeight: 600 }}>{plan.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginLeft: 4 }}>${plan.price} USD / mes</span>
                          </div>
                          <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{plan.status === 'active' ? 'Activo' : plan.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 16 }}>
                          {[
                            { value: `${usage.users.used} / ${usage.users.limit}`, label: 'USUARIOS' },
                            { value: `${usage.queries.used} / ${usage.queries.limit}`, label: 'CONSULTAS HOY' },
                            { value: `${usage.storage.used_gb} GB / ${usage.storage.limit_gb} GB`, label: 'STORAGE' },
                          ].map((stat, i, arr) => (
                            <div key={stat.label} style={{ flex: 1, textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                              <div style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>{stat.value}</div>
                              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginTop: 4 }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12, textAlign: 'center' }}>{renewalLabel}</div>
                      </div>

                      <div style={{ marginTop: 24 }}>
                        <div style={{ color: 'white', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Cambiar plan</div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {planCards.map(planCard => (
                            <div key={planCard.name} style={{ flex: 1, borderRadius: 12, padding: 18, background: planCard.current ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.02)', border: planCard.current ? '1px solid rgba(37,99,235,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{planCard.name}</div>
                              <div style={{ marginTop: 4 }}>
                                <span style={{ color: 'white', fontSize: 20, fontWeight: 600 }}>${planCard.price}</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 4 }}>/mes</span>
                              </div>
                              <div style={{ marginTop: 12 }}>
                                {planCard.features.map(f => (
                                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                    <Check size={12} style={{ color: '#22c55e', flexShrink: 0 }} />
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{f}</span>
                                  </div>
                                ))}
                              </div>
                              {planCard.current ? (
                                <div style={{ color: '#2563EB', fontSize: 12, marginTop: 12, fontWeight: 500 }}>Plan actual</div>
                              ) : planCard.btn && (
                                <button
                                  type="button"
                                  disabled={!polarConfigured}
                                  onClick={() => { if (polarConfigured) window.location.href = `${checkoutBase}?plan=${planCard.id}` }}
                                  style={{ marginTop: 12, background: planCard.btnFilled ? '#2563EB' : 'transparent', border: planCard.btnFilled ? 'none' : '1px solid rgba(255,255,255,0.12)', color: planCard.btnFilled ? 'white' : 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: polarConfigured ? 'pointer' : 'not-allowed', width: '100%', opacity: polarConfigured ? 1 : 0.5 }}
                                >
                                  {planCard.btn}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: 24 }}>
                        <div style={{ color: 'white', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Método de pago</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <CreditCard size={18} style={{ color: '#2563EB' }} />
                            <div style={{ marginLeft: 10 }}>
                              <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>
                                {polarConfigured ? 'Pagos gestionados por Polar' : 'Configurá Polar para activar pagos'}
                              </div>
                              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                                {billingData?.payment?.provider === 'polar'
                                  ? 'Tarjeta y suscripción en el portal de Polar'
                                  : 'Completá el checkout para registrar tu método de pago'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!polarConfigured}
                            onClick={() => { if (polarConfigured) window.location.href = portalUrl }}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, borderRadius: 6, padding: '5px 12px', cursor: polarConfigured ? 'pointer' : 'not-allowed', opacity: polarConfigured ? 1 : 0.5 }}
                          >
                            {billingData?.payment?.provider === 'polar' ? 'Administrar' : 'Ir al portal'}
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: 24 }}>
                        <div style={{ color: 'white', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Historial de pagos</div>
                        {invoices.map(inv => (
                          <div key={inv.description + inv.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div>
                              <div style={{ color: 'white', fontSize: 13 }}>{inv.description}</div>
                              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{new Date(inv.date).toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>${inv.amount}</span>
                              <span style={{ color: '#22c55e', fontSize: 11 }}>{inv.status === 'paid' ? 'Pagado' : inv.status}</span>
                              <Download size={14} style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )
                  })()}

                  {/* ── NOTIFICATIONS TAB ── */}
                  {settingsTab === 'notifications' && (
                    <div style={{ maxWidth: 560 }}>
                      <div style={{ color: 'white', fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Notificaciones</div>

                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginBottom: 16 }}>Alertas en tiempo real</div>
                      {([
                        { key: 'ventasCerradas' as const, label: 'Ventas cerradas', on: settingsNotifAlerts.ventasCerradas },
                        { key: 'oportunidadesRiesgo' as const, label: 'Oportunidades en riesgo', on: settingsNotifAlerts.oportunidadesRiesgo },
                        { key: 'clientesSinContacto' as const, label: 'Clientes sin contacto', on: settingsNotifAlerts.clientesSinContacto },
                        { key: 'anomaliasFinancieras' as const, label: 'Anomalías financieras', on: settingsNotifAlerts.anomaliasFinancieras },
                        { key: 'alertasEquipo' as const, label: 'Alertas de equipo', on: settingsNotifAlerts.alertasEquipo },
                        { key: 'campanasBajoRoi' as const, label: 'Campañas con bajo ROI', on: settingsNotifAlerts.campanasBajoRoi },
                        { key: 'metasRiesgo' as const, label: 'Metas en riesgo', on: settingsNotifAlerts.metasRiesgo },
                        { key: 'resumenSemanal' as const, label: 'Resumen semanal automático', on: settingsNotifAlerts.resumenSemanal },
                      ]).map(row => (
                        <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ color: 'white', fontSize: 13 }}>{row.label}</div>
                          <SettingsToggle on={row.on} onToggle={() => setSettingsNotifAlerts(prev => ({ ...prev, [row.key]: !prev[row.key] }))} />
                        </div>
                      ))}

                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginTop: 24, marginBottom: 16 }}>Canales</div>
                      {([
                        { key: 'pupi' as const, label: 'Dentro de Pupi', desc: 'Notificaciones en el dashboard', on: settingsNotifChannels.pupi },
                        { key: 'email' as const, label: 'Email', desc: 'Resúmenes y alertas importantes', on: settingsNotifChannels.email },
                        { key: 'whatsapp' as const, label: 'WhatsApp', desc: 'Mensajes directos al celular', on: settingsNotifChannels.whatsapp },
                      ]).map(row => (
                        <div key={row.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div>
                              <div style={{ color: 'white', fontSize: 13 }}>{row.label}</div>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{row.desc}</div>
                            </div>
                            <SettingsToggle on={row.on} onToggle={() => setSettingsNotifChannels(prev => ({ ...prev, [row.key]: !prev[row.key] }))} />
                          </div>
                          {row.key === 'whatsapp' && settingsNotifChannels.whatsapp && (
                            <input style={{ ...si, marginBottom: 8 }} value={settingsNotifWhatsAppPhone} onChange={e => setSettingsNotifWhatsAppPhone(e.target.value)} placeholder="+598 99 000 000" />
                          )}
                        </div>
                      ))}

                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginTop: 24, marginBottom: 16 }}>Frecuencia de resúmenes</div>
                      {([
                        { key: 'diario' as const, label: 'Resumen diario — 8:00 AM', on: settingsNotifFreq.diario },
                        { key: 'semanal' as const, label: 'Resumen semanal — Lunes 8:00 AM', on: settingsNotifFreq.semanal },
                        { key: 'mensual' as const, label: 'Resumen mensual — 1er día del mes', on: settingsNotifFreq.mensual },
                      ]).map(row => (
                        <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ color: 'white', fontSize: 13 }}>{row.label}</div>
                          <SettingsToggle on={row.on} onToggle={() => setSettingsNotifFreq(prev => ({ ...prev, [row.key]: !prev[row.key] }))} />
                        </div>
                      ))}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                        <button type="button" onClick={persistNotifications} style={{ background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Guardar preferencias</button>
                      </div>
                    </div>
                  )}

                  {/* ── INTEGRATIONS TAB ── */}
                  {settingsTab === 'integrations' && (
                    <div style={{ maxWidth: 640 }}>
                      <div style={{ color: 'white', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Integraciones</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 24 }}>Conectá Pupi con tus herramientas</div>
                      {[
                        { id: 'mercadopago', letter: 'MP', color: '#f97316', bg: 'rgba(249,115,22,0.15)', name: 'Mercado Pago', desc: 'Registrá pagos automáticamente' },
                        { id: 'fiserv', letter: 'F', color: '#2563EB', bg: 'rgba(37,99,235,0.15)', name: 'Fiserv', desc: 'Integrá tu POS Fiserv' },
                        { id: 'whatsapp', letter: 'WA', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', name: 'WhatsApp Business', desc: 'Recibí y enviá mensajes desde Pupi' },
                        { id: 'google', letter: 'G', color: '#2563EB', bg: 'rgba(37,99,235,0.15)', name: 'Google Calendar', desc: 'Sincronizá reuniones y eventos' },
                        { id: 'slack', letter: 'S', color: '#a855f7', bg: 'rgba(168,85,247,0.15)', name: 'Slack', desc: 'Recibí alertas en tu workspace' },
                        { id: 'zapier', letter: 'Z', color: '#f97316', bg: 'rgba(249,115,22,0.15)', name: 'Zapier', desc: 'Conectá Pupi con miles de apps' },
                      ].map(integ => {
                        const connected = settingsIntegrations[integ.id]
                        return (
                          <div key={integ.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 18, marginBottom: 10 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: integ.bg, color: integ.color, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{integ.letter}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>{integ.name}</div>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{integ.desc}</div>
                            </div>
                            {connected ? (
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ color: '#22c55e', fontSize: 12 }}>✓ Conectado</div>
                                <button type="button" onClick={() => persistIntegration(integ.id, false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4, cursor: 'pointer', padding: 0 }}>Desconectar</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => persistIntegration(integ.id, true)} style={{ border: '1px solid rgba(37,99,235,0.3)', background: 'transparent', color: '#2563EB', fontSize: 12, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', flexShrink: 0 }}>Conectar →</button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* ── VOICE TAB ── */}
                  {settingsTab === 'voice' && (
                    <div style={{ maxWidth: 560 }}>
                      <div style={{ color: 'white', fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Voz y asistente</div>

                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginBottom: 16 }}>Activación</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div style={{ color: 'white', fontSize: 13 }}>Mantener espacio (push to talk)</div>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>Mantené ␣ por 2 segundos para hablar</div>
                        </div>
                        <SettingsToggle on={voiceSpaceEnabled} onToggle={() => { const v = !voiceSpaceEnabled; setVoiceSpaceEnabled(v); persistVoice({ spaceEnabled: v }) }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div style={{ color: 'white', fontSize: 13 }}>Palabra de activación — &apos;Pupi&apos;</div>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>Desactivado: solo te escucha al decir &apos;Pupi&apos;. Activá para que escuche constantemente.</div>
                        </div>
                        <SettingsToggle on={voiceWakeEnabled} onToggle={() => { const v = !voiceWakeEnabled; setVoiceWakeEnabled(v); persistVoice({ wakeEnabled: v }) }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div style={{ color: 'white', fontSize: 13 }}>Respuesta por voz</div>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>Pupi te responde hablando</div>
                        </div>
                        <SettingsToggle on={voiceResponseEnabled} onToggle={() => { const v = !voiceResponseEnabled; setVoiceResponseEnabled(v); persistVoice({ responseEnabled: v }) }} />
                      </div>

                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginTop: 24, marginBottom: 16 }}>Idioma y voz</div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={sl}>Idioma de Pupi</label>
                        <select style={{ ...si, appearance: 'none' as const }} value={voiceIdioma} onChange={e => { setVoiceIdioma(e.target.value); persistVoice({ idioma: e.target.value }) }}>
                          {['Español (Latino)', 'Español (España)', 'English'].map(o => <option key={o} value={o} style={{ background: '#0D0D14' }}>{o}</option>)}
                        </select>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={sl}>Tipo de voz</label>
                        <select style={{ ...si, appearance: 'none' as const }} value={voiceTipo} onChange={e => { setVoiceTipo(e.target.value); persistVoice({ tipo: e.target.value }) }}>
                          {['Natural', 'Formal', 'Rápida'].map(o => <option key={o} value={o} style={{ background: '#0D0D14' }}>{o}</option>)}
                        </select>
                      </div>

                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginTop: 24, marginBottom: 16 }}>Privacidad</div>
                      <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 8, padding: 14, display: 'flex', gap: 10 }}>
                        <Shield size={16} style={{ color: '#2563EB', flexShrink: 0, marginTop: 2 }} />
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6 }}>
                          Pupi solo escucha cuando vos activás el micrófono. Nunca grabamos ni almacenamos audio. Todo se procesa en tiempo real.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── SECURITY TAB ── */}
                  {settingsTab === 'security' && (
                    <div style={{ maxWidth: 560 }}>
                      <div style={{ color: 'white', fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Seguridad</div>

                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginBottom: 16 }}>Autenticación</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Shield size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
                          <div style={{ marginLeft: 10 }}>
                            <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>Verificación en dos pasos</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>Protegé tu cuenta con un código extra</div>
                          </div>
                        </div>
                        <button type="button" style={{ border: '1px solid rgba(34,197,94,0.3)', background: 'transparent', color: '#22c55e', fontSize: 12, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', flexShrink: 0 }}>Activar</button>
                      </div>

                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginTop: 24, marginBottom: 16 }}>Sesiones activas</div>
                      {[
                        { icon: <Monitor size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />, name: 'MacBook Pro · Chrome', location: 'Montevideo, UY · Ahora', current: true },
                        { icon: <Smartphone size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />, name: 'iPhone · Safari', location: 'Montevideo, UY · Hace 2 horas', current: false },
                        { icon: <Monitor size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />, name: 'MacBook Pro · Chrome', location: 'Montevideo, UY · Hace 1 día', current: false },
                      ].map((session, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            {session.icon}
                            <div style={{ marginLeft: 10 }}>
                              <div style={{ color: 'white', fontSize: 13 }}>{session.name}</div>
                              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{session.location}</div>
                            </div>
                          </div>
                          {session.current ? (
                            <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: 20, padding: '2px 8px', fontSize: 11 }}>Sesión actual</span>
                          ) : (
                            <button type="button" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer', padding: 0 }}>Cerrar sesión</button>
                          )}
                        </div>
                      ))}
                      <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, marginTop: 16, cursor: 'pointer', padding: 0 }}>Cerrar todas las otras sesiones</button>

                      <div style={{ color: 'rgba(239,68,68,0.4)', fontSize: 10, textTransform: 'uppercase', marginTop: 24, marginBottom: 16 }}>Zona de peligro</div>
                      <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>Eliminar cuenta</div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Esta acción es irreversible</div>
                        </div>
                        <button type="button" style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#ef4444', fontSize: 12, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', flexShrink: 0 }}>Eliminar</button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
