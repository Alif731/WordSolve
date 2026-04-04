import React, { useState } from "react";
import {
  Users,
  Search,
  ChevronRight,
  X,
  Target,
  Activity,
  CheckCircle2,
} from "lucide-react";
import "../sass/components/studentRoster.scss";

import UserAvatar from "./UserAvatar";

const StudentMasteryRoster = ({ classroomData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredStudents = [];

  if (classroomData) {
    for (let i = 0; i < classroomData.length; i++) {
      const student = classroomData[i];

      if (student.username.toLowerCase().includes(searchTerm.toLowerCase())) {
        let totalAttempts = 0;
        let totalCorrect = 0;
        const nodes = student.nodes || [];

        // Clean, direct data aggregation
        for (let j = 0; j < nodes.length; j++) {
          totalAttempts += nodes[j].attempts || 0;
          totalCorrect += nodes[j].correct || 0;
        }

        // Calculate Overall Accuracy safely
        let accuracy = "0.0";
        if (totalAttempts > 0) {
          accuracy = ((totalCorrect / totalAttempts) * 100).toFixed(1);
        }

        filteredStudents.push({
          ...student,
          totalAttempts,
          totalCorrect,
          accuracy,
        });
      }
    }
  }

  return (
    <section className="roster-section">
      <div className="roster-header">
        <div className="title-box">
          <h2>
            <Users size={20} /> Student Mastery Details
          </h2>
          {/* <p>Click a student to view their private Bayesian diagnostic data.</p> */}
        </div>

        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="roster-grid">
        {filteredStudents.map((student) => (
          <div
            key={student.id || student._id}
            className="student-mini-card"
            onClick={() => setSelectedStudent(student)}
          >
            <div className="student-info">
              <UserAvatar
                name={student.avatarSeed || student.username}
                variant={student.avatar || "beam"}
                size={44}
              />
              <div className="name-group">
                <span className="student-name">{student.username}</span>
                <span className="node-count">
                  {student.nodes?.length || 0} Nodes Active
                </span>
              </div>
            </div>
            <div className="mini-accuracy">{student.accuracy}%</div>
            <ChevronRight size={18} className="arrow-icon" />
          </div>
        ))}
      </div>

      {selectedStudent && (
        <div
          className="mastery-modal-overlay"
          onClick={() => setSelectedStudent(null)}
        >
          <div className="mastery-modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <div className="header-content">
                <h3>{selectedStudent.username}'s Profile</h3>
              </div>
              <button
                className="close-btn"
                onClick={() => setSelectedStudent(null)}
              >
                <X />
              </button>
            </header>

            <div className="modal-body">
              {/* --- OVERALL STUDENT TOTALS --- */}
              <div className="student-stats-summary">
                <div className="s-stat-card">
                  <Activity size={18} />
                  <div className="s-info">
                    <label>Total Tries</label>
                    <strong>{selectedStudent.totalAttempts}</strong>
                  </div>
                </div>

                <div className="s-stat-card">
                  <CheckCircle2 size={18} />
                  <div className="s-info">
                    <label>Total Correct</label>
                    <strong>{selectedStudent.totalCorrect}</strong>
                  </div>
                </div>

                <div className="s-stat-card">
                  <Target size={18} />
                  <div className="s-info">
                    <label>Overall Accuracy</label>
                    <strong>{selectedStudent.accuracy}%</strong>
                  </div>
                </div>
              </div>

              <div className="nodes-detail-list">
                <h4 className="list-title">Concept Mastery Breakdown</h4>

                {selectedStudent.nodes?.map((node, index) => {
                  // We read the 'estimate' and convert it to a percentage
                  const percentScore = (node.estimate || 0) * 100;

                  return (
                    <div key={index} className="node-detail-item">
                      <div className="node-meta">
                        <span className="node-label">
                          {node.nodeId?.replace(/_/g, " ")}
                        </span>

                        <div className="node-stats-badges">
                          <span className="badge tries">
                            {node.attempts || 0} Tries
                          </span>
                          <span className="badge correct">
                            {node.correct || 0} Correct
                          </span>
                        </div>
                      </div>

                      <div className="mastery-visual">
                        <div className="progress-text">
                          <span>Mastery Progress:</span>
                          <strong>{percentScore.toFixed(2)}%</strong>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${Math.min(percentScore, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StudentMasteryRoster;
