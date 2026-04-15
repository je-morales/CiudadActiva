import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Constants ───────────────────────────────────────────────────────────────
const SUPERADMIN_EMAIL = "julioemoralest@gmail.com";
const MAZATLAN = [23.2494, -106.4111];

const PROBLEM_TYPES = [
  { id: "bache", label: "Bache", icon: "⚠️" },
  { id: "alumbrado", label: "Alumbrado", icon: "💡" },
  { id: "fuga", label: "Fuga de agua", icon: "💧" },
  { id: "basura", label: "Basura", icon: "🗑️" },
  { id: "banqueta", label: "Banqueta dañada", icon: "🚧" },
  { id: "otro", label: "Otro", icon: "📋" },
];

const STATUS_CONFIG = {
  "Sin verificar": { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B", pin: "#F59E0B" },
  "Verificado":    { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6", pin: "#3B82F6" },
  "En proceso":    { bg: "#E0E7FF", text: "#3730A3", border: "#6366F1", pin: "#6366F1" },
  "Resuelto":      { bg: "#D1FAE5", text: "#065F46", border: "#10B981", pin: "#10B981" },
};

// ─── Storage ─────────────────────────────────────────────────────────────────
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} días`;
}

function createPinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -38] });
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const cs = {
  app: { fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", paddingBottom: "3rem", background: "#fff", minHeight: "100vh" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1.25rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1.25rem" },
  logo: { fontSize: 17, fontWeight: 600, color: "#111" },
  logoSub: { fontSize: 11, color: "#6b7280", display: "block" },
  section: { padding: "0 1.25rem" },
  btn: { fontSize: 13, padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "transparent", color: "#111", cursor: "pointer" },
  btnPrimary: { background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%" },
  btnDanger: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" },
  btnSuccess: { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" },
  btnWarning: { background: "#e0e7ff", color: "#3730a3", border: "1px solid #a5b4fc", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" },
  input: { width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 8, marginBottom: 10, color: "#111" },
  label: { fontSize: 13, color: "#6b7280", display: "block", marginBottom: 4 },
  error: { fontSize: 13, color: "#dc2626", marginBottom: 8 },
  badge: s => { const c = STATUS_CONFIG[s] || {}; return { display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 100, fontWeight: 500, background: c.bg || "#f3f4f6", color: c.text || "#374151", border: `1px solid ${c.border || "#d1d5db"}` }; },
  roleBadge: r => ({ display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 100, fontWeight: 500, ...(r === "superadmin" ? { background: "#fef3c7", color: "#92400e", border: "1px solid #f59e0b" } : r === "authority" ? { background: "#dbeafe", color: "#1e40af", border: "1px solid #3b82f6" } : { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }) }),
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 10 },
  filterBtn: a => ({ fontSize: 12, padding: "4px 10px", borderRadius: 100, border: a ? "1.5px solid #2563eb" : "1px solid #e5e7eb", background: a ? "#eff6ff" : "transparent", color: a ? "#1d4ed8" : "#6b7280", cursor: "pointer" }),
  tabBar: { display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "1.25rem" },
  tab: a => ({ fontSize: 13, padding: "8px 16px", border: "none", borderBottom: a ? "2px solid #111" : "2px solid transparent", background: "transparent", color: a ? "#111" : "#6b7280", cursor: "pointer", fontWeight: a ? 600 : 400 }),
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "1.25rem" },
  statCard: { background: "#f9fafb", borderRadius: 8, padding: "0.75rem 1rem", textAlign: "center" },
  typeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 },
  typeBtn: a => ({ padding: "10px 8px", textAlign: "center", fontSize: 12, border: a ? "2px solid #2563eb" : "1px solid #e5e7eb", borderRadius: 8, background: a ? "#eff6ff" : "#fff", color: a ? "#1d4ed8" : "#111", cursor: "pointer" }),
  mapBox: { borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", marginBottom: 12 },
  confirmBtn: c => ({ fontSize: 12, padding: "5px 12px", borderRadius: 100, border: c ? "1.5px solid #10b981" : "1px solid #d1d5db", background: c ? "#d1fae5" : "transparent", color: c ? "#065f46" : "#6b7280", cursor: c ? "default" : "pointer" }),
  legend: { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: "1rem" },
  legendDot: c => ({ width: 10, height: 10, borderRadius: "50%", background: STATUS_CONFIG[c]?.pin || "#888", flexShrink: 0, marginRight: 4 }),
  divider: { borderTop: "1px solid #e5e7eb", margin: "1rem 0" },
  noteBox: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#065f46", marginTop: 8 },
};

// ─── LocationPicker component ─────────────────────────────────────────────────
import { useMapEvents } from "react-leaflet";
function LocationPicker({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat.toFixed(5), e.latlng.lng.toFixed(5)); } });
  return null;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState(() => load("ca_users", []));
  const [reports, setReports] = useState(() => load("ca_reports", []));
  const [session, setSession] = useState(() => load("ca_session", null));
  const [accessCodes, setAccessCodes] = useState(() => load("ca_codes", []));

  const [view, setView] = useState("home");
  const [homeTab, setHomeTab] = useState("list");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "citizen", accessCode: "" });
  const [authError, setAuthError] = useState("");
  const [reportForm, setReportForm] = useState({ type: "", description: "", lat: "", lng: "", photos: [], pickPin: null });
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [filterType, setFilterType] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [selectedReport, setSelectedReport] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState(MAZATLAN);
  const [newCode, setNewCode] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [adminTab, setAdminTab] = useState("reports");

  const currentUser = session ? users.find(u => u.id === session.userId) : null;
  const isSuperadmin = currentUser?.email === SUPERADMIN_EMAIL;
  const isAuthority = currentUser?.role === "authority" || isSuperadmin;

  function saveAll(u, r, s, c) {
    if (u !== undefined) { setUsers(u); save("ca_users", u); }
    if (r !== undefined) { setReports(r); save("ca_reports", r); }
    if (s !== undefined) { setSession(s); save("ca_session", s); }
    if (c !== undefined) { setAccessCodes(c); save("ca_codes", c); }
  }

  // Auth
  function handleRegister() {
    setAuthError("");
    if (!authForm.name || !authForm.email || !authForm.password) { setAuthError("Completa todos los campos."); return; }
    if (users.find(u => u.email === authForm.email)) { setAuthError("El correo ya está registrado."); return; }
    if (authForm.role === "authority") {
      if (!accessCodes.find(c => c.code === authForm.accessCode && c.active)) { setAuthError("Código de acceso inválido o inactivo."); return; }
    }
    let role = authForm.role;
    if (authForm.email === SUPERADMIN_EMAIL) role = "superadmin";
    const newUser = { id: Date.now().toString(), name: authForm.name, email: authForm.email, password: authForm.password, role, createdAt: new Date().toISOString() };
    const updatedUsers = [...users, newUser];
    const s = { userId: newUser.id };
    saveAll(updatedUsers, undefined, s, undefined);
    setView("home"); setAuthForm({ name: "", email: "", password: "", role: "citizen", accessCode: "" });
  }

  function handleLogin() {
    setAuthError("");
    const u = users.find(u => u.email === authForm.email && u.password === authForm.password);
    if (!u) { setAuthError("Correo o contraseña incorrectos."); return; }
    let updatedUser = u;
    if (u.email === SUPERADMIN_EMAIL && u.role !== "superadmin") {
      updatedUser = { ...u, role: "superadmin" };
      saveAll(users.map(x => x.id === u.id ? updatedUser : x), undefined, undefined, undefined);
    }
    const s = { userId: u.id };
    saveAll(undefined, undefined, s, undefined);
    setView("home"); setAuthForm({ name: "", email: "", password: "", role: "citizen", accessCode: "" });
  }

  function handleLogout() { saveAll(undefined, undefined, null, undefined); setView("home"); }

  // Report
  function handleGetLocation() {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setReportForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5), pickPin: [pos.coords.latitude, pos.coords.longitude] })); setGettingLocation(false); },
      () => { setReportForm(f => ({ ...f, lat: MAZATLAN[0].toFixed(5), lng: MAZATLAN[1].toFixed(5), pickPin: MAZATLAN })); setGettingLocation(false); }
    );
  }

  function handlePhotoUpload(e) {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setReportForm(f => ({ ...f, photos: [...f.photos, { name: file.name, data: ev.target.result }] }));
      reader.readAsDataURL(file);
    });
  }

  function handleSubmitReport() {
    setReportError("");
    if (!reportForm.type) { setReportError("Selecciona el tipo de problema."); return; }
    if (!reportForm.lat || !reportForm.lng) { setReportError("Marca la ubicación en el mapa o usa tu GPS."); return; }
    if (reportForm.photos.length === 0) { setReportError("Agrega al menos una fotografía."); return; }
    const r = { id: Date.now().toString(), userId: currentUser.id, userName: currentUser.name, type: reportForm.type, description: reportForm.description, lat: reportForm.lat, lng: reportForm.lng, photos: reportForm.photos, status: "Sin verificar", confirmations: [], timeline: [{ action: "Reporte creado", by: currentUser.name, at: new Date().toISOString() }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    saveAll(undefined, [r, ...reports], undefined, undefined);
    setReportForm({ type: "", description: "", lat: "", lng: "", photos: [], pickPin: null });
    setReportSuccess(true);
    setTimeout(() => { setReportSuccess(false); setView("home"); }, 2000);
  }

  function handleConfirm(reportId) {
    if (!currentUser) return;
    const updated = reports.map(r => {
      if (r.id !== reportId || r.confirmations.includes(currentUser.id)) return r;
      const confs = [...r.confirmations, currentUser.id];
      const newStatus = confs.length >= 3 ? "Verificado" : r.status;
      const tl = confs.length >= 3 ? [...r.timeline, { action: "Verificado por la comunidad", by: "Sistema", at: new Date().toISOString() }] : r.timeline;
      return { ...r, confirmations: confs, status: newStatus, timeline: tl, updatedAt: new Date().toISOString() };
    });
    saveAll(undefined, updated, undefined, undefined);
    if (selectedReport?.id === reportId) setSelectedReport(updated.find(r => r.id === reportId));
  }

  function handleStatusChange(reportId, newStatus, note) {
    const updated = reports.map(r => {
      if (r.id !== reportId) return r;
      const tl = [...(r.timeline || []), { action: `Estado cambiado a "${newStatus}"${note ? `: ${note}` : ""}`, by: currentUser.name, at: new Date().toISOString() }];
      return { ...r, status: newStatus, timeline: tl, updatedAt: new Date().toISOString() };
    });
    saveAll(undefined, updated, undefined, undefined);
    if (selectedReport?.id === reportId) setSelectedReport(updated.find(r => r.id === reportId));
    setStatusNote("");
  }

  // Access codes
  function handleAddCode() {
    if (!newCode.trim()) return;
    if (accessCodes.find(c => c.code === newCode.trim())) return;
    const updated = [...accessCodes, { code: newCode.trim(), active: true, createdAt: new Date().toISOString() }];
    saveAll(undefined, undefined, undefined, updated);
    setNewCode("");
  }

  function handleToggleCode(code) {
    const updated = accessCodes.map(c => c.code === code ? { ...c, active: !c.active } : c);
    saveAll(undefined, undefined, undefined, updated);
  }

  function handleDeleteCode(code) {
    saveAll(undefined, undefined, undefined, accessCodes.filter(c => c.code !== code));
  }

  function handlePromoteUser(userId, role) {
    saveAll(users.map(u => u.id === userId ? { ...u, role } : u), undefined, undefined, undefined);
  }

  const filtered = reports.filter(r =>
    (filterType === "todos" || r.type === filterType) &&
    (filterStatus === "todos" || r.status === filterStatus)
  );

  // ─── AUTH VIEW ──────────────────────────────────────────────────────────────
  if (view === "auth") return (
    <div style={cs.app}>
      <div style={cs.header}>
        <div><span style={cs.logo}>CiudadActiva</span><span style={cs.logoSub}>Mazatlán, Sinaloa</span></div>
        <button style={cs.btn} onClick={() => setView("home")}>← Volver</button>
      </div>
      <div style={{ ...cs.section, maxWidth: 380, margin: "0 auto" }}>
        <div style={cs.tabBar}>
          <button style={cs.tab(authMode === "login")} onClick={() => { setAuthMode("login"); setAuthError(""); }}>Iniciar sesión</button>
          <button style={cs.tab(authMode === "register")} onClick={() => { setAuthMode("register"); setAuthError(""); }}>Registrarse</button>
        </div>
        {authMode === "register" && <>
          <label style={cs.label}>Nombre completo</label>
          <input style={cs.input} placeholder="Tu nombre" value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} />
          <label style={cs.label}>Tipo de cuenta</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {["citizen", "authority"].map(r => (
              <button key={r} style={{ ...cs.typeBtn(authForm.role === r), flex: 1 }} onClick={() => setAuthForm(f => ({ ...f, role: r }))}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{r === "citizen" ? "👤" : "🏛️"}</div>
                <div>{r === "citizen" ? "Ciudadano" : "Autoridad"}</div>
              </button>
            ))}
          </div>
          {authForm.role === "authority" && <>
            <label style={cs.label}>Código de acceso</label>
            <input style={cs.input} placeholder="Código proporcionado por administrador" value={authForm.accessCode} onChange={e => setAuthForm(f => ({ ...f, accessCode: e.target.value }))} />
          </>}
        </>}
        <label style={cs.label}>Correo electrónico</label>
        <input style={cs.input} placeholder="correo@ejemplo.com" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
        <label style={cs.label}>Contraseña</label>
        <input style={cs.input} type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />
        {authError && <p style={cs.error}>{authError}</p>}
        <button style={cs.btnPrimary} onClick={authMode === "login" ? handleLogin : handleRegister}>{authMode === "login" ? "Entrar" : "Crear cuenta"}</button>
      </div>
    </div>
  );

  // ─── REPORT VIEW ────────────────────────────────────────────────────────────
  if (view === "report") {
    if (reportSuccess) return (
      <div style={cs.app}><div style={cs.section}><div style={{ marginTop: "3rem", background: "#d1fae5", border: "1px solid #10b981", borderRadius: 12, padding: "1.5rem", textAlign: "center", color: "#065f46", fontSize: 15, fontWeight: 600 }}>✓ Reporte enviado<br /><span style={{ fontWeight: 400, fontSize: 13 }}>Otros ciudadanos podrán confirmarlo</span></div></div></div>
    );
    return (
      <div style={cs.app}>
        <div style={cs.header}>
          <div><span style={cs.logo}>CiudadActiva</span><span style={cs.logoSub}>Nuevo reporte</span></div>
          <button style={cs.btn} onClick={() => setView("home")}>Cancelar</button>
        </div>
        <div style={cs.section}>
          <label style={cs.label}>Tipo de problema</label>
          <div style={cs.typeGrid}>{PROBLEM_TYPES.map(pt => <button key={pt.id} style={cs.typeBtn(reportForm.type === pt.id)} onClick={() => setReportForm(f => ({ ...f, type: pt.id }))}><div style={{ fontSize: 18, marginBottom: 3 }}>{pt.icon}</div><div>{pt.label}</div></button>)}</div>
          <label style={cs.label}>Descripción (opcional)</label>
          <textarea style={{ ...cs.input, minHeight: 68, resize: "vertical" }} placeholder="Describe el problema..." value={reportForm.description} onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))} />
          <label style={cs.label}>Ubicación — toca el mapa para marcar el punto exacto</label>
          <div style={{ ...cs.mapBox, height: 280 }}>
            <MapContainer center={MAZATLAN} zoom={14} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              <LocationPicker onPick={(lat, lng) => setReportForm(f => ({ ...f, lat, lng, pickPin: [parseFloat(lat), parseFloat(lng)] }))} />
              {reportForm.pickPin && <Marker position={reportForm.pickPin} icon={createPinIcon("#6366F1")} />}
            </MapContainer>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
            {reportForm.lat
              ? <div style={{ flex: 1, fontSize: 13, color: "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px" }}>{reportForm.lat}, {reportForm.lng} <button style={{ ...cs.btn, fontSize: 11, marginLeft: 8 }} onClick={() => setReportForm(f => ({ ...f, lat: "", lng: "", pickPin: null }))}>Limpiar</button></div>
              : <button style={{ ...cs.btn, flex: 1, padding: 9 }} onClick={handleGetLocation} disabled={gettingLocation}>{gettingLocation ? "Obteniendo ubicación..." : "Usar GPS"}</button>}
          </div>
          <label style={cs.label}>Fotografías (mínimo 1)</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>{reportForm.photos.map((p, i) => <img key={i} src={p.data} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />)}</div>
          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }} />
          {reportError && <p style={cs.error}>{reportError}</p>}
          <button style={cs.btnPrimary} onClick={handleSubmitReport}>Enviar reporte</button>
        </div>
      </div>
    );
  }

  // ─── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (view === "detail" && selectedReport) {
    const r = selectedReport;
    const confirmed = currentUser && r.confirmations.includes(currentUser.id);
    const type = PROBLEM_TYPES.find(t => t.id === r.type);
    const canManage = isAuthority && ["Verificado", "En proceso"].includes(r.status);
    return (
      <div style={cs.app}>
        <div style={cs.header}>
          <div><span style={cs.logo}>CiudadActiva</span></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={cs.btn} onClick={() => { setMapCenter([parseFloat(r.lat), parseFloat(r.lng)]); setHomeTab("map"); setView("home"); }}>Ver en mapa</button>
            <button style={cs.btn} onClick={() => setView("home")}>← Regresar</button>
          </div>
        </div>
        <div style={cs.section}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>{type?.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{type?.label}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Por {r.userName} · {timeAgo(r.createdAt)}</div>
            </div>
            <span style={{ ...cs.badge(r.status), marginLeft: "auto" }}>{r.status}</span>
          </div>
          {r.description && <p style={{ fontSize: 14, color: "#374151", marginBottom: 12 }}>{r.description}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>{r.photos.map((p, i) => <img key={i} src={p.data} alt="" style={{ height: 100, width: 130, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />)}</div>
          <div style={{ ...cs.mapBox, height: 200, marginBottom: 14 }}>
            <MapContainer center={[parseFloat(r.lat), parseFloat(r.lng)]} zoom={16} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              <Marker position={[parseFloat(r.lat), parseFloat(r.lng)]} icon={createPinIcon(STATUS_CONFIG[r.status]?.pin || "#F59E0B")}>
                <Popup>{type?.icon} {type?.label}<br /><small>{r.status}</small></Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Confirmaciones */}
          <div style={{ ...cs.card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Confirmaciones ciudadanas</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>{r.confirmations.length} de 3 para verificar</div>
              <div style={{ height: 5, background: "#f3f4f6", borderRadius: 3, marginTop: 8, width: 160 }}>
                <div style={{ height: 5, background: "#2563eb", borderRadius: 3, width: `${Math.min(100, (r.confirmations.length / 3) * 100)}%`, transition: "width 0.3s" }} />
              </div>
            </div>
            {currentUser && r.userId !== currentUser.id && !isAuthority && (
              <button style={cs.confirmBtn(confirmed)} onClick={() => handleConfirm(r.id)} disabled={confirmed}>{confirmed ? "✓ Confirmado" : "Confirmar"}</button>
            )}
          </div>

          {/* Panel de autoridad */}
          {canManage && (
            <div style={{ ...cs.card, borderColor: "#a5b4fc" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🏛️ Gestión de autoridad</div>
              <label style={cs.label}>Nota de seguimiento (opcional)</label>
              <input style={cs.input} placeholder="Ej. Cuadrilla asignada para el martes..." value={statusNote} onChange={e => setStatusNote(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                {r.status !== "En proceso" && <button style={cs.btnWarning} onClick={() => handleStatusChange(r.id, "En proceso", statusNote)}>Marcar en proceso</button>}
                {r.status !== "Resuelto" && <button style={cs.btnSuccess} onClick={() => handleStatusChange(r.id, "Resuelto", statusNote)}>Marcar resuelto</button>}
              </div>
            </div>
          )}

          {/* Línea de tiempo */}
          <div style={cs.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Línea de tiempo</div>
            {(r.timeline || [{ action: "Reporte creado", by: r.userName, at: r.createdAt }]).map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, color: "#111" }}>{t.action}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{t.by} · {timeAgo(t.at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── ADMIN VIEW ─────────────────────────────────────────────────────────────
  if (view === "admin") {
    const authorityReports = reports.filter(r => ["Verificado", "En proceso"].includes(r.status));
    const resolvedReports = reports.filter(r => r.status === "Resuelto");
    const nonSuperUsers = users.filter(u => u.email !== SUPERADMIN_EMAIL);
    return (
      <div style={cs.app}>
        <div style={cs.header}>
          <div><span style={cs.logo}>CiudadActiva</span><span style={cs.logoSub}>{isSuperadmin ? "Superadmin" : "Panel de autoridad"}</span></div>
          <button style={cs.btn} onClick={() => setView("home")}>← Inicio</button>
        </div>
        <div style={cs.section}>
          <div style={cs.statsGrid}>
            <div style={cs.statCard}><span style={{ fontSize: 22, fontWeight: 700, display: "block" }}>{authorityReports.length}</span><span style={{ fontSize: 12, color: "#6b7280" }}>Pendientes</span></div>
            <div style={cs.statCard}><span style={{ fontSize: 22, fontWeight: 700, display: "block" }}>{reports.filter(r => r.status === "En proceso").length}</span><span style={{ fontSize: 12, color: "#6b7280" }}>En proceso</span></div>
            <div style={cs.statCard}><span style={{ fontSize: 22, fontWeight: 700, display: "block" }}>{resolvedReports.length}</span><span style={{ fontSize: 12, color: "#6b7280" }}>Resueltos</span></div>
          </div>

          <div style={cs.tabBar}>
            <button style={cs.tab(adminTab === "reports")} onClick={() => setAdminTab("reports")}>Reportes</button>
            {isSuperadmin && <button style={cs.tab(adminTab === "codes")} onClick={() => setAdminTab("codes")}>Códigos de acceso</button>}
            {isSuperadmin && <button style={cs.tab(adminTab === "users")} onClick={() => setAdminTab("users")}>Usuarios</button>}
          </div>

          {/* Reportes para gestionar */}
          {adminTab === "reports" && (
            authorityReports.length === 0
              ? <p style={{ color: "#6b7280", fontSize: 14 }}>No hay reportes verificados pendientes de gestión.</p>
              : authorityReports.map(r => {
                  const type = PROBLEM_TYPES.find(t => t.id === r.type);
                  return (
                    <div key={r.id} style={{ ...cs.card, cursor: "pointer" }} onClick={() => { setSelectedReport(r); setView("detail"); }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          {r.photos[0] && <img src={r.photos[0].data} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb", flexShrink: 0 }} />}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{type?.icon} {type?.label}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{r.userName} · {timeAgo(r.createdAt)}</div>
                            {r.description && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{r.description.slice(0, 60)}{r.description.length > 60 ? "..." : ""}</div>}
                          </div>
                        </div>
                        <span style={cs.badge(r.status)}>{r.status}</span>
                      </div>
                    </div>
                  );
                })
          )}

          {/* Códigos de acceso */}
          {adminTab === "codes" && isSuperadmin && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
                <input style={{ ...cs.input, marginBottom: 0, flex: 1 }} placeholder="Nuevo código de acceso" value={newCode} onChange={e => setNewCode(e.target.value)} />
                <button style={{ ...cs.btn, background: "#2563eb", color: "#fff", border: "none", whiteSpace: "nowrap" }} onClick={handleAddCode}>Agregar</button>
              </div>
              {accessCodes.length === 0
                ? <p style={{ color: "#6b7280", fontSize: 14 }}>No hay códigos creados aún.</p>
                : accessCodes.map(c => (
                    <div key={c.code} style={{ ...cs.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 14, fontFamily: "monospace" }}>{c.code}</span>
                        <span style={{ ...cs.roleBadge(c.active ? "authority" : "citizen"), marginLeft: 8 }}>{c.active ? "Activo" : "Inactivo"}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={c.active ? cs.btnDanger : cs.btnSuccess} onClick={() => handleToggleCode(c.code)}>{c.active ? "Desactivar" : "Activar"}</button>
                        <button style={cs.btnDanger} onClick={() => handleDeleteCode(c.code)}>Eliminar</button>
                      </div>
                    </div>
                  ))}
            </>
          )}

          {/* Usuarios */}
          {adminTab === "users" && isSuperadmin && (
            nonSuperUsers.length === 0
              ? <p style={{ color: "#6b7280", fontSize: 14 }}>No hay otros usuarios registrados.</p>
              : nonSuperUsers.map(u => (
                  <div key={u.id} style={{ ...cs.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{u.email}</div>
                      <span style={{ ...cs.roleBadge(u.role), marginTop: 4, display: "inline-block" }}>{u.role === "authority" ? "Autoridad" : "Ciudadano"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {u.role !== "authority" && <button style={cs.btnWarning} onClick={() => handlePromoteUser(u.id, "authority")}>Promover</button>}
                      {u.role === "authority" && <button style={cs.btnDanger} onClick={() => handlePromoteUser(u.id, "citizen")}>Degradar</button>}
                    </div>
                  </div>
                ))
          )}
        </div>
      </div>
    );
  }

  // ─── MY REPORTS ─────────────────────────────────────────────────────────────
  if (view === "myreports") {
    const myReports = reports.filter(r => r.userId === currentUser?.id);
    return (
      <div style={cs.app}>
        <div style={cs.header}>
          <div><span style={cs.logo}>CiudadActiva</span><span style={cs.logoSub}>Mis reportes</span></div>
          <button style={cs.btn} onClick={() => setView("home")}>← Inicio</button>
        </div>
        <div style={cs.section}>
          {myReports.length === 0
            ? <p style={{ color: "#6b7280", fontSize: 14 }}>No has enviado reportes aún.</p>
            : myReports.map(r => {
                const type = PROBLEM_TYPES.find(t => t.id === r.type);
                return (
                  <div key={r.id} style={{ ...cs.card, cursor: "pointer" }} onClick={() => { setSelectedReport(r); setView("detail"); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 20 }}>{type?.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{type?.label}</div>
                          <div style={{ fontSize: 12, color: "#9ca3af" }}>{timeAgo(r.createdAt)} · {r.confirmations.length} confirmaciones</div>
                        </div>
                      </div>
                      <span style={cs.badge(r.status)}>{r.status}</span>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    );
  }

  // ─── HOME ────────────────────────────────────────────────────────────────────
  return (
    <div style={cs.app}>
      <div style={cs.header}>
        <div><span style={cs.logo}>CiudadActiva</span><span style={cs.logoSub}>Mazatlán, Sinaloa</span></div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {currentUser ? <>
            {isAuthority && <button style={{ ...cs.btn, background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e" }} onClick={() => setView("admin")}>🏛️ Panel</button>}
            <button style={cs.btn} onClick={() => setView("myreports")}>Mis reportes</button>
            <button style={{ ...cs.btn, fontSize: 12, color: "#9ca3af" }} onClick={handleLogout}>Salir</button>
            {!isAuthority && <button style={{ ...cs.btn, background: "#2563eb", color: "#fff", border: "none" }} onClick={() => setView("report")}>+ Reportar</button>}
          </> : <button style={{ ...cs.btn, background: "#2563eb", color: "#fff", border: "none" }} onClick={() => setView("auth")}>Iniciar sesión</button>}
        </div>
      </div>
      <div style={cs.section}>
        {currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Hola, {currentUser.name}</p>
            <span style={cs.roleBadge(currentUser.role)}>{currentUser.role === "superadmin" ? "Superadmin" : currentUser.role === "authority" ? "Autoridad" : "Ciudadano"}</span>
          </div>
        )}
        <div style={cs.statsGrid}>
          <div style={cs.statCard}><span style={{ fontSize: 22, fontWeight: 700, display: "block" }}>{reports.length}</span><span style={{ fontSize: 12, color: "#6b7280" }}>Totales</span></div>
          <div style={cs.statCard}><span style={{ fontSize: 22, fontWeight: 700, display: "block" }}>{reports.filter(r => r.status !== "Resuelto").length}</span><span style={{ fontSize: 12, color: "#6b7280" }}>Sin resolver</span></div>
          <div style={cs.statCard}><span style={{ fontSize: 22, fontWeight: 700, display: "block" }}>{reports.filter(r => r.status === "Resuelto").length}</span><span style={{ fontSize: 12, color: "#6b7280" }}>Resueltos</span></div>
        </div>
        <div style={cs.tabBar}>
          <button style={cs.tab(homeTab === "list")} onClick={() => setHomeTab("list")}>Lista</button>
          <button style={cs.tab(homeTab === "map")} onClick={() => setHomeTab("map")}>Mapa</button>
        </div>

        {homeTab === "map" && <>
          <div style={cs.legend}>{Object.keys(STATUS_CONFIG).map(s => <div key={s} style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#6b7280" }}><div style={cs.legendDot(s)} />{s}</div>)}</div>
          <div style={{ ...cs.mapBox, height: 440 }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              {filtered.filter(r => r.lat && r.lng).map(r => (
                <Marker key={r.id} position={[parseFloat(r.lat), parseFloat(r.lng)]} icon={createPinIcon(STATUS_CONFIG[r.status]?.pin || "#F59E0B")} eventHandlers={{ click: () => { setSelectedReport(r); setView("detail"); } }}>
                  <Popup><strong>{PROBLEM_TYPES.find(t => t.id === r.type)?.icon} {PROBLEM_TYPES.find(t => t.id === r.type)?.label}</strong><br /><small>{r.status} · {timeAgo(r.createdAt)}</small></Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </>}

        {homeTab === "list" && <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <button style={cs.filterBtn(filterStatus === "todos")} onClick={() => setFilterStatus("todos")}>Todos</button>
            {Object.keys(STATUS_CONFIG).map(s => <button key={s} style={cs.filterBtn(filterStatus === s)} onClick={() => setFilterStatus(s)}>{s}</button>)}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
            <button style={cs.filterBtn(filterType === "todos")} onClick={() => setFilterType("todos")}>Todos los tipos</button>
            {PROBLEM_TYPES.map(pt => <button key={pt.id} style={cs.filterBtn(filterType === pt.id)} onClick={() => setFilterType(pt.id)}>{pt.label}</button>)}
          </div>
          {filtered.length === 0
            ? <div style={{ textAlign: "center", padding: "3rem 0", color: "#9ca3af", fontSize: 14 }}>{reports.length === 0 ? "Aún no hay reportes. ¡Sé el primero!" : "Sin resultados con estos filtros."}</div>
            : filtered.map(r => {
                const type = PROBLEM_TYPES.find(t => t.id === r.type);
                const confirmed = currentUser && r.confirmations.includes(currentUser.id);
                return (
                  <div key={r.id} style={{ ...cs.card, cursor: "pointer" }} onClick={() => { setSelectedReport(r); setView("detail"); }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      {r.photos[0] && <img src={r.photos[0].data} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb", flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{type?.icon} {type?.label}</span>
                          <span style={cs.badge(r.status)}>{r.status}</span>
                        </div>
                        {r.description && <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</p>}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>Por {r.userName} · {timeAgo(r.createdAt)}</span>
                          {!isAuthority && <button style={cs.confirmBtn(confirmed)} onClick={e => { e.stopPropagation(); if (!currentUser) { setView("auth"); return; } if (r.userId !== currentUser.id) handleConfirm(r.id); }} disabled={confirmed}>
                            {confirmed ? "✓" : "Confirmar"} {r.confirmations.length}
                          </button>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
        </>}
      </div>
    </div>
  );
}