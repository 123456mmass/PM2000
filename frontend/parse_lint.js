const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint_json.json', 'utf8'));
let totalErrors = 0;
data.forEach(file => {
    const errors = file.messages.filter(m => m.severity === 2);
    if (errors.length > 0) {
        console.log(`\n${file.filePath}:`);
        errors.forEach(e => {
            console.log(`  ${e.line}:${e.column} ${e.message} (${e.ruleId})`);
            totalErrors++;
        });
    }
});
console.log(`\nTotal Errors: ${totalErrors}`);
