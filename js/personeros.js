document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('personerosTableBody');
    const modal = document.getElementById('personeroModal');
    const form = document.getElementById('personeroForm');
    const btnNew = document.getElementById('btnNewPersonero');
    const btnCancel = document.getElementById('btnCancel');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const searchInput = document.getElementById('searchInput');
    const filterDistrito = document.getElementById('filterDistrito');
    const filterLocal = document.getElementById('filterLocal');
    const filterEstado = document.getElementById('filterEstado');
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    const btnExportarPDF = document.getElementById('btnExportarPDF');

    let personerosData = [];
    let filtradosActuales = [];

    // Cargar personeros
    async function loadPersoneros() {
        try {
            const res = await fetch('api/personeros.php?_=' + new Date().getTime());
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            personerosData = json.data || [];
            populateFilters();
            renderTable();
        } catch (e) {
            alert('Error al cargar personeros: ' + e.message);
        }
    }

    function populateFilters() {
        if (!filterDistrito || !filterLocal) return;
        const distritos = [...new Set(personerosData.map(p => p.distrito).filter(Boolean))].sort();
        filterDistrito.innerHTML = '<option value="">Todos los Distritos</option>' + distritos.map(d => `<option value="${d}">${escapeHtml(d)}</option>`).join('');
        
        const locales = [...new Set(personerosData.map(p => p.local_votacion).filter(Boolean))].sort();
        filterLocal.innerHTML = '<option value="">Todos los Locales</option>' + locales.map(l => `<option value="${l}">${escapeHtml(l)}</option>`).join('');
    }

    if (filterDistrito) {
        filterDistrito.addEventListener('change', () => {
            const dist = filterDistrito.value;
            let locales = [];
            if (dist) {
                locales = [...new Set(personerosData.filter(p => p.distrito === dist).map(p => p.local_votacion).filter(Boolean))].sort();
            } else {
                locales = [...new Set(personerosData.map(p => p.local_votacion).filter(Boolean))].sort();
            }
            filterLocal.innerHTML = '<option value="">Todos los Locales</option>' + locales.map(l => `<option value="${l}">${escapeHtml(l)}</option>`).join('');
            renderTable();
        });
    }
    
    if (filterLocal) filterLocal.addEventListener('change', renderTable);
    if (filterEstado) filterEstado.addEventListener('change', renderTable);
    searchInput.addEventListener('input', renderTable);

    function renderTable() {
        const query = searchInput.value.toLowerCase();
        const dist = filterDistrito ? filterDistrito.value : '';
        const loc = filterLocal ? filterLocal.value : '';
        const estado = filterEstado ? filterEstado.value : '';
        tableBody.innerHTML = '';

        filtradosActuales = personerosData.filter(p => {
            if (dist && p.distrito !== dist) return false;
            if (loc && p.local_votacion !== loc) return false;
            if (estado === 'ASIGNADO' && !p.id_personero) return false;
            if (estado === 'FALTA' && p.id_personero) return false;

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

        if (filtradosActuales.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#86868b;padding:2rem;">No se encontraron personeros</td></tr>`;
            return;
        }

        filtradosActuales.forEach((p, index) => {
            const tr = document.createElement('tr');
            if (p.es_coordinador == 1) {
                tr.style.backgroundColor = '#fee2e2';
                tr.title = 'Este personero ya está registrado como coordinador de local y debe ser subsanado';
            } else if (p.es_duplicado == 1) {
                tr.style.backgroundColor = '#fef08a';
                tr.title = 'Este personero está duplicado (registrado en más de una mesa) y debe ser subsanado';
            }
            const tdStyle = "padding: 0.6rem 0.5rem; font-size: 0.78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
            if (p.id_personero) {
                tr.innerHTML = `
                    <td style="${tdStyle} color: var(--text-tertiary); text-align: center; font-weight: 600;">${index + 1}</td>
                    <td style="${tdStyle} font-weight: 600;">${escapeHtml(p.id_mesa)}</td>
                    <td style="${tdStyle} font-weight: 600;" title="${escapeHtml(p.nombres_apellidos)}">${escapeHtml(p.nombres_apellidos)}</td>
                    <td style="${tdStyle}">${escapeHtml(p.dni)}</td>
                    <td style="${tdStyle}" title="${escapeHtml(p.distrito || '-')}">${escapeHtml(p.distrito || '-')}</td>
                    <td style="${tdStyle}" title="${escapeHtml(p.local_votacion || '-')}">${escapeHtml(p.local_votacion || '-')}</td>
                    <td style="${tdStyle}">${escapeHtml(p.celular || '-')}</td>
                    <td style="${tdStyle}"><span style="background: rgba(0, 0, 0, 0.1); padding: 0.15rem 0.4rem; border-radius: 10px; font-size: 0.7rem;">${escapeHtml(p.tipo)}</span></td>
                    <td style="padding: 0.4rem 0.5rem; white-space: nowrap;">
                        <button class="btn-edit" data-id="${p.id_personero}" style="padding: 0.25rem 0.5rem; font-size: 0.72rem; margin-right: 0.25rem;">✏️</button>
                        <button class="btn-delete" data-id="${p.id_personero}" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;">🗑️</button>
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td style="${tdStyle} color: var(--text-tertiary); text-align: center; font-weight: 600;">${index + 1}</td>
                    <td style="${tdStyle} font-weight: 600;">${escapeHtml(p.id_mesa)}</td>
                    <td style="${tdStyle} color: #ef4444; font-weight: 600;">FALTA ASIGNAR</td>
                    <td style="${tdStyle}">-</td>
                    <td style="${tdStyle}" title="${escapeHtml(p.distrito || '-')}">${escapeHtml(p.distrito || '-')}</td>
                    <td style="${tdStyle}" title="${escapeHtml(p.local_votacion || '-')}">${escapeHtml(p.local_votacion || '-')}</td>
                    <td style="${tdStyle}">-</td>
                    <td style="${tdStyle}">-</td>
                    <td style="padding: 0.4rem 0.5rem;">
                        <button class="btn-icon" onclick="openModalMesa('${p.id_mesa}')" style="background: rgba(59,130,246,0.15); color:#1d4ed8; border:1px solid rgba(59,130,246,0.3); padding:0.25rem 0.6rem; font-size:0.72rem; border-radius:6px; cursor:pointer;">➕ Asignar</button>
                    </td>
                `;
            }
            tableBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => openModal(e.target.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deletePersonero(e.target.dataset.id));
        });
    }

    // searchInput.addEventListener ya se agregó arriba

    // Modal
    btnNew.addEventListener('click', () => openModal());
    btnCancel.addEventListener('click', () => { modal.style.display = 'none'; });

    function openModal(id = null, mesaId = null) {
        form.reset();
        document.getElementById('personeroId').value = '';

        if (id) {
            const p = personerosData.find(x => x.id_personero == id);
            if (p) {
                document.getElementById('personeroId').value = p.id_personero;
                document.getElementById('nombres').value = p.nombres_apellidos;
                document.getElementById('dni').value = p.dni;
                document.getElementById('celular').value = p.celular || '';
                document.getElementById('mesa').value = p.id_mesa;
                document.getElementById('tipo').value = p.tipo;
            }
        } else if (mesaId) {
            document.getElementById('mesa').value = mesaId;
        }
        modal.style.display = 'flex';
    }

    window.openModalMesa = (mesaId) => {
        openModal(null, mesaId);
    };

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

    // ══════════════════════════════════════
    //  EXPORTAR EXCEL
    // ══════════════════════════════════════
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', () => {
            if (!filtradosActuales || filtradosActuales.length === 0) {
                alert('No hay datos para exportar.');
                return;
            }
            const btn = btnExportarExcel;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>⏳</span> Generando...';
            btn.disabled = true;

            setTimeout(() => {
                try {
                    const distName = filterDistrito ? filterDistrito.value || 'TODOS' : 'TODOS';
                    const locName  = filterLocal   ? filterLocal.value   || 'TODOS' : 'TODOS';
                    const now = new Date();
                    const fechaStr = now.toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' });

                    // ── Cabecera de título (filas 0-2) ──
                    const titleRows = [
                        ['SISTEMA ELECTORAL – PODEMOS PERÚ | ODPE PASCO'],
                        [`REPORTE DE PERSONEROS   |   DISTRITO: ${distName}   |   LOCAL: ${locName}`],
                        [`Fecha de exportación: ${fechaStr}   |   Total de registros: ${filtradosActuales.length}`],
                        [] // fila en blanco
                    ];

                    // ── Cabeceras de columnas (fila 4) ──
                    const headers = ['#', 'N° MESA', 'APELLIDOS Y NOMBRES', 'DNI', 'DISTRITO', 'LOCAL DE VOTACIÓN', 'CELULAR', 'TIPO', 'ESTADO'];

                    // ── Filas de datos ──
                    const dataRows = filtradosActuales.map((p, i) => [
                        i + 1,
                        p.id_mesa || '',
                        p.nombres_apellidos || 'FALTA ASIGNAR',
                        p.dni || '-',
                        p.distrito || '-',
                        p.local_votacion || '-',
                        p.celular || '-',
                        p.tipo || '-',
                        p.id_personero ? 'ASIGNADO' : 'FALTA ASIGNAR'
                    ]);

                    const aoa = [...titleRows, headers, ...dataRows];
                    const ws = XLSX.utils.aoa_to_sheet(aoa);

                    // ── Estilos ──
                    const DARK_BLUE  = '1B4B8A';
                    const MED_BLUE   = '2563EB';
                    const HEADER_FG  = 'FFFFFF';
                    const ALT_ROW    = 'EEF4FF';
                    const BORDER_CLR = 'B0C4DE';
                    const GREEN_BG   = 'D1FAE5';
                    const GREEN_FG   = '065F46';
                    const RED_BG     = 'FEE2E2';
                    const RED_FG     = '991B1B';

                    const border = (style = 'thin') => ({
                        top:    { style, color: { rgb: BORDER_CLR } },
                        bottom: { style, color: { rgb: BORDER_CLR } },
                        left:   { style, color: { rgb: BORDER_CLR } },
                        right:  { style, color: { rgb: BORDER_CLR } }
                    });

                    // Fila 0 – Título principal
                    const cell00 = XLSX.utils.encode_cell({ r: 0, c: 0 });
                    if (!ws[cell00]) ws[cell00] = { t: 's', v: '' };
                    ws[cell00].s = {
                        font: { bold: true, sz: 14, color: { rgb: HEADER_FG } },
                        fill: { fgColor: { rgb: DARK_BLUE } },
                        alignment: { horizontal: 'center', vertical: 'center' }
                    };

                    // Fila 1 – Subtítulo
                    const cell10 = XLSX.utils.encode_cell({ r: 1, c: 0 });
                    if (!ws[cell10]) ws[cell10] = { t: 's', v: '' };
                    ws[cell10].s = {
                        font: { bold: true, sz: 11, color: { rgb: HEADER_FG } },
                        fill: { fgColor: { rgb: MED_BLUE } },
                        alignment: { horizontal: 'center', vertical: 'center' }
                    };

                    // Fila 2 – Metadatos
                    const cell20 = XLSX.utils.encode_cell({ r: 2, c: 0 });
                    if (!ws[cell20]) ws[cell20] = { t: 's', v: '' };
                    ws[cell20].s = {
                        font: { italic: true, sz: 10, color: { rgb: '4B5563' } },
                        fill: { fgColor: { rgb: 'EFF6FF' } },
                        alignment: { horizontal: 'center', vertical: 'center' }
                    };

                    // Merge celdas del encabezado (cols 0-8)
                    ws['!merges'] = [
                        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
                        { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
                        { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }
                    ];

                    const headerRowIdx = 4; // titleRows(4) = fila 4

                    // Estilo de cabeceras de tabla
                    headers.forEach((_, c) => {
                        const ref = XLSX.utils.encode_cell({ r: headerRowIdx, c });
                        if (!ws[ref]) ws[ref] = { t: 's', v: headers[c] };
                        ws[ref].s = {
                            font: { bold: true, sz: 10, color: { rgb: HEADER_FG } },
                            fill: { fgColor: { rgb: DARK_BLUE } },
                            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                            border: border('medium')
                        };
                    });

                    // Estilos de filas de datos
                    dataRows.forEach((row, ri) => {
                        const rIdx = headerRowIdx + 1 + ri;
                        const isAlt = ri % 2 === 1;
                        row.forEach((val, c) => {
                            const ref = XLSX.utils.encode_cell({ r: rIdx, c });
                            if (!ws[ref]) ws[ref] = { t: 's', v: String(val) };

                            let cellStyle = {
                                font: { sz: 9 },
                                fill: { fgColor: { rgb: isAlt ? ALT_ROW : 'FFFFFF' } },
                                alignment: { vertical: 'center', horizontal: c === 0 ? 'center' : 'left', wrapText: false },
                                border: border()
                            };

                            // Columna ESTADO con color
                            if (c === 8) {
                                const estado = String(val);
                                if (estado === 'ASIGNADO') {
                                    cellStyle.font = { sz: 9, bold: true, color: { rgb: GREEN_FG } };
                                    cellStyle.fill = { fgColor: { rgb: GREEN_BG } };
                                    cellStyle.alignment = { horizontal: 'center', vertical: 'center' };
                                } else {
                                    cellStyle.font = { sz: 9, bold: true, color: { rgb: RED_FG } };
                                    cellStyle.fill = { fgColor: { rgb: RED_BG } };
                                    cellStyle.alignment = { horizontal: 'center', vertical: 'center' };
                                }
                            }

                            // Columna TIPO con negrita
                            if (c === 7 && val && val !== '-') {
                                cellStyle.font = { sz: 9, bold: true };
                                cellStyle.alignment = { horizontal: 'center', vertical: 'center' };
                            }

                            ws[ref].s = cellStyle;
                        });
                    });

                    // Anchos de columna
                    ws['!cols'] = [
                        { wch: 4  },  // #
                        { wch: 9  },  // Mesa
                        { wch: 32 },  // Nombres
                        { wch: 11 },  // DNI
                        { wch: 16 },  // Distrito
                        { wch: 38 },  // Local
                        { wch: 13 },  // Celular
                        { wch: 10 },  // Tipo
                        { wch: 14 }   // Estado
                    ];

                    // Alto de filas de cabecera
                    ws['!rows'] = [
                        { hpt: 24 }, // título
                        { hpt: 18 }, // subtítulo
                        { hpt: 14 }, // metadatos
                        { hpt: 6  }, // en blanco
                        { hpt: 22 }  // headers tabla
                    ];

                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'PERSONEROS');

                    const fname = `Reporte_Personeros${distName !== 'TODOS' ? '_' + distName : ''}_${fechaStr.replace(/\//g,'-')}.xlsx`;
                    XLSX.writeFile(wb, fname);
                    showToast('✅ Excel exportado correctamente');
                } catch (e) {
                    alert('Error al exportar Excel: ' + e.message);
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }, 100);
        });
    }

    // ══════════════════════════════════════
    //  EXPORTAR PDF
    // ══════════════════════════════════════
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', () => {
            if (!filtradosActuales || filtradosActuales.length === 0) {
                alert('No hay datos para exportar.');
                return;
            }
            const btn = btnExportarPDF;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>⏳</span> Generando...';
            btn.disabled = true;

            setTimeout(() => {
                try {
                    // Fix for jspdf-autotable dependency on window.jsPDF
                    if (window.jspdf && window.jspdf.jsPDF) {
                        window.jsPDF = window.jspdf.jsPDF;
                    }
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });

                    const distName = filterDistrito ? filterDistrito.value : '';
                    const locName = filterLocal ? filterLocal.value : '';

                    const logoImg = document.querySelector('img[alt="Podemos Perú"]');
                    let startX = 14;
                    if (logoImg && logoImg.complete) {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = logoImg.naturalWidth || logoImg.width || 128;
                            canvas.height = logoImg.naturalHeight || logoImg.height || 128;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                            doc.addImage(dataUrl, 'JPEG', 14, 14, 16, 16);
                            startX = 34;
                        } catch (err) {
                            console.warn('No se pudo agregar el logo al PDF por CORS o error interno:', err);
                        }
                    }

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(22);
                    doc.setTextColor(27, 75, 138);
                    doc.text("PODEMOS PERÚ", startX, 22);
                    
                    doc.setFontSize(14);
                    doc.setTextColor(80, 80, 80);
                    let subtitleLine1 = "REPORTE DE PERSONEROS";
                    if (distName) subtitleLine1 += ` - DISTRITO: ${distName.toUpperCase()}`;
                    
                    let subtitleLine2 = "";
                    if (locName) {
                        subtitleLine2 = `LOCAL: ${locName.toUpperCase()}`;
                        if (filtradosActuales.length > 0) {
                            const coord = filtradosActuales[0].coordinador;
                            if (coord && coord !== 'Sin Asignar') {
                                subtitleLine2 += `   |   COORDINADOR: ${coord}`;
                            }
                        }
                    }
                    
                    doc.text(subtitleLine1, startX, 30);
                    let tableStartY = 36;
                    if (subtitleLine2) {
                        doc.setFontSize(11);
                        doc.setTextColor(100, 100, 100);
                        doc.text(subtitleLine2, startX, 37);
                        tableStartY = 43;
                    }

                    const tableData = [];
                    filtradosActuales.forEach((p, index) => {
                        tableData.push([
                            index + 1,
                            p.id_mesa || '',
                            p.distrito || '',
                            p.local_votacion || '',
                            p.nombres_apellidos || '',
                            p.dni || '',
                            p.celular || '',
                            p.tipo || '',
                            p.coordinador || '-'
                        ]);
                    });

                    if (typeof doc.autoTable !== 'function') {
                        throw new Error("El plugin autoTable no está cargado correctamente. Recarga la página.");
                    }

                    doc.autoTable({
                        startY: tableStartY,
                        head: [['#', 'N° MESA', 'DISTRITO', 'LOCAL DE VOTACIÓN', 'APELLIDOS Y NOMBRES', 'DNI', 'CELULAR', 'TIPO', 'COORDINADOR']],
                        body: tableData,
                        styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
                        headStyles: { fillColor: [27, 75, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
                        alternateRowStyles: { fillColor: [245, 248, 252] },
                        theme: 'grid'
                    });

                    doc.save(`Reporte_Personeros${distName ? '_' + distName : ''}.pdf`);
                    showToast('✅ PDF exportado correctamente');
                } catch(e) {
                    console.error(e);
                    alert('Error al exportar PDF: ' + e.message);
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }, 100);
        });
    }

    // === MÓDULO COORDINADORES ===
    const btnOpenCoordinadores = document.getElementById('btnOpenCoordinadores');
    const modalCoordinadores = document.getElementById('modalCoordinadores');
    const btnCloseCoordinadores = document.getElementById('btnCloseCoordinadores');
    const fileCoordinadores = document.getElementById('fileCoordinadores');
    const coordFileName = document.getElementById('coordFileName');
    const btnImportarCoordinadores = document.getElementById('btnImportarCoordinadores');
    const btnPlantillaCoordinadores = document.getElementById('btnPlantillaCoordinadores');
    const tableCoordinadores = document.getElementById('tableCoordinadores');
    const coordFeedback = document.getElementById('coordFeedback');

    const btnNewCoordinador = document.getElementById('btnNewCoordinador');
    const modalCoordinadorForm = document.getElementById('modalCoordinadorForm');
    const btnCancelCoordinador = document.getElementById('btnCancelCoordinador');
    const formCoordinador = document.getElementById('formCoordinador');
    const titleCoordinadorForm = document.getElementById('titleCoordinadorForm');
    const coordDistritoSelect = document.getElementById('coordDistritoSelect');
    const coordLocalSelect = document.getElementById('coordLocalSelect');

    let coordinadoresData = [];
    let coordinadoresFiltrados = [];
    let localesData = [];

    async function loadLocales() {
        if (localesData.length > 0) return;
        try {
            const res = await fetch('api/get_locales.php');
            const json = await res.json();
            localesData = json.data || [];
            
            const distritos = [...new Set(localesData.map(l => l.distrito).filter(Boolean))].sort();
            coordDistritoSelect.innerHTML = '<option value="">Seleccione un distrito...</option>' + 
                distritos.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
        } catch(e) {
            console.error('Error al cargar locales:', e);
        }
    }

    if (coordDistritoSelect) {
        coordDistritoSelect.addEventListener('change', () => {
            const dist = coordDistritoSelect.value;
            if (!dist) {
                coordLocalSelect.innerHTML = '<option value="">Primero seleccione distrito</option>';
                coordLocalSelect.disabled = true;
                return;
            }
            const filteredLocales = localesData.filter(l => l.distrito === dist);
            coordLocalSelect.innerHTML = '<option value="">Seleccione un local...</option>' + 
                filteredLocales.map(l => `<option value="${l.id_local}">${escapeHtml(l.nombre_local)}</option>`).join('');
            coordLocalSelect.disabled = false;
        });
    }

    if (btnNewCoordinador) {
        btnNewCoordinador.addEventListener('click', () => {
            openCoordinadorForm();
        });
    }

    if (btnCancelCoordinador) {
        btnCancelCoordinador.addEventListener('click', () => {
            modalCoordinadorForm.style.display = 'none';
        });
    }

    async function openCoordinadorForm(id = null) {
        formCoordinador.reset();
        document.getElementById('coordId').value = '';
        titleCoordinadorForm.textContent = 'Nuevo Coordinador';
        await loadLocales();

        coordDistritoSelect.value = '';
        coordLocalSelect.innerHTML = '<option value="">Primero seleccione distrito</option>';
        coordLocalSelect.disabled = true;

        if (id) {
            const c = coordinadoresData.find(x => x.id_coordinador == id);
            if (c) {
                document.getElementById('coordId').value = c.id_coordinador;
                document.getElementById('coordNombres').value = c.nombres_apellidos;
                document.getElementById('coordDni').value = c.dni;
                document.getElementById('coordCelular').value = c.celular || '';
                
                const localInfo = localesData.find(l => l.id_local == c.id_local);
                if (localInfo) {
                    coordDistritoSelect.value = localInfo.distrito;
                    const filteredLocales = localesData.filter(l => l.distrito === localInfo.distrito);
                    coordLocalSelect.innerHTML = '<option value="">Seleccione un local...</option>' + 
                        filteredLocales.map(l => `<option value="${l.id_local}">${escapeHtml(l.nombre_local)}</option>`).join('');
                    coordLocalSelect.disabled = false;
                    coordLocalSelect.value = c.id_local;
                }
                
                titleCoordinadorForm.textContent = 'Editar Coordinador';
            }
        }
        modalCoordinadorForm.style.display = 'flex';
    }

    if (formCoordinador) {
        formCoordinador.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('coordId').value;
            const data = {
                id_coordinador: id,
                nombres_apellidos: document.getElementById('coordNombres').value,
                dni: document.getElementById('coordDni').value,
                celular: document.getElementById('coordCelular').value,
                id_local: document.getElementById('coordLocalSelect').value
            };
            
            const method = id ? 'PUT' : 'POST';
            
            try {
                const res = await fetch('api/crud_coordinadores.php', {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const json = await res.json();
                if (json.error) throw new Error(json.error);
                
                modalCoordinadorForm.style.display = 'none';
                showToast('Coordinador guardado');
                loadCoordinadores();
            } catch (err) {
                alert('Error: ' + err.message);
            }
        });
    }

    async function deleteCoordinador(id) {
        if (!confirm('¿Seguro que deseas eliminar este coordinador?')) return;
        try {
            const res = await fetch(`api/crud_coordinadores.php?id=${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            showToast('Coordinador eliminado');
            loadCoordinadores();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    if (btnOpenCoordinadores) {
        btnOpenCoordinadores.addEventListener('click', () => {
            modalCoordinadores.style.display = 'flex';
            loadCoordinadores();
        });
    }

    if (btnCloseCoordinadores) {
        btnCloseCoordinadores.addEventListener('click', () => {
            modalCoordinadores.style.display = 'none';
        });
    }

    async function loadCoordinadores() {
        tableCoordinadores.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Cargando coordinadores...</td></tr>';
        try {
            const res = await fetch('api/get_coordinadores.php');
            const json = await res.json();
            coordinadoresData = json.data || [];
            
            // Actualizar filtrados también si hay una búsqueda activa
            if (searchCoordinador && searchCoordinador.value.trim() !== '') {
                const term = searchCoordinador.value.toLowerCase();
                coordinadoresFiltrados = coordinadoresData.filter(c => 
                    (c.nombres_apellidos || '').toLowerCase().includes(term) ||
                    (c.distrito || '').toLowerCase().includes(term) ||
                    (c.local_votacion || '').toLowerCase().includes(term) ||
                    (c.dni || '').toLowerCase().includes(term)
                );
            } else {
                coordinadoresFiltrados = [...coordinadoresData];
            }
            
            renderCoordinadores();
        } catch(e) {
            tableCoordinadores.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red; padding: 2rem;">Error al cargar: ${e.message}</td></tr>`;
        }
    }

    function renderCoordinadores() {
        tableCoordinadores.innerHTML = '';
        if (coordinadoresFiltrados.length === 0) {
            tableCoordinadores.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-secondary); padding: 2rem;">No hay coordinadores registrados o que coincidan con la búsqueda.</td></tr>';
            return;
        }
        coordinadoresFiltrados.forEach((c, index) => {
            tableCoordinadores.innerHTML += `
                <tr>
                    <td style="color:var(--text-tertiary); text-align:center; font-weight:600;">${index + 1}</td>
                    <td>${escapeHtml(c.nombres_apellidos)}</td>
                    <td>${escapeHtml(c.dni)}</td>
                    <td>${escapeHtml(c.celular || '-')}</td>
                    <td style="font-size:0.85rem; color:#94a3b8;">${escapeHtml(c.distrito || '-')}</td>
                    <td>${escapeHtml(c.local_votacion)}</td>
                    <td>
                        <button class="btn-icon" onclick="editCoordinador(${c.id_coordinador})" style="display:inline-flex; padding:0.25rem 0.5rem; margin-right:0.25rem;">✏️</button>
                        <button class="btn-icon danger" onclick="deleteCoordinador(${c.id_coordinador})" style="display:inline-flex; padding:0.25rem 0.5rem;">🗑️</button>
                    </td>
                </tr>
            `;
        });
    }

    window.editCoordinador = (id) => openCoordinadorForm(id);
    window.deleteCoordinador = (id) => deleteCoordinador(id);

    if (searchCoordinador) {
        searchCoordinador.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            coordinadoresFiltrados = coordinadoresData.filter(c => 
                (c.nombres_apellidos || '').toLowerCase().includes(term) ||
                (c.distrito || '').toLowerCase().includes(term) ||
                (c.local_votacion || '').toLowerCase().includes(term) ||
                (c.dni || '').toLowerCase().includes(term)
            );
            renderCoordinadores();
        });
    }

    if (fileCoordinadores) {
        fileCoordinadores.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                coordFileName.textContent = e.target.files[0].name;
                btnImportarCoordinadores.disabled = false;
            } else {
                coordFileName.textContent = 'Ningún archivo';
                btnImportarCoordinadores.disabled = true;
            }
        });
    }

    if (btnPlantillaCoordinadores) {
        btnPlantillaCoordinadores.addEventListener('click', () => {
            const rows = [['NOMBRES Y APELLIDOS', 'DNI', 'CELULAR', 'COORDINADOR LOCAL']];
            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws['!cols'] = [{wch:35}, {wch:12}, {wch:15}, {wch:40}];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Coordinadores');
            XLSX.writeFile(wb, 'Plantilla_Coordinadores.xlsx');
        });
    }

    if (btnImportarCoordinadores) {
        btnImportarCoordinadores.addEventListener('click', () => {
            const file = fileCoordinadores.files[0];
            if (!file) return;
            btnImportarCoordinadores.disabled = true;
            btnImportarCoordinadores.textContent = '⏳...';
            coordFeedback.innerHTML = '';

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1, defval:'' });
                    const records = [];
                    for (let i = 1; i < rows.length; i++) {
                        const r = rows[i];
                        const nombres = String(r[0] ?? '').trim();
                        const dni = String(r[1] ?? '').trim();
                        const celular = String(r[2] ?? '').trim();
                        const local = String(r[3] ?? '').trim();
                        if (nombres && dni && local) {
                            records.push({ nombres_apellidos: nombres, dni: dni, celular: celular, local_votacion: local });
                        }
                    }

                    if (records.length === 0) {
                        coordFeedback.innerHTML = '<span style="color:red;">No se encontraron datos válidos para importar. Asegúrese de llenar todas las columnas.</span>';
                        return;
                    }

                    const res = await fetch('api/importar_coordinadores.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ coordinadores: records })
                    });
                    const result = await res.json();
                    
                    if (result.success) {
                        coordFeedback.innerHTML = `<span style="color:#10b981; font-weight: bold;">✅ ${result.message}</span>`;
                        loadCoordinadores();
                    } else {
                        coordFeedback.innerHTML = `<span style="color:red; font-weight: bold;">❌ ${result.message}</span>`;
                    }
                } catch (err) {
                    coordFeedback.innerHTML = `<span style="color:red; font-weight: bold;">Error procesando Excel: ${err.message}</span>`;
                } finally {
                    btnImportarCoordinadores.textContent = '⬆ Importar';
                    btnImportarCoordinadores.disabled = false;
                    fileCoordinadores.value = '';
                    coordFileName.textContent = 'Ningún archivo';
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // EXPORTAR COORDINADORES EXCEL
    const btnExportarCoordExcel = document.getElementById('btnExportarCoordExcel');
    if (btnExportarCoordExcel) {
        btnExportarCoordExcel.addEventListener('click', () => {
            if (!coordinadoresFiltrados || coordinadoresFiltrados.length === 0) {
                alert('No hay datos para exportar.');
                return;
            }
            const btn = btnExportarCoordExcel;
            const originalText = btn.innerHTML;
            btn.innerHTML = '⏳...';
            btn.disabled = true;

            setTimeout(() => {
                try {
                    let excelSubtitle = 'REPORTE DE COORDINADORES DE LOCAL';
                    const distritosUnicos = [...new Set(coordinadoresFiltrados.map(c => c.distrito).filter(Boolean))];
                    if (distritosUnicos.length === 1) {
                        excelSubtitle += ` - DISTRITO: ${distritosUnicos[0].toUpperCase()}`;
                    } else if (searchCoordinador && searchCoordinador.value.trim() !== '') {
                        excelSubtitle += ` - BÚSQUEDA: ${searchCoordinador.value.trim().toUpperCase()}`;
                    }

                    const titleRows = [
                        ['SISTEMA ELECTORAL – PODEMOS PERÚ | ODPE PASCO'],
                        [excelSubtitle],
                        [`Fecha: ${new Date().toLocaleDateString('es-PE')}   |   Total: ${coordinadoresFiltrados.length}`],
                        []
                    ];

                    const headers = ['#', 'NOMBRES Y APELLIDOS', 'DNI', 'CELULAR', 'COORDINADOR LOCAL', 'DISTRITO'];
                    const dataRows = coordinadoresFiltrados.map((c, i) => [
                        i + 1,
                        c.nombres_apellidos || '',
                        c.dni || '',
                        c.celular || '-',
                        c.local_votacion || '',
                        c.distrito || ''
                    ]);

                    const aoa = [...titleRows, headers, ...dataRows];
                    const ws = XLSX.utils.aoa_to_sheet(aoa);

                    ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 12 }, { wch: 15 }, { wch: 40 }, { wch: 20 }];
                    ws['!merges'] = [
                        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
                        { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
                        { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }
                    ];

                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'COORDINADORES');
                    XLSX.writeFile(wb, `Reporte_Coordinadores_${new Date().toLocaleDateString('es-PE').replace(/\//g,'-')}.xlsx`);
                } catch (e) {
                    alert('Error al exportar Excel: ' + e.message);
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }, 100);
        });
    }

    // EXPORTAR COORDINADORES PDF
    const btnExportarCoordPDF = document.getElementById('btnExportarCoordPDF');
    if (btnExportarCoordPDF) {
        btnExportarCoordPDF.addEventListener('click', () => {
            if (!coordinadoresFiltrados || coordinadoresFiltrados.length === 0) {
                alert('No hay datos para exportar.');
                return;
            }
            const btn = btnExportarCoordPDF;
            const originalText = btn.innerHTML;
            btn.innerHTML = '⏳...';
            btn.disabled = true;

            setTimeout(() => {
                try {
                    if (window.jspdf && window.jspdf.jsPDF) {
                        window.jsPDF = window.jspdf.jsPDF;
                    }
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });

                    const logoImg = document.querySelector('img[alt="Podemos Perú"]');
                    let startX = 14;
                    if (logoImg && logoImg.complete) {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = logoImg.naturalWidth || logoImg.width || 128;
                            canvas.height = logoImg.naturalHeight || logoImg.height || 128;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                            doc.addImage(dataUrl, 'JPEG', 14, 14, 16, 16);
                            startX = 34;
                        } catch (err) {
                            console.warn('CORS logo err:', err);
                        }
                    }

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(22);
                    doc.setTextColor(27, 75, 138);
                    doc.text("PODEMOS PERÚ", startX, 22);

                    doc.setFontSize(14);
                    doc.setTextColor(80, 80, 80);
                    let subtitle = "REPORTE DE COORDINADORES DE LOCAL";
                    const distritosUnicos = [...new Set(coordinadoresFiltrados.map(c => c.distrito).filter(Boolean))];
                    if (distritosUnicos.length === 1) {
                        subtitle += ` - DISTRITO: ${distritosUnicos[0].toUpperCase()}`;
                    } else if (searchCoordinador && searchCoordinador.value.trim() !== '') {
                        subtitle += ` - BÚSQUEDA: ${searchCoordinador.value.trim().toUpperCase()}`;
                    }
                    doc.text(subtitle, startX, 30);

                    const tableData = coordinadoresFiltrados.map((c, index) => [
                        index + 1,
                        c.nombres_apellidos || '',
                        c.dni || '',
                        c.celular || '-',
                        c.local_votacion || '',
                        c.distrito || ''
                    ]);

                    if (typeof doc.autoTable !== 'function') throw new Error("Plugin autoTable no cargado.");

                    doc.autoTable({
                        startY: 36,
                        head: [['#', 'NOMBRES Y APELLIDOS', 'DNI', 'CELULAR', 'COORDINADOR LOCAL', 'DISTRITO']],
                        body: tableData,
                        styles: { fontSize: 9, cellPadding: 2, textColor: [40, 40, 40] },
                        headStyles: { fillColor: [27, 75, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
                        alternateRowStyles: { fillColor: [245, 248, 252] },
                        theme: 'grid'
                    });

                    doc.save(`Reporte_Coordinadores_${new Date().toLocaleDateString('es-PE').replace(/\//g,'-')}.pdf`);
                } catch(e) {
                    console.error(e);
                    alert('Error al exportar PDF: ' + e.message);
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }, 100);
        });
    }

    loadPersoneros();
});
