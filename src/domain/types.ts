export type NodeId = string;

export interface GraphNode {
  id: NodeId;
}

export interface Edge {
  from: NodeId;
  to: NodeId;
  cost: number;
  durationMinutes?: number;
  tags?: string[];
}

export interface Graph {
  id: string;
  nodes: ReadonlyMap<NodeId, GraphNode>;
  adjacency: ReadonlyMap<NodeId, ReadonlyArray<Edge>>;
  createdAt: Date;
}

export type Preference = 'shortest' | 'fastest';

export interface RouteConstraints {
  avoidHighways?: boolean;
  avoidTags?: string[];
}
