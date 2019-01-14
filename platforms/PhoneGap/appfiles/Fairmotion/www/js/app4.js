es6_module_define('UICanvas', ["mathlib", "UIElement"], function _UICanvas_module(_es6_module) {
  "use strict";
  var rot2d=es6_import_item(_es6_module, 'mathlib', 'rot2d');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var $_mh;
  var $_swapt;
  var $arr4_window__box_process_clr=[0, 0, 0, 0];
  window._box_process_clr = function _box_process_clr(default_cs, clr) {
    var cs=default_cs;
    if (clr!=undefined) {
        if (typeof clr=="number") {
            var cs2=$arr4_window__box_process_clr;
            for (var i=0; i<4; i++) {
                cs2[i] = (($_mh = objcache.array(2)), ($_mh[0] = (cs[i][0])), ($_mh[1] = (cs[i][1])), ($_mh[2] = (cs[i][2])), ($_mh[3] = (cs[i][3])), $_mh);
                for (var j=0; j<4; j++) {
                    cs2[i]*=clr;
                }
            }
            cs = cs2;
        }
        else 
          if (typeof clr[0]=="number") {
            var cs=$arr4_window__box_process_clr;
            cs[0] = clr;
            cs[1] = clr;
            cs[2] = clr;
            cs[3] = clr;
        }
        else {
          cs = clr;
        }
    }
    return cs;
  }
  var $ret_Irfq_get_2d_canvas={}
  function get_2d_canvas() {
    if ($ret_Irfq_get_2d_canvas.canvas==undefined) {
        $ret_Irfq_get_2d_canvas.canvas = document.getElementById("canvas2d");
        $ret_Irfq_get_2d_canvas.ctx = _canvas2d_ctx;
    }
    return $ret_Irfq_get_2d_canvas;
  }
  get_2d_canvas = _es6_module.add_export('get_2d_canvas', get_2d_canvas);
  window.get_2d_canvas = get_2d_canvas;
  var $ret_ELts_get_2d_canvas_2={}
  function get_2d_canvas_2() {
    if ($ret_ELts_get_2d_canvas_2.canvas==undefined) {
        $ret_ELts_get_2d_canvas_2.canvas = document.getElementById("canvas2d_work");
        $ret_ELts_get_2d_canvas_2.ctx = _canvas2d_ctx_2;
    }
    return $ret_ELts_get_2d_canvas_2;
  }
  get_2d_canvas_2 = _es6_module.add_export('get_2d_canvas_2', get_2d_canvas_2);
  window.get_2d_canvas_2 = get_2d_canvas_2;
  window._ui_canvas_2d_idgen = 1;
  var $temp_layer_idgen_RNgl_push_layer;
  var $black_XrHh_quad;
  var $grads_aOrc_quad;
  var $mid_5sHY_colorfield;
  var $cache_itEX_box1;
  var $v1_hqxz_box1;
  var $v3_Zxzq_box1;
  var $pairs_HCee_box1;
  var $pos_bZEb_text;
  var $v2_MYhj_box1;
  var $v4_ZaP0_box1;
  var UICanvas=_ESClass("UICanvas", [function UICanvas(viewport) {
    var c=get_2d_canvas();
    this.canvas = c.canvas;
    this.id = _ui_canvas_2d_idgen++;
    this.ctx = c.ctx;
    this.canvases = {}
    var ctx=c.ctx, fl=Math.floor;
    
    if (ctx.setFillColor==undefined) {
        ctx.setFillColor = function(r, g, b, a) {
          if (a==undefined)
            a = 1.0;
          this.fillStyle = "rgba("+fl(r*255)+","+fl(g*255)+","+fl(b*255)+","+a+")";
        };
    }
    if (ctx.setStrokeColor==undefined) {
        ctx.setStrokeColor = function(r, g, b, a) {
          if (a==undefined)
            a = 1.0;
          this.strokeStyle = "rgba("+fl(r*255)+","+fl(g*255)+","+fl(b*255)+","+a+")";
        };
    }
    this.layerstack = [];
    this.scissor_stack = [];
    this._lastclip = [[0, 0], [0, 0]];
    this.transmat = new Matrix4();
    this.trans_stack = [];
    this.raster = g_app_state.raster;
    this.global_matrix = new Matrix4();
    this.iconsheet = g_app_state.raster.iconsheet;
    this.iconsheet16 = g_app_state.raster.iconsheet16;
    this.viewport = viewport;
  }, function destroy() {
  }, function _css_color(c) {
    if (isNaN(c[0]))
      return "black";
    var s="rgba(";
    for (var i=0; i<3; i++) {
        if (i>0)
          s+=",";
        s+=Math.floor(c[i]*255);
    }
    s+=","+(c[3]==undefined ? "1.0" : c[3])+")";
    return s;
  }, function reset_canvases() {
    console.trace("reset_canvases called");
    for (var k in this.canvases) {
        document.body.removeChild(this.canvases[k]);
    }
    this.canvases = {}
  }, function kill_canvas(obj_or_id) {
    console.trace("kill called");
    var id=obj_or_id;
    if (typeof id=="object") {
        console.log(id);
        id = id[Symbol.keystr]();
    }
    var canvas=this.canvases[id];
    delete this.canvases[id];
    
    delete active_canvases[id];
    if (canvas!=undefined) {
        document.body.removeChild(canvas);
    }
  }, function get_canvas(obj_or_id, pos, size, zindex) {
    if (zindex==undefined) {
        zindex = 4;
    }
    var id=obj_or_id;
    window._ensure_thedimens();
    if (typeof id=="object")
      id = id[Symbol.keystr]();
    var canvas;
    if (id in this.canvases) {
        canvas = this.canvases[id];
        canvas.is_blank = false;
    }
    else {
      console.warn("creating new canvas. . .");
      var canvas=document.createElement("canvas");
      canvas.id = "_canvas2d_"+id;
      document.body.appendChild(canvas);
      canvas.style["position"] = "absolute";
      canvas.style["left"] = "0px";
      canvas.style["top"] = "0px";
      canvas.style["z-index"] = ""+zindex;
      canvas.style["pointer-events"] = "none";
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;
      canvas.ctx = canvas.getContext("2d");
      if (canvas.ctx.canvas==undefined) {
          canvas.ctx.canvas = canvas;
      }
      canvas.is_blank = true;
      this.canvases[id] = canvas;
      
      active_canvases[id] = [canvas, this];
    }
    if (parseInt(canvas.style["z-index"])!=zindex) {
        canvas.style["z-index"] = zindex;
    }
    if (canvas.width!=size[0]) {
        canvas.width = size[0];
    }
    if (canvas.height!=size[1]) {
        canvas.height = size[1];
    }
    if (canvas.style["left"]!=""+Math.floor(pos[0])+"px") {
        canvas.style["left"] = Math.floor(pos[0])+"px";
        canvas.is_blank = true;
    }
    var y=Math.floor(window.theHeight-pos[1]-size[1]);
    if (canvas.style["top"]!=""+y+"px") {
        canvas.style["top"] = ""+y+"px";
        canvas.is_blank = true;
    }
    canvas.ctx.is_blank = canvas.is_blank;
    return canvas;
  }, function push_layer() {
    this.layerstack.push([this.canvas, this.ctx]);
    var canvas=document.createElement("canvas");
    canvas.id = "_temp_canvas2d_"+($temp_layer_idgen_RNgl_push_layer++);
    document.body.appendChild(canvas);
    canvas.style["position"] = "absolute";
    canvas.style["left"] = "0px";
    canvas.style["top"] = "0px";
    canvas.style["z-index"] = ""+(4+this.layerstack.length);
    canvas.style["pointer-events"] = "none";
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }, function pop_layer() {
    if (this.layerstack.length==0) {
        console.trace("%cTHE SHEER EVIL OF IT!", "color:red");
        return ;
    }
    var item=this.layerstack.pop();
    document.body.removeChild(this.canvas);
    this.canvas = item[0];
    this.ctx = item[1];
  }, function on_draw(gl) {
  }, function set_viewport(viewport) {
    this.viewport = viewport;
  }, function clear(p, size) {
    var v=this.viewport;
    var canvas=this.canvas;
    var ctx=this.ctx;
    if (p==undefined) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
    }
    else {
      ctx.clearRect(p[0]+v[0][0], canvas.height-(v[0][1]+p[1]+size[1]), size[0], size[1]);
      ctx.beginPath();
      ctx.rect(p[0]+v[0][0], canvas.height-(v[0][1]+p[1]+size[1]), size[0], size[1]);
    }
  }, function reset() {
    var v=this.viewport;
    var canvas=this.canvas;
    var ctx=this.ctx;
  }, function clip(rect, vis_only) {
    if (vis_only==undefined) {
        vis_only = false;
    }
    var canvas=this.canvas;
    var ctx=this.ctx;
    rect[0] = new Vector2(rect[0]);
    rect[1] = new Vector2(rect[1]);
    var v=this.viewport;
    this._clip_to_viewport(rect[0], rect[1], v);
    ctx.fillStyle = Math.random()>0.5 ? "rgba(255,0,0,0.7)" : "rgba(0,255,0,0.7)";
    ctx.beginPath();
    ctx.rect(v[0][0]+rect[0][0], canvas.height-(v[0][1]+rect[0][1]+rect[1][1]), rect[1][0], rect[1][1]);
    ctx.closePath();
    if (vis_only)
      ctx.fill();
    else 
      ctx.clip();
  }, function root_start() {
    this.ctx.save();
  }, function root_end() {
    this.ctx.restore();
  }, function begin() {
  }, function end() {
  }, function frame_begin() {
  }, function frame_end() {
  }, function use_cache(item) {
  }, function has_cache(item) {
    return false;
  }, function remove_cache(item) {
  }, function on_resize(oldsize, newsize) {
  }, function invbox(pos, size, clr, r) {
    var cs=uicolors["InvBox"];
    cs = _box_process_clr(cs, clr);
    this.box(pos, size, cs, r);
  }, function simple_box(pos, size, clr, r) {
    if (clr==undefined) {
        clr = undefined;
    }
    if (r==undefined) {
        r = 2.0;
    }
    var cs=uicolors["SimpleBox"];
    cs = _box_process_clr(cs, clr);
    this.box(pos, size, cs, r);
  }, function hlightbox(pos, size, clr_mul, r) {
    var cs=uicolors["HLightBox"];
    if (clr_mul!==undefined&&typeof clr_mul=="number") {
        cs = [new Vector4(cs[0]), new Vector4(cs[1]), new Vector4(cs[2]), new Vector4(cs[3])];
        for (var i=0; i<4; i++) {
            for (var j=0; j<4; j++) {
                cs[i][j]*=clr_mul;
            }
        }
    }
    else 
      if (clr_mul!==undefined&&__instance_of(clr_mul, Array)) {
        if (typeof clr_mul[0]=="number") {
            cs = [clr_mul, clr_mul, clr_mul, clr_mul];
        }
        else {
          cs = [new Vector4(clr_mul[0]), new Vector4(clr_mul[1]), new Vector4(clr_mul[2]), new Vector4(clr_mul[3])];
        }
    }
    this.box(pos, size, cs, r);
  }, function box_outline(pos, size, clr, rfac) {
    this.box(pos, size, clr, rfac, true);
  }, function quad(v1, v2, v3, v4, c1, c2, c3, c4, horiz_gradient) {
    if (horiz_gradient==undefined) {
        horiz_gradient = false;
    }
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    if (c1==undefined) {
        c1 = $black_XrHh_quad;
    }
    if (c2==undefined) {
        c2 = c1;
    }
    if (c3==undefined) {
        c3 = c2;
    }
    if (c4==undefined) {
        c4 = c3;
    }
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    var hash="";
    for (var i=0; i<4; i++) {
        hash+=c1[i]+","+c2[i]+","+c3[i]+","+c4[i];
    }
    var grad;
    if (1||!(hash in $grads_aOrc_quad)) {
        var min=[v1[0], v1[1]], max=[v1[0], v1[1]];
        for (var i=0; i<2; i++) {
            min[i] = Math.min(min[i], v1[i]);
            max[i] = Math.max(max[i], v1[i]);
            min[i] = Math.min(min[i], v2[i]);
            max[i] = Math.max(max[i], v2[i]);
            min[i] = Math.min(min[i], v3[i]);
            max[i] = Math.max(max[i], v3[i]);
            min[i] = Math.min(min[i], v4[i]);
            max[i] = Math.max(max[i], v4[i]);
        }
        min[0]+=x+v[0][0];
        max[0]+=x+v[0][0];
        min[1] = canvas.height-(min[1]+y+v[0][1]);
        max[1] = canvas.height-(max[1]+y+v[0][1]);
        var grad;
        if (isNaN(min[0])||isNaN(max[0])||isNaN(min[1])||isNaN(max[1])||isNaN(c1[0])||isNaN(c3[0])) {
            grad = "black";
        }
        else {
          try {
            if (horiz_gradient)
              grad = ctx.createLinearGradient(min[0], min[1]*0.5+max[1]*0.5, max[0], min[1]*0.5+max[1]*0.5);
            else 
              grad = ctx.createLinearGradient(min[0]*0.5+max[0]*0.5, min[1], min[0]*0.5+max[0]*0.5, max[1]);
            $grads_aOrc_quad[hash] = grad;
            grad.addColorStop(0.0, this._css_color(c1));
            grad.addColorStop(1.0, this._css_color(c3));
          }
          catch (error) {
              print_stack(error);
              console.log("GRADIENT ERROR", min[0], min[1], max[0], max[1]);
          }
        }
    }
    else {
      grad = $grads_aOrc_quad[hash];
    }
    if (grad!=undefined)
      ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(v1[0]+x+v[0][0], canvas.height-(v1[1]+y+v[0][1]));
    ctx.lineTo(v2[0]+x+v[0][0], canvas.height-(v2[1]+y+v[0][1]));
    ctx.lineTo(v3[0]+x+v[0][0], canvas.height-(v3[1]+y+v[0][1]));
    ctx.lineTo(v4[0]+x+v[0][0], canvas.height-(v4[1]+y+v[0][1]));
    ctx.fill();
  }, function colorfield(pos, size, color) {
    $mid_5sHY_colorfield[3] = 1.0;
    for (var i=0; i<3; i++) {
        if (color[i]==0.0)
          $mid_5sHY_colorfield[i] = 0.0;
        else 
          $mid_5sHY_colorfield[i] = color[i];
    }
    var color2=this._css_color($mid_5sHY_colorfield);
    $mid_5sHY_colorfield[3] = 1.0;
    for (var i=0; i<3; i++) {
        $mid_5sHY_colorfield[i] = (color[i]*3.0-1.0)/4.0;
    }
    var midclr=this._css_color($mid_5sHY_colorfield);
    $mid_5sHY_colorfield[3] = 1.0;
    for (var i=0; i<3; i++) {
        $mid_5sHY_colorfield[i] = 0.5+color[i]*0.5;
    }
    var smidclr=this._css_color($mid_5sHY_colorfield);
    $mid_5sHY_colorfield[3] = 0.0;
    for (var i=0; i<3; i++) {
        $mid_5sHY_colorfield[i] = color[i];
    }
    var zerocolor=this._css_color($mid_5sHY_colorfield);
    color = this._css_color(color);
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    var bx=pos[0]+x+v[0][0], by=canvas.height-(pos[1]+y+v[0][1])-size[1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(bx, by, size[0], size[1]);
    ctx.closePath();
    ctx.fill();
    function draw_grad(a, b, c, is_horiz) {
      var grad;
      var dp=0.0, dp2=0.0, dp3=35;
      if (is_horiz==1)
        grad = ctx.createLinearGradient(bx+1, by, bx+size[0]-2, by);
      else 
        if (is_horiz==2)
        grad = ctx.createLinearGradient(bx+dp+size[0]-dp*2, by+dp, bx+dp, by+size[1]-dp*2.0);
      else 
        if (is_horiz==3)
        grad = ctx.createLinearGradient(bx+dp2+dp3, by+dp2+dp3, bx+dp2+size[0]-dp2*2, by+size[1]-dp2*2.0);
      else 
        grad = ctx.createLinearGradient(bx, by+size[1], bx, by);
      grad.addColorStop(0.0, a);
      grad.addColorStop(1.0, c);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.rect(bx, by, size[0], size[1]);
      ctx.closePath();
      ctx.fill();
    }
    try {
      draw_grad("rgba(255,255,255,1.0)", "rgba(255,255,255, 0.5)", "rgba(255,255,255,0.0)", 0);
      draw_grad("rgba(0,0,0,1.0)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.0)", 1);
    }
    catch (error) {
    }
  }, function icon(icon, pos, alpha, small, clr) {
    if (alpha==undefined) {
        alpha = 1.0;
    }
    if (small==undefined) {
        small = false;
    }
    if (clr==undefined) {
        clr = undefined;
    }
    if (icon<0)
      return ;
    var sheet=small ? g_app_state.raster.iconsheet16 : g_app_state.raster.iconsheet;
    var img=sheet.tex.image;
    var csize=sheet.cellsize;
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41+v[0][0]+pos[0], y=canvas.height-(m.m42+v[0][1]+pos[1])-csize[1];
    var spos=sheet.enum_to_xy(icon);
    ctx.drawImage(img, spos[0], spos[1], csize[0], csize[1], x, y, csize[0], csize[1]);
  }, function quad_aa(v1, v2, v3, v4, c1, c2, c3, c4) {
    this.quad(v1, v2, v3, v4, c1, c2, c3, c4);
  }, function _clip_to_viewport(pos, size, v) {
    if (pos[0]<0) {
        size[0]+=pos[0];
        pos[0] = 0;
    }
    if (pos[0]+size[0]>v[1][0]) {
        size[0] = v[1][0]-pos[0];
    }
    if (pos[1]<0) {
        size[1]+=pos[1];
        pos[1] = 0;
    }
    if (pos[1]+size[1]>v[1][1]) {
        size[1] = v[1][1]-pos[1];
    }
  }, function push_scissor(pos, size) {
    var t="";
    for (var i=0; i<this.scissor_stack.length; i++) {
        t+="  ";
    }
    var oldpos=pos;
    pos = new Vector3([pos[0], pos[1], 0]);
    size = new Vector3([pos[0]+size[0], pos[1]+size[1], 0]);
    pos.multVecMatrix(this.transmat);
    size.multVecMatrix(this.transmat);
    size[0]-=pos[0];
    size[1]-=pos[1];
    var v=g_app_state.raster.viewport;
    this._clip_to_viewport(pos, size, v);
    pos[0]+=v[0][0];
    pos[1]+=v[0][1];
    for (var i=0; i<3; i++) {
        pos[i] = Math.floor(pos[i]);
        size[i] = Math.ceil(size[i]);
    }
    this.scissor_stack.push([pos, size]);
    var canvas=this.canvas;
    var g=this.ctx;
    try {
      g.save();
      if (window._cd==undefined)
        window._cd = 0;
      g.fillStyle = (window._cd++%2) ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 255, 0, 0.5)";
      g.beginPath();
      g.rect(pos[0], canvas.height-(pos[1]+size[1]), size[0], size[1]);
      g.closePath();
      g.clip();
    }
    catch (err) {
        print_stack(err);
    }
  }, function pop_scissor() {
    this.scissor_stack.pop();
    var t="";
    for (var i=0; i<this.scissor_stack.length; i++) {
        t+="  ";
    }
    this.ctx.restore();
  }, function _clipeq(c1, c2) {
    return c1[0][0]==c2[0][0]&&c1[0][1]==c2[0][1]&&c1[1][0]==c2[1][0]&&c1[1][1]==c2[1][1];
  }, function arc_points(pos, start, arc, r, steps) {
    if (steps==undefined) {
        steps = Math.floor(6*arc/Math.PI);
    }
    var f, df;
    var f=start;
    var df=arc/steps;
    var points=[];
    for (var i=0; i<steps+1; i++) {
        var x=pos[0]+Math.sin(f)*r;
        var y=pos[1]+Math.cos(f)*r;
        points.push([x, y, 0]);
        f+=df;
    }
    return points;
  }, function arc(pos, start, arc, r, clr, half) {
    if (clr==undefined) {
        clr = [0.9, 0.8, 0.7, 0.6];
    }
    var steps=18/(2.0-arc/(Math.PI*2));
    var f, df;
    var f=start;
    var df=arc/steps;
    var points=[];
    for (var i=0; i<steps+1; i++) {
        var x=pos[0]+Math.sin(f)*r;
        var y=pos[1]+Math.cos(f)*r;
        points.push([x, y, 0]);
        f+=df;
    }
    var lines=[];
    var colors=[];
    for (var i=0; i<points.length-1; i++) {
        lines.push([points[i], points[i+1]]);
        colors.push([clr, clr]);
    }
    colors[0][0] = [1.0, 1.0, 0.0, 1.0];
    colors[0][1] = [1.0, 1.0, 0.0, 1.0];
  }, function box1(pos, size, clr, rfac, outline_only) {
    if (clr==undefined) {
        clr = undefined;
    }
    if (rfac==undefined) {
        rfac = undefined;
    }
    if (outline_only==undefined) {
        outline_only = false;
    }
    var c1, c2, c3, c4;
    var cs=uicolors["Box"];
    if (outline_only==undefined)
      outline_only = false;
    cs = _box_process_clr(cs, clr);
    var x=Math.floor(pos[0]), y=Math.floor(pos[1]);
    var w=size[0], h=size[1];
    var start=0;
    var ang=Math.PI/2;
    var r=4;
    if (rfac==undefined)
      rfac = 1;
    var hash=size[0].toString()+" "+size[1]+" "+rfac;
    if (!(hash in $cache_itEX_box1)) {
        r/=rfac;
        var p1=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+r+2)), ($_mh[1] = (0+r+2)), ($_mh[2] = (0)), $_mh), Math.PI, ang, r);
        var p2=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+w-r-2)), ($_mh[1] = (0+r+2)), ($_mh[2] = (0)), $_mh), Math.PI/2, ang, r);
        var p3=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+w-r-2)), ($_mh[1] = (0+h-r-2)), ($_mh[2] = (0)), $_mh), 0, ang, r);
        var p4=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+r+2)), ($_mh[1] = (0+h-r-2)), ($_mh[2] = (0)), $_mh), -Math.PI/2, ang, r);
        var plen=p1.length;
        p4.reverse();
        p3.reverse();
        p2.reverse();
        p1.reverse();
        var points=[];
        for (var i=0; i<p1.length; i++) {
            points.push(p1[i]);
        }
        for (var i=0; i<p2.length; i++) {
            points.push(p2[i]);
            p1.push(p2[i]);
        }
        for (var i=0; i<p3.length; i++) {
            points.push(p3[i]);
        }
        p2 = p3;
        for (var i=0; i<p4.length; i++) {
            p2.push(p4[i]);
            points.push(p4[i]);
        }
        p2.reverse();
        $cache_itEX_box1[hash] = [p1, p2, points];
    }
    var cp=$cache_itEX_box1[hash];
    var p1=cp[0];
    var p2=cp[1];
    var points=cp[2];
    var plen=p1.length;
    function color(i) {
      if (i<plen)
        return cs[0];
      else 
        if (i<plen*2)
        return cs[1];
      else 
        if (i<plen*3)
        return cs[2];
      else 
        if (i<=plen*4+1)
        return cs[3];
    }
    if (!outline_only) {
        for (var i=0; i<p1.length-1; i++) {
            var i1=i;
            var i2=i+plen*2;
            var i3=i+1+plen*2;
            var i4=i+1;
            $v1_hqxz_box1[0] = p1[i][0]+x;
            $v1_hqxz_box1[1] = p1[i][1]+y;
            $v1_hqxz_box1[2] = p1[i][2];
            
            $v2_MYhj_box1[0] = p2[i][0]+x;
            $v2_MYhj_box1[1] = p2[i][1]+y;
            $v2_MYhj_box1[2] = p2[i][2];
            
            $v3_Zxzq_box1[0] = p2[i+1][0]+x;
            $v3_Zxzq_box1[1] = p2[i+1][1]+y;
            $v3_Zxzq_box1[2] = p2[i+1][2];
            
            $v4_ZaP0_box1[0] = p1[i+1][0]+x;
            $v4_ZaP0_box1[1] = p1[i+1][1]+y;
            $v4_ZaP0_box1[2] = p1[i+1][2];
            
            this.quad($v1_hqxz_box1, $v2_MYhj_box1, $v3_Zxzq_box1, $v4_ZaP0_box1, color(i1), color(i2), color(i3), color(i4));
        }
    }
    var lines=[];
    var colors=[];
    for (var i=0; i<points.length; i++) {
        $v1_hqxz_box1[0] = points[(i+1)%points.length][0]+x;
        $v1_hqxz_box1[1] = points[(i+1)%points.length][1]+y;
        $v1_hqxz_box1[2] = points[(i+1)%points.length][2];
        
        $v2_MYhj_box1[0] = points[i][0]+x;
        $v2_MYhj_box1[1] = points[i][1]+y;
        $v2_MYhj_box1[2] = points[i][2];
        
        if ($pairs_HCee_box1.length<=i) {
            $pairs_HCee_box1.push([[0, 0], [0, 0]]);
        }
        $pairs_HCee_box1[i][0][0] = (($_mh = objcache.array(2)), ($_mh[0] = ($v1_hqxz_box1[0])), ($_mh[1] = ($v1_hqxz_box1[1])), ($_mh[2] = (0)), $_mh);
        $pairs_HCee_box1[i][0][1] = (($_mh = objcache.array(2)), ($_mh[0] = ($v2_MYhj_box1[0])), ($_mh[1] = ($v2_MYhj_box1[1])), ($_mh[2] = (0)), $_mh);
        lines.push($pairs_HCee_box1[i][0]);
        $pairs_HCee_box1[i][1][0] = color((i+1)%points.length);
        $pairs_HCee_box1[i][1][1] = color(i);
        colors.push($pairs_HCee_box1[i][1]);
    }
  }, function tri_aa(v1, v2, v3, c1, c2, c3) {
    this.tri(v1, v2, v3, c1, c2, c3);
  }, function _split_text(line) {
    var i=0;
    var segments=[{line: "", format: "", color: undefined}];
    while (i<line.length) {
      var c=line[i];
      if (c=="%") {
          var n=line[i+1];
          var color=undefined;
          var format="";
          color = undefined;
          switch (n) {
            case "b":
              format = "bold";
              break;
            case "i":
              format = "italic";
              break;
            case "/":
              format = "";
              color = undefined;
              i++;
              break;
            case "c":
              i++;
              var end=line.slice(i, line.length).search("}");
              color = line.slice(i+2, i+end).trim();
              console.log("COLOR!!!", end, color, "|", line.slice(i, line.length));
              i+=end;
              break;
          }
          segments.push({line: "", format: format, color: color});
          i+=2;
          continue;
      }
      segments[segments.length-1].line+=c;
      i++;
    }
    return segments;
  }, function _measure_line(line, fontsize) {
    var segs=this._split_text(line);
    var x=0.0;
    var g=this.ctx;
    for (var i=0; i<segs.length; i++) {
        x+=g.measureText(segs[i].line).width;
    }
    return {width: x}
  }, function _text_line(line, x, y, fontsize) {
    var segs=this._split_text(line);
    var g=this.ctx;
    var startclr=g.fillStyle;
    for (var i=0; i<segs.length; i++) {
        this._set_font(g, fontsize, segs[i].format);
        if (segs[i].color!=undefined) {
            g.fillStyle = segs[i].color;
        }
        else {
          g.fillStyle = startclr;
        }
        g.fillText(segs[i].line, x, y);
        x+=g.measureText(segs[i].line).width;
    }
    g.fillStyle = startclr;
  }, function text(pos1, text, color, fontsize, scale, rot, scissor_pos, scissor_size) {
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var lines=text.split("\n");
    if (text[0]!="\n"&&text[1]!="\r"&&lines[0].trim()=="") {
        lines = lines.splice(1, lines.length);
    }
    lines.reverse();
    if (rot==undefined)
      rot = 0;
    var ly=0;
    for (var i=0; i<lines.length; i++, ly+=12) {
        var w=this._measure_line(lines[i]).width;
        var m=this.transmat.$matrix;
        $pos_bZEb_text[0] = m.m41+v[0][0]+pos1[0];
        $pos_bZEb_text[1] = canvas.height-(m.m42+v[0][1]+pos1[1]+ly);
        $pos_bZEb_text[2] = 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.rotate(rot);
        if (rot!=0) {
            $pos_bZEb_text[1]-=w;
        }
        rot2d($pos_bZEb_text, -rot);
        $pos_bZEb_text[1] = canvas.height-$pos_bZEb_text[1];
        if (color==undefined)
          color = uicolors.DefaultText;
        ctx.fillStyle = this._css_color(color);
        if (fontsize==undefined)
          fontsize = default_ui_font_size;
        ctx.font = fontsize+"px "+"Arial";
        var x=$pos_bZEb_text[0], y=canvas.height-($pos_bZEb_text[1]);
        this._text_line(lines[i], x, y, fontsize);
    }
  }, function _set_font(ctx, fontsize, addition_options) {
    if (addition_options==undefined) {
        addition_options = "";
    }
    addition_options = addition_options.trim()+" ";
    if (fontsize==undefined)
      fontsize = default_ui_font_size;
    ctx.font = addition_options+fontsize+"px "+"Arial";
  }, function line(v1, v2, c1, c2) {
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    ctx.strokeStyle = this._css_color(c1);
    ctx.beginPath();
    ctx.moveTo(v1[0]+x+v[0][0], canvas.height-(v1[1]+y+v[0][1]));
    ctx.lineTo(v2[0]+x+v[0][0], canvas.height-(v2[1]+y+v[0][1]));
    ctx.stroke();
  }, function tri(v1, v2, v3, c1, c2, c3) {
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    ctx.fillStyle = this._css_color(c1);
    ctx.beginPath();
    ctx.moveTo(v1[0]+x+v[0][0], canvas.height-(v1[1]+y+v[0][1]));
    ctx.lineTo(v2[0]+x+v[0][0], canvas.height-(v2[1]+y+v[0][1]));
    ctx.lineTo(v3[0]+x+v[0][0], canvas.height-(v3[1]+y+v[0][1]));
    ctx.fill();
  }, function shadow_box(pos, size, steps, margin, clr) {
    if (steps==undefined) {
        steps = 6;
    }
    if (margin==undefined) {
        margin = [6, 6];
    }
    if (clr==undefined) {
        clr = uicolors["ShadowBox"];
    }
  }, function box(pos, size, clr, rfac, outline_only) {
    if (IsMobile||rfac==0.0)
      return this.box2(pos, size, clr, rfac, outline_only);
    else 
      return this.box1(pos, size, clr, rfac, outline_only);
  }, function passpart(pos, size, clr) {
    if (clr==undefined) {
        clr = [0, 0, 0, 0.5];
    }
    var p=this.viewport[0];
    var s=this.viewport[1];
    this.box2([p[0], p[1]], [pos[0], s[1]], clr);
    this.box2([p[0]+pos[0]+size[0], p[1]], [s[0]-pos[0]-size[0], s[1]], clr);
    this.box2([pos[0]+p[0], pos[1]+p[1]+size[1]], [size[0], s[1]-size[1]-p[1]], clr);
    this.box2([pos[0]+p[0], p[1]], [size[0], pos[1]], clr);
  }, function box2(pos, size, clr, rfac, outline_only) {
    if (clr==undefined) {
        clr = undefined;
    }
    if (rfac==undefined) {
        rfac = undefined;
    }
    if (outline_only==undefined) {
        outline_only = false;
    }
    var cs=uicolors["Box"];
    cs = _box_process_clr(cs, clr);
    var x=pos[0], y=pos[1];
    var w=size[0], h=size[1];
    if (outline_only) {
        this.line([pos[0], pos[1]], [pos[0], pos[1]+size[1]], clr, clr, 1.0);
        this.line([pos[0], pos[1]+size[1]], [pos[0]+size[0], pos[1]+size[1]], clr, clr, 1.0);
        this.line([pos[0]+size[0], pos[1]+size[1]], [pos[0]+size[0], pos[1]], clr, clr, 1.0);
        this.line([pos[0]+size[0], pos[1]], [pos[0], pos[1]], clr, clr, 1.0);
    }
    else {
      this.quad((($_mh = objcache.array(2)), ($_mh[0] = (x)), ($_mh[1] = (y)), ($_mh[2] = (0)), $_mh), (($_mh = objcache.array(2)), ($_mh[0] = (x+w)), ($_mh[1] = (y)), ($_mh[2] = (0)), $_mh), (($_mh = objcache.array(2)), ($_mh[0] = (x+w)), ($_mh[1] = (y+h)), ($_mh[2] = (0)), $_mh), (($_mh = objcache.array(2)), ($_mh[0] = (x)), ($_mh[1] = (y+h)), ($_mh[2] = (0)), $_mh), cs[0], cs[1], cs[2], cs[3]);
    }
  }, function textsize(text, size) {
    if (size==undefined) {
        size = default_ui_font_size;
    }
    var lines=text.split("\n");
    if (text[0]!="\n"&&text[1]!="\r"&&lines[0].trim()=="") {
        lines = lines.splice(1, lines.length);
    }
    lines.reverse();
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=this.viewport;
    this._set_font(ctx, size);
    var wid=0, hgt=0;
    for (var i=0; i<lines.length; i++) {
        wid = Math.max(wid, this._measure_line(lines[i]).width);
        hgt+=size+2;
    }
    return [wid, hgt];
  }, function translate(off) {
    this.transmat.translate(off[0], off[1], 0.0);
  }, function push_transform(mat) {
    if (mat==undefined) {
        mat = undefined;
    }
    this.trans_stack.push(new Matrix4(this.transmat));
    if (mat!=undefined)
      this.transmat.multiply(mat);
  }, function pop_transform() {
    this.transmat.load(this.trans_stack.pop());
  }]);
  var $temp_layer_idgen_RNgl_push_layer=0;
  var $black_XrHh_quad=[0, 0, 0, 1];
  var $grads_aOrc_quad={}
  var $mid_5sHY_colorfield=[0, 0, 0, 0.5];
  var $cache_itEX_box1={}
  var $v1_hqxz_box1=new Vector3();
  var $v3_Zxzq_box1=new Vector3();
  var $pairs_HCee_box1=[];
  var $pos_bZEb_text=[0, 0, 0];
  var $v2_MYhj_box1=new Vector3();
  var $v4_ZaP0_box1=new Vector3();
  _es6_module.add_class(UICanvas);
  UICanvas = _es6_module.add_export('UICanvas', UICanvas);
  window.active_canvases = {}
  function test_canvas2d() {
    var u=new UICanvas();
  }
}, '/home/ec2-user/fairmotion/src/ui/UICanvas.js');
es6_module_define('UIFrame', ["J3DIMath", "config", "UIElement", "mathlib", "../editors/viewport/events"], function _UIFrame_module(_es6_module) {
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var config=es6_import(_es6_module, 'config');
  es6_import(_es6_module, 'J3DIMath');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var KeyMap=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, '../editors/viewport/events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../editors/viewport/events', 'TouchEventManager');
  var VelocityPan=es6_import_item(_es6_module, '../editors/viewport/events', 'VelocityPan');
  var EventHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'EventHandler');
  var _static_mat=new Matrix4();
  var _ufbd_v1=new Vector3();
  var _canvas_threshold=1.0;
  var $pos_LeXa__find_active;
  var $zero_lMlJ_build_draw_old;
  var UIFrame=_ESClass("UIFrame", UIElement, [function UIFrame(ctx, canvas, path, pos, size) {
    UIElement.call(this, ctx, path, pos, size);
    this.dirty_rects = new GArray();
    this.bgcolor = undefined;
    this._pan_cache = {}
    this.pan_bounds = [[0, 0], [0, 0]];
    this.depth = 0;
    this.ctx = ctx;
    this._children = new GArray([]);
    this.active = undefined;
    this.velpan = new VelocityPan();
    this.tick_timer = new Timer(config.ON_TICK_TIMER_MS-1);
    this.mpos = [0, 0];
    this.draw_background = false;
    this.has_hidden_elements = false;
    if (canvas!=undefined) {
        this.canvas = canvas;
    }
    this.leafcount = 0;
    this.framecount = 0;
    this.rcorner = 16.0;
    this.keymap = undefined;
  }, _ESClass.get(function children() {
    return this._children;
  }), _ESClass.set(function children(cs) {
    var cset=new set();
    var __iter_c=__get_iter(cs);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      cset.add(c);
    }
    var __iter_c=__get_iter(list(this._children));
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (!cset.has(c)) {
          c.on_remove(this);
          c.parent = undefined;
          c.canvas = undefined;
      }
    }
    this._children.reset();
    var __iter_c=__get_iter(cs);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (!cset.has(c)) {
          this.add(c);
      }
      else {
        this._children.push(c);
      }
    }
  }), function on_saved_uidata(visit_func) {
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      visit_func(c);
    }
  }, function on_load_uidata(visit) {
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      visit(c);
    }
  }, function on_gl_lost(new_gl) {
    if (this.canvas!=undefined&&!(this.canvas.gl===new_gl)) {
        this.canvas.on_gl_lost(new_gl);
    }
    if (this.children==undefined)
      return ;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.on_gl_lost(new_gl);
    }
    this.do_full_recalc();
  }, function start_pan(start_mpos, button, last_mpos) {
    if (start_mpos==undefined) {
        start_mpos = undefined;
    }
    if (button==undefined) {
        button = 0;
    }
    if (last_mpos==undefined) {
        last_mpos = undefined;
    }
    if (!(this.state&UIFlags.HAS_PAN)) {
        if (this.parent==undefined) {
            console.trace();
            console.log("Warning: UIFrame.start_pan: no parent frame with pan support");
        }
        else {
          if (start_mpos!=undefined) {
              start_mpos[0]+=this.pos[0];
              start_mpos[1]+=this.pos[1];
          }
          if (last_mpos!=undefined) {
              last_mpos[0]+=this.pos[0];
              last_mpos[1]+=this.pos[1];
          }
          this.parent.start_pan(start_mpos, button, last_mpos);
        }
    }
    else {
      this.start_pan_main(start_mpos, button, last_mpos);
    }
  }, function start_pan_main(start_mpos, button, last_mpos) {
    if (button==undefined) {
        button = 0;
    }
    if (last_mpos==undefined) {
        last_mpos = start_mpos;
    }
    if (start_mpos!=undefined) {
        this.mpos[0] = start_mpos[0];
        this.mpos[1] = start_mpos[1];
    }
    if (this.velpan==undefined)
      this.velpan = new VelocityPan();
    var mpos=[this.mpos[0], this.mpos[1]];
    var lastmpos;
    this.abs_transform(mpos);
    if (last_mpos!=undefined) {
        last_mpos = [last_mpos[0], last_mpos[1]];
        this.abs_transform(last_mpos);
    }
    else {
      last_mpos = mpos;
    }
    if (DEBUG.touch)
      console.log("sy", mpos[1]);
    var f=this;
    while (f.parent!=undefined) {
      f = f.parent;
    }
    this.velpan.can_coast = !(this.state&UIFlags.NO_VELOCITY_PAN);
    this.velpan.start(mpos, last_mpos, this, f.push_modal.bind(f), f.pop_modal.bind(f));
  }, function end_pan() {
    if (this.modalhandler==this.velpan) {
        this.velpan.end();
        this.pop_modal();
    }
    else {
      console.trace();
      console.log("Warning: UIFrame.end_pan called when not in panning mode");
      return ;
    }
  }, function get_keymaps() {
    return this.keymap!=undefined ? [this.keymap] : [];
  }, function do_full_recalc() {
    this.dirty_rects.push([[this.abspos[0], this.abspos[1]], [this.size[0], this.size[1]]]);
    this.do_recalc();
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (__instance_of(c, UIFrame))
        c.do_full_recalc();
      else 
        c.do_recalc();
    }
  }, function on_resize(newsize, oldsize) {
    if (this.canvas!=undefined) {
        this.canvas.on_resize(newsize, oldsize);
    }
    this.do_full_recalc();
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.do_recalc();
      c.on_resize(newsize, oldsize);
    }
  }, function on_inactive() {
    if (this.active!=undefined) {
        this.active.state&=~UIFlags.HIGHLIGHT;
        this.active.do_recalc();
        this.active.on_inactive();
        this.active = undefined;
        this.do_recalc();
    }
  }, function push_modal(e) {
    UIElement.prototype.push_modal.call(this, e);
  }, function pop_modal() {
    UIElement.prototype.pop_modal.call(this);
  }, function _offset_mpos(event) {
    if (this.modalhandler!=null&&__instance_of(this.modalhandler, UIElement)) {
        event.x-=this.modalhandler.pos[0];
        event.y-=this.modalhandler.pos[1];
    }
    if ((this.state&UIFlags.HAS_PAN)&&this.velpan!=undefined) {
        event.x-=this.velpan.pan[0];
        event.y-=this.velpan.pan[1];
    }
  }, function _unoffset_mpos(event) {
    if (this.state&UIFlags.HAS_PAN) {
        event.x+=this.velpan.pan[0];
        event.y+=this.velpan.pan[1];
    }
  }, function set_pan() {
    if (this.state&UIFlags.PAN_CANVAS_MAT)
      this.on_pan(this.velpan.pan, this.velpan.pan);
  }, function on_pan(pan, old_pan) {
    if (this.state&UIFlags.PAN_CANVAS_MAT) {
        var mat=this.canvas.global_matrix;
        var s=this.canvas.viewport[1];
        var x=(pan[0]/s[0])*2.0;
        var y=(pan[1]/s[1])*2.0;
        mat.makeIdentity();
        mat.translate(x, y, 0);
    }
    else {
      this.do_full_recalc();
    }
    this.pan_do_build();
  }, function _on_mousemove(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null) {
        this._offset_mpos(event);
        this.modalhandler._on_mousemove(event);
        this._unoffset_mpos(event);
        return true;
    }
    else {
      return this.on_mousemove(event);
    }
  }, function focus(e) {
    if (this.active!==e&&this.active!==undefined) {
        this.active.state&=~UIFlags.HIGHLIGHT;
        this.active.on_inactive();
        this.active.do_recalc();
    }
    else 
      if (e!=undefined&&e===this.active) {
        if (this.parent!=undefined)
          this.parent.focus(this);
        return ;
    }
    if (e!=undefined) {
        e.state|=UIFlags.HIGHLIGHT;
        e.on_active();
        e.do_recalc();
    }
    this.active = e;
    if (this.parent!=undefined) {
        this.parent.focus(this);
    }
  }, function _find_active(e) {
    var mpos=[e.x, e.y];
    var found=false;
    for (var i=this.children.length-1; i>=0; i--) {
        var c=this.children[i];
        $pos_LeXa__find_active[0] = c.pos[0], $pos_LeXa__find_active[1] = c.pos[1];
        if (c.state&UIFlags.HAS_PAN) {
        }
        if (inrect_2d(mpos, $pos_LeXa__find_active, c.size)) {
            found = true;
            if (this.active!=c&&this.active!=undefined) {
                this.active.state&=~UIFlags.HIGHLIGHT;
                this.active.on_inactive();
                this.active.do_recalc();
            }
            if (this.active!=c) {
                c.state|=UIFlags.HIGHLIGHT;
                c.on_active();
                c.do_recalc();
                this.active = c;
            }
            break;
        }
    }
    if (!found&&this.active!=undefined) {
        this.active.state&=~UIFlags.HIGHLIGHT;
        this.active.on_inactive();
        this.active.do_recalc();
        this.active = undefined;
    }
  }, function on_mousemove(e) {
    if (this.bad_event(e))
      return ;
    this._offset_mpos(e);
    var mpos=this.mpos = [e.x, e.y];
    var found=false;
    this._find_active(e);
    if (this.active!=undefined) {
        e.x-=this.active.pos[0];
        e.y-=this.active.pos[1];
        this.active._on_mousemove(e);
        e.x+=this.active.pos[0];
        e.y+=this.active.pos[1];
    }
    this._unoffset_mpos(e);
    return this._act_has_events();
  }, function bad_event(event) {
    if (!(this.state&UIFlags.ENABLED))
      return false;
    return UIElement.prototype.bad_event.call(this, event);
  }, function _on_doubleclick(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null) {
        this._offset_mpos(event);
        this.modalhandler._on_doubleclick(event);
        this._unoffset_mpos(event);
    }
    else {
      this.on_doubleclick(event);
    }
  }, function _on_mousedown(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null) {
        this._offset_mpos(event);
        this.modalhandler._on_mousedown(event);
        this._unoffset_mpos(event);
    }
    else {
      this.on_mousedown(event);
    }
  }, function on_doubleclick(e) {
    if (this.bad_event(e))
      return ;
    this._offset_mpos(e);
    var mpos=this.mpos = [e.x, e.y];
    this._find_active(e);
    if (this.active!=undefined) {
        e.x-=this.active.pos[0];
        e.y-=this.active.pos[1];
        this.active._on_doubleclick(e);
        e.x+=this.active.pos[0];
        e.y+=this.active.pos[1];
    }
    this._unoffset_mpos(e);
    return this._act_has_events();
  }, function on_mousedown(e, feed_mousemove) {
    if (feed_mousemove==undefined) {
        feed_mousemove = false;
    }
    if (this.bad_event(e))
      return ;
    if (feed_mousemove)
      this.on_mousemove(e);
    this._offset_mpos(e);
    var mpos=this.mpos = [e.x, e.y];
    this._find_active(e);
    if ((this.state&UIFlags.USE_PAN)&&(e.button!=0||this.active==undefined)) {
        console.log("panning");
        this.start_pan([e.x, e.y]);
        this._unoffset_mpos(e);
        return ;
    }
    if (this.active!=undefined) {
        e.x-=this.active.pos[0];
        e.y-=this.active.pos[1];
        this.active._on_mousedown(e);
        e.x+=this.active.pos[0];
        e.y+=this.active.pos[1];
    }
    this._unoffset_mpos(e);
    return this._act_has_events();
  }, function _act_has_events() {
    if (this.active!=undefined) {
        let act=this.active;
        while (act.active!==undefined) {
          act = act.active;
        }
        return !(act.state&UIFlags.BG_EVENTS_TRANSPARENT);
    }
    return false;
  }, function _on_mouseup(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null) {
        this._offset_mpos(event);
        this.modalhandler._on_mouseup(event);
        this._unoffset_mpos(event);
    }
    else {
      this.on_mouseup(event);
    }
  }, function on_mouseup(e) {
    if (this.bad_event(e))
      return ;
    this._offset_mpos(e);
    if (this.active!=undefined) {
        e.x-=this.active.pos[0];
        e.y-=this.active.pos[1];
        this.active._on_mouseup(e);
        e.x+=this.active.pos[0];
        e.y+=this.active.pos[1];
    }
    this._unoffset_mpos(e);
    return this._act_has_events();
  }, function _on_mousewheel(event, delta) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null) {
        if (this.modalhandler["pos"]!=undefined) {
            event.x-=this.modalhandler.pos[0];
            event.y-=this.modalhandler.pos[1];
        }
        this.modalhandler._on_mousewheel(event, delta);
        if (this.modalhandler!=null&&this.modalhandler["pos"]!=undefined) {
            event.x+=this.modalhandler.pos[0];
            event.y+=this.modalhandler.pos[1];
        }
    }
    else {
      this.on_mousewheel(event, delta);
    }
  }, function on_mousewheel(e, delta) {
    if (this.active!=undefined) {
        if (this.modalhandler!=null&&this.modalhandler["pos"]!=undefined) {
            event.x-=this.modalhandler.pos[0];
            event.y-=this.modalhandler.pos[1];
        }
        this.active._on_mousewheel(e, delta);
        if (this.modalhandler!=null&&this.modalhandler["pos"]!=undefined) {
            event.x+=this.modalhandler.pos[0];
            event.y+=this.modalhandler.pos[1];
        }
    }
    return this._act_has_events();
  }, function on_textinput(e) {
    if (this.active!=undefined) {
        this.active._on_textinput(e);
    }
    return this._act_has_events();
  }, function on_keydown(e) {
    if (this.active!=undefined) {
        this.active._on_keydown(e);
    }
    return this._act_has_events();
  }, function on_keyup(e) {
    if (this.active!=undefined) {
        this.active._on_keyup(e);
    }
    return this._act_has_events();
  }, function on_charcode(e) {
    if (this.active!=undefined) {
        this.active._on_charcode(e);
    }
    return this._act_has_events();
  }, function get_uhash() {
    var s="";
    var p=this;
    while (p!=undefined) {
      s+=p.constructor.name;
      if (__instance_of(p, Area))
        break;
      p = p.parent;
    }
    return s;
  }, function prepend(e, packflag) {
    e.defunct = false;
    this.children.prepend(e);
    if (!(__instance_of(e, UIFrame))) {
        this.leafcount++;
    }
    else {
      this.framecount++;
    }
    if (packflag!=undefined)
      e.packflag|=packflag;
    e.parent = this;
    if (e.canvas==undefined)
      e.canvas = this.canvas;
    e.on_add(this);
    this.do_recalc();
    this.update_depth();
  }, function _set_pan(e) {
    e.state|=UIFlags.USE_PAN;
    if (__instance_of(e, UIFrame)) {
        var __iter_c=__get_iter(e.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          this._set_pan(c);
        }
    }
  }, function update_depth(e) {
    return ;
    var p=this;
    this.depth = 0;
    while (p.parent!=undefined) {
      p = p.parent;
      this.depth++;
    }
    function rec(f, depth) {
      if (depth==undefined) {
          depth = 0;
      }
      f.depth = depth;
      var __iter_c=__get_iter(f.children);
      var c;
      while (1) {
        var __ival_c=__iter_c.next();
        if (__ival_c.done) {
            break;
        }
        c = __ival_c.value;
        if (__instance_of(c, UIFrame)) {
            rec(c, depth+1);
        }
      }
    }
  }, function insert(idx, e, packflag) {
    if (__instance_of(e, UIFrame)&&(e.state&UIFlags.HAS_PAN)&&e.velpan==undefined) {
        e.velpan = new VelocityPan();
    }
    if (this.state&(UIFlags.HAS_PAN|UIFlags.USE_PAN)) {
        this.state|=UIFlags.USE_PAN;
        this._set_pan(e);
    }
    e.defunct = false;
    this.children.insert(idx, e);
    if (!(__instance_of(e, UIFrame))) {
        this.leafcount++;
    }
    else {
      this.framecount++;
    }
    if (packflag!=undefined)
      e.packflag|=packflag;
    e.parent = this;
    if (e.canvas==undefined)
      e.canvas = this.canvas;
    e.on_add(this);
    e.do_recalc();
    this.update_depth();
  }, function add(e, packflag) {
    return this.insert(this.children.length, e);
  }, function replace(a, b) {
    if (a==this.modalhandler) {
        a.pop_modal();
    }
    this.dirty_rects.push([[a.abspos[0], a.abspos[1]], [a.size[0], a.size[1]]]);
    a.on_remove(this);
    this.children.replace(a, b);
    if (this.canvas!=undefined)
      this.canvas.remove_cache(a);
    if (a==this.active)
      this.active = b;
    b.parent = this;
    if (b.canvas==undefined)
      b.canvas = this.get_canvas();
    if (b.ctx==undefined)
      b.ctx = this.ctx;
    b.on_add(this);
    b.do_recalc();
    this.update_depth();
  }, function remove(e) {
    e.defunct = true;
    this.dirty_rects.push([[e.abspos[0], e.abspos[1]], [e.size[0], e.size[1]]]);
    if (!(__instance_of(e, UIFrame))) {
        this.leafcount--;
    }
    else {
      this.framecount--;
    }
    if (e==this.modalhandler) {
        e.pop_modal();
    }
    this.children.remove(e);
    e.on_remove(this);
    if (this.canvas!=undefined)
      this.canvas.remove_cache(e);
    if (e==this.active)
      this.active = undefined;
    this.update_depth();
  }, function set_context(ctx) {
    this.ctx = ctx;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.set_context(ctx);
    }
  }, function load_filedata(obj) {
    if (obj.pan) {
        this.velpan = new VelocityPan();
        this.velpan.pan.load(obj.pan);
    }
  }, function disable() {
    UIElement.prototype.disable.call(this);
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.disable();
    }
  }, function enable() {
    UIElement.prototype.enable.call(this);
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.enable();
    }
  }, function get_filedata() {
    if (this.state&UIFlags.HAS_PAN&&this.velpan!=undefined) {
        return {pan: this.velpan.pan}
    }
    return undefined;
  }, function pan_do_build() {
    var cache=this._pan_cache;
    var cache2={}
    var i=0;
    var viewport=g_app_state.raster.viewport;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.abspos[0] = 0;
      c.abspos[1] = 0;
      c.abs_transform(c.abspos);
      var hidden=!aabb_isect_2d(c.abspos, c.size, viewport[0], viewport[1]);
      if (!this.recalc&&!hidden&&(!(i in cache)||cache[i]!=hidden)) {
          console.log("pan recalc");
          this.do_recalc();
      }
      cache2[i] = hidden;
      i++;
    }
    this._pan_cache = cache2;
  }, function calc_dirty() {
    var d=this.last_dirty;
    var ret=[[0, 0], [0, 0]];
    var first=true;
    var margin=1;
    var __iter_r=__get_iter(this.dirty_rects);
    var r;
    while (1) {
      var __ival_r=__iter_r.next();
      if (__ival_r.done) {
          break;
      }
      r = __ival_r.value;
      if (first) {
          first = false;
          ret[0][0] = r[0][0]-margin;
          ret[0][1] = r[0][1]-margin;
          ret[1][0] = r[1][0]+r[0][0]+margin*2;
          ret[1][1] = r[1][1]+r[0][1]+margin*2;
      }
      else {
        ret[0][0] = Math.min(ret[0][0], r[0][0]-margin);
        ret[0][1] = Math.min(ret[0][1], r[0][1]-margin);
        ret[1][0] = Math.max(ret[1][0], r[0][0]+r[1][0]+margin*2);
        ret[1][1] = Math.max(ret[1][1], r[0][1]+r[1][1]+margin*2);
      }
    }
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name=="ScreenBorder")
        continue;
      if (c.state&UIFlags.INVISIBLE)
        continue;
      if (!c.recalc)
        continue;
      var ret2;
      if (__instance_of(c, UIFrame)) {
          ret2 = c.calc_dirty();
      }
      else {
        ret2 = c.last_dirty;
      }
      if (first) {
          ret[0][0] = ret2[0][0];
          ret[0][1] = ret2[0][1];
          ret[1][0] = ret2[1][0]+ret2[0][0];
          ret[1][1] = ret2[1][1]+ret2[0][1];
          first = false;
      }
      else {
        for (var i=0; i<2; i++) {
            ret[0][i] = Math.min(ret[0][i], ret2[0][i]);
            ret[1][i] = Math.max(ret[1][i], ret2[1][i]+ret2[0][i]);
        }
      }
    }
    this.abspos[0] = this.abspos[1] = 0.0;
    this.abs_transform(this.abspos);
    ret[0][0] = Math.min(Math.max(ret[0][0], this.abspos[0]), this.abspos[0]+this.size[0]);
    ret[1][0]-=ret[0][0];
    ret[1][1]-=ret[0][1];
    return ret;
  }, function build_draw(canvas, isVertical, cache_frame) {
    if (cache_frame==undefined) {
        cache_frame = undefined;
    }
    var mat=_static_mat;
    this.has_hidden_elements = false;
    this.recalc = 0;
    if (this._limit==undefined)
      this._limit = 0;
    var d=this.calc_dirty();
    this.dirty_rects.reset();
    if (this.canvas==undefined) {
        var p=this;
        while (p!=undefined&&p.canvas==undefined) {
          p = p.parent;
        }
        if (p!=undefined) {
            this.canvas = p.canvas;
            this.pack(this.canvas, false);
        }
    }
    if (this.canvas==undefined) {
        return ;
    }
    var pushed_pan_transform=false;
    var canvas=this.canvas;
    if (this.state&UIFlags.CLIP_CONTENTS) {
        canvas.push_scissor([0, 0], this.size);
    }
    try {
      if (this.state&UIFlags.HAS_PAN&&this.velpan!=undefined) {
          canvas.push_transform();
          pushed_pan_transform = true;
          canvas.translate(this.velpan.pan);
      }
    }
    catch (err) {
        print_stack(err);
    }
    if (this.draw_background) {
        canvas.simple_box([0, 0], this.size, this.bgcolor, this.rcorner);
    }
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.canvas==undefined)
        c.canvas = this.canvas;
      if (!c.recalc)
        continue;
      this.canvas.push_transform();
      this.canvas.translate(c.pos);
      c.abspos[0] = 0;
      c.abspos[1] = 0;
      c.abs_transform(c.abspos);
      if (!(__instance_of(c, UIFrame))) {
          var t=c.dirty;
          c.dirty = c.last_dirty;
          c.last_dirty = t;
          c.dirty[0][0] = c.abspos[0];
          c.dirty[0][1] = c.abspos[1];
          c.dirty[1][0] = c.size[0];
          c.dirty[1][1] = c.size[1];
      }
      try {
        c.build_draw(this.canvas, false);
      }
      catch (err) {
          print_stack(err);
      }
      this.canvas.pop_transform();
      c.recalc = false;
    }
    if (pushed_pan_transform) {
        this.canvas.pop_transform();
    }
    if (this.state&UIFlags.CLIP_CONTENTS) {
        canvas.pop_scissor();
    }
  }, function build_draw_old(canvas, isVertical, cache_frame) {
    if (cache_frame==undefined) {
        cache_frame = undefined;
    }
    var mat=_static_mat;
    this.has_hidden_elements = false;
    var d=this.calc_dirty();
    if (this.is_canvas_root()) {
        if (DEBUG.use_2d_uicanvas) {
            var __iter_c=__get_iter(this.children);
            var c;
            while (1) {
              var __ival_c=__iter_c.next();
              if (__ival_c.done) {
                  break;
              }
              c = __ival_c.value;
              if (aabb_isect_2d(c.pos, c.size, d[0], d[1])) {
                  c.do_recalc();
              }
            }
        }
        this.canvas.push_transform();
        this.canvas.translate(this.pos);
    }
    if (cache_frame==undefined) {
        cache_frame = !(this.state&UIFlags.NO_FRAME_CACHE);
    }
    if (cache_frame&&this.depth==4) {
        canvas.frame_begin(this);
    }
    if (this.parent==undefined) {
        this.abspos[0] = this.abspos[1] = 0.0;
        this.abs_transform(this.abspos);
    }
    if (this.state&UIFlags.HAS_PAN&&this.velpan!=undefined) {
        if (!(this.state&UIFlags.PAN_CANVAS_MAT)) {
            canvas.push_transform();
            canvas.translate(this.velpan.pan);
        }
    }
    if (this.pos==undefined) {
        this.pos = [0, 0];
        console.log("eek");
        console.trace();
    }
    if (this.draw_background) {
    }
    var retag_recalc=false;
    this.recalc = 0;
    var viewport=g_app_state.raster.viewport;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.abspos[0] = 0;
      c.abspos[1] = 0;
      c.abs_transform(c.abspos);
      var t=c.dirty;
      c.dirty = c.last_dirty;
      c.last_dirty = t;
      c.dirty[0][0] = c.abspos[0];
      c.dirty[0][1] = c.abspos[1];
      c.dirty[1][0] = c.size[0];
      c.dirty[1][1] = c.size[1];
      var isect=aabb_isect_2d(c.abspos, c.size, viewport[0], viewport[1]);
      var pos;
      if (this.state&UIFlags.HAS_PAN)
        pos = this.velpan.pan;
      else 
        pos = $zero_lMlJ_build_draw_old;
      isect = isect||aabb_isect_2d(c.pos, c.size, pos, this.size);
      if (!isect) {
          this.has_hidden_elements = true;
          continue;
      }
      if (c.pos==undefined) {
          c.pos = [0, 0];
          c.size = [0, 0];
          console.log("eek2");
          console.trace();
      }
      mat.makeIdentity();
      _ufbd_v1.zero();
      _ufbd_v1[0] = c.pos[0];
      _ufbd_v1[1] = c.pos[1];
      mat.translate(_ufbd_v1);
      if ((c.canvas!=undefined&&c.canvas!=this.get_canvas())||c.is_canvas_root()) {
          if (c.recalc&&!(c.packflag&PackFlags.NO_REPACK)) {
              var canvas2=c.get_canvas();
              canvas2.push_transform();
              canvas2.translate(c.pos);
              c.pack(canvas2, false);
              c.build_draw(canvas2, isVertical);
              canvas2.pop_transform();
          }
          continue;
      }
      var do_skip=!c.recalc;
      if (!(__instance_of(c, UIFrame))&&this.constructor.name!="UIMenu") {
          do_skip = !c.recalc;
      }
      if (c.recalc) {
          var r=this.recalc;
          if (c.recalc&&!(c.packflag&PackFlags.NO_REPACK))
            c.pack(canvas, false);
          canvas.push_transform(mat);
          try {
            c.build_draw(canvas, isVertical);
          }
          catch (_err) {
              print_stack(_err);
              if (c==this.modalhandler)
                c.pop_modal();
              console.log("Error occured while drawing element ", c);
          }
          canvas.pop_transform(mat);
          c.recalc = 0;
      }
    }
    if (cache_frame&&this.depth==4) {
        canvas.frame_end(this);
    }
    if (retag_recalc)
      this.do_recalc();
    if (this.state&UIFlags.HAS_PAN&&this.velpan!=undefined) {
        if (!(this.state&UIFlags.PAN_CANVAS_MAT)) {
            canvas.pop_transform();
        }
    }
    if (this.is_canvas_root()) {
        this.canvas.pop_transform();
    }
    this.dirty_rects.reset();
  }, function on_tick(pre_func) {
    if (!this.tick_timer.ready())
      return ;
    UIElement.prototype.on_tick.call(this);
    if (this.state&UIFlags.HAS_PAN&&this.valpan==undefined) {
        this.valpan = new VelocityPan();
        this.state|=UIFlags.USE_PAN;
        function recurse(f) {
          var __iter_c=__get_iter(f.children);
          var c;
          while (1) {
            var __ival_c=__iter_c.next();
            if (__ival_c.done) {
                break;
            }
            c = __ival_c.value;
            c.state|=UIFlags.USE_PAN;
            if (__instance_of(c, UIFrame))
              recurse(c);
          }
        }
        recurse(this);
    }
    if (this.velpan!=undefined) {
        this.velpan.on_tick();
    }
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      try {
        if (pre_func!=undefined)
          pre_func(c);
        c.on_tick();
        if (c.status_timer!=undefined) {
            c.inc_flash_timer();
            c.do_recalc();
        }
      }
      catch (_err) {
          print_stack(_err);
          if (c==this.modalhandler)
            c.pop_modal();
          console.log("Error occured in UIFrame.on_tick ", c);
      }
    }
  }, function pack(canvas, isVertical) {
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.recalc&&!(c.packflag&PackFlags.NO_REPACK))
        c.pack(canvas, isVertical);
    }
  }, function add_floating(e, modal, center) {
    if (modal==undefined) {
        modal = false;
    }
    if (center==undefined) {
        center = false;
    }
    var off=[e.pos[0], e.pos[1]];
    var frame=this;
    this.abs_transform(off);
    while (frame.parent!=undefined) {
      frame = frame.parent;
    }
    if (e.canvas==undefined)
      e.canvas = frame.get_canvas();
    if (center) {
    }
    e.pos[0] = off[0];
    e.pos[1] = off[1];
    frame.add(e);
    e.do_recalc();
    frame.do_full_recalc();
    if (modal) {
        frame.push_modal(e);
    }
  }]);
  var $pos_LeXa__find_active=[0, 0];
  var $zero_lMlJ_build_draw_old=[0, 0];
  _es6_module.add_class(UIFrame);
  UIFrame = _es6_module.add_export('UIFrame', UIFrame);
}, '/home/ec2-user/fairmotion/src/ui/UIFrame.js');
es6_module_define('UIPack', ["UIWidgets", "mathlib", "UIFrame", "toolprops", "UIElement"], function _UIPack_module(_es6_module) {
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var DataRefProperty=es6_import_item(_es6_module, 'toolprops', 'DataRefProperty');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var UIElement, UIFrame;
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var $_mh;
  var $_swapt;
  var UIPackFrame=_ESClass("UIPackFrame", UIFrame, [function UIPackFrame(ctx, path_prefix) {
    UIFrame.call(this, ctx);
    this.mm = new MinMax(2);
    this._last_pack_recalc = 0;
    if (path_prefix==undefined)
      path_prefix = "";
    this.path_prefix = path_prefix;
    this.min_size = undefined;
    this.last_ms = 0;
    this.last_pos = new Vector2();
    this.last_size = new Vector2();
    this.default_packflag = 0;
  }, function build_draw(canvas, isVertical) {
    if (this.is_canvas_root())
      this.pack(canvas, isVertical);
    UIFrame.prototype.build_draw.call(this, canvas, isVertical);
  }, function on_resize(newsize, oldsize) {
    UIFrame.prototype.on_resize.call(this, newsize, oldsize);
  }, function add(child, packflag) {
    if (packflag==undefined) {
        packflag = 0;
    }
    packflag|=this.default_packflag;
    UIFrame.prototype.add.call(this, child, packflag);
  }, function prepend(child) {
    child.packflag|=this.default_packflag;
    UIFrame.prototype.prepend.call(this, child);
  }, function toolwidget(path, inherit_flag, label) {
    if (inherit_flag==undefined) {
        inherit_flag = 0;
    }
    if (label==undefined) {
        label = undefined;
    }
    var ret=this.toolop(path, inherit_flag, label);
    ret.path_exec_widget = true;
    return ret;
  }, function _inherit_packflag(inherit_flag) {
    var icon_size=inherit_flag&(PackFlags.USE_LARGE_ICON|PackFlags.USE_SMALL_ICON);
    if (icon_size==0) {
        icon_size = this.default_packflag&(PackFlags.USE_LARGE_ICON|PackFlags.USE_SMALL_ICON);
    }
    inherit_flag|=this.default_packflag&~(PackFlags.USE_SMALL_ICON|PackFlags.USE_SMALL_ICON);
    inherit_flag|=icon_size;
    return inherit_flag;
  }, function toolop(path, inherit_flag, label, icon, description) {
    if (inherit_flag==undefined) {
        inherit_flag = 0;
    }
    if (label==undefined) {
        label = undefined;
    }
    if (icon==undefined) {
        icon = undefined;
    }
    if (description==undefined) {
        description = undefined;
    }
    var ctx=this.ctx;
    var opname=ctx.api.get_op_uiname(ctx, path);
    inherit_flag = this._inherit_packflag(inherit_flag);
    if (opname==undefined) {
        console.trace();
        console.log("couldn't find tool operator at path"+path+".");
        return ;
    }
    if (label!=undefined)
      opname = label;
    if (inherit_flag&PackFlags.USE_ICON) {
        var op=ctx.api.get_op(ctx, path);
        if (op==undefined) {
            console.trace();
            console.log("Error fetching operator ", path);
            var c=new UIButton(ctx, "???");
            c.packflag|=inherit_flag;
            this.add(c);
            return c;
        }
        if (DEBUG.icons)
          console.log("icon toolop", op.icon);
        icon = icon===undefined ? op.icon : icon;
        if (icon>=0) {
            var use_small=inherit_flag&PackFlags.USE_SMALL_ICON;
            var c=new UIButtonIcon(ctx, opname, icon, [0, 0], [0, 0], path, undefined, undefined, use_small);
            c.packflag|=inherit_flag;
            this.add(c);
            return c;
        }
    }
    var c=new UIButton(ctx, opname, [0, 0], [0, 0], path);
    if (inherit_flag!=undefined)
      c.packflag|=inherit_flag;
    this.add(c);
    return c;
  }, function pack(canvas, isVertical) {
    var arr=[0, 0];
    var mm=this.mm;
    if (this.state&UIFlags.HAS_PAN) {
        mm.reset();
        var __iter_c=__get_iter(this.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          arr[0] = c.pos[0]+c.size[0];
          arr[1] = c.pos[1]+c.size[1];
          mm.minmax(c.pos);
          mm.minmax(arr);
        }
        if (this.packflag&PackFlags.CALC_NEGATIVE_PAN) {
            this.pan_bounds[0] = new Vector2(mm.min).sub(mm.max).mulScalar(0.5);
            this.pan_bounds[1] = new Vector2(mm.max).sub(mm.min);
        }
        else {
          this.pan_bounds[1] = new Vector2(mm.max).sub(mm.min);
          this.pan_bounds[1][0]-=this.size[0];
          this.pan_bounds[1][1]-=this.size[1];
        }
        if (this.packflag&PackFlags.PAN_X_ONLY) {
            this.pan_bounds[0][1] = this.pan_bounds[1][1] = 0.0;
        }
        else 
          if (this.packflag&PackFlags.PAN_Y_ONLY) {
            this.pan_bounds[0][0] = this.pan_bounds[1][0] = 0.0;
        }
    }
  }, function prop(path, packflag, setter_path) {
    if (packflag==undefined) {
        packflag = 0;
    }
    if (setter_path==undefined) {
        setter_path = undefined;
    }
    packflag = this._inherit_packflag(packflag);
    if (this.path_prefix.length>0)
      path = this.path_prefix+"."+path;
    if (setter_path==undefined)
      setter_path = path;
    var ctx=this.ctx;
    var prop=ctx.api.get_prop_meta(ctx, path);
    if (prop==undefined) {
        console.trace();
        console.log("couldn't find property: "+path+".", this.path_prefix);
        return ;
    }
    if (prop.type==PropTypes.INT||prop.type==PropTypes.FLOAT) {
        var range=prop.range;
        if (prop.range==undefined||(prop.range[0]==0&&prop.range[1]==0)) {
            range = [-2000, 2000];
        }
        var c=new UINumBox(ctx, prop.uiname, range, prop.data, [0, 0], [0, 0], path);
        c.packflag = packflag;
        c.unit = prop.unit;
        c.setter_path = setter_path;
        this.add(c);
    }
    else 
      if (prop.type==PropTypes.ENUM&&(packflag&PackFlags.ENUM_STRIP)) {
        var checkmap={};
        var this2=this;
        prop.ctx = ctx;
        function update_enum(chk, val) {
          if (!val) {
              chk.set = true;
              return ;
          }
          for (var k in checkmap) {
              var check=checkmap[k];
              if (check===chk) {
                  this2.ctx.api.set_prop(this2.ctx, path, prop.keys[k]);
                  continue;
              }
              check.set = false;
              check.do_recalc();
          }
          var val=prop.values[k];
        }
        var subframe;
        if (__instance_of(this, ColumnFrame)) {
            subframe = this.col();
        }
        else {
          subframe = this.row();
        }
        subframe.packflag|=packflag|PackFlags.NO_AUTO_SPACING|PackFlags.NO_LEAD_SPACING|PackFlags.NO_TRAIL_SPACING;
        var large_icon=packflag&PackFlags.USE_LARGE_ICON;
        subframe.pad[0] = large_icon ? -4 : -2;
        subframe.pad[1] = large_icon ? -4 : -3;
        function update_callback(chk) {
          var val=undefined;
          for (var k in checkmap) {
              var check=checkmap[k];
              if (check===chk) {
                  val = k;
                  break;
              }
          }
          if (val==undefined) {
              console.log("error with ui enum strip; path:", path);
              return ;
          }
          val = ctx.api.get_prop(ctx, path)==prop.keys[val];
          if (!!val!=!!chk.set) {
              chk.set = val;
              chk.do_recalc();
          }
        }
        if (packflag&PackFlags.USE_ICON) {
            for (var k in prop.values) {
                var label=prop.ui_value_names!=undefined ? prop.ui_value_names[k] : k;
                if (label==undefined)
                  label = "(error)";
                var c=new UIIconCheck(ctx, "", prop.iconmap[prop.values[k]]);
                c.packflag|=packflag;
                c._enum_colors = true;
                c.setter_path = setter_path;
                c.callback = update_enum;
                c.icon = prop.iconmap[k];
                c.draw_check = false;
                c.update_callback = update_callback;
                c.description = label+"\n"+prop.description;
                if (prop.get_value()==prop.values[k])
                  c.set = true;
                subframe.add(c);
                checkmap[prop.values[k]] = c;
            }
        }
        else {
          for (var k in prop.values) {
              var label=prop.ui_value_names!=undefined ? prop.ui_value_names[k] : k;
              if (label==undefined)
                label = "(error)";
              var c=new UICheckBox(ctx, label);
              c.setter_path = setter_path;
              c.callback = update_enum;
              c.draw_check = false;
              c.update_callback = update_callback;
              if (prop.get_value()==prop.values[k])
                c.set = true;
              subframe.add(c);
              checkmap[prop.values[k]] = c;
          }
        }
        return subframe;
    }
    else 
      if (prop.type==PropTypes.ENUM) {
        var c=new UIMenuButton(ctx, undefined, [0, 0], [0, 0], path);
        c.setter_path = setter_path;
        c.packflag|=packflag;
        this.add(c);
        return c;
    }
    else 
      if ((prop.type==PropTypes.VEC3&&prop.subtype==PropTypes.COLOR3)||(prop.type==PropTypes.VEC4&&prop.subtype==PropTypes.COLOR4)) {
        if (packflag&PackFlags.COLOR_BUTTON_ONLY) {
            var colorb=new UIColorButton(ctx, packflag|this.default_packflag);
            colorb.state|=UIFlags.USE_PATH;
            colorb.data_path = path;
            colorb.setter_path = setter_path;
            this.add(colorb, packflag);
            return colorb;
        }
        else {
          var field=new UIColorPicker(ctx, undefined, prop.subtype==PropTypes.COLOR3 ? 3 : 4);
          field.state|=UIFlags.USE_PATH;
          field.data_path = path;
          field.setter_path = setter_path;
          this.add(field, packflag);
          return field;
        }
    }
    else 
      if (prop.type==PropTypes.VEC2) {
        range = (prop.range!=undefined&&prop.range[0]!=undefined) ? prop.range : [-2000, 2000];
        var row=this.row();
        row.packflag = packflag;
        row.label(prop.uiname);
        var c=new UINumBox(ctx, "X", range, prop.data, [0, 0], [0, 0], path+"[0]");
        c.unit = prop.unit;
        c.setter_path = setter_path+"[0]";
        c.packflag|=packflag;
        row.add(c);
        var c=new UINumBox(ctx, "Y", range, prop.data, [0, 0], [0, 0], path+"[1]");
        c.unit = prop.unit;
        c.setter_path = setter_path+"[1]";
        c.packflag|=packflag;
        row.add(c);
        return row;
    }
    else 
      if (prop.type==PropTypes.VEC3) {
        range = (prop.range!=undefined&&prop.range[0]!=undefined) ? prop.range : [-2000, 2000];
        var row=this.row();
        row.packflag = packflag;
        row.label(prop.uiname);
        var c=new UINumBox(ctx, "X", range, prop.data, [0, 0], [0, 0], path+"[0]");
        c.unit = prop.unit;
        c.setter_path = setter_path+"[0]";
        c.packflag|=packflag;
        row.add(c);
        var c=new UINumBox(ctx, "Y", range, prop.data, [0, 0], [0, 0], path+"[1]");
        c.unit = prop.unit;
        c.setter_path = setter_path+"[1]";
        c.packflag|=packflag;
        row.add(c);
        var c=new UINumBox(ctx, "Z", range, prop.data, [0, 0], [0, 0], path+"[2]");
        c.unit = prop.unit;
        c.setter_path = setter_path+"[2]";
        c.packflag|=packflag;
        row.add(c);
        return row;
    }
    else 
      if (prop.type==PropTypes.VEC4) {
        range = (prop.range!=undefined&&prop.range[0]!=undefined) ? prop.range : [-2000, 2000];
        var row=this.row();
        row.label(prop.uiname);
        var c=new UINumBox(ctx, "X", range, prop.data, [0, 0], [0, 0], path+"[0]");
        c.setter_path = setter_path+"[0]";
        c.packflag|=packflag;
        c.unit = prop.unit;
        row.add(c);
        var c=new UINumBox(ctx, "Y", range, prop.data, [0, 0], [0, 0], path+"[1]");
        c.setter_path = setter_path+"[1]";
        c.packflag|=packflag;
        c.unit = prop.unit;
        row.add(c);
        var c=new UINumBox(ctx, "Z", range, prop.data, [0, 0], [0, 0], path+"[2]");
        c.setter_path = setter_path+"[2]";
        c.packflag|=packflag;
        c.unit = prop.unit;
        row.add(c);
        var c=new UINumBox(ctx, "W", range, prop.data, [0, 0], [0, 0], path+"[3]");
        c.setter_path = setter_path+"[3]";
        c.packflag|=packflag;
        c.unit = prop.unit;
        row.add(c);
        return row;
    }
    else 
      if (prop.type==PropTypes.STRING&&(prop.flag&TPropFlags.LABEL)) {
        var ret=this.label(path, true, packflag);
        ret.setter_path = setter_path;
        return ret;
    }
    else 
      if (prop.type==PropTypes.BOOL) {
        var check;
        if (packflag&PackFlags.USE_ICON) {
            check = new UIIconCheck(ctx, "", prop.icon, undefined, undefined, path);
        }
        else {
          check = new UICheckBox(ctx, prop.uiname, undefined, undefined, path);
        }
        check.setter_path = setter_path;
        check.packflag|=packflag;
        this.add(check);
        return check;
    }
    else 
      if (prop.type==PropTypes.FLAG) {
        var row=this.row();
        row.packflag|=packflag;
        if (path.trim().endsWith("]")) {
            var s=path.trim();
            var i=s.length-1;
            while (i>=0&&s[i-1]!="[") {
              i--;
            }
            var key=s.slice(i, s.length-1).trim();
            var uiname=prop.ui_key_names[key];
            if (uiname==undefined) {
                console.log("WARNING: possibly bad flag mask (will try interpreting it as integer)", path);
                key = parseInt(key);
                uiname = prop.ui_key_names[key];
            }
            if (isNaN(parseInt(key))&&key in prop.keys) {
                key = prop.keys[key];
            }
            if (uiname==undefined)
              uiname = "(corrupted)";
            var check=new UICheckBox(ctx, uiname, undefined, undefined, path);
            this.add(check);
            if (key in prop.flag_descriptions) {
                check.description = prop.flag_descriptions[key];
            }
            check.packflag|=PackFlags.INHERIT_WIDTH;
            check.setter_path = setter_path;
            return check;
        }
        else {
          row.label(prop.uiname+":");
          for (var k in prop.keys) {
              var uiname=prop.ui_key_names[k];
              var path2=path+"["+k+"]";
              var check=new UICheckBox(ctx, uiname, undefined, undefined, path2);
              check.packflag|=PackFlags.INHERIT_WIDTH;
              check.setter_path = setter_path+"["+k+"]";
              if (k in prop.flag_descriptions) {
                  check.description = prop.flag_descriptions[k];
              }
              row.add(check);
          }
          return check;
        }
    }
    else 
      if (prop.type==PropTypes.DATAREF) {
        var c=new UIMenuButton(ctx, undefined, [0, 0], [0, 0], path);
        c.setter_path = setter_path;
        c.packflag|=packflag;
        this.add(c);
        return c;
    }
    else {
      if (1||DEBUG.ui_datapaths)
        console.log("warning: unimplemented property type for path "+path+" in user interface code");
    }
  }, function label(text, use_path, align) {
    if (use_path==undefined) {
        use_path = false;
    }
    if (align==undefined) {
        align = 0;
    }
    align = this._inherit_packflag(align);
    if (use_path!=undefined&&use_path) {
        var c=new UILabel(this.ctx, "", [0, 0], [0, 0], text);
        this.add(c);
        if (align)
          c.packflag|=align;
        return c;
    }
    else {
      var c=new UILabel(this.ctx, text, [0, 0], [0, 0], undefined);
      this.add(c);
      if (align)
        c.packflag|=align;
      return c;
    }
  }, function tabstrip(align, default_packflag) {
    if (align==undefined) {
        align = 0;
    }
    if (default_packflag==undefined) {
        default_packflag = 0;
    }
    var flip=this.default_packflag&PackFlags.FLIP_TABSTRIP;
    flip = flip||(align&PackFlags.FLIP_TABSTRIP);
    var ret=new UITabPanel(this.ctx, undefined, undefined, flip);
    ret.packflag|=align|PackFlags.INHERIT_WIDTH;
    ret.default_packflag = this._inherit_packflag(default_packflag);
    this.add(ret);
    return ret;
  }, function panel(label, permid, align, default_packflag) {
    if (align==undefined) {
        align = 0;
    }
    if (default_packflag==undefined) {
        default_packflag = 0;
    }
    align|=this.default_packflag;
    var ret=new UIPanel(this.ctx, label, permid);
    ret.packflag|=align|PackFlags.INHERIT_WIDTH;
    ret.default_packflag = this.default_packflag|default_packflag;
    this.add(ret);
    return ret;
  }, function row(path_prefix, align, default_packflag) {
    if (path_prefix==undefined) {
        path_prefix = "";
    }
    if (align==undefined) {
        align = 0;
    }
    if (default_packflag==undefined) {
        default_packflag = 0;
    }
    align|=this.default_packflag;
    var row=new RowFrame(this.ctx, this.path_prefix);
    this.add(row);
    row.default_packflag|=default_packflag|this.default_packflag;
    row.packflag|=align;
    return row;
  }, function col(path_prefix, align, default_packflag) {
    if (path_prefix==undefined) {
        path_prefix = "";
    }
    if (align==undefined) {
        align = 0;
    }
    if (default_packflag==undefined) {
        default_packflag = 0;
    }
    align|=this.default_packflag;
    var col=new ColumnFrame(this.ctx, this.path_prefix);
    this.add(col);
    col.default_packflag|=default_packflag|this.default_packflag;
    col.packflag|=align;
    return col;
  }, function on_tick() {
    UIFrame.prototype.on_tick.call(this);
    if (time_ms()-this._last_pack_recalc>300) {
        this._pack_recalc();
        this._last_pack_recalc = time_ms();
    }
  }, function _pack_recalc() {
    if (time_ms()-this.last_ms<40) {
        return ;
    }
    this.last_ms = time_ms();
    if (this.last_pos.vectorDistance(this.pos)>0.0001||this.last_size.vectorDistance(this.size)>1e-05) {
        if (DEBUG.complex_ui_recalc) {
            console.log("complex ui recalc", this.pos.toString(), this.last_pos.toString(), this.last_pos.vectorDistance(this.pos), this.last_size.vectorDistance(this.size));
        }
        this.parent.do_full_recalc();
        this.do_recalc();
        var __iter_c=__get_iter(this.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          if (!(__instance_of(c, UIFrame))) {
              c.recalc = 1;
          }
        }
        this.last_pos.load(this.pos);
        this.last_size.load(this.size);
    }
  }]);
  _es6_module.add_class(UIPackFrame);
  UIPackFrame = _es6_module.add_export('UIPackFrame', UIPackFrame);
  var RowFrame=_ESClass("RowFrame", UIPackFrame, [function RowFrame(ctx, path_prefix, align) {
    UIPackFrame.call(this, ctx, path_prefix);
    this.packflag|=PackFlags.INHERIT_HEIGHT|align;
    this.pad = [4, 4];
  }, function get_min_size(canvas, isvertical) {
    if (canvas==undefined) {
        console.trace();
        console.log("Warning: undefined canvas in get_min_size");
        return ;
    }
    var maxwidth=0;
    var tothgt=0;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      var size;
      if (!(c.packflag&PackFlags.KEEP_SIZE))
        size = c.cached_min_size(canvas, isvertical);
      else 
        size = c.size;
      tothgt+=size[1]+this.pad[1];
      maxwidth = Math.max(maxwidth, size[0]+2);
    }
    if (this.min_size!=undefined) {
        maxwidth = Math.max(maxwidth, this.min_size[0]);
        tothgt = Math.max(tothgt, this.min_size[1]);
    }
    return [Math.max(maxwidth, 1), Math.max(tothgt, 1)];
  }, function pack(canvas, is_vertical) {
    if (canvas==undefined) {
        console.trace();
        console.log("Warning: undefined canvas in pack");
        return ;
    }
    if (this.size[0]==0&&this.size[1]==0) {
        this.size[0] = this.parent.size[0];
        this.size[1] = this.parent.size[1];
    }
    var minsize=this.get_min_size(canvas, is_vertical);
    var spacing;
    if (this.packflag&PackFlags.NO_AUTO_SPACING) {
        spacing = this.pad[1];
    }
    else {
      var spacing=Math.floor((this.size[1]-minsize[1])/this.children.length);
      spacing = Math.max(spacing, this.pad[1]);
    }
    var x=0;
    var y;
    if (this.packflag&PackFlags.ALIGN_BOTTOM)
      y = this.pad[1];
    else 
      y = this.size[1]-this.pad[1];
    for (var i=0; i<this.children.length; i++) {
        var c=this.children[i];
        var size;
        if (!(c.packflag&PackFlags.KEEP_SIZE))
          size = c.cached_min_size(canvas, is_vertical);
        else 
          size = c.size;
        size = [size[0], size[1]];
        size[0] = Math.min(size[0], this.size[0]);
        if (c.packflag&PackFlags.INHERIT_WIDTH)
          size[0] = this.size[0]-2;
        if (c.packflag&PackFlags.INHERIT_HEIGHT)
          size[1]+=spacing;
        if (c.size==undefined)
          c.size = [0, 0];
        c.size[0] = size[0];
        c.size[1] = size[1];
        var final_y=y;
        if (!(this.packflag&PackFlags.ALIGN_BOTTOM))
          final_y-=size[1];
        if (this.packflag&PackFlags.ALIGN_RIGHT) {
            c.pos = [this.size[0]-size[0]-x, final_y];
        }
        else 
          if (this.packflag&PackFlags.ALIGN_LEFT) {
            c.pos = [x, final_y];
        }
        else {
          c.pos = [x+Math.floor(0.5*(this.size[0]-size[0])), final_y];
        }
        var space=(c.packflag&PackFlags.INHERIT_HEIGHT) ? 0 : spacing;
        if (this.packflag&PackFlags.ALIGN_BOTTOM)
          y+=c.size[1]+space;
        else 
          y-=c.size[1]+space;
        if (!(c.packflag&PackFlags.NO_REPACK))
          c.pack(canvas, is_vertical);
    }
    UIPackFrame.prototype.pack.call(this, canvas, is_vertical);
  }]);
  _es6_module.add_class(RowFrame);
  RowFrame = _es6_module.add_export('RowFrame', RowFrame);
  var ColumnFrame=_ESClass("ColumnFrame", UIPackFrame, [function ColumnFrame(ctx, path_prefix, align) {
    UIPackFrame.call(this, ctx, path_prefix);
    this.packflag|=PackFlags.INHERIT_WIDTH|align;
    this.pad = [2, 2];
  }, function get_min_size(canvas, isvertical) {
    if (canvas==undefined) {
        console.trace();
        console.log("Warning: undefined canvas in get_min_size");
        return ;
    }
    var maxheight=0;
    var totwid=0;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      var size;
      if (!(c.packflag&PackFlags.KEEP_SIZE))
        size = c.cached_min_size(canvas, isvertical);
      else 
        size = [c.size[0], c.size[1]];
      totwid+=size[0]+this.pad[0];
      maxheight = Math.max(maxheight, size[1]+this.pad[1]);
    }
    if (this.min_size!=undefined) {
        totwid = Math.max(totwid, this.min_size[0]);
        maxheight = Math.max(maxheight, this.min_size[1]);
    }
    return [totwid, maxheight];
  }, function pack(canvas, is_vertical) {
    if (canvas==undefined) {
        console.trace();
        console.log("Warning: undefined canvas in pack");
        return ;
    }
    if (!(this.packflag&PackFlags.ALIGN_LEFT)&&!(this.packflag&PackFlags.ALIGN_RIGHT))
      this.packflag|=PackFlags.ALIGN_CENTER;
    if (this.size[0]==0&&this.size[1]==0) {
        this.size[0] = this.parent.size[0];
        this.size[1] = this.parent.size[1];
    }
    var minsize=this.get_min_size(canvas, is_vertical);
    if (this.packflag&PackFlags.NO_AUTO_SPACING) {
        spacing = this.pad[0];
    }
    else {
      var spacing=Math.floor((this.size[0]-minsize[0])/(this.children.length));
      spacing = Math.max(spacing, this.pad[0]);
    }
    var sum=0;
    var max_wid=0;
    var max_hgt=0;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      var s;
      if (!(c.packflag&PackFlags.KEEP_SIZE))
        s = c.cached_min_size(canvas, is_vertical);
      else 
        s = [c.size[0], c.size[1]];
      max_wid = Math.max(s[0], max_wid);
      max_hgt = Math.max(s[1], max_hgt);
      sum+=s[0];
    }
    if (!(this.packflag&PackFlags.IGNORE_LIMIT))
      max_wid*=((this.size[0])/sum);
    var x;
    var y;
    if (this.packflag&PackFlags.ALIGN_BOTTOM) {
        y = this.pad[1];
    }
    else 
      if (this.packflag&PackFlags.ALIGN_TOP) {
        y = this.size[1]-max_hgt-this.pad[1];
    }
    else {
      y = (this.size[1]-max_hgt)*0.5;
    }
    var startx;
    if (this.packflag&PackFlags.NO_LEAD_SPACING)
      startx = 0;
    else 
      startx = this.pad[0];
    var do_center_post=false;
    if (this.packflag&PackFlags.ALIGN_RIGHT) {
        x = this.size[0]-startx;
    }
    else 
      if (this.packflag&PackFlags.ALIGN_LEFT) {
        x = startx;
    }
    else {
      this.packflag|=PackFlags.ALIGN_CENTER;
      x = 0;
    }
    var pad=this.pad[0];
    var finalwid=0;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      var size;
      if (!(c.packflag&PackFlags.KEEP_SIZE))
        size = c.cached_min_size(canvas, is_vertical);
      else 
        size = c.size;
      size = [size[0], size[1]];
      if (!(this.packflag&PackFlags.IGNORE_LIMIT)) {
          if (c.packflag&PackFlags.INHERIT_WIDTH)
            size[0] = Math.min(size[0], max_wid-pad)+spacing;
          else 
            size[0] = Math.min(size[0], max_wid-pad);
      }
      if (c.packflag&PackFlags.INHERIT_HEIGHT)
        size[1] = this.size[1]-this.pad[1];
      if (c.size==undefined)
        c.size = [0, 0];
      c.size[0] = size[0];
      c.size[1] = size[1];
      var space=(c.packflag&PackFlags.INHERIT_WIDTH) ? 0 : spacing;
      if (this.packflag&PackFlags.ALIGN_RIGHT) {
          c.pos = [x-size[0], y];
          finalwid = this.size[0]-x-size[0]-1;
          x-=Math.floor(size[0]+pad+space);
      }
      else {
        c.pos = [x, y];
        finalwid = x+size[0];
        x+=Math.floor(size[0]+pad+space);
      }
      if (!(c.packflag&PackFlags.NO_REPACK))
        c.pack(canvas, is_vertical);
    }
    if ((this.packflag&PackFlags.ALIGN_CENTER)&&finalwid<this.size[0]) {
        var __iter_c=__get_iter(this.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          if (this.packflag&PackFlags.ALIGN_RIGHT)
            c.pos[0]-=Math.floor((this.size[0]-finalwid)*0.5);
          else 
            c.pos[0]+=Math.floor((this.size[0]-finalwid)*0.5);
        }
    }
    UIPackFrame.prototype.pack.call(this, canvas, is_vertical);
  }]);
  _es6_module.add_class(ColumnFrame);
  ColumnFrame = _es6_module.add_export('ColumnFrame', ColumnFrame);
  var _te=0;
  var ToolOpFrame=_ESClass("ToolOpFrame", RowFrame, [function ToolOpFrame(ctx, path) {
    RowFrame.call(this, ctx, path);
    this.rebuild = true;
    this.strct = undefined;
    this.ctx = ctx;
  }, function do_rebuild(ctx) {
    var strct=this.ctx.api.get_struct(ctx, this.path_prefix);
    this.children.reset();
    if (strct==undefined)
      return ;
    this.strct = strct;
    var __iter_p=__get_iter(strct);
    var p;
    while (1) {
      var __ival_p=__iter_p.next();
      if (__ival_p.done) {
          break;
      }
      p = __ival_p.value;
      if (!(p.flag&PackFlags.UI_DATAPATH_IGNORE))
        this.prop(p.name, PackFlags.INHERIT_WIDTH);
    }
  }, function on_tick() {
    var strct=this.ctx.api.get_struct(this.ctx, this.path_prefix);
    if (strct!=this.strct) {
        this.do_rebuild(this.ctx);
        this.do_recalc();
        this.strct = strct;
    }
    RowFrame.prototype.on_tick.call(this);
  }, function build_draw(canvas, isVertical) {
    if (this.rebuild) {
        this.do_rebuild(this.ctx);
        this.rebuild = false;
    }
    canvas.simple_box([0, 0], this.size, [0.2, 0.2, 0.2, 0.1]);
    RowFrame.prototype.build_draw.call(this, canvas, isVertical);
  }]);
  _es6_module.add_class(ToolOpFrame);
  ToolOpFrame = _es6_module.add_export('ToolOpFrame', ToolOpFrame);
}, '/home/ec2-user/fairmotion/src/ui/UIPack.js');
es6_module_define('UISplitFrame', ["UIFrame", "UIPack", "UIElement"], function _UISplitFrame_module(_es6_module) {
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UISplitFrame=_ESClass("UISplitFrame", UIFrame, [function UISplitFrame(ctx, is_horizontal, canvas, path, pos, size) {
    UIFrame.call(this, ctx, canvas, path, pos, size);
    this.splits = [];
    this.horizontal = is_horizontal;
    this.state|=UIFlags.CLIP_CONTENTS;
  }, function initial() {
    var frame=new UISplitFrame(this.ctx, this.horizontal);
    this.splits.push([frame, 0.0, false, false]);
    this.add(frame);
    return frame;
  }, function split(perc1, fake, from_top, in_pixels) {
    var frame;
    if (perc1===undefined||isNaN(perc1)) {
        throw new Error("Invalid percentage "+perc1);
    }
    var frame=fake ? undefined : new UISplitFrame(this.ctx, this.horizontal);
    if (this.splits.length==0) {
        var initial=new UISplitFrame(this.ctx, this.horizontal);
        this.splits.push([initial, 0.0, false, false]);
    }
    this.splits.push([frame, perc1, from_top, in_pixels]);
    if (!fake) {
        this.add(frame);
    }
    return frame;
  }, function build_draw(canvas, is_vertical) {
    UIFrame.prototype.build_draw.call(this, canvas, is_vertical);
  }, function pack(canvas, is_vertical) {
    if (this.splits.length==0) {
        var __iter_c=__get_iter(this.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          let minsize=c.get_min_size(canvas, is_vertical);
          if (c.packflag&PackFlags.INHERIT_WIDTH)
            c.size[0] = this.size[0];
          else 
            c.size[0] = minsize[0];
          if (c.packflag&PackFlags.INHERIT_HEIGHT)
            c.size[1] = this.size[1];
          else 
            c.size[1] = minsize[1];
        }
        UIFrame.prototype.pack.call(this, canvas, is_vertical);
        return ;
    }
    let size=this.horizontal ? this.size[0] : this.size[1];
    function get_perc(split) {
      let p=split[1];
      if (split[3])
        p/=size;
      if (split[2])
        p = 1.0-p;
      return p;
    }
    this.splits.sort((a, b) => get_perc(a)-get_perc(b));
    for (let i=0; i<this.splits.length; i++) {
        let split=this.splits[i];
        let frame=split[0], perc1=get_perc(split);
        let perc2=i<this.splits.length-1 ? get_perc(this.splits[i+1]) : 1.0;
        if (frame===undefined) {
            continue;
        }
        let a=this.horizontal^1;
        frame.pos[a^1] = 0;
        frame.pos[a] = this.size[a]*perc1;
        frame.size[a^1] = this.size[a^1];
        frame.size[a] = this.size[a]*perc2-frame.pos[a];
    }
    UIFrame.prototype.pack.call(this, canvas, is_vertical);
  }]);
  _es6_module.add_class(UISplitFrame);
  UISplitFrame = _es6_module.add_export('UISplitFrame', UISplitFrame);
}, '/home/ec2-user/fairmotion/src/ui/UISplitFrame.js');
es6_module_define('icon', [], function _icon_module(_es6_module) {
  "use strict";
  var $ret_ZRLM_enum_to_xy;
  var IconManager=_ESClass("IconManager", [function IconManager(gl, sheet_path, imgsize, iconsize) {
    this.path = sheet_path;
    this.size = new Vector2(imgsize);
    this.cellsize = new Vector2(iconsize);
    this.load(gl);
    this.texture = undefined;
    this.ready = false;
  }, function load(gl) {
    this.tex = {}
    this.tex.image = new Image();
    this.tex.image.src = this.path;
    this.te = {}
    var thetex=this.tex;
    var this2=this;
    this.tex.image.onload = function() {
      var tex=thetex;
      this2.ready = true;
    }
  }, function get_tile(tile) {
    var ret=[];
    this.gen_tile(tile, ret);
    return ret;
  }, function enum_to_xy(tile) {
    var size=this.size;
    var cellsize=this.cellsize;
    var fx=Math.floor(size[0]/cellsize[0]);
    var y=Math.floor(tile/fx);
    var x=tile%fx;
    x*=cellsize[0];
    y*=cellsize[1];
    $ret_ZRLM_enum_to_xy[0] = x;
    $ret_ZRLM_enum_to_xy[1] = y;
    return $ret_ZRLM_enum_to_xy;
  }, function gen_tile(tile, texcos) {
    var size=this.size;
    var cellsize=this.cellsize;
    var fx=Math.floor(size[0]/cellsize[0]);
    var y=Math.floor(tile/fx);
    var x=tile%fx;
    x = (x*cellsize[0])/size[0];
    y = (y*cellsize[1])/size[1];
    var u=1.0/size[0], v=1.0/size[1];
    u*=cellsize[0];
    v*=cellsize[1];
    y+=v;
    texcos.push(x);
    texcos.push(y);
    texcos.push(x);
    texcos.push(y-v);
    texcos.push(x+u);
    texcos.push(y-v);
    texcos.push(x);
    texcos.push(y);
    texcos.push(x+u);
    texcos.push(y-v);
    texcos.push(x+u);
    texcos.push(y);
  }]);
  var $ret_ZRLM_enum_to_xy=[0, 0];
  _es6_module.add_class(IconManager);
  IconManager = _es6_module.add_export('IconManager', IconManager);
  var icon_vshader="\n\n";
  var icon_fshader="\n";
}, '/home/ec2-user/fairmotion/src/ui/icon.js');
es6_module_define('UIWidgets', ["UIElement", "toolprops", "../editors/viewport/events", "units", "mathlib", "UIFrame"], function _UIWidgets_module(_es6_module) {
  var $_mh;
  var $_swapt;
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var Unit=es6_import_item(_es6_module, 'units', 'Unit');
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var DataRefProperty=es6_import_item(_es6_module, 'toolprops', 'DataRefProperty');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var KeyMap=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, '../editors/viewport/events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../editors/viewport/events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'EventHandler');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIHoverHint=es6_import_item(_es6_module, 'UIElement', 'UIHoverHint');
  var inrect_2d_button=es6_import_item(_es6_module, 'UIElement', 'inrect_2d_button');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIButtonAbstract=_ESClass("UIButtonAbstract", UIHoverHint, [function UIButtonAbstract(ctx, path, pos, size) {
    if (path==undefined) {
        path = undefined;
    }
    if (pos==undefined) {
        pos = undefined;
    }
    if (size==undefined) {
        size = undefined;
    }
    UIHoverHint.call(this, ctx, path, pos, size);
    this.text_size = undefined;
    this.can_pan = true;
    this.clicked = false;
    this.click_on_down = false;
    this.modal_click = undefined;
    this.was_touch = false;
    this.start_mpos = new Vector2();
  }, function on_click(event) {
  }, function on_mousedown(event) {
    if (!this.clicked) {
        this.was_touch = g_app_state.was_touch;
        this.modal_click = !this.click_on_down||this.was_touch;
        this.start_mpos.load([event.x, event.y]);
        if (event.button==0&&!this.clicked) {
            if (this.modal_click)
              this.parent.push_modal(this);
            this.stop_hover();
            this.clicked = true;
            this.do_recalc();
            if (!this.was_touch&&this.click_on_down) {
                this.on_click(event);
            }
        }
    }
    else {
      if (this.parent.modalhandler==this) {
          this.parent.pop_modal();
      }
    }
  }, function on_mouseup(event) {
    if (event.button==0&&this.clicked) {
        if (this.modal_click)
          this.parent.pop_modal();
        this.modal_click = false;
        this.clicked = false;
        this.do_recalc();
        var click=this.was_touch||!this.click_on_down;
        if (click) {
            this.on_click(event);
        }
    }
  }, function on_mousemove(event) {
    if (!this.clicked) {
        this.start_hover();
    }
    if (this.can_pan&&this.was_touch) {
        var mpos=[event.x, event.y];
        var dis=this.start_mpos.vectorDistance(mpos);
        if (dis>60) {
            if (this.clicked&&this.modal_click)
              this.parent.pop_modal();
            this.modal_click = false;
            this.stop_hover();
            this.clicked = false;
            this.do_recalc();
            this.start_pan([event.x, event.y]);
        }
    }
  }]);
  _es6_module.add_class(UIButtonAbstract);
  UIButtonAbstract = _es6_module.add_export('UIButtonAbstract', UIButtonAbstract);
  var UIButton=_ESClass("UIButton", UIButtonAbstract, [function UIButton(ctx, text, pos, size, path, callback, hint) {
    if (path==undefined) {
        path = undefined;
    }
    if (callback==undefined) {
        callback = undefined;
    }
    if (hint==undefined) {
        hint = undefined;
    }
    UIButtonAbstract.call(this, ctx, path, pos, size);
    this.clicked = false;
    this.text = text;
    this.hint = hint;
    this.path_exec_widget = false;
    this.callback = callback;
    this._do_err_on_draw = false;
  }, function get_hint() {
    var ctx=this.ctx;
    if (this.hint!=undefined) {
        return this.hint;
    }
    else 
      if (this.state&UIFlags.USE_PATH) {
        var op=this.ctx.api.get_op(this.ctx, this.data_path);
        if (op==undefined)
          return undefined;
        var hotkey=ctx.api.get_op_keyhandler(ctx, this.data_path);
        var ret=op.description==undefined ? "" : op.description;
        if (hotkey!=undefined) {
            if (ret!="")
              ret+="\n";
            ret+="      Hotkey: "+hotkey.build_str(true)+"  ";
        }
        return ret=="" ? undefined : ret;
    }
  }, function on_click(event) {
    if (this.callback!=undefined) {
        this.callback(this);
    }
    if (this.state&UIFlags.USE_PATH) {
        if (this.path_exec_widget) {
            var ctx=this.ctx;
            if (ctx.view2d.manipulators.active)
              ctx.view2d.manipulators.active.end();
            var op=this.ctx.api.get_op(ctx, this.data_path);
            if (op!=undefined) {
                op.constructor.create_widgets(ctx.view2d.manipulators, ctx);
            }
        }
        else {
          this.ctx.api.call_op(this.ctx, this.data_path);
        }
    }
  }, function build_draw(canvas) {
    canvas.begin(this);
    if (this._do_err_on_draw) {
        throw new Error("test exception");
    }
    if (!(this.state&UIFlags.ENABLED))
      canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
    else 
      if (this.clicked)
      canvas.invbox([0, 0], this.size);
    else 
      if (this.state&UIFlags.HIGHLIGHT)
      canvas.hlightbox([0, 0], this.size);
    else 
      canvas.box([0, 0], this.size);
    var tsize=canvas.textsize(this.text, this.text_size);
    if (tsize[0]<this.size[0])
      canvas.text([(this.size[0]-tsize[0])*0.5, (this.size[1]-tsize[1])*0.5], this.text, uicolors["BoxText"], this.text_size);
    else 
      canvas.text([5, (this.size[1]-tsize[1])*0.5], this.text, uicolors["BoxText"], this.text_size);
    canvas.end(this);
  }, function get_min_size(canvas, isvertical) {
    return (($_mh = objcache.array(2)), ($_mh[0] = (canvas.textsize(this.text, this.text_size)[0]+12)), ($_mh[1] = (26)), $_mh);
  }]);
  _es6_module.add_class(UIButton);
  UIButton = _es6_module.add_export('UIButton', UIButton);
  var $pos_WvII_build_draw;
  var $high_clr_zrPu_build_draw;
  var $size_6NMR_build_draw;
  var $inset_clr_jySW_build_draw;
  var UIButtonIcon=_ESClass("UIButtonIcon", UIButton, [function UIButtonIcon(ctx, text, icon, pos, size, path, callback, hint, use_small_icon) {
    if (path==undefined) {
        path = undefined;
    }
    if (callback==undefined) {
        callback = undefined;
    }
    if (hint==undefined) {
        hint = undefined;
    }
    if (use_small_icon==undefined) {
        use_small_icon = false;
    }
    UIButton.call(this, ctx, text, pos, size, path, callback, hint);
    this.icon = icon;
    this.small_icon = use_small_icon;
    this.bgmode = "button";
    this.pad = 2;
    this._min_size = [0, 0];
  }, function get_min_size(canvas, isvertical) {
    var ret=this._min_size;
    var pad=this.pad;
    if (this.small_icon)
      pad+=4;
    var iconsheet=this.small_icon ? canvas.iconsheet16 : canvas.iconsheet;
    ret[0] = iconsheet.cellsize[0]+pad*2.0;
    ret[1] = iconsheet.cellsize[1]+pad*2.0;
    return ret;
  }, function get_hint() {
    var ret=UIButton.prototype.get_hint.call(this);
    if (this.text)
      ret = "%b"+this.text+"%/b \n\n"+ret;
    return ret;
  }, function build_draw(canvas) {
    if (this._do_err_on_draw) {
        throw new Error("test exception");
    }
    canvas.begin(this);
    if (this.icon==-1) {
        if (!(this.state&UIFlags.ENABLED))
          canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
        else 
          if (this.clicked)
          canvas.box($pos_WvII_build_draw, $size_6NMR_build_draw, uicolors["IconInv"]);
        else 
          if (this.state&UIFlags.HIGHLIGHT)
          canvas.box($pos_WvII_build_draw, $size_6NMR_build_draw, uicolors["HighlightIcon"]);
        else 
          canvas.box($pos_WvII_build_draw, this.size, uicolors["IconBox"]);
        return ;
    }
    var pad=this.pad;
    var isize=this.small_icon ? canvas.iconsheet16.cellsize : canvas.iconsheet.cellsize;
    if (isize[0]>this.size[0])
      $pos_WvII_build_draw[0] = 1;
    else 
      $pos_WvII_build_draw[0] = 1;
    $pos_WvII_build_draw[1] = 0;
    var $size_6NMR_build_draw=this.size;
    if (this.bgmode=="button") {
        if (!(this.state&UIFlags.ENABLED))
          canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
        else 
          if (this.clicked)
          canvas.box($pos_WvII_build_draw, $size_6NMR_build_draw, uicolors["IconInv"]);
        else 
          if (this.state&UIFlags.HIGHLIGHT)
          canvas.box($pos_WvII_build_draw, $size_6NMR_build_draw, uicolors["HighlightIcon"]);
        else 
          canvas.box($pos_WvII_build_draw, this.size, uicolors["IconBox"]);
    }
    else 
      if (this.bgmode=="flat") {
        if (!(this.state&UIFlags.ENABLED))
          canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
        else 
          if (this.clicked)
          canvas.box($pos_WvII_build_draw, $size_6NMR_build_draw, $inset_clr_jySW_build_draw);
        else 
          if (this.state&UIFlags.HIGHLIGHT)
          canvas.box($pos_WvII_build_draw, $size_6NMR_build_draw, $high_clr_zrPu_build_draw);
    }
    if ($size_6NMR_build_draw[0]>isize[0])
      $pos_WvII_build_draw[0]+=($size_6NMR_build_draw[0]-isize[0])*0.5;
    if ($size_6NMR_build_draw[1]>isize[1])
      $pos_WvII_build_draw[1]+=($size_6NMR_build_draw[1]-isize[1])*0.5;
    if (this.small_icon)
      canvas.icon(this.icon, $pos_WvII_build_draw, 0.75, true);
    else 
      canvas.icon(this.icon, $pos_WvII_build_draw, 0.75, false);
    canvas.end(this);
  }]);
  var $pos_WvII_build_draw=[0, 0];
  var $high_clr_zrPu_build_draw=[0.9, 0.9, 0.9, 0.2];
  var $size_6NMR_build_draw=[0, 0];
  var $inset_clr_jySW_build_draw=[0.3, 0.3, 0.3, 0.2];
  _es6_module.add_class(UIButtonIcon);
  UIButtonIcon = _es6_module.add_export('UIButtonIcon', UIButtonIcon);
  var UIMenuButton=_ESClass("UIMenuButton", UIButtonAbstract, [function UIMenuButton(ctx, menu, pos, size, path, description) {
    if (description==undefined) {
        description = "";
    }
    UIButtonAbstract.call(this, ctx, path);
    this.menu = menu;
    this.click_on_down = true;
    this.description = "";
    this.ctx = ctx;
    this.text = "";
    this.val = 0;
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    if (size!=undefined) {
        this.size[0] = size[0];
        this.size[1] = size[1];
    }
    this.callback = undefined;
    this.prop = undefined;
    if (this.state&UIFlags.USE_PATH) {
        this.build_menu();
    }
    else {
      var subcallback=menu.callback;
      var this2=this;
      function callback(entry, id) {
        this2.text = entry.label;
        this2.do_recalc();
        subcallback(entry, id);
      }
      menu.callback = callback;
    }
  }, function on_tick() {
    UIHoverHint.prototype.on_tick.call(this);
    if (this.state&UIFlags.USE_PATH) {
        var val=this.get_prop_data();
        if (!(this.state&UIFlags.ENABLED))
          return ;
        if (val==undefined&&this.prop.type!=PropTypes.DATAREF)
          val = "(undefined)";
        if (val!=this.val) {
            this.val = val;
            if (this.prop.type==PropTypes.DATAREF)
              this.text = val!=undefined ? val.name : "(undefined)";
            else 
              if (this.prop.ui_value_names!=undefined&&this.prop.ui_value_names[val]!=undefined)
              this.text = this.prop.ui_value_names[val];
            else 
              this.text = val.toString();
            if (!DEBUG.data_api_timing)
              this.do_recalc();
        }
    }
    if (this.menu!=undefined&&this.menu.closed) {
        if (this.clicked) {
            this.do_recalc();
        }
        this.clicked = false;
    }
  }, function _build_menu_dataref(ctx, prop, menu) {
    var lists=[];
    var __iter_type=__get_iter(prop.types);
    var type;
    while (1) {
      var __ival_type=__iter_type.next();
      if (__ival_type.done) {
          break;
      }
      type = __ival_type.value;
      lists.push(ctx.datalib.get_datalist(type));
    }
    var blocks=[];
    var __iter_list=__get_iter(lists);
    var list;
    while (1) {
      var __ival_list=__iter_list.next();
      if (__ival_list.done) {
          break;
      }
      list = __ival_list.value;
      var __iter_block=__get_iter(list);
      var block;
      while (1) {
        var __ival_block=__iter_block.next();
        if (__ival_block.done) {
            break;
        }
        block = __ival_block.value;
        blocks.push(block);
      }
    }
    blocks.sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
    var __iter_b=__get_iter(blocks);
    var b;
    while (1) {
      var __ival_b=__iter_b.next();
      if (__ival_b.done) {
          break;
      }
      b = __ival_b.value;
      menu.add_item(b.name, "", b.lib_id);
    }
  }, function build_menu() {
    var this2=this;
    function callback(entry, id) {
      this2.val = id;
      if (this2.prop==undefined)
        return ;
      if (this2.prop.type==PropTypes.DATAREF) {
          var image=this2.ctx.datalib.images.get(id);
          this2.text = image.name;
          this2.set_prop_data(image);
      }
      else {
        this2.text = this2.prop.ui_value_names[this2.val];
        this2.set_prop_data(this2.val);
      }
      this2.clicked = false;
      this2.do_recalc();
    }
    var menu=new UIMenu("", callback);
    this.prop = this.ctx.api.get_prop_meta(this.ctx, this.data_path);
    if (this.prop.type==PropTypes.DATAREF) {
        this._build_menu_dataref(this.ctx, this.prop, menu);
    }
    else 
      if (this.prop.type==PropTypes.ENUM) {
        for (var k in this.prop.ui_value_names) {
            var hotkey;
            if (this.prop.hotkey_ref!=undefined) {
                hotkey = this.prop.hotkey_ref.build_str();
            }
            else {
              hotkey = "";
            }
            menu.add_item(this.prop.ui_value_names[k], hotkey, k);
        }
    }
    this.menu = menu;
  }, function on_click(event) {
    if (this.state&UIFlags.USE_PATH) {
        var prop=this.ctx.api.get_prop_meta(this.ctx, this.data_path);
        if (prop!=undefined&&prop.type==PropTypes.DATAREF) {
            this.build_menu();
        }
    }
    var canvas=this.get_canvas();
    var viewport=canvas.viewport;
    var menu=this.menu;
    var vx=g_app_state.screen.size[0];
    var vy=g_app_state.screen.size[1];
    menu.minwidth = this.size[0];
    menu.packmenu(canvas);
    var off=[0, Math.floor(this.size[1]-3)];
    if (this.abspos[1]+off[1]+menu.size[1]>vy) {
        off = [0, -menu.size[1]];
    }
    this.call_menu(menu, off, this.size[0]);
  }, function build_draw(canvas) {
    canvas.begin(this);
    if (!(this.state&UIFlags.ENABLED))
      canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
    else 
      if (this.clicked)
      canvas.invbox([0, 0], this.size);
    else 
      if (this.state&UIFlags.HIGHLIGHT)
      canvas.hlightbox([0, 0], this.size);
    else 
      canvas.box([0, 0], this.size);
    var siz=this.size[1]/2.5;
    var p=3;
    var tsize=canvas.textsize(this.text, this.text_size);
    var x=Math.floor((this.size[0]-tsize[0]-siz-p*3)/2);
    var y=Math.floor((this.size[1]-tsize[1])/4);
    if (!this.clicked)
      canvas.text([x, y], this.text, uicolors["BoxText"], this.text_size);
    var clr=uicolors["Arrow"];
    var x=this.size[0]-siz-p*3, y=this.size[1]-siz*1.5-p;
    canvas.line([x-p*2, 2, 0], [x-p*2, this.size[1]-1, 0], clr, clr, 2.0);
    canvas.tri([x, y, 0], [x+siz, y, 0], [x+siz/2, y+siz, 0], clr);
    canvas.end(this);
  }, function get_min_size(canvas, isvertical) {
    if (this.menu!=undefined) {
        this.menu.packmenu(canvas);
        var size=(($_mh = objcache.array(2)), ($_mh[0] = (canvas.textsize(this.text+"     ")[0])), ($_mh[1] = (26)), $_mh);
        var __iter_c=__get_iter(this.menu.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          var size2=c.get_min_size(canvas, isvertical);
          size[0] = Math.max(size[0], size2[0]);
          size[1] = Math.max(size[1], size2[1]);
        }
        return (($_mh = objcache.array(2)), ($_mh[0] = (size[0]+canvas.textsize("     ")[0]+20)), ($_mh[1] = (26)), $_mh);
    }
    else {
      return (($_mh = objcache.array(2)), ($_mh[0] = (canvas.textsize(this.text+"     ")[0]+20)), ($_mh[1] = (26)), $_mh);
    }
  }]);
  _es6_module.add_class(UIMenuButton);
  UIMenuButton = _es6_module.add_export('UIMenuButton', UIMenuButton);
  var UICheckBox=_ESClass("UICheckBox", UIHoverHint, [function UICheckBox(ctx, text, pos, size, path, use_check) {
    if (use_check==undefined) {
        use_check = true;
    }
    UIHoverHint.call(this, ctx, path);
    this.draw_check = use_check;
    this.ctx = ctx;
    this.set = false;
    this.mdown = false;
    this.text = text;
    this.update_callback = undefined;
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    if (size!=undefined) {
        this.size[0] = size[0];
        this.size[1] = size[1];
    }
    this.callback = undefined;
    this.update_callback = undefined;
    this.prop = undefined;
    if (this.state&UIFlags.USE_PATH) {
        this.prop = this.get_prop_meta();
    }
  }, function on_tick() {
    UIHoverHint.prototype.on_tick.call(this);
    if (!this.mdown&&this.update_callback!=undefined) {
        this.update_callback(this);
    }
    else 
      if (!this.mdown&&(this.state&UIFlags.USE_PATH)) {
        var val=this.get_prop_data();
        if (!(this.state&UIFlags.ENABLED))
          return ;
        if (!!val!=!!this.set) {
            this.set = !!val;
            if (!DEBUG.data_api_timing)
              this.do_recalc();
        }
    }
  }, function on_mousemove(event) {
    if (!this.mdown) {
        this.start_hover();
    }
  }, function on_mousedown(event) {
    if (event.button==0&&!this.mdown) {
        this.push_modal();
        this.stop_hover();
        this.mdown = true;
        this.set^=true;
        if (this.callback!=undefined)
          this.callback(this, this.set);
        if (this.state&UIFlags.USE_PATH) {
            console.log("prop set!", this.setter_path, this.set, "|");
            this.set_prop_data(this.set);
        }
        this.do_recalc();
    }
  }, function on_mouseup(event) {
    if (this.mdown) {
        this.pop_modal();
        this.mdown = false;
        if (this.callback!=undefined) {
            this.callback(this, this.set);
        }
    }
  }, function build_draw(canvas) {
    canvas.begin(this);
    var csize=[20, 20];
    var this2=this;
    function draw_check() {
      var h1=7;
      var h2=-3;
      var ox=5;
      var r=20;
      var v1=[0+ox, h1, 0];
      var v2=[10+ox, 5+h2, 0];
      var v3=[10+ox, 10+h2, 0];
      var v4=[0+ox, h1+5, 0];
      var clr=this2.state&UIFlags.ENABLED ? uicolors["Check"] : uicolors["DisabledBox"];
      canvas.quad_aa(v1, v2, v3, v4, clr);
      var v1=[5+ox, h1+2, 0];
      var v2=[10+ox, h1, 0];
      var v3=[15+ox, h1+15, 0];
      var v4=[10+ox, h1+15, 0];
      canvas.quad_aa(v1, v2, v3, v4, clr);
    }
    if (!(this.state&UIFlags.ENABLED)) {
        canvas.box([2, 0], [csize[0], csize[1]], this.do_flash_color(uicolors["DisabledBox"]));
        if (this.draw_check)
          draw_check();
    }
    else 
      if ((this.state&UIFlags.HIGHLIGHT)&&this.draw_check) {
        canvas.simple_box([2, 0], [this.size[0], csize[1]]);
        var mul=this.set ? 1.0 : 0.3;
        canvas.hlightbox([0, 0], csize, mul, 2);
        if (this.set)
          draw_check();
    }
    else 
      if (this.set) {
        canvas.invbox([2, 0], csize, undefined, 2);
        if (this.draw_check)
          draw_check();
    }
    else {
      canvas.box([2, 0], csize, undefined, 2);
    }
    let text1=this.text!==undefined ? this.text : "(error)";
    var tsize=canvas.textsize(text1);
    canvas.text([csize[0]+5, (this.size[1]-tsize[1])*0.25], text1);
    canvas.end(this);
  }, function get_min_size(canvas, isvertical) {
    let text=this.text!==undefined ? this.text : "(error)";
    return (($_mh = objcache.array(2)), ($_mh[0] = (canvas.textsize(text)[0]+22)), ($_mh[1] = (22)), $_mh);
  }]);
  _es6_module.add_class(UICheckBox);
  UICheckBox = _es6_module.add_export('UICheckBox', UICheckBox);
  var UINumBox=_ESClass("UINumBox", UIHoverHint, [function UINumBox(ctx, text, range, val, pos, size, path) {
    if (range==undefined) {
        range = [0, 100];
    }
    if (val==undefined) {
        val = range[0];
    }
    if (pos==undefined) {
        pos = [0, 0];
    }
    if (size==undefined) {
        size = [1, 1];
    }
    if (path==undefined) {
        path = undefined;
    }
    UIHoverHint.call(this, ctx, path);
    this.unit = undefined;
    this.clicked = false;
    this.range = range;
    this.val = val;
    this.start_val;
    this.ctx = ctx;
    this.set = true;
    this.text = text;
    this.is_int = false;
    this.slide_power = 2.0;
    this.slide_mul = 1.0;
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    if (size!=undefined) {
        this.size[0] = size[0];
        this.size[1] = size[1];
    }
    this.callback = undefined;
    this.start_mpos = [0, 0];
    if (this.state&UIFlags.USE_PATH) {
        var prop=this.get_prop_meta(ctx);
        if (prop.type==PropTypes.INT) {
            this.is_int = true;
        }
    }
  }, function set_val(val) {
    this.val = val;
    this.val = Math.min(Math.max(this.val, this.range[0]), this.range[1]);
    if (this.state&UIFlags.USE_PATH) {
        this.set_prop_data(this.val);
    }
    this.do_recalc();
  }, function on_mousedown(event) {
    var numbox=this;
    if (event.button==0&&!this.clicked&&!event.shiftKey) {
        if (this.state&UIFlags.USE_PATH) {
            this.set_prop_data(this.val, true);
        }
        this.push_modal();
        this.start_mpos = [event.x, event.y];
        this.start_val = this.val;
        this.stop_hover();
        this.clicked = true;
        this.do_recalc();
    }
    else 
      if (event.button==2&&!this.clicked) {
        var this2=this;
        function callback(entry, id) {
          if (id==0) {
              this2.swap_textbox();
          }
        }
        var menu=new UIMenu("", callback);
        menu.add_item("Manual input", "", 0);
        this.call_menu(menu);
    }
    else 
      if (event.shiftKey) {
        this.swap_textbox();
    }
  }, function swap_textbox() {
    var numbox=this;
    function unit_error(numbox) {
      console.log(["numbox error", numbox]);
      numbox.flash(UIFlags.REDERROR);
      numbox.do_recalc();
    }
    function on_end_edit(tbox, cancelled) {
      let text=tbox.text;
      tbox.parent.replace(tbox, numbox);
      numbox.set_val(Unit.parse(text, numbox.val, unit_error, numbox, numbox.unit));
    }
    var unit=this.unit;
    var valstr=Unit.gen_string(this.val, unit);
    var textbox=new UITextBox(this.ctx, valstr, this.pos, this.size);
    textbox.packflag|=PackFlags.NO_REPACK;
    this.parent.do_full_recalc();
    this.parent.replace(this, textbox);
    textbox.begin_edit(event);
    textbox.set_cursor();
    window.setTimeout(() => textbox.select_all(), 0);
    textbox.on_end_edit = on_end_edit;
  }, function on_mouseup(event) {
    if (this.clicked&&event.button==0) {
        this.pop_modal();
        this.clicked = false;
        var limit=g_app_state.was_touch ? 5 : 1;
        if (Math.abs(this.start_mpos[0]-event.x)<=limit&&Math.abs(this.start_mpos[1]-event.y)<=limit) {
            var df=Math.min((this.range[1]-this.range[0])*0.1, 1.0);
            if (event.x<this.size[0]/2.0) {
                df = -df;
            }
            this.val+=df;
            this.val = Math.min(Math.max(this.val, this.range[0]), this.range[1]);
        }
        if (this.callback!=undefined) {
            this.callback(this, this.val);
        }
        if (this.state&UIFlags.USE_PATH) {
            this.set_prop_data(this.val, false);
        }
        this.do_recalc();
    }
  }, function on_tick() {
    UIHoverHint.prototype.on_tick.call(this);
    if (this.state&UIFlags.USE_PATH) {
        var val=this.get_prop_data();
        if (!(this.state&UIFlags.ENABLED))
          return ;
        if (isNaN(val)||val=="NaN") {
            return ;
        }
        if (val!=this.val) {
            this.val = val;
            if (this.callback!=undefined) {
                this.callback(this, this.val);
            }
            if (!DEBUG.data_api_timing)
              this.do_recalc();
        }
    }
  }, function on_mousemove(event) {
    var mpos=(($_mh = objcache.array(2)), ($_mh[0] = (event.x)), ($_mh[1] = (event.y)), $_mh);
    if (this.clicked) {
        var df=(mpos[0]-this.start_mpos[0])/300.0;
        var sign=df<0.0 ? -1.0 : 1.0;
        if (!this.is_int) {
            var odf=df;
            df = Math.pow(df, this.slide_power)*this.slide_mul;
            if (df==NaN)
              df = odf*odf;
            df*=sign;
        }
        df*=this.range[1]-this.range[0];
        this.val = this.start_val+df;
        this.val = Math.min(Math.max(this.val, this.range[0]), this.range[1]);
        if (this.is_int)
          this.val = Math.floor(this.val);
        this.do_recalc();
        if (this.state&UIFlags.USE_PATH) {
            this.set_prop_data(this.val, false);
        }
        if (this.callback!=undefined) {
            this.callback(this, this.val);
        }
    }
    else {
      this.start_hover();
    }
  }, function build_draw(canvas) {
    canvas.begin(this);
    var clr=uicolors["Box"];
    if (!(this.state&UIFlags.ENABLED))
      canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
    else 
      if (this.clicked)
      canvas.invbox([0, 0], this.size);
    else 
      if (!(this.state&UIFlags.FLASH)&&(this.state&UIFlags.HIGHLIGHT))
      canvas.hlightbox([0, 0], this.size, this.do_flash_color());
    else 
      canvas.box([0, 0], this.size, this.do_flash_color(clr));
    var unit=this.unit;
    var valstr=this.is_int ? this.val.toString() : Unit.gen_string(this.val, unit);
    var str=this.text+" "+valstr;
    var pad=15;
    while (str.length>1&&canvas.textsize(str)[0]>this.size[0]-pad*2) {
      str = str.slice(0, str.length-1);
    }
    var tsize=canvas.textsize(str);
    pad = (this.size[0]-tsize[0])*0.5;
    canvas.text([pad, 0.25*(this.size[1]-tsize[1])+1], str, uicolors["BoxText"]);
    var siz=this.size[1]/2.0;
    var x=4, y=(this.size[1]-siz)/2;
    var clr=uicolors["Arrow"];
    canvas.tri([x+siz/2, y, 0], [x+siz/2, y+siz, 0], [x, y+siz/2, 0], clr);
    x = this.size[0]-siz*0.5-3;
    y = (this.size[1]-siz)/2;
    canvas.tri([x-siz/2, y, 0], [x-siz/2, y+siz, 0], [x, y+siz/2, 0], clr);
    canvas.end(this);
  }, function get_min_size(canvas, isvertical) {
    return (($_mh = objcache.array(2)), ($_mh[0] = (canvas.textsize(this.text)[0]+70)), ($_mh[1] = (26)), $_mh);
  }]);
  _es6_module.add_class(UINumBox);
  UINumBox = _es6_module.add_export('UINumBox', UINumBox);
  var UILabel=_ESClass("UILabel", UIElement, [function UILabel(ctx, text, pos, size, path) {
    UIElement.call(this, ctx, path);
    this.start_mpos = new Vector2();
    this.prop = undefined;
    this.val = text;
    this.text = text;
    this.bgcolor = undefined;
    this.color = undefined;
    this.did_modal = false;
    this.clicked = false;
    this.was_touch = false;
    if (this.state&UIFlags.USE_PATH) {
        this.prop = ctx.api.get_prop_meta(ctx, this.data_path);
        this.val = this.prop.data;
        this.text = this.prop.uiname+": ";
    }
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    if (size!=undefined) {
        this.size[0] = size[0];
        this.size[1] = size[1];
    }
    this.callback = undefined;
  }, function set_background(color) {
    this.bgcolor = new Vector4(color);
    this.do_recalc();
  }, function set_color(color) {
    this.color = new Vector4(color);
    this.do_recalc();
  }, function set_text(text) {
    if (this.text!=text)
      this.do_recalc();
    this.text = text;
  }, function on_tick() {
    UIElement.prototype.on_tick.call(this);
    if (this.state&UIFlags.USE_PATH) {
        var val=this.get_prop_data();
        if (!(this.state&UIFlags.ENABLED))
          return ;
        if (val!=this.val) {
            this.val = val;
            this.text = this.prop.uiname+": "+val.toString();
            if (!DEBUG.data_api_timing)
              this.do_recalc();
        }
    }
  }, function on_mousemove(event) {
    var dis=this.start_mpos.vectorDistance([event.x, event.y]);
    if (this.clicked) {
        var dis=this.start_mpos.vectorDistance([event.x, event.y]);
        console.log("-dis", dis, event.x, event.y, this.start_mpos[0], this.start_mpos[1]);
        if (dis>4) {
            if (this.did_modal) {
                this.pop_modal();
                this.did_modal = false;
            }
            this.clicked = false;
            this.start_pan(this.start_mpos, 0, [event.x, event.y]);
        }
    }
    else {
    }
    UIElement.prototype.on_mousemove.call(this, event);
  }, function on_mousedown(event) {
    this.start_mpos.load([event.x, event.y]);
    this.was_touch = g_app_state.was_touch;
    if (this.clicked) {
        if (this.do_modal)
          this.push_modal();
        this.clicked = false;
        this.do_recalc();
    }
    if (!this.clicked&&event.button==0) {
        this.clicked = true;
        if (!this.was_touch&&this.callback!=undefined) {
            this.callback(this);
        }
        if (!this.did_modal) {
            this.push_modal();
            this.did_modal = true;
        }
    }
  }, function on_mouseup(event) {
    if (this.did_modal) {
        this.pop_modal();
        this.did_modal = false;
    }
    if (this.clicked) {
        this.clicked = false;
        if (this.was_touch&&inrect_2d_button([event.x, event.y], [0, 0], this.size)) {
            if (this.callback!=undefined) {
                this.callback(this);
            }
        }
    }
  }, function build_draw(canvas, isVertical) {
    canvas.begin(this);
    if (this.bgcolor) {
        if (!(this.state&UIFlags.ENABLED))
          canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
        else 
          canvas.box([0, 0], this.size, this.bgcolor);
    }
    var tsize=canvas.textsize(this.text);
    let color=this.color;
    canvas.text([(this.size[0]-tsize[0])*0.5, (this.size[1]-tsize[1])*0.25], this.text, color);
    canvas.end(this);
  }, function get_min_size(canvas, isvertical) {
    var pad=this.bgcolor!=undefined ? 2 : 4;
    return (($_mh = objcache.array(2)), ($_mh[0] = (canvas.textsize(this.text)[0]+pad)), ($_mh[1] = (26)), $_mh);
  }]);
  _es6_module.add_class(UILabel);
  UILabel = _es6_module.add_export('UILabel', UILabel);
  var _HiddenMenuElement=_ESClass("_HiddenMenuElement", UIElement, [function _HiddenMenuElement(ctx, src_menu_label, dst_menu_label) {
    UIElement.call(this, ctx);
    this.src_menu_label = src_menu_label;
    this.dst_menu_label = dst_menu_label;
  }, function on_mousemove(event) {
    if (DEBUG.ui_menus)
      console.log("In _HiddenMenuElement.on_mousemove()");
    this.src_menu_label.menu.end_menu();
    this.src_menu_label.clicked = false;
    this.src_menu_label.state&=~UIFlags.HIGHLIGHT;
    this.src_menu_label.do_recalc();
    this.dst_menu_label.clicked = true;
    this.dst_menu_label.spawn_menu();
  }, function build_draw(canvas, isvertical) {
  }]);
  _es6_module.add_class(_HiddenMenuElement);
  _HiddenMenuElement = _es6_module.add_export('_HiddenMenuElement', _HiddenMenuElement);
  var UIMenuLabel=_ESClass("UIMenuLabel", UIElement, [function UIMenuLabel(ctx, text, menu, gen_menu_func, pos, size) {
    UIElement.call(this, ctx);
    if (pos==undefined)
      pos = [0, 0];
    if (size==undefined)
      size = [0, 0];
    this.prop = undefined;
    this.val = text;
    this.text = text;
    this.clicked = false;
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    if (size!=undefined) {
        this.size[0] = size[0];
        this.size[1] = size[1];
    }
    this.callback = undefined;
    this.gen_menu = gen_menu_func;
    this.menu_callback = undefined;
    this.callback_override = undefined;
    this.off = [0, 0];
  }, function on_tick() {
    UIElement.prototype.on_tick.call(this);
    if (this.clicked&&this.menu!=undefined&&this.menu.closed) {
        this.clicked = false;
        if (!DEBUG.data_api_timing)
          this.do_recalc();
    }
  }, function add_hidden_elements(menu) {
    var es=new GArray();
    var __iter_c=__get_iter(this.parent.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c==this||c.constructor.name!=UIMenuLabel.name)
        continue;
      var e=new _HiddenMenuElement(this.ctx, this, c);
      e.size = c.size;
      e.pos = [c.pos[0]-this.pos[0]-this.off[0], c.pos[1]-this.pos[1]-this.off[1]];
      es.push(e);
    }
    var del=new GArray();
    var __iter_c=__get_iter(menu.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name==_HiddenMenuElement.name)
        del.push(c);
    }
    var __iter_c=__get_iter(del);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      menu.children.remove(c);
    }
    var __iter_c=__get_iter(es);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      menu.add(c);
    }
  }, function spawn_menu(mpos) {
    this.clicked = true;
    this.do_recalc();
    if (this.gen_menu!=undefined) {
        this.menu = this.gen_menu(this.ctx, this);
    }
    var menu=this.menu;
    if (menu==undefined)
      return ;
    var off=[0, 0];
    menu.packmenu(this.canvas);
    var absco=this.get_abs_pos();
    var scrsize=this.ctx.screen.size;
    if (scrsize[1]-absco[1]-this.size[1]<menu.size[1]) {
        off = this.off = [0, -menu.size[1]];
    }
    else {
      off = this.off = [0, this.size[1]];
    }
    var this2=this;
    if (this.menu.callback!=this.callback_override) {
        this.menu_callback = menu.callback;
        this.callback_override = menu.callback = function(entry, id) {
          this2.clicked = false;
          if (this2.menu_callback!=undefined) {
              this2.menu_callback(entry, id);
          }
          this2.do_recalc();
          this2.state&=~UIFlags.HIGHLIGHT;
        };
    }
    this.add_hidden_elements(menu);
    this.call_menu(menu, off);
  }, function on_mousedown(event) {
    if (event.button==0&&this.clicked==false) {
        this.spawn_menu([event.x, event.y]);
    }
  }, function on_mouseup(event) {
    if (event.button==0&&this.clicked==false) {
        this.clicked = false;
        if (inrect_2d_button([event.x, event.y], [0, 0], this.size)) {
            if (this.callback!=undefined) {
                this.callback(this);
            }
        }
    }
  }, function build_draw(canvas) {
    if (this.canvas==undefined)
      this.canvas = canvas;
    canvas.begin(this);
    if (!(this.state&UIFlags.ENABLED))
      canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
    else 
      if (this.clicked)
      canvas.box([0, -2], [this.size[0], this.size[1]+4], uicolors["MenuLabelInv"], 10);
    else 
      if (this.state&UIFlags.HIGHLIGHT)
      canvas.box([0, -2], [this.size[0], this.size[1]+4], uicolors["MenuLabel"], 10);
    var tsize=canvas.textsize(this.text, menu_text_size);
    canvas.text([(this.size[0]-tsize[0])*0.5, (this.size[1]-tsize[1])*0.25], this.text, undefined, menu_text_size);
    canvas.end(this);
  }, function get_min_size(canvas, isvertical) {
    return (($_mh = objcache.array(2)), ($_mh[0] = (canvas.textsize(this.text, menu_text_size)[0]+4)), ($_mh[1] = (26)), $_mh);
  }]);
  _es6_module.add_class(UIMenuLabel);
  UIMenuLabel = _es6_module.add_export('UIMenuLabel', UIMenuLabel);
  var ScrollButton=_ESClass("ScrollButton", UIElement, [function ScrollButton(ctx, pos, size, icon, callback, do_repeat) {
    if (do_repeat==undefined) {
        do_repeat = true;
    }
    UIElement.call(this, ctx);
    this.repeat = do_repeat;
    this.boxclr = undefined;
    this.highclr = undefined;
    this.invclr = undefined;
    this.icon = icon;
    this.clicked = false;
    this.do_modal = true;
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    if (size!=undefined) {
        this.size[0] = size[0];
        this.size[1] = size[1];
    }
    this.callback = callback;
    this.repeat_ival = 100;
    this.last_ms = 0;
  }, function on_tick() {
    if (this.clicked&&this.repeat&&time_ms()-this.last_ms>this.repeat_ival) {
        this.last_ms = time_ms();
        this.callback(this, [-1, -1]);
    }
  }, function on_mousedown(event) {
    if (event.button==0&&!this.clicked) {
        if (this.do_modal)
          this.push_modal();
        this.clicked = true;
        this.do_recalc();
        if (inrect_2d([event.x, event.y], [0, 0], this.size)) {
            if (this.callback!=undefined) {
                this.callback(this, [event.x, event.y]);
            }
        }
    }
  }, function on_mouseup(event) {
    if (event.button==0) {
        if (this.do_modal)
          this.pop_modal();
        this.clicked = false;
        this.do_recalc();
    }
  }, function build_draw(canvas, isVertical) {
    if (!(this.state&UIFlags.ENABLED))
      canvas.box([1, 1], this.size, this.do_flash_color(uicolors["DisabledBox"]));
    else 
      if (this.clicked)
      canvas.box2([1, 1], this.size, this.invclr);
    else 
      if (this.state&UIFlags.HIGHLIGHT)
      canvas.box2([1, 1], this.size, this.highclr);
    else 
      canvas.box2([1, 1], this.size, this.boxclr);
    if (this.icon!=undefined) {
        var clr=this.clicked ? undefined : [0.5, 0.5, 0.5, 1.0];
        canvas.icon(this.icon, IsMobile ? [3, 7] : [0, 0], undefined, true, clr);
    }
  }, function get_min_size(canvas, isvertical) {
    if (IsMobile) {
        return (($_mh = objcache.array(2)), ($_mh[0] = (26)), ($_mh[1] = (26)), $_mh);
    }
    else {
      return (($_mh = objcache.array(2)), ($_mh[0] = (18)), ($_mh[1] = (18)), $_mh);
    }
  }]);
  _es6_module.add_class(ScrollButton);
  ScrollButton = _es6_module.add_export('ScrollButton', ScrollButton);
  var UIVScroll=_ESClass("UIVScroll", UIFrame, [function UIVScroll(ctx, range, pos, size, callback) {
    if (pos==undefined) {
        pos = [0, 0];
    }
    if (size==undefined) {
        size = [0, 0];
    }
    if (callback==undefined) {
        callback = undefined;
    }
    UIFrame.call(this, ctx);
    this.state|=UIFlags.NO_FRAME_CACHE;
    this.packflag|=PackFlags.INHERIT_HEIGHT;
    this.packflag|=PackFlags.ALIGN_RIGHT;
    this.step = undefined;
    this.clicked = false;
    this.click_sign = 1;
    this.range = range;
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    if (size!=undefined) {
        this.size[0] = size[0];
        this.size[1] = size[1];
    }
    this._last_val = undefined;
    this.val = 0;
    this.callback = callback;
    this.but1 = new ScrollButton(ctx, [0, 0], [0, 0], Icons.SCROLL_DOWN);
    this.but1.repeat = true;
    this.add(this.but1);
    this.but2 = new ScrollButton(ctx, [0, 0], [0, 0], Icons.SCROLL_UP);
    this.but2.repeat = true;
    this.add(this.but2);
    this.bar = new ScrollButton(ctx, [0, 0], [0, 0], undefined);
    this.bar.repeat = false;
    this.bar.do_modal = false;
    this.barsize = 32;
    this.add(this.bar);
    this.bar.boxclr = uicolors["ScrollBar"];
    this.bar.highclr = uicolors["ScrollBarHigh"];
    this.bar.invclr = uicolors["ScrollInv"];
    this.but1.boxclr = uicolors["ScrollButton"];
    this.but1.highclr = uicolors["ScrollButtonHigh"];
    this.but1.invclr = uicolors["ScrollInv"];
    this.but2.boxclr = uicolors["ScrollButton"];
    this.but2.highclr = uicolors["ScrollButtonHigh"];
    this.but2.invclr = uicolors["ScrollInv"];
    this.last_ms = 0;
    this.dragging = false;
    this.last_mpos = [0, 0];
    this.did_modal = false;
    var this2=this;
    function bar_callback(button, mpos) {
      mpos = [0, mpos[1]+button.pos[1]];
      this2.do_drag(mpos);
    }
    this.bar.callback = bar_callback;
    this.but1.callback = function(button, mpos) {
      this2.increment(1);
    }
    this.but2.callback = function(button, mpos) {
      this2.increment(-1);
    }
  }, function set_range(range) {
    if (this.range==undefined||this.range[0]!=range[0]||this.range[1]!=range[1])
      this.do_recalc();
    this.range = range;
    if (isNaN(range[0])||isNaN(range[1])) {
        console.warn("NaN in UIVScroll.set_range()!");
    }
    this.val = Math.min(Math.max(this.val, this.range[0]), this.range[1]);
    this.pack_bar();
  }, function do_drag(mpos) {
    this.last_mpos = mpos;
    this.dragging = true;
    this.parent.push_modal(this);
  }, function increment(sign) {
    var step=this.step;
    if (step==undefined)
      step = (this.range[1]-this.range[0])/10.0;
    this.val+=step*sign;
    this.val = Math.min(Math.max(this.val, this.range[0]), this.range[1]);
    if (this.callback!=undefined) {
        this.callback(this, this.val);
    }
  }, function set_value(val) {
    if (isNaN(val)) {
        console.warn("NaN in UIVScroll.set_value()!");
        return ;
    }
    if (val!=this._last_val&&val!=this.val) {
        this.do_recalc();
    }
    this._last_val = val;
    if (this.range[0]>this.range[1]) {
        val = Math.min(Math.max(val, this.range[1]), this.range[0]);
    }
    else {
      val = Math.min(Math.max(val, this.range[0]), this.range[1]);
    }
    this.val = val;
  }, function pack_bar() {
    var bar=this.bar;
    var range=this.range;
    var size1=this.barsize;
    size1 = this.size[1]-this.but1.size[1]-this.but2.size[1]-size1;
    bar.size[0] = this.size[0];
    bar.size[1] = this.barsize;
    var fac=size1/(this.range[1]-this.range[0]);
    bar.pos[1] = this.but1.size[1]+(this.range[1]-this.val-this.range[0]*2)*fac;
  }, function on_inactive() {
    this.clicked = false;
    UIFrame.prototype.on_inactive.call(this);
  }, function on_tick() {
    UIFrame.prototype.on_tick.call(this);
    if (isNaN(this.val)) {
        this.val = this.range[0];
        console.warn("Fixed NaN in UIVScroll!");
    }
    this.state&=~UIFlags.USE_PAN;
    if (this.clicked&&this.modalhandler!=undefined) {
        this.clicked = false;
    }
    if (this.clicked&&time_ms()-this.last_ms>200) {
        this.increment(this.click_sign*4);
    }
  }, function on_mousedown(event) {
    if (!this.dragging) {
        UIFrame.prototype.on_mousedown.call(this, event, false);
    }
    if (this.modalhandler==undefined&&this.active==undefined) {
        this.clicked = true;
        this.last_ms = time_ms()+200;
        if (event.y>this.bar.pos[1]+this.bar.size[1]) {
            this.click_sign = -1;
            this.increment(-4);
        }
        else {
          this.click_sign = 1;
          this.increment(4);
        }
    }
  }, function on_mouseup(event) {
    this.clicked = false;
    if (this.dragging) {
        this.dragging = false;
        this.parent.pop_modal();
        this.bar.clicked = false;
        this.bar.do_recalc();
    }
    else {
      UIFrame.prototype.on_mouseup.call(this, event);
    }
  }, function on_mousemove(event) {
    if (this.dragging) {
        var mpos=[event.y, event.y];
        var y=mpos[1]-this.last_mpos[1];
        if (Math.abs(y)<4)
          return ;
        var fac=(this.range[1]-this.range[0]);
        fac = fac/(this.size[1]-this.but1.size[1]-this.but2.size[1]-this.barsize);
        this.val-=fac*y+this.range[0];
        this.val = Math.min(Math.max(this.val, this.range[0]), this.range[1]);
        if (this.callback!=undefined) {
            this.callback(this, this.val);
        }
        this.last_mpos = mpos;
        this.bar.do_recalc();
        this.do_recalc();
    }
    else {
      UIFrame.prototype.on_mousemove.call(this, event);
    }
  }, function pack(canvas, isVertical) {
    var sizey=Math.floor(this.size[0]*1.25);
    this.but1.size = [this.size[0], sizey];
    this.but2.pos = [0, this.size[1]-sizey-1];
    this.but2.size = [this.size[0], sizey];
    this.pack_bar();
  }, function build_draw(canvas, isVertical) {
    canvas.frame_begin(this);
    this.pack(canvas, isVertical);
    if (this.range[1]-this.range[0]==0.0) {
        canvas.box2([1, 0], this.size, uicolors["ScrollBG"]);
        return ;
    }
    this.canvas = canvas;
    canvas.box2([1, 0], this.size, uicolors["ScrollBG"]);
    this.draw_background = false;
    UIFrame.prototype.build_draw.call(this, canvas, isVertical, false);
    canvas.frame_end(this);
  }, function get_min_size(canvas, isvertical) {
    if (IsMobile)
      return (($_mh = objcache.array(2)), ($_mh[0] = (28)), ($_mh[1] = (28*3)), $_mh);
    else 
      return (($_mh = objcache.array(2)), ($_mh[0] = (15)), ($_mh[1] = (18*3)), $_mh);
  }]);
  _es6_module.add_class(UIVScroll);
  UIVScroll = _es6_module.add_export('UIVScroll', UIVScroll);
  var UIIconCheck=_ESClass("UIIconCheck", UIHoverHint, [function UIIconCheck(ctx, text, icon, pos, size, path, use_check) {
    if (use_check==undefined) {
        use_check = true;
    }
    UIHoverHint.call(this, ctx, path);
    this.ctx = ctx;
    this.set = false;
    this.mdown = false;
    this.text = text;
    this._enum_colors = false;
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    if (size!=undefined) {
        this.size[0] = size[0];
        this.size[1] = size[1];
    }
    this.callback = undefined;
    this.update_callback = undefined;
    this.icon = icon;
    this.prop = undefined;
    if (this.state&UIFlags.USE_PATH) {
        this.prop = this.get_prop_meta();
    }
  }, function on_tick() {
    UIHoverHint.prototype.on_tick.call(this);
    if (!this.mdown&&this.update_callback!=undefined) {
        this.update_callback(this);
    }
    else 
      if (!this.mdown&&(this.state&UIFlags.USE_PATH)) {
        var val=this.get_prop_data();
        if (!(this.state&UIFlags.ENABLED))
          return ;
        if (val!=this.set) {
            this.set = val;
            if (!DEBUG.data_api_timing)
              this.do_recalc();
        }
    }
  }, function on_mousemove(event) {
    if (!this.mdown) {
        this.start_hover();
    }
  }, function on_mousedown(event) {
    if (event.button==0&&!this.mdown) {
        this.push_modal();
        this.stop_hover();
        this.mdown = true;
        this.set^=true;
        this.do_recalc();
    }
  }, function on_mouseup(event) {
    if (this.mdown) {
        this.pop_modal();
        this.mdown = false;
        if (this.callback!=undefined)
          this.callback(this, this.set);
        if (this.state&UIFlags.USE_PATH) {
            this.set_prop_data(this.set);
        }
    }
  }, function build_draw(canvas) {
    canvas.begin(this);
    var base=this.packflag&PackFlags.USE_LARGE_ICON ? 24+16 : 24;
    var csize=[base, base];
    let SetColor=this._enum_colors ? uicolors["IconEnumSet"] : uicolors["IconCheckSet"];
    let UnsetColor=this._enum_colors ? uicolors["IconEnumUnset"] : uicolors["IconCheckUnset"];
    if (!(this.state&UIFlags.ENABLED)) {
        canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
    }
    else 
      if (this.state&UIFlags.HIGHLIGHT) {
        var clr=this.set ? SetColor : UnsetColor;
        clr = clr.slice(0, clr.length);
        for (var i=0; i<3; i++) {
            clr[i]*=1.1;
        }
        canvas.box([0, 0], this.size, clr, 2);
    }
    else 
      if (this.set) {
        canvas.box([0, 0], this.size, SetColor, 2);
    }
    else {
      canvas.box([0, 0], this.size, UnsetColor, 2);
    }
    var tsize=canvas.textsize(this.text);
    canvas.text([csize[0]+5, (this.size[1]-tsize[1])*0.25], this.text);
    var pos=[4, 4];
    var draw_small=!(this.packflag&PackFlags.USE_LARGE_ICON);
    canvas.icon(this.icon, pos, 0.75, draw_small);
    if (!this._enum_colors) {
        if (this.set) {
            canvas.icon(Icons.CHECKED, pos, 0.75, draw_small);
        }
        else {
          canvas.icon(Icons.UNCHECKED, pos, 0.75, draw_small);
        }
    }
    else {
      if (this.set) {
          canvas.icon(Icons.ENUM_CHECKED, pos, 0.75, draw_small);
      }
      else {
        canvas.icon(Icons.ENUM_UNCHECKED, pos, 0.75, draw_small);
      }
    }
    canvas.end(this);
  }, function get_min_size(canvas, isvertical) {
    var base=this.packflag&PackFlags.USE_LARGE_ICON ? 24+16 : 24;
    return (($_mh = objcache.array(2)), ($_mh[0] = (canvas.textsize(this.text)[0]+base)), ($_mh[1] = (base)), $_mh);
  }]);
  _es6_module.add_class(UIIconCheck);
  UIIconCheck = _es6_module.add_export('UIIconCheck', UIIconCheck);
}, '/home/ec2-user/fairmotion/src/ui/UIWidgets.js');
es6_module_define('selectmode', [], function _selectmode_module(_es6_module) {
  var SelMask={VERTEX: 1, HANDLE: 2, SEGMENT: 4, FACE: 16, MULTIRES: 32, TOPOLOGY: 1|2|4|16}
  SelMask = _es6_module.add_export('SelMask', SelMask);
  var ToolModes={SELECT: 1, APPEND: 2, RESIZE: 3, ROTATE: 4}
  ToolModes = _es6_module.add_export('ToolModes', ToolModes);
}, '/home/ec2-user/fairmotion/src/editors/viewport/selectmode.js');
es6_module_define('UITextBox', ["UIFrame", "UIWidgets", "mathlib", "UIPack", "UIHTMLTextBox", "UIElement", "../editors/viewport/events"], function _UITextBox_module(_es6_module) {
  var $_mh;
  var $_swapt;
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var open_mobile_keyboard=es6_import_item(_es6_module, 'UIElement', 'open_mobile_keyboard');
  var close_mobile_keyboard=es6_import_item(_es6_module, 'UIElement', 'close_mobile_keyboard');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var KeyMap=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, '../editors/viewport/events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../editors/viewport/events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'EventHandler');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var UIHTMLTextbox=es6_import_item(_es6_module, 'UIHTMLTextBox', 'UIHTMLTextbox');
  var UITextBox=UIHTMLTextbox;
  UITextBox = _es6_module.add_export('UITextBox', UITextBox);
  var _UITextBox=_ESClass("_UITextBox", UIElement, [function _UITextBox(ctx, text, pos, size, path) {
    if (text==undefined) {
        text = "";
    }
    if (pos==undefined) {
        pos = undefined;
    }
    if (size==undefined) {
        size = undefined;
    }
    if (path==undefined) {
        path = undefined;
    }
    UIElement.call(this, ctx, path);
    this.on_end_edit = undefined;
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    if (size!=undefined) {
        this.size[0] = size[0];
        this.size[1] = size[1];
    }
    this.prop = undefined;
    this.text = text;
    this.start_text = text;
    this.min_width = 110;
    if (this.state&UIFlags.USE_PATH) {
        this.prop = ctx.api.get_prop_meta(ctx, this.data_path);
        this.val = this.prop.data;
        this.text = this.prop.uiname+": ";
    }
    this.selecting = false;
    this.cur_sel_i = 0;
    this.sel = [0, 0];
    this.selcursor = 0;
    this.cursor = 0;
    this.last_cursor = 0;
    this.callback = undefined;
    this.text_offx = 13;
    this.text_min_offx = 13;
    this.replace_mode = false;
    this.editing = false;
    this.gmap = undefined;
    this.cancel_on_escape = false;
    this.mpos = [0, 0];
    this.last_mpos = [0, 0];
  }, function set_text(text) {
    if (this.text!=text)
      this.do_recalc();
    this.text = text;
  }, function on_tick() {
    if (!this.editing&&(this.state&UIFlags.USE_PATH)) {
        if (!(this.state&UIFlags.ENABLED))
          return ;
        var val=this.get_prop_data();
        if (val!=this.text) {
            this.text = val!==undefined ? val : "";
            this.do_recalc();
        }
    }
    if (this.editing&&this.cursor!=this.last_cursor) {
        this.do_recalc();
        this.last_cursor = this.cursor;
    }
  }, function on_mousedown(event) {
    this.mpos = [event.x, event.y];
    if (event.button==0) {
        if (this.editing==false) {
            this.begin_edit(event);
            this.selecting = true;
        }
        else 
          if (!this.selecting&&!inrect_2d([event.x, event.y], [0, 0], this.size)) {
            this.end_edit(false);
        }
        else {
          this.selecting = true;
          this.cursor = this.selcursor;
          this.set_cursor();
          if (!event.shiftKey) {
              this.sel = [this.cursor, this.cursor];
          }
          else {
            this.handle_selecting();
          }
        }
    }
  }, function on_mouseup(event) {
    this.mpos = [event.x, event.y];
    if (this.editing&&this.selecting) {
        this.selecting = false;
        this.do_recalc();
    }
  }, function handle_selecting() {
    var cur=this.selcursor;
    if (cur<this.sel[0]&&this.cur_sel_i==1) {
        this.sel[1] = this.sel[0];
        this.cur_sel_i = 0;
    }
    else 
      if (cur>this.sel[1]&&this.cur_sel_i==0) {
        this.cur_sel_i = 1;
    }
    this.sel[this.cur_sel_i] = cur;
    this.cursor = cur;
    this.set_cursor();
  }, function on_mousemove(event) {
    this.mpos = [event.x, event.y];
    if (!this.editing)
      return ;
    if (inrect_2d(this.last_mpos, [-10, -10], [this.size[0]+20, this.size[1]+20])!=inrect_2d(this.mpos, [-10, -10], [this.size[0]+20, this.size[1]+20])) {
        this.do_recalc();
    }
    if (inrect_2d([event.x, event.y], [-10, -10], [this.size[0]+20, this.size[1]+20])) {
        this.find_selcursor(event);
    }
    if (this.selecting) {
        this.handle_selecting();
    }
    this.last_mpos = [this.mpos[0], this.mpos[1]];
  }, function begin_edit(event) {
    if (this.editing) {
        console.trace("Invalid UITextBox.begin_edit() call");
        this.end_edit();
        return ;
    }
    this.focus();
    console.log("begin textbox edit");
    this.do_recalc();
    this.editing = true;
    this.push_modal();
    this.start_text = new String(this.text);
    this.gen_glyphmap();
    this.do_recalc();
    if (event!=undefined) {
        this.find_selcursor(event);
    }
    else {
      this.selcursor = 0;
    }
    this.cursor = this.selcursor;
    this.sel = [0, this.text.length];
    var this2=this;
    function end_edit() {
      this2.end_edit(false, false);
    }
    open_mobile_keyboard(this, end_edit);
  }, function end_edit(cancel, close_keyboard) {
    if (cancel==undefined) {
        cancel = false;
    }
    if (close_keyboard==undefined) {
        close_keyboard = true;
    }
    this.editing = false;
    if (cancel) {
        this.text = this.start_text;
    }
    this.parent.pop_modal();
    this.do_recalc();
    this.selecting = false;
    this.state&=~UIFlags.HIGHLIGHT;
    this.text_offx = this.text_min_offx;
    if (this.callback) {
        this.callback(this, this.text);
    }
    if (this.state&UIFlags.USE_PATH) {
        this.set_prop_data(this.text);
    }
    if (close_keyboard)
      close_mobile_keyboard();
    if (this.on_end_edit)
      this.on_end_edit(this, cancel);
  }, function set_cursor() {
    this.cursor = Math.max(Math.min(this.cursor, this.text.length), 0);
    if (this.editing&&this.cursor!=this.last_cursor) {
        this.do_recalc();
        this.last_cursor = this.cursor;
        var pad1=this.text_min_offx;
        var pad2=28;
        if (this.gmap[this.cursor]>this.size[0]-pad2) {
            this.text_offx+=this.size[0]-pad2-this.gmap[this.cursor];
            this.gen_glyphmap();
        }
        else 
          if (this.gmap[this.cursor]<pad1) {
            this.text_offx+=pad1-this.gmap[this.cursor];
            this.gen_glyphmap();
        }
    }
  }, function insert(text) {
    if (this.has_sel()) {
        var text2=this.text.slice(0, this.sel[0])+text+this.text.slice(this.sel[1], this.text.length);
        this.replace_text(text2);
        this.cursor = this.sel[0]+text.length;
        this.sel = [0, 0];
    }
    else {
      var text2=this.text.slice(0, this.cursor)+text+this.text.slice(this.cursor, this.text.length);
      this.replace_text(text2);
      this.cursor+=text.length;
    }
  }, function delcmd(dir) {
    if (this.has_sel()) {
        this.insert("");
    }
    else {
      if (this.cursor+dir>=0&&this.cursor+dir<=this.text.length) {
          var text2;
          if (dir>0) {
              text2 = this.text.slice(0, this.cursor)+this.text.slice(this.cursor+1, this.text.length);
          }
          else {
            text2 = this.text.slice(0, this.cursor-1)+this.text.slice(this.cursor, this.text.length);
            this.cursor-=1;
            this.set_cursor();
          }
          this.replace_text(text2);
      }
    }
    this.set_cursor();
  }, function find_next_textbox() {
    var p=this.parent;
    while (p!=undefined&&p.parent!=undefined) {
      if (p.parent.constructor.name=="ScreenArea"||__instance_of(p, Dialog)) {
          break;
      }
      p = p.parent;
    }
    var root=p;
    p = this.parent;
    var i=this.parent.children.indexOf(this);
    var c=this;
    function find_textbox(e, exclude) {
      if (__instance_of(e, UITextBox)&&e!=exclude)
        return e;
      if (__instance_of(e, UIFrame)) {
          var __iter_c_0=__get_iter(e.children);
          var c_0;
          while (1) {
            var __ival_c_0=__iter_c_0.next();
            if (__ival_c_0.done) {
                break;
            }
            c_0 = __ival_c_0.value;
            var ret=find_textbox(c_0, exclude);
            if (ret!=undefined)
              return ret;
          }
      }
    }
    var next;
    do {
      next = find_textbox(c, this);
      if (next)
        break;
      p = p.parent;
      c = c.parent;
      i = p.children.indexOf(c);
    } while (p!=root);
    
    if (!next) {
        next = find_textbox(root, this);
    }
    if (!next) {
        console.log("Error in find_next_textbox()");
        this.end_edit();
        return ;
    }
    if (next==this) {
        this.end_edit();
        return ;
    }
    this.end_edit();
    next.begin_edit();
  }, function on_charcode(event) {
    console.log("text input", event);
    this.insert(event["char"]);
  }, function select_all() {
    this.sel = [0, this.text.length];
    this.do_recalc();
  }, function on_textinput(event) {
    console.log("text input", event);
  }, function on_keydown(event) {
    var this2=this;
    function start_sel() {
      if (!this2.has_sel()) {
          this2.sel[0] = this2.sel[1] = this2.cursor;
      }
    }
    if (event.keyCode==charmap["Enter"]) {
        this.end_edit();
    }
    else 
      if (event.keyCode==charmap["Escape"]) {
        this.end_edit(this.cancel_on_escape);
    }
    else 
      if (event.keyCode==charmap["Left"]) {
        start_sel();
        this.cursor-=1;
        this.set_cursor();
        if (event.shiftKey) {
            this.selcursor = this.cursor;
            this.handle_selecting();
        }
        else {
          this.sel = [0, 0];
        }
    }
    else 
      if (event.keyCode==charmap["Right"]) {
        start_sel();
        this.cursor+=1;
        this.selcursor = this.cursor;
        this.set_cursor();
        if (event.shiftKey) {
            this.selcursor = this.cursor;
            this.handle_selecting();
        }
        else {
          this.sel = [0, 0];
        }
    }
    else 
      if (event.keyCode==charmap["Insert"]) {
        this.replace_mode^=true;
        this.do_recalc();
    }
    else 
      if (event.keyCode==charmap["Delete"]) {
        this.delcmd(1);
    }
    else 
      if (event.keyCode==charmap["Backspace"]) {
        this.delcmd(-1);
    }
    else 
      if (event.keyCode==charmap["A"]&&event.ctrlKey&&!event.shiftKey&&!event.altKey) {
        this.select_all();
        this.do_recalc();
    }
    else 
      if (event.keyCode==charmap["Home"]) {
        start_sel();
        this.cursor = 0;
        this.selcursor = this.cursor;
        this.set_cursor();
        if (event.shiftKey) {
            this.selcursor = this.cursor;
            this.handle_selecting();
        }
        else {
          this.sel = [0, 0];
        }
    }
    else 
      if (event.keyCode==charmap["End"]) {
        start_sel();
        this.cursor = this.text.length;
        this.selcursor = this.cursor;
        this.set_cursor();
        if (event.shiftKey) {
            this.selcursor = this.cursor;
            this.handle_selecting();
        }
        else {
          this.sel = [0, 0];
        }
    }
    else 
      if (event.keyCode==charmap["Tab"]) {
        this.find_next_textbox();
    }
  }, function find_selcursor(event) {
    var gmap=this.gmap;
    var selcursor=0;
    if (event.x<=gmap[0]) {
        selcursor = 0;
    }
    else 
      if (event.x>=gmap[gmap.length-1]) {
        selcursor = this.text.length;
    }
    else {
      for (var i=0; i<gmap.length-1; i++) {
          if (event.x>=gmap[i]&&event.x<=gmap[i+1]) {
              selcursor = i;
              break;
          }
      }
    }
    if (selcursor!=this.selcursor) {
        this.selcursor = selcursor;
        this.do_recalc();
    }
  }, function replace_text(text) {
    this.text = text;
    this.gen_glyphmap();
    this.set_cursor();
    this.selcursor = Math.min(Math.max(0, this.selcursor), this.text.length);
    this.do_recalc();
  }, function has_sel() {
    return this.sel[1]-this.sel[0]>0;
  }, function gen_glyphmap() {
    this.gmap = [];
    var gmap=this.gmap;
    function calc_callback(vrect, trect) {
      gmap.push(Math.min(vrect[0], trect[0]));
    }
    if (this.canvas==undefined)
      return ;
    var s="";
    gmap.push(0);
    for (var i=0; i<this.text.length; i++) {
        s+=this.text[i];
        var b=this.canvas.textsize(s);
        calc_callback(b, b);
    }
    var bounds=this.canvas.textsize(this.text)[0];
    gmap.push(bounds);
    this.text_offx = Math.min(this.text_offx, gmap[gmap.length-1]);
    for (var i=0; i<gmap.length; i++) {
        gmap[i] = Math.floor(gmap[i])+this.text_offx;
    }
  }, function build_draw(canvas) {
    var tsize=canvas.textsize(this.text);
    canvas.begin(this);
    if (!(this.state&UIFlags.ENABLED)) {
        canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
    }
    else 
      if (this.editing) {
        canvas.invbox([0, 0], this.size, uicolors["TextBoxInv"], 16);
    }
    else 
      if (this.state&UIFlags.HIGHLIGHT) {
        canvas.box([0, 0], this.size, uicolors["TextBoxHighlight"], 16);
    }
    else {
      canvas.box([0, 0], this.size, uicolors["TextBoxInv"], 16);
    }
    canvas.push_scissor([0, 0], this.size);
    if (this.editing&&this.has_sel()) {
        var x1=this.gmap[this.sel[0]];
        var x2=this.gmap[this.sel[1]];
        canvas.simple_box([x1, 0], [x2-x1, this.size[1]], uicolors["TextSelect"], 100);
    }
    canvas.text([this.text_offx, (this.size[1]-tsize[1])*0.25], this.text, uicolors["DefaultText"]);
    if (this.editing) {
        if (inrect_2d(this.mpos, [-10, -10], [this.size[0]+20, this.size[1]+20])) {
            if (!this.has_sel()||(this.selcursor<this.sel[0]||this.selcursor>this.sel[1])) {
                var x=this.gmap[this.selcursor];
                if (x==undefined)
                  x = 0;
                canvas.line([x, 0], [x, this.size[1]], uicolors["HighlightCursor"], undefined, 2.0);
            }
        }
        if (!this.has_sel()) {
            var x=this.gmap[this.cursor];
            var w=this.replace_mode ? 4.0 : 2.0;
            if (x!=undefined&&w!=undefined) {
                canvas.line([x, 0], [x, this.size[1]], uicolors["TextEditCursor"], undefined, w);
            }
        }
    }
    canvas.pop_scissor();
    canvas.end(this);
  }, function get_min_size(canvas, isvertical) {
    return [this.min_width, 26];
  }]);
  _es6_module.add_class(_UITextBox);
  _UITextBox = _es6_module.add_export('_UITextBox', _UITextBox);
  window.UITextBox = UITextBox;
}, '/home/ec2-user/fairmotion/src/ui/UITextBox.js');
es6_module_define('UIHTMLTextBox', ["mathlib", "UIFrame", "UIElement"], function _UIHTMLTextBox_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var open_mobile_keyboard=es6_import_item(_es6_module, 'UIElement', 'open_mobile_keyboard');
  var close_mobile_keyboard=es6_import_item(_es6_module, 'UIElement', 'close_mobile_keyboard');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIHTMLElement=_ESClass("UIHTMLElement", UIElement, [function UIHTMLElement(element, ctx, path) {
    UIElement.call(this, ctx, path);
    this.element = element;
    this.visible = false;
    this.abspos = [0, 0];
    this.size = [120, 20];
    this.zindex = 32;
  }, function on_remove() {
    this.hide();
  }, function updateDOM() {
    this.element.style["z-index"] = this.zindex;
    this.element.style["position"] = "absolute";
    this.element.style["left"] = this.abspos[0]+"px";
    this.element.style["top"] = (window.innerHeight-this.abspos[1]-this.size[1]-7)+"px";
    this.element.style["width"] = this.size[0]+"px";
    this.element.style["height"] = this.size[1]+"px";
  }, function hide() {
    if (this.visible)
      document.body.removeChild(this.element);
    this.visible = false;
  }, function show() {
    if (!this.visible)
      document.body.appendChild(this.element);
    this.visible = true;
    this.updateDOM();
  }]);
  _es6_module.add_class(UIHTMLElement);
  UIHTMLElement = _es6_module.add_export('UIHTMLElement', UIHTMLElement);
  
  var UIHTMLTextbox=_ESClass("UIHTMLTextbox", UIHTMLElement, [function UIHTMLTextbox(ctx, text, pos, size, path) {
    UIHTMLElement.call(this, document.createElement("input"), ctx, path);
    this.element.type = "text";
    this.element.value = text;
    this.text = text;
    this.on_end_edit = undefined;
    this.element.onchange = (element) =>      {
      this.text = element.value;
      if (this.callback!==undefined) {
          this.callback(this, this.text);
      }
    }
    this.element.onkeydown = this.on_keydown.bind(this);
    this.min_width = 110;
    this.callback = undefined;
    this.prop = undefined;
    this.replace_mode = false;
    this.cancel_on_escape = false;
  }, function on_keydown(e) {
    console.log("textbox key event", e.keyCode);
    switch (e.keyCode) {
      case 13:
        this.end_edit(false);
        break;
      case 27:
        this.end_edit(true);
        break;
    }
  }, _ESClass.get(function has_focus() {
    return document.activeElement===this.element;
  }), _ESClass.get(function editing() {
    return this.has_focus;
  }), function set_text(text) {
    this.element.value = text;
    this.text = text;
  }, function set_cursor() {
  }, function find_next_textbox() {
    var p=this.parent;
    while (p!=undefined&&p.parent!=undefined) {
      if (p.parent.constructor.name=="ScreenArea"||__instance_of(p, Dialog)) {
          break;
      }
      p = p.parent;
    }
    var root=p;
    p = this.parent;
    var i=this.parent.children.indexOf(this);
    var c=this;
    function find_textbox(e, exclude) {
      if (__instance_of(e, UIHTMLTextBox)&&e!=exclude)
        return e;
      if (__instance_of(e, UIFrame)) {
          var __iter_c_0=__get_iter(e.children);
          var c_0;
          while (1) {
            var __ival_c_0=__iter_c_0.next();
            if (__ival_c_0.done) {
                break;
            }
            c_0 = __ival_c_0.value;
            var ret=find_textbox(c_0, exclude);
            if (ret!=undefined)
              return ret;
          }
      }
    }
    var next;
    do {
      next = find_textbox(c, this);
      if (next)
        break;
      p = p.parent;
      c = c.parent;
      i = p.children.indexOf(c);
    } while (p!=root);
    
    if (!next) {
        next = find_textbox(root, this);
    }
    if (!next) {
        console.log("Error in find_next_textbox()");
        this.end_edit();
        return ;
    }
    if (next==this) {
        this.end_edit();
        return ;
    }
    this.end_edit();
    next.begin_edit();
  }, function begin_edit() {
    this.show();
    this.editing = true;
    this.updateDOM();
    this.element.focus();
    this.element.click();
  }, function end_edit(cancel) {
    this.editing = false;
    this.text = this.element.value;
    document.body.focus();
    if (this.on_end_edit!==undefined) {
        this.on_end_edit(this, cancel);
    }
  }, function select_all() {
    this.element.select();
  }, function replace_text(text) {
    this.set_text(text);
    this.updateDOM();
  }, function on_tick() {
    if (!this.has_focus&&(this.state&UIFlags.USE_PATH)) {
        if (!(this.state&UIFlags.ENABLED))
          return ;
        var val=this.get_prop_data();
        if (val!=this.text) {
            this.set_text(val!==undefined ? val : "");
            this.do_recalc();
        }
    }
    if (this.editing&&this.cursor!=this.last_cursor) {
        this.do_recalc();
    }
  }, function build_draw(canvas) {
    this.show();
    this.updateDOM();
  }, function updateDOM() {
    UIHTMLElement.prototype.updateDOM.call(this);
  }, function get_min_size(canvas, isvertical) {
    return [this.min_width, 17];
  }]);
  _es6_module.add_class(UIHTMLTextbox);
  UIHTMLTextbox = _es6_module.add_export('UIHTMLTextbox', UIHTMLTextbox);
  
}, '/home/ec2-user/fairmotion/src/ui/UIHTMLTextBox.js');
es6_module_define('ScreenKeyboard', ["UIElement", "../editors/viewport/events", "UIFrame", "UIWidgets", "UIPack"], function _ScreenKeyboard_module(_es6_module) {
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var KeyMap=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, '../editors/viewport/events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../editors/viewport/events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'EventHandler');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var open_mobile_keyboard=es6_import_item(_es6_module, 'UIElement', 'open_mobile_keyboard');
  var close_mobile_keyboard=es6_import_item(_es6_module, 'UIElement', 'close_mobile_keyboard');
  var inrect_2d_button=es6_import_item(_es6_module, 'UIElement', 'inrect_2d_button');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIHoverBox=es6_import_item(_es6_module, 'UIElement', 'UIHoverBox');
  var UIHoverHint=es6_import_item(_es6_module, 'UIElement', 'UIHoverHint');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var ToolOpFrame=es6_import_item(_es6_module, 'UIPack', 'ToolOpFrame');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var _HiddenMenuElement=es6_import_item(_es6_module, 'UIWidgets', '_HiddenMenuElement');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var ScreenKeyboard=_ESClass("ScreenKeyboard", RowFrame, [function ScreenKeyboard(ctx, client, on_close) {
    RowFrame.call(this, ctx);
    this.size = [0, 0];
    this.pos = [0, 0];
    this.abspos = [0, 0];
    this.on_close = on_close;
    this.client = client;
    this.was_shift = false;
    this.caps = false;
    var this2;
    function callback(but) {
      this2.callback(but);
    }
    function key(c) {
      var ret=undefined;
      if (c=="Backspace") {
          ret = new UIButtonIcon(ctx, "Backspace", Icons.BACKSPACE);
      }
      else 
        if (c=="Left") {
          ret = new UIButtonIcon(ctx, "Left", Icons.LEFT_ARROW);
      }
      else 
        if (c=="Right") {
          ret = new UIButtonIcon(ctx, "Right", Icons.RIGHT_ARROW);
      }
      else {
        ret = new UIButton(ctx, c);
      }
      ret.can_pan = false;
      ret.text_size = 16;
      if (c.length==1) {
          ret.get_min_size = function(canvas, isvertical) {
            return [32, 32];
          };
      }
      ret.callback = callback;
      return ret;
    }
    var this2=this;
    function addstr(frame, s) {
      var col=frame.col();
      for (var i=0; i<s.length; i++) {
          col.add(key(s[i]), PackFlags.INHERIT_WIDTH);
      }
    }
    this.addstr = addstr;
    this.key = key;
    this.do_page(addstr, key, this.page_lower);
  }, function firecode(c) {
    console.log("firing key code, not char");
    var screen=g_app_state.screen;
    var event=new MyKeyboardEvent(c);
    event.keyCode = event.key = c;
    event.shiftKey = screen.shiftKey;
    event.altKey = screen.altKey;
    event.ctrlKey = screen.ctrlKey;
    this.client._on_keydown(event);
    this.client._on_keyup(event);
  }, function firechar(c) {
    var screen=g_app_state.screen;
    var event=new MyKeyboardEvent(c.charCodeAt(0));
    event["char"] = c;
    event.shiftKey = screen.shiftKey;
    event.altKey = screen.altKey;
    event.ctrlKey = screen.ctrlKey;
    this.client.on_charcode(event);
  }, function callback(but) {
    if (but.text.length==1) {
        this.firechar(but.text);
        if (this.was_shift&&!this.caps) {
            this.do_Shift(but);
        }
    }
    else {
      var s="do_"+but.text.trim();
      if (s in this)
        this[s](but);
    }
  }, function handle_client_mevt(event) {
    if (__instance_of(this.client, UIElement)) {
        event.x-=this.client.abspos[0];
        event.y-=this.client.abspos[1];
    }
  }, function do_Backspace(but) {
    console.log("backspace");
    this.firecode(charmap["Backspace"]);
  }, function do_Left(but) {
    console.log("left");
    this.firecode(charmap["Left"]);
  }, function do_Right(but) {
    console.log("right");
    this.firecode(charmap["Right"]);
  }, function do_Caps(but) {
    if (this.was_shift) {
        this.was_shift = false;
        this.caps = false;
        this.do_page(this.addstr, this.key, this.page_lower);
    }
    else {
      this.was_shift = true;
      this.caps = true;
      this.do_page(this.addstr, this.key, this.page_upper);
    }
  }, function do_Shift(but) {
    if (this.was_shift) {
        this.was_shift = false;
        this.do_page(this.addstr, this.key, this.page_lower);
    }
    else {
      this.was_shift = true;
      this.do_page(this.addstr, this.key, this.page_upper);
    }
  }, function do_Enter(but) {
    this.firecode(charmap["Enter"]);
  }, function do_Space(but) {
    console.log("space!");
    this.firechar(" ");
  }, function do_Close(but) {
    this.end();
  }, function do_page(addstr, key, pagefunc) {
    this.default_packflag|=PackFlags.INHERIT_WIDTH|PackFlags.INHERIT_HEIGHT;
    this.children = new GArray();
    pagefunc.call(this, addstr, key);
    this.children[0].add(key("Backspace"));
    var last=this.children[this.children.length-1];
    last.prepend(key("Shift"));
    last.add(key("Caps"));
    var last2=this.children[this.children.length-2];
    last2.prepend(new UILabel(this.ctx, "     "));
    last2.add(key("Enter"));
    var col=this.col();
    col.add(key("                Space               "));
    col.add(key("Close"));
    col.add(key("Left"));
    col.add(key("Right"));
    this.do_full_recalc();
  }, function page_lower(addstr, key) {
    addstr(this, "`1234567890-=");
    addstr(this, "qwertyuiop[]\\");
    addstr(this, "asdfghjkl;'");
    addstr(this, "zxcvbnm,./");
  }, function page_upper(addstr, key) {
    addstr(this, "~!@#$%^&*()_+");
    addstr(this, "QWERTYUIOP{}|");
    addstr(this, 'ASDFGHJKL:"');
    addstr(this, "ZXCVBNM<>?");
  }, function build_draw(canvas, isVertical) {
    var clr=[0.4, 0.4, 0.5, 0.6];
    canvas.simple_box([0, 0], this.size, clr);
    RowFrame.prototype.build_draw.call(this, canvas, isVertical);
  }, function end() {
    console.log("screen keyboard end");
    this.pop_modal();
    if (this.parent.children.has(this)) {
        this.parent.remove(this);
        this.parent.do_recalc();
    }
    if (this.on_close) {
        this.on_close();
    }
  }]);
  _es6_module.add_class(ScreenKeyboard);
  var _ui_keyboard=undefined;
  window.call_keyboard = function call_keyboard(e, on_close) {
    var ctx=new Context();
    var screen=ctx.screen;
    var board=new ScreenKeyboard(ctx, e, on_close);
    board.size[0] = screen.size[0];
    board.size[1] = screen.size[0]<=screen.size[1] ? screen.size[1]/3.0 : screen.size[1]/2.0;
    board.pos[1]+=e.abspos[1]+e.size[1];
    screen.add(board);
    screen.push_modal(board);
    board.do_recalc();
    _ui_keyboard = board;
  }
  window.end_keyboard = function end_keyboard(e) {
    if (_ui_keyboard!=undefined) {
        _ui_keyboard.end();
        _ui_keyboard = undefined;
    }
  }
}, '/home/ec2-user/fairmotion/src/ui/ScreenKeyboard.js');
es6_module_define('platform_api', [], function _platform_api_module(_es6_module) {
  var PlatformAPIBase=_ESClass("PlatformAPIBase", [function PlatformAPIBase() {
  }, function init() {
  }, function saveFile(path_handle, name, databuf, type) {
  }, function numberOfCPUs() {
    return 2;
  }, function saveDialog(name, databuf, type) {
  }, function openDialog(type) {
  }, function openLastFile() {
  }, function exitCatcher(handler) {
  }, function quitApp() {
  }]);
  _es6_module.add_class(PlatformAPIBase);
  PlatformAPIBase = _es6_module.add_export('PlatformAPIBase', PlatformAPIBase);
  var NativeAPIBase=_ESClass("NativeAPIBase", [function NativeAPIBase() {
  }]);
  _es6_module.add_class(NativeAPIBase);
  NativeAPIBase = _es6_module.add_export('NativeAPIBase', NativeAPIBase);
}, '/home/ec2-user/fairmotion/platforms/common/platform_api.js');
es6_module_define('platform_capabilies', [], function _platform_capabilies_module(_es6_module) {
  var PlatCapab={NativeAPI: undefined, save_file: undefined, save_dialog: undefined, open_dialog: undefined, open_last_file: undefined, exit_catcher: undefined}
  PlatCapab = _es6_module.add_export('PlatCapab', PlatCapab);
}, '/home/ec2-user/fairmotion/platforms/common/platform_capabilies.js');
es6_module_define('platform_utils', [], function _platform_utils_module(_es6_module) {
}, '/home/ec2-user/fairmotion/platforms/common/platform_utils.js');
es6_module_define('platform', ["platform_chromeapp", "platform_html5", "theplatform", "config", "platform_phonegap", "../src/wasm/load_wasm"], function _platform_module(_es6_module) {
  var config=es6_import(_es6_module, 'config');
  var html5=es6_import(_es6_module, 'platform_html5');
  var electron=es6_import(_es6_module, 'theplatform');
  var phonegap=es6_import(_es6_module, 'platform_phonegap');
  var chromeapp=es6_import(_es6_module, 'platform_chromeapp');
  var wasm_binary=es6_import_item(_es6_module, '../src/wasm/load_wasm', 'wasm_binary');
  let mod;
  if (config.ELECTRON_APP_MODE) {
      mod = electron;
  }
  else 
    if (config.HTML5_APP_MODE) {
      mod = html5;
  }
  else 
    if (config.PHONE_APP_MODE) {
      mod = phonegay;
  }
  else 
    if (config.CHROME_APP_MODE) {
      mod = chromeapp;
  }
  if (mod.app===undefined) {
      mod.app = new mod.PlatformAPI();
  }
  for (let k in mod) {
      _es6_module.add_export(k, mod[k]);
  }
}, '/home/ec2-user/fairmotion/platforms/platform.js');
es6_module_define('UIMenu', ["toolops_api", "UIWidgets", "../editors/viewport/events", "UIFrame", "UITextBox", "UIElement", "UIPack", "mathlib"], function _UIMenu_module(_es6_module) {
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var KeyMap=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, '../editors/viewport/events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../editors/viewport/events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'EventHandler');
  var ignore_next_mouseup_event=es6_import_item(_es6_module, '../editors/viewport/events', 'ignore_next_mouseup_event');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var UITextBox=es6_import_item(_es6_module, 'UITextBox', 'UITextBox');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UIMenuEntry=_ESClass("UIMenuEntry", UIElement, [function UIMenuEntry(label, hotkey, pos, size) {
    UIElement.call(this);
    this.clicked = false;
    this.label = label;
    this.submenu = undefined;
    this.text = "";
    this.pos = pos;
    this.hotkey = hotkey;
    this.size = size;
    this.i = 0;
    this.callback = undefined;
    this.add_sep = false;
    this.packed = false;
  }, function on_active() {
    UIElement.prototype.on_active.call(this);
    console.log("active");
  }, function on_inactive() {
    UIElement.prototype.on_inactive.call(this);
    console.log("inactive");
  }, function on_mousedown(event) {
    if ((event.button==0||(event.button==2&&this.parent.close_on_right))&&!this.clicked) {
        this.clicked = true;
        this.do_recalc();
        if (inrect_2d([event.x, event.y], [0, 0], this.size)) {
            if (this.callback!=undefined) {
                this.callback(this);
            }
        }
    }
  }, function on_mouseup(event) {
    if (event.button==0||(event.button==2&&this.parent.close_on_right)) {
        this.clicked = false;
        this.do_recalc();
        if (inrect_2d([event.x, event.y], [0, 0], this.size)) {
            if (this.callback!=undefined) {
                this.callback(this);
            }
        }
    }
  }, function build_draw(canvas) {
    canvas.begin(this);
    var tsize=canvas.textsize(this.text, menu_text_size);
    var y=0.5*(this.size[1]-tsize[1]);
    var textclr, hotclr;
    if (this.state&UIFlags.HIGHLIGHT) {
        canvas.simple_box([1, 1], [this.size[0]-2, this.size[1]-2], uicolors["MenuHighlight"], 0.0);
        textclr = hotclr = uicolors["MenuTextHigh"];
    }
    else {
      textclr = uicolors["MenuText"];
      hotclr = uicolors["HotkeyText"];
    }
    canvas.text([2, y], this.text, textclr, menu_text_size);
    if (this.hotkey!=undefined) {
        var tsize=canvas.textsize(this.hotkey, menu_text_size);
        canvas.text([this.size[0]-tsize[0]-8, y], this.hotkey, hotclr, menu_text_size);
    }
    canvas.end(this);
  }, function get_min_size(canvas, isvertical) {
    return [canvas.textsize(this.text, menu_text_size)[0]+4, 24];
  }]);
  _es6_module.add_class(UIMenuEntry);
  UIMenuEntry = _es6_module.add_export('UIMenuEntry', UIMenuEntry);
  var UIMenu=_ESClass("UIMenu", UIFrame, [function UIMenu(name, callback) {
    UIFrame.call(this);
    this.name = name;
    this.callback = callback;
    this.idmap = {}
    this.closed = false;
    this.chosen_id = undefined;
    this.minwidth = undefined;
    this.hkey_line_pos = 0;
    this.close_on_right = false;
    this.call_time = 0;
    this.last_active = undefined;
    this.ignore_next_mouseup = undefined;
  }, function insert_item(idx, text, hotkey, id) {
    if (hotkey==undefined) {
        hotkey = "";
    }
    if (id==undefined) {
        id = undefined;
    }
    var en=new UIMenuEntry(text, hotkey, [0, 0], [0, 0]);
    en.close_on_right = this.close_on_right;
    en.i = this.children.length;
    if (id==undefined)
      id = en.id;
    this.idmap[en.i] = id;
    this.insert(idx, en);
    return en;
  }, function add_item(text, hotkey, id) {
    if (hotkey==undefined) {
        hotkey = "";
    }
    if (id==undefined) {
        id = undefined;
    }
    return this.insert_item(this.children.length, text, hotkey, id);
  }, function on_keydown(event) {
    if (event.keyCode==charmap["Enter"]) {
        if (this.active!=undefined&&this.active.constructor.name==UIMenuEntry.name) {
            this.active.callback(this.active);
        }
    }
    else 
      if (event.keyCode==charmap["Escape"]) {
        this.end_menu();
    }
  }, function packmenu(canvas) {
    var maxwid=-1;
    var y=0;
    var ehgt=IsMobile ? 45 : 25;
    var padx=2;
    this.ehgt = ehgt;
    var this2=this;
    function menu_callback(e) {
      if (this2.closed)
        return ;
      this2.end_menu();
      if (this2.callback!=undefined) {
          this2.chosen_id = this2.idmap[e.i];
          this2.callback(e, this2.idmap[e.i]);
      }
    }
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name!="UIMenuEntry")
        continue;
      c.callback = menu_callback;
    }
    var y;
    if (this.name!=undefined&&this.name!="")
      y = ehgt+15;
    else 
      y = 5;
    var maxcol=0;
    var hkey_line_pos=0;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name!="UIMenuEntry")
        continue;
      var st=c.label+"    "+c.hotkey;
      maxwid = Math.max(canvas.textsize(st, menu_text_size)[0]+30, maxwid);
      hkey_line_pos = Math.max(canvas.textsize(c.label+"    ", menu_text_size)[0]+18, hkey_line_pos);
      maxcol = Math.max(st.length, maxcol);
      y+=ehgt;
    }
    this.hkey_line_pos = hkey_line_pos;
    if (this.minwidth!=undefined)
      maxwid = Math.max(this.minwidth, maxwid);
    this.size = [maxwid, y];
    var y=5;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name!="UIMenuEntry")
        continue;
      c.text = "    "+c.label;
      var col=Math.abs(maxcol-c.text.length-c.hotkey.length);
      c.pos[1] = y;
      c.pos[0] = padx;
      c.size[0] = maxwid;
      c.size[1] = ehgt;
      y+=ehgt;
    }
  }, function end_menu() {
    if (!this.closed) {
        this.closed = true;
        this.pop_modal();
        this.parent.remove(this);
        this.parent.do_recalc();
        if (this.parent.active==this)
          this.parent.active = this.last_active;
        if (this.ignore_next_mouseup_event!=undefined) {
            ignore_next_mouseup_event(this.ignore_next_mouseup_event);
        }
    }
  }, function on_mousedown(event) {
    if (!inrect_2d([event.x, event.y], [0, 0], this.size)) {
        this.end_menu();
    }
    else {
      UIFrame.prototype.on_mousedown.call(this, event);
    }
  }, function on_mousemove(event) {
    UIFrame.prototype.on_mousemove.call(this, event);
    if (!inrect_2d([event.x, event.y], [-12, -100], [this.size[0]+12*2, this.size[1]+200])) {
        this.end_menu();
    }
  }, function build_draw(canvas, isvertical) {
    if (!this.packed) {
        this.packmenu(canvas);
        this.packed = true;
    }
    canvas.shadow_box([8, -1], [this.size[0]-10, this.size[1]-10]);
    canvas.simple_box([0, 0], this.size, uicolors["MenuBox"][0], 0.0);
    canvas.box_outline([0, 0], this.size, uicolors["MenuBorder"], 0.0);
    canvas.text([24, this.size[1]-22], this.name, uicolors["MenuText"], menu_text_size);
    var clr=uicolors["MenuSep"];
    if (this.name!=undefined&&this.name!="")
      canvas.line([0, Math.floor(this.size[1]-30), 0], [Math.floor(this.size[0]), Math.floor(this.size[1]-30), 0], clr, clr, 1.0);
    var ehgt=this.ehgt;
    var y=ehgt+2;
    for (var i=1; i<this.children.length; i++) {
        var c=this.children[i];
        if (c.constructor.name!=UIMenuEntry.name)
          continue;
        if (!c.add_sep) {
            y+=ehgt;
            continue;
        }
        canvas.line([0, y+3, 0], [this.size[0], y+3, 0], clr, clr, 1);
        y+=ehgt;
    }
    UIFrame.prototype.build_draw.call(this, canvas, true);
    y+=10;
  }]);
  _es6_module.add_class(UIMenu);
  UIMenu = _es6_module.add_export('UIMenu', UIMenu);
  function ui_call_menu(menu, frame, pos, center, min_width) {
    if (center==undefined) {
        center = true;
    }
    if (min_width==undefined) {
        min_width = 20;
    }
    console.log("menu call");
    var off=[pos[0], pos[1]];
    if (frame.parent!=undefined)
      frame.parent.abs_transform(off);
    while (frame.parent!=undefined) {
      frame = frame.parent;
    }
    off[0]-=frame.pos[0];
    off[1]-=frame.pos[1];
    menu.closed = false;
    menu.minwidth = min_width;
    console.log("menu frame", frame);
    var canvas=frame.canvas;
    menu.canvas = canvas;
    var __iter_c=__get_iter(menu.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.do_recalc();
    }
    menu.packmenu(canvas);
    if (center) {
        off[0]-=menu.size[0]/3;
        off[1]-=menu.size[1]/3;
    }
    menu.pos[0] = off[0];
    menu.pos[1] = off[1];
    menu.call_time = time_ms();
    menu.last_active = frame.active;
    console.log("menu call");
    frame.add(menu);
    frame.push_modal(menu);
    frame.do_recalc();
    frame.dirty_rects.push([[menu.pos[0], menu.pos[1]], [menu.size[0], menu.size[1]]]);
    frame._on_mousemove({"x": pos[0]-frame.pos[0], "y": pos[1]-frame.pos[1]});
  }
  ui_call_menu = _es6_module.add_export('ui_call_menu', ui_call_menu);
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  function toolop_menu(ctx, name, oplist) {
    var oplist_instance=[];
    function op_callback(entry, id) {
      var op=oplist_instance[id];
      if (op.flag&ToolFlags.USE_DEFAULT_INPUT)
        g_app_state.toolstack.default_inputs(new Context(), op);
      ctx.toolstack.exec_tool(op);
    }
    var menu=new UIMenu(name, op_callback);
    for (var i=0; i<oplist.length; i++) {
        var opstr=oplist[i];
        var op=opstr;
        var add_sep=(i>1&&oplist[i-1]=="sep");
        if (oplist[i]=="sep") {
            continue;
        }
        if (typeof opstr=="string") {
            op = ctx.api.get_op(ctx, opstr);
        }
        if (op==undefined)
          continue;
        var hotkey;
        hotkey = ctx.api.get_op_keyhandler(ctx, opstr);
        if (DEBUG.ui_menus)
          console.log("---------", hotkey, opstr, ctx.screen);
        if (hotkey!=undefined)
          hotkey = hotkey.build_str(true);
        else 
          hotkey = "";
        oplist_instance.push(op);
        var en=menu.add_item(op.uiname, hotkey, oplist_instance.length-1);
        en.add_sep = add_sep;
    }
    return menu;
  }
  toolop_menu = _es6_module.add_export('toolop_menu', toolop_menu);
  window.UIMenu = UIMenu;
  window.ui_call_menu = ui_call_menu;
}, '/home/ec2-user/fairmotion/src/ui/UIMenu.js');
es6_module_define('RadialMenu', ["UITextBox", "UIPack", "../editors/viewport/events", "toolops_api", "mathlib", "UIFrame", "UIElement", "UIWidgets"], function _RadialMenu_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var UITextBox=es6_import_item(_es6_module, 'UITextBox', 'UITextBox');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var ignore_next_mouseup_event=es6_import_item(_es6_module, '../editors/viewport/events', 'ignore_next_mouseup_event');
  var KeyMap=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, '../editors/viewport/events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../editors/viewport/events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'EventHandler');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIRadialMenuEntry=_ESClass("UIRadialMenuEntry", UIElement, [function UIRadialMenuEntry(label, hotkey, pos, size) {
    UIElement.call(this);
    this.clicked = false;
    this.label = label;
    this.text = "";
    this.pos = pos;
    this.hotkey = hotkey;
    this.size = size;
    this.i = 0;
    this.callback = undefined;
    this.add_sep = false;
    this.packed = false;
    this.start_angle = 0;
    this.end_angle = 0;
  }, function on_mousedown(event) {
    if ((event.button==0||(event.button==2&&this.parent.close_on_right))&&!this.clicked) {
        this.clicked = true;
        this.do_recalc();
        if (inrect_2d([event.x, event.y], [0, 0], this.size)) {
            if (this.callback!=undefined) {
                this.callback(this);
            }
        }
    }
  }, function on_mouseup(event) {
    console.log(this.parent.call_time);
    if (event.button==0||(event.button==2&&this.parent.close_on_right)) {
        this.clicked = false;
        this.do_recalc();
        if (inrect_2d([event.x, event.y], [0, 0], this.size)) {
            if (this.callback!=undefined) {
                this.callback(this);
            }
        }
    }
  }, function build_draw(canvas) {
    canvas.begin(this);
    var tsize=canvas.textsize(this.text);
    canvas.text([(this.size[0]-tsize[0])*0.5+2, (this.size[1]-tsize[1])*0.25], this.text, uicolors["BoxText"]);
    if (this.hotkey!=undefined) {
        var twid=canvas.textsize(this.hotkey)[0];
        canvas.text([this.size[0]-twid-8, 2], this.hotkey, uicolors["BoxText"]);
    }
    canvas.end(this);
  }, function get_min_size(canvas, isvertical) {
    var tsize1=canvas.textsize(this.text);
    var tsize2=canvas.textsize(this.hotkey);
    return [tsize1[0]+tsize2[0]+4, tsize1[1]+tsize2[1]];
  }]);
  _es6_module.add_class(UIRadialMenuEntry);
  var UIRadialMenu=_ESClass("UIRadialMenu", UIFrame, [function UIRadialMenu(name, callback) {
    UIFrame.call(this);
    this.name = name;
    this.callback = callback;
    this.idmap = {}
    this.closed = false;
    this.chosen_id = undefined;
    this.minwidth = undefined;
    this.hkey_line_pos = 0;
    this.close_on_right = false;
    this.call_time = 0;
    this.last_active = undefined;
    this.mpos = new Vector2([0, 0]);
    this._do_callback = false;
    this._do_end = false;
    this._have_rebuilt = false;
    this.radius = 0.0;
    this.radius_min = this.radius_max = 0.0;
    this.swap_mouse_button = undefined;
    this.had_up_event = undefined;
    this.min_radius = 50;
  }, function add_item(text, hotkey, id) {
    var en=new UIRadialMenuEntry(text, hotkey, [0, 0], [0, 0]);
    en.close_on_right = this.close_on_right;
    en.i = this.children.length;
    if (id==undefined)
      id = en.id;
    this.idmap[en.i] = id;
    this.add(en);
    return ;
  }, function on_keydown(event) {
    if (event.keyCode==charmap["Enter"]) {
        if (this.active!=undefined&&this.active.constructor.name==UIRadialMenuEntry.name) {
            this.active.callback(this.active);
        }
    }
    else 
      if (event.keyCode==charmap["Escape"]) {
        this.end_menu(false);
    }
  }, function calc_radius(canvas) {
    var min_radius=this.min_radius;
    var clen=0;
    var children=new GArray();
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name==UIRadialMenuEntry.name) {
          clen++;
          c.size = c.get_min_size(canvas, false);
          children.push(c);
      }
    }
    function pack(rad) {
      var f=-Math.PI/2;
      var df=(Math.PI*2)/(clen);
      var __iter_c=__get_iter(children);
      var c;
      while (1) {
        var __ival_c=__iter_c.next();
        if (__ival_c.done) {
            break;
        }
        c = __ival_c.value;
        c.pos[0] = rad+Math.cos(f)*rad-c.size[0]*0.5;
        c.pos[1] = rad+Math.sin(f)*rad-c.size[1]*0.5;
        f+=df;
      }
    }
    var r1=1.0;
    var f=-Math.PI/2;
    var df=(Math.PI*2)/(clen);
    var minx, miny;
    var maxx, maxy;
    var r2;
    var c_mm=new MinMax(2);
    pack(r1);
    var __iter_c=__get_iter(children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c_mm.minmax_rect(c.pos, c.size);
      f+=df;
    }
    r2 = Math.sqrt(this.size[1]*this.size[1])*2.0;
    var last_valid_r=r2*2;
    var n=64;
    for (var i=0; i<n; i++) {
        var rmid=(r1+r2)*0.5;
        var found=false;
        pack(rmid);
        var __iter_c1=__get_iter(children);
        var c1;
        while (1) {
          var __ival_c1=__iter_c1.next();
          if (__ival_c1.done) {
              break;
          }
          c1 = __ival_c1.value;
          var __iter_c2=__get_iter(children);
          var c2;
          while (1) {
            var __ival_c2=__iter_c2.next();
            if (__ival_c2.done) {
                break;
            }
            c2 = __ival_c2.value;
            if (c1==c2)
              continue;
            if (aabb_isect_2d(c1.pos, c1.size, c2.pos, c2.size)) {
                found = true;
                break;
            }
          }
          if (found)
            break;
        }
        if (found) {
            r1 = rmid;
        }
        else {
          r2 = rmid;
          last_valid_r = rmid;
        }
    }
    var r_mm=new MinMax(1);
    var c_mm=new MinMax(2);
    for (var j=0; j<6; j++) {
        pack(last_valid_r);
        c_mm.reset();
        r_mm.reset();
        r_mm = new MinMax(1);
        c_mm = new MinMax(2);
        var __iter_c=__get_iter(children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          c_mm.minmax_rect(c.pos, c.size);
        }
        var cent=new Vector2(c_mm.max).add(c_mm.min).mulScalar(0.5);
        var __iter_c=__get_iter(children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          var pos=[c.pos[0], c.pos[1]];
          var p1=[(pos[0]), (pos[1])];
          var p2=[(pos[0]+c.size[0]), (pos[1]+c.size[1])];
          var minx=Math.min(p1[0], p2[0]);
          var miny=Math.min(p1[1], p2[1]);
          var maxx=Math.max(p1[0], p2[0]);
          var maxy=Math.max(p1[1], p2[1]);
          minx = pos[0];
          miny = pos[1];
          maxx = pos[0]+c.size[0];
          maxy = pos[1]+c.size[1];
          var size=new Vector2(c.size);
          size.mulScalar(0.5);
          var cs=get_rect_points(pos, size);
          for (var i=0; i<4; i++) {
              var x=cs[i][0]-cent[0], y=cs[i][1]-cent[1];
              var r2=Math.sqrt(x*x+y*y);
              r_mm.minmax(r2);
          }
          f+=df;
        }
        if (r_mm.min<20&&j<5) {
            if (r_mm.min>1.0) {
                last_valid_r+=(20.0-r_mm.min)*0.5;
            }
            else {
              last_valid_r = (last_valid_r+1.0)*1.1;
            }
        }
    }
    this.radius_min = Math.floor(r_mm.min);
    this.radius_max = Math.ceil(r_mm.max);
    this.radius = last_valid_r;
    var r=this.radius_max;
    this.cent = new Vector2([r, r]);
    var __iter_c=__get_iter(children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.pos[0]+=this.radius_max-this.radius;
      c.pos[1]+=this.radius_max-this.radius;
    }
    console.log(this.radius_min, this.radius_max, this.radius);
  }, function packmenu(canvas) {
    var maxwid=-1;
    var y=0;
    var ehgt=25;
    var padx=2;
    this.ehgt = ehgt;
    var this2=this;
    function menu_callback(e) {
      if (this2.closed)
        return ;
      this2.end_menu();
      if (this2.callback!=undefined) {
          this2.chosen_id = this2.idmap[e.i];
          this2.callback(e, this2.idmap[e.i]);
      }
    }
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name!="UIRadialMenuEntry")
        continue;
      c.callback = menu_callback;
    }
    y = 5;
    var maxcol=0;
    var hkey_line_pos=0;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name!=UIRadialMenuEntry.name)
        continue;
      var st=c.label+" "+c.hotkey;
      maxwid = Math.max(canvas.textsize(st)[0]+30, maxwid);
      hkey_line_pos = Math.max(canvas.textsize(c.label+"    ")[0]+18, hkey_line_pos);
      maxcol = Math.max(st.length, maxcol);
      y+=ehgt;
    }
    this.hkey_line_pos = hkey_line_pos;
    if (this.minwidth!=undefined)
      maxwid = Math.max(this.minwidth, maxwid);
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name!=UIRadialMenuEntry.name)
        continue;
      c.text = c.label;
      c.text = c.text.replace(" ", "\n");
    }
    this.size = [maxwid, y];
    this.calc_radius(canvas);
    var mm=new MinMax(2);
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name!=UIRadialMenuEntry.name)
        continue;
      mm.minmax_rect(c.pos, c.size);
    }
    var sz=Math.max(mm.max[0]-mm.min[0], mm.max[1]-mm.min[1]);
    this.size = [sz, sz];
    this.size = [this.radius_max*2, this.radius_max*2];
    var a_mm=new MinMax(1);
    var ax=new Vector2([0, 1]);
    var n1=new Vector2([0, 0]);
    var starts=[];
    var ends=[];
    console.log("start");
    var off=new Vector2(this.size);
    off.sub(new Vector2(mm.max).sub(mm.min));
    off.mulScalar(0.5);
    off.sub(mm.min);
    off.zero();
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name!=UIRadialMenuEntry.constructor.name)
        continue;
      var pos=[c.pos[0]-this.cent[0], c.pos[1]-this.cent[1]];
      a_mm.reset();
      var cs2=get_rect_points(pos, c.size);
      for (var i=0; i<4; i++) {
          n1.load(cs2[i]).normalize();
          var ang=Math.acos(ax.dot(n1));
          var sign=ang>0.0 ? 1.0 : -1.0;
          if (!winding([0.0, 0.0], n1, ax)) {
              ang = -ang;
          }
          if (c==this.children[0]) {
              while (ang<-0.0) {
                ang+=Math.PI*2.0*sign;
              }
              while (ang>Math.PI*2) {
                ang-=Math.PI*2.0;
              }
          }
          a_mm.minmax(ang);
      }
      if (starts.length>0) {
          var s=starts[starts.length-1];
          var e=ends[starts.length-1];
          sign = a_mm.min<e ? 1.0 : -1.0;
          while (Math.abs(a_mm.min-e)>Math.PI) {
            a_mm.min+=Math.PI*2.0*sign;
          }
          sign = a_mm.max<a_mm.min ? 1.0 : -1.0;
          while (Math.abs(a_mm.max-a_mm.min)>Math.PI) {
            a_mm.max+=Math.PI*2.0*sign;
          }
          s = a_mm.min;
          e = a_mm.max;
          a_mm.min = Math.min(s, e);
          a_mm.max = Math.max(s, e);
      }
      console.log(a_mm.min, a_mm.max);
      c.start_angle = a_mm.min;
      c.end_angle = a_mm.max;
    }
    var children=[];
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name==UIRadialMenuEntry.constructor.name)
        children.push(c);
    }
    for (var i=0; i<children.length; i++) {
        var c=children[i];
        var s=c.start_angle, e=c.end_angle;
        c.start_angle = Math.min(s, e);
        c.end_angle = Math.max(s, e);
        starts.push(c.start_angle);
        ends.push(c.end_angle);
    }
    for (var i2=0; i2<children.length; i2++) {
        var i1=(i2+children.length-1)%children.length;
        var i3=(i2+1)%children.length;
        var e1=ends[i1];
        var s2=starts[i2];
        var e2=ends[i2];
        var s3=starts[i3];
        if (0) {
            var sign=s2<e1 ? 1.0 : -1.0;
            while (Math.abs(e1-s2)>Math.PI) {
              s2+=Math.PI*2.0*sign;
            }
            if (s2<e1) {
                var t=s2;
                s2 = e1;
                e1 = t;
            }
            var sign=e2<s2 ? 1.0 : -1.0;
            while (Math.abs(e2-s2)>Math.PI) {
              e2+=Math.PI*2.0*sign;
            }
            if (e2<s2) {
                t = s2;
                s2 = e2;
                e2 = t;
            }
            var sign=s3<e2 ? 1.0 : -1.0;
            while (Math.abs(e2-s3)>Math.PI) {
              s3+=Math.PI*2.0*sign;
            }
            if (s3<e2) {
                t = s3;
                s3 = e2;
                e2 = t;
            }
        }
        var c1=children[i1];
        var c2=children[i2];
        var c3=children[i3];
        var s=(s2+e1)*0.5;
        var e=(e2+s3)*0.5;
        if (i2==children.length-1) {
            c2.start_angle = (c3.end_angle+c2.start_angle-Math.PI*2)*0.5;
            c3.end_angle = c2.start_angle+Math.PI*2;
        }
        if (i2!=children.length-1) {
            c2.start_angle = (e2+s3)*0.5;
        }
        if (i2!=0) {
            c2.end_angle = (s2+e1)*0.5;
        }
        else 
          if (i2==1) {
            c1.start_angle = c2.end_angle;
        }
        if (i2!=1&&i2!=children.length-1) {
        }
    }
    this.do_recalc();
  }, function end_menu(do_callback) {
    if (do_callback==undefined)
      do_callback = false;
    this._do_end = true;
    this._have_rebuilt = false;
    if (!this.closed) {
        this.do_recalc();
        this.closed = true;
        if (this.parent.active==this) {
            this.parent.active = this.last_active;
            this.last_active.on_active();
        }
        if (do_callback) {
            this._do_callback = true;
            this._do_callback_active = this.active;
        }
    }
  }, function on_tick(event) {
    if (!this._have_rebuilt)
      return ;
    if (this._do_end) {
        this.parent.remove(this);
        this.parent.do_recalc();
        this.pop_modal();
        this._do_end = false;
        this._have_rebuilt = false;
    }
    if (this._do_callback) {
        this._do_callback = false;
        if (this.callback!=undefined&&this._do_callback_active!=undefined) {
            var en=this._do_callback_active;
            this.chosen_id = this.idmap[en.i];
            this.callback(this.active, this.idmap[en.i]);
        }
    }
  }, function on_mousedown(event) {
    var mpos=this.off_mpos([event.x, event.y]);
    if (Math.sqrt(mpos[0]*mpos[0]+mpos[1]*mpos[1])<this.radius_min) {
        this.end_menu(false);
    }
    else {
    }
  }, function on_mouseup(event) {
    var mpos=this.off_mpos([event.x, event.y]);
    this.had_up_event = event.button;
    var dis=Math.sqrt(mpos[0]*mpos[0]+mpos[1]*mpos[1]);
    if (dis>this.radius_min) {
        this.end_menu(true);
    }
    else {
    }
  }, function off_mpos(mpos) {
    return new Vector2([mpos[0]-this.size[0]*0.5, mpos[1]-this.size[1]*0.5]);
  }, function on_mousemove(event) {
    this.mpos.load([event.x, event.y]);
    var mpos=this.off_mpos([event.x, event.y]);
    if (Math.sqrt(mpos[0]*mpos[0]+mpos[1]*mpos[1])<this.radius_min-3) {
        if (this.active!=undefined) {
            this.active.state&=~UIFlags.HIGHLIGHT;
            this.active.on_inactive();
            this.active.do_recalc();
            this.active = undefined;
            this.active = undefined;
        }
    }
    var n1=new Vector2(this.off_mpos([event.x, event.y]));
    var ax=new Vector2([0, 1]);
    n1.normalize();
    var ang=Math.acos(ax.dot(n1));
    if (!winding([0, 0], n1, ax))
      ang = -ang;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name!=UIRadialMenuEntry.name)
        continue;
      var a1=Math.min(c.start_angle, c.end_angle);
      var a2=Math.max(c.start_angle, c.end_angle);
      if (ang>=a1&&ang<=a2) {
          if (this.active&&this.active!=c) {
              this.active.state&=~UIFlags.HIGHLIGHT;
              this.active.on_inactive();
          }
          this.active = c;
          c.state|=UIFlags.HIGHLIGHT;
          c.on_active();
          this.do_recalc();
          break;
      }
    }
    var radius=this.radius_max+5;
    if (this.had_up_event!=undefined) {
        radius+=50;
    }
    console.log("---", this.had_up_event);
    if (Math.sqrt(mpos[0]*mpos[0]+mpos[1]*mpos[1])>radius) {
        this.end_menu(this.had_up_event==undefined);
        if (this.had_up_event==undefined) {
            if (this.swap_mouse_button!=undefined) {
                ignore_next_mouseup_event(this.swap_mouse_button);
            }
        }
    }
  }, function build_arc(canvas, start, arc, color) {
    var cent=this.cent;
    var steps=40;
    var points1=canvas.arc_points(cent, start, arc, this.radius_min, steps);
    var points2=canvas.arc_points(cent, start, arc, this.radius_max, steps);
    points1.reverse();
    var lines1=[];
    var lines2=[];
    for (var i=0; i<points1.length-1; i+=1) {
        var v1, v2, v3, v4;
        var i2=points1.length-i-1;
        v1 = points1[i];
        v2 = points2[i2];
        v3 = points2[i2-1];
        v4 = points1[i+1];
        canvas.quad(v1, v2, v3, v4, color);
    }
    canvas.line_loop(points1.concat(points2), color, undefined, 2, true);
  }, function build_circle(canvas) {
    var cent=this.cent;
    var steps=40;
    var points1=canvas.arc_points(cent, 0, -Math.PI*2, this.radius_min, steps);
    var points2=canvas.arc_points(cent, 0, Math.PI*2, this.radius_max, steps);
    var clr=uicolors["RadialMenu"];
    var menu=this;
    function color(v) {
      var c=new Vector3(clr);
      var fac=v[1]/menu.size[1];
      fac = fac*0.5+0.5;
      c.mulScalar(fac);
      return [c[0], c[1], c[2], clr[3]];
    }
    var colors1=[];
    var colors2=[];
    for (var i=0; i<points1.length; i++) {
        colors1.push(color(points1[i]));
        colors2.push(color(points2[i]));
    }
    canvas.line_loop(points1, colors1, undefined, 2, true);
    canvas.line_loop(points2, colors2, undefined, 2, true);
    for (i = 0; i<points1.length-1; i+=1) {
        var v1, v2, v3, v4;
        var i2=points1.length-i-1;
        v1 = points1[i];
        v2 = points2[i2];
        v3 = points2[i2-1];
        v4 = points1[i+1];
        canvas.quad(v1, v2, v3, v4, color(v1), color(v2), color(v3), color(v4));
    }
  }, function angle_line(angle, cent) {
    var px1=cent[0]+Math.sin(angle)*this.radius_min;
    var py1=cent[1]+Math.cos(angle)*this.radius_min;
    var px2=cent[0]+Math.sin(angle)*this.radius_max;
    var py2=cent[1]+Math.cos(angle)*this.radius_max;
    return [[px1, py1], [px2, py2]];
  }, function build_draw(canvas, isVertical) {
    if (!this.packed) {
        this.packmenu(canvas);
        this.packed = true;
    }
    UIFrame.prototype.build_draw.call(this, canvas, true);
    canvas.begin(this);
    if (this.closed) {
        this._have_rebuilt = true;
        canvas.end(this);
        return ;
    }
    this.build_circle(canvas);
    var cent=this.cent;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name!=UIRadialMenuEntry.name)
        continue;
      var lin1=this.angle_line(c.start_angle, cent);
      var lin2=this.angle_line(c.end_angle, cent);
      canvas.line(lin2[0], lin2[1], uicolors["DefaultText"], undefined, 2.0);
      var hcolor=uicolors["RadialMenuHighlight"];
      if (c.state&UIFlags.HIGHLIGHT) {
          this.build_arc(canvas, c.start_angle, c.end_angle-c.start_angle, hcolor);
      }
    }
    var v1=this.off_mpos(this.mpos);
    v1.normalize();
    v1.mulScalar(100.0);
    var sz2=cent;
    v1.add(sz2);
    var v2=sz2;
    canvas.end(this);
    this._have_rebuilt = true;
  }]);
  _es6_module.add_class(UIRadialMenu);
  UIRadialMenu = _es6_module.add_export('UIRadialMenu', UIRadialMenu);
  function is_menu_open(frame) {
    while (frame.parent!=undefined) {
      frame = frame.parent;
    }
    var __iter_c=__get_iter(frame.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name==UIRadialMenu.constructor.name&&!c.closed)
        return true;
      if (c.constructor.name==UIMenu.constructor.name&&!c.closed)
        return true;
    }
    return false;
  }
  function ui_call_radial_menu(menu, frame, pos) {
    var off=[pos[0], pos[1]];
    while (frame.parent!=undefined) {
      off[0]+=frame.pos[0];
      off[1]+=frame.pos[1];
      frame = frame.parent;
    }
    menu.closed = false;
    menu.canvas = frame.canvas;
    menu.packmenu(frame.canvas);
    menu.do_recalc();
    menu.had_up_event = undefined;
    menu.pos[0] = off[0]-menu.size[0]/2;
    menu.pos[1] = off[1]-menu.size[1]/2;
    menu.call_time = time_ms();
    menu.last_active = frame.active;
    frame.do_recalc();
    frame.add(menu);
    frame.push_modal(menu);
    frame._on_mousemove({"x": off[0]-frame.pos[0], "y": off[1]-frame.pos[1]});
  }
  function toolop_radial_menu(ctx, name, oplist) {
    var oplist_instance=[];
    function op_callback(entry, id) {
      ctx.toolstack.exec_tool(oplist_instance[id]);
    }
    var menu=new UIRadialMenu(name, op_callback);
    for (var i=0; i<oplist.length; i++) {
        var opstr=oplist[i];
        var op=opstr;
        if (typeof opstr=="string") {
            op = ctx.api.get_op(ctx, opstr);
        }
        if (op==undefined)
          continue;
        var hotkey;
        if (op.hotkey!=undefined)
          hotkey = op.build_str(true);
        else 
          hotkey = "";
        oplist_instance.push(op);
        menu.add_item(op.uiname, hotkey, oplist_instance.length-1);
    }
    return menu;
  }
  window.UIRadialMenu = UIRadialMenu;
}, '/home/ec2-user/fairmotion/src/ui/RadialMenu.js');
es6_module_define('UIWidgets_special', ["UIFrame", "UIElement", "../editors/viewport/events", "colorutils", "UIPack", "UIWidgets", "UITextBox", "mathlib", "UIMenu"], function _UIWidgets_special_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var rgba_to_hsva=es6_import_item(_es6_module, 'colorutils', 'rgba_to_hsva');
  var hsva_to_rgba=es6_import_item(_es6_module, 'colorutils', 'hsva_to_rgba');
  var KeyMap=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, '../editors/viewport/events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../editors/viewport/events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'EventHandler');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var UITextBox=es6_import_item(_es6_module, 'UITextBox', 'UITextBox');
  var UIMenu=es6_import_item(_es6_module, 'UIMenu', 'UIMenu');
  var UICollapseIcon=_ESClass("UICollapseIcon", UIButtonIcon, [function UICollapseIcon(ctx, is_collapsed, user_callback) {
    if (is_collapsed==undefined) {
        is_collapsed = false;
    }
    if (user_callback==undefined) {
        user_callback = undefined;
    }
    UIButtonIcon.call(this, ctx, "+", Icons.UI_COLLAPSE);
    this._collapsed = 0;
    this.collapsed = is_collapsed;
    var this2=this;
    this._wrapped_callback = function() {
      this2.collapsed^=true;
      if (this2._callback!=undefined)
        this2._callback(this2, this2.collapsed);
    }
    this._callback = user_callback;
  }, _ESClass.get(function callback() {
    return this._wrapped_callback;
  }), _ESClass.set(function callback(callback) {
    this._callback = callback;
  }), _ESClass.get(function collapsed() {
    return this._collapsed;
  }), _ESClass.set(function collapsed(val) {
    if (!!val!=!!this._collapsed) {
        this.icon = val ? Icons.UI_EXPAND : Icons.UI_COLLAPSE;
        this._collapsed = val;
        this.do_recalc();
    }
  })]);
  _es6_module.add_class(UICollapseIcon);
  UICollapseIcon = _es6_module.add_export('UICollapseIcon', UICollapseIcon);
  var UIPanel=_ESClass("UIPanel", RowFrame, [function UIPanel(ctx, name, id, is_collapsed) {
    if (name==undefined) {
        name = "";
    }
    if (id==undefined) {
        id = name;
    }
    if (is_collapsed==undefined) {
        is_collapsed = false;
    }
    RowFrame.call(this, ctx);
    this.permid = id;
    this.stored_children = new GArray();
    this.packflag|=PackFlags.ALIGN_LEFT;
    this.default_packflag|=PackFlags.INHERIT_WIDTH;
    this.state|=UIFlags.NO_FRAME_CACHE;
    this.user_opened = false;
    this.user_closed = false;
    var this2=this;
    function callback1(iconbut, do_collapse) {
      this2.collapsed^=true;
      this2.user_opened = !this2.collapsed;
      this2.user_closed = this2.collapsed;
    }
    this.pad[1] = 1;
    var tri=new UICollapseIcon(ctx, is_collapsed, callback1);
    tri.small_icon = true;
    tri.bgmode = "flat";
    this.tri = tri;
    var col=this.col();
    this.packflag|=PackFlags.NO_AUTO_SPACING;
    col.packflag|=PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    col.default_packflag&=~PackFlags.INHERIT_WIDTH;
    if (IsMobile)
      col.label(" ");
    col.add(tri);
    this.text = name;
    this.title = col.label(name);
    this.title.color = uicolors["PanelText"];
    this._collapsed = false;
    this.collapsed = is_collapsed;
    this._color = uicolors["CollapsingPanel"];
    this.start_child = this.children.length;
  }, function on_saved_uidata(descend) {
    RowFrame.prototype.on_saved_uidata.call(this, descend);
    var __iter_c=__get_iter(this.stored_children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      descend(c);
    }
  }, function on_load_uidata(visit) {
    RowFrame.prototype.on_load_uidata.call(this, visit);
    var __iter_c=__get_iter(this.stored_children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      visit(c);
    }
  }, function get_uhash() {
    return RowFrame.prototype.get_uhash.call(this)+this.permid;
  }, function get_filedata() {
    return {collapsed: this._collapsed, user_opened: this.user_opened}
  }, function load_filedata(obj) {
    this.collapsed = obj.collapsed;
    this.user_opened = obj.user_opened;
  }, _ESClass.get(function collapsed() {
    return this._collapsed;
  }), _ESClass.get(function color() {
    return this._color;
  }), _ESClass.set(function color(color) {
    for (var i=0; i<4; i++) {
        if (color[i]!=this._color[i]) {
            this.do_recalc();
            break;
        }
    }
    this._color = color;
  }), _ESClass.set(function collapsed(is_collapsed) {
    if (!!is_collapsed==this._collapsed)
      return ;
    if (is_collapsed!=this._collapsed&&this.parent!=undefined)
      this.parent.do_full_recalc();
    this.tri.collapsed = is_collapsed;
    this._collapsed = is_collapsed;
    this.user_opened = false;
    this.user_closed = false;
    if (!is_collapsed) {
        if (this.stored_children.length>0) {
            var __iter_c=__get_iter(this.stored_children);
            var c;
            while (1) {
              var __ival_c=__iter_c.next();
              if (__ival_c.done) {
                  break;
              }
              c = __ival_c.value;
              this.add(c);
            }
            this.stored_children = new GArray();
        }
    }
    else 
      if (this.children.length>this.start_child) {
        this.stored_children = this.children.slice(this.start_child, this.children.length);
        this.children = this.children.slice(0, this.start_child);
        this.do_recalc();
    }
  }), function add(child, packflag) {
    if (this._collapsed) {
        child.parent = this;
        child.packflag|=packflag|this.default_packflag;
        this.stored_children.push(child);
    }
    else {
      RowFrame.prototype.add.call(this, child);
    }
  }, function build_draw(canvas, isVertical) {
    this.title.color = uicolors["PanelText"];
    canvas.simple_box([0, 0], this.size, this.color);
    RowFrame.prototype.build_draw.call(this, canvas, isVertical);
  }]);
  _es6_module.add_class(UIPanel);
  UIPanel = _es6_module.add_export('UIPanel', UIPanel);
  var $ret_qybm=undefined;
  function get_editor_list() {
    if ($ret_qybm==undefined) {
        $ret_qybm = new GArray();
        var __iter_cls=__get_iter(defined_classes);
        var cls;
        while (1) {
          var __ival_cls=__iter_cls.next();
          if (__ival_cls.done) {
              break;
          }
          cls = __ival_cls.value;
          if (cls.__parent__!=undefined&&cls.__parent__.name=="Area") {
              $ret_qybm.push(cls);
          }
        }
    }
    return $ret_qybm;
  }
  function gen_editor_switcher(ctx, parent) {
    var editors=get_editor_list();
    var menu=new UIMenu("", undefined);
    var i=0;
    var __iter_e=__get_iter(editors);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      if (!e.debug_only||!RELEASE)
        menu.add_item(e.uiname, "", e);
      i++;
    }
    var obj={}
    function callback(entry, cls) {
      console.log("editor switcher callback", cls.name);
      parent.parent.switch_editor(cls);
      obj.e.text = parent.constructor.uiname;
    }
    menu.callback = callback;
    var e=new UIMenuButton(ctx, menu, [0, 0], [1, 1], undefined, "Switch editors");
    obj.e = e;
    e.text = parent.constructor.uiname;
    e.description = "Choose another editor pane";
    return e;
  }
  gen_editor_switcher = _es6_module.add_export('gen_editor_switcher', gen_editor_switcher);
  var _hue_field=[[1, 0, 0, 1], [1, 1, 0, 1], [0, 1, 0, 1], [0, 1, 1, 1], [0, 0, 1, 1], [1, 0, 1, 1]];
  var $pos_OGcX_do_mouse;
  var $mpos_j32__do_mouse;
  var $sz_Uk3W_build_draw;
  var $v1_aZMS_build_draw;
  var $v3_PYxg_build_draw;
  var $clr_DYTZ_build_draw;
  var $pos1_kc5A_build_draw;
  var $size_YLVy_do_mouse;
  var $v2_HrlA_build_draw;
  var $v4_QYvA_build_draw;
  var UIColorField=_ESClass("UIColorField", UIElement, [function UIColorField(ctx, callback) {
    if (callback==undefined) {
        callback = undefined;
    }
    UIElement.call(this, ctx);
    this.h = 0.0;
    this.s = 0.0;
    this.v = 1.0;
    this.huehgt = 25;
    this.mode = undefined;
    this.clicked = false;
    this.callback = callback;
  }, function get_min_size(canvas, isVertical) {
    return [150, 165];
  }, function do_mouse(event) {
    $mpos_j32__do_mouse[0] = event.x;
    $mpos_j32__do_mouse[1] = event.y;
    if (this.mode=="h") {
        this.h = ($mpos_j32__do_mouse[0]-7)/(this.size[0]-12-2);
        this.h = Math.min(Math.max(this.h, 0), 1.0);
        this.do_recalc();
        if (this.callback!=undefined) {
            this.callback(this, this.h, this.s, this.v);
        }
    }
    else 
      if (this.mode=="sv") {
        var v=$mpos_j32__do_mouse[0]/this.size[0];
        v = Math.sqrt(v);
        var s=($mpos_j32__do_mouse[1]-this.huehgt+2)/(this.size[1]-this.huehgt);
        this.v = Math.min(Math.max(v, 0), 1.0);
        this.s = Math.min(Math.max(s, 0), 1.0);
        this.do_recalc();
        if (this.callback!=undefined) {
            this.callback(this, this.h, this.s, this.v);
        }
    }
  }, function on_mousedown(event) {
    if (this.clicked==false) {
        this.clicked = true;
        this.mdown = true;
        this.push_modal();
        var pos=[1, 1];
        var size=[this.size[0]-2, this.huehgt];
        var mpos=[event.x, event.y];
        if (inrect_2d(mpos, pos, size)) {
            this.mode = "h";
        }
        else {
          this.mode = "sv";
        }
        this.do_mouse(event);
    }
  }, function on_mousemove(event) {
    if (this.clicked) {
        this.do_mouse(event);
    }
  }, function on_mouseup(event) {
    if (this.clicked) {
        this.clicked = false;
        this.pop_modal();
    }
  }, function build_draw(canvas, isVertical) {
    
    canvas.simple_box([0, 0], this.size);
    var cs=_hue_field;
    var segs=cs.length;
    var wid=Math.ceil((this.size[0]-2-$sz_Uk3W_build_draw[0])/cs.length);
    var h=this.h, s=this.s, v=this.v;
    var halfx=Math.floor($sz_Uk3W_build_draw[0]*0.5);
    canvas.box([0, 0], [this.size[0], 26], [0, 0, 0, 1], 0, true);
    var y=this.huehgt;
    var c1, c2, c3, c4;
    canvas.box1([1, 1], [halfx, y], cs[0]);
    canvas.quad([1, 1], [1, y], [halfx+1, y], [halfx+1, 1], cs[0]);
    for (var i=0; i<segs; i++) {
        var i2=(i+1)%cs.length;
        var c1=cs[i], c2=cs[i2], c3=cs[i2], c4=cs[i];
        $v1_aZMS_build_draw[0] = i*wid+1+halfx;
        $v1_aZMS_build_draw[1] = 1;
        $v2_HrlA_build_draw[0] = i*wid+1+halfx;
        $v2_HrlA_build_draw[1] = y;
        $v3_PYxg_build_draw[0] = i*wid+wid+1+halfx;
        $v3_PYxg_build_draw[1] = y;
        $v4_QYvA_build_draw[0] = i*wid+wid+1+halfx, $v4_QYvA_build_draw[1] = 1;
        canvas.quad($v2_HrlA_build_draw, $v3_PYxg_build_draw, $v4_QYvA_build_draw, $v1_aZMS_build_draw, c1, c2, c3, c4, true);
    }
    canvas.quad($v4_QYvA_build_draw, $v3_PYxg_build_draw, [this.size[0]-1, y], [this.size[0]-1, 1], cs[0]);
    $v1_aZMS_build_draw[0] = 0;
    $v1_aZMS_build_draw[1] = y+2;
    $v2_HrlA_build_draw[0] = 0;
    $v2_HrlA_build_draw[1] = this.size[1];
    $v3_PYxg_build_draw[0] = this.size[0];
    $v3_PYxg_build_draw[1] = this.size[1];
    $v4_QYvA_build_draw[0] = this.size[0];
    $v4_QYvA_build_draw[1] = 27;
    var h1=Math.floor(h*cs.length)%cs.length;
    var h2=(h1+1)%cs.length;
    var t=h*cs.length-h1;
    if (isNaN(h1))
      h1 = 0;
    if (isNaN(h2))
      h2 = 0;
    if (isNaN(t))
      t = 0;
    if (t<0||t>1)
      t = 0;
    for (var i=0; i<3; i++) {
        $clr_DYTZ_build_draw[i] = cs[h1][i]+(cs[h2][i]-cs[h1][i])*t;
    }
    c1 = [0, 0, 0, 1];
    c2 = [0, 0, 0, 1];
    c3 = $clr_DYTZ_build_draw;
    c4 = [1, 1, 1, 1];
    canvas.colorfield([0, this.huehgt], [this.size[0], this.size[1]-this.huehgt], $clr_DYTZ_build_draw);
    $pos1_kc5A_build_draw[0] = Math.floor(1+h*(this.size[0]-2-$sz_Uk3W_build_draw[0]));
    $pos1_kc5A_build_draw[1] = Math.floor(y*0.5-$sz_Uk3W_build_draw[1]*0.5);
    canvas.box($pos1_kc5A_build_draw, $sz_Uk3W_build_draw);
    $pos1_kc5A_build_draw[0] = Math.floor((this.size[0]-$sz_Uk3W_build_draw[0])*v*v);
    $pos1_kc5A_build_draw[1] = Math.floor((this.size[1]-y-4)*s+y+2-$sz_Uk3W_build_draw[1]*0.5);
    canvas.box($pos1_kc5A_build_draw, $sz_Uk3W_build_draw);
  }]);
  var $pos_OGcX_do_mouse=[0, 0];
  var $mpos_j32__do_mouse=[0, 0];
  var $sz_Uk3W_build_draw=[12, 12];
  var $v1_aZMS_build_draw=new Vector2();
  var $v3_PYxg_build_draw=new Vector2();
  var $clr_DYTZ_build_draw=[0, 0, 0, 1];
  var $pos1_kc5A_build_draw=[0, 0];
  var $size_YLVy_do_mouse=[0, 0];
  var $v2_HrlA_build_draw=new Vector2();
  var $v4_QYvA_build_draw=new Vector2();
  _es6_module.add_class(UIColorField);
  UIColorField = _es6_module.add_export('UIColorField', UIColorField);
  var $white_X4_R_build_draw;
  var $grey_UAbH_build_draw;
  var UIColorBox=_ESClass("UIColorBox", UIElement, [function UIColorBox(ctx, color) {
    if (color==undefined) {
        color = undefined;
    }
    UIElement.call(this, ctx);
    if (color==undefined)
      this.color = [0, 0, 0, 1];
    else 
      this.color = [color[0], color[1], color[2], color[3]];
  }, function get_min_size(canvas, isVertical) {
    return [40, 40];
  }, function build_draw(canvas, isVertical) {
    var tot=3, tot2=6;
    var wid=[this.size[0]/tot, this.size[1]/tot2];
    var pos=[0, 0];
    for (var i=0; i<tot; i++) {
        pos[1] = 0;
        for (var j=0; j<tot2; j++) {
            var k=(i+j)%2;
            canvas.box2(pos, wid, k ? $white_X4_R_build_draw : $grey_UAbH_build_draw);
            pos[1]+=wid[1];
        }
        pos[0]+=wid[0];
    }
    canvas.box2([0, 0], this.size, this.color);
  }]);
  var $white_X4_R_build_draw=[1.0, 1.0, 1.0, 1.0];
  var $grey_UAbH_build_draw=[0.3, 0.3, 0.3, 1.0];
  _es6_module.add_class(UIColorBox);
  UIColorBox = _es6_module.add_export('UIColorBox', UIColorBox);
  var $hsva_q9Bk_update_widgets;
  var $hsva_gcGb_hsv_callback;
  var UIColorPicker=_ESClass("UIColorPicker", RowFrame, [function UIColorPicker(ctx, color, color_length) {
    if (color==undefined) {
        color = undefined;
    }
    if (color_length==undefined) {
        color_length = 4;
    }
    RowFrame.call(this, ctx);
    this.last_valid_hue = 0;
    this.last_valid_sat = 0;
    this.color_length = color_length;
    if (color==undefined) {
        this._color = color_length==4 ? [1, 0, 0, 1] : [1, 0, 0];
    }
    else {
      this._color = [color[0], color[1], color[2]];
      if (color_length==4)
        this._color.push(color[3]);
    }
    this.last_valid = [];
    for (var i=0; i<color_length; i++) {
        this.last_valid.push(this._color[i]);
    }
    var this2=this;
    function hsv_callback(field, h, s, v) {
      this2.hsv_callback(field, h, s, v);
    }
    this.setter_path = undefined;
    this.field = new UIColorField(ctx, hsv_callback);
    this.preview = new UIColorBox(ctx, this._color);
    var col=this.col();
    this.preview.packflag|=PackFlags.INHERIT_HEIGHT;
    col.add(this.field);
    col.add(this.preview, PackFlags.INHERIT_HEIGHT);
    var r=new UINumBox(ctx, "R", [0, 1]);
    var g=new UINumBox(ctx, "G", [0, 1]);
    var b=new UINumBox(ctx, "B", [0, 1]);
    if (color_length==4) {
        var a=new UINumBox(ctx, "A", [0, 1]);
    }
    r.slide_power = g.slide_power = b.slide_power = 2.0;
    if (color_length==4)
      a.slide_power = 2.0;
    r.slide_mul = g.slide_mul = b.slide_mul = 4.0;
    if (color_length==4)
      a.slide_mul = 4.0;
    var row=this.row(undefined, PackFlags.INHERIT_WIDTH, PackFlags.INHERIT_WIDTH);
    row.add(r), row.add(g), row.add(b);
    if (color_length==4) {
        row.add(a);
    }
    var this2=this;
    function slider_callback(axis) {
      function callback(slider, val) {
        this2._color[axis] = val;
        this2.update_widgets();
        this2.on_colorchange();
      }
      return callback;
    }
    r.callback = slider_callback(0);
    g.callback = slider_callback(1);
    b.callback = slider_callback(2);
    if (color_length==4) {
        a.callback = slider_callback(3);
    }
    this.r = r;
    this.g = g;
    this.b = b;
    if (color_length==4) {
        this.a = a;
    }
    this.update_widgets();
  }, function on_colorchange() {
  }, function on_tick() {
    if (this.state&UIFlags.USE_PATH) {
        window._cw = this;
        var color=this.get_prop_data();
        if (!(this.state&UIFlags.ENABLED))
          return ;
        var same=true;
        for (var i=0; i<this.color_length; i++) {
            if (color[i]!=this._color[i]) {
                same = false;
            }
            this._color[i] = color[i];
        }
        if (!same&&this.modalhandler==undefined) {
            this.update_widgets();
            this.on_colorchange();
        }
    }
  }, _ESClass.get(function color() {
    return this._color;
  }), _ESClass.set(function color(color) {
    var do_update=false;
    for (var i=0; i<this.color_length; i++) {
        if (this._color[i]!=color[i]) {
            this._color[i] = color[i];
            do_update = true;
        }
    }
    if (do_update)
      this.update_widgets();
    this.do_path();
    this.on_colorchange();
  }), function do_path() {
    if (this.state&UIFlags.USE_PATH) {
        var clr=this.get_prop_data();
        if (clr==undefined)
          return ;
        for (var i=0; i<this.color_length; i++) {
            if (clr[i]!=this._color[i]) {
                this.set_prop_data(this._color);
                break;
            }
        }
    }
  }, function update_widgets() {
    var c=this._color, lasthue=undefined;
    for (var i=0; i<$hsva_q9Bk_update_widgets.length; i++) {
        if (isNaN($hsva_q9Bk_update_widgets[i])) {
            console.log("Eek, NaN!");
            $hsva_q9Bk_update_widgets[i] = 0.0;
        }
    }
    for (var i=0; i<this._color.length; i++) {
        if (isNaN(this._color[i])) {
            console.log("eek, NaN");
            this._color[i] = 0.0;
        }
    }
    for (var i=0; i<this.color_length; i++) {
        this.last_valid[i] = this._color[i];
    }
    this.last_valid_hue = rgba_to_hsva(this._color, $hsva_q9Bk_update_widgets, this.last_valid_hue);
    if ($hsva_q9Bk_update_widgets[1]<0) {
        $hsva_q9Bk_update_widgets[1] = this.last_valid_sat;
    }
    else {
      this.last_valid_sat = $hsva_q9Bk_update_widgets[1];
    }
    this.field.h = $hsva_q9Bk_update_widgets[0]*0.9999;
    this.field.s = $hsva_q9Bk_update_widgets[1];
    this.field.v = $hsva_q9Bk_update_widgets[2];
    this.field.do_recalc();
    this.preview.color = this._color;
    this.preview.do_recalc();
    this.r.set_val(this._color[0]);
    this.g.set_val(this._color[1]);
    this.b.set_val(this._color[2]);
    if (isNaN(this.color[2])) {
        console.log("NaN!", this._color, $hsva_q9Bk_update_widgets);
    }
    if (this.color_length==4) {
        this.a.set_val(this._color[3]);
    }
    this.do_path();
  }, function hsv_callback(field, h, s, v) {
    $hsva_gcGb_hsv_callback[0] = h*0.9999;
    $hsva_gcGb_hsv_callback[1] = s;
    $hsva_gcGb_hsv_callback[2] = v;
    if (this.color_length==4)
      $hsva_gcGb_hsv_callback[3] = this._color[3];
    else 
      $hsva_gcGb_hsv_callback[3] = 1.0;
    this.last_valid_hue = h;
    this.last_valid_sat = s;
    this.last_valid_hue = hsva_to_rgba($hsva_gcGb_hsv_callback, this._color, h*0.9999);
    this.update_widgets();
    this.on_colorchange();
  }]);
  var $hsva_q9Bk_update_widgets=[0, 0, 0, 0];
  var $hsva_gcGb_hsv_callback=[0, 0, 0, 0];
  _es6_module.add_class(UIColorPicker);
  UIColorPicker = _es6_module.add_export('UIColorPicker', UIColorPicker);
  var UIBoxWColor=_ESClass("UIBoxWColor", ColumnFrame, [function UIBoxWColor(ctx, path) {
    ColumnFrame.call(this, ctx, path);
    try {
      this.prop("color");
      var row=this.prop("weights");
      row.packflag|=PackFlags.NO_AUTO_SPACING|PackFlags.ALIGN_BOTTOM;
      var i=1;
      var __iter_c=__get_iter(row.children);
      var c;
      while (1) {
        var __ival_c=__iter_c.next();
        if (__ival_c.done) {
            break;
        }
        c = __ival_c.value;
        if (__instance_of(c, UINumBox)) {
            c.slide_power = 2.0;
            c.slide_mul = 4.0;
            c.unit = undefined;
            c.text = ""+i;
            i++;
        }
      }
      row.children.reverse();
      row.pad[0] = 20;
    }
    catch (_err) {
        print_stack(_err);
        console.log("failed to create UIBoxWColor with weights");
        try {
          this.prop("color");
        }
        catch (_err) {
            console.log("failed to create UIBoxWColor without weights");
        }
    }
  }]);
  _es6_module.add_class(UIBoxWColor);
  UIBoxWColor = _es6_module.add_export('UIBoxWColor', UIBoxWColor);
  var UIBoxColor=_ESClass("UIBoxColor", RowFrame, [function UIBoxColor() {
    RowFrame.apply(this, arguments);
  }]);
  _es6_module.add_class(UIBoxColor);
  UIBoxColor = _es6_module.add_export('UIBoxColor', UIBoxColor);
  var $zero_ja7h_build_draw;
  var $size2_im70_build_draw;
  var $one_IX7R_build_draw;
  var UIProgressBar=_ESClass("UIProgressBar", UIElement, [function UIProgressBar(ctx, value, min, max, min_wid, min_hgt) {
    if (value==undefined) {
        value = 0.0;
    }
    if (min==undefined) {
        min = 0.0;
    }
    if (max==undefined) {
        max = 1.0;
    }
    if (min_wid==undefined) {
        min_wid = 200;
    }
    if (min_hgt==undefined) {
        min_hgt = 25;
    }
    UIElement.call(this, ctx);
    this.value = value;
    this.min = min;
    this.max = max;
    this.min_wid = min_wid;
    this.min_hgt = min_hgt;
    this.size[1] = min_hgt;
    this.size[0] = min_wid;
    this.last_value = this.value;
  }, function get_min_size(canvas, isVertical) {
    return [this.min_wid, this.min_hgt];
  }, function on_tick() {
    UIElement.prototype.on_tick.call(this);
    if (!(this.state&UIFlags.ENABLED))
      return ;
    if (this.last_value!=this.value) {
        this.do_recalc();
        this.last_value = this.value;
    }
  }, function set_value(value) {
    this.last_value = this.value;
    this.value = value;
  }, function build_draw(canvas, isVertical) {
    canvas.begin(this);
    var perc=(this.value/(this.max-this.min));
    canvas.box($zero_ja7h_build_draw, this.size, uicolors["ProgressBarBG"]);
    if (perc>0.0) {
        perc = Math.min(Math.max(0.0, perc), 1.0);
        $size2_im70_build_draw[1] = this.size[1]-2;
        $size2_im70_build_draw[0] = Math.floor(this.size[0]*perc)-2;
        canvas.box($one_IX7R_build_draw, $size2_im70_build_draw, uicolors["ProgressBar"]);
    }
    canvas.end(this);
  }]);
  var $zero_ja7h_build_draw=[0, 0];
  var $size2_im70_build_draw=[0, 0];
  var $one_IX7R_build_draw=[1, 1];
  _es6_module.add_class(UIProgressBar);
  UIProgressBar = _es6_module.add_export('UIProgressBar', UIProgressBar);
  var UIListEntry=_ESClass("UIListEntry", ColumnFrame, [function UIListEntry(ctx, text, id) {
    ColumnFrame.call(this, ctx);
    this.state&=~UIFlags.USE_PAN;
    this.packflag|=PackFlags.INHERIT_WIDTH;
    this.text = text;
    this.id = id;
    this.icon = -1;
    this.start_mpos = new Vector2();
    this.touchdown = false;
    this.text_edit_mode = false;
  }, function begin_text_edit() {
    if (this.text_edit_mode) {
        console.log("Warning, invalid call to begin_text_edit()!");
        return ;
    }
    var tbox=new UITextBox(this.ctx, this.text);
    this.add(tbox);
    tbox.begin_edit();
    var this2=this;
    tbox.on_end_edit = function(textbox, cancel) {
      this2.end_text_edit();
      if (this2.on_end_edit!=undefined) {
          this2.on_end_edit(textbox, cancel);
      }
    }
    this.text_edit_mode = true;
    this.textbox = tbox;
  }, function end_text_edit() {
    if (!this.text_edit_mode) {
        console.log("Warning, invalid call to end_text_edit()!");
        return ;
    }
    this.text_edit_mode = false;
    if (this.textbox.editing) {
        this.textbox.end_edit();
    }
    this.text = this.textbox.text;
    this.remove(this.textbox);
    this.textbox = undefined;
  }, function get_min_size(canvas, isvertical) {
    if (this.children.length>0) {
        return ColumnFrame.prototype.get_min_size.call(this, canvas, isvertical);
    }
    else {
      var pad=4;
      return [canvas.textsize(this.text)[0]+pad, 26];
    }
  }, function on_mouseup(event) {
    ColumnFrame.prototype.on_mouseup.call(this, event);
  }, function build_draw(canvas, isVertical) {
    this.state&=~UIFlags.USE_PAN;
    if (!(this.state&UIFlags.ENABLED))
      canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
    else 
      if (this==this.parent.parent.active_entry) {
        canvas.simple_box([0, 0], this.size, uicolors["MenuHighlight"]);
    }
    else 
      if (this.state&UIFlags.HIGHLIGHT) {
        canvas.simple_box([0, 0], this.size, uicolors["MenuHighlight"]);
    }
    ColumnFrame.prototype.build_draw.call(this, canvas, isVertical);
    if (this.icon>=0) {
        canvas.icon(this.icon, [1, 1], undefined, true);
    }
    if (!this.text_edit_mode) {
        var tsize;
        if (this.text!=undefined)
          tsize = canvas.textsize(this.text);
        else 
          tsize = 50;
        canvas.text([22, (this.size[1]-tsize[1])*0.25], this.text, uicolors["ListBoxText"]);
    }
  }]);
  _es6_module.add_class(UIListEntry);
  UIListEntry = _es6_module.add_export('UIListEntry', UIListEntry);
  var $pan_g6mP__vscroll_callback;
  var UIListBox=_ESClass("UIListBox", ColumnFrame, [function UIListBox(ctx, pos, size, callback) {
    ColumnFrame.call(this, ctx);
    if (size!=undefined&&size[0]+size[1]!=0.0)
      this.size = size;
    else 
      this.size = [500, 350];
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    var pflag=PackFlags.IGNORE_LIMIT|PackFlags.NO_AUTO_SPACING;
    pflag|=PackFlags.INHERIT_WIDTH|PackFlags.ALIGN_LEFT;
    this.listbox = new RowFrame(ctx);
    this.listbox.packflag|=PackFlags.NO_AUTO_SPACING;
    this.listbox.pad[1] = 0;
    this.listbox.state|=UIFlags.HAS_PAN;
    this.add(this.listbox, pflag);
    this.active_entry = undefined;
    this.callback = callback;
    this.go_callback = undefined;
    this.mdown = false;
    this.vscroll = new UIVScroll(ctx, [0, 0]);
    this.vscroll.packflag|=PackFlags.INHERIT_HEIGHT;
    this.scrollx = 0;
    this.scrolly = 0;
    var this2=this;
    this.vscroll.callback = function(vscroll, value) {
      if (!this2.listbox.velpan.panning)
        this2._vscroll_callback(vscroll, value);
    }
    this.vscroll.step = 26;
    this.add(this.vscroll);
    this.packflag|=PackFlags.ALIGN_LEFT;
    this.state|=UIFlags.NO_FRAME_CACHE;
  }, function on_tick() {
    ColumnFrame.prototype.on_tick.call(this);
    if (this.vscroll.val!=this.listbox.velpan.pan[1]) {
        this.vscroll.set_value(this.listbox.velpan.pan[1]);
    }
  }, function load_filedata(map) {
    ColumnFrame.prototype.load_filedata.call(this, map);
    if ("active_entry" in map) {
        var act=map["active_entry"];
        var i=0;
        var __iter_c=__get_iter(this.listbox.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          if (c.text==act) {
              this._set_active(c);
              break;
          }
        }
    }
  }, function get_filedata() {
    var ret=ColumnFrame.prototype.get_filedata.call(this);
    if (ret==undefined)
      ret = {}
    if (this.active_entry!=undefined)
      ret["active_entry"] = this.active_entry.text;
    return ret;
  }, function _vscroll_callback(vscroll, value) {
    $pan_g6mP__vscroll_callback[1] = value;
    this.listbox.velpan.set_pan($pan_g6mP__vscroll_callback);
    this.listbox.do_full_recalc();
    this.do_full_recalc();
  }, function on_doubleclick(event) {
    console.log("LISTBOX double click!");
    if (event.button==0&&this.go_callback!=undefined) {
        this.go_callback(this, this.active_entry.text, this.active_entry.id);
    }
  }, function on_mousedown(event) {
    ColumnFrame.prototype.on_mousedown.call(this, event);
    this.mstart = new Vector2([event.x, event.y]);
    this.mdown = true;
    this.mtime = time_ms();
  }, function handle_clicked(event) {
  }, function on_mousemove(event) {
    ColumnFrame.prototype.on_mousemove.call(this, event);
    if (!this.listbox.velpan.panning&&this.mdown&&this.mstart.vectorDistance([event.x, event.y])>25) {
    }
  }, function on_mouseup(event) {
    ColumnFrame.prototype.on_mouseup.call(this, event);
    this.mdown = false;
    this.listbox.velpan.can_coast = true;
    console.log("  PANNING: ", this.listbox.velpan.panning);
    if (this.listbox.velpan.panning)
      return ;
    if (this.listbox.active!=undefined&&__instance_of(this.listbox.active, UIListEntry)) {
        this._set_active(this.listbox.active);
    }
  }, function jump(off, absolute) {
    if (absolute==undefined) {
        absolute = false;
    }
    var i;
    if (absolute) {
        i = off<0 ? this.listbox.children.length+off : off;
    }
    else {
      if (this.active_entry==undefined)
        return ;
      i = this.listbox.children.indexOf(this.active_entry)+off;
    }
    i = Math.min(Math.max(0, i), this.listbox.children.length-1);
    var active=this.listbox.children[i];
    if (active==undefined)
      return ;
    this._set_active(active);
    active.abspos[0] = 0;
    active.abspos[1] = 0;
    active.abs_transform(active.abspos);
    var y=active.abspos[1]-(this.abspos[1]+this.listbox.pos[1]);
    y+=this.listbox.velpan.pan[1];
    console.log("y", y, this.listbox.size[1]);
    if (y<0||y>this.listbox.size[1]) {
        var pan=[this.listbox.velpan.pan[0], this.listbox.velpan.pan[1]];
        if (y>this.listbox.size[1]) {
            pan[1] = -(active.pos[1]-this.size[1]+active.size[1]);
        }
        else {
          pan[1] = -active.pos[1];
        }
        this.vscroll.set_value(pan[1]);
        this.listbox.velpan.set_pan(pan);
        this.listbox.do_full_recalc();
        this.do_full_recalc();
        for (var j=0; j<this.listbox.children.length; j++) {
            this.listbox.children[j].abspos[0] = 0;
            this.listbox.children[j].abspos[1] = 0;
            this.listbox.children[j].abs_transform(this.listbox.children[j].abspos);
        }
    }
  }, function set_active(id) {
    var entry;
    for (var i=0; i<this.listbox.children.length; i++) {
        var entry2=this.listbox.children[i];
        if (entry2.id==id) {
            entry = entry2;
            break;
        }
    }
    this._set_active(entry);
  }, function _set_active(entry, suppress_callback) {
    if (suppress_callback==undefined) {
        suppress_callback = false;
    }
    if (this.active_entry!=entry&&this.active_entry!=undefined) {
        this.active_entry.do_recalc();
    }
    this.active_entry = entry;
    this.do_full_recalc();
    if (entry!=undefined) {
        entry.do_recalc();
        if (this.callback!=undefined&&!suppress_callback) {
            this.callback(this, this.active_entry.text, this.active_entry.id);
        }
    }
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Enter"]:
        console.log("Enter go_callback");
        if (this.go_callback!=undefined) {
            this.go_callback(this, this.active_entry.text, this.active_entry.id);
        }
        break;
      case charmap["Up"]:
        this.jump(-1);
        this.do_full_recalc();
        break;
      case charmap["Down"]:
        this.jump(1);
        this.do_full_recalc();
        break;
    }
  }, function add_item(str, id) {
    var entry=new UIListEntry(this.ctx, str, id);
    entry.packflag|=PackFlags.ALIGN_LEFT|PackFlags.INHERIT_WIDTH;
    var this2=this;
    entry.callback = function(entry) {
      this2._set_active(entry);
    }
    this.listbox.add(entry, PackFlags.ALIGN_LEFT);
    this.do_recalc();
    var canvas=this.get_canvas();
    var hgt=canvas!=undefined ? entry.get_min_size(canvas)[1] : 18;
    if (isNaN(hgt)) {
        console.warn("Nan in UIListBox.add_item!", entry);
        hgt = 12;
    }
    this.listbox.size[1]+=hgt;
    this.listbox.pan_bounds[1][1]+=hgt;
    this.vscroll.set_range([0, this.listbox.pan_bounds[1][1]]);
    if (canvas!=undefined)
      this.pack(this.get_canvas());
    return entry;
  }, function build_draw(canvas, isVertical) {
    canvas.push_scissor([0, 0], this.size);
    canvas.simple_box([0, 0], this.size, uicolors["ListBoxBG"]);
    ColumnFrame.prototype.build_draw.call(this, canvas, isVertical);
    canvas.pop_scissor();
  }, function reset() {
    this.listbox.children = new GArray();
    this.listbox.velpan.pan[0] = this.listbox.velpan.pan[1] = 0.0;
    this.vscroll.set_value(0.0);
    this.do_recalc();
  }, function pack(canvas, is_vertical) {
    this.listbox.size[0] = this.size[0]-26;
    this.listbox.size[1] = this.size[1];
    this.listbox.packflag|=PackFlags.KEEP_SIZE;
    ColumnFrame.prototype.pack.call(this, canvas, is_vertical);
    this.listbox.pan_bounds[0][0] = 0;
    this.listbox.pan_bounds[0][1] = 0;
    this.listbox.pan_bounds[1][1] = Math.max(this.listbox.pan_bounds[1][1], 0.0);
    this.vscroll.pos[1] = 0;
    this.vscroll.size[1] = this.size[1];
    if (this.listbox.pan_bounds[1][1]<=0) {
        this.vscroll.set_range([0, 0]);
    }
    else {
      this.vscroll.set_range([0, this.listbox.pan_bounds[1][1]]);
    }
  }, function get_min_size(canvas, isVertical) {
    if (this.size!=undefined&&this.size[0]+this.size[1]!=0.0) {
        return this.size;
    }
    else {
      return CACHEARR2(500, 300);
    }
  }]);
  var $pan_g6mP__vscroll_callback=[0, 0];
  _es6_module.add_class(UIListBox);
  UIListBox = _es6_module.add_export('UIListBox', UIListBox);
  window.UIColorPicker = UIColorPicker;
}, '/home/ec2-user/fairmotion/src/ui/UIWidgets_special.js');
es6_module_define('UIWidgets_special2', ["UIPack", "dialog", "UIWidgets_special", "UIElement"], function _UIWidgets_special2_module(_es6_module) {
  'use strict';
  var PackedDialog=es6_import_item(_es6_module, 'dialog', 'PackedDialog');
  var Dialog=es6_import_item(_es6_module, 'dialog', 'Dialog');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIHoverHint=es6_import_item(_es6_module, 'UIElement', 'UIHoverHint');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var UIColorPicker=es6_import_item(_es6_module, 'UIWidgets_special', 'UIColorPicker');
  var UIColorField=es6_import_item(_es6_module, 'UIWidgets_special', 'UIColorField');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var UIColorButton=_ESClass("UIColorButton", RowFrame, [function UIColorButton(ctx, packflag) {
    RowFrame.call(this, ctx);
    this.pad = [0, 0];
    var frame;
    if (!(packflag&PackFlags.VERTICAL)) {
        frame = this.col();
        frame.pad = [0, 0];
        frame.packflag|=packflag;
    }
    else {
      frame = this;
    }
    this.packflag|=packflag;
    this._label = frame.label("Color");
    this.colorb = new UIColorButtonField(ctx);
    frame.add(this.colorb);
  }, function on_tick() {
    RowFrame.prototype.on_tick.call(this);
    if (this.state&UIFlags.USE_PATH) {
        this.colorb.state|=UIFlags.USE_PATH;
        this.colorb.data_path = this.data_path;
        this.colorb.setter_path = this.setter_path;
        var prop=this.get_prop_meta();
        if (prop.uiname!=this._label.text) {
            this._label.text = prop.uiname;
            this._label.do_recalc();
        }
    }
    else {
      this.colorb.state&=~UIFlags.USE_PATH;
    }
  }]);
  _es6_module.add_class(UIColorButton);
  UIColorButton = _es6_module.add_export('UIColorButton', UIColorButton);
  var UIColorButtonField=_ESClass("UIColorButtonField", UIHoverHint, [function UIColorButtonField(ctx, path, pos, size) {
    if (path==undefined) {
        path = undefined;
    }
    if (pos==undefined) {
        pos = undefined;
    }
    if (size==undefined) {
        size = undefined;
    }
    UIHoverHint.call(this, ctx, path, pos, size);
    this.clicked = false;
    this.mdown = false;
    this.dialog = undefined;
    this.title = "Color";
    this.description = this.title;
    this.color = [1, 0, 0, 1];
  }, function on_tick() {
    UIHoverHint.prototype.on_tick.call(this);
    if (this.state&UIFlags.USE_PATH) {
        var prop=this.get_prop_meta();
        if (prop==undefined) {
            return ;
        }
        if (prop.description!=undefined&&prop.description!="") {
            this.description = prop.description;
        }
        else {
          this.description = prop.uiname;
        }
        this.title = prop.uiname;
        var color=this.get_prop_data();
        if (!(this.state&UIFlags.ENABLED))
          return ;
        if (color==undefined||typeof color!="object"||typeof color.length!="number") {
            if (Math.random()>0.99) {
                console.log("Error in UIColorButton!", color);
            }
            return ;
        }
        if (this.color.length!=color.length) {
            this.color.length = color.length;
        }
        var same=true;
        for (var i=0; i<this.color.length; i++) {
            if (color[i]!=this.color[i]) {
                this.color[i] = color[i];
                same = false;
            }
        }
        if (!same) {
            this.do_recalc();
        }
    }
    if (this.dialog!=undefined&&this.dialog.closed) {
        if (this.clicked)
          this.do_recalc();
        this.clicked = false;
    }
  }, function build_draw(canvas, isVertical) {
    UIHoverHint.prototype.build_draw.call(this, canvas, isVertical);
    canvas.begin(this);
    var chksize=10, chkpad=3;
    var totcheck=~~(Math.max(this.size[0], this.size[1])/chksize+0.5);
    var clra=[0.8, 0.8, 0.8, 1.0], clrb=[0.34, 0.34, 0.34, 1];
    for (var i=0; i<totcheck*totcheck; i++) {
        var x=i%totcheck;
        var y=~~(i/totcheck);
        var x2=(x+1)*chksize, y2=(y+1)*chksize;
        var checkbool=(x+y)%2==0;
        x*=chksize, y*=chksize;
        if (x>=this.size[0]-chkpad*2||y>=this.size[1]-chkpad*2) {
            continue;
        }
        x2 = Math.min(x2, this.size[0]-chkpad*2);
        y2 = Math.min(y2, this.size[1]-chkpad*2);
        x+=chkpad, y+=chkpad;
        x2+=chkpad, y2+=chkpad;
        var clr=checkbool ? clra : clrb;
        canvas.quad([x, y], [x, y2], [x2, y2], [x2, y], clr, clr, clr, clr, false);
    }
    if (!(this.state&UIFlags.ENABLED)) {
        canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
    }
    else {
      canvas.box([0, 0], this.size, this.color);
    }
    if (this.clicked) {
        canvas.box([0, 0], this.size, [0.25, 0.25, 0.25, 0.5]);
    }
    else 
      if (this.state&UIFlags.HIGHLIGHT) {
        var highlight=uicolors["HLightBox"];
        if (typeof highlight[0]!="number") {
            highlight = highlight[0];
        }
        highlight = highlight.slice(0, highlight.length);
        highlight.length = 4, highlight[3] = 0.3;
        canvas.box([0, 0], this.size, highlight);
    }
    canvas.end(this);
  }, function on_mousedown(e) {
    this.mdown = true;
    if (e.button==0) {
        this.clicked^=true;
        this.do_recalc();
        if (this.clicked) {
            this.spawn_colorpicker();
        }
        else {
          this.dialog.end(false);
          this.dialog = undefined;
        }
    }
  }, function spawn_colorpicker() {
    var dialog=this.dialog = new PackedDialog(this.title, this.ctx, this.ctx.screen);
    dialog.size = [420, 420];
    dialog.packflag|=PackFlags.KEEP_SIZE;
    dialog.subframe.size = [420, 420];
    dialog.subframe.packflag|=PackFlags.KEEP_SIZE;
    var picker=new UIColorPicker(this.ctx, this.color, this.color.length);
    dialog.subframe.add(picker);
    if (this.state&UIFlags.USE_PATH) {
        picker.state|=UIFlags.USE_PATH;
        picker.data_path = this.data_path;
        picker.setter_path = this.setter_path;
    }
    dialog.call(this.abs_pos);
    this.ctx.screen.do_full_recalc();
    var button=this;
    picker.on_colorchange = function() {
      var color=this.color;
      for (var i=0; i<button.color.length; i++) {
          button.color[i] = color[i];
      }
      button.do_recalc();
    }
  }, function on_mouseup(e) {
    this.mdown = false;
  }, function get_min_size(canvas, isVertical) {
    return [120, 26];
  }]);
  _es6_module.add_class(UIColorButtonField);
  UIColorButtonField = _es6_module.add_export('UIColorButtonField', UIColorButtonField);
  window.UIColorButton = UIColorButton;
}, '/home/ec2-user/fairmotion/src/ui/UIWidgets_special2.js');
es6_module_define('UITabPanel', ["UIPack", "UIFrame", "mathlib", "UIWidgets", "UIElement"], function _UITabPanel_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var _UITab=_ESClass("_UITab", [function _UITab(text, description, id, tbound) {
    this.text = text;
    this.description = description;
    this.id = id;
    this.tbound = tbound;
    this.pos = [0, 0];
    this.size = [0, 0];
    this.textpad = 1;
  }]);
  _es6_module.add_class(_UITab);
  _UITab = _es6_module.add_export('_UITab', _UITab);
  var UITabBar=_ESClass("UITabBar", UIElement, [function UITabBar(ctx, mode, callback) {
    if (mode==undefined) {
        mode = "v";
    }
    if (callback==undefined) {
        callback = undefined;
    }
    UIElement.call(this, ctx);
    this.highlight = undefined;
    this.active = undefined;
    this.tabs = new GArray();
    this.mm = new MinMax(2);
    this.callback = callback;
    
    this.triwid = 4;
    this.mode = mode;
    this.thickness = this.min_thickness = IsMobile ? 28 : 35;
  }, function add_tab(text, tooltip, id) {
    if (tooltip==undefined) {
        tooltip = "";
    }
    if (id==undefined) {
        id = undefined;
    }
    var tab=new _UITab(text, tooltip, id, undefined);
    this.tabs.push(tab);
    if (this.active==undefined)
      this.active = tab;
  }, function get_min_size(canvas, isVertical) {
    var thickness=this.min_thickness;
    var tpad=this.triwid*4.0;
    var twid=tpad;
    var __iter_c=__get_iter(this.tabs);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      var sz=canvas.textsize(c.text);
      twid+=sz[0]+tpad+c.textpad*2;
      thickness = Math.max(sz[1], thickness);
    }
    this.thickness = thickness;
    if (this.mode=="v")
      return [thickness, twid];
    else 
      return [twid, thickness];
  }, function build_draw(canvas, isVertical) {
    var ax=0, ay=1;
    var w=this.thickness;
    var tri=this.triwid;
    var pos=[0, this.size[1]];
    var size=[w, 0];
    var pos2=[Math.floor(w/1.5)-7, 0];
    var pos3=[0, 0];
    var size2=[0, 0];
    var rot=new Matrix4();
    rot.rotate(0, 0, Math.pi/2);
    var y1=this.active.pos[1]-tri;
    var y2=this.active.pos[1]+this.active.size[1]+tri;
    if (y1<5)
      y1 = 0;
    if (y2>=this.size[1]-5)
      y2 = this.size[1]-1;
    var __iter_t=__get_iter(this.tabs);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      if (t.tbound==undefined) {
          t.tbound = canvas.textsize(t.text);
          t.tbound = [t.tbound[0]+t.textpad*2, t.tbound[1]];
      }
      size[0] = w;
      size[1] = t.tbound[0]+12;
      pos[1]-=t.tbound[0]+8+tri*2.0;
      t.pos[0] = pos[0];
      t.pos[1] = pos[1];
      t.size[0] = size[1];
      t.size[1] = size[1];
      pos3[0] = pos[0]+size[0];
      pos3[1] = pos[1]+size[1];
      this.mm.minmax(pos);
      this.mm.minmax(pos3);
      pos2[1] = pos[1]+4+t.textpad;
      if (t==this.highlight&&t!=this.active)
        canvas.simple_box(pos, size, uicolors["HighlightTab"]);
      else 
        if (t!=this.active)
        canvas.simple_box(pos, size, uicolors["InactiveTab"]);
      else {
        pos3[0] = 0;
        pos3[1] = y1;
        size2[0] = w+1;
        size2[1] = y2-y1;
        canvas.box2(pos3, size2, uicolors["ActiveTab"]);
      }
      canvas.text(pos2, t.text, uicolors["TabText"], undefined, undefined, Math.PI/2.0);
    }
    var lineclr=uicolors["TabPanelOutline"];
    if (!(this.packflag&PackFlags.FLIP_TABSTRIP)) {
        canvas.line([w, 0], [w, y1], lineclr);
        canvas.line([0, y1], [w, y1], lineclr);
        canvas.line([0, y1], [0, y2], lineclr);
        canvas.line([0, y2], [w, y2], lineclr);
        canvas.line([w, y2], [w, this.size[1]], lineclr);
    }
    else {
      canvas.line([0, 0], [0, y1], lineclr);
      canvas.line([w, y1], [0, y1], lineclr);
      canvas.line([w, y1], [w, y2], lineclr);
      canvas.line([w, y2], [0, y2], lineclr);
      canvas.line([0, y2], [0, this.size[1]], lineclr);
    }
  }, function on_inactive() {
    if (this.highlight!=undefined) {
        this.highlight = undefined;
        this.do_recalc();
    }
  }, function on_mousedown(event) {
    var mpos=[event.x, event.y];
    this.find_active(mpos);
    if (this.highlight!=undefined) {
        if (this.highlight!=this.active) {
            this.active = this.highlight;
            this.do_recalc();
            if (this.callback!=undefined) {
                this.callback(this.active.text, this.active.id);
            }
        }
    }
  }, function find_active(mpos) {
    var tab=undefined;
    var __iter_t=__get_iter(this.tabs);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      if (inrect_2d(mpos, t.pos, t.size)) {
          tab = t;
          break;
      }
    }
    if (tab!=this.highlight)
      this.do_recalc();
    this.highlight = tab;
  }, function on_mousemove(event) {
    var mpos=[event.x, event.y];
    this.find_active(mpos);
  }]);
  _es6_module.add_class(UITabBar);
  UITabBar = _es6_module.add_export('UITabBar', UITabBar);
  var UITabPanel=_ESClass("UITabPanel", UIFrame, [function UITabPanel(ctx, size, mode, flip) {
    if (size==undefined) {
        size = undefined;
    }
    if (mode==undefined) {
        mode = "v";
    }
    if (flip==undefined) {
        flip = false;
    }
    UIFrame.call(this, ctx);
    this.flip = flip;
    if (flip)
      this.packflag|=PackFlags.FLIP_TABSTRIP;
    if (size!=undefined) {
        this.size = size;
    }
    this.mode = mode;
    this.subframe = mode=="v" ? new ColumnFrame(ctx) : new RowFrame(ctx);
    this.subframe.pos = [0, 0];
    this.subframe.pad[1] = 0;
    this.subframe.pad[0] = flip ? 4 : 0;
    this.subframe.packflag|=PackFlags.NO_AUTO_SPACING|PackFlags.ALIGN_LEFT|PackFlags.ALIGN_BOTTOM;
    this.subframe.packflag|=PackFlags.IGNORE_LIMIT;
    this.subframe.packflag|=PackFlags.NO_LEAD_SPACING|PackFlags.NO_TRAIL_SPACING;
    this.subframe.default_packflag|=PackFlags.INHERIT_WIDTH;
    var this2=this;
    function callback(text, id) {
      this2.tab_callback(text, id);
    }
    this.panels = new GArray();
    this.tabstrip = new UITabBar(ctx, undefined, callback);
    this.tabstrip.packflag|=PackFlags.INHERIT_HEIGHT;
    this.content = new RowFrame();
    this.content.pad[1] = 4;
    this.content.rcorner = 0.0;
    this.content.draw_background = true;
    this.content.bgcolor = uicolors["TabPanelBG"];
    this.subframe.add(this.tabstrip);
    if (flip) {
        this.tabstrip.packflag|=PackFlags.FLIP_TABSTRIP;
        this.subframe.prepend(this.content);
    }
    else {
      this.subframe.add(this.content);
    }
    this.add(this.subframe);
  }, function on_saved_uidata(visit) {
    UIFrame.prototype.on_saved_uidata.call(this, visit);
    var __iter_t=__get_iter(this.tabstrip.tabs);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      visit(t.id);
    }
  }, function on_load_uidata(visit) {
    UIFrame.prototype.on_load_uidata.call(this, visit);
    var __iter_t=__get_iter(this.tabstrip.tabs);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      visit(t.id);
    }
  }, function load_filedata(map) {
    if (map.active) {
        var ts=this.tabstrip.tabs;
        for (var i=0; i<ts.length; i++) {
            if (ts[i].text==map.active) {
                this.tabstrip.active = ts[i];
                this.tab_callback(ts[i].text, ts[i].id);
                this.do_recalc();
                break;
            }
        }
    }
  }, function get_filedata() {
    if (this.tabstrip.active!=undefined)
      return {active: this.tabstrip.active.text}
  }, function get_uhash() {
    var s=UIFrame.prototype.get_uhash.call(this);
    var __iter_t=__get_iter(this.tabstrip.tabs);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      s+=t.text;
    }
    return s;
  }, function build_draw(canvas, isVertical) {
    this.draw_background = true;
    this.bgcolor = uicolors["TabPanelBG"];
    UIFrame.prototype.build_draw.call(this, canvas, isVertical);
    var lineclr=uicolors["TabPanelOutline"];
    var t=this.tabstrip.thickness;
    var sx=this.flip ? this.tabstrip.pos[0] : this.size[0];
    var y=this.is_canvas_root() ? this.pos[1] : 0;
    if (!(this.packflag&PackFlags.FLIP_TABSTRIP)) {
        canvas.line([t, y], [sx, y], lineclr);
        canvas.line([t, y+this.size[1]-1], [sx, y+this.size[1]-1], lineclr);
    }
    else {
      canvas.line([0, y], [sx, y], lineclr);
      canvas.line([0, y+this.size[1]-1], [sx, y+this.size[1]-1], lineclr);
    }
  }, function tab_callback(text, id) {
    var content=this.content;
    var __iter_c=__get_iter(list(content.children));
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      content.remove(c);
      c.parent = content;
    }
    if (id!=undefined)
      content.add(id);
    content.do_full_recalc();
  }, function pack(canvas, isVertical) {
    this.subframe.size[0] = this.size[0];
    this.subframe.size[1] = this.size[1];
    UIFrame.prototype.pack.call(this, canvas, isVertical);
  }, function panel(label, align, default_packflag) {
    if (align==undefined) {
        align = 0;
    }
    if (default_packflag==undefined) {
        default_packflag = 0;
    }
    align|=this.default_packflag|PackFlags.ALIGN_LEFT;
    var ret=new RowFrame(this.ctx);
    ret.packflag|=align;
    ret.default_packflag = this.default_packflag|default_packflag;
    this.add_tab(label, ret);
    return ret;
  }, function panel_col(label, align, default_packflag) {
    if (align==undefined) {
        align = 0;
    }
    if (default_packflag==undefined) {
        default_packflag = 0;
    }
    align|=this.default_packflag|PackFlags.ALIGN_LEFT;
    var ret=new ColumnFrame(this.ctx, label);
    ret.packflag|=align;
    ret.default_packflag = this.default_packflag|default_packflag;
    this.add_tab(label, ret);
    return ret;
  }, function add_tab(text, frame, description) {
    if (this.tabstrip.tabs.length==0)
      this.content.add(frame);
    var uhash=frame.get_uhash;
    frame.get_uhash = function() {
      return uhash.call(frame)+text;
    }
    this.tabstrip.add_tab(text, description, frame);
    frame.parent = this.content;
    this.do_full_recalc();
  }, function get_min_size(canvas, isVertical) {
    return this.subframe.get_min_size(canvas, isVertical);
  }]);
  _es6_module.add_class(UITabPanel);
  UITabPanel = _es6_module.add_export('UITabPanel', UITabPanel);
}, '/home/ec2-user/fairmotion/src/ui/UITabPanel.js');
es6_module_define('utildefine', [], function _utildefine_module(_es6_module) {
  var $_mh;
  var $_swapt;
}, '/home/ec2-user/fairmotion/src/core/utildefine.js');
es6_module_define('dialog', ["toolops_api", "UIElement", "UIPack", "UIWidgets", "UIFrame", "UITextBox", "UICanvas", "UIWidgets_special"], function _dialog_module(_es6_module) {
  var DialogFlags={MODAL: 1, END_ON_ESCAPE: 2, DEFAULT: 2}
  DialogFlags = _es6_module.add_export('DialogFlags', DialogFlags);
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var UITextBox=es6_import_item(_es6_module, 'UITextBox', 'UITextBox');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UICollapseIcon=es6_import_item(_es6_module, 'UIWidgets_special', 'UICollapseIcon');
  var UIPanel=es6_import_item(_es6_module, 'UIWidgets_special', 'UIPanel');
  var UIProgressBar=es6_import_item(_es6_module, 'UIWidgets_special', 'UIProgressBar');
  var UIListBox=es6_import_item(_es6_module, 'UIWidgets_special', 'UIListBox');
  var UIListEntry=es6_import_item(_es6_module, 'UIWidgets_special', 'UIListEntry');
  var UICanvas=es6_import_item(_es6_module, 'UICanvas', 'UICanvas');
  var _TitleBar=_ESClass("_TitleBar", UIElement, [function _TitleBar(ctx) {
    UIElement.call(this, ctx);
    this.text = "";
    this.moving = false;
    this.start_mpos = [0, 0];
  }, function build_draw(canvas, isVertical) {
    canvas.simple_box([0, 0], this.size, uicolors["DialogTitle"]);
    var tsize=canvas.textsize(this.text);
    canvas.text([12, (this.size[1]-tsize[1])*0.5], this.text, uicolors["DialogText"], 12.0);
  }, function on_mousedown(event) {
    this.push_modal(this);
    this.moving = true;
    this.start_mpos = [event.x, event.y];
  }, function on_mousemove(event) {
    if (this.moving) {
        this.parent.pos[0]+=event.x-this.start_mpos[0];
        this.parent.pos[1]+=event.y-this.start_mpos[1];
        this.parent.do_full_recalc();
    }
  }, function on_mouseup(event) {
    this.pop_modal();
    this.moving = false;
  }]);
  _es6_module.add_class(_TitleBar);
  var Dialog=_ESClass("Dialog", UIFrame, [function Dialog(title, ctx, screen, flag) {
    UIFrame.call(this, ctx, screen.canvas);
    this.title = title;
    this.screen = screen;
    this.closed = false;
    this.headersize = 33;
    this.callback = undefined;
    if (flag==undefined)
      this.flag = DialogFlags.DEFAULT;
    else 
      this.flag = flag;
    this.subframe = new UIFrame(ctx, screen.canvas);
    this.titlebar = new _TitleBar(ctx);
    this.titlebar.canvas = this.canvas;
    this.add(this.titlebar);
    this.add(this.subframe);
  }, _ESClass.static(function cancel_button(ctx) {
    var e=new UIButton(ctx, "Cancel");
    e.callback = function() {
      var p=this.parent;
      while (p!=undefined&&!(__instance_of(p, Dialog))) {
        p = p.parent;
      }
      if (p==undefined) {
          console.trace("Yeek, couldn't find parent dialog in Dialog.cancel_button", this);
          return ;
      }
      p.end(true);
    }
    return e;
  }), _ESClass.static(function okay_button(ctx) {
    var e=new UIButton(ctx, "Okay");
    e.callback = function() {
      var p=this.parent;
      while (p!=undefined&&!(__instance_of(p, Dialog))) {
        p = p.parent;
      }
      if (p==undefined) {
          console.trace("Yeek, couldn't find parent dialog in Dialog.okay_button", this);
          return ;
      }
      p.end(false);
    }
    return e;
  }), function on_draw(gl) {
  }, function build_draw(canvas, isVertical) {
    canvas = this.canvas;
    if (this.state&UIFlags.IS_CANVAS_ROOT) {
        canvas.clear();
        this.do_full_recalc();
        canvas.push_transform();
        canvas.translate(this.pos);
    }
    canvas.push_scissor([0, 0], this.size);
    this.titlebar.pos = [0, this.size[1]-this.headersize];
    this.titlebar.size = [this.size[0], this.headersize];
    this.titlebar.text = this.title;
    canvas.shadow_box([5, -1], this.size);
    canvas.simple_box([0, 0], this.size, uicolors["DialogBox"]);
    UIFrame.prototype.build_draw.call(this, canvas, isVertical);
    canvas.box_outline([0, 0], this.size, uicolors["DialogBorder"]);
    canvas.pop_scissor();
    if (this.state&UIFlags.IS_CANVAS_ROOT) {
        canvas.pop_transform();
    }
  }, function on_keydown(event) {
    UIFrame.prototype.on_keydown.call(this, event);
    if (this.flag&DialogFlags.END_ON_ESCAPE) {
        if (event.keyCode==charmap["Escape"])
          this.end(true);
    }
  }, function call(pos, center) {
    if (pos==undefined) {
        pos = undefined;
    }
    if (center==undefined) {
        center = false;
    }
    this.canvas = g_app_state.screen.canvas;
    function visit(c, canvas) {
      c.canvas = canvas;
      if (__instance_of(c, UIFrame)) {
          var __iter_c2=__get_iter(c.children);
          var c2;
          while (1) {
            var __ival_c2=__iter_c2.next();
            if (__ival_c2.done) {
                break;
            }
            c2 = __ival_c2.value;
            visit(c2, canvas);
          }
      }
    }
    visit(this, this.canvas);
    this.pack(this.screen.canvas, false);
    if (pos==undefined) {
        var screen=g_app_state.screen;
        if (center) {
            pos = [screen.size[0]*0.5, screen.size[1]*0.5];
        }
        else {
          pos = [screen.mpos[0], screen.mpos[1]];
          pos[1]-=this.size[1]+20;
        }
    }
    pos[0] = Math.min(pos[0]+this.size[0], this.screen.size[0])-this.size[0];
    pos[1] = Math.min(pos[1]+this.size[1], this.screen.size[1])-this.size[1];
    pos[0] = Math.max(pos[0], 0);
    pos[1] = Math.max(pos[1], 0);
    this.pos[0] = pos[0];
    this.pos[1] = pos[1];
    this.screen.add(this);
    if ((this.flag&DialogFlags.MODAL)||this.screen.modalhandler) {
        this.screen.push_modal(this);
    }
    this.titlebar.pos = [0, this.size[1]-this.headersize];
    this.titlebar.size = [this.size[0], this.headersize];
    this.subframe.pos = [0, 0];
    this.subframe.size = [this.size[0], this.size[1]-this.headersize];
    this.titlebar.do_recalc();
    this.subframe.do_recalc();
    this.do_recalc();
  }, function end(do_cancel) {
    if (this.screen==undefined) {
        this.screen = g_app_state.screen;
    }
    this.closed = true;
    if (this.flag&DialogFlags.MODAL) {
        this.screen.pop_modal();
    }
    if (this.screen.children.has(this)) {
        this.screen.remove(this);
    }
  }]);
  _es6_module.add_class(Dialog);
  Dialog = _es6_module.add_export('Dialog', Dialog);
  window.Dialog = Dialog;
  var PackedDialog=_ESClass("PackedDialog", Dialog, [function PackedDialog(title, ctx, screen, flag) {
    Dialog.call(this, title, ctx, screen, flag);
    this.remove(this.subframe);
    this.subframe = new RowFrame(ctx, undefined, PackFlags.ALIGN_BOTTOM|PackFlags.ALIGN_CENTER);
    this.add(this.subframe, PackFlags.INHERIT_WIDTH);
  }, function call(pos) {
    this.size = this.subframe.get_min_size(this.canvas);
    this.size[1]+=this.headersize;
    this.size[0]+=15;
    Dialog.prototype.call.call(this, pos);
    this.subframe.pack(this.canvas);
  }]);
  _es6_module.add_class(PackedDialog);
  PackedDialog = _es6_module.add_export('PackedDialog', PackedDialog);
  var OkayDialog=_ESClass("OkayDialog", PackedDialog, [function OkayDialog(text, callback) {
    var ctx=new Context();
    var screen=g_app_state.screen;
    var flag=0;
    PackedDialog.call(this, "Okay?", ctx, screen, flag);
    this.callback = callback;
    var col=this.subframe.col();
    col.add(Dialog.okay_button(ctx));
    col.add(Dialog.cancel_button(ctx));
    var l=this.subframe.label(text);
    l.color = uicolors["DialogText"];
  }, function end(do_cancel) {
    PackedDialog.prototype.end.call(this, do_cancel);
    this.callback(this, do_cancel);
  }]);
  _es6_module.add_class(OkayDialog);
  OkayDialog = _es6_module.add_export('OkayDialog', OkayDialog);
  var ErrorDialog=_ESClass("ErrorDialog", PackedDialog, [function ErrorDialog(text, callback) {
    var ctx=new Context();
    var screen=g_app_state.screen;
    var flag=0;
    PackedDialog.call(this, "Error: ", ctx, screen, flag);
    this.callback = callback;
    var col=this.subframe;
    col.add(Dialog.okay_button(ctx), PackFlags.ALIGN_RIGHT);
    var c=col.label("  "+text+"    ");
    c.color = uicolors["DialogText"];
    c.set_color(uicolors["ErrorText"]);
    c.set_background(uicolors["ErrorTextBG"]);
  }, function end(do_cancel) {
    PackedDialog.prototype.end.call(this, do_cancel);
    if (this.callback!=undefined)
      this.callback(this, do_cancel);
  }]);
  _es6_module.add_class(ErrorDialog);
  ErrorDialog = _es6_module.add_export('ErrorDialog', ErrorDialog);
  window.Dialog = Dialog;
}, '/home/ec2-user/fairmotion/src/ui/dialog.js');
es6_module_define('dialogs', ["toolprops", "ajax", "UIElement", "UIFrame", "UIWidgets", "toolops_api", "UIPack", "svg_export", "dialog", "spline_createops", "fileapi", "UITextBox", "config", "UIWidgets_special", "strutils"], function _dialogs_module(_es6_module) {
  var Dialog=es6_import_item(_es6_module, 'dialog', 'Dialog');
  var PackedDialog=es6_import_item(_es6_module, 'dialog', 'PackedDialog');
  var DialogFlags=es6_import_item(_es6_module, 'dialog', 'DialogFlags');
  var OkayDialog=es6_import_item(_es6_module, 'dialog', 'OkayDialog');
  var ErrorDialog=es6_import_item(_es6_module, 'dialog', 'ErrorDialog');
  var config=es6_import(_es6_module, 'config');
  var urlencode=es6_import_item(_es6_module, 'strutils', 'urlencode');
  var b64decode=es6_import_item(_es6_module, 'strutils', 'b64decode');
  var b64encode=es6_import_item(_es6_module, 'strutils', 'b64encode');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var export_svg=es6_import_item(_es6_module, 'svg_export', 'export_svg');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var UITextBox=es6_import_item(_es6_module, 'UITextBox', 'UITextBox');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UICollapseIcon=es6_import_item(_es6_module, 'UIWidgets_special', 'UICollapseIcon');
  var UIPanel=es6_import_item(_es6_module, 'UIWidgets_special', 'UIPanel');
  var UIColorField=es6_import_item(_es6_module, 'UIWidgets_special', 'UIColorField');
  var UIColorBox=es6_import_item(_es6_module, 'UIWidgets_special', 'UIColorBox');
  var UIColorPicker=es6_import_item(_es6_module, 'UIWidgets_special', 'UIColorPicker');
  var UIProgressBar=es6_import_item(_es6_module, 'UIWidgets_special', 'UIProgressBar');
  var UIListBox=es6_import_item(_es6_module, 'UIWidgets_special', 'UIListBox');
  var UIListEntry=es6_import_item(_es6_module, 'UIWidgets_special', 'UIListEntry');
  var get_root_folderid=es6_import_item(_es6_module, 'fileapi', 'get_root_folderid');
  var get_current_dir=es6_import_item(_es6_module, 'fileapi', 'get_current_dir');
  var path_to_id=es6_import_item(_es6_module, 'fileapi', 'path_to_id');
  var ajax=es6_import(_es6_module, 'ajax');
  var FileDialogModes={OPEN: "Open", SAVE: "Save"}
  FileDialogModes = _es6_module.add_export('FileDialogModes', FileDialogModes);
  var fdialog_exclude_chars=new set(["*", "\\", ";", ":", "&", "^"]);
  var FileDialog=_ESClass("FileDialog", PackedDialog, [function FileDialog(mode, ctx, callback, check_overwrite, pattern) {
    if (check_overwrite==undefined) {
        check_overwrite = false;
    }
    if (pattern==undefined) {
        pattern = undefined;
    }
    PackedDialog.call(this, FileDialogModes[mode], ctx, ctx.screen);
    if (pattern==undefined) {
        pattern = new RegExp(/.+\.fmo/);
    }
    this.pattern = pattern;
    this.check_overwrite = check_overwrite;
    this.subframe.default_packflag|=PackFlags.INHERIT_WIDTH;
    this.parent_stack = [];
    this.pos = [0, 0];
    this.files = [];
    this.flag = DialogFlags.MODAL;
    this.callback = callback;
    var cwd=get_current_dir();
    if (cwd!=undefined) {
        this.rebuild_parent_stack(cwd);
        window._pstack = this.parent_stack;
        var this2=this;
        path_to_id(cwd).then(function(job) {
          console.log("==>", arguments, job.value);
          this2.dirpath = cwd;
          this2.folderid = job.value;
          this2.populate();
        });
    }
    else {
      this.folderid = get_root_folderid();
      this.dirpath = "/";
      if (this.folderid==undefined) {
          var this2=this;
          var start_time=time_ms();
          g_app_state.session.validate_session();
          var timer=window.setInterval(function() {
            var root_id=get_root_folderid();
            console.log("waiting for root folder id. . .");
            if (root_id!=undefined&&this2.folderid==undefined) {
                this2.folderid = root_id;
            }
            if (this2.closed||root_id!=undefined||time_ms()-start_time>90000) {
                console.log("clearing file dialog interval");
                window.clearInterval(timer);
            }
          }, 500);
      }
    }
    var col=this.subframe.col();
    col.default_packflag&=~PackFlags.INHERIT_WIDTH;
    col.add(Dialog.okay_button(ctx));
    col.add(Dialog.cancel_button(ctx));
    this.textbox = new UITextBox(ctx, "", [0, 0], [0, 0]);
    this.subframe.add(this.textbox, PackFlags.INHERIT_WIDTH);
    this.listbox = new UIListBox(ctx, [0, 0], [400, 300]);
    var this2=this;
    this.listbox._on_doubleclick = function(e) {
      this.prototype._on_doubleclick.apply(this, arguments);
      console.log("this.listbox.on_doubleclick called");
      if (e.button!=0||this.active_entry==undefined)
        return ;
      var text=this.active_entry.text, id=this.active_entry.id;
      this2.entry_double_clicked(text, id);
    }
    this.listbox.callback = function(listbox, text, id) {
      console.trace("this.listbox.callback called");
      this2.entry_clicked(text, id);
    }
    this.listbox.go_callback = function(listbox, text, id) {
      this2.end(false);
    }
    this.subframe.add(this.listbox, PackFlags.INHERIT_WIDTH);
    var col=this.subframe.col();
    var newf=new UIButton(ctx, "New Folder");
    col.add(newf);
    var this2=this;
    newf.callback = function() {
      var entry=this2.listbox.add_item("New Folder", {is_dir: true, is_temp: true});
      this2.listbox._set_active(entry, true);
      this2.listbox.jump(-1, true);
      entry.begin_text_edit();
      entry.textbox.select_all();
      entry.icon = Icons.FOLDER;
      entry.on_end_edit = function(textbox, cancel) {
        if (textbox.text.trim()=="")
          return ;
        var name=textbox.text.trim();
        entry.text = name;
        entry.do_recalc();
        entry.id.name = name;
        call_api(create_folder, {folderid: this2.folderid, name: name}, function finish() {
          console.log("finish!", arguments);
          this2.populate();
        }, function error() {
          if (entry.parent.children.indexOf(entry)>=0) {
              entry.parent.do_recalc();
              entry.parent.remove(entry);
              error_dialog(ctx, "Network Error", undefined, true);
          }
          console.log("error!", arguments);
        });
      }
    }
    if (this.folderid!=undefined) {
        this.populate();
    }
  }, function rebuild_parent_stack(cwd) {
    cwd = cwd==undefined ? this.dirpath : cwd;
    this.parent_stack = [];
    var path="";
    var dirs=cwd.trim().replace(/\/+/g, "/").split("/");
    if (dirs[dirs.length-1].trim()=="") {
        dirs = dirs.slice(0, dirs.length-1);
    }
    console.log("dirs: ", dirs);
    for (var i=0; i<dirs.length-1; i++) {
        path+=dirs[i];
        path+="/";
        this.parent_stack.push(path);
    }
  }, function populate() {
    var this2=this;
    function finish(job, owner, msg) {
      this2.listbox.reset();
      if (this2.folderid!=get_root_folderid())
        this2.listbox.add_item("..", {is_dir: true});
      var files=job.value.items;
      this2.files = files;
      if (files==undefined)
        return ;
      files.sort(function(a, b) {
        if (!!a.is_dir==!!b.is_dir)
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        else 
          if (a.is_dir)
          return 1;
        else 
          return -1;
      });
      if (DEBUG.netio)
        console.log(files);
      for (var i=0; i<files.length; i++) {
          var fname=files[i].name;
          var ftype;
          if (files[i].is_dir) {
              ftype = "folder";
              fname = fname;
          }
          else {
            ftype = "file";
            if (!fname.match(this2.pattern))
              continue;
          }
          var entry=this2.listbox.add_item(fname, files[i]);
          entry.icon = ftype=="file" ? Icons.FILE : Icons.FOLDER;
      }
      this2.do_full_recalc();
    }
    var was_closed=false;
    function error(job, owner, msg) {
      if (!was_closed) {
          error_dialog(this2.ctx, "Network Error", function() {
            this2.end(true);
          }, true);
      }
      was_closed = true;
    }
    var args;
    if (this.folderid==undefined) {
        args = {path: this.dirpath};
    }
    else {
      args = {id: this.folderid};
    }
    call_api(get_dir_files, args, finish, error);
  }, function entry_double_clicked(text, id) {
    if (id.is_temp)
      return ;
    this.entry_clicked(text, id);
    if (!id.is_dir) {
        this.end(false);
    }
    else 
      if (text=="..") {
        var path=this.parent_stack.pop();
        if (path==undefined) {
            console.log("WARNING: tried to go to parent of root directory");
            return ;
        }
        var this2=this;
        path_to_id(path).then(function(job) {
          console.log("Navigated to parent", path);
          console.log("==>", arguments, job.value);
          this2.dirpath = path;
          this2.folderid = job.value;
          this2.listbox.reset();
          this2.populate();
        });
    }
    else {
      this.parent_stack.push(this.dirpath);
      this.folderid = id.id;
      this.dirpath+=id.name+"/";
      this.populate();
    }
  }, function entry_clicked(text, id) {
    if (id.is_temp)
      return ;
    if (!id.is_dir) {
        this.textbox.set_text(text);
    }
  }, function end(do_cancel, overwrite_check) {
    if (overwrite_check==undefined) {
        overwrite_check = false;
    }
    console.trace("end called");
    if (!do_cancel&&this.textbox.text.trim()=="") {
        console.log("no char in path");
        return ;
    }
    var this2=this;
    function check_overwrite_cb(dialog, cancel) {
      if (!cancel)
        this2.end(false, true);
    }
    for (var i=0; !do_cancel&&i<this.files.length; i++) {
        if (this.files[i].is_dir&&this.files[i].name.trim()==this.textbox.text.trim()) {
            console.log("Can't overwrite folders!");
            error_dialog(this.ctx, "Can't overwrite folders");
            return ;
        }
    }
    if (!do_cancel&&!overwrite_check&&this.check_overwrite) {
        var found=false;
        for (var i=0; i<this.files.length; i++) {
            if (this.files[i].name.trim()==this.textbox.text.trim()) {
                found = true;
                break;
            }
        }
        if (found&&!overwrite_check) {
            var d=new OkayDialog("Overwrite file?", check_overwrite_cb);
            d.call(g_app_state.screen.mpos);
            return ;
        }
    }
    var text=this.dirpath+this.textbox.text.trim();
    var eset=fdialog_exclude_chars;
    for (var i=0; i<text.length; i++) {
        if (eset.has(text[i])) {
            console.log("bad char in path");
            return ;
        }
    }
    PackedDialog.prototype.end.call(this, do_cancel);
    if (this.callback!=undefined&&!do_cancel) {
        this.callback(this, text);
    }
  }]);
  _es6_module.add_class(FileDialog);
  FileDialog = _es6_module.add_export('FileDialog', FileDialog);
  function file_dialog(mode, ctx, callback, check_overwrite, pattern) {
    var fd=new FileDialog(mode, ctx, callback, check_overwrite, pattern);
    fd.call(ctx.screen.mpos);
  }
  file_dialog = _es6_module.add_export('file_dialog', file_dialog);
  function download_file(path, on_finish, path_label, use_note, suppress_errors, on_error) {
    if (path_label==undefined) {
        path_label = path;
    }
    if (use_note==undefined) {
        use_note = false;
    }
    if (suppress_errors==undefined) {
        suppress_errors = false;
    }
    if (on_error==undefined) {
        on_error = undefined;
    }
    var ctx=new Context();
    var pd;
    if (use_note)
      pd = g_app_state.notes.progbar("Get "+path_label, 0);
    else 
      pd = new ProgressDialog(ctx, "Downloading "+path_label);
    if (on_error==undefined)
      on_error = function() {
    }
    var did_error=false;
    function error(job, owner, msg) {
      if (!did_error) {
          did_error = true;
          pd.end();
          on_error(job, owner, msg);
          if (!suppress_errors)
            g_app_state.notes.label("Network Error");
      }
    }
    function status(job, owner, status) {
      pd.value = status.progress;
      if (DEBUG.netio)
        console.log("status: ", status.progress);
    }
    function finish(job, owner) {
      pd.end();
      on_finish(new DataView(job.value));
      if (DEBUG.netio)
        console.log("finished downloading");
    }
    var s=g_app_state.screen.size;
    if (!use_note)
      pd.call([s[0]*0.5, s[1]*0.5]);
    call_api(get_file_data, {path: path}, finish, error, status);
  }
  download_file = _es6_module.add_export('download_file', download_file);
  var open_file=es6_import_item(_es6_module, 'fileapi', 'open_file');
  var save_file=es6_import_item(_es6_module, 'fileapi', 'save_file');
  var save_with_dialog=es6_import_item(_es6_module, 'fileapi', 'save_with_dialog');
  var can_access_path=es6_import_item(_es6_module, 'fileapi', 'can_access_path');
  var FileOpenRecentOp=_ESClass("FileOpenRecentOp", ToolOp, [_ESClass.static(function tooldef() {
    return {apiname: "open_recent", uiname: "Open Recent", inputs: {}, outputs: {}, icon: -1, is_modal: false, undoflag: UndoFlags.IGNORE_UNDO}
  }), function FileOpenRecentOp() {
    ToolOp.call(this);
    this.path = undefined;
  }, function exec(ctx) {
    var dialog=new PackedDialog("Open recent...", ctx, g_app_state.screen);
    var row=dialog.subframe;
    var listbox=new UIListBox();
    row.add(listbox);
    var paths=g_app_state.session.settings.recent_paths;
    for (var i=paths.length-1; i>=0; i--) {
        listbox.add_item(paths[i].displayname, paths[i].path);
    }
    listbox.go_callback = function(text, id) {
      console.log("go calllback!", id);
      var loadop=new FileOpenOp();
      loadop.inputs.path.set_data(id);
      dialog.end();
      g_app_state.toolstack.exec_tool(loadop);
    }
    dialog.call(g_app_state.screen.mpos);
  }]);
  _es6_module.add_class(FileOpenRecentOp);
  FileOpenRecentOp = _es6_module.add_export('FileOpenRecentOp', FileOpenRecentOp);
  var FileOpenOp=_ESClass("FileOpenOp", ToolOp, [function FileOpenOp() {
    ToolOp.call(this, "open_file", "Open");
    this.is_modal = false;
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    this.inputs = {path: new StringProperty("", "path", "File Path", "File Path")}
  }, function exec(ctx) {
    console.log("File open");
    open_file(function(buf, fname, filepath) {
      console.log("\n\ngot file!", buf, fname, filepath, "\n\n");
      g_app_state.load_user_file_new(new DataView(buf), filepath);
      if (filepath!=undefined) {
          g_app_state.session.settings.add_recent_file(filepath);
          g_app_state.session.settings.server_update(true);
      }
    }, this, true, "Fairmotion Files", ["fmo"]);
    return ;
  }]);
  _es6_module.add_class(FileOpenOp);
  FileOpenOp = _es6_module.add_export('FileOpenOp', FileOpenOp);
  var FileSaveAsOp=_ESClass("FileSaveAsOp", ToolOp, [function FileSaveAsOp() {
    ToolOp.call(this, "save_file_as", "Save As");
    this.is_modal = false;
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    this.inputs = {path: new StringProperty("", "path", "File Path", "File Path")}
  }, function exec(ctx) {
    console.log("File save");
    ctx = new Context();
    var pd=new ProgressDialog(ctx, "Uploading");
    var thepath=undefined;
    var mesh_data=g_app_state.create_user_file_new().buffer;
    if (config.USE_HTML5_FILEAPI) {
        save_with_dialog(mesh_data, g_app_state.filepath, "Fairmotion Files", ["fmo"], function() {
          error_dialog(ctx, "Could not write file", undefined, true);
        }, (path) =>          {
          g_app_state.filepath = path;
          g_app_state.notes.label("File saved");
        });
        return ;
    }
    function error(job, owner, msg) {
      pd.end();
      error_dialog(ctx, "Network Error", undefined, true);
    }
    function finish(job, owner) {
      if (DEBUG.netio)
        console.log("finished uploading");
      pd.end();
      G.filepath = thepath;
    }
    function status(job, owner, status) {
      pd.value = status.progress;
      if (DEBUG.netio)
        console.log("status: ", status.progress, status);
    }
    function save_callback(dialog, path) {
      pd.call(ctx.screen.mpos);
      g_app_state.session.settings.add_recent_file(path);
      g_app_state.session.settings.server_update(true);
      g_app_state.filepath = path;
      if (DEBUG.netio)
        console.log("saving...", path);
      
      if (!path.endsWith(fairmotion_file_ext)) {
          path = path+fairmotion_file_ext;
      }
      thepath = path;
      var token=g_app_state.session.tokens.access;
      var url="/api/files/upload/start?accessToken="+token+"&path="+path;
      var url2="/api/files/upload?accessToken="+token;
      call_api(upload_file, {data: mesh_data, url: url, chunk_url: url2}, finish, error, status);
    }
    file_dialog("SAVE", new Context(), save_callback, true);
  }]);
  _es6_module.add_class(FileSaveAsOp);
  FileSaveAsOp = _es6_module.add_export('FileSaveAsOp', FileSaveAsOp);
  var FileNewOp=_ESClass("FileNewOp", ToolOp, [function FileNewOp() {
    ToolOp.call(this, "new_file", "New");
    this.is_modal = false;
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    this.inputs = {}
  }, function exec(ctx) {
    function new_callback(dialog, do_cancel) {
      if (!do_cancel) {
          gen_default_file(g_app_state.screen.size);
      }
    }
    var okay=new OkayDialog("Create blank scene?\nAny unsaved changes\nwill be lost", new_callback);
    okay.call();
    console.log("File new");
  }]);
  _es6_module.add_class(FileNewOp);
  FileNewOp = _es6_module.add_export('FileNewOp', FileNewOp);
  var FileSaveOp=_ESClass("FileSaveOp", ToolOp, [function FileSaveOp(do_progress) {
    if (do_progress==undefined) {
        do_progress = true;
    }
    ToolOp.call(this, "save_file", "Save");
    this.do_progress = true;
    this.is_modal = false;
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    this.inputs = {}
  }, function exec(ctx) {
    console.log("File save");
    var mesh_data=g_app_state.create_user_file_new().buffer;
    let path=g_app_state.filepath;
    let ok=path!=""&&path!==undefined;
    ok = ok&&can_access_path(path);
    if (!ok) {
        save_with_dialog(mesh_data, undefined, "Fairmotion Files", ["fmo"], function() {
          error_dialog(ctx, "Could not write file", undefined, true);
        }, (path) =>          {
          g_app_state.filepath = path;
          g_app_state.notes.label("File saved");
        });
    }
    else {
      save_file(mesh_data, path, () => error_dialog(ctx, "Could not write file", undefined, true), () => g_app_state.notes.label("File saved"));
    }
  }]);
  _es6_module.add_class(FileSaveOp);
  FileSaveOp = _es6_module.add_export('FileSaveOp', FileSaveOp);
  var test_pd=undefined;
  function test_progress_dialog() {
    
    var ctx=new Context();
    var pd=new ProgressDialog(ctx, "test", 0.2);
    pd.call(ctx.screen.mpos);
    test_pd = pd;
  }
  var ProgressDialog=_ESClass("ProgressDialog", PackedDialog, [function ProgressDialog(ctx, label, val, min, max) {
    if (val==undefined) {
        val = 0.0;
    }
    if (min==undefined) {
        min = 0.0;
    }
    if (max==undefined) {
        max = 1.0;
    }
    PackedDialog.call(this, label, ctx, ctx.screen);
    this.pos = [0, 0];
    this.closed = false;
    this.flag = DialogFlags.MODAL;
    var col=this.subframe.col();
    this.bar = new UIProgressBar(ctx, val, min, max);
    col.add(this.bar);
    this._full_ms = 0;
    this._do_end = false;
    this._end_flash = 150;
  }, function on_tick() {
    if (this._do_end&&time_ms()-this._full_ms>this._end_flash) {
        PackedDialog.prototype.end.call(this, false);
    }
  }, function end(do_cancel) {
    if (this.bar.value>=this.bar.max) {
        this._full_ms = time_ms();
        this._do_end = true;
        this.bar.value = this.bar.max;
        this.bar.do_recalc();
    }
    else {
      PackedDialog.prototype.end.call(this, false);
    }
  }, _ESClass.set(function value(val) {
    if (val!=this.bar.value)
      this.do_recalc();
    this.bar.set_value(val);
  }), _ESClass.get(function value() {
    return this.bar.value;
  })]);
  _es6_module.add_class(ProgressDialog);
  ProgressDialog = _es6_module.add_export('ProgressDialog', ProgressDialog);
  var LoginDialog=_ESClass("LoginDialog", PackedDialog, [function LoginDialog(ctx) {
    PackedDialog.call(this, "User Login", ctx, ctx.screen);
    this.pos = [0, 0];
    this.closed = false;
    this.flag = DialogFlags.MODAL;
    var col=this.subframe.col();
    col.add(Dialog.okay_button(ctx));
    col.add(Dialog.cancel_button(ctx));
    var session=g_app_state.session;
    this.userbox = new UITextBox(ctx, session.username, [0, 0], [0, 0]);
    this.passbox = new UITextBox(ctx, session.password, [0, 0], [0, 0]);
    this.errlabel = undefined;
    var col=this.subframe.col(undefined, PackFlags.INHERIT_WIDTH);
    var row=col.row();
    row.label("User:").color = uicolors["DialogText"];
    row.label("Password:").color = uicolors["DialogText"];
    row = col.row();
    row.add(this.userbox, PackFlags.INHERIT_WIDTH);
    row.add(this.passbox, PackFlags.INHERIT_WIDTH);
  }, function end(do_cancel) {
    var dialog=this;
    var session=g_app_state.session;
    if (DEBUG.netio)
      console.log(session.tokens);
    if (do_cancel) {
        PackedDialog.prototype.end.call(this, do_cancel);
        return ;
    }
    function finish(job, owner) {
      if (dialog.closed)
        return ;
      var session=g_app_state.session;
      if (DEBUG.netio)
        console.log(job.value, "1");
      session.tokens = job.value;
      session.is_logged_in = true;
      session.store();
      if (DEBUG.netio)
        console.log(job.value, "2");
      dialog.closed = true;
      PackedDialog.prototype.end.call(this, false);
      g_app_state.session.validate_session();
    }
    function error(job, owner, msg) {
      if (dialog.errlabel==undefined) {
          dialog.errlabel = dialog.subframe.label("", undefined, PackFlags.INHERIT_WIDTH);
          dialog.errlabel.color = uicolors["DialogText"];
      }
      dialog.errlabel.set_text("Error");
      console.log(msg);
    }
    var user=this.userbox.text;
    var password=this.passbox.text;
    if (DEBUG.netio)
      console.log(user, password);
    var session=g_app_state.session;
    session.username = user;
    session.password = password;
    session.store();
    auth_session(user, password, finish, error);
  }]);
  _es6_module.add_class(LoginDialog);
  LoginDialog = _es6_module.add_export('LoginDialog', LoginDialog);
  function error_dialog(ctx, msg, callback, center) {
    if (callback==undefined) {
        callback = undefined;
    }
    if (center==undefined) {
        center = false;
    }
    var pd=new ErrorDialog(msg, callback);
    var s=ctx.screen.size;
    var mpos=center ? [Math.floor(s[0]/2.0), Math.floor(s[1]/2.0)] : ctx.screen.mpos;
    pd.call(mpos);
    return pd;
  }
  error_dialog = _es6_module.add_export('error_dialog', error_dialog);
  function login_dialog(ctx) {
    var ld=new LoginDialog(ctx);
    ld.call(new Vector2(ctx.screen.size).mulScalar(0.5).floor());
  }
  login_dialog = _es6_module.add_export('login_dialog', login_dialog);
  var FileSaveSVGOp=_ESClass("FileSaveSVGOp", ToolOp, [function FileSaveSVGOp() {
    ToolOp.call(this, "export_svg", "Export SVG");
    this.is_modal = false;
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    this.inputs = {path: new StringProperty("", "path", "File Path", "File Path")}
  }, function exec(ctx) {
    console.log("Export SVG");
    ctx = new Context();
    var buf=export_svg(ctx.spline);
    if (g_app_state.filepath!="") {
        var name=g_app_state.filepath;
        if (name===undefined||name=="") {
            name = "untitled";
        }
        if (name.endsWith(".fmo"))
          name = name.slice(0, name.length-4);
    }
    else {
      name = "document";
    }
    var blob=new Blob([buf], {type: "text/svg+xml"});
    if (config.CHROME_APP_MODE) {
        save_with_dialog(buf, undefined, "SVG", ["svg"], function() {
          error_dialog(ctx, "Could not write file", undefined, true);
        });
    }
    else {
      var a=document.createElement("a");
      a.download = name+".svg";
      a.href = URL.createObjectURL(blob);
      a.click();
    }
  }]);
  _es6_module.add_class(FileSaveSVGOp);
  FileSaveSVGOp = _es6_module.add_export('FileSaveSVGOp', FileSaveSVGOp);
  var FileSaveB64Op=_ESClass("FileSaveB64Op", ToolOp, [function FileSaveB64Op() {
    ToolOp.call(this, "export_al3_b64", "Export AL3-B64");
    this.is_modal = false;
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    this.inputs = {path: new StringProperty("", "path", "File Path", "File Path")}
  }, function exec(ctx) {
    console.log("Export AL3-B64");
    var buf=g_app_state.create_user_file_new({compress: true});
    buf = b64encode(new Uint8Array(buf.buffer));
    var buf2="";
    for (var i=0; i<buf.length; i++) {
        buf2+=buf[i];
        if (((i+1)%79)==0) {
            buf2+="\n";
        }
    }
    buf = buf2;
    var byte_data=[];
    ajax.pack_static_string(byte_data, buf, buf.length);
    byte_data = new Uint8Array(byte_data).buffer;
    ctx = new Context();
    var pd=new ProgressDialog(ctx, "Uploading");
    function error(job, owner, msg) {
      pd.end();
      error_dialog(ctx, "Network Error", undefined, true);
    }
    function status(job, owner, status) {
      pd.value = status.progress;
      pd.bar.do_recalc();
      if (DEBUG.netio)
        console.log("status: ", status.progress);
    }
    var this2=this;
    function finish(job, owner) {
      if (DEBUG.netio)
        console.log("finished uploading");
      var url="/api/files/get?path=/"+this2._path+"&";
      url+="accessToken="+g_app_state.session.tokens.access;
      if (DEBUG.netio)
        console.log(url);
      window.open(url);
      pd.end();
    }
    function save_callback(dialog, path) {
      pd.call(ctx.screen.mpos);
      if (DEBUG.netio)
        console.log("saving...", path);
      if (!path.endsWith(".al3.b64")) {
          path = path+".al3.b64";
      }
      this2._path = path;
      var token=g_app_state.session.tokens.access;
      var url="/api/files/upload/start?accessToken="+token+"&path="+path;
      var url2="/api/files/upload?accessToken="+token;
      call_api(upload_file, {data: byte_data, url: url, chunk_url: url2}, finish, error, status);
    }
    file_dialog("SAVE", new Context(), save_callback, true);
  }]);
  _es6_module.add_class(FileSaveB64Op);
  FileSaveB64Op = _es6_module.add_export('FileSaveB64Op', FileSaveB64Op);
  var ImportJSONOp=es6_import_item(_es6_module, 'spline_createops', 'ImportJSONOp');
  var _dom_input_node=undefined;
  var import_json=window.import_json = function import_json() {
    
    console.log("import json!");
    if (_dom_input_node==undefined) {
        window._dom_input_node = _dom_input_node = document.getElementById("fileinput");
    }
    _dom_input_node.style.visibility = "visible";
    var node=_dom_input_node;
    node.value = "";
    node.onchange = function() {
      console.log("file select!", node.files);
      if (node.files.length==0)
        return ;
      var f=node.files[0];
      console.log("file", f);
      var reader=new FileReader();
      reader.onload = function(data) {
        var obj=JSON.parse(reader.result);
        var tool=new ImportJSONOp(reader.result);
        g_app_state.toolstack.exec_tool(tool);
      }
      reader.readAsText(f);
    }
  }
  import_json = _es6_module.add_export('import_json', import_json);
}, '/home/ec2-user/fairmotion/src/ui/dialogs.js');
es6_module_define('FrameManager', ["struct", "UICanvas", "UIFrame", "mathlib", "config", "ScreenArea", "ScreenBorder", "UIElement", "../editors/viewport/events", "FrameManager_ops", "toolops_api", "dialogs", "UIPack"], function _FrameManager_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  var login_dialog=es6_import_item(_es6_module, 'dialogs', 'login_dialog');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var get_rect_lines=es6_import_item(_es6_module, 'mathlib', 'get_rect_lines');
  var get_rect_points=es6_import_item(_es6_module, 'mathlib', 'get_rect_points');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var closest_point_on_line=es6_import_item(_es6_module, 'mathlib', 'closest_point_on_line');
  var dist_to_line_v2=es6_import_item(_es6_module, 'mathlib', 'dist_to_line_v2');
  var aabb_isect_minmax2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_minmax2d');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var KeyMap=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, '../editors/viewport/events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../editors/viewport/events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'EventHandler');
  var UICanvas=es6_import_item(_es6_module, 'UICanvas', 'UICanvas');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var UIHoverHint=es6_import_item(_es6_module, 'UIElement', 'UIHoverHint');
  var UIHoverBox=es6_import_item(_es6_module, 'UIElement', 'UIHoverBox');
  var ScreenArea=es6_import_item(_es6_module, 'ScreenArea', 'ScreenArea');
  var Area=es6_import_item(_es6_module, 'ScreenArea', 'Area');
  var SplitAreasTool=es6_import_item(_es6_module, 'FrameManager_ops', 'SplitAreasTool');
  var CollapseAreasTool=es6_import_item(_es6_module, 'FrameManager_ops', 'CollapseAreasTool');
  var HintPickerOp=es6_import_item(_es6_module, 'FrameManager_ops', 'HintPickerOp');
  var ScreenBorder=es6_import_item(_es6_module, 'ScreenBorder', 'ScreenBorder');
  var BORDER_WIDTH=es6_import_item(_es6_module, 'ScreenBorder', 'BORDER_WIDTH');
  var Screen=_ESClass("Screen", UIFrame, [function Screen(unused, width, height) {
    UIFrame.call(this);
    this.size = [width, height];
    this.pos = [0, 0];
    this.use_old_size = false;
    this.draw_active = undefined;
    this.touchstate = {}
    this.touch_ms = {}
    this.tottouch = 0;
    this.session_timer = new Timer(60000);
    this.modup_time_ms = new GArray();
    var this2=this;
    this.event_tick_ival = window.setInterval(function() {
      this2.event_tick();
      if (this2!==g_app_state.screen) {
          window.clearInterval(this2.event_tick_ival);
          this2.event_tick_ival = undefined;
      }
    }, 30);
    this.rows = new GArray();
    this.cols = new GArray();
    this.last_tick = time_ms();
    this.child_borders = new hashtable();
    this.shift = false;
    this.alt = false;
    this.ctrl = false;
    this.keymap = new KeyMap();
    this.last_sync = time_ms();
    this.areas = new GArray();
    var this2=this;
    function handle_split_areas() {
      this2.split_areas();
    }
    var k=this.keymap;
    k.add_tool(new KeyHandler("O", ["CTRL"], "Open File"), "appstate.open()");
    k.add_tool(new KeyHandler("O", ["CTRL", "SHIFT"], "Open Recent"), "appstate.open_recent()");
    k.add_tool(new KeyHandler("S", ["CTRL", "ALT"], "Save File"), "appstate.save_as()");
    k.add_tool(new KeyHandler("S", ["CTRL"], "Save File"), "appstate.save()");
    k.add_func(new KeyHandler("V", [], "Split Areas"), handle_split_areas);
    k.add_func(new KeyHandler("U", ["CTRL", "SHIFT"]), function() {
      console.log("saving new startup file.");
      g_app_state.set_startup_file();
    });
    this.canvas = new UICanvas([[0, 0], this.size]);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ob=new Screen(0, 512, 512);
    reader(ob);
    ob.areas = new GArray(ob.areas);
    var __iter_c=__get_iter(ob.areas);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.parent = ob;
    }
    return ob;
  }), function destroy() {
    this.canvas.destroy();
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (__instance_of(c, ScreenArea)) {
          c.destroy();
      }
    }
  }, function split_areas() {
    console.log("split areas", this);
    g_app_state.toolstack.exec_tool(new SplitAreasTool(this));
  }, function set_touchstate(event, type) {
    for (var k in event.touches) {
        this.touch_ms[k] = time_ms();
        if (type=="down"||type=="move") {
            this.touchstate[k] = event.touches[k];
        }
        else 
          if (type=="up") {
            delete this.touchstate[k];
        }
    }
    var threshold=4000;
    this.tottouch = 0;
    for (var k in this.touchstate) {
        if (time_ms()-this.touch_ms[k]>threshold) {
            console.log("Destroying stale touch state");
            var event=new MyMouseEvent(event.x, event.y, 0, MyMouseEvent.MOUSEUP);
            event.touches = {k: this.touchstate[k]};
            this.touch_ms[k] = time_ms();
            this.on_mouseup(event);
            delete this.touchstate[k];
        }
        this.tottouch++;
    }
  }, function area_event_push() {
    if (__instance_of(this.active, ScreenArea)) {
        this.active.area.push_ctx_active();
        return this.active.area;
    }
  }, function area_event_pop(area) {
    if (area!=undefined) {
        area.pop_ctx_active();
    }
  }, function _on_mousemove(e) {
    if (DEBUG.mousemove)
      console.log("mmove", [e.x, e.y]);
    this.mpos = [e.x, e.y];
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.mpos = new Vector2([e.x-c.pos[0], e.y-c.pos[1]]);
    }
    e = this.handle_event_modifiers(e);
    this.set_touchstate(e, "move");
    var area=this.area_event_push();
    UIFrame.prototype._on_mousemove.call(this, e);
    this.area_event_pop(area);
  }, function get_active_view2d() {
    var view2d=undefined;
    if (this.active!=undefined&&__instance_of(this.active, ScreenArea)) {
        if (this.active.area.constructor.name=="View2DHandler") {
            view2d = this.active.area;
        }
    }
    return view2d;
  }, function handle_active_view2d() {
    var view2d=this.get_active_view2d();
    if (view2d!=undefined)
      g_app_state.active_view2d = view2d;
  }, function _on_mousedown(e) {
    this.handle_active_view2d();
    if (DEBUG.mouse)
      console.log("mdown", [e.x, e.y], e.button);
    this.mpos = [e.x, e.y];
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.mpos = new Vector2([e.x-c.pos[0], e.y-c.pos[1]]);
    }
    this.shift = e.shiftKey;
    this.ctrl = e.ctrlKey;
    this.alt = e.altKey;
    this.set_touchstate(e, "down");
    var area=this.area_event_push();
    UIFrame.prototype._on_mousedown.call(this, e);
    this.area_event_pop(area);
  }, function _on_mouseup(e) {
    this.handle_active_view2d();
    if (DEBUG.mouse)
      console.log("mouseup", [e.x, e.y], e.button);
    this.mpos = [e.x, e.y];
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.mpos = new Vector2([e.x-c.pos[0], e.y-c.pos[1]]);
    }
    e = this.handle_event_modifiers(e);
    this.set_touchstate(e, "up");
    var area=this.area_event_push();
    UIFrame.prototype._on_mouseup.call(this, e);
    this.area_event_pop(area);
  }, function _on_mousewheel(e, delta) {
    this.handle_active_view2d();
    this.mpos = [e.x, e.y];
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.mpos = new Vector2([e.x-c.pos[0], e.y-c.pos[1]]);
    }
    var area=this.area_event_push();
    UIFrame.prototype._on_mousewheel.call(this, e, delta);
    this.area_event_pop(area);
  }, function handle_event_modifiers(event) {
    var copy=false;
    var event2;
    if (__instance_of(event, MyMouseEvent)) {
        event2 = event.copy();
        event2.keyCode = event.keyCode;
        event2.shiftKey = event.shiftKey;
        event2.ctrlKey = event.ctrlKey;
        event2.altKey = event.altKey;
    }
    else {
      event2 = {x: event.x, y: event.y, button: event.button, keyCode: event.keyCode, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, altKey: event.altKey};
    }
    event = event2;
    var __iter_item=__get_iter(this.modup_time_ms);
    var item;
    while (1) {
      var __ival_item=__iter_item.next();
      if (__ival_item.done) {
          break;
      }
      item = __ival_item.value;
      if (item[2]==charmap["Shift"])
        event.shiftKey = true;
      if (item[2]==charmap["Alt"])
        event.altKey = true;
      if (item[2]==charmap["Ctrl"]) {
          event.ctrlKey = true;
      }
    }
    return event;
  }, function _on_keyup(event) {
    this.handle_active_view2d();
    switch (event.keyCode) {
      case charmap["Shift"]:
      case charmap["Alt"]:
      case charmap["Ctrl"]:
        event = {keyCode: event.keyCode, shiftKey: event.shiftKey, altKey: event.altKey, ctrlKey: event.ctrlKey};
        this.modup_time_ms.push([time_ms(), event, event.keyCode]);
        return ;
        break;
    }
    event = this.handle_event_modifiers(event);
    UIFrame.prototype._on_keyup.call(this, event);
  }, function _on_keydown(event) {
    this.handle_active_view2d();
    var a=event.altKey, c=event.ctrlKey, s=event.shiftKey;
    event = this.handle_event_modifiers(event);
    this.shift = event.shiftKey;
    this.ctrl = event.ctrlKey;
    this.alt = event.altKey;
    var area=this.area_event_push();
    UIFrame.prototype._on_keydown.call(this, event);
    this.area_event_pop(area);
  }, function on_keyup(event) {
    this.handle_active_view2d();
    var ctx=new Context();
    var ret=this.keymap.process_event(ctx, event);
    if (ret!=undefined) {
        ret.handle(ctx);
    }
    else {
      UIFrame.prototype.on_keyup.call(this, event);
    }
  }, function event_tick() {
    touch_manager.process();
    g_app_state.raster.begin_draw(undefined, this.pos, this.size);
    var mod_delay=60;
    var __iter_s=__get_iter(list(this.modup_time_ms));
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      if (time_ms()-s[0]>mod_delay) {
          if (s[1].keyCode==charmap["Shift"]) {
              s[1].altKey = this.alt;
              s[1].ctrlKey = this.ctrl;
              this.shift = false;
          }
          if (s[1].keyCode==charmap["Alt"]) {
              s[1].shiftKey = this.shift;
              s[1].ctrlKey = this.ctrl;
              this.alt = false;
          }
          if (s[1].keyCode==charmap["Ctrl"]) {
              s[1].shiftKey = this.shift;
              s[1].altKey = this.alt;
              this.ctrl = false;
          }
          if (DEBUG.modifier_keys)
            console.log("delayed event");
          this.modup_time_ms.remove(s);
          UIFrame.prototype._on_keyup.call(this, s[1]);
      }
    }
    if (time_ms()-g_app_state.jobs.last_ms>g_app_state.jobs.ival) {
        g_app_state.jobs.run();
        g_app_state.jobs.last_ms = time_ms();
    }
  }, function on_draw() {
    if (this.recalc) {
        this.build_draw(this.canvas, false);
        this.recalc = false;
    }
  }, function _on_tick() {
    if (this.recalc) {
        this.build_draw(this.canvas, false);
        this.recalc = false;
    }
    this.last_tick = time_ms();
    this.on_tick();
  }, function disabledon_draw() {
    return ;
  }, function clear_textinput() {
    var canvas=document.getElementById("canvas2d_work");
    canvas.textContent = "&nbsp";
  }, function on_tick() {
    if (window.the_global_dag!=undefined) {
        if (this.ctx===undefined)
          this.ctx = new Context();
        the_global_dag.exec(this.ctx);
    }
    this.handle_active_view2d();
    try {
      g_app_state.session.settings.on_tick();
    }
    catch (_err) {
        print_stack(_err);
        console.log("settings on_tick error");
    }
    try {
      g_app_state.notes.on_tick();
    }
    catch (_err) {
        print_stack(_err);
        console.log("notes on_tick error");
    }
    if (time_ms()-this.last_sync>700) {
        this.last_sync = time_ms();
    }
    if (!config.NO_SERVER&&this.modalhandler==null&&!g_app_state.session.is_logged_in) {
        login_dialog(new Context());
    }
    if (this.session_timer.ready()&&g_app_state.session.is_logged_in) {
        g_app_state.session.validate_session();
    }
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      this.draw_active = c;
      if (__instance_of(c, ScreenArea)) {
          var area=this.area_event_push();
          c.on_tick();
          this.area_event_pop(area);
      }
    }
    this.draw_active = undefined;
  }, function on_resize(newsize, oldsize) {
    g_app_state.size = new Vector2(newsize);
    if (oldsize==undefined||this.use_old_size)
      oldsize = [this.size[0], this.size[1]];
    if (newsize[0]<100||newsize[1]<100) {
        this.use_old_size = true;
        newsize[0] = 100;
        newsize[1] = 100;
    }
    var ratio=(new Vector2(newsize)).divide(oldsize);
    this.size = [newsize[0], newsize[1]];
    this.canvas.viewport = [[0, 0], newsize];
    if (oldsize[0]==0.0||oldsize[1]==0.0)
      return ;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.pos[0]*=ratio[0];
      c.pos[1]*=ratio[1];
      c.pos[0] = Math.ceil(c.pos[0]);
      c.pos[1] = Math.ceil(c.pos[1]);
      if (__instance_of(c, Dialog)||__instance_of(c, UIMenu)||__instance_of(c, window.UIRadialMenu))
        continue;
      c.size[0]*=ratio[0];
      c.size[1]*=ratio[1];
      c.size[0] = Math.ceil(c.size[0]);
      c.size[1] = Math.ceil(c.size[1]);
    }
    this.snap_areas();
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.on_resize(newsize, oldsize);
    }
  }, function snap_areas(force) {
    var __iter_sa=__get_iter(this.children);
    var sa;
    while (1) {
      var __ival_sa=__iter_sa.next();
      if (__ival_sa.done) {
          break;
      }
      sa = __ival_sa.value;
      if (!(__instance_of(sa, ScreenArea)))
        continue;
      sa.pos[0] = Math.max(sa.pos[0], 0.0);
      sa.pos[1] = Math.max(sa.pos[1], 0.0);
      sa.size[0] = Math.min(sa.size[0]+sa.pos[0], this.size[0])-sa.pos[0];
      sa.size[1] = Math.min(sa.size[1]+sa.pos[1], this.size[1])-sa.pos[1];
    }
    var dis=16.0;
    for (var i=0; !found&&i<128; i++) {
        var found=false;
        var __iter_c1=__get_iter(this.children);
        var c1;
        while (1) {
          var __ival_c1=__iter_c1.next();
          if (__ival_c1.done) {
              break;
          }
          c1 = __ival_c1.value;
          if (!(__instance_of(c1, ScreenArea)))
            continue;
          var __iter_c2=__get_iter(this.children);
          var c2;
          while (1) {
            var __ival_c2=__iter_c2.next();
            if (__ival_c2.done) {
                break;
            }
            c2 = __ival_c2.value;
            if (!(__instance_of(c2, ScreenArea)))
              continue;
            if (c1==c2)
              continue;
            var oldsize=new Vector2(c2.size);
            var found2=false;
            var abs=Math.abs;
            if (abs(c1.pos[0]-c2.pos[0])<dis&&abs((c1.pos[1]+c1.size[1])-c2.pos[1])<dis) {
                found2 = 1;
                c1.size[1] = c2.pos[1]-c1.pos[1];
                c1.size[1] = Math.max(c1.size[1], 4);
            }
            if (abs(c1.pos[1]-c2.pos[1])<dis&&abs((c1.pos[0]+c1.size[0])-c2.pos[0])<dis) {
                found2 = 2;
                c1.size[0] = c2.pos[0]-c1.pos[0];
                c1.size[0] = Math.max(c1.size[0], 4);
            }
            if (found2&&c2.size[0]!=oldsize[0]&&c2.size[1]!=oldsize[1]) {
                found = true;
                c2.on_resize(c2.size, oldsize);
                console.log("SNAPPED", found2, c2.size, oldsize);
            }
            if (found2)
              break;
          }
        }
    }
  }, function pop_modal() {
    UIFrame.prototype.pop_modal.call(this);
    if (this.modalhandler==null) {
        var e=new MyMouseEvent(this.mpos[0], this.mpos[1], 0, 0);
        e.shiftKey = this.shiftKey;
        e.altKey = this.altKey;
        e.ctrlKey = this.ctrlKey;
    }
  }, function recalc_all_borders() {
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (__instance_of(c, ScreenArea)) {
          this.recalc_child_borders(c);
      }
    }
  }, function recalc_child_borders(child) {
    var bs=this.child_borders.get(child);
    for (var i=0; i<4; i++) {
        var border=bs[i];
        border.pos[0] = border.edge.min[0];
        border.pos[1] = border.edge.min[1];
        if (i%2==0) {
            border.pos[1]-=BORDER_WIDTH*0.5;
            border.size[0] = (border.edge.max[0]-border.edge.min[0]);
            border.size[1] = BORDER_WIDTH;
        }
        else {
          border.pos[0]-=BORDER_WIDTH*0.5;
          border.size[1] = border.edge.max[1]-border.edge.min[1];
          border.size[0] = BORDER_WIDTH;
        }
    }
  }, function remove(child) {
    UIFrame.prototype.remove.call(this, child);
    if (__instance_of(child, ScreenArea)) {
        this.areas.remove(child);
        var bs=this.child_borders.get(child);
        for (var i=0; i<4; i++) {
            this.remove(bs[i]);
        }
        this.child_borders.remove(child);
    }
  }, function add(child, packflag) {
    var view2d;
    if (__instance_of(child, ScreenArea)) {
        this.areas.push(child);
        for (var k in child.editors) {
            var area=child.editors[k];
            if (area.constructor.name=="View2DHandler")
              view2d = area;
        }
    }
    if (view2d==undefined) {
        var __iter_c=__get_iter(this.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          if (!(__instance_of(c, ScreenArea)))
            continue;
          if ("View2DHandler" in c.editors) {
              view2d = c.editors["View2DHandler"];
              break;
          }
        }
    }
    if (__instance_of(child, ScreenArea)) {
        child.canvas = this.canvas;
        for (var k in child.editors) {
            child.editors[k].canvas = this.canvas;
        }
    }
    else 
      if (child.canvas==undefined) {
        child.canvas = this.canvas;
    }
    UIFrame.prototype.add.call(this, child, packflag);
    if (__instance_of(child, ScreenArea)) {
        var bs=[];
        for (var i=0; i<4; i++) {
            bs.push(new ScreenBorder(child, i));
            this.add(bs[bs.length-1]);
        }
        this.child_borders.set(child, bs);
        this.recalc_child_borders(child);
    }
  }, function toJSON() {
    var scrareas=new GArray();
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (__instance_of(c, ScreenArea))
        scrareas.push(c);
    }
    var ret={scrareas: [], size: [this.size[0], this.size[1]]}
    var __iter_a=__get_iter(scrareas);
    var a;
    while (1) {
      var __ival_a=__iter_a.next();
      if (__ival_a.done) {
          break;
      }
      a = __ival_a.value;
      ret.scrareas.push(a.toJSON());
    }
    return ret;
  }, function do_partial_clip() {
    var canvas=this.canvas;
    var this2=this;
    function clear_recalc(e, d) {
      var __iter_c=__get_iter(e.children);
      var c;
      while (1) {
        var __ival_c=__iter_c.next();
        if (__ival_c.done) {
            break;
        }
        c = __ival_c.value;
        c.abspos[0] = 0;
        c.abspos[1] = 0;
        c.abs_transform(c.abspos);
        var t=c.dirty;
        if (!(__instance_of(c, UIFrame))) {
        }
        c.abspos[0] = 0;
        c.abspos[1] = 0;
        c.abs_transform(c.abspos);
        if (aabb_isect_2d(c.abspos, c.size, d[0], d[1])||c.is_canvas_root()) {
            c.do_recalc();
        }
        if (__instance_of(c, UIFrame)) {
            clear_recalc(c, d);
        }
        else {
          if (c.recalc) {
          }
        }
      }
    }
    this.pack(canvas, false);
    this.pack(canvas, false);
    var d=this.calc_dirty();
    this.dirty_rects.reset();
    this.canvas.root_start();
    this.canvas.clip(d);
    this.canvas.clear(d[0], d[1]);
    clear_recalc(this, d);
  }, function build_draw(canvas, isVertical) {
    window.block_redraw_ui();
    this.do_partial_clip();
    function descend(n, canvas, ctx) {
      var __iter_c=__get_iter(n.children);
      var c;
      while (1) {
        var __ival_c=__iter_c.next();
        if (__ival_c.done) {
            break;
        }
        c = __ival_c.value;
        if (c.canvas==undefined)
          c.canvas = n.get_canvas();
        c.ctx = ctx;
        if (__instance_of(c, UIFrame))
          descend(c, canvas, ctx);
      }
    }
    if (this.ctx==undefined)
      this.ctx = new Context();
    if (this.canvas==undefined)
      this.canvas = this.get_canvas();
    descend(this, this.canvas, this.ctx);
    if (DEBUG.ui_canvas)
      console.log("------------->Build draw call "+this.constructor.name+".on_draw()");
    this.snap_areas();
    UIFrame.prototype.build_draw.call(this, canvas, isVertical);
    window.unblock_redraw_ui();
    this.canvas.root_end();
  }, function data_link(block, getblock, getblock_us) {
    this.ctx = new Context();
    var __iter_c=__get_iter(this.areas);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.data_link(block, getblock, getblock_us);
    }
    var areas=this.areas;
    this.areas = new GArray();
    var __iter_a=__get_iter(areas);
    var a;
    while (1) {
      var __ival_a=__iter_a.next();
      if (__ival_a.done) {
          break;
      }
      a = __ival_a.value;
      this.add(a);
    }
  }]);
  _es6_module.add_class(Screen);
  Screen = _es6_module.add_export('Screen', Screen);
  Screen.STRUCT = "\n  Screen {\n    pos   : vec2;\n    size  : vec2;\n    areas : array(abstract(ScreenArea));\n  }\n";
  function load_screen(scr, json_obj) {
    var newsize=[scr.size[0], scr.size[1]];
    var obj=json_obj;
    var __iter_c=__get_iter(list(scr.children));
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (!(__instance_of(c, ScreenBorder))) {
          console.log(c);
          scr.remove(c);
      }
    }
    scr.children = new GArray();
    var scrareas=obj.scrareas;
    for (var i=0; i<scrareas.length; i++) {
        var area=ScreenArea.fromJSON(scrareas[i]);
        scr.add(area);
        if (area.area.constructor.name=="View2DHandler") {
            scr.view2d = area.area;
        }
    }
    scr.size[0] = obj.size[0];
    scr.size[1] = obj.size[1];
    scr.on_resize(newsize, obj.size);
    scr.size[0] = newsize[0];
    scr.size[1] = newsize[1];
    scr.snap_areas();
  }
  function gen_screen(gl, view2d, width, height) {
    var scr=new Screen(view2d, width, height);
    view2d.screen = scr;
    g_app_state.screen = scr;
    g_app_state.eventhandler = scr;
    g_app_state.active_view2d = view2d;
    view2d.size = [width, height];
    view2d.pos = [0, 0];
    scr.ctx = new Context();
    scr.canvas = new UICanvas([[0, 0], [width, height]]);
    scr.add(new ScreenArea(view2d, scr.ctx, view2d.pos, view2d.size));
    return scr;
  }
  gen_screen = _es6_module.add_export('gen_screen', gen_screen);
  window.Screen = Screen;
  window.ScreenArea = ScreenArea;
  window.Area = Area;
}, '/home/ec2-user/fairmotion/src/windowmanager/FrameManager.js');
es6_module_define('FrameManager_ops', ["struct", "UIElement", "UIPack", "ScreenArea", "UIFrame", "dialogs", "../editors/viewport/events", "UICanvas", "mathlib", "toolops_api"], function _FrameManager_ops_module(_es6_module) {
  "use strict";
  var login_dialog=es6_import_item(_es6_module, 'dialogs', 'login_dialog');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var get_rect_lines=es6_import_item(_es6_module, 'mathlib', 'get_rect_lines');
  var get_rect_points=es6_import_item(_es6_module, 'mathlib', 'get_rect_points');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var closest_point_on_line=es6_import_item(_es6_module, 'mathlib', 'closest_point_on_line');
  var dist_to_line_v2=es6_import_item(_es6_module, 'mathlib', 'dist_to_line_v2');
  var aabb_isect_minmax2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_minmax2d');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var KeyMap=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, '../editors/viewport/events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../editors/viewport/events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'EventHandler');
  var UICanvas=es6_import_item(_es6_module, 'UICanvas', 'UICanvas');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var UIHoverHint=es6_import_item(_es6_module, 'UIElement', 'UIHoverHint');
  var UIHoverBox=es6_import_item(_es6_module, 'UIElement', 'UIHoverBox');
  var ScreenArea=es6_import_item(_es6_module, 'ScreenArea', 'ScreenArea');
  var Area=es6_import_item(_es6_module, 'ScreenArea', 'Area');
  var SplitAreasTool=_ESClass("SplitAreasTool", ToolOp, [function SplitAreasTool(screen) {
    ToolOp.call(this, "area_split_tool", "Split Screen", "Split a screen editor");
    this.screen = screen;
    this.canvas = screen.canvas;
    this.is_modal = true;
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.mpos = [0, 0];
    this.split = undefined;
    this.lines = undefined;
    this.inputs = {}
    this.outputs = {}
    this.canvas.push_layer();
  }, function on_mousemove(event) {
    this.mpos = new Vector2([event.x, event.y]);
    this.canvas.reset();
    var p=this.modal_ctx.view2d;
    while (p!=undefined) {
      this.mpos.add(p.pos);
      p = p.parent;
    }
    var mpos=this.mpos;
    var active=undefined;
    var __iter_c=__get_iter(this.screen.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (!(__instance_of(c, ScreenArea)))
        continue;
      if (inrect_2d(mpos, c.pos, c.size)) {
          active = c;
          break;
      }
    }
    if (active==undefined)
      return ;
    var canvas=this.canvas;
    var clr=[0.1, 0.1, 0.1, 1.0];
    var rad=15;
    var lines=[[c.pos, [c.pos[0], c.pos[1]+c.size[1]]], [c.pos, [c.pos[0]+c.size[0], c.pos[1]]], [[c.pos[0]+c.size[0], c.pos[1]], [c.pos[0]+c.size[0], c.pos[1]+c.size[1]]], [[c.pos[0], c.pos[1]+c.size[1]], [c.pos[0]+c.size[0], c.pos[1]+c.size[1]]]];
    var line=undefined;
    var ldis=0.0;
    for (var i=0; i<4; i++) {
        lines[i][0] = new Vector2(lines[i][0]);
        lines[i][1] = new Vector2(lines[i][1]);
        canvas.line(lines[i][0], lines[i][1], clr, clr, rad);
        var dis=dist_to_line_v2(mpos, lines[i][0], lines[i][1]);
        if (line==undefined||dis<ldis) {
            ldis = dis;
            line = i;
        }
    }
    canvas.clear();
    if (line==undefined)
      return ;
    var v1=lines[line][0];
    var v2=lines[line][1];
    var v3=lines[(line+2)%4][0];
    var v4=lines[(line+2)%4][1];
    var ret=closest_point_on_line(mpos, v1, v2);
    var p1=ret[0];
    var t=ret[1]/v2.vectorDistance(v1);
    if (isNaN(t))
      t = 0;
    var p2=new Vector2(v4).sub(v3).mulScalar(t).add(v3);
    canvas.line(p1, p2, clr, clr, 4.0);
    this.lines = lines;
    this.split = [active, line, (line+2)%4, t];
  }, function finish(event) {
    if (this.split==undefined) {
        this.cleanup();
        return ;
    }
    var area=this.split[0];
    var i=this.split[1];
    var t=this.split[3];
    var oldsize=[area.size[0], area.size[1]];
    var area2=area.area_duplicate();
    if (i==0||i==2) {
        area2.size[0] = area.size[0];
        area2.size[1] = area.size[1]*(1.0-t);
        area.size[1]*=t;
        area2.pos[0] = area.pos[0];
        area2.pos[1] = area.pos[1]+area.size[1];
    }
    else {
      area2.size[1] = area.size[1];
      area2.size[0] = area.size[0]*(1.0-t);
      area.size[0]*=t;
      area2.pos[1] = area.pos[1];
      area2.pos[0] = area.pos[0]+area.size[0];
    }
    this.screen.add(area2);
    area.on_resize(area.size, oldsize);
    area2.on_resize(area2.size, oldsize);
    this.cleanup();
    this.screen.recalc_all_borders();
    this.screen.snap_areas();
  }, function cancel(event) {
    this.cleanup();
  }, function cleanup(event) {
    this.end_modal();
    this.canvas.pop_layer();
  }, function on_mouseup(event) {
    if (event.button==0)
      this.finish();
    else 
      if (event.button==2)
      this.cancel();
  }, function on_keydown(event) {
    if (event.keyCode==charmap["Escape"])
      this.cancel();
    if (event.keyCode==charmap["Enter"])
      this.finish();
  }]);
  _es6_module.add_class(SplitAreasTool);
  SplitAreasTool = _es6_module.add_export('SplitAreasTool', SplitAreasTool);
  var CollapseAreasTool=_ESClass("CollapseAreasTool", EventHandler, [function CollapseAreasTool(screen, border) {
    EventHandler.call(this);
    this.border = border;
    this.screen = screen;
    this.canvas = screen.canvas;
    this.mpos = [0, 0];
    this.active = undefined;
    this.mesh = border.build_mesh();
    this.areas = this.mesh[1][border.hash_edge(border.v1, border.v2)];
    for (var i=0; i<this.areas.length; i++) {
        this.areas[i] = this.areas[i].area;
    }
    this.canvas.push_layer();
  }, function on_mousemove(event) {
    this.mpos = new Vector2([event.x, event.y]);
    this.canvas.reset();
    var mpos=this.mpos;
    var active=undefined;
    var __iter_c=__get_iter(this.areas);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (inrect_2d(mpos, c.pos, c.size)) {
          active = c;
          break;
      }
    }
    if (active==undefined)
      return ;
    this.active = active;
    var canvas=this.canvas;
    var clr1=[0.1, 0.1, 0.1, 0.1];
    var clr2=[0.1, 0.1, 0.1, 1.0];
    var rad=15;
    var ps=get_rect_points(new Vector2(active.pos), active.size);
    canvas.clear();
    canvas.quad(ps[0], ps[1], ps[2], ps[3], clr1, clr1, clr1, clr1);
    canvas.line(ps[0], ps[2], clr2, undefined, 6.0);
    canvas.line(ps[1], ps[3], clr2, undefined, 6.0);
  }, function finish(event) {
    this.cleanup();
    if (this.active==undefined)
      return ;
    var keep=undefined;
    var __iter_area=__get_iter(this.areas);
    var area;
    while (1) {
      var __ival_area=__iter_area.next();
      if (__ival_area.done) {
          break;
      }
      area = __ival_area.value;
      if (area!=this.active) {
          keep = area;
          break;
      }
    }
    if (keep==undefined) {
        console.log("eek! error in CollapseAreasTool.finish!");
        return ;
    }
    var mm=new MinMax(2);
    var ps1=get_rect_points(this.active.pos, this.active.size);
    for (var i=0; i<4; i++) {
        mm.minmax(ps1[i]);
    }
    var ps2=get_rect_points(keep.pos, keep.size);
    for (var i=0; i<4; i++) {
        mm.minmax(ps2[i]);
    }
    mm.minmax(this.active.pos);
    this.active.on_close();
    this.screen.remove(this.active);
    var oldsize=new Vector2(keep.size);
    keep.pos[0] = mm.min[0];
    keep.pos[1] = mm.min[1];
    keep.size[0] = mm.max[0]-mm.min[0];
    keep.size[1] = mm.max[1]-mm.min[1];
    for (var i=0; i<2; i++) {
        keep.size[i] = Math.ceil(keep.size[i]);
        keep.pos[i] = Math.floor(keep.pos[i]);
    }
    keep.on_resize(keep.size, oldsize);
    keep.do_recalc();
    this.screen.recalc_all_borders();
    this.screen.snap_areas();
    this.canvas.reset();
  }, function cancel(event) {
    this.cleanup();
  }, function cleanup(event) {
    this.canvas.pop_layer();
    this.screen.pop_modal();
  }, function on_mouseup(event) {
    if (event.button==0)
      this.finish();
    else 
      if (event.button==2)
      this.cancel();
  }, function on_keydown(event) {
    if (event.keyCode==charmap["Escape"])
      this.cancel();
    if (event.keyCode==charmap["Enter"])
      this.finish();
  }]);
  _es6_module.add_class(CollapseAreasTool);
  CollapseAreasTool = _es6_module.add_export('CollapseAreasTool', CollapseAreasTool);
  var HintPickerOpElement=_ESClass("HintPickerOpElement", UIElement, [function HintPickerOpElement(ctx, op) {
    UIElement.call(this, ctx);
    this.op = op;
  }, function build_draw(canvas, isVertical) {
    this.op.canvas = canvas;
    this.op.build_draw();
  }]);
  _es6_module.add_class(HintPickerOpElement);
  HintPickerOpElement = _es6_module.add_export('HintPickerOpElement', HintPickerOpElement);
  var HintPickerOp=_ESClass("HintPickerOp", ToolOp, [function HintPickerOp() {
    ToolOp.call(this);
    this.canvas = g_app_state.screen.canvas;
    this.mup_count = 0;
    this.active = undefined;
    this.hintbox = undefined;
    this.last_mpos = new Vector2([0, 0]);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Hint Picker", apiname: "screen.hint_picker", undoflag: UndoFlags.IGNORE_UNDO, is_modal: true, inputs: {}, outputs: {}, description: "Helper to show tooltips on tablets", icon: Icons.HELP_PICKER}
  }), function can_call(ctx) {
    return true;
  }, function find_element(event, mpos) {
    function descend(e, mpos) {
      if (__instance_of(e, UIHoverHint)) {
          return e;
      }
      else 
        if (!(__instance_of(e, UIFrame))) {
          return undefined;
      }
      mpos = [mpos[0]-e.pos[0], mpos[1]-e.pos[1]];
      var __iter_c=__get_iter(e.children);
      var c;
      while (1) {
        var __ival_c=__iter_c.next();
        if (__ival_c.done) {
            break;
        }
        c = __ival_c.value;
        if (inrect_2d(mpos, c.pos, c.size))
          return descend(c, mpos);
      }
    }
    var ret;
    var __iter_c=__get_iter(g_app_state.screen.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (!(__instance_of(c, ScreenArea)))
        continue;
      if (!inrect_2d(mpos, c.pos, c.size))
        continue;
      ret = descend(c, mpos);
      if (ret!=undefined)
        break;
    }
    this.active = ret;
    return ret;
  }, function on_mousemove(event) {
    this.canvas = g_app_state.screen.canvas;
    var ctx=this.modal_ctx;
    var mpos=[event.x, event.y];
    var old=this.active;
    this.find_element(event, mpos);
    if (old!=this.active&&this.active!=undefined) {
        if (this.hintbox!=undefined) {
            this.hintbox.parent.remove(this.hintbox);
            this.hintbox.parent.do_recalc();
        }
        this.helper.do_recalc();
        this.hintbox = this.active.on_hint(false);
        console.log("active change");
    }
    else 
      if (old!=this.active&&this.active==undefined) {
        this.helper.do_recalc();
    }
  }, function start_modal(ctx) {
    console.log("helper tool");
    var helper=new HintPickerOpElement(ctx, this);
    g_app_state.screen.add(helper);
    this.helper = helper;
  }, function finish() {
    this.canvas.reset();
    this.end_modal();
    g_app_state.screen.remove(this.helper);
    if (this.hintbox!=undefined) {
        this.hintbox.parent.remove(this.hintbox);
        this.hintbox.parent.do_recalc();
    }
  }, function on_mousedown(event) {
    this.on_mousemove(event);
  }, function on_mouseup(event) {
    console.log("was_touch", this.active, (this.active&&g_app_state.was_touch&&this.mup_count<1));
    if (g_app_state.was_touch&&this.active!=undefined) {
        return ;
    }
    this.finish();
  }, function on_keyup(event) {
    if (event.keyCode==27) {
        this.canvas.reset();
        this.finish();
    }
  }, function build_draw() {
    var clr=[0, 0, 0, 0.35];
    if (this.active==undefined) {
    }
    else {
      var pos=this.active.get_abs_pos();
    }
  }]);
  _es6_module.add_class(HintPickerOp);
  HintPickerOp = _es6_module.add_export('HintPickerOp', HintPickerOp);
}, '/home/ec2-user/fairmotion/src/windowmanager/FrameManager_ops.js');
es6_module_define('ScreenArea', ["UIWidgets", "mathlib", "UISplitFrame", "UIFrame", "UIElement", "../editors/viewport/events", "UICanvas", "UIPack", "dialogs", "struct", "toolops_api"], function _ScreenArea_module(_es6_module) {
  "use strict";
  var login_dialog=es6_import_item(_es6_module, 'dialogs', 'login_dialog');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var get_rect_lines=es6_import_item(_es6_module, 'mathlib', 'get_rect_lines');
  var get_rect_points=es6_import_item(_es6_module, 'mathlib', 'get_rect_points');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var closest_point_on_line=es6_import_item(_es6_module, 'mathlib', 'closest_point_on_line');
  var dist_to_line_v2=es6_import_item(_es6_module, 'mathlib', 'dist_to_line_v2');
  var aabb_isect_minmax2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_minmax2d');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var KeyMap=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, '../editors/viewport/events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../editors/viewport/events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'EventHandler');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UISplitFrame=es6_import_item(_es6_module, 'UISplitFrame', 'UISplitFrame');
  var UICanvas=es6_import_item(_es6_module, 'UICanvas', 'UICanvas');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var UIHoverHint=es6_import_item(_es6_module, 'UIElement', 'UIHoverHint');
  var UIHoverBox=es6_import_item(_es6_module, 'UIElement', 'UIHoverBox');
  var Area_Types=new set(["View2DHandler"]);
  window.Area_Types = Area_Types;
  var _area_active_stacks={}
  var _area_active_lasts={}
  function _get_area_stack(cls) {
    var h=cls.name;
    if (!(h in _area_active_stacks)) {
        _area_active_stacks[h] = new GArray();
    }
    return _area_active_stacks[h];
  }
  var Area=_ESClass("Area", UIFrame, [function Area(type, uiname, ctx, pos, size) {
    UIFrame.call(this, ctx, undefined, undefined, pos, size);
    this.keymap = new KeyMap();
    this.auto_load_uidata = true;
    this.uiname = uiname;
    this.type = type;
    this.rows = new GArray();
    this.cols = new GArray();
    this.note_area = undefined;
    this._saved_uidata = undefined;
    var plus=this.plus = new UIButtonIcon(ctx, "Split Screen", Icons.SMALL_PLUS);
    this.plus.callback = function() {
      g_app_state.screen.split_areas();
    }
    plus.description = "Split the screen";
    this.add(plus);
  }, function pack(canvas, is_vertical) {
    if (this.subframe!==undefined) {
        this.subframe.size[0] = this.size[0];
        this.subframe.size[1] = this.size[1];
        this.subframe.pos[0] = this.subframe.pos[1] = 0;
    }
    this.plus.size = this.plus.get_min_size(canvas, is_vertical);
    this.plus.small_icon = true;
    this.plus.pos[0] = this.size[0]-this.plus.size[0]-2;
    this.plus.pos[1] = 2;
    this.children.remove(this.plus);
    this.children.push(this.plus);
    var panx=this.velpan!=undefined ? this.velpan.pan[0] : 0;
    var pany=this.velpan!=undefined ? this.velpan.pan[1] : 0;
    UIFrame.prototype.pack.call(this, canvas, is_vertical);
  }, function on_tick() {
    if (this.auto_load_uidata&&this._saved_uidata!=undefined) {
        this.load_saved_uidata();
        delete this._saved_uidata;
    }
    UIFrame.prototype.on_tick.call(this);
  }, _ESClass.get(function saved_uidata() {
    var paths=new GArray();
    function descend(e) {
      var data=e.get_filedata();
      if (data!=undefined) {
          if (typeof (data)!="string"&&!(__instance_of(data, String))) {
              data = JSON.stringify(data);
          }
          paths.push([e.get_uhash(), data]);
      }
      if (__instance_of(e, UIFrame)) {
          e.on_saved_uidata(descend);
      }
    }
    descend(this);
    return JSON.stringify(paths);
  }), function load_saved_uidata() {
    var str=this._saved_uidata;
    if (str==undefined||str=="")
      return ;
    delete this._saved_uidata;
    var paths;
    try {
      var paths=JSON.parse(str);
    }
    catch (_err) {
        print_stack(_err);
        console.log("Error parsing saved uidata");
        console.log("Data: ", str);
    }
    var ids={}
    for (var i=0; i<paths.length; i++) {
        try {
          ids[paths[i][0]] = JSON.parse(paths[i][1]);
        }
        catch (_err) {
            print_stack(_err);
            console.log("Could not parse ui filedata '"+paths[i][1]+"'");
            if (paths[i][0] in ids)
              delete ids[paths[i][0]];
        }
    }
    function recurse(e) {
      var id=e.get_uhash();
      if (id in ids) {
          try {
            e.load_filedata(ids[id]);
          }
          catch (_err) {
              print_stack(_err);
              console.log("Warning, could not load filedata for element", e);
              console.log("  data: ", ids[id]);
          }
      }
      if (__instance_of(e, UIFrame)) {
          e.on_load_uidata(recurse);
      }
    }
    recurse(this);
  }, _ESClass.set(function saved_uidata(str) {
    this._saved_uidata = str;
  }), _ESClass.static(function context_area(cls) {
    var stack=_get_area_stack(cls.name);
    if (stack.length==0)
      return _area_active_lasts[cls.name];
    else 
      return stack[stack.length-1];
  }), function push_ctx_active() {
    var stack=_get_area_stack(this.constructor);
    stack.push(this);
    _area_active_lasts[this.constructor.name] = this;
  }, function pop_ctx_active() {
    var stack=_get_area_stack(this.constructor);
    if (stack.length==0||stack[stack.length-1]!=this) {
        console.trace();
        console.log("Warning: invalid Area.pop_active() call");
        return ;
    }
    stack.pop(stack.length-1);
  }, _ESClass.static(function default_new(ctx, scr, unused, pos, size) {
  }), function get_keymaps() {
    return [this.keymap];
  }, function destroy() {
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if ("destroy" in c)
        c.destroy(g_app_state.gl);
    }
    this.canvas.destroy(g_app_state.gl);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ob={}
    reader(ob);
    return ob;
  }), function define_keymap() {
  }, function on_gl_lost(new_gl) {
    var __iter_c=__get_iter(this.cols);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.on_gl_lost();
    }
    var __iter_c=__get_iter(this.rows);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.on_gl_lost();
    }
    UIFrame.prototype.on_gl_lost.call(this, new_gl);
  }, function on_add(parent) {
    this.build_layout();
  }, function toJSON() {
    if (this.pos==undefined) {
        this.pos = [0, 0];
    }
    if (this.size==undefined) {
        this.size = [0, 0];
    }
    return {size: [this.size[0], this.size[1]], pos: [this.pos[0], this.pos[1]], type: this.constructor.name}
  }, function area_duplicate() {
    throw new Error("Error: unimplemented area_duplicate() in editor");
  }, function on_resize(newsize, oldsize) {
    if (oldsize==undefined)
      oldsize = this.size;
    this.size = newsize;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (this.canvas!=undefined&&c.canvas==undefined)
        c.canvas = this.canvas;
      c.on_resize(newsize, oldsize);
    }
  }, _ESClass.static(function get_barwid() {
    if (IsMobile) {
        return 152;
    }
    else {
      return 148;
    }
  }), _ESClass.static(function get_barhgt() {
    if (IsMobile) {
        return 45;
    }
    else {
      return 35;
    }
  }), function on_keyup(event) {
    var ctx=new Context();
    var maps=this.get_keymaps();
    for (var i=0; i<maps.length; i++) {
        var ret=maps[i].process_event(ctx, event);
        if (ret!=undefined) {
            ret.handle(ctx);
            break;
        }
    }
    UIFrame.prototype.on_keyup.call(this, event);
  }, function on_keydown(event) {
    this.shift = event.shiftKey;
    this.alt = event.altKey;
    this.ctrl = event.ctrlKey;
    UIFrame.prototype.on_keydown.call(this, event);
  }, function build_layout(make_top, make_bottom) {
    if (make_top==undefined) {
        make_top = true;
    }
    if (make_bottom==undefined) {
        make_bottom = true;
    }
    if (this.subframe!==undefined) {
        this.remove(this.subframe);
    }
    this.subframe = new UISplitFrame(this.ctx);
    this.subframe.state|=UIFlags.BG_EVENTS_TRANSPARENT;
    this.add(this.subframe);
    let bottombar=this.bottombar = this.subframe.initial();
    if (make_bottom) {
        bottombar.add(new ColumnFrame(this.ctx));
        bottombar.children[0].draw_background = true;
        this.build_bottombar(bottombar.children[0]);
    }
    else {
      bottombar.state|=UIFlags.BG_EVENTS_TRANSPARENT;
    }
    this.middlesplit = this.subframe.split(Area.get_barhgt(), false, false, true);
    this.middlesplit.state|=UIFlags.BG_EVENTS_TRANSPARENT;
    if (make_top) {
        let topbar=this.topbar = this.subframe.split(Area.get_barhgt(), false, true, true);
        topbar.add(new ColumnFrame(this.ctx));
        topbar.children[0].draw_background = true;
        this.build_topbar(topbar.children[0]);
    }
  }, function build_bottombar() {
  }, function build_topbar() {
  }, function build_sidebar1() {
  }, function on_area_inactive() {
  }, function on_area_active() {
  }]);
  _es6_module.add_class(Area);
  Area = _es6_module.add_export('Area', Area);
  Area.STRUCT = "\n  Area {\n    pos  : vec2;\n    size : vec2;\n    type : string;\n    saved_uidata : string;\n  }\n";
  var ScreenArea=_ESClass("ScreenArea", UIFrame, [function ScreenArea(area, ctx, pos, size, add_area) {
    UIFrame.call(this, ctx, undefined, undefined, pos, size);
    if (add_area==undefined)
      add_area = true;
    this.editors = {}
    this.editors[area.constructor.name] = area;
    this.area = area;
    area.pos[0] = 0;
    area.pos[1] = 0;
    this.type = undefined;
    if (add_area)
      this.add(area);
  }, function destroy() {
    for (var k in this.editors) {
        this.editors[k].destroy();
    }
  }, function switch_editor(cls) {
    if (!(cls.name in this.editors)) {
        console.log("creating new editor ", cls.name);
        var area=cls.default_new(new Context(), this, g_app_state.gl, this.pos, this.size);
        this.editors[cls.name] = area;
        this.editors[cls.name].do_recalc();
    }
    var area=this.editors[cls.name];
    try {
      this.area.push_ctx_active();
      this.area.on_area_inactive();
      this.area.pop_ctx_active();
    }
    catch (_err) {
        print_stack(_err);
        console.log("Error switching editor", this.area);
    }
    this.remove(this.area);
    area.push_ctx_active();
    area.size[0] = this.size[0];
    area.size[1] = this.size[1];
    area.pos[0] = this.pos[0];
    area.pos[1] = this.pos[1];
    this.add(area);
    this.area = this.active = area;
    this.area.canvas = this.canvas;
    this.canvas.reset();
    this.area.do_full_recalc();
    this.type = cls.name;
    area.on_area_active();
    area.on_resize(this.size, new Vector2(area.size));
    area.pop_ctx_active();
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ob=Object.create(ScreenArea.prototype);
    reader(ob);
    var act=ob.area;
    var editarr=new GArray(ob.editors);
    var screens2={}
    var __iter_scr=__get_iter(editarr);
    var scr;
    while (1) {
      var __ival_scr=__iter_scr.next();
      if (__ival_scr.done) {
          break;
      }
      scr = __ival_scr.value;
      if (scr.constructor.name==ob.area) {
          ob.area = scr;
      }
      screens2[scr.constructor.name] = scr;
    }
    if (!(__instance_of(ob.area, Area)))
      ob.area = editarr[0];
    ScreenArea.call(ob, ob.area, new Context(), ob.pos, ob.size, false);
    ob.editors = screens2;
    return ob;
  }), function data_link(block, getblock, getblock_us) {
    this.ctx = new Context();
    this.area.ctx = new Context();
    this.active = this.area;
    for (var k in this.editors) {
        var area=this.editors[k];
        area.data_link(block, getblock, getblock_us);
        area.set_context(this.ctx);
    }
    this.add(this.area);
  }, function on_add(parent) {
    this.active = this.area;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.on_add(this);
    }
  }, function on_close() {
    this.area.on_area_inactive();
  }, function area_duplicate() {
    var screens={}
    for (var k in this.editors) {
        var area=this.editors[k];
        screens[k] = area.area_duplicate();
    }
    var scr=new ScreenArea(screens[this.area.constructor.name], this.ctx, new Vector2(this.pos), new Vector2(this.size));
    scr.editors = screens;
    return scr;
  }, function on_tick() {
    this.area.push_ctx_active();
    UIFrame.prototype.on_tick.call(this);
    this.area.pop_ctx_active();
  }, function build_draw(canvas, isVertical) {
    this.active = this.area;
    g_app_state.size = new Vector2(this.size);
    this.area.pos[0] = this.area.pos[1] = 0;
    this.area.size[0] = this.size[0];
    this.area.size[1] = this.size[1];
    this.area.push_ctx_active();
    this.canvas.push_scissor([2, 2], [this.size[0]-4, this.size[1]-4]);
    UIFrame.prototype.build_draw.call(this, canvas, isVertical);
    this.canvas.pop_scissor();
    this.area.pop_ctx_active();
    var border=[0, 0, 0, 1];
    var border2=[0.8, 0.8, 0.8, 1];
    var border3=[0.0, 0.0, 0.0, 1];
    canvas.line([0, 1], [this.size[0], 1], border, border);
    canvas.line([0, 1], [this.size[0], 1], border2, border2);
    canvas.line([0, 2], [this.size[0], 2], border3, border3);
    canvas.line([1, 0], [1, this.size[1]], border, border);
    canvas.line([1, 0], [1, this.size[1]], border2, border2);
  }, function on_draw(g) {
    return ;
  }, function add(child, packflag) {
    if (__instance_of(child, Area)) {
        if (this.type==undefined) {
            this.type = child.constructor.name;
        }
    }
    UIFrame.prototype.add.call(this, child, packflag);
  }, function on_resize(newsize, oldsize) {
    var oldsize=new Vector2(this.area.size);
    this.area.pos[0] = 0;
    this.area.pos[1] = 0;
    this.area.size[0] = this.size[0];
    this.area.size[1] = this.size[1];
    this.area.on_resize(this.area.size, oldsize);
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c!=this.area)
        c.on_resize(newsize, oldsize);
    }
  }]);
  _es6_module.add_class(ScreenArea);
  ScreenArea = _es6_module.add_export('ScreenArea', ScreenArea);
  ScreenArea.STRUCT = "\n  ScreenArea {\n    pos     : vec2;\n    size    : vec2;\n    type    : string;\n    editors : iter(k, abstract(Area)) | obj.editors[k];\n    area    : string | obj.area.constructor.name;\n  }\n";
}, '/home/ec2-user/fairmotion/src/windowmanager/ScreenArea.js');
es6_module_define('ScreenBorder', ["ScreenArea", "UIElement", "dialogs", "../editors/viewport/events", "UICanvas", "config", "FrameManager_ops", "UIPack", "UIFrame", "toolops_api", "struct", "mathlib"], function _ScreenBorder_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, 'config');
  var BORDER_WIDTH=IsMobile ? 24 : 12;
  BORDER_WIDTH = _es6_module.add_export('BORDER_WIDTH', BORDER_WIDTH);
  var login_dialog=es6_import_item(_es6_module, 'dialogs', 'login_dialog');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var get_rect_lines=es6_import_item(_es6_module, 'mathlib', 'get_rect_lines');
  var get_rect_points=es6_import_item(_es6_module, 'mathlib', 'get_rect_points');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var closest_point_on_line=es6_import_item(_es6_module, 'mathlib', 'closest_point_on_line');
  var dist_to_line_v2=es6_import_item(_es6_module, 'mathlib', 'dist_to_line_v2');
  var aabb_isect_minmax2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_minmax2d');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var KeyMap=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, '../editors/viewport/events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../editors/viewport/events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../editors/viewport/events', 'EventHandler');
  var UICanvas=es6_import_item(_es6_module, 'UICanvas', 'UICanvas');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var UIHoverHint=es6_import_item(_es6_module, 'UIElement', 'UIHoverHint');
  var UIHoverBox=es6_import_item(_es6_module, 'UIElement', 'UIHoverBox');
  var ScreenArea=es6_import_item(_es6_module, 'ScreenArea', 'ScreenArea');
  var Area=es6_import_item(_es6_module, 'ScreenArea', 'Area');
  var CollapseAreasTool=es6_import_item(_es6_module, 'FrameManager_ops', 'CollapseAreasTool');
  var _WrapVec=_ESClass("_WrapVec", [function _WrapVec(area, edge) {
    this.area = area;
    this.edge = (edge+1)%4;
  }, _ESClass.get(_ESClass.symbol(0, function() {
    switch (this.edge) {
      case 0:
        return this.area.pos[0];
      case 1:
        return this.area.pos[0];
      case 2:
        return this.area.pos[0]+this.area.size[0];
      case 3:
        return this.area.pos[0]+this.area.size[0];
    }
  })), _ESClass.get(_ESClass.symbol(1, function() {
    switch (this.edge) {
      case 0:
        return this.area.pos[1];
      case 1:
        return this.area.pos[1]+this.area.size[1];
      case 2:
        return this.area.pos[1]+this.area.size[1];
      case 3:
        return this.area.pos[1];
    }
  })), _ESClass.set(_ESClass.symbol(0, function(val) {
    if (isNaN(val)) {
        console.trace("NaN!");
        return ;
    }
    switch (this.edge) {
      case 0:
        this.area.size[0] = (this.area.pos[0]+this.area.size[0])-val;
        this.area.pos[0] = val;
        break;
      case 1:
        this.area.size[0] = (this.area.pos[0]+this.area.size[0])-val;
        this.area.pos[0] = val;
        break;
      case 2:
        this.area.size[0] = val-this.area.pos[0];
        break;
      case 3:
        this.area.size[0] = val-this.area.pos[0];
        break;
    }
  })), _ESClass.set(_ESClass.symbol(1, function(val) {
    if (isNaN(val)) {
        console.trace("NaN!");
        return ;
    }
    switch (this.edge) {
      case 0:
        this.area.size[1] = (this.area.pos[1]+this.area.size[1])-val;
        this.area.pos[1] = val;
        break;
      case 1:
        this.area.size[1] = val-this.area.pos[1];
        break;
      case 2:
        this.area.size[1] = val-this.area.pos[1];
        break;
      case 3:
        this.area.size[1] = (this.area.pos[1]+this.area.size[1])-val;
        this.area.pos[1] = val;
        break;
    }
  }))]);
  _es6_module.add_class(_WrapVec);
  _WrapVec = _es6_module.add_export('_WrapVec', _WrapVec);
  var AreaEdge=_ESClass("AreaEdge", [function AreaEdge(area, edge) {
    this.edge = edge;
    this.area = area;
    this._v1 = new _WrapVec(area, edge);
    this._v2 = new _WrapVec(area, (edge+1)%4);
  }, _ESClass.get(function v1() {
    return this._v1;
  }), _ESClass.get(function v2() {
    return this._v2;
  }), _ESClass.get(function length() {
    var dx=this.v1[0]-this.v2[0];
    var dy=this.v1[1]-this.v2[1];
    return Math.sqrt(dx*dx+dy*dy);
  }), _ESClass.get(function min() {
    return [Math.min(this.v1[0], this.v2[0]), Math.min(this.v1[1], this.v2[1])];
  }), _ESClass.get(function max() {
    return [Math.max(this.v1[0], this.v2[0]), Math.max(this.v1[1], this.v2[1])];
  }), _ESClass.set(function v1(val) {
    this._v1[0] = val[0];
    this._v1[1] = val[1];
  }), _ESClass.set(function v2(val) {
    this._v2[0] = val[0];
    this._v2[1] = val[1];
  })]);
  _es6_module.add_class(AreaEdge);
  AreaEdge = _es6_module.add_export('AreaEdge', AreaEdge);
  var _screenborder_id_gen=1;
  var $black_d9jd_on_mousemove;
  var $black_L8L2_build_draw;
  var ScreenBorder=_ESClass("ScreenBorder", UIElement, [function ScreenBorder(area, borderindex) {
    UIElement.call(this);
    this.area = area;
    this.canvas = undefined;
    this.start_mpos = [0, 0];
    this.moving = false;
    this.bindex = borderindex;
    this.moving_line = [new Vector2(), new Vector2()];
    this.start_moving_line = [new Vector2(), new Vector2()];
    this.state|=UIFlags.INVISIBLE;
    this._id = _screenborder_id_gen++;
    this.edge = new AreaEdge(area, borderindex);
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return this.constructor.name+"|"+this._id;
  }), function movable_border() {
    var count=0;
    var __iter_c=__get_iter(this.parent.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (!(__instance_of(c, ScreenArea)))
        continue;
      if (aabb_isect_2d(this.pos, this.size, c.pos, c.size))
        count++;
    }
    return count>1;
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return this.constructor.name+"|"+this._id;
  }), function movable_border() {
    var count=0;
    var __iter_c=__get_iter(this.parent.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (!(__instance_of(c, ScreenArea)))
        continue;
      if (aabb_isect_2d(this.pos, this.size, c.pos, c.size))
        count++;
    }
    return count>1;
  }, function _get_edge() {
    var v1=new Vector2(this.pos);
    var v2=new Vector2(this.pos);
    if (this.size[0]>this.size[1]) {
        v2[0]+=this.size[0];
    }
    else {
      v2[1]+=this.size[1];
    }
    return [v1, v2];
  }, function hash_edge(v1, v2) {
    var a1=[Math.floor(v1[0]), Math.floor(v2[0])];
    var a2=[Math.floor(v1[1]), Math.floor(v2[1])];
    a1.sort();
    a2.sort();
    return ""+a1[0]+"|"+a1[1]+"|"+a2[0]+"|"+a2[1];
  }, function hash_vert(v1) {
    return ""+Math.floor((v1[0]+0.5)/2.0)+"|"+Math.floor((v1[1]+0.5)/2.0);
  }, function build_mesh() {
    this.borders = new GArray();
    var i=0;
    var __iter_c=__get_iter(this.parent.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (__instance_of(c, ScreenBorder)) {
          c.ci = i++;
          this.borders.push(c);
      }
    }
    var edges={}
    var verts={}
    var vert_edges={}
    var __iter_b=__get_iter(this.borders);
    var b;
    while (1) {
      var __ival_b=__iter_b.next();
      if (__ival_b.done) {
          break;
      }
      b = __ival_b.value;
      var ret=b.get_edge();
      var v1=ret[0];
      var v2=ret[1];
      var h=this.hash_edge(v1, v2);
      if (!(h in edges)) {
          edges[h] = new GArray();
      }
      var hv1=this.hash_vert(v1);
      var hv2=this.hash_vert(v2);
      if (!(hv1 in verts))
        verts[hv1] = new set();
      if (!(hv2 in verts))
        verts[hv2] = new set();
      if (!(hv1 in vert_edges))
        vert_edges[hv1] = new set();
      if (!(hv2 in vert_edges))
        vert_edges[hv2] = new set();
      edges[h].push(b);
      verts[hv1].add(b);
      verts[hv2].add(b);
      vert_edges[hv1].add(h);
      vert_edges[hv2].add(h);
      b.v1 = v1;
      b.v2 = v2;
    }
    return [verts, edges, vert_edges];
  }, function get_edge() {
    return [new Vector2(this.edge.v1), new Vector2(this.edge.v2)];
  }, function at_screen_border(event) {
    var ret=true;
    var size=this.size, pos=this.pos, parent=this.parent;
    for (var i=0; i<2; i++) {
        var ret2=Math.abs(pos[i])<BORDER_WIDTH*1.1;
        ret2 = ret2||Math.abs(pos[i]+size[i]-parent.size[i])<BORDER_WIDTH*1.1;
        ret = ret2&ret;
    }
    return ret;
  }, function on_mousedown(event) {
    if (event.button==0&&!this.moving&&!this.at_screen_border(event)) {
        this.start(event);
    }
  }, function border_menu(event) {
    console.log("border menu");
    var this2=this;
    function menucb(entry, id) {
      if (id=="collapse") {
          this.parent.push_modal(new CollapseAreasTool(this2.parent, this2));
      }
    }
    var menu=new UIMenu("", menucb);
    menu.add_item("Collapse", "", "collapse");
    menu.ignore_next_mouseup_event = 0;
    ui_call_menu(menu, this.parent, [event.x+this.pos[0], event.y+this.pos[1]]);
  }, function start(event) {
    this.start_mpos = new Vector2([event.x, event.y]);
    this.areas = [];
    this.canvas.push_layer();
    this.areas.push([this.edge, new Vector2(this.edge.v1), new Vector2(this.edge.v2), this.area]);
    var minmax=new MinMax(2);
    minmax.minmax(this.edge.v1, this.edge.v2);
    var areas=new set();
    var stop=false;
    var c=0;
    while (!stop) {
      stop = true;
      var __iter_area=__get_iter(this.parent.children);
      var area;
      while (1) {
        var __ival_area=__iter_area.next();
        if (__ival_area.done) {
            break;
        }
        area = __ival_area.value;
        if (!(__instance_of(area, ScreenArea)))
          continue;
        if (area===this.area)
          continue;
        for (var i=0; i<2; i++) {
            var e2=new AreaEdge(area, (this.bindex+i*2)%4);
            var margin=9;
            var isect=aabb_isect_minmax2d(minmax.min, minmax.max, e2.min, e2.max, margin);
            if (isect&&!areas.has(area)) {
                areas.add(area);
                this.areas.push([e2, new Vector2(e2.v1), new Vector2(e2.v2), area, new Vector2(area.size)]);
                minmax.minmax(e2.min);
                minmax.minmax(e2.max);
                stop = false;
            }
        }
      }
    }
    this.start_moving_line[0].load(minmax.min);
    this.start_moving_line[1].load(minmax.max);
    this.moving_line[0].load(this.start_moving_line[0]);
    this.moving_line[1].load(this.start_moving_line[1]);
    this.parent.push_modal(this);
    this.moving = true;
  }, function on_mouseup(event) {
    if (this.moving) {
        this.finish();
    }
    else {
      if (event.button==2) {
          this.border_menu(event);
      }
    }
  }, function find_bindex(pair) {
    var area=pair[0];
    var bs=this.parent.child_borders.get(area);
    if (area!=this.area)
      return pair[1];
    else 
      return this.bindex;
  }, function do_resize(delta) {
    if (isNaN(delta)) {
        console.trace("EEK! NaN in frame resize!\n", delta);
        return ;
    }
    var axis=(this.bindex+1)%2;
    var __iter_ed=__get_iter(this.areas);
    var ed;
    while (1) {
      var __ival_ed=__iter_ed.next();
      if (__ival_ed.done) {
          break;
      }
      ed = __ival_ed.value;
      ed[0].v1[axis] = ed[1][axis]+delta;
      ed[3].on_resize(ed[3].size, ed[4]);
      ed[3].do_full_recalc();
    }
    this.parent.snap_areas();
    window.redraw_viewport();
  }, function on_mousemove(event) {
    if (!this.moving)
      return ;
    var mpos=new Vector2([event.x, event.y]);
    var start=new Vector2(this.start_mpos);
    var axis=(this.bindex+1)%2;
    var delta=mpos[axis]-start[axis];
    this.moving_line[0].load(this.start_moving_line[0]);
    this.moving_line[1].load(this.start_moving_line[1]);
    this.moving_line[0][axis]+=delta;
    this.moving_line[1][axis]+=delta;
    this.delta = delta;
    var x=this.moving_line[0][0], y=this.moving_line[0][1];
    var sx=this.moving_line[1][0], sy=this.moving_line[1][1];
    if (sx-x>sy-y) {
        y = sy = (y+sy)*0.5;
    }
    else {
      x = sx = (x+sx)*0.5;
    }
    this.canvas.clear();
    this.canvas.line([x, y], [sx, sy], $black_d9jd_on_mousemove, $black_d9jd_on_mousemove);
  }, function finish() {
    if (this.moving) {
        this.canvas.pop_layer();
        this.parent.pop_modal();
        this.do_resize(this.delta);
    }
    this.parent.recalc_all_borders();
    this.parent.do_full_recalc();
    this.moving = false;
  }, function on_keydown(event) {
    if (this.moving) {
        if (event.keyCode==charmap["Escape"])
          this.finish();
        if (event.keyCode==charmap["Enter"])
          this.finish();
    }
  }, function on_active() {
    if (!this.movable_border())
      return ;
    var cursor;
    if (this.size[0]>this.size[1]) {
        cursor = "n-resize";
    }
    else {
      cursor = "w-resize";
    }
    document.getElementById("canvas2d").style.cursor = cursor;
    document.getElementById("canvas2d_work").style.cursor = cursor;
  }, function on_inactive() {
    document.getElementById("canvas2d").style.cursor = "default";
    document.getElementById("canvas2d_work").style.cursor = "default";
  }, function build_draw(canvas, isVertical) {
    var sx=this.edge.max[0]-this.edge.min[0];
    var sy=this.edge.max[1]-this.edge.min[1];
    if (this.moving)
      canvas.line(this.moving_line[0], this.moving_line[1], $black_L8L2_build_draw, $black_L8L2_build_draw);
  }]);
  var $black_d9jd_on_mousemove=[0, 0, 0, 1];
  var $black_L8L2_build_draw=[0, 0, 0, 1];
  _es6_module.add_class(ScreenBorder);
  ScreenBorder = _es6_module.add_export('ScreenBorder', ScreenBorder);
}, '/home/ec2-user/fairmotion/src/windowmanager/ScreenBorder.js');
