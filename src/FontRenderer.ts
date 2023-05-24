import { Font, Glyph } from "opentype.js";
import { GlyphRaster, GlyphVector, PositionedGlyph } from "./Glyph";

export class FontRenderer {
  private rasters = new Map<number, GlyphRaster>();
  private vectors = new Map<number, GlyphVector>();

  private svg: SVGElement | null = null;

  constructor(private font: Font) {
    const glyphSet = font.glyphs;
    for (let i = 0; i < glyphSet.length; ++i) {
      const glyph = glyphSet.get(i);
      const unicode = glyph.unicode;
      // TODO: characters that contain multiple code points

      if (unicode) {
        // raster
        const width =
          glyph.xMax !== undefined && glyph.xMin !== undefined
            ? glyph.xMax - glyph.xMin + 1
            : 1;
        const height =
          glyph.yMax !== undefined && glyph.yMin !== undefined
            ? glyph.yMax - glyph.yMin + 1
            : 1;
        const originX =
          glyph.xMax !== undefined && glyph.xMin !== undefined
            ? -glyph.xMin
            : 0;
        const originY =
          glyph.yMax !== undefined && glyph.yMin !== undefined ? glyph.yMax : 0;

        this.vectors.set(unicode, new GlyphVector(unicode, glyph));

        this.rasters.set(
          unicode,
          new GlyphRaster(
            unicode,
            new OffscreenCanvas(width, height),
            originX,
            originY,
            glyph
          )
        );
      }
    }
  }

  public downloadSVG() {
    if (this.svg) {
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

  public render(
    ctx: CanvasRenderingContext2D,
    text: string,
    fontSize: number = 20
  ): void {
    // TODO: fix image sharpness issues
    fontSize *= devicePixelRatio;

    const scale = fontSize / this.font.unitsPerEm;
    const containerWidth = ctx.canvas.width;
    const spaceWidth = this.font.charToGlyph(" ").advanceWidth! * scale;
    // const lineHeight = 1.5 * fontSize;
    const lineHeight = scale * (this.font.ascender - this.font.descender);

    console.log(this.font.ascender, this.font.descender);

    let x = 0;
    let y = lineHeight;

    const layoutWord = (word: string): Array<PositionedGlyph> => {
      if (!word) return [];

      // FIX?: left margin
      x = Math.max(
        x,
        scale * -(this.font.charToGlyph(word[0]).leftSideBearing ?? 0)
      );

      const res: Array<PositionedGlyph> = [];
      let prevGlyph = this.font.charToGlyph(" ");
      for (const char of word) {
        const glyph = this.font.charToGlyph(char);
        const unicode = char.codePointAt(0);
        if (!unicode) continue;
        res.push(
          new PositionedGlyph(
            char,
            x,
            y,
            this.rasters.get(unicode)!,
            this.vectors.get(unicode)!
          )
        );
        const advanceWidth = glyph.advanceWidth ?? 0;
        const kerning = this.font.getKerningValue(prevGlyph, glyph);
        if (x + scale * (kerning + (glyph.xMax ?? 0)) >= containerWidth) {
          // not enough space, start a new line
          y += lineHeight;
          x = 0;
          return layoutWord(word);
        }
        x += scale * (kerning + advanceWidth);
        prevGlyph = glyph;
      }
      x += spaceWidth;
      return res;
    };

    const positionedGlyphs = text
      .split(/\s+/)
      .flatMap((word) => layoutWord(word));

    ctx.canvas.height = y + lineHeight;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const glyph of positionedGlyphs) {
      const { x, y, raster } = glyph;
      raster.draw(ctx, x, y, scale);
    }

    // make SVG
    const defs = new Set<SVGPathElement>();
    const refs = new Array<SVGUseElement>();
    for (const glyph of positionedGlyphs) {
      const { x, y, vector } = glyph;
      defs.add(vector.pathEl);
      refs.push(vector.use(x, y, scale));
    }
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    this.svg.setAttribute(
      "viewBox",
      `0 0 ${ctx.canvas.width} ${ctx.canvas.height}`
    );
    this.svg.style.width = ctx.canvas.width / devicePixelRatio + "px";
    this.svg.style.height = ctx.canvas.height / devicePixelRatio + "px";
    // this.svg.setAttribute(
    //   "transform",
    //   `scale(${1 / devicePixelRatio},${1 / devicePixelRatio})`
    // );
    const defsEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "defs"
    );
    defs.forEach((el) => defsEl.append(el.cloneNode()));
    this.svg.append(defsEl);
    refs.forEach((el) => this.svg?.append(el));
  }
}
