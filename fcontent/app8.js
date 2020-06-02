es6_module_define('manipulator', ["../../util/mathlib.js", "../../config/config.js"], function _manipulator_module(_es6_module) {
  "use strict";
  var dist_to_line_v2=es6_import_item(_es6_module, '../../util/mathlib.js', 'dist_to_line_v2');
  var config=es6_import(_es6_module, '../../config/config.js');
  var ManipFlags={}
  ManipFlags = _es6_module.add_export('ManipFlags', ManipFlags);
  var HandleShapes={ARROW: 0, 
   HAMMER: 1, 
   ROTCIRCLE: 2, 
   SIMPLE_CIRCLE: 3, 
   OUTLINE: 4}
  HandleShapes = _es6_module.add_export('HandleShapes', HandleShapes);
  var HandleColors={DEFAULT: [0, 0, 0, 1], 
   HIGHLIGHT: [0.4, 0.4, 0.4, 1], 
   SELECT: [1.0, 0.7, 0.3, 1]}
  HandleColors = _es6_module.add_export('HandleColors', HandleColors);
  var _mh_idgen=1;
  class HandleBase  {
     on_click(e, view2d, id) {

    }
     on_active() {
      this.color = HandleColors.HIGHLIGHT;
      this.update();
    }
     on_inactive() {
      this.color = HandleColors.DEFAULT;
      this.update();
    }
     distanceTo(p) {
      throw new Error("unimplemented distanceTo");
    }
     update() {
      throw new Error("unimplemented update");
    }
     [Symbol.keystr]() {
      throw new Error("unimplemented keystr");
    }
     get_render_rects(ctx, canvas, g) {
      throw new Error("unimplemented get_render_rects");
    }
     render(canvas, g) {
      throw new Error("unimplemented render");
    }
  }
  _ESClass.register(HandleBase);
  _es6_module.add_class(HandleBase);
  HandleBase = _es6_module.add_export('HandleBase', HandleBase);
  HandleBase;
  var $min_AO70_update;
  var $max_v2mO_update;
  class ManipHandle extends HandleBase {
    
    
    
    
     constructor(v1, v2, id, shape, view2d, clr) {
      super();
      this.id = id;
      this._hid = _mh_idgen++;
      this.shape = shape;
      this.v1 = v1;
      this.v2 = v2;
      this.transparent = false;
      this.color = clr===undefined ? [0, 0, 0, 1] : clr.slice(0, clr.length);
      this.parent = undefined;
      this.linewidth = 1.5;
      if (this.color.length==3)
        this.color.push(1.0);
      this._min = new Vector2(v1);
      this._max = new Vector2(v2);
      this._redraw_pad = this.linewidth;
    }
     on_click(e, view2d, id) {

    }
     on_active() {
      this.color = HandleColors.HIGHLIGHT;
      this.update();
    }
     on_inactive() {
      this.color = HandleColors.DEFAULT;
      this.update();
    }
     distanceTo(p) {
      return dist_to_line_v2(p, this.v1, this.v2);
    }
     update_aabb() {
      this._min[0] = this.v1[0]+this.parent.co[0];
      this._min[1] = this.v1[1]+this.parent.co[1];
      this._max[0] = this.v2[0]+this.parent.co[0];
      this._max[1] = this.v2[1]+this.parent.co[1];
      var minx=Math.min(this._min[0], this._max[0]);
      var miny=Math.min(this._min[1], this._max[1]);
      var maxx=Math.max(this._min[0], this._max[0]);
      var maxy=Math.max(this._min[1], this._max[1]);
      this._min[0] = minx;
      this._min[1] = miny;
      this._max[0] = maxx;
      this._max[1] = maxy;
    }
     update() {
      var p=this._redraw_pad;
      $min_AO70_update[0] = this._min[0]-p;
      $min_AO70_update[1] = this._min[1]-p;
      $max_v2mO_update[0] = this._max[0]+p;
      $max_v2mO_update[1] = this._max[1]+p;
      window.redraw_viewport($min_AO70_update, $max_v2mO_update);
      this.update_aabb();
      $min_AO70_update[0] = this._min[0]-p;
      $min_AO70_update[1] = this._min[1]-p;
      $max_v2mO_update[0] = this._max[0]+p;
      $max_v2mO_update[1] = this._max[1]+p;
      window.redraw_viewport($min_AO70_update, $max_v2mO_update);
    }
     [Symbol.keystr]() {
      return "MH"+this._hid.toString;
    }
     get_render_rects(ctx, canvas, g) {
      let p=this._redraw_pad;
      this.update_aabb();
      let xmin=this._min[0], ymin=this._min[1], xmax=this._max[0], ymax=this._max[1];
      return [[xmin-p, ymin-p, xmax-xmin+2*p, ymax-ymin+2*p]];
    }
     render(canvas, g) {
      let c=this.color;
      let style="rgba("+(~~(c[0]*255))+","+(~~(c[1]*255))+","+(~~(c[2]*255))+","+c[3]+")";
      g.strokeStyle = g.fillStyle = style;
      g.lineWidth = this.linewidth;
      if (this.shape==HandleShapes.ARROW) {
          g.beginPath();
          let dx=this.v2[0]-this.v1[0], dy=this.v2[1]-this.v1[1];
          let dx2=this.v1[1]-this.v2[1], dy2=this.v2[0]-this.v1[0];
          let l=Math.sqrt(dx2*dx2+dy2*dy2);
          if (l==0.0) {
              g.beginPath();
              g.rect(this.v1[0]-5, this.v1[1]-5, 10, 10);
              g.fill();
              return ;
          }
          dx2*=1.5/l;
          dy2*=1.5/l;
          dx*=0.65;
          dy*=0.65;
          let w=3;
          let v1=this.v1, v2=this.v2;
          g.moveTo(v1[0]-dx2, v1[1]-dy2);
          g.lineTo(v1[0]+dx-dx2, v1[1]+dy-dy2);
          g.lineTo(v1[0]+dx-dx2*w, v1[1]+dy-dy2*w);
          g.lineTo(v2[0], v2[1]);
          g.lineTo(v1[0]+dx+dx2*w, v1[1]+dy+dy2*w);
          g.lineTo(v1[0]+dx+dx2, v1[1]+dy+dy2);
          g.lineTo(v1[0]+dx2, v1[1]+dy2);
          g.closePath();
          g.fill();
      }
      else 
        if (this.shape==HandleShapes.OUTLINE) {
          g.beginPath();
          g.moveTo(this.v1[0], this.v1[1]);
          g.lineTo(this.v1[0], this.v2[1]);
          g.lineTo(this.v2[0], this.v2[1]);
          g.lineTo(this.v2[0], this.v1[1]);
          g.closePath();
          g.stroke();
      }
      else {
        g.beginPath();
        g.moveTo(this.v1[0], this.v1[1]);
        g.lineTo(this.v2[0], this.v2[1]);
        g.stroke();
      }
    }
  }
  var $min_AO70_update=new Vector2();
  var $max_v2mO_update=new Vector2();
  _ESClass.register(ManipHandle);
  _es6_module.add_class(ManipHandle);
  ManipHandle = _es6_module.add_export('ManipHandle', ManipHandle);
  var $min_nbFP_update;
  var $max_h5wD_update;
  class ManipCircle extends HandleBase {
    
    
    
    
    
     constructor(p, r, id, view2d, clr) {
      super();
      this.id = id;
      this._hid = _mh_idgen++;
      this.p = new Vector2(p);
      this.r = r;
      this.transparent = false;
      this.color = clr===undefined ? [0, 0, 0, 1] : clr.slice(0, clr.length);
      this.parent = undefined;
      this.linewidth = 1.5;
      if (this.color.length==3)
        this.color.push(1.0);
      this._min = new Vector2();
      this._max = new Vector2();
      this._redraw_pad = this.linewidth;
    }
     on_click(e, view2d, id) {

    }
     on_active() {
      this.color = HandleColors.HIGHLIGHT;
      this.update();
    }
     on_inactive() {
      this.color = HandleColors.DEFAULT;
      this.update();
    }
     distanceTo(p) {
      let dx=this.p[0]-p[0];
      let dy=this.p[1]-p[1];
      let dis=dx*dx+dy*dy;
      dis = dis!=0.0 ? Math.sqrt(dis) : 0.0;
      return Math.abs(dis-this.r);
    }
     update_aabb() {
      this._min[0] = this.parent.co[0]+this.p[0]-Math.sqrt(2)*this.r;
      this._min[1] = this.parent.co[1]+this.p[1]-Math.sqrt(2)*this.r;
      this._max[0] = this.parent.co[0]+this.p[0]+Math.sqrt(2)*this.r;
      this._max[1] = this.parent.co[1]+this.p[1]+Math.sqrt(2)*this.r;
    }
     update() {
      var p=this._redraw_pad;
      $min_nbFP_update[0] = this._min[0]-p;
      $min_nbFP_update[1] = this._min[1]-p;
      $max_h5wD_update[0] = this._max[0]+p;
      $max_h5wD_update[1] = this._max[1]+p;
      window.redraw_viewport($min_nbFP_update, $max_h5wD_update);
      this.update_aabb();
      $min_nbFP_update[0] = this._min[0]-p;
      $min_nbFP_update[1] = this._min[1]-p;
      $max_h5wD_update[0] = this._max[0]+p;
      $max_h5wD_update[1] = this._max[1]+p;
      window.redraw_viewport($min_nbFP_update, $max_h5wD_update);
    }
     [Symbol.keystr]() {
      return "MC"+this._hid.toString;
    }
     get_render_rects(ctx, canvas, g) {
      let p=this._redraw_pad;
      this.update_aabb();
      let xmin=this._min[0], ymin=this._min[1], xmax=this._max[0], ymax=this._max[1];
      return [[xmin-p, ymin-p, xmax-xmin+2*p, ymax-ymin+2*p]];
    }
     render(canvas, g) {
      let c=this.color;
      let style="rgba("+(~~(c[0]*255))+","+(~~(c[1]*255))+","+(~~(c[2]*255))+","+c[3]+")";
      g.strokeStyle = g.fillStyle = style;
      g.lineWidth = this.linewidth;
      g.beginPath();
      g.arc(this.p[0], this.p[1], this.r, -Math.PI, Math.PI);
      g.closePath();
      g.stroke();
    }
  }
  var $min_nbFP_update=new Vector2();
  var $max_h5wD_update=new Vector2();
  _ESClass.register(ManipCircle);
  _es6_module.add_class(ManipCircle);
  ManipCircle = _es6_module.add_export('ManipCircle', ManipCircle);
  var _mh_idgen_2=1;
  var _mp_first=true;
  class Manipulator  {
    
    
    
    
     constructor(handles) {
      this._hid = _mh_idgen_2++;
      this.handles = handles.slice(0, handles.length);
      this.recalc = 1;
      this.parent = undefined;
      this.user_data = undefined;
      for (var h of this.handles) {
          h.parent = this;
      }
      this.handle_size = 65;
      this.co = new Vector3();
      this.hidden = false;
    }
     hide() {
      if (!this.hidden) {
          this.update();
      }
      this.hidden = true;
    }
     unhide() {
      if (this.hidden) {
          this.hidden = false;
          this.update();
      }
      else {
        this.hidden = false;
      }
    }
     update() {
      if (this.hidden)
        return ;
      for (var h of this.handles) {
          h.update();
      }
    }
     on_tick(ctx) {

    }
     [Symbol.keystr]() {
      return "MP"+this._hid.toString;
    }
     end() {
      this.parent.remove(this);
    }
     get_render_rects(ctx, canvas, g) {
      var rects=[];
      if (this.hidden) {
          return rects;
      }
      for (var h of this.handles) {
          var rs=h.get_render_rects(ctx, canvas, g);
          for (var i=0; i<rs.length; i++) {
              rs[i] = rs[i].slice(0, rs[i].length);
              rs[i][0]+=this.co[0];
              rs[i][1]+=this.co[1];
          }
          rects = rects.concat(rs);
      }
      return rects;
    }
     render(canvas, g) {
      if (this.hidden) {
          return ;
      }
      for (var h of this.handles) {
          var x=this.co[0], y=this.co[1];
          g._render_mat.translate(x, y);
          h.render(canvas, g);
          g._render_mat.translate(-x, -y);
      }
    }
     outline(min, max, id, clr=[0, 0, 0, 1.0]) {
      min = new Vector2(min);
      max = new Vector2(max);
      var h=new ManipHandle(min, max, id, HandleShapes.OUTLINE, this.view3d, clr);
      h.transparent = true;
      h.parent = this;
      this.handles.push(h);
      return h;
    }
     arrow(v1, v2, id, clr=[0, 0, 0, 1.0]) {
      v1 = new Vector2(v1);
      v2 = new Vector2(v2);
      var h=new ManipHandle(v1, v2, id, HandleShapes.ARROW, this.view3d, clr);
      h.parent = this;
      this.handles.push(h);
      return h;
    }
     circle(p, r, id, clr=[0, 0, 0, 1.0]) {
      let h=new ManipCircle(new Vector2(p), r, id, this.view3d, clr);
      h.parent = this;
      this.handles.push(h);
      return h;
    }
     findnearest(e) {
      let limit=config.MANIPULATOR_MOUSEOVER_LIMIT;
      let h=this.handles[0];
      let mpos=[e.x-this.co[0], e.y-this.co[1]];
      let mindis=undefined, minh=undefined;
      for (let h of this.handles) {
          if (h.transparent)
            continue;
          let dis=h.distanceTo(mpos);
          if (dis<limit&&(mindis===undefined||dis<mindis)) {
              mindis = dis;
              minh = h;
          }
      }
      return minh;
    }
     on_mousemove(e, view2d) {
      let h=this.findnearest(e);
      if (h!==this.active) {
          if (this.active!==undefined) {
              this.active.on_inactive();
          }
          this.active = h;
          if (h!==undefined) {
              h.on_active();
          }
      }
      return false;
    }
     on_click(event, view2d) {
      return this.active!=undefined ? this.active.on_click(event, view2d, this.active.id) : undefined;
    }
  }
  _ESClass.register(Manipulator);
  _es6_module.add_class(Manipulator);
  Manipulator = _es6_module.add_export('Manipulator', Manipulator);
  var $nil_Bwp8_get_render_rects;
  class ManipulatorManager  {
     constructor(view2d) {
      this.view2d = view2d;
      this.stack = [];
      this.active = undefined;
    }
     render(canvas, g) {
      if (this.active!=undefined) {
          this.active.render(canvas, g);
      }
    }
     get_render_rects(ctx, canvas, g) {
      if (this.active!=undefined) {
          return this.active.get_render_rects(ctx, canvas, g);
      }
      else {
        return $nil_Bwp8_get_render_rects;
      }
    }
     remove(mn) {
      if (mn==this.active) {
          this.pop();
      }
      else {
        this.stack.remove(mn);
      }
    }
     push(mn) {
      mn.parent = this;
      this.stack.push(this.active);
      this.active = mn;
    }
     ensure_not_toolop(ctx, cls) {
      if (this.active!=undefined&&this.active.toolop_class===cls) {
          this.remove(this.active);
      }
    }
     ensure_toolop(ctx, cls) {
      if (this.active!=undefined&&this.active.toolop_class===cls) {
          return this.active;
      }
      if (this.active!=undefined) {
          this.remove(this.active);
      }
      this.active = cls.create_widgets(this, ctx);
      if (this.active!==undefined) {
          this.active.toolop_class = cls;
      }
    }
     pop() {
      var ret=this.active;
      this.active = this.stack.pop(-1);
    }
     on_mousemove(event, view2d) {
      return this.active!=undefined ? this.active.on_mousemove(event, view2d) : undefined;
    }
     on_click(event, view2d) {
      return this.active!=undefined ? this.active.on_click(event, view2d) : undefined;
    }
     active_toolop() {
      if (this.active==undefined)
        return undefined;
      return this.active.toolop_class;
    }
     create(cls, do_push=true) {
      var mn=new Manipulator([]);
      mn.parent = this;
      mn.toolop_class = cls;
      if (do_push)
        this.push(mn);
      return mn;
    }
     on_tick(ctx) {
      if (this.active!=undefined&&this.active.on_tick!=undefined)
        this.active.on_tick(ctx);
    }
     circle(p, r, clr, do_push=true) {
      let h=new ManipCircle(p, r, id, this.view3d, clr);
      let mn=new Manipulator([h]);
      mn.parent = this;
      if (do_push) {
          this.push(mn);
      }
      return mn;
    }
     arrow(v1, v2, id, clr, do_push=true) {
      v1 = new Vector2(v1);
      v2 = new Vector2(v2);
      var h=new ManipHandle(v1, v2, id, HandleShapes.ARROW, this.view3d, clr);
      var mn=new Manipulator([h]);
      mn.parent = this;
      if (do_push)
        this.push(mn);
      return mn;
    }
  }
  var $nil_Bwp8_get_render_rects=[];
  _ESClass.register(ManipulatorManager);
  _es6_module.add_class(ManipulatorManager);
  ManipulatorManager = _es6_module.add_export('ManipulatorManager', ManipulatorManager);
}, '/dev/fairmotion/src/editors/viewport/manipulator.js');
es6_module_define('view2d', ["../../path.ux/scripts/core/ui_base.js", "./view2d_spline_ops.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../core/struct.js", "../events.js", "../../path.ux/scripts/widgets/ui_menu.js", "../../path.ux/scripts/core/ui.js", "./manipulator.js", "../../core/imageblock.js", "../../curve/spline_draw.js", "./toolmodes/all.js", "./selectmode.js", "../../core/toolops_api.js", "./view2d_editor.js", "../editor_base.js"], function _view2d_module(_es6_module) {
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var patchMouseEvent=es6_import_item(_es6_module, '../../core/toolops_api.js', 'patchMouseEvent');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var createMenu=es6_import_item(_es6_module, '../../path.ux/scripts/widgets/ui_menu.js', 'createMenu');
  var startMenu=es6_import_item(_es6_module, '../../path.ux/scripts/widgets/ui_menu.js', 'startMenu');
  var ImageUser=es6_import_item(_es6_module, '../../core/imageblock.js', 'ImageUser');
  var SplineEditor=es6_import_item(_es6_module, './view2d_spline_ops.js', 'SplineEditor');
  var Container=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui.js', 'Container');
  var PackFlags=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'PackFlags');
  var patch_canvas2d=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'patch_canvas2d');
  var set_rendermat=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'set_rendermat');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, './selectmode.js', 'ToolModes');
  var ManipulatorManager=es6_import_item(_es6_module, './manipulator.js', 'ManipulatorManager');
  var Manipulator=es6_import_item(_es6_module, './manipulator.js', 'Manipulator');
  var HandleShapes=es6_import_item(_es6_module, './manipulator.js', 'HandleShapes');
  var ManipFlags=es6_import_item(_es6_module, './manipulator.js', 'ManipFlags');
  var ManipHandle=es6_import_item(_es6_module, './manipulator.js', 'ManipHandle');
  var EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  let _ex_EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  _es6_module.add_export('EditModes', _ex_EditModes, true);
  es6_import(_es6_module, './toolmodes/all.js');
  let projrets=cachering.fromConstructor(Vector3, 128);
  let _v3d_unstatic_temps=cachering.fromConstructor(Vector3, 512);
  let _v2d_unstatic_temps=cachering.fromConstructor(Vector2, 32);
  function delay_redraw(ms) {
    var start_time=time_ms();
    var timer=window.setInterval(function () {
      if (time_ms()-start_time<ms)
        return ;
      window.clearInterval(timer);
      window.redraw_viewport();
    }, 20);
  }
  class PanOp extends ToolOp {
    
    
    
    
    
     constructor(start_mpos) {
      super();
      this.is_modal = true;
      this.undoflag|=UndoFlags.IGNORE_UNDO;
      if (start_mpos!==undefined) {
          this.start_mpos = new Vector3(start_mpos);
          this.start_mpos[2] = 0.0;
          this.first = false;
      }
      else {
        this.start_mpos = new Vector3();
        this.first = true;
      }
      this.start_cameramat = undefined;
      this.cameramat = new Matrix4();
    }
    static  tooldef() {
      return {uiname: "Pan", 
     apiname: "view2d.pan", 
     undoflag: UndoFlags.IGNORE_UNDO, 
     inputs: {}, 
     outputs: {}, 
     is_modal: true}
    }
     start_modal(ctx) {
      this.start_cameramat = new Matrix4(ctx.view2d.cameramat);
    }
     on_mousemove(event) {
      var mpos=new Vector3([event.x, event.y, 0]);
      if (this.first) {
          this.first = false;
          this.start_mpos.load(mpos);
          return ;
      }
      var ctx=this.modal_ctx;
      mpos.sub(this.start_mpos).mulScalar(1.0/ctx.view2d.zoom);
      this.cameramat.load(this.start_cameramat).translate(mpos[0], -mpos[1], 0.0);
      ctx.view2d.set_cameramat(this.cameramat);
      window.force_viewport_redraw();
      window.redraw_viewport();
    }
     on_mouseup(event) {
      this.end_modal();
    }
  }
  _ESClass.register(PanOp);
  _es6_module.add_class(PanOp);
  class drawline  {
    
    
    
     constructor(co1, co2, group, color, width) {
      this.v1 = new Vector3(co1);
      this.v2 = new Vector3(co2);
      this.group = group;
      this.width = width;
      if (color!==undefined) {
          this.clr = [color[0], color[1], color[2], color[3]!==undefined ? color[3] : 1.0];
      }
      else {
        this.clr = [0.4, 0.4, 0.4, 1.0];
      }
    }
     set_clr(clr) {
      this.clr = clr;
    }
  }
  _ESClass.register(drawline);
  _es6_module.add_class(drawline);
  class View2DHandler extends Editor {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.dpi_scale = 1.0;
      this.enable_blur = true;
      this.draw_small_verts = false;
      this.toolmode = ToolModes.SELECT;
      this._last_dpi = undefined;
      this.widgets = new ManipulatorManager(this);
      this.draw_faces = true;
      this.need_data_link = false;
      this._can_select = 1;
      this._only_render = 0;
      this._selectmode = 1;
      this._draw_normals = 0;
      this.rendermat = new Matrix4();
      this.irendermat = new Matrix4();
      this.cameramat = new Matrix4();
      this.editors = [];
      this.background_image = new ImageUser();
      this.pinned_paths = [];
      this.zoom = 1.0;
      this.background_color = new Vector3([1, 1, 1]);
      this.default_stroke = new Vector4([0, 0, 0, 1]);
      this.default_fill = new Vector4([0, 0, 0, 1]);
      this.default_linewidth = 2;
      this.drawlines = new GArray();
      this.drawline_groups = {};
      this.doOnce(this.regen_keymap);
    }
    get  do_blur() {
      console.warn("evil do_blur");
      return this.enable_blur;
    }
     regen_keymap() {
      if (!this.ctx||!this.ctx.toolmode) {
          return ;
      }
      this.keymap = new KeyMap();
      this.define_keymap();
      for (let map of this.ctx.toolmode.getKeyMaps()) {
          this.keymap.concat(map);
      }
    }
     getKeyMaps() {
      let ret=super.getKeyMaps()||[];
      if (this.ctx.toolmode) {
          ret = ret.concat(this.ctx.toolmode.getKeyMaps());
      }
      return ret;
    }
     tools_menu(ctx, mpos) {
      let tool=ctx.toolmode;
      if (tool) {
          tool.tools_menu(ctx, mpos, this);
      }
    }
     toolop_menu(ctx, name, ops) {
      return createMenu(ctx, name, ops);
    }
     call_menu(menu, view2d, mpos) {
      let screen=this.ctx.screen;
      startMenu(menu, screen.mpos[0], screen.mpos[1]);
    }
     define_keymap() {
      var k=this.keymap;
      var this2=this;
      k.add(new HotKey("T", [], "Cycle Select Mode"), new FuncKeyHandler(function (ctx) {
        var s=ctx.view2d.selectmode, s2;
        let hf=s&SelMask.HANDLE;
        s2&=~SelMask.HANDLE;
        if (s==SelMask.VERTEX)
          s2 = SelMask.SEGMENT;
        else 
          if (s==SelMask.SEGMENT)
          s2 = SelMask.FACE;
        else 
          if (s==SelMask.FACE)
          s2 = SelMask.OBJECT;
        else 
          s2 = SelMask.VERTEX;
        s2|=hf;
        console.log("toggle select mode", s, s2, SelMask.SEGMENT, SelMask.FACE);
        console.log(s==SelMask.VERTEX, s==(SelMask.VERTEX|SelMask.HANDLE), (s==SelMask.SEGMENT));
        ctx.view2d.set_selectmode(s2);
      }));
      k.add(new HotKey("Z", ["CTRL", "SHIFT"], "Redo"), new FuncKeyHandler(function (ctx) {
        console.log("Redo");
        ctx.toolstack.redo();
      }));
      k.add(new HotKey("Y", ["CTRL"], "Redo"), new FuncKeyHandler(function (ctx) {
        console.log("Redo");
        ctx.toolstack.redo();
      }));
      k.add(new HotKey("Z", ["CTRL"], "Undo"), new FuncKeyHandler(function (ctx) {
        console.log("Undo");
        ctx.toolstack.undo();
      }));
      k.add(new HotKey("O", [], "Toggle Proportional Transform"), new FuncKeyHandler(function (ctx) {
        console.log("toggling proportional transform");
        ctx.view2d.session_flag^=SessionFlags.PROP_TRANSFORM;
      }));
      k.add(new HotKey("K", [], ""), new FuncKeyHandler(function (ctx) {
        g_app_state.toolstack.exec_tool(new CurveRootFinderTest());
      }));
      k.add(new HotKey("Right", [], ""), new FuncKeyHandler(function (ctx) {
        console.log("Frame Change!", ctx.scene.time+1);
        ctx.scene.change_time(ctx, ctx.scene.time+1);
        window.redraw_viewport();
      }));
      k.add(new HotKey("Left", [], ""), new FuncKeyHandler(function (ctx) {
        console.log("Frame Change!", ctx.scene.time-1);
        ctx.scene.change_time(ctx, ctx.scene.time-1);
        window.redraw_viewport();
      }));
      k.add(new HotKey("Up", [], "Frame Ahead 10"), new FuncKeyHandler(function (ctx) {
        window.debug_int_1++;
        ctx.scene.change_time(ctx, ctx.scene.time+10);
        window.force_viewport_redraw();
        window.redraw_viewport();
        console.log("debug_int_1: ", debug_int_1);
      }));
      k.add(new HotKey("Down", [], "Frame Back 10"), new FuncKeyHandler(function (ctx) {
        
        debug_int_1--;
        debug_int_1 = Math.max(0, debug_int_1);
        ctx.scene.change_time(ctx, ctx.scene.time-10);
        window.force_viewport_redraw();
        window.redraw_viewport();
        console.log("debug_int_1: ", debug_int_1);
      }));
    }
     init() {
      super.init();
      this.makeToolbars();
      this.setCSS();
      this.on_mousedown = Editor.wrapContextEvent(this.on_mousedown.bind(this));
      this.on_mousemove = Editor.wrapContextEvent(this.on_mousemove.bind(this));
      this.on_mouseup = Editor.wrapContextEvent(this.on_mouseup.bind(this));
      this.addEventListener("mousedown", this.on_mousedown.bind(this));
      this.addEventListener("mousemove", this.on_mousemove.bind(this));
      this.addEventListener("mouseup", this.on_mouseup.bind(this));
      this._i = 0;
      this.regen_keymap();
    }
     _mouse(e) {
      let e2=patchMouseEvent(e, this);
      let mpos=this.getLocalMouse(e.x, e.y);
      e2.x = e2.clientX = mpos[0];
      e2.y = e2.clientY = mpos[1];
      return e2;
    }
     data_link(block, getblock, getblock_us) {
      this.ctx = new Context();
      this.need_data_link = false;
      this.background_image.data_link(block, getblock, getblock_us);
    }
     set_cameramat(mat=undefined) {
      var cam=this.cameramat, render=this.rendermat, zoom=new Matrix4();
      if (mat!=undefined)
        cam.load(mat);
      zoom.translate(this.size[0]/2, this.size[1]/2, 0);
      zoom.scale(this.zoom, this.zoom, this.zoom);
      zoom.translate(-this.size[0]/2, -this.size[1]/2, 0);
      render.makeIdentity();
      render.multiply(zoom);
      render.multiply(cam);
      this.irendermat.load(this.rendermat).invert();
    }
     _getCanvasOff() {
      let off=_v3d_unstatic_temps.next().zero();
      let r1=this.get_bg_canvas().getClientRects()[0];
      let r2=this.getClientRects()[0];
      off[0] = r1.x-r2.x;
      off[1] = r1.y-r2.y;
      return off;
    }
     project(co) {
      let _co=_v3d_unstatic_temps.next().zero();
      _co.load(co);
      _co[2] = 0.0;
      _co.multVecMatrix(this.rendermat);
      co[0] = _co[0], co[1] = _co[1];
      return co;
    }
     unproject(co) {
      let _co=_v3d_unstatic_temps.next().zero();
      _co.load(co);
      _co[2] = 0.0;
      _co.multVecMatrix(this.irendermat);
      co[0] = _co[0], co[1] = _co[1];
      return co;
    }
     getLocalMouse(x, y) {
      let ret=projrets.next();
      let canvas=this.get_bg_canvas();
      let rect=canvas.getClientRects()[0];
      let dpi=UIBase.getDPI();
      if (rect===undefined) {
          console.warn("error in getLocalMouse");
          ret[0] = x*dpi;
          ret[1] = y*dpi;
          return ret;
      }
      ret[0] = (x-rect.left)*dpi;
      ret[1] = (rect.height-(y-rect.top))*dpi;
      ret[2] = 0.0;
      return ret;
    }
     on_resize(newsize, oldsize) {
      super.on_resize(newsize, oldsize);
      if (this.size!==undefined) {
          this.set_cameramat();
          if (!this.need_data_link) {
              this.do_draw_viewport([]);
          }
      }
      if (!this.need_data_link) {
          this.get_fg_canvas();
          this.get_bg_canvas();
          this.do_draw_viewport([]);
      }
    }
     do_draw_viewport(redraw_rects) {
      var canvas=this.get_fg_canvas();
      var bgcanvas=this.get_bg_canvas();
      var g=this.drawg = canvas.g;
      var bg_g=bgcanvas.g;
      if (bgcanvas!==undefined&&bgcanvas.style!==undefined) {
          bgcanvas.style["backgroundColor"] = this.background_color.toCSS();
      }
      var w=this.size[0];
      var h=this.size[1];
      g._irender_mat = this.irendermat;
      bg_g._irender_mat = this.irendermat;
      bg_g.width = bgcanvas.width;
      g.width = canvas.width;
      bg_g.height = bgcanvas.height;
      g.height = canvas.height;
      set_rendermat(g, this.rendermat);
      set_rendermat(bg_g, this.rendermat);
      g.save();
      bg_g.save();
      let pan=new Vector3();
      let dpi_scale=this.dpi_scale;
      let mat=new DOMMatrix();
      let mat2=g.getTransform();
      g.dpi_scale = this.dpi_scale;
      var p1=new Vector2([0, 0]);
      var p2=new Vector2([this.size[0], this.size[1]]);
      this.unproject(p1), this.unproject(p2);
      var r=redraw_rects;
      g.beginPath();
      for (var i=0; i<r.length; i+=4) {
          g.moveTo(r[i], r[i+1]);
          g.lineTo(r[i], r[i+3]);
          g.lineTo(r[i+2], r[i+3]);
          g.lineTo(r[i+2], r[i+1]);
          g.closePath();
      }
      g.beginPath();
      bg_g.beginPath();
      g._clearRect(0, 0, g.canvas.width, g.canvas.height);
      bg_g._clearRect(0, 0, bg_g.canvas.width, bg_g.canvas.height);
      this.ctx = new Context();
      if (this.ctx.frameset===undefined) {
          g.restore();
          bg_g.restore();
          return ;
      }
      let matrix=new Matrix4();
      let m2=new Matrix4();
      m2.scale(dpi_scale, dpi_scale, 1.0);
      matrix.multiply(m2);
      matrix.multiply(this.rendermat);
      set_rendermat(g, matrix);
      set_rendermat(bg_g, matrix);
      if (this.draw_video&&this.video!==undefined) {
          var frame=Math.floor(this.video_time);
          var image=this.video.get(frame);
          if (image!=undefined) {
              bg_g.drawImage(image, 0, 0);
          }
      }
      if (this.draw_bg_image&&this.background_image.image!==undefined) {
          var img=this.background_image.image.get_dom_image();
          var iuser=this.background_image;
          bg_g.drawImage(img, iuser.off[0], iuser.off[1], img.width*iuser.scale[0], img.height*iuser.scale[1]);
      }
      matrix = new Matrix4(matrix);
      let matrix2=new Matrix4();
      matrix2.translate(0.0, g.canvas.height, 0.0);
      let mm=new Matrix4();
      mm.scale(1.0, -1.0, 1.0);
      matrix2.multiply(mm);
      matrix.preMultiply(matrix2);
      this.ctx.frameset.draw(this.ctx, g, this, matrix, redraw_rects, this.edit_all_layers);
      var frameset=this.ctx.frameset;
      var spline=frameset.spline;
      var actspline=this.ctx.spline;
      var pathspline=this.ctx.frameset.pathspline;
      if (this.draw_anim_paths) {
          if (this.only_render&&pathspline.resolve) {
              pathspline.solve();
          }
          else 
            if (!this.only_render) {
              for (var v of spline.verts.selected) {
                  if (!(v.eid in frameset.vertex_animdata))
                    continue;
                  var vdata=frameset.vertex_animdata[v.eid];
                  var alpha=vdata.spline===actspline ? 1.0 : 0.2;
                  vdata.draw(g, alpha, this.ctx.frameset.time, redraw_rects);
              }
              pathspline.layerset.active = pathspline.layerset.idmap[this.ctx.frameset.templayerid];
              pathspline.draw(redraw_rects, g, this, matrix, this.selectmode, this.only_render, this.draw_normals, alpha, true, this.ctx.frameset.time, false);
          }
      }
      else {
        if (pathspline.resolve) {
            pathspline.solve();
            console.log("solved pathspline", pathspline.resolve);
            pathspline.resolve = 0;
        }
      }
      this.editor.ctx = this.ctx;
      var fl=Math.floor;
      for (var k in this.drawline_groups) {
          for (var dl of this.drawline_groups[k]) {
              var a=dl.clr[3]!=undefined ? dl.clr[3] : 1.0;
              g.strokeStyle = "rgba("+fl(dl.clr[0]*255)+","+fl(dl.clr[1]*255)+","+fl(dl.clr[2]*255)+","+a+")";
              g.lineWidth = dl.width;
              g.beginPath();
              g.moveTo(dl.v1[0], dl.v1[1]);
              g.lineTo(dl.v2[0], dl.v2[1]);
              g.stroke();
          }
      }
      this.widgets.render(canvas, g);
      bg_g.restore();
      g.restore();
    }
     get_fg_canvas() {
      this.drawcanvas = this.getCanvas("fg", -2, undefined, this.dpi_scale);
      return this.drawcanvas;
    }
     get_bg_canvas() {
      return this.getCanvas("bg", -3, undefined, this.dpi_scale);
    }
     copy() {
      let ret=document.createElement("view2d-editor-x");
      return ret;
    }
     makeToolbars() {
      let row=this.container;
      let tabs=row.tabs("right");
      tabs.style["height"] = "400px";
      tabs.float(1, 3*25*UIBase.getDPI(), 7);
      var tools=tabs.tab("Tools");
      tools.prop("view2d.toolmode", PackFlags.USE_ICONS|PackFlags.VERTICAL|PackFlags.LARGE_ICON);
      tools.iconbutton(Icons.UNDO, "  Hotkey : CTRL-Z", () =>        {
        g_app_state.toolstack.undo();
        delay_redraw(50);
      });
      tools.iconbutton(Icons.REDO, "  Hotkey : CTRL-SHIFT-Z", () =>        {
        g_app_state.toolstack.redo();
        delay_redraw(50);
      });
      let tool=tools.tool("view2d.circle_select(mode=select selectmode=selectmode)", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);
      tool.icon = Icons.CIRCLE_SEL_ADD;
      tool.description = "Select control points in a circle";
      tool = tools.tool("view2d.circle_select(mode=deselect selectmode=selectmode)", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);
      tool.icon = Icons.CIRCLE_SEL_SUB;
      tool.description = "Deselect control points in a circle";
      tools.tool("spline.toggle_select_all()", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);
      this.update();
    }
     makeHeader(container) {
      let row=super.makeHeader(container);
      row.noMargins();
      console.log("VIEW2D ctx:", this.ctx);
      row.prop("view2d.zoom");
      row.prop("view2d.edit_all_layers");
      row = container.row();
      row.noMargins();
      container.noMargins();
      row.useIcons();
      row.prop("view2d.selectmask[HANDLE]");
      row.prop("view2d.selectmode");
      row.prop("view2d.only_render");
      row.prop("view2d.draw_small_verts");
      row.prop("view2d.draw_normals");
      row.prop("view2d.draw_anim_paths");
      row.prop("view2d.enable_blur");
      row.prop("view2d.draw_faces");
      let mass_set_path="spline.selected_verts{1}";
      row.prop("spline.active_vertex.flag[BREAK_TANGENTS]", undefined, mass_set_path+".flag[BREAK_TANGENTS]");
      row.prop("spline.active_vertex.flag[BREAK_CURVATURES]", undefined, mass_set_path+".flag[BREAK_CURVATURES]");
      row.tool("spline.split_pick_edge()");
    }
     set_zoom(zoom) {
      this.zoom = zoom;
      window.redraw_viewport();
    }
    static  define() {
      return {tagname: "view2d-editor-x", 
     areaname: "view2d_editor", 
     uiname: "Work Canvas", 
     icon: Icons.VIEW2D_EDITOR}
    }
    static  newSTRUCT() {
      return document.createElement("view2d-editor-x");
    }
     loadSTRUCT(reader) {
      this._in_from_struct = true;
      reader(this);
      super.loadSTRUCT(reader);
      this._in_from_struct = true;
      this.need_data_link = true;
      if (this.pinned_paths!=undefined&&this.pinned_paths.length==0)
        this.pinned_paths = undefined;
      this._in_from_struct = false;
    }
    get  selectmode() {
      return this.ctx&&this.ctx.scene ? this.ctx.scene.selectmode : 0;
    }
    set  selectmode(val) {
      if (this.ctx&&this.ctx.scene) {
          this.ctx.scene.selectmode = val;
          window.redraw_viewport();
      }
    }
     set_selectmode(mode) {
      console.warn("Call to view2d.set_selectmode");
      this.ctx.scene.selectmode = mode;
      redraw_viewport();
    }
    get  pin_paths() {
      return this.pinned_paths!=undefined;
    }
    set  pin_paths(state) {
      if (!state) {
          this.pinned_paths = undefined;
          if (this.ctx!=undefined&&this.ctx.frameset!=undefined) {
              this.ctx.frameset.switch_on_select = true;
              this.ctx.frameset.update_visibility();
          }
      }
      else {
        var spline=this.ctx.frameset.spline;
        var eids=[];
        for (var v of spline.verts.selected.editable(this.ctx)) {
            eids.push(v.eid);
        }
        this.pinned_paths = eids;
        this.ctx.frameset.switch_on_select = false;
      }
    }
    get  draw_normals() {
      return this._draw_normals;
    }
    set  draw_normals(val) {
      if (val!=this._draw_normals) {
          this.draw_viewport = 1;
      }
      this._draw_normals = val;
    }
    get  draw_anim_paths() {
      return this._draw_anim_paths;
    }
    set  draw_anim_paths(val) {
      if (val!=this._draw_anim_paths) {
          this.draw_viewport = 1;
      }
      this._draw_anim_paths = val;
    }
    get  only_render() {
      return this._only_render;
    }
    set  only_render(val) {
      if (val!=this._only_render) {
          this.draw_viewport = 1;
      }
      this._only_render = val;
    }
     _get_dl_group(group) {
      if (group==undefined)
        group = "main";
      if (!(group in this.drawline_groups)) {
          this.drawline_groups[group] = new GArray();
      }
      return this.drawline_groups[group];
    }
     make_drawline(v1, v2, group="main", color=undefined, width=2) {
      var drawlines=this._get_dl_group(group);
      var dl=new drawline(v1, v2, group, color, width);
      drawlines.push(dl);
      let min=_v2d_unstatic_temps.next(), max=_v2d_unstatic_temps.next();
      var pad=5;
      min[0] = Math.min(v1[0], v2[0])-pad;
      min[1] = Math.min(v1[1], v2[1])-pad;
      max[0] = Math.max(v1[0], v2[0])+pad;
      max[1] = Math.max(v1[1], v2[1])+pad;
      redraw_viewport(min, max);
      return dl;
    }
     kill_drawline(dl) {
      let min=_v2d_unstatic_temps.next(), max=_v2d_unstatic_temps.next();
      var drawlines=this._get_dl_group(dl.group);
      var pad=5;
      var v1=dl.v1, v2=dl.v2;
      min[0] = Math.min(v1[0], v2[0])-pad;
      min[1] = Math.min(v1[1], v2[1])-pad;
      max[0] = Math.max(v1[0], v2[0])+pad;
      max[1] = Math.max(v1[1], v2[1])+pad;
      redraw_viewport(min, max);
      drawlines.remove(dl);
    }
     reset_drawlines(group="main") {
      var drawlines=this._get_dl_group(group);
      drawlines.reset();
    }
    get  editor() {
      return this.ctx.toolmode;
    }
    set  editor(v) {
      console.warn("Attempt to set view2d.editor");
    }
     get_keymaps() {
      var ret=[this.keymap];
      var maps=this.editor.get_keymaps();
      for (var i=0; i<maps.length; i++) {
          ret.push(maps[i]);
      }
      return ret;
    }
    get  can_select() {
      return this._can_select;
    }
    set  can_select(val) {
      this._can_select = !!val;
    }
     do_select(event, mpos, view2d, do_multiple=false) {
      return this.editor.do_select(event, mpos, view2d, do_multiple);
    }
     do_alt_select(event, mpos, view2d) {
      return this.editor.do_alt_select(event, mpos, view2d);
    }
     _widget_mouseevent(event) {
      let co=[event.x, event.y];
      this.unproject(co);
      let event2={type: event.type, 
     x: co[0], 
     y: co[1], 
     origX: event.x, 
     origY: event.y, 
     shiftKey: event.shiftKey, 
     ctrlKey: event.ctrlKey, 
     altKey: event.altKey, 
     commandKey: event.commandKey};
      return event2;
    }
     on_mousedown(event) {
      this.editor.view2d = this;
      if (this.ctx.screen.pickElement(event.pageX, event.pageY)!==this) {
          return ;
      }
      event = this._mouse(event);
      if (this.widgets.on_click(this._widget_mouseevent(event), this)) {
          return ;
      }
      if (event.button==0) {
          var selfound=false;
          var is_middle=event.button==1||(event.button==2&&g_app_state.screen.ctrl);
          var tottouch=g_app_state.screen.tottouch;
          if (tottouch>=2) {
              console.log("Touch screen rotate/pan/zoom combo");
          }
          else 
            if (is_middle&&this.shift) {
              console.log("Panning");
          }
          else 
            if (is_middle) {
          }
          else 
            if (event.button==0&&event.altKey) {
              this.on_mousemove(event.original);
              this._mstart = new Vector2(this.mpos);
              selfound = this.do_alt_select(event, this.mpos, this);
          }
          else 
            if (event.button==0) {
              this.on_mousemove(event.original);
              this._mstart = new Vector2(this.mpos);
              selfound = this.do_select(event, this.mpos, this, this.shift|g_app_state.select_multiple);
              this.editor.selectmode = this.selectmode;
              this.editor.view2d = this;
              if (!selfound) {
                  if (this.editor.on_mousedown(event))
                    return ;
              }
          }
      }
      if (event.button==2&&!g_app_state.screen.shift&&!g_app_state.screen.ctrl&&!g_app_state.screen.alt) {
          var tool=new PanOp();
          g_app_state.toolstack.exec_tool(tool);
      }
    }
     on_mouseup(event) {
      if (this.ctx.screen.pickElement(event.pageX, event.pageY)!==this) {
          return ;
      }
      event = this._mouse(event);
      this._mstart = null;
      if (this.editor.on_mouseup(event))
        return ;
    }
     on_mousemove(event) {
      if (this.ctx.screen.pickElement(event.pageX, event.pageY)!==this) {
          return ;
      }
      event = this._mouse(event);
      var mpos=new Vector3([event.x, event.y, 0]);
      this.mpos = mpos;
      var this2=this;
      function switch_on_multitouch(op, event, cancel_func) {
        if (g_app_state.screen.tottouch>1) {
            this2._mstart = null;
            cancel_func();
        }
        if (this._mstart!=null) {
            var vec=new Vector2(this.mpos);
            vec.sub(this._mstart);
            if (vec.vectorLength()>10) {
                this._mstart = null;
                return ;
                var top=new TranslateOp(EditModes.GEOMETRY);
            }
            top.cancel_callback = switch_on_multitouch;
            g_app_state.toolstack.exec_tool(top);
            this._mstart = null;
            return ;
        }
      }
      if (this.widgets.on_mousemove(this._widget_mouseevent(event), this)) {
          return ;
      }
      this.editor.on_mousemove(event);
    }
     set_zoom(zoom) {
      "zoom set!";
      this.zoom = zoom;
      this.set_cameramat();
      window.redraw_viewport();
    }
     change_zoom(delta) {

    }
     on_mousewheel(event, delta) {
      this.change_zoom(delta);
    }
     updateDPI() {
      if (this._last_dpi!=UIBase.getDPI()) {
          window.redraw_viewport();
          this.setCSS();
      }
      this._last_dpi = UIBase.getDPI();
    }
    get  edit_all_layers() {
      if (this.ctx&&this.ctx.scene)
        return this.ctx.scene.edit_all_layers;
    }
    set  edit_all_layers(v) {
      if (this.ctx&&this.ctx.scene)
        this.ctx.scene.edit_all_layers = v;
    }
     update() {
      let key=""+this.enable_blur+":"+this.only_render+":"+this.draw_faces+":"+this.edit_all_layers+":"+this.draw_normals+":"+this.draw_small_verts;
      if (key!==this._last_key_1) {
          this._last_key_1 = key;
          window.redraw_viewport();
      }
      this.push_ctx_active();
      super.update();
      this.updateDPI();
      this.widgets.on_tick(this.ctx);
      this.editor.on_tick(this.ctx);
      this.pop_ctx_active();
      if (this.draw_video&&(time_ms()-this.startup_time)>300) {
          this.video = video.manager.get("/video.mp4");
          if (this.video_time!=this.ctx.scene.time) {
              this.video_time = this.ctx.scene.time;
              window.force_viewport_redraw();
          }
      }
    }
     on_view_change() {

    }
  }
  _ESClass.register(View2DHandler);
  _es6_module.add_class(View2DHandler);
  View2DHandler = _es6_module.add_export('View2DHandler', View2DHandler);
  View2DHandler.STRUCT = STRUCT.inherit(View2DHandler, Area)+`
  _id             : int;
  _selectmode     : int;
  rendermat       : mat4;
  irendermat      : mat4;
  cameramat       : mat4;
  only_render     : int;
  draw_anim_paths : int;
  draw_normals    : int;
  editors         : array(abstract(View2DEditor));
  editor          : int | obj.editors.indexOf(obj.editor);
  zoom            : float;
  tweak_mode        : int;
  default_linewidth : float;
  default_stroke    : vec4;
  default_fill      : vec4;
  extrude_mode      : int;
  enable_blur       : int;
  draw_faces        : int;
  draw_video        : int;
  pinned_paths      : array(int) | obj.pinned_paths != undefined ? obj.pinned_paths : [];
  background_image  : ImageUser;
  background_color  : vec3;
  draw_bg_image     : int;
  toolmode          : int;
  draw_small_verts  : int;
}
`;
  Editor.register(View2DHandler);
}, '/dev/fairmotion/src/editors/viewport/view2d.js');
es6_module_define('view2d_ops', ["../../curve/spline.js", "../../curve/spline_draw_new.js", "../../curve/spline_draw.js", "../../core/ajax.js", "../events.js", "../../core/struct.js", "../../scene/sceneobject.js", "../../core/frameset.js", "../../core/fileapi/fileapi.js", "../../scene/scene.js", "../../core/toolops_api.js", "../../vectordraw/vectordraw_canvas2d_simple.js", "../../core/toolprops.js"], function _view2d_ops_module(_es6_module) {
  "use strict";
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var unpack_ctx=es6_import_item(_es6_module, '../../core/ajax.js', 'unpack_ctx');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var Vec2Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec2Property');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var SceneObject=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'SceneObject');
  var ObjectFlags=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'ObjectFlags');
  var $v1_Vspi_exec_pan;
  var $v2_cyYN_exec_pan;
  class ViewRotateZoomPanOp extends ToolOp {
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.undoflag = UndoFlags.IGNORE_UNDO;
      this.transdata = null;
      this.is_modal = true;
      this.inputs = {};
      this.outputs = {};
      this.first_call = false;
      this.start_mat = undefined;
      this.startcos = [undefined, undefined, undefined];
      this.startids = [undefined, undefined, undefined];
      this.start_zoom = 0;
      this.mv1 = new Vector3();
      this.mv2 = new Vector3();
      this.mv3 = new Vector3();
      this.mv4 = new Vector3();
      this.mv5 = new Vector3();
      this.mv6 = new Vector3();
    }
    static  tooldef() {
      return {apiname: "view2d.viewrotatezoom", 
     uiname: "View Rotate Zoom", 
     is_modal: true, 
     undoflag: UndoFlags.IGNORE_UNDO, 
     inputs: {}, 
     outputs: {}}
    }
     can_call(ctx) {
      return true;
    }
     start_modal(ctx) {
      this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
      this.first_call = true;
      this.start_zoom = ctx.view2d.zoomwheel;
    }
     proj(out, mpos) {
      var size=this.modal_ctx.view2d.size;
      out.loadxy(mpos);
      out[0] = out[0]/(size[0]*0.5)-1.0;
      out[1] = out[1]/(size[1]*0.5)-1.0;
    }
     on_mousemove(event) {
      var ctx=this.modal_ctx;
      var view2d=ctx.view2d;
      var screen=g_app_state.screen;
      if (screen.tottouch==0) {
          this.end_modal();
      }
      if (this.first_call==true) {
          var touches=[];
          for (var k in screen.touchstate) {
              touches.push(k);
          }
          this.first_call = false;
          var v1=new Vector3();
          var v2=new Vector3();
          this.proj(v1, screen.touchstate[touches[0]]);
          this.proj(v2, screen.touchstate[touches[1]]);
          this.startids = [touches[0], touches[1], undefined];
          this.startcos = [v1, v2, undefined];
          this.mv1.load(v1);
          this.mv2.load(v1);
          this.mv3.load(v2);
          this.mv4.load(v2);
          this.exec(this.modal_tctx);
      }
      if (screen.tottouch==2&&this.startids[2]!=undefined)
        this.transition("rotate");
      if (this.startids[2]==undefined) {
          for (var k in screen.touchstate) {
              if (k!=this.startids[0]&&k!=this.startids[1]) {
                  this.startids[2] = k;
                  this.startcos[2] = new Vector3();
                  this.proj(this.startcos[2], screen.touchstate[k]);
                  this.mv5.load(this.startcos[2]);
                  this.transition("pan");
                  break;
              }
          }
      }
      if (this.startids[0] in screen.touchstate) {
          this.proj(this.mv2, screen.touchstate[this.startids[0]]);
      }
      if (this.startids[1] in screen.touchstate) {
          this.proj(this.mv4, screen.touchstate[this.startids[1]]);
      }
      if (this.startids[2]!=undefined&&this.startids[2] in screen.touchstate) {
          this.proj(this.mv6, screen.touchstate[this.startids[2]]);
      }
      this.exec(this.modal_tctx);
    }
     exec(ctx) {
      ctx = this.modal_ctx;
      var v1=new Vector3(this.mv1);
      var v2=new Vector3(this.mv2);
      var newmat;
      if (this.startids[2]==undefined) {
          if (v1.vectorDistance(v2)<0.01)
            return ;
          var vec=new Vector3(v2);
          vec.sub(v1);
          var perp=new Vector3([-vec[1], vec[0], 0.0]);
          var q=new Quat();
          q.axisAngleToQuat(perp, vec.vectorLength()*2);
          var mat=q.toMatrix();
          newmat = new Matrix4(mat);
          newmat.multiply(this.start_mat);
      }
      else {
        newmat = ctx.view2d.drawmats.cameramat;
      }
      var v3=this.mv3, v4=this.mv4;
      var startdis=v3.vectorDistance(v1);
      var zoom;
      if (startdis>0.01) {
          zoom = v4.vectorDistance(v2)/startdis;
      }
      else {
        zoom = v4.vectorDistance(v2);
      }
      var view2d=ctx.view2d;
      var range=(view2d.zoom_wheelrange[1]-view2d.zoom_wheelrange[0]);
      var zoom2=(this.start_zoom-view2d.zoom_wheelrange[0])/range;
      zoom2+=0.025*(zoom-1.0);
      zoom2 = zoom2*range+view2d.zoom_wheelrange[0];
      view2d.drawmats.cameramat = newmat;
      if (this.startids[2]!=undefined)
        this.exec_pan(ctx);
    }
     exec_pan(ctx) {
      var view2d=ctx.view2d;
      $v1_Vspi_exec_pan.load(this.mv5);
      $v2_cyYN_exec_pan.load(this.mv6);
      $v1_Vspi_exec_pan[2] = 0.9;
      $v2_cyYN_exec_pan[2] = 0.9;
      var iprojmat=new Matrix4(ctx.view2d.drawmats.rendermat);
      iprojmat.invert();
      var scenter=new Vector3(this.center);
      scenter.multVecMatrix(ctx.view2d.drawmats.rendermat);
      if (isNaN(scenter[2]))
        scenter[2] = 0.0;
      $v1_Vspi_exec_pan[2] = scenter[2];
      $v2_cyYN_exec_pan[2] = scenter[2];
      $v1_Vspi_exec_pan.multVecMatrix(iprojmat);
      $v2_cyYN_exec_pan.multVecMatrix(iprojmat);
      var vec=new Vector3($v2_cyYN_exec_pan);
      vec.sub($v1_Vspi_exec_pan);
      let newmat=new Matrix4(this.start_mat);
      if (isNaN(vec[0])||isNaN(vec[1])||isNaN(vec[2]))
        return ;
      newmat.translate(vec);
      view2d.drawmats.cameramat = newmat;
    }
     transition(mode) {
      this.start_mat = new Matrix4(this.modal_ctx.view2d.drawmats.cameramat);
      if (mode=="rotate") {
          this.startids[2] = undefined;
          this.startcos[0].load(this.mv2);
          this.mv1.load(this.mv2);
      }
    }
     on_mouseup(event) {
      if (DEBUG.modal)
        console.log("modal end");
      for (var k in event.touches) {
          if (this.startids[2]==k) {
              this.transition("rotate");
          }
      }
      if (g_app_state.screen.tottouch==0)
        this.end_modal();
    }
  }
  var $v1_Vspi_exec_pan=new Vector3();
  var $v2_cyYN_exec_pan=new Vector3();
  _ESClass.register(ViewRotateZoomPanOp);
  _es6_module.add_class(ViewRotateZoomPanOp);
  class ViewRotateOp extends ToolOp {
     constructor() {
      super();
      this.transdata = null;
    }
    static  tooldef() {
      return {apiname: "view2d.orbit", 
     uiname: "Orbit", 
     is_modal: true, 
     undoflag: UndoFlags.IGNORE_UNDO, 
     inputs: {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"), 
      MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")}, 
     outputs: {}}
    }
     can_call(ctx) {
      return true;
    }
     start_modal(ctx) {
      this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
      this.first_call = true;
    }
     on_mousemove(event) {
      if (this.first_call==true) {
          this.first_call = false;
          this.start_mpos = new Vector3([event.x, event.y, 0]);
          this.start_mpos[0] = this.start_mpos[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
          this.start_mpos[1] = this.start_mpos[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      }
      var mstart=new Vector3(this.start_mpos);
      var mend=new Vector3([event.x, event.y, 0.0]);
      mend[0] = mend[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
      mend[1] = mend[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      var vec=new Vector3(mend);
      vec.sub(mstart);
      this.inputs.MV1.data = mstart;
      this.inputs.MV2.data = mend;
      this.exec(this.modal_ctx);
    }
     exec(ctx) {
      ctx = this.modal_ctx;
      var v1=new Vector3(this.inputs.MV1.data);
      var v2=new Vector3(this.inputs.MV2.data);
      if (v1.vectorDistance(v2)<0.01)
        return ;
      var vec=new Vector3(v2);
      vec.sub(v1);
      let perp=new Vector3([-vec[1], vec[0], 0.0]);
      var q=new Quat();
      q.axisAngleToQuat(perp, vec.vectorLength()*2);
      let mat=q.toMatrix();
      let newmat=new Matrix4(mat);
      newmat.multiply(this.start_mat);
      ctx.view2d.drawmats.cameramat = newmat;
      ctx.view2d.on_view_change();
    }
     on_mouseup(event) {
      if (DEBUG.modal)
        console.log("modal end");
      this.end_modal();
    }
  }
  _ESClass.register(ViewRotateOp);
  _es6_module.add_class(ViewRotateOp);
  class ViewPanOp extends ToolOp {
    
    
    
     constructor() {
      super("view2d_pan", "Pan");
      this.undoflag = UndoFlags.IGNORE_UNDO;
      this.transdata = null;
      this.is_modal = true;
      this.inputs = {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"), 
     MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")};
      this.outputs = {};
    }
     can_call(ctx) {
      return true;
    }
     start_modal(ctx) {
      this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
      this.first_call = true;
      this.center = new Vector3();
      var i=0;
      for (var v of ctx.mesh.verts) {
          if (isNaN(v.co[0])||isNaN(v.co[1])||isNaN(v.co[2]))
            continue;
          this.center.add(v.co);
          i+=1;
          if (i>200)
            break;
      }
      if (i>0)
        this.center.mulScalar(1.0/i);
    }
     on_mousemove(event) {
      if (this.first_call==true) {
          this.first_call = false;
          this.start_mpos = new Vector3([event.x, event.y, 0]);
          this.start_mpos[0] = this.start_mpos[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
          this.start_mpos[1] = this.start_mpos[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      }
      let mstart=new Vector3(this.start_mpos);
      var mend=new Vector3([event.x, event.y, 0.0]);
      mend[0] = mend[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
      mend[1] = mend[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      this.inputs.MV1.data = mstart;
      this.inputs.MV2.data = mend;
      this.exec(this.modal_ctx);
    }
     exec(ctx) {
      ctx = this.modal_ctx;
      var v1=new Vector3(this.inputs.MV1.data);
      var v2=new Vector3(this.inputs.MV2.data);
      if (v1.vectorDistance(v2)<0.01)
        return ;
      v1[2] = 0.9;
      v2[2] = 0.9;
      var iprojmat=new Matrix4(ctx.view2d.drawmats.rendermat);
      iprojmat.invert();
      var scenter=new Vector3(this.center);
      scenter.multVecMatrix(ctx.view2d.drawmats.rendermat);
      if (isNaN(scenter[2]))
        scenter[2] = 0.0;
      v1[2] = scenter[2];
      v2[2] = scenter[2];
      v1.multVecMatrix(iprojmat);
      v2.multVecMatrix(iprojmat);
      var vec=new Vector3(v2);
      vec.sub(v1);
      let newmat=new Matrix4(this.start_mat);
      if (isNaN(vec[0])||isNaN(vec[1])||isNaN(vec[2]))
        return ;
      newmat.translate(vec);
      ctx.view2d.drawmats.cameramat = newmat;
      ctx.view2d.on_view_change();
    }
     on_mouseup(event) {
      if (DEBUG.modal)
        console.log("modal end");
      this.end_modal();
    }
  }
  _ESClass.register(ViewPanOp);
  _es6_module.add_class(ViewPanOp);
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  class BasicFileDataOp extends ToolOp {
    
    
     constructor(data) {
      super();
      this.is_modal = false;
      this.undoflag = UndoFlags.IGNORE_UNDO|UndoFlags.IS_ROOT_OPERATOR|UndoFlags.UNDO_BARRIER;
      if (data)
        this.inputs.data.setValue(data);
      this.saved_context = new SavedContext();
    }
    static  tooldef() {
      return {uiname: "internal file load op", 
     apiname: "app.basic_file_with_data", 
     undoflag: UndoFlags.IGNORE_UNDO|UndoFlags.IS_ROOT_OPERATOR|UndoFlags.UNDO_BARRIER, 
     inputs: {data: new StringProperty("", "filedata", "file data in base64", TPropFlags.PRIVATE)}}
    }
     exec(ctx) {
      var data=new DataView(b64decode(this.inputs.data.data).buffer);
      console.log(this.inputs.data.data.length, data.byteLength);
      g_app_state.load_scene_file(data);
    }
  }
  _ESClass.register(BasicFileDataOp);
  _es6_module.add_class(BasicFileDataOp);
  BasicFileDataOp = _es6_module.add_export('BasicFileDataOp', BasicFileDataOp);
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var SplineFrameSet=es6_import_item(_es6_module, '../../core/frameset.js', 'SplineFrameSet');
  var Scene=es6_import_item(_es6_module, '../../scene/scene.js', 'Scene');
  class BasicFileOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {apiname: "app.basic_file", 
     uiname: "Make Basic File (internal)", 
     undoflag: UndoFlags.IS_ROOT_OPERATOR|UndoFlags.UNDO_BARRIER, 
     description: "Internal tool op; makes basic file"}
    }
     exec(ctx) {
      var datalib=ctx.datalib;
      var splineset=new SplineFrameSet();
      splineset.set_fake_user();
      datalib.add(splineset);
      var scene=new Scene();
      scene.set_fake_user();
      let ob=scene.addFrameset(splineset);
      scene.setActiveObject(ob);
      datalib.add(scene);
    }
  }
  _ESClass.register(BasicFileOp);
  _es6_module.add_class(BasicFileOp);
  BasicFileOp = _es6_module.add_export('BasicFileOp', BasicFileOp);
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  class FrameChangeOp extends ToolOp {
     constructor(frame) {
      super();
      this._undo = undefined;
      if (frame!=undefined)
        this.inputs.frame.setValue(frame);
    }
    static  tooldef() {
      return {apiname: "scene.change_frame", 
     uiname: "Change Frame", 
     inputs: {frame: new FloatProperty(0, "frame", "frame", "frame")}}
    }
     undo_pre(ctx) {
      this._undo = ctx.scene.time;
    }
     undo(ctx) {
      ctx.scene.change_time(ctx, this._undo);
    }
     exec(ctx) {
      ctx.scene.change_time(ctx, this.inputs.frame.data);
    }
  }
  _ESClass.register(FrameChangeOp);
  _es6_module.add_class(FrameChangeOp);
  FrameChangeOp = _es6_module.add_export('FrameChangeOp', FrameChangeOp);
  var SimpleCanvasDraw2D=es6_import_item(_es6_module, '../../vectordraw/vectordraw_canvas2d_simple.js', 'SimpleCanvasDraw2D');
  var draw_spline=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'draw_spline');
  var save_file=es6_import_item(_es6_module, '../../core/fileapi/fileapi.js', 'save_file');
  var patch_canvas2d=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'patch_canvas2d');
  var set_rendermat=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'set_rendermat');
  var SplineDrawer=es6_import_item(_es6_module, '../../curve/spline_draw_new.js', 'SplineDrawer');
  class ExportCanvasImage extends ToolOp {
    static  tooldef() {
      return {apiname: "view2d.export_image", 
     uiname: "Save Canvas Image", 
     description: "Export visible canvas", 
     undoflag: UndoFlags.IGNORE_UNDO}
    }
     exec(ctx) {
      var view2d=g_app_state.active_view2d;
      var spline=ctx.frameset.spline;
      var canvas=document.createElement("canvas");
      canvas.width = view2d.size[0];
      canvas.height = view2d.size[1];
      var g=canvas.getContext("2d");
      patch_canvas2d(g);
      set_rendermat(g, view2d.rendermat);
      var vecdrawer=new SimpleCanvasDraw2D();
      vecdrawer.canvas = canvas;
      vecdrawer.g = g;
      var drawer=new SplineDrawer(spline, vecdrawer);
      var old=spline.drawer;
      spline.drawer = drawer;
      console.log("saving image. . .");
      drawer.recalc_all = true;
      drawer.update(spline, spline.drawlist, spline.draw_layerlist, view2d.rendermat, [], view2d.only_render, view2d.selectmode, g, view2d.zoom, view2d);
      try {
        draw_spline(spline, [], g, view2d, view2d.selectmode, view2d.only_render, view2d.draw_normals, 1.0, true, ctx.frameset.time);
      }
      catch (error) {
          print_stack(error);
          console.trace("Draw error");
          g_app_state.notes.label("Error drawing canvas");
          return ;
      }
      spline.drawer = old;
      var url=canvas.toDataURL();
      url = atob(url.slice(url.search("base64,")+7, url.length));
      var data=new Uint8Array(url.length);
      for (var i=0; i<data.length; i++) {
          data[i] = url.charCodeAt(i);
      }
      save_file(data, true, false, "PNG", ["png"], function () {
        console.trace("ERROR ERROR!!\n");
        g_app_state.notes.label("Error drawing canvas");
        return ;
      });
    }
  }
  _ESClass.register(ExportCanvasImage);
  _es6_module.add_class(ExportCanvasImage);
  ExportCanvasImage = _es6_module.add_export('ExportCanvasImage', ExportCanvasImage);
  
}, '/dev/fairmotion/src/editors/viewport/view2d_ops.js');
es6_module_define('view2d_spline_ops', ["../events.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../curve/spline_draw.js", "../../curve/spline_types.js", "./transform_ops.js", "../../core/toolops_api.js", "../../core/animdata.js", "./selectmode.js", "./view2d_editor.js", "./spline_selectops.js", "./spline_editops.js", "../../core/struct.js", "./spline_createops.js", "../../curve/spline.js", "../../core/lib_api.js", "./transform.js", "./view2d_base.js"], function _view2d_spline_ops_module(_es6_module) {
  "use strict";
  var ExtrudeVertOp=es6_import_item(_es6_module, './spline_createops.js', 'ExtrudeVertOp');
  var DeleteVertOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteSegmentOp');
  var spline_selectops=es6_import(_es6_module, './spline_selectops.js');
  var WidgetResizeOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetRotateOp');
  var ScreenArea, Area;
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  let EditModes2=EditModes;
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var SelectLinkedOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectLinkedOp');
  var SelectOneOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectOneOp');
  var TranslateOp=es6_import_item(_es6_module, './transform.js', 'TranslateOp');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, './selectmode.js', 'ToolModes');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var View2DEditor=es6_import_item(_es6_module, './view2d_editor.js', 'View2DEditor');
  var SessionFlags=es6_import_item(_es6_module, './view2d_editor.js', 'SessionFlags');
  var DataBlock=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var redraw_element=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'redraw_element');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolMacro');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var DeleteVertOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, './spline_editops.js', 'ChangeFaceZ');
  var SplitEdgeOp=es6_import_item(_es6_module, './spline_editops.js', 'SplitEdgeOp');
  var DuplicateOp=es6_import_item(_es6_module, './spline_editops.js', 'DuplicateOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, './spline_editops.js', 'DisconnectHandlesOp');
  var SplitEdgePickOp=es6_import_item(_es6_module, './spline_editops.js', 'SplitEdgePickOp');
  window.anim_to_playback = [];
  class DuplicateTransformMacro extends ToolMacro {
     constructor() {
      super("duplicate_transform", "Duplicate");
    }
    static  invoke(ctx, args) {
      var tool=new DuplicateOp();
      let macro=new DuplicateTransformMacro();
      macro.add_tool(tool);
      var transop=new TranslateOp(ctx.view2d.mpos, 1|2);
      macro.add_tool(transop);
      return macro;
    }
    static  tooldef() {
      return {uiname: "Duplicate", 
     apiname: "spline.duplicate_transform", 
     is_modal: true, 
     icon: Icons.DUPLICATE, 
     description: "Duplicate geometry"}
    }
  }
  _ESClass.register(DuplicateTransformMacro);
  _es6_module.add_class(DuplicateTransformMacro);
  DuplicateTransformMacro = _es6_module.add_export('DuplicateTransformMacro', DuplicateTransformMacro);
  
  class RenderAnimOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Render", 
     apiname: "view2d.render_anim", 
     is_modal: true, 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.IGNORE_UNDO}
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      console.log("Anim render start!");
      window.anim_to_playback = [];
      window.anim_to_playback.filesize = 0;
      this.viewport = {pos: [ctx.view2d.pos[0], window.innerHeight-(ctx.view2d.pos[1]+ctx.view2d.size[1])], 
     size: [ctx.view2d.size[0], ctx.view2d.size[1]]};
      window.anim_to_playback.viewport = this.viewport;
      var this2=this;
      var pathspline=ctx.frameset.pathspline;
      var min_time=1e+17, max_time=0;
      for (var v of pathspline.verts) {
          var time=get_vtime(v);
          min_time = Math.min(min_time, time);
          max_time = Math.max(max_time, time);
      }
      if (min_time<0) {
          this.end(ctx);
          return ;
      }
      ctx.scene.change_time(ctx, min_time);
      this.min_time = min_time;
      this.max_time = max_time;
      this.timer = window.setInterval(function () {
        this2.render_frame();
      }, 10);
    }
     render_frame() {
      var ctx=this.modal_ctx;
      if (ctx==undefined||!this.modal_running) {
          console.log("Timer end");
          window.clearInterval(this.timer);
          this.end();
          return ;
      }
      var scene=ctx.scene;
      if (scene.time>=this.max_time+25) {
          this.end(ctx);
          return ;
      }
      console.log("rendering frame", scene.time);
      var vd=this.viewport;
      var canvas=document.createElement("canvas");
      canvas.width = vd.size[0], canvas.height = vd.size[1];
      var g1=ctx.view2d.draw_canvas_ctx;
      var idata=g1.getImageData(vd.pos[0], vd.pos[1], vd.size[0], vd.size[1]);
      var g2=canvas.getContext("2d");
      g2.putImageData(idata, 0, 0);
      var image=canvas.toDataURL();
      var frame={time: scene.time, 
     data: idata};
      window.anim_to_playback.push(frame);
      window.anim_to_playback.filesize+=image.length;
      scene.change_time(ctx, scene.time+1);
      window.redraw_viewport();
    }
     end(ctx) {
      if (this.timer!=undefined)
        window.clearInterval(this.timer);
      this.end_modal();
    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Escape"]:
          this.end(this.modal_ctx);
      }
    }
  }
  _ESClass.register(RenderAnimOp);
  _es6_module.add_class(RenderAnimOp);
  RenderAnimOp = _es6_module.add_export('RenderAnimOp', RenderAnimOp);
  class PlayAnimOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Play", 
     apiname: "view2d.play_anim", 
     is_modal: true, 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.IGNORE_UNDO}
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      console.log("Anim render start!");
      this.viewport = {pos: [ctx.view2d.pos[0], window.innerHeight-(ctx.view2d.pos[1]+ctx.view2d.size[1])], 
     size: [ctx.view2d.size[0], ctx.view2d.size[1]]};
      var this2=this;
      var pathspline=ctx.frameset.pathspline;
      this.start_time = time_ms();
      this.timer = window.setInterval(function () {
        if (this2.doing_draw)
          return ;
        this2.render_frame();
      }, 10);
    }
     render_frame() {
      var ctx=this.modal_ctx;
      if (ctx==undefined||!this.modal_running) {
          console.log("Timer end");
          window.clearInterval(this.timer);
          this.end();
          return ;
      }
      var vd=window.anim_to_playback.viewport;
      var g1=ctx.view2d.draw_canvas_ctx;
      var time=time_ms()-this.start_time;
      time = (time/1000.0)*24.0;
      var fi=Math.floor(time);
      var vd=window.anim_to_playback.viewport;
      var pos=ctx.view2d.pos;
      var this2=this;
      if (fi>=window.anim_to_playback.length) {
          console.log("end");
          this.end();
          window.redraw_viewport();
          return ;
      }
      var frame=window.anim_to_playback[fi];
      this.doing_draw = true;
      var draw=function draw() {
        this2.doing_draw = false;
        if (frame!=undefined) {
            if (g1._putImageData!=undefined)
              g1._putImageData(frame.data, pos[0], window.innerHeight-(pos[1]+vd.size[1]));
            else 
              g1.putImageData(frame.data, pos[0], window.innerHeight-(pos[1]+vd.size[1]));
        }
      };
      requestAnimationFrame(draw);
    }
     end(ctx) {
      if (this.timer!=undefined)
        window.clearInterval(this.timer);
      this.end_modal();
    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Escape"]:
          this.end(this.modal_ctx);
      }
    }
  }
  _ESClass.register(PlayAnimOp);
  _es6_module.add_class(PlayAnimOp);
  PlayAnimOp = _es6_module.add_export('PlayAnimOp', PlayAnimOp);
  var EditorTypes=es6_import_item(_es6_module, './view2d_base.js', 'EditorTypes');
  var $ops_FiLc_tools_menu;
  class SplineEditor extends View2DEditor {
    
    
     constructor(view2d) {
      var keymap=new KeyMap();
      super("Geometry", EditorTypes.SPLINE, EditModes2.GEOMETRY, DataTypes.FRAMESET, keymap);
      this.mpos = new Vector3();
      this.start_mpos = new Vector3();
      this.define_keymap();
      this.vieiw3d = view2d;
      this.highlight_spline = undefined;
    }
     on_area_inactive(view2d) {

    }
     editor_duplicate(view2d) {
      var m=new SplineEditor(view2d);
      m.selectmode = this.selectmode;
      m.keymap = this.keymap;
      return m;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
    static  fromSTRUCT(reader) {
      var m=new SplineEditor(undefined);
      reader(m);
      return m;
    }
     data_link(block, getblock, getblock_us) {
      this.ctx = new Context();
    }
     add_menu(view2d, mpos, add_title=true) {
      this.ctx = new Context();
      console.log("Add menu");
      var oplist=[];
      var menu=toolop_menu(view2d.ctx, add_title ? "Add" : "", oplist);
      return menu;
    }
     on_tick(ctx) {
      let widgets=[WidgetResizeOp, WidgetRotateOp];
      if (ctx.view2d.toolmode==ToolModes.RESIZE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetResizeOp);
      }
      else 
        if (ctx.view2d.toolmode==ToolModes.ROTATE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetRotateOp);
      }
      else {
        for (let cls of widgets) {
            ctx.view2d.widgets.ensure_not_toolop(ctx, cls);
        }
      }
    }
     build_sidebar1(view2d, col) {
      console.trace("build_sidebar1");
      var ctx=new Context();
      col.packflag|=PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT|PackFlags.INHERIT_WIDTH;
      col.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
      col.draw_background = true;
      col.rcorner = 100.0;
      col.default_packflag|=PackFlags.USE_LARGE_ICON;
      col.default_packflag&=~PackFlags.USE_SMALL_ICON;
      let blank=new UIFrame(this.ctx);
      blank.size[0] = 70;
      blank.size[1] = 1;
      blank.get_min_size = function () {
        return this.size;
      };
      col.add(blank);
      col.toolop("spline.make_edge()");
      col.toolop("spline.make_edge_face()");
      col.toolop("spline.split_pick_edge_transform()");
      col.toolop("spline.change_face_z(offset=1, selmode=selectmode)", PackFlags.USE_LARGE_ICON, "Move Up", Icons.Z_UP);
      col.toolop("spline.change_face_z(offset=-1, selmode=selectmode)", PackFlags.USE_LARGE_ICON, "Move Down", Icons.Z_DOWN);
      col.prop("view2d.draw_anim_paths");
    }
     build_bottombar(view2d, col) {
      var ctx=new Context();
      col.packflag|=PackFlags.ALIGN_LEFT|PackFlags.INHERIT_WIDTH|PackFlags.INHERIT_HEIGHT;
      col.packflag|=PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
      col.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
      col.rcorner = 100.0;
      col.add(gen_editor_switcher(this.ctx, view2d));
      var prop=col.prop("view2d.selectmode", PackFlags.USE_SMALL_ICON|PackFlags.ENUM_STRIP);
      prop.packflag|=PackFlags.USE_ICON|PackFlags.ENUM_STRIP;
      col.prop('view2d.default_stroke', PackFlags.COLOR_BUTTON_ONLY);
      col.prop('view2d.edit_all_layers');
    }
     define_keymap() {
      var k=this.keymap;
      k.add_tool(new HotKey("PageUp", [], "Send Face Up"), "spline.change_face_z(offset=1, selmode=selectmode)");
      k.add_tool(new HotKey("PageDown", [], "Send Face Down"), "spline.change_face_z(offset=-1, selmode=selectmode)");
      k.add_tool(new HotKey("G", [], "Translate"), "spline.translate(datamode=selectmode)");
      k.add_tool(new HotKey("S", [], "Scale"), "spline.scale(datamode=selectmode)");
      k.add_tool(new HotKey("S", ["SHIFT"], "Scale Time"), "spline.shift_time()");
      k.add_tool(new HotKey("R", [], "Rotate"), "spline.rotate(datamode=selectmode)");
      k.add_tool(new HotKey("A", [], "Select Linked"), "spline.toggle_select_all()");
      k.add_tool(new HotKey("A", ["ALT"], "Animation Playback"), "editor.playback()");
      k.add_tool(new HotKey("H", [], "Hide Selection"), "spline.hide(selmode=selectmode)");
      k.add_tool(new HotKey("H", ["ALT"], "Reveal Selection"), "spline.unhide(selmode=selectmode)");
      k.add_tool(new HotKey("G", ["CTRL"], "Ghost Selection"), "spline.hide(selmode=selectmode, ghost=1)");
      k.add_tool(new HotKey("G", ["ALT"], "Unghost Selection"), "spline.unhide(selmode=selectmode, ghost=1)");
      k.add(new HotKey("L", [], "Select Linked"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        var ret=ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
        console.log("select linked", ret);
        if (ret!=undefined) {
            var tool=new SelectLinkedOp(true, ctx.view2d.selectmode);
            tool.inputs.vertex_eid.setValue(ret[0].eid);
            tool.inputs.mode.setValue("SELECT");
            ctx.appstate.toolstack.exec_tool(tool);
        }
      }));
      k.add(new HotKey("L", ["SHIFT"], "Select Linked"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        var ret=ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
        if (ret!=undefined) {
            var tool=new SelectLinkedOp(true);
            tool.inputs.vertex_eid.setValue(ret[0].eid);
            tool.inputs.mode.setValue("deselect");
            ctx.appstate.toolstack.exec_tool(tool);
        }
      }));
      k.add_tool(new HotKey("B", [], "Toggle Break-Tangents"), "spline.toggle_break_tangents()");
      k.add_tool(new HotKey("B", ["SHIFT"], "Toggle Break-Curvature"), "spline.toggle_break_curvature()");
      var this2=this;
      function del_tool(ctx) {
        console.log("delete");
        if (this2.selectmode&SelMask.SEGMENT) {
            console.log("kill segments");
            var op=new DeleteSegmentOp();
            g_app_state.toolstack.exec_tool(op);
        }
        else 
          if (this2.selectmode&SelMask.FACE) {
            console.log("kill faces");
            var op=new DeleteFaceOp();
            g_app_state.toolstack.exec_tool(op);
        }
        else {
          console.log("kill verts");
          var op=new DeleteVertOp();
          g_app_state.toolstack.exec_tool(op);
        }
      }
      k.add(new HotKey("X", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add(new HotKey("Delete", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add(new HotKey("Backspace", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add_tool(new HotKey("D", [], "Dissolve Vertices"), "spline.dissolve_verts()");
      k.add_tool(new HotKey("D", ["SHIFT"], "Duplicate"), "spline.duplicate_transform()");
      k.add_tool(new HotKey("F", [], "Create Face/Edge"), "spline.make_edge_face()");
      k.add_tool(new HotKey("E", [], "Split Segments"), "spline.split_edges()");
      k.add_tool(new HotKey("M", [], "Mirror Verts"), "spline.mirror_verts()");
      k.add_tool(new HotKey("C", [], "Circle Select"), "view2d.circle_select()");
      k.add(new HotKey("Z", [], "Toggle Only Render"), new FuncKeyHandler(function (ctx) {
        ctx.view2d.only_render^=1;
        window.redraw_viewport();
      }));
      k.add(new HotKey("W", [], "Tools Menu"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        ctx.view2d.tools_menu(ctx, mpos);
      }));
    }
     set_selectmode(mode) {
      this.selectmode = mode;
    }
     do_select(event, mpos, view2d, do_multiple=false) {
      return false;
    }
     tools_menu(ctx, mpos, view2d) {
      var menu=view2d.toolop_menu(ctx, "Tools", $ops_FiLc_tools_menu);
      view2d.call_menu(menu, view2d, mpos);
    }
     on_inactive(view2d) {

    }
     on_active(view2d) {

    }
     rightclick_menu(event, view2d) {

    }
     _get_spline() {
      return this.ctx.spline;
    }
     on_mousedown(event) {
      var spline=this.ctx.spline;
      var toolmode=this.ctx.view2d.toolmode;
      if (this.highlight_spline!==undefined) {
      }
      if (this.highlight_spline!==undefined&&this.highlight_spline!==spline) {
          var newpath;
          console.log("spline switch!");
          if (this.highlight_spline.is_anim_path) {
              newpath = "frameset.pathspline";
          }
          else {
            newpath = "frameset.drawspline";
          }
          console.log(spline._debug_id, this.highlight_spline._debug_id);
          console.log("new path!", G.active_splinepath, newpath);
          this.ctx.switch_active_spline(newpath);
          spline = this._get_spline();
          redraw_viewport();
      }
      if ("size" in spline&&spline[0]!=window.innerWidth&&spline[1]!=window.innerHeight) {
          spline.size[0] = window.innerWidth;
          spline.size[1] = window.innerHeight;
      }
      if (event.button==0) {
          var can_append=toolmode==ToolModes.APPEND;
          can_append = can_append&&(this.selectmode&(SelMask.VERTEX|SelMask.HANDLE));
          can_append = can_append&&spline.verts.highlight===undefined&&spline.handles.highlight===undefined;
          if (can_append) {
              var co=new Vector3([event.x, event.y, 0]);
              this.view2d.unproject(co);
              console.log(co);
              var op=new ExtrudeVertOp(co, this.ctx.view2d.extrude_mode);
              op.inputs.location.setValue(co);
              op.inputs.linewidth.setValue(this.ctx.view2d.default_linewidth);
              op.inputs.stroke.setValue(this.ctx.view2d.default_stroke);
              g_app_state.toolstack.exec_tool(op);
              redraw_viewport();
          }
          else {
            for (var i=0; i<spline.elists.length; i++) {
                var list=spline.elists[i];
                if (!(this.selectmode&list.type))
                  continue;
                
                if (list.highlight==undefined)
                  continue;
                var op=new SelectOneOp(list.highlight, !event.shiftKey, !(list.highlight.flag&SplineFlags.SELECT), this.selectmode, true);
                g_app_state.toolstack.exec_tool(op);
            }
          }
          this.start_mpos[0] = event.x;
          this.start_mpos[1] = event.y;
          this.start_mpos[2] = 0.0;
          this.mdown = true;
      }
    }
     ensure_paths_off() {
      if (g_app_state.active_splinepath!="frameset.drawspline") {
          this.highlight_spline = undefined;
          var spline=this.ctx.spline;
          g_app_state.switch_active_spline("frameset.drawspline");
          spline.clear_highlight();
          spline.solve();
          redraw_viewport();
      }
    }
    get  draw_anim_paths() {
      return this.ctx.view2d.draw_anim_paths;
    }
     findnearest(mpos, selectmask, limit, ignore_layers) {
      var frameset=this.ctx.frameset;
      var editor=this.ctx.view2d;
      var closest=[0, 0, 0];
      var mindis=1e+17;
      var found=false;
      if (!this.draw_anim_paths) {
          this.ensure_paths_off();
          var ret=this.ctx.spline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
          if (ret!=undefined) {
              return [this.ctx.spline, ret[0], ret[1]];
          }
          else {
            return undefined;
          }
      }
      var actspline=this.ctx.spline;
      var pathspline=this.ctx.frameset.pathspline;
      var drawspline=this.ctx.frameset.spline;
      var ret=drawspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
      if (ret!=undefined&&ret[1]<limit) {
          mindis = ret[1]-(drawspline===actspline ? 3 : 0);
          found = true;
          closest[0] = drawspline;
          closest[1] = ret[0];
          closest[2] = mindis;
      }
      var ret=frameset.pathspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, false);
      if (ret!=undefined) {
          ret[1]-=pathspline===actspline ? 2 : 0;
          if (ret[1]<limit&&ret[1]<mindis) {
              closest[0] = pathspline;
              closest[1] = ret[0];
              closest[2] = ret[1]-(pathspline===actspline ? 3 : 0);
              mindis = ret[1];
              found = true;
          }
      }
      if (!found)
        return undefined;
      return closest;
    }
     on_mousemove(event) {
      if (this.ctx==undefined)
        return ;
      var toolmode=this.ctx.view2d.toolmode;
      var selectmode=this.selectmode;
      var limit=selectmode&SelMask.SEGMENT ? 55 : 12;
      if (toolmode==ToolModes.SELECT)
        limit*=3;
      var spline=this.ctx.spline;
      spline.size = [window.innerWidth, window.innerHeight];
      this.mpos[0] = event.x, this.mpos[1] = event.y, this.mpos[2] = 0.0;
      var selectmode=this.selectmode;
      if (this.mdown) {
          this.mdown = false;
          let mpos=new Vector2();
          mpos.load(this.start_mpos);
          var op=new TranslateOp(mpos);
          console.log("start_mpos:", mpos);
          op.inputs.datamode.setValue(this.ctx.view2d.selectmode);
          op.inputs.edit_all_layers.setValue(this.ctx.view2d.edit_all_layers);
          var ctx=new Context();
          if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
              op.inputs.proportional.setValue(true);
              op.inputs.propradius.setValue(ctx.view2d.propradius);
          }
          g_app_state.toolstack.exec_tool(op);
          return ;
      }
      if (this.mdown)
        return ;
      var ret=this.findnearest([event.x, event.y], this.ctx.view2d.selectmode, limit, this.ctx.view2d.edit_all_layers);
      if (ret!=undefined&&typeof (ret[1])!="number"&&ret[2]!=SelMask.MULTIRES) {
          if (this.highlight_spline!=undefined) {
              for (var list of this.highlight_spline.elists) {
                  if (list.highlight!=undefined) {
                      redraw_element(list.highlight, this.view2d);
                  }
              }
          }
          if (ret[0]!==this.highlight_spline&&this.highlight_spline!=undefined) {
              this.highlight_spline.clear_highlight();
          }
          this.highlight_spline = ret[0];
          this.highlight_spline.clear_highlight();
          var list=this.highlight_spline.get_elist(ret[1].type);
          list.highlight = ret[1];
          redraw_element(list.highlight, this.view2d);
      }
      else {
        if (this.highlight_spline!=undefined) {
            for (var i=0; i<this.highlight_spline.elists.length; i++) {
                var list=this.highlight_spline.elists[i];
                if (list.highlight!=undefined) {
                    redraw_element(list.highlight, this.view2d);
                }
            }
            this.highlight_spline.clear_highlight();
        }
      }
    }
     on_mouseup(event) {
      var spline=this._get_spline();
      spline.size = [window.innerWidth, window.innerHeight];
      this.mdown = false;
    }
     do_alt_select(event, mpos, view2d) {

    }
     gen_edit_menu(add_title=false) {
      var view2d=this.view2d;
      var ctx=new Context();
      var ops=["spline.select_linked(vertex_eid=active_vertex())", "view2d.circle_select()", "spline.toggle_select_all()", "spline.hide()", "spline.unhide()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.duplicate_transform()", "spline.mirror_verts()", "spline.split_edges()", "spline.make_edge_face()", "spline.dissolve_verts()", "spline.delete_verts()", "spline.delete_segments()", "spline.delete_faces()", "spline.split_edges()", "spline.toggle_manual_handles()"];
      ops.reverse();
      var menu=view2d.toolop_menu(ctx, add_title ? "Edit" : "", ops);
      return menu;
    }
     delete_menu(event) {
      var view2d=this.view2d;
      var ctx=new Context();
      var menu=this.gen_delete_menu(true);
      menu.close_on_right = true;
      menu.swap_mouse_button = 2;
      view2d.call_menu(menu, view2d, [event.x, event.y]);
    }
  }
  var $ops_FiLc_tools_menu=["spline.key_edges()", "spline.key_current_frame()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.toggle_step_mode()", "spline.toggle_manual_handles()", "editor.paste_pose()", "editor.copy_pose()"];
  _ESClass.register(SplineEditor);
  _es6_module.add_class(SplineEditor);
  SplineEditor = _es6_module.add_export('SplineEditor', SplineEditor);
  SplineEditor.STRUCT = `
  SplineEditor {
    selectmode : int;
  }
`;
  var ScreenArea=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'ScreenArea');
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
}, '/dev/fairmotion/src/editors/viewport/view2d_spline_ops.js');
es6_module_define('view2d_object_ops', ["../../core/struct.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../curve/spline_multires.js", "./view2d_base.js", "../../curve/spline_types.js", "./view2d_editor.js", "../../curve/spline_draw.js", "./spline_createops.js", "./transform_ops.js", "../../core/animdata.js", "./spline_editops.js", "./selectmode.js", "./multires/multires_ops.js", "./transform.js", "../../core/toolops_api.js", "./multires/multires_selectops.js", "../../core/lib_api.js", "./spline_selectops.js", "../events.js", "../../curve/spline.js"], function _view2d_object_ops_module(_es6_module) {
  "use strict";
  var ExtrudeVertOp=es6_import_item(_es6_module, './spline_createops.js', 'ExtrudeVertOp');
  var DeleteVertOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteSegmentOp');
  var CreateMResPoint=es6_import_item(_es6_module, './multires/multires_ops.js', 'CreateMResPoint');
  var mr_selectops=es6_import(_es6_module, './multires/multires_selectops.js');
  var spline_selectops=es6_import(_es6_module, './spline_selectops.js');
  var WidgetResizeOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetRotateOp');
  var compose_id=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'decompose_id');
  var MResFlags=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'MResFlags');
  var MultiResLayer=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'MultiResLayer');
  var ScreenArea, Area;
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var SelectLinkedOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectLinkedOp');
  var SelectOneOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectOneOp');
  var TranslateOp=es6_import_item(_es6_module, './transform.js', 'TranslateOp');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, './selectmode.js', 'ToolModes');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var View2DEditor=es6_import_item(_es6_module, './view2d_editor.js', 'View2DEditor');
  var SessionFlags=es6_import_item(_es6_module, './view2d_editor.js', 'SessionFlags');
  var DataBlock=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var redraw_element=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'redraw_element');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var EditorTypes=es6_import_item(_es6_module, './view2d_base.js', 'EditorTypes');
  class SceneObjectEditor extends View2DEditor {
    
    
     constructor(view2d) {
      super("Object", EditorTypes.OBJECT, EditModes.OBJECT, DataTypes.FRAMESET, keymap);
      this.mpos = new Vector3();
      this.start_mpos = new Vector3();
      this.define_keymap();
      this.view2d = view2d;
      this.highlight_spline = undefined;
    }
     on_area_inactive(view2d) {

    }
     editor_duplicate(view2d) {
      var m=new SceneObjectEditor(view2d);
      m.selectmode = this.selectmode;
      m.keymap = this.keymap;
      return m;
    }
    static  fromSTRUCT(reader) {
      var m=new SceneObjectEditor(undefined);
      reader(m);
      return m;
    }
     data_link(block, getblock, getblock_us) {
      this.ctx = new Context();
    }
     add_menu(view2d, mpos, add_title=true) {

    }
     on_tick(ctx) {
      let widgets=[WidgetResizeOp, WidgetRotateOp];
      if (ctx.view2d.toolmode==ToolModes.RESIZE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetResizeOp);
      }
      else 
        if (ctx.view2d.toolmode==ToolModes.ROTATE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetRotateOp);
      }
      else {
        for (let cls of widgets) {
            ctx.view2d.widgets.ensure_not_toolop(ctx, cls);
        }
      }
    }
     build_sidebar1(view2d, col) {

    }
     build_bottombar(view2d, col) {

    }
     define_keymap() {
      var k=this.keymap;
    }
     set_selectmode(mode) {
      this.selectmode = mode;
    }
     do_select(event, mpos, view2d, do_multiple) {
      return false;
    }
     tools_menu(ctx, mpos, view2d) {
      let ops=[];
      var menu=view2d.toolop_menu(ctx, "Tools", ops);
      view2d.call_menu(menu, view2d, mpos);
    }
     on_inactive(view2d) {

    }
     on_active(view2d) {

    }
     rightclick_menu(event, view2d) {

    }
     on_mousedown(event) {

    }
     ensure_paths_off() {
      if (g_app_state.active_splinepath!="frameset.drawspline") {
          this.highlight_spline = undefined;
          var spline=this.ctx.spline;
          g_app_state.switch_active_spline("frameset.drawspline");
          spline.clear_highlight();
          spline.solve();
          redraw_viewport();
      }
    }
    get  draw_anim_paths() {
      return this.ctx.view2d.draw_anim_paths;
    }
     findnearest(mpos, selectmask, limit, ignore_layers) {

    }
     on_mousemove(event) {
      this.mdown = true;
    }
     on_mouseup(event) {
      this.mdown = false;
    }
     do_alt_select(event, mpos, view2d) {

    }
     gen_edit_menu(add_title=false) {

    }
     delete_menu(event) {

    }
  }
  _ESClass.register(SceneObjectEditor);
  _es6_module.add_class(SceneObjectEditor);
  SceneObjectEditor = _es6_module.add_export('SceneObjectEditor', SceneObjectEditor);
  SceneObjectEditor.STRUCT = `
SceneObjectEditor {
  selectmode : int;
}
`;
  var ScreenArea=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'ScreenArea');
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
}, '/dev/fairmotion/src/editors/viewport/view2d_object_ops.js');
es6_module_define('sceneobject_ops', ["../../core/toolops_api.js", "../../core/struct.js", "../../core/toolprops.js"], function _sceneobject_ops_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var Vec2Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec2Property');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var FlagProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FlagProperty');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, '../../core/toolprops.js', 'PropTypes');
  var PropSubTypes=es6_import_item(_es6_module, '../../core/toolprops.js', 'PropSubTypes');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var ToolMacro=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolMacro');
}, '/dev/fairmotion/src/editors/viewport/sceneobject_ops.js');
es6_module_define('view2d_base', [], function _view2d_base_module(_es6_module) {
  var EditModes={VERT: 1, 
   EDGE: 2, 
   HANDLE: 4, 
   FACE: 16, 
   OBJECT: 32, 
   GEOMETRY: 1|2|4|16}
  EditModes = _es6_module.add_export('EditModes', EditModes);
  var EditorTypes={SPLINE: 1, 
   OBJECT: 32}
  EditorTypes = _es6_module.add_export('EditorTypes', EditorTypes);
  var SessionFlags={PROP_TRANSFORM: 1}
  SessionFlags = _es6_module.add_export('SessionFlags', SessionFlags);
}, '/dev/fairmotion/src/editors/viewport/view2d_base.js');
es6_module_define('animspline', ["../curve/spline.js", "./toolprops.js", "./animdata.js", "../curve/spline_types.js", "../path.ux/scripts/util/struct.js", "./lib_api.js", "./struct.js", "../curve/spline_element_array.js"], function _animspline_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, './lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, './lib_api.js', 'DataTypes');
  var Spline=es6_import_item(_es6_module, '../curve/spline.js', 'Spline');
  var RestrictFlags=es6_import_item(_es6_module, '../curve/spline.js', 'RestrictFlags');
  var CustomDataLayer=es6_import_item(_es6_module, '../curve/spline_types.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineFlags');
  var SplineSegment=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineSegment');
  var TimeDataLayer=es6_import_item(_es6_module, './animdata.js', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, './animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, './animdata.js', 'set_vtime');
  var AnimChannel=es6_import_item(_es6_module, './animdata.js', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, './animdata.js', 'AnimKey');
  var AnimInterpModes=es6_import_item(_es6_module, './animdata.js', 'AnimInterpModes');
  var AnimKeyFlags=es6_import_item(_es6_module, './animdata.js', 'AnimKeyFlags');
  var SplineLayerFlags=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerFlags');
  var SplineLayerSet=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerSet');
  es6_import(_es6_module, '../path.ux/scripts/util/struct.js');
  var restrictflags=RestrictFlags.NO_DELETE|RestrictFlags.NO_EXTRUDE|RestrictFlags.NO_CONNECT;
  var vertanimdata_eval_cache=cachering.fromConstructor(Vector3, 64);
  var AnimChannel=es6_import_item(_es6_module, './animdata.js', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, './animdata.js', 'AnimKey');
  var PropTypes=es6_import_item(_es6_module, './toolprops.js', 'PropTypes');
  class VertexAnimIter  {
    
    
     constructor(vd) {
      this.ret = {done: false, 
     value: undefined};
      this.stop = false;
      if (vd!=undefined)
        VertexAnimIter.init(this, vd);
    }
     init(vd) {
      this.vd = vd;
      this.v = vd.startv;
      this.stop = false;
      if (this.v!=undefined&&this.v.segments.length!=0)
        this.s = this.v.segments[0];
      else 
        this.s = undefined;
      this.ret.done = false;
      this.ret.value = undefined;
      return this;
    }
     [Symbol.iterator](self) {
      return this;
    }
     next() {
      var ret=this.ret;
      if (this.vd.startv==undefined) {
          ret.done = true;
          ret.value = undefined;
          return ret;
      }
      if (this.stop&&this.v==undefined) {
          ret.done = true;
          ret.value = undefined;
          return ret;
      }
      ret.value = this.v;
      if (this.stop||this.s==undefined) {
          this.v = undefined;
          if (ret.value==undefined)
            ret.done = true;
          return ret;
      }
      this.v = this.s.other_vert(this.v);
      if (this.v.segments.length<2) {
          this.stop = true;
          return ret;
      }
      this.s = this.v.other_segment(this.s);
      return ret;
    }
  }
  _ESClass.register(VertexAnimIter);
  _es6_module.add_class(VertexAnimIter);
  VertexAnimIter = _es6_module.add_export('VertexAnimIter', VertexAnimIter);
  class SegmentAnimIter  {
    
    
     constructor(vd) {
      this.ret = {done: false, 
     value: undefined};
      this.stop = false;
      if (this.v!=undefined&&this.v.segments.length!=0)
        if (vd!=undefined)
        SegmentAnimIter.init(this, vd);
    }
     init(vd) {
      this.vd = vd;
      this.v = vd.startv;
      this.stop = false;
      if (this.v!==undefined)
        this.s = this.v.segments[0];
      else 
        this.s = undefined;
      this.ret.done = false;
      this.ret.value = undefined;
      return this;
    }
     [Symbol.iterator](self) {
      return this;
    }
     next() {
      var ret=this.ret;
      if (this.stop||this.s==undefined) {
          ret.done = true;
          ret.value = undefined;
          return ret;
      }
      ret.value = this.s;
      this.v = this.s.other_vert(this.v);
      if (this.v.segments.length<2) {
          this.stop = true;
          return ret;
      }
      this.s = this.v.other_segment(this.s);
      return ret;
    }
  }
  _ESClass.register(SegmentAnimIter);
  _es6_module.add_class(SegmentAnimIter);
  SegmentAnimIter = _es6_module.add_export('SegmentAnimIter', SegmentAnimIter);
  var VDAnimFlags={SELECT: 1, 
   STEP_FUNC: 2, 
   HIDE: 4, 
   OWNER_IS_EDITABLE: 8}
  VDAnimFlags = _es6_module.add_export('VDAnimFlags', VDAnimFlags);
  class VertexAnimData  {
    
    
    
    
    
     constructor(eid, pathspline) {
      this.eid = eid;
      this.vitercache = cachering.fromConstructor(VertexAnimIter, 4);
      this.sitercache = cachering.fromConstructor(SegmentAnimIter, 4);
      this.spline = pathspline;
      this.animflag = 0;
      this.flag = 0;
      this.visible = false;
      this.path_times = {};
      this.startv_eid = -1;
      if (pathspline!=undefined) {
          var layer=pathspline.layerset.new_layer();
          layer.flag|=SplineLayerFlags.HIDE;
          this.layerid = layer.id;
      }
      this._start_layer_id = undefined;
      this.cur_time = 0;
    }
    get  startv() {
      if (this.startv_eid==-1)
        return undefined;
      return this.spline.eidmap[this.startv_eid];
    }
    set  startv(v) {
      if (typeof v=="number") {
          this.startv_eid = v;
          return ;
      }
      if (v!=undefined) {
          this.startv_eid = v.eid;
      }
      else {
        this.startv_eid = -1;
      }
    }
     _set_layer() {
      if (this.spline.layerset.active.id!=this.layerid)
        this._start_layer_id = this.spline.layerset.active.id;
      if (this.layerid==undefined) {
          console.log("Error in _set_layer in VertexAnimData!!!");
          return ;
      }
      this.spline.layerset.active = this.spline.layerset.idmap[this.layerid];
    }
     [Symbol.keystr]() {
      return this.eid;
    }
     _unset_layer() {
      if (this._start_layer_id!=undefined) {
          var layer=this.spline.layerset.idmap[this._start_layer_id];
          if (layer!=undefined)
            this.spline.layerset.active = layer;
      }
      this._start_layer_id = undefined;
    }
    get  verts() {
      return this.vitercache.next().init(this);
    }
    get  segments() {
      return this.sitercache.next().init(this);
    }
     find_seg(time) {
      var v=this.startv;
      if (v==undefined)
        return undefined;
      if (v.segments.length==0)
        return undefined;
      var s=v.segments[0];
      var lastv=v;
      while (1) {
        lastv = v;
        v = s.other_vert(v);
        if (get_vtime(v)>time) {
            return s;
        }
        if (v.segments.length<2) {
            lastv = v;
            break;
        }
        s = v.other_segment(s);
      }
      return undefined;
    }
     _get_animdata(v) {
      let ret=v.cdata.get_layer(TimeDataLayer);
      ret.owning_veid = this.eid;
      return ret;
    }
     update(co, time) {
      this._set_layer();
      if (time<0) {
          console.trace("ERROR! negative times not supported!");
          this._unset_layer();
          return ;
      }
      if (this.startv==undefined) {
          this.startv = this.spline.make_vertex(co);
          this._get_animdata(this.startv).time = 1;
          this.spline.regen_sort();
          this.spline.resolve = 1;
      }
      var spline=this.spline;
      var seg=this.find_seg(time);
      if (seg==undefined) {
          var e=this.endv;
          if (this._get_animdata(e).time==time) {
              e.load(co);
              e.flag|=SplineFlags.UPDATE;
          }
          else {
            var nv=spline.make_vertex(co);
            this._get_animdata(nv).time = time;
            spline.make_segment(e, nv);
            spline.regen_sort();
          }
      }
      else {
        if (get_vtime(seg.v1)==time) {
            seg.v1.load(co);
            seg.v1.flag|=SplineFlags.UPDATE;
        }
        else 
          if (get_vtime(seg.v2)==time) {
            seg.v2.load(co);
            seg.v2.flag|=SplineFlags.UPDATE;
        }
        else {
          var ret=spline.split_edge(seg);
          var nv=ret[1];
          spline.regen_sort();
          this._get_animdata(nv).time = time;
          nv.load(co);
        }
      }
      spline.resolve = 1;
      this._unset_layer();
    }
    get  start_time() {
      var v=this.startv;
      if (v===undefined)
        return 0;
      return get_vtime(v);
    }
    get  end_time() {
      var v=this.endv;
      if (v===undefined)
        return 0;
      return get_vtime(v);
    }
     draw(g, alpha, time) {
      if (!(this.visible))
        return ;
      var step_func=this.animflag&VDAnimFlags.STEP_FUNC;
      var start=this.start_time, end=this.end_time;
      g.lineWidth = 1.0;
      g.strokeStyle = "rgba(100,100,100,"+alpha+")";
      var dt=1.0;
      var lastco=undefined;
      for (var t=start; t<end; t+=dt) {
          var co=this.evaluate(t);
          var dv=this.derivative(t);
          var tmp=dv[0];
          dv[0] = -dv[1];
          dv[1] = tmp;
          dv.normalize().mulScalar(3);
          g.beginPath();
          var green=Math.floor(((t-start)/(end-start))*255);
          g.strokeStyle = "rgba(10, "+green+",10,"+alpha+")";
          g.moveTo(co[0]-dv[0], co[1]-dv[1]);
          g.lineTo(co[0], co[1]);
          g.lineTo(co[0]-dv[0], co[1]-dv[1]);
          g.stroke();
          if (lastco!=undefined) {
              g.moveTo(lastco[0], lastco[1]);
              g.lineTo(co[0], co[1]);
              g.stroke();
          }
          lastco = co;
      }
    }
     derivative(time) {
      var df=0.01;
      var a=this.evaluate(time);
      var b=this.evaluate(time+df);
      b.sub(a).mulScalar(1.0/df);
      return b;
    }
     evaluate(time) {
      var v=this.startv;
      var step_func=this.animflag&VDAnimFlags.STEP_FUNC;
      if (v===undefined)
        return vertanimdata_eval_cache.next().zero();
      var co=vertanimdata_eval_cache.next();
      if (time<=get_vtime(v)) {
          co.load(v);
          return co;
      }
      if (v.segments.length===0) {
          co.load(v);
          return co;
      }
      var s=v.segments[0];
      var lastv=v;
      var lasts=s;
      var lastv2=v;
      while (1) {
        lastv2 = lastv;
        lastv = v;
        v = s.other_vert(v);
        if (get_vtime(v)>=time)
          break;
        if (v.segments.length<2) {
            lastv2 = lastv;
            lastv = v;
            break;
        }
        lasts = s;
        s = v.other_segment(s);
      }
      var nextv=v, nextv2=v;
      var alen1=s!==undefined ? s.length : 1, alen2=alen1;
      var alen0=lasts!==undefined ? lasts.length : alen1, alen3=alen1;
      if (v.segments.length===2) {
          var nexts=v.other_segment(s);
          nextv = nexts.other_vert(v);
          alen2 = nexts.length;
          alen3 = alen2;
      }
      nextv2 = nextv;
      if (nextv2.segments.length===2) {
          var nexts2=nextv2.other_segment(nexts);
          nextv2 = nexts2.other_vert(nextv2);
          alen3 = nexts2.length;
      }
      if (lastv===v||get_vtime(lastv)===time) {
          co.load(v);
      }
      else {
        var pt2=get_vtime(lastv2), pt=get_vtime(lastv), vt=get_vtime(v);
        var nt=get_vtime(nextv), nt2=get_vtime(nextv2);
        var t=(time-pt)/(vt-pt);
        var a=pt, b, c, d=vt;
        var arclength1=alen0;
        var arclength2=alen1;
        var arclength3=alen2;
        var t0=pt2, t3=pt, t6=vt, t9=nt;
        var t1=pt2+(pt-pt2)*(1.0/3.0);
        var t8=vt+(nt-vt)*(2.0/3.0);
        var b=(-(t0-t1)*(t3-t6)*arclength1+(t0-t3)*arclength2*t3)/((t0-t3)*arclength2);
        var c=((t3-t6)*(t8-t9)*arclength3+(t6-t9)*arclength2*t6)/((t6-t9)*arclength2);
        var r1=alen0/alen1;
        var r2=alen1/alen2;
        b = pt+r1*(vt-pt2)/3.0;
        c = vt-r2*(nt-pt)/3.0;
        var t0=a, t1=b, t2=c, t3=d;
        var tt=-(3*(t0-t1)*t-t0+3*(2*t1-t2-t0)*t*t+(3*t2-t3-3*t1+t0)*t*t*t);
        tt = Math.abs(tt);
        if (step_func) {
            t = time<vt ? 0.0 : 1.0;
        }
        co.load(s.evaluate(lastv===s.v1 ? t : 1-t));
      }
      return co;
    }
    get  endv() {
      var v=this.startv;
      if (v===undefined)
        return undefined;
      if (v.segments.length===0)
        return v;
      var s=v.segments[0];
      while (1) {
        v = s.other_vert(v);
        if (v.segments.length<2)
          break;
        s = v.other_segment(s);
      }
      return v;
    }
     check_time_integrity() {
      var lasttime=-100000;
      for (var v of this.verts) {
          var t=get_vtime(v);
          if (t<lasttime) {
              console.log("Found timing integrity error for vertex", this.eid, "path vertex:", v.eid);
              this.regen_topology();
              return true;
          }
          lasttime = t;
      }
      return false;
    }
     regen_topology() {
      var spline=this.spline;
      var verts=[];
      var segs=new set();
      var visit=new set();
      var handles=[];
      var lastv=undefined;
      var hi=0;
      for (var v of this.verts) {
          if (visit.has(v)) {
              continue;
          }
          visit.add(v);
          verts.push(v);
          handles.push(undefined);
          handles.push(undefined);
          hi+=2;
          v.flag|=SplineFlags.UPDATE;
          for (var s of v.segments) {
              segs.add(s);
              var v2=s.other_vert(v);
              var h2=s.other_handle(s.handle(v));
              if (v2===lastv) {
                  handles[hi-2] = h2;
              }
              else {
                handles[hi-1] = h2;
              }
          }
          lastv = v;
      }
      if (verts.length==0) {
          return ;
      }
      verts.sort(function (a, b) {
        return get_vtime(a)-get_vtime(b);
      });
      for (var s of segs) {
          spline.kill_segment(s);
      }
      this.startv_eid = verts[0].eid;
      for (var i=1; i<verts.length; i++) {
          var s=spline.make_segment(verts[i-1], verts[i]);
          s.flag|=SplineFlags.UPDATE;
          s.h1.flag|=SplineFlags.UPDATE;
          s.h2.flag|=SplineFlags.UPDATE;
          for (var k in s.v1.layers) {
              spline.layerset.idmap[k].add(s);
          }
      }
      var hi=0;
      var lastv=undefined;
      for (var v of verts) {
          for (var s of v.segments) {
              var v2=s.other_vert(v);
              var h2=s.other_handle(s.handle(v));
              if (v2===lastv&&handles[hi]!==undefined) {
                  h2.load(handles[hi]);
              }
              else 
                if (v2!==lastv&&handles[hi+1]!==undefined) {
                  h2.load(handles[hi+1]);
              }
          }
          lastv = v;
          hi+=2;
      }
    }
    static  fromSTRUCT(reader) {
      var ret=new VertexAnimData();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(VertexAnimData);
  _es6_module.add_class(VertexAnimData);
  VertexAnimData = _es6_module.add_export('VertexAnimData', VertexAnimData);
  VertexAnimData.STRUCT = `
VertexAnimData {
  eid         : int;
  flag        : int;
  animflag    : int;
  cur_time    : int;
  layerid     : int;
  startv_eid  : int;
}
`;
}, '/dev/fairmotion/src/core/animspline.js');
es6_module_define('frameset', ["../curve/spline.js", "../curve/spline_types.js", "./animspline", "./animspline.js", "../curve/spline_element_array.js", "./animdata.js", "./struct.js", "./lib_api.js"], function _frameset_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, './lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, './lib_api.js', 'DataTypes');
  var Spline=es6_import_item(_es6_module, '../curve/spline.js', 'Spline');
  var RestrictFlags=es6_import_item(_es6_module, '../curve/spline.js', 'RestrictFlags');
  var CustomDataLayer=es6_import_item(_es6_module, '../curve/spline_types.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineFlags');
  var SplineSegment=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineSegment');
  var TimeDataLayer=es6_import_item(_es6_module, './animdata.js', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, './animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, './animdata.js', 'set_vtime');
  var AnimChannel=es6_import_item(_es6_module, './animdata.js', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, './animdata.js', 'AnimKey');
  var AnimInterpModes=es6_import_item(_es6_module, './animdata.js', 'AnimInterpModes');
  var AnimKeyFlags=es6_import_item(_es6_module, './animdata.js', 'AnimKeyFlags');
  var SplineLayerFlags=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerFlags');
  var SplineLayerSet=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerSet');
  var animspline=es6_import(_es6_module, './animspline.js');
  var ___animspline=es6_import(_es6_module, './animspline');
  for (let k in ___animspline) {
      _es6_module.add_export(k, ___animspline[k], true);
  }
  var restrictflags=animspline.restrictflags;
  var VertexAnimIter=animspline.VertexAnimIter;
  var SegmentAnimIter=animspline.SegmentAnimIter;
  var VDAnimFlags=animspline.VDAnimFlags;
  var VertexAnimData=animspline.VertexAnimData;
  class SplineFrame  {
    
     constructor(time, idgen) {
      this.time = time;
      this.flag = 0;
    }
    static  fromSTRUCT(reader) {
      var ret=new SplineFrame();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(SplineFrame);
  _es6_module.add_class(SplineFrame);
  SplineFrame = _es6_module.add_export('SplineFrame', SplineFrame);
  SplineFrame.STRUCT = `
  SplineFrame {
    time    : float;
    spline  : Spline;
    flag    : int;
  }
`;
  window.obj_values_to_array = function obj_values_to_array(obj) {
    var ret=[];
    for (var k in obj) {
        ret.push(obj[k]);
    }
    return ret;
  }
  class AllSplineIter  {
    
    
     constructor(f, sel_only) {
      this.f = f;
      this.iter = undefined;
      this.ret = {done: false, 
     value: undefined};
      this.stage = 0;
      this.sel_only = sel_only;
      this.load_iter();
    }
     load_iter() {
      this.iter = undefined;
      var f=this.f;
      if (this.stage==0) {
          var arr=new GArray();
          for (var k in f.frames) {
              var fr=f.frames[k];
              arr.push(fr.spline);
          }
          this.iter = arr[Symbol.iterator]();
      }
      else 
        if (this.stage==1) {
          var arr=[];
          for (var k in this.f.vertex_animdata) {
              if (this.sel_only) {
                  var vdata=this.f.vertex_animdata[k];
                  var v=this.f.spline.eidmap[k];
                  if (v==undefined||!(v.flag&SplineFlags.SELECT)||v.hidden) {
                      continue;
                  }
              }
              arr.push(this.f.vertex_animdata[k].spline);
          }
          this.iter = arr[Symbol.iterator]();
      }
    }
     reset() {
      this.ret = {done: false, 
     value: undefined};
      this.stage = 0;
      this.iter = undefined;
    }
     [Symbol.iterator]() {
      return this;
    }
     next() {
      if (this.iter==undefined) {
          this.ret.done = true;
          this.ret.value = undefined;
          var ret=this.ret;
          this.reset();
          return ret;
      }
      var next=this.iter.next();
      var ret=this.ret;
      ret.value = next.value;
      ret.done = next.done;
      if (next.done) {
          this.stage++;
          this.load_iter();
          if (this.iter!=undefined) {
              ret.done = false;
          }
      }
      if (ret.done) {
          this.reset();
      }
      return ret;
    }
  }
  _ESClass.register(AllSplineIter);
  _es6_module.add_class(AllSplineIter);
  class EidTimePair  {
     constructor(eid, time) {
      this.eid = eid;
      this.time = time;
    }
     load(eid, time) {
      this.eid = eid;
      this.time = time;
    }
    static  fromSTRUCT(reader) {
      var ret=new EidTimePair();
      reader(ret);
      return ret;
    }
     [Symbol.keystr]() {
      return ""+this.eid+"_"+this.time;
    }
  }
  _ESClass.register(EidTimePair);
  _es6_module.add_class(EidTimePair);
  EidTimePair.STRUCT = `
  EidTimePair {
    eid  : int;
    time : int;
  }
`;
  function combine_eid_time(eid, time) {
    return new EidTimePair(eid, time);
  }
  var split_eid_time_rets=new cachering(function () {
    return [0, 0];
  }, 64);
  function split_eid_time(t) {
    var ret=split_eid_time_rets.next();
    ret[0] = t.eid;
    ret[1] = t.time;
    return ret;
  }
  class SplineKCache  {
     constructor() {
      this.cache = {};
      this.invalid_eids = new set();
    }
     set(frame, spline) {
      for (var eid in spline.eidmap) {
          this.revalidate(eid, frame);
      }
      this.cache[frame] = spline.export_ks();
    }
     invalidate(eid, time) {
      this.invalid_eids.add(combine_eid_time(eid, time));
    }
     revalidate(eid, time) {
      var t=combine_eid_time(time);
      this.invalid_eids.remove(t);
    }
     load(frame, spline) {
      if (typeof frame=="string") {
          throw new Error("Got bad frame! "+frame);
      }
      if (!(frame in this.cache)) {
          warn("Warning, bad call to SplineKCache");
          return ;
      }
      var ret=spline.import_ks(this.cache[frame]);
      if (ret==undefined) {
          delete this.cache[frame];
          console.log("bad kcache data for frame", frame);
          for (var s of spline.segments) {
              s.v1.flag|=SplineFlags.UPDATE;
              s.v2.flag|=SplineFlags.UPDATE;
              s.h1.flag|=SplineFlags.UPDATE;
              s.h2.flag|=SplineFlags.UPDATE;
              s.flag|=SplineFlags.UPDATE;
          }
          spline.resolve = 1;
          return ;
      }
      for (var eid in spline.eidmap) {
          var t=combine_eid_time(eid, frame);
          if (!this.invalid_eids.has(t))
            continue;
          this.invalid_eids.remove(t);
          var e=spline.eidmap[eid];
          e.flag|=SplineFlags.UPDATE;
          spline.resolve = 1;
      }
    }
     _as_array() {
      var ret=[];
      for (var k in this.cache) {
          ret.push(this.cache[k]);
      }
      return ret;
    }
     _get_times() {
      var ret=[];
      for (var k in this.cache) {
          ret.push(parseFloat(""+k));
      }
      return ret;
    }
    static  fromSTRUCT(reader) {
      var ret=new SplineKCache();
      reader(ret);
      var cache={};
      var inv=new set();
      if (ret.invalid_eids!=undefined&&__instance_of(ret.invalid_eids, Array)) {
          for (var i=0; i<ret.invalid_eids.length; i++) {
              inv.add(ret.invalid_eids[i]);
          }
      }
      ret.invalid_eids = inv;
      for (var i=0; i<ret.cache.length; i++) {
          cache[ret.times[i]] = new Uint8Array(ret.cache[i]);
      }
      ret.cache = cache;
      return ret;
    }
  }
  _ESClass.register(SplineKCache);
  _es6_module.add_class(SplineKCache);
  SplineKCache = _es6_module.add_export('SplineKCache', SplineKCache);
  SplineKCache.STRUCT = `
  SplineKCache {
    cache : array(array(byte))  | obj._as_array();
    times : array(float)        | obj._get_times();
    invalid_eids : iter(EidTimePair);
  }
`;
  class SplineFrameSet extends DataBlock {
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super(DataTypes.FRAMESET);
      this.editmode = "MAIN";
      this.editveid = -1;
      this.spline = undefined;
      this.kcache = new SplineKCache();
      this.idgen = new SDIDGen();
      this.frames = {};
      this.framelist = [];
      this.vertex_animdata = {};
      this.pathspline = this.make_pathspline();
      this.templayerid = this.pathspline.layerset.active.id;
      this.selectmode = 0;
      this.draw_anim_paths = 0;
      this.time = 1;
      this.insert_frame(0);
      this.switch_on_select = true;
    }
     fix_anim_paths() {
      this.find_orphan_pathverts();
    }
    get  active_animdata() {
      if (this.spline.verts.active===undefined) {
          return undefined;
      }
      return this.get_vdata(this.spline.verts.active.eid, true);
    }
     find_orphan_pathverts() {
      var vset=new set();
      var vset2=new set();
      for (var v of this.spline.verts) {
          vset2.add(v.eid);
      }
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          if (!vset2.has(k)) {
              delete this.vertex_animdata[k];
              continue;
          }
          for (var v of vd.verts) {
              vset.add(v.eid);
          }
      }
      var totorphaned=0;
      for (var v of this.pathspline.verts) {
          if (!vset.has(v.eid)) {
              this.pathspline.kill_vertex(v);
              totorphaned++;
          }
      }
      console.log("totorphaned: ", totorphaned);
    }
     has_coincident_verts(threshold, time_threshold) {
      threshold = threshold===undefined ? 2 : threshold;
      time_threshold = time_threshold===undefined ? 0 : time_threshold;
      var ret=new set();
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          var lastv=undefined;
          var lasttime=undefined;
          for (var v of vd.verts) {
              var time=get_vtime(v);
              if (lastv!=undefined&&lastv.vectorDistance(v)<threshold&&Math.abs(time-lasttime)<=time_threshold) {
                  console.log("Coincident vert!", k, v.eid, lastv.vectorDistance(v));
                  if (v.segments.length==2)
                    ret.add(v);
                  else 
                    if (lastv.segments.length==2)
                    ret.add(lastv);
              }
              lastv = v;
              lasttime = time;
          }
      }
      return ret;
    }
     create_path_from_adjacent(v, s) {
      if (v.segments.length<2) {
          console.log("Invalid input to create_path_from_adjacent");
          return ;
      }
      var v1=s.other_vert(v), v2=v.other_segment(s).other_vert(v);
      var av1=this.get_vdata(v1.eid, false), av2=this.get_vdata(v2.eid, false);
      if (av1==undefined&&av2==undefined) {
          console.log("no animation data to interpolate");
          return ;
      }
      else 
        if (av1==undefined) {
          av1 = av2;
      }
      else 
        if (av2==undefined) {
          av2 = av1;
      }
      var av3=this.get_vdata(v.eid, true);
      var keyframes=new set();
      for (var v of av1.verts) {
          keyframes.add(get_vtime(v));
      }
      for (var v of av2.verts) {
          keyframes.add(get_vtime(v));
      }
      var co=new Vector3();
      var oflag1=av1.animflag, oflag2=av2.animflag;
      av1.animflag&=VDAnimFlags.STEP_FUNC;
      av2.animflag&=VDAnimFlags.STEP_FUNC;
      for (var time of keyframes) {
          var co1=av1.evaluate(time), co2=av2.evaluate(time);
          co.load(co1).add(co2).mulScalar(0.5);
          av3.update(co, time);
      }
      av3.animflag = oflag1|oflag2;
      av1.animflag = oflag1;
      av2.animflag = oflag2;
    }
     set_visibility(vd_eid, state) {
      console.log("set called", vd_eid, state);
      var vd=this.vertex_animdata[vd_eid];
      if (vd===undefined)
        return ;
      var layer=this.pathspline.layerset.idmap[vd.layerid];
      var drawlayer=this.pathspline.layerset.idmap[this.templayerid];
      vd.visible = !!state;
      for (var v of vd.verts) {
          if (state) {
              layer.remove(v);
              drawlayer.add(v);
              v.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              for (var i=0; i<v.segments.length; i++) {
                  layer.remove(v.segments[i]);
                  drawlayer.add(v.segments[i]);
                  v.segments[i].flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              }
          }
          else {
            drawlayer.remove(v);
            layer.add(v);
            v.flag|=SplineFlags.GHOST|SplineFlags.HIDE;
            for (var i=0; i<v.segments.length; i++) {
                drawlayer.remove(v.segments[i]);
                layer.add(v.segments[i]);
                v.segments[i].flag|=SplineFlags.GHOST|SplineFlags.HIDE;
            }
          }
      }
      this.pathspline.regen_sort();
    }
     on_destroy() {
      this.spline.on_destroy();
      this.pathspline.on_destroy();
    }
     on_spline_select(element, state) {
      if (!this.switch_on_select)
        return ;
      var vd=this.get_vdata(element.eid, false);
      if (vd==undefined)
        return ;
      var hide=!(this.selectmode&element.type);
      hide = hide||!(element.flag&SplineFlags.SELECT);
      if (element.type==SplineTypes.HANDLE) {
          hide = hide||!element.use;
      }
      var layer=this.pathspline.layerset.idmap[vd.layerid];
      var drawlayer=this.pathspline.layerset.idmap[this.templayerid];
      vd.visible = !hide;
      for (var v of vd.verts) {
          v.sethide(hide);
          for (var i=0; i<v.segments.length; i++) {
              var s=v.segments[i];
              s.sethide(hide);
              s.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              if (!hide&&!(drawlayer.id in s.layers)) {
                  layer.remove(s);
                  drawlayer.add(s);
              }
              else 
                if (hide&&(drawlayer.id in s.layers)) {
                  drawlayer.remove(s);
                  layer.add(s);
              }
          }
          v.flag&=~SplineFlags.GHOST;
          if (hide) {
              drawlayer.remove(v);
              layer.add(v);
          }
          else {
            layer.remove(v);
            drawlayer.add(v);
          }
      }
      if (state)
        vd.flag|=SplineFlags.SELECT;
      else 
        vd.flag&=~SplineFlags.SELECT;
      this.pathspline.regen_sort();
    }
    get  _allsplines() {
      return new AllSplineIter(this);
    }
    get  _selected_splines() {
      return new AllSplineIter(this, true);
    }
     sync_vdata_selstate(ctx) {
      for (let k in this.vertex_animdata) {
          let vd=this.vertex_animdata[k];
          if (!vd) {
              continue;
          }
          vd.animflag&=~VDAnimFlags.OWNER_IS_EDITABLE;
      }
      for (let i=0; i<2; i++) {
          let list=i ? this.spline.handles : this.spline.verts;
          for (let v of list.selected.editable(ctx)) {
              let vd=this.vertex_animdata[v.eid];
              if (!vd) {
                  continue;
              }
              vd.animflag|=VDAnimFlags.OWNER_IS_EDITABLE;
          }
      }
    }
     update_visibility() {
      console.log("update_visibility called");
      if (!this.switch_on_select)
        return ;
      var selectmode=this.selectmode, show_paths=this.draw_anim_paths;
      var drawlayer=this.pathspline.layerset.idmap[this.templayerid];
      if (drawlayer===undefined) {
          console.log("this.templayerid corruption", this.templayerid);
          this.templayerid = this.pathspline.layerset.new_layer().id;
          drawlayer = this.pathspline.layerset.idmap[this.templayerid];
      }
      for (var v of this.pathspline.verts) {
          if (!v.has_layer()) {
              drawlayer.add(v);
          }
          v.sethide(true);
      }
      for (var h of this.pathspline.handles) {
          if (!h.has_layer()) {
              drawlayer.add(h);
          }
          h.sethide(true);
      }
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          var v=this.spline.eidmap[k];
          if (v===undefined) {
              continue;
          }
          var hide=!(vd.eid in this.spline.eidmap)||!(v.flag&SplineFlags.SELECT);
          hide = hide||!(v.type&selectmode)||!show_paths;
          vd.visible = !hide;
          if (!hide) {
          }
          for (var v2 of vd.verts) {
              if (!hide) {
                  v2.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              }
              else {
                v2.flag|=SplineFlags.GHOST|SplineFlags.HIDE;
              }
              v2.sethide(hide);
              if (!hide) {
                  drawlayer.add(v2);
              }
              else {
                drawlayer.remove(v2);
              }
              for (var s of v2.segments) {
                  s.sethide(hide);
                  if (!hide) {
                      s.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
                      drawlayer.add(s);
                  }
                  else {
                    s.flag|=SplineFlags.GHOST|SplineFlags.HIDE;
                    drawlayer.remove(s);
                  }
              }
          }
      }
      this.pathspline.regen_sort();
    }
     on_ctx_update(ctx) {
      console.trace("on_ctx_update");
      if (ctx.spline===this.spline) {
      }
      else 
        if (ctx.spline===this.pathspline) {
          var resolve=0;
          for (var v of this.spline.points) {
              if (v.eid in this.vertex_animdata) {
                  var vdata=this.get_vdata(v.eid, false);
                  v.load(vdata.evaluate(this.time));
                  v.flag&=~SplineFlags.FRAME_DIRTY;
                  v.flag|=SplineFlags.UPDATE;
                  resolve = 1;
              }
          }
          this.spline.resolve = resolve;
      }
    }
     download() {
      console.trace("downloading. . .");
      var resolve=0;
      for (var v of this.spline.points) {
          if (v.eid in this.vertex_animdata) {
              var vdata=this.get_vdata(v.eid, false);
              v.load(vdata.evaluate(this.time));
              v.flag&=~SplineFlags.FRAME_DIRTY;
              v.flag|=SplineFlags.UPDATE;
              resolve = 1;
          }
      }
      this.spline.resolve = resolve;
    }
     update_frame(force_update) {
      this.check_vdata_integrity();
      var time=this.time;
      var spline=this.spline;
      if (spline===undefined)
        return ;
      if (spline.resolve)
        spline.solve();
      this.kcache.set(time, spline);
      var is_first=time<=1;
      var found=false;
      for (var v of spline.points) {
          if (!(v.eid in spline.eidmap)) {
              found = true;
          }
          var dofirst=is_first&&!(v.eid in this.vertex_animdata);
          if (!(force_update||dofirst||(v.flag&SplineFlags.FRAME_DIRTY)))
            continue;
          var vdata=this.get_vdata(v.eid);
          vdata.update(v, time);
          v.flag&=~SplineFlags.FRAME_DIRTY;
      }
      if (!found)
        return ;
      this.insert_frame(this.time);
      this.update_visibility();
    }
     insert_frame(time) {
      this.check_vdata_integrity();
      if (this.frame!=undefined)
        return this.frame;
      var frame=this.frame = new SplineFrame();
      var spline=this.spline==undefined ? new Spline() : this.spline.copy();
      spline.verts.select_listeners.addListener(this.on_spline_select, this);
      spline.handles.select_listeners.addListener(this.on_spline_select, this);
      spline.idgen = this.idgen;
      frame.spline = spline;
      frame.time = time;
      this.frames[time] = frame;
      if (this.spline==undefined) {
          this.spline = frame.spline;
          this.frame = frame;
      }
      return frame;
    }
     find_frame(time, off) {
      off = off===undefined ? 0 : off;
      var flist=this.framelist;
      for (var i=0; i<flist.length-1; i++) {
          if (flist[i]<=time&&flist[i+1]>time) {
              break;
          }
      }
      if (i==flist.length)
        return frames[i-1];
      return frames[i];
    }
     change_time(time, _update_animation=true) {
      if (!window.inFromStruct&&_update_animation) {
          this.update_frame();
      }
      var f=this.frames[0];
      for (var v of this.spline.points) {
          var vd=this.get_vdata(v.eid, false);
          if (vd===undefined)
            continue;
          if (v.flag&SplineFlags.SELECT)
            vd.flag|=SplineFlags.SELECT;
          else 
            vd.flag&=~SplineFlags.SELECT;
          if (v.flag&SplineFlags.HIDE)
            vd.flag|=SplineFlags.HIDE;
          else 
            vd.flag&=~SplineFlags.HIDE;
      }
      if (f===undefined) {
          f = this.insert_frame(time);
      }
      var spline=f.spline;
      if (!window.inFromStruct&&_update_animation) {
          var set_update=true;
          if (time in this.kcache.cache) {
              console.log("found cached k data!");
              this.kcache.load(time, spline);
              set_update = false;
          }
          if (!set_update) {
              for (var seg of spline.segments) {
                  if (seg.hidden)
                    continue;
                  seg.flag|=SplineFlags.REDRAW;
              }
              for (var face of spline.faces) {
                  if (face.hidden)
                    continue;
                  face.flag|=SplineFlags.REDRAW;
              }
          }
          for (var v of spline.points) {
              var set_flag=v.eid in this.vertex_animdata;
              var vdata=this.get_vdata(v.eid, false);
              if (vdata===undefined)
                continue;
              if (set_flag) {
                  spline.setselect(v, vdata.flag&SplineFlags.SELECT);
                  if (vdata.flag&SplineFlags.HIDE)
                    v.flag|=SplineFlags.HIDE;
                  else 
                    v.flag&=~SplineFlags.HIDE;
              }
              v.load(vdata.evaluate(time));
              if (set_update) {
                  v.flag|=SplineFlags.UPDATE;
              }
              else {
              }
          }
          spline.resolve = 1;
          if (!window.inFromStruct)
            spline.solve();
      }
      for (var s of spline.segments) {
          if (s.hidden)
            continue;
          s.flag|=SplineFlags.UPDATE_AABB;
      }
      for (var f of spline.segments) {
          if (f.hidden)
            continue;
          f.flag|=SplineFlags.UPDATE_AABB;
      }
      this.spline = spline;
      this.time = time;
      this.frame = f;
      this.update_visibility();
    }
     delete_vdata() {
      this.vertex_animdata = {};
    }
     get_vdata(eid, auto_create=true) {
      if (typeof eid!="number") {
          throw new Error("Expected a number for eid");
      }
      if (auto_create&&!(eid in this.vertex_animdata)) {
          this.vertex_animdata[eid] = new VertexAnimData(eid, this.pathspline);
      }
      return this.vertex_animdata[eid];
    }
     check_vdata_integrity(veid) {
      var spline=this.pathspline;
      var found=false;
      if (veid===undefined) {
          for (var k in this.vertex_animdata) {
              var vd=this.vertex_animdata[k];
              found|=vd.check_time_integrity();
          }
      }
      else {
        var vd=this.vertex_animdata[veid];
        if (vd===undefined) {
            console.log("Error: vertex ", veid, "not in frameset");
            return false;
        }
        found = vd.check_time_integrity();
      }
      if (found) {
          this.rationalize_vdata_layers();
          this.update_visibility();
          this.pathspline.regen_solve();
      }
      return found;
    }
     rationalize_vdata_layers() {
      var spline=this.pathspline;
      spline.layerset = new SplineLayerSet();
      var templayer=spline.layerset.new_layer();
      this.templayerid = templayer.id;
      spline.layerset.active = templayer;
      for (var i=0; i<spline.elists.length; i++) {
          var list=spline.elists[i];
          list.layerset = spline.layerset;
          for (var e of list) {
              e.layers = {};
          }
      }
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          var vlayer=spline.layerset.new_layer();
          vlayer.flag|=SplineLayerFlags.HIDE;
          vd.layerid = vlayer.id;
          for (var v of vd.verts) {
              for (var i=0; i<v.segments.length; i++) {
                  vlayer.add(v.segments[i]);
              }
              vlayer.add(v);
          }
      }
    }
     draw(ctx, g, editor, matrix, redraw_rects, ignore_layers) {
      var size=editor.size, pos=editor.pos;
      this.draw_anim_paths = editor.draw_anim_paths;
      this.selectmode = editor.selectmode;
      g.save();
      let dpi=window.devicePixelRatio;
      this.spline.draw(redraw_rects, g, editor, matrix, editor.selectmode, editor.only_render, editor.draw_normals, this.spline===ctx.spline ? 1.0 : 0.3, undefined, undefined, ignore_layers);
      g.restore();
    }
     loadSTRUCT(reader) {
      window.inFromStruct = true;
      reader(this);
      super.loadSTRUCT(reader);
      this.kcache = new SplineKCache();
      if (this.kcache===undefined) {
          this.kcache = new SplineKCache();
      }
      this.afterSTRUCT();
      if (this.pathspline==undefined) {
          this.pathspline = this.make_pathspline();
      }
      for (v of this.pathspline.verts) {

      }
      for (var h of this.pathspline.handles) {

      }
      for (var vd of this.vertex_animdata) {
          vd.spline = this.pathspline;
          if (vd.layerid==undefined) {
              var layer=this.pathspline.layerset.new_layer();
              layer.flag|=SplineLayerFlags.HIDE;
              vd.layerid = layer.id;
              if (vd.startv_eid!=undefined) {
                  var v=this.pathspline.eidmap[vd.startv_eid];
                  var s=v.segments[0];
                  v.layers = {};
                  v.layers[vd.layerid] = 1;
                  var _c1=0;
                  while (v.segments.length>0) {
                    v.layers = {};
                    v.layers[vd.layerid] = 1;
                    s.layers = {};
                    s.layers[vd.layerid] = 1;
                    v = s.other_vert(v);
                    if (v.segments.length<2) {
                        v.layers = {};
                        v.layers[vd.layerid] = 1;
                        break;
                    }
                    if (_c1++>100000) {
                        console.log("Infinite loop detected!");
                        break;
                    }
                    s = v.other_segment(s);
                    s.layers = {};
                    s.layers[vd.layerid] = 1;
                    if (v==vd.startv)
                      break;
                  }
              }
          }
      }
      this.pathspline.is_anim_path = true;
      if (this.templayerid==undefined)
        this.templayerid = this.pathspline.layerset.new_layer().id;
      var frames={};
      var vert_animdata={};
      var max_cur=this.idgen.cur_id;
      var firstframe=undefined;
      for (var i=0; i<this.frames.length; i++) {
          max_cur = Math.max(this.frames[i].spline.idgen.cur_id, max_cur);
          if (i==0)
            firstframe = this.frames[i];
          this.frames[i].spline.idgen = this.idgen;
          frames[this.frames[i].time] = this.frames[i];
      }
      this.idgen.max_cur(max_cur);
      for (var i=0; i<this.vertex_animdata.length; i++) {
          vert_animdata[this.vertex_animdata[i].eid] = this.vertex_animdata[i];
      }
      for (let k in vert_animdata) {
          let vd=vert_animdata[k];
          for (let v of vd.verts) {
              vd._get_animdata(v).owning_veid = vd.eid;
          }
      }
      this.frames = frames;
      this.pathspline.regen_sort();
      var fk=this.cur_frame||0;
      delete this.cur_frame;
      if (fk==undefined) {
          this.frame = firstframe;
          this.spline = firstframe.spline;
      }
      else {
        this.frame = this.frames[fk];
        this.spline = this.frames[fk].spline;
      }
      this.vertex_animdata = vert_animdata;
      if (this.framelist.length==0) {
          for (var k in this.frames) {
              this.framelist.push(parseFloat(k));
          }
      }
      for (k in this.frames) {
          this.frames[k].spline.verts.select_listeners.addListener(this.on_spline_select, this);
          this.frames[k].spline.handles.select_listeners.addListener(this.on_spline_select, this);
      }
      this.spline.fix_spline();
      this.rationalize_vdata_layers();
      this.update_visibility();
      window.inFromStruct = false;
    }
     make_pathspline() {
      var spline=new Spline();
      spline.is_anim_path = true;
      spline.restrict = restrictflags;
      spline.verts.cdata.add_layer(TimeDataLayer, "time data");
      return spline;
    }
  }
  _ESClass.register(SplineFrameSet);
  _es6_module.add_class(SplineFrameSet);
  SplineFrameSet = _es6_module.add_export('SplineFrameSet', SplineFrameSet);
  
  SplineFrameSet.STRUCT = STRUCT.inherit(SplineFrameSet, DataBlock)+`
    idgen             : SDIDGen;
    frames            : array(SplineFrame) | obj_values_to_array(obj.frames);
    vertex_animdata   : array(VertexAnimData) | obj_values_to_array(obj.vertex_animdata);
    
    cur_frame         : float | obj.frame.time;
    editmode          : string;
    editveid          : int;
    
    time              : float;
    framelist         : array(float);
    pathspline        : Spline;
    
    selectmode        : int;
    draw_anim_paths   : int;
    templayerid       : int;
}
`;
}, '/dev/fairmotion/src/core/frameset.js');
es6_module_define('ops_editor', ["../../core/struct.js", "../../path.ux/scripts/screen/ScreenArea.js", "../editor_base.js", "../../path.ux/scripts/core/ui_base.js"], function _ops_editor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  class OpStackEditor extends Editor {
    static  define() {
      return {tagname: "opstack-editor-x", 
     areaname: "opstack_editor", 
     uiname: "Operator Stack", 
     hidden: true}
    }
     copy() {
      return document.createElement("opstack-editor-x");
    }
  }
  _ESClass.register(OpStackEditor);
  _es6_module.add_class(OpStackEditor);
  OpStackEditor = _es6_module.add_export('OpStackEditor', OpStackEditor);
  OpStackEditor.STRUCT = STRUCT.inherit(OpStackEditor, Area)+`
}
`;
  Editor.register(OpStackEditor);
}, '/dev/fairmotion/src/editors/ops/ops_editor.js');
es6_module_define('SettingsEditor', ["../../path.ux/scripts/core/ui_theme.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../path.ux/scripts/core/ui.js", "../editor_base.js", "../../core/struct.js", "../../path.ux/scripts/core/ui_base.js"], function _SettingsEditor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var theme=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'theme');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var Container=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui.js', 'Container');
  var color2css=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_theme.js', 'color2css');
  var css2color=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_theme.js', 'css2color');
  var CSSFont=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_theme.js', 'CSSFont');
  let basic_colors={'white': [1, 1, 1], 
   'grey': [0.5, 0.5, 0.5], 
   'gray': [0.5, 0.5, 0.5], 
   'black': [0, 0, 0], 
   'red': [1, 0, 0], 
   'yellow': [1, 1, 0], 
   'green': [0, 1, 0], 
   'teal': [0, 1, 1], 
   'cyan': [0, 1, 1], 
   'blue': [0, 0, 1], 
   'orange': [1, 0.5, 0.25], 
   'brown': [0.5, 0.4, 0.3], 
   'purple': [1, 0, 1], 
   'pink': [1, 0.5, 0.5]}
  class ThemeEditor extends Container {
     constructor() {
      super();
    }
     init() {
      super.init();
      this.build();
    }
     doFolder(key, obj) {
      let panel=this.panel(key);
      panel.closed = true;
      panel.style["margin-left"] = "15px";
      let row=panel.row();
      let col1=row.col();
      let col2=row.col();
      let do_onchange=(key, k) =>        {
        if (this.onchange) {
            this.onchange(key, k);
        }
      };
      let ok=false;
      let _i=0;
      let dokey=(k, v) =>        {
        let col=_i%2==0 ? col1 : col2;
        if (k.toLowerCase().search("flag")>=0) {
            return ;
        }
        if (typeof v==="string") {
            let v2=v.toLowerCase().trim();
            let iscolor=v2 in basic_colors;
            iscolor = iscolor||v2.search("rgb")>=0;
            iscolor = iscolor||v2[0]==="#";
            if (iscolor) {
                let cw=col.colorbutton();
                ok = true;
                _i++;
                try {
                  cw.setRGBA(css2color(v2));
                }
                catch (error) {
                    console.warn("Failed to set color "+k, v2);
                }
                cw.onchange = () =>                  {
                  console.log("setting '"+k+"' to "+color2css(cw.rgba), key);
                  theme[key][k] = color2css(cw.rgba);
                  do_onchange(key, k);
                };
                cw.label = k;
            }
        }
        else 
          if (typeof v==="number") {
            let slider=col.slider(undefined, k, v, 0, 256, 0.01, false);
            ok = true;
            _i++;
            slider.onchange = () =>              {
              theme[key][k] = slider.value;
              do_onchange(key, k);
            };
        }
        else 
          if (typeof v==="object"&&__instance_of(v, CSSFont)) {
            let panel2=col.panel(k);
            ok = true;
            _i++;
            let textbox=(key) =>              {
              panel2.label(key);
              panel2.textbox(undefined, v[key]).onchange = function () {
                v[key] = this.text;
                do_onchange(key, k);
              }
            };
            textbox("font");
            textbox("variant");
            textbox("weight");
            textbox("style");
            let cw=panel2.colorbutton();
            cw.label = "color";
            cw.setRGBA(css2color(v));
            cw.onchange = () =>              {
              v.color = color2css(v.color);
            };
            let slider=panel2.slider(undefined, "size", v.size);
            slider.onchange = () =>              {
              v.size = slider.value;
              do_onchange(key, k);
            };
        }
      };
      for (let k in obj) {
          let v=obj[k];
          dokey(k, v);
      }
      if (!ok) {
          panel.remove();
      }
    }
     build() {
      let keys=Object.keys(theme);
      keys.sort();
      for (let k of keys) {
          let v=theme[k];
          if (typeof v==="object") {
              this.doFolder(k, v);
          }
      }
    }
    static  define() {
      return {tagname: "theme-editor-2-x", 
     style: "theme-editor"}
    }
  }
  _ESClass.register(ThemeEditor);
  _es6_module.add_class(ThemeEditor);
  ThemeEditor = _es6_module.add_export('ThemeEditor', ThemeEditor);
  UIBase.register(ThemeEditor);
  class SettingsEditor extends Editor {
     constructor() {
      super();
    }
     init() {
      super.init();
      let col=this.container.col();
      let tabs=col.tabs("left");
      let tab;
      tab = tabs.tab("General");
      let panel=tab.panel("Units");
      panel.prop("settings.unit_scheme");
      panel.prop("settings.default_unit");
      tab = tabs.tab("Theme");
      this.style["overflow-y"] = "scroll";
      let th=document.createElement("theme-editor-x");
      th.onchange = () =>        {
        console.log("settings change");
        g_app_state.settings.save();
      };
      let row=tab.row();
      row.button("Reload Defaults", () =>        {
        g_app_state.settings.reloadDefaultTheme();
        g_app_state.settings.save();
        th.remove();
        th = document.createElement("theme-editor-x");
        tab.add(th);
      });
      tab.add(th);
      window.th = th;
    }
    static  define() {
      return {tagname: "settings-editor-x", 
     areaname: "settings_editor", 
     uiname: "Settings", 
     icon: Icons.SETTINGS_EDITOR}
    }
     copy() {
      return document.createElement("settings-editor-x");
    }
  }
  _ESClass.register(SettingsEditor);
  _es6_module.add_class(SettingsEditor);
  SettingsEditor = _es6_module.add_export('SettingsEditor', SettingsEditor);
  SettingsEditor.STRUCT = STRUCT.inherit(SettingsEditor, Area)+`
}
`;
  Editor.register(SettingsEditor);
}, '/dev/fairmotion/src/editors/settings/SettingsEditor.js');
var ContextStruct;
es6_module_define('data_api_define', ["../lib_api.js", "../../editors/viewport/view2d.js", "../../curve/spline_element_array.js", "../../editors/viewport/spline_createops.js", "../UserSettings.js", "../../editors/viewport/selectmode.js", "../../editors/ops/ops_editor.js", "../toolprops.js", "../../datafiles/theme.js", "../toolops_api.js", "../animdata.js", "../../curve/spline_base.js", "../imageblock.js", "../units.js", "./data_api.js", "../frameset.js"], function _data_api_define_module(_es6_module) {
  var DataTypes=es6_import_item(_es6_module, '../lib_api.js', 'DataTypes');
  var EditModes=es6_import_item(_es6_module, '../../editors/viewport/view2d.js', 'EditModes');
  var ImageFlags=es6_import_item(_es6_module, '../imageblock.js', 'ImageFlags');
  var Image=es6_import_item(_es6_module, '../imageblock.js', 'Image');
  var AppSettings=es6_import_item(_es6_module, '../UserSettings.js', 'AppSettings');
  var BoxColor4=es6_import_item(_es6_module, '../../datafiles/theme.js', 'BoxColor4');
  var BoxWColor=es6_import_item(_es6_module, '../../datafiles/theme.js', 'BoxWColor');
  var ColorTheme=es6_import_item(_es6_module, '../../datafiles/theme.js', 'ColorTheme');
  var ThemePair=es6_import_item(_es6_module, '../../datafiles/theme.js', 'ThemePair');
  var BoxColor=es6_import_item(_es6_module, '../../datafiles/theme.js', 'BoxColor');
  var darken=es6_import_item(_es6_module, '../../datafiles/theme.js', 'darken');
  var EnumProperty=es6_import_item(_es6_module, '../toolprops.js', 'EnumProperty');
  var FlagProperty=es6_import_item(_es6_module, '../toolprops.js', 'FlagProperty');
  var FloatProperty=es6_import_item(_es6_module, '../toolprops.js', 'FloatProperty');
  var StringProperty=es6_import_item(_es6_module, '../toolprops.js', 'StringProperty');
  var BoolProperty=es6_import_item(_es6_module, '../toolprops.js', 'BoolProperty');
  var Vec2Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec2Property');
  var DataRefProperty=es6_import_item(_es6_module, '../toolprops.js', 'DataRefProperty');
  var Vec3Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec4Property');
  var IntProperty=es6_import_item(_es6_module, '../toolprops.js', 'IntProperty');
  var TPropFlags=es6_import_item(_es6_module, '../toolprops.js', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropTypes');
  var PropSubTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropSubTypes');
  var ModalStates=es6_import_item(_es6_module, '../toolops_api.js', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineFlags');
  var MaterialFlags=es6_import_item(_es6_module, '../../curve/spline_base.js', 'MaterialFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineTypes');
  var SelMask=es6_import_item(_es6_module, '../../editors/viewport/selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, '../../editors/viewport/selectmode.js', 'ToolModes');
  var Unit=es6_import_item(_es6_module, '../units.js', 'Unit');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var DataFlags=es6_import_item(_es6_module, './data_api.js', 'DataFlags');
  var DataPathTypes=es6_import_item(_es6_module, './data_api.js', 'DataPathTypes');
  var OpStackEditor=es6_import_item(_es6_module, '../../editors/ops/ops_editor.js', 'OpStackEditor');
  var AnimKeyFlags=es6_import_item(_es6_module, '../animdata.js', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, '../animdata.js', 'AnimInterpModes');
  var VDAnimFlags=es6_import_item(_es6_module, '../frameset.js', 'VDAnimFlags');
  var SelModes={VERTEX: SelMask.VERTEX, 
   SEGMENT: SelMask.SEGMENT, 
   FACE: SelMask.FACE, 
   OBJECT: SelMask.OBJECT}
  var selmask_enum=new EnumProperty(undefined, SelModes, "selmask_enum", "Selection Mode");
  selmask_enum = _es6_module.add_export('selmask_enum', selmask_enum);
  var selmask_ui_vals={}
  for (var k in SelModes) {
      var s=k[0].toUpperCase()+k.slice(1, k.length).toLowerCase();
      var slst=s.split("_");
      var s2="";
      for (var i=0; i<slst.length; i++) {
          s2+=slst[i][0].toUpperCase()+slst[i].slice(1, slst[i].length).toLowerCase()+" ";
      }
      s = s2.trim();
      selmask_ui_vals[k] = s;
  }
  selmask_enum.flag|=TPropFlags.USE_CUSTOM_GETSET|TPropFlags.NEEDS_OWNING_OBJECT;
  selmask_enum.ui_value_names = selmask_ui_vals;
  selmask_enum.add_icons({VERTEX: Icons.VERT_MODE, 
   SEGMENT: Icons.EDGE_MODE, 
   FACE: Icons.FACE_MODE, 
   OBJECT: Icons.OBJECT_MODE});
  selmask_enum.userGetData = function (prop, val, val2) {
    return this.selectmode&(~SelMask.HANDLE);
  }
  selmask_enum.userSetData = function (prop, val) {
    console.log("selmask_enum.userSetData", this, prop, val);
    this.selectmode = val|(this.selectmode&SelMask.HANDLE);
    return this.selectmode;
  }
  var data_api=es6_import(_es6_module, './data_api.js');
  var DataPath=data_api.DataPath;
  var DataStruct=data_api.DataStruct;
  var DataStructArray=data_api.DataStructArray;
  var units=Unit.units;
  var unit_enum={}
  var unit_ui_vals={}
  for (var i=0; i<units.length; i++) {
      var s=units[i].suffix_list[0];
      unit_enum[s] = s;
      unit_ui_vals[s] = s;
  }
  Unit.units_enum = new EnumProperty("in", unit_enum, "unit_enum", "Units");
  Unit.units_enum.ui_value_names = unit_ui_vals;
  var SettingsUpdate=function () {
    g_app_state.session.settings.save();
  }
  var SettingsUpdateRecalc=function () {
    g_app_state.session.settings.save();
  }
  var SettingsStruct=undefined;
  function api_define_settings() {
    unitsys_enum = new EnumProperty("imperial", ["imperial", "metric"], "system", "System", "Metric or Imperial");
    var units_enum=Unit.units_enum.copy();
    units_enum.apiname = "default_unit";
    units_enum.uiname = "Default Unit";
    units_enum.update = unitsys_enum.update = SettingsUpdateRecalc;
    SettingsStruct = new DataStruct([new DataPath(unitsys_enum, "unit_system", "unit_scheme", true), new DataPath(units_enum, "default_unit", "unit", true)], AppSettings);
    return SettingsStruct;
  }
  var SettingsEditorStruct=undefined;
  function api_define_seditor() {
    SettingsEditorStruct = new DataStruct([]);
    return SettingsEditorStruct;
  }
  var OpsEditorStruct=undefined;
  function api_define_opseditor() {
    var filter_sel=new BoolProperty(0, "filter_sel", "Filter Sel", "Exclude selection ops");
    filter_sel.icon = Icons.FILTER_SEL_OPS;
    OpsEditorStruct = new DataStruct([new DataPath(filter_sel, "filter_sel", "filter_sel", true)]);
    return OpsEditorStruct;
  }
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var AnimKeyStruct=undefined;
  function api_define_animkey() {
    if (AnimKeyStruct!=undefined)
      return AnimKeyStruct;
    AnimKeyStruct = new DataStruct([new DataPath(new IntProperty(-1, "id", "id"), "id", "id", true)]);
    return AnimKeyStruct;
  }
  api_define_animkey();
  window.AnimKeyStruct = AnimKeyStruct;
  window.AnimKeyStruct2 = AnimKeyStruct;
  var datablock_structs={}
  var spline_flagprop=new FlagProperty(2, SplineFlags, undefined, "Flags", "Flags");
  spline_flagprop["BREAK_CURVATURES"] = "Less Smooth";
  spline_flagprop.descriptions["BREAK_CURVATURES"] = "Allows curve to more tightly bend at this point";
  spline_flagprop.ui_key_names["BREAK_TANGENTS"] = "Sharp Corner";
  spline_flagprop.addIcons({BREAK_TANGENTS: Icons.EXTRUDE_MODE_G0, 
   BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1});
  function api_define_DataBlock() {
    api_define_animkey();
    var array=new DataStructArray(function getstruct(item) {
      return AnimKeyStruct2;
    }, function itempath(key) {
      return "["+key+"]";
    }, function getitem(key) {
      console.log("get key", key, this);
      return this[key];
    }, function getiter() {
      return new obj_value_iter(this);
    }, function getkeyiter() {
      return new obj_key_iter(this);
    }, function getlength() {
      var tot=0.0;
      for (var k in this) {
          tot++;
      }
      return tot;
    });
    return [new DataPath(array, "animkeys", "lib_anim_idmap", true)];
  }
  var ImageUserStruct=undefined;
  function api_define_imageuser() {
    var image=new DataRefProperty(undefined, [DataTypes.IMAGE], "image", "Image");
    var off=new Vec2Property(undefined, "offset", "Offset");
    var scale=new Vec2Property(undefined, "scale", "Scale");
    scale.range = [0.0001, 90.0];
    off.api_update = scale.api_update = function api_update(ctx, path) {
      window.redraw_viewport();
    }
    ImageUserStruct = new DataStruct([new DataPath(image, "image", "image", true), new DataPath(off, "off", "off", true), new DataPath(scale, "scale", "scale", true)]);
    return ImageUserStruct;
  }
  function api_define_view2d() {
    var only_render=new BoolProperty(0, "only_render", "Hide Controls", "Hide Controls");
    only_render.api_update = function (ctx, path) {
      window.redraw_viewport();
    }
    only_render.icon = Icons.ONLY_RENDER;
    var draw_small_verts=new BoolProperty(0, "draw_small_verts", "Small Points", "Small Control Points");
    draw_small_verts.api_update = function (ctx, path) {
      window.redraw_viewport();
    }
    draw_small_verts.icon = Icons.DRAW_SMALL_VERTS;
    var extrude_mode=new EnumProperty(0, ExtrudeModes, "extrude_mode", "New Line Mode", "New Line Mode");
    extrude_mode.add_icons({SMOOTH: Icons.EXTRUDE_MODE_G2, 
    LESS_SMOOTH: Icons.EXTRUDE_MODE_G1, 
    BROKEN: Icons.EXTRUDE_MODE_G0});
    for (let k in ExtrudeModes) {
        extrude_mode.descriptions[k] = extrude_mode.description;
    }
    var linewidth=new FloatProperty(2.0, "default_linewidth", "Line Wid");
    linewidth.range = [0.01, 100];
    var zoomprop=new FloatProperty(1, "zoom", "Zoom");
    zoomprop.update = function (ctx, path) {
      this.ctx.view2d.set_zoom(this.data);
    }
    zoomprop.range = zoomprop.real_range = zoomprop.ui_range = [0.1, 100];
    zoomprop.expRate = 1.2;
    zoomprop.step = 0.1;
    zoomprop.decimalPlaces = 3;
    var draw_bg_image=new BoolProperty(0, "draw_bg_image", "Draw Image");
    var draw_video=new BoolProperty(0, "draw_video", "Draw Video");
    draw_video.update = draw_bg_image.update = function () {
      window.redraw_viewport();
    }
    var tool_mode=new EnumProperty("SELECT", ToolModes, "select", "Active Tool", "Active Tool");
    tool_mode.add_icons({SELECT: Icons.CURSOR_ARROW, 
    APPEND: Icons.APPEND_VERTEX, 
    RESIZE: Icons.RESIZE, 
    ROTATE: Icons.ROTATE});
    var tweak_mode=new BoolProperty(0, "tweak_mode", "Tweak Mode");
    tweak_mode.icon = Icons.CURSOR_ARROW;
    var uinames={}
    for (var key in SelMask) {
        var k2=key[0].toUpperCase()+key.slice(1, key.length).toLowerCase();
        k2 = k2.replace(/\_/g, " ");
        uinames[key] = "Show "+k2+"s";
    }
    var selmask_mask=new FlagProperty(1, SelMask, uinames, undefined, "Sel Mask");
    selmask_mask.addIcons({VERTEX: Icons.VERT_MODE, 
    HANDLE: Icons.SHOW_HANDLES, 
    SEGMENT: Icons.EDGE_MODE, 
    FACE: Icons.FACE_MODE, 
    OBJECT: Icons.OBJECT_MODE});
    selmask_mask.ui_key_names = uinames;
    selmask_mask.update = function () {
      window.redraw_viewport();
    }
    var background_color=new Vec3Property(undefined, "background_color", "Background");
    background_color.subtype = PropSubTypes.COLOR;
    var default_stroke=new Vec4Property(undefined, "default_stroke", "Stroke");
    var default_fill=new Vec4Property(undefined, "default_fill", "Fill");
    default_stroke.subtype = default_fill.subtype = PropSubTypes.COLOR;
    background_color.update = function () {
      window.redraw_viewport();
    }
    let draw_faces=new BoolProperty(0, "draw_faces", "Show Faces");
    draw_faces.icon = Icons.MAKE_POLYGON;
    let enable_blur=new BoolProperty(0, "enable_blur", "Blur");
    enable_blur.icon = Icons.ENABLE_BLUR;
    draw_faces.update = enable_blur.update = function () {
      this.ctx.spline.regen_sort();
      redraw_viewport();
    }
    let edit_all_layers=new BoolProperty(0, "edit_all_layers", "Edit All Layers");
    let show_animpath_prop=new BoolProperty(0, "draw_anim_paths", "Show Animation Paths", "Edit Animation Keyframe Paths");
    show_animpath_prop.icon = Icons.SHOW_ANIMPATHS;
    let draw_normals=new BoolProperty(0, "draw_normals", "Show Normals", "Show Normal Comb");
    draw_normals.icon = Icons.DRAW_NORMALS;
    draw_normals.update = edit_all_layers.update = function () {
      redraw_viewport();
    }
    window.View2DStruct = new DataStruct([new DataPath(edit_all_layers, "edit_all_layers", "edit_all_layers", true), new DataPath(background_color, "background_color", "background_color", true), new DataPath(default_stroke, "default_stroke", "default_stroke", true), new DataPath(default_fill, "default_fill", "default_fill", true), new DataPath(tool_mode, "toolmode", "toolmode", true), new DataPath(draw_small_verts, "draw_small_verts", "draw_small_verts", true), new DataPath(selmask_enum.copy(), "selectmode", "selectmode", true), new DataPath(selmask_mask.copy(), "selectmask", "selectmode", true), new DataPath(only_render, "only_render", "only_render", true), new DataPath(draw_bg_image, "draw_bg_image", "draw_bg_image", true), new DataPath(tweak_mode, "tweak_mode", "tweak_mode", true), new DataPath(enable_blur, "enable_blur", "enable_blur", true), new DataPath(draw_faces, "draw_faces", "draw_faces", true), new DataPath(draw_video, "draw_video", "draw_video", true), new DataPath(draw_normals, "draw_normals", "draw_normals", true), new DataPath(show_animpath_prop, "draw_anim_paths", "draw_anim_paths", true), new DataPath(zoomprop, "zoom", "zoom", true), new DataPath(api_define_material(), "active_material", "active_material", true), new DataPath(linewidth, "default_linewidth", "default_linewidth", true), new DataPath(extrude_mode, "extrude_mode", "extrude_mode", true), new DataPath(new BoolProperty(0, "pin_paths", "Pin Paths", "Remember visible animation paths"), "pin_paths", "pin_paths", true), new DataPath(api_define_imageuser(), "background_image", "background_image", true)]);
    return View2DStruct;
  }
  var MaterialStruct;
  function api_define_material() {
    var fillclr=new Vec4Property(new Vector4(), "fill", "fill", "Fill Color");
    var strokeclr=new Vec4Property(new Vector4(), "stroke", "stroke", "Stroke Color");
    var update_base=function (material) {
      material.update();
      window.redraw_viewport();
    }
    var flag=new FlagProperty(1, MaterialFlags, undefined, "material flags", "material flags");
    flag.update = update_base;
    var fillpath=new DataPath(new BoolProperty(false, "fill_over_stroke", "fill_over_stroke", "fill_over_stroke"), "fill_over_stroke", "fill_over_stroke", true);
    fillclr.subtype = strokeclr.subtype = PropSubTypes.COLOR;
    var linewidth=new FloatProperty(1, "linewidth", "linewidth", "Line Width");
    linewidth.range = [0.1, 200];
    fillclr.update = strokeclr.update = linewidth.update = blur.update = update_base;
    MaterialStruct = new DataStruct([new DataPath(fillclr, "fillcolor", "fillcolor", true), new DataPath(linewidth, "linewidth", "linewidth", true), new DataPath(flag, "flag", "flag", true)]);
    MaterialStruct.Color4("strokecolor", "strokecolor", "Stroke", "Stroke color").OnUpdate(update_base);
    MaterialStruct.Float("blur", "blur", "Blur", "Amount of blur").Range(0, 800).Step(0.5).OnUpdate(update_base);
    return MaterialStruct;
  }
  var SplineFaceStruct;
  function api_define_spline_face() {
    let flagprop=spline_flagprop.copy();
    SplineFaceStruct = new DataStruct([new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(api_define_material(), "mat", "mat", true), new DataPath(flagprop, "flag", "flag", true)]);
    return SplineFaceStruct;
  }
  var SplineVertexStruct;
  function api_define_spline_vertex() {
    var coprop=new Vec3Property(undefined, "co", "Co", "Coordinates");
    let flagprop=spline_flagprop.copy();
    flagprop.update = function (owner) {
      this.ctx.spline.regen_sort();
      console.log("vertex update", owner);
      if (owner!==undefined) {
          owner.flag|=SplineFlags.UPDATE;
      }
      this.ctx.spline.propagate_update_flags();
      this.ctx.spline.resolve = 1;
      window.redraw_viewport();
    }
    SplineVertexStruct = new DataStruct([new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(flagprop, "flag", "flag", true), new DataPath(coprop, "co", "", true)]);
    return SplineVertexStruct;
  }
  var SplineSegmentStruct;
  function api_define_spline_segment() {
    let flagprop=spline_flagprop.copy();
    flagprop.update = function (segment) {
      new Context().spline.regen_sort();
      segment.flag|=SplineFlags.REDRAW;
      console.log(segment);
      window.redraw_viewport();
    }
    var zprop=new FloatProperty(0, "z", "z", "z");
    zpath = new DataPath(zprop, "z", "z", true);
    zpath.update = function (segment, old_value, changed) {
      if (segment!=undefined&&old_value!=undefined) {
          changed = segment.z!=old_value;
      }
      if (!changed) {
          return ;
      }
      if (!(g_app_state.modalstate&ModalStates.PLAYING)) {
          this.ctx.frameset.spline.regen_sort();
          this.ctx.frameset.pathspline.regen_sort();
      }
      segment.flag|=SplineFlags.REDRAW;
    }
    SplineSegmentStruct = new DataStruct([new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(flagprop, "flag", "flag", true), new DataPath(new BoolProperty(0, "renderable", "renderable"), "renderable", "renderable", true), new DataPath(api_define_material(), "mat", "mat", true), zpath]);
    return SplineSegmentStruct;
  }
  var SplineLayerFlags=es6_import_item(_es6_module, '../../curve/spline_element_array.js', 'SplineLayerFlags');
  var SplineLayerStruct;
  function api_define_spline_layer_struct() {
    var flag=new FlagProperty(2, SplineLayerFlags);
    flag.descriptions = {MASK: "Use previous layer as a mask"}
    flag.ui_key_names.MASK = flag.ui_value_names[SplineLayerFlags.MASK] = "Mask To Prev";
    flag.update = function () {
      window.redraw_viewport();
    }
    SplineLayerStruct = new DataStruct([new DataPath(new IntProperty(0, "id", "id", "id"), "id", "id", true), new DataPath(new StringProperty("", "name", "name", "name"), "name", "name", true), new DataPath(flag, "flag", "flag", true)]);
    window.SplineLayerStruct = SplineLayerStruct;
  }
  function api_define_spline() {
    api_define_spline_layer_struct();
    var layerset=new DataStructArray(function getstruct(item) {
      return SplineLayerStruct;
    }, function itempath(key) {
      return ".idmap["+key+"]";
    }, function getitem(key) {
      return this.idmap[key];
    }, function getiter() {
      return this[Symbol.iterator]();
    }, function getkeyiter() {
      var keys=Object.keys(this.idmap);
      var ret=new GArray();
      for (var i=0; i<keys.length; i++) {
          ret.push(keys[i]);
      }
      return ret;
    }, function getlength() {
      return this.length;
    });
    function define_editable_element_array(the_struct) {
      return new DataStructArray(function getstruct(item) {
        return the_struct;
      }, function itempath(key) {
        return ".local_idmap["+key+"]";
      }, function getitem(key) {
        return this.local_idmap[key];
      }, function getiter() {
        return this.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function getkeyiter(ctx) {
        var keys=new GArray();
        for (let e of this.editable(ctx)) {
            keys.push(e.eid);
        }
        return keys;
      }, function getlength() {
        let len=0;
        for (let e of this.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      });
    }
    function define_selected_element_array(the_struct) {
      return new DataStructArray(function getstruct(item) {
        return the_struct;
      }, function itempath(key) {
        return ".local_idmap["+key+"]";
      }, function getitem(key) {
        return this.local_idmap[key];
      }, function getiter() {
        return this.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function getkeyiter(ctx) {
        var keys=new GArray();
        for (let e of this.editable(ctx)) {
            keys.push(e.eid);
        }
        return keys;
      }, function getlength() {
        let len=0;
        for (let e of this.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      });
    }
    function define_element_array(the_struct) {
      return new DataStructArray(function getstruct(item) {
        return the_struct;
      }, function itempath(key) {
        return ".local_idmap["+key+"]";
      }, function getitem(key) {
        return this.local_idmap[key];
      }, function getiter() {
        return this[Symbol.iterator]();
      }, function getkeyiter() {
        var keys=Object.keys(this.local_idmap);
        var ret=new GArray();
        for (var i=0; i<keys.length; i++) {
            ret.push(keys[i]);
        }
        return ret;
      }, function getlength() {
        return this.length;
      });
    }
    var SplineStruct=new DataStruct(api_define_DataBlock().concat([new DataPath(api_define_spline_face(), "active_face", "faces.active", true), new DataPath(api_define_spline_segment(), "active_segment", "segments.active", true), new DataPath(api_define_spline_vertex(), "active_vertex", "verts.active", true), new DataPath(define_element_array(SplineFaceStruct), "faces", "faces", true), new DataPath(define_element_array(SplineSegmentStruct), "segments", "segments", true), new DataPath(define_element_array(SplineVertexStruct), "verts", "verts", true), new DataPath(define_element_array(SplineVertexStruct), "handles", "handles", true), new DataPath(define_editable_element_array(SplineFaceStruct), "editable_faces", "faces", true), new DataPath(define_editable_element_array(SplineSegmentStruct), "editable_segments", "segments", true), new DataPath(define_editable_element_array(SplineVertexStruct), "editable_verts", "verts", true), new DataPath(define_editable_element_array(SplineVertexStruct), "editable_handles", "handles", true), new DataPath(define_selected_element_array(SplineFaceStruct), "selected_facese", "faces", true), new DataPath(define_selected_element_array(SplineSegmentStruct), "selected_segments", "segments", true), new DataPath(define_selected_element_array(SplineVertexStruct), "selected_verts", "verts", true), new DataPath(define_selected_element_array(SplineVertexStruct), "selected_handles", "handles", true), new DataPath(layerset, "layerset", "layerset", true), new DataPath(SplineLayerStruct, "active_layer", "layerset.active", true)]));
    datablock_structs[DataTypes.SPLINE] = SplineStruct;
    return SplineStruct;
  }
  function api_define_vertex_animdata() {
    var VertexAnimData=new DataStruct([]);
    VertexAnimData.Flags(VDAnimFlags, "animflag", "animflag", "Animation Flags", "Keyframe Settings");
    VertexAnimData.Int("owning_vertex", "eid", "Owning Vertex", "Vertex in drawspline that owns this animation path");
    return VertexAnimData;
  }
  function api_define_frameset() {
    let animdata_struct=api_define_vertex_animdata();
    function define_animdata_array() {
      return new DataStructArray(function getstruct(item) {
        return animdata_struct;
      }, function itempath(key) {
        return "["+key+"]";
      }, function getitem(key) {
        return this[key];
      }, function getiter() {
        let this2=this;
        return (function* () {
          for (let k in this2) {
              yield this2[k];
          }
        })();
      }, function getkeyiter() {
        var keys=Object.keys(this);
        var ret=new GArray();
        for (var i=0; i<keys.length; i++) {
            ret.push(keys[i]);
        }
        return ret;
      }, function getlength() {
        let i=0;
        for (let k in this) {
            i++;
        }
        return i;
      });
    }
    var FrameSetStruct=new DataStruct(api_define_DataBlock().concat([new DataPath(api_define_spline(), "drawspline", "spline", true), new DataPath(api_define_spline(), "pathspline", "pathspline", true), new DataPath(define_animdata_array(), "keypaths", "vertex_animdata", true), new DataPath(animdata_struct, "active_keypath", "active_animdata", true)]));
    datablock_structs[DataTypes.FRAMESET] = FrameSetStruct;
    return FrameSetStruct;
  }
  var SceneStruct=undefined;
  function api_define_sceneobject() {
    var SceneObjectStruct=new DataStruct();
    SceneObjectStruct.Vector2("loc", "loc", "Position", "Position");
    SceneObjectStruct.Vector2("scale", "scale", "Scale", "Scale");
    SceneObjectStruct.Float("rot", "rot", "Rotation", "Rotation");
    SceneObjectStruct.add(new DataPath(api_define_frameset(), "frameset", "data", true));
    SceneObjectStruct.Bool("edit_all_layers", "edit_all_layers", "Edit All Layers", "Edit All Layers");
    return SceneObjectStruct;
  }
  function api_define_sceneobjects() {
    let SceneObjectStruct=api_define_sceneobject();
    let objectarray=new DataStructArray(function getstruct(item) {
      return SceneObjectStruct;
    }, function itempath(key) {
      return ".object_idmap["+key+"]";
    }, function getitem(key) {
      console.log("get key", key, this);
      return this.object_idmap[key];
    }, function getiter() {
      return new obj_value_iter(this.object_idmap);
    }, function getkeyiter() {
      return new obj_key_iter(this.object_idmap);
    }, function getlength() {
      return this.objects.length;
    });
    return objectarray;
  }
  function api_define_scene() {
    var name=new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
    var frame=new IntProperty(0, "frame", "Frame", "Frame", TPropFlags.LABEL);
    frame.range = [1, 10000];
    frame.step = 1;
    frame.expRate = 1.5;
    frame.update = (owner, old) =>      {
      let time=owner.time;
      owner.time = old;
      owner.change_time(g_app_state.ctx, time);
      window.redraw_viewport();
    }
    var SceneStruct=new DataStruct(api_define_DataBlock().concat([new DataPath(name, "name", "name", true), new DataPath(frame, "frame", "time", true), new DataPath(api_define_sceneobjects(), "objects", "objects", true), new DataPath(api_define_sceneobject(), "active_object", "objects.active", true)]));
    datablock_structs[DataTypes.SCENE] = SceneStruct;
    return SceneStruct;
  }
  function get_theme_color(color) {
    var st;
    var name=new StringProperty("", "name", "name", "name");
    name = new DataPath(name, "name", "[0]", true);
    if (__instance_of(color[1], BoxColor4)) {
        var type=new StringProperty("Corners", "type", "type");
        var c1=new Vec4Property(new Vector4(), "c1", "c1", "Color 1");
        var c2=new Vec4Property(new Vector4(), "c2", "c2", "Color 2");
        var c3=new Vec4Property(new Vector4(), "c3", "c3", "Color 3");
        var c4=new Vec4Property(new Vector4(), "c4", "c4", "Color 4");
        c1.subtype = c2.subtype = c3.subtype = c4.subtype = PropSubTypes.COLOR;
        function gen_func(i) {
          function update() {
            g_theme.gen_globals();
            SettingsUpdate();
          }
        }
        c1.update = gen_func(0);
        c2.update = gen_func(1);
        c3.update = gen_func(2);
        c4.update = gen_func(3);
        st = new DataStruct([new DataPath(type, "type", "type", true, false), name, new DataPath(c1, "c1", "[1].colors[0]", true), new DataPath(c2, "c2", "[1].colors[1]", true), new DataPath(c3, "c3", "[1].colors[2]", true), new DataPath(c4, "c4", "[1].colors[3]", true)]);
    }
    else 
      if (__instance_of(color[1], BoxWColor)) {
        var type=new StringProperty("Weighted", "type", "type");
        var clr=new Vec4Property(new Vector4(), "color", "color", "color");
        var weights=new Vec4Property(new Vector4(), "weight", "weight", "weight");
        clr.subtype = PropSubTypes.COLOR;
        clr.update = function () {
          g_theme.gen_globals();
          SettingsUpdate();
        };
        weights.update = function () {
          g_theme.gen_globals();
          SettingsUpdate();
        };
        weights.range = weights.real_range = weights.ui_range = [0, 1];
        st = new DataStruct([new DataPath(type, "type", "type", true, false), name, new DataPath(clr, "color", "[1].color", true), new DataPath(weights, "weights", "[1].weights", true)]);
    }
    else {
      var clr=new Vec4Property(new Vector4(), "color", "color", "color");
      clr.subtype = PropSubTypes.COLOR;
      clr.update = function (color) {
        g_theme.gen_globals();
        SettingsUpdate();
      };
      var type=new StringProperty("Simple", "type", "type");
      st = new DataStruct([new DataPath(type, "type", "type", true, false), name, new DataPath(clr, "color", "[1]", true)]);
    }
    return st;
  }
  var ColorThemeStruct=undefined;
  function api_define_colortheme() {
    var colors=new DataStructArray(get_theme_color, function getpath(key) {
      return "["+key+"]";
    }, function getitem(key) {
      return this[key];
    }, function getiter() {
      return this[Symbol.iterator]();
    }, function getkeyiter() {
      arr = [];
      for (var i=0; i<this.length; i++) {
          arr.push(i);
      }
      return arr[Symbol.iterator]();
    }, function getlength() {
      return this.length;
    });
    ColorThemeStruct = new DataStruct([new DataPath(colors, "colors", "flat_colors", false)]);
    return ColorThemeStruct;
  }
  var ThemeStruct=undefined;
  function api_define_theme() {
    api_define_colortheme();
    ThemeStruct = new DataStruct([new DataPath(ColorThemeStruct, "ui", "ui", false), new DataPath(ColorThemeStruct, "view2d", "view2d", false)]);
    return ThemeStruct;
  }
  var DopeSheetStruct=undefined;
  function api_define_dopesheet() {
    var selected_only=new BoolProperty(false, "selected_only", "Selected Only", "Show only keys of selected vertices");
    var pinned=new BoolProperty(false, "pinned", "Pin", "Pin view");
    selected_only.update = function (owner) {
      owner.rebuild();
    }
    let timescale=new FloatProperty(1.0, "timescale", "timescale", "timescale");
    timescale.update = function (owner) {
      owner.updateKeyPositions();
    }
    DopeSheetStruct = new DataStruct([new DataPath(selected_only, "selected_only", "selected_only", true), new DataPath(pinned, "pinned", "pinned", true), new DataPath(timescale, "timescale", "timescale")]);
    return DopeSheetStruct;
  }
  var CurveEditStruct=undefined;
  function api_define_editcurve() {
    var selected_only=new BoolProperty(false, "selected_only", "Selected Only", "Show only keys of selected vertices");
    var pinned=new BoolProperty(false, "pinned", "Pin", "Pin view");
    selected_only.update = function () {
      if (this.ctx!=undefined&&this.ctx.editcurve!=undefined)
        this.ctx.editcurve.do_full_recalc();
    }
    CurveEditStruct = new DataStruct([new DataPath(selected_only, "selected_only", "selected_only", true), new DataPath(pinned, "pinned", "pinned", true)]);
    return CurveEditStruct;
  }
  var ObjectStruct=undefined;
  function api_define_object() {
    var name=new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
    var ctx_bb=new Vec3Property(new Vector3(), "dimensions", "Dimensions", "Editable dimensions");
    ctx_bb.flag|=TPropFlags.USE_UNDO;
    ctx_bb.update = function () {
      if (this.ctx.mesh!=undefined)
        this.ctx.mesh.regen_render();
      if (this.ctx.view2d!=undefined&&this.ctx.view2d.selectmode&EditModes.GEOMETRY) {
          this.ctx.object.dag_update();
      }
    }
    ObjectStruct = new DataStruct([new DataPath(name, "name", "name", true), new DataPath(ctx_bb, "ctx_bb", "ctx_bb", true)]);
    return ObjectStruct;
  }
  var ImageStruct=undefined;
  function api_define_image() {
    var name=new StringProperty("");
    var lib_id=new IntProperty(0);
    var path=new StringProperty("");
    var flag=new FlagProperty(1, ImageFlags, undefined, "image flags", "image flags");
    ImageStruct = new DataStruct([new DataPath(name, "name", "name", true), new DataPath(lib_id, "lib_id", "lib_id", true), new DataPath(path, 'path', 'path', true), new DataPath(flag, 'flag', 'flag', true)]);
    datablock_structs[DataTypes.IMAGE] = ImageStruct;
    return ImageStruct;
  }
  function api_define_datalist(name, typeid) {
    var items=new DataStructArray(function getstruct(item) {
      return datablock_structs[item.lib_type];
    }, function itempath(key) {
      return "["+key+"]";
    }, function getitem(key) {
      return this[key];
    }, function getiter() {
      var ret=[];
      for (var k in this) {
          ret.push(this[k]);
      }
      return ret[Symbol.iterator]();
    }, function getkeyiter() {
      return list(this)[Symbol.iterator]();
    }, function getlength() {
      return list(this).length;
    });
    return new DataStruct([new DataPath(new StringProperty(name, "name"), "name", "name", false), new DataPath(new IntProperty(typeid, "typeid"), "typeid", "typeid", false), new DataPath(items, "items", "idmap", true)]);
  }
  var DataLibStruct=undefined;
  function api_define_datalib() {
    var paths=[];
    if (DataLibStruct!=undefined)
      return DataLibStruct;
    for (var k in DataTypes) {
        var v=DataTypes[k];
        var name=k.toLowerCase();
        paths.push(new DataPath(api_define_datalist(name, v), name, "datalists.items["+v+"]", false));
    }
    DataLibStruct = new DataStruct(paths);
    return DataLibStruct;
  }
  api_define_datalib();
  window.DataLibStruct2 = DataLibStruct;
  var AppStateStruct=undefined;
  function api_define_appstate() {
    var sel_multiple_mode=new BoolProperty(false, "select_multiple", "Multiple", "Select multiple elements");
    var sel_inverse_mode=new BoolProperty(false, "select_inverse", "Deselect", "Deselect Elements");
    AppStateStruct = new DataStruct([new DataPath(sel_multiple_mode, "select_multiple", "select_multiple", true), new DataPath(sel_inverse_mode, "select_inverse", "select_inverse", true)]);
    return AppStateStruct;
  }
  function get_tool_struct(tool) {
    OpStackArray.flag|=DataFlags.RECALC_CACHE;
    if (tool.apistruct!=undefined) {
        tool.apistruct.flag|=DataFlags.RECALC_CACHE;
        return tool.apistruct;
    }
    tool.apistruct = g_app_state.toolstack.gen_tool_datastruct(tool);
    tool.apistruct.flag|=DataFlags.RECALC_CACHE;
    return tool.apistruct;
  }
  get_tool_struct = _es6_module.add_export('get_tool_struct', get_tool_struct);
  var OpStackArray=new DataStructArray(get_tool_struct, function getitempath(key) {
    return "["+key+"]";
  }, function getitem(key) {
    return g_app_state.toolstack.undostack[key];
  }, function getiter() {
    return g_app_state.toolstack.undostack[Symbol.iterator]();
  }, function getkeyiter() {
    function* range(len) {
      for (var i=0; i<len; i++) {
          yield i;
      }
    }
    return range(g_app_state.toolstack.undostack.length)[Symbol.iterator]();
  }, function getlength() {
    return g_app_state.toolstack.undostack.length;
  });
  ContextStruct = undefined;
  window.test_range = function* range(len) {
    for (var i=0; i<len; i++) {
        yield i;
    }
  }
  window.api_define_context = function () {
    ContextStruct = new DataStruct([new DataPath(api_define_view2d(), "view2d", "ctx.view2d", true), new DataPath(api_define_dopesheet(), "dopesheet", "ctx.dopesheet", true), new DataPath(api_define_editcurve(), "editcurve", "ctx.editcurve", true), new DataPath(api_define_frameset(), "frameset", "ctx.frameset", true), new DataPath(api_define_seditor(), "settings_editor", "ctx.settings_editor", false), new DataPath(api_define_settings(), "settings", "ctx.appstate.session.settings", false), new DataPath(api_define_object(), "object", "ctx.object", false), new DataPath(api_define_scene(), "scene", "ctx.scene", false), new DataPath(new DataStruct([]), "last_tool", "", false, false, DataFlags.RECALC_CACHE), new DataPath(api_define_appstate(), "appstate", "ctx.appstate", false), new DataPath(OpStackArray, "operator_stack", "ctx.appstate.toolstack.undostack", false, true, DataFlags.RECALC_CACHE), new DataPath(api_define_theme(), "theme", "g_theme", false), new DataPath(api_define_spline(), "spline", "ctx.spline", false), new DataPath(api_define_datalib(), "datalib", "ctx.datalib", false), new DataPath(api_define_opseditor(), "opseditor", "ctx.opseditor", false)], Context);
  }
  window.init_data_api = function () {
    api_define_ops();
    api_define_context();
  }
  function gen_path_maps(strct, obj, path1, path2) {
    if (obj==undefined)
      obj = {}
    if (path1==undefined) {
        path1 = "";
        path2 = "";
    }
    if (path1!="")
      obj[path1] = strct;
    for (var p in strct.paths) {
        if (!(__instance_of(p.data, DataStruct))) {
            if (p.use_path) {
                obj[path1+"."+p.path] = "r = "+path2+"."+p.path+"; obj["+path1+"].pathmap["+p.path+"]";
            }
            else {
              obj[path1+"."+p.path] = "r = undefined; obj["+path1+"].pathmap["+p.path+"]";
            }
        }
        else {
          gen_path_maps(p, obj, path1+p.name, path2+p.path);
        }
    }
  }
  gen_path_maps = _es6_module.add_export('gen_path_maps', gen_path_maps);
  window.genNewDataAPI = () =>    {
    let out="";
    let ctx=g_app_state.ctx;
    let getClass=(dstruct, path) =>      {
      if (dstruct.dataClass)
        return dstruct.dataClass;
      console.log(path);
      window.ctx = CTX;
      let val;
      try {
        val = eval(path);
      }
      catch (error) {
          print_stack(error);
          console.warn("failed");
      }
      if (!val||!(typeof val==="object")) {
          console.warn("Failed to resovle a class", dstruct, "at", path);
          return undefined;
      }
      return val.constructor;
    }
    let structs={}
    let genStruct=(cls, dstruct, path) =>      {
      if (!cls) {
          console.warn("Failed to resolve a class", dstruct, path);
          return ;
      }
      let name=cls.name;
      out+="function api_define_"+name+"(api) {\n";
      name = "_"+name;
      out+=`  let ${name} = api.mapStruct(${cls.name}, true);\n`;
      for (let dpath of dstruct.paths) {
          let name2=dpath.name;
          let path2=path.trim();
          if (path2.length>0) {
              path2+=".";
          }
          path2+=dpath.path;
          let checkenum=(a, def) =>            {
            if (!a)
              return false;
            let ok=false;
            for (let k in def) {
                if (a[k]!==k) {
                    ok = true;
                }
            }
            return ok;
          };
          let format_obj=(obj) =>            {
            let def="{\n";
            let keys=Object.keys(obj);
            for (let i=0; i<keys.length; i++) {
                let k=""+keys[i];
                let v=obj[keys[i]];
                if (k.search(" ")>=0)
                  k = `"${k}"`;
                if (typeof v!=="number"&&!(typeof v==="string"&&v.startsWith("Icons.")))
                  v = `"${v}"`;
                def+="        "+k+" : "+v;
                if (i<keys.length-1) {
                    def+=",";
                }
                def+="\n";
            }
            def+="    }";
            return def;
          };
          let path3=dpath.path;
          if (path3.startsWith("ctx.")) {
              path3 = path3.slice(4, path3.length);
          }
          if (dpath.type===DataPathTypes.STRUCT) {
              let stt="undefined";
              let cls2=getClass(dpath.data, path2);
              if (cls2!==undefined) {
                  stt = `api.mapStruct(${cls2.name}, true)`;
              }
              else {
                out+="  /*WARNING: failed to resolve a class*/\n";
              }
              out+=`  ${name}.struct("${path3}", "${dpath.name}", "${dpath.uiname}", ${stt});\n`;
          }
          else 
            if (dpath.type===DataPathTypes.STRUCT_ARRAY) {
              out+=`\n\n  /* WARNING: data struct array detected ${dpath.name}{${path3}} */\n\n`;
          }
          else {
            let prop=dpath.data;
            let name2=dpath.name;
            out+=`  `;
            let uiname=dpath.uiname||prop.uiname||dpath.name;
            let numprop=(prop) =>              {
              s = "";
              if (prop.range&&prop.range[0]&&prop.range[1]) {
                  s+=`.range(${prop.range[0]}, ${prop.range[1]})`;
              }
              if (prop.ui_range&&prop.ui_range[0]&&prop.ui_range[1]) {
                  s+=`.uiRange(${prop.ui_range[0]}, ${prop.ui_range[1]})`;
              }
              return s;
            };
            let path3=dpath.path;
            if (path3.startsWith("ctx.")) {
                path3 = path3.slice(4, path3.length);
            }
            switch (prop.type) {
              case PropTypes.BOOL:
                out+=`${name}.bool("${path3}", "${dpath.name}", "${uiname}")`;
                break;
              case PropTypes.INT:
                out+=`${name}.int("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop);
                break;
              case PropTypes.FLOAT:
                out+=`${name}.float("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop);
                break;
              case PropTypes.VEC2:
                out+=`${name}.vec2("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop);
                break;
              case PropTypes.ENUM:
              case PropTypes.FLAG:
                let key=prop.type===PropTypes.ENUM ? "enum" : "flags";
                let def=format_obj(prop.type===PropTypes.FLAG ? prop.keys : prop.values);
                out+=`${name}.${key}("${path3}", ${def}, "${dpath.name}", "${uiname}")`;
                if (prop.type===PropTypes.ENUM) {
                    if (checkenum(prop.ui_value_names, prop.values)) {
                        out+=`.uiNames(${format_obj(prop.ui_value_names)})`;
                    }
                }
                else {
                  if (checkenum(prop.ui_key_names, prop.keys)) {
                      out+=`.uiNames(${format_obj(prop.ui_key_names)})`;
                  }
                }
                if (checkenum(prop.descriptions, prop.values)) {
                    out+=`.descriptions(${format_obj(prop.descriptions)})`;
                }
                if (checkenum(prop.iconmap, prop.values)) {
                    let iconmap2={};
                    for (let k in prop.iconmap) {
                        let v=prop.iconmap[k];
                        for (let k2 in Icons) {
                            if (Icons[k2]===v) {
                                iconmap2[k] = "Icons."+k2;
                            }
                        }
                    }
                    out+=`.icons(${format_obj(iconmap2)})`;
                }
                break;
            }
            if (prop.userSetData&&prop.userSetData!==prop.prototype.userSetData) {
                out+=".customSet("+prop.userSetData+")";
            }
            if (prop.update&&prop.update!==prop.prototype.update) {
                out+=`.on("change", ${""+prop.update})`;
            }
            out+=";\n";
          }
      }
      out+="}\n\n";
    }
    let recurse=(dstruct, path) =>      {
      let cls=getClass(dstruct, path);
      if (cls===undefined) {
          console.warn("failed to resolve class for path", path, dstruct);
          return ;
      }
      if (!(cls.name in structs)) {
          genStruct(cls, dstruct, path);
          structs[cls.name] = cls;
      }
      if (path.length>0) {
          path+=".";
      }
      for (let dpath of dstruct.paths) {
          if (dpath.type===DataPathTypes.STRUCT) {
              recurse(dpath.data, path+dpath.path);
          }
      }
    }
    recurse(ContextStruct, "");
    console.log(structs);
    console.log(out);
    for (let k in structs) {
        out+=`  api_define_${k}(api);\n`;
    }
    let lines=out.split("\n");
    out = "function makeAPI(api) {\n";
    for (let l of lines) {
        out+="  "+l+"\n";
    }
    out+="}\n";
    return out;
  }
}, '/dev/fairmotion/src/core/data_api/data_api_define.js');
es6_module_define('data_api_base', ["../../path.ux/scripts/controller/controller.js"], function _data_api_base_module(_es6_module) {
  var DataPathTypes={PROP: 0, 
   STRUCT: 1, 
   STRUCT_ARRAY: 2}
  DataPathTypes = _es6_module.add_export('DataPathTypes', DataPathTypes);
  var DataFlags={NO_CACHE: 1, 
   RECALC_CACHE: 2}
  DataFlags = _es6_module.add_export('DataFlags', DataFlags);
  var DataPathError=es6_import_item(_es6_module, '../../path.ux/scripts/controller/controller.js', 'DataPathError');
  let DataAPIError=DataPathError;
  DataAPIError = _es6_module.add_export('DataAPIError', DataAPIError);
  window.DataAPIError = DataAPIError;
}, '/dev/fairmotion/src/core/data_api/data_api_base.js');
es6_module_define('data_api_pathux', ["../toolprops.js", "../../editors/editor_base.js", "./data_api_base.js", "../../path.ux/scripts/util/simple_events.js", "../../path.ux/scripts/controller/controller.js", "../../editors/events.js", "../toolops_api.js", "../../path.ux/scripts/core/ui_base.js"], function _data_api_pathux_module(_es6_module) {
  var ModelInterface=es6_import_item(_es6_module, '../../path.ux/scripts/controller/controller.js', 'ModelInterface');
  var DataPathError=es6_import_item(_es6_module, '../../path.ux/scripts/controller/controller.js', 'DataPathError');
  var ToolOpAbstract=es6_import_item(_es6_module, '../toolops_api.js', 'ToolOpAbstract');
  var ToolOp=es6_import_item(_es6_module, '../toolops_api.js', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, '../toolops_api.js', 'ToolMacro');
  var ToolProperty=es6_import_item(_es6_module, '../toolprops.js', 'ToolProperty');
  var PropTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropTypes');
  var toolmap={}
  toolmap = _es6_module.add_export('toolmap', toolmap);
  var toollist=[];
  toollist = _es6_module.add_export('toollist', toollist);
  var DataPathTypes=es6_import_item(_es6_module, './data_api_base.js', 'DataPathTypes');
  var DataAPIError=es6_import_item(_es6_module, './data_api_base.js', 'DataAPIError');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var Editor=es6_import_item(_es6_module, '../../editors/editor_base.js', 'Editor');
  var ToolKeyHandler=es6_import_item(_es6_module, '../../editors/events.js', 'ToolKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../../path.ux/scripts/util/simple_events.js', 'HotKey');
  let resolvepath_rets=new cachering(() =>    {
    return {parent: undefined, 
    obj: undefined, 
    key: undefined, 
    subkey: undefined, 
    value: undefined, 
    prop: undefined, 
    struct: undefined, 
    mass_set: undefined}
  }, 32);
  function register_toolops() {
    function isTool(t) {
      if (t.tooldef===undefined)
        return false;
      if (t===ToolOpAbstract||t===ToolOp||t===ToolMacro)
        return false;
      let p=t, lastp;
      while (p&&p.prototype&&p.prototype.__proto__&&p!==lastp) {
        lastp = p;
        p = p.prototype.__proto__.constructor;
        if (p!==undefined&&p===ToolOpAbstract)
          return true;
      }
      return false;
    }
    for (let cls of defined_classes) {
        if (!isTool(cls))
          continue;
        let def=cls.tooldef();
        if (def.apiname===undefined) {
            continue;
        }
        toolmap[def.apiname] = cls;
        toollist.push(cls);
    }
  }
  register_toolops = _es6_module.add_export('register_toolops', register_toolops);
  class PathUXInterface extends ModelInterface {
    
     constructor(api, ctx=undefined) {
      super();
      this.prefix = "";
      this.api = api;
      this.ctx = ctx;
    }
     _getToolHotkey(screen, toolstring) {
      let ctx=this.ctx;
      let ret;
      function processKeymap(keymap) {
        for (let k of keymap) {
            let v=keymap.get(k);
            if (__instance_of(v, ToolKeyHandler)&&v.tool===toolstring) {
                console.log("found tool!", v);
                let ws=k.split("-");
                let s="";
                let i=0;
                for (let w of ws) {
                    w = w[0].toUpperCase()+w.slice(1, w.length).toLowerCase();
                    if (i>0) {
                        s+=" + ";
                    }
                    s+=w;
                    i++;
                }
                return s;
            }
            else 
              if (__instance_of(v, HotKey)&&v.action===toolstring) {
                return v.buildString();
            }
            else 
              if (__instance_of(k, HotKey)&&k.action===toolstring) {
                return k.buildString();
            }
        }
      }
      for (let sarea of screen.sareas) {
          for (let keymap of sarea.area.getKeyMaps()) {
              ret = processKeymap(keymap);
              if (ret) {
                  return ret;
              }
          }
      }
      if (ret===undefined&&screen.keymap!==undefined) {
          ret = processKeymap(screen.keymap);
      }
      return ret;
    }
     setContext(ctx) {
      this.ctx = ctx;
    }
     getObject(ctx, path) {
      return this.api.get_object(ctx, path);
    }
     getToolDef(path) {
      let ret=this.api.get_opclass(this.ctx, path);
      if (ret===undefined) {
          throw new DataAPIError("bad toolop path", path);
      }
      ret = ret.tooldef();
      ret = Object.assign({}, ret);
      ret.hotkey = this._getToolHotkey(this.ctx.screen, path);
      return ret;
    }
     getToolPathHotkey(ctx, path) {
      return this._getToolHotkey(this.ctx.screen, path);
    }
     buildMassSetPaths(ctx, listpath, subpath, value, filterstr) {
      return this.api.build_mass_set_paths(ctx, listpath, subpath, value, filterstr);
    }
     massSetProp(ctx, mass_set_path, value) {
      let path=mass_set_path;
      let i1=path.search(/\{/);
      let i2=path.search(/\}/);
      let filterpath=path.slice(i1+1, i2);
      let listpath=path.slice(0, i1);
      let subpath=path.slice(i2+2, path.length);
      return this.api.mass_set_prop(ctx, listpath, subpath, value, filterpath);
    }
     on_frame_change(ctx, newtime) {
      return this.api.on_frame_change(ctx, newtime);
    }
     onFrameChange(ctx, newtime) {
      return this.api.on_frame_change(ctx, newtime);
    }
     createTool(ctx, path, inputs={}, constructor_argument=undefined) {
      let tool=this.api.get_op(this.ctx, path);
      for (let k in inputs) {
          if (!(k in tool.inputs)) {
              console.warn("Unknown input", k, "for tool", tool);
              continue;
          }
          let v=inputs[k];
          if (__instance_of(v, ToolProperty)) {
              v = v.data;
          }
          tool.inputs[k].setValue(v);
      }
      return tool;
    }
     setAnimPathKey(ctx, owner, path, time) {
      return this.api.key_animpath(ctx, owner, path, time);
    }
     getObject(ctx, path) {
      return this.api.get_object(ctx, path);
    }
     parseToolPath(path) {
      return this.api.get_opclass(this.ctx, path);
    }
     execTool(ctx, path_or_toolop, inputs={}, constructor_argument=undefined) {
      return new Promise((accept, reject) =>        {
        let tool;
        if (typeof path_or_toolop=="object") {
            tool = path_or_toolop;
        }
        else {
          try {
            tool = this.createTool(ctx, path_or_toolop, inputs, constructor_argument);
          }
          catch (error) {
              reject(error);
              return ;
          }
        }
        accept(tool);
        g_app_state.toolstack.execTool(ctx, tool);
      });
    }
    static  toolRegistered(cls) {
      return cls.tooldef().apiname in toolmap;
    }
    static  registerTool(cls) {
      let tdef=cls.tooldef();
      if (tdef.apiname in toolmap) {
          console.log(cls);
          console.warn(tdef+" is already registered");
          return ;
      }
      toolmap[tdef.apiname] = cls;
      toollist.push(cls);
    }
     resolvePath(ctx, path) {
      let rp=this.api.resolve_path_intern(ctx, path);
      if (rp===undefined||rp[0]===undefined) {
          return undefined;
      }
      let ret=resolvepath_rets.next();
      try {
        ret.value = this.api.get_prop(ctx, path);
      }
      catch (error) {
          if (__instance_of(error, DataAPIError)) {
              ret.value = undefined;
          }
          else {
            throw error;
          }
      }
      ret.mass_set = rp[3];
      ret.key = rp[0].path;
      ret.subkey = undefined;
      ret.parent = undefined;
      ret.obj = undefined;
      ret.prop = undefined;
      ret.struct = undefined;
      if (rp[4]) {
          try {
            ret.obj = this.api.evaluate(this.ctx, rp[4]);
          }
          catch (error) {
              if (__instance_of(error, DataAPIError)) {
                  ret.obj = undefined;
              }
              else {
                throw error;
              }
          }
      }
      if (rp[0].type===DataPathTypes.PROP) {
          ret.prop = rp[0].data;
      }
      else 
        if (rp[0].type===DataPathTypes.STRUCT) {
          ret.struct = rp[0].data;
      }
      let found=0;
      if (ret.prop!==undefined&&ret.prop.type&(PropTypes.FLAG|PropTypes.ENUM)) {
          let prop=ret.prop;
          let p=path.trim();
          if (p.endsWith(/\]/)&&p.search(/\[/)>=0) {
              let i=p.length-1;
              while (p[i]!=="[") {
                i--;
              }
              let key=p.slice(i+1, p.length-1);
              if (key in prop.values) {
                  key = prop.values[key];
                  found = 1;
              }
              else {
                for (let k in prop.values) {
                    if (prop.values[k]===key) {
                        found = 1;
                    }
                    else 
                      if (prop.values[k]===parseInt(key)) {
                        key = parseInt(key);
                        found = 1;
                    }
                }
              }
              if (!found) {
                  throw new DataPathError(path+": Unknown enum/flag key: "+key);
              }
              else {
                ret.subkey = key;
              }
          }
      }
      if (!found&&ret.prop!==undefined&&ret.prop.type===PropTypes.FLAG) {
          let s=""+rp[1];
          if (s.search(/\&/)>=0) {
              let i=s.search(/\&/);
              s = parseInt(s.slice(i+1, s.length).trim());
          }
          ret.subkey = parseInt(s);
          for (let k in ret.prop.keys) {
              if (ret.prop.keys[k]==ret.subkey) {
                  ret.subkey = k;
                  break;
              }
          }
      }
      return ret;
    }
     setValue(ctx, path, val) {
      return this.api.set_prop(ctx, path, val);
    }
     getValue(ctx, path) {
      return this.api.get_prop(ctx, path);
    }
  }
  _ESClass.register(PathUXInterface);
  _es6_module.add_class(PathUXInterface);
  PathUXInterface = _es6_module.add_export('PathUXInterface', PathUXInterface);
}, '/dev/fairmotion/src/core/data_api/data_api_pathux.js');
var data_ops_list;
es6_module_define('data_api_opdefine', ["../../editors/viewport/view2d_spline_ops.js", "../toolops_api.js", "./data_api_pathux.js", "../safe_eval.js", "../../editors/viewport/spline_animops.js", "../../image/image_ops.js", "../../editors/viewport/spline_selectops.js", "../../editors/viewport/spline_editops.js", "../../editors/viewport/spline_createops.js", "../../editors/viewport/transform_spline.js", "../../editors/viewport/transdata.js", "../../editors/viewport/spline_layerops.js", "../../editors/viewport/view2d_editor.js", "../../editors/viewport/transform.js", "../../editors/viewport/view2d_ops.js", "../../editors/viewport/view2d.js", "../../path.ux/scripts/screen/FrameManager_ops.js", "../../path.ux/scripts/screen/FrameManager.js", "../../../platforms/Electron/theplatform.js"], function _data_api_opdefine_module(_es6_module) {
  var LoadImageOp=es6_import_item(_es6_module, '../../image/image_ops.js', 'LoadImageOp');
  var DeleteVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ChangeFaceZ');
  var SplitEdgeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgeOp');
  var DuplicateOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DuplicateOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DisconnectHandlesOp');
  var SplitEdgePickOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgePickOp');
  var ToolOp=es6_import_item(_es6_module, '../toolops_api.js', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, '../toolops_api.js', 'ToolMacro');
  var ToolFlags=es6_import_item(_es6_module, '../toolops_api.js', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, '../toolops_api.js', 'UndoFlags');
  var EditModes=es6_import_item(_es6_module, '../../editors/viewport/view2d.js', 'EditModes');
  var transform=es6_import(_es6_module, '../../editors/viewport/transform.js');
  var spline_selectops=es6_import(_es6_module, '../../editors/viewport/spline_selectops.js');
  var spline_createops=es6_import(_es6_module, '../../editors/viewport/spline_createops.js');
  var spline_editops=es6_import(_es6_module, '../../editors/viewport/spline_editops.js');
  var spline_animops=es6_import(_es6_module, '../../editors/viewport/spline_animops.js');
  var spline_layerops=es6_import(_es6_module, '../../editors/viewport/spline_layerops.js');
  var FrameManager=es6_import(_es6_module, '../../path.ux/scripts/screen/FrameManager.js');
  var FrameManager_ops=es6_import(_es6_module, '../../path.ux/scripts/screen/FrameManager_ops.js');
  var safe_eval=es6_import(_es6_module, '../safe_eval.js');
  var TransformOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'TransformOp');
  var TranslateOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'TranslateOp');
  var ScaleOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'ScaleOp');
  var RotateOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'RotateOp');
  var TransSplineVert=es6_import_item(_es6_module, '../../editors/viewport/transform_spline.js', 'TransSplineVert');
  var TransData=es6_import_item(_es6_module, '../../editors/viewport/transdata.js', 'TransData');
  var SelectOpBase=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'SelectOpBase');
  var SelectOneOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'SelectOneOp');
  var ToggleSelectAllOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'ToggleSelectAllOp');
  var SelectLinkedOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'SelectLinkedOp');
  var HideOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'HideOp');
  var UnhideOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'UnhideOp');
  var CircleSelectOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'CircleSelectOp');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var ExtrudeVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeVertOp');
  var CreateEdgeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'CreateEdgeOp');
  var CreateEdgeFaceOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'CreateEdgeFaceOp');
  var ImportJSONOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ImportJSONOp');
  var KeyCurrentFrame=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'KeyCurrentFrame');
  var ShiftLayerOrderOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ShiftLayerOrderOp');
  var SplineGlobalToolOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplineGlobalToolOp');
  var SplineLocalToolOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplineLocalToolOp');
  var KeyEdgesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'KeyEdgesOp');
  var CopyPoseOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'CopyPoseOp');
  var PastePoseOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'PastePoseOp');
  var InterpStepModeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'InterpStepModeOp');
  var DeleteVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ChangeFaceZ');
  var DissolveVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DissolveVertOp');
  var SplitEdgeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgeOp');
  var VertPropertyBaseOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'VertPropertyBaseOp');
  var ToggleBreakTanOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ToggleBreakTanOp');
  var ToggleBreakCurvOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ToggleBreakCurvOp');
  var ConnectHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ConnectHandlesOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DisconnectHandlesOp');
  var AnimPlaybackOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'AnimPlaybackOp');
  var ToggleManualHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ToggleManualHandlesOp');
  var ShiftTimeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ShiftTimeOp');
  var DuplicateOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DuplicateOp');
  var SplineMirrorOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplineMirrorOp');
  var AddLayerOp=es6_import_item(_es6_module, '../../editors/viewport/spline_layerops.js', 'AddLayerOp');
  var ChangeLayerOp=es6_import_item(_es6_module, '../../editors/viewport/spline_layerops.js', 'ChangeLayerOp');
  var ChangeElementLayerOp=es6_import_item(_es6_module, '../../editors/viewport/spline_layerops.js', 'ChangeElementLayerOp');
  var RenderAnimOp=es6_import_item(_es6_module, '../../editors/viewport/view2d_spline_ops.js', 'RenderAnimOp');
  var PlayAnimOp=es6_import_item(_es6_module, '../../editors/viewport/view2d_spline_ops.js', 'PlayAnimOp');
  var SessionFlags=es6_import_item(_es6_module, '../../editors/viewport/view2d_editor.js', 'SessionFlags');
  var ExportCanvasImage=es6_import_item(_es6_module, '../../editors/viewport/view2d_ops.js', 'ExportCanvasImage');
  var theplatform=es6_import(_es6_module, '../../../platforms/Electron/theplatform.js');
  var SplitEdgePickOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgePickOp');
  class QuitFileOp extends ToolOp {
    static  tooldef() {
      return {uiname: "Quit", 
     apiname: "appstate.quit", 
     is_modal: true, 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.IGNORE_UNDO}
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      this.end_modal(ctx);
      theplatform.app.quitApp();
    }
  }
  _ESClass.register(QuitFileOp);
  _es6_module.add_class(QuitFileOp);
  data_ops_list = undefined;
  var register_toolops=es6_import_item(_es6_module, './data_api_pathux.js', 'register_toolops');
  window.api_define_ops = function () {
    register_toolops();
    data_ops_list = {"spline.add_layer": function (ctx, args) {
        return new AddLayerOp(args.name);
      }, 
    "spline.change_face_z": function (ctx, args) {
        if (!("offset" in args))
          throw new TinyParserError();
        return new ChangeFaceZ(parseInt(args["offset"]), parseInt(args["selmode"]));
      }, 
    "spline.toggle_break_curvature": function (ctx, args) {
        return new ToggleBreakCurvOp();
      }, 
    "spline.toggle_break_tangents": function (ctx, args) {
        return new ToggleBreakTanOp();
      }, 
    "spline.translate": function (ctx, args) {
        var op=new TranslateOp(EditModes.GEOMETRY, ctx.object);
        if ("datamode" in args) {
            op.inputs.datamode.setValue(args["datamode"]);
        }
        op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);
        console.log("=====", args, ctx.view2d.session_flag, ctx.view2d.propradius);
        if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
            op.inputs.proportional.setValue(true);
            op.inputs.propradius.setValue(ctx.view2d.propradius);
        }
        return op;
      }, 
    "spline.rotate": function (ctx, args) {
        var op=new RotateOp(EditModes.GEOMETRY, ctx.object);
        if ("datamode" in args) {
            op.inputs.datamode.setValue(args["datamode"]);
        }
        op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);
        if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
            op.inputs.proportional.setValue(true);
            op.inputs.propradius.setValue(ctx.view2d.propradius);
        }
        return op;
      }, 
    "spline.scale": function (ctx, args) {
        var op=new ScaleOp(EditModes.GEOMETRY, ctx.object);
        if ("datamode" in args) {
            op.inputs.datamode.setValue(args["datamode"]);
        }
        op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);
        if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
            op.inputs.proportional.setValue(true);
            op.inputs.propradius.setValue(ctx.view2d.propradius);
        }
        return op;
      }, 
    "spline.key_edges": function (ctx, args) {
        return new KeyEdgesOp();
      }, 
    "view2d.export_image": function (ctx, args) {
        return new ExportCanvasImage();
      }, 
    "editor.copy_pose": function (ctx, args) {
        return new CopyPoseOp();
      }, 
    "editor.paste_pose": function (ctx, args) {
        return new PastePoseOp();
      }, 
    "editor.playback": function (ctx, args) {
        return new AnimPlaybackOp();
      }, 
    "spline.key_current_frame": function (ctx, args) {
        return new KeyCurrentFrame();
      }, 
    "spline.shift_time": function (ctx, args) {
        return new ShiftTimeOp();
      }, 
    "spline.delete_faces": function (ctx, args) {
        return new DeleteFaceOp();
      }, 
    "spline.toggle_manual_handles": function (ctx, args) {
        return new ToggleManualHandlesOp();
      }, 
    "spline.delete_segments": function (ctx, args) {
        return new DeleteSegmentOp();
      }, 
    "spline.delete_verts": function (ctx, args) {
        return new DeleteVertOp();
      }, 
    "spline.dissolve_verts": function (ctx, args) {
        return new DissolveVertOp();
      }, 
    "spline.make_edge": function (ctx, args) {
        return new CreateEdgeOp(ctx.view2d.default_linewidth);
      }, 
    "spline.make_edge_face": function (ctx, args) {
        return new CreateEdgeFaceOp(ctx.view2d.default_linewidth);
      }, 
    "spline.split_edges": function (ctx, args) {
        return new SplitEdgeOp();
      }, 
    "spline.split_pick_edge": function (ctx, args) {
        return new SplitEdgePickOp();
      }, 
    "spline.split_pick_edge_transform": function (ctx, args) {
        let ret=new ToolMacro("spline.split_pick_edge_transform", "Split Segment");
        let tool=new SplitEdgePickOp();
        let tool2=new TranslateOp(undefined, 1|2);
        ret.description = tool.description;
        ret.icon = tool.icon;
        ret.add_tool(tool);
        ret.add_tool(tool2);
        tool.on_modal_end = () =>          {
          let ctx=tool.modal_ctx;
          tool2.user_start_mpos = tool.mpos;
          console.log("                 on_modal_end successfully called", tool2.user_start_mpos);
        }
        return ret;
      }, 
    "spline.toggle_step_mode": function (ctx, args) {
        return new InterpStepModeOp();
      }, 
    "spline.mirror_verts": function (ctx, args) {
        return new SplineMirrorOp();
      }, 
    "spline.duplicate_transform": function (ctx, args) {
        var tool=new DuplicateOp();
        var macro=new ToolMacro("duplicate_transform", "Duplicate");
        macro.description = tool.description;
        macro.add_tool(tool);
        macro.icon = tool.icon;
        var transop=new TranslateOp(ctx.view2d.mpos, 1|2);
        macro.add_tool(transop);
        return macro;
      }, 
    "spline.toggle_select_all": function (ctx, args) {
        var op=new ToggleSelectAllOp();
        return op;
      }, 
    "spline.connect_handles": function (ctx, args) {
        return new ConnectHandlesOp();
      }, 
    "spline.disconnect_handles": function (ctx, args) {
        return new DisconnectHandlesOp();
      }, 
    "spline.hide": function (ctx, args) {
        return new HideOp(args.selmode, args.ghost);
      }, 
    "spline.unhide": function (ctx, args) {
        return new UnhideOp(args.selmode, args.ghost);
      }, 
    "image.load_image": function (ctx, args) {
        return new LoadImageOp(args.datapath, args.name);
      }, 
    "spline.select_linked": function (ctx, args) {
        if (!("vertex_eid" in args)) {
            throw new Error("need a vertex_eid argument");
        }
        var op=new SelectLinkedOp();
        op.inputs.vertex_eid.setValue(args.vertex_eid);
        return op;
      }, 
    "view2d.circle_select": function (ctx, args) {
        return new CircleSelectOp(ctx.view2d.selectmode);
      }, 
    "view2d.render_anim": function (Ctx, args) {
        return new RenderAnimOp();
      }, 
    "view2d.play_anim": function (Ctx, args) {
        return new PlayAnimOp();
      }, 
    "appstate.open": function (ctx, args) {
        return new FileOpenOp();
      }, 
    "appstate.open_recent": function (ctx, args) {
        return new FileOpenRecentOp();
      }, 
    "appstate.export_svg": function (ctx, args) {
        return new FileSaveSVGOp();
      }, 
    "appstate.export_al3_b64": function (ctx, args) {
        return new FileSaveB64Op();
      }, 
    "appstate.save": function (ctx, args) {
        return new FileSaveOp();
      }, 
    "appstate.save_as": function (ctx, args) {
        return new FileSaveAsOp();
      }, 
    "appstate.quit": function (ctx, args) {
        return new QuitFileOp();
      }, 
    "screen.area_split_tool": function (ctx, args) {
        return new SplitAreasTool(g_app_state.screen);
      }, 
    "screen.hint_picker": function (ctx, args) {
        return new HintPickerOp();
      }, 
    "object.toggle_select_all": function (ctx, args) {
        return new ToggleSelectObjOp("auto");
      }, 
    "object.translate": function (ctx, args) {
        return new TranslateOp(EditModes.OBJECT, ctx.object);
      }, 
    "object.rotate": function (ctx, args) {
        return new RotateOp(EditModes.OBJECT);
      }, 
    "object.scale": function (ctx, args) {
        return new ScaleOp(EditModes.OBJECT);
      }, 
    "object.duplicate": function (ctx, args) {
        return new ObjectDuplicateOp(ctx.scene.objects.selected);
      }, 
    "object.set_parent": function (ctx, args) {
        var op=new ObjectParentOp();
        op.flag|=ToolFlags.USE_DEFAULT_INPUT;
        return op;
      }, 
    "object.delete_selected": function (ctx, args) {
        var op=new ObjectDeleteOp();
        op.flag|=ToolFlags.USE_DEFAULT_INPUT;
        return op;
      }}
  }
}, '/dev/fairmotion/src/core/data_api/data_api_opdefine.js');
