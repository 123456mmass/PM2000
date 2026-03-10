const { ESLint } = require("eslint");

(async function main() {
    const eslint = new ESLint();
    const results = await eslint.lintFiles(["."]);

    let totalErrors = 0;
    for (const result of results) {
        const errors = result.messages.filter(m => m.severity === 2);
        if (errors.length > 0) {
            console.log(`\n${result.filePath}:`);
            for (const error of errors) {
                console.log(`  ${error.line}:${error.column} - ${error.message} (${error.ruleId})`);
                totalErrors++;
            }
        }
    }
    console.log(`\nTotal Errors: ${totalErrors}`);
})().catch(error => {
    process.exitCode = 1;
    console.error(error);
});
