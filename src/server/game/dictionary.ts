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
  ];

  // Convert date to index
  const dateValue = new Date(date).getTime();
  const index = Math.floor((dateValue / (1000 * 60 * 60 * 24)) % puzzles.length);

  return {
    ...puzzles[index],
    number: Math.floor(dateValue / (1000 * 60 * 60 * 24))
  };
}
