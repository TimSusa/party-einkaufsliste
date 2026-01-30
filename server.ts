// Deno.js Einkaufsliste Server
// Einfach zu installieren auf Raspberry Pi

const PORT = 8080;

interface CommentHistoryEntry {
  kommentar: string;
  username: string;
  timestamp: string;
}

interface ShoppingItem {
  id: string;
  artikel: string;
  anzahl: number;
  status: "todo" | "done";
  kommentar: string;
  kommentarHistory: CommentHistoryEntry[];
  letzterUser: string;
  updatedAt: string;
}

interface ShoppingList {
  items: ShoppingItem[];
}

// Datei für Persistenz
const DATA_FILE = "./einkaufsliste.json";

// Lade oder erstelle Einkaufsliste
async function loadData(): Promise<ShoppingList> {
  try {
    const text = await Deno.readTextFile(DATA_FILE);
    return JSON.parse(text);
  } catch {
    return { items: [] };
  }
}

// Speichere Einkaufsliste
async function saveData(data: ShoppingList): Promise<void> {
  await Deno.writeTextFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// WebSocket Clients für Live-Updates
const clients = new Set<WebSocket>();

function broadcastUpdate(data: ShoppingList) {
  const message = JSON.stringify({ type: "update", data });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// HTML Seite
const HTML_PAGE = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎉 Party Einkaufsliste</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%);
      background-size: 400% 400%;
      animation: gradientBG 15s ease infinite;
      min-height: 100vh;
      padding: 20px;
    }
    
    @keyframes gradientBG {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .confetti {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 0;
    }
    
    .confetti span {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #f0f;
      animation: confetti-fall 5s linear infinite;
    }
    
    @keyframes confetti-fall {
      0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }
    
    h1 {
      color: white;
      text-align: center;
      margin-bottom: 25px;
      font-size: 2.5rem;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
      animation: bounce 2s ease infinite;
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    .user-section {
      background: rgba(255,255,255,0.95);
      padding: 20px 25px;
      border-radius: 20px;
      margin-bottom: 25px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      backdrop-filter: blur(10px);
    }
    
    .user-section label {
      font-weight: 700;
      color: #333;
      font-size: 1.1rem;
    }
    
    .user-section input {
      flex: 1;
      padding: 12px 18px;
      border: 3px solid #feca57;
      border-radius: 12px;
      font-size: 1rem;
      font-family: inherit;
      transition: all 0.3s;
    }
    
    .user-section input:focus {
      outline: none;
      border-color: #ff6b6b;
      box-shadow: 0 0 15px rgba(255,107,107,0.4);
    }
    
    .add-form {
      background: rgba(255,255,255,0.95);
      padding: 25px;
      border-radius: 20px;
      margin-bottom: 25px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      backdrop-filter: blur(10px);
    }
    
    .add-form h2 {
      margin-bottom: 20px;
      color: #333;
      font-size: 1.4rem;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 2fr 1fr 2fr auto;
      gap: 15px;
      align-items: end;
    }
    
    @media (max-width: 700px) {
      .form-row {
        grid-template-columns: 1fr 1fr;
      }
      .form-row .form-group:first-child {
        grid-column: span 2;
      }
      .form-row button {
        grid-column: span 2;
      }
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .form-group label {
      font-size: 0.9rem;
      color: #666;
      font-weight: 600;
    }
    
    .form-group input {
      padding: 12px 15px;
      border: 3px solid #e0e0e0;
      border-radius: 12px;
      font-size: 1rem;
      font-family: inherit;
      transition: all 0.3s;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #48dbfb;
      box-shadow: 0 0 15px rgba(72,219,251,0.4);
    }
    
    .btn {
      padding: 12px 25px;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s;
      font-weight: 700;
      font-family: inherit;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #ff6b6b, #feca57);
      color: white;
      box-shadow: 0 5px 20px rgba(255,107,107,0.4);
    }
    
    .btn-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(255,107,107,0.5);
    }
    
    .btn-danger {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      color: white;
      padding: 8px 15px;
      font-size: 0.85rem;
      box-shadow: 0 3px 10px rgba(231,76,60,0.3);
    }
    
    .btn-danger:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(231,76,60,0.4);
    }
    
    .shopping-list {
      background: rgba(255,255,255,0.95);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      backdrop-filter: blur(10px);
    }
    
    .list-header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      padding: 20px 25px;
      color: white;
    }
    
    .list-header h2 {
      font-size: 1.3rem;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.2);
    }
    
    .list-item {
      padding: 20px 25px;
      border-bottom: 2px solid #f0f0f0;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 20px;
      align-items: start;
      transition: all 0.3s;
    }
    
    .list-item:hover {
      background: linear-gradient(135deg, rgba(255,107,107,0.05), rgba(254,202,87,0.05));
    }
    
    .list-item.done {
      background: linear-gradient(135deg, rgba(39,174,96,0.1), rgba(46,204,113,0.1));
    }
    
    .list-item.done .item-name {
      text-decoration: line-through;
      color: #27ae60;
    }
    
    .checkbox {
      width: 28px;
      height: 28px;
      cursor: pointer;
      accent-color: #27ae60;
      margin-top: 5px;
    }
    
    .item-details {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .item-header {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .item-name {
      font-weight: 700;
      font-size: 1.2rem;
      color: #333;
    }
    
    .item-count {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    
    .item-meta {
      font-size: 0.85rem;
      color: #888;
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
    
    .comment-section {
      background: #f9f9f9;
      border-radius: 12px;
      padding: 12px 15px;
      margin-top: 5px;
    }
    
    .last-comment {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .comment-text {
      font-style: italic;
      color: #555;
      background: white;
      padding: 8px 12px;
      border-radius: 8px;
      border-left: 4px solid #feca57;
      flex: 1;
      min-width: 150px;
    }
    
    .comment-text.empty {
      color: #aaa;
      border-left-color: #ddd;
    }
    
    .history-btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
      position: relative;
    }
    
    .history-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 3px 10px rgba(102,126,234,0.4);
    }
    
    .history-btn[data-tooltip]:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      white-space: nowrap;
      margin-bottom: 5px;
    }
    
    .history-btn.open {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
    }
    
    .history-count {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ff6b6b;
      color: white;
      font-size: 0.65rem;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    
    .new-comment {
      display: flex;
      gap: 10px;
      margin-top: 10px;
      align-items: center;
    }
    
    .new-comment input {
      flex: 1;
      padding: 10px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.3s;
    }
    
    .new-comment input:focus {
      outline: none;
      border-color: #48dbfb;
    }
    
    .new-comment button {
      background: linear-gradient(135deg, #48dbfb, #54a0ff);
      border: none;
      color: white;
      padding: 10px 20px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      font-family: inherit;
      transition: all 0.3s;
    }
    
    .new-comment button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(72,219,251,0.4);
    }
    
    .comment-history {
      display: none;
      margin-top: 12px;
      padding: 12px;
      background: white;
      border-radius: 10px;
      border: 2px solid #667eea;
      max-height: 200px;
      overflow-y: auto;
      animation: slideDown 0.3s ease;
    }
    
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .comment-history.open {
      display: block;
    }
    
    .history-title {
      font-weight: 700;
      color: #667eea;
      margin-bottom: 10px;
      font-size: 0.9rem;
    }
    
    .history-entry {
      padding: 10px;
      border-radius: 8px;
      background: #f9f9f9;
      margin-bottom: 8px;
    }
    
    .history-entry:last-child {
      margin-bottom: 0;
    }
    
    .history-entry .history-comment {
      color: #333;
      font-style: italic;
      margin-bottom: 5px;
    }
    
    .history-entry .history-meta {
      color: #888;
      font-size: 0.75rem;
      display: flex;
      gap: 10px;
    }
    
    .item-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-end;
    }
    
    .empty-list {
      padding: 60px 40px;
      text-align: center;
      color: #888;
    }
    
    .empty-list .emoji {
      font-size: 4rem;
      margin-bottom: 20px;
      animation: bounce 2s ease infinite;
    }
    
    .connection-status {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
      z-index: 100;
    }
    
    .connected {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      color: white;
    }
    
    .disconnected {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      color: white;
      animation: pulse 1.5s ease infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  </style>
</head>
<body>
  <div class="confetti" id="confetti"></div>
  <div class="container">
    <h1>🎉 Party Einkaufsliste 🎊</h1>
    
    <div class="user-section">
      <label for="username">🥳 Wer bist du?</label>
      <input type="text" id="username" placeholder="Dein Party-Name..." value="">
    </div>
    
    <div class="add-form">
      <h2>🛒 Was brauchen wir noch?</h2>
      <div class="form-row">
        <div class="form-group">
          <label for="artikel">Artikel</label>
          <input type="text" id="artikel" placeholder="z.B. Milch">
        </div>
        <div class="form-group">
          <label for="anzahl">Anzahl</label>
          <input type="number" id="anzahl" value="1" min="1">
        </div>
        <div class="form-group">
          <label for="kommentar">Kommentar</label>
          <input type="text" id="kommentar" placeholder="Optional...">
        </div>
        <button class="btn btn-primary" onclick="addItem()">Hinzufügen</button>
      </div>
    </div>
    
    <div class="shopping-list">
      <div class="list-header">
        <h2>📋 Einkaufsliste</h2>
      </div>
      <div id="items-container">
        <div class="empty-list">Keine Artikel vorhanden. Füge einen hinzu!</div>
      </div>
    </div>
  </div>
  
  <div id="connection-status" class="connection-status disconnected">Verbinde...</div>
  
  <script>
    let ws;
    let items = [];
    
    // Benutzername aus localStorage laden
    const savedUsername = localStorage.getItem('einkaufsliste_username') || '';
    document.getElementById('username').value = savedUsername;
    
    // Benutzername speichern bei Änderung
    document.getElementById('username').addEventListener('input', (e) => {
      localStorage.setItem('einkaufsliste_username', e.target.value);
    });
    
    function getUsername() {
      return document.getElementById('username').value.trim() || 'Anonym';
    }
    
    function connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(protocol + '//' + window.location.host + '/ws');
      
      ws.onopen = () => {
        document.getElementById('connection-status').className = 'connection-status connected';
        document.getElementById('connection-status').textContent = '🟢 Verbunden';
      };
      
      ws.onclose = () => {
        document.getElementById('connection-status').className = 'connection-status disconnected';
        document.getElementById('connection-status').textContent = '🔴 Getrennt';
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'update') {
          items = message.data.items;
          renderItems();
        }
      };
    }
    
    function renderItems() {
      const container = document.getElementById('items-container');
      
      if (items.length === 0) {
        container.innerHTML = '<div class="empty-list">Keine Artikel vorhanden. Füge einen hinzu!</div>';
        return;
      }
      
      // Sortiere: todo zuerst, dann done
      const sortedItems = [...items].sort((a, b) => {
        if (a.status === 'todo' && b.status === 'done') return -1;
        if (a.status === 'done' && b.status === 'todo') return 1;
        return 0;
      });
      
      container.innerHTML = sortedItems.map(item => {
        const history = item.kommentarHistory || [];
        const hasHistory = history.length > 0;
        
        return \`
        <div class="list-item \${item.status}">
          <input 
            type="checkbox" 
            class="checkbox" 
            \${item.status === 'done' ? 'checked' : ''} 
            onchange="toggleStatus('\${item.id}')"
          >
          <div class="item-details">
            <div class="item-header">
              <span class="item-name">\${escapeHtml(item.artikel)}</span>
              <span class="item-count">\${item.anzahl}x</span>
            </div>
            <div class="item-meta">
              <span>👤 \${escapeHtml(item.letzterUser)}</span>
              <span>🕐 \${formatDate(item.updatedAt)}</span>
            </div>
            <div class="comment-section">
              <div class="last-comment">
                <div class="comment-text \${!item.kommentar ? 'empty' : ''}">
                  \${item.kommentar ? '💬 ' + escapeHtml(item.kommentar) : '💬 Kein Kommentar'}
                </div>
                \${hasHistory ? \`
                  <button 
                    class="history-btn" 
                    onclick="toggleHistory('\${item.id}')"
                    data-tooltip="History anzeigen"
                    id="btn-\${item.id}"
                  >
                    📜
                    <span class="history-count">\${history.length}</span>
                  </button>
                \` : ''}
              </div>
              <div class="new-comment">
                <input 
                  type="text" 
                  id="comment-\${item.id}"
                  placeholder="✏️ Neuen Kommentar schreiben..."
                  onkeypress="if(event.key==='Enter') submitComment('\${item.id}')"
                >
                <button onclick="submitComment('\${item.id}')">💾 Speichern</button>
              </div>
              \${hasHistory ? \`
                <div class="comment-history" id="history-\${item.id}">
                  <div class="history-title">📜 Kommentar-Verlauf</div>
                  \${history.slice().reverse().map(entry => \`
                    <div class="history-entry">
                      <div class="history-comment">"\${escapeHtml(entry.kommentar)}"</div>
                      <div class="history-meta">
                        <span>👤 \${escapeHtml(entry.username)}</span>
                        <span>🕐 \${formatDate(entry.timestamp)}</span>
                      </div>
                    </div>
                  \`).join('')}
                </div>
              \` : ''}
            </div>
          </div>
          <div class="item-actions">
            <button class="btn btn-danger" onclick="deleteItem('\${item.id}')">🗑️</button>
          </div>
        </div>
      \`}).join('');
    }
    
    function submitComment(id) {
      const input = document.getElementById('comment-' + id);
      if (input && input.value.trim()) {
        updateComment(id, input.value.trim());
        input.value = '';
      }
    }
    
    function toggleHistory(id) {
      const historyEl = document.getElementById('history-' + id);
      if (historyEl) {
        historyEl.classList.toggle('open');
      }
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleString('de-DE', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    async function addItem() {
      const artikel = document.getElementById('artikel').value.trim();
      const anzahl = parseInt(document.getElementById('anzahl').value) || 1;
      const kommentar = document.getElementById('kommentar').value.trim();
      
      if (!artikel) {
        alert('Bitte Artikel eingeben!');
        return;
      }
      
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artikel,
          anzahl,
          kommentar,
          username: getUsername()
        })
      });
      
      if (response.ok) {
        document.getElementById('artikel').value = '';
        document.getElementById('anzahl').value = '1';
        document.getElementById('kommentar').value = '';
      }
    }
    
    async function toggleStatus(id) {
      await fetch('/api/items/' + id + '/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: getUsername() })
      });
    }
    
    async function deleteItem(id) {
      if (confirm('Artikel wirklich löschen?')) {
        await fetch('/api/items/' + id, {
          method: 'DELETE'
        });
      }
    }
    
    async function updateComment(id, kommentar) {
      await fetch('/api/items/' + id + '/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kommentar: kommentar,
          username: getUsername() 
        })
      });
    }
    
    // Enter-Taste zum Hinzufügen
    document.getElementById('artikel').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addItem();
    });
    
    // Starten
    connectWebSocket();
    
    // Initial laden
    fetch('/api/items')
      .then(r => r.json())
      .then(data => {
        items = data.items;
        renderItems();
      });
  </script>
</body>
</html>`;

// Request Handler
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // WebSocket Upgrade
  if (path === "/ws") {
    if (request.headers.get("upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(request);

    socket.onopen = () => {
      clients.add(socket);
    };

    socket.onclose = () => {
      clients.delete(socket);
    };

    return response;
  }

  // API Endpoints
  if (path === "/api/items" && request.method === "GET") {
    const data = await loadData();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (path === "/api/items" && request.method === "POST") {
    const body = await request.json();
    const data = await loadData();

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      artikel: body.artikel,
      anzahl: body.anzahl,
      status: "todo",
      kommentar: body.kommentar || "",
      kommentarHistory: [],
      letzterUser: body.username || "Anonym",
      updatedAt: new Date().toISOString(),
    };

    data.items.push(newItem);
    await saveData(data);
    broadcastUpdate(data);

    return new Response(JSON.stringify(newItem), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Update Comment
  const commentMatch = path.match(/^\/api\/items\/(.+)\/comment$/);
  if (commentMatch && request.method === "POST") {
    const id = commentMatch[1];
    const body = await request.json();
    const data = await loadData();

    const item = data.items.find((i) => i.id === id);
    if (item) {
      // Nur zur History hinzufügen wenn sich der Kommentar geändert hat
      const newKommentar = body.kommentar || "";
      if (item.kommentar !== newKommentar && item.kommentar.trim() !== "") {
        // Alten Kommentar zur History hinzufügen
        if (!item.kommentarHistory) {
          item.kommentarHistory = [];
        }
        item.kommentarHistory.push({
          kommentar: item.kommentar,
          username: item.letzterUser,
          timestamp: item.updatedAt,
        });
      }
      item.kommentar = newKommentar;
      item.letzterUser = body.username || "Anonym";
      item.updatedAt = new Date().toISOString();
      await saveData(data);
      broadcastUpdate(data);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Toggle Status
  const toggleMatch = path.match(/^\/api\/items\/(.+)\/toggle$/);
  if (toggleMatch && request.method === "POST") {
    const id = toggleMatch[1];
    const body = await request.json();
    const data = await loadData();

    const item = data.items.find((i) => i.id === id);
    if (item) {
      item.status = item.status === "todo" ? "done" : "todo";
      item.letzterUser = body.username || "Anonym";
      item.updatedAt = new Date().toISOString();
      await saveData(data);
      broadcastUpdate(data);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Delete Item
  const deleteMatch = path.match(/^\/api\/items\/(.+)$/);
  if (deleteMatch && request.method === "DELETE") {
    const id = deleteMatch[1];
    const data = await loadData();

    data.items = data.items.filter((i) => i.id !== id);
    await saveData(data);
    broadcastUpdate(data);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Serve HTML
  if (path === "/" || path === "/index.html") {
    return new Response(HTML_PAGE, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response("Not Found", { status: 404 });
}

// Server starten
console.log(`🛒 Einkaufsliste Server läuft auf http://localhost:${PORT}`);
console.log(`   Öffne im Browser: http://localhost:${PORT}`);
console.log(`   Zum Beenden: Strg+C`);

Deno.serve({ port: PORT }, handleRequest);
