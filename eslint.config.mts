import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { type Config, defineConfig, globalIgnores } from "eslint/config";


export default defineConfig(
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                projectService: {
                    allowDefaultProject: [
                        'rollup.config.mjs',
                        'manifest.json'
                    ]
                },
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: ['.json']
            },
        },
        rules: {
            "semi": ["error", "always"],
            'max-len': [
                'warn',
                {
                    code: 100,
                    comments: 100,
                    ignoreUrls: true,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                    ignoreRegExpLiterals: true,
                }
            ]
        },
    },
    ...(obsidianmd.configs?.recommended as Config[]),
    globalIgnores([
        "node_modules",
        "build",
        "esbuild.config.mjs",
        "eslint.config.mts",
        "version-bump.mjs",
        "versions.json",
        "main.js",
    ]),
);
