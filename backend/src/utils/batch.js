// splits rows into chunks of `size`. picked 25 as default - big enough that we're not
// making a call per row, small enough that Claude doesn't lose track of individual rows
// in a huge prompt and start mixing up fields between rows
export function chunkRows(rows, size = 25) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
}
