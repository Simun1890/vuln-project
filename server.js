const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Flags and logs
const flags = {
  sql_enabled: true,
  csrf_enabled: false
};
const logs = { sql: [], csrf: [] };

// simple DB
const fakeDB = [
  { id:1, msg: 'admin', pin: '1234', owner: 'admin' },
  { id:2, msg: 'hello', pin: '1111', owner: 'user' }
];
let userProfile = { id: 1, email: 'korisnik@primjer.hr' };

function addLog(cat, entry){
  if (!logs[cat]) logs[cat]=[];
  logs[cat].push(Object.assign({ time: new Date().toISOString() }, entry));
  if (logs[cat].length>200) logs[cat].shift();
}

app.get('/api/flags', (req,res) => res.json(flags));
app.post('/api/flags', (req,res) => {
  const { flag, value } = req.body;
  if (flag in flags) { flags[flag]=!!value; return res.json({ ok:true, flags }); }
  res.status(400).json({ ok:false, msg:'Unknown flag' });
});

// SQL endpoint
app.post('/api/run-sql', (req, res) => {
    const { message, pin } = req.body || {};
    const enabled = flags.sql_enabled;
    let matches = [];
    let note = "SQL ranjivost isključena (simulacija).";

    if (enabled) {
        const lowered = (message || '').toLowerCase();

        // Tautologija → "eksfiltracija" (= vraćamo svi zapisi) + opcionalno ažuriranje fakeDB
        if (lowered.includes('or 1=1')) {
            // Ako je attacker proslijedio PIN, simuliramo da napadač može izmijeniti zapise:
            if (pin) {
                // Primjer: zamijeni PIN za sve zapise (možeš prilagoditi logiku ako želiš promijeniti samo određeni zapis)
                for (let i = 0; i < fakeDB.length; i++) {
                    fakeDB[i].pin = pin;
                }
            }

            matches = fakeDB.slice(); // vraćamo ažurirane zapise
            note = "SIMULACIJA: Detektiran SQL tautologija; vraćam sve zapise (i ažurirao PIN ako je poslan).";
        } else {
            // Normalna pretraga (bez eksploata)
            matches = fakeDB.filter(r => r.msg === (message || '') && r.pin === (pin || ''));
            note = "SIMULACIJA: Normalna pretraga (bez eksploata).";
        }
    }

    const entry = { enabled, message_preview: (message || '').slice(0, 200), pin_present: !!pin, matches };
    addLog('sql', entry);
    res.json({ ok: true, entry, note });
});

// CSRF endpoint
app.post('/api/run-csrf', (req,res) => {
  const { email, token, mode } = req.body || {};
  const enabled = flags.csrf_enabled;
  let note = "Zahtjev odbijen: CSRF zaštita aktivna.";
  let success = false;
  if (enabled) {
    userProfile.email = email || userProfile.email;
    note = "SIMULACIJA: CSRF ranjivost uključena — zahtjev bez tokena uspijeva.";
    success = true;
  } else {
    if (token && token === 'securetoken123') {
      userProfile.email = email || userProfile.email;
      note = "Legitiman zahtjev s valjanim CSRF tokenom — promjena spremljena.";
      success = true;
    } else {
      note = "Zahtjev odbijen: nedostaje/krivi CSRF token.";
      success = false;
    }
  }
  const entry = { enabled, mode: mode||'unknown', token_present: !!token, new_email: userProfile.email };
  addLog('csrf', entry);
  res.json({ ok:true, entry, success, note });
});

app.get('/api/logs', (req,res) => res.json(logs));

app.get('*', (req,res) => {
  res.sendFile(path.join(__dirname,'public','index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on port', port));
