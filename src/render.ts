import { Font, Glyph } from "opentype.js";
import { Output } from "./output";

export function render(
  output: Output,
  text: string,
  font: Font,
  fontSize: number = 20,
  width: number = 800
): void {
  let x = 0;
  let y = fontSize;
  let prevGlyph: Glyph | null = null;

  const scale = fontSize / font.unitsPerEm;
  const lineHeight = fontSize + scale * (font.ascender + font.descender);

  for (const char of text) {
    if (char == "\n") {
      x = 0;
      y += lineHeight;
      prevGlyph = null;
      continue;
    }

    const glyph = font.charToGlyph(char);
    const advanceWidth = scale * (glyph.advanceWidth ?? 0);
    const kerning = prevGlyph
      ? scale * font.getKerningValue(prevGlyph, glyph)
      : 0;

    x += kerning;
    if (x + advanceWidth > width) {
      x = 0;
      y += lineHeight;
      prevGlyph = null;
    } else {
      prevGlyph = glyph;
    }

    const toDeviceX = (v: number) => x + scale * v;
    const toDeviceY = (v: number) => y - scale * v;

    for (const cmd of glyph.path.commands) {
      switch (cmd.type) {
        case "M":
          output.moveTo(toDeviceX(cmd.x), toDeviceY(cmd.y));
          break;
        case "L":
          output.lineTo(toDeviceX(cmd.x), toDeviceY(cmd.y));
          break;
        case "C":
          output.bezierCurveTo(
            toDeviceX(cmd.x1),
            toDeviceY(cmd.y1),
            toDeviceX(cmd.x2),
            toDeviceY(cmd.y2),
            toDeviceX(cmd.x),
            toDeviceY(cmd.y)
          );
          break;
        case "Q":
          output.quadraticCurveTo(
            toDeviceX(cmd.x1),
            toDeviceY(cmd.y1),
            toDeviceX(cmd.x),
            toDeviceY(cmd.y)
          );
          break;
        case "Z":
          output.closePath();
          break;
      }
    }
    output.fill();
    x += advanceWidth;
  }
}
