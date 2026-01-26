import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  showClose = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-[calc(100vw-2rem)]',
  };

  const headerVariants = {
    default: 'bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700',
    gradient: 'bg-gradient-to-r from-primary-500 to-accent-500 text-white',
    'gradient-warm': 'bg-gradient-to-r from-orange-500 to-pink-500 text-white',
    'gradient-cool': 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
    'gradient-nature': 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
  };

  const isGradientHeader = variant !== 'default';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/60 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              className={`
                bg-white dark:bg-surface-800
                rounded-2xl shadow-soft-xl
                w-full ${sizeClasses[size]}
                max-h-[90vh] overflow-hidden
                border border-surface-200/50 dark:border-surface-700/50
              `}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-4 ${headerVariants[variant]}`}>
                <h2
                  id="modal-title"
                  className={`text-xl font-semibold ${
                    isGradientHeader
                      ? 'text-white'
                      : 'text-surface-800 dark:text-surface-100'
                  }`}
                >
                  {title}
                </h2>
                {showClose && (
                  <motion.button
                    onClick={onClose}
                    className={`
                      p-2 rounded-xl transition-colors
                      ${isGradientHeader
                        ? 'text-white/80 hover:text-white hover:bg-white/20'
                        : 'text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
                      }
                      focus:outline-none focus:ring-2 focus:ring-primary-500/50
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)] scrollbar-hide">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'full']),
  variant: PropTypes.oneOf(['default', 'gradient', 'gradient-warm', 'gradient-cool', 'gradient-nature']),
  showClose: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
};

Modal.defaultProps = {
  size: 'md',
  variant: 'default',
  showClose: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
};

export default Modal;
