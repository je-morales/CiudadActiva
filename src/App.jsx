import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://pdjdqefdyjyoibmjcios.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkamRxZWZkeWp5b2libWpjaW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTY0NDQsImV4cCI6MjA5MTc5MjQ0NH0.gPc6I3o2phoCAnQZ9jwjXkpk6oi_17Eh5wWnUij27M4"
);

const SUPERADMIN_EMAIL = "julioemoralest@gmail.com";
const MAZATLAN = [23.2494, -106.4111];

const PROBLEM_TYPES = [
  { id: "bache", label: "Bache", color: "#fff7ed", stroke: "#c2410c", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, pin: "#c2410c" },
  { id: "alumbrado", label: "Alumbrado", color: "#fefce8", stroke: "#a16207", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>, pin: "#a16207" },
  { id: "fuga", label: "Fuga de agua", color: "#eff6ff", stroke: "#1d4ed8", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>, pin: "#1d4ed8" },
  { id: "basura", label: "Basura", color: "#f0fdf4", stroke: "#15803d", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>, pin: "#15803d" },
  { id: "banqueta", label: "Banqueta dañada", color: "#fdf4ff", stroke: "#7e22ce", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, pin: "#7e22ce" },
  { id: "otro", label: "Otro", color: "#f8f7f4", stroke: "#6b7280", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, pin: "#6b7280" },
];

const STATUS_CONFIG = {
  "Sin verificar": { bg: "#fef3c7", text: "#92400e", border: "#f59e0b", pin: "#f59e0b" },
  "Verificado":    { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6", pin: "#3b82f6" },
  "En proceso":    { bg: "#e0e7ff", text: "#3730a3", border: "#6366f1", pin: "#6366f1" },
  "Resuelto":      { bg: "#d1fae5", text: "#065f46", border: "#10b981", pin: "#10b981" },
};

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} días`;
}

function daysOld(d) { return Math.floor((Date.now() - new Date(d)) / 86400000); }

function detectZone(lat, lng, zones) {
  const f = parseFloat(lat), g = parseFloat(lng);
  return zones.find(z => z.active && f <= z.bounds.north && f >= z.bounds.south && g <= z.bounds.east && g >= z.bounds.west) || null;
}

function createPinIcon(type) {
  const t = PROBLEM_TYPES.find(p => p.id === type) || PROBLEM_TYPES[5];
  const svgStr = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='40' viewBox='0 0 32 40'>
    <path d='M16 0C7.16 0 0 7.16 0 16c0 10.67 16 24 16 24S32 26.67 32 16C32 7.16 24.84 0 16 0z' fill='${t.pin}' stroke='white' stroke-width='2'/>
    <circle cx='16' cy='16' r='8' fill='white'/>
    <circle cx='16' cy='16' r='6' fill='${t.color}'/>
  </svg>`;
  return L.divIcon({ html: svgStr, className: "", iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -42] });
}

function LocationPicker({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat.toFixed(5), e.latlng.lng.toFixed(5)); } });
  return null;
}

function mapReportRow(x) {
  return { id: x.id, userId: x.user_id, userName: x.user_name, type: x.type, description: x.description, lat: x.lat, lng: x.lng, photos: x.photos, status: x.status, confirmations: x.confirmations, timeline: x.timeline, zone: x.zone, createdAt: x.created_at, updatedAt: x.updated_at };
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [accessCodes, setAccessCodes] = useState([]);
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem("ca_session")); } catch { return null; } });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "citizen", accessCode: "" });
  const [authError, setAuthError] = useState("");
  const [reportForm, setReportForm] = useState({ type: "", description: "", lat: "", lng: "", photos: [], pickPin: null, zone: null });
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [filterType, setFilterType] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterZone, setFilterZone] = useState("todos");
  const [selectedReport, setSelectedReport] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapCenter] = useState(MAZATLAN);
  const [saving, setSaving] = useState(false);
  const [adminTab, setAdminTab] = useState("reports");
  const [statusNote, setStatusNote] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newZone, setNewZone] = useState({ name: "", north: "", south: "", east: "", west: "" });

  const currentUser = session ? users.find(u => u.id === session.userId) : null;
  const isSuperadmin = currentUser?.email === SUPERADMIN_EMAIL;
  const isAuthority = currentUser?.role === "authority" || isSuperadmin;

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [{ data: u }, { data: r }, { data: z }, { data: c }] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
        supabase.from("zones").select("*").order("name"),
        supabase.from("access_codes").select("*"),
      ]);
      if (u) setUsers(u.map(x => ({ id: x.id, name: x.name, email: x.email, password: x.password, role: x.role, createdAt: x.created_at })));
      if (r) setReports(r.map(mapReportRow));
      if (z) setZones(z.map(x => ({ id: x.id, name: x.name, active: x.active, bounds: x.bounds, createdAt: x.created_at })));
      if (c) setAccessCodes(c.map(x => ({ code: x.code, active: x.active, createdAt: x.created_at })));
      setLoading(false);
    }
    loadAll();
  }, []);

  async function handleRegister() {
    setAuthError("");
    if (!authForm.name || !authForm.email || !authForm.password) { setAuthError("Completa todos los campos."); return; }
    if (users.find(u => u.email === authForm.email)) { setAuthError("El correo ya está registrado."); return; }
    if (authForm.role === "authority" && !accessCodes.find(c => c.code === authForm.accessCode && c.active)) { setAuthError("Código de acceso inválido."); return; }
    setSaving(true);
    const id = Date.now().toString();
    let role = authForm.role;
    if (authForm.email === SUPERADMIN_EMAIL) role = "superadmin";
    const { error } = await supabase.from("users").insert({ id, name: authForm.name, email: authForm.email, password: authForm.password, role });
    if (error) { setAuthError("Error al registrar."); setSaving(false); return; }
    const s = { userId: id };
    setUsers(u => [...u, { id, name: authForm.name, email: authForm.email, password: authForm.password, role, createdAt: new Date().toISOString() }]);
    setSession(s); localStorage.setItem("ca_session", JSON.stringify(s));
    setSaving(false); setView("home"); setAuthForm({ name: "", email: "", password: "", role: "citizen", accessCode: "" });
  }

  async function handleLogin() {
    setAuthError("");
    const u = users.find(u => u.email === authForm.email && u.password === authForm.password);
    if (!u) { setAuthError("Correo o contraseña incorrectos."); return; }
    if (u.email === SUPERADMIN_EMAIL && u.role !== "superadmin") {
      await supabase.from("users").update({ role: "superadmin" }).eq("id", u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: "superadmin" } : x));
    }
    const s = { userId: u.id };
    setSession(s); localStorage.setItem("ca_session", JSON.stringify(s));
    setView("home"); setAuthForm({ name: "", email: "", password: "", role: "citizen", accessCode: "" });
  }

  function handleLogout() { setSession(null); localStorage.removeItem("ca_session"); setView("home"); }

  function handleGetLocation() {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toFixed(5), lng = pos.coords.longitude.toFixed(5);
        const zone = detectZone(lat, lng, zones);
        setReportForm(f => ({ ...f, lat, lng, pickPin: [parseFloat(lat), parseFloat(lng)], zone }));
        setGettingLocation(false);
      },
      () => {
        const zone = detectZone(MAZATLAN[0], MAZATLAN[1], zones);
        setReportForm(f => ({ ...f, lat: MAZATLAN[0].toFixed(5), lng: MAZATLAN[1].toFixed(5), pickPin: MAZATLAN, zone }));
        setGettingLocation(false);
      }
    );
  }

  function handlePhotoUpload(e) {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setReportForm(f => ({ ...f, photos: [...f.photos, { name: file.name, data: ev.target.result }] }));
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmitReport() {
    setReportError("");
    if (!reportForm.type) { setReportError("Selecciona el tipo de problema."); return; }
    if (!reportForm.lat || !reportForm.lng) { setReportError("Marca la ubicación en el mapa o usa tu GPS."); return; }
    if (reportForm.photos.length === 0) { setReportError("Agrega al menos una fotografía."); return; }
    setSaving(true);
    const id = Date.now().toString(), now = new Date().toISOString();
    const timeline = [{ action: "Reporte creado", by: currentUser.name, at: now }];
    const { error } = await supabase.from("reports").insert({ id, user_id: currentUser.id, user_name: currentUser.name, type: reportForm.type, description: reportForm.description, lat: reportForm.lat, lng: reportForm.lng, photos: reportForm.photos, status: "Sin verificar", confirmations: [], timeline, zone: reportForm.zone?.id || null });
    if (error) { setReportError("Error al enviar."); setSaving(false); return; }
    setReports(r => [{ id, userId: currentUser.id, userName: currentUser.name, type: reportForm.type, description: reportForm.description, lat: reportForm.lat, lng: reportForm.lng, photos: reportForm.photos, status: "Sin verificar", confirmations: [], timeline, zone: reportForm.zone?.id || null, createdAt: now, updatedAt: now }, ...r]);
    setReportForm({ type: "", description: "", lat: "", lng: "", photos: [], pickPin: null, zone: null });
    setReportSuccess(true); setSaving(false);
    setTimeout(() => { setReportSuccess(false); setView("home"); }, 2000);
  }

  async function handleConfirm(reportId) {
    if (!currentUser) return;
    const r = reports.find(r => r.id === reportId);
    if (!r || r.confirmations.includes(currentUser.id)) return;
    const confs = [...r.confirmations, currentUser.id];
    const newStatus = confs.length >= 3 ? "Verificado" : r.status;
    const tl = confs.length >= 3 ? [...r.timeline, { action: "Verificado por la comunidad", by: "Sistema", at: new Date().toISOString() }] : r.timeline;
    await supabase.from("reports").update({ confirmations: confs, status: newStatus, timeline: tl, updated_at: new Date().toISOString() }).eq("id", reportId);
    const updated = reports.map(x => x.id === reportId ? { ...x, confirmations: confs, status: newStatus, timeline: tl } : x);
    setReports(updated);
    if (selectedReport?.id === reportId) setSelectedReport(updated.find(x => x.id === reportId));
  }

  async function handleStatusChange(reportId, newStatus, note) {
    const r = reports.find(x => x.id === reportId);
    if (!r) return;
    const tl = [...(r.timeline || []), { action: `Estado cambiado a "${newStatus}"${note ? `: ${note}` : ""}`, by: currentUser.name, at: new Date().toISOString() }];
    await supabase.from("reports").update({ status: newStatus, timeline: tl, updated_at: new Date().toISOString() }).eq("id", reportId);
    const updated = reports.map(x => x.id === reportId ? { ...x, status: newStatus, timeline: tl } : x);
    setReports(updated);
    if (selectedReport?.id === reportId) setSelectedReport(updated.find(x => x.id === reportId));
    setStatusNote("");
  }

  async function handleAddCode() {
    if (!newCode.trim() || accessCodes.find(c => c.code === newCode.trim())) return;
    await supabase.from("access_codes").insert({ code: newCode.trim(), active: true });
    setAccessCodes(c => [...c, { code: newCode.trim(), active: true, createdAt: new Date().toISOString() }]);
    setNewCode("");
  }

  async function handleToggleCode(code) {
    const c = accessCodes.find(x => x.code === code);
    await supabase.from("access_codes").update({ active: !c.active }).eq("code", code);
    setAccessCodes(prev => prev.map(x => x.code === code ? { ...x, active: !x.active } : x));
  }

  async function handleDeleteCode(code) {
    await supabase.from("access_codes").delete().eq("code", code);
    setAccessCodes(prev => prev.filter(x => x.code !== code));
  }

  async function handleAddZone() {
    const { name, north, south, east, west } = newZone;
    if (!name || !north || !south || !east || !west) return;
    const id = "zona-" + name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
    const bounds = { north: parseFloat(north), south: parseFloat(south), east: parseFloat(east), west: parseFloat(west) };
    await supabase.from("zones").insert({ id, name, active: true, bounds });
    setZones(z => [...z, { id, name, active: true, bounds, createdAt: new Date().toISOString() }]);
    setNewZone({ name: "", north: "", south: "", east: "", west: "" });
  }

  async function handleToggleZone(id) {
    const z = zones.find(x => x.id === id);
    await supabase.from("zones").update({ active: !z.active }).eq("id", id);
    setZones(prev => prev.map(x => x.id === id ? { ...x, active: !x.active } : x));
  }

  async function handleDeleteZone(id) {
    await supabase.from("zones").delete().eq("id", id);
    setZones(prev => prev.filter(x => x.id !== id));
  }

  async function handlePromoteUser(userId, role) {
    await supabase.from("users").update({ role }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }

  const activeZones = zones.filter(z => z.active);
  const filtered = reports.filter(r =>
    r.status !== "Resuelto" &&
    (filterType === "todos" || r.type === filterType) &&
    (filterStatus === "todos" || r.status === filterStatus) &&
    (filterZone === "todos" || r.zone === filterZone)
  );
  const recentReports = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
  const oldReports = filtered.filter(r => daysOld(r.createdAt) >= 7).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const resolvedReports = reports.filter(r => r.status === "Resuelto").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);

  const S = {
    app: { fontFamily: "'Inter', system-ui, sans-serif", background: "#f8f7f4", minHeight: "100vh", color: "#111" },
    nav: { background: "#fff", borderBottom: "0.5px solid #e5e5e5", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 },
    navLogo: { fontSize: 17, fontWeight: 700, color: "#111", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
    navDot: { width: 8, height: 8, borderRadius: "50%", background: "#2563eb" },
    navLinks: { display: "flex", gap: "2rem", alignItems: "center" },
    navLink: (a) => ({ fontSize: 13, color: a ? "#111" : "#6b7280", cursor: "pointer", paddingBottom: 2, borderBottom: a ? "2px solid #2563eb" : "2px solid transparent", fontWeight: a ? 500 : 400 }),
    navCta: { background: "#111", color: "#fff", border: "none", borderRadius: 100, padding: "8px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
    hero: { background: "#fff", borderBottom: "0.5px solid #e5e5e5", padding: "2.5rem 2rem 2rem" },
    heroInner: { maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" },
    h1: { fontSize: 36, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 10 },
    heroP: { fontSize: 14, color: "#6b7280", marginBottom: "1.5rem", maxWidth: 400, lineHeight: 1.6 },
    heroBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
    btnPrimary: { background: "#111", color: "#fff", border: "none", borderRadius: 100, padding: "11px 26px", fontSize: 14, fontWeight: 500, cursor: "pointer" },
    btnSecondary: { background: "transparent", color: "#111", border: "1.5px solid #d1d5db", borderRadius: 100, padding: "10px 22px", fontSize: 14, cursor: "pointer" },
    statsRow: { display: "flex", gap: "2rem", marginTop: "2rem", flexWrap: "wrap" },
    statItem: { display: "flex", flexDirection: "column" },
    statNum: { fontSize: 30, fontWeight: 700, letterSpacing: "-1px", color: "#111" },
    statLabel: { fontSize: 12, color: "#6b7280", marginTop: 2 },
    statDivider: { width: 1, background: "#e5e5e5", alignSelf: "stretch" },
    main: { maxWidth: 1100, margin: "0 auto", padding: "2rem" },
    layout: { display: "grid", gridTemplateColumns: "220px 1fr", gap: "1.5rem", alignItems: "start" },
    sidebar: { background: "#fff", borderRadius: 16, border: "0.5px solid #e5e5e5", padding: "1.25rem", position: "sticky", top: 72 },
    sidebarTitle: { fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 },
    filterGroup: { marginBottom: "1.25rem" },
    filterLabel: { fontSize: 12, color: "#6b7280", marginBottom: 8, display: "block" },
    filterPills: { display: "flex", flexWrap: "wrap", gap: 6 },
    pill: (a, c) => ({ fontSize: 12, padding: "5px 12px", borderRadius: 100, border: a ? `1.5px solid ${c || "#111"}` : "1px solid #e5e5e5", cursor: "pointer", color: a ? (c ? c : "#fff") : "#6b7280", background: a ? (c ? c + "18" : "#111") : "#fff", fontWeight: a ? 500 : 400 }),
    typeFilter: { display: "flex", flexDirection: "column", gap: 4 },
    typeItem: (a) => ({ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 10, cursor: "pointer", border: a ? "1px solid #bfdbfe" : "1px solid transparent", background: a ? "#f0f7ff" : "transparent" }),
    typeIconBox: (c) => ({ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: c, flexShrink: 0 }),
    typeName: { fontSize: 12, color: "#374151" },
    typeCount: { marginLeft: "auto", fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "2px 7px", borderRadius: 100 },
    content: { display: "flex", flexDirection: "column", gap: "2rem" },
    sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    sectionTitle: (c) => ({ fontSize: 15, fontWeight: 600, color: "#111", display: "flex", alignItems: "center", gap: 8 }),
    sectionDot: (c) => ({ width: 8, height: 8, borderRadius: "50%", background: c }),
    sectionLink: { fontSize: 12, color: "#2563eb", cursor: "pointer" },
    grid2: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 },
    grid3: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 },
    rCard: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 14, overflow: "hidden", cursor: "pointer" },
    rImg: (c) => ({ width: "100%", height: 80, background: c, display: "flex", alignItems: "center", justifyContent: "center" }),
    rBody: { padding: "10px 12px" },
    rTypeRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 5 },
    rTypeIcon: (c) => ({ width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: c }),
    rTypeName: { fontSize: 12, fontWeight: 600, color: "#111" },
    rStatus: (s) => { const c = STATUS_CONFIG[s] || {}; return { marginLeft: "auto", fontSize: 10, padding: "2px 8px", borderRadius: 100, fontWeight: 500, background: c.bg, color: c.text }; },
    rDesc: { fontSize: 11, color: "#6b7280", marginBottom: 6, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
    rMeta: { fontSize: 10, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 },
    oldSection: { background: "#fff", borderRadius: 14, border: "0.5px solid #e5e5e5", overflow: "hidden" },
    oldRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: "0.5px solid #f3f4f6" },
    oldIcon: (c) => ({ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: c, flexShrink: 0 }),
    daysTag: { fontSize: 10, color: "#991b1b", background: "#fee2e2", padding: "3px 10px", borderRadius: 100, fontWeight: 500, flexShrink: 0 },
    resCard: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 12, padding: "12px", position: "relative" },
    resCheck: { position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" },
    resIcon: (c) => ({ width: 32, height: 32, borderRadius: 10, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", background: c }),
    input: { width: "100%", boxSizing: "border-box", padding: "9px 12px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 10, marginBottom: 10, color: "#111", background: "#fff" },
    label: { fontSize: 13, color: "#6b7280", display: "block", marginBottom: 4 },
    error: { fontSize: 13, color: "#dc2626", marginBottom: 8 },
    badge: (s) => { const c = STATUS_CONFIG[s] || {}; return { display: "inline-block", fontSize: 11, padding: "3px 10px", borderRadius: 100, fontWeight: 500, background: c.bg || "#f3f4f6", color: c.text || "#374151", border: `1px solid ${c.border || "#d1d5db"}` }; },
    roleBadge: (r) => ({ display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 100, fontWeight: 500, ...(r === "superadmin" ? { background: "#fef3c7", color: "#92400e", border: "1px solid #f59e0b" } : r === "authority" ? { background: "#dbeafe", color: "#1e40af", border: "1px solid #3b82f6" } : { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }) }),
    card: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: 10 },
    tabBar: { display: "flex", borderBottom: "1px solid #e5e5e5", marginBottom: "1.25rem" },
    tab: (a) => ({ fontSize: 13, padding: "8px 16px", border: "none", borderBottom: a ? "2px solid #111" : "2px solid transparent", background: "transparent", color: a ? "#111" : "#6b7280", cursor: "pointer", fontWeight: a ? 600 : 400 }),
    typeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 },
    typeBtnBig: (a, c) => ({ padding: "10px 8px", textAlign: "center", fontSize: 12, border: a ? `2px solid ${c}` : "1px solid #e5e5e5", borderRadius: 10, background: a ? c + "20" : "#fff", color: "#111", cursor: "pointer" }),
    mapBox: { borderRadius: 14, overflow: "hidden", border: "1px solid #e5e5e5", marginBottom: 12 },
    confirmBtn: (c) => ({ fontSize: 12, padding: "5px 12px", borderRadius: 100, border: c ? "1.5px solid #10b981" : "1px solid #d1d5db", background: c ? "#d1fae5" : "transparent", color: c ? "#065f46" : "#6b7280", cursor: c ? "default" : "pointer" }),
    btnDanger: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" },
    btnSuccess: { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" },
    btnWarning: { background: "#e0e7ff", color: "#3730a3", border: "1px solid #a5b4fc", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" },
    btn: { fontSize: 13, padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "transparent", color: "#111", cursor: "pointer" },
    btnFull: { width: "100%", padding: 10, fontSize: 14, fontWeight: 500, background: "#111", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", marginTop: 4 },
  };

  if (loading) return <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><div style={{ textAlign: "center", color: "#6b7280" }}><div style={{ fontSize: 24, marginBottom: 8 }}>🗺️</div><div style={{ fontSize: 14 }}>Cargando CiudadActiva...</div></div></div>;

  const NavBar = () => (
    <div style={S.nav}>
      <div style={S.navLogo} onClick={() => setView("home")}>
        <div style={S.navDot} />CiudadActiva
      </div>
      <div style={S.navLinks}>
        {[["home","Inicio"],["reports","Reportes"],["map","Mapa"],["blog","Blog"],["contact","Contacto"]].map(([v,l]) => (
          <span key={v} style={S.navLink(view === v)} onClick={() => setView(v)}>{l}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {currentUser ? <>
          {isAuthority && <button style={{ ...S.btn, background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e" }} onClick={() => setView("admin")}>🏛️ Panel</button>}
          <button style={S.btn} onClick={() => setView("myreports")}>Mis reportes</button>
          <button style={{ ...S.btn, fontSize: 12, color: "#9ca3af" }} onClick={handleLogout}>Salir</button>
          {!isAuthority && <button style={S.navCta} onClick={() => setView("report")}>+ Reportar</button>}
        </> : <>
          <button style={S.btn} onClick={() => setView("auth")}>Iniciar sesión</button>
          <button style={S.navCta} onClick={() => { setView("auth"); setAuthMode("register"); }}>Registrarse</button>
        </>}
      </div>
    </div>
  );

  // ─── AUTH ────────────────────────────────────────────────────────────────────
  if (view === "auth") return (
    <div style={S.app}><NavBar />
      <div style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1.25rem" }}>
        <div style={S.tabBar}>
          <button style={S.tab(authMode === "login")} onClick={() => { setAuthMode("login"); setAuthError(""); }}>Iniciar sesión</button>
          <button style={S.tab(authMode === "register")} onClick={() => { setAuthMode("register"); setAuthError(""); }}>Registrarse</button>
        </div>
        {authMode === "register" && <>
          <label style={S.label}>Nombre completo</label>
          <input style={S.input} placeholder="Tu nombre" value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} />
          <label style={S.label}>Tipo de cuenta</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {["citizen","authority"].map(r => (
              <button key={r} style={S.typeBtnBig(authForm.role === r, "#2563eb")} onClick={() => setAuthForm(f => ({ ...f, role: r }))}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{r === "citizen" ? "👤" : "🏛️"}</div>
                <div>{r === "citizen" ? "Ciudadano" : "Autoridad"}</div>
              </button>
            ))}
          </div>
          {authForm.role === "authority" && <>
            <label style={S.label}>Código de acceso</label>
            <input style={S.input} placeholder="Código proporcionado por administrador" value={authForm.accessCode} onChange={e => setAuthForm(f => ({ ...f, accessCode: e.target.value }))} />
          </>}
        </>}
        <label style={S.label}>Correo electrónico</label>
        <input style={S.input} placeholder="correo@ejemplo.com" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
        <label style={S.label}>Contraseña</label>
        <input style={S.input} type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />
        {authError && <p style={S.error}>{authError}</p>}
        <button style={S.btnFull} onClick={authMode === "login" ? handleLogin : handleRegister} disabled={saving}>{saving ? "Procesando..." : authMode === "login" ? "Entrar" : "Crear cuenta"}</button>
      </div>
    </div>
  );

  // ─── REPORT FORM ─────────────────────────────────────────────────────────────
  if (view === "report") {
    if (reportSuccess) return <div style={S.app}><NavBar /><div style={{ maxWidth: 500, margin: "3rem auto", padding: "0 1.25rem" }}><div style={{ background: "#d1fae5", border: "1px solid #10b981", borderRadius: 16, padding: "2rem", textAlign: "center", color: "#065f46", fontSize: 16, fontWeight: 600 }}>✓ Reporte enviado exitosamente<br /><span style={{ fontWeight: 400, fontSize: 13 }}>La comunidad podrá confirmarlo pronto</span></div></div></div>;
    return (
      <div style={S.app}><NavBar />
        <div style={{ maxWidth: 600, margin: "2rem auto", padding: "0 1.25rem" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: "1.5rem" }}>Nuevo reporte</h2>
          <label style={S.label}>Tipo de problema</label>
          <div style={S.typeGrid}>
            {PROBLEM_TYPES.map(pt => (
              <button key={pt.id} style={S.typeBtnBig(reportForm.type === pt.id, pt.stroke)} onClick={() => setReportForm(f => ({ ...f, type: pt.id }))}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{pt.icon}</div>
                <div style={{ fontSize: 11 }}>{pt.label}</div>
              </button>
            ))}
          </div>
          <label style={S.label}>Descripción (opcional)</label>
          <textarea style={{ ...S.input, minHeight: 68, resize: "vertical" }} placeholder="Describe el problema con detalle..." value={reportForm.description} onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))} />
          <label style={S.label}>Ubicación — toca el mapa para marcar el punto exacto</label>
          <div style={{ ...S.mapBox, height: 300 }}>
            <MapContainer center={MAZATLAN} zoom={14} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              <LocationPicker onPick={(lat, lng) => { const zone = detectZone(lat, lng, zones); setReportForm(f => ({ ...f, lat, lng, pickPin: [parseFloat(lat), parseFloat(lng)], zone })); }} />
              {reportForm.pickPin && <Marker position={reportForm.pickPin} icon={createPinIcon(reportForm.type || "otro")} />}
            </MapContainer>
          </div>
          {reportForm.lat && (
            <div style={{ background: reportForm.zone ? "#f0f7ff" : "#f9fafb", border: "1px solid #e5e5e5", borderRadius: 10, padding: "9px 12px", marginBottom: 10, fontSize: 13, color: "#374151", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{reportForm.zone ? `📍 Zona: ${reportForm.zone.name}` : `${reportForm.lat}, ${reportForm.lng}`}</span>
              <button style={{ ...S.btn, fontSize: 11 }} onClick={() => setReportForm(f => ({ ...f, lat: "", lng: "", pickPin: null, zone: null }))}>Limpiar</button>
            </div>
          )}
          {!reportForm.lat && <button style={{ ...S.btn, width: "100%", padding: 9, marginBottom: 10 }} onClick={handleGetLocation} disabled={gettingLocation}>{gettingLocation ? "Obteniendo ubicación..." : "Usar mi ubicación GPS"}</button>}
          <label style={S.label}>Fotografías (mínimo 1)</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>{reportForm.photos.map((p, i) => <img key={i} src={p.data} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e5e5" }} />)}</div>
          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }} />
          {reportError && <p style={S.error}>{reportError}</p>}
          <button style={S.btnFull} onClick={handleSubmitReport} disabled={saving}>{saving ? "Enviando..." : "Enviar reporte"}</button>
        </div>
      </div>
    );
  }

  // ─── DETAIL ──────────────────────────────────────────────────────────────────
  if (view === "detail" && selectedReport) {
    const r = selectedReport;
    const confirmed = currentUser && r.confirmations.includes(currentUser.id);
    const type = PROBLEM_TYPES.find(t => t.id === r.type);
    const zoneName = zones.find(z => z.id === r.zone)?.name;
    const canManage = isAuthority && ["Verificado", "En proceso"].includes(r.status);
    return (
      <div style={S.app}><NavBar />
        <div style={{ maxWidth: 640, margin: "2rem auto", padding: "0 1.25rem" }}>
          <button style={{ ...S.btn, marginBottom: "1rem" }} onClick={() => setView("home")}>← Regresar</button>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ ...S.typeIconBox(type?.color), width: 48, height: 48, borderRadius: 12, flexShrink: 0 }}>{type?.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{type?.label}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Por {r.userName} · {timeAgo(r.createdAt)}{zoneName ? ` · ${zoneName}` : ""}</div>
            </div>
            <span style={S.badge(r.status)}>{r.status}</span>
          </div>
          {r.description && <p style={{ fontSize: 14, color: "#374151", marginBottom: 14, lineHeight: 1.6 }}>{r.description}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>{r.photos.map((p, i) => <img key={i} src={p.data} alt="" style={{ height: 110, width: 140, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e5e5" }} />)}</div>
          <div style={{ ...S.mapBox, height: 220, marginBottom: 14 }}>
            <MapContainer center={[parseFloat(r.lat), parseFloat(r.lng)]} zoom={16} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              <Marker position={[parseFloat(r.lat), parseFloat(r.lng)]} icon={createPinIcon(r.type)}>
                <Popup>{type?.label}<br /><small>{r.status}</small></Popup>
              </Marker>
            </MapContainer>
          </div>
          <div style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Confirmaciones ciudadanas</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>{r.confirmations.length} de 3 necesarias</div>
              <div style={{ height: 5, background: "#f3f4f6", borderRadius: 3, marginTop: 8, width: 160 }}>
                <div style={{ height: 5, background: "#2563eb", borderRadius: 3, width: `${Math.min(100, (r.confirmations.length / 3) * 100)}%`, transition: "width 0.3s" }} />
              </div>
            </div>
            {currentUser && r.userId !== currentUser.id && !isAuthority && (
              <button style={S.confirmBtn(confirmed)} onClick={() => handleConfirm(r.id)} disabled={confirmed}>{confirmed ? "✓ Confirmado" : "Confirmar"}</button>
            )}
          </div>
          {canManage && (
            <div style={{ ...S.card, borderColor: "#a5b4fc" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🏛️ Gestión de autoridad</div>
              <label style={S.label}>Nota de seguimiento (opcional)</label>
              <input style={S.input} placeholder="Ej. Cuadrilla asignada para el martes..." value={statusNote} onChange={e => setStatusNote(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                {r.status !== "En proceso" && <button style={S.btnWarning} onClick={() => handleStatusChange(r.id, "En proceso", statusNote)}>Marcar en proceso</button>}
                <button style={S.btnSuccess} onClick={() => handleStatusChange(r.id, "Resuelto", statusNote)}>Marcar resuelto</button>
              </div>
            </div>
          )}
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Línea de tiempo</div>
            {(r.timeline || []).map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", marginTop: 5, flexShrink: 0 }} />
                <div><div style={{ fontSize: 13 }}>{t.action}</div><div style={{ fontSize: 12, color: "#9ca3af" }}>{t.by} · {timeAgo(t.at)}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── MAP VIEW ─────────────────────────────────────────────────────────────────
  if (view === "map") return (
    <div style={S.app}><NavBar />
      <div style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 1.25rem" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: "1rem" }}>Mapa de reportes activos</h2>
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e5e5e5", height: 560 }}>
          <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            {reports.filter(r => r.status !== "Resuelto" && r.lat && r.lng).map(r => (
              <Marker key={r.id} position={[parseFloat(r.lat), parseFloat(r.lng)]} icon={createPinIcon(r.type)} eventHandlers={{ click: () => { setSelectedReport(r); setView("detail"); } }}>
                <Popup><strong>{PROBLEM_TYPES.find(t => t.id === r.type)?.label}</strong><br /><small>{r.status} · {timeAgo(r.createdAt)}</small></Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: "1rem", flexWrap: "wrap" }}>
          {PROBLEM_TYPES.map(pt => <div key={pt.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: pt.pin }} />{pt.label}</div>)}
        </div>
      </div>
    </div>
  );

  // ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
  if (view === "reports") return (
    <div style={S.app}><NavBar />
      <div style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Todos los reportes</h2>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{reports.length} reportes en total</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
          {Object.keys(STATUS_CONFIG).map(s => <button key={s} style={S.pill(filterStatus === s, STATUS_CONFIG[s].border)} onClick={() => setFilterStatus(filterStatus === s ? "todos" : s)}>{s}</button>)}
        </div>
        <div style={S.grid3}>
          {reports.filter(r => filterStatus === "todos" || r.status === filterStatus).map(r => {
            const type = PROBLEM_TYPES.find(t => t.id === r.type);
            return (
              <div key={r.id} style={{ ...S.rCard }} onClick={() => { setSelectedReport(r); setView("detail"); }}>
                <div style={S.rImg(type?.color || "#f3f4f6")}><div style={{ ...S.typeIconBox(type?.color), width: 44, height: 44, borderRadius: 12 }}>{type?.icon}</div></div>
                <div style={S.rBody}>
                  <div style={S.rTypeRow}>
                    <span style={S.rTypeName}>{type?.label}</span>
                    <span style={S.rStatus(r.status)}>{r.status}</span>
                  </div>
                  {r.description && <div style={S.rDesc}>{r.description}</div>}
                  <div style={S.rMeta}>{timeAgo(r.createdAt)} · {r.userName}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ─── BLOG / CONTACT ──────────────────────────────────────────────────────────
  if (view === "blog") return (
    <div style={S.app}><NavBar />
      <div style={{ maxWidth: 700, margin: "3rem auto", padding: "0 1.25rem", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Blog</h2>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Próximamente — artículos sobre participación ciudadana y mejoras en Mazatlán.</p>
      </div>
    </div>
  );

  if (view === "contact") return (
    <div style={S.app}><NavBar />
      <div style={{ maxWidth: 500, margin: "3rem auto", padding: "0 1.25rem" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: "1.5rem" }}>Contacto</h2>
        <label style={S.label}>Nombre</label><input style={S.input} placeholder="Tu nombre" />
        <label style={S.label}>Correo electrónico</label><input style={S.input} placeholder="correo@ejemplo.com" />
        <label style={S.label}>Mensaje</label><textarea style={{ ...S.input, minHeight: 100, resize: "vertical" }} placeholder="¿En qué podemos ayudarte?" />
        <button style={S.btnFull}>Enviar mensaje</button>
      </div>
    </div>
  );

  // ─── MY REPORTS ──────────────────────────────────────────────────────────────
  if (view === "myreports") {
    const myReports = reports.filter(r => r.userId === currentUser?.id);
    return (
      <div style={S.app}><NavBar />
        <div style={{ maxWidth: 700, margin: "2rem auto", padding: "0 1.25rem" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: "1.5rem" }}>Mis reportes</h2>
          {myReports.length === 0
            ? <p style={{ color: "#6b7280" }}>No has enviado reportes aún.</p>
            : myReports.map(r => {
                const type = PROBLEM_TYPES.find(t => t.id === r.type);
                return (
                  <div key={r.id} style={{ ...S.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => { setSelectedReport(r); setView("detail"); }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ ...S.typeIconBox(type?.color), width: 36, height: 36 }}>{type?.icon}</div>
                      <div><div style={{ fontWeight: 500, fontSize: 14 }}>{type?.label}</div><div style={{ fontSize: 12, color: "#9ca3af" }}>{timeAgo(r.createdAt)} · {r.confirmations.length} confirmaciones</div></div>
                    </div>
                    <span style={S.badge(r.status)}>{r.status}</span>
                  </div>
                );
              })}
        </div>
      </div>
    );
  }

  // ─── ADMIN ───────────────────────────────────────────────────────────────────
  if (view === "admin") {
    const pendingReports = reports.filter(r => ["Verificado", "En proceso"].includes(r.status));
    return (
      <div style={S.app}><NavBar />
        <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1.25rem" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: "1.5rem" }}>{isSuperadmin ? "Panel superadmin" : "Panel de autoridad"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: "1.5rem" }}>
            {[["Pendientes", pendingReports.length,"#3b82f6"],["En proceso",reports.filter(r=>r.status==="En proceso").length,"#6366f1"],["Resueltos",reports.filter(r=>r.status==="Resuelto").length,"#10b981"]].map(([l,n,c])=>(
              <div key={l} style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e5e5e5", padding: "1rem", textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: c }}>{n}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={S.tabBar}>
            <button style={S.tab(adminTab === "reports")} onClick={() => setAdminTab("reports")}>Reportes</button>
            {isSuperadmin && <button style={S.tab(adminTab === "zones")} onClick={() => setAdminTab("zones")}>Zonas</button>}
            {isSuperadmin && <button style={S.tab(adminTab === "codes")} onClick={() => setAdminTab("codes")}>Códigos</button>}
            {isSuperadmin && <button style={S.tab(adminTab === "users")} onClick={() => setAdminTab("users")}>Usuarios</button>}
          </div>

          {adminTab === "reports" && (pendingReports.length === 0
            ? <p style={{ color: "#6b7280", fontSize: 14 }}>No hay reportes pendientes.</p>
            : pendingReports.map(r => {
                const type = PROBLEM_TYPES.find(t => t.id === r.type);
                return (
                  <div key={r.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => { setSelectedReport(r); setView("detail"); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ ...S.typeIconBox(type?.color), width: 36, height: 36 }}>{type?.icon}</div>
                        <div><div style={{ fontWeight: 500, fontSize: 14 }}>{type?.label}</div><div style={{ fontSize: 12, color: "#9ca3af" }}>{r.userName} · {timeAgo(r.createdAt)}{zones.find(z=>z.id===r.zone) ? ` · ${zones.find(z=>z.id===r.zone).name}` : ""}</div></div>
                      </div>
                      <span style={S.badge(r.status)}>{r.status}</span>
                    </div>
                  </div>
                );
              }))}

          {adminTab === "zones" && isSuperadmin && <>
            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Nueva zona</div>
              <label style={S.label}>Nombre de la zona</label>
              <input style={S.input} placeholder="Ej. Zona Dorada" value={newZone.name} onChange={e => setNewZone(z => ({ ...z, name: e.target.value }))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["north","Norte (lat max)"],["south","Sur (lat min)"],["east","Este (lng max)"],["west","Oeste (lng min)"]].map(([k,l]) => (
                  <div key={k}><label style={S.label}>{l}</label><input style={{ ...S.input, marginBottom: 0 }} placeholder="23.0000" value={newZone[k]} onChange={e => setNewZone(z => ({ ...z, [k]: e.target.value }))} /></div>
                ))}
              </div>
              <button style={{ ...S.btnFull, marginTop: 12 }} onClick={handleAddZone}>Agregar zona</button>
            </div>
            {zones.map(z => (
              <div key={z.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{z.name}</span>
                  <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 100, background: z.active ? "#d1fae5" : "#f3f4f6", color: z.active ? "#065f46" : "#6b7280" }}>{z.active ? "Activa" : "Inactiva"}</span>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>N:{z.bounds.north} S:{z.bounds.south} E:{z.bounds.east} O:{z.bounds.west}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={z.active ? S.btnDanger : S.btnSuccess} onClick={() => handleToggleZone(z.id)}>{z.active ? "Desactivar" : "Activar"}</button>
                  <button style={S.btnDanger} onClick={() => handleDeleteZone(z.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </>}

          {adminTab === "codes" && isSuperadmin && <>
            <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
              <input style={{ ...S.input, marginBottom: 0, flex: 1 }} placeholder="Nuevo código de acceso" value={newCode} onChange={e => setNewCode(e.target.value)} />
              <button style={{ ...S.btn, background: "#111", color: "#fff", border: "none" }} onClick={handleAddCode}>Agregar</button>
            </div>
            {accessCodes.map(c => (
              <div key={c.code} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><span style={{ fontWeight: 600, fontFamily: "monospace" }}>{c.code}</span><span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 100, background: c.active ? "#d1fae5" : "#f3f4f6", color: c.active ? "#065f46" : "#6b7280" }}>{c.active ? "Activo" : "Inactivo"}</span></div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={c.active ? S.btnDanger : S.btnSuccess} onClick={() => handleToggleCode(c.code)}>{c.active ? "Desactivar" : "Activar"}</button>
                  <button style={S.btnDanger} onClick={() => handleDeleteCode(c.code)}>Eliminar</button>
                </div>
              </div>
            ))}
          </>}

          {adminTab === "users" && isSuperadmin && users.filter(u => u.email !== SUPERADMIN_EMAIL).map(u => (
            <div key={u.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontWeight: 500 }}>{u.name}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{u.email}</div><span style={{ ...S.roleBadge(u.role), marginTop: 4, display: "inline-block" }}>{u.role === "authority" ? "Autoridad" : "Ciudadano"}</span></div>
              <div style={{ display: "flex", gap: 6 }}>
                {u.role !== "authority" && <button style={S.btnWarning} onClick={() => handlePromoteUser(u.id, "authority")}>Promover</button>}
                {u.role === "authority" && <button style={S.btnDanger} onClick={() => handlePromoteUser(u.id, "citizen")}>Degradar</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── HOME ─────────────────────────────────────────────────────────────────────
  const activeReports = reports.filter(r => r.status !== "Resuelto");
  return (
    <div style={S.app}>
      <NavBar />
      <div style={S.hero}>
        <div style={S.heroInner}>
          <div>
            <h1 style={S.h1}>Tu ciudad,<br /><span style={{ color: "#2563eb" }}>tu voz</span></h1>
            <p style={S.heroP}>Reporta problemas urbanos en Mazatlán. La comunidad los verifica y las autoridades los resuelven.</p>
            <div style={S.heroBtns}>
              {currentUser && !isAuthority
                ? <button style={S.btnPrimary} onClick={() => setView("report")}>+ Reportar problema</button>
                : !currentUser && <button style={S.btnPrimary} onClick={() => setView("auth")}>Comenzar ahora</button>}
              <button style={S.btnSecondary} onClick={() => setView("map")}>Ver el mapa</button>
            </div>
            <div style={S.statsRow}>
              {[[activeReports.length,"Reportes activos"],[reports.filter(r=>r.status==="Verificado").length,"Verificados"],[reports.filter(r=>r.status==="Resuelto").length,"Resueltos"]].map(([n,l],i,arr) => (
                <div key={l} style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                  <div style={S.statItem}><span style={S.statNum}>{n}</span><span style={S.statLabel}>{l}</span></div>
                  {i < arr.length - 1 && <div style={S.statDivider} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={S.main}>
        <div style={S.layout}>
          <div style={S.sidebar}>
            <div style={S.sidebarTitle}>Filtros</div>
            <div style={S.filterGroup}>
              <span style={S.filterLabel}>Estado</span>
              <div style={S.filterPills}>
                <span style={S.pill(filterStatus === "todos")} onClick={() => setFilterStatus("todos")}>Todos</span>
                {Object.keys(STATUS_CONFIG).filter(s => s !== "Resuelto").map(s => <span key={s} style={S.pill(filterStatus === s, STATUS_CONFIG[s].border)} onClick={() => setFilterStatus(filterStatus === s ? "todos" : s)}>{s}</span>)}
              </div>
            </div>
            <div style={S.filterGroup}>
              <span style={S.filterLabel}>Tipo de problema</span>
              <div style={S.typeFilter}>
                <div style={S.typeItem(filterType === "todos")} onClick={() => setFilterType("todos")}>
                  <div style={{ ...S.typeIconBox("#f3f4f6"), width: 28, height: 28 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>
                  <span style={S.typeName}>Todos</span>
                  <span style={S.typeCount}>{activeReports.length}</span>
                </div>
                {PROBLEM_TYPES.map(pt => {
                  const cnt = activeReports.filter(r => r.type === pt.id).length;
                  return (
                    <div key={pt.id} style={S.typeItem(filterType === pt.id)} onClick={() => setFilterType(filterType === pt.id ? "todos" : pt.id)}>
                      <div style={S.typeIconBox(pt.color)}>{pt.icon}</div>
                      <span style={S.typeName}>{pt.label}</span>
                      <span style={S.typeCount}>{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {activeZones.length > 0 && (
              <div style={{ borderTop: "0.5px solid #e5e5e5", paddingTop: "1rem" }}>
                <span style={S.filterLabel}>Zona</span>
                <div style={{ ...S.filterPills, marginTop: 8 }}>
                  <span style={S.pill(filterZone === "todos")} onClick={() => setFilterZone("todos")}>Todas</span>
                  {activeZones.map(z => <span key={z.id} style={S.pill(filterZone === z.id, "#2563eb")} onClick={() => setFilterZone(filterZone === z.id ? "todos" : z.id)}>{z.name}</span>)}
                </div>
              </div>
            )}
          </div>

          <div style={S.content}>
            <div>
              <div style={S.sectionHeader}>
                <div style={S.sectionTitle()}><div style={S.sectionDot("#3b82f6")} />Reportes recientes</div>
                <span style={S.sectionLink} onClick={() => setView("reports")}>Ver todos</span>
              </div>
              {recentReports.length === 0
                ? <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e5e5e5", padding: "2rem", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>Aún no hay reportes. ¡Sé el primero en reportar!</div>
                : <div style={S.grid2}>{recentReports.map(r => {
                    const type = PROBLEM_TYPES.find(t => t.id === r.type);
                    const confirmed = currentUser && r.confirmations.includes(currentUser.id);
                    return (
                      <div key={r.id} style={S.rCard} onClick={() => { setSelectedReport(r); setView("detail"); }}>
                        <div style={S.rImg(type?.color || "#f3f4f6")}><div style={{ ...S.typeIconBox(type?.color), width: 44, height: 44, borderRadius: 12 }}>{type?.icon}</div></div>
                        <div style={S.rBody}>
                          <div style={S.rTypeRow}>
                            <div style={S.rTypeIcon(type?.color)}>{type?.icon}</div>
                            <span style={S.rTypeName}>{type?.label}</span>
                            <span style={S.rStatus(r.status)}>{r.status}</span>
                          </div>
                          {r.description && <div style={S.rDesc}>{r.description}</div>}
                          <div style={S.rMeta}>
                            {timeAgo(r.createdAt)}
                            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                              {r.confirmations.length}/3
                              <div style={{ height: 3, background: "#e5e5e5", borderRadius: 2, width: 30 }}>
                                <div style={{ height: 3, background: r.confirmations.length >= 3 ? "#10b981" : "#2563eb", borderRadius: 2, width: `${Math.min(100, (r.confirmations.length / 3) * 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}</div>}
            </div>

            {oldReports.length > 0 && (
              <div>
                <div style={S.sectionHeader}>
                  <div style={S.sectionTitle()}><div style={S.sectionDot("#ef4444")} />Sin resolver — más de 7 días</div>
                  <span style={S.sectionLink} onClick={() => setView("reports")}>Ver todos</span>
                </div>
                <div style={S.oldSection}>
                  {oldReports.slice(0, 5).map((r, i) => {
                    const type = PROBLEM_TYPES.find(t => t.id === r.type);
                    return (
                      <div key={r.id} style={{ ...S.oldRow, borderBottom: i < Math.min(4, oldReports.length - 1) ? "0.5px solid #f3f4f6" : "none", cursor: "pointer" }} onClick={() => { setSelectedReport(r); setView("detail"); }}>
                        <div style={S.oldIcon(type?.color)}>{type?.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{type?.label} — {r.description?.slice(0, 50) || "Sin descripción"}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{r.status} · {r.confirmations.length} confirmaciones{zones.find(z => z.id === r.zone) ? ` · ${zones.find(z => z.id === r.zone).name}` : ""}</div>
                        </div>
                        <span style={S.daysTag}>{daysOld(r.createdAt)} días</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {resolvedReports.length > 0 && (
              <div>
                <div style={S.sectionHeader}>
                  <div style={S.sectionTitle()}><div style={S.sectionDot("#10b981")} />Recientemente resueltos</div>
                  <span style={S.sectionLink} onClick={() => setView("reports")}>Ver todos</span>
                </div>
                <div style={S.grid3}>
                  {resolvedReports.map(r => {
                    const type = PROBLEM_TYPES.find(t => t.id === r.type);
                    return (
                      <div key={r.id} style={{ ...S.resCard, cursor: "pointer" }} onClick={() => { setSelectedReport(r); setView("detail"); }}>
                        <div style={S.resCheck}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                        <div style={S.resIcon(type?.color)}>{type?.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3 }}>{type?.label}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>Resuelto {timeAgo(r.updatedAt)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}