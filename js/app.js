const CITIES = {
    barcelona: { id: "barcelona", name: "Barcelona", country: "Espanya", lat: 41.38879, lon: 2.15899, currency: "EUR", symbol: "€" },
    london: { id: "london", name: "London", country: "Regne Unit", lat: 51.50853, lon: -0.12574, currency: "GBP", symbol: "£" },
    paris: { id: "paris", name: "París", country: "França", lat: 48.85341, lon: 2.3488, currency: "EUR", symbol: "€" },
    new_york: { id: "new_york", name: "Nova York", country: "Estats Units", lat: 40.71427, lon: -74.00597, currency: "USD", symbol: "$" },
    tokyo: { id: "tokyo", name: "Tòquio", country: "Japó", lat: 35.6895, lon: 139.69171, currency: "JPY", symbol: "¥" }
};

const citySelect = document.getElementById('city-select');
const dashboard = document.getElementById('dashboard');
const loadingSpinner = document.getElementById('loading-spinner');
const summaryCity = document.getElementById('summary-city');
const summaryCountry = document.getElementById('summary-country');
const summaryCurrency = document.getElementById('summary-currency');
const summaryTemp = document.getElementById('summary-temp');
const weatherIcon = document.getElementById('weather-icon');
const weatherDesc = document.getElementById('weather-desc');
const probVal = document.getElementById('prob-val');
const probBarFill = document.getElementById('prob-bar-fill');
const probText = document.getElementById('prob-text');
const eurInput = document.getElementById('eur-amount');
const originalAmountLabel = document.getElementById('original-amount');
const conversionResult = document.getElementById('conversion-result');
const exchangeRateInfo = document.getElementById('exchange-rate-info');
const travelMsg = document.getElementById('travel-msg');

let currentExchangeRates = null;
let currentSelectedCity = null;

function init() {
    citySelect.addEventListener('change', handleCityChange);
    eurInput.addEventListener('input', handleCurrencyCalculation);
    
    // Carregar Barcelona per defecte al inici
    citySelect.value = "barcelona";
    handleCityChange({ target: { value: "barcelona" } });
}

async function handleCityChange(event) {
    const cityId = event.target.value;
    const cityData = CITIES[cityId];
    if (!cityData) return;

    currentSelectedCity = cityData;
    
    // UI feedback
    loadingSpinner.classList.add('active');
    dashboard.classList.remove('active');

    try {
        const [weatherData, currencyData] = await Promise.all([
            fetchWeatherData(cityData.lat, cityData.lon),
            fetchCurrencyData()
        ]);

        currentExchangeRates = currencyData.rates;
        updateUI(cityData, weatherData, currentExchangeRates);
        
        loadingSpinner.classList.remove('active');
        dashboard.classList.add('active');
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("S'ha produït un error en carregar les dades. Si us plau, torna-ho a provar.");
        loadingSpinner.classList.remove('active');
    }
}

async function fetchWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation_probability,is_day,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error a l'API del temps");
    const data = await response.json();
    return data.current;
}

async function fetchCurrencyData() {
    const url = `https://open.er-api.com/v6/latest/EUR`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error a l'API de moneda");
    return await response.json();
}

function updateUI(city, weather, rates) {
    summaryCity.innerText = city.name;
    summaryCountry.innerText = city.country;
    summaryCurrency.innerText = `Moneda: ${city.currency} (${city.symbol})`;
    summaryTemp.innerText = `${Math.round(weather.temperature_2m)}°C`;

    updateWeatherUI(weather);
    handleCurrencyCalculation();
    generateTravelMessage(city, weather);
}

function updateWeatherUI(weather) {
    const prob = weather.precipitation_probability;
    probVal.innerText = `${prob}%`;
    probBarFill.style.width = `${prob}%`;

    if (prob <= 20) {
        probText.innerText = "☀️ Sense pluja";
        probText.style.color = "#10b981";
    } else if (prob <= 50) {
        probText.innerText = "☁️ Possible pluja";
        probText.style.color = "#f59e0b";
    } else {
        probText.innerText = "🌧️ Probable pluja";
        probText.style.color = "#ef4444";
    }

    const codeMap = {
        0: { icon: "☀️", desc: "Cel clar" },
        1: { icon: "🌤️", desc: "Principalment clar" },
        2: { icon: "⛅", desc: "Parcialment ennuvolat" },
        3: { icon: "☁️", desc: "Ennuvolat" },
        45: { icon: "🌫️", desc: "Boira" },
        51: { icon: "🌧️", desc: "Pluja lleugera" },
        61: { icon: "🌧️", desc: "Pluja" },
        71: { icon: "❄️", desc: "Neu" },
        95: { icon: "⛈️", desc: "Tempesta" }
    };

    const condition = codeMap[weather.weather_code] || { icon: "🌤️", desc: "Desconegut" };
    weatherIcon.innerText = condition.icon;
    weatherDesc.innerText = condition.desc;
}

function handleCurrencyCalculation() {
    if (!currentExchangeRates || !currentSelectedCity) return;

    const eurAmount = parseFloat(eurInput.value) || 0;
    const rate = currentExchangeRates[currentSelectedCity.currency];
    const converted = eurAmount * rate;

    originalAmountLabel.innerText = eurAmount.toLocaleString('de-DE');
    conversionResult.innerText = `${converted.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currentSelectedCity.symbol}`;
    exchangeRateInfo.innerText = `1 EUR = ${rate.toFixed(4)} ${currentSelectedCity.currency}`;
}

function generateTravelMessage(city, weather) {
    const temp = weather.temperature_2m;
    const prob = weather.precipitation_probability;
    let advice = "";

    if (temp < 10) advice = "Recorda portar jaqueta: la temperatura és força baixa.";
    else if (temp > 25) advice = "Fa molta calor, hidrata't bé per passejar per la ciutat!";
    else advice = "Avui fa un temps ideal per explorar cada racó de la ciutat.";

    if (prob > 40) advice += " No oblidis el paraigua, podria ploure en qualsevol moment.";

    let currencyMsg = "";
    if (city.currency !== 'EUR') {
        const rate = currentExchangeRates[city.currency];
        currencyMsg = ` Recorda que 100 EUR equivalen a uns ${Math.round(100 * rate)} ${city.currency}.`;
    }

    travelMsg.innerHTML = `" <strong>${advice}</strong>${currencyMsg} "`;
}

init();
