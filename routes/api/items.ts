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
  preis: number;
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
  async GET(_req, _ctx) {
    const data = await loadData();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  },

  async POST(req, _ctx) {
    const body = await req.json();
    const data = await loadData();

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      artikel: body.artikel,
      anzahl: body.anzahl,
      preis: body.preis || 0,
      status: "todo",
      kommentar: body.kommentar || "",
      kommentarHistory: [],
      letzterUser: body.username || "Anonym",
      updatedAt: new Date().toISOString(),
    };

    data.items.push(newItem);
    await saveData(data);

    return new Response(JSON.stringify(newItem), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
