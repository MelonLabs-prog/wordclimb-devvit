export interface ScoreResult {
  score: number;
  steps: number;
  optimal: number;
  isOptimal: boolean;
  bonuses: {
    optimal?: number;
    firstSolve?: number;
  };
}

export class ScoringSystem {
  private static readonly BASE_SCORE = 1000;
  private static readonly STEP_PENALTY = 100;
  private static readonly OPTIMAL_BONUS = 500;
  private static readonly FIRST_SOLVE_BONUS = 200;

  /**
   * Calculate score for a completed puzzle
   */
  static calculateScore(
    steps: number,
    optimalSteps: number,
    isFirstSolve: boolean = false
  ): ScoreResult {
    // Base score minus penalties
    let score = this.BASE_SCORE - (steps * this.STEP_PENALTY);

    // Ensure minimum score
    score = Math.max(score, 100);

    const bonuses: ScoreResult['bonuses'] = {};

    // Optimal solution bonus
    const isOptimal = steps === optimalSteps;
    if (isOptimal) {
      score += this.OPTIMAL_BONUS;
      bonuses.optimal = this.OPTIMAL_BONUS;
    }

    // First solve bonus
    if (isFirstSolve) {
      score += this.FIRST_SOLVE_BONUS;
      bonuses.firstSolve = this.FIRST_SOLVE_BONUS;
    }

    return {
      score,
      steps,
      optimal: optimalSteps,
      isOptimal,
      bonuses
    };
  }

  /**
   * Format score result for display
   */
  static formatScoreMessage(result: ScoreResult): string {
    let message = `Score: ${result.score} points (${result.steps} steps)`;

    if (result.isOptimal) {
      message += "\n🎉 Optimal solution!";
    }

    if (result.bonuses.firstSolve) {
      message += "\n⚡ First solve bonus!";
    }

    return message;
  }
}
