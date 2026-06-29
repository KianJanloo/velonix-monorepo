import * as THREE from "three";
import {
  isCircleType,
  safeColor,
  type CanvasComp,
  type CompType,
} from "@/components/templates/studio/core";

/** The larger board dimension maps to this many world units. */
const TARGET_WORLD = 6;
/** Vertical exaggeration so low pieces still read with depth. */
const VERT = 2.4;

type Disposable = { dispose: () => void };

// ── Resource pool ─────────────────────────────────────────────────────────────

class ResourcePool {
  private geo = new Map<string, THREE.BufferGeometry>();
  private mat = new Map<string, THREE.Material>();
  readonly extra: Disposable[] = [];

  geometry<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
    let g = this.geo.get(key);
    if (!g) {
      g = make();
      this.geo.set(key, g);
    }
    return g as T;
  }
  material<T extends THREE.Material>(key: string, make: () => T): T {
    let m = this.mat.get(key);
    if (!m) {
      m = make();
      this.mat.set(key, m);
    }
    return m as T;
  }
  dispose() {
    this.geo.forEach((g) => g.dispose());
    this.mat.forEach((m) => m.dispose());
    this.extra.forEach((d) => d.dispose());
    this.geo.clear();
    this.mat.clear();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const q = (n: number) => Math.round(n * 100) / 100;

function heightMm(t: CompType): number {
  switch (t) {
    case "card":
      return 0.5;
    case "token":
    case "coin":
    case "marker":
      return 3;
    case "tile":
      return 4;
    case "die":
    case "cube":
      return 15;
    case "pawn":
      return 30;
    case "meeple":
      return 24;
    case "deck":
      return 20;
    case "board":
      return 3;
    case "hex":
      return 3;
    case "bag":
      return 8;
    case "standee":
      return 25;
    case "spinner":
      return 4;
    case "track":
      return 3;
    case "sand_timer":
      return 20;
    case "line":
      return 1;
    default:
      return 6;
  }
}

function stdMat(
  pool: ResourcePool,
  color: THREE.Color,
  opts: {
    roughness?: number;
    metalness?: number;
    map?: THREE.Texture;
    emissiveIntensity?: number;
  } = {},
): THREE.MeshStandardMaterial {
  const rough = opts.roughness ?? 0.45;
  const metal = opts.metalness ?? 0.1;
  const emI = opts.emissiveIntensity ?? 0.06;
  if (opts.map) {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: rough,
      metalness: metal,
      map: opts.map,
    });
    pool.extra.push(m);
    return m;
  }
  return pool.material(
    `std:${color.getHexString()}:${rough}:${metal}`,
    () =>
      new THREE.MeshStandardMaterial({
        color: color.clone(),
        roughness: rough,
        metalness: metal,
        emissive: color.clone(),
        emissiveIntensity: emI,
      }),
  );
}

// ── Capsule substitute (Three r128-safe: cylinder + 2 half-spheres) ───────────

function buildCapsuleGroup(
  pool: ResourcePool,
  mat: THREE.Material,
  radius: number,
  length: number,
): THREE.Group {
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(
    pool.geometry(
      `cap-cyl:${q(radius)}:${q(length)}`,
      () => new THREE.CylinderGeometry(radius, radius, length, 12),
    ),
    mat,
  );
  cyl.castShadow = true;
  g.add(cyl);
  for (const y of [length / 2, -length / 2]) {
    const half = new THREE.Mesh(
      pool.geometry(
        `cap-hemi:${q(radius)}`,
        () =>
          new THREE.SphereGeometry(
            radius,
            12,
            8,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2,
          ),
      ),
      mat,
    );
    half.position.y = y;
    half.rotation.x = y > 0 ? 0 : Math.PI;
    half.castShadow = true;
    g.add(half);
  }
  return g;
}

// ── Component builders ────────────────────────────────────────────────────────

/** Token / coin / marker — disc with gold rim at full LOD */
function buildDisc(
  pool: ResourcePool,
  diam: number,
  h: number,
  color: THREE.Color,
  metal: boolean,
): THREE.Object3D {
  const lod = new THREE.LOD();
  const r = diam / 2;
  const mat = stdMat(
    pool,
    color,
    metal ? { metalness: 0.7, roughness: 0.25 } : { roughness: 0.5 },
  );

  const cyl = (seg: number) =>
    pool.geometry(
      `cyl:${q(r)}:${q(h)}:${seg}`,
      () => new THREE.CylinderGeometry(r, r, h, seg),
    );

  const near = new THREE.Group();
  const body = new THREE.Mesh(cyl(48), mat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  const rimMat = stdMat(pool, new THREE.Color(0xf5c451), {
    metalness: 0.8,
    roughness: 0.2,
    emissiveIntensity: 0.3,
  });
  const ring = new THREE.Mesh(
    pool.geometry(
      `rim:${q(r)}`,
      () =>
        new THREE.TorusGeometry(r * 0.92, Math.max(0.004, diam * 0.03), 8, 32),
    ),
    rimMat,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = h;
  near.add(body, ring);

  const mid = new THREE.Mesh(cyl(20), mat);
  mid.position.y = h / 2;
  mid.castShadow = true;
  const far = new THREE.Mesh(cyl(8), mat);
  far.position.y = h / 2;
  lod.addLevel(near, 0);
  lod.addLevel(mid, 6);
  lod.addLevel(far, 9);
  return lod;
}

/** Card — thin slab with bevelled gold edge at near LOD, front/back face material */
function buildCard(
  pool: ResourcePool,
  w: number,
  d: number,
  h: number,
  color: THREE.Color,
  map?: THREE.Texture,
): THREE.Object3D {
  const lod = new THREE.LOD();
  const box = pool.geometry(
    `box:${q(w)}:${q(h)}:${q(d)}`,
    () => new THREE.BoxGeometry(w, h, d),
  );
  const mat = stdMat(pool, color, {
    roughness: 0.3,
    metalness: 0.05,
    ...(map ? { map } : {}),
  });

  const near = new THREE.Group();
  const face = new THREE.Mesh(box, mat);
  face.position.y = h / 2;
  face.castShadow = true;
  face.receiveShadow = true;
  const edges = new THREE.LineSegments(
    pool.geometry(
      `edge:${q(w)}:${q(h)}:${q(d)}`,
      () => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    ),
    pool.material(
      "edge:gold",
      () =>
        new THREE.LineBasicMaterial({
          color: 0xf5c451,
          transparent: true,
          opacity: 0.35,
        }),
    ),
  );
  edges.position.y = h / 2;
  near.add(face, edges);
  const far = new THREE.Mesh(box, mat);
  far.position.y = h / 2;
  far.castShadow = true;
  lod.addLevel(near, 0);
  lod.addLevel(far, 7);
  return lod;
}

/**
 * Die — rounded box with correct per-face pip layouts.
 * Face 1 (+Y top), 6 (−Y bottom), 2 (−Z front), 5 (+Z back), 3 (+X right), 4 (−X left).
 * innerColor used for pips.
 */
function buildDie(
  pool: ResourcePool,
  size: number,
  color: THREE.Color,
  pipColor: THREE.Color,
  largeGame: boolean,
): THREE.Object3D {
  const g = new THREE.Group();
  const half = size / 2;

  const mat = stdMat(pool, color, { roughness: 0.3, metalness: 0.15 });
  const cube = new THREE.Mesh(
    pool.geometry(
      `cube:${q(size)}`,
      () => new THREE.BoxGeometry(size, size, size),
    ),
    mat,
  );
  cube.position.y = half;
  cube.castShadow = true;
  cube.receiveShadow = true;
  g.add(cube);

  // Rounded bevel overlay — 4 edge tubes for visual softness
  // Pips and bevel edges are tiny — shadow-casting on them is visually
  // imperceptible but each one adds a full shadow-pass draw call. Skipping
  // it matters a lot once a game has hundreds of dice on the table.
  const bevelMat = stdMat(pool, color, { roughness: 0.25, metalness: 0.3 });
  const edgeR = size * 0.06;
  const edgeL = size - edgeR * 2;
  // Large games skip the decorative bevel tubes entirely (12 meshes/die) —
  // the cube + pips alone still read clearly as a die at table scale.
  const wantBevels = !largeGame;
  if (wantBevels)
    for (const axis of ["x", "y", "z"] as const) {
      for (const a of [-1, 1]) {
        for (const b of [-1, 1]) {
          const edge = new THREE.Mesh(
            pool.geometry(
              `bevel:${q(edgeR)}:${q(edgeL)}`,
              () => new THREE.CylinderGeometry(edgeR, edgeR, edgeL, 8),
            ),
            bevelMat,
          );
          if (axis === "x") {
            edge.rotation.z = Math.PI / 2;
            edge.position.set(0, half + a * (half - edgeR), b * (half - edgeR));
          }
          if (axis === "y") {
            edge.position.set(a * (half - edgeR), half, b * (half - edgeR));
          }
          if (axis === "z") {
            edge.rotation.x = Math.PI / 2;
            edge.position.set(a * (half - edgeR), half + b * (half - edgeR), 0);
          }
          g.add(edge);
        }
      }
    }

  const pipMat = stdMat(pool, pipColor, {
    roughness: 0.5,
    metalness: 0.0,
    emissiveIntensity: 0.2,
  });
  const pipGeo = pool.geometry(
    `pip:${q(size)}`,
    () => new THREE.SphereGeometry(size * 0.07, 8, 6),
  );
  const o = size * 0.28;
  const pip = (px: number, py: number, pz: number) => {
    const m = new THREE.Mesh(pipGeo, pipMat);
    m.position.set(px, py + half, pz);
    m.castShadow = false; // tiny — shadow contribution is invisible, not worth the draw call
    g.add(m);
  };

  // Face 1 (+Y) — 1 pip
  pip(0, size * 0.51, 0);
  // Face 6 (−Y) — 6 pips
  for (const [fx, fz] of [
    [-o, -o],
    [o, -o],
    [-o, 0],
    [o, 0],
    [-o, o],
    [o, o],
  ])
    pip(fx!, -size * 0.51, fz!);
  // Face 2 (−Z front) — 2 pips
  pip(-o, o * 0.4, -size * 0.51);
  pip(o, -o * 0.4, -size * 0.51);
  // Face 5 (+Z back) — 5 pips
  pip(-o, o, size * 0.51);
  pip(o, o, size * 0.51);
  pip(0, 0, size * 0.51);
  pip(-o, -o, size * 0.51);
  pip(o, -o, size * 0.51);
  // Face 3 (+X right) — 3 pips
  pip(size * 0.51, o, -o);
  pip(size * 0.51, 0, 0);
  pip(size * 0.51, -o, o);
  // Face 4 (−X left) — 4 pips
  pip(-size * 0.51, o, -o);
  pip(-size * 0.51, o, o);
  pip(-size * 0.51, -o, -o);
  pip(-size * 0.51, -o, o);

  return g;
}

/**
 * Pawn — lathe-profile shape: base disc → tapered shaft → bulbous head.
 * No CapsuleGeometry — safe on Three r128.
 */
function buildPawn(
  pool: ResourcePool,
  diam: number,
  height: number,
  color: THREE.Color,
): THREE.Object3D {
  const g = new THREE.Group();
  const mat = stdMat(pool, color, {
    roughness: 0.28,
    metalness: 0.18,
    emissiveIntensity: 0.1,
  });

  // Base — wide flat disc
  const base = new THREE.Mesh(
    pool.geometry(
      `pBase:${q(diam)}:${q(height)}`,
      () =>
        new THREE.CylinderGeometry(diam * 0.44, diam * 0.5, height * 0.14, 32),
    ),
    mat,
  );
  base.position.y = height * 0.07;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  // Shaft — tapered cylinder
  const shaft = new THREE.Mesh(
    pool.geometry(
      `pShaft:${q(diam)}:${q(height)}`,
      () =>
        new THREE.CylinderGeometry(diam * 0.16, diam * 0.36, height * 0.52, 20),
    ),
    mat,
  );
  shaft.position.y = height * 0.41;
  shaft.castShadow = true;
  g.add(shaft);

  // Collar — small disc at neck
  const collar = new THREE.Mesh(
    pool.geometry(
      `pCol:${q(diam)}:${q(height)}`,
      () =>
        new THREE.CylinderGeometry(diam * 0.22, diam * 0.18, height * 0.06, 20),
    ),
    mat,
  );
  collar.position.y = height * 0.7;
  collar.castShadow = true;
  g.add(collar);

  // Head — sphere (r128-safe)
  const head = new THREE.Mesh(
    pool.geometry(
      `pHead:${q(diam)}`,
      () => new THREE.SphereGeometry(diam * 0.25, 20, 16),
    ),
    mat,
  );
  head.position.y = height * 0.86;
  head.castShadow = true;
  g.add(head);

  return g;
}

/**
 * Meeple — body + head + arms built from cylinders + spheres.
 * Replaces CapsuleGeometry (r142+) with cylinder + two hemi-spheres.
 */
function buildMeeple(
  pool: ResourcePool,
  w: number,
  height: number,
  color: THREE.Color,
  largeGame: boolean,
): THREE.Object3D {
  const g = new THREE.Group();
  const mat = stdMat(pool, color, { roughness: 0.4, emissiveIntensity: 0.08 });
  const u = w;

  // Head
  const head = new THREE.Mesh(
    pool.geometry(
      `mH:${q(u)}`,
      () => new THREE.SphereGeometry(u * 0.2, 16, 12),
    ),
    mat,
  );
  head.position.y = height * 0.82;
  head.castShadow = true;
  g.add(head);

  // Torso — cylinder
  const torso = new THREE.Mesh(
    pool.geometry(
      `mT:${q(u)}:${q(height)}`,
      () => new THREE.CylinderGeometry(u * 0.16, u * 0.26, height * 0.42, 14),
    ),
    mat,
  );
  torso.position.y = height * 0.5;
  torso.castShadow = true;
  g.add(torso);

  if (largeGame) {
    // Plain cylinders instead of the capsule-substitute groups (3 meshes
    // each): cuts a meeple from 14 meshes to 6 when there are many of them.
    const limb = (
      rTop: number,
      len: number,
      x: number,
      y: number,
      rotZ: number,
    ) => {
      const m = new THREE.Mesh(
        pool.geometry(
          `mLimb:${q(rTop)}:${q(len)}`,
          () => new THREE.CylinderGeometry(rTop, rTop, len, 8),
        ),
        mat,
      );
      m.position.set(x, y, 0);
      m.rotation.z = rotZ;
      g.add(m);
    };
    limb(u * 0.07, height * 0.28, u * 0.28, height * 0.54, Math.PI / 4);
    limb(u * 0.07, height * 0.28, -u * 0.28, height * 0.54, -Math.PI / 4);
    limb(u * 0.09, height * 0.3, u * 0.12, height * 0.18, 0);
    limb(u * 0.09, height * 0.3, -u * 0.12, height * 0.18, 0);
    return g;
  }

  // Arms — capsule substitute
  const armR = buildCapsuleGroup(pool, mat, u * 0.07, height * 0.28);
  armR.position.set(u * 0.28, height * 0.54, 0);
  armR.rotation.z = Math.PI / 4;
  const armL = buildCapsuleGroup(pool, mat, u * 0.07, height * 0.28);
  armL.position.set(-u * 0.28, height * 0.54, 0);
  armL.rotation.z = -Math.PI / 4;
  g.add(armR, armL);

  // Legs — capsule substitute
  const legR = buildCapsuleGroup(pool, mat, u * 0.09, height * 0.3);
  legR.position.set(u * 0.12, height * 0.18, 0);
  const legL = buildCapsuleGroup(pool, mat, u * 0.09, height * 0.3);
  legL.position.set(-u * 0.12, height * 0.18, 0);
  g.add(legR, legL);

  return g;
}

/** Board — thick frame with raised edge, inset felt surface */
function buildBoard(
  pool: ResourcePool,
  w: number,
  d: number,
  color: THREE.Color,
  map?: THREE.Texture,
): THREE.Object3D {
  const g = new THREE.Group();
  const thickness = 0.08;
  const frameW = 0.06;

  // Main board slab
  const slab = new THREE.Mesh(
    pool.geometry(
      `board:${q(w)}:${q(d)}`,
      () => new THREE.BoxGeometry(w, thickness, d),
    ),
    stdMat(pool, new THREE.Color(0x2a1f12), { roughness: 0.95 }),
  );
  slab.position.y = thickness / 2;
  slab.receiveShadow = true;
  slab.castShadow = true;
  g.add(slab);

  // Top felt surface (slightly raised)
  const felt = new THREE.Mesh(
    pool.geometry(
      `felt:${q(w)}:${q(d)}`,
      () => new THREE.BoxGeometry(w - frameW * 2, 0.008, d - frameW * 2),
    ),
    stdMat(pool, color, {
      roughness: 0.95,
      metalness: 0,
      ...(map ? { map } : {}),
    }),
  );
  felt.position.y = thickness + 0.004;
  felt.receiveShadow = true;
  g.add(felt);

  // Gold border line
  const edgeLine = new THREE.LineSegments(
    pool.geometry(
      `boardEdge:${q(w)}:${q(d)}`,
      () =>
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w, thickness + 0.012, d)),
    ),
    pool.material(
      "edge:gold",
      () =>
        new THREE.LineBasicMaterial({
          color: 0xf5c451,
          transparent: true,
          opacity: 0.4,
        }),
    ),
  );
  edgeLine.position.y = thickness / 2;
  g.add(edgeLine);

  return g;
}

/** Standee — thin flat figure with a base stand */
function buildStandee(
  pool: ResourcePool,
  w: number,
  h: number,
  color: THREE.Color,
): THREE.Object3D {
  const g = new THREE.Group();
  const thickness = w * 0.06;
  const mat = stdMat(pool, color, { roughness: 0.45, metalness: 0.05 });

  // Body
  const body = new THREE.Mesh(
    pool.geometry(
      `standee:${q(w)}:${q(h)}:${q(thickness)}`,
      () => new THREE.BoxGeometry(w, h * 0.75, thickness),
    ),
    mat,
  );
  body.position.y = (h * 0.75) / 2 + h * 0.12;
  body.castShadow = true;
  g.add(body);

  // Base tab
  const base = new THREE.Mesh(
    pool.geometry(
      `standeeBase:${q(w)}`,
      () => new THREE.BoxGeometry(w, h * 0.12, thickness * 2.5),
    ),
    mat,
  );
  base.position.y = h * 0.06;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  return g;
}

/** Bag — sphere with pinched top and cord */
function buildBag(
  pool: ResourcePool,
  diam: number,
  h: number,
  color: THREE.Color,
  innerColor: THREE.Color,
): THREE.Object3D {
  console.log(h);
  const g = new THREE.Group();
  const r = diam * 0.42;

  // Body sphere (squashed slightly)
  const body = new THREE.Mesh(
    pool.geometry(`bag:${q(r)}`, () => new THREE.SphereGeometry(r, 20, 16)),
    stdMat(pool, color, { roughness: 0.8, metalness: 0.0 }),
  );
  body.scale.y = 1.15;
  body.position.y = r * 1.1;
  body.castShadow = true;
  g.add(body);

  // Neck / cinch
  const neck = new THREE.Mesh(
    pool.geometry(
      `bagNeck:${q(r)}`,
      () => new THREE.CylinderGeometry(r * 0.22, r * 0.38, r * 0.4, 16),
    ),
    stdMat(pool, innerColor, { roughness: 0.7 }),
  );
  neck.position.y = r * 2.1;
  neck.castShadow = true;
  g.add(neck);

  // Cord knot (tiny sphere)
  const knot = new THREE.Mesh(
    pool.geometry(
      `bagKnot:${q(r)}`,
      () => new THREE.SphereGeometry(r * 0.12, 8, 6),
    ),
    stdMat(pool, new THREE.Color(0xf5c451), { metalness: 0.7, roughness: 0.3 }),
  );
  knot.position.y = r * 2.4;
  g.add(knot);

  return g;
}

/** Spinner — disc with coloured segments and a needle */
function buildSpinner(
  pool: ResourcePool,
  diam: number,
  h: number,
  color: THREE.Color,
  needleColor: THREE.Color,
): THREE.Object3D {
  console.log(color);
  const g = new THREE.Group();
  const r = diam / 2;
  const PALETTE = [0x00d68f, 0xff3b5c, 0x3ddc97, 0xf5c451, 0x22d3ee, 0xfb923c];
  const segs = 6;

  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * Math.PI * 2;
    const a2 = ((i + 1) / segs) * Math.PI * 2;
    const geo = pool.geometry(`spinSeg:${i}:${q(r)}:${q(h)}`, () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.absarc(0, 0, r * 0.96, a1, a2, false);
      shape.lineTo(0, 0);
      return new THREE.ExtrudeGeometry(shape, {
        depth: h,
        bevelEnabled: false,
      });
    });
    const mat = pool.material(
      `spinMat:${PALETTE[i % PALETTE.length]}`,
      () =>
        new THREE.MeshStandardMaterial({
          color: PALETTE[i % PALETTE.length],
          roughness: 0.4,
        }),
    );
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0;
    mesh.castShadow = true;
    g.add(mesh);
  }

  // Needle
  const needle = new THREE.Mesh(
    pool.geometry(
      `needle:${q(r)}`,
      () => new THREE.ConeGeometry(r * 0.06, r * 0.75, 8),
    ),
    stdMat(pool, needleColor, {
      roughness: 0.3,
      metalness: 0.4,
      emissiveIntensity: 0.3,
    }),
  );
  needle.position.set(r * 0.3, h + r * 0.38, 0);
  needle.rotation.z = -Math.PI / 5;
  g.add(needle);

  return g;
}

/** Sand timer — two cones joined at tips, with a thin waist */
function buildSandTimer(
  pool: ResourcePool,
  diam: number,
  h: number,
  color: THREE.Color,
): THREE.Object3D {
  const g = new THREE.Group();
  const r = diam / 2;
  const halfH = h / 2;
  const mat = stdMat(pool, color, {
    roughness: 0.15,
    metalness: 0.05,
    emissiveIntensity: 0.08,
  });
  const sandMat = stdMat(pool, new THREE.Color(0xe8d5b8), { roughness: 0.9 });

  // Top bulb
  const top = new THREE.Mesh(
    pool.geometry(
      `stTop:${q(r)}:${q(halfH)}`,
      () => new THREE.ConeGeometry(r, halfH * 0.85, 20, 1, true),
    ),
    mat,
  );
  top.position.y = h * 0.75;
  top.rotation.x = Math.PI;
  top.castShadow = true;
  g.add(top);

  // Bottom bulb
  const bot = new THREE.Mesh(
    pool.geometry(
      `stBot:${q(r)}:${q(halfH)}`,
      () => new THREE.ConeGeometry(r, halfH * 0.85, 20, 1, true),
    ),
    mat,
  );
  bot.position.y = h * 0.25;
  bot.castShadow = true;
  g.add(bot);

  // Waist disc
  const waist = new THREE.Mesh(
    pool.geometry(
      `stWaist:${q(r)}`,
      () => new THREE.CylinderGeometry(r * 0.08, r * 0.08, h * 0.06, 12),
    ),
    stdMat(pool, new THREE.Color(0xf5c451), { metalness: 0.8, roughness: 0.2 }),
  );
  waist.position.y = halfH;
  g.add(waist);

  // Sand pile in bottom half
  const sand = new THREE.Mesh(
    pool.geometry(
      `stSand:${q(r)}`,
      () => new THREE.ConeGeometry(r * 0.7, halfH * 0.4, 16),
    ),
    sandMat,
  );
  sand.position.y = halfH * 0.2;
  g.add(sand);

  // End caps
  for (const y of [0, h]) {
    const cap = new THREE.Mesh(
      pool.geometry(
        `stCap:${q(r)}`,
        () => new THREE.CylinderGeometry(r * 1.05, r * 1.05, h * 0.05, 20),
      ),
      stdMat(pool, new THREE.Color(0xd4a030), {
        metalness: 0.7,
        roughness: 0.2,
      }),
    );
    cap.position.y = y;
    g.add(cap);
  }

  return g;
}

/** Track — flat bar with numbered space dividers */
function buildTrack(
  pool: ResourcePool,
  w: number,
  d: number,
  h: number,
  color: THREE.Color,
  accentColor: THREE.Color,
  spaces = 10,
): THREE.Object3D {
  const g = new THREE.Group();
  const mat = stdMat(pool, color, { roughness: 0.7 });

  const slab = new THREE.Mesh(
    pool.geometry(
      `track:${q(w)}:${q(d)}:${q(h)}`,
      () => new THREE.BoxGeometry(w, h, d),
    ),
    mat,
  );
  slab.position.y = h / 2;
  slab.castShadow = true;
  slab.receiveShadow = true;
  g.add(slab);

  // Dividers
  const divMat = stdMat(pool, accentColor, {
    roughness: 0.5,
    metalness: 0.1,
    emissiveIntensity: 0.2,
  });
  const divH = h * 1.8;
  for (let i = 1; i < spaces; i++) {
    const x = -w / 2 + (i / spaces) * w;
    const div = new THREE.Mesh(
      pool.geometry(
        `trackDiv:${q(d)}:${q(divH)}`,
        () => new THREE.BoxGeometry(0.008, divH, d),
      ),
      divMat,
    );
    div.position.set(x, divH / 2, 0);
    g.add(div);
  }

  return g;
}

/** Generic flat shape (board tile, hex, text label, etc.) */
function buildFlat(
  pool: ResourcePool,
  w: number,
  d: number,
  h: number,
  color: THREE.Color,
  circle: boolean,
  map?: THREE.Texture,
): THREE.Object3D {
  const geo = circle
    ? pool.geometry(
        `fcyl:${q(w)}:${q(h)}`,
        () => new THREE.CylinderGeometry(w / 2, w / 2, h, 24),
      )
    : pool.geometry(
        `fbox:${q(w)}:${q(h)}:${q(d)}`,
        () => new THREE.BoxGeometry(w, h, d),
      );
  const m = new THREE.Mesh(
    geo,
    stdMat(pool, color, { roughness: 0.7, ...(map ? { map } : {}) }),
  );
  m.position.y = h / 2;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ── Text texture ──────────────────────────────────────────────────────────────

function textTexture(
  text: string,
  color: string,
  pool: ResourcePool,
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = color || "#e8d5b8";
  ctx.font = "bold 70px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.slice(0, 32), c.width / 2, c.height / 2, c.width - 24);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  pool.extra.push(tex);
  return tex;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Builds the real 3D game board scene from CanvasComp data.
 * All geometry is type-specific and dimensioned from component width/height.
 * Returns a dispose() function that removes all added objects and frees GPU memory.
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
  // Large-game mode: past this many pieces, drop purely decorative
  // sub-geometry (bevel tubes, fine limb segments) that costs draw calls
  // and shadow-pass time but is imperceptible at normal table-view zoom.
  const largeGame = comps.length > 150;

  // ── Board surface ──────────────────────────────────────────────────────────

  const boardBase = buildBoard(pool, bw, bh, new THREE.Color(0x12161d));
  boardBase.position.y = 0;
  scene.add(boardBase);
  added.push(boardBase);

  // ── Texture loader ─────────────────────────────────────────────────────────

  const loader = new THREE.TextureLoader();
  const loadTex = (url: string): THREE.Texture => {
    const tex = loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        onTexture?.();
      },
      undefined,
      () => {},
    );
    pool.extra.push(tex);
    return tex;
  };

  // ── Components ─────────────────────────────────────────────────────────────

  comps
    .filter((c) => c.visible)
    .forEach((c, i) => {
      const w = Math.max(0.03, c.width * scale);
      const d = Math.max(0.03, c.height * scale);
      const diam = Math.min(w, d);
      const h = Math.max(0.01, heightMm(c.type) * scale * VERT);
      const cx = (c.x + c.width / 2 - boardW / 2) * scale;
      const cz = (c.y + c.height / 2 - boardH / 2) * scale;

      const color = new THREE.Color(safeColor(c.fill, "#1a2535"));
      const innerColor = new THREE.Color(safeColor(c.innerColor, "#3ddc97"));
      const pipColor = new THREE.Color(safeColor(c.innerColor, "#0a0a0a"));

      const wantMap = ["card", "deck", "tile", "board"].includes(c.type);
      const map = c.image && wantMap ? loadTex(c.image) : undefined;

      let obj: THREE.Object3D;

      switch (c.type) {
        case "board":
          obj = buildBoard(pool, w, d, color, map);
          break;
        case "card":
        case "deck":
        case "rulebook":
          obj = buildCard(pool, w, d, h, color, map);
          break;
        case "die":
        case "cube":
          obj = buildDie(pool, diam, color, pipColor, largeGame);
          break;
        case "pawn":
          obj = buildPawn(pool, diam, h, color);
          break;
        case "meeple":
          obj = buildMeeple(pool, w, h, color, largeGame);
          break;
        case "token":
        case "coin":
        case "marker":
          obj = buildDisc(pool, diam, h, color, c.type === "coin");
          break;
        case "bag":
          obj = buildBag(pool, diam, h, color, innerColor);
          break;
        case "standee":
          obj = buildStandee(pool, w, h, color);
          break;
        case "spinner":
          obj = buildSpinner(pool, diam, h, color, innerColor);
          break;
        case "sand_timer":
          obj = buildSandTimer(pool, diam, h, color);
          break;
        case "track":
          obj = buildTrack(pool, w, d, h, color, innerColor, c.segments ?? 10);
          break;
        default:
          obj = buildFlat(pool, w, d, h, color, isCircleType(c.type), map);
      }

      obj.position.set(cx, surfaceY + i * 0.001, cz);
      obj.rotation.y = (-c.rotation * Math.PI) / 180;
      scene.add(obj);
      added.push(obj);

      // Text label plane above component
      if ((c.type === "text" || c.type === "note") && c.text) {
        const tex = textTexture(c.text, c.textColor ?? "#e8d5b8", pool);
        const pmat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
        });
        pool.extra.push(pmat);
        const plane = new THREE.Mesh(
          pool.geometry(
            `plane:${q(w)}:${q(d)}`,
            () => new THREE.PlaneGeometry(w, d),
          ),
          pmat,
        );
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(cx, surfaceY + h + 0.012 + i * 0.001, cz);
        scene.add(plane);
        added.push(plane);
      }
    });

  return () => {
    for (const o of added) scene.remove(o);
    pool.dispose();
  };
}
