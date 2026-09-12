document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mesaForm');
    const inputId = document.getElementById('id_mesa');
    const inputElectores = document.getElementById('electores_habiles');
    const tbody = document.getElementById('tablaMesas');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnLimpiar = document.getElementById('btnLimpiar');

    // Cargar mesas al inicio
    cargarMesas();

    btnLimpiar.addEventListener('click', () => {
        form.reset();
        inputId.readOnly = false;
        btnGuardar.textContent = "Guardar Mesa";
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        const payload = {
            id_mesa: inputId.value,
            electores_habiles: inputElectores.value
        };

        try {
            const res = await fetch('api/guardar_mesa.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                btnLimpiar.click();
                cargarMesas();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert(`Error de red: ${error.message}`);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar Mesa";
        }
    });

    async function cargarMesas() {
        try {
            const res = await fetch('api/get_mesas.php');
            const json = await res.json();
            if (json.error) throw new Error(json.error);

            if (json.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No hay mesas registradas.</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            json.data.forEach(mesa => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:700; color:var(--primary-color)">${mesa.id_mesa}</td>
                    <td>${mesa.distrito}</td>
                    <td>${mesa.local}</td>
                    <td>${mesa.electores_habiles}</td>
                    <td><button style="background:var(--primary-color); border:none; color:white; padding:4px 8px; border-radius:4px; cursor:pointer;" onclick="editarMesa('${mesa.id_mesa}', ${mesa.electores_habiles})">Editar</button></td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center">Error: ${error.message}</td></tr>`;
        }
    }

    window.editarMesa = function(id, electores) {
        inputId.value = id;
        inputElectores.value = electores;
        inputId.readOnly = true;
        btnGuardar.textContent = "Actualizar Mesa";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ============================================
    //  IMPORTACIÓN EXCEL con SheetJS
    // ============================================
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const importResult = document.getElementById('importResult');
    const progressBar = document.getElementById('importProgress');
    const progressFill = document.getElementById('progressFill');
    const btnPlantilla = document.getElementById('btnDescargarPlantilla');

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) procesarExcel(file);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) procesarExcel(fileInput.files[0]);
    });

    // --- Generar Plantilla Excel ---
    btnPlantilla.addEventListener('click', () => {
        const wb = XLSX.utils.book_new();

        // Datos de ejemplo con el formato exacto solicitado
        const datosEjemplo = [
            ['N°', 'ODPE', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO', 'CENTRO POBLADO', 'MESA DE SUFRAGIO N°'],
            [1, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'CHACAYAN', '', '068426'],
            [2, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'CHACAYAN', '', '068427'],
            [3, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'CHACAYAN', '', '068428'],
            [4, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'CHACAYAN', 'CHANGO', '903878'],
            [5, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'GOLLLARISQUIZGA', '', '068434'],
            [6, 'PASCO', 'PASCO', 'DANIEL ALCIDES CARRION', 'PAUCAR', '', '068437'],
        ];

        const ws = XLSX.utils.aoa_to_sheet(datosEjemplo);

        // Estilos de ancho de columnas
        ws['!cols'] = [
            { wch: 6 },  // N°
            { wch: 8 },  // ODPE
            { wch: 16 }, // DEPARTAMENTO
            { wch: 24 }, // PROVINCIA
            { wch: 22 }, // DISTRITO
            { wch: 20 }, // CENTRO POBLADO
            { wch: 22 }  // MESA DE SUFRAGIO N°
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'MESAS');
        XLSX.writeFile(wb, 'Plantilla_Mesas_ODPE_Pasco.xlsx');
    });

    // --- Procesar el Excel cargado ---
    function procesarExcel(file) {
        mostrarResultado('', '');
        progressBar.style.display = 'block';
        progressFill.style.width = '30%';

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                progressFill.style.width = '60%';

                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (rows.length < 2) {
                    mostrarResultado('error', 'El archivo no tiene datos. Asegúrate de usar la plantilla correcta.');
                    return;
                }

                // Fila 0 = encabezados, fila 1+ = datos
                const mesas = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    // Col G (index 6) = MESA DE SUFRAGIO N°
                    const id_mesa = String(row[6] ?? '').trim().padStart(6, '0');
                    if (!id_mesa || id_mesa === '000000') continue;

                    mesas.push({
                        departamento: String(row[2] ?? 'PASCO').trim(),
                        provincia: String(row[3] ?? '').trim(),
                        distrito: String(row[4] ?? '').trim(),
                        centro_poblado: String(row[5] ?? '').trim(),
                        id_mesa: id_mesa,
                        electores_habiles: 0 // El excel del padrón no tiene electores; se pueden cargar después
                    });
                }

                progressFill.style.width = '80%';

                if (mesas.length === 0) {
                    mostrarResultado('error', 'No se encontraron mesas válidas en el archivo.');
                    return;
                }

                // Enviar al backend
                const res = await fetch('api/importar_mesas.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mesas })
                });
                const result = await res.json();
                progressFill.style.width = '100%';

                if (result.success) {
                    let msg = `✅ ${result.message}`;
                    if (result.errores && result.errores.length > 0) {
                        msg += `<br><small style="color:#fbbf24">⚠️ Advertencias:<br>${result.errores.join('<br>')}</small>`;
                    }
                    mostrarResultado('success', msg);
                    cargarMesas(); // Recargar tabla
                    fileInput.value = '';
                } else {
                    mostrarResultado('error', `❌ ${result.message}`);
                }
            } catch (err) {
                mostrarResultado('error', `Error procesando Excel: ${err.message}`);
            } finally {
                setTimeout(() => { progressBar.style.display = 'none'; }, 1500);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function mostrarResultado(tipo, mensaje) {
        importResult.style.display = mensaje ? 'block' : 'none';
        importResult.className = `import-result ${tipo}`;
        importResult.innerHTML = mensaje;
    }
});

