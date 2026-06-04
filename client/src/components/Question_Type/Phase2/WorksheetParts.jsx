// WorksheetPart.jsx
import { Delete, Check, Lock, X } from "lucide-react";
// import {
//   getSlotDisplayValue,
//   getEquationFixedValue,
// } from "../../../utils/questionValidation";
// import { getLearnerFacingLabel } from "./SchemaUtils";
// import { getExpectedSlotValue } from "./SchemaUtils";

const PRACTICE_PILLS = [
  { key: "single_add", label: "Single +" },
  { key: "single_sub", label: "Single -" },
  { key: "multi_add", label: "Multi +" },
  { key: "multi_sub", label: "Multi -" },
];

const SCHEMA_STAGES = [
  { key: 1, label: "1. Bar model" },
  { key: 2, label: "2. Equation" },
  { key: 3, label: "3. Solve" },
];

const CHANGE_FULL_STAGES = [
  { key: 1, label: "1. Identify" },
  { key: 2, label: "2. Bar model" },
  { key: 3, label: "3. Equation" },
  { key: 4, label: "4. Solve" },
];

export const PracticeTabs = ({ activeKey }) => {
  // Find where the user currently is in the sequence
  const activeIndex = PRACTICE_PILLS.findIndex(
    (pill) => pill.key === activeKey,
  );

  return (
    <div className="worksheet-tabs progression-track">
      {PRACTICE_PILLS.map((pill, index) => {
        // Determine the state of each pill based on its index
        let statusClass = "";
        if (index < activeIndex) statusClass = "is-completed";
        else if (index === activeIndex) statusClass = "is-active";
        else statusClass = "is-locked";

        return (
          <div key={pill.key} className={`worksheet-tab ${statusClass}`}>
            {/* Optional: Add icons based on state */}
            {statusClass === "is-completed" && (
              <Check size={14} className="tab-icon" />
            )}
            {statusClass === "is-locked" && (
              <Lock size={12} className="tab-icon" />
            )}

            <span>{pill.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const EQUATION_PILLS = [
  { key: "missing_part_easy", label: "Missing Easy" },
  { key: "missing_part_hard", label: "Missing Hard" },
];

export const EquationTabs = ({ activeKey }) => {
  const activeIndex = EQUATION_PILLS.findIndex(
    (pill) => pill.key === activeKey,
  );

  return (
    <div className="worksheet-tabs progression-track">
      {EQUATION_PILLS.map((pill, index) => {
        let statusClass = "";
        if (index < activeIndex) statusClass = "is-completed";
        else if (index === activeIndex) statusClass = "is-active";
        else statusClass = "is-locked";

        return (
          <div key={pill.key} className={`worksheet-tab ${statusClass}`}>
            {statusClass === "is-completed" && (
              <Check size={14} className="tab-icon" />
            )}
            {statusClass === "is-locked" && (
              <Lock size={12} className="tab-icon" />
            )}

            <span>{pill.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export const StageTabs = ({
  currentStage,
  stageResults = {},
  stageTotal = 3,
}) => {
  const stages = stageTotal === 4 ? CHANGE_FULL_STAGES : SCHEMA_STAGES;
  // console.log("StageTabs render", { currentStage, stageResults });
  return (
    <div className="worksheet-tabs progression-track">
      {stages.map((stage) => {
        // Determine the state based on the current stage number (1, 2, or 3)
        const result = stageResults[stage.key];
        let statusClass = "";

        if (stage.key < currentStage) {
          statusClass = result === "wrong" ? "is-wrong" : "is-completed";
          // statusClass = "is-wrong";
        } else if (stage.key === currentStage) {
          // statusClass = "is-active";
          statusClass = result === "wrong" ? "is-wrong" : "is-active";
        } else {
          statusClass = "is-locked";
        }

        return (
          <div key={stage.key} className={`worksheet-tab ${statusClass}`}>
            {/* {statusClass === "is-completed" && (
              <Check size={14} className="tab-icon" />
            )}
            {statusClass === "is-wrong" && <X size={14} className="tab-icon" />}
            {statusClass === "is-locked" && (
              <Lock size={12} className="tab-icon" />
            )} */}
            {statusClass === "is-completed" && (
              <Check size={14} className="tab-icon" />
            )}
            {statusClass === "is-wrong" && <X size={14} className="tab-icon" />}
            {statusClass === "is-active" && !result && null}
            {statusClass === "is-locked" && (
              <Lock size={12} className="tab-icon" />
            )}
            <span>{stage.label}</span>
          </div>
        );
      })}
    </div>
  );
};
export const BarBox = ({
  box,
  label,
  value,
  active,
  onClick,
  style,
  className = "",
}) => {
  // Allow "?" to be displayed if it was explicitly typed, but hide it if it's just the default empty state?
  const displayValue = value;

  return (
    <button
      type="button"
      className={`bar-box bar-box--${box.color} ${box.editable ? "is-editable" : ""} ${active ? "is-active" : ""} ${box.accent === "unknown" ? "is-unknown" : ""} ${className}`}
      onClick={onClick}
      disabled={!box.editable}
      style={style}
    >
      <strong>
        {displayValue || <span className="hide-on-focus">?</span>}
      </strong>
      <span>{label || box.label}</span>
    </button>
  );
};

// export const EquationBoard = ({
//   question,
//   response,
//   setResponse,
//   locked,
//   feedback,
// }) => {
//   const setActiveField = (field) =>
//     !locked &&
//     setResponse((current) => ({ ...(current || {}), activeField: field }));

//   // Fallback global validation
//   const globalValidationClass = feedback
//     ? feedback.isCorrect
//       ? "is-correct"
//       : "is-wrong"
//     : "";

//   const isBarStage = ["bar_to_equation", "schema_equation"].includes(
//     question?.moduleStage,
//   );

//   const isCombine = question?.schemaKind === "combine";

//   return (
//     <div
//       className={`equation-board ${isBarStage ? "equation-board--bar-stage" : ""}`}
//     >
//       {(question?.equationSpec?.template || []).map((item, index) => {
//         if (item.type === "symbol") {
//           return (
//             <span key={`symbol-${index}`} className="equation-board__symbol">
//               {item.value}
//             </span>
//           );
//         }

//         if (item.type === "operator") {
//           const operatorValue = isCombine
//             ? "+"
//             : response?.operator || (item.editable ? "" : item.value) || "?";

//           const displayOperator = operatorValue;

//           // 🔥 FIX 1: Check individual Operator feedback
//           let opClass = "";
//           if (feedback) {
//             if (feedback.operator) {
//               opClass = feedback.operator.isCorrect ? "is-correct" : "is-wrong";
//             } else {
//               opClass = globalValidationClass;
//             }
//           }

//           return (
//             <button
//               type="button"
//               key="operator"
//               className={`equation-box equation-box--operator ${!item.editable || isCombine ? "is-fixed" : ""} ${response?.activeField === "__operator__" ? "is-active" : ""} ${locked ? "is-locked" : ""} ${item.editable && !isCombine ? opClass : ""}`}
//               onClick={() =>
//                 !isCombine && item.editable && setActiveField("__operator__")
//               }
//               disabled={locked || !item.editable || isCombine}
//               style={isCombine ? { cursor: "default" } : {}}
//             >
//               <strong>
//                 {displayOperator || <span className="hide-on-focus">?</span>}
//               </strong>{" "}
//               <span>{item.label || "operator"}</span>
//             </button>
//           );
//         }

//         const isEditable = item.editable !== false;
//         const slotValue = getSlotDisplayValue(response, item.key);

//         const displayValue =
//           isEditable && String(slotValue || "").trim() !== "" ? (
//             slotValue
//           ) : isEditable ? (
//             <span className="hide-on-focus">?</span>
//           ) : (
//             getEquationFixedValue(item)
//           );
//         const displayLabel = getLearnerFacingLabel(question, item);

//         // 🔥 FIX 2: Check individual Slot feedback for this specific box
//         let slotClass = "";
//         if (feedback) {
//           if (feedback.slots && feedback.slots[item.key]) {
//             slotClass = feedback.slots[item.key].isCorrect
//               ? "is-correct"
//               : "is-wrong";
//           } else {
//             slotClass = globalValidationClass;
//           }
//         }

//         return (
//           <button
//             type="button"
//             key={item.key}
//             // Use the specific slotClass instead of the global validationClass
//             className={`equation-box ${isEditable ? "is-editable" : "is-fixed"} ${response?.activeField === item.key ? "is-active" : ""} ${locked ? "is-locked" : ""} ${isEditable ? slotClass : ""}`}
//             onClick={() => isEditable && setActiveField(item.key)}
//             disabled={locked || !isEditable}
//           >
//             <strong>{displayValue}</strong>
//             <span>{displayLabel}</span>
//           </button>
//         );
//       })}
//     </div>
//   );
// };

export const EquationBoard = ({
  question,
  response,
  setResponse,
  locked,
  feedback,
  isGhostHint = false,
  markCompleted = () => {},
}) => {
  const setActiveField = (field) =>
    !locked &&
    setResponse((current) => ({ ...(current || {}), activeField: field }));

  const globalValidationClass = feedback
    ? feedback.isCorrect
      ? "is-correct"
      : "is-wrong"
    : "";

  const isCombine = question?.schemaKind === "combine";

  const getExpectedSlotValue = (slotKey) => {
    if (question?.validation?.slots?.[slotKey] !== undefined)
      return String(question.validation.slots[slotKey]).trim();
    const templateItem = question?.equationSpec?.template?.find(
      (t) => t.key === slotKey,
    );
    return templateItem?.value ? String(templateItem.value).trim() : "";
  };

  const getGhostPlaceholder = (slotKey) => {
    if (!isGhostHint) return null;
    const expected = getExpectedSlotValue(slotKey);
    if (expected === "?" || expected === "") return "e.g: ?";
    return `e.g: ${expected}`;
  };

  const isSlotGhost = (slotKey, currentValue) => {
    if (!isGhostHint) return false;
    const val =
      currentValue !== undefined ? currentValue : response?.slots?.[slotKey];
    return !val || val === "" || val === "?";
  };

  // 🔥 UPGRADED HELPER: Checks keys, but falls back to reading the actual label text!
  const getTagKey = (item) => {
    if (!item) return null;

    const k = String(item.key || "").toLowerCase();
    const label = String(item.label || "").toLowerCase();

    // 1. Try standard math keys first
    if (["start", "left", "part1", "addend1", "minuend"].includes(k))
      return "start";
    if (["change", "right", "part2", "addend2", "subtrahend"].includes(k))
      return "change";
    if (["end", "result", "total", "sum", "difference"].includes(k))
      return "end";

    // 2. BULLETPROOF FALLBACK: Read the text label displayed under the box
    if (label.includes("first") || label.includes("start")) return "start";
    if (
      label.includes("now") ||
      label.includes("total") ||
      label.includes("left")
    )
      return "end";

    // 3. If it has a label and wasn't start/end, it must be the change!
    if (label !== "") return "change";

    return null;
  };

  return (
    <div className="equation-board">
      {(question?.equationSpec?.template || []).map((item, index) => {
        if (item.type === "symbol") {
          return (
            <span key={`symbol-${index}`} className="equation-board__symbol">
              {item.value}
            </span>
          );
        }
        if (item.type === "operator") {
          const operatorValue = isCombine
            ? "+"
            : response?.operator || (item.editable ? "" : item.value) || "?";
          const displayOperator = operatorValue;
          let opClass = "";
          if (feedback && !isGhostHint)
            opClass = feedback.operator?.isCorrect ? "is-correct" : "is-wrong";
          const isOperatorGhost =
            isGhostHint && (!response?.operator || response.operator === "");
          const ghostOperatorPlaceholder = isOperatorGhost ? "e.g: +" : null;

          return (
            <button
              type="button"
              key="operator"
              className={`equation-box equation-box--operator ${isOperatorGhost ? "ghost-input" : ""} ${!item.editable || isCombine ? "is-fixed" : ""} ${response?.activeField === "__operator__" ? "is-active" : ""} ${locked ? "is-locked" : ""} ${item.editable && !isCombine && !isGhostHint ? opClass : ""}`}
              onClick={() => {
                if (!isCombine && item.editable) {
                  if (isOperatorGhost) markCompleted();
                  setActiveField("__operator__");
                }
              }}
              disabled={locked || !item.editable || isCombine}
            >
              <strong>
                {isOperatorGhost
                  ? ghostOperatorPlaceholder
                  : displayOperator || <span className="hide-on-focus">?</span>}
              </strong>
              <span>{item.label || "operator"}</span>
            </button>
          );
        }
        if (item.type === "slot") {
          const isEditable = item.editable !== false;
          // const slotValue = response?.slots?.[item.key];
          const slotValue =
            response?.slots?.[item.key] ??
            (!isEditable ? item.value : undefined);

          const isGhost = isSlotGhost(item.key, slotValue);
          const ghostPlaceholder = getGhostPlaceholder(item.key);
          const displayValue = isGhost
            ? ghostPlaceholder
            : slotValue || <span className="hide-on-focus">?</span>;
          const displayLabel = item.label || item.key;

          let slotClass = "";
          if (feedback && !isGhostHint && feedback.slots?.[item.key]) {
            slotClass = feedback.slots[item.key].isCorrect
              ? "is-correct"
              : "is-wrong";
          } else if (feedback && !isGhostHint) {
            slotClass = globalValidationClass;
          }

          const tagKey =
            question?.schemaKind === "change" ? getTagKey(item) : null;

          return (
            <button
              type="button"
              key={item.key}
              className={`equation-box ${isEditable ? "is-editable" : "is-fixed"} ${isGhost ? "ghost-input" : ""} ${response?.activeField === item.key && !isGhost ? "is-active" : ""} ${locked ? "is-locked" : ""} ${isEditable && !isGhostHint ? slotClass : ""}`}
              // className={`equation-box ${isEditable ? "is-editable" : "is-fixed"} ${isGhost ? "ghost-input" : ""} ${response?.activeField === item.key ? "is-active" : ""} ${locked ? "is-locked" : ""} ${isEditable && !isGhostHint ? slotClass : ""}`}
              onClick={() => {
                if (isEditable) {
                  if (isGhost) markCompleted();
                  setActiveField(item.key);
                }
              }}
              disabled={locked || !isEditable}
            >
              {tagKey && (
                <span className={`variable-tag variable-tag--${tagKey}`}>
                  {tagKey.charAt(0).toUpperCase() + tagKey.slice(1)}
                </span>
              )}
              <strong>{displayValue}</strong>
              {/* {question?.schemaKind === "change" &&
                ["start", "change", "end"].includes(item.key) && (
                  <span className={`variable-tag variable-tag--${item.key}`}>
                    {item.key.charAt(0).toUpperCase() + item.key.slice(1)}
                  </span>
                )} */}
              <span className="variable-tag-span">{displayLabel}</span>
            </button>
          );
        }
        return null;
      })}
    </div>
  );
};
export const Keypad = ({
  title,
  showUnknown,
  showOperatorPad,
  onDigit,
  onUnknown,
  onBackspace,
  onClear,
  onOperator,
  disabled,
}) => (
  <div
    className="worksheet-keypad"
    /* THE FIX: This forces React to remount and trigger the animation */
    key={showOperatorPad ? "operator-pad" : "number-pad"}
  >
    <div className="worksheet-keypad__title">{title}</div>
    {showOperatorPad ? (
      <div className="worksheet-keypad__operators">
        {["+", "-"].map((operator) => (
          <button
            type="button"
            key={operator}
            className="worksheet-keypad__operator"
            onClick={() => onOperator(operator)}
            disabled={disabled}
            aria-label={`Operator ${operator === "+" ? "plus" : "minus"}`}
          >
            {operator}
          </button>
        ))}
      </div>
    ) : (
      <div className="worksheet-keypad__grid">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            type="button"
            key={digit}
            className="worksheet-keypad__key"
            onClick={() => onDigit(digit)}
            disabled={disabled}
            aria-label={`Digit ${digit}`}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          className="worksheet-keypad__key"
          onClick={onBackspace}
          disabled={disabled}
          aria-label="Backspace"
        >
          {/* ⌫ */}
          <Delete size={28} />
        </button>
        <button
          type="button"
          className="worksheet-keypad__key"
          onClick={() => onDigit("0")}
          disabled={disabled}
          aria-label="Digit 0"
        >
          0
        </button>
        <button
          type="button"
          className="worksheet-keypad__key"
          onClick={showUnknown ? onUnknown : () => onDigit("?")}
          disabled={disabled}
          aria-label="Unknown value"
        >
          ?
        </button>
      </div>
    )}
  </div>
);

export const VerificationPanel = ({ question }) => {
  const verificationEquation = question?.validation?.verificationEquation;
  const solutionLabel = question?.validation?.solutionLabel;

  if (!verificationEquation) return null;

  return (
    <div className="worksheet-verification">
      {solutionLabel && (
        <div className="worksheet-feedback is-success">{solutionLabel}</div>
      )}
      <p>Substitute your answer back. Does the equation hold?</p>
      <div className="worksheet-verification__equation">
        {verificationEquation}
      </div>
    </div>
  );
};
