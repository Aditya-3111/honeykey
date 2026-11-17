<?php
session_start();
header('Content-Type: application/json');
$dir = __DIR__ . '/data'; $file = $dir . '/content.json';
$cfg = file_exists(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : require __DIR__ . '/config.sample.php';
$a = $_GET['action'] ?? 'content';
$in = json_decode(file_get_contents('php://input'), true) ?: [];
function out($d, $c = 200) { http_response_code($c); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
if ($a === 'content') out(file_exists($file) ? json_decode(file_get_contents($file), true) : null);
if ($a === 'login') {
  usleep(400000);
  if (hash_equals($cfg['password'], (string)($in['password'] ?? ''))) { session_regenerate_id(true); $_SESSION['ok'] = 1; out(['ok' => 1]); }
  out(['error' => 'bad'], 401);
}
if ($a === 'check') out(['ok' => !empty($_SESSION['ok'])]);
if ($a === 'logout') { session_destroy(); out(['ok' => 1]); }
if (empty($_SESSION['ok'])) out(['error' => 'auth'], 401);
if ($a === 'save') {
  if (!is_dir($dir)) mkdir($dir, 0755, true);
  file_put_contents($file, json_encode($in['content'] ?? [], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  out(['ok' => 1]);
}
if ($a === 'upload') {
  $f = $_FILES['file'] ?? null;
  if (!$f || $f['error']) out(['error' => 'upload'], 400);
  $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
  if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif']) || $f['size'] > 3 * 1024 * 1024) out(['error' => 'type/size'], 400);
  $up = dirname(__DIR__) . '/uploads'; if (!is_dir($up)) mkdir($up, 0755, true);
  $n = bin2hex(random_bytes(6)) . '.' . $ext;
  move_uploaded_file($f['tmp_name'], "$up/$n");
  out(['url' => "/uploads/$n"]);
}
out(['error' => 'unknown'], 404);
