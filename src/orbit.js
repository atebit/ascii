// Drag to orbit, scroll or pinch to zoom. One state can drive several cameras.
class Orbit {
  constructor({ theta = 0, phi = 1.35, dist = 9, target = new THREE.Vector3() } = {}) {
    this.theta = theta;
    this.phi = phi;
    this.dist = dist;
    this.target = target;
    this.dragging = false;
    this.moved = 0;
  }

  attach(el) {
    let last = null;
    const pointers = new Map();
    let pinch = 0;
    el.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, e);
      last = e;
      this.dragging = true;
      this.moved = 0;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, e);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (pinch) this.zoom(pinch / d);
        pinch = d;
        return;
      }
      const dx = e.clientX - last.clientX;
      const dy = e.clientY - last.clientY;
      this.moved += Math.abs(dx) + Math.abs(dy);
      this.theta -= dx * 0.008;
      this.phi = THREE.MathUtils.clamp(this.phi - dy * 0.008, 0.35, 2.4);
      last = e;
    });
    const end = (e) => {
      pointers.delete(e.pointerId);
      pinch = 0;
      if (!pointers.size) this.dragging = false;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom(Math.exp(e.deltaY * 0.001));
    }, { passive: false });
  }

  zoom(f) { this.dist = THREE.MathUtils.clamp(this.dist * f, 4, 20); }

  apply(camera) {
    const s = Math.sin(this.phi);
    camera.position.set(
      this.target.x + this.dist * s * Math.sin(this.theta),
      this.target.y + this.dist * Math.cos(this.phi),
      this.target.z + this.dist * s * Math.cos(this.theta),
    );
    camera.lookAt(this.target);
  }
}
