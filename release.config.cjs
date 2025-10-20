module.exports = {
	extends: "@technologiestiftung/semantic-release-config",
	branches: [{ name: "main" }, { name: "beta", prerelease: true }],
	plugins: [
		"@semantic-release/commit-analyzer",
		"@semantic-release/release-notes-generator",
		"@semantic-release/changelog",
		[
			"@semantic-release/npm",
			{
				npmPublish: false,
			},
		],
		[
			"@semantic-release/exec",
			{
				prepareCmd: "node version-bump.js",
			},
		],
		[
			"@semantic-release/git",
			{
				assets: [
					"package.json",
					"package-lock.json",
					"CHANGELOG.md",
					"manifest.json",
					"versions.json",
				],
				message: "chore(release): ${nextRelease.version} [skip ci]",
			},
		],
		[
			"@semantic-release/github",
			{
				assets: ["main.js", "manifest.json", "versions.json"],
			},
		],
	],
};
