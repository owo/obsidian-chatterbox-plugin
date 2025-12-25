import { SpeechDir, SpeechEntry } from "src/entries";
import { CbxRendererBase } from "./base";
import { fixObsidianRenderedMarkdown } from "./utils";


/**
 * Renderer for the "bubble" mode.
 */
export default class CbxBubbleRenderer extends CbxRendererBase {
    cssClass: string = "cbx-mode-bubble";

    protected override async renderSpeechEntry(
        entry: SpeechEntry,
        entryContainerEl: HTMLElement
    ): Promise<void> {
        const speechEl = entryContainerEl.createDiv({ cls: "cbx-speech" });

        switch (entry.dir) {
            case SpeechDir.Left:
                entryContainerEl.addClass("cbx-speech-left");
                break;
            case SpeechDir.Center:
                entryContainerEl.addClass("cbx-speech-center");
                break;
            case SpeechDir.Right:
            default:
                entryContainerEl.addClass("cbx-speech-right");
                break;
        }

        const fullName = this.config.speakers?.[entry.speaker]?.fullName ?? entry.speaker;
        if (entry.showName && fullName.trim().length !== 0) {
            const headerEl = speechEl.createDiv({ cls: "cbx-speech-header" });

            const nameEl = headerEl.createDiv({ cls: "cbx-speech-name" });
            nameEl.innerText = fullName;

            const autoNameColor = this.autoNameColorMap.get(entry.speaker);
            const configNameColor = this.config.speakers?.[entry.speaker]?.nameColor;
            const nameColor = configNameColor ?? autoNameColor ?? undefined;

            if (nameColor !== undefined) {
                nameEl.style.color = nameColor;
            }
        }

        const bodyEl = speechEl.createDiv({ cls: "cbx-speech-body" });

        const contentEl = bodyEl.createDiv({ cls: "cbx-speech-content" });
        if (entry.renderMd) {
            contentEl.addClass("markdown-rendered");
            await this.renderObsidianMarkDown(entry.content, contentEl);
            if (this.settings.applyObsidianMarkdownFixes) {
                fixObsidianRenderedMarkdown(contentEl);
            }
        }
        else {
            contentEl.innerText = entry.content;
        }

        const textColor = this.config.speakers?.[entry.speaker]?.textColor ?? undefined;
        if (textColor !== undefined) {
            bodyEl.style.color = textColor;
        }

        const bgColor = this.config.speakers?.[entry.speaker]?.bgColor ?? undefined;
        if (bgColor !== undefined) {
            speechEl?.style.setProperty("--bubble-bg-color", bgColor);
        }

        if (entry.subtext !== undefined && entry.subtext.trim().length !== 0) {
            const footerEl = speechEl.createDiv({ cls: "cbx-speech-footer" });
            const subtextEl = footerEl.createDiv({ cls: "cbx-speech-subtext" });
            subtextEl.innerText = entry.subtext;
        }
    }
}
