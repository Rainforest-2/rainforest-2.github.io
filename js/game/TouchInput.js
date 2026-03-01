export class TouchInput {
  constructor(canvas, getBattleHeight, camera) {
    this.canvas = canvas;
    this.getBattleHeight = getBattleHeight;
    this.camera = camera;
    this.pointers = new Map();
    this.isPanning = false;
    this.prevPanX = 0;
    this.prevPinchDist = 0;

    canvas.addEventListener('pointerdown', this.onDown, { passive: false });
    canvas.addEventListener('pointermove', this.onMove, { passive: false });
    canvas.addEventListener('pointerup', this.onUp, { passive: false });
    canvas.addEventListener('pointercancel', this.onUp, { passive: false });
  }

  onDown = (e) => {
    if (e.clientY > this.getBattleHeight()) return;
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 1) {
      this.isPanning = true;
      this.prevPanX = e.clientX;
    }

    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.prevPinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      this.isPanning = false;
    }
  };

  onMove = (e) => {
    if (!this.pointers.has(e.pointerId)) return;
    e.preventDefault();
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 1 && this.isPanning) {
      const dx = e.clientX - this.prevPanX;
      this.prevPanX = e.clientX;
      this.camera.panByScreenDelta(dx);
    }

    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.prevPinchDist > 0) {
        const ratio = dist / this.prevPinchDist;
        const centerX = (a.x + b.x) * 0.5;
        this.camera.zoomAt(centerX, ratio);
      }
      this.prevPinchDist = dist;
    }
  };

  onUp = (e) => {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0) {
      this.isPanning = false;
      this.prevPinchDist = 0;
    }
    if (this.pointers.size === 1) {
      const [p] = [...this.pointers.values()];
      this.prevPanX = p.x;
      this.isPanning = true;
    }
  };
}
