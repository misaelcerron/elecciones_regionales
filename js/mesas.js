document.addEventListener('DOMContentLoaded', () => {
    let todasLasMesas = [];
    let archivoExcel = null;

    cargarMesas();

    // ══════════════════════════════════════
    //  CARGAR Y RENDERIZAR TABLA
    // ══════════════════════════════════════
    async function cargarMesas() {
        const tbody = document.getElementById('tablaMesas');
        try {
            const res = await fetch('api/get_mesas.php');
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            todasLasMesas = json.data;
            document.getElementById('mesaCount').textContent = `Total: ${todasLasMesas.length} mesas`;
            renderTabla(todasLasMesas);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" style="color:#ef4444;text-align:center;">Error: ${err.message}</td></tr>`;
        }
    }

    function renderTabla(data) {
        const tbody = document.getElementById('tablaMesas');
        if (!data.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">No hay mesas registradas.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:700;color:#60a5fa;">${m.id_mesa}</td>
                <td style="font-size:0.83rem;">${m.departamento}</td>
                <td style="font-size:0.83rem;">${m.provincia}</td>
                <td>${m.distrito}</td>
                <td style="color:var(--text-muted);font-size:0.83rem;">${m.centro_poblado || '—'}</td>
                <td>${m.electores_habiles}</td>
                <td style="white-space:nowrap;">
                    <button class="btn-accion btn-editar" onclick='abrirModalEditar(${JSON.stringify(m)})'>✏ Editar</button>
                    <button class="btn-accion btn-eliminar" onclick="eliminarMesa('${m.id_mesa}')">🗑</button>
                </td>`;
            tbody.appendChild(tr);
        });
    }

    // Buscador
    document.getElementById('searchInput').addEventListener('input', function() {
        const q = this.value.toLowerCase();
        const fil = todasLasMesas.filter(m =>
            m.id_mesa.includes(q) ||
            m.distrito.toLowerCase().includes(q) ||
            m.provincia.toLowerCase().includes(q)
        );
        document.getElementById('mesaCount').textContent = `Mostrando: ${fil.length} / ${todasLasMesas.length}`;
        renderTabla(fil);
    });

    // ══════════════════════════════════════
    //  MODAL CREAR / EDITAR
    // ══════════════════════════════════════
    window.abrirModalNueva = function() {
        document.getElementById('modalTitulo').textContent = '➕ Nueva Mesa';
        document.getElementById('idMesaOriginal').value = '';
        document.getElementById('mId').value = '';
        document.getElementById('mId').readOnly = false;
        document.getElementById('mDepartamento').value = 'PASCO';
        document.getElementById('mProvincia').value = '';
        document.getElementById('mDistrito').value = '';
        document.getElementById('mCentroPoblado').value = '';
        document.getElementById('mElectores').value = '';
        document.getElementById('modalMesa').classList.add('visible');
    };

    window.abrirModalEditar = function(mesa) {
        document.getElementById('modalTitulo').textContent = '✏️ Editar Mesa ' + mesa.id_mesa;
        document.getElementById('idMesaOriginal').value = mesa.id_mesa;
        document.getElementById('mId').value = mesa.id_mesa;
        document.getElementById('mId').readOnly = false;
        document.getElementById('mDepartamento').value = mesa.departamento || 'PASCO';
        document.getElementById('mProvincia').value = mesa.provincia || '';
        document.getElementById('mDistrito').value = mesa.distrito || '';
        document.getElementById('mCentroPoblado').value = mesa.centro_poblado || '';
        document.getElementById('mElectores').value = mesa.electores_habiles;
        document.getElementById('modalMesa').classList.add('visible');
    };

    window.cerrarModalMesa = function() {
        document.getElementById('modalMesa').classList.remove('visible');
    };

    // Cerrar modal al hacer click fuera
    document.getElementById('modalMesa').addEventListener('click', function(e) {
        if (e.target === this) cerrarModalMesa();
    });

    window.guardarDesdeModal = async function() {
        const btn = document.getElementById('btnGuardarModal');
        const payload = {
            id_mesa_original: document.getElementById('idMesaOriginal').value || document.getElementById('mId').value,
            id_mesa: document.getElementById('mId').value.trim(),
            departamento: document.getElementById('mDepartamento').value.trim(),
            provincia: document.getElementById('mProvincia').value.trim(),
            distrito: document.getElementById('mDistrito').value.trim(),
            centro_poblado: document.getElementById('mCentroPoblado').value.trim(),
            electores_habiles: parseInt(document.getElementById('mElectores').value) || 0
        };

        if (!payload.id_mesa) { alert('El N° de mesa es obligatorio.'); return; }

        btn.disabled = true;
        btn.textContent = 'Guardando...';
        try {
            const res = await fetch('api/guardar_mesa.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                cerrarModalMesa();
                cargarMesas();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (err) {
            alert('Error de red: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = '💾 Guardar';
        }
    };

    // ══════════════════════════════════════
    //  ELIMINAR MESA INDIVIDUAL
    // ══════════════════════════════════════
    window.eliminarMesa = async function(id) {
        if (!confirm(`¿Eliminar la Mesa N° ${id}?`)) return;
        try {
            const res = await fetch('api/eliminar_mesa.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_mesa: id })
            });
            const data = await res.json();
            alert(data.message);
            if (data.success) cargarMesas();
        } catch (err) { alert('Error: ' + err.message); }
    };

    // ══════════════════════════════════════
    //  ELIMINAR TODAS LAS MESAS (modal)
    // ══════════════════════════════════════
    window.abrirModalEliminarTodo = function() {
        document.getElementById('modalEliminarTodo').classList.add('visible');
        const btn = document.getElementById('btnConfirmarEliminar');
        const btnNuevo = btn.cloneNode(true);
        btn.parentNode.replaceChild(btnNuevo, btn);
        btnNuevo.addEventListener('click', async function() {
            document.getElementById('modalEliminarTodo').classList.remove('visible');
            btnNuevo.disabled = true;
            try {
                const res = await fetch('api/eliminar_todas_mesas.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ confirmar: true })
                });
                const data = await res.json();
                alert((data.success ? '✅ ' : '❌ ') + data.message);
                if (data.success) cargarMesas();
            } catch (err) { alert('❌ Error: ' + err.message); }
        });
    };

    document.getElementById('modalEliminarTodo').addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('visible');
    });

    // ══════════════════════════════════════
    //  IMPORTACIÓN EXCEL
    // ══════════════════════════════════════
    const fileInput = document.getElementById('fileInput');
    const fileNameEl = document.getElementById('fileName');
    const btnImportar = document.getElementById('btnImportar');
    const feedback = document.getElementById('importFeedback');

    fileInput.addEventListener('change', () => {
        archivoExcel = fileInput.files[0] || null;
        fileNameEl.textContent = archivoExcel ? archivoExcel.name : 'Ningún archivo seleccionado';
        btnImportar.disabled = !archivoExcel;
    });

    document.getElementById('btnDescargarPlantilla').addEventListener('click', () => {
        const wb = XLSX.utils.book_new();
        const datos = [
            ['N°','ODPE','DEPARTAMENTO','PROVINCIA','DISTRITO','CENTRO POBLADO','MESA DE SUFRAGIO N°'],
            [1,'PASCO','PASCO','DANIEL ALCIDES CARRION','CHACAYAN','','068426'],
            [2,'PASCO','PASCO','DANIEL ALCIDES CARRION','CHACAYAN','','068427'],
            [3,'PASCO','PASCO','DANIEL ALCIDES CARRION','CHACAYAN','CHANGO','903878'],
            [4,'PASCO','PASCO','DANIEL ALCIDES CARRION','GOLLLARISQUIZGA','','068434'],
            [5,'PASCO','PASCO','DANIEL ALCIDES CARRION','PAUCAR','','068437'],
        ];
        const ws = XLSX.utils.aoa_to_sheet(datos);
        ws['!cols'] = [{wch:5},{wch:8},{wch:14},{wch:24},{wch:22},{wch:18},{wch:22}];
        XLSX.utils.book_append_sheet(wb, ws, 'MESAS');
        XLSX.writeFile(wb, 'Plantilla_Mesas_ODPE_Pasco.xlsx');
    });

    btnImportar.addEventListener('click', () => { if (archivoExcel) procesarExcel(archivoExcel); });

    async function procesarExcel(file) {
        btnImportar.disabled = true;
        btnImportar.textContent = '⏳...';
        mostrarFeedback('', '');
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1, defval:'' });
                if (rows.length < 2) { mostrarFeedback('err', 'Archivo sin datos.'); return; }
                const mesas = [];
                for (let i = 1; i < rows.length; i++) {
                    const r = rows[i];
                    const id = String(r[6] ?? '').trim();
                    if (!id) continue;
                    mesas.push({ departamento: String(r[2]||'PASCO').trim(), provincia: String(r[3]||'').trim(), distrito: String(r[4]||'').trim(), centro_poblado: String(r[5]||'').trim(), id_mesa: id.padStart(6,'0'), electores_habiles: 0 });
                }
                if (!mesas.length) { mostrarFeedback('err', 'No se encontraron mesas.'); return; }
                const res = await fetch('api/importar_mesas.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mesas }) });
                const result = await res.json();
                if (result.success) {
                    mostrarFeedback('ok', '✅ ' + result.message);
                    cargarMesas();
                    fileInput.value = '';
                    fileNameEl.textContent = 'Ningún archivo seleccionado';
                    archivoExcel = null;
                } else { mostrarFeedback('err', '❌ ' + result.message); }
            } catch (err) { mostrarFeedback('err', 'Error: ' + err.message); }
            finally { btnImportar.disabled = true; btnImportar.textContent = '⬆ Importar'; }
        };
        reader.readAsArrayBuffer(file);
    }

    function mostrarFeedback(tipo, msg) {
        const el = feedback;
        el.style.display = msg ? 'inline-block' : 'none';
        el.className = 'import-feedback ' + tipo;
        el.textContent = msg;
    }
});
