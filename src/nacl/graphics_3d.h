#include "ppapi/cpp/graphics_3d.h"
#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_array.h"
#include "ppapi/lib/gl/gles2/gl2ext_ppapi.h"
#include "ppapi/utility/completion_callback_factory.h"
#include "ppapi/cpp/var_array_buffer.h"

struct SplineVertex;
struct SplineSegment;
struct Constraint;

class Graphics3DInstance : public pp::Instance {
 public:
  explicit Graphics3DInstance(PP_Instance instance);

  virtual bool Init(uint32_t argc, const char* argn[], const char* argv[]);

  int errorf(const char *format, ...);
  int logf(const char *format, ...);
  virtual void DidChangeView(const pp::View& view);
  virtual void HandleMessage(const pp::Var& message);

private:
  char *do_solve(char *data, int *len_out, bool *free_ret);
  int solve_intern(struct SplineVertex *vs, int totvert,
                   struct SplineSegment *ss, int totseg,
                   struct Constraint *cs, int totcons);
  double eval_constraint(struct Constraint *con, struct SplineSegment *ss, 
                         struct SplineVertex *vs);

  bool InitGL(int32_t new_width, int32_t new_height);
  void InitShaders();
  void InitBuffers();
  void InitTexture();

  void Animate();
  void Render();
  void MainLoop(int32_t);

  pp::CompletionCallbackFactory<Graphics3DInstance> callback_factory_;
  pp::Graphics3D context_;
  int32_t width_;
  int32_t height_;
  GLuint frag_shader_;
  GLuint vertex_shader_;
  GLuint program_;
  GLuint vertex_buffer_;
  GLuint index_buffer_;
  GLuint texture_;

  GLuint texture_loc_;
  GLuint position_loc_;
  GLuint texcoord_loc_;
  GLuint color_loc_;
  GLuint mvp_loc_;

  float x_angle_;
  float y_angle_;
  bool animating_;
};
