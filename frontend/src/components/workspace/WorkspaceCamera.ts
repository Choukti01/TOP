import { WorkspaceState } from "./WorkspaceState";

export class WorkspaceCamera {
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private pointerId: number | null = null;

  constructor(private readonly element: HTMLElement) {
    this.element.addEventListener("pointerdown", this.pointerDown);
    this.element.addEventListener("pointermove", this.pointerMove);
    this.element.addEventListener("pointerup", this.pointerUp);
    this.element.addEventListener("pointercancel", this.pointerUp);
    this.element.addEventListener("wheel", this.mouseWheel, { passive: false });
  }

  public dispose(): void {
    this.element.removeEventListener("pointerdown", this.pointerDown);
    this.element.removeEventListener("pointermove", this.pointerMove);
    this.element.removeEventListener("pointerup", this.pointerUp);
    this.element.removeEventListener("pointercancel", this.pointerUp);
    this.element.removeEventListener("wheel", this.mouseWheel);
  }

  private pointerDown = (event: PointerEvent): void => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button, input, textarea, select, label, a")) return;

    this.dragging = true;
    this.pointerId = event.pointerId;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.element.setPointerCapture?.(event.pointerId);
  };

  private pointerMove = (event: PointerEvent): void => {
    if (!this.dragging || event.pointerId !== this.pointerId) return;

    WorkspaceState.x += event.clientX - this.lastX;
    WorkspaceState.y += event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  };

  private pointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.dragging = false;
    this.pointerId = null;
  };

  private mouseWheel = (event: WheelEvent): void => {
    if (!event.ctrlKey && !event.metaKey) return;

    event.preventDefault();
    WorkspaceState.zoom = Math.max(0.3, Math.min(3, WorkspaceState.zoom + event.deltaY * -0.001));
  };
}
