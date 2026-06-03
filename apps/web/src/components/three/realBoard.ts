import * as THREE from "three";
import {
  isCircleType,
  isSilhouetteType,
  safeColor,
  type CanvasComp,
  type CompType,
} from "@/components/templates/studio/core";

/** The larger board dimension maps to this many world units. */
const TARGET_WORLD = 6;
/** Multiplier so piece extrusions read as real height in the scene. */
const DEPTH_EXAGGERATE = 7;

/** Relative extrusion per component type, in board millimetres. */
function depthMm(t: CompType): number {
  switch (t) {
    case "token": case "coin": case "marker": return 10;
    case "die": case "cube": return 16;
    case "pawn": case "meeple": return 22;
    case "card": return 4;
    case "deck": return 14;
    case "board": return 3;
    case "hex": return 8;
    default: return 6;
  }
}

/** Renders text onto a transparent canvas texture so labels appear on the board. */
function textTexture(text: string, color: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = color || "#e8d5b8";
  ctx.font = "bold 64px var(--font-display), serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.slice(0, 40), c.width / 2, c.height / 2, c.width - 20);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

/**
 * Builds the real game board — every visible component becomes a 3D mesh sized,
 * placed, coloured and rotated from its canvas definition. Returns a disposer.
 */
export function buildBoardScene(
  scene: THREE.Scene,
  comps: CanvasComp[],
  boardW: number,
  boardH: number,
): () => void {
  const scale = TARGET_WORLD / Math.max(boardW, boardH, 1);
  const bw = boardW * scale;
  const bh = boardH * scale;
  const disposables: { dispose: () => void }[] = [];
  const added: THREE.Object3D[] = [];
  const track = (o: THREE.Object3D, ...d: { dispose: () => void }[]) => {
    scene.add(o); added.push(o); disposables.push(...d);
  };

  // ── Board surface (sized to the game's canvas aspect) ──────────────────────
  const boardGeo = new THREE.BoxGeometry(bw, 0.05, bh);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x12161d, roughness: 0.92, metalness: 0.02 });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.y = 0.005; board.receiveShadow = true;
  track(board, boardGeo, boardMat);

  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(bw + 0.02, 0.06, bh + 0.02));
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xf5c451, transparent: true, opacity: 0.3 });
  const border = new THREE.LineSegments(edges, edgeMat); border.position.y = 0.01;
  track(border, edges, edgeMat);

  const loader = new THREE.TextureLoader();

  // Canvas order = z-order (later draws on top); lift each slightly to avoid z-fight.
  comps.filter((c) => c.visible).forEach((c, i) => {
    const w = Math.max(0.02, c.width * scale);
    const d = Math.max(0.02, c.height * scale);
    const extr = Math.max(0.015, depthMm(c.type) * scale * DEPTH_EXAGGERATE);
    const cx = (c.x + c.width / 2 - boardW / 2) * scale;
    const cz = (c.y + c.height / 2 - boardH / 2) * scale;
    const color = new THREE.Color(safeColor(c.fill, "#1a2535"));

    const circle = isCircleType(c.type);
    const geo = circle
      ? new THREE.CylinderGeometry(w / 2, w / 2, extr, 40)
      : new THREE.BoxGeometry(w, extr, d);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: isSilhouetteType(c.type) ? 0.5 : 0.35,
      metalness: c.type === "coin" || c.type === "token" ? 0.6 : 0.1,
      emissive: color, emissiveIntensity: 0.06,
      transparent: c.opacity < 100, opacity: c.opacity / 100,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, 0.03 + extr / 2 + i * 0.0015, cz);
    mesh.rotation.y = (-c.rotation * Math.PI) / 180;
    mesh.castShadow = true; mesh.receiveShadow = true;
    track(mesh, geo, mat);

    // Real artwork on the top face (CORS-enabled; falls back to the fill colour).
    if (c.image) {
      loader.load(
        c.image,
        (tex) => { tex.colorSpace = THREE.SRGBColorSpace; mat.map = tex; mat.needsUpdate = true; disposables.push(tex); },
        undefined,
        () => { /* leave the fill colour */ },
      );
    }

    // Text label as a flat plane just above the piece.
    if (c.type === "text" && c.text) {
      const tex = textTexture(c.text, c.textColor ?? "#e8d5b8");
      const pgeo = new THREE.PlaneGeometry(w, d);
      const pmat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const plane = new THREE.Mesh(pgeo, pmat);
      plane.rotation.x = -Math.PI / 2;
      plane.rotation.z = (-c.rotation * Math.PI) / 180;
      plane.position.set(cx, 0.03 + extr + 0.01 + i * 0.0015, cz);
      track(plane, pgeo, pmat, tex);
    }
  });

  return () => {
    for (const o of added) scene.remove(o);
    for (const d of disposables) d.dispose();
  };
}
