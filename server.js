const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = path.join(__dirname, "results.json");

function loadResults() {
  if (!fs.existsSync(DATA_FILE)) return [];

  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveResults(results) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(results, null, 2));
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.post("/api/submit", (req, res) => {
  const {
    name,
    score,
    latitude,
    longitude,
    accuracy
  } = req.body;

  if (!name || typeof score !== "number") {
    return res.status(400).json({
      success: false,
      message: "Invalid submission"
    });
  }

  const results = loadResults();

  results.push({
    name: String(name).slice(0, 100),
    score,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    accuracy: accuracy ?? null,
    time: new Date().toISOString()
  });

  saveResults(results);

  res.json({ success: true });
});

app.get("/admin", (req, res) => {
  const key = process.env.ADMIN_KEY || "madhu123";

  if (req.query.key !== key) {
    return res.status(401).send("Wrong admin key.");
  }

  const results = loadResults().reverse();

  let rows = results.map(r => `
    <tr>
      <td>${escapeHTML(r.name)}</td>
      <td>${r.score}/10</td>
      <td>${r.latitude ?? "-"}</td>
      <td>${r.longitude ?? "-"}</td>
      <td>${r.accuracy ? r.accuracy + " m" : "-"}</td>
      <td>${escapeHTML(r.time)}</td>
    </tr>
  `).join("");

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Madhu Quiz Results</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 30px;
          background: #f5f5f5;
        }

        h1 {
          margin-bottom: 20px;
        }

        table {
          border-collapse: collapse;
          width: 100%;
          background: white;
        }

        th, td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }

        th {
          background: #222;
          color: white;
        }
      </style>
    </head>

    <body>
      <h1>Madhu Quiz Results</h1>

      <table>
        <tr>
          <th>Name</th>
          <th>Score</th>
          <th>Latitude</th>
          <th>Longitude</th>
          <th>Accuracy</th>
          <th>Time</th>
        </tr>

        ${rows}
      </table>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Quiz running on port ${PORT}`);
});
