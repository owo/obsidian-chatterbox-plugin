import {
    type App,
    type MarkdownPostProcessorContext,
    MarkdownRenderer,
    MarkdownRenderChild,
} from "obsidian";

import type { CbxConfig } from "src/config";
import {
    type CapsuleMsg,
    type CommentMsg,
    type DelimiterMsg,
    type MarkdownMsg,
    type Message,
    type SpeechMsg,
    MessageType,
    SpeechDir,
} from "src/messages";


/**
 * Base class to be extended by all Chatterbox renderer classes.
 */
export abstract class CbxRendererBase {
    protected readonly app: App;
    protected readonly ctx: MarkdownPostProcessorContext
    protected readonly config: CbxConfig;

    /**
     * The CSS style class that will be applied to the top-level Chatterbox HTML element.
     * Must be implemented by all extending classes.
     */
    protected abstract readonly cssClass: string;

    /**
     * Renderer constructor.
     * 
     * @param app Reference to the Obsidian application instance.
     * @param ctx Reference to the registered post processor for the plugin.
     * @param config Parsed Chatterbox configuration to use.
     */
    constructor(
        app: App,
        ctx: MarkdownPostProcessorContext,
        config: CbxConfig,
    ) {
        this.app = app;
        this.ctx = ctx;
        this.config = config;
    }

    /**
     * Render Markdown content to a given HTML element using Obsidian's Markdown renderer.
     * Classes extending this base class should not need to override this.
     * 
     * @param content The Markdown content to be rendered.
     * @param targetEl The HTML element to render to.
     */
    protected async renderObsidianMarkDown(content: string, targetEl: HTMLElement): Promise<void> {
        const renderChild = new MarkdownRenderChild(targetEl);
        await MarkdownRenderer.render(
            this.app,
            content,
            targetEl,
            this.ctx.sourcePath,
            renderChild);
    }

    /**
     * Render a capsule message to a given HTML element.
     * 
     * @param msg The capsule message to render.
     * @param msgContainerEl The HTML element to render to.
     */
    protected async renderCapsuleMessage(
        msg: CapsuleMsg,
        msgContainerEl: HTMLElement
    ): Promise<void> {
        const innerEl = msgContainerEl.createDiv({ cls: "cbx-capsule" });

        innerEl.style.maxWidth = `${this.config.maxCapsuleWidth}%`;
        innerEl.innerText = msg.content;
    }

    /**
     * Render a comment message to a given HTML element.
     * 
     * @param msg The comment message to render.
     * @param msgContainerEl The HTML element to render to.
     */
    protected async renderCommentMessage(
        msg: CommentMsg,
        msgContainerEl: HTMLElement
    ): Promise<void> {
        const commentEl = msgContainerEl.createDiv({ cls: "cbx-comment" });

        commentEl.style.maxWidth = `${this.config.maxCommentWidth}%`;
        commentEl.innerText = msg.content;
    }

    /**
     * Render a delimiter message to a given HTML element.
     * 
     * @param msg The delimiter message to render.
     * @param msgContainerEl The HTML element to render to.
     */
    protected async renderDelimiterMessage(
        msg: DelimiterMsg,
        msgContainerEl: HTMLElement
    ): Promise<void> {
        const delimEl = msgContainerEl.createDiv({ cls: "cbx-delim" });

        delimEl.createDiv({ cls: "dot" });
        delimEl.createDiv({ cls: "dot" });
        delimEl.createDiv({ cls: "dot" });
    }

    /**
     * Render a Markdown block message to a given HTML element.
     * 
     * @param msg The Markdown block message to render.
     * @param msgContainerEl The HTML element to render to.
     */
    protected async renderMarkdownMessage(
        msg: MarkdownMsg,
        msgContainerEl: HTMLElement
    ): Promise<void> {
        const mdEl = msgContainerEl.createDiv({ cls: "cbx-markdown" });

        await this.renderObsidianMarkDown(msg.content, mdEl);
    }

    /**
     * Render a speech message to a given HTML element.
     * 
     * @param msg The speech message to be rendered.
     * @param msgContainerEl The HTML element to render to.
     */
    protected async renderSpeechMessage(
        msg: SpeechMsg,
        msgContainerEl: HTMLElement
    ): Promise<void> {
        const speechEl = msgContainerEl.createDiv({ cls: "cbx-speech" });

        if (msg.showName) {
            const name = this.config.speakers[msg.speaker]?.name ?? msg.speaker;
            if (name.trim().length === 0) {
                return;
            }

            const headerEl = speechEl.createDiv({ cls: "cbx-speech-header" });
            const nameColor = this.config.speakers[msg.speaker]?.nameColor ?? undefined;
            const nameEl = headerEl.createDiv({ cls: "cbx-speech-name" });

            nameEl.innerText = name;
            if (nameColor !== undefined) {
                nameEl.style.color = nameColor;
            }
        }

        const bodyEl = speechEl.createDiv({ cls: "cbx-speech-body" });
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

        const contentEl = bodyEl.createDiv({ cls: "cbx-speech-content" });
        contentEl.innerText = msg.content;

        const bgColor = this.config.speakers[msg.speaker]?.bgColor ?? undefined;
        if (bgColor !== undefined) {
            contentEl.style.setProperty("--background-color", bgColor);
        }

        const textColor = this.config.speakers[msg.speaker]?.textColor ?? undefined;
        if (textColor !== undefined) {
            bodyEl.style.color = textColor;
        }

        if (msg.subtext !== undefined && msg.subtext.trim().length !== 0) {
            const footerEl = speechEl.createDiv({ cls: "cbx-speech-footer" });
            const subtextEl = footerEl.createDiv({ cls: "cbx-speech-subtext" });
            subtextEl.innerText = msg.subtext;
        }
    }

    /**
     * Render a list of messages to a given HTML element.
     * 
     * @param messages Messages to be rendered.
     * @param rootEl The HTML element to render to.
     */
    public render(messages: Message[], rootEl: HTMLElement) {
        rootEl.addClass("chatterbox");
        rootEl.addClass(this.cssClass);

        const cbxContentEl = rootEl.createDiv({ cls: "chatterbox-content" });

        for (const msg of messages) {
            const msgContainerEl = cbxContentEl.createDiv({ cls: "cbx-msg-container" });

            switch (msg.type) {
                case MessageType.Capsule:
                    msgContainerEl.addClass("cbx-capsule-container")
                    this.renderCapsuleMessage(msg, msgContainerEl);
                    break;
                case MessageType.Comment:
                    msgContainerEl.addClass("cbx-comment-container")
                    this.renderCommentMessage(msg, msgContainerEl);
                    break;
                case MessageType.Delimiter:
                    msgContainerEl.addClass("cbx-delim-container")
                    this.renderDelimiterMessage(msg, msgContainerEl);
                    break;
                case MessageType.Markdown:
                    msgContainerEl.addClass("cbx-markdown-container")
                    this.renderMarkdownMessage(msg, msgContainerEl);
                    break;
                case MessageType.Speech:
                    msgContainerEl.addClass("cbx-speech-container")
                    this.renderSpeechMessage(msg, msgContainerEl);
                    break;
            }
        }
    }
}
