/* ═══════════════════════════════════════════════════════════════
   js/organizaciones.js — Módulo de Organizaciones Políticas
   ODPE PASCO · Sistema Electoral
═══════════════════════════════════════════════════════════════ */

'use strict';

const API = 'api/organizaciones.php';

// ─── Estado ──────────────────────────────────────────────────
let orgsData   = [];
let filtroTexto = '';
let logoFile   = null;   // File seleccionado para subir

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarOrgs();
    initSearchInput();
    initDropZone();
});

// ─── Cargar organizaciones ────────────────────────────────────
async function cargarOrgs() {
    try {
        const res = await fetch(API + '?action=list');
        const json = await res.json();
        if (json.success) {
            orgsData = json.data || [];
            renderGrid();
        } else {
            mostrarError('Error al cargar organizaciones: ' + (json.message || ''));
        }
    } catch (e) {
        mostrarError('No se pudo conectar con el servidor.');
    }
}

// ─── Renderizar grid ──────────────────────────────────────────
function renderGrid() {
    const grid  = document.getElementById('orgsGrid');
    const count = document.getElementById('orgCount');

    const lista = filtroTexto
        ? orgsData.filter(o =>
            o.nombre.toLowerCase().includes(filtroTexto) ||
            (o.siglas || '').toLowerCase().includes(filtroTexto)
          )
        : orgsData;

    count.textContent = lista.length === 1
        ? '1 organización'
        : `${lista.length} organizaciones`;

    if (lista.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🏛</span>
                <p class="empty-title">${filtroTexto ? 'Sin resultados' : 'Sin organizaciones aún'}</p>
                <p class="empty-desc">${filtroTexto ? 'Prueba con otro término de búsqueda.' : 'Agrega la primera organización política con el botón de arriba.'}</p>
            </div>`;
        return;
    }

    grid.innerHTML = lista.map((org, i) => renderCard(org, i)).join('');
}

function renderCard(org, delay) {
    const logoHtml = org.simbolo_url
        ? `<img src="${escHTML(org.simbolo_url)}" alt="${escHTML(org.nombre)}" onerror="this.parentElement.innerHTML='<span class=\\'org-logo-placeholder\\'>🏛</span>'">`
        : `<span class="org-logo-placeholder">🏛</span>`;

    const statusHtml = org.simbolo_url
        ? `<span class="org-logo-status has-logo">✓ Con logo</span>`
        : `<span class="org-logo-status">Sin logo</span>`;

    const siglasHtml = org.siglas
        ? `<div class="org-siglas">${escHTML(org.siglas)}</div>`
        : '';

    return `
        <div class="org-card" style="animation-delay:${delay * 0.05}s">
            <div class="org-logo-wrap">${logoHtml}</div>
            <div class="org-info">
                <div class="org-id"># ${org.id_partido}</div>
                <div class="org-name" title="${escHTML(org.nombre)}">${escHTML(org.nombre)}</div>
                ${siglasHtml}
                ${statusHtml}
            </div>
            <div class="org-actions">
                <button class="btn-icon" onclick="abrirModalEditar(${org.id_partido})">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar
                </button>
                <button class="btn-icon danger" onclick="abrirModalEliminar(${org.id_partido}, '${escAttr(org.nombre)}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                    </svg>
                    Eliminar
                </button>
            </div>
        </div>`;
}

// ─── Búsqueda ─────────────────────────────────────────────────
function initSearchInput() {
    const inp = document.getElementById('searchInput');
    inp.addEventListener('input', () => {
        filtroTexto = inp.value.trim().toLowerCase();
        renderGrid();
    });
}

function filtrarOrgs(val) {
    filtroTexto = val.trim().toLowerCase();
    renderGrid();
}

// ─── DROP ZONE ────────────────────────────────────────────────
function initDropZone() {
    const zone  = document.getElementById('logoDropZone');
    const input = document.getElementById('logoFileInput');

    // Click en zona abre el file picker
    zone.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-remove-logo')) input.click();
    });

    input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) procesarArchivo(e.target.files[0]);
    });

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) procesarArchivo(file);
    });

    document.getElementById('btnRemoveLogo').addEventListener('click', (e) => {
        e.stopPropagation();
        quitarLogo();
    });
}

function procesarArchivo(file) {
    const maxMB = 2;
    if (!file.type.startsWith('image/')) {
        mostrarToast('❌ Solo se permiten imágenes', 'error');
        return;
    }
    if (file.size > maxMB * 1024 * 1024) {
        mostrarToast(`❌ El archivo supera los ${maxMB} MB`, 'error');
        return;
    }

    logoFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
        document.getElementById('logoPreviewImg').src = ev.target.result;
        document.getElementById('logoPreviewName').textContent = file.name;
        document.getElementById('logoPreviewSize').textContent = formatBytes(file.size);
        document.getElementById('logoPreviewContainer').classList.add('visible');
        document.getElementById('logoUploadHint').style.display = 'none';
        // Hide the file input overlay so clicks hit the button
        document.getElementById('logoFileInput').style.pointerEvents = 'none';
    };
    reader.readAsDataURL(file);
}

function quitarLogo() {
    logoFile = null;
    document.getElementById('logoPreviewContainer').classList.remove('visible');
    document.getElementById('logoUploadHint').style.display = '';
    document.getElementById('logoFileInput').value = '';
    document.getElementById('logoFileInput').style.pointerEvents = '';
}

// ─── MODAL Crear ──────────────────────────────────────────────
function abrirModalNueva() {
    resetModal();
    document.getElementById('modalTitle').textContent = 'Nueva organización';
    document.getElementById('modalOrg').classList.add('open');
    setTimeout(() => document.getElementById('fieldNombre').focus(), 300);
}

// ─── MODAL Editar ─────────────────────────────────────────────
function abrirModalEditar(id) {
    const org = orgsData.find(o => o.id_partido == id);
    if (!org) return;

    resetModal();
    document.getElementById('modalTitle').textContent = 'Editar organización';
    document.getElementById('fieldId').value    = org.id_partido;
    document.getElementById('fieldNombre').value = org.nombre;
    document.getElementById('fieldSiglas').value = org.siglas || '';

    if (org.simbolo_url) {
        const row   = document.getElementById('currentLogoRow');
        const thumb = document.getElementById('currentLogoThumb');
        thumb.src = org.simbolo_url;
        row.classList.add('visible');
    }

    document.getElementById('modalOrg').classList.add('open');
    setTimeout(() => document.getElementById('fieldNombre').focus(), 300);
}

function resetModal() {
    document.getElementById('fieldId').value      = '';
    document.getElementById('fieldNombre').value  = '';
    document.getElementById('fieldSiglas').value  = '';
    document.getElementById('currentLogoRow').classList.remove('visible');
    document.getElementById('currentLogoThumb').src = '';
    document.getElementById('btnGuardar').disabled  = false;
    quitarLogo();
}

function cerrarModal() {
    document.getElementById('modalOrg').classList.remove('open');
}

// Cerrar si se hace click en el overlay (fondo)
document.getElementById('modalOrg').addEventListener('click', function(e) {
    if (e.target === this) cerrarModal();
});

// ─── GUARDAR ──────────────────────────────────────────────────
async function guardarOrganizacion() {
    const id     = document.getElementById('fieldId').value.trim();
    const nombre = document.getElementById('fieldNombre').value.trim();
    const siglas = document.getElementById('fieldSiglas').value.trim();

    if (!nombre) {
        document.getElementById('fieldNombre').focus();
        mostrarToast('⚠️ El nombre es obligatorio', 'error');
        return;
    }

    const btn = document.getElementById('btnGuardar');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Guardando…';

    try {
        const formData = new FormData();
        formData.append('action', id ? 'update' : 'create');
        if (id) formData.append('id', id);
        formData.append('nombre', nombre);
        formData.append('siglas', siglas);
        if (logoFile) formData.append('logo', logoFile);

        const res  = await fetch(API, { method: 'POST', body: formData });
        const json = await res.json();

        if (json.success) {
            mostrarToast(id ? '✓ Organización actualizada' : '✓ Organización creada', 'success');
            cerrarModal();
            await cargarOrgs();
        } else {
            mostrarToast('❌ ' + (json.message || 'Error al guardar'), 'error');
        }
    } catch (e) {
        mostrarToast('❌ Error de conexión', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
            </svg>
            Guardar`;
    }
}

// ─── MODAL Eliminar ───────────────────────────────────────────
function abrirModalEliminar(id, nombre) {
    document.getElementById('deleteId').value   = id;
    document.getElementById('deleteDesc').innerHTML =
        `¿Eliminar <strong style="color:#f5f5f7">${escHTML(nombre)}</strong>?
         Esta acción <strong>no se puede deshacer</strong>.`;
    document.getElementById('modalDelete').classList.add('open');
}

function cerrarDeleteModal() {
    document.getElementById('modalDelete').classList.remove('open');
}

document.getElementById('modalDelete').addEventListener('click', function(e) {
    if (e.target === this) cerrarDeleteModal();
});

async function confirmarEliminar() {
    const id  = document.getElementById('deleteId').value;
    const btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
        const fd = new FormData();
        fd.append('action', 'delete');
        fd.append('id', id);

        const res  = await fetch(API, { method: 'POST', body: fd });
        const json = await res.json();

        if (json.success) {
            mostrarToast('✓ Organización eliminada', 'success');
            cerrarDeleteModal();
            await cargarOrgs();
        } else {
            mostrarToast('❌ ' + (json.message || 'Error al eliminar'), 'error');
        }
    } catch (e) {
        mostrarToast('❌ Error de conexión', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Eliminar';
    }
}

// ─── TOAST ────────────────────────────────────────────────────
let toastTimeout;
function mostrarToast(msg, tipo = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.className = `toast ${tipo} show`;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3200);
}

function mostrarError(msg) {
    mostrarToast('❌ ' + msg, 'error');
}

// ─── UTILS ────────────────────────────────────────────────────
function escHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escAttr(str) {
    return String(str).replace(/'/g, "\\'");
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}
