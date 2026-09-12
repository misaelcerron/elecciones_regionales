document.addEventListener('DOMContentLoaded', () => {
    const tabMesas = document.getElementById('tabMesas');
    const tabDistritos = document.getElementById('tabDistritos');
    const tableContainer = document.getElementById('tableContainer');

    // Event Listeners
    tabMesas.addEventListener('click', () => loadReport('mesas'));
    tabDistritos.addEventListener('click', () => loadReport('distritos'));

    // Iniciar
    loadReport('mesas');

    async function loadReport(tipo) {
        // Actualizar UI
        tabMesas.classList.toggle('active', tipo === 'mesas');
        tabDistritos.classList.toggle('active', tipo === 'distritos');
        tableContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">Cargando datos...</p>';

        try {
            const res = await fetch(`api/reportes.php?tipo=${tipo}`);
            const json = await res.json();
            
            if (json.error) throw new Error(json.error);
            
            if (tipo === 'mesas') {
                renderMesas(json.data);
            } else {
                renderDistritos(json.data);
            }
        } catch (error) {
            tableContainer.innerHTML = `<p style="text-align:center; color: #ef4444;">Error: ${error.message}</p>`;
        }
    }

    function renderMesas(data) {
        let html = `<table>
            <thead>
                <tr>
                    <th>N° Mesa</th>
                    <th>Distrito</th>
                    <th>Electores Hábiles</th>
                    <th>Votantes</th>
                    <th>Estado de Acta</th>
                </tr>
            </thead>
            <tbody>`;

        if (data.length === 0) {
            html += `<tr><td colspan="5" style="text-align:center">No hay mesas registradas.</td></tr>`;
        }

        data.forEach(row => {
            let badgeClass = row.estado.toLowerCase().replace('_', '');
            if(badgeClass.includes('falta')) badgeClass = 'falta';

            html += `<tr>
                <td style="font-weight: 600;">${row.id_mesa}</td>
                <td>${row.distrito}</td>
                <td>${row.electores_habiles}</td>
                <td>${row.votantes}</td>
                <td><span class="badge ${badgeClass}">${row.estado}</span></td>
            </tr>`;
        });
        html += `</tbody></table>`;
        tableContainer.innerHTML = html;
    }

    function renderDistritos(data) {
        let html = `<table>
            <thead>
                <tr>
                    <th>Distrito</th>
                    <th>Avance de Escrutinio</th>
                    <th>Total Mesas</th>
                    <th>Padrón Electoral</th>
                    <th>Total Votantes</th>
                </tr>
            </thead>
            <tbody>`;

        if (data.length === 0) {
            html += `<tr><td colspan="5" style="text-align:center">No hay distritos registrados.</td></tr>`;
        }

        data.forEach(row => {
            let pct = row.total_mesas > 0 ? Math.round((row.mesas_escrutadas / row.total_mesas) * 100) : 0;
            
            html += `<tr>
                <td style="font-weight: 600;">${row.distrito}</td>
                <td>
                    ${row.mesas_escrutadas} / ${row.total_mesas} actas (${pct}%)
                    <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
                </td>
                <td>${row.total_mesas}</td>
                <td>${row.electores_habiles}</td>
                <td>${row.total_votantes}</td>
            </tr>`;
        });
        html += `</tbody></table>`;
        tableContainer.innerHTML = html;
    }
});
