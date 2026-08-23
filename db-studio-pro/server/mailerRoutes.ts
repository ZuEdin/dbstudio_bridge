import { Router } from "express";
import crypto from "crypto";
import fs from "fs";
import { DATA_DIR, SENT_EMAILS_FILE } from "./utils";

export const mailerRouter = Router();

// Get all simulated sent emails
mailerRouter.get("/sent", (req, res) => {
  try {
    if (!fs.existsSync(SENT_EMAILS_FILE)) {
      res.json([]);
      return;
    }
    const content = fs.readFileSync(SENT_EMAILS_FILE, "utf-8");
    res.json(JSON.parse(content) || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send email with simulated SMTP, security SPF/DKIM validation & logging
mailerRouter.post("/send", (req, res) => {
  try {
    const { to, subject, body, attachments, objectContext } = req.body;

    if (!to || !to.includes("@") || !to.includes(".")) {
      res.status(400).json({ error: "Ungültige E-Mail-Adresse des Empfängers." });
      return;
    }

    if (!subject) {
      res.status(400).json({ error: "E-Mail-Betreff darf nicht leer sein." });
      return;
    }

    // Read existing emails
    let emails: any[] = [];
    if (fs.existsSync(SENT_EMAILS_FILE)) {
      try {
        emails = JSON.parse(fs.readFileSync(SENT_EMAILS_FILE, "utf-8")) || [];
      } catch (e) {
        emails = [];
      }
    }

    // Simulate SMTP security
    const domain = to.split("@")[1];
    const mailId = "msg-" + crypto.randomBytes(8).toString("hex") + "@db-studio-pro.local";
    const timestamp = new Date().toISOString();
    const securityLog = [
      "Connecting to SMTP relay server smtp.dbstudio.local:587...",
      "Connection established. Starting STARTTLS handshake...",
      "TLS 1.3 negotiated successfully (ECDHE-RSA-AES256-GCM-SHA384).",
      `Looking up MX records for target domain: ${domain}...`,
      `Found MX record: mail.${domain} (Preference: 10).`,
      `SPF (Sender Policy Framework) aligned and validated for domain dbstudio.local.`,
      `DKIM (DomainKeys Identified Mail) signature generated & aligned.`,
      "SMTP Envelope Senders: <noreply@dbstudio.local> -> <" + to + ">",
      `Transmission accepted by remote SMTP server. Queue-ID: ${crypto.randomBytes(4).toString("hex").toUpperCase()}`
    ];

    const newEmail = {
      id: crypto.randomUUID(),
      messageId: mailId,
      to,
      from: "noreply@dbstudio.local",
      subject,
      body,
      attachments: attachments || [],
      objectContext: objectContext || null,
      timestamp,
      securityLog,
      status: "DELIVERED"
    };

    emails.unshift(newEmail);
    if (emails.length > 100) emails = emails.slice(0, 100);

    fs.writeFileSync(SENT_EMAILS_FILE, JSON.stringify(emails, null, 2), "utf-8");

    res.json({
      success: true,
      messageId: mailId,
      recipient: to,
      timestamp,
      smtpLog: securityLog,
      status: "DELIVERED"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// JSON backup download router endpoint (originally mounted on /api/backup/download)
export const backupRouter = Router();

backupRouter.post("/download", (req, res) => {
  try {
    const { filename, content } = req.body;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    res.send(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
