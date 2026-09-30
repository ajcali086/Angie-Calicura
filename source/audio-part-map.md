# Angie TTS script — audio part map

Source: `angie-sheridan-tts-script.md` (52,102 characters, 170 blocks).
Cap: 15,000 characters per TTS request.

## Why five parts, not three

The article's own structure is three parts (Martinez Girlhood / Wyoming Madame /
Tahoe Restaurateur), but 52,102 ÷ 3 ≈ 17,400 characters per part — over the cap.
So the three book parts are kept, and the two long ones are each split into two
audio halves at clean narrative seams. Five files, every one under 15,000 chars.

## The parts

| File | Book part | Blocks | Chars | Ends on |
|---|---|---|---|---|
| angie-tts-a1-martinez-girlhood.md | 1 · Martinez Girlhood | 0–30 | 7,325 | 1951 photo caption; "does not show up again until the 1950s" |
| angie-tts-a2a-wyoming-madame-the-ideal.md | 2 · Wyoming Madame, first half | 31–67 | 8,232 | "That confrontation came swiftly." |
| angie-tts-a2b-wyoming-madame-the-fall.md | 2 · Wyoming Madame, second half | 68–105 | 14,394 | Yellowtail Dam house (Sheridan coda) |
| angie-tts-a3a-tahoe-restaurateur-reinvention.md | 3 · Tahoe Restaurateur, first half | 106–140 | 13,912 | Aerial photo of the Tahoe Inn site |
| angie-tts-a3b-tahoe-restaurateur-the-record.md | 3 · Tahoe Restaurateur, second half | 141–169 | 8,476 | Research epilogue and thanks |

Rough runtime at ~150 wpm: ~7 + 8 + 14 + 14 + 8 ≈ 51 minutes total.

## Notes

- Each file opens with a spoken title block (e.g. "Part Two. Wyoming Madame,
  Part One. The Ideal."), followed by `[pause]`, then the script blocks
  unchanged. Delete the title block if you don't want it voiced.
- `[pause]` markers are preserved in every file.
- Splits were cut only between blocks, never inside one. Reassembling the five
  files (minus title blocks) reproduces the source script byte-for-byte.
- Tightest file is a2b at 14,394 chars — about 600 characters of headroom under
  the cap. If your TTS counts differently, that's the one to watch.
