import { MessageDir, MessageEntry } from "src/entries";
import { decodeHTMLEntities, fixObsidianRenderedMarkdown } from "src/utils";
import { CssClasses, CssProps } from "src/css_data";
import { ChatterboxRenderer } from "./renderer";


/**
 * Renderer for the "simple" mode.
 */
export default class SimpleRenderer extends ChatterboxRenderer {
    override readonly cssClass: string = CssClasses.modeSimple;

    protected override async renderMessageEntry(
        entry: MessageEntry,
        entryContainerEl: HTMLElement
    ): Promise<void> {
        const messageEl = entryContainerEl.createDiv({ cls: CssClasses.messageElement });

        const bgColor = this.config.authors?.[entry.author]?.bgColor ?? undefined;
        if (bgColor !== undefined) {
            messageEl.style.setProperty(CssProps.messageBgColor, bgColor);
        }

        const authorFull = this.config.authors?.[entry.author]?.authorFull ?? entry.author;

        entryContainerEl.dataset.cbxAuthorOrder = this.authorOrderMap.get(entry.author);
        entryContainerEl.dataset.cbxAuthor = entry.author;
        entryContainerEl.dataset.cbxAuthorFull = authorFull;

        const headerEl = messageEl.createDiv({ cls: CssClasses.messageHeader });

        if (entry.showAuthor && authorFull.trim().length !== 0) {

            const authorEl = headerEl.createDiv({ cls: CssClasses.messageAuthor });
            authorEl.innerText = authorFull;

            const autoAuthorColor = this.autoAuthorColorMap.get(entry.author);
            const configAuthorColor = this.config.authors?.[entry.author]?.authorColor;
            const authorColor = configAuthorColor ?? autoAuthorColor ?? undefined;

            if (authorColor !== undefined) {
                authorEl.style.color = authorColor;
            }
        }

        if (entry.subtext !== undefined && entry.subtext.trim().length !== 0) {
            const subtextEl = headerEl.createDiv({ cls: CssClasses.messageSubtext });
            subtextEl.innerText = entry.subtext;
        }

        const bodyEl = messageEl.createDiv({ cls: CssClasses.messageBody });
        switch (entry.dir) {
            case MessageDir.Left:
                entryContainerEl.addClass(CssClasses.messageDirLeft);
                break;
            case MessageDir.Center:
                entryContainerEl.addClass(CssClasses.messageDirCenter);
                break;
            case MessageDir.Right:
            default:
                entryContainerEl.addClass(CssClasses.messageDirRight);
                break;
        }

        const contentEl = bodyEl.createDiv({ cls: CssClasses.messageContent });
        if (entry.renderMd) {
            await this.renderObsidianMarkDown(entry.content, contentEl);
            if (this.settings.applyObsidianMarkdownFixes) {
                fixObsidianRenderedMarkdown(contentEl);
            }
        }
        else {
            contentEl.innerText = decodeHTMLEntities(entry.content);
        }

        const textColor = this.config.authors?.[entry.author]?.textColor ?? undefined;
        if (textColor !== undefined) {
            bodyEl.style.color = textColor;
        }
    }
}
