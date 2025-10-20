// ABOUTME: Main entry point for the Obsidian Web Dev Playground plugin
// ABOUTME: Registers the playground view and commands
import { Plugin } from "obsidian";

export default class WebDevPlaygroundPlugin extends Plugin {
  override async onload() {
    console.log("Loading Web Dev Playground plugin");
  }

  override async onunload() {
    console.log("Unloading Web Dev Playground plugin");
  }
}
