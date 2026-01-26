import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Plus,
  X,
  Image as ImageIcon,
  Globe,
  Users,
  Lock,
  Trash2,
  Trophy,
  TrendingUp,
  Camera,
  Sparkles,
  Loader2,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import { useAuth } from '../../contexts/AuthContext';
import { timeAgo } from '../../utils/socialData';
import Skeleton from '../ui/Skeleton';
import Button from '../ui/Button';
import Input from '../ui/Input';

// Activity type configurations
const ACTIVITY_TYPES = {
  post: { icon: MessageCircle, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Post' },
  photo: { icon: Camera, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Photo' },
  achievement: { icon: Trophy, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Achievement' },
  level_up: { icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30', label: 'Level Up' },
  pet_action: { icon: Sparkles, color: 'text-pink-500', bgColor: 'bg-pink-100 dark:bg-pink-900/30', label: 'Pet Action' },
};

// Visibility options
const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see' },
  { value: 'friends', label: 'Friends', icon: Users, description: 'Only friends' },
  { value: 'private', label: 'Private', icon: Lock, description: 'Only you' },
];

// Single Activity Item Component
function ActivityItem({
  activity,
  onReaction,
  onComment,
  onDelete,
  isAuthenticated,
  currentUserId,
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get activity type config
  const activityType = ACTIVITY_TYPES[activity.activity_type] || ACTIVITY_TYPES.post;
  const ActivityIcon = activityType.icon;

  // Check if user owns this activity
  const isOwnActivity = activity.isOwn || activity.user_id === currentUserId;

  // Handle reaction toggle
  const handleReaction = async () => {
    if (!isAuthenticated) return;
    await onReaction(activity.id);
  };

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;

    setIsSubmittingComment(true);
    await onComment(activity.id, commentText.trim());
    setCommentText('');
    setIsSubmittingComment(false);
  };

  // Handle delete
  const handleDelete = async () => {
    await onDelete(activity.id);
    setShowDeleteConfirm(false);
  };

  // Get user display info
  const user = activity.user || activity.friend || {};
  const displayName = user.display_name || user.username || 'Anonymous';
  const avatarColor = user.avatarColor || '#6366f1';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: avatarColor }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Activity type badge */}
          <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${activityType.bgColor}`}>
            <ActivityIcon className={`w-3 h-3 ${activityType.color}`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-gray-800 dark:text-gray-200">
                <span className="font-semibold">{displayName}</span>
                {user.level && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                    Lvl {user.level}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {activity.timeAgo || timeAgo(activity.timestamp || activity.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Activity emoji/type indicator */}
              {activity.emoji && <span className="text-2xl">{activity.emoji}</span>}

              {/* Delete button for own posts */}
              {isOwnActivity && isAuthenticated && (
                <div className="relative">
                  <motion.button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>

                  {/* Delete confirmation */}
                  <AnimatePresence>
                    {showDeleteConfirm && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute right-0 top-8 z-10 p-3 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 min-w-[180px]"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
                          Delete this post?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowDeleteConfirm(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={handleDelete}
                          >
                            Delete
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Activity text content */}
          {(activity.content || activity.text) && (
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {activity.content || activity.text}
            </p>
          )}

          {/* Activity image */}
          {activity.image_url && (
            <motion.div
              className="mt-3 rounded-xl overflow-hidden"
              whileHover={{ scale: 1.02 }}
            >
              <img
                src={activity.image_url}
                alt="Activity"
                className="w-full h-auto max-h-80 object-cover"
                loading="lazy"
              />
            </motion.div>
          )}

          {/* Pet info if available */}
          {activity.pet && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="text-lg">
                {activity.pet.species === 'dog' ? '🐕' : activity.pet.species === 'cat' ? '🐈' : '🐾'}
              </span>
              <span>with {activity.pet.name}</span>
            </div>
          )}

          {/* Engagement buttons */}
          <div className="flex gap-6 mt-3 text-sm text-gray-600 dark:text-gray-400">
            <motion.button
              onClick={handleReaction}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1.5 transition-colors ${
                activity.hasReacted
                  ? 'text-red-500'
                  : 'hover:text-red-500'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={isAuthenticated ? { scale: 1.05 } : undefined}
              whileTap={isAuthenticated ? { scale: 0.95 } : undefined}
            >
              <Heart
                className={`w-5 h-5 ${activity.hasReacted ? 'fill-current' : ''}`}
              />
              <span>{activity.reactionCount || activity.likes || 0}</span>
            </motion.button>

            <motion.button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="w-5 h-5" />
              <span>{activity.commentCount || activity.comments || 0}</span>
            </motion.button>

            <motion.button
              className="flex items-center gap-1.5 hover:text-green-500 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </motion.button>
          </div>

          {/* Comments section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
              >
                {isAuthenticated ? (
                  <form onSubmit={handleSubmitComment} className="flex gap-2">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 text-sm"
                      disabled={isSubmittingComment}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!commentText.trim() || isSubmittingComment}
                      loading={isSubmittingComment}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    Sign in to comment
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

ActivityItem.propTypes = {
  activity: PropTypes.object.isRequired,
  onReaction: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  currentUserId: PropTypes.string,
};

// Create Activity Modal Component
function CreateActivityModal({ isOpen, onClose, onCreate }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('friends');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const result = await onCreate({
      type: imageUrl ? 'photo' : 'post',
      content: content.trim(),
      imageUrl: imageUrl || null,
      visibility,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message || 'Failed to create post');
    } else {
      setContent('');
      setImageUrl('');
      setVisibility('friends');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Create Post
          </h3>
          <motion.button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Post content */}
          <Input.Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening with your pet?"
            rows={4}
            className="resize-none"
          />

          {/* Image URL input */}
          <div className="flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              leftAddon={<ImageIcon className="w-4 h-4" />}
              className="flex-1"
            />
          </div>

          {/* Image preview */}
          {imageUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="relative"
            >
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-40 object-cover rounded-xl"
                onError={() => setImageUrl('')}
              />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Visibility selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Who can see this?
            </label>
            <div className="flex gap-2">
              {VISIBILITY_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
                      visibility === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{option.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!content.trim() || isSubmitting}
            loading={isSubmitting}
          >
            Post
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}

CreateActivityModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};

// Activity skeleton loader
function ActivitySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
      <div className="flex items-start gap-4">
        <Skeleton.Avatar size="lg" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton.Text lines={2} />
          <div className="flex gap-6">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main ActivityFeed Component
function ActivityFeed({
  activities: propActivities,
  onReaction: propOnReaction,
  onComment: propOnComment,
  onLoadMore: propOnLoadMore,
  hasMore: propHasMore,
  isAuthenticated: propIsAuthenticated,
}) {
  const { user, isAuthenticated: authIsAuthenticated, isOnlineMode } = useAuth();

  // Use hook if no props provided
  const hookData = useActivityFeed({ feedType: 'friends' });

  // Determine whether to use props or hook data
  const activities = propActivities || hookData.activities;
  const loading = hookData.loading;
  const loadingMore = hookData.loadingMore;
  const hasMore = propHasMore !== undefined ? propHasMore : hookData.hasMore;
  const error = hookData.error;
  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : authIsAuthenticated;

  // Actions - prefer props, fallback to hook
  const handleReaction = propOnReaction || hookData.toggleReaction;
  const handleComment = propOnComment || hookData.addComment;
  const handleLoadMore = propOnLoadMore || hookData.loadMore;
  const handleDelete = hookData.deleteActivity;
  const handleCreate = hookData.createActivity;
  const handleRefresh = hookData.refresh;

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadMoreRef = useRef(null);
  const containerRef = useRef(null);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, handleLoadMore]);

  // Pull to refresh handler
  const handlePullRefresh = async () => {
    if (isRefreshing || !isOnlineMode) return;

    setIsRefreshing(true);
    await handleRefresh();
    setIsRefreshing(false);
  };

  // Loading state
  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Recent Activity
          </h3>
        </div>
        {[1, 2, 3].map((i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Recent Activity
        </h3>
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <motion.button
            onClick={handlePullRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          {/* Create post button */}
          {isAuthenticated && (
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              leftIcon={Plus}
            >
              Post
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => hookData.clearError()}
            className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Activity list */}
      <AnimatePresence mode="popLayout">
        {activities.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            onReaction={handleReaction}
            onComment={handleComment}
            onDelete={handleDelete}
            isAuthenticated={isAuthenticated}
            currentUserId={user?.id}
          />
        ))}
      </AnimatePresence>

      {/* Empty state */}
      {activities.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 text-gray-500 dark:text-gray-400"
        >
          <p className="text-5xl mb-4">🐾</p>
          <p className="text-lg font-medium mb-2">No activities yet!</p>
          <p className="text-sm mb-4">
            {isAuthenticated
              ? 'Be the first to share something with your pet community!'
              : 'Connect with friends to see their updates!'}
          </p>
          {isAuthenticated && (
            <Button onClick={() => setShowCreateModal(true)} leftIcon={Plus}>
              Create Your First Post
            </Button>
          )}
        </motion.div>
      )}

      {/* Load more trigger */}
      {activities.length > 0 && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {loadingMore ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading more...</span>
            </motion.div>
          ) : hasMore ? (
            <motion.button
              onClick={handleLoadMore}
              className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronDown className="w-4 h-4" />
              <span>Load more</span>
            </motion.button>
          ) : activities.length > 5 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              You've reached the end
            </p>
          ) : null}
        </div>
      )}

      {/* Create activity modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateActivityModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>

      {/* Floating action button for mobile */}
      {isAuthenticated && activities.length > 0 && (
        <motion.button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow md:hidden z-40"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}

ActivityFeed.propTypes = {
  activities: PropTypes.arrayOf(PropTypes.object),
  onReaction: PropTypes.func,
  onComment: PropTypes.func,
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  isAuthenticated: PropTypes.bool,
};

export default ActivityFeed;
