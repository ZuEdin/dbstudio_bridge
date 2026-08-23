import { Table, Relationship } from '../../../types/index';

export interface SchemaCommit {
  id: string;
  sha: string;
  message: string;
  author: string;
  timestamp: number;
  tables: Table[];
  relationships: Relationship[];
  branch: string;
}

export interface GitBranch {
  name: string;
  createdAt: number;
  isProtected: boolean;
}

export interface RemoteConfig {
  provider: 'github' | 'gitlab' | null;
  repoName: string;
  connected: boolean;
  token: string;
  username: string;
}

export interface MergeRequest {
  id: string;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  status: 'open' | 'merged' | 'closed';
  provider: 'github' | 'gitlab';
  author: string;
  createdAt: number;
  sha: string;
}
