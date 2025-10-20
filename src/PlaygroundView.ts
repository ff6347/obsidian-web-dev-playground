// ABOUTME: Custom Obsidian view that displays live preview of code blocks in sidebar
// ABOUTME: Manages iframe rendering, debounced updates, and code extraction pipeline

import { ItemView, WorkspaceLeaf, MarkdownView, debounce } from 'obsidian';
import { CodeBlockExtractor } from './CodeBlockExtractor.js';
import { CodeTransformer } from './CodeTransformer.js';
import { IframeRenderer } from './IframeRenderer.js';

export const VIEW_TYPE_PLAYGROUND = 'web-dev-playground';

export class PlaygroundView extends ItemView {
    private iframe!: HTMLIFrameElement;
    private transformer: CodeTransformer;
    private renderer: IframeRenderer;
    private currentBlobUrl: string | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.transformer = new CodeTransformer(100);
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
        if (container) {
            container.empty();
            container.addClass('playground-view');

            this.iframe = container.createEl('iframe');
            this.iframe.addClass('playground-iframe');
            this.iframe.style.width = '100%';
            this.iframe.style.height = '100%';
            this.iframe.style.border = 'none';

            this.registerEvent(
                this.app.workspace.on('editor-change', debounce(() => {
                    this.updatePreview();
                }, 500))
            );

            this.updatePreview();
        }
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
            const errorHtml = this.renderer.generateDocument({
                html: `<pre style="color: red; padding: 1rem;">${error}</pre>`,
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
