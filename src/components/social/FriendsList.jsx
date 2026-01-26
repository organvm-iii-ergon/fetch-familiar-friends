import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Search,
  UserPlus,
  Check,
  X,
  Clock,
  Calendar,
  MapPin,
  Trophy,
  PawPrint,
  ChevronRight,
  Loader2,
  UserMinus,
  Ban,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import { friendshipLevels, timeAgo, getRandomColor } from '../../utils/socialData';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';

// Debounce hook for search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Friend Search Modal
function FriendSearchModal({ isOpen, onClose, onSearch, onAddFriend, isAuthenticated }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingUserId, setAddingUserId] = useState(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim() || !isAuthenticated) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await onSearch(debouncedQuery);
        if (result.error) {
          setError(result.error.message || 'Search failed');
          setSearchResults([]);
        } else {
          setSearchResults(result.data || []);
        }
      } catch (err) {
        setError('Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, onSearch, isAuthenticated]);

  const handleAddFriend = async (userId) => {
    if (!isAuthenticated) return;

    setAddingUserId(userId);
    try {
      const result = await onAddFriend(userId);
      if (!result?.error) {
        // Remove user from search results after successful request
        setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      }
    } finally {
      setAddingUserId(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100">
              Find Friends
            </h3>
            <Button variant="ghost" size="icon-sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Input
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftAddon={<Search className="w-4 h-4" />}
            rightAddon={loading && <Loader2 className="w-4 h-4 animate-spin" />}
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {!isAuthenticated && (
            <div className="text-center py-8 text-surface-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Sign in to search for friends</p>
            </div>
          )}

          {isAuthenticated && error && (
            <div className="text-center py-8 text-error-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{error}</p>
            </div>
          )}

          {isAuthenticated && !error && searchQuery && !loading && searchResults.length === 0 && (
            <div className="text-center py-8 text-surface-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No users found matching "{searchQuery}"</p>
            </div>
          )}

          {isAuthenticated && !searchQuery && (
            <div className="text-center py-8 text-surface-500">
              <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Search for users to add as friends</p>
            </div>
          )}

          <AnimatePresence>
            {searchResults.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: user.avatar_url || getRandomColor() }}
                >
                  {(user.display_name || user.username || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                    {user.display_name || user.username}
                  </p>
                  {user.username && user.display_name && (
                    <p className="text-sm text-surface-500 truncate">@{user.username}</p>
                  )}
                  {user.level && (
                    <div className="flex items-center gap-1 text-xs text-surface-500">
                      <Trophy className="w-3 h-3" />
                      <span>Level {user.level}</span>
                    </div>
                  )}
                </div>

                {/* Add Button */}
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={UserPlus}
                  loading={addingUserId === user.id}
                  onClick={() => handleAddFriend(user.id)}
                >
                  Add
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

FriendSearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onAddFriend: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
};

// Profile Modal
function ProfileModal({ isOpen, onClose, friend, onRemoveFriend, onBlockUser, onSchedulePlaydate }) {
  const [removing, setRemoving] = useState(false);
  const [blocking, setBlocking] = useState(false);

  if (!isOpen || !friend) return null;

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemoveFriend(friend.friendshipId);
      onClose();
    } finally {
      setRemoving(false);
    }
  };

  const handleBlock = async () => {
    setBlocking(true);
    try {
      await onBlockUser(friend.friendshipId);
      onClose();
    } finally {
      setBlocking(false);
    }
  };

  const friendLevel = friendshipLevels[friend.friendshipLevel || 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-6 text-center text-white relative">
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

          <div
            className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30"
            style={{ backgroundColor: friend.avatarColor || getRandomColor() }}
          >
            {(friend.username || friend.display_name || '?').charAt(0).toUpperCase()}
          </div>

          <h3 className="text-2xl font-bold mt-4">
            {friend.display_name || friend.username}
          </h3>
          {friend.username && friend.display_name && (
            <p className="text-white/80">@{friend.username}</p>
          )}
          {friend.location && (
            <p className="text-white/80 flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {friend.location}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Friendship Level */}
          {friendLevel && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium" style={{ color: friendLevel.color }}>
                  {friendLevel.name}
                </span>
                {friend.daysUntilNextLevel && (
                  <span className="text-surface-500">
                    {friend.daysUntilNextLevel} days to next level
                  </span>
                )}
              </div>
              <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: friendLevel.color,
                    width: `${((friend.friendshipLevel || 1) / 4) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-surface-500">{friendLevel.perks}</p>
            </div>
          )}

          {/* Stats */}
          {(friend.level || friend.xp) && (
            <div className="grid grid-cols-2 gap-4">
              {friend.level && (
                <div className="bg-surface-100 dark:bg-surface-700 rounded-xl p-4 text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-warning-500" />
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {friend.level}
                  </p>
                  <p className="text-xs text-surface-500">Level</p>
                </div>
              )}
              {friend.xp && (
                <div className="bg-surface-100 dark:bg-surface-700 rounded-xl p-4 text-center">
                  <PawPrint className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {friend.xp.toLocaleString()}
                  </p>
                  <p className="text-xs text-surface-500">XP</p>
                </div>
              )}
            </div>
          )}

          {/* Pets */}
          {friend.pets && friend.pets.length > 0 && (
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2">
                <PawPrint className="w-4 h-4" />
                Pets
              </h4>
              <div className="space-y-2">
                {friend.pets.map((pet, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-surface-100 dark:bg-surface-700 rounded-xl"
                  >
                    <span className="text-2xl">{pet.type === 'cat' ? '🐱' : '🐕'}</span>
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        {pet.name}
                      </p>
                      <p className="text-sm text-surface-500">{pet.breed}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {friend.playdateAvailable && onSchedulePlaydate && (
              <Button
                variant="success"
                className="w-full"
                leftIcon={Calendar}
                onClick={() => {
                  onClose();
                  onSchedulePlaydate(friend);
                }}
              >
                Schedule Playdate
              </Button>
            )}

            <Button variant="secondary" className="w-full" leftIcon={MessageCircle}>
              Send Message
            </Button>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/30"
                leftIcon={UserMinus}
                loading={removing}
                onClick={handleRemove}
              >
                Remove
              </Button>
              <Button
                variant="ghost"
                className="flex-1 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/30"
                leftIcon={Ban}
                loading={blocking}
                onClick={handleBlock}
              >
                Block
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

ProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  friend: PropTypes.object,
  onRemoveFriend: PropTypes.func.isRequired,
  onBlockUser: PropTypes.func.isRequired,
  onSchedulePlaydate: PropTypes.func,
};

// Playdate Scheduler Modal
function PlaydateModal({ isOpen, onClose, friend, onSchedule }) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        date: tomorrow.toISOString().split('T')[0],
        time: '10:00',
        location: '',
        notes: '',
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.time || !formData.location) return;

    setSubmitting(true);
    try {
      await onSchedule({
        friendId: friend.id,
        friendName: friend.display_name || friend.username,
        ...formData,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !friend) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-success-500 to-success-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              <div>
                <h3 className="text-xl font-bold">Schedule Playdate</h3>
                <p className="text-white/80 text-sm">
                  with {friend.display_name || friend.username}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white/80 hover:text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              id="playdate-date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Time"
              type="time"
              id="playdate-time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>

          <Input
            label="Location"
            placeholder="e.g., Central Dog Park"
            id="playdate-location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            leftAddon={<MapPin className="w-4 h-4" />}
            required
          />

          <Input.Textarea
            label="Notes (optional)"
            placeholder="Any special instructions or things to bring..."
            id="playdate-notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              loading={submitting}
              className="flex-1"
              disabled={!formData.date || !formData.time || !formData.location}
            >
              Schedule
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

PlaydateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  friend: PropTypes.object,
  onSchedule: PropTypes.func.isRequired,
};

// Pending Requests Section
function PendingRequestsSection({
  pendingReceived = [],
  pendingSent = [],
  onAccept,
  onReject,
  onCancel,
  loading,
}) {
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const handleAccept = async (friendshipId) => {
    setAcceptingId(friendshipId);
    try {
      await onAccept(friendshipId);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (friendshipId) => {
    setRejectingId(friendshipId);
    try {
      await onReject(friendshipId);
    } finally {
      setRejectingId(null);
    }
  };

  const handleCancel = async (friendshipId) => {
    setCancellingId(friendshipId);
    try {
      await onCancel(friendshipId);
    } finally {
      setCancellingId(null);
    }
  };

  if (pendingReceived.length === 0 && pendingSent.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Received Requests */}
      {pendingReceived.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Friend Requests ({pendingReceived.length})
          </h4>
          <div className="space-y-2">
            <AnimatePresence>
              {pendingReceived.map((request) => {
                const friend = request.friend || request;
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: friend.avatar_url || getRandomColor() }}
                    >
                      {(friend.display_name || friend.username || '?').charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                        {friend.display_name || friend.username}
                      </p>
                      <p className="text-xs text-surface-500">wants to be your friend</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        leftIcon={Check}
                        loading={acceptingId === request.id}
                        onClick={() => handleAccept(request.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={X}
                        loading={rejectingId === request.id}
                        onClick={() => handleReject(request.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {pendingSent.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Sent Requests ({pendingSent.length})
          </h4>
          <div className="space-y-2">
            <AnimatePresence>
              {pendingSent.map((request) => {
                const friend = request.friend || request;
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 bg-surface-100 dark:bg-surface-800 rounded-xl"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: friend.avatar_url || getRandomColor() }}
                    >
                      {(friend.display_name || friend.username || '?').charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                        {friend.display_name || friend.username}
                      </p>
                      <p className="text-xs text-surface-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={X}
                      loading={cancellingId === request.id}
                      onClick={() => handleCancel(request.id)}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

PendingRequestsSection.propTypes = {
  pendingReceived: PropTypes.array,
  pendingSent: PropTypes.array,
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

// Friend Card Component
function FriendCard({ friend, index, onViewProfile, onSchedulePlaydate }) {
  const friendLevel = friendshipLevels[friend.friendshipLevel || 1];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all border border-surface-200/50 dark:border-surface-700/50"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
          style={{ backgroundColor: friend.avatarColor || friend.avatar_url || getRandomColor() }}
        >
          {(friend.display_name || friend.username || '?').charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-lg text-surface-800 dark:text-surface-100 truncate">
                {friend.display_name || friend.username}
              </h4>
              {friend.location && (
                <p className="text-sm text-surface-600 dark:text-surface-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {friend.location}
                </p>
              )}
            </div>
            {friend.level && (
              <Badge variant="accent" size="sm" icon={Trophy}>
                Lv. {friend.level}
              </Badge>
            )}
          </div>

          {/* Pet Info */}
          {friend.pets && friend.pets.length > 0 && (
            <div className="mt-2 text-sm text-surface-700 dark:text-surface-300 flex items-center gap-1">
              <PawPrint className="w-4 h-4" />
              {friend.pets[0].name} ({friend.pets[0].breed})
            </div>
          )}

          {/* Friendship Level */}
          {friendLevel && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold" style={{ color: friendLevel.color }}>
                  {friendLevel.name}
                </span>
                {friend.daysUntilNextLevel > 0 && (
                  <span className="text-surface-500 dark:text-surface-400">
                    {friend.daysUntilNextLevel} days to next level
                  </span>
                )}
              </div>
              <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: friendLevel.color,
                    width: `${((friend.friendshipLevel || 1) / 4) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Last Interaction */}
          {friend.lastInteraction && (
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
              Last activity: {timeAgo(new Date(friend.lastInteraction))}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              rightIcon={ChevronRight}
              onClick={() => onViewProfile(friend)}
            >
              View Profile
            </Button>
            {friend.playdateAvailable && (
              <Button
                variant="success"
                size="sm"
                leftIcon={Calendar}
                onClick={() => onSchedulePlaydate(friend)}
              >
                Playdate
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

FriendCard.propTypes = {
  friend: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onViewProfile: PropTypes.func.isRequired,
  onSchedulePlaydate: PropTypes.func.isRequired,
};

// Loading Skeleton
function FriendsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-md border border-surface-200/50 dark:border-surface-700/50"
          >
            <div className="flex items-start gap-4">
              <Skeleton.Avatar size="xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex gap-2 pt-2">
                  <Skeleton.Button size="sm" className="flex-1" />
                  <Skeleton.Button size="sm" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main FriendsList Component
function FriendsList({
  friends = [],
  pendingRequests = [],
  pendingSent = [],
  onAcceptRequest,
  onRejectRequest,
  onSearchUsers,
  onAddFriend,
  onRemoveFriend,
  onBlockUser,
  isAuthenticated = false,
  loading = false,
  error = null,
}) {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPlaydateModal, setShowPlaydateModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [playdates, setPlaydates] = useState([]);

  // Transform friends data to ensure consistent structure
  const normalizedFriends = useMemo(() => {
    return friends.map((friend) => {
      // Handle both direct friend object and friendship wrapper
      const friendData = friend.friend || friend;
      return {
        ...friendData,
        friendshipId: friend.id || friendData.id,
        friendshipLevel: friend.friendshipLevel || 1,
        daysUntilNextLevel: friend.daysUntilNextLevel || 0,
        lastInteraction: friend.lastInteraction || friend.created_at,
        playdateAvailable: friend.playdateAvailable ?? true,
      };
    });
  }, [friends]);

  const handleViewProfile = (friend) => {
    setSelectedFriend(friend);
    setShowProfileModal(true);
  };

  const handleSchedulePlaydateClick = (friend) => {
    setSelectedFriend(friend);
    setShowPlaydateModal(true);
  };

  const handleSchedulePlaydate = async (playdateData) => {
    // Store playdate locally (in a real app, this would call an API)
    const newPlaydate = {
      id: Date.now(),
      ...playdateData,
      createdAt: new Date().toISOString(),
    };
    setPlaydates((prev) => [...prev, newPlaydate]);

    // Could also add to activities feed or save to database
    console.log('Playdate scheduled:', newPlaydate);
  };

  const handleRemoveFriend = async (friendshipId) => {
    if (onRemoveFriend) {
      await onRemoveFriend(friendshipId);
    }
  };

  const handleBlockUser = async (friendshipId) => {
    if (onBlockUser) {
      await onBlockUser(friendshipId);
    }
  };

  // Loading state
  if (loading && normalizedFriends.length === 0) {
    return <FriendsListSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error-500 opacity-50" />
        <p className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
          Oops! Something went wrong
        </p>
        <p className="text-surface-500 mb-4">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-surface-800 dark:text-surface-100">
            Friends ({normalizedFriends.length})
          </h3>
          {pendingRequests.length > 0 && (
            <p className="text-sm text-primary-500">
              {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button
          variant="primary"
          leftIcon={UserPlus}
          onClick={() => setShowSearchModal(true)}
          disabled={!isAuthenticated}
        >
          Add Friend
        </Button>
      </div>

      {/* Pending Requests Section */}
      <PendingRequestsSection
        pendingReceived={pendingRequests}
        pendingSent={pendingSent}
        onAccept={onAcceptRequest}
        onReject={onRejectRequest}
        onCancel={onRejectRequest} // Use same handler for cancel
        loading={loading}
      />

      {/* Scheduled Playdates */}
      {playdates.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Upcoming Playdates ({playdates.length})
          </h4>
          <div className="space-y-2">
            {playdates.map((playdate) => (
              <motion.div
                key={playdate.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-200 dark:border-success-800"
              >
                <Calendar className="w-8 h-8 text-success-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 dark:text-surface-100">
                    Playdate with {playdate.friendName}
                  </p>
                  <p className="text-sm text-surface-500">
                    {new Date(playdate.date).toLocaleDateString()} at {playdate.time} - {playdate.location}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Friends Grid */}
      {normalizedFriends.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {normalizedFriends.map((friend, index) => (
            <FriendCard
              key={friend.friendshipId || friend.id}
              friend={friend}
              index={index}
              onViewProfile={handleViewProfile}
              onSchedulePlaydate={handleSchedulePlaydateClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-surface-500 dark:text-surface-400">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
          </motion.div>
          <p className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
            No friends yet
          </p>
          <p className="mb-4">Start connecting with other pet parents!</p>
          <Button
            variant="primary"
            leftIcon={UserPlus}
            onClick={() => setShowSearchModal(true)}
            disabled={!isAuthenticated}
          >
            Find Friends
          </Button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showSearchModal && (
          <FriendSearchModal
            isOpen={showSearchModal}
            onClose={() => setShowSearchModal(false)}
            onSearch={onSearchUsers}
            onAddFriend={onAddFriend}
            isAuthenticated={isAuthenticated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileModal && selectedFriend && (
          <ProfileModal
            isOpen={showProfileModal}
            onClose={() => {
              setShowProfileModal(false);
              setSelectedFriend(null);
            }}
            friend={selectedFriend}
            onRemoveFriend={handleRemoveFriend}
            onBlockUser={handleBlockUser}
            onSchedulePlaydate={handleSchedulePlaydateClick}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlaydateModal && selectedFriend && (
          <PlaydateModal
            isOpen={showPlaydateModal}
            onClose={() => {
              setShowPlaydateModal(false);
              setSelectedFriend(null);
            }}
            friend={selectedFriend}
            onSchedule={handleSchedulePlaydate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

FriendsList.propTypes = {
  friends: PropTypes.arrayOf(PropTypes.object),
  pendingRequests: PropTypes.arrayOf(PropTypes.object),
  pendingSent: PropTypes.arrayOf(PropTypes.object),
  onAcceptRequest: PropTypes.func,
  onRejectRequest: PropTypes.func,
  onSearchUsers: PropTypes.func,
  onAddFriend: PropTypes.func,
  onRemoveFriend: PropTypes.func,
  onBlockUser: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

FriendsList.defaultProps = {
  friends: [],
  pendingRequests: [],
  pendingSent: [],
  onAcceptRequest: () => {},
  onRejectRequest: () => {},
  onSearchUsers: async () => ({ data: [] }),
  onAddFriend: async () => ({}),
  onRemoveFriend: async () => {},
  onBlockUser: async () => {},
  isAuthenticated: false,
  loading: false,
  error: null,
};

export default FriendsList;
