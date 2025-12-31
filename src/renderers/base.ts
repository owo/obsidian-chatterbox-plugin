import { CssClasses } from "src/css_data";
import { ChatterboxRenderer } from "./renderer";


/**
 * Renderer for the "base" mode.
 */
export default class BaseRenderer extends ChatterboxRenderer {
    protected override readonly cssClasses = [ CssClasses.modeBase ] as const;
}
