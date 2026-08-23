export interface OpenApiParameter {
  name: string;
  in: 'query' | 'path' | 'header';
  required?: boolean;
  schema: {
    type: string;
    default?: any;
    description?: string;
  };
  description?: string;
}

export interface OpenApiOperation {
  summary: string;
  description?: string;
  tags: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    required: boolean;
    content: {
      'application/json': {
        schema: Record<string, any>;
        example?: Record<string, any>;
      };
    };
  };
  responses: Record<string, {
    description: string;
    content?: {
      'application/json': {
        schema: Record<string, any>;
      };
    };
  }>;
}

export interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  delete?: OpenApiOperation;
  patch?: OpenApiOperation;
}

export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: { url: string; description: string }[];
  paths: Record<string, OpenApiPathItem>;
  components: {
    schemas: Record<string, any>;
  };
}

export interface MockApiLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  status: number;
  durationMs: number;
  requestPayload?: any;
  responsePayload?: any;
}

export interface PostmanCollection {
  info: {
    name: string;
    schema: string;
    description?: string;
  };
  item: {
    name: string;
    item: {
      name: string;
      request: {
        method: string;
        header: { key: string; value: string }[];
        url: {
          raw: string;
          host: string[];
          path: string[];
          query?: { key: string; value: string }[];
        };
        body?: {
          mode: 'raw';
          raw: string;
          options?: { raw: { language: 'json' } };
        };
        description?: string;
      };
    }[];
  }[];
}
