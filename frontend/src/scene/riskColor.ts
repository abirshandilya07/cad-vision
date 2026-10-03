import * as THREE from "three";

export function getRiskColor(probability: number): THREE.Color {
  const p = THREE.MathUtils.clamp(probability, 0, 1);

  if (p < 0.4) {
    // 0–40% → green
    return new THREE.Color("#22c55e");
  }

  if (p < 0.7) {
    // 40–70% → yellow
    return new THREE.Color("#facc15");
  }

  // 70–100% → red
  return new THREE.Color("#ef4444");
}