# Qipi profile redesign — design QA

## Result: blocked

### Visual reference

- User screenshots: `/tmp/codex-clipboard-c586c777-5c52-469d-aaa3-f125fb6c5bbb.png`, `/tmp/codex-clipboard-558475ee-54fd-4ab3-86d6-58e7ed2db9dc.png`, and `/tmp/codex-clipboard-99822b95-2209-4f5e-99b8-0ac14d1ab052.png`.
- Local preview: `http://127.0.0.1:4173/dara-demo-emouser001`.
- Captured and inspected the local profile in the in-app browser at its available desktop viewport (about 1100 × 900).

### Checked

- Shared profile header places the avatar, name, username, and post/follower/following counts together.
- Bio, interest tags, and profile actions follow the header with consistent spacing.
- Posts render in a three-column square grid; uploaded media uses lazy loading and posts without media get a Qipi travel-art fallback.
- Owner-only tabs and edit actions remain conditional. Public profiles retain follow, message (for non-demo users), and share actions.
- Story highlights, the personal-profile overflow menu, and the dashboard are absent.
- Responsive CSS rules are present for widths at or below 700 px and 360 px.
- Production build, JavaScript syntax checks, and `git diff --check` passed.

### Blocker

The available in-app browser session did not provide a supported way to set a mobile viewport. The mobile breakpoints were reviewed in code, but the profile was not visually captured at a phone width. A mobile screenshot is needed to complete responsive visual QA.
