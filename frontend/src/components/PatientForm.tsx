import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Activity, User, Heart, FileSpreadsheet, Stethoscope, Save } from 'lucide-react';

export const PatientForm: React.FC = () => {
  const { patientData, setPatientData } = useAppStore();
  const [localData, setLocalData] = useState(patientData);

  useEffect(() => {
    setLocalData(patientData);
  }, [patientData]);

  const isChanged = JSON.stringify(localData) !== JSON.stringify(patientData);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isChanged) {
      setPatientData(localData);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "var(--bg-panel)",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    padding: "10px 14px",
    color: "var(--text-primary)",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s ease"
  };

  // Custom style for select dropdowns to align the arrow nicely
  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    // Clean, perfectly inset SVG chevron to replace the ugly native browser arrow
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center", // Matches the number input arrow padding
    paddingRight: "36px", // Prevents text from overlapping the custom arrow
    cursor: "pointer"
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
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div 
        className="panel-card" 
        style={{ 
          width: "100%", 
          maxHeight: "calc(100vh - 100px)", 
          overflowY: "auto", 
          padding: "32px",
          boxSizing: "border-box",
          animation: "fadeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
          <Activity className="text-blue-500 animate-pulse" size={32} />
          <div>
            <div className="panel-title" style={{ fontSize: "28px" }}>Cardiovascular Diagnostic Input</div>
          </div>
        </div>
        
        <div className="grid-line" style={{ margin: "16px 0 32px 0" }} />

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          
          {featureCategories.map((category, catIdx) => (
            <div key={catIdx}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {category.icon} {category.title}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                {category.fields.map((field) => {
                  const val = localData[field.key as keyof typeof localData];
                  
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
                            setLocalData(prev => ({ ...prev, [field.key]: parsed }));
                          }}
                          style={selectStyle} // <-- Now using the dedicated selectStyle
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
                            setLocalData(prev => ({ ...prev, [field.key]: parsed }));
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

          <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: "24px", position: "sticky", bottom: "-10px" }}>
            <button
              type="submit"
              disabled={!isChanged}
              className="nav-btn nav-btn-primary"
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px", 
                padding: "14px 32px", 
                fontSize: "16px", 
                cursor: isChanged ? "pointer" : "not-allowed",
                opacity: isChanged ? 1 : 0.4,
                filter: isChanged ? "none" : "grayscale(50%)",
                transition: "all 0.25s ease",
                transform: isChanged ? "scale(1)" : "scale(0.98)"
              }}
            >
              <Save size={20} />
              {isChanged ? "Save Changes" : "No Changes Detected"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};