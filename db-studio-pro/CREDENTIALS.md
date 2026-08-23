# Test Zugangsdaten für das DB Studio

Um die verschiedenen Rollen und System-Einstellungen zu testen, können folgende Zugangsdaten verwendet werden:

## 1. Administrator
Ermöglicht den Zugriff auf die **System-Einstellungen** (API-Modus, Speicherziel) sowie alle Chat- und Ticket-Funktionen.

- **E-Mail:** `admin@demo.com`
- **Passwort:** `admin123`

## 2. Standard-Benutzer
Ermöglicht den Zugriff auf Chat und Tickets, hat jedoch **keinen** Zugriff auf die System-Einstellungen.

- **E-Mail:** `user@demo.com` (oder eine beliebige andere E-Mail)
- **Passwort:** `user123`

---

### System-Verhalten
- **Nicht angemeldet:** Chat, Tickets und Cloud-Projekte sind deaktiviert bzw. ausgeblendet.
- **Speicher-Modi:** Kann in den Einstellungen zwischen `Local (Browser)` und `Server / App` umgeschaltet werden (nur Admin).
- **API-Modi:** Kann zwischen `DEMO` und `PRODUKTIV` gewechselt werden (nur Admin).
