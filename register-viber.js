const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Učitaj .env podešavanja
dotenv.config();

const token = process.env.VIBER_AUTH_TOKEN;

if (!token || token === 'tvoj_viber_bot_auth_token') {
    console.error('Greska: VIBER_AUTH_TOKEN nije podesen u .env fajlu!');
    process.exit(1);
}

// Preuzmi javnu URL adresu prosleđenu kao argument
const publicUrl = process.argv[2];

if (!publicUrl) {
    console.log('\nKako pokrenuti skriptu:');
    console.log('node register-viber.js <tvoja_javna_https_adresa>');
    console.log('\nPrimer:');
    console.log('node register-viber.js https://1234abcd.ngrok-free.app\n');
    process.exit(1);
}

const webhookUrl = `${publicUrl.replace(/\/$/, '')}/api/viber-webhook`;

console.log(`Saljem zahtev za registraciju Viber Webhooka na: ${webhookUrl}`);

axios.post('https://chatapi.viber.com/pa/set_webhook', {
    url: webhookUrl,
    event_types: ["delivered", "seen", "failed", "subscribed", "unsubscribed", "message"]
}, {
    headers: {
        'X-Viber-Auth-Token': token,
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log('Odgovor od Vibera:', response.data);
    if (response.data.status === 0) {
        console.log('\n==================================================');
        console.log('USPESNO! Viber Bot je povezan sa tvojim serverom.');
        console.log('Sada otvori svoj Viber Bot u aplikaciji i posalji mu poruku "Zdravo".');
        console.log('Bot ce ti odmah odgovoriti i poslati tvoj jedinstveni VIBER_RECEIVER_ID.');
        console.log('==================================================\n');
    } else {
        console.error('Greška pri registraciji:', response.data.status_message);
    }
})
.catch(error => {
    console.error('Doslo je do greske prilikom povezivanja sa Viber API-jem:', error.message);
});
