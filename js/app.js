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
let lockedTabs  = []; // Array de tipos de elección bloqueados 

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
    bindLimpiarProceso();
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
    const cont1 = document.getElementById('partidosContainer_1');
    const cont2 = document.getElementById('partidosContainer_2');
    
    if (!orgsData || orgsData.length === 0) {
        if (cont1) cont1.innerHTML = '<tr><td colspan="3">No hay organizaciones</td></tr>';
        if (cont2) cont2.innerHTML = '<tr><td colspan="3">No hay organizaciones</td></tr>';
    } else {
        if (cont1) cont1.innerHTML = orgsData.map((org, i) => buildPartidoRow(org, i, 1, 2)).join('');
        if (cont2) cont2.innerHTML = orgsData.map((org, i) => buildPartidoRow(org, i, 3, 4)).join('');
    }
    bindInputsEscuchadores();
}

function buildPartidoRow(org, idx, tabA, tabB) {
    const logoHtml = org.simbolo_url
        ? `<img src="${esc(org.simbolo_url)}" alt="${esc(org.nombre)}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 6px; background: rgba(255,255,255,0.1);" onerror="this.parentElement.innerHTML='<span class=\\'party-logo-placeholder\\'>🏛</span>'">`
        : `<span class="party-logo-placeholder" style="font-size: 1.5rem;">🏛</span>`;

    return `
    <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
        <td style="padding: 0.5rem 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${logoHtml}</div>
                <div style="font-size: 0.9rem; font-weight: 700; color: var(--text);">${esc(org.nombre)}</div>
            </div>
        </td>
        <td style="padding: 0.5rem; border-left: 1px solid var(--border); text-align: center; vertical-align: middle;">
            <input type="number" class="vote-value party-input" id="voto_${tabA}_${org.id_partido}" data-partido="${org.id_partido}" data-tab="${tabA}" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none; padding: 0.5rem;">
        </td>
        <td style="padding: 0.5rem; border-left: 1px solid var(--border); text-align: center; vertical-align: middle;">
            <input type="number" class="vote-value party-input" id="voto_${tabB}_${org.id_partido}" data-partido="${org.id_partido}" data-tab="${tabB}" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none; padding: 0.5rem;">
        </td>
    </tr>`;
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

    const inpElectores = document.getElementById('electores_habiles');
    if (inpElectores) {
        inpElectores.addEventListener('input', () => { sanitizeInput(inpElectores); validateMath(); });
        inpElectores.addEventListener('focus', function() { this.select(); });
    }

    document.querySelectorAll('.btnAutoVotaron').forEach(btn => {
        btn.addEventListener('click', () => {
            const t = btn.dataset.target;
            fijarVotantes(t);
        });
    });

    // Sincronizar campos de total votaron
    document.getElementById('total_votaron_1')?.addEventListener('input', function() {
        const p = document.getElementById('total_votaron_2');
        if (p) p.value = this.value;
    });
    document.getElementById('total_votaron_3')?.addEventListener('input', function() {
        const p = document.getElementById('total_votaron_4');
        if (p) p.value = this.value;
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
        
        let pair = (t == 1) ? 2 : (t == 3 ? 4 : null);
        if (pair) {
            const pInp = document.getElementById('total_votaron_' + pair);
            if (pInp) {
                pInp.value = n;
                pInp.dispatchEvent(new Event('input'));
            }
        }
        
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
            inputElect.value = m.electores_habiles > 0 ? m.electores_habiles : '';

            // Build location string
            const distParts = [m.distrito, m.provincia, m.departamento].filter(Boolean);
            const distLabel = distParts.length > 0 ? distParts[0] : '';
            const localLabel = m.local_votacion ? ` · ${m.local_votacion}` : '';
            const distritoTag = distLabel ? ` · 📍 ${distLabel}${localLabel}` : '';

            setMesaFeedback('ok', `✓ Mesa ${m.id_mesa} — ${Number(m.electores_habiles).toLocaleString()} electores${distritoTag}`);
            escrutinioSection.style.display = 'block';
            validacionSection.style.display = 'block';

            // Personero UI
            const pBox = document.getElementById('personeroBox');
            if (m.personero_nombre) {
                document.getElementById('personeroTipoLabel').textContent = m.personero_tipo || 'Titular';
                document.getElementById('personeroNombreLabel').textContent = m.personero_nombre;
                document.getElementById('personeroDniLabel').textContent = m.personero_dni;
                document.getElementById('personeroCelLabel').textContent = m.personero_celular || 'No registrado';
                pBox.style.display = 'block';
            } else {
                pBox.style.display = 'none';
            }

            // Bloquear pestañas ya registradas
            lockedTabs = m.actas_registradas || [];
            const alertLockContainer = document.getElementById('alertLockContainer');
            if (lockedTabs.length > 0) {
                const nombresBloqueados = lockedTabs.map(t => nombresEleccion[t]).join(', ');
                document.getElementById('alertLockText').innerHTML = `Ya existen datos guardados en el servidor para: <strong style="color:white;font-weight:900;">${nombresBloqueados}</strong>.<br>Hemos bloqueado temporalmente esas pestañas por seguridad. Si necesitas corregirlas, desplázate hasta abajo a la caja verde de "Verificación Consolidada" y haz clic en el botón <strong style="color:#ff9f0a;background:rgba(255,159,10,0.15);padding:1px 6px;border-radius:4px;border:0.5px solid rgba(255,159,10,0.5);">Editar</strong>.`;
                alertLockContainer.style.display = 'flex';
            } else {
                alertLockContainer.style.display = 'none';
            }

            for (let t = 1; t <= 4; t++) {
                const tabBtn = document.querySelector(`.tab-btn[data-tab="${t}"]`);
                const tabContent = document.getElementById(`tab-content-${t}`);
                if (!tabBtn || !tabContent) continue;
                
                // Reiniciar estado visual
                tabBtn.style.opacity = '1';
                const lockIcon = tabBtn.querySelector('.lock-icon');
                if (lockIcon) lockIcon.remove();
                
                const isLocked = lockedTabs.includes(t);
                
                if (isLocked && m.actas_data && m.actas_data[t]) {
                    const d = m.actas_data[t];
                    document.getElementById(`total_votaron_${t}`).value = d.total_votaron;
                    document.getElementById(`votos_blancos_${t}`).value = d.votos_blancos;
                    document.getElementById(`votos_nulos_${t}`).value = d.votos_nulos;
                    document.getElementById(`votos_impugnados_${t}`).value = d.votos_impugnados;
                    
                    if (d.resultados) {
                        for (const [id_partido, votos] of Object.entries(d.resultados)) {
                            const inp = document.getElementById(`voto_${t}_${id_partido}`);
                            if (inp) {
                                inp.value = votos;
                                updateCardState(inp);
                            }
                        }
                    }
                }
                
                // Bloquear inputs
                tabContent.querySelectorAll('input, button').forEach(el => {
                    el.disabled = isLocked;
                });
                
                if (isLocked) {
                    tabBtn.innerHTML += ' <span class="lock-icon" style="font-size:0.75rem;">🔒</span>';
                    tabBtn.style.opacity = '0.7';
                }
            }

            // Asegurar que la primera pestaña activa no esté bloqueada, si es posible
            const firstUnlocked = [1,2,3,4].find(t => !lockedTabs.includes(t)) || 1;
            document.querySelector(`.tab-btn[data-tab="${firstUnlocked}"]`)?.click();

            validateMath();
        } else {
            mesaValida = false;
            document.getElementById('personeroBox').style.display = 'none';
            setMesaFeedback('err', `⚠️ ${json.message || 'Mesa no existe'}`);
        }
    } catch (e) {
        mesaValida = false;
        document.getElementById('personeroBox').style.display = 'none';
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
    const pBox = document.getElementById('personeroBox');
    if(pBox) pBox.style.display = 'none';
    const alertLock = document.getElementById('alertLockContainer');
    if(alertLock) alertLock.style.display = 'none';

    // Limpiar todos los campos de votos
    document.querySelectorAll('.party-input, .other-input').forEach(inp => {
        inp.value = 0;
        updateCardState(inp);
    });
    document.querySelectorAll('.total-votaron-input').forEach(inp => {
        inp.value = '';
    });
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

        if (lockedTabs.includes(t)) {
            setValBox(t, 'ok', '🔒', `Registrada <button type="button" onclick="window.unlockTab(${t})" style="cursor:pointer;font-size:0.75rem;padding:2px 8px;margin-left:10px;border:1px solid rgba(255,159,10,0.6);border-radius:12px;background:rgba(255,159,10,0.15);color:#ff9f0a;font-weight:700;">Editar</button>`);
            continue;
        }

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
    
    // Si las 4 están bloqueadas, no se puede enviar nada
    if (lockedTabs.length === 4) {
        allOk = false;
        btnSubmit.innerHTML = 'Mesa Completada 🔒';
    } else {
        btnSubmit.innerHTML = 'Guardar Actas Verificadas';
    }

    btnSubmit.disabled = !allOk;
}

function setValBox(t, state, icon, text) {
    const box = document.getElementById(`valBox_${t}`);
    box.className = 'validation-box ' + (state === 'neutral' ? '' : state);
    document.getElementById(`valIcon_${t}`).textContent = icon;
    document.getElementById(`valText_${t}`).innerHTML = text;
}

window.unlockTab = function(t) {
    // Eliminar de lockedTabs
    lockedTabs = lockedTabs.filter(x => x !== t);
    
    // Desbloquear UI
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${t}"]`);
    const tabContent = document.getElementById(`tab-content-${t}`);
    
    if (tabBtn) {
        tabBtn.style.opacity = '1';
        const lockIcon = tabBtn.querySelector('.lock-icon');
        if (lockIcon) lockIcon.remove();
    }
    
    if (tabContent) {
        tabContent.querySelectorAll('input, button').forEach(el => {
            el.disabled = false;
        });
    }
    
    // Forzar foco a la pestaña
    if (tabBtn) tabBtn.click();
    
    // Recalcular
    validateMath();
    mostrarToast(`✏️ Modo edición habilitado para ${nombresEleccion[t]}`, 'warning');
};

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
        if (lockedTabs.includes(t)) continue; // Omitir las que ya están en DB

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

/* ════════════════════════════════════════════════════════════
   LIMPIEZA DE PROCESO (SOLO ADMIN)
════════════════════════════════════════════════════════════ */
function bindLimpiarProceso() {
    const btnLimpiar = document.getElementById('btnLimpiarProceso');
    if (!btnLimpiar) return;
    
    btnLimpiar.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const confirmacion = prompt("⚠️ ZONA DE PELIGRO\n\nEsta acción eliminará de forma irreversible TODAS las actas y votos registrados hasta el momento.\n\nPara confirmar, escribe la palabra CONFIRMAR en mayúsculas:");
        if (confirmacion !== 'CONFIRMAR') {
            if (confirmacion !== null) alert("Operación cancelada. Palabra incorrecta.");
            return;
        }

        if (!confirm("¿Estás absolutamente seguro de empezar un nuevo escrutinio desde cero?")) return;

        btnLimpiar.disabled = true;
        btnLimpiar.innerHTML = 'Limpiando...';

        try {
            const res = await fetch('api/limpiar_proceso.php', { method: 'POST' });
            
            // Verificamos primero el texto crudo para evitar fallos si no es JSON
            const textResponse = await res.text();
            
            let json;
            try {
                json = JSON.parse(textResponse);
            } catch (parseError) {
                console.error("Respuesta cruda del servidor:", textResponse);
                alert("❌ Respuesta inválida del servidor:\n" + textResponse.substring(0, 200));
                return;
            }

            if (json.success) {
                alert("✅ Proceso electoral limpiado correctamente.");
                window.location.reload();
            } else {
                alert("❌ Error: " + (json.message || "No se pudo limpiar."));
            }
        } catch (e) {
            alert("❌ Error de red: " + e.message);
        } finally {
            btnLimpiar.disabled = false;
            btnLimpiar.innerHTML = 'Limpiar Proceso Electoral';
        }
    });
}
