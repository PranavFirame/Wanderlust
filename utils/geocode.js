// Dictionary of famous world and Indian destinations for instant offline fallback
const CITY_COORDINATES = {
    "malibu": [-118.6894, 34.0356],
    "new york": [-74.0060, 40.7128],
    "new york city": [-74.0060, 40.7128],
    "aspen": [-106.8235, 39.1911],
    "florence": [11.2558, 43.7696],
    "tuscany": [11.2558, 43.7696],
    "paris": [2.3522, 48.8566],
    "london": [-0.1278, 51.5074],
    "tokyo": [139.6917, 35.6895],
    "bali": [115.1889, -8.4095],
    "rome": [12.4964, 41.9028],
    "santorini": [25.4615, 36.3932],
    "jaipur": [75.7873, 26.9124],
    "shimla": [77.1708, 31.1040],
    "manali": [77.1887, 32.2396],
    "goa": [74.0855, 15.3005],
    "mumbai": [72.8777, 19.0760],
    "delhi": [77.2090, 28.6139],
    "new delhi": [77.2090, 28.6139],
    "udaipur": [73.7125, 24.5854],
    "bangalore": [77.5946, 12.9716],
    "bengaluru": [77.5946, 12.9716],
    "hyderabad": [78.4867, 17.3850],
    "pune": [73.8567, 18.5204],
    "chennai": [80.2707, 13.0827],
    "kolkata": [88.3639, 22.5726],
    "kerala": [76.2711, 10.8505],
    "dubai": [55.2708, 25.2048],
    "switzerland": [8.2275, 46.8182],
    "cancun": [-86.8515, 21.1619],
    "sydney": [151.2093, -33.8688]
};

async function geocodeAddress(location, country) {
    const locClean = (location || "").trim();
    const countryClean = (country || "").trim();
    const query = [locClean, countryClean].filter(Boolean).join(", ");

    if (!query) {
        return [77.2090, 28.6139]; // Default coordinates
    }

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(url, {
            headers: {
                "User-Agent": "WanderLustApp/1.0 (travel@wanderlust.com)"
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                const lon = parseFloat(data[0].lon);
                const lat = parseFloat(data[0].lat);
                if (!isNaN(lon) && !isNaN(lat)) {
                    return [lon, lat];
                }
            }
        }
    } catch (err) {
        // Fall back to dictionary
    }

    // Match with dictionary fallback
    const locLower = locClean.toLowerCase();
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
        if (locLower.includes(key)) {
            return coords;
        }
    }

    const countryLower = countryClean.toLowerCase();
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
        if (countryLower.includes(key)) {
            return coords;
        }
    }

    return [77.2090, 28.6139];
}

module.exports = { geocodeAddress };
