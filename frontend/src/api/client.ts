import type { PatientInputs, PredictionResponse, SamplesResponse } from "../types/api";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function getSamples(): Promise<SamplesResponse> {
  const response = await fetch(`${API_URL}/samples`);

  if (!response.ok) {
    throw new Error(
      `Failed to load samples: ${response.status}`
    );
  }

  return response.json();
}
export async function predictPatient(
  features: PatientInputs
): Promise<PredictionResponse> {
  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      features,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(
      errorBody?.detail ??
        `Prediction request failed with status ${response.status}`
    );
  }

  return response.json();
}