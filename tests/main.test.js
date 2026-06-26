import '../js/main.js';

describe('main.js application entry', () => {
    it('instantiates EventPoster on DOMContentLoaded', () => {
        // 1. Mock the global EventPoster constructor using Vitest syntax
        const mockInstance = {};
        window.EventPoster = vi.fn(() => mockInstance);

        // 2. Dispatch the DOM event to fire the listener
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // 3. Verify it executed and assigned the instance to the window
        expect(window.EventPoster).toHaveBeenCalledTimes(1);
        expect(window.poster).toBe(mockInstance);
    });
});