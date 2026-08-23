#!/bin/bash
# Electron Desktop Manager

show_menu() {
  clear
  echo "================================================="
  echo "  Electron Desktop Manager"
  echo "================================================="
  echo ""
  echo "  [1] Dependencies installieren (inkl. Frontend)"
  echo "  [2] Frontend transpilieren (dist)"
  echo "  [3] Electron App starten (npm start)"
  echo "  [4] Desktop Executable erstellen (npm run electron:build)"
  echo "  [5] Beenden"
  echo ""
  read -p "Auswahl (1-5): " choice
  case $choice in
    1) 
      npm install
      if [ -d "../../Frontend" ]; then
        cd ../../Frontend
        npm install
        cd "../Backend/FakturierungPro"
      fi
      ;;
    2) npm run build ;;
    3) npm start ;;
    4) npm run electron:build ;;
    5) exit 0 ;;
    *) show_menu ;;
  esac
}

show_menu
