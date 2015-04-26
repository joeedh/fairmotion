"not_a_module";

if (self.Symbol == undefined) {
  //bare, bare, bare-boned polyfill
  self.Symbol = new (function() {
    this.iterator = "__iterator__";
    this.hasInstance = "__hasInstance__";
  })();
}

