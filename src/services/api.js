// The preload bridge (electron/preload.cjs). The renderer has no other way to reach the system.
export const api = window.vela;

if (!api) {
  throw new Error('Brook bridge is unavailable. The renderer must be loaded by the Brook desktop app.');
}
