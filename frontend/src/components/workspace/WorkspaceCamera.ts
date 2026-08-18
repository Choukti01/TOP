import { WorkspaceState } from "./WorkspaceState";

export class WorkspaceCamera {
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  constructor(private readonly element: HTMLElement) {
    this.element.addEventListener("mousedown", this.mouseDown);
    window.addEventListener("mousemove", this.mouseMove);
    window.addEventListener("mouseup", this.mouseUp);
    this.element.addEventListener("wheel", this.mouseWheel, { passive: false });
  }

  public dispose(): void {
    this.element.removeEventListener("mousedown", this.mouseDown);
    window.removeEventListener("mousemove", this.mouseMove);
    window.removeEventListener("mouseup", this.mouseUp);
    this.element.removeEventListener("wheel", this.mouseWheel);
  }

  private mouseDown = (event: MouseEvent): void => {
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  };

  private mouseMove = (event: MouseEvent): void => {
    if (!this.dragging) return;

    WorkspaceState.x += event.clientX - this.lastX;
    WorkspaceState.y += event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  };

  private mouseUp = (): void => {
    this.dragging = false;
  };

  private mouseWheel = (event: WheelEvent): void => {
    event.preventDefault();
    WorkspaceState.zoom = Math.max(0.3, Math.min(3, WorkspaceState.zoom + event.deltaY * -0.001));
  };
}
