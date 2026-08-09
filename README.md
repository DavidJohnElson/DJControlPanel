# Nexa

A lightweight personal life dashboard skeleton for managing finances, health, routines, and tasks.

## Current Scope

This first phase is a static local frontend only:

- Landing page with Nexa navigation.
- Finance section enabled.
- Health, Routines, and Tasks placeholders marked as coming soon.
- Finance tabs for Budget Overview, Daily Transactions, Calendar, and Annual Goals.
- Rotating hardcoded quote slider.
- Plain HTML, CSS, and JavaScript with no framework, backend, database, or external libraries.

## Local Development

Open `index.html` directly in a browser, or serve the folder with any simple static server:

```bash
python3 -m http.server 5173
```

Then visit:

`http://localhost:5173`

Firebase authentication and Telegram integrations are intentionally not included in this step.

## SMS Webhook Function

The `functions/` folder contains a Firebase Cloud Function called `receiveSmsWebhook`.
It accepts an authenticated HTTP `POST` from iOS Shortcuts and stores raw SMS text in the
Firestore collection `pending_transactions`.

Before deploying, set the shared secret:

```bash
firebase functions:secrets:set SMS_WEBHOOK_AUTH_KEY
```

Deploy the function:

```bash
firebase deploy --only functions
```

Example request:

```bash
curl -X POST "https://REGION-PROJECT_ID.cloudfunctions.net/receiveSmsWebhook?auth_key=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"message_text":"Sample bank SMS text"}'
```

Successful requests create a document with `message_text`, `received_at`, and `status: "pending"`.
Requests without the correct `auth_key` are rejected.
