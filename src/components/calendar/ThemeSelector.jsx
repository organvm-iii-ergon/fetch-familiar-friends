import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

// Theme accent color mapping for selected state
const themeAccentStyles = {
  park: 'bg-emerald-500 hover:bg-emerald-600',
  beach: 'bg-sky-500 hover:bg-sky-600',
  forest: 'bg-green-700 hover:bg-green-800',
  tundra: 'bg-cyan-600 hover:bg-cyan-700',
  sunset: 'bg-orange-500 hover:bg-orange-600',
  night: 'bg-indigo-600 hover:bg-indigo-700',
  snow: 'bg-blue-400 hover:bg-blue-500',
  autumn: 'bg-amber-600 hover:bg-amber-700'
};

const ThemeSelector = ({ currentTheme, onThemeChange, themes }) => {
  return (
    <div
      className="flex gap-2 justify-start mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4"
      role="group"
      aria-label="Theme selector"
    >
      {themes.map((theme) => {
        const isSelected = currentTheme === theme.name;
        return (
          <motion.button
            key={theme.name}
            onClick={() => onThemeChange(theme.name)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500/50
              ${isSelected
                ? `${themeAccentStyles[theme.name]} text-white shadow-soft-sm`
                : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label={`Select ${theme.label} theme`}
            aria-pressed={isSelected}
            title={`Switch to ${theme.label} theme`}
          >
            {theme.label}
          </motion.button>
        );
      })}
    </div>
  );
};

ThemeSelector.propTypes = {
  currentTheme: PropTypes.string.isRequired,
  onThemeChange: PropTypes.func.isRequired,
  themes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired
};

export default ThemeSelector;
