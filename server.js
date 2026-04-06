import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Database connection (Railway env variables)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// ✅ JWT secret (set in Render environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Middleware to check token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user; // { id, username }
    next();
  });
}

// ✅ Register route
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const hash = await bcrypt.hash(password, 10);
  const sql = "INSERT INTO users (username, password_hash) VALUES (?, ?)";
  db.query(sql, [username, hash], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "User registered successfully" });
  });
});

// ✅ Login route
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(400).json({ error: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  });
});

// ✅ Add expense (protected)
app.post("/expenses", authenticateToken, (req, res) => {
  const { title, amount, date } = req.body;
  if (!title || !amount || !date) {
    return res.status(400).json({ error: "All fields required" });
  }

  const sql = "INSERT INTO expenses (user_id, title, amount, date) VALUES (?, ?, ?, ?)";
  db.query(sql, [req.user.id, title, amount, date], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, user_id: req.user.id, title, amount, date });
  });
});

// ✅ Get all expenses for logged-in user
app.get("/expenses", authenticateToken, (req, res) => {
  const sql = "SELECT * FROM expenses WHERE user_id = ?";
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ✅ Get expenses by month
app.get("/expenses/month/:month", authenticateToken, (req, res) => {
  const { month } = req.params; // e.g. "04" for April
  const sql = "SELECT * FROM expenses WHERE user_id = ? AND MONTH(date) = ?";
  db.query(sql, [req.user.id, month], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running...");
});