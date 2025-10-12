<?php
// Data migration script: JSON to MySQL database
// Migrates existing arts.json data to database with version tracking

declare(strict_types=1);

require_once dirname(__DIR__) . '/inc/pdo.php';

function migrate_json_to_database(): void {
    echo "Starting migration from JSON to MySQL database...\n";

    $pdo = get_pdo();

    // Read existing JSON data
    $jsonFile = dirname(__DIR__) . '/data/arts.json';
    if (!file_exists($jsonFile)) {
        echo "No arts.json file found. Creating empty database.\n";
        return;
    }

    $jsonData = file_get_contents($jsonFile);
    if (!$jsonData) {
        echo "Failed to read arts.json\n";
        return;
    }

    $arts = json_decode($jsonData, true);
    if (!is_array($arts)) {
        echo "Invalid JSON format in arts.json\n";
        return;
    }

    $pdo->beginTransaction();

    try {
        $migratedCount = 0;

        foreach ($arts as $art) {
            // Validate required fields
            if (!isset($art['title'], $art['type'], $art['period'], $art['description'])) {
                echo "Skipping invalid art record: missing required fields\n";
                continue;
            }

            // Insert into arts table
            $stmtArt = $pdo->prepare("
                INSERT INTO arts (created_at) VALUES (?)
            ");
            $createdAt = $art['createdAt'] ?? date('c');
            $stmtArt->execute([$createdAt]);
            $artId = (int)$pdo->lastInsertId();

            // Insert initial version
            $stmtVersion = $pdo->prepare("
                INSERT INTO art_versions (
                    art_id, version_number, operation_type,
                    title, description, type, period, `condition`, locationNotes,
                    lat, lng, sensitive, privateLand, creditKnownArtist, image,
                    changed_fields, changed_by, created_at
                ) VALUES (
                    ?, 1, 'create',
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, NULL, ?
                )
            ");

            $changedFields = ['title', 'description', 'type', 'period'];
            if (!empty($art['condition'])) $changedFields[] = 'condition';
            if (!empty($art['locationNotes'])) $changedFields[] = 'locationNotes';
            if (isset($art['lat'], $art['lng'])) $changedFields = array_merge($changedFields, ['lat', 'lng']);
            if (!empty($art['sensitive'])) $changedFields[] = 'sensitive';
            if (!empty($art['privateLand'])) $changedFields[] = 'privateLand';
            if (!empty($art['creditKnownArtist'])) $changedFields[] = 'creditKnownArtist';
            if (!empty($art['image'])) $changedFields[] = 'image';

            $stmtVersion->execute([
                $artId,
                $art['title'],
                $art['description'],
                $art['type'],
                $art['period'],
                $art['condition'] ?? '',
                $art['locationNotes'] ?? '',
                isset($art['lat']) ? (float)$art['lat'] : null,
                isset($art['lng']) ? (float)$art['lng'] : null,
                !empty($art['sensitive']),
                !empty($art['privateLand']),
                !empty($art['creditKnownArtist']),
                $art['image'] ?? '',
                json_encode($changedFields),
                $createdAt
            ]);

            $versionId = (int)$pdo->lastInsertId();

            // Update arts table to point to this version
            $stmtUpdate = $pdo->prepare("
                UPDATE arts SET current_version_id = ? WHERE id = ?
            ");
            $stmtUpdate->execute([$versionId, $artId]);

            echo "Migrated art: {$art['title']} (ID: $artId, Version: $versionId)\n";
            $migratedCount++;
        }

        $pdo->commit();
        echo "\nMigration completed successfully!\n";
        echo "Migrated $migratedCount art records.\n";

        // Backup original JSON file
        $backupFile = $jsonFile . '.backup.' . date('Y-m-d-H-i-s');
        if (copy($jsonFile, $backupFile)) {
            echo "Original JSON backed up to: $backupFile\n";
        }

    } catch (Throwable $e) {
        $pdo->rollBack();
        echo "Migration failed: " . $e->getMessage() . "\n";
        throw $e;
    }
}

function setup_database(): void {
    echo "Setting up database schema...\n";

    $pdo = get_pdo();
    $schemaFile = __DIR__ . '/sql/schema.sql';

    if (!file_exists($schemaFile)) {
        echo "Schema file not found: $schemaFile\n";
        return;
    }

    $sql = file_get_contents($schemaFile);
    if (!$sql) {
        echo "Failed to read schema file\n";
        return;
    }

    // Execute schema (handle multiple statements)
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) { return !empty($stmt) && !preg_match('/^\s*--/', $stmt); }
    );

    foreach ($statements as $statement) {
        if (trim($statement)) {
            try {
                $pdo->exec($statement);
            } catch (Throwable $e) {
                // Ignore "table already exists" errors
                if (strpos($e->getMessage(), 'already exists') === false) {
                    echo "Warning: " . $e->getMessage() . "\n";
                }
            }
        }
    }

    echo "Database schema setup completed.\n";
}

// Main execution
if (php_sapi_name() === 'cli') {
    echo "=== Indigenous Art Atlas - Database Migration ===\n\n";

    try {
        setup_database();
        migrate_json_to_database();
        echo "\n=== Migration Process Completed ===\n";
    } catch (Throwable $e) {
        echo "ERROR: " . $e->getMessage() . "\n";
        exit(1);
    }
} else {
    echo "This script must be run from command line.\n";
    exit(1);
}
?>