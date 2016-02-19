import {PropTypes, TPropFlags, DataRefProperty} from 'toolprops';

import {MinMax, inrect_2d, aabb_isect_2d} from 'mathlib';

var UIElement, UIFrame;

import {UIElement, PackFlags, UIFlags, CanvasFlags} from 'UIElement';
import {UIFrame} from 'UIFrame';

import {
  UIButtonAbstract, UIButton, UIButtonIcon,
  UIMenuButton, UICheckBox, UINumBox, UILabel,
  UIMenuLabel, ScrollButton, UIVScroll, UIIconCheck
} from 'UIWidgets';

#include "src/core/utildefine.js"

export class UIPackFrame extends UIFrame {
  constructor(ctx, path_prefix)
  {
    super(ctx);
    
    this.mm = new MinMax(2);
    this._last_pack_recalc = 0;
    
    if (path_prefix == undefined)
      path_prefix = ""
    
    this.path_prefix = path_prefix;
    this.min_size = undefined : Array<float>;
    
    this.last_ms = 0;
    this.last_pos = new Vector2();
    this.last_size = new Vector2();
    this.default_packflag = 0;
  }
  
  build_draw(UICanvas canvas, Boolean isVertical) {
    if (this.is_canvas_root())
      this.pack(canvas, isVertical);
      
    super.build_draw(canvas, isVertical);
  }
 
  on_resize(Array<int> newsize, Array<int> oldsize)
  {
    super.on_resize(newsize, oldsize);
    
    //var canvas = this.get_canvas();
    //if (canvas != undefined)
    //  this.pack(canvas, false);
  }
  
  add(UIElement child, packflag=0) {
    packflag |= this.default_packflag;
    
    super.add(child, packflag);
  }
  
  prepend(UIElement child) {
    child.packflag |= this.default_packflag;
    super.prepend(child);
  }
  
  toolwidget(path, inherit_flag=0, label=undefined) {
    var ret = this.toolop(path, inherit_flag, label);
    ret.path_exec_widget = true;
    
    return ret;
  }
  
  _inherit_packflag(inherit_flag) {
    var icon_size = inherit_flag & (PackFlags.USE_LARGE_ICON|PackFlags.USE_SMALL_ICON);

    if (icon_size == 0) {
        icon_size = this.default_packflag & (PackFlags.USE_LARGE_ICON|PackFlags.USE_SMALL_ICON);
    }
    
    inherit_flag |= this.default_packflag & ~(PackFlags.USE_SMALL_ICON|PackFlags.USE_SMALL_ICON);
    inherit_flag |= icon_size;
    
    return inherit_flag;
  }
  
  toolop(path, inherit_flag=0, label=undefined) {
    var ctx = this.ctx;
    var opname = ctx.api.get_op_uiname(ctx, path);

    inherit_flag = this._inherit_packflag(inherit_flag);
    
    if (opname == undefined) {
      console.trace();
      console.log("couldn't find tool operator at path" + path + ".");
      return;
    }
    
    if (label != undefined)
      opname = label;
    
    if (inherit_flag & PackFlags.USE_ICON) {
      var op = ctx.api.get_op(ctx, path);
      if (op == undefined) {
        console.trace();
        console.log("Error fetching operator ", path);
        var c = new UIButton(ctx, "???");
        
        c.packflag |= inherit_flag;
        this.add(c);
        return c;
      }
      
      if (DEBUG.icons)
        console.log("icon toolop", op.icon);
      
      if (op.icon >= 0) {
        var use_small = inherit_flag & PackFlags.USE_SMALL_ICON;
        
        var c = new UIButtonIcon(ctx, opname, op.icon, [0,0], [0,0], path, undefined, undefined, use_small);
        c.packflag |= inherit_flag;
        this.add(c);
        
        return c; //NON-PRECONDITION EXIT POINT
      }
    }
    
    var c = new UIButton(ctx, opname, [0,0], [0,0], path);
    
    if (inherit_flag != undefined) 
      c.packflag |= inherit_flag;
      
    this.add(c);
    return c;
  }

  pack(canvas, isVertical) {
    var arr = [0, 0];
    var mm = this.mm;
    
    if (this.state & UIFlags.HAS_PAN) {
      mm.reset();
      for (var c of this.children) { 
        arr[0] = c.pos[0]+c.size[0];
        arr[1] = c.pos[1]+c.size[1];
        mm.minmax(c.pos);
        mm.minmax(arr);
      }
      
      //this.pan_bounds[0] = new Vector2(mm.min);
      if (this.packflag & PackFlags.CALC_NEGATIVE_PAN) {
        this.pan_bounds[0] = new Vector2(mm.min).sub(mm.max).mulScalar(0.5);
        this.pan_bounds[1] = new Vector2(mm.max).sub(mm.min);
        
        //this.pan_bounds[1][0] -= this.size[0];
        //this.pan_bounds[1][1] -= this.size[1];
      } else {
        this.pan_bounds[1] = new Vector2(mm.max).sub(mm.min);
        this.pan_bounds[1][0] -= this.size[0];
        this.pan_bounds[1][1] -= this.size[1];
      }
      
      if (this.packflag & PackFlags.PAN_X_ONLY) {
        this.pan_bounds[0][1] = this.pan_bounds[1][1] = 0.0;
      } else if (this.packflag & PackFlags.PAN_Y_ONLY) {
        this.pan_bounds[0][0] = this.pan_bounds[1][0] = 0.0;
      }
    }
  }

  //setter_path is used for mass set paths
  prop(path, packflag=0, setter_path=undefined) { 
    packflag = this._inherit_packflag(packflag);
      
    if (this.path_prefix.length > 0)
      path = this.path_prefix + "." + path
    
    if (setter_path == undefined)
      setter_path = path;

    var ctx = this.ctx;
    var prop = ctx.api.get_prop_meta(ctx, path)
    
    if (prop == undefined) {
      console.trace();
      console.log("couldn't find property: " + path + ".", this.path_prefix);
      return;
    }
    
    if (prop.type == PropTypes.ENUM) {
      console.log("   ==>", prop.type, packflag, path, prop, packflag & 4096);
    }
    
    if (prop.type == PropTypes.INT || prop.type == PropTypes.FLOAT) {
      var range = prop.range;
      if (prop.range == undefined || (prop.range[0] == 0 && prop.range[1] == 0)) {
        range = [-2000, 2000];
      }
      
      var c = new UINumBox(ctx, prop.uiname, range, prop.data, [0,0], [0,0], path);
      c.packflag = packflag;
      c.unit = prop.unit;
      c.setter_path = setter_path;
      
      this.add(c);
    } else if (prop.type == PropTypes.ENUM && (packflag & PackFlags.ENUM_STRIP)) {
      var checkmap = {};
      var this2 = this;
      prop.ctx = ctx;
      
      function update_enum(chk, val) {
        console.log("check update", chk, val);
        
        //only allow check sets
        if (!val) {
          chk.set = true;
          return;
        }
        
        for (var k in checkmap) {
          var check = checkmap[k];
          
          if (check === chk) {
            //prop.ctx = this2.ctx;
            //prop.set_value(k);
            //prop.set_data(prop.data);
            
            this2.ctx.api.set_prop(this2.ctx, path, prop.keys[k]);
            
            console.log("FOUND", prop.data, prop, k, "||");
            continue;
          }
          
          check.set = false;
          check.do_recalc();
        }
        
        var val = prop.values[k];
      }
      
      var subframe;
      if (this instanceof ColumnFrame) {
        subframe = this.col();
      } else {
        subframe = this.row();
      }
      
      subframe.packflag |= packflag|PackFlags.NO_AUTO_SPACING
                        | PackFlags.NO_LEAD_SPACING
                        | PackFlags.NO_TRAIL_SPACING;
      
      var large_icon = packflag & PackFlags.USE_LARGE_ICON;
      
      subframe.pad[0] = large_icon ? -4 : -2;
      subframe.pad[1] = large_icon ? -4 : -3;
      
      function update_callback(chk) {
        var val = undefined;
        
        for (var k in checkmap) {
          var check = checkmap[k];
          if (check === chk) {
            val = k;
            break;
          }
        }
        
        if (val == undefined) {
          console.log("error with ui enum strip; path:", path);          
          return; //XXX
        }
        
        val = ctx.api.get_prop(ctx, path) == prop.keys[val];
        if (!!val != !!chk.set) {
          chk.set = val;
          chk.do_recalc();
        }
      }
      
      if (packflag & PackFlags.USE_ICON) {
        for (var k in prop.values) {
          var label = prop.ui_value_names != undefined ? prop.ui_value_names[k] : k;
          if (label == undefined) label = "(error)";
          
          var c = new UIIconCheck(ctx, "", prop.iconmap[prop.values[k]]);
          
          c.packflag |= packflag;
          
          c.setter_path = setter_path;
          c.callback = update_enum
          c.icon = prop.iconmap[k];
          c.draw_check = false;
          c.update_callback = update_callback;
          
          c.description = label + "\n" + prop.description;
          
          if (prop.get_value() == prop.values[k])
            c.set = true;
          
          subframe.add(c);
          checkmap[prop.values[k]] = c;
        }
      } else {
        for (var k in prop.values) {
          var label = prop.ui_value_names != undefined ? prop.ui_value_names[k] : k;
          if (label == undefined) label = "(error)";
          
          var c = new UICheckBox(ctx, label);
          
          c.setter_path = setter_path;
          c.callback = update_enum
          c.draw_check = false;
          c.update_callback = update_callback;
          
          if (prop.get_value() == prop.values[k])
            c.set = true;
            
          subframe.add(c);
          checkmap[prop.values[k]] = c;
        }
      }
      
      return subframe;
    } else if (prop.type == PropTypes.ENUM) {
      var c = new UIMenuButton(ctx, undefined, [0,0], [0,0], path);
      
      c.setter_path = setter_path;
      c.packflag |= packflag;
      
      this.add(c);
      return c;
    } else if ((prop.type == PropTypes.VEC3 && prop.subtype == PropTypes.COLOR3) || 
               (prop.type == PropTypes.VEC4 && prop.subtype == PropTypes.COLOR4))
    {
      if (packflag & PackFlags.COLOR_BUTTON_ONLY) {
        var colorb = new UIColorButton(ctx, packflag|this.default_packflag);
        
        colorb.state |= UIFlags.USE_PATH;
        colorb.data_path = path;
        colorb.setter_path = setter_path;
        
        this.add(colorb, packflag);
        return colorb;
      } else {
        var field = new UIColorPicker(ctx, undefined, prop.subtype == PropTypes.COLOR3 ? 3 : 4);
        
        field.state |= UIFlags.USE_PATH;
        field.data_path = path;
        field.setter_path = setter_path;
        
        this.add(field, packflag);
        return field;
      }
    } else if (prop.type == PropTypes.VEC2) {
        range = (prop.range != undefined && prop.range[0] != undefined) ? prop.range : [-2000, 2000];
        
        var row = this.row();
        row.packflag = packflag;
        
        row.label(prop.uiname);
        var c = new UINumBox(ctx, "X", range, prop.data, [0,0], [0,0], path + "[0]");
        
        c.unit = prop.unit;
        c.setter_path = setter_path+"[0]";
        c.packflag |= packflag;
        row.add(c);
        
        var c = new UINumBox(ctx, "Y", range, prop.data, [0,0], [0,0], path + "[1]");
        
        c.unit = prop.unit;
        c.setter_path = setter_path+"[1]";
        c.packflag |= packflag;
        row.add(c);
        
        return row;
    } else if (prop.type == PropTypes.VEC3) {
        range = (prop.range != undefined && prop.range[0] != undefined) ? prop.range : [-2000, 2000];
        
        var row = this.row();
        row.packflag = packflag;
        
        row.label(prop.uiname);
        var c = new UINumBox(ctx, "X", range, prop.data, [0,0], [0,0], path + "[0]");
        
        c.unit = prop.unit;
        c.setter_path = setter_path+"[0]";
        c.packflag |= packflag;
        row.add(c);
        
        var c = new UINumBox(ctx, "Y", range, prop.data, [0,0], [0,0], path + "[1]");
        
        c.unit = prop.unit;
        c.setter_path = setter_path+"[1]";
        c.packflag |= packflag;
        row.add(c);
        
        var c = new UINumBox(ctx, "Z", range, prop.data, [0,0], [0,0], path + "[2]");

        c.unit = prop.unit;
        c.setter_path = setter_path+"[2]";
        c.packflag |= packflag;
        row.add(c); //
        
        return row;
    } else if (prop.type == PropTypes.VEC4) {
        range = (prop.range != undefined && prop.range[0] != undefined) ? prop.range : [-2000, 2000];
        
        var row = this.row();
        
        row.label(prop.uiname);
        var c = new UINumBox(ctx, "X", range, prop.data, [0,0], [0,0], path + "[0]");

        c.setter_path = setter_path+"[0]";
        c.packflag |= packflag;
        c.unit = prop.unit;
        row.add(c);

        var c = new UINumBox(ctx, "Y", range, prop.data, [0,0], [0,0], path + "[1]");

        c.setter_path = setter_path+"[1]";
        c.packflag |= packflag;
        c.unit = prop.unit;
        row.add(c);

        var c = new UINumBox(ctx, "Z", range, prop.data, [0,0], [0,0], path + "[2]");

        c.setter_path = setter_path+"[2]";
        c.packflag |= packflag;
        c.unit = prop.unit;
        row.add(c);

        var c = new UINumBox(ctx, "W", range, prop.data, [0,0], [0,0], path + "[3]");

        c.setter_path = setter_path+"[3]";
        c.packflag |= packflag;
        c.unit = prop.unit;
        row.add(c);
        
        return row;
    } else if (prop.type == PropTypes.STRING && (prop.flag & TPropFlags.LABEL)) {
      var ret = this.label(path, true, packflag);
      ret.setter_path = setter_path;
      
      return ret;
    } else if (prop.type == PropTypes.BOOL) {
      var check;
      
      if (packflag & PackFlags.USE_ICON) {
        check = new UIIconCheck(ctx, "", prop.icon, undefined, undefined, path);
      } else {
        check = new UICheckBox(ctx, prop.uiname, undefined, undefined, path);
      }
      
      check.setter_path = setter_path;
      check.packflag |= packflag;
      
      this.add(check);
    } else if (prop.type == PropTypes.FLAG) {
      var row = this.row();
      row.packflag |= packflag;
      
      //one flag only
      if (path.trim().endsWith("]")) {
          var s = path.trim();
          var i = s.length - 1;
          
          while (i >= 0 && s[i-1] != "[") {
            i--;
          }
          
          var key = s.slice(i, s.length-1).trim();
          console.log("PROP", prop);
          
          var uiname = prop.ui_key_names[key];
          
          //console.log("        UINAME KEY   '" + key + "'");
          //console.log(prop.ui_key_names, prop);
          
          if (uiname == undefined) {
            console.log("WARNING: possibly bad flag mask (will try interpreting it as integer)", path);
            
            key = parseInt(key);
            uiname = prop.ui_key_names[key];
          }
          
          if (isNaN(parseInt(key)) && key in prop.keys) {
            key = prop.keys[key];
          }
          
          if (uiname == undefined) 
            uiname = "(corrupted)";
            
          var check = new UICheckBox(ctx, uiname, undefined, undefined, path);
          this.add(check);
          
          check.packflag |= PackFlags.INHERIT_WIDTH;
          check.setter_path = setter_path;
        
          return check;
      } else {
        row.label(prop.uiname + ":");
        for (var k in prop.keys) {
          var uiname = prop.ui_key_names[k];
          
          var path2 = path + "["+k+"]"
          var check = new UICheckBox(ctx, uiname, undefined, undefined, path2);
          
          check.packflag |= PackFlags.INHERIT_WIDTH;
          check.setter_path = setter_path + "["+k+"]";
          
          row.add(check);
        }
        
        return check;
      }
    } else if (prop.type == PropTypes.DATAREF) {
      var c = new UIMenuButton(ctx, undefined, [0,0], [0,0], path);
      
      c.setter_path = setter_path;
      c.packflag |= packflag;
      
      this.add(c);
    } else {
      if (1||DEBUG.ui_datapaths)
        console.log("warning: unimplemented property type for path " + path + " in user interface code");
    }
  }
    
  label(text, use_path=false, align=0) {
    align = this._inherit_packflag(align);
    
    if (use_path != undefined && use_path) {
      var c = new UILabel(this.ctx, "", [0,0], [0,0], text);
      this.add(c);
      
      if (align)
        c.packflag |= align;
      
      return c;
    } else {
      var c = new UILabel(this.ctx, text, [0,0], [0,0], undefined);
      this.add(c);
      
      if (align)
        c.packflag |= align;
      
      return c;
    }
  }
  
  tabstrip(int align=0, int default_packflag=0) {
    var flip = this.default_packflag & PackFlags.FLIP_TABSTRIP;
    flip = flip || (align & PackFlags.FLIP_TABSTRIP);
      
    var ret = new UITabPanel(this.ctx, undefined, undefined, flip);
    ret.packflag |= align|PackFlags.INHERIT_WIDTH;
    ret.default_packflag = this._inherit_packflag(default_packflag);
    
    this.add(ret);
    return ret;
  }
  
  panel(String label, String permid, int align=0, int default_packflag=0) {
    align |= this.default_packflag;
    
    var ret = new UIPanel(this.ctx, label, permid);
    ret.packflag |= align|PackFlags.INHERIT_WIDTH;
    ret.default_packflag = this.default_packflag|default_packflag;
    
    this.add(ret);
    
    return ret;
  }
  
  row(String path_prefix="", int align=0, int default_packflag=0) { //path_prefix is optional
    align |= this.default_packflag;
    
    var row = new RowFrame(this.ctx, this.path_prefix);
    this.add(row);
    
    row.default_packflag |= default_packflag|this.default_packflag;
    row.packflag |= align;
      
    return row;
  }

  col(String  path_prefix="", int align=0, int default_packflag=0) { //path_prefix is optional
    align |= this.default_packflag;
    
    var col = new ColumnFrame(this.ctx, this.path_prefix);
    this.add(col);
    
    col.default_packflag |= default_packflag|this.default_packflag;
    col.packflag |= align;
    
    return col;
  }
  
  on_tick() {
    UIFrame.prototype.on_tick.call(this);
    
    if (time_ms() - this._last_pack_recalc > 300) {
      this._pack_recalc();
      this._last_pack_recalc = time_ms();
    }
  }
  
  _pack_recalc() 
  {
    if (time_ms()-this.last_ms < 40) {
      return;
    }
    
    this.last_ms = time_ms();
     
    //flag a complete recalc of parent container
    //if size or position has changed,
    //as the canvas cached will be messed up
    //otherwise.
    
    if (this.last_pos.vectorDistance(this.pos) > 0.0001 || this.last_size.vectorDistance(this.size) > 0.00001) {
      if (DEBUG.complex_ui_recalc) {
        console.log("complex ui recalc", this.pos.toString(), this.last_pos.toString(), this.last_pos.vectorDistance(this.pos), this.last_size.vectorDistance(this.size));
      }
      this.parent.do_full_recalc();
      this.do_recalc();
      
      for (var c of this.children) {
        if (!(c instanceof UIFrame)) {
          c.recalc = 1;
        }
      }
      
      this.last_pos.load(this.pos);
      this.last_size.load(this.size);
    }
  }
}

export class RowFrame extends UIPackFrame {
  constructor(ctx, path_prefix, align)
  {
    super(ctx, path_prefix);
    
    this.packflag |= PackFlags.INHERIT_HEIGHT|align;
    this.pad = [4, 4];
  }
  
  get_min_size(UICanvas canvas, Boolean isvertical) {
    if (canvas == undefined) {
      console.trace();
      console.log("Warning: undefined canvas in get_min_size");
      return;
    }
    
    var maxwidth = 0;
    var tothgt = 0;
    
    for (var c of this.children) {
      var size;
      
      if (!(c.packflag & PackFlags.KEEP_SIZE))
        size = c.cached_min_size(canvas, isvertical);
      else
        size = c.size
      
      tothgt += size[1]+this.pad[1];
      maxwidth = Math.max(maxwidth, size[0]+2);
    }
    
    if (this.min_size != undefined) {
      maxwidth = Math.max(maxwidth, this.min_size[0]);
      tothgt = Math.max(tothgt, this.min_size[1]);
    }
    
    return [Math.max(maxwidth, 1), Math.max(tothgt, 1)];
  }

  pack(UICanvas canvas, Boolean is_vertical) {
    if (canvas == undefined) {
      console.trace();
      console.log("Warning: undefined canvas in pack");
      return;
    }
    
    if (this.size[0] == 0 && this.size[1] == 0) {
      this.size[0] = this.parent.size[0];
      this.size[1] = this.parent.size[1];
    }
    
    var minsize = this.get_min_size(canvas, is_vertical);
    //console.log("Minsize!", minsize[0], minsize[1], this.size[0], this.size[1]);
    
    var spacing;
    
    if (this.packflag & PackFlags.NO_AUTO_SPACING) {
      spacing = this.pad[1];
    } else {
      var spacing = Math.floor((this.size[1] - minsize[1])/this.children.length);
      spacing = Math.max(spacing, this.pad[1]);
    }
    
    var x = 0;
    var y;
    
    if (this.packflag & PackFlags.ALIGN_BOTTOM)
      y = this.pad[1];
    else
      y = this.size[1]-this.pad[1];
    
    for (var i=0; i<this.children.length; i++) {
      var c = this.children[i];
      var size;
      
      if (!(c.packflag & PackFlags.KEEP_SIZE))
        size = c.cached_min_size(canvas, is_vertical);
      else
        size = c.size;
      
      size = [size[0], size[1]];
      size[0] = Math.min(size[0], this.size[0]);

      if (c.packflag & PackFlags.INHERIT_WIDTH)
        size[0] = this.size[0]-2
      if (c.packflag & PackFlags.INHERIT_HEIGHT)
        size[1] += spacing;
      
      if (c.size == undefined)
        c.size = [0, 0];
      c.size[0] = size[0];
      c.size[1] = size[1];
      
      var final_y = y;
      if (!(this.packflag & PackFlags.ALIGN_BOTTOM))
        final_y -= size[1];
      
      if (this.packflag & PackFlags.ALIGN_RIGHT) {
        c.pos = [this.size[0]-size[0]-x, final_y];
      } else if (this.packflag & PackFlags.ALIGN_LEFT) {
        c.pos = [x, final_y];
      } else {
        c.pos = [x + Math.floor(0.5*(this.size[0]-size[0])), final_y];
      }
      
     var space = (c.packflag & PackFlags.INHERIT_HEIGHT) ? 0 : spacing;
     if (this.packflag & PackFlags.ALIGN_BOTTOM)
        y += c.size[1]+space;
      else
        y -= c.size[1]+space;
      
      if (!(c.packflag & PackFlags.NO_REPACK))
        c.pack(canvas, is_vertical);
    }
    
    //this._pack_recalc();
    super.pack(canvas, is_vertical);
    //this.size[1] = Math.max(this.size[1], minsize[1]);
  }
}

export class ColumnFrame extends UIPackFrame {
  constructor(ctx, path_prefix, align)
  {
    super(ctx, path_prefix);
    this.packflag |= PackFlags.INHERIT_WIDTH|align
    this.pad = [2, 2];
  }

  get_min_size(UICanvas canvas, Boolean isvertical) {
    if (canvas == undefined) {
      console.trace();
      console.log("Warning: undefined canvas in get_min_size");
      return;
    }
    
    var maxheight = 0;
    var totwid = 0;
    
    for (var c of this.children) {
      var size;
      
      if (!(c.packflag & PackFlags.KEEP_SIZE))
        size = c.cached_min_size(canvas, isvertical);
      else
        size = [c.size[0], c.size[1]];
        
      totwid += size[0] + this.pad[0];
      maxheight = Math.max(maxheight, size[1] + this.pad[1]);
    }
    
    if (this.min_size != undefined) {
      totwid = Math.max(totwid, this.min_size[0]);
      maxheight = Math.max(maxheight, this.min_size[1]);
    }
    
    return [totwid, maxheight];
  }

  pack(UICanvas canvas, Boolean is_vertical) {
    if (canvas == undefined) {
      console.trace();
      console.log("Warning: undefined canvas in pack");
      return;
    }
    
    if (!(this.packflag & PackFlags.ALIGN_LEFT) && !(this.packflag & PackFlags.ALIGN_RIGHT))
      this.packflag |= PackFlags.ALIGN_CENTER;
      
    if (this.size[0] == 0 && this.size[1] == 0) {
      this.size[0] = this.parent.size[0];
      this.size[1] = this.parent.size[1];
    }
    
    var minsize = this.get_min_size(canvas, is_vertical);
    //console.log("Minsize!", minsize[0], minsize[1], this.size[0], this.size[1]);
    
    if (this.packflag & PackFlags.NO_AUTO_SPACING) {
      spacing = this.pad[0];
    } else {
      var spacing = Math.floor((this.size[0] - minsize[0])/(this.children.length));
      spacing = Math.max(spacing, this.pad[0]);
    }
    
    var sum=0;
    var max_wid = 0;
    var max_hgt = 0;
    for (var c of this.children) {
      var s;
      
      if (!(c.packflag & PackFlags.KEEP_SIZE))
        s = c.cached_min_size(canvas, is_vertical);
      else
        s = [c.size[0], c.size[1]];
      
      max_wid = Math.max(s[0], max_wid);
      max_hgt = Math.max(s[1], max_hgt);
      sum += s[0];
    }
    if (!(this.packflag & PackFlags.IGNORE_LIMIT))
      max_wid *= ((this.size[0])/sum);
    
    var x;
    var y;
    if (this.packflag & PackFlags.ALIGN_BOTTOM) {
      y = this.pad[1];
    } else if (this.packflag & PackFlags.ALIGN_TOP) {
      y = this.size[1] - max_hgt - this.pad[1];
    } else {
      y = (this.size[1]-max_hgt)*0.5;
    }
    
    var startx;
    if (this.packflag & PackFlags.NO_LEAD_SPACING)
      startx = 0;
    else
      startx = this.pad[0];
      
    var do_center_post = false;
    if (this.packflag & PackFlags.ALIGN_RIGHT) {
      x = this.size[0]-startx;
    } else if (this.packflag & PackFlags.ALIGN_LEFT) {
      x = startx;
    } else {
      this.packflag |= PackFlags.ALIGN_CENTER;
      x = 0; //elements will be offset later
    }
    
    var pad = this.pad[0];
    var finalwid = 0;
    for (var c of this.children) {
      var size;
      
      if (!(c.packflag & PackFlags.KEEP_SIZE))
        size = c.cached_min_size(canvas, is_vertical);
      else
        size = c.size;
        
      size = [size[0], size[1]];
      if (!(this.packflag & PackFlags.IGNORE_LIMIT)) {
        if (c.packflag & PackFlags.INHERIT_WIDTH)
          size[0] = Math.min(size[0], max_wid-pad)+spacing;
        else
          size[0] = Math.min(size[0], max_wid-pad);
      }
      
      if (c.packflag & PackFlags.INHERIT_HEIGHT)
        size[1] = this.size[1]-this.pad[1]
      
      if (c.size == undefined)
        c.size = [0, 0];
      c.size[0] = size[0];
      c.size[1] = size[1];
      
      var space = (c.packflag & PackFlags.INHERIT_WIDTH) ? 0 : spacing;
      if (this.packflag & PackFlags.ALIGN_RIGHT) {
        c.pos = [x-size[0], y];
        finalwid = this.size[0]-x-size[0]-1;
        x -= Math.floor(size[0]+pad+space);
      } else {
        c.pos = [x, y];
        finalwid = x+size[0];
        x += Math.floor(size[0]+pad+space);
      }
      
      if (!(c.packflag & PackFlags.NO_REPACK))
        c.pack(canvas, is_vertical);
    }
    
    if ((this.packflag & PackFlags.ALIGN_CENTER) && finalwid < this.size[0]) {
      for (var c of this.children) {
        if (this.packflag & PackFlags.ALIGN_RIGHT)
          c.pos[0] -= Math.floor((this.size[0]-finalwid)*0.5);
        else
          c.pos[0] += Math.floor((this.size[0]-finalwid)*0.5);
      }
    }
    
    //this._pack_recalc();
    super.pack(canvas, is_vertical);
  }
}

var _te = 0;
export class ToolOpFrame extends RowFrame {
  constructor(ctx, path) {
    super(ctx, path);
    
    this.rebuild = true;
    this.strct = undefined;
    this.ctx = ctx;
  }

  do_rebuild(ctx) {
    var strct = this.ctx.api.get_struct(ctx, this.path_prefix);
    
    this.children.reset();
    
    if (strct == undefined) return;
    
    this.strct = strct;
    for (var p of strct) {
      if (!(p.flag & PackFlags.UI_DATAPATH_IGNORE))
        this.prop(p.name, PackFlags.INHERIT_WIDTH);
    }
  }

  on_tick() {
    var strct = this.ctx.api.get_struct(this.ctx, this.path_prefix);
    
    if (strct != this.strct) {
      this.do_rebuild(this.ctx);
      this.do_recalc();
      this.strct = strct;
    }
    
    RowFrame.prototype.on_tick.call(this);
  }

  build_draw(UICanvas canvas, Boolean isVertical) {
    if (this.rebuild) {
      this.do_rebuild(this.ctx);
      this.rebuild = false;
    }
    
    canvas.simple_box([0,0], this.size, [0.2, 0.2, 0.2, 0.1]);
    super.build_draw(canvas, isVertical);
  }
}
