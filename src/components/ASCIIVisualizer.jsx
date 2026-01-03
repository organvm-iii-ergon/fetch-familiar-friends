import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ASCIIVisualizer = ({ onClose }) => {
  const [currentView, setCurrentView] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;
    const timer = setInterval(() => {
      setCurrentView((prev) => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(timer);
  }, [isAnimating]);

  // View 1: What is this?
  const WhatIsThis = () => {
    const frames = [
      `
    ╔═══════════════════════════╗
    ║                           ║
    ║       🐾  YOUR PET        ║
    ║                           ║
    ╚═══════════════════════════╝
      `,
      `
    ╔═══════════════════════════╗
    ║                           ║
    ║    🐾 + 📱 = ❤️           ║
    ║                           ║
    ╚═══════════════════════════╝
      `,
      `
    ╔═══════════════════════════╗
    ║   📅 CARE                 ║
    ║   👥 FRIENDS              ║
    ║   🎮 PLAY                 ║
    ║   📸 SHARE                ║
    ╚═══════════════════════════╝
      `
    ];

    const [frame, setFrame] = useState(0);

    useEffect(() => {
      const timer = setInterval(() => {
        setFrame((prev) => (prev + 1) % frames.length);
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    return (
      <motion.pre
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="text-green-400 text-xs sm:text-sm md:text-base lg:text-lg font-mono whitespace-pre"
      >
        {frames[frame]}
      </motion.pre>
    );
  };

  // View 2: How it works
  const HowItWorks = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-cyan-400 font-mono text-xs sm:text-sm md:text-base"
    >
      <motion.pre
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="whitespace-pre"
      >
{`
    YOU                    OTHERS
     │                        │
     │   ╭─────────────╮     │
     ├──▶│   🐾 APP    │◀────┤
     │   ╰─────────────╯     │
     │          │             │
     ▼          ▼             ▼

   📱 TRACK   🗺️ FIND   💬 SHARE

   ┌──────────────────────────┐
   │  🏥 HEALTH  🎮 GAMES    │
   │  📸 PHOTOS  ❤️  CARE    │
   └──────────────────────────┘
`}
      </motion.pre>
    </motion.div>
  );

  // View 3: Project structure
  const ProjectStructure = () => {
    const [expandedNodes, setExpandedNodes] = useState(new Set([0]));

    useEffect(() => {
      const timers = [
        setTimeout(() => setExpandedNodes(new Set([0, 1])), 500),
        setTimeout(() => setExpandedNodes(new Set([0, 1, 2])), 1000),
        setTimeout(() => setExpandedNodes(new Set([0, 1, 2, 3])), 1500),
        setTimeout(() => setExpandedNodes(new Set([0, 1, 2, 3, 4])), 2000),
      ];
      return () => timers.forEach(clearTimeout);
    }, []);

    return (
      <motion.pre
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="text-yellow-400 font-mono text-xs sm:text-sm whitespace-pre"
      >
{`🐾 PET SOCIAL HUB
${expandedNodes.has(1) ? `│
├─ 📅 Calendar & Care
│  ├─ Daily reminders
│  └─ Health tracking` : ''}
${expandedNodes.has(2) ? `│
├─ 👥 Social Features
│  ├─ Find friends
│  └─ Share moments` : ''}
${expandedNodes.has(3) ? `│
├─ 🎮 Games & AR
│  ├─ Quests
│  └─ AR camera` : ''}
${expandedNodes.has(4) ? `│
└─ 🏥 Premium Services
   ├─ Coaching
   └─ Telemedicine` : ''}`}
      </motion.pre>
    );
  };

  // View 4: Live activity
  const LiveActivity = () => {
    const activities = [
      { icon: '📍', action: 'Sarah found 3 friends nearby' },
      { icon: '🎾', action: 'Max completed daily quest' },
      { icon: '📸', action: 'Luna shared a photo' },
      { icon: '❤️', action: 'Buddy\'s health: 100%' },
      { icon: '🏆', action: 'You earned a badge!' },
    ];

    const [visibleActivities, setVisibleActivities] = useState([]);

    useEffect(() => {
      activities.forEach((_, i) => {
        setTimeout(() => {
          setVisibleActivities((prev) => [...prev, activities[i]]);
        }, i * 600);
      });
    }, []);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-purple-400 font-mono text-xs sm:text-sm space-y-2"
      >
        <div className="text-center mb-4 text-purple-300">
          ═══ LIVE ACTIVITY ═══
        </div>
        {visibleActivities.map((activity, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                delay: i * 0.6,
                duration: 0.5
              }}
              className="text-xl"
            >
              {activity.icon}
            </motion.span>
            <span className="text-purple-300">▸ {activity.action}</span>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const views = [
    <WhatIsThis key="what" />,
    <HowItWorks key="how" />,
    <ProjectStructure key="structure" />,
    <LiveActivity key="activity" />
  ];

  const titles = [
    'WHAT IS THIS?',
    'HOW IT WORKS',
    'FEATURES',
    'COMMUNITY ACTIVITY'
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4"
      onClick={() => {
        setIsAnimating(false);
        setCurrentView((prev) => (prev + 1) % 4);
      }}
    >
      {/* CRT screen effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent pointer-events-none" />

      {/* Scanline effect */}
      <motion.div
        animate={{ y: ['0%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-4 pointer-events-none"
      />

      {/* Main content */}
      <div className="relative w-full max-w-3xl">
        {/* Title */}
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-green-400 font-mono text-sm sm:text-base md:text-lg tracking-wider"
          >
            ┌{'─'.repeat(titles[currentView].length + 4)}┐
          </motion.div>
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-green-400 font-mono text-lg sm:text-xl md:text-2xl font-bold tracking-wider"
          >
            │  {titles[currentView]}  │
          </motion.div>
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-green-400 font-mono text-sm sm:text-base md:text-lg tracking-wider"
          >
            └{'─'.repeat(titles[currentView].length + 4)}┘
          </motion.div>
        </motion.div>

        {/* View content */}
        <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <AnimatePresence mode="wait">
            {views[currentView]}
          </AnimatePresence>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-3 mt-8">
          {[0, 1, 2, 3].map((i) => (
            <motion.button
              key={i}
              animate={{
                scale: currentView === i ? 1.5 : 1,
                opacity: currentView === i ? 1 : 0.3
              }}
              whileHover={{ scale: 1.2 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsAnimating(false);
                setCurrentView(i);
              }}
              className="w-3 h-3 rounded-full bg-green-400 border border-green-600 cursor-pointer focus:outline-none"
            />
          ))}
        </div>

        {/* Instructions */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center mt-8 text-green-500/60 text-xs sm:text-sm font-mono"
        >
          [ TAP TO CONTINUE ]
        </motion.div>
      </div>

      {/* Close button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        whileHover={{ opacity: 1, scale: 1.1 }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 text-green-400 font-mono text-xs sm:text-sm px-3 py-1 border border-green-600 rounded hover:bg-green-900/30 transition-all"
      >
        [X] CLOSE
      </motion.button>

      {/* Bottom system info */}
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute bottom-4 left-4 text-green-600 font-mono text-xs"
      >
        SYSTEM_OK ● READY ● {new Date().toLocaleTimeString()}
      </motion.div>
    </motion.div>
  );
};

ASCIIVisualizer.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ASCIIVisualizer;
