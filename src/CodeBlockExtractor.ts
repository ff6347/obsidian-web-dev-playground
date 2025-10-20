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

        const codeBlockRegex = /```(\w+)[\r\n]+([\s\S]*?)```/g;
        let match;

        while ((match = codeBlockRegex.exec(this.markdown)) !== null) {
            const lang = match[1]?.toLowerCase();
            const code = match[2]?.trim();

            if (!lang || !code) continue;

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
