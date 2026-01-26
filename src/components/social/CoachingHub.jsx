import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Calendar,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Video,
  MessageSquare,
  X,
  Check,
  Loader2,
  AlertCircle,
  User,
  DollarSign,
  Award,
  Filter,
  Search,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase, isOnlineMode } from '../../config/supabase';

// Time slot generation helper
function generateTimeSlots(date, availability) {
  const slots = [];
  const dayOfWeek = date.getDay();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[dayOfWeek];

  // Parse availability string
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isWeekday = !isWeekend;

  let startHour = 9;
  let endHour = 17;

  if (availability.includes('evenings')) {
    startHour = 17;
    endHour = 21;
  } else if (availability.includes('Weekends')) {
    if (!isWeekend) return slots;
    startHour = 10;
    endHour = 18;
  } else if (availability.includes('Flexible')) {
    startHour = 8;
    endHour = 20;
  } else if (availability.includes('Mon-Fri') && isWeekend) {
    return slots;
  }

  // Generate slots
  for (let hour = startHour; hour < endHour; hour++) {
    const isBooked = Math.random() > 0.7; // 30% chance of being booked
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      available: !isBooked,
    });
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:30`,
      available: !isBooked && Math.random() > 0.3,
    });
  }

  return slots;
}

// Featured monthly coaches
const COACHES_DATA = [
  {
    id: 1,
    name: 'Dr. Sarah Martinez',
    specialty: 'Behavioral Training',
    title: 'Certified Dog Behaviorist',
    rating: 4.9,
    reviews: 1247,
    hourlyRate: 89,
    featured: true,
    avatar: null,
    bio: '15+ years experience in positive reinforcement training. PhD in Animal Behavior from UC Davis.',
    specialties: ['Aggression', 'Anxiety', 'Obedience'],
    availability: 'Mon-Fri 9am-5pm',
    languages: ['English', 'Spanish'],
    certifications: ['CPDT-KA', 'CAAB', 'Fear Free Certified'],
    sessionTypes: ['video', 'chat'],
  },
  {
    id: 2,
    name: 'Mike Thompson',
    specialty: 'Agility & Athletics',
    title: 'Professional Agility Trainer',
    rating: 4.8,
    reviews: 892,
    hourlyRate: 75,
    featured: true,
    avatar: null,
    bio: 'Championship agility coach, competed nationally. Former Olympic athlete.',
    specialties: ['Agility', 'Competition Prep', 'Fitness'],
    availability: 'Weekends & evenings',
    languages: ['English'],
    certifications: ['AKC Agility Judge', 'NADAC Certified'],
    sessionTypes: ['video'],
  },
  {
    id: 3,
    name: 'Emily Chen',
    specialty: 'Puppy Development',
    title: 'Puppy Socialization Expert',
    rating: 5.0,
    reviews: 634,
    hourlyRate: 65,
    featured: false,
    avatar: null,
    bio: 'Specializing in critical socialization periods. Veterinary technician background.',
    specialties: ['Puppies', 'Socialization', 'Basic Training'],
    availability: 'Flexible schedule',
    languages: ['English', 'Mandarin'],
    certifications: ['CPDT-KA', 'KPA CTP'],
    sessionTypes: ['video', 'chat'],
  },
  {
    id: 4,
    name: 'Dr. James Wilson',
    specialty: 'Cat Behavior',
    title: 'Feline Behaviorist',
    rating: 4.7,
    reviews: 421,
    hourlyRate: 85,
    featured: false,
    avatar: null,
    bio: 'Specializing in feline psychology and multi-cat household dynamics.',
    specialties: ['Litter Issues', 'Aggression', 'Stress'],
    availability: 'Mon-Fri 10am-6pm',
    languages: ['English'],
    certifications: ['CCBC', 'IAABC Certified'],
    sessionTypes: ['video', 'chat'],
  },
  {
    id: 5,
    name: 'Lisa Rodriguez',
    specialty: 'Nutrition & Diet',
    title: 'Pet Nutritionist',
    rating: 4.9,
    reviews: 756,
    hourlyRate: 70,
    featured: false,
    avatar: null,
    bio: 'Certified pet nutritionist helping with weight management and special diets.',
    specialties: ['Weight Management', 'Allergies', 'Raw Diets'],
    availability: 'Mon-Sat 9am-7pm',
    languages: ['English', 'Portuguese'],
    certifications: ['PCNS', 'ACVN Eligible'],
    sessionTypes: ['video', 'chat'],
  },
];

// My booked sessions (mock data)
const MOCK_SESSIONS = [
  {
    id: 'session-1',
    coachId: 1,
    coachName: 'Dr. Sarah Martinez',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    time: '10:00',
    duration: 60,
    type: 'video',
    status: 'confirmed',
    meetingUrl: 'https://meet.dogtale.com/session-abc123',
    notes: 'First session - discussing anxiety issues',
    amount: 89,
  },
  {
    id: 'session-2',
    coachId: 3,
    coachName: 'Emily Chen',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    time: '14:00',
    duration: 60,
    type: 'video',
    status: 'completed',
    meetingUrl: null,
    notes: 'Puppy socialization training - great progress!',
    coachNotes: 'Max is responding well to positive reinforcement. Continue with the exercises discussed.',
    amount: 65,
  },
];

// Coach Card Component
function CoachCard({ coach, onBook, onViewProfile, compact = false }) {
  const getAvatarEmoji = (specialty) => {
    const emojiMap = {
      'Behavioral Training': '🧠',
      'Agility & Athletics': '🏃',
      'Puppy Development': '🐕',
      'Cat Behavior': '🐱',
      'Nutrition & Diet': '🥗',
    };
    return emojiMap[specialty] || '👨‍🏫';
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-lg transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="text-4xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-2 rounded-xl">
            {getAvatarEmoji(coach.specialty)}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-gray-800 dark:text-gray-100 truncate">{coach.name}</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">{coach.specialty}</p>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{coach.rating}</span>
              <span className="text-xs text-gray-500">({coach.reviews})</span>
            </div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-2">
              ${coach.hourlyRate}/session
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onBook(coach)}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Book
              </button>
              <button
                onClick={() => onViewProfile(coach)}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="text-6xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-3 rounded-2xl">
          {getAvatarEmoji(coach.specialty)}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h5 className="text-xl font-bold text-gray-800 dark:text-gray-100">{coach.name}</h5>
              <p className="text-gray-600 dark:text-gray-400">{coach.title}</p>
            </div>
            {coach.featured && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium flex items-center gap-1">
                <Award className="w-4 h-4" /> Featured
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">{coach.rating}</span>
            <span className="text-sm text-gray-500">({coach.reviews} reviews)</span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">{coach.bio}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {coach.specialties.map((spec, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
              >
                {spec}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {coach.availability}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> {coach.languages.join(', ')}
            </span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">${coach.hourlyRate}</span>
              <span className="text-gray-500 dark:text-gray-400">/session</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onViewProfile(coach)}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                View Profile
              </button>
              <button
                onClick={() => onBook(coach)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Book Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

CoachCard.propTypes = {
  coach: PropTypes.object.isRequired,
  onBook: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};

// Calendar Component for booking
function BookingCalendar({ coach, onSelectSlot, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  const handleDateSelect = (date) => {
    if (!date || date < new Date().setHours(0, 0, 0, 0)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    const slots = generateTimeSlots(date, coach.availability);
    setTimeSlots(slots);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleConfirm = () => {
    if (selectedDate && selectedSlot) {
      onSelectSlot({
        date: selectedDate,
        time: selectedSlot.time,
        coach,
      });
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Book a Session</h3>
              <p className="text-white/80 mt-1">with {coach.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h4>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-6">
            {days.map((date, index) => {
              const isPast = date && date < new Date().setHours(0, 0, 0, 0);
              const isSelected = selectedDate && date &&
                date.toDateString() === selectedDate.toDateString();
              const isToday = date && date.toDateString() === new Date().toDateString();

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  disabled={!date || isPast}
                  className={`
                    p-3 text-center rounded-lg transition-colors
                    ${!date ? 'invisible' : ''}
                    ${isPast ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : ''}
                    ${isSelected ? 'bg-blue-500 text-white' : ''}
                    ${isToday && !isSelected ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}
                    ${!isPast && !isSelected && !isToday && date ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300' : ''}
                  `}
                >
                  {date?.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
                Available times for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h5>
              {timeSlots.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => slot.available && setSelectedSlot(slot)}
                      disabled={!slot.available}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${!slot.available ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed line-through' : ''}
                        ${slot.available && selectedSlot?.time === slot.time ? 'bg-blue-500 text-white' : ''}
                        ${slot.available && selectedSlot?.time !== slot.time ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' : ''}
                      `}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No available slots for this date. Try another day.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
          <div>
            {selectedDate && selectedSlot && (
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{selectedDate.toLocaleDateString()}</span> at{' '}
                <span className="font-semibold">{selectedSlot.time}</span>
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedSlot}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

BookingCalendar.propTypes = {
  coach: PropTypes.object.isRequired,
  onSelectSlot: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

// Payment/Confirmation Modal
function PaymentModal({ booking, onConfirm, onClose, isLoading }) {
  const { coach, date, time } = booking;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            Confirm Your Booking
          </h3>

          <div className="space-y-4">
            {/* Coach info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-4xl">🧠</div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{coach.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{coach.specialty}</p>
              </div>
            </div>

            {/* Date/Time */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">at {time}</p>
              </div>
            </div>

            {/* Session type */}
            <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <Video className="w-8 h-8 text-purple-500" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">Video Call Session</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">60 minutes</p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-4">
                <DollarSign className="w-8 h-8 text-green-500" />
                <span className="font-semibold text-gray-800 dark:text-gray-100">Total</span>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${coach.hourlyRate}
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>Cancellation policy:</strong> Free cancellation up to 24 hours before the session.
              50% refund within 24 hours.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Pay ${coach.hourlyRate}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

PaymentModal.propTypes = {
  booking: PropTypes.object.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

// Confirmation Success Modal
function ConfirmationModal({ session, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full text-center p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Check className="w-10 h-10 text-green-500" />
        </motion.div>

        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Booking Confirmed!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your session with {session.coachName} is scheduled.
        </p>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Session Details</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {new Date(session.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })} at {session.time}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">Video Call Link</p>
          <a
            href={session.meetingUrl}
            className="text-blue-500 hover:underline break-all"
          >
            {session.meetingUrl}
          </a>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            The link will be active 5 minutes before your session.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          View My Sessions
        </button>
      </motion.div>
    </div>
  );
}

ConfirmationModal.propTypes = {
  session: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

// Session Card
function SessionCard({ session, isPast, onJoin, onCancel, onReschedule }) {
  const sessionDate = new Date(session.date);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border-l-4 ${
        isPast ? 'border-gray-300 dark:border-gray-600' :
        session.status === 'confirmed' ? 'border-green-500' : 'border-yellow-500'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="text-4xl">
            {isPast ? '📋' : '📅'}
          </div>
          <div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">{session.coachName}</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sessionDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })} at {session.time}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                session.status === 'completed' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                session.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              }`}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {session.type === 'video' ? '📹 Video' : '💬 Chat'}
              </span>
            </div>
            {session.notes && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {session.notes}
              </p>
            )}
            {session.coachNotes && isPast && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Coach Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{session.coachNotes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="font-semibold text-gray-800 dark:text-gray-100">${session.amount}</p>
          {!isPast && session.status === 'confirmed' && (
            <div className="flex flex-col gap-2 mt-3">
              <button
                onClick={() => onJoin(session)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Join Call
              </button>
              <button
                onClick={() => onReschedule(session)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Reschedule
              </button>
              <button
                onClick={() => onCancel(session)}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

SessionCard.propTypes = {
  session: PropTypes.object.isRequired,
  isPast: PropTypes.bool,
  onJoin: PropTypes.func,
  onCancel: PropTypes.func,
  onReschedule: PropTypes.func,
};

// Main CoachingHub Component
function CoachingHub() {
  const { isAuthenticated, isOnlineMode } = useAuth();
  const { createCheckoutSession, hasFeature } = useSubscription();

  const [activeView, setActiveView] = useState('coaches'); // 'coaches' | 'sessions'
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [confirmedSession, setConfirmedSession] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');

  const featuredCoach = COACHES_DATA.find(c => c.featured);
  const otherCoaches = COACHES_DATA.filter(c => c.id !== featuredCoach?.id);

  // Filter coaches
  const filteredCoaches = useMemo(() => {
    return otherCoaches.filter(coach => {
      const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filterSpecialty === 'all' || coach.specialty === filterSpecialty;
      return matchesSearch && matchesFilter;
    });
  }, [otherCoaches, searchQuery, filterSpecialty]);

  const specialties = useMemo(() => {
    const specs = new Set(COACHES_DATA.map(c => c.specialty));
    return Array.from(specs);
  }, []);

  const upcomingSessions = sessions.filter(s => new Date(s.date) > new Date() && s.status !== 'cancelled');
  const pastSessions = sessions.filter(s => new Date(s.date) <= new Date() || s.status === 'completed');

  const handleBookCoach = (coach) => {
    setSelectedCoach(coach);
    setShowCalendar(true);
    setError(null);
  };

  const handleSelectSlot = (booking) => {
    setPendingBooking(booking);
    setShowCalendar(false);
    setShowPayment(true);
  };

  const handleConfirmPayment = async () => {
    if (!pendingBooking) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (isOnlineMode && isAuthenticated) {
        // Create checkout session via Stripe
        const priceId = import.meta.env.VITE_STRIPE_COACHING_PRICE_ID || 'price_coaching_default';

        const { data, error: checkoutError } = await supabase.functions.invoke('create-checkout-session', {
          body: {
            priceId,
            mode: 'payment',
            metadata: {
              type: 'coaching_session',
              coachId: pendingBooking.coach.id,
              date: pendingBooking.date.toISOString(),
              time: pendingBooking.time,
            },
            successUrl: `${window.location.origin}/coaching/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/coaching/cancel`,
          },
        });

        if (checkoutError) throw checkoutError;

        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }

      // For demo mode or if Stripe is not configured, simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newSession = {
        id: `session-${Date.now()}`,
        coachId: pendingBooking.coach.id,
        coachName: pendingBooking.coach.name,
        date: pendingBooking.date.toISOString(),
        time: pendingBooking.time,
        duration: 60,
        type: 'video',
        status: 'confirmed',
        meetingUrl: `https://meet.dogtale.com/session-${Math.random().toString(36).substring(7)}`,
        notes: '',
        amount: pendingBooking.coach.hourlyRate,
      };

      setSessions(prev => [newSession, ...prev]);
      setConfirmedSession(newSession);
      setShowPayment(false);
      setShowConfirmation(true);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinSession = (session) => {
    if (session.meetingUrl) {
      window.open(session.meetingUrl, '_blank');
    }
  };

  const handleCancelSession = async (session) => {
    if (confirm('Are you sure you want to cancel this session?')) {
      setSessions(prev => prev.map(s =>
        s.id === session.id ? { ...s, status: 'cancelled' } : s
      ));
    }
  };

  const handleRescheduleSession = (session) => {
    const coach = COACHES_DATA.find(c => c.id === session.coachId);
    if (coach) {
      setSelectedCoach(coach);
      setShowCalendar(true);
    }
  };

  const handleViewProfile = (coach) => {
    // Could open a detailed profile modal
    setSelectedCoach(coach);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setConfirmedSession(null);
    setPendingBooking(null);
    setActiveView('sessions');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Coaching & Training
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Book sessions with certified pet professionals
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveView('coaches')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'coaches'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Find Coaches
          </button>
          <button
            onClick={() => setActiveView('sessions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              activeView === 'sessions'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            My Sessions
            {upcomingSessions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {upcomingSessions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeView === 'coaches' ? (
          <motion.div
            key="coaches"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Featured Coach */}
            {featuredCoach && (
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-yellow-400 dark:border-yellow-600">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">⭐</span>
                  <h4 className="font-bold text-gray-800 dark:text-gray-100">Featured Coach of the Month</h4>
                </div>
                <CoachCard
                  coach={featuredCoach}
                  onBook={handleBookCoach}
                  onViewProfile={handleViewProfile}
                />
              </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search coaches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Specialties</option>
                  {specialties.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* All Coaches */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
                Expert Coaches ({filteredCoaches.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCoaches.map((coach) => (
                  <CoachCard
                    key={coach.id}
                    coach={coach}
                    onBook={handleBookCoach}
                    onViewProfile={handleViewProfile}
                    compact
                  />
                ))}
              </div>
              {filteredCoaches.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No coaches found matching your criteria.
                </p>
              )}
            </div>

            {/* Premium discount banner */}
            {hasFeature('social') && (
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👑</span>
                    <div>
                      <p className="font-semibold">Premium Member Discount</p>
                      <p className="text-sm text-white/80">You save 10% on all coaching sessions!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Upcoming Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
                Upcoming Sessions ({upcomingSessions.length})
              </h4>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      isPast={false}
                      onJoin={handleJoinSession}
                      onCancel={handleCancelSession}
                      onReschedule={handleRescheduleSession}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No upcoming sessions scheduled.
                  </p>
                  <button
                    onClick={() => setActiveView('coaches')}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Book a Session
                  </button>
                </div>
              )}
            </div>

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
                <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
                  Past Sessions ({pastSessions.length})
                </h4>
                <div className="space-y-4">
                  {pastSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      isPast={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showCalendar && selectedCoach && (
          <BookingCalendar
            coach={selectedCoach}
            onSelectSlot={handleSelectSlot}
            onClose={() => {
              setShowCalendar(false);
              setSelectedCoach(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayment && pendingBooking && (
          <PaymentModal
            booking={pendingBooking}
            onConfirm={handleConfirmPayment}
            onClose={() => {
              setShowPayment(false);
              setPendingBooking(null);
            }}
            isLoading={isProcessing}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmation && confirmedSession && (
          <ConfirmationModal
            session={confirmedSession}
            onClose={handleConfirmationClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default CoachingHub;
