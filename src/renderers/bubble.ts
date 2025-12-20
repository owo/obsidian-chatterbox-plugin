import { SpeechDir, SpeechMsg } from "src/messages";
import { CbxRendererBase } from "./base";


/**
 * Renderer for the "bubble" mode.
 */
export default class CbxBubbleRenderer extends CbxRendererBase {
    cssClass: string = "cbx-mode-bubble";

    protected override async renderSpeechMessage(
        msg: SpeechMsg,
        msgContainerEl: HTMLElement
    ): Promise<void> {
        const speechEl = msgContainerEl.createDiv({ cls: "cbx-speech" });

        switch (msg.dir) {
            case SpeechDir.Left:
                msgContainerEl.addClass("cbx-speech-left");
                break;
            case SpeechDir.Center:
                msgContainerEl.addClass("cbx-speech-center");
                break;
            case SpeechDir.Right:
            default:
                msgContainerEl.addClass("cbx-speech-right");
                break;
        }

        speechEl.style.maxWidth = `${this.config.maxSpeechWidth}%`;

        if (msg.showName) {
            const name = this.config.speakers[msg.speaker]?.name ?? msg.speaker;
            if (name.trim().length === 0) {
                return;
            }

            const headerEl = speechEl.createDiv({ cls: "cbx-speech-header" });
            const nameEl = headerEl.createDiv({ cls: "cbx-speech-name" });
            const nameColor = this.config.speakers[msg.speaker]?.nameColor ?? undefined;

            nameEl.innerText = name;
            if (nameColor !== undefined) {
                nameEl.style.color = nameColor;
            }
        }

        const bodyEl = speechEl.createDiv({ cls: "cbx-speech-body" });
        const contentEl = bodyEl.createDiv({ cls: "cbx-speech-content" });
        contentEl.innerText = msg.content;

        const textColor = this.config.speakers[msg.speaker]?.textColor ?? undefined;
        if (textColor !== undefined) {
            bodyEl.style.color = textColor;
        }

        const bgColor = this.config.speakers[msg.speaker]?.bgColor ?? undefined;
        if (bgColor !== undefined) {
            speechEl?.style.setProperty("--bubble-bg-color", bgColor);
        }

        if (msg.subtext !== undefined && msg.subtext.trim().length !== 0) {
            const footerEl = speechEl.createDiv({ cls: "cbx-speech-footer" });
            const subtextEl = footerEl.createDiv({ cls: "cbx-speech-subtext" });
            subtextEl.innerText = msg.subtext;
        }
    }
}
