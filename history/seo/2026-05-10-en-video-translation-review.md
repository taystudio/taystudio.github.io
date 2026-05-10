# EN /video/ 번역 검수 review (2026-05-10)

> 사용자 검수용 doc — AI 초안 영어 텍스트의 어색한 표현·도메인 용어·번역 누락 점검. 각 도구별 SEO meta(title/desc/OG/Twitter) + H1 + subtitle + privacy box + FAQ + HowTo step 추출. 수정 결정 후 패치.

카테고리: Video (5 도구 + 1 hub)

---

## Hub
`en/video/index.html`

| field | value |
|---|---|
| `<title>` (29c) | Video Tools | TAYSTUDIO Video |
| `meta description` (147c) | Compress, trim, rotate videos, convert to GIF, extract MP3 — all in your browser. Your video never leaves your device. Free, no signup, no install. |
| `og:title` | Video Tools | TAYSTUDIO Video |
| `og:description` | Compress, trim, rotate, convert to GIF, extract MP3 — all in your browser. Your video never leaves your device. |
| `twitter:title` | Video Tools | TAYSTUDIO Video |
| `twitter:description` | Compress, trim, GIF — all processing in your browser. Your video never leaves your device. |
| `<h1>` | Video Tools |
| `subtitle` | All processing happens in your browser. Your video never leaves your device. |
| privacy box | 🔒 Your video never leaves your browser. Uploaded clips stay in browser memory and are processed by ffmpeg.wasm — even the site operator can't see the contents. |

**FAQ (5)**
- **Q:** Is the video I upload really not sent anywhere?
  **A:** Yes. All processing happens in your browser via ffmpeg.wasm. The site operator never sees the contents. Only the ffmpeg library itself (~32MB) is downloaded from the jsdelivr CDN on first use; the video itself never leaves your device.
- **Q:** Why do mobile browsers fail more often?
  **A:** Single-thread WASM has memory and CPU limits. iOS Safari caps tabs around 500MB; Android Chrome around 1GB. Decoding plus encoding has to fit in that budget, so 1080p videos can fail with out-of-memory errors. We recommend ≤ 720p and ≤ 1 minute on mobile, or use desktop Chrome for larger files.
- **Q:** Why is processing slow?
  **A:** GitHub Pages can't enable SharedArrayBuffer (no COOP/COEP headers), so ffmpeg.wasm runs single-threaded. Compressing a 5-minute video takes about 1 to 3 minutes on desktop. Mobile is 2 to 3 times slower.
- **Q:** Can I process copyrighted videos?
  **A:** Technically yes, but please use only on videos you own or have a license for. Audio extraction in particular carries copyright risk — illegal use is prohibited.
- **Q:** Which video formats are supported?
  **A:** Inputs include MP4, MOV, WebM, MKV, AVI, and most other formats ffmpeg supports. Outputs are MP4 (H.264), GIF, or MP3 depending on the tool.

---

## compress
`en/video/compress/index.html`

| field | value |
|---|---|
| `<title>` (61c) | Compress Video | Reduce MP4 file size — free, in your browser |
| `meta description` (211c) | Lower the resolution and quality of MP4, MOV, and WebM videos to reduce file size. Fits email (25MB) and messenger attachment limits. All processing happens in your browser — your video never leaves y… |
| `og:title` | Compress Video | Reduce MP4 file size in your browser |
| `og:description` | Resize and re-encode MP4/MOV/WebM videos to shrink file size for email and messaging. All processing in your browser — your video never leaves your device. |
| `twitter:title` | Compress Video | Reduce file size |
| `twitter:description` | Adjust resolution and quality to shrink MP4/MOV/WebM. All processing in your browser. |
| `<h1>` | Compress Video |
| `subtitle` | Lower the resolution and quality to shrink the file size — for email, messengers, and social media attachments. |
| privacy box | 🔒 Your video never leaves your browser. All processing happens locally via ffmpeg.wasm (WebAssembly). |

**FAQ (6)**
- **Q:** Is my video uploaded to a server?
  **A:** No. The video is processed entirely in your browser via ffmpeg.wasm (WebAssembly). The site operator never sees the contents. Only the ffmpeg library itself (~32MB) is downloaded on first use; the video itself never leaves your device.
- **Q:** How long does compression take?
  **A:** On a single thread, a 5-minute 1080p video takes about 1 to 3 minutes on desktop Chrome. Mobile is 2 to 3 times slower. Raising CRF from 28 to 32 or downscaling to 720p makes it faster.
- **Q:** Which input formats are supported?
  **A:** MP4, MOV, WebM, MKV, AVI, and most other formats supported by ffmpeg. Output is always MP4 (H.264 + AAC) — playable on virtually any device or messaging app.
- **Q:** What is CRF and what value should I use?
  **A:** Constant Rate Factor — H.264's quality knob. 0 is lossless, 51 is worst, and 23 to 28 is the typical sweet spot. The default here is 28 (visually nearly identical, 30~60% smaller). Use 18 to 22 for archival-grade quality, 30 to 32 for messenger-friendly small files.
- **Q:** Can it handle large videos?
  **A:** On desktop Chrome, around 1 to 2GB. Mobile browsers (especially iOS Safari) can become unstable above ~500MB due to memory limits. For large videos, downscale to 720p first or use the Trim tool to split the video into shorter pieces.
- **Q:** Is the audio preserved?
  **A:** Audio is re-encoded to AAC at 128 kbps by default. If audio fidelity matters (e.g. music videos), choose 'Copy original (lossless)'. Some input codecs (AC-3, DTS) can't be copied into MP4 and will fall back to AAC automatically.

---

## trim
`en/video/trim/index.html`

| field | value |
|---|---|
| `<title>` (62c) | Trim Video | Cut MP4 by start and end times — free, in browser |
| `meta description` (238c) | Cut a section out of MP4, MOV, or WebM videos by specifying start and end times. Fast mode finishes in seconds without re-encoding; precise mode cuts at frame accuracy. All processing in your browser … |
| `og:title` | Trim Video | Cut MP4 by start and end timestamps |
| `og:description` | Cut a clip out of an MP4, MOV, or WebM video by start and end times. Fast mode (no re-encode) finishes in seconds. All processing happens in your browser. |
| `twitter:title` | Trim Video | Cut clip by timestamps |
| `twitter:description` | Save just the part you want. Fast or precise mode. All processing in your browser. |
| `<h1>` | Trim Video |
| `subtitle` | Save just the segment you want by start and end times — Fast mode finishes in seconds. |
| privacy box | 🔒 Your video never leaves your browser. All processing happens locally via ffmpeg.wasm (WebAssembly). |

**FAQ (5)**
- **Q:** Is my video uploaded to a server?
  **A:** No. The video is processed entirely in your browser via ffmpeg.wasm (WebAssembly). The site operator never sees the contents. Only the ffmpeg library itself (~32MB) is downloaded on first use; the video itself never leaves your device.
- **Q:** What's the difference between Fast and Precise mode?
  **A:** Fast mode keeps the original codec (no re-encoding) and finishes a 1GB video in seconds to tens of seconds. The catch: cuts are aligned to H.264 keyframes (typically 1 to 5 seconds apart), so a timestamp between keyframes snaps to the nearest one. Precise mode cuts exactly at the requested timestamp…
- **Q:** How do I enter the times?
  **A:** HH:MM:SS, MM:SS, or seconds — all three formats work. Examples: 1:23:45 (1 hour 23 minutes 45 seconds), 4:30 (4 minutes 30 seconds), 90 (90 seconds). Decimals are allowed — 90.5 means 90.5 seconds.
- **Q:** What is the output format?
  **A:** Output is always MP4 (H.264 + AAC) — playable on virtually any device or messaging app. Fast mode just rewraps the existing codec into MP4 even if the input wasn't H.264/AAC.
- **Q:** How long does it take?
  **A:** Fast mode: independent of file size — even a 1GB video usually finishes in seconds to tens of seconds. Precise mode: about 0.3 to 1× the trimmed clip's length on desktop Chrome. Mobile is 2 to 3 times slower due to the single-thread limit.

---

## rotate
`en/video/rotate/index.html`

| field | value |
|---|---|
| `<title>` (66c) | Rotate Video | 90°/180° rotation + horizontal/vertical flip (free) |
| `meta description` (193c) | Rotate MP4, MOV, and WebM videos by 90° or 180°, or flip horizontally/vertically. Fix sideways or upside-down phone videos. All processing in your browser — your video never leaves your device. |
| `og:title` | Rotate Video | 90°/180° rotation, horizontal/vertical flip |
| `og:description` | Rotate vertical phone videos to landscape, fix upside-down clips, mirror selfies. 90°/180° rotation plus horizontal/vertical flip. All in your browser. |
| `twitter:title` | Rotate Video | 90°/180° + flip |
| `twitter:description` | Rotate or flip videos. All processing in your browser. |
| `<h1>` | Rotate Video |
| `subtitle` | Turn vertical phone videos sideways, fix upside-down footage — 90°/180° rotation plus horizontal/vertical flip. |
| privacy box | 🔒 Your video never leaves your browser. All processing happens locally via ffmpeg.wasm (WebAssembly). |

**FAQ (4)**
- **Q:** Is my video uploaded to a server?
  **A:** No. The video is processed entirely in your browser via ffmpeg.wasm (WebAssembly). The site operator never sees the contents. Only the ffmpeg library itself (~32MB) is downloaded on first use; the video itself never leaves your device.
- **Q:** Why does rotation take time?
  **A:** Rotation rearranges pixels, so the codec must decode → rotate → re-encode. Setting only a metadata rotation flag (rotation tag) is interpreted inconsistently across players and is often ignored when uploading to social platforms — so we rotate the actual pixels. Expect roughly 0.3 to 1× of the sourc…
- **Q:** Is the audio preserved?
  **A:** Yes — audio is copied losslessly (-c:a copy) without re-encoding. Only the video track is rotated, so audio fidelity is unchanged. Some input codecs (AC-3, DTS) aren't compatible with the MP4 container and will fall back to AAC automatically.
- **Q:** Which input formats are supported?
  **A:** MP4, MOV, WebM, MKV, AVI, and most other formats supported by ffmpeg. Output is always MP4 (H.264) — playable on virtually any device.

---

## to-gif
`en/video/to-gif/index.html`

| field | value |
|---|---|
| `<title>` (66c) | Video to GIF | Convert MP4 to animated GIF — free, in your browser |
| `meta description` (238c) | Convert short segments of MP4, MOV, and WebM videos into animated GIFs for social media, reactions, and stickers. Adjust fps and width to balance file size and quality. All processing in your browser … |
| `og:title` | Video to GIF | Convert clips to animated GIFs |
| `og:description` | Turn short clips from MP4, MOV, or WebM videos into animated GIFs. Tune fps and width to balance size and quality. All processing happens in your browser. |
| `twitter:title` | Video to GIF | Make animated GIFs |
| `twitter:description` | Convert short clips into GIFs. All processing in your browser. |
| `<h1>` | Video to GIF |
| `subtitle` | Turn short clips into animated GIFs — for social media, reactions, and stickers. Tune fps and width to optimize size. |
| privacy box | 🔒 Your video never leaves your browser. All processing happens locally via ffmpeg.wasm (WebAssembly). |

**FAQ (5)**
- **Q:** Is my video uploaded to a server?
  **A:** No. The video is processed entirely in your browser via ffmpeg.wasm (WebAssembly). The site operator never sees the contents. Only the ffmpeg library itself (~32MB) is downloaded on first use; the video itself never leaves your device.
- **Q:** Why can a GIF be larger than the source video?
  **A:** GIF is a 1989-vintage format with inefficient 256-color palette compression. Modern codecs like H.264 are much smaller for the same content. A 5-second 480p GIF in the 5 to 20MB range is normal; 30-second 1080p GIFs can reach 100MB or more. For social-media-style clips, keep it ≤ 10 seconds + ≤ 480p…
- **Q:** How should I pick fps and width?
  **A:** Size scales with fps × width² × duration. Social clips: 15 fps + 480px width / Stickers: 12 to 15 fps + 240 to 320px / Smooth motion: 24 to 30 fps (large). 480px width + 15 fps is a strong default balance.
- **Q:** Why do colors look slightly off?
  **A:** GIF can only use 256 colors per frame (8-bit indexed color), so gradients and live-action footage get approximated through dithering. This site uses ffmpeg's palettegen filter to analyze the entire clip and pick an optimal 256-color palette to minimize quality loss.
- **Q:** How long does conversion take?
  **A:** A 5-second 480p 15 fps GIF takes about 10 to 30 seconds on desktop Chrome. GIF generation is heavier than compression, so even on a single thread it takes a bit longer. Mobile is 2 to 3 times slower. Stick to ≤ 10 seconds + ≤ 480px.

---

## to-mp3
`en/video/to-mp3/index.html`

| field | value |
|---|---|
| `<title>` (68c) | Extract MP3 from Video | Audio extraction (personal use only — free) |
| `meta description` (279c) | Extract the audio track of MP4, MOV, WebM, MKV videos you've shot yourself to MP3. Pick a bitrate from 96 to 320 kbps. All processing in your browser — your video never leaves your device. For persona… |
| `og:title` | Extract MP3 from Video | Pull audio out of your own clips |
| `og:description` | Extract the audio track of your own MP4, MOV, or WebM videos to MP3. All processing in your browser. For personal use only — respect copyright. |
| `twitter:title` | Extract MP3 from Video | Personal use only |
| `twitter:description` | Extract MP3 audio from your own videos. All processing in your browser. |
| `<h1>` | Extract MP3 from Video |
| `subtitle` | Pull the audio track out of your own clips — family events, travel videos, original recordings. |
| privacy box | 🔒 Your video never leaves your browser. All processing happens locally via ffmpeg.wasm (WebAssembly). |

**FAQ (5)**
- **Q:** When is this tool legal to use?
  **A:** Only on videos you own — content you recorded yourself (family events, travel clips, original content). Extracting audio from third-party works (YouTube, TV, films, music videos) is a copyright violation in most jurisdictions, even for personal listening. The site never uploads your video; usage res…
- **Q:** Is my video uploaded to a server?
  **A:** No. The video is processed entirely in your browser via ffmpeg.wasm (WebAssembly). The site operator never sees the contents. Only the ffmpeg library itself (~32MB) is downloaded on first use; the video itself never leaves your device.
- **Q:** How should I pick a bitrate?
  **A:** Voice / lectures: 96 to 128 kbps (small). General music: 192 kbps (recommended). High-quality music: 256 to 320 kbps (small difference, large file). Setting a bitrate higher than the source audio doesn't improve fidelity (it's capped by the source).
- **Q:** Why MP3 only? What about AAC or WAV?
  **A:** MP3 has the broadest compatibility (every car stereo, Bluetooth speaker, old MP3 player). AAC is slightly better at the same bitrate but isn't universally supported on older devices. WAV is lossless but 10× the size. We optimize for compatibility and ship MP3 only.
- **Q:** How long does extraction take?
  **A:** MP3 encoding is much lighter than video compression — a 5-minute video takes 10 to 30 seconds on desktop Chrome. Mobile finishes in under a minute. Only the first run pays the ~32MB ffmpeg download.

---
