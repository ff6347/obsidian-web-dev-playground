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
