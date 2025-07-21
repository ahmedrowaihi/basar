import { build } from "bun";

await build({
    entrypoints: ["./features/worker/index.ts"],
    outdir: "./dist/worker-bundle",
    target: "browser",
    minify: true,
    format: "esm",
    external: [],
});