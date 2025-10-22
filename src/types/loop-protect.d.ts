// ABOUTME: Type declarations for @freecodecamp/loop-protect package
// ABOUTME: Provides minimal types for loop protection functionality
declare module "@freecodecamp/loop-protect" {
	export default function loopProtect(
		timeout: number,
		callback: (line: number) => void,
	): unknown;
}
