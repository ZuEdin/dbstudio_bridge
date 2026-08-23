import { VirtualFile, BackendConfig, Table, CustomPage, Report, Query } from '../../../types/index';
import { generateNavigationComponents } from './structure/navigation';
import { generateLayoutComponents } from './structure/layout';
import { generateUserPickerComponents } from './structure/userPicker';
import { generateAuthComponents } from './structure/auth';
import { generateMarkdownComponents } from './structure/markdown';

export const generateAngularStructure = (
    config: BackendConfig,
    tables: Table[],
    root: string,
    pages: CustomPage[] = [],
    reports: Report[] = [],
    queries: Query[] = []
): VirtualFile[] => {
    const appRoot = `${root}/src/app`;
    return [
        ...generateNavigationComponents(config, tables, appRoot, pages, reports, queries),
        ...generateLayoutComponents(config, appRoot),
        ...generateUserPickerComponents(config, appRoot),
        ...generateAuthComponents(config, appRoot),
        ...generateMarkdownComponents(config, appRoot)
    ];
};

