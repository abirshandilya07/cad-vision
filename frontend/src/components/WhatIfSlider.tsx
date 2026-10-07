// src/components/WhatIfSlider.tsx
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

export function WhatIfSlider({ featureName }: { featureName: string }) {
  const { patientData, setPatientField, runPrediction, isLoading } = useAppStore();
  
  // Grab the current value from the store
  const rawValue = patientData[featureName as keyof typeof patientData];
  const currentValue = typeof rawValue === 'number' ? rawValue : 0;
  
  // Local state for the slider to feel instantly responsive while dragging
  const [localVal, setLocalVal] = useState(currentValue);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state if the patient data changes from somewhere else (like "Load Sample")
  useEffect(() => {
    setLocalVal(currentValue);
  }, [currentValue]);

  // Helper to determine reasonable slider ranges based on the feature name
  const getBounds = (feat: string) => {
    const ranges: Record<string, { min: number, max: number, step: number }> = {
      Age: { min: 20, max: 100, step: 1 },
      Weight: { min: 40, max: 150, step: 1 },
      Length: { min: 140, max: 200, step: 1 },
      BP: { min: 80, max: 220, step: 1 },
      PR: { min: 40, max: 140, step: 1 },
      FBS: { min: 60, max: 300, step: 1 },
      TG: { min: 50, max: 400, step: 1 },
      LDL: { min: 30, max: 250, step: 1 },
      HDL: { min: 20, max: 100, step: 1 },
      WBC: { min: 3000, max: 15000, step: 100 },
      PLT: { min: 100, max: 500, step: 10 },
      'EF-TTE': { min: 20, max: 80, step: 1 },
    };
    
    if (feat in ranges) return ranges[feat];
    // If it's a binary 0/1 flag (like 'Typical Chest Pain')
    if (currentValue === 0 || currentValue === 1) return { min: 0, max: 1, step: 1 };
    // Fallback for unmapped continuous features
    return { min: 0, max: Math.max(currentValue * 2, 10), step: 1 };
  };

  const bounds = getBounds(featureName);

  const handleDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLocalVal(val); // Update the UI instantly

    // The "Bouncer": Clear the previous timer if they are still dragging
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Set a new timer. Only run the API call if they stop moving for 400ms.
    timerRef.current = setTimeout(() => {
      setPatientField(featureName as keyof typeof patientData, val);
      runPrediction();
    }, 400); 
  };

  return (
    <div style={{ 
      marginTop: "16px", 
      padding: "16px", 
      backgroundColor: "var(--bg-panel)", 
      borderRadius: "8px",
      border: "1px solid var(--grid-line)" 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
          Interactive "What-If" Analysis
        </span>
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {isLoading ? "Recalculating..." : "Live updating"}
        </span>
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
        <span style={{ color: "var(--text-secondary)" }}>Adjust <strong style={{ color: "var(--text-primary)"}}>{featureName}</strong></span>
        <span style={{ fontWeight: 700, color: "var(--blue-500)" }}>{localVal}</span>
      </div>
      
      <input 
        type="range" 
        min={bounds.min} 
        max={bounds.max} 
        step={bounds.step} 
        value={localVal} 
        onChange={handleDrag}
        style={{ width: "100%", cursor: "pointer", accentColor: "var(--blue-500)" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", color: "var(--text-secondary)" }}>
        <span>{bounds.min}</span>
        <span>{bounds.max}</span>
      </div>
    </div>
  );
}