import { useState, useEffect, useCallback, createContext, useContext } from 'react';

type Theme = 'rx78' | 'rx178' | 'rx93';

const themeNames: Record<Theme, string> = {
  rx78: 'RX-78-2 元祖高达',
  rx178: 'RX-178 Mk-II',
  rx93: 'RX-93 ν高达',
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeNames: Record<Theme, string>;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('gundam-theme');
    return (saved as Theme) || 'rx78';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gundam-theme', theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeNames }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}