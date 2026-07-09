import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CRM_STATUS_VALUES = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
const DATA_SOURCE_VALUES = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];

const CRM_FIELDS = [
  'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
  'company', 'city', 'state', 'country', 'lead_owner', 'crm_status', 'crm_note',
  'data_source', 'possession_time', 'description',
];

function buildSystemPrompt() {
  return `You are a data extraction engine for GrowEasy, a real estate CRM. You will be given raw rows from a CSV export (headers can be anything - Facebook lead export, Google Ads export, a manually made spreadsheet, whatever the user happened to upload) and you must map them onto GrowEasy's fixed CRM schema.

Output format: return ONLY a JSON array. No markdown fences, no explanation, no leading/trailing text. Just the array. Each element is one CRM record object with exactly these fields:
${CRM_FIELDS.join(', ')}

Field rules:
- created_at: must be a date string parseable by JavaScript's "new Date(created_at)". If the source row has a recognizable date/timestamp, convert it. If nothing usable exists, leave it blank.
- crm_status: MUST be exactly one of ${CRM_STATUS_VALUES.join(', ')}, or an empty string if you cannot confidently tell. Never invent a value outside this list.
- data_source: MUST be exactly one of ${DATA_SOURCE_VALUES.join(', ')}, or an empty string if there's no confident match. Do not guess if it's ambiguous.
- If a row has more than one email address, use the first as "email" and append the rest into crm_note (e.g. "Additional emails: x@y.com, z@y.com").
- Same rule for phone numbers - first one goes to mobile_without_country_code, extras go into crm_note.
- country_code should be a dialing code like +91, +1 etc, separate from the phone number itself. Default to +91 only if the row clearly indicates an Indian number and no explicit code is present; otherwise leave blank.
- crm_note is a catch-all - stuff any useful info that doesn't map cleanly to another field in there (extra contact info, source campaign name, tags, whatever).
- SKIP the row entirely (do not include it in the output array) if it has neither an email nor a mobile number anywhere in it. Don't output a partial record for these.
- Do not fabricate data. If a field genuinely isn't present in the row, leave it as an empty string - don't make something up to fill it.
- Match columns by meaning, not just exact name. "Lead Name" / "full_name" / "Contact Name" all mean "name". "Phone" / "Mobile No" / "contact_number" all mean the mobile field. Use your judgment on messy or abbreviated headers.

Return valid JSON only. The array length can be less than the number of input rows if some rows were skipped.`;
}

function buildUserPrompt(headers, rows) {
  const rowsAsText = rows.map((row, i) => {
    const fields = headers.map((h) => `${h}: ${row[h] ?? ''}`).join(' | ');
    return `Row ${i + 1}: ${fields}`;
  }).join('\n');

  return `CSV headers: ${headers.join(', ')}\n\nRows:\n${rowsAsText}\n\nExtract and map these ${rows.length} rows into the CRM schema following the rules above.`;
}

function stripJsonFences(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
}

async function callClaude(headers, batch) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserPrompt(headers, batch) }],
  });

  const textBlock = response.content.find((c) => c.type === 'text');
  if (!textBlock) throw new Error('no text in AI response');

  const cleaned = stripJsonFences(textBlock.text);
  const parsed = JSON.parse(cleaned); // throws if malformed, caller handles retry

  if (!Array.isArray(parsed)) throw new Error('AI response was not an array');
  return parsed;
}

// one retry on failure (malformed JSON, API error, etc). if the retry also fails,
// this batch's rows are marked skipped and the reason gets logged - we don't want
// one bad batch taking down the whole import
export async function extractBatch(headers, batch, batchIndex) {
  try {
    const records = await callClaude(headers, batch);
    return { records, skippedCount: 0, batchIndex };
  } catch (firstErr) {
    console.error(`batch ${batchIndex} failed, retrying:`, firstErr.message);
    try {
      const records = await callClaude(headers, batch);
      return { records, skippedCount: 0, batchIndex };
    } catch (secondErr) {
      console.error(`batch ${batchIndex} failed again, giving up on it:`, secondErr.message);
      return { records: [], skippedCount: batch.length, batchIndex, failed: true };
    }
  }
}
