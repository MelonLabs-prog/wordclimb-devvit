import { context, reddit } from "@devvit/web/server";

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error("subredditName is required");
  }

  const today = new Date().toISOString().split('T')[0];
  const puzzleNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

  return await reddit.submitCustomPost({
    splash: { // Splash Screen Configuration
      appDisplayName: 'WordClimb',
      backgroundUri: 'splash-background.gif',
      appIconUri: 'wordclimb-icon.png',
      buttonLabel: ' ',
      entryUri: 'index.html',
    },
    postData: {
      gameState: 'initial',
      score: 0
    },
    subredditName: subredditName,
    title: `WordClimb Daily Puzzle #${puzzleNumber} - ${today}`,
  });
};
