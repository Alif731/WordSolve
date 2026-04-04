import React from "react";
import { useNavigate } from "react-router-dom";

const ConceptMap = () => {
  const navigate = useNavigate();

  // This data usually comes from the Backend API
  const concepts = [
    { id: "N1_NUMBER_ID", title: "Numbers 1-20", unlocked: true },
    { id: "N2_ADDITION", title: "Addition", unlocked: true },
    { id: "N3_SUBTRACTION", title: "Subtraction", unlocked: false }, // Locked example
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Your Journey</h2>
      <div style={{ display: "flex", gap: "20px" }}>
        {concepts.map((concept) => (
          <div
            key={concept.id}
            onClick={() => concept.unlocked && navigate(`/play/${concept.id}`)}
            style={{
              border: "2px solid #333",
              padding: "20px",
              borderRadius: "10px",
              cursor: concept.unlocked ? "pointer" : "not-allowed",
              opacity: concept.unlocked ? 1 : 0.5,
              backgroundColor: concept.unlocked ? "#e0f7fa" : "#ccc",
            }}
          >
            <h3>{concept.title}</h3>
            <p>{concept.unlocked ? "START" : "LOCKED"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConceptMap;
