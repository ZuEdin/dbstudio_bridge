#!/bin/bash
# Tauri Desktop Manager

show_menu() {
  clear
  echo "================================================="
  echo "  Tauri Desktop Manager"
  echo "================================================="
  echo ""
  echo "  [1] Dependencies installieren (inkl. Frontend)"
  echo "  [2] Frontend transpilieren (dist)"
  echo "  [3] Tauri Dev-Modus starten (npm run dev)"
  echo "  [4] Native Desktop App bauen (npm run tauri:build)"
  echo "  [5] Standard App-Icons herunterladen & generieren"
  echo "  [6] Beenden"
  echo ""
  read -p "Auswahl (1-6): " choice
  case $choice in
    1) 
      npm install
      if [ -d "../../Frontend" ]; then
        cd ../../Frontend
        npm install
        cd "../Backend/FakturierungPro"
      fi
      mkdir -p src-tauri/icons
      echo "Downloade standard Tauri-Icons..."
      curl -s -L -o src-tauri/icons/icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
      curl -s -L -o src-tauri/icons/icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
      curl -s -L -o src-tauri/icons/32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
      curl -s -L -o src-tauri/icons/128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
      curl -s -L -o src-tauri/icons/128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"
      read -p "Drücke Enter zum Fortfahren..." temp
      show_menu
      ;;
    2) npm run build ;;
    3) npm run dev ;;
    4) npm run tauri:build ;;
    5) 
      mkdir -p src-tauri/icons
      echo "Downloade standard Tauri-Icons..."
      curl -s -L -o src-tauri/icons/icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
      curl -s -L -o src-tauri/icons/icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
      curl -s -L -o src-tauri/icons/32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
      curl -s -L -o src-tauri/icons/128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
      curl -s -L -o src-tauri/icons/128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"
      if [ -f src-tauri/icons/icon.ico ]; then
        echo "Icons erfolgreich heruntergeladen!"
      else
        echo "Warnung: Download fehlgeschlagen. Versuche Fallback-Generierung..."
        node -e "require('fs').writeFileSync('src-tauri/temp_icon.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QgKDBUpbSjN2gAAAD1JREFUeN7t1CENAAAQw7Dzb+VbCHioEEnpWeaenKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrOwXFauPC/C9uXIAAAAASUVORK5CYII=', 'base64'))"
        if [ -f src-tauri/temp_icon.png ]; then
          echo "Generiere Icons im Tauri-Format..."
          npx tauri icon src-tauri/temp_icon.png
          rm src-tauri/temp_icon.png
          echo "Icons erfolgreich generiert!"
        else
          echo "Fehler: Konnte Fallback-Icon nicht erstellen."
        fi
      fi
      read -p "Drücke Enter zum Fortfahren..." temp
      show_menu
      ;;
    6) exit 0 ;;
    *) show_menu ;;
  esac
}

show_menu
