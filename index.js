const fs = require('fs-extra');
const pug = require('pug');
const chokidar = require('chokidar');
const glob = require('glob');

const watchForChangeInstances = {};

/**
 * Renders single pug file to HTML
 */
const renderPugFile = async ({ filePath, outputPath, watchForDependencyChanges = false }) => {
    console.log(1671094791716, `rendered ${filePath} to ${outputPath}`);

    const fn = pug.compileFile(filePath);
    const compiledHTML = fn();

    fs.outputFileSync(outputPath, compiledHTML);

    if (watchForDependencyChanges === true) {
        const pugFileDependencies = fn.dependencies;

        pugFileDependencies.forEach((fileDependency) => {
            if (Array.isArray(watchForChangeInstances[filePath]) === false) {
                watchForChangeInstances[filePath] = [];
            }

            const isDependencyAlreadyBeingWatched =
                watchForChangeInstances[filePath].includes(fileDependency);
            if (isDependencyAlreadyBeingWatched === true) {
                console.log(1670357098632, 'skipped watch');
                return;
            }

            chokidar.watch(fileDependency).on('change', () => {
                renderPugFile({
                    filePath,
                    outputPath,
                    watchForDependencyChanges,
                });
            });
        });
    }
};

/**
 * Render all pug files in a directory to HTML
 */
const renderPugFiles = async ({ inputDirectory, outputDirectory }) =>
    new Promise((resolve) => {
        const tasks = [];

        glob(`${inputDirectory}/**/*.pug`, (error, files) => {
            if (error) console.error(error);

            files.forEach(async (file) => {
                const computedOutputPath = file
                    .replace(inputDirectory, outputDirectory)
                    .replace('.pug', '.html');

                tasks.push(
                    renderPugFile({
                        filePath: file,
                        outputPath: computedOutputPath,
                        watchForDependencyChanges: false,
                    }),
                );
            });
        });

        Promise.all(tasks).then(resolve);
    });

module.exports = {
    renderPugFiles,
}
