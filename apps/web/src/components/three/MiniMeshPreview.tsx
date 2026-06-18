"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface MiniMeshPreviewProps {
  /** 6 image URLs in THREE.BoxGeometry material order: +x,-x,+y,-y,+z,-z. */
  faceUrls: [string, string, string, string, string, string];
  /** Relative box dimensions, e.g. [1,1,1] for a die, [1.4,1,0.4] for a box. */
  size?: [number, number, number];
}

/** Renders a single textured cube the user can drag to spin — used to
 * preview a standard d6 or a game box with the artwork applied per-face. */
export function MiniMeshPreview({ faceUrls, size = [1, 1, 1] }: MiniMeshPreviewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 320;
    const H = mount.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
    camera.position.set(0, 0.3, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    // Soft 3-point lighting so the artwork reads clearly on every face,
    // instead of one flat light leaving half the piece in the dark.
    scene.add(new THREE.AmbientLight(0xfff4e0, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(3, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9bd8ff, 0.4);
    fill.position.set(-4, 1, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffe7b3, 0.35);
    rim.position.set(0, -3, -4);
    scene.add(rim);

    const loader = new THREE.TextureLoader();
    const materials = faceUrls.map((url) => {
      const mat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });
      loader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex;
        mat.color.set(0xffffff);
        mat.needsUpdate = true;
      });
      return mat;
    });

    const geo = new THREE.BoxGeometry(...size);
    const mesh = new THREE.Mesh(geo, materials);
    const group = new THREE.Group();
    group.add(mesh);
    group.rotation.set(-0.35, 0.55, 0);
    scene.add(group);

    let dragging = false, lastX = 0, lastY = 0, idleSpin = true;
    let raf = 0;
    const render = () => {
      if (idleSpin && !dragging) group.rotation.y += 0.0045;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();

    const onDown = (e: PointerEvent) => { dragging = true; idleSpin = false; lastX = e.clientX; lastY = e.clientY; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      group.rotation.y += (e.clientX - lastX) * 0.01;
      group.rotation.x += (e.clientY - lastY) * 0.01;
      lastX = e.clientX; lastY = e.clientY;
    };
    const onUp = () => { dragging = false; };
    mount.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      mount.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      geo.dispose();
      materials.forEach((m) => { m.map?.dispose(); m.dispose(); });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [faceUrls, size]);

  return (
    <div className="relative" style={{ width: "100%", maxWidth: 360 }}>
      <div
        ref={mountRef}
        style={{
          width: "100%", height: 320, cursor: "grab", borderRadius: 12,
          background: "radial-gradient(ellipse at 50% 60%, rgba(245,196,81,0.08), transparent 70%)",
        }}
      />
      <p className="text-2xs font-ui text-soft-gray-dark text-center mt-1">Drag to rotate · spins on its own when idle</p>
    </div>
  );
}
