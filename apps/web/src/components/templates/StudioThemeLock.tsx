"use client";

import { useEffect } from "react";

/**
 * The studio canvas is intentionally a dark workspace (hard-coded felt/ink
 * colors). The rest of the app supports a light theme, which would otherwise
 * leave the editor chrome light and the canvas dark — an inconsistent mix.
 * While the studio is mounted we lock the document to dark, restoring the
 * user's theme on exit.
 */
export function StudioThemeLock() {
  useEffect(() => {
    const root = document.documentElement;
    const prevClass = root.className;
    const prevData = root.getAttribute("data-theme");
    const prevColorScheme = root.style.colorScheme;

    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";

    return () => {
      root.className = prevClass;
      if (prevData) root.setAttribute("data-theme", prevData);
      else root.removeAttribute("data-theme");
      root.style.colorScheme = prevColorScheme;
    };
  }, []);

  return null;
}
