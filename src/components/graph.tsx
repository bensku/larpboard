import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3-force';

interface GraphNode<T> {
  id: string;
  data: T;
}

interface GraphEdge {
  source: string;
  target: string;

  color?: string;
}

interface GraphViewProps<T> {
  nodes: GraphNode<T>[];
  edges: GraphEdge[];
  centerNodeId: string;
  nodeRenderer: (node: GraphNode<T>) => React.ReactNode;
  collisionSize: number;
}

// Extend d3's SimulationNodeDatum to add our id
interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
}

// Extend SimulationLinkDatum for our links
interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: string | NodeDatum;
  target: string | NodeDatum;
}

const GraphView = <T,>({
  nodes,
  edges,
  centerNodeId,
  nodeRenderer,
  collisionSize,
}: GraphViewProps<T>) => {
  // Ref for container div so we can get its dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 800,
    height: 600,
  });
  // Map of node positions keyed by node id
  const [nodePositions, setNodePositions] = useState<{
    [key: string]: { x: number; y: number };
  }>({});

  // Measure container dimensions on mount
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setDimensions({ width: clientWidth, height: clientHeight });
    }
  }, []);

  // Create and run force simulation when nodes, edges, or dimensions change
  useEffect(() => {
    // Create simulation nodes with an initial position at the center of the container
    const simulationNodes: NodeDatum[] = nodes.map((n) => ({
      id: n.id,
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    }));
    // Map edges for d3 simulation
    const simulationLinks: LinkDatum[] = edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    // Create the simulation with forces
    const simulation = d3
      .forceSimulation<NodeDatum>(simulationNodes)
      .force(
        'link',
        d3
          .forceLink(simulationLinks)
          .id((d) => (d as { id: string }).id)
          .distance(150),
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force(
        'center',
        d3.forceCenter(dimensions.width / 2, dimensions.height / 2),
      )
      // Add collision force to help prevent node overlap.
      .force('collide', d3.forceCollide<NodeDatum>().radius(collisionSize));

    // Fix the center node at the center of the container
    simulationNodes.forEach((node) => {
      if (node.id === centerNodeId) {
        node.fx = dimensions.width / 2;
        node.fy = dimensions.height / 2;
      }
    });

    // Run the simulation for a fixed number of iterations to stabilize positions.
    // (Since drag-and-drop is not needed, we can run synchronously.)
    simulation.tick(300);

    // After simulation, store computed positions
    const positions: { [key: string]: { x: number; y: number } } = {};
    simulationNodes.forEach((node) => {
      positions[node.id] = { x: node.x || 0, y: node.y || 0 };
    });
    setNodePositions(positions);

    // Cleanup the simulation on unmount
    return () => {
      simulation.stop();
    };
  }, [nodes, edges, centerNodeId, dimensions, collisionSize]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-100">
      {/* SVG overlay for drawing edges */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="absolute top-0 left-0"
      >
        {edges.map((edge, index) => {
          const sourcePos = nodePositions[edge.source];
          const targetPos = nodePositions[edge.target];
          if (!sourcePos || !targetPos) return null;
          return (
            <line
              key={index}
              x1={sourcePos.x}
              y1={sourcePos.y}
              x2={targetPos.x}
              y2={targetPos.y}
              stroke={edge.color || 'black'}
              strokeWidth="2"
            />
          );
        })}
      </svg>

      {/* Render each node as an absolutely positioned element */}
      {nodes.map((node) => {
        const pos = nodePositions[node.id];
        if (!pos) return null;
        return (
          <div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: pos.x, top: pos.y }}
          >
            {nodeRenderer(node)}
          </div>
        );
      })}
    </div>
  );
};

export default GraphView;
