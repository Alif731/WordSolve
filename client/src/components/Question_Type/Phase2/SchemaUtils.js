import { isCompareAnswerInputQuestion } from "../../../utils/questionValidation";

export const sanitizeLearnerLabel = (label, role) => {
  const raw = String(label || "").trim();
  if (!raw) return raw;

  if (role === "difference") {
    const stripped = raw.replace(/^\d+[\s-]*/u, "").trim();
    if (/^fewer$/i.test(stripped)) return "fewer marbles";
    if (/^more$/i.test(stripped)) return "more marbles";
    return stripped || "difference";
  }
  return raw;
};

export const getRoleKey = (item) => {
  const rawRole = item?.role || item?.label || "";
  return String(rawRole).trim().toLowerCase() || null;
};

export const getLearnerFacingLabel = (question, item) => {
  const role = getRoleKey(item);
  if (!role) return item?.label || "";

  const specRoleLabel = question?.barModelSpec?.roleLabels?.[role];
  if (specRoleLabel) return specRoleLabel;

  const specBoxLabel = question?.barModelSpec?.[role]?.label;
  if (specBoxLabel) return specBoxLabel;

  const equationRoleLabel = question?.equationSpec?.roleLabels?.[role];
  if (equationRoleLabel) return sanitizeLearnerLabel(equationRoleLabel, role);

  return sanitizeLearnerLabel(item?.label || "", role);
};

export const getAdaptiveDifferenceLabel = (
  comparisonWording,
  fallbackLabel,
) => {
  const wording = String(comparisonWording || "")
    .trim()
    .toLowerCase();
  if (wording === "fewer than") return "less";
  if (wording === "more than") return "more";
  return sanitizeLearnerLabel(fallbackLabel, "difference");
};

export const parseBarMagnitude = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized || normalized === "?") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getBoxMagnitude = (response, box) => {
  if (typeof box?.magnitude === "number" && Number.isFinite(box.magnitude)) {
    return box.magnitude;
  }
  const responseValue = response?.slots?.[box?.key];
  const responseMagnitude = parseBarMagnitude(responseValue);
  if (responseMagnitude !== null) return responseMagnitude;
  return parseBarMagnitude(box?.value);
};

export const getSegmentPercentages = (
  firstAmount,
  secondAmount,
  totalAmount,
) => {
  const first = Number(firstAmount) || 0;
  const second = Number(secondAmount) || 0;
  const fallbackTotal = first + second;
  const total = Number(totalAmount) || fallbackTotal;

  if (total <= 0) return { first: 50, second: 50 };

  const firstPercent = Math.max(18, (first / total) * 100);
  const secondPercent = Math.max(18, (second / total) * 100);
  const scale = 100 / (firstPercent + secondPercent);

  return { first: firstPercent * scale, second: secondPercent * scale };
};

export const getExactTrackPercentages = (
  firstAmount,
  secondAmount,
  totalAmount,
) => {
  const first = Math.max(0, Number(firstAmount) || 0);
  const second = Math.max(0, Number(secondAmount) || 0);
  const total = Math.max(first + second, Number(totalAmount) || 0);

  if (total <= 0) return { first: 50, second: 50 };
  return { first: (first / total) * 100, second: (second / total) * 100 };
};

export const resolveTotalPartsMagnitudes = (spec, response) => {
  let total = getBoxMagnitude(response, spec.total);
  let left = getBoxMagnitude(response, spec.left);
  let right = getBoxMagnitude(response, spec.right);

  if (total === null && left !== null && right !== null) total = left + right;
  if (left === null && total !== null && right !== null) left = total - right;
  if (right === null && total !== null && left !== null) right = total - left;

  return { total, left, right };
};

export const resolveCompareMagnitudes = (spec, response) => {
  let bigger = getBoxMagnitude(response, spec.bigger);
  let smaller = getBoxMagnitude(response, spec.smaller);
  let difference = getBoxMagnitude(response, spec.difference);

  if (bigger === null && smaller !== null && difference !== null)
    bigger = smaller + difference;
  if (smaller === null && bigger !== null && difference !== null)
    smaller = bigger - difference;
  if (difference === null && bigger !== null && smaller !== null)
    difference = bigger - smaller;

  return { bigger, smaller, difference };
};

export const joinSlotValue = (currentValue, nextValue) => {
  const current = String(currentValue || "");
  if (nextValue === "?") return "?";
  if (current === "?" || current === "0") return String(nextValue);
  return `${current}${nextValue}`.slice(0, 4);
};

export const getBarLabel = (box, spec) => {
  const role = box?.role || box?.key || "";
  const semanticLabel = spec?.roleLabels?.[role] || box?.label || "";

  if (role === "difference") {
    return getAdaptiveDifferenceLabel(spec?.comparisonWording, semanticLabel);
  }
  return sanitizeLearnerLabel(semanticLabel, role);
};

export const getGuidedCompareValue = (question, key, fallbackValue = "?") => {
  const primaryValue = question?.validation?.slots?.[key];
  if (
    String(primaryValue || "").trim() &&
    String(primaryValue).trim() !== "?"
  ) {
    return String(primaryValue).trim();
  }

  const alternateValue = question?.validation?.alternateSlots?.[key];
  if (
    String(alternateValue || "").trim() &&
    String(alternateValue).trim() !== "?"
  ) {
    return String(alternateValue).trim();
  }

  return String(fallbackValue || "?").trim() || "?";
};

export const buildCompareAnswerPrompt = (label) => {
  const raw = String(label || "").trim();
  if (!raw)
    return { prompt: "Your answer", placeholder: "Type the missing amount" };

  const possessiveMatch = raw.match(/^(.+?)'s\s+(.+)$/u);
  if (possessiveMatch) {
    const [, owner, item] = possessiveMatch;
    return {
      prompt: `How many ${item} does ${owner} have?`,
      placeholder: `Type ${owner}'s ${item}`,
    };
  }

  return {
    prompt: `How many ${raw.toLowerCase()}?`,
    placeholder: `Type ${raw.toLowerCase()}`,
  };
};

export const getDefaultActiveField = (question) => {
  if (
    !question ||
    question?.inputMode === "text_answer" ||
    isCompareAnswerInputQuestion(question)
  )
    return null;

  const unknownField = question?.unknownSlot;
  const barSpec = question?.barModelSpec;

  if (barSpec) {
    if (unknownField && barSpec?.[unknownField]?.editable)
      return barSpec[unknownField].key;
    const firstEditableBarField = [
      barSpec.total,
      barSpec.left,
      barSpec.right,
      barSpec.bigger,
      barSpec.smaller,
      barSpec.difference,
    ].find((item) => item?.editable);
    if (firstEditableBarField?.key) return firstEditableBarField.key;
  }

  const equationTemplate = question?.equationSpec?.template || [];
  const firstUnknownEquationField = equationTemplate.find(
    (item) =>
      item?.type !== "symbol" &&
      item?.type !== "operator" &&
      item?.editable !== false &&
      String(item?.value || "").trim() === "?",
  );
  if (firstUnknownEquationField?.key) return firstUnknownEquationField.key;

  const firstEditableEquationField = equationTemplate.find(
    (item) =>
      item?.type !== "symbol" &&
      item?.type !== "operator" &&
      item?.editable !== false,
  );
  if (firstEditableEquationField?.key) return firstEditableEquationField.key;

  return question?.equationSpec?.operatorEditable ? "__operator__" : null;
};

export const getActiveInputLabel = (question, activeField) => {
  if (!question || !activeField) return "";
  if (activeField === "__operator__") return "operator";

  const barSpec = question?.barModelSpec;
  if (barSpec) {
    const barField = [
      barSpec.total,
      barSpec.left,
      barSpec.right,
      barSpec.bigger,
      barSpec.smaller,
      barSpec.difference,
    ].find((item) => item?.key === activeField);
    if (barField) return getBarLabel(barField, barSpec);
  }

  const equationField = (question?.equationSpec?.template || []).find(
    (item) => item?.key === activeField,
  );
  if (equationField) return getLearnerFacingLabel(question, equationField);

  return "";
};

// Returns the true expected value for a slot key (from validation or equation template)
export const getExpectedSlotValue = (question, slotKey) => {
  // 1. Check validation slots (story numbers)
  if (question?.validation?.slots?.[slotKey] !== undefined) {
    return String(question.validation.slots[slotKey]).trim();
  }
  // 2. Fallback to equation template
  const templateItem = question?.equationSpec?.template?.find(
    (t) => t.key === slotKey,
  );
  if (templateItem?.value) return String(templateItem.value).trim();
  return "";
};

export const getTrueExpectedValue = (questionData, key) => {
  // 1. Check Equation Template
  const templateItem = questionData?.equationSpec?.template?.find(
    (t) => t.key === key,
  );
  if (templateItem) return String(templateItem.value || "").trim();

  // 2. Check Bar Model Spec (Finds any bar name: muffins, stamps, toys, etc.)
  const spec = questionData?.barModelSpec;
  if (spec) {
    const match = Object.values(spec).find((v) => v?.key === key);
    if (match) return String(match.value || "").trim();
  }
  return "";
};

// 🔥 FIX: Perfect Algebraic Solver (Handles both + and - automatically)
// export const solveMissingValue = (q) => {
//   const template = q?.equationSpec?.template || [];
//   const slotItems = template.filter((t) => t.type === "slot");
//   if (slotItems.length < 3) return null;

//   // 1. Get the true expected values for all slots
//   const vals = slotItems.map((s) => {
//     const v = getTrueExpectedValue(q, s.key);
//     return { key: s.key, num: parseFloat(v), isUnknown: v === "?" || v === "" };
//   });

//   const unknown = vals.find((v) => v.isUnknown);
//   const equalIdx = template.findIndex((t) => t.value === "=");
//   if (!unknown || equalIdx === -1) return null;

//   // 2. Find the operator (Defaults to +, but looks for -)
//   let operator = "+";
//   const opItem = template.find((t) => t.type === "operator");
//   if (opItem && (opItem.value === "+" || opItem.value === "-")) {
//     operator = opItem.value;
//   } else if (q?.equationSpec?.operator) {
//     operator = q.equationSpec.operator;
//   } else if (q?.operator) {
//     operator = q.operator;
//   }

//   // 3. Identify the "Result" side of the "=" sign (the side with only 1 slot)
//   const resultSlot = vals.find((v) => {
//     const idx = template.findIndex((t) => t.key === v.key);
//     const onLeft = idx < equalIdx;
//     const countOnSide = vals.filter(
//       (v2) =>
//         template.findIndex((t2) => t2.key === v2.key) < equalIdx === onLeft,
//     ).length;
//     return countOnSide === 1;
//   });

//   if (!resultSlot) return null;

//   // 4. Identify the two "Terms" on the other side
//   const terms = vals.filter((v) => v.key !== resultSlot.key);
//   if (terms.length !== 2) return null;

//   const [term1, term2] = terms; // term1 is left of the operator, term2 is right

//   // --- ALGEBRA SOLVER ---
//   // Case A: The unknown is the Result (e.g., 12 - 5 = ?)
//   if (unknown.key === resultSlot.key) {
//     return operator === "-"
//       ? String(term1.num - term2.num)
//       : String(term1.num + term2.num);
//   }

//   // Case B: The unknown is Term 1 (e.g., ? - 5 = 7)
//   if (unknown.key === term1.key) {
//     return operator === "-"
//       ? String(resultSlot.num + term2.num)
//       : String(Math.abs(resultSlot.num - term2.num));
//   }

//   // Case C: The unknown is Term 2 (e.g., 12 - ? = 7)
//   if (unknown.key === term2.key) {
//     return operator === "-"
//       ? String(term1.num - resultSlot.num)
//       : String(Math.abs(resultSlot.num - term1.num));
//   }

//   return null;
// };

export const solveMissingValue = (q) => {
  // --- 1. EXISTING TEMPLATE SOLVER (For Modules 3 & 4) ---
  const template = q?.equationSpec?.template || [];
  const slotItems = template.filter((t) => t.type === "slot");

  // Only run the algebra solver if we actually have an equation template
  if (slotItems.length >= 3) {
    // 1. Get the true expected values for all slots
    const vals = slotItems.map((s) => {
      const v = getTrueExpectedValue(q, s.key);
      return {
        key: s.key,
        num: parseFloat(v),
        isUnknown: v === "?" || v === "",
      };
    });

    const unknown = vals.find((v) => v.isUnknown);
    const equalIdx = template.findIndex((t) => t.value === "=");

    if (unknown && equalIdx !== -1) {
      // 2. Find the operator (Defaults to +, but looks for -)
      let operator = "+";
      const opItem = template.find((t) => t.type === "operator");
      if (opItem && (opItem.value === "+" || opItem.value === "-")) {
        operator = opItem.value;
      } else if (q?.equationSpec?.operator) {
        operator = q.equationSpec.operator;
      } else if (q?.operator) {
        operator = q.operator;
      }

      // 3. Identify the "Result" side of the "=" sign
      const resultSlot = vals.find((v) => {
        const idx = template.findIndex((t) => t.key === v.key);
        const onLeft = idx < equalIdx;
        const countOnSide = vals.filter(
          (v2) =>
            template.findIndex((t2) => t2.key === v2.key) < equalIdx === onLeft,
        ).length;
        return countOnSide === 1;
      });

      if (resultSlot) {
        // 4. Identify the two "Terms" on the other side
        const terms = vals.filter((v) => v.key !== resultSlot.key);
        if (terms.length === 2) {
          const [term1, term2] = terms; // term1 is left of the operator, term2 is right

          // --- ALGEBRA SOLVER ---
          if (unknown.key === resultSlot.key) {
            return operator === "-"
              ? String(term1.num - term2.num)
              : String(term1.num + term2.num);
          }
          if (unknown.key === term1.key) {
            return operator === "-"
              ? String(resultSlot.num + term2.num)
              : String(Math.abs(resultSlot.num - term2.num));
          }
          if (unknown.key === term2.key) {
            return operator === "-"
              ? String(term1.num - resultSlot.num)
              : String(Math.abs(resultSlot.num - term1.num));
          }
        }
      }
    }
  }

  // --- 2. FALLBACK SCHEMA SOLVER (For Module 5 - No Template) ---
  const slots = q?.validation?.slots || {};
  const schema = q?.schemaKind?.toLowerCase();

  if (schema === "combine") {
    const l = parseFloat(slots.left || slots.leftTerm);
    const r = parseFloat(slots.right || slots.rightTerm);
    const t = parseFloat(slots.total || slots.result);

    if ((slots.total === "?" || isNaN(t)) && !isNaN(l) && !isNaN(r))
      return String(l + r);
    if ((slots.left === "?" || isNaN(l)) && !isNaN(t) && !isNaN(r))
      return String(t - r);
    if ((slots.right === "?" || isNaN(r)) && !isNaN(t) && !isNaN(l))
      return String(t - l);
  }

  if (schema === "change") {
    const s = parseFloat(slots.start);
    const c = parseFloat(slots.change);
    const r = parseFloat(slots.result || slots.end);
    const op = q?.equationSpec?.operator || q?.operator || "+";

    if (
      (slots.result === "?" || slots.end === "?" || isNaN(r)) &&
      !isNaN(s) &&
      !isNaN(c)
    ) {
      return op === "-" ? String(s - c) : String(s + c);
    }
    if ((slots.change === "?" || isNaN(c)) && !isNaN(s) && !isNaN(r)) {
      return op === "-" ? String(s - r) : String(Math.abs(r - s));
    }
    if ((slots.start === "?" || isNaN(s)) && !isNaN(c) && !isNaN(r)) {
      return op === "-" ? String(r + c) : String(Math.abs(r - c));
    }
  }

  // --- 3. ABSOLUTE LAST RESORT ---
  if (q?.validation?.textAnswer !== undefined)
    return String(q.validation.textAnswer);
  if (q?.validation?.answer !== undefined) return String(q.validation.answer);

  return null;
};
