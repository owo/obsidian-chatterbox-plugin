import {
    type App,
    type MarkdownPostProcessorContext,
    MarkdownRenderer,
    MarkdownRenderChild,
} from "obsidian";

import { type CbxConfig, DEFAULT_AUTO_COLOR_NAMES } from "src/config";
import {
    type CapsuleEntry,
    type CommentEntry,
    type DelimiterEntry,
    type MarkdownEntry,
    type CbxEntry,
    type SpeechEntry,
    EntryType,
    SpeechDir,
} from "src/entries";
import { ChatterboxSettings } from "src/settings";
import { fixObsidianRenderedMarkdown } from "./utils";


// This should correspond to the number of `--auto-color-text-*` CSS variables (starting from 1
// with no holes).
const NUM_TEXT_AUTO_COLORS: number = 8;

/**
 * Base class to be extended by all Chatterbox renderer classes.
 */
export abstract class CbxRendererBase {
    protected readonly app: App;
    protected readonly ctx: MarkdownPostProcessorContext
    protected readonly config: CbxConfig;
    protected readonly settings: ChatterboxSettings;
    protected readonly autoNameColorMap: Map<string, string> = new Map();

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
        settings: ChatterboxSettings,
    ) {
        this.app = app;
        this.ctx = ctx;
        this.config = config;
        this.settings = settings;
    }

    /**
     * Assigns an auto color to each speaker that doesn't have a `nameColor` value assigned in the
     * config.
     * Colors are assigned based on the order of appearance of speakers in the entry list and
     * cycle around a predefined set of colors.
     * The nameless speaker isn't assigned a color.
     * 
     * Classes extending this base class should not need to override this.
     * 
     * @param entries The list of entries used to determine the order of speakers.
     */
    protected populateAutoNameColorMap(entries: CbxEntry[]) {
        let currSpeakerNum = 0;

        for (const entry of entries) {
            if (entry.type !== EntryType.Speech || entry.speaker === "") {
                continue;
            }

            const speaker = entry.speaker;
            const speakerConfig = this.config.speakers?.[speaker];

            if (speakerConfig?.nameColor === undefined && !this.autoNameColorMap.has(speaker)) {
                const colorNum = (currSpeakerNum % NUM_TEXT_AUTO_COLORS) + 1;
                const autoColor = `var(--auto-color-text-${String(colorNum)})`;

                this.autoNameColorMap.set(speaker, autoColor);

                currSpeakerNum += 1;
            }
        }
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
     * Render a capsule entry to a given HTML element.
     * 
     * @param entry The capsule entry to render.
     * @param entryContainerEl The HTML element to render to.
     */
    protected async renderCapsuleEntry(
        entry: CapsuleEntry,
        entryContainerEl: HTMLElement
    ): Promise<void> {
        const capsuleEl = entryContainerEl.createDiv({ cls: "cbx-capsule" });

        // capsuleEl.style.maxWidth = `${this.config.maxCapsuleWidth ?? ""}`;
        capsuleEl.innerText = entry.content;
    }

    /**
     * Render a comment entry to a given HTML element.
     * 
     * @param entry The comment entry to render.
     * @param entryContainerEl The HTML element to render to.
     */
    protected async renderCommentEntry(
        entry: CommentEntry,
        entryContainerEl: HTMLElement
    ): Promise<void> {
        const commentEl = entryContainerEl.createDiv({ cls: "cbx-comment" });

        // commentEl.style.maxWidth = `${this.config.maxCommentWidth ?? ""}`;
        commentEl.innerText = entry.content;
    }

    /**
     * Render a delimiter entry to a given HTML element.
     * 
     * @param entry The delimiter entry to render.
     * @param entryContainerEl The HTML element to render to.
     */
    protected async renderDelimiterEntry(
        entry: DelimiterEntry,
        entryContainerEl: HTMLElement
    ): Promise<void> {
        const delimEl = entryContainerEl.createDiv({ cls: "cbx-delim" });

        delimEl.createDiv({ cls: "dot" });
        delimEl.createDiv({ cls: "dot" });
        delimEl.createDiv({ cls: "dot" });
    }

    /**
     * Render a Markdown block entry to a given HTML element.
     * 
     * @param entry The Markdown block entry to render.
     * @param entryContainerEl The HTML element to render to.
     */
    protected async renderMarkdownEntry(
        entry: MarkdownEntry,
        entryContainerEl: HTMLElement
    ): Promise<void> {
        const mdEl = entryContainerEl.createDiv({ cls: "cbx-markdown" });

        await this.renderObsidianMarkDown(entry.content, mdEl);
    }

    /**
     * Render a speech entry to a given HTML element.
     * 
     * @param entry The speech entry to be rendered.
     * @param entryContainerEl The HTML element to render to.
     */
    protected async renderSpeechEntry(
        entry: SpeechEntry,
        entryContainerEl: HTMLElement
    ): Promise<void> {
        const speechEl = entryContainerEl.createDiv({ cls: "cbx-speech" });

        const bgColor = this.config.speakers?.[entry.speaker]?.bgColor ?? undefined;
        if (bgColor !== undefined) {
            speechEl.style.setProperty("--speech-bg-color", bgColor);
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

        if (entry.subtext !== undefined && entry.subtext.trim().length !== 0) {
            const footerEl = speechEl.createDiv({ cls: "cbx-speech-footer" });
            const subtextEl = footerEl.createDiv({ cls: "cbx-speech-subtext" });
            subtextEl.innerText = entry.subtext;
        }
    }

    /**
     * Render a list of entries to a given HTML element.
     * 
     * @param entries Entries to be rendered.
     * @param rootEl The HTML element to render to.
     */
    public async render(entries: CbxEntry[], rootEl: HTMLElement) {
        rootEl.addClass("chatterbox");
        rootEl.addClass(this.cssClass);

        // HACK: This should be removed if and when the Obsidian app fixes the issue
        //       reported at https://forum.obsidian.md/t/markdownrenderer-produces-inconsistent-output-for-embedded-notes/109207/5
        if (this.settings.applyObsidianMarkdownFixes) {
            rootEl.addClass("cbx-fix-obsidian-embed");
        }

        const cbxProps = [
            ["--capsule-max-width", this.config.maxCapsuleWidth],
            ["--comment-max-width", this.config.maxCommentWidth],
            ["--speech-max-width", this.config.maxSpeechWidth],
        ] as Iterable<readonly [PropertyKey, unknown]>;

        rootEl.setCssProps({
            ...(Object.fromEntries(cbxProps) as Record<string, string>)
        });

        if (this.config.autoColorNames ?? DEFAULT_AUTO_COLOR_NAMES) {
            this.populateAutoNameColorMap(entries);
        }

        const cbxContentEl = rootEl.createDiv({ cls: "chatterbox-content" });

        for (const entry of entries) {
            const entryContainerEl = cbxContentEl.createDiv({ cls: "cbx-entry-container" });

            switch (entry.type) {
                case EntryType.Capsule:
                    entryContainerEl.addClass("cbx-capsule-container")
                    await this.renderCapsuleEntry(entry, entryContainerEl);
                    break;
                case EntryType.Comment:
                    entryContainerEl.addClass("cbx-comment-container")
                    await this.renderCommentEntry(entry, entryContainerEl);
                    break;
                case EntryType.Delimiter:
                    entryContainerEl.addClass("cbx-delim-container")
                    await this.renderDelimiterEntry(entry, entryContainerEl);
                    break;
                case EntryType.Markdown:
                    entryContainerEl.addClass("cbx-markdown-container")
                    await this.renderMarkdownEntry(entry, entryContainerEl);
                    break;
                case EntryType.Speech:
                    entryContainerEl.addClass("cbx-speech-container")
                    await this.renderSpeechEntry(entry, entryContainerEl);
                    break;
            }
        }
    }
}
