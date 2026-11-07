import { initLocaleSwitch } from './locale.js';
import { initPageTransitions } from './navigation.js';

initLocaleSwitch();
initPageTransitions();

const surfaces = [...document.querySelectorAll('.feature, .button, .glass-card, .app-icon-link')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const litSurfaces = new Set();
const lightRadius = 6 * parseFloat(getComputedStyle(document.documentElement).fontSize);
const edgeRadius = 24 * parseFloat(getComputedStyle(document.documentElement).fontSize);
for (const surface of surfaces) {
  const edge = document.createElement('span');
  edge.className = 'glass-edge';
  edge.setAttribute('aria-hidden', 'true');
  surface.append(edge);
}
let pointer = null;
let frame = 0;

function prepareEntrance(event) {
  if (event.animationName === 'content-arrive' && !reducedMotion.matches) {
    event.target.style.willChange = 'filter, opacity, transform';
  }
}

function finishEntrance(event) {
  if (event.animationName === 'content-arrive' || event.animationName === 'title-arrive') event.target.style.willChange = 'auto';
}

document.addEventListener('animationstart', prepareEntrance);
document.addEventListener('animationend', finishEntrance);
document.addEventListener('animationcancel', finishEntrance);

function positionLight(event) {
  if (event.pointerType === 'touch') {
    clearLights();
    return;
  }
  if (reducedMotion.matches) return;
  pointer = { x: event.clientX, y: event.clientY };
  scheduleLights();
}

function scheduleLights() {
  if (!pointer || reducedMotion.matches) return;
  if (frame) return;
  frame = requestAnimationFrame(() => {
    // Read all geometry before writing styles, once per animation frame.
    const positions = surfaces.map((element) => {
      const bounds = element.getBoundingClientRect();
      const dx = Math.max(bounds.left - pointer.x, 0, pointer.x - bounds.right);
      const dy = Math.max(bounds.top - pointer.y, 0, pointer.y - bounds.bottom);
      const approach = Math.max(0, 1 - Math.hypot(dx, dy) / lightRadius);
      const proximity = approach * approach * (3 - 2 * approach);
      const edgeApproach = Math.max(0, 1 - Math.hypot(dx, dy) / edgeRadius);
      const edgeProximity = edgeApproach * edgeApproach * (3 - 2 * edgeApproach);
      // Keep the light's origin outside the surface until the pointer enters it.
      const x = pointer.x - bounds.left;
      const y = pointer.y - bounds.top;
      return { element, x, y, width: bounds.width, height: bounds.height, proximity, edgeProximity };
    });
    frame = 0;
    for (const { element, x, y, width, height, proximity, edgeProximity } of positions) {
      if (!proximity && !edgeProximity) {
        if (litSurfaces.has(element)) resetLight(element);
        continue;
      }
      litSurfaces.add(element);
      element.style.setProperty('--light-x', `${x}px`);
      element.style.setProperty('--light-y', `${y}px`);
      element.style.setProperty('--light-center-offset', `${x - width / 2}px`);
      element.style.setProperty('--light-under-y', `${height * 1.2}px`);
      element.style.setProperty('--light-proximity', String(proximity));
      element.style.setProperty('--edge-proximity', String(edgeProximity));
    }
  });
}

function resetLight(element) {
  litSurfaces.delete(element);
  element.style.removeProperty('--light-proximity');
  element.style.removeProperty('--edge-proximity');
  // Retain the last origin while the light fades out.
}

function clearLights() {
  cancelAnimationFrame(frame);
  frame = 0;
  pointer = null;
  for (const surface of litSurfaces) resetLight(surface);
}

function centerLight(element) {
  resetLight(element);
  const bounds = element.getBoundingClientRect();
  element.style.setProperty('--light-x', `${bounds.width / 2}px`);
  element.style.setProperty('--light-y', '0px');
  element.style.setProperty('--light-center-offset', '0px');
  element.style.setProperty('--light-under-y', `${bounds.height * 1.2}px`);
}

document.addEventListener('pointermove', positionLight, { passive: true });
document.documentElement.addEventListener('pointerleave', clearLights);
document.addEventListener('pointercancel', clearLights);
window.addEventListener('blur', clearLights);
window.addEventListener('pagehide', clearLights);
window.addEventListener('scroll', scheduleLights, { passive: true });
window.addEventListener('resize', scheduleLights, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) clearLights(); });

for (const surface of surfaces) {
  surface.addEventListener('focus', () => {
    if (!surface.matches(':hover')) centerLight(surface);
  });
}

reducedMotion.addEventListener('change', () => {
  clearLights();
  for (const surface of surfaces) centerLight(surface);
});

// Cached pages retain their last painted entrance state. Rewinding completed
// animations on pageshow can flash visible content before hiding it again.
