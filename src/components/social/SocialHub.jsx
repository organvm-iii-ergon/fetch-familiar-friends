import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Newspaper,
  Gamepad2,
  Trophy,
  Users,
  MapPin,
  Dumbbell,
  Stethoscope,
  ClipboardList,
  Smartphone,
  Sparkles,
  PawPrint,
  Rainbow,
  Crown,
  Lock,
  Loader2,
  Info,
} from 'lucide-react';
import ActivityFeed from './ActivityFeed';
import FriendsList from './FriendsList';
import PetProfile from './PetProfile';
import NearbyPetParents from './NearbyPetParents';
import CareInstructions from './CareInstructions';
import ARCamera from './ARCamera';
import VirtualPet from './VirtualPet';
import EnhancedMemorial from './EnhancedMemorial';
import CoachingHub from './CoachingHub';
import VetTelemedicine from './VetTelemedicine';
import SubscriptionTiers from './SubscriptionTiers';
import GameplayHub from './GameplayHub';
import Leaderboards from './Leaderboards';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useFriends } from '../../hooks/useFriends';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import { usePets } from '../../hooks/usePets';
import { generateMockFriends, generateActivityFeed } from '../../utils/socialData';
import { generateMockPet } from '../../utils/petData';
import Skeleton from '../ui/Skeleton';
import Badge from '../ui/Badge';

function SocialHub({ onClose }) {
  const { isAuthenticated, isOnlineMode } = useAuth();
  const { hasFeature, currentTier } = useSubscription();

  // Real data hooks
  const {
    friends: realFriends,
    pendingReceived,
    pendingSent,
    loading: friendsLoading,
    error: friendsError,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriendship,
    blockUser,
    searchUsers,
  } = useFriends();

  const {
    activities: realActivities,
    loading: activitiesLoading,
    toggleReaction,
    addComment,
    loadMore: loadMoreActivities,
    hasMore: hasMoreActivities,
  } = useActivityFeed({ feedType: 'friends' });

  const {
    pets,
    primaryPet,
    loading: petsLoading,
  } = usePets();

  const [activeTab, setActiveTab] = useState('feed');
  const tabsContainerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Mock data fallbacks for offline/unauthenticated mode
  const [mockFriends, setMockFriends] = useState([]);
  const [mockActivities, setMockActivities] = useState([]);
  const [mockPet, setMockPet] = useState(null);

  useEffect(() => {
    // Initialize mock data for offline/demo mode
    if (!isOnlineMode || !isAuthenticated) {
      const friends = generateMockFriends(15);
      setMockFriends(friends);
      setMockActivities(generateActivityFeed(friends, 30));
      setMockPet(generateMockPet('Max', 'Golden Retriever', 3));
    }
  }, [isOnlineMode, isAuthenticated]);

  // Use real data when available, fall back to mock
  const friends = isAuthenticated && isOnlineMode ? realFriends.map(f => f.friend) : mockFriends;
  const activities = isAuthenticated && isOnlineMode ? realActivities : mockActivities;
  const userPet = isAuthenticated && isOnlineMode ? primaryPet : mockPet;

  // Check if social features are available
  const socialEnabled = hasFeature('social') || !isAuthenticated; // Allow preview in demo mode

  const tabs = [
    { id: 'feed', name: 'Feed', icon: Newspaper, requiresAuth: false },
    { id: 'gameplay', name: 'Quests', icon: Gamepad2, requiresAuth: false },
    { id: 'leaderboard', name: 'Rankings', icon: Trophy, requiresAuth: false },
    { id: 'friends', name: 'Friends', icon: Users, premium: true },
    { id: 'nearby', name: 'Nearby', icon: MapPin, premium: true },
    { id: 'coaching', name: 'Coaches', icon: Dumbbell, premium: true },
    { id: 'vet', name: '24/7 Vet', icon: Stethoscope, premium: true },
    { id: 'care', name: 'Care', icon: ClipboardList, requiresAuth: false },
    { id: 'ar', name: 'AR', icon: Smartphone, premium: true },
    { id: 'virtual', name: 'Virtual', icon: Sparkles, requiresAuth: false },
    { id: 'profile', name: 'Profile', icon: PawPrint, requiresAuth: true },
    { id: 'memorial', name: 'Memorial', icon: Rainbow, premium: true },
    { id: 'subscribe', name: 'Premium', icon: Crown, requiresAuth: false },
  ];

  // Update indicator position when active tab changes
  useEffect(() => {
    const updateIndicator = () => {
      if (tabsContainerRef.current) {
        const activeButton = tabsContainerRef.current.querySelector(`[data-tab="${activeTab}"]`);
        if (activeButton) {
          const containerRect = tabsContainerRef.current.getBoundingClientRect();
          const buttonRect = activeButton.getBoundingClientRect();
          setIndicatorStyle({
            left: buttonRect.left - containerRect.left + tabsContainerRef.current.scrollLeft,
            width: buttonRect.width,
          });
        }
      }
    };

    updateIndicator();
    // Update on resize
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  const handleTabClick = (tab) => {
    // Check if tab requires premium and user doesn't have it
    if (tab.premium && !hasFeature('social') && isAuthenticated) {
      setActiveTab('subscribe');
      return;
    }
    // Check if tab requires auth
    if (tab.requiresAuth && !isAuthenticated) {
      // Could show login modal here
      setActiveTab('subscribe');
      return;
    }
    setActiveTab(tab.id);
  };

  // Handle activity interactions
  const handleReaction = async (activityId) => {
    if (!isAuthenticated) return;
    await toggleReaction(activityId);
  };

  const handleComment = async (activityId, content) => {
    if (!isAuthenticated) return;
    await addComment(activityId, content);
  };

  const handleAddFriend = async (userId) => {
    if (!isAuthenticated) return;
    await sendFriendRequest(userId);
  };

  const handleAcceptFriend = async (friendshipId) => {
    if (!isAuthenticated) return;
    await acceptFriendRequest(friendshipId);
  };

  const isLoading = friendsLoading || activitiesLoading || petsLoading;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white dark:bg-surface-900 rounded-2xl shadow-soft-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-surface-200/50 dark:border-surface-700/50"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 p-6 text-white relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Pet Social Hub</h2>
              <p className="text-white/80 mt-1 flex items-center gap-2">
                {isAuthenticated ? (
                  <>
                    Welcome back!
                    {pendingReceived.length > 0 && (
                      <Badge variant="warning" size="sm" dot pulse>
                        {pendingReceived.length} pending
                      </Badge>
                    )}
                  </>
                ) : (
                  'Sign in to unlock all features'
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isLoading && (
                <Loader2 className="w-5 h-5 animate-spin text-white/70" />
              )}
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          {/* Tabs */}
          <div
            ref={tabsContainerRef}
            className="flex gap-1 mt-6 overflow-x-auto pb-2 scrollbar-hide relative"
          >
            {/* Animated indicator */}
            <motion.div
              className="absolute bottom-2 h-1 bg-white rounded-full"
              initial={false}
              animate={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />

            {tabs.map((tab) => {
              const isPremiumLocked = tab.premium && !hasFeature('social') && isAuthenticated;
              const isAuthLocked = tab.requiresAuth && !isAuthenticated;
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;

              return (
                <motion.button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`
                    px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap
                    flex items-center gap-2 relative
                    ${isActive
                      ? 'bg-white text-primary-600 shadow-soft'
                      : 'text-white/90 hover:bg-white/20'
                    }
                    ${isPremiumLocked || isAuthLocked ? 'opacity-75' : ''}
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  {isPremiumLocked && <Lock className="w-3 h-3 opacity-70" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-50 dark:bg-surface-900 scrollbar-hide">
          {/* Demo mode banner */}
          <AnimatePresence>
            {!isAuthenticated && activeTab !== 'subscribe' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 surface-elevated flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                    <Info className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-surface-700 dark:text-surface-300 text-sm">
                    Preview mode - Sign in to save your progress and connect with friends
                  </span>
                </div>
                <motion.button
                  onClick={() => setActiveTab('subscribe')}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium shadow-soft-sm hover:shadow-soft transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading skeleton */}
          {isLoading && activeTab === 'feed' && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="surface-elevated p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton.Avatar size="md" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton.Text lines={2} />
                  <Skeleton.Image aspectRatio="16/9" />
                </div>
              ))}
            </div>
          )}

          {/* Tab Content */}
          {(!isLoading || activeTab !== 'feed') && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'feed' && (
                  <ActivityFeed
                    activities={activities}
                    onReaction={handleReaction}
                    onComment={handleComment}
                    onLoadMore={loadMoreActivities}
                    hasMore={hasMoreActivities}
                    isAuthenticated={isAuthenticated}
                  />
                )}
                {activeTab === 'gameplay' && <GameplayHub />}
                {activeTab === 'leaderboard' && <Leaderboards />}
                {activeTab === 'friends' && (
                  <FriendsList
                    friends={friends}
                    pendingRequests={pendingReceived}
                    pendingSent={pendingSent}
                    onAcceptRequest={handleAcceptFriend}
                    onRejectRequest={removeFriendship}
                    onSearchUsers={searchUsers}
                    onAddFriend={handleAddFriend}
                    onRemoveFriend={removeFriendship}
                    onBlockUser={blockUser}
                    isAuthenticated={isAuthenticated}
                    loading={friendsLoading}
                    error={friendsError}
                  />
                )}
                {activeTab === 'nearby' && <NearbyPetParents />}
                {activeTab === 'coaching' && <CoachingHub />}
                {activeTab === 'vet' && <VetTelemedicine />}
                {activeTab === 'care' && userPet && <CareInstructions pet={userPet} />}
                {activeTab === 'ar' && <ARCamera />}
                {activeTab === 'virtual' && <VirtualPet realPet={userPet} />}
                {activeTab === 'profile' && userPet && <PetProfile pet={userPet} pets={pets} />}
                {activeTab === 'memorial' && <EnhancedMemorial pet={userPet} />}
                {activeTab === 'subscribe' && <SubscriptionTiers currentTier={currentTier} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}

SocialHub.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default SocialHub;
