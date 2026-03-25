
import { useState, useCallback, useRef, useEffect } from "react";

const DEFAULT_API = import.meta.env.VITE_BACKEND_URL;

// ─── tiny style injector (runs once) ─────────────────────────────────────────
let _stylesInjected = false;
function injectStyles() {
  if (_stylesInjected || typeof document === "undefined") return;
  _stylesInjected = true;
  const el = document.createElement("style");
  el.textContent = STYLES;
  document.head.appendChild(el);
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function getStoredToken() {
  try {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("access_token") ||
      ""
    );
  } catch { return ""; }
}

const STEPS = ["Upload", "Preview", "Confirm", "Done"];

// ─── main export ──────────────────────────────────────────────────────────────
export default function PeopleImportFAB({
  onImportComplete,
  token: propToken,
  apiBase = DEFAULT_API,
  disabled = false,
}) {
  injectStyles();

  const [open,      setOpen]      = useState(false);
  const [step,      setStep]      = useState(0);
  const [file,      setFile]      = useState(null);
  const [dragOver,  setDragOver]  = useState(false);
  const [org,       setOrg]       = useState("");
  const [dryRun,    setDryRun]    = useState(false);
  const [preview,   setPreview]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [results,   setResults]   = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [error,     setError]     = useState("");

  const inputRef  = useRef(null);
  const overlayRef = useRef(null);

  const token = propToken || getStoredToken();
  const authH = token ? { Authorization: `Bearer ${token}` } : {};

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleClose() {
    setOpen(false);
    // small delay so animation finishes before state reset
    setTimeout(reset, 300);
  }

  function reset() {
    setStep(0); setFile(null); setPreview(null); setResults(null);
    setError(""); setProgress(0); setFilter("all"); setDragOver(false);
  }

  // ── file pick ───────────────────────────────────────────────────────────────
  function pickFile(f) {
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setError("Please upload a .xlsx, .xls, or .csv file.");
      return;
    }
    setFile(f);
    setPreview(null);
    setResults(null);
    setError("");
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);

  // ── Step 0 → 1 : column preview ─────────────────────────────────────────────
  async function fetchPreview() {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch(`${apiBase}/people/import/preview-columns`, {
        method: "POST", headers: authH, body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Preview failed");
      setPreview(data);
      setStep(1);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  // ── Step 2 → 3 : import ──────────────────────────────────────────────────────
  async function runImport() {
    if (!file) return;
    setLoading(true); setProgress(15); setError("");
    try {
      const form   = new FormData();
      form.append("file", file);
      const params = new URLSearchParams();
      if (org)    params.set("organization", org);
      if (dryRun) params.set("dry_run", "true");

      setProgress(40);
      const res  = await fetch(`${apiBase}/people/import/spreadsheet?${params}`, {
        method: "POST", headers: authH, body: form,
      });
      setProgress(85);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Import failed");
      setProgress(100);
      setResults(data);
      setStep(3);
      
      // ALWAYS call onImportComplete after import completes
      // This ensures the UI refreshes after both dry run and live import
      if (onImportComplete && !dryRun) {
        console.log("Import complete, refreshing people data...");
        // Add a small delay to ensure the backend has processed everything
        setTimeout(() => {
          onImportComplete();
        }, 500);
      }
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  }

  // ── filtered result rows ─────────────────────────────────────────────────────
  const rows     = results?.rows || [];
  const filtered =
    filter === "all"      ? rows
    : filter === "ok"     ? rows.filter(r => r.status === "inserted" || r.status === "would_insert")
    : filter === "skip"   ? rows.filter(r => r.status === "skipped")
    : rows.filter(r => r.status === "error");

  const rowIcon = (s) =>
    s === "inserted" || s === "would_insert" ? "✅"
    : s === "skipped" ? "⏭️" : "❌";

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── FAB ── */}
      <button
        className="pifab-btn"
        onClick={() => setOpen(true)}
        title="Import people from spreadsheet"
        disabled={disabled}
        style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <span className="pifab-icon">⬆</span>
        <span className="pifab-label">Import</span>
      </button>

      {/* ── Overlay ── */}
      {open && (
        <div
          ref={overlayRef}
          className="pifab-overlay"
          onClick={(e) => e.target === overlayRef.current && handleClose()}
        >
          <div className={`pifab-modal ${open ? "pifab-modal--in" : ""}`}>

            {/* modal header */}
            <div className="pifab-modal-header">
              <div className="pifab-modal-title">
                <span className="pifab-modal-icon">📥</span>
                <div>
                  <div className="pifab-modal-heading">Import People</div>
                  <div className="pifab-modal-sub">Upload a spreadsheet — hierarchy auto-resolved</div>
                </div>
              </div>
              <button className="pifab-close" onClick={handleClose}>✕</button>
            </div>

            {/* step rail */}
            <div className="pifab-steps">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className={`pifab-step ${i === step ? "pifab-step--active" : i < step ? "pifab-step--done" : ""}`}
                >
                  <div className="pifab-step-dot">
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* modal body */}
            <div className="pifab-body">

              {/* global error */}
              {error && (
                <div className="pifab-alert pifab-alert--warn">⚠️ {error}</div>
              )}

              {/* ── STEP 0: Upload ── */}
              {step === 0 && (
                <div className="pifab-section">
                  {/* drop zone */}
                  <div
                    className={`pifab-drop ${dragOver ? "pifab-drop--over" : ""} ${file ? "pifab-drop--chosen" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => !file && inputRef.current?.click()}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: "none" }}
                      onChange={e => e.target.files[0] && pickFile(e.target.files[0])}
                    />
                    <div className="pifab-drop-icon">{file ? "📊" : "☁️"}</div>
                    <div className="pifab-drop-title">
                      {file ? "File ready!" : "Drag & drop your spreadsheet"}
                    </div>
                    <div className="pifab-drop-sub">
                      {file ? "Click 'Preview Columns' below" : "or click to browse"}
                    </div>
                    <div className="pifab-chips">
                      {[".xlsx", ".xls", ".csv"].map(c => (
                        <span key={c} className="pifab-chip">{c}</span>
                      ))}
                    </div>
                  </div>

                  {/* chosen file pill */}
                  {file && (
                    <div className="pifab-filepill">
                      <span className="pifab-filepill-icon">📄</span>
                      <div>
                        <div className="pifab-filepill-name">{file.name}</div>
                        <div className="pifab-filepill-size">{fmtBytes(file.size)}</div>
                      </div>
                      <button
                        className="pifab-filepill-rm"
                        onClick={() => { setFile(null); inputRef.current && (inputRef.current.value = ""); }}
                      >✕</button>
                    </div>
                  )}

                  {/* org override */}
                  <div className="pifab-field">
                    <label>Override organization <span className="pifab-optional">(optional)</span></label>
                    <input
                      value={org}
                      onChange={e => setOrg(e.target.value)}
                      placeholder="e.g. Active Church"
                    />
                  </div>

                  {/* dry run toggle */}
                  <div
                    className="pifab-toggle"
                    onClick={() => setDryRun(v => !v)}
                  >
                    <div className={`pifab-toggle-track ${dryRun ? "on" : ""}`}>
                      <div className="pifab-toggle-knob" />
                    </div>
                    <span>Dry run — preview only, nothing saved</span>
                    {dryRun && <span className="pifab-badge pifab-badge--warn">Active</span>}
                  </div>
                </div>
              )}

              {/* ── STEP 1: Column preview ── */}
              {step === 1 && preview && (
                <div className="pifab-section">
                  <div className="pifab-alert pifab-alert--info">
                    ℹ️ {preview.column_mapping?.filter(c => c.status === "mapped").length} columns mapped,{" "}
                    {preview.column_mapping?.filter(c => c.status === "ignored").length} ignored
                    · {preview.total_rows} rows detected
                  </div>

                  {/* mapping table */}
                  <div className="pifab-table-wrap">
                    <table className="pifab-table">
                      <thead>
                        <tr>
                          <th>Spreadsheet column</th>
                          <th></th>
                          <th>Internal field</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(preview.column_mapping || []).map((cm, i) => (
                          <tr key={i}>
                            <td><code className="pifab-code">{cm.original}</code></td>
                            <td className="pifab-arrow">→</td>
                            <td>
                              {cm.maps_to
                                ? <code className="pifab-code pifab-code--blue">{cm.maps_to}</code>
                                : <span className="pifab-muted">—</span>}
                            </td>
                            <td>
                              <span className={`pifab-badge ${cm.status === "mapped" ? "pifab-badge--green" : "pifab-badge--muted"}`}>
                                {cm.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* sample rows */}
                  {(preview.sample_rows || []).length > 0 && (
                    <>
                      <div className="pifab-section-label">Sample data (first 3 rows)</div>
                      <div className="pifab-table-wrap">
                        <table className="pifab-table pifab-table--mono">
                          <thead>
                            <tr>
                              {Object.keys(preview.sample_rows[0]).map(k => (
                                <th key={k}>{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.sample_rows.map((row, ri) => (
                              <tr key={ri}>
                                {Object.values(row).map((v, ci) => (
                                  <td key={ci} title={String(v ?? "")}>
                                    {String(v ?? "—").slice(0, 28)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── STEP 2: Confirm ── */}
              {step === 2 && (
                <div className="pifab-section">
                  <div className="pifab-summary-grid">
                    {[
                      { label: "Rows",         value: preview?.total_rows ?? "?",       color: "#79c0ff" },
                      { label: "File",          value: file?.name ?? "—",                color: "#e6edf3", small: true },
                      { label: "Organization",  value: org || "From file",               color: org ? "#3fb950" : "#8b949e" },
                      { label: "Mode",          value: dryRun ? "DRY RUN" : "LIVE",     color: dryRun ? "#d29922" : "#3fb950" },
                    ].map(s => (
                      <div key={s.label} className="pifab-summary-card">
                        <div className="pifab-summary-val" style={{ color: s.color, fontSize: s.small ? 13 : undefined }}>
                          {s.value}
                        </div>
                        <div className="pifab-summary-lab">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="pifab-alert pifab-alert--info">
                    ℹ️ <strong>InvitedBy</strong> names are matched against the People database to
                    resolve <strong>LeaderId</strong> &amp; <strong>LeaderPath</strong> as ObjectIds —
                    identical to manual signup.
                  </div>

                  {dryRun && (
                    <div className="pifab-alert pifab-alert--warn">
                      ⚠️ Dry run ON — no records will be written.
                    </div>
                  )}

                  {loading && (
                    <div className="pifab-progress">
                      <div className="pifab-progress-bar">
                        <div className="pifab-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="pifab-progress-label">Importing… {progress}%</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 3: Results ── */}
              {step === 3 && results && (
                <div className="pifab-section">
                  {/* stat pills */}
                  <div className="pifab-stat-row">
                    {[
                      { n: results.total_rows, l: "Total",    c: "#79c0ff" },
                      { n: results.inserted,   l: results.dry_run ? "Preview" : "Inserted", c: "#3fb950" },
                      { n: results.skipped,    l: "Skipped",  c: "#d29922" },
                      { n: results.errors,     l: "Errors",   c: "#da3633" },
                    ].map(s => (
                      <div key={s.l} className="pifab-stat">
                        <div className="pifab-stat-num" style={{ color: s.c }}>{s.n}</div>
                        <div className="pifab-stat-lab">{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {!results.dry_run && results.inserted > 0 && (
                    <div className="pifab-alert pifab-alert--success">
                      ✅ {results.inserted} people imported with LeaderPath resolved.
                    </div>
                  )}

                  {results.dry_run && (
                    <div className="pifab-alert pifab-alert--warn">
                      Dry run complete. Disable dry run and re-import to save.
                    </div>
                  )}

                  {/* filter tabs */}
                  <div className="pifab-filters">
                    {[
                      { k: "all",  l: `All (${rows.length})` },
                      { k: "ok",   l: `✅ ${results.dry_run ? "Preview" : "Inserted"} (${results.inserted})` },
                      { k: "skip", l: `⏭ Skipped (${results.skipped})` },
                      { k: "err",  l: `❌ Errors (${results.errors})` },
                    ].map(f => (
                      <button
                        key={f.k}
                        className={`pifab-filter-btn ${filter === f.k ? "active" : ""}`}
                        onClick={() => setFilter(f.k)}
                      >{f.l}</button>
                    ))}
                  </div>

                  {/* row list */}
                  <div className="pifab-rows">
                    {filtered.length === 0
                      ? <div className="pifab-empty">No rows match.</div>
                      : filtered.map((r, i) => (
                        <div key={i} className="pifab-row">
                          <span className="pifab-row-icon">{rowIcon(r.status)}</span>
                          <div className="pifab-row-info">
                            <div className="pifab-row-name">
                              {r.person || "—"}
                              {r.email && <span className="pifab-row-email"> · {r.email}</span>}
                              <span className="pifab-chip" style={{ marginLeft: 6 }}>row {r.row}</span>
                            </div>
                            {(r.leader_path?.length > 0) && (
                              <div className="pifab-lpath">
                                {r.leader_path.map((lp, li) => (
                                  <span key={li}>
                                    {li > 0 && <span className="pifab-lpath-sep">›</span>}
                                    <span className="pifab-lpath-node">{lp.slice(-8)}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {r.reason && <div className="pifab-row-reason">⚠️ {r.reason}</div>}
                            {r.error  && <div className="pifab-row-reason">❌ {r.error}</div>}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            {/* modal footer */}
            <div className="pifab-footer">
              {step === 0 && (
                <>
                  <button className="pifab-btn-secondary" onClick={handleClose}>Cancel</button>
                  <button
                    className="pifab-btn-primary"
                    onClick={fetchPreview}
                    disabled={!file || loading}
                  >
                    {loading ? <><span className="pifab-spinner" /> Analysing…</> : "Preview Columns →"}
                  </button>
                </>
              )}

              {step === 1 && (
                <>
                  <button className="pifab-btn-secondary" onClick={() => setStep(0)}>← Back</button>
                  <button className="pifab-btn-primary" onClick={() => setStep(2)}>
                    Continue →
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <button className="pifab-btn-secondary" onClick={() => setStep(1)} disabled={loading}>
                    ← Back
                  </button>
                  <button
                    className="pifab-btn-primary"
                    onClick={runImport}
                    disabled={loading}
                  >
                    {loading
                      ? <><span className="pifab-spinner" /> Importing…</>
                      : dryRun ? "🧪 Run Dry Import" : "⬆️ Import People"}
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  <button className="pifab-btn-secondary" onClick={reset}>Import Another</button>
                  {results?.dry_run && (
                    <button
                      className="pifab-btn-primary"
                      onClick={() => { setDryRun(false); setStep(2); setResults(null); }}
                    >
                      🚀 Run Live Import
                    </button>
                  )}
                  {!results?.dry_run && (
                    <button className="pifab-btn-primary" onClick={handleClose}>Done ✓</button>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}

// ─── styles (scoped with pifab- prefix) ──────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Sora:wght@400;600;700&display=swap');

/* ── FAB ── */
.pifab-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 22px;
  background: linear-gradient(135deg, #1f6feb 0%, #238636 100%);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-family: 'Sora', sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(31,111,235,0.45), 0 2px 8px rgba(0,0,0,0.3);
  transition: transform .18s, box-shadow .18s;
  letter-spacing: .3px;
}
.pifab-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 32px rgba(31,111,235,0.55), 0 4px 12px rgba(0,0,0,0.3);
}
.pifab-btn:active { transform: scale(.97); }
.pifab-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.pifab-icon { font-size: 16px; }

/* ── Overlay ── */
.pifab-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(1,4,9,0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0 0 0;
  animation: pifab-fade-in .2s ease;
  background: rgba(0, 0, 0, 0.5);
}
@keyframes pifab-fade-in { from { opacity: 0; } to { opacity: 1; } }

/* ── Modal ── */
.pifab-modal {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: scale(0.96);
  opacity: 0;
  transition: transform .28s cubic-bezier(.22,.68,0,1.2), opacity .2s ease;
}
.pifab-modal--in {
  transform: scale(1);
  opacity: 1;
}

/* ── Header ── */
.pifab-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #30363d;
  flex-shrink: 0;
}
.pifab-modal-title {
  display: flex;
  align-items: center;
  gap: 14px;
}
.pifab-modal-icon {
  font-size: 28px;
  width: 46px; height: 46px;
  background: linear-gradient(135deg, #1f6feb22, #23863622);
  border: 1px solid #30363d;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.pifab-modal-heading {
  font-family: 'Sora', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #e6edf3;
}
.pifab-modal-sub {
  font-family: 'Sora', sans-serif;
  font-size: 12px;
  color: #8b949e;
  margin-top: 2px;
}
.pifab-close {
  background: none;
  border: none;
  color: #8b949e;
  font-size: 20px;
  cursor: pointer;
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s;
  line-height: 1;
}
.pifab-close:hover { background: #21262d; color: #e6edf3; }

/* ── Steps ── */
.pifab-steps {
  display: flex;
  padding: 12px 24px;
  gap: 0;
  border-bottom: 1px solid #30363d;
  flex-shrink: 0;
}
.pifab-step {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Sora', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #8b949e;
  position: relative;
}
.pifab-step::after {
  content: '';
  position: absolute;
  right: 0; top: 50%;
  transform: translateY(-50%);
  width: 20px; height: 1px;
  background: #30363d;
}
.pifab-step:last-child::after { display: none; }
.pifab-step--active { color: #e6edf3; }
.pifab-step--done   { color: #3fb950; }
.pifab-step-dot {
  width: 20px; height: 20px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
  flex-shrink: 0;
}
.pifab-step--done .pifab-step-dot   { background: #238636; border-color: #238636; color: #fff; }
.pifab-step--active .pifab-step-dot { background: #1f6feb; border-color: #1f6feb; color: #fff; }

/* ── Body ── */
.pifab-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  scrollbar-width: thin;
  scrollbar-color: #30363d transparent;
}
.pifab-body::-webkit-scrollbar { width: 4px; }
.pifab-body::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }

.pifab-section { display: flex; flex-direction: column; gap: 14px; }

/* ── Drop zone ── */
.pifab-drop {
  border: 2px dashed #30363d;
  border-radius: 12px;
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color .18s, background .18s;
}
.pifab-drop:hover        { border-color: #388bfd; background: rgba(31,111,235,0.04); }
.pifab-drop--over        { border-color: #388bfd; background: rgba(31,111,235,0.08); }
.pifab-drop--chosen      { border-color: #238636; background: rgba(35,134,54,0.04); cursor: default; }
.pifab-drop-icon         { font-size: 36px; margin-bottom: 10px; }
.pifab-drop-title        { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600; color: #e6edf3; }
.pifab-drop-sub          { font-size: 12px; color: #8b949e; margin-top: 4px; }
.pifab-chips             { display: flex; gap: 6px; justify-content: center; margin-top: 12px; flex-wrap: wrap; }
.pifab-chip              {
  background: #21262d; border: 1px solid #30363d;
  border-radius: 5px; padding: 2px 8px;
  font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #8b949e;
}

/* ── File pill ── */
.pifab-filepill {
  display: flex; align-items: center; gap: 10px;
  background: #21262d; border: 1px solid #30363d;
  border-radius: 8px; padding: 10px 14px;
}
.pifab-filepill-icon { font-size: 22px; }
.pifab-filepill-name { font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; color: #e6edf3; }
.pifab-filepill-size { font-size: 11px; color: #8b949e; margin-top: 1px; }
.pifab-filepill-rm   {
  margin-left: auto; background: none; border: none;
  color: #8b949e; cursor: pointer; font-size: 16px; line-height: 1;
  transition: color .15s;
}
.pifab-filepill-rm:hover { color: #da3633; }

/* ── Field ── */
.pifab-field { display: flex; flex-direction: column; gap: 5px; }
.pifab-field label {
  font-family: 'Sora', sans-serif;
  font-size: 11px; font-weight: 600;
  color: #8b949e; text-transform: uppercase; letter-spacing: .5px;
}
.pifab-optional { font-weight: 400; text-transform: none; letter-spacing: 0; }
.pifab-field input {
  background: #0d1117; border: 1px solid #30363d; border-radius: 7px;
  padding: 8px 11px; color: #e6edf3;
  font-family: 'Sora', sans-serif; font-size: 13px; outline: none;
  transition: border-color .15s;
}
.pifab-field input:focus { border-color: #1f6feb; }

/* ── Toggle ── */
.pifab-toggle {
  display: flex; align-items: center; gap: 10px;
  background: #0d1117; border: 1px solid #30363d; border-radius: 8px;
  padding: 10px 14px; cursor: pointer; user-select: none;
  font-family: 'Sora', sans-serif; font-size: 13px; color: #e6edf3;
  transition: border-color .15s;
}
.pifab-toggle:hover { border-color: #8b949e; }
.pifab-toggle-track {
  width: 34px; height: 18px; background: #30363d;
  border-radius: 9px; position: relative; transition: background .2s; flex-shrink: 0;
}
.pifab-toggle-track.on { background: #238636; }
.pifab-toggle-knob {
  position: absolute; top: 2px; left: 2px;
  width: 14px; height: 14px; background: #fff;
  border-radius: 50%; transition: transform .2s;
}
.pifab-toggle-track.on .pifab-toggle-knob { transform: translateX(16px); }

/* ── Alerts ── */
.pifab-alert {
  padding: 10px 14px; border-radius: 8px;
  font-family: 'Sora', sans-serif; font-size: 12px; line-height: 1.5;
}
.pifab-alert--warn    { background: rgba(210,153,34,0.1);  border: 1px solid rgba(210,153,34,0.3); color: #d29922; }
.pifab-alert--info    { background: rgba(31,111,235,0.08); border: 1px solid rgba(31,111,235,0.2); color: #79c0ff; }
.pifab-alert--success { background: rgba(35,134,54,0.1);   border: 1px solid rgba(35,134,54,0.3);  color: #3fb950; }

/* ── Table ── */
.pifab-table-wrap { overflow-x: auto; border: 1px solid #30363d; border-radius: 8px; }
.pifab-table { width: 100%; border-collapse: collapse; font-family: 'Sora', sans-serif; font-size: 12px; }
.pifab-table th {
  background: #0d1117; padding: 7px 10px; text-align: left;
  color: #8b949e; font-size: 10px; text-transform: uppercase;
  letter-spacing: .5px; border-bottom: 1px solid #30363d; white-space: nowrap;
}
.pifab-table td {
  padding: 7px 10px; border-bottom: 1px solid rgba(48,54,61,.4);
  color: #e6edf3; white-space: nowrap;
  max-width: 200px; overflow: hidden; text-overflow: ellipsis;
}
.pifab-table tr:last-child td { border-bottom: none; }
.pifab-table--mono td, .pifab-table--mono th { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
.pifab-arrow { color: #8b949e; text-align: center; }
.pifab-muted { color: #8b949e; }
.pifab-code {
  background: #21262d; border: 1px solid #30363d; border-radius: 4px;
  padding: 1px 6px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #e6edf3;
}
.pifab-code--blue { background: rgba(31,111,235,0.12); color: #79c0ff; border-color: rgba(31,111,235,0.2); }
.pifab-section-label {
  font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 600;
  color: #8b949e; text-transform: uppercase; letter-spacing: .5px; margin-top: 4px;
}

/* ── Badges ── */
.pifab-badge {
  display: inline-flex; align-items: center;
  padding: 2px 7px; border-radius: 4px;
  font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
}
.pifab-badge--green { background: rgba(35,134,54,0.2);   color: #3fb950; }
.pifab-badge--muted { background: rgba(139,148,158,0.1); color: #8b949e; }
.pifab-badge--warn  { background: rgba(210,153,34,0.15); color: #d29922; }

/* ── Summary grid (step 2) ── */
.pifab-summary-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
}
.pifab-summary-card {
  background: #0d1117; border: 1px solid #30363d; border-radius: 8px;
  padding: 12px; text-align: center;
}
.pifab-summary-val {
  font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700;
  line-height: 1; margin-bottom: 4px; word-break: break-all;
}
.pifab-summary-lab {
  font-family: 'Sora', sans-serif; font-size: 10px; color: #8b949e;
  text-transform: uppercase; letter-spacing: .5px;
}

/* ── Progress ── */
.pifab-progress { margin: 4px 0; }
.pifab-progress-bar {
  height: 5px; background: #30363d; border-radius: 3px; overflow: hidden; margin-bottom: 6px;
}
.pifab-progress-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, #1f6feb, #238636);
  transition: width .3s ease;
}
.pifab-progress-label { font-family: 'Sora', sans-serif; font-size: 11px; color: #8b949e; }

/* ── Stat row ── */
.pifab-stat-row {
  display: flex; gap: 12px;
}
.pifab-stat {
  flex: 1; background: #0d1117; border: 1px solid #30363d;
  border-radius: 8px; padding: 12px; text-align: center;
}
.pifab-stat-num {
  font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 700; line-height: 1;
}
.pifab-stat-lab {
  font-family: 'Sora', sans-serif; font-size: 10px; color: #8b949e;
  text-transform: uppercase; letter-spacing: .5px; margin-top: 3px;
}

/* ── Filter tabs ── */
.pifab-filters { display: flex; gap: 6px; flex-wrap: wrap; }
.pifab-filter-btn {
  padding: 4px 12px; border-radius: 20px;
  border: 1px solid #30363d; background: #21262d;
  color: #8b949e; font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.pifab-filter-btn.active { background: #1f6feb; border-color: #1f6feb; color: #fff; }

/* ── Result rows ── */
.pifab-rows { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.pifab-rows::-webkit-scrollbar { width: 3px; }
.pifab-rows::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
.pifab-row {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 6px 8px; border-radius: 6px; font-family: 'Sora', sans-serif; font-size: 12px;
  transition: background .1s;
}
.pifab-row:hover { background: rgba(255,255,255,0.03); }
.pifab-row-icon  { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
.pifab-row-info  { flex: 1; min-width: 0; }
.pifab-row-name  { font-weight: 600; color: #e6edf3; }
.pifab-row-email { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
.pifab-row-reason { font-size: 11px; color: #d29922; margin-top: 2px; }

/* ── Leader path ── */
.pifab-lpath { display: flex; align-items: center; gap: 3px; flex-wrap: wrap; margin-top: 3px; }
.pifab-lpath-node {
  font-size: 10px; font-family: 'JetBrains Mono', monospace;
  background: rgba(31,111,235,0.1); color: #79c0ff;
  padding: 1px 6px; border-radius: 3px;
}
.pifab-lpath-sep { color: #8b949e; font-size: 10px; }
.pifab-empty { text-align: center; padding: 28px; color: #8b949e; font-family: 'Sora', sans-serif; font-size: 13px; }

/* ── Footer ── */
.pifab-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 24px; border-top: 1px solid #30363d; flex-shrink: 0;
  background: #161b22;
}
.pifab-btn-primary {
  padding: 8px 18px; border-radius: 7px;
  background: #238636; border: 1px solid #238636; color: #fff;
  font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background .15s;
}
.pifab-btn-primary:hover:not(:disabled) { background: #2ea043; }
.pifab-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
.pifab-btn-secondary {
  padding: 8px 18px; border-radius: 7px;
  background: #21262d; border: 1px solid #30363d; color: #e6edf3;
  font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background .15s;
}
.pifab-btn-secondary:hover { background: #2d333b; }

/* ── Spinner ── */
.pifab-spinner {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff; border-radius: 50%;
  animation: pifab-spin .65s linear infinite;
}
@keyframes pifab-spin { to { transform: rotate(360deg); } }
`;

// Add this to support the disabled prop
if (typeof window !== 'undefined') {
  window.PeopleImportFAB = PeopleImportFAB;
}