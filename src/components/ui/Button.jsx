import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-soft-sm hover:from-primary-600 hover:to-primary-700 hover:shadow-soft',
  secondary: 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700',
  ghost: 'bg-transparent text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800',
  danger: 'bg-gradient-to-r from-error-500 to-error-600 text-white shadow-soft-sm hover:from-error-600 hover:to-error-700 hover:shadow-soft',
  success: 'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-soft-sm hover:from-success-600 hover:to-success-700 hover:shadow-soft',
  accent: 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-soft-sm hover:from-accent-600 hover:to-accent-700 hover:shadow-soft',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
  xl: 'px-6 py-3 text-lg gap-2.5',
  icon: 'p-2',
  'icon-sm': 'p-1.5',
  'icon-lg': 'p-2.5',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  as: Component = 'button',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-xl',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
    'focus:ring-offset-white dark:focus:ring-offset-surface-900',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    variants[variant],
    sizes[size],
    className,
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4" />
      ) : null}
      {children && <span>{children}</span>}
      {!loading && RightIcon && <RightIcon className="w-4 h-4" />}
    </>
  );

  // Use motion.button for interactive animation
  if (Component === 'button') {
    return (
      <motion.button
        ref={ref}
        className={baseClasses}
        disabled={isDisabled}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <Component
      ref={ref}
      className={baseClasses}
      disabled={isDisabled}
      {...props}
    >
      {content}
    </Component>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger', 'success', 'accent']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  leftIcon: PropTypes.elementType,
  rightIcon: PropTypes.elementType,
  className: PropTypes.string,
  as: PropTypes.elementType,
};

export default Button;
