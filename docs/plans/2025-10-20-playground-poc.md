# Obsidian Web Dev Playground POC Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Build a minimal Obsidian plugin that renders HTML/CSS/JS/TS code blocks from a note in a live-updating sidebar preview.

**Architecture:** Extract code blocks from active markdown file, transform JS/TS through Babel with loop protection, inject into default HTML template, render in sidebar iframe with debounced updates. Keep it simple - POC first, optimization later.

**Tech Stack:**
- TypeScript
- Obsidian Plugin API
- `@babel/standalone`
- `@freecodecamp/loop-protect`
- Vitest (for testable core logic)

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `manifest.json`
- Create: `.mise.toml`
- Create: `main.ts`

**Step 1: Initialize package.json**

```bash
pnpm init
```

**Step 2: Install dependencies**

```bash
pnpm add -D typescript obsidian @types/node esbuild vitest
pnpm add @babel/standalone @freecodecamp/loop-protect
```

**Step 3: Create manifest.json**

```json
{
  "id": "web-dev-playground",
  "name": "Web Dev Playground",
  "version": "0.1.0",
  "minAppVersion": "0.15.0",
  "description": "Render HTML/CSS/JS/TS code blocks in a live preview sidebar",
  "author": "Fabian Morón Zirfas",
  "isDesktopOnly": false
}
```

**Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**Step 5: Create basic main.ts**

Create: `src/main.ts`

```typescript
// ABOUTME: Main entry point for the Obsidian Web Dev Playground plugin
// ABOUTME: Registers the playground view and commands
import { Plugin } from 'obsidian';

export default class WebDevPlaygroundPlugin extends Plugin {
    async onload() {
        console.log('Loading Web Dev Playground plugin');
    }

    async onunload() {
        console.log('Unloading Web Dev Playground plugin');
    }
}
```

**Step 6: Create build script in package.json**

Add to `package.json`:

```json
{
  "scripts": {
    "build": "esbuild src/main.ts --bundle --external:obsidian --outfile=main.js --format=cjs --target=es2020 --sourcemap",
    "dev": "pnpm build -- --watch",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

**Step 7: Create .mise.toml**

```toml
[tools]
node = "24"
```

**Step 8: Test build**

```bash
pnpm build
```

Expected: `main.js` created successfully

**Step 9: Commit**

```bash
git add .
git commit -m "feat: initialize Obsidian plugin project structure"
```

---

## Task 2: Code Block Extractor

**Files:**
- Create: `src/CodeBlockExtractor.ts`
- Create: `src/CodeBlockExtractor.test.ts`

**Step 1: Write failing test**

Create: `src/CodeBlockExtractor.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { CodeBlockExtractor } from './CodeBlockExtractor';

describe('CodeBlockExtractor', () => {
    it('extracts single HTML code block', () => {
        const markdown = '```html\n<h1>Hello</h1>\n```';
        const extractor = new CodeBlockExtractor(markdown);
        const result = extractor.extract();

        expect(result.html).toBe('<h1>Hello</h1>');
        expect(result.css).toBe('');
        expect(result.js).toBe('');
        expect(result.ts).toBe('');
    });

    it('extracts and concatenates multiple blocks of same type', () => {
        const markdown = '```js\nconst a = 1;\n```\n\nSome text\n\n```js\nconst b = 2;\n```';
        const extractor = new CodeBlockExtractor(markdown);
        const result = extractor.extract();

        expect(result.js).toBe('const a = 1;\nconst b = 2;');
    });

    it('extracts mixed block types in order', () => {
        const markdown = '```html\n<div></div>\n```\n```css\nbody{}\n```\n```js\nconsole.log();\n```';
        const extractor = new CodeBlockExtractor(markdown);
        const result = extractor.extract();

        expect(result.html).toBe('<div></div>');
        expect(result.css).toBe('body{}');
        expect(result.js).toBe('console.log();');
    });
});
```

**Step 2: Run test to verify failure**

```bash
pnpm test
```

Expected: FAIL - CodeBlockExtractor not found

**Step 4: Implement CodeBlockExtractor**

Create: `src/CodeBlockExtractor.ts`

```typescript
// ABOUTME: Extracts and concatenates code blocks from markdown by language type
// ABOUTME: Supports html, css, js, ts, javascript, typescript blocks in document order

export interface ExtractedCode {
    html: string;
    css: string;
    js: string;
    ts: string;
}

export class CodeBlockExtractor {
    constructor(private markdown: string) {}

    extract(): ExtractedCode {
        const result: ExtractedCode = {
            html: '',
            css: '',
            js: '',
            ts: '',
        };

        const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
        let match;

        while ((match = codeBlockRegex.exec(this.markdown)) !== null) {
            const lang = match[1].toLowerCase();
            const code = match[2];

            switch (lang) {
                case 'html':
                    result.html += (result.html ? '\n' : '') + code;
                    break;
                case 'css':
                    result.css += (result.css ? '\n' : '') + code;
                    break;
                case 'js':
                case 'javascript':
                    result.js += (result.js ? '\n' : '') + code;
                    break;
                case 'ts':
                case 'typescript':
                    result.ts += (result.ts ? '\n' : '') + code;
                    break;
            }
        }

        return result;
    }
}
```

**Step 3: Run test to verify pass**

```bash
pnpm test
```

Expected: PASS - all tests green

**Step 6: Commit**

```bash
git add src/CodeBlockExtractor.ts src/CodeBlockExtractor.test.ts package.json
git commit -m "feat: add code block extractor with concatenation support"
```

---

## Task 3: Code Transformer (Babel + Loop Protection)

**Files:**
- Create: `src/CodeTransformer.ts`
- Create: `src/CodeTransformer.test.ts`

**Step 1: Write failing test**

Create: `src/CodeTransformer.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { CodeTransformer } from './CodeTransformer';

describe('CodeTransformer', () => {
    it('transforms TypeScript to JavaScript', () => {
        const transformer = new CodeTransformer(100);
        const ts = 'const greet = (name: string): string => `Hello ${name}`;';
        const result = transformer.transform(ts);

        expect(result).toContain('Hello');
        expect(result).not.toContain(': string');
    });

    it('injects loop protection', () => {
        const transformer = new CodeTransformer(100);
        const code = 'while (true) { }';
        const result = transformer.transform(code);

        expect(result).toContain('loopProtect');
    });

    it('throws on syntax error', () => {
        const transformer = new CodeTransformer(100);
        const badCode = 'const x = {';

        expect(() => transformer.transform(badCode)).toThrow();
    });
});
```

**Step 2: Run test to verify failure**

```bash
pnpm test
```

Expected: FAIL - CodeTransformer not found

**Step 3: Implement CodeTransformer**

Create: `src/CodeTransformer.ts`

```typescript
// ABOUTME: Transforms TypeScript to JavaScript using Babel with infinite loop protection
// ABOUTME: Uses @freecodecamp/loop-protect plugin to prevent infinite loops

import * as Babel from '@babel/standalone';
import protect from '@freecodecamp/loop-protect';

export class CodeTransformer {
    constructor(private loopTimeout: number = 100) {
        Babel.registerPlugin(
            'loopProtect',
            protect(this.loopTimeout, (line: number) => {
                throw new Error(`Infinite loop detected on line ${line}`);
            })
        );
    }

    transform(source: string): string {
        try {
            const result = Babel.transform(source, {
                presets: ['typescript'],
                plugins: ['loopProtect'],
            });
            return result.code || '';
        } catch (error) {
            throw new Error(`Transformation failed: ${error}`);
        }
    }
}
```

**Step 4: Run test to verify pass**

```bash
npm test
```

Expected: PASS - all tests green

**Step 5: Commit**

```bash
git add src/CodeTransformer.ts src/CodeTransformer.test.ts
git commit -m "feat: add code transformer with Babel and loop protection"
```

---

## Task 4: Iframe Renderer

**Files:**
- Create: `src/IframeRenderer.ts`
- Create: `src/IframeRenderer.test.ts`

**Step 1: Write failing test**

Create: `src/IframeRenderer.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { IframeRenderer } from './IframeRenderer';

describe('IframeRenderer', () => {
    it('generates complete HTML document', () => {
        const renderer = new IframeRenderer();
        const html = renderer.generateDocument({
            html: '<h1>Test</h1>',
            css: 'h1 { color: red; }',
            js: 'console.log("hi");',
        });

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<h1>Test</h1>');
        expect(html).toContain('h1 { color: red; }');
        expect(html).toContain('console.log("hi");');
    });

    it('injects content into template structure', () => {
        const renderer = new IframeRenderer();
        const html = renderer.generateDocument({
            html: '<p>Content</p>',
            css: '',
            js: '',
        });

        expect(html).toContain('<main>');
        expect(html).toContain('</main>');
        expect(html).toContain('<p>Content</p>');
    });

    it('handles empty content', () => {
        const renderer = new IframeRenderer();
        const html = renderer.generateDocument({
            html: '',
            css: '',
            js: '',
        });

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<main>');
    });
});
```

**Step 2: Run test to verify failure**

```bash
pnpm test
```

Expected: FAIL - IframeRenderer not found

**Step 3: Implement IframeRenderer**

Create: `src/IframeRenderer.ts`

```typescript
// ABOUTME: Generates HTML documents for iframe rendering from extracted code blocks
// ABOUTME: Uses default template with meta tags and injects user content into main element

export interface RenderContent {
    html: string;
    css: string;
    js: string;
}

export class IframeRenderer {
    generateDocument(content: RenderContent): string {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${content.css}</style>
</head>
<body>
  <main>${content.html}</main>
  <script>${content.js}</script>
</body>
</html>`;
    }
}
```

**Step 4: Run test to verify pass**

```bash
npm test
```

Expected: PASS - all tests green

**Step 5: Commit**

```bash
git add src/IframeRenderer.ts src/IframeRenderer.test.ts
git commit -m "feat: add iframe renderer with default HTML template"
```

---

## Task 5: Playground View (Sidebar)

**Files:**
- Create: `src/PlaygroundView.ts`
- Modify: `src/main.ts`

**Step 1: Create PlaygroundView class**

Create: `src/PlaygroundView.ts`

```typescript
// ABOUTME: Custom Obsidian view that displays live preview of code blocks in sidebar
// ABOUTME: Manages iframe rendering, debounced updates, and code extraction pipeline

import { ItemView, WorkspaceLeaf, MarkdownView, debounce } from 'obsidian';
import { CodeBlockExtractor } from './CodeBlockExtractor';
import { CodeTransformer } from './CodeTransformer';
import { IframeRenderer } from './IframeRenderer';

export const VIEW_TYPE_PLAYGROUND = 'web-dev-playground';

export class PlaygroundView extends ItemView {
    private iframe: HTMLIFrameElement;
    private transformer: CodeTransformer;
    private renderer: IframeRenderer;
    private currentBlobUrl: string | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.transformer = new CodeTransformer(100);
        this.renderer = new IframeRenderer();
    }

    getViewType(): string {
        return VIEW_TYPE_PLAYGROUND;
    }

    getDisplayText(): string {
        return 'Web Dev Playground';
    }

    getIcon(): string {
        return 'code';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
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

    async onClose() {
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
```

**Step 2: Register view in main.ts**

Modify: `src/main.ts`

```typescript
// ABOUTME: Main entry point for the Obsidian Web Dev Playground plugin
// ABOUTME: Registers the playground view and commands

import { Plugin } from 'obsidian';
import { PlaygroundView, VIEW_TYPE_PLAYGROUND } from './PlaygroundView';

export default class WebDevPlaygroundPlugin extends Plugin {
    async onload() {
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

    async onunload() {
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
```

**Step 3: Build and manually test**

```bash
pnpm build
```

Expected: Build succeeds

Manual test: Copy plugin to Obsidian vault's `.obsidian/plugins/web-dev-playground/` and enable

**Step 4: Commit**

```bash
git add src/PlaygroundView.ts src/main.ts
git commit -m "feat: add playground view with live preview sidebar"
```

---

## Task 6: Settings Tab

**Files:**
- Create: `src/SettingsTab.ts`
- Create: `src/Settings.ts`
- Modify: `src/main.ts`
- Modify: `src/PlaygroundView.ts`

**Step 1: Define settings interface**

Create: `src/Settings.ts`

```typescript
// ABOUTME: Plugin settings interface and default values
// ABOUTME: Manages debounce timeout, update mode, and loop protection settings

export interface PlaygroundSettings {
    debounceTimeout: number;
    updateOnSaveOnly: boolean;
    loopProtectionTimeout: number;
}

export const DEFAULT_SETTINGS: PlaygroundSettings = {
    debounceTimeout: 500,
    updateOnSaveOnly: false,
    loopProtectionTimeout: 100,
};
```

**Step 2: Create settings tab**

Create: `src/SettingsTab.ts`

```typescript
// ABOUTME: Settings UI for Web Dev Playground plugin
// ABOUTME: Provides controls for debounce timeout, update mode toggle, and loop protection

import { App, PluginSettingTab, Setting } from 'obsidian';
import WebDevPlaygroundPlugin from './main';

export class PlaygroundSettingTab extends PluginSettingTab {
    plugin: WebDevPlaygroundPlugin;

    constructor(app: App, plugin: WebDevPlaygroundPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Web Dev Playground Settings' });

        new Setting(containerEl)
            .setName('Debounce timeout')
            .setDesc('Milliseconds to wait after typing before updating preview (100-2000ms)')
            .addSlider((slider) =>
                slider
                    .setLimits(100, 2000, 100)
                    .setValue(this.plugin.settings.debounceTimeout)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.debounceTimeout = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Update on save only')
            .setDesc('Only update preview when file is saved (ignores debounce)')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.updateOnSaveOnly)
                    .onChange(async (value) => {
                        this.plugin.settings.updateOnSaveOnly = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Loop protection timeout')
            .setDesc('Milliseconds before detecting infinite loop (50-1000ms)')
            .addSlider((slider) =>
                slider
                    .setLimits(50, 1000, 50)
                    .setValue(this.plugin.settings.loopProtectionTimeout)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.loopProtectionTimeout = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
```

**Step 3: Integrate settings into main.ts**

Modify: `src/main.ts`

```typescript
// ABOUTME: Main entry point for the Obsidian Web Dev Playground plugin
// ABOUTME: Registers the playground view and commands

import { Plugin } from 'obsidian';
import { PlaygroundView, VIEW_TYPE_PLAYGROUND } from './PlaygroundView';
import { PlaygroundSettingTab } from './SettingsTab';
import { DEFAULT_SETTINGS, PlaygroundSettings } from './Settings';

export default class WebDevPlaygroundPlugin extends Plugin {
    settings: PlaygroundSettings;

    async onload() {
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

    async onunload() {
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
```

**Step 4: Update PlaygroundView to use settings**

Modify: `src/PlaygroundView.ts`

Update constructor and debounce usage:

```typescript
import { PlaygroundSettings } from './Settings';

export class PlaygroundView extends ItemView {
    private settings: PlaygroundSettings;

    constructor(leaf: WorkspaceLeaf, settings: PlaygroundSettings) {
        super(leaf);
        this.settings = settings;
        this.transformer = new CodeTransformer(settings.loopProtectionTimeout);
        this.renderer = new IframeRenderer();
    }

    async onOpen() {
        const container = this.containerEl.children[1];
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

    // ... rest of the class remains the same
}
```

**Step 5: Build and test**

```bash
pnpm build
```

Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/Settings.ts src/SettingsTab.ts src/main.ts src/PlaygroundView.ts
git commit -m "feat: add settings tab for debounce, update mode, and loop protection"
```

---

## Task 7: Documentation

**Files:**
- Create: `docs/SPEC.md`
- Update: `README.md`

**Step 1: Create SPEC.md**

Create: `docs/SPEC.md`

```markdown
# Web Dev Playground - Specification

## Purpose

Minimal Obsidian plugin for sketching web development ideas directly in notes. Renders HTML/CSS/JS/TS code blocks in a live-updating sidebar preview.

## Core Features

### Code Block Extraction
- Scans active note for code blocks with languages: `html`, `css`, `js`, `ts`, `javascript`, `typescript`
- Concatenates multiple blocks of same type in document order
- Example: Two `js` blocks become one combined script

### Live Preview
- Renders in right sidebar panel
- Updates on typing (debounced) or save (configurable)
- Default template injects user code into structured HTML document
- Uses iframe with blob URL for isolation

### Code Transformation
- TypeScript → JavaScript via Babel
- Infinite loop protection via `@freecodecamp/loop-protect`
- Syntax errors displayed in preview

### Settings
- Debounce timeout (100-2000ms, default 500ms)
- Update mode toggle (debounced vs save-only)
- Loop protection timeout (50-1000ms, default 100ms)

## Architecture

```
Active Note → CodeBlockExtractor → CodeTransformer → IframeRenderer → Sidebar View
                                         ↓
                                  Babel + Loop Protect
```

## Default HTML Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>{USER_CSS}</style>
</head>
<body>
  <main>{USER_HTML}</main>
  <script>{TRANSFORMED_JS}</script>
</body>
</html>
```

## Future Considerations

- Custom HTML templates with `<slot/>` markers
- Image export (screenshot of preview)
- External library imports
- Console output capture
```

**Step 2: Update README.md**

Update: `README.md`

```markdown
# Obsidian Web Dev Playground

An Obsidian plugin for rendering HTML/CSS/JS/TS code blocks in a live preview sidebar.

Minimal playground for sketching out web development ideas directly in your notes.

## Features

- Extract and render code blocks from active note
- Live preview in sidebar (debounced or on-save)
- TypeScript support with Babel transformation
- Infinite loop protection
- Configurable update timing

## Usage

1. Create a note with code blocks:

\`\`\`html
<h1>Hello World</h1>
\`\`\`

\`\`\`css
h1 { color: blue; }
\`\`\`

\`\`\`js
console.log('Hello from the playground!');
\`\`\`

2. Open the playground view:
   - Click the code icon in the ribbon
   - Or use command palette: "Open Web Dev Playground"

3. Edit your code and see live updates in the sidebar

## Development

```bash
# Install dependencies
pnpm install

# Build plugin
pnpm build

# Run tests
pnpm test

# Watch mode
pnpm dev
```

## Installation

### Manual Installation

1. Build the plugin or download a release
2. Copy `main.js` and `manifest.json` to your vault: `.obsidian/plugins/web-dev-playground/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

## Settings

- **Debounce timeout**: Delay before updating preview (100-2000ms)
- **Update on save only**: Only update when file is saved
- **Loop protection timeout**: Timeout for infinite loop detection (50-1000ms)
```

**Step 3: Commit**

```bash
git add docs/SPEC.md README.md
git commit -m "docs: add specification and usage documentation"
```

---

## Completion Checklist

After implementing all tasks:

- [ ] All tests pass (`pnpm test`)
- [ ] Plugin builds without errors (`pnpm build`)
- [ ] Manual testing in Obsidian vault
- [ ] Code blocks extract correctly
- [ ] TypeScript transforms to JavaScript
- [ ] Infinite loop protection works
- [ ] Settings UI functional
- [ ] Debounce timing configurable
- [ ] Save-only mode works

## Next Steps (Future Features)

1. Image export functionality
2. Custom HTML template support with `<slot/>`
3. Better error display in preview
4. Console output capture
5. External library CDN support
