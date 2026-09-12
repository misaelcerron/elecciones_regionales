document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mesaForm');
    const inputId = document.getElementById('id_mesa');
    const inputElectores = document.getElementById('electores_habiles');
    const tbody = document.getElementById('tablaMesas');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const searchInput = document.getElementById('searchInput');
    const mesaCount = document.getElementById('mesaCount');

    let todasLasMesas = [];

    cargarMesas();

    // ─── Formulario: Limpiar ───
    btnLimpiar.addEventListener('click', () => {
        form.reset();
        inputId.readOnly = false;
        btnGuardar.textContent = "Guardar Mesa";
        btnGuardar.style.background = '';
    });

    // ─── Formulario: Guardar / Actualizar ───
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";
        try {
            const res = await fetch('api/guardar_mesa.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_mesa: inputId.value, electores_habiles: inputElectores.value })
            });
            const data = await res.json();
            if (data.success) { alert(data.message); btnLimpiar.click(); cargarMesas(); }
            else { alert(`Error: ${data.message}`); }
        } catch (err) { alert(`Error de red: ${err.message}`); }
        finally { btnGuardar.disabled = false; btnGuardar.textContent = "Guardar Mesa"; }
    });

    // ─── Cargar Tabla ───
    async function cargarMesas() {
        try {
            const res = await fetch('api/get_mesas.php');
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            todasLasMesas = json.data;
            mesaCount.textContent = `Total: ${todasLasMesas.length} mesas`;
            renderTabla(todasLasMesas);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:#ef4444; text-align:center">Error: ${err.message}</td></tr>`;
        }
    }

    // ─── Buscador ───
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        const filtradas = todasLasMesas.filter(m =>
            m.id_mesa.includes(q) || m.distrito.toLowerCase().includes(q)
        );
        renderTabla(filtradas);
        mesaCount.textContent = `Mostrando: ${filtradas.length} / ${todasLasMesas.length}`;
    });

    // ─── Renderizar Tabla ───
    function renderTabla(data) {
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No hay mesas registradas.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.forEach(mesa => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:700; color:var(--primary-color); letter-spacing:0.5px;">${mesa.id_mesa}</td>
                <td>${mesa.distrito}</td>
                <td style="color:var(--text-muted); font-size:0.85rem;">${mesa.local}</td>
                <td>${mesa.electores_habiles}</td>
                <td>
                    <button class="btn-accion btn-editar" onclick="editarMesa('${mesa.id_mesa}', ${mesa.electores_habiles})">✏ Editar</button>
                    <button class="btn-accion btn-eliminar" onclick="eliminarMesa('${mesa.id_mesa}')">🗑 Eliminar</button>
                </td>`;
            tbody.appendChild(tr);
        });
    }

    // ─── Editar Mesa ───
    window.editarMesa = function(id, electores) {
        inputId.value = id;
        inputElectores.value = electores;
        inputId.readOnly = true;
        btnGuardar.textContent = "Actualizar Mesa";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ─── Eliminar Mesa ───
    window.eliminarMesa = async function(id) {
        if (!confirm(`¿Estás seguro de eliminar la Mesa N° ${id}?\nEsta acción no se puede deshacer.`)) return;
        try {
            const res = await fetch('api/eliminar_mesa.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_mesa: id })
            });
            const data = await res.json();
            if (data.success) { alert(data.message); cargarMesas(); }
            else { alert(`No se pudo eliminar: ${data.message}`); }
        } catch (err) { alert(`Error de red: ${err.message}`); }
    };

    // ─── Acordeón Importación ───
    const accordionHeader = document.getElementById('accordionHeader');
    const accordionBody = document.getElementById('accordionBody');
    const accordionIcon = document.getElementById('accordionIcon');

    accordionHeader.addEventListener('click', () => {
        accordionBody.classList.toggle('visible');
        accordionIcon.classList.toggle('open');
    });

    // ─── Plantilla Excel ───
    document.getElementById('btnDescargarPlantilla').addEventListener('click', () => {
        const wb = XLSX.utils.book_new();
        const datos = [
            ['N°', 'ODPE', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO', 'CENTRO POBLADO', 'MESA DE SUFRAGIO N°'],
            [1, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'CHACAYAN', '', '068426'],
            [2, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'CHACAYAN', '', '068427'],
            [3, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'CHACAYAN', '', '068428'],
            [4, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'CHACAYAN', 'CHANGO', '903878'],
            [5, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'GOLLLARISQUIZGA', '', '068434'],
            [6, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'PAUCAR', '', '068437'],
        ];
        const ws = XLSX.utils.aoa_to_sheet(datos);
        ws['!cols'] = [{ wch: 5 }, { wch: 8 }, { wch: 14 }, { wch: 24 }, { wch: 22 }, { wch: 18 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, ws, 'MESAS');
        XLSX.writeFile(wb, 'Plantilla_Mesas_ODPE_Pasco.xlsx');
    });

    // ─── Drag & Drop + File Input ───
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');

    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files[0]) procesarExcel(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) procesarExcel(fileInput.files[0]); });

    async function procesarExcel(file) {
        mostrarResultado('', '');
        const progressBar = document.getElementById('importProgress');
        const progressFill = document.getElementById('progressFill');
        progressBar.style.display = 'block';
        progressFill.style.width = '30%';

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                progressFill.style.width = '60%';
                const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

                if (rows.length < 2) { mostrarResultado('error', 'Archivo sin datos válidos.'); return; }

                const mesas = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const id_mesa = String(row[6] ?? '').trim().padStart(6, '0');
                    if (!id_mesa || id_mesa === '000000') continue;
                    mesas.push({
                        departamento: String(row[2] ?? 'PASCO').trim(),
                        provincia: String(row[3] ?? '').trim(),
                        distrito: String(row[4] ?? '').trim(),
                        centro_poblado: String(row[5] ?? '').trim(),
                        id_mesa,
                        electores_habiles: 0
                    });
                }

                progressFill.style.width = '80%';
                if (mesas.length === 0) { mostrarResultado('error', 'No se encontraron mesas válidas.'); return; }

                const res = await fetch('api/importar_mesas.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mesas }) });
                const result = await res.json();
                progressFill.style.width = '100%';

                if (result.success) {
                    let msg = `✅ ${result.message}`;
                    if (result.errores?.length > 0) msg += `<br><small style="color:#fbbf24;">⚠️ ${result.errores.join('<br>')}</small>`;
                    mostrarResultado('success', msg);
                    cargarMesas();
                    fileInput.value = '';
                } else { mostrarResultado('error', `❌ ${result.message}`); }
            } catch (err) { mostrarResultado('error', `Error: ${err.message}`); }
            finally { setTimeout(() => progressBar.style.display = 'none', 1500); }
        };
        reader.readAsArrayBuffer(file);
    }

    function mostrarResultado(tipo, mensaje) {
        const el = document.getElementById('importResult');
        el.style.display = mensaje ? 'block' : 'none';
        el.className = `import-result ${tipo}`;
        el.innerHTML = mensaje;
    }
});
