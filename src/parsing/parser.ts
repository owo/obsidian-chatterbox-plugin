import { type ChatterboxConfig, ChatterboxConfigValidator } from "src/config";
import { decodeHTMLEntities } from "src/utils";
import {
    type CapsuleEntry,
    type CommentEntry,
    type ChatterboxEntry,
    EntryType,
    MessageDir,
} from "src/entries";
import { ConfigError, parseYamlConfig } from "./yaml_config";
import {
    COMMENT_OR_CAPSULE_BLOCK_RE,
    COMMENT_OR_CAPSULE_RE,
    DELIMITER_RE,
    MARKDOWN_BLOCK_RE,
    MESSAGE_BLOCK_RE,
    MESSAGE_RE,
} from "./patterns";


/**
 * Contains all parsed data from a Chatterbox block.
 */
export interface ChatterboxData {
    config: ChatterboxConfig;
    entries: ChatterboxEntry[];
}

/**
 * Returned by {@link ChatterboxParser} when parsing was successful without any errors.
 */
export interface ParseSuccess {
    isError: false,
    data: ChatterboxData,
}

/**
 * Returned by {@link ChatterboxParser} when parsing was unsuccessful.
 */
export interface ParseError {
    isError: true,
    errorList: string[],
}

/**
 * Enumeration of {@link ChatterboxParser} output types which can be discriminated using the
 * `isError` boolean property.
 */
export type ParseResult = ParseSuccess | ParseError;


/**
 * Represents the current parser state.
 * A value of `Single` indicates the parse is parsing single-line entries and is its default
 * state. A value of `Block` indicates that it is currently in a multi-line block.
 */
enum ParserState {
    Single,
    Block,
}

/**
 * Contains the parsed parameters of a single message entry.
 */
interface MessageParams {
    author: string;
    subtext?: string;
}

/**
 * Parses the message parameters at the beginning of a message entry entry.
 * 
 * @param params The message parameters to be parsed.
 * @returns A {@link MessageParams} instance with the parsed message parameters if it is valid,
 *          `null` otherwise.
 */
function parseMessageParams(params: string): MessageParams | null {
    const parts = params.split("|", 2);
    const author = parts[0].trim();
    const subtext = (parts[1] ?? "").trim();

    return {
        author: decodeHTMLEntities(author),
        subtext: subtext.length > 0 ? decodeHTMLEntities(subtext) : undefined,
    };
}

/**
 * A mapping from a message direction marker in Chatterbox syntax to its respective
 * {@link MessageDir} value.
 */
const DIR_MAP: Record<string, MessageDir> = {
    ">": MessageDir.Right,
    "<": MessageDir.Left,
    "^": MessageDir.Center,
};

/**
 * Parser object for Chatterbox syntax.
 * 
 * [WARNING] Each instance should only be used once per Chatterbox source string.
 */
class ChatterboxParser {
    state: ParserState = ParserState.Single;
    lines: string[] = [];
    config: ChatterboxConfig = ChatterboxConfigValidator.parse({});
    entries: ChatterboxEntry[] = [];
    currLine: number = 0;
    currContent: string[] = [];
    currEntryType: EntryType | null = null;
    currFence: string | undefined = undefined;
    currMessageParams: MessageParams | undefined = undefined;
    currRenderMd: boolean = false;
    currMessageDir: MessageDir = MessageDir.Right;
    currShowAuthor: boolean | undefined = undefined;

    /**
     * Preprocesses a given Chatterbox source string, storing the split lines in an internal
     * parameter.
     * 
     * @param source The source string to be preprocessed.
     */
    private preprocessSource(source: string) {
        this.lines = source.split(/\r?\n/);
    }

    /**
     * Parses Chatterbox YAML frontmatter.
     * 
     * @returns A {@link ConfigError} instance  containing the list of parsing errors if the
     *          frontmatter YAML is invalid, otherwise `null` while updating the internal 
     *          parser state with the parsed data.
     */
    private parseFrontmatter(): ConfigError | null {
        const lines = this.lines;

        if (lines.length > 1 && lines[0] == "---") {
            for (let i = 1; i < lines.length; ++i) {
                if (lines[i] === "---") {
                    const fmRaw = lines.slice(1, i).join("\n");
                    const configRes = parseYamlConfig(fmRaw);

                    if (configRes.isError) {
                        return configRes;
                    }
                    else {
                        this.config = configRes.config;
                    }

                    this.currLine = i + 1;
                    break;
                }
            }
        }

        return null;
    }

    /**
     * Partially resets internal parser state after fully  parsing a multi-line entry block.
     */
    private softResetState() {
        this.currContent = [];
        this.currEntryType = null;
        this.currFence = undefined;
        this.currMessageParams = undefined;
        this.currMessageDir = MessageDir.Right;
        this.currRenderMd = false;
        this.state = ParserState.Single;
    }

    /**
     * Pushes the appropriate entry entry for a completed multi-line block to the list of parsed
     * entries.
     */
    private pushBlockEntry() {
        switch (this.currEntryType) {
            case EntryType.Capsule:
                this.entries.push({
                    type: EntryType.Capsule,
                    content: this.currContent.join("\n"),
                });
                break;
            case EntryType.Comment:
                this.entries.push({
                    type: EntryType.Comment,
                    content: this.currContent.join("\n"),
                });
                break;
            case EntryType.Markdown:
                this.entries.push({
                    type: EntryType.Markdown,
                    content: this.currContent.join("\n"),
                });
                break;
            case EntryType.Message:
                this.entries.push({
                    type: EntryType.Message,
                    content: this.currContent.join("\n"),
                    author: this.currMessageParams?.author ?? "",
                    subtext: this.currMessageParams?.subtext,
                    dir: this.currMessageDir,
                    showAuthor: this.currShowAuthor,
                    renderMd: this.currRenderMd,
                });
                break;
        }
    }

    /**
     * Tries to parse a given line as a single-line comment or capsule entry.
     * 
     * @param line The line to parse.
     * @returns `true` if parsing was successful, `false` otherwise.
     */
    private tryParseCommentOrCapsule(line: string): boolean {
        const match = COMMENT_OR_CAPSULE_RE.exec(line);

        if (match != null && match.groups) {
            const content = match.groups.content ?? "";
            const isCapsule = match.groups.capsule === "()";

            if (isCapsule) {
                const entry: CapsuleEntry = {
                    type: EntryType.Capsule,
                    content,
                };
                this.entries.push(entry);
            }
            else {
                const entry: CommentEntry = {
                    type: EntryType.Comment,
                    content,
                };
                this.entries.push(entry);
            }

            return true;
        }

        return false;
    }

    /**
     * Tries to parse a given line as the start of a multi-line comment or capsule entry block.
     * 
     * @param line The line to parse.
     * @returns `true` if parsing was successful, `false` otherwise.
     */
    private tryParseCommentOrCapsuleBlock(line: string): boolean {
        const match = COMMENT_OR_CAPSULE_BLOCK_RE.exec(line);

        if (match != null && match.groups) {
            const isCapsule = match.groups.capsule === "()";

            this.currFence = match.groups.fence;
            this.currEntryType = isCapsule ? EntryType.Capsule : EntryType.Comment;

            const content = match.groups.content.trimStart();
            if (content.length > 0) {
                this.currContent.push(content);
            }

            this.state = ParserState.Block;

            return true;
        }

        return false;
    }

    /**
     * Tries to parse a given line as a delimiter entry entry.
     * 
     * @param line The line to parse.
     * @returns `true` if parsing was successful, `false` otherwise.
     */
    private tryParseDelimiter(line: string): boolean {
        if (DELIMITER_RE.test(line)) {
            this.entries.push({ type: EntryType.Delimiter });

            return true;
        }

        return false;
    }

    /**
     * Tries to parse a given line as the start of a multi-line Markdown entry block.
     * 
     * @param line The line to parse.
     * @returns `true` if parsing was successful, `false` otherwise.
     */
    private tryParseMarkdownBlock(line: string): boolean {
        const match = MARKDOWN_BLOCK_RE.exec(line);

        if (match != null && match.groups) {
            this.currFence = match.groups.fence;
            this.currEntryType = EntryType.Markdown;

            const content = match.groups.content.trimStart();
            if (content.length > 0) {
                this.currContent.push(content);
            }

            this.state = ParserState.Block;

            return true;
        }

        return false;
    }

    /**
     * Tries to parse a given line as a single-line message entry.
     * 
     * @param line The line to parse.
     * @returns `true` if parsing was successful, `false` otherwise.
     */
    private tryParseMessage(line: string): boolean {
        const match = MESSAGE_RE.exec(line);

        if (match != null && match.groups) {
            const messageParams = parseMessageParams(match.groups.messageParams);

            if (messageParams === null) {
                return false;
            }

            this.entries.push({
                type: EntryType.Message,
                dir: DIR_MAP[match.groups.messageDir] ?? MessageDir.Left,
                author: messageParams.author,
                subtext: messageParams.subtext,
                content: match.groups.content,
                showAuthor: match.groups.messageModifiers.contains("!") !== true,
                renderMd: match.groups.messageModifiers.contains("@") === true,
            });

            return true;
        }

        return false;
    }

    /**
     * Tries to parse a given line as the start of a multi-line message entry block.
     * 
     * @param line The line to parse.
     * @returns `true` if parsing was successful, `false` otherwise.
     */
    private tryParseMessageBlock(line: string): boolean {
        const match = MESSAGE_BLOCK_RE.exec(line);

        if (match != null && match.groups) {
            const messageParams = parseMessageParams(match.groups.messageParams);

            if (messageParams === null) {
                return false;
            }

            this.currEntryType = EntryType.Message;
            this.currMessageParams = messageParams;
            this.currMessageDir = DIR_MAP[match.groups.fence[0]] ?? MessageDir.Left;
            this.currFence = match.groups.fence;
            this.currShowAuthor = match.groups.messageModifiers.contains("!") !== true;
            this.currRenderMd = match.groups.messageModifiers.contains("@") === true;

            const content = match.groups.content.trimStart();
            if (content.length > 0) {
                this.currContent.push(content);
            }

            this.state = ParserState.Block;

            return true;
        }

        return false;
    }

    /**
     * Parses a given source string as Chatterbox syntax.
     * 
     * [WARNING] Should only be used once per instance of {@link ChatterboxParser}.
     * 
     * @param source The source string to be parsed.
     * @returns A {@link ParseSuccess} instance containing the parsed data if the given source is
     *          valid Chatterbox syntax, a {@link ParseError} instance with the list of parsing
     *          errors otherwise.
     */
    public parse(source: string): ParseResult {
        this.preprocessSource(source);

        // Parse frontmatter.
        const fmRes = this.parseFrontmatter();
        if (fmRes !== null) {
            return fmRes;
        }

        for (let i = this.currLine; i < this.lines.length; ++i) {
            const line = this.lines[i];

            // In Block mode we just append content lines until a matching fence line is found.
            if (this.state === ParserState.Block) {
                if (line !== this.currFence) {
                    this.currContent.push(line);
                    continue;
                }

                this.pushBlockEntry();
                this.softResetState();

                continue;
            }

            // In Single mode we iteratively try to match the current line to a valid pattern.
            if (this.tryParseCommentOrCapsuleBlock(line)) { continue; }
            else if (this.tryParseMessageBlock(line)) { continue; }
            else if (this.tryParseMarkdownBlock(line)) { continue; }
            else if (this.tryParseDelimiter(line)) { continue; }
            else if (this.tryParseCommentOrCapsule(line)) { continue; }
            else if (this.tryParseMessage(line)) { continue; }
        }

        // Push any unclosed blocks if parser is in Block mode.
        if (this.state === ParserState.Block) {
            this.pushBlockEntry();
        }

        const result: ParseSuccess = {
            isError: false,
            data: {
                config: this.config,
                entries: this.entries,
            },
        };

        return result;
    }
}


/**
 * Parses a given source string as Chatterbox syntax.
 * 
 * @param source The source string to be parsed.
 * @returns A {@link ParseSuccess} instance containing the parsed data if the given source is
 *          valid Chatterbox syntax, a {@link ParseError} instance with the list of parsing errors
 *          otherwise.
 */
export function parseChatterbox(source: string): ParseResult {
    const parser = new ChatterboxParser();

    return parser.parse(source);
}
