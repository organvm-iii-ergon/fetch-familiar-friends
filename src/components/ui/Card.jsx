import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const variants = {
  elevated: 'bg-white dark:bg-surface-800 border border-surface-200/60 dark:border-surface-700/60 shadow-soft',
  outlined: 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700',
  glass: 'bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-soft',
  gradient: 'bg-gradient-to-br from-primary-500/10 to-accent-500/10 dark:from-primary-500/20 dark:to-accent-500/20 border border-primary-200/50 dark:border-primary-800/50',
  flat: 'bg-surface-50 dark:bg-surface-900',
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const Card = forwardRef(({
  children,
  variant = 'elevated',
  padding = 'md',
  interactive = false,
  className = '',
  header,
  footer,
  as: Component = 'div',
  ...props
}, ref) => {
  const baseClasses = [
    'rounded-2xl',
    'transition-all duration-200',
    variants[variant],
    interactive && 'cursor-pointer hover:shadow-soft-md hover:-translate-y-0.5 active:shadow-soft-sm active:translate-y-0',
    className,
  ].filter(Boolean).join(' ');

  const CardComponent = interactive ? motion.div : Component;
  const motionProps = interactive ? {
    whileHover: { y: -2 },
    whileTap: { y: 0 },
    transition: { duration: 0.15 },
  } : {};

  return (
    <CardComponent
      ref={ref}
      className={baseClasses}
      {...motionProps}
      {...props}
    >
      {header && (
        <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
          {header}
        </div>
      )}
      <div className={paddings[padding]}>
        {children}
      </div>
      {footer && (
        <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 rounded-b-2xl">
          {footer}
        </div>
      )}
    </CardComponent>
  );
});

Card.displayName = 'Card';

Card.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['elevated', 'outlined', 'glass', 'gradient', 'flat']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  interactive: PropTypes.bool,
  className: PropTypes.string,
  header: PropTypes.node,
  footer: PropTypes.node,
  as: PropTypes.elementType,
};

export default Card;
