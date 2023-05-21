export interface Output {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bezierCurveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number
  ): void;
  quadraticCurveTo(x1: number, y1: number, x: number, y: number);
  closePath(): void;
  fill(): void;
}

const dpr = devicePixelRatio;

export class CanvasOutput implements Output {
  private width: number;
  private height: number;
  private ctx: CanvasRenderingContext2D;

  constructor(
    canvas: HTMLCanvasElement,
    fillStyle?: CanvasFillStrokeStyles["fillStyle"],
    strokeStyle?: CanvasFillStrokeStyles["strokeStyle"]
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.ctx.fillStyle = fillStyle ?? "#000000";
    this.ctx.strokeStyle = strokeStyle ?? "#000000";
    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";
    canvas.width *= dpr;
    canvas.height *= dpr;
  }

  public moveTo(x: number, y: number) {
    this.ctx.moveTo(x * dpr, y * dpr);
  }

  public lineTo(x: number, y: number) {
    this.ctx.lineTo(x * dpr, y * dpr);
  }

  public bezierCurveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number
  ) {
    this.ctx.bezierCurveTo(
      x1 * dpr,
      y1 * dpr,
      x2 * dpr,
      y2 * dpr,
      x * dpr,
      y * dpr
    );
  }

  public quadraticCurveTo(x1: number, y1: number, x: number, y: number) {
    this.ctx.quadraticCurveTo(x1 * dpr, y1 * dpr, x * dpr, y * dpr);
  }

  public closePath() {
    this.ctx.closePath();
  }

  public fill() {
    this.ctx.fill();
  }
}

export class SVGOutput implements Output {
  private path = "";
  constructor(private svg: SVGElement) {
    this.svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  public moveTo(x: number, y: number) {
    this.path += `M${x},${y}`;
  }

  public lineTo(x: number, y: number) {
    this.path += `L${x},${y}`;
  }

  public bezierCurveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number
  ) {
    this.path += `C${x1},${y1},${x2},${y2},${x}${y}`;
  }

  public quadraticCurveTo(x1: number, y1: number, x: number, y: number) {
    this.path += `Q${x1},${y1},${x},${y}`;
  }

  public closePath() {
    this.path += "Z";
  }
  public fill() {
    const pathEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    pathEl.setAttribute("d", this.path);
    this.svg.append(pathEl);
    this.path = "";
  }

  public download() {
    const blob = new Blob([this.svg.outerHTML], { type: "text/svg" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "text.svg";
    a.style.display = "none";
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }
}
