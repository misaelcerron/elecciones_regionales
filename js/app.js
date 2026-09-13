/* ═══════════════════════════════════════════════════════════════
   js/app.js — Digitación de Actas
   ODPE PASCO · Sistema Electoral 2026
   Carga organizaciones dinámicamente desde API con logos
═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── DOM refs ────────────────────────────────────────────────
const inputMesa     = document.getElementById('id_mesa');
const inputTipoEl   = document.getElementById('tipo_eleccion');
const inputElect    = document.getElementById('electores_habiles');
const inputVotaron  = document.getElementById('total_votaron');
const inputBlancos  = document.getElementById('votos_blancos');
const inputNulos    = document.getElementById('votos_nulos');
const inputImpug    = document.getElementById('votos_impugnados');
const partidosCont  = document.getElementById('partidosContainer');
const valBox        = document.getElementById('validationBox');
const valIcon       = document.getElementById('valIcon');
const valText       = document.getElementById('valText');
const sumVotosEl    = document.getElementById('sumVotos');
const txtVotantes   = document.getElementById('txtVotantes');
const txtPadron     = document.getElementById('txtPadron');
const progressFill  = document.getElementById('progressFill');
const btnSubmit     = document.getElementById('btnSubmit');
const mesaChip      = document.getElementById('mesaChip');
const mesaChipText  = document.getElementById('mesaChipText');
const btnAutoVotaron    = document.getElementById('btnAutoVotaron');
const btnAutoVotaronNum = document.getElementById('btnAutoVotaronNum');

// ─── Estado ────────────────────────────────────────────
let orgsData    = [];   // [{id_partido, nombre, siglas, simbolo_url}]
let toastTimer  = null;
let mesaValida  = false; // true si la mesa fue encontrada en la BD

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await cargarOrganizaciones();
    bindOtrosVotos();
    bindFormInputs();
    bindStepButtons();
    bindMesaLookup();
    document.getElementById('actaForm').addEventListener('submit', handleSubmit);
    validateMath();
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
            renderPartidos(orgsData);
        } else {
            // Fallback a organizaciones por defecto si la API no devuelve datos
            usarOrganizacionesPorDefecto();
        }
    } catch (e) {
        console.warn('No se pudo cargar la API de organizaciones, usando datos por defecto.', e);
        usarOrganizacionesPorDefecto();
    }
}

function renderPartidos(orgs) {
    if (!orgs || orgs.length === 0) {
        partidosCont.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:2rem;color:#515154;font-size:0.9rem;">
                No hay organizaciones políticas registradas.<br>
                <a href="organizaciones.html" style="color:#0071e3;text-decoration:none;font-weight:600;margin-top:0.5rem;display:inline-block;">
                    + Agregar organizaciones
                </a>
            </div>`;
        return;
    }

    partidosCont.innerHTML = orgs.map((org, i) => buildPartidoCard(org, i)).join('');

    // Bind inputs y botones de cada tarjeta
    bindPartidoInputs();
}

function buildPartidoCard(org, idx) {
    const logoHtml = org.simbolo_url
        ? `<img src="${esc(org.simbolo_url)}" alt="${esc(org.nombre)}"
               onerror="this.parentElement.innerHTML='<span class=\\'party-logo-placeholder\\'>🏛</span>'">`
        : `<span class="party-logo-placeholder">🏛</span>`;

    const siglasHtml = org.siglas
        ? `<div class="party-siglas">${esc(org.siglas)}</div>`
        : '';

    return `
    <div class="party-card" style="animation-delay:${idx * 0.045}s" id="card_${org.id_partido}">
        <div class="party-head">
            <div class="party-logo">${logoHtml}</div>
            <div class="party-meta">
                <div class="party-order">Lista #${idx + 1}</div>
                <div class="party-name">${esc(org.nombre)}</div>
                ${siglasHtml}
            </div>
        </div>
        <div class="vote-counter">
            <button type="button" class="btn-step minus"
                    data-target="voto_${org.id_partido}" title="Restar 1 voto">−</button>
            <input type="number"
                   class="vote-value party-input"
                   id="voto_${org.id_partido}"
                   data-partido="${org.id_partido}"
                   value="0" min="0" inputmode="numeric"
                   aria-label="Votos para ${esc(org.nombre)}">
            <button type="button" class="btn-step plus"
                    data-target="voto_${org.id_partido}" title="Sumar 1 voto">+</button>
        </div>
    </div>`;
}

/* ─── Fallback si la API no está disponible ─── */
function usarOrganizacionesPorDefecto() {
    const defaults = [
        { id_partido: 1, nombre: 'Alianza Para el Progreso',     siglas: 'APP',  simbolo_url: null },
        { id_partido: 2, nombre: 'Frente de la Esperanza',       siglas: null,   simbolo_url: null },
        { id_partido: 3, nombre: 'Acción Popular',               siglas: 'AP',   simbolo_url: null },
        { id_partido: 4, nombre: 'Renovación Popular Perú',      siglas: 'RP',   simbolo_url: null },
        { id_partido: 5, nombre: 'Partido Demócrata Verde',      siglas: 'PDV',  simbolo_url: null },
        { id_partido: 6, nombre: 'Alianza Regional por el Perú', siglas: null,   simbolo_url: null },
        { id_partido: 7, nombre: 'Perú Primero',                 siglas: 'PP',   simbolo_url: null },
        { id_partido: 8, nombre: 'Somos Perú',                   siglas: 'SP',   simbolo_url: null },
        { id_partido: 9, nombre: 'Podemos Perú',                 siglas: null,   simbolo_url: null },
    ];
    orgsData = defaults;
    renderPartidos(defaults);
}

/* ════════════════════════════════════════════════════════════
   BIND EVENTOS
════════════════════════════════════════════════════════════ */
function bindPartidoInputs() {
    // Inputs de votos
    document.querySelectorAll('.party-input').forEach(inp => {
        inp.addEventListener('input', () => { sanitizeInput(inp); updateCardState(inp); validateMath(); });
        inp.addEventListener('focus', function() { this.select(); });
        inp.addEventListener('keydown', handleArrowKeys);
    });
}

function bindOtrosVotos() {
    [inputBlancos, inputNulos, inputImpug].forEach(inp => {
        inp.addEventListener('input', () => { sanitizeInput(inp); validateMath(); });
        inp.addEventListener('focus', function() { this.select(); });
    });
}

function bindFormInputs() {
    [inputElect, inputVotaron].forEach(inp => {
        inp.addEventListener('input', validateMath);
        inp.addEventListener('focus', function() { this.select(); });
    });

    if (btnAutoVotaron) {
        btnAutoVotaron.addEventListener('click', () => {
            let sumPartidos = 0;
            document.querySelectorAll('.party-input').forEach(inp => {
                sumPartidos += parseInt(inp.value) || 0;
            });
            const suma = sumPartidos + (parseInt(inputBlancos.value) || 0) + (parseInt(inputNulos.value) || 0) + (parseInt(inputImpug.value) || 0);
            window.fijarVotantes(suma);
        });
    }
}

// Función global para fijar "Ciudadanos que Votaron" con 1 clic
window.fijarVotantes = function(n) {
    if (inputVotaron) {
        inputVotaron.value = n;
        inputVotaron.dispatchEvent(new Event('input'));
        inputVotaron.focus();
        mostrarToast(`✓ "Ciudadanos que Votaron" fijado en ${n}`, 'success');
    }
};

// Botones + y − para todos los inputs con data-target
function bindStepButtons() {
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
        // Mini animación
        btn.style.transform = 'scale(0.85)';
        setTimeout(() => { btn.style.transform = ''; }, 120);
    });
}

// Navegación entre tarjetas con ↑↓
function handleArrowKeys(e) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const all = [...document.querySelectorAll('.party-input, #votos_blancos, #votos_nulos, #votos_impugnados')];
    const idx = all.indexOf(this);
    if (e.key === 'ArrowDown' && idx < all.length - 1) { e.preventDefault(); all[idx+1].focus(); }
    if (e.key === 'ArrowUp'   && idx > 0)              { e.preventDefault(); all[idx-1].focus(); }
}

// Lookup/validación de mesa — se activa al completar el número
let mesaTimeout;
function bindMesaLookup() {
    inputMesa.addEventListener('input', () => {
        clearTimeout(mesaTimeout);
        const val = inputMesa.value.trim();

        // Resetear estado
        mesaValida = false;
        resetMesaState();
        inputElect.value = '';
        mesaChip.classList.remove('visible');
        validateMath();

        if (val.length === 0) return;

        if (val.length >= 4) {
            // Mostrar loading
            setMesaFeedback('loading', '\u23F3 Verificando mesa…');
            mesaTimeout = setTimeout(() => validarMesa(val), 700);
        }
    });

    // También validar al perder foco si hay valor
    inputMesa.addEventListener('blur', () => {
        const val = inputMesa.value.trim();
        if (val.length > 0 && !mesaValida) {
            clearTimeout(mesaTimeout);
            validarMesa(val);
        }
    });
}

async function validarMesa(nro) {
    const spinner = document.getElementById('mesaSpinner');
    spinner.style.display = 'inline';
    setMesaFeedback('loading', '\u23F3 Verificando en el padrón…');

    try {
        const res  = await fetch(`api/validar_mesa.php?id_mesa=${encodeURIComponent(nro)}`);
        const json = await res.json();

        spinner.style.display = 'none';

        if (json.success && json.data) {
            const m = json.data;
            mesaValida = true;

            // Rellenar electores habíliles automáticamente
            inputElect.value = m.electores_habiles;

            // Chip de éxito en el campo
            const partes = [m.distrito, m.provincia, m.departamento].filter(Boolean).join(' · ');
            setMesaFeedback('ok',
                `\u2713 Mesa ${m.id_mesa} — ${partes} · ${Number(m.electores_habiles).toLocaleString()} electores hábiles`);

            // Chip antiguo (debajo del grid)
            mesaChipText.textContent = `Mesa ${m.id_mesa} · ${partes} · ${Number(m.electores_habiles).toLocaleString()} electores`;
            mesaChip.classList.add('visible');

            // Foco al campo siguiente
            document.getElementById('total_votaron').focus();

        } else {
            mesaValida = false;
            inputElect.value = '';
            mesaChip.classList.remove('visible');

            const msg = json.message || `La mesa N° ${nro} no existe en el padrón.`;
            setMesaFeedback('err', `\u26A0\uFE0F ${msg}`);
        }

    } catch (e) {
        spinner.style.display = 'none';
        setMesaFeedback('err', '\u26A0\uFE0F Error de conexión al verificar la mesa.');
        mesaValida = false;
    }

    validateMath();
}

function setMesaFeedback(tipo, texto) {
    const fb  = document.getElementById('mesaFeedback');
    const inp = inputMesa;
    fb.className  = `mesa-feedback ${tipo}`;
    fb.textContent = texto;
    inp.classList.remove('mesa-ok', 'mesa-err');
    if (tipo === 'ok')  inp.classList.add('mesa-ok');
    if (tipo === 'err') inp.classList.add('mesa-err');
}

function resetMesaState() {
    const fb  = document.getElementById('mesaFeedback');
    fb.className  = 'mesa-feedback';
    fb.textContent = '';
    inputMesa.classList.remove('mesa-ok','mesa-err');
}

/* ════════════════════════════════════════════════════════════
   VALIDACIÓN ARITMÉTICA EN TIEMPO REAL
════════════════════════════════════════════════════════════ */
function validateMath() {
    const totalVotaron   = parseInt(inputVotaron.value)  || 0;
    const electoresHab   = parseInt(inputElect.value)    || 0;
    const blancos        = parseInt(inputBlancos.value)  || 0;
    const nulos          = parseInt(inputNulos.value)    || 0;
    const impugnados     = parseInt(inputImpug.value)    || 0;

    let sumPartidos = 0;
    document.querySelectorAll('.party-input').forEach(inp => {
        sumPartidos += parseInt(inp.value) || 0;
    });

    const sumaTotalVotos = sumPartidos + blancos + nulos + impugnados;
    sumVotosEl.textContent  = sumaTotalVotos.toLocaleString();
    txtVotantes.textContent = totalVotaron.toLocaleString();
    if (txtPadron) {
        txtPadron.textContent = electoresHab > 0 ? electoresHab.toLocaleString() : '—';
    }

    // Botón de autocompletado en Paso 1 (mostrar si hay votos sumados pero falta fijar votantes)
    if (btnAutoVotaron && btnAutoVotaronNum) {
        if (sumaTotalVotos > 0 && totalVotaron !== sumaTotalVotos) {
            btnAutoVotaron.style.display = 'inline-block';
            btnAutoVotaronNum.textContent = sumaTotalVotos.toLocaleString();
        } else {
            btnAutoVotaron.style.display = 'none';
        }
    }

    // Progreso de cuadre
    const baseProg = totalVotaron > 0 ? totalVotaron : (electoresHab > 0 ? electoresHab : 0);
    const pct = baseProg > 0
        ? Math.min(100, Math.round((sumaTotalVotos / baseProg) * 100))
        : 0;
    progressFill.style.width = pct + '%';

    // Actualizar indicador de steps
    updateSteps(sumaTotalVotos, totalVotaron);

    // Bloquear si la mesa no fue validada
    if (!mesaValida && inputMesa.value.trim().length > 0) {
        setVal('err', '⚠️', 'Primero debes ingresar un número de mesa válido del padrón.');
        btnSubmit.disabled = true;
        return;
    }

    // Estado neutro (nada ingresado aún)
    if (totalVotaron === 0 && sumaTotalVotos === 0) {
        setVal('neutral', '⏳', 'Esperando datos de la mesa y conteo de votos…');
        btnSubmit.disabled = true;
        return;
    }

    // CASO CLAVE: Se ingresaron votos (ej: 120), pero aún no se escribió "Ciudadanos que Votaron"
    // No decir "Hay 120 votos de más". Indicar amablemente que falta completar el campo o usar el botón con 1 clic.
    if (totalVotaron === 0 && sumaTotalVotos > 0) {
        const padronTxt = electoresHab > 0 ? ` de <strong>${electoresHab.toLocaleString()}</strong> electores hábiles (Padrón)` : '';
        setVal('info', 'ℹ️', `Votos sumados: <strong>${sumaTotalVotos.toLocaleString()}</strong>${padronTxt}. Falta ingresar "Ciudadanos que Votaron" en el Paso 1. <button type="button" class="btn-val-sync" onclick="window.fijarVotantes(${sumaTotalVotos})">⚡ Usar ${sumaTotalVotos.toLocaleString()} votantes</button>`);
        btnSubmit.disabled = true;
        return;
    }

    // Error: los votantes superan el padrón oficial
    if (electoresHab > 0 && totalVotaron > electoresHab) {
        setVal('err', '⚠️', `Los ciudadanos que votaron (${totalVotaron.toLocaleString()}) no pueden superar los electores del padrón (${electoresHab.toLocaleString()}).`);
        btnSubmit.disabled = true;
        return;
    }

    // Error: la suma de votos supera el padrón oficial
    if (electoresHab > 0 && sumaTotalVotos > electoresHab) {
        setVal('err', '⚠️', `La suma total de votos (${sumaTotalVotos.toLocaleString()}) excede el padrón total de la mesa (${electoresHab.toLocaleString()}).`);
        btnSubmit.disabled = true;
        return;
    }

    // Error: no cuadra la suma de votos con los ciudadanos que votaron
    if (sumaTotalVotos !== totalVotaron) {
        if (sumaTotalVotos < totalVotaron) {
            const diff = totalVotaron - sumaTotalVotos;
            setVal('err', '✗', `Faltan ${diff.toLocaleString()} votos por asignar en las listas para alcanzar los ${totalVotaron.toLocaleString()} ciudadanos que votaron.`);
        } else {
            const diff = sumaTotalVotos - totalVotaron;
            setVal('err', '✗', `La suma de votos (${sumaTotalVotos.toLocaleString()}) supera en ${diff.toLocaleString()} a los ${totalVotaron.toLocaleString()} ciudadanos que votaron.`);
        }
        btnSubmit.disabled = true;
        return;
    }

    // ¡Cuadra perfecto!
    const partPct = electoresHab > 0 ? Math.round((totalVotaron / electoresHab) * 100) : null;
    const partInfo = partPct !== null ? ` (${partPct}% de participación sobre ${electoresHab.toLocaleString()} electores)` : '';
    setVal('ok', '✓', `¡Cuadre aritmético perfecto! Votaron ${totalVotaron.toLocaleString()} ciudadanos${partInfo}. Acta lista para guardar.`);
    btnSubmit.disabled = false;
}

function setVal(state, icon, text) {
    valBox.className  = 'validation-box ' + (state === 'neutral' ? '' : state);
    valIcon.textContent = icon;
    valText.innerHTML   = text;
}

function updateSteps(sum, votaron) {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    const mesa = inputMesa.value.trim();
    if (mesa.length >= 4 && votaron > 0) {
        step1.classList.remove('active'); step1.classList.add('done');
        step2.classList.add('active');
    } else {
        step1.classList.add('active'); step1.classList.remove('done');
        step2.classList.remove('active');
    }
    if (sum > 0 && sum === votaron) {
        step2.classList.remove('active'); step2.classList.add('done');
        step3.classList.add('active');
    } else {
        step2.classList.remove('done');
        step3.classList.remove('active');
    }
}

/* ── Estilo visual de card con votos ── */
function updateCardState(inp) {
    const card = inp.closest('.party-card');
    if (!card) return;
    const v = parseInt(inp.value) || 0;
    card.classList.toggle('has-votes', v > 0);
}

/* ── Sanitizar input numérico ── */
function sanitizeInput(inp) {
    const v = parseInt(inp.value);
    if (isNaN(v) || v < 0) inp.value = 0;
}

/* ════════════════════════════════════════════════════════════
   SUBMIT — GUARDAR ACTA
════════════════════════════════════════════════════════════ */
async function handleSubmit(e) {
    e.preventDefault();

    // Doble chequeo de mesa válida
    if (!mesaValida) {
        mostrarToast('\u26A0\uFE0F Verifica el número de mesa antes de guardar', 'error');
        inputMesa.focus();
        return;
    }

    const btnOrig = btnSubmit.innerHTML;
    btnSubmit.disabled  = true;
    btnSubmit.innerHTML = '<span class="spinner"></span> Guardando…';

    const resultados = [];
    document.querySelectorAll('.party-input').forEach(inp => {
        resultados.push({
            id_partido: parseInt(inp.dataset.partido),
            votos:      parseInt(inp.value) || 0
        });
    });

    const payload = {
        id_mesa:          inputMesa.value.trim(),
        tipo_eleccion:    parseInt(inputTipoEl.value),
        electores_habiles: parseInt(inputElect.value)   || 0,
        total_votaron:    parseInt(inputVotaron.value)  || 0,
        votos_blancos:    parseInt(inputBlancos.value)  || 0,
        votos_nulos:      parseInt(inputNulos.value)    || 0,
        votos_impugnados: parseInt(inputImpug.value)    || 0,
        resultados
    };

    try {
        const response = await fetch('api/guardar_acta.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.success) {
            mostrarToast('✓ Acta guardada correctamente', 'success');
            setTimeout(() => {
                document.getElementById('actaForm').reset();
                // Resetear todos los inputs de partidos a 0
                document.querySelectorAll('.party-input, .vote-value').forEach(inp => {
                    inp.value = 0;
                    const card = inp.closest('.party-card');
                    if (card) card.classList.remove('has-votes');
                });
                mesaChip.classList.remove('visible');
                // Reset estado de mesa
                mesaValida = false;
                resetMesaState();
                inputElect.value = '';
                validateMath();
            }, 300);
        } else {
            mostrarToast('❌ ' + (data.message || 'Error al guardar'), 'error');
        }
    } catch (err) {
        mostrarToast('❌ No se pudo conectar con el servidor', 'error');
    } finally {
        btnSubmit.disabled  = false;
        btnSubmit.innerHTML = btnOrig;
    }
}

/* ════════════════════════════════════════════════════════════
   TOAST
════════════════════════════════════════════════════════════ */
function mostrarToast(msg, tipo = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.className = `toast ${tipo} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ── Utils ── */
function esc(str) {
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}
