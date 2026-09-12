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
    let archivoExcel = null;

    cargarMesas();

    // ─── Limpiar formulario ───
    btnLimpiar.addEventListener('click', () => {
        form.reset();
        inputId.readOnly = false;
        btnGuardar.textContent = "Guardar Mesa";
    });

    // ─── Guardar / Actualizar Mesa ───
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
        } catch (err) { alert(`Error: ${err.message}`); }
        finally { btnGuardar.disabled = false; btnGuardar.textContent = "Guardar Mesa"; }
    });

    // ─── Cargar tabla de mesas ───
    async function cargarMesas() {
        try {
            const res = await fetch('api/get_mesas.php');
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            todasLasMesas = json.data;
            mesaCount.textContent = `Total: ${todasLasMesas.length} mesas`;
            renderTabla(todasLasMesas);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:#ef4444; text-align:center;">Error: ${err.message}</td></tr>`;
        }
    }

    // ─── Buscador ───
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        const filtradas = todasLasMesas.filter(m =>
            m.id_mesa.includes(q) || m.distrito.toLowerCase().includes(q) || m.local.toLowerCase().includes(q)
        );
        mesaCount.textContent = `Mostrando: ${filtradas.length} / ${todasLasMesas.length}`;
        renderTabla(filtradas);
    });

    // ─── Renderizar tabla ───
    function renderTabla(data) {
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No hay mesas registradas.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.forEach(mesa => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:700; color:#60a5fa; letter-spacing:0.5px;">${mesa.id_mesa}</td>
                <td>${mesa.distrito}</td>
                <td style="color:var(--text-muted); font-size:0.83rem;">${mesa.local}</td>
                <td>${mesa.electores_habiles}</td>
                <td style="white-space:nowrap;">
                    <button class="btn-accion btn-editar" onclick="editarMesa('${mesa.id_mesa}', ${mesa.electores_habiles})">✏ Editar</button>
                    <button class="btn-accion btn-eliminar" onclick="eliminarMesa('${mesa.id_mesa}')">🗑 Eliminar</button>
                </td>`;
            tbody.appendChild(tr);
        });
    }

    // ─── Editar mesa ───
    window.editarMesa = function(id, electores) {
        inputId.value = id;
        inputElectores.value = electores;
        inputId.readOnly = true;
        btnGuardar.textContent = "Actualizar Mesa";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ─── Eliminar mesa ───
    window.eliminarMesa = async function(id) {
        if (!confirm(`¿Eliminar la Mesa N° ${id}?\nEsta acción no se puede deshacer.`)) return;
        try {
            const res = await fetch('api/eliminar_mesa.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_mesa: id })
            });
            const data = await res.json();
            alert(data.message);
            if (data.success) cargarMesas();
        } catch (err) { alert(`Error: ${err.message}`); }
    };

    // ══════════════════════════════════════════
    //   IMPORTACIÓN EXCEL (barra compacta)
    // ══════════════════════════════════════════
    const fileInput = document.getElementById('fileInput');
    const fileNameEl = document.getElementById('fileName');
    const btnImportar = document.getElementById('btnImportar');
    const btnPlantilla = document.getElementById('btnDescargarPlantilla');
    const feedback = document.getElementById('importFeedback');

    // Selección de archivo
    fileInput.addEventListener('change', () => {
        archivoExcel = fileInput.files[0] || null;
        if (archivoExcel) {
            fileNameEl.textContent = archivoExcel.name;
            btnImportar.disabled = false;
            mostrarFeedback('', '');
        } else {
            fileNameEl.textContent = 'Ningún archivo seleccionado';
            btnImportar.disabled = true;
        }
    });

    // Descargar plantilla
    btnPlantilla.addEventListener('click', () => {
        const wb = XLSX.utils.book_new();
        const datos = [
            ['N°', 'ODPE', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO', 'CENTRO POBLADO', 'MESA DE SUFRAGIO N°'],
            [1, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'CHACAYAN', '', '068426'],
            [2, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'CHACAYAN', '', '068427'],
            [3, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'CHACAYAN', 'CHANGO', '903878'],
            [4, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'GOLLLARISQUIZGA', '', '068434'],
            [5, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'PAUCAR', '', '068437'],
        ];
        const ws = XLSX.utils.aoa_to_sheet(datos);
        ws['!cols'] = [{ wch: 5 }, { wch: 8 }, { wch: 14 }, { wch: 24 }, { wch: 22 }, { wch: 18 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, ws, 'MESAS');
        XLSX.writeFile(wb, 'Plantilla_Mesas_ODPE_Pasco.xlsx');
    });

    // Importar al servidor
    btnImportar.addEventListener('click', () => {
        if (archivoExcel) procesarExcel(archivoExcel);
    });

    function procesarExcel(file) {
        btnImportar.disabled = true;
        btnImportar.textContent = '⏳ Procesando...';
        mostrarFeedback('', '');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

                if (rows.length < 2) {
                    mostrarFeedback('err', 'El archivo no tiene datos válidos.');
                    return;
                }

                // Columnas según el formato del usuario:
                // [0]=N°  [1]=ODPE  [2]=DEPTO  [3]=PROVINCIA  [4]=DISTRITO  [5]=CENTRO POBLADO  [6]=MESA N°
                const mesas = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const id_mesa = String(row[6] ?? '').trim();
                    if (!id_mesa) continue;

                    mesas.push({
                        departamento: String(row[2] ?? 'PASCO').trim(),
                        provincia:    String(row[3] ?? '').trim(),
                        distrito:     String(row[4] ?? '').trim(),
                        centro_poblado: String(row[5] ?? '').trim(),
                        id_mesa:      id_mesa.padStart(6, '0'),
                        electores_habiles: 0
                    });
                }

                if (mesas.length === 0) {
                    mostrarFeedback('err', 'No se encontraron mesas válidas en el archivo.');
                    return;
                }

                const res = await fetch('api/importar_mesas.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mesas })
                });
                const result = await res.json();

                if (result.success) {
                    mostrarFeedback('ok', `✅ ${result.message}`);
                    cargarMesas();
                    fileInput.value = '';
                    fileNameEl.textContent = 'Ningún archivo seleccionado';
                    archivoExcel = null;
                } else {
                    mostrarFeedback('err', `❌ ${result.message}`);
                }
            } catch (err) {
                mostrarFeedback('err', `Error: ${err.message}`);
            } finally {
                btnImportar.disabled = true;
                btnImportar.textContent = '⬆ Importar';
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function mostrarFeedback(tipo, msg) {
        feedback.style.display = msg ? 'inline-block' : 'none';
        feedback.className = `import-feedback ${tipo}`;
        feedback.textContent = msg;
    }
});
