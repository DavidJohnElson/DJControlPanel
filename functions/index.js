"use strict";

const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

admin.initializeApp();

const db = admin.firestore();
const smsWebhookAuthKey = defineSecret("SMS_WEBHOOK_AUTH_KEY");

/**
 * HTTP webhook for SMS text forwarded by iOS Shortcuts.
 *
 * This function intentionally only validates, authenticates, and stores the
 * raw message. SMS parsing and categorization can be added later downstream
 * without changing the ingestion contract.
 */
exports.receiveSmsWebhook = onRequest(
  {
    secrets: [smsWebhookAuthKey],
    region: "us-central1"
  },
  async (request, response) => {
    if (request.method !== "POST") {
      response.set("Allow", "POST");
      response.status(405).json({ error: "Method not allowed. Use POST." });
      return;
    }

    const providedAuthKey = getAuthKey(request);
    const expectedAuthKey = smsWebhookAuthKey.value();

    if (!expectedAuthKey) {
      response.status(500).json({ error: "Webhook secret is not configured." });
      return;
    }

    if (providedAuthKey !== expectedAuthKey) {
      response.status(401).json({ error: "Unauthorized. Invalid auth_key." });
      return;
    }

    const messageText = readMessageText(request.body);

    if (!messageText || !messageText.trim()) {
      response.status(400).json({ error: "Missing required field: message_text must be a non-empty string." });
      return;
    }

    const documentRef = await db.collection("pending_transactions").add({
      message_text: messageText,
      received_at: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending"
    });

    response.status(201).json({
      success: true,
      message: "Pending transaction created.",
      id: documentRef.id
    });
  }
);

function getAuthKey(request) {
  return String(request.get("auth_key") || request.query.auth_key || "").trim();
}

function readMessageText(body) {
  if (!body || typeof body.message_text !== "string") {
    return "";
  }

  return body.message_text;
}
