/**
 * @velonix/game-engine
 *
 * Framework-agnostic game logic shared between web (Next.js) and api (NestJS).
 * No DOM dependencies. No Three.js. Pure TypeScript.
 *
 * Exports:
 * - Component validators (Zod schemas)
 * - Layout calculators (grid, hex)
 * - Card/token factory helpers
 * - Pricing calculators (commission math)
 * - Version utilities
 */

export * from "./validators.js";
export * from "./calculators.js";
export * from "./factories.js";
