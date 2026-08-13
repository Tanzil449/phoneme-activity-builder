"use client";

import { useState } from "react";

const defaultWords = `tʃ ɪ n
b æɪ t
dʒ æ m
b æ d
b ʉː t`;

type Coordinate = {
  r: number;
  c: number;
};

type Solution = {
  word: string;
  coords: Coordinate[];
};

export default function WordSearchPage() {
  const [phonemeWords, setPhonemeWords] = useState(defaultWords);
  const [rows, setRows] = useState(10);
  const [columns, setColumns] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");

  const [grid, setGrid] = useState<string[][]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);

  const words = phonemeWords
    .split("\n")
    .map((word) => word.trim())
    .filter((word) => word.length > 0);

  function createPuzzle() {
    const wordData = words.map((word) => ({
      display: word,
      units: word.split(/\s+/),
    }));

    const pool = Array.from(
      new Set(wordData.flatMap((word) => word.units))
    );

    const puzzle: (string | null)[][] = Array.from(
      { length: rows },
      () => Array(columns).fill(null)
    );

    let directions = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
    ];

    if (difficulty === "medium") {
      directions = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 1, dc: 1 },
        { dr: 1, dc: -1 },
      ];
    }

    if (difficulty === "hard") {
      directions = [
        { dr: 0, dc: 1 },
        { dr: 0, dc: -1 },
        { dr: 1, dc: 0 },
        { dr: -1, dc: 0 },
        { dr: 1, dc: 1 },
        { dr: 1, dc: -1 },
        { dr: -1, dc: 1 },
        { dr: -1, dc: -1 },
      ];
    }

    const newSolutions: Solution[] = [];

    function canPlace(
      units: string[],
      startR: number,
      startC: number,
      dr: number,
      dc: number
    ) {
      const endR = startR + dr * (units.length - 1);
      const endC = startC + dc * (units.length - 1);

      if (
        endR < 0 ||
        endR >= rows ||
        endC < 0 ||
        endC >= columns
      ) {
        return false;
      }

      for (let i = 0; i < units.length; i++) {
        const r = startR + dr * i;
        const c = startC + dc * i;

        if (puzzle[r][c] && puzzle[r][c] !== units[i]) {
          return false;
        }
      }

      return true;
    }

    wordData.forEach((word) => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 300) {
        attempts++;

        const direction =
          directions[Math.floor(Math.random() * directions.length)];

        const startR = Math.floor(Math.random() * rows);
        const startC = Math.floor(Math.random() * columns);

        if (
          canPlace(
            word.units,
            startR,
            startC,
            direction.dr,
            direction.dc
          )
        ) {
          const coords: Coordinate[] = [];

          word.units.forEach((phoneme, index) => {
            const r = startR + direction.dr * index;
            const c = startC + direction.dc * index;

            puzzle[r][c] = phoneme;
            coords.push({ r, c });
          });

          newSolutions.push({
            word: word.display,
            coords,
          });

          placed = true;
        }
      }
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        if (!puzzle[r][c]) {
          puzzle[r][c] =
            pool[Math.floor(Math.random() * pool.length)] || "ə";
        }
      }
    }

    setGrid(puzzle as string[][]);
    setSolutions(newSolutions);
  }

  function generateHTML() {
    if (grid.length === 0) {
      alert("Please click Generate Puzzle first.");
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Phoneme Word Search</title>

<style>
  * {
    box-sizing: border-box;
  }

  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 30px;
    background: #f5f7fa;
    color: #222;
  }

  h1 {
    text-align: center;
  }

  .info {
    text-align: center;
    margin-bottom: 25px;
  }

  .game-area {
    max-width: 900px;
    margin: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(${columns}, 42px);
    gap: 4px;
    justify-content: center;
    touch-action: none;
  }

  .cell {
    width: 42px;
    height: 42px;
    border: 1px solid #8a94a3;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    cursor: pointer;
    user-select: none;
  }

  .cell.selecting {
    background: #fde68a;
  }

  .cell.found {
    background: #86efac;
  }

  .cell.answer {
    background: #f9a8d4;
  }

  .word-list {
    max-width: 600px;
    margin: 30px auto;
  }

  .word-item {
    margin: 8px 0;
  }

  .word-item.found {
    text-decoration: line-through;
    opacity: 0.6;
  }

  button {
    display: block;
    margin: 25px auto;
    padding: 12px 20px;
    font-size: 16px;
    cursor: pointer;
  }

  @media (max-width: 600px) {
    .grid {
      grid-template-columns: repeat(${columns}, 32px);
    }

    .cell {
      width: 32px;
      height: 32px;
      font-size: 13px;
    }
  }
</style>
</head>

<body>

<div class="game-area">

<h1>Phoneme Word Search</h1>

<div class="info">
  <p><strong>Difficulty:</strong> ${difficulty}</p>
  <p><strong>Grid Size:</strong> ${rows} × ${columns}</p>
  <p>Drag across a phoneme sequence to find each word.</p>
</div>

<div id="grid" class="grid"></div>

<div class="word-list">
  <h2>Word List</h2>
  <div id="wordList"></div>
</div>

<button id="answerButton">Show Answers</button>

</div>

<script>
const gridData = ${JSON.stringify(grid)};
const solutionData = ${JSON.stringify(solutions)};
const words = ${JSON.stringify(words)};

const gridElement = document.getElementById("grid");
const wordList = document.getElementById("wordList");

let selecting = false;
let selectedCells = [];
let showAnswers = false;

function cellKey(r, c) {
  return r + "-" + c;
}

gridData.forEach((row, r) => {
  row.forEach((phoneme, c) => {
    const cell = document.createElement("div");

    cell.className = "cell";
    cell.textContent = phoneme;

    cell.dataset.row = r;
    cell.dataset.col = c;

    cell.addEventListener("pointerdown", function (event) {
      event.preventDefault();

      selecting = true;
      selectedCells = [];

      clearSelecting();

      addSelectedCell(cell);
    });

    cell.addEventListener("pointerenter", function () {
      if (selecting) {
        addSelectedCell(cell);
      }
    });

    gridElement.appendChild(cell);
  });
});

window.addEventListener("pointerup", function () {
  if (!selecting) return;

  selecting = false;

  checkSelection();

  clearSelecting();

  selectedCells = [];
});

words.forEach((word, index) => {
  const item = document.createElement("div");

  item.className = "word-item";
  item.id = "word-" + index;
  item.textContent = word;

  wordList.appendChild(item);
});

function addSelectedCell(cell) {
  const r = Number(cell.dataset.row);
  const c = Number(cell.dataset.col);

  const alreadySelected = selectedCells.some(
    (item) => item.r === r && item.c === c
  );

  if (!alreadySelected) {
    selectedCells.push({ r, c });
    cell.classList.add("selecting");
  }
}

function clearSelecting() {
  document
    .querySelectorAll(".cell.selecting")
    .forEach((cell) => cell.classList.remove("selecting"));
}

function samePath(pathA, pathB) {
  if (pathA.length !== pathB.length) {
    return false;
  }

  return pathA.every(
    (point, index) =>
      point.r === pathB[index].r &&
      point.c === pathB[index].c
  );
}

function checkSelection() {
  solutionData.forEach((solution, index) => {
    const normal = solution.coords;

    const reversed = [...solution.coords].reverse();

    if (
      samePath(selectedCells, normal) ||
      samePath(selectedCells, reversed)
    ) {
      solution.coords.forEach((point) => {
        const cell = document.querySelector(
          '[data-row="' +
            point.r +
            '"][data-col="' +
            point.c +
            '"]'
        );

        if (cell) {
          cell.classList.add("found");
        }
      });

      const wordItem = document.getElementById("word-" + index);

      if (wordItem) {
        wordItem.classList.add("found");
      }
    }
  });
}

document
  .getElementById("answerButton")
  .addEventListener("click", function () {
    showAnswers = !showAnswers;

    solutionData.forEach((solution) => {
      solution.coords.forEach((point) => {
        const cell = document.querySelector(
          '[data-row="' +
            point.r +
            '"][data-col="' +
            point.c +
            '"]'
        );

        if (cell) {
          if (showAnswers) {
            cell.classList.add("answer");
          } else {
            cell.classList.remove("answer");
          }
        }
      });
    });

    this.textContent = showAnswers
      ? "Hide Answers"
      : "Show Answers";
  });
</script>

</body>
</html>
`;

    const blob = new Blob([htmlContent], {
      type: "text/html",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "phoneme-word-search.html";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <main style={{ padding: "30px", minHeight: "100vh" }}>
      <h1>Phoneme Word Search Builder</h1>

      <p>
        Create a phoneme-based Word Search activity for Speech Pathology
        students.
      </p>

      <section style={{ marginTop: "30px" }}>
        <h2>Activity Settings</h2>

        <label htmlFor="phonemeWords">Phoneme Words:</label>

        <br />

        <textarea
          id="phonemeWords"
          rows={8}
          value={phonemeWords}
          onChange={(e) => setPhonemeWords(e.target.value)}
          style={{
            width: "320px",
            padding: "10px",
          }}
        />

        <br />
        <br />

        <label htmlFor="rows">Rows:</label>

        <br />

        <input
          id="rows"
          type="number"
          min="5"
          max="20"
          value={rows}
          onChange={(e) => setRows(Number(e.target.value))}
        />

        <br />
        <br />

        <label htmlFor="columns">Columns:</label>

        <br />

        <input
          id="columns"
          type="number"
          min="5"
          max="20"
          value={columns}
          onChange={(e) => setColumns(Number(e.target.value))}
        />

        <br />
        <br />

        <label htmlFor="difficulty">Difficulty:</label>

        <br />

        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <br />
        <br />

        <button
          type="button"
          onClick={createPuzzle}
          style={{
            padding: "12px 20px",
            backgroundColor: "#475569",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Generate Puzzle
        </button>
      </section>

      <section style={{ marginTop: "40px" }}>
        <h2>Preview</h2>

        <p>
          Grid Size: <strong>{rows} × {columns}</strong>
        </p>

        <p>
          Difficulty: <strong>{difficulty}</strong>
        </p>

        <h3>Word List</h3>

        <ul>
          {words.map((word, index) => (
            <li key={index}>{word}</li>
          ))}
        </ul>

        {grid.length === 0 ? (
          <p>Click Generate Puzzle to create the preview.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, 42px)`,
              gap: "4px",
              marginTop: "20px",
              overflowX: "auto",
            }}
          >
            {grid.flatMap((row, r) =>
              row.map((phoneme, c) => (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: "42px",
                    height: "42px",
                    border: "1px solid #777",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontWeight: "bold",
                  }}
                >
                  {phoneme}
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={generateHTML}
        style={{
          marginTop: "30px",
          padding: "12px 20px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        Generate HTML
      </button>
    </main>
  );
}