import {nstructjs} from "../path.ux/scripts/pathux.js";

import type {StructableClass, StructableInstance} from "nstructjs";

/* What nstructjs really wants from a class handed to register()/inherit() is a
   name, a schema and a prototype to build instances on.  Its own
   StructableClass instead demands a zero-argument constructor and types
   fromSTRUCT()'s reader against the class rather than the instance, and almost
   nothing here fits that: fairmotion's elements take constructor arguments,
   several statics read an instance, and the vector compatibility shims in
   struct.ts are plain objects with no constructor at all.

   This module states what registration actually needs and converts once, in
   asStructable().  It deliberately imports nothing but path.ux -- the STRUCT
   scripts it serves are built at module scope, so anything it pulled in would
   have to be initialised first. */
export interface StructRegisterable {
  STRUCT? : string;
  structName? : string;
  name? : string;
  prototype? : object;
}

function asStructable(cls : StructRegisterable) : StructableClass<StructableInstance> {
  return cls as StructableClass<StructableInstance>;
}

export function structInherit(child : StructRegisterable, parent : StructRegisterable,
                              structName? : string) : string {
  return nstructjs.STRUCT.inherit(asStructable(child), asStructable(parent), structName);
}

export function structRegister(manager : nstructjs.STRUCT, cls : StructRegisterable,
                               structName? : string) : void {
  manager.register(asStructable(cls), structName);
}

export function structAddClass(manager : nstructjs.STRUCT, cls : StructRegisterable,
                               structName? : string) : void {
  manager.add_class(asStructable(cls), structName);
}

export function structIsRegistered(manager : nstructjs.STRUCT, cls : StructRegisterable) : boolean {
  return manager.isRegistered(asStructable(cls));
}
