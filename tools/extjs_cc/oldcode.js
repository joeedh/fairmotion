function MySet(items=[]) {
  Array.call(this);

  this.map = {};
  this.set = new Set();

  for (let item of items) {
    this.add(item);
  }
}

MySet.prototype = Object.assign(Object.create(Array.prototype), {
  has(item) {
    if (typeof item !== "object" && typeof item !== "function") {
      item = safeToString(item);
      return item in this.map;
    } else {
      return this.set.has(item);
    }
  },

  add(item) {
    if (this.has(item)) {
      return;
    }

    if (typeof item === "object" || typeof item === "function") {
      this.set.add(item);
    } else {
      let key = safeToString(item);
      this.map[key] = 1;
    }

    this.push(item);
  },

  toJSON() {
    let ret = [];

    for (let item of this) {
      ret.push(item);
    }

    return ret;
  },
});