import { MessageDir, MessageEntry } from "src/entries";
import { decodeHTMLEntities, fixObsidianRenderedMarkdown } from "src/utils";
import { CbxRendererBase } from "./base";


/**
 * Renderer for the "bubble" mode.
 */
export default class CbxBubbleRenderer extends CbxRendererBase {
    cssClass: string = "mode-bubble";

    protected override async renderMessageEntry(
        entry: MessageEntry,
        entryContainerEl: HTMLElement
    ): Promise<void> {
        const messageEl = entryContainerEl.createDiv({ cls: "message" });

        switch (entry.dir) {
            case MessageDir.Left:
                entryContainerEl.addClass("message-left");
                break;
            case MessageDir.Center:
                entryContainerEl.addClass("message-center");
                break;
            case MessageDir.Right:
            default:
                entryContainerEl.addClass("message-right");
                break;
        }

        const fullName = this.config.authors?.[entry.author]?.fullName ?? entry.author;

        entryContainerEl.dataset.cbxAuthorOrder = this.authorOrderMap.get(entry.author);
        entryContainerEl.dataset.cbxAuthorName = entry.author;
        entryContainerEl.dataset.cbxAuthorFullName = fullName;

        if (entry.showName && fullName.trim().length !== 0) {
            const headerEl = messageEl.createDiv({ cls: "message-header" });

            const nameEl = headerEl.createDiv({ cls: "message-name" });
            nameEl.innerText = fullName;

            const autoNameColor = this.autoNameColorMap.get(entry.author);
            const configNameColor = this.config.authors?.[entry.author]?.nameColor;
            const nameColor = configNameColor ?? autoNameColor ?? undefined;

            if (nameColor !== undefined) {
                nameEl.style.color = nameColor;
            }
        }

        const bodyEl = messageEl.createDiv({ cls: "message-body" });

        const contentEl = bodyEl.createDiv({ cls: "message-content" });
        if (entry.renderMd) {
            contentEl.addClass("markdown-rendered");
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

        const bgColor = this.config.authors?.[entry.author]?.bgColor ?? undefined;
        if (bgColor !== undefined) {
            messageEl?.style.setProperty("--bubble-bg-color", bgColor);
        }

        if (entry.subtext !== undefined && entry.subtext.trim().length !== 0) {
            const footerEl = messageEl.createDiv({ cls: "message-footer" });
            const subtextEl = footerEl.createDiv({ cls: "message-subtext" });
            subtextEl.innerText = entry.subtext;
        }
    }
}
