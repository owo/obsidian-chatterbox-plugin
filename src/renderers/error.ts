import { CssClasses } from "src/css_data";


/**
 * Render a list of Chatterbox parsing errors to a given HTML element.
 * 
 * @param errorList List of individual error messages to be rendered.
 * @param containerEl The HTML element to render to.
 */
export default function renderCbxError(errorList: string[], containerEl: HTMLElement) {
    const cbxRootEl = containerEl.createDiv({ cls: CssClasses.chatterboxRoot });
    const errContainerEl = cbxRootEl.createDiv({ cls: CssClasses.errorContainer });

    const errTitleEl = errContainerEl.createDiv({ cls: CssClasses.errorTitle });
    errTitleEl.textContent = "Chatterbox error";

    const errItemsEl = errContainerEl.createEl("ul", { cls: CssClasses.errorItems });
    for (const err of errorList) {
        const itemEl = errItemsEl.createEl("li");
        itemEl.textContent = err;
    }
}
