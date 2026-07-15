import React, { useEffect, useRef, useState } from "react";
import Cube from "./Cube";
import Target from "./Target";

const GRID = 5;
const WIN_SCORE = 400;
const TIME_LIMIT = 30;
const START_MODES = [
  { id: "normal", label: "Normal", winScore: 400, timeLimit: 30 },
  { id: "hard", label: "Hard", winScore: 300, timeLimit: 20 },
];

export default function GameBoard() {
  const [cube, setCube] = useState({ x: 0, y: 0 });
  const [target, setTarget] = useState({ x: 3, y: 3 });
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(TIME_LIMIT);
  const [status, setStatus] = useState("idle");
  const [selectedMode, setSelectedMode] = useState("normal");
  const [targetScore, setTargetScore] = useState(WIN_SCORE);
  const [timeLimit, setTimeLimit] = useState(TIME_LIMIT);
  const [history, setHistory] = useState([]);
  const prevStatus = useRef("idle");
  const timerRef = useRef(null);

  // Generate random target (not on cube)
  const randomTarget = (cubePos) => {
    let x, y;
    do {
      x = Math.floor(Math.random() * GRID);
      y = Math.floor(Math.random() * GRID);
    } while (x === cubePos.x && y === cubePos.y);
    return { x, y };
  };

  // START TIMER (only once)
  useEffect(() => {
    if (status !== "playing") return;

    timerRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setStatus(score >= targetScore ? "win" : "lose");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [status]);

  // MOVEMENT LOGIC
  useEffect(() => {
    if (status !== "playing") return;

    const move = (e) => {
      setCube((prev) => {
        let { x, y } = prev;
        let moved = true;

        if (e.key === "ArrowUp") {
          if (y > 0) y--;
          else moved = false;
        }
        if (e.key === "ArrowDown") {
          if (y < GRID - 1) y++;
          else moved = false;
        }
        if (e.key === "ArrowLeft") {
          if (x > 0) x--;
          else moved = false;
        }
        if (e.key === "ArrowRight") {
          if (x < GRID - 1) x++;
          else moved = false;
        }

        setScore((s) => (moved ? s + 1 : s - 1));

        // Target collision
        if (x === target.x && y === target.y) {
          setScore((s) => s + 5);
          setTarget(randomTarget({ x, y }));
        }

        return { x, y };
      });
    };

    window.addEventListener("keydown", move);
    return () => window.removeEventListener("keydown", move);
  }, [status, target]);

  // EARLY WIN CHECK
  useEffect(() => {
    if (score >= targetScore && status === "playing") {
      clearInterval(timerRef.current);
      setStatus("win");
    }
  }, [score, status, targetScore]);

  useEffect(() => {
    if (prevStatus.current === "playing" && status !== "playing") {
      setHistory((prev) => [
        {
          id: Date.now(),
          score,
          result: status,
          timeLeft: time,
          finishedAt: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    }
    prevStatus.current = status;
  }, [status, score, time]);

  const startGame = () => {
    const mode = START_MODES.find((item) => item.id === selectedMode) || START_MODES[0];
    setTargetScore(mode.winScore);
    setTimeLimit(mode.timeLimit);
    setCube({ x: 0, y: 0 });
    setTarget(randomTarget({ x: 0, y: 0 }));
    setScore(0);
    setTime(mode.timeLimit);
    setStatus("playing");
  };

  useEffect(() => {
    if (status !== "idle") return;

    const onArrowKey = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        startGame();
      }
    };

    window.addEventListener("keydown", onArrowKey);
    return () => window.removeEventListener("keydown", onArrowKey);
  }, [status, selectedMode]);

  // RESTART GAME
  const restartGame = () => {
    clearInterval(timerRef.current);
    setCube({ x: 0, y: 0 });
    setTarget({ x: 3, y: 3 });
    setScore(0);
    setTime(timeLimit);
    setStatus("idle");
  };

  return (
    <div className="game">
      <aside className="sidebar">
        <div className="stats">
          <p>Score: {score}</p>
          <p>Winning score: {targetScore}</p>
          <p>Time: {time}s</p>
        </div>
        {status === "idle" && (
          <div className="start-menu">
            <h2>Choose game mode</h2>
            <p>Select a mode, then press any arrow key to start.</p>
            <div className="mode-buttons">
              {START_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={mode.id === selectedMode ? "mode-button active" : "mode-button"}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="history">
          <h2>Previous game scores</h2>
          {history.length ? (
            <ul>
              {history.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.finishedAt}</span>
                  <strong> {entry.result === "win" ? "Win" : "Lose"}</strong>
                  <span> — {entry.score} pts</span>
                  <span> / {entry.timeLeft}s left</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-history">No previous games yet.</p>
          )}
        </div>
      </aside>

      <main className="play-area">
        <div className="board">
          {[...Array(GRID)].map((_, row) =>
            [...Array(GRID)].map((_, col) => {
              if (cube.x === col && cube.y === row)
                return <Cube key={`${row}-${col}`} />;
              if (target.x === col && target.y === row)
                return <Target key={`${row}-${col}`} />;
              return <div className="cell" key={`${row}-${col}`} />;
            })
          )}
        </div>

        {status === "win" && (
          <p className="result win">🏆 You Win!</p>
        )}

        {status === "lose" && (
          <p className="result lose">❌ You Lost!</p>
        )}

        {(status === "win" || status === "lose") && (
          <button className="restart" onClick={restartGame}>
            Restart Game
          </button>
        )}
      </main>
    </div>
  );
}
