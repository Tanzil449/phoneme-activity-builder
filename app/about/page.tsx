export default function AboutPage() {
  return (
    <main>
      <h1>About Phoneme Activity Builder</h1>

      <section>
        <h2>Project Overview</h2>
        <p>
          Phoneme Activity Builder is a web application designed for Speech
          Pathology teachers to create phoneme-based classroom activities.
          The application allows teachers to prepare Wordle-style and Word
          Search activities using phonemes rather than standard spelling.
        </p>
      </section>

      <section>
        <h2>Assessment 1 Scope</h2>
        <p>
          Assessment 1 focuses on frontend design, usability, accessibility,
          responsive layout, and generating standalone phoneme-based
          activities. This stage does not require a database or dynamic
          word-list management.
        </p>
      </section>

      <section>
        <h2>Phoneme Wordle</h2>
        <p>
          The Phoneme Wordle tool allows teachers to configure a Wordle-style
          activity using phonemes, preview the game, and generate a standalone
          HTML file for classroom use.
        </p>
      </section>

      <section>
        <h2>Phoneme Word Search</h2>
        <p>
          The Phoneme Word Search tool allows teachers to enter phoneme-based
          words, configure the puzzle grid and difficulty, preview the puzzle,
          and generate a standalone HTML file.
        </p>
      </section>

      <section>
        <h2>Student Information</h2>
        <p>Name: Md Tanzil Ul Alam</p>
        <p>Student Number: 21373248</p>
      </section>

      <section>
        <h2>How to Use This Website</h2>
        <p>
          The demonstration video below explains how to navigate the builder,
          configure the activities, preview them, and generate the final HTML
          files.
        </p>

        <video
          controls
          style={{
            width: "100%",
            maxWidth: "700px",
            marginTop: "15px",
            borderRadius: "10px",
          }}
        >
          <source src="/demo.mp4" type="video/mp4" />
          Your browser does not support the video element.
        </video>

        <p style={{ marginTop: "10px" }}>
          The final demonstration video will be added before submission.
        </p>
      </section>
    </main>
  );
}