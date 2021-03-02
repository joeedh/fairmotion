import {DataBlock} from '../core/lib_api.js';
import {nstructjs, util, EulerOrders, Vector2, Vector3, Matrix4, Vector4, Quat} from '../path.ux/scripts/pathux.js';
import {mixinGraphNode, SocketFlags} from '../graph/graph.js';
import {FloatSocket, Vec2Socket, Matrix4Socket, Vec3Socket, DependSocket} from '../graph/graphsockets.js';
import {Scene} from './scene.js';

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

  findNearest(x, y, limit=75, selmask=255) {
    throw new Error("findNearest: implement me!");
  }

  //uniforms are webgl-style uniforms
  //even if we're not necassarily drawn with webgl
  draw(scene, drawer, uniforms) {

  }
}
SceneObjectData.STRUCT = nstructjs.inherit(SceneObjectData, NodeDataBlock) + `
}
`;
nstructjs.register(SceneObjectData);
