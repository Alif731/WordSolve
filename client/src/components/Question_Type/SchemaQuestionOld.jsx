// import { useEffect } from "react";

// import {
//   getBarValue,
//   getDisplayedTextAnswer,
//   getEquationFixedValue,
//   getSlotDisplayValue,
//   isCompareAnswerInputQuestion,
//   isQuestionResponseReady,
// } from "../../../utils/questionValidation";

// const PRACTICE_PILLS = [
//   { key: "single_add", label: "Single +" },
//   { key: "single_sub", label: "Single -" },
//   { key: "multi_add", label: "Multi +" },
//   { key: "multi_sub", label: "Multi -" },
// ];

// const STAGE_PILLS = [
//   { index: 1, label: "1. Bar model" },
//   { index: 2, label: "2. Equation" },
//   { index: 3, label: "3. Solve" },
// ];

// const sanitizeLearnerLabel = (label, role) => {
//   const raw = String(label || "").trim();
//   if (!raw) {
//     return raw;
//   }

//   if (role === "difference") {
//     const stripped = raw.replace(/^\d+[\s-]*/u, "").trim();
//     if (/^fewer$/i.test(stripped)) {
//       return "fewer marbles";
//     }
//     if (/^more$/i.test(stripped)) {
//       return "more marbles";
//     }
//     return stripped || "difference";
//   }

//   return raw;
// };

// const getRoleKey = (item) => {
//   const rawRole = item?.role || item?.label || "";
//   const normalized = String(rawRole).trim().toLowerCase();
//   return normalized || null;
// };

// const getLearnerFacingLabel = (question, item) => {
//   const role = getRoleKey(item);

//   if (!role) {
//     return item?.label || "";
//   }

//   const specRoleLabel = question?.barModelSpec?.roleLabels?.[role];
//   if (specRoleLabel) {
//     return specRoleLabel;
//   }

//   const specBoxLabel = question?.barModelSpec?.[role]?.label;
//   if (specBoxLabel) {
//     return specBoxLabel;
//   }

//   const equationRoleLabel = question?.equationSpec?.roleLabels?.[role];
//   if (equationRoleLabel) {
//     return sanitizeLearnerLabel(equationRoleLabel, role);
//   }

//   return sanitizeLearnerLabel(item?.label || "", role);
// };

// const getAdaptiveDifferenceLabel = (comparisonWording, fallbackLabel) => {
//   const wording = String(comparisonWording || "")
//     .trim()
//     .toLowerCase();
//   if (wording === "fewer than") {
//     return "less";
//   }

//   if (wording === "more than") {
//     return "more";
//   }

//   return sanitizeLearnerLabel(fallbackLabel, "difference");
// };

// const parseBarMagnitude = (value) => {
//   if (value === undefined || value === null) {
//     return null;
//   }

//   const normalized = String(value).replace(/,/g, "").trim();
//   if (!normalized || normalized === "?") {
//     return null;
//   }

//   const parsed = Number(normalized);
//   return Number.isFinite(parsed) ? parsed : null;
// };

// const getBoxMagnitude = (response, box) => {
//   if (typeof box?.magnitude === "number" && Number.isFinite(box.magnitude)) {
//     return box.magnitude;
//   }

//   const responseValue = response?.slots?.[box?.key];
//   const responseMagnitude = parseBarMagnitude(responseValue);
//   if (responseMagnitude !== null) {
//     return responseMagnitude;
//   }

//   return parseBarMagnitude(box?.value);
// };

// const getSegmentPercentages = (firstAmount, secondAmount, totalAmount) => {
//   const first = Number(firstAmount) || 0;
//   const second = Number(secondAmount) || 0;
//   const fallbackTotal = first + second;
//   const total = Number(totalAmount) || fallbackTotal;

//   if (total <= 0) {
//     return { first: 50, second: 50 };
//   }

//   const firstPercent = Math.max(18, (first / total) * 100);
//   const secondPercent = Math.max(18, (second / total) * 100);
//   const scale = 100 / (firstPercent + secondPercent);

//   return {
//     first: firstPercent * scale,
//     second: secondPercent * scale,
//   };
// };

// const getExactTrackPercentages = (firstAmount, secondAmount, totalAmount) => {
//   const first = Math.max(0, Number(firstAmount) || 0);
//   const second = Math.max(0, Number(secondAmount) || 0);
//   const total = Math.max(first + second, Number(totalAmount) || 0);

//   if (total <= 0) {
//     return { first: 50, second: 50 };
//   }

//   return {
//     first: (first / total) * 100,
//     second: (second / total) * 100,
//   };
// };

// const resolveTotalPartsMagnitudes = (spec, response) => {
//   let total = getBoxMagnitude(response, spec.total);
//   let left = getBoxMagnitude(response, spec.left);
//   let right = getBoxMagnitude(response, spec.right);

//   if (total === null && left !== null && right !== null) {
//     total = left + right;
//   }

//   if (left === null && total !== null && right !== null) {
//     left = total - right;
//   }

//   if (right === null && total !== null && left !== null) {
//     right = total - left;
//   }

//   return { total, left, right };
// };

// const resolveCompareMagnitudes = (spec, response) => {
//   let bigger = getBoxMagnitude(response, spec.bigger);
//   let smaller = getBoxMagnitude(response, spec.smaller);
//   let difference = getBoxMagnitude(response, spec.difference);

//   if (bigger === null && smaller !== null && difference !== null) {
//     bigger = smaller + difference;
//   }

//   if (smaller === null && bigger !== null && difference !== null) {
//     smaller = bigger - difference;
//   }

//   if (difference === null && bigger !== null && smaller !== null) {
//     difference = bigger - smaller;
//   }

//   return { bigger, smaller, difference };
// };

// const joinSlotValue = (currentValue, nextValue) => {
//   const current = String(currentValue || "");

//   if (nextValue === "?") {
//     return "?";
//   }

//   if (current === "?" || current === "0") {
//     return String(nextValue);
//   }

//   return `${current}${nextValue}`.slice(0, 4);
// };

// const PracticeTabs = ({ activeKey }) => (
//   <div className="worksheet-tabs">
//     {PRACTICE_PILLS.map((pill) => (
//       <div
//         key={pill.key}
//         className={`worksheet-tab ${activeKey === pill.key ? "is-active" : ""}`}
//       >
//         {pill.label}
//       </div>
//     ))}
//   </div>
// );

// const StageTabs = ({ currentStage }) => (
//   <div className="worksheet-stage-tabs">
//     {STAGE_PILLS.map((pill) => (
//       <div
//         key={pill.index}
//         className={`worksheet-stage-tab ${
//           pill.index < currentStage
//             ? "is-complete"
//             : pill.index === currentStage
//               ? "is-active"
//               : ""
//         }`}
//       >
//         {pill.index < currentStage ? `✓ ${pill.label}` : pill.label}
//       </div>
//     ))}
//   </div>
// );

// const getBarLabel = (box, spec) => {
//   const role = box?.role || box?.key || "";
//   const semanticLabel = spec?.roleLabels?.[role] || box?.label || "";

//   if (role === "difference") {
//     return getAdaptiveDifferenceLabel(spec?.comparisonWording, semanticLabel);
//   }

//   return sanitizeLearnerLabel(semanticLabel, role);
// };

// const getGuidedCompareValue = (question, key, fallbackValue = "?") => {
//   const primaryValue = question?.validation?.slots?.[key];
//   if (
//     String(primaryValue || "").trim() &&
//     String(primaryValue).trim() !== "?"
//   ) {
//     return String(primaryValue).trim();
//   }

//   const alternateValue = question?.validation?.alternateSlots?.[key];
//   if (
//     String(alternateValue || "").trim() &&
//     String(alternateValue).trim() !== "?"
//   ) {
//     return String(alternateValue).trim();
//   }

//   return String(fallbackValue || "?").trim() || "?";
// };

// const buildCompareAnswerPrompt = (label) => {
//   const raw = String(label || "").trim();
//   if (!raw) {
//     return {
//       prompt: "Your answer",
//       placeholder: "Type the missing amount",
//     };
//   }

//   const possessiveMatch = raw.match(/^(.+?)'s\s+(.+)$/u);
//   if (possessiveMatch) {
//     const [, owner, item] = possessiveMatch;
//     return {
//       prompt: `How many ${item} does ${owner} have?`,
//       placeholder: `Type ${owner}'s ${item}`,
//     };
//   }

//   return {
//     prompt: `How many ${raw.toLowerCase()}?`,
//     placeholder: `Type ${raw.toLowerCase()}`,
//   };
// };

// const getDefaultActiveField = (question) => {
//   if (
//     !question ||
//     question?.inputMode === "text_answer" ||
//     isCompareAnswerInputQuestion(question)
//   ) {
//     return null;
//   }

//   const unknownField = question?.unknownSlot;
//   const barSpec = question?.barModelSpec;
//   if (barSpec) {
//     if (unknownField && barSpec?.[unknownField]?.editable) {
//       return barSpec[unknownField].key;
//     }

//     const firstEditableBarField = [
//       barSpec.total,
//       barSpec.left,
//       barSpec.right,
//       barSpec.bigger,
//       barSpec.smaller,
//       barSpec.difference,
//     ].find((item) => item?.editable);

//     if (firstEditableBarField?.key) {
//       return firstEditableBarField.key;
//     }
//   }

//   const equationTemplate = question?.equationSpec?.template || [];
//   const firstUnknownEquationField = equationTemplate.find(
//     (item) =>
//       item?.type !== "symbol" &&
//       item?.type !== "operator" &&
//       item?.editable !== false &&
//       String(item?.value || "").trim() === "?",
//   );

//   if (firstUnknownEquationField?.key) {
//     return firstUnknownEquationField.key;
//   }

//   const firstEditableEquationField = equationTemplate.find(
//     (item) =>
//       item?.type !== "symbol" &&
//       item?.type !== "operator" &&
//       item?.editable !== false,
//   );

//   if (firstEditableEquationField?.key) {
//     return firstEditableEquationField.key;
//   }

//   return question?.equationSpec?.operatorEditable ? "__operator__" : null;
// };

// const getActiveInputLabel = (question, activeField) => {
//   if (!question || !activeField) {
//     return "";
//   }

//   if (activeField === "__operator__") {
//     return "operator";
//   }

//   const barSpec = question?.barModelSpec;
//   if (barSpec) {
//     const barField = [
//       barSpec.total,
//       barSpec.left,
//       barSpec.right,
//       barSpec.bigger,
//       barSpec.smaller,
//       barSpec.difference,
//     ].find((item) => item?.key === activeField);

//     if (barField) {
//       return getBarLabel(barField, barSpec);
//     }
//   }

//   const equationField = (question?.equationSpec?.template || []).find(
//     (item) => item?.key === activeField,
//   );

//   if (equationField) {
//     return getLearnerFacingLabel(question, equationField);
//   }

//   return "";
// };

// const BarBox = ({
//   box,
//   label,
//   value,
//   active,
//   onClick,
//   style,
//   className = "",
// }) => (
//   <button
//     type="button"
//     className={`bar-box bar-box--${box.color} ${box.editable ? "is-editable" : ""} ${
//       active ? "is-active" : ""
//     } ${box.accent === "unknown" ? "is-unknown" : ""} ${className}`}
//     onClick={onClick}
//     disabled={!box.editable}
//     style={style}
//   >
//     <strong>{value || "?"}</strong>
//     <span>{label || box.label}</span>
//   </button>
// );

// const TotalPartsBarModel = ({
//   spec,
//   response,
//   activeField,
//   setActiveField,
// }) => {
//   const {
//     total: totalMagnitude,
//     left: leftMagnitude,
//     right: rightMagnitude,
//   } = resolveTotalPartsMagnitudes(spec, response);
//   const percentages = getSegmentPercentages(
//     leftMagnitude,
//     rightMagnitude,
//     totalMagnitude,
//   );

//   return (
//     <div className="bar-model bar-model--total-parts">
//       <div className="bar-model__top">
//         <BarBox
//           box={spec.total}
//           label={getBarLabel(spec.total, spec)}
//           value={getBarValue(response, spec.total)}
//           active={activeField === spec.total.key}
//           onClick={() => setActiveField(spec.total.key)}
//           className="bar-box--wide"
//         />
//       </div>
//       <div className="bar-model__bottom">
//         <BarBox
//           box={spec.left}
//           label={getBarLabel(spec.left, spec)}
//           value={getBarValue(response, spec.left)}
//           active={activeField === spec.left.key}
//           onClick={() => setActiveField(spec.left.key)}
//           className="bar-box--segment"
//           style={{ width: `${percentages.first}%` }}
//         />
//         <BarBox
//           box={spec.right}
//           label={getBarLabel(spec.right, spec)}
//           value={getBarValue(response, spec.right)}
//           active={activeField === spec.right.key}
//           onClick={() => setActiveField(spec.right.key)}
//           className="bar-box--segment"
//           style={{ width: `${percentages.second}%` }}
//         />
//       </div>
//     </div>
//   );
// };

// const CompareStackedBarModel = ({
//   spec,
//   response,
//   activeField,
//   setActiveField,
// }) => {
//   const {
//     bigger: biggerMagnitude,
//     smaller: smallerMagnitude,
//     difference: differenceMagnitude,
//   } = resolveCompareMagnitudes(spec, response);
//   const percentages = getExactTrackPercentages(
//     smallerMagnitude,
//     differenceMagnitude,
//     biggerMagnitude,
//   );

//   return (
//     <div className="bar-model bar-model--compare">
//       <div className="bar-model__compare-top">
//         <BarBox
//           box={spec.bigger}
//           label={getBarLabel(spec.bigger, spec)}
//           value={getBarValue(response, spec.bigger)}
//           active={activeField === spec.bigger.key}
//           onClick={() => setActiveField(spec.bigger.key)}
//           className="bar-box--wide"
//         />
//       </div>
//       <div className="bar-model__compare-bottom">
//         <div className="bar-model__compare-row">
//           <BarBox
//             box={spec.smaller}
//             label={getBarLabel(spec.smaller, spec)}
//             value={getBarValue(response, spec.smaller)}
//             active={activeField === spec.smaller.key}
//             onClick={() => setActiveField(spec.smaller.key)}
//             className="bar-box--segment"
//             style={{ flex: `0 0 ${percentages.first}%` }}
//           />
//           <BarBox
//             box={spec.difference}
//             label={getBarLabel(spec.difference, spec)}
//             value={getBarValue(response, spec.difference)}
//             active={activeField === spec.difference.key}
//             onClick={() => setActiveField(spec.difference.key)}
//             className="bar-box--segment"
//             style={{ flex: `0 0 ${percentages.second}%` }}
//           />
//         </div>
//       </div>
//       {spec?.barDecorations?.showBracket && spec.bracket && (
//         <div className="bar-model__compare-bracket">
//           <div className="bar-model__compare-line" />
//           <span>{spec.bracket.label}</span>
//         </div>
//       )}
//     </div>
//   );
// };

// const CompareGapSegment = ({ box, label, value, active, onClick, style }) => (
//   <div
//     className={`compare-gap__left ${box.editable ? "is-editable" : ""} ${
//       active ? "is-active" : ""
//     } ${box.accent === "unknown" ? "is-unknown" : ""}`}
//     style={style}
//   >
//     <button
//       type="button"
//       className="compare-gap__unknown-card"
//       onClick={onClick}
//       disabled={!box.editable}
//     >
//       <strong>{value || "?"}</strong>
//       <span>{label}</span>
//     </button>
//   </div>
// );

// const CompareGapBarModel = ({
//   spec,
//   response,
//   activeField,
//   setActiveField,
// }) => {
//   const {
//     bigger: biggerMagnitude,
//     smaller: smallerMagnitude,
//     difference: differenceMagnitude,
//   } = resolveCompareMagnitudes(spec, response);
//   const percentages = getExactTrackPercentages(
//     smallerMagnitude,
//     differenceMagnitude,
//     biggerMagnitude,
//   );
//   const guideWidth = percentages.first;

//   return (
//     <div className="bar-model bar-model--compare-gap">
//       <div className="bar-model__compare-top">
//         <BarBox
//           box={spec.bigger}
//           label={getBarLabel(spec.bigger, spec)}
//           value={getBarValue(response, spec.bigger)}
//           active={activeField === spec.bigger.key}
//           onClick={() => setActiveField(spec.bigger.key)}
//           className="bar-box--wide"
//         />
//       </div>
//       <div className="bar-model__compare-gap-track">
//         <div
//           className={`compare-gap__measure compare-gap__measure--track ${
//             activeField === spec.smaller.key ? "is-active" : ""
//           }`}
//           style={{ width: `${guideWidth}%` }}
//           aria-hidden="true"
//         />
//         <CompareGapSegment
//           box={spec.smaller}
//           label={getBarLabel(spec.smaller, spec)}
//           value={getBarValue(response, spec.smaller)}
//           active={activeField === spec.smaller.key}
//           onClick={() => setActiveField(spec.smaller.key)}
//           style={{ flex: `0 0 ${percentages.first}%` }}
//         />
//         <BarBox
//           box={spec.difference}
//           label={getBarLabel(spec.difference, spec)}
//           value={getBarValue(response, spec.difference)}
//           active={activeField === spec.difference.key}
//           onClick={() => setActiveField(spec.difference.key)}
//           className="bar-box--segment compare-gap__difference"
//           style={{ flex: `0 0 ${percentages.second}%` }}
//         />
//       </div>
//     </div>
//   );
// };

// const CompareGuidedAnswerModel = ({ question }) => {
//   const spec = question?.barModelSpec;
//   if (!spec) return null;

//   const percentages = getExactTrackPercentages(
//     spec?.smaller?.magnitude,
//     spec?.difference?.magnitude,
//     spec?.bigger?.magnitude,
//   );
//   // Percent tracks sum to exactly 100% so row width matches the top bar; minmax(0,…) avoids grid blowout.
//   const col1 = Number(percentages.first.toFixed(4));
//   const col2 = Number((100 - col1).toFixed(4));
//   const gridTracks = `minmax(0, ${col1}%) minmax(0, ${col2}%)`;

//   return (
//     <div className="bar-model bar-model--compare-guided">
//       <div className="bar-model__compare-top">
//         <BarBox
//           box={{ ...spec.bigger, editable: false }}
//           label={getBarLabel(spec.bigger, spec)}
//           value={getGuidedCompareValue(question, "bigger", spec?.bigger?.value)}
//           active={false}
//           className="bar-box--wide"
//         />
//       </div>
//       <div
//         className="bar-model__compare-guided-row"
//         style={{ gridTemplateColumns: gridTracks }}
//       >
//         <div className="compare-guided__unknown-column">
//           <div className="compare-guided__measure" aria-hidden="true" />
//           <div className="compare-guided__unknown">
//             <strong className="compare-guided__mark">?</strong>
//           </div>
//         </div>
//         <BarBox
//           box={{ ...spec.difference, editable: false }}
//           label={getBarLabel(spec.difference, spec)}
//           value={getGuidedCompareValue(
//             question,
//             "difference",
//             spec?.difference?.value,
//           )}
//           active={false}
//           className="bar-box--segment compare-guided__difference"
//         />
//       </div>
//     </div>
//   );
// };

// const BarModel = ({ question, response, setResponse }) => {
//   const spec = question?.barModelSpec;
//   if (!spec) return null;

//   const setActiveField = (field) =>
//     setResponse((current) => ({
//       ...(current || {}),
//       activeField: field,
//     }));

//   if (
//     spec.layout === "compare_offset" &&
//     spec.compareVariant === "fewer_than_gap"
//   ) {
//     return (
//       <CompareGapBarModel
//         spec={spec}
//         response={response}
//         activeField={response?.activeField}
//         setActiveField={setActiveField}
//       />
//     );
//   }

//   if (spec.layout === "compare_offset") {
//     return (
//       <CompareStackedBarModel
//         spec={spec}
//         response={response}
//         activeField={response?.activeField}
//         setActiveField={setActiveField}
//       />
//     );
//   }

//   return (
//     <TotalPartsBarModel
//       spec={spec}
//       response={response}
//       activeField={response?.activeField}
//       setActiveField={setActiveField}
//     />
//   );
// };

// const EquationBoard = ({ question, response, setResponse, locked }) => {
//   const setActiveField = (field) =>
//     !locked &&
//     setResponse((current) => ({
//       ...(current || {}),
//       activeField: field,
//     }));

//   return (
//     <div className="equation-board">
//       {(question?.equationSpec?.template || []).map((item, index) => {
//         if (item.type === "symbol") {
//           return (
//             <span key={`symbol-${index}`} className="equation-board__symbol">
//               {item.value}
//             </span>
//           );
//         }

//         if (item.type === "operator") {
//           const operatorValue =
//             response?.operator || (item.editable ? "" : item.value) || "?";
//           return (
//             <button
//               type="button"
//               key="operator"
//               className={`equation-box equation-box--operator ${
//                 response?.activeField === "__operator__" ? "is-active" : ""
//               } ${locked ? "is-locked" : ""}`}
//               onClick={() => item.editable && setActiveField("__operator__")}
//               disabled={locked || !item.editable}
//             >
//               <strong>{operatorValue || "?"}</strong>
//               <span>{item.label || "operator"}</span>
//             </button>
//           );
//         }

//         const isEditable = item.editable !== false;
//         const displayValue = isEditable
//           ? getSlotDisplayValue(response, item.key) || "?"
//           : getEquationFixedValue(item);

//         const displayLabel = getLearnerFacingLabel(question, item);

//         return (
//           <button
//             type="button"
//             key={item.key}
//             className={`equation-box ${isEditable ? "is-editable" : "is-fixed"} ${
//               response?.activeField === item.key ? "is-active" : ""
//             } ${locked ? "is-locked" : ""}`}
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

// const Keypad = ({
//   title,
//   showUnknown,
//   showOperatorPad,
//   onDigit,
//   onUnknown,
//   onBackspace,
//   onClear,
//   onOperator,
//   disabled,
// }) => (
//   <div className="worksheet-keypad">
//     <div className="worksheet-keypad__title">{title}</div>

//     {showOperatorPad ? (
//       <div className="worksheet-keypad__operators">
//         {["+", "-"].map((operator) => (
//           <button
//             type="button"
//             key={operator}
//             className="worksheet-keypad__operator"
//             onClick={() => onOperator(operator)}
//             disabled={disabled}
//           >
//             {operator}
//           </button>
//         ))}
//       </div>
//     ) : (
//       <div className="worksheet-keypad__grid">
//         {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
//           <button
//             type="button"
//             key={digit}
//             className="worksheet-keypad__key"
//             onClick={() => onDigit(digit)}
//             disabled={disabled}
//           >
//             {digit}
//           </button>
//         ))}
//         <button
//           type="button"
//           className="worksheet-keypad__key"
//           onClick={onBackspace}
//           disabled={disabled}
//         >
//           ⌫
//         </button>
//         <button
//           type="button"
//           className="worksheet-keypad__key"
//           onClick={() => onDigit("0")}
//           disabled={disabled}
//         >
//           0
//         </button>
//         <button
//           type="button"
//           className="worksheet-keypad__key"
//           onClick={showUnknown ? onUnknown : onClear}
//           disabled={disabled}
//         >
//           {showUnknown ? "?" : "clr"}
//         </button>
//       </div>
//     )}
//   </div>
// );

// const VerificationPanel = ({ question }) => {
//   const verificationEquation = question?.validation?.verificationEquation;
//   const solutionLabel = question?.validation?.solutionLabel;

//   if (!verificationEquation) return null;

//   return (
//     <div className="worksheet-verification">
//       {solutionLabel && (
//         <div className="worksheet-feedback is-success">{solutionLabel}</div>
//       )}
//       <p>Substitute your answer back. Does the equation hold?</p>
//       <div className="worksheet-verification__equation">
//         {verificationEquation}
//       </div>
//     </div>
//   );
// };

// const SchemaQuestion = ({
//   question,
//   response,
//   setResponse,
//   feedback,
//   onCheck,
//   onNext,
//   isSubmitting,
// }) => {
//   const hasFeedback = Boolean(feedback);
//   const isSuccess = Boolean(feedback?.isCorrect);
//   const canCheck =
//     isQuestionResponseReady(question, response) &&
//     !isSubmitting &&
//     !hasFeedback;
//   const isSchemaStage = String(question?.moduleStage || "").startsWith(
//     "schema_",
//   );
//   const isCompareAnswerInput = isCompareAnswerInputQuestion(question);
//   const showPromptStrip = !["practice", "equations"].includes(
//     question?.moduleStage,
//   );
//   const compareAnswerLabel = isCompareAnswerInput
//     ? getBarLabel(question?.barModelSpec?.smaller, question?.barModelSpec)
//     : "";
//   const compareAnswerCopy = buildCompareAnswerPrompt(compareAnswerLabel);
//   const showUnknownButton =
//     Object.values(question?.validation?.slots || {}).some(
//       (value) => String(value).trim() === "?",
//     ) || question?.moduleStage === "bar_to_equation";
//   const showOperatorPad =
//     question?.inputMode === "keypad_equation" &&
//     question?.equationSpec?.operatorEditable &&
//     response?.activeField === "__operator__";
//   const activeInputLabel = isCompareAnswerInput
//     ? ""
//     : getActiveInputLabel(question, response?.activeField);

//   const triggerCheck = () => {
//     if (canCheck) {
//       onCheck();
//     }
//   };

//   const updateActiveSlotValue = (nextValue) => {
//     if (hasFeedback) return;

//     if (response?.activeField === "__operator__") {
//       setResponse((current) => ({
//         ...(current || {}),
//         operator: nextValue,
//       }));
//       return;
//     }

//     const targetField = response?.activeField;
//     if (!targetField) return;

//     setResponse((current) => ({
//       ...(current || {}),
//       slots: {
//         ...(current?.slots || {}),
//         [targetField]: joinSlotValue(current?.slots?.[targetField], nextValue),
//       },
//     }));
//   };

//   const handleBackspace = () => {
//     if (hasFeedback || response?.activeField === "__operator__") return;
//     const targetField = response?.activeField;
//     if (!targetField) return;

//     setResponse((current) => ({
//       ...(current || {}),
//       slots: {
//         ...(current?.slots || {}),
//         [targetField]: String(current?.slots?.[targetField] || "").slice(0, -1),
//       },
//     }));
//   };

//   const handleClear = () => {
//     if (hasFeedback) return;

//     if (response?.activeField === "__operator__") {
//       setResponse((current) => ({
//         ...(current || {}),
//         operator: "",
//       }));
//       return;
//     }

//     const targetField = response?.activeField;
//     if (!targetField) return;

//     setResponse((current) => ({
//       ...(current || {}),
//       slots: {
//         ...(current?.slots || {}),
//         [targetField]: "",
//       },
//     }));
//   };

//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       const targetTag = event.target?.tagName;
//       const isTypingField =
//         targetTag === "INPUT" ||
//         targetTag === "TEXTAREA" ||
//         event.target?.isContentEditable;

//       if (question?.inputMode === "text_answer" || isCompareAnswerInput) {
//         if (isTypingField && event.key === "Enter" && canCheck) {
//           event.preventDefault();
//           triggerCheck();
//         }
//         return;
//       }

//       if (isTypingField || hasFeedback || isSubmitting) return;

//       if (/^\d$/.test(event.key)) {
//         event.preventDefault();
//         updateActiveSlotValue(event.key);
//         return;
//       }

//       if (event.key === "Backspace") {
//         event.preventDefault();
//         handleBackspace();
//         return;
//       }

//       if (event.key === "Delete") {
//         event.preventDefault();
//         handleClear();
//         return;
//       }

//       if (event.key === "?" && showUnknownButton) {
//         event.preventDefault();
//         updateActiveSlotValue("?");
//         return;
//       }

//       if (
//         response?.activeField === "__operator__" &&
//         (event.key === "+" || event.key === "-")
//       ) {
//         event.preventDefault();
//         setResponse((current) => ({ ...(current || {}), operator: event.key }));
//         return;
//       }

//       if (event.key === "Enter" && canCheck) {
//         event.preventDefault();
//         triggerCheck();
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [
//     canCheck,
//     hasFeedback,
//     isSubmitting,
//     question?.inputMode,
//     isCompareAnswerInput,
//     response?.activeField,
//     setResponse,
//     showUnknownButton,
//   ]);

//   useEffect(() => {
//     if (
//       hasFeedback ||
//       isSubmitting ||
//       question?.inputMode === "text_answer" ||
//       isCompareAnswerInput ||
//       response?.activeField
//     ) {
//       return;
//     }

//     const defaultField = getDefaultActiveField(question);
//     if (!defaultField) {
//       return;
//     }

//     setResponse((current) => ({
//       ...(current || {}),
//       activeField: defaultField,
//     }));
//   }, [
//     hasFeedback,
//     isSubmitting,
//     question,
//     isCompareAnswerInput,
//     response?.activeField,
//     setResponse,
//   ]);

//   return (
//     <div className="worksheet">
//       <div className="worksheet__topline">
//         <div className="worksheet__topline-main">
//           {question?.moduleStage === "practice" && (
//             <PracticeTabs activeKey={question?.practiceMode} />
//           )}

//           {isSchemaStage && (
//             <StageTabs currentStage={question?.stageIndex || 1} />
//           )}
//         </div>

//         <div className="worksheet-title">
//           {question?.promptTitle || "practice"}
//         </div>
//       </div>

//       {showPromptStrip && (
//         <div className="worksheet-prompt">{question?.text}</div>
//       )}

//       {(question?.moduleStage === "practice" ||
//         question?.moduleStage === "equations" ||
//         question?.moduleStage === "bar_to_equation" ||
//         question?.moduleStage === "schema_equation") && (
//         <>
//           {(question?.moduleStage === "bar_to_equation" ||
//             question?.moduleStage === "schema_equation") &&
//             question?.barModelSpec && (
//               <BarModel
//                 question={question}
//                 response={response}
//                 setResponse={setResponse}
//               />
//             )}
//           <EquationBoard
//             question={question}
//             response={response}
//             setResponse={setResponse}
//             locked={hasFeedback}
//           />
//         </>
//       )}

//       {(question?.moduleStage === "schema_bar_model" ||
//         question?.moduleStage === "word_to_bar") &&
//         (isCompareAnswerInput ? (
//           <>
//             <CompareGuidedAnswerModel question={question} />
//             <label className="worksheet-answer-field worksheet-answer-field--guided">
//               <span>{compareAnswerCopy.prompt}</span>
//               <input
//                 type="text"
//                 inputMode="numeric"
//                 value={getDisplayedTextAnswer(response)}
//                 onChange={(event) =>
//                   !hasFeedback &&
//                   setResponse((current) => ({
//                     ...(current || {}),
//                     textAnswer: event.target.value,
//                   }))
//                 }
//                 disabled={hasFeedback || isSubmitting}
//                 placeholder={compareAnswerCopy.placeholder}
//               />
//             </label>
//           </>
//         ) : (
//           <BarModel
//             question={question}
//             response={response}
//             setResponse={setResponse}
//           />
//         ))}

//       {question?.moduleStage === "schema_solve" && (
//         <div className="worksheet-solve">
//           <div className="worksheet-solve__equation">
//             {question?.validation?.displayEquation ||
//               question?.equationSpec?.displayEquation}
//           </div>
//           <label className="worksheet-answer-field">
//             <span>Your answer</span>
//             <input
//               type="text"
//               inputMode="numeric"
//               value={getDisplayedTextAnswer(response)}
//               onChange={(event) =>
//                 !hasFeedback &&
//                 setResponse((current) => ({
//                   ...(current || {}),
//                   textAnswer: event.target.value,
//                 }))
//               }
//               disabled={hasFeedback || isSubmitting}
//               placeholder="Your answer"
//             />
//           </label>
//         </div>
//       )}

//       {question?.inputMode !== "text_answer" && !isCompareAnswerInput && (
//         <Keypad
//           title={showOperatorPad ? "Choose the operator" : "Enter the number"}
//           showUnknown={showUnknownButton}
//           showOperatorPad={showOperatorPad}
//           onDigit={updateActiveSlotValue}
//           onUnknown={() => updateActiveSlotValue("?")}
//           onBackspace={handleBackspace}
//           onClear={handleClear}
//           onOperator={(operator) =>
//             setResponse((current) => ({ ...(current || {}), operator }))
//           }
//           disabled={hasFeedback || isSubmitting}
//         />
//       )}

//       {!hasFeedback &&
//         question?.inputMode !== "text_answer" &&
//         !isCompareAnswerInput &&
//         activeInputLabel && (
//           <div className="worksheet-target-hint">
//             Now filling: <strong>{activeInputLabel}</strong>
//           </div>
//         )}

//       {(isCompareAnswerInput
//         ? "Use the bars to work out the missing amount, then type your answer."
//         : question?.helperText) && (
//         <div className="worksheet-help">
//           {isCompareAnswerInput
//             ? "Use the bars to work out the missing amount, then type your answer."
//             : question?.helperText}
//         </div>
//       )}

//       {feedback && (
//         <div
//           className={`worksheet-feedback ${feedback.isCorrect ? "is-success" : "is-error"}`}
//         >
//           {feedback.isCorrect
//             ? feedback?.explanation || "Great job!"
//             : `Try again next time. Correct answer: ${feedback?.correctAnswer ?? ""}`}
//         </div>
//       )}

//       {feedback?.isCorrect && question?.moduleStage === "schema_solve" && (
//         <VerificationPanel question={question} />
//       )}

//       <div className="worksheet-actions">
//         {hasFeedback ? (
//           <div className="worksheet-button worksheet-button--status">
//             Loading next problem...
//           </div>
//         ) : (
//           <button
//             type="button"
//             className="worksheet-button worksheet-button--primary"
//             disabled={!canCheck}
//             onClick={triggerCheck}
//           >
//             {question?.moduleStage === "schema_solve"
//               ? "Check answer →"
//               : "Check ✓"}
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SchemaQuestion;
