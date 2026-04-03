import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",        // replace with your MySQL user
  password: "0206" // replace with your MySQL password
});

// Create database if not exists
db.query("CREATE DATABASE IF NOT EXISTS expense_db", (err) => {
  if (err) throw err;
  console.log("Database ready");
});

// Use database
db.changeUser({ database: "expense_db" });

// Create table if not exists
db.query(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    amount DECIMAL(10,2),
    date DATE
  )
`, (err) => {
  if (err) throw err;
  console.log("Table ready");
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

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));