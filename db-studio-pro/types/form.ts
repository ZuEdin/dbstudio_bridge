export interface LookupConfig {
  tableId: string;
  valueFieldId: string;
  labelFields: string[];
  displayFormat?: { fieldId: string; prefix?: string; suffix?: string }[];
  allowQuickCreate?: boolean;
  quickCreateFormId?: string;
  sort?: { fieldId: string; direction: 'ASC' | 'DESC' };
}

export interface Subform {
  formId: string;
  masterLinkFieldId: string;
  childLinkFieldId: string;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface ActionFlow {
  id: string;
  trigger: 'OnClick' | 'OnChange' | 'OnPageLoad';
  actionType: 'RunMacro' | 'ShowToast' | 'OpenModal' | 'Navigate' | 'ExecuteAPI' | 'SetState';
  macroId?: string;
  toastMessage?: string;
  toastType?: 'success' | 'error' | 'info';
  modalId?: string;
  routeUrl?: string;
  apiEndpoint?: string;
  stateVariableId?: string;
  stateValue?: string;
}

export interface FormValidationRule {
  id: string;
  fieldId: string;
  type: 'required' | 'regex' | 'min' | 'max' | 'custom_js';
  regexPattern?: string;
  minValue?: number;
  maxValue?: number;
  customJsCode?: string;
  errorMessage: string;
}

export interface FormEventHandler {
  id: string;
  event: 'OnCurrent' | 'BeforeUpdate' | 'AfterUpdate' | 'OnClick';
  actionType: 'macro' | 'js_script' | 'toast' | 'open_form' | 'open_report';
  macroId?: string;
  jsCode?: string;
  toastMessage?: string;
  targetId?: string;
}

export interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  className?: string;
  actions?: ActionFlow[];
}

export interface FormElement {
  id: string;
  type: 'container' | 'field' | 'label' | 'subform' | 'button' | 'dropdown_button' | 'tabs' | 'tab_page';
  fieldId?: string;
  label?: string;
  className?: string;
  width?: '1/12' | '1/6' | '1/4' | '1/3' | '5/12' | '1/2' | '7/12' | '2/3' | '3/4' | '5/6' | '11/12' | 'full';
  children?: FormElement[];
  dropdownItems?: DropdownItem[];
  widgetType?: 'text' | 'textarea' | 'markdown' | 'number' | 'date' | 'time' | 'datetime-local' | 'checkbox' | 'switch' | 'select' | 'ad-search' | 'current-user' | 'calculated';
  calculationFormula?: string;
  isCalculated?: boolean;
  hideLabel?: boolean;
  lookup?: LookupConfig;
  subform?: Subform;
  actions?: ActionFlow[];
  eventHandlers?: FormEventHandler[];
  allowedRoles?: string[];
  visibilityCondition?: { fieldId: string; operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'empty' | 'not_empty'; value: string };
  validationRules?: FormValidationRule[];
}

export interface FormField {
  fieldId: string;
  label: string;
}

export interface FormSettings {
  isFullScreen?: boolean;
  showEditToggle?: boolean;
  showTableSplitView?: boolean;
  splitViewDisplayFieldId?: string;
  splitViewSubtitleFieldId?: string;
  hideNavigation?: boolean;
}

export interface CrossFieldValidation {
  id: string;
  triggerFieldId: string;
  condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'not_empty' | 'is_empty' | 'is_true' | 'is_false';
  triggerValue?: string;
  targetFieldId: string;
  action: 'require' | 'hide' | 'disable' | 'validate_after';
  errorMessage?: string;
}

export interface Form {
  id: string;
  name: string;
  sourceType: 'table' | 'query';
  sourceId: string;
  mode?: 'edit' | 'readonly' | 'write';
  layout?: FormElement;
  fields: FormField[];
  subform?: Subform;
  settings?: FormSettings;
  crossFieldValidations?: CrossFieldValidation[];
  validationRules?: FormValidationRule[];
  eventHandlers?: FormEventHandler[];
  allowedRoles?: string[];
}

export const getWidthClasses = (width: string | undefined): string => {
  if (!width) return '';
  switch (width) {
    case '1/12': return 'col-span-1 w-full md:w-1/12';
    case '1/6': return 'col-span-2 w-full md:w-1/6';
    case '1/4': return 'col-span-3 w-full md:w-1/4';
    case '1/3': return 'col-span-4 w-full md:w-1/3';
    case '5/12': return 'col-span-5 w-full md:w-5/12';
    case '1/2': return 'col-span-6 w-full md:w-1/2';
    case '7/12': return 'col-span-7 w-full md:w-7/12';
    case '2/3': return 'col-span-8 w-full md:w-2/3';
    case '3/4': return 'col-span-9 w-full md:w-3/4';
    case '5/6': return 'col-span-10 w-full md:w-5/6';
    case '11/12': return 'col-span-11 w-full md:w-11/12';
    case 'full': return 'col-span-12 w-full';
    default: return '';
  }
};

