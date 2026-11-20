import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';

const root = process.cwd();
const read = (f) => readFileSync(resolve(root, f), 'utf-8');

// Resolve a local reference found in an HTML file the way a browser would on the deployed site.
function resolveRef(file, ref) {
    const clean = ref.split(/[?#]/)[0];
    let p = clean.startsWith('/') ? clean.slice(1) : join(dirname(file), clean);
    if (p === '' || p.endsWith('/')) p += 'index.html';
    return p;
}

describe('Site layout (landing at /, app at /app/, remote at /remote/)', () => {
    test.each(['index.html', 'app/index.html', 'remote/index.html', '404.html'])(
        '%s only references files that exist',
        (file) => {
            const html = read(file);
            const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
                .map((m) => m[1])
                .filter((r) => !/^(https?:|mailto:|data:|\/\/|#)/.test(r));
            expect(refs.length).toBeGreaterThan(0);
            for (const ref of refs) {
                const target = resolveRef(file, ref);
                expect({ file, ref, exists: existsSync(resolve(root, target)) }).toEqual({ file, ref, exists: true });
            }
        }
    );

    test('theme image assets resolve from the site root', () => {
        const themes = read('js/themes.js');
        const urls = [...themes.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]);
        expect(urls.length).toBeGreaterThan(0);
        for (const u of urls) {
            expect(u.startsWith('/assets/')).toBe(true);
            expect(existsSync(resolve(root, u.slice(1)))).toBe(true);
        }
    });

    test('remote pairing link is built as a sibling of /app/', () => {
        const src = read('js/modules/RemoteManager.js');
        expect(src).toContain("new URL('../remote/'");
        const build = (href, code) =>
            `${new URL('../remote/', href.replace(/[?#].*$/, '')).href}?code=${code}`;
        for (const page of ['https://x.test/app/', 'https://x.test/app/index.html', 'https://x.test/app/?theme=spring', 'https://x.test/app']) {
            expect(build(page, 'ABC123')).toBe('https://x.test/remote/?code=ABC123');
        }
    });

    test('landing page forwards legacy query and hash links to /app/', () => {
        const html = read('index.html');
        expect(html).toContain("if (q) location.replace('/app/' + q + h)");
    });

    test('every docs article is in the search index', () => {
        const index = JSON.parse(read('docs/search-index.json'));
        expect(index.length).toBeGreaterThanOrEqual(9);
        for (const entry of index) {
            expect(existsSync(resolve(root, 'docs', entry.path, 'index.html'))).toBe(true);
        }
    });
});
