import { MessageDir, MessageEntry } from "src/entries";
import { decodeHTMLEntities, fixObsidianRenderedMarkdown } from "src/utils";
import { ChatterboxRenderer } from "./renderer";
import { CssClasses, CssProps } from "src/css_data";


/**
 * Renderer for the "bubble" mode.
 */
export default class BubbleRenderer extends ChatterboxRenderer {
    override readonly cssClass: string = CssClasses.modeBubble;

    protected override async renderMessageEntry(
        entry: MessageEntry,
        entryContainerEl: HTMLElement
    ): Promise<void> {
        const messageEl = entryContainerEl.createDiv({ cls: CssClasses.messageElement });

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

        const authorFull = this.config.authors?.[entry.author]?.authorFull ?? entry.author;

        entryContainerEl.dataset.cbxAuthorOrder = this.authorOrderMap.get(entry.author);
        entryContainerEl.dataset.cbxAuthor = entry.author;
        entryContainerEl.dataset.cbxAuthorFull = authorFull;

        if (entry.showAuthor && authorFull.trim().length !== 0) {
            const headerEl = messageEl.createDiv({ cls: CssClasses.messageHeader });

            const authorEl = headerEl.createDiv({ cls: CssClasses.messageAuthor });
            authorEl.innerText = authorFull;

            const autoAuthorColor = this.autoAuthorColorMap.get(entry.author);
            const configAuthorColor = this.config.authors?.[entry.author]?.authorColor;
            const authorColor = configAuthorColor ?? autoAuthorColor ?? undefined;

            if (authorColor !== undefined) {
                messageEl.style.setProperty(CssProps.messageAuthorColor, authorColor);
            }
        }

        const bodyEl = messageEl.createDiv({ cls: CssClasses.messageBody });

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

        const contentColor = this.config.authors?.[entry.author]?.textColor ?? undefined;
        if (contentColor !== undefined) {
            messageEl.style.setProperty(CssProps.messageContentColor, contentColor);
        }

        const bgColor = this.config.authors?.[entry.author]?.bgColor ?? undefined;
        if (bgColor !== undefined) {
            messageEl.style.setProperty(CssProps.messageBackgroundColor, bgColor);
        }

        if (entry.subtext !== undefined && entry.subtext.trim().length !== 0) {
            const footerEl = messageEl.createDiv({ cls: CssClasses.messageFooter });
            const subtextEl = footerEl.createDiv({ cls: CssClasses.messageSubtext });
            subtextEl.innerText = entry.subtext;

            const subtextColor = this.config.authors?.[entry.author]?.subtextColor;
            if (subtextColor !== undefined) {
                messageEl.style.setProperty(CssProps.messageSubtextColor, subtextColor);
            }
        }
    }
}
