const { readdirSync, statSync } = require("fs");
const { join, relative } = require("path");
const { spawnSync } = require("child_process");

const projectRoot = join(__dirname, "..");
const ignoredDirectories = new Set([
    ".git",
    ".agents",
    "node_modules"
]);

const getJavaScriptFiles = (directory) => {

    const files = [];

    for (const entry of readdirSync(directory)) {

        if (ignoredDirectories.has(entry)) {
            continue;
        }

        const fullPath = join(directory, entry);
        const stats = statSync(fullPath);

        if (stats.isDirectory()) {
            files.push(...getJavaScriptFiles(fullPath));
            continue;
        }

        if (entry.endsWith(".js")) {
            files.push(fullPath);
        }

    }

    return files;

};

const javascriptFiles = getJavaScriptFiles(projectRoot);

for (const file of javascriptFiles) {

    const result = spawnSync(
        process.execPath,
        ["--check", file],
        { stdio: "inherit" }
    );

    if (result.status !== 0) {
        process.exit(result.status || 1);
    }

}

console.log(
    `Checked ${javascriptFiles.length} JavaScript files.`
);
