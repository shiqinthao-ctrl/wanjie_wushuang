# P2b experience and choice rules

Pure TypeScript XP field and progression modules preserve 4/18 base XP,
180-crystal overflow conservation, 240px attraction, 26px collection, 540px/s
movement, collection-before-attraction order, original level thresholds and pools.
GameCore carries the progression snapshot and choice commands; Phaser draws
crystals and consumes pickup events. Vue contains the XP/HP rail and choice UI.
No synthetic spawns or public debug controls were added.

34 crystal cases, 15 eligibility pools and six choice chains were captured from
isolated old Chrome rules. Vitest covers these plus invalid XP, immutable views,
blocked checks, maxed builds and stale/repeated selection tokens. Total: 244 pass.

The old random sort comparator produces different ordering in Node and Chrome.
Eligibility sets are compared in Vitest; verify-progression.mjs additionally
compares all 15 exact ordered pools between old/new in the same Chrome engine.
The comparator was preserved, not replaced. This is synthetic rule evidence.

Legacy five gates, 49 hashes and strict production build pass. All six Chrome
lifecycle checks after display/focus cleanup pass. Portrait screenshots
were inspected; health display now rounds for presentation only.

Natural kill -> pickup -> upgrade acceptance and interactive upgrade-modal
acceptance remain pending combat integration. Physical devices remain pending.

Reproduce: node tasks/mobile-modernization/capture-progression.mjs
Verify: node tasks/mobile-modernization/verify-progression.mjs
App gates: npm run verify --prefix apps/mobile-next
