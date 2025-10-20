// ABOUTME: Plugin settings interface and default values
// ABOUTME: Manages debounce timeout, update mode, and loop protection settings

export interface PlaygroundSettings {
    debounceTimeout: number;
    updateOnSaveOnly: boolean;
    loopProtectionTimeout: number;
}

export const DEFAULT_SETTINGS: PlaygroundSettings = {
    debounceTimeout: 500,
    updateOnSaveOnly: false,
    loopProtectionTimeout: 100,
};
