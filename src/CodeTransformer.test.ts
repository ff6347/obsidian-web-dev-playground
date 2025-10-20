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

        expect(result).toContain('Date.now()');
        expect(result).toContain('Infinite loop detected');
    });

    it('throws on syntax error', () => {
        const transformer = new CodeTransformer(100);
        const badCode = 'const x = {';

        expect(() => transformer.transform(badCode)).toThrow();
    });
});
