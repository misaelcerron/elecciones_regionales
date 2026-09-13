// js/usuarios.js — Lógica de Gestión de Usuarios
document.addEventListener('DOMContentLoaded', () => {
    let allUsuarios = [];
    let currentFilter = 'TODOS';
    let currentUserId = null;

    // Elementos UI
    const tbody = document.getElementById('usuariosTableBody');
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const btnNuevoUsuario = document.getElementById('btnNuevoUsuario');
    const modal = document.getElementById('userModal');
    const btnModalClose = document.getElementById('btnModalClose');
    const btnModalCancel = document.getElementById('btnModalCancel');
    const userForm = document.getElementById('userForm');
    const modalTitle = document.getElementById('modalTitle');
    const userIdInput = document.getElementById('userId');
    const formUsername = document.getElementById('formUsername');
    const formPassword = document.getElementById('formPassword');
    const passwordHint = document.getElementById('passwordHint');
    const roleRadios = document.querySelectorAll('input[name="formRol"]');
    const roleOptions = document.querySelectorAll('.role-option');

    // Inicializar
    cargarUsuarios();

    // Eventos Filtros y Búsqueda
    searchInput.addEventListener('input', renderTable);

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTable();
        });
    });

    // Eventos Modal
    btnNuevoUsuario.addEventListener('click', () => abrirModalCrear());
    btnModalClose.addEventListener('click', cerrarModal);
    btnModalCancel.addEventListener('click', cerrarModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    // Cambiar estilo de selección de tarjetas de rol
    roleRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            roleOptions.forEach(opt => opt.classList.remove('selected'));
            radio.closest('.role-option').classList.add('selected');
        });
    });

    // Enviar Formulario
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = userIdInput.value;
        const isEditing = Boolean(id);

        const username = formUsername.value.trim();
        const password = formPassword.value.trim();
        const selectedRadio = document.querySelector('input[name="formRol"]:checked');
        const rol = selectedRadio ? selectedRadio.value : 'DIGITADOR';

        if (!username) {
            showToast('El nombre de usuario es requerido.', 'error');
            return;
        }

        if (!isEditing && (!password || password.length < 4)) {
            showToast('La contraseña debe tener al menos 4 caracteres.', 'error');
            return;
        }

        if (isEditing && password && password.length < 4) {
            showToast('La nueva contraseña debe tener al menos 4 caracteres.', 'error');
            return;
        }

        const payload = {
            action: isEditing ? 'editar' : 'crear',
            id: isEditing ? id : undefined,
            username,
            password,
            rol
        };

        try {
            const res = await fetch('api/usuarios.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                showToast(data.message || 'Operación exitosa.', 'success');
                cerrarModal();
                cargarUsuarios();
            } else {
                showToast(data.message || 'Error al guardar.', 'error');
            }
        } catch (err) {
            showToast('Error de conexión con el servidor.', 'error');
        }
    });

    // Funciones principales
    async function cargarUsuarios() {
        try {
            const res = await fetch('api/usuarios.php?_=' + new Date().getTime());
            const data = await res.json();

            if (!data.success) {
                showToast(data.message || 'No se pudieron cargar los usuarios.', 'error');
                return;
            }

            allUsuarios = data.usuarios || [];
            currentUserId = data.current_user_id;

            // Actualizar KPIs
            if (data.stats) {
                document.getElementById('kpiTotal').textContent = data.stats.total || 0;
                document.getElementById('kpiDigitadores').textContent = data.stats.digitadores || 0;
                document.getElementById('kpiInvitados').textContent = data.stats.invitados || 0;
                document.getElementById('kpiAdmins').textContent = data.stats.admins || 0;
            }

            renderTable();
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ff453a; padding: 2rem;">Error de conexión al cargar usuarios.</td></tr>`;
        }
    }

    function renderTable() {
        const query = searchInput.value.toLowerCase().trim();

        const filtrados = allUsuarios.filter(u => {
            const matchRol = (currentFilter === 'TODOS') || (u.rol === currentFilter);
            const matchQuery = !query || u.username.toLowerCase().includes(query) || u.rol.toLowerCase().includes(query);
            return matchRol && matchQuery;
        });

        if (filtrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #86868b; padding: 2.5rem;">
                        No se encontraron usuarios coincidentes con el criterio de búsqueda.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtrados.forEach(u => {
            const isSelf = (parseInt(u.id) === parseInt(currentUserId));
            const avatarLetter = (u.username.charAt(0) || '?').toUpperCase();

            // Detalles por ROL
            let roleClass = 'digitador';
            let roleLabel = '✍️ DIGITADOR';
            let permDesc = 'Solo ingreso de votos en Digitación';

            if (u.rol === 'ADMIN') {
                roleClass = 'admin';
                roleLabel = '🛡️ ADMIN';
                permDesc = 'Acceso total a todos los módulos y usuarios';
            } else if (u.rol === 'INVITADO') {
                roleClass = 'invitado';
                roleLabel = '📊 INVITADO';
                permDesc = 'Solo visualización de estadísticas en barras';
            }

            const fecha = u.created_at ? formatFecha(u.created_at) : '—';

            html += `
                <tr>
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar">${avatarLetter}</div>
                            <div>
                                <div class="user-name">${escapeHtml(u.username)} ${isSelf ? '<span style="font-size:0.72rem;color:#60a5fa;font-weight:600;">(Tú)</span>' : ''}</div>
                                <div class="user-id-tag">ID: #${u.id}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="role-pill ${roleClass}">${roleLabel}</span>
                    </td>
                    <td>
                        <div class="perm-tag">
                            <span>🔒</span> ${permDesc}
                        </div>
                    </td>
                    <td style="color: #86868b; font-size: 0.8rem;">${fecha}</td>
                    <td style="text-align: right;">
                        <div class="actions-cell" style="justify-content: flex-end;">
                            <button class="btn-action" onclick="window.editarUsuario(${u.id})" title="Editar usuario">
                                ✏️ Editar
                            </button>
                            <button class="btn-action delete" onclick="window.eliminarUsuario(${u.id}, '${escapeHtml(u.username)}')" ${isSelf ? 'disabled title="No puedes eliminarte a ti mismo"' : ''} title="Eliminar usuario">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // Modal helpers
    function abrirModalCrear() {
        modalTitle.textContent = 'Nuevo Usuario';
        userIdInput.value = '';
        formUsername.value = '';
        formPassword.value = '';
        formPassword.required = true;
        passwordHint.textContent = 'Requerida al crear (mínimo 4 caracteres).';

        // Por defecto: DIGITADOR
        seleccionarRol('DIGITADOR');

        modal.classList.add('show');
        formUsername.focus();
    }

    window.editarUsuario = function(id) {
        const u = allUsuarios.find(x => parseInt(x.id) === parseInt(id));
        if (!u) return;

        modalTitle.textContent = 'Editar Usuario: ' + u.username;
        userIdInput.value = u.id;
        formUsername.value = u.username;
        formPassword.value = '';
        formPassword.required = false;
        passwordHint.textContent = 'Dejar en blanco para conservar la contraseña actual.';

        seleccionarRol(u.rol);

        modal.classList.add('show');
    };

    window.eliminarUsuario = async function(id, username) {
        if (!confirm(`¿Está seguro de eliminar al usuario "${username}"?\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const res = await fetch('api/usuarios.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'eliminar', id })
            });
            const data = await res.json();

            if (data.success) {
                showToast(data.message || 'Usuario eliminado correctamente.', 'success');
                cargarUsuarios();
            } else {
                showToast(data.message || 'No se pudo eliminar el usuario.', 'error');
            }
        } catch (err) {
            showToast('Error de comunicación con el servidor.', 'error');
        }
    };

    function seleccionarRol(rol) {
        roleOptions.forEach(opt => opt.classList.remove('selected'));
        const radio = document.querySelector(`input[name="formRol"][value="${rol}"]`);
        if (radio) {
            radio.checked = true;
            radio.closest('.role-option').classList.add('selected');
        }
    }

    function cerrarModal() {
        modal.classList.remove('show');
    }

    function formatFecha(str) {
        if (!str) return '—';
        try {
            const d = new Date(str.replace(' ', 'T'));
            return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return str;
        }
    }

    function showToast(msg, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMsg');
        const toastIcon = document.getElementById('toastIcon');

        toastMsg.textContent = msg;
        toastIcon.textContent = (type === 'success') ? '✅' : '⚠️';
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
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
