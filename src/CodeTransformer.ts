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
                filename: 'code.ts',
                presets: ['typescript'],
                plugins: ['loopProtect'],
            });
            return result.code || '';
        } catch (error) {
            throw new Error(`Transformation failed: ${error}`);
        }
    }
}
