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
- Updates on typing with debounced updates
- Default template injects user code into structured HTML document
- Uses iframe with blob URL for isolation

### Code Transformation

- TypeScript → JavaScript via Babel
- Infinite loop protection via `@freecodecamp/loop-protect`
- Syntax errors displayed in preview

### Settings

- Debounce timeout (100-2000ms, default 500ms)
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
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<style>
			{USER_CSS}
		</style>
	</head>
	<body>
		<main>{USER_HTML}</main>
		<script>
			{
				TRANSFORMED_JS;
			}
		</script>
	</body>
</html>
```

## Future Considerations

- Custom HTML templates with `<slot/>` markers
- Image export (screenshot of preview)
- External library imports
- Console output capture
