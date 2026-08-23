
import { Table, FormElement, Form } from '../../../types/index';
import { toCamelCase, toPascalCase } from '../common';

// Helper: Collect all lookup configurations from the layout tree
export const collectLookups = (element: FormElement, tables: Table[], accumulated: any[] = []) => {
    if (element.widgetType === 'select' && element.lookup && element.lookup.tableId) {
        const table = tables.find(t => t.id === element.lookup!.tableId);
        if (table) {
            const variableName = `${toCamelCase(table.name)}List`;
            // Avoid duplicates
            if (!accumulated.find(l => l.variableName === variableName)) {
                accumulated.push({
                    table,
                    variableName,
                    endpoint: table.name.toLowerCase()
                });
            }
        }
    }
    if (element.children) {
        element.children.forEach(child => collectLookups(child, tables, accumulated));
    }
    return accumulated;
};

// Helper: Recursive JSX Generation for Layouts
export const generateJsxForLayout = (element: FormElement, tables: Table[], dataVar: string = 'data'): string => {
    if (element.type === 'container') {
        const childrenJsx = element.children?.map(c => generateJsxForLayout(c, tables, dataVar)).join('\n') || '';
        let className = element.className || '';
        return `<div className="${className}">\n${childrenJsx}\n</div>`;
    } 
    else if (element.type === 'label') {
        return `<div className="${element.className || 'text-lg font-bold mb-2'}">${element.label}</div>`;
    } 
    else if (element.type === 'field' && element.fieldId) {
        let fieldName = '';
        let fieldType = 'text';
        let isAuto = false;
        let isNumeric = false;
        
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) {
                fieldName = f.name;
                isAuto = !!f.isAutoIncrement;
                if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') {
                    fieldType = 'number';
                    isNumeric = true;
                }
                else if (f.type === 'DATE') fieldType = 'date';
                else if (f.type === 'TIME') fieldType = 'time';
                else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') fieldType = 'datetime-local';
                else if (f.type === 'BOOLEAN') fieldType = 'checkbox';
                break;
            }
        }

        if (!fieldName) return `{/* Field ${element.label} not found */}`;
        const bindProp = toCamelCase(fieldName);
        const className = element.className || 'mb-4';

        if (element.widgetType === 'select' && element.lookup) {
            const lookupTable = tables.find(t => t.id === element.lookup!.tableId);
            if (lookupTable) {
                const listVar = `${toCamelCase(lookupTable.name)}List`;
                const valueField = lookupTable.fields.find(f => f.id === element.lookup!.valueFieldId);
                const valueProp = valueField ? toCamelCase(valueField.name) : 'id';
                let labelExpr = `item.${valueProp}`;
                const valueCaster = isNumeric ? 'Number(e.target.value)' : 'e.target.value';

                return `
                <div className="${className}">
                    <label className="block text-sm font-medium text-gray-700 mb-1">${element.label}</label>
                    <select
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={${dataVar}.${bindProp} || ''}
                        disabled={${isAuto}}
                        onChange={e => setData({...${dataVar}, ${bindProp}: ${valueCaster}})}
                    >
                        <option value="">Bitte wählen...</option>
                        {${listVar}.map(item => <option key={item.${valueProp}} value={item.${valueProp}}>{${labelExpr}}</option>)}
                    </select>
                </div>`;
            }
        }

        const onChangeLogic = isNumeric 
            ? `onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value === '' ? undefined : Number(e.target.value)})}`
            : `onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})}`;

        return `
        <div className="${className}">
            <label className="block text-sm font-medium text-gray-700 mb-1">${element.label}</label>
            <input type="${fieldType}" className="w-full border p-2 rounded" value={${dataVar}.${bindProp} !== undefined ? ${dataVar}.${bindProp} : ''} ${onChangeLogic} />
        </div>`;
    }
    return '';
};
