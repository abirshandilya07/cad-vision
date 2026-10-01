import HeartScene from "./scene/HeartScene";
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
type Pred = { probability: number; label: number };
type Result = { cad: Pred; vessels: Record<"LAD" | "LCX" | "RCA", Pred> };

// TODO (owner C): replace the list below with <HeartScene vessels={result.vessels} /> in src/scene/
export default function App() {
  const [result, setResult] = useState<Result | null>(null);
  useEffect(() => {
    fetch(`${API}/samples`).then(r => r.json()).then(s =>
      fetch(`${API}/predict`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: s.high_risk }),
      }).then(r => r.json()).then(setResult));
  }, []);
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <div style={{ background: "#fff3cd", padding: 8, border: "1px solid #e0c060" }}>
        For decision support and educational purposes only. Not a substitute for formal diagnostic imaging or clinical judgment.
      </div>
      <h1>CAD-Vision</h1>
      {!result ? <p>Loading...</p> : (
        <HeartScene vessels={result.vessels} />
      )}
    </div>
  );
}
