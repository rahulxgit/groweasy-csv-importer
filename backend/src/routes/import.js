import { Router } from 'express';
import multer from 'multer';
import { parseCsvBuffer } from '../utils/csvParser.js';
import { chunkRows } from '../utils/batch.js';
import { extractBatch } from '../services/aiExtractor.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches the spec
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new Error('Only CSV files are supported'));
    }
    cb(null, true);
  },
});

const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 25;

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  let parsed;
  try {
    parsed = parseCsvBuffer(req.file.buffer);
  } catch (err) {
    return res.status(400).json({ error: `Could not parse CSV: ${err.message}` });
  }

  const { headers, rows } = parsed;
  const batches = chunkRows(rows, BATCH_SIZE);

  const results = await Promise.all(
    batches.map((batch, i) => extractBatch(headers, batch, i))
  );

  const records = results.flatMap((r) => r.records);
  const skippedFromFailedBatches = results.reduce((sum, r) => sum + r.skippedCount, 0);
  const failedBatches = results.filter((r) => r.failed).length;

  // rows that came back from a successful batch but the AI itself decided to skip
  // (no email/phone) - we only know this indirectly by counting what we sent vs got back,
  // since Claude just omits those rows rather than flagging them
  const successfulBatchInputRows = batches.reduce((sum, b, i) => (
    results[i].failed ? sum : sum + b.length
  ), 0);
  const skippedByAI = successfulBatchInputRows - records.length;

  res.json({
    totalRows: rows.length,
    totalImported: records.length,
    totalSkipped: skippedFromFailedBatches + skippedByAI,
    records,
    meta: {
      batchCount: batches.length,
      failedBatches,
    },
  });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes('CSV')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
