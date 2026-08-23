import { Workflow, WorkflowNode, WorkflowEdge } from '../../types/index';

export type ASTNode = {
    id: string;
    type: string;
    node: WorkflowNode;
    next: ASTNode[];
    trueBranch?: ASTNode[];
    falseBranch?: ASTNode[];
    loopBody?: ASTNode[];
};

export const buildWorkflowAST = (workflow: Workflow): ASTNode[] | null => {
    // Topologische Sortierung und Baumstrukturierung
    const nodesMap = new Map<string, WorkflowNode>(workflow.nodes.map(n => [n.id, n]));
    
    // Finde den/die Trigger (Wurzeln)
    const triggerNodes = workflow.nodes.filter(n => (n.type as string) === 'trigger' || (n.type as string) === 'triggerNode');
    if (triggerNodes.length === 0) return null;

    const buildTree = (nodeId: string, visited: Set<string>): ASTNode[] => {
        if (visited.has(nodeId)) {
            console.warn('Zyklus im Workflow erkannt bei Node:', nodeId);
            return []; // Einfacher Schutz gegen Endlosschleifen
        }
        visited.add(nodeId);

        const node = nodesMap.get(nodeId);
        if (!node) return [];

        const outgoingEdges = workflow.edges.filter(e => e.source === nodeId);
        
        const astNode: ASTNode = {
            id: node.id,
            type: node.type,
            node: node,
            next: []
        };

        if (node.type === 'conditionNode') {
            const trueEdge = outgoingEdges.find(e => e.label === 'True');
            const falseEdge = outgoingEdges.find(e => e.label === 'False');

            astNode.trueBranch = trueEdge ? buildTree(trueEdge.target, new Set(visited)) : [];
            astNode.falseBranch = falseEdge ? buildTree(falseEdge.target, new Set(visited)) : [];
        } else if (node.type === 'loopNode') {
            const bodyEdge = outgoingEdges.find(e => e.label === 'Each' || e.label === 'Loop Body');
            const completeEdge = outgoingEdges.find(e => e.label === 'After' || e.label === 'On Complete');

            astNode.loopBody = bodyEdge ? buildTree(bodyEdge.target, new Set(visited)) : [];
            astNode.next = completeEdge ? buildTree(completeEdge.target, new Set(visited)) : [];
        } else {
            for (const edge of outgoingEdges) {
                astNode.next.push(...buildTree(edge.target, new Set(visited)));
            }
        }

        return [astNode];
    };

    const astRoots: ASTNode[] = [];
    for (const trigger of triggerNodes) {
        astRoots.push(...buildTree(trigger.id, new Set()));
    }

    return astRoots;
};

export const generateTypeScriptCode = (ast: ASTNode[]): string => {
    let code = "export const runWorkflow = async () => {\n";
    
    const visit = (nodes: ASTNode[], indentLevel: number) => {
        const indent = "    ".repeat(indentLevel);
        for (const astNode of nodes) {
            code += `${indent}// Node: ${astNode.node.data.label} (${astNode.type})\n`;
            
            if (astNode.type === 'triggerNode') {
                 code += `${indent}console.log("Workflow Started: ${astNode.node.data.label}");\n`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'conditionNode') {
                 const op = astNode.node.data.conditionConfig?.operator || "===";
                 const val = astNode.node.data.conditionConfig?.value || "null";
                 code += `${indent}if (checkCondition("${op}", "${val}")) {\n`;
                 visit(astNode.trueBranch || [], indentLevel + 1);
                 code += `${indent}} else {\n`;
                 visit(astNode.falseBranch || [], indentLevel + 1);
                 code += `${indent}\n`;
            } else if (astNode.type === 'loopNode') {
                 const sourceName = astNode.node.data.loopConfig?.sourceName || "records";
                 const variableName = astNode.node.data.loopConfig?.variableName || "item";
                 code += `${indent}for (const ${variableName} of ${sourceName}) {\n`;
                 visit(astNode.loopBody || [], indentLevel + 1);
                 code += `${indent}}\n`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'actionNode') {
                 const actionType = astNode.node.data.actionConfig?.actionType || "run";
                 code += `${indent}await executeAction("${actionType}");\n`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'apiNode') {
                 const method = astNode.node.data.apiConfig?.method || "GET";
                 const url = astNode.node.data.apiConfig?.url || "https://api.example.com";
                 const headersStr = typeof astNode.node.data.apiConfig?.headers === 'string' 
                   ? astNode.node.data.apiConfig.headers.replace(/\n/g, '\n' + indent + '    ') 
                   : JSON.stringify(astNode.node.data.apiConfig?.headers || {});
                 const bodyStr = typeof astNode.node.data.apiConfig?.body === 'string' && (method === 'POST' || method === 'PUT')
                   ? 'JSON.stringify(' + astNode.node.data.apiConfig.body.replace(/\n/g, '\n' + indent + '    ') + ')'
                   : 'undefined';
                 code += `${indent}// API Call to endpoint
${indent}const response_${astNode.id} = await fetch("${url}", {
${indent}    method: "${method}",
${indent}    headers: ${headersStr},
${indent}    body: ${bodyStr}
${indent}});
${indent}const data_${astNode.id} = await response_${astNode.id}.json();
`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'uploadNode') {
                 const tableId = astNode.node.data.fileUploadConfig?.tableId || "default_table";
                 const fileTypes = astNode.node.data.fileUploadConfig?.fileTypes || "*";
                 code += `${indent}// File upload connection to Table: ${tableId}
${indent}await uploadFileToTable("${tableId}", { allowedTypes: "${fileTypes}" });
`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'groupNode') {
                 // Group frames are visual layout wrappers; just pass through
                 visit(astNode.next, indentLevel);
            }
        }
    };
    
    visit(ast, 1);
    
    code += "};\n";
    return code;
};
export const generateCSharpCode = (ast: ASTNode[]): string => {
    let code = "public async Task RunWorkflowAsync() {\n";
    
    const visit = (nodes: ASTNode[], indentLevel: number) => {
        const indent = "    ".repeat(indentLevel);
        for (const astNode of nodes) {
            code += `${indent}// Node: ${astNode.node.data.label} (${astNode.type})\n`;
            
            if (astNode.type === 'triggerNode') {
                 code += `${indent}Console.WriteLine("Workflow Started: ${astNode.node.data.label}");\n`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'conditionNode') {
                 // Simplified condition logic
                 const op = astNode.node.data.conditionConfig?.operator || "==";
                 const val = astNode.node.data.conditionConfig?.value || "null";
                 code += `${indent}if (CheckCondition("${op}", "${val}")) {\n`;
                 visit(astNode.trueBranch || [], indentLevel + 1);
                 code += `${indent}} else {\n`;
                 visit(astNode.falseBranch || [], indentLevel + 1);
                 code += `${indent}}\n`;
            } else if (astNode.type === 'loopNode') {
                 const sourceName = astNode.node.data.loopConfig?.sourceName || "records";
                 const variableName = astNode.node.data.loopConfig?.variableName || "item";
                 code += `${indent}foreach (var ${variableName} in ${sourceName}) {\n`;
                 visit(astNode.loopBody || [], indentLevel + 1);
                 code += `${indent}}\n`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'actionNode') {
                 const actionType = astNode.node.data.actionConfig?.actionType || "run";
                 code += `${indent}await ExecuteActionAsync("${actionType}");\n`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'apiNode') {
                 const method = astNode.node.data.apiConfig?.method || "GET";
                 const url = astNode.node.data.apiConfig?.url || "https://api.example.com";
                 const headersStr = typeof astNode.node.data.apiConfig?.headers === 'string' 
                   ? astNode.node.data.apiConfig.headers.replace(/\n/g, ' ') 
                   : '{}';
                 const bodyStr = typeof astNode.node.data.apiConfig?.body === 'string' && (method === 'POST' || method === 'PUT') 
                   ? astNode.node.data.apiConfig.body.replace(/\n/g, ' ') 
                   : 'None';
                 code += `${indent}// API Call to endpoint
${indent}using (var client = new HttpClient()) {
${indent}    var request = new HttpRequestMessage(HttpMethod.${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()}, "${url}");
${indent}    // Headers: ${headersStr}
${indent}    // Body: ${bodyStr}
${indent}    var response = await client.SendAsync(request);
${indent}    var responseString = await response.Content.ReadAsStringAsync();
${indent}}
`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'uploadNode') {
                 const tableId = astNode.node.data.fileUploadConfig?.tableId || "default_table";
                 code += `${indent}// File upload connection to Table ID: ${tableId}
${indent}await UploadFileToTableAsync("${tableId}");
`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'groupNode') {
                 // Group frames are visual layout wrappers; just pass through
                 visit(astNode.next, indentLevel);
            }
        }
    };
    
    visit(ast, 1);
    
    code += "}\n";
    return code;
};
