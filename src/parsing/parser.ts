import { type CbxConfig, CbxConfigValidator } from "src/config";
import {
    type CapsuleMsg,
    type CommentMsg,
    type Message,
    MessageType,
    SpeechDir,
} from "src/messages";
import { CbxConfigError, parseCbxFrontmatter } from "./frontmatter";
import {
    COMMENT_OR_CAPSULE_BLOCK_RE,
    COMMENT_OR_CAPSULE_RE,
    DELIMITER_RE,
    MARKDOWN_BLOCK_RE,
    SPEECH_BLOCK_RE,
    SPEECH_RE,
} from "./patterns";


/**
 * Contains all parsed data from a Chatterbox block.
 */
export interface CbxData {
    config: CbxConfig;
    messages: Message[];
}

/**
 * Returned by {@link CbxParser} when parsing was successful without any errors.
 */
export interface ParseSuccess {
    isError: false,
    data: CbxData,
}

/**
 * Returned by {@link CbxParser} when parsing was unssuccessful.
 */
export interface ParseError {
    isError: true,
    errorList: string[],
}

/**
 * Enumeration of {@link CbxParser} output types which can be discriminated using the
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
 * Contains the parsed parameters of a single speech message.
 */
interface SpeechParams {
    speaker: string;
    subtext?: string;
}

/**
 * Parses that speech parameters at the begining of a speech message entry.
 * 
 * @param params The speech parameters to be parsed.
 * @returns A {@link SpeechParams} instance with the parsed speech parameters if it is valid,
 *          `null` otherwise.
 */
function parseSpeechParams(params: string): SpeechParams | null {
    const parts = params.split("|", 2);
    const speaker = parts[0].trim();
    const subtext = (parts[1] ?? "").trim();

    return {
        speaker: speaker,
        subtext: subtext.length > 0 ? subtext : undefined,
    };
}

/**
 * A mapping from a speech direction marker in Chatterbox syntax to its respective
 * {@link SpeechDir} value.
 */
const DIR_MAP: Record<string, SpeechDir> = {
    ">": SpeechDir.Right,
    "<": SpeechDir.Left,
    "^": SpeechDir.Center,
};

/**
 * Parser object for Chatterbox syntax.
 * 
 * [WARNING] Each instance should only be used once per Chatterbox source string.
 */
class CbxParser {
    state: ParserState = ParserState.Single;
    lines: string[] = [];
    config: CbxConfig = CbxConfigValidator.parse({});
    messages: Message[] = [];
    currLine: number = 0;
    currContent: string[] = [];
    currMsgType: MessageType | null = null;
    currFence: string | undefined = undefined;
    currSpeechParams: SpeechParams | undefined = undefined;
    currRenderMd: boolean = false;
    currSpeechDir: SpeechDir = SpeechDir.Right;
    currShowName: boolean | undefined = undefined;

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
     * @returns A {@link CbxConfigError} instance  containing the list of parsing errors if the
     *          frontmatter YAML is invalid, otherwise `null` while updating the internal 
     *          parser state with the parsed data.
     */
    private parseFrontmatter(): CbxConfigError | null {
        const lines = this.lines;

        if (lines.length > 1 && lines[0] == "---") {
            for (let i = 1; i < lines.length; ++i) {
                if (lines[i] === "---") {
                    const fmRaw = lines.slice(1, i).join("\n");
                    const configRes = parseCbxFrontmatter(fmRaw);

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
     * Partially resets internal parser state after fully  parsing a multi-line message block.
     */
    private softResetState() {
        this.currContent = [];
        this.currMsgType = null;
        this.currFence = undefined;
        this.currSpeechParams = undefined;
        this.currSpeechDir = SpeechDir.Right;
        this.currRenderMd = false;
        this.state = ParserState.Single;
    }

    /**
     * Pushes the appropriate message entry for a completed multi-line block to the list of parsed
     * messages.
     */
    private pushBlockMessage() {
        switch (this.currMsgType) {
            case MessageType.Capsule:
                this.messages.push({
                    type: MessageType.Capsule,
                    content: this.currContent.join("\n"),
                });
                break;
            case MessageType.Comment:
                this.messages.push({
                    type: MessageType.Comment,
                    content: this.currContent.join("\n"),
                });
                break;
            case MessageType.Markdown:
                this.messages.push({
                    type: MessageType.Markdown,
                    content: this.currContent.join("\n"),
                });
                break;
            case MessageType.Speech:
                this.messages.push({
                    type: MessageType.Speech,
                    content: this.currContent.join("\n"),
                    speaker: this.currSpeechParams?.speaker ?? "",
                    subtext: this.currSpeechParams?.subtext,
                    dir: this.currSpeechDir,
                    showName: this.currShowName,
                    renderMd: this.currRenderMd,
                });
                break;
        }
    }

    /**
     * Tries to parse a given line as a single-line comment or capsule message.
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
                const msg: CapsuleMsg = {
                    type: MessageType.Capsule,
                    content,
                }
                this.messages.push(msg);
            }
            else {
                const msg: CommentMsg = {
                    type: MessageType.Comment,
                    content,
                }
                this.messages.push(msg);
            }

            return true;
        }

        return false;
    }

    /**
     * Tries to parse a given line as the start of a multi-line comment or capsule message block.
     * 
     * @param line The line to parse.
     * @returns `true` if parsing was successful, `false` otherwise.
     */
    private tryParseCommentOrCapsuleBlock(line: string): boolean {
        const match = COMMENT_OR_CAPSULE_BLOCK_RE.exec(line);

        if (match != null && match.groups) {
            const isCapsule = match.groups.capsule === "()";

            this.currFence = match.groups.fence;
            this.currMsgType = isCapsule ? MessageType.Capsule : MessageType.Comment;

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
     * Tries to parse a given line as a delimiter message entry.
     * 
     * @param line The line to parse.
     * @returns `true` if parsing was successful, `false` otherwise.
     */
    private tryParseDelimiter(line: string): boolean {
        if (DELIMITER_RE.test(line)) {
            this.messages.push({ type: MessageType.Delimiter });

            return true;
        }

        return false;
    }

    /**
     * Tries to parse a given line as the start of a multi-line Markdown message block.
     * 
     * @param line The line to parse.
     * @returns `true` if parsing was successful, `false` otherwise.
     */
    private tryParseMarkdownBlock(line: string): boolean {
        const match = MARKDOWN_BLOCK_RE.exec(line);

        if (match != null && match.groups) {
            this.currFence = match.groups.fence;
            this.currMsgType = MessageType.Markdown;

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
     * Tries to parse a given line as a single-line speech message.
     * 
     * @param line The line to parse.
     * @returns `true` if parsing was successful, `false` otherwise.
     */
    private tryParseSpeech(line: string): boolean {
        const match = SPEECH_RE.exec(line);

        if (match != null && match.groups) {
            const speechParams = parseSpeechParams(match.groups.speechParams);

            if (speechParams === null) {
                return false;
            }

            this.messages.push({
                type: MessageType.Speech,
                dir: DIR_MAP[match.groups.speechDir] ?? SpeechDir.Left,
                speaker: speechParams.speaker,
                subtext: speechParams.subtext,
                content: match.groups.content,
                showName: match.groups.hideName !== "!",
                renderMd: this.currRenderMd = match.groups.renderMd === "@",
            });

            return true;
        }

        return false;
    }

    /**
     * Tries to parse a given line as the start of a multi-line speech message block.
     * 
     * @param line The line to parse.
     * @returns `true` if parsing was successful, `false` otherwise.
     */
    private tryParseSpeechBlock(line: string): boolean {
        const match = SPEECH_BLOCK_RE.exec(line);

        if (match != null && match.groups) {
            const speechParams = parseSpeechParams(match.groups.speechParams);

            if (speechParams === null) {
                return false;
            }

            this.currMsgType = MessageType.Speech;
            this.currSpeechParams = speechParams;
            this.currSpeechDir = DIR_MAP[match.groups.fence[0]] ?? SpeechDir.Left;
            this.currFence = match.groups.fence;
            this.currShowName = match.groups.hideName !== "!";
            this.currRenderMd = match.groups.renderMd === "@";

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
     * [WARNING] Should only be used once per instance of {@link CbxParser}.
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

                this.pushBlockMessage();
                this.softResetState();

                continue;
            }

            // In Single mode we iteratively try to match the current line to a valid pattern.
            if (this.tryParseSpeechBlock(line)) { continue; }
            else if (this.tryParseCommentOrCapsuleBlock(line)) { continue; }
            else if (this.tryParseMarkdownBlock(line)) { continue; }
            else if (this.tryParseDelimiter(line)) { continue; }
            else if (this.tryParseSpeech(line)) { continue; }
            else if (this.tryParseCommentOrCapsule(line)) { continue; }
        }

        // Push any unclosed blocks if parser is in Block mode.
        if (this.state === ParserState.Block) {
            this.pushBlockMessage();
        }

        const result: ParseSuccess = {
            isError: false,
            data: {
                config: this.config,
                messages: this.messages,
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
    const parser = new CbxParser();

    return parser.parse(source);
}
