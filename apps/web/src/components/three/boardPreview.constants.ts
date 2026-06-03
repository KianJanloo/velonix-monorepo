/**
 * Lightweight constants shared between the (heavy, three.js) BoardPreview module
 * and its consumers. Kept in a separate file so importing the duration doesn't
 * pull three.js into a consumer's bundle — the 3D code stays lazily loaded.
 */

/** Duration (seconds) of one full cinematic flythrough loop. */
export const FLYTHROUGH_DURATION = 12;
