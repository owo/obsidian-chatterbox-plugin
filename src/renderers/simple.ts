import { CssClasses } from "src/css_data";
import { ChatterboxRenderer, MessageLayout } from "./renderer";


/**
 * Renderer for the "simple" mode.
 */
export default class SimpleRenderer extends ChatterboxRenderer {
    protected override readonly cssClasses: string[] = [ CssClasses.modeSimple ] as const;

    protected override generateMessageLayout(
        messageEl: HTMLElement,
        hasAuthor: boolean,
        hasSubtext: boolean,
    ): MessageLayout {
        const layout: MessageLayout = {};

        if (hasAuthor || hasSubtext) {
            const headerEl = messageEl.createDiv(CssClasses.messageHeader);
            if (hasAuthor) {
                const authorEl = headerEl.createDiv(CssClasses.messageAuthor);
                layout.authorEl = authorEl;
            }
            if (hasSubtext) {
                const subtextEl = headerEl.createDiv(CssClasses.messageSubtext);
                layout.subtextEl = subtextEl;
            }
        }

        const bodyEl = messageEl.createDiv(CssClasses.messageBody);
        const contentEl = bodyEl.createDiv(CssClasses.messageContent);
        layout.contentEl = contentEl;

        return layout;
    }
}
