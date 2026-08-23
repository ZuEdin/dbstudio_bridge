const tables = [
  { id: '1', name: 'sys_roles' },
  { id: '2', name: 'sys_users' },
  { id: '3', name: 'sys_user_profiles' },
  { id: '4', name: 'sys_permissions' }
];

const buildRecursiveTree = (items) => {
    if (!Array.isArray(items)) return [];
    const sorted = [...items].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    
    let nodes = sorted.map(item => ({
        id: item.id,
        item,
        displayName: item.name,
        children: [],
        isVirtual: false,
        parentId: null
    }));

    const prefixCounts = new Map();
    nodes.forEach(node => {
        const parts = node.item.name.split('_');
        let current = '';
        for(let i=0; i<parts.length-1; i++){
            current += (i===0 ? '' : '_') + parts[i];
            prefixCounts.set(current, (prefixCounts.get(current) || 0) + 1);
        }
    });

    const exactNames = new Set(nodes.map(n => n.item.name));
    const validPrefixes = new Set();
    for (const [prefix, count] of prefixCounts.entries()) {
        if (count > 1 || exactNames.has(prefix) || exactNames.has(prefix + 's')) {
            validPrefixes.add(prefix);
        }
    }

    const sortedPrefixes = Array.from(validPrefixes).sort((a,b) => b.length - a.length);

    const virtualFolders = new Map();
    const exactNodes = new Map(nodes.map(n => [n.item.name, n]));

    sortedPrefixes.forEach(prefix => {
        if (!exactNodes.has(prefix) && !exactNodes.has(prefix + 's')) {
            virtualFolders.set(prefix, {
                id: 'virt_' + prefix,
                item: { name: prefix },
                displayName: prefix,
                children: [],
                isVirtual: true,
                parentId: null
            });
        }
    });

    const resolveNode = (prefix) => {
        if (exactNodes.has(prefix)) return exactNodes.get(prefix);
        if (exactNodes.has(prefix + 's')) return exactNodes.get(prefix + 's');
        return virtualFolders.get(prefix);
    };

    nodes.forEach(childNode => {
        let bestPrefix = null;
        for (const prefix of sortedPrefixes) {
            if (childNode.item.name.startsWith(prefix + '_')) {
                bestPrefix = prefix;
                break;
            }
        }
        
        if (bestPrefix) {
            const parent = resolveNode(bestPrefix);
            if (parent) {
                parent.children.push(childNode);
                const prefixStr = bestPrefix + '_';
                if (childNode.item.name.startsWith(prefixStr)) {
                    childNode.displayName = childNode.item.name.slice(prefixStr.length);
                }
                childNode.parentId = parent.id;
            }
        }
    });

    const allVirtuals = Array.from(virtualFolders.values());
    allVirtuals.forEach(virtNode => {
        let bestPrefix = null;
        for (const prefix of sortedPrefixes) {
            if (virtNode.item.name !== prefix && virtNode.item.name.startsWith(prefix + '_')) {
                bestPrefix = prefix;
                break;
            }
        }
        if (bestPrefix) {
            const parent = resolveNode(bestPrefix);
            if (parent) {
                parent.children.push(virtNode);
                const prefixStr = bestPrefix + '_';
                if (virtNode.item.name.startsWith(prefixStr)) {
                    virtNode.displayName = virtNode.item.name.slice(prefixStr.length);
                }
                virtNode.parentId = parent.id;
            }
        }
    });

    let forest = [];
    nodes.filter(n => !n.parentId).forEach(n => forest.push(n));
    allVirtuals.filter(n => !n.parentId && n.children.length > 0).forEach(n => forest.push(n));

    return forest;
};

console.dir(buildRecursiveTree(tables), {depth: null});
