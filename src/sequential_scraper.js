const { scrapeBikeWale } = require('./myScrapper.js');

/**
 * Simple Sequential BikeWale Scraper
 * Processes bikes one by one using the main scraper
 */

async function scrapeBikesSequentially(bikeList) {
    console.log(`🏍️ Sequential BikeWale Scraper Starting...`);
    console.log(`📊 Total items: ${bikeList.length}`);
    
    const results = [];
    const startTime = Date.now();
    
    let currentBrand = null;
    
    for (let i = 0; i < bikeList.length; i++) {
        const item = bikeList[i];
        console.log(`\n📍 [${i + 1}/${bikeList.length}] Processing: ${item.brand} ${item.model} ${item.variant}`);
        
        // Check if we're switching brands and need to clear browser state
        if (currentBrand && currentBrand !== item.brand) {
            console.log(`🔄 Brand switch detected: ${currentBrand} → ${item.brand}`);
            console.log(`🧹 Clearing browser state between brands...`);
            // The browser will be restarted automatically by the next scrapeBikeWale call
        }
        currentBrand = item.brand;
        
        try {
            const result = await scrapeBikeWale(item.brand, item.model, item.variant);
            console.log(`✅ [${i + 1}] Success: ${item.brand} ${item.model} ${item.variant} - ₹${result.onRoadPrice?.price || 'N/A'}`);
            results.push({
                success: true,
                data: result,
                originalIndex: i,
                brand: item.brand,
                model: item.model,
                variant: item.variant
            });
        } catch (error) {
            console.log(`❌ [${i + 1}] Failed: ${item.brand} ${item.model} ${item.variant} - ${error.message}`);
            results.push({
                success: false,
                error: error.message,
                originalIndex: i,
                brand: item.brand,
                model: item.model,
                variant: item.variant
            });
        }
        
        // 3-second delay between requests
        if (i < bikeList.length - 1) {
            console.log(`⏳ Waiting 3 seconds before next request...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    const endTime = Date.now();
    const totalTime = Math.round((endTime - startTime) / 1000);
    
    // Summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n🎉 Sequential Scraping Completed!`);
    console.log(`⏱️  Total time: ${totalTime} seconds`);
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    console.log(`⚡ Average time per item: ${Math.round(totalTime / results.length)} seconds`);
    
    // Detailed success list
    if (successful.length > 0) {
        console.log(`\n✅ SUCCESSFUL ITEMS (${successful.length}):`);
        successful.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.brand} ${item.model} ${item.variant} - ₹${item.data.onRoadPrice?.price || 'N/A'}`);
        });
    }
    
    // Detailed failure list
    if (failed.length > 0) {
        console.log(`\n❌ FAILED ITEMS (${failed.length}):`);
        failed.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.brand} ${item.model} ${item.variant} - ${item.error}`);
        });
    }
    
    return {
        results,
        summary: {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            totalTime: totalTime,
            averageTimePerItem: Math.round(totalTime / results.length)
        }
    };
}

// Example usage with your valid bike list
async function runExample() {
    const bikeList = [
        { brand: 'vespa', model: 's 150', variant: 'standard' },
        { brand: 'vespa', model: 's 150', variant: 'tech' },
        { brand: 'vespa', model: 'vxl 125', variant: 'premium' },
        { brand: 'vespa', model: 'vxl 150', variant: 'dual' },
        { brand: 'vespa', model: 'sxl 125', variant: 'premium' },
        { brand: 'yamaha', model: 'rayzr 125 fi', variant: 'street rally hybrid' },
        { brand: 'yamaha', model: 'fascino 125', variant: 'drum hybrid' },
        { brand: 'yamaha', model: 'fascino 125', variant: 'drum deluxe' }
    ];
    
    try {
        const results = await scrapeBikesSequentially(bikeList);
        
        // Return the complete results object
        return results;
            
    } catch (error) {
        console.error('❌ Sequential scraping failed:', error.message);
        throw error;
    }
}

// Export functions
module.exports = {
    scrapeBikesSequentially
};

// Run example if called directly
if (require.main === module) {
    runExample().then(results => {
        console.log('\n📊 COMPLETE RESULTS DATA:');
        console.log(JSON.stringify(results, null, 2));
    }).catch(console.error);
}
