/* SplineFrameSet: the animated document.

   Two kinds of frame data live here, because two distinct things are animated.
   `frames` holds whole splines, one per topology frame -- today there is only
   ever one, since insert_frame() refuses to make a second.  `vertex_animdata`
   holds one VertexAnimData per animated vertex of that spline, and each of those
   is a motion path drawn as geometry on `pathspline`.

   Most of what follows is keeping the two in step: uploading vertex positions
   into the paths as a frame is left (update_frame), reading them back as one is
   entered (change_time), and keeping the path geometry's layers and visibility
   matching what is selected in the scene spline. */

import { STRUCT, readSerialized } from "../struct.js";
import { DataBlock, DataTypes } from "../lib_api.js";
import { Spline } from "../../curve/spline.js";
import { SplineTypes, SplineFlags, SplineSegment, SplineVertex } from "../../curve/spline_types.js";
import { TimeDataLayer, get_vtime } from "../animdata.js";
import { SplineLayerFlags, SplineLayerSet } from "../../curve/spline_element_array.js";
import { Canvas, SimpleCanvasDraw2D } from "../../vectordraw/vectordraw.js";
import { SplineDrawer } from "../../curve/draw/spline_drawer.js";
import { draw_spline_overlay } from "../../curve/draw/spline_overlay.js";
import { VDAnimFlags, VertexAnimData } from "../animspline.js";

import { AllSplineIter } from "./all_splines.js";
import { SplineFrame } from "./frame.js";
import { SplineKCache } from "./kcache.js";

import type { SplineElement } from "../../curve/spline_base.js";
import type { BaseContext } from "../context.js";
import type { View2DHandler } from "../../editors/viewport/view2d.js";
import type { DataAPI } from "../../path.ux/scripts/pathux.js";
import type { FullContext } from "../context.js";

/* NOTE: this read `animspline.restrictflags`, which animspline declares but
   never exports -- so it has always been undefined and make_pathspline() has
   never actually restricted the path spline.  Every consumer tests
   `restrict & FLAG`, where undefined and 0 are indistinguishable. */
const restrictflags = 0;

/* Read by the STRUCT script below, which is evaluated as source rather than
   compiled, so it can only reach a global. */
window.obj_values_to_array = function obj_values_to_array<T>(obj: { [k: string]: T }) {
  let ret: T[] = [];
  for (let k in obj) {
    ret.push(obj[k]);
  }

  return ret;
};

export class SplineFrameSet extends DataBlock {
  static STRUCT: string;

  editmode: string;
  kcache: SplineKCache;
  idgen: SDIDGen;
  /* Keyed by frame time. */
  frames: { [time: number]: SplineFrame };
  /* Keyed by the eid of the scene-spline vertex being animated. */
  vertex_animdata: { [eid: number]: VertexAnimData };
  selectmode: number;
  draw_anim_paths: number;
  time: number;
  pathspline: Spline;
  spline: Spline;
  switch_on_select: boolean;

  /* eid of the vertex whose animation path is being edited, -1 for none. */
  editveid: number;
  /* Frame *times*, per the STRUCT's `array(float)`. */
  framelist: number[];
  /* Scratch layer on the pathspline that tools draw into. */
  templayerid: number;
  /* The single topology frame; insert_frame() refuses to make a second. */
  frame?: SplineFrame;
  /* Serialization-only: the frame time to restore, deleted by loadSTRUCT. */
  cur_frame?: number;

  static blockDefine() {
    return {
      typeName    : "frameset",
      defaultName : "Frameset",
      uiName      : "Frameset",
      typeIndex   : 7,
      linkOrder   : 4,
      accessorName: "framesets",
    };
  }

  constructor() {
    super(DataTypes.FRAMESET);

    this.editmode = "MAIN";
    this.editveid = -1;

    this.spline = undefined!;
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

  get active_animdata() {
    if (this.spline.verts.active === undefined) {
      return undefined;
    }

    return this.get_vdata(this.spline.verts.active.eid, true);
  }

  find_orphan_pathverts() {
    let vset = new set();
    let vset2 = new set();

    for (let v of this.spline.verts) {
      vset2.add(v.eid);
    }

    for (let k in this.vertex_animdata) {
      let vd = this.vertex_animdata[k];

      if (!vset2.has(k)) {
        delete this.vertex_animdata[k];
        continue;
      }

      for (let v of vd.verts) {
        vset.add(v.eid);
      }
    }

    let totorphaned = 0;

    for (let v of this.pathspline.verts) {
      if (!vset.has(v.eid)) {
        this.pathspline.kill_vertex(v);
        totorphaned++;
      }
    }

    if (totorphaned > 0) {
      console.log(`Killed ${totorphaned} orphaned animation verts.`);
    }
  }

  /** `threshold` defaults to 2
   * `time_threshold defaults` to 0
   */
  has_coincident_verts(threshold?: number, time_threshold?: number) {
    threshold = threshold === undefined ? 2 : threshold;
    time_threshold = time_threshold === undefined ? 0 : time_threshold;

    let ret = new set<SplineVertex>();

    for (let k in this.vertex_animdata) {
      let vd = this.vertex_animdata[k];

      let lastv: SplineVertex | undefined = undefined;
      let lasttime: number | undefined = undefined;
      for (let v of vd.verts) {
        let time = get_vtime(v);

        if (
          lastv !== undefined &&
          lastv.vectorDistance(v) < threshold &&
          Math.abs(time - lasttime!) <= time_threshold
        ) {
          console.log("Coincident vert!", k, v.eid, lastv.vectorDistance(v));

          if (v.segments.length === 2) ret.add(v);
          else if (lastv.segments.length === 2) ret.add(lastv);
        }

        lastv = v;
        lasttime = time;
      }
    }

    return ret;
  }

  //used by SplitEdgeOp.  interpolates paths between original edge vertices
  //to create a new path for the vertex at the midpoint
  create_path_from_adjacent(v: SplineVertex, s: SplineSegment) {
    if (v.segments.length < 2) {
      console.log("Invalid input to create_path_from_adjacent");
      return;
    }

    let v1 = s.other_vert(v),
      v2 = v.other_segment(s).other_vert(v);
    let av1 = this.get_vdata(v1.eid, false),
      av2 = this.get_vdata(v2.eid, false);

    if (av1 === undefined && av2 === undefined) {
      console.log("no animation data to interpolate");
      return;
    } else if (av1 === undefined) {
      av1 = av2;
    } else if (av2 === undefined) {
      av2 = av1;
    }

    let av3 = this.get_vdata(v.eid, true);

    let keyframes = new set<number>();
    for (let v of av1.verts) {
      keyframes.add(get_vtime(v));
    }

    for (let v of av2.verts) {
      keyframes.add(get_vtime(v));
    }

    let co = new Vector2();

    //ensure step func interpolation mode is off for this
    let oflag1 = av1.animflag,
      oflag2 = av2.animflag;

    av1.animflag &= VDAnimFlags.STEP_FUNC;
    av2.animflag &= VDAnimFlags.STEP_FUNC;

    for (let time of keyframes) {
      /* evaluate() only returns undefined for dead channels, and these two
         are live -- they were just fetched off this frameset. */
      let co1 = av1.evaluate(time)!,
        co2 = av2.evaluate(time)!;

      co.load(co1).add(co2).mulScalar(0.5);
      av3.update(co, time);
    }

    av3.animflag = oflag1 | oflag2;

    av1.animflag = oflag1;
    av2.animflag = oflag2;
  }

  set_visibility(vd_eid: number, state: boolean) {
    console.log("set called", vd_eid, state);

    let vd = this.vertex_animdata[vd_eid];
    if (vd === undefined) return;

    let layer = this.pathspline.layerset.idmap[vd.layerid];
    let drawlayer = this.pathspline.layerset.idmap[this.templayerid];

    vd.visible = !!state;

    for (let v of vd.verts) {
      if (state) {
        layer.remove(v);
        drawlayer.add(v);

        v.flag &= ~(SplineFlags.GHOST | SplineFlags.HIDE);

        for (let i = 0; i < v.segments.length; i++) {
          layer.remove(v.segments[i]);
          drawlayer.add(v.segments[i]);
          v.segments[i].flag &= ~(SplineFlags.GHOST | SplineFlags.HIDE);
        }
      } else {
        drawlayer.remove(v);
        layer.add(v);

        v.flag |= SplineFlags.GHOST | SplineFlags.HIDE;

        for (let i = 0; i < v.segments.length; i++) {
          drawlayer.remove(v.segments[i]);
          layer.add(v.segments[i]);

          v.segments[i].flag |= SplineFlags.GHOST | SplineFlags.HIDE;
        }
      }
    }

    this.pathspline.regen_sort();
  }

  on_destroy() {
    this.spline.on_destroy();
    this.pathspline.on_destroy();
  }

  on_spline_select(element: SplineElement, state: boolean) {
    if (!this.switch_on_select) return;

    let vd = this.get_vdata(element.eid, false);
    if (vd === undefined) return;

    let hide = !(this.selectmode & element.type);
    hide = hide || !(element.flag & SplineFlags.SELECT);

    if (element.type === SplineTypes.HANDLE) {
      /* `use` lives on SplineVertex; handles are vertices with type HANDLE. */
      let h = (element instanceof SplineVertex ? element : undefined)!;
      hide = hide || !h.use;
    }

    let layer = this.pathspline.layerset.idmap[vd.layerid];
    let drawlayer = this.pathspline.layerset.idmap[this.templayerid];
    vd.visible = !hide;

    for (let v of vd.verts) {
      v.sethide(hide);

      for (let i = 0; i < v.segments.length; i++) {
        let s = v.segments[i];

        s.sethide(hide);
        s.flag &= ~(SplineFlags.GHOST | SplineFlags.HIDE);

        if (!hide && !(drawlayer.id in s.layers)) {
          layer.remove(s);
          drawlayer.add(s);
        } else if (hide && drawlayer.id in s.layers) {
          drawlayer.remove(s);
          layer.add(s);
        }
      }

      v.flag &= ~SplineFlags.GHOST;

      if (hide) {
        drawlayer.remove(v);
        layer.add(v);
      } else {
        layer.remove(v);
        drawlayer.add(v);
      }
    }

    if (state) vd.flag |= SplineFlags.SELECT;
    else vd.flag &= ~SplineFlags.SELECT;

    this.pathspline.regen_sort();
  }

  //base spline and all animation splines
  get _allsplines() {
    return new AllSplineIter(this);
  }

  //base spline and *selected* vertex animation splines
  get _selected_splines() {
    return new AllSplineIter(this, true);
  }

  /*tags which vdatas have owners that are currently
    selected and editable*/
  sync_vdata_selstate(ctx: BaseContext) {
    for (let k in this.vertex_animdata) {
      let vd = this.vertex_animdata[k];

      if (!vd) {
        continue;
      }

      vd.animflag &= ~VDAnimFlags.OWNER_IS_EDITABLE;
    }

    for (let i = 0; i < 2; i++) {
      let list = i ? this.spline.handles : this.spline.verts;

      for (let v of list.selected.editable(ctx)) {
        let vd = this.vertex_animdata[v.eid];

        if (!vd) {
          continue;
        }

        vd.animflag |= VDAnimFlags.OWNER_IS_EDITABLE;
      }
    }
  }

  update_visibility() {
    if (_DEBUG.timeChange) console.log("update_visibility called");

    if (!this.switch_on_select) return;

    let selectmode = this.selectmode,
      show_paths = this.draw_anim_paths;
    let drawlayer = this.pathspline.layerset.idmap[this.templayerid];

    if (drawlayer === undefined) {
      console.log("this.templayerid corruption", this.templayerid);

      this.templayerid = this.pathspline.layerset.new_layer().id;
      drawlayer = this.pathspline.layerset.idmap[this.templayerid];
    }

    for (let v of this.pathspline.verts) {
      if (!v.has_layer()) {
        drawlayer.add(v);
      }

      v.sethide(true);
    }

    for (let h of this.pathspline.handles) {
      if (!h.has_layer()) {
        drawlayer.add(h);
      }

      h.sethide(true);
    }

    for (let k in this.vertex_animdata) {
      let vd = this.vertex_animdata[k];
      let v = this.spline.eidmap[k];

      if (vd.dead) {
        delete this.vertex_animdata[k];
        continue;
      }

      if (v === undefined) {
        //don't destroy anim spline immediately
        continue;
      }

      let hide = !(vd.eid in this.spline.eidmap) || !(v.flag & SplineFlags.SELECT);
      hide = hide || !(v.type & selectmode) || !show_paths;

      vd.visible = !hide;

      for (let v2 of vd.verts) {
        if (!hide) {
          v2.flag &= ~(SplineFlags.GHOST | SplineFlags.HIDE);
        } else {
          v2.flag |= SplineFlags.GHOST | SplineFlags.HIDE;
        }

        v2.sethide(hide);

        if (!hide) {
          drawlayer.add(v2);
        } else {
          drawlayer.remove(v2);
        }

        for (let s of v2.segments) {
          s.sethide(hide);

          if (!hide) {
            s.flag &= ~(SplineFlags.GHOST | SplineFlags.HIDE);
            drawlayer.add(s);
          } else {
            s.flag |= SplineFlags.GHOST | SplineFlags.HIDE;
            drawlayer.remove(s);
          }
        }
      }
    }

    this.pathspline.regen_sort();
  }

  //upload or download vertex animation data, depending on
  //if ctx.spline refers to this.spline or not
  on_ctx_update(ctx: BaseContext) {
    console.trace("on_ctx_update");

    if (ctx.spline === this.spline) {
      //XXX leave update for frame change?
    } else if (ctx.spline === this.pathspline) {
      let resolve = 0;

      for (let v of this.spline.points) {
        if (v.eid in this.vertex_animdata) {
          let vdata = this.get_vdata(v.eid, false);

          v.load(vdata.evaluate(this.time)!);

          v.flag &= ~SplineFlags.FRAME_DIRTY;
          v.flag |= SplineFlags.UPDATE;

          resolve = 1;
        }
      }

      this.spline.resolve = resolve;
    }
  }

  download() {
    console.trace("downloading. . .");
    let resolve = 0;

    for (let v of this.spline.points) {
      if (v.eid in this.vertex_animdata) {
        let vdata = this.get_vdata(v.eid, false);

        v.load(vdata.evaluate(this.time)!);
        v.flag &= ~SplineFlags.FRAME_DIRTY;
        v.flag |= SplineFlags.UPDATE;

        resolve = 1;
      }
    }

    this.spline.resolve = resolve;
  }

  update_frame(force_update?: boolean) {
    this.check_vdata_integrity();

    let time = this.time;
    let spline = this.spline;

    if (spline === undefined) return;

    if (spline.resolve) spline.solve();

    this.kcache.set(time, spline);

    let is_first = time <= 1;
    let found = false;

    for (let v of spline.points) {
      if (!(v.eid in spline.eidmap)) {
        found = true;
      }

      let dofirst = is_first && !(v.eid in this.vertex_animdata);

      if (!(force_update || dofirst || v.flag & SplineFlags.FRAME_DIRTY)) continue;

      let vdata = this.get_vdata(v.eid);
      let update = vdata.update(v, time);

      v.flag &= ~SplineFlags.FRAME_DIRTY;

      if (update) {
        spline.flagUpdateKeyframes(v);
      }
    }

    if (!found) return;

    this.insert_frame(this.time);
    this.update_visibility();
  }

  insert_frame(time: number) {
    this.check_vdata_integrity();

    //for now, let's not allow multiple topologies
    if (this.frame !== undefined) return this.frame;

    let frame = (this.frame = new SplineFrame());
    let spline = this.spline === undefined ? new Spline() : this.spline.copy();

    spline.verts.select_listeners.addListener(this.on_spline_select, this);
    spline.handles.select_listeners.addListener(this.on_spline_select, this);

    spline.idgen = this.idgen;

    frame.spline = spline;
    frame.time = time;

    this.frames[time] = frame;

    if (this.spline === undefined) {
      this.spline = frame.spline;
      this.frame = frame;
    }

    return frame;
  }

  /* NOTE: a find_frame(time, off) sat here.  It had no callers and could not
     have run: `i` was scoped to the for-loop it was read after, and `frames`
     named nothing at all (this.frames is the map).  `off` was never used. */

  change_time(time: number, _update_animation = true) {
    if (!window.inFromStruct && _update_animation) {
      this.update_frame();
    }

    let f = this.frames[0];

    for (let v of this.spline.points) {
      let vd = this.get_vdata(v.eid, false);
      if (vd === undefined) continue;

      if (v.flag & SplineFlags.SELECT) vd.flag |= SplineFlags.SELECT;
      else vd.flag &= ~SplineFlags.SELECT;

      if (v.flag & SplineFlags.HIDE) vd.flag |= SplineFlags.HIDE;
      else vd.flag &= ~SplineFlags.HIDE;
    }

    if (f === undefined) {
      f = this.insert_frame(time);
    }

    let spline = f.spline;

    if (!window.inFromStruct && _update_animation) {
      for (let v of spline.points) {
        let set_flag = v.eid in this.vertex_animdata;

        let vdata = this.get_vdata(v.eid, false);
        if (vdata === undefined) continue;

        if (set_flag) {
          spline.setselect(v, !!(vdata.flag & SplineFlags.SELECT));

          if (vdata.flag & SplineFlags.HIDE) v.flag |= SplineFlags.HIDE;
          else v.flag &= ~SplineFlags.HIDE;
        }

        v.load(vdata.evaluate(time)!);

        /* NOTE: an `if (0) {...} else {...}` sat here reading `set_update`,
           which is declared just below -- had the 0 not short-circuited the
           condition it would have thrown a TDZ ReferenceError every time. */
      }

      let set_update = true;

      //* XXX fixme, load cached curve k parameters
      if (this.kcache.has(time, spline)) {
        if (_DEBUG.timeChange) console.log("found cached k data!");

        this.kcache.load(time, spline);
        set_update = false;
      }
      //*/

      if (!set_update) {
        for (let seg of spline.segments) {
          if (seg.hidden) continue;

          seg.flag |= SplineFlags.REDRAW;
        }

        for (let face of spline.faces) {
          if (face.hidden) continue;

          face.flag |= SplineFlags.REDRAW;
        }
      } else {
        for (let v of spline.points) {
          v.flag |= SplineFlags.UPDATE;
        }
      }

      spline.resolve = 1;
      if (!window.inFromStruct) spline.solve();
    }

    for (let s of spline.segments) {
      if (s.hidden) continue;

      s.flag |= SplineFlags.UPDATE_AABB;
    }

    for (let f of spline.segments) {
      if (f.hidden) continue;

      f.flag |= SplineFlags.UPDATE_AABB;
    }

    this.spline = spline;
    this.time = time;
    this.frame = f;

    this.update_visibility();
  }

  delete_vdata() {
    this.vertex_animdata = {};
  }

  get_vdata(eid: number, auto_create = true): VertexAnimData {
    if (typeof eid !== "number") {
      throw new Error("Expected a number for eid");
    }

    if (auto_create && !(eid in this.vertex_animdata)) {
      this.vertex_animdata[eid] = new VertexAnimData(eid, this.pathspline);
    }

    return this.vertex_animdata[eid];
  }

  //checks keyframe spline data for topology errors vis-a-vis time
  //veid is optional, defaults to undefined
  check_vdata_integrity(veid?: number) {
    let found = false;

    if (veid === undefined) {
      //do all
      this.check_paths();

      for (let k in this.vertex_animdata) {
        let vd = this.vertex_animdata[k];

        if (vd.check_time_integrity()) found = true;
      }
    } else {
      let vd = this.vertex_animdata[veid];

      if (vd === undefined) {
        console.log("Error: vertex ", veid, "not in frameset");
        return false;
      }

      found = vd.check_time_integrity();
    }

    if (found) {
      this.rationalize_vdata_layers();
      this.update_visibility();
      this.pathspline.regen_solve();
      window.redraw_viewport();
    }

    return found;
  }

  check_paths() {
    let update = false;

    for (let k in this.vertex_animdata) {
      let vd = this.vertex_animdata[k];

      if (vd.dead || !vd.startv) {
        delete this.vertex_animdata[k];
        update = true;
      }
    }

    if (update) {
      console.warn("pathspline update");
      this.rationalize_vdata_layers();
      this.update_visibility();
      this.pathspline.regen_render();
      this.pathspline.regen_sort();
      this.pathspline.regen_solve();
      window.redraw_viewport();
    }

    return update;
  }

  rationalize_vdata_layers() {
    this.fix_anim_paths();

    let spline = this.pathspline;

    spline.layerset = new SplineLayerSet();

    let templayer = spline.layerset.new_layer();
    this.templayerid = templayer.id;

    spline.layerset.active = templayer;

    for (let i = 0; i < spline.elists.length; i++) {
      let list = spline.elists[i];

      list.layerset = spline.layerset;

      for (let e of list) {
        e.layers = {};
      }
    }

    for (let k in this.vertex_animdata) {
      let vd = this.vertex_animdata[k];

      let vlayer = spline.layerset.new_layer();
      vlayer.flag |= SplineLayerFlags.HIDE;

      vd.layerid = vlayer.id;
      for (let v of vd.verts) {
        for (let i = 0; i < v.segments.length; i++) {
          vlayer.add(v.segments[i]);
        }
        vlayer.add(v);
      }
    }
  }

  /* `redraw_rects` is a flat run of x1, y1, x2, y2 quadruples, not a list of
     rects; see view2d.ts. */
  draw(
    ctx: BaseContext,
    g: Canvas2D,
    editor: View2DHandler,
    matrix: Matrix4,
    redraw_rects: number[],
    ignore_layers: boolean
  ) {
    this.draw_anim_paths = editor.draw_anim_paths ? 1 : 0;
    this.selectmode = editor.selectmode;

    g.save();

    let tiled = !!editor.draw_tiled;
    let cls = tiled ? SimpleCanvasDraw2D : Canvas;

    if (this.spline.drawer === undefined) {
      this.spline.drawer = new SplineDrawer(this.spline, new cls());
    } else if (this.spline.drawer.drawer.constructor !== cls) {
      this.spline.drawer.setDrawer(new cls());
    }

    let promise = this.spline.draw(
      redraw_rects,
      g,
      editor,
      matrix,
      editor.selectmode,
      editor.only_render,
      ignore_layers
    );

    /* The overlay is drawn here rather than one level up in view2d so that the
       tiled path, which calls this method once per tile with a translated
       matrix, keeps getting one overlay per tile as it always has. */
    if (!editor.only_render) {
      draw_spline_overlay(
        this.spline,
        g,
        editor,
        matrix,
        editor.selectmode,
        editor.draw_normals,
        undefined,
        undefined,
        ignore_layers
      );
    }

    g.restore();

    return promise;
  }

  loadSTRUCT(reader: StructReader<this>) {
    window.inFromStruct = true;

    reader(this);
    super.loadSTRUCT(reader);

    //XXX kcache is being buggy, for now don't load from disk
    this.kcache = new SplineKCache();

    this.afterSTRUCT();
    if (this.pathspline === undefined) {
      this.pathspline = this.make_pathspline();
    }

    for (let vd of readSerialized<VertexAnimData[]>(this, "vertex_animdata")) {
      vd.spline = this.pathspline;

      if (vd.layerid === undefined) {
        let layer = this.pathspline.layerset.new_layer();
        layer.flag |= SplineLayerFlags.HIDE;

        vd.layerid = layer.id;

        if (vd.startv_eid !== undefined) {
          let startv = this.pathspline.eidmap[vd.startv_eid];
          /* startv_eid always names a path-spline vertex. */
          let v = (startv instanceof SplineVertex ? startv : undefined)!;
          let s = v.segments[0];

          v.layers = {};
          v.layers[vd.layerid] = 1;
          let _c1 = 0;

          while (v.segments.length > 0) {
            v.layers = {};
            v.layers[vd.layerid] = 1;

            s.layers = {};
            s.layers[vd.layerid] = 1;

            v = s.other_vert(v);
            if (v.segments.length < 2) {
              v.layers = {};
              v.layers[vd.layerid] = 1;
              break;
            }

            if (_c1++ > 100000) {
              console.log("Infinite loop detected!");
              break;
            }

            s = v.other_segment(s);
            s.layers = {};
            s.layers[vd.layerid] = 1;

            if (v === vd.startv) break;
          }
        }
      }
    }

    this.pathspline.is_anim_path = true;
    if (this.templayerid === undefined) this.templayerid = this.pathspline.layerset.new_layer().id;

    let frames: { [time: number]: SplineFrame } = {};
    let vert_animdata: { [eid: number]: VertexAnimData } = {};

    //ensure sane id generator
    let max_cur = this.idgen.cur_id;
    let firstframe: SplineFrame | undefined = undefined;
    let rawFrames = readSerialized<SplineFrame[]>(this, "frames");

    for (let i = 0; i < rawFrames.length; i++) {
      max_cur = Math.max(rawFrames[i].spline.idgen.cur_id, max_cur);

      if (i === 0) firstframe = rawFrames[i];

      rawFrames[i].spline.idgen = this.idgen;
      frames[rawFrames[i].time] = rawFrames[i];
    }
    this.idgen.max_cur(max_cur);

    let rawAnimData = readSerialized<VertexAnimData[]>(this, "vertex_animdata");

    for (let i = 0; i < rawAnimData.length; i++) {
      vert_animdata[rawAnimData[i].eid] = rawAnimData[i];
    }

    //ensure owning_veid references are up to date
    for (let k in vert_animdata) {
      let vd = vert_animdata[k];

      for (let v of vd.verts) {
        vd._get_animdata(v).owning_veid = vd.eid;
      }
    }

    this.frames = frames;
    this.pathspline.regen_sort();

    let fk = this.cur_frame || 0;
    delete this.cur_frame;

    if (fk === undefined) {
      /* Unreachable: `this.cur_frame || 0` above can never be undefined. */
      this.frame = firstframe;
      this.spline = firstframe!.spline;
    } else {
      this.frame = this.frames[fk];
      this.spline = this.frames[fk].spline;
    }

    this.vertex_animdata = vert_animdata;

    if (this.framelist.length === 0) {
      for (let k in this.frames) {
        this.framelist.push(parseFloat(k));
      }
    }

    for (let k in this.frames) {
      this.frames[k].spline.verts.select_listeners.addListener(this.on_spline_select, this);
      this.frames[k].spline.handles.select_listeners.addListener(this.on_spline_select, this);
    }

    this.spline.fix_spline(); //XXX

    this.rationalize_vdata_layers();
    this.update_visibility();

    window.inFromStruct = false;
  }

  make_pathspline() {
    let spline = new Spline();

    spline.is_anim_path = true;

    //don't allow (the users) to delete or extrude the curve,
    //or make independent points, or connect anything
    spline.restrict = restrictflags;
    spline.verts.cdata.add_layer(TimeDataLayer, "time data");

    return spline;
  }

  static defineAPI(api: DataAPI<FullContext>, struct = api.mapStruct(this, true)) {
    super.defineAPI(api, struct);
    this.defineAnimKeysAPI(api, struct);

    struct.struct("spline", "drawspline", "undefined", api.mapStruct(Spline, true));
    struct.struct("pathspline", "pathspline", "undefined", api.mapStruct(Spline, true));
    struct.list("vertex_animdata", "keypaths", [
      function getIter(api: DataAPI, list: { [eid: int]: VertexAnimData }) {
        let list2 = list;
        return (function* () {
          for (let k in list2) {
            yield list2[k];
          }
        })();
      },
      function get(api: DataAPI, list: { [eid: int]: VertexAnimData }, key: int) {
        return list[key];
      },
      function getStruct(api: DataAPI, list: { [eid: int]: VertexAnimData }, key: int) {
        /* NOTE: was a free `animdata_struct`, never declared. */
        return api.mapStruct(VertexAnimData, true);
      },
      function getLength(api: DataAPI, list: { [eid: int]: VertexAnimData }) {
        let i = 0;
        for (let k in list) {
          i++;
        }
        return i;
      },
      /*function getkeyiter() {
            var keys=Object.keys(this);
            var ret=new GArray();
            for (var i=0; i<keys.length; i++) {
                ret.push(keys[i]);
            }
            return ret;
          }*/
      /*function itempath(key) {
            return "["+key+"]";
          }*/
    ]);
    struct.struct(
      "active_animdata",
      "active_keypath",
      "undefined",
      api.mapStruct(VertexAnimData, true)
    );
    return struct;
  }
}

SplineFrameSet.STRUCT =
  STRUCT.inherit(SplineFrameSet, DataBlock) +
  `
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

DataBlock.register(SplineFrameSet);
