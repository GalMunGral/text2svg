import { FontRenderer } from "./FontRenderer";

import opentype, { Font } from "opentype.js";

let renderer: FontRenderer | undefined;

const fileInput = document.createElement("input");
fileInput.style.display = "block";
fileInput.type = "file";
fileInput.onchange = async (e) => {
  const buffer = await (e.target as HTMLInputElement).files?.[0].arrayBuffer();
  const font = opentype.parse(buffer);
  renderer = new FontRenderer(font);
};

const textInput = document.createElement("textarea");
textInput.style.display = "block";
textInput.rows = 10;

const fontSizeInput = document.createElement("input");
fontSizeInput.placeholder = "font size";
fontSizeInput.type = "number";
fontSizeInput.step = "1";

const button1 = document.createElement("button");
button1.textContent = "preview";

const button2 = document.createElement("button");
button2.textContent = "download";

const canvas = document.createElement("canvas");
canvas.width = 1200 * devicePixelRatio;
canvas.style.display = "block";
canvas.style.border = "1px solid black";
canvas.style.width = canvas.width / devicePixelRatio + "px";

const ctx = canvas.getContext("2d")!;

button1.onclick = () => {
  if (renderer) {
    const fontSize = Number(fontSizeInput.value) || 20;
    renderer.render(ctx, textInput.value, fontSize);
  }
};

button2.onclick = () => {
  if (renderer) {
    renderer.downloadSVG();
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
