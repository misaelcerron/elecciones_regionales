// js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    try {
        const res = await fetch('api/estadisticas.php');
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        // Actualizar KPIs
        document.getElementById('kpiMesas').textContent = data.kpis.mesas_procesadas || 0;
        document.getElementById('kpiVotantes').textContent = data.kpis.total_votantes || 0;
        document.getElementById('kpiObservadas').textContent = data.kpis.observadas || 0;

        // Preparar Datos para Gráfico de Barras (Partidos)
        const labelsPartidos = [];
        const datosPartidos = [];
        const coloresBarras = [
            'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(236, 72, 153, 0.8)',
            'rgba(20, 184, 166, 0.8)', 'rgba(249, 115, 22, 0.8)', 'rgba(99, 102, 241, 0.8)'
        ];

        data.partidos.forEach(p => {
            labelsPartidos.push(p.nombre);
            datosPartidos.push(p.total_votos || 0);
        });

        // Dibujar Gráfico de Barras
        const ctxBar = document.getElementById('barChart').getContext('2d');
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labelsPartidos,
                datasets: [{
                    label: 'Votos Válidos',
                    data: datosPartidos,
                    backgroundColor: coloresBarras,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Dibujar Gráfico de Pastel (Blancos/Nulos)
        // Sumamos los válidos de la gráfica de barras
        const totalValidos = datosPartidos.reduce((a, b) => a + parseInt(b), 0);
        const blancos = parseInt(data.distribucion.blancos || 0);
        const nulos = parseInt(data.distribucion.nulos || 0);
        const impugnados = parseInt(data.distribucion.impugnados || 0);

        const ctxPie = document.getElementById('pieChart').getContext('2d');
        new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['Válidos', 'Blancos', 'Nulos', 'Impugnados'],
                datasets: [{
                    data: [totalValidos, blancos, nulos, impugnados],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)', // Blue
                        'rgba(255, 255, 255, 0.6)', // White
                        'rgba(239, 68, 68, 0.8)', // Red
                        'rgba(245, 158, 11, 0.8)'  // Yellow
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                cutout: '70%',
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

    } catch (e) {
        console.error("Error cargando estadísticas:", e);
    }
});
