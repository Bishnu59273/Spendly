import { useState, useEffect, useCallback } from "react";

const THEME_EVENT = "spendly:theme-change";

function isDark() {
  return document.documentElement.classList.contains("dark");
}

export function useDarkMode() {
  const [dark, setDark] = useState(isDark);

  useEffect(() => {
    const onThemeChange = () => setDark(isDark());
    window.addEventListener(THEME_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_EVENT, onThemeChange);
  }, []);

  const toggleDark = useCallback(() => {
    const next = !isDark();
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return [dark, toggleDark];
}
