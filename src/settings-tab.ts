// ABOUTME: Settings UI for Web Dev Playground plugin
// ABOUTME: Provides controls for debounce timeout and loop protection

import { App, PluginSettingTab, Setting } from "obsidian";
import type WebDevPlaygroundPlugin from "./main.js";

export class PlaygroundSettingTab extends PluginSettingTab {
	plugin: WebDevPlaygroundPlugin;

	constructor(app: App, plugin: WebDevPlaygroundPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Web Dev Playground Settings" });

		new Setting(containerEl)
			.setName("Debounce timeout")
			.setDesc(
				"Milliseconds to wait after typing before updating preview (100-2000ms)",
			)
			.addSlider((slider) =>
				slider
					.setLimits(100, 2000, 100)
					.setValue(this.plugin.settings.debounceTimeout)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.debounceTimeout = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Loop protection timeout")
			.setDesc("Milliseconds before detecting infinite loop (50-1000ms)")
			.addSlider((slider) =>
				slider
					.setLimits(50, 1000, 50)
					.setValue(this.plugin.settings.loopProtectionTimeout)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.loopProtectionTimeout = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
