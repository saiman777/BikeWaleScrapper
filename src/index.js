const { scrapeBikeWale2 } = require('./scraper');
const { readThreeColumnExcel } = require('./excel');
const puppeteer = require('puppeteer');
const XLSX = require('xlsx');
const path = require('path');

// Target city for scraping
const TARGET_CITY = 'visakhapatnam';
// Explicit slug for special cases like multi-part cities
const TARGET_CITY_SLUG = 'visakhapatnam';

// Path to input Excel file
const INPUT_EXCEL = path.join(__dirname, '../data/input/Scooter List (Updated).xlsx');

// Load bike list from Excel file (three-column format)
console.log(`📊 Loading bike list from: ${INPUT_EXCEL}`);
const bikeList = readThreeColumnExcel(INPUT_EXCEL);
console.log(`✅ Loaded ${bikeList.length} bikes from Excel file`);

if (bikeList.length === 0) {
    console.error('❌ No bikes found in the Excel file. Exiting.');
    process.exit(1);
}

console.log(`📊 Processing ${bikeList.length} bikes:`);
bikeList.forEach((bike, index) => {
    console.log(`${index + 1}. ${bike.brand} ${bike.model} ${bike.variant}`);
});

async function runExcelScraper() {
    console.log('🏍️ BikeWale Scraper Starting...');
    console.log(`📊 Total items: ${bikeList.length}`);
    
    const results = [];
    const startTime = Date.now();
    let currentBrand = null;
    let browser;
    
    try {
        // Launch single browser instance
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: "new",
            slowMo: 0,
            devtools: false,
            defaultViewport: { width: 1024, height: 768 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
            timeout: 60000,
            protocolTimeout: 60000
        });
        console.log('✅ Browser launched successfully');
        
        for (let i = 0; i < bikeList.length; i++) {
            const item = bikeList[i];
            console.log(`\n📍 [${i + 1}/${bikeList.length}] Processing: ${item.brand} ${item.model} ${item.variant}`);
            
            // Check if we're switching brands and need to clear browser state
            if (currentBrand && currentBrand !== item.brand) {
                console.log(`🔄 Brand switch detected: ${currentBrand} → ${item.brand}`);
                console.log(`🧹 Clearing browser state between brands...`);
                
                // Clear all cookies and local storage
                const pages = await browser.pages();
                for (const page of pages) {
                    try {
                        await page.deleteCookie();
                        await page.evaluate(() => {
                            localStorage.clear();
                            sessionStorage.clear();
                        });
                    } catch (e) {
                        // Ignore errors
                    }
                }
            }
            currentBrand = item.brand;
            
            try {
                // Use the optimized scrapeBikeWale2 function
                const result = await scrapeBikeWale2(item.brand, item.model, item.variant, TARGET_CITY, TARGET_CITY_SLUG, browser);
                
                // Extract price breakdown data
                const priceBreakdown = result.priceBreakdown || {};
                
                results.push({
                    brand: item.brand,
                    model: item.model,
                    variant: item.variant,
                    exShowroom: priceBreakdown.exShowroom || '0',
                    rto: priceBreakdown.rto || '0',
                    rtoExpense: priceBreakdown.rtoExpense || '0',
                    insurance: priceBreakdown.insurance || '0',
                    onRoadPrice: priceBreakdown.onRoadPrice || '0',
                    'PM E-Drive Subsidy': priceBreakdown.pmEDriveSubsidy || '0',
                    'Software(Pro/Tecpac)': priceBreakdown.softwarePackage || '0',
                    'Discount/Introduction offer': priceBreakdown.discountOffer || '0',
                    status: true,
                    reason: 'Success'
                });
                
                console.log(`✅ [${i + 1}] Success: ${item.brand} ${item.model} ${item.variant}`);
                
            } catch (error) {
                results.push({
                    brand: item.brand,
                    model: item.model,
                    variant: item.variant,
                    exShowroom: '0',
                    rto: '0',
                    rtoExpense: '0',
                    insurance: '0',
                    onRoadPrice: '0',
                    'PM E-Drive Subsidy': '0',
                    'Software(Pro/Tecpac)': '0',
                    'Discount/Introduction offer': '0',
                    status: false,
                    reason: error.message
                });
                
                console.log(`❌ [${i + 1}] Failed: ${item.brand} ${item.model} ${item.variant} - ${error.message}`);
            }
            
            // Small delay between requests
            if (i < bikeList.length - 1) {
                console.log(`⏳ Waiting 2 seconds before next request...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    } catch (error) {
        console.error('💥 Critical error in scraper loop:', error.message);
    } finally {
        // Close browser
        if (browser) {
            console.log('🔒 Closing browser...');
            await browser.close();
        }
    }
    
    const endTime = Date.now();
    const totalTime = Math.round((endTime - startTime) / 1000);
    
    // Create Excel workbook for results
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bike Prices');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(__dirname, '../data/output');
    if (!require('fs').existsSync(outputDir)) {
        require('fs').mkdirSync(outputDir, { recursive: true });
    }
    const filename = `bike_prices_${timestamp}.xlsx`;
    const filepath = path.join(outputDir, filename);
    
    // Write Excel file
    XLSX.writeFile(workbook, filepath);
    
    console.log('\n🎉 Scraping Completed!');
    console.log(`⏱️  Total time: ${totalTime} seconds`);
    console.log(`✅ Successful: ${results.filter(r => r.status).length}/${bikeList.length}`);
    console.log(`❌ Failed: ${results.filter(r => !r.status).length}/${bikeList.length}`);
    console.log(`📁 Excel file saved: ${filepath}`);
}

// Run the scraper
runExcelScraper().catch(console.error);
