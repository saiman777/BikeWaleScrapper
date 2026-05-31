const { readThreeColumnExcel } = require('./excel-converter.js');
const { scrapeBikeWale } = require('./myScrapper.js');
const { scrapeBikeWale2 } = require('./myScrapper2.js');
const { scrapeBikesSequentially } = require('./sequential_scraper.js');

/**
 * Test script to run the first 3 bikes from Excel through the scrapers
 */

async function testExcelScrapers() {
    console.log('🧪 Testing Excel Scrapers with First 3 Bikes\n');
    
    try {
        // Read the Excel file and get first 3 bikes
        console.log('📊 Reading Excel file...');
        const allBikes = readThreeColumnExcel('Brand, Models, Variants.xlsx');
        const testBikes = allBikes.slice(0, 3);
        
        console.log(`\n🎯 Test Bikes (First 3 from Excel):`);
        testBikes.forEach((bike, index) => {
            console.log(`  ${index + 1}. ${bike.brand} ${bike.model} ${bike.variant}`);
        });
        
        console.log('\n' + '='.repeat(60));
        console.log('🏍️ TESTING MAIN SCRAPER: myScrapper2.js');
        console.log('='.repeat(60));
        
        // Test with myScrapper2.js (main scraper) - one by one
        for (let i = 0; i < testBikes.length; i++) {
            const bike = testBikes[i];
            console.log(`\n📍 [${i + 1}/3] Testing: ${bike.brand} ${bike.model} ${bike.variant}`);
            
            try {
                const result = await scrapeBikeWale2(bike.brand, bike.model, bike.variant);
                console.log(`✅ SUCCESS: ${bike.brand} ${bike.model} ${bike.variant}`);
                console.log(`💰 On Road Price: ${result.onRoadPrice?.price || 'N/A'}`);
                console.log(`🏪 Ex-Showroom: ${result.priceBreakdown?.exShowroom || 'N/A'}`);
                console.log(`📋 All Rows: ${result.allRows?.length || 0} price components found`);
            } catch (error) {
                console.log(`❌ FAILED: ${bike.brand} ${bike.model} ${bike.variant}`);
                console.log(`   Error: ${error.message}`);
            }
            
            // Wait between requests
            if (i < testBikes.length - 1) {
                console.log('⏳ Waiting 5 seconds before next request...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🏍️ TESTING SEQUENTIAL SCRAPER (using myScrapper2.js)');
        console.log('='.repeat(60));
        
        // Test with sequential scraper (which uses myScrapper.js internally)
        // Note: Sequential scraper uses myScrapper.js, but we can test it anyway
        try {
            const sequentialResults = await scrapeBikesSequentially(testBikes);
            console.log('\n📊 Sequential Scraper Results:');
            console.log(`✅ Successful: ${sequentialResults.summary.successful}/${sequentialResults.summary.total}`);
            console.log(`❌ Failed: ${sequentialResults.summary.failed}/${sequentialResults.summary.total}`);
            console.log(`⏱️ Total Time: ${sequentialResults.summary.totalTime} seconds`);
        } catch (error) {
            console.log(`❌ Sequential scraper failed: ${error.message}`);
        }
        
        console.log('\n🎉 Excel Scraper Testing Completed!');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testExcelScrapers()
        .then(() => {
            console.log('\n✅ All tests completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testExcelScrapers };
