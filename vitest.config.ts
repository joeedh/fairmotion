import {defineConfig} from "vitest/config";
import {transform} from "esbuild";

/* path.ux source uses TC39 class auto-accessors (`accessor foo`). Vite
   transforms TS with oxc, which does not lower them, so the keyword reaches
   Node and throws "Unexpected identifier". esbuild does lower them, so run it
   as a pre-transform on the files that use one. Copied from path.ux upstream. */
const lowerAutoAccessors = () => ({
  name   : "lower-auto-accessors",
  enforce: "pre" as const,
  async transform(code: string, id: string) {
    const file = id.split("?")[0];

    if (id.includes("node_modules") || !/\.(ts|js)$/.test(file)) return null;
    if (!/\baccessor\s/.test(code)) return null;

    const res = await transform(code, {
      target    : "es2021",
      loader    : file.endsWith(".ts") ? "ts" : "js",
      sourcefile: id,
      sourcemap : true,
    });

    return {code: res.code, map: res.map};
  },
});

export default defineConfig({
  plugins: [lowerAutoAccessors()],
  test   : {
    /* playwright/*.spec.ts is run separately by `pnpm playwright` and must
       not be collected here. */
    include    : ["tests/**/*.test.ts"],
    environment: "happy-dom",
  },
});
