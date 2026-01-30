import { useEffect, useState } from "preact/hooks";

interface CommentHistoryEntry {
  kommentar: string;
  username: string;
  timestamp: string;
}

interface ShoppingItem {
  id: string;
  artikel: string;
  anzahl: number;
  preis: number;
  status: "todo" | "done";
  kommentar: string;
  kommentarHistory: CommentHistoryEntry[];
  letzterUser: string;
  updatedAt: string;
}

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [username, setUsername] = useState("");
  const [newArtikel, setNewArtikel] = useState("");
  const [newAnzahl, setNewAnzahl] = useState(1);
  const [newPreis, setNewPreis] = useState(0);
  const [newKommentar, setNewKommentar] = useState("");
  const [openHistory, setOpenHistory] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const saved = localStorage.getItem("party_username");
    if (saved) setUsername(saved);
    loadItems();
  }, []);

  const loadItems = async () => {
    const res = await fetch("/api/items");
    const data = await res.json();
    setItems(data.items || []);
  };

  const saveUsername = (name: string) => {
    setUsername(name);
    localStorage.setItem("party_username", name);
  };

  const addItem = async () => {
    if (!newArtikel.trim()) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artikel: newArtikel,
        anzahl: newAnzahl,
        preis: newPreis,
        kommentar: newKommentar,
        username: username || "Anonym",
      }),
    });
    setNewArtikel("");
    setNewAnzahl(1);
    setNewPreis(0);
    setNewKommentar("");
    loadItems();
  };

  const toggleStatus = async (id: string) => {
    await fetch(`/api/items/${id}?action=toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username || "Anonym" }),
    });
    loadItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("🗑️ Wirklich löschen?")) return;
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    loadItems();
  };

  const submitComment = async (id: string) => {
    const kommentar = commentInputs[id];
    if (!kommentar?.trim()) return;
    await fetch(`/api/items/${id}?action=comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kommentar, username: username || "Anonym" }),
    });
    setCommentInputs({ ...commentInputs, [id]: "" });
    loadItems();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Items bleiben in ihrer ursprünglichen Reihenfolge (kein Sortieren bei Toggle)
  const sortedItems = items;

  return (
    <div class="min-h-screen p-4 md:p-6">
      {/* User Section */}
      <div class="max-w-4xl mx-auto mb-6 bg-white/95 backdrop-blur rounded-2xl p-5 shadow-xl">
        <div class="flex flex-wrap items-center gap-4">
          <label class="text-lg font-bold">🥳 Wer bist du?</label>
          <input
            type="text"
            value={username}
            onInput={(e) => saveUsername((e.target as HTMLInputElement).value)}
            placeholder="Dein Party-Name..."
            class="flex-1 min-w-[200px] px-4 py-3 border-3 border-yellow-400 rounded-xl text-lg focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-200 transition-all"
          />
        </div>
      </div>

      {/* Add Form */}
      <div class="max-w-4xl mx-auto mb-6 bg-white/95 backdrop-blur rounded-2xl p-5 shadow-xl">
        <h2 class="text-xl font-bold mb-4">🛒 Was brauchen wir noch?</h2>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div class="md:col-span-2">
            <label class="text-sm text-gray-600 font-semibold block mb-1">
              Artikel
            </label>
            <input
              type="text"
              value={newArtikel}
              onInput={(e) =>
                setNewArtikel((e.target as HTMLInputElement).value)}
              onKeyPress={(e) => e.key === "Enter" && addItem()}
              placeholder="z.B. Chips 🍿"
              class="w-full px-4 py-3 border-3 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-200 transition-all"
            />
          </div>
          <div>
            <label class="text-sm text-gray-600 font-semibold block mb-1">
              Anzahl
            </label>
            <input
              type="number"
              value={newAnzahl}
              min={1}
              onInput={(e) =>
                setNewAnzahl(
                  parseInt((e.target as HTMLInputElement).value) || 1,
                )}
              class="w-full px-4 py-3 border-3 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-200 transition-all"
            />
          </div>
          <div>
            <label class="text-sm text-gray-600 font-semibold block mb-1">
              💰 Preis (€)
            </label>
            <input
              type="number"
              value={newPreis}
              min={0}
              step={0.01}
              onInput={(e) =>
                setNewPreis(
                  parseFloat((e.target as HTMLInputElement).value) || 0,
                )}
              class="w-full px-4 py-3 border-3 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-200 transition-all"
            />
          </div>
          <div class="flex items-end">
            <button
              onClick={addItem}
              class="w-full py-3 px-6 bg-gradient-to-r from-red-400 to-yellow-400 text-white font-bold rounded-xl uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              ➕ Hinzufügen
            </button>
          </div>
        </div>
      </div>

      {/* Shopping List */}
      <div class="max-w-4xl mx-auto bg-white/95 backdrop-blur rounded-2xl shadow-xl overflow-hidden">
        <div class="bg-gradient-to-r from-purple-500 to-indigo-600 p-5">
          <h2 class="text-xl font-bold text-white">🎉 Party Einkaufsliste</h2>
        </div>

        <div class="divide-y divide-gray-100">
          {sortedItems.length === 0
            ? (
              <div class="p-12 text-center text-gray-400">
                <div class="text-6xl mb-4 animate-bounce">🛒</div>
                <p class="text-lg">Noch nichts auf der Liste!</p>
                <p>Füge etwas hinzu für die Party 🎊</p>
              </div>
            )
            : (
              sortedItems.map((item) => {
                const history = item.kommentarHistory || [];
                const hasHistory = history.length > 0;
                const isHistoryOpen = openHistory === item.id;

                return (
                  <div
                    key={item.id}
                    class={`p-5 transition-all ${
                      item.status === "done"
                        ? "bg-gradient-to-r from-green-50 to-emerald-50"
                        : "hover:bg-gradient-to-r hover:from-red-50/30 hover:to-yellow-50/30"
                    }`}
                  >
                    <div class="flex gap-4 items-start">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={item.status === "done"}
                        onChange={() => toggleStatus(item.id)}
                        class="w-7 h-7 mt-1 accent-green-500 cursor-pointer"
                      />

                      {/* Details */}
                      <div class="flex-1">
                        <div class="flex items-center gap-3 flex-wrap">
                          {item.status === "done" && (
                            <span class="px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-bold animate-pulse shadow-lg">
                              ✅ ERLEDIGT
                            </span>
                          )}
                          <span
                            class={`text-xl font-bold ${
                              item.status === "done"
                                ? "text-green-600"
                                : "text-gray-800"
                            }`}
                          >
                            {item.artikel}
                          </span>
                          <span class={`px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full text-sm font-semibold ${item.status === "done" ? "opacity-60" : ""}`}>
                            {item.anzahl}x
                          </span>
                          <span class={`px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-semibold ${item.status === "done" ? "opacity-60" : ""}`}>
                            💰 {(item.preis || 0).toFixed(2)}€/Stk
                          </span>
                          <span class={`px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full text-sm font-semibold ${item.status === "done" ? "opacity-60" : ""}`}>
                            = {((item.anzahl || 1) * (item.preis || 0)).toFixed(2)}€
                          </span>
                        </div>

                        <div class="flex gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                          <span>👤 {item.letzterUser}</span>
                          <span>🕐 {formatDate(item.updatedAt)}</span>
                        </div>

                        {/* Comment Section */}
                        <div class="mt-3 bg-gray-50 rounded-xl p-4">
                          <div class="flex items-center gap-3 flex-wrap">
                            <div
                              class={`flex-1 min-w-[200px] italic px-3 py-2 bg-white rounded-lg border-l-4 ${
                                item.kommentar
                                  ? "border-yellow-400 text-gray-600"
                                  : "border-gray-200 text-gray-400"
                              }`}
                            >
                              💬 {item.kommentar || "Kein Kommentar"}
                            </div>
                            {hasHistory && (
                              <button
                                onClick={() =>
                                  setOpenHistory(
                                    isHistoryOpen ? null : item.id,
                                  )}
                                class={`relative w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 ${
                                  isHistoryOpen
                                    ? "bg-gradient-to-r from-red-500 to-red-600"
                                    : "bg-gradient-to-r from-purple-500 to-indigo-600"
                                }`}
                                title="History anzeigen"
                              >
                                📜
                                <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-400 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                  {history.length}
                                </span>
                              </button>
                            )}
                          </div>

                          {/* New Comment Input */}
                          <div class="flex gap-2 mt-3">
                            <input
                              type="text"
                              value={commentInputs[item.id] || ""}
                              onInput={(e) =>
                                setCommentInputs({
                                  ...commentInputs,
                                  [item.id]:
                                    (e.target as HTMLInputElement).value,
                                })}
                              onKeyPress={(e) =>
                                e.key === "Enter" && submitComment(item.id)}
                              placeholder="✏️ Neuen Kommentar schreiben..."
                              class="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-cyan-400 focus:outline-none transition-all"
                            />
                            <button
                              onClick={() => submitComment(item.id)}
                              class="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
                            >
                              💾
                            </button>
                          </div>

                          {/* History */}
                          {hasHistory && isHistoryOpen && (
                            <div class="mt-3 p-3 bg-white rounded-xl border-2 border-purple-500 max-h-48 overflow-y-auto animate-in slide-in-from-top">
                              <div class="font-bold text-purple-600 mb-2">
                                📜 Kommentar-Verlauf
                              </div>
                              {history
                                .slice()
                                .reverse()
                                .map((entry, idx) => (
                                  <div
                                    key={idx}
                                    class="p-2 bg-gray-50 rounded-lg mb-2 last:mb-0"
                                  >
                                    <div class="italic text-gray-700">
                                      "{entry.kommentar}"
                                    </div>
                                    <div class="text-xs text-gray-500 flex gap-2 mt-1">
                                      <span>👤 {entry.username}</span>
                                      <span>
                                        🕐 {formatDate(entry.timestamp)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteItem(item.id)}
                        class="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
        </div>

        {/* Gesamtsumme Footer */}
        {items.length > 0 && (
          <div class="bg-gradient-to-r from-purple-600 to-indigo-700 p-5">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
              {/* Statistik */}
              <div class="text-center md:text-left">
                <div class="text-sm opacity-80 mb-1">📊 Übersicht</div>
                <div class="text-lg font-semibold">{items.length} Artikel gesamt</div>
                <div class="text-sm opacity-80">
                  ✅ {items.filter((i) => i.status === "done").length} erledigt
                  <span class="mx-2">•</span>
                  ⏳ {items.filter((i) => i.status === "todo").length} offen
                </div>
              </div>
              
              {/* Noch offen */}
              <div class="text-center bg-red-500/30 rounded-xl p-3">
                <div class="text-sm opacity-90 mb-1">⏳ Noch zu kaufen</div>
                <div class="text-2xl font-bold">
                  {items
                    .filter((i) => i.status === "todo")
                    .reduce((sum, item) => sum + (item.preis || 0) * item.anzahl, 0)
                    .toFixed(2)}
                  €
                </div>
              </div>
              
              {/* Gesamtsumme */}
              <div class="text-center md:text-right bg-green-500/30 rounded-xl p-3">
                <div class="text-sm opacity-90 mb-1">💰 Gesamtsumme</div>
                <div class="text-2xl font-bold">
                  {items
                    .reduce((sum, item) => sum + (item.preis || 0) * item.anzahl, 0)
                    .toFixed(2)}
                  €
                </div>
                <div class="text-xs opacity-70">
                  (✅ {items
                    .filter((i) => i.status === "done")
                    .reduce((sum, item) => sum + (item.preis || 0) * item.anzahl, 0)
                    .toFixed(2)}€ erledigt)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
