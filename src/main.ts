// ABOUTME: Main entry point for the Obsidian Web Dev Playground plugin
// ABOUTME: Registers the playground view and commands

import { Plugin, Notice } from 'obsidian';
import { PlaygroundView, VIEW_TYPE_PLAYGROUND } from './PlaygroundView.js';
import { PlaygroundSettingTab } from './settings-tab.js';
import { DEFAULT_SETTINGS, type PlaygroundSettings } from './settings.js';

export default class WebDevPlaygroundPlugin extends Plugin {
    settings!: PlaygroundSettings;

    override async onload() {
        console.log('Loading Web Dev Playground plugin');

        await this.loadSettings();

        this.registerView(
            VIEW_TYPE_PLAYGROUND,
            (leaf) => new PlaygroundView(leaf, this.settings)
        );

        this.addRibbonIcon('code', 'Open Web Dev Playground', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-playground',
            name: 'Open Web Dev Playground',
            callback: () => {
                this.activateView();
            },
        });

        this.addSettingTab(new PlaygroundSettingTab(this.app, this));
    }

    override async onunload() {
        console.log('Unloading Web Dev Playground plugin');
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_PLAYGROUND);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
                console.warn('Failed to create leaf for Web Dev Playground');
                new Notice('Could not open Web Dev Playground. Please try again.');
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
