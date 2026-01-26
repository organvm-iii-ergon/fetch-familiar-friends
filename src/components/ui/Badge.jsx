import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const variants = {
  info: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
  error: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300',
  neutral: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
  accent: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center gap-1.5 font-medium rounded-full',
    variants[variant],
    sizes[size],
    className,
  ].filter(Boolean).join(' ');

  const dotColors = {
    info: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    neutral: 'bg-surface-400',
    accent: 'bg-accent-500',
  };

  return (
    <span className={baseClasses} {...props}>
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <motion.span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}
              animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[variant]}`} />
        </span>
      )}
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['info', 'success', 'warning', 'error', 'neutral', 'accent']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  dot: PropTypes.bool,
  pulse: PropTypes.bool,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

export default Badge;
