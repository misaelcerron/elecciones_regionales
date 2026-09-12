// js/auth.js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('api/check_auth.php');
        const authData = await res.json();

        // Si no está autenticado, redirigir al login
        if (!authData.authenticated) {
            window.location.href = 'login.html';
            return;
        }

        // Si está autenticado, mostrar su nombre en el navbar (si existe)
        const userSpan = document.getElementById('navUsername');
        if (userSpan) {
            userSpan.textContent = authData.username + " (" + authData.rol + ")";
        }

        // Evento de logout
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                await fetch('api/logout.php');
                window.location.href = 'login.html';
            });
        }

    } catch (e) {
        console.error("Error comprobando auth:", e);
    }
});
