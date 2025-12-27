import React, { useEffect, useRef, useState } from "react";
import Cube from "./Cube";
import Target from "./Target";

const GRID = 5;
const WIN_SCORE = 400;
const TIME_LIMIT = 30;

export default function GameBoard() {
  const [cube, setCube] = useState({ x: 0, y: 0 });
  const [target, setTarget] = useState({ x: 3, y: 3 });
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(TIME_LIMIT);
  const [status, setStatus] = useState("playing"); 
  // playing | win | lose

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
          setStatus(score >= WIN_SCORE ? "win" : "lose");
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
    if (score >= WIN_SCORE && status === "playing") {
      clearInterval(timerRef.current);
      setStatus("win");
    }
  }, [score, status]);

  // RESTART GAME
  const restartGame = () => {
    clearInterval(timerRef.current);
    setCube({ x: 0, y: 0 });
    setTarget({ x: 3, y: 3 });
    setScore(0);
    setTime(TIME_LIMIT);
    setStatus("playing");
  };

  return (
    <div className="game">
      <div className="stats">
        <p>Score: {score}</p>
        <p>Time: {time}s</p>
      </div>

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
    </div>
  );
}
