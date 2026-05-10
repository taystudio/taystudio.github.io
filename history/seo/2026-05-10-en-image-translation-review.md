# EN /image/ 번역 검수 review (2026-05-10)

> 사용자 검수용 doc — AI 초안 영어 텍스트의 어색한 표현·도메인 용어·번역 누락 점검. 각 도구별 SEO meta(title/desc/OG/Twitter) + H1 + subtitle + privacy box + FAQ + HowTo step 추출. 수정 결정 후 패치.

카테고리: image (9 도구 + 1 hub)

---

## Hub
`en/image/index.html`

| field | value |
|---|---|
| `<title>` (31c) | 9 Image Tools | TAYSTUDIO Image |
| `meta description` (226c) | Image compress, resize, HEIC→JPG conversion, crop, ID/passport photo, QR generate/scan, OCR, AI background remover — all processing in your browser. No file upload, no signup, no install. PDF tools li… |
| `og:title` | 9 Image Tools | TAYSTUDIO Image |
| `og:description` | Image compress, resize, HEIC→JPG, crop, ID photo, QR generate/scan, OCR, AI background remover — all processing in your browser. No upload, no signup. |
| `twitter:title` | 9 Image Tools | TAYSTUDIO Image |
| `twitter:description` | 9 image tools — compress, resize, HEIC, crop, ID photo, QR, OCR, background remover. Runs in your browser. |
| `<h1>` | Image Tools |
| `subtitle` | Compress, resize, HEIC→JPG, crop, ID photo, QR, OCR, background remover — all processing in your browser. Files never leave your device. |
| privacy box | 🔒 Files never leave your device. Uploaded images and PDFs are processed only in your browser's memory — even the site operator cannot see their contents. Safe for resumes, IDs, and sensit |

**FAQ (4)**
- **Q:** Are uploaded files really not sent to any server?
  **A:** Correct. All processing happens with JavaScript and WebAssembly in your browser. Image processing uses the canvas API, PDF uses pdf-lib, OCR uses Tesseract.js, and background removal uses ONNX Runtime Web — fully client-side. Only the OCR and background-removal AI models are auto-downloaded the firs…
- **Q:** How accurate is OCR?
  **A:** Tesseract.js typically achieves 90–95% accuracy on clean printed text in supported languages. Handwriting, cursive, complex tables, and vertical text drop to 50–70%. 300 DPI or higher source images are recommended.
- **Q:** Can it handle large files?
  **A:** On desktop Chrome, 100MB+ images and PDFs work fine. Mobile browsers may become unstable above ~500MB due to memory limits.
- **Q:** Are AI models re-downloaded every visit?
  **A:** No. Models download once and are cached in IndexedDB and the browser HTTP cache, so subsequent visits start instantly. OCR English/Korean ~10–13MB, background remover small model ~43MB.

---

## compress
`en/image/compress/index.html`

| field | value |
|---|---|
| `<title>` (62c) | Image Compress | Reduce Photo File Size — Email & Web Friendly |
| `meta description` (186c) | Reduce JPG, PNG, and WebP file size with a quality slider. Fits Gmail's 25MB attachment limit and common web upload limits. All processing in your browser, files never leave your device. |
| `og:title` | Image Compress | Reduce Photo File Size for Email & Web |
| `og:description` | Shrink JPG, PNG, and WebP images with a quality slider. All processing in your browser. No upload. |
| `twitter:title` | Image Compress | Reduce Photo File Size |
| `twitter:description` | Shrink JPG / PNG / WebP with a quality slider. Runs in your browser. |
| `<h1>` | Image Compress |
| `subtitle` | Quality slider to reduce photo file size — fits Gmail's 25MB attachment limit and common web upload limits. |
| privacy box | 🔒 Files never leave your device. All processing happens entirely in your browser. |

**FAQ (6)**
- **Q:** What can I use compressed photos for?
  **A:** Common cases include fitting Gmail's 25MB attachment limit, messaging apps' per-image limits, and Instagram / blog upload guidelines (typically 1–2MB). Quality 0.7–0.8 usually gives no visible loss while reducing file size by 30–60%.
- **Q:** Is the original file uploaded to a server?
  **A:** No. All processing happens in the browser via the canvas API. Even the site operator cannot see your files. Safe for IDs, resumes, and other sensitive images.
- **Q:** Does PNG also get compressed?
  **A:** PNG is a lossless format, so the quality slider doesn't reduce its size. To shrink a PNG significantly, change the output format to JPEG or WebP. JPEG is best when transparency isn't needed; WebP keeps transparency at smaller sizes.
- **Q:** Quality dropped too much after compression.
  **A:** Push the slider to 0.8 or above. 0.7–0.85 is the sweet spot — visually lossless while still shrinking. Below 0.5 you'll see blocking and noise. Use 0.9+ for printing or detailed viewing.
- **Q:** Can I compress multiple images at once?
  **A:** Currently this tool processes one image at a time. Batch support is on the roadmap. For now, fix the format and quality, then quickly process images one by one with the same settings.
- **Q:** Where doesn't WebP open?
  **A:** Modern browsers (Chrome, Edge, Firefox, Safari 14+) and recent Windows / macOS support WebP. Some legacy messaging apps and older Windows photo viewers don't. Choose JPEG for compatibility, WebP for smaller size.

---

## resize
`en/image/resize/index.html`

| field | value |
|---|---|
| `<title>` (63c) | Image Resize | px / % Size Change & JPG/PNG/WebP Format Convert |
| `meta description` (177c) | Resize images by pixel or percent. Lock aspect ratio + convert between JPG, PNG, and WebP. Fit profile / passport / resume photo sizes. Runs entirely in your browser, no upload. |
| `og:title` | Image Resize | px / % Size Change + Format Convert (JPG/PNG/WebP) |
| `og:description` | Resize images by px or %. Lock aspect ratio + JPG/PNG/WebP format conversion. All processing in your browser. |
| `twitter:title` | Image Resize / Format Convert | px / % + JPG/PNG/WebP |
| `twitter:description` | Resize images by px or %, lock aspect ratio, convert formats. |
| `<h1>` | Image Resize / Format Convert |
| `subtitle` | Change size by px or %, plus JPG / PNG / WebP format conversion — for passport, resume, and social photos. |
| privacy box | 🔒 Files never leave your device. All processing happens entirely in your browser. |

**FAQ (6)**
- **Q:** How do I match passport / resume photo sizes?
  **A:** US passport is 2×2 inches (51×51mm), about 600×600 px at 300 DPI. Schengen and many country passports use 35×45mm = 413×531 px @ 300 DPI. LinkedIn-style profile photos are typically 400×400 px. Enter width and height in px and uncheck 'lock aspect ratio' to set exact dimensions.
- **Q:** How does aspect-ratio lock work?
  **A:** To preserve the original width:height ratio, the smaller of the two values you enter wins, and the other side is auto-calculated. Example: a 1920×1080 photo with width 800 and height 600 becomes 800×450 (width-driven). Uncheck the lock when you need exact dimensions.
- **Q:** Is percent input easier?
  **A:** Yes, for proportional shrinks like 'half size' or '30%'. Same percent on both width and height keeps the ratio automatically. Use px mode when you need exact dimensions like 800×600.
- **Q:** I only want to convert format, not resize.
  **A:** Leave the dimensions equal to the original (or set 100% in percent mode) and just change the output format. Common cases: PNG → JPEG to shrink, JPEG → WebP to shrink further.
- **Q:** What happens if I enlarge beyond original size?
  **A:** Canvas uses bilinear interpolation by default. Up to 200% looks acceptable; beyond that it gets blurry. There's no AI upscaling here — if your source resolution is too low, find a better source.
- **Q:** Does my file get uploaded?
  **A:** No. Everything runs in the browser via the canvas API. The site operator can't see your files. Safe for IDs, resumes, and passport photos.

---

## heic-to-jpg
`en/image/heic-to-jpg/index.html`

| field | value |
|---|---|
| `<title>` (55c) | HEIC to JPG | Free iPhone Photo Converter, No Watermark |
| `meta description` (185c) | Convert iPhone and iPad HEIC photos to JPG or PNG. Batch upload, all processing in your browser. No signup, no install, no watermark. Compatible with email, messaging, and blog uploads. |
| `og:title` | HEIC to JPG | Free iPhone Photo Converter, No Watermark |
| `og:description` | Convert iPhone / iPad HEIC photos to JPG or PNG. Batch upload. All processing in your browser. No signup, no install, no watermark. |
| `twitter:title` | HEIC to JPG | Free iPhone Photo Converter |
| `twitter:description` | HEIC to JPG / PNG. Browser-based, no signup, no watermark. |
| `<h1>` | HEIC to JPG |
| `subtitle` | Convert iPhone and iPad photos to JPG or PNG — compatible with email, messaging apps, and blog uploads. |
| privacy box | 🔒 HEIC files never leave your device. All conversion happens entirely in your browser. |

**FAQ (6)**
- **Q:** Are my HEIC files uploaded to a server?
  **A:** No. Conversion runs locally with the heic2any (libheif WebAssembly) library in your browser. Even the site operator cannot see your photos. Safe for personal photos and family pictures.
- **Q:** Why do I need to convert HEIC?
  **A:** Since iOS 11, iPhone and iPad save photos in HEIC (High Efficiency Image Coding) format. It's about half the size of JPG at the same quality, but Windows, Android, some browsers, and some print services can't open it. Converting to JPG ensures it opens everywhere.
- **Q:** Does conversion lose quality?
  **A:** JPG conversion is lossy, but at quality 90+ the difference is visually imperceptible. For lossless output, choose PNG (5–10× larger than JPG). This tool encodes the decoded HEIC pixels directly, so there's no extra loss.
- **Q:** Can I convert multiple photos at once?
  **A:** Yes. Drag and drop multiple HEIC files or multi-select. Each file shows its own progress. After completion you can download per file or 'Download all' at once.
- **Q:** Does it handle large photos?
  **A:** iPhone camera 12MP (4032×3024) and 48MP (8064×6048) both work. Roughly 1–3 seconds per photo on desktop. Mobile Safari may struggle above ~50MB or 10+ files at once due to memory limits — desktop is recommended for big batches.
- **Q:** Are HEIC and HEIF the same?
  **A:** Almost. HEIF (High Efficiency Image File) is the container format; HEIC is HEIF compressed with the HEVC (H.265) codec. This tool accepts HEIC, HEIF, .heif, and .heic extensions.

---

## crop
`en/image/crop/index.html`

| field | value |
|---|---|
| `<title>` (59c) | Image Crop | Photo Crop & Aspect Ratios, Free, No Watermark |
| `meta description` (183c) | Crop photos to any aspect ratio. Presets for 1:1 (Instagram), 4:3, 16:9 (YouTube), 9:16 (TikTok / Reels), 3:2, plus free crop and 90/180/270° rotation. All processing in your browser. |
| `og:title` | Image Crop | Photo Crop & Aspect Ratios, Free |
| `og:description` | Crop photos to any aspect ratio. Presets for 1:1 / 4:3 / 16:9 / 9:16 / 3:2 + free crop + rotation. All processing in your browser. No watermark. |
| `twitter:title` | Image Crop | Photo Crop & Aspect Ratios, Free |
| `twitter:description` | Crop photos to any ratio. 1:1 / 4:3 / 16:9 / 9:16 + rotate. Browser-based. |
| `<h1>` | Image Crop |
| `subtitle` | Social aspect-ratio presets + free crop + rotation — Instagram, YouTube, Reels, TikTok in one place. |
| privacy box | 🔒 Photos never leave your device. All processing uses the browser's canvas API. |

**FAQ (6)**
- **Q:** Are my photos uploaded to a server?
  **A:** No. Cropping uses the canvas API in the browser only. Even the site operator cannot see your photos. Safe for personal, family, and sensitive images.
- **Q:** What aspect-ratio presets are available?
  **A:** Free / 1:1 (Instagram, profile) / 4:3 (cameras) / 16:9 (YouTube thumbnail, landscape video) / 9:16 (Reels, TikTok, Shorts) / 3:2 (DSLR / film) / 4:5 (Instagram portrait). When ratio is locked, handles preserve the chosen ratio.
- **Q:** Recommended ratios per platform?
  **A:** Instagram square = 1:1, Instagram landscape = 1.91:1 (close to 16:9), Instagram portrait = 4:5, Reels / Stories / TikTok = 9:16, YouTube thumbnail / landscape video = 16:9, Twitter (X) = 16:9 or 1:1, Facebook post = 1.91:1.
- **Q:** How does rotation work?
  **A:** 0 / 90 / 180 / 270 degrees + horizontal / vertical flip. Rotation is applied first, then you crop the rotated image. Convenient when an iPhone photo opens sideways.
- **Q:** Does it handle very large images?
  **A:** Normal photos (under 20MB) work on desktop and mobile. Very large images (50MB+ or 100+ megapixels) may slow due to memory limits. Resize to 4000–5000px width first using the resize tool, then crop.
- **Q:** Does cropping reduce quality?
  **A:** PNG and WebP are lossless; JPG uses the quality slider (default 90). Cropping extracts pixels exactly, so there's no extra quality loss. Rotation may introduce slight blur via interpolation, but 90 / 180 / 270° rotations align pixels exactly with no loss.

---

## id-photo
`en/image/id-photo/index.html`

| field | value |
|---|---|
| `<title>` (71c) | ID / Passport Photo Maker | US Passport, Schengen, LinkedIn — Free Crop |
| `meta description` (266c) | Auto-crop photos to standard ID sizes — US Passport (2×2 in / 51×51 mm), Schengen Visa (35×45 mm), LinkedIn / profile (400×400 px), and custom mm sizes at 300 DPI. Face guide overlay + white backgroun… |
| `og:title` | ID / Passport Photo Maker | US Passport, Schengen, LinkedIn |
| `og:description` | Auto-crop a photo to standard ID sizes — US passport (2×2 in), Schengen visa (35×45 mm), LinkedIn (400×400). 300 DPI output. White-background option. All in your browser. |
| `twitter:title` | ID / Passport Photo Maker | US Passport, Schengen |
| `twitter:description` | Auto-crop to standard ID photo sizes at 300 DPI. Browser-only. |
| `<h1>` | ID / Passport Photo Maker |
| `subtitle` | US Passport, Schengen, LinkedIn — auto-crop to standard sizes at 300 DPI for print. |
| privacy box | 🔒 Photos never leave your device. Sensitive ID-related material is processed entirely in your browser. |

**FAQ (6)**
- **Q:** Are my photos uploaded to a server?
  **A:** No. Cropping uses the canvas API in the browser only. Even the site operator cannot see your photos. This tool only crops — for ID-document photos, sensitive material stays local.
- **Q:** Which standard sizes are supported?
  **A:** US Passport (51×51 mm / 2×2 in) / Schengen Visa (35×45 mm) / UK Visa (35×45 mm) / China Visa (33×48 mm) / LinkedIn / profile (400×400 px) / Custom mm input. All output at 300 DPI for print compatibility.
- **Q:** Why are pixel sizes auto-set?
  **A:** Print standard is 300 DPI. Multiply mm by 300 / 25.4 ≈ 11.81 to get pixels. Example: 35mm × 11.81 ≈ 413px, 45mm × 11.81 ≈ 531px → 35×45mm = 413×531 px @ 300dpi. This is the resolution photo labs and printers expect.
- **Q:** How do I align the face?
  **A:** Inside the crop frame, dotted guide lines mark the top of head, eye level, and chin. Drag inside the frame to move; corner handles resize. Common requirements: small space above the head, eyes at ~40% from the top, chin near the bottom.
- **Q:** How does the white-background option work?
  **A:** This tool only crops. If your original background isn't white, the result won't be white either. To produce a clean white background, first run the photo through the Background Remover tool, then bring the transparent PNG here. The white-background option fills only transparent pixels with white.
- **Q:** Can I print at a photo lab?
  **A:** The output is at standard size and 300 DPI, so any photo lab or printer can print it. Note that government ID issuance often requires photos taken at an authorized photo studio (US passport requires photos within 6 months, etc.). This tool is best for resumes, profiles, applications, and unofficial …

---

## qr-gen
`en/image/qr-gen/index.html`

| field | value |
|---|---|
| `<title>` (56c) | QR Code Generator | URL · Text · Wi-Fi → PNG / SVG, Free |
| `meta description` (174c) | Generate QR codes from URL, text, or Wi-Fi credentials as PNG or SVG. Adjust size, error-correction level, and margins. All processing in your browser, no signup, no install. |
| `og:title` | QR Code Generator | URL · Text · Wi-Fi → PNG / SVG, Free |
| `og:description` | Generate QR codes from URL, text, or Wi-Fi credentials as PNG or SVG. All processing in your browser. No signup, no install, ad-free download. |
| `twitter:title` | QR Code Generator | URL · Text · Wi-Fi, Free |
| `twitter:description` | URL / text / Wi-Fi → QR PNG / SVG. Browser-based. |
| `<h1>` | QR Code Generator |
| `subtitle` | URL · text · Wi-Fi credentials → PNG / SVG. For posters, business cards, and store menus. |
| privacy box | 🔒 Inputs never leave your device. Even Wi-Fi passwords stay private — type them with confidence. |

**FAQ (6)**
- **Q:** Which error-correction level should I pick?
  **A:** L (7%) / M (15%) / Q (25%) / H (30%). M is a good default. If you'll overlay a logo or print where partial damage is possible, choose H. Higher levels add more modules (dots), making the code denser.
- **Q:** How do I make a Wi-Fi QR code?
  **A:** Switch to the Wi-Fi tab, then enter SSID, encryption (WPA / WPA2), and password. The tool encodes 'WIFI:T:WPA;S:name;P:password;;' for you. Pointing a phone camera at it triggers the auto-connect prompt (iOS and Android both support this).
- **Q:** PNG or SVG — which should I download?
  **A:** SVG for printing and any case where it might be enlarged (vector, never blurry). PNG for messaging, email, and blog attachments — best compatibility. Some messengers don't display SVG.
- **Q:** Are my URL or password sent to a server?
  **A:** No. QR encoding happens entirely in the browser. Inputs (including Wi-Fi passwords) never leave your device. Even the site operator cannot see them.
- **Q:** Is there a character limit?
  **A:** Depends on the QR version (size). About 4,000 alphanumeric characters max, or ~1,800 for multi-byte (CJK) text. Longer input means denser modules and shorter scan range — for URLs, consider a URL shortener (bit.ly, etc.).
- **Q:** Can I make non-black QR codes?
  **A:** Currently this tool only outputs black-on-white. Color customization is on the roadmap. To recolor, download the SVG and edit the fill in a graphics tool (Figma, Illustrator, Inkscape). Note: low contrast hurts scan reliability.

---

## qr-scan
`en/image/qr-scan/index.html`

| field | value |
|---|---|
| `<title>` (51c) | QR Code Scanner | Extract Text from Camera or Image |
| `meta description` (159c) | Upload a QR code image or use your webcam / phone camera to decode it instantly. Open URLs with one click. All processing in your browser, no upload of inputs. |
| `og:title` | QR Code Scanner | Extract Text from Camera or Image |
| `og:description` | Upload a QR image or point your camera at one — instantly extract URL, text, or Wi-Fi credentials. All processing in your browser. |
| `twitter:title` | QR Code Scanner | Extract Text from Camera or Image |
| `twitter:description` | QR image or camera → text / URL / Wi-Fi. Browser-based. |
| `<h1>` | QR Code Scanner |
| `subtitle` | Point your camera or upload an image — instantly extract text, URL, or Wi-Fi credentials. |
| privacy box | 🔒 Image / camera frames never leave your device. All decoding happens entirely in your browser. |

**FAQ (6)**
- **Q:** The camera won't turn on.
  **A:** Make sure you allowed camera permissions. Camera access also requires HTTPS (this site is HTTPS). On iOS Safari, tap the lock icon in the address bar to re-enable camera access. If permissions are blocked, unblock them in your browser's site settings.
- **Q:** QR image won't decode.
  **A:** ① Crop or zoom so the QR fills more of the frame ② check that contrast is sufficient (blur or tiny size fails) ③ rotation and skew usually work, but heavy perspective distortion is hard ④ if it's a phone photo, reduce shake and re-shoot.
- **Q:** Are the image / camera frames sent to a server?
  **A:** No. All decoding happens in the browser via the jsQR library. Camera frames are only displayed on screen — never uploaded. Stopping the camera ends the stream immediately.
- **Q:** Does it handle multiple QRs in one image?
  **A:** Currently only the first detected QR is decoded. To read multiple, crop each one separately and upload one at a time.
- **Q:** How do I tell if the result is a URL or just text?
  **A:** This tool auto-classifies decoded content — URL (http/https), phone (tel:), SMS, email (mailto:), Wi-Fi (WIFI:), map (geo:), or plain text. URLs activate an 'Open' button. Note: opening external URLs is at your own risk — verify the source first.
- **Q:** Wi-Fi QR decoded but won't auto-connect.
  **A:** This tool only decodes the text. Auto-connect for Wi-Fi works only with the OS camera app (the phone's native camera). PCs and web browsers don't have OS-level permission for that — copy the SSID and password and connect manually.

---

## ocr
`en/image/ocr/index.html`

| field | value |
|---|---|
| `<title>` (66c) | Image OCR | Free Text Extraction (English, Korean) — Browser-Based |
| `meta description` (166c) | Extract text from images, screenshots, and photos — English, Korean, and more. Tesseract.js WASM in-browser OCR. All processing on your device, images never uploaded. |
| `og:title` | Image OCR | Free English & Korean Text Extraction |
| `og:description` | Extract text from images and screenshots — English, Korean, and more. Tesseract.js WASM, all processing in your browser. |
| `twitter:title` | Image OCR | Free English & Korean Text Extraction |
| `twitter:description` | Extract text from images. Tesseract.js WASM, browser-based. |
| `<h1>` | Image OCR (text extraction) |
| `subtitle` | Photos and screenshots → text. Tesseract.js WASM running entirely in your browser. |
| privacy box | 🔒 Images never leave your device. OCR runs in the browser via a WASM engine. The engine and language data (~10–13MB) are downloaded once from a CDN, then cached in IndexedDB. |

**FAQ (6)**
- **Q:** Are my images uploaded to a server?
  **A:** Images stay on your device. OCR runs entirely in the browser via the Tesseract.js WASM engine. The OCR worker code and language training data (around 10–13MB) are downloaded once from the jsdelivr CDN on first use, then cached in IndexedDB for offline use. The site operator cannot see your images.
- **Q:** Why is the first run slow?
  **A:** The OCR engine core (WASM) and language training data (10–13MB) download on first use. After that, IndexedDB caches them and subsequent runs start instantly. Avoid the first run on cellular data — use Wi-Fi once to warm the cache.
- **Q:** Is accuracy 100%?
  **A:** OCR is a statistical inference task and does not guarantee 100%. With Tesseract.js, clean printed/digital text typically scores 80–95%. Handwriting, vertical text, or distorted documents drop significantly. Always have a human review the results — for legal or critical material, type it in manually.
- **Q:** Which languages are supported?
  **A:** Currently English, Korean, and English + Korean mixed. Mixed mode downloads both language models, so the first run takes longer. Other languages like Japanese and Chinese are planned.
- **Q:** Output looks garbled.
  **A:** ① Re-shoot if the photo is blurry or skewed ② crop just the text area to avoid background noise ③ enlarge the image if the font is too small ④ if your text mixes English with another language, use the mixed mode.
- **Q:** Can I OCR a PDF?
  **A:** This tool currently accepts images only (JPG / PNG / WebP). If your PDF already has digital text, copy it directly from a PDF viewer. For scanned PDFs, export each page as an image (e.g. screenshot) and bring it here.

---

## bg-remove
`en/image/bg-remove/index.html`

| field | value |
|---|---|
| `<title>` (59c) | Background Remover | AI Photo Cutout, Transparent PNG, Free |
| `meta description` (168c) | Automatically remove a photo's background with AI → transparent PNG. People, pets, products. All processing in your browser via ONNX Runtime Web. Images never uploaded. |
| `og:title` | Background Remover | AI Photo Cutout, Transparent PNG, Free |
| `og:description` | Remove a photo's background with AI → transparent PNG. All processing in your browser. Images never leave your device. |
| `twitter:title` | Background Remover | AI Cutout, Transparent PNG, Free |
| `twitter:description` | AI removes photo backgrounds → transparent PNG. Browser-based. |
| `<h1>` | Background Remover |
| `subtitle` | AI auto-removes the background → transparent PNG. People, pets, products — all in your browser. |
| privacy box | 🔒 Images never leave your device. AI inference runs in the browser via ONNX Runtime Web (WASM). The model and runtime are downloaded once from staticimgly.com, then cached in IndexedDB. |

**FAQ (6)**
- **Q:** Are my images uploaded to a server?
  **A:** Images stay on your device. AI inference runs entirely in the browser via ONNX Runtime Web (WASM). The model file and WASM runtime are downloaded from staticimgly.com on first use, then cached in the browser's IndexedDB / HTTP cache (offline thereafter). The site operator cannot see your images.
- **Q:** Why is the first run slow?
  **A:** On first use, the AI model (small ~43MB) and ONNX runtime WASM files are downloaded. After that, they're cached and subsequent runs start instantly. Avoid the first run on cellular data — use Wi-Fi once to warm the cache.
- **Q:** What kind of photos work well?
  **A:** People, pets, and product photos generally work well. Higher color/brightness contrast between subject and background = cleaner results. Fine details like hair / fur are limited by the small model (medium and large models are more accurate but heavier downloads).
- **Q:** What if the result is unsatisfactory?
  **A:** ① Use photos with strong subject/background contrast (white background works great) ② if the subject is small, crop closer first ③ heavy shadows or reflections may leave residue ④ for fine hair detail, the medium model would help, but its 80MB download isn't currently offered ⑤ width under 1500px is…
- **Q:** What format is the result?
  **A:** PNG (to preserve transparency). If transparency isn't needed (e.g. compositing onto a solid background), open it in any graphics tool, place it on the new background, and save as JPG. The Image Compress tool here can also convert PNG → JPG.
- **Q:** Maximum image size?
  **A:** No hard limit. On mobile, images wider than ~2000px may run out of memory. Desktop Chrome handles up to 4000px reliably. For large images, use the Resize tool to shrink to 1500–2000px width first — it's faster and safer.

---

