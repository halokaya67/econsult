import { useEffect, useState } from "react";

// A field's error joins its accessible name on the next render, so a focus event sent in the same
// tick speaks the name it had before. The request runs after the commit that carries the error.
export function useFocusAfterCommit(): (focus: () => void) => void {
  // A fresh object per request, so asking twice for the same field still focuses twice.
  const [request, setRequest] = useState<{ run: () => void } | null>(null);

  useEffect(() => {
    request?.run();
  }, [request]);

  return (focus) => setRequest({ run: focus });
}
