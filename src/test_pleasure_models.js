const { readThreeColumnExcel } = require('./excel-converter.js');
const { scrapeBikeWale2 } = require('./myScrapper2.js');
const XLSX = require('xlsx');
const puppeteer = require('puppeteer');

async function testPleasureModels() {
    console.log('🎯 Testing Hero Pleasure+ Models...');
    
    // Read all bikes from Excel
    const allBikes = readThreeColumnExcel('Brand, Models, Variants.xlsx');
    
    // Filter for Hero Pleasure+ models
    const pleasureBikes = allBikes.filter(bike => 
        bike.brand === 'hero' && 
        bike.model.includes('pleasure')
    );
    
    console.log('📋 Found Pleasure+ models:');
    pleasureBikes.forEach((bike, i) => {
        console.log(`${i+1}. ${bike.brand} ${bike.model} ${bike.variant}`);
    });
    
    console.log('\n🏍️ Starting scraping...');
    
    const results = [];
    let browser;
    
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        for (let i = 0; i < pleasureBikes.length; i++) {
            const bike = pleasureBikes[i];
            console.log(`\n📍 [${i + 1}/${pleasureBikes.length}] Processing: ${bike.brand} ${bike.model} ${bike.variant}`);
            
            try {
                const result = await scrapeBikeWale2(bike.brand, bike.model, bike.variant, browser);
                
                results.push({
                    brand: bike.brand,
                    model: bike.model,
                    variant: bike.variant,
                    exShowroom: result.priceBreakdown?.exShowroom || 'N/A',
                    rto: result.priceBreakdown?.rto || 'N/A',
                    insurance: result.priceBreakdown?.insurance || 'N/A',
                    onRoadPrice: result.onRoadPrice?.price || 'N/A',
                    status: true,
                    reason: 'Success'
                });
                
                console.log(`✅ SUCCESS: ${bike.brand} ${bike.model} ${bike.variant} - ${result.onRoadPrice?.price || 'N/A'}`);
                
            } catch (error) {
                results.push({
                    brand: bike.brand,
                    model: bike.model,
                    variant: bike.variant,
                    exShowroom: 'N/A',
                    rto: 'N/A',
                    insurance: 'N/A',
                    onRoadPrice: 'N/A',
                    status: false,
                    reason: error.message
                });
                
                console.log(`❌ FAILED: ${bike.brand} ${bike.model} ${bike.variant} - ${error.message}`);
            }
            
            // Wait between requests
            if (i < pleasureBikes.length - 1) {
                console.log('⏳ Waiting 3 seconds...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    // Save results to Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pleasure Models');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `pleasure_models_${timestamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    console.log('\n📊 RESULTS SUMMARY:');
    const successful = results.filter(r => r.status);
    const failed = results.filter(r => !r.status);
    
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    console.log(`📁 Excel file: ${filename}`);
    
    // Show detailed results
    console.log('\n📋 DETAILED RESULTS:');
    results.forEach((result, i) => {
        console.log(`${i+1}. ${result.brand} ${result.model} ${result.variant}`);
        console.log(`   On-Road Price: ${result.onRoadPrice}`);
        console.log(`   Status: ${result.status ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Reason: ${result.reason}`);
        console.log('');
    });
    
    return results;
}

// Run the test
if (require.main === module) {
    testPleasureModels().catch(console.error);
}

module.exports = { testPleasureModels };
