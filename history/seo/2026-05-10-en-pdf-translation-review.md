# EN /pdf/ 번역 검수 review (2026-05-10)

> 사용자 검수용 doc — AI 초안 영어 텍스트의 어색한 표현·도메인 용어·번역 누락 점검. 각 도구별 SEO meta(title/desc/OG/Twitter) + H1 + subtitle + privacy box + FAQ + HowTo step 추출. 수정 결정 후 패치.

카테고리: PDF (5 도구 + 1 hub)

---

## Hub
`en/pdf/index.html`

| field | value |
|---|---|
| `<title>` (27c) | 5 PDF Tools | TAYSTUDIO PDF |
| `meta description` (193c) | Merge PDF, Split PDF, PDF Edit (delete / reorder / rotate pages), Image to PDF, PDF to Image — all processing happens in your browser. Your files never leave your device. No signup, no install. |
| `og:title` | 5 PDF Tools | TAYSTUDIO PDF |
| `og:description` | Merge, split, edit (delete / reorder / rotate pages), and convert images to and from PDF — all processing in your browser. Your PDFs never leave your device. |
| `twitter:title` | 5 PDF Tools | TAYSTUDIO PDF |
| `twitter:description` | Merge, split, edit, and convert PDFs in your browser. Nothing uploaded. |
| `<h1>` | PDF Tools |
| `subtitle` | Merge, split, edit, and convert — all processing happens in your browser. Your files never leave your device. |
| privacy box | 🔒 Your PDFs never leave your browser. Uploaded PDFs are processed only in your browser's memory, and even the site operator cannot see the contents. Safe for contracts, resumes, and other sensitive do… |

**FAQ (5)**
- **Q:** Do my uploaded PDFs really stay local?
  **A:** Yes. All processing happens in your browser via JavaScript and WebAssembly. Merge, split, edit, and image-to-PDF use pdf-lib; PDF-to-image and edit thumbnails use pdf.js. Even the site operator cannot see your file contents — nothing is uploaded.
- **Q:** Can I work with password-protected PDFs?
  **A:** Password-locked PDFs may not process automatically. This site does not provide decryption. Unlock the PDF in a viewer first, then upload. The ignoreEncryption flag bypasses some light protections, but strong passwords will not work.
- **Q:** How large can my PDFs be?
  **A:** On desktop Chrome, around 200MB and 200 pages is comfortable. Mobile is best kept under 50MB and 50 pages. If memory is tight, narrow the range with Split PDF first. The edit tool is more conservative because of thumbnail rendering.
- **Q:** Are fonts, images, and hyperlinks preserved?
  **A:** pdf-lib copies page objects from the original, so fonts, images, and most hyperlinks are preserved. Interactive form behavior, digital signatures, and certain annotations may behave differently after editing.
- **Q:** It's flaky on mobile
  **A:** Mobile Safari and Chrome have memory limits around 500MB, so large PDFs are best handled on desktop. In-app browsers (messaging app webviews) are unsuitable for video/PDF work — use 'Open in external browser' (auto-banner is shown).

---

## pdf-merge
`en/pdf/pdf-merge/index.html`

| field | value |
|---|---|
| `<title>` (63c) | Merge PDF | Combine Multiple PDFs Into One — Free, No Watermark |
| `meta description` (192c) | Free tool to merge multiple PDF files into one — drag and reorder. All processing runs in your browser. No watermark, no signup, no install. Great for resumes, reports, contracts, assignments. |
| `og:title` | Merge PDF | Combine Multiple PDFs Into One — Free, No Watermark |
| `og:description` | Drag, reorder, and merge multiple PDF files into one. All processing happens in your browser. No signup, no install, no watermark. |
| `twitter:title` | Merge PDF | Free, No Watermark |
| `twitter:description` | Multiple PDFs into one file. Browser-only processing, nothing uploaded. |
| `<h1>` | Merge PDF |
| `subtitle` | Drag and reorder multiple PDFs into one file — for resumes, reports, contracts, and assignments. |
| privacy box | 🔒 Your PDFs never leave your browser. All processing happens locally on your device. |

**FAQ (6)**
- **Q:** Are my PDF files uploaded to a server?
  **A:** No. PDF processing happens entirely inside your browser using the pdf-lib library. Even the site operator cannot see your file contents. Safe for contracts, resumes, and sensitive documents.
- **Q:** Can I merge password-protected PDFs?
  **A:** Password-locked PDFs may not process automatically. Unlock the PDF first using your viewer, then upload. This tool does not provide decryption — only the file's authorized owner can unlock it via a PDF reader.
- **Q:** Can I change the order of files?
  **A:** Yes. Use the up and down arrows in the file list to reorder. Pages are concatenated in that order into a single PDF. Remove unwanted files with the X button.
- **Q:** How many PDFs can I merge at once?
  **A:** There is no hard limit, but it depends on browser memory. Desktop Chrome handles roughly 200MB and 100 pages comfortably. Mobile is best kept under 50MB and 30 pages. For larger files, split first or use a desktop browser.
- **Q:** Are fonts, images, and hyperlinks preserved?
  **A:** pdf-lib copies pages from the original, so fonts, images, and most hyperlinks are preserved. Interactive form-field behavior, digital signatures, and certain annotations may behave differently after merging.
- **Q:** The result file is bigger than the originals — is that normal?
  **A:** Within normal range. pdf-lib copies page objects as-is, so fonts and images from each original may be duplicated. If size matters, use a separate PDF compressor afterwards, or reduce image resolution in the originals before merging.

---

## pdf-split
`en/pdf/pdf-split/index.html`

| field | value |
|---|---|
| `<title>` (49c) | Split PDF | Extract Page Ranges From a PDF — Free |
| `meta description` (140c) | Extract chosen pages from a PDF using ranges like '1-3,5,7-10'. All processing happens in your browser. No watermark, no signup, no install. |
| `og:title` | Split PDF | Extract Page Ranges From a PDF — Free |
| `og:description` | Extract specific pages or ranges from a PDF using formats like '1-3,5,7-10'. All processing in your browser. No watermark, no signup. |
| `twitter:title` | Split PDF | Extract Page Ranges, Free |
| `twitter:description` | Extract pages from a PDF in your browser. Nothing uploaded. |
| `<h1>` | Split PDF |
| `subtitle` | Extract only the pages you need — using ranges like '1-3,5,7-10'. |
| privacy box | 🔒 Your PDFs never leave your browser. All processing happens locally on your device. |

**FAQ (6)**
- **Q:** How do I enter page ranges?
  **A:** Page numbers are 1-based. Single pages are plain numbers (e.g. 5); contiguous ranges use a hyphen (e.g. 3-7); multiple groups are separated by commas (e.g. 1-3,5,8-10). Whitespace is ignored. Pages appear in the result PDF in the order you typed them.
- **Q:** Can I split a PDF into one page per file?
  **A:** Currently the tool produces a single output PDF per run. Auto-splitting into N single-page files is planned. For now, extract one page at a time (e.g. type '1', download, then '2', download), or use your OS print dialog with 'Save as PDF' to set different ranges each time.
- **Q:** Is the original PDF uploaded to a server?
  **A:** No. PDF processing happens inside your browser using pdf-lib. Even the site operator cannot see the contents. Safe for contracts, resumes, and sensitive documents.
- **Q:** Can I split password-protected PDFs?
  **A:** Password-locked PDFs may not process. Unlock the PDF in a viewer first, then upload. This tool does not provide decryption.
- **Q:** Can I change the page order?
  **A:** Yes. Pages appear in the result PDF in the order you typed them. For example '5,1-3' produces a 4-page PDF in the order 5 → 1 → 2 → 3. You can also include the same page twice.
- **Q:** Why isn't the output much smaller than the original?
  **A:** pdf-lib copies page objects as-is, so even when extracting a few pages, internal resources like fonts and images may still be embedded. Run the result through a separate PDF compressor if you need a smaller file.

---

## pdf-edit
`en/pdf/pdf-edit/index.html`

| field | value |
|---|---|
| `<title>` (47c) | PDF Edit | Delete, Reorder, Rotate Pages — Free |
| `meta description` (172c) | Delete or reorder PDF pages and rotate by 90 / 180 / 270 degrees. Thumbnail preview plus drag-and-drop. All processing in your browser. No watermark, no signup, no install. |
| `og:title` | PDF Edit | Delete, Reorder, Rotate Pages — Free |
| `og:description` | Delete, reorder, and rotate PDF pages in one screen. Thumbnail preview and drag-and-drop. All processing in your browser. No watermark, no signup. |
| `twitter:title` | PDF Edit | Delete, Reorder, Rotate — Free |
| `twitter:description` | Tidy up PDF pages in your browser. Nothing uploaded. |
| `<h1>` | PDF Edit |
| `subtitle` | Delete, reorder, and rotate pages on one screen — with thumbnails to guide you. |
| privacy box | 🔒 Your PDFs never leave your browser. All processing happens locally on your device. |

**FAQ (6)**
- **Q:** Are my PDF files uploaded to a server?
  **A:** No. PDF processing happens entirely in the pdf-lib and pdf.js libraries running inside your browser. Even the site operator cannot see your file contents. Safe for contracts, resumes, and sensitive documents.
- **Q:** I deleted a page by accident — can I undo it?
  **A:** Yes. Deleted pages are shown in gray and the ↺ button restores them instantly. Until you click Save, every change (delete, reorder, rotate) lives in memory and can be reverted freely.
- **Q:** How does rotation work?
  **A:** Each press of the ↻ button rotates the page 90 degrees clockwise — cycling through 90, 180, 270, and 0 (original). Rotation is applied at the PDF metadata level so output file size is barely affected.
- **Q:** How do I reorder pages on mobile?
  **A:** Use the ↑ and ↓ buttons on each page card. Desktop additionally supports drag-and-drop. For large jumps, the ↑ and ↓ buttons are more accurate — they work on mobile too.
- **Q:** How many pages can it handle?
  **A:** Initial load grows with page count because thumbnails are rendered. Desktop Chrome handles 100-200 pages comfortably; mobile is best kept under 50. For very large PDFs, split first using the Split PDF tool, then edit.
- **Q:** Can I edit password-protected PDFs?
  **A:** Password-locked PDFs may not process automatically. This tool does not provide decryption. Unlock the PDF in a viewer first, then upload.

---

## pdf-to-image
`en/pdf/pdf-to-image/index.html`

| field | value |
|---|---|
| `<title>` (60c) | PDF to Image | Free PDF to JPG / PNG Converter, No Watermark |
| `meta description` (209c) | Convert PDF pages to PNG or JPG. Choose page range and DPI (resolution). All processing happens in your browser. No watermark, no signup, no install. Great for screenshots, social posts, and email att… |
| `og:title` | PDF to Image | Free PDF to JPG / PNG Converter |
| `og:description` | Convert PDF pages to PNG or JPG. Page-range and DPI options. All processing in your browser. No watermark, no signup. |
| `twitter:title` | PDF to Image | Free PDF to JPG / PNG |
| `twitter:description` | Convert PDF pages to images in your browser. |
| `<h1>` | PDF to Image |
| `subtitle` | Convert PDF pages to PNG or JPG — for social posts, screenshots, and email attachments. |
| privacy box | 🔒 Your PDFs never leave your browser. All processing happens locally on your device. |

**FAQ (6)**
- **Q:** Is the PDF uploaded to a server?
  **A:** No. Conversion happens entirely in the pdf.js library inside your browser. Even the site operator cannot see the contents. Safe for contracts, resumes, and sensitive material.
- **Q:** Should I choose PNG or JPG?
  **A:** PNG (lossless, sharp) is best for pages dominated by text, shapes, and logos. JPG (5-10x smaller for the same quality on photos) is best for scans and photographic content. JPG is usually more efficient for social posts and email attachments.
- **Q:** What DPI should I pick?
  **A:** Screen viewing = 72-150 DPI; standard print = 150-300 DPI; high-quality print = 300-600 DPI. The default of 150 DPI works well for screen, social, and basic print. Doubling DPI roughly quadruples file size, so use only what you need.
- **Q:** How do I enter the page range?
  **A:** Pages are 1-based. Single page = number (e.g. 5); contiguous range = hyphen (e.g. 3-7); multiple groups = comma-separated (e.g. 1-3,5,8-10). Leave empty to convert every page. Whitespace is ignored.
- **Q:** Can I download all pages at once?
  **A:** After conversion, each page gets its own download link. The 'Download all' button triggers them sequentially. If your browser blocks 5+ simultaneous downloads, allow them in the prompt or click each link manually. ZIP-bundle download is on the roadmap.
- **Q:** How do I extract text from images?
  **A:** This tool converts pages into pixel images. For text extraction (OCR), use a dedicated OCR tool. If the PDF is text-based, copy and paste from the PDF directly — that is more accurate.

---

## img-to-pdf
`en/pdf/img-to-pdf/index.html`

| field | value |
|---|---|
| `<title>` (64c) | Image to PDF | Combine JPG / PNG Photos Into a Single PDF — Free |
| `meta description` (222c) | Combine multiple JPG, PNG, or WebP photos into a single PDF. Reorder, page size, and margin options. All processing in your browser. No watermark, no signup, no install. For receipts, assignments, and… |
| `og:title` | Image to PDF | Combine Photos Into a Single PDF — Free |
| `og:description` | Combine multiple JPG, PNG, or WebP photos into a single PDF. Reorder and choose page size. All processing in your browser. No watermark, no signup. |
| `twitter:title` | Image to PDF | Photos into a Single PDF — Free |
| `twitter:description` | Combine multiple photos into a PDF inside your browser. |
| `<h1>` | Image to PDF |
| `subtitle` | Combine multiple photos into a single PDF — for receipts, assignments, document submissions, and digital archiving. |
| privacy box | 🔒 Your images never leave your browser. All processing happens locally on your device. |

**FAQ (6)**
- **Q:** Are my images uploaded to a server?
  **A:** No. PDF generation happens entirely in the pdf-lib library inside your browser. Even the site operator cannot see your image contents. Safe for IDs, contracts, and other sensitive material.
- **Q:** Which image formats are supported?
  **A:** JPG and PNG are embedded directly into the PDF. WebP, GIF, and BMP are auto-converted to PNG first, then embedded. All common image formats work; JPG is the most space-efficient inside a PDF.
- **Q:** Can I change the order of images?
  **A:** Yes. Use the up and down arrows in the image list. Pages are generated top-to-bottom in that order. Remove unwanted images with the X button.
- **Q:** How is the page size determined?
  **A:** Choose A4, Letter, or original size. With A4 and Letter, images are scaled to fit the standard page (preserving aspect ratio) and centered. With 'original size', each PDF page matches the image pixel dimensions — ideal for digital archiving.
- **Q:** How many images can I include in one PDF?
  **A:** There is no hard limit, but it depends on browser memory. Desktop Chrome handles 50-100 images comfortably (assuming ~1-2MB per image). Mobile is best kept to 20-30. For very large photos, compress them first to keep PDF generation fast and reliable.
- **Q:** The PDF is too big — can I shrink it?
  **A:** JPG produces smaller PDFs than PNG. If your originals are PNG, convert them to JPG using an image compressor first, then build the PDF. Resizing to about 1500-2000px wide also shrinks the result significantly.

---
