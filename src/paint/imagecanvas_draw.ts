import {nstructjs, Vector2, Matrix4, util} from '../path.ux/scripts/pathux.js';
import type {ImageCanvas, ImageDataType} from './imagecanvas.js';

/* A canvas2d-shaped facade over ImageCanvas; every method is still a stub. */
export class ImageCanvasDrawer {
  canvas : ImageCanvas;
  matstack : Matrix4[];
  matrix : Matrix4;

  constructor(canvas : ImageCanvas) {
    this.canvas = canvas;
    this.matstack = [];
    this.matrix = new Matrix4();
  }

  beginPath() {

  }

  moveTo(x : number, y : number) {

  }

  lineTo(x : number, y : number) {

  }

  closePath() {

  }

  stroke() {

  }

  fill() {

  }

  bezierCurveTo(x2 : number, y2 : number, x3 : number, y3 : number,
                x4 : number, y4 : number) {

  }

  quadraticCurveTo(x2 : number, y2 : number, x3 : number, y3 : number) {

  }

  arcTo(x : number, y : number, r : number, th1 : number, th2 : number) {

  }

  rect(x : number, y : number, w : number, h : number) {

  }

  drawImage(img : ImageDataType, dx : number, dy : number,
            dw : number, dh : number) {

  }

  blit(img : ImageDataType, dx : number, dy : number) {

  }
}
