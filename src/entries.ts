/**
 * Represents the type of an entry. Primarily used as a discriminator for {@link CbxEntry}.
 */
export enum EntryType {
    Capsule,
    Comment,
    Delimiter,
    Markdown,
    Speech,
}

/**
 * Represents the rendering direction of a speech entry.
 */
export enum SpeechDir {
    Left,
    Right,
    Center,
}

/**
 * Contains information for a single capsule entry.
 */
export interface CapsuleEntry {
    type: EntryType.Capsule;
    content: string;
}

/**
 * Contains information for a single comment entry.
 */
export interface CommentEntry {
    type: EntryType.Comment;
    content: string;
}

/**
 * Contains information for a single delimiter entry.
 */
export interface DelimiterEntry {
    type: EntryType.Delimiter;
}

/**
 * Contains information for a single Markdown block entry.
 */
export interface MarkdownEntry {
    type: EntryType.Markdown;
    content: string;
}

/**
 * Contains information for a single speech entry.
 */
export interface SpeechEntry {
    type: EntryType.Speech;
    speaker: string;
    content: string;
    dir: SpeechDir;
    subtext?: string;
    showName?: boolean;
    renderMd: boolean;
}

/**
 * Enumeration of all entry types.
 */
export type CbxEntry =
    CapsuleEntry |
    CommentEntry |
    DelimiterEntry |
    MarkdownEntry |
    SpeechEntry;
