/**
 * Chatterbox CSS classes.
 * Use these instead of hardcoded string values.
 */
export const CssClasses = {

    chatterboxRoot: "chatterbox",
    chatterboxContent: "chatterbox-content",

    // Modes
    modeBase: "mode-base",
    modeBubble: "mode-bubble",
    modeSimple: "mode-simple",

    // All entries
    entryContainer: "entry-container",

    // Capsule entries
    capsuleContainer: "capsule-container",
    capsuleElement: "capsule",

    // Comment entries
    commentContainer: "comment-container",
    commentElement: "comment",

    // Delimiter entries
    delimiterContainer: "delimiter-container",
    delimiterElement: "delimiter",
    delimiterDot: "dot",

    // Markdown entries
    markdownContainer: "markdown-container",
    markdownElement: "markdown",

    // Message entries
    messageContainer: "message-container",
    messageElement: "message",
    messageDirLeft: "message-left",
    messageDirRight: "message-right",
    messageDirCenter: "message-center",
    messageHeader: "message-header",
    messageBody: "message-body",
    messageFooter: "message-footer",
    messageAuthor: "message-author",
    messageContent: "message-content",
    messageSubtext: "message-subtext",

    // Error box
    errorContainer: "error-container",
    errorHeader: "error-header",
    errorTitle: "error-title",
    errorItems: "error-items",

    // Fixes
    fixObsidianEmbed: "fix-obsidian-embed",

    // Plugin settings
    settingDefaultFrontMatter: "cbx-setting-default-frontmatter",

} as const;


/**
 * Chatterbox CSS properties/variables.
 * Use these instead of hardcoded string values.
 */
export const CssProps = {

    // Capsule entries
    capsuleMaxWidth: "--capsule-max-width",

    // Comment entries
    commentMaxWidth: "--comment-max-width",

    // Message entries
    messageMinWidth: "--message-min-width",
    messageMaxWidth: "--message-max-width",
    messageBgColor: "--message-bg-color",

} as const;
