import { CssClasses } from "src/css_data";
import { ChatterboxRenderer } from "./renderer";


/**
 * Renderer for the "base" mode.
 */
export default class BaseRenderer extends ChatterboxRenderer {
    override readonly cssClass = CssClasses.modeBase;
}
