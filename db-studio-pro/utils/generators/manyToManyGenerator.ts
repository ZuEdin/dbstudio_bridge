import { Table, Relationship, DbType, Field } from '../../types/index';
import { toPascalCase, toCamelCase } from './common';

export interface JunctionTableMeta {
  table: Table;
  isAutoJunction: boolean;
  leftTable: Table;
  rightTable: Table;
  leftFkField: Field;
  rightFkField: Field;
}

/**
 * Scans tables and relationships to identify true many-to-many junction tables
 * (either explicit tables with 2 composite PK foreign keys or implicit n:m relations).
 */
export const detectJunctionTables = (tables: Table[], relationships: Relationship[]): JunctionTableMeta[] => {
  const junctionMetas: JunctionTableMeta[] = [];
  const seenPairs = new Set<string>();

  tables.forEach(table => {
    // 1. A true junction table is never referenced as a parent by other tables
    const isReferencedAsParent = relationships.some(r => r.fromTableId === table.id);
    if (isReferencedAsParent) return;

    // 2. Must have exactly 2 foreign keys pointing to 2 distinct parent tables
    const outgoingRels = relationships.filter(r => r.toTableId === table.id);
    const uniqueOutgoingRels = outgoingRels.filter((r, idx, self) => 
      idx === self.findIndex(o => o.fromTableId === r.fromTableId && o.toFieldId === r.toFieldId)
    );

    if (uniqueOutgoingRels.length !== 2) return;

    const relA = uniqueOutgoingRels[0];
    const relB = uniqueOutgoingRels[1];
    
    const tableA = tables.find(t => t.id === relA.fromTableId);
    const tableB = tables.find(t => t.id === relB.fromTableId);
    const fkFieldA = table.fields.find(f => f.id === relA.toFieldId);
    const fkFieldB = table.fields.find(f => f.id === relB.toFieldId);

    if (!tableA || !tableB || !fkFieldA || !fkFieldB || tableA.id === tableB.id) return;

    // 3. Distinguish true junction tables from Master-Detail line items:
    // A junction table has no heavy business payload (e.g. quantity, amount, status, date)
    // or is named explicitly (e.g. *_Zuordnung, *_Mapping, *_Pivot, *_Link, *_Rel, etc.)
    const lowerName = table.name.toLowerCase();
    const isNamedAsJunction = 
      lowerName.includes('_') ||
      lowerName.includes('zuordnung') ||
      lowerName.includes('pivot') ||
      lowerName.includes('junction') ||
      lowerName.includes('mapping') ||
      lowerName.includes('link') ||
      lowerName.includes('rel');

    const nonFkPayloadFields = table.fields.filter(f => 
      !f.isPrimaryKey && 
      f.id !== fkFieldA.id && 
      f.id !== fkFieldB.id &&
      !['created_at', 'updated_at', '_created_at', '_updated_at', '_is_deleted', '_client_id', 'tenantid', 'tenant_id', 'sortorder', 'sort_order', 'order'].includes(f.name.toLowerCase())
    );

    const isPurePivot = nonFkPayloadFields.length === 0;

    if (isNamedAsJunction || isPurePivot) {
      const pairKey = `${table.id}_${tableA.id}_${tableB.id}`;
      if (!seenPairs.has(pairKey)) {
        seenPairs.add(pairKey);
        junctionMetas.push({
          table,
          isAutoJunction: true,
          leftTable: tableA,
          rightTable: tableB,
          leftFkField: fkFieldA,
          rightFkField: fkFieldB
        });
      }
    }
  });

  return junctionMetas;
};

/**
 * Generates EF Core .NET 10 Many-to-Many configuration snippet with .UsingEntity<T>()
 */
export const generateEfCoreManyToManyFluent = (junctions: JunctionTableMeta[]): string => {
  if (junctions.length === 0) return '';

  const seen = new Set<string>();
  const uniqueJunctions = junctions.filter(j => {
    const key = `${j.leftTable.id}_${j.rightTable.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueJunctions.map(j => {
    const leftName = toPascalCase(j.leftTable.name);
    const rightName = toPascalCase(j.rightTable.name);
    const junctionName = toPascalCase(j.table.name);
    const leftFkName = toPascalCase(j.leftFkField.name);
    const rightFkName = toPascalCase(j.rightFkField.name);

    const leftPluralSuffix = leftName.endsWith('s') || leftName.endsWith('en') ? '' : 's';
    const rightPluralSuffix = rightName.endsWith('s') || rightName.endsWith('en') ? '' : 's';
    const leftPlural = `${leftName}${leftPluralSuffix}`;
    const rightPlural = `${rightName}${rightPluralSuffix}`;

    return `            // N:M Relation: ${leftName} <-> ${rightName} via ${junctionName}
            modelBuilder.Entity<${leftName}>()
                .HasMany(e => e.${rightPlural})
                .WithMany(e => e.${leftPlural})
                .UsingEntity<${junctionName}>(
                    j => j.HasOne<${rightName}>().WithMany().HasForeignKey("${rightFkName}").OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<${leftName}>().WithMany().HasForeignKey("${leftFkName}").OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.HasKey("${leftFkName}", "${rightFkName}");
                        j.ToTable("${j.table.name}");
                    });`;
  }).join('\n\n');
};

/**
 * Generates .NET Controller endpoints for Many-to-Many Attach, Detach, and Sync
 */
export const generateDotNetManyToManyEndpoints = (j: JunctionTableMeta): string => {
  const leftName = toPascalCase(j.leftTable.name);
  const rightName = toPascalCase(j.rightTable.name);
  const junctionName = toPascalCase(j.table.name);
  const leftFkName = toPascalCase(j.leftFkField.name);
  const rightFkName = toPascalCase(j.rightFkField.name);
  const rightCamel = toCamelCase(j.rightTable.name);

  // Pluralization guard (avoid double 's' on names already ending in 's' or 'en')
  const pluralSuffix = rightName.endsWith('s') || rightName.endsWith('en') ? '' : 's';
  const rightPlural = `${rightName}${pluralSuffix}`;
  const rightCamelPlural = `${rightCamel}${pluralSuffix}`;

  return `
        // --- N:M Relation Endpoints for ${rightPlural} in ${leftName} ---
        
        [HttpGet("{id}/${rightCamelPlural}")]
        public async Task<ActionResult<IEnumerable<${rightName}>>> Get${rightPlural}For${leftName}(int id)
        {
            var item = await _context.${leftName}s
                .Include(x => x.${rightPlural})
                .FirstOrDefaultAsync(x => x.Id == id);

            if (item == null) return NotFound();
            return Ok(item.${rightPlural});
        }

        [HttpPost("{id}/${rightCamelPlural}/sync")]
        public async Task<ActionResult> Sync${rightPlural}(int id, [FromBody] List<int> targetIds)
        {
            var item = await _context.${leftName}s
                .Include(x => x.${junctionName}s)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (item == null) return NotFound();

            // 1. Remove orphaned entries (handling nullable foreign key safely)
            var toRemove = item.${junctionName}s
                .Where(j => j.${rightFkName} != null && !targetIds.Contains((int)j.${rightFkName}!))
                .ToList();
            _context.${junctionName}s.RemoveRange(toRemove);

            // 2. Add newly selected entries
            var existingIds = item.${junctionName}s
                .Where(j => j.${rightFkName} != null)
                .Select(j => (int)j.${rightFkName}!)
                .ToHashSet();

            foreach (var targetId in targetIds.Where(tid => !existingIds.Contains(tid)))
            {
                _context.${junctionName}s.Add(new ${junctionName}
                {
                    ${leftFkName} = id,
                    ${rightFkName} = targetId
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, count = targetIds.Count });
        }
`;
};

/**
 * Generates Node.js Express Endpoints for N:M Sync (Sequelize / DB driver)
 */
export const generateNodeManyToManyEndpoints = (j: JunctionTableMeta): string => {
  const leftModel = toCamelCase(j.leftTable.name);
  const rightModel = toCamelCase(j.rightTable.name);
  const junctionModel = toCamelCase(j.table.name);
  const leftFk = j.leftFkField.name;
  const rightFk = j.rightFkField.name;

  return `
// N:M Sync: ${leftModel} <-> ${rightModel}
router.get('/api/${leftModel}/:id/${rightModel}s', async (req, res) => {
    try {
        const pivotRows = await db.${junctionModel}.findAll({ where: { ${leftFk}: req.params.id } });
        const targetIds = pivotRows.map(p => p.${rightFk});
        const items = await db.${rightModel}.findAll({ where: { id: targetIds } });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/${leftModel}/:id/${rightModel}s/sync', async (req, res) => {
    const { targetIds = [] } = req.body;
    try {
        // Cascade replace pivot records
        await db.${junctionModel}.destroy({ where: { ${leftFk}: req.params.id } });
        if (targetIds.length > 0) {
            const records = targetIds.map(tid => ({ ${leftFk}: req.params.id, ${rightFk}: tid }));
            await db.${junctionModel}.bulkCreate(records);
        }
        res.json({ success: true, count: targetIds.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
`;
};

/**
 * Generates PHP PDO / Eloquent Endpoints for N:M Sync
 */
export const generatePhpManyToManyHandler = (j: JunctionTableMeta): string => {
  const junctionTable = j.table.name;
  const leftFk = j.leftFkField.name;
  const rightFk = j.rightFkField.name;

  return `
    // N:M Pivot Sync for ${junctionTable}
    public function sync${toPascalCase(j.rightTable.name)}s($leftId, array $targetIds) {
        // 1. Delete old pivot links
        $stmt = $this->conn->prepare("DELETE FROM \\"${junctionTable}\\" WHERE \\"${leftFk}\\" = ?");
        $stmt->execute([$leftId]);

        // 2. Batch insert new pivot links
        if (!empty($targetIds)) {
            $insertSql = "INSERT INTO \\"${junctionTable}\\" (\\"${leftFk}\\", \\"${rightFk}\\") VALUES (?, ?)";
            $insertStmt = $this->conn->prepare($insertSql);
            foreach ($targetIds as $tid) {
                $insertStmt->execute([$leftId, $tid]);
            }
        }
        return ['success' => true, 'count' => count($targetIds)];
    }
`;
};

/**
 * Generates React & Angular Tag-Picker & Multi-Select Component for N:M UI
 */
export const generateReactManyToManyPicker = (
  leftTable: Table,
  rightTable: Table,
  junctionTable: Table
): string => {
  const leftName = toPascalCase(leftTable.name);
  const rightName = toPascalCase(rightTable.name);
  const rightListVar = `${toCamelCase(rightTable.name)}Options`;

  return `
// --- N:M Multi-Select / Tag-Picker for ${leftName} ⟷ ${rightName} ---
export const ${leftName}${rightName}Picker: React.FC<{
  recordId: number;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}> = ({ recordId, selectedIds = [], onChange }) => {
  const [options, setOptions] = React.useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/${rightTable.name.toLowerCase()}')
      .then(res => res.json())
      .then(data => {
        setOptions(Array.isArray(data) ? data : data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleSelect = (id: number) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  if (loading) return <div className="text-xs text-slate-400">Optionen werden geladen...</div>;

  return (
    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
        Verknüpfte ${rightName} (N:M):
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const isSelected = selectedIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleSelect(opt.id)}
              className={\`px-2.5 py-1 rounded-full text-xs font-semibold transition-all \${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:border-indigo-400'
              }\`}
            >
              {isSelected ? '✓ ' : '+ '}{opt.name || \`${rightName} #\${opt.id}\`}
            </button>
          );
        })}
      </div>
    </div>
  );
};
`;
};
