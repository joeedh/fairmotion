// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include <GLES2/gl2.h>

#include <math.h>
#include <stddef.h>
#include <stdint.h>
#include <stdarg.h>
#include <stdio.h>
#include <string.h>
#include <time.h>

#include "vector3d.h"
#include "solver.h"
#include "spline.h"

#include "matrix.h"
#include "graphics_3d.h"

#ifdef WIN32
#undef PostMessage
// Allow 'this' in initializer list
#pragma warning(disable : 4355)
#endif

extern const uint8_t kRLETextureData[];
extern const size_t kRLETextureDataLength;

namespace {

//#define DEBUG_PERF
#ifdef DEBUG_PERF
#define LOGPERF(format, time) logf(format, time)
#else
#define LOGPERF(format, time)
#endif

const float kFovY = 45.0f;
const float kZNear = 1.0f;
const float kZFar = 10.0f;
const float kCameraZ = -4.0f;
const float kXAngleDelta = 2.0f;
const float kYAngleDelta = 0.5f;

const size_t kTextureDataLength = 128 * 128 * 3;  // 128x128, 3 Bytes/pixel.

// The decompressed data is written here.
uint8_t g_texture_data[kTextureDataLength];

double time_ms() {
  return ((double)clock() / (double)CLOCKS_PER_SEC)*1000.0;
}

GLuint CompileShader(GLenum type, const char* data) {
    return 0; //XXX

  GLuint shader = glCreateShader(type);
  glShaderSource(shader, 1, &data, NULL);
  glCompileShader(shader);

  GLint compile_status;
  glGetShaderiv(shader, GL_COMPILE_STATUS, &compile_status);
  if (compile_status != GL_TRUE) {
    // Shader failed to compile, let's see what the error is.
    char buffer[1024];
    GLsizei length;
    glGetShaderInfoLog(shader, sizeof(buffer), &length, &buffer[0]);
    fprintf(stderr, "Shader failed to compile: %s\n", buffer);
    return 0;
  }

  return shader;
}

GLuint LinkProgram(GLuint frag_shader, GLuint vert_shader) {
    return 0; //XXX
  GLuint program = glCreateProgram();
  glAttachShader(program, frag_shader);
  glAttachShader(program, vert_shader);
  glLinkProgram(program);

  GLint link_status;
  glGetProgramiv(program, GL_LINK_STATUS, &link_status);
  if (link_status != GL_TRUE) {
    // Program failed to link, let's see what the error is.
    char buffer[1024];
    GLsizei length;
    glGetProgramInfoLog(program, sizeof(buffer), &length, &buffer[0]);
    fprintf(stderr, "Program failed to link: %s\n", buffer);
    return 0;
  }

  return program;
}

const char kFragShaderSource[] =
    "precision mediump float;\n"
    "varying vec3 v_color;\n"
    "varying vec2 v_texcoord;\n"
    "uniform sampler2D u_texture;\n"
    "void main() {\n"
    "  gl_FragColor = texture2D(u_texture, v_texcoord);\n"
    "  gl_FragColor += vec4(v_color, 1);\n"
    "}\n";

const char kVertexShaderSource[] =
    "uniform mat4 u_mvp;\n"
    "attribute vec2 a_texcoord;\n"
    "attribute vec3 a_color;\n"
    "attribute vec4 a_position;\n"
    "varying vec3 v_color;\n"
    "varying vec2 v_texcoord;\n"
    "void main() {\n"
    "  gl_Position = u_mvp * a_position;\n"
    "  v_color = a_color;\n"
    "  v_texcoord = a_texcoord;\n"
    "}\n";

struct Vertex {
  float loc[3];
  float color[3];
  float tex[2];
};

const Vertex kCubeVerts[24] = {
  // +Z (red arrow, black tip)
  {{-1.0, -1.0, +1.0}, {0.0, 0.0, 0.0}, {1.0, 0.0}},
  {{+1.0, -1.0, +1.0}, {0.0, 0.0, 0.0}, {0.0, 0.0}},
  {{+1.0, +1.0, +1.0}, {0.5, 0.0, 0.0}, {0.0, 1.0}},
  {{-1.0, +1.0, +1.0}, {0.5, 0.0, 0.0}, {1.0, 1.0}},

  // +X (green arrow, black tip)
  {{+1.0, -1.0, -1.0}, {0.0, 0.0, 0.0}, {1.0, 0.0}},
  {{+1.0, +1.0, -1.0}, {0.0, 0.0, 0.0}, {0.0, 0.0}},
  {{+1.0, +1.0, +1.0}, {0.0, 0.5, 0.0}, {0.0, 1.0}},
  {{+1.0, -1.0, +1.0}, {0.0, 0.5, 0.0}, {1.0, 1.0}},

  // +Y (blue arrow, black tip)
  {{-1.0, +1.0, -1.0}, {0.0, 0.0, 0.0}, {1.0, 0.0}},
  {{-1.0, +1.0, +1.0}, {0.0, 0.0, 0.0}, {0.0, 0.0}},
  {{+1.0, +1.0, +1.0}, {0.0, 0.0, 0.5}, {0.0, 1.0}},
  {{+1.0, +1.0, -1.0}, {0.0, 0.0, 0.5}, {1.0, 1.0}},

  // -Z (red arrow, red tip)
  {{+1.0, +1.0, -1.0}, {0.0, 0.0, 0.0}, {1.0, 1.0}},
  {{-1.0, +1.0, -1.0}, {0.0, 0.0, 0.0}, {0.0, 1.0}},
  {{-1.0, -1.0, -1.0}, {1.0, 0.0, 0.0}, {0.0, 0.0}},
  {{+1.0, -1.0, -1.0}, {1.0, 0.0, 0.0}, {1.0, 0.0}},

  // -X (green arrow, green tip)
  {{-1.0, +1.0, +1.0}, {0.0, 0.0, 0.0}, {1.0, 1.0}},
  {{-1.0, -1.0, +1.0}, {0.0, 0.0, 0.0}, {0.0, 1.0}},
  {{-1.0, -1.0, -1.0}, {0.0, 1.0, 0.0}, {0.0, 0.0}},
  {{-1.0, +1.0, -1.0}, {0.0, 1.0, 0.0}, {1.0, 0.0}},

  // -Y (blue arrow, blue tip)
  {{+1.0, -1.0, +1.0}, {0.0, 0.0, 0.0}, {1.0, 1.0}},
  {{+1.0, -1.0, -1.0}, {0.0, 0.0, 0.0}, {0.0, 1.0}},
  {{-1.0, -1.0, -1.0}, {0.0, 0.0, 1.0}, {0.0, 0.0}},
  {{-1.0, -1.0, +1.0}, {0.0, 0.0, 1.0}, {1.0, 0.0}},
};

const GLubyte kCubeIndexes[36] = {
   2,  1,  0,  3,  2,  0,
   6,  5,  4,  7,  6,  4,
  10,  9,  8, 11, 10,  8,
  14, 13, 12, 15, 14, 12,
  18, 17, 16, 19, 18, 16,
  22, 21, 20, 23, 22, 20,
};

}  // namespace


void do_segment_split(SplineDrawSegment *seg, SplineBezSegments *bz) {
  double s=-0.5, ds = 1.0/((double)BEZ_SEGMENTS-1);
  double lastco[3], lastdv[3], co[3], dv[3];
  double *out = (double*) bz->segments;
  
  bz->eid = seg->eid;
  bz->totseg = BEZ_SEGMENTS;
  
  for (int i=0; i<BEZ_SEGMENTS+1; i++, s += ds) {
    double st=s+0.5, s2=st*st, s3=s2*st;
    
    //double k1 = seg->ks[0], k2 = seg->ks[1], k3 = seg->ks[2], k4 = seg->ks[3];
    double k1 = seg->ks[0], dv1_k1 = seg->ks[1], dv1_k2 = seg->ks[2], k2 = seg->ks[3];
    double th = POLYTHETA_BEZ((s+0.5));
    
    eval_curve(co, s, seg->v1, seg->v2, seg->ks, ORDER, false, false);

    dv[0] = sin(th+seg->ks[KANGLE])*seg->ks[KSCALE];
    dv[1] = cos(th+seg->ks[KANGLE])*seg->ks[KSCALE];
    
    VECMULF(dv, 1.0/(3.0*BEZ_SEGMENTS));
    
    if (i > 0) {
      *out++ = lastco[0]; 
      *out++ = lastco[1];
      *out++ = lastco[0]+lastdv[0]; 
      *out++ = lastco[1]+lastdv[1];
      
      *out++ = co[0]; 
      *out++ = co[1];
      *out++ = co[0]-dv[0]; 
      *out++ = co[1]-dv[1];
    }
    
    VECCOPY(lastco, co);
    VECCOPY(lastdv, dv);
  }
}

enum MessageTypes {
  GEN_DRAW_BEZIERS = 0,
  REPLY = 1,
  SOLVE = 2
};

/* array buffer message format:
type           : int
transaction_id : int
...
*/

Graphics3DInstance::Graphics3DInstance(PP_Instance instance)
      : pp::Instance(instance),
        callback_factory_(this),
        width_(0),
        height_(0),
        frag_shader_(0),
        vertex_shader_(0),
        program_(0),
        texture_loc_(0),
        position_loc_(0),
        color_loc_(0),
        mvp_loc_(0),
        x_angle_(0),
        y_angle_(0),
        animating_(true) {}

bool Graphics3DInstance::Init(uint32_t argc, const char* argn[], const char* argv[]) {
  return true;
}

int Graphics3DInstance::errorf(const char *format, ...) {
  va_list ap;
  int ret;

  //do remember to refactor this if multiple threads are used in the future
  static char buf[4192];

  buf[0] = buf[sizeof(buf)-1] = 0; //sentinal null bytes

  buf[0] = 'E';
  buf[1] = 'R';
  buf[2] = ' ';
  buf[3] = 0;

  va_start(ap, format);
  ret = vsprintf(buf+3, format, ap);
  va_end(ap);

  buf[sizeof(buf)-1] = 0; //sanity check

  pp::Var msg(buf);
  PostMessage(msg);

  return ret;
}


int Graphics3DInstance::logf(const char *format, ...) {
  va_list ap;
  int ret;

  //do remember to refactor this if multiple threads are used in the future
  static char buf[4192];

  buf[0] = buf[sizeof(buf)-1] = 0; //sentinal null bytes

  buf[0] = 'O';
  buf[1] = 'K';
  buf[2] = ' ';
  buf[3] = 0;

  va_start(ap, format);
  ret = vsprintf(buf+3, format, ap);
  va_end(ap);

  buf[sizeof(buf)-1] = 0; //sanity check

  pp::Var msg(buf);
  PostMessage(msg);

  return ret;
}

void Graphics3DInstance::DidChangeView(const pp::View& view) {
  return; //XXX

  // Pepper specifies dimensions in DIPs (device-independent pixels). To
  // generate a context that is at device-pixel resolution on HiDPI devices,
  // scale the dimensions by view.GetDeviceScale().
  int32_t new_width = view.GetRect().width() * view.GetDeviceScale();
  int32_t new_height = view.GetRect().height() * view.GetDeviceScale();

  if (context_.is_null()) {
    if (!InitGL(new_width, new_height)) {
      // failed.
      return;
    }

    InitShaders();
    InitBuffers();
    InitTexture();
    MainLoop(0);
  } else {
    // Resize the buffers to the new size of the module.
    int32_t result = context_.ResizeBuffers(new_width, new_height);
    if (result < 0) {
      fprintf(stderr,
              "Unable to resize buffers to %d x %d!\n",
              new_width,
              new_height);
      return;
    }
  }

  width_ = new_width;
  height_ = new_height;
  glViewport(0, 0, width_, height_);
}


void Graphics3DInstance::HandleMessage(const pp::Var& message) {
  // An array message sets the current x and y rotation.
  if (!message.is_array_buffer()) {
    errorf("Expected array buffer message.\n");
    return;
  }

  double start_time = time_ms();
  
  pp::VarArrayBuffer vbuf(message);
  unsigned long len = 0;

  len = vbuf.ByteLength();
  char *buf = static_cast <char*>(vbuf.Map());

  if (len < 8) {
    errorf("Malformed message!");
    return;
  }

  int type = *(int*)buf, msgid = *((int*)(buf+4));
  //logf("Got message! type: %d, id: %d, len: %d, ptr: %p\n", type, msgid, (int) len, buf);

  switch (type) {
    case GEN_DRAW_BEZIERS:
    {
      SplineDrawSegment *seg = (SplineDrawSegment*)(buf+16);
      static char scratch[4192];
      
      int totseg = *((int*)(buf+8));

      if (totseg > (len-16)/sizeof(SplineDrawSegment)) {
        errorf("Bad segment length %d, maximum allowed would be %d, sizeof() is %d", totseg,
               (len-12)/sizeof(SplineDrawSegment), sizeof(SplineDrawSegment));
        return;
      }
      
      //logf("totseg: %d", totseg);
      
      int retlen = 16+sizeof(SplineBezSegments)*totseg;
      //logf("Draw recalc; retlen: %d, msgid : %d", retlen, msgid);
      
      //BEZ_SEGMENTS
      const char *ret = retlen < sizeof(scratch) ? scratch : (const char*) malloc(retlen);
      
      *(int*)ret = REPLY;
      *(int*)(ret+4) = msgid;
      *(int*)(ret+8) = totseg;
      *(int*)(ret+12) = 0; //pad to 8 byte boundary
      
      //logf("totseg: %d", totseg);
      
      SplineBezSegments *bz = (SplineBezSegments*)(ret+16);
      for (int i=0; i<totseg; i++, seg++, bz++) {
        do_segment_split(seg, bz);
      }
      
      pp::VarArrayBuffer retbuf(retlen);
      char *map = (char*) retbuf.Map();
      
      memcpy(map, ret, retlen);
      retbuf.Unmap();
      
      //logf("Sending result; msgid: %d", msgid);
      PostMessage(retbuf);
      
      if (retlen >= sizeof(scratch)) {
        free((void*)ret);
      }
    }
    break;
  case SOLVE:
    int retlen = 0;
    bool free_ret = false;
    
    //logf("Solving...");
    
    //stupid security restrictions
    double blah[3], ks[16];
    float bleh[3];
    bleh[0] = start_time; //ger, needed to avoid compiler errors
    
    eval_curve_dv(blah, 0.0, bleh, bleh, ks, ORDER, false, false);
    
    LOGPERF("time: %.2lfms", time_ms()-start_time);
    char *ret = do_solve(buf, &retlen, &free_ret);
    LOGPERF("  time2: %.2lfms", time_ms()-start_time);
    
    //logf("  ret: %p %d %d", ret, retlen, free_ret);
    
    if (ret) {
      pp::VarArrayBuffer retbuf(retlen);
      char *map = (char*) retbuf.Map();
      
      LOGPERF("  time3: %.2lfms", time_ms()-start_time);
      
      memcpy(map, ret, retlen);
      LOGPERF("  time4: %.2lfms", time_ms()-start_time);
      retbuf.Unmap();
      
      //logf("Sending result; msgid: %d", msgid);
      
      LOGPERF("  time5: %.2lfms", time_ms()-start_time);
      PostMessage(retbuf);
      
      LOGPERF("finaltime: %.2lfms", time_ms()-start_time);
      
      if (free_ret)
        free(ret);
    }
    break;
  }

  vbuf.Unmap();
}

bool Graphics3DInstance::InitGL(int32_t new_width, int32_t new_height) {
  return true; //XXX

  if (!glInitializePPAPI(pp::Module::Get()->get_browser_interface())) {
    fprintf(stderr, "Unable to initialize GL PPAPI!\n");
    return false;
  }

  const int32_t attrib_list[] = {
    PP_GRAPHICS3DATTRIB_ALPHA_SIZE, 8,
    PP_GRAPHICS3DATTRIB_DEPTH_SIZE, 24,
    PP_GRAPHICS3DATTRIB_WIDTH, new_width,
    PP_GRAPHICS3DATTRIB_HEIGHT, new_height,
    PP_GRAPHICS3DATTRIB_NONE
  };

  context_ = pp::Graphics3D(this, attrib_list);
  if (!BindGraphics(context_)) {
    fprintf(stderr, "Unable to bind 3d context!\n");
    context_ = pp::Graphics3D();
    glSetCurrentContextPPAPI(0);
    return false;
  }

  glSetCurrentContextPPAPI(context_.pp_resource());
  return true;
}

void Graphics3DInstance::InitShaders() {
  return; //XXX

  frag_shader_ = CompileShader(GL_FRAGMENT_SHADER, kFragShaderSource);
  if (!frag_shader_)
    return;

  vertex_shader_ = CompileShader(GL_VERTEX_SHADER, kVertexShaderSource);
  if (!vertex_shader_)
    return;

  program_ = LinkProgram(frag_shader_, vertex_shader_);
  if (!program_)
    return;

  texture_loc_ = glGetUniformLocation(program_, "u_texture");
  position_loc_ = glGetAttribLocation(program_, "a_position");
  texcoord_loc_ = glGetAttribLocation(program_, "a_texcoord");
  color_loc_ = glGetAttribLocation(program_, "a_color");
  mvp_loc_ = glGetUniformLocation(program_, "u_mvp");
}

void Graphics3DInstance::InitBuffers() {
  return; //XXX

  glGenBuffers(1, &vertex_buffer_);
  glBindBuffer(GL_ARRAY_BUFFER, vertex_buffer_);
  glBufferData(GL_ARRAY_BUFFER, sizeof(kCubeVerts), &kCubeVerts[0],
               GL_STATIC_DRAW);

  glGenBuffers(1, &index_buffer_);
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, index_buffer_);
  glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(kCubeIndexes),
               &kCubeIndexes[0], GL_STATIC_DRAW);
}

void Graphics3DInstance::InitTexture() {
  return; //XXX

  //DecompressTexture();
  glGenTextures(1, &texture_);
  glBindTexture(GL_TEXTURE_2D, texture_);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
  glTexImage2D(GL_TEXTURE_2D,
               0,
               GL_RGB,
               128,
               128,
               0,
               GL_RGB,
               GL_UNSIGNED_BYTE,
               &g_texture_data[0]);
}

void Graphics3DInstance::Animate() {
  return; //XXX

  if (animating_) {
    x_angle_ = fmod(360.0f + x_angle_ + kXAngleDelta, 360.0f);
    y_angle_ = fmod(360.0f + y_angle_ + kYAngleDelta, 360.0f);

    // Send new values to JavaScript.
    pp::VarArray array;
    array.SetLength(2);
    array.Set(0, x_angle_);
    array.Set(1, y_angle_);
    PostMessage(array);
  }
}

void Graphics3DInstance::Render() {
  return; //XXX

  glClearColor(0.5, 0.5, 0.5, 1);
  glClearDepthf(1.0f);
  glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  glEnable(GL_DEPTH_TEST);

  //set what program to use
  glUseProgram(program_);
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_2D, texture_);
  glUniform1i(texture_loc_, 0);

  //create our perspective matrix
  float mvp[16];
  float trs[16];
  float rot[16];

  identity_matrix(mvp);
  const float aspect_ratio = static_cast<float>(width_) / height_;
  glhPerspectivef2(&mvp[0], kFovY, aspect_ratio, kZNear, kZFar);

  translate_matrix(0, 0, kCameraZ, trs);
  rotate_matrix(x_angle_, y_angle_, 0.0f, rot);
  multiply_matrix(trs, rot, trs);
  multiply_matrix(mvp, trs, mvp);
  glUniformMatrix4fv(mvp_loc_, 1, GL_FALSE, mvp);

  //define the attributes of the vertex
  glBindBuffer(GL_ARRAY_BUFFER, vertex_buffer_);
  glVertexAttribPointer(position_loc_,
                        3,
                        GL_FLOAT,
                        GL_FALSE,
                        sizeof(Vertex),
                        reinterpret_cast<void*>(offsetof(Vertex, loc)));
  glEnableVertexAttribArray(position_loc_);
  glVertexAttribPointer(color_loc_,
                        3,
                        GL_FLOAT,
                        GL_FALSE,
                        sizeof(Vertex),
                        reinterpret_cast<void*>(offsetof(Vertex, color)));
  glEnableVertexAttribArray(color_loc_);
  glVertexAttribPointer(texcoord_loc_,
                        2,
                        GL_FLOAT,
                        GL_FALSE,
                        sizeof(Vertex),
                        reinterpret_cast<void*>(offsetof(Vertex, tex)));
  glEnableVertexAttribArray(texcoord_loc_);

  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, index_buffer_);
  glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_BYTE, 0);
}

void Graphics3DInstance::MainLoop(int32_t) {
  return; //XXX

  Animate();
  Render();
  context_.SwapBuffers(
      callback_factory_.NewCallback(&Graphics3DInstance::MainLoop));
}

class Graphics3DModule : public pp::Module {
 public:
  Graphics3DModule() : pp::Module() {}
  virtual ~Graphics3DModule() {}

  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new Graphics3DInstance(instance);
  }
};

namespace pp {
Module* CreateModule() { return new Graphics3DModule(); }
}  // namespace pp
