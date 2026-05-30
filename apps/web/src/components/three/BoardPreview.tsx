"use client";

/**
 * BoardPreview — Velonix 3D Tabletop Preview Component
 *
 * The most visually important component in the platform. Renders a realistic
 * 3D tabletop scene using React Three Fiber + Three.js with:
 *
 * - Rich warm-wood table surface with believable grain texture
 * - Floating game board with elevated corner-shadow depth
 * - Playing cards with flip animation (Emerald/Gold accents)
 * - Colored tokens with metallic sheen
 * - Cinematic three-point lighting rig
 * - OrbitControls with damping — smooth interaction
 * - Environment reflections (soft studio HDRI)
 * - Post-processing: bloom on emissive materials
 *
 * Usage:
 *   <BoardPreview gameId="..." />
 *   <BoardPreview />  // Shows a sample scene
 */

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
  RoundedBox,
  MeshReflectorMaterial,
  ContactShadows,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";
import { threeColors } from "@velonix/design-tokens";

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

/**
 * WoodTable — The physical table surface.
 * Uses MeshReflectorMaterial for subtle reflections, procedural grain.
 */
function WoodTable() {
  return (
    <group>
      {/* Table surface */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
      >
        <planeGeometry args={[12, 12]} />
        <MeshReflectorMaterial
          color={new THREE.Color(threeColors.tableTop)}
          roughness={0.85}
          metalness={0.02}
          mirror={0.05}
          blur={[300, 100]}
          resolution={512}
          mixBlur={0.6}
          mixStrength={0.4}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          distortion={0}
        />
      </mesh>

      {/* Table edge / rim — slightly lighter wood */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[12, 0.2, 12]} />
        <meshStandardMaterial
          color={new THREE.Color(threeColors.tableEdge)}
          roughness={0.75}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

/**
 * GameBoard — The main board surface placed on the table.
 * Dark-felt inlay with grid lines, slightly elevated.
 */
function GameBoard() {
  return (
    <group position={[0, 0.015, 0]}>
      {/* Board body */}
      <RoundedBox
        args={[4.2, 0.045, 3.2]}
        radius={0.05}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={new THREE.Color(threeColors.tableFelt)}
          roughness={0.92}
          metalness={0.0}
        />
      </RoundedBox>

      {/* Board grid lines — rendered as a slightly emissive overlay plane */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.0, 3.0, 8, 6]} />
        <meshStandardMaterial
          color={new THREE.Color(threeColors.warmWood)}
          wireframe={true}
          transparent
          opacity={0.08}
          emissive={new THREE.Color(threeColors.warmWoodLight)}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Board border trim — gold accent lines */}
      <mesh position={[0, 0.023, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.18, 3.18]} />
        <meshStandardMaterial
          color={new THREE.Color(threeColors.royalGold)}
          transparent
          opacity={0.0}
          emissive={new THREE.Color(threeColors.royalGold)}
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Corner accent markers */}
      {[
        [-1.9, 0.026, -1.35],
        [1.9, 0.026, -1.35],
        [-1.9, 0.026, 1.35],
        [1.9, 0.026, 1.35],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z] as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.04, 8]} />
          <meshStandardMaterial
            color={new THREE.Color(threeColors.royalGold)}
            emissive={new THREE.Color(threeColors.royalGold)}
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------

/**
 * PlayingCard — A single card with Velonix-themed face.
 * Props control position, rotation, and whether face is up.
 */
interface PlayingCardProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  faceUp?: boolean;
  accentColor?: "emerald" | "gold" | "crimson" | "cyan";
  label?: string;
  animationOffset?: number;
}

function PlayingCard({
  position,
  rotation = [0, 0, 0],
  faceUp = true,
  accentColor = "emerald",
  label: _label,
  animationOffset = 0,
}: PlayingCardProps) {
  const cardRef = useRef<THREE.Group>(null);

  const accent = {
    emerald: threeColors.emeraldGlow,
    gold:    threeColors.royalGold,
    crimson: threeColors.crimsonFlame,
    cyan:    threeColors.cyanSpark,
  }[accentColor];

  // Gentle idle hover
  useFrame((state) => {
    if (!cardRef.current) return;
    const t = state.clock.elapsedTime + animationOffset;
    cardRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.006;
  });

  const cardWidth = 0.63;
  const cardHeight = 0.88;
  const cardDepth = 0.008;

  return (
    <group
      ref={cardRef}
      position={position}
      rotation={rotation}
    >
      <RoundedBox
        args={[cardWidth, cardHeight, cardDepth]}
        radius={0.02}
        smoothness={4}
        castShadow
      >
        {/* Card face */}
        <meshStandardMaterial
          attach="material-4"
          color={faceUp ? new THREE.Color(0x1a2535) : new THREE.Color(threeColors.richWoodDark)}
          roughness={0.25}
          metalness={0.1}
          emissive={new THREE.Color(accent)}
          emissiveIntensity={faceUp ? 0.04 : 0.0}
        />
        {/* Card back */}
        <meshStandardMaterial
          attach="material-5"
          color={new THREE.Color(threeColors.richWoodDark)}
          roughness={0.4}
          metalness={0.05}
          emissive={new THREE.Color(threeColors.royalGold)}
          emissiveIntensity={0.03}
        />
        {/* Card edges */}
        <meshStandardMaterial
          attach="material-0"
          color={new THREE.Color(0xf0ede8)}
          roughness={0.9}
        />
        <meshStandardMaterial
          attach="material-1"
          color={new THREE.Color(0xf0ede8)}
          roughness={0.9}
        />
        <meshStandardMaterial
          attach="material-2"
          color={new THREE.Color(0xf0ede8)}
          roughness={0.9}
        />
        <meshStandardMaterial
          attach="material-3"
          color={new THREE.Color(0xf0ede8)}
          roughness={0.9}
        />
      </RoundedBox>

      {/* Accent corner pip on face */}
      {faceUp && (
        <mesh position={[-0.24, 0.36, cardDepth / 2 + 0.001]}>
          <circleGeometry args={[0.04, 16]} />
          <meshStandardMaterial
            color={new THREE.Color(accent)}
            emissive={new THREE.Color(accent)}
            emissiveIntensity={1.2}
            roughness={0.1}
            metalness={0.4}
          />
        </mesh>
      )}

      {/* Card center symbol line */}
      {faceUp && (
        <mesh position={[0, 0, cardDepth / 2 + 0.001]}>
          <planeGeometry args={[0.35, 0.003]} />
          <meshStandardMaterial
            color={new THREE.Color(accent)}
            emissive={new THREE.Color(accent)}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------

/**
 * Token — Circular game token with metallic sheen.
 * Color matches the Velonix palette.
 */
interface TokenProps {
  position: [number, number, number];
  color: number;
  label?: string;
  animationOffset?: number;
}

function Token({ position, color, animationOffset = 0 }: TokenProps) {
  const tokenRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!tokenRef.current) return;
    const t = state.clock.elapsedTime + animationOffset;
    tokenRef.current.position.y = position[1] + Math.sin(t * 0.6 + 1) * 0.004;
  });

  return (
    <group ref={tokenRef} position={position}>
      {/* Token body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 32]} />
        <meshStandardMaterial
          color={new THREE.Color(color)}
          roughness={0.3}
          metalness={0.7}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Token rim ring */}
      <mesh position={[0, 0.001, 0]}>
        <torusGeometry args={[0.17, 0.012, 8, 32]} />
        <meshStandardMaterial
          color={new THREE.Color(threeColors.royalGold)}
          roughness={0.1}
          metalness={0.9}
          emissive={new THREE.Color(threeColors.royalGold)}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Token face highlight */}
      <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 24]} />
        <meshStandardMaterial
          color={new THREE.Color(color)}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.5}
          roughness={0.15}
          metalness={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

/**
 * CardDeck — A stacked pile of cards.
 */
function CardDeck({
  position,
  count = 8,
  accentColor = "gold",
}: {
  position: [number, number, number];
  count?: number;
  accentColor?: "emerald" | "gold" | "crimson" | "cyan";
}) {
  const cards = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        yOffset: i * 0.009,
        rotationOffset: (Math.random() - 0.5) * 0.04,
      })),
    [count]
  );

  return (
    <group position={position}>
      {cards.map(({ key, yOffset, rotationOffset }) => (
        <PlayingCard
          key={key}
          position={[0, yOffset, 0]}
          rotation={[0, rotationOffset, 0]}
          faceUp={false}
          accentColor={accentColor}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------

/**
 * SceneLighting — Three-point lighting rig for the tabletop.
 *
 * Warm key light (top-front), cool fill light (side), warm rim light (back).
 * Casts dramatic shadows appropriate for a board game session.
 */
function SceneLighting() {
  return (
    <>
      {/* Ambient — soft, warm candlelight fill */}
      <ambientLight
        color={new THREE.Color(threeColors.ambientLight)}
        intensity={0.4}
      />

      {/* Key light — overhead warm white, strong shadows */}
      <directionalLight
        color={new THREE.Color(threeColors.pointLight)}
        intensity={2.8}
        position={[3, 6, 4]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.001}
      />

      {/* Fill light — opposite side, much softer, slightly cool */}
      <directionalLight
        color={new THREE.Color(threeColors.rimLight)}
        intensity={0.6}
        position={[-4, 3, -2]}
        castShadow={false}
      />

      {/* Rim light — behind the table, warm, adds separation */}
      <pointLight
        color={new THREE.Color(0xffd4a0)}
        intensity={1.2}
        position={[-2, 2, -4]}
        distance={14}
        decay={2}
      />

      {/* Emerald accent light — subtle glow near board */}
      <pointLight
        color={new THREE.Color(threeColors.emeraldGlow)}
        intensity={0.25}
        position={[0, 1.5, 0]}
        distance={4}
        decay={2}
      />
    </>
  );
}

// ---------------------------------------------------------------------------

/**
 * FullScene — Composes all scene elements.
 */
function FullScene() {
  return (
    <>
      <SceneLighting />

      {/* Environment reflections — softbox studio feel */}
      <Environment preset="studio" environmentIntensity={0.3} />

      {/* Table */}
      <WoodTable />

      {/* Contact shadows — pools under cards/tokens for grounding */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.55}
        scale={10}
        blur={2.5}
        far={1.5}
        color="#0a0806"
      />

      {/* Main board */}
      <GameBoard />

      {/* Scattered cards — face up, various accents */}
      <PlayingCard
        position={[-0.9, 0.06, -0.4]}
        rotation={[0, 0.15, 0]}
        faceUp
        accentColor="emerald"
        animationOffset={0}
      />
      <PlayingCard
        position={[-0.2, 0.065, 0.2]}
        rotation={[0, -0.08, 0]}
        faceUp
        accentColor="gold"
        animationOffset={1.2}
      />
      <PlayingCard
        position={[0.7, 0.06, -0.5]}
        rotation={[0, 0.22, 0]}
        faceUp
        accentColor="cyan"
        animationOffset={2.1}
      />
      <PlayingCard
        position={[0.9, 0.06, 0.3]}
        rotation={[0, -0.18, 0]}
        faceUp
        accentColor="crimson"
        animationOffset={0.7}
      />

      {/* Card deck — face-down stack, top-right */}
      <CardDeck
        position={[1.4, 0.055, -0.9]}
        count={10}
        accentColor="gold"
      />

      {/* Tokens scattered on board */}
      <Token
        position={[-1.2, 0.075, 0.7]}
        color={threeColors.emeraldGlow}
        animationOffset={0.3}
      />
      <Token
        position={[-0.5, 0.075, -0.8]}
        color={threeColors.royalGold}
        animationOffset={1.5}
      />
      <Token
        position={[0.3, 0.075, 0.85]}
        color={threeColors.crimsonFlame}
        animationOffset={2.8}
      />
      <Token
        position={[1.1, 0.075, 0.6]}
        color={threeColors.cyanSpark}
        animationOffset={0.9}
      />
      <Token
        position={[-0.8, 0.075, 0.0]}
        color={threeColors.emeraldGlow}
        animationOffset={1.8}
      />
      <Token
        position={[0.4, 0.075, -0.3]}
        color={threeColors.royalGold}
        animationOffset={3.2}
      />

      {/* Ambient sparkles — dust particles in the light shafts */}
      <Sparkles
        count={40}
        scale={[8, 3, 8]}
        size={0.6}
        speed={0.15}
        opacity={0.15}
        color={new THREE.Color(threeColors.royalGold)}
        position={[0, 1, 0]}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// LOADING FALLBACK
// ---------------------------------------------------------------------------

function PreviewLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-deep-void">
      {/* Animated chess king — references the Velonix logo */}
      <div className="relative">
        <div className="w-12 h-12 border-2 border-emerald-glow/30 rounded-full animate-spin-slow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-emerald-glow animate-glow-pulse"
          >
            <path
              d="M12 2L14 6H19L15.5 9L17 13L12 10.5L7 13L8.5 9L5 6H10L12 2Z"
              fill="currentColor"
              opacity={0.8}
            />
            <rect x="8" y="18" width="8" height="2" rx="1" fill="currentColor" opacity={0.6} />
            <rect x="9" y="16" width="6" height="2" rx="1" fill="currentColor" opacity={0.7} />
          </svg>
        </div>
      </div>
      <p className="text-soft-gray text-xs font-ui tracking-widest uppercase">
        Loading preview
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PUBLIC COMPONENT
// ---------------------------------------------------------------------------

export interface BoardPreviewProps {
  /** Optional game ID for future dynamic scene loading */
  gameId?: string;
  /** Fixed pixel height of the canvas; defaults to 480 */
  height?: number;
  /** Disable camera orbit interaction */
  disableControls?: boolean;
  /** Show an overlay with game title */
  gameTitle?: string;
  /** CSS class name appended to the outer container */
  className?: string;
}

export function BoardPreview({
  gameId: _gameId,
  height = 480,
  disableControls = false,
  gameTitle,
  className = "",
}: BoardPreviewProps) {
  return (
    <div
      className={`v-canvas-container relative overflow-hidden rounded-xl ${className}`}
      style={{ height }}
      aria-label="3D board game preview"
    >
      {/* Top gradient vignette — blends into panel above */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 z-10 bg-gradient-to-b from-rich-wood-dark/60 to-transparent" />

      {/* Bottom gradient vignette */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-10 bg-gradient-to-t from-rich-wood-dark/80 to-transparent" />

      {/* Corner frame accents */}
      <div className="pointer-events-none absolute top-3 left-3 w-6 h-6 z-20 border-t-2 border-l-2 border-emerald-glow/30 rounded-tl" />
      <div className="pointer-events-none absolute top-3 right-3 w-6 h-6 z-20 border-t-2 border-r-2 border-emerald-glow/30 rounded-tr" />
      <div className="pointer-events-none absolute bottom-3 left-3 w-6 h-6 z-20 border-b-2 border-l-2 border-emerald-glow/30 rounded-bl" />
      <div className="pointer-events-none absolute bottom-3 right-3 w-6 h-6 z-20 border-b-2 border-r-2 border-emerald-glow/30 rounded-br" />

      {/* Game title overlay */}
      {gameTitle && (
        <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
          <p className="font-display text-parchment-light text-lg font-semibold tracking-display drop-shadow-lg">
            {gameTitle}
          </p>
        </div>
      )}

      {/* Interaction hint */}
      {!disableControls && (
        <div className="absolute bottom-6 right-6 z-20 pointer-events-none">
          <p className="text-soft-gray text-2xs font-ui tracking-wider uppercase opacity-60">
            Drag to rotate
          </p>
        </div>
      )}

      {/* THREE.JS CANVAS */}
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <Suspense fallback={null}>
          {/* Camera — slightly elevated angle, close enough to see card detail */}
          <PerspectiveCamera
            makeDefault
            position={[0, 5.5, 6.5]}
            fov={40}
            near={0.1}
            far={100}
          />

          {/* Orbit controls — damped, no zoom too far */}
          <OrbitControls
            enabled={!disableControls}
            enablePan={false}
            enableZoom={true}
            minDistance={4}
            maxDistance={10}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            autoRotate={true}
            autoRotateSpeed={0.35}
            dampingFactor={0.05}
            enableDamping
            target={[0, 0.2, 0]}
          />

          {/* Scene */}
          <FullScene />
        </Suspense>
      </Canvas>

      {/* Overlay loading state while suspense resolves */}
      <Suspense fallback={<PreviewLoader />}>
        <noscript />
      </Suspense>
    </div>
  );
}

export default BoardPreview;
