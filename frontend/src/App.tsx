import { useState } from "react";
import { BarChart3, Settings, Scale, Sun, Moon } from "lucide-react";
import HeartScene from "./scene/HeartScene";
import { PatientForm } from "./components/PatientForm";
import { useAppStore } from "./store/useAppStore";
export default function App() {
  const { runPrediction, isLoading, predictionResult } = useAppStore(); // <-- Add this

  const [showBanner, setShowBanner] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<"LAD" | "LCX" | "RCA">("LAD");
  // State to toggle between the dashboard and the clinical input form
  const [showForm, setShowForm] = useState(false);
  // Theme Toggle State
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
  };

// Helper function to determine risk colors and labels dynamically
  const getRiskProfile = (probability = 0) => {
    const prob = Math.round(probability * 100);
    if (prob >= 70) return { prob, level: "HIGH RISK", status: "STENOTIC", badge: "REVIEW REQUIRED", color: "#D33F38" };
    if (prob >= 50) return { prob, level: "ELEVATED RISK", status: "STENOTIC", badge: "REVIEW REQUIRED", color: "#FFC145" };
    return { prob, level: "LOW RISK", status: "NORMAL", badge: "WITHIN RANGE", color: "#168A55" };
  };

  // Dynamically set overall risk (defaulting to 0 before the first prediction is run)
  const overallRisk = predictionResult 
    ? Math.round(predictionResult.predictions.Cath.probability * 100) 
    : 0;

  // Map the API results to the vessel cards
  const vessels = {
    LAD: {
      name: "LAD ARTERY", sub: "LEFT ANTERIOR DESCENDING", 
      seg: "SEG / PROX-MID", 
      conf: `CONF / ${predictionResult?.predictions.LAD.probability.toFixed(2) || '0.00'}`, 
      ...getRiskProfile(predictionResult?.predictions.LAD.probability)
    },
    LCX: {
      name: "LCX ARTERY", sub: "LEFT CIRCUMFLEX", 
      seg: "SEG / PROXIMAL", 
      conf: `CONF / ${predictionResult?.predictions.LCX.probability.toFixed(2) || '0.00'}`, 
      ...getRiskProfile(predictionResult?.predictions.LCX.probability)
    },
    RCA: {
      name: "RCX ARTERY", sub: "RIGHT CORONARY", 
      seg: "SEG / MID-DISTAL", 
      conf: `CONF / ${predictionResult?.predictions.RCA.probability.toFixed(2) || '0.00'}`, 
      ...getRiskProfile(predictionResult?.predictions.RCA.probability)
    }
  };

  const heartVessels = {
    LAD: {
      probability: vessels.LAD.prob / 100,
      label: vessels.LAD.prob >= 50 ? 1 : 0,
    },
    LCX: {
      probability: vessels.LCX.prob / 100,
      label: vessels.LCX.prob >= 50 ? 1 : 0,
    },
    RCA: {
      probability: vessels.RCA.prob / 100,
      label: vessels.RCA.prob >= 50 ? 1 : 0,
    },
  };

  const shapFeatures = [
    { name: "Typical Chest Pain", sub: "(Present)", val: "+0.42", width: "80%", dir: "pos" },
    { name: "Age", sub: "(58 yrs)", val: "-0.11", width: "25%", dir: "neg" },
    { name: "Systolic BP", sub: "(130 mmHg)", val: "+0.21", width: "45%", dir: "pos" },
    { name: "Fast Blood Sugar", sub: "(98 mg/dL)", val: "-0.15", width: "35%", dir: "neg" },
    { name: "Current Smoker", sub: "(No)", val: "-0.04", width: "10%", dir: "neg" }
  ];

  return (
    <div className="app-wrapper">
      {/* Dashboard Animation Keyframes */}
      <style>{`
        @keyframes dashboardFadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dashboard-animate {
          animation: dashboardFadeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Disclaimer */}
      {showBanner && (
        <div className="disclaimer-banner">
          <span className="disclaimer-text">⚠️ Disclaimer: For decision support and educational purposes only. Not a substitute for formal diagnostic imaging.</span>
          <button className="dismiss-button" onClick={() => setShowBanner(false)}>Dismiss</button>
        </div>
      )}

      {/* Header */}
      <header className="top-bar">
        <div className="cad-vision" onClick={() => setShowForm(false)} style={{ cursor: 'pointer' }}>
          CAD - Vision
        </div>
        <div className="nav-controls">
          <button className="nav-btn" onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? "Light" : "Dark"}
          </button>

          <button className="nav-btn" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart3 size={18} /> Load sample patient
          </button>

          {/* Toggle showForm state on click */}
          <button
            className="nav-btn"
            onClick={() => setShowForm(!showForm)}
            style={{ display: "flex", alignItems: "center", gap: "8px", borderColor: showForm ? 'var(--blue-500)' : undefined }}
          >
            <Settings size={18} /> {showForm ? "View Dashboard" : "Adjust parameters"}
          </button>

            <button
            className="nav-btn nav-btn-primary"
            onClick={runPrediction}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: isLoading ? "wait" : "pointer",
              opacity: isLoading ? 0.7 : 1
            }}
          >
            <Scale size={18} /> {isLoading ? "Running..." : "Run Prediction"}
          </button>
        </div>
      </header>

      {/* Workspace */}
      <main className="main-grid">
        {showForm ? (
          <div style={{ gridColumn: "1 / -1", padding: "20px 0" }}>
            <PatientForm />
          </div>
        ) : (
          <>
            {/* Left Canvas - 3D Heart */}
            <section className="canvas-panel dashboard-animate">
              <HeartScene
                vessels={heartVessels}
                selectedVessel={selectedVessel}
                onVesselSelect={setSelectedVessel}
              />      

              <div className="selected-overlay">
                <div
                  style={{
                    fontSize: "28px",
                    color: "#ffffff",
                    marginBottom: "8px",
                  }}
                >
                  Selected:{" "}
                  <span style={{ color: vessels[selectedVessel].color }}>
                    {vessels[selectedVessel].name}
                  </span>
                </div>

                <div style={{ fontSize: "22px", color: "#ffffff" }}>
                  Stenosis probability:{" "}
                  <span style={{ color: vessels[selectedVessel].color }}>
                    {vessels[selectedVessel].prob}%
                  </span>
                </div>
              </div>
            </section>

            {/* Right Dashboard - Added dashboard-animate class */}
            <section className="dashboard-grid dashboard-animate">

              {/* Top Panel: Gauge */}
              <div className="panel-card" style={{ paddingBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="panel-title">Overall CAD Risk</div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "56px", fontWeight: 700, lineHeight: "50px", letterSpacing: "-2px" }}>{overallRisk}%</div>
                    <div style={{ fontSize: "10px", color: "#d33f38", fontWeight: 700, letterSpacing: "1px" }}>ELEVATED RISK</div>
                  </div>
                </div>
                <div className="grid-line" style={{ margin: "16px 0" }} />

                <div style={{ position: "relative", width: "100%", maxWidth: "600px", margin: "0 auto", marginTop: "16px" }}>
                  <svg width="100%" viewBox="140 80 456 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M336.7 100.3C345.4 99 354.2 98.2 363 98L363.6 124C355.9 124.2 348.2 124.8 340.6 126L336.7 100.3Z" fill="#168A55"/>
                    <path d="M304.6 107.7C314.1 104.7 323.7 102.4 333.5 100.8L337.7 126.4C329.2 127.9 320.7 129.9 312.5 132.5L304.6 107.7Z" fill="#168A55"/>
                    <path d="M274.1 120.1C282.9 115.7 292.1 111.9 301.5 108.7L309.7 133.4C301.5 136.2 293.5 139.5 285.7 143.4L274.1 120.1Z" fill="#168A55"/>
                    <path d="M245.9 137.1C253.9 131.3 262.4 126.2 271.1 121.6L283.1 144.7C275.4 148.7 268 153.2 261 158.2L245.9 137.1Z" fill="#168A55"/>
                    <path d="M223 156C229.4 149.9 236.1 144.3 243.2 139L258.6 159.9C252.4 164.5 246.5 169.5 240.9 174.8L223 156Z" fill="#168A55"/>
                    <path d="M199 183.2C204.3 176.1 209.9 169.4 216 163L234.8 180.9C229.5 186.5 224.5 192.4 219.9 198.6L199 183.2Z" fill="#168A55"/>
                    <path d="M181.6 211.1C186.2 202.4 191.3 193.9 197.1 185.9L218.2 201C213.2 208 208.7 215.4 204.7 223.1L181.6 211.1Z" fill="#168A55"/>
                    <path d="M168.7 241.5C171.9 232.1 175.7 222.9 180.1 214.1L203.4 225.7C199.5 233.5 196.2 241.5 193.4 249.7L168.7 241.5Z" fill="#168A55"/>
                    <path d="M160.8 273.5C162.4 263.7 164.7 254.1 167.7 244.6L192.5 252.5C189.9 260.7 187.9 269.2 186.4 277.7L160.8 273.5Z" fill="#168A55"/>
                    <path d="M158 303C158.2 294.2 159 285.4 160.3 276.7L186 280.6C184.8 288.2 184.2 295.9 184 303.6L158 303Z" fill="#168A55"/>

                    <path d="M575.6 276.7C576.9 285.4 577.7 294.2 577.9 303L551.9 303.6C551.7 295.9 551.1 288.2 549.9 280.6L575.6 276.7Z" fill="#D33F38"/>
                    <path d="M568.2 244.6C571.2 254.1 573.5 263.7 575.1 273.5L549.5 277.7C548 269.2 546 260.7 543.4 252.5L568.2 244.6Z" fill="#D33F38"/>
                    <path d="M555.8 214.1C560.2 222.9 564 232.1 567.2 241.5L542.5 249.7C539.7 241.5 536.4 233.5 532.5 225.7L555.8 214.1Z" fill="#D33F38"/>
                    <path d="M538.8 185.9C544.6 193.9 549.7 202.4 554.3 211.1L531.2 223.1C527.2 215.4 522.7 208 517.7 201L538.8 185.9Z" fill="#D33F38"/>
                    <path d="M519.9 163C526 169.4 531.6 176.1 536.9 183.2L516 198.6C511.4 192.4 506.4 186.5 501.1 180.9L519.9 163Z" fill="#D33F38"/>
                    <path d="M492.7 139C499.8 144.3 506.5 149.9 512.9 156L495 174.8C489.4 169.5 483.5 164.5 477.3 159.9L492.7 139Z" fill="#D33F38"/>
                    <path d="M464.8 121.6C473.5 126.2 482 131.3 490 137.1L474.9 158.2C467.9 153.2 460.5 148.7 452.8 144.7L464.8 121.6Z" fill="#D33F38"/>
                    <path d="M434.4 108.7C443.8 111.9 453 115.7 461.8 120.1L450.2 143.4C442.4 139.5 434.4 136.2 426.2 133.4L434.4 108.7Z" fill="#D33F38"/>
                    <path d="M402.4 100.8C412.2 102.4 421.8 104.7 431.3 107.7L423.4 132.5C415.2 129.9 406.7 127.9 398.2 126.4L402.4 100.8Z" fill="#D33F38"/>
                    <path d="M372.9 98C381.7 98.2 390.5 99 399.2 100.3L395.3 126C387.7 124.8 380 124.2 372.3 124L372.9 98Z" fill="#D33F38"/>

                    <path d="M468.6 155.4L470.1 164.7L383.6 289.3L459.5 158L468.6 155.4Z" fill="#FFC145" stroke="var(--text-primary)" strokeWidth="1.5"/>
                    <circle cx="368" cy="308" r="15.5" fill="var(--text-primary)" />
                    <circle cx="368" cy="308" r="6" fill="#FFC145"/>

                    <text x="223" y="300" textAnchor="middle" fontSize="13" fill="var(--text-primary)" fontWeight="700">0%</text>
                    <text x="265" y="205" textAnchor="middle" fontSize="13" fill="var(--text-primary)" fontWeight="700">25</text>
                    <text x="368" y="163" textAnchor="middle" fontSize="13" fill="var(--text-primary)" fontWeight="700">50</text>
                    <text x="471" y="205" textAnchor="middle" fontSize="13" fill="var(--text-primary)" fontWeight="700">75</text>
                    <text x="513" y="300" textAnchor="middle" fontSize="13" fill="var(--text-primary)" fontWeight="700">100%</text>
                  </svg>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0px", fontSize: "12px", fontWeight: 700 }}>
                  <span style={{ color: "#168A55" }}>— LOW RISK</span>
                  <span style={{ color: "#D33F38" }}>HIGH RISK —</span>
                </div>
              </div>

              {/* Middle Panel: Vessel Cards */}
              <div className="vessels-row">
                {(["LAD", "LCX", "RCA"] as const).map((key) => {
                  const v = vessels[key];
                  const isActive = selectedVessel === key;
                  return (
                    <div key={key} className="vessel-card" onClick={() => setSelectedVessel(key)}
                      style={{
                        border: isActive ? `2px solid ${v.color}` : `none`,
                        backgroundColor: isActive ? "var(--bg-active)" : "var(--bg-panel)"
                      }}>
                      <div className="tech-rail" style={{ backgroundColor: v.color }}></div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "28px", fontWeight: 700 }}>{v.name}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 700 }}>{v.sub}</div>
                        </div>
                      </div>

                      <div className="grid-line"></div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                          <span style={{ fontSize: "56px", fontWeight: 700, lineHeight: 1 }}>{v.prob}</span>
                          <span style={{ fontSize: "24px", color: v.color }}>%</span>
                        </div>
                        <div style={{ textAlign: "right", fontSize: "10px", color: "var(--text-secondary)" }}>
                          <div style={{ color: v.color, fontWeight: 700, textTransform: "uppercase" }}>{v.level}</div>
                          <div>{v.seg}</div>
                          <div>{v.conf}</div>
                        </div>
                      </div>

                      <div className="grid-line"></div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: v.color }}></div>
                          <span style={{ color: v.color }}>{v.status}</span>
                        </div>
                        <span>{v.badge}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Panel: SHAP Feature Importance */}
              <div className="panel-card" style={{ flex: 1 }}>
                <div className="panel-title">SHAP Analysis</div>
                <div className="grid-line" style={{ margin: "16px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#168a55", fontWeight: 700, marginBottom: "16px" }}>
                  <span>← DECREASES RISK</span>
                  <span style={{ color: "#d33f38" }}>INCREASES RISK →</span>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
                  <div style={{ position: "absolute", left: "calc(160px + 50% - 4px)", top: "-18px", fontSize: "12px", fontWeight: 700 }}>0</div>

                  {shapFeatures.map((f, i) => (
                    <div key={i} className="shap-row">
                      <div className="shap-label">
                        {f.name}
                        <span className="shap-sub">{f.sub}</span>
                      </div>

                      <div className="shap-track">
                        <div className="shap-neg-container">
                          {f.dir === "neg" && (
                            <>
                              <span style={{ fontSize: "12px", color: "#168a55" }}>{f.val}</span>
                              <div className="shap-bar shap-bar-neg" style={{ width: f.width }} />
                            </>
                          )}
                        </div>

                        <div className="shap-pos-container">
                          {f.dir === "pos" && (
                            <>
                              <div className="shap-bar shap-bar-pos" style={{ width: f.width }} />
                              <span style={{ fontSize: "12px", color: "#d33f38" }}>{f.val}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid-line" style={{ margin: "16px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)" }}>
                  <span>SHAP values based on XGBoost model output · Positive = Increases predicted stenosis probability</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>BASE: 0.50</span>
                </div>
              </div>

            </section>
          </>
        )}
      </main>
    </div>
  );
}