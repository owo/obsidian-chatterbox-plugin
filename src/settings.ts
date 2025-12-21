import { App, PluginSettingTab, Setting } from "obsidian";

import ChatterboxPlugin from "./main";


// TODO: Update currently rendered Chatterbox blocks when settings change.

const APPLY_OBSIDIAN_MD_FIX_DESC = `Attempt to fix visual discrepencies caused when rendering text
content as Markdown.`;

/**
 * Container for Chatterbox plugin settings.
 */
export interface ChatterboxSettings {
    applyObsidianMarkdownFixes: boolean;
}

/**
 * Default Chatterbox plugin settings.
 */
export const CBX_DEFAULT_SETTINGS: ChatterboxSettings = {
    applyObsidianMarkdownFixes: true,
}

/**
 * Implements the Obsidian settings tab for the Chatterbox plugin.
 */
export class ChatterboxSettingTab extends PluginSettingTab {
    plugin: ChatterboxPlugin;

    constructor(app: App, plugin: ChatterboxPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Apply Obsidian Markdown fixes')
            .setDesc(APPLY_OBSIDIAN_MD_FIX_DESC)
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.applyObsidianMarkdownFixes)
                    .onChange(async (value) => {
                        this.plugin.settings.applyObsidianMarkdownFixes = value;
                        await this.plugin.saveSettings();
                    });
            });
    }
}
