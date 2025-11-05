async function api(path, method='GET', body=null){
  const opts = { method, headers: {} };
  if (body) { opts.headers['Content-Type']='application/json'; opts.body=JSON.stringify(body); }
  const res = await fetch('/api'+path, opts);
  return res.json();
}

async function refreshFlags(){
  const data = await api('/flags');
  document.getElementById('toggle-sql').checked = !!data.sql_enabled;
  document.getElementById('toggle-csrf').checked = !!data.csrf_enabled;
}

async function setFlag(flag, value){
  await api('/flags', 'POST', { flag, value });
  await refreshFlags();
}

document.addEventListener('DOMContentLoaded', ()=> {
  document.getElementById('toggle-sql').addEventListener('change', (e)=> setFlag('sql_enabled', e.target.checked));
  document.getElementById('toggle-csrf').addEventListener('change', (e)=> setFlag('csrf_enabled', e.target.checked));

  document.getElementById('save-sql').addEventListener('click', async ()=>{
    const msg = document.getElementById('sql-message').value || '';
    const pin = document.getElementById('sql-pin').value || '';
    const res = await api('/run-sql', 'POST', { message: msg, pin });
    const div = document.getElementById('sql-result');
    div.innerHTML = '<div style="font-weight:600;margin-bottom:6px">'+res.note+'</div>';
    if (res.entry && res.entry.enabled) {
      const sim = document.createElement('div');
      sim.style.marginTop='8px';
      sim.innerHTML = '<strong>SIMULACIJA: DB MATCHES:</strong> ' + JSON.stringify(res.entry.matches, null, 2);
      div.appendChild(sim);
    }
    refreshLogs();
  });
  document.getElementById('copy-sql-sample').addEventListener('click', ()=>{
    const el = document.getElementById('sql-message');
    el.value = "'OR 1=1 #";
    el.focus();
  });

  document.getElementById('submit-legit').addEventListener('click', async ()=>{
    const email = document.getElementById('legit-email').value || '';
    const token = document.getElementById('csrf-token').value || '';
    const res = await api('/run-csrf', 'POST', { email, token, mode: 'legit' });
    const div = document.getElementById('csrf-result');
    div.innerHTML = '<div style="font-weight:600;margin-bottom:6px">'+res.note+'</div>';
    if (res.entry && res.entry.success) {
      const sim = document.createElement('div');
      sim.style.marginTop='8px';
      sim.innerHTML = '<strong>SIMULACIJA:</strong> Email korisnika sada je: ' + res.entry.new_email;
      div.appendChild(sim);
    }
    refreshLogs();
  });

  document.getElementById('submit-attack').addEventListener('click', async ()=>{
    const email = document.getElementById('attack-email').value || '';
    const res = await api('/run-csrf', 'POST', { email, token: null, mode: 'attack' });
    const div = document.getElementById('csrf-result');
    div.innerHTML = '<div style="font-weight:600;margin-bottom:6px">'+res.note+'</div>';
    if (res.entry && res.entry.success) {
      const sim = document.createElement('div');
      sim.style.marginTop='8px';
      sim.innerHTML = '<strong>SIMULACIJA:</strong> (napad uspješan) Email korisnika sada je: ' + res.entry.new_email;
      div.appendChild(sim);
    }
    refreshLogs();
  });

  document.getElementById('refresh-logs').addEventListener('click', refreshLogs);

  refreshFlags();
  refreshLogs();
});

async function refreshLogs(){
  const res = await api('/logs');
  document.getElementById('logs-pre').textContent = JSON.stringify(res, null, 2);
}
