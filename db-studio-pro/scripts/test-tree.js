const tables = [
  { id: '2', name: 'my_club_finance_donations' },
  { id: '3', name: 'my_club_finance_campaigns' },
  { id: '4', name: 'my_club_finance_fee' },
];

const buildRecursiveTree = (items) => {
    if (!Array.isArray(items)) return [];
    
    const sorted = [...items].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    
    const itemMap = new Map();
    sorted.forEach((item) => {
      itemMap.set(item.id, { id: item.id, item, displayName: item.name, children: [] });
    });
    
    const nodes = Array.from(itemMap.values());
    const parentIds = new Map();

    nodes.forEach(childNode => {
      let bestParent = null;
      nodes.forEach(parentNode => {
        if (childNode.id === parentNode.id) return;
        
        const pName = parentNode.item.name;
        const singularName = pName.endsWith('s') ? pName.slice(0, -1) : pName;
        
        // Ensure parent is truly a prefix by checking for trailing underscore
        if (childNode.item.name.startsWith(pName + '_') || childNode.item.name.startsWith(singularName + '_')) {
          if (!bestParent || pName.length > bestParent.item.name.length) {
            bestParent = parentNode;
          }
        }
      });
      
      if (bestParent) {
        parentIds.set(childNode.id, bestParent.id);
      }
    });

    const forest = [];

    nodes.forEach(node => {
      const parentId = parentIds.get(node.id);
      if (parentId) {
        const parentNode = itemMap.get(parentId);
        parentNode.children.push(node);
        
        const pName = parentNode.item.name;
        const singularName = pName.endsWith('s') ? pName.slice(0, -1) : pName;
        
        let prefix = '';
        if (node.item.name.startsWith(pName + '_')) {
            prefix = pName + '_';
        } else if (node.item.name.startsWith(singularName + '_')) {
            prefix = singularName + '_';
        }
        
        if (prefix) {
            node.displayName = node.item.name.slice(prefix.length);
        }
      } else {
        forest.push(node);
      }
    });
    
    return forest;
};

console.dir(buildRecursiveTree(tables), {depth: null});
