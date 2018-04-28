process.once('loaded', () => {
  console.log("Preload!");
  global.BLEH = 1;
  window.BLEH = 2;
});

