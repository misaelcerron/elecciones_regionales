<?php
// api/organizaciones.php — CRUD de Organizaciones Políticas + subida de logos
// ODPE PASCO · Sistema Electoral

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';
// require_once __DIR__ . '/check_auth.php'; // Descomentar cuando auth esté activo

/* ══════════════════════════════════════════════════════════
   CONFIGURACIÓN DE LOGOS
══════════════════════════════════════════════════════════ */
define('UPLOAD_DIR', dirname(__DIR__) . '/uploads/logos/');
define('UPLOAD_URL', 'uploads/logos/');
define('MAX_FILE_SIZE', 2 * 1024 * 1024);  // 2 MB
define('ALLOWED_MIME', ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']);

// Crear carpeta si no existe
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
    // .htaccess de seguridad: sólo imágenes
    file_put_contents(UPLOAD_DIR . '.htaccess',
        "Options -Indexes\n<FilesMatch '\\.(php|php5|phtml|sh)$'>\n  Deny from all\n</FilesMatch>\n");
}

/* ══════════════════════════════════════════════════════════
   ROUTER
══════════════════════════════════════════════════════════ */
$method = $_SERVER['REQUEST_METHOD'];
$action = '';

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'list';
} else {
    $action = $_POST['action'] ?? '';
    if (empty($action)) {
        $body   = json_decode(file_get_contents('php://input'), true) ?? [];
        $action = $body['action'] ?? '';
    }
}

switch ($action) {
    case 'list':   listarOrganizaciones();   break;
    case 'get':    obtenerOrganizacion();    break;
    case 'create': crearOrganizacion();      break;
    case 'update': actualizarOrganizacion(); break;
    case 'delete': eliminarOrganizacion();   break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Acción no reconocida: ' . $action]);
}

/* ══════════════════════════════════════════════════════════
   LISTAR
══════════════════════════════════════════════════════════ */
function listarOrganizaciones() {
    global $pdo;
    try {
        $stmt = $pdo->query(
            "SELECT id_partido, nombre, siglas, simbolo_url
             FROM organizacion_politica
             ORDER BY nombre ASC"
        );
        $rows = $stmt->fetchAll();
        // Convertir URL relativa a absoluta si hay dominio
        foreach ($rows as &$row) {
            if ($row['simbolo_url']) {
                $row['simbolo_url'] = construirUrlLogo($row['simbolo_url']);
            }
        }
        echo json_encode(['success' => true, 'data' => $rows]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/* ══════════════════════════════════════════════════════════
   OBTENER UNO
══════════════════════════════════════════════════════════ */
function obtenerOrganizacion() {
    global $pdo;
    $id = intval($_GET['id'] ?? 0);
    if (!$id) { respuesta400('ID inválido'); return; }

    try {
        $stmt = $pdo->prepare(
            "SELECT id_partido, nombre, siglas, simbolo_url FROM organizacion_politica WHERE id_partido = ?"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'No encontrado']); return; }
        if ($row['simbolo_url']) $row['simbolo_url'] = construirUrlLogo($row['simbolo_url']);
        echo json_encode(['success' => true, 'data' => $row]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/* ══════════════════════════════════════════════════════════
   CREAR
══════════════════════════════════════════════════════════ */
function crearOrganizacion() {
    global $pdo;

    $nombre = trim($_POST['nombre'] ?? '');
    $siglas = trim($_POST['siglas'] ?? '') ?: null;

    if (empty($nombre)) { respuesta400('El nombre es obligatorio'); return; }
    if (mb_strlen($nombre) > 150) { respuesta400('El nombre supera los 150 caracteres'); return; }

    // Subir logo si viene
    $logoPath = null;
    if (!empty($_FILES['logo']['tmp_name'])) {
        $resultado = subirLogo($_FILES['logo']);
        if (!$resultado['success']) { respuesta400($resultado['message']); return; }
        $logoPath = $resultado['path'];
    }

    try {
        // Verificar duplicado
        $check = $pdo->prepare("SELECT id_partido FROM organizacion_politica WHERE nombre = ?");
        $check->execute([$nombre]);
        if ($check->fetch()) { respuesta400('Ya existe una organización con ese nombre'); return; }

        $stmt = $pdo->prepare(
            "INSERT INTO organizacion_politica (nombre, siglas, simbolo_url) VALUES (?, ?, ?)"
        );
        $stmt->execute([$nombre, $siglas, $logoPath]);
        $id = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Organización creada correctamente',
            'id'      => (int)$id,
            'logo_url' => $logoPath ? construirUrlLogo($logoPath) : null
        ]);
    } catch (PDOException $e) {
        if ($logoPath) @unlink(UPLOAD_DIR . basename($logoPath));
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/* ══════════════════════════════════════════════════════════
   ACTUALIZAR
══════════════════════════════════════════════════════════ */
function actualizarOrganizacion() {
    global $pdo;

    $id     = intval($_POST['id'] ?? 0);
    $nombre = trim($_POST['nombre'] ?? '');
    $siglas = trim($_POST['siglas'] ?? '') ?: null;

    if (!$id)         { respuesta400('ID inválido'); return; }
    if (empty($nombre)) { respuesta400('El nombre es obligatorio'); return; }

    // Obtener registro actual
    $stmt = $pdo->prepare("SELECT simbolo_url FROM organizacion_politica WHERE id_partido = ?");
    $stmt->execute([$id]);
    $actual = $stmt->fetch();
    if (!$actual) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Organización no encontrada']); return; }

    $logoPath = $actual['simbolo_url']; // Mantener logo actual por defecto

    // Subir nuevo logo si viene
    if (!empty($_FILES['logo']['tmp_name'])) {
        $resultado = subirLogo($_FILES['logo']);
        if (!$resultado['success']) { respuesta400($resultado['message']); return; }
        // Eliminar logo anterior
        if ($logoPath) eliminarLogoFisico($logoPath);
        $logoPath = $resultado['path'];
    }

    try {
        $check = $pdo->prepare(
            "SELECT id_partido FROM organizacion_politica WHERE nombre = ? AND id_partido != ?"
        );
        $check->execute([$nombre, $id]);
        if ($check->fetch()) { respuesta400('Ya existe otra organización con ese nombre'); return; }

        $stmt = $pdo->prepare(
            "UPDATE organizacion_politica SET nombre = ?, siglas = ?, simbolo_url = ? WHERE id_partido = ?"
        );
        $stmt->execute([$nombre, $siglas, $logoPath, $id]);

        echo json_encode([
            'success'  => true,
            'message'  => 'Organización actualizada correctamente',
            'logo_url' => $logoPath ? construirUrlLogo($logoPath) : null
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/* ══════════════════════════════════════════════════════════
   ELIMINAR
══════════════════════════════════════════════════════════ */
function eliminarOrganizacion() {
    global $pdo;

    $id = intval($_POST['id'] ?? 0);
    if (!$id) { respuesta400('ID inválido'); return; }

    try {
        // Verificar dependencias con votos
        $dep = $pdo->prepare("SELECT COUNT(*) FROM voto_resultado WHERE id_partido = ?");
        $dep->execute([$id]);
        if ($dep->fetchColumn() > 0) {
            respuesta400('No se puede eliminar: existen votos registrados para esta organización');
            return;
        }

        // Obtener logo para borrar el archivo
        $stmt = $pdo->prepare("SELECT simbolo_url FROM organizacion_politica WHERE id_partido = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'No encontrada']); return; }

        $stmt = $pdo->prepare("DELETE FROM organizacion_politica WHERE id_partido = ?");
        $stmt->execute([$id]);

        if ($row['simbolo_url']) eliminarLogoFisico($row['simbolo_url']);

        echo json_encode(['success' => true, 'message' => 'Organización eliminada']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/* ══════════════════════════════════════════════════════════
   SUBIDA DE LOGO
══════════════════════════════════════════════════════════ */
function subirLogo(array $file): array {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'Error al subir el archivo (código ' . $file['error'] . ')'];
    }
    if ($file['size'] > MAX_FILE_SIZE) {
        return ['success' => false, 'message' => 'El archivo supera el límite de 2 MB'];
    }

    // Validar MIME real (no el que dice el cliente)
    $finfo    = new finfo(FILEINFO_MIME_TYPE);
    $mimeReal = $finfo->file($file['tmp_name']);

    if (!in_array($mimeReal, ALLOWED_MIME, true)) {
        return ['success' => false, 'message' => "Tipo de archivo no permitido ($mimeReal)"];
    }

    // Extensión segura
    $extMap = [
        'image/png'     => 'png',
        'image/jpeg'    => 'jpg',
        'image/gif'     => 'gif',
        'image/webp'    => 'webp',
        'image/svg+xml' => 'svg',
    ];
    $ext      = $extMap[$mimeReal];
    $filename = 'logo_' . uniqid('', true) . '.' . $ext;
    $destino  = UPLOAD_DIR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destino)) {
        return ['success' => false, 'message' => 'No se pudo guardar el archivo en el servidor'];
    }

    return ['success' => true, 'path' => UPLOAD_URL . $filename];
}

function eliminarLogoFisico(string $path): void {
    $full = dirname(__DIR__) . '/' . $path;
    if (file_exists($full)) @unlink($full);
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function construirUrlLogo(string $path): string {
    // Si la URL ya es absoluta (http/https) la devuelve tal cual
    if (str_starts_with($path, 'http')) return $path;
    // Construir URL relativa al dominio del request
    $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host  = $_SERVER['HTTP_HOST'] ?? 'localhost';
    // Obtener la ruta base del proyecto (asume que index.php está en /elecciones/)
    $basePath = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/');
    return $proto . '://' . $host . $basePath . '/' . ltrim($path, '/');
}

function respuesta400(string $msg): void {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $msg]);
}
