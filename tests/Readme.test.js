import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('README.md Integrity', () => {
    let readme;
    let themes;

    beforeAll(() => {
        readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf-8');
        themes = globalThis.THEMES;
    });

    test('all local image paths reference actual files', () => {
        // Match Markdown images: ![Alt](path)
        const mdImageRegex = /!\[.*?\]\((?!https?:\/\/)(.*?)\)/g;
        // Match HTML images: <img src="path"
        const htmlImageRegex = /<img[^>]+src=["'](?!https?:\/\/)([^"']+)["']/g;

        let match;
        const checkedFiles = new Set();

        while ((match = mdImageRegex.exec(readme)) !== null) {
            const imagePath = match[1].split('?')[0]; // Strip query params
            checkedFiles.add(imagePath);
        }

        while ((match = htmlImageRegex.exec(readme)) !== null) {
            const imagePath = match[1].split('?')[0];
            checkedFiles.add(imagePath);
        }

        expect(checkedFiles.size).toBeGreaterThan(0);

        for (const file of checkedFiles) {
            const fullPath = resolve(process.cwd(), file);
            expect({ file, exists: existsSync(fullPath) }).toEqual({ file, exists: true });
        }
    });

    test('all theme demo URLs reference valid registered theme IDs', () => {
        // Match: [demo-theme-id]: https://.../demo?theme=theme-id
        const demoLinkRegex = /^\[demo-([^\]]+)\]:\s*https?:\/\/[^\s?]+\?theme=([^\s&]+)/gm;
        let match;
        let count = 0;

        while ((match = demoLinkRegex.exec(readme)) !== null) {
            const themeId = match[2];
            expect(themes).toHaveProperty(themeId);
            count++;
        }

        expect(count).toBeGreaterThan(0);
    });

    test('theme table names, image files, and demo links are aligned', () => {
        // Match pattern: **Theme Name** – ... <br> [![Alt](.github/assets/poster-xxx.avif)][demo-yyy]
        const themeCellRegex = /\*\*([^*]+)\*\*\s*–\s*\*.*?\*\s*<br>\s*\[!\[[^\]]*\]\((.*?)\)\]\[demo-([^\]]+)\]/g;
        let match;
        let count = 0;

        while ((match = themeCellRegex.exec(readme)) !== null) {
            const displayName = match[1].trim();
            const imagePath = match[2].trim();
            const demoLinkKey = match[3].trim();

            // Locate the corresponding theme from global themes list
            const matchedTheme = Object.values(themes).find(t => {
                // Check if name matches (allowing minor differences like "Art Deco Gala" vs "Art Deco")
                const cleanDisplayName = displayName.toLowerCase().replace(/soiree|gala|premiere|lounge/g, '').replace(/[^a-z0-9]/g, '').trim();
                const cleanThemeName = t.name.toLowerCase().replace(/soiree|gala|premiere|lounge/g, '').replace(/[^a-z0-9]/g, '').trim();
                return cleanThemeName.includes(cleanDisplayName) || cleanDisplayName.includes(cleanThemeName);
            });

            expect(matchedTheme).toBeDefined();

            // Ensure the link key matches the theme's ID exactly
            expect(matchedTheme.id).toBe(demoLinkKey);
            count++;
        }

        expect(count).toBeGreaterThan(0);
    });

    test('all registered themes are listed in the README, have screenshots, and have links', () => {
        const themeIds = Object.keys(themes);

        for (const id of themeIds) {
            // Check that it's listed in the bulleted themes list section
            const listPattern = new RegExp(`\\[demo-${id}\\]`);
            expect(readme).toMatch(listPattern);

            // Check that it has a screenshot reference in the tables
            const screenshotPattern = new RegExp(`\\.avif\\)\\]\\[demo-${id}\\]`);
            expect(readme).toMatch(screenshotPattern);

            // Check that the demo link is defined at the bottom
            const linkDefinitionPattern = new RegExp(`^\\[demo-${id}\\]:\\s*https?://`, 'm');
            expect(readme).toMatch(linkDefinitionPattern);
        }
    });

    test('all themes are in the same order in the README as they appear in themes.js', () => {
        const themeIds = Object.keys(themes);

        // Extract order of bulleted list theme demo references: [demo-xxx]
        const bulletRegex = /^\s*\*\s+\*\*\[.*?\]\[demo-([^\]]+)\]/gm;
        let match;
        const bulletOrder = [];
        while ((match = bulletRegex.exec(readme)) !== null) {
            bulletOrder.push(match[1]);
        }

        // Extract order of screenshot table theme demo references: [demo-xxx]
        const tableCellRegex = /\*\*([^*]+)\*\*\s*–\s*\*.*?\*\s*<br>\s*\[!\[[^\]]*\]\((.*?)\)\]\[demo-([^\]]+)\]/g;
        const tableOrder = [];
        while ((match = tableCellRegex.exec(readme)) !== null) {
            tableOrder.push(match[3]);
        }

        // The order of themes in the README lists and tables should match themes.js registration order
        expect(bulletOrder).toEqual(themeIds);
        expect(tableOrder).toEqual(themeIds);
    });
});
