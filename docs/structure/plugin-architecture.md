# Plugin Architecture

## Overview

The Obsidian Web Dev Playground is structured as a modular plugin with clear separation of concerns. Each component has a single responsibility and communicates through well-defined interfaces.

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         main.ts                              │
│  (Plugin Entry Point - Coordinates All Components)          │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├─► settings.ts (Interface & Defaults)
              │
              ├─► settings-tab.ts (Settings UI)
              │
              └─► PlaygroundView.ts (Sidebar View)
                         │
                         ├─► CodeBlockExtractor.ts
                         │   (Parse Markdown → Extract Code)
                         │
                         ├─► CodeTransformer.ts
                         │   (TypeScript → JavaScript + Loop Protection)
                         │
                         └─► IframeRenderer.ts
                             (Generate HTML Document)
```

## Data Flow

```
Active Note (Markdown)
    │
    ▼
CodeBlockExtractor
    │ extracts by language
    ▼
{ html, css, js, ts }
    │
    ▼
CodeTransformer (for js + ts)
    │ Babel transformation
    ▼
{ html, css, transformedJs }
    │
    ▼
IframeRenderer
    │ generates HTML document
    ▼
Blob URL → Iframe (Preview)
```

## Core Components

### main.ts (Plugin Entry)

**Responsibilities:**
- Register PlaygroundView with Obsidian
- Add ribbon icon and command palette command
- Manage settings persistence (load/save)
- Create settings tab
- Handle plugin lifecycle (onload/onunload)

**Key Methods:**
- `onload()` - Initialize plugin, load settings, register view and commands
- `onunload()` - Cleanup, detach views
- `activateView()` - Open playground in right sidebar
- `loadSettings()` - Load from disk with validation
- `saveSettings()` - Persist to disk

**Dependencies:**
- PlaygroundView
- PlaygroundSettingTab
- settings (interface)

### settings.ts (Configuration)

**Responsibilities:**
- Define PlaygroundSettings interface
- Provide default values
- Document setting constraints

**Interface:**
```typescript
interface PlaygroundSettings {
    debounceTimeout: number;        // 100-2000ms
    updateOnSaveOnly: boolean;      // true = save only, false = debounced
    loopProtectionTimeout: number;  // 50-1000ms
}
```

**Defaults:**
- debounceTimeout: 500ms
- updateOnSaveOnly: false
- loopProtectionTimeout: 100ms

### settings-tab.ts (Settings UI)

**Responsibilities:**
- Render settings interface
- Handle user input
- Save changes immediately

**UI Controls:**
- Slider for debounce timeout (100-2000ms, step 100)
- Toggle for update-on-save mode
- Slider for loop protection timeout (50-1000ms, step 50)

**Key Methods:**
- `display()` - Build settings UI with Obsidian's Setting API

### PlaygroundView.ts (Sidebar View)

**Responsibilities:**
- Manage iframe lifecycle
- Listen to editor changes
- Orchestrate extraction → transformation → rendering pipeline
- Handle errors and display them to user
- Clean up blob URLs

**Key Properties:**
- `plugin` - Reference to main plugin (for accessing settings)
- `iframe` - DOM element for preview
- `currentBlobUrl` - Track current blob for cleanup

**Key Methods:**
- `onOpen()` - Create iframe, register event listeners
- `onClose()` - Revoke blob URLs, cleanup
- `updatePreview()` - Execute full pipeline and update iframe
- `getViewType()` - Return 'web-dev-playground'
- `getIcon()` - Return 'code'

**Event Handling:**
- If `updateOnSaveOnly`: Listen to `vault.on('modify')`
- If not: Listen to `workspace.on('editor-change')` with debounce

**Error Handling:**
- Transformation errors displayed in red pre-formatted text in iframe
- Errors logged to console for debugging

### CodeBlockExtractor.ts (Parser)

**Responsibilities:**
- Parse markdown text for fenced code blocks
- Extract blocks by language (html, css, js, ts, javascript, typescript)
- Concatenate multiple blocks of same type in document order
- Handle edge cases (empty input, unsupported languages, cross-platform line endings)

**Interface:**
```typescript
interface ExtractedCode {
    html: string;
    css: string;
    js: string;
    ts: string;
}
```

**Key Methods:**
- `extract()` - Main extraction logic using regex

**Implementation Details:**
- Regex pattern: `/```(\w+)[\r\n]+([\s\S]*?)```/g`
- Handles both `\n` and `\r\n` line endings
- Trims whitespace from code blocks
- Language aliases: javascript → js, typescript → ts
- Unsupported languages are ignored

**Test Coverage:**
- Single block extraction
- Multiple block concatenation
- Mixed language types
- Empty markdown
- Windows line endings
- Language aliases
- Unsupported languages filtered

### CodeTransformer.ts (Babel Integration)

**Responsibilities:**
- Transform TypeScript to JavaScript
- Inject infinite loop protection
- Handle transformation errors
- Singleton plugin registration

**Key Methods:**
- `transform(source: string): string` - Transform code with Babel

**Implementation Details:**
- Uses `@babel/standalone` with TypeScript preset
- Integrates `@freecodecamp/loop-protect` as Babel plugin
- Static flag prevents plugin re-registration
- Configurable timeout (from settings)
- Throws descriptive errors on syntax issues

**Test Coverage:**
- TypeScript to JavaScript transformation
- Loop protection injection
- Syntax error handling
- Actual infinite loop detection and throwing

### IframeRenderer.ts (HTML Generator)

**Responsibilities:**
- Generate complete HTML documents from code blocks
- Use default template structure
- Handle empty content gracefully

**Interface:**
```typescript
interface RenderContent {
    html: string;
    css: string;
    js: string;
}
```

**Key Methods:**
- `generateDocument(content: RenderContent): string`

**Template Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>{CSS}</style>
</head>
<body>
  <main>{HTML}</main>
  <script>{JS}</script>
</body>
</html>
```

**Security Note:**
- Content is NOT sanitized (intentional - users execute their own code)
- Iframe provides isolation from main Obsidian window
- Blob URLs ensure content doesn't persist

**Test Coverage:**
- Complete HTML document generation
- Template structure validation
- Empty content handling

## Type Definitions

### src/types/babel-standalone.d.ts

**Purpose:** Provide TypeScript definitions for `@babel/standalone`

**Exports:**
- `transform(code: string, options: any): any`
- `registerPlugin(name: string, plugin: any): void`

### src/types/loop-protect.d.ts

**Purpose:** Provide TypeScript definitions for `@freecodecamp/loop-protect`

**Exports:**
- `default(timeout: number, callback: (line: number) => void): any`

## Build System

### build.js (Rolldown Build Script)

**Responsibilities:**
- Bundle source files using Rolldown
- Handle production vs development builds
- Manage watch mode for development
- Configure external dependencies

**Build Modes:**
- Production: `node build.js --production` (no sourcemap, optimized)
- Development: `node build.js` (inline sourcemap)
- Watch: `node build.js --watch` (auto-rebuild on changes)

**Configuration:**
- Input: `src/main.ts`
- Output: `main.js` (CommonJS format)
- External: obsidian, electron, codemirror modules, builtin-modules
- Sourcemap: inline for dev, false for production

### vitest.config.ts (Test Configuration)

**Responsibilities:**
- Configure Vitest test runner
- Set up jsdom environment for DOM testing
- Configure test file patterns
- Set up path aliases

**Configuration:**
- Environment: jsdom (for DOM APIs)
- Include: `src/**/*.test.ts`
- Exclude: node_modules, dist, build
- Globals: true (no need to import describe/it/expect)
- Alias: `@` → `./src`

## CI/CD

### .github/workflows/test.yml

**Jobs:**

**1. build**
- Checkout code
- Setup mise (Node 24, pnpm)
- Install dependencies
- Run build
- Run tests
- Run typecheck

**2. release (only on main/beta)**
- Checkout code
- Setup mise
- Install dependencies
- Run version-bump.js
- Build plugin
- Run semantic-release

**Triggers:**
- Push to main or beta branches
- Pull requests to main or beta
- Tags

### version-bump.js

**Purpose:** Sync version across package.json, manifest.json, and versions.json

**Process:**
1. Read version from package.json
2. Update manifest.json version
3. Update versions.json with new version → minAppVersion mapping
4. Only add to versions.json if minAppVersion has changed

### release.config.cjs (Semantic Release)

**Plugins:**
1. `@semantic-release/commit-analyzer` - Determine version bump
2. `@semantic-release/release-notes-generator` - Generate changelog
3. `@semantic-release/changelog` - Update CHANGELOG.md
4. `@semantic-release/npm` - Update package.json (no publish)
5. `@semantic-release/exec` - Run version-bump.js
6. `@semantic-release/git` - Commit version changes
7. `@semantic-release/github` - Create GitHub release with assets

**Release Assets:**
- main.js
- manifest.json
- versions.json

**Branches:**
- main - production releases
- beta - pre-releases

## File Structure

```
obsidian-web-dev-playground/
├── .github/
│   └── workflows/
│       └── test.yml                 # CI/CD pipeline
├── docs/
│   ├── journals/                    # Session documentation
│   ├── plans/                       # Implementation plans
│   ├── structure/                   # Architecture docs
│   └── SPEC.md                      # Technical specification
├── src/
│   ├── types/
│   │   ├── babel-standalone.d.ts    # Type definitions
│   │   └── loop-protect.d.ts        # Type definitions
│   ├── code-block-extractor.ts      # Core component
│   ├── code-block-extractor.test.ts # Tests
│   ├── code-transformer.ts          # Core component
│   ├── code-transformer.test.ts     # Tests
│   ├── iframe-renderer.ts           # Core component
│   ├── iframe-renderer.test.ts      # Tests
│   ├── main.ts                      # Plugin entry point
│   ├── playground-view.ts           # View component
│   ├── settings.ts                  # Settings interface
│   └── settings-tab.ts              # Settings UI
├── build.js                         # Build script (Rolldown)
├── vitest.config.ts                 # Test configuration
├── tsconfig.json                    # TypeScript config
├── manifest.json                    # Obsidian plugin manifest
├── versions.json                    # Version compatibility
├── version-bump.js                  # Version sync script
├── release.config.cjs               # Semantic-release config
├── mise.toml                        # Tool versions
├── package.json                     # Dependencies and scripts
├── pnpm-lock.yaml                   # Lock file
└── README.md                        # User documentation
```

## Key Design Patterns

### Reactive Settings Pattern

Settings changes take effect immediately without restarting views:
- Views store plugin reference, not settings copy
- Access `plugin.settings` dynamically
- CodeTransformer created fresh on each preview update

### Resource Cleanup Pattern

Prevent memory leaks with proper blob URL management:
- Store `currentBlobUrl` in view
- Revoke old URL before creating new one
- Revoke in `onClose()` for final cleanup

### Error Display Pattern

Show transformation errors to users without breaking UI:
- Catch transformation errors in try-catch
- Generate error HTML with IframeRenderer
- Display in same iframe (consistent UX)
- Log to console for developer debugging

### Singleton Plugin Registration

Prevent re-registration warnings:
- Static flag tracks if Babel plugin registered
- Register only once on first CodeTransformer instance
- Safe for multiple view instances

## Testing Strategy

### Unit Tests (14 tests)

**What We Test:**
- Core logic in isolation (Extractor, Transformer, Renderer)
- Edge cases (empty input, errors, cross-platform)
- Actual behavior, not mocks

**What We Don't Test:**
- Obsidian integration (requires complex mocking)
- Settings persistence (manual testing)
- UI interactions (manual testing)

### Manual Testing Checklist

- [ ] Install plugin in Obsidian test vault
- [ ] Create note with HTML/CSS/JS/TS blocks
- [ ] Verify live preview updates
- [ ] Test all three settings combinations
- [ ] Verify error handling with syntax errors
- [ ] Test infinite loop protection

## Performance Considerations

### Bundle Size
- main.js: ~4.6MB (Babel standalone contributes ~2-3MB)
- Acceptable for desktop Obsidian plugin
- Future optimization: Consider lighter TypeScript compiler

### Update Frequency
- Debounced to prevent excessive re-renders (default 500ms)
- Configurable range: 100-2000ms
- Alternative: Update on save only (manual control)

### Memory Management
- Blob URLs revoked immediately when no longer needed
- CodeTransformer recreated on each update (lightweight)
- Iframe replaced completely on each update (clean state)

## Future Enhancement Points

### Custom Templates
- Support user-defined HTML templates
- Use `<slot/>` marker for content injection (like Astro)
- Store template in settings or separate file

### Console Output Capture
- Intercept console.log/error/warn in iframe
- Display in preview pane or separate panel
- Useful for debugging user code

### Image Export
- Screenshot iframe contents
- Save as PNG to vault
- Useful for sharing/documenting

### External Library Support
- Allow CDN imports in settings
- Inject script tags before user code
- Support popular libraries (React, Vue, D3, etc.)
