import { type App, type MarkdownPostProcessorContext, Plugin } from "obsidian";

import { CBX_DEFAULT_SETTINGS, ChatterboxSettings, ChatterboxSettingTab } from "./settings";
import { CbxConfigValidator } from "./config";
import { parseChatterbox } from "./parsing/parser";
import renderCbxError from "./renderers/error";
import CbxBubbleRenderer from "./renderers/bubble";
import CbxSimpleRenderer from "./renderers/simple";
import { parseCbxFrontmatter } from "./parsing/frontmatter";


/**
 * Parses and renders a Chatterbox source string.
 * 
 * @param source The source string to be parsed and rendered.
 * @param rootEl The HTML element to render to.
 * @param app Reference to the Obsidian application instance.
 * @param ctx Reference to the registered post processor for the plugin.
 */
async function parseAndRenderChatterbox(
    source: string,
    rootEl: HTMLElement,
    app: App,
    ctx: MarkdownPostProcessorContext,
    settings: ChatterboxSettings,
) {
    const parseRes = parseChatterbox(source);
    if (parseRes.isError) {
        renderCbxError(parseRes.errorList, rootEl);
        return;
    }

    const fmResult = parseCbxFrontmatter(settings.defaultFrontmatter);
    const settingsConfig = fmResult.isError ? CbxConfigValidator.parse({}) : fmResult.config;
    const combinedConfig = {
        ...settingsConfig,
        ...parseRes.data.config,
    };

    let renderer = null;
    switch (combinedConfig.mode) {
        case "simple":
            renderer = new CbxSimpleRenderer(app, ctx, combinedConfig, settings);
            await renderer.render(parseRes.data.entries, rootEl);
            break;
        case "bubble":
        default:
            renderer = new CbxBubbleRenderer(app, ctx, combinedConfig, settings);
            await renderer.render(parseRes.data.entries, rootEl);
            break;
    }
}

/**
 * Implements the Chatterbox plugin.
 */
export default class ChatterboxPlugin extends Plugin {
    settings: ChatterboxSettings;

    async onload() {
        await this.loadSettings();

        this.registerMarkdownCodeBlockProcessor("chatterbox", async (source, rootEl, ctx) => {
            await parseAndRenderChatterbox(source, rootEl, this.app, ctx, this.settings);
        });

        this.addSettingTab(new ChatterboxSettingTab(this.app, this));
    }

    onunload() { }

    /**
     * Load Chatterbox settings from file.
     */
    async loadSettings() {
        const data = await this.loadData() as Partial<ChatterboxSettings>;
        this.settings = Object.assign({}, CBX_DEFAULT_SETTINGS, data);
    }

    /**
     * Save Chatterbox settings to file.
     */
    async saveSettings() {
        await this.saveData(this.settings);
    }
}
