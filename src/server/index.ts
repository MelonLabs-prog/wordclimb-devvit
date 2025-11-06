import express from "express";
import {
  InitResponse,
  SubmitWordResponse,
  ResetGameResponse,
  LeaderboardResponse,
} from "../shared/types/api";
import {
  createServer,
  context,
  getServerPort,
  reddit,
  redis,
} from "@devvit/web/server";
import { createPost } from "./core/post";
import { WordValidator } from "./game/validator";
import { ScoringSystem } from "./game/scoring";
import { getPuzzleByDate } from "./game/dictionary";

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<
  { postId: string },
  InitResponse | { status: string; message: string }
>("/api/init", async (_req, res): Promise<void> => {
  const { postId } = context;

  if (!postId) {
    console.error("API Init Error: postId not found in devvit context");
    res.status(400).json({
      status: "error",
      message: "postId is required but missing from context",
    });
    return;
  }

  try {
    const username = await reddit.getCurrentUsername();
    const today = new Date().toISOString().split('T')[0];
    const puzzle = getPuzzleByDate(today);

    // Check if player has already started/completed this puzzle
    const playerPathKey = `player:${username}:post:${postId}:path`;
    const playerCompletedKey = `player:${username}:post:${postId}:completed`;
    const playerScoreKey = `player:${username}:post:${postId}:score`;

    const [pathData, completed, score] = await Promise.all([
      redis.get(playerPathKey),
      redis.get(playerCompletedKey),
      redis.get(playerScoreKey),
    ]);

    const path = pathData ? JSON.parse(pathData) : [puzzle.start];
    const isCompleted = completed === "true";

    res.json({
      type: "init",
      postId: postId,
      username: username ?? "anonymous",
      puzzle,
      playerState: {
        path,
        completed: isCompleted,
        score: score ? parseInt(score) : undefined,
      },
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = "Unknown error during initialization";
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    res.status(400).json({ status: "error", message: errorMessage });
  }
});

router.post<
  { postId: string },
  SubmitWordResponse | { status: string; message: string },
  { word: string }
>("/api/submit-word", async (req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({
      status: "error",
      message: "postId is required",
    });
    return;
  }

  try {
    const { word } = req.body;
    const username = await reddit.getCurrentUsername();
    const today = new Date().toISOString().split('T')[0];
    const puzzle = getPuzzleByDate(today);

    // Get current player state
    const playerPathKey = `player:${username}:post:${postId}:path`;
    const pathData = await redis.get(playerPathKey);
    const path: string[] = pathData ? JSON.parse(pathData) : [puzzle.start];

    const currentWord = path[path.length - 1];

    // Validate the move
    const validation = WordValidator.validateMove(currentWord, word, path);

    if (!validation.valid) {
      res.json({
        type: "submitWord",
        postId,
        valid: false,
        message: validation.message,
        path,
      });
      return;
    }

    // Add word to path
    const newPath = [...path, word.toLowerCase()];
    await redis.set(playerPathKey, JSON.stringify(newPath));

    // Check if puzzle is complete
    const isComplete = WordValidator.isPuzzleComplete(word, puzzle.end);

    if (isComplete) {
      try {
        console.log("Puzzle completed! Processing score...");

        // Check if this is first solve for this user
        const firstSolveKey = `puzzle:${today}:firstSolve`;
        const firstSolver = await redis.get(firstSolveKey);
        const isFirstSolve = !firstSolver;

        if (isFirstSolve) {
          await redis.set(firstSolveKey, username ?? "anonymous");
        }

        // Calculate score
        const steps = newPath.length - 1; // Don't count starting word
        const scoreResult = ScoringSystem.calculateScore(steps, puzzle.optimal, isFirstSolve);

        console.log("Score calculated:", scoreResult);

        // Save completion
        await redis.set(`player:${username}:post:${postId}:completed`, "true");
        await redis.set(`player:${username}:post:${postId}:score`, scoreResult.score.toString());

        // Add to leaderboard
        const leaderboardKey = `leaderboard:${today}`;
        const playerKey = username ?? "anonymous";
        console.log("Adding to leaderboard:", leaderboardKey, playerKey, scoreResult.score);

        await redis.zAdd(leaderboardKey, {
          member: playerKey,
          score: scoreResult.score
        });

        console.log("Leaderboard updated successfully");

        res.json({
          type: "submitWord",
          postId,
          valid: true,
          path: newPath,
          completed: true,
          score: scoreResult.score,
          scoreDetails: scoreResult,
        });
      } catch (completionError) {
        console.error("Error during puzzle completion:", completionError);

        // Still save basic completion even if leaderboard fails
        await redis.set(`player:${username}:post:${postId}:completed`, "true");

        // Calculate score again
        const steps = newPath.length - 1;
        const scoreResult = ScoringSystem.calculateScore(steps, puzzle.optimal, false);
        await redis.set(`player:${username}:post:${postId}:score`, scoreResult.score.toString());

        // Return success anyway
        res.json({
          type: "submitWord",
          postId,
          valid: true,
          path: newPath,
          completed: true,
          score: scoreResult.score,
          scoreDetails: scoreResult,
        });
      }
    } else {
      res.json({
        type: "submitWord",
        postId,
        valid: true,
        path: newPath,
        completed: false,
      });
    }
  } catch (error) {
    console.error(`Error submitting word:`, error);
    res.status(400).json({
      status: "error",
      message: "Failed to submit word",
    });
  }
});

router.post<
  { postId: string },
  ResetGameResponse | { status: string; message: string },
  unknown
>("/api/reset", async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({
      status: "error",
      message: "postId is required",
    });
    return;
  }

  try {
    const username = await reddit.getCurrentUsername();
    const today = new Date().toISOString().split('T')[0];
    const puzzle = getPuzzleByDate(today);

    // Reset player state
    const playerPathKey = `player:${username}:post:${postId}:path`;
    const playerCompletedKey = `player:${username}:post:${postId}:completed`;
    const playerScoreKey = `player:${username}:post:${postId}:score`;

    await Promise.all([
      redis.set(playerPathKey, JSON.stringify([puzzle.start])),
      redis.del(playerCompletedKey),
      redis.del(playerScoreKey),
    ]);

    res.json({
      type: "reset",
      postId,
      puzzle,
    });
  } catch (error) {
    console.error(`Error resetting game:`, error);
    res.status(400).json({
      status: "error",
      message: "Failed to reset game",
    });
  }
});

router.get<
  { postId: string },
  LeaderboardResponse | { status: string; message: string }
>("/api/leaderboard", async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({
      status: "error",
      message: "postId is required",
    });
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const leaderboardKey = `leaderboard:${today}`;

    console.log("Fetching leaderboard for key:", leaderboardKey);

    // Get total player count
    const totalPlayers = await redis.zCard(leaderboardKey);

    // Get top 10 players (highest scores first)
    const results = await redis.zRange(leaderboardKey, 0, 9, {
      by: 'rank',
      reverse: true
    });

    console.log("Leaderboard results:", results);
    console.log("Total players:", totalPlayers);

    if (!results || results.length === 0) {
      res.json({
        type: "leaderboard",
        entries: [],
        totalPlayers: 0,
      });
      return;
    }

    const entries = await Promise.all(
      results.map(async (entry, index) => ({
        username: entry.member,
        score: entry.score,
        rank: index + 1,
      }))
    );

    console.log("Formatted entries:", entries);

    res.json({
      type: "leaderboard",
      entries,
      totalPlayers,
    });
  } catch (error) {
    console.error(`Error fetching leaderboard:`, error);
    res.json({
      type: "leaderboard",
      entries: [],
      totalPlayers: 0,
    });
  }
});

router.post<
  { postId: string },
  { status: string; message: string },
  unknown
>("/api/clear-progress", async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({
      status: "error",
      message: "postId is required",
    });
    return;
  }

  try {
    const username = await reddit.getCurrentUsername();

    // Clear all player data for this post
    const keys = [
      `player:${username}:post:${postId}:path`,
      `player:${username}:post:${postId}:completed`,
      `player:${username}:post:${postId}:score`,
    ];

    await Promise.all(keys.map(key => redis.del(key)));

    res.json({
      status: "success",
      message: "Progress cleared",
    });
  } catch (error) {
    console.error(`Error clearing progress:`, error);
    res.status(400).json({
      status: "error",
      message: "Failed to clear progress",
    });
  }
});

router.post("/internal/on-app-install", async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: "success",
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: "error",
      message: "Failed to create post",
    });
  }
});

router.post("/internal/menu/post-create", async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: "error",
      message: "Failed to create post",
    });
  }
});

app.use(router);

const server = createServer(app);
server.on("error", (err) => console.error(`server error; ${err.stack}`));
server.listen(getServerPort());
