import {
    type App,
    type MarkdownPostProcessorContext,
    MarkdownRenderer,
    MarkdownRenderChild,
} from "obsidian";

import { type CbxConfig, DEFAULT_AUTO_COLOR_AUTHORS } from "src/config";
import { decodeHTMLEntities, fixObsidianRenderedMarkdown } from "src/utils";
import {
    type CbxEntry,
    type CapsuleEntry,
    type CommentEntry,
    type DelimiterEntry,
    type MarkdownEntry,
    type MessageEntry,
    EntryType,
    MessageDir,
} from "src/entries";
import { ChatterboxSettings } from "src/settings";
import { CssClasses, CssProps } from "src/css_data";


// This should correspond to the number of `--auto-color-*` CSS variables (starting from 1
// with no holes).
const NUM_TEXT_AUTO_COLORS: number = 8;

/**
 * Base class to be extended by all Chatterbox renderer classes.
 */
export abstract class ChatterboxRenderer {
    protected readonly app: App;
    protected readonly ctx: MarkdownPostProcessorContext;
    protected readonly config: CbxConfig;
    protected readonly settings: ChatterboxSettings;
    protected readonly authorOrderMap: Map<string, string> = new Map();
    protected readonly autoAuthorColorMap: Map<string, string> = new Map();

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
     * Assigns an auto color to each author that doesn't have a `color` value assigned in the
     * config.
     * Colors are assigned based on the order of appearance of authors in the entry list and
     * cycle around a predefined set of colors.
     * The nameless author isn't assigned a color.
     * 
     * Classes extending this base class should not need to override this.
     * 
     * @param entries The list of entries used to determine the order of authors.
     */
    protected populateAutoAuthorColorMap(entries: CbxEntry[]) {
        let currAuthorNum = 0;

        for (const entry of entries) {
            if (entry.type !== EntryType.Message || entry.author === "") {
                continue;
            }

            const author = entry.author;
            const authorConfig = this.config.authors?.[author];

            if (authorConfig?.authorColor === undefined && !this.autoAuthorColorMap.has(author)) {
                const colorNum = (currAuthorNum % NUM_TEXT_AUTO_COLORS) + 1;
                const autoColor = `var(--auto-color-${String(colorNum)})`;

                this.autoAuthorColorMap.set(author, autoColor);

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
        const capsuleEl = entryContainerEl.createDiv({ cls: CssClasses.capsuleElement });

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
        const commentEl = entryContainerEl.createDiv({ cls: CssClasses.commentElement });

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
        const delimiterEl = entryContainerEl.createDiv({ cls: CssClasses.delimiterElement });

        delimiterEl.createDiv({ cls: CssClasses.delimiterDot });
        delimiterEl.createDiv({ cls: CssClasses.delimiterDot });
        delimiterEl.createDiv({ cls: CssClasses.delimiterDot });
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
        const markdownEl = entryContainerEl.createDiv({ cls: CssClasses.markdownElement });

        await this.renderObsidianMarkDown(entry.content, markdownEl);
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
        const messageEl = entryContainerEl.createDiv({ cls: CssClasses.messageElement });

        const bgColor = this.config.authors?.[entry.author]?.bgColor ?? undefined;
        if (bgColor !== undefined) {
            messageEl.style.setProperty(CssProps.messageBackgroundColor, bgColor);
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

        const contentColor = this.config.authors?.[entry.author]?.textColor ?? undefined;
        if (contentColor !== undefined) {
            messageEl.style.setProperty(CssProps.messageContentColor, contentColor);
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
            [CssProps.capsuleMaxWidth, this.config.maxCapsuleWidth],
            [CssProps.commentMaxWidth, this.config.maxCommentWidth],
            [CssProps.messageMinWidth, this.config.minMessageWidth],
            [CssProps.messageMaxWidth, this.config.maxMessageWidth],
        ]
            .filter(x => x[1] !== undefined) as Iterable<readonly [PropertyKey, unknown]>;

        rootEl.setCssProps({
            ...(Object.fromEntries(cbxProps) as Record<string, string>)
        });

        this.populateAuthorOrderMap(entries);

        if (this.config.autoColorAuthors ?? DEFAULT_AUTO_COLOR_AUTHORS) {
            this.populateAutoAuthorColorMap(entries);
        }

        const cbxContentEl = rootEl.createDiv({ cls: CssClasses.chatterboxContent });

        for (const entry of entries) {
            const entryContainerEl = cbxContentEl.createDiv({ cls: CssClasses.entryContainer });

            switch (entry.type) {
                case EntryType.Capsule:
                    entryContainerEl.addClass(CssClasses.capsuleContainer);
                    await this.renderCapsuleEntry(entry, entryContainerEl);
                    break;
                case EntryType.Comment:
                    entryContainerEl.addClass(CssClasses.commentContainer);
                    await this.renderCommentEntry(entry, entryContainerEl);
                    break;
                case EntryType.Delimiter:
                    entryContainerEl.addClass(CssClasses.delimiterContainer);
                    await this.renderDelimiterEntry(entry, entryContainerEl);
                    break;
                case EntryType.Markdown:
                    entryContainerEl.addClass(CssClasses.markdownContainer);
                    await this.renderMarkdownEntry(entry, entryContainerEl);
                    break;
                case EntryType.Message:
                    entryContainerEl.addClass(CssClasses.messageContainer);
                    await this.renderMessageEntry(entry, entryContainerEl);
                    break;
            }
        }
    }
}
