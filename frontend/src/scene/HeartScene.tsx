import { Canvas } from "@react-three/fiber";
import { Bounds, Center, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { vesselPaths } from "./vesselPaths";
import CoordinateTest from "./CoordinateTest";

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
function HeartModel() {
  const { scene } = useGLTF("/models/heart_markers.glb");

  // Find our Blender markers
  const markerNames = [
    "LAD_01", "LAD_02", "LAD_03", "LAD_04",
    "LAD_05", "LAD_06", "LAD_07",

    "LCX_01", "LCX_02", "LCX_03", "LCX_04", "LCX_05",

    "RCA_01", "RCA_02", "RCA_03", "RCA_04",
    "RCA_05", "RCA_06",
  ];

  const markerGeometry = new THREE.SphereGeometry(0.015, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: "lime",
  });

  markerNames.forEach((name) => {
    const marker = scene.getObjectByName(name);

    if (marker) {
      const sphere = new THREE.Mesh(
        markerGeometry,
        markerMaterial
      );

      marker.add(sphere);

      console.log(
        name,
        "position:",
        marker.position.toArray()
      );
    } else {
      console.warn("Marker not found:", name);
    }
  });

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
    <div style={{ width: "100%", height: "600px" }}>
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
          <HeartModel />
        </Bounds>

        <CoordinateTest/>

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