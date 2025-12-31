import { ChatterboxRenderer } from "./renderer";
import { CssClasses } from "src/css_data";


/**
 * Renderer for the "bubble" mode.
 */
export default class BubbleRenderer extends ChatterboxRenderer {
    protected override readonly cssClasses: string[] = [ CssClasses.modeBubble ] as const;
}
