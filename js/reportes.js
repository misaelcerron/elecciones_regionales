// js/reportes.js — Reportes de Escrutinio y Actas (Estilo Pantallazo 1 Apple Dark)
document.addEventListener('DOMContentLoaded', () => {
    let currentTipo = 'mesas';
    let rawData = [];
    let currentKpis = null;

    // Elementos UI
    const tabStepMesas = document.getElementById('tabStepMesas');
    const tabStepDistritos = document.getElementById('tabStepDistritos');
    const sectionLabelTag = document.getElementById('sectionLabelTag');
    const sectionIcon = document.getElementById('sectionIcon');
    const sectionTitleText = document.getElementById('sectionTitleText');
    const reportSearchInput = document.getElementById('reportSearchInput');
    const tipoEleccionSelect = document.getElementById('tipoEleccionSelect');
    const distritoFilterSelect = document.getElementById('distritoFilterSelect');
    const statusFilterSelect = document.getElementById('statusFilterSelect');
    const btnReloadReport = document.getElementById('btnReloadReport');
    const thead = document.getElementById('reportTableHead');
    const tbody = document.getElementById('reportTableBody');
    const reportCountFooter = document.getElementById('reportCountFooter');

    // KPIs
    const kpiTotalMesas = document.getElementById('kpiTotalMesas');
    const kpiTotalElectoresSub = document.getElementById('kpiTotalElectoresSub');
    const kpiContabilizadas = document.getElementById('kpiContabilizadas');
    const kpiObservadas = document.getElementById('kpiObservadas');
    const kpiAvancePct = document.getElementById('kpiAvancePct');
    const kpiVotantesSub = document.getElementById('kpiVotantesSub');

    // Eventos
    tabStepMesas.addEventListener('click', () => switchTab('mesas'));
    tabStepDistritos.addEventListener('click', () => switchTab('distritos'));
    reportSearchInput.addEventListener('input', renderCurrentTable);
    tipoEleccionSelect.addEventListener('change', () => loadReport(currentTipo));
    distritoFilterSelect.addEventListener('change', renderCurrentTable);
    statusFilterSelect.addEventListener('change', renderCurrentTable);
    btnReloadReport.addEventListener('click', () => loadReport(currentTipo));

    // Iniciar
    loadReport('mesas');

    function switchTab(tipo) {
        currentTipo = tipo;
        tabStepMesas.classList.toggle('active', tipo === 'mesas');
        tabStepDistritos.classList.toggle('active', tipo === 'distritos');

        if (tipo === 'mesas') {
            sectionLabelTag.textContent = 'PASO 1 · MONITOREO DE MESAS';
            sectionIcon.textContent = '📋';
            sectionTitleText.textContent = 'Padrón de Mesas y Estado de Actas';
            statusFilterSelect.style.display = 'inline-block';
        } else {
            sectionLabelTag.textContent = 'PASO 2 · CONSOLIDADO DISTRITAL';
            sectionIcon.textContent = '🏛️';
            sectionTitleText.textContent = 'Avance del Escrutinio por Distritos';
            statusFilterSelect.style.display = 'none'; // Distritos no tienen estado individual
            distritoFilterSelect.style.display = 'none'; // Distritos no necesitan filtro de distrito adicional
        }

        // Mostrar filtro de distrito si es reporte de mesas
        if (tipo === 'mesas') {
            distritoFilterSelect.style.display = 'inline-block';
        }

        reportSearchInput.value = '';
        loadReport(tipo);
    }

    async function loadReport(tipo) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #86868b; padding: 2.5rem;">Cargando datos electorales...</td></tr>`;
        reportCountFooter.textContent = 'Consultando base de datos...';

        try {
            const idTipo = tipoEleccionSelect ? tipoEleccionSelect.value : 1;
            const res = await fetch(`api/reportes.php?tipo=${tipo}&id_tipo_eleccion=${idTipo}&_=${new Date().getTime()}`);
            const json = await res.json();

            if (json.error) throw new Error(json.error);

            rawData = json.data || [];
            currentKpis = json.kpis || null;

            actualizarDistritosDropdown();
            actualizarKpis();
            renderCurrentTable();

        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ff453a; padding: 2rem;">Error al cargar datos: ${error.message}</td></tr>`;
            reportCountFooter.textContent = 'Error en la consulta.';
        }
    }

    function actualizarDistritosDropdown() {
        if (!distritoFilterSelect) return;
        
        const distritos = new Set();
        rawData.forEach(r => {
            if (r.distrito) distritos.add(r.distrito);
        });

        // Guardar selección actual
        const currentSelection = distritoFilterSelect.value;
        
        let html = '<option value="TODOS">Todos los distritos</option>';
        Array.from(distritos).sort().forEach(d => {
            html += `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`;
        });
        
        distritoFilterSelect.innerHTML = html;
        
        // Restaurar selección si existe en los nuevos datos
        if (distritos.has(currentSelection)) {
            distritoFilterSelect.value = currentSelection;
        } else {
            distritoFilterSelect.value = 'TODOS';
        }
    }

    function actualizarKpis() {
        if (!currentKpis) {
            // Calcular dinámicamente si no vinieron en kpis
            let totalM = rawData.length;
            let contab = 0;
            let obs = 0;
            let elect = 0;
            let vot = 0;

            if (currentTipo === 'mesas') {
                rawData.forEach(r => {
                    const st = (r.estado || '').toUpperCase().trim();
                    if (st === 'CONTABILIZADA' || st === 'DIGITADA') contab++;
                    else if (st === 'OBSERVADA') obs++;
                    elect += parseInt(r.electores_habiles || 0);
                    vot += parseInt(r.votantes || 0);
                });
            } else {
                totalM = rawData.reduce((acc, r) => acc + parseInt(r.total_mesas || 0), 0);
                contab = rawData.reduce((acc, r) => acc + parseInt(r.mesas_escrutadas || 0), 0);
                elect = rawData.reduce((acc, r) => acc + parseInt(r.electores_habiles || 0), 0);
                vot = rawData.reduce((acc, r) => acc + parseInt(r.total_votantes || 0), 0);
            }

            const pct = totalM > 0 ? Math.round((contab / totalM) * 100) : 0;
            kpiTotalMesas.textContent = totalM.toLocaleString();
            kpiTotalElectoresSub.textContent = `Padrón: ${elect.toLocaleString()} electores`;
            kpiContabilizadas.textContent = contab.toLocaleString();
            kpiObservadas.textContent = obs.toLocaleString();
            kpiAvancePct.textContent = `${pct}%`;
            kpiVotantesSub.textContent = `Votantes computados: ${vot.toLocaleString()}`;
            return;
        }

        kpiTotalMesas.textContent = Number(currentKpis.total_mesas || 0).toLocaleString();
        kpiTotalElectoresSub.textContent = `Padrón: ${Number(currentKpis.total_electores || 0).toLocaleString()} electores`;
        kpiContabilizadas.textContent = Number(currentKpis.contabilizadas || 0).toLocaleString();
        kpiObservadas.textContent = Number(currentKpis.observadas || 0).toLocaleString();
        kpiAvancePct.textContent = `${currentKpis.pct_avance || 0}%`;
        kpiVotantesSub.textContent = `Votantes computados: ${Number(currentKpis.total_votantes || 0).toLocaleString()}`;
    }

    function renderCurrentTable() {
        const query = (reportSearchInput.value || '').toLowerCase().trim();
        const selectedStatus = statusFilterSelect.value;

        if (currentTipo === 'mesas') {
            renderMesasTable(query, selectedStatus);
        } else {
            renderDistritosTable(query);
        }
    }

    function renderMesasTable(query, statusFilter) {
        const distritoFilter = (distritoFilterSelect && distritoFilterSelect.style.display !== 'none') ? distritoFilterSelect.value : 'TODOS';

        thead.innerHTML = `
            <tr>
                <th>N° Mesa</th>
                <th>Distrito</th>
                <th>Electores Hábiles</th>
                <th>Ciudadanos Votaron</th>
                <th>Estado del Acta</th>
                <th style="min-width: 140px;">Participación</th>
            </tr>
        `;

        const filtrados = rawData.filter(row => {
            const matchQuery = !query || 
                (row.id_mesa && row.id_mesa.toString().toLowerCase().includes(query)) ||
                (row.distrito && row.distrito.toLowerCase().includes(query));

            let matchStatus = true;
            if (statusFilter !== 'TODOS') {
                const st = (row.estado || '').toUpperCase();
                if (statusFilter === 'FALTA') {
                    matchStatus = st.includes('FALTA') || st.includes('PENDIENTE');
                } else {
                    matchStatus = st.includes(statusFilter);
                }
            }

            let matchDistrito = true;
            if (distritoFilter !== 'TODOS') {
                matchDistrito = row.distrito === distritoFilter;
            }

            return matchQuery && matchStatus && matchDistrito;
        });

        if (filtrados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #86868b; padding: 2.5rem;">No se encontraron mesas con los filtros seleccionados.</td></tr>`;
            reportCountFooter.textContent = `0 mesas encontradas`;
            return;
        }

        let html = '';
        filtrados.forEach(row => {
            const electores = parseInt(row.electores_habiles || 0);
            const votaron = parseInt(row.votantes || 0);
            const pct = electores > 0 ? Math.min(100, Math.round((votaron / electores) * 100)) : 0;

            const rawEstado = (row.estado || 'FALTA ENTREGAR').toUpperCase();
            let badgeClass = 'falta';
            let badgeIcon = '⏳';

            if (rawEstado.includes('CONTABILIZADA')) {
                badgeClass = 'contabilizada';
                badgeIcon = '✅';
            } else if (rawEstado.includes('OBSERVADA')) {
                badgeClass = 'observada';
                badgeIcon = '⚠️';
            } else if (rawEstado.includes('DIGITADA')) {
                badgeClass = 'digitada';
                badgeIcon = '✍️';
            }

            html += `
                <tr>
                    <td>
                        <span class="mesa-tag">${escapeHtml(row.id_mesa)}</span>
                    </td>
                    <td style="font-weight: 600; color: #ffffff;">${escapeHtml(row.distrito)}</td>
                    <td style="color: #94a3b8;">${electores.toLocaleString()}</td>
                    <td style="font-weight: 700; color: #f5f5f7;">${votaron.toLocaleString()}</td>
                    <td>
                        <span class="badge ${badgeClass}">
                            <span>${badgeIcon}</span> ${escapeHtml(rawEstado)}
                        </span>
                    </td>
                    <td>
                        <div class="progress-bar-wrap">
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #86868b; font-weight: 600;">
                                <span>${pct}%</span>
                                <span>${votaron}/${electores}</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${pct}%;"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        reportCountFooter.textContent = `Mostrando ${filtrados.length} de ${rawData.length} mesas registradas`;
    }

    function renderDistritosTable(query) {
        thead.innerHTML = `
            <tr>
                <th>Distrito</th>
                <th style="min-width: 180px;">Avance del Escrutinio</th>
                <th>Total Mesas</th>
                <th>Padrón Electoral</th>
                <th>Total Votantes</th>
                <th style="min-width: 130px;">Participación</th>
            </tr>
        `;

        const filtrados = rawData.filter(row => {
            return !query || (row.distrito && row.distrito.toLowerCase().includes(query));
        });

        if (filtrados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #86868b; padding: 2.5rem;">No se encontraron distritos coincidentes con "${escapeHtml(query)}".</td></tr>`;
            reportCountFooter.textContent = `0 distritos encontrados`;
            return;
        }

        let html = '';
        filtrados.forEach(row => {
            const totalM = parseInt(row.total_mesas || 0);
            const escrutadas = parseInt(row.mesas_escrutadas || 0);
            const pctAvance = totalM > 0 ? Math.round((escrutadas / totalM) * 100) : 0;

            const electores = parseInt(row.electores_habiles || 0);
            const votantes = parseInt(row.total_votantes || 0);
            const pctPart = electores > 0 ? Math.min(100, Math.round((votantes / electores) * 100)) : 0;

            html += `
                <tr>
                    <td style="font-weight: 700; color: #ffffff; font-size: 0.95rem;">
                        <span>📍</span> ${escapeHtml(row.distrito)}
                    </td>
                    <td>
                        <div class="progress-bar-wrap">
                            <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: #fff; font-weight: 700;">
                                <span style="color: #60a5fa;">${escrutadas} de ${totalM} actas</span>
                                <span style="color: #32d74b;">${pctAvance}%</span>
                            </div>
                            <div class="progress-bar-bg" style="height: 8px;">
                                <div class="progress-bar-fill" style="width: ${pctAvance}%; background: linear-gradient(90deg, #0071e3, #60a5fa);"></div>
                            </div>
                        </div>
                    </td>
                    <td style="font-weight: 700; color: #f5f5f7;">${totalM.toLocaleString()}</td>
                    <td style="color: #94a3b8;">${electores.toLocaleString()}</td>
                    <td style="font-weight: 700; color: #32d74b;">${votantes.toLocaleString()}</td>
                    <td>
                        <div class="progress-bar-wrap">
                            <div style="font-size: 0.74rem; color: #86868b; font-weight: 600; text-align: right; margin-bottom: 0.2rem;">${pctPart}%</div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${pctPart}%; background: #32d74b;"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        reportCountFooter.textContent = `Mostrando ${filtrados.length} distritos de la ODPE Pasco`;
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
});
