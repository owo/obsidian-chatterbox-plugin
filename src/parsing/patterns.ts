const _START_ANCHOR = /^/.source;
const _END_ANCHOR = /$/.source;

const _WS = /\s/.source;
const _WS_SEQ_OPTIONAL = /\s*/.source;

const _CONTENT = /(?<content>.+)/.source;
const _BLOCK_CONTENT = /(?<content>\s.*|\s*)/.source;

const _COMMENT_SINGLE = /#/.source;
const _COMMENT_FENCE = /(?<fence>###+)/.source;
const _CAPSULE_MODIFIER = /(?<capsule>\(\))?/.source;

const _MESSAGE_PARAMS = /(?<messageParams>.*?)/.source;
const _MESSAGE_DIR_SINGLE = /(?<messageDir>[<>^])/.source;
const _MESSAGE_DIR_FENCE = /(?<fence><<<+|>>>+|\^\^\^+)/.source;
const _MESSAGE_MODIFIERS = /(?<messageModifiers>[@!]*)/.source;

const _MARKDOWN_FENCE = /(?<fence>@@@+)/.source;

const _DELIMITER_MARKER = /\.\.\./.source;

/**
 * Regular expression matching a single-line comment or capsule entry.
 */
export const COMMENT_OR_CAPSULE_RE = RegExp(
    _START_ANCHOR +
    _COMMENT_SINGLE +
    _CAPSULE_MODIFIER +
    _WS +
    _CONTENT +
    _END_ANCHOR
);

/**
 * Regular expression matching the start of a multi-line comment or capsule block.
 */
export const COMMENT_OR_CAPSULE_BLOCK_RE = RegExp(
    _START_ANCHOR +
    _COMMENT_FENCE +
    _CAPSULE_MODIFIER +
    _BLOCK_CONTENT +
    _END_ANCHOR
);

/**
 * Regular expression matching a delimiter entry.
 */
export const DELIMITER_RE = RegExp(
    _START_ANCHOR +
    _DELIMITER_MARKER +
    _WS_SEQ_OPTIONAL +
    _END_ANCHOR
);

/**
 * Regular expression matching the start of a multi-line Markdown block.
 */
export const MARKDOWN_BLOCK_RE = RegExp(
    _START_ANCHOR +
    _MARKDOWN_FENCE +
    _BLOCK_CONTENT +
    _END_ANCHOR
);

/**
 * Regular expression matching a single-line message entry.
 */
export const MESSAGE_RE = RegExp(
    _START_ANCHOR +
    _MESSAGE_PARAMS +
    _WS_SEQ_OPTIONAL +
    _MESSAGE_DIR_SINGLE +
    _MESSAGE_MODIFIERS +
    _WS +
    _CONTENT +
    _END_ANCHOR
);

/**
 * Regular expression matching the start of a multi-line message block.
 */
export const MESSAGE_BLOCK_RE = RegExp(
    _START_ANCHOR +
    _MESSAGE_PARAMS +
    _WS_SEQ_OPTIONAL +
    _MESSAGE_DIR_FENCE +
    _MESSAGE_MODIFIERS +
    _BLOCK_CONTENT +
    _END_ANCHOR
);
