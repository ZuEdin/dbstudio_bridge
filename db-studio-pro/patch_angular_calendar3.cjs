const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'utils/generators/angular/components/custom/customComponentNode.ts');
let content = fs.readFileSync(filePath, 'utf8');

const pattern = "const events = this.${stateName}.map((row: any) => ({";
const startIdx = content.indexOf(pattern);
if (startIdx === -1) {
    console.error("Angular pattern not found!");
    process.exit(1);
}

const endPattern = "this.calendarOptions_${suffix} = { ...this.calendarOptions_${suffix}, events };";
const endIdx = content.indexOf(endPattern, startIdx);
if (endIdx === -1) {
    console.error("Angular end pattern not found!");
    process.exit(1);
}

const originalPart = content.substring(startIdx, endIdx + endPattern.length);
console.log("Found original Angular part:\n", originalPart);

const replacement = `const combineDateTime = (dateVal: any, timeVal: any) => {
            if (!dateVal) return undefined;
            if (!timeVal) return dateVal;
            let dateStr = '';
            if (typeof dateVal === 'string') {
                dateStr = dateVal.split('T')[0].split(' ')[0];
            } else if (dateVal instanceof Date) {
                dateStr = dateVal.toISOString().split('T')[0];
            } else {
                dateStr = String(dateVal).split(' ')[0];
            }
            let timeStr = String(timeVal);
            const match = timeStr.match(/(\\d{1,2}):(\\d{2})(?::(\\d{2}))?/);
            if (match) {
                const h = match[1].padStart(2, '0');
                const m = match[2].padStart(2, '0');
                const s = match[3] ? match[3].padStart(2, '0') : '00';
                return dateStr + 'T' + h + ':' + m + ':' + s;
            }
            return dateStr;
        };

        const events = this.\${stateName}.map((row: any) => {
            const startVal = row['\${startField}'];
            const startTimeVal = '\${conf.startTimeField || ""}' ? row['\${conf.startTimeField || ""}'] : undefined;
            const endVal = '\${conf.endDateField || ""}' ? row['\${conf.endDateField || ""}'] : startVal;
            const endTimeVal = '\${conf.endTimeField || ""}' ? row['\${conf.endTimeField || ""}'] : undefined;

            return {
                title: row['\${titleField}'] || 'Termin',
                start: combineDateTime(startVal, startTimeVal),
                end: combineDateTime(endVal, endTimeVal),
                color: '\${colorField}' ? row['\${colorField}'] : undefined,
                extendedProps: { ...row }
            };
        });
        this.calendarOptions_\${suffix} = { ...this.calendarOptions_\${suffix}, events };`;

const updatedContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + endPattern.length);
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log("Successfully patched Angular calendar generator!");
