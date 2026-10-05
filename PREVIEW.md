# Preview: what `mw pull` writes

This branch is the museum `mw init` generated, after one real run of
`mw pull --propose`. Everything here was written by the tool; nothing was
edited by hand except this file. Browse it on GitHub.

**Two stand-ins, so read it as a preview, not the museum:**

- **The page** is the local copy of the Sheridan post that the tests use
  (Museumwright-'s `test/fixtures/angie`): the transcript's text and
  captions verbatim, the pilot's plates, in a blog page with nav, ads,
  share bar, comments and footer. The sandbox couldn't reach the live
  site, so every `source.url` reads `http://127.0.0.1:8765/post/angie`.
- **The model** is a test stand-in, not Qwen. It "notices" names from a
  fixed list, plus a made-up one and a misspelled one per passage, which
  the span rule must drop. Each proposal says `"model": "stand-in-NOT-a-model"`.

## Where to look

| What | Where |
|---|---|
| The page, as one record, its text as 23 passages | [`src/model/records/r-0001.json`](https://github.com/ajcali086/Angie-Calicura/blob/claude/mw-preview/src/model/records/r-0001.json) |
| The 9 plates: caption verbatim (or empty), credit empty, `unverified` | [`r-0002` … `r-0010`](https://github.com/ajcali086/Angie-Calicura/tree/claude/mw-preview/src/model/records), e.g. [`r-0003`](https://github.com/ajcali086/Angie-Calicura/blob/claude/mw-preview/src/model/records/r-0003.json); [`r-0006`](https://github.com/ajcali086/Angie-Calicura/blob/claude/mw-preview/src/model/records/r-0006.json) is the image with no caption |
| The fetched files, named for their records | [`public/images/uploads`](https://github.com/ajcali086/Angie-Calicura/tree/claude/mw-preview/public/images/uploads) |
| What the pull skipped (nav, ad, share bar, comments, pixel, repeat) | [`src/model/records/r-0011.json`](https://github.com/ajcali086/Angie-Calicura/blob/claude/mw-preview/src/model/records/r-0011.json) |
| 29 name proposals, `proposed`, each citing its span | [`src/data/corrections`](https://github.com/ajcali086/Angie-Calicura/tree/claude/mw-preview/src/data/corrections), e.g. [`c-0001`](https://github.com/ajcali086/Angie-Calicura/blob/claude/mw-preview/src/data/corrections/c-0001.json) |
| IDs claimed, by input hash | [`meta/sequences.json`](https://github.com/ajcali086/Angie-Calicura/blob/claude/mw-preview/meta/sequences.json) |
| Entities, questions, evidence: still empty | [`src/model/entities`](https://github.com/ajcali086/Angie-Calicura/tree/claude/mw-preview/src/model/entities) |

## The run log

```
pull http://127.0.0.1:8765/post/angie
  23 passages, 9 plates, 10 pieces skipped
propose: stand-in-NOT-a-model at http://127.0.0.1:37971, 31 spans
propose: 29 names noticed; 38 dropped by the span rule (not in their span as spelled)
claimed 40 new IDs (r-0001 … c-0029); 0 unchanged; 0 restored; 0 tombstoned
model check passed
```

Run again over the same input:

```
pull http://127.0.0.1:8765/post/angie
  23 passages, 9 plates, 10 pieces skipped
propose: stand-in-NOT-a-model at http://127.0.0.1:37971, 31 spans
propose: 29 names noticed; 38 dropped by the span rule (not in their span as spelled)
claimed 0 new IDs; 40 unchanged; 0 restored; 0 tombstoned
model check passed
```

## Comparing with git

```bash
git fetch origin
git diff --stat origin/ccr-5f91ec88-gwd91u origin/claude/mw-preview   # what one pull added to the empty museum
git show origin/claude/mw-preview:src/model/records/r-0003.json         # one plate
```
