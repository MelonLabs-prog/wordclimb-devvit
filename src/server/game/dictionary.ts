// Word dictionary for WordClimb game
import { redis } from "@devvit/web/server";
import { WORD_LIST } from "./words";

// Create Set for O(1) lookup
const WORD_DICTIONARY = new Set(WORD_LIST);

console.log(`Loaded ${WORD_DICTIONARY.size} words from dictionary`);

/**
 * Check if word exists in local dictionary
 */
export function isValidWord(word: string): boolean {
  return WORD_DICTIONARY.has(word.toLowerCase());
}

/**
 * Validate word with hybrid approach: local dictionary + API fallback
 * Includes Redis caching for API results
 */
export async function isValidWordWithFallback(word: string): Promise<boolean> {
  const wordLower = word.toLowerCase();

  // Step 1: Check local dictionary first (instant)
  if (WORD_DICTIONARY.has(wordLower)) {
    console.log(`✓ Word "${wordLower}" found in LOCAL DICTIONARY (instant)`);
    return true;
  }

  // Step 2: Check Redis cache for previous API results
  const cacheKey = `word:valid:${wordLower}`;
  console.log(`🔍 Checking Redis cache for key: "${cacheKey}"`);
  const cachedResult = await redis.get(cacheKey);
  console.log(`📦 Redis cache result: ${cachedResult}`);

  // Check for both null and undefined (Redis can return either when key doesn't exist)
  if (cachedResult != null) {
    const isValid = cachedResult === "true";
    console.log(`✓ Word "${wordLower}" found in REDIS CACHE: ${isValid ? "VALID" : "INVALID"}`);
    return isValid;
  }

  console.log(`❌ Word "${wordLower}" NOT found in Redis cache`);


  // Step 3: Fallback to Free Dictionary API
  console.log(`⏳ Word "${wordLower}" NOT in local dictionary or cache, calling API...`);
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${wordLower}`
    );

    console.log(`📡 API Response Status: ${response.status} for "${wordLower}"`);

    // Only cache explicit results, not errors
    if (response.status === 200) {
      // Word is valid
      await redis.set(cacheKey, "true", { expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
      console.log(`✓ API validation: "${wordLower}" is VALID (cached for 30 days)`);
      return true;
    } else if (response.status === 404) {
      // Word not found - cache as invalid
      await redis.set(cacheKey, "false", { expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
      console.log(`✗ API validation: "${wordLower}" is INVALID/NOT FOUND (cached for 30 days)`);
      return false;
    } else {
      // Other status codes (5xx, 429, etc.) - don't cache, just reject for now
      console.warn(`⚠️ API returned status ${response.status} for "${wordLower}" - NOT caching, rejecting`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Network error validating word "${wordLower}" with API:`, error);
    // On network error, don't cache, just reject for now
    return false;
  }
}

/**
 * Get dictionary statistics
 */
export function getDictionaryStats() {
  return {
    localDictionarySize: WORD_DICTIONARY.size,
    sampleWords: Array.from(WORD_DICTIONARY).slice(0, 10),
    hasWord: (word: string) => WORD_DICTIONARY.has(word.toLowerCase())
  };
}

export function getRandomPuzzle(): { start: string; end: string; optimal: number } {
  // Predefined puzzles with known solutions
  const puzzles = [
    { start: "cold", end: "warm", optimal: 4 },
    { start: "head", end: "feet", optimal: 5 },
    { start: "love", end: "hate", optimal: 3 },
    { start: "play", end: "game", optimal: 4 },
    { start: "dark", end: "glow", optimal: 6 },
    { start: "fast", end: "slow", optimal: 5 },
    { start: "hero", end: "zero", optimal: 3 },
    { start: "kind", end: "mean", optimal: 5 },
  ];

  const index = Math.floor(Math.random() * puzzles.length);
  return puzzles[index];
}

export function getPuzzleByDate(date: string): { start: string; end: string; optimal: number; number: number } {
  // Use date to deterministically select a puzzle
  const puzzles = [
    // Original 10
    { start: "cold", end: "warm", optimal: 4 },
    { start: "head", end: "feet", optimal: 5 },
    { start: "love", end: "hate", optimal: 3 },
    { start: "play", end: "game", optimal: 4 },
    { start: "dark", end: "glow", optimal: 6 },
    { start: "fast", end: "slow", optimal: 5 },
    { start: "hero", end: "zero", optimal: 3 },
    { start: "kind", end: "mean", optimal: 5 },
    { start: "bird", end: "worm", optimal: 4 },
    { start: "fire", end: "cool", optimal: 6 },

    // Opposites & Contrasts (20)
    { start: "good", end: "evil", optimal: 4 },
    { start: "rich", end: "poor", optimal: 4 },
    { start: "tall", end: "tiny", optimal: 5 },
    { start: "hard", end: "soft", optimal: 3 },
    { start: "loud", end: "calm", optimal: 4 },
    { start: "busy", end: "lazy", optimal: 4 },
    { start: "full", end: "void", optimal: 5 },
    { start: "open", end: "shut", optimal: 4 },
    { start: "more", end: "less", optimal: 3 },
    { start: "weak", end: "bold", optimal: 4 },
    { start: "wild", end: "tame", optimal: 3 },
    { start: "real", end: "fake", optimal: 4 },
    { start: "safe", end: "risk", optimal: 4 },
    { start: "pure", end: "vile", optimal: 4 },
    { start: "wise", end: "fool", optimal: 4 },
    { start: "neat", end: "mess", optimal: 4 },
    { start: "high", end: "deep", optimal: 4 },
    { start: "best", end: "last", optimal: 3 },
    { start: "left", end: "gone", optimal: 4 },
    { start: "huge", end: "wee", optimal: 5 },

    // Animals (15)
    { start: "frog", end: "toad", optimal: 3 },
    { start: "wolf", end: "calf", optimal: 4 },
    { start: "bear", end: "deer", optimal: 3 },
    { start: "duck", end: "swan", optimal: 4 },
    { start: "fish", end: "crab", optimal: 4 },
    { start: "mice", end: "rats", optimal: 4 },
    { start: "crow", end: "dove", optimal: 4 },
    { start: "goat", end: "lamb", optimal: 4 },
    { start: "fowl", end: "hawk", optimal: 4 },
    { start: "pony", end: "colt", optimal: 4 },
    { start: "mare", end: "bull", optimal: 4 },
    { start: "crab", end: "clam", optimal: 2 },
    { start: "seal", end: "orca", optimal: 5 },
    { start: "moth", end: "wasp", optimal: 4 },
    { start: "hare", end: "boar", optimal: 3 },

    // Body & Health (10)
    { start: "sick", end: "well", optimal: 4 },
    { start: "hurt", end: "heal", optimal: 3 },
    { start: "pain", end: "ease", optimal: 4 },
    { start: "bone", end: "skin", optimal: 4 },
    { start: "hand", end: "foot", optimal: 4 },
    { start: "face", end: "neck", optimal: 4 },
    { start: "lung", end: "limb", optimal: 3 },
    { start: "back", end: "ribs", optimal: 4 },
    { start: "palm", end: "sole", optimal: 4 },
    { start: "nose", end: "chin", optimal: 4 },

    // Actions (15)
    { start: "walk", end: "race", optimal: 4 },
    { start: "jump", end: "leap", optimal: 3 },
    { start: "pull", end: "push", optimal: 3 },
    { start: "give", end: "take", optimal: 3 },
    { start: "work", end: "rest", optimal: 4 },
    { start: "read", end: "scan", optimal: 4 },
    { start: "send", end: "mail", optimal: 3 },
    { start: "talk", end: "yell", optimal: 4 },
    { start: "sing", end: "hum", optimal: 4 },
    { start: "hide", end: "seek", optimal: 4 },
    { start: "save", end: "lose", optimal: 4 },
    { start: "wake", end: "doze", optimal: 4 },
    { start: "hope", end: "wish", optimal: 4 },
    { start: "look", end: "gaze", optimal: 4 },
    { start: "make", end: "undo", optimal: 4 },

    // Objects (15)
    { start: "rock", end: "sand", optimal: 4 },
    { start: "wood", end: "iron", optimal: 4 },
    { start: "book", end: "page", optimal: 3 },
    { start: "door", end: "gate", optimal: 3 },
    { start: "lamp", end: "bulb", optimal: 4 },
    { start: "rope", end: "cord", optimal: 3 },
    { start: "boat", end: "ship", optimal: 4 },
    { start: "cart", end: "auto", optimal: 4 },
    { start: "bowl", end: "dish", optimal: 4 },
    { start: "ring", end: "band", optimal: 4 },
    { start: "coat", end: "robe", optimal: 3 },
    { start: "bell", end: "gong", optimal: 4 },
    { start: "flag", end: "sign", optimal: 4 },
    { start: "lock", end: "bolt", optimal: 3 },
    { start: "vase", end: "bowl", optimal: 4 },

    // Nature & Elements (10)
    { start: "rain", end: "hail", optimal: 2 },
    { start: "wind", end: "gust", optimal: 4 },
    { start: "tree", end: "bush", optimal: 4 },
    { start: "leaf", end: "stem", optimal: 4 },
    { start: "rose", end: "lily", optimal: 4 },
    { start: "lake", end: "pond", optimal: 4 },
    { start: "hill", end: "dale", optimal: 4 },
    { start: "mist", end: "haze", optimal: 4 },
    { start: "dawn", end: "dusk", optimal: 3 },
    { start: "tide", end: "wave", optimal: 4 },

    // Miscellaneous (5)
    { start: "blue", end: "pink", optimal: 4 },
    { start: "gold", end: "lead", optimal: 4 },
    { start: "king", end: "pawn", optimal: 4 },
    { start: "mile", end: "yard", optimal: 4 },
    { start: "coin", end: "bill", optimal: 4 },
  ];

  // Convert date to index
  const dateValue = new Date(date).getTime();
  const index = Math.floor((dateValue / (1000 * 60 * 60 * 24)) % puzzles.length);

  return {
    ...puzzles[index],
    number: Math.floor(dateValue / (1000 * 60 * 60 * 24))
  };
}
