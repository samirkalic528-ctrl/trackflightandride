const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DATABASE_PATH || path.join(__dirname, 'bookings.json');

// Osiguraj da direktorijum za bazu podataka postoji
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Enable CORS so our frontend SPA can talk to this server
app.use(cors());
app.use(express.json());

// Auth Middleware za zaštitu dispečerskog panela i osetljivih API endpoints
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="City Taxi Admin"');
        return res.status(401).send('Pristup odbijen. Potrebna je prijava.');
    }

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];

    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'citytaxi021';

    if (user === adminUser && pass === adminPass) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="City Taxi Admin"');
        return res.status(401).send('Pogrešno korisničko ime ili lozinka.');
    }
};

// Zaštiti dispečerski fajl pre nego što express.static preuzme zahteve
app.get('/dispatcher.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'dispatcher.html'));
});

// Serve static frontend files (index.html, itd.)
app.use(express.static(__dirname));

// Logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Helper function to read database
function readDatabase() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify([]));
        }
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Greška pri čitanju baze podataka:', error.message);
        return [];
    }
}

// Helper function to write database
function writeDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Greška pri pisanju u bazu podataka:', error.message);
        return false;
    }
}

// ==========================================================================
// Endpoint: Proxy za praćenje letova (Rešava CORS problem)
// ==========================================================================
app.post('/api/check-flight', async (req, res) => {
    let { flightCode, flightDate, rapidApiKey, airlabsKey } = req.body;
    
    if (!flightCode) {
        return res.status(400).json({ error: 'Broj leta je obavezan.' });
    }
    
    const activeRapidKey = (rapidApiKey && rapidApiKey.trim()) || (process.env.RAPID_API_KEY && process.env.RAPID_API_KEY.trim());
    const activeAirlabsKey = (airlabsKey && airlabsKey.trim()) || (process.env.AIRLABS_API_KEY && process.env.AIRLABS_API_KEY.trim());
    
    const cleanFlightCode = flightCode.replace(/\s+/g, '').toUpperCase();

    try {
        console.log(`[Proxy Log] Aktivni ključ - RapidAPI: ${activeRapidKey ? 'Da' : 'Ne'}, AirLabs: ${activeAirlabsKey ? 'Da' : 'Ne'}`);
        if (activeRapidKey) {
            let currentQueryDate = flightDate;
            let response = null;
            let found = false;
            let attempts = 0;
            const maxAttempts = 7; // Proveri do 7 dana unapred

            while (!found && attempts < maxAttempts) {
                console.log(`[Proxy] AeroDataBox pretraga: ${cleanFlightCode} za datum ${currentQueryDate} (Pokušaj ${attempts + 1})`);
                const url = `https://aerodatabox.p.rapidapi.com/flights/number/${cleanFlightCode}/${currentQueryDate}`;
                
                try {
                    response = await axios.get(url, {
                        headers: {
                            'X-RapidAPI-Key': activeRapidKey,
                            'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
                        },
                        timeout: 8000 // 8s timeout po pokušaju
                    });

                    if (response.status === 200 && response.data && response.data.length > 0) {
                        found = true;
                        flightDate = currentQueryDate; // Sačuvaj datum na kome je let pronađen
                    } else {
                        attempts++;
                        currentQueryDate = getNextDayDate(currentQueryDate);
                        // Sačekaj 1.2 sekunde pre sledećeg zahteva da se izbegne 429 Rate Limit
                        await new Promise(resolve => setTimeout(resolve, 1200));
                    }
                } catch (err) {
                    if (err.response && (err.response.status === 204 || err.response.status === 404)) {
                        attempts++;
                        currentQueryDate = getNextDayDate(currentQueryDate);
                        // Sačekaj 1.2 sekunde pre sledećeg zahteva da se izbegne 429 Rate Limit
                        await new Promise(resolve => setTimeout(resolve, 1200));
                    } else {
                        throw err; // Druge kritične greške baci dalje
                    }
                }
            }

            if (found && response) {
                console.log(`[Proxy Log] Let uspešno pronađen za datum: ${flightDate}`);
                return res.json({ provider: 'aerodatabox', data: response.data, date: flightDate });
            } else {
                console.log(`[Proxy Log] Let nije pronađen ni na jedan od 7 proverenih dana.`);
                return res.json({ provider: 'aerodatabox', data: [], date: flightDate });
            }
        } else if (activeAirlabsKey) {
            console.log(`[Proxy] AirLabs pretraga: ${cleanFlightCode}`);
            const url = `https://airlabs.co/api/v9/flight?flight_iata=${cleanFlightCode}&api_key=${activeAirlabsKey}`;
            const response = await axios.get(url);
            return res.json({ provider: 'airlabs', data: response.data });
        } else {
            return res.status(400).json({ error: 'no_keys', message: 'Nisu dostavljeni API ključevi.' });
        }
    } catch (error) {
        console.error('[Proxy Error] Greška u praćenju leta:', error.message);
        
        // Handle axios responses (404, 403, 204 etc) gracefully
        if (error.response) {
            if (error.response.status === 204) {
                return res.json({ provider: 'aerodatabox', data: [] });
            }
            return res.status(error.response.status).json({ error: error.message, details: error.response.data });
        }
        return res.status(500).json({ error: error.message });
    }
});

// ==========================================================================
// Endpoint: Dobijanje svih rezervacija (za Dispečera)
// ==========================================================================
// Endpoint: Pregled svih rezervacija (Za dispečere)
// ==========================================================================
app.get('/api/bookings', authMiddleware, (req, res) => {
    const bookings = readDatabase();
    // Sort bookings: newest first
    const sortedBookings = bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedBookings);
});

// ==========================================================================
// Endpoint: Promena statusa vožnje
// ==========================================================================
app.put('/api/booking/:id/status', authMiddleware, (req, res) => {
    const bookingId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: 'Status nije naveden.' });
    }

    const bookings = readDatabase();
    const index = bookings.findIndex(b => b.id === bookingId);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Rezervacija nije pronađena.' });
    }

    bookings[index].status = status;
    writeDatabase(bookings);

    console.log(`Status porudžbine ${bookingId} je promenjen na: ${status}`);
    res.json({ success: true, message: 'Status je uspešno ažuriran.' });
});

// ==========================================================================
// Endpoint: Nova rezervacija
// ==========================================================================
app.post('/api/booking', async (req, res) => {
    const {
        name,
        phone,
        route,
        price,
        dateTime,
        vehicleClass,
        flightCode,
        delay,
        newSuggestedTime,
        lang
    } = req.body;

    // Validate request
    if (!name || !phone || !route || !price) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nedostaju obavezni podaci (ime, telefon, relacija, cena).' 
        });
    }

    // Generate unique Order ID (e.g. TX-4829)
    const orderId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = {
        id: orderId,
        name,
        phone,
        route,
        price,
        dateTime,
        vehicleClass,
        flightCode: flightCode || null,
        delay: delay || 0,
        newSuggestedTime: newSuggestedTime || null,
        lang: lang || 'sr',
        status: 'Na čekanju', // Initial status
        createdAt: new Date().toISOString()
    };

    // Save to local JSON database
    const bookings = readDatabase();
    bookings.push(newBooking);
    writeDatabase(bookings);

    console.log(`[Nova porudžbina ${orderId}] Primljeno od: ${name} (${phone}) [Jezik: ${lang || 'sr'}]`);

    // Format message content for Email and Viber
    const emailSubject = `City Taxi - Porudžbina ${orderId}: ${name}`;
    const clientLang = (lang === 'en') ? 'Engleski' : ((lang === 'ru') ? 'Ruski' : 'Srpski');
    
    let messageText = `
🚖 **CITY TAXI - PORUDŽBINA ${orderId}** 🚖
-------------------------------------
👤 **Klijent:** ${name}
📞 **Telefon:** ${phone}
📍 **Relacija:** ${route}
🕒 **Datum i vreme:** ${dateTime}
🚗 **Klasa vozila:** ${vehicleClass}
💰 **Cena:** ${price}
🌐 **Jezik klijenta:** ${clientLang}
`;

    if (flightCode) {
        messageText += `✈️ **Broj leta:** ${flightCode}\n`;
        if (delay > 0) {
            messageText += `⚠️ **Kašnjenje leta:** +${delay} min\n`;
            messageText += `⏰ **Novo vreme preuzimanja:** ${newSuggestedTime}\n`;
        } else {
            messageText += `✅ **Status leta:** Na vreme\n`;
        }
    }
    
    messageText += `-------------------------------------`;

    let emailSent = false;
    let viberSent = false;
    let telegramSent = false;

    // 1. Send Email (Nodemailer)
    if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.DISPATCH_EMAIL) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: `"City Taxi Booking" <${process.env.SMTP_USER}>`,
                to: process.env.DISPATCH_EMAIL,
                subject: emailSubject,
                text: messageText,
                html: messageText.replace(/\n/g, '<br>')
            });

            console.log(`[${orderId}] Email uspešno poslat dispečeru.`);
            emailSent = true;
        } catch (error) {
            console.error(`[${orderId}] Greška pri slanju emaila:`, error.message);
        }
    }

    // 2. Send Viber message (Viber Bot API)
    if (process.env.VIBER_AUTH_TOKEN && process.env.VIBER_RECEIVER_ID) {
        try {
            await axios.post('https://chatapi.viber.com/pa/send_message', {
                receiver: process.env.VIBER_RECEIVER_ID,
                min_api_version: 1,
                sender: {
                    name: "City Taxi Dispatch"
                },
                type: "text",
                text: messageText
            }, {
                headers: {
                    'X-Viber-Auth-Token': process.env.VIBER_AUTH_TOKEN,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`[${orderId}] Viber poruka uspešno poslata.`);
            viberSent = true;
        } catch (error) {
            console.error(`[${orderId}] Greška pri slanju Viber poruke:`, error.response ? error.response.data : error.message);
        }
    }

    // 3. Send Telegram message
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        try {
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: messageText,
                parse_mode: 'Markdown'
            });

            console.log(`[${orderId}] Telegram poruka uspešno poslata.`);
            telegramSent = true;
        } catch (error) {
            console.error(`[${orderId}] Greška pri slanju Telegram poruke:`, error.response ? error.response.data : error.message);
        }
    }

    // Response back to frontend containing the new Order ID
    res.status(200).json({
        success: true,
        bookingId: orderId,
        message: 'Rezervacija je uspešno primljena i prosleđena.',
        deliveryStatus: {
            email: emailSent,
            viber: viberSent,
            telegram: telegramSent
        }
    });
});

// Webhook za Viber Bot - Prima poruke od korisnika i ispisuje njihove ID-jeve u konzolu
app.post('/api/viber-webhook', (req, res) => {
    // Viber šalje verifikaciju webhooka na početku (event: webhook)
    if (req.body.event === 'webhook') {
        console.log('[Viber Webhook] Uspešno verifikovan webhook!');
        return res.status(200).send();
    }

    // Kada korisnik pošalje poruku botu (event: message)
    if (req.body.event === 'message' && req.body.sender) {
        const senderId = req.body.sender.id;
        const senderName = req.body.sender.name;
        const text = req.body.message ? req.body.message.text : "";

        console.log(`==================================================`);
        console.log(`[Viber Webhook] Primljena poruka od: ${senderName}`);
        console.log(`[Viber Webhook] VAŠ VIBER SENDER ID JE:`);
        console.log(`>>> ${senderId} <<<`);
        console.log(`[Viber Webhook] Tekst poruke: "${text}"`);
        console.log(`==================================================`);

        // Pošalji odgovor korisniku sa njegovim ID-jem na Viber
        if (process.env.VIBER_AUTH_TOKEN) {
            axios.post('https://chatapi.viber.com/pa/send_message', {
                receiver: senderId,
                min_api_version: 1,
                sender: {
                    name: "City Taxi Bot"
                },
                type: "text",
                text: `Zdravo ${senderName}! Tvoj jedinstveni Viber ID je:\n\n${senderId}\n\nKopiraj ga i upiši u VIBER_RECEIVER_ID u .env fajl na serveru.`
            }, {
                headers: {
                    'X-Viber-Auth-Token': process.env.VIBER_AUTH_TOKEN,
                    'Content-Type': 'application/json'
                }
            }).catch(err => {
                console.error('[Viber Webhook Error] Greška pri slanju odgovora:', err.message);
            });
        }
    }

    return res.status(200).send();
});

// Start Server
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`City Taxi Server je pokrenut na portu: ${PORT}`);
    console.log(`Adresa API-ja: http://localhost:${PORT}/api/booking`);
    console.log(`==================================================`);
});

// Pomoćna funkcija za uvećanje datuma za jedan dan (format YYYY-MM-DD)
function getNextDayDate(dateStr) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    let mm = d.getMonth() + 1;
    let dd = d.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    return `${yyyy}-${mm}-${dd}`;
}
