// ABOUTME: Type declarations for @babel/standalone package
// ABOUTME: Provides minimal types for Babel's transform function and plugin registration
declare module "@babel/standalone" {
	export function transform(
		code: string,
		options: {
			presets: string[];
			filename?: string;
			plugins?: string[];
		},
	): {
		code: string | null;
	};

	export function registerPlugin(name: string, plugin: unknown): void;
}
