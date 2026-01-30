#!/bin/bash

# 🎉 Party Einkaufsliste - Debian/Raspberry Pi Installer
# Dieses Skript installiert alles automatisch!

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║   🎉 Party Einkaufsliste Installer 🎉     ║"
echo "║   Für Debian / Ubuntu / Raspberry Pi      ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Prüfe ob als root ausgeführt
if [ "$EUID" -eq 0 ]; then 
  echo -e "${RED}❌ Bitte NICHT als root ausführen!${NC}"
  echo "   Führe das Skript als normaler User aus."
  exit 1
fi

INSTALL_DIR="$HOME/party-einkaufsliste"
SERVICE_NAME="party-einkaufsliste"

# Schritt 1: System-Updates
echo -e "\n${YELLOW}📦 Schritt 1: System-Pakete prüfen...${NC}"
sudo apt-get update -qq
sudo apt-get install -y -qq curl git unzip > /dev/null


# Schritt 2: Deno installieren
echo -e "\n${YELLOW}🦕 Schritt 2: Deno installieren...${NC}"
if command -v deno &> /dev/null; then
    echo -e "${GREEN}✅ Deno ist bereits installiert: $(deno --version | head -n1)${NC}"
else
    echo "   Installiere Deno..."
    curl -fsSL https://deno.land/install.sh | sh > /dev/null 2>&1
    
    # PATH einrichten
    if ! grep -q 'DENO_INSTALL' ~/.bashrc; then
        echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
        echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
    fi
    
    export DENO_INSTALL="$HOME/.deno"
    export PATH="$DENO_INSTALL/bin:$PATH"
    
    echo -e "${GREEN}✅ Deno installiert!${NC}"
fi


# Schritt 3: Projekt klonen
echo -e "\n${YELLOW}📥 Schritt 3: Projekt herunterladen...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo "   Ordner existiert, aktualisiere..."
    cd "$INSTALL_DIR"
    git pull --quiet
else
    echo "   Klone Repository..."
    git clone --quiet https://github.com/TimSusa/party-einkaufsliste.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi
echo -e "${GREEN}✅ Projekt heruntergeladen nach: $INSTALL_DIR${NC}"


# Schritt 4: Systemd Service einrichten
echo -e "\n${YELLOW}⚙️  Schritt 4: Autostart einrichten...${NC}"

SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=Party Einkaufsliste Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
Environment="DENO_INSTALL=$HOME/.deno"
Environment="PATH=$HOME/.deno/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=$HOME/.deno/bin/deno task start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME --quiet
echo -e "${GREEN}✅ Autostart eingerichtet!${NC}"


# Schritt 5: Service starten
echo -e "\n${YELLOW}🚀 Schritt 5: Server starten...${NC}"
sudo systemctl start $SERVICE_NAME
sleep 3

if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo -e "${GREEN}✅ Server läuft!${NC}"
else
    echo -e "${RED}❌ Server konnte nicht gestartet werden${NC}"
    echo "   Prüfe den Status mit: sudo systemctl status $SERVICE_NAME"
    exit 1
fi


# IP-Adresse ermitteln
IP_ADDR=$(hostname -I | awk '{print $1}')

echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════╗"
echo "║         🎉 Installation fertig! 🎉         ║"
echo "╠════════════════════════════════════════════╣"
echo "║                                            ║"
echo "║  📍 Lokal:   http://localhost:8000        ║"
echo "║  📱 Netzwerk: http://$IP_ADDR:8000   ║"
echo "║                                            ║"
echo "╠════════════════════════════════════════════╣"
echo "║  Nützliche Befehle:                        ║"
echo "║                                            ║"
echo "║  Status:   sudo systemctl status $SERVICE_NAME  ║"
echo "║  Stoppen:  sudo systemctl stop $SERVICE_NAME    ║"
echo "║  Starten:  sudo systemctl start $SERVICE_NAME   ║"
echo "║  Logs:     sudo journalctl -u $SERVICE_NAME -f  ║"
echo "║                                            ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Öffne jetzt im Browser: http://$IP_ADDR:8000${NC}"
echo ""
