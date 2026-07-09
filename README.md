# GrowEasy CSV Importer

AI-powered CSV importer that takes leads from any export format (Facebook, Google Ads, random spreadsheets, whatever) and maps them onto GrowEasy's CRM schema using Claude.

Built for the GrowEasy Software Developer assignment.

## Structure

```
groweasy-csv-importer/
  backend/     Express API, does the CSV parsing + AI extraction
  frontend/    Next.js app - upload, preview, confirm, results
```

## Running locally

### Backend

```
cd backend
npm install
cp .env.example .env
# add your ANTHROPIC_API_KEY to .env
npm run dev
```

Runs on `http://localhost:8080` by default.

### Frontend

```
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Runs on `http://localhost:3000`. Make sure `NEXT_PUBLIC_API_URL` in `.env.local` points at wherever the backend is running.

## Env vars

**Backend**
- `ANTHROPIC_API_KEY` - required, used for the extraction calls
- `PORT` - defaults to 8080
- `BATCH_SIZE` - rows sent to Claude per call, defaults to 25
- `FRONTEND_URL` - used for CORS, set to your deployed frontend URL in prod

**Frontend**
- `NEXT_PUBLIC_API_URL` - base URL of the backend API

## How the import flow works

1. User uploads a CSV. It's parsed client-side with papaparse purely for the preview table - no AI call happens here.
2. On confirm, the raw file gets sent to the backend as multipart form data.
3. Backend parses it server-side (csv-parse), splits the rows into batches (25 rows by default), and sends each batch to Claude in parallel.
4. Each batch call includes the original headers and raw row data, plus a system prompt that has the full CRM schema, the enum constraints for `crm_status` and `data_source`, and the extraction rules (multiple emails/phones, skip conditions, date parsing requirement etc).
5. Claude returns a JSON array per batch. Batches get merged into one result set along with import/skip counts.
6. If a batch's response fails to parse as valid JSON (or the API call itself errors), we retry that batch once. If it fails again, those rows are counted as skipped and the failure is logged server-side - we don't fail the whole import over one bad batch.

## AI mapping approach

The core problem is that column names are never consistent across sources - "Phone", "Mobile No", "contact_number" all mean the same field, and a Facebook lead export looks nothing like a Google Ads one. Rather than trying to hand-write column matching rules (which breaks the moment a new format shows up), the system prompt gives Claude the full CRM schema plus explicit rules for the ambiguous cases (multiple contacts, invalid status values, missing required fields) and lets it do the semantic matching per row. Batching rows in groups of ~25 keeps each prompt small enough that the model doesn't start mixing up fields between rows, while still being efficient enough that a few hundred row CSV doesn't take forever.

One thing that mattered a lot here: the prompt explicitly tells Claude to leave a field blank rather than guess when it's not confident (especially for `crm_status` and `data_source`, since those are constrained to fixed enums). Without that instruction the model tends to force a "best guess" match even when there's nothing in the row to support it.

## Known limitations

- No persistence - this is stateless, in-memory processing per request. Refreshing the page loses the last import.
- Very large CSVs (10k+ rows) will make a lot of parallel Claude calls in one request, which could hit rate limits. Would want a queue-based approach for that scale.
- The AI-skip count is inferred by comparing batch input size to output size, not returned explicitly - works fine but is a bit indirect. Would rather have Claude return skip reasons directly if the schema allowed for it without breaking the JSON contract.
- No auth on the import endpoint since this is a standalone demo, would need that for the real thing.

## Deployment

- Frontend: Vercel (root directory set to `frontend`)
- Backend: Render, using `backend/render.yaml`, or manually set root directory to `backend`, build command `npm install`, start command `npm start`
