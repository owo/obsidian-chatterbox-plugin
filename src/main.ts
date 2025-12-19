import { type App, type MarkdownPostProcessorContext, Plugin } from 'obsidian';

import { parseChatterbox, ParseResult } from './parsing/parser';
import renderCbxError from './renderers/error';
import CbxSimpleRenderer from './renderers/simple';


/**
 * Parses and renders a Chatterbox source string.
 * 
 * @param source The source string to be parsed and rendered.
 * @param rootEl The HTML element to render to.
 * @param app Reference to the Obsidian application instance.
 * @param ctx Reference to the registered post processor for the plugin.
 */
function parseAndRenderChatterbox(
    source: string,
    rootEl: HTMLElement,
    app: App,
    ctx: MarkdownPostProcessorContext
) {
    const parseRes = parseChatterbox(source);

    if (parseRes.isError) {
        renderCbxError(parseRes.errorList, rootEl);
        return;
    }

    switch (parseRes.data.config.mode) {
        case 'simple':
        default:
            const renderer = new CbxSimpleRenderer(app, ctx, parseRes.data.config);
            renderer.render(parseRes.data.messages, rootEl);
            break;
    }
}

/**
 * Implements the Chatterbox plugin.
 */
export default class ChatterboxPlugin extends Plugin {
    async onload() {
        this.registerMarkdownCodeBlockProcessor('chatterbox', (source, rootEl, ctx) => {
            parseAndRenderChatterbox(source, rootEl, this.app, ctx);
        });
    }

    onunload() { }
}
