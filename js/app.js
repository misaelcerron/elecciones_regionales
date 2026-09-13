/* ═══════════════════════════════════════════════════════════════
   js/app.js — Digitación de Actas (4 en 1)
   ODPE PASCO · Sistema Electoral 2026
═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── DOM refs ────────────────────────────────────────────────
const inputMesa     = document.getElementById('id_mesa');
const inputElect    = document.getElementById('electores_habiles');
const valBox        = document.getElementById('validationBox');
const btnSubmit     = document.getElementById('btnSubmit');
const mesaChip      = document.getElementById('mesaChip');
const mesaChipText  = document.getElementById('mesaChipText');
const escrutinioSection = document.getElementById('escrutinioSection');
const validacionSection = document.getElementById('validacionSection');

// ─── Estado ────────────────────────────────────────────
let orgsData    = [];   
let toastTimer  = null;
let mesaValida  = false; 

// Nombres de elección para UI
const nombresEleccion = {
    1: 'Regional',
    2: 'Consejero',
    3: 'Provincial',
    4: 'Distrital'
};

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await cargarOrganizaciones();
    bindTabs();
    bindMesaLookup();
    document.getElementById('actaForm').addEventListener('submit', handleSubmit);
});

/* ════════════════════════════════════════════════════════════
   CARGA DE ORGANIZACIONES POLÍTICAS
════════════════════════════════════════════════════════════ */
async function cargarOrganizaciones() {
    try {
        const res  = await fetch('api/organizaciones.php?action=list');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
            orgsData = json.data;
        } else {
            usarOrganizacionesPorDefecto();
        }
    } catch (e) {
        console.warn('Usando datos por defecto.', e);
        usarOrganizacionesPorDefecto();
    }
    renderPartidosTodasLasTabs();
    crearCajasValidacion();
}

function usarOrganizacionesPorDefecto() {
    orgsData = [
        { id_partido: 1, nombre: 'Alianza Para el Progreso', siglas: 'APP', simbolo_url: null },
        { id_partido: 3, nombre: 'Acción Popular', siglas: 'AP', simbolo_url: null },
        { id_partido: 8, nombre: 'Somos Perú', siglas: 'SP', simbolo_url: null },
    ];
}

function renderPartidosTodasLasTabs() {
    for (let t = 1; t <= 4; t++) {
        const container = document.getElementById(`partidosContainer_${t}`);
        if (!container) continue;
        
        if (!orgsData || orgsData.length === 0) {
            container.innerHTML = '<div>No hay organizaciones</div>';
            continue;
        }
        container.innerHTML = orgsData.map((org, i) => buildPartidoCard(org, i, t)).join('');
    }
    bindInputsEscuchadores();
}

function buildPartidoCard(org, idx, tab) {
    const logoHtml = org.simbolo_url
        ? `<img src="${esc(org.simbolo_url)}" alt="${esc(org.nombre)}" onerror="this.parentElement.innerHTML='<span class=\'party-logo-placeholder\'>🏛</span>'">`
        : `<span class="party-logo-placeholder">🏛</span>`;
    const siglasHtml = org.siglas ? `<div class="party-siglas">${esc(org.siglas)}</div>` : '';

    return `
    <div class="party-card" id="card_${t}_${org.id_partido}">
        <div class="party-head">
            <div class="party-logo">${logoHtml}</div>
            <div class="party-meta">
                <div class="party-name">${esc(org.nombre)}</div>
                ${siglasHtml}
            </div>
        </div>
        <div class="vote-counter">
            <button type="button" class="btn-step minus" data-target="voto_${tab}_${org.id_partido}">−</button>
            <input type="number" class="vote-value party-input" id="voto_${tab}_${org.id_partido}" data-partido="${org.id_partido}" data-tab="${tab}" value="0" min="0" inputmode="numeric">
            <button type="button" class="btn-step plus" data-target="voto_${tab}_${org.id_partido}">+</button>
        </div>
    </div>`;
}

function crearCajasValidacion() {
    const cont = document.getElementById('validationsContainer');
    if (!cont) return;
    let html = '';
    for (let t = 1; t <= 4; t++) {
        html += `
        <div class="validation-box neutral" id="valBox_${t}" style="margin-bottom: 0.5rem; padding: 0.5rem; font-size: 0.85rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div><strong style="width:70px; display:inline-block;">${nombresEleccion[t]}</strong> <span id="valIcon_${t}">⏳</span> <span id="valText_${t}">Esperando...</span></div>
                <div style="font-size: 0.75rem;">Suma: <b id="sumVotos_${t}">0</b> | Votaron: <b id="txtVotantes_${t}">0</b></div>
            </div>
        </div>`;
    }
    cont.innerHTML = html;
}

/* ════════════════════════════════════════════════════════════
   BIND EVENTOS
════════════════════════════════════════════════════════════ */
function bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-content-' + btn.dataset.tab).classList.add('active');
        });
    });
}

function bindInputsEscuchadores() {
    document.querySelectorAll('.party-input, .other-input, .total-votaron-input').forEach(inp => {
        inp.addEventListener('input', () => { sanitizeInput(inp); updateCardState(inp); validateMath(); });
        inp.addEventListener('focus', function() { this.select(); });
    });

    document.querySelectorAll('.btnAutoVotaron').forEach(btn => {
        btn.addEventListener('click', () => {
            const t = btn.dataset.target;
            fijarVotantes(t);
        });
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-step');
        if (!btn) return;
        const targetId = btn.dataset.target;
        const inp = document.getElementById(targetId);
        if (!inp) return;
        let v = parseInt(inp.value) || 0;
        if (btn.classList.contains('plus'))  v = v + 1;
        if (btn.classList.contains('minus')) v = Math.max(0, v - 1);
        inp.value = v;
        inp.dispatchEvent(new Event('input'));
    });
}

function windowFijarVotantes(t, n) {
    const inp = document.getElementById('total_votaron_' + t);
    if (inp) {
        inp.value = n;
        inp.dispatchEvent(new Event('input'));
        mostrarToast(`✓ "Votaron" fijado en ${n} para ${nombresEleccion[t]}`, 'success');
    }
}
window.fijarVotantes = windowFijarVotantes;

function fijarVotantes(t) {
    let sum = 0;
    document.querySelectorAll(`.party-input[data-tab="${t}"]`).forEach(inp => { sum += parseInt(inp.value) || 0; });
    sum += (parseInt(document.getElementById(`votos_blancos_${t}`).value) || 0);
    sum += (parseInt(document.getElementById(`votos_nulos_${t}`).value) || 0);
    sum += (parseInt(document.getElementById(`votos_impugnados_${t}`).value) || 0);
    windowFijarVotantes(t, sum);
}

function updateCardState(inp) {
    if(inp.classList.contains('party-input')) {
        const card = inp.closest('.party-card');
        if (card) card.classList.toggle('has-votes', (parseInt(inp.value)||0) > 0);
    }
}

function sanitizeInput(inp) {
    const v = parseInt(inp.value);
    if (isNaN(v) || v < 0) inp.value = 0;
}

/* ════════════════════════════════════════════════════════════
   MESA LOOKUP
════════════════════════════════════════════════════════════ */
let mesaTimeout;
function bindMesaLookup() {
    inputMesa.addEventListener('input', () => {
        clearTimeout(mesaTimeout);
        const val = inputMesa.value.trim();
        mesaValida = false;
        resetMesaState();
        inputElect.value = '';
        mesaChip.classList.remove('visible');
        escrutinioSection.style.display = 'none';
        validacionSection.style.display = 'none';
        
        if (val.length >= 4) {
            setMesaFeedback('loading', '⏳ Verificando mesa...');
            mesaTimeout = setTimeout(() => validarMesa(val), 700);
        }
    });
}

async function validarMesa(nro) {
    try {
        const res  = await fetch(`api/validar_mesa.php?id_mesa=${encodeURIComponent(nro)}`);
        const json = await res.json();
        if (json.success && json.data) {
            const m = json.data;
            mesaValida = true;
            inputElect.value = m.electores_habiles;
            setMesaFeedback('ok', `✓ Mesa ${m.id_mesa} — ${Number(m.electores_habiles).toLocaleString()} electores`);
            escrutinioSection.style.display = 'block';
            validacionSection.style.display = 'block';
            validateMath();
        } else {
            mesaValida = false;
            setMesaFeedback('err', `⚠️ ${json.message || 'Mesa no existe'}`);
        }
    } catch (e) {
        mesaValida = false;
        setMesaFeedback('err', '⚠️ Error de conexión');
    }
}

function setMesaFeedback(tipo, texto) {
    const fb = document.getElementById('mesaFeedback');
    fb.className = `mesa-feedback ${tipo}`;
    fb.textContent = texto;
}
function resetMesaState() {
    const fb = document.getElementById('mesaFeedback');
    fb.className = 'mesa-feedback';
    fb.textContent = '';
}

/* ════════════════════════════════════════════════════════════
   VALIDACIÓN MATEMÁTICA x4
════════════════════════════════════════════════════════════ */
function validateMath() {
    if (!mesaValida) return;
    const electoresHab = parseInt(inputElect.value) || 0;
    
    let allOk = true;

    for (let t = 1; t <= 4; t++) {
        const totalVotaron = parseInt(document.getElementById(`total_votaron_${t}`).value) || 0;
        const blancos      = parseInt(document.getElementById(`votos_blancos_${t}`).value) || 0;
        const nulos        = parseInt(document.getElementById(`votos_nulos_${t}`).value) || 0;
        const impugnados   = parseInt(document.getElementById(`votos_impugnados_${t}`).value) || 0;
        
        let sumPartidos = 0;
        document.querySelectorAll(`.party-input[data-tab="${t}"]`).forEach(inp => {
            sumPartidos += parseInt(inp.value) || 0;
        });
        const sumaTotalVotos = sumPartidos + blancos + nulos + impugnados;
        
        document.getElementById(`sumVotos_${t}`).textContent = sumaTotalVotos;
        document.getElementById(`txtVotantes_${t}`).textContent = totalVotaron;
        
        const btnAuto = document.querySelector(`.btnAutoVotaron[data-target="${t}"]`);
        if (btnAuto) {
            if (sumaTotalVotos > 0 && totalVotaron !== sumaTotalVotos) {
                btnAuto.style.display = 'inline-block';
                btnAuto.querySelector('.btnAutoVotaronNum').textContent = sumaTotalVotos;
            } else {
                btnAuto.style.display = 'none';
            }
        }
        
        if (totalVotaron === 0 && sumaTotalVotos === 0) {
            setValBox(t, 'neutral', '⏳', 'Sin datos');
            allOk = false;
        } else if (totalVotaron === 0 && sumaTotalVotos > 0) {
            setValBox(t, 'err', '⚠️', `Votos=${sumaTotalVotos}, Votaron=0 <button onclick="window.fijarVotantes(${t},${sumaTotalVotos})" style="cursor:pointer;font-size:0.75rem;padding:2px;border:1px solid #ccc;border-radius:4px;">Usar ${sumaTotalVotos}</button>`);
            allOk = false;
        } else if (electoresHab > 0 && totalVotaron > electoresHab) {
            setValBox(t, 'err', '⚠️', `Votaron (${totalVotaron}) > Padrón (${electoresHab})`);
            allOk = false;
        } else if (sumaTotalVotos !== totalVotaron) {
            setValBox(t, 'err', '✗', `Descuadre: Suma=${sumaTotalVotos}, Votaron=${totalVotaron}`);
            allOk = false;
        } else {
            setValBox(t, 'ok', '✓', `Cuadre OK`);
        }
    }
    
    btnSubmit.disabled = !allOk;
}

function setValBox(t, state, icon, text) {
    const box = document.getElementById(`valBox_${t}`);
    box.className = 'validation-box ' + (state === 'neutral' ? '' : state);
    document.getElementById(`valIcon_${t}`).textContent = icon;
    document.getElementById(`valText_${t}`).innerHTML = text;
}

/* ════════════════════════════════════════════════════════════
   SUBMIT — GUARDAR ACTAS MÚLTIPLES
════════════════════════════════════════════════════════════ */
async function handleSubmit(e) {
    e.preventDefault();
    if (!mesaValida) return;

    btnSubmit.disabled = true;
    const origHtml = btnSubmit.innerHTML;
    btnSubmit.innerHTML = 'Guardando 4 Actas...';

    const actas = [];
    for (let t = 1; t <= 4; t++) {
        const resultados = [];
        document.querySelectorAll(`.party-input[data-tab="${t}"]`).forEach(inp => {
            resultados.push({
                id_partido: parseInt(inp.dataset.partido),
                votos: parseInt(inp.value) || 0
            });
        });
        
        actas.push({
            tipo_eleccion: t,
            total_votaron: parseInt(document.getElementById(`total_votaron_${t}`).value) || 0,
            votos_blancos: parseInt(document.getElementById(`votos_blancos_${t}`).value) || 0,
            votos_nulos: parseInt(document.getElementById(`votos_nulos_${t}`).value) || 0,
            votos_impugnados: parseInt(document.getElementById(`votos_impugnados_${t}`).value) || 0,
            resultados
        });
    }

    const payload = {
        id_mesa: inputMesa.value.trim(),
        electores_habiles: parseInt(inputElect.value) || 0,
        actas: actas
    };

    try {
        const res = await fetch('api/guardar_actas_multi.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            mostrarToast('✓ Las 4 actas fueron guardadas', 'success');
            document.getElementById('actaForm').reset();
            document.querySelectorAll('.party-input, .other-input, .total-votaron-input').forEach(inp => {
                inp.value = 0;
                updateCardState(inp);
            });
            inputMesa.value = '';
            mesaValida = false;
            resetMesaState();
            escrutinioSection.style.display = 'none';
            validacionSection.style.display = 'none';
        } else {
            mostrarToast('❌ ' + (data.message || 'Error al guardar'), 'error');
        }
    } catch(e) {
        mostrarToast('❌ Error de red', 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = origHtml;
    }
}

function mostrarToast(msg, tipo = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.className = `toast ${tipo} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}
function esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
