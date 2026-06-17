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
export function MiniMeshPreview({
  faceUrls,
  size = [1, 1, 1],
}: MiniMeshPreviewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 220;
    const H = mount.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 4, 5);
    scene.add(dir);

    const loader = new THREE.TextureLoader();
    const materials = faceUrls.map((url) => {
      const tex = loader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
    });

    const geo = new THREE.BoxGeometry(...size);
    const mesh = new THREE.Mesh(geo, materials);
    const group = new THREE.Group();
    group.add(mesh);
    group.rotation.set(-0.4, 0.5, 0);
    scene.add(group);

    let raf = 0;
    const render = () => {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();

    let dragging = false,
      lastX = 0,
      lastY = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      group.rotation.y += (e.clientX - lastX) * 0.01;
      group.rotation.x += (e.clientY - lastY) * 0.01;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
    };
    mount.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      mount.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      geo.dispose();
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [faceUrls, size]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: 220, cursor: "grab" }}
    />
  );
}
