export async function getWeather(city: string): Promise<string> {
    try {
        // 1. Geocoding with Open-Meteo (No API key needed)
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=fr&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json() as any;

        if (!geoData.results || geoData.results.length === 0) {
            return `Désolé, je n'ai pas trouvé la ville de ${city} avec Open-Meteo.`;
        }

        const { latitude, longitude, name, country, admin1 } = geoData.results[0];
        const locationStr = admin1 ? `${name}, ${admin1}, ${country}` : `${name}, ${country}`;

        // 2. Weather Forecast with Open-Meteo
        // current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto&forecast_days=1`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
            return "Désolé, le service Open-Meteo est momentanément indisponible.";
        }

        const weatherData = await weatherResponse.json() as any;
        const current = weatherData.current;
        const temp = Math.round(current.temperature_2m);
        const feelsLike = Math.round(current.apparent_temperature);
        const humidity = current.relative_humidity_2m;
        const wind = Math.round(current.wind_speed_10m);
        const weatherCode = current.weather_code;

        // Interpret WMO Weather Code
        const weatherDesc = interpretWMOCode(weatherCode);

        return `À ${locationStr}, il fait actuellement ${temp}°C (ressenti ${feelsLike}°C) avec ${weatherDesc}. L'humidité est de ${humidity}% et le vent souffle à ${wind} km/h.`;

    } catch (error) {
        console.error("Open-Meteo service error:", error);
        return "Une erreur est survenue lors de la récupération de la météo via Open-Meteo.";
    }
}

/**
 * Interprets WMO Weather Interpretation Codes (WW)
 * https://open-meteo.com/en/docs
 */
function interpretWMOCode(code: number): string {
    const codes: Record<number, string> = {
        0: "un ciel dégagé",
        1: "un ciel principalement dégagé",
        2: "un ciel partiellement nuageux",
        3: "un ciel couvert",
        45: "du brouillard",
        48: "du brouillard givrant",
        51: "une bruine légère",
        53: "une bruine modérée",
        55: "une bruine dense",
        61: "une pluie légère",
        63: "une pluie modérée",
        65: "une pluie forte",
        71: "des chutes de neige légères",
        73: "des chutes de neige modérées",
        75: "des chutes de neige fortes",
        77: "des grains de neige",
        80: "des averses de pluie légères",
        81: "des averses de pluie modérées",
        82: "des averses de pluie violentes",
        85: "des averses de neige légères",
        86: "des averses de neige fortes",
        95: "un orage léger ou modéré",
        96: "un orage avec grêle légère",
        99: "un orage avec grêle forte"
    };
    return codes[code] || "des conditions météo variables";
}
