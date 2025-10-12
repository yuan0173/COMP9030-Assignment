<?php
// Cycle 3 setup script - initializes database and migrates data
// Run this script to prepare the environment for testing

declare(strict_types=1);

echo "=== Indigenous Art Atlas - Cycle 3 Setup ===\n\n";

// Check environment variables
$requiredEnvVars = ['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD'];
$missingVars = [];

foreach ($requiredEnvVars as $var) {
    if (!getenv($var)) {
        $missingVars[] = $var;
    }
}

if (!empty($missingVars)) {
    echo "ERROR: Missing required environment variables:\n";
    foreach ($missingVars as $var) {
        echo "  - $var\n";
    }
    echo "\nPlease set these environment variables before running the setup:\n";
    echo "export MYSQL_HOST=127.0.0.1\n";
    echo "export MYSQL_DATABASE=your_database_name\n";
    echo "export MYSQL_USER=your_username\n";
    echo "export MYSQL_PASSWORD=your_password\n";
    echo "export MYSQL_PORT=3306  # optional, defaults to 3306\n\n";
    exit(1);
}

echo "Environment variables configured:\n";
foreach ($requiredEnvVars as $var) {
    $value = getenv($var);
    $displayValue = ($var === 'MYSQL_PASSWORD') ? str_repeat('*', strlen($value)) : $value;
    echo "  $var = $displayValue\n";
}
echo "\n";

// Test database connection
echo "Testing database connection...\n";
try {
    require_once dirname(__DIR__) . '/inc/pdo.php';
    $pdo = get_pdo();
    echo "✅ Database connection successful!\n\n";
} catch (Throwable $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    echo "\nPlease check your database settings and ensure MySQL is running.\n";
    exit(1);
}

// Run migration
echo "Running database setup and migration...\n";
try {
    require __DIR__ . '/migrate.php';
} catch (Throwable $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Setup completed successfully! ===\n\n";

echo "Next steps:\n";
echo "1. Start the PHP development server:\n";
echo "   cd .. && php -S localhost:8000 -t .\n\n";
echo "2. Test the API endpoints:\n";
echo "   # List all arts:\n";
echo "   curl -s \"http://localhost:8000/api/arts.php\"\n\n";
echo "   # Create new art:\n";
echo "   curl -s -X POST -H \"Content-Type: application/json\" \\\n";
echo "     -d '{\"title\":\"Demo\",\"type\":\"Mural\",\"period\":\"Contemporary\",\"condition\":\"Good\",\"description\":\"Sample\"}' \\\n";
echo "     \"http://localhost:8000/api/arts.php\"\n\n";
echo "   # Check version history:\n";
echo "   curl -s \"http://localhost:8000/api/art_versions.php?art_id=1\"\n\n";
echo "3. Test rollback functionality:\n";
echo "   curl -s -X POST \"http://localhost:8000/api/art_versions.php?action=rollback\" \\\n";
echo "     -H \"Content-Type: application/json\" \\\n";
echo "     -d '{\"art_id\":1,\"target_version\":1,\"rollback_type\":\"full\",\"reason\":\"test rollback\"}'\n\n";

echo "The system is now ready for Cycle 3 testing and demonstration!\n";
?>