import React, { useMemo } from "react";
import { AlertCircle, HelpCircle } from "lucide-react";

const Heatmap = ({ classroomData }) => {
  const heatmapData = useMemo(() => {
    if (!classroomData) return [];
    const nodeStats = {};

    // Standard for loop for better control
    for (let i = 0; i < classroomData.length; i++) {
      const student = classroomData[i];
      const nodes = student.nodes || [];
      for (let j = 0; j < nodes.length; j++) {
        const node = nodes[j];
        if (!nodeStats[node.nodeId]) {
          nodeStats[node.nodeId] = { totalSlip: 0, count: 0 };
        }
        nodeStats[node.nodeId].totalSlip += node.slip || 0;
        nodeStats[node.nodeId].count += 1;
      }
    }

    return Object.entries(nodeStats).map(([id, stats]) => ({
      id,
      avgSlip: (stats.totalSlip / stats.count).toFixed(2),
    }));
  }, [classroomData]);

  return (
    <section className="teacher-dashboard__panel heatmap-panel">
      <div className="panel-header">
        <h2>
          <AlertCircle size={18} /> Curriculum Difficulty
        </h2>
        <div className="info-tooltip">
          <HelpCircle size={14} />
          <span className="tooltip-text">
            Higher Slip (S) indicates confusing content.
          </span>
        </div>
      </div>
      <div className="heatmap-grid">
        {heatmapData.map((node) => (
          <div
            key={node.id}
            className="heatmap-cell"
            style={{
              backgroundColor: `rgba(0, 113, 233, ${Math.min(node.avgSlip * 1.5, 1)})`,
              color: node.avgSlip > 0.4 ? "#fff" : "#1e293b",
            }}
          >
            <span className="node-id">{node.id.replace(/_/g, " ")}</span>
            <span className="slip-score">S: {node.avgSlip}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Heatmap;
