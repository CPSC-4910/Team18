const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../../frontend/public")));

// Example API endpoint
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Fallback for single-page apps
app.get((req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
