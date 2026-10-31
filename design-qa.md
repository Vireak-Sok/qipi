# Qipi page consistency refinements — design QA

## Result: partial; mobile and data-backed states blocked

### Visual references

- Mobile profile: `/tmp/codex-clipboard-33214dd6-b610-4fbe-9de6-2179b7176aff.png`
- Desktop profile: `/tmp/codex-clipboard-e1809757-a862-47b8-81a8-609adbd390c8.png`
- Local production preview: `http://127.0.0.1:4177`
- Browser viewport shown: about 1100 × 880.

### Checked in the local preview

- Feed search presents one visible field without a second outlined form container.
- At compact desktop width, the Settings content has balanced page margins and no longer sits underneath the fixed right rail.
- The Messages page no longer displays a redundant “Messages” heading; its signed-out state remains intact.
- Shared page headings use a smaller size hierarchy.
- The production build completed successfully.

### Implementation reviewed

- Profile identity card and tabs use the framed card treatment again. The existing profile content order remains unchanged, and the loading state now uses the same card frame.
- The message detail loading skeleton now includes header, conversation bubbles, and composer regions.
- Mobile Settings width is constrained to provide equal side gutters; mobile title and message-skeleton sizing rules are present.

### Blockers

- The local profile API returned “Profile not found” for available slugs, so the populated profile card could not be visually compared against the references.
- The local preview was signed out, so the message detail skeleton could not be reached beyond the sign-in gate.
- The in-app browser viewport control did not change the captured viewport from about 1100 × 880; mobile spacing could not be visually verified. The mobile CSS was reviewed but needs a phone-width screenshot for final visual QA.
