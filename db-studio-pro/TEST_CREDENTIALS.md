# DB Studio Pro - Test Credentials

Dieses Dokument enthält die Standard-Anmeldedaten (Credentials) für Testzwecke in **DB Studio Pro**.

Die Zugangsdaten sind sowohl im lokalen IndexedDB-Benutzerspeicher (`sys_users` / `users`) als auch als direktes Fallback im Authentifizierungssystem hinterlegt.

---

## 1. Standard-Benutzerkonten (Standard Accounts)

Die folgenden Benutzerkonten sind standardmäßig registriert und verfügen über unterschiedliche Berechtigungsrollen:

| Benutzername | Passwort | E-Mail | Rolle (Role) | Berechtigungsstufe |
| :--- | :--- | :--- | :--- | :--- |
| **admin** | `admin` oder `admin123` | `admin@demo.com` | **Admin** | Administrator (Voller Zugriff, Einstellungen sichtbar) |
| **manager** | `manager123` | `manager@demo.com` | **Manager** | Projektmanager (Verwaltung von Schemata) |
| **editor** | `editor123` | `editor@demo.com` | **Editor** | Redakteur (Bearbeitung von Daten) |
| **user** | `user` oder `user123` | `user@demo.com` | **User** | Standardnutzer (Nur Lesezugriff) |

---

## 2. Datenbank-Integration & Struktur

Sämtliche Benutzerkonten werden bei Aktivierung des Benutzer-Logins automatisch in der Tabelle `sys_users` (bzw. dem IndexedDB-Store `sys_users`/`users`) mit entsprechenden Passwort-Hashes, Rollen und Aktivitätsstatus initialisiert.

- **Verschlüsselung / Casing:** Die API sucht flexibel und case-insensitiv nach Spaltenbezeichnungen wie `Username`, `PasswordHash`, `RoleId` und `IsActive`, um maximale SQL/MySQL-Kompatibilität zu garantieren.
- **Rollensystem:**
  - `RoleId: 1` &rarr; Admin
  - `RoleId: 2` &rarr; Manager
  - `RoleId: 3` &rarr; Editor
  - `RoleId: 4` &rarr; User
