# B2B SecureRedact PDF Tool

A premium, local, privacy-respecting PDF Redaction and Sanitization tool designed for agencies and service providers to safely strip PII, sensitive identifiers, and hidden metadata from client documents before external sharing.

## Key Features

1. **Rule-Based Auto-Detection Engine:** Instant scanning for Emails, Phone Numbers, Social Security Numbers (SSNs), Employer Identification Numbers (EINs), Credit Cards, and IP Addresses.
2. **Interactive Drawing Canvas:** Click and drag directly on the PDF pages to blackout any block, image, or custom grid visually.
3. **Custom Text & Regex Matching:** Dynamically search for client names, custom codes, or unique identifiers and apply batch redaction overlays.
4. **True PDF Redaction:** Uses PyMuPDF's official redaction system to permanently excise binary text blocks, vector lines, and image pixels. Redacted content *cannot* be copied, pasted, or recovered.
5. **Metadata Stripping:** Cleans hidden document properties, creating dates, creator software traces, and structural residue.
6. **Ephemeral Compliance:** Processes files locally on your machine with automatic 15-minute inactivity session purges.

---

## Installation & Setup

1. **System Requirements:** Python 3.10+ (Fully tested on Python 3.14 on Windows).
2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Run Application:**
   ```bash
   python app.py
   ```
4. **Access Web Interface:**
   Open your browser and navigate to:
   ```
   http://127.0.0.1:8000
   ```

---

## Technical Stack & Architecture

- **Backend:** FastAPI (Python), PyMuPDF (fitz) for PDF binary parsing, rendering, and true redaction blocks.
- **Frontend:** Vanilla HTML5, Vanilla ES6 JavaScript (zero heavy framework runtime), custom Google Fonts (Inter, Outfit), FontAwesome.
- **Aesthetic:** Corporate Minimalist Light/Dark theme featuring smooth micro-animations, clean shadow maps, and deep Indigo accents.
