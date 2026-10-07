import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
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
  selectedVessel: "LAD" | "LCX" | "RCA";
  onVesselSelect: (vessel: "LAD" | "LCX" | "RCA") => void;
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
function HeartModel({ vessels, selectedVessel, onVesselSelect, }: HeartSceneProps) {
  const { scene } = useGLTF("/models/heart_markers.glb");
  
  const [hoveredVessel, setHoveredVessel] = useState<
    "LAD" | "LCX" | "RCA" | null
  >(null);

  const ladMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const lcxMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const rcaMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const vesselGroupRef = useRef<THREE.Group | null>(null);

  if (!vesselGroupRef.current) {
    vesselGroupRef.current = new THREE.Group();
    scene.add(vesselGroupRef.current);
  }
  useEffect(() => {
    if (!ladMaterialRef.current || !lcxMaterialRef.current || !rcaMaterialRef.current) {
      return;
    }

    ladMaterialRef.current.opacity = selectedVessel === "LAD" ? 1.0 : 0.25;
    lcxMaterialRef.current.opacity = selectedVessel === "LCX" ? 1.0 : 0.25;
    rcaMaterialRef.current.opacity = selectedVessel === "RCA" ? 1.0 : 0.25;
  }, [selectedVessel]);


  useFrame((_, delta) => {
    if (
      !ladMaterialRef.current ||
      !lcxMaterialRef.current ||
      !rcaMaterialRef.current
    ) {
      return;
    }
    const pulse = (Math.sin(performance.now() * 0.004) + 1) / 2;

    const ladHighRisk = vessels.LAD.probability >= 0.8;

    if (ladGlowMaterial) {
      ladGlowMaterial.opacity = ladHighRisk
        ? 0.08 + pulse * 0.10
        : 0;
    }
    const lcxHighRisk = vessels.LCX.probability >= 0.8;
    const rcaHighRisk = vessels.RCA.probability >= 0.8;

    if (lcxGlowMaterial) {
      lcxGlowMaterial.opacity = lcxHighRisk
        ? 0.08 + pulse * 0.10
        : 0;
    }

    if (rcaGlowMaterial) {
      rcaGlowMaterial.opacity = rcaHighRisk
        ? 0.08 + pulse * 0.10
        : 0;
    }
    const ladBaseTarget =
      hoveredVessel === "LAD"
        ? 1.0
        : hoveredVessel
          ? 0.25
          : selectedVessel === "LAD"
            ? 1.0
            : 0.25;

    const ladTarget =
      vessels.LAD.probability >= 0.5
        ? ladBaseTarget * (0.65 + pulse * 0.35)
        : ladBaseTarget;

    const lcxBaseTarget =
      hoveredVessel === "LCX"
        ? 1.0
        : hoveredVessel
          ? 0.25
          : selectedVessel === "LCX"
            ? 1.0
            : 0.25;

    const lcxTarget =
      vessels.LCX.probability >= 0.8
        ? lcxBaseTarget * (0.65 + pulse * 0.35)
        : lcxBaseTarget;
    
    const rcaBaseTarget =
      hoveredVessel === "RCA"
        ? 1.0
        : hoveredVessel
          ? 0.25
          : selectedVessel === "RCA"
            ? 1.0
            : 0.25;

    const rcaTarget =
      vessels.RCA.probability >= 0.8
        ? rcaBaseTarget * (0.65 + pulse * 0.35)
        : rcaBaseTarget;

    ladMaterialRef.current.opacity = THREE.MathUtils.damp(
      ladMaterialRef.current.opacity,
      ladTarget,
      4,
      delta
    );

    lcxMaterialRef.current.opacity = THREE.MathUtils.damp(
      lcxMaterialRef.current.opacity,
      lcxTarget,
      4,
      delta
    );

    rcaMaterialRef.current.opacity = THREE.MathUtils.damp(
      rcaMaterialRef.current.opacity,
      rcaTarget,
      4,
      delta
    );

    if (hoveredVessel) {
      
}
  });
  // useFrame(() => {
  //   const targets = {
  //     LAD: getRiskColor(vessels.LAD.probability),
  //     LCX: getRiskColor(vessels.LCX.probability),
  //     RCA: getRiskColor(vessels.RCA.probability),
  //   };

  //   if (ladMaterialRef.current) {
  //     ladMaterialRef.current.color.lerp(targets.LAD, 0.08);
  //   }

  //   if (lcxMaterialRef.current) {
  //     lcxMaterialRef.current.color.lerp(targets.LCX, 0.08);
  //   }

  //   if (rcaMaterialRef.current) {
  //     rcaMaterialRef.current.color.lerp(targets.RCA, 0.08);
  //   }
  // });

  // useEffect(() => {
  //   if (ladMaterialRef.current) {
  //     ladMaterialRef.current.emissiveIntensity =
  //       selectedVessel === "LAD" ? 1.0 : 0.15;
  //   }

  //   if (lcxMaterialRef.current) {
  //     lcxMaterialRef.current.emissiveIntensity =
  //       selectedVessel === "LCX" ? 1.0 : 0.15;
  //   }

  //   if (rcaMaterialRef.current) {
  //     rcaMaterialRef.current.emissiveIntensity =
  //       selectedVessel === "RCA" ? 1.0 : 0.15;
  //   }
  // }, [selectedVessel]);

  const LAD_NAMES = [
    "LAD_01",
    "LAD_02",
    "LAD_03",
    "LAD_04",
    "LAD_05",
    "LAD_06",
    "LAD_07",
    "LAD_08",
  ];

  const LCX_NAMES = [
    "LAD_01",
    "LCX_01",
    "LCX_02",
    "LCX_03",
    "LCX_04",
    "LCX_05",
    "LCX_06",
    "LCX_07",
  ];
  const RCA_NAMES = [
    "RCA_01",
    "RCA_02",
    "RCA_03",
    "RCA_04",
    "RCA_05",
    "RCA_06",
    "RCA_07",
    "RCA_08",
    "RCA_09",
  ];

  // Make sure all GLB transforms are calculated first.
  scene.updateMatrixWorld(true);

  // Get the marker positions in world space,
  // then convert them back into the GLB scene's local space.
  const ladPoints = useMemo(
  () =>
    LAD_NAMES
      .map((name) => scene.getObjectByName(name))
      .filter((marker): marker is THREE.Object3D => marker !== undefined)
      .map((marker) => {
        const worldPosition = new THREE.Vector3();
        marker.getWorldPosition(worldPosition);
        return scene.worldToLocal(worldPosition.clone());
      }),
  [scene]
);

const lcxPoints = useMemo(
  () =>
    LCX_NAMES
      .map((name) => scene.getObjectByName(name))
      .filter((marker): marker is THREE.Object3D => marker !== undefined)
      .map((marker) => {
        const worldPosition = new THREE.Vector3();
        marker.getWorldPosition(worldPosition);
        return worldPosition;
      }),
  [scene]
);

const rcaPoints = useMemo(
  () =>
    RCA_NAMES
      .map((name) => scene.getObjectByName(name))
      .filter((marker): marker is THREE.Object3D => marker !== undefined)
      .map((marker) => {
        const worldPosition = new THREE.Vector3();
        marker.getWorldPosition(worldPosition);
        return worldPosition;
      }),
  [scene]
);
  // Create a smooth curve through our Blender points.
  const ladCurve = useMemo(
  () =>
    new THREE.CatmullRomCurve3(
      ladPoints,
      false,
      "catmullrom",
      0.5
    ),
  [ladPoints]
);

const lcxCurve = useMemo(
  () =>
    new THREE.CatmullRomCurve3(
      lcxPoints,
      false,
      "centripetal",
      0.5
    ),
  [lcxPoints]
);

const rcaCurve = useMemo(
  () =>
    new THREE.CatmullRomCurve3(
      rcaPoints,
      false,
      "centripetal",
      0.5
    ),
  [rcaPoints]
);

  // Turn the curve into a 3D tube.
  const ladGeometry = useMemo(
  () =>
    new THREE.TubeGeometry(
      ladCurve,
      128,
      0.008,
      12,
      false
    ),
  [ladCurve]
);
  const ladGlowGeometry = useMemo(
  () => new THREE.TubeGeometry(ladCurve, 128, 0.014, 12, false),
  [ladCurve]
);
  const ladHitGeometry = useMemo(
    () => new THREE.TubeGeometry(ladCurve, 128, 0.025, 12, false),
    [ladCurve]
);

const lcxGeometry = useMemo(
  () =>
    new THREE.TubeGeometry(
      lcxCurve,
      128,
      0.008,
      12,
      false
    ),
  [lcxCurve]
);
const lcxGlowGeometry = useMemo(
  () => new THREE.TubeGeometry(lcxCurve, 128, 0.014, 12, false),
  [lcxCurve]
);
const lcxHitGeometry = useMemo(
  () => new THREE.TubeGeometry(lcxCurve, 128, 0.025, 12, false),
  [lcxCurve]
);


const rcaGeometry = useMemo(
  () =>
    new THREE.TubeGeometry(
      rcaCurve,
      128,
      0.008,
      12,
      false
    ),
  [rcaCurve]
);
const rcaGlowGeometry = useMemo(
  () => new THREE.TubeGeometry(rcaCurve, 128, 0.014, 12, false),
  [rcaCurve]
);
const rcaHitGeometry = useMemo(
  () => new THREE.TubeGeometry(rcaCurve, 128, 0.025, 12, false),
  [rcaCurve]
);

  const ladColor = useMemo(
  () => getRiskColor(vessels.LAD.probability),
  [vessels.LAD.probability]
);

  const ladMaterial = useMemo(
  () => {
    const material = new THREE.MeshStandardMaterial({
      color: ladColor,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 1,
      depthTest: true,
      depthWrite: false,
    });

    ladMaterialRef.current = material;
    return material;
  },
  [ladColor]
);
const ladGlowMaterial = useMemo(
  () =>
    new THREE.MeshBasicMaterial({
      color: ladColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    }),
  [ladColor]
);
  const ladHitMaterial = useMemo(
  () =>
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: true,
      depthTest: true,
    }),
  []
);
const ladHitTube = useMemo(
  () => new THREE.Mesh(ladHitGeometry, ladHitMaterial),
  [ladHitGeometry, ladHitMaterial]
);

  const lcxColor = useMemo(
  () => getRiskColor(vessels.LCX.probability),
  [vessels.LCX.probability]
);

  const lcxMaterial = useMemo(
  () => {
    const material = new THREE.MeshStandardMaterial({
      color: lcxColor,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 1,
      depthTest: true,
      depthWrite: false,
    });

    lcxMaterialRef.current = material;
    return material;
  },
  [lcxColor]
);
const lcxGlowMaterial = useMemo(
  () =>
    new THREE.MeshBasicMaterial({
      color: lcxColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    }),
  [lcxColor]
);
const lcxHitMaterial = useMemo(
  () =>
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
    }),
  []
);

const lcxHitTube = useMemo(
  () => new THREE.Mesh(lcxHitGeometry, lcxHitMaterial),
  [lcxHitGeometry, lcxHitMaterial]
);

  const rcaColor = useMemo(
  () => getRiskColor(vessels.RCA.probability),
  [vessels.RCA.probability]
);

  const rcaMaterial = useMemo(
  () => {
    const material = new THREE.MeshStandardMaterial({
      color: rcaColor,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 1,
      depthTest: true,
      depthWrite: false,
    });

    rcaMaterialRef.current = material;
    return material;
  },
  [rcaColor]
);
const rcaGlowMaterial = useMemo(
  () =>
    new THREE.MeshBasicMaterial({
      color: rcaColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    }),
  [rcaColor]
);
const rcaHitMaterial = useMemo(
  () =>
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
    }),
  []
);

const rcaHitTube = useMemo(
  () => new THREE.Mesh(rcaHitGeometry, rcaHitMaterial),
  [rcaHitGeometry, rcaHitMaterial]
);

  const ladTube = useMemo(
    () => new THREE.Mesh(ladGeometry, ladMaterial),
    [ladGeometry, ladMaterial]
  );
const ladGlowTube = useMemo(
  () => new THREE.Mesh(ladGlowGeometry, ladGlowMaterial),
  [ladGlowGeometry, ladGlowMaterial]
);
  const lcxTube = useMemo(
    () => new THREE.Mesh(lcxGeometry, lcxMaterial),
    [lcxGeometry, lcxMaterial]
  );
  const lcxGlowTube = useMemo(
  () => new THREE.Mesh(lcxGlowGeometry, lcxGlowMaterial),
  [lcxGlowGeometry, lcxGlowMaterial]
);
  const rcaTube = useMemo(
    () => new THREE.Mesh(rcaGeometry, rcaMaterial),
    [rcaGeometry, rcaMaterial]
  );
const rcaGlowTube = useMemo(
  () => new THREE.Mesh(rcaGlowGeometry, rcaGlowMaterial),
  [rcaGlowGeometry, rcaGlowMaterial]
);
  ladTube.userData.vessel = "LAD";
  lcxTube.userData.vessel = "LCX";
  rcaTube.userData.vessel = "RCA";

//  ladTube.visible = selectedVessel === "LAD";
//   lcxTube.visible = selectedVessel === "LCX";
//   rcaTube.visible = selectedVessel === "RCA"; 

  // Add the LAD tube to the same GLB scene.
  // This is important because it keeps the exact
  // same coordinate system as the heart.
  useEffect(() => {
    return () => {
      ladGeometry.dispose();
      lcxGeometry.dispose();
      rcaGeometry.dispose();

      ladMaterial.dispose();
      lcxMaterial.dispose();
      rcaMaterial.dispose();
    };
  }, [
    ladGeometry,
    lcxGeometry,
    rcaGeometry,
    ladMaterial,
    lcxMaterial,
    rcaMaterial,
  ]);

return (
    <>
      <primitive
        object={scene}
        scale={1}
        castShadow
        receiveShadow
      />

      <primitive object={ladGlowTube} />
      <primitive object={ladTube} />
      <primitive
        object={ladHitTube}
        onPointerOver={(e: any) => {
          e.stopPropagation();
          setHoveredVessel("LAD");
        }}
        onPointerOut={(e: any) => {
          e.stopPropagation();
          setHoveredVessel(null);
        }}
        onClick={(e: any) => {
          e.stopPropagation();
          onVesselSelect("LAD");
        }}
      />

      <primitive object={lcxTube} />
      <primitive object={lcxTube} />

      <primitive
        object={lcxHitTube}
        onPointerOver={(e: any) => {
          e.stopPropagation();
          setHoveredVessel("LCX");
        }}
        onPointerOut={(e: any) => {
          e.stopPropagation();
          setHoveredVessel(null);
        }}
        onClick={(e: any) => {
          e.stopPropagation();
          onVesselSelect("LCX");
        }}
      />

      <primitive object={rcaTube} />
      <primitive object={rcaGlowTube} />

      <primitive
        object={rcaHitTube}
        onPointerOver={(e: any) => {
          e.stopPropagation();
          setHoveredVessel("RCA");
        }}
        onPointerOut={(e: any) => {
          e.stopPropagation();
          setHoveredVessel(null);
        }}
        onClick={(e: any) => {
          e.stopPropagation();
          onVesselSelect("RCA");
        }}
      />
    </>
  );
}

export default function HeartScene({
  vessels,
  selectedVessel,
  onVesselSelect,
}: HeartSceneProps) {
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

          <HeartModel
            vessels={vessels}
            selectedVessel={selectedVessel}
            onVesselSelect={onVesselSelect}
          />


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