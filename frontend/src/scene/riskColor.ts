import * as THREE from "three";

export function getRiskColor(probability: number): THREE.Color {
  const p = THREE.MathUtils.clamp(probability, 0, 1);

  // Below 20% → green
  if (p <= 0.2) {
    return new THREE.Color("#22c55e");
  }

  // Above 80% → red
  if (p >= 0.8) {
    return new THREE.Color("#ef4444");
  }

  // 20–80% → green → yellow → red
  const normalized = (p - 0.2) / 0.6;

  if (normalized < 0.5) {
    return new THREE.Color().lerpColors(
      new THREE.Color("#22c55e"),
      new THREE.Color("#facc15"),
      normalized / 0.5
    );
  }

  return new THREE.Color().lerpColors(
    new THREE.Color("#facc15"),
    new THREE.Color("#ef4444"),
    (normalized - 0.5) / 0.5
  );
}