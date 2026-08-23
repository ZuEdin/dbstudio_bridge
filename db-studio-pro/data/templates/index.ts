
import { ProjectTemplate } from '../../types/index';
import { getFakturierungApp } from './business/fakturierungApp';
import { getCrmSuite } from './business/crmSuite';
import { getInventoryApp } from './business/inventoryApp';
import { getCmsTemplate } from './business/cmsTemplate';
import { getAgilePm } from './it/agilePm';
import { getDbstudioSelfHost } from './it/dbstudioSelfHost';
import { getDeviceRental } from './education/deviceRental';
import { getCoffeeFund } from './office/coffeeFund';

export const getTemplates = (lang: string): ProjectTemplate[] => [
    getFakturierungApp(lang),
    getDbstudioSelfHost(lang),
    getCmsTemplate(lang),
    getCrmSuite(lang),
    getDeviceRental(lang),
    getAgilePm(lang),
    getInventoryApp(lang),
    getCoffeeFund(lang)
];
