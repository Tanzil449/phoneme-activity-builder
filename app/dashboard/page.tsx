"use client";

import { useEffect, useState } from "react";

type UsageEvent = {
  id: number;
  eventType: string;
  activityType: string | null;
  success: boolean | null;
  durationMs: number | null;
  details: string | null;
  createdAt: string;
};

type ReportData = {
  status: string;
  totalWords: number;
  totalWordLists: number;
  totalActivities: number;
  totalWordle: number;
  totalWordSearch: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageGenerationTimeMs: number;
  mostUsedActivityType: string | null;
  recentEvents: UsageEvent[];
};

export default function DashboardPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/reports", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  function formatActivityType(type: string | null) {
    if (!type) return "Unknown";

    if (type === "WORD_SEARCH") {
      return "Word Search";
    }

    if (type === "WORDLE") {
      return "Wordle";
    }

    return type;
  }

  function formatDuration(durationMs: number | null) {
    if (durationMs === null) {
      return "N/A";
    }

    if (durationMs < 1000) {
      return `${durationMs} ms`;
    }

    return `${(durationMs / 1000).toFixed(2)} s`;
  }

  if (loading) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Assessment 3 Dashboard</h1>
        <p>Loading dashboard data...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Assessment 3 Dashboard</h1>

        <p style={{ color: "red" }}>
          {error || "No dashboard data available."}
        </p>

        <button onClick={loadReports}>
          Try Again
        </button>
      </main>
    );
  }

  const cards = [
    {
      title: "System Health",
      value:
        data.status === "OK"
          ? "Healthy"
          : "Problem",
    },
    {
      title: "Total Words",
      value: data.totalWords,
    },
    {
      title: "Word Lists",
      value: data.totalWordLists,
    },
    {
      title: "Total Activities",
      value: data.totalActivities,
    },
    {
      title: "Wordle Activities",
      value: data.totalWordle,
    },
    {
      title: "Word Search Activities",
      value: data.totalWordSearch,
    },
    {
      title: "Successful Generations",
      value: data.successfulGenerations,
    },
    {
      title: "Failed Generations",
      value: data.failedGenerations,
    },
    {
      title: "Average Generation Time",
      value: formatDuration(
        data.averageGenerationTimeMs
      ),
    },
    {
      title: "Most Used Activity",
      value: formatActivityType(
        data.mostUsedActivityType
      ),
    },
  ];

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              marginBottom: "0.5rem",
            }}
          >
            Assessment 3 Dashboard
          </h1>

          <p style={{ margin: 0 }}>
            Live operational statistics for the
            Phoneme Activity Builder.
          </p>
        </div>

        <button
          onClick={loadReports}
          style={{
            padding: "0.75rem 1rem",
            cursor: "pointer",
          }}
        >
          Refresh Dashboard
        </button>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {cards.map((card) => (
          <article
            key={card.title}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              padding: "1.25rem",
              background: "white",
              boxShadow:
                "0 2px 8px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                marginTop: 0,
                marginBottom: "0.75rem",
              }}
            >
              {card.title}
            </h2>

            <p
              style={{
                fontSize: "1.7rem",
                fontWeight: 700,
                margin: 0,
              }}
            >
              {card.value}
            </p>
          </article>
        ))}
      </section>

      <section
        style={{
          marginTop: "2rem",
          padding: "1.25rem",
          border: "1px solid #d1d5db",
          borderRadius: "12px",
          background: "white",
        }}
      >
        <h2>Operational Status</h2>

        {data.status === "OK" ? (
          <p
            style={{
              color: "green",
              fontWeight: 600,
            }}
          >
            Backend status is healthy.
          </p>
        ) : (
          <p
            style={{
              color: "red",
              fontWeight: 600,
            }}
          >
            Warning: Backend health problem detected.
          </p>
        )}

        {data.failedGenerations > 0 ? (
          <p
            style={{
              color: "red",
              fontWeight: 600,
            }}
          >
            Warning: Some activity generations
            have failed.
          </p>
        ) : (
          <p
            style={{
              color: "green",
              fontWeight: 600,
            }}
          >
            No generation failures have been recorded.
          </p>
        )}

        {data.totalWordLists === 0 && (
          <p
            style={{
              color: "darkorange",
              fontWeight: 600,
            }}
          >
            Warning: No word lists are currently stored.
          </p>
        )}

        {data.totalActivities === 0 && (
          <p
            style={{
              color: "darkorange",
              fontWeight: 600,
            }}
          >
            Warning: No activities are currently stored.
          </p>
        )}
      </section>

      <section
        style={{
          marginTop: "2rem",
          padding: "1.25rem",
          border: "1px solid #d1d5db",
          borderRadius: "12px",
          background: "white",
        }}
      >
        <h2>Recent Activity</h2>

        {data.recentEvents.length === 0 ? (
          <p>No usage events have been recorded yet.</p>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "1rem",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      borderBottom:
                        "2px solid #d1d5db",
                    }}
                  >
                    Activity
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      borderBottom:
                        "2px solid #d1d5db",
                    }}
                  >
                    Result
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      borderBottom:
                        "2px solid #d1d5db",
                    }}
                  >
                    Duration
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      borderBottom:
                        "2px solid #d1d5db",
                    }}
                  >
                    Details
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td
                      style={{
                        padding: "10px",
                        borderBottom:
                          "1px solid #e5e7eb",
                      }}
                    >
                      {formatActivityType(
                        event.activityType
                      )}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        borderBottom:
                          "1px solid #e5e7eb",
                        fontWeight: 600,
                        color:
                          event.success === true
                            ? "green"
                            : event.success === false
                            ? "red"
                            : "inherit",
                      }}
                    >
                      {event.success === true
                        ? "Success"
                        : event.success === false
                        ? "Failed"
                        : "N/A"}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        borderBottom:
                          "1px solid #e5e7eb",
                      }}
                    >
                      {formatDuration(
                        event.durationMs
                      )}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        borderBottom:
                          "1px solid #e5e7eb",
                      }}
                    >
                      {event.details || "No details"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}