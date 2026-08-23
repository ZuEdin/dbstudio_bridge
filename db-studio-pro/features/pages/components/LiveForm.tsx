import React, { useContext } from 'react';
import { PageComponent } from '../../../types/index';
import { useProjectStore } from '../../../stores/useProjectStore';
import { FormView } from '../../forms/FormView';
import { 
    PageParamsContext, 
    getNestedValueCaseInsensitive 
} from '../utils/pageViewUtils';

interface LiveFormProps {
    node: PageComponent;
    context?: Record<string, any>;
}

export const LiveForm: React.FC<LiveFormProps> = ({ node, context }) => {
    const { forms, tables, updateTable } = useProjectStore();
    const { params } = useContext(PageParamsContext);

    const formToRender = forms.find(f => f.id === node.props.formId);
    if (!formToRender) {
        return <div className="p-4 text-xs text-slate-500 italic bg-slate-50 border border-dashed rounded">Kein Formular ausgewählt</div>;
    }

    // Handle filtering and pre-filling
    let formFilteredData: any[] = [];
    let hasFilter = false;
    
    // Inject all params as default values, just like in modal forms
    let defaultValues: any = {
        ...Object.keys(params).reduce((acc, key) => {
            const val = params[key];
            acc[key] = (val !== null && val !== '' && !isNaN(Number(val))) ? Number(val) : val;
            return acc;
        }, {} as any)
    };

    if (node.props.navigateTargetParams && Array.isArray(node.props.navigateTargetParams)) {
        node.props.navigateTargetParams.forEach((m: any) => {
            let val: any;
            const sourceVal = context ? getNestedValueCaseInsensitive(context, m.sourceKey) : undefined;
            if (sourceVal !== undefined) {
                val = sourceVal;
            } else if (params[m.sourceKey] !== undefined) {
                val = params[m.sourceKey];
            } else {
                val = m.sourceKey;
            }
            if (val !== undefined && val !== '') {
                defaultValues[m.targetKey] = (val !== null && !isNaN(Number(val))) ? Number(val) : val;
            }
        });
    }

    if (node.props.filterParamField && node.props.filterParamName) {
        const filterField = node.props.filterParamField;
        const filterVal = params[node.props.filterParamName];
        
        // Always set default value for pre-filling if available
        if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
            defaultValues[filterField] = isNaN(Number(filterVal)) ? filterVal : Number(filterVal);
        }

        if (node.props.formMode !== 'create') {
            hasFilter = true;
            const targetTable = tables.find(t => t.id === formToRender.sourceId);
            if (targetTable && targetTable.data && filterVal !== undefined && filterVal !== null && filterVal !== '') {
                formFilteredData = targetTable.data.filter(row => String(getNestedValueCaseInsensitive(row, filterField) ?? '') === String(filterVal));
            }
        }
    }

    return (
        <div className={`w-full ${node.props.className || ''}`} style={node.props.style}>
            <FormView 
                form={formToRender}
                allForms={forms}
                allTables={tables}
                onTableChange={updateTable}
                showConfirmation={(title, message, onConfirm) => {
                    if (window.confirm(`${title}\n${message}`)) onConfirm();
                }}
                isSubform={hasFilter} 
                filteredData={formFilteredData}
                defaultValues={defaultValues}
                initialMode={node.props.formMode || 'edit'}
                hideNavigation={node.props.hideNavigation}
                hideActions={node.props.hideActions}
                hideHeader={node.props.hideHeader}
                embedded={true}
            />
        </div>
    );
};
