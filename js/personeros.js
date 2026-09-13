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

        const filtrados = personerosData.filter(p => 
            p.nombres_apellidos.toLowerCase().includes(query) ||
            p.dni.toLowerCase().includes(query) ||
            p.id_mesa.toLowerCase().includes(query)
        );

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

    loadPersoneros();
});
