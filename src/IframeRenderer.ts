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
