es6_module_define('spline_query', ["./spline_multires.js", "../editors/viewport/selectmode.js"], function _spline_query_module(_es6_module) {
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var has_multires=es6_import_item(_es6_module, './spline_multires.js', 'has_multires');
  var compose_id=es6_import_item(_es6_module, './spline_multires.js', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, './spline_multires.js', 'decompose_id');
  var MResFlags=es6_import_item(_es6_module, './spline_multires.js', 'MResFlags');
  var MultiResLayer=es6_import_item(_es6_module, './spline_multires.js', 'MultiResLayer');
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var sqrt=Math.sqrt;
  let findnearest_segment_tmp=new Vector2();
  var $_mpos_yK11_findnearest_vert;
  var $_v_hSr3_findnearest_vert;
  class SplineQuery  {
     constructor(spline) {
      this.spline = spline;
    }
     findnearest(editor, mpos, selectmask, limit, ignore_layers) {
      if (limit==undefined)
        limit = 15;
      var dis=1e+18;
      var data=undefined;
      if (selectmask&SelMask.VERTEX) {
          var ret=this.findnearest_vert(editor, mpos, limit, undefined, ignore_layers);
          if (ret!==undefined&&ret[1]<dis) {
              data = ret;
              dis = ret[1];
          }
      }
      if (selectmask&SelMask.HANDLE) {
          var ret=this.findnearest_vert(editor, mpos, limit, true, ignore_layers);
          if (ret!==undefined&&ret[1]<dis) {
              data = ret;
              dis = ret[1];
          }
      }
      if (selectmask&SelMask.SEGMENT) {
          var ret=this.findnearest_segment(editor, mpos, limit, ignore_layers);
          if (ret!==undefined&&ret[1]<dis) {
              data = ret;
              dis = ret[1];
          }
      }
      if (selectmask&SelMask.FACE) {
          mpos = [mpos[0], mpos[1]];
          mpos[0]+=editor.pos[0];
          mpos[1]+=editor.pos[1];
          var ret=this.findnearest_face(editor, mpos, limit, ignore_layers);
          if (ret!=undefined&&ret[1]<dis) {
              data = ret;
              dis = ret[1];
          }
      }
      return data;
    }
     findnearest_segment(editor, mpos, limit, ignore_layers) {
      var spline=this.spline;
      var actlayer=spline.layerset.active;
      var sret=undefined, mindis=limit;
      mpos = findnearest_segment_tmp.load(mpos);
      editor.unproject(mpos);
      for (var seg of spline.segments) {
          var ret=seg.closest_point(mpos, undefined, true);
          if (ret===undefined)
            continue;
          let s=ret[1];
          ret = ret[0];
          if (seg.hidden||seg.v1.hidden||seg.v2.hidden)
            continue;
          if (!ignore_layers&&!seg.in_layer(actlayer))
            continue;
          var dis=sqrt((ret[0]-mpos[0])*(ret[0]-mpos[0])+(ret[1]-mpos[1])*(ret[1]-mpos[1]));
          let width=seg.width(s)*0.5;
          dis = Math.max(dis-width, 0.0);
          if (dis<mindis) {
              sret = seg;
              mindis = dis;
          }
      }
      if (sret!==undefined)
        return [sret, mindis, SelMask.SEGMENT];
    }
     findnearest_face(editor, mpos, limit, ignore_layers) {
      var spline=this.spline;
      var actlayer=spline.layerset.active;
      var g=spline.canvas;
      var dis=0, closest=undefined;
      if (g==undefined)
        return ;
      for (var i=0; i<spline.faces.length; i++) {
          var f=spline.faces[i];
          if ((!ignore_layers&&!f.in_layer(actlayer))||f.hidden)
            continue;
          spline.trace_face(g, f);
          if (g.isPointInPath(mpos[0], window.innerHeight-mpos[1])) {
              closest = f;
          }
      }
      g.beginPath();
      if (closest!=undefined)
        return [closest, dis, SelMask.FACE];
    }
     findnearest_vert(editor, mpos, limit, do_handles, ignore_layers) {
      var spline=this.spline;
      var actlayer=spline.layerset.active;
      if (limit==undefined)
        limit = 15;
      var min=1e+17;
      var ret=undefined;
      mpos = $_mpos_yK11_findnearest_vert.load(mpos);
      mpos[2] = 0.0;
      var list=do_handles ? spline.handles : spline.verts;
      for (var v of list) {
          if (v.hidden)
            continue;
          if (!ignore_layers&&!v.in_layer(actlayer))
            continue;
          var co=v;
          $_v_hSr3_findnearest_vert.load(co);
          $_v_hSr3_findnearest_vert[2] = 0.0;
          editor.project($_v_hSr3_findnearest_vert);
          var dis=$_v_hSr3_findnearest_vert.vectorDistance(mpos);
          if (dis<limit&&dis<min) {
              min = dis;
              ret = v;
          }
      }
      if (ret!=undefined) {
          return [ret, min, do_handles ? SelMask.HANDLE : SelMask.VERTEX];
      }
    }
  }
  var $_mpos_yK11_findnearest_vert=new Vector3();
  var $_v_hSr3_findnearest_vert=new Vector3();
  _ESClass.register(SplineQuery);
  _es6_module.add_class(SplineQuery);
  SplineQuery = _es6_module.add_export('SplineQuery', SplineQuery);
}, '/dev/fairmotion/src/curve/spline_query.js');
es6_module_define('spline_draw', ["../config/config.js", "./spline_draw_sort", "./spline_types.js", "./spline_draw_new.js", "../core/animdata.js", "./spline_math.js", "../editors/viewport/selectmode.js", "../util/mathlib.js", "../editors/viewport/view2d_editor.js", "./spline_element_array.js", "../util/vectormath.js", "./spline_draw_sort.js"], function _spline_draw_module(_es6_module) {
  var aabb_isect_minmax2d=es6_import_item(_es6_module, '../util/mathlib.js', 'aabb_isect_minmax2d');
  var ENABLE_MULTIRES=es6_import_item(_es6_module, '../config/config.js', 'ENABLE_MULTIRES');
  var SessionFlags=es6_import_item(_es6_module, '../editors/viewport/view2d_editor.js', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var ORDER=es6_import_item(_es6_module, './spline_math.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, './spline_math.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, './spline_math.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, './spline_math.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, './spline_math.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, './spline_math.js', 'INT_STEPS');
  var get_vtime=es6_import_item(_es6_module, '../core/animdata.js', 'get_vtime');
  var spline_draw_cache_vs=cachering.fromConstructor(Vector3, 64);
  var spline_draw_trans_vs=cachering.fromConstructor(Vector3, 32);
  var PI=Math.PI;
  var pow=Math.pow, cos=Math.cos, sin=Math.sin, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, sqrt=Math.sqrt, log=Math.log, acos=Math.acos, asin=Math.asin;
  var DRAW_MAXCURVELEN=10000;
  DRAW_MAXCURVELEN = _es6_module.add_export('DRAW_MAXCURVELEN', DRAW_MAXCURVELEN);
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, './spline_types.js', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, './spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, './spline_types.js', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, './spline_types.js', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, './spline_types.js', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, './spline_types.js', 'SplineFace');
  var RecalcFlags=es6_import_item(_es6_module, './spline_types.js', 'RecalcFlags');
  var MaterialFlags=es6_import_item(_es6_module, './spline_types.js', 'MaterialFlags');
  var ElementArray=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArray');
  var SplineLayerFlags=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayerFlags');
  var ColorFlags={SELECT: 1, 
   ACTIVE: 2, 
   HIGHLIGHT: 4}
  ColorFlags = _es6_module.add_export('ColorFlags', ColorFlags);
  var FlagMap={UNSELECT: 0, 
   SELECT: ColorFlags.SELECT, 
   ACTIVE: ColorFlags.ACTIVE, 
   HIGHLIGHT: ColorFlags.HIGHLIGHT, 
   SELECT_ACTIVE: ColorFlags.SELECT|ColorFlags.ACTIVE, 
   SELECT_HIGHLIGHT: ColorFlags.SELECT|ColorFlags.HIGHLIGHT, 
   HIGHLIGHT_ACTIVE: ColorFlags.HIGHLIGHT|ColorFlags.ACTIVE, 
   SELECT_HIGHLIGHT_ACTIVE: ColorFlags.SELECT|ColorFlags.ACTIVE|ColorFlags.HIGHLIGHT}
  FlagMap = _es6_module.add_export('FlagMap', FlagMap);
  function mix(a, b, t) {
    var ret=[0, 0, 0];
    for (var i=0; i<3; i++) {
        ret[i] = a[i]+(b[i]-a[i])*t;
    }
    return ret;
  }
  var ElementColor={UNSELECT: [1, 0.133, 0.07], 
   SELECT: [1, 0.6, 0.26], 
   HIGHLIGHT: [1, 0.93, 0.4], 
   ACTIVE: [0.3, 0.4, 1.0], 
   SELECT_ACTIVE: mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7), 
   SELECT_HIGHLIGHT: [1, 1, 0.8], 
   HIGHLIGHT_ACTIVE: mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5), 
   SELECT_HIGHLIGHT_ACTIVE: [0.85, 0.85, 1.0]}
  ElementColor = _es6_module.add_export('ElementColor', ElementColor);
  var HandleColor={UNSELECT: [0.2, 0.7, 0.07], 
   SELECT: [0.1, 1, 0.26], 
   HIGHLIGHT: [0.2, 0.93, 0.4], 
   ACTIVE: [0.1, 1, 0.75], 
   SELECT_ACTIVE: mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7), 
   SELECT_HIGHLIGHT: [1, 1, 0.8], 
   HIGHLIGHT_ACTIVE: mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5), 
   SELECT_HIGHLIGHT_ACTIVE: [0.85, 0.85, 1.0]}
  HandleColor = _es6_module.add_export('HandleColor', HandleColor);
  HandleColor.SELECT_ACTIVE = mix(HandleColor.SELECT, HandleColor.ACTIVE, 0.5);
  HandleColor.SELECT_HIGHLIGHT = mix(HandleColor.SELECT, HandleColor.HIGHLIGHT, 0.5);
  HandleColor.HIGHLIGHT_ACTIVE = mix(HandleColor.HIGHLIGHT, HandleColor.ACTIVE, 0.5);
  HandleColor.SELECT_HIGHLIGHT_ACTIVE = mix(mix(HandleColor.SELECT, HandleColor.ACTIVE, 0.5), HandleColor.HIGHLIGHT, 0.5);
  function rgb2css(color) {
    var r=color[0], g=color[1], b=color[2];
    return "rgb("+(~~(r*255))+","+(~~(g*255))+","+(~~(b*255))+")";
  }
  var element_colormap=new Array(8);
  element_colormap = _es6_module.add_export('element_colormap', element_colormap);
  for (var k in ElementColor) {
      var f=FlagMap[k];
      element_colormap[f] = rgb2css(ElementColor[k]);
  }
  var handle_colormap=new Array(8);
  handle_colormap = _es6_module.add_export('handle_colormap', handle_colormap);
  for (var k in HandleColor) {
      var f=FlagMap[k];
      handle_colormap[f] = rgb2css(HandleColor[k]);
  }
  function get_element_flag(e, list) {
    var f=0;
    f|=e.flag&SplineFlags.SELECT ? ColorFlags.SELECT : 0;
    f|=e===list.highlight ? ColorFlags.HIGHLIGHT : 0;
    f|=e===list.active ? ColorFlags.ACTIVE : 0;
    return f;
  }
  function get_element_color(e, list) {
    if (e.type==SplineTypes.HANDLE)
      return handle_colormap[get_element_flag(e, list)];
    else 
      return element_colormap[get_element_flag(e, list)];
  }
  get_element_color = _es6_module.add_export('get_element_color', get_element_color);
  var VERT_SIZE=3.0;
  var SMALL_VERT_SIZE=1.0;
  var SplineDrawer=es6_import_item(_es6_module, './spline_draw_new.js', 'SplineDrawer');
  var redo_draw_sort=es6_import_item(_es6_module, './spline_draw_sort.js', 'redo_draw_sort');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var ___spline_draw_sort=es6_import(_es6_module, './spline_draw_sort');
  for (let k in ___spline_draw_sort) {
      _es6_module.add_export(k, ___spline_draw_sort[k], true);
  }
  function draw_curve_normals(spline, g, zoom) {
    for (var seg of spline.segments) {
        if (seg.v1.hidden||seg.v2.hidden)
          continue;
        var length=seg.ks[KSCALE];
        if (length<=0||isNaN(length))
          continue;
        if (length>DRAW_MAXCURVELEN)
          length = DRAW_MAXCURVELEN;
        var ls=0.0, dls=5/zoom;
        for (var ls=0; ls<length; ls+=dls) {
            var s=ls/length;
            if (s>1.0)
              continue;
            var co=seg.evaluate(s);
            var n=seg.normal(s).normalize();
            var k=seg.curvature(s);
            n.mulScalar(k*(window._d!=undefined ? window._d : 1000)/zoom);
            g.lineWidth = 1;
            g.strokeColor = "%2233bb";
            g.beginPath();
            g.moveTo(co[0], co[1]);
            g.lineTo(co[0]+n[0], co[1]+n[1]);
            g.stroke();
        }
    }
  }
  draw_curve_normals = _es6_module.add_export('draw_curve_normals', draw_curve_normals);
  function draw_spline(spline, redraw_rects, g, editor, matrix, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers) {
    spline.canvas = g;
    if (spline.drawlist===undefined||(spline.recalc&RecalcFlags.DRAWSORT)) {
        redo_draw_sort(spline);
    }
    if (spline.drawer===undefined) {
        spline.drawer = new SplineDrawer(spline);
    }
    var zoom=editor.zoom;
    zoom = matrix.m11;
    if (isNaN(zoom)) {
        zoom = 1.0;
    }
    spline.drawer.update(spline, spline.drawlist, spline.draw_layerlist, matrix, redraw_rects, only_render, selectmode, g, zoom, editor, ignore_layers);
    let promise=spline.drawer.draw(editor.drawg);
    var actlayer=spline.layerset.active;
    if (!only_render&&draw_normals)
      draw_curve_normals(spline, g, zoom);
    let r=[[0, 0], [0, 0]];
    for (var s of spline.segments) {
        s.flag&=~SplineFlags.DRAW_TEMP;
    }
    for (var f of spline.faces) {
        f.flag&=~SplineFlags.DRAW_TEMP;
    }
    var vert_size=editor.draw_small_verts ? SMALL_VERT_SIZE : VERT_SIZE;
    if (only_render)
      return promise;
    let tmp1=new Vector2();
    let tmp2=new Vector2();
    g.beginPath();
    if (selectmode&SelMask.HANDLE) {
        var w=vert_size*g.canvas.dpi_scale/zoom;
        for (var i=0; i<spline.handles.length; i++) {
            var v=spline.handles[i];
            var clr=get_element_color(v, spline.handles);
            if (!ignore_layers&&!v.owning_segment.in_layer(actlayer))
              continue;
            if (v.owning_segment!=undefined&&v.owning_segment.flag&SplineFlags.HIDE)
              continue;
            if (v.owning_vertex!=undefined&&v.owning_vertex.flag&SplineFlags.HIDE)
              continue;
            if (!v.use)
              continue;
            if ((v.flag&SplineFlags.AUTO_PAIRED_HANDLE)&&v.hpair!==undefined&&(v.segments.length>2)) {
                continue;
            }
            if (v.flag&SplineFlags.HIDE)
              continue;
            tmp1.load(v).multVecMatrix(matrix);
            g.beginPath();
            if (clr!==last_clr)
              g.fillStyle = clr;
            last_clr = clr;
            g.rect(tmp1[0]-w, tmp1[1]-w, w*2, w*2);
            g.fill();
            g.beginPath();
            g.lineWidth = 1;
            var ov=v.owning_segment.handle_vertex(v);
            tmp2.load(ov).multVecMatrix(matrix);
            g.moveTo(tmp1[0], tmp1[1]);
            g.lineTo(tmp2[0], tmp2[1]);
            g.stroke();
        }
    }
    var last_clr=undefined;
    if (selectmode&SelMask.VERTEX) {
        var w=vert_size*g.canvas.dpi_scale/zoom;
        for (var i=0; i<spline.verts.length; i++) {
            var v=spline.verts[i];
            var clr=get_element_color(v, spline.verts);
            if (!ignore_layers&&!v.in_layer(actlayer))
              continue;
            if (v.flag&SplineFlags.HIDE)
              continue;
            var co=tmp1.load(v);
            co.multVecMatrix(matrix);
            if (draw_time_helpers) {
                var time=get_vtime(v);
                if (curtime==time) {
                    g.beginPath();
                    g.fillStyle = "#33ffaa";
                    g.rect(co[0]-w*2, co[1]-w*2, w*4, w*4);
                    g.fill();
                    g.fillStyle = clr;
                }
            }
            g.beginPath();
            if (clr!==last_clr)
              g.fillStyle = clr;
            last_clr = clr;
            g.rect(co[0]-w, co[1]-w, w*2, w*2);
            g.fill();
        }
    }
    if (spline.transforming&&spline.proportional) {
        g.beginPath();
        g.arc(spline.trans_cent[0], spline.trans_cent[1], spline.prop_radius, -PI, PI);
        g.stroke();
    }
    return promise;
  }
  draw_spline = _es6_module.add_export('draw_spline', draw_spline);
  var $margin_5Qfv_redraw_element=new Vector3([15, 15, 15]);
  var $aabb_WdB1_redraw_element=[new Vector3(), new Vector3()];
  function redraw_element(e, view2d) {
    e.flag|=SplineFlags.REDRAW;
    $margin_5Qfv_redraw_element[0] = $margin_5Qfv_redraw_element[1] = $margin_5Qfv_redraw_element[2] = 15.0;
    if (view2d!=undefined)
      $margin_5Qfv_redraw_element.mulScalar(1.0/view2d.zoom);
    var e_aabb=e.aabb;
    $aabb_WdB1_redraw_element[0].load(e_aabb[0]), $aabb_WdB1_redraw_element[1].load(e_aabb[1]);
    $aabb_WdB1_redraw_element[0].sub($margin_5Qfv_redraw_element), $aabb_WdB1_redraw_element[1].add($margin_5Qfv_redraw_element);
    window.redraw_viewport($aabb_WdB1_redraw_element[0], $aabb_WdB1_redraw_element[1]);
  }
  redraw_element = _es6_module.add_export('redraw_element', redraw_element);
}, '/dev/fairmotion/src/curve/spline_draw.js');
es6_module_define('spline_draw_sort', ["../core/animdata.js", "./spline_multires.js", "./spline_types.js", "./spline_math.js", "./spline_element_array.js", "../config/config.js", "../editors/viewport/selectmode.js", "../editors/viewport/view2d_editor.js", "../util/mathlib.js"], function _spline_draw_sort_module(_es6_module) {
  var aabb_isect_minmax2d=es6_import_item(_es6_module, '../util/mathlib.js', 'aabb_isect_minmax2d');
  var ENABLE_MULTIRES=es6_import_item(_es6_module, '../config/config.js', 'ENABLE_MULTIRES');
  var SessionFlags=es6_import_item(_es6_module, '../editors/viewport/view2d_editor.js', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var ORDER=es6_import_item(_es6_module, './spline_math.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, './spline_math.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, './spline_math.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, './spline_math.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, './spline_math.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, './spline_math.js', 'INT_STEPS');
  var get_vtime=es6_import_item(_es6_module, '../core/animdata.js', 'get_vtime');
  var iterpoints=es6_import_item(_es6_module, './spline_multires.js', 'iterpoints');
  var MultiResLayer=es6_import_item(_es6_module, './spline_multires.js', 'MultiResLayer');
  var MResFlags=es6_import_item(_es6_module, './spline_multires.js', 'MResFlags');
  var has_multires=es6_import_item(_es6_module, './spline_multires.js', 'has_multires');
  var spline_draw_cache_vs=cachering.fromConstructor(Vector3, 64);
  var spline_draw_trans_vs=cachering.fromConstructor(Vector3, 32);
  var PI=Math.PI;
  var pow=Math.pow, cos=Math.cos, sin=Math.sin, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, sqrt=Math.sqrt, log=Math.log, acos=Math.acos, asin=Math.asin;
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, './spline_types.js', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, './spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, './spline_types.js', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, './spline_types.js', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, './spline_types.js', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, './spline_types.js', 'SplineFace');
  var RecalcFlags=es6_import_item(_es6_module, './spline_types.js', 'RecalcFlags');
  var MaterialFlags=es6_import_item(_es6_module, './spline_types.js', 'MaterialFlags');
  var ElementArray=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArray');
  var SplineLayerFlags=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayerFlags');
  function calc_string_ids(spline, startid) {
    if (startid===undefined) {
        startid = 0;
    }
    for (let group of spline.drawStrokeGroups) {
        for (let seg of group.segments) {
            seg.stringid = startid+seg.id;
        }
    }
  }
  calc_string_ids = _es6_module.add_export('calc_string_ids', calc_string_ids);
  var $lists_uHBD_sort_layer_segments=new cachering(function () {
    return [];
  }, 2);
  function sort_layer_segments(layer, spline) {
    var list=$lists_uHBD_sort_layer_segments.next();
    list.length = 0;
    var visit={}
    var layerid=layer.id;
    var topogroup_idgen=0;
    function recurse(seg) {
      if (seg.eid in visit) {
          return ;
      }
      visit[seg.eid] = 1;
      seg.topoid = topogroup_idgen;
      for (var i=0; i<2; i++) {
          var v=i ? seg.v2 : seg.v1;
          if (v.segments.length!=2)
            continue;
          for (var j=0; j<v.segments.length; j++) {
              var s2=v.segments[j];
              if (!(s2.eid in visit)) {
                  recurse(s2);
              }
          }
      }
      if (!s.hidden||(s.flag&SplineFlags.GHOST))
        list.push(seg);
    }
    if (1) {
        for (var s of layer) {
            if (s.type!==SplineTypes.SEGMENT)
              continue;
            if (!(layerid in s.layers))
              continue;
            if (s.v1.segments.length===2&&s.v2.segments.length===2)
              continue;
            if (!(s.eid in visit)) {
                topogroup_idgen++;
                recurse(s);
            }
        }
        for (var s of layer) {
            if (s.type!==SplineTypes.SEGMENT)
              continue;
            if (!(layerid in s.layers))
              continue;
            if (!(s.eid in visit)) {
                topogroup_idgen++;
                recurse(s);
            }
        }
    }
    return list;
  }
  sort_layer_segments = _es6_module.add_export('sort_layer_segments', sort_layer_segments);
  function redo_draw_sort(spline) {
    spline.redoSegGroups();
    var min_z=100000000000000.0;
    var max_z=-100000000000000.0;
    var layerset=spline.layerset;
    console.log("start sort");
    var time=time_ms();
    let gmap=new Map();
    let gsmap=new Map();
    let gi=0;
    let gmaxz=new Map();
    for (let g of spline.drawStrokeGroups) {
        let maxz=-1e+17;
        for (let seg of g.segments) {
            gsmap.set(seg, g);
            gmap.set(seg, gi);
            maxz = Math.max(maxz, seg.z);
        }
        for (let seg of g.segments) {
            gmaxz.set(seg, maxz);
        }
        gmap.set(g, gi);
        gi++;
    }
    for (var f of spline.faces) {
        if (f.hidden&&!(f.flag&SplineFlags.GHOST))
          continue;
        if (isNaN(f.z))
          f.z = 0;
        max_z = Math.max(max_z, f.z+1);
        min_z = Math.min(min_z, f.z);
    }
    for (var s of spline.segments) {
        if (s.hidden&&!(s.flag&SplineFlags.GHOST))
          continue;
        if (isNaN(s.z))
          s.z = 0;
        max_z = Math.max(max_z, s.z+2);
        min_z = Math.min(min_z, s.z);
    }
    function calc_z(e, check_face) {
      if (isNaN(e.z)) {
          e.z = 0;
      }
      if (check_face&&e.type===SplineTypes.SEGMENT&&e.l!==undefined) {
          let l=e.l;
          let _i=0;
          let f_max_z=calc_z(e, true);
          do {
            if (_i++>1000) {
                console.trace("infinite loop!");
                break;
            }
            var fz=calc_z(l.f);
            f_max_z = f_max_z===undefined ? fz : Math.max(f_max_z, fz);
            l = l.radial_next;
          } while (l!==e.l);
          
          return f_max_z+1;
      }
      var layer=0;
      for (var k in e.layers) {
          layer = k;
          break;
      }
      if (!(layer in layerset.idmap)) {
          console.log("Bad layer!", layer);
          return -1;
      }
      let z=gmaxz.get(e)||e.z;
      layer = layerset.idmap[layer];
      return layer.order*(max_z-min_z)+(z-min_z);
    }
    function get_layer(e) {
      for (var k in e.layers) {
          return k;
      }
      return undefined;
    }
    var dl=spline.drawlist = [];
    var ll=spline.draw_layerlist = [];
    spline._layer_maxz = max_z;
    for (var f of spline.faces) {
        f.finalz = -1;
        if (f.hidden&&!(f.flag&SplineFlags.GHOST))
          continue;
        dl.push(f);
    }
    var visit={}
    for (var i=0; i<spline.layerset.length; i++) {
        var layer=spline.layerset[i];
        var elist=sort_layer_segments(layer, spline);
        for (var j=0; j<elist.length; j++) {
            var s=elist[j];
            if (!(s.eid in visit))
              dl.push(elist[j]);
            visit[s.eid] = 1;
        }
    }
    for (var s of spline.segments) {
        s.finalz = -1;
        if (s.hidden&&!(s.flag&SplineFlags.GHOST))
          continue;
        if (!(s.eid in visit)) {
            dl.push(s);
        }
    }
    var zs={}
    for (var e of dl) {
        zs[e.eid] = calc_z(e);
    }
    if (!spline.is_anim_path) {
        dl.sort(function (a, b) {
          return zs[a.eid]-zs[b.eid];
        });
    }
    for (var i=0; i<dl.length; i++) {
        var lk=undefined;
        for (var k in dl[i].layers) {
            lk = k;
            break;
        }
        ll.push(lk);
    }
    let visit2=new Set();
    let list2=[];
    for (let item of spline.drawlist) {
        if (item.type===SplineTypes.SEGMENT) {
            let g=gsmap.get(item);
            if (visit2.has(g))
              continue;
            visit2.add(g);
            list2.push(g);
            for (let seg of g.segments) {
                for (let i=0; i<2; i++) {
                    let v=i ? seg.v2 : seg.v1;
                    if (v.segments.length>2&&!visit2.has(v)) {
                        visit2.add(v);
                        list2.push(v);
                    }
                }
            }
        }
        else {
          list2.push(item);
        }
        spline.drawlist = list2;
    }
    for (var i=0; i<spline.drawlist.length; i++) {
        if (spline.drawlist[i]===undefined) {
            let j=i;
            console.warn("corrupted drawlist; fixing...");
            while (j<spline.drawlist.length) {
              spline.drawlist[j] = spline.drawlist[j+1];
              j++;
            }
            spline.drawlist.length--;
            i--;
        }
        spline.drawlist[i].finalz = i;
    }
    calc_string_ids(spline, spline.segments.length);
    spline.recalc&=~RecalcFlags.DRAWSORT;
    console.log("time taken:"+(time_ms()-time).toFixed(2)+"ms");
  }
  redo_draw_sort = _es6_module.add_export('redo_draw_sort', redo_draw_sort);
}, '/dev/fairmotion/src/curve/spline_draw_sort.js');
es6_module_define('spline', ["../editors/viewport/selectmode.js", "./spline_math.js", "../path.ux/scripts/config/const.js", "./solver_new.js", "./spline_query.js", "./spline_draw.js", "../core/struct.js", "./spline_strokegroup.js", "../editors/viewport/view2d_editor.js", "../core/eventdag.js", "../config/config.js", "./solver.js", "./spline_types.js", "../core/toolops_api.js", "./spline_multires.js", "../wasm/native_api.js", "../core/lib_api.js", "./spline_element_array.js"], function _spline_module(_es6_module) {
  "use strict";
  const MMLEN=8;
  const UARR=Uint16Array;
  const UMAX=((1<<16)-1);
  const UMUL=2;
  const PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var spline_multires=es6_import(_es6_module, './spline_multires.js');
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, '../core/lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, '../core/lib_api.js', 'DataTypes');
  var SessionFlags=es6_import_item(_es6_module, '../editors/viewport/view2d_editor.js', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var SplineQuery=es6_import_item(_es6_module, './spline_query.js', 'SplineQuery');
  var draw_spline=es6_import_item(_es6_module, './spline_draw.js', 'draw_spline');
  var solve=es6_import_item(_es6_module, './solver_new.js', 'solve');
  var ModalStates=es6_import_item(_es6_module, '../core/toolops_api.js', 'ModalStates');
  var DataPathNode=es6_import_item(_es6_module, '../core/eventdag.js', 'DataPathNode');
  var config=es6_import(_es6_module, '../config/config.js');
  const FEPS=1e-18;
  const SPI2=Math.sqrt(PI/2);
  var _SOLVING=false;
  _SOLVING = _es6_module.add_export('_SOLVING', _SOLVING);
  var INCREMENTAL=1;
  INCREMENTAL = _es6_module.add_export('INCREMENTAL', INCREMENTAL);
  var ORDER=es6_import_item(_es6_module, './spline_math.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, './spline_math.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, './spline_math.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, './spline_math.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, './spline_math.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, './spline_math.js', 'INT_STEPS');
  var solver=es6_import_item(_es6_module, './solver.js', 'solver');
  var constraint=es6_import_item(_es6_module, './solver.js', 'constraint');
  es6_import(_es6_module, '../path.ux/scripts/config/const.js');
  var native_api=es6_import(_es6_module, '../wasm/native_api.js');
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, './spline_types.js', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, './spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, './spline_types.js', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, './spline_types.js', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, './spline_types.js', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, './spline_types.js', 'SplineFace');
  var ElementArraySet=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArraySet');
  var ElementArray=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArray');
  var SplineLayer=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayer');
  var SplineLayerSet=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayerSet');
  let _internal_idgen=0;
  var rect_tmp=[new Vector2(), new Vector2()];
  var eval_curve=es6_import_item(_es6_module, './spline_math.js', 'eval_curve');
  var do_solve=es6_import_item(_es6_module, './spline_math.js', 'do_solve');
  var RestrictFlags={NO_EXTRUDE: 1, 
   NO_DELETE: 2, 
   NO_CONNECT: 4, 
   NO_DISSOLVE: 8, 
   NO_SPLIT_EDGE: 16, 
   VALENCE2: 32, 
   NO_CREATE: 64|1|4|16}
  RestrictFlags = _es6_module.add_export('RestrictFlags', RestrictFlags);
  function dom_bind(obj, name, dom_id) {
    Object.defineProperty(obj, name, {get: function () {
        var check=document.getElementById(dom_id);
        return check.checked;
      }, 
    set: function (val) {
        var check=document.getElementById(dom_id);
        check.checked = !!val;
      }});
  }
  var split_edge_rets=new cachering(function () {
    return [0, 0, 0];
  }, 64);
  var _elist_map={"verts": SplineTypes.VERTEX, 
   "handles": SplineTypes.HANDLE, 
   "segments": SplineTypes.SEGMENT, 
   "faces": SplineTypes.FACE}
  class AllPointsIter  {
    
    
     constructor(spline) {
      this.spline = spline;
      this.stage = 0;
      this.iter = spline.verts[Symbol.iterator]();
      this.ret = {done: false, 
     value: undefined};
    }
     [Symbol.iterator]() {
      return this;
    }
     next() {
      var ret=this.iter.next();
      this.ret.done = ret.done;
      this.ret.value = ret.value;
      if (ret.done&&this.stage==0) {
          this.stage = 1;
          this.iter = this.spline.handles[Symbol.iterator]();
          return this.next();
      }
      return this.ret;
    }
  }
  _ESClass.register(AllPointsIter);
  _es6_module.add_class(AllPointsIter);
  AllPointsIter = _es6_module.add_export('AllPointsIter', AllPointsIter);
  var RecalcFlags=es6_import_item(_es6_module, './spline_types.js', 'RecalcFlags');
  let debug_id_gen=0;
  let _se_ws=[0.5, 0.5];
  let _se_srcs=[0, 0];
  let _trace_face_lastco=new Vector3();
  class Spline extends DataBlock {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
     constructor(name=undefined) {
      super(DataTypes.SPLINE, name);
      this.updateGen = 0;
      this.strokeGroups = [];
      this._strokeGroupMap = new Map();
      this.drawStrokeGroups = [];
      this._drawStrokeGroupMap = new Map();
      this._vert_add_set = new set();
      this._vert_rem_set = new set();
      this._vert_time_set = new set();
      this._debug_id = debug_id_gen++;
      this._pending_solve = undefined;
      this._resolve_after = undefined;
      this.solving = undefined;
      this.actlevel = 0;
      var mformat=spline_multires._format;
      this.mres_format = new Array(mformat.length);
      for (var i=0; i<mformat.length; i++) {
          this.mres_format[i] = mformat[i];
      }
      this._internal_id = _internal_idgen++;
      this.drawlist = [];
      this.recalc = RecalcFlags.DRAWSORT;
      this.size = [0, 0];
      this.restrict = 0;
      this.canvas = undefined;
      this.query = this.q = new SplineQuery(this);
      this.frame = 0;
      this.rendermat = new Matrix4();
      this.last_sim_ms = time_ms();
      this.segments = [];
      this.handles = [];
      this._idgen = new SDIDGen();
      this.last_save_time = time_ms();
      this.proportional = false;
      this.prop_radius = 100;
      this.eidmap = {};
      this.elist_map = {};
      this.elists = [];
      this.selectmode = 1;
      this.layerset = new SplineLayerSet();
      this.layerset.new_layer();
      this.selected = new ElementArraySet();
      this.selected.layerset = this.layerset;
      this.draw_verts = true;
      this.draw_normals = true;
      this.init_elists();
    }
     dag_get_datapath() {
      if (this.is_anim_path||(this.verts.cdata.layers.length>0&&this.verts.cdata.layers[0].name==="TimeDataLayer"))
        return "frameset.pathspline";
      else 
        return "frameset.drawspline";
    }
     force_full_resolve() {
      this.resolve = 1;
      for (var seg of this.segments) {
          seg.flag|=SplineFlags.UPDATE;
      }
      for (var v of this.verts) {
          v.flag|=SplineFlags.UPDATE;
      }
      for (var h of this.handles) {
          h.flag|=SplineFlags.UPDATE;
      }
    }
     regen_sort() {
      this.updateGen++;
      this.recalc|=RecalcFlags.DRAWSORT;
    }
     regen_solve() {
      this.resolve = 1;
      this.updateGen++;
      this.recalc|=RecalcFlags.SOLVE;
    }
     regen_render() {
      this.resolve = 1;
      this.updateGen++;
      this.recalc|=RecalcFlags.ALL;
    }
     init_elists() {
      this.elist_map = {};
      this.elists = [];
      for (var k in _elist_map) {
          var type=_elist_map[k];
          var list=new ElementArray(type, this.idgen, this.eidmap, this.selected, this.layerset, this);
          this[k] = list;
          this.elist_map[type] = list;
          this.elists.push(list);
      }
      this.init_sel_handlers();
    }
     init_sel_handlers() {
      var this2=this;
      this.verts.on_select = function (v, state) {
        for (var i=0; i<v.segments.length; i++) {
            var seg=v.segments[i];
            this2.handles.setselect(seg.handle(v), state);
        }
      };
    }
    get  idgen() {
      return this._idgen;
    }
    set  idgen(idgen) {
      this._idgen = idgen;
      if (this.elists==undefined) {
          return ;
      }
      for (var i=0; i<this.elists.length; i++) {
          this.elists[i].idgen = idgen;
      }
    }
     copy() {
      var ret=new Spline();
      ret.idgen = this.idgen.copy();
      ret.layerset = this.layerset.copyStructure();
      for (var i=0; i<ret.elists.length; i++) {
          ret.elists[i].idgen = ret.idgen;
          ret.elists[i].cdata.load_layout(this.elists[i].cdata);
      }
      var eidmap=ret.eidmap;
      for (let si=0; si<2; si++) {
          var list1=si ? this.handles : this.verts;
          var list2=si ? ret.handles : ret.verts;
          for (let i=0; i<list1.length; i++) {
              var v=list1[i];
              var v2=new SplineVertex(v);
              if (si===1) {
                  v2.type = SplineTypes.HANDLE;
              }
              v2.load(v);
              v2.flag = v.flag;
              v2.eid = v.eid;
              list2.push(v2, v2.eid, false);
              for (let layeri in v.layers) {
                  ret.layerset.idmap[layeri].add(v2);
              }
              if (si===1) {
                  ret.copy_handle_data(v2, v);
              }
              else {
                ret.copy_vert_data(v2, v);
              }
              eidmap[v.eid] = v2;
              if (v===list1.active)
                list2.active = v2;
          }
      }
      for (let i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          var s2=new SplineSegment();
          s2.eid = s.eid;
          s2.flag = s.flag;
          ret.segments.push(s2);
          eidmap[s2.eid] = s2;
          if (s===this.segments.active)
            ret.segments.active = s;
          s2.h1 = eidmap[s.h1.eid];
          s2.h2 = eidmap[s.h2.eid];
          s2.h1.segments.push(s2);
          s2.h2.segments.push(s2);
          s2.v1 = eidmap[s.v1.eid];
          s2.v2 = eidmap[s.v2.eid];
          s2.v1.segments.push(s2);
          s2.v2.segments.push(s2);
          for (var j=0; j<s.ks.length; j++) {
              s2.ks[j] = s.ks[j];
          }
          if (s.h1.hpair!==undefined)
            s2.h1.hpair = eidmap[s.h1.hpair.eid];
          if (s.h2.hpair!==undefined)
            s2.h2.hpair = eidmap[s.h2.hpair.eid];
          ret.copy_segment_data(s2, s);
          for (let layeri in s.layers) {
              ret.layerset.idmap[layeri].add(s2);
          }
      }
      for (var i=0; i<this.faces.length; i++) {
          var f=this.faces[i];
          var vlists=[];
          for (var list of f.paths) {
              var verts=[];
              vlists.push(verts);
              var l=list.l;
              do {
                verts.push(eidmap[l.v.eid]);
                l = l.next;
              } while (l!=list.l);
              
          }
          var f2=ret.make_face(vlists, f.eid);
          ret.copy_face_data(f2, f);
          eidmap[f2.eid] = f2;
          if (f==this.faces.active)
            ret.faces.active = f2;
          for (let layeri in f.layers) {
              ret.layerset.idmap[layeri].add(f2);
          }
      }
      return ret;
    }
     copy_element_data(dst, src) {
      if (dst.flag&SplineFlags.SELECT) {
          this.setselect(dst, false);
      }
      dst.cdata.copy(src.cdata);
      dst.flag = src.flag;
      if (dst.flag&SplineFlags.SELECT) {
          dst.flag&=~SplineFlags.SELECT;
          this.setselect(dst, true);
      }
    }
     copy_vert_data(dst, src) {
      this.copy_element_data(dst, src);
    }
     copy_handle_data(dst, src) {
      this.copy_element_data(dst, src);
    }
     copy_segment_data(dst, src) {
      this.copy_element_data(dst, src);
      dst.z = src.z;
      dst.w1 = src.w1;
      dst.w2 = src.w2;
      dst.shift1 = src.shift1;
      dst.shift2 = src.shift2;
      dst.mat.load(src.mat);
    }
     copy_face_data(dst, src) {
      this.copy_element_data(dst, src);
      dst.z = src.z;
      dst.mat.load(src.mat);
    }
    get  points() {
      return new AllPointsIter(this);
    }
     make_vertex(co, eid=undefined) {
      var v=new SplineVertex(co);
      v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      this.verts.push(v, eid);
      this._vert_add_set.add(v.eid);
      this.dag_update("on_vert_add", this._vert_add_set);
      this.dag_update("on_vert_change");
      return v;
    }
     get_elist(type) {
      return this.elist_map[type];
    }
     make_handle(co, __eid=undefined) {
      var h=new SplineVertex();
      h.flag|=SplineFlags.BREAK_TANGENTS;
      h.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      h.type = SplineTypes.HANDLE;
      this.handles.push(h, __eid);
      return h;
    }
     split_edge(seg, s=0.5) {
      var co=seg.evaluate(s);
      let ws=_se_ws;
      let srcs=_se_srcs;
      var hpair=seg.h2.hpair;
      if (hpair!==undefined) {
          this.disconnect_handle(seg.h2);
      }
      var nv=this.make_vertex(co);
      nv.flag|=seg.v1.flag&seg.v2.flag;
      if (nv.flag&SplineFlags.SELECT) {
          nv.flag&=~SplineFlags.SELECT;
          this.verts.setselect(nv, true);
      }
      var v1=seg.v1, v2=seg.v2;
      var nseg=this.make_segment(nv, seg.v2);
      let w1=seg.w1+(seg.w2-seg.w1)*s;
      let w2=seg.w2;
      let shift1=seg.shift1+(seg.shift2-seg.shift1)*s;
      let shift2=seg.shift2;
      seg.w2 = w1;
      seg.shift2 = shift1;
      seg.v2.segments.remove(seg);
      nv.segments.push(seg);
      seg.v2 = nv;
      if (seg.l!==undefined) {
          var start=seg.l;
          var l=seg.l;
          var i=0;
          var lst=[];
          do {
            lst.push(l);
            if (i++>100) {
                console.trace("Infinite loop error");
                break;
            }
            l = l.radial_next;
          } while (l!==seg.l);
          
          for (var j=0; j<lst.length; j++) {
              var l=lst[j];
              var newl=this.make_loop();
              newl.f = l.f, newl.p = l.p;
              if (l.v===v1) {
                  newl.s = nseg;
                  newl.v = nv;
                  l.next.prev = newl;
                  newl.next = l.next;
                  l.next = newl;
                  newl.prev = l;
              }
              else 
                if (1) {
                  this._radial_loop_remove(l);
                  newl.s = seg;
                  newl.v = nv;
                  l.s = nseg;
                  l.next.prev = newl;
                  newl.next = l.next;
                  l.next = newl;
                  newl.prev = l;
                  this._radial_loop_insert(l);
              }
              this._radial_loop_insert(newl);
              l.p.totvert++;
          }
      }
      nv.flag|=SplineFlags.UPDATE;
      seg.v1.flag|=SplineFlags.UPDATE;
      nseg.v2.flag|=SplineFlags.UPDATE;
      var ret=split_edge_rets.next();
      ret[0] = nseg;
      ret[1] = nv;
      if (hpair!==undefined) {
          this.connect_handles(nseg.h2, hpair);
      }
      this.copy_segment_data(nseg, seg);
      nseg.w1 = w1;
      nseg.w2 = w2;
      nseg.shift1 = shift1;
      nseg.shift2 = shift2;
      srcs[0] = v1.cdata, srcs[1] = v2.cdata;
      this.copy_vert_data(nv, v1);
      nv.cdata.interp(srcs, ws);
      this.resolve = 1;
      return ret;
    }
     find_segment(v1, v2) {
      for (var i=0; i<v1.segments.length; i++) {
          if (v1.segments[i].other_vert(v1)===v2)
            return v1.segments[i];
      }
      return undefined;
    }
     disconnect_handle(h1) {
      h1.hpair.hpair = undefined;
      h1.hpair = undefined;
    }
     connect_handles(h1, h2) {
      var s1=h1.segments[0], s2=h2.segments[0];
      if (s1.handle_vertex(h1)!=s2.handle_vertex(h2)) {
          console.trace("Invalid call to connect_handles");
          return ;
      }
      if (h1.hpair!=undefined)
        this.disconnect_handle(h1);
      if (h2.hpair!=undefined)
        this.disconnect_handle(h2);
      h1.hpair = h2;
      h2.hpair = h1;
    }
     export_ks() {
      var mmlen=MMLEN;
      var size=4/UMUL+8/UMUL+this.segments.length*ORDER;
      size+=this.segments.length*(4/UMUL);
      size+=(8*Math.floor(this.segments.length/mmlen))/UMUL;
      var ret=new UARR(size);
      var view=new DataView(ret.buffer);
      var c=0, d=0;
      view.setInt32(c*UMUL, UMUL);
      c+=4/UMUL;
      var mink, maxk;
      for (var i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          if (d==0) {
              mink = 10000, maxk = -10000;
              for (var si=i; si<i+mmlen+1; si++) {
                  if (si>=this.segments.length)
                    break;
                  var s2=this.segments[si];
                  for (var j=0; j<ORDER; j++) {
                      mink = Math.min(mink, s2.ks[j]);
                      maxk = Math.max(maxk, s2.ks[j]);
                  }
              }
              view.setFloat32(c*UMUL, mink);
              view.setFloat32(c*UMUL+4, maxk);
              c+=8/UMUL;
          }
          view.setInt32(c*UMUL, s.eid);
          c+=4/UMUL;
          for (var j=0; j<ORDER; j++) {
              var k=s.ks[j];
              k = (k-mink)/(maxk-mink);
              if (k<0.0) {
                  console.log("EVIL!", k, mink, maxk);
              }
              k = Math.abs(Math.floor(k*UMAX));
              ret[c++] = k;
          }
          d = (d+1)%mmlen;
      }
      var ret2=ret;
      return ret2;
    }
     import_ks(data) {
      data = new UARR(data.buffer);
      var view=new DataView(data.buffer);
      var mmlen=MMLEN;
      var d=0, i=0;
      var datasize=view.getInt32(0);
      if (datasize!=UMUL) {
          return undefined;
      }
      i+=4/UMUL;
      while (i<data.length) {
        if (d==0) {
            var mink=view.getFloat32(i*UMUL);
            var maxk=view.getFloat32(i*UMUL+4);
            i+=8/UMUL;
        }
        d = (d+1)%mmlen;
        if (i>=data.length) {
            console.log("SPLINE CACHE ERROR", i, data.length);
            break;
        }
        var eid=view.getInt32(i*UMUL);
        i+=4/UMUL;
        var s=this.eidmap[eid];
        if (s==undefined||!(__instance_of(s, SplineSegment))) {
            console.log("Could not find segment", data[i-1]);
            i+=ORDER;
            continue;
        }
        for (var j=0; j<ORDER; j++) {
            var k=data[i++]/UMAX;
            k = k*(maxk-mink)+mink;
            s.ks[j] = k;
        }
      }
      return data;
    }
     fix_spline() {
      this.verts.remove_undefineds();
      this.handles.remove_undefineds();
      this.segments.remove_undefineds();
      this.faces.remove_undefineds();
      for (var i=0; i<2; i++) {
          var list=i ? this.handles : this.verts;
          for (var v of list) {
              for (var j=0; j<v.segments.length; j++) {
                  if (v.segments[j]==undefined) {
                      console.warn("Corruption detected for element", v.eid);
                      v.segments.pop_i(j);
                      j--;
                  }
              }
          }
      }
      var hset=new set();
      for (var s of this.segments) {
          hset.add(s.h1);
          hset.add(s.h2);
          for (let si=0; si<2; si++) {
              let h=si ? s.h2 : s.h1;
              if (h.segments.indexOf(s)<0) {
                  console.warn("fixing segment reference for handle", h.eid);
                  h.segments.length = 0;
                  h.segments.push(s);
              }
          }
      }
      let delset=new set();
      for (var h of this.handles) {
          if (!hset.has(h)) {
              delset.add(h);
          }
      }
      for (let h of delset) {
          console.log("Removing orphaned handle", h.eid, h);
          this.handles.remove(h);
      }
      var delsegments=new set();
      for (var v of this.verts) {
          for (var i=0; i<v.segments.length; i++) {
              var s=v.segments[i];
              if (s.v1!==v&&s.v2!==v) {
                  console.log("Corrupted segment! Deleting!");
                  v.segments.remove(s, true);
                  i--;
                  delsegments.add(s);
              }
          }
      }
      for (var s of delsegments) {
          this.kill_segment(s, true, true);
          continue;
          this.segments.remove(s, true);
          delete this.eidmap[s.eid];
          if (s.v1.indexOf(s)>=0)
            s.v1.segments.remove(s, true);
          if (s.v2.indexOf(s)>=0)
            s.v2.segments.remove(s, true);
          if (s.h1!==undefined&&s.h1.type===SplineTypes.HANDLE) {
              this.handles.remove(s.h1, true);
              delete this.eidmap[s.h1.eid];
          }
          if (s.h2!==undefined&&s.h2.type===SplineTypes.HANDLE) {
              this.handles.remove(s.h2, true);
              delete this.eidmap[s.h2.eid];
          }
          if (s.l!=undefined) {
              var l=s.l, c;
              var radial_next=l.radial_next;
              do {
                if (c++>100) {
                    console.log("Infinite loop (in fix_splines)!");
                    break;
                }
                this.kill_face(l.f);
                l = l.radial_next;
                if (l==undefined)
                  break;
              } while (l!=s.l);
              
          }
      }
      for (var s of this.segments) {
          if (s.v1.segments===undefined||s.v2.segments===undefined) {
              if (__instance_of(s.h1, SplineVertex))
                this.handles.remove(s.h1);
              if (__instance_of(s.h2, SplineVertex))
                this.handles.remove(s.h2);
              this.segments.remove(s);
              continue;
          }
          if (s.v1.segments.indexOf(s)<0) {
              s.v1.segments.push(s);
          }
          if (s.v2.segments.indexOf(s)<0) {
              s.v2.segments.push(s);
          }
          if (s.h1===undefined||s.h1.type!==SplineTypes.HANDLE) {
              console.log("Missing handle 1; adding. . .", s.eid, s);
              s.h1 = this.make_handle();
              s.h1.load(s.v1).interp(s.v2, 1.0/3.0);
          }
          if (s.h2===undefined||s.h2.type!==SplineTypes.HANDLE) {
              console.log("Missing handle 2; adding. . .", s.eid, s);
              s.h2 = this.make_handle();
              s.h2.load(s.v2).interp(s.v2, 2.0/3.0);
          }
          if (s.h1.segments[0]!==s)
            s.h1.segments = [s];
          if (s.h2.segments[0]!==s)
            s.h2.segments = [s];
      }
      var max_eid=0;
      for (var i=0; i<this.elists.length; i++) {
          var elist=this.elists[i];
          for (var e of elist) {
              max_eid = Math.max(e.eid, max_eid);
          }
      }
      var curid=!("cur_id" in this.idgen) ? "cur_eid" : "cur_id";
      if (max_eid>=this.idgen[curid]) {
          console.trace("IDGEN ERROR! DOOM! DOOM!");
          this.idgen[curid] = max_eid+1;
      }
    }
     select_none(ctx, datamode) {
      if (ctx===undefined) {
          throw new Error("ctx cannot be undefined");
      }
      if (datamode===undefined) {
          throw new Error("datamode cannot be undefined");
      }
      for (let elist of this.elists) {
          if (!(datamode&elist.type)) {
              continue;
          }
          for (let e of elist.selected.editable(ctx)) {
              this.setselect(e, false);
          }
      }
    }
     select_flush(datamode) {
      if (datamode&(SplineTypes.VERTEX|SplineTypes.HANDLE)) {
          var fset=new set();
          var sset=new set();
          var fact=this.faces.active, sact=this.segments.active;
          for (var v of this.verts.selected) {
              for (var s of v.segments) {
                  if (sset.has(s))
                    continue;
                  if (s.other_vert(v).flag&SplineFlags.SELECT) {
                      sset.add(s);
                  }
                  var l=s.l;
                  if (l===undefined)
                    continue;
                  var c=0;
                  do {
                    if (c++>1000) {
                        console.warn("Infinite loop detected!");
                        break;
                    }
                    var f=l.f;
                    if (f.flag&SplineFlags.SELECT) {
                        l = l.next;
                        continue;
                    }
                    var good=true;
                    for (var path of f.paths) {
                        for (var l2 of path) {
                            if (!(l2.v.flag&SplineFlags.SELECT)) {
                                good = false;
                                break;
                            }
                        }
                        if (!good)
                          break;
                    }
                    if (good) {
                        fset.add(f);
                    }
                    l = l.next;
                  } while (l!=s.l);
                  
              }
          }
          this.segments.clear_selection();
          this.faces.clear_selection();
          if (sact===undefined||!sset.has(sact)) {
              for (var s of sset) {
                  sact = s;
                  break;
              }
          }
          if (fact===undefined||!fset.has(fact)) {
              for (var f of fset) {
                  fact = f;
                  break;
              }
          }
          this.segments.active = sact;
          this.faces.active = fact;
          for (var s of sset) {
              this.segments.setselect(s, true);
          }
          for (var f of fset) {
              this.faces.setselect(f, true);
          }
      }
      else 
        if (datamode===SplineTypes.SEGMENT) {
          this.verts.clear_selection();
          this.faces.clear_selection();
          for (var s of this.segments.selected) {
              this.verts.setselect(s.v1, true);
              this.verts.setselect(s.v2, true);
              var l=s.l;
              if (l===undefined)
                continue;
              var c=0;
              do {
                if (c++>1000) {
                    console.warn("Infinite loop detected!");
                    break;
                }
                var f=l.f;
                if (f.flag&SplineFlags.SELECT) {
                    l = l.next;
                    continue;
                }
                var good=true;
                for (var path of f.paths) {
                    for (var l2 of path) {
                        if (!(l2.s.flag&SplineFlags.SELECT)) {
                            good = false;
                            break;
                        }
                    }
                    if (!good)
                      break;
                }
                if (good) {
                    console.log("selecting face");
                    this.faces.setselect(f, true);
                }
                l = l.next;
              } while (l!==s.l);
              
          }
      }
      else 
        if (datamode===SplineTypes.FACE) {
          this.verts.clear_selection();
          this.segments.clear_selection();
          for (var f of this.faces.selected) {
              for (var path of f.paths) {
                  for (var l of path) {
                      this.verts.setselect(l.v, true);
                      this.segments.setselect(l.s, true);
                  }
              }
          }
      }
    }
     make_segment(v1, v2, __eid, check_existing=true) {
      if (__eid===undefined)
        __eid = this.idgen.gen_id();
      if (check_existing) {
          var seg=this.find_segment(v1, v2);
          if (seg!==undefined)
            return seg;
      }
      var seg=new SplineSegment(v1, v2);
      seg.h1 = this.make_handle();
      seg.h2 = this.make_handle();
      seg.h1.load(v1).interp(v2, 1.0/3.0);
      seg.h2.load(v1).interp(v2, 2.0/3.0);
      seg.h1.segments.push(seg);
      seg.h2.segments.push(seg);
      seg.v1.segments.push(seg);
      seg.v2.segments.push(seg);
      seg.v1.flag|=SplineFlags.UPDATE;
      seg.v2.flag|=SplineFlags.UPDATE;
      seg.h1.flag|=SplineFlags.UPDATE;
      seg.h2.flag|=SplineFlags.UPDATE;
      seg.flag|=SplineFlags.UPDATE;
      this.segments.push(seg, __eid);
      return seg;
    }
     flip_segment(seg) {
      let v=seg.v1;
      let t=seg.v1;
      seg.v1 = seg.v2;
      seg.v2 = t;
      t = seg.h1;
      seg.h1 = seg.h2;
      seg.h2 = t;
      t = seg.w1;
      seg.w1 = seg.w2;
      seg.w2 = t;
      t = seg.shift1;
      seg.shift1 = seg.shift2;
      seg.shift2 = t;
      return this;
    }
     _radial_loop_insert(l) {
      if (l.s.l===undefined) {
          l.radial_next = l.radial_prev = l;
          l.s.l = l;
          return ;
      }
      l.radial_next = l.s.l;
      l.radial_prev = l.s.l.radial_prev;
      l.s.l.radial_prev.radial_next = l.s.l.radial_prev = l;
      l.s.l = l;
    }
     _radial_loop_remove(l) {
      l.radial_next.radial_prev = l.radial_prev;
      l.radial_prev.radial_next = l.radial_next;
      if (l===l.radial_next) {
          l.s.l = undefined;
      }
      else 
        if (l===l.s.l) {
          l.s.l = l.radial_next;
      }
    }
     make_face(vlists, custom_eid=undefined) {
      var f=new SplineFace();
      if (custom_eid==-1)
        custom_eid = undefined;
      this.faces.push(f);
      for (var i=0; i<vlists.length; i++) {
          var verts=vlists[i];
          if (verts.length<3) {
              throw new Error("Must have at least three vertices for face");
          }
          var vset={};
          for (var j=0; j<verts.length; j++) {
              if (verts[j].eid in vset) {
                  console.log(vlists);
                  throw new Error("Duplicate verts in make_face");
              }
              vset[verts[j].eid] = 1;
          }
      }
      for (var i=0; i<vlists.length; i++) {
          var verts=vlists[i];
          var list=new SplineLoopPath();
          list.f = f;
          list.totvert = verts.length;
          f.paths.push(list);
          var l=undefined, prevl=undefined;
          for (var j=0; j<verts.length; j++) {
              var v1=verts[j], v2=verts[(j+1)%verts.length];
              var s=this.make_segment(v1, v2, undefined, true);
              var l=this.make_loop();
              l.v = v1;
              l.s = s;
              l.f = f;
              l.p = list;
              if (prevl==undefined) {
                  list.l = l;
              }
              else {
                l.prev = prevl;
                prevl.next = l;
              }
              prevl = l;
          }
          list.l.prev = prevl;
          prevl.next = list.l;
          var l=list.l;
          do {
            this._radial_loop_insert(l);
            l = l.next;
          } while (l!=list.l);
          
      }
      return f;
    }
     make_loop() {
      var l=new SplineLoop();
      l.eid = this.idgen.gen_id();
      this.eidmap[l.eid] = l;
      return l;
    }
     kill_loop(l) {
      delete this.eidmap[l.eid];
    }
     _element_kill(e) {

    }
     kill_face(f) {
      for (var i=0; i<f.paths.length; i++) {
          var path=f.paths[i];
          for (var l of path) {
              this._radial_loop_remove(l);
              this.kill_loop(l);
          }
      }
      this._element_kill(f);
      this.faces.remove(f);
    }
     kill_segment(seg, kill_faces=true, soft_error=false) {
      var i=0;
      while (kill_faces&&seg.l!=undefined) {
        this.kill_face(seg.l.f);
        if (i++>1000) {
            console.trace("Infinite loop in kill_segment!!", seg);
            break;
        }
      }
      if (seg.v1.segments!=undefined)
        seg.v1.segments.remove(seg, soft_error);
      if (seg.v2.segments!=undefined)
        seg.v2.segments.remove(seg, soft_error);
      this.handles.remove(seg.h1, soft_error);
      this.handles.remove(seg.h2, soft_error);
      this._element_kill(seg);
      this.segments.remove(seg, soft_error);
    }
     do_save() {
      var obj=this.toJSON();
      var buf=JSON.stringify(obj);
      var blob=new Blob([buf], {type: "application/json"});
      var obj_url=window.URL.createObjectURL(blob);
      window.open(obj_url);
    }
     dissolve_vertex(v) {
      if (!(v.eid in this.eidmap)) {
          throw new Error("spline.dissolve_vertex called in error");
      }
      var ls2=[];
      if (v.segments.length!==2)
        return ;
      for (var i=0; i<v.segments.length; i++) {
          var s=v.segments[i];
          if (s.l===undefined)
            continue;
          var lst=[];
          var l=s.l;
          let _i=0;
          do {
            lst.push(l);
            l = l.radial_next;
            if (_i++>10000) {
                console.warn("infinite loop detected in dissolve_vertex");
                break;
            }
          } while (l!==s.l);
          
          for (var j=0; j<lst.length; j++) {
              var l=lst[j];
              if (l.v!==v&&l.next.v!==v)
                continue;
              if (l.v!==v) {
                  l = l.next;
              }
              if (l===l.p.l)
                l.p.l = l.next;
              if (l.p.totvert<=3||l.p.l===l) {
                  console.log("DESTROYING FACE!!", l.f.eid);
                  this.kill_face(l.f);
                  continue;
              }
              this._radial_loop_remove(l);
              ls2.push(l.prev);
              l.prev.next = l.next;
              l.next.prev = l.prev;
              this.kill_loop(l);
              l.p.totvert--;
          }
      }
      if (v.segments.length===2) {
          var s1=v.segments[0], s2=v.segments[1];
          var v1=s1.other_vert(v), v2=s2.other_vert(v);
          var existing=this.find_segment(v1, v2);
          let w1=v===s1.v1 ? s1.w2 : s1.w1;
          let w2=v===s2.v1 ? s2.w2 : s2.w1;
          let shift1=v===s1.v1 ? s1.shift2 : s1.shift1;
          let shift2=v===s2.v1 ? s2.shift2 : s2.shift1;
          if (s1.v1===v)
            s1.v1 = v2;
          else 
            s1.v2 = v2;
          var ci=0;
          while (s2.l!==undefined) {
            this._radial_loop_remove(s2.l);
            if (ci++>100) {
                console.warn("Infinite loop error!");
                break;
            }
          }
          while (s1.l!==undefined) {
            this._radial_loop_remove(s1.l);
            if (ci++>100) {
                console.warn("Infinite loop error!");
                break;
            }
          }
          this.kill_segment(s2);
          v2.segments.push(s1);
          v.segments.length = 0;
          let flip=false;
          if (existing) {
              flip = existing.v1!==s1.v1;
              this.kill_segment(s1);
              s1 = existing;
          }
          if (!flip) {
              s1.w1 = w1;
              s1.w2 = w2;
              s1.shift1 = shift1;
              s1.shift2 = shift2;
          }
          else {
            s1.w1 = w2;
            s1.w2 = w1;
            s1.shift1 = shift2;
            s1.shift2 = shift1;
          }
          if (s1.l===undefined) {
              for (var i=0; i<ls2.length; i++) {
                  var l=ls2[i];
                  l.s = s1;
                  this._radial_loop_insert(l);
                  console.log(s1.v1.eid, s1.v2.eid, "|", l.prev.v.eid, l.v.eid, l.next.v.eid);
              }
          }
          v.flag|=SplineFlags.UPDATE;
          v2.flag|=SplineFlags.UPDATE;
      }
      this.kill_vertex(v);
      this.resolve = 1;
    }
     buildSelCtxKey() {
      let key="";
      key+=this.layerset.active.id;
      return key;
    }
     kill_vertex(v) {
      if (!(v.eid in this.eidmap)) {
          throw new Error("spline.kill_vertex called in error");
      }
      this._vert_rem_set.add(v.eid);
      this.dag_update("on_vert_add", this._vert_rem_set);
      this.dag_update("on_vert_change");
      if (v.flag&SplineFlags.SELECT) {
          this.verts.setselect(v, false);
      }
      if (this.hpair!==undefined)
        this.disconnect_handle(this);
      while (v.segments.length>0) {
        var last=v.segments.length;
        this.kill_segment(v.segments[0]);
        if (last===v.segments.length) {
            console.log("EEK!");
            break;
        }
      }
      if (this.verts.active===v)
        this.verts.active = undefined;
      if (this.verts.highlight===v)
        this.verts.highlight = undefined;
      delete this.eidmap[v.eid];
      this._element_kill(v);
      this.verts.remove(v);
    }
     _vert_flag_update(v, depth, limit) {
      if (depth>=limit)
        return ;
      v.flag|=SplineFlags.TEMP_TAG;
      for (var i=0; i<v.segments.length; i++) {
          var s=v.segments[i], v2=s.other_vert(v);
          if (v2==undefined||v2.segments==undefined) {
              console.trace("ERROR 1: v, s, v2:", v, s, v2);
              continue;
          }
          var has_tan=v2.segments.length<=2;
          for (var j=0; j<v2.segments.length; j++) {
              var h=v2.segments[j].handle(v2);
              if (h.hpair!=undefined) {
                  has_tan = true;
              }
          }
          if (!has_tan) {
          }
          if (!(v2.flag&SplineFlags.TEMP_TAG)) {
              this._vert_flag_update(v2, depth+1, limit);
          }
      }
      for (var j=0; j<v.segments.length; j++) {
          var s=v.segments[j], v2=s.other_vert(v);
          if (v2.segments.length>2||(v2.flag&SplineFlags.BREAK_TANGENTS))
            v2.flag|=SplineFlags.TEMP_TAG;
      }
    }
     propagate_draw_flags(repeat=2) {
      for (var seg of this.segments) {
          seg.flag&=~SplineFlags.TEMP_TAG;
      }
      for (var seg of this.segments) {
          if (!(seg.flag&SplineFlags.REDRAW_PRE))
            continue;
          for (var i=0; i<2; i++) {
              var v=i ? seg.v2 : seg.v1;
              for (var j=0; j<v.segments.length; j++) {
                  var seg2=v.segments[j];
                  seg2.flag|=SplineFlags.TEMP_TAG;
                  var l=seg2.l;
                  if (l==undefined)
                    continue;
                  var _i=0;
                  do {
                    if (_i++>1000) {
                        console.warn("infinite loop!");
                        break;
                    }
                    l.f.flag|=SplineFlags.REDRAW_PRE;
                    l = l.radial_next;
                  } while (l!=seg2.l);
                  
              }
          }
      }
      for (var seg of this.segments) {
          if (seg.flag&SplineFlags.TEMP_TAG) {
              seg.flag|=SplineFlags.REDRAW_PRE;
          }
      }
      if (repeat!=undefined&&repeat>0) {
          this.propagate_draw_flags(repeat-1);
      }
    }
     propagate_update_flags() {
      for (let seg of this.segments) {
          if ((seg.v1.flag&SplineFlags.UPDATE)&&(seg.v1.flag&SplineFlags.BREAK_TANGENTS)) {
              seg.v2.flag|=SplineFlags.UPDATE;
          }
          if ((seg.v2.flag&SplineFlags.UPDATE)&&(seg.v2.flag&SplineFlags.BREAK_TANGENTS)) {
              seg.v1.flag|=SplineFlags.UPDATE;
          }
      }
      var verts=this.verts;
      for (var i=0; i<verts.length; i++) {
          var v=verts[i];
          v.flag&=~SplineFlags.TEMP_TAG;
      }
      var limit=5;
      for (var i=0; i<verts.length; i++) {
          var v=verts[i];
          if (v.flag&SplineFlags.UPDATE) {
              this._vert_flag_update(v, 0, limit);
          }
      }
      for (var i=0; i<verts.length; i++) {
          var v=verts[i];
          if (v.flag&SplineFlags.TEMP_TAG) {
              v.flag|=SplineFlags.UPDATE;
          }
      }
    }
     solve(steps, gk, force_queue=false) {
      var this2=this;
      var dag_trigger=function () {
        this2.dag_update("on_solve", true);
      };
      if (this._pending_solve!==undefined&&force_queue) {
          var this2=this;
          this._pending_solve = this._pending_solve.then(function () {
            this2.solve();
          });
          this.solving = true;
          return this._pending_solve;
      }
      else 
        if (this._pending_solve!==undefined) {
          var do_accept;
          var promise=new Promise(function (accept, reject) {
            do_accept = function () {
              accept();
            }
          });
          this._resolve_after = function () {
            do_accept();
          };
          return promise;
      }
      else {
        this._pending_solve = this.solve_intern(steps, gk);
        this.solving = true;
        return this._pending_solve;
      }
    }
     solve_intern(steps, gk) {
      var this2=this;
      var dag_trigger=function () {
        this2.dag_update("on_solve", true);
        the_global_dag.exec(g_app_state.screen.ctx);
      };
      for (var v of this.verts) {
          if (v.flag&SplineFlags.UPDATE) {
              for (var i=0; i<v.segments.length; i++) {
                  var seg=v.segments[i];
                  seg.flag|=SplineFlags.REDRAW_PRE;
                  var l=seg.l;
                  if (!l)
                    continue;
                  var _i=0;
                  do {
                    if (_i++>5000) {
                        console.warn("infinite loop!");
                        break;
                    }
                    l.f.flag|=SplineFlags.REDRAW_PRE;
                    l = l.radial_next;
                  } while (l!=seg.l);
                  
              }
          }
      }
      this.propagate_draw_flags();
      var this2=this;
      if (!DEBUG.no_native&&config.USE_WASM&&native_api.isReady()) {
          var ret=native_api.do_solve(SplineFlags, this, steps, gk, true);
          ret.then(function () {
            this2._pending_solve = undefined;
            this2.solving = false;
            this2._do_post_solve();
            dag_trigger();
            if (this2._resolve_after) {
                var cb=this2._resolve_after;
                this2._resolve_after = undefined;
                this2._pending_solve = this2.solve_intern().then(function () {
                  cb.call(this2);
                });
                this2.solving = true;
            }
          });
          return ret;
      }
      else 
        if (!DEBUG.no_native&&config.USE_NACL&&window.common!=undefined&&window.common.naclModule!=undefined) {
          var ret=do_solve(SplineFlags, this, steps, gk, true);
          ret.then(function () {
            this2._pending_solve = undefined;
            this2.solving = false;
            this2._do_post_solve();
            dag_trigger();
            if (this2._resolve_after) {
                var cb=this2._resolve_after;
                this2._resolve_after = undefined;
                this2._pending_solve = this2.solve_intern().then(function () {
                  cb.call(this2);
                });
                this2.solving = true;
            }
          });
          return ret;
      }
      else {
        var do_accept;
        var promise=new Promise(function (accept, reject) {
          do_accept = function () {
            accept();
          }
        });
        var this2=this;
        var timer=window.setInterval(function () {
          window.clearInterval(timer);
          do_solve(SplineFlags, this2, steps, gk);
          this2._pending_solve = undefined;
          this2.solving = false;
          do_accept();
          this2._do_post_solve();
          dag_trigger();
          if (this2._resolve_after) {
              var cb=this2._resolve_after;
              this2._resolve_after = undefined;
              this2._pending_solve = this2.solve_intern().then(function () {
                cb.call(this2);
              });
              this2.solving = true;
          }
        }, 10);
        return promise;
      }
    }
     _do_post_solve() {
      for (var seg of this.segments) {
          if (seg.flag&SplineFlags.REDRAW_PRE) {
              seg.flag&=~SplineFlags.REDRAW_PRE;
              seg.flag|=SplineFlags.REDRAW;
          }
      }
      for (var f of this.faces) {
          if (f.flag&SplineFlags.REDRAW_PRE) {
              f.flag&=~SplineFlags.REDRAW_PRE;
              f.flag|=SplineFlags.REDRAW;
          }
      }
      for (var seg of this.segments) {
          seg.post_solve();
      }
    }
     solve_p(steps, gk) {
      console.trace("solve_p: DEPRECATED");
      return this.solve(steps, gk);
    }
     trace_face(g, f) {
      g.beginPath();
      let lastco=_trace_face_lastco;
      lastco.zero();
      for (var path of f.paths) {
          var first=true;
          for (var l of path) {
              var seg=l.s;
              var flip=seg.v1!==l.v;
              var s=flip ? seg.ks[KSCALE] : 0, ds=flip ? -2 : 2;
              while ((!flip&&s<seg.ks[KSCALE])||(flip&&s>=0)) {
                var co=seg.evaluate(s/seg.length);
                if (first) {
                    first = false;
                    g.moveTo(co[0], co[1]);
                }
                else {
                  g.lineTo(co[0], co[1]);
                }
                s+=ds;
              }
          }
      }
      g.closePath();
    }
     forEachPoint(cb, thisvar) {
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          var last_len=list.length;
          for (var i=0; i<list.length; i++) {
              if (thisvar!=undefined)
                cb.call(thisvar, list[i]);
              else 
                cb(list[i]);
              last_len = list.length;
          }
      }
    }
     build_shash() {
      var sh={};
      var cellsize=150;
      sh.cellsize = cellsize;
      function hash(x, y, cellsize) {
        return Math.floor(x/cellsize)+","+Math.floor(y/cellsize);
      }
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          for (var v of list) {
              var h=hash(v[0], v[1], cellsize);
              if (!(h in sh)) {
                  sh[h] = [];
              }
              sh[h].push(v);
          }
      }
      var sqrt2=sqrt(2);
      sh.forEachPoint = function sh_lookupPoints(co, radius, callback, thisvar) {
        var cellsize=this.cellsize;
        var cellradius=Math.ceil(sqrt2*radius/cellsize);
        var sx=Math.floor(co[0]/cellsize)-cellradius;
        var sy=Math.floor(co[1]/cellsize)-cellradius;
        var ex=Math.ceil(co[0]/cellsize)+cellradius;
        var ey=Math.ceil(co[1]/cellsize)+cellradius;
        for (var x=sx; x<=ex; x++) {
            for (var y=sy; y<=ey; y++) {
                var h=hash(x*cellsize, y*cellsize, cellsize);
                if (!(h in this))
                  continue;
                var list=this[h];
                for (var i=0; i<list.length; i++) {
                    var e=list[i];
                    var dis=e.vectorDistance(co);
                    if (dis<radius&&co!==e) {
                        callback.call(thisvar, e, dis);
                    }
                }
            }
        }
      };
      return sh;
    }
     unhide_all() {
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          if (v.flag&SplineFlags.HIDE) {
              v.flag&=~SplineFlags.HIDE;
              v.flag|=SplineFlags.SELECT;
          }
      }
    }
     duplicate_verts() {
      var newvs=[];
      var idmap={};
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          if (!(v.flag&SplineFlags.SELECT))
            continue;
          if (v.hidden)
            continue;
          var nv=this.make_vertex(v);
          idmap[v.eid] = nv;
          idmap[nv.eid] = v;
          nv.flag = v.flag&~SplineFlags.SELECT;
          newvs.push(nv);
      }
      for (var i=0; i<this.segments.length; i++) {
          var seg=this.segments[i];
          if ((seg.v1.flag&SplineFlags.SELECT)&&(seg.v2.flag&SplineFlags.SELECT)) {
              var v1=idmap[seg.v1.eid], v2=idmap[seg.v2.eid];
              if (v1==undefined||v2==undefined||v1==v2)
                continue;
              this.make_segment(v1, v2);
          }
      }
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          this.verts.setselect(v, false);
      }
      for (var i=0; i<newvs.length; i++) {
          this.verts.setselect(newvs[i], true);
      }
      this.start_mpos[0] = this.mpos[0];
      this.start_mpos[1] = this.mpos[1];
      this.start_transform();
      this.resolve = 1;
    }
     has_highlight(selmask=255) {
      for (let list of this.elists) {
          if ((list.type&selmask)&&list.highlight)
            return true;
      }
      return false;
    }
     clear_highlight() {
      for (var i=0; i<this.elists.length; i++) {
          this.elists[i].highlight = undefined;
      }
    }
     validate_active() {
      for (var i=0; i<this.elists.length; i++) {
          var elist=this.elists[i];
          if (elist.active!=undefined&&elist.active.hidden)
            elist.active = undefined;
      }
    }
     clear_active(e) {
      this.set_active(undefined);
    }
     set_active(e) {
      if (e===undefined) {
          for (var i=0; i<this.elists.length; i++) {
              this.elists[i].active = undefined;
          }
          return ;
      }
      var elist=this.get_elist(e.type);
      elist.active = e;
    }
     setselect(e, state) {
      var elist=this.get_elist(e.type);
      elist.setselect(e, state);
    }
     clear_selection(e) {
      for (var i=0; i<this.elists.length; i++) {
          this.elists[i].clear_selection();
      }
    }
     do_mirror() {
      this.start_transform('s');
      for (var i=0; i<this.transdata.length; i++) {
          var start=this.transdata[i][0], v=this.transdata[i][1];
          if (v.flag&SplineFlags.HIDE)
            continue;
          v.sub(this.trans_cent);
          v[0] = -v[0];
          v.add(this.trans_cent);
      }
      this.end_transform();
      this.resolve = 1;
    }
     toJSON(self) {
      var ret={};
      ret.frame = this.frame;
      ret.verts = {length: this.verts.length};
      ret.segments = [];
      ret.handles = [];
      ret.draw_verts = this.draw_verts;
      ret.draw_normals = this.draw_normals;
      ret._cur_id = this.idgen.cur_id;
      for (var i=0; i<this.verts.length; i++) {
          ret.verts[i] = this.verts[i].toJSON();
      }
      if (this.verts.active!=undefined)
        ret.verts.active = this.verts.active.eid;
      else 
        ret.verts.active = undefined;
      if (this.handles.active!=undefined)
        ret.handles.active = this.handles.active.eid;
      if (this.segments.active!=undefined)
        ret.segments.active = this.segments.active.eid;
      for (var i=0; i<this.segments.length; i++) {
          ret.segments.push(this.segments[i].toJSON());
      }
      for (var i=0; i<this.handles.length; i++) {
          ret.handles.push(this.handles[i].toJSON());
      }
      return ret;
    }
     reset() {
      this.idgen = new SDIDGen();
      this.strokeGroups = [];
      this._strokeGroupMap = new Map();
      this.init_elists();
      this.updateGen++;
    }
     import_json(obj) {
      var spline2=Spline.fromJSON(obj);
      var miny=1e+18, maxy=1e-18;
      var newmap={};
      for (var i=0; i<spline2.verts.length; i++) {
          var v=spline2.verts[i];
          var nv=this.make_vertex(v, v.eid);
          nv.flag = v.flag;
          nv.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          miny = Math.min(miny, nv[1]);
          maxy = Math.max(maxy, nv[1]);
          newmap[v.eid] = nv;
      }
      for (var i=0; i<spline2.verts.length; i++) {
          var v=spline2.verts[i], nv=newmap[v.eid];
          nv[1] = ((maxy-miny)-(nv[1]-miny))+miny;
      }
      for (var i=0; i<spline2.segments.length; i++) {
          var seg=spline2.segments[i];
          var v1=newmap[seg.v1.eid], v2=newmap[seg.v2.eid];
          var nseg=this.make_segment(v1, v2);
          nseg.flag = seg.flag|SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          newmap[seg.eid] = nseg;
      }
      this.resolve = 1;
    }
     redoSegGroups() {
      buildSegmentGroups(this);
      splitSegmentGroups(this);
    }
    static  fromJSON(obj) {
      var spline=new Spline();
      spline.idgen.cur_id = obj._cur_id;
      spline.draw_verts = obj.draw_verts;
      spline.draw_normals = obj.draw_normals;
      var eidmap={};
      for (var i=0; i<obj.verts.length; i++) {
          var cv=obj.verts[i];
          var v=spline.make_vertex(cv);
          v.flag|=SplineFlags.FRAME_DIRTY;
          v.flag = cv.flag;
          v.eid = cv.eid;
          v.segments = cv.segments;
          eidmap[v.eid] = v;
      }
      for (var i=0; i<obj.handles.length; i++) {
          var cv=obj.handles[i];
          var v=spline.make_handle(cv);
          v.flag = cv.flag;
          v.eid = cv.eid;
          v.segments = cv.segments;
          eidmap[v.eid] = v;
      }
      for (var i=0; i<obj.segments.length; i++) {
          var s=obj.segments[i];
          var segments=obj.segments;
          var v1=eidmap[s.v1], v2=eidmap[s.v2];
          var h1=eidmap[s.h1], h2=eidmap[s.h2];
          var seg=new SplineSegment();
          seg.eid = s.eid;
          seg.flag = s.flag;
          if (seg.ks.length===s.ks.length) {
              seg.ks = s.ks;
          }
          else {
            spline.resolve = true;
            for (var j=0; j<spline.verts.length; j++) {
                spline.verts[j].flag|=SplineFlags.UPDATE;
            }
          }
          for (var j=0; j<seg.ks.length; j++) {
              if (isNaN(seg.ks[j])) {
                  seg.ks[j] = 0.0;
              }
          }
          seg.v1 = v1, seg.v2 = v2, seg.h1 = h1, seg.h2 = h2;
          spline.segments.push(seg);
          eidmap[seg.eid] = seg;
      }
      for (var i=0; i<obj.verts.length; i++) {
          var v=obj.verts[i];
          for (var j=0; j<v.segments.length; j++) {
              v.segments[j] = eidmap[v.segments[j]];
          }
      }
      for (var i=0; i<obj.handles.length; i++) {
          var v=obj.handles[i];
          for (var j=0; j<v.segments.length; j++) {
              v.segments[j] = eidmap[v.segments[j]];
          }
      }
      if (obj.verts.active!==undefined)
        spline.verts.active = eidmap[obj.verts.active];
      if (obj.handles.active!==undefined)
        spline.handles.active = eidmap[obj.handles.active];
      if (obj.segments.active!==undefined)
        spline.segments.active = eidmap[obj.segments.active];
      spline.eidmap = eidmap;
      return spline;
    }
     prune_singles() {
      var del=[];
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          if (v.segments.length===0) {
              del.push(v);
          }
      }
      for (var i=0; i<del.length; i++) {
          this.kill_vertex(del[i]);
      }
    }
     draw(redraw_rects, g, editor, matrix, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers) {
      this.canvas = g;
      this.selectmode = selectmode;
      g.lineWidth = 1;
      if (this.resolve) {
          this.solve().then(function () {
            window.redraw_viewport();
          });
      }
      return draw_spline(this, redraw_rects, g, editor, matrix, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers);
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.afterSTRUCT();
      this.query = this.q = new SplineQuery(this);
      var eidmap={};
      this.elists = [];
      this.elist_map = {};
      for (var k in _elist_map) {
          var type=_elist_map[k];
          var v=this[k];
          if (v==undefined)
            continue;
          this.elists.push(v);
          this.elist_map[type] = v;
      }
      this.init_sel_handlers();
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          for (var i=0; i<list.length; i++) {
              var v=list[i];
              eidmap[v.eid] = v;
              if (v.type==SplineTypes.VERTEX)
                v.hpair = undefined;
          }
      }
      for (var h of this.handles) {
          h.hpair = eidmap[h.hpair];
      }
      for (var i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          s.v1 = eidmap[s.v1];
          s.v2 = eidmap[s.v2];
          s.h1 = eidmap[s.h1];
          s.h2 = eidmap[s.h2];
          eidmap[s.eid] = s;
      }
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          for (var i=0; i<list.length; i++) {
              var v=list[i];
              for (var j=0; j<v.segments.length; j++) {
                  v.segments[j] = eidmap[v.segments[j]];
              }
          }
      }
      for (var i=0; i<this.faces.length; i++) {
          var f=this.faces[i];
          f.flag|=SplineFlags.UPDATE_AABB;
          eidmap[f.eid] = f;
          for (var path of f.paths) {
              path.f = f;
              var l=path.l;
              do {
                eidmap[l.eid] = l;
                l.f = f;
                l.s = eidmap[l.s];
                l.v = eidmap[l.v];
                l = l.next;
              } while (l!=path.l);
              
          }
      }
      for (var i=0; i<this.faces.length; i++) {
          var f=this.faces[i];
          for (var path of f.paths) {
              var l=path.l;
              do {
                l.radial_next = eidmap[l.radial_next];
                l.radial_prev = eidmap[l.radial_prev];
                l = l.next;
              } while (l!=path.l);
              
          }
      }
      for (var i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          s.l = eidmap[s.l];
      }
      this.eidmap = eidmap;
      var selected=new ElementArraySet();
      selected.layerset = this.layerset;
      for (var i=0; i<this.selected.length; i++) {
          var eid=this.selected[i];
          if (!(eid in eidmap)) {
              console.log("WARNING! eid", eid, "not in eidmap!", Object.keys(eidmap));
              continue;
          }
          selected.add(eidmap[this.selected[i]]);
      }
      this.selected = selected;
      this.verts.afterSTRUCT(SplineTypes.VERTEX, this.idgen, this.eidmap, this.selected, this.layerset, this);
      this.handles.afterSTRUCT(SplineTypes.HANDLE, this.idgen, this.eidmap, this.selected, this.layerset, this);
      this.segments.afterSTRUCT(SplineTypes.SEGMENT, this.idgen, this.eidmap, this.selected, this.layerset, this);
      this.faces.afterSTRUCT(SplineTypes.FACE, this.idgen, this.eidmap, this.selected, this.layerset, this);
      if (this.layerset===undefined) {
          this.layerset = new SplineLayerSet();
          this.layerset.new_layer();
      }
      else {
        this.layerset.afterSTRUCT(this);
      }
      this._strokeGroupMap = new Map();
      for (let group of this.strokeGroups) {
          this._strokeGroupMap.set(group.hash, group);
          group.afterSTRUCT(this);
      }
      this.regen_sort();
      if (spline_multires.has_multires(this)&&this.mres_format!=undefined) {
          console.log("Converting old multires layout. . .");
          for (var seg of this.segments) {
              var mr=seg.cdata.get_layer(spline_multires.MultiResLayer);
              mr._convert(this.mres_format, spline_multires._format);
          }
      }
      var arr=[];
      for (var i=0; i<spline_multires._format.length; i++) {
          arr.push(spline_multires._format[i]);
      }
      this.mres_format = arr;
      return this;
    }
     flagUpdateVertTime(v) {
      if (v) {
          this._vert_time_set.add(v.eid);
      }
      this.dag_update("on_vert_time_change", this._vert_time_set);
    }
     flagUpdateKeyframes(v) {
      this.dag_update("on_keyframe_insert", 1);
    }
     dag_exec(ctx, inputs, outputs, graph) {
      outputs.on_vert_add.loadData(this._vert_add_set);
      this._vert_add_set = new set();
      this._vert_rem_set = new set();
      this._vert_time_set = new set();
    }
    static  nodedef() {
      return {name: "Spline", 
     uiName: "Spline", 
     outputs: {on_keyframe_insert: null, 
      on_solve: null, 
      on_vert_time_change: new set(), 
      on_vert_add: new set(), 
      on_vert_remove: new set(), 
      on_vert_change: null}, 
     inputs: {}}
    }
  }
  _ESClass.register(Spline);
  _es6_module.add_class(Spline);
  Spline = _es6_module.add_export('Spline', Spline);
  
  mixin(Spline, DataPathNode);
  Spline.STRUCT = STRUCT.inherit(Spline, DataBlock)+`
    idgen    : SDIDGen;
    
    selected : iter(e, int) | e.eid;
    
    verts    : ElementArray;
    handles  : ElementArray;
    segments : ElementArray;
    faces    : ElementArray;
    layerset : SplineLayerSet;
    
    restrict : int;
    actlevel : int;
    
    mres_format : array(string);
    strokeGroups : array(SplineStrokeGroup);
}
`;
  var SplineStrokeGroup=es6_import_item(_es6_module, './spline_strokegroup.js', 'SplineStrokeGroup');
  var buildSegmentGroups=es6_import_item(_es6_module, './spline_strokegroup.js', 'buildSegmentGroups');
  var splitSegmentGroups=es6_import_item(_es6_module, './spline_strokegroup.js', 'splitSegmentGroups');
}, '/dev/fairmotion/src/curve/spline.js');
es6_module_define('solver', [], function _solver_module(_es6_module) {
  var SQRT2=Math.sqrt(2.0);
  var FEPS=1e-17;
  var PI=Math.PI;
  var sin=Math.sin, cos=Math.cos, atan2=Math.atan2;
  var sqrt=Math.sqrt, pow=Math.pow, log=Math.log, abs=Math.abs;
  var SPI2=Math.sqrt(PI/2);
  class constraint  {
     constructor(typename, k, klst, klen, ceval, params, limit) {
      if (limit==undefined)
        limit = 1e-05;
      this.limit = limit;
      this.type = typename;
      this.klst = klst;
      this.ceval = ceval;
      this.params = params;
      this.klen = [];
      if (!(__instance_of(klen, Array))) {
          for (var i=0; i<klst.length; i++) {
              this.klen.push(klen);
          }
      }
      else {
        this.klen = klen;
      }
      this.glst = [];
      for (var i=0; i<klst.length; i++) {
          var gs=[];
          this.glst.push(gs);
          for (var j=0; j<klen; j++) {
              gs.push(0);
          }
      }
      this.k = k;
    }
     exec(do_gs) {
      if (do_gs==undefined)
        do_gs = true;
      var r1=this.ceval(this.params);
      if (abs(r1)<=this.limit)
        return 0.0;
      if (!do_gs)
        return r1;
      var df=3e-06;
      for (var ki=0; ki<this.klst.length; ki++) {
          var ks=this.klst[ki];
          var gs=this.glst[ki];
          for (var i=0; i<this.klen[ki]; i++) {
              var orig=ks[i];
              ks[i]+=df;
              var r2=this.ceval(this.params);
              gs[i] = (r2-r1)/df;
              ks[i] = orig;
              if (ks.length>5) {
              }
          }
      }
      return r1;
    }
  }
  _ESClass.register(constraint);
  _es6_module.add_class(constraint);
  constraint = _es6_module.add_export('constraint', constraint);
  class solver  {
    
     constructor() {
      this.cs = [];
      this.threshold = 0.001;
      this.edge_segs = [];
    }
     add(c) {
      this.cs.push(c);
    }
     solve(steps, gk, final_solve, edge_segs) {
      if (gk==undefined)
        gk = 1.0;
      var err=0.0;
      var clen=this.cs.length;
      for (var i=0; i<steps; i++) {
          for (var j=0; j<edge_segs.length; j++) {
              var seg=edge_segs[j];
              var ks=seg.ks;
              for (var k=0; k<ks.length; k++) {
                  ks[k] = seg._last_ks[k];
              }
          }
          err/=this.cs.length;
          if (i>0&&err<this.threshold)
            break;
          if (isNaN(err))
            break;
          err = 0.0;
          var cs=this.cs;
          var visit={};
          for (var j=0; j<cs.length; j++) {
              var j2=i%2 ? clen-j-1 : j;
              var c=cs[j2];
              var r=c.exec(true);
              err+=abs(r);
              if (r==0.0)
                continue;
              var klst=c.klst, glst=c.glst;
              var totgs=0.0;
              for (var ki=0; ki<klst.length; ki++) {
                  var klen=c.klen[ki];
                  var gs=glst[ki];
                  totgs = 0.0;
                  for (var k=0; k<klen; k++) {
                      totgs+=gs[k]*gs[k];
                  }
                  if (totgs==0.0)
                    continue;
                  var rmul=r/totgs;
                  ks = klst[ki];
                  gs = glst[ki];
                  var ck=i>8&&c.k2!==undefined ? c.k2 : c.k;
                  let mul=1.0/Math.pow(1.0+ks[KSCALE], 0.25);
                  for (var k=0; k<klen; k++) {
                      ks[k]+=-rmul*gs[k]*ck*gk*mul;
                  }
              }
          }
      }
      for (var j=0; j<edge_segs.length; j++) {
          var seg=edge_segs[j];
          var ks=seg.ks;
          for (var k=0; k<ks.length; k++) {
              seg.ks[k] = seg._last_ks[k];
          }
      }
      if (final_solve||isNaN(err)) {
          console.log("err", err, "steps", i, "\n");
      }
      return i;
    }
  }
  _ESClass.register(solver);
  _es6_module.add_class(solver);
  solver = _es6_module.add_export('solver', solver);
}, '/dev/fairmotion/src/curve/solver.js');
es6_module_define('spline_multires', ["../util/binomial_table.js", "../core/struct.js", "./spline_base.js"], function _spline_multires_module(_es6_module) {
  "use strict";
  var acos=Math.acos, asin=Math.asin, abs=Math.abs, log=Math.log, sqrt=Math.sqrt, pow=Math.pow, PI=Math.PI, floor=Math.floor, min=Math.min, max=Math.max, sin=Math.sin, cos=Math.cos, tan=Math.tan, atan=Math.atan, atan2=Math.atan2, exp=Math.exp, ceil=Math.ceil;
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var CustomDataLayer=es6_import_item(_es6_module, './spline_base.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, './spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, './spline_base.js', 'SplineFlags');
  var CurveEffect=es6_import_item(_es6_module, './spline_base.js', 'CurveEffect');
  var MResFlags={SELECT: 1, 
   ACTIVE: 2, 
   REBASE: 4, 
   UPDATE: 8, 
   HIGHLIGHT: 16, 
   HIDE: 64, 
   FRAME_DIRTY: 128}
  MResFlags = _es6_module.add_export('MResFlags', MResFlags);
  var _a=0;
  var TX=0;
  TX = _es6_module.add_export('TX', TX);
  var TY=1;
  TY = _es6_module.add_export('TY', TY);
  var TVX=2;
  TVX = _es6_module.add_export('TVX', TVX);
  var TVY=3;
  TVY = _es6_module.add_export('TVY', TVY);
  var TSEG=4;
  TSEG = _es6_module.add_export('TSEG', TSEG);
  var TS=5;
  TS = _es6_module.add_export('TS', TS);
  var TT=6;
  TT = _es6_module.add_export('TT', TT);
  var TA=7;
  TA = _es6_module.add_export('TA', TA);
  var TFLAG=8;
  TFLAG = _es6_module.add_export('TFLAG', TFLAG);
  var TID=9;
  TID = _es6_module.add_export('TID', TID);
  var TLEVEL=10;
  TLEVEL = _es6_module.add_export('TLEVEL', TLEVEL);
  var TSUPPORT=11;
  TSUPPORT = _es6_module.add_export('TSUPPORT', TSUPPORT);
  var TBASIS=12;
  TBASIS = _es6_module.add_export('TBASIS', TBASIS);
  var TDEGREE=13;
  TDEGREE = _es6_module.add_export('TDEGREE', TDEGREE);
  var TNEXT=14;
  TNEXT = _es6_module.add_export('TNEXT', TNEXT);
  var TTOT=15;
  TTOT = _es6_module.add_export('TTOT', TTOT);
  var _format=["TX", "TY", "TVX", "TVY", "TSEG", "TS", "TT", "TA", "TFLAG", "TID", "TLEVEL", "TSUPPORT", "TBASIS", "TDEGREE", "TNEXT"];
  _format = _es6_module.add_export('_format', _format);
  var IHEAD=0, ITAIL=1, IFREEHEAD=2, ITOTPOINT=3, ITOT=4;
  var $p__Hdq_recalc_offset;
  class BoundPoint  {
    
     constructor() {
      this.mr = undefined;
      this.i = undefined;
      this.data = undefined;
      this.composed_id = -1;
      this.offset = {};
      var this2=this;
      Object.defineProperty(this.offset, "0", {get: function () {
          return this2.data[this2.i+TVX];
        }, 
     set: function (val) {
          this2.data[this2.i+TVX] = val;
        }});
      Object.defineProperty(this.offset, "1", {get: function () {
          return this2.data[this2.i+TVY];
        }, 
     set: function (val) {
          this2.data[this2.i+TVY] = val;
        }});
    }
     recalc_offset(spline) {
      var seg=spline.eidmap[this.seg];
      var co=seg._evalwrap.evaluate(this.s);
      this.offset[0] = this[0]-co[0];
      this.offset[1] = this[1]-co[1];
      $p__Hdq_recalc_offset[0] = this[0];
      $p__Hdq_recalc_offset[1] = this[1];
      var sta=seg._evalwrap.global_to_local($p__Hdq_recalc_offset, undefined, this.s);
      this.t = sta[1];
      this.a = sta[2];
    }
     toString() {
      var next=this.data!=undefined ? this.data[this.i+TNEXT] : "(error)";
      return "{\n"+"\"0\"   : "+this[0]+",\n"+"\"1\"   : "+this[1]+",\n"+".offset : ["+this.offset[0]+", "+this.offset[1]+"],\n"+"id      : "+this.id+",\n"+"seg     : "+this.seg+",\n"+"t       : "+this.t+",\n"+"s       : "+this.s+",\n"+"flag    : "+this.flag+",\n"+"next    : "+next+"\n"+"}\n";
    }
     bind(mr, i) {
      this.mr = mr;
      this.i = i;
      this.data = mr.data;
      this.composed_id = compose_id(this.seg, this.id);
      return this;
    }
    get  0() {
      return this.data[this.i+TX];
    }
    set  0(val) {
      this.data[this.i+TX] = val;
    }
    get  1() {
      return this.data[this.i+TY];
    }
    set  1(val) {
      this.data[this.i+TY] = val;
    }
    get  support() {
      return this.data[this.i+TSUPPORT];
    }
    set  support(val) {
      this.data[this.i+TSUPPORT] = val;
    }
    get  degree() {
      return this.data[this.i+TDEGREE];
    }
    set  degree(val) {
      this.data[this.i+TDEGREE] = val;
    }
    get  basis() {
      return this.data[this.i+TBASIS];
    }
    set  basis(val) {
      this.data[this.i+TBASIS] = val;
    }
    get  seg() {
      return this.data[this.i+TSEG];
    }
    set  seg(val) {
      this.data[this.i+TSEG] = val;
    }
    get  level() {
      return this.data[this.i+TLEVEL];
    }
    set  level(val) {
      this.data[this.i+TLEVEL] = val;
    }
    get  s() {
      return this.data[this.i+TS];
    }
    set  s(val) {
      this.data[this.i+TS] = val;
    }
    get  t() {
      return this.data[this.i+TT];
    }
    set  t(val) {
      this.data[this.i+TT] = val;
    }
    get  a() {
      return this.data[this.i+TA];
    }
    set  a(val) {
      this.data[this.i+TA] = val;
    }
    get  flag() {
      return this.data[this.i+TFLAG];
    }
    set  flag(val) {
      this.data[this.i+TFLAG] = val;
    }
    get  id() {
      return this.data[this.i+TID];
    }
    set  id(val) {
      this.data[this.i+TID] = val;
    }
    get  next() {
      return this.data[this.i+TNEXT];
    }
  }
  var $p__Hdq_recalc_offset=new Vector3([0, 0, 0]);
  _ESClass.register(BoundPoint);
  _es6_module.add_class(BoundPoint);
  BoundPoint = _es6_module.add_export('BoundPoint', BoundPoint);
  var pointiter_ret_cache=cachering.fromConstructor(BoundPoint, 12);
  var add_point_cache=cachering.fromConstructor(BoundPoint, 12);
  var get_point_cache=cachering.fromConstructor(BoundPoint, 12);
  class point_iter  {
    
     constructor() {
      this.ret = {done: true, 
     value: undefined};
    }
     [Symbol.iterator]() {
      return this;
    }
     cache_init(mr, level) {
      this.mr = mr;
      this.level = level;
      this.data = mr.data;
      this.cur = mr.index[level*ITOT+IHEAD];
      this.ret.done = false;
      this.ret.value = undefined;
      return this;
    }
     next() {
      if (this.cur==-1) {
          this.ret.done = true;
          this.ret.value = undefined;
          this.mr = undefined;
          return this.ret;
      }
      var d=this.data;
      var cur=this.cur;
      var p=pointiter_ret_cache.next();
      p.bind(this.mr, this.cur);
      this.cur = d[cur+TNEXT];
      if (this.cur==cur) {
          console.log("EEK! bad data in mres iterator!", this, this.mr, this.cur, cur, "level:", this.level);
          this.cur = -1;
      }
      this.ret.value = p;
      return this.ret;
    }
  }
  _ESClass.register(point_iter);
  _es6_module.add_class(point_iter);
  var binomial_table=es6_import_item(_es6_module, '../util/binomial_table.js', 'binomial_table');
  var bernstein_offsets=es6_import_item(_es6_module, '../util/binomial_table.js', 'bernstein_offsets');
  function binomial(n, k) {
    if (binomial_table.length>n) {
        return binomial_table[n][k];
    }
    if (k==0.0||k==n) {
        return 1;
    }
    return binomial(n-1, k-1)+binomial(n-1, k);
  }
  function bernstein(degree, s) {
    degree = Math.max(Math.floor(degree), 0.0);
    var half=Math.floor(degree/2);
    return binomial(degree, half)*pow(s, half)*pow(1.0-s, degree-half);
  }
  function bernstein2(degree, s) {
    var a=floor(degree+1);
    var b=ceil(degree+1);
    if (isNaN(a)||a<=0) {
        return 0.0;
    }
    var start=0.0, mid=0.5, end=1.0;
    if (a>=0&&a<bernstein_offsets.length) {
        start = bernstein_offsets[a][0];
        mid = bernstein_offsets[a][1];
        end = bernstein_offsets[a][2];
    }
    var off=0.5-mid;
    if (1||a<4) {
        var t=1.0-abs(s-0.5)*2.0;
        s-=off*t;
    }
    else {
      s*=2.0;
      s = start*(1.0-s)+mid*s;
    }
    var height=bernstein(a, mid, 0, a, Math.floor(a/2));
    return bernstein(a, s)/height;
  }
  function crappybasis(s, k, support, degree) {
    if (s<k-support||s>=k+support)
      return 0.0;
    var start=k-support, end=k+support;
    var t=(s-start)/(end-start);
    var degree2=degree-2.0;
    var sign=degree2<0.0 ? -1.0 : 1.0;
    degree2 = pow(degree2, 0.25)*sign+2.0;
    t = bernstein2(degree, t);
    if (isNaN(t))
      t = 0.0;
    return t;
  }
  var $sum_Up2J_evaluate;
  var $ks_HtA1_evaluate;
  class MultiResEffector extends CurveEffect {
     constructor(owner) {
      super();
      this.mr = owner;
    }
     evaluate(s) {
      var n=this.prior.derivative(s);
      var t=n[0];
      n[0] = n[1];
      n[1] = t;
      n.normalize();
      n.mulScalar(10.0);
      var co=this.prior.evaluate(s);
      $sum_Up2J_evaluate.zero();
      var i=0;
      for (var p in this.mr.points(0)) {
          $ks_HtA1_evaluate[i] = p.s;
          i++;
      }
      for (var p in this.mr.points(0)) {
          var w=crappybasis(s, p.s, p.support, p.degree);
          if (isNaN(w))
            continue;
          $sum_Up2J_evaluate[0]+=p.offset[0]*w;
          $sum_Up2J_evaluate[1]+=p.offset[1]*w;
      }
      for (var i=0; i<2; i++) {
          var next=i ? this.next : this.prev;
          var soff=i ? -1.0 : 1.0;
          var sign=i ? -1.0 : 1.0;
          if (next!=undefined) {
              var mr=!(__instance_of(next, MultiResEffector)) ? next.eff.mr : next.mr;
              for (var p in mr.points(0)) {
                  if ((!i&&p.s-support>=0)||(i&&p.s+support<=1.0))
                    continue;
                  var support=p.support;
                  var ps=p.s;
                  var s2;
                  if (!i) {
                      s2 = next.rescale(this, s)+1.0;
                  }
                  else {
                    s2 = -next.rescale(this, 1.0-s);
                  }
                  var w=crappybasis(s2, ps, support, p.degree);
                  $sum_Up2J_evaluate[0]+=p.offset[0]*w;
                  $sum_Up2J_evaluate[1]+=p.offset[1]*w;
              }
          }
      }
      co.add($sum_Up2J_evaluate);
      return co;
    }
  }
  var $sum_Up2J_evaluate=new Vector3();
  var $ks_HtA1_evaluate=new Array(2000);
  _ESClass.register(MultiResEffector);
  _es6_module.add_class(MultiResEffector);
  MultiResEffector = _es6_module.add_export('MultiResEffector', MultiResEffector);
  class MultiResGlobal  {
     constructor() {
      this.active = undefined;
    }
    static  fromSTRUCT(reader) {
      var ret=new MultiResGlobal();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(MultiResGlobal);
  _es6_module.add_class(MultiResGlobal);
  MultiResGlobal = _es6_module.add_export('MultiResGlobal', MultiResGlobal);
  MultiResGlobal.STRUCT = `
  MultiResGlobal {
    active : double | obj.active == undefined ? -1 : obj.active;
  }
`;
  var $_co_9uUh_add_point;
  var $sta_JGXX_recalc_worldcos_level;
  class MultiResLayer extends CustomDataLayer {
     constructor(size=16) {
      super(this);
      this._effector = new MultiResEffector(this);
      this.max_layers = 8;
      this.data = new Float64Array(size*TTOT);
      this.index = new Array(this.max_layers*ITOT);
      this.totpoint = 0;
      this._size = size;
      this._freecur = 0;
      for (var i=0; i<this.max_layers; i++) {
          this.index[i*ITOT+IHEAD] = -1;
          this.index[i*ITOT+ITAIL] = -1;
          this.index[i*ITOT+IFREEHEAD] = 0;
      }
      this.points_iter_cache = cachering.fromConstructor(point_iter, 8);
    }
     _convert(formata, formatb) {
      var totp=this.data.length/formata.length;
      var data=new Float64Array(totp*formatb.length);
      var odata=this.data;
      var ttota=formata.length, ttotb=formatb.length;
      console.log("FORMATA", formata, "\n");
      console.log("FORMATB", formatb, "\n");
      var fa=[], fb=[];
      var fmap={};
      for (var i=0; i<formata.length; i++) {
          for (var j=0; j<formatb.length; j++) {
              if (formata[i]==formatb[j]) {
                  fmap[i] = j;
              }
          }
      }
      console.log("FMAP", fmap, "\n");
      for (var i=0; i<totp; i++) {
          for (var j=0; j<formata.length; j++) {
              var src=odata[i*ttota+j];
              if ((formata[j]=="TNEXT"||formata[j]=="TID")&&src!=-1) {
                  src = Math.floor((src/ttota)*ttotb);
              }
              data[i*ttotb+fmap[j]] = src;
          }
      }
      for (var i=0; i<this.max_layers; i++) {
          if (this.index[i*ITOT+IHEAD]!=-1)
            this.index[i*ITOT+IHEAD] = Math.floor((this.index[i*ITOT+IHEAD]/ttota)*ttotb);
          if (this.index[i*ITOT+ITAIL]!=-1)
            this.index[i*ITOT+ITAIL] = Math.floor((this.index[i*ITOT+ITAIL]/ttota)*ttotb);
          if (this.index[i*ITOT+IFREEHEAD]!=-1)
            this.index[i*ITOT+IFREEHEAD] = Math.floor((this.index[i*ITOT+IFREEHEAD]/ttota)*ttotb);
      }
      this.data = data;
    }
     fix_points(seg=undefined) {
      var index=this.index;
      for (var i=0; i<this.index.length; i+=ITOT) {
          index[i] = index[i+1] = -1;
          index[i+2] = index[i+3] = 0;
      }
      var data=this.data;
      for (var i=0; i<data.length; i+=TTOT) {
          if (data[i]==0&&data[i+1]==0&&data[i+2]==0&&data[TNEXT]==0)
            continue;
          this._freecur = i+TTOT;
          var lvl=data[i+TLEVEL];
          if (index[lvl*ITOT+IHEAD]==-1) {
              index[lvl*ITOT+IHEAD] = index[lvl*ITOT+ITAIL] = i;
              data[i+TNEXT] = -1;
          }
          else {
            var i2=index[lvl*ITOT+ITAIL];
            data[i2+TNEXT] = i;
            data[i+TNEXT] = -1;
            index[lvl*ITOT+ITAIL] = i;
          }
          index[lvl*ITOT+ITOTPOINT]++;
      }
      if (seg==undefined)
        return ;
      for (var i=0; i<this.max_layers; i++) {
          for (var p in this.points(i)) {
              p.seg = seg.eid;
          }
      }
    }
     points(level) {
      return this.points_iter_cache.next().cache_init(this, level);
    }
     add_point(level, co=$_co_9uUh_add_point) {
      this._freecur+=TTOT-(this._freecur%TTOT);
      var i=this._freecur;
      if (this._freecur+TTOT>=this._size) {
          this.resize(this._freecur+3);
      }
      var j=0;
      this.data[i+TX] = co[0];
      this.data[i+TY] = co[1];
      this.data[i+TLEVEL] = level;
      this.data[i+TID] = i;
      this.data[i+TNEXT] = -1;
      this.data[i+TSUPPORT] = 0.3;
      this.data[i+TDEGREE] = 2.0;
      this._freecur = i+TTOT;
      var head=this.index[level*ITOT+IHEAD];
      var tail=this.index[level*ITOT+ITAIL];
      if (head==-1||tail==-1) {
          this.index[level*ITOT+IHEAD] = i;
          this.index[level*ITOT+ITAIL] = i;
      }
      else {
        this.data[tail+TNEXT] = i;
        this.index[level*ITOT+ITAIL] = i;
      }
      this.index[level*ITOT+ITOTPOINT]++;
      this.totpoint++;
      return add_point_cache.next().bind(this, i);
    }
     get(id, allocate_object=false) {
      if (allocate_object)
        return new BoundPoint().bind(this, id);
      else 
        return get_point_cache.next().bind(this, id);
    }
     curve_effect() {
      return this._effector;
    }
     resize(newsize) {
      if (newsize<this._size)
        return ;
      newsize*=2.0;
      var array=new Float64Array(newsize);
      var oldsize=this.data.length;
      for (var i=0; i<oldsize; i++) {
          array[i] = this.data[i];
      }
      this._size = newsize;
      this.data = array;
    }
     segment_split(old_segment, old_v1, old_v2, new_segments) {

    }
     recalc_worldcos_level(seg, level) {
      for (var p in this.points(level)) {
          $sta_JGXX_recalc_worldcos_level[0] = p.s;
          $sta_JGXX_recalc_worldcos_level[1] = p.t;
          $sta_JGXX_recalc_worldcos_level[2] = p.a;
          var co=seg._evalwrap.local_to_global($sta_JGXX_recalc_worldcos_level);
          var co2=seg._evalwrap.evaluate($sta_JGXX_recalc_worldcos_level[0]);
          p[0] = co[0];
          p[1] = co[1];
          p.offset[0] = co[0]-co2[0];
          p.offset[1] = co[1]-co2[1];
      }
    }
     recalc_wordscos(seg) {
      for (var i=0; i<this.max_layers; i++) {
          this.recalc_worldcos_level(seg, i);
      }
    }
     post_solve(owner_segment) {
      this.recalc_wordscos(owner_segment);
    }
     interp(srcs, ws) {
      this.time = 0.0;
      for (var i=0; i<srcs.length; i++) {

      }
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(this);
      ret.max_layers = 8;
    }
    static  define() {
      return {typeName: "MultiResLayer", 
     hasCurveEffect: true, 
     sharedClass: MultiResGlobal}
    }
  }
  var $_co_9uUh_add_point=[0, 0];
  var $sta_JGXX_recalc_worldcos_level=[0, 0, 0];
  _ESClass.register(MultiResLayer);
  _es6_module.add_class(MultiResLayer);
  MultiResLayer = _es6_module.add_export('MultiResLayer', MultiResLayer);
  MultiResLayer.STRUCT = STRUCT.inherit(MultiResLayer, CustomDataLayer)+`
    data            : array(double);
    index           : array(double);
    max_layers      : int;
    totpoint        : int;
    _freecur        : int;
    _size           : int;
  }
`;
  function test_fix_points() {
    var spline=new Context().spline;
    for (var seg in spline.segments) {
        var mr=seg.cdata.get_layer(MultiResLayer);
        mr.fix_points(seg);
    }
  }
  test_fix_points = _es6_module.add_export('test_fix_points', test_fix_points);
  function test_multires(n) {
    var mr=new MultiResLayer();
    var adds=[0.5, -0.25, -1, 1, 1, -2, 4, 9, 11.3, 3, 4, 0.245345, 1.0234, 8, 7, 4, 6];
    var iadd=0.0;
    for (var i=0; i<5; i++, iadd+=0.2*(i+1)) {
        var add=iadd;
        var p=mr.add_point(0, [-4, -3]);
        var c=0;
        p.id = adds[c++]+add++;
        p.offset[0] = adds[c++]+add++;
        p.offset[1] = adds[c++]+add++;
        p.flag = adds[c++]+add++;
        p.seg = adds[c++]+add++;
        p.t = adds[c++]+add++;
        p.s = adds[c++]+add++;
        p[0] = adds[c++]+add++;
        p[1] = adds[c++]+add++;
        add = iadd;
        c = 0;
        console.log(p.id==adds[c++]+add++, adds[c-1]+add-1, p.id, "id");
        console.log(p.offset[0]==adds[c++]+add++, adds[c-1]+add-1, p.offset[0], "offset[0]");
        console.log(p.offset[1]==adds[c++]+add++, adds[c-1]+add-1, p.offset[1], "offset[1]");
        console.log(p.flag==adds[c++]+add++, adds[c-1]+add-1, p.flag, "flag");
        console.log(p.seg==adds[c++]+add++, adds[c-1]+add-1, p.seg, "seg");
        console.log(p.t==adds[c++]+add++, adds[c-1]+add-1, p.t, "t");
        console.log(p.s==adds[c++]+add++, adds[c-1]+add-1, p.s, "s");
        console.log(p[0]==adds[c++]+add++, adds[c-1]+add-1, p[0], "[0]");
        console.log(p[1]==adds[c++]+add++, adds[c-1]+add-1, p[1], "[1]");
    }
    var _c=0;
    for (var p of mr.points(0)) {
        console.log(""+p);
        if (_c++>1000) {
            console.trace("Infinite loop!");
            break;
        }
    }
    return mr;
  }
  test_multires = _es6_module.add_export('test_multires', test_multires);
  function compose_id(eid, index) {
    var mul=(1<<24);
    return index+eid*mul;
  }
  compose_id = _es6_module.add_export('compose_id', compose_id);
  var $ret_dNkY_decompose_id=[0, 0];
  function decompose_id(id) {
    var mul=(1<<24);
    var eid=Math.floor(id/mul);
    id-=eid*mul;
    $ret_dNkY_decompose_id[0] = eid;
    $ret_dNkY_decompose_id[1] = id;
    return $ret_dNkY_decompose_id;
  }
  decompose_id = _es6_module.add_export('decompose_id', decompose_id);
  var _test_id_start=0;
  function test_ids(steps, start) {
    if (steps===undefined) {
        steps = 1;
    }
    if (start===undefined) {
        start = _test_id_start;
    }
    var max_mres=5000000;
    var max_seg=500000;
    console.log("starting at", start);
    for (var i=start; i<start+steps; i++) {
        for (var j=0; j<max_seg; j++) {
            var id=compose_id(i, j);
            var ret=decompose_id(id);
            if (i!=ret[0]||j!=ret[1]) {
                console.log("Found bad combination!!", ret[0], ret[1], "||", i, j);
            }
        }
    }
    console.log("finished");
    _test_id_start = i;
  }
  test_ids = _es6_module.add_export('test_ids', test_ids);
  function has_multires(spline) {
    return spline.segments.cdata.num_layers("MultiResLayer")>0;
  }
  has_multires = _es6_module.add_export('has_multires', has_multires);
  function ensure_multires(spline) {
    if (spline.segments.cdata.num_layers("MultiResLayer")==0) {
        spline.segments.cdata.add_layer(MultiResLayer);
    }
  }
  ensure_multires = _es6_module.add_export('ensure_multires', ensure_multires);
  var empty_iter={_ret: {done: true, 
    value: undefined}, 
   next: function () {
      this._ret.done = true;
      this._ret.value = undefined;
      return this._ret;
    }}
  empty_iter[Symbol.iterator] = function () {
    return this;
  }
  class GlobalIter  {
    
     constructor(spline, level, return_keys=false) {
      this.spline = spline;
      this.level = level;
      this.return_keys = return_keys;
      this.seg = undefined;
      this.segiter = spline.segments[Symbol.iterator]();
      this.pointiter = undefined;
      this.ret = {done: false, 
     value: undefined};
    }
     next() {
      if (this.pointiter==undefined) {
          this.seg = this.segiter.next();
          if (this.seg.done==true) {
              this.ret.done = true;
              this.ret.value = undefined;
              return this.ret;
          }
          this.seg = this.seg.value;
          var mr=this.seg.cdata.get_layer(MultiResLayer);
          this.pointiter = mr.points(this.level);
      }
      var p=this.pointiter.next();
      if (p.done) {
          this.pointiter = undefined;
          return this.next();
      }
      p = p.value;
      this.ret.value = this.return_keys ? compose_id(p.seg, p.id) : p;
      return this.ret;
    }
     [Symbol.iterator]() {
      return this;
    }
  }
  _ESClass.register(GlobalIter);
  _es6_module.add_class(GlobalIter);
  function iterpoints(spline, level, return_keys) {
    if (return_keys===undefined) {
        return_keys = false;
    }
    if (spline.segments.cdata.num_layers("MultiResLayer")==0)
      return empty_iter;
    return new GlobalIter(spline, level, return_keys);
  }
  iterpoints = _es6_module.add_export('iterpoints', iterpoints);
  iterpoints.selected = function (spline, level) {
  }
}, '/dev/fairmotion/src/curve/spline_multires.js');
es6_module_define('spline_strokegroup', ["./spline_element_array.js", "../path.ux/scripts/pathux.js", "./spline_types.js"], function _spline_strokegroup_module(_es6_module) {
  "use strict";
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var cconst=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'cconst');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Quat');
  var SplineSegment=es6_import_item(_es6_module, './spline_types.js', 'SplineSegment');
  var SplineVertex=es6_import_item(_es6_module, './spline_types.js', 'SplineVertex');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineFace=es6_import_item(_es6_module, './spline_types.js', 'SplineFace');
  var SplineElement=es6_import_item(_es6_module, './spline_types.js', 'SplineElement');
  var SplineLayerFlags=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayerFlags');
  let hashcache=util.cachering.fromConstructor(util.HashDigest, 8);
  class SplineStrokeGroup  {
    
    
     constructor(segs) {
      this.hash = -1;
      this.segments = [];
      this.eids = [];
      this.id = -1;
      if (segs) {
          for (let seg of segs) {
              this.add(seg);
          }
          this.calcHash();
      }
    }
     add(seg) {
      this.segments.push(seg);
      this.eids.push(seg.eid);
    }
     calcHash() {
      this.hash = SplineStrokeGroup.calcHash(this.segments);
    }
    static  calcHash(segments) {
      let hash=hashcache.next().reset();
      for (let s of segments) {
          hash.add(s.eid);
      }
      return hash.get();
    }
     loadSTRUCT(reader) {
      reader(this);
    }
     afterSTRUCT(spline) {
      let eids=this.eids;
      this.segments.length = 0;
      this.eids = [];
      for (let eid of eids) {
          let seg=spline.eidmap[eid];
          if (!seg) {
              console.warn("Missing SplineSegment in SplineGroup!");
              continue;
          }
          this.segments.push(seg);
          this.eids.push(eid);
      }
      this.calcHash();
      return this;
    }
  }
  _ESClass.register(SplineStrokeGroup);
  _es6_module.add_class(SplineStrokeGroup);
  SplineStrokeGroup = _es6_module.add_export('SplineStrokeGroup', SplineStrokeGroup);
  SplineStrokeGroup.STRUCT = `
SplineStrokeGroup {
  id       : int;
  hash     : uint;
  eids     : array(int);
}
`;
  function splitSegmentGroups(spline) {
    let oldstrokes=spline._drawStrokeGroupMap;
    spline._drawStrokeGroupMap = new Map();
    spline.drawStrokeGroups.length = 0;
    let c1=new Vector4();
    let c2=new Vector4();
    function visible(seg) {
      let hide=seg.flag&SplineFlags.HIDE;
      hide = hide||(seg.flag&SplineFlags.NO_RENDER);
      if (hide)
        return false;
      for (let k in seg.layers) {
          if (spline.layerset.get(k).flag&SplineLayerFlags.HIDE) {
              return false;
          }
      }
      return true;
    }
    for (let group of spline.strokeGroups) {
        let seg=group.segments[0];
        let i=0;
        while (i<group.segments.length&&!visible(group.segments[i])) {
          i++;
        }
        if (i===group.segments.length) {
            continue;
        }
        seg = group.segments[i];
        let segs=[];
        for (let s of group.segments) {
            let mat1=seg.mat;
            let mat2=s.mat;
            c1.load(mat1.strokecolor);
            c2.load(mat2.strokecolor);
            let bad=Math.abs(mat1.blur-mat2.blur)>0.01;
            bad = bad||c1.vectorDistance(c2)>0.01;
            bad = bad||!visible(s);
            let layerbad=true;
            for (let k in s.layers) {
                if (k in seg.layers) {
                    layerbad = false;
                }
            }
            bad = bad||layerbad;
            if (bad&&segs.length>0) {
                let hash=SplineStrokeGroup.calcHash(segs);
                let group;
                if (oldstrokes.has(hash)) {
                    group = oldstrokes.get(hash);
                    for (let i=0; i<group.segments.length; i++) {
                        group.segments[i] = spline.eidmap[group.eids[i]];
                    }
                }
                else {
                  group = new SplineStrokeGroup(segs);
                  group.id = spline.idgen.gen_id();
                }
                spline._drawStrokeGroupMap.set(hash, group);
                spline.drawStrokeGroups.push(group);
                segs = [];
            }
            segs.push(s);
        }
        if (segs.length>0) {
            let hash=SplineStrokeGroup.calcHash(segs);
            let group2;
            if (oldstrokes.has(hash)) {
                group2 = oldstrokes.get(hash);
                for (let i=0; i<group2.segments.length; i++) {
                    group2.segments[i] = spline.eidmap[group2.eids[i]];
                }
            }
            else {
              group2 = new SplineStrokeGroup(segs);
              group2.id = spline.idgen.gen_id();
            }
            spline._drawStrokeGroupMap.set(hash, group2);
            spline.drawStrokeGroups.push(group2);
        }
    }
  }
  splitSegmentGroups = _es6_module.add_export('splitSegmentGroups', splitSegmentGroups);
  function buildSegmentGroups(spline) {
    let roots=new Set();
    let visit=new Set();
    let oldstrokes=spline._strokeGroupMap;
    spline._strokeGroupMap = new Map();
    spline.strokeGroups.length = 0;
    let groups=spline.strokeGroups;
    for (let v of spline.verts) {
        let val=v.segments.length;
        if (val===0||val===2) {
            continue;
        }
        roots.add(v);
    }
    let vvisit=new Set();
    let doseg=(v) =>      {
      let startv=v;
      for (let seg of v.segments) {
          if (visit.has(seg))
            continue;
          let _i=0;
          let segs=[seg];
          v = startv;
          visit.add(seg);
          vvisit.add(startv);
          do {
            if (v!==seg.v1&&v!==seg.v2) {
                console.error("EEK!!");
                break;
            }
            v = seg.other_vert(v);
            vvisit.add(v);
            if (v.segments.length!==2) {
                break;
            }
            seg = v.other_segment(seg);
            segs.push(seg);
            visit.add(seg);
            if (_i++>1000) {
                console.warn("infinite loop detected");
                break;
            }
          } while (v!==startv);
          
          if (segs.length===0) {
              continue;
          }
          let group=new SplineStrokeGroup(segs);
          group.calcHash();
          if (oldstrokes.has(group.hash)) {
              group = oldstrokes.get(group.hash);
              for (let i=0; i<group.segments.length; i++) {
                  group.segments[i] = spline.eidmap[group.eids[i]];
              }
          }
          else {
            group.id = spline.idgen.gen_id();
          }
          if (!spline._strokeGroupMap.has(group.hash)) {
              spline._strokeGroupMap.set(group.hash, group);
              groups.push(group);
          }
      }
    }
    for (let v of roots) {
        doseg(v);
    }
    for (let v of spline.verts) {
        if (!(vvisit.has(v))) {
            doseg(v);
        }
    }
  }
  buildSegmentGroups = _es6_module.add_export('buildSegmentGroups', buildSegmentGroups);
}, '/dev/fairmotion/src/curve/spline_strokegroup.js');
es6_module_define('solver_new', ["./spline_math.js", "./spline_base.js"], function _solver_new_module(_es6_module) {
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var SplineTypes=es6_import_item(_es6_module, './spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, './spline_base.js', 'SplineFlags');
  var acos=Math.acos, asin=Math.asin, cos=Math.cos, sin=Math.sin, PI=Math.PI, pow=Math.pow, sqrt=Math.sqrt, log=Math.log, abs=Math.abs;
  var $tan_RUDJ_solve=new Vector3();
  function solve(spline, order, steps, gk, do_inc, edge_segs) {
    var pairs=[];
    var CBREAK=SplineFlags.BREAK_CURVATURES;
    var TBREAK=SplineFlags.BREAK_TANGENTS;
    function reset_edge_segs() {
      for (var j=0; do_inc&&j<edge_segs.length; j++) {
          var seg=edge_segs[j];
          var ks=seg.ks;
          for (var k=0; k<ks.length; k++) {
              ks[k] = seg._last_ks[k];
          }
      }
    }
    var eps=0.0001;
    for (var i=0; i<spline.handles.length; i++) {
        var h=spline.handles[i], seg1=h.owning_segment, v=h.owning_vertex;
        if (do_inc&&!((v.flag)&SplineFlags.UPDATE))
          continue;
        if (!(h.flag&SplineFlags.USE_HANDLES)&&v.segments.length<=2)
          continue;
        if (h.hpair!=undefined&&(h.flag&SplineFlags.AUTO_PAIRED_HANDLE)) {
            var seg2=h.hpair.owning_segment;
            var s1=v===seg1.v1 ? eps : 1.0-eps, s2=v==seg2.v1 ? eps : 1.0-eps;
            var thresh=5;
            if (seg1.v1.vectorDistance(seg1.v2)<thresh||seg2.v1.vectorDistance(seg2.v2)<thresh)
              continue;
            var d1=seg1.v1.vectorDistance(seg1.v2);
            var d2=seg2.v1.vectorDistance(seg2.v2);
            var ratio=Math.min(d1/d2, d2/d1);
            if (isNaN(ratio))
              ratio = 0.0;
            pairs.push(v);
            pairs.push(seg1);
            pairs.push(seg2);
            pairs.push(s1);
            pairs.push(s2);
            pairs.push((s1<0.5)==(s2<0.5) ? -1 : 1);
            pairs.push(ratio);
        }
        else 
          if (!(h.flag&SplineFlags.AUTO_PAIRED_HANDLE)) {
            var s1=v==seg1.v1 ? 0 : 1;
            pairs.push(v);
            pairs.push(seg1);
            pairs.push(undefined);
            pairs.push(s1);
            pairs.push(0.0);
            pairs.push(1);
            pairs.push(1);
        }
    }
    var PSLEN=7;
    for (var i=0; i<spline.verts.length; i++) {
        var v=spline.verts[i];
        if (do_inc&&!((v.flag)&SplineFlags.UPDATE))
          continue;
        if (v.segments.length!=2)
          continue;
        if (v.flag&TBREAK)
          continue;
        var seg1=v.segments[0], seg2=v.segments[1];
        var s1=v===seg1.v1 ? 0 : 1, s2=v==seg2.v1 ? 0 : 1;
        seg1.evaluate(0.5, order);
        seg2.evaluate(0.5, order);
        var thresh=5;
        if (seg1.v1.vectorDistance(seg1.v2)<thresh||seg2.v1.vectorDistance(seg2.v2)<thresh)
          continue;
        var d1=seg1.v1.vectorDistance(seg1.v2);
        var d2=seg2.v1.vectorDistance(seg2.v2);
        var ratio=Math.min(d1/d2, d2/d1);
        if (isNaN(ratio))
          ratio = 0.0;
        pairs.push(v);
        pairs.push(seg1);
        pairs.push(seg2);
        pairs.push(s1);
        pairs.push(s2);
        pairs.push((s1==0.0)==(s2==0.0) ? -1 : 1);
        pairs.push(ratio);
    }
    var glist=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        glist.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var klist1=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        klist1.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var klist2=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        klist2.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var gs=new Array(order);
    var df=3e-05;
    var err=0.0;
    if (pairs.length==0)
      return ;
    for (var si=0; si<steps; si++) {
        var i=0;
        var plen=pairs.length;
        if (isNaN(err)||isNaN(plen))
          break;
        if (si>0&&err/plen<0.1)
          break;
        var di=0;
        if (si%2) {
            di = -PSLEN*2;
            i = plen-PSLEN;
        }
        reset_edge_segs();
        err = 0.0;
        while (i<plen&&i>=0) {
          var cnum=Math.floor(i/PSLEN);
          var v=pairs[i++], seg1=pairs[i++], seg2=pairs[i++];
          var s1=pairs[i++], s2=pairs[i++], doflip=pairs[i++];
          var ratio=pairs[i++];
          i+=di;
          for (var ci=0; ci<2; ci++) {
              if (0&&seg2!=undefined&&ratio>0.1&&!(v.flag&CBREAK)) {
                  var sz1=seg1.ks[KSCALE], sz2=seg2.ks[KSCALE];
                  var i1=s1*(order-1), i2=s2*(order-1);
                  var k1=seg1.ks[i1], k2=seg2.ks[i2];
                  var k=((k1/sz1)+(k2/sz2*doflip))/2.0;
                  seg1.ks[i1] = seg1.ks[i1]+(k*sz1-seg1.ks[i1])*1;
                  seg2.ks[i2] = seg2.ks[i2]+(k*doflip*sz2-seg2.ks[i2])*1;
              }
              if (seg2!=undefined) {
                  var ta=seg1.derivative(s1, order), tb=seg2.derivative(s2, order);
                  if (doflip<0.0)
                    tb.negate();
                  ta.normalize();
                  tb.normalize();
                  var _d=Math.min(Math.max(ta.dot(tb), -1.0), 1.0);
                  var r=acos(_d);
                  
              }
              else {
                var h=seg1.handle(v);
                $tan_RUDJ_solve.load(h).sub(v).normalize();
                if (v==seg1.v2)
                  $tan_RUDJ_solve.negate();
                var ta=seg1.derivative(s1, order).normalize();
                var _d=Math.min(Math.max(ta.dot($tan_RUDJ_solve), -1.0), 1.0);
                var r=acos(_d);
                
              }
              if (r<0.0001)
                continue;
              err+=r;
              var totgs=0.0;
              var gs=glist[cnum];
              var seglen=(seg2==undefined) ? 1 : 2;
              for (var sj=0; sj<seglen; sj++) {
                  var seg=sj ? seg2 : seg1;
                  for (var j=0; j<order; j++) {
                      var orig=seg.ks[j];
                      seg.ks[j]+=df;
                      if (seg2!=undefined) {
                          var ta=seg1.derivative(s1, order), tb=seg2.derivative(s2, order);
                          if (doflip<0.0)
                            tb.negate();
                          ta.normalize();
                          tb.normalize();
                          var _d=Math.min(Math.max(ta.dot(tb), -1.0), 1.0);
                          var r2=acos(_d);
                          
                      }
                      else {
                        var ta=seg1.derivative(s1, order).normalize();
                        var _d=Math.min(Math.max(ta.dot($tan_RUDJ_solve), -1.0), 1.0);
                        var r2=acos(_d);
                        
                      }
                      var g=(r2-r)/df;
                      gs[sj*order+j] = g;
                      totgs+=g*g;
                      seg.ks[j] = orig;
                  }
              }
              if (totgs==0.0)
                continue;
              r/=totgs;
              var unstable=ratio<0.1;
              for (var sj=0; sj<seglen; sj++) {
                  var seg=sj ? seg2 : seg1;
                  for (var j=0; j<order; j++) {
                      var g=gs[sj*order+j];
                      if (order>2&&unstable&&(j==0||j==order-1)) {
                      }
                      seg.ks[j]+=-r*g*gk;
                  }
              }
              if (seg2!=undefined&&ratio>0.1&&!(v.flag&CBREAK)) {
                  var sz1=seg1.ks[KSCALE], sz2=seg2.ks[KSCALE];
                  var i1=s1*(order-1), i2=s2*(order-1);
                  var k1=seg1.ks[i1], k2=seg2.ks[i2];
                  var k=((k1/sz1)+(k2/sz2*doflip))/2.0;
                  seg1.ks[i1] = seg1.ks[i1]+(k*sz1-seg1.ks[i1])*1;
                  seg2.ks[i2] = seg2.ks[i2]+(k*doflip*sz2-seg2.ks[i2])*1;
              }
          }
        }
        for (var j=0; j<edge_segs.length; j++) {
            var seg=edge_segs[j];
            var ks=seg.ks;
            for (var k=0; k<ks.length; k++) {
                seg.ks[k] = seg._last_ks[k];
            }
        }
    }
  }
  solve = _es6_module.add_export('solve', solve);
}, '/dev/fairmotion/src/curve/solver_new.js');
es6_module_define('vectordraw_base', [], function _vectordraw_base_module(_es6_module) {
  "use strict";
  var VectorFlags={UPDATE: 2, 
   TAG: 4}
  VectorFlags = _es6_module.add_export('VectorFlags', VectorFlags);
  class VectorVertex extends Vector2 {
     constructor(co) {
      super(co);
    }
     loadSTRUCT(reader) {
      reader(this);
      this.load(this._vec);
      delete this._vec;
    }
  }
  _ESClass.register(VectorVertex);
  _es6_module.add_class(VectorVertex);
  VectorVertex = _es6_module.add_export('VectorVertex', VectorVertex);
  VectorVertex.STRUCT = `
VectorVertex {
  _vec : vec2;
}
`;
  class QuadBezPath  {
    
    
    
    
    
     constructor() {
      this.off = new Vector2();
      this.id = -1;
      this.z = undefined;
      this.blur = 0;
      this.size = [-1, -1];
      this.index = -1;
      this.color = new Vector4();
      this.aabb = [new Vector2(), new Vector2()];
      this.clip_paths = new set();
      this.clip_users = new set();
    }
     add_clip_path(path) {
      if (!this.clip_paths.has(path)) {
          this.update();
      }
      path.clip_users.add(this);
      this.clip_paths.add(path);
    }
     reset_clip_paths() {
      if (this.clip_paths.length>0) {
      }
      for (var path of this.clip_paths) {
          path.clip_users.remove(this);
      }
      this.clip_paths.reset();
    }
     update_aabb(draw, fast_mode=false) {
      throw new Error("implement me!");
    }
     beginPath() {
      throw new Error("implement me");
    }
     undo() {
      throw new Error("implement me");
    }
     moveTo(x, y) {
      this.lastx = x;
      this.lasty = y;
      throw new Error("implement me");
    }
     makeLine(x1, y1, x2, y2, w=2.0) {
      let dx=y1-y2, dy=x2-x1;
      let l=Math.sqrt(dx*dx+dy*dy);
      if (l===0.0) {
          return ;
      }
      l = 0.5*w/l;
      dx*=l;
      dy*=l;
      this.moveTo(x1-dx, y1-dy);
      this.lineTo(x2-dx, y2-dy);
      this.lineTo(x2+dx, y2+dy);
      this.lineTo(x1+dx, y1+dy);
      this.lineTo(x1-dx, y1-dy);
    }
     bezierTo(x2, y2, x3, y3) {
      this.lastx = x3;
      this.lasty = y3;
      throw new Error("implement me");
    }
     cubicTo(x2, y2, x3, y3, x4, y4, subdiv=1) {
      var x1=this.lastx, y1=this.lasty;
      if (subdiv>0) {
          var dx1=(x2-x1)*0.5, dy1=(y2-y1)*0.5;
          var dx2=(x4-x3)*0.5, dy2=(y4-y3)*0.5;
          var dxmid=(x3+x4-x2-x1)*0.25;
          var dymid=(y3+y4-y2-y1)*0.25;
          var midx=(3*x3+x4+3*x2+x1)/8.0;
          var midy=(3*y3+y4+3*y2+y1)/8.0;
          this.cubicTo(x2+dx1, y2+dy1, midx-dxmid, midy-dymid, midx, midy, subdiv-1);
          this.cubicTo(midx+dxmid, midy+dymid, x4-dx2, y4-dy2, x4, y4, subdiv-1);
          return ;
      }
      var dx1=(x2-x1)*3.0, dy1=(y2-y1)*3.0;
      var dx2=(x4-x3)*3.0, dy2=(y4-y3)*3.0;
      var tdiv=(dx1*dy2-dx2*dy1);
      var t=(-(x1-x4)*dy2+(y1-y4)*dx2);
      var midx, midy;
      if (tdiv!=0.0) {
          t/=tdiv;
          midx = x1+dx1*t;
          midy = y1+dy1*t;
      }
      else {
        midx = (x2+x3)*0.5;
        midy = (y2+y3)*0.5;
      }
      this.bezierTo(midx, midy, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     lineTo(x2, y2) {
      throw new Error("implement me");
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     reset(draw) {
      this.pan.zero();
    }
     draw(draw, offx=0, offy=0) {

    }
     update() {
      throw new Error("implement me!");
    }
     [Symbol.keystr]() {
      return this.id;
    }
  }
  _ESClass.register(QuadBezPath);
  _es6_module.add_class(QuadBezPath);
  QuadBezPath = _es6_module.add_export('QuadBezPath', QuadBezPath);
  var pop_transform_rets=new cachering(function () {
    return new Matrix4();
  }, 32);
  class VectorDraw  {
    
    
    
    
     constructor() {
      this.pan = new Vector2();
      this.do_blur = true;
      this.matstack = new Array(256);
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
      this.matrix = new Matrix4();
    }
     recalcAll() {
      this.regen = true;
    }
     clear() {

    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      throw new Error("implement me");
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      throw new Error("implement me");
    }
     remove(path) {
      for (var path2 of path.clip_users) {
          path2.clip_paths.remove(path);
          path2.update();
      }
      delete this.path_idmap[path.id];
      this.paths.remove(path);
      path.destroy(this);
    }
     update() {
      throw new Error("implement me");
    }
     destroy() {
      throw new Error("implement me");
    }
     draw() {
      throw new Error("implement me");
    }
     push_transform(mat, multiply_instead_of_load=true) {
      this.matstack[this.matstack.cur++].load(this.matrix);
      if (mat!=undefined&&multiply_instead_of_load) {
          this.matrix.multiply(mat);
      }
      else 
        if (mat!=undefined) {
          this.matrix.load(mat);
      }
    }
     pop_transform() {
      var ret=pop_transform_rets.next();
      ret.load(this.matrix);
      this.matrix.load(this.matstack[--this.matstack.cur]);
      return ret;
    }
     translate(x, y) {
      this.matrix.translate(x, y);
    }
     scale(x, y) {
      this.matrix.scale(x, y, 1.0);
    }
     rotate(th) {
      this.matrix.euler_rotate(0, 0, th);
    }
     set_matrix(matrix) {
      this.matrix.load(matrix);
    }
     get_matrix() {
      return this.matrix;
    }
  }
  _ESClass.register(VectorDraw);
  _es6_module.add_class(VectorDraw);
  VectorDraw = _es6_module.add_export('VectorDraw', VectorDraw);
}, '/dev/fairmotion/src/vectordraw/vectordraw_base.js');
es6_module_define('vectordraw_canvas2d', ["./vectordraw_base.js", "../path.ux/scripts/util/math.js", "../config/config.js", "../path.ux/scripts/util/util.js", "./vectordraw_jobs_base.js", "./vectordraw_jobs.js", "../util/mathlib.js"], function _vectordraw_canvas2d_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var math=es6_import(_es6_module, '../path.ux/scripts/util/math.js');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var OPCODES=es6_import_item(_es6_module, './vectordraw_jobs_base.js', 'OPCODES');
  var vectordraw_jobs=es6_import(_es6_module, './vectordraw_jobs.js');
  let debug=0;
  var canvaspath_draw_mat_tmps=new cachering(function () {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(16);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  let MOVETO=OPCODES.MOVETO, BEZIERTO=OPCODES.QUADRATIC, LINETO=OPCODES.LINETO, BEGINPATH=OPCODES.BEGINPATH, CUBICTO=OPCODES.CUBIC, CLOSEPATH=OPCODES.CLOSEPATH;
  let arglens={}
  arglens[BEGINPATH] = 0;
  arglens[CLOSEPATH] = 0;
  arglens[MOVETO] = 2;
  arglens[LINETO] = 2;
  arglens[BEZIERTO] = 4;
  arglens[CUBICTO] = 6;
  let render_idgen=1;
  let batch_iden=1;
  class Batch  {
    
    
    
    
    
    
    
    
    
    
     constructor() {
      this._batch_id = batch_iden++;
      this.generation = 0;
      this.isBlurBatch = false;
      this.dpi_scale = 1.0;
      this.paths = [];
      this.path_idmap = {};
      this.regen = 1;
      this.gen_req = 0;
      this._last_pan = new Vector2();
      this.viewport = {pos: [0, 0], 
     size: [1, 1]};
      this.realViewport = {pos: [0, 0], 
     size: [1, 1]};
      this.patharea = 0;
    }
    set  regen(v) {
      this._regen = v;
      if (debug&&v) {
          console.warn("Regen called");
      }
    }
    get  regen() {
      return this._regen;
    }
     add(p) {
      if (this.has(p)) {
          return ;
      }
      this.generation = 0;
      let draw={matrix: new Matrix4()};
      p.update_aabb(draw);
      let min=p.aabb[0], max=p.aabb[1];
      if (p.blur>0) {
          min.addScalar(-p.blur*0.5);
          max.addScalar(p.blur*0.5);
      }
      let w=max[0]-min[0];
      let h=max[1]-min[1];
      this.patharea+=w*h;
      p._batch = this;
      this.regen = 1;
      if (!p._batch_id) {
          p._batch_id = batch_iden++;
      }
      this.path_idmap[p._batch_id] = p;
      this.paths.push(p);
    }
     remove(p) {
      p._batch = undefined;
      if (!this.has(p)) {
          return ;
      }
      this.regen = 1;
      p._batch = undefined;
      this.paths.remove(p);
      delete this.path_idmap[p._batch_id];
      return this;
    }
     destroy() {
      this.patharea = 0;
      console.warn("destroying batch", this.length);
      for (let p of this.paths) {
          p._batch = undefined;
      }
      this.paths.length = 0;
      this.path_idmap = {};
      this.regen = 1;
      this.gen_req = 0;
    }
     has(p) {
      if (!p._batch_id)
        return false;
      return p._batch_id in this.path_idmap;
    }
     checkViewport(draw) {
      let canvas=draw.canvas;
      let p=new Vector2(draw.pan);
      p[1] = draw.canvas.height-p[1];
      p.sub(this._last_pan);
      let cv={pos: new Vector2(), 
     size: new Vector2([canvas.width, canvas.height])};
      cv.pos[0]-=p[0];
      cv.pos[1]-=p[1];
      let clip1=math.aabb_intersect_2d(this.viewport.pos, this.viewport.size, cv.pos, cv.size);
      let clip2=math.aabb_intersect_2d(this.realViewport.pos, this.realViewport.size, cv.pos, cv.size);
      const debug=0;
      if (debug) {
          console.log("\n===\n");
          console.log("dpan:", p);
          console.log(cv.pos, cv.size);
          if (clip1)
            console.log("clip1", clip1.pos, clip1.size);
          if (clip2)
            console.log("clip2", clip2.pos, clip2.size);
      }
      if (!clip1||!clip2) {
          if (debug) {
              console.log("clip is bad 1:", clip1, clip2, !!clip1!==!!clip2);
          }
          return !!clip1!==!!clip2;
      }
      clip1.pos.floor();
      clip1.size.floor();
      clip2.pos.floor();
      clip2.size.floor();
      let bad=clip1.pos.vectorDistance(clip2.pos)>2;
      bad = bad||clip1.size.vectorDistance(clip2.size)>2;
      if (debug) {
          console.log("clip is bad 2:", bad);
      }
      return bad;
    }
     _getPaddedViewport(canvas, cpad=512) {
      let dpi_scale=canvas.dpi_scale*this.dpi_scale;
      cpad/=dpi_scale;
      return {pos: new Vector2([-cpad, -cpad]), 
     size: new Vector2([canvas.width*canvas.dpi_scale+cpad*2, canvas.height*canvas.dpi_scale+cpad*2])}
    }
     gen(draw) {
      if (this.gen_req-->0) {
          return ;
      }
      this.gen_req = 10;
      this.regen = false;
      if (this.isBlurBatch) {
          let matrix=new Matrix4(draw.matrix);
          matrix.scale(this.dpi_scale, this.dpi_scale);
          draw.push_transform(matrix, false);
      }
      let canvas=draw.canvas, g=draw.g;
      if (debug)
        console.warn("generating batch of size "+this.paths.length);
      let ok=false;
      let min=new Vector2([1e+17, 1e+17]);
      let max=new Vector2([-1e+17, -1e+17]);
      let startmat=new Matrix4(draw.matrix);
      let zoom=draw.matrix.$matrix.m11;
      function setMat(p, set_off) {
        if (set_off===undefined) {
            set_off = false;
        }
        let mat=new Matrix4();
        if (set_off) {
            mat.translate(-min[0], -min[1], 0.0);
        }
        let m=new Matrix4(draw.matrix);
        mat.multiply(m);
        draw.push_transform(mat, false);
        return mat;
      }
      for (let p of this.paths) {
          setMat(p);
          p.update_aabb(draw);
          draw.pop_transform();
          min.min(p.aabb[0]);
          max.max(p.aabb[1]);
      }
      this.realViewport = {pos: new Vector2(min), 
     size: new Vector2(max).sub(min)};
      let min2=new Vector2(min);
      let size2=new Vector2(max);
      size2.sub(min2);
      let cpad=512;
      let cv=this._getPaddedViewport(canvas, cpad);
      let box=math.aabb_intersect_2d(min2, size2, cv.pos, cv.size);
      min2 = min2.floor();
      size2 = size2.floor();
      if (!box) {
          if (this.isBlurBatch) {
              draw.pop_transform();
          }
          return ;
      }
      min.load(box.pos);
      max.load(min).add(box.size);
      this.viewport = {pos: new Vector2(box.pos), 
     size: new Vector2(box.size)};
      let width=~~(max[0]-min[0]);
      let height=~~(max[1]-min[1]);
      let commands=[width, height];
      for (let p of this.paths) {
          setMat(p, true);
          p.gen(draw);
          let c2=p._commands;
          draw.pop_transform();
          for (let i=0; i<c2.length; i++) {
              commands.push(c2[i]);
          }
      }
      if (this.isBlurBatch) {
          draw.pop_transform();
      }
      let renderid=render_idgen++;
      if (commands.length===0) {
          this.gen_req = 0;
          return ;
      }
      commands = new Float64Array(commands);
      min = new Vector2(min);
      let last_pan=new Vector2(draw.pan);
      last_pan[1] = draw.canvas.height-last_pan[1];
      this.pending = true;
      vectordraw_jobs.manager.postRenderJob(renderid, commands).then((data) =>        {
        this.pending = false;
        if (this.onRenderDone) {
            this.onRenderDone(this);
        }
        if (debug)
          console.warn("Got render result!");
        this.gen_req = 0;
        this._last_pan.load(last_pan);
        this._image = data;
        this._image_off = min;
        this._draw_zoom = zoom;
        window.redraw_viewport();
      });
    }
     draw(draw) {
      if (this.paths.length===0) {
          return ;
      }
      if (!this.regen&&this.checkViewport(draw)&&!this.gen_req) {
          this.regen = 1;
          console.log("bad viewport");
      }
      let canvas=draw.canvas, g=draw.g;
      var zoom=draw.matrix.$matrix.m11;
      let offx=0, offy=0;
      let scale=zoom/this._draw_zoom;
      offx = draw.pan[0]-this._last_pan[0]*scale;
      offy = (draw.canvas.height-draw.pan[1])-this._last_pan[1]*scale;
      offx/=scale;
      offy/=scale;
      if (this.regen) {
          this.pending = true;
          this.gen(draw);
      }
      if (this._image===undefined) {
          return ;
      }
      g.imageSmoothingEnabled = !!this.isBlurBatch;
      if (this.paths.length===0&&this.generation>2) {
          this._image = undefined;
          return ;
      }
      if (this.generation>0) {
          this.generation++;
      }
      g.save();
      g.scale(scale, scale);
      g.translate(offx, offy);
      g.translate(this._image_off[0], this._image_off[1]);
      g.drawImage(this._image, 0, 0);
      g.restore();
    }
  }
  _ESClass.register(Batch);
  _es6_module.add_class(Batch);
  Batch = _es6_module.add_export('Batch', Batch);
  let canvaspath_temp_vs=util.cachering.fromConstructor(Vector2, 512);
  let canvaspath_temp_mats=util.cachering.fromConstructor(Matrix4, 128);
  class CanvasPath extends QuadBezPath {
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.dead = false;
      this.commands = [];
      this.recalc = 1;
      this._render_id = render_idgen++;
      this._image = undefined;
      this._image_off = [0, 0];
      this.lastx = 0;
      this.lasty = 0;
      this._aabb2 = [new Vector2(), new Vector2()];
      this._size2 = new Vector2();
      this.canvas = undefined;
      this.g = undefined;
      this.path_start_i = 2;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=canvaspath_temp_vs.next().zero();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=arglens[cmd];
        if (fast_mode&&prev!==BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++];
            tmp[1] = cs[i++];
            if (isNaN(tmp.dot(tmp))) {
                console.warn("NaN!");
                continue;
            }
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
      this.aabb[0].floor();
      this.aabb[1].ceil();
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     closePath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(CLOSEPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      let arglen=arguments.length;
      for (let i=0; i<arglen; i++) {
          if (isNaN(arguments[i])) {
              console.warn("NaN!");
          }
          let arg=arguments[i];
          this.commands.push(arg);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     cubicTo(x2, y2, x3, y3, x4, y4) {
      this._pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {
      if (this._batch) {
          this._batch.remove(this);
      }
      this.canvas = this.g = undefined;
      this._image = this.commands = undefined;
    }
     genInto(draw, path, commands, clip_mode=false) {
      let oldc=this.canvas, oldg=this.g, oldaabb=this.aabb, oldsize=this.size;
      this.aabb = this._aabb2;
      this.aabb[0].load(path.aabb[0]);
      this.aabb[1].load(path.aabb[1]);
      this.size = this._size2;
      this.size.load(path.size);
      this.gen_commands(draw, commands, undefined, true);
      this.canvas = oldc;
      this.g = oldg;
      this.aabb = oldaabb;
      this.size = oldsize;
    }
     gen_commands(draw, commands, _check_tag=0, clip_mode=false) {
      let m=this.matrix.$matrix;
      let r=~~(this.color[0]*255), g=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      let commands2=[];
      if (!clip_mode) {
          commands2 = commands2.concat([OPCODES.FILLSTYLE, r, g, b, a]);
          commands2 = commands2.concat([OPCODES.SETBLUR, this.blur]);
      }
      commands2.push(OPCODES.BEGINPATH);
      commands2 = commands2.concat(this.commands);
      commands2.push(clip_mode ? OPCODES.CLIP : OPCODES.FILL);
      for (let c of commands2) {
          commands.push(c);
      }
      return commands;
    }
     gen(draw, _check_tag=0, clip_mode=false, independent=false) {
      if (_check_tag&&!this.recalc) {
          console.log("infinite loop in clip stack");
          return ;
      }
      this.recalc = 0;
      var do_clip=this.clip_paths.length>0;
      var do_blur=this.blur>0.0;
      var zoom=draw.matrix.$matrix.m11;
      this.update_aabb(draw);
      var w=this.size[0] = Math.ceil(this.aabb[1][0]-this.aabb[0][0]);
      var h=this.size[1] = Math.ceil(this.aabb[1][1]-this.aabb[0][1]);
      if (w>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE||h>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE) {
          var w2=Math.min(w, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var h2=Math.min(h, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var dw=w-w2, dh=h-h2;
          this.aabb[0][0]+=dw*0.5;
          this.aabb[0][1]+=dh*0.5;
          this.aabb[1][0]-=dw*0.5;
          this.aabb[1][1]-=dh*0.5;
          this.size[0] = w2;
          this.size[1] = h2;
          w = w2, h = h2;
      }
      if (1) {
          var mat=canvaspath_draw_mat_tmps.next();
          mat.load(draw.matrix);
          this.matrix = mat;
      }
      if (isNaN(w)||isNaN(h)) {
          console.log("NaN path size", w, h, this);
          if (isNaN(w))
            w = 4.0;
          if (isNaN(h))
            h = 4.0;
      }
      let commands2=independent ? [w, h] : [];
      let m=this.matrix.$matrix;
      commands2 = commands2.concat([OPCODES.SETTRANSFORM, m.m11, m.m12, m.m21, m.m22, m.m41, m.m42]);
      commands2.push(OPCODES.SAVE);
      for (var path of this.clip_paths) {
          if (path.recalc) {
              if (debug)
                console.log("   clipping subgen!");
              path.gen(draw, 1);
          }
          let oldc=path.canvas, oldg=path.g, oldaabb=path.aabb, oldsize=path.size;
          path.genInto(draw, this, commands2, true);
      }
      this.gen_commands(draw, commands2, _check_tag, clip_mode);
      commands2.push(OPCODES.RESTORE);
      this._commands = commands2;
    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {
      offx+=this.off[0], offy+=this.off[1];
      if (this.recalc) {
          this.recalc = 0;
          this.gen(draw);
      }
      if (this._image===undefined) {
          return ;
      }
      g.imageSmoothingEnabled = false;
      g.drawImage(this._image, this._image_off[0]+offx, this._image_off[1]+offy);
      g.beginPath();
      g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
      g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
      g.fillStyle = "rgba(0,255,0,0.4)";
      g.fill();
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(CanvasPath);
  _es6_module.add_class(CanvasPath);
  CanvasPath = _es6_module.add_export('CanvasPath', CanvasPath);
  class Batches extends Array {
    
     constructor() {
      super();
      this.cur = 0;
      this.drawlist = [];
    }
     getHead(onBatchDone) {
      if (this.drawlist.length>0) {
          return this.drawlist[this.drawlist.length-1];
      }
      return this.requestBatch(onBatchDone);
    }
     requestBatch(onrenderdone) {
      let ret;
      if (this.cur<this.length) {
          this.drawlist.push(this[this.cur]);
          ret = this[this.cur++];
      }
      else {
        let b=new Batch();
        b.onRenderDone = onrenderdone;
        this.cur++;
        this.push(b);
        this.drawlist.push(this[this.length-1]);
        ret = this[this.length-1];
      }
      ret.isBlurBatch = false;
      return ret;
    }
     remove(batch) {
      let i=this.indexOf(batch);
      this.drawlist.remove(batch);
      if (this.cur>0&&this.cur<this.length-1) {
          let j=this.cur-1;
          this[i] = this[j];
          this.cur--;
      }
    }
     destroy() {
      this.drawlist.length = 0;
      this.cur = 0;
      if (debug)
        console.log("destroy batches");
      for (let b of list(this)) {
          if (b.generation>1) {
              super.remove(b);
          }
          b.generation++;
          b.destroy();
      }
    }
  }
  _ESClass.register(Batches);
  _es6_module.add_class(Batches);
  Batches = _es6_module.add_export('Batches', Batches);
  class CanvasDraw2D extends VectorDraw {
    
    
    
    
    
    
     constructor() {
      super();
      this.promise = undefined;
      this.on_batches_finish = undefined;
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      this._last_pan = new Vector2();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
      this.canvas = undefined;
      this.g = undefined;
      this.batches = new Batches();
      this.onBatchDone = this.onBatchDone.bind(this);
    }
     onBatchDone(batch) {
      let ok=true;
      for (let b of this.batches.drawlist) {
          if (b.pending) {
              ok = false;
          }
      }
      if (ok&&this.promise) {
          this.promise = undefined;
          this.on_batches_finish();
      }
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new CanvasPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!==z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      for (var path of this.paths) {
          path.update(this);
      }
    }
     destroy() {
      this.batches.destroy();
      for (var path of this.paths) {
          path.destroy(this);
      }
    }
    set  regen(v) {
      this.__regen = v;
      console.warn("regen");
    }
    get  regen() {
      return this.__regen;
    }
     clear() {
      this.recalcAll();
    }
     draw(g) {
      if (!!this.do_blur!==!!this._last_do_blur) {
          this._last_do_blur = !!this.do_blur;
          this.regen = 1;
          window.setTimeout(() =>            {
            window.redraw_viewport();
          }, 200);
      }
      if (this.regen) {
          console.log("RECALC ALL");
          this.__regen = 0;
          this.batches.destroy();
          this.update();
      }
      let batch;
      let blimit=this.paths.length<15 ? 15 : Math.ceil(this.paths.length/vectordraw_jobs.manager.max_threads);
      batch = this.batches.getHead(this.onBatchDone);
      var canvas=g.canvas;
      var off=canvaspath_draw_vs.next();
      let zoom=this.matrix.$matrix.m11;
      off.zero();
      this._last_pan.load(this.pan);
      if (this._last_zoom!==zoom) {
          this._last_zoom = zoom;
          for (let p of this.paths) {
              p.recalc = 1;
          }
      }
      for (var path of this.paths) {
          if (!path.recalc) {
              continue;
          }
          for (var path2 of path.clip_users) {
              path2.recalc = 1;
          }
      }
      for (var path of this.paths) {
          if (!path.recalc) {
              path.off.add(off);
          }
      }
      this.canvas = canvas;
      this.g = g;
      if (this.dosort) {
          if (debug)
            console.log("SORT");
          this.batches.destroy();
          batch = this.batches.requestBatch(this.onBatchDone);
          this.dosort = 0;
          this.paths.sort(function (a, b) {
            return a.z-b.z;
          });
      }
      for (var path of this.paths) {
          if (path.hidden) {
              if (path._batch) {
                  path._batch.remove(path);
              }
              continue;
          }
          let blurlimit=25;
          let needsblur=this.do_blur&&(path.blur*zoom>=blurlimit);
          needsblur = needsblur&&path.clip_paths.length===0;
          if (needsblur&&path._batch&&!path._batch.isBlurBatch) {
              this.regen = 1;
          }
          if (!needsblur&&path._batch&&path._batch.isBlurBatch) {
              this.regen = 1;
          }
          if (!path._batch) {
              let w1=batch.patharea/(canvas.width*canvas.height);
              let w2=this.batches.length>10 ? 1.0/(this.batches.length-9) : 0.0;
              if (needsblur) {
                  if (!batch.isBlurBatch) {
                      batch = this.batches.requestBatch(this.onBatchDone);
                      batch.isBlurBatch = true;
                      batch.dpi_scale = path.blur*zoom>50 ? 0.1 : 0.25;
                  }
                  else {
                    let scale=path.blur*zoom>50 ? 0.1 : 0.25;
                    batch.dpi_scale = Math.min(batch.dpi_scale, scale);
                  }
              }
              else 
                if (batch.isBlurBatch||(batch.paths.length*(1.0+w1*4.0)>blimit)) {
                  batch = this.batches.requestBatch(this.onBatchDone);
              }
              batch.add(path);
          }
          if (path.recalc&&path._batch) {
              path._batch.regen = 1;
              path.recalc = 0;
          }
          window.path1 = path;
      }
      window.batch = batch;
      window.batches = this.batches;
      for (let batch of this.batches.drawlist) {
          batch.draw(this);
      }
      if (!this.promise) {
          this.promise = new Promise((accept, reject) =>            {
            this.on_batches_finish = accept;
          });
      }
      let ok=true;
      for (let b of this.batches) {
          if (b.pending) {
              ok = false;
          }
      }
      if (ok) {
          window.setTimeout(() =>            {
            this.onBatchDone();
          });
      }
      return this.promise;
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
    }
  }
  _ESClass.register(CanvasDraw2D);
  _es6_module.add_class(CanvasDraw2D);
  CanvasDraw2D = _es6_module.add_export('CanvasDraw2D', CanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d.js');
es6_module_define('vectordraw_stub', ["../util/mathlib.js", "../config/config.js", "./vectordraw_base.js"], function _vectordraw_stub_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  class StubCanvasPath extends QuadBezPath {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!=BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     gen(draw, _check_tag=0) {

    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {

    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(StubCanvasPath);
  _es6_module.add_class(StubCanvasPath);
  StubCanvasPath = _es6_module.add_export('StubCanvasPath', StubCanvasPath);
  class StubCanvasDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret==undefined) {
          ret = document.createElement("canvas");
          ret.id = id;
      }
      ret.width = width;
      ret.height = height;
      if (ret.style!=undefined) {
          ret.style["z-index"] = zindex;
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new StubCanvasPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.dosort = 1;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!=z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {

    }
    static  kill_canvas(svg) {

    }
     destroy() {

    }
     draw(g) {
      var canvas=g.canvas;
      canvas.style["background"] = "rgba(0,0,0,0)";
      this.canvas = canvas;
      this.g = g;
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(StubCanvasDraw2D);
  _es6_module.add_class(StubCanvasDraw2D);
  StubCanvasDraw2D = _es6_module.add_export('StubCanvasDraw2D', StubCanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_stub.js');
es6_module_define('vectordraw_canvas2d_simple', ["../util/mathlib.js", "./vectordraw_base.js", "../config/config.js"], function _vectordraw_canvas2d_simple_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var debug=0;
  window._setDebug = (d) =>    {
    debug = d;
  }
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3, CUBICTO=4;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  let lasttime=performance.now();
  class SimpleCanvasPath extends QuadBezPath {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!=BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     cubicTo(x2, y2, x3, y3, x4, y4) {
      this._pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     gen(draw, _check_tag=0) {

    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g, clipMode=false) {
      var zoom=draw.matrix.$matrix.m11;
      offx+=this.off[0], offy+=this.off[1];
      if (isNaN(offx)||isNaN(offy)) {
          throw new Error("nan!");
      }
      this._last_z = this.z;
      var g=draw.g;
      var tmp=new Vector3();
      let debuglog=function () {
        if (debug>1) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      let debuglog2=function () {
        if (debug>0) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      debuglog2("start "+this.id);
      let matrix=draw.matrix;
      g.beginPath();
      let cmds=this.commands;
      let i;
      let mat2=new Matrix4(draw.matrix);
      mat2.invert();
      function loadtemp(off) {
        tmp[0] = cmds[i+2+off*2];
        tmp[1] = cmds[i+3+off*2];
        tmp[2] = 0.0;
        tmp.multVecMatrix(draw.matrix);
        if (isNaN(tmp.dot(tmp))) {
            throw new Error("NaN");
        }
      }
      if (!clipMode&&this.clip_paths.length>0) {
          g.beginPath();
          g.save();
          for (let path of this.clip_paths) {
              path.draw(draw, offx, offy, canvas, g, true);
          }
          g.clip();
      }
      for (i = 0; i<cmds.length; i+=cmds[i+1]+2) {
          var cmd=cmds[i];
          switch (cmd) {
            case BEGINPATH:
              debuglog("BEGINPATH");
              g.beginPath();
              break;
            case LINETO:
              debuglog("LINETO");
              loadtemp(0);
              g.lineTo(tmp[0], tmp[1]);
              break;
            case BEZIERTO:
              debuglog("BEZIERTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              g.quadraticCurveTo(x1, y1, tmp[0], tmp[1]);
              break;
            case CUBICTO:
              debuglog("CUBICTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              var x2=tmp[0], y2=tmp[1];
              loadtemp(2);
              g.bezierCurveTo(x1, y1, x2, y2, tmp[0], tmp[1]);
              break;
            case MOVETO:
              debuglog("MOVETO");
              loadtemp(0);
              g.moveTo(tmp[0], tmp[1]);
              break;
          }
      }
      if (clipMode) {
          return ;
      }
      var r=~~(this.color[0]*255), g1=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      let fstyle="rgba("+r+","+g1+","+b+","+a+")";
      g.fillStyle = fstyle;
      debuglog2("g.fillStyle", g.fillStyle);
      var doff=2500;
      var do_blur=this.blur>1&&!clipMode;
      if (do_blur) {
          g.filter = "blur("+(this.blur*0.25*zoom)+"px)";
      }
      else {
        g.filter = "none";
      }
      debuglog2("fill");
      g.fill();
      if (this.clip_paths.length>0) {
          g.restore();
      }
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(SimpleCanvasPath);
  _es6_module.add_class(SimpleCanvasPath);
  SimpleCanvasPath = _es6_module.add_export('SimpleCanvasPath', SimpleCanvasPath);
  class SimpleCanvasDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret==undefined) {
          ret = document.createElement("canvas");
          ret.id = id;
      }
      ret.width = width;
      ret.height = height;
      if (ret.style!=undefined) {
          ret.style["z-index"] = zindex;
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new SimpleCanvasPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.dosort = 1;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!=z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      console.warn("update called");
      for (let p of this.paths) {
          p.update();
      }
    }
    static  kill_canvas(svg) {

    }
     destroy() {

    }
     draw(g) {
      var canvas=g.canvas;
      this.canvas = canvas;
      this.g = g;
      g.save();
      g.resetTransform();
      for (var p of this.paths) {
          p.draw(this);
      }
      g.restore();
      return new Promise((accept, reject) =>        {
        accept();
      });
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(SimpleCanvasDraw2D);
  _es6_module.add_class(SimpleCanvasDraw2D);
  SimpleCanvasDraw2D = _es6_module.add_export('SimpleCanvasDraw2D', SimpleCanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d_simple.js');
es6_module_define('vectordraw_skia_simple', ["./vectordraw_base.js", "../config/config.js", "../util/mathlib.js"], function _vectordraw_skia_simple_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  function loadCanvasKit() {
    let script=document.createElement("script");
    script.setAttribute("type", "application/javascript");
    script.setAttribute("src", "node_modules/canvaskit-wasm/bin/canvaskit.js");
    script.addEventListener("load", () =>      {
      console.log("%cInitializing Skia. . .", "color: blue;");
      CanvasKitInit({locateFile: (file) =>          {
          return 'node_modules/canvaskit-wasm/bin/'+file;
        }}).ready().then((CanvasKit) =>        {
        console.log("%c CanvasKit initialized", "color: blue");
        window.CanvasKit = CanvasKit;
      });
    });
    document.body.appendChild(script);
  }
  loadCanvasKit = _es6_module.add_export('loadCanvasKit', loadCanvasKit);
  window.loadCanvasKit = loadCanvasKit;
  var debug=0;
  window._setDebug = (d) =>    {
    debug = d;
  }
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3, CUBICTO=4;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  let lasttime=performance.now();
  class SimpleSkiaPath extends QuadBezPath {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!=BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     cubicTo(x2, y2, x3, y3, x4, y4) {
      this._pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     gen(draw, _check_tag=0) {

    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx, offy, canvas=draw.canvsa, g=draw.g, clipMode=false) {
      return this.drawCanvas(...arguments);
    }
     drawCanvas(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g, clipMode=false) {
      var zoom=draw.matrix.$matrix.m11;
      offx+=this.off[0], offy+=this.off[1];
      if (isNaN(offx)||isNaN(offy)) {
          throw new Error("nan!");
      }
      this._last_z = this.z;
      var g=draw.g;
      var tmp=new Vector3();
      let debuglog=function () {
        if (debug>1) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      let debuglog2=function () {
        if (debug>0) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      debuglog2("start "+this.id);
      let matrix=draw.matrix;
      g.beginPath();
      let cmds=this.commands;
      let i;
      let mat2=new Matrix4(draw.matrix);
      mat2.invert();
      function loadtemp(off) {
        tmp[0] = cmds[i+2+off*2];
        tmp[1] = cmds[i+3+off*2];
        tmp[2] = 0.0;
        tmp.multVecMatrix(draw.matrix);
        if (isNaN(tmp.dot(tmp))) {
            throw new Error("NaN");
        }
      }
      if (!clipMode&&this.clip_paths.length>0) {
          g.beginPath();
          g.save();
          for (let path of this.clip_paths) {
              path.draw(draw, offx, offy, canvas, g, true);
          }
          g.clip();
      }
      for (i = 0; i<cmds.length; i+=cmds[i+1]+2) {
          var cmd=cmds[i];
          switch (cmd) {
            case BEGINPATH:
              debuglog("BEGINPATH");
              g.beginPath();
              break;
            case LINETO:
              debuglog("LINETO");
              loadtemp(0);
              g.lineTo(tmp[0], tmp[1]);
              break;
            case BEZIERTO:
              debuglog("BEZIERTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              g.quadraticCurveTo(x1, y1, tmp[0], tmp[1]);
              break;
            case CUBICTO:
              debuglog("CUBICTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              var x2=tmp[0], y2=tmp[1];
              loadtemp(2);
              g.bezierCurveTo(x1, y1, x2, y2, tmp[0], tmp[1]);
              break;
            case MOVETO:
              debuglog("MOVETO");
              loadtemp(0);
              g.moveTo(tmp[0], tmp[1]);
              break;
          }
      }
      if (clipMode) {
          return ;
      }
      var r=~~(this.color[0]*255), g1=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      let fstyle="rgba("+r+","+g1+","+b+","+a+")";
      g.fillStyle = fstyle;
      debuglog2("g.fillStyle", g.fillStyle);
      var doff=2500;
      var do_blur=this.blur>1&&!clipMode;
      if (do_blur) {
          g.filter = "blur("+(this.blur*0.25*zoom)+"px)";
      }
      else {
        g.filter = "none";
      }
      debuglog2("fill");
      g.fill();
      if (this.clip_paths.length>0) {
          g.restore();
      }
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(SimpleSkiaPath);
  _es6_module.add_class(SimpleSkiaPath);
  SimpleSkiaPath = _es6_module.add_export('SimpleSkiaPath', SimpleSkiaPath);
  class SimpleSkiaDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret===undefined) {
          ret = document.createElement("canvas");
          ret.id = id;
      }
      ret.width = width;
      ret.height = height;
      if (ret.style!=undefined) {
          ret.style["z-index"] = zindex;
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new SimpleSkiaPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.dosort = 1;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!=z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      console.warn("update called");
      for (let p of this.paths) {
          p.update();
      }
    }
    static  kill_canvas(svg) {

    }
     destroy() {

    }
     draw(g) {
      var canvas=g.canvas;
      this.canvas = canvas;
      this.g = g;
      let canvas0, g0;
      if (0) {
          this.canvas = canvas = window.skcanvas;
          this.g = g = window.skg;
      }
      else 
        if (window.CanvasKit!==undefined) {
          canvas0 = canvas;
          g0 = g;
          canvas = CanvasKit.MakeCanvas(canvas.width, canvas.height);
          canvas.width = canvas0.width;
          canvas.height = canvas0.height;
          let mat=g0.getTransform();
          let g2=canvas.getContext("2d");
          g2.globalAlpha = 1.0;
          g2.globalCompositeOperation = "source-over";
          this.canvas = canvas;
          this.g = g2;
          g = g2;
      }
      g.save();
      g.resetTransform();
      for (var p of this.paths) {
          p.draw(this, undefined, undefined, this.canvas, this.g);
      }
      g.restore();
      if (canvas0) {
          this.g.beginPath();
          this.g.rect(0, 0, 500, 500);
          this.g.fillStyle = "rgb(255, 200, 200)";
          this.g.fill();
          this.canvas.Il.flush();
          let image=this.g.getImageData(0, 0, canvas0.width, canvas0.height);
          let image2=new ImageData(canvas0.width, canvas0.height);
          image2.data.set(image.data);
          console.log(image2);
          for (let i=0; i<image2.data.length; i+=4) {
              image2.data[i] = image.data[i];
              image2.data[i+1] = image.data[i+1];
              image2.data[i+2] = image.data[i+2];
              image2.data[i+3] = 255;
          }
          g0.putImageData(image2, 0, 0);
          window.skcanvas = this.canvas;
          window.skg = this.g;
          canvas.dispose();
      }
      return new Promise((accept, reject) =>        {
        accept();
      });
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(SimpleSkiaDraw2D);
  _es6_module.add_class(SimpleSkiaDraw2D);
  SimpleSkiaDraw2D = _es6_module.add_export('SimpleSkiaDraw2D', SimpleSkiaDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_skia_simple.js');
es6_module_define('vectordraw_svg', ["./vectordraw_base.js", "../util/mathlib.js", "../config/config.js"], function _vectordraw_svg_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  class SVGPath extends QuadBezPath {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!=BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      this.commands.push(arguments[0]);
      var arglen=arguments.length-1;
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {
      if (this.domnode!=undefined) {
          this.domnode.remove();
          this.domnode = undefined;
      }
      if (this.filternode!=undefined) {
          this.filternode.remove();
          this.filternode = undefined;
      }
      if (this.usenode!=undefined) {
          this.usenode.remove();
          this.usenode = undefined;
      }
    }
     get_dom_id(draw) {
      return draw.svg.id+"_path_"+this.id;
    }
     gen(draw, _check_tag=0) {
      if (_check_tag&&!this.recalc) {
          console.log("infinite loop in clip stack");
          return ;
      }
      this.recalc = 0;
      var do_clip=this.clip_paths.length>0;
      var do_blur=this.blur>0.0;
      this.update_aabb(draw);
      var w=this.size[0] = Math.ceil(this.aabb[1][0]-this.aabb[0][0]);
      var h=this.size[1] = Math.ceil(this.aabb[1][1]-this.aabb[0][1]);
      if (w>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE||h>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE) {
          var w2=Math.min(w, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var h2=Math.min(h, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var dw=w-w2, dh=h-h2;
          this.aabb[0][0]+=dw*0.5;
          this.aabb[0][1]+=dh*0.5;
          this.aabb[1][0]-=dw*0.5;
          this.aabb[1][1]-=dh*0.5;
          this.size[0] = w2;
          this.size[1] = h2;
          w = w2, h = h2;
      }
      var domid=this.get_dom_id(draw);
      var node=this.domnode;
      if (node==undefined) {
          node = this.domnode = document.getElementById(domid);
          if (node==undefined) {
              node = this.domnode = makeElement("path");
              node.id = domid;
              node.setAttributeNS(null, "id", domid);
              draw.defs.appendChild(node);
              var useid=domid+"_use";
              var usenode=document.getElementById(useid);
              if (usenode!=undefined) {
                  usenode.remove();
              }
              usenode = makeElement("use", {"id": useid});
              usenode.setAttributeNS(XLS, "xlink:href", "#"+domid);
              draw.group.appendChild(usenode);
              this.usenode = usenode;
          }
      }
      if (this.usenode==undefined) {
          this.usenode = document.getElementById(domid+"_use");
      }
      for (var i=0; i<draw.group.childNodes.length; i++) {
          if (draw.group.childNodes[i]===this.usenode) {
              this._last_z = i;
              break;
          }
      }
      var fid=draw.svg.id+"_"+this.id+"_blur";
      var blur, filter;
      if (this.blur*draw.zoom>1) {
          if (this.filternode==undefined) {
              filter = this.filternode = document.getElementById(fid);
          }
          else {
            filter = this.filternode;
          }
          var w2=w-this.pad*2, h2=h-this.pad*2;
          var wratio=2.0*(w/w2)*100.0, hratio=2.0*(h/h2)*100.0;
          var fx=""+(-wratio/4)+"%", fy=""+(-hratio/4)+"%", fwidth=""+wratio+"%", fheight=""+hratio+"%";
          if (filter==undefined) {
              var defs=draw.defs;
              var filter=this.filternode = makeElement("filter", {id: fid, 
         x: fx, 
         y: fy, 
         width: fwidth, 
         height: fheight});
              var blur=makeElement("feGaussianBlur", {stdDeviation: ~~(this.blur*draw.zoom*0.5), 
         "in": "SourceGraphic"});
              filter.appendChild(blur);
              defs.appendChild(filter);
              node.setAttributeNS(null, "filter", "url(#"+fid+")");
          }
          else {
            if (filter.getAttributeNS(null, "x")!=fx)
              filter.setAttributeNS(null, "x", fx);
            if (filter.getAttributeNS(null, "y")!=fy)
              filter.setAttributeNS(null, "y", fy);
            if (filter.getAttributeNS(null, "width")!=fwidth)
              filter.setAttributeNS(null, "width", fwidth);
            if (filter.getAttributeNS(null, "height")!=fheight)
              filter.setAttributeNS(null, "hratio", fheight);
            blur = filter.childNodes[0];
            if (!blur.hasAttributeNS(null, "stdDeviation")||parseFloat(blur.getAttributeNS(null, "stdDeviation"))!=~~(this.blur*draw.zoom*0.5)) {
                blur.setAttributeNS(null, "stdDeviation", ~~(this.blur*draw.zoom*0.5));
            }
          }
      }
      else 
        if (this.filternode!=undefined) {
          node.removeAttributeNS(null, "filter");
          this.filternode.remove();
          this.filternode = undefined;
      }
      var clipid=draw.svg.id+"_"+this.id+"_clip";
      if (this.clip_paths.length>0) {
          var clip=this.clipnode;
          if (clip==undefined) {
              clip = this.clipnode = document.getElementById(clipid);
          }
          if (clip==undefined) {
              clip = this.clipnode = makeElement("clipPath", {id: clipid});
              draw.defs.appendChild(clip);
              for (var path of this.clip_paths) {
                  if (path.recalc) {
                      console.log("  clipping subgen!");
                      path.gen(draw, 1);
                  }
                  var usenode=makeElement("use");
                  usenode.setAttributeNS(XLS, "xlink:href", "#"+path.domnode.getAttributeNS(null, "id"));
                  clip.appendChild(usenode);
              }
          }
          node.setAttributeNS(null, "clip-path", "url(#"+clipid+")");
      }
      else 
        if (this.clipnode!=undefined) {
          node.removeAttributeNS(null, "clip-path");
          this.clipnode.remove();
          this.clipnode = undefined;
      }
      var mat=canvaspath_draw_mat_tmps.next();
      mat.load(draw.matrix);
      var co=canvaspath_draw_vs.next().zero();
      if (node==undefined) {
          node = document.getElementById(domid);
          console.log("undefined node!", this.domnode, document.getElementById(domid), domid);
          return ;
      }
      var r=~~(this.color[0]*255), g=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      node.setAttributeNS(null, "fill", "rgba("+r+","+g+","+b+","+a+")");
      var d="";
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        var tmp=canvaspath_draw_args_tmps[arglen];
        var h=parseFloat(draw.svg.getAttributeNS(null, "height"));
        for (var j=0; j<arglen; j+=2) {
            co[0] = cs[i++], co[1] = cs[i++];
            co.multVecMatrix(mat);
            if (isNaN(co[0])) {
                co[0] = 0;
            }
            if (isNaN(co[1])) {
                co[1] = 0;
            }
            tmp[j] = co[0], tmp[j+1] = co[1];
        }
        switch (cmd) {
          case MOVETO:
            d+="M"+tmp[0]+" "+tmp[1];
            break;
          case LINETO:
            d+="L"+tmp[0]+" "+tmp[1];
            break;
          case BEZIERTO:
            d+="Q"+tmp[0]+" "+tmp[1]+" "+tmp[2]+" "+tmp[3];
            break;
          case BEGINPATH:
            break;
        }
      }
      node.setAttributeNS(null, "d", d);
    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {
      offx+=this.off[0], offy+=this.off[1];
      this._last_z = this.z;
      if (this.recalc) {
          this.recalc = 0;
          this.gen(draw);
      }
      if (this._last_off[0]!=offx||this._last_off[1]!=offy) {
          this._last_off[0] = offx;
          this._last_off[1] = offy;
          var transform="translate("+offx+","+offy+")";
          this.usenode.setAttributeNS(null, "transform", transform);
      }
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(SVGPath);
  _es6_module.add_class(SVGPath);
  SVGPath = _es6_module.add_export('SVGPath', SVGPath);
  class SVGDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret==undefined) {
          ret = makeElement("svg", {width: width, 
       height: height});
          ret.id = id;
          ret.setAttributeNS(null, "id", id);
          ret.style["position"] = "absolute";
          ret.style["z-index"] = zindex;
          console.trace("\tZINDEX: ", zindex);
          document.body.appendChild(ret);
      }
      if (ret.width!=width) {
          ret.setAttributeNS(null, "width", width);
      }
      if (ret.height!=height) {
          ret.setAttributeNS(null, "height", height);
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new SVGPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!=z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      for (var path of this.paths) {

      }
    }
    static  kill_canvas(svg) {
      if (svg!=undefined) {
          svg.remove();
      }
    }
     destroy() {
      return ;
      console.log("DESTROY!");
      for (var path of this.paths) {
          path.destroy(this);
      }
      this.paths.length = 0;
      this.path_idmap = {};
      if (this.svg!=undefined) {
          this.svg.remove();
          this.svg = this.defs = undefined;
      }
    }
     draw(g) {
      var canvas=g.canvas;
      if (canvas.style["background"]!="rgba(0,0,0,0)") {
          canvas.style["background"] = "rgba(0,0,0,0)";
      }
      this.svg = SVGDraw2D.get_canvas(canvas.id+"_svg", canvas.width, canvas.height, 1);
      var this2=this;
      function onkillscreen() {
        window.removeEventListener(onkillscreen);
        SVGDraw2D.kill_canvas(this2.svg);
        this2.svg = undefined;
      }
      window.addEventListener("killscreen", onkillscreen);
      var defsid=this.svg.id+"_defs";
      var defs=document.getElementById(defsid);
      if (defs==undefined) {
          defs = makeElement("defs", {id: defsid});
          defs.id = defsid;
          this.svg.appendChild(defs);
      }
      this.defs = defs;
      var groupid=this.svg.id+"_maingroup";
      var group=document.getElementById(groupid);
      if (group==undefined) {
          group = makeElement("g", {id: groupid});
          this.svg.appendChild(group);
      }
      this.group = group;
      var transform="translate("+this.pan[0]+","+this.pan[1]+")";
      if (!group.hasAttributeNS(null, "transform")||group.getAttributeNS(null, "transform")!=transform) {
          group.setAttributeNS(null, "transform", transform);
      }
      if (this.svg.style["left"]!=canvas.style["left"])
        this.svg.style["left"] = canvas.style["left"];
      if (this.svg.style["top"]!=canvas.style["top"])
        this.svg.style["top"] = canvas.style["top"];
      for (var path of this.paths) {
          if (path.z!=path._last_z) {
              this.dosort = 1;
              path.recalc = 1;
              path._last_z = path.z;
          }
      }
      for (var path of this.paths) {
          if (path.recalc) {
              path.gen(this);
          }
      }
      if (this.dosort) {
          console.log("SVG sort!");
          this.dosort = 0;
          this.paths.sort(function (a, b) {
            return a.z-b.z;
          });
          var cs=this.group.childNodes;
          for (var i=0; i<cs.length; i++) {
              var n=cs[i];
              if (n.tagName.toUpperCase()=="USE") {
                  n.remove();
                  i--;
              }
          }
          for (var path of this.paths) {
              if (path.hidden) {
                  path.usenode = undefined;
                  continue;
              }
              var useid=path.get_dom_id(this)+"_use";
              var usenode=path.usenode = makeElement("use", {"id": useid});
              usenode.setAttributeNS(XLS, "xlink:href", "#"+path.get_dom_id(this));
              path._last_off[0] = path._last_off[1] = 1e+17;
              this.group.appendChild(usenode);
          }
      }
      for (var path of this.paths) {
          if (!path.hidden)
            path.draw(this);
      }
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(SVGDraw2D);
  _es6_module.add_class(SVGDraw2D);
  SVGDraw2D = _es6_module.add_export('SVGDraw2D', SVGDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_svg.js');
es6_module_define('vectordraw_canvas2d_jobs', [], function _vectordraw_canvas2d_jobs_module(_es6_module) {
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d_jobs.js');
es6_module_define('vectordraw_jobs', ["./vectordraw_jobs_base.js", "../../platforms/platform.js", "../path.ux/scripts/util/simple_events.js", "../core/eventmanager.js", "../config/config.js"], function _vectordraw_jobs_module(_es6_module) {
  "use strict";
  var eventmanager=es6_import(_es6_module, '../core/eventmanager.js');
  var MESSAGES=es6_import_item(_es6_module, './vectordraw_jobs_base.js', 'MESSAGES');
  let MS=MESSAGES;
  let Debug=0;
  let freeze_while_drawing=false;
  var platform=es6_import(_es6_module, '../../platforms/platform.js');
  var config=es6_import(_es6_module, '../config/config.js');
  var pushModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'popModalLight');
  var keymap=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'keymap');
  let MAX_THREADS=platform.app.numberOfCPUs()+1;
  MAX_THREADS = Math.max(MAX_THREADS, 2);
  if (config.HTML5_APP_MODE) {
      MAX_THREADS = 1;
  }
  window.MAX_THREADS = MAX_THREADS;
  class Thread  {
    
    
    
    
    
    
    
    
     constructor(worker, id, manager) {
      this.id = id;
      this.manager = manager;
      this.worker = worker;
      this.dead = false;
      this.queue = [];
      this.ready = false;
      this.lock = 0;
      this.owner = undefined;
      this.msgstate = undefined;
      worker.onmessage = this.onmessage.bind(this);
      this.ondone = null;
      this.callbacks = {};
      this.ownerid_msgid_map = {};
      this.msgid_ownerid_map = {};
      this.cancelset = new Set();
      this.freezelvl = 0;
    }
     cancelRenderJob(ownerid) {
      if (this.cancelset.has(ownerid)) {
          return ;
      }
      if (ownerid in this.ownerid_msgid_map) {
          if (Debug)
            console.log("cancelling job ", ownerid, "in thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
          this.freezelvl--;
          let oldid=this.msgid_ownerid_map[ownerid];
          this.postMessage(MS.CANCEL_JOB, oldid);
          delete this.ownerid_msgid_map[ownerid];
          delete this.msgid_ownerid_map[oldid];
      }
      else {
        if (Debug)
          console.log("Bad owner id", ownerid);
      }
    }
     postRenderJob(ownerid, commands, datablocks) {
      let id=this.manager._rthread_idgen++;
      if (Debug)
        console.log("thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
      this.freezelvl++;
      this.ownerid_msgid_map[ownerid] = id;
      this.msgid_ownerid_map[id] = ownerid;
      this.postMessage(MS.NEW_JOB, id, undefined);
      this.postMessage(MS.SET_COMMANDS, id, [commands.buffer]);
      if (datablocks!==undefined) {
          for (let block of datablocks) {
              this.postMessage(MS.ADD_DATABLOCK, id, [block]);
          }
      }
      return new Promise((accept, reject) =>        {
        let callback=(data) =>          {
          accept(data);
        }
        this.callbacks[id] = callback;
        this.postMessage(MS.RUN, id);
      });
    }
     clearOutstandingJobs() {
      this.freezelvl = 0;
      this.postMessage(MS.CLEAR_QUEUE, 0);
      this.callback = {};
      this.msgid_ownerid_map = {};
      this.ownerid_msgid_map = {};
    }
     onmessage(e) {
      switch (e.data.type) {
        case MS.WORKER_READY:
          console.log("%c Vectordraw worker ready", "color: blue");
          this.ready = true;
          this.manager.has_ready_thread = true;
          break;
        case MS.RESULT:
          let id=e.data.msgid;
          if (!(id in this.callbacks)) {
              if (Debug)
                console.warn("Renderthread callback not found for: ", id);
              return ;
          }
          let ownerid=this.msgid_ownerid_map[id];
          if (ownerid===undefined) {
              if (Debug)
                console.log("failed to find owner for", id, this);
              return ;
          }
          delete this.ownerid_msgid_map[ownerid];
          delete this.msgid_ownerid_map[id];
          let cb=this.callbacks[id];
          delete this.callbacks[id];
          this.freezelvl--;
          if (Debug)
            console.log("thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
          if (Debug)
            console.log(cb, e.data.data[0]);
          cb(e.data.data[0]);
          if (this.freezelvl<=0) {
              this.manager.on_thread_done(this);
              this.freezelvl = 0;
          }
          break;
      }
      if (Debug)
        console.log("event message in main thread", e);
    }
     tryLock(owner) {
      if (this.lock==0||this.owner===owner) {
          return true;
      }
      return false;
    }
     tryUnlock(owner) {
      if (this.lock==0||this.owner!==owner) {
          return false;
      }
      this.owner = undefined;
      this.lock = 0;
      return true;
    }
     postMessage(type, msgid, transfers) {
      this.worker.postMessage({type: type, 
     msgid: msgid, 
     data: transfers}, transfers);
    }
     close() {
      if (this.worker!==undefined) {
          this.worker.terminate();
          this.worker = undefined;
      }
      else {
        console.warn("Worker already killed once", this.id);
      }
    }
  }
  _ESClass.register(Thread);
  _es6_module.add_class(Thread);
  Thread = _es6_module.add_export('Thread', Thread);
  class ThreadManager  {
    
    
    
    
     constructor() {
      this.threads = [];
      this.drawing = false;
      this.thread_idmap = {};
      this._idgen = 0;
      this._rthread_idgen = 0;
      this.max_threads = MAX_THREADS;
      this.start_time = undefined;
      window.setInterval(() =>        {
        if (this.drawing&&time_ms()-this.start_time>750) {
            console.log("Draw timed out; aborting draw freeze");
            this.endDrawing();
        }
        return ;
      }, 750);
    }
     setMaxThreads(n) {
      if (n===undefined||typeof n!="number"||n<0) {
          throw new Error("n must be a number");
      }
      this.max_threads = n;
      while (this.threads.length>n) {
        let thread=this.threads.pop();
        thread.worker.terminate();
      }
      while (this.threads.length<n) {
        if (config.HAVE_SKIA) {
            this.spawnThread("vectordraw_skia_worker.js");
        }
        else {
          this.spawnThread("vectordraw_canvas2d_worker.js");
        }
      }
    }
     startDrawing() {
      this.drawing = true;
      this.start_time = time_ms();
      if (freeze_while_drawing) {
          console.log("%cFreeze Drawing", "color : orange;");
          window._block_drawing = true;
      }
    }
     endDrawing() {
      this.drawing = false;
      if (freeze_while_drawing) {
          console.log("%cUnfreeze Drawing", "color : orange;");
          window._block_drawing = false;
      }
    }
     spawnThread(source) {
      let worker=new Worker(source);
      let thread=new Thread(worker, this._idgen++, this);
      this.thread_idmap[thread.id] = thread;
      this.threads.push(thread);
      return thread;
    }
     endThread(thread) {
      if (thread.worker===undefined) {
          console.warn("Double call to ThreadManager.endThread()");
          return ;
      }
      this.threads.remove(thread);
      delete this.thread_idmap[thread.id];
      thread.close();
    }
     getRandomThread() {
      while (1) {
        let ri=~~(Math.random()*this.threads.length*0.99999);
        if (this.threads[ri].ready)
          return this.threads[ri];
      }
    }
     postRenderJob(ownerid, commands, datablocks) {
      if (!this.drawing&&freeze_while_drawing) {
          this.startDrawing();
      }
      let thread;
      if (this.threads.length===0) {
          thread = this.spawnThread("vectordraw_canvas2d_worker.js");
          thread.ready = true;
          for (let i=0; i<this.max_threads-1; i++) {
              if (config.HAVE_SKIA) {
                  this.spawnThread("vectordraw_skia_worker.js");
              }
              else {
                this.spawnThread("vectordraw_canvas2d_worker.js");
              }
          }
      }
      else {
        thread = this.getRandomThread();
      }
      let ret=thread.postRenderJob(ownerid, commands, datablocks);
      return ret;
    }
     on_thread_done(thread) {
      let ok=true;
      for (let thread2 of this.threads) {
          if (thread2.freezelvl>0) {
              ok = false;
              break;
          }
      }
      if (ok) {
          if (Debug)
            console.warn("thread done");
          window._all_draw_jobs_done();
          if (this.drawing&&freeze_while_drawing) {
              this.endDrawing();
          }
          this.checkMemory();
      }
    }
     checkMemory() {
      let promise=platform.app.getProcessMemoryPromise();
      if (!promise)
        return ;
      promise.then((memory) =>        {      });
    }
     cancelAllJobs() {
      for (let thread of this.threads) {
          thread.clearOutstandingJobs();
          this.on_thread_done(thread);
      }
    }
     cancelRenderJob(ownerid) {
      for (let thread of this.threads) {
          if (ownerid in thread.ownerid_msgid_map) {
              thread.cancelRenderJob(ownerid);
          }
      }
    }
  }
  _ESClass.register(ThreadManager);
  _es6_module.add_class(ThreadManager);
  ThreadManager = _es6_module.add_export('ThreadManager', ThreadManager);
  var manager=new ThreadManager();
  manager = _es6_module.add_export('manager', manager);
  function test() {
    let thread=manager.spawnThread("vectordraw_canvas2d_worker.js");
    thread.postMessage("yay", [new ArrayBuffer(512)]);
    return thread;
  }
  test = _es6_module.add_export('test', test);
}, '/dev/fairmotion/src/vectordraw/vectordraw_jobs.js');
es6_module_define('vectordraw_jobs_base', [], function _vectordraw_jobs_base_module(_es6_module) {
  var OPCODES={LINESTYLE: 0, 
   LINEWIDTH: 1, 
   FILLSTYLE: 2, 
   BEGINPATH: 3, 
   CLOSEPATH: 4, 
   MOVETO: 5, 
   LINETO: 6, 
   RECT: 7, 
   ARC: 8, 
   CUBIC: 9, 
   QUADRATIC: 10, 
   STROKE: 11, 
   FILL: 12, 
   SAVE: 13, 
   RESTORE: 14, 
   TRANSLATE: 15, 
   ROTATE: 16, 
   SCALE: 17, 
   SETBLUR: 18, 
   SETCOMPOSITE: 19, 
   CLIP: 20, 
   DRAWIMAGE: 21, 
   PUTIMAGE: 22, 
   SETTRANSFORM: 23}
  OPCODES = _es6_module.add_export('OPCODES', OPCODES);
  var MESSAGES={NEW_JOB: 0, 
   ADD_DATABLOCK: 1, 
   SET_COMMANDS: 2, 
   RUN: 3, 
   ERROR: 10, 
   RESULT: 11, 
   ACK: 12, 
   CLEAR_QUEUE: 13, 
   CANCEL_JOB: 14, 
   WORKER_READY: 15}
  MESSAGES = _es6_module.add_export('MESSAGES', MESSAGES);
  var CompositeModes={"source-over": 0, 
   "source-atop": 1}
  CompositeModes = _es6_module.add_export('CompositeModes', CompositeModes);
}, '/dev/fairmotion/src/vectordraw/vectordraw_jobs_base.js');
es6_module_define('vectordraw', ["./vectordraw_base.js", "./vectordraw_skia_simple.js", "./vectordraw_stub.js", "./vectordraw_svg.js", "./vectordraw_canvas2d_simple.js", "./vectordraw_canvas2d.js"], function _vectordraw_module(_es6_module) {
  "use strict";
  var CanvasDraw2D=es6_import_item(_es6_module, './vectordraw_canvas2d.js', 'CanvasDraw2D');
  var CanvasPath=es6_import_item(_es6_module, './vectordraw_canvas2d.js', 'CanvasPath');
  var StubCanvasDraw2D=es6_import_item(_es6_module, './vectordraw_stub.js', 'StubCanvasDraw2D');
  var StubCanvasPath=es6_import_item(_es6_module, './vectordraw_stub.js', 'StubCanvasPath');
  var SVGDraw2D=es6_import_item(_es6_module, './vectordraw_svg.js', 'SVGDraw2D');
  var SVGPath=es6_import_item(_es6_module, './vectordraw_svg.js', 'SVGPath');
  let _ex_VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  _es6_module.add_export('VectorFlags', _ex_VectorFlags, true);
  var SimpleCanvasPath=es6_import_item(_es6_module, './vectordraw_canvas2d_simple.js', 'SimpleCanvasPath');
  var SimpleCanvasDraw2D=es6_import_item(_es6_module, './vectordraw_canvas2d_simple.js', 'SimpleCanvasDraw2D');
  var SimpleSkiaDraw2D=es6_import_item(_es6_module, './vectordraw_skia_simple.js', 'SimpleSkiaDraw2D');
  var SimpleSkiaPath=es6_import_item(_es6_module, './vectordraw_skia_simple.js', 'SimpleSkiaPath');
  var loadCanvasKit=es6_import_item(_es6_module, './vectordraw_skia_simple.js', 'loadCanvasKit');
  let Canvas=CanvasDraw2D;
  Canvas = _es6_module.add_export('Canvas', Canvas);
  let Path=CanvasPath;
  Path = _es6_module.add_export('Path', Path);
}, '/dev/fairmotion/src/vectordraw/vectordraw.js');
es6_module_define('strokedraw', [], function _strokedraw_module(_es6_module) {
  "use strict";
}, '/dev/fairmotion/src/vectordraw/strokedraw.js');
es6_module_define('spline_draw_new', ["../vectordraw/vectordraw_jobs.js", "../core/animdata.js", "./spline_math.js", "./spline_element_array.js", "../util/mathlib.js", "../editors/viewport/selectmode.js", "./spline_multires.js", "../vectordraw/vectordraw.js", "./spline_types.js", "./spline_strokegroup.js", "../editors/viewport/view2d_editor.js", "../config/config.js", "../path.ux/scripts/pathux.js", "./spline_base.js"], function _spline_draw_new_module(_es6_module) {
  "use strict";
  var aabb_isect_minmax2d=es6_import_item(_es6_module, '../util/mathlib.js', 'aabb_isect_minmax2d');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var line_isect=es6_import_item(_es6_module, '../util/mathlib.js', 'line_isect');
  var line_line_cross4=es6_import_item(_es6_module, '../util/mathlib.js', 'line_line_cross4');
  var COLINEAR=es6_import_item(_es6_module, '../util/mathlib.js', 'COLINEAR');
  var LINECROSS=es6_import_item(_es6_module, '../util/mathlib.js', 'LINECROSS');
  var ENABLE_MULTIRES=es6_import_item(_es6_module, '../config/config.js', 'ENABLE_MULTIRES');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var config=es6_import(_es6_module, '../config/config.js');
  var ClosestModes=es6_import_item(_es6_module, './spline_base.js', 'ClosestModes');
  var vectordraw_jobs=es6_import(_es6_module, '../vectordraw/vectordraw_jobs.js');
  var SessionFlags=es6_import_item(_es6_module, '../editors/viewport/view2d_editor.js', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var ORDER=es6_import_item(_es6_module, './spline_math.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, './spline_math.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, './spline_math.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, './spline_math.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, './spline_math.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, './spline_math.js', 'INT_STEPS');
  var get_vtime=es6_import_item(_es6_module, '../core/animdata.js', 'get_vtime');
  var iterpoints=es6_import_item(_es6_module, './spline_multires.js', 'iterpoints');
  var MultiResLayer=es6_import_item(_es6_module, './spline_multires.js', 'MultiResLayer');
  var MResFlags=es6_import_item(_es6_module, './spline_multires.js', 'MResFlags');
  var has_multires=es6_import_item(_es6_module, './spline_multires.js', 'has_multires');
  var spline_draw_cache_vs=cachering.fromConstructor(Vector3, 64);
  var spline_draw_trans_vs=cachering.fromConstructor(Vector3, 32);
  var PI=Math.PI;
  var pow=Math.pow, cos=Math.cos, sin=Math.sin, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, sqrt=Math.sqrt, log=Math.log, acos=Math.acos, asin=Math.asin;
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, './spline_types.js', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, './spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, './spline_types.js', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, './spline_types.js', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, './spline_types.js', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, './spline_types.js', 'SplineFace');
  var RecalcFlags=es6_import_item(_es6_module, './spline_types.js', 'RecalcFlags');
  var MaterialFlags=es6_import_item(_es6_module, './spline_types.js', 'MaterialFlags');
  var ElementArray=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArray');
  var SplineLayerFlags=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayerFlags');
  var Canvas=es6_import_item(_es6_module, '../vectordraw/vectordraw.js', 'Canvas');
  var Path=es6_import_item(_es6_module, '../vectordraw/vectordraw.js', 'Path');
  var VectorFlags=es6_import_item(_es6_module, '../vectordraw/vectordraw.js', 'VectorFlags');
  window.FANCY_JOINS = true;
  var update_tmps_vs=new cachering(function () {
    return new Vector2();
  }, 64);
  var update_tmps_mats=new cachering(function () {
    return new Matrix4();
  }, 64);
  var draw_face_vs=new cachering(function () {
    return new Vector3();
  }, 32);
  var MAXCURVELEN=10000;
  class DrawParams  {
     constructor() {
      this.init.apply(this, arguments);
    }
     init(redraw_rects, actlayer, only_render, selectmode, zoom, z, off, spline, drawlist) {
      this.redraw_rects = redraw_rects, this.actlayer = actlayer, this.only_render = only_render, this.selectmode = selectmode, this.zoom = zoom, this.z = z, this.off = off, this.spline = spline;
      this.drawlist = drawlist;
      this.combine_paths = true;
      return this;
    }
  }
  _ESClass.register(DrawParams);
  _es6_module.add_class(DrawParams);
  DrawParams = _es6_module.add_export('DrawParams', DrawParams);
  var drawparam_cachering=new cachering(function () {
    return new DrawParams();
  }, 16);
  var CustomDataLayer=es6_import_item(_es6_module, './spline_types.js', 'CustomDataLayer');
  class SplineDrawData extends CustomDataLayer {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.start1 = 0.0;
      this.end1 = 1.0;
      this.start2 = 0.0;
      this.end2 = 1.0;
      this.sp1 = new Vector2();
      this.sp2 = new Vector2();
      this.ep1 = new Vector2();
      this.ep2 = new Vector2();
      this.mask = 0;
    }
     copy(src) {
      return this;
    }
     start(side) {
      if (side===undefined) {
          throw new Error("side cannot be undefined");
      }
      return side ? this.start2 : this.start1;
    }
     end(side) {
      if (side===undefined) {
          throw new Error("side cannot be undefined");
      }
      return side ? this.end2 : this.end1;
    }
     gets(seg, v, side, margin=0.0) {
      if (!(__instance_of(seg, SplineSegment))) {
          throw new Error("invalid arguments to SplineDrawData.prototype.gets()");
      }
      let s;
      if (v===seg.v1) {
          if (side) {
              return this.start2-margin;
          }
          else {
            return this.start1-margin;
          }
      }
      else 
        if (v===seg.v2) {
          if (side) {
              return this.end2+margin;
          }
          else {
            return this.end1+margin;
          }
      }
      else {
        console.warn(v, seg);
        throw new Error("vertex not in segment");
      }
    }
     sets(seg, v, side, s) {
      if (v===seg.v1) {
          if (side) {
              this.start2 = s;
          }
          else {
            this.start1 = s;
          }
      }
      else 
        if (v===seg.v2) {
          if (side) {
              this.end2 = s;
          }
          else {
            this.end1 = s;
          }
      }
      else {
        throw new Error("invalid arguments to SplineDrawData.prototype.sets()");
      }
      return this;
    }
     getp(seg, v, side, dv_out) {
      if (!(this.mask&this._getmask(seg, v, side))) {
          return seg.evaluateSide(this.gets(seg, v, side), side, dv_out);
      }
      if (dv_out) {
          seg.evaluateSide(this.gets(seg, v, side), side, dv_out);
      }
      if (v===seg.v1) {
          if (side) {
              return this.sp2;
          }
          else {
            return this.sp1;
          }
      }
      else 
        if (v===seg.v2) {
          if (side) {
              return this.ep2;
          }
          else {
            return this.ep1;
          }
      }
      else {
        console.log(v, seg);
        throw new Error("vertex not in segment");
      }
    }
     _getmask(seg, v, side) {
      if (v===seg.v1) {
          if (side) {
              return 1;
          }
          else {
            return 2;
          }
      }
      else {
        if (side) {
            return 4;
        }
        else {
          return 8;
        }
      }
    }
     hasp(seg, v, side) {
      return this.mask&this._getmask(seg, v, side);
    }
     setp(seg, v, side, p) {
      if (!p) {
          this.mask&=~this._getmask(seg, v, side);
          return ;
      }
      this.mask|=this._getmask(seg, v, side);
      if (v===seg.v1) {
          if (side) {
              this.sp2.load(p);
          }
          else {
            this.sp1.load(p);
          }
      }
      else 
        if (v===seg.v2) {
          if (side) {
              this.ep2.load(p);
          }
          else {
            this.ep1.load(p);
          }
      }
      else {
        console.log(v, seg);
        throw new Error("vertex not in segment");
      }
    }
     loadSTRUCT(reader) {
      let start=this.start;
      let end=this.end;
      reader(this);
      super.loadSTRUCT(reader);
      if (typeof this.start==="number") {
          this.start1 = this.start2 = this.start;
          this.end1 = this.end2 = this.end;
      }
      this.start = start;
      this.end = end;
    }
    static  define() {
      return {typeName: "drawdata"}
    }
  }
  _ESClass.register(SplineDrawData);
  _es6_module.add_class(SplineDrawData);
  SplineDrawData = _es6_module.add_export('SplineDrawData', SplineDrawData);
  SplineDrawData.STRUCT = nstructjs.inherit(SplineDrawData, CustomDataLayer)+`
  start1: float;
  end1  : float;
  start2: float;
  end2  : float;
  sp1   : vec2;
  sp2   : vec2;
  ep1   : vec2;
  ep2   : vec2;
  mask  : int;
}
`;
  class SplineDrawer  {
    
    
    
    
    
     constructor(spline, drawer=new Canvas()) {
      this.spline = spline;
      this.used_paths = {};
      this.recalc_all = false;
      this.drawer = drawer;
      this.last_totvert = 0;
      this.last_totseg = 0;
      this.last_totface = 0;
      if (!spline.segments.cdata.has_layer("drawdata")) {
          spline.segments.cdata.add_layer(SplineDrawData);
      }
      this.last_zoom = undefined;
      this.last_3_mat = undefined;
      this.last_stroke_z = undefined;
      this.last_stroke_eid = undefined;
      this.last_layer_id = undefined;
      this.last_stroke_stringid = undefined;
    }
     update_vertex_join(seg, v, drawparams) {
      let z=drawparams.z;
      let id=seg.eid|(v===seg.v1 ? (1<<17) : (1<<18));
      let path=this.get_path(id, z);
      path.color.load(seg.mat.strokecolor);
      path.blur = seg.mat.blur;
      path.reset();
      let dv0=new Vector2();
      let dv1a=new Vector2();
      let dv1b=new Vector2();
      let segments=this._sortSegments(v);
      let si=segments.indexOf(seg);
      let prev=segments[(si+segments.length-1)%segments.length];
      let next=segments[(si+1)%segments.length];
      let side0=prev.v1===v ? 0 : 1;
      let side1=seg.v1===v ? 1 : 0;
      let side2=next.v1===v ? 1 : 0;
      let draw0=prev.cdata.get_layer(SplineDrawData);
      let draw1=seg.cdata.get_layer(SplineDrawData);
      let draw2=next.cdata.get_layer(SplineDrawData);
      let s0=draw0.gets(prev, v, side0);
      let s1=draw1.gets(seg, v, side1);
      let p0=draw0.getp(prev, v, side0, dv0);
      let p1a=draw1.getp(seg, v, side1, dv1a);
      let p1b=draw1.getp(seg, v, side1^1, dv1b);
      dv0.mulScalar(v===prev.v1 ? 1 : -1);
      dv1a.mulScalar(v===seg.v1 ? 1 : -1);
      dv1b.mulScalar(v===seg.v1 ? 1 : -1);
      let scale1=v.vectorDistance(p0)/Math.max(prev.length, 1e-05);
      let scale2=v.vectorDistance(p1a)/Math.max(seg.length, 1e-05);
      scale1/=1.5;
      scale2/=1.5;
      dv0.mulScalar(-scale1);
      dv1a.mulScalar(scale2);
      path.moveTo(v[0], v[1]);
      path.lineTo(p0[0], p0[1]);
      path.cubicTo(p0[0]+dv0[0], p0[1]+dv0[1], p1a[0]-dv1a[0], p1a[1]-dv1a[1], p1a[0], p1a[1]);
      path.lineTo(p1b[0], p1b[1]);
    }
     update(spline, drawlist, drawlist_layerids, matrix, redraw_rects, only_render, selectmode, master_g, zoom, editor, ignore_layers) {
      if (!spline.segments.cdata.has_layer("drawdata")) {
          spline.segments.cdata.add_layer(SplineDrawData);
      }
      let draw_normals=editor.draw_normals;
      zoom = matrix.$matrix.m11;
      this.used_paths = {};
      this.drawlist = drawlist;
      this.drawlist_layerids = drawlist_layerids;
      var actlayer=spline.layerset.active;
      var do_blur=!!(only_render||editor.enable_blur);
      var draw_faces=!!(only_render||editor.draw_faces);
      var recalc_all=this.recalc_all||this.draw_faces!==draw_faces||this.do_blur!==do_blur;
      recalc_all = recalc_all||spline.verts.length!==this.last_totvert;
      recalc_all = recalc_all||spline.segments.length!==this.last_totseg;
      recalc_all = recalc_all||spline.faces.length!==this.last_totface;
      if (recalc_all) {
      }
      this.last_totvert = spline.verts.length;
      this.last_totseg = spline.segments.length;
      this.last_totface = spline.faces.length;
      this.last_zoom = zoom;
      this.draw_faces = draw_faces;
      this.do_blur = do_blur;
      this.last_stroke_mat = undefined;
      this.last_stroke_z = undefined;
      this.last_stroke_eid = undefined;
      this.last_layer_id = undefined;
      this.last_stroke_stringid = undefined;
      let drawMatrix=matrix;
      var mat=update_tmps_mats.next();
      mat.load(matrix), matrix = mat;
      var mat2=update_tmps_mats.next();
      mat2.makeIdentity();
      mat2.translate(0.0, -master_g.height, 0.0);
      mat2.makeIdentity();
      mat2.translate(0.0, master_g.height, 0.0);
      mat2.scale(1.0, -1.0, 1.0);
      matrix.preMultiply(mat2);
      this.drawer.do_blur = editor.enable_blur;
      var m1=matrix.$matrix, m2=this.drawer.matrix.$matrix;
      var off=update_tmps_vs.next().zero();
      this.recalc_all = false;
      if (m1.m11!==m2.m11||m1.m22!==m2.m22) {
      }
      if (!recalc_all) {
          var a=update_tmps_vs.next().zero(), b=update_tmps_vs.next().zero();
          a.multVecMatrix(this.drawer.matrix);
          b.multVecMatrix(matrix);
          off.load(b).sub(a);
      }
      else {
        off.zero();
      }
      var m=matrix.$matrix;
      this.drawer.pan[0] = m.m41;
      this.drawer.pan[1] = m.m42;
      m.m41 = m.m42 = m.m43 = 0;
      this.drawer.set_matrix(drawMatrix);
      if (recalc_all) {
          this.drawer.recalcAll();
          if (1||DEBUG.trace_recalc_all) {
              console.log("%c RECALC_ALL!  ", "color:orange");
          }
      }
      var drawparams=drawparam_cachering.next().init(redraw_rects, actlayer, only_render, selectmode, zoom, undefined, off, spline, drawlist);
      let vset=new set();
      for (let seg of spline.segments.visible) {
          if (seg.flag&(SplineFlags.UPDATE|SplineFlags.REDRAW)) {
              vset.add(seg.v1);
              vset.add(seg.v2);
              seg.v1.flag|=SplineFlags.REDRAW;
              seg.v2.flag|=SplineFlags.REDRAW;
          }
      }
      for (let v of vset) {
          if (v.flag&(SplineFlags.UPDATE|SplineFlags.REDRAW)) {
              this.update_vertex_strokes(v, drawparams);
          }
      }
      for (var i=0; i<drawlist.length; i++) {
          var e=drawlist[i];
          drawparams.z = i;
          drawparams.zoom = zoom;
          drawparams.combine_paths = true;
          if (__instance_of(e, SplineStrokeGroup)) {
              let redraw=false;
              for (let seg of e.segments) {
                  redraw = redraw||(seg.flag&(SplineFlags.REDRAW|SplineFlags.UPDATE));
              }
              if (redraw) {
                  for (let seg of e.segments) {
                      if (draw_normals) {
                          this.update_normals(seg, drawparams);
                      }
                  }
                  this.update_stroke_group(e, drawparams);
              }
              continue;
          }
          var layerid=this.drawlist_layerids[i];
          if (e.flag&SplineFlags.HIDE)
            continue;
          if ((e.flag&SplineFlags.NO_RENDER)&&e.type!==SplineTypes.VERTEX&&(selectmode!==e.type||only_render))
            continue;
          var visible=false;
          for (let k in e.layers) {
              if (!(spline.layerset.get(k).flag&SplineLayerFlags.HIDE)) {
                  visible = true;
              }
          }
          if (!visible)
            continue;
          if (recalc_all) {
              e.flag|=SplineFlags.REDRAW;
          }
          if (e.type===SplineTypes.FACE) {
              this.update_polygon(e, redraw_rects, actlayer, only_render, selectmode, zoom, i, off, spline, ignore_layers);
          }
          else 
            if (e.type===SplineTypes.VERTEX&&(e.flag&(SplineFlags.REDRAW|SplineFlags.UPDATE))) {
              if (e.segments.length>2) {
                  for (let seg of e.segments) {
                      this.update_vertex_join(seg, e, drawparams);
                  }
              }
          }
          this.last_layer_id = this.drawlist_layerids[i];
      }
      for (var k in this.drawer.path_idmap) {
          if (!(k in this.used_paths)) {
              var path=this.drawer.path_idmap[k];
              this.drawer.remove(path);
          }
      }
      for (let v of vset) {
          v.flag&=~SplineFlags.REDRAW;
      }
    }
     get_path(id, z, check_z=true) {
      this.used_paths[id] = 1;
      var path;
      if (!this.has_path(id, z, check_z)) {
          path = this.drawer.get_path(id, z, check_z);
          path.frame_first = true;
      }
      else {
        path = this.drawer.get_path(id, z, check_z);
      }
      return path;
    }
     has_path(id, z, check_z=true) {
      this.used_paths[id] = 1;
      return this.drawer.has_path(id, z, check_z);
    }
     update_stroke_group(g, drawparams) {
      let z=drawparams.z;
      let dpath, dpath2, dpath3, dpoint, dline;
      let debug=0;
      if (debug) {
          let eid=g.id;
          dpath = this.get_path(eid|8192, z+10000);
          dpath2 = this.get_path(eid|16384, z+10001);
          dpath3 = this.get_path(eid|8192|16384, z+10002);
          dpath.color = [1, 0.25, 0.125, 0.5];
          dpath2.color = [0.25, 0.65, 1.0, 0.5];
          dpath3.color = [0.5, 1.0, 0.5, 0.5];
          dpath.reset();
          dpath2.reset();
          dpath3.reset();
          dpoint = (x, y, w, dp) =>            {
            if (w===undefined) {
                w = 4;
            }
            if (dp===undefined) {
                dp = dpath;
            }
            w*=0.5;
            dp.moveTo(x-w, y-w);
            dp.lineTo(x-w, y+w);
            dp.lineTo(x+w, y+w);
            dp.lineTo(x+w, y-w);
            dp.lineTo(x-w, y-w);
          };
          dline = (x1, y1, x2, y2, w, dp) =>            {
            if (w===undefined) {
                w = 0.5;
            }
            if (dp===undefined) {
                dp = dpath;
            }
            let dx=y1-y2, dy=x2-x1;
            let l=Math.sqrt(dx*dx+dy*dy);
            l = 0.5*w/l;
            dx*=l;
            dy*=l;
            dp.moveTo(x1-dx, y1-dy);
            dp.lineTo(x2-dx, y2-dy);
            dp.lineTo(x2+dx, y2+dy);
            dp.lineTo(x1+dx, y1+dy);
            dp.lineTo(x1-dx, y1-dy);
          };
      }
      if (g.segments.length===0) {
          if (this.has_path(g.id)) {
              this.get_path(g.id).reset();
          }
          console.warn("g.segments.length was zero!");
          return ;
      }
      let spline=drawparams.spline;
      let path=this.get_path(g.id, z);
      path.reset();
      let startv;
      let seg=g.segments[0];
      let seg2=g.segments[1];
      if (seg2&&seg.v1!==seg2.v1&&seg.v1!==seg2.v2) {
          startv = seg.v1;
      }
      else 
        if (seg2) {
          startv = seg.v2;
      }
      else {
        startv = seg.v1;
      }
      path.color = seg.mat.strokecolor;
      path.blur = seg.mat.blur;
      let dv2=new Vector2();
      let lw_dlw=[0, 0, 0];
      let dv=new Vector2();
      let no=new Vector2();
      let lastp=new Vector2();
      let lastdv=new Vector2();
      let lastno=new Vector2();
      let firstp=new Vector2();
      let v=startv;
      let dobreak=false;
      for (let step=0; step<2; step++) {
          let totseg=g.segments.length;
          let segments=g.segments;
          let lastsign=1;
          let first=true;
          for (let si=0; si<segments.length; si++) {
              let seg=step ? segments[totseg-si-1] : segments[si];
              let seglen=seg.length;
              let steps=seglen>0.0 ? ~~(seglen/55+0.5) : 0;
              let ddata=seg.cdata.get_layer(SplineDrawData);
              steps = Math.min(Math.max(steps, 2), 8);
              steps = Math.max(steps, 12);
              let dsign=v===seg.v1 ? 1.0 : -1.0;
              if (lastsign!==dsign) {
                  lastdv.negate();
              }
              lastsign = dsign;
              let side=(dsign<0.0);
              let start=ddata.start(side), end=ddata.end(side);
              let ds=dsign*((end-start)/steps);
              let s=dsign<0.0 ? end : start;
              if (si===segments.length-1) {
                  steps++;
              }
              if (!v.segments) {
                  console.log(v, startv);
                  throw new Error();
              }
              let usepoint=(v.segments.length<=2);
              usepoint = usepoint&&(v.flag&SplineFlags.BREAK_TANGENTS);
              if (usepoint) {
                  let hasp=ddata.hasp(seg, v, 1);
                  let p;
                  if (hasp) {
                      p = ddata.getp(seg, v, 1);
                  }
                  else {
                    let s=ddata.gets(seg, v, side);
                    s = Math.min(Math.max(s, 0.0), 1.0);
                    p = seg.evaluateSide(s, 1, dv);
                  }
                  if (debug) {
                      dpoint(p[0], p[1], hasp ? 15 : 8);
                  }
                  dobreak = true;
                  if (first) {
                      first = false;
                      if (!step) {
                          firstp.load(p);
                          path.moveTo(p[0], p[1]);
                      }
                      else {
                        path.lineTo(p[0], p[1]);
                      }
                  }
                  else {
                    path.lineTo(p[0], p[1]);
                  }
                  let w1=seg.width(s);
                  if (v.segments.length===2&&!hasp) {
                      let seg2=v.other_segment(seg);
                      let ddata2=seg2.cdata.get_layer(SplineDrawData);
                      let s=ddata2.gets(seg2, v, side);
                      s = Math.min(Math.max(s, 0.0), 1.0);
                      let p2=seg2.evaluateSide(s, 1, dv2);
                      let scale=3.0;
                      let scale1=scale;
                      let scale2=scale;
                      dv.mulScalar(1.0/(scale1));
                      dv2.mulScalar(1.0/(scale2));
                      path.lineTo(p[0], p[1]);
                      if (debug) {
                          dpoint(p2[0], p2[1], 15, dpath3);
                      }
                  }
              }
              for (let i=0; i<steps; i++, s+=ds) {
                  let p=seg.evaluateSide(s, side, dv, no, lw_dlw);
                  dv.mulScalar(ds/3.0);
                  if (first) {
                      first = false;
                      if (!step) {
                          firstp.load(p);
                          path.moveTo(p[0], p[1]);
                      }
                      else {
                        path.lineTo(p[0], p[1]);
                      }
                  }
                  else 
                    if (dobreak) {
                      dobreak = false;
                      path.lineTo(p[0], p[1]);
                  }
                  else {
                    path.cubicTo(lastp[0]+lastdv[0], lastp[1]+lastdv[1], p[0]-dv[0], p[1]-dv[1], p[0], p[1]);
                  }
                  lastdv.load(dv);
                  lastno.load(no);
                  lastp.load(p);
              }
              if (v!==seg.v1&&v!==seg.v2) {
                  console.log("eek!", i, seg, step);
              }
              v = seg.other_vert(v);
          }
      }
    }
     update_stroke_points(v) {
      if (v.segments.length===2&&!(v.flag&SplineFlags.BREAK_TANGENTS)) {
          return ;
      }
      let t0=new Vector2();
      let t1=new Vector2();
      let t2=new Vector2();
      let d0a=new Vector2();
      let d1a=new Vector2();
      let d2a=new Vector2();
      let d0b=new Vector2();
      let d1b=new Vector2();
      let d2b=new Vector2();
      let first=true;
      let fx=0, fy=0, lx=0, ly=0;
      lx = 0;
      ly = 0;
      let segments=this._sortSegments(v);
      for (let si=0; si<segments.length; si++) {
          let seg=segments[si];
          let prev=(si+segments.length-1)%segments.length;
          let next=(si+1)%segments.length;
          let data=seg.cdata.get_layer(SplineDrawData);
          prev = segments[prev];
          next = segments[next];
          let pdata=prev.cdata.get_layer(SplineDrawData);
          let ndata=next.cdata.get_layer(SplineDrawData);
          let margin=-0.001;
          let s0a=pdata.gets(prev, v, 0, margin);
          let s0b=pdata.gets(prev, v, 1, margin);
          let s1a=data.gets(seg, v, 0, margin);
          let s1b=data.gets(seg, v, 1, margin);
          let s2a=ndata.gets(next, v, 0, margin);
          let s2b=ndata.gets(next, v, 1, margin);
          let pa=prev.evaluateSide(s0b, 1, d0a);
          let pb=prev.evaluateSide(s0a, 0, d0b);
          let sa=seg.evaluateSide(s1a, 0, d1a);
          let sb=seg.evaluateSide(s1b, 1, d1b);
          let na=next.evaluateSide(s2b, 1, d2a);
          let nb=next.evaluateSide(s2a, 0, d2b);
          t0.load(prev.other_vert(v)).sub(v).normalize();
          t1.load(seg.other_vert(v)).sub(v).normalize();
          t2.load(next.other_vert(v)).sub(v).normalize();
          let th1=Math.abs(Math.acos(t0.dot(t1)));
          let th2=Math.abs(Math.acos(t1.dot(t2)));
          let th=th1+th2;
          sa[2] = sb[2] = pa[2] = pb[2] = na[2] = nb[2] = 0.0;
          let f0=(prev.v1===v);
          let f1=(seg.v1===v);
          let f2=(next.v1===v);
          if (f0) {
              let t=pa;
              pa = pb;
              pb = t;
              t = d0a;
              d0a = d0b;
              d0b = t;
              d0a.negate();
              d0b.negate();
          }
          if (f1) {
              let t=sa;
              sa = sb;
              sb = t;
              t = d1a;
              d1a = d1b;
              d1b = t;
              d1a.negate();
              d1b.negate();
          }
          if (f2) {
              let t=na;
              na = nb;
              nb = t;
              t = d2a;
              d2a = d2b;
              d2b = t;
              d2a.negate();
              d2b.negate();
          }
          if (isNaN(sa.dot(sa))) {
              if (Math.random()>0.98) {
                  console.log("NaN!", sa, seg);
              }
              continue;
          }
          let sc=seg.evaluate(s1a);
          if (segments.length===2) {
              d0b.normalize();
              d1b.normalize();
              let th1=Math.acos(d0b.dot(d1b));
              let doIsect1=Math.abs(th1)>Math.PI*0.3;
              d0a.normalize();
              d1a.normalize();
              let th2=Math.acos(d0a.dot(d1a));
              let doIsect2=Math.abs(th2)>Math.PI*0.3;
              doIsect1 = doIsect1&&doIsect2;
              doIsect2 = doIsect1;
              d0a.add(pa);
              d0b.add(pb);
              d1a.add(sa);
              d1b.add(sb);
              d2a.add(na);
              d2b.add(nb);
              if (doIsect1) {
                  let r=line_isect(pb, d0b, sb, d1b);
                  if (r[1]===COLINEAR) {
                      r = v;
                  }
                  else {
                    r = new Vector2(r[0]);
                    r.floor();
                  }
                  data.setp(seg, v, 1, r);
              }
              else {
                data.setp(seg, v, 1, undefined);
                data.sets(seg, v, 1, v===seg.v1 ? 0.0 : 1.0);
              }
              if (doIsect2) {
                  let r2=line_isect(pa, d0a, sa, d1a);
                  if (r2[1]===COLINEAR) {
                      r2 = v;
                  }
                  else {
                    r2 = new Vector2(r2[0]);
                    r2.floor();
                  }
                  data.setp(seg, v, 0, r2);
              }
              else {
                data.setp(seg, v, 0, undefined);
                data.sets(seg, v, 0, v===seg.v1 ? 0.0 : 1.0);
              }
          }
          else 
            if (0) {
              pa.interp(sa, 0.5);
              nb.interp(sb, 0.5);
              if (debug) {
              }
              data.setp(seg, v, 0, sa);
              data.setp(seg, v, 1, sb);
          }
          else 
            if (0) {
              data.setp(seg, v, 0, sa);
              data.setp(seg, v, 1, sb);
          }
          else {
            data.setp(seg, v, 0, undefined);
            data.setp(seg, v, 1, undefined);
          }
      }
    }
     update_vertex_strokes(v, drawparams) {
      if (v.segments.length===0||!FANCY_JOINS) {
          return ;
      }
      if (!((v.flag&SplineFlags.BREAK_TANGENTS)||v.segments.length>2)) {
          for (let seg of v.segments) {
              let data=seg.cdata.get_layer(SplineDrawData);
              data.sets(seg, v, 0, v===seg.v1 ? 0.0 : 1.0);
              data.sets(seg, v, 1, v===seg.v1 ? 0.0 : 1.0);
          }
          return ;
      }
      let startv=v;
      let debug=0;
      let dpath, dpath2, dpath3, dpoint, dline;
      if (debug) {
          dpath = this.get_path(eid|8192, z+10000);
          dpath2 = this.get_path(eid|16384, z+10001);
          dpath3 = this.get_path(eid|8192|16384, z+10002);
          dpath.color = [1, 0.25, 0.125, 0.5];
          dpath2.color = [0.25, 0.65, 1.0, 0.5];
          dpath3.color = [0.5, 1.0, 0.5, 0.5];
          dpath.reset();
          dpath2.reset();
          dpath3.reset();
          dpoint = (x, y, w, dp) =>            {
            if (w===undefined) {
                w = 4;
            }
            if (dp===undefined) {
                dp = dpath;
            }
            w*=0.5;
            dp.moveTo(x-w, y-w);
            dp.lineTo(x-w, y+w);
            dp.lineTo(x+w, y+w);
            dp.lineTo(x+w, y-w);
            dp.lineTo(x-w, y-w);
          };
          dline = (x1, y1, x2, y2, w, dp) =>            {
            if (w===undefined) {
                w = 0.5;
            }
            if (dp===undefined) {
                dp = dpath;
            }
            let dx=y1-y2, dy=x2-x1;
            let l=Math.sqrt(dx*dx+dy*dy);
            l = 0.5*w/l;
            dx*=l;
            dy*=l;
            dp.moveTo(x1-dx, y1-dy);
            dp.lineTo(x2-dx, y2-dy);
            dp.lineTo(x2+dx, y2+dy);
            dp.lineTo(x1+dx, y1+dy);
            dp.lineTo(x1-dx, y1-dy);
          };
      }
      let n1=new Vector2();
      let n2=new Vector2();
      let t1=new Vector2();
      let t2=new Vector2();
      let segments=this._sortSegments(v);
      let testIsect=() =>        {
        for (let seg1 of segments) {
            let data1=seg1.cdata.get_layer(SplineDrawData);
            let s1=data1.gets(seg1, v, 0);
            for (let seg2 of segments) {
                if (seg1===seg2)
                  continue;
                let data2=seg2.cdata.get_layer(SplineDrawData);
                let s2=data2.gets(seg2, v, 0);
                for (let i=0; i<2; i++) {
                    break;
                    let p1b=seg1.evaluateSide(s1, i);
                    let cmode=v===seg2.v1 ? ClosestModes.START : ClosestModes.END;
                    cmode = ClosestModes.CLOSEST;
                    let p=seg2.closest_point(p1b, cmode);
                    if (p!==undefined) {
                        let lw2b=[0, 0];
                        let lw2c=[0, 0];
                        t1.load(p1b).sub(p[0]);
                        let wid;
                        let dist=t1.vectorLength();
                        t1.normalize();
                        n1.normalize();
                        if (t1.dot(n1)>=0) {
                            wid = lw2b[0]*0.5;
                        }
                        else {
                          wid = lw2c[0]*0.5;
                        }
                        if (dist<wid) {
                            return true;
                        }
                    }
                }
                for (let i=0; i<8; i++) {
                    let side1=i%2, side2 = ~~(i/2);
                    let p1a=seg1.evaluate(s1);
                    let p1b=seg1.evaluateSide(s1, side1);
                    let p2a=seg2.evaluate(s2);
                    let p2b=seg2.evaluateSide(s2, side2);
                    if (line_line_cross4(p1a, p1b, p2a, p2b)) {
                        return true;
                    }
                }
            }
        }
        return false;
      };
      let seglen=0.0;
      let s=0.0;
      for (let seg of segments) {
          seglen+=seg.length;
      }
      seglen/=segments.length;
      if (0) {
          for (let i=0; i<segments.length; i++) {
              let seg1=segments[i], seg2=segments[(i+1)%segments.length];
              let ret=seg1.intersect(seg2, 0, 1);
              let s=!ret ? (v===seg1.v1 ? 0.0 : 1.0) : ret.sourceS;
              if (ret) {
                  console.warn("RETRET!", ret);
              }
              let data=seg1.cdata.get_layer(SplineDrawData);
              data.sets(seg1, v, 0, s);
              data.sets(seg1, v, 1, s);
          }
      }
      if (1) {
          let a=0.0;
          let b=0.5;
          for (let i=0; i<8; i++) {
              let s=(a+b)*0.5;
              for (let seg of segments) {
                  let data=seg.cdata.get_layer(SplineDrawData);
                  let s2=s*seglen/seg.length;
                  s2 = Math.min(Math.max(s2, 0.0), 1.0);
                  data.sets(seg, v, 0, v===seg.v1 ? s : 1.0-s);
                  data.sets(seg, v, 1, v===seg.v1 ? s : 1.0-s);
              }
              if (testIsect()) {
                  a = (a+b)*0.5;
              }
              else {
                b = (a+b)*0.5;
              }
          }
          s = (a+b)*0.5;
          s*=1.2;
          s = Math.min(Math.max(s, 0.0), 1.0);
          for (let seg of segments) {
              let seglen2=seg.length;
              let ratio=seglen2===0.0 ? 1.0 : seglen/seg.length;
              let data=seg.cdata.get_layer(SplineDrawData);
              let s2=s*ratio;
              s2 = Math.min(Math.max(s2, 0.0), 1.0);
              s2 = (v===seg.v1 ? s2 : 1.0-s2);
              data.sets(seg, v, 0, s2);
              data.sets(seg, v, 1, s2);
          }
      }
      this.update_stroke_points(startv);
    }
     _sortSegments(v) {
      let segments=([]).concat(v.segments);
      segments.sort((a, b) =>        {
        let dx1=a.other_vert(v)[0]-v[0];
        let dy1=a.other_vert(v)[1]-v[1];
        let dx2=b.other_vert(v)[0]-v[0];
        let dy2=b.other_vert(v)[1]-v[1];
        return Math.atan2(dy1, dx1)-Math.atan2(dy2, dx2);
      });
      let n1=new Vector2();
      let n2=new Vector2();
      let t1=new Vector2();
      let t2=new Vector2();
      let sum=0.0;
      for (let i=0; i<segments.length; i++) {
          let seg1=segments[i], seg2=segments[(i+1)%segments.length];
          t1[0] = seg1.other_vert(v)[0]-v[0];
          t1[1] = seg1.other_vert(v)[1]-v[1];
          t2[0] = seg2.other_vert(v)[0]-v[0];
          t2[1] = seg2.other_vert(v)[1]-v[1];
          t1.normalize();
          t2.normalize();
          let th=Math.abs(Math.acos(t1.dot(t2)));
          sum+=th;
      }
      let bad_corner=false;
      if (sum<Math.PI*1.99) {
          bad_corner = true;
          if (segments.length>2) {
          }
      }
      segments.bad_corner = bad_corner;
      return segments;
    }
     update_normals(seg, drawparams) {
      let eid=seg.eid, z=seg.z;
      let path1=this.get_path(eid|8192, z+10000);
      let path2=this.get_path(eid|8192|(8192<<1), z+10001);
      let steps=40;
      let data=seg.cdata.get_layer(SplineDrawData);
      path1.reset();
      path1.color[0] = 0.25;
      path1.color[1] = 0.5;
      path1.color[2] = 1.0;
      path1.color[3] = 0.9;
      path2.reset();
      path2.color[0] = 0.85;
      path2.color[1] = 0.5;
      path2.color[2] = 0.25;
      path2.color[3] = 0.9;
      let lwdlw=new Vector2();
      let dv=new Vector2(), lastdv=new Vector2();
      let no=new Vector2(), lastno=new Vector2();
      let wid=1.5/drawparams.zoom;
      for (let side=0; side<2; side++) {
          let starts=data.start(side), ends=data.end(side);
          let ds=(ends-starts)/(steps-1);
          let s=starts;
          let lastco=undefined;
          let path=side ? path1 : path2;
          for (let i=0; i<steps; i++, s+=ds) {
              let co=seg.evaluateSide(s, side, dv, no, lwdlw);
              let k=seg.curvatureSide(s, side, no)*(side*2.0-1.0);
              no.normalize().mulScalar(7000.0*k);
              if (i>0) {
                  path.makeLine(lastco[0], lastco[1], co[0], co[1], wid+side);
                  path.makeLine(co[0], co[1], co[0]+no[0], co[1]+no[1], wid+side);
              }
              lastco = co;
          }
      }
    }
     update_stroke(seg, drawparams) {
      return ;
      var redraw_rects=drawparams.redraw_rects, actlayer=drawparams.actlayer;
      var only_render=drawparams.only_render, selectmode=drawparams.selectmode;
      var zoom=drawparams.zoom, z=drawparams.z, off=drawparams.off, spline=drawparams.spline;
      var drawlist=drawparams.drawlist;
      var eid=seg.eid;
      let debug=0;
      let dpath, dpath2, dpath3, dpoint, dline;
      if (debug) {
          dpath = this.get_path(eid|8192, z+10000);
          dpath2 = this.get_path(eid|16384, z+10001);
          dpath3 = this.get_path(eid|8192|16384, z+10002);
          dpath.color = [1, 0.25, 0.125, 0.5];
          dpath2.color = [0.25, 0.65, 1.0, 0.5];
          dpath3.color = [0.5, 1.0, 0.5, 0.5];
          dpath.reset();
          dpath2.reset();
          dpath3.reset();
          dpoint = (x, y, w, dp) =>            {
            if (w===undefined) {
                w = 4;
            }
            if (dp===undefined) {
                dp = dpath;
            }
            w*=0.5;
            dp.moveTo(x-w, y-w);
            dp.lineTo(x-w, y+w);
            dp.lineTo(x+w, y+w);
            dp.lineTo(x+w, y-w);
            dp.lineTo(x-w, y-w);
          };
          dline = (x1, y1, x2, y2, w, dp) =>            {
            if (w===undefined) {
                w = 0.5;
            }
            if (dp===undefined) {
                dp = dpath;
            }
            let dx=y1-y2, dy=x2-x1;
            let l=Math.sqrt(dx*dx+dy*dy);
            if (l===0.0) {
                return ;
            }
            l = 0.5*w/l;
            dx*=l;
            dy*=l;
            dp.moveTo(x1-dx, y1-dy);
            dp.lineTo(x2-dx, y2-dy);
            dp.lineTo(x2+dx, y2+dy);
            dp.lineTo(x1+dx, y1+dy);
            dp.lineTo(x1-dx, y1-dy);
          };
      }
      if (this.has_path(eid, z, eid==seg.eid)&&!(seg.flag&SplineFlags.REDRAW)) {
          return ;
      }
      if (seg.eid===eid) {
          this.last_stroke_mat = seg.mat;
          this.last_stroke_eid = seg.eid;
          this.last_stroke_stringid = seg.stringid;
      }
      seg.flag&=~SplineFlags.REDRAW;
      var l=seg.ks[KSCALE]*zoom;
      let add=(Math.sqrt(l)/5);
      var steps=5+~~add;
      var ds=1.0/(steps-1), s=0.0;
      var path=this.get_path(eid, z, eid==seg.eid);
      path.update();
      path.was_updated = true;
      if (path.frame_first&&path.clip_paths.length>0) {
          path.reset_clip_paths();
          path.frame_first = false;
      }
      if (seg.l!==undefined&&(seg.mat.flag&MaterialFlags.MASK_TO_FACE)) {
          var l=seg.l, _i=0;
          do {
            var fz=l.f.finalz;
            if (fz>z) {
                l = l.radial_next;
                continue;
            }
            var path2=this.get_path(l.f.eid, fz);
            path.add_clip_path(path2);
            if (_i++>1000) {
                console.trace("Warning: infinite loop!");
                break;
            }
            l = l.radial_next;
          } while (l!==seg.l);
          
      }
      if (eid===seg.eid) {
          path.reset();
      }
      path.blur = seg.mat.blur*(this.do_blur ? 1 : 0);
      if (only_render) {
          path.color.load(seg.mat.strokecolor);
      }
      else {
        if ((selectmode&SelMask.SEGMENT)&&seg===spline.segments.highlight) {
            path.color[0] = 200/255, path.color[1] = 200/255, path.color[2] = 50/255, path.color[3] = 0.8;
        }
        else 
          if ((selectmode&SelMask.SEGMENT)&&seg===spline.segments.active) {
            path.color[0] = 200/255, path.color[1] = 80/255, path.color[2] = 50/255, path.color[3] = 0.8;
        }
        else 
          if ((selectmode&SelMask.SEGMENT)&&(seg.flag&SplineFlags.SELECT)) {
            path.color[0] = 250/255, path.color[1] = 140/255, path.color[2] = 50/255, path.color[3] = 0.8;
        }
        else {
          path.color.load(seg.mat.strokecolor);
        }
      }
      let lw=seg.mat.linewidth*0.5;
      var no=seg.normal(0).normalize().mulScalar(lw);
      var co=seg.evaluate(0).add(no);
      var fx=co[0], fy=co[1];
      var lastdv, lastco;
      var len=seg.length;
      let stretch=1.0075;
      let seglen=seg.length;
      let data=seg.cdata.get_layer(SplineDrawData);
      let starts=data.start(0), ends=data.end(0);
      let lwout=new Vector2();
      for (let vi=0; vi<2; vi++) {
          let v=vi ? seg.v2 : seg.v1;
          if (!FANCY_JOINS||!((v.flag&SplineFlags.BREAK_TANGENTS)||v.segments.length>2)) {
              continue;
          }
          let t0=new Vector2();
          let t1=new Vector2();
          let t2=new Vector2();
          let d0a=new Vector2();
          let d1a=new Vector2();
          let d2a=new Vector2();
          let d0b=new Vector2();
          let d1b=new Vector2();
          let d2b=new Vector2();
          let first=true;
          let fx=0, fy=0, lx=0, ly=0;
          lx = 0;
          ly = 0;
          let segments=this._sortSegments(v);
          if (segments.length>1) {
              let si=segments.indexOf(seg);
              let prev=(si+segments.length-1)%segments.length;
              let next=(si+1)%segments.length;
              prev = segments[prev];
              next = segments[next];
              let pdata=prev.cdata.get_layer(SplineDrawData);
              let ndata=next.cdata.get_layer(SplineDrawData);
              let margin=-0.001;
              let s0=pdata.gets(prev, v, 0, margin);
              let s1=data.gets(seg, v, 0, margin);
              let s2=ndata.gets(next, v, 0, margin);
              let pa=prev.evaluateSide(s0, 1, d0a);
              let pb=prev.evaluateSide(s0, 0, d0b);
              let sa=seg.evaluateSide(s1, 0, d1a);
              let sb=seg.evaluateSide(s1, 1, d1b);
              let na=next.evaluateSide(s2, 1, d2a);
              let nb=next.evaluateSide(s2, 0, d2b);
              t0.load(prev.other_vert(v)).sub(v).normalize();
              t1.load(seg.other_vert(v)).sub(v).normalize();
              t2.load(next.other_vert(v)).sub(v).normalize();
              let th1=Math.abs(Math.acos(t0.dot(t1)));
              let th2=Math.abs(Math.acos(t1.dot(t2)));
              let th=th1+th2;
              sa[2] = sb[2] = pa[2] = pb[2] = na[2] = nb[2] = 0.0;
              let f0=(prev.v1===v);
              let f1=(seg.v1===v);
              let f2=(next.v1===v);
              if (f0) {
                  let t=pa;
                  pa = pb;
                  pb = t;
                  t = d0a;
                  d0a = d0b;
                  d0b = t;
                  d0a.negate();
                  d0b.negate();
              }
              if (f1) {
                  let t=sa;
                  sa = sb;
                  sb = t;
                  t = d1a;
                  d1a = d1b;
                  d1b = t;
                  d1a.negate();
                  d1b.negate();
              }
              if (f2) {
                  let t=na;
                  na = nb;
                  nb = t;
                  t = d2a;
                  d2a = d2b;
                  d2b = t;
                  d2a.negate();
                  d2b.negate();
              }
              if (isNaN(sa.dot(sa))) {
                  if (Math.random()>0.98) {
                      console.log("NaN!", sa, seg);
                  }
                  continue;
              }
              let sc=seg.evaluate(s1);
              if (segments.length===2) {
                  d0a.add(pa);
                  d0b.add(pb);
                  d1a.add(sa);
                  d1b.add(sb);
                  d2a.add(na);
                  d2b.add(nb);
                  let r=line_isect(pb, d0b, sb, d1b);
                  if (r[1]===COLINEAR) {
                      r = v;
                  }
                  else {
                    r = new Vector2(r[0]);
                    r.floor();
                  }
                  let r2=line_isect(pa, d0a, sa, d1a);
                  if (r2[1]===COLINEAR) {
                      r2 = v;
                  }
                  else {
                    r2 = new Vector2(r2[0]);
                    r2.floor();
                  }
                  data.setp(seg, v, 1, r);
                  data.setp(seg, v, 0, r2);
                  path.moveTo(v[0], v[1]);
                  path.lineTo(r[0], r[1]);
                  path.lineTo(sb[0], sb[1]);
                  path.lineTo(sc[0], sc[1]);
                  path.lineTo(v[0], v[1]);
                  path.moveTo(v[0], v[1]);
                  path.lineTo(sc[0], sc[1]);
                  path.lineTo(sa[0], sa[1]);
                  path.lineTo(r2[0], r2[1]);
                  path.lineTo(v[0], v[1]);
              }
              else 
                if (0) {
                  pa.interp(sa, 0.5);
                  nb.interp(sb, 0.5);
                  if (debug) {
                  }
                  data.setp(seg, v, 0, sa);
                  data.setp(seg, v, 1, sb);
                  path.moveTo(sa[0], sa[1]);
                  path.lineTo(pa[0], pa[1]);
                  path.lineTo(v[0], v[1]);
                  path.lineTo(nb[0], nb[1]);
                  path.lineTo(sb[0], sb[1]);
              }
              else 
                if (0) {
                  data.setp(seg, v, 0, sa);
                  data.setp(seg, v, 1, sb);
                  if (segments.bad_corner&&debug&&th>Math.PI*0.5) {
                      dline(v[0], v[1], (sa[0]+sb[0])*0.5, (sa[1]+sb[1])*0.5, 4);
                  }
                  if (debug) {
                      dline(sa[0], sa[1], sb[0], sb[1], 4);
                      dpoint(sa[0], sa[1], 10, dpath3);
                      dpoint(sb[0], sb[1], 10, dpath2);
                  }
                  if (1||th>Math.PI*0.5) {
                      pa.interp(sa, 0.5);
                      nb.interp(sb, 0.5);
                      path.lineTo(sa[0], sa[1]);
                      if (th1<Math.PI*0.33333) {
                          path.lineTo(pa[0], pa[1]);
                      }
                      path.lineTo(v[0], v[1]);
                      if (th2<Math.PI*0.33333) {
                          path.lineTo(nb[0], nb[1]);
                      }
                      path.lineTo(sb[0], sb[1]);
                  }
                  else {
                    path.moveTo(pa[0], pa[1]);
                    path.lineTo(v[0], v[1]);
                    path.lineTo(nb[0], nb[1]);
                    path.lineTo(sb[0], sb[1]);
                    path.lineTo(sa[0], sa[1]);
                    path.lineTo(pa[0], pa[1]);
                  }
                  if (!first) {
                  }
                  else {
                    first = false;
                  }
                  lx = sa[0];
                  ly = sa[1];
              }
          }
          if (segments.bad_corner) {
          }
      }
      let margin=0.00125;
      starts-=margin;
      ends+=margin;
      s = starts;
      ds = (ends-starts)/(steps-1);
      for (let i=0; i<steps; i++, s+=ds) {
          let dv=seg.derivative(s);
          let co=seg.evaluateSide(s, 0, dv, undefined, lwout);
          dv.mulScalar(ds/3.0);
          if (i>0) {
              path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
          }
          else {
            path.moveTo(co[0], co[1]);
          }
          lastdv = dv;
          lastco = co;
      }
      s = ends;
      for (let i=0; i<steps; i++, s-=ds) {
          let dv=seg.derivative(s);
          let co=seg.evaluateSide(s, 1, dv);
          dv.mulScalar(-ds/3.0);
          if (i>0) {
              path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
          }
          else {
            path.lineTo(co[0], co[1]);
          }
          lastdv = dv;
          lastco = co;
      }
      s = ends;
      for (var i=0; i<steps; i++, s-=ds) {
          break;
          let dv=seg.derivative(s*stretch);
          let co=seg.evaluate(s*stretch);
          let k=-seglen*seg.curvature(s*stretch);
          let shift=-seg.shift(s*stretch);
          let dshift=-seg.dshift(s*stretch);
          let lw=seg.width(s*stretch);
          let dlw=seg.dwidth(s*stretch);
          dlw = dlw*shift+dlw+dshift*lw;
          lw = lw+lw*shift;
          lw = -lw;
          dlw = -dlw;
          co[0]+=-dv[1]*lw*0.5/seglen;
          co[1]+=dv[0]*lw*0.5/seglen;
          let dx=(-0.5*(dlw*dv[1]+dv[0]*k*lw-2*dv[0]*seglen))/seglen;
          let dy=(0.5*(dlw*dv[0]-dv[1]*k*lw+2*dv[1]*seglen))/seglen;
          dv[0] = dx;
          dv[1] = dy;
          dv.mulScalar(ds/3.0);
          if (debug*0) {
              dpoint(co[0], co[1], 9);
              dpoint(co[0]+dv[0], co[1]+dv[1]);
              dline(co[0], co[1], co[0]+dv[0], co[1]+dv[1]);
              if (i>0) {
                  dpoint(lastco[0], lastco[1], 9);
                  dpoint(lastco[0]-lastdv[0], lastco[1]-lastdv[1]);
                  dline(lastco[0], lastco[1], lastco[0]-lastdv[0], lastco[1]-lastdv[1]);
                  dline(co[0]+dv[0], co[1]+dv[1], lastco[0]-lastdv[0], lastco[1]-lastdv[1]);
              }
          }
          if (i>0) {
              path.cubicTo(lastco[0]-lastdv[0], lastco[1]-lastdv[1], co[0]+dv[0], co[1]+dv[1], co[0], co[1], 1);
          }
          else {
            path.lineTo(co[0], co[1]);
          }
          lastdv = dv;
          lastco = co;
      }
      var layer=undefined;
      for (var k in seg.layers) {
          layer = spline.layerset.get(k);
      }
      if (layer!==undefined&&(layer.flag&SplineLayerFlags.MASK)) {
          var li=spline.layerset.indexOf(layer);
          if (li<=0) {
              console.trace("Error in update_seg", layer, spline);
              return path;
          }
          var prev=spline.layerset[li-1];
          var i=drawparams.z;
          var layerid=layer.id;
          while (i>0&&layerid!==prev.id) {
            i--;
            for (var k in drawlist[i].layers) {
                layerid = k;
                if (layerid===prev.id)
                  break;
            }
          }
          while (i>=0&&layerid===prev.id) {
            var item=drawlist[i];
            if (item.type===SplineTypes.FACE) {
                var path2=this.get_path(item.eid, i);
                path.add_clip_path(path2);
            }
            i--;
            if (i<0)
              break;
            for (var k in drawlist[i].layers) {
                layerid = k;
                if (layerid===prev.id)
                  break;
            }
          }
      }
      return path;
    }
     update_polygon(f, redraw_rects, actlayer, only_render, selectmode, zoom, z, off, spline, ignore_layers) {
      if (this.has_path(f.eid, z)&&!(f.flag&SplineFlags.REDRAW)) {
          return ;
      }
      f.flag&=~SplineFlags.REDRAW;
      var path=this.get_path(f.eid, z);
      path.was_updated = true;
      path.hidden = !this.draw_faces;
      path.reset();
      path.blur = f.mat.blur*(this.do_blur ? 1 : 0);
      let c1=path.color;
      let c2=f.mat.fillcolor;
      if (c2===undefined) {
          f.mat.fillcolor = c2 = new Vector4([0, 0, 0, 1]);
      }
      if (c1&&c2) {
          c1[0] = c2[0];
          c1[1] = c2[1];
          c1[2] = c2[2];
          c1[3] = c2[3];
      }
      var lastco=draw_face_vs.next().zero();
      var lastdv=draw_face_vs.next().zero();
      for (var path2 of f.paths) {
          var first=true;
          for (var l of path2) {
              var seg=l.s;
              var length=seg.length;
              var flip=seg.v1!==l.v ? -1.0 : 1.0;
              var length=Math.min(seg.ks[KSCALE], MAXCURVELEN);
              var steps=6, s=flip<0.0 ? 1.0 : 0.0;
              var ds=(1.0/(steps-1))*flip;
              for (var i=0; i<steps; i++, s+=ds) {
                  var co=seg.evaluate(s*0.9998+1e-05);
                  var dv=seg.derivative(s*0.9998+1e-05);
                  var k=seg.curvature(s*0.9998+1e-05);
                  dv.mulScalar(ds/3.0);
                  if (first) {
                      first = false;
                      path.moveTo(co[0], co[1]);
                  }
                  else {
                    if (i==0||abs(k)<1e-05/zoom) {
                        path.lineTo(co[0], co[1]);
                    }
                    else {
                      var midx=(lastco[0]+lastdv[0]+co[0]-dv[0])*0.5;
                      var midy=(lastco[1]+lastdv[1]+co[1]-dv[1])*0.5;
                      path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
                    }
                  }
                  lastco.load(co);
                  lastdv.load(dv);
              }
          }
      }
      if ((!ignore_layers&&!f.in_layer(actlayer))||only_render)
        return ;
      if ((selectmode&SelMask.FACE)&&f===spline.faces.highlight) {
          path.color[0] = 200/255, path.color[1] = 200/255, path.color[2] = 50/255, path.color[3] = 0.8;
      }
      else 
        if ((selectmode&SelMask.FACE)&&f===spline.faces.active) {
          path.color[0] = 200/255, path.color[1] = 80/255, path.color[2] = 50/255, path.color[3] = 0.8;
      }
      else 
        if ((selectmode&SelMask.FACE)&&(f.flag&SplineFlags.SELECT)) {
          path.color[0] = 250/255, path.color[1] = 140/255, path.color[2] = 50/255, path.color[3] = 0.8;
      }
      return path;
    }
     draw(g) {
      return this.drawer.draw(g);
    }
  }
  _ESClass.register(SplineDrawer);
  _es6_module.add_class(SplineDrawer);
  SplineDrawer = _es6_module.add_export('SplineDrawer', SplineDrawer);
  window._SplineDrawer = SplineDrawer;
  var SplineStrokeGroup=es6_import_item(_es6_module, './spline_strokegroup.js', 'SplineStrokeGroup');
}, '/dev/fairmotion/src/curve/spline_draw_new.js');
es6_module_define('license_api', ["../config/config.js", "./license_electron.js"], function _license_api_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  class License  {
     constructor(owner, email, issued, expiration, max_devices, used_devices, key) {
      this.owner = owner;
      this.email = email;
      this.issued = issued;
      this.expiration = expiration;
      this.max_devices = max_devices;
      this.used_devices = used_devices;
    }
  }
  _ESClass.register(License);
  _es6_module.add_class(License);
  License = _es6_module.add_export('License', License);
  var MAX_EXPIRATION_TIME=355;
  MAX_EXPIRATION_TIME = _es6_module.add_export('MAX_EXPIRATION_TIME', MAX_EXPIRATION_TIME);
  class HardwareKey  {
     constructor(deviceName, deviceKey) {
      this.deviceName = deviceName;
      this.deviceKey = deviceKey;
    }
  }
  _ESClass.register(HardwareKey);
  _es6_module.add_class(HardwareKey);
  HardwareKey = _es6_module.add_export('HardwareKey', HardwareKey);
  
  var license_electron=es6_import(_es6_module, './license_electron.js');
  function getHardwareKey() {
    if (config.ELECTRON_APP_MODE) {
        return license_electron.getHardwareKey(HardwareKey);
    }
    else {
      return new Error("can't get hardware key");
    }
  }
  getHardwareKey = _es6_module.add_export('getHardwareKey', getHardwareKey);
}, '/dev/fairmotion/src/license/license_api.js');
es6_module_define('license_electron', [], function _license_electron_module(_es6_module) {
  "use strict";
  function getHardwareKey(HardwareKeyCls) {
    var os=require('OS');
    var hostname=os.hostname();
    var platform=os.platform();
    var name=hostname;
    var key="electron_"+hostname+"_"+platform;
    return new HardwareKeyCls(name, key);
  }
  getHardwareKey = _es6_module.add_export('getHardwareKey', getHardwareKey);
}, '/dev/fairmotion/src/license/license_electron.js');
es6_module_define('theplatform', ["../common/platform_api.js"], function _theplatform_module(_es6_module) {
  var PlatformAPIBase=es6_import_item(_es6_module, '../common/platform_api.js', 'PlatformAPIBase');
  let mod=require("electron");
  if (!mod.remote) {
      class MenuItem  {
      }
      _ESClass.register(MenuItem);
      _es6_module.add_class(MenuItem);
      class Menu  {
      }
      _ESClass.register(Menu);
      _es6_module.add_class(Menu);
      console.warn("Stubbing out electron.remote; 10.0.2 bug");
      mod.remote = {nativeTheme: {}, 
     MenuItem: MenuItem, 
     Menu: Menu, 
     nativeImage: mod.nativeImage};
  }
  class ElectronPlatformAPI  {
     constructor() {

    }
     init() {

    }
     getProcessMemoryPromise() {
      return new Promise((accept, reject) =>        {
        require("process").getProcessMemoryInfo().then((data) =>          {
          let blink=require("process").getBlinkMemoryInfo();
          accept(data.private*1024+blink.total*1024);
        });
      });
    }
     errorDialog(title, msg) {
      alert(title+": "+msg);
    }
     saveFile(path_handle, name, databuf, type) {
      let fs=require("fs");
      console.warn("TESTME");
      return new Promise((accept, reject) =>        {
        fs.writeFile(path_handle, databuf, () =>          {
          accept();
        });
      });
    }
     openFile(path_handle) {
      let fs=require("fs");
      return new Promise((accept, reject) =>        {
        let buf;
        try {
          buf = fs.readFileSync(path_handle);
        }
        catch (error) {
            return reject(error.toString());
        }
        accept(buf);
      });
    }
     numberOfCPUs() {
      let os=require("os");
      let cpus=os.cpus();
      let tot=0;
      for (let cpu of cpus) {
          if (cpu.model.toLowerCase().search("intel")>=0) {
              tot+=0.5;
          }
          else {
            tot+=1.0;
          }
      }
      tot = ~~Math.ceil(tot);
      console.log(tot, cpus);
      return tot;
    }
     saveDialog(name, databuf, type) {

    }
     openDialog(type) {

    }
     openLastFile() {

    }
     exitCatcher(handler) {

    }
     quitApp() {
      close();
    }
     alertDialog(msg) {
      return new Promise((accept, reject) =>        {
        alert(msg);
        accept();
      });
    }
     questionDialog(msg) {
      return new Promise((accept, reject) =>        {
        let ret=confirm(msg);
        accept(ret);
      });
    }
  }
  _ESClass.register(ElectronPlatformAPI);
  _es6_module.add_class(ElectronPlatformAPI);
  ElectronPlatformAPI = _es6_module.add_export('ElectronPlatformAPI', ElectronPlatformAPI);
  var app=new ElectronPlatformAPI();
  app = _es6_module.add_export('app', app);
}, '/dev/fairmotion/platforms/Electron/theplatform.js');
es6_module_define('platform_html5', ["../common/platform_api.js"], function _platform_html5_module(_es6_module) {
  var PlatformAPIBase=es6_import_item(_es6_module, '../common/platform_api.js', 'PlatformAPIBase');
  class PlatformAPI extends PlatformAPIBase {
     constructor() {
      super();
    }
     getProcessMemoryPromise() {
      return new Promise(() =>        {      });
    }
     saveDialog() {

    }
     openDialog() {

    }
     numberOfCPUs() {
      return navigator.hardwareConcurrency;
    }
     alertDialog(msg) {
      alert(msg);
    }
     questionDialog(msg) {
      return new Promise((accept, reject) =>        {
        accept(confirm(msg));
      });
    }
  }
  _ESClass.register(PlatformAPI);
  _es6_module.add_class(PlatformAPI);
  PlatformAPI = _es6_module.add_export('PlatformAPI', PlatformAPI);
  var PlatCapab={NativeAPI: false, 
   saveFile: false, 
   saveDialog: true, 
   openDialog: true, 
   openLastFile: false, 
   exitCatcher: false}
  PlatCapab = _es6_module.add_export('PlatCapab', PlatCapab);
}, '/dev/fairmotion/platforms/html5/platform_html5.js');
es6_module_define('platform_phonegap', ["../common/platform_api.js"], function _platform_phonegap_module(_es6_module) {
  var PlatformAPIBase=es6_import_item(_es6_module, '../common/platform_api.js', 'PlatformAPIBase');
  class PlatformAPI extends PlatformAPIBase {
     constructor() {
      super();
    }
     getProcessMemoryPromise() {
      return new Promise();
    }
     saveDialog() {

    }
     openDialog() {

    }
  }
  _ESClass.register(PlatformAPI);
  _es6_module.add_class(PlatformAPI);
  PlatformAPI = _es6_module.add_export('PlatformAPI', PlatformAPI);
  var PlatCapab={NativeAPI: false, 
   saveFile: false, 
   saveDialog: true, 
   openDialog: true, 
   openLastFile: false, 
   exitCatcher: false}
  PlatCapab = _es6_module.add_export('PlatCapab', PlatCapab);
  var app=new PlatformAPI();
  app = _es6_module.add_export('app', app);
}, '/dev/fairmotion/platforms/PhoneGap/platform_phonegap.js');
es6_module_define('platform_chromeapp', ["../common/platform_api.js"], function _platform_chromeapp_module(_es6_module) {
  var PlatformAPIBase=es6_import_item(_es6_module, '../common/platform_api.js', 'PlatformAPIBase');
  class PlatformAPI extends PlatformAPIBase {
     constructor() {
      super();
    }
     save_dialog() {

    }
     open_dialog() {

    }
  }
  _ESClass.register(PlatformAPI);
  _es6_module.add_class(PlatformAPI);
  PlatformAPI = _es6_module.add_export('PlatformAPI', PlatformAPI);
  var PlatCapab={NativeAPI: false, 
   save_file: false, 
   save_dialog: true, 
   open_dialog: true, 
   open_last_file: false, 
   exit_catcher: false}
  PlatCapab = _es6_module.add_export('PlatCapab', PlatCapab);
}, '/dev/fairmotion/platforms/chromeapp/platform_chromeapp.js');
es6_module_define('load_wasm', ["../../platforms/platform.js", "../config/config.js"], function _load_wasm_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  es6_import(_es6_module, '../../platforms/platform.js');
  var wasm_binary=undefined;
  wasm_binary = _es6_module.add_export('wasm_binary', wasm_binary);
  var wasmBinaryPath="";
  wasmBinaryPath = _es6_module.add_export('wasmBinaryPath', wasmBinaryPath);
  console.log("%cLoading wasm...", "color : green;");
  if (config.IS_NODEJS) {
      let fs=require('fs');
      window.wasmBinaryFile = undefined;
      wasm_binary = window.solverwasm_binary = fs.readFileSync(config.ORIGIN+"/fcontent/built_wasm.wasm");
      _es6_module.add_export('wasm_binary', wasm_binary);
  }
  else {
    let path=config.ORIGIN+"/fcontent/built_wasm.wasm";
    exports.wasmBinaryPath = path;
    _es6_module.add_export('wasmBinaryPath', path);
  }
}, '/dev/fairmotion/src/wasm/load_wasm.js');
