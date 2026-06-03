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

/**
 * Geometry + material caches. Identical pieces (same type/size/colour) share GPU
 * resources instead of allocating per instance — a big win for boards with many
 * tokens/cards. Everything is disposed exactly once at teardown.
 */
class ResourcePool {
  private geo = new Map<string, THREE.BufferGeometry>();
  private mat = new Map<string, THREE.Material>();
  readonly extra: Disposable[] = []; // per-instance (textures, edges) — disposed once

  geometry<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
    let g = this.geo.get(key);
    if (!g) { g = make(); this.geo.set(key, g); }
    return g as T;
  }
  material<T extends THREE.Material>(key: string, make: () => T): T {
    let m = this.mat.get(key);
    if (!m) { m = make(); this.mat.set(key, m); }
    return m as T;
  }
  dispose() {
    this.geo.forEach((g) => g.dispose());
    this.mat.forEach((m) => m.dispose());
    this.extra.forEach((d) => d.dispose());
    this.geo.clear(); this.mat.clear();
  }
}

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

/** Quantise to stabilise cache keys (sub-mm differences shouldn't fork resources). */
const q = (n: number) => Math.round(n * 100) / 100;

function stdMat(pool: ResourcePool, color: THREE.Color, opts: { roughness?: number; metalness?: number; map?: THREE.Texture } = {}): THREE.MeshStandardMaterial {
  const rough = opts.roughness ?? 0.45;
  const metal = opts.metalness ?? 0.1;
  // Textured materials are unique per image and not pooled.
  if (opts.map) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, map: opts.map });
    pool.extra.push(m);
    return m;
  }
  return pool.material(`std:${color.getHexString()}:${rough}:${metal}`, () =>
    new THREE.MeshStandardMaterial({ color: color.clone(), roughness: rough, metalness: metal, emissive: color.clone(), emissiveIntensity: 0.06 }),
  );
}

// ── Builders. Each returns an Object3D with its base at y=0. ───────────────────

/** LOD disc for tokens/coins/markers: 48-seg + rim → 20-seg → 8-seg. */
function buildDisc(pool: ResourcePool, diam: number, h: number, color: THREE.Color, metal: boolean): THREE.Object3D {
  const lod = new THREE.LOD();
  const r = diam / 2;
  const mat = stdMat(pool, color, metal ? { metalness: 0.7, roughness: 0.25 } : { roughness: 0.5 });

  const cyl = (seg: number) => pool.geometry(`cyl:${q(r)}:${q(h)}:${seg}`, () => new THREE.CylinderGeometry(r, r, h, seg));

  // Near: detailed + gold rim.
  const near = new THREE.Group();
  const nearBody = new THREE.Mesh(cyl(48), mat); nearBody.position.y = h / 2; nearBody.castShadow = true; nearBody.receiveShadow = true;
  const rimMat = stdMat(pool, new THREE.Color(0xf5c451), { metalness: 0.8, roughness: 0.2 });
  const ring = new THREE.Mesh(pool.geometry(`rim:${q(r)}`, () => new THREE.TorusGeometry(r * 0.92, Math.max(0.004, diam * 0.03), 8, 32)), rimMat);
  ring.rotation.x = Math.PI / 2; ring.position.y = h;
  near.add(nearBody, ring);

  const midBody = new THREE.Mesh(cyl(20), mat); midBody.position.y = h / 2; midBody.castShadow = true;
  const farBody = new THREE.Mesh(cyl(8), mat); farBody.position.y = h / 2;

  lod.addLevel(near, 0);
  lod.addLevel(midBody, 6);
  lod.addLevel(farBody, 9);
  return lod;
}

/** LOD card: box + gold edge near, plain box far. */
function buildCard(pool: ResourcePool, w: number, d: number, h: number, color: THREE.Color, map?: THREE.Texture): THREE.Object3D {
  const lod = new THREE.LOD();
  const box = pool.geometry(`box:${q(w)}:${q(h)}:${q(d)}`, () => new THREE.BoxGeometry(w, h, d));
  const mat = stdMat(pool, color, { roughness: 0.3, metalness: 0.05, ...(map ? { map } : {}) });

  const near = new THREE.Group();
  const face = new THREE.Mesh(box, mat); face.position.y = h / 2; face.castShadow = true; face.receiveShadow = true;
  const edges = new THREE.LineSegments(
    pool.geometry(`edge:${q(w)}:${q(h)}:${q(d)}`, () => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d))),
    pool.material("edge:gold", () => new THREE.LineBasicMaterial({ color: 0xf5c451, transparent: true, opacity: 0.35 })),
  );
  edges.position.y = h / 2;
  near.add(face, edges);

  const far = new THREE.Mesh(box, mat); far.position.y = h / 2; far.castShadow = true;

  lod.addLevel(near, 0);
  lod.addLevel(far, 7);
  return lod;
}

function buildDie(pool: ResourcePool, size: number, color: THREE.Color): THREE.Object3D {
  const g = new THREE.Group();
  const cube = new THREE.Mesh(pool.geometry(`cube:${q(size)}`, () => new THREE.BoxGeometry(size, size, size)), stdMat(pool, color, { roughness: 0.35 }));
  cube.position.y = size / 2; cube.castShadow = true; cube.receiveShadow = true;
  g.add(cube);
  const pipMat = stdMat(pool, new THREE.Color(0x0a0a0a), { roughness: 0.6 });
  const pipGeo = pool.geometry(`pip:${q(size)}`, () => new THREE.SphereGeometry(size * 0.07, 10, 10));
  const o = size * 0.27;
  for (const [px, pz] of [[-o, -o], [o, -o], [0, 0], [-o, o], [o, o]] as const) {
    const pip = new THREE.Mesh(pipGeo, pipMat);
    pip.position.set(px, size + size * 0.07 * 0.3, pz); pip.scale.y = 0.4;
    g.add(pip);
  }
  return g;
}

function buildPawn(pool: ResourcePool, diam: number, height: number, color: THREE.Color): THREE.Object3D {
  const g = new THREE.Group();
  const mat = stdMat(pool, color, { roughness: 0.3, metalness: 0.15 });
  const part = (geo: THREE.BufferGeometry, y: number, sy = 1) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.position.y = y; if (sy !== 1) m.scale.y = sy; g.add(m);
  };
  part(pool.geometry(`pawnB:${q(diam)}:${q(height)}`, () => new THREE.CylinderGeometry(diam * 0.42, diam * 0.5, height * 0.16, 24)), height * 0.08);
  part(pool.geometry(`pawnS:${q(diam)}:${q(height)}`, () => new THREE.CylinderGeometry(diam * 0.18, diam * 0.34, height * 0.5, 24)), height * 0.4);
  part(pool.geometry(`pawnC:${q(diam)}`, () => new THREE.SphereGeometry(diam * 0.26, 20, 14)), height * 0.68, 0.5);
  part(pool.geometry(`pawnH:${q(diam)}`, () => new THREE.SphereGeometry(diam * 0.28, 20, 16)), height * 0.86);
  return g;
}

function buildMeeple(pool: ResourcePool, w: number, height: number, color: THREE.Color): THREE.Object3D {
  const g = new THREE.Group();
  const mat = stdMat(pool, color, { roughness: 0.4 });
  const u = w;
  const add = (geo: THREE.BufferGeometry, x: number, y: number, rz = 0) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.position.set(x, y, 0); m.rotation.z = rz; g.add(m);
  };
  add(pool.geometry(`mH:${q(u)}`, () => new THREE.SphereGeometry(u * 0.2, 16, 12)), 0, height * 0.8);
  add(pool.geometry(`mT:${q(u)}:${q(height)}`, () => new THREE.CylinderGeometry(u * 0.16, u * 0.26, height * 0.42, 16)), 0, height * 0.5);
  const arm = pool.geometry(`mA:${q(u)}:${q(height)}`, () => new THREE.CapsuleGeometry(u * 0.07, height * 0.28, 3, 6));
  add(arm, u * 0.26, height * 0.52, Math.PI / 4);
  add(arm, -u * 0.26, height * 0.52, -Math.PI / 4);
  const leg = pool.geometry(`mL:${q(u)}:${q(height)}`, () => new THREE.CapsuleGeometry(u * 0.09, height * 0.3, 3, 6));
  add(leg, u * 0.12, height * 0.18);
  add(leg, -u * 0.12, height * 0.18);
  return g;
}

function buildFlat(pool: ResourcePool, w: number, d: number, h: number, color: THREE.Color, circle: boolean, map?: THREE.Texture): THREE.Object3D {
  const geo = circle
    ? pool.geometry(`fcyl:${q(w)}:${q(h)}`, () => new THREE.CylinderGeometry(w / 2, w / 2, h, 24))
    : pool.geometry(`fbox:${q(w)}:${q(h)}:${q(d)}`, () => new THREE.BoxGeometry(w, h, d));
  const m = new THREE.Mesh(geo, stdMat(pool, color, { roughness: 0.7, ...(map ? { map } : {}) }));
  m.position.y = h / 2; m.castShadow = true; m.receiveShadow = true;
  return m;
}

function textTexture(text: string, color: string, pool: ResourcePool): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = color || "#e8d5b8";
  ctx.font = "bold 70px Georgia, serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text.slice(0, 32), c.width / 2, c.height / 2, c.width - 24);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4; pool.extra.push(tex);
  return tex;
}

/**
 * Builds the real game board with LOD pieces and pooled GPU resources.
 * `onTexture` fires when a lazily-loaded artwork texture arrives so the caller
 * can request a re-render (progressive image loading).
 */
export function buildBoardScene(
  scene: THREE.Scene,
  comps: CanvasComp[],
  boardW: number,
  boardH: number,
  onTexture?: () => void,
): () => void {
  const scale = TARGET_WORLD / Math.max(boardW, boardH, 1);
  const bw = boardW * scale;
  const bh = boardH * scale;
  const pool = new ResourcePool();
  const added: THREE.Object3D[] = [];
  const surfaceY = 0.03;

  const boardMesh = new THREE.Mesh(
    pool.geometry(`board:${q(bw)}:${q(bh)}`, () => new THREE.BoxGeometry(bw, 0.05, bh)),
    stdMat(pool, new THREE.Color(0x12161d), { roughness: 0.92, metalness: 0.02 }),
  );
  boardMesh.position.y = 0.005; boardMesh.receiveShadow = true;
  scene.add(boardMesh); added.push(boardMesh);

  const border = new THREE.LineSegments(
    pool.geometry("boardEdge", () => new THREE.EdgesGeometry(new THREE.BoxGeometry(bw + 0.02, 0.06, bh + 0.02))),
    pool.material("edge:gold", () => new THREE.LineBasicMaterial({ color: 0xf5c451, transparent: true, opacity: 0.3 })),
  );
  border.position.y = 0.012;
  scene.add(border); added.push(border);

  const loader = new THREE.TextureLoader();
  const loadTex = (url: string): THREE.Texture => {
    const tex = loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; onTexture?.(); }, undefined, () => {});
    pool.extra.push(tex);
    return tex;
  };

  comps.filter((c) => c.visible).forEach((c, i) => {
    const w = Math.max(0.03, c.width * scale);
    const d = Math.max(0.03, c.height * scale);
    const diam = Math.min(w, d);
    const h = Math.max(0.01, heightMm(c.type) * scale * VERT);
    const cx = (c.x + c.width / 2 - boardW / 2) * scale;
    const cz = (c.y + c.height / 2 - boardH / 2) * scale;
    const color = new THREE.Color(safeColor(c.fill, "#1a2535"));
    const wantMap = c.type === "card" || c.type === "deck" || c.type === "tile" || c.type === "board";
    const map = c.image && wantMap ? loadTex(c.image) : undefined;

    let obj: THREE.Object3D;
    switch (c.type) {
      case "card": obj = buildCard(pool, w, d, h, color, map); break;
      case "deck": obj = buildCard(pool, w, d, h, color, map); break;
      case "die": case "cube": obj = buildDie(pool, diam, color); break;
      case "pawn": obj = buildPawn(pool, diam, h, color); break;
      case "meeple": obj = buildMeeple(pool, w, h, color); break;
      case "token": case "coin": case "marker": obj = buildDisc(pool, diam, h, color, c.type === "coin"); break;
      default: obj = buildFlat(pool, w, d, h, color, isCircleType(c.type), map);
    }

    obj.position.set(cx, surfaceY + i * 0.0008, cz);
    obj.rotation.y = (-c.rotation * Math.PI) / 180;
    scene.add(obj); added.push(obj);

    if (c.type === "text" && c.text) {
      const tex = textTexture(c.text, c.textColor ?? "#e8d5b8", pool);
      const pmat = new THREE.MeshBasicMaterial({ map: tex, transparent: true }); pool.extra.push(pmat);
      const plane = new THREE.Mesh(pool.geometry(`plane:${q(w)}:${q(d)}`, () => new THREE.PlaneGeometry(w, d)), pmat);
      plane.rotation.x = -Math.PI / 2;
      plane.rotation.z = (-c.rotation * Math.PI) / 180;
      plane.position.set(cx, surfaceY + h + 0.01 + i * 0.0008, cz);
      scene.add(plane); added.push(plane);
    }
  });

  return () => {
    for (const o of added) scene.remove(o);
    pool.dispose();
  };
}
