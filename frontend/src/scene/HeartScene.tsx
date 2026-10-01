import { Canvas } from "@react-three/fiber";
import { Bounds, Center, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

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

function HeartModel() {
  const { scene } = useGLTF("/models/heart.glb");

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