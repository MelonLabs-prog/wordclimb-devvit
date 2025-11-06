// Word dictionary for WordClimb game
// This is a starter set - we'll expand this later

export const WORD_DICTIONARY = new Set([
  // 4-letter words for word ladder puzzles
  "cold", "cord", "card", "ward", "warm", "worm", "word", "work", "pork", "port",
  "post", "past", "fast", "cast", "case", "base", "bass", "pass", "mass", "miss",
  "mist", "list", "lost", "cost", "coat", "boat", "beat", "heat", "head", "dead",
  "lead", "load", "loan", "moan", "moon", "soon", "noon", "noon", "good", "food",
  "fool", "pool", "cool", "coal", "foal", "goal", "goat", "moat", "meat", "meet",
  "feet", "feel", "fell", "tell", "tall", "talk", "walk", "wall", "ball", "call",
  "calm", "palm", "pale", "page", "cage", "cake", "care", "bare", "barn", "barn",
  "born", "corn", "torn", "turn", "burn", "barn", "bard", "bird", "bind", "mind",
  "mine", "line", "fine", "find", "kind", "king", "ring", "wing", "wine", "pine",
  "pain", "rain", "main", "gain", "grin", "grit", "grid", "grey", "prey", "pray",
  "play", "plan", "plane", "plane", "plant", "slant", "slain", "stain", "train", "brain",
  "braid", "bread", "break", "bleak", "black", "blank", "blink", "brink", "bring", "being",

  // More 4-letter words
  "game", "came", "name", "same", "tame", "tale", "take", "make", "mate", "gate",
  "hate", "have", "gave", "give", "live", "love", "move", "more", "sore", "sure",
  "pure", "cure", "care", "dare", "date", "late", "rate", "race", "rice", "ride",
  "hide", "side", "wide", "wire", "fire", "tire", "time", "tide", "tile", "mile",
  "mild", "wild", "will", "till", "bill", "bell", "well", "sell", "tell", "fell",

  // Common words for variety
  "help", "hero", "here", "were", "wear", "bear", "beer", "deer", "deep", "keep",
  "keen", "seen", "seen", "mean", "lean", "bean", "beat", "seat", "seal", "real",
  "read", "road", "toad", "load", "lend", "tend", "mend", "send", "sand", "hand",
  "band", "land", "lend", "bend", "bind", "find", "wind", "kind", "king", "sing",
  "song", "long", "lung", "hung", "hunt", "hurt", "sort", "port", "part", "park",
  "dark", "dare", "care", "came", "some", "home", "dome", "done", "bone", "cone",
  "core", "more", "mode", "rode", "role", "hole", "hope", "rope", "ripe", "pipe",
  "pile", "file", "fill", "hill", "mill", "milk", "silk", "silt", "tilt", "wilt",

  // Starting words for puzzles
  "play", "stop", "jump", "dump", "pump", "lump", "lamp", "camp", "came", "came",
  "ship", "shop", "shot", "slot", "slow", "flow", "glow", "grow", "crow", "crew",
  "brew", "drew", "drag", "brag", "brad", "bead", "bean", "dean", "lean", "lead",
]);

export function isValidWord(word: string): boolean {
  return WORD_DICTIONARY.has(word.toLowerCase());
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
