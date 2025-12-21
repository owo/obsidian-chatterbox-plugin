
/**
 * Applies visual fixes to HTML rendered by Obsidian's `MarkdownRenderer`.
 * 
 * @param el The HTML element containing Obsidian-rendered markdown.
 */
export function fixObsidianRenderedMarkdown(el: HTMLElement) {
    let foundFirst: boolean = false;
    let firstEl: HTMLElement | null = null;
    let lastEl: HTMLElement | null = null;

    // Walk from the start, ignoring whitespace-only text and comments
    for (const n of el.childNodes) {
        const node = n as Node;

        // Ignore comment nodes
        if (node.nodeType === Node.COMMENT_NODE) {
            continue;
        }

        // Find the first non-empty text node if present.
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.nodeValue !== null && node.nodeValue.trim() === "") {
                continue;
            }

            if (!foundFirst) {
                foundFirst = true;
            }

            foundFirst = true;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const childEl = node as HTMLElement;

            if (!foundFirst) {
                foundFirst = true;
                firstEl = childEl;
            }

            lastEl = childEl;

        }
    }

    if (firstEl !== null) {
        firstEl.classList.add("cbx-md-fix-first");
    }

    if (lastEl !== null) {
        lastEl.classList.add("cbx-md-fix-last");
    }
}
