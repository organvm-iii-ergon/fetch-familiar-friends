import { useState, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

// Static data defined outside component to avoid recreation
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MonthCalendar = memo(({ currentDate, journalEntries = {}, favorites = [], onDateSelect }) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate));

  // Get calendar data for the month
  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Days from previous month to show
    const prevMonthDays = firstDayOfWeek;
    const prevMonth = new Date(year, month, 0);
    const prevMonthLastDay = prevMonth.getDate();

    // Total cells needed (always 6 rows for consistency)
    const totalCells = 42;
    const nextMonthDays = totalCells - (prevMonthDays + daysInMonth);

    // Build calendar array
    const days = [];

    // Previous month days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isPrevMonth: false
      });
    }

    // Next month days
    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isPrevMonth: false
      });
    }

    return days;
  }, [viewDate]);

  // Check if a date has journal entry
  const hasJournalEntry = (date) => {
    const dateKey = date.toDateString();
    return journalEntries[dateKey] && journalEntries[dateKey].trim().length > 0;
  };

  // Check if a date has favorites
  const hasFavorite = (date) => {
    const dateStr = date.toDateString();
    return favorites.some(fav => {
      const favDate = new Date(fav.savedAt).toDateString();
      return favDate === dateStr;
    });
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date) => {
    return date.toDateString() === currentDate.toDateString();
  };

  // Check if date is in the future
  const isFuture = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  };

  const handleToday = () => {
    setViewDate(new Date());
  };

  const handleDateClick = (date) => {
    if (!isFuture(date) && onDateSelect) {
      onDateSelect(date);
    }
  };

  const formatMonthYear = () => {
    return viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatMonthYear()}</h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
            title="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            aria-label="Go to today"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
            title="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarData.map((dayData, index) => {
          const hasJournal = hasJournalEntry(dayData.date);
          const hasFav = hasFavorite(dayData.date);
          const isCurrentDay = isToday(dayData.date);
          const isSelectedDay = isSelected(dayData.date);
          const isFutureDay = isFuture(dayData.date);

          return (
            <motion.button
              key={index}
              onClick={() => handleDateClick(dayData.date)}
              disabled={isFutureDay}
              whileHover={!isFutureDay ? { scale: 1.05 } : {}}
              whileTap={!isFutureDay ? { scale: 0.95 } : {}}
              className={`
                relative aspect-square p-2 rounded-lg text-center transition-all
                ${!dayData.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'}
                ${isCurrentDay ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                ${isSelectedDay ? 'bg-blue-500 dark:bg-blue-600 text-white font-bold' : ''}
                ${!isSelectedDay && dayData.isCurrentMonth && !isFutureDay ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                ${isFutureDay ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                ${!isFutureDay && !isSelectedDay ? 'focus:outline-none focus:ring-2 focus:ring-blue-400' : ''}
              `}
              aria-label={`${dayData.date.toLocaleDateString()}${hasJournal ? ', has journal entry' : ''}${hasFav ? ', marked as favorite' : ''}`}
              title={`${dayData.date.toLocaleDateString()}${hasJournal ? ' (has journal)' : ''}${hasFav ? ' (has favorites)' : ''}`}
            >
              <div className="text-sm font-medium">{dayData.day}</div>

              {/* Indicators */}
              {(hasJournal || hasFav) && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {hasJournal && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelectedDay ? 'bg-white' : 'bg-green-500'
                      }`}
                    />
                  )}
                  {hasFav && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelectedDay ? 'bg-yellow-200' : 'bg-yellow-500'
                      }`}
                    />
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 dark:border-blue-400 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Journal Entry</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Favorite</span>
          </div>
        </div>
      </div>
    </div>
  );
});

MonthCalendar.propTypes = {
  currentDate: PropTypes.instanceOf(Date).isRequired,
  journalEntries: PropTypes.object,
  favorites: PropTypes.array,
  onDateSelect: PropTypes.func
};

MonthCalendar.defaultProps = {
  journalEntries: {},
  favorites: [],
  onDateSelect: null
};

export default MonthCalendar;
