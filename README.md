# 🎉 Party Einkaufsliste
<img width="693" height="845" alt="Screenshot 2026-01-30 at 14 04 36" src="https://github.com/user-attachments/assets/7406e6f6-4993-45b5-94e9-2dbe63460478" />

Eine gemeinsame Einkaufsliste für deine nächste Party! Alle sehen in Echtzeit, was noch fehlt und wer was besorgt.

![Party Banner](https://img.shields.io/badge/🥳-Party_Time-ff6b6b?style=for-the-badge)
![Deno](https://img.shields.io/badge/Deno-1.40+-000000?style=for-the-badge&logo=deno)
![Fresh](https://img.shields.io/badge/Fresh-1.7-96d636?style=for-the-badge)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwindcss)

---

## ✨ Features

| Feature | Beschreibung |
|---------|-------------|
| 🛒 **Artikel verwalten** | Hinzufügen, bearbeiten, löschen |
| 💰 **Preis & Summen** | Automatische Berechnung der Kosten |
| ✅ **Status-Tracking** | Checkbox für erledigt/offen |
| 💬 **Kommentare** | Mit kompletter History |
| 👤 **User-Namen** | Wer hat was geändert? |
| 📱 **Responsive** | Funktioniert auf Handy & Desktop |
| 💾 **Persistent** | Daten werden in JSON gespeichert |

---

## 🚀 Schnellstart

### Schritt 1: Deno installieren

**macOS / Linux:**
```bash
curl -fsSL https://deno.land/install.sh | sh
```

**Windows (PowerShell):**
```powershell
irm https://deno.land/install.ps1 | iex
```

> 💡 **Tipp:** Nach der Installation musst du eventuell dein Terminal neu starten!

### Schritt 2: Projekt klonen

```bash
git clone https://github.com/TimSusa/party-einkaufsliste.git
cd party-einkaufsliste
```

### Schritt 3: Server starten

```bash
deno task start
```

### Schritt 4: Browser öffnen

Gehe zu: **http://localhost:8000** 🎉

---

## 📱 Auf dem Handy nutzen

1. Finde die IP-Adresse deines Computers:
   - **Mac:** `ipconfig getifaddr en0`
   - **Linux:** `hostname -I`
   - **Windows:** `ipconfig` → IPv4-Adresse

2. Öffne auf dem Handy: `http://[DEINE-IP]:8000`

> 💡 **Beispiel:** `http://192.168.1.50:8000`

---

## 🍓 Raspberry Pi / Debian - Ein-Befehl-Installation

Kopiere diesen Befehl und füge ihn im Terminal ein:

```bash
curl -fsSL https://raw.githubusercontent.com/TimSusa/party-einkaufsliste/main/install-debian.sh | bash
```

**Das Skript macht automatisch:**
1. ✅ Installiert Deno
2. ✅ Lädt das Projekt herunter
3. ✅ Richtet Autostart ein (systemd)
4. ✅ Startet den Server

Nach ca. 1 Minute ist alles fertig! 🎉

### Manuelle Installation (Alternative)

Falls du es lieber manuell machen möchtest:

```bash
# Deno installieren
curl -fsSL https://deno.land/install.sh | sh
echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Projekt klonen & starten
git clone https://github.com/TimSusa/party-einkaufsliste.git
cd party-einkaufsliste
deno task start
```

---

## 🛠️ Entwicklung

### Projekt-Struktur

```
party-einkaufsliste/
├── 📁 islands/           # Interaktive Komponenten
│   └── ShoppingList.tsx  # Haupt-Komponente
├── 📁 routes/            # Seiten & API
│   ├── index.tsx         # Startseite
│   └── api/
│       ├── items.ts      # GET/POST Items
│       └── items/[id].ts # Toggle/Delete Item
├── 📁 static/            # CSS & Bilder
├── 📄 deno.json          # Projekt-Config
├── 📄 einkaufsliste.json # Datenbank (JSON)
└── 📄 README.md          # Diese Datei
```

### Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `deno task start` | Startet den Dev-Server mit Hot-Reload |
| `deno task build` | Erstellt einen Production-Build |
| `deno task preview` | Vorschau des Production-Builds |

---

## 💡 Tipps & Tricks

### Port ändern

In `deno.json` oder starte mit:
```bash
PORT=3000 deno task start
```

### Daten zurücksetzen

Lösche einfach `einkaufsliste.json` - wird beim nächsten Start neu erstellt.

### Mehrere Benutzer

Jeder öffnet die URL im Browser und gibt seinen Namen ein. Alle sehen automatisch die Änderungen der anderen!

---

## 🐛 Probleme?

| Problem | Lösung |
|---------|--------|
| **Deno nicht gefunden** | Terminal neu starten oder PATH prüfen |
| **Port belegt** | Anderen Port verwenden (siehe oben) |
| **Handy kann nicht verbinden** | Gleches WLAN? Firewall prüfen |

---

## 📄 Lizenz

MIT - Mach damit was du willst! 🎉

---

<div align="center">

Made with ❤️ for your next party

**[⭐ Star on GitHub](https://github.com/TimSusa/party-einkaufsliste)**

</div>
