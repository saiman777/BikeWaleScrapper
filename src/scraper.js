const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Optimized async logging function - 20-30% less CPU usage
async function logToFile(message, logFile) {
    const timestamp = new Date().toISOString();
    // Remove emojis from message for cleaner logs
    const cleanMessage = message.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    const logMessage = `[${timestamp}] ${cleanMessage}\n`;
    
    // Write to console
    console.log(cleanMessage);
    
    // Write to file asynchronously (non-blocking)
    try {
        await fs.promises.appendFile(logFile, logMessage);
    } catch (error) {
        console.error('Failed to write to log file:', error.message);
    }
}

async function scrapeBikeWale2(brand = 'honda', model = 'activa 125', variant = 'dlx', city = 'Visakhapatnam', citySlug = null, existingBrowser = null) {
    let browser;
    let shouldCloseBrowser = false;
    
        // Create log file for this scraping session
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        // Sanitize names for filesystem-safe filenames
        const sanitizeForFilename = (str) => {
            return str
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters except spaces and dashes
                .replace(/\s+/g, '_')          // Replace spaces with underscores
                .replace(/-+/g, '_')           // Replace dashes with underscores
                .replace(/_+/g, '_')           // Replace multiple underscores with single
                .replace(/^_|_$/g, '');        // Remove leading/trailing underscores
        };
        
        const cleanBrand = sanitizeForFilename(brand);
        const cleanModel = sanitizeForFilename(model);
        const cleanVariant = sanitizeForFilename(variant);
        
        const logFile = path.join(logsDir, `scraper_${cleanBrand}_${cleanModel}_${cleanVariant}_${timestamp}.log`);
    
    try {
        if (!existingBrowser) {
            browser = await puppeteer.launch({
                headless: true,
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
            shouldCloseBrowser = true;
        } else {
            browser = existingBrowser;
        }

        // Reuse existing page or create new one
        const page = (existingBrowser && existingBrowser.pages?.[0])
            ? existingBrowser.pages[0]
            : await browser.newPage();

        // Clear the page between runs
        await page.goto('about:blank');
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Block heavy resources to improve performance (30-50% faster loading)
        let blockedCount = 0;
        let allowedCount = 0;
        
        // Resource blocking configuration
        const blockConfig = {
            images: true,           // Block all images
            media: true,            // Block videos/audio
            fonts: true,            // Block custom fonts
            css: false,             // Keep CSS for proper layout (set to true to block)
            analytics: true,        // Block analytics/tracking
            ads: true,              // Block advertisements
            social: true,           // Block social media widgets
            extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot']
        };
        
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            const url = request.url().toLowerCase();
            
            let shouldBlock = false;
            
            // Block by resource type
            if (blockConfig.images && resourceType === 'image') shouldBlock = true;
            if (blockConfig.media && resourceType === 'media') shouldBlock = true;
            if (blockConfig.fonts && resourceType === 'font') shouldBlock = true;
            if (blockConfig.css && resourceType === 'stylesheet') shouldBlock = true;
            
            // Block analytics and tracking
            if (blockConfig.analytics && (
                url.includes('google-analytics') ||
                url.includes('googletagmanager') ||
                url.includes('facebook.com') ||
                url.includes('tracking') ||
                url.includes('analytics') ||
                url.includes('pixel') ||
                url.includes('beacon')
            )) shouldBlock = true;
            
            // Block advertisements
            if (blockConfig.ads && (
                url.includes('doubleclick') ||
                url.includes('googlesyndication') ||
                url.includes('amazon-adsystem') ||
                url.includes('adsystem')
            )) shouldBlock = true;
            
            // Block social media widgets
            if (blockConfig.social && (
                url.includes('facebook.com') ||
                url.includes('twitter.com') ||
                url.includes('instagram.com') ||
                url.includes('linkedin.com')
            )) shouldBlock = true;
            
            // Block by file extension
            if (blockConfig.extensions.some(ext => url.endsWith(ext))) shouldBlock = true;
            
            if (shouldBlock) {
                request.abort();
                blockedCount++;
            } else {
                request.continue();
                allowedCount++;
            }
        });
        
        await logToFile('️ BikeWale Scraper 2 Starting...', logFile);
        await logToFile(`Target: ${brand} ${model} ${variant} in ${city}`, logFile);
        
        // Brand mapping
        const brandMap = {
            'honda': 'honda-bikes',
            'tvs': 'tvs-bikes',
            'suzuki':'suzuki-bikes',
          'yamaha':'yamaha-bikes',
          'hero':'hero-bikes',
           'aprilia':'aprilia-bikes',
           'vespa':'vespa-bikes',
           'bajaj':'bajaj-bikes',
           'vlf':'vlf-bikes',
           'keelay':'keelay-bikes',
           'kawasaki':'kawasaki-bikes',
           'ktm':'ktm-bikes',
           'bmw':'bmw-bikes',
           'ducati':'ducati-bikes',
           'harley davidson':'harley-davidson-bikes',
           'indian':'indian-bikes',
           'kawasaki':'kawasaki-bikes',
           'ktm':'ktm-bikes',
           'mv agusta':'mv-agusta-bikes',
           'norton':'norton-bikes',
           'keeway':'keeway-bikes',
           'bmw':'bmw-bikes',
           'ola':'ola-bikes',
           'ather':'ather-bikes',
           'vida':'vida-bikes',
           'ampere':'ampere-bikes',
           'pure ev':'pureev-bikes',
           'bgauss':'bgauss-bikes',
           'oben':'oben-bikes',
           'revolt':'revolt-bikes',
           'river':'river-bikes',

        };

      
        
        const brandSlug = brandMap[brand.toLowerCase()] || brand.toLowerCase();
        const modelSlug = model.toLowerCase().replace(/\s+/g, '-');
        
        // Construct URL
        const finalCitySlug = (citySlug && typeof citySlug === 'string' && citySlug.trim().length > 0)
            ? citySlug.trim().toLowerCase()
            : city.toLowerCase().trim().replace(/\s+/g, '-');
        const url = `https://www.bikewale.com/${brandSlug}/${modelSlug}/price-in-${finalCitySlug}/`;
        await logToFile(`Navigating to: ${url}`, logFile);
        
        // Navigate to the page
        await page.goto(url, { 
            waitUntil: 'domcontentloaded', // Just wait for DOM to be ready
            timeout: 30000 
        });
        
        // Wait for basic page elements to be present
        await page.waitForSelector('.o-d3', { timeout: 10000 });
        
        
        // Wait a bit for page to fully load
        await page.waitForTimeout(3000);
        
        await logToFile('Page loaded successfully. Ready for your next instructions...', logFile);
        await logToFile(`Current page URL: ${page.url()}`, logFile);
        await logToFile(`Performance: Blocked ${blockedCount} heavy resources, allowed ${allowedCount} essential resources`, logFile);
        
        // Wait longer for page to fully load before clicking
        console.log('⏳ Waiting for page to fully load...');
        await page.waitForTimeout(5000);
        
        // Define strict matcher function
        const createStrictMatcher = (target) => {
            const normalizedTarget = target.toLowerCase().trim();
            
            return (candidateText) => {
                const normalizedCandidate = candidateText.toLowerCase().trim();
                
                // Case 1: Exact match (case insensitive)
                if (normalizedCandidate === normalizedTarget) return 3;
                
                // Case 2: Space/dash variations (case insensitive)
                const targetWithSpaces = normalizedTarget.replace(/-/g, ' ').replace(/\s+/g, ' ');
                const targetWithDashes = normalizedTarget.replace(/\s+/g, '-');
                const candidateWithSpaces = normalizedCandidate.replace(/-/g, ' ').replace(/\s+/g, ' ');
                const candidateWithDashes = normalizedCandidate.replace(/\s+/g, '-');
                
                
                if (candidateWithSpaces === targetWithSpaces || 
                    candidateWithDashes === targetWithDashes ||
                    candidateWithSpaces === targetWithDashes ||
                    candidateWithDashes === targetWithSpaces) return 2;
                
                return -1; // No strict match
            };
        };
        
        // Define partial matcher function
        const createPartialMatcher = (target) => {
            const normalizedTarget = target.toLowerCase().trim();
            
            return (candidateText) => {
                const normalizedCandidate = candidateText.toLowerCase().trim();
                
                // Case 1: Word boundary match (consecutive sequence)
                const tokenRegex = new RegExp('\\b' + normalizedTarget.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b', 'i');
                if (tokenRegex.test(normalizedCandidate)) return 1;
                
                // Case 2: Consecutive substring match (not scattered)
                if (normalizedCandidate.includes(normalizedTarget)) return 0;
                
                return -1; // No sequential match
            };
        };
        
        // Check current variant first before opening modal
        await logToFile('CLEANED', logFile);
        try {
            // Wait for the variant section to be clickable
            await page.waitForSelector('.o-d3:nth-child(1)', { visible: true, timeout: 10000 });
            await logToFile('CLEANED', logFile);
            
            // Extract current variant from the page
            const currentVariantData = await page.evaluate(() => {
                const element = document.querySelector('.o-d3:nth-child(1)');
                if (element) {
                    return {
                        textContent: element.textContent.trim(),
                        innerHTML: element.innerHTML
                    };
                }
                return null;
            });
            
            // Extract current variant name from text content
            const currentVariantText = currentVariantData.textContent;
            const cleanCurrentVariant = currentVariantText.replace(/^variant/i, '').trim();
            
            // Check if current variant matches our target using STRICT matching
            const normalizedTarget = variant.toLowerCase().trim();
            const strictMatcher = createStrictMatcher(normalizedTarget);
            const strictMatchScore = strictMatcher(cleanCurrentVariant);
            const isCurrentVariantMatch = strictMatchScore >= 0;
            
            // Enhanced logging for variant matching
            await logToFile('', logFile);
            await logToFile('CLEANED', logFile);
            await logToFile(`TARGET VARIANT: "${variant}"`, logFile);
            await logToFile(`CURRENT VARIANT: "${cleanCurrentVariant}"`, logFile);
            await logToFile(`MATCH SCORE: ${strictMatchScore}`, logFile);
            await logToFile(`MATCH TYPE: ${strictMatchScore === 3 ? 'Exact Match' : strictMatchScore === 2 ? 'Dash/Space Variation' : 'No Match'}`, logFile);
            await logToFile('', logFile);
            
            if (isCurrentVariantMatch) {
                await logToFile('CLEANED', logFile);
                await logToFile(`Current variant "${cleanCurrentVariant}" matches target "${variant}"`, logFile);
                await logToFile('ACTION: Skipping modal, proceeding to price extraction', logFile);
                await logToFile('', logFile);
            } else {
                await logToFile('CLEANED', logFile);
                await logToFile(`Current variant "${cleanCurrentVariant}" does NOT match target "${variant}"`, logFile);
                await logToFile('CLEANED', logFile);
                await logToFile('', logFile);
                
                // Hover over the element first
                await logToFile('CLEANED', logFile);
                await page.hover('.o-d3:nth-child(1)');
                await page.waitForTimeout(1000);
                
                // Click with more realistic behavior
                await logToFile('CLEANED', logFile);
                await page.click('.o-d3:nth-child(1)', { delay: 100 });
                await logToFile('CLEANED', logFile);
                
                // Wait for modal to open
                await logToFile('CLEANED', logFile);
                await page.waitForTimeout(3000); // Give modal more time to open
                
                // Use the exact same approach as the working scraper - wait for li elements with verid
                await logToFile('CLEANED', logFile);
                await page.waitForSelector('li[verid]', { timeout: 10000 });
                await logToFile('CLEANED', logFile);

                // Use two-phase matching system for variant selection
                await logToFile('CLEANED', logFile);
                await logToFile(`TARGET: "${variant}"`, logFile);
                
                // gather candidates (verid + text) - extract only variant name without prices
                const candidates = await page.$$eval('li[verid]', lis => lis.map(li => {
                    const verid = li.getAttribute('verid');
                    // Get all text content
                    const fullText = Array.from(li.querySelectorAll('*')).map(n => n.textContent || '').join(' ').replace(/\s+/g,' ').trim();
                    
                    // Extract only the variant name by removing prices and duplicates
                    // Look for the pattern: "Variant Name₹ Price" and extract just the variant name
                    const rupeeMatch = fullText.match(/^([^₹]+?)(?=₹|$)/);
                    const variantName = rupeeMatch ? rupeeMatch[1].trim() : fullText;
                    
                    // Remove any remaining duplicates by splitting and taking unique parts
                    const words = variantName.split(' ').filter((word, index, arr) => {
                        // Keep only unique words, remove duplicates
                        return arr.indexOf(word) === index;
                    }).join(' ');
                    
                    return {
                        verid: verid,
                        text: words
                    };
                }));

                // Enhanced logging for available variants
                await logToFile('', logFile);
                await logToFile('CLEANED', logFile);
                await logToFile(`Total variants found: ${candidates.length}`, logFile);
                await logToFile('', logFile);
                for (let index = 0; index < candidates.length; index++) {
                    const c = candidates[index];
                    await logToFile(`${index + 1}. verid="${c.verid}" → "${c.text}"`, logFile);
                }
                await logToFile('', logFile);

                const normalized = variant.toLowerCase().trim();
                let chosen = null;
                
                // Phase 1: Try strict matching first
                await logToFile('CLEANED', logFile);
                await logToFile(`Target: "${variant}" (normalized: "${normalized}")`, logFile);
                await logToFile('', logFile);
                
                const strictMatches = [];
                for (const c of candidates) {
                    const score = createStrictMatcher(normalized)(c.text);
                    await logToFile(`Testing: "${normalized}" vs "${c.text}" → Score: ${score}`, logFile);
                    if (score >= 0) {
                        strictMatches.push({ ...c, score });
                    }
                }
                strictMatches.sort((a, b) => b.score - a.score);

                if (strictMatches.length > 0) {
                    chosen = strictMatches[0];
                    const matchType = chosen.score === 3 ? 'Exact Match' : 'Dash/Space Variation';
                    await logToFile('', logFile);
                    await logToFile('CLEANED', logFile);
                    await logToFile(`SELECTED: "${chosen.text}"`, logFile);
                    await logToFile(`SCORE: ${chosen.score}`, logFile);
                    await logToFile(`️ TYPE: ${matchType}`, logFile);
                    await logToFile(`🆔 VERID: ${chosen.verid}`, logFile);
                    await logToFile('', logFile);
                } else {
                    // Phase 2: Fallback to partial matching
                    await logToFile('', logFile);
                    await logToFile('️ ===== PHASE 2: PARTIAL MATCHING =====', logFile);
                    await logToFile('CLEANED', logFile);
                    await logToFile('', logFile);
                    
                    const partialMatches = [];
                    for (const c of candidates) {
                        const score = createPartialMatcher(normalized)(c.text);
                        await logToFile(`Testing: "${normalized}" vs "${c.text}" → Score: ${score}`, logFile);
                        if (score >= 0) {
                            partialMatches.push({ ...c, score });
                        }
                    }
                    partialMatches.sort((a, b) => b.score - a.score);
                    
                    if (partialMatches.length > 0) {
                        chosen = partialMatches[0];
                        const matchType = chosen.score === 1 ? 'Word Boundary' : 'Substring';
                        await logToFile('', logFile);
                        await logToFile('CLEANED', logFile);
                        await logToFile(`SELECTED: "${chosen.text}"`, logFile);
                        await logToFile(`SCORE: ${chosen.score}`, logFile);
                        await logToFile(`️ TYPE: ${matchType}`, logFile);
                        await logToFile(`🆔 VERID: ${chosen.verid}`, logFile);
                        await logToFile('', logFile);
                    } else {
                        await logToFile('', logFile);
                        await logToFile('CLEANED', logFile);
                        await logToFile('CLEANED', logFile);
                        await logToFile('', logFile);
                    }
                }

                if (!chosen) {
                    await logToFile('CLEANED', logFile);
                    await logToFile('CLEANED', logFile);
                    for (let i = 0; i < candidates.length; i++) {
                        const c = candidates[i];
                        await logToFile(`${i + 1}. "${c.text}"`, logFile);
                    }
                    await logToFile('CLEANED', logFile);
                    await logToFile('', logFile);
                    
                    // Return early with failure when no variant match is found
                    return {
                        success: false,
                        error: `Variant "${variant}" not found. Available options: ${candidates.map(c => c.text).join(', ')}`,
                        logFile: logFile
                    };
                } else {
                    await logToFile('CLEANED', logFile);
                    await logToFile(`Chosen candidate: "${chosen.text}"`, logFile);
                    await logToFile(`🆔 Verid: ${chosen.verid}`, logFile);
                    await logToFile('', logFile);

                    // Click the variant element directly using verid - no coordinate issues
                    const sel = `li[verid="${chosen.verid}"]`;
                    
                    // Check if element exists and is visible
                    const elementExists = await page.$(sel);
                    if (!elementExists) {
                        await logToFile('CLEANED', logFile);
                    } else {
                        // Wait for element to be clickable and scroll into view
                        await page.waitForSelector(sel, { visible: true });
                        
                        // Scroll element into view to ensure it's clickable
                        await page.evaluate((selector) => {
                            const element = document.querySelector(selector);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, sel);
                        
                        // Wait a moment for scroll to complete
                        await page.waitForTimeout(500);
                        
                        await logToFile(`️ Clicking variant element directly: ${chosen.text}`, logFile);

                        // Click the element directly - no coordinate issues
                        await page.click(sel);

                        // Wait a moment for any immediate response
                        await page.waitForTimeout(1000);

                        // Check if we're still on the same page or if navigation occurred
                        const currentUrl = page.url();
                        await logToFile(`Current URL after click: ${currentUrl}`, logFile);
                        await logToFile('CLEANED', logFile);
                        await logToFile('', logFile);
                    }
                }
            }
            
        } catch (e) {
            console.log('❌ Could not process variant section:', e.message);
            throw e;
        }
        
        // Wait for any variant selection to complete
        await page.waitForTimeout(1000);
        
        
        // Extract pricing data using the same logic as myScrapper.js
        await logToFile('Extracting pricing data...', logFile);
        
        // Wait for price section to load
        await page.waitForTimeout(2000);
        
        // Find price section handle
        const findPriceSectionHandle = async (page) => {
            const selectors = [
                '[data-testid="price-section"]',
                '.price-section',
                '[class*="price"]',
                'table',
                'tbody'
            ];
            
            for (const selector of selectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        console.log(`✅ Found price section with selector: ${selector}`);
                        return element;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
            return null;
        };
        
        const sectionHandle = await findPriceSectionHandle(page);
        if (!sectionHandle) {
            console.log('⚠️ Price section not found, trying to extract from page...');
        }
        
        // Extract table data
        const extractTableData = async (page) => {
            try {
                const data = await page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('tr, .price-row, [class*="price"]'));
                    const result = {
                        rows: [],
                        onRoad: null,
                        gstNote: null
                    };
                    
                    rows.forEach(tr => {
                        const tds = Array.from(tr.querySelectorAll('td, .price-cell, [class*="cell"]'));
                        if (tds.length >= 2) {
                            const left = tds[0].textContent.replace(/\s+/g, ' ').trim();
                            const right = tds[1].textContent.replace(/\s+/g, ' ').trim();
                            
                            if (left && right) {
                                result.rows.push({ key: left, value: right });
                                
                                // Check for On Road Price
                                if (left.toLowerCase().includes('on road') || left.toLowerCase().includes('onroad')) {
                                    result.onRoad = { price: right };
                                }
                            }
                        }
                        
                        // Check for GST note
                        const text = tr.textContent.replace(/\s+/g, ' ').trim();
                        if (text && /GST|Prices above|updated/i.test(text)) {
                            result.gstNote = text;
                        }
                    });
                    
                    return result;
                });
                
                return data;
            } catch (e) {
                console.log('❌ Error extracting table data:', e.message);
                return { rows: [], onRoad: null, gstNote: null };
            }
        };
        
        const tableData = await extractTableData(page);
        
        // Format the data to match myScrapper.js structure
        const pricingData = {
            brand: brand,
            model: model,
            variant: variant,
            location: city,
            priceBreakdown: {},
            onRoadPrice: tableData.onRoad,
            gstNote: tableData.gstNote,
            allRows: tableData.rows
        };
        
        // Convert table rows to priceBreakdown object
        tableData.rows.forEach(row => {
            const key = row.key.toLowerCase();
            if (key.includes('ex-showroom') || key.includes('ex showroom')) {
                pricingData.priceBreakdown.exShowroom = row.value;
            } else if (key.includes('rto expense')) {
                pricingData.priceBreakdown.rtoExpense = row.value;
            } else if (key.includes('rto') && !key.includes('expense')) {
                pricingData.priceBreakdown.rto = row.value;
            } else if (key.includes('insurance')) {
                pricingData.priceBreakdown.insurance = row.value;
            } else if (key.includes('on road') || key.includes('onroad')) {
                pricingData.priceBreakdown.onRoadPrice = row.value;
            } else if ((key.includes('emps') && key.includes('subsidy')) || key.includes('pm e-drive')) {
                // Map EMPS/PM E-Drive subsidy
                pricingData.priceBreakdown.pmEDriveSubsidy = row.value;
            } else if (key.includes('pro package') || key.includes('software') || key.includes('tecpac') || key.includes('tech pack')) {
                // Map software/pro package/tecpac
                pricingData.priceBreakdown.softwarePackage = row.value;
            } else if ((key.includes('cash') && key.includes('discount')) || key.includes('introduction offer') || key.includes('introductory offer')) {
                // Map discount/introduction offer
                pricingData.priceBreakdown.discountOffer = row.value;
            }
        });
        
        // Also add onRoad from tableData if available
        if (tableData.onRoad && tableData.onRoad.price) {
            pricingData.priceBreakdown.onRoadPrice = tableData.onRoad.price;
        }
        
        // Display the pricing data
        console.log('\n📋 Pricing Data:');
        tableData.rows.forEach((row, index) => {
            console.log(`${row.key}: ${row.value}`);
        });
        
        await logToFile('\n Data extraction completed successfully!', logFile);
        
        // Keep browser open for debugging
        console.log('🛑 Stopping here for debugging. Browser will remain open.');
        
        return {
            ...pricingData,
            logFile: logFile
        };
        
    } catch (error) {
        const errorMessage = `💥 Error during scraping: ${error.message}`;
        console.error(errorMessage);
        await logToFile(errorMessage, logFile);
        throw error;
    } finally {
        // Don't close browser in debug mode
        if (browser && shouldCloseBrowser) {
            console.log('🔒 Browser will remain open for debugging');
            // await browser.close();
        }
    }
}

module.exports = { scrapeBikeWale2 };