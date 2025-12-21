/**
 * Represents the type of a message. Primarily used as a discriminator for {@link Message}.
 */
export enum MessageType {
    Capsule,
    Comment,
    Delimiter,
    Markdown,
    Speech,
}

/**
 * Represents the rendering direction of a speech message.
 */
export enum SpeechDir {
    Left,
    Right,
    Center,
}

/**
 * Contains information for a single capsule message.
 */
export interface CapsuleMsg {
    type: MessageType.Capsule;
    content: string;
}

/**
 * Contains information for a single comment message.
 */
export interface CommentMsg {
    type: MessageType.Comment;
    content: string;
}

/**
 * Contains information for a single delimiter message.
 */
export interface DelimiterMsg {
    type: MessageType.Delimiter;
}

/**
 * Contains information for a single Markdown block message.
 */
export interface MarkdownMsg {
    type: MessageType.Markdown;
    content: string;
}

/**
 * Contains information for a single speech message.
 */
export interface SpeechMsg {
    type: MessageType.Speech;
    speaker: string;
    content: string;
    dir: SpeechDir;
    subtext?: string;
    showName?: boolean;
    renderMd: boolean;
}

/**
 * Enumeration of all message types.
 */
export type Message =
    CapsuleMsg |
    CommentMsg |
    DelimiterMsg |
    MarkdownMsg |
    SpeechMsg;
