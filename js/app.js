document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const form = document.getElementById('actaForm');
    const inputTotalVotaron = document.getElementById('total_votaron');
    const inputElectoresHabiles = document.getElementById('electores_habiles');
    const partyInputs = document.querySelectorAll('.party-input');
    const inputBlancos = document.getElementById('votos_blancos');
    const inputNulos = document.getElementById('votos_nulos');
    const inputImpugnados = document.getElementById('votos_impugnados');
    
    const banner = document.getElementById('validationBanner');
    const textStatus = document.getElementById('validationText');
    const iconStatus = document.getElementById('validationIcon');
    const txtSumVotos = document.getElementById('sumVotos');
    const txtVotantes = document.getElementById('txtVotantes');
    const btnSubmit = document.getElementById('btnSubmit');

    // Escuchar cambios en todos los inputs numéricos para validación en tiempo real
    const allInputs = [...partyInputs, inputBlancos, inputNulos, inputImpugnados, inputTotalVotaron, inputElectoresHabiles];
    allInputs.forEach(input => {
        input.addEventListener('input', validateMath);
        // Seleccionar todo el texto al hacer click (UX)
        input.addEventListener('focus', function() { this.select(); });
    });

    function validateMath() {
        const totalVotaron = parseInt(inputTotalVotaron.value) || 0;
        const electoresHabiles = parseInt(inputElectoresHabiles.value) || 0;
        
        let sumPartidos = 0;
        partyInputs.forEach(inp => { sumPartidos += parseInt(inp.value) || 0; });
        
        const blancos = parseInt(inputBlancos.value) || 0;
        const nulos = parseInt(inputNulos.value) || 0;
        const impugnados = parseInt(inputImpugnados.value) || 0;

        const sumaTotalVotos = sumPartidos + blancos + nulos + impugnados;

        // Actualizar UI de totales
        txtSumVotos.textContent = sumaTotalVotos;
        txtVotantes.textContent = totalVotaron;

        let hasError = false;
        let errorMessage = "";

        // Regla 1: Votantes no puede ser 0 si se están metiendo datos (a menos que no hayan llegado)
        if (totalVotaron === 0 && sumaTotalVotos === 0) {
            setBannerState('neutral', 'Esperando ingreso de datos...', '⏳');
            btnSubmit.disabled = true;
            return;
        }

        // Regla 2: Votantes excede padrón
        if (totalVotaron > electoresHabiles && electoresHabiles > 0) {
            hasError = true;
            errorMessage = `Los votantes (${totalVotaron}) exceden los electores hábiles (${electoresHabiles}).`;
        } 
        // Regla 3: Inconsistencia matemática (Cuadre)
        else if (sumaTotalVotos !== totalVotaron) {
            hasError = true;
            let diferencia = totalVotaron - sumaTotalVotos;
            if (diferencia > 0) {
                errorMessage = `Faltan asignar ${diferencia} votos para cuadrar el acta.`;
            } else {
                errorMessage = `Sobran ${Math.abs(diferencia)} votos asignados.`;
            }
        }

        // Aplicar estilos según estado
        if (hasError) {
            setBannerState('error', errorMessage, '⚠️');
            btnSubmit.disabled = true;
        } else {
            setBannerState('success', '¡Cuadre aritmético perfecto! El acta está lista para guardar.', '✓');
            btnSubmit.disabled = false;
        }
    }

    function setBannerState(state, text, icon) {
        textStatus.textContent = text;
        iconStatus.textContent = icon;
        
        if (state === 'error') {
            banner.classList.add('error');
        } else {
            banner.classList.remove('error');
        }
    }

    // Manejo del Submit al Backend
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validar doble vez por si acaso
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Procesando...";

        const payload = {
            id_mesa: document.getElementById('id_mesa').value,
            tipo_eleccion: document.getElementById('tipo_eleccion').value,
            electores_habiles: parseInt(inputElectoresHabiles.value),
            total_votaron: parseInt(inputTotalVotaron.value),
            votos_blancos: parseInt(inputBlancos.value) || 0,
            votos_nulos: parseInt(inputNulos.value) || 0,
            votos_impugnados: parseInt(inputImpugnados.value) || 0,
            resultados: []
        };

        partyInputs.forEach(inp => {
            payload.resultados.push({
                id_partido: inp.getAttribute('data-partido'),
                votos: parseInt(inp.value) || 0
            });
        });

        try {
            const response = await fetch('api/guardar_acta.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Éxito: ${data.message}\nActa Guardada en estado: ${data.estado}`);
                form.reset();
                validateMath();
            } else {
                alert(`❌ Error del Servidor: ${data.message}`);
            }
        } catch (error) {
            alert(`⚠️ No se pudo conectar con el servidor (Backend PHP).\nAsegúrate de que Apache/MySQL estén corriendo.\nError: ${error.message}`);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Guardar Acta Electoral";
        }
    });

});
