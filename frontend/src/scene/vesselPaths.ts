import * as THREE from "three";

export const vesselPaths = {
  LAD: new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.5, 0.2),
    new THREE.Vector3(0, 0.2, 0.3),
    new THREE.Vector3(0, -0.1, 0.25),
    new THREE.Vector3(0, -0.4, 0.15),
  ]),

  LCX: new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.1, 0.3, 0.1),
    new THREE.Vector3(-0.4, 0.25, 0.05),
    new THREE.Vector3(-0.7, 0.1, 0),
    new THREE.Vector3(-0.8, -0.15, -0.1),
  ]),

  RCA: new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1, 0.2, 0.1),
    new THREE.Vector3(0.4, 0.1, 0.05),
    new THREE.Vector3(0.6, -0.15, 0),
    new THREE.Vector3(0.5, -0.4, -0.1),
  ]),
};