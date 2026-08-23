import { PageComponent } from '../../../types/index';

export const findNodeAndAdd = (rootNode: PageComponent, targetId: string, newNode: PageComponent): PageComponent => {
    if (rootNode.id === targetId) {
        return {
            ...rootNode,
            children: [...(rootNode.children || []), newNode]
        };
    }
    if (rootNode.children) {
        return {
            ...rootNode,
            children: rootNode.children.map(c => findNodeAndAdd(c, targetId, newNode))
        };
    }
    return rootNode;
};

export const findNodeAndUpdateProps = (rootNode: PageComponent, targetId: string, newProps: any): PageComponent => {
    if (rootNode.id === targetId) {
        return {
            ...rootNode,
            props: { ...rootNode.props, ...newProps }
        };
    }
    if (rootNode.children) {
        return {
            ...rootNode,
            children: rootNode.children.map(c => findNodeAndUpdateProps(c, targetId, newProps))
        };
    }
    return rootNode;
};

export const findNodeAndDelete = (rootNode: PageComponent, targetId: string): PageComponent | null => {
    if (rootNode.id === targetId) return null;
    if (rootNode.children) {
        return {
            ...rootNode,
            children: rootNode.children.map(c => findNodeAndDelete(c, targetId)).filter(Boolean) as PageComponent[]
        };
    }
    return rootNode;
};

export const findNode = (rootNode: PageComponent, targetId: string): PageComponent | null => {
    if (rootNode.id === targetId) return rootNode;
    if (rootNode.children) {
        for (const child of rootNode.children) {
             const found = findNode(child, targetId);
             if (found) return found;
        }
    }
    return null;
};

export const findParentNode = (rootNode: PageComponent, targetId: string): PageComponent | null => {
    if (!rootNode.children) return null;
    for (const child of rootNode.children) {
        if (child.id === targetId) return rootNode;
        const found = findParentNode(child, targetId);
        if (found) return found;
    }
    return null;
};

export const findNodePath = (rootNode: PageComponent, targetId: string, currentPath: PageComponent[] = []): PageComponent[] | null => {
    const newPath = [...currentPath, rootNode];
    if (rootNode.id === targetId) return newPath;
    if (rootNode.children) {
        for (const child of rootNode.children) {
            const found = findNodePath(child, targetId, newPath);
            if (found) return found;
        }
    }
    return null;
};

const cloneNodeWithNewIds = (node: PageComponent): PageComponent => {
    return {
        ...node,
        id: 'node_' + crypto.randomUUID(),
        children: node.children ? node.children.map(cloneNodeWithNewIds) : undefined
    };
};

export const findNodeAndDuplicate = (rootNode: PageComponent, targetId: string): PageComponent => {
    if (rootNode.children) {
        const index = rootNode.children.findIndex(c => c.id === targetId);
        if (index !== -1) {
            const duplicated = cloneNodeWithNewIds(rootNode.children[index]);
            const newChildren = [...rootNode.children];
            newChildren.splice(index + 1, 0, duplicated);
            return { ...rootNode, children: newChildren };
        }
        return {
            ...rootNode,
            children: rootNode.children.map(c => findNodeAndDuplicate(c, targetId))
        };
    }
    return rootNode;
};

export const findNodeAndMove = (rootNode: PageComponent, targetId: string, direction: 'up' | 'down'): PageComponent => {
    if (rootNode.children) {
        const index = rootNode.children.findIndex(c => c.id === targetId);
        if (index !== -1) {
            const newChildren = [...rootNode.children];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex >= 0 && targetIndex < newChildren.length) {
                const [moved] = newChildren.splice(index, 1);
                newChildren.splice(targetIndex, 0, moved);
                return { ...rootNode, children: newChildren };
            }
        }
        return {
            ...rootNode,
            children: rootNode.children.map(c => findNodeAndMove(c, targetId, direction))
        };
    }
    return rootNode;
};
