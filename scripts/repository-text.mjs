import crypto from 'node:crypto'

export const normalizeLineEndings = text => text.replaceAll('\r\n', '\n')
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex')

// Git checkouts/archives may change CRLF to LF. No other bytes may change.
// Preserve the approved manifest rather than regenerate its baseline.
export function matchesTextBaseline(bytes, expected) {
  if (sha256(bytes) === expected) return true
  const lf = normalizeLineEndings(bytes.toString('utf8'))
  return sha256(lf) === expected || sha256(lf.replaceAll('\n', '\r\n')) === expected
}
