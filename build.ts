import { build } from "bun";
import {
    author,
    description,
    homepage,
    license,
    repository,
    version,
} from "./package.json" with { type: "json" };

const glob = new Bun.Glob("./features/**/*.ts");
const entrypoints = (
    await Array.fromAsync(glob.scan({ cwd: __dirname }))
).filter((file) => !file.endsWith("demo.ts") && !file.endsWith("main.ts"));

console.log(entrypoints);

build({
    entrypoints,
    outdir: "./dist",
    target: "browser",
    minify: true,
    banner: `
    /**
    * @version ${version}
    * @description ${description}
    * @license ${license}
    * @homepage ${homepage}
    * @repository ${repository.url}
    * @copyright ${new Date().getFullYear()} ${author}
    * Do whatever you want with this code.
    */
    `,
    publicPath: "./public",
});
