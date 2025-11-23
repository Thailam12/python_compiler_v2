const codeEl = document.getElementById("code");
const filenameEl = document.getElementById("filename");
const usernameEl = document.getElementById("username"); // thêm dòng này
const outputEl = document.getElementById("output");
const btnRun = document.getElementById("btnRun");
const btnSave = document.getElementById("btnSave");
const historyList = document.getElementById("historyList");

// Chạy code Python
btnRun.onclick = async () => {
  const code = codeEl.value;
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  const data = await res.json();
  outputEl.textContent = data.output || data.error || "Không có phản hồi.";
};

// Lưu code vào lịch sử
btnSave.onclick = async () => {
  const code = codeEl.value;
  const filename = filenameEl.value.trim() || "untitled";
  const username = usernameEl.value.trim() || "guest"; // lấy tên

  const res = await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, filename, username }) // gửi thêm username
  });
  const data = await res.json();
  alert("Đã lưu: " + data.id);
  loadHistory();
};

// Load danh sách lịch sử
async function loadHistory() {
  const res = await fetch("/api/list");
  const items = await res.json();
  historyList.innerHTML = "";
  items.forEach(it => {
    const li = document.createElement("li");
    li.textContent = `${it.id} (${it.username || "guest"})`; // hiển thị tên
    li.onclick = async () => {
      const res = await fetch("/api/load/" + it.id);
      const data = await res.json();
      codeEl.value = data.code;
      outputEl.textContent = "";
    };
    historyList.appendChild(li);
  });
}

// Auto-indent khi nhấn Enter
codeEl.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const start = codeEl.selectionStart;
    const end = codeEl.selectionEnd;
    const value = codeEl.value;
    const before = value.slice(0, start);
    const currentLine = before.split("\n").pop();

    // Tính indent hiện tại
    const indentMatch = currentLine.match(/^\s*/);
    let indent = indentMatch ? indentMatch[0] : "";

    // Nếu dòng trước kết thúc bằng ":" → thêm 4 dấu cách
    if (currentLine.trim().endsWith(":")) {
      indent += "    ";
    }

    // Ngăn Enter mặc định
    e.preventDefault();

    // Chèn dòng mới với indent
    const newValue = before + "\n" + indent + value.slice(end);
    codeEl.value = newValue;

    // Di chuyển con trỏ
    const cursor = start + 1 + indent.length;
    codeEl.selectionStart = codeEl.selectionEnd = cursor;
  }
});

// Load lịch sử khi mở trang
loadHistory();
