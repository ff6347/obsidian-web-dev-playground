// ABOUTME: Plugin settings interface and default values
// ABOUTME: Manages debounce timeout and loop protection settings

export interface PlaygroundSettings {
	debounceTimeout: number;
	loopProtectionTimeout: number;
}

export const DEFAULT_SETTINGS: PlaygroundSettings = {
	debounceTimeout: 500,
	loopProtectionTimeout: 100,
};
