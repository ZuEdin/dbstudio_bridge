
export interface DataTypeDefinition {
  label: string;
  hasLength?: boolean;
  defaultLength?: number;
  hasPrecision?: boolean;
  defaultPrecision?: number;
  defaultScale?: number;
  mappings: {
    csharp: {
      type: string;
      // Attributes are added above the property, e.g., [MaxLength(50)]
      attributes?: (val: { length?: number, precision?: number, scale?: number, enumValues?: string[], field?: any, dbType?: any }) => string[];
    };
    sequelize: {
      // Function to generate the type string, e.g., "DataTypes.STRING(50)"
      type: (val: { length?: number, precision?: number, scale?: number, enumValues?: string[], field?: any, dbType?: any }) => string;
    };
    typescript: string;
    sql: {
        type: (val: { length?: number, precision?: number, scale?: number, enumValues?: string[], field?: any, dbType?: any }) => string;
    }
  };
}

export const DATA_TYPES: Record<string, DataTypeDefinition> = {
  UUID: {
    label: "ID / UUID / GUID",
    mappings: {
      csharp: { type: "Guid" },
      sequelize: { type: () => "DataTypes.UUID" },
      typescript: "string",
      sql: { type: ({ dbType }) => {
          if (dbType === 'PostgreSQL') return "UUID";
          if (dbType === 'SQL Server') return "UNIQUEIDENTIFIER";
          return "VARCHAR(36)";
      }}
    }
  },
  EMAIL: {
    label: "E-Mail (Domain)",
    mappings: {
      csharp: { 
        type: "string",
        attributes: () => [`[EmailAddress]`, `[MaxLength(255)]`]
      },
      sequelize: { type: () => "DataTypes.STRING(255)" },
      typescript: "string",
      sql: { type: () => "VARCHAR(255)" }
    }
  },
  PHONE: {
    label: "Telefon (Domain)",
    mappings: {
      csharp: { 
        type: "string",
        attributes: () => [`[Phone]`, `[MaxLength(50)]`]
      },
      sequelize: { type: () => "DataTypes.STRING(50)" },
      typescript: "string",
      sql: { type: () => "VARCHAR(50)" }
    }
  },
  URL: {
    label: "URL / Webadresse",
    mappings: {
      csharp: { 
        type: "string",
        attributes: () => [`[Url]`, `[MaxLength(2048)]`]
      },
      sequelize: { type: () => "DataTypes.STRING(2048)" },
      typescript: "string",
      sql: { type: () => "VARCHAR(2048)" }
    }
  },
  ENUM: {
    label: "Auswahl (Enum)",
    mappings: {
      csharp: { type: "string" },
      sequelize: { type: ({ enumValues }) => `DataTypes.ENUM(${enumValues?.map(v => `'${v.replace(/'/g, "''")}'`).join(', ') || "'unspecified'"})` },
      typescript: "string",
      sql: { type: ({ enumValues, dbType }) => {
          if (dbType === 'MySQL') {
             return `ENUM(${enumValues?.map(v => `'${v.replace(/'/g, "''")}'`).join(', ') || "'unspecified'"})`;
          }
          return "VARCHAR(50)";
      }}
    }
  },
  INTEGER: {
    label: "Zahl (Integer)",
    mappings: {
      csharp: { type: "int" },
      sequelize: { type: () => "DataTypes.INTEGER" },
      typescript: "number",
      sql: { type: () => "INT" }
    }
  },
  VARCHAR: {
    label: "Kurzer Text (Varchar)",
    hasLength: true,
    defaultLength: 255,
    mappings: {
      csharp: { 
        type: "string",
        attributes: ({ length }) => length ? [`[MaxLength(${length})]`] : []
      },
      sequelize: { 
        type: ({ length }) => `DataTypes.STRING(${length || 255})` 
      },
      typescript: "string",
      sql: { type: ({ length }) => `VARCHAR(${length || 255})` }
    }
  },
  CHAR: {
    label: "Feste Länge (Char)",
    hasLength: true,
    defaultLength: 2,
    mappings: {
      csharp: { 
        type: "string",
        attributes: ({ length }) => length ? [`[MaxLength(${length})]`, `[Column(TypeName = "char(${length})")]`] : [`[Column(TypeName = "char(2)")]`]
      },
      sequelize: { 
        type: ({ length }) => `DataTypes.CHAR(${length || 2})` 
      },
      typescript: "string",
      sql: { type: ({ length }) => `CHAR(${length || 2})` }
    }
  },
  TEXT: {
    label: "Langer Text (Text)",
    mappings: {
      csharp: { type: "string" },
      sequelize: { type: () => "DataTypes.TEXT" },
      typescript: "string",
      sql: { type: () => "TEXT" }
    }
  },
  DECIMAL: {
    label: "Währung/Decimal",
    hasPrecision: true,
    defaultPrecision: 18,
    defaultScale: 2,
    mappings: {
      csharp: { 
        type: "decimal",
        attributes: ({ precision, scale }) => [`[Column(TypeName = "decimal(${precision || 18}, ${scale || 2})")]`]
      },
      sequelize: { 
        type: ({ precision, scale }) => `DataTypes.DECIMAL(${precision || 10}, ${scale || 2})` 
      },
      typescript: "number",
      sql: { type: ({ precision, scale }) => `DECIMAL(${precision || 18}, ${scale || 2})` }
    }
  },
  DOUBLE: {
    label: "Gleitkomma (Double)",
    mappings: {
      csharp: { type: "double" },
      sequelize: { type: () => "DataTypes.DOUBLE" },
      typescript: "number",
      sql: { type: () => "FLOAT" }
    }
  },
  BOOLEAN: {
    label: "Ja/Nein (Boolean)",
    mappings: {
      csharp: { type: "bool" },
      sequelize: { type: () => "DataTypes.BOOLEAN" },
      typescript: "boolean",
      sql: { type: () => "BIT" }
    }
  },
  DATE: {
    label: "Datum (DateOnly)",
    mappings: {
      csharp: { type: "DateTime" }, // .NET 6+ has DateOnly, but sticking to DateTime for wider compatibility in this demo
      sequelize: { type: () => "DataTypes.DATEONLY" },
      typescript: "Date",
      sql: { type: () => "DATE" }
    }
  },
  DATETIME: {
    label: "Datum & Zeit",
    mappings: {
      csharp: { type: "DateTime" },
      sequelize: { type: () => "DataTypes.DATE" },
      typescript: "Date",
      sql: { type: () => "DATETIME" }
    }
  },
  TINYINT: {
    label: "TinyInt",
    mappings: {
      csharp: { type: "byte" },
      sequelize: { type: () => "DataTypes.TINYINT" },
      typescript: "number",
      sql: { type: () => "TINYINT" }
    }
  },
  TIMESTAMP: {
    label: "Timestamp",
    mappings: {
      csharp: { type: "DateTime" },
      sequelize: { type: () => "DataTypes.DATE" },
      typescript: "Date",
      sql: { type: () => "TIMESTAMP" }
    }
  },
  TIME: {
    label: "Uhrzeit (Time)",
    mappings: {
      csharp: { type: "TimeSpan" },
      sequelize: { type: () => "DataTypes.TIME" },
      typescript: "string",
      sql: { type: () => "TIME" }
    }
  }
};
