// Fails the build if private/dev strings or unexpected files reach dist/. Run after `npm run build`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const BAD_FILES = ['.map', '.env', '.pem', '.key'];
const BAD_TEXT = [/localhost/i, /\/Users\//, /\+91\s?\d{5}/, /127\.0\.0\.1/, /astra-financial-platform/i, /api[_-]?key/i, /secret/i, /sourceMappingURL/, /gho_[A-Za-z0-9]/];
const REVIEW = ['.pdf', '.mp4', '.mov', '.png', '.jpg', '.jpeg', '.webp']; // must be owner-approved assets

let bad = 0;
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
for (const f of walk('dist')) {
  const ext = extname(f);
  if (BAD_FILES.includes(ext)) { console.error('BAD FILE', f); bad++; }
  if (REVIEW.includes(ext)) console.log('REVIEW (confirm owner-approved):', f);
  if (['.html', '.js', '.css', '.json', '.svg', '.txt', '.xml'].includes(ext)) {
    const t = readFileSync(f, 'utf8');
    for (const re of BAD_TEXT) if (re.test(t)) { console.error('BAD TEXT', re, 'in', f); bad++; }
  }
}
console.log(bad ? `audit FAILED (${bad})` : 'audit passed');
process.exit(bad ? 1 : 0);
