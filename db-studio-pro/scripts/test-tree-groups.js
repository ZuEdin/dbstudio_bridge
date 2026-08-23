const tables = [
  { id: '1', name: 'my_club' },
  { id: '2', name: 'my_club_finance_donations' },
  { id: '3', name: 'my_club_finance_campaigns' },
  { id: '4', name: 'my_club_finance_fee' },
  { id: '5', name: 'users' },
  { id: '6', name: 'users_log' }
];

const buildGroupedTree = (items) => {
    if (!Array.isArray(items)) return [];
    
    // Sort items alphabetically
    const sorted = [...items].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    
    // First, find all explicit parent-child relationships where a table is literally a prefix
    // e.g., 'my_club' -> 'my_club_finance_donations'
    const itemMap = new Map();
    sorted.forEach((item) => {
      itemMap.set(item.id, { id: item.id, item, displayName: item.name, children: [] });
    });
    
    // We want to create virtual folders for shared prefixes.
    // Let's find all prefixes. A prefix is formed by splitting by '_'
    const prefixes = new Map(); // prefix -> array of item ids
    
    sorted.forEach(item => {
        const parts = item.name.split('_');
        let currentPrefix = '';
        for (let i = 0; i < parts.length - 1; i++) {
            currentPrefix += (i === 0 ? '' : '_') + parts[i];
            if (!prefixes.has(currentPrefix)) prefixes.set(currentPrefix, []);
            prefixes.get(currentPrefix).push(item.id);
        }
    });
    
    // Only keep prefixes that have > 1 items, and where the prefix doesn't exactly match an item name
    // (If it matches an item name, we use the item itself as the folder).
    const validVirtualPrefixes = [];
    for (const [prefix, ids] of prefixes.entries()) {
        if (ids.length > 1) {
            const hasExactItem = sorted.some(i => i.name === prefix || i.name === prefix + 's');
            if (!hasExactItem) {
                validVirtualPrefixes.push(prefix);
            }
        }
    }
    
    console.log("Valid virtual prefixes:", validVirtualPrefixes);
};

buildGroupedTree(tables);
