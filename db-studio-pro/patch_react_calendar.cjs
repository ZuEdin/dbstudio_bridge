const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'utils/generators/react/pages/custom/customComponentNodeGenerator.ts');
let content = fs.readFileSync(filePath, 'utf8');

// We find the start index of the pattern
const pattern = "const events = (${stateName} || []).map((row: any) => ({";
const startIdx = content.indexOf(pattern);
if (startIdx === -1) {
    console.error("Pattern not found!");
    process.exit(1);
}

// We find the closing })); after that
const endIdx = content.indexOf("}));", startIdx);
if (endIdx === -1) {
    console.error("Closing pattern not found!");
    process.exit(1);
}

const originalPart = content.substring(startIdx, endIdx + 4);
console.log("Found original part:\n", originalPart);

const replacement = `const combineDateTime = (dateVal: any, timeVal: any) => {
							if (!dateVal) return new Date();
							if (!timeVal) return new Date(dateVal);
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
								return new Date(dateStr + 'T' + h + ':' + m + ':' + s);
							}
							return new Date(dateStr);
						};

						const events = (\${stateName} || []).map((row: any) => {
							const startVal = row['\${startField}'];
							const startTimeVal = '\${conf.startTimeField || ""}' ? row['\${conf.startTimeField || ""}'] : undefined;
							const endVal = '\${conf.endDateField || ""}' ? row['\${conf.endDateField || ""}'] : startVal;
							const endTimeVal = '\${conf.endTimeField || ""}' ? row['\${conf.endTimeField || ""}'] : undefined;

							return {
								title: row['\${titleField}'] || 'Termin',
								start: combineDateTime(startVal, startTimeVal),
								end: combineDateTime(endVal, endTimeVal),
								resource: row,
								color: '\${colorField}' ? row['\${colorField}'] : undefined
							};
						});`;

const updatedContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + 4);
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log("Successfully patched React calendar generator!");
