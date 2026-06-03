import * as THREE from "three";
import {
  isCircleType,
  safeColor,
  type CanvasComp,
  type CompType,
} from "@/components/templates/studio/core";

/** The larger board dimension maps to this many world units. */
const TARGET_WORLD = 6;
/** Vertical exaggeration so low pieces still read with height. */
const VERT = 2.4;

type Disposable = { dispose: () => void };

/** Realistic piece height in board millimetres (footprint comes from the comp). */
function heightMm(t: CompType): number {
  switch (t) {
    case "card": return 0.5;
    case "token": case "coin": case "marker": return 3;
    case "tile": return 4;
    case "die": case "cube": return 15;
    case "pawn": return 30;
    case "meeple": return 24;
    case "deck": return 20;
    case "board": case "hex": return 2;
    default: return 6;
  }
}

/** Small helper to register a mesh's geometry + material for disposal. */
function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, disp: Disposable[]): THREE.Mesh {
  disp.push(geo, mat);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function std(color: THREE.ColorRepresentation, opts: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.1, ...opts });
}

// ── Per-type builders. Each returns an Object3D with its base at y=0. ──────────

function buildCard(w: number, d: number, h: number, color: THREE.Color, disp: Disposable[], map?: THREE.Texture): THREE.Object3D {
  const mat = std(color, { roughness: 0.3, metalness: 0.05 });
  if (map) mat.map = map;
  const card = mesh(new THREE.BoxGeometry(w, h, d), mat, disp);
  card.position.y = h / 2;
  // Thin gold edge so cards read as cards, not slabs.
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    new THREE.LineBasicMaterial({ color: 0xf5c451, transparent: true, opacity: 0.35 }),
  );
  disp.push(edge.geometry, edge.material as THREE.Material);
  edge.position.y = h / 2;
  const g = new THREE.Group(); g.add(card, edge);
  return g;
}

function buildDisc(diam: number, h: number, color: THREE.Color, disp: Disposable[], metal = false): THREE.Object3D {
  const body = mesh(
    new THREE.CylinderGeometry(diam / 2, diam / 2, h, 48),
    std(color, metal ? { metalness: 0.7, roughness: 0.25 } : { roughness: 0.5 }),
    disp,
  );
  body.position.y = h / 2;
  // Raised rim ring.
  const ring = mesh(
    new THREE.TorusGeometry(diam / 2 * 0.92, Math.max(0.004, diam * 0.03), 10, 48),
    std(0xf5c451, { metalness: 0.8, roughness: 0.2 }),
    disp,
  );
  ring.rotation.x = Math.PI / 2; ring.position.y = h;
  const g = new THREE.Group(); g.add(body, ring);
  return g;
}

function buildDie(size: number, color: THREE.Color, disp: Disposable[]): THREE.Object3D {
  const g = new THREE.Group();
  const cube = mesh(new THREE.BoxGeometry(size, size, size), std(color, { roughness: 0.35 }), disp);
  cube.position.y = size / 2;
  g.add(cube);
  // Five pips on the top face.
  const pipMat = std(0x0a0a0a, { roughness: 0.6 });
  disp.push(pipMat);
  const r = size * 0.07;
  const o = size * 0.27;
  const spots: [number, number][] = [[-o, -o], [o, -o], [0, 0], [-o, o], [o, o]];
  for (const [px, pz] of spots) {
    const geo = new THREE.SphereGeometry(r, 12, 12);
    disp.push(geo);
    const pip = new THREE.Mesh(geo, pipMat);
    pip.position.set(px, size + r * 0.3, pz);
    pip.scale.y = 0.4;
    g.add(pip);
  }
  return g;
}

function buildPawn(diam: number, height: number, color: THREE.Color, disp: Disposable[]): THREE.Object3D {
  const g = new THREE.Group();
  const mat = std(color, { roughness: 0.3, metalness: 0.15 });
  disp.push(mat);
  // Flared base
  const baseGeo = new THREE.CylinderGeometry(diam * 0.42, diam * 0.5, height * 0.16, 32);
  disp.push(baseGeo);
  const base = new THREE.Mesh(baseGeo, mat); base.castShadow = true; base.position.y = height * 0.08;
  // Tapered stem
  const stemGeo = new THREE.CylinderGeometry(diam * 0.18, diam * 0.34, height * 0.5, 32);
  disp.push(stemGeo);
  const stem = new THREE.Mesh(stemGeo, mat); stem.castShadow = true; stem.position.y = height * 0.4;
  // Collar + head
  const collarGeo = new THREE.SphereGeometry(diam * 0.26, 24, 16);
  disp.push(collarGeo);
  const collar = new THREE.Mesh(collarGeo, mat); collar.castShadow = true; collar.position.y = height * 0.68; collar.scale.y = 0.5;
  const headGeo = new THREE.SphereGeometry(diam * 0.28, 24, 20);
  disp.push(headGeo);
  const head = new THREE.Mesh(headGeo, mat); head.castShadow = true; head.position.y = height * 0.86;
  g.add(base, stem, collar, head);
  return g;
}

function buildMeeple(w: number, height: number, color: THREE.Color, disp: Disposable[]): THREE.Object3D {
  const g = new THREE.Group();
  const mat = std(color, { roughness: 0.4 });
  disp.push(mat);
  const u = w; // overall width scale
  const add = (geo: THREE.BufferGeometry, x: number, y: number, z = 0, rz = 0) => {
    disp.push(geo);
    const m = new THREE.Mesh(geo, mat); m.castShadow = true;
    m.position.set(x, y, z); m.rotation.z = rz; g.add(m);
  };
  // Head
  add(new THREE.SphereGeometry(u * 0.2, 20, 16), 0, height * 0.8);
  // Torso (tapered)
  add(new THREE.CylinderGeometry(u * 0.16, u * 0.26, height * 0.42, 20), 0, height * 0.5);
  // Arms
  add(new THREE.CapsuleGeometry(u * 0.07, height * 0.28, 4, 8), u * 0.26, height * 0.52, 0, Math.PI / 4);
  add(new THREE.CapsuleGeometry(u * 0.07, height * 0.28, 4, 8), -u * 0.26, height * 0.52, 0, -Math.PI / 4);
  // Legs
  add(new THREE.CapsuleGeometry(u * 0.09, height * 0.3, 4, 8), u * 0.12, height * 0.18);
  add(new THREE.CapsuleGeometry(u * 0.09, height * 0.3, 4, 8), -u * 0.12, height * 0.18);
  return g;
}

function buildDeck(w: number, d: number, h: number, color: THREE.Color, disp: Disposable[], map?: THREE.Texture): THREE.Object3D {
  const g = new THREE.Group();
  const topMat = std(color, { roughness: 0.3 });
  if (map) topMat.map = map;
  const top = mesh(new THREE.BoxGeometry(w, h, d), topMat, disp);
  top.position.y = h / 2; g.add(top);
  // Striations to suggest stacked cards.
  for (let k = 1; k <= 4; k++) {
    const lg = new THREE.BoxGeometry(w * 1.002, h * 0.02, d * 1.002);
    disp.push(lg);
    const lm = std(0x000000, { roughness: 0.9 }); disp.push(lm);
    const line = new THREE.Mesh(lg, lm);
    line.position.y = (h / 5) * k;
    g.add(line);
  }
  return g;
}

function buildFlat(w: number, d: number, h: number, color: THREE.Color, circle: boolean, disp: Disposable[], map?: THREE.Texture): THREE.Object3D {
  const mat = std(color, { roughness: 0.7 });
  if (map) mat.map = map;
  const geo = circle
    ? new THREE.CylinderGeometry(w / 2, w / 2, h, 40)
    : new THREE.BoxGeometry(w, h, d);
  const m = mesh(geo, mat, disp);
  m.position.y = h / 2;
  return m;
}

/** Renders text onto a transparent canvas texture so labels appear on the board. */
function textTexture(text: string, color: string, disp: Disposable[]): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = color || "#e8d5b8";
  ctx.font = "bold 70px Georgia, serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text.slice(0, 32), c.width / 2, c.height / 2, c.width - 24);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4; disp.push(tex);
  return tex;
}

/**
 * Builds the real game board — every visible component becomes a realistic 3D
 * piece (cards lie flat, tokens are discs, dice show pips, pawns/meeples are
 * figures) sized, placed, coloured and rotated from its canvas definition.
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
  const disp: Disposable[] = [];
  const added: THREE.Object3D[] = [];
  const surfaceY = 0.03;

  const boardGeo = new THREE.BoxGeometry(bw, 0.05, bh);
  const boardMat = std(0x12161d, { roughness: 0.92, metalness: 0.02 });
  const boardMesh = mesh(boardGeo, boardMat, disp);
  boardMesh.position.y = 0.005;
  scene.add(boardMesh); added.push(boardMesh);

  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(bw + 0.02, 0.06, bh + 0.02));
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xf5c451, transparent: true, opacity: 0.3 });
  disp.push(edges, edgeMat);
  const border = new THREE.LineSegments(edges, edgeMat); border.position.y = 0.012;
  scene.add(border); added.push(border);

  const loader = new THREE.TextureLoader();

  comps.filter((c) => c.visible).forEach((c, i) => {
    const w = Math.max(0.03, c.width * scale);
    const d = Math.max(0.03, c.height * scale);
    const diam = Math.min(w, d);
    const h = Math.max(0.01, heightMm(c.type) * scale * VERT);
    const cx = (c.x + c.width / 2 - boardW / 2) * scale;
    const cz = (c.y + c.height / 2 - boardH / 2) * scale;
    const color = new THREE.Color(safeColor(c.fill, "#1a2535"));

    // Texture from the component's artwork (CORS-enabled; tolerates failure).
    let map: THREE.Texture | undefined;
    const wantMap = c.type === "card" || c.type === "deck" || c.type === "tile" || c.type === "board";
    if (c.image && wantMap) {
      map = loader.load(c.image, (t) => { t.colorSpace = THREE.SRGBColorSpace; }, undefined, () => {});
      disp.push(map);
    }

    let obj: THREE.Object3D;
    switch (c.type) {
      case "card": obj = buildCard(w, d, h, color, disp, map); break;
      case "deck": obj = buildDeck(w, d, h, color, disp, map); break;
      case "die": case "cube": obj = buildDie(diam, color, disp); break;
      case "pawn": obj = buildPawn(diam, h, color, disp); break;
      case "meeple": obj = buildMeeple(w, h, color, disp); break;
      case "token": case "coin": case "marker":
        obj = buildDisc(diam, h, color, disp, c.type === "coin"); break;
      default:
        obj = buildFlat(w, d, h, color, isCircleType(c.type), disp, map);
    }

    obj.position.set(cx, surfaceY + i * 0.0008, cz);
    obj.rotation.y = (-c.rotation * Math.PI) / 180;
    obj.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(obj); added.push(obj);

    // Text label as a flat plane just above the piece.
    if (c.type === "text" && c.text) {
      const tex = textTexture(c.text, c.textColor ?? "#e8d5b8", disp);
      const pgeo = new THREE.PlaneGeometry(w, d); disp.push(pgeo);
      const pmat = new THREE.MeshBasicMaterial({ map: tex, transparent: true }); disp.push(pmat);
      const plane = new THREE.Mesh(pgeo, pmat);
      plane.rotation.x = -Math.PI / 2;
      plane.rotation.z = (-c.rotation * Math.PI) / 180;
      plane.position.set(cx, surfaceY + h + 0.01 + i * 0.0008, cz);
      scene.add(plane); added.push(plane);
    }
  });

  return () => {
    for (const o of added) scene.remove(o);
    for (const x of disp) x.dispose();
  };
}
