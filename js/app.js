
/* =====================================================
   DOM ELEMENTS
===================================================== */

const searchForm = document.getElementById("searchForm");

const cityInput = document.getElementById("cityInput");

const searchBtn = document.getElementById("searchBtn");

const locationBtn = document.getElementById("locationBtn");

const loading = document.getElementById("loading");

const errorMessage = document.getElementById("errorMessage");

const currentWeather = document.getElementById("currentWeather");

const forecastSection = document.getElementById("forecastSection");

const forecastContainer =
    document.getElementById("forecastContainer");

const cityName =
    document.getElementById("cityName");

const countryName =
    document.getElementById("countryName");

const weatherTime =
    document.getElementById("weatherTime");

const weatherIcon =
    document.getElementById("weatherIcon");

const weatherDescription =
    document.getElementById("weatherDescription");

const temperature =
    document.getElementById("temperature");

const temperatureUnit =
    document.getElementById("temperatureUnit");

const humidity =
    document.getElementById("humidity");

const windSpeed =
    document.getElementById("windSpeed");

const feelsLike =
    document.getElementById("feelsLike");

const precipitation =
    document.getElementById("precipitation");

const celsiusBtn =
    document.getElementById("celsiusBtn");

const fahrenheitBtn =
    document.getElementById("fahrenheitBtn");

const historyContainer =
    document.getElementById("historyContainer");

const clearHistoryBtn =
    document.getElementById("clearHistoryBtn");


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let currentWeatherData = null;

let currentLocation = null;

let currentUnit = "C";

let searchHistory =
    JSON.parse(localStorage.getItem("weatherHistory")) || [];


/* =====================================================
   PAGE LOAD
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    displaySearchHistory();

});


/* =====================================================
   SEARCH FORM
===================================================== */

searchForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {

        showError("Please enter a city name.");

        return;
    }

    await searchWeather(city);

});


/* =====================================================
   MAIN SEARCH FUNCTION
===================================================== */

async function searchWeather(city) {

    try {

        showLoading();

        hideError();

        hideWeather();

        /*
            Step 1:
            Find the city coordinates
        */

        const location =
            await searchCity(city);


        /*
            Step 2:
            Get weather using coordinates
        */

        const weather =
            await getWeather(
                location.latitude,
                location.longitude
            );


        /*
            Step 3:
            Save current data
        */

        currentLocation = location;

        currentWeatherData = weather;


        /*
            Step 4:
            Display weather
        */

        displayWeather(
            location,
            weather
        );


        /*
            Step 5:
            Display forecast
        */

        displayForecast(weather);


        /*
            Step 6:
            Save search
        */

        saveSearch(location.name);


    }

    catch (error) {

        console.error(error);

        showError(
            error.message ||
            "Unable to retrieve weather data."
        );

    }

    finally {

        hideLoading();

    }

}


/* =====================================================
   GEOCODING API
===================================================== */

async function searchCity(city) {

    const url =
        `https://geocoding-api.open-meteo.com/v1/search?` +
        `name=${encodeURIComponent(city)}` +
        `&count=1` +
        `&language=en` +
        `&format=json`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Unable to connect to the location service."
        );

    }


    const data =
        await response.json();


    if (!data.results || data.results.length === 0) {

        throw new Error(
            `City "${city}" was not found.`
        );

    }


    const result =
        data.results[0];


    return {

        name: result.name,

        country: result.country,

        latitude: result.latitude,

        longitude: result.longitude

    };

}


/* =====================================================
   WEATHER API
===================================================== */

async function getWeather(latitude, longitude) {

    const url =
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=auto` +
        `&forecast_days=5`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Unable to retrieve weather information."
        );

    }


    const data =
        await response.json();


    return data;

}


/* =====================================================
   DISPLAY CURRENT WEATHER
===================================================== */

function displayWeather(location, weather) {

    /*
        Location
    */

    cityName.textContent =
        location.name;

    countryName.textContent =
        location.country;


    /*
        Time
    */

    weatherTime.textContent =
        `Local time: ${formatDateTime(weather.current.time)}`;


    /*
        Weather code
    */

    const code =
        weather.current.weather_code;


    const weatherInfo =
        getWeatherInfo(code);


    weatherIcon.textContent =
        weatherInfo.icon;


    weatherDescription.textContent =
        weatherInfo.description;


    /*
        Temperature
    */

    const temp =
        weather.current.temperature_2m;

    updateTemperatureDisplay(temp);


    /*
        Humidity
    */

    humidity.textContent =
        weather.current.relative_humidity_2m;


    /*
        Wind
    */

    windSpeed.textContent =
        weather.current.wind_speed_10m;


    /*
        Feels like
    */

    feelsLike.textContent =
        weather.current.apparent_temperature;


    /*
        Precipitation
    */

    precipitation.textContent =
        weather.current.precipitation;


    /*
        Show section
    */

    currentWeather.classList.remove("hidden");

}


/* =====================================================
   DISPLAY FORECAST
===================================================== */

function displayForecast(weather) {

    forecastContainer.innerHTML = "";


    const daily =
        weather.daily;


    for (let i = 0; i < daily.time.length; i++) {

        const date =
            formatDate(daily.time[i]);


        const code =
            daily.weather_code[i];


        const weatherInfo =
            getWeatherInfo(code);


        const maxTemp =
            daily.temperature_2m_max[i];


        const minTemp =
            daily.temperature_2m_min[i];


        const rainProbability =
            daily.precipitation_probability_max[i];


        const card =
            document.createElement("div");


        card.className =
            "forecast-card";


        card.innerHTML = `

            <div class="forecast-date">
                ${date}
            </div>

            <div class="forecast-icon">
                ${weatherInfo.icon}
            </div>

            <div class="forecast-description">
                ${weatherInfo.description}
            </div>

            <div class="forecast-temp">

                ${formatTemperature(maxTemp)}
                /
                ${formatTemperature(minTemp)}

            </div>

            <div class="forecast-rain">

                💧 ${rainProbability}% rain

            </div>

        `;


        forecastContainer.appendChild(card);

    }


    forecastSection.classList.remove("hidden");

}


/* =====================================================
   WEATHER CODE CONVERSION
===================================================== */

function getWeatherInfo(code) {

    const weatherCodes = {

        0: {
            description: "Clear sky",
            icon: "☀️"
        },

        1: {
            description: "Mainly clear",
            icon: "🌤️"
        },

        2: {
            description: "Partly cloudy",
            icon: "⛅"
        },

        3: {
            description: "Overcast",
            icon: "☁️"
        },

        45: {
            description: "Fog",
            icon: "🌫️"
        },

        48: {
            description: "Depositing rime fog",
            icon: "🌫️"
        },

        51: {
            description: "Light drizzle",
            icon: "🌦️"
        },

        53: {
            description: "Moderate drizzle",
            icon: "🌦️"
        },

        55: {
            description: "Dense drizzle",
            icon: "🌧️"
        },

        61: {
            description: "Slight rain",
            icon: "🌧️"
        },

        63: {
            description: "Moderate rain",
            icon: "🌧️"
        },

        65: {
            description: "Heavy rain",
            icon: "🌧️"
        },

        71: {
            description: "Slight snow",
            icon: "🌨️"
        },

        73: {
            description: "Moderate snow",
            icon: "🌨️"
        },

        75: {
            description: "Heavy snow",
            icon: "❄️"
        },

        80: {
            description: "Slight rain showers",
            icon: "🌦️"
        },

        81: {
            description: "Moderate rain showers",
            icon: "🌧️"
        },

        82: {
            description: "Violent rain showers",
            icon: "⛈️"
        },

        95: {
            description: "Thunderstorm",
            icon: "⛈️"
        },

        96: {
            description: "Thunderstorm with hail",
            icon: "⛈️"
        },

        99: {
            description: "Thunderstorm with heavy hail",
            icon: "⛈️"
        }

    };


    return weatherCodes[code] || {

        description: "Unknown weather",
        icon: "🌍"

    };

}


/* =====================================================
   TEMPERATURE CONVERSION
===================================================== */

function celsiusToFahrenheit(celsius) {

    return (celsius * 9 / 5) + 32;

}


/* =====================================================
   FORMAT TEMPERATURE
===================================================== */

function formatTemperature(celsius) {

    let value;


    if (currentUnit === "C") {

        value = celsius;

    }

    else {

        value =
            celsiusToFahrenheit(celsius);

    }


    return `${Math.round(value)}°`;

}


/* =====================================================
   UPDATE MAIN TEMPERATURE
===================================================== */

function updateTemperatureDisplay(celsius) {

    let value;


    if (currentUnit === "C") {

        value = celsius;

        temperatureUnit.textContent =
            "°C";

    }

    else {

        value =
            celsiusToFahrenheit(celsius);

        temperatureUnit.textContent =
            "°F";

    }


    temperature.textContent =
        Math.round(value);

}


/* =====================================================
   CELSIUS BUTTON
===================================================== */

celsiusBtn.addEventListener("click", function () {

    currentUnit = "C";

    celsiusBtn.classList.add("active");

    fahrenheitBtn.classList.remove("active");


    if (currentWeatherData) {

        updateTemperatureDisplay(
            currentWeatherData.current.temperature_2m
        );

        displayForecast(
            currentWeatherData
        );

    }

});


/* =====================================================
   FAHRENHEIT BUTTON
===================================================== */

fahrenheitBtn.addEventListener("click", function () {

    currentUnit = "F";

    fahrenheitBtn.classList.add("active");

    celsiusBtn.classList.remove("active");


    if (currentWeatherData) {

        updateTemperatureDisplay(
            currentWeatherData.current.temperature_2m
        );

        displayForecast(
            currentWeatherData
        );

    }

});


/* =====================================================
   LOCAL STORAGE
===================================================== */

function saveSearch(city) {

    /*
        Remove duplicate
    */

    searchHistory =
        searchHistory.filter(
            item =>
                item.toLowerCase() !==
                city.toLowerCase()
        );


    /*
        Add city at beginning
    */

    searchHistory.unshift(city);


    /*
        Keep only latest 8
    */

    searchHistory =
        searchHistory.slice(0, 8);


    /*
        Save
    */

    localStorage.setItem(
        "weatherHistory",
        JSON.stringify(searchHistory)
    );


    displaySearchHistory();

}


/* =====================================================
   DISPLAY SEARCH HISTORY
===================================================== */

function displaySearchHistory() {

    historyContainer.innerHTML = "";


    if (searchHistory.length === 0) {

        historyContainer.innerHTML =
            "<p>No recent searches.</p>";

        return;

    }


    searchHistory.forEach(function (city) {

        const item =
            document.createElement("button");


        item.className =
            "history-item";


        item.textContent =
            city;


        item.addEventListener(
            "click",
            function () {

                cityInput.value = city;

                searchWeather(city);

            }
        );


        historyContainer.appendChild(item);

    });

}


/* =====================================================
   CLEAR HISTORY
===================================================== */

clearHistoryBtn.addEventListener(
    "click",
    function () {

        searchHistory = [];


        localStorage.removeItem(
            "weatherHistory"
        );


        displaySearchHistory();

    }
);


/* =====================================================
   GEOLOCATION
===================================================== */

locationBtn.addEventListener(
    "click",
    function () {

        if (!navigator.geolocation) {

            showError(
                "Geolocation is not supported by your browser."
            );

            return;

        }


        showLoading();

        hideError();


        navigator.geolocation.getCurrentPosition(

            async function (position) {

                try {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;


                    const weather =
                        await getWeather(
                            latitude,
                            longitude
                        );


                    const location = {

                        name: "Your Location",

                        country: "",

                        latitude: latitude,

                        longitude: longitude

                    };


                    currentLocation =
                        location;

                    currentWeatherData =
                        weather;


                    displayWeather(
                        location,
                        weather
                    );


                    displayForecast(
                        weather
                    );

                }

                catch (error) {

                    console.error(error);

                    showError(
                        "Unable to retrieve weather for your location."
                    );

                }

                finally {

                    hideLoading();

                }

            },

            function (error) {

                hideLoading();

                showError(
                    "Unable to access your location. Please allow location access."
                );

                console.error(error);

            }

        );

    }
);


/* =====================================================
   DATE FORMATTING
===================================================== */

function formatDate(dateString) {

    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "short",
            month: "short",
            day: "numeric"
        }
    );

}


/* =====================================================
   DATE + TIME
===================================================== */

function formatDateTime(dateString) {

    const date =
        new Date(dateString);


    return date.toLocaleString(
        "en-US",
        {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =====================================================
   LOADING FUNCTIONS
===================================================== */

function showLoading() {

    loading.classList.remove("hidden");

}


function hideLoading() {

    loading.classList.add("hidden");

}


/* =====================================================
   ERROR FUNCTIONS
===================================================== */

function showError(message) {

    errorMessage.textContent =
        message;

    errorMessage.classList.remove(
        "hidden"
    );

}


function hideError() {

    errorMessage.classList.add(
        "hidden"
    );

}


/* =====================================================
   HIDE WEATHER
===================================================== */

function hideWeather() {

    currentWeather.classList.add(
        "hidden"
    );

    forecastSection.classList.add(
        "hidden"
    );

}