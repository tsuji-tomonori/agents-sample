---
name: mobile-first-web-app-ui-ux-a11y
description: Nuxt SPA の UI/UX/accessibility、レスポンシブレイアウト、チャット画面、フォーム、キーボード操作、WCAG 2.2 AA の設計・実装・レビューに使う。
---

# Mobile-First Web App UI/UX/A11y

## Target

- Treat WCAG 2.2 Level AA as the default quality bar.
- For Japan-facing UI, prefer clear Japanese labels, predictable focus order, and robust text wrapping.
- Automated checks are not sufficient by themselves; combine with keyboard, viewport, visual, and screen-reader-oriented review.

## Minimum Gate

- Keyboard-only operation works with visible focus.
- Buttons and form controls have accessible names.
- Text, icons, borders, and focus indicators have sufficient contrast.
- Touch targets are at least 24 x 24 CSS px; primary actions should be closer to 44-48 px where practical.
- Reflow works around 320 CSS px without content loss.
- Chat bubbles do not collapse into one-character vertical wrapping.
- Composer remains reachable with the virtual keyboard and across desktop/mobile widths.

## Review Output

Lead with concrete findings:

- affected screen/component
- user impact
- required fix
- verification method

If no issues are found, state what was checked and residual untested risk.
