import { useState, useRef, useEffect } from "react";
// import "../../../sass/components/matchTheFollowing.scss";
import { TbAppleFilled } from "react-icons/tb";
import { FaCar, FaStar, FaDog, FaCat, FaQuestionCircle } from "react-icons/fa";
import { GiBanana, GiOrangeSlice } from "react-icons/gi";
import { BsFillPencilFill } from "react-icons/bs";

// Icon Map
const ICON_MAP = {
  apple: TbAppleFilled,
  car: FaCar,
  star: FaStar,
  dog: FaDog,
  cat: FaCat,
  banana: GiBanana,
  orange: GiOrangeSlice,
  pencil: BsFillPencilFill,
};

// 4 Distinct Fun Colors for the lines!
const LINE_COLORS = ["#f63ba2", "#a855f7", "#f1bd68", "#14b8a6"];
const DEFAULT_BORDER = "#e2e8f0"; // Standard gray border

const MatchTheFollowing = ({ id, leftItems, rightItems, onComplete }) => {
  const containerRef = useRef(null);
  const [connections, setConnections] = useState([]);
  const [drawingLine, setDrawingLine] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [leftCoords, setLeftCoords] = useState({});
  const [rightCoords, setRightCoords] = useState({});
  const leftRefs = useRef({});
  const rightRefs = useRef({});

  // Get coords
  const updateCoordinates = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newLeft = {};
    for (let i = 0; i < leftItems.length; i++) {
      const id = leftItems[i].id;
      const el = leftRefs.current[id];
      if (el) {
        const rect = el.getBoundingClientRect();
        newLeft[id] = {
          x: rect.right - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      }
    }

    const newRight = {};
    for (let j = 0; j < rightItems.length; j++) {
      const id = rightItems[j].id;
      const el = rightRefs.current[id];
      if (el) {
        const rect = el.getBoundingClientRect();
        newRight[id] = {
          x: rect.left - containerRect.left - 5,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      }
    }

    setLeftCoords(newLeft);
    setRightCoords(newRight);
  };

  useEffect(() => {
    setTimeout(updateCoordinates, 100);
    window.addEventListener("resize", updateCoordinates);
    return () => window.removeEventListener("resize", updateCoordinates);
  }, [leftItems, rightItems]);

  // Click down
  const handleMouseDown = (id, e) => {
    if (isSubmitted) return;
    const filtered = [];
    for (let i = 0; i < connections.length; i++) {
      if (connections[i].leftId !== id) {
        filtered.push(connections[i]);
      }
    }
    setConnections(filtered);

    let colorIndex = 0;
    for (let i = 0; i < leftItems.length; i++) {
      if (leftItems[i].id === id) {
        colorIndex = i % LINE_COLORS.length;
        break;
      }
    }

    const start = leftCoords[id];
    setDrawingLine({
      startId: id,
      startX: start.x,
      startY: start.y,
      endX: start.x,
      endY: start.y,
      colorIndex: colorIndex,
    });
  };

  // Drag mouse
  const handleMouseMove = (e) => {
    if (!drawingLine || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDrawingLine({
      ...drawingLine,
      endX: e.clientX - rect.left,
      endY: e.clientY - rect.top,
    });
  };

  // Click up
  const handleMouseUp = (id) => {
    if (drawingLine) {
      if (id) {
        const filteredConnections = [];
        for (let i = 0; i < connections.length; i++) {
          if (connections[i].rightId !== id) {
            filteredConnections.push(connections[i]);
          }
        }
        filteredConnections.push({ leftId: drawingLine.startId, rightId: id });
        setConnections(filteredConnections);
      }
      setDrawingLine(null);
    }
  };

  const handleGlobalMouseUp = () => {
    if (drawingLine) setDrawingLine(null);
  };

  // Check ans
  const handleSubmit = () => {
    setIsSubmitted(true);
    let currentScore = 0;

    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      let isCorrect = false;
      for (let j = 0; j < leftItems.length; j++) {
        if (
          leftItems[j].id === conn.leftId &&
          leftItems[j].matchId === conn.rightId
        ) {
          isCorrect = true;
          currentScore++;
          break;
        }
      }
      conn.isCorrect = isCorrect;
    }

    setScore(currentScore);
    setConnections([...connections]);

    if (currentScore === leftItems.length) {
      onComplete(true);
    } else {
      onComplete(false);
    }
  };

  const renderContent = (item) => {
    if (item.type === "iconEquation" && item.groups) {
      const elements = [];
      for (let i = 0; i < item.groups.length; i++) {
        const group = item.groups[i];
        const IconComponent = ICON_MAP[group.icon] || FaQuestionCircle;

        const icons = [];
        for (let j = 0; j < group.count; j++) {
          icons.push(<IconComponent key={j} className="match-icon" />);
        }

        elements.push(
          <div key={`group-${i}`} className="icon-group">
            {icons}
          </div>,
        );

        if (i < item.groups.length - 1) {
          elements.push(
            <span key={`op-${i}`} className="match-operator">
              {item.operator}
            </span>,
          );
        }
      }
      return <div className="icon-equation">{elements}</div>;
    }

    return <span>{item.content}</span>;
  };

  // Build Left column
  const leftElements = [];
  for (let i = 0; i < leftItems.length; i++) {
    const item = leftItems[i];

    // Find border color
    let currentBorder = DEFAULT_BORDER;

    // 1. Check if currently dragging from this box
    if (drawingLine && drawingLine.startId === item.id) {
      currentBorder = LINE_COLORS[i % LINE_COLORS.length];
    } else {
      // 2. Check if connected (ALWAYS keep the fun color, even when submitted!)
      for (let c = 0; c < connections.length; c++) {
        if (connections[c].leftId === item.id) {
          currentBorder = LINE_COLORS[i % LINE_COLORS.length];
          break;
        }
      }
    }

    leftElements.push(
      <div
        key={item.id}
        className="match-item left-item"
        ref={(el) => (leftRefs.current[item.id] = el)}
        onMouseDown={(e) => handleMouseDown(item.id, e)}
        style={{
          cursor: "pointer",
          borderColor: currentBorder,
          transition: "border-color 0.3s ease",
        }}
      >
        {renderContent(item)}
      </div>,
    );
  }

  // Build Right column
  const rightElements = [];
  for (let i = 0; i < rightItems.length; i++) {
    const item = rightItems[i];

    // Find border color based on the left item it's connected to
    let currentBorder = DEFAULT_BORDER;
    for (let c = 0; c < connections.length; c++) {
      if (connections[c].rightId === item.id) {
        // Find the color of the left item it connects to (ALWAYS keep it, even when submitted!)
        for (let j = 0; j < leftItems.length; j++) {
          if (leftItems[j].id === connections[c].leftId) {
            currentBorder = LINE_COLORS[j % LINE_COLORS.length];
            break;
          }
        }
        break;
      }
    }

    rightElements.push(
      <div
        key={item.id}
        className="match-item right-item"
        ref={(el) => (rightRefs.current[item.id] = el)}
        onMouseUp={() => handleMouseUp(item.id)}
        style={{
          cursor: "pointer",
          borderColor: currentBorder,
          transition: "border-color 0.3s ease",
        }}
      >
        {renderContent(item)}
      </div>,
    );
  }

  // Build Marker Defs dynamically
  const markerDefs = [];
  for (let i = 0; i < LINE_COLORS.length; i++) {
    markerDefs.push(
      <marker
        key={`arrow-color-${i}`}
        id={`arrow-color-${i}`}
        markerWidth="4"
        markerHeight="4"
        refX="3"
        refY="2"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,4 L4,2 z" fill={LINE_COLORS[i]} />
      </marker>,
    );
  }

  // Build SVG lines
  const lineElements = [];
  for (let i = 0; i < connections.length; i++) {
    const conn = connections[i];
    const start = leftCoords[conn.leftId];
    const end = rightCoords[conn.rightId];

    if (start && end) {
      let colorIndex = 0;
      for (let j = 0; j < leftItems.length; j++) {
        if (leftItems[j].id === conn.leftId) {
          colorIndex = j % LINE_COLORS.length;
          break;
        }
      }

      let lineColor = LINE_COLORS[colorIndex];
      let markerId = `url(#arrow-color-${colorIndex})`;

      if (isSubmitted) {
        if (conn.isCorrect) {
          lineColor = "#4ade80";
          markerId = "url(#arrow-correct)";
        } else {
          lineColor = "#ef4444";
          markerId = "url(#arrow-error)";
        }
      }

      lineElements.push(
        <line
          key={`${conn.leftId}-${conn.rightId}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={lineColor}
          strokeWidth="4"
          strokeLinecap="round"
          markerEnd={markerId}
        />,
      );
    }
  }

  // --- HINT STATE ---
  const [showHint, setShowHint] = useState(false);

  // 1. Check count when component loads
  useEffect(() => {
    let hintCount = 0;
    const savedCount = sessionStorage.getItem("matchHintCount");
    const lastSeenId = sessionStorage.getItem("lastMatchHintId");

    // Grab the rule we set during login (Fallback to 1 just in case)
    const maxHintsAllowed = parseInt(
      sessionStorage.getItem("maxHintsAllowed") || "1",
      10,
    );

    if (savedCount) {
      hintCount = parseInt(savedCount, 10);
    }

    const currentProblemId = id || "fallback-id";

    // 🔥 Replace the hardcoded '2' with our dynamic variable!
    if (hintCount < maxHintsAllowed) {
      setShowHint(true);

      if (lastSeenId !== String(currentProblemId)) {
        sessionStorage.setItem("matchHintCount", String(hintCount + 1));
        sessionStorage.setItem("lastMatchHintId", String(currentProblemId));
      }
    }
  }, [id]);

  // 2. Hide hint the millisecond they click a box or draw a line
  useEffect(() => {
    if ((drawingLine || connections.length > 0) && showHint) {
      setShowHint(false);
    }
  }, [drawingLine, connections, showHint]);

  return (
    <div
      className="match-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleGlobalMouseUp}
      onMouseLeave={handleGlobalMouseUp}
    >
      <svg className="match-svg-layer">
        <defs>
          {markerDefs}
          <marker
            id="arrow-correct"
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,4 L4,2 z" fill="#4ade80" />
          </marker>
          <marker
            id="arrow-error"
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,4 L4,2 z" fill="#ef4444" />
          </marker>
          <marker
            id="arrow-hint"
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,4 L4,2 z" fill="#cbd5e1" />
          </marker>
        </defs>

        {lineElements}

        {/* THE HINT LINE: Shows a pulsing dashed line for the first item */}
        {showHint &&
          leftItems.length > 0 &&
          leftCoords[leftItems[0].id] &&
          rightCoords[leftItems[0].matchId] && (
            <line
              x1={leftCoords[leftItems[0].id].x}
              y1={leftCoords[leftItems[0].id].y}
              x2={rightCoords[leftItems[0].matchId].x}
              y2={rightCoords[leftItems[0].matchId].y}
              stroke="#cbd5e1"
              strokeWidth="4"
              strokeDasharray="8,8"
              className="match-hint-line"
              markerEnd="url(#arrow-hint)"
            />
          )}

        {drawingLine && (
          <line
            x1={drawingLine.startX}
            y1={drawingLine.startY}
            x2={drawingLine.endX}
            y2={drawingLine.endY}
            stroke={LINE_COLORS[drawingLine.colorIndex]}
            strokeWidth="4"
            strokeDasharray="5,5"
            markerEnd={`url(#arrow-color-${drawingLine.colorIndex})`}
          />
        )}
      </svg>

      <div className="match-columns">
        <div className="match-col left-col">{leftElements}</div>
        <div className="match-col right-col">{rightElements}</div>
      </div>

      {connections.length === leftItems.length && (
        <div className="submit__match__div">
          <button
            className={`submit__match__btn ${isSubmitted ? "submit__match__btn__submitted" : ""}`}
            onClick={handleSubmit}
            disabled={isSubmitted}
          >
            {isSubmitted
              ? `Score: ${score} / ${leftItems.length}`
              : "Submit Answers"}
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchTheFollowing;
