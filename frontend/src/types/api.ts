// src/types/api.ts

export type SexCategory = 'Male' | 'Female';
export type BBBCategory = 'N' | 'LBBB' | 'RBBB';
export type VHDCategory = 'N' | 'mild' | 'Moderate' | 'Severe';

export interface PatientInputs {
  Age: number;
  Weight: number;
  Length: number; // Note: Length means height in cm per contract
  Sex: SexCategory;
  DM: number;
  HTN: number;
  'Current Smoker': number;
  'EX-Smoker': number;
  FH: number;
  CRF: number;
  CVA: number;
  'Airway disease': number;
  'Thyroid Disease': number;
  CHF: number;
  DLP: number;
  BP: number; // Systolic BP
  PR: number; // Pulse rate
  Edema: number;
  'Weak Peripheral Pulse': number;
  'Lung rales': number;
  'Systolic Murmur': number;
  'Diastolic Murmur': number;
  'Typical Chest Pain': number;
  Dyspnea: number;
  'Function Class': number; // 0 to 3
  Atypical: number;
  Nonanginal: number;
  'LowTH Ang': number;
  'Q Wave': number;
  'St Elevation': number;
  'St Depression': number;
  Tinversion: number;
  LVH: number;
  'Poor R Progression': number;
  BBB: BBBCategory;
  FBS: number;
  CR: number;
  TG: number;
  LDL: number;
  HDL: number;
  BUN: number;
  ESR: number;
  HB: number;
  K: number;
  Na: number;
  WBC: number;
  Lymph: number;
  Neut: number;
  PLT: number;
  'EF-TTE': number;
  'Region RWMA': number; // 0 to 4
  VHD: VHDCategory;
}

export type TargetKey = 'Cath' | 'LAD' | 'LCX' | 'RCA';

export interface PredictionTargetResult {
  probability: number;
  label: string;
  threshold: number;
}

export interface PredictionResponse {
  predictions: Record<TargetKey, PredictionTargetResult>;
  derived_features: {
    BMI: number;
    Obesity: number;
  };
  model_version: string;
}

export interface ShapFeatureItem {
  feature: string;
  value: number | string;
  shap: number;
  direction: 'increases' | 'decreases';
}

export interface ExplanationTargetResult {
  probability: number;
  base_value: number;
  top_features: ShapFeatureItem[];
  narrative: string;
}

export interface ExplainResponse {
  shap_units: 'log_odds' | 'probability';
  explanations: Record<TargetKey, ExplanationTargetResult>;
  global_importance: Record<TargetKey, Array<{ feature: string; importance: number }>>;
}

export interface MetricsResponse {
  model_version: string;
  evaluation: string;
  models: Record<TargetKey, {
    auc: number;
    accuracy: number;
    sensitivity: number;
    specificity: number;
    threshold: number;
  }>;
}

export interface HealthResponse {
  status: string;
  model_version: string;
  models_loaded: boolean;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details: Array<{
    field: string;
    message: string;
  }>;
}