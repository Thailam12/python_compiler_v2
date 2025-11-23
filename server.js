import express from "express";
import { spawn } from "child_process";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const HISTORY_FILE = "history.json";

// Load history từ file JSON
function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
}

// Save history vào file JSON
function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Run Python code (không tạo file .py)
app.post("/api/run", (req, res) => {
  const { code } = req.body;
  const py = spawn("python3", ["-c", code]);

  let output = "";
  let error = "";

  py.stdout.on("data", (data) => { output += data.toString(); });
  py.stderr.on("data", (data) => { error += data.toString(); });

  py.on("close", () => {
    if (error) return res.json({ error });
    res.json({ output });
  });
});

// Save code vào lịch sử (cập nhật thêm username)
app.post("/api/save", (req, res) => {
  const { code, filename, username } = req.body;   // nhận thêm username
  const date = new Date();
  const ddmmyyyy = date.toLocaleDateString("vi-VN").replace(/\//g, "-");
  const id = `${ddmmyyyy}_${filename}`;

  const history = loadHistory();
  history.push({
    id,
    code,
    filename,
    username: username || "guest",   // lưu tên
    date: date.toISOString()
  });
  saveHistory(history);

  res.json({ saved: true, id });
});

// List history (trả thêm username)
app.get("/api/list", (req, res) => {
  const history = loadHistory();
  res.json(history.map(h => ({
    id: h.id,
    date: h.date,
    username: h.username || "guest"
  })));
});

// Load code từ lịch sử (trả thêm username)
app.get("/api/load/:id", (req, res) => {
  const history = loadHistory();
  const item = history.find(h => h.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json({ code: item.code, username: item.username || "guest" });
});

app.listen(3000, () => console.log("Python IDE server chạy tại http://localhost:3000"));
