// ABOUTME: Main entry point for the Obsidian Web Dev Playground plugin
// ABOUTME: Registers the playground view and commands

import { Plugin, Notice } from "obsidian";
import { PlaygroundView, VIEW_TYPE_PLAYGROUND } from "./PlaygroundView.js";
import { PlaygroundSettingTab } from "./settings-tab.js";
import { DEFAULT_SETTINGS, type PlaygroundSettings } from "./settings.js";

export default class WebDevPlaygroundPlugin extends Plugin {
	settings!: PlaygroundSettings;

	override async onload() {
		console.log("Loading Web Dev Playground plugin");

		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_PLAYGROUND,
			(leaf) => new PlaygroundView(leaf, this),
		);

		this.addRibbonIcon("code", "Open Web Dev Playground", () => {
			this.activateView();
		});

		this.addCommand({
			id: "open-playground",
			name: "Open Web Dev Playground",
			callback: () => {
				this.activateView();
			},
		});

		this.addSettingTab(new PlaygroundSettingTab(this.app, this));
	}

	override async onunload() {
		console.log("Unloading Web Dev Playground plugin");
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PLAYGROUND);
	}

	async loadSettings() {
		const loaded = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);

		if (
			this.settings.debounceTimeout < 100 ||
			this.settings.debounceTimeout > 2000
		) {
			console.warn(
				`Invalid debounceTimeout: ${this.settings.debounceTimeout}. Using default: ${DEFAULT_SETTINGS.debounceTimeout}`,
			);
			this.settings.debounceTimeout = DEFAULT_SETTINGS.debounceTimeout;
		}

		if (
			this.settings.loopProtectionTimeout < 50 ||
			this.settings.loopProtectionTimeout > 1000
		) {
			console.warn(
				`Invalid loopProtectionTimeout: ${this.settings.loopProtectionTimeout}. Using default: ${DEFAULT_SETTINGS.loopProtectionTimeout}`,
			);
			this.settings.loopProtectionTimeout =
				DEFAULT_SETTINGS.loopProtectionTimeout;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_PLAYGROUND)[0];

		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (!rightLeaf) {
				console.warn("Failed to create leaf for Web Dev Playground");
				new Notice("Could not open Web Dev Playground. Please try again.");
				return;
			}
			leaf = rightLeaf;
			await leaf.setViewState({
				type: VIEW_TYPE_PLAYGROUND,
				active: true,
			});
		}

		workspace.revealLeaf(leaf);
	}
}
