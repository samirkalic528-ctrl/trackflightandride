/**
 * City Taxi Booking and Flight Tracking Application
 * Integrates Google Maps API, AirLabs API, and Open-Meteo Weather API
 */

// Global state variables
let map = null;
let marker = null;
let directionsService = null;
let directionsRenderer = null;
let pickupAutocomplete = null;
let dropoffAutocomplete = null;
let googleMapsLoaded = false;
let activeFlightData = null;
let isReversePath = false;
let deferredPrompt = null;

// ==========================================================================
// Višejezični prevodi (srpski, engleski, ruski)
// ==========================================================================
let currentLang = 'sr';

const translations = {
    sr: {
        header_subtitle: "NS 021 - Praćenje Letova & Transferi",
        install_app: "Preuzmi App",
        hero_badge_text: "Powered by City Taxi NS 021",
        hero_title: "Track Your Flight & Order Ride",
        hero_desc: "Ova aplikacija je napravljena da Vam besplatno pomogne u praćenju statusa leta i kašnjenja aviona u realnom vremenu. Projekat je podržan od strane City Taxi udruženja kako bi svim putnicima olakšao putovanje i omogućio jednostavnu rezervaciju premium transfera do i od aerodroma.",
        tracker_title: "Pretraga i Praćenje Statusa Leta",
        tracker_subtitle: "Podržava City Taxi NS 021",
        tracker_placeholder: "UNESITE BROJ LETA (NPR. JU380, LH1411, AA6)",
        search_btn: "Proveri status leta",
        tracker_help: "Proverite poletanje, sletanje, kašnjenja u realnom vremenu i vremenske uslove na destinaciji i polazištu.",
        status_on_time: "Na vreme",
        flight_panel_title: "Detalji Leta & Vremenska Prognoza",
        departure_label: "Polazak:",
        arrival_label: "Sletanje:",
        forecast_origin_label: "Prognoza u polazištu",
        forecast_dest_label: "Prognoza na destinaciji (Beograd)",
        weather_loading: "Učitavanje...",
        delay_title: "Let kasni! Detektovano kašnjenje:",
        delay_text: "Obaveštenje o kašnjenju je poslato dispečeru radi prilagođavanja vožnje.",
        booking_sec_title: "Rezervišite transfer",
        booking_sec_subtitle: "Nakon provere leta, rezervišite Premium transfer koji će Vas čekati tačno na vreme",
        form_title: "Rezervacija vožnje",
        route_label: "Izaberite relaciju",
        route_ns_airport: "Novi Sad ➔ Aerodrom Nikola Tesla (Beograd)",
        route_airport_ns: "Aerodrom Nikola Tesla (Beograd) ➔ Novi Sad",
        route_ns_bgd: "Novi Sad ➔ Beograd (Grad)",
        route_bgd_ns: "Beograd (Grad) ➔ Novi Sad",
        passenger_name_label: "Ime i prezime",
        passenger_name_placeholder: "Unesite Vaše ime i prezime",
        passenger_phone_label: "Broj telefona",
        passenger_phone_placeholder: "Npr. +381 60 123 4567",
        date_label: "Datum",
        time_label: "Vreme preuzimanja",
        vehicle_class_label: "Klasa vozila",
        class_standard: "Standard",
        class_business: "Business",
        class_van: "Van",
        linked_flight_label: "Povezan let za praćenje:",
        early_warning_title: "Preporuka za raniji polazak!",
        early_warning_desc: "Aerodrom traži da budete tamo 2 sata pre poletanja. S obzirom na trajanje puta, preporučujemo da vreme polaska pomerite na ranije kako biste stigli na vreme.",
        price_label: "Fiksna cena transfera:",
        fixed_badge: "Fiksno",
        submit_btn: "Rezerviši transfer",
        map_title: "Pregled Rute & Praćenje",
        map_badge_demo: "Demo Mapa",
        promo_title: "City Taxi Benefiti",
        promo_desc: "Iskoristite dodatne pogodnosti tokom boravka u Novom Sadu:",
        viber_btn_label: "Viber Bot",
        viber_btn_sub: "Poruči preko Vibera",
        app_btn_label: "Mobilna App",
        app_btn_sub: "Preuzmi na Google Play",
        conf_success_title: "Uspešna Rezervacija!",
        conf_order_label: "Broj porudžbine:",
        conf_success_desc: "Vaš transfer je potvrđen i poslat u City Taxi dispečerski centar.",
        conf_route_label: "Relacija:",
        conf_name_label: "Klijent:",
        conf_phone_label: "Broj telefona:",
        conf_datetime_label: "Datum i vreme:",
        conf_flight_label: "Let za praćenje:",
        conf_vehicle_label: "Klasa vozila:",
        conf_price_label: "Ukupna cena:",
        conf_download_title: "Preuzmite našu aplikaciju i Viber Bot",
        conf_download_desc: "Za lakše poručivanje vozila i praćenje vožnje dok ste u gradu Novom Sadu, preuzmite našu mobilnu aplikaciju ili koristite Viber Bot. Nakon preuzimanja možete slobodno zatvoriti ovu karticu.",
        conf_viber_btn_label: "Viber Bot",
        conf_app_btn_label: "Mobilna App",
        conf_close_tab_hint: "Nakon preuzimanja možete slobodno zatvoriti ovaj tab.",
        conf_sim_btn: "Započni simulaciju vožnje"
    },
    en: {
        header_subtitle: "NS 021 - Flight Tracking & Transfers",
        install_app: "Install App",
        hero_badge_text: "Powered by City Taxi NS 021",
        hero_title: "Track Your Flight & Book Your Ride",
        hero_desc: "This application is designed to help you track your flight status and delays in real-time for free. The project is supported by the City Taxi association to make traveling easier for all passengers and enable simple booking of premium transfers to and from the airport.",
        tracker_title: "Search & Track Flight Status",
        tracker_subtitle: "Supported by City Taxi NS 021",
        tracker_placeholder: "ENTER FLIGHT NUMBER (E.G. JU380, LH1411, AA6)",
        search_btn: "Check flight status",
        tracker_help: "Check departure, arrival, real-time delays, and weather conditions at origin and destination.",
        status_on_time: "On Time",
        flight_panel_title: "Flight Details & Weather Forecast",
        departure_label: "Departure:",
        arrival_label: "Arrival:",
        forecast_origin_label: "Forecast at Origin",
        forecast_dest_label: "Forecast at Destination (Belgrade)",
        weather_loading: "Loading...",
        delay_title: "Flight delayed! Detected delay:",
        delay_text: "Delay notification has been sent to the dispatcher to adjust the ride.",
        booking_sec_title: "Book your transfer",
        booking_sec_subtitle: "After checking your flight, book a Premium transfer that will wait for you right on time",
        form_title: "Ride Booking",
        route_label: "Select Route",
        route_ns_airport: "Novi Sad ➔ Belgrade Nikola Tesla Airport",
        route_airport_ns: "Belgrade Nikola Tesla Airport ➔ Novi Sad",
        route_ns_bgd: "Novi Sad ➔ Belgrade (City)",
        route_bgd_ns: "Belgrade (City) ➔ Novi Sad",
        passenger_name_label: "Full Name",
        passenger_name_placeholder: "Enter your full name",
        passenger_phone_label: "Phone Number",
        passenger_phone_placeholder: "E.g. +381 60 123 4567",
        date_label: "Date",
        time_label: "Pickup Time",
        vehicle_class_label: "Vehicle Class",
        class_standard: "Standard",
        class_business: "Business",
        class_van: "Van",
        linked_flight_label: "Linked Flight for Tracking:",
        early_warning_title: "Recommendation for Early Departure!",
        early_warning_desc: "The airport requires you to be there 2 hours before takeoff. Given the travel duration, we recommend changing the departure time to earlier to arrive on time.",
        price_label: "Fixed Transfer Price:",
        fixed_badge: "Fixed",
        submit_btn: "Book Transfer",
        map_title: "Route Preview & Tracking",
        map_badge_demo: "Demo Map",
        promo_title: "City Taxi Benefits",
        promo_desc: "Take advantage of additional benefits during your stay in Novi Sad:",
        viber_btn_label: "Viber Bot",
        viber_btn_sub: "Order via Viber",
        app_btn_label: "Mobile App",
        app_btn_sub: "Get on Google Play",
        conf_success_title: "Successful Booking!",
        conf_order_label: "Order Number:",
        conf_success_desc: "Your transfer has been confirmed and sent to the City Taxi dispatch center.",
        conf_route_label: "Route:",
        conf_name_label: "Client:",
        conf_phone_label: "Phone Number:",
        conf_datetime_label: "Date & Time:",
        conf_flight_label: "Flight for Tracking:",
        conf_vehicle_label: "Vehicle Class:",
        conf_price_label: "Total Price:",
        conf_download_title: "Download our App & Viber Bot",
        conf_download_desc: "For easier and faster ride ordering in Novi Sad, download our mobile app or use our Viber Bot. You can now safely close this tab.",
        conf_viber_btn_label: "Viber Bot",
        conf_app_btn_label: "Mobile App",
        conf_close_tab_hint: "You may close this tab after downloading.",
        conf_sim_btn: "Start Ride Simulation"
    },
    ru: {
        header_subtitle: "NS 021 - Отслеживание рейсов и Трансферы",
        install_app: "Скачать App",
        hero_badge_text: "Создано при поддержке City Taxi NS 021",
        hero_title: "Отслеживайте рейс и заказывайте поездку",
        hero_desc: "Это приложение разработано для бесплатной помощи в отслеживании статуса рейсов и задержек самолетов в режиме реального времени. Проект поддерживается ассоциацией City Taxi, чтобы облегчить путешествия всем пассажирам и сделать заказ премиум-трансферов в аэропорт и обратно максимально простым.",
        tracker_title: "Поиск и отслеживание статуса рейса",
        tracker_subtitle: "Поддерживается City Taxi NS 021",
        tracker_placeholder: "ВВЕДИТЕ НОМЕР РЕЙСА (НАПР. JU380, LH1411, AA6)",
        search_btn: "Проверить статус",
        tracker_help: "Проверяйте вылет, прилет, задержки в реальном времени и погоду в пункте отправления и назначения.",
        status_on_time: "Вовремя",
        flight_panel_title: "Детали рейса и прогноз погоды",
        departure_label: "Вылет:",
        arrival_label: "Прилет:",
        forecast_origin_label: "Прогноз в пункте отправления",
        forecast_dest_label: "Прогноз в пункте назначения (Белград)",
        weather_loading: "Загрузка...",
        delay_title: "Рейс задерживается! Выявленная задержка:",
        delay_text: "Уведомление о задержке отправлено диспетчеру для корректировки времени поездки.",
        booking_sec_title: "Забронировать трансфер",
        booking_sec_subtitle: "После проверки рейса забронируйте премиум-трансфер, который будет ждать вас точно вовремя",
        form_title: "Бронирование поездки",
        route_label: "Выберите маршрут",
        route_ns_airport: "Нови-Сад ➔ Аэропорт Никола Тесла (Белград)",
        route_airport_ns: "Аэропорт Никола Тесла (Белград) ➔ Нови-Сад",
        route_ns_bgd: "Нови-Сад ➔ Белград (Центр)",
        route_bgd_ns: "Белград (Центр) ➔ Нови-Сад",
        passenger_name_label: "Имя и фамилия",
        passenger_name_placeholder: "Введите ваше имя и фамилию",
        passenger_phone_label: "Номер телефона",
        passenger_phone_placeholder: "Напр. +381 60 123 4567",
        date_label: "Дата",
        time_label: "Время подачи",
        vehicle_class_label: "Класс автомобиля",
        class_standard: "Стандарт",
        class_business: "Бизнес",
        class_van: "Минивэн",
        linked_flight_label: "Связанный рейс для отслеживания:",
        early_warning_title: "Рекомендация для раннего выезда!",
        early_warning_desc: "Аэропорт требует прибытия за 2 часа до вылета. С учетом времени в пути мы рекомендуем изменить время подачи на более раннее, чтобы прибыть вовремя.",
        price_label: "Фиксированная стоимость:",
        fixed_badge: "Фикс",
        submit_btn: "Забронировать",
        map_title: "Предварительный просмотр маршрута",
        map_badge_demo: "Демо-карта",
        promo_title: "Преимущества City Taxi",
        promo_desc: "Воспользуйтесь дополнительными преимуществами во время пребывания в Нови-Саде:",
        viber_btn_label: "Viber бот",
        viber_btn_sub: "Заказ через Viber",
        app_btn_label: "Мобильное приложение",
        app_btn_sub: "Скачать в Google Play",
        conf_success_title: "Успешное бронирование!",
        conf_order_label: "Номер заказа:",
        conf_success_desc: "Ваш трансфер подтвержден и отправлен в диспетчерский центр City Taxi.",
        conf_route_label: "Маршрут:",
        conf_name_label: "Клиент:",
        conf_phone_label: "Номер телефона:",
        conf_datetime_label: "Дата и время:",
        conf_flight_label: "Отслеживаемый рейс:",
        conf_vehicle_label: "Класс авто:",
        conf_price_label: "Итоговая стоимость:",
        conf_download_title: "Скачайте наше приложение и Viber-бот",
        conf_download_desc: "Для более быстрого и простого заказа такси в Нови-Саде скачайте наше мобильное приложение или воспользуйтесь Viber-ботом. Теперь вы можете свободно закрыть эту вкладку.",
        conf_viber_btn_label: "Viber бот",
        conf_app_btn_label: "Мобильное App",
        conf_close_tab_hint: "После загрузки вы можете свободно закрыть эту вкладку.",
        conf_sim_btn: "Запустить симуляцию"
    }
};

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('selected_lang', lang);

    // Ažuriraj aktivno dugme za jezik
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Ažuriraj obične tekstove na stranici
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Ažuriraj placeholders za inpute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.setAttribute('placeholder', translations[lang][key]);
        }
    });

    // Ažuriraj opcije u select meniju za relacije
    const routeSelect = document.getElementById('routeSelect');
    if (routeSelect) {
        Array.from(routeSelect.options).forEach(opt => {
            const key = opt.getAttribute('data-i18n');
            if (key && translations[lang][key]) {
                opt.text = translations[lang][key];
            }
        });
    }

    // Ažuriraj bedž na mapi
    const mapBadge = document.getElementById("mapModeBadge");
    if (mapBadge) {
        if (mapBadge.textContent.includes("Uživo") || mapBadge.textContent.includes("Live") || mapBadge.textContent.includes("Живая")) {
            mapBadge.textContent = lang === 'sr' ? "Uživo OSM Mapa" : (lang === 'en' ? "Live OSM Map" : "Живая OSM Карта");
        } else if (mapBadge.textContent.includes("Demo")) {
            mapBadge.textContent = translations[lang]["map_badge_demo"];
        }
    }

    // Ažuriraj cene i rute da se iscrtaju sa pravim popup tekstovima
    if (typeof drawLeafletRoute === 'function') {
        const currentRoute = document.getElementById("routeSelect").value;
        drawLeafletRoute(currentRoute);
    }
    
    // Ažuriraj upozorenje o ranijem polasku ako je aktivno
    if (typeof checkEarlyDepartureWarning === 'function') {
        checkEarlyDepartureWarning();
    }
}

// Preset routes coordinates
const NOVI_SAD_COORDS = { lat: 45.2671, lon: 19.8335 };
const BEG_AIRPORT_COORDS = { lat: 44.8184, lon: 20.3091 }; // Nikola Tesla Airport
const BEG_CITY_COORDS = { lat: 44.7872, lon: 20.4573 };   // Belgrade Center

// Detailed airport lookup for origin cities
const airportDatabase = {
    "CDG": { name: "Pariz Charles de Gaulle", city: "Pariz", lat: 49.0097, lon: 2.5479 },
    "JFK": { name: "Njujork John F. Kennedy", city: "Njujork", lat: 40.6413, lon: -73.7781 },
    "LHR": { name: "London Heathrow", city: "London", lat: 51.4700, lon: -0.4543 },
    "FCO": { name: "Rim Fiumicino", city: "Rim", lat: 41.8003, lon: 12.2389 },
    "MUC": { name: "Minhen Franz Josef Strauss", city: "Minhen", lat: 48.3537, lon: 11.7860 },
    "ATH": { name: "Atina Eleftherios Venizelos", city: "Atina", lat: 37.9356, lon: 23.9484 },
    "ZRH": { name: "Cirih", city: "Cirih", lat: 47.4582, lon: 8.5555 },
    "IST": { name: "Istanbul Airport", city: "Istanbul", lat: 41.2752, lon: 28.7519 },
    "VIE": { name: "Beč Schwechat", city: "Beč", lat: 48.1103, lon: 16.5697 },
    "DXB": { name: "Dubai International", city: "Dubai", lat: 25.2532, lon: 55.3657 },
    "FRA": { name: "Frankfurt Airport", city: "Frankfurt", lat: 50.0379, lon: 8.5622 },
    "TGD": { name: "Podgorica Airport", city: "Podgorica", lat: 42.3594, lon: 19.2519 },
    "TIV": { name: "Tivat Airport", city: "Tivat", lat: 42.4047, lon: 18.7233 },
    "SJJ": { name: "Sarajevo Airport", city: "Sarajevo", lat: 43.8247, lon: 18.3314 },
    "SKP": { name: "Skoplje Airport", city: "Skoplje", lat: 41.9614, lon: 21.6214 },
};

// Prevod naziva gradova sa engleskog na srpski
const cityTranslations = {
    "Milan": "Milano",
    "Rome": "Rim",
    "Vienna": "Beč",
    "Munich": "Minhen",
    "Athens": "Atina",
    "Zurich": "Cirih",
    "Paris": "Pariz",
    "London": "London",
    "Istanbul": "Istanbul",
    "Belgrade": "Beograd",
    "Frankfurt": "Frankfurt",
    "Podgorica": "Podgorica",
    "Tivat": "Tivat",
    "Sarajevo": "Sarajevo",
    "Skopje": "Skoplje",
    "Tirana": "Tirana",
    "New York": "Njujork",
    "Barcelona": "Barselona"
};

// Weather mapping from Open-Meteo codes to icons and descriptions
const weatherCodes = {
    0: { desc: "Vedro", icon: "sun" },
    1: { desc: "Uglavnom vedro", icon: "cloud-sun" },
    2: { desc: "Mestimično oblačno", icon: "cloud-sun" },
    3: { desc: "Oblačno", icon: "cloud" },
    45: { desc: "Magla", icon: "cloud" },
    48: { desc: "Inje magla", icon: "cloud" },
    51: { desc: "Slabo rominjanje", icon: "cloud-drizzle" },
    53: { desc: "Umereno rominjanje", icon: "cloud-drizzle" },
    55: { desc: "Jako rominjanje", icon: "cloud-drizzle" },
    61: { desc: "Blaga kiša", icon: "cloud-rain" },
    63: { desc: "Umerena kiša", icon: "cloud-rain" },
    65: { desc: "Jaka kiša", icon: "cloud-rain" },
    71: { desc: "Slab sneg", icon: "cloud-snow" },
    73: { desc: "Umeren sneg", icon: "cloud-snow" },
    75: { desc: "Jak sneg", icon: "cloud-snow" },
    80: { desc: "Slabi pljuskovi", icon: "cloud-rain" },
    81: { desc: "Umereni pljuskovi", icon: "cloud-rain" },
    82: { desc: "Jaki pljuskovi", icon: "cloud-rain" },
    95: { desc: "Grmljavina", icon: "cloud-lightning" },
    96: { desc: "Grmljavina sa gradom", icon: "cloud-lightning" },
    99: { desc: "Jaka grmljavina sa gradom", icon: "cloud-lightning" }
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Set default date to today
    const dateInput = document.getElementById("pickupDate");
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    dateInput.min = `${yyyy}-${mm}-${dd}`;

    // Set default time to 2 hours from now
    const timeInput = document.getElementById("pickupTime");
    const futureHours = new Date(today.getTime() + 2 * 60 * 60 * 1000);
    let hh = futureHours.getHours();
    let min = futureHours.getMinutes();
    if (hh < 10) hh = '0' + hh;
    if (min < 10) min = '0' + min;
    timeInput.value = `${hh}:${min}`;

    // Load API Keys from Local Storage
    loadApiKeys();

    // Auto-load saved passenger details
    const savedName = localStorage.getItem("passenger_name");
    const savedPhone = localStorage.getItem("passenger_phone");
    if (savedName) document.getElementById("passengerName").value = savedName;
    if (savedPhone) document.getElementById("passengerPhone").value = savedPhone;

    // Unregister Service Worker privremeno tokom testiranja radi čišćenja keša
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister().then(success => {
                    if (success) console.log('SW: Uspešno uklonjen stari keširani servis voker');
                });
            }
        });
    }

    // Setup event listeners
    setupEventListeners();

    // Učitaj izabrani jezik
    const savedLang = localStorage.getItem("selected_lang") || "sr";
    setLanguage(savedLang);

    // Inicijalizacija besplatne mape (Leaflet.js)
    initLeafletMap();

    // Initial weather check for Belgrade (destination)
    fetchBelgradeWeather();

    // Render Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
});

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
    const routeSelect = document.getElementById("routeSelect");
    const checkFlightBtn = document.getElementById("checkFlightBtn");
    const bookingForm = document.getElementById("bookingForm");
    const syncTimeBtn = document.getElementById("syncTimeBtn");

    // Modal toggles
    const openSettingsBtn = document.getElementById("openSettingsBtn");
    const closeSettingsBtn = document.getElementById("closeSettingsBtn");
    const saveKeysBtn = document.getElementById("saveKeysBtn");
    const clearKeysBtn = document.getElementById("clearKeysBtn");
    const closeConfirmBtn = document.getElementById("closeConfirmBtn");
    const startTripBtn = document.getElementById("startTripSimulationBtn");

    // Language Switcher Buttons Click
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    // Route Select Change
    routeSelect.addEventListener("change", (e) => {
        handleRouteSelection(e.target.value);
        checkEarlyDepartureWarning();
    });

    // Time Input Change
    document.getElementById("pickupTime").addEventListener("input", checkEarlyDepartureWarning);

    // Flight code check
    checkFlightBtn.addEventListener("click", () => {
        const flightCodeInput = document.getElementById("flightCode").value.trim().toUpperCase();
        if (flightCodeInput) {
            checkFlightAndWeather(flightCodeInput);
        } else {
            let errorMsg = "Molimo unesite broj leta.";
            if (currentLang === 'en') errorMsg = "Please enter a flight number.";
            if (currentLang === 'ru') errorMsg = "Пожалуйста, введите номер рейса.";
            alert(errorMsg);
        }
    });

    // PWA Install Prompt Click
    const installAppBtn = document.getElementById("installAppBtn");
    if (installAppBtn) {
        installAppBtn.addEventListener('click', () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Korisnik je prihvatio instalaciju aplikacije');
                } else {
                    console.log('Korisnik je odbio instalaciju aplikacije');
                }
                deferredPrompt = null;
                installAppBtn.classList.add("hidden");
            });
        });
    }

    // Submit Booking
    bookingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        showBookingConfirmation();
    });

    // Open/Close Settings
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener("click", () => {
            document.getElementById("settingsModal").classList.remove("hidden");
        });
    }
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener("click", () => {
            document.getElementById("settingsModal").classList.add("hidden");
        });
    }

    // Save Settings
    saveKeysBtn.addEventListener("click", () => {
        const airlabsKey = document.getElementById("airLabsKeyInput").value.trim();
        const rapidApiKey = document.getElementById("rapidApiKeyInput").value.trim();
        
        localStorage.setItem("airlabs_key", airlabsKey);
        localStorage.setItem("rapid_api_key", rapidApiKey);
        
        alert("Podešavanja su uspešno sačuvana. Stranica će se osvežiti radi primene.");
        location.reload();
    });

    // Clear Settings
    clearKeysBtn.addEventListener("click", () => {
        if (confirm("Da li želite da obrišete sve sačuvane API ključeve?")) {
            localStorage.removeItem("airlabs_key");
            localStorage.removeItem("rapid_api_key");
            document.getElementById("airLabsKeyInput").value = "";
            document.getElementById("rapidApiKeyInput").value = "";
            alert("Ključevi su obrisani. Stranica će se osvežiti.");
            location.reload();
        }
    });

    // Close Confirmation Modal
    closeConfirmBtn.addEventListener("click", () => {
        document.getElementById("confirmationModal").classList.add("hidden");
    });

    // Start Taxi Simulation along route
    startTripBtn.addEventListener("click", () => {
        document.getElementById("confirmationModal").classList.add("hidden");
        startTripSimulation();
    });

    // Vehicle Selection click handler (to update styling)
    const vehicleLabels = document.querySelectorAll(".vehicle-card");
    vehicleLabels.forEach(label => {
        label.addEventListener("click", () => {
            vehicleLabels.forEach(l => l.classList.remove("active"));
            label.classList.add("active");
            calculatePrice();
        });
    });
}

// ==========================================================================
// Route Management and Pricing
// ==========================================================================
function handleRouteSelection(routeType) {
    isReversePath = (routeType === "airport-ns" || routeType === "bgd-ns");
    calculatePrice();
    drawLeafletRoute(routeType);
}

function calculatePrice(distanceKm = null) {
    const routeType = document.getElementById("routeSelect").value;
    const vehicleClass = document.querySelector('input[name="vehicleClass"]:checked').value;
    const priceValue = document.getElementById("priceValue");
    
    // Multipliers based on vehicle class
    let multiplier = 1.0;
    if (vehicleClass === "business") multiplier = 1.5;
    if (vehicleClass === "van") multiplier = 1.8;

    let basePriceRsd = 0;

    if (routeType === "ns-airport" || routeType === "airport-ns") {
        basePriceRsd = 9000; // Novi Sad <-> Aerodrom = 9000 RSD
    } else if (routeType === "ns-bgd" || routeType === "bgd-ns") {
        basePriceRsd = 10000; // Novi Sad <-> Beograd = 10000 RSD
    } else {
        if (distanceKm) {
            basePriceRsd = 300 + (distanceKm * 100);
        } else {
            priceValue.innerHTML = `<span class="currency">Zavisi od rute</span>`;
            return;
        }
    }

    const finalPrice = Math.round(basePriceRsd * multiplier);
    priceValue.innerHTML = `${finalPrice.toLocaleString('sr-RS')} <span class="currency">RSD</span>`;
}

// ==========================================================================
// API Key Management & Loaders
// ==========================================================================
function loadApiKeys() {
    const airlabsKey = localStorage.getItem("airlabs_key");
    const rapidApiKey = localStorage.getItem("rapid_api_key");

    if (airlabsKey) {
        document.getElementById("airLabsKeyInput").value = airlabsKey;
    }
    if (rapidApiKey) {
        document.getElementById("rapidApiKeyInput").value = rapidApiKey;
    }
}

// Inicijalizacija besplatne Leaflet mape sa CartoDB Dark Matter stilom
let leafletMap = null;
let routePolyline = null;
let pickupMarker = null;
let dropoffMarker = null;

function initLeafletMap() {
    // Središnja tačka između Novog Sada i Beograda
    const midpoint = [45.0278, 20.1408];
    
    // Inicijalizacija mape
    leafletMap = L.map('leafletMap', {
        zoomControl: true,
        attributionControl: false
    }).setView(midpoint, 9);

    // CartoDB Dark Matter tile layer (gorgeous tamni premium dizajn)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(leafletMap);

    document.getElementById("mapModeBadge").textContent = "Uživo OSM Mapa";
    document.getElementById("mockMap").classList.add("hidden");

    // Iscrtaj početnu selektovanu rutu
    const routeType = document.getElementById("routeSelect").value;
    drawLeafletRoute(routeType);
}

// Iscrtava rutu na mapi i dobija tačnu dužinu i vreme preko OSRM API-ja
function drawLeafletRoute(routeType) {
    if (!leafletMap) return;

    let origin, dest;

    if (routeType === "ns-airport") {
        origin = NOVI_SAD_COORDS;
        dest = BEG_AIRPORT_COORDS;
    } else if (routeType === "airport-ns") {
        origin = BEG_AIRPORT_COORDS;
        dest = NOVI_SAD_COORDS;
    } else if (routeType === "ns-bgd") {
        origin = NOVI_SAD_COORDS;
        dest = BEG_CITY_COORDS;
    } else if (routeType === "bgd-ns") {
        origin = BEG_CITY_COORDS;
        dest = NOVI_SAD_COORDS;
    }

    // OSRM free routing API poziv
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=full&geometries=geojson`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.code === "Ok" && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const latLngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

                // Očisti stare slojeve
                if (routePolyline) leafletMap.removeLayer(routePolyline);
                if (pickupMarker) leafletMap.removeLayer(pickupMarker);
                if (dropoffMarker) leafletMap.removeLayer(dropoffMarker);

                // Iscrtaj zlatnu liniju City Taxi dizajna
                routePolyline = L.polyline(latLngs, {
                    color: '#ffb700',
                    weight: 5,
                    opacity: 0.85
                }).addTo(leafletMap);

                // Kreiraj start/end markere sa prevodom u zavisnosti od jezika
                let pickupPopup = "";
                let dropoffPopup = "";
                let pathDurationPrefix = "";
                
                if (currentLang === 'en') {
                    pickupPopup = routeType.startsWith("ns") ? "Novi Sad (Departure)" : "Belgrade Airport";
                    dropoffPopup = routeType.startsWith("ns") ? "Belgrade Airport" : "Novi Sad (Arrival)";
                    pathDurationPrefix = "Travel time:";
                } else if (currentLang === 'ru') {
                    pickupPopup = routeType.startsWith("ns") ? "Нови-Сад (Отправление)" : "Аэропорт Белграда";
                    dropoffPopup = routeType.startsWith("ns") ? "Аэропорт Белграда" : "Нови-Сад (Прибытие)";
                    pathDurationPrefix = "Время пути:";
                } else {
                    pickupPopup = routeType.startsWith("ns") ? "Novi Sad (Polazak)" : "Aerodrom Beograd";
                    dropoffPopup = routeType.startsWith("ns") ? "Aerodrom Beograd" : "Novi Sad (Dolazak)";
                    pathDurationPrefix = "Vreme puta:";
                }

                pickupMarker = L.marker([origin.lat, origin.lon]).addTo(leafletMap)
                    .bindPopup(pickupPopup);
                
                dropoffMarker = L.marker([dest.lat, dest.lon]).addTo(leafletMap)
                    .bindPopup(dropoffPopup);

                // Fokusiraj mapu na celu rutu
                leafletMap.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });

                // Ažuriraj trajanje putovanja u bedžu
                const durationMinutes = Math.round(route.duration / 60);
                const hours = Math.floor(durationMinutes / 60);
                const minutes = durationMinutes % 60;
                
                let durationText = "";
                if (currentLang === 'en') {
                    durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
                } else if (currentLang === 'ru') {
                    durationText = hours > 0 ? `${hours}ч ${minutes}мин` : `${minutes}мин`;
                } else {
                    durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
                }

                const durationBadge = document.getElementById("routeDurationBadge");
                durationBadge.textContent = `${pathDurationPrefix} ~${durationText}`;
                durationBadge.classList.remove("hidden");
            }
        })
        .catch(err => {
            console.error("Greška pri učitavanju rute sa OSRM:", err);
        });
}

// ==========================================================================
// Weather and Flight Details Fetching (API and Demo Mod)
// ==========================================================================
function checkFlightAndWeather(flightCode) {
    const airlabsKey = localStorage.getItem("airlabs_key");
    const rapidApiKey = localStorage.getItem("rapid_api_key");
    const checkFlightBtn = document.getElementById("checkFlightBtn");
    
    // Očisti broj leta od razmaka
    const cleanFlightCode = flightCode.replace(/\s+/g, '').toUpperCase();
    
    checkFlightBtn.innerHTML = `<span>Provera...</span><i class="btn-icon spinner animate-spin"></i>`;
    checkFlightBtn.disabled = true;

    // Formatiranje datuma leta
    let flightDate = document.getElementById("pickupDate").value;
    if (!flightDate) {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();
        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;
        flightDate = `${yyyy}-${mm}-${dd}`;
    }
    
    // Slanje zahteva na naš lokalni backend proxy da se zaobiđe CORS
    fetch('/api/check-flight', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            flightCode: cleanFlightCode,
            flightDate: flightDate,
            rapidApiKey: rapidApiKey,
            airlabsKey: airlabsKey
        })
    })
    .then(res => {
        if (!res.ok) {
            // Ako server vrati 400 no_keys, prelazimo u Demo mod
            if (res.status === 400) {
                return res.json().then(errData => {
                    if (errData.error === 'no_keys') {
                        activateDemoFlightMode(cleanFlightCode);
                        return null; // označava da je pokrenut demo mod
                    }
                    throw new Error(errData.message || `HTTP greška! Status: ${res.status}`);
                });
            }
            throw new Error(`HTTP greška! Status: ${res.status}`);
        }
        return res.json();
    })
    .then(resData => {
        if (!resData) return; // demo mod je već odradio svoje

        const provider = resData.provider;
        const data = resData.data;

        if (provider === 'aerodatabox') {
            if (Array.isArray(data) && data.length > 0) {
                if (resData.date) {
                    document.getElementById("pickupDate").value = resData.date;
                }
                processAeroDataBoxFlightData(data[0], cleanFlightCode);
            } else {
                let errorMsg = `Let sa brojem "${flightCode}" nije pronađen za izabrani datum. Proverite broj leta ili promenite datum.`;
                if (currentLang === 'en') errorMsg = `Flight "${flightCode}" was not found for the selected date. Please check the flight number or change the date.`;
                if (currentLang === 'ru') errorMsg = `Рейс "${flightCode}" не найден на выбранную дату. Пожалуйста, проверьте номер рейса или измените дату.`;
                alert(errorMsg);
                hideFlightWeatherUI();
            }
        } else if (provider === 'airlabs') {
            if (data && data.response && !data.error) {
                processLiveFlightData(data.response);
            } else {
                let errorMsg = `Let sa brojem "${flightCode}" trenutno nije pronađen na nebu. Proverite unos.`;
                if (currentLang === 'en') errorMsg = `Flight "${flightCode}" was not found in the sky. Please check the flight number.`;
                if (currentLang === 'ru') errorMsg = `Рейс "${flightCode}" не найден в небе в данный момент. Пожалуйста, проверьте номер рейса.`;
                alert(errorMsg);
                hideFlightWeatherUI();
            }
        }
    })
    .catch(err => {
        console.error("Greška na proxy serveru za letove:", err);
        let errorMsg = "Došlo je do greške prilikom povezivanja sa serverom za praćenje leta.";
        if (currentLang === 'en') errorMsg = "An error occurred while connecting to the flight tracking server.";
        if (currentLang === 'ru') errorMsg = "Произошла ошибка при подключении к серверу отслеживания рейсов.";
        alert(errorMsg);
        hideFlightWeatherUI();
    })
    .finally(() => {
        resetCheckFlightButton();
    });
}

function hideFlightWeatherUI() {
    activeFlightData = null;
    document.getElementById("flightWeatherPanel").classList.add("hidden");
    document.getElementById("formFlightInfoBox").classList.add("hidden");
    checkEarlyDepartureWarning(); // reset warning alert box
}

function resetCheckFlightButton() {
    const checkFlightBtn = document.getElementById("checkFlightBtn");
    checkFlightBtn.innerHTML = `<span>Proveri status leta</span><i data-lucide="search" class="btn-icon"></i>`;
    checkFlightBtn.disabled = false;
    if (window.lucide) lucide.createIcons();
}

// Process Live AirLabs flight response
function processLiveFlightData(flight) {
    const originIata = flight.dep_iata;
    const originAirport = airportDatabase[originIata] || { name: `Aerodrom ${originIata}`, city: originIata, lat: 45.0, lon: 15.0 };
    
    const destIata = flight.arr_iata || "BEG";
    const destAirport = (destIata === "BEG") 
        ? { name: "Beograd Nikola Tesla", city: "Beograd", lat: 44.8184, lon: 20.3091 }
        : (airportDatabase[destIata] || { name: `Aerodrom ${destIata}`, city: destIata, lat: 44.8184, lon: 20.3091 });
    
    const status = flight.status === "en-route" ? "Poleteo" : (flight.status === "landed" ? "Sleteo" : "Na vreme");
    const delay = flight.arr_delay || flight.delay || 0; // Delay in minutes
    
    const suggestedNewTime = calculateDelayedPickupTime(delay);
    const depTime = formatTime(flight.dep_time) || "--:--";

    activeFlightData = {
        flightCode: flight.flight_iata || flight.flight_icao,
        originCity: originAirport.city,
        originCode: originIata,
        destCity: destAirport.city,
        destCode: destIata,
        status: status,
        delay: delay,
        depTime: depTime,
        arrTime: formatTime(flight.arr_time) || "--:--",
        newSuggestedTime: suggestedNewTime
    };

    // Automatski podesi datum i vreme preuzimanja u formi na osnovu leta
    let depDate = new Date().toISOString().split("T")[0];
    if (flight.dep_time && flight.dep_time.includes(" ")) {
        depDate = flight.dep_time.split(" ")[0];
    }
    const recommended = calculateRecommendedPickupTime(depDate, depTime);
    if (recommended) {
        document.getElementById("pickupDate").value = recommended.date;
        document.getElementById("pickupTime").value = recommended.time;
        calculatePrice();
    }

    updateFlightWeatherUI(activeFlightData, originAirport.lat, originAirport.lon, destAirport.lat, destAirport.lon);
}

// Process AeroDataBox flight response
function processAeroDataBoxFlightData(flight, flightCode) {
    const originIata = flight.departure && flight.departure.airport ? flight.departure.airport.iata : "CDG";
    
    // AeroDataBox returns municipalityName (e.g. "Munich" or "Paris")
    let originCity = originIata;
    if (flight.departure && flight.departure.airport) {
        const rawCity = flight.departure.airport.municipalityName || flight.departure.airport.name.split(" ")[0];
        originCity = cityTranslations[rawCity] || rawCity;
    }
    
    const originAirport = airportDatabase[originIata] || { 
        name: flight.departure && flight.departure.airport ? flight.departure.airport.name : `Aerodrom ${originIata}`, 
        city: originCity, 
        lat: 45.0, 
        lon: 15.0 
    };

    // Extract destination details
    const destIata = flight.arrival && flight.arrival.airport ? flight.arrival.airport.iata : "BEG";
    let destCity = "Beograd";
    let destLat = 44.8184;
    let destLon = 20.3091;
    if (flight.arrival && flight.arrival.airport) {
        const rawCity = flight.arrival.airport.municipalityName || flight.arrival.airport.name.split(" ")[0];
        destCity = cityTranslations[rawCity] || rawCity;
        if (flight.arrival.airport.location) {
            destLat = flight.arrival.airport.location.lat;
            destLon = flight.arrival.airport.location.lon;
        }
    }

    // AeroDataBox times are nested under scheduledTime.local (e.g., "2026-07-12 13:40+02:00")
    let depTimeRaw = flight.departure && flight.departure.scheduledTime && flight.departure.scheduledTime.local ? flight.departure.scheduledTime.local : "";
    let arrTimeRaw = flight.arrival && flight.arrival.scheduledTime && flight.arrival.scheduledTime.local ? flight.arrival.scheduledTime.local : "";
    
    // Extract HH:MM
    let depTime = "--:--";
    let arrTime = "--:--";
    if (depTimeRaw.includes(" ")) depTime = depTimeRaw.split(" ")[1].substring(0, 5);
    if (arrTimeRaw.includes(" ")) arrTime = arrTimeRaw.split(" ")[1].substring(0, 5);

    // Calculate delay by comparing scheduled and predicted/actual arrival time
    let scheduledTimeStr = (flight.arrival && flight.arrival.scheduledTime && flight.arrival.scheduledTime.local) ? flight.arrival.scheduledTime.local : "";
    
    let actualTimeStr = "";
    if (flight.arrival) {
        if (flight.arrival.predictedTime && flight.arrival.predictedTime.local) {
            actualTimeStr = flight.arrival.predictedTime.local;
        } else if (flight.arrival.actualTime && flight.arrival.actualTime.local) {
            actualTimeStr = flight.arrival.actualTime.local;
        } else if (flight.arrival.revisedTime && flight.arrival.revisedTime.local) {
            actualTimeStr = flight.arrival.revisedTime.local;
        }
    }

    let delay = 0;
    if (scheduledTimeStr && actualTimeStr) {
        const scheduled = new Date(scheduledTimeStr.replace(" ", "T"));
        const actual = new Date(actualTimeStr.replace(" ", "T"));
        const diffMs = actual - scheduled;
        if (diffMs > 0) {
            delay = Math.round(diffMs / 60000);
        }
    } else if (flight.status === "Delayed") {
        delay = 45; // average fallback delay
    }

    const status = flight.status === "Arrived" ? "Sleteo" : (flight.status === "Departed" ? "Poleteo" : (delay > 0 ? "Kasni" : "Na vreme"));
    const suggestedNewTime = calculateDelayedPickupTime(delay);

    activeFlightData = {
        flightCode: flightCode,
        originCity: originAirport.city,
        originCode: originIata,
        destCity: destCity,
        destCode: destIata,
        status: status,
        delay: delay,
        depTime: depTime,
        arrTime: arrTime,
        newSuggestedTime: suggestedNewTime
    };

    // Automatski podesi datum i vreme preuzimanja u formi na osnovu leta
    let depDate = "";
    if (depTimeRaw && depTimeRaw.includes(" ")) {
        depDate = depTimeRaw.split(" ")[0];
    } else {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();
        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;
        depDate = `${yyyy}-${mm}-${dd}`;
    }
    const recommended = calculateRecommendedPickupTime(depDate, depTime);
    if (recommended) {
        document.getElementById("pickupDate").value = recommended.date;
        document.getElementById("pickupTime").value = recommended.time;
        calculatePrice();
    }

    updateFlightWeatherUI(activeFlightData, originAirport.lat, originAirport.lon, destLat, destLon);
}

// Generate realistic data for flight if in Demo Mode
function activateDemoFlightMode(flightCode) {
    // Standard mock database flights
    let mockFlight = null;
    const cleanCode = flightCode.replace(/\s+/g, '').toUpperCase();

    if (cleanCode.startsWith("JU380") || cleanCode.includes("380")) {
        mockFlight = {
            flightCode: "JU 380",
            originCode: "CDG",
            originCity: "Pariz",
            destCode: "BEG",
            destCity: "Beograd",
            status: "Kasni",
            delay: 50,
            depTime: "14:15",
            arrTime: "16:35"
        };
    } else if (cleanCode.startsWith("LH1411") || cleanCode.includes("1411")) {
        mockFlight = {
            flightCode: "LH 1411",
            originCode: "MUC",
            originCity: "Minhen",
            destCode: "BEG",
            destCity: "Beograd",
            status: "Kasni",
            delay: 20,
            depTime: "10:30",
            arrTime: "11:55"
        };
    } else if (cleanCode.startsWith("AA6") || cleanCode.includes("AA6")) {
        mockFlight = {
            flightCode: "AA 6",
            originCode: "JFK",
            originCity: "Njujork",
            destCode: "BEG",
            destCity: "Beograd",
            status: "Kasni",
            delay: 120,
            depTime: "19:00",
            arrTime: "08:30"
        };
    } else if (cleanCode.startsWith("JU501") || cleanCode.includes("501")) {
        mockFlight = {
            flightCode: "JU 501",
            originCode: "FCO",
            originCity: "Rim",
            destCode: "BEG",
            destCity: "Beograd",
            status: "Na vreme",
            delay: 0,
            depTime: "09:50",
            arrTime: "11:30"
        };
    } else {
        // Generate dynamic random flight from keys in database
        const airportKeys = Object.keys(airportDatabase);
        const randomAirportKey = airportKeys[Math.floor(Math.random() * airportKeys.length)];
        const airport = airportDatabase[randomAirportKey];
        
        // Random delay (0, 15, 30, 45, 60 mins)
        const delays = [0, 0, 15, 35, 45, 80];
        const randomDelay = delays[Math.floor(Math.random() * delays.length)];
        const isDelayed = randomDelay > 0;

        mockFlight = {
            flightCode: flightCode,
            originCode: randomAirportKey,
            originCity: airport.city,
            destCode: "BEG",
            destCity: "Beograd",
            status: isDelayed ? "Kasni" : "Na vreme",
            delay: randomDelay,
            depTime: "12:30",
            arrTime: "14:45"
        };
    }

    mockFlight.newSuggestedTime = calculateDelayedPickupTime(mockFlight.delay);
    activeFlightData = mockFlight;

    // Automatski podesi datum i vreme preuzimanja za simulaciju
    const currentFormDate = document.getElementById("pickupDate").value || new Date().toISOString().split("T")[0];
    const recommended = calculateRecommendedPickupTime(currentFormDate, mockFlight.depTime);
    if (recommended) {
        document.getElementById("pickupDate").value = recommended.date;
        document.getElementById("pickupTime").value = recommended.time;
        calculatePrice();
    }

    const originInfo = airportDatabase[mockFlight.originCode];
    updateFlightWeatherUI(mockFlight, originInfo.lat, originInfo.lon, 44.8184, 20.3091);
}

// Fetch weather from Open-Meteo for origin coordinate & Destination coordinate
function updateFlightWeatherUI(flightData, originLat, originLon, destLat = null, destLon = null) {
    const panel = document.getElementById("flightWeatherPanel");
    panel.classList.remove("hidden");

    // Prikaži obaveštenje o povezanom letu unutar forme za rezervaciju
    const formFlightBox = document.getElementById("formFlightInfoBox");
    const formFlightText = document.getElementById("formFlightCodeText");
    if (formFlightBox && formFlightText) {
        formFlightText.textContent = flightData.flightCode;
        formFlightBox.classList.remove("hidden");
    }

    // Update flight panel text
    document.getElementById("flightDepCode").textContent = flightData.originCode;
    document.getElementById("flightDepCity").textContent = flightData.originCity;
    document.getElementById("flightArrCode").textContent = flightData.destCode || "BEG";
    document.getElementById("flightArrCity").textContent = flightData.destCity || "Beograd";
    document.getElementById("flightDepTime").textContent = flightData.depTime;
    document.getElementById("flightArrTime").textContent = flightData.arrTime;
    
    // Update city names in weather labels dynamically
    document.getElementById("originCityName").textContent = flightData.originCity;
    
    const destCity = flightData.destCity || "Beograd";
    let destCityLocative = destCity;
    if (destCity === "Beograd") destCityLocative = "Beogradu";
    else if (destCity === "Pariz") destCityLocative = "Parizu";
    else if (destCity === "London") destCityLocative = "Londonu";
    else if (destCity === "Rim") destCityLocative = "Rimu";
    else if (destCity === "Minhen") destCityLocative = "Minhenu";
    else if (destCity === "Atina") destCityLocative = "Atini";
    else if (destCity === "Cirih") destCityLocative = "Cirihu";
    else if (destCity === "Istanbul") destCityLocative = "Istanbulu";
    else if (destCity === "Beč") destCityLocative = "Beču";
    else if (destCity === "Dubai") destCityLocative = "Dubaiju";
    else if (destCity === "Frankfurt" || destCity.includes("Frankfurt")) destCityLocative = "Frankfurtu";
    else if (destCity === "Podgorica") destCityLocative = "Podgorici";
    else if (destCity === "Tivat") destCityLocative = "Tivtu";
    else if (destCity === "Sarajevo") destCityLocative = "Sarajevu";
    else if (destCity === "Skoplje" || destCity === "Skopje") destCityLocative = "Skoplju";
    else if (destCity === "Tirana") destCityLocative = "Tirani";
    else if (destCity === "Milano" || destCity === "Milan") destCityLocative = "Milanu";
    else if (destCity === "Barselona") destCityLocative = "Barseloni";
    
    document.getElementById("begWeatherLabel").innerHTML = `Prognoza u ${destCityLocative} (Destinacija)`;

    // Fetch Weather for Origin
    fetchWeather(originLat, originLon, "origin");
    
    // Fetch Weather for Destination
    const finalDestLat = destLat !== null ? destLat : 44.8184;
    const finalDestLon = destLon !== null ? destLon : 20.3091;
    fetchWeather(finalDestLat, finalDestLon, "beg");

    // Flight Status Badge setup
    const badge = document.getElementById("flightStatusBadge");
    badge.className = "flight-badge"; // reset classes
    if (flightData.delay > 0) {
        badge.textContent = `Kasni +${flightData.delay} min`;
        badge.classList.add("delayed");
    } else {
        badge.textContent = flightData.status || "Na vreme";
        badge.classList.add("ontime");
    }

    // Delay warning sync block
    const delayBox = document.getElementById("delayNoticeBox");
    if (flightData.delay > 0) {
        delayBox.classList.remove("hidden");
        document.getElementById("delayMinutes").textContent = flightData.delay;
        const suggestedTimeEl = document.getElementById("newSuggestedTime");
        if (suggestedTimeEl) {
            suggestedTimeEl.textContent = flightData.newSuggestedTime;
        }
    } else {
        delayBox.classList.add("hidden");
    }

    // Check if the departure flight check-in is sufficient
    setTimeout(checkEarlyDepartureWarning, 500);
}

function fetchWeather(lat, lon, target) {
    const tempElement = document.getElementById(`${target}Temp`);
    const descElement = document.getElementById(`${target}WeatherDesc`);
    const iconContainer = document.getElementById(`${target}WeatherIcon`);

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(res => res.json())
        .then(data => {
            if (data.current_weather) {
                const temp = Math.round(data.current_weather.temperature);
                const code = data.current_weather.weathercode;
                const weatherInfo = weatherCodes[code] || { desc: "Promenljivo", icon: "cloud-sun" };

                tempElement.textContent = `${temp}°C`;
                descElement.textContent = weatherInfo.desc;

                // Update Icon
                iconContainer.innerHTML = `<i data-lucide="${weatherInfo.icon}" class="weather-icon ${weatherInfo.icon === 'sun' ? 'text-yellow' : ''}"></i>`;
                if (window.lucide) lucide.createIcons();
            }
        })
        .catch(err => {
            console.error("Greška pri dobavljanju vremena:", err);
            tempElement.textContent = "18°C";
            descElement.textContent = "Umereno oblačno";
        });
}

function fetchBelgradeWeather() {
    // Belgrade coordinates: lat 44.7872, lon 20.4573
    fetchWeather(44.7872, 20.4573, "beg");
}

// Calculate the new suggested pick-up time by adding delay in minutes
function calculateDelayedPickupTime(delayMinutes) {
    const pickupTimeStr = document.getElementById("pickupTime").value;
    if (!pickupTimeStr) return "--:--";

    const [hours, minutes] = pickupTimeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + delayMinutes);

    let newH = date.getHours();
    let newM = date.getMinutes();

    if (newH < 10) newH = '0' + newH;
    if (newM < 10) newM = '0' + newM;

    return `${newH}:${newM}`;
}

// Računa preporučeno vreme polaska taksija iz Novog Sada na osnovu leta
// (3 sata pre poletanja: 1h putovanja + 2h preporučeni dolazak pre poletanja)
function calculateRecommendedPickupTime(depDateStr, depTimeStr) {
    if (!depDateStr || !depTimeStr || depTimeStr === "--:--") return null;

    try {
        // depDateStr: YYYY-MM-DD, depTimeStr: HH:MM
        const flightDateTime = new Date(`${depDateStr}T${depTimeStr}:00`);
        if (isNaN(flightDateTime.getTime())) return null;

        // Oduzmi tačno 3 sata (180 minuta)
        const pickupDateTime = new Date(flightDateTime.getTime() - 3 * 60 * 60 * 1000);

        const pYear = pickupDateTime.getFullYear();
        let pMonth = pickupDateTime.getMonth() + 1;
        let pDateNum = pickupDateTime.getDate();
        if (pMonth < 10) pMonth = '0' + pMonth;
        if (pDateNum < 10) pDateNum = '0' + pDateNum;
        const formattedPickupDate = `${pYear}-${pMonth}-${pDateNum}`;

        let pHours = pickupDateTime.getHours();
        let pMinutes = pickupDateTime.getMinutes();
        if (pHours < 10) pHours = '0' + pHours;
        if (pMinutes < 10) pMinutes = '0' + pMinutes;
        const formattedPickupTime = `${pHours}:${pMinutes}`;

        return {
            date: formattedPickupDate,
            time: formattedPickupTime
        };
    } catch (e) {
        console.error("Greška pri računanju preporučenog vremena:", e);
        return null;
    }
}

// Sync pickup time field with delay
function syncPickupTimeToDelay(delayMinutes) {
    const timeInput = document.getElementById("pickupTime");
    const suggestedTime = calculateDelayedPickupTime(delayMinutes);
    if (suggestedTime !== "--:--") {
        timeInput.value = suggestedTime;
        alert(`Vreme preuzimanja taksija je pomereno na ${suggestedTime} zbog kašnjenja leta.`);
        
        // Hide notice box after sync
        document.getElementById("delayNoticeBox").classList.add("hidden");

        // Re-check early departure warning
        checkEarlyDepartureWarning();
    }
}

// Helper to format ISO time to HH:MM
function formatTime(isoString) {
    if (!isoString) return "";
    try {
        const d = new Date(isoString);
        let h = d.getHours();
        let m = d.getMinutes();
        if (h < 10) h = '0' + h;
        if (m < 10) m = '0' + m;
        return `${h}:${m}`;
    } catch (e) {
        return "";
    }
}

// ==========================================================================
// Booking Submission and Simulations
// ==========================================================================
function showBookingConfirmation() {
    const routeSelect = document.getElementById("routeSelect");
    const pickupDate = document.getElementById("pickupDate").value;
    const pickupTime = document.getElementById("pickupTime").value;
    const vehicleClass = document.querySelector('input[name="vehicleClass"]:checked').value;
    const priceText = document.getElementById("priceValue").textContent;
    const flightInput = document.getElementById("flightCode").value.trim().toUpperCase();
    const passengerName = document.getElementById("passengerName").value.trim();
    const passengerPhone = document.getElementById("passengerPhone").value.trim();

    // Save passenger details in localStorage
    localStorage.setItem("passenger_name", passengerName);
    localStorage.setItem("passenger_phone", passengerPhone);

    // Map route type to string based on selected language
    let routeStr = "";
    if (routeSelect.value === "ns-airport") {
        routeStr = translations[currentLang]["route_ns_airport"];
    } else if (routeSelect.value === "airport-ns") {
        routeStr = translations[currentLang]["route_airport_ns"];
    } else if (routeSelect.value === "ns-bgd") {
        routeStr = translations[currentLang]["route_ns_bgd"];
    } else if (routeSelect.value === "bgd-ns") {
        routeStr = translations[currentLang]["route_bgd_ns"];
    }

    // Vehicle name mapping based on language
    let vehicleStr = "Standard (Škoda Superb)";
    if (vehicleClass === "standard") vehicleStr = currentLang === 'sr' ? "Standard (Škoda Superb)" : (currentLang === 'en' ? "Standard (Skoda Superb)" : "Стандарт (Шкода Суперб)");
    if (vehicleClass === "business") vehicleStr = currentLang === 'sr' ? "Business (Mercedes E-Class)" : (currentLang === 'en' ? "Business (Mercedes E-Class)" : "Бизнес (Мерседес Е-класс)");
    if (vehicleClass === "van") vehicleStr = currentLang === 'sr' ? "Van (Mercedes V-Class)" : (currentLang === 'en' ? "Van (Mercedes V-Class)" : "Минивэн (Мерседес V-класс)");

    // Date and time layout based on language
    let dateTimeText = "";
    if (currentLang === 'sr') {
        dateTimeText = `${formatDisplayDate(pickupDate)} u ${pickupTime}`;
    } else if (currentLang === 'en') {
        dateTimeText = `${formatDisplayDate(pickupDate)} at ${pickupTime}`;
    } else if (currentLang === 'ru') {
        dateTimeText = `${formatDisplayDate(pickupDate)} в ${pickupTime}`;
    }

    // Update Confirmation Dialog details
    document.getElementById("confRoute").textContent = routeStr;
    document.getElementById("confName").textContent = passengerName;
    document.getElementById("confPhone").textContent = passengerPhone;
    document.getElementById("confDateTime").textContent = dateTimeText;
    document.getElementById("confVehicle").textContent = vehicleStr;
    document.getElementById("confPrice").textContent = priceText;

    const confFlightRow = document.getElementById("confFlightRow");
    if (flightInput) {
        document.getElementById("confFlightCode").textContent = flightInput;
        confFlightRow.classList.remove("hidden");
    } else {
        confFlightRow.classList.add("hidden");
    }

    // Send booking to backend server (runs in background)
    const bookingPayload = {
        name: passengerName,
        phone: passengerPhone,
        route: routeStr,
        price: priceText,
        dateTime: dateTimeText,
        vehicleClass: vehicleClass,
        flightCode: flightInput || null,
        delay: activeFlightData ? activeFlightData.delay : 0,
        newSuggestedTime: activeFlightData ? activeFlightData.newSuggestedTime : null,
        lang: currentLang // Send selected language to dispatcher
    };

    // Default fallback order ID
    const fallbackOrderId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById("confOrderId").textContent = `#${fallbackOrderId} (Demo)`;

    fetch('/api/booking', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingPayload)
    })
    .then(res => res.json())
    .then(data => {
        console.log('Backend odgovor:', data);
        if (data.success && data.bookingId) {
            document.getElementById("confOrderId").textContent = `#${data.bookingId}`;
        }
    })
    .catch(err => {
        console.warn('Backend server nije aktivan. Rezervacija je procesirana lokalno (Demo režim).');
    });

    // Show modal
    document.getElementById("confirmationModal").classList.remove("hidden");
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}.`;
    }
    return dateStr;
}

// Taxi Trip Simulation along the SVG route
let simulationMarker = null;

// Simulacija kretanja taksija na mapi duž OSRM koordinata rute
function startTripSimulation() {
    if (!leafletMap || !routePolyline) return;

    const latLngs = routePolyline.getLatLngs();
    if (latLngs.length === 0) return;

    // Kreiraj ikonicu za taksi koristeći DivIcon sa emoji simbolom
    const taxiIcon = L.divIcon({
        html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); transform: rotate(45deg); cursor: pointer;">🚕</div>',
        className: 'custom-taxi-sim-icon',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
    });

    if (simulationMarker) leafletMap.removeLayer(simulationMarker);

    // Početna tačka u zavisnosti od pravca
    const startIdx = isReversePath ? latLngs.length - 1 : 0;
    simulationMarker = L.marker(latLngs[startIdx], { icon: taxiIcon }).addTo(leafletMap);

    const duration = 5000; // Trajanje simulacije: 5 sekundi
    const startTime = performance.now();

    function animate(time) {
        let elapsed = time - startTime;
        let t = Math.min(elapsed / duration, 1);

        // Ease in-out cubic efekat
        let easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        let index = Math.floor(easeT * (latLngs.length - 1));
        if (isReversePath) {
            index = latLngs.length - 1 - index;
        }

        if (latLngs[index]) {
            simulationMarker.setLatLng(latLngs[index]);
            leafletMap.panTo(latLngs[index]); // Kamera prati taksi na mapi
        }

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            // Završeno!
            setTimeout(() => {
                const routeType = document.getElementById("routeSelect").value;
                let durationText = (routeType === "ns-airport" || routeType === "airport-ns") ? "1 sat (60 minuta)" : "1 sat i 15 minuta (75 minuta)";
                alert(`Vaš City Taxi je stigao na odredište! Put je trajao ${durationText}. Hvala na poverenju.`);
                if (simulationMarker) {
                    leafletMap.removeLayer(simulationMarker);
                    simulationMarker = null;
                }
                // Vrati zoom na obuhvat cele rute
                leafletMap.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });
            }, 500);
        }
    }

    requestAnimationFrame(animate);
}

// Check early departure warning: 2 hours at airport before flight departure
function checkEarlyDepartureWarning() {
    const warningDiv = document.getElementById("earlyDepartureWarning");
    const warningText = document.getElementById("earlyDepartureWarningText");
    const routeSelect = document.getElementById("routeSelect").value;
    const pickupTimeStr = document.getElementById("pickupTime").value;

    // This warning is ONLY for trips Novi Sad -> Airport
    if (routeSelect !== "ns-airport") {
        warningDiv.classList.add("hidden");
        return;
    }

    if (!activeFlightData || !pickupTimeStr) {
        warningDiv.classList.add("hidden");
        return;
    }

    const flightTimeStr = activeFlightData.depTime;
    if (flightTimeStr === "--:--" || !flightTimeStr) {
        warningDiv.classList.add("hidden");
        return;
    }

    // Parse times to minutes from midnight
    const [pHours, pMinutes] = pickupTimeStr.split(":").map(Number);
    const [fHours, fMinutes] = flightTimeStr.split(":").map(Number);

    let pickupMinutes = pHours * 60 + pMinutes;
    let flightMinutes = fHours * 60 + fMinutes;

    // If flight is next day (e.g. flight departs at 02:00 but pickup is 23:00)
    if (flightMinutes < pickupMinutes) {
        flightMinutes += 24 * 60;
    }

    // Travel time from Novi Sad to Airport is 60 minutes
    const travelTime = 60;
    const expectedArrivalMinutes = pickupMinutes + travelTime;
    const timeBeforeFlight = flightMinutes - expectedArrivalMinutes;

    // We want expectedArrivalMinutes to be at least 2 hours (120 minutes) BEFORE flightMinutes
    // That means timeBeforeFlight must be >= 120
    if (timeBeforeFlight < 120) {
        const suggestedPickupMinutes = flightMinutes - 120 - travelTime; // 2h check-in + 1h travel = 3h before flight
        
        let sugH = Math.floor(suggestedPickupMinutes / 60) % 24;
        let sugM = suggestedPickupMinutes % 60;
        if (sugH < 0) sugH += 24;
        
        const suggestedPickupStr = `${sugH < 10 ? '0' + sugH : sugH}:${sugM < 10 ? '0' + sugM : sugM}`;
        const arrivalStr = `${Math.floor(expectedArrivalMinutes / 60) % 24}:${expectedArrivalMinutes % 60 < 10 ? '0' + (expectedArrivalMinutes % 60) : expectedArrivalMinutes % 60}`;

        let warningHtml = "";
        if (currentLang === 'en') {
            warningHtml = `The airport requires you to be there 2 hours before takeoff. Your ride arrives at the airport at <strong>${arrivalStr}</strong>, and takeoff is at <strong>${flightTimeStr}</strong>. We recommend departing earlier, ideally at <strong>${suggestedPickupStr}</strong>.`;
        } else if (currentLang === 'ru') {
            warningHtml = `Аэропорт требует прибытия за 2 часа до вылета. Ваша поездка прибудет в аэропорт в <strong>${arrivalStr}</strong>, а вылет в <strong>${flightTimeStr}</strong>. Рекомендуем выехать раньше, в идеале в <strong>${suggestedPickupStr}</strong>.`;
        } else {
            warningHtml = `Aerodrom zahteva da budete tamo 2 sata pre poletanja. Vaša vožnja stiže na aerodrom u <strong>${arrivalStr}</strong>, a poletanje je u <strong>${flightTimeStr}</strong>. Preporučujemo da krenete ranije, idealno u <strong>${suggestedPickupStr}</strong>.`;
        }

        warningText.innerHTML = warningHtml;
        warningDiv.classList.remove("hidden");
    } else {
        warningDiv.classList.add("hidden");
    }
}

// PWA Window Event Listeners
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show PWA install button in header
    const installBtn = document.getElementById("installAppBtn");
    if (installBtn) {
        installBtn.classList.remove("hidden");
    }
});

window.addEventListener('appinstalled', (evt) => {
    console.log('City Taxi aplikacija je uspešno instalirana na uređaj.');
    const installBtn = document.getElementById("installAppBtn");
    if (installBtn) {
        installBtn.classList.add("hidden");
    }
});
