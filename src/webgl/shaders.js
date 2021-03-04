import {ShaderProgram} from './webgl.js';
import {Matrix4} from '../path.ux/scripts/pathux.js';

export const RectShader = {
  vertex : `precision mediump float;
uniform mat4 viewMatrix;

attribute vec2 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  vec4 p = viewMatrix * vec4(position, 0.0, 1.0);
  gl_Position = p;
  
  vUv = uv; 
}
`,
  fragment : `precision mediump float;

uniform mat4 viewMatrix;
varying vec2 vUv;

uniform sampler2D rgba;

void main() {
  vec4 color = texture2D(rgba, vUv); 
  gl_FragColor = color;
}
`,
  attributes: ["position", "uv"],
  uniforms: {
    viewMatrix : new Matrix4()
  }
}

export const ShaderDef = window._ShaderDef = {
  RectShader
};

export const Shaders = window._Shaders = {

};

export function loadShader(gl, sdef) {
  let sp = new ShaderProgram(gl, sdef.vertex, sdef.fragment, sdef.attributes);

  sp.uniforms = sdef.uniforms || {};
  sp.init(gl);

  return sp;
}

export function loadShaders(gl) {
  for (let k in ShaderDef) {
    let sdef = ShaderDef[k];

    Shaders[k] = loadShader(gl, sdef);
  }
}

