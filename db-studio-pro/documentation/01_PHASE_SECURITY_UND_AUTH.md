# Phase 1: Security, Authentifizierung & Rollen (RBAC) - [ERLEDIGT ✅]

Dies ist die **erste Entwicklungsphase**. Ohne ein definiertes Rollen- und Sicherheitssystem kann später keine geschützte Navigation aufgebaut werden. Diese Phase legt das Fundament für die App-Sicherheit, sowohl im Frontend als auch Backend.

## 1.1 Datenmodellierung (DB Studio Pro State) [ERLEDIGT ✅]
*   [x] **Userlevels / Roles**: Definition des Rollen-Modells im App-Kontext (z. B. `Admin`, `Editor`, `Reader`). In DB Studio Pro durch die vollautomatische Generierung der Tabellen `sys_roles` und `sys_permissions` gelöst, inklusive Default-Rechtematrix für alle Tabellen.
*   [x] **AuthConfig State**: Speicherung, welche Art des Logins genutzt wird (SQL Datenbank oder Active Directory). Der Zustand wird direkt im globalen Backend-Config-State (`backendConfig.authConfig`) gehalten und persistiert.

## 1.2 User Interface (Konfiguration im Studio) [ERLEDIGT ✅]
Erweiterung des **Security Managers** (bereitgestellt über das obere Ribbon-Menü unter Security / Rollen):
*   [x] Ein hochgradig interaktives UI-Menü (**Security Manager**), in dem der App-Ersteller die "App-Level-Rollen" definieren kann.
*   [x] Bei der Auswahl "Active Directory" / "Windows Auth": Bereitstellung einer interaktiven Mapping-Tabelle zum Verknüpfen von App-Rollen mit physischen AD-Gruppen (z.B. Zuweisung einer AD-Gruppe wie `CN=AppAdmins` zu einer Projekthierarchie-Rolle).

## 1.3 Backend Generatoren (Die Sicherheits-Schranke) [ERLEDIGT ✅]
Das generierte Backend (.NET, Node.js, etc.) erzwingt immer das tatsächliche Recht.
*   [x] **Login Endpoints**: Automatische Code-Generierung für die Authentifizierungs-Schnittstellen und JWT-Signierung.
*   [x] **AD-Integration (LDAP/Windows)**: Wenn Windows-Auth gewählt wird, baut der Generator die LDAP-Bindungs-Logik bzw. native Active-Directory-Abfragen im Backend (z.B. über C# Web-API Native Middleware), validiert Credentials und übersetzt die komplexen AD-Gruppen transparent in ein einfaches JWT-Token mit Role-Claims für das Frontend.
*   [x] **Route-Middleware**: Generierung generischer Authentifizierungs-Attribute / Middlewares auf Controllerebene (z.B. RestrictToRoles-Checks im generierten Backend-Code bei API-Anfragen).

## 1.4 Frontend Generatoren (Das Login-Erlebnis) [ERLEDIGT ✅]
*   [x] **Login View**: Automatisches Ausrollen der fertigen Login-Komponenten auf Basis des gewählten Frameworks (Angular, Vue, React, Blazor).
*   [x] **Auth Service**: Bereitstellung von dedizierten Services für Token-Verwaltung, automatische Weiterleitung unberechtigter Aufrufe (Route Guards) und reaktive Statusvariablen (`isLoggedIn`, `currentUserRoles`).

---
*Nächster Schritt (Phase 2): Darauf aufbauend konfigurieren wir den visuellen Drag & Drop Designer (siehe `02_PHASE_NAVIGATION_UND_MENUES.md`), in dem die hier erstellten Rollen den Menüpunkten zugewiesen werden.*
