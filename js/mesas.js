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

    // Función global para que funcione el onclick del HTML inyectado
    window.editarMesa = function(id, electores) {
        inputId.value = id;
        inputElectores.value = electores;
        inputId.readOnly = true; // Proteger ID en edición
        btnGuardar.textContent = "Actualizar Mesa";
    };
});
