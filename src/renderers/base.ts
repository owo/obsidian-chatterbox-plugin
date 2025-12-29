import {
    type App,
    type MarkdownPostProcessorContext,
    MarkdownRenderer,
    MarkdownRenderChild,
} from "obsidian";

import { type CbxConfig, DEFAULT_AUTO_COLOR_NAMES } from "src/config";
import { decodeHTMLEntities, fixObsidianRenderedMarkdown } from "src/utils";
import {
    type CapsuleEntry,
    type CommentEntry,
    type DelimiterEntry,
    type MarkdownEntry,
    type CbxEntry,
    type MessageEntry,
    EntryType,
    MessageDir,
} from "src/entries";
import { ChatterboxSettings } from "src/settings";


// This should correspond to the number of `--auto-color-*` CSS variables (starting from 1
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
    protected readonly authorOrderMap: Map<string, string> = new Map();
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
     * Assigns an ordering ID to each author based on the order of their appearance in the
     * entry list.
     * 
     * The nameless author is always assigned the ID "0", all other IDs increment starting from
     * "1".
     * 
     * @param entries The list of entries used to determine the order of authors.
     */
    protected populateAuthorOrderMap(entries: CbxEntry[]) {
        this.authorOrderMap.set("", "0");

        let currOrder = 1;

        for (const entry of entries) {


            if (entry.type !== EntryType.Message || entry.author === "") {
                continue;
            }

            const author = entry.author;
            if (!this.authorOrderMap.has(author)) {
                this.authorOrderMap.set(author, String(currOrder));
                currOrder += 1;
            }
        }
    }

    /**
     * Assigns an auto color to each author that doesn't have a `nameColor` value assigned in the
     * config.
     * Colors are assigned based on the order of appearance of authors in the entry list and
     * cycle around a predefined set of colors.
     * The nameless author isn't assigned a color.
     * 
     * Classes extending this base class should not need to override this.
     * 
     * @param entries The list of entries used to determine the order of authors.
     */
    protected populateAutoNameColorMap(entries: CbxEntry[]) {
        let currAuthorNum = 0;

        for (const entry of entries) {
            if (entry.type !== EntryType.Message || entry.author === "") {
                continue;
            }

            const author = entry.author;
            const authorConfig = this.config.authors?.[author];

            if (authorConfig?.nameColor === undefined && !this.autoNameColorMap.has(author)) {
                const colorNum = (currAuthorNum % NUM_TEXT_AUTO_COLORS) + 1;
                const autoColor = `var(--auto-color-${String(colorNum)})`;

                this.autoNameColorMap.set(author, autoColor);

                currAuthorNum += 1;
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
        const capsuleEl = entryContainerEl.createDiv({ cls: "capsule" });

        capsuleEl.innerText = decodeHTMLEntities(entry.content);
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
        const commentEl = entryContainerEl.createDiv({ cls: "comment" });

        commentEl.innerText = decodeHTMLEntities(entry.content);
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
        const delimEl = entryContainerEl.createDiv({ cls: "delim" });

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
        const mdEl = entryContainerEl.createDiv({ cls: "markdown" });

        await this.renderObsidianMarkDown(entry.content, mdEl);
    }

    /**
     * Render a message entry to a given HTML element.
     * 
     * @param entry The message entry to be rendered.
     * @param entryContainerEl The HTML element to render to.
     */
    protected async renderMessageEntry(
        entry: MessageEntry,
        entryContainerEl: HTMLElement
    ): Promise<void> {
        const messageEl = entryContainerEl.createDiv({ cls: "message" });

        const bgColor = this.config.authors?.[entry.author]?.bgColor ?? undefined;
        if (bgColor !== undefined) {
            messageEl.style.setProperty("--message-bg-color", bgColor);
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

        const contentEl = bodyEl.createDiv({ cls: "message-content" });
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

        if (entry.subtext !== undefined && entry.subtext.trim().length !== 0) {
            const footerEl = messageEl.createDiv({ cls: "message-footer" });
            const subtextEl = footerEl.createDiv({ cls: "message-subtext" });
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
            rootEl.addClass("fix-obsidian-embed");
        }

        if (this.config.chatterboxId !== undefined) {
            rootEl.dataset.chatterboxId = this.config.chatterboxId;
        }

        const cbxProps = [
            ["--capsule-max-width", this.config.maxCapsuleWidth],
            ["--comment-max-width", this.config.maxCommentWidth],
            ["--message-max-width", this.config.maxMessageWidth],
        ]
            .filter(x => x[1] !== undefined) as Iterable<readonly [PropertyKey, unknown]>;

        rootEl.setCssProps({
            ...(Object.fromEntries(cbxProps) as Record<string, string>)
        });

        this.populateAuthorOrderMap(entries);

        if (this.config.autoColorNames ?? DEFAULT_AUTO_COLOR_NAMES) {
            this.populateAutoNameColorMap(entries);
        }

        const cbxContentEl = rootEl.createDiv({ cls: "chatterbox-content" });

        for (const entry of entries) {
            const entryContainerEl = cbxContentEl.createDiv({ cls: "entry-container" });

            switch (entry.type) {
                case EntryType.Capsule:
                    entryContainerEl.addClass("capsule-container")
                    await this.renderCapsuleEntry(entry, entryContainerEl);
                    break;
                case EntryType.Comment:
                    entryContainerEl.addClass("comment-container")
                    await this.renderCommentEntry(entry, entryContainerEl);
                    break;
                case EntryType.Delimiter:
                    entryContainerEl.addClass("delim-container")
                    await this.renderDelimiterEntry(entry, entryContainerEl);
                    break;
                case EntryType.Markdown:
                    entryContainerEl.addClass("markdown-container")
                    await this.renderMarkdownEntry(entry, entryContainerEl);
                    break;
                case EntryType.Message:
                    entryContainerEl.addClass("message-container")
                    await this.renderMessageEntry(entry, entryContainerEl);
                    break;
            }
        }
    }
}
