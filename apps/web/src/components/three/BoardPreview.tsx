"use client";

/**
 * BoardPreview — 3D tabletop scene using plain Three.js (no R3F).
 * R3F v8 is incompatible with React 19; this implementation avoids the
 * react-reconciler dependency entirely.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildBoardScene } from "./realBoard";
import type { CanvasComp } from "@/components/templates/studio/core";

/** Duration (seconds) of one full cinematic flythrough loop. */
export const FLYTHROUGH_DURATION = 12;

export interface BoardPreviewProps {
  gameId?: string;
  height?: number;
  disableControls?: boolean;
  gameTitle?: string;
  className?: string;
  /** Run a scripted cinematic camera path (orbit + dolly) instead of drag-orbit. */
  flythrough?: boolean;
  /** Receives the WebGL canvas once mounted — used to record a demo video. */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  /** Real game components to render. When omitted, a stylised placeholder is shown. */
  components?: CanvasComp[];
  /** Board (canvas) size in mm — used to scale/place real components. */
  boardWidth?: number;
  boardHeight?: number;
}

export function BoardPreview({
  gameId: _gameId,
  height = 480,
  disableControls = false,
  gameTitle,
  className = "",
  flythrough = false,
  onCanvasReady,
  components,
  boardWidth,
  boardHeight,
}: BoardPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  // Read latest callback via ref so it isn't a render-loop dependency.
  const onCanvasReadyRef = useRef(onCanvasReady);
  onCanvasReadyRef.current = onCanvasReady;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // ── Renderer ───────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);
    onCanvasReadyRef.current?.(renderer.domElement);

    // ── Scene + Camera ─────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 14, 22);

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 5.5, 6.5);
    camera.lookAt(0, 0.2, 0);

    // ── Lights ─────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffe4b0, 0.4));

    const key = new THREE.DirectionalLight(0xfff5e0, 2.8);
    key.position.set(3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 30;
    key.shadow.camera.left = -6; key.shadow.camera.right = 6;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
    key.shadow.bias = -0.001;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc8d8e0, 0.6);
    fill.position.set(-4, 3, -2);
    scene.add(fill);

    const rim = new THREE.PointLight(0xffd4a0, 1.2, 14, 2);
    rim.position.set(-2, 2, -4);
    scene.add(rim);

    const emerald = new THREE.PointLight(0x7c5cff, 0.25, 4, 2);
    emerald.position.set(0, 1.5, 0);
    scene.add(emerald);

    // ── Table surface ──────────────────────────────────────────────────────
    const tableGeo = new THREE.PlaneGeometry(12, 12);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x1c140f, roughness: 0.85, metalness: 0.02 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.rotation.x = -Math.PI / 2;
    table.position.y = -0.02;
    table.receiveShadow = true;
    scene.add(table);

    // ── Board contents: real game components, or a stylised placeholder ──────
    let tokens: THREE.Mesh[] = [];
    let disposeReal: (() => void) | null = null;

    if (components && components.length > 0) {
      disposeReal = buildBoardScene(scene, components, boardWidth ?? 800, boardHeight ?? 600);
    } else {
      // ── Game board (placeholder) ─────────────────────────────────────────
      const boardGeo = new THREE.BoxGeometry(4.2, 0.045, 3.2);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0x1a2535, roughness: 0.9 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(0, 0.015, 0);
      board.castShadow = true;
      board.receiveShadow = true;
      scene.add(board);

      // Board border
      const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(4.22, 0.05, 3.22));
      const borderMat = new THREE.LineBasicMaterial({ color: 0xf5c451, transparent: true, opacity: 0.3 });
      scene.add(new THREE.LineSegments(borderGeo, borderMat).translateY(0.015));

      // ── Cards ────────────────────────────────────────────────────────────
      const cardPositions: [number, number, number, number, string][] = [
        [-0.9, 0.06, -0.4, 0.15, "#7c5cff"],
        [-0.2, 0.065, 0.2, -0.08, "#f5c451"],
        [0.7, 0.06, -0.5, 0.22, "#00e5ff"],
        [0.9, 0.06, 0.3, -0.18, "#ff3b5c"],
      ];
      cardPositions.forEach(([cx, cy, cz, ry, accent]) => {
        const cg = new THREE.BoxGeometry(0.63, 0.009, 0.88);
        const cm = new THREE.MeshStandardMaterial({ color: 0x1a2535, roughness: 0.25, metalness: 0.1 });
        const card = new THREE.Mesh(cg, cm);
        card.position.set(cx, cy, cz);
        card.rotation.y = ry;
        card.castShadow = true;
        scene.add(card);

        // Accent pip
        const pip = new THREE.Mesh(
          new THREE.CircleGeometry(0.04, 16),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(accent), emissive: new THREE.Color(accent), emissiveIntensity: 1.2 })
        );
        pip.position.set(cx - 0.24, cy + 0.005, cz - 0.36);
        pip.rotation.set(-Math.PI / 2, 0, ry);
        scene.add(pip);
      });

      // ── Token helper ───────────────────────────────────────────────────────
      const makeToken = (x: number, z: number, color: number) => {
        const tg = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 32);
        const tm = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.7, emissive: color, emissiveIntensity: 0.15 });
        const tok = new THREE.Mesh(tg, tm);
        tok.position.set(x, 0.075, z);
        tok.castShadow = true;
        scene.add(tok);

        const rim2 = new THREE.Mesh(
          new THREE.TorusGeometry(0.17, 0.012, 8, 32),
          new THREE.MeshStandardMaterial({ color: 0xf5c451, roughness: 0.1, metalness: 0.9, emissive: 0xf5c451, emissiveIntensity: 0.3 })
        );
        rim2.position.set(x, 0.075, z);
        rim2.rotation.x = Math.PI / 2;
        scene.add(rim2);

        return tok;
      };

      tokens = [
        makeToken(-1.2, 0.7, 0x7c5cff),
        makeToken(-0.5, -0.8, 0xf5c451),
        makeToken(0.3, 0.85, 0xff3b5c),
        makeToken(1.1, 0.6, 0x00e5ff),
      ];
    }

    // ── Mouse orbit ────────────────────────────────────────────────────────
    let autoRotY = 0;
    let isDragging = false;
    let lastX = 0;
    let phi = Math.PI / 4;
    let theta = 0;
    const radius = 8.5;

    function updateCamera() {
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi) + 0.2;
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0.2, 0);
    }

    if (!disableControls && !flythrough) {
      mount.addEventListener("mousedown", (e) => { isDragging = true; lastX = e.clientX; });
      mount.addEventListener("mouseup", () => { isDragging = false; });
      mount.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        theta -= (e.clientX - lastX) * 0.005;
        lastX = e.clientX;
      });
      mount.addEventListener("wheel", (e) => {
        phi = Math.max(0.3, Math.min(Math.PI / 2.1, phi + e.deltaY * 0.002));
        updateCamera();
      }, { passive: true });
    }

    // ── Animate ────────────────────────────────────────────────────────────
    let frameId: number;
    const clock = new THREE.Clock();

    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (flythrough) {
        // Scripted cinematic path: a full orbit while dollying in/out and
        // tilting, so a recorded clip reads as a polished demo flythrough.
        const u = (t % FLYTHROUGH_DURATION) / FLYTHROUGH_DURATION;
        const fTheta = u * Math.PI * 2;
        const fPhi = 0.62 + 0.26 * Math.sin(u * Math.PI * 2);
        const fRadius = 7.6 + 2.4 * Math.cos(u * Math.PI * 2);
        camera.position.x = fRadius * Math.sin(fPhi) * Math.sin(fTheta);
        camera.position.y = fRadius * Math.cos(fPhi) + 0.3;
        camera.position.z = fRadius * Math.sin(fPhi) * Math.cos(fTheta);
        camera.lookAt(0, 0.2, 0);
      } else {
        // Auto-rotate
        if (!isDragging) { autoRotY += 0.003; theta = autoRotY; }
        if (!disableControls) updateCamera();
      }

      // Floating tokens
      tokens.forEach((tok, i) => {
        tok.position.y = 0.075 + Math.sin(t * 0.6 + i * 1.2) * 0.005;
      });

      renderer.render(scene, camera);
    }

    animate();

    // ── Resize ────────────────────────────────────────────────────────────
    const obs = new ResizeObserver(() => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    });
    obs.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      obs.disconnect();
      renderer.dispose();
      disposeReal?.();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [disableControls, flythrough, components, boardWidth, boardHeight]);

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`} style={{ height }} aria-label="3D board game preview">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-rich-wood-dark/50 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-rich-wood-dark/70 to-transparent z-10" />

      {/* Corner accents */}
      {["top-3 left-3 border-t-2 border-l-2 rounded-tl","top-3 right-3 border-t-2 border-r-2 rounded-tr","bottom-3 left-3 border-b-2 border-l-2 rounded-bl","bottom-3 right-3 border-b-2 border-r-2 rounded-br"].map(cls => (
        <div key={cls} className={`pointer-events-none absolute w-5 h-5 z-20 border-emerald-glow/30 ${cls}`} />
      ))}

      {gameTitle && (
        <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
          <p className="font-display text-parchment-light text-lg font-semibold tracking-display drop-shadow-lg">{gameTitle}</p>
        </div>
      )}
      {!disableControls && !flythrough && (
        <div className="absolute bottom-6 right-6 z-20 pointer-events-none">
          <p className="text-soft-gray text-2xs font-ui tracking-wider uppercase opacity-60">Drag to rotate</p>
        </div>
      )}
    </div>
  );
}

export default BoardPreview;
