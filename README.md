# Angie — design pilot

Michael Dykhorst's article for Sheridan Wyoming History, *Angelina "Angie" Colacucio (Calicura) Amato Alexander: A Life of Hospitality, Enterprise and Reinvention*, set in the architecture of [The Spirit of Martinez](https://github.com/ajcali086/spirit-of-martinez).

Original post: https://www.sheridanwyominghistory.com/post/angelina-angie-colacucio-calicura-amato-alexander-a-life-of-hospitality-enterprise-and-reinven

**Preview only.** Every page carries `noindex, nofollow`. There is no production deployment.

## How it's built

- `source/article.md` is the transcript of the post, and nothing on the site is typed from it by hand. `src/data/article.ts` parses the transcript into chapters, passages, quotes, lists and plates.
- `scripts/embed-article.mjs` copies the transcript into `src/data/article.source.ts`, so the browser and the tests read the same file. Rerun it after editing `source/article.md`.
- The one editorial choice is where the chapters break. The three titles are the three stations in the post's own subtitle.
- Timeline events, named sources and the Left Open entries quote the post verbatim. Each links back to where the post says it.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Title, opening line, the three parts, doors into each room |
| `/chapters/$slug` | The article, in three parts, with its plates inline |
| `/timeline` | Every date the post gives for Angie's life, by decade |
| `/archive`, `/archive/$id` | All 39 plates with the post's captions |
| `/sources` | The article, the newspapers in the plates, records named in the text, and the thanks |
| `/left-open` | The two questions the post itself leaves open |

## Images

33 of the 39 plates have images, web-sized from the original uploads (`src/data/plateImages.ts`). Still missing:
- plates 13 and 31, which are not in the media manifest
- plates 33, 35, 38 and 39, which were lost when the fourth media zip was cut off in upload

Those plates show their caption in a frame marked "Image not yet added".

## Develop

```
npm install
npm run dev      # http://localhost:8080
npm test         # transcript round-trip, links, verbatim quotes
npm run typecheck && npm run lint
```
