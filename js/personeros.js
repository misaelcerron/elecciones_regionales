document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('personerosTableBody');
    const modal = document.getElementById('personeroModal');
    const form = document.getElementById('personeroForm');
    const btnNew = document.getElementById('btnNewPersonero');
    const btnCancel = document.getElementById('btnCancel');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const searchInput = document.getElementById('searchInput');

    let personerosData = [];

    // Cargar personeros
    async function loadPersoneros() {
        try {
            const res = await fetch('api/personeros.php?_=' + new Date().getTime());
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            personerosData = json.data || [];
            renderTable();
        } catch (e) {
            alert('Error al cargar personeros: ' + e.message);
        }
    }

    function renderTable() {
        const query = searchInput.value.toLowerCase();
        tableBody.innerHTML = '';

        const filtrados = personerosData.filter(p => {
            const searchStr = [
                p.id_mesa || '',
                p.nombres_apellidos || '',
                p.dni || '',
                p.distrito || '',
                p.local_votacion || '',
                p.celular || '',
                p.tipo || ''
            ].join(' ').toLowerCase();
            return searchStr.includes(query);
        });

        if (filtrados.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#86868b;padding:2rem;">No se encontraron personeros</td></tr>`;
            return;
        }

        filtrados.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(p.id_mesa)}</td>
                <td style="font-weight:600;">${escapeHtml(p.nombres_apellidos)}</td>
                <td>${escapeHtml(p.dni)}</td>
                <td><span style="font-size: 0.8rem;">${escapeHtml(p.distrito || '-')}</span></td>
                <td><span style="font-size: 0.8rem;">${escapeHtml(p.local_votacion || '-')}</span></td>
                <td>${escapeHtml(p.celular || '-')}</td>
                <td><span style="background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">${escapeHtml(p.tipo)}</span></td>
                <td>
                    <button class="btn-edit" data-id="${p.id_personero}" style="margin-right: 0.5rem;">✏️ Editar</button>
                    <button class="btn-delete" data-id="${p.id_personero}">🗑️ Eliminar</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => openModal(e.target.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deletePersonero(e.target.dataset.id));
        });
    }

    searchInput.addEventListener('input', renderTable);

    // Modal
    btnNew.addEventListener('click', () => openModal());
    btnCancel.addEventListener('click', () => { modal.style.display = 'none'; });

    function openModal(id = null) {
        form.reset();
        document.getElementById('personeroId').value = '';

        if (id) {
            const p = personerosData.find(x => x.id_personero == id);
            if (p) {
                document.getElementById('personeroId').value = p.id_personero;
                document.getElementById('nombres').value = p.nombres_apellidos;
                document.getElementById('dni').value = p.dni;
                document.getElementById('celular').value = p.celular;
                document.getElementById('mesa').value = p.id_mesa;
                document.getElementById('tipo').value = p.tipo;
            }
        }
        modal.style.display = 'flex';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            id_personero: document.getElementById('personeroId').value,
            nombres_apellidos: document.getElementById('nombres').value,
            dni: document.getElementById('dni').value,
            celular: document.getElementById('celular').value,
            id_mesa: document.getElementById('mesa').value,
            tipo: document.getElementById('tipo').value
        };

        const method = data.id_personero ? 'PUT' : 'POST';

        try {
            const res = await fetch('api/personeros.php', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const text = await res.text();
            let json;
            try { json = JSON.parse(text); } catch (ex) { throw new Error(text); }
            
            if (json.error) throw new Error(json.error);
            
            modal.style.display = 'none';
            showToast('Personero guardado correctamente');
            loadPersoneros();
        } catch (e) {
            alert('Error al guardar: ' + e.message);
        }
    });

    async function deletePersonero(id) {
        if (!confirm('¿Estás seguro de eliminar a este personero?')) return;
        
        try {
            const res = await fetch(`api/personeros.php?id=${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            showToast('Personero eliminado');
            loadPersoneros();
        } catch (e) {
            alert('Error al eliminar: ' + e.message);
        }
    }

    function showToast(msg) {
        toastMsg.textContent = msg;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ══════════════════════════════════════
    //  IMPORTACIÓN EXCEL
    // ══════════════════════════════════════
    const fileInput = document.getElementById('fileInput');
    const fileNameEl = document.getElementById('fileName');
    const btnImportar = document.getElementById('btnImportar');
    const feedback = document.getElementById('importFeedback');
    let archivoExcel = null;

    if(fileInput) {
        fileInput.addEventListener('change', () => {
            archivoExcel = fileInput.files[0] || null;
            fileNameEl.textContent = archivoExcel ? archivoExcel.name : 'Ningún archivo seleccionado';
            btnImportar.disabled = !archivoExcel;
        });

        document.getElementById('btnDescargarPlantilla').addEventListener('click', async () => {
            const btn = document.getElementById('btnDescargarPlantilla');
            btn.textContent = '⏳...';
            btn.disabled = true;

            try {
                const res = await fetch('api/get_mesas.php');
                const json = await res.json();
                const mesas = json.data || [];

                const rows = [];
                // Cabeceras con las nuevas columnas
                rows.push(['N° MESA', 'DISTRITO', 'LOCAL DE VOTACIÓN', 'APELLIDOS Y NOMBRES', 'DNI', 'CELULAR', 'TIPO (TITULAR/SUPLENTE)']);
                
                if (mesas.length > 0) {
                    mesas.forEach(m => {
                        rows.push([m.id_mesa, m.distrito, m.local_votacion, '', '', '', 'TITULAR']);
                    });
                } else {
                    rows.push(['068426', 'GOYLLARISQUIZGA', 'IE 34052', 'PEREZ GARCIA, JUAN', '12345678', '999888777', 'TITULAR']);
                }

                const ws = XLSX.utils.aoa_to_sheet(rows);

                // Estilos para xlsx-js-style
                const headerStyle = {
                    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                    fill: { fgColor: { rgb: "1B4B8A" } },
                    alignment: { horizontal: "center", vertical: "center", wrapText: true },
                    border: {
                        top: { style: "medium", color: { rgb: "000000" } },
                        bottom: { style: "medium", color: { rgb: "000000" } },
                        left: { style: "medium", color: { rgb: "000000" } },
                        right: { style: "medium", color: { rgb: "000000" } }
                    }
                };

                const cellStyle = {
                    alignment: { vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                };

                const range = XLSX.utils.decode_range(ws['!ref']);
                for(let R = range.s.r; R <= range.e.r; ++R) {
                    for(let C = range.s.c; C <= range.e.c; ++C) {
                        const cell_ref = XLSX.utils.encode_cell({c:C, r:R});
                        if(!ws[cell_ref]) ws[cell_ref] = {t:'s', v:''};
                        if(R === 0) {
                            ws[cell_ref].s = headerStyle;
                        } else {
                            ws[cell_ref].s = cellStyle;
                        }
                    }
                }

                ws['!cols'] = [{wch:10}, {wch:20}, {wch:35}, {wch:35}, {wch:12}, {wch:15}, {wch:25}];

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'PERSONEROS');
                XLSX.writeFile(wb, 'Plantilla_Personeros.xlsx');

            } catch (err) {
                alert('Error al generar plantilla: ' + err.message);
            } finally {
                btn.textContent = '⬇ Plantilla';
                btn.disabled = false;
            }
        });

        btnImportar.addEventListener('click', () => { if (archivoExcel) procesarExcel(archivoExcel); });
    }

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
                const personeros = [];
                for (let i = 1; i < rows.length; i++) {
                    const r = rows[i];
                    const mesa = String(r[0] ?? '').trim().padStart(6,'0');
                    // r[1] es DISTRITO, r[2] es LOCAL DE VOTACION, saltamos a r[3] para nombres
                    const nombres = String(r[3] ?? '').trim();
                    const dni = String(r[4] ?? '').trim();
                    if (!mesa || !nombres || !dni || mesa === '000000') continue;
                    
                    personeros.push({ 
                        id_mesa: mesa, 
                        nombres_apellidos: nombres, 
                        dni: dni, 
                        celular: String(r[5] ?? '').trim(), 
                        tipo: String(r[6] || 'TITULAR').trim().toUpperCase() 
                    });
                }
                if (!personeros.length) { mostrarFeedback('err', 'No se encontraron personeros válidos.'); return; }
                
                const res = await fetch('api/importar_personeros.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ personeros }) });
                const result = await res.json();
                
                if (result.success) {
                    mostrarFeedback('ok', '✅ ' + result.message);
                    loadPersoneros();
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

    loadPersoneros();
});
