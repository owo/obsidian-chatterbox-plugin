import { SpeechDir, SpeechEntry } from "src/entries";
import { CbxRendererBase } from "./base";
import { fixObsidianRenderedMarkdown } from "./utils";

/**
 * Renderer for the "simple" mode.
 */
export default class CbxSimpleRenderer extends CbxRendererBase {
    cssClass: string = "cbx-mode-simple";

    protected override async renderSpeechEntry(
        entry: SpeechEntry,
        entryContainerEl: HTMLElement
    ): Promise<void> {
        const speechEl = entryContainerEl.createDiv({ cls: "cbx-speech" });

        const bgColor = this.config.speakers?.[entry.speaker]?.bgColor ?? undefined;
        if (bgColor !== undefined) {
            speechEl.style.setProperty("--speech-bg-color", bgColor);
        }

        const fullName = this.config.speakers?.[entry.speaker]?.fullName ?? entry.speaker;

        entryContainerEl.dataset.cbxSpeakerOrder = this.speakerOrderMap.get(entry.speaker);
        entryContainerEl.dataset.cbxSpeakerName = entry.speaker;
        entryContainerEl.dataset.cbxSpeakerFullName = fullName;

        const headerEl = speechEl.createDiv({ cls: "cbx-speech-header" });

        if (entry.showName && fullName.trim().length !== 0) {

            const nameEl = headerEl.createDiv({ cls: "cbx-speech-name" });
            nameEl.innerText = fullName;

            const autoNameColor = this.autoNameColorMap.get(entry.speaker);
            const configNameColor = this.config.speakers?.[entry.speaker]?.nameColor;
            const nameColor = configNameColor ?? autoNameColor ?? undefined;

            if (nameColor !== undefined) {
                nameEl.style.color = nameColor;
            }
        }

        if (entry.subtext !== undefined && entry.subtext.trim().length !== 0) {
            const subtextEl = headerEl.createDiv({ cls: "cbx-speech-subtext" });
            subtextEl.innerText = entry.subtext;
        }

        const bodyEl = speechEl.createDiv({ cls: "cbx-speech-body" });
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

        const contentEl = bodyEl.createDiv({ cls: "cbx-speech-content" });
        if (entry.renderMd) {
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
    }
}
