// src/store/useAppStore.ts
import { create } from 'zustand';
import { PatientInputs, PredictionResponse,SampleKey } from '../types/api';
import { predictPatient,getSamples } from "../api/client";

interface AppState {
  loadSample: (name: SampleKey) => Promise<void>;
  // Current patient form inputs matching the 52 features
  patientData: PatientInputs;
  setPatientData: (data: Partial<PatientInputs>) => void;
  setPatientField: (field: keyof PatientInputs, value: any) => void; // <--- Add this

  // API loading & prediction state
  isLoading: boolean;
  predictionResult: PredictionResponse | null;
  runPrediction: () => Promise<void>;

  // Selected vessel state
  selectedVessel: 'LAD' | 'LCX' | 'RCA';
  setSelectedVessel: (vessel: 'LAD' | 'LCX' | 'RCA') => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  setPatientData: (data) =>
    set((state) => ({ patientData: { ...state.patientData, ...data } })),

  setPatientField: (field, value) =>
    set((state) => ({
      patientData: { ...state.patientData, [field]: value }
    })),
  // Default values matching the contract's median/default row
  patientData: {
    Age: 58,
    Weight: 74,
    Length: 165,
    Sex: 'Male',
    DM: 0,
    HTN: 0,
    'Current Smoker': 0,
    'EX-Smoker': 0,
    FH: 0,
    CRF: 0,
    CVA: 0,
    'Airway disease': 0,
    'Thyroid Disease': 0,
    CHF: 0,
    DLP: 0,
    BP: 130,
    PR: 70,
    Edema: 0,
    'Weak Peripheral Pulse': 0,
    'Lung rales': 0,
    'Systolic Murmur': 0,
    'Diastolic Murmur': 0,
    'Typical Chest Pain': 0,
    Dyspnea: 0,
    'Function Class': 0,
    Atypical: 0,
    Nonanginal: 0,
    'LowTH Ang': 0,
    'Q Wave': 0,
    'St Elevation': 0,
    'St Depression': 0,
    Tinversion: 0,
    LVH: 0,
    'Poor R Progression': 0,
    BBB: 'N',
    FBS: 98,
    CR: 1,
    TG: 122,
    LDL: 100,
    HDL: 39,
    BUN: 16,
    ESR: 15,
    HB: 13.2,
    K: 4.2,
    Na: 141,
    WBC: 7100,
    Lymph: 32,
    Neut: 60,
    PLT: 210,
    'EF-TTE': 50,
    'Region RWMA': 0,
    VHD: 'N',
  },
  

  isLoading: false,
  predictionResult: null,

  // Mock prediction action matching the contract's response shape
  runPrediction: async () => {
    set({ isLoading: true });

    try {
      const { patientData } = get();

      const result = await predictPatient(patientData);

      set({
        predictionResult: result,
        isLoading: false,
      });
    } catch (error) {
    console.error("Prediction failed", error);

    set({
      isLoading: false,
    });
  }
},
loadSample: async (name) => {
  set({ isLoading: true });

  try {
    const samples = await getSamples();

    set({
      patientData: samples[name],
      predictionResult: null,
      isLoading: false,
    });
  } catch (error) {
    console.error("Failed to load sample", error);

    set({
      isLoading: false,
    });
  }
},

  selectedVessel: 'LAD',
  setSelectedVessel: (vessel) => set({ selectedVessel: vessel }),
}));