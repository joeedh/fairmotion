"use strict";

//wow this file still exists
//it dates from the original Apple webgl example I turned into AllShape.

var PI = Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor,
    ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos,
    asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
    
/*
 * Copyright (C) 2009 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var HasCSSMatrix = false;
var HasCSSMatrixCopy = false;
/*
if ("WebKitCSSMatrix" in window && ("media" in window && window.media.matchMedium("(-webkit-transform-3d)")) ||
                                   ("styleMedia" in window && window.styleMedia.matchMedium("(-webkit-transform-3d)"))) {
    HasCSSMatrix = true;
    if ("copy" in WebKitCSSMatrix.prototype)
        HasCSSMatrixCopy = true;
}
*/

//  console.log("HasCSSMatrix="+HasCSSMatrix);
//  console.log("HasCSSMatrixCopy="+HasCSSMatrixCopy);

//
// Matrix4
//

var M_SQRT2 = Math.sqrt(2.0);
var FLT_EPSILON = 2.22e-16;
var premul_temp = undefined;

function internal_matrix() {
  this.m11 = 0.0; this.m12 = 0.0; this.m13 = 0.0; this.m14 = 0.0;
  this.m21 = 0.0; this.m22 = 0.0; this.m23 = 0.0; this.m24 = 0.0;
  this.m31 = 0.0; this.m32 = 0.0; this.m33 = 0.0; this.m34 = 0.0;
  this.m41 = 0.0; this.m42 = 0.0; this.m43 = 0.0; this.m44 = 0.0;
}

function internal_matrix3() {
  this.m11 = this.m12 = this.m13 = 0.0;
  this.m21 = this.m22 = this.m23 = 0.0;
  this.m31 = this.m32 = this.m33 = 0.0;
}

class Matrix3 {
  constructor(mat) {
    this.$matrix = new internal_matrix3();
    
    if (mat != undefined) {
      this.load(mat);
    } else {
      this.makeIdentity();
    }
  }
  
  load(m) {
    var m1 = this.$matrix, m2 = m.$matrix;
    
    m1.m11 = m2.m11; m1.m12 = m2.m12; m1.m13 = m2.m13;
    m1.m21 = m2.m21; m1.m22 = m2.m22; m1.m23 = m2.m23;
    m1.m31 = m2.m31; m1.m32 = m2.m32; m1.m33 = m2.m33;
    
    return this;
  }
  
  makeIdentity() {
    var m = this.$matrix;
    m.m11 = m.m12 = m.m13 = 0.0;
    m.m21 = m.m22 = m.m23 = 0.0;
    m.m31 = m.m32 = m.m33 = 0.0;
    
    m.m11 = m.m22 = m.m33 = 1.0;
    return this;
  }
  
  scale(x, y) {
    static smatrix = {
      $matrix : {
        m11 : 1, m12 : 0, m13 : 0,
        m21 : 0, m22 : 1, m23 : 0,
        m31 : 0, m32 : 0, m33 : 1
      }
    };
    
    var m = smatrix.$matrix;
    m.m11 = x;
    m.m22 = y;
    
    this.multiply(smatrix);
    return this;
  }
  
  translate(x, y) {
    static smatrix = new Matrix3();
    smatrix.makeIdentity();
    
    var m = smatrix.$matrix;
    
    m.m31 = x;
    m.m32 = y;
    
    this.multiply(smatrix);
    return this;
  }
  
  euler_rotate(x, y, z) {
    var xmat = new Matrix4();
    var m = xmat.$matrix;
    
    var c = Math.cos(x), s = Math.sin(x);
    
    m.m22 = c; m.m23 = s;
    m.m32 = -s; m.m33 = c;
    
    var ymat = new Matrix4();
    c = Math.cos(y); s = Math.sin(y);
    var m = ymat.$matrix;
    
    m.m11 = c;  m.m13 = s;
    m.m31 = -s; m.m33 = c;
    
    ymat.multiply(xmat);

    var zmat = new Matrix4();
    c = Math.cos(z); s = Math.sin(z);
    var m = zmat.$matrix;
    
    m.m11 = c;  m.m12 = -s;
    m.m21 = s;  m.m22 = c;
    
    zmat.multiply(ymat);
    
    this.preMultiply(zmat);
  }
  
  multVecMatrix(v, z_is_one=true) {
    //ik = jk
    var x = v[0], y = v[1], z = z_is_one ? 1.0 : v[2];
    
    var m = this.$matrix;
    
    v[0] = m.m11*x + m.m12*y + m.m13*z;
    v[1] = m.m21*x + m.m22*y + m.m23*z;
    v[2] = m.m31*x + m.m32*y + m.m33*z;
  }
  
  multiply(mat2) {
    m1 = this.$matrix;
    m2 = mat2.$matrix;
    
    var m11 = m2.m11*m1.m11 + m2.m12*m1.m21 + m2.m13*m1.m31;
    var m12 = m2.m11*m1.m12 + m2.m12*m1.m22 + m2.m13*m1.m32;
    var m13 = m2.m11*m1.m13 + m2.m12*m1.m23 + m2.m13*m1.m33;

    var m21 = m2.m21*m1.m11 + m2.m22*m1.m21 + m2.m23*m1.m31;
    var m22 = m2.m21*m1.m12 + m2.m22*m1.m22 + m2.m23*m1.m32;
    var m23 = m2.m21*m1.m13 + m2.m22*m1.m23 + m2.m23*m1.m33;

    var m31 = m2.m31*m1.m11 + m2.m32*m1.m21 + m2.m33*m1.m31;
    var m32 = m2.m31*m1.m12 + m2.m32*m1.m22 + m2.m33*m1.m32;
    var m33 = m2.m31*m1.m13 + m2.m32*m1.m23 + m2.m33*m1.m33;
    
    m1.m11 = m11; m1.m12 = m12; m1.m13 = m13;
    m1.m21 = m21; m1.m22 = m22; m1.m23 = m23;
    m1.m31 = m31; m1.m32 = m32; m1.m33 = m33;
    
    return this;
  }
}

class Matrix4 {
  constructor(mArray<float> m) {
      if (HasCSSMatrix)
          this.$matrix = new WebKitCSSMatrix;
      else
          this.$matrix = new internal_matrix();
    
      this.isPersp = false;
      
      if (typeof m == 'object') {
          if ("length" in m && m.length >= 16) {
              this.load(m);
              return this;
          }
          else if (m instanceof Matrix4) {
              this.load(m);
              return this;
          }
      }
      this.makeIdentity();
  }

  multVecMatrix(v, ignore_w=false) {
    var matrix = this;
    
    var x = v[0];
    var y = v[1];
    var z = v[2];

    v[0] = matrix.$matrix.m41 + x * matrix.$matrix.m11 + y * matrix.$matrix.m21 + z * matrix.$matrix.m31;
    v[1] = matrix.$matrix.m42 + x * matrix.$matrix.m12 + y * matrix.$matrix.m22 + z * matrix.$matrix.m32;
    v[2] = matrix.$matrix.m43 + x * matrix.$matrix.m13 + y * matrix.$matrix.m23 + z * matrix.$matrix.m33;
    var w = matrix.$matrix.m44 + x * matrix.$matrix.m14 + y * matrix.$matrix.m24 + z * matrix.$matrix.m34;
    
    if (!ignore_w && w != 1 && w != 0 && matrix.isPersp) {
        v[0] /= w;
        v[1] /= w;
        v[2] /= w;
    }
    
    return w;
  }
  
  load() {
      if (arguments.length == 1 && typeof arguments[0] == 'object') {
          var matrix;

          if (arguments[0] instanceof Matrix4) {
              matrix = arguments[0].$matrix;
              
              this.isPersp = arguments[0].isPersp;

              this.$matrix.m11 = matrix.m11;
              this.$matrix.m12 = matrix.m12;
              this.$matrix.m13 = matrix.m13;
              this.$matrix.m14 = matrix.m14;

              this.$matrix.m21 = matrix.m21;
              this.$matrix.m22 = matrix.m22;
              this.$matrix.m23 = matrix.m23;
              this.$matrix.m24 = matrix.m24;

              this.$matrix.m31 = matrix.m31;
              this.$matrix.m32 = matrix.m32;
              this.$matrix.m33 = matrix.m33;
              this.$matrix.m34 = matrix.m34;

              this.$matrix.m41 = matrix.m41;
              this.$matrix.m42 = matrix.m42;
              this.$matrix.m43 = matrix.m43;
              this.$matrix.m44 = matrix.m44;
              return this;
          }
          else
              matrix = arguments[0];

          if ("length" in matrix && matrix.length >= 16) {
              this.$matrix.m11 = matrix[0];
              this.$matrix.m12 = matrix[1];
              this.$matrix.m13 = matrix[2];
              this.$matrix.m14 = matrix[3];

              this.$matrix.m21 = matrix[4];
              this.$matrix.m22 = matrix[5];
              this.$matrix.m23 = matrix[6];
              this.$matrix.m24 = matrix[7];

              this.$matrix.m31 = matrix[8];
              this.$matrix.m32 = matrix[9];
              this.$matrix.m33 = matrix[10];
              this.$matrix.m34 = matrix[11];

              this.$matrix.m41 = matrix[12];
              this.$matrix.m42 = matrix[13];
              this.$matrix.m43 = matrix[14];
              this.$matrix.m44 = matrix[15];
              return this;
          }
      }

      this.makeIdentity();
      return this;
  }

  toJSON() {
    return {isPersp: this.isPersp, items: this.getAsArray()};
  }
  
  static fromJSON(json) {
  //Matrix4.fromJSON = function(json) {
    var mat = new Matrix4()
    
    mat.load(json.items)
    mat.isPersp = json.isPersp
    
    return mat;
  }
  //}

  getAsArray() : Array<float>
  {
      return [
          this.$matrix.m11, this.$matrix.m12, this.$matrix.m13, this.$matrix.m14,
          this.$matrix.m21, this.$matrix.m22, this.$matrix.m23, this.$matrix.m24,
          this.$matrix.m31, this.$matrix.m32, this.$matrix.m33, this.$matrix.m34,
          this.$matrix.m41, this.$matrix.m42, this.$matrix.m43, this.$matrix.m44
      ];
  }

  getAsFloat32Array() : Float32Array
  {
      if (HasCSSMatrixCopy) {
          var array = new Float32Array(16);
          this.$matrix.copy(array);
          return array;
      }
      return new Float32Array(this.getAsArray());
  }

  setUniform(WebGLRenderingContext ctx, WebGLUniformLocation loc, Boolean transpose)
  {
      if (Matrix4.setUniformArray == undefined) {
          Matrix4.setUniformWebGLArray = new Float32Array(16);
          Matrix4.setUniformArray = new Array(16);
      }

      if (HasCSSMatrixCopy)
          this.$matrix.copy(Matrix4.setUniformWebGLArray);
      else {
          Matrix4.setUniformArray[0] = this.$matrix.m11;
          Matrix4.setUniformArray[1] = this.$matrix.m12;
          Matrix4.setUniformArray[2] = this.$matrix.m13;
          Matrix4.setUniformArray[3] = this.$matrix.m14;
          Matrix4.setUniformArray[4] = this.$matrix.m21;
          Matrix4.setUniformArray[5] = this.$matrix.m22;
          Matrix4.setUniformArray[6] = this.$matrix.m23;
          Matrix4.setUniformArray[7] = this.$matrix.m24;
          Matrix4.setUniformArray[8] = this.$matrix.m31;
          Matrix4.setUniformArray[9] = this.$matrix.m32;
          Matrix4.setUniformArray[10] = this.$matrix.m33;
          Matrix4.setUniformArray[11] = this.$matrix.m34;
          Matrix4.setUniformArray[12] = this.$matrix.m41;
          Matrix4.setUniformArray[13] = this.$matrix.m42;
          Matrix4.setUniformArray[14] = this.$matrix.m43;
          Matrix4.setUniformArray[15] = this.$matrix.m44;

          Matrix4.setUniformWebGLArray.set(Matrix4.setUniformArray);
      }

      ctx.uniformMatrix4fv(loc, transpose, Matrix4.setUniformWebGLArray);
  }

  makeIdentity()
  {
      this.$matrix.m11 = 1;
      this.$matrix.m12 = 0;
      this.$matrix.m13 = 0;
      this.$matrix.m14 = 0;

      this.$matrix.m21 = 0;
      this.$matrix.m22 = 1;
      this.$matrix.m23 = 0;
      this.$matrix.m24 = 0;

      this.$matrix.m31 = 0;
      this.$matrix.m32 = 0;
      this.$matrix.m33 = 1;
      this.$matrix.m34 = 0;

      this.$matrix.m41 = 0;
      this.$matrix.m42 = 0;
      this.$matrix.m43 = 0;
      this.$matrix.m44 = 1;
      
      return this;
  }

  transpose()
  {
      var tmp = this.$matrix.m12;
      this.$matrix.m12 = this.$matrix.m21;
      this.$matrix.m21 = tmp;

      tmp = this.$matrix.m13;
      this.$matrix.m13 = this.$matrix.m31;
      this.$matrix.m31 = tmp;

      tmp = this.$matrix.m14;
      this.$matrix.m14 = this.$matrix.m41;
      this.$matrix.m41 = tmp;

      tmp = this.$matrix.m23;
      this.$matrix.m23 = this.$matrix.m32;
      this.$matrix.m32 = tmp;

      tmp = this.$matrix.m24;
      this.$matrix.m24 = this.$matrix.m42;
      this.$matrix.m42 = tmp;

      tmp = this.$matrix.m34;
      this.$matrix.m34 = this.$matrix.m43;
      this.$matrix.m43 = tmp;
      
      return this;
  }

  invert()
  {
      if (HasCSSMatrix) {
          this.$matrix = this.$matrix.inverse();
          return this;
      }

      // Calculate the 4x4 determinant
      // If the determinant is zero,
      // then the inverse matrix is not unique.
      var det = this._determinant4x4();

      if (Math.abs(det) < 1e-8)
          return null;

      this._makeAdjoint();

      // Scale the adjoint matrix to get the inverse
      this.$matrix.m11 /= det;
      this.$matrix.m12 /= det;
      this.$matrix.m13 /= det;
      this.$matrix.m14 /= det;

      this.$matrix.m21 /= det;
      this.$matrix.m22 /= det;
      this.$matrix.m23 /= det;
      this.$matrix.m24 /= det;

      this.$matrix.m31 /= det;
      this.$matrix.m32 /= det;
      this.$matrix.m33 /= det;
      this.$matrix.m34 /= det;

      this.$matrix.m41 /= det;
      this.$matrix.m42 /= det;
      this.$matrix.m43 /= det;
      this.$matrix.m44 /= det;
      
      return this;
  }

  translate(float x, float y, float z)
  {
      if (typeof x == 'object' && "length" in x) {
          var t = x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      else {
          if (x == undefined)
              x = 0;
          if (y == undefined)
              y = 0;
          if (z == undefined)
              z = 0;
      }

      if (HasCSSMatrix) {
          this.$matrix = this.$matrix.translate(x, y, z);
          return;
      }

      var matrix = new Matrix4();
      matrix.$matrix.m41 = x;
      matrix.$matrix.m42 = y;
      matrix.$matrix.m43 = z;

      this.multiply(matrix);
  }
  
  preTranslate(float x, float y, float z)
  {
      if (typeof x == 'object' && "length" in x) {
          var t = x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      else {
          if (x == undefined)
              x = 0;
          if (y == undefined)
              y = 0;
          if (z == undefined)
              z = 0;
      }

      if (HasCSSMatrix) {
          this.$matrix = this.$matrix.translate(x, y, z);
          return;
      }

      var matrix = new Matrix4();
      matrix.$matrix.m41 = x;
      matrix.$matrix.m42 = y;
      matrix.$matrix.m43 = z;

      this.preMultiply(matrix);
  }

  scale(float x, float y, float z)
  {
      if (typeof x == 'object' && "length" in x) {
          var t = x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      else {
          if (x == undefined)
              x = 1;
          if (z == undefined) {
              if (y == undefined) {
                  y = x;
                  z = x;
              }
              else
                  z = 1;
          }
          else if (y == undefined)
              y = x;
      }

      if (HasCSSMatrix) {
          this.$matrix = this.$matrix.scale(x, y, z);
          return;
      }

      var matrix = new Matrix4();
      matrix.$matrix.m11 = x;
      matrix.$matrix.m22 = y;
      matrix.$matrix.m33 = z;

      this.multiply(matrix);
  }

  rotate(float angle,float x,float y,float z)
  {
      // Forms are (angle, x,y,z), (angle,vector), (angleX, angleY, angleZ), (angle)
      if (typeof x == 'object' && "length" in x) {
          var t = x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      else {
          if (arguments.length == 1) {
              x = 0;
              y = 0;
              z = 1;
          }
          else if (arguments.length == 3) {
              this.rotate(angle, 1,0,0); // about X axis
              this.rotate(x, 0,1,0); // about Y axis
              this.rotate(y, 0,0,1); // about Z axis
              return;
          }
      }

      if (HasCSSMatrix) {
          this.$matrix = this.$matrix.rotateAxisAngle(x, y, z, angle);
          return;
      }

      angle /= 2;
      var sinA = Math.sin(angle);
      var cosA = Math.cos(angle);
      var sinA2 = sinA * sinA;

      // normalize
      var len = Math.sqrt(x * x + y * y + z * z);
      if (len == 0) {
          // bad vector, just use something reasonable
          x = 0;
          y = 0;
          z = 1;
      } else if (len != 1) {
          x /= len;
          y /= len;
          z /= len;
      }

      var mat = new Matrix4();

      // optimize case where axis is along major axis
      if (x == 1 && y == 0 && z == 0) {
          mat.$matrix.m11 = 1;
          mat.$matrix.m12 = 0;
          mat.$matrix.m13 = 0;
          mat.$matrix.m21 = 0;
          mat.$matrix.m22 = 1 - 2 * sinA2;
          mat.$matrix.m23 = 2 * sinA * cosA;
          mat.$matrix.m31 = 0;
          mat.$matrix.m32 = -2 * sinA * cosA;
          mat.$matrix.m33 = 1 - 2 * sinA2;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      } else if (x == 0 && y == 1 && z == 0) {
          mat.$matrix.m11 = 1 - 2 * sinA2;
          mat.$matrix.m12 = 0;
          mat.$matrix.m13 = -2 * sinA * cosA;
          mat.$matrix.m21 = 0;
          mat.$matrix.m22 = 1;
          mat.$matrix.m23 = 0;
          mat.$matrix.m31 = 2 * sinA * cosA;
          mat.$matrix.m32 = 0;
          mat.$matrix.m33 = 1 - 2 * sinA2;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      } else if (x == 0 && y == 0 && z == 1) {
          mat.$matrix.m11 = 1 - 2 * sinA2;
          mat.$matrix.m12 = 2 * sinA * cosA;
          mat.$matrix.m13 = 0;
          mat.$matrix.m21 = -2 * sinA * cosA;
          mat.$matrix.m22 = 1 - 2 * sinA2;
          mat.$matrix.m23 = 0;
          mat.$matrix.m31 = 0;
          mat.$matrix.m32 = 0;
          mat.$matrix.m33 = 1;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      } else {
          var x2 = x*x;
          var y2 = y*y;
          var z2 = z*z;

          mat.$matrix.m11 = 1 - 2 * (y2 + z2) * sinA2;
          mat.$matrix.m12 = 2 * (x * y * sinA2 + z * sinA * cosA);
          mat.$matrix.m13 = 2 * (x * z * sinA2 - y * sinA * cosA);
          mat.$matrix.m21 = 2 * (y * x * sinA2 - z * sinA * cosA);
          mat.$matrix.m22 = 1 - 2 * (z2 + x2) * sinA2;
          mat.$matrix.m23 = 2 * (y * z * sinA2 + x * sinA * cosA);
          mat.$matrix.m31 = 2 * (z * x * sinA2 + y * sinA * cosA);
          mat.$matrix.m32 = 2 * (z * y * sinA2 - x * sinA * cosA);
          mat.$matrix.m33 = 1 - 2 * (x2 + y2) * sinA2;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      }
      this.multiply(mat);
  }

  preMultiply(Matrix4 mat) {
    var mat2 = premul_temp;
    
    mat2.load(this);
    this.load(mat);
    
    return this.multiply(mat2);
  }
  
  multiply(Matrix4 mat)
  {
      if (HasCSSMatrix) {
          this.$matrix = this.$matrix.multiply(mat.$matrix);
          return;
      }

      var m11 = (mat.$matrix.m11 * this.$matrix.m11 + mat.$matrix.m12 * this.$matrix.m21
                 + mat.$matrix.m13 * this.$matrix.m31 + mat.$matrix.m14 * this.$matrix.m41);
      var m12 = (mat.$matrix.m11 * this.$matrix.m12 + mat.$matrix.m12 * this.$matrix.m22
                 + mat.$matrix.m13 * this.$matrix.m32 + mat.$matrix.m14 * this.$matrix.m42);
      var m13 = (mat.$matrix.m11 * this.$matrix.m13 + mat.$matrix.m12 * this.$matrix.m23
                 + mat.$matrix.m13 * this.$matrix.m33 + mat.$matrix.m14 * this.$matrix.m43);
      var m14 = (mat.$matrix.m11 * this.$matrix.m14 + mat.$matrix.m12 * this.$matrix.m24
                 + mat.$matrix.m13 * this.$matrix.m34 + mat.$matrix.m14 * this.$matrix.m44);

      var m21 = (mat.$matrix.m21 * this.$matrix.m11 + mat.$matrix.m22 * this.$matrix.m21
                 + mat.$matrix.m23 * this.$matrix.m31 + mat.$matrix.m24 * this.$matrix.m41);
      var m22 = (mat.$matrix.m21 * this.$matrix.m12 + mat.$matrix.m22 * this.$matrix.m22
                 + mat.$matrix.m23 * this.$matrix.m32 + mat.$matrix.m24 * this.$matrix.m42);
      var m23 = (mat.$matrix.m21 * this.$matrix.m13 + mat.$matrix.m22 * this.$matrix.m23
                 + mat.$matrix.m23 * this.$matrix.m33 + mat.$matrix.m24 * this.$matrix.m43);
      var m24 = (mat.$matrix.m21 * this.$matrix.m14 + mat.$matrix.m22 * this.$matrix.m24
                 + mat.$matrix.m23 * this.$matrix.m34 + mat.$matrix.m24 * this.$matrix.m44);

      var m31 = (mat.$matrix.m31 * this.$matrix.m11 + mat.$matrix.m32 * this.$matrix.m21
                 + mat.$matrix.m33 * this.$matrix.m31 + mat.$matrix.m34 * this.$matrix.m41);
      var m32 = (mat.$matrix.m31 * this.$matrix.m12 + mat.$matrix.m32 * this.$matrix.m22
                 + mat.$matrix.m33 * this.$matrix.m32 + mat.$matrix.m34 * this.$matrix.m42);
      var m33 = (mat.$matrix.m31 * this.$matrix.m13 + mat.$matrix.m32 * this.$matrix.m23
                 + mat.$matrix.m33 * this.$matrix.m33 + mat.$matrix.m34 * this.$matrix.m43);
      var m34 = (mat.$matrix.m31 * this.$matrix.m14 + mat.$matrix.m32 * this.$matrix.m24
                 + mat.$matrix.m33 * this.$matrix.m34 + mat.$matrix.m34 * this.$matrix.m44);

      var m41 = (mat.$matrix.m41 * this.$matrix.m11 + mat.$matrix.m42 * this.$matrix.m21
                 + mat.$matrix.m43 * this.$matrix.m31 + mat.$matrix.m44 * this.$matrix.m41);
      var m42 = (mat.$matrix.m41 * this.$matrix.m12 + mat.$matrix.m42 * this.$matrix.m22
                 + mat.$matrix.m43 * this.$matrix.m32 + mat.$matrix.m44 * this.$matrix.m42);
      var m43 = (mat.$matrix.m41 * this.$matrix.m13 + mat.$matrix.m42 * this.$matrix.m23
                 + mat.$matrix.m43 * this.$matrix.m33 + mat.$matrix.m44 * this.$matrix.m43);
      var m44 = (mat.$matrix.m41 * this.$matrix.m14 + mat.$matrix.m42 * this.$matrix.m24
                 + mat.$matrix.m43 * this.$matrix.m34 + mat.$matrix.m44 * this.$matrix.m44);

      this.$matrix.m11 = m11;
      this.$matrix.m12 = m12;
      this.$matrix.m13 = m13;
      this.$matrix.m14 = m14;

      this.$matrix.m21 = m21;
      this.$matrix.m22 = m22;
      this.$matrix.m23 = m23;
      this.$matrix.m24 = m24;

      this.$matrix.m31 = m31;
      this.$matrix.m32 = m32;
      this.$matrix.m33 = m33;
      this.$matrix.m34 = m34;

      this.$matrix.m41 = m41;
      this.$matrix.m42 = m42;
      this.$matrix.m43 = m43;
      this.$matrix.m44 = m44;
  }

  divide(float divisor)
  {
      this.$matrix.m11 /= divisor;
      this.$matrix.m12 /= divisor;
      this.$matrix.m13 /= divisor;
      this.$matrix.m14 /= divisor;

      this.$matrix.m21 /= divisor;
      this.$matrix.m22 /= divisor;
      this.$matrix.m23 /= divisor;
      this.$matrix.m24 /= divisor;

      this.$matrix.m31 /= divisor;
      this.$matrix.m32 /= divisor;
      this.$matrix.m33 /= divisor;
      this.$matrix.m34 /= divisor;

      this.$matrix.m41 /= divisor;
      this.$matrix.m42 /= divisor;
      this.$matrix.m43 /= divisor;
      this.$matrix.m44 /= divisor;

  }

  ortho(float left, float right, float bottom, float top, float near, float far)
  {
      var tx = (left + right) / (left - right);
      var ty = (top + bottom) / (top - bottom);
      var tz = (far + near) / (far - near);

      var matrix = new Matrix4();
      matrix.$matrix.m11 = 2 / (left - right);
      matrix.$matrix.m12 = 0;
      matrix.$matrix.m13 = 0;
      matrix.$matrix.m14 = 0;
      matrix.$matrix.m21 = 0;
      matrix.$matrix.m22 = 2 / (top - bottom);
      matrix.$matrix.m23 = 0;
      matrix.$matrix.m24 = 0;
      matrix.$matrix.m31 = 0;
      matrix.$matrix.m32 = 0;
      matrix.$matrix.m33 = -2 / (far - near);
      matrix.$matrix.m34 = 0;
      matrix.$matrix.m41 = tx;
      matrix.$matrix.m42 = ty;
      matrix.$matrix.m43 = tz;
      matrix.$matrix.m44 = 1;

      this.multiply(matrix);
  }

  frustum(float left, float right, float bottom, float top, float near, float far)
  {
      var matrix = new Matrix4();
      var A = (right + left) / (right - left);
      var B = (top + bottom) / (top - bottom);
      var C = -(far + near) / (far - near);
      var D = -(2 * far * near) / (far - near);

      matrix.$matrix.m11 = (2 * near) / (right - left);
      matrix.$matrix.m12 = 0;
      matrix.$matrix.m13 = 0;
      matrix.$matrix.m14 = 0;

      matrix.$matrix.m21 = 0;
      matrix.$matrix.m22 = 2 * near / (top - bottom);
      matrix.$matrix.m23 = 0;
      matrix.$matrix.m24 = 0;

      matrix.$matrix.m31 = A;
      matrix.$matrix.m32 = B;
      matrix.$matrix.m33 = C;
      matrix.$matrix.m34 = -1;

      matrix.$matrix.m41 = 0;
      matrix.$matrix.m42 = 0;
      matrix.$matrix.m43 = D;
      matrix.$matrix.m44 = 0;
      
      this.isPersp = true;
      this.multiply(matrix);
  }

  perspective(float fovy, float aspect, float zNear, float zFar)
  {
      var top = Math.tan(fovy * Math.PI / 360) * zNear;
      var bottom = -top;
      var left = aspect * bottom;
      var right = aspect * top;
      this.frustum(left, right, bottom, top, zNear, zFar);
  }

  lookat(float eyex, float eyey, float eyez, float centerx, float centery, float centerz, float upx, float upy, float upz)
  {
      if (typeof eyez == 'object' && "length" in eyez) {
          var t = eyez;
          upx = t[0];
          upy = t[1];
          upz = t[2];

          t = eyey;
          centerx = t[0];
          centery = t[1];
          centerz = t[2];

          t = eyex;
          eyex = t[0];
          eyey = t[1];
          eyez = t[2];
      }

      var matrix = new Matrix4();

      // Make rotation matrix

      // Z vector
      var zx = eyex - centerx;
      var zy = eyey - centery;
      var zz = eyez - centerz;
      var mag = Math.sqrt(zx * zx + zy * zy + zz * zz);
      if (mag) {
          zx /= mag;
          zy /= mag;
          zz /= mag;
      }

      // Y vector
      var yx = upx;
      var yy = upy;
      var yz = upz;
      var xx, xy, xz;
      
      // X vector = Y cross Z
      xx =  yy * zz - yz * zy;
      xy = -yx * zz + yz * zx;
      xz =  yx * zy - yy * zx;

      // Recompute Y = Z cross X
      yx = zy * xz - zz * xy;
      yy = -zx * xz + zz * xx;
      yx = zx * xy - zy * xx;

      // cross product gives area of parallelogram, which is < 1.0 for
      // non-perpendicular unit-length vectors; so normalize x, y here

      mag = Math.sqrt(xx * xx + xy * xy + xz * xz);
      if (mag) {
          xx /= mag;
          xy /= mag;
          xz /= mag;
      }

      mag = Math.sqrt(yx * yx + yy * yy + yz * yz);
      if (mag) {
          yx /= mag;
          yy /= mag;
          yz /= mag;
      }

      matrix.$matrix.m11 = xx;
      matrix.$matrix.m12 = xy;
      matrix.$matrix.m13 = xz;
      matrix.$matrix.m14 = 0;

      matrix.$matrix.m21 = yx;
      matrix.$matrix.m22 = yy;
      matrix.$matrix.m23 = yz;
      matrix.$matrix.m24 = 0;

      matrix.$matrix.m31 = zx;
      matrix.$matrix.m32 = zy;
      matrix.$matrix.m33 = zz;
      matrix.$matrix.m34 = 0;

      matrix.$matrix.m41 = 0;
      matrix.$matrix.m42 = 0;
      matrix.$matrix.m43 = 0;
      matrix.$matrix.m44 = 1;
      matrix.translate(-eyex, -eyey, -eyez);

      this.multiply(matrix);
  }

  // Returns true on success, false otherwise. All params are Array objects
  decompose(Vector3 _translate, Vector3 _rotate, Vector3 _scale, Vector3 _skew, Vector3 _perspective)
  {
      // Normalize the matrix.
      if (this.$matrix.m44 == 0)
          return false;

      // Gather the params
      var translate, rotate, scale, skew, perspective;

      var translate = (_translate == undefined || !("length" in _translate)) ? new Vector3 : _translate;
      var rotate = (_rotate == undefined || !("length" in _rotate)) ? new Vector3 : _rotate;
      var scale = (_scale == undefined || !("length" in _scale)) ? new Vector3 : _scale;
      var skew = (_skew == undefined || !("length" in _skew)) ? new Vector3 : _skew;
      var perspective = (_perspective == undefined || !("length" in _perspective)) ? new Array(4) : _perspective;

      var matrix = new Matrix4(this);

      matrix.divide(matrix.$matrix.m44);

      // perspectiveMatrix is used to solve for perspective, but it also provides
      // an easy way to test for singularity of the upper 3x3 component.
      var perspectiveMatrix = new Matrix4(matrix);

      perspectiveMatrix.$matrix.m14 = 0;
      perspectiveMatrix.$matrix.m24 = 0;
      perspectiveMatrix.$matrix.m34 = 0;
      perspectiveMatrix.$matrix.m44 = 1;

      if (perspectiveMatrix._determinant4x4() == 0)
          return false;

      // First, isolate perspective.
      if (matrix.$matrix.m14 != 0 || matrix.$matrix.m24 != 0 || matrix.$matrix.m34 != 0) {
          // rightHandSide is the right hand side of the equation.
          var rightHandSide = [ matrix.$matrix.m14, matrix.$matrix.m24, matrix.$matrix.m34, matrix.$matrix.m44 ];

          // Solve the equation by inverting perspectiveMatrix and multiplying
          // rightHandSide by the inverse.
          var inversePerspectiveMatrix = new Matrix4(perspectiveMatrix);
          inversePerspectiveMatrix.invert();
          var transposedInversePerspectiveMatrix = new Matrix4(inversePerspectiveMatrix);
          transposedInversePerspectiveMatrix.transpose();
          transposedInversePerspectiveMatrix.multVecMatrix(perspective, rightHandSide);

          // Clear the perspective partition
          matrix.$matrix.m14 = matrix.$matrix.m24 = matrix.$matrix.m34 = 0
          matrix.$matrix.m44 = 1;
      }
      else {
          // No perspective.
          perspective[0] = perspective[1] = perspective[2] = 0;
          perspective[3] = 1;
      }

      // Next take care of translation
      translate[0] = matrix.$matrix.m41
      matrix.$matrix.m41 = 0
      translate[1] = matrix.$matrix.m42
      matrix.$matrix.m42 = 0
      translate[2] = matrix.$matrix.m43
      matrix.$matrix.m43 = 0

      // Now get scale and shear. 'row' is a 3 element array of 3 component vectors
      var row0 = new Vector3([matrix.$matrix.m11, matrix.$matrix.m12, matrix.$matrix.m13]);
      var row1 = new Vector3([matrix.$matrix.m21, matrix.$matrix.m22, matrix.$matrix.m23]);
      var row2 = new Vector3([matrix.$matrix.m31, matrix.$matrix.m32, matrix.$matrix.m33]);

      // Compute X scale factor and normalize first row.
      scale[0] = row0.vectorLength();
      row0.divide(scale[0]);

      // Compute XY shear factor and make 2nd row orthogonal to 1st.
      skew[0] = row0.dot(row1);
      row1.combine(row0, 1.0, -skew[0]);

      // Now, compute Y scale and normalize 2nd row.
      scale[1] = row1.vectorLength();
      row1.divide(scale[1]);
      skew[0] /= scale[1];

      // Compute XZ and YZ shears, orthogonalize 3rd row
      skew[1] = row1.dot(row2);
      row2.combine(row0, 1.0, -skew[1]);
      skew[2] = row1.dot(row2);
      row2.combine(row1, 1.0, -skew[2]);

      // Next, get Z scale and normalize 3rd row.
      scale[2] = row2.vectorLength();
      row2.divide(scale[2]);
      skew[1] /= scale[2];
      skew[2] /= scale[2];

      // At this point, the matrix (in rows) is orthonormal.
      // Check for a coordinate system flip.  If the determinant
      // is -1, then negate the matrix and the scaling factors.
      var pdum3 = new Vector3(row1);
      pdum3.cross(row2);
      if (row0.dot(pdum3) < 0) {
          for (var i = 0; i < 3; i++) {
              scale[i] *= -1;
              row[0][i] *= -1;
              row[1][i] *= -1;
              row[2][i] *= -1;
          }
      }

      // Now, get the rotations out
      rotate[1] = Math.asin(-row0[2]);
      if (Math.cos(rotate[1]) != 0) {
          rotate[0] = Math.atan2(row1[2], row2[2]);
          rotate[2] = Math.atan2(row0[1], row0[0]);
      }
      else {
          rotate[0] = Math.atan2(-row2[0], row1[1]);
          rotate[2] = 0;
      }

      // Convert rotations to radians
      var rad2deg = 180 / Math.PI;
      rotate[0] *= rad2deg;
      rotate[1] *= rad2deg;
      rotate[2] *= rad2deg;

      return true;
  }

  _determinant2x2(float a, float b, float c, float d)
  {
      return a * d - b * c;
  }

  _determinant3x3(float a1, float a2, float a3, 
              float b1, float b2, float b3, float c1, float c2, float c3)
  {
      return a1 * this._determinant2x2(b2, b3, c2, c3)
           - b1 * this._determinant2x2(a2, a3, c2, c3)
           + c1 * this._determinant2x2(a2, a3, b2, b3);
  }

  _determinant4x4()
  {
      var a1 = this.$matrix.m11;
      var b1 = this.$matrix.m12;
      var c1 = this.$matrix.m13;
      var d1 = this.$matrix.m14;

      var a2 = this.$matrix.m21;
      var b2 = this.$matrix.m22;
      var c2 = this.$matrix.m23;
      var d2 = this.$matrix.m24;

      var a3 = this.$matrix.m31;
      var b3 = this.$matrix.m32;
      var c3 = this.$matrix.m33;
      var d3 = this.$matrix.m34;

      var a4 = this.$matrix.m41;
      var b4 = this.$matrix.m42;
      var c4 = this.$matrix.m43;
      var d4 = this.$matrix.m44;

      return a1 * this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4)
           - b1 * this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4)
           + c1 * this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4)
           - d1 * this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
  }

  _makeAdjoint()
  {
      var a1 = this.$matrix.m11;
      var b1 = this.$matrix.m12;
      var c1 = this.$matrix.m13;
      var d1 = this.$matrix.m14;

      var a2 = this.$matrix.m21;
      var b2 = this.$matrix.m22;
      var c2 = this.$matrix.m23;
      var d2 = this.$matrix.m24;

      var a3 = this.$matrix.m31;
      var b3 = this.$matrix.m32;
      var c3 = this.$matrix.m33;
      var d3 = this.$matrix.m34;

      var a4 = this.$matrix.m41;
      var b4 = this.$matrix.m42;
      var c4 = this.$matrix.m43;
      var d4 = this.$matrix.m44;

      // Row column labeling reversed since we transpose rows & columns
      this.$matrix.m11  =   this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4);
      this.$matrix.m21  = - this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4);
      this.$matrix.m31  =   this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4);
      this.$matrix.m41  = - this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);

      this.$matrix.m12  = - this._determinant3x3(b1, b3, b4, c1, c3, c4, d1, d3, d4);
      this.$matrix.m22  =   this._determinant3x3(a1, a3, a4, c1, c3, c4, d1, d3, d4);
      this.$matrix.m32  = - this._determinant3x3(a1, a3, a4, b1, b3, b4, d1, d3, d4);
      this.$matrix.m42  =   this._determinant3x3(a1, a3, a4, b1, b3, b4, c1, c3, c4);

      this.$matrix.m13  =   this._determinant3x3(b1, b2, b4, c1, c2, c4, d1, d2, d4);
      this.$matrix.m23  = - this._determinant3x3(a1, a2, a4, c1, c2, c4, d1, d2, d4);
      this.$matrix.m33  =   this._determinant3x3(a1, a2, a4, b1, b2, b4, d1, d2, d4);
      this.$matrix.m43  = - this._determinant3x3(a1, a2, a4, b1, b2, b4, c1, c2, c4);

      this.$matrix.m14  = - this._determinant3x3(b1, b2, b3, c1, c2, c3, d1, d2, d3);
      this.$matrix.m24  =   this._determinant3x3(a1, a2, a3, c1, c2, c3, d1, d2, d3);
      this.$matrix.m34  = - this._determinant3x3(a1, a2, a3, b1, b2, b3, d1, d2, d3);
      this.$matrix.m44  =   this._determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3);
  }
}

premul_temp = new Matrix4();

#define USE_OLD_VECLIB
#ifdef USE_OLD_VECLIB
var M_SQRT2 = Math.sqrt(2.0);
var FLT_EPSILON = 2.22e-16;

function saacos(float fac)
{
	if (fac <= -1.0) return Math.pi;
	else if (fac >=  1.0) return 0.0;
	else return Math.acos(fac);
}

function saasin(float fac)
{
	if (fac <= -1.0) return -Math.pi / 2.0;
	else if (fac >=  1.0) return  Math.pi / 2.0;
	else return Math.asin(fac);
}

var _temp_xyz_vecs = []
for (var i=0; i<32; i++) {
  _temp_xyz_vecs.push(null);
}

var _temp_xyz_cur = 0;

//
// Vector3
//
class Vector3 extends Array {
  constructor(vec : Array<float>) {
    super()

    this.Vector3_init(vec);
  }

  Vector3_init(vec : Array<float>) {
    if (self.length === undefined) {
      self.length = 3;
      self[0] = 0;
      self[1] = 0;
      self[2] = 0;
    }

    static init = [0, 0, 0];
    
    if (vec == undefined)
      vec = init;
      
    if (vec[0] == undefined) vec[0] = 0;
    if (vec[1] == undefined) vec[1] = 0;
    if (vec[2] == undefined) vec[2] = 0;
    
    if (typeof(vec) == "number" || typeof(vec[0]) != "number")
      throw new Error("Invalid argument to new Vector3(vec)")
    
    this.length = 3;
    
    this[0] = vec[0];
    this[1] = vec[1];
    this[2] = vec[2];
  }

  toCSS() {
    var r = ~~(this[0]*255);
    var g = ~~(this[1]*255);
    var b = ~~(this[2]*255);
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  
  toJSON() {
    var arr = new Array(this.length);
    
    var i = 0;
    for (var i=0; i<this.length; i++) {
      arr[i] = this[i];
    }
    
    return arr;
  }

  zero()
  {
    this[0] = 0.0;
    this[1] = 0.0;
    this[2] = 0.0;
    
    return this;
  }

  floor() {
    this[0] = Math.floor(this[0]);
    this[1] = Math.floor(this[1]);
    this[2] = Math.floor(this[2]);
    
    return this;
  }

  ceil() {
    this[0] = Math.ceil(this[0]);
    this[1] = Math.ceil(this[1]);
    this[2] = Math.ceil(this[2]);
    
    return this;
  }

  loadxy(Array<float> vec2, float z=0) {
    this[0] = vec2[0];
    this[1] = vec2[1];
    this[3] = z;
    
    return this;
  }
  
  load(Array<float> vec3)
  {
    this[0] = vec3[0];
    this[1] = vec3[1];
    this[2] = vec3[2];
    
    return this;
  }

  loadXYZ(float x, float y, float z)
  {
    this[0] = x;
    this[1] = y;
    this[2] = z;
    
    return this;
  }

  static temp_xyz(float x, float y, float z)
  {
    var vec = _temp_xyz_vecs[_temp_xyz_cur];
    
    if (vec == null) {
      vec = new Vector3();
      _temp_xyz_vecs[_temp_xyz_cur] = vec;
    }
    
    _temp_xyz_cur = (_temp_xyz_cur+1) % _temp_xyz_vecs.length;
    
    vec.loadXYZ(x, y, z);
    
    return vec;
  }

  getAsArray() : Array<float>
  {
      return [ this[0], this[1], this[2] ];
  }

  min(Vector3 b)
  {
    this[0] = Math.min(this[0], b[0]);
    this[1] = Math.min(this[1], b[1]);
    this[2] = Math.min(this[2], b[2]);
    
    return this;
  }

  max(Vector3 b)
  {
    this[0] = Math.max(this[0], b[0]);
    this[1] = Math.max(this[1], b[1]);
    this[2] = Math.max(this[2], b[2]);
    
    return this;
  }

  floor(Vector3 b)
  {
    this[0] = Math.floor(this[0], b[0]);
    this[1] = Math.floor(this[1], b[1]);
    this[2] = Math.floor(this[2], b[2]);
    
    return this;
  }

  ceil(Vector3 b)
  {
    this[0] = Math.ceil(this[0], b[0]);
    this[1] = Math.ceil(this[1], b[1]);
    this[2] = Math.ceil(this[2], b[2]);
    
    return this;
  }

  round(Vector3 b)
  {
    this[0] = Math.round(this[0], b[0]);
    this[1] = Math.round(this[1], b[1]);
    this[2] = Math.round(this[2], b[2]);
    
    return this;
  }

  getAsFloat32Array()
  {
      return new Float32Array(this.getAsArray());
  }

  vectorLength()
  {
      return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]);
  }

  rot2d(angle) {
    angle += PI/2;
    var x  = this[0], y = this[1];
    
    this[0] = sin(angle)*x + cos(angle)*y;
    this[1] = sin(angle)*y - cos(angle)*x;
    
    return this;
  }
  
  normalize()
  {
    var len = this.vectorLength();
    if (len > FLT_EPSILON*2) this.mulScalar(1.0/len);
    
    return this;
  }

  negate()
  {
    this[0] = -this[0];
    this[1] = -this[1];
    this[2] = -this[2];
    
    return this;
  }

  fast_normalize()
  {
    var d = this[0]*this[0] + this[1]*this[1] + this[2]*this[2];
    //var n = d > 1.0 ? d*0.5 : d*2;
    //var n2=n*n, n4=n2*n2, n8=n4*n4;
    //var n6=n4*n2;
    
    var len = Math.sqrt(d); //n*n*n*n + 6*n*n*d + d*d;
    if (len > FLT_EPSILON) 
      return 0;
      
    //var div = 4*n*(n*n + d);
    //len = len / div;
    
    this[0] /= len;
    this[1] /= len;
    this[2] /= len;
    
    return this;
  }
  
  divideVect(Array<float> v)
  {
      this[0] /= v[0]; this[1] /= v[1]; this[2] /= v[2];
      
      return this;
  }

  divide(float divisor)
  {
      this[0] /= divisor; this[1] /= divisor; this[2] /= divisor;
      
      return this;
  }

  divideScalar(float divisor)
  {
      this[0] /= divisor; this[1] /= divisor; this[2] /= divisor;
      
      return this;
  }

  divScalar(float divisor)
  {
      this[0] /= divisor; this[1] /= divisor; this[2] /= divisor;
      
      return this;
  }

  divVector(Vector3 vec)
  {
      this[0] /= vec[0]; this[1] /= vec[1]; this[2] /= vec[2];
      
      return this;
  }
  
  subScalar(float scalar)
  {
    this[0] -= scalar; this[1] -= scalar; this[2] -= scalar;
    return this;
  }
  
  addScalar(float scalar)
  {
    this[0] += scalar; this[1] += scalar; this[2] += scalar;
    return this;
  }
  
  mulScalar(float scalar)
  {
      this[0] *= scalar; this[1] *= scalar; this[2] *= scalar;
      
      return this;
  }

  mul(Vector3 v)
  {
      this[0] =  this[0] * v[0];
      this[1] =  this[1] * v[1];
      this[2] =  this[2] * v[2];
      
      return this;
  }

  cross(Vector3 v)
  {
    static _tmp = [0, 0, 0];
    _tmp[0] = this[1] * v[2] - this[2] * v[1];
    _tmp[1] = this[2] * v[0] - this[0] * v[2];
    _tmp[2] = this[0] * v[1] - this[1] * v[0];

    this[0] = _tmp[0]; this[1] = _tmp[1]; this[2] = _tmp[2];

    return this;
  }

  vectorDistance(Vector3 v2) {
    static vec = new Vector3();
    
    vec.load(this);
    vec.sub(v2);
    
    return vec.vectorLength();
  }

  vectorDotDistance(Vector3 v2) {
    static vec = new Vector3();
    
    vec.load(this);
    vec.sub(v2);
    
    return vec.dot(vec);
  }
  
  sub(Vector3 v)
  {
    if (v == null || v == undefined)
      console.trace()
      
    this[0] =  this[0] - v[0];
    this[1] =  this[1] - v[1];
    this[2] =  this[2] - v[2];
    
    return this;
  }

  add(Vector3 v)
  {
      this[0] =  this[0] + v[0];
      this[1] =  this[1] + v[1];
      this[2] =  this[2] + v[2];
      
      return this;
  }

  static_add(Vector3 v)
  {
    static add = new Vector3();
    
    add[0] =  this[0] + v[0];
    add[1] =  this[1] + v[1];
    add[2] =  this[2] + v[2];
    
    return add;
  }

  static_sub(Vector3 v)
  {
    static _static_sub = new Vector3();
    _static_sub[0] =  this[0] - v[0];
    _static_sub[1] =  this[1] - v[1];
    _static_sub[2] =  this[2] - v[2];

    return _static_sub;
  }

  static_mul(Vector3 v)
  {
    static _static_mul = new Vector3();
    _static_mul[0] =  this[0] * v[0];
    _static_mul[1] =  this[1] * v[1];
    _static_mul[2] =  this[2] * v[2];
    
    return _static_mul;
  }

  static_divide(Vector3 v)
  {
      static _static_divide = new Vector3();
      _static_divide[0] =  this[0] / v[0];
      _static_divide[1] =  this[1] / v[1];
      _static_divide[2] =  this[2] / v[2];
      
      return _static_divide;
  }

  static_addScalar(float s)
  {
      static _static_addScalar = new Vector3();
      _static_addScalar[0] =  this[0] + s;
      _static_addScalar[1] =  this[1] + s;
      _static_addScalar[2] =  this[2] + s;
      
      return _static_addScalar;
  }

  static_subScalar(float s)
  {
      static _static_subScalar = new Vector3();
      _static_subScalar[0] =  this[0] - s;
      _static_subScalar[1] =  this[1] - s;
      _static_subScalar[2] =  this[2] - s;
      
      return _static_subScalar;
  }

  static_mulScalar(float s)
  {
      static _static_mulScalar = new Vector3();
      _static_mulScalar[0] =  this[0] * s;
      _static_mulScalar[1] =  this[1] * s;
      _static_mulScalar[2] =  this[2] * s;
      
      return _static_mulScalar;
  }

  _static_divideScalar(float s)
  {
      static _static_divideScalar = new Vector3();
      _static_divideScalar[0] =  this[0] / s;
      _static_divideScalar[1] =  this[1] / s;
      _static_divideScalar[2] =  this[2] / s;
      
      return _static_divideScalar;
  }

  dot(Vector3 v)
  {
      return this[0] * v[0] + this[1] * v[1] + this[2] * v[2];
  }

  normalizedDot(Vector3 v)
  {
    static n1 = new Vector3()
    static n2 = new Vector3()

    n1.load(this);
    n2.load(v);
    
    n1.normalize();
    n2.normalize();
    
    return n1.dot(n2);
  }

  static normalizedDot4(Vector3 v1, Vector3 v2, Vector3 v3, Vector3 v4)
  {
    static _v3nd4_n1 = new Vector3();
    static _v3nd4_n2 = new Vector3();
    
    _v3nd4_n1.load(v2).sub(v1).normalize();
    _v3nd4_n2.load(v4).sub(v3).normalize();
    
    return _v3nd4_n1.dot(_v3nd4_n2);
  }
  
  static normalizedDot3(Vector3 v1, Vector3 v2, Vector3 v3)
  {
    static n1 = new Vector3(), n2 = new Vector3();
    
    n1.load(v1).sub(v2).normalize();
    n2.load(v3).sub(v2).normalize();
    
    return n1.dot(n2);
  }

  preNormalizedAngle(Vector3 v2)
  {
    /* this is the same as acos(dot_v3v3(this, v2)), but more accurate */
    if (this.dot(v2) < 0.0) {
      var vec = new Vector3();

      vec[0] = -v2[0];
      vec[1] = -v2[1];
      vec[2] = -v2[2];

      return Math.pi - 2.0 * saasin(vec.vectorDistance(this) / 2.0);
    }
    else
      return 2.0 * saasin(v2.vectorDistance(this) / 2.0);
  }

  combine(Vector3 v, float ascl, float bscl)
  {
      this[0] = (ascl * this[0]) + (bscl * v[0]);
      this[1] = (ascl * this[1]) + (bscl * v[1]);
      this[2] = (ascl * this[2]) + (bscl * v[2]);
  }

  mulVecQuat(Vector4 q)
  {
    var t0 = -this[1] * this[0] - this[2] * this[1] - this[3] * this[2];
    var t1 = this[0] * this[0] + this[2] * this[2] - this[3] * this[1];
    var t2 = this[0] * this[1] + this[3] * this[0] - this[1] * this[2];
    this[2] = this[0] * this[2] + this[1] * this[1] - this[2] * this[0];
    this[0] = t1;
    this[1] = t2;

    t1 = t0 * -this[1] + this[0] * this[0] - this[1] * this[3] + this[2] * this[2];
    t2 = t0 * -this[2] + this[1] * this[0] - this[2] * this[1] + this[0] * this[3];
    this[2] = t0 * -this[3] + this[2] * this[0] - this[0] * this[2] + this[1] * this[1];
    this[0] = t1;
    this[1] = t2;
  }

  multVecMatrix(Matrix4 matrix, ignore_w=false)
  { 
    matrix.multVecMatrix(this, ignore_w);
    /*
      var x = this[0];
      var y = this[1];
      var z = this[2];

      this[0] = matrix.$matrix.m41 + x * matrix.$matrix.m11 + y * matrix.$matrix.m21 + z * matrix.$matrix.m31;
      this[1] = matrix.$matrix.m42 + x * matrix.$matrix.m12 + y * matrix.$matrix.m22 + z * matrix.$matrix.m32;
      this[2] = matrix.$matrix.m43 + x * matrix.$matrix.m13 + y * matrix.$matrix.m23 + z * matrix.$matrix.m33;
      var w = matrix.$matrix.m44 + x * matrix.$matrix.m14 + y * matrix.$matrix.m24 + z * matrix.$matrix.m34;
      if (!ignore_w && w != 1 && w != 0 && matrix.isPersp) {
          this[0] /= w;
          this[1] /= w;
          this[2] /= w;
      }
      
      return w;*/
  }

  interp(Vector3 b, Number t) {
    this[0] += (b[0]-this[0])*t;
    this[1] += (b[1]-this[1])*t;
    this[2] += (b[2]-this[2])*t;
  }

  toString() : String
  {
      return "["+this[0]+","+this[1]+","+this[2]+"]";
  }
}

var _vec2_init = [0, 0];
var _v2_static_mvm_co = new Vector3();

class Vector2 extends Array {
  constructor(Array<float> vec) {
    super(2);
    
    if (vec == undefined)
      vec = _vec2_init;
    
    if (vec[0] == undefined) vec[0] = 0;
    if (vec[1] == undefined) vec[1] = 0;
    
    if (typeof(vec) == "number" || typeof(vec[0]) != "number")
      throw new Error("Invalid argument to new Vector2(vec): " + JSON.stringify(vec))
    
    this[0] = vec[0];
    this[1] = vec[1];
    
    this.length = 2;
  }

  toJSON() {
    var arr = new Array(this.length);
    
    var i = 0;
    for (var i=0; i<this.length; i++) {
      arr[i] = this[i];
    }
    
    return arr;
  }

  dot(b) {
    return this[0]*b[0] + this[1]*b[1]
  }

  load(b) {
    this[0] = b[0];
    this[1] = b[1];
    
    return this;
  }

  zero() {
    this[0] = this[1] = 0.0;
    
    return this;
  }

  floor() {
    this[0] = Math.floor(this[0]);
    this[1] = Math.floor(this[1]);
    
    return this;
  }

  ceil() {
    this[0] = Math.ceil(this[0]);
    this[1] = Math.ceil(this[1]);
    
    return this;
  }

  vectorDistance(b) {
    var x, y;
    
    x = this[0]-b[0]
    y = this[1]-b[1];
    return Math.sqrt(x*x + y*y);
  }


  vectorLength() {
    return Math.sqrt(this[0]*this[0] + this[1]*this[1]);
  }

  sub(b) {
    this[0] -= b[0];
    this[1] -= b[1];
    
    return this;
  }

  add(b) {
    this[0] += b[0];
    this[1] += b[1];
    
    return this;
  }

  mul(b) {
    this[0] *= b[0];
    this[1] *= b[1];
    
    return this;
  }

  divide(b) {
    this[0] /= b[0];
    this[1] /= b[1];
    
    return this;
  }

  divideScalar(b) {
    this[0] /= b;
    this[1] /= b;
    
    return this;
  }

  negate()
  {
    this[0] = -this[0];
    this[1] = -this[1];
    
    return this;
  }

  mulScalar(b) {
    this[0] *= b;
    this[1] *= b;
    
    return this;
  }

  addScalar(b) {
    this[0] += b;
    this[1] += b;
    
    return this;
  }

  subScalar(b) {
    this[0] -= b;
    this[1] -= b;
    
    return this;
  }

  multVecMatrix(mat) {
    var v3 = _v2_static_mvm_co;
    
    v3[0] = this[0];
    v3[1] = this[1];
    v3[2] = 0.0;
    v3.multVecMatrix(mat);
    
    this[0] = v3[0];
    this[1] = v3[1];
    
    return this;
  }

  normalize() {
    var vlen = this.vectorLength();
    if (vlen < FLT_EPSILON) {
      this[0] = this[1] = 0.0;
      return;
    }
    
    this[0] /= vlen;
    this[1] /= vlen;
    
    return this;
  }

  toSource() {
    return "new Vector2([" + this[0] + ", " + this[1] + "])";
  }

  toString() {
    return "[" + this[0] + ", " + this[1] + "]";
  }

  interp(Vector2 b, Number t) {
    this[0] += (b[0]-this[0])*t;
    this[1] += (b[1]-this[1])*t;
  }
}

//XX Kill this function!
function Color(Array<float> color) {
  var c = new Array<float>();
  c[0] = color[0]
  c[1] = color[1]
  c[2] = color[2]
  c[3] = color[3]
  
  return c;
}


//
// Vector4
//
class Vector4 extends Array {
  constructor(float x, float y, float z, float w)
  {
    super(4);
    this.length = 4;
    this.load(x,y,z,w);
  }
  
  toCSS() {
    var r = ~~(this[0]*255);
    var g = ~~(this[1]*255);
    var b = ~~(this[2]*255);
    var a = this[3];
    
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
  
  toJSON() {
    var arr = new Array(this.length);
    
    var i = 0;
    for (var i=0; i<this.length; i++) {
      arr[i] = this[i];
    }
    
    return arr;
  }

  load(x,y,z,w)
  {
      if (typeof x == 'object' && "length" in x) {
          this[0] = x[0];
          this[1] = x[1];
          this[2] = x[2];
          this[3] = x[3];
      }
      else if (typeof x == 'number') {
          this[0] = x;
          this[1] = y;
          this[2] = z;
          this[3] = w;
      }
      else {
          this[0] = 0;
          this[1] = 0;
          this[2] = 0;
          this[3] = 0;
      }
      
      return this;
  }

  floor() {
    this[0] = Math.floor(this[0]);
    this[1] = Math.floor(this[1]);
    this[2] = Math.floor(this[2]);
    this[3] = Math.floor(this[3]);
    
    return this;
  }

  ceil() {
    this[0] = Math.ceil(this[0]);
    this[1] = Math.ceil(this[1]);
    this[2] = Math.ceil(this[2]);
    this[3] = Math.ceil(this[3]);
    
    return this;
  }

  getAsArray() : Array<float>
  {
      return [ this[0], this[1], this[2], this[3] ];
  }

  getAsFloat32Array() : Float32Array
  {
      return new Float32Array(this.getAsArray());
  }

  vectorLength() : float
  {
      return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2] + this[3] * this[3]);
  }

  normalize()
  {
    var len = this.vectorLength();
    if (len > FLT_EPSILON) this.mulScalar(1.0/len);
    
    return len;
  }

  divide(float divisor)
  {
      this[0] /= divisor; this[1] /= divisor; this[2] /= divisor; this[3] /= divisor;
  }

  negate()
  {
    this[0] = -this[0];
    this[1] = -this[1];
    this[2] = -this[2];
    this[3] = -this[3];

    return this;
  }

  mulScalar(float scalar)
  {
      this[0] *= scalar; this[1] *= scalar; this[2] *= scalar; this[3] *= scalar;
      
      return this;
  }

  mul(float scalar)
  {
      this[0] =  this[0] * v[0];
      this[1] =  this[1] * v[1];
      this[2] =  this[2] * v[2];
      this[3] =  this[3] * v[3];
  }

  cross(Vector4 v)
  {
      this[0] =  this[1] * v[2] - this[2] * v[1];
      this[1] = -this[0] * v[2] + this[2] * v[0];
      this[2] =  this[0] * v[1] - this[1] * v[0];
      //what do I do with the fourth component?
  }

  sub(Vector4 v)
  {
    this[0] =  this[0] - v[0];
    this[1] =  this[1] - v[1];
    this[2] =  this[2] - v[2];
    this[3] =  this[3] - v[3];
  }

  add(Vector4 v)
  {
      this[0] =  this[0] + v[0];
      this[1] =  this[1] + v[1];
      this[2] =  this[2] + v[2];
      this[3] =  this[3] + v[3];
  }

  dot(Vector4 v)
  {
      return this[0] * v[0] + this[1] * v[1] + this[2] * v[2] + this[3] * v[3];
  }

  combine(Vector4 v, float ascl, float bscl)
  {
      this[0] = (ascl * this[0]) + (bscl * v[0]);
      this[1] = (ascl * this[1]) + (bscl * v[1]);
      this[2] = (ascl * this[2]) + (bscl * v[2]);
      this[3] = (ascl * this[3]) + (bscl * v[3]);
  }

  multVecMatrix(Matrix4 matrix)
  {
      var x = this[0];
      var y = this[1];
      var z = this[2];
      var w = this[3];

      this[0] = matrix.$matrix.m41 + x * matrix.$matrix.m11 + y * matrix.$matrix.m21 + z * matrix.$matrix.m31 + w*matrix.$matrix.m41;
      this[1] = matrix.$matrix.m42 + x * matrix.$matrix.m12 + y * matrix.$matrix.m22 + z * matrix.$matrix.m32 + w*matrix.$matrix.m42;
      this[2] = matrix.$matrix.m43 + x * matrix.$matrix.m13 + y * matrix.$matrix.m23 + z * matrix.$matrix.m33 + w*matrix.$matrix.m43;
      this[3] = w*matrix.$matrix.m44 + x * matrix.$matrix.m14 + y * matrix.$matrix.m24 + z * matrix.$matrix.m34;
      
      return w;
  }

  interp(Vector4 b, Number t) {
    this[0] += (b[0]-this[0])*t;
    this[1] += (b[1]-this[1])*t;
    this[2] += (b[2]-this[2])*t;
    this[3] += (b[3]-this[3])*t;  
  }

  toString() : String
  {
      return "["+this[0]+","+this[1]+","+this[2]+","+this[3]+"]";
  }
}
#endif

//Quaternion
class Quat extends Vector4 {
  constructor(float x, float y, float z, float w)
  {
    super(vec);
    static v4init = [0, 0, 0, 0]
    var vec = v4init;
    
    if (typeof(x) == "number") {
      v4init[0] = x; v4init[1] = y; v4init[2] = z; v4init[3] = w;
    } else {
      vec = x;
    }
  }

  load(x,y,z,w)
  {
      if (typeof x == 'object' && "length" in x) {
          this[0] = x[0];
          this[1] = x[1];
          this[2] = x[2];
          this[3] = x[3];
      }
      else if (typeof x == 'number') {
          this[0] = x;
          this[1] = y;
          this[2] = z;
          this[3] = w;
      }
      else {
          this[0] = 0;
          this[1] = 0;
          this[2] = 0;
          this[3] = 0;
      }
  }

  makeUnitQuat()
  {
    this[0] = 1.0;
    this[1] = this[2] = this[3] = 0.0;
  }

  isZero() : Boolean
  {
    return (this[0] == 0 && this[1] == 0 && this[2] == 0 && this[3] == 0);
  }

  mulQuat(Quat q2)
  {
    var t0 = this[0] * q2[0] - this[1] * q2[1] - this[2] * q2[2] - this[3] * q2[3];
    var t1 = this[0] * q2[1] + this[1] * q2[0] + this[2] * q2[3] - this[3] * q2[2];
    var t2 = this[0] * q2[2] + this[2] * q2[0] + this[3] * q2[1] - this[1] * q2[3];
    this[3] = this[0] * q2[3] + this[3] * q2[0] + this[1] * q2[2] - this[2] * q2[1];
    this[0] = t0;
    this[1] = t1;
    this[2] = t2;
  }

  conjugate()
  {
    this[1] = -this[1];
    this[2] = -this[2];
    this[3] = -this[3];
  }

  dotWithQuat(Quat q2)
  {
    return this[0] * q2[0] + this[1] * q2[1] + this[2] * q2[2] + this[3] * q2[3];
  }

  invert()
  {
    var f = this.dot();

    if (f == 0.0)
      return;

    conjugate_qt(q);
    this.mulscalar(1.0 / f);
  }

  sub(Quat q2)
  {
    var nq2 = new Quat();

    nq2[0] = -q2[0];
    nq2[1] = q2[1];
    nq2[2] = q2[2];
    nq2[3] = q2[3];
    
    this.mul(nq2);
  }

  mulScalarWithFactor(float fac)
  {
    var angle = fac * saacos(this[0]);
    var co = Math.cos(angle);
    var si = Math.sin(angle);
    this[0] = co;
    
    var last3 = Vector3([this[1], this[2], this[3]]);
    last3.normalize();
    
    last3.mulScalar(si);
    this[1] = last3[0];
    this[2] = last3[1];
    this[3] = last3[2];
    
    return this;
  }

  toMatrix()
  {
    var m = new Matrix4()
    
    var q0 = M_SQRT2 * this[0];
    var q1 = M_SQRT2 * this[1];
    var q2 = M_SQRT2 * this[2];
    var q3 = M_SQRT2 * this[3];

    var qda = q0 * q1;
    var qdb = q0 * q2;
    var qdc = q0 * q3;
    var qaa = q1 * q1;
    var qab = q1 * q2;
    var qac = q1 * q3;
    var qbb = q2 * q2;
    var qbc = q2 * q3;
    var qcc = q3 * q3;
    
    m.$matrix.m11 = (1.0 - qbb - qcc);
    m.$matrix.m12 = (qdc + qab);
    m.$matrix.m13 = (-qdb + qac);
    m.$matrix.m14 = 0.0;

    m.$matrix.m21 = (-qdc + qab);
    m.$matrix.m22 = (1.0 - qaa - qcc);
    m.$matrix.m23 = (qda + qbc);
    m.$matrix.m24 = 0.0;

    m.$matrix.m31 = (qdb + qac);
    m.$matrix.m32 = (-qda + qbc);
    m.$matrix.m33 = (1.0 - qaa - qbb);
    m.$matrix.m34 = 0.0;

    m.$matrix.m41 = m.$matrix.m42 = m.$matrix.m43 = 0.0;
    m.$matrix.m44 = 1.0;
    
    return m;
  }

  matrixToQuat(Matrix4 wmat)
  {
    var mat = new Matrix4(wmat);
    
    /* work on a copy */
    
    /*normalize the input matrix, as if it were a 3x3 mat. This is needed AND a 'normalize_qt' in the end */
    mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
    mat.$matrix.m44 = 1.0;
    
    var r1 = new Vector3([mat.$matrix.m11, mat.$matrix.m12, mat.$matrix.m13]);
    var r2 = new Vector3([mat.$matrix.m21, mat.$matrix.m22, mat.$matrix.m23]);
    var r3 = new Vector3([mat.$matrix.m31, mat.$matrix.m32, mat.$matrix.m33]);
    r1.normalize();
    r2.normalize();
    r3.normalize();

    mat.$matrix.m11 = r1[0]; mat.$matrix.m12 = r1[1]; mat.$matrix.m13 = r1[2]; 
    mat.$matrix.m21 = r2[0]; mat.$matrix.m22 = r2[1]; mat.$matrix.m23 = r2[2]; 
    mat.$matrix.m31 = r3[0]; mat.$matrix.m32 = r3[1]; mat.$matrix.m33 = r3[2]; 
    
    /*now for the main calculations*/
    var tr = 0.25 * (1.0 + mat[0][0] + mat[1][1] + mat[2][2]);
    var s = 0;
    
    if (tr > FLT_EPSILON) {
      s = Math.sqrt(tr);
      this[0] = s;
      s = 1.0 / (4.0 * s);
      this[1] = ((mat[1][2] - mat[2][1]) * s);
      this[2] = ((mat[2][0] - mat[0][2]) * s);
      this[3] = ((mat[0][1] - mat[1][0]) * s);
    }
    else {
      if (mat[0][0] > mat[1][1] && mat[0][0] > mat[2][2]) {
        s = 2.0 * Math.sqrt(1.0 + mat[0][0] - mat[1][1] - mat[2][2]);
        this[1] = (0.25 * s);

        s = 1.0 / s;
        this[0] = ((mat[2][1] - mat[1][2]) * s);
        this[2] = ((mat[1][0] + mat[0][1]) * s);
        this[3] = ((mat[2][0] + mat[0][2]) * s);
      }
      else if (mat[1][1] > mat[2][2]) {
        s = 2.0 * Math.sqrt(1.0 + mat[1][1] - mat[0][0] - mat[2][2]);
        this[2] = (0.25 * s);

        s = 1.0 / s;
        this[0] = ((mat[2][0] - mat[0][2]) * s);
        this[1] = ((mat[1][0] + mat[0][1]) * s);
        this[3] = ((mat[2][1] + mat[1][2]) * s);
      }
      else {
        s = 2.0 * Math.sqrt(1.0 + mat[2][2] - mat[0][0] - mat[1][1]);
        this[3] = (0.25 * s);

        s = 1.0 / s;
        this[0] = ((mat[1][0] - mat[0][1]) * s);
        this[1] = ((mat[2][0] + mat[0][2]) * s);
        this[2] = ((mat[2][1] + mat[1][2]) * s);
      }
    }

    this.normalize();
  }

  normalize() : float
  {

    var len = Math.sqrt(this.dot(this))
    if (len != 0.0) {
      this.mulScalar(1.0 / len);
    }
    else {
      this[1] = 1.0;
      this[0] = this[2] = this[3] = 0.0;
    }

    return len;
  }

  /* Axis angle to Quaternions */
  axisAngleToQuat(Vector3 axis, float angle)
  {
    var nor = new Vector3(axis);
    
    if (nor.normalize() != 0.0) {
      var phi = angle / 2.0;
      var si = Math.sin(phi);
      this[0] = Math.cos(phi);
      this[1] = nor[0] * si;
      this[2] = nor[1] * si;
      this[3] = nor[2] * si;
    }
    else {
      this.makeUnitQuat();
    }
  }

  rotationBetweenVecs(Vector3 v1, Vector3 v2) 
  {
    v1 = new Vector3(v1);
    v2 = new Vector3(v2);
    v1.normalize();
    v2.normalize();
    
    var axis = new Vector3(v1);
    axis.cross(v2);

    var angle = v1.preNormalizedAngle(v2);
    
    this.axisAngleToQuat(axis, angle);
  }

  quatInterp(Quat quat2, float t)
  {
    var quat = new Quat();
    
    var cosom = this[0] * quat2[0] + this[1] * quat2[1] + this[2] * quat2[2] + this[3] * quat2[3];

    /* rotate around shortest angle */
    if (cosom < 0.0) {
      cosom = -cosom;
      quat[0] = -this[0];
      quat[1] = -this[1];
      quat[2] = -this[2];
      quat[3] = -this[3];
    }
    else {
      quat[0] = this[0];
      quat[1] = this[1];
      quat[2] = this[2];
      quat[3] = this[3];
    }
    
    var omega, sinom, sc1, sc2;
    if ((1.0 - cosom) > 0.0001) {
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      sc1 = Math.sin((1.0 - t) * omega) / sinom;
      sc2 = Math.sin(t * omega) / sinom;
    }
    else {
      sc1 = 1.0 - t;
      sc2 = t;
    }

    this[0] = sc1 * quat[0] + sc2 * quat2[0];
    this[1] = sc1 * quat[1] + sc2 * quat2[1];
    this[2] = sc1 * quat[2] + sc2 * quat2[2];
    this[3] = sc1 * quat[3] + sc2 * quat2[3];
  }
}

window.Vector2 = Vector2;
window.Vector3 = Vector3;
window.Vector4 = Vector4;
window.Quat = Quat;
window.Matrix4 = Matrix4;
