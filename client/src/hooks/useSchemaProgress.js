import { useState, useEffect } from "react";

export const useSchemaProgress = (schemaKind, userId) => {
  // 1. Safety check: If userId is passed as the whole userInfo object, grab the ID.
  const safeUserId = typeof userId === "object" ? userId?.id : userId;

  // Now the key will be something like "hasSeenGhost_user123_combine"
  const key =
    schemaKind && safeUserId
      ? `hasSeenGhost_${safeUserId}_${schemaKind}`
      : null;

  // Initialize state
  const [hasCompleted, setHasCompleted] = useState(() => {
    if (!key) return false;
    return localStorage.getItem(key) === "true";
  });

  // 2. 🔥 THE FIX: Re-run this check whenever the user switches!
  useEffect(() => {
    if (!key) {
      setHasCompleted(false);
      return;
    }
    setHasCompleted(localStorage.getItem(key) === "true");
  }, [key]);

  const markCompleted = () => {
    if (!key) return;
    setHasCompleted(true);
    localStorage.setItem(key, "true");
  };

  return { hasCompleted, markCompleted };
};
