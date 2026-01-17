import { App, PluginSettingTab, Setting } from "obsidian";

import { CssClasses } from "./css_data";
import ChatterboxPlugin from "./main";


// TODO: Update currently rendered Chatterbox blocks when settings change.

const DEFAULT_CONFIG_DESC = `Default YAML configuration to include in all Chatterbox blocks.`;
const DEFAULT_CONFIG_PH = `// Example: \n
mode: simple
maxMessageWidth: 60%
authors:
  john:
    authorFull: John Smith
    authorColor: "#BD640B"
`;

/**
 * Container for Chatterbox plugin settings.
 */
export interface ChatterboxSettings {
    defaultConfiguration: string;
};

/**
 * Default Chatterbox plugin settings.
 */
export const CBX_DEFAULT_SETTINGS: ChatterboxSettings = {
    defaultConfiguration: "",
};

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
            .setName("Default configuration")
            .setDesc(DEFAULT_CONFIG_DESC)
            .addTextArea(text => {
                text.setValue(this.plugin.settings.defaultConfiguration)
                    .setPlaceholder(DEFAULT_CONFIG_PH)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultConfiguration = value;
                        await this.plugin.saveSettings();
                    })
                    .then(text => {
                        text.inputEl.addClass(CssClasses.settingDefaultConfiguration);
                    });
            });
    }
}
