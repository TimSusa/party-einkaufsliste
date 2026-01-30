import { Handlers } from "$fresh/server.ts";

const DATA_FILE = "./einkaufsliste.json";

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

async function loadData(): Promise<ShoppingList> {
  try {
    const text = await Deno.readTextFile(DATA_FILE);
    return JSON.parse(text);
  } catch {
    return { items: [] };
  }
}

async function saveData(data: ShoppingList): Promise<void> {
  await Deno.writeTextFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export const handler: Handlers = {
  // Delete item
  async DELETE(_req, ctx) {
    const id = ctx.params.id;
    const data = await loadData();
    data.items = data.items.filter((i) => i.id !== id);
    await saveData(data);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },

  // Toggle status or update comment
  async POST(req, ctx) {
    const id = ctx.params.id;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json();
    const data = await loadData();

    const item = data.items.find((i) => i.id === id);
    if (!item) {
      return new Response(JSON.stringify({ error: "Item not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "toggle") {
      item.status = item.status === "todo" ? "done" : "todo";
      item.letzterUser = body.username || "Anonym";
      item.updatedAt = new Date().toISOString();
    } else if (action === "comment") {
      const newKommentar = body.kommentar || "";
      if (item.kommentar !== newKommentar && item.kommentar.trim() !== "") {
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
    }

    await saveData(data);
    return new Response(JSON.stringify({ success: true, item }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
