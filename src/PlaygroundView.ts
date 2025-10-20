// ABOUTME: Custom Obsidian view that displays live preview of code blocks in sidebar
// ABOUTME: Manages iframe rendering, debounced updates, and code extraction pipeline

import { ItemView, WorkspaceLeaf, MarkdownView, debounce } from 'obsidian';
import { CodeBlockExtractor } from './CodeBlockExtractor.js';
import { CodeTransformer } from './CodeTransformer.js';
import { IframeRenderer } from './IframeRenderer.js';
import type { PlaygroundSettings } from './settings.js';

export const VIEW_TYPE_PLAYGROUND = 'web-dev-playground';

export class PlaygroundView extends ItemView {
    private iframe!: HTMLIFrameElement;
    private transformer: CodeTransformer;
    private renderer: IframeRenderer;
    private currentBlobUrl: string | null = null;
    private settings: PlaygroundSettings;

    constructor(leaf: WorkspaceLeaf, settings: PlaygroundSettings) {
        super(leaf);
        this.settings = settings;
        this.transformer = new CodeTransformer(settings.loopProtectionTimeout);
        this.renderer = new IframeRenderer();
    }

    override getViewType(): string {
        return VIEW_TYPE_PLAYGROUND;
    }

    override getDisplayText(): string {
        return 'Web Dev Playground';
    }

    override getIcon(): string {
        return 'code';
    }

    override async onOpen() {
        const container = this.containerEl.children[1];
        if (!container) {
            console.error('PlaygroundView: container element not found');
            return;
        }

        container.empty();
        container.addClass('playground-view');

        this.iframe = container.createEl('iframe');
        this.iframe.addClass('playground-iframe');
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.style.border = 'none';

        if (this.settings.updateOnSaveOnly) {
            this.registerEvent(
                this.app.vault.on('modify', () => {
                    this.updatePreview();
                })
            );
        } else {
            this.registerEvent(
                this.app.workspace.on('editor-change', debounce(() => {
                    this.updatePreview();
                }, this.settings.debounceTimeout))
            );
        }

        this.updatePreview();
    }

    override async onClose() {
        if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
        }
    }

    private updatePreview() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            return;
        }

        const content = activeView.editor.getValue();
        const extractor = new CodeBlockExtractor(content);
        const extracted = extractor.extract();

        try {
            const combinedJs = [extracted.js, extracted.ts]
                .filter(Boolean)
                .join('\n');

            const transformedJs = combinedJs ? this.transformer.transform(combinedJs) : '';

            const html = this.renderer.generateDocument({
                html: extracted.html,
                css: extracted.css,
                js: transformedJs,
            });

            if (this.currentBlobUrl) {
                URL.revokeObjectURL(this.currentBlobUrl);
            }

            const blob = new Blob([html], { type: 'text/html' });
            this.currentBlobUrl = URL.createObjectURL(blob);
            this.iframe.src = this.currentBlobUrl;
        } catch (error) {
            console.error('Preview update failed:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorHtml = this.renderer.generateDocument({
                html: `<pre style="color: red; padding: 1rem;">${errorMessage}</pre>`,
                css: '',
                js: '',
            });
            const blob = new Blob([errorHtml], { type: 'text/html' });
            if (this.currentBlobUrl) {
                URL.revokeObjectURL(this.currentBlobUrl);
            }
            this.currentBlobUrl = URL.createObjectURL(blob);
            this.iframe.src = this.currentBlobUrl;
        }
    }
}
