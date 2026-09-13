// js/dashboard.js — Estadísticas y Gráficos en Barras para Resultados Electorales
document.addEventListener('DOMContentLoaded', async () => {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";

    try {
        const res = await fetch('api/estadisticas.php?_=' + new Date().getTime());
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        // 1. Actualizar KPIs
        const totalVotantes = parseInt(data.kpis.total_votantes || 0);
        document.getElementById('kpiMesas').textContent = Number(data.kpis.mesas_procesadas || 0).toLocaleString();
        document.getElementById('kpiVotantes').textContent = totalVotantes.toLocaleString();
        document.getElementById('kpiObservadas').textContent = Number(data.kpis.observadas || 0).toLocaleString();

        // 2. Preparar Datos para Gráfico de Barras (Partidos)
        const labelsPartidos = [];
        const datosPartidos = [];
        const coloresBarras = [
            '#0071e3', '#32d74b', '#ff9f0a', '#ff453a',
            '#af52de', '#5e5ce6', '#64d2ff', '#ffd60a',
            '#30b0c7', '#bf5af2', '#ff375f', '#40c8e0'
        ];

        let totalVotosValidos = 0;
        const partidos = data.partidos || [];

        partidos.forEach(p => {
            const v = parseInt(p.total_votos || 0);
            totalVotosValidos += v;
            const label = p.siglas ? `${p.siglas} - ${p.nombre}` : p.nombre;
            labelsPartidos.push(label);
            datosPartidos.push(v);
        });

        // 3. Dibujar Gráfico de Barras Verticales (Chart.js)
        const ctxBar = document.getElementById('barChart').getContext('2d');
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labelsPartidos,
                datasets: [{
                    label: 'Votos Obtenidos',
                    data: datosPartidos,
                    backgroundColor: coloresBarras.slice(0, datosPartidos.length),
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(20,24,33,0.95)',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderWidth: 1,
                        padding: 10,
                        titleFont: { weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#86868b', font: { size: 11 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#86868b',
                            font: { size: 11 },
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                }
            }
        });

        // 4. Dibujar Gráfico de Pastel / Dona (Distribución)
        const blancos = parseInt(data.distribucion.blancos || 0);
        const nulos = parseInt(data.distribucion.nulos || 0);
        const impugnados = parseInt(data.distribucion.impugnados || 0);

        const ctxPie = document.getElementById('pieChart').getContext('2d');
        new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['Válidos', 'Blancos', 'Nulos', 'Impugnados'],
                datasets: [{
                    data: [totalVotosValidos, blancos, nulos, impugnados],
                    backgroundColor: [
                        '#0071e3', // Azul
                        'rgba(255, 255, 255, 0.55)', // Blanco translúcido
                        '#ff453a', // Rojo
                        '#ffd60a'  // Amarillo
                    ],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#86868b', boxWidth: 12, padding: 15, font: { size: 11 } }
                    }
                }
            }
        });

        // 5. Renderizar Ranking Detallado en Barras Horizontales con Logos
        renderRankingBarras(partidos, totalVotosValidos, coloresBarras);

    } catch (e) {
        console.error("Error cargando estadísticas:", e);
        const rankingContainer = document.getElementById('partyRankingList');
        if (rankingContainer) {
            rankingContainer.innerHTML = `<p style="color:#ff453a;text-align:center;">Error al cargar datos estadísticos: ${e.message}</p>`;
        }
    }

    // Lógica para Limpiar Proceso Electoral (Solo Admin)
    const btnLimpiar = document.getElementById('btnLimpiarProceso');
    if (btnLimpiar) {
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
});

function renderRankingBarras(partidos, totalValidos, colores) {
    const container = document.getElementById('partyRankingList');
    if (!container) return;

    if (!partidos || partidos.length === 0) {
        container.innerHTML = `<p style="color:#86868b;text-align:center;padding:1.5rem;">No hay organizaciones políticas ni votos registrados aún.</p>`;
        return;
    }

    let html = '';
    partidos.forEach((p, index) => {
        const votos = parseInt(p.total_votos || 0);
        const pct = totalValidos > 0 ? ((votos / totalValidos) * 100).toFixed(1) : '0.0';
        const color = colores[index % colores.length];
        const logoUrl = p.simbolo_url || 'img/podemos_peru_logo.jpg';
        const nombreMostrar = p.siglas ? `<strong>${escapeHtml(p.siglas)}</strong> — ${escapeHtml(p.nombre)}` : escapeHtml(p.nombre);

        html += `
            <div style="background: rgba(255,255,255,0.025); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 0.85rem 1.1rem; transition: all 0.2s ease;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; gap: 1rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-size: 0.8rem; font-weight: 800; color: #86868b; min-width: 20px;">#${index + 1}</span>
                        <img src="${logoUrl}" alt="${escapeHtml(p.nombre)}" style="width: 32px; height: 32px; border-radius: 8px; object-fit: contain; background: #fff; padding: 2px; border: 1px solid rgba(255,255,255,0.15); flex-shrink: 0;" onerror="this.src='img/podemos_peru_logo.jpg'">
                        <span style="font-size: 0.88rem; color: #fff;">${nombreMostrar}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-size: 1.05rem; font-weight: 800; color: ${color};">${votos.toLocaleString()} <span style="font-size: 0.72rem; color: #86868b; font-weight: 600;">votos</span></span>
                        <span style="font-size: 0.82rem; font-weight: 700; color: #fff; background: rgba(255,255,255,0.07); padding: 0.2rem 0.55rem; border-radius: 20px; border: 0.5px solid rgba(255,255,255,0.1); min-width: 58px; text-align: right;">${pct}%</span>
                    </div>
                </div>
                <!-- Barra de progreso individual -->
                <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.06); border-radius: 99px; overflow: hidden;">
                    <div style="height: 100%; width: ${pct}%; background: ${color}; border-radius: 99px; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);"></div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
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
