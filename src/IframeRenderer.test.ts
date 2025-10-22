import { describe, it, expect } from "vitest";
import { IframeRenderer } from "./IframeRenderer.js";

describe("IframeRenderer", () => {
	it("generates complete HTML document", () => {
		const renderer = new IframeRenderer();
		const html = renderer.generateDocument({
			html: "<h1>Test</h1>",
			css: "h1 { color: red; }",
			js: 'console.log("hi");',
		});

		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("<h1>Test</h1>");
		expect(html).toContain("h1 { color: red; }");
		expect(html).toContain('console.log("hi");');
	});

	it("injects content into template structure", () => {
		const renderer = new IframeRenderer();
		const html = renderer.generateDocument({
			html: "<p>Content</p>",
			css: "",
			js: "",
		});

		expect(html).toContain("<main>");
		expect(html).toContain("</main>");
		expect(html).toContain("<p>Content</p>");
	});

	it("handles empty content", () => {
		const renderer = new IframeRenderer();
		const html = renderer.generateDocument({
			html: "",
			css: "",
			js: "",
		});

		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("<main>");
	});
});
