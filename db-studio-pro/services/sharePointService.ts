
import { FieldType } from '../types/index';

export const mapSpTypeToInternal = (spType: string): FieldType => {
    switch (spType) {
        case 'Text': 
        case 'Note': 
        case 'Choice': 
        case 'URL':
        case 'User': 
            return 'VARCHAR';
        case 'Number': 
        case 'Currency':
            return 'DECIMAL';
        case 'Integer':
        case 'Counter': // ID
            return 'INTEGER';
        case 'DateTime': 
            return 'DATETIME';
        case 'Boolean': 
            return 'BOOLEAN';
        default: 
            return 'VARCHAR';
    }
};

const getHeaders = (token?: string) => {
    const headers: Record<string, string> = {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose'
    };
    if (token && token.trim() !== '') {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        let errorBody = await response.text().catch(() => '');
        if (response.status === 401) {
            throw new Error("Zugriff verweigert (401). Bitte prüfen Sie Token oder Anmeldung.");
        }
        throw new Error(`SharePoint API Fehler (${response.status}): ${response.statusText} \n${errorBody}`);
    }
    const json = await response.json();
    // Support OData Verbose (d.results) and OData Minimal/NoMetadata (value)
    return json.d?.results || json.value || [];
};

export const sharePointService = {
    /**
     * Ruft alle nicht versteckten Listen und Bibliotheken der Site ab.
     */
    async getLists(siteUrl: string, token: string = ''): Promise<any[]> {
        const baseUrl = siteUrl.replace(/\/$/, '');
        const endpoint = `${baseUrl}/_api/web/lists?$filter=Hidden eq false&$select=Id,Title,ItemCount,BaseType`;

        try {
            // credentials: 'include' is vital for On-Prem/Cookie auth
            const response = await fetch(endpoint, { 
                headers: getHeaders(token),
                credentials: 'include' 
            });
            const results = await handleResponse(response);

            return results.map((list: any) => ({
                id: list.Id,
                title: list.Title,
                type: list.BaseType === 1 ? 'DocumentLibrary' : 'GenericList',
                itemCount: list.ItemCount
            }));
        } catch (error: any) {
            console.error("Failed to fetch lists:", error);
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error("Netzwerkfehler (CORS): Der Browser hat den Zugriff blockiert. Prüfen Sie, ob die URL korrekt ist und ob der Server Cross-Origin-Requests erlaubt.");
            }
            throw error;
        }
    },

    /**
     * Ruft die Felddefinitionen einer spezifischen Liste ab.
     */
    async getListFields(siteUrl: string, listId: string, token: string = ''): Promise<any[]> {
        const baseUrl = siteUrl.replace(/\/$/, '');
        const endpoint = `${baseUrl}/_api/web/lists(guid'${listId}')/fields?$filter=Hidden eq false and ReadOnlyField eq false`;

        try {
            const response = await fetch(endpoint, { 
                headers: getHeaders(token),
                credentials: 'include'
            });
            const results = await handleResponse(response);

            return results.map((f: any) => ({
                InternalName: f.InternalName,
                Title: f.Title,
                TypeAsString: f.TypeAsString
            }));
        } catch (error: any) {
            console.error("Failed to fetch fields:", error);
            throw error;
        }
    },

    /**
     * Lädt die tatsächlichen Daten (Items) aus der Liste.
     */
    async getListData(siteUrl: string, listId: string, token: string = '', limit: number = 100): Promise<any[]> {
        const baseUrl = siteUrl.replace(/\/$/, '');
        const endpoint = `${baseUrl}/_api/web/lists(guid'${listId}')/items?$top=${limit}`;

        try {
            const response = await fetch(endpoint, { 
                headers: getHeaders(token),
                credentials: 'include'
            });
            return await handleResponse(response);
        } catch (error: any) {
            console.error("Failed to fetch data:", error);
            throw error;
        }
    }
};
