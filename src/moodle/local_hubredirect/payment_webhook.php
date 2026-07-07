<?php
declare(strict_types=1);

define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/finance_lib.php');

$payload = file_get_contents('php://input') ?: '';
$signature = (string)($_SERVER['HTTP_X_PREQURAN_SIGNATURE'] ?? $_SERVER['HTTP_X_SIGNATURE'] ?? $_SERVER['HTTP_X_PAYMENT_SIGNATURE'] ?? '');

header('Content-Type: application/json; charset=utf-8');
try {
    $result = pqfin_process_gateway_webhook($payload, $signature);
    if ((string)$result['status'] === 'invalid_signature') {
        http_response_code(401);
    }
    echo json_encode($result, JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 'failed', 'error' => $e->getMessage()], JSON_UNESCAPED_SLASHES);
}
