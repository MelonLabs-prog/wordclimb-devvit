import {
  InitResponse,
  SubmitWordResponse,
  ResetGameResponse,
  LeaderboardResponse,
} from "../shared/types/api";
import { navigateTo } from "@devvit/web/client";

// DOM Elements - Landing Page
const landingPage = document.getElementById("landing-page") as HTMLDivElement;
const gameContainer = document.getElementById("game-container") as HTMLDivElement;
const startGameButton = document.getElementById("start-game-button") as HTMLButtonElement;
const landingPuzzleNumber = document.getElementById("landing-puzzle-number") as HTMLParagraphElement;
const landingStartWord = document.getElementById("landing-start-word") as HTMLSpanElement;
const landingEndWord = document.getElementById("landing-end-word") as HTMLSpanElement;
const landingLeaderboard = document.getElementById("landing-leaderboard") as HTMLDivElement;

// DOM Elements - Game
const puzzleNumberElement = document.getElementById("puzzle-number") as HTMLParagraphElement;
const startWordElement = document.getElementById("start-word") as HTMLSpanElement;
const endWordElement = document.getElementById("end-word") as HTMLSpanElement;
const usernameElement = document.getElementById("username") as HTMLSpanElement;
const stepCountElement = document.getElementById("step-count") as HTMLSpanElement;
const optimalStepsElement = document.getElementById("optimal-steps") as HTMLSpanElement;
const pathContainer = document.getElementById("path-container") as HTMLDivElement;
const wordInput = document.getElementById("word-input") as HTMLInputElement;
const submitButton = document.getElementById("submit-button") as HTMLButtonElement;
const messageElement = document.getElementById("message") as HTMLDivElement;
const completionSection = document.getElementById("completion-section") as HTMLDivElement;
const inputSection = document.getElementById("input-section") as HTMLDivElement;
const finalScoreElement = document.getElementById("final-score") as HTMLDivElement;
const scoreDetailsElement = document.getElementById("score-details") as HTMLDivElement;
const resetButton = document.getElementById("reset-button") as HTMLButtonElement;
const clearProgressButton = document.getElementById("clear-progress-button") as HTMLButtonElement;
const backButton = document.getElementById("back-button") as HTMLButtonElement;
const giveUpButton = document.getElementById("give-up-button") as HTMLButtonElement;
const totalPlayersElement = document.getElementById("total-players") as HTMLSpanElement;
const loadingElement = document.getElementById("loading") as HTMLDivElement;
const confirmModal = document.getElementById("confirm-modal") as HTMLDivElement;
const confirmYesButton = document.getElementById("confirm-yes") as HTMLButtonElement;
const confirmNoButton = document.getElementById("confirm-no") as HTMLButtonElement;

// Game State
let currentPostId: string | null = null;
let currentPuzzle: { start: string; end: string; optimal: number; number: number } | null = null;
let currentPath: string[] = [];
let isCompleted = false;

// Initialize game
async function initializeGame() {
  showLoading(true);
  try {
    const response = await fetch("/api/init");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as InitResponse;

    if (data.type === "init") {
      currentPostId = data.postId;
      currentPuzzle = data.puzzle;
      currentPath = data.playerState?.path || [data.puzzle.start];
      isCompleted = data.playerState?.completed || false;

      // Update Landing Page
      landingPuzzleNumber.textContent = `Daily Puzzle #${data.puzzle.number}`;
      landingStartWord.textContent = data.puzzle.start.toUpperCase();
      landingEndWord.textContent = data.puzzle.end.toUpperCase();

      // Update Game UI
      usernameElement.textContent = data.username;
      puzzleNumberElement.textContent = `Puzzle #${data.puzzle.number}`;
      startWordElement.textContent = data.puzzle.start.toUpperCase();
      endWordElement.textContent = data.puzzle.end.toUpperCase();
      optimalStepsElement.textContent = data.puzzle.optimal.toString();

      updatePath();

      if (isCompleted && data.playerState?.score) {
        showCompletion(data.playerState.score);
      }

      // Load leaderboard for landing page
      fetchLandingLeaderboard();
    } else {
      showMessage("Failed to load game", "error");
    }
  } catch (error) {
    console.error("Error initializing game:", error);
    showMessage("Error loading game. Please refresh.", "error");
  } finally {
    showLoading(false);
  }
}

// Show game view
function showGame() {
  landingPage.classList.add("hidden");
  gameContainer.classList.remove("hidden");

  if (!isCompleted) {
    wordInput.focus();
    giveUpButton.classList.remove("hidden");
  } else {
    giveUpButton.classList.add("hidden");
  }
}

// Show landing page
function showLanding() {
  gameContainer.classList.add("hidden");
  landingPage.classList.remove("hidden");
  fetchLandingLeaderboard();
}

// Update path display
function updatePath() {
  pathContainer.innerHTML = "";
  currentPath.forEach((word, index) => {
    const pathItem = document.createElement("div");
    pathItem.className = "path-item";

    const stepNumber = document.createElement("span");
    stepNumber.className = "step-number";
    stepNumber.textContent = `${index + 1}.`;

    const wordSpan = document.createElement("span");
    wordSpan.className = "word";
    wordSpan.textContent = word.toUpperCase();

    pathItem.appendChild(stepNumber);
    pathItem.appendChild(wordSpan);
    pathContainer.appendChild(pathItem);
  });

  // Update step count
  stepCountElement.textContent = (currentPath.length - 1).toString();

  // Scroll to bottom
  pathContainer.scrollTop = pathContainer.scrollHeight;
}

// Submit word
async function submitWord() {
  const word = wordInput.value.trim().toLowerCase();

  if (!word) {
    showMessage("Please enter a word", "error");
    return;
  }

  if (!currentPostId) {
    showMessage("Game not initialized", "error");
    return;
  }

  showLoading(true);
  clearMessage();

  try {
    const response = await fetch("/api/submit-word", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ word }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as SubmitWordResponse;
    console.log("Submit response:", data); // Debug logging

    if (data.type === "submitWord") {
      if (data.valid) {
        currentPath = data.path;
        updatePath();
        wordInput.value = "";

        // Check for completion
        if (data.completed) {
          console.log("Puzzle completed!", data); // Debug logging
          isCompleted = true;
          const score = data.score || (data.scoreDetails?.score) || 0;
          showCompletion(score, data.scoreDetails);
          // Refresh leaderboard after completion
          setTimeout(() => {
            fetchLandingLeaderboard();
          }, 1500);
        } else {
          showMessage("✓ Correct!", "success");
          wordInput.focus();
        }
      } else {
        showMessage(data.message || "Invalid word", "error");
        wordInput.select();
      }
    }
  } catch (error) {
    console.error("Error submitting word:", error);
    showMessage("Error submitting word", "error");
  } finally {
    showLoading(false);
  }
}

// Show completion screen
function showCompletion(score: number, scoreDetails?: any) {
  console.log("Showing completion screen", score, scoreDetails); // Debug logging

  inputSection.classList.add("hidden");
  giveUpButton.classList.add("hidden");
  completionSection.classList.remove("hidden");
  finalScoreElement.textContent = score.toString();

  if (scoreDetails) {
    let details = `${scoreDetails.steps} steps`;
    if (scoreDetails.isOptimal) {
      details += " • Optimal! 🎉";
    }
    if (scoreDetails.bonuses?.firstSolve) {
      details += " • First Solve! ⚡";
    }
    scoreDetailsElement.textContent = details;
  } else {
    scoreDetailsElement.textContent = "Puzzle completed!";
  }
}

// Reset game
async function resetGame() {
  if (!currentPostId) return;

  showLoading(true);

  try {
    const response = await fetch("/api/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as ResetGameResponse;

    if (data.type === "reset") {
      currentPath = [data.puzzle.start];
      isCompleted = false;
      updatePath();
      completionSection.classList.add("hidden");
      inputSection.classList.remove("hidden");
      giveUpButton.classList.remove("hidden");
      clearMessage();
      wordInput.value = "";
      wordInput.focus();
    }
  } catch (error) {
    console.error("Error resetting game:", error);
    showMessage("Error resetting game", "error");
  } finally {
    showLoading(false);
  }
}

// UI Helper Functions
function showMessage(message: string, type: "success" | "error") {
  messageElement.textContent = message;
  messageElement.className = `message ${type}`;
  messageElement.style.display = "block";

  // Auto-hide success messages
  if (type === "success") {
    setTimeout(() => {
      clearMessage();
    }, 2000);
  }
}

function clearMessage() {
  messageElement.textContent = "";
  messageElement.style.display = "none";
  messageElement.className = "message";
}

function showLoading(show: boolean) {
  if (show) {
    loadingElement.classList.remove("hidden");
  } else {
    loadingElement.classList.add("hidden");
  }
}

function showConfirmModal() {
  confirmModal.classList.remove("hidden");
}

function hideConfirmModal() {
  confirmModal.classList.add("hidden");
}

// Fetch and display leaderboard (for landing page)
async function fetchLandingLeaderboard() {
  try {
    console.log("Fetching landing page leaderboard...");
    const response = await fetch("/api/leaderboard");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as LeaderboardResponse;
    console.log("Landing page leaderboard data:", data);

    if (data.type === "leaderboard") {
      displayLandingLeaderboard(data.entries, data.totalPlayers);
    }
  } catch (error) {
    console.error("Error fetching landing leaderboard:", error);
    landingLeaderboard.innerHTML = '<div class="error-message">Failed to load leaderboard</div>';
  }
}

// Display leaderboard entries (for landing page)
function displayLandingLeaderboard(entries: any[], totalPlayers: number) {
  // Update total player count
  totalPlayersElement.textContent = totalPlayers.toString();

  if (entries.length === 0) {
    landingLeaderboard.innerHTML = '<div class="empty-message">No players yet. Be the first!</div>';
    return;
  }

  const html = entries.slice(0, 5).map(entry => {
    const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `${entry.rank}.`;
    return `
      <div class="landing-leaderboard-entry">
        <span class="rank">${medal}</span>
        <span class="username">${entry.username}</span>
        <span class="score">${entry.score}</span>
      </div>
    `;
  }).join('');

  landingLeaderboard.innerHTML = html;
}

// Navigate back to subreddit
function goBack() {
  // Use Devvit's navigateTo API to go back to the post
  // This will close the game and return to the Reddit post
  window.history.back();
}

// Clear progress (for testing)
async function clearProgress() {
  if (!currentPostId) return;

  if (!confirm("Clear your progress? This will let you play the puzzle again.")) {
    return;
  }

  showLoading(true);

  try {
    const response = await fetch("/api/clear-progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Reload the page to start fresh
    window.location.reload();
  } catch (error) {
    console.error(`Error clearing progress:`, error);
    showMessage("Error clearing progress", "error");
    showLoading(false);
  }
}

// Event Listeners
submitButton.addEventListener("click", submitWord);
wordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    submitWord();
  }
});
resetButton.addEventListener("click", resetGame);
clearProgressButton.addEventListener("click", clearProgress);
backButton.addEventListener("click", showLanding);
startGameButton.addEventListener("click", showGame);
giveUpButton.addEventListener("click", () => {
  console.log("Give Up button clicked");
  showConfirmModal();
});

confirmYesButton.addEventListener("click", () => {
  console.log("User confirmed, resetting game...");
  hideConfirmModal();
  resetGame();
});

confirmNoButton.addEventListener("click", () => {
  console.log("User cancelled");
  hideConfirmModal();
});

// Initialize on load
initializeGame();
