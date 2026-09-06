# Fairmotion

- 2D vector animation app.
- `src/` is the application.
- `src/path.ux` is a git submodule (joeedh/path.ux) providing:
  - the UI toolkit
  - the data API
  - the tool system
  - `nstructjs` serialization
  - vectormath (`Vector2/3/4`, `Matrix4`, `Quat`)

## Toolchain

| Job | Tool |
|---|---|
| Package management | **pnpm** (never `npm` or `yarn`) |
| Typecheck | **tsgo** — `npx tsgo --noEmit` (`@typescript/native-preview`) |
| Format / lint | **`@pathtx/prettier`** — joeedh's prettier fork; `pnpm run lint` runs `pnpm run lint:prose`, which invokes a comment linter |
| Build | **esbuild** |
| Unit tests | vitest |
| E2E | Playwright |

- Targets: an **html5 app** and an **electron app**.
- Both are built by `buildtools/esbuild.mjs`:
  - `pnpm build`
  - `pnpm build:electron`
  - `pnpm watch`
- `buildtools/serv.mjs` serves the html5 app; `buildtools/electron.mjs` launches the electron one.

- `src/` is TypeScript — every live source is `.ts`, typechecked from the root `tsconfig.json`
  with `strict` and `useDefineForClassFields` on.
- `useDefineForClassFields` is load-bearing at runtime, not just for the typechecker:
  - esbuild reads it too
  - the codebase depends on define semantics for bare field declarations
  - do not turn it off

- Format with the fork's binary, not bare `prettier`:

```
node node_modules/@pathtx/prettier/bin/prettier.cjs --log-level warn --cache --write "src/**/*.ts"
```

- Only run the formatter over files that already parse as TypeScript.

## Documentation layout

- All docs live under `docs/`. Nothing goes in a top-level `doc/`.

| Path | Contents |
|---|---|
| `docs/index.md` | Index of everything below — **add new docs here** |
| `docs/plans/` | Implementation plans |
| `docs/research/` | Research reports, investigations, findings |
| `docs/archive/` | Pre-existing legacy notes; historical, do not edit |
| `docs/` (root) | Living guides (see below) |

- Subsystem guides — read the relevant one before changing that subsystem:

| Doc | Covers |
|---|---|
| `docs/rendering.md` | Repaint scheduling, `SplineDrawer`, batching, worker rasterization, overlays |
| `docs/stroking.md` | Offset-curve geometry, width/shift, stroke groups, junctions |
| `docs/animation.md` | Drawspline/pathspline, per-vertex motion paths, keyframes, playback |
| `docs/dopesheet.md` | Timeline editor: DOM channel tree + canvas key area |
| `docs/debugging.md` | Symptom → cause → fix log; **append to it** when something non-obvious breaks |

- Active plans:
  - `docs/plans/typescript-port.md` (phase 8 outstanding; its *Known gotchas* section still applies)
  - `docs/plans/draw-refactor-plan-final-notes.md` (final notes for the draw refactor)
- `todos.md` (repo root) is a working todo list.

## Source comments

- **4 lines maximum** per comment.
- **Exception — file headers:** no limit. The leading comment block at the top of a file,
  before the first import or statement, is where a module explains what it is and how it fits
  together. That is worth the space; the 4-line limit is aimed at inline noise.
- **Exception — math-heavy files:** no limit. Derivations, coordinate conventions, and
  references are worth the space.
- **Exception everywhere — embedded symbolic algebra** (REDUCE scripts and similar): no limit,
  in any file. These are source material; keep them verbatim.
- **Temporary comments** are exempt from the limit but must be prefixed `CLAUDENOTE:` and
  deleted before the work is considered done. Never leave a `CLAUDENOTE:` in a finished branch.

## Prose

These rules govern every piece of prose in the repository. They apply to code comments, to
this file, and to everything under `documentation/`.

- **Write plain declarative prose — no epigrams.** State the constraint or decision
  directly: "An empty answer is deliberate and is passed to the model as-is", not "Empty is an
  answer — silence, said out loud." If a sentence needs a second read to parse, rewrite it.
  Specific patterns to catch:
  - **Inverted syntax and personification** — the sentence performs rather than informs.
  - **Metaphorical equations** — "The leak scan is the refusal", "what ships is identity",
    "the project as commands". The connector word varies — do not get hung up on "is"
    versus "as". Say what happens instead: "Refuses if the leak scan finds a known name
    still in the body."
  - **Fragment openers that defer the subject — never use this pattern.** Naming a placeholder
    and then withholding the real content behind a colon or a dash is always wrong: "The
    redactor to scan a report with: the one that wrote it, else one built from the project as it
    stands." Lead with a complete sentence and name each case as you reach it. A doc comment is
    not an exception, and deleting the label is not the fix, because the apposition left behind
    is still headless. Supply a predicate instead. Write "Draws the links beneath the node
    frames in screen space." rather than "The link underlay: a screen-space canvas beneath the
    node frames." or the bare "Screen-space canvas beneath the node frames."
  - **Double negatives** — "the palette cannot be relied on not to". State the positive claim.
  - **Pronouns and ellipses that point outside the sentence** — "the second case", "asking
    twice is how…" — each sentence should carry its own referents.
  - **"Clause A, else B" constructions** — "Resolve a push's destination: the named window
    when it still exists, else the focused window falling back to the most recently focused
    one." Spell out the cases as ordinary sentences instead: "Pushes to the named window if it
    still exists. Otherwise pushes to the focused window, or the most recently focused window
    if none is focused."
  - **Adverbs hung off the end of a noun phrase** — "the next pointerdown anywhere", "the
    handler above". The adverb postmodifies the noun, but the reader cannot tell on first pass
    whether it attaches to the noun or to the clause's verb, and an event or API name coined
    from a verb ("pointerdown") re-parses as a clause when an adverb follows it. Attach the
    qualification to a verb, or state it as its own fact: "the listener is on `window`".
  - **Non-assertive words under a definite** — "any", "anywhere", "ever" range over
    alternatives, so they fight a definite description that names exactly one thing. "A press
    anywhere dismisses it" reads fine; "the next pointerdown anywhere" does not.
  - **Rhetorical emphasis** — bold and italics inside a sentence mark the clause the author
    found most interesting, not the one the reader needs first. Put the load-bearing claim in
    the first sentence and drop the markup. A bolded lead-in that labels a Markdown bullet is
    structure rather than emphasis, and is fine.
  - **A head noun that is not what the thing is** — a module of commands documented as "The
    prompt an asset is generated from, as commands" asserts that the module is a prompt, then
    retracts it through a preposition. Lead with the head noun that names the thing —
    "Commands for the prompt an asset is generated from" — and demote the rest to a
    complement. A trailing ", as X" or ", in the form of X" is the same metaphorical equation
    above smuggled in through an adjunct.
- **Reserve backticks for code symbols.** Backticks belong on identifiers, types, commands,
  and file globs the reader will type. A file path cited mid-sentence as a reference —
  documentation/NodeEditor.md §3 — takes none, because marking it up gives it the same weight
  as the identifiers around it and dilutes them. Markdown link text is the one exception and
  keeps its backticks, where the marking separates a path from the prose around it rather than
  competing with nearby identifiers.
- **Bracket a subordinate alternative rather than fencing it with commas.** Parentheses mark the
  material as skippable, so the reader gets a complete sentence either way; paired commas leave
  it unclear whether the second comma closes an interpolation or opens a new clause. Write
  "Dropping onto itself (or onto a neighbor it would split against) is not a rip". Drop any comma
  that would follow the closing bracket — it separates the subject from its verb.

## Data API definitions

- A class defines its own datapaths in `static defineAPI(api, struct = api.mapStruct(this, true))`,
  in the same file as the fields those paths name.
- The methods chain. A subclass takes the struct it was handed (or maps its own), passes it to
  `super.defineAPI(api, struct)` for the inherited paths, adds its own, and returns it:

```ts
static defineAPI(api: DataAPI<FullContext>, struct = api.mapStruct(this, true)) {
  super.defineAPI(api, struct);

  struct.float("z", "z", "z").range(-1e17, 1e17);

  return struct;
}
```

- `SplineElement`, `DataBlock` and `Editor` sit at the bottom of the three chains.
  `SplineElement.defineFlagsAPI()` is split out of its `defineAPI()` because each element type
  hangs a different change callback off the same flags definition.
- `src/core/data_api/data_api_define.ts` is only the assembly: it calls each class's
  `defineAPI()` once and names FullContext's struct as the API root.
- Do not name such a method `apiDefine`; that spelling is gone.

## path.ux callback system

- path.ux has a method-aspect system — `widget.update.after(cb)`, `widget.setCSS.after(cb)` —
  which attaches properties to a method object.
- TypeScript cannot express this, so path.ux provides plain-method equivalents.
- **Always use the TS form:**

| Aspect form (do not use in TS) | Use instead |
|---|---|
| `widget.update.after(cb)` | `widget.updateAfter(cb)` |
| `widget.setCSS.after(cb)` | `widget.setCSSAfter(cb)` |
| `widget.setCSS.once(cb, arg)` | `widget.setCSSOnce(cb, arg)` |

- If you hit an aspect call with no TS equivalent, add one to path.ux following the same pattern
  (see `scripts/core/ui_base.ts`, marked `//TS patch into this.update.after`) rather than casting
  through `any` at the call site.

## Legacy transpiler

- The old `extjs_cc` transpiler and its non-standard syntax are gone from the tree and must
  never be reintroduced:
  - C-style typed parameters (`foo(Number t)`)
  - `static` locals inside method bodies
  - bare `global x;` declarations
- Old docs and research reports still show pre-port `.js` paths and stripped C-style
  annotations; treat those as history, not as the current code.
