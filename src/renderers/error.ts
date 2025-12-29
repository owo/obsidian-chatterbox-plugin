/**
 * Render a list of Chatterbox parsing errors to a given HTML element.
 * 
 * @param errorList List of individual error messages to be rendered.
 * @param containerEl The HTML element to render to.
 */
export default function renderCbxError(errorList: string[], containerEl: HTMLElement) {
    const cbxRootEl = containerEl.createDiv({ cls: "chatterbox" });
    const errContainerEl = cbxRootEl.createDiv({ cls: "error-container" });

    const errHeaderEl = errContainerEl.createDiv({ cls: "error-title" });
    errHeaderEl.textContent = "Chatterbox error";

    const errItemsEl = errContainerEl.createEl("ul", { cls: "error-items" });
    for (const err of errorList) {
        const itemEl = errItemsEl.createEl("li");
        itemEl.textContent = err;
    }
}
