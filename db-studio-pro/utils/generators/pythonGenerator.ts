import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { toPascalCase, toCamelCase, toSnakeCase } from './common';

export const generatePython = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;

  // Helper for type resolution in python / pydantic
  const mapPythonType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'int':
      case 'integer':
      case 'bigint':
      case 'smallint':
        return 'int';
      case 'decimal':
      case 'float':
      case 'double':
        return 'float';
      case 'boolean':
      case 'bool':
        return 'bool';
      case 'datetime':
      case 'timestamp':
      case 'date':
        return 'datetime';
      default:
        return 'str';
    }
  };

  // Helper for SQLAlchemy Column types
  const mapSqlAlchemyType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'int':
      case 'integer':
      case 'smallint':
        return 'Integer';
      case 'bigint':
        return 'BigInteger';
      case 'decimal':
        return 'Numeric';
      case 'float':
      case 'double':
        return 'Float';
      case 'boolean':
      case 'bool':
        return 'Boolean';
      case 'datetime':
      case 'timestamp':
        return 'DateTime';
      case 'date':
        return 'Date';
      default:
        return 'String';
    }
  };

  const isNoSql = config.dbType === DbType.NoSQL;

  // 1. requirements.txt
  const reqPackages = [
    'fastapi>=0.100.0',
    'uvicorn>=0.22.0',
    'pydantic>=2.0.0',
    'pydantic-settings>=2.0.0'
  ];

  if (isNoSql) {
    reqPackages.push('motor>=3.2.0', 'pymongo>=4.4.0');
  } else {
    reqPackages.push('SQLAlchemy>=2.0.0');
    if (config.dbType === DbType.MySQL) {
      reqPackages.push('aiomysql>=0.2.0', 'cryptography>=41.0.0');
    } else if (config.dbType === DbType.SQL) {
      // PostgreSQL / SQL Server
      reqPackages.push('asyncpg>=0.28.0', 'psycopg2-binary>=2.9.0');
    } else {
      // SQLite
      reqPackages.push('aiosqlite>=0.19.0');
    }
  }

  files.push({
    name: 'requirements.txt',
    path: `${root}/requirements.txt`,
    content: reqPackages.join('\n'),
    language: 'text'
  });

  // --- ENV Generation for Python ---
  const getPythonDbUrl = (conn: string) => {
    if (config.dbType === DbType.SQLite) return `sqlite+aiosqlite:///./app.db`;
    if (!conn) {
      if (config.dbType === DbType.MySQL) return 'mysql+aiomysql://root:password@localhost/db_name';
      return 'postgresql+asyncpg://postgres:password@localhost/db_name';
    }
    let host = 'localhost', dbName = 'my_db', user = 'user', pass = 'pass';
    const parts = conn.split(';');
    parts.forEach(p => {
        const [k, v] = p.split('=');
        if(!k || !v) return;
        const key = k.trim().toLowerCase();
        const val = v.trim();
        if (key.includes('database')) dbName = val;
        if (key.includes('server') || key.includes('host')) host = val;
        if (key.includes('user')) user = val;
        if (key.includes('password') || key.includes('pwd')) pass = val;
    });
    if (config.dbType === DbType.MySQL) {
      return `mysql+aiomysql://${user}:${pass}@${host}/${dbName}`;
    }
    return `postgresql+asyncpg://${user}:${pass}@${host}/${dbName}`;
  };

  const baseDbUrl = getPythonDbUrl(config.dbConnection);
  let baseEnv = `DATABASE_URL=${baseDbUrl}\nDATABASE_NAME=${config.projectName.toLowerCase()}\nPORT=${config.port}`;
  files.push({
    name: '.env',
    path: `${root}/.env`,
    content: baseEnv + '\n',
    language: 'text'
  });

  if (config.environments) {
    config.environments.forEach(env => {
      const suffix = env.name === 'Production' ? 'production' : env.name === 'Staging' ? 'staging' : 'development';
      const envConn = env.dbConnection ? getPythonDbUrl(env.dbConnection) : baseDbUrl;
      let envContent = `DATABASE_URL=${envConn}\nDATABASE_NAME=${config.projectName.toLowerCase()}\nPORT=${config.port}`;
      if (env.vars) {
        Object.entries(env.vars).forEach(([k, v]) => {
          envContent += `\n${k}=${v}`;
        });
      }
      files.push({
        name: `.env.${suffix}`,
        path: `${root}/.env.${suffix}`,
        content: envContent + '\n',
        language: 'text'
      });
    });
  }

  // 2. config/database.py
  let dbContent = '';
  if (isNoSql) {
    const uri = config.dbConnection || 'mongodb://localhost:27017';
    dbContent = `import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.getenv("DATABASE_URL", "${uri}")
DATABASE_NAME = os.getenv("DATABASE_NAME", "${config.projectName.toLowerCase()}")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

async def get_db():
    return db
`;
  } else {
    let defaultUrl = 'sqlite+aiosqlite:///./app.db';
    if (config.dbType === DbType.MySQL) {
      defaultUrl = 'mysql+aiomysql://root:password@localhost/db_name';
    } else if (config.dbType === DbType.SQL) {
      defaultUrl = 'postgresql+asyncpg://postgres:password@localhost/db_name';
    }

    dbContent = `import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "${defaultUrl}")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
`;
  }

  files.push({
    name: 'database.py',
    path: `${root}/config/database.py`,
    content: dbContent,
    language: 'python'
  });

  // 3. Models (SQLAlchemy or raw dictionaries for Mongo)
  if (!isNoSql) {
    // Generate base model and specific models for SQL
    tables.forEach(table => {
      const className = toPascalCase(table.name);
      const tableName = toSnakeCase(table.name);

      const imports = new Set<string>();
      imports.add('Column');
      
      const fieldsStr = table.fields.map(f => {
        const typeStr = mapSqlAlchemyType(f.type);
        imports.add(typeStr);

        const params: string[] = [];
        if (f.isPrimaryKey) {
          params.push('primary_key=True');
        }
        if (f.isAutoIncrement) {
          params.push('autoincrement=True');
        }
        if (f.allowNull === false && !f.isPrimaryKey) {
          params.push('nullable=False');
        }
        if (f.defaultValue !== undefined && f.defaultValue !== '') {
          if (f.type.toLowerCase() === 'boolean') {
            params.push(`default=${f.defaultValue === 'true' || f.defaultValue === '1' ? 'True' : 'False'}`);
          } else if (['int', 'integer', 'decimal', 'float'].includes(f.type.toLowerCase())) {
            params.push(`default=${f.defaultValue}`);
          } else {
            params.push(`default="${f.defaultValue}"`);
          }
        }

        const paramStr = params.length > 0 ? `, ${params.join(', ')}` : '';
        return `    ${toSnakeCase(f.name)} = Column(${typeStr}${paramStr})`;
      }).join('\n');

      const modelContent = `from sqlalchemy import ${Array.from(imports).sort().join(', ')}
from config.database import Base

class ${className}(Base):
    __tablename__ = "${tableName}"

${fieldsStr}
`;

      files.push({
        name: `${toSnakeCase(table.name)}.py`,
        path: `${root}/models/${toSnakeCase(table.name)}.py`,
        content: modelContent,
        language: 'python'
      });
    });
  }

  // 4. Pydantic Schemas for Request/Response validation
  tables.forEach(table => {
    const className = toPascalCase(table.name);
    const snakeName = toSnakeCase(table.name);

    // Schema Base
    const baseFields = table.fields.map(f => {
      const typeStr = mapPythonType(f.type);
      const isNullable = f.allowNull !== false && !f.isPrimaryKey;
      return `    ${toSnakeCase(f.name)}: ${isNullable ? `Optional[${typeStr}]` : typeStr}${isNullable ? ' = None' : ''}`;
    }).join('\n');

    const schemaContent = `from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ${className}Base(BaseModel):
${baseFields || '    pass'}

class ${className}Create(${className}Base):
    pass

class ${className}Update(${className}Base):
    pass

class ${className}(${className}Base):
    id: ${mapPythonType(table.fields.find(f => f.isPrimaryKey)?.type || 'int')}

    class Config:
        from_attributes = True
`;

    files.push({
      name: `${snakeName}.py`,
      path: `${root}/schemas/${snakeName}.py`,
      content: schemaContent,
      language: 'python'
    });
  });

  // 5. FastAPI Routers with full CRUD
  tables.forEach(table => {
    const className = toPascalCase(table.name);
    const snakeName = toSnakeCase(table.name);
    const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
    const pkName = toSnakeCase(pkField.name);
    const pkType = mapPythonType(pkField.type);

    let routerContent = '';

    if (isNoSql) {
      routerContent = `from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from config.database import get_db
from schemas.${snakeName} import ${className}, ${className}Create, ${className}Update
from bson import ObjectId

router = APIRouter(prefix="/api/${toSnakeCase(table.name)}", tags=["${className}"])

@router.post("/", response_model=${className}, status_code=status.HTTP_210_CREATED)
async def create_item(payload: ${className}Create, db = Depends(get_db)):
    item_dict = payload.model_dump()
    result = await db["${snakeName}"].insert_one(item_dict)
    item_dict["id"] = str(result.inserted_id)
    return item_dict

@router.get("/", response_model=List[${className}])
async def list_items(db = Depends(get_db)):
    cursor = db["${snakeName}"].find()
    items = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        items.append(doc)
    return items

@router.get("/{id}", response_model=${className})
async def get_item(id: str, db = Depends(get_db)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    doc = await db["${snakeName}"].find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Item not found")
    doc["id"] = str(doc["_id"])
    return doc

@router.put("/{id}", response_model=${className})
async def update_item(id: str, payload: ${className}Update, db = Depends(get_db)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if len(update_data) >= 1:
        update_result = await db["${snakeName}"].update_one(
            {"_id": ObjectId(id)}, {"$set": update_data}
        )
    doc = await db["${snakeName}"].find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Item not found")
    doc["id"] = str(doc["_id"])
    return doc

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(id: str, db = Depends(get_db)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    delete_result = await db["${snakeName}"].delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return None
`;
    } else {
      routerContent = `from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from config.database import get_db
from models.${snakeName} import ${className} as Model${className}
from schemas.${snakeName} import ${className}, ${className}Create, ${className}Update

router = APIRouter(prefix="/api/${toSnakeCase(table.name)}", tags=["${className}"])

@router.post("/", response_model=${className}, status_code=status.HTTP_201_CREATED)
async def create_item(payload: ${className}Create, db: AsyncSession = Depends(get_db)):
    db_item = Model${className}(**payload.model_dump())
    db.add(db_item)
    await db.flush()
    return db_item

@router.get("/", response_model=List[${className}])
async def list_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Model${className}))
    return result.scalars().all()

@router.get("/{id}", response_model=${className})
async def get_item(id: ${pkType}, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Model${className}).where(Model${className}.${pkName} == id))
    db_item = result.scalar_one_or_none()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.put("/{id}", response_model=${className})
async def update_item(id: ${pkType}, payload: ${className}Update, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Model${className}).where(Model${className}.${pkName} == id))
    db_item = result.scalar_one_or_none()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    return db_item

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(id: ${pkType}, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Model${className}).where(Model${className}.${pkName} == id))
    db_item = result.scalar_one_or_none()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(db_item)
    return None
`;
    }

    files.push({
      name: `${snakeName}.py`,
      path: `${root}/routers/${snakeName}.py`,
      content: routerContent,
      language: 'python'
    });
  });

  // 6. main.py
  let routerImports = tables.map(t => `from routers.${toSnakeCase(t.name)} import router as ${toCamelCase(t.name)}Router`).join('\n');
  let routerIncludes = tables.map(t => `app.include_router(${toCamelCase(t.name)}Router)`).join('\n');

  const selectQueries = queries.filter(q => q.type === 'SELECT');
  if (selectQueries.length > 0 && !isNoSql) {
      let queryRouterContent = `from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from config.database import get_db

router = APIRouter(prefix="/api/queries", tags=["Queries"])

`;
      selectQueries.forEach(q => {
          const camelName = toCamelCase(q.name);
          const safeName = toPascalCase(q.name);
          queryRouterContent += `@router.get("/${camelName}")
async def get_${camelName}(request: Request, page: int = 1, page_size: int = 20, db: AsyncSession = Depends(get_db)):
    # Handle MS Access style form references passed as query parameters (e.g. ?form_FormName_FieldName=Value)
    form_filters = {k: v for k, v in request.query_params.items() if k.startswith("form_")}
    
    offset = (page - 1) * page_size
    query_sql = f'SELECT * FROM "{safeName}" WHERE 1=1 '
    
    result = await db.execute(text(query_sql + " LIMIT :limit OFFSET :offset"), {"limit": page_size, "offset": offset})
    items = [dict(row._mapping) for row in result.fetchall()]
    
    count_result = await db.execute(text(f'SELECT COUNT(*) FROM "{safeName}"'))
    total = count_result.scalar()
    
    return {
        "data": items,
        "total": total,
        "page": page,
        "pageSize": page_size
    }

`;
      });
      files.push({
          name: `queries.py`,
          path: `${root}/routers/queries.py`,
          content: queryRouterContent,
          language: 'python'
      });
      routerImports += `\nfrom routers.queries import router as queriesRouter`;
      routerIncludes += `\napp.include_router(queriesRouter)`;
  }

  let mainContent = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

${routerImports}

app = FastAPI(
    title="${config.projectName} API",
    description="Auto-generated FastAPI Backend",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/api/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "service": "${config.projectName}"}

# Include routers
${routerIncludes}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=${config.port || 5000}, reload=True)
`;

  files.push({
    name: 'main.py',
    path: `${root}/main.py`,
    content: mainContent,
    language: 'python'
  });

  return files;
};
