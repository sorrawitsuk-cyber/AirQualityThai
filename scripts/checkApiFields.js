(async () => {
    try {
        const fireRes = await fetch("https://disaster.gistda.or.th/app-api/services/viirs/7days");
        const fireData = await fireRes.json();
        console.log("=== FIRE (viirs/7days) SAMPLE ===");
        if (fireData.items && fireData.items.length > 0) {
            console.log(JSON.stringify(fireData.items[0], null, 2));
            console.log("Total items:", fireData.items.length);
        }
        
        const burnRes = await fetch("https://disaster.gistda.or.th/app-api/analytics/services/burn_10_Days/burn_10_days?sort=provinceCode:asc,amphoeCode:asc,tambonCode:asc,lu_name:asc,area:asc&offset=0&limit=5");
        const burnData = await burnRes.json();
        console.log("\n=== BURN (burn_10_days) SAMPLE ===");
        if (burnData.items && burnData.items.length > 0) {
            console.log(JSON.stringify(burnData.items[0], null, 2));
            console.log("Total items returned in paginated request:", burnData.items.length);
        }
    } catch (e) {
        console.error(e);
    }
})();
