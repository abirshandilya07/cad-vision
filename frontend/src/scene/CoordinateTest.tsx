export default function CoordinateTest() {
  return (
    <mesh position={[-0.078737, -0.000840, 0.055505]}>
      <sphereGeometry args={[0.03, 32, 32]} />
      <meshBasicMaterial
        color="lime"
        depthTest={false}
      />
    </mesh>
  );
}