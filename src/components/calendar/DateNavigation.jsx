import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DateNavigation = ({ currentDate, onDateChange }) => {
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return currentDate.toDateString() === today.toDateString();
  };

  const isFuture = () => {
    const today = new Date();
    return currentDate > today;
  };

  return (
    <div className="flex items-center justify-center gap-3 mb-6" role="navigation" aria-label="Date navigation">
      {/* Previous Day */}
      <motion.button
        onClick={goToPreviousDay}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Go to previous day"
        title="Previous day (← or H)"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Previous</span>
      </motion.button>

      {/* Today Button */}
      <motion.button
        onClick={goToToday}
        disabled={isToday()}
        className={`px-5 py-2.5 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
          isToday()
            ? 'bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500 cursor-not-allowed'
            : 'bg-primary-500 hover:bg-primary-600 text-white shadow-soft-sm hover:shadow-soft'
        }`}
        whileHover={!isToday() ? { scale: 1.02 } : {}}
        whileTap={!isToday() ? { scale: 0.98 } : {}}
        aria-label="Go to today"
        title="Jump to today (T)"
      >
        Today
      </motion.button>

      {/* Next Day */}
      <motion.button
        onClick={goToNextDay}
        disabled={isFuture()}
        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
          isFuture()
            ? 'text-surface-300 dark:text-surface-600 cursor-not-allowed'
            : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
        }`}
        whileHover={!isFuture() ? { x: 2 } : {}}
        whileTap={!isFuture() ? { scale: 0.98 } : {}}
        aria-label="Go to next day"
        title="Next day (→ or L)"
      >
        <span className="text-sm font-medium hidden sm:inline">Next</span>
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

DateNavigation.propTypes = {
  currentDate: PropTypes.instanceOf(Date).isRequired,
  onDateChange: PropTypes.func.isRequired
};

export default DateNavigation;
