"use client";

import { useState } from "react";

const phonemes = [
  "p", "t", "k",
  "b", "d", "g",
  "n", "m", "ŋ",
  "f", "s", "θ", "ʃ",
  "v", "z", "ð", "ʒ",
  "l", "ɹ", "w", "j",
  "h", "tʃ", "dʒ",
  "iː", "ɪ", "e", "eː",
  "æ", "ɐ", "ɐː", "ɜː",
  "ʉː", "ɔ", "oː", "ʊ",
  "æɪ", "ɑe", "oɪ", "əʉ",
  "æɔ", "ɪə", "ə"
];

export default function WordlePage() {
  const [englishWord, setEnglishWord] = useState("");
  const [selectedPhonemes, setSelectedPhonemes] = useState<string[]>([]);
  const [guesses, setGuesses] = useState(6);
  const [difficulty, setDifficulty] = useState("easy");
  const [showHints, setShowHints] = useState(false);

  function addPhoneme(phoneme: string) {
    setSelectedPhonemes([...selectedPhonemes, phoneme]);
  }

  function removeLastPhoneme() {
    setSelectedPhonemes(selectedPhonemes.slice(0, -1));
  }

  function clearPhonemes() {
    setSelectedPhonemes([]);
  }

  function generateHTML() {
    if (selectedPhonemes.length === 0) {
      alert("Please select at least one phoneme first.");
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Phoneme Wordle</title>

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

  .game {
    max-width: 800px;
    margin: auto;
  }

  h1 {
    text-align: center;
  }

  .info {
    text-align: center;
    margin-bottom: 25px;
  }

  .grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    margin-bottom: 30px;
  }

  .row {
    display: flex;
    gap: 6px;
  }

  .cell {
    width: 52px;
    height: 52px;
    border: 2px solid #94a3b8;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
  }

  .cell.correct {
    background: #22c55e;
    color: white;
  }

  .cell.present {
    background: #eab308;
    color: white;
  }

  .cell.absent {
    background: #64748b;
    color: white;
  }

  .keyboard {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    max-width: 700px;
    margin: auto;
  }

  .key {
    padding: 10px 12px;
    border: none;
    background: #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
  }

  .controls {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
  }

  .control-button {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background: #2563eb;
    color: white;
  }

  .message {
    text-align: center;
    margin-top: 20px;
    font-weight: bold;
  }

  @media (max-width: 600px) {
    .cell {
      width: 44px;
      height: 44px;
      font-size: 15px;
    }

    .key {
      padding: 8px 10px;
      font-size: 14px;
    }
  }
</style>
</head>

<body>

<div class="game">

<h1>Phoneme Wordle</h1>

<div class="info">
  <p><strong>Difficulty:</strong> ${difficulty}</p>
  <p><strong>Guesses:</strong> ${guesses}</p>
  ${
    showHints
      ? `<p><strong>Hint:</strong> The English word is ${englishWord || "not provided"}.</p>`
      : ""
  }
</div>

<div id="grid" class="grid"></div>

<div id="keyboard" class="keyboard"></div>

<div class="controls">
  <button class="control-button" id="deleteBtn">Delete</button>
  <button class="control-button" id="submitBtn">Submit Guess</button>
</div>

<div id="message" class="message"></div>

</div>

<script>
const target = ${JSON.stringify(selectedPhonemes)};
const maxGuesses = ${guesses};

const phonemeKeyboard = ${JSON.stringify(phonemes)};

let currentRow = 0;
let currentGuess = [];

const grid = document.getElementById("grid");
const keyboard = document.getElementById("keyboard");
const message = document.getElementById("message");

for (let r = 0; r < maxGuesses; r++) {
  const row = document.createElement("div");
  row.className = "row";

  for (let c = 0; c < target.length; c++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.id = "cell-" + r + "-" + c;
    row.appendChild(cell);
  }

  grid.appendChild(row);
}

phonemeKeyboard.forEach((phoneme) => {
  const button = document.createElement("button");

  button.className = "key";
  button.textContent = phoneme;

  button.addEventListener("click", function () {
    if (currentRow >= maxGuesses) return;

    if (currentGuess.length < target.length) {
      currentGuess.push(phoneme);
      updateCurrentRow();
    }
  });

  keyboard.appendChild(button);
});

function updateCurrentRow() {
  for (let c = 0; c < target.length; c++) {
    const cell = document.getElementById(
      "cell-" + currentRow + "-" + c
    );

    cell.textContent = currentGuess[c] || "";
  }
}

document
  .getElementById("deleteBtn")
  .addEventListener("click", function () {
    if (currentGuess.length > 0) {
      currentGuess.pop();
      updateCurrentRow();
    }
  });

document
  .getElementById("submitBtn")
  .addEventListener("click", function () {
    if (currentGuess.length !== target.length) {
      message.textContent =
        "Please complete the whole phoneme guess first.";
      return;
    }

    const targetCopy = [...target];
    const result = new Array(target.length).fill("absent");

    currentGuess.forEach((phoneme, index) => {
      if (phoneme === target[index]) {
        result[index] = "correct";
        targetCopy[index] = null;
      }
    });

    currentGuess.forEach((phoneme, index) => {
      if (
        result[index] !== "correct" &&
        targetCopy.includes(phoneme)
      ) {
        result[index] = "present";

        const foundIndex = targetCopy.indexOf(phoneme);
        targetCopy[foundIndex] = null;
      }
    });

    result.forEach((status, index) => {
      const cell = document.getElementById(
        "cell-" + currentRow + "-" + index
      );

      cell.classList.add(status);
    });

    const isCorrect = currentGuess.every(
      (phoneme, index) => phoneme === target[index]
    );

    if (isCorrect) {
      message.textContent = "Correct! Well done.";
      currentRow = maxGuesses;
      return;
    }

    currentRow++;
    currentGuess = [];

    if (currentRow >= maxGuesses) {
      message.textContent =
        "Game over. The correct phonemes were: " +
        target.join(" ");
    } else {
      message.textContent = "";
    }
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
    link.download = "phoneme-wordle.html";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <main style={{ padding: "30px", minHeight: "100vh" }}>
      <h1>Phoneme Wordle Builder</h1>

      <p>
        Create a Wordle-style classroom activity using phoneme-based words.
      </p>

      <section style={{ marginTop: "30px" }}>
        <h2>Activity Settings</h2>

        <label htmlFor="englishWord">English Word:</label>

        <br />

        <input
          id="englishWord"
          type="text"
          value={englishWord}
          onChange={(e) => setEnglishWord(e.target.value)}
          placeholder="e.g. bed"
        />

        <br />
        <br />

        <label>Selected Phonemes:</label>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "10px",
            marginBottom: "10px",
            flexWrap: "wrap",
          }}
        >
          {selectedPhonemes.length === 0 ? (
            <p>No phonemes selected.</p>
          ) : (
            selectedPhonemes.map((phoneme, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #777",
                  padding: "10px",
                  minWidth: "40px",
                  textAlign: "center",
                }}
              >
                {phoneme}
              </div>
            ))
          )}
        </div>

        <button type="button" onClick={removeLastPhoneme}>
          Delete Last
        </button>

        {" "}

        <button type="button" onClick={clearPhonemes}>
          Clear
        </button>

        <br />
        <br />

        <h3>Phoneme Keyboard</h3>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            maxWidth: "650px",
          }}
        >
          {phonemes.map((phoneme) => (
            <button
              key={phoneme}
              type="button"
              onClick={() => addPhoneme(phoneme)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              {phoneme}
            </button>
          ))}
        </div>

        <br />

        <label htmlFor="guesses">Number of Guesses:</label>

        <br />

        <input
          id="guesses"
          type="number"
          min="1"
          max="10"
          value={guesses}
          onChange={(e) => setGuesses(Number(e.target.value))}
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

        <label>
          <input
            type="checkbox"
            checked={showHints}
            onChange={(e) => setShowHints(e.target.checked)}
          />
          {" "}Show hints
        </label>
      </section>

      <section style={{ marginTop: "40px" }}>
        <h2>Preview</h2>

        <p>
          English Word: <strong>{englishWord || "Not entered"}</strong>
        </p>

        <p>
          Phonemes:{" "}
          <strong>
            {selectedPhonemes.length > 0
              ? selectedPhonemes.join(" ")
              : "Not selected"}
          </strong>
        </p>

        <p>
          Difficulty: <strong>{difficulty}</strong>
        </p>

        <p>
          Hints: <strong>{showHints ? "On" : "Off"}</strong>
        </p>

        <div style={{ marginTop: "20px" }}>
          {Array.from({ length: guesses }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: "flex",
                gap: "5px",
                marginBottom: "5px",
              }}
            >
              {Array.from({
                length: selectedPhonemes.length || 3,
              }).map((_, columnIndex) => (
                <div
                  key={columnIndex}
                  style={{
                    width: "45px",
                    height: "45px",
                    border: "2px solid #777",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
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