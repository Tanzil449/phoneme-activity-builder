export default function Home() {
  return (
    <main>
      <section style={{ textAlign: "center" }}>
        <h1>Phoneme Activity Builder</h1>

        <p>
          Create phoneme-based Wordle and Word Search activities for Speech
          Pathology teaching.
        </p>

        <div
          style={{
            display: "flex",
            gap: "15px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "25px",
          }}
        >
          <a
            href="/wordle"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "7px",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Create Phoneme Wordle
          </a>

          <a
            href="/word-search"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "7px",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Create Word Search
          </a>
        </div>
      </section>

      <section>
        <h2>About the Builder</h2>
        <p>
          This application is designed for teachers preparing phoneme-based
          classroom activities for Speech Pathology students.
        </p>
      </section>

      <section>
        <h2>Available Activities</h2>

        <h3>Phoneme Wordle</h3>
        <p>
          Create a Wordle-style activity using phoneme symbols, configure the
          number of guesses and difficulty, preview the activity, and generate
          a standalone HTML file.
        </p>

        <h3>Phoneme Word Search</h3>
        <p>
          Create a phoneme-based Word Search, configure its grid and
          difficulty, preview the puzzle, and download the standalone HTML
          activity.
        </p>
      </section>

      <section>
        <h2>How It Works</h2>

        <ol>
          <li>Choose an activity.</li>
          <li>Configure the phoneme content.</li>
          <li>Preview the activity.</li>
          <li>Generate the HTML file.</li>
          <li>Open the downloaded activity in a web browser.</li>
        </ol>
      </section>
    </main>
  );
}