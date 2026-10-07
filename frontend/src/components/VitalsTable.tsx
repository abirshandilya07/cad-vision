import { useAppStore } from '../store/useAppStore';

export function VitalsTable() {
  // 1. Pull predictionResult to check if data has been submitted
  const { patientData, predictionResult } = useAppStore();

  const hasData = !!predictionResult;

  // Determine sex for gender-specific reference ranges
  const isMale = patientData.Sex === 'Male' || patientData.Sex === 'M';

  // Dynamically calculate BMI
  const heightInMeters = patientData.Length / 100;
  const bmi = (patientData.Weight / (heightInMeters * heightInMeters)).toFixed(1);

  // 2. Updated Helpers to return a clean empty state if hasData is false
  const getStatus = (isNormal: boolean) => {
    if (!hasData) return { color: "var(--text-secondary)", flag: "PENDING" };
    if (!isNormal) return { color: "#D33F38", flag: "⚠️ OUT OF RANGE" };
    return { color: "#168A55", flag: "✓ NORMAL" };
  };

  const getBinaryStatus = (value: number | string) => {
    if (!hasData) return { color: "var(--text-secondary)", flag: "PENDING", displayValue: "—" };
    const isPresent = value === 1 || value === 'Y' || value === 'Yes';
    if (isPresent) return { color: "#D33F38", flag: "⚠️ ABNORMAL", displayValue: "Present" };
    return { color: "#168A55", flag: "✓ NORMAL", displayValue: "Absent" };
  };

  const formatVal = (val: any) => hasData ? val : "—";

  // Map all continuous vitals with their specific thresholds
  const vitals = [
    { label: "Systolic BP", value: formatVal(patientData.BP), unit: "mmHg", range: "< 120", ...getStatus(patientData.BP < 120) },
    { label: "Pulse Rate", value: formatVal(patientData.PR), unit: "bpm", range: "60 - 100", ...getStatus(patientData.PR >= 60 && patientData.PR <= 100) },
    { label: "Fasting Blood Sugar", value: formatVal(patientData.FBS), unit: "mg/dL", range: "< 100", ...getStatus(patientData.FBS < 100) },
    { label: "BMI", value: formatVal(bmi), unit: "kg/m²", range: "18.5 - 24.9", ...getStatus(Number(bmi) >= 18.5 && Number(bmi) <= 24.9) },
    { label: "LDL Cholesterol", value: formatVal(patientData.LDL), unit: "mg/dL", range: "< 100", ...getStatus(patientData.LDL < 100) },
    { label: "HDL Cholesterol", value: formatVal(patientData.HDL), unit: "mg/dL", range: isMale ? "> 40" : "> 50", ...getStatus(patientData.HDL > (isMale ? 40 : 50)) },
    { label: "Triglycerides", value: formatVal(patientData.TG), unit: "mg/dL", range: "< 150", ...getStatus(patientData.TG < 150) },
    { label: "Ejection Fraction", value: formatVal(patientData['EF-TTE']), unit: "%", range: "55 - 70", ...getStatus(patientData['EF-TTE'] >= 55 && patientData['EF-TTE'] <= 70) },
    { label: "Creatinine", value: formatVal(patientData.CR), unit: "mg/dL", range: isMale ? "0.6 - 1.3" : "0.5 - 1.1", ...getStatus(patientData.CR >= (isMale ? 0.6 : 0.5) && patientData.CR <= (isMale ? 1.3 : 1.1)) },
    { label: "Hemoglobin", value: formatVal(patientData.HB), unit: "g/dL", range: isMale ? "13.5 - 17.5" : "12.0 - 15.5", ...getStatus(patientData.HB >= (isMale ? 13.5 : 12.0) && patientData.HB <= (isMale ? 17.5 : 15.5)) },
    { label: "Potassium", value: formatVal(patientData.K), unit: "mmol/L", range: "3.5 - 5.0", ...getStatus(patientData.K >= 3.5 && patientData.K <= 5.0) },
    { label: "Sodium", value: formatVal(patientData.Na), unit: "mmol/L", range: "135 - 145", ...getStatus(patientData.Na >= 135 && patientData.Na <= 145) },
    { label: "WBC", value: formatVal(patientData.WBC), unit: "per µL", range: "4,000 - 11,000", ...getStatus(patientData.WBC >= 4000 && patientData.WBC <= 11000) },
    { label: "Platelets", value: formatVal(patientData.PLT), unit: "x10³/µL", range: "150 - 450", ...getStatus(patientData.PLT >= 150 && patientData.PLT <= 450) },
  ];

  // Map binary clinical findings
  const binaryFindings = [
    { label: "Typical Chest Pain", value: getBinaryStatus(patientData['Typical Chest Pain']).displayValue, unit: "", range: "Absent", ...getBinaryStatus(patientData['Typical Chest Pain']) },
    { label: "ST Elevation", value: getBinaryStatus(patientData['St Elevation']).displayValue, unit: "", range: "Absent", ...getBinaryStatus(patientData['St Elevation']) },
    { label: "T Inversion", value: getBinaryStatus(patientData.Tinversion).displayValue, unit: "", range: "Absent", ...getBinaryStatus(patientData.Tinversion) },
    { label: "LVH", value: getBinaryStatus(patientData.LVH).displayValue, unit: "", range: "Absent", ...getBinaryStatus(patientData.LVH) },
  ];

  const allVitals = [...vitals, ...binaryFindings];

  return (
    <div className="panel-card" style={{ flex: 1, paddingBottom: "32px" }}>
      <div className="panel-title">Physiological Vitals</div>
      <div className="grid-line" style={{ margin: "16px 0" }} />
      
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Header Row */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 700 }}>
          <span style={{ width: "160px" }}>MEASUREMENT</span>
          <span style={{ flex: 1, textAlign: "right" }}>VALUE</span>
          <span style={{ width: "120px", textAlign: "right" }}>REFERENCE</span>
        </div>

        {/* Mapped Data Rows */}
        {allVitals.map((vital, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            
            <div style={{ width: "160px", fontWeight: 700, color: "var(--text-primary)", fontSize: "16px" }}>
              {vital.label}
              <div style={{ fontSize: "12px", color: vital.color, marginTop: "2px" }}>{vital.flag}</div>
            </div>
            
            <div style={{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: "24px", color: vital.color }}>
              {vital.value} <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 400 }}>{hasData ? vital.unit : ""}</span>
            </div>
            
            <div style={{ width: "120px", textAlign: "right", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 700 }}>
              {vital.range}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}