import {DataBlock} from '../core/lib_api.js';
import {nstructjs, util, EulerOrders, Vector2, Vector3, Matrix4, Vector4, Quat} from '../path.ux/scripts/pathux.js';
import {mixinGraphNode, SocketFlags} from '../graph/graph.js';
import {FloatSocket, Vec2Socket, Matrix4Socket, Vec3Socket, DependSocket} from '../graph/graphsockets.js';
import type {Scene} from './scene.js';

import {NodeDataBlock} from '../core/lib_api.js';

export class SceneObjectData extends NodeDataBlock {
  static nodedef() {
    return {
      inputs: {
        depend: new DependSocket(undefined, SocketFlags.MULTI),
      },

      outputs: {
        depend: new DependSocket(),
      }
    }
  }

  findNearest(x : number, y : number, limit = 75, selmask = 255) {
    throw new Error("findNearest: implement me!");
  }

  /* NOTE: nothing extends SceneObjectData and nothing calls either stub --
     SceneObject.data holds a SplineFrameSet, which descends straight from
     DataBlock.  `drawer` and `uniforms` have no implementor to type against.

     uniforms are webgl-style uniforms even if we're not necassarily drawn
     with webgl. */
  draw(scene : Scene, drawer : unknown, uniforms : unknown) {

  }
}
SceneObjectData.STRUCT = nstructjs.inherit(SceneObjectData, NodeDataBlock) + `
}
`;
nstructjs.register(SceneObjectData);
