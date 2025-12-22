import { builtinModules } from "module";
import process from "process";

import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from '@rollup/plugin-terser';
import { visualizer } from "rollup-plugin-visualizer";


const isProduction = (process.env.CBX_BUILD === "production");
const shouldAnalyze = (process.env.CBX_ANALYZE === "true");

const config = [
    {
        input: "src/main.ts",
        output: {
            file: "build/main.js",
            format: "cjs",
            sourcemap: !isProduction,
        },
        external: [
            "obsidian",
            "electron",
            "@codemirror/autocomplete",
            "@codemirror/collab",
            "@codemirror/commands",
            "@codemirror/language",
            "@codemirror/lint",
            "@codemirror/search",
            "@codemirror/state",
            "@codemirror/view",
            "@lezer/common",
            "@lezer/highlight",
            "@lezer/lr",
            ...builtinModules,
        ],
        logLevel: "info",
        plugins: [
            typescript({
                "inlineSourceMap": !isProduction,
	            "inlineSources": !isProduction,
            }),
            nodeResolve(),
            commonjs(),
            isProduction ? terser() : null,
            shouldAnalyze ? visualizer() : null,
        ],
        
    },
];

export default config;
