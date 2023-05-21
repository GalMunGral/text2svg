import { CanvasOutput, SVGOutput } from "./output";
import { render } from "./render";

import opentype, { Font } from "opentype.js";

let font: Font | undefined;
const fileInput = document.createElement("input");
fileInput.style.display = "block";
fileInput.type = "file";
fileInput.onchange = async (e) => {
  const buffer = await (e.target as HTMLInputElement).files?.[0].arrayBuffer();
  font = opentype.parse(buffer);
};

const textInput = document.createElement("textarea");
textInput.style.display = "block";
textInput.rows = 10;

const fontSizeInput = document.createElement("input");
fontSizeInput.placeholder = "font size";
fontSizeInput.type = "number";
fontSizeInput.step = "1";

const button1 = document.createElement("button");
button1.textContent = "generate";

const button2 = document.createElement("button");
button2.textContent = "download";

const canvas = document.createElement("canvas");
canvas.style.display = "block";
canvas.width = 800;
canvas.height = 1200;

const canvasOutput = new CanvasOutput(canvas);
const svgOutput = new SVGOutput(
  document.createElementNS("http://www.w3.org/2000/svg", "svg")
);

button1.onclick = () => {
  if (font) {
    const fontSize = Number(fontSizeInput.value) || 20;
    render(canvasOutput, textInput.value, font, fontSize);
  }
};

button2.onclick = () => {
  if (font) {
    const fontSize = Number(fontSizeInput.value) || 20;
    render(svgOutput, textInput.value, font, fontSize);
    svgOutput.download();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.body.append(fileInput);
  document.body.append(textInput);
  document.body.append(fontSizeInput);
  document.body.append(button1);
  document.body.append(button2);
  document.body.append(canvas);
});
