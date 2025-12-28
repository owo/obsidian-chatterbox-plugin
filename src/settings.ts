import { App, PluginSettingTab, Setting } from "obsidian";

import ChatterboxPlugin from "./main";


// TODO: Update currently rendered Chatterbox blocks when settings change.

const DEFAULT_FRONTMATTER_DESC = `Default YAML frontmatter to include in all Chatterbox blocks.`;
const DEFAULT_FRONTMATTER_PH = `// Example: \n
mode: bubble
maxMessageWidth: 60
authors:
  john:
    fullName: John Smith
    nameColor: "#BD640B"
`;

const APPLY_OBSIDIAN_MD_FIX_DESC = `Attempt to fix visual discrepancies caused when rendering text
content as Markdown.`;

/**
 * Container for Chatterbox plugin settings.
 */
export interface ChatterboxSettings {
    defaultFrontmatter: string;
    applyObsidianMarkdownFixes: boolean;
}

/**
 * Default Chatterbox plugin settings.
 */
export const CBX_DEFAULT_SETTINGS: ChatterboxSettings = {
    defaultFrontmatter: "",
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
            .setName("Default frontmatter")
            .setDesc(DEFAULT_FRONTMATTER_DESC)
            .addTextArea(text => {
                text.setValue(this.plugin.settings.defaultFrontmatter)
                    .setPlaceholder(DEFAULT_FRONTMATTER_PH)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultFrontmatter = value;
                        await this.plugin.saveSettings();
                    }).then(text => {
                        text.inputEl.addClass("cbx-setting-default-frontmatter")
                    });
            })

        new Setting(containerEl)
            .setName("Apply Obsidian Markdown fixes")
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
