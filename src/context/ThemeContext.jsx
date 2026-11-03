import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'mibebe_theme';

export const THEMES = [
  { id: 'rosa', label: 'Rosa algodon', description: 'Calido y tierno', surface: '#fff8f8', primary: '#745662', container: '#fad2e1', accent: '#d1e7dd' },
  { id: 'menta', label: 'Menta suave', description: 'Fresco y tranquilo', surface: '#f3fbf7', primary: '#3d6b5b', container: '#c9ebdc', accent: '#fde1cf' },
  { id: 'cielo', label: 'Cielo bebe', description: 'Sereno y luminoso', surface: '#f5f9fe', primary: '#46688f', container: '#d2e4f8', accent: '#e5dcf7' },
  { id: 'lavanda', label: 'Lavanda dulce', description: 'Suave y sonador', surface: '#faf7ff', primary: '#6a5790', container: '#e5dcf8', accent: '#d4ece1' },
  { id: 'durazno', label: 'Durazno calido', description: 'Acogedor como un atardecer', surface: '#fef8f4', primary: '#864a27', container: '#f9dac8', accent: '#d8ebee' },
  { id: 'salvia', label: 'Salvia y lila', description: 'Natural y relajante', surface: '#f8fcf6', primary: '#50713d', container: '#dcf2ce', accent: '#eed8ed' },
  { id: 'arena', label: 'Arena de playa', description: 'Neutro y elegante', surface: '#fdfaf5', primary: '#6c593d', container: '#f4e4cd', accent: '#d9ebed' },
  { id: 'oceano', label: 'Mar en calma', description: 'Profundo y sereno', surface: '#f4fcfd', primary: '#1f687a', container: '#c8eff9', accent: '#d5e3f1' },
];

const VALID = new Set(THEMES.map((t) => t.id));
const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return VALID.has(saved) ? saved : 'rosa';
  } catch {
    return 'rosa';
  }
}

function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0];
  document.documentElement.setAttribute('data-theme', theme.id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.surface);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((id) => {
    if (!VALID.has(id)) return;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* se aplica igualmente durante la sesion */
    }
    setThemeState(id);
  }, []);

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
