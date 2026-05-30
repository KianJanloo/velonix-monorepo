import type { ThreeElements } from "@react-three/fiber";

// React 19 moved JSX types under React.JSX; augment via declare module "react"
// so that Three.js primitives (<mesh>, <group>, etc.) are recognised by tsc.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
