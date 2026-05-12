import { useTheme } from '../hooks/useTheme';
import './ThemeSwitcher.css';

export function ThemeSwitcher() {
  const { theme, setTheme, themeNames } = useTheme();

  const themes: Array<'rx78' | 'rx178' | 'rx93'> = ['rx78', 'rx178', 'rx93'];

  return (
    <div className="theme-switcher">
      <div className="theme-label">GUNDAM THEME</div>
      <div className="theme-buttons">
        {themes.map((t) => (
          <button
            key={t}
            className={`theme-btn ${theme === t ? 'active' : ''}`}
            onClick={() => setTheme(t)}
            title={themeNames[t]}
          >
            <span className="theme-code">{t.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}