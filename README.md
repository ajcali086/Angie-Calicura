# Angie — design pilot

Michael Dykhorst's article for Sheridan Wyoming History, _Angelina "Angie" Colacurcio (Calicura) Amato Alexander: A Life of Hospitality, Enterprise and Reinvention_, set in the architecture of [The Spirit of Martinez](https://github.com/ajcali086/spirit-of-martinez).

Original post: https://www.sheridanwyominghistory.com/post/angelina-angie-colacucio-calicura-amato-alexander-a-life-of-hospitality-enterprise-and-reinven

**Preview only.** Every page carries `noindex, nofollow`. There is no production deployment.

## How it's built

- `source/article.md` is the transcript of the post, and nothing on the site is typed from it by hand. `src/data/article.ts` parses the transcript into chapters, passages, quotes, lists and plates.
- `scripts/embed-article.mjs` copies the transcript into `src/data/article.source.ts`, so the browser and the tests read the same file. Rerun it after editing `source/article.md`.
- The one editorial choice is where the chapters break. The three titles are the three stations in the post's own subtitle.
- Timeline events, named sources and the Left Open entries quote the post verbatim. Each links back to where the post says it.

## Pages

| Route                      | What it is                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `/`                        | Title, opening line, the three parts, doors into each room                           |
| `/chapters/$slug`          | The article, in three parts, with its plates inline                                  |
| `/timeline`                | Every date the post gives for Angie's life, by decade                                |
| `/archive`, `/archive/$id` | All 39 plates with the post's captions                                               |
| `/sources`                 | The article, the newspapers in the plates, records named in the text, and the thanks |
| `/left-open`               | The two questions the post itself leaves open                                        |

## Images

34 of the 39 plates have images, web-sized from the original uploads, with plates 12 and 39 from the family's own Kodachrome scans (`src/data/plateImages.ts`). Still missing:

- plates 13 and 31, which are not in the media manifest
- plates 33, 35 and 38, which were lost when the fourth media zip was cut off in upload

Those plates show their caption in a frame marked "Image not yet added".

## Reading

A scroll meter (a neon hairline across the top of every page) fills as you read down it. A Top button appears once you're well down a page, sits above the player, and hides while the footer is in view. A skip link takes keyboard users past the header. All three are ported from spirit-of-martinez's `ReadingChrome`.

## Audio

The article read aloud, in the five TTS parts listed in `source/audio-part-map.md` (`public/audio/angie-a1.mp3` … `angie-a3b.mp3`, about 52 minutes). These features follow spirit-of-martinez:

- **Player:** docked at the bottom and kept across pages. Play and pause, back and forward 15 seconds, a scrubber, previous and next part, speed, and a Follow switch. It moves on to the next part by itself and remembers where you stopped. While Follow is on, the player shrinks to a slim bar (play, part, progress) and expands when tapped. The part's name is a link to the exact paragraph being read: tapping it opens the chapter there and turns Follow on.
- **Follow-along:** the paragraph being read is highlighted, in step with the audio, and a plate lights up while its caption is read. With Follow on, the page brings each paragraph into view as it begins (a long one from its top) and turns to the next chapter when the narration does. Scrolling by hand turns Follow off and brings back the full player.
- **Listen:** buttons on the home page ("Listen to the article"), at the top of each chapter, beside each timeline, source and Left Open entry, and on plate pages (the passage, or just the caption).
- **Link cards:** "Share this moment" on every paragraph a plate sits beside. It shares an image card (the plate, the passage, a Listen badge), a WAV clip of the passage, and a link that opens the page with a "Listen from this passage" button (`?listen=1#block`). Where a device can't share files, it copies the link.
- **Snippet cards:** each plate page shows the story-sized card for its passage, to share as an image.
- **Zoom:** tap a plate on its own page to see it full size, for reading the small print of a clipping.

**Timing.** The recording was read from `source/narration-script.md`: the article normalized for speech, with numbers written out, "Photograph." before each caption, and abbreviations expanded. The script matches the site block for block, with lists read item by item and the thanks read as one line (`scripts/lib/narration.ts`). `scripts/align-audio.ts` times the sentences:

1. It decodes each MP3 in headless Chromium.
2. It finds every pause.
3. It gives each sentence the pause it most plausibly ends on, from its length at the part's speaking rate, preferring longer pauses at paragraph ends.

The result is `src/generated/cues.json`. The page highlights paragraphs, where the timing is surest; sentence times are estimates. `src/data/audio.test.ts` checks the structure: every sentence has exactly one cue, the cues run forward in time, and no sentence of 25 or more printed characters is timed faster than 30 or slower than 6 characters a second. `src/data/narration.test.ts` checks the script against the site (block for block, every caption read as "Photograph. …") and holds the pacing of the spoken text tighter: between 8 and 30 characters a second. Rerun the script if the audio, the script or the transcript changes:

```
node --experimental-strip-types --import ./scripts/test-register.mjs scripts/align-audio.ts
```

## Develop

```
npm install
npm run dev      # http://localhost:8080
npm test         # transcript round-trip, links, verbatim quotes, audio cues, cards
npm run typecheck && npm run lint
```

## Title image

The title screen shows plate 39, "Another 1940s photo of Angie from her nephew Andrew Calicura", from the family's own Kodachrome scan, with its caption. `src/data/titleImage.ts` keeps the title screen to the post's plates.
