import { Table, Field } from '../../types/index';
import { OpenApiSpec, PostmanCollection } from './openApiTypes';

const mapFieldToOpenApiType = (field: Field): { type: string; format?: string; example?: any } => {
  const t = field.type.toUpperCase();
  if (t === 'NUMBER' || t === 'INTEGER' || t === 'INT') {
    return { type: 'integer', example: 1 };
  }
  if (t === 'FLOAT' || t === 'DOUBLE' || t === 'DECIMAL' || t === 'CURRENCY') {
    return { type: 'number', format: 'double', example: 49.99 };
  }
  if (t === 'BOOLEAN' || t === 'BOOL') {
    return { type: 'boolean', example: true };
  }
  if (t === 'DATE' || t === 'DATETIME') {
    return { type: 'string', format: 'date-time', example: new Date().toISOString() };
  }
  return { type: 'string', example: `${field.name}_sample` };
};

export const generateOpenApiSpec = (tables: Table[], baseUrl = 'http://localhost:3000'): OpenApiSpec => {
  const schemas: Record<string, any> = {};
  const paths: Record<string, any> = {};

  tables.forEach(table => {
    const tableName = table.name.toLowerCase();
    const schemaName = table.name;

    // Schema properties
    const properties: Record<string, any> = {};
    const required: string[] = [];
    const sampleRecord: Record<string, any> = {};

    table.fields.forEach(field => {
      const typeDef = mapFieldToOpenApiType(field);
      properties[field.name] = {
        type: typeDef.type,
        ...(typeDef.format ? { format: typeDef.format } : {}),
        description: `Feld ${field.name} (${field.type})`
      };
      if (!field.allowNull && !field.isPrimaryKey) {
        required.push(field.name);
      }
      sampleRecord[field.name] = typeDef.example;
    });

    schemas[schemaName] = {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {})
    };

    // Collection Endpoints: GET /api/v1/{table}, POST /api/v1/{table}
    paths[`/api/v1/${tableName}`] = {
      get: {
        summary: `Liste aller ${table.name} abrufen`,
        description: `Gibt paginierte Datensätze der Tabelle "${table.name}" zurück. Unterstützt Filterung und Suche.`,
        tags: [table.name],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Anzahl der Datensätze' },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Offset für Paginierung' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Suchbegriff für Volltext-Filter' },
          { name: 'sortBy', in: 'query', schema: { type: 'string' }, description: 'Feldname für Sortierung' }
        ],
        responses: {
          '200': {
            description: 'Erfolgreiche Abfrage',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: `#/components/schemas/${schemaName}` } },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: `Neuen Datensatz in ${table.name} anlegen`,
        description: `Erstellt ein neues Objekt in "${table.name}".`,
        tags: [table.name],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${schemaName}` },
              example: sampleRecord
            }
          }
        },
        responses: {
          '201': {
            description: 'Datensatz erfolgreich erstellt',
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${schemaName}` }
              }
            }
          },
          '400': { description: 'Ungültige Eingabedaten oder Validierungsfehler' }
        }
      }
    };

    // Item Endpoints: GET /api/v1/{table}/{id}, PUT /api/v1/{table}/{id}, DELETE /api/v1/{table}/{id}
    paths[`/api/v1/${tableName}/{id}`] = {
      get: {
        summary: `${table.name} nach ID abrufen`,
        tags: [table.name],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Datensatz-ID' }],
        responses: {
          '200': {
            description: 'Datensatz gefunden',
            content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } }
          },
          '404': { description: 'Datensatz nicht gefunden' }
        }
      },
      put: {
        summary: `${table.name} aktualisieren`,
        tags: [table.name],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Datensatz-ID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${schemaName}` },
              example: sampleRecord
            }
          }
        },
        responses: {
          '200': {
            description: 'Datensatz erfolgreich aktualisiert',
            content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } }
          },
          '404': { description: 'Datensatz nicht gefunden' }
        }
      },
      delete: {
        summary: `${table.name} löschen`,
        tags: [table.name],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Datensatz-ID' }],
        responses: {
          '200': { description: 'Datensatz erfolgreich gelöscht' },
          '404': { description: 'Datensatz nicht gefunden' }
        }
      }
    };
  });

  return {
    openapi: '3.1.0',
    info: {
      title: 'DB Studio Pro REST API',
      version: '1.0.0',
      description: 'Automatisch generierte OpenAPI 3.1 Spezifikation für alle Tabellen und Relationen.'
    },
    servers: [{ url: baseUrl, description: 'Local In-Browser & Dev Server' }],
    paths,
    components: { schemas }
  };
};

export const generatePostmanCollection = (tables: Table[], baseUrl = 'http://localhost:3000'): PostmanCollection => {
  const collection: PostmanCollection = {
    info: {
      name: 'DB Studio Pro API Collection',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      description: 'Vollständige REST Collection für alle Entitäten in DB Studio Pro'
    },
    item: []
  };

  tables.forEach(table => {
    const tableName = table.name.toLowerCase();
    const sampleRecord: Record<string, any> = {};
    table.fields.forEach(f => {
      sampleRecord[f.name] = mapFieldToOpenApiType(f).example;
    });

    const folder = {
      name: table.name,
      item: [
        {
          name: `Get all ${table.name}`,
          request: {
            method: 'GET',
            header: [{ key: 'Accept', value: 'application/json' }],
            url: {
              raw: `${baseUrl}/api/v1/${tableName}?limit=20&offset=0`,
              host: [baseUrl.replace(/https?:\/\//, '')],
              path: ['api', 'v1', tableName],
              query: [
                { key: 'limit', value: '20' },
                { key: 'offset', value: '0' }
              ]
            }
          }
        },
        {
          name: `Get ${table.name} by ID`,
          request: {
            method: 'GET',
            header: [{ key: 'Accept', value: 'application/json' }],
            url: {
              raw: `${baseUrl}/api/v1/${tableName}/1`,
              host: [baseUrl.replace(/https?:\/\//, '')],
              path: ['api', 'v1', tableName, '1']
            }
          }
        },
        {
          name: `Create ${table.name}`,
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Accept', value: 'application/json' }
            ],
            url: {
              raw: `${baseUrl}/api/v1/${tableName}`,
              host: [baseUrl.replace(/https?:\/\//, '')],
              path: ['api', 'v1', tableName]
            },
            body: {
              mode: 'raw' as const,
              raw: JSON.stringify(sampleRecord, null, 2),
              options: { raw: { language: 'json' as const } }
            }
          }
        },
        {
          name: `Delete ${table.name}`,
          request: {
            method: 'DELETE',
            header: [{ key: 'Accept', value: 'application/json' }],
            url: {
              raw: `${baseUrl}/api/v1/${tableName}/1`,
              host: [baseUrl.replace(/https?:\/\//, '')],
              path: ['api', 'v1', tableName, '1']
            }
          }
        }
      ]
    };

    collection.item.push(folder);
  });

  return collection;
};

export const generateCurlCommand = (
  method: string,
  path: string,
  body?: any,
  baseUrl = 'http://localhost:3000'
): string => {
  let cmd = `curl -X ${method} "${baseUrl}${path}" \\\n  -H "Accept: application/json"`;
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body, null, 2)}'`;
  }
  return cmd;
};
