const START_ANCHOR = /^/.source;
const END_ANCHOR = /$/.source;

const WS = /\s/.source;
const WS_SEQ_OPTIONAL = /\s*/.source;

const CONTENT = /(?<content>.+)/.source;
const BLOCK_CONTENT = /(?<content>(\s.*)|(\s*))/.source;

const COMMENT_SINGLE = /#/.source;
const COMMENT_FENCE = /(?<fence>###+)/.source;
const CAPSULE_MARKER = /(?<capsule>\(\))?/.source;

const SPEECH_PARAMS = /(?<speechParams>.*)/.source;
const SPEECH_DIR_SINGLE = /(?<speechDir>[<>^])/.source;
const SPEECH_DIR_FENCE = /(?<fence>(<<<+)|(>>>+)|(\^\^\^+))/.source;
const SPEECH_HIDE_NAME_MARKER = /(?<hideName>!)?/.source;
const SPEECH_RENDER_MD_MARKER = /(?<renderMd>@)?/.source;

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
 * Regular expression matching a single-line speech entry.
 */
export const SPEECH_RE = RegExp(
    START_ANCHOR +
    SPEECH_PARAMS +
    WS_SEQ_OPTIONAL +
    SPEECH_DIR_SINGLE +
    SPEECH_HIDE_NAME_MARKER +
    SPEECH_RENDER_MD_MARKER +
    WS +
    CONTENT +
    END_ANCHOR
);

/**
 * Regular expression matching the start of a multi-line speech block.
 */
export const SPEECH_BLOCK_RE = RegExp(
    START_ANCHOR +
    SPEECH_PARAMS +
    WS_SEQ_OPTIONAL +
    SPEECH_DIR_FENCE +
    SPEECH_HIDE_NAME_MARKER +
    SPEECH_RENDER_MD_MARKER +
    BLOCK_CONTENT +
    END_ANCHOR
);
