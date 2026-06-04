import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSwitchSectionMutation } from "../store/slices/gameApiSlice";
import { Calculator, Variable, BookOpen, Loader2 } from "lucide-react";
import "../sass/page/studentHub.scss";

const PATHWAYS = [
  {
    id: "practice",
    title: "Arithmetic",
    description:
      "Build your foundation with arithmetic and algebraic thinking.",
    icon: <Calculator size={28} strokeWidth={2.5} />,
    bannerText1: "START HERE",
    bannerText2: "START",
    theme: "sage", // Used to color the banner/button
    sectionId: "practice",
  },
  {
    id: "equations",
    title: "Equations",
    description:
      "Practice finding the missing number to sharpen algebraic skills.",
    icon: <Variable size={28} strokeWidth={2.5} />,
    bannerText1: "Basics",
    bannerText2: "START",
    theme: "sage",
    sectionId: "equations",
  },
  {
    id: "schemas",
    title: "Word Probs",
    description: "Jump straight into solving word problems using schemas.",
    icon: <BookOpen size={28} strokeWidth={2.5} />,
    bannerText1: "SKIP AHEAD",
    bannerText2: "HARD",
    theme: "coral", // 🔥 ADDED THIS HERE
    sectionId: "schemas",
  },
];

const StudentHub = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const username = userInfo?.username;
  const navigate = useNavigate();

  const [switchSection, { isLoading }] = useSwitchSectionMutation();
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = async (pathway) => {
    setSelectedId(pathway.id);

    try {
      await switchSection({ sectionId: pathway.sectionId }).unwrap();
      navigate("/home");
    } catch (err) {
      console.error("Switch failed:", err);
      setSelectedId(null);
    }
  };

  if (!username) {
    return (
      <div
        className="loading-state"
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "100px",
        }}
      >
        <Loader2
          className="spinner"
          size={40}
          style={{ animation: "spin 1s linear infinite", color: "#81b29a" }}
        />
      </div>
    );
  }

  return (
    <div className="student-hub-wrapper">
      <div className="student-hub">
        <header className="student-hub__header">
          <h1>
            Welcome, <span className="highlight-name">{username}</span>!
          </h1>
          <p className="student-hub__subtitle">
            Choose your starting point to begin your journey.
          </p>
        </header>

        <div className="student-hub__pathways">
          {PATHWAYS.map((pathway) => (
            <button
              key={pathway.id}
              className={`brutal-card theme-${pathway.theme} `}
              onClick={() => handleSelect(pathway)}
              disabled={isLoading}
            >
              <div
                className={`banner ${pathway.theme === "coral" ? "banner__skip" : ""}`}
              >
                <span className="banner-text">{pathway.bannerText1}</span>
                <span className="banner-text">{pathway.bannerText2}</span>
              </div>

              {/* Card Content */}
              <span className="card__title">
                {pathway.icon} {pathway.title}
              </span>
              <p className="card__subtitle">{pathway.description}</p>

              <div className="card__form">
                <div className="sign-up">
                  {selectedId === pathway.id ? (
                    <Loader2 className="spinner" size={20} />
                  ) : (
                    "SELECT"
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="student-hub__hint">
          <strong>TIP:</strong> Start with{" "}
          <b className="highlight2">Arithmetic</b> to build a strong foundation
          before word problems.
        </div>
      </div>
    </div>
  );
};

export default StudentHub;
