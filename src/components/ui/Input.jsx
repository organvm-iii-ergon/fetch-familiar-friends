import { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftAddon,
  rightAddon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const hasAddon = leftAddon || rightAddon;

  const inputClasses = [
    'w-full px-4 py-2.5 rounded-xl',
    'bg-white dark:bg-surface-800',
    'border',
    error
      ? 'border-error-500 focus:ring-error-500/30 focus:border-error-500'
      : 'border-surface-200 dark:border-surface-700 focus:ring-primary-500/30 focus:border-primary-500',
    'text-surface-900 dark:text-surface-100',
    'placeholder:text-surface-400 dark:placeholder:text-surface-500',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2',
    leftAddon && 'pl-10',
    rightAddon && 'pr-10',
    className,
  ].filter(Boolean).join(' ');

  const inputElement = (
    <div className="relative">
      {leftAddon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500">
          {leftAddon}
        </div>
      )}
      <input
        ref={ref}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
        {...props}
      />
      {rightAddon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500">
          {rightAddon}
        </div>
      )}
    </div>
  );

  if (!label && !error && !helperText) {
    return inputElement;
  }

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
        >
          {label}
        </label>
      )}
      {inputElement}
      {error && (
        <p id={`${props.id}-error`} className="text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${props.id}-helper`} className="text-sm text-surface-500 dark:text-surface-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  leftAddon: PropTypes.node,
  rightAddon: PropTypes.node,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  id: PropTypes.string,
};

// Textarea variant
const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}, ref) => {
  const textareaClasses = [
    'w-full px-4 py-2.5 rounded-xl',
    'bg-white dark:bg-surface-800',
    'border',
    error
      ? 'border-error-500 focus:ring-error-500/30 focus:border-error-500'
      : 'border-surface-200 dark:border-surface-700 focus:ring-primary-500/30 focus:border-primary-500',
    'text-surface-900 dark:text-surface-100',
    'placeholder:text-surface-400 dark:placeholder:text-surface-500',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2',
    'resize-none',
    className,
  ].filter(Boolean).join(' ');

  const textareaElement = (
    <textarea
      ref={ref}
      rows={rows}
      className={textareaClasses}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    />
  );

  if (!label && !error && !helperText) {
    return textareaElement;
  }

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
        >
          {label}
        </label>
      )}
      {textareaElement}
      {error && (
        <p className="text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  rows: PropTypes.number,
  id: PropTypes.string,
};

// Compound export
Input.Textarea = Textarea;

export default Input;
