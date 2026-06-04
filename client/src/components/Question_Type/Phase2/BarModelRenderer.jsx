// // BarModelRenderer.jsx
// import React from "react";
// import { getBarValue } from "../../../utils/questionValidation";
// import { BarBox } from "./WorksheetParts";
// import {
//   resolveTotalPartsMagnitudes,
//   getSegmentPercentages,
//   getBarLabel,
//   resolveCompareMagnitudes,
//   getExactTrackPercentages,
//   getGuidedCompareValue,
// } from "./SchemaUtils";

// const getExpectedVal = (q, box) => {
//   if (!box) return "";
//   let val = q?.validation?.slots?.[box.key];
//   if (val !== undefined && val !== null && String(val).trim() !== "") {
//     return String(val).trim();
//   }
//   return String(box.value || "").trim();
// };

// // const solveMath = (q, spec) => {
// //   const getNum = (box) => {
// //     let v = getExpectedVal(q, box);
// //     return v === "" || v === "?" ? NaN : Math.abs(parseFloat(v)); // absolute prevents negative bugs
// //   };

// //   // 🔥 THE FIX: Explicitly check if this is a Change schema so we don't accidentally hijack it into Total Parts
// //   const isChangeModel = q?.schemaKind === "change" || spec?.layout === "change";

// //   if (!isChangeModel && spec?.total) {
// //     // Total Parts is strictly addition logic
// //     const t = getNum(spec.total),
// //       l = getNum(spec.left),
// //       r = getNum(spec.right);
// //     if (isNaN(t) && !isNaN(l) && !isNaN(r)) return String(l + r);
// //     if (isNaN(l) && !isNaN(t) && !isNaN(r)) return String(Math.abs(t - r));
// //     if (isNaN(r) && !isNaN(t) && !isNaN(l)) return String(Math.abs(t - l));
// //   } else if (isChangeModel || spec?.change || spec?.right) {
// //     // Change Schema Math Logic
// //     let isSub = false;
// //     const startBox = spec?.start || spec?.left;
// //     const changeBox = spec?.change || spec?.right;
// //     const endBox = spec?.end || spec?.total || spec?.result;

// //     const label = String(changeBox?.label || "").toLowerCase();
// //     const endLabel = String(endBox?.label || "").toLowerCase();
// //     const words = [
// //       "spent",
// //       "flew",
// //       "away",
// //       "lost",
// //       "gave",
// //       "left",
// //       "remaining",
// //       "ate",
// //       "sold",
// //     ];

// //     for (let i = 0; i < words.length; i++) {
// //       if (label.includes(words[i]) || endLabel.includes(words[i])) {
// //         isSub = true;
// //         break;
// //       }
// //     }

// //     if (!isSub) {
// //       const op = q?.operator || q?.equationSpec?.operator;
// //       if (op === "-") isSub = true;
// //     }

// //     const s = getNum(startBox);
// //     const c = getNum(changeBox);
// //     const e = getNum(endBox);

// //     if (isSub) {
// //       // Subtraction Story: Start (Top) = End + Change
// //       if (isNaN(s) && !isNaN(e) && !isNaN(c)) return String(e + c);
// //       if (isNaN(e) && !isNaN(s) && !isNaN(c)) return String(Math.abs(s - c));
// //       if (isNaN(c) && !isNaN(s) && !isNaN(e)) return String(Math.abs(s - e));
// //     } else {
// //       // Addition Story: End (Top) = Start + Change
// //       if (isNaN(e) && !isNaN(s) && !isNaN(c)) return String(s + c);
// //       if (isNaN(s) && !isNaN(e) && !isNaN(c)) return String(Math.abs(e - c));
// //       if (isNaN(c) && !isNaN(e) && !isNaN(s)) return String(Math.abs(e - s));
// //     }
// //   }

// //   let ans = String(
// //     q?.answer || q?.correctAnswer || q?.equationSpec?.answer || "",
// //   ).trim();
// //   return ans && ans !== "?" ? ans : "";
// // };

// // const TotalPartsBarModel = ({
// //   spec,
// //   response,
// //   activeField,
// //   setActiveField,
// //   question,
// //   isAttempted,
// //   isDummyMode,
// //   isCorrect,
// //   isRevealed,
// // }) => {
// //   const {
// //     total: totalMagnitude,
// //     left: leftMagnitude,
// //     right: rightMagnitude,
// //   } = resolveTotalPartsMagnitudes(spec, response);
// //   const percentages = getSegmentPercentages(
// //     leftMagnitude,
// //     rightMagnitude,
// //     totalMagnitude,
// //   );

// //   const valTotal = getBarValue(response, spec.total);
// //   const valLeft = getBarValue(response, spec.left);
// //   const valRight = getBarValue(response, spec.right);

// //   const isBoxUnknown = (boxSpec) => {
// //     if (!boxSpec) return false;
// //     let expected = getExpectedVal(question, boxSpec);
// //     return expected === "?" || expected === "";
// //   };

// //   const getCorrectMathValue = (boxSpec) => {
// //     const expected = getExpectedVal(question, boxSpec);
// //     return expected === "?" || expected === ""
// //       ? solveMath(question, spec)
// //       : expected;
// //   };

// //   const getDisplayValue = (boxSpec, currentVal) => {
// //     const isUnk = isBoxUnknown(boxSpec);
// //     if (isRevealed || (isDummyMode && isCorrect && isUnk)) {
// //       return getCorrectMathValue(boxSpec);
// //     }
// //     return !isDummyMode ? response?.slots?.[boxSpec.key] || "" : currentVal;
// //   };

// //   const getFeedbackStatus = (boxKey, boxSpec) => {
// //     if (isRevealed) return null;
// //     if (!isAttempted) return null;
// //     // 🔥 UPDATE: Return "correct" on success to trigger pulse animation class
// //     if (isCorrect) return "correct";
// //     if (isDummyMode && boxSpec?.editable === false) return null;

// //     let expected = getExpectedVal(question, boxSpec);
// //     const student = String(response?.slots?.[boxKey] || "").trim();
// //     if (!student) return "wrong";
// //     if (expected === "?" || expected === "") {
// //       const calcAnswer = solveMath(question, spec);
// //       return student === calcAnswer && calcAnswer !== "" ? "correct" : "wrong";
// //     }
// //     return student === expected ? "correct" : "wrong";
// //   };

// //   const getBoxStyle = (box, isUnk, widthPercent, status) => {
// //     const style = widthPercent ? { width: `${widthPercent}%` } : {};

// //     // 🔥 ADDED: Amber style for manual reveal
// //     // if (isRevealed) {
// //     //   return {
// //     //     ...style,
// //     //     backgroundColor: "#fffbeb",
// //     //     border: "2.5px solid #fbbf24",
// //     //     color: "#92400e",
// //     //     fontWeight: "bold",
// //     //   };
// //     // }

// //     if (status === "correct")
// //       return {
// //         ...style,
// //         backgroundColor: "#f0fdf4",
// //         border: "2px solid #4ade80",
// //         color: "black",
// //       };
// //     if (status === "wrong")
// //       return {
// //         ...style,
// //         backgroundColor: "#fef2f2",
// //         border: "2px solid #f87171",
// //         color: "black",
// //       };

// //     // 🔥 UPDATE: Hide hashing if user wins (isCorrect)
// //     if (isDummyMode && isUnk && !isRevealed && !isCorrect) {
// //       return {
// //         ...style,
// //         backgroundColor: "white",
// //         backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(148, 163, 184, 0.15) 8px, rgba(148, 163, 184, 0.15) 10px)`,
// //         border: "2px dashed #94a3b8",
// //         color: "black",
// //       };
// //     }

// //     const colors = {
// //       green: "#f0fdf4",
// //       blue: "#eff6ff",
// //       orange: "#fff7ed",
// //       red: "#fef2f2",
// //     };
// //     return {
// //       ...style,
// //       backgroundColor: colors[box?.color] || "white",
// //       color: "black",
// //     };
// //   };

// //   return (
// //     <div className="bar-model bar-model--total-parts">
// //       {!spec.hideTopBar && (
// //         <div className="bar-model__top">
// //           <BarBox
// //             box={{
// //               ...spec.total,
// //               editable: !(
// //                 isDummyMode &&
// //                 (isBoxUnknown(spec.total) || isAttempted)
// //               ),
// //             }}
// //             label={getBarLabel(spec.total, spec)}
// //             value={getDisplayValue(spec.total, valTotal)}
// //             // 🔥 UPDATE: Hide cursor if won
// //             active={!isRevealed && !isCorrect && activeField === spec.total.key}
// //             onClick={() => {
// //               if (!(isDummyMode && (isBoxUnknown(spec.total) || isAttempted)))
// //                 setActiveField(spec.total.key);
// //             }}
// //             // 🔥 UPDATE: Remove hashing class if won
// //             className={`bar-box--wide ${isBoxUnknown(spec.total) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(spec.total.key, spec.total) === "correct" ? "is-correct" : getFeedbackStatus(spec.total.key, spec.total) === "wrong" ? "is-wrong" : ""}`}
// //             style={getBoxStyle(
// //               spec.total,
// //               isBoxUnknown(spec.total),
// //               null,
// //               getFeedbackStatus(spec.total.key, spec.total),
// //             )}
// //           />
// //         </div>
// //       )}
// //       <div className="bar-model__bottom">
// //         <BarBox
// //           box={{
// //             ...spec.left,
// //             editable: !(
// //               isDummyMode &&
// //               (isBoxUnknown(spec.left) || isAttempted)
// //             ),
// //           }}
// //           label={getBarLabel(spec.left, spec)}
// //           value={getDisplayValue(spec.left, valLeft)}
// //           active={!isRevealed && !isCorrect && activeField === spec.left.key}
// //           onClick={() => {
// //             if (!(isDummyMode && (isBoxUnknown(spec.left) || isAttempted)))
// //               setActiveField(spec.left.key);
// //           }}
// //           className={`bar-box--segment ${isBoxUnknown(spec.left) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(spec.left.key, spec.left) === "correct" ? "is-correct" : getFeedbackStatus(spec.left.key, spec.left) === "wrong" ? "is-wrong" : ""}`}
// //           style={getBoxStyle(
// //             spec.left,
// //             isBoxUnknown(spec.left),
// //             percentages.first,
// //             getFeedbackStatus(spec.left.key, spec.left),
// //           )}
// //         />
// //         <BarBox
// //           box={{
// //             ...spec.right,
// //             editable: !(
// //               isDummyMode &&
// //               (isBoxUnknown(spec.right) || isAttempted)
// //             ),
// //           }}
// //           label={getBarLabel(spec.right, spec)}
// //           value={getDisplayValue(spec.right, valRight)}
// //           active={!isRevealed && !isCorrect && activeField === spec.right.key}
// //           onClick={() => {
// //             if (!(isDummyMode && (isBoxUnknown(spec.right) || isAttempted)))
// //               setActiveField(spec.right.key);
// //           }}
// //           className={`bar-box--segment ${isBoxUnknown(spec.right) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(spec.right.key, spec.right) === "correct" ? "is-correct" : getFeedbackStatus(spec.right.key, spec.right) === "wrong" ? "is-wrong" : ""}`}
// //           style={getBoxStyle(
// //             spec.right,
// //             isBoxUnknown(spec.right),
// //             percentages.second,
// //             getFeedbackStatus(spec.right.key, spec.right),
// //           )}
// //         />
// //       </div>
// //     </div>
// //   );
// // };

// // const ChangeBarModel = ({
// //   spec,
// //   response,
// //   activeField,
// //   setActiveField,
// //   question,
// //   isAttempted,
// //   isDummyMode,
// //   isCorrect,
// //   isRevealed,
// // }) => {
// //   const isSubtraction = (() => {
// //     // Check words first to avoid backend operator bugs
// //     const label = String(
// //       spec?.change?.label || spec?.right?.label || "",
// //     ).toLowerCase();
// //     const endLabel = String(
// //       spec?.end?.label || spec?.total?.label || "",
// //     ).toLowerCase();
// //     const words = [
// //       "spent",
// //       "flew",
// //       "away",
// //       "lost",
// //       "gave",
// //       "left",
// //       "remaining",
// //       "ate",
// //       "sold",
// //     ];

// //     for (let i = 0; i < words.length; i++) {
// //       if (label.includes(words[i]) || endLabel.includes(words[i])) return true;
// //     }

// //     const op = question?.operator || question?.equationSpec?.operator;
// //     if (op === "-") return true;
// //     return false;
// //   })();

// //   const isMod1 = question?.moduleStage === "word_to_bar";
// //   const startBox = spec.start || spec.left;
// //   const changeBox = spec.change || spec.right;
// //   const endBox = spec.end || spec.total || spec.result;

// //   let topBox, b1, b2;
// //   if (isSubtraction) {
// //     topBox = startBox;
// //     b1 = endBox;
// //     b2 = changeBox;
// //   } else {
// //     topBox = endBox;
// //     b1 = startBox;
// //     b2 = changeBox;
// //   }

// //   const valTop = getBarValue(response, topBox);
// //   const valB1 = b1 ? getBarValue(response, b1) : "";
// //   const valB2 = b2 ? getBarValue(response, b2) : "";

// //   const isBoxUnknown = (boxSpec) => {
// //     if (!boxSpec) return false;
// //     let expected = getExpectedVal(question, boxSpec);
// //     return expected === "?" || expected === "";
// //   };

// //   const getCorrectMathValue = (boxSpec) => {
// //     const expected = getExpectedVal(question, boxSpec);
// //     return expected === "?" || expected === ""
// //       ? solveMath(question, spec)
// //       : expected;
// //   };

// //   const getDisplayValue = (boxSpec, currentVal) => {
// //     const isUnk = isBoxUnknown(boxSpec);
// //     if (isRevealed || (isDummyMode && isCorrect && isUnk)) {
// //       return getCorrectMathValue(boxSpec);
// //     }
// //     return !isDummyMode ? response?.slots?.[boxSpec.key] || "" : currentVal;
// //   };

// //   const getFeedbackStatus = (boxKey, boxSpec) => {
// //     if (isRevealed) return null;
// //     if (isCorrect) return "correct";
// //     if (!isAttempted) return null;
// //     if (isDummyMode && boxSpec?.editable === false) return null;

// //     let expected = getExpectedVal(question, boxSpec);
// //     const student = String(response?.slots?.[boxKey] || "").trim();
// //     if (!student) return "wrong";

// //     if (expected === "?" || expected === "") {
// //       const calcAnswer = solveMath(question, spec);
// //       return student === calcAnswer && calcAnswer !== "" ? "correct" : "wrong";
// //     }
// //     return student === expected ? "correct" : "wrong";
// //   };

// //   const getBoxStyle = (box, isUnk, widthPercent, status) => {
// //     const style = widthPercent ? { width: `${widthPercent}%` } : {};

// //     if (status === "correct")
// //       return {
// //         ...style,
// //         backgroundColor: "#f0fdf4",
// //         border: "2px solid #4ade80",
// //         color: "black",
// //       };
// //     if (status === "wrong")
// //       return {
// //         ...style,
// //         backgroundColor: "#fef2f2",
// //         border: "2px solid #f87171",
// //         color: "black",
// //       };

// //     if (isDummyMode && isUnk && !isRevealed && !isCorrect) {
// //       return {
// //         ...style,
// //         backgroundColor: "white",
// //         backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(148, 163, 184, 0.15) 8px, rgba(148, 163, 184, 0.15) 10px)`,
// //         border: "2px dashed #94a3b8",
// //         color: "black",
// //       };
// //     }

// //     const colors = {
// //       green: "#f0fdf4",
// //       blue: "#eff6ff",
// //       orange: "#fff7ed",
// //       red: "#fef2f2",
// //     };
// //     return {
// //       ...style,
// //       backgroundColor: colors[box?.color] || "white",
// //       color: "black",
// //     };
// //   };

// //   const totalMag = (b1?.magnitude || 50) + (b2?.magnitude || 50);

// //   return (
// //     <div
// //       className={`bar-model bar-model--change ${isMod1 ? "is-pill-model" : "is-solid-classic"}`}
// //     >
// //       <div className="bar-model__top">
// //         <BarBox
// //           box={{
// //             ...topBox,
// //             editable: !(isDummyMode && (isBoxUnknown(topBox) || isAttempted)),
// //           }}
// //           label={getBarLabel(topBox, spec)}
// //           value={getDisplayValue(topBox, valTop)}
// //           active={!isRevealed && !isCorrect && activeField === topBox.key}
// //           onClick={() => {
// //             if (!(isDummyMode && (isBoxUnknown(topBox) || isAttempted)))
// //               setActiveField(topBox.key);
// //           }}
// //           className={`bar-box--wide ${isBoxUnknown(topBox) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(topBox.key, topBox) === "correct" ? "is-correct" : getFeedbackStatus(topBox.key, topBox) === "wrong" ? "is-wrong" : ""}`}
// //           style={getBoxStyle(
// //             topBox,
// //             isBoxUnknown(topBox),
// //             null,
// //             getFeedbackStatus(topBox.key, topBox),
// //           )}
// //         />
// //       </div>
// //       <div className="bar-model__bottom">
// //         {b1 && (
// //           <BarBox
// //             box={{
// //               ...b1,
// //               editable: !(isDummyMode && (isBoxUnknown(b1) || isAttempted)),
// //             }}
// //             label={getBarLabel(b1, spec)}
// //             value={getDisplayValue(b1, valB1)}
// //             active={!isRevealed && !isCorrect && activeField === b1.key}
// //             onClick={() => {
// //               if (!(isDummyMode && (isBoxUnknown(b1) || isAttempted)))
// //                 setActiveField(b1.key);
// //             }}
// //             className={`bar-box--segment ${isBoxUnknown(b1) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(b1.key, b1) === "correct" ? "is-correct" : getFeedbackStatus(b1.key, b1) === "wrong" ? "is-wrong" : ""}`}
// //             style={getBoxStyle(
// //               b1,
// //               isBoxUnknown(b1),
// //               ((b1?.magnitude || 50) / totalMag) * 100,
// //               getFeedbackStatus(b1.key, b1),
// //             )}
// //           />
// //         )}
// //         {b2 && (
// //           <BarBox
// //             box={{
// //               ...b2,
// //               editable: !(isDummyMode && (isBoxUnknown(b2) || isAttempted)),
// //             }}
// //             label={getBarLabel(b2, spec)}
// //             value={getDisplayValue(b2, valB2)}
// //             active={!isRevealed && !isCorrect && activeField === b2.key}
// //             onClick={() => {
// //               if (!(isDummyMode && (isBoxUnknown(b2) || isAttempted)))
// //                 setActiveField(b2.key);
// //             }}
// //             className={`bar-box--segment ${isMod1 ? "bar-box--tray-pill token-2" : ""} ${isBoxUnknown(b2) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(b2.key, b2) === "correct" ? "is-correct" : getFeedbackStatus(b2.key, b2) === "wrong" ? "is-wrong" : ""}`}
// //             style={getBoxStyle(
// //               b2,
// //               isBoxUnknown(b2),
// //               ((b2?.magnitude || 50) / totalMag) * 100,
// //               getFeedbackStatus(b2.key, b2),
// //             )}
// //           />
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// const solveMath = (q, spec, forceSub = null) => {
//   const getNum = (box) => {
//     let v = getExpectedVal(q, box);
//     return v === "" || v === "?" ? NaN : Math.abs(parseFloat(v));
//   };

//   const isChangeModel =
//     q?.schemaKind === "change" || spec?.layout === "change" || spec?.change;

//   if (!isChangeModel && spec?.total) {
//     const t = getNum(spec.total),
//       l = getNum(spec.left),
//       r = getNum(spec.right);
//     if (isNaN(t) && !isNaN(l) && !isNaN(r)) return String(l + r);
//     if (isNaN(l) && !isNaN(t) && !isNaN(r)) return String(Math.abs(t - r));
//     if (isNaN(r) && !isNaN(t) && !isNaN(l)) return String(Math.abs(t - l));
//   } else if (isChangeModel) {
//     const s = getNum(spec?.start || spec?.left);
//     const c = getNum(spec?.change || spec?.right);
//     const e = getNum(spec?.end || spec?.total || spec?.result);

//     let isSub =
//       forceSub !== null
//         ? forceSub
//         : q?.operator === "-" || q?.equationSpec?.operator === "-";

//     if (isSub) {
//       if (isNaN(s) && !isNaN(e) && !isNaN(c)) return String(e + c);
//       if (isNaN(e) && !isNaN(s) && !isNaN(c)) return String(Math.abs(s - c));
//       if (isNaN(c) && !isNaN(s) && !isNaN(e)) return String(Math.abs(s - e));
//     } else {
//       if (isNaN(e) && !isNaN(s) && !isNaN(c)) return String(s + c);
//       if (isNaN(s) && !isNaN(e) && !isNaN(c)) return String(Math.abs(e - c));
//       if (isNaN(c) && !isNaN(e) && !isNaN(s)) return String(Math.abs(e - s));
//     }
//   }

//   let ans = String(
//     q?.answer || q?.correctAnswer || q?.equationSpec?.answer || "",
//   ).trim();
//   return ans && ans !== "?" ? ans : "";
// };

// const TotalPartsBarModel = ({
//   spec,
//   response,
//   activeField,
//   setActiveField,
//   question,
//   isAttempted,
//   isDummyMode,
//   isCorrect,
//   isRevealed,
//   isReadOnly, // 🔥 NEW PROP
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

//   const valTotal = getBarValue(response, spec.total);
//   const valLeft = getBarValue(response, spec.left);
//   const valRight = getBarValue(response, spec.right);

//   const isBoxUnknown = (boxSpec) => {
//     if (!boxSpec) return false;
//     let expected = getExpectedVal(question, boxSpec);
//     return expected === "?" || expected === "";
//   };

//   const getCorrectMathValue = (boxSpec) => {
//     const expected = getExpectedVal(question, boxSpec);
//     return expected === "?" || expected === "" ? "?" : expected;
//   };

//   const getDisplayValue = (boxSpec, currentVal) => {
//     // 🔥 If Read-Only, force display of the correct/hint value immediately
//     if (isReadOnly) {
//       let expected = getExpectedVal(question, boxSpec);
//       return expected === "" ? "?" : expected;
//     }
//     const isUnk = isBoxUnknown(boxSpec);
//     if (isRevealed || (isDummyMode && isCorrect && isUnk)) {
//       return getCorrectMathValue(boxSpec);
//     }
//     if (isDummyMode) {
//       if (response?.slots && response.slots[boxSpec.key] !== undefined) {
//         return response.slots[boxSpec.key];
//       }
//       return currentVal === "?" ? "" : currentVal;
//     }
//     return response?.slots?.[boxSpec.key] || "";
//   };

//   const getFeedbackStatus = (boxKey, boxSpec) => {
//     if (isReadOnly) return null; // 🔥 Read-Only boxes don't get red/green feedback
//     if (isRevealed) return null;
//     if (!isAttempted) return null;
//     if (isCorrect) return "correct";
//     if (isDummyMode && boxSpec?.editable === false) return null;

//     let expected = getExpectedVal(question, boxSpec);
//     const student = String(response?.slots?.[boxKey] || "").trim();
//     if (!student) return "wrong";
//     if (expected === "?" || expected === "") {
//       const calcAnswer = solveMath(question, spec);
//       return student === calcAnswer && calcAnswer !== "" ? "correct" : "wrong";
//     }
//     return student === expected ? "correct" : "wrong";
//   };

//   const getBoxStyle = (box, isUnk, widthPercent, status) => {
//     const style = widthPercent ? { width: `${widthPercent}%` } : {};

//     if (status === "correct")
//       return {
//         ...style,
//         backgroundColor: "#f0fdf4",
//         border: "2px solid #4ade80",
//         color: "black",
//       };
//     if (status === "wrong")
//       return {
//         ...style,
//         backgroundColor: "#fef2f2",
//         border: "2px solid #f87171",
//         color: "black",
//       };

//     if (isDummyMode && isUnk && !isRevealed && !isCorrect) {
//       return {
//         ...style,
//         backgroundColor: "white",
//         backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(148, 163, 184, 0.15) 8px, rgba(148, 163, 184, 0.15) 10px)`,
//         border: "2px dashed #94a3b8",
//         color: "black",
//       };
//     }

//     const colors = {
//       green: "#f0fdf4",
//       blue: "#eff6ff",
//       orange: "#fff7ed",
//       red: "#fef2f2",
//     };
//     return {
//       ...style,
//       backgroundColor: colors[box?.color] || "white",
//       color: "black",
//     };
//   };

//   return (
//     <div className="bar-model bar-model--total-parts">
//       {!spec.hideTopBar && (
//         <div className="bar-model__top">
//           <BarBox
//             box={{
//               ...spec.total,
//               // 🔥 Disable clicks entirely if read-only
//               editable: !(
//                 isReadOnly ||
//                 (isDummyMode && (isBoxUnknown(spec.total) || isAttempted))
//               ),
//             }}
//             label={getBarLabel(spec.total, spec)}
//             value={getDisplayValue(spec.total, valTotal)}
//             active={
//               !isReadOnly &&
//               !isRevealed &&
//               !isCorrect &&
//               (!isAttempted || isDummyMode) &&
//               activeField === spec.total.key
//             }
//             onClick={() => {
//               if (isReadOnly) return;
//               if (!(isDummyMode && (isBoxUnknown(spec.total) || isAttempted)))
//                 setActiveField(spec.total.key);
//             }}
//             // 🔥 Prevent missing-value hashing class when read-only
//             className={`bar-box--wide ${!isReadOnly && isBoxUnknown(spec.total) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(spec.total.key, spec.total) === "correct" ? "is-correct" : getFeedbackStatus(spec.total.key, spec.total) === "wrong" ? "is-wrong" : ""}`}
//             style={getBoxStyle(
//               spec.total,
//               isReadOnly ? false : isBoxUnknown(spec.total),
//               null,
//               getFeedbackStatus(spec.total.key, spec.total),
//             )}
//           />
//         </div>
//       )}
//       <div className="bar-model__bottom">
//         <BarBox
//           box={{
//             ...spec.left,
//             editable: !(
//               isReadOnly ||
//               (isDummyMode && (isBoxUnknown(spec.left) || isAttempted))
//             ),
//           }}
//           label={getBarLabel(spec.left, spec)}
//           value={getDisplayValue(spec.left, valLeft)}
//           active={
//             !isReadOnly &&
//             !isRevealed &&
//             !isCorrect &&
//             (!isAttempted || isDummyMode) &&
//             activeField === spec.left.key
//           }
//           onClick={() => {
//             if (isReadOnly) return;
//             if (!(isDummyMode && (isBoxUnknown(spec.left) || isAttempted)))
//               setActiveField(spec.left.key);
//           }}
//           className={`bar-box--segment ${!isReadOnly && isBoxUnknown(spec.left) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(spec.left.key, spec.left) === "correct" ? "is-correct" : getFeedbackStatus(spec.left.key, spec.left) === "wrong" ? "is-wrong" : ""}`}
//           style={getBoxStyle(
//             spec.left,
//             isReadOnly ? false : isBoxUnknown(spec.left),
//             percentages.first,
//             getFeedbackStatus(spec.left.key, spec.left),
//           )}
//         />
//         <BarBox
//           box={{
//             ...spec.right,
//             editable: !(
//               isReadOnly ||
//               (isDummyMode && (isBoxUnknown(spec.right) || isAttempted))
//             ),
//           }}
//           label={getBarLabel(spec.right, spec)}
//           value={getDisplayValue(spec.right, valRight)}
//           active={
//             !isReadOnly &&
//             !isRevealed &&
//             !isCorrect &&
//             (!isAttempted || isDummyMode) &&
//             activeField === spec.right.key
//           }
//           onClick={() => {
//             if (isReadOnly) return;
//             if (!(isDummyMode && (isBoxUnknown(spec.right) || isAttempted)))
//               setActiveField(spec.right.key);
//           }}
//           className={`bar-box--segment ${!isReadOnly && isBoxUnknown(spec.right) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(spec.right.key, spec.right) === "correct" ? "is-correct" : getFeedbackStatus(spec.right.key, spec.right) === "wrong" ? "is-wrong" : ""}`}
//           style={getBoxStyle(
//             spec.right,
//             isReadOnly ? false : isBoxUnknown(spec.right),
//             percentages.second,
//             getFeedbackStatus(spec.right.key, spec.right),
//           )}
//         />
//       </div>
//     </div>
//   );
// };

// const ChangeBarModel = ({
//   spec,
//   response,
//   activeField,
//   setActiveField,
//   question,
//   isAttempted,
//   isDummyMode,
//   isCorrect,
//   isRevealed,
//   isReadOnly, // 🔥 NEW PROP
// }) => {
//   const isSubtraction = (() => {
//     const label = String(
//       spec?.change?.label || spec?.right?.label || "",
//     ).toLowerCase();
//     const endLabel = String(
//       spec?.end?.label || spec?.total?.label || "",
//     ).toLowerCase();
//     const words = [
//       "spent",
//       "flew",
//       "away",
//       "lost",
//       "gave",
//       "left",
//       "remaining",
//       "ate",
//       "sold",
//     ];

//     for (let i = 0; i < words.length; i++) {
//       if (label.includes(words[i]) || endLabel.includes(words[i])) return true;
//     }

//     const op = question?.operator || question?.equationSpec?.operator;
//     if (op === "-") return true;
//     return false;
//   })();

//   const isMod1 = question?.moduleStage === "word_to_bar";
//   const startBox = spec.start || spec.left;
//   const changeBox = spec.change || spec.right;
//   const endBox = spec.end || spec.total || spec.result;

//   let topBox, b1, b2;
//   if (isSubtraction) {
//     topBox = startBox;
//     b1 = endBox;
//     b2 = changeBox;
//   } else {
//     topBox = endBox;
//     b1 = startBox;
//     b2 = changeBox;
//   }

//   const valTop = getBarValue(response, topBox);
//   const valB1 = b1 ? getBarValue(response, b1) : "";
//   const valB2 = b2 ? getBarValue(response, b2) : "";

//   const isBoxUnknown = (boxSpec) => {
//     if (!boxSpec) return false;
//     let expected = getExpectedVal(question, boxSpec);
//     return expected === "?" || expected === "";
//   };

//   const getCorrectMathValue = (boxSpec) => {
//     const expected = getExpectedVal(question, boxSpec);
//     return expected === "?" || expected === "" ? "?" : expected;
//   };

//   const getDisplayValue = (boxSpec, currentVal) => {
//     // 🔥 If Read-Only, force display of the correct/hint value immediately
//     if (isReadOnly) {
//       let expected = getExpectedVal(question, boxSpec);
//       return expected === "" ? "?" : expected;
//     }
//     const isUnk = isBoxUnknown(boxSpec);
//     if (isRevealed || (isDummyMode && isCorrect && isUnk)) {
//       return getCorrectMathValue(boxSpec);
//     }
//     if (isDummyMode) {
//       if (response?.slots && response.slots[boxSpec.key] !== undefined) {
//         return response.slots[boxSpec.key];
//       }
//       return currentVal === "?" ? "" : currentVal;
//     }
//     return response?.slots?.[boxSpec.key] || "";
//   };

//   const getFeedbackStatus = (boxKey, boxSpec) => {
//     if (isReadOnly) return null; // 🔥 Read-Only boxes don't get red/green feedback
//     if (isRevealed) return null;
//     if (isCorrect) return "correct";
//     if (!isAttempted) return null;
//     if (isDummyMode && boxSpec?.editable === false) return null;

//     let expected = getExpectedVal(question, boxSpec);
//     const student = String(response?.slots?.[boxKey] || "").trim();
//     if (!student) return "wrong";

//     if (expected === "?" || expected === "") {
//       const calcAnswer = solveMath(question, spec, isSubtraction);
//       return student === calcAnswer && calcAnswer !== "" ? "correct" : "wrong";
//     }
//     return student === expected ? "correct" : "wrong";
//   };

//   const getBoxStyle = (box, isUnk, widthPercent, status) => {
//     const style = widthPercent ? { width: `${widthPercent}%` } : {};

//     if (status === "correct")
//       return {
//         ...style,
//         backgroundColor: "#f0fdf4",
//         border: "2px solid #4ade80",
//         color: "black",
//       };
//     if (status === "wrong")
//       return {
//         ...style,
//         backgroundColor: "#fef2f2",
//         border: "2px solid #f87171",
//         color: "black",
//       };

//     if (isDummyMode && isUnk && !isRevealed && !isCorrect) {
//       return {
//         ...style,
//         backgroundColor: "white",
//         backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(148, 163, 184, 0.15) 8px, rgba(148, 163, 184, 0.15) 10px)`,
//         border: "2px dashed #94a3b8",
//         color: "black",
//       };
//     }

//     const colors = {
//       green: "#f0fdf4",
//       blue: "#eff6ff",
//       orange: "#fff7ed",
//       red: "#fef2f2",
//     };
//     return {
//       ...style,
//       backgroundColor: colors[box?.color] || "white",
//       color: "black",
//     };
//   };

//   const totalMag = (b1?.magnitude || 50) + (b2?.magnitude || 50);

//   return (
//     <div
//       className={`bar-model bar-model--change ${isMod1 ? "is-pill-model" : "is-solid-classic"}`}
//     >
//       <div className="bar-model__top">
//         <BarBox
//           box={{
//             ...topBox,
//             editable: !(
//               isReadOnly ||
//               (isDummyMode && (isBoxUnknown(topBox) || isAttempted))
//             ),
//           }}
//           label={getBarLabel(topBox, spec)}
//           value={getDisplayValue(topBox, valTop)}
//           active={
//             !isReadOnly &&
//             !isRevealed &&
//             !isCorrect &&
//             (!isAttempted || isDummyMode) &&
//             activeField === topBox.key
//           }
//           onClick={() => {
//             if (isReadOnly) return;
//             if (!(isDummyMode && (isBoxUnknown(topBox) || isAttempted)))
//               setActiveField(topBox.key);
//           }}
//           className={`bar-box--wide ${!isReadOnly && isBoxUnknown(topBox) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(topBox.key, topBox) === "correct" ? "is-correct" : getFeedbackStatus(topBox.key, topBox) === "wrong" ? "is-wrong" : ""}`}
//           style={getBoxStyle(
//             topBox,
//             isReadOnly ? false : isBoxUnknown(topBox),
//             null,
//             getFeedbackStatus(topBox.key, topBox),
//           )}
//         />
//       </div>
//       <div className="bar-model__bottom">
//         {b1 && (
//           <BarBox
//             box={{
//               ...b1,
//               editable: !(
//                 isReadOnly ||
//                 (isDummyMode && (isBoxUnknown(b1) || isAttempted))
//               ),
//             }}
//             label={getBarLabel(b1, spec)}
//             value={getDisplayValue(b1, valB1)}
//             active={
//               !isReadOnly &&
//               !isRevealed &&
//               !isCorrect &&
//               (!isAttempted || isDummyMode) &&
//               activeField === b1.key
//             }
//             onClick={() => {
//               if (isReadOnly) return;
//               if (!(isDummyMode && (isBoxUnknown(b1) || isAttempted)))
//                 setActiveField(b1.key);
//             }}
//             className={`bar-box--segment ${!isReadOnly && isBoxUnknown(b1) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(b1.key, b1) === "correct" ? "is-correct" : getFeedbackStatus(b1.key, b1) === "wrong" ? "is-wrong" : ""}`}
//             style={getBoxStyle(
//               b1,
//               isReadOnly ? false : isBoxUnknown(b1),
//               ((b1?.magnitude || 50) / totalMag) * 100,
//               getFeedbackStatus(b1.key, b1),
//             )}
//           />
//         )}
//         {b2 && (
//           <BarBox
//             box={{
//               ...b2,
//               editable: !(
//                 isReadOnly ||
//                 (isDummyMode && (isBoxUnknown(b2) || isAttempted))
//               ),
//             }}
//             label={getBarLabel(b2, spec)}
//             value={getDisplayValue(b2, valB2)}
//             active={
//               !isReadOnly &&
//               !isRevealed &&
//               !isCorrect &&
//               (!isAttempted || isDummyMode) &&
//               activeField === b2.key
//             }
//             onClick={() => {
//               if (isReadOnly) return;
//               if (!(isDummyMode && (isBoxUnknown(b2) || isAttempted)))
//                 setActiveField(b2.key);
//             }}
//             className={`bar-box--segment ${isMod1 ? "bar-box--tray-pill token-2" : ""} ${!isReadOnly && isBoxUnknown(b2) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(b2.key, b2) === "correct" ? "is-correct" : getFeedbackStatus(b2.key, b2) === "wrong" ? "is-wrong" : ""}`}
//             style={getBoxStyle(
//               b2,
//               isReadOnly ? false : isBoxUnknown(b2),
//               ((b2?.magnitude || 50) / totalMag) * 100,
//               getFeedbackStatus(b2.key, b2),
//             )}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// const CompareStackedBarModel = ({
//   spec,
//   response,
//   activeField,
//   setActiveField,
//   question,
//   isAttempted,
//   isCorrect,
//   isRevealed,
//   isDummyMode,
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

//   const isBoxUnknown = (boxSpec) => {
//     if (!boxSpec) return false;
//     let expected = getExpectedVal(question, boxSpec);
//     return expected === "?" || expected === "";
//   };

//   const isActive = (key) =>
//     !isRevealed &&
//     !isCorrect &&
//     (!isAttempted || isDummyMode) &&
//     activeField === key;

//   return (
//     <div className="bar-model bar-model--compare">
//       <div className="bar-model__compare-top">
//         <BarBox
//           box={spec.bigger}
//           label={getBarLabel(spec.bigger, spec)}
//           value={
//             isRevealed && isBoxUnknown(spec.bigger)
//               ? "?"
//               : getBarValue(response, spec.bigger)
//           }
//           active={isActive(spec.bigger.key)}
//           onClick={() => setActiveField(spec.bigger.key)}
//           className="bar-box--wide"
//         />
//       </div>
//       <div className="bar-model__compare-bottom">
//         <div className="bar-model__compare-row">
//           <BarBox
//             box={spec.smaller}
//             label={getBarLabel(spec.smaller, spec)}
//             value={
//               isRevealed && isBoxUnknown(spec.smaller)
//                 ? "?"
//                 : getBarValue(response, spec.smaller)
//             }
//             active={isActive(spec.smaller.key)}
//             onClick={() => setActiveField(spec.smaller.key)}
//             className="bar-box--segment"
//             style={{ flex: `0 0 ${percentages.first}%` }}
//           />
//           <BarBox
//             box={spec.difference}
//             label={getBarLabel(spec.difference, spec)}
//             value={
//               isRevealed && isBoxUnknown(spec.difference)
//                 ? "?"
//                 : getBarValue(response, spec.difference)
//             }
//             active={isActive(spec.difference.key)}
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

// const CompareGapSegment = ({ box, label, value, active, onClick, style }) => {
//   const displayValue =
//     box.editable && String(value || "").trim() === "?" ? "" : value;

//   return (
//     <div
//       className={`compare-gap__left ${box.editable ? "is-editable" : ""} ${active ? "is-active" : ""} ${box.accent === "unknown" ? "is-unknown" : ""}`}
//       style={style}
//     >
//       <button
//         type="button"
//         className={`bar-box bar-box--${box.color} ${box.editable ? "is-editable" : ""} ${active ? "is-active" : ""} ${displayValue ? "is-filled" : ""} ${box.accent === "unknown" ? "is-unknown" : ""}`}
//         onClick={onClick}
//         disabled={!box.editable}
//         style={style}
//       >
//         <strong>
//           {displayValue || <span className="hide-on-focus">?</span>}
//         </strong>{" "}
//         <span>{label}</span>
//       </button>
//     </div>
//   );
// };

// const CompareGapBarModel = ({
//   spec,
//   response,
//   activeField,
//   setActiveField,
//   question,
//   isAttempted,
//   isCorrect,
//   isRevealed,
//   isDummyMode,
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

//   const isBoxUnknown = (boxSpec) => {
//     if (!boxSpec) return false;
//     let expected = getExpectedVal(question, boxSpec);
//     return expected === "?" || expected === "";
//   };

//   const isActive = (key) =>
//     !isRevealed &&
//     !isCorrect &&
//     (!isAttempted || isDummyMode) &&
//     activeField === key;

//   return (
//     <div className="bar-model bar-model--compare-gap">
//       <div className="bar-model__compare-top">
//         <BarBox
//           box={spec.bigger}
//           label={getBarLabel(spec.bigger, spec)}
//           value={
//             isRevealed && isBoxUnknown(spec.bigger)
//               ? "?"
//               : getBarValue(response, spec.bigger)
//           }
//           active={isActive(spec.bigger.key)}
//           onClick={() => setActiveField(spec.bigger.key)}
//           className="bar-box--wide"
//         />
//       </div>
//       <div className="bar-model__compare-gap-track">
//         <div
//           className={`compare-gap__measure compare-gap__measure--track ${isActive(spec.smaller.key) ? "is-active" : ""}`}
//           style={{ width: `${guideWidth}%` }}
//           aria-hidden="true"
//         />
//         <CompareGapSegment
//           box={spec.smaller}
//           label={getBarLabel(spec.smaller, spec)}
//           value={
//             isRevealed && isBoxUnknown(spec.smaller)
//               ? "?"
//               : getBarValue(response, spec.smaller)
//           }
//           active={isActive(spec.smaller.key)}
//           onClick={() => setActiveField(spec.smaller.key)}
//           style={{ flex: `0 0 ${percentages.first}%` }}
//         />
//         <BarBox
//           box={spec.difference}
//           label={getBarLabel(spec.difference, spec)}
//           value={
//             isRevealed && isBoxUnknown(spec.difference)
//               ? "?"
//               : getBarValue(response, spec.difference)
//           }
//           active={isActive(spec.difference.key)}
//           onClick={() => setActiveField(spec.difference.key)}
//           className="bar-box--segment compare-gap__difference"
//           style={{ flex: `0 0 ${percentages.second}%` }}
//         />
//       </div>
//     </div>
//   );
// };

// export const CompareGuidedAnswerModel = ({ question }) => {
//   const spec = question?.barModelSpec;
//   if (!spec) return null;

//   const percentages = getExactTrackPercentages(
//     spec?.smaller?.magnitude,
//     spec?.difference?.magnitude,
//     spec?.bigger?.magnitude,
//   );
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

// // const BarModel = ({
// //   question,
// //   response,
// //   setResponse,
// //   isAttempted,
// //   isCorrect,
// //   targetField,
// //   isDummyMode,
// //   isRevealed,
// // }) => {
// //   const spec = question?.barModelSpec;
// //   if (!spec) return null;

// //   const setActiveField = (field) =>
// //     setResponse((current) => ({ ...(current || {}), activeField: field }));

// //   if (question?.schemaKind === "change" || spec.layout === "change") {
// //     return (
// //       <ChangeBarModel
// //         spec={spec}
// //         response={response}
// //         activeField={response?.activeField}
// //         setActiveField={setActiveField}
// //         question={question}
// //         isAttempted={isAttempted}
// //         isCorrect={isCorrect} // Passes the true/false value
// //         targetField={targetField}
// //         isDummyMode={isDummyMode}
// //         isRevealed={isRevealed}
// //       />
// //     );
// //   }

// //   if (
// //     spec.layout === "compare_offset" &&
// //     spec.compareVariant === "fewer_than_gap"
// //   ) {
// //     return (
// //       <CompareGapBarModel
// //         spec={spec}
// //         response={response}
// //         activeField={response?.activeField}
// //         setActiveField={setActiveField}
// //       />
// //     );
// //   }

// //   if (spec.layout === "compare_offset") {
// //     return (
// //       <CompareStackedBarModel
// //         spec={spec}
// //         response={response}
// //         activeField={response?.activeField}
// //         setActiveField={setActiveField}
// //       />
// //     );
// //   }

// //   return (
// //     <TotalPartsBarModel
// //       spec={spec}
// //       response={response}
// //       activeField={response?.activeField}
// //       setActiveField={setActiveField}
// //       question={question}
// //       isAttempted={isAttempted}
// //       isCorrect={isCorrect} // Passes the true/false value
// //       targetField={targetField}
// //       isDummyMode={isDummyMode}
// //       isRevealed={isRevealed}
// //     />
// //   );
// // };

// const BarModel = ({
//   question,
//   response,
//   setResponse,
//   isAttempted,
//   isCorrect,
//   targetField,
//   isDummyMode,
//   isRevealed,
//   isReadOnly, // 🔥 NEW PROP
// }) => {
//   const spec = question?.barModelSpec;
//   if (!spec) return null;

//   const setActiveField = (field) =>
//     setResponse((current) => ({ ...(current || {}), activeField: field }));

//   if (question?.schemaKind === "change" || spec.layout === "change") {
//     return (
//       <ChangeBarModel
//         spec={spec}
//         response={response}
//         activeField={response?.activeField}
//         setActiveField={setActiveField}
//         question={question}
//         isAttempted={isAttempted}
//         isCorrect={isCorrect}
//         targetField={targetField}
//         isDummyMode={isDummyMode}
//         isRevealed={isRevealed}
//         isReadOnly={isReadOnly} // 🔥 Pass down
//       />
//     );
//   }

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
//         question={question}
//         isAttempted={isAttempted}
//         isCorrect={isCorrect}
//         isRevealed={isRevealed}
//         isDummyMode={isDummyMode}
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
//         question={question}
//         isAttempted={isAttempted}
//         isCorrect={isCorrect}
//         isRevealed={isRevealed}
//         isDummyMode={isDummyMode}
//       />
//     );
//   }

//   return (
//     <TotalPartsBarModel
//       spec={spec}
//       response={response}
//       activeField={response?.activeField}
//       setActiveField={setActiveField}
//       question={question}
//       isAttempted={isAttempted}
//       isCorrect={isCorrect}
//       targetField={targetField}
//       isDummyMode={isDummyMode}
//       isRevealed={isRevealed}
//       isReadOnly={isReadOnly} // 🔥 Pass down
//     />
//   );
// };

// export default BarModel;

// BarModelRenderer.jsx
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useSchemaProgress } from "../../../hooks/useSchemaProgress";
import React from "react";
import { getBarValue } from "../../../utils/questionValidation";
import { BarBox } from "./WorksheetParts";
import {
  resolveTotalPartsMagnitudes,
  getSegmentPercentages,
  getBarLabel,
  resolveCompareMagnitudes,
  getExactTrackPercentages,
  getGuidedCompareValue,
} from "./SchemaUtils";

const getExpectedVal = (q, box) => {
  if (!box) return "";
  let val = q?.validation?.slots?.[box.key];
  if (val !== undefined && val !== null && String(val).trim() !== "") {
    return String(val).trim();
  }
  return String(box.value || "").trim();
};

const solveMath = (q, spec, forceSub = null) => {
  const getNum = (box) => {
    let v = getExpectedVal(q, box);
    return v === "" || v === "?" ? NaN : Math.abs(parseFloat(v));
  };

  const isChangeModel =
    q?.schemaKind === "change" || spec?.layout === "change" || spec?.change;

  if (!isChangeModel && spec?.total) {
    const t = getNum(spec.total),
      l = getNum(spec.left),
      r = getNum(spec.right);
    if (isNaN(t) && !isNaN(l) && !isNaN(r)) return String(l + r);
    if (isNaN(l) && !isNaN(t) && !isNaN(r)) return String(Math.abs(t - r));
    if (isNaN(r) && !isNaN(t) && !isNaN(l)) return String(Math.abs(t - l));
  } else if (isChangeModel) {
    const s = getNum(spec?.start || spec?.left);
    const c = getNum(spec?.change || spec?.right);
    const e = getNum(spec?.end || spec?.total || spec?.result);

    let isSub =
      forceSub !== null
        ? forceSub
        : q?.operator === "-" || q?.equationSpec?.operator === "-";

    if (isSub) {
      if (isNaN(s) && !isNaN(e) && !isNaN(c)) return String(e + c);
      if (isNaN(e) && !isNaN(s) && !isNaN(c)) return String(Math.abs(s - c));
      if (isNaN(c) && !isNaN(s) && !isNaN(e)) return String(Math.abs(s - e));
    } else {
      if (isNaN(e) && !isNaN(s) && !isNaN(c)) return String(s + c);
      if (isNaN(s) && !isNaN(e) && !isNaN(c)) return String(Math.abs(e - c));
      if (isNaN(c) && !isNaN(e) && !isNaN(s)) return String(Math.abs(e - s));
    }
  }

  let ans = String(
    q?.answer || q?.correctAnswer || q?.equationSpec?.answer || "",
  ).trim();
  return ans && ans !== "?" ? ans : "";
};

// Combine Bar Modal
const TotalPartsBarModel = ({
  spec,
  response,
  activeField,
  setActiveField,
  question,
  isAttempted,
  isDummyMode,
  isCorrect,
  isRevealed,
  isReadOnly,
  isGhostHint, // 🔥 Catching this
  markCompleted, // 🔥 Catching this
}) => {
  const {
    total: totalMagnitude,
    left: leftMagnitude,
    right: rightMagnitude,
  } = resolveTotalPartsMagnitudes(spec, response);
  const percentages = getSegmentPercentages(
    leftMagnitude,
    rightMagnitude,
    totalMagnitude,
  );

  const valTotal = getBarValue(response, spec.total);
  const valLeft = getBarValue(response, spec.left);
  const valRight = getBarValue(response, spec.right);

  const isBoxUnknown = (boxSpec) => {
    if (!boxSpec) return false;
    let expected = getExpectedVal(question, boxSpec);
    return expected === "?" || expected === "";
  };

  const getCorrectMathValue = (boxSpec) => {
    const expected = getExpectedVal(question, boxSpec);
    return expected === "?" || expected === "" ? "?" : expected;
  };

  const getDisplayValue = (boxSpec, currentVal) => {
    // 🔥 If Read-Only, force display of the correct/hint value immediately
    if (isReadOnly) {
      let expected = getExpectedVal(question, boxSpec);
      return expected === "" ? "?" : expected;
    }
    const isUnk = isBoxUnknown(boxSpec);
    if (isRevealed || (isDummyMode && isCorrect && isUnk)) {
      return getCorrectMathValue(boxSpec);
    }
    if (isDummyMode) {
      if (response?.slots && response.slots[boxSpec.key] !== undefined) {
        return response.slots[boxSpec.key];
      }
      return currentVal === "?" ? "" : currentVal;
    }
    return response?.slots?.[boxSpec.key] || "";
  };

  const getFeedbackStatus = (boxKey, boxSpec) => {
    if (isReadOnly) return null; // 🔥 Read-Only boxes don't get red/green feedback
    if (isRevealed) return null;
    if (!isAttempted) return null;
    if (isCorrect) return "correct";
    if (isDummyMode && boxSpec?.editable === false) return null;

    let expected = getExpectedVal(question, boxSpec);
    const student = String(response?.slots?.[boxKey] || "").trim();
    if (!student) return "wrong";
    if (expected === "?" || expected === "") {
      const calcAnswer = solveMath(question, spec);
      return student === calcAnswer && calcAnswer !== "" ? "correct" : "wrong";
    }
    return student === expected ? "correct" : "wrong";
  };

  const getBoxStyle = (box, isUnk, widthPercent, status) => {
    const style = widthPercent ? { width: `${widthPercent}%` } : {};

    if (status === "correct")
      return {
        ...style,
        backgroundColor: "#f0fdf4",
        border: "2px solid #4ade80",
        color: "black",
      };
    if (status === "wrong")
      return {
        ...style,
        backgroundColor: "#fef2f2",
        border: "2px solid #f87171",
        color: "black",
      };

    if (isDummyMode && isUnk && !isRevealed && !isCorrect) {
      return {
        ...style,
        backgroundColor: "white",
        backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(148, 163, 184, 0.15) 8px, rgba(148, 163, 184, 0.15) 10px)`,
        border: "2px dashed #94a3b8",
        color: "black",
      };
    }

    const colors = {
      green: "#f0fdf4",
      blue: "#eff6ff",
      orange: "#fff7ed",
      red: "#fef2f2",
    };
    return {
      ...style,
      backgroundColor: colors[box?.color] || "white",
      color: "black",
    };
  };

  // 🔥 Helper to generate the ghost placeholder
  const getGhostPlaceholder = (boxSpec) => {
    if (!isGhostHint) return undefined;
    const expected = getExpectedVal(question, boxSpec);
    return expected === "?" || expected === "" ? "e.g: ?" : `e.g: ${expected}`;
  };
  return (
    // <div className="bar-model bar-model--total-parts">
    <div
      className={`bar-model bar-model--total-parts ${isGhostHint ? "is-hinted" : ""}`}
    >
      {!spec.hideTopBar && (
        <div className="bar-model__top">
          <BarBox
            box={{
              ...spec.total,
              // 🔥 Disable clicks entirely if read-only
              editable: !(
                isReadOnly ||
                (isDummyMode && (isBoxUnknown(spec.total) || isAttempted))
              ),
            }}
            label={getBarLabel(spec.total, spec)}
            // value={getDisplayValue(spec.total, valTotal)}
            value={
              isGhostHint && (!valTotal || valTotal === "?")
                ? getGhostPlaceholder(spec.total)
                : getDisplayValue(spec.total, valTotal)
            }
            active={
              !isReadOnly &&
              !isRevealed &&
              !isCorrect &&
              !isGhostHint && // disable auto-select for ghost ui
              (!isAttempted || isDummyMode) &&
              activeField === spec.total.key
            }
            onClick={() => {
              if (isReadOnly) return;
              if (isGhostHint) {
                markCompleted();
              }
              if (!(isDummyMode && (isBoxUnknown(spec.total) || isAttempted)))
                setActiveField(spec.total.key);
            }}
            // 🔥 Prevent missing-value hashing class when read-only
            className={`bar-box--wide 
  ${!isReadOnly && isBoxUnknown(spec.total) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} 
  ${getFeedbackStatus(spec.total.key, spec.total) === "correct" ? "is-correct" : getFeedbackStatus(spec.total.key, spec.total) === "wrong" ? "is-wrong" : ""}  
  ${isGhostHint && (!valTotal || valTotal === "?") ? "ghost-input bar-box--ghost" : ""}
`}
            // className={`bar-box--wide ${!isReadOnly && isBoxUnknown(spec.total) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(spec.total.key, spec.total) === "correct" ? "is-correct" : getFeedbackStatus(spec.total.key, spec.total) === "wrong" ? "is-wrong" : ""}  ${isGhostHint && !valTotal ? "ghost-input bar-box--ghost" : ""}`}
            style={getBoxStyle(
              spec.total,
              isReadOnly ? false : isBoxUnknown(spec.total),
              null,
              getFeedbackStatus(spec.total.key, spec.total),
            )}
            // placeholder={getGhostPlaceholder(spec.total)}
          />
        </div>
      )}
      <div className="bar-model__bottom">
        <BarBox
          box={{
            ...spec.left,
            editable: !(
              isReadOnly ||
              (isDummyMode && (isBoxUnknown(spec.left) || isAttempted))
            ),
          }}
          label={getBarLabel(spec.left, spec)}
          // value={getDisplayValue(spec.left, valLeft)}
          value={
            isGhostHint && (!valLeft || valLeft === "?")
              ? getGhostPlaceholder(spec.left)
              : getDisplayValue(spec.left, valLeft)
          }
          active={
            !isReadOnly &&
            !isRevealed &&
            !isGhostHint &&
            !isCorrect &&
            (!isAttempted || isDummyMode) &&
            activeField === spec.left.key
          }
          onClick={() => {
            if (isReadOnly) return;
            if (isGhostHint) {
              markCompleted();
            }
            if (!(isDummyMode && (isBoxUnknown(spec.left) || isAttempted)))
              setActiveField(spec.left.key);
          }}
          className={`bar-box--segment 
  ${!isReadOnly && isBoxUnknown(spec.left) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} 
  ${getFeedbackStatus(spec.left.key, spec.left) === "correct" ? "is-correct" : getFeedbackStatus(spec.left.key, spec.left) === "wrong" ? "is-wrong" : ""}  
  ${isGhostHint && (!valLeft || valLeft === "?") ? "ghost-input bar-box--ghost" : ""}
`}
          // className={`bar-box--segment ${!isReadOnly && isBoxUnknown(spec.left) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(spec.left.key, spec.left) === "correct" ? "is-correct" : getFeedbackStatus(spec.left.key, spec.left) === "wrong" ? "is-wrong" : ""}  ${isGhostHint && !valLeft ? "ghost-input bar-box--ghost" : ""}`}
          // className={`bar-box--segment ${!isReadOnly && isBoxUnknown(spec.left) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(spec.left.key, spec.left) === "correct" ? "is-correct" : getFeedbackStatus(spec.left.key, spec.left) === "wrong" ? "is-wrong" : ""}`}
          style={getBoxStyle(
            spec.left,
            isReadOnly ? false : isBoxUnknown(spec.left),
            percentages.first,
            getFeedbackStatus(spec.left.key, spec.left),
          )}
          // placeholder={getGhostPlaceholder(spec.left)}
        />
        <BarBox
          box={{
            ...spec.right,
            editable: !(
              isReadOnly ||
              (isDummyMode && (isBoxUnknown(spec.right) || isAttempted))
            ),
          }}
          label={getBarLabel(spec.right, spec)}
          // value={getDisplayValue(spec.right, valRight)}
          value={
            isGhostHint && (!valRight || valRight === "?")
              ? getGhostPlaceholder(spec.right)
              : getDisplayValue(spec.right, valRight)
          }
          active={
            !isReadOnly &&
            !isRevealed &&
            !isGhostHint &&
            !isCorrect &&
            (!isAttempted || isDummyMode) &&
            activeField === spec.right.key
          }
          onClick={() => {
            if (isReadOnly) return;
            if (isGhostHint) {
              markCompleted();
            }
            if (!(isDummyMode && (isBoxUnknown(spec.right) || isAttempted)))
              setActiveField(spec.right.key);
          }}
          className={`bar-box--segment 
  ${!isReadOnly && isBoxUnknown(spec.right) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} 
  ${getFeedbackStatus(spec.right.key, spec.right) === "correct" ? "is-correct" : getFeedbackStatus(spec.right.key, spec.right) === "wrong" ? "is-wrong" : ""}  
  ${isGhostHint && (!valRight || valRight === "?") ? "ghost-input bar-box--ghost" : ""}
`}
          // className={`bar-box--segment ${!isReadOnly && isBoxUnknown(spec.right) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(spec.right.key, spec.right) === "correct" ? "is-correct" : getFeedbackStatus(spec.right.key, spec.right) === "wrong" ? "is-wrong" : ""}  ${isGhostHint && !valRight ? "ghost-input bar-box--ghost" : ""}`}
          // className={`bar-box--segment ${!isReadOnly && isBoxUnknown(spec.right) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(spec.right.key, spec.right) === "correct" ? "is-correct" : getFeedbackStatus(spec.right.key, spec.right) === "wrong" ? "is-wrong" : ""}`}
          style={getBoxStyle(
            spec.right,
            isReadOnly ? false : isBoxUnknown(spec.right),
            percentages.second,
            getFeedbackStatus(spec.right.key, spec.right),
          )}
          // placeholder={getGhostPlaceholder(spec.right)}
        />
      </div>
    </div>
  );
};

// Change Bar Modal
const ChangeBarModel = ({
  spec,
  response,
  activeField,
  setActiveField,
  question,
  isAttempted,
  isDummyMode,
  isCorrect,
  isRevealed,
  isReadOnly,
  isGhostHint, // 🔥 Catching this
  markCompleted, // 🔥 Catching this
}) => {
  const isSubtraction = (() => {
    const label = String(
      spec?.change?.label || spec?.right?.label || "",
    ).toLowerCase();
    const endLabel = String(
      spec?.end?.label || spec?.total?.label || "",
    ).toLowerCase();
    const words = [
      "spent",
      "flew",
      "away",
      "lost",
      "gave",
      "left",
      "remaining",
      "ate",
      "sold",
    ];

    for (let i = 0; i < words.length; i++) {
      if (label.includes(words[i]) || endLabel.includes(words[i])) return true;
    }

    const op = question?.operator || question?.equationSpec?.operator;
    if (op === "-") return true;
    return false;
  })();

  // const isMod1 = question?.moduleStage === "word_to_bar";
  const isEquationStage =
    question?.moduleStage === "bar_to_equation" ||
    question?.moduleStage === "schema_equation" ||
    question?.moduleStage === "equation" ||
    question?.moduleStage === "solve" ||
    isReadOnly; // If the parent locked it, push it to the background!
  const isPillTheme =
    question?.moduleStage === "word_to_bar" ||
    question?.moduleStage === "schema_bar_model" ||
    question?.moduleStage === "bar_to_equation" ||
    question?.moduleStage === "schema_equation" ||
    question?.schemaKind === "change";

  // -----------------------Helper for generating start,end change FOR CHANGE MODELS:
  const startBox = spec.start || spec.left;
  const changeBox = spec.change || spec.right;
  const endBox = spec.end || spec.total || spec.result;

  const getBoxKey = (box) => {
    if (box === startBox) return "start";
    if (box === changeBox) return "change";
    if (box === endBox) return "end";
    return null;
  };
  // -----------------------//////////////////////////////

  let topBox, b1, b2;
  if (isSubtraction) {
    topBox = startBox;
    b1 = endBox;
    b2 = changeBox;
  } else {
    topBox = endBox;
    b1 = startBox;
    b2 = changeBox;
  }

  const valTop = getBarValue(response, topBox);
  const valB1 = b1 ? getBarValue(response, b1) : "";
  const valB2 = b2 ? getBarValue(response, b2) : "";

  const isBoxUnknown = (boxSpec) => {
    if (!boxSpec) return false;
    let expected = getExpectedVal(question, boxSpec);
    return expected === "?" || expected === "";
  };

  const getCorrectMathValue = (boxSpec) => {
    const expected = getExpectedVal(question, boxSpec);
    return expected === "?" || expected === "" ? "?" : expected;
  };

  const getDisplayValue = (boxSpec, currentVal) => {
    // 🔥 If Read-Only, force display of the correct/hint value immediately
    if (isReadOnly) {
      let expected = getExpectedVal(question, boxSpec);
      return expected === "" ? "?" : expected;
    }
    const isUnk = isBoxUnknown(boxSpec);
    if (isRevealed || (isDummyMode && isCorrect && isUnk)) {
      return getCorrectMathValue(boxSpec);
    }
    if (isDummyMode) {
      if (response?.slots && response.slots[boxSpec.key] !== undefined) {
        return response.slots[boxSpec.key];
      }
      return currentVal === "?" ? "" : currentVal;
    }
    return response?.slots?.[boxSpec.key] || "";
  };

  const getFeedbackStatus = (boxKey, boxSpec) => {
    if (isReadOnly) return null; // 🔥 Read-Only boxes don't get red/green feedback
    if (isRevealed) return null;
    if (isCorrect) return "correct";
    if (!isAttempted) return null;
    if (isDummyMode && boxSpec?.editable === false) return null;

    let expected = getExpectedVal(question, boxSpec);
    const student = String(response?.slots?.[boxKey] || "").trim();
    if (!student) return "wrong";

    if (expected === "?" || expected === "") {
      const calcAnswer = solveMath(question, spec, isSubtraction);
      return student === calcAnswer && calcAnswer !== "" ? "correct" : "wrong";
    }
    return student === expected ? "correct" : "wrong";
  };

  const getBoxStyle = (box, isUnk, widthPercent, status) => {
    const style = widthPercent ? { width: `${widthPercent}%` } : {};

    if (status === "correct")
      return {
        ...style,
        backgroundColor: "#f0fdf4",
        border: "2px solid #4ade80",
        color: "black",
      };
    if (status === "wrong")
      return {
        ...style,
        backgroundColor: "#fef2f2",
        border: "2px solid #f87171",
        color: "black",
      };

    if (isDummyMode && isUnk && !isRevealed && !isCorrect) {
      return {
        ...style,
        backgroundColor: "white",
        backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(148, 163, 184, 0.15) 8px, rgba(148, 163, 184, 0.15) 10px)`,
        border: "2px dashed #94a3b8",
        color: "black",
      };
    }

    const colors = {
      green: "#f0fdf4",
      blue: "#eff6ff",
      orange: "#fff7ed",
      red: "#fef2f2",
    };
    return {
      ...style,
      backgroundColor: colors[box?.color] || "white",
      color: "black",
    };
  };

  const totalMag = (b1?.magnitude || 50) + (b2?.magnitude || 50);

  // 🔥 Helper to generate the ghost placeholder
  const getGhostPlaceholder = (boxSpec) => {
    if (!isGhostHint) return undefined;
    const expected = getExpectedVal(question, boxSpec);
    return expected === "?" || expected === "" ? "e.g: ?" : `e.g: ${expected}`;
  };

  return (
    <div
      className={`bar-model bar-model--change ${isPillTheme ? "is-pill-model" : "is-solid-classic"} ${isEquationStage ? "is-reference-mode" : ""}`}
      // className={`bar-model bar-model--change ${isPillTheme ? "is-pill-model" : "is-solid-classic"}`}
    >
      {/* <div className="bar-model__top"> */}
      <div
        className={isPillTheme ? "bar-model__top-wrapper" : "bar-model__top"}
      >
        <div className="changeBar__wrapper">
          {question?.schemaKind === "change" && (
            <span className={`variable-tag variable-tag--${getBoxKey(topBox)}`}>
              {getBoxKey(topBox)?.charAt(0).toUpperCase() +
                getBoxKey(topBox)?.slice(1)}
            </span>
          )}

          <BarBox
            box={{
              ...topBox,
              editable: !(
                isReadOnly ||
                (isDummyMode && (isBoxUnknown(topBox) || isAttempted))
              ),
            }}
            tag={question?.schemaKind === "change" ? getBoxKey(topBox) : null}
            label={getBarLabel(topBox, spec)}
            value={
              isGhostHint && (!valTop || valTop === "?")
                ? getGhostPlaceholder(topBox)
                : getDisplayValue(topBox, valTop)
            }
            // value={getDisplayValue(topBox, valTop)}
            active={
              !isReadOnly &&
              !isRevealed &&
              !isCorrect &&
              !isGhostHint && // disable auto-select for ghost ui
              (!isAttempted || isDummyMode) &&
              activeField === topBox.key
            }
            onClick={() => {
              if (isReadOnly) return;
              if (isGhostHint) {
                markCompleted();
              }
              if (!(isDummyMode && (isBoxUnknown(topBox) || isAttempted)))
                setActiveField(topBox.key);
            }}
            // className={`bar-box--wide
            //   ${!isReadOnly && isBoxUnknown(topBox) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""}
            //   ${getFeedbackStatus(topBox.key, topBox) === "correct" ? "is-correct" : getFeedbackStatus(topBox.key, topBox) === "wrong" ? "is-wrong" : ""}
            //   ${isGhostHint && (!valTop || valTop === "?") ? "ghost-input bar-box--ghost" : ""}
            // `}
            className={`
            ${isPillTheme ? "bar-box--top-pill" : "bar-box--wide"} 
            ${!isReadOnly && isBoxUnknown(topBox) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} 
            ${getFeedbackStatus(topBox.key, topBox) === "correct" ? "is-correct" : getFeedbackStatus(topBox.key, topBox) === "wrong" ? "is-wrong" : ""} 
            ${isGhostHint && (!valTop || valTop === "?") ? "ghost-input bar-box--ghost" : ""}
          `}
            // className={`bar-box--wide ${!isReadOnly && isBoxUnknown(topBox) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(topBox.key, topBox) === "correct" ? "is-correct" : getFeedbackStatus(topBox.key, topBox) === "wrong" ? "is-wrong" : ""}`}
            style={getBoxStyle(
              topBox,
              isReadOnly ? false : isBoxUnknown(topBox),
              null,
              getFeedbackStatus(topBox.key, topBox),
            )}
          />
        </div>
      </div>
      <div className="bar-model__bottom">
        {b1 && (
          <div
            className="changeBar__wrapper"
            style={{ width: `${((b1?.magnitude || 50) / totalMag) * 100}%` }}
          >
            {question?.schemaKind === "change" && (
              <span className={`variable-tag variable-tag--${getBoxKey(b1)}`}>
                {getBoxKey(b1)?.charAt(0).toUpperCase() +
                  getBoxKey(b1)?.slice(1)}
              </span>
            )}
            <BarBox
              box={{
                ...b1,
                editable: !(
                  isReadOnly ||
                  (isDummyMode && (isBoxUnknown(b1) || isAttempted))
                ),
              }}
              tag={question?.schemaKind === "change" ? getBoxKey(b1) : null}
              label={getBarLabel(b1, spec)}
              // value={getDisplayValue(b1, valB1)}
              value={
                isGhostHint && (!valB1 || valB1 === "?")
                  ? getGhostPlaceholder(b1)
                  : getDisplayValue(b1, valB1)
              }
              active={
                !isReadOnly &&
                !isRevealed &&
                !isGhostHint &&
                !isCorrect &&
                (!isAttempted || isDummyMode) &&
                activeField === b1.key
              }
              onClick={() => {
                if (isReadOnly) return;
                if (isGhostHint) {
                  markCompleted();
                }
                if (!(isDummyMode && (isBoxUnknown(b1) || isAttempted)))
                  setActiveField(b1.key);
              }}
              // className={`bar-box--segment
              //   ${!isReadOnly && isBoxUnknown(b1) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""}
              //   ${getFeedbackStatus(b1.key, b1) === "correct" ? "is-correct" : getFeedbackStatus(b1.key, b1) === "wrong" ? "is-wrong" : ""}
              //   ${isGhostHint && (!valB1 || valB1 === "?") ? "ghost-input bar-box--ghost" : ""}
              // `}
              className={`bar-box--segment 
              ${isPillTheme ? "bar-box--tray-pill token-1" : ""} 
              ${!isReadOnly && isBoxUnknown(b1) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} 
              ${getFeedbackStatus(b1.key, b1) === "correct" ? "is-correct" : getFeedbackStatus(b1.key, b1) === "wrong" ? "is-wrong" : ""} 
              ${isGhostHint && (!valB1 || valB1 === "?") ? "ghost-input bar-box--ghost" : ""}
            `}
              // className={`bar-box--segment ${!isReadOnly && isBoxUnknown(b1) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(b1.key, b1) === "correct" ? "is-correct" : getFeedbackStatus(b1.key, b1) === "wrong" ? "is-wrong" : ""}`}
              style={getBoxStyle(
                b1,
                isReadOnly ? false : isBoxUnknown(b1),
                null,
                getFeedbackStatus(b1.key, b1),
              )}
            />
          </div>
        )}
        {b2 && (
          <div
            className="changeBar__wrapper"
            style={{ width: `${((b2?.magnitude || 50) / totalMag) * 100}%` }}
          >
            {question?.schemaKind === "change" && (
              <span className={`variable-tag variable-tag--${getBoxKey(b2)}`}>
                {getBoxKey(b2)?.charAt(0).toUpperCase() +
                  getBoxKey(b2)?.slice(1)}
              </span>
            )}
            <BarBox
              box={{
                ...b2,
                editable: !(
                  isReadOnly ||
                  (isDummyMode && (isBoxUnknown(b2) || isAttempted))
                ),
              }}
              tag={question?.schemaKind === "change" ? getBoxKey(b2) : null}
              label={getBarLabel(b2, spec)}
              // value={getDisplayValue(b2, valB2)}
              value={
                isGhostHint && (!valB2 || valB2 === "?")
                  ? getGhostPlaceholder(b2)
                  : getDisplayValue(b2, valB2)
              }
              active={
                !isReadOnly &&
                !isRevealed &&
                !isGhostHint &&
                !isCorrect &&
                (!isAttempted || isDummyMode) &&
                activeField === b2.key
              }
              onClick={() => {
                if (isReadOnly) return;
                if (isGhostHint) {
                  markCompleted();
                }
                if (!(isDummyMode && (isBoxUnknown(b2) || isAttempted)))
                  setActiveField(b2.key);
              }}
              // className={`bar-box--segment
              //   ${isPillTheme ? "bar-box--tray-pill token-2" : ""}
              //   ${isPillTheme && isSubtraction ? "is-subtraction" : ""}
              //   ${!isReadOnly && isBoxUnknown(b2) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""}
              //   ${getFeedbackStatus(b2.key, b2) === "correct" ? "is-correct" : getFeedbackStatus(b2.key, b2) === "wrong" ? "is-wrong" : ""}
              //   ${isGhostHint && (!valB2 || valB2 === "?") ? "ghost-input bar-box--ghost" : ""}
              // `}
              className={`bar-box--segment 
              ${isPillTheme ? "bar-box--tray-pill token-2" : ""} 
              ${!isReadOnly && isBoxUnknown(b2) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} 
              ${getFeedbackStatus(b2.key, b2) === "correct" ? "is-correct" : getFeedbackStatus(b2.key, b2) === "wrong" ? "is-wrong" : ""} 
              ${isGhostHint && (!valB2 || valB2 === "?") ? "ghost-input bar-box--ghost" : ""}
            `}
              // className={`bar-box--segment ${isMod1 ? "bar-box--tray-pill token-2" : ""} ${!isReadOnly && isBoxUnknown(b2) && isDummyMode && !isRevealed && !isCorrect ? "is-missing-value" : ""} ${getFeedbackStatus(b2.key, b2) === "correct" ? "is-correct" : getFeedbackStatus(b2.key, b2) === "wrong" ? "is-wrong" : ""}`}
              style={getBoxStyle(
                b2,
                isReadOnly ? false : isBoxUnknown(b2),
                null,
                getFeedbackStatus(b2.key, b2),
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const CompareStackedBarModel = ({
  spec,
  response,
  activeField,
  setActiveField,
  question,
  isAttempted,
  isCorrect,
  isRevealed,
  isDummyMode,
}) => {
  const {
    bigger: biggerMagnitude,
    smaller: smallerMagnitude,
    difference: differenceMagnitude,
  } = resolveCompareMagnitudes(spec, response);
  const percentages = getExactTrackPercentages(
    smallerMagnitude,
    differenceMagnitude,
    biggerMagnitude,
  );

  const isBoxUnknown = (boxSpec) => {
    if (!boxSpec) return false;
    let expected = getExpectedVal(question, boxSpec);
    return expected === "?" || expected === "";
  };

  const isActive = (key) =>
    !isRevealed &&
    !isCorrect &&
    (!isAttempted || isDummyMode) &&
    activeField === key;

  return (
    <div className="bar-model bar-model--compare">
      <div className="bar-model__compare-top">
        <BarBox
          box={spec.bigger}
          label={getBarLabel(spec.bigger, spec)}
          value={
            isRevealed && isBoxUnknown(spec.bigger)
              ? "?"
              : getBarValue(response, spec.bigger)
          }
          active={isActive(spec.bigger.key)}
          onClick={() => setActiveField(spec.bigger.key)}
          className="bar-box--wide"
        />
      </div>
      <div className="bar-model__compare-bottom">
        <div className="bar-model__compare-row">
          <BarBox
            box={spec.smaller}
            label={getBarLabel(spec.smaller, spec)}
            value={
              isRevealed && isBoxUnknown(spec.smaller)
                ? "?"
                : getBarValue(response, spec.smaller)
            }
            active={isActive(spec.smaller.key)}
            onClick={() => setActiveField(spec.smaller.key)}
            className="bar-box--segment"
            style={{ flex: `0 0 ${percentages.first}%` }}
          />
          <BarBox
            box={spec.difference}
            label={getBarLabel(spec.difference, spec)}
            value={
              isRevealed && isBoxUnknown(spec.difference)
                ? "?"
                : getBarValue(response, spec.difference)
            }
            active={isActive(spec.difference.key)}
            onClick={() => setActiveField(spec.difference.key)}
            className="bar-box--segment"
            style={{ flex: `0 0 ${percentages.second}%` }}
          />
        </div>
      </div>
      {spec?.barDecorations?.showBracket && spec.bracket && (
        <div className="bar-model__compare-bracket">
          <div className="bar-model__compare-line" />
          <span>{spec.bracket.label}</span>
        </div>
      )}
    </div>
  );
};

const CompareGapSegment = ({ box, label, value, active, onClick, style }) => {
  const displayValue =
    box.editable && String(value || "").trim() === "?" ? "" : value;

  return (
    <div
      className={`compare-gap__left ${box.editable ? "is-editable" : ""} ${active ? "is-active" : ""} ${box.accent === "unknown" ? "is-unknown" : ""}`}
      style={style}
    >
      <button
        type="button"
        className={`bar-box bar-box--${box.color} ${box.editable ? "is-editable" : ""} ${active ? "is-active" : ""} ${displayValue ? "is-filled" : ""} ${box.accent === "unknown" ? "is-unknown" : ""}`}
        onClick={onClick}
        disabled={!box.editable}
        style={style}
      >
        <strong>
          {displayValue || <span className="hide-on-focus">?</span>}
        </strong>{" "}
        <span>{label}</span>
      </button>
    </div>
  );
};

const CompareGapBarModel = ({
  spec,
  response,
  activeField,
  setActiveField,
  question,
  isAttempted,
  isCorrect,
  isRevealed,
  isDummyMode,
}) => {
  const {
    bigger: biggerMagnitude,
    smaller: smallerMagnitude,
    difference: differenceMagnitude,
  } = resolveCompareMagnitudes(spec, response);
  const percentages = getExactTrackPercentages(
    smallerMagnitude,
    differenceMagnitude,
    biggerMagnitude,
  );
  const guideWidth = percentages.first;

  const isBoxUnknown = (boxSpec) => {
    if (!boxSpec) return false;
    let expected = getExpectedVal(question, boxSpec);
    return expected === "?" || expected === "";
  };

  const isActive = (key) =>
    !isRevealed &&
    !isCorrect &&
    (!isAttempted || isDummyMode) &&
    activeField === key;

  return (
    <div className="bar-model bar-model--compare-gap">
      <div className="bar-model__compare-top">
        <BarBox
          box={spec.bigger}
          label={getBarLabel(spec.bigger, spec)}
          value={
            isRevealed && isBoxUnknown(spec.bigger)
              ? "?"
              : getBarValue(response, spec.bigger)
          }
          active={isActive(spec.bigger.key)}
          onClick={() => setActiveField(spec.bigger.key)}
          className="bar-box--wide"
        />
      </div>
      <div className="bar-model__compare-gap-track">
        <div
          className={`compare-gap__measure compare-gap__measure--track ${isActive(spec.smaller.key) ? "is-active" : ""}`}
          style={{ width: `${guideWidth}%` }}
          aria-hidden="true"
        />
        <CompareGapSegment
          box={spec.smaller}
          label={getBarLabel(spec.smaller, spec)}
          value={
            isRevealed && isBoxUnknown(spec.smaller)
              ? "?"
              : getBarValue(response, spec.smaller)
          }
          active={isActive(spec.smaller.key)}
          onClick={() => setActiveField(spec.smaller.key)}
          style={{ flex: `0 0 ${percentages.first}%` }}
        />
        <BarBox
          box={spec.difference}
          label={getBarLabel(spec.difference, spec)}
          value={
            isRevealed && isBoxUnknown(spec.difference)
              ? "?"
              : getBarValue(response, spec.difference)
          }
          active={isActive(spec.difference.key)}
          onClick={() => setActiveField(spec.difference.key)}
          className="bar-box--segment compare-gap__difference"
          style={{ flex: `0 0 ${percentages.second}%` }}
        />
      </div>
    </div>
  );
};

export const CompareGuidedAnswerModel = ({ question }) => {
  const spec = question?.barModelSpec;
  if (!spec) return null;

  const percentages = getExactTrackPercentages(
    spec?.smaller?.magnitude,
    spec?.difference?.magnitude,
    spec?.bigger?.magnitude,
  );
  const col1 = Number(percentages.first.toFixed(4));
  const col2 = Number((100 - col1).toFixed(4));
  const gridTracks = `minmax(0, ${col1}%) minmax(0, ${col2}%)`;

  return (
    <div className="bar-model bar-model--compare-guided">
      <div className="bar-model__compare-top">
        <BarBox
          box={{ ...spec.bigger, editable: false }}
          label={getBarLabel(spec.bigger, spec)}
          value={getGuidedCompareValue(question, "bigger", spec?.bigger?.value)}
          active={false}
          className="bar-box--wide"
        />
      </div>
      <div
        className="bar-model__compare-guided-row"
        style={{ gridTemplateColumns: gridTracks }}
      >
        <div className="compare-guided__unknown-column">
          <div className="compare-guided__measure" aria-hidden="true" />
          <div className="compare-guided__unknown">
            <strong className="compare-guided__mark">?</strong>
          </div>
        </div>
        <BarBox
          box={{ ...spec.difference, editable: false }}
          label={getBarLabel(spec.difference, spec)}
          value={getGuidedCompareValue(
            question,
            "difference",
            spec?.difference?.value,
          )}
          active={false}
          className="bar-box--segment compare-guided__difference"
        />
      </div>
    </div>
  );
};

// const BarModel = ({
//   question,
//   response,
//   setResponse,
//   isAttempted,
//   isCorrect,
//   targetField,
//   isDummyMode,
//   isRevealed,
//   isReadOnly, // 🔥 NEW PROP
// }) => {
//   const spec = question?.barModelSpec;
//   if (!spec) return null;

//   const setActiveField = (field) =>
//     setResponse((current) => ({ ...(current || {}), activeField: field }));

//   if (question?.schemaKind === "change" || spec.layout === "change") {
//     return (
//       <ChangeBarModel
//         spec={spec}
//         response={response}
//         activeField={response?.activeField}
//         setActiveField={setActiveField}
//         question={question}
//         isAttempted={isAttempted}
//         isCorrect={isCorrect}
//         targetField={targetField}
//         isDummyMode={isDummyMode}
//         isRevealed={isRevealed}
//         isReadOnly={isReadOnly} // 🔥 Pass down
//       />
//     );
//   }

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
//         question={question}
//         isAttempted={isAttempted}
//         isCorrect={isCorrect}
//         isRevealed={isRevealed}
//         isDummyMode={isDummyMode}
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
//         question={question}
//         isAttempted={isAttempted}
//         isCorrect={isCorrect}
//         isRevealed={isRevealed}
//         isDummyMode={isDummyMode}
//       />
//     );
//   }

//   return (
//     <TotalPartsBarModel
//       spec={spec}
//       response={response}
//       activeField={response?.activeField}
//       setActiveField={setActiveField}
//       question={question}
//       isAttempted={isAttempted}
//       isCorrect={isCorrect}
//       targetField={targetField}
//       isDummyMode={isDummyMode}
//       isRevealed={isRevealed}
//       isReadOnly={isReadOnly} // 🔥 Pass down
//     />
//   );
// };

const BarModel = ({
  question,
  response,
  setResponse,
  isAttempted,
  isCorrect,
  targetField,
  isDummyMode,
  isRevealed,
  isReadOnly, // 🔥 NEW PROP
}) => {
  const spec = question?.barModelSpec;

  // 1. GHOST LOGIC SETUP (Redux & Hook)
  const { userInfo } = useSelector((state) => state.auth);
  const userId = userInfo?.id || userInfo?._id;
  const { hasCompleted, markCompleted } = useSchemaProgress(
    question?.schemaKind ? `barModel_${question.schemaKind}` : "barModel",
    userId,
  );
  // 2. Check if the student has started typing in ANY box
  const hasStarted = Object.values(response?.slots || {}).some(
    (val) => val && String(val).trim() !== "" && String(val).trim() !== "?",
  );
  // 3. The definitive safe Ghosting flag
  const isGhostHint =
    !hasStarted && !isDummyMode && !isReadOnly && !hasCompleted && !!userId;
  // // 🔥 NEW: Instantly kill auto-focus if the ghost UI is active
  // useEffect(() => {
  //   if (isGhostHint && response?.activeField !== null) {
  //     setResponse((prev) => ({ ...prev, activeField: null }));
  //   }
  // }, [isGhostHint, response?.activeField, setResponse]);
  // 4. Mark as completed automatically when they get it right
  useEffect(() => {
    if (isAttempted && isCorrect && !isDummyMode && !isReadOnly) {
      markCompleted();
    }
  }, [isAttempted, isCorrect, isDummyMode, isReadOnly]);

  if (!spec) return null;

  const setActiveField = (field) =>
    setResponse((current) => ({ ...(current || {}), activeField: field }));

  if (question?.schemaKind === "change" || spec.layout === "change") {
    return (
      <ChangeBarModel
        spec={spec}
        response={response}
        activeField={response?.activeField}
        setActiveField={setActiveField}
        question={question}
        isAttempted={isAttempted}
        isCorrect={isCorrect}
        targetField={targetField}
        isDummyMode={isDummyMode}
        isRevealed={isRevealed}
        isReadOnly={isReadOnly}
        isGhostHint={isGhostHint} // 🔥 Passed down
        markCompleted={markCompleted} // 🔥 Passed down
      />
    );
  }

  if (
    spec.layout === "compare_offset" &&
    spec.compareVariant === "fewer_than_gap"
  ) {
    return (
      <CompareGapBarModel
        spec={spec}
        response={response}
        activeField={response?.activeField}
        setActiveField={setActiveField}
        question={question}
        isAttempted={isAttempted}
        isCorrect={isCorrect}
        isRevealed={isRevealed}
        isDummyMode={isDummyMode}
        // isGhostHint={isGhostHint} // 🔥 Passed down
        // markCompleted={markCompleted} // 🔥 Passed down
      />
    );
  }

  if (spec.layout === "compare_offset") {
    return (
      <CompareStackedBarModel
        spec={spec}
        response={response}
        activeField={response?.activeField}
        setActiveField={setActiveField}
        question={question}
        isAttempted={isAttempted}
        isCorrect={isCorrect}
        isRevealed={isRevealed}
        isDummyMode={isDummyMode}
        // isGhostHint={isGhostHint} // 🔥 Passed down
        // markCompleted={markCompleted} // 🔥 Passed down
      />
    );
  }

  return (
    <TotalPartsBarModel
      spec={spec}
      response={response}
      activeField={response?.activeField}
      setActiveField={setActiveField}
      question={question}
      isAttempted={isAttempted}
      isCorrect={isCorrect}
      targetField={targetField}
      isDummyMode={isDummyMode}
      isRevealed={isRevealed}
      isReadOnly={isReadOnly}
      isGhostHint={isGhostHint} // 🔥 Passed down
      markCompleted={markCompleted} // 🔥 Passed down
    />
  );
};

export default BarModel;
