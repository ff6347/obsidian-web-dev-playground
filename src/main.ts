// ABOUTME: Main entry point for the Obsidian Web Dev Playground plugin
// ABOUTME: Registers the playground view and commands

import { Plugin } from 'obsidian';
import { PlaygroundView, VIEW_TYPE_PLAYGROUND } from './PlaygroundView.js';

export default class WebDevPlaygroundPlugin extends Plugin {
    override async onload() {
        console.log('Loading Web Dev Playground plugin');

        this.registerView(
            VIEW_TYPE_PLAYGROUND,
            (leaf) => new PlaygroundView(leaf)
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
    }

    override async onunload() {
        console.log('Unloading Web Dev Playground plugin');
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_PLAYGROUND);
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf = workspace.getLeavesOfType(VIEW_TYPE_PLAYGROUND)[0];

        if (!leaf) {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                leaf = rightLeaf;
                await leaf.setViewState({
                    type: VIEW_TYPE_PLAYGROUND,
                    active: true,
                });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }
}
