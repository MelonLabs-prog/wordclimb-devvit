import { isValidWord } from "./dictionary";

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export class WordValidator {
  /**
   * Check if a word transition is valid (exactly one letter different)
   */
  static isValidTransition(from: string, to: string): boolean {
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    // Must be same length
    if (fromLower.length !== toLower.length) {
      return false;
    }

    // Count differences
    let differences = 0;
    for (let i = 0; i < fromLower.length; i++) {
      if (fromLower[i] !== toLower[i]) {
        differences++;
      }
    }

    // Must differ by exactly one letter
    return differences === 1;
  }

  /**
   * Validate a move in the word ladder
   */
  static validateMove(
    currentWord: string,
    newWord: string,
    path: string[]
  ): ValidationResult {
    const newWordLower = newWord.toLowerCase();

    // Check if word is valid English
    if (!isValidWord(newWordLower)) {
      return {
        valid: false,
        message: "Not a valid English word!"
      };
    }

    // Check if word was already used
    if (path.map(w => w.toLowerCase()).includes(newWordLower)) {
      return {
        valid: false,
        message: "You already used this word!"
      };
    }

    // Check if it's a valid transition (one letter different)
    if (!this.isValidTransition(currentWord, newWordLower)) {
      return {
        valid: false,
        message: "Must change exactly ONE letter!"
      };
    }

    return { valid: true };
  }

  /**
   * Check if puzzle is complete
   */
  static isPuzzleComplete(currentWord: string, targetWord: string): boolean {
    return currentWord.toLowerCase() === targetWord.toLowerCase();
  }
}
