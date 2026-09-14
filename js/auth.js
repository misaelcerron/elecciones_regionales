// js/auth.js — Control de Autenticación y Permisos por Rol
document.addEventListener('DOMContentLoaded', async () => {
    // Si estamos en la página de login, no verificar auth
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1).toLowerCase() || 'index.html';
    
    if (currentPage === 'login.html') {
        return;
    }

    try {
        const res = await fetch('api/check_auth.php?_=' + new Date().getTime());
        const authData = await res.json();

        // 1. Si no está autenticado, redirigir al login
        if (!authData.authenticated) {
            window.location.href = 'login.html';
            return;
        }

        window.CURRENT_USER = authData;
        const rol = (authData.rol || 'DIGITADOR').toUpperCase();

        // 2. Control estricto de accesos por ROL:
        // ─────────────────────────────────────────────────────────────
        // DIGITADOR: SOLO puede ingresar votos (index.html)
        if (rol === 'DIGITADOR') {
            if (currentPage !== 'index.html') {
                window.location.href = 'index.html';
                return;
            }
        }

        // INVITADO: SOLO puede visualizar estadísticas en barras (dashboard.html)
        if (rol === 'INVITADO') {
            if (currentPage !== 'dashboard.html') {
                window.location.href = 'dashboard.html';
                return;
            }
        }

        // USUARIOS.HTML: SOLO para rol ADMIN
        if (currentPage === 'usuarios.html' && rol !== 'ADMIN') {
            window.location.href = (rol === 'DIGITADOR') ? 'index.html' : 'dashboard.html';
            return;
        }

        if (rol === 'ADMIN') {
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) adminPanel.style.display = 'block';
        }

        // 3. Adaptar Navbar según el Rol
        // ─────────────────────────────────────────────────────────────
        adaptNavbarForRole(rol, currentPage, authData.username);

        // 4. Configurar evento de Logout
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', async (e) => {
                e.preventDefault();
                await fetch('api/logout.php');
                window.location.href = 'login.html';
            });
        }

    } catch (e) {
        console.error("Error comprobando sesión:", e);
    }
});

function adaptNavbarForRole(rol, currentPage, username) {
    const navLinksContainer = document.querySelector('.navbar-links');
    
    if (navLinksContainer) {
        if (rol === 'DIGITADOR') {
            // Digitador solo ve Digitación
            navLinksContainer.innerHTML = `
                <a href="index.html" class="active" style="display:flex;align-items:center;gap:0.35rem;">
                    <span>✍️</span> Digitación de Votos
                </a>
            `;
        } else if (rol === 'INVITADO') {
            // Invitado solo ve Estadísticas / Resultados en barras
            navLinksContainer.innerHTML = `
                <a href="dashboard.html" class="active" style="display:flex;align-items:center;gap:0.35rem;">
                    <span>📊</span> Estadísticas y Resultados
                </a>
            `;
        } else if (rol === 'ADMIN') {
            // Admin ve todos los enlaces + Usuarios
            navLinksContainer.innerHTML = `
                <a href="dashboard.html" class="${currentPage === 'dashboard.html' ? 'active' : ''}">Dashboard</a>
                <a href="reportes.html" class="${currentPage === 'reportes.html' ? 'active' : ''}">Reportes</a>
                <a href="mesas.html" class="${currentPage === 'mesas.html' ? 'active' : ''}">Gestión Mesas</a>
                <a href="organizaciones.html" class="${currentPage === 'organizaciones.html' ? 'active' : ''}">Organizaciones</a>
                <a href="personeros.html" class="${currentPage === 'personeros.html' ? 'active' : ''}">Personeros</a>
                <a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">Digitación</a>
                <a href="usuarios.html" class="${currentPage === 'usuarios.html' ? 'active' : ''}">Usuarios</a>
            `;
        }
    }

    // Adaptar Menú Móvil (Drawer y Botón Hamburguesa)
    const navbar = document.querySelector('.navbar');
    if (navbar && !document.getElementById('navToggleBtn')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'navToggleBtn';
        toggleBtn.className = 'nav-toggle-btn';
        toggleBtn.setAttribute('aria-label', 'Abrir Menú');
        toggleBtn.innerHTML = '☰';
        navbar.appendChild(toggleBtn);

        // Crear Drawer Móvil
        const drawer = document.createElement('div');
        drawer.id = 'mobileNavDrawer';
        drawer.className = 'mobile-nav-drawer';

        let drawerLinksHtml = '';
        if (rol === 'DIGITADOR') {
            drawerLinksHtml = `
                <a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">✍️ Digitación de Votos</a>
            `;
        } else if (rol === 'INVITADO') {
            drawerLinksHtml = `
                <a href="dashboard.html" class="${currentPage === 'dashboard.html' ? 'active' : ''}">📊 Estadísticas y Resultados</a>
            `;
        } else if (rol === 'ADMIN') {
            drawerLinksHtml = `
                <a href="dashboard.html" class="${currentPage === 'dashboard.html' ? 'active' : ''}">📊 Dashboard</a>
                <a href="reportes.html" class="${currentPage === 'reportes.html' ? 'active' : ''}">📑 Reportes de Escrutinio</a>
                <a href="mesas.html" class="${currentPage === 'mesas.html' ? 'active' : ''}">🗳️ Gestión Mesas</a>
                <a href="organizaciones.html" class="${currentPage === 'organizaciones.html' ? 'active' : ''}">🏛️ Organizaciones Políticas</a>
                <a href="personeros.html" class="${currentPage === 'personeros.html' ? 'active' : ''}">👤 Gestión Personeros</a>
                <a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">✍️ Digitación de Actas</a>
                <a href="usuarios.html" class="${currentPage === 'usuarios.html' ? 'active' : ''}">👥 Gestión de Usuarios</a>
            `;
        }
        drawer.innerHTML = drawerLinksHtml;
        navbar.parentNode.insertBefore(drawer, navbar.nextSibling);

        // Toggle evento
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            drawer.classList.toggle('open');
            toggleBtn.innerHTML = drawer.classList.contains('open') ? '✕' : '☰';
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!drawer.contains(e.target) && e.target !== toggleBtn) {
                drawer.classList.remove('open');
                toggleBtn.innerHTML = '☰';
            }
        });
    }

    // Nombre de usuario y badge de rol en el navbar
    const userSpan = document.getElementById('navUsername');
    if (userSpan) {
        let badgeColor = '#60a5fa';
        let badgeBg = 'rgba(59,130,246,0.15)';
        let rolLabel = 'ADMIN';

        if (rol === 'DIGITADOR') {
            badgeColor = '#32d74b';
            badgeBg = 'rgba(50,215,75,0.15)';
            rolLabel = 'DIGITADOR';
        } else if (rol === 'INVITADO') {
            badgeColor = '#ffd60a';
            badgeBg = 'rgba(255,214,10,0.15)';
            rolLabel = 'INVITADO';
        }

        userSpan.innerHTML = `
            <span style="color:#fff;font-weight:600;">${escapeHtml(username)}</span>
            <span style="font-size:0.65rem;font-weight:700;letter-spacing:0.04em;padding:0.12rem 0.45rem;border-radius:99px;background:${badgeBg};color:${badgeColor};margin-left:0.35rem;border:0.5px solid ${badgeColor}40;">
                ${rolLabel}
            </span>
        `;
    }
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
