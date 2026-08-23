import React, { useState, useEffect } from 'react';
import { Form, Table, Query, FormValidationRule, FormElement } from '../../../types/index';
import { evaluateFormFormula } from '../../../utils/formulaEvaluator';
import { generateNextSequenceValue } from '../../../utils/sequenceHelper';
import { logAuditTrail } from '../../../utils/auditTrail';
import { useProjectStore } from '../../../stores/useProjectStore';

interface UseFormViewStateProps {
  form: Form;
  allForms: Form[];
  allTables: Table[];
  queries?: Query[];
  executeQuery?: (q: Query, context?: any) => Record<string, any>[];
  onTableChange: (table: Table) => void;
  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    confirmClass?: string
  ) => void;
  isSubform?: boolean;
  filteredData?: Record<string, any>[];
  parentRecord?: Record<string, any>;
  linkConfig?: { masterFieldId: string; childFieldId: string };
  subformPermissions?: { canAdd?: boolean; canEdit?: boolean; canDelete?: boolean };
  initialMode?: 'create' | 'edit' | 'view';
  hideNavigation?: boolean;
  defaultValues?: Record<string, any>;
  formActionTrigger?: { action: string; timestamp: number };
}

export const useFormViewState = ({
  form,
  allForms,
  allTables,
  queries,
  executeQuery,
  onTableChange,
  showConfirmation,
  isSubform,
  filteredData,
  parentRecord,
  linkConfig,
  subformPermissions,
  initialMode,
  hideNavigation,
  defaultValues,
  formActionTrigger,
}: UseFormViewStateProps) => {
  const { relationships, updateTable } = useProjectStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [tempRecord, setTempRecord] = useState<Record<string, any>>({});

  // MS Access Filter & Sorting States
  const [activeSort, setActiveSort] = useState<{ fieldName: string; direction: 'asc' | 'desc' } | null>(null);
  const [activeFilters, setActiveFilters] = useState<
    {
      fieldName: string;
      value: any;
      operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'between';
    }[]
  >([]);
  const [filterEnabled, setFilterEnabled] = useState<boolean>(true);
  const [globalSearchText, setGlobalSearchText] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fieldName: string; value: any } | null>(null);
  const [focusedFieldName, setFocusedFieldName] = useState<string | null>(null);

  // Advanced Filter Modal state
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);
  const [showCascadeDeleteModal, setShowCascadeDeleteModal] = useState<boolean>(false);

  // Modals state
  const [lookupModal, setLookupModal] = useState<{
    isOpen: boolean;
    targetTableId: string;
    sourceFieldName: string;
    formId?: string;
  } | null>(null);
  const [subformModal, setSubformModal] = useState<{
    isOpen: boolean;
    formId: string;
    parentField: string;
    childField: string;
    linkValue: any;
    recordToEdit?: Record<string, any>;
  } | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  const sourceTable = allTables.find((t) => t.id === form.sourceId);
  const isUnbound = !form.sourceId || form.sourceId === '';
  const isReadOnly =
    (form.mode as any) === 'readonly' ||
    (initialMode as any) === 'readonly' ||
    form.sourceType === 'query' ||
    (!sourceTable && !isUnbound) ||
    (isSubform && subformPermissions?.canEdit === false);
  const finalHideNavigation = hideNavigation || (form.settings as any)?.hideNavigation;

  const data = isSubform ? filteredData || [] : sourceTable?.data || [];

  // Compute processed data (applying filter, global search, and sorting)
  let processedData = [...data];

  if (filterEnabled && activeFilters.length > 0) {
    activeFilters.forEach((filter) => {
      processedData = processedData.filter((row) => {
        const val = row[filter.fieldName];
        const strVal = String(val ?? '').toLowerCase();
        const strTarget = String(filter.value ?? '').toLowerCase();

        if (filter.operator === 'equals') {
          return String(val ?? '') === String(filter.value ?? '');
        } else if (filter.operator === 'not_equals') {
          return String(val ?? '') !== String(filter.value ?? '');
        } else if (filter.operator === 'contains') {
          return strVal.includes(strTarget);
        } else if (filter.operator === 'starts_with') {
          return strVal.startsWith(strTarget);
        } else if (filter.operator === 'greater_than') {
          const numVal = Number(val);
          const numTarget = Number(filter.value);
          if (!isNaN(numVal) && !isNaN(numTarget)) return numVal > numTarget;
          return strVal > strTarget;
        } else if (filter.operator === 'less_than') {
          const numVal = Number(val);
          const numTarget = Number(filter.value);
          if (!isNaN(numVal) && !isNaN(numTarget)) return numVal < numTarget;
          return strVal < strTarget;
        } else if (filter.operator === 'between') {
          const minVal = typeof filter.value === 'object' ? filter.value?.min : filter.value;
          const maxVal = typeof filter.value === 'object' ? filter.value?.max : '';
          const numVal = Number(val);
          const numMin = Number(minVal);
          const numMax = Number(maxVal);
          if (!isNaN(numVal) && !isNaN(numMin) && !isNaN(numMax)) {
            return numVal >= numMin && numVal <= numMax;
          }
          return strVal >= String(minVal ?? '').toLowerCase() && strVal <= String(maxVal ?? '').toLowerCase();
        }
        return true;
      });
    });
  }

  if (globalSearchText.trim() !== '') {
    const searchLower = globalSearchText.toLowerCase();
    processedData = processedData.filter((row) => {
      return Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(searchLower));
    });
  }

  if (activeSort) {
    processedData.sort((a, b) => {
      const valA = a[activeSort.fieldName];
      const valB = b[activeSort.fieldName];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return activeSort.direction === 'asc' ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      const order = activeSort.direction === 'asc' ? 1 : -1;
      return strA > strB ? order : -order;
    });
  }

  const currentRecord = isCreating || isUnbound ? tempRecord : processedData[currentIndex] || {};

  useEffect(() => {
    if (!isCreating && !isUnbound) {
      if (currentIndex >= processedData.length && processedData.length > 0) {
        setCurrentIndex(processedData.length - 1);
      } else if (processedData.length === 0) {
        setCurrentIndex(0);
      }
    }
  }, [processedData.length, isCreating, isUnbound, currentIndex]);

  useEffect(() => {
    if (!formActionTrigger || isUnbound) return;
    const { action } = formActionTrigger;
    switch (action) {
      case 'form_new_record':
        if (!isReadOnly) startCreate();
        break;
      case 'form_save_record':
        if (!isReadOnly) {
          if (isCreating) {
            saveNewRecord();
          } else {
            if (sourceTable) onTableChange(sourceTable);
          }
        }
        break;
      case 'form_delete_record':
        if (!isReadOnly && !isCreating) {
          const rels = relationships.filter((r) => r.fromTableId === sourceTable?.id);
          if (rels.length > 0) {
            setShowCascadeDeleteModal(true);
          } else {
            deleteCurrentRecord();
          }
        }
        break;
      case 'form_delete_cascade':
        if (!isReadOnly && !isCreating && sourceTable) {
          setShowCascadeDeleteModal(true);
        }
        break;
      case 'form_sort_asc': {
        const targetField = focusedFieldName
          ? sourceTable?.fields.find((f) => f.name === focusedFieldName)
          : sourceTable?.fields.find((f) => f.type === 'VARCHAR') || sourceTable?.fields[0];
        if (targetField) {
          setActiveSort({ fieldName: targetField.name, direction: 'asc' });
        }
        break;
      }
      case 'form_sort_desc': {
        const targetField = focusedFieldName
          ? sourceTable?.fields.find((f) => f.name === focusedFieldName)
          : sourceTable?.fields.find((f) => f.type === 'VARCHAR') || sourceTable?.fields[0];
        if (targetField) {
          setActiveSort({ fieldName: targetField.name, direction: 'desc' });
        }
        break;
      }
      case 'form_clear_sort':
        setActiveSort(null);
        break;
      case 'form_toggle_filter':
        if (activeFilters.length > 0) {
          setFilterEnabled((prev) => !prev);
        } else {
          setFilterModalOpen(true);
        }
        break;
      case 'form_filter_selection': {
        const targetName = focusedFieldName || sourceTable?.fields[0]?.name;
        if (
          targetName &&
          currentRecord &&
          currentRecord[targetName] !== undefined &&
          currentRecord[targetName] !== null
        ) {
          const val = currentRecord[targetName];
          setActiveFilters((prev) => [
            ...prev.filter((f) => f.fieldName !== targetName),
            { fieldName: targetName, value: val, operator: 'equals' },
          ]);
          setFilterEnabled(true);
        } else {
          setFilterModalOpen(true);
        }
        break;
      }
      case 'form_filter_advanced':
        setFilterModalOpen(true);
        break;
      case 'form_refresh':
        setGlobalSearchText('');
        setActiveSort(null);
        setActiveFilters([]);
        setFilterEnabled(true);
        setCurrentIndex(0);
        break;
    }
  }, [formActionTrigger]);

  const handleContextMenu = (e: React.MouseEvent, fieldName: string, val: any) => {
    e.preventDefault();
    setFocusedFieldName(fieldName);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      fieldName,
      value: val,
    });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const recalculateCalculatedFields = (record: Record<string, any>): Record<string, any> => {
    if (!form.layout) return record;

    const updatedRecord = { ...record };

    const walkAndCalculate = (el: any) => {
      if (!el) return;
      if ((el.widgetType === 'calculated' || el.isCalculated) && el.calculationFormula && el.fieldId) {
        const targetName = getFieldName(el.fieldId);
        if (targetName) {
          const calculatedVal = evaluateFormFormula(el.calculationFormula, updatedRecord);
          updatedRecord[targetName] = calculatedVal;
        }
      }
      if (Array.isArray(el.children)) {
        el.children.forEach(walkAndCalculate);
      }
    };

    walkAndCalculate(form.layout);
    return updatedRecord;
  };

  const handleInputChange = (fieldName: string, value: any) => {
    if (isReadOnly) return;

    if (isCreating || isUnbound) {
      setTempRecord((prev) => {
        const nextRec = { ...prev, [fieldName]: value };
        return recalculateCalculatedFields(nextRec);
      });
      return;
    }

    if (!sourceTable) return;

    let originalIndex = -1;
    if (isSubform && currentRecord) {
      const pkField = sourceTable.fields.find((f) => f.isPrimaryKey) || sourceTable.fields.find((f) => f.name.toLowerCase() === 'id');
      if (pkField && currentRecord[pkField.name] !== undefined) {
        originalIndex = sourceTable.data?.findIndex((row) => String(row[pkField.name]) === String(currentRecord[pkField.name])) ?? -1;
      }
      if (originalIndex === -1) {
        originalIndex = sourceTable.data?.findIndex((row) => row === currentRecord) ?? -1;
      }
      if (originalIndex === -1) {
        originalIndex = sourceTable.data?.findIndex((row) => JSON.stringify(row) === JSON.stringify(currentRecord)) ?? -1;
      }
    } else {
      originalIndex = currentIndex;
    }

    if (originalIndex === undefined || originalIndex === -1) return;

    const newData = [...sourceTable.data!];
    const nextRec = recalculateCalculatedFields({ ...newData[originalIndex], [fieldName]: value });
    newData[originalIndex] = nextRec;
    onTableChange({ ...sourceTable, data: newData });
  };

  const getFieldName = (fieldId: string) => {
    for (const t of allTables) {
      const f = t.fields.find((field) => field.id === fieldId);
      if (f) return f.name;
    }
    return '';
  };

  const prepareNewRecord = (table: Table, masterFieldId?: string, childFieldId?: string, parentVal?: any) => {
    const initialData = table.fields.reduce((acc, field) => {
      if (field.sequenceConfig?.enabled) {
        acc[field.name] = generateNextSequenceValue(field, table.data || []);
      } else if (field.defaultValue !== undefined && field.defaultValue !== '') {
        if (field.type === 'BOOLEAN') {
          acc[field.name] = field.defaultValue === 'true';
        } else if (
          (field.type === 'DATE' ||
            field.type === 'TIME' ||
            field.type === 'DATETIME' ||
            field.type === 'TIMESTAMP') &&
          (field.defaultValue.toUpperCase() === 'NOW' ||
            field.defaultValue.toLowerCase() === 'now()' ||
            field.defaultValue.toUpperCase() === 'CURRENT_TIMESTAMP' ||
            field.defaultValue.toLowerCase() === 'current_timestamp()')
        ) {
          acc[field.name] = new Date().toISOString();
        } else {
          acc[field.name] = field.defaultValue;
        }
      } else {
        acc[field.name] = '';
      }
      return acc;
    }, {} as Record<string, any>);

    if (masterFieldId && childFieldId && parentVal !== undefined) {
      const childFieldName = table.fields.find((f) => f.id === childFieldId)?.name;
      if (childFieldName) {
        initialData[childFieldName] = parentVal;
      }
    }
    return initialData;
  };

  const startCreate = () => {
    if (isReadOnly || !sourceTable) return;
    if (isSubform && subformPermissions?.canAdd === false) return;

    let initialData = prepareNewRecord(sourceTable);

    if (parentRecord && linkConfig) {
      const masterFieldName = getFieldName(linkConfig.masterFieldId);
      if (masterFieldName && parentRecord[masterFieldName] !== undefined) {
        initialData = prepareNewRecord(
          sourceTable,
          linkConfig.masterFieldId,
          linkConfig.childFieldId,
          parentRecord[masterFieldName]
        );
      }
    }

    if (defaultValues) {
      initialData = { ...initialData, ...defaultValues };
    }

    setTempRecord(initialData);
    setIsCreating(true);
  };

  const validateRecord = (record: Record<string, any>): boolean => {
    setValidationError(null);
    if (!sourceTable) return true;

    for (const field of sourceTable.fields) {
      if (!field.allowNull && !field.isAutoIncrement && !field.sequenceConfig?.enabled && field.type !== 'BOOLEAN') {
        const val = record[field.name];
        if (val === undefined || val === null || String(val).trim() === '') {
          setValidationError(`Pflichtfeld-Fehler: '${field.name}' darf nicht leer sein.`);
          return false;
        }
      }
    }

    if (form.validationRules || form.layout) {
      // Gather validation rules from both form-level and recursive element-level
      const allRules: FormValidationRule[] = [...(form.validationRules || [])];
      
      const collectElementRules = (el?: FormElement) => {
        if (!el) return;
        if (el.validationRules && el.validationRules.length > 0) {
          allRules.push(...el.validationRules);
        }
        if (el.children) {
          el.children.forEach(collectElementRules);
        }
      };
      collectElementRules(form.layout);

      for (const rule of allRules) {
        const fieldName = getFieldName(rule.fieldId);
        const val = record[fieldName];

        if (rule.type === 'required' && (val === undefined || val === null || String(val).trim() === '')) {
          setValidationError(rule.errorMessage || `Feld '${fieldName}' ist erforderlich.`);
          return false;
        }

        if (rule.type === 'regex' && rule.regexPattern && val) {
          try {
            const re = new RegExp(rule.regexPattern);
            if (!re.test(String(val))) {
              setValidationError(rule.errorMessage || `Feld '${fieldName}' entspricht nicht dem erforderlichen Muster.`);
              return false;
            }
          } catch (e) {
            console.error('Invalid Regex in validation rule', e);
          }
        }

        if (rule.type === 'min' && rule.minValue !== undefined && val !== undefined && val !== null && String(val).trim() !== '') {
          if (Number(val) < rule.minValue) {
            setValidationError(rule.errorMessage || `Feld '${fieldName}' muss mindestens ${rule.minValue} sein.`);
            return false;
          }
        }

        if (rule.type === 'max' && rule.maxValue !== undefined && val !== undefined && val !== null && String(val).trim() !== '') {
          if (Number(val) > rule.maxValue) {
            setValidationError(rule.errorMessage || `Feld '${fieldName}' darf höchstens ${rule.maxValue} sein.`);
            return false;
          }
        }

        if (rule.type === 'custom_js' && rule.customJsCode) {
          try {
            const evalFn = new Function('record', 'value', 'fieldName', rule.customJsCode);
            const isValid = evalFn(record, val, fieldName);
            if (isValid === false) {
              setValidationError(rule.errorMessage || `Validierung für Feld '${fieldName}' fehlgeschlagen.`);
              return false;
            }
          } catch (e) {
            console.error('Error executing custom JS validation rule', e);
          }
        }
      }
    }

    return true;
  };

  const saveNewRecord = () => {
    if (!sourceTable) return;
    const recordToSave = { ...tempRecord };

    if (parentRecord && linkConfig) {
      const masterFieldName = getFieldName(linkConfig.masterFieldId);
      const childFieldName = sourceTable.fields.find((f) => f.id === linkConfig.childFieldId)?.name;
      if (masterFieldName && childFieldName && parentRecord[masterFieldName] !== undefined) {
        if (recordToSave[childFieldName] === undefined || recordToSave[childFieldName] === '') {
          recordToSave[childFieldName] = parentRecord[masterFieldName];
        }
      }
    }

    if (!validateRecord(recordToSave)) return;

    sourceTable.fields.forEach((f) => {
      if (f.sequenceConfig?.enabled && !recordToSave[f.name]) {
        recordToSave[f.name] = generateNextSequenceValue(f, sourceTable.data || []);
      } else if (f.isAutoIncrement && f.type === 'INTEGER' && !recordToSave[f.name]) {
        const maxVal = (sourceTable.data || []).reduce((max, row) => {
          const val = parseInt(row[f.name], 10);
          return !isNaN(val) && val > max ? val : max;
        }, 0);
        recordToSave[f.name] = maxVal + 1;
      }
    });

    const newData = [...(sourceTable.data || []), recordToSave];
    onTableChange({ ...sourceTable, data: newData });

    logAuditTrail({
      tableName: sourceTable.name,
      recordId: recordToSave.id || recordToSave.ID || 'NEW',
      action: 'INSERT',
      user: 'admin',
      details: `Datensatz in Formular '${form.name}' neu angelegt.`,
    });

    setIsCreating(false);

    let initialData: Record<string, any> = {};
    if (defaultValues) {
      initialData = { ...initialData, ...defaultValues };
    }
    setTempRecord(initialData);
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setTempRecord({});
  };

  const deleteCurrentRecord = () => {
    if (isReadOnly || data.length === 0 || !sourceTable || isCreating) return;
    if (isSubform && subformPermissions?.canDelete === false) return;

    const rels = relationships.filter((r) => r.fromTableId === sourceTable.id);
    if (rels.length > 0) {
      setShowCascadeDeleteModal(true);
      return;
    }

    showConfirmation('Datensatz löschen', 'Möchten Sie diesen Datensatz wirklich löschen?', () => {
      let originalIndex = -1;
      if (isSubform && currentRecord) {
        const pkField = sourceTable.fields.find((f) => f.isPrimaryKey) || sourceTable.fields.find((f) => f.name.toLowerCase() === 'id');
        if (pkField && currentRecord[pkField.name] !== undefined) {
          originalIndex = sourceTable.data?.findIndex((row) => String(row[pkField.name]) === String(currentRecord[pkField.name])) ?? -1;
        }
        if (originalIndex === -1) {
          originalIndex = sourceTable.data?.findIndex((row) => row === currentRecord) ?? -1;
        }
        if (originalIndex === -1) {
          originalIndex = sourceTable.data?.findIndex((row) => JSON.stringify(row) === JSON.stringify(currentRecord)) ?? -1;
        }
      } else {
        originalIndex = currentIndex;
      }

      if (originalIndex === undefined || originalIndex === -1) return;

      const deletedRec = sourceTable.data![originalIndex];
      const newFullData = (sourceTable.data || []).filter((_, i) => i !== originalIndex);
      onTableChange({ ...sourceTable, data: newFullData });

      logAuditTrail({
        tableName: sourceTable.name,
        recordId: deletedRec?.id || deletedRec?.ID || originalIndex,
        action: 'DELETE',
        user: 'admin',
        details: `Datensatz in Formular '${form.name}' gelöscht.`,
      });
    });
  };

  const handleCascadeDeleteConfirm = (mode: 'cascade' | 'set_null' | 'restrict') => {
    if (!sourceTable || !currentRecord) return;

    if (mode === 'restrict') {
      const rels = relationships.filter((r) => r.fromTableId === sourceTable.id);
      let hasDeps = false;
      rels.forEach((rel) => {
        const parentField = sourceTable.fields.find((f) => f.id === rel.fromFieldId);
        const childTable = allTables.find((t) => t.id === rel.toTableId);
        const childField = childTable?.fields.find((f) => f.id === rel.toFieldId);
        const parentVal = parentField ? currentRecord[parentField.name] : null;
        if (childTable && childField && parentVal !== undefined && parentVal !== null) {
          const matchCount = (childTable.data || []).filter(
            (cRow) => String(cRow[childField.name]) === String(parentVal)
          ).length;
          if (matchCount > 0) hasDeps = true;
        }
      });

      if (hasDeps) {
        alert(
          'Löschen abgebrochen: Es existieren noch abhängige Datensätze in verknüpften Tabellen (RESTRICT / Sperre aktiv).'
        );
        setShowCascadeDeleteModal(false);
        return;
      }
    }

    let childTablesUpdatedCount = 0;
    let childRowsAffectedCount = 0;

    const rels = relationships.filter((r) => r.fromTableId === sourceTable.id);
    rels.forEach((rel) => {
      const parentField = sourceTable.fields.find((f) => f.id === rel.fromFieldId);
      const childTable = allTables.find((t) => t.id === rel.toTableId);
      const childField = childTable?.fields.find((f) => f.id === rel.toFieldId);
      const parentVal = parentField ? currentRecord[parentField.name] : null;

      if (childTable && childField && parentVal !== undefined && parentVal !== null) {
        if (mode === 'cascade') {
          const oldLen = childTable.data?.length || 0;
          const newChildData = (childTable.data || []).filter(
            (cRow) => String(cRow[childField.name]) !== String(parentVal)
          );
          const removed = oldLen - newChildData.length;
          if (removed > 0) {
            childTablesUpdatedCount++;
            childRowsAffectedCount += removed;
            updateTable({ ...childTable, data: newChildData });
          }
        } else if (mode === 'set_null') {
          let updatedCount = 0;
          const newChildData = (childTable.data || []).map((cRow) => {
            if (String(cRow[childField.name]) === String(parentVal)) {
              updatedCount++;
              return { ...cRow, [childField.name]: '' };
            }
            return cRow;
          });
          if (updatedCount > 0) {
            childTablesUpdatedCount++;
            childRowsAffectedCount += updatedCount;
            updateTable({ ...childTable, data: newChildData });
          }
        }
      }
    });

    const newFullData = (sourceTable.data || []).filter((r) => r !== currentRecord);
    onTableChange({ ...sourceTable, data: newFullData });

    setShowCascadeDeleteModal(false);

    if (childRowsAffectedCount > 0) {
      alert(
        `Erfolgreich gelöscht! ${childRowsAffectedCount} abhängige Datensätze in ${childTablesUpdatedCount} verknüpften Tabellen wurden (${
          mode === 'cascade' ? 'kaskadierend gelöscht' : 'Fremdschlüssel geleert'
        }).`
      );
    } else {
      alert('Datensatz erfolgreich gelöscht.');
    }
  };

  const getLookupOptions = (config: any) => {
    let rows: any[] = [];
    let fields: any[] = [];

    const table = allTables.find((t) => t.id === config.tableId);
    if (table) {
      rows = [...(table.data || [])];
      fields = table.fields.map((f) => ({ id: f.id, name: f.name, isPrimaryKey: f.isPrimaryKey }));
    } else if (queries && executeQuery) {
      const query = queries.find((q) => q.id === config.tableId);
      if (query && query.type === 'SELECT') {
        const context: Record<string, any> = {};
        if (form.name && currentRecord) {
          for (const key in currentRecord) {
            context[`forms.${form.name.toLowerCase()}.${key.toLowerCase()}`] = currentRecord[key];
          }
        }
        rows = [...executeQuery(query, context)];
        fields = query.columns.map((c) => ({ id: c.id, name: c.alias || c.fieldName, isPrimaryKey: false }));
      }
    }

    if (rows.length === 0) return [];

    if (config.sort && config.sort.fieldId) {
      const sortField = fields.find((f) => f.id === config.sort.fieldId);
      if (sortField) {
        const fieldName = sortField.name;
        const direction = config.sort.direction || 'ASC';
        rows.sort((a, b) => {
          const valA = a[fieldName];
          const valB = b[fieldName];
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;

          let comparison = 0;
          if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
          } else {
            comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
          }
          return direction === 'ASC' ? comparison : -comparison;
        });
      }
    }

    if (config.displayFormat && config.displayFormat.length > 0) {
      return rows.map((row) => {
        const label = config.displayFormat
          .map((item: any) => {
            const f = fields.find((field) => field.id === item.fieldId);
            return `${item.prefix || ''}${f ? row[f.name] : ''}${item.suffix || ''}`;
          })
          .join('');
        const valField = fields.find((f) => f.id === config.valueFieldId) || fields.find((f) => f.isPrimaryKey);
        return { value: valField ? row[valField.name] : '', label: label };
      });
    }
    return rows.map((row) => ({ value: row.id || Object.values(row)[0], label: Object.values(row).slice(0, 2).join(' ') }));
  };

  const handleSubformSaveFromModal = (updatedTable: Table) => {
    onTableChange(updatedTable);
    setSubformModal(null);
  };

  const evalVisibility = (el: any) => {
    // Only in subforms: hide the child link field because it is automatically populated and bound to the master record
    if (isSubform && linkConfig && el.type === 'field' && el.fieldId === linkConfig.childFieldId) {
      return false;
    }

    if (!el.visibilityCondition || !el.visibilityCondition.fieldId) return true;
    const targetField = sourceTable?.fields.find((f) => f.id === el.visibilityCondition!.fieldId);
    if (!targetField) return true;

    const val = currentRecord[targetField.name];
    const checkVal = el.visibilityCondition.value;
    const op = el.visibilityCondition.operator || 'eq';

    if (op === 'empty') {
      return val === undefined || val === null || String(val).trim() === '';
    }
    if (op === 'not_empty') {
      return val !== undefined && val !== null && String(val).trim() !== '';
    }
    if (op === 'eq') {
      return String(val || '').toLowerCase() === String(checkVal || '').toLowerCase();
    }
    if (op === 'neq') {
      return String(val || '').toLowerCase() !== String(checkVal || '').toLowerCase();
    }
    if (op === 'contains') {
      return String(val || '').toLowerCase().includes(String(checkVal || '').toLowerCase());
    }
    if (op === 'gt') {
      return Number(val) > Number(checkVal);
    }
    if (op === 'lt') {
      return Number(val) < Number(checkVal);
    }
    if (op === 'gte') {
      return Number(val) >= Number(checkVal);
    }
    if (op === 'lte') {
      return Number(val) <= Number(checkVal);
    }

    return true;
  };

  const handleQuickCreateSave = (updatedTable: Table) => {
    onTableChange(updatedTable);
    const lastRow = updatedTable.data?.[updatedTable.data.length - 1];
    if (lastRow && lookupModal) {
      const pkField = updatedTable.fields.find((f) => f.isPrimaryKey);
      if (pkField) {
        handleInputChange(lookupModal.sourceFieldName, lastRow[pkField.name]);
      }
    }
    setLookupModal(null);
  };

  useEffect(() => {
    if (linkConfig && parentRecord && !isCreating && data.length === 0 && !isReadOnly) {
      startCreate();
    }
  }, [linkConfig]);

  useEffect(() => {
    if (initialMode === 'create' && !isCreating && sourceTable && !isReadOnly) {
      startCreate();
    }
  }, [initialMode, sourceTable, isReadOnly]);

  return {
    currentIndex,
    setCurrentIndex,
    isCreating,
    setIsCreating,
    tempRecord,
    setTempRecord,
    activeSort,
    setActiveSort,
    activeFilters,
    setActiveFilters,
    filterEnabled,
    setFilterEnabled,
    globalSearchText,
    setGlobalSearchText,
    contextMenu,
    setContextMenu,
    focusedFieldName,
    setFocusedFieldName,
    filterModalOpen,
    setFilterModalOpen,
    showCascadeDeleteModal,
    setShowCascadeDeleteModal,
    lookupModal,
    setLookupModal,
    subformModal,
    setSubformModal,
    validationError,
    setValidationError,
    sourceTable,
    isUnbound,
    isReadOnly,
    finalHideNavigation,
    data,
    processedData,
    currentRecord,
    handleContextMenu,
    recalculateCalculatedFields,
    handleInputChange,
    getFieldName,
    prepareNewRecord,
    startCreate,
    validateRecord,
    saveNewRecord,
    cancelCreate,
    deleteCurrentRecord,
    handleCascadeDeleteConfirm,
    getLookupOptions,
    handleSubformSaveFromModal,
    evalVisibility,
    handleQuickCreateSave,
  };
};
