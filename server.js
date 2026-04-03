import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection using environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "0206",
  database: process.env.DB_NAME || "expense_db",
  port: process.env.DB_PORT || 3306
});

// Test connection
db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// Create table if not exists
db.query(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    amount DECIMAL(10,2),
    date DATE
  )
`, (err) => {
  if (err) console.error("❌ Table creation failed:", err.message);
  else console.log("✅ Table ready");
});

// Add expense
app.post("/expenses", (req, res) => {
  const { title, amount, date } = req.body;
  const sql = "INSERT INTO expenses (title, amount, date) VALUES (?, ?, ?)";
  db.query(sql, [title, amount, date], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, title, amount, date });
  });
});

// Get expenses
app.get("/expenses", (req, res) => {
  db.query("SELECT * FROM expenses ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Dynamic port for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));