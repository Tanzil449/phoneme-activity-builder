
"use client";

import { useEffect, useState } from "react";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type SavedWord = {
  id: number;
  text: string;
  phonemes: string;
  hint: string | null;
};

type SavedWordList = {
  id: number;
  name: string;
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

// --------------------------------------------------
// PHONEME KEYBOARD
// --------------------------------------------------

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

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

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
    // Invalid stored phoneme data.
  }

  return [];
}

function downloadHTML(content: string, filename: string) {
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

function safeJSON(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

// --------------------------------------------------
// DOWNLOADABLE WORDLE GAME
// --------------------------------------------------

function createWordleHTML(
  word: SavedWord,
  activity: SavedActivity
): string {
  const target = parsePhonemes(word.phonemes);

  if (target.length === 0) {
    throw new Error(
      "The selected word has invalid phoneme data."
    );
  }

  const gameData = {
    target,
    maxGuesses: activity.maxGuesses,
    difficulty: activity.difficulty,
    showHints: activity.showHints,
    hint: word.hint || "No hint provided.",
    keyboard: phonemes,
  };

  return `
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

  body {
    padding: 12px;
  }

  .cell {
    width: 38px;
    height: 42px;
    font-size: 14px;
  }

  .key {
    padding: 8px 10px;
    font-size: 14px;
  }

  .row {
    gap: 3px;
  }
}

</style>
</head>

<body>

<div class="game">

<h1>Phoneme Wordle</h1>

<div class="info">

<p>
<strong>Difficulty:</strong>
<span id="difficulty"></span>
</p>

<p>
<strong>Guesses:</strong>
<span id="guesses"></span>
</p>

<p id="hintContainer" hidden>
<strong>Hint:</strong>
<span id="hint"></span>
</p>

</div>

<div id="grid" class="grid"></div>

<div id="keyboard" class="keyboard"></div>

<div class="controls">

<button class="control-button" id="deleteBtn">
Delete
</button>

<button class="control-button" id="submitBtn">
Submit Guess
</button>

</div>

<div id="message" class="message" role="status"></div>

</div>

<script>

const gameData = ${safeJSON(gameData)};

const target = gameData.target;

const maxGuesses = gameData.maxGuesses;

const phonemeKeyboard = gameData.keyboard;

document.getElementById("difficulty").textContent =
  gameData.difficulty;

document.getElementById("guesses").textContent =
  String(maxGuesses);

if (gameData.showHints) {

  document.getElementById("hintContainer").hidden = false;

  document.getElementById("hint").textContent =
    gameData.hint;

}

let currentRow = 0;

let currentGuess = [];

let gameFinished = false;

const grid = document.getElementById("grid");

const keyboard = document.getElementById("keyboard");

const message = document.getElementById("message");

// Create Wordle grid

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

// Create phoneme keyboard

phonemeKeyboard.forEach((phoneme) => {

  const button = document.createElement("button");

  button.className = "key";

  button.textContent = phoneme;

  button.addEventListener("click", function () {

    if (gameFinished) return;

    if (currentGuess.length < target.length) {

      currentGuess.push(phoneme);

      updateCurrentRow();

    }

  });

  keyboard.appendChild(button);

});

// Update current guess row

function updateCurrentRow() {

  for (let c = 0; c < target.length; c++) {

    const cell = document.getElementById(
      "cell-" + currentRow + "-" + c
    );

    cell.textContent = currentGuess[c] || "";

  }

}

// Delete last phoneme

document
  .getElementById("deleteBtn")
  .addEventListener("click", function () {

    if (gameFinished) return;

    if (currentGuess.length > 0) {

      currentGuess.pop();

      updateCurrentRow();

    }

  });

// Submit guess

document
  .getElementById("submitBtn")
  .addEventListener("click", function () {

    if (gameFinished) return;

    if (currentGuess.length !== target.length) {

      message.textContent =
        "Please complete the whole phoneme guess first.";

      return;

    }

    const targetCopy = [...target];

    const result =
      new Array(target.length).fill("absent");

    // Correct phonemes

    currentGuess.forEach((phoneme, index) => {

      if (phoneme === target[index]) {

        result[index] = "correct";

        targetCopy[index] = null;

      }

    });

    // Present phonemes

    currentGuess.forEach((phoneme, index) => {

      if (
        result[index] !== "correct" &&
        targetCopy.includes(phoneme)
      ) {

        result[index] = "present";

        const foundIndex =
          targetCopy.indexOf(phoneme);

        targetCopy[foundIndex] = null;

      }

    });

    // Colour submitted guess

    result.forEach((status, index) => {

      const cell = document.getElementById(
        "cell-" + currentRow + "-" + index
      );

      cell.classList.add(status);

    });

    // Check answer

    const isCorrect = currentGuess.every(
      (phoneme, index) =>
        phoneme === target[index]
    );

    if (isCorrect) {

      message.textContent =
        "Correct! Well done.";

      gameFinished = true;

      return;

    }

    currentRow++;

    currentGuess = [];

    if (currentRow >= maxGuesses) {

      message.textContent =
        "Game over. The correct phonemes were: " +
        target.join(" ");

      gameFinished = true;

    } else {

      message.textContent = "";

    }

  });

</script>

</body>
</html>
`;
}

// --------------------------------------------------
// MAIN WORDLE BUILDER
// --------------------------------------------------

export default function WordlePage() {

  // Existing Wordle settings

  const [englishWord, setEnglishWord] = useState("");

  const [selectedPhonemes, setSelectedPhonemes] =
    useState<string[]>([]);

  const [guesses, setGuesses] = useState(6);

  const [difficulty, setDifficulty] =
    useState("Easy");

  const [showHints, setShowHints] =
    useState(false);

  const [hint, setHint] = useState("");

  // Database words

  const [savedWords, setSavedWords] =
    useState<SavedWord[]>([]);

  const [selectedWordId, setSelectedWordId] =
    useState("");

  // Database word lists

  const [wordLists, setWordLists] =
    useState<SavedWordList[]>([]);

  const [selectedWordListId, setSelectedWordListId] =
    useState("");

  // Database activities

  const [savedActivities, setSavedActivities] =
    useState<SavedActivity[]>([]);

  const [selectedActivityId, setSelectedActivityId] =
    useState("");

  const [activityName, setActivityName] =
    useState("");

  // UI messages

  const [databaseMessage, setDatabaseMessage] =
    useState("");

  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // DATABASE REQUEST HELPER
  // --------------------------------------------------

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

  // --------------------------------------------------
  // LOAD SAVED DATABASE CONTENT
  // --------------------------------------------------

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
        (activity) => activity.type === "WORDLE"
      )
    );

  }

  useEffect(() => {

    let cancelled = false;

    async function loadInitialData() {

      try {

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

        if (cancelled) return;

        setSavedWords(words);

        setWordLists(lists);

        setSavedActivities(
          activities.filter(
            (activity) => activity.type === "WORDLE"
          )
        );

      } catch (error) {

        if (!cancelled) {

          setDatabaseMessage(
            error instanceof Error
              ? error.message
              : "Unable to load database content."
          );

        }

      }

    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };

  }, []);

  // --------------------------------------------------
  // LOAD A SAVED WORD
  // --------------------------------------------------

  function applySavedWord(word: SavedWord) {

    const parsed = parsePhonemes(word.phonemes);

    if (parsed.length === 0) {

      throw new Error(
        "The saved word contains invalid phoneme data."
      );

    }

    setSelectedWordId(String(word.id));

    setEnglishWord(word.text);

    setSelectedPhonemes(parsed);

    setHint(word.hint || "");

  }

  function selectSavedWord(id: string) {

    setSelectedWordId(id);

    setSelectedActivityId("");

    if (!id) return;

    const word = savedWords.find(
      (item) => item.id === Number(id)
    );

    if (!word) {

      setDatabaseMessage("Word not found.");

      return;

    }

    try {

      applySavedWord(word);

      setDatabaseMessage(
        `Loaded "${word.text}" from the database.`
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to load word."
      );

    }

  }

  // --------------------------------------------------
  // SAVE A NEW WORD
  // --------------------------------------------------

  async function saveWord() {

    if (!englishWord.trim()) {

      alert("Please enter an English word.");

      return;

    }

    if (selectedPhonemes.length === 0) {

      alert("Please select at least one phoneme.");

      return;

    }

    setLoading(true);

    try {

      const word = await requestJSON<SavedWord>(
        "/api/words",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            text: englishWord.trim(),
            phonemes: selectedPhonemes,
            hint: hint.trim(),
          }),
        }
      );

      await refreshDatabase();

      setSelectedWordId(String(word.id));

      setSelectedActivityId("");

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

  // --------------------------------------------------
  // EDIT AN EXISTING WORD
  // --------------------------------------------------

  async function updateWord() {

    if (!selectedWordId) {

      alert("Please select a saved word first.");

      return;

    }

    if (!englishWord.trim()) {

      alert("Please enter an English word.");

      return;

    }

    if (selectedPhonemes.length === 0) {

      alert("Please select at least one phoneme.");

      return;

    }

    setLoading(true);

    try {

      await requestJSON<SavedWord>(
        `/api/words/${selectedWordId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            text: englishWord.trim(),
            phonemes: selectedPhonemes,
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

  // --------------------------------------------------
  // DELETE A SAVED WORD
  // --------------------------------------------------

  async function deleteWord() {

    if (!selectedWordId) {

      alert("Please select a saved word first.");

      return;

    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this word?"
    );

    if (!confirmed) return;

    setLoading(true);

    try {

      await requestJSON<{ message: string }>(
        `/api/words/${selectedWordId}`,
        {
          method: "DELETE",
        }
      );

      setSelectedWordId("");

      setSelectedActivityId("");

      setEnglishWord("");

      setSelectedPhonemes([]);

      setHint("");

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

  // --------------------------------------------------
  // PHONEME KEYBOARD
  // --------------------------------------------------

  function addPhoneme(phoneme: string) {

    setSelectedPhonemes((previous) => [
      ...previous,
      phoneme,
    ]);

  }

  function removeLastPhoneme() {

    setSelectedPhonemes((previous) =>
      previous.slice(0, -1)
    );

  }

  function clearPhonemes() {

    setSelectedPhonemes([]);

  }

  // --------------------------------------------------
  // ADD A WORD TO AN EXISTING WORD LIST
  // --------------------------------------------------

  async function addWordToList() {

    if (!selectedWordListId || !selectedWordId) {

      alert(
        "Please select a saved word and a word list."
      );

      return;

    }

    setLoading(true);

    try {

      const list = await requestJSON<SavedWordList>(
        `/api/word-lists/${selectedWordListId}`
      );

      const wordIds = list.words.map(
        (item) => item.wordId
      );

      const wordId = Number(selectedWordId);

      if (wordIds.includes(wordId)) {

        setDatabaseMessage(
          "This word is already in the selected list."
        );

        return;

      }

      wordIds.push(wordId);

      await requestJSON(
        `/api/word-lists/${selectedWordListId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            wordIds,
          }),
        }
      );

      await refreshDatabase();

      setSelectedActivityId("");

      setDatabaseMessage(
        "Word added to the selected word list."
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

  // --------------------------------------------------
  // SAVE A WORDLE ACTIVITY
  // --------------------------------------------------

  async function saveActivity() {

    if (!activityName.trim()) {

      alert("Please enter an activity name.");

      return;

    }

    if (!selectedWordListId) {

      alert("Please select a saved word list.");

      return;

    }

    if (!selectedWordId) {

      alert("Please select and save a word first.");

      return;

    }

    const list = wordLists.find(
      (item) => item.id === Number(selectedWordListId)
    );

    if (
      !list ||
      !list.words.some(
        (item) => item.wordId === Number(selectedWordId)
      )
    ) {

      alert(
        "The selected word must belong to the selected word list. Click Add Word to List first."
      );

      return;

    }

    if (
      !Number.isSafeInteger(guesses) ||
      guesses < 1 ||
      guesses > 10
    ) {

      alert("Number of guesses must be between 1 and 10.");

      return;

    }

    setLoading(true);

    try {

      const activity = await requestJSON<SavedActivity>(
        "/api/activities",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: activityName.trim(),
            type: "WORDLE",
            difficulty,
            showHints,
            maxGuesses: guesses,
            gridRows: 10,
            gridColumns: 10,
            wordListId: Number(selectedWordListId),
          }),
        }
      );

      await refreshDatabase();

      setSelectedActivityId(String(activity.id));

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

  // --------------------------------------------------
  // LOAD A SAVED WORDLE ACTIVITY
  // --------------------------------------------------

  async function loadActivity(id: string) {

    setSelectedActivityId(id);

    if (!id) return;

    setLoading(true);

    try {

      const activity = await requestJSON<SavedActivity>(
        `/api/activities/${id}`
      );

      if (activity.type !== "WORDLE") {

        throw new Error(
          "The selected activity is not a Wordle activity."
        );

      }

      setActivityName(activity.name);

      setDifficulty(activity.difficulty);

      setShowHints(activity.showHints);

      setGuesses(activity.maxGuesses);

      setSelectedWordListId(
        String(activity.wordListId)
      );

      const words = activity.wordList.words;

      if (words.length > 0) {

        applySavedWord(words[0].word);

      } else {

        setSelectedWordId("");

        setEnglishWord("");

        setSelectedPhonemes([]);

        setHint("");

      }

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

  // --------------------------------------------------
  // UPDATE A SAVED ACTIVITY
  // --------------------------------------------------

  async function updateActivity() {

    if (!selectedActivityId) {

      alert("Please load a saved activity first.");

      return;

    }

    if (!selectedWordListId || !activityName.trim()) {

      alert(
        "Please provide an activity name and word list."
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
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: activityName.trim(),
            type: "WORDLE",
            difficulty,
            showHints,
            maxGuesses: guesses,
            wordListId: Number(selectedWordListId),
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

  // --------------------------------------------------
  // DELETE A SAVED ACTIVITY
  // --------------------------------------------------

  async function deleteActivity() {

    if (!selectedActivityId) {

      alert("Please load a saved activity first.");

      return;

    }

    if (
      !window.confirm(
        "Are you sure you want to delete this activity?"
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

  // --------------------------------------------------
  // GENERATE WORDLE FROM STORED DATABASE DATA
  // --------------------------------------------------

  async function generateHTML() {

    if (!selectedActivityId) {

      alert(
        "Please save or load a Wordle activity before generating HTML."
      );

      return;

    }

    setLoading(true);

    try {

      // Retrieve the latest saved activity configuration.

      const activity = await requestJSON<SavedActivity>(
        `/api/activities/${selectedActivityId}`
      );

      if (activity.type !== "WORDLE") {

        throw new Error(
          "The selected activity is not a Wordle activity."
        );

      }

      const storedWords = activity.wordList.words;

      if (storedWords.length === 0) {

        throw new Error(
          "This activity does not contain any saved words."
        );

      }

      // Use the selected saved word when it belongs
      // to the activity's saved word list.
      // Otherwise, use the first saved word in the list.

      const selectedWord = storedWords.find(
        (item) =>
          item.wordId === Number(selectedWordId)
      );

      const wordRecord =
        selectedWord?.word || storedWords[0].word;

      // Generate HTML from the actual database records.

      const htmlContent = createWordleHTML(
        wordRecord,
        activity
      );

      downloadHTML(
        htmlContent,
        `phoneme-wordle-${activity.id}.html`
      );

      setDatabaseMessage(
        "Wordle HTML generated successfully using saved database data."
      );

    } catch (error) {

      setDatabaseMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate Wordle HTML."
      );

    } finally {

      setLoading(false);

    }

  }

  // --------------------------------------------------
  // INTERFACE
  // --------------------------------------------------

  return (

    <main
      style={{
        padding: "30px",
        minHeight: "100vh",
      }}
    >

      <h1>Phoneme Wordle Builder</h1>

      <p>
        Create a Wordle-style classroom activity
        using phoneme-based words.
      </p>

      {/* DATABASE WORD MANAGEMENT */}

      <section style={{ marginTop: "30px" }}>

        <h2>Activity Settings</h2>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            marginBottom: "25px",
          }}
        >

          <h3>Load a Saved Word</h3>

          <label htmlFor="savedWord">
            Select a word from the database:
          </label>

          <br />

          <select
            id="savedWord"
            value={selectedWordId}
            onChange={(e) =>
              selectSavedWord(e.target.value)
            }
            style={{
              padding: "10px",
              marginTop: "10px",
              minWidth: "200px",
            }}
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

          {" "}

          <button
            type="button"
            disabled={loading}
            onClick={() => void refreshDatabase()}
          >
            Refresh Words
          </button>

          <br />
          <br />

          <label htmlFor="englishWord">
            English Word:
          </label>

          <br />

          <input
            id="englishWord"
            type="text"
            value={englishWord}
            onChange={(e) =>
              setEnglishWord(e.target.value)
            }
            placeholder="e.g. bed"
          />

          <br />
          <br />

          <label htmlFor="hint">
            Word Hint:
          </label>

          <br />

          <input
            id="hint"
            type="text"
            value={hint}
            onChange={(e) =>
              setHint(e.target.value)
            }
            placeholder="Enter an optional hint"
            maxLength={500}
          />

          <br />
          <br />

          <button
            type="button"
            onClick={() => void saveWord()}
            disabled={loading}
          >
            Save New Word
          </button>

          {" "}

          <button
            type="button"
            onClick={() => void updateWord()}
            disabled={loading || !selectedWordId}
          >
            Update Word
          </button>

          {" "}

          <button
            type="button"
            onClick={() => void deleteWord()}
            disabled={loading || !selectedWordId}
          >
            Delete Word
          </button>

        </div>

        {/* PHONEME KEYBOARD */}

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

        <button
          type="button"
          onClick={removeLastPhoneme}
        >
          Delete Last
        </button>

        {" "}

        <button
          type="button"
          onClick={clearPhonemes}
        >
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
              onClick={() =>
                addPhoneme(phoneme)
              }
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

        {/* NUMBER OF GUESSES */}

        <label htmlFor="guesses">
          Number of Guesses:
        </label>

        <br />

        <input
          id="guesses"
          type="number"
          min="1"
          max="10"
          value={guesses}
          onChange={(e) =>
            setGuesses(Number(e.target.value))
          }
        />

        <br />
        <br />

        {/* DIFFICULTY */}

        <label htmlFor="difficulty">
          Difficulty:
        </label>

        <br />

        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value)
          }
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

        {/* HINT SETTINGS */}

        <label>

          <input
            type="checkbox"
            checked={showHints}
            onChange={(e) =>
              setShowHints(e.target.checked)
            }
          />

          {" "}Show hints

        </label>

      </section>

      {/* WORD LIST MANAGEMENT */}

      <section
        style={{
          marginTop: "30px",
          padding: "15px",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
        }}
      >

        <h2>Saved Word Lists</h2>

        <label htmlFor="wordList">
          Select Word List:
        </label>

        <br />

        <select
          id="wordList"
          value={selectedWordListId}
          onChange={(e) => {
            setSelectedWordListId(e.target.value);
            setSelectedActivityId("");
          }}
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

        <button
          type="button"
          onClick={() => void addWordToList()}
          disabled={
            loading ||
            !selectedWordId ||
            !selectedWordListId
          }
        >
          Add Word to List
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

        <h2>Saved Wordle Activities</h2>

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
            Select an activity
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
          type="text"
          value={activityName}
          onChange={(e) =>
            setActivityName(e.target.value)
          }
          placeholder="e.g. Animal Wordle"
        />

        <br />
        <br />

        <button
          type="button"
          onClick={() => void saveActivity()}
          disabled={loading}
        >
          Save New Activity
        </button>

        {" "}

        <button
          type="button"
          onClick={() => void updateActivity()}
          disabled={loading || !selectedActivityId}
        >
          Update Activity
        </button>

        {" "}

        <button
          type="button"
          onClick={() => void deleteActivity()}
          disabled={loading || !selectedActivityId}
        >
          Delete Activity
        </button>

      </section>

      {/* DATABASE MESSAGES */}

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

      {/* ORIGINAL WORDLE PREVIEW */}

      <section style={{ marginTop: "40px" }}>

        <h2>Preview</h2>

        <p>
          English Word:{" "}
          <strong>
            {englishWord || "Not entered"}
          </strong>
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
          Difficulty:{" "}
          <strong>{difficulty}</strong>
        </p>

        <p>
          Hints:{" "}
          <strong>
            {showHints ? "On" : "Off"}
          </strong>
        </p>

        <div style={{ marginTop: "20px" }}>

          {Array.from({
            length: Math.max(
              0,
              Math.min(10, guesses || 0)
            ),
          }).map((_, rowIndex) => (

            <div
              key={rowIndex}
              style={{
                display: "flex",
                gap: "5px",
                marginBottom: "5px",
              }}
            >

              {Array.from({
                length:
                  selectedPhonemes.length || 3,
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

      {/* DATABASE-DRIVEN HTML GENERATION */}

      <button
        type="button"
        onClick={() => void generateHTML()}
        disabled={loading || !selectedActivityId}
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