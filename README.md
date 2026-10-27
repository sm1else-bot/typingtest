# Typing Test

A React and TypeScript typing test by Jessenth Ebenezer. The original Octopus (random words), Dolphin (simple sentences), and Owl (sophisticated literature) modes and dark/pink interface are retained, with 15-, 30-, and 60-second tests.

## Run and verify

Use Node.js 22.12 or later:

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
npm run preview
```

The static site is built into **`dist/`**. There is no Express process, API, database, account, or server-side score store. Historical commits remain intact.

For real-browser checks, install Chromium with `npx playwright install chromium`, start the dev or preview server, then run `npm run test:browser`. Set `SITE_URL` to the server address (default `http://127.0.0.1:5173/`). `MOZHI_TEST_BROWSER` can point to an existing Chrome executable. Tests use an isolated browser and controllable clock, covering all nine mode/duration combinations, corrections, timing boundaries, restart, persistence, blocked storage, responsive layouts, branding, and absence of backend requests. `npm test` exercises the pure scoring engine with deterministic timestamps.

## Measurement rules

- Start arms and focuses the test. The first inserted character starts `performance.now()` timing. Idle time before that is free.
- A fixed deadline is `startedAt + duration`. Callbacks sample elapsed time rather than counting interval ticks. Late callbacks still finish at the original deadline; post-deadline characters are rejected. Leaving the tab does not pause the timer.
- **Gross WPM** = all inserted characters / 5 / elapsed minutes. Spaces and punctuation count. Replacements and retyped corrections count as new attempts. Backspace adds no credit.
- **Net WPM** = correctly matched characters remaining in the input / 5 / elapsed minutes. Incorrect and deleted characters earn no net credit. Mistakes also consume time. This definition differs from tests that subtract whole errors per minute or multiply gross WPM by accuracy.
- **Accuracy** = correct insertion attempts / all insertion attempts. An incorrect attempt remains in this history after correction; backspacing does not undo it. Empty tests show 0%.
- Input remains continuous across spaces, so words can be corrected using backspace or selection. Feedback uses that exact text rather than a separate committed-word buffer.
- Rounding happens only for display. Final metrics freeze at the exact deadline, or at the actual input timestamp if the entire passage is filled first. Average WPM can fall during pauses.
- Paste and dropping text are disabled. This is practice software, not a cheating-resistant competition. Mobile/IME replacement counts actual inserted characters; results may differ from physical-keystroke tests.

The old timer charged the delay after Start, measured seconds using recreated React intervals, cleared input at each space, and applied an unjustified 1.05 multiplier. Its space weighting was algebraically equivalent to five-character words; the multiplier was inflation, not a correction. The fixes address first-input timing, precise elapsed time, continuous input, attempt accounting, and frozen results.

## Passages and personal bests

All original passage banks are preserved in `client/src/lib/passages.ts`. Random selections are combined locally into a passage long enough for fast 60-second tests. No text or score endpoint is contacted.

The old backend stored scores in a process-local Map, shared only for that server process's lifetime. It had no durable leaderboard database. The new application does not call local scores a global leaderboard or attempt to migrate ephemeral server scores.

Personal bests are stored by **mode and duration**, ranked by unrounded net WPM, under `typing-test.personal-bests.v1` in `localStorage`. Completed tests save automatically. Clearing site data removes them; a different domain has separate storage. Blocked or full storage does not prevent testing and shows a save warning. Scores are never uploaded.

## Cloudflare Pages

Connect the existing **`sm1else-bot/typingtest`** repository through **Workers & Pages → Create application → Pages → Connect to Git**:

| Setting | Value |
| --- | --- |
| Framework | React (Vite) |
| Production branch | `main` |
| Root directory | Repository root (leave blank) |
| Build command | `npm run check && npm test && npm run build` |
| Output directory | `dist` |
| Node | `22` (`.node-version`, or `NODE_VERSION=22`) |
| Environment variables / secrets | None required |

`_redirects` provides static SPA fallback. No Workers, Pages Functions, database, or paid infrastructure is required. Future production-branch pushes rebuild automatically. GitHub Actions independently checks the build and browser behavior.

No Pages hostname is recorded here because a deployment has not yet been verified. Use the actual **Production URL** shown by Cloudflare after its first successful deployment.

### Custom domain, after verifying Pages

No DNS changes are part of this migration.

1. Open the Pages project's **Custom domains → Set up a custom domain** and enter your chosen full subdomain.
2. With external DNS such as Netlify DNS, add a **CNAME** named for that subdomain label, targeting the actual production `*.pages.dev` hostname displayed by Cloudflare. Use only the hostname, without `https://` or a path, and the provider's default TTL.
3. Complete validation and wait for HTTPS. Associate the domain with the Pages project before adding DNS; a CNAME alone is insufficient.

Official references: [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/), [build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/), [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).
