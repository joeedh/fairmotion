import * as pathux from '../path.ux/scripts/pathux.js';

export class HotKey extends pathux.HotKey {
  constructor() {
    super(...arguments);
    this.origHotKey = undefined;
  }

  load(b) {
    this.key = b.key;
    this.mods = b.mods.concat([]);
    this.action = b.action;

    return this;
  }

  equals(b, compareAction=true) {
    for (let mod of this.mods) {
      if (b.mods.indexOf(mod) < 0) {
        return false;
      }
    }

    if (this.key !== b.key) {
      return false;
    }

    return compareAction ? this.action === b.action : true;
  }
}

export class KeyMapDelta {
  constructor() {
    this.key = -1;
    this.modifiers = [];
    this.hotkeyRef = '';
  }
}

KeyMapDelta.STRUCT = `
KeyMapDelta {
  key       : int;
  modifiers : array(string);
  hotkeyRef : string;  
}
`;
pathux.nstructjs.register(KeyMapDelta);

export class KeyMapDeltaSet {
  constructor(typeName, deltas) {
    this.typeName = typeName;
    this.deltas = deltas || [];
  }
}
KeyMapDeltaSet.STRUCT = `
KeyMapDeltaSet {
  typeName   :  string;
  deltas     :  array(KeyMapDelta);
}
`;
pathux.nstructjs.register(KeyMapDeltaSet);

export class KeyMap extends pathux.KeyMap {
  constructor(typeName, hotkeys) {
    super(hotkeys);

    this.typeName = typeName;
    this.uiName = typeName;
    this.origKeyMap = undefined;
  }

  asDeltaSet() {
    return new KeyMapDeltaSet(this.typeName, this._save_deltas());
  }

  loadDeltaSet(dset=g_app_state.settings.getKeyMapDeltaSet(this.typeName)) {
    this._load_deltas(dset.deltas);
  }

  ensureWrite() {
    if (!this.origKeyMap) {
      this.origKeyMap = this.copy();

      for (let i = 0; i < this.length; i++) {
        let hk1 = this[i];
        let hk2 = this.origKeyMap[i];

        hk1.origHotKey = hk2;
      }
    }

    if (this.origKeyMap.length < this.length) {
      for (let j = this.origKeyMap.length; j < this.length; j++) {
        let hk1 = this[i];
        let hk2 = new HotKey();

        hk2.load(hk1);

        this.origKeyMap.push(hk2);
      }
    }
  }

  copy() {
    let ret = new this.constructor();

    for (let item1 of this) {
      let item2 = new HotKey();

      if (!item1.mods) {
        console.error(this);
        throw new error("not a hotkey!");
      }

      item2.uiname = item1.uiname;
      item2.mods = item1.mods.concat([]);
      item2.key = item1.key;
      item2.action = item1.action;

      ret.add(item2);
    }

    return ret;
  }

  _save_deltas() {
    let ret = [];

    if (!this.origKeyMap) {
      return ret;
    }

    for (let i = 0; i < this.length; i++) {
      let hk1 = this[i];
      let hk2 = this.origKeyMap[i];

      if (hk1.equals(hk2, false)) {
        continue;
      }

      let hotkeyRef = this._buildKey(hk1);
      let delta = new KeyMapDelta();

      delta.modifiers = hk1.mods;
      delta.key = hk1.key;
      delta.hotkeyRef = hotkeyRef;

      ret.push(delta);
    }

    return ret;
  }

  _load_deltas(deltas) {
    this.ensureWrite();

    for (let delta of deltas) {
      for (let i = 0; i < this.length; i++) {
        let hk1 = this[i], hk2 = this.origKeyMap[i];

        if (this._buildKey(hk2) !== delta.hotkeyRef) {
          continue;
        }

        hk1.key = hk2.key;
        hk1.modifiers = hk2.modifiers;

        break;
      }
    }
  }

  _buildKey(hk) {
    if (typeof hk.action === "string") {
      /* return just the action if it's a string,
         so we can change hotkeys without effecting
         mappings later. */

      return hk.action;
    }

    let key = "" + hk.key + ":" + hk.mods.join(":");
    return key;
  }

  loadSTRUCT(reader) {
    reader(this);

    this._load_deltas(this.deltas);
  }
}

KeyMap.STRUCT = `
KeyMap {
  typeName : string;
  deltas   : array(KeyMapDelta) | this._save_deltas();
}
`;
pathux.nstructjs.register(KeyMap);
