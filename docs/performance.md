# Front-end performance (SCRUM-10)

Measured with Lighthouse (desktop preset, headless Chromium, median of 3 runs)
against the production build served by `vite preview`. "Before" is the Part 1
client; "After" adds the landing page, navigation and the changes below.
Numbers are from a developer machine, not the deployed site, so treat them as
comparable with each other, not as absolute figures.

| Metric | `/` before | `/` after | `/login` before | `/login` after |
| --- | --- | --- | --- | --- |
| Performance score | 100 | 100 | 100 | 100 |
| Accessibility score | 100 | 100 | 100 | 100 |
| Best practices score | 100 | 100 | 100 | 100 |
| SEO score | 82 | **100** | 82 | **100** |
| First Contentful Paint (ms) | 754 | 755 | 764 | 757 |
| Largest Contentful Paint (ms) | 1567 | **755** | 764 | 757 |
| Total Blocking Time (ms) | 55 | **19** | 37 | 40 |
| Cumulative Layout Shift | 0 | 0 | 0 | 0 |
| Transfer size (KB) | 89.0 | 102.0 | 88.8 | 91.0 |

In the Part 1 client `/` redirected signed-out visitors to `/login`; it is now a
real landing page, so its transfer size rises by the team logo and session list.

## What changed and why

| Change | Why | Effect |
| --- | --- | --- |
| Added a meta description and theme colour | Lighthouse flagged the missing description | SEO 82 to 100 |
| Added `robots.txt` | Without it the single-page app answered with HTML and Lighthouse reported 16 errors | Valid robots file |
| Logo served as WebP at 1.5x display size, with explicit width and height | The first version was 19 KB and Lighthouse estimated 12 KB wasted; sizes stop layout jumps | 11 KB hero logo, no layout shift |
| Reserved space for the session list | The list arrived after load and moved the footer (shift of 0.077) | Layout shift back to 0 |
| Signed-in pages load on demand | Visitors to the landing and sign-in pages should not download them | About 15 KB of page code moved out of the first download |

## Not done

The main bundle is still about 86 KB compressed, mostly React and React Router.
Lighthouse estimates about half of it is unused on the landing page, but
removing it would need a different router or server-side rendering, which is
not justified for this project.

## Re-run it

```bash
cd client && npm run build
npx vite preview --port 4173
# in another terminal
npx lighthouse http://localhost:4173/ --preset=desktop --view
```
