# Phase 6: Low-Code Action & Flow Builder - [ERLEDIGT ✅]

Nachdem das Layout und die Datenstruktur perfekt generiert werden, rückt die **Geschäftslogik auf Client-Seite** in den Fokus. Was passiert, wenn ich auf einen Knopf drücke? Dies löst der Action Builder.

## 6.1 Frontend Action Flows (Event-Triggered Logic) - [ERLEDIGT ✅]
*   [x] **Die Idee**: Ein visuelles Mapping von Events auf Aktionen ohne eine Zeile JavaScript.
*   [x] **Features**: Definition von Triggern (z.B. `OnClick`, `OnChange`, `OnPageLoad`).
*   [x] **Mögliche Actions**:
    *   [x] `Show Toast/Alert` (Benachrichtigung im Screen unten rechts).
    *   [x] `Open Modal/Form` (Ein Popup-Modalfenster mit einem Formular öffnen).
    *   [x] `Navigate to Route` (Weiterleitung auf eine Query-Ansicht oder andere Seite).
    *   [x] `Execute API Call` (Sende eine payload an einen REST-Endpunkt).
*   [x] **Die Generierung**: Transpilierung in native EventHandler (`onClick`, `useEffect`) im generierten Single Page Application Code über `layoutHelper.ts`.

## 6.2 Global State & App Context Variablen - [ERLEDIGT ✅]
*   [x] **Die Idee**: Die App muss sich Zustände sitzungsübergreifend merken können.
*   [x] **Features**: Im DB Studio Pro können Entwickler State-Variablen anlegen (z.B. `selectedYear`, `activeCustomerID`).
*   [x] **Die Generierung**: Generierung von Global Context Providern (`GlobalStateContext.tsx`), die durch Dropdowns & Buttons im Layout aktualisiert werden können.

## 6.3 Interaktives Onboarding & Produkt-Guided-Tours - [ERLEDIGT ✅]
*   [x] **Die Idee**: Neue Benutzer in generierten Firmen-Apps kennen sich oft nicht aus.
*   [x] **Features**: Ein Feature im Designer (`LogicDesigner.tsx`), um "Tour-Steps" an Elemente anzuhängen (z.B. Schritt 1: "Hier legen Sie neue Kunden an").
*   [x] **Die Generierung**: Die generierte App enthält Integrationen für Tour-Bibliotheken (`react-joyride`), welche beim Erstlogin den User mit Popovers quer durch das Interface führen.
