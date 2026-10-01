// ════════════════ INTRO ANIMÉE ════════════════
const bootLines = [
    { text: '> Initialisation du système...', ok: false },
    { text: '> Chargement des modules...',    ok: false },
    { text: '> Connexion au serveur...',      ok: false },
    { text: '> Prêt.',                        ok: true  },
];

async function playIntro() {
    const container = document.getElementById('bootLines');
    const fill = document.getElementById('bootFill');

    for (const [i, line] of bootLines.entries()) {
        const div = document.createElement('div');
        div.className = 'line' + (line.ok ? ' ok' : '');
        div.textContent = line.text + (line.ok ? '  ✔' : '');
        container.appendChild(div);
        fill.style.width = ((i + 1) / bootLines.length * 100) + '%';
        await sleep(450);
    }
    await sleep(500);
    document.getElementById('intro').classList.add('done');
    document.getElementById('app').classList.remove('hidden');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ════════════════ CONFIG (depuis le serveur) ════════════════
let CONFIG = { discord: '#', clientName: 'client.jar', modName: 'mod.jar' };

fetch('/api/config')
    .then(r => r.json())
    .then(c => CONFIG = c)
    .catch(() => {});

// ════════════════ OUTILS UI ════════════════
function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
}

function ripple(e, btn) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = size + 'px';
    r.style.left = (e.clientX - rect.left - size / 2) + 'px';
    r.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
    btn.appendChild(r);
    setTimeout(() => r.remove(), 650);
}

// ════════════════ ACTIONS ════════════════
function openDiscord() {
    window.open(CONFIG.discord, '_blank');
    toast('💬 Discord ouvert dans un nouvel onglet !');
}

async function download(endpoint, filename, label) {
    const overlay = document.getElementById('overlay');
    const fill = document.getElementById('dlFill');
    const percent = document.getElementById('dlPercent');
    const info = document.getElementById('dlInfo');
    const title = document.getElementById('dlTitle');

    title.textContent = label;
    info.textContent = 'Préparation...';
    fill.style.width = '0%';
    percent.textContent = '0%';
    overlay.classList.remove('hidden');

    try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('serveur : ' + res.status);

        const total = +res.headers.get('content-length') || 0;
        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;

            if (total) {
                const p = received / total;
                fill.style.width = (p * 100).toFixed(1) + '%';
                percent.textContent = Math.round(p * 100) + '%';
                info.textContent = (received / 1048576).toFixed(1) + ' / ' + (total / 1048576).toFixed(1) + ' Mo';
            } else {
                fill.style.width = '50%';
                info.textContent = (received / 1048576).toFixed(1) + ' Mo reçus...';
            }
        }

        // Sauvegarde du fichier
        const blob = new Blob(chunks);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);

        fill.style.width = '100%';
        percent.textContent = '100%';
        toast('✔ ' + filename + ' téléchargé !');

    } catch (err) {
        toast('✘ Erreur de téléchargement : ' + err.message);
    } finally {
        setTimeout(() => overlay.classList.add('hidden'), 600);
    }
}

const downloadClient = () => download('/download/client', CONFIG.clientName, '🚀 Light Client');
const downloadMod    = () => download('/download/mod',    CONFIG.modName,    '🧩 Mod Minecraft');

// ════════════════ ÉVÉNEMENTS ════════════════
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', e => ripple(e, btn));
});

document.getElementById('btnClient').addEventListener('click', downloadClient);
document.getElementById('btnDiscord').addEventListener('click', openDiscord);
document.getElementById('btnMod').addEventListener('click', downloadMod);

// Raccourcis clavier 1 / 2 / 3
document.addEventListener('keydown', e => {
    if (e.key === '1') downloadClient();
    if (e.key === '2') openDiscord();
    if (e.key === '3') downloadMod();
});

// Lancement de l'intro
playIntro();