/* ════════════════════════════════════════════════════════════════
   js/dashboard.js — Dashboard en TIEMPO REAL con Auto-Refresh
   Polling inteligente cada 15 seg · Actualización suave sin parpadeo
   ODPE PASCO · Sistema Electoral 2026
════════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";

    let barChartInstance = null;
    let pieChartInstance = null;
    let autoRefreshTimer = null;
    let countdownTimer  = null;
    let isLoading       = false;
    let lastData        = null;

    const REFRESH_INTERVAL = 15; // seconds

    const tipoEleccionSelect  = document.getElementById('tipoEleccionSelect');
    const distritoFilterSelect = document.getElementById('distritoFilterSelect');
    const countdownEl         = document.getElementById('refreshCountdown');
    const liveDot             = document.getElementById('liveDot');

    // ─────────────────────────────────────────────────────────────
    // COUNTDOWN TICKER
    // ─────────────────────────────────────────────────────────────
    function startCountdown() {
        clearInterval(countdownTimer);
        let secs = REFRESH_INTERVAL;

        function tick() {
            if (countdownEl) {
                countdownEl.textContent = `Actualiza en ${secs}s`;
            }
            if (secs <= 0) {
                clearInterval(countdownTimer);
                return;
            }
            secs--;
        }

        tick();
        countdownTimer = setInterval(tick, 1000);
    }

    // ─────────────────────────────────────────────────────────────
    // LIVE DOT PULSE ANIMATION (CSS via JS)
    // ─────────────────────────────────────────────────────────────
    if (liveDot) {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes livePulse {
                0%,100%{box-shadow:0 0 4px #32d74b,0 0 0 0 rgba(50,215,75,0.4);}
                50%{box-shadow:0 0 10px #32d74b,0 0 0 5px rgba(50,215,75,0);}
            }
            #liveDot { animation: livePulse 2s ease-in-out infinite; }

            @keyframes kpiFlash {
                0%{ color: inherit; }
                30%{ color: #32d74b; }
                100%{ color: inherit; }
            }
            .kpi-changed { animation: kpiFlash 0.9s ease; }
        `;
        document.head.appendChild(style);
    }

    // ─────────────────────────────────────────────────────────────
    // SMOOTH KPI UPDATE (only animate if value changed)
    // ─────────────────────────────────────────────────────────────
    function updateKPI(id, newValue) {
        const el = document.getElementById(id);
        if (!el) return;
        const formatted = Number(newValue || 0).toLocaleString();
        if (el.textContent !== formatted) {
            el.textContent = formatted;
            el.classList.remove('kpi-changed');
            void el.offsetWidth; // reflow
            el.classList.add('kpi-changed');
            setTimeout(() => el.classList.remove('kpi-changed'), 900);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // CHART UPDATE — actualiza datos sin destruir ni redibujar todo
    // ─────────────────────────────────────────────────────────────
    function updateBarChart(labels, data, logoImages, colors) {
        if (!barChartInstance) return false;

        barChartInstance.data.labels = labels;
        barChartInstance.data.logoImages = logoImages;
        barChartInstance.data.datasets[0].data = data;
        barChartInstance.data.datasets[0].backgroundColor = colors.slice(0, data.length);
        barChartInstance.update('active');
        return true;
    }

    function updatePieChart(validVotes, blancos, nulos, impugnados) {
        if (!pieChartInstance) return false;
        pieChartInstance.data.datasets[0].data = [validVotes, blancos, nulos, impugnados];
        pieChartInstance.update('active');
        return true;
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE BAR CHART (first time)
    // ─────────────────────────────────────────────────────────────
    function createBarChart(labels, data, logoImages, colors) {
        if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }

        const ctxBar = document.getElementById('barChart').getContext('2d');
        barChartInstance = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels,
                logoImages,
                datasets: [{
                    label: 'Votos Obtenidos',
                    data,
                    backgroundColor: colors.slice(0, data.length),
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: { duration: 600, easing: 'easeOutQuart' },
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
                layout: { padding: { bottom: 30 } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#86868b', font: { size: 11 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: 'transparent' }
                    }
                }
            },
            plugins: [{
                id: 'partyLogos',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    const xAxis = chart.scales.x;
                    const y = xAxis.top + 8;
                    if (!chart.config.data.logoImages) return;
                    chart.config.data.logoImages.forEach((img, index) => {
                        if (img.complete && img.naturalHeight !== 0) {
                            const x = xAxis.getPixelForTick(index);
                            const size = 32;
                            ctx.save();
                            ctx.fillStyle = '#fff';
                            ctx.beginPath();
                            if (ctx.roundRect) {
                                ctx.roundRect(x - size/2, y, size, size, 6);
                            } else {
                                ctx.rect(x - size/2, y, size, size);
                            }
                            ctx.fill();
                            ctx.drawImage(img, x - size/2 + 2, y + 2, size - 4, size - 4);
                            ctx.restore();
                        }
                    });
                }
            }]
        });
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE PIE CHART (first time)
    // ─────────────────────────────────────────────────────────────
    function createPieChart(validVotes, blancos, nulos, impugnados) {
        if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }

        const ctxPie = document.getElementById('pieChart').getContext('2d');
        pieChartInstance = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['Válidos', 'Blancos', 'Nulos', 'Impugnados'],
                datasets: [{
                    data: [validVotes, blancos, nulos, impugnados],
                    backgroundColor: ['#0071e3', 'rgba(255,255,255,0.55)', '#ff453a', '#ffd60a'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '70%',
                animation: { duration: 600 },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#86868b', boxWidth: 12, padding: 15, font: { size: 11 } }
                    }
                }
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // MAIN LOAD FUNCTION
    // ─────────────────────────────────────────────────────────────
    async function loadDashboard(idTipoEleccion = 1, silent = false) {
        if (isLoading) return;
        isLoading = true;

        // Show/hide district filter
        if (distritoFilterSelect) {
            if (idTipoEleccion == 4) {
                distritoFilterSelect.style.display = 'inline-block';
            } else {
                distritoFilterSelect.style.display = 'none';
                distritoFilterSelect.value = 'TODOS';
            }
        }

        const distritoSeleccionado = (distritoFilterSelect && distritoFilterSelect.style.display !== 'none')
            ? distritoFilterSelect.value : '';

        try {
            const res = await fetch(
                `api/estadisticas.php?id_tipo_eleccion=${idTipoEleccion}&distrito=${encodeURIComponent(distritoSeleccionado)}&_=${Date.now()}`
            );
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // ── Distritos dropdown ──
            if (distritoFilterSelect && data.distritos_disponibles) {
                const currentSelection = distritoFilterSelect.value;
                let distritosHtml = '<option value="TODOS" style="color:black;">Todos los distritos</option>';
                data.distritos_disponibles.forEach(d => {
                    distritosHtml += `<option value="${escapeHtml(d)}" style="color:black;">${escapeHtml(d)}</option>`;
                });
                distritoFilterSelect.innerHTML = distritosHtml;
                if (data.distritos_disponibles.includes(currentSelection)) {
                    distritoFilterSelect.value = currentSelection;
                }
            }

            // ── KPIs (smooth update) ──
            updateKPI('kpiMesas',     data.kpis.mesas_procesadas || 0);
            updateKPI('kpiVotantes',  data.kpis.total_votantes   || 0);
            updateKPI('kpiObservadas', data.kpis.observadas       || 0);

            // ── Prepare chart data ──
            const coloresBarras = [
                '#0071e3', '#32d74b', '#ff9f0a', '#ff453a',
                '#af52de', '#5e5ce6', '#64d2ff', '#ffd60a',
                '#30b0c7', '#bf5af2', '#ff375f', '#40c8e0'
            ];
            const partidos = data.partidos || [];
            const labelsPartidos = [];
            const datosPartidos  = [];
            const logoImages     = [];
            let totalVotosValidos = 0;

            partidos.forEach(p => {
                const v = parseInt(p.total_votos || 0);
                totalVotosValidos += v;
                labelsPartidos.push(p.siglas ? `${p.siglas} - ${p.nombre}` : p.nombre);
                datosPartidos.push(v);

                const img = new Image();
                img.src = p.simbolo_url || 'img/podemos_peru_logo.jpg';
                img.onload = () => { if (barChartInstance) barChartInstance.draw(); };
                logoImages.push(img);
            });

            const blancos    = parseInt(data.distribucion.blancos    || 0);
            const nulos      = parseInt(data.distribucion.nulos      || 0);
            const impugnados = parseInt(data.distribucion.impugnados || 0);

            // ── Charts: update if exist, create if first time ──
            if (!barChartInstance) {
                createBarChart(labelsPartidos, datosPartidos, logoImages, coloresBarras);
            } else {
                updateBarChart(labelsPartidos, datosPartidos, logoImages, coloresBarras);
            }

            if (!pieChartInstance) {
                createPieChart(totalVotosValidos, blancos, nulos, impugnados);
            } else {
                updatePieChart(totalVotosValidos, blancos, nulos, impugnados);
            }

            // ── Ranking (smooth diff: only rebuild if data changed) ──
            const newDataHash = JSON.stringify(partidos);
            if (!lastData || lastData !== newDataHash) {
                renderRankingBarras(partidos, totalVotosValidos, coloresBarras);
                lastData = newDataHash;

                // Blink the ranking update timestamp
                const tag = document.getElementById('rankingUpdateTag');
                if (tag) {
                    const now = new Date();
                    const hh = String(now.getHours()).padStart(2,'0');
                    const mm = String(now.getMinutes()).padStart(2,'0');
                    const ss = String(now.getSeconds()).padStart(2,'0');
                    tag.textContent = `Actualizado a las ${hh}:${mm}:${ss}`;
                    tag.style.color = '#32d74b';
                    setTimeout(() => { tag.style.color = '#86868b'; }, 2000);
                }
            }

        } catch (e) {
            console.error('Error cargando estadísticas:', e);
            if (!silent) {
                const rankingContainer = document.getElementById('partyRankingList');
                if (rankingContainer) {
                    rankingContainer.innerHTML = `<p style="color:#ff453a;text-align:center;">Error al cargar datos: ${e.message}</p>`;
                }
            }
        } finally {
            isLoading = false;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // AUTO-REFRESH LOOP
    // ─────────────────────────────────────────────────────────────
    function scheduleRefresh() {
        clearTimeout(autoRefreshTimer);
        startCountdown();

        autoRefreshTimer = setTimeout(async () => {
            const tipo = tipoEleccionSelect ? tipoEleccionSelect.value : 1;
            await loadDashboard(tipo, true); // silent = true (no error alerts)
            scheduleRefresh(); // schedule next
        }, REFRESH_INTERVAL * 1000);
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT LISTENERS — reset timer on manual filter change
    // ─────────────────────────────────────────────────────────────
    if (tipoEleccionSelect) {
        tipoEleccionSelect.addEventListener('change', () => {
            clearTimeout(autoRefreshTimer);
            clearInterval(countdownTimer);
            loadDashboard(tipoEleccionSelect.value).then(scheduleRefresh);
        });
    }

    if (distritoFilterSelect) {
        distritoFilterSelect.addEventListener('change', () => {
            clearTimeout(autoRefreshTimer);
            clearInterval(countdownTimer);
            loadDashboard(tipoEleccionSelect ? tipoEleccionSelect.value : 1).then(scheduleRefresh);
        });
    }

    // ─────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────
    loadDashboard(tipoEleccionSelect ? tipoEleccionSelect.value : 1)
        .then(scheduleRefresh);

    // ─────────────────────────────────────────────────────────────
    // LIMPIAR PROCESO ELECTORAL (solo admin)
    // ─────────────────────────────────────────────────────────────
    const btnLimpiar = document.getElementById('btnLimpiarProceso');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', async (e) => {
            e.preventDefault();
            const confirmacion = prompt(
                '⚠️ ZONA DE PELIGRO\n\nEsta acción eliminará de forma irreversible TODAS las actas y votos.\n\nEscribe CONFIRMAR en mayúsculas:'
            );
            if (confirmacion !== 'CONFIRMAR') {
                if (confirmacion !== null) alert('Operación cancelada. Palabra incorrecta.');
                return;
            }
            if (!confirm('¿Estás absolutamente seguro de empezar desde cero?')) return;

            btnLimpiar.disabled = true;
            btnLimpiar.innerHTML = 'Limpiando...';

            try {
                const res = await fetch('api/limpiar_proceso.php', { method: 'POST' });
                const text = await res.text();
                let json;
                try { json = JSON.parse(text); } catch { alert('❌ Respuesta inválida:\n' + text.substring(0, 200)); return; }
                if (json.success) {
                    alert('✅ Proceso electoral limpiado correctamente.');
                    window.location.reload();
                } else {
                    alert('❌ Error: ' + (json.message || 'No se pudo limpiar.'));
                }
            } catch (err) {
                alert('❌ Error de red: ' + err.message);
            } finally {
                btnLimpiar.disabled = false;
                btnLimpiar.innerHTML = 'Limpiar Proceso Electoral';
            }
        });
    }
});

// ─────────────────────────────────────────────────────────────────
// RANKING BARRAS HORIZONTALES
// ─────────────────────────────────────────────────────────────────
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
        const pct   = totalValidos > 0 ? ((votos / totalValidos) * 100).toFixed(1) : '0.0';
        const color = colores[index % colores.length];
        const logoUrl = p.simbolo_url || 'img/podemos_peru_logo.jpg';
        const nombreMostrar = p.siglas
            ? `<strong>${escapeHtml(p.siglas)}</strong> — ${escapeHtml(p.nombre)}`
            : escapeHtml(p.nombre);

        html += `
            <div style="background:rgba(255,255,255,0.025);border:0.5px solid rgba(255,255,255,0.07);border-radius:14px;padding:0.85rem 1.1rem;transition:all 0.2s ease;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;gap:1rem;flex-wrap:wrap;">
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <span style="font-size:0.8rem;font-weight:800;color:#86868b;min-width:20px;">#${index + 1}</span>
                        <img src="${logoUrl}" alt="${escapeHtml(p.nombre)}" style="width:32px;height:32px;border-radius:8px;object-fit:contain;background:#fff;padding:2px;border:1px solid rgba(255,255,255,0.15);flex-shrink:0;" onerror="this.src='img/podemos_peru_logo.jpg'">
                        <span style="font-size:0.88rem;color:#fff;">${nombreMostrar}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:1rem;">
                        <span style="font-size:1.05rem;font-weight:800;color:${color};">${votos.toLocaleString()} <span style="font-size:0.72rem;color:#86868b;font-weight:600;">votos</span></span>
                        <span style="font-size:0.82rem;font-weight:700;color:#fff;background:rgba(255,255,255,0.07);padding:0.2rem 0.55rem;border-radius:20px;border:0.5px solid rgba(255,255,255,0.1);min-width:58px;text-align:right;">${pct}%</span>
                    </div>
                </div>
                <div style="width:100%;height:8px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;transition:width 0.8s cubic-bezier(0.16,1,0.3,1);"></div>
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
