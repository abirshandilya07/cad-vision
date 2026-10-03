import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Activity, User, Heart, FileSpreadsheet, Stethoscope, Send } from 'lucide-react';

export const PatientForm: React.FC = () => {
  const { patientData, setPatientField, runPrediction, isLoading } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runPrediction();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "var(--bg-panel)",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    padding: "10px 14px",
    color: "var(--text-primary)",
    fontSize: "15px", // Increased from 13px for better readability
    outline: "none"
  };

  const featureCategories = [
    {
      title: "1. Demographics & Anthropometrics",
      icon: <User size={20} className="text-blue-500" />,
      fields: [
        { key: 'Age', label: 'Age (yrs)', type: 'number' },
        { key: 'Sex', label: 'Sex', type: 'select', options: [{ val: 'Male', label: 'Male' }, { val: 'Female', label: 'Female' }] },
        { key: 'Length', label: 'Length / Height (cm)', type: 'number' },
        { key: 'Weight', label: 'Weight (kg)', type: 'number' },
        { key: 'BP', label: 'Blood Pressure (mmHg)', type: 'number' },
        { key: 'PR', label: 'Pulse Rate (PR)', type: 'number' }
      ]
    },
    {
      title: "2. Clinical History & Symptoms",
      icon: <Heart size={20} className="text-red-500" />,
      fields: [
        { key: 'DM', label: 'Diabetes Mellitus (DM)', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'HTN', label: 'Hypertension (HTN)', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'Current Smoker', label: 'Current Smoker', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'EX-Smoker', label: 'Ex-Smoker', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'FH', label: 'Family History (FH)', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'CRF', label: 'Chronic Renal Failure', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'CVA', label: 'CVA', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'DLP', label: 'Dyslipidemia (DLP)', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'Typical Chest Pain', label: 'Typical Chest Pain', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'Dyspnea', label: 'Dyspnea', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'Function Class', label: 'Function Class', type: 'number' },
        { key: 'Atypical', label: 'Atypical Pain', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] }
      ]
    },
    {
      title: "3. Blood Biochemistry & Lipid Profile",
      icon: <FileSpreadsheet size={20} className="text-yellow-500" />,
      fields: [
        { key: 'FBS', label: 'FBS (Fasting Blood Sugar)', type: 'number' },
        { key: 'CR', label: 'Creatinine (CR)', type: 'number' },
        { key: 'TG', label: 'Triglycerides (TG)', type: 'number' },
        { key: 'LDL', label: 'LDL Level', type: 'number' },
        { key: 'HDL', label: 'HDL Level', type: 'number' },
        { key: 'BUN', label: 'BUN', type: 'number' },
        { key: 'ESR', label: 'ESR', type: 'number' },
        { key: 'HB', label: 'Hemoglobin (HB)', type: 'number' },
        { key: 'K', label: 'Potassium (K)', type: 'number' },
        { key: 'Na', label: 'Sodium (Na)', type: 'number' },
        { key: 'WBC', label: 'WBC Count', type: 'number' },
        { key: 'Lymph', label: 'Lymphocytes', type: 'number' },
        { key: 'Neut', label: 'Neutrophils', type: 'number' },
        { key: 'PLT', label: 'Platelets (PLT)', type: 'number' }
      ]
    },
    {
      title: "4. Echocardiography & ECG Markers",
      icon: <Stethoscope size={20} className="text-green-500" />,
      fields: [
        { key: 'EF-TTE', label: 'EF-TTE (Ejection Fraction %)', type: 'number' },
        { key: 'Region RWMA', label: 'Region RWMA', type: 'number' },
        { key: 'VHD', label: 'VHD', type: 'text' },
        { key: 'Q Wave', label: 'Q Wave', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'St Elevation', label: 'ST Elevation', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'St Depression', label: 'ST Depression', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'Tinversion', label: 'T Inversion', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'LVH', label: 'LVH', type: 'select', options: [{ val: 0, label: 'No (0)' }, { val: 1, label: 'Yes (1)' }] },
        { key: 'BBB', label: 'BBB', type: 'text' }
      ]
    }
  ];

  return (
    <div 
      className="panel-card" 
      style={{ 
        width: "100%", 
        maxHeight: "calc(100vh - 100px)", 
        overflowY: "auto", 
        padding: "32px",
        boxSizing: "border-box"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
        <Activity className="text-blue-500 animate-pulse" size={32} />
        <div>
          <div className="panel-title" style={{ fontSize: "30px" }}>Cardiovascular Diagnostic Input</div>
        </div>
      </div>
      
      <div className="grid-line" style={{ margin: "16px 0 32px 0" }} />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        
        {featureCategories.map((category, catIdx) => (
          <div key={catIdx}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {category.icon} {category.title}
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
              {category.fields.map((field) => {
                const val = patientData[field.key as keyof typeof patientData];
                return (
                  <div key={field.key}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase" }}>
                      {field.label}
                    </label>
                    
                    {field.type === 'select' ? (
                      <select
                        value={val !== undefined ? String(val) : ''}
                        onChange={(e) => {
                          const parsed = isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value);
                          setPatientField(field.key as any, parsed);
                        }}
                        style={inputStyle}
                      >
                        {field.options?.map((opt) => (
                          <option key={String(opt.val)} value={opt.val}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        step="any"
                        value={val !== undefined && val !== null ? val : ''}
                        onChange={(e) => {
                          const parsed = field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
                          setPatientField(field.key as any, parsed);
                        }}
                        style={inputStyle}
                        placeholder={`Enter ${field.key}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="grid-line" style={{ margin: "12px 0" }} />

        {/* Submit Action */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: "24px" }}>
          <button
            type="submit"
            disabled={isLoading}
            className="nav-btn nav-btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 32px", fontSize: "16px", cursor: "pointer" }}
          >
            <Send size={20} />
            {isLoading ? "Running Diagnostic Pipeline..." : "Run Prediction & Analysis"}
          </button>
        </div>
      </form>
    </div>
  );
};