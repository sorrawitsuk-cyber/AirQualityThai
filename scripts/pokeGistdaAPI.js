import puppeteer from 'puppeteer';

(async () => {
    let fireEndpoint = '';
    let burnEndpoint = '';

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('response', async (response) => {
        const url = response.url();
        if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
            try {
                if (url.includes('viirs/7days') || url.includes('7day')) {
                    fireEndpoint = url;
                }
                if (url.includes('burn_10_days') || url.includes('burn')) {
                    burnEndpoint = url;
                }
            } catch {}
        }
    });

    console.log('Navigating to GISTDA...');
    await page.goto('https://disaster.gistda.or.th/dashboard', { waitUntil: 'networkidle2', timeout: 60000 });
    
    await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('.ant-tabs-tab-btn'));
        const fireTab = tabs.find(t => t.innerText.includes('ไฟป่า'));
        if (fireTab) fireTab.click();
    });
    await new Promise(r => setTimeout(r, 4000));
    
    console.log('--- FOUND URLS ---');
    console.log('FIRE:', fireEndpoint);
    console.log('BURN:', burnEndpoint);

    await browser.close();

    console.log('\n--- TESTING DIRECT FETCH ---');
    if (fireEndpoint) {
        try {
            const res = await fetch(fireEndpoint);
            if (res.ok) {
                const data = await res.json();
                console.log('✅ DIRECT FETCH WORKED FOR FIRE! length:', data.items?.length);
            } else {
                console.log('❌ DIRECT FETCH FAILED (CORS or Blocked):', res.status);
            }
        } catch(e) { console.error('Error fetching fire:', e.message); }
    }

    if (burnEndpoint) {
        try {
            const res = await fetch(burnEndpoint);
            if (res.ok) {
                const data = await res.json();
                console.log('✅ DIRECT FETCH WORKED FOR BURN! length:', data.items?.length);
            } else {
                console.log('❌ DIRECT FETCH FAILED:', res.status);
            }
        } catch(e) { console.error('Error fetching burn:', e.message); }
    }
    
    process.exit(0);
})();
