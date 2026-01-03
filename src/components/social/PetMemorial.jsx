import { motion } from 'framer-motion';

function PetMemorial() {

  // Mock memorial pets
  const memorials = [
    {
      id: 1,
      name: 'Charlie',
      breed: 'Golden Retriever',
      years: '2010 - 2023',
      photo: '🐕',
      tribute: 'The best friend anyone could ask for. Your gentle soul and loving heart will never be forgotten.',
      memories: 156,
      candlesLit: 89,
      tributes: 23,
    },
    {
      id: 2,
      name: 'Shadow',
      breed: 'German Shepherd',
      years: '2012 - 2024',
      photo: '🐺',
      tribute: 'A loyal protector and loving companion. Forever in our hearts.',
      memories: 98,
      candlesLit: 67,
      tributes: 15,
    },
  ];

  const sharedMemorials = [
    {
      id: 1,
      petName: 'Bella',
      ownerName: 'Sarah',
      breed: 'Labrador',
      years: '2008 - 2023',
      photo: '🦮',
      tribute: 'Our sunshine on cloudy days. Thank you for 15 beautiful years.',
      candlesLit: 234,
    },
    {
      id: 2,
      petName: 'Max',
      ownerName: 'John',
      breed: 'Beagle',
      years: '2015 - 2024',
      photo: '🐶',
      tribute: 'Gone too soon but never forgotten. Run free, sweet boy.',
      candlesLit: 156,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Rainbow Bridge Memorial
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            A loving tribute to pets who've crossed the rainbow bridge 🌈
          </p>
        </div>
        <button
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
        >
          + Create Tribute
        </button>
      </div>

      {/* Quote */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-l-4 border-purple-500">
        <p className="text-gray-700 dark:text-gray-300 italic text-center">
          "Until one has loved an animal, a part of one's soul remains unawakened."
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
          - Anatole France
        </p>
      </div>

      {/* My Memorials */}
      {memorials.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">
            My Beloved Companions
          </h4>

          {memorials.map((memorial, index) => (
            <motion.div
              key={memorial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-200 dark:border-purple-800"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center text-5xl">
                    {memorial.photo}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {memorial.name}
                      </h5>
                      <p className="text-gray-600 dark:text-gray-400">
                        {memorial.breed}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                        {memorial.years}
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium">
                      🕯️ Light Candle
                    </button>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mt-4 italic">
                    "{memorial.tribute}"
                  </p>

                  <div className="flex gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>📸 {memorial.memories} memories</span>
                    <span>🕯️ {memorial.candlesLit} candles</span>
                    <span>💬 {memorial.tributes} tributes</span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                      View Memories
                    </button>
                    <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                      Add Memory
                    </button>
                    <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                      Share Tribute
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Community Memorials */}
      <div className="space-y-4">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">
          Community Memorials
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sharedMemorials.map((memorial, index) => (
            <motion.div
              key={memorial.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center text-4xl flex-shrink-0">
                  {memorial.photo}
                </div>

                <div className="flex-1">
                  <h5 className="font-bold text-gray-800 dark:text-gray-100">
                    {memorial.petName}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {memorial.breed} • {memorial.years}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    By {memorial.ownerName}
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic line-clamp-2">
                    "{memorial.tribute}"
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      🕯️ {memorial.candlesLit} candles
                    </span>
                    <button className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-xs font-medium">
                      Light Candle
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Memorial Features */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl p-6">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4">
          Memorial Features
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl">📖</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100">Memory Book</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a digital memorial book with photos and stories
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-3xl">🕯️</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100">Virtual Candles</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Light candles in remembrance, shared with community
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-3xl">🌳</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100">Plant a Tree</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Plant a real tree in your pet's memory
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-3xl">⭐</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100">Star Registry</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Name a star after your beloved companion
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Resources */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">💙 Support & Resources</h4>
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
          Losing a pet is never easy. We're here to help you through this difficult time.
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
            Support Groups
          </button>
          <button className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
            Resources
          </button>
        </div>
      </div>
    </div>
  );
}

export default PetMemorial;
