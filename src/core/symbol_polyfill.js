"not_a_module";

if (self.Symbol == undefined) {
  //bare, bare, bare-boned polyfill
  self.Symbol = new (function() {
    this.iterator = [Symbol.Iterator];
    this.hasInstance = "__hasInstance__";
  })();
}

