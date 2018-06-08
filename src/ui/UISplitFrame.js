import {UIFrame} from 'UIFrame';
import {UIElement, UIFlags, PackFlags} from 'UIElement';
import {RowFrame, ColumnFrame} from 'UIPack';

export class UISplitFrame extends UIFrame {
  constructor(ctx, is_horizontal, canvas, path, pos, size) { //path, pos, size are optional
    super(ctx, canvas, path, pos, size);
    this.splits = [];
    this.horizontal = is_horizontal;
    
    this.state |= UIFlags.CLIP_CONTENTS;
  }
  
  initial() {
    var frame = new UISplitFrame(this.ctx, this.horizontal);
    
    this.splits.push([frame, 0.0, false, false]);
    this.add(frame);
    
    return frame;
  }
  
  split(perc1, fake, from_top, in_pixels) {
    var frame;
    
    if (perc1 === undefined || isNaN(perc1)) {
      throw new Error("Invalid percentage " + perc1);
    }
  
    var frame = fake ? undefined : new UISplitFrame(this.ctx, this.horizontal);
    
    if (this.splits.length == 0) {
      var initial = new UISplitFrame(this.ctx, this.horizontal);
      this.splits.push([initial, 0.0, false, false]);
    }
    
    this.splits.push([frame, perc1, from_top, in_pixels]);
    
    if (!fake) {
      this.add(frame);
    }
    
    return frame;
  }
  
  /*
   
   sidebar1 = f.initial();
   f.split(0.25).flag |= UIFlags.HIDDEN
   sidebar2 = f.split(0.75);
   
   */
  
  build_draw(canvas, is_vertical) {
    //canvas.push_scissor([0, 0], this.size);
    super.build_draw(canvas, is_vertical);
    //canvas.pop_scissor();
  }
  
  pack(canvas, is_vertical) {
    if (this.splits.length == 0) {
      for (let c of this.children) {
        let minsize = c.get_min_size(canvas, is_vertical);
        
        if (c.packflag & PackFlags.INHERIT_WIDTH)
          c.size[0] = this.size[0];
        else
          c.size[0] = minsize[0];
        
        if (c.packflag & PackFlags.INHERIT_HEIGHT)
          c.size[1] = this.size[1];
        else
          c.size[1] = minsize[1];
      }
      
      super.pack(canvas, is_vertical);
      return;
    }
    
    //console.log("UISplitFrame.pack()!");
    
    let size = this.horizontal ? this.size[0] : this.size[1];
    
    function get_perc(split) {
      let p = split[1];
    
      if (split[3])
        p /= size;
    
      if (split[2])
        p = 1.0 - p;
    
      return p;
    }
  
    this.splits.sort((a, b) => get_perc(a) - get_perc(b));
    
    //pack splits
    for (let i=0; i<this.splits.length; i++) {
      let split = this.splits[i];
      let frame = split[0], perc1 = get_perc(split);
      let perc2 = i < this.splits.length-1 ? get_perc(this.splits[i+1]) : 1.0;
      
      //console.log("  perc1:", perc1, "perc2:", perc2, "frame:", frame);
      
      if (frame === undefined) {
        continue;
      }
      
      let a = this.horizontal^1;
      
      frame.pos[a^1] = 0;
      frame.pos[a] = this.size[a]*perc1;
      frame.size[a^1] = this.size[a^1];
      frame.size[a] = this.size[a]*perc2 - frame.pos[a];
    }
    
    super.pack(canvas, is_vertical);
  }
}
