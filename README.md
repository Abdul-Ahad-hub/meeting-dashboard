# Meet Engagement Dashboard

A Google-style (Material 3, light and dark) dashboard for the data collected by the
Meet Recorder extension. It reads live data from the
[Google Meet Engagement Analysis Wrapper](https://github.com/Abdul-Ahad-hub/Google-meet-engagement-analysis-wrapper)
backend, scoped to the signed-in Google account.

## What it shows

- **Overview**: meeting count, average engagement, analysed time, face visibility, an
  engagement trend across meetings, outcome breakdown, engagement by role and by time
  of day, and plain-language highlights.
- **Sessions**: searchable, filterable list of every recorded meeting.
- **Session detail**: engagement timeline per 10-second window, a window strip, breakdown,
  sustained attention dips, and capture-quality metrics.

Engagement is derived from the model output stored per window: level `1` = engaged,
`0` = not engaged, and `confidence` is the certainty of that class. The mapping lives in
`lib/engagement.ts`.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Google Meet Wrapper backend base URL. Defaults to `https://google-meet-engagement-analysis-wrapper.vercel.app`. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth **Web application** client ID. |

### Google sign-in

1. In Google Cloud Console, open *APIs & Services → Credentials → Create credentials →
   OAuth client ID* and choose **Web application**.
2. Add your dashboard origins under **Authorized JavaScript origins**
   (e.g. `http://localhost:3000` and your deployed URL).
3. Put the client ID in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Use the same Google project as the
   extension so the same test users can sign in.

The dashboard calls `GET /engagement/me/sessions` and `GET /engagement/me/sessions/:id`
with the Google access token; the wrapper verifies it and returns only that user's data.
