document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const closeBtn = document.querySelector('.close-btn');
    const mainContent = document.querySelector('.main-content');
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const weatherSections = document.querySelectorAll('.weather-section');
    const unitBtns = document.querySelectorAll('.unit-btn');
    const searchInput = document.getElementById('location-search');
    const searchBtn = document.querySelector('.search-btn');
    const currentLocation = document.getElementById('current-location');

    // Weather API Configuration
    const API_KEY = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key
    let currentUnit = 'celsius';
    let currentCity = 'London'; // Default city

    // Initialize the app
    initApp();

    function initApp() {
        // Set up event listeners
        setupEventListeners();

        // Load default weather data
        fetchWeatherData(currentCity);
    }

    function setupEventListeners() {
        // Sidebar toggle
        menuToggle.addEventListener('click', toggleSidebar);
        closeBtn.addEventListener('click', toggleSidebar);

        // Navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                showSection(sectionId);

                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                // Close sidebar on mobile
                if (window.innerWidth < 992) {
                    toggleSidebar();
                }
            });
        });

        // Unit toggle
        unitBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                unitBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentUnit = this.classList.contains('celsius') ? 'celsius' : 'fahrenheit';

                // Convert temperatures
                convertTemperatures(currentUnit);
            });
        });

        // Search functionality
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    function toggleSidebar() {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('shifted');
    }

    function showSection(sectionId) {
        weatherSections.forEach(section => {
            section.classList.remove('active');
        });

        document.getElementById(`${sectionId}-section`).classList.add('active');
    }

    function handleSearch() {
        const city = searchInput.value.trim();
        if (city) {
            currentCity = city;
            fetchWeatherData(city);
            searchInput.value = '';
        }
    }

    async function fetchWeatherData(city) {
        try {
            // Show loading state
            currentLocation.textContent = 'Loading...';

            // Fetch current weather
            const currentResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
            );

            if (!currentResponse.ok) {
                throw new Error('City not found');
            }

            const currentData = await currentResponse.json();

            // Fetch forecast data
            const forecastResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
            );

            const forecastData = await forecastResponse.json();

            // Update UI with weather data
            updateCurrentWeather(currentData);
            updateForecast(forecastData);
            updateLocation(currentData);

        } catch (error) {
            console.error('Error fetching weather data:', error);
            currentLocation.textContent = 'Error loading weather data';
            // You could show a more user-friendly error message here
        }
    }

    function updateCurrentWeather(data) {
        // Update main weather info
        document.getElementById('current-temp').textContent = Math.round(data.main.temp);
        document.getElementById('weather-desc').textContent = data.weather[0].description;

        // Update weather icon
        const iconCode = data.weather[0].icon;
        document.getElementById('weather-icon').src =
            `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        // Update details
        document.getElementById('feels-like').textContent = Math.round(data.main.feels_like);
        document.getElementById('wind-speed').textContent = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
        document.getElementById('humidity').textContent = data.main.humidity;
        document.getElementById('visibility').textContent = (data.visibility / 1000).toFixed(1);
    }

    function updateForecast(data) {
        // Group forecast by day for daily forecast
        const dailyForecast = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'long' });

            if (!dailyForecast[day]) {
                dailyForecast[day] = {
                    min: item.main.temp_min,
                    max: item.main.temp_max,
                    icon: item.weather[0].icon,
                    description: item.weather[0].description
                };
            } else {
                if (item.main.temp_min < dailyForecast[day].min) {
                    dailyForecast[day].min = item.main.temp_min;
                }
                if (item.main.temp_max > dailyForecast[day].max) {
                    dailyForecast[day].max = item.main.temp_max;
                }
            }
        });

        // Update hourly forecast (next 24 hours)
        const hourlyContainer = document.getElementById('hourly-forecast');
        hourlyContainer.innerHTML = '';

        for (let i = 0; i < 8; i++) { // Show next 8 periods (24 hours)
            const item = data.list[i];
            const date = new Date(item.dt * 1000);
            const time = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            hourlyItem.innerHTML = `
        <div class="time">${time}</div>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}">
        <div class="temp">${Math.round(item.main.temp)}°</div>
      `;
            hourlyContainer.appendChild(hourlyItem);
        }

        // Update daily forecast
        const dailyContainer = document.getElementById('daily-forecast');
        dailyContainer.innerHTML = '';

        Object.entries(dailyForecast).forEach(([day, forecast]) => {
            const dailyItem = document.createElement('div');
            dailyItem.className = 'daily-item';
            dailyItem.innerHTML = `
        <div class="day">${day}</div>
        <div class="weather">
          <img src="https://openweathermap.org/img/wn/${forecast.icon}.png" alt="${forecast.description}">
        </div>
        <div class="temps">
          <span class="max-temp">${Math.round(forecast.max)}°</span>
          <span class="min-temp">${Math.round(forecast.min)}°</span>
        </div>
      `;
            dailyContainer.appendChild(dailyItem);
        });
    }

    function updateLocation(data) {
        currentLocation.textContent = `${data.name}, ${data.sys.country}`;
    }

    function convertTemperatures(unit) {
        const tempElements = document.querySelectorAll('.temp, .max-temp, .min-temp, #current-temp, #feels-like');

        tempElements.forEach(element => {
            const currentTemp = parseFloat(element.textContent);
            let convertedTemp;

            if (unit === 'fahrenheit') {
                // Convert from Celsius to Fahrenheit
                convertedTemp = (currentTemp * 9 / 5) + 32;
            } else {
                // Convert from Fahrenheit to Celsius
                convertedTemp = (currentTemp - 32) * 5 / 9;
            }

            element.textContent = Math.round(convertedTemp);
        });

        // Update unit display
        document.querySelectorAll('.unit').forEach(unitEl => {
            unitEl.textContent = unit === 'celsius' ? '°C' : '°F';
        });
    }
});