const START_ANCHOR = /^/.source;
const END_ANCHOR = /$/.source;

const WS = /\s/.source;
const WS_SEQ_OPTIONAL = /\s*/.source;

const CONTENT = /(?<content>.+)/.source;
const BLOCK_CONTENT = /(?<content>\s.*|\s*)/.source;

const COMMENT_SINGLE = /#/.source;
const COMMENT_FENCE = /(?<fence>###+)/.source;
const CAPSULE_MARKER = /(?<capsule>\(\))?/.source;

const MESSAGE_PARAMS = /(?<messageParams>.*?)/.source;
const MESSAGE_DIR_SINGLE = /(?<messageDir>[<>^])/.source;
const MESSAGE_DIR_FENCE = /(?<fence><<<+|>>>+|\^\^\^+)/.source;
const MESSAGE_HIDE_AUTHOR_MARKER = /(?<hideAuthor>!)?/.source;
const MESSAGE_RENDER_MD_MARKER = /(?<renderMd>@)?/.source;

const MARKDOWN_FENCE = /(?<fence>@@@+)/.source;

const DELIMITER_MARKER = /\.\.\./.source;

/**
 * Regular expression matching a single-line comment or capsule entry.
 */
export const COMMENT_OR_CAPSULE_RE = RegExp(
    START_ANCHOR +
    COMMENT_SINGLE +
    CAPSULE_MARKER +
    WS +
    CONTENT +
    END_ANCHOR
);

/**
 * Regular expression matching the start of a multi-line comment or capsule block.
 */
export const COMMENT_OR_CAPSULE_BLOCK_RE = RegExp(
    START_ANCHOR +
    COMMENT_FENCE +
    CAPSULE_MARKER +
    BLOCK_CONTENT +
    END_ANCHOR
);

/**
 * Regular expression matching a delimiter entry.
 */
export const DELIMITER_RE = RegExp(
    START_ANCHOR +
    DELIMITER_MARKER +
    WS_SEQ_OPTIONAL +
    END_ANCHOR
);

/**
 * Regular expression matching the start of a multi-line Markdown block.
 */
export const MARKDOWN_BLOCK_RE = RegExp(
    START_ANCHOR +
    MARKDOWN_FENCE +
    BLOCK_CONTENT +
    END_ANCHOR
);

/**
 * Regular expression matching a single-line message entry.
 */
export const MESSAGE_RE = RegExp(
    START_ANCHOR +
    MESSAGE_PARAMS +
    WS_SEQ_OPTIONAL +
    MESSAGE_DIR_SINGLE +
    MESSAGE_HIDE_AUTHOR_MARKER +
    MESSAGE_RENDER_MD_MARKER +
    WS +
    CONTENT +
    END_ANCHOR
);

/**
 * Regular expression matching the start of a multi-line message block.
 */
export const MESSAGE_BLOCK_RE = RegExp(
    START_ANCHOR +
    MESSAGE_PARAMS +
    WS_SEQ_OPTIONAL +
    MESSAGE_DIR_FENCE +
    MESSAGE_HIDE_AUTHOR_MARKER +
    MESSAGE_RENDER_MD_MARKER +
    BLOCK_CONTENT +
    END_ANCHOR
);
