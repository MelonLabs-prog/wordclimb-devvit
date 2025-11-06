// WordClimb Game API Types

export type InitResponse = {
  type: "init";
  postId: string;
  username: string;
  puzzle: {
    start: string;
    end: string;
    optimal: number;
    number: number;
  };
  playerState?: {
    path: string[];
    completed: boolean;
    score?: number;
  };
};

export type SubmitWordResponse = {
  type: "submitWord";
  postId: string;
  valid: boolean;
  message?: string;
  path: string[];
  completed?: boolean;
  score?: number;
  scoreDetails?: {
    score: number;
    steps: number;
    optimal: number;
    isOptimal: boolean;
    bonuses: {
      optimal?: number;
      firstSolve?: number;
    };
  };
};

export type ResetGameResponse = {
  type: "reset";
  postId: string;
  puzzle: {
    start: string;
    end: string;
    optimal: number;
    number: number;
  };
};

export type LeaderboardEntry = {
  username: string;
  score: number;
  rank: number;
};

export type LeaderboardResponse = {
  type: "leaderboard";
  entries: LeaderboardEntry[];
  totalPlayers: number;
};
