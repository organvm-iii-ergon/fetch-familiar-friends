import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const VisualLanding = ({ onEnter }) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % 5);
    }, 4000);

    return () => clearInterval(timer);
  }, [autoPlay]);

  // Scene 1: Lonely person with dog
  const LonelyScene = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full flex items-center justify-center"
    >
      {/* Sad person */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="flex flex-col items-center gap-4"
      >
        <div className="text-8xl opacity-60">🧍</div>
        <div className="text-6xl">🐕</div>

        {/* Sad emoji floating */}
        <motion.div
          animate={{
            y: [-20, -40, -20],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
          className="absolute top-20 text-4xl"
        >
          😔
        </motion.div>
      </motion.div>

      {/* Minimal text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.4, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-20 text-center text-white/60 text-sm"
      >
        lonely
      </motion.div>
    </motion.div>
  );

  // Scene 2: Find friends
  const FindFriendsScene = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full flex items-center justify-center"
    >
      {/* Central person */}
      <div className="text-8xl">🧍</div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-8 text-6xl">🐕</div>

      {/* Other people appearing from corners */}
      {[
        { emoji: '🧍‍♀️', pet: '🐕', from: 'top-left', delay: 0 },
        { emoji: '🧍‍♂️', pet: '🐕', from: 'top-right', delay: 0.2 },
        { emoji: '🧍', pet: '🐈', from: 'bottom-left', delay: 0.4 },
        { emoji: '🧍‍♀️', pet: '🐈', from: 'bottom-right', delay: 0.6 },
      ].map((person, i) => {
        const positions = {
          'top-left': { x: -200, y: -200 },
          'top-right': { x: 200, y: -200 },
          'bottom-left': { x: -200, y: 200 },
          'bottom-right': { x: 200, y: 200 },
        };

        return (
          <motion.div
            key={i}
            initial={{
              x: positions[person.from].x,
              y: positions[person.from].y,
              opacity: 0,
              scale: 0
            }}
            animate={{
              x: positions[person.from].x * 0.4,
              y: positions[person.from].y * 0.4,
              opacity: 1,
              scale: 1
            }}
            transition={{
              delay: person.delay,
              duration: 0.8,
              type: "spring"
            }}
            className="absolute text-5xl flex flex-col items-center gap-1"
          >
            <div>{person.emoji}</div>
            <div className="text-3xl">{person.pet}</div>
          </motion.div>
        );
      })}

      {/* Hearts appearing */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0],
            y: [0, -50, -100, -150]
          }}
          transition={{
            delay: 1 + i * 0.2,
            duration: 2
          }}
          className="absolute text-3xl"
          style={{
            left: `${30 + i * 10}%`,
            top: '50%'
          }}
        >
          ❤️
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-20 text-white/60 text-sm"
      >
        find friends
      </motion.div>
    </motion.div>
  );

  // Scene 3: Play together
  const PlayScene = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full flex items-center justify-center"
    >
      {/* Park background */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-9xl absolute opacity-20"
      >
        🌳
      </motion.div>

      {/* Dogs playing */}
      {[
        { emoji: '🐕', delay: 0, x: -100 },
        { emoji: '🐕', delay: 0.3, x: -30 },
        { emoji: '🐈', delay: 0.6, x: 40 },
        { emoji: '🐕', delay: 0.9, x: 100 },
      ].map((pet, i) => (
        <motion.div
          key={i}
          initial={{ y: 0 }}
          animate={{
            y: [0, -40, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            delay: pet.delay,
            duration: 1,
            repeat: Infinity,
            repeatDelay: 0.5
          }}
          className="absolute text-6xl"
          style={{ left: `calc(50% + ${pet.x}px)` }}
        >
          {pet.emoji}
        </motion.div>
      ))}

      {/* Tennis balls */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            x: [-200, 200],
            y: [0, -100, 0, -80, 0]
          }}
          transition={{
            delay: i * 1.5,
            duration: 2,
            repeat: Infinity,
            repeatDelay: 2
          }}
          className="absolute text-4xl"
        >
          🎾
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-20 text-white/60 text-sm"
      >
        play together
      </motion.div>
    </motion.div>
  );

  // Scene 4: Track & care
  const TrackScene = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full flex items-center justify-center"
    >
      {/* Central pet */}
      <div className="text-8xl">🐕</div>

      {/* Stats circling around */}
      {[
        { emoji: '❤️', angle: 0, label: 'health' },
        { emoji: '🏃', angle: 72, label: 'active' },
        { emoji: '🍖', angle: 144, label: 'fed' },
        { emoji: '💉', angle: 216, label: 'vax' },
        { emoji: '😊', angle: 288, label: 'happy' },
      ].map((stat, i) => {
        const radius = 120;
        const x = Math.cos((stat.angle - 90) * Math.PI / 180) * radius;
        const y = Math.sin((stat.angle - 90) * Math.PI / 180) * radius;

        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.2, 1],
              opacity: 1
            }}
            transition={{
              delay: i * 0.2,
              duration: 0.5
            }}
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                delay: i * 0.2 + 1,
                duration: 1,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="text-4xl"
            >
              {stat.emoji}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: i * 0.2 + 0.3 }}
              className="text-xs text-white/60"
            >
              {stat.label}
            </motion.div>
          </motion.div>
        );
      })}

      {/* Connecting lines */}
      <svg className="absolute w-full h-full pointer-events-none">
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const radius = 120;
          const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
          const y = Math.sin((angle - 90) * Math.PI / 180) * radius;

          return (
            <motion.line
              key={i}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.2 }}
              transition={{ delay: i * 0.2 + 0.5, duration: 0.5 }}
              x1="50%"
              y1="50%"
              x2={`calc(50% + ${x}px)`}
              y2={`calc(50% + ${y}px)`}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}
        className="absolute bottom-20 text-white/60 text-sm"
      >
        track & care
      </motion.div>
    </motion.div>
  );

  // Scene 5: All together (final)
  const AllTogetherScene = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full flex flex-col items-center justify-center gap-8"
    >
      {/* App icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
        className="text-9xl"
      >
        🐾
      </motion.div>

      {/* Feature icons orbiting */}
      {[
        { emoji: '🗺️', angle: 0 },
        { emoji: '🎮', angle: 60 },
        { emoji: '❤️', angle: 120 },
        { emoji: '📸', angle: 180 },
        { emoji: '🏋️', angle: 240 },
        { emoji: '🏥', angle: 300 },
      ].map((feature, i) => {
        const radius = 150;
        const x = Math.cos((feature.angle - 90) * Math.PI / 180) * radius;
        const y = Math.sin((feature.angle - 90) * Math.PI / 180) * radius;

        return (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{
              scale: 1,
              x,
              y
            }}
            transition={{
              delay: 0.5 + i * 0.1,
              type: "spring",
              stiffness: 200
            }}
            className="absolute text-5xl"
          >
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{
                rotate: {
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3
                }
              }}
            >
              {feature.emoji}
            </motion.div>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-20 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
          className="text-white/80 text-2xl font-bold mb-2"
        >
          🐾
        </motion.div>
        <div className="text-white/40 text-xs">tap to explore</div>
      </motion.div>
    </motion.div>
  );

  const scenes = [
    <LonelyScene key="lonely" />,
    <FindFriendsScene key="friends" />,
    <PlayScene key="play" />,
    <TrackScene key="track" />,
    <AllTogetherScene key="all" />
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden"
      onClick={() => {
        if (currentScene === 4) {
          onEnter();
        } else {
          setAutoPlay(false);
          setCurrentScene((prev) => (prev + 1) % 5);
        }
      }}
    >
      <AnimatePresence mode="wait">
        {scenes[currentScene]}
      </AnimatePresence>

      {/* Progress dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: currentScene === i ? 1.5 : 1,
              opacity: currentScene === i ? 1 : 0.3
            }}
            className="w-2 h-2 rounded-full bg-white cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setAutoPlay(false);
              setCurrentScene(i);
            }}
          />
        ))}
      </div>

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        whileHover={{ opacity: 1, scale: 1.1 }}
        onClick={(e) => {
          e.stopPropagation();
          onEnter();
        }}
        className="absolute top-8 right-8 text-white/60 hover:text-white text-sm px-4 py-2 rounded-full border border-white/30"
      >
        skip ⏭️
      </motion.button>
    </motion.div>
  );
};

VisualLanding.propTypes = {
  onEnter: PropTypes.func.isRequired,
};

export default VisualLanding;
