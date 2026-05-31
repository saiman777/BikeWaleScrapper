# BikeWale Scraper

A sophisticated web scraping tool designed to extract real-time motorcycle and scooter pricing data from BikeWale. This tool automates the process of navigating various brands, models, and variants to provide comprehensive on-road price breakdowns.

## 🚀 Features

- **Automated Data Extraction:** Scrapes ex-showroom prices, RTO charges, insurance, and other cost components.
- **Excel Integration:** Reads target bike lists directly from Excel files and exports results back to structured Excel workbooks.
- **Optimized Performance:**
    - **Resource Blocking:** Blocks heavy assets (images, fonts, ads) to speed up page loads by 30-50%.
    - **Browser Reuse:** Maintains a single browser instance for batch processing to reduce overhead.
    - **Smart Variant Matching:** Uses a two-phase (Strict + Partial) matching algorithm to accurately select bike variants.
- **Async Logging:** Non-blocking logging system for high-performance monitoring.

## 🛠️ Tech Stack

- **Node.js**
- **Puppeteer:** Headless browser automation.
- **XLSX (SheetJS):** Excel data processing.
- **fs-extra:** Enhanced file system operations.

## 📋 Prerequisites

- Node.js (v16 or higher recommended)
- npm (Node Package Manager)

## ⚙️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/saiman777/BikeWaleScrapper.git
   cd BikeWaleScrapper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 🚀 Usage

1. **Prepare Input:** Place your target bike list in `data/input/Scooter List (Updated).xlsx`. Ensure the data starts from Row 3 with Columns:
    - **B:** Brand
    - **C:** Model
    - **D:** Variant

2. **Run Scraper:**
   ```bash
   npm start
   ```

3. **Check Results:**
    - **Logs:** Real-time progress is available in the `logs/` directory.
    - **Output:** Final pricing data is saved as an Excel file in `data/output/bike_prices_[timestamp].xlsx`.

## 📁 Project Structure

- `src/index.js`: Main entry point and orchestration logic.
- `src/scraper.js`: Core scraping engine and browser automation.
- `src/excel.js`: Excel reading and writing utilities.
- `data/input/`: Directory for source Excel files.
- `data/output/`: Directory for generated pricing reports.
- `logs/`: Directory for session log files.

## ⚖️ License

This project is for educational/research purposes. Please ensure compliance with BikeWale's Terms of Service before use.
