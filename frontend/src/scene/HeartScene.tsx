import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { vesselPaths } from "./vesselPaths";
import { getRiskColor } from "./riskColor";

type VesselPrediction = {
  probability: number;
  label: number;
};

type HeartSceneProps = {
  vessels: {
    LAD: VesselPrediction;
    LCX: VesselPrediction;
    RCA: VesselPrediction;
  };
};
function DebugPoints() {
  const points = [
    ...vesselPaths.LAD.getPoints(3),
    ...vesselPaths.LCX.getPoints(3),
    ...vesselPaths.RCA.getPoints(3),
  ];

  return (
    <>
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}
    </>
  );
}
function HeartModel({ vessels }: HeartSceneProps) {
  const { scene } = useGLTF("/models/heart_markers.glb");

  const LAD_NAMES = [
    "LAD_01",
    "LAD_02",
    "LAD_03",
    "LAD_04",
    "LAD_05",
    "LAD_06",
    "LAD_07",
  ];

  const LCX_NAMES = [
    "LAD_01",
    "LCX_01",
    "LCX_02",
    "LCX_03",
    "LCX_04",
    "LCX_05",
  ];
  const RCA_NAMES = [
    "RCA_01",
    "RCA_02",
    "RCA_03",
    "RCA_04",
    "RCA_05",
    "RCA_06",
    "RCA_07"
  ];

  // Make sure all GLB transforms are calculated first.
  scene.updateMatrixWorld(true);

  // Get the marker positions in world space,
  // then convert them back into the GLB scene's local space.
  const ladPoints = LAD_NAMES
    .map((name) => scene.getObjectByName(name))
    .filter((marker): marker is THREE.Object3D => marker !== undefined)
    .map((marker) => {
      const worldPosition = new THREE.Vector3();

      marker.getWorldPosition(worldPosition);

      return scene.worldToLocal(worldPosition.clone());
    });
  
  const lcxPoints = LCX_NAMES
    .map((name) => scene.getObjectByName(name))
    .filter((marker): marker is THREE.Object3D => marker !== undefined)
    .map((marker) => {
      const worldPosition = new THREE.Vector3();

      marker.getWorldPosition(worldPosition);

      return worldPosition;
  });

  const rcaPoints = RCA_NAMES
    .map((name) => scene.getObjectByName(name))
    .filter((marker): marker is THREE.Object3D => marker !== undefined)
    .map((marker) => {
      const worldPosition = new THREE.Vector3();

      marker.getWorldPosition(worldPosition);

      return worldPosition;
  });
  // Create a smooth curve through our Blender points.
  const ladCurve = new THREE.CatmullRomCurve3(
    ladPoints,
    false,
    "catmullrom",
    0.5
  );

  const lcxCurve = new THREE.CatmullRomCurve3(
    lcxPoints,
    false,
    "centripetal",
    0.5
  );
  const rcaCurve = new THREE.CatmullRomCurve3(
    rcaPoints,
    false,
    "centripetal",
    0.5
);

  // Turn the curve into a 3D tube.
  const ladGeometry = new THREE.TubeGeometry(
    ladCurve,
    128,
    0.008,
    12,
    false
  );

  const lcxGeometry = new THREE.TubeGeometry(
    lcxCurve,
    128,
    0.008,
    12,
    false
  );

  const rcaGeometry = new THREE.TubeGeometry(
    rcaCurve,
    128,
    0.008,
    12,
    false
  );
  const ladColor = getRiskColor(vessels.LAD.probability);

  const ladMaterial = new THREE.MeshStandardMaterial({
    color: ladColor,
    emissive: ladColor,
    emissiveIntensity: 0.15,
    roughness: 0.4,
    metalness: 0.1,
    depthTest: false,
    depthWrite: false,
  });

  const lcxColor = getRiskColor(vessels.LCX.probability);

  const lcxMaterial = new THREE.MeshStandardMaterial({
    color: lcxColor,
    emissive: lcxColor,
    emissiveIntensity: 0.15,
    roughness: 0.4,
    metalness: 0.1,
    depthTest: false,
    depthWrite: false,
  });

  const rcaColor = getRiskColor(vessels.RCA.probability);

  const rcaMaterial = new THREE.MeshStandardMaterial({
    color: rcaColor,
    emissive: rcaColor,
    emissiveIntensity: 0.15,
    roughness: 0.4,
    metalness: 0.1,
    depthTest: false,
    depthWrite: false,
  });

  const ladTube = new THREE.Mesh(
    ladGeometry,
    ladMaterial
  );

  const lcxTube = new THREE.Mesh(
    lcxGeometry,
    lcxMaterial
  );

  const rcaTube = new THREE.Mesh(
    rcaGeometry,
    rcaMaterial
  );

  // Add the LAD tube to the same GLB scene.
  // This is important because it keeps the exact
  // same coordinate system as the heart.
  useEffect(() => {
    scene.add(ladTube);
    scene.add(lcxTube);
    scene.add(rcaTube);

    return () => {
      scene.remove(ladTube);
      scene.remove(lcxTube);
      scene.remove(rcaTube);

      ladGeometry.dispose();
      lcxGeometry.dispose();
      rcaGeometry.dispose();

      ladMaterial.dispose();
      lcxMaterial.dispose();
      rcaMaterial.dispose();
    };
  }, [
    scene,
    ladTube,
    lcxTube,
    rcaTube,
    ladGeometry,
    lcxGeometry,
    rcaGeometry,
    ladMaterial,
    lcxMaterial,
    rcaMaterial,
  ]);

  return (
    <Center>
      <primitive
        object={scene}
        scale={1}
        castShadow
        receiveShadow
      />
    </Center>
  );
}

export default function HeartScene({ vessels }: HeartSceneProps) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 0 }}>
      <Canvas
        camera={{
          position: [0, 0, 3],
          fov: 45,
        }}
        dpr={[1, 1.5]}
        shadows
      >
        <color attach="background" args={["#f5f5f5"]} />

        <ambientLight intensity={1.5} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={2}
          castShadow
        />

        <directionalLight
          position={[-5, 2, -5]}
          intensity={1}
        />

        <Bounds fit clip observe margin={1.2}>
          <HeartModel vessels={vessels} />
        </Bounds>


        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={1}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}