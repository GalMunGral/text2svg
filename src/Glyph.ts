import { Glyph } from "opentype.js";

export class PositionedGlyph {
  constructor(
    public char: string,
    public x: number,
    public y: number,
    public raster: GlyphRaster,
    public vector: GlyphVector
  ) {}
}

export class GlyphVector {
  public pathEl = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  constructor(public unicode: number, glyph: Glyph) {
    this.pathEl.setAttribute("id", String(unicode));
    this.render(glyph);
  }

  public render(glyph: Glyph): void {
    let d = "";
    for (const cmd of glyph.path.commands) {
      switch (cmd.type) {
        case "M":
          d += `M${cmd.x},${cmd.y}`;
          break;
        case "L":
          d += `L${cmd.x},${cmd.y}`;
          break;
        case "C":
          d += `C${cmd.x1},${cmd.y1},${cmd.x2},${cmd.y2},${cmd.x}${cmd.y}`;
          break;
        case "Q":
          d += `Q${cmd.x1},${cmd.y1},${cmd.x},${cmd.y}`;
          break;
        case "Z":
          d += "Z";
          break;
      }
      this.pathEl.setAttribute("d", d);
      this.pathEl.setAttribute("transform", `scale(1 -1)`);
    }
  }

  public use(x: number, y: number, scale: number): SVGUseElement {
    const useEl = document.createElementNS("http://www.w3.org/2000/svg", "use");
    useEl.setAttribute("href", "#" + this.unicode);
    useEl.setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
    return useEl;
  }
}

export class GlyphRaster {
  constructor(
    public unicode: number,
    public canvas: OffscreenCanvas,
    public originX: number,
    public originY: number,
    glyph: Glyph
  ) {
    this.render(glyph);
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number
  ): void {
    ctx.drawImage(
      this.canvas,
      x - this.originX * scale,
      y - this.originY * scale,
      this.canvas.width * scale,
      this.canvas.height * scale
    );
  }

  public render(glyph: Glyph): void {
    const ctx = this.canvas.getContext("2d")!;
    ctx.translate(this.originX, this.originY);
    ctx.scale(1, -1);
    ctx.beginPath();
    for (const cmd of glyph.path.commands) {
      switch (cmd.type) {
        case "M":
          ctx.moveTo(cmd.x, cmd.y);
          break;
        case "L":
          ctx.lineTo(cmd.x, cmd.y);
          break;
        case "C":
          ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
          break;
        case "Q":
          ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
          break;
        case "Z":
          ctx.closePath();
          break;
      }
    }
    ctx.fill();
  }
}
