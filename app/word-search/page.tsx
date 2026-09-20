
"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------
// TYPES
// ---------------------------------------------

type Coordinate = {
  r: number;
  c: number;
};

type Solution = {
  word: string;
  coords: Coordinate[];
};

type SavedWord = {
  id: number;
  text: string;
  phonemes: string;
  hint: string | null;
};

type SavedWordList = {
  id: number;
  name: string;
  description?: string | null;
  words: {
    wordId: number;
    word: SavedWord;
  }[];
};

type SavedActivity = {
  id: number;
  name: string;
  type: string;
  difficulty: string;
  showHints: boolean;
  maxGuesses: number;
  gridRows: number;
  gridColumns: number;
  wordListId: number;
  wordList: SavedWordList;
};

// ---------------------------------------------
// ORIGINAL DEFAULT WORDS
// ---------------------------------------------

const defaultWords = `tʃ ɪ n
b æɪ t
dʒ æ m
b æ d
b ʉː t`;

// ---------------------------------------------
// HELPERS
// ---------------------------------------------

function parsePhonemes(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);

    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0
      )
    ) {
      return parsed;
    }
  } catch {
    // Invalid stored data.
  }

  return [];
}

async function requestJSON<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

function downloadHTML(
  content: string,
  filename: string
) {
  const blob = new Blob([content], {
    type: "text/html;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------
// PUZZLE GENERATOR
// ---------------------------------------------

function buildPuzzle(
  phonemeWords: string[],
  rows: number,
  columns: number,
  difficulty: string
): {
  grid: string[][];
  solutions: Solution[];
} {
  if (
    !Number.isSafeInteger(rows) ||
    !Number.isSafeInteger(columns) ||
    rows < 5 ||
    rows > 20 ||
    columns < 5 ||
    columns > 20
  ) {
    throw new Error(
      "Rows and columns must be between 5 and 20."
    );
  }

  const wordData = phonemeWords
    .map((word) => ({
      display: word.trim(),
      units: word.trim().split(/\s+/).filter(Boolean),
    }))
    .filter((word) => word.units.length > 0);

  if (wordData.length === 0) {
    throw new Error(
      "Please provide at least one phoneme-based word."
    );
  }

  for (const word of wordData) {
    if (
      word.units.length > rows &&
      word.units.length > columns
    ) {
      throw new Error(
        `The word "${word.display}" is too long for this grid.`
      );
    }
  }

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

  if (difficulty.toLowerCase() === "medium") {
    directions = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: 1, dc: -1 },
    ];
  }

  if (difficulty.toLowerCase() === "hard") {
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
    const endR =
      startR + dr * (units.length - 1);

    const endC =
      startC + dc * (units.length - 1);

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

      if (
        puzzle[r][c] !== null &&
        puzzle[r][c] !== units[i]
      ) {
        return false;
      }
    }

    return true;
  }

  for (const word of wordData) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 1000) {
      attempts++;

      const direction =
        directions[
          Math.floor(Math.random() * directions.length)
        ];

      const startR =
        Math.floor(Math.random() * rows);

      const startC =
        Math.floor(Math.random() * columns);

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
          const r =
            startR + direction.dr * index;

          const c =
            startC + direction.dc * index;

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

    if (!placed) {
      throw new Error(
        `Unable to place "${word.display}". Try a larger grid or fewer words.`
      );
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      if (!puzzle[r][c]) {
        puzzle[r][c] =
          pool[Math.floor(Math.random() * pool.length)];
      }
    }
  }

  return {
    grid: puzzle as string[][],
    solutions: newSolutions,
  };
}

// ---------------------------------------------
// DOWNLOADABLE WORD SEARCH HTML
// ---------------------------------------------

function createWordSearchHTML(
  grid: string[][],
  solutions: Solution[],
  words: string[],
  difficulty: string
): string {
  const rows = grid.length;
  const columns = grid[0]?.length || 0;

  const gameData = JSON.stringify({
    grid,
    solutions,
    words,
  }).replace(/</g, "\\u003c");

  return `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

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
  touch-action: none;
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

.message {
  text-align: center;
  font-weight: bold;
}

@media (max-width: 600px) {
  body {
    padding: 12px;
  }

  .grid {
    grid-template-columns:
      repeat(${columns}, minmax(0, 32px));
    gap: 2px;
    overflow-x: auto;
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

<p>
<strong>Difficulty:</strong>
<span id="difficulty"></span>
</p>

<p>
<strong>Grid Size:</strong>
${rows} × ${columns}
</p>

<p>
Drag across a phoneme sequence to find each word.
</p>

</div>

<div id="grid" class="grid"></div>

<div class="word-list">

<h2>Word List</h2>

<div id="wordList"></div>

</div>

<button id="answerButton">
Show Answers
</button>

<p id="message" class="message" role="status"></p>

</div>

<script>

const gameData = ${gameData};

const gridData = gameData.grid;

const solutionData = gameData.solutions;

const words = gameData.words;

document.getElementById("difficulty").textContent =
  ${JSON.stringify(difficulty)};

const gridElement =
  document.getElementById("grid");

const wordList =
  document.getElementById("wordList");

const message =
  document.getElementById("message");

let selecting = false;

let selectedCells = [];

let showAnswers = false;

const foundWords = new Set();

function cellKey(r, c) {
  return r + "-" + c;
}

// Create puzzle grid

gridData.forEach((row, r) => {

  row.forEach((phoneme, c) => {

    const cell =
      document.createElement("div");

    cell.className = "cell";

    cell.textContent = phoneme;

    cell.dataset.row = String(r);

    cell.dataset.col = String(c);

    cell.addEventListener(
      "pointerdown",
      function (event) {

        event.preventDefault();

        selecting = true;

        selectedCells = [];

        clearSelecting();

        addSelectedCell(cell);

        if (cell.setPointerCapture) {
          cell.setPointerCapture(event.pointerId);
        }

      }
    );

    cell.addEventListener(
      "pointerenter",
      function () {

        if (selecting) {
          addSelectedCell(cell);
        }

      }
    );

    cell.addEventListener(
      "pointermove",
      function (event) {

        if (!selecting) return;

        const hovered =
          document.elementFromPoint(
            event.clientX,
            event.clientY
          );

        if (
          hovered &&
          hovered.classList.contains("cell")
        ) {
          addSelectedCell(hovered);
        }

      }
    );

    gridElement.appendChild(cell);

  });

});

// Complete a selection

window.addEventListener(
  "pointerup",
  function () {

    if (!selecting) return;

    selecting = false;

    checkSelection();

    clearSelecting();

    selectedCells = [];

  }
);

// Create word list

words.forEach((word, index) => {

  const item =
    document.createElement("div");

  item.className = "word-item";

  item.id = "word-" + index;

  item.textContent = word;

  wordList.appendChild(item);

});

function addSelectedCell(cell) {

  const r = Number(cell.dataset.row);

  const c = Number(cell.dataset.col);

  const alreadySelected =
    selectedCells.some(
      (item) =>
        item.r === r &&
        item.c === c
    );

  if (!alreadySelected) {

    selectedCells.push({ r, c });

    cell.classList.add("selecting");

  }

}

function clearSelecting() {

  document
    .querySelectorAll(".cell.selecting")
    .forEach((cell) =>
      cell.classList.remove("selecting")
    );

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

// Check selected word

function checkSelection() {

  solutionData.forEach(
    (solution, index) => {

      if (foundWords.has(index)) return;

      const normal = solution.coords;

      const reversed =
        [...solution.coords].reverse();

      if (
        samePath(selectedCells, normal) ||
        samePath(selectedCells, reversed)
      ) {

        foundWords.add(index);

        solution.coords.forEach(
          (point) => {

            const cell =
              document.querySelector(
                '[data-row="' +
                point.r +
                '"][data-col="' +
                point.c +
                '"]'
              );

            if (cell) {
              cell.classList.add("found");
            }

          }
        );

        const wordItem =
          document.getElementById(
            "word-" + index
          );

        if (wordItem) {
          wordItem.classList.add("found");
        }

      }

    }
  );

  if (
    foundWords.size === solutionData.length
  ) {

    message.textContent =
      "Well done! You found all the words.";

  }

}

// Show and hide answers

document
  .getElementById("answerButton")
  .addEventListener(
    "click",
    function () {

      showAnswers = !showAnswers;

      solutionData.forEach(
        (solution) => {

          solution.coords.forEach(
            (point) => {

              const cell =
                document.querySelector(
                  '[data-row="' +
                  point.r +
                  '"][data-col="' +
                  point.c +
                  '"]'
                );

              if (cell) {

                if (showAnswers) {

                  cell.classList.add(
                    "answer"
                  );

                } else {

                  cell.classList.remove(
                    "answer"
                  );

                }

              }

            }
          );

        }
      );

      this.textContent =
        showAnswers
          ? "Hide Answers"
          : "Show Answers";

    }
  );

</script>

</body>

</html>
`;
}

// ---------------------------------------------
// MAIN WORD SEARCH BUILDER
// ---------------------------------------------

export default function WordSearchPage() {

  // Original Word Search settings

  const [phonemeWords, setPhonemeWords] =
    useState(defaultWords);

  const [rows, setRows] = useState(10);

  const [columns, setColumns] =
    useState(10);

  const [difficulty, setDifficulty] =
    useState("Medium");

  const [grid, setGrid] =
    useState<string[][]>([]);

  const [solutions, setSolutions] =
    useState<Solution[]>([]);

  // Saved database words

  const [savedWords, setSavedWords] =
    useState<SavedWord[]>([]);

  const [selectedWordId, setSelectedWordId] =
    useState("");

  const [englishWord, setEnglishWord] =
    useState("");

  const [wordPhonemes, setWordPhonemes] =
    useState("");

  const [hint, setHint] =
    useState("");

  // Word lists

  const [wordLists, setWordLists] =
    useState<SavedWordList[]>([]);

  const [selectedWordListId, setSelectedWordListId] =
    useState("");

  const [newListName, setNewListName] =
    useState("");

  // Saved activities

  const [savedActivities, setSavedActivities] =
    useState<SavedActivity[]>([]);

  const [selectedActivityId, setSelectedActivityId] =
    useState("");

  const [activityName, setActivityName] =
    useState("");

  // Messages

  const [databaseMessage, setDatabaseMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // ---------------------------------------------
  // REFRESH DATABASE
  // ---------------------------------------------

  async function refreshDatabase() {

    const [words, lists, activities] =
      await Promise.all([
        requestJSON<SavedWord[]>("/api/words"),

        requestJSON<SavedWordList[]>(
          "/api/word-lists"
        ),

        requestJSON<SavedActivity[]>(
          "/api/activities"
        ),
      ]);

    setSavedWords(words);

    setWordLists(lists);

    setSavedActivities(
      activities.filter(
        (activity) =>
          activity.type === "WORD_SEARCH"
      )
    );

  }

  // ---------------------------------------------
  // LOAD DATABASE ON PAGE OPEN
  // ---------------------------------------------

  useEffect(() => {

    let cancelled = false;

    async function loadInitialData() {

      try {

        const [words, lists, activities] =
          await Promise.all([
            requestJSON<SavedWord[]>(
              "/api/words"
            ),

            requestJSON<SavedWordList[]>(
              "/api/word-lists"
            ),

            requestJSON<SavedActivity[]>(
              "/api/activities"
            ),
          ]);

        if (cancelled) return;

        setSavedWords(words);

        setWordLists(lists);

        setSavedActivities(
          activities.filter(
            (activity) =>
              activity.type === "WORD_SEARCH"
          )
        );

      } catch (error) {

        if (!cancelled) {

          setDatabaseMessage(
            error instanceof Error
              ? error.message
              : "Unable to load database data."
          );

        }

      }

    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };

  }, []);

  // ---------------------------------------------
  // LOAD A SAVED WORD
  // ---------------------------------------------

  function selectSavedWord(id: string) {

    setSelectedWordId(id);

    if (!id) return;

    const word = savedWords.find(
      (item) => item.id === Number(id)
    );

    if (!word) {

      setDatabaseMessage(
        "Selected word not found."
      );

      return;

    }

    const parsed =
      parsePhonemes(word.phonemes);

    if (parsed.length === 0) {

      setDatabaseMessage(
        "This word has invalid phoneme data."
      );

      return;

    }

    setEnglishWord(word.text);

    setWordPhonemes(
      parsed.join(" ")
    );

    setHint(word.hint || "");

    setDatabaseMessage(
      `Loaded "${word.text}" from the database.`
    );

  }

  // ---------------------------------------------
  // SAVE NEW WORD
  // ---------------------------------------------

  async function saveWord() {

    const units =
      wordPhonemes.trim().split(/\s+/).filter(Boolean);

    if (!englishWord.trim()) {

      alert(
        "Please enter an English word."
      );

      return;

    }

    if (units.length === 0) {

      alert(
        "Please enter phonemes separated by spaces."
      );

      return;

    }

    setLoading(true);

    try {

      const word =
        await requestJSON<SavedWord>(
          "/api/words",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              text: englishWord.trim(),
              phonemes: units,
              hint: hint.trim(),
            }),
          }
        );

      await refreshDatabase();

      setSelectedWordId(
        String(word.id)
      );

      setDatabaseMessage(
        `Word "${word.text}" saved successfully.`
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to save word."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // UPDATE WORD
  // ---------------------------------------------

  async function updateWord() {

    if (!selectedWordId) {

      alert(
        "Please select a saved word first."
      );

      return;

    }

    const units =
      wordPhonemes.trim().split(/\s+/).filter(Boolean);

    if (
      !englishWord.trim() ||
      units.length === 0
    ) {

      alert(
        "Please enter a word and its phonemes."
      );

      return;

    }

    setLoading(true);

    try {

      await requestJSON(
        `/api/words/${selectedWordId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            text: englishWord.trim(),
            phonemes: units,
            hint: hint.trim(),
          }),
        }
      );

      await refreshDatabase();

      setSelectedActivityId("");

      setDatabaseMessage(
        "Word updated successfully."
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to update word."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // DELETE WORD
  // ---------------------------------------------

  async function deleteWord() {

    if (!selectedWordId) {

      alert(
        "Please select a saved word first."
      );

      return;

    }

    if (
      !window.confirm(
        "Delete this saved word?"
      )
    ) {
      return;
    }

    setLoading(true);

    try {

      await requestJSON(
        `/api/words/${selectedWordId}`,
        {
          method: "DELETE",
        }
      );

      setSelectedWordId("");

      setEnglishWord("");

      setWordPhonemes("");

      setHint("");

      setSelectedActivityId("");

      await refreshDatabase();

      setDatabaseMessage(
        "Word deleted successfully."
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete word."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // CREATE WORD LIST
  // ---------------------------------------------

  async function createWordList() {

    if (!newListName.trim()) {

      alert(
        "Please enter a word list name."
      );

      return;

    }

    setLoading(true);

    try {

      const list =
        await requestJSON<SavedWordList>(
          "/api/word-lists",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: newListName.trim(),
              description:
                "Phoneme Word Search word list",
              wordIds: selectedWordId
                ? [Number(selectedWordId)]
                : [],
            }),
          }
        );

      await refreshDatabase();

      setSelectedWordListId(
        String(list.id)
      );

      setNewListName("");

      setSelectedActivityId("");

      setDatabaseMessage(
        "Word list created successfully."
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to create word list."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // LOAD WORD LIST
  // ---------------------------------------------

  function applyWordList(
    list: SavedWordList
  ) {

    const lines = list.words.map(
      (item) =>
        parsePhonemes(
          item.word.phonemes
        ).join(" ")
    ).filter(Boolean);

    setPhonemeWords(
      lines.join("\n")
    );

    setGrid([]);

    setSolutions([]);

  }

  function selectWordList(id: string) {

    setSelectedWordListId(id);

    setSelectedActivityId("");

    if (!id) return;

    const list = wordLists.find(
      (item) => item.id === Number(id)
    );

    if (!list) {

      setDatabaseMessage(
        "Selected word list not found."
      );

      return;

    }

    applyWordList(list);

    setDatabaseMessage(
      `Loaded "${list.name}" from the database.`
    );

  }

  // ---------------------------------------------
  // ADD WORD TO WORD LIST
  // ---------------------------------------------

  async function addWordToList() {

    if (
      !selectedWordId ||
      !selectedWordListId
    ) {

      alert(
        "Please select a saved word and word list."
      );

      return;

    }

    setLoading(true);

    try {

      const list =
        await requestJSON<SavedWordList>(
          `/api/word-lists/${selectedWordListId}`
        );

      const wordIds =
        list.words.map(
          (item) => item.wordId
        );

      const wordId =
        Number(selectedWordId);

      if (wordIds.includes(wordId)) {

        setDatabaseMessage(
          "This word is already in the selected list."
        );

        return;

      }

      wordIds.push(wordId);

      const updatedList =
        await requestJSON<SavedWordList>(
          `/api/word-lists/${selectedWordListId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              wordIds,
            }),
          }
        );

      await refreshDatabase();

      applyWordList(updatedList);

      setDatabaseMessage(
        "Word added to the word list."
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to update word list."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // REMOVE WORD FROM WORD LIST
  // ---------------------------------------------

  async function removeWordFromList() {

    if (
      !selectedWordId ||
      !selectedWordListId
    ) {

      alert(
        "Select a saved word and word list first."
      );

      return;

    }

    setLoading(true);

    try {

      const list =
        await requestJSON<SavedWordList>(
          `/api/word-lists/${selectedWordListId}`
        );

      const wordIds =
        list.words
          .map((item) => item.wordId)
          .filter(
            (id) =>
              id !== Number(selectedWordId)
          );

      const updatedList =
        await requestJSON<SavedWordList>(
          `/api/word-lists/${selectedWordListId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              wordIds,
            }),
          }
        );

      await refreshDatabase();

      applyWordList(updatedList);

      setSelectedActivityId("");

      setDatabaseMessage(
        "Word removed from the word list."
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to remove word."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // DELETE WORD LIST
  // ---------------------------------------------

  async function deleteWordList() {

    if (!selectedWordListId) {

      alert(
        "Please select a word list first."
      );

      return;

    }

    if (
      !window.confirm(
        "Delete this word list?"
      )
    ) {
      return;
    }

    setLoading(true);

    try {

      await requestJSON(
        `/api/word-lists/${selectedWordListId}`,
        {
          method: "DELETE",
        }
      );

      setSelectedWordListId("");

      setSelectedActivityId("");

      setPhonemeWords("");

      setGrid([]);

      setSolutions([]);

      await refreshDatabase();

      setDatabaseMessage(
        "Word list deleted successfully."
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete word list."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // SAVE WORD SEARCH ACTIVITY
  // ---------------------------------------------

  async function saveActivity() {

    if (!activityName.trim()) {

      alert(
        "Please enter an activity name."
      );

      return;

    }

    if (!selectedWordListId) {

      alert(
        "Please select a saved word list."
      );

      return;

    }

    if (
      !Number.isSafeInteger(rows) ||
      !Number.isSafeInteger(columns) ||
      rows < 5 ||
      rows > 20 ||
      columns < 5 ||
      columns > 20
    ) {

      alert(
        "Rows and columns must be between 5 and 20."
      );

      return;

    }

    setLoading(true);

    try {

      const activity =
        await requestJSON<SavedActivity>(
          "/api/activities",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: activityName.trim(),
              type: "WORD_SEARCH",
              difficulty,
              showHints: false,
              maxGuesses: 6,
              gridRows: rows,
              gridColumns: columns,
              wordListId:
                Number(selectedWordListId),
            }),
          }
        );

      await refreshDatabase();

      setSelectedActivityId(
        String(activity.id)
      );

      setDatabaseMessage(
        `Activity "${activity.name}" saved successfully.`
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to save activity."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // LOAD SAVED ACTIVITY
  // ---------------------------------------------

  async function loadActivity(id: string) {

    setSelectedActivityId(id);

    if (!id) return;

    setLoading(true);

    try {

      const activity =
        await requestJSON<SavedActivity>(
          `/api/activities/${id}`
        );

      if (
        activity.type !== "WORD_SEARCH"
      ) {

        throw new Error(
          "This is not a Word Search activity."
        );

      }

      setActivityName(
        activity.name
      );

      setDifficulty(
        activity.difficulty
      );

      setRows(
        activity.gridRows
      );

      setColumns(
        activity.gridColumns
      );

      setSelectedWordListId(
        String(activity.wordListId)
      );

      applyWordList(
        activity.wordList
      );

      setDatabaseMessage(
        `Activity "${activity.name}" loaded successfully.`
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to load activity."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // UPDATE SAVED ACTIVITY
  // ---------------------------------------------

  async function updateActivity() {

    if (!selectedActivityId) {

      alert(
        "Please load a saved activity first."
      );

      return;

    }

    if (
      !activityName.trim() ||
      !selectedWordListId
    ) {

      alert(
        "Please enter an activity name and select a word list."
      );

      return;

    }

    setLoading(true);

    try {

      await requestJSON(
        `/api/activities/${selectedActivityId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: activityName.trim(),
            type: "WORD_SEARCH",
            difficulty,
            gridRows: rows,
            gridColumns: columns,
            wordListId:
              Number(selectedWordListId),
          }),
        }
      );

      await refreshDatabase();

      setDatabaseMessage(
        "Activity updated successfully."
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to update activity."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // DELETE SAVED ACTIVITY
  // ---------------------------------------------

  async function deleteActivity() {

    if (!selectedActivityId) {

      alert(
        "Please load a saved activity first."
      );

      return;

    }

    if (
      !window.confirm(
        "Delete this activity?"
      )
    ) {
      return;
    }

    setLoading(true);

    try {

      await requestJSON(
        `/api/activities/${selectedActivityId}`,
        {
          method: "DELETE",
        }
      );

      setSelectedActivityId("");

      setActivityName("");

      await refreshDatabase();

      setDatabaseMessage(
        "Activity deleted successfully."
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete activity."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // ORIGINAL PUZZLE GENERATOR
  // ---------------------------------------------

  const words = phonemeWords
    .split("\n")
    .map((word) => word.trim())
    .filter(Boolean);

  function createPuzzle() {

    try {

      const result = buildPuzzle(
        words,
        rows,
        columns,
        difficulty
      );

      setGrid(result.grid);

      setSolutions(result.solutions);

      setDatabaseMessage(
        "Puzzle generated successfully."
      );

    } catch (error) {

      setGrid([]);

      setSolutions([]);

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate puzzle."
      );

    }

  }

  // ---------------------------------------------
  // GENERATE HTML FROM DATABASE
  // ---------------------------------------------

  async function generateHTML() {

    if (!selectedActivityId) {

      alert(
        "Please save or load a Word Search activity first."
      );

      return;

    }

    setLoading(true);

    try {

      // Retrieve the actual stored configuration.

      const activity =
        await requestJSON<SavedActivity>(
          `/api/activities/${selectedActivityId}`
        );

      if (
        activity.type !== "WORD_SEARCH"
      ) {

        throw new Error(
          "The selected activity is not a Word Search activity."
        );

      }

      // Retrieve phonemes from the saved word list.

      const savedPhonemeWords =
        activity.wordList.words.map(
          (item) =>
            parsePhonemes(
              item.word.phonemes
            ).join(" ")
        ).filter(Boolean);

      if (
        savedPhonemeWords.length === 0
      ) {

        throw new Error(
          "This saved activity has no valid words."
        );

      }

      // Generate the puzzle from stored database data.

      const result = buildPuzzle(
        savedPhonemeWords,
        activity.gridRows,
        activity.gridColumns,
        activity.difficulty
      );

      setRows(
        activity.gridRows
      );

      setColumns(
        activity.gridColumns
      );

      setDifficulty(
        activity.difficulty
      );

      setPhonemeWords(
        savedPhonemeWords.join("\n")
      );

      setGrid(
        result.grid
      );

      setSolutions(
        result.solutions
      );

      const htmlContent =
        createWordSearchHTML(
          result.grid,
          result.solutions,
          savedPhonemeWords,
          activity.difficulty
        );

      downloadHTML(
        htmlContent,
        `phoneme-word-search-${activity.id}.html`
      );

      setDatabaseMessage(
        "Word Search HTML generated successfully using saved database data."
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate Word Search HTML."
      );

    } finally {

      setLoading(false);

    }

  }

  // ---------------------------------------------
  // INTERFACE
  // ---------------------------------------------

  const buttonStyle = {
    padding: "8px 12px",
    margin: "4px",
    cursor: "pointer",
  };

  return (

    <main
      style={{
        padding: "30px",
        minHeight: "100vh",
      }}
    >

      <h1>
        Phoneme Word Search Builder
      </h1>

      <p>
        Create a phoneme-based Word Search
        activity for Speech Pathology students.
      </p>

      {/* DATABASE WORD MANAGEMENT */}

      <section style={{ marginTop: "30px" }}>

        <h2>Activity Settings</h2>

        <div
          style={{
            marginTop: "20px",
            marginBottom: "25px",
            padding: "15px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
          }}
        >

          <h3>Saved Words</h3>

          <label htmlFor="savedWord">
            Load a Saved Word:
          </label>

          <br />

          <select
            id="savedWord"
            value={selectedWordId}
            onChange={(e) =>
              selectSavedWord(e.target.value)
            }
          >

            <option value="">
              Select a saved word
            </option>

            {savedWords.map((word) => (

              <option
                key={word.id}
                value={word.id}
              >
                {word.text}
              </option>

            ))}

          </select>

          <br />
          <br />

          <label htmlFor="englishWord">
            English Word:
          </label>

          <br />

          <input
            id="englishWord"
            value={englishWord}
            onChange={(e) =>
              setEnglishWord(e.target.value)
            }
            placeholder="e.g. cat"
          />

          <br />
          <br />

          <label htmlFor="wordPhonemes">
            Phonemes:
          </label>

          <br />

          <input
            id="wordPhonemes"
            value={wordPhonemes}
            onChange={(e) =>
              setWordPhonemes(e.target.value)
            }
            placeholder="e.g. k æ t"
          />

          <br />
          <br />

          <label htmlFor="hint">
            Hint:
          </label>

          <br />

          <input
            id="hint"
            value={hint}
            onChange={(e) =>
              setHint(e.target.value)
            }
            placeholder="Optional word hint"
            maxLength={500}
          />

          <br />
          <br />

          <button
            type="button"
            style={buttonStyle}
            onClick={() => void saveWord()}
            disabled={loading}
          >
            Save New Word
          </button>

          <button
            type="button"
            style={buttonStyle}
            onClick={() => void updateWord()}
            disabled={
              loading || !selectedWordId
            }
          >
            Update Word
          </button>

          <button
            type="button"
            style={buttonStyle}
            onClick={() => void deleteWord()}
            disabled={
              loading || !selectedWordId
            }
          >
            Delete Word
          </button>

          <button
            type="button"
            style={buttonStyle}
            onClick={() => void refreshDatabase()}
            disabled={loading}
          >
            Refresh Database
          </button>

        </div>

        {/* WORD LIST MANAGEMENT */}

        <div
          style={{
            marginTop: "20px",
            marginBottom: "25px",
            padding: "15px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
          }}
        >

          <h3>Saved Word Lists</h3>

          <label htmlFor="wordList">
            Select Word List:
          </label>

          <br />

          <select
            id="wordList"
            value={selectedWordListId}
            onChange={(e) =>
              selectWordList(e.target.value)
            }
          >

            <option value="">
              Select a word list
            </option>

            {wordLists.map((list) => (

              <option
                key={list.id}
                value={list.id}
              >
                {list.name}
              </option>

            ))}

          </select>

          <br />
          <br />

          <label htmlFor="newListName">
            New Word List Name:
          </label>

          <br />

          <input
            id="newListName"
            value={newListName}
            onChange={(e) =>
              setNewListName(e.target.value)
            }
            placeholder="e.g. Animal Words"
          />

          <br />
          <br />

          <button
            type="button"
            style={buttonStyle}
            onClick={() => void createWordList()}
            disabled={loading}
          >
            Create Word List
          </button>

          <button
            type="button"
            style={buttonStyle}
            onClick={() => void addWordToList()}
            disabled={
              loading ||
              !selectedWordId ||
              !selectedWordListId
            }
          >
            Add Word to List
          </button>

          <button
            type="button"
            style={buttonStyle}
            onClick={() => void removeWordFromList()}
            disabled={
              loading ||
              !selectedWordId ||
              !selectedWordListId
            }
          >
            Remove Word from List
          </button>

          <button
            type="button"
            style={buttonStyle}
            onClick={() => void deleteWordList()}
            disabled={
              loading ||
              !selectedWordListId
            }
          >
            Delete Word List
          </button>

        </div>

        {/* ORIGINAL WORD SEARCH SETTINGS */}

        <label htmlFor="phonemeWords">
          Phoneme Words:
        </label>

        <br />

        <textarea
          id="phonemeWords"
          rows={8}
          value={phonemeWords}
          onChange={(e) => {
            setPhonemeWords(e.target.value);
            setGrid([]);
            setSolutions([]);
          }}
          style={{
            width: "320px",
            maxWidth: "100%",
            padding: "10px",
          }}
        />

        <br />
        <br />

        <label htmlFor="rows">
          Rows:
        </label>

        <br />

        <input
          id="rows"
          type="number"
          min="5"
          max="20"
          value={rows}
          onChange={(e) => {
            setRows(Number(e.target.value));
            setGrid([]);
            setSolutions([]);
          }}
        />

        <br />
        <br />

        <label htmlFor="columns">
          Columns:
        </label>

        <br />

        <input
          id="columns"
          type="number"
          min="5"
          max="20"
          value={columns}
          onChange={(e) => {
            setColumns(Number(e.target.value));
            setGrid([]);
            setSolutions([]);
          }}
        />

        <br />
        <br />

        <label htmlFor="difficulty">
          Difficulty:
        </label>

        <br />

        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setGrid([]);
            setSolutions([]);
          }}
        >

          <option value="Easy">
            Easy
          </option>

          <option value="Medium">
            Medium
          </option>

          <option value="Hard">
            Hard
          </option>

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

      {/* SAVED ACTIVITY MANAGEMENT */}

      <section
        style={{
          marginTop: "30px",
          padding: "15px",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
        }}
      >

        <h2>
          Saved Word Search Activities
        </h2>

        <label htmlFor="savedActivity">
          Load a Saved Activity:
        </label>

        <br />

        <select
          id="savedActivity"
          value={selectedActivityId}
          onChange={(e) =>
            void loadActivity(e.target.value)
          }
        >

          <option value="">
            Select a saved activity
          </option>

          {savedActivities.map((activity) => (

            <option
              key={activity.id}
              value={activity.id}
            >
              {activity.name}
            </option>

          ))}

        </select>

        <br />
        <br />

        <label htmlFor="activityName">
          Activity Name:
        </label>

        <br />

        <input
          id="activityName"
          value={activityName}
          onChange={(e) =>
            setActivityName(e.target.value)
          }
          placeholder="e.g. Animal Word Search"
        />

        <br />
        <br />

        <button
          type="button"
          style={buttonStyle}
          onClick={() => void saveActivity()}
          disabled={loading}
        >
          Save New Activity
        </button>

        <button
          type="button"
          style={buttonStyle}
          onClick={() => void updateActivity()}
          disabled={
            loading || !selectedActivityId
          }
        >
          Update Activity
        </button>

        <button
          type="button"
          style={buttonStyle}
          onClick={() => void deleteActivity()}
          disabled={
            loading || !selectedActivityId
          }
        >
          Delete Activity
        </button>

      </section>

      {/* DATABASE MESSAGE */}

      {databaseMessage && (

        <p
          role="status"
          style={{
            marginTop: "20px",
            padding: "12px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
          }}
        >
          {databaseMessage}
        </p>

      )}

      {/* ORIGINAL PUZZLE PREVIEW */}

      <section
        style={{
          marginTop: "40px",
        }}
      >

        <h2>Preview</h2>

        <p>
          Grid Size:{" "}
          <strong>
            {rows} × {columns}
          </strong>
        </p>

        <p>
          Difficulty:{" "}
          <strong>
            {difficulty}
          </strong>
        </p>

        <h3>Word List</h3>

        <ul>
          {words.map((word, index) => (
            <li key={index}>
              {word}
            </li>
          ))}
        </ul>

        {grid.length === 0 ? (

          <p>
            Click Generate Puzzle to create the preview.
          </p>

        ) : (

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                `repeat(${columns}, 42px)`,
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

      {/* DATABASE-DRIVEN HTML DOWNLOAD */}

      <button
        type="button"
        onClick={() => void generateHTML()}
        disabled={
          loading || !selectedActivityId
        }
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

        {loading
          ? "Please wait..."
          : "Generate HTML from Saved Activity"}

      </button>

    </main>

  );

}