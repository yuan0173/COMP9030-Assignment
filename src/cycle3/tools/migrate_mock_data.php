<?php
// Migration script to import Cycle 2 mock artwork data into Cycle 3 database
// Migrates 6 mock artworks with their images and metadata

declare(strict_types=1);

require_once __DIR__ . '/../../inc/pdo.php';

function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

$mockArtworks = [
    [
        'title' => 'Blue Mountains Ancient Engravings',
        'description' => 'Traditional Aboriginal rock engravings depicting hunting scenes and sacred symbols',
        'type' => 'Cave Art',
        'period' => 'Ancient',
        'condition' => 'Good',
        'image' => '/uploads/arts/6/featuredart1.jpg',
        'locationNotes' => 'Blue Mountains National Park, New South Wales',
        'lat' => -33.7152,
        'lng' => 150.3107,
        'sensitive' => 0,
        'privateLand' => 0,
        'creditKnownArtist' => 0
    ],
    [
        'title' => 'Melbourne Urban Indigenous Mural',
        'description' => 'Contemporary street art celebrating urban Aboriginal culture in Melbourne CBD',
        'type' => 'Mural',
        'period' => 'Contemporary',
        'condition' => 'Excellent',
        'image' => '/uploads/arts/7/featuredart2.jpg',
        'locationNotes' => 'Melbourne CBD, Victoria',
        'lat' => -37.8136,
        'lng' => 144.9631,
        'sensitive' => 1,
        'privateLand' => 0,
        'creditKnownArtist' => 1
    ],
    [
        'title' => 'Carnarvon Gorge Rock Art',
        'description' => 'Ancient Aboriginal cave paintings and hand stencils in Queensland highlands',
        'type' => 'Cave Art',
        'period' => 'Ancient',
        'condition' => 'Fair',
        'image' => '/uploads/arts/8/featuredart3.jpg',
        'locationNotes' => 'Carnarvon Gorge, Queensland',
        'lat' => -25.0,
        'lng' => 148.0,
        'sensitive' => 0,
        'privateLand' => 1,
        'creditKnownArtist' => 0
    ],
    [
        'title' => 'Fremantle Cultural Center Mural',
        'description' => 'Modern Aboriginal artwork celebrating Noongar heritage and connection to country',
        'type' => 'Mural',
        'period' => 'Contemporary',
        'condition' => 'Excellent',
        'image' => '/uploads/arts/9/fremantle_cultural.avif',
        'locationNotes' => 'Fremantle Cultural Centre, Western Australia',
        'lat' => -32.0569,
        'lng' => 115.7574,
        'sensitive' => 0,
        'privateLand' => 0,
        'creditKnownArtist' => 1
    ],
    [
        'title' => 'Flinders Ranges Sacred Site',
        'description' => 'Sacred Aboriginal cave art with ceremonial significance in South Australian outback',
        'type' => 'Cave Art',
        'period' => 'Ancient',
        'condition' => 'Good',
        'image' => '/uploads/arts/10/aih_artwork.jpg',
        'locationNotes' => 'Flinders Ranges, South Australia',
        'lat' => -31.2,
        'lng' => 138.6,
        'sensitive' => 1,
        'privateLand' => 0,
        'creditKnownArtist' => 0
    ],
    [
        'title' => 'MONA Aboriginal Art Installation',
        'description' => 'Contemporary indigenous art installation exploring themes of identity and place',
        'type' => 'Mural',
        'period' => 'Contemporary',
        'condition' => 'Excellent',
        'image' => '/uploads/arts/11/mona_installation.webp',
        'locationNotes' => 'Museum of Old and New Art, Hobart, Tasmania',
        'lat' => -42.8821,
        'lng' => 147.3272,
        'sensitive' => 0,
        'privateLand' => 0,
        'creditKnownArtist' => 1
    ]
];

try {
    $pdo = get_pdo();
    $pdo->beginTransaction();

    echo "Starting migration of " . count($mockArtworks) . " mock artworks...\n";

    foreach ($mockArtworks as $index => $artwork) {
        echo "Migrating artwork " . ($index + 1) . ": " . e($artwork['title']) . "\n";

        // Insert into arts table first
        $artSql = "INSERT INTO arts (created_at, deleted_at) VALUES (NOW(), NULL)";
        $artStmt = $pdo->prepare($artSql);
        $artStmt->execute();
        $artId = (int)$pdo->lastInsertId();

        // Insert into art_versions table
        $versionSql = "INSERT INTO art_versions (
            art_id, version_number, operation_type, title, description, `type`, period,
            `condition`, locationNotes, lat, lng, `sensitive`, privateLand,
            creditKnownArtist, image, created_at
        ) VALUES (
            :art_id, 1, 'create', :title, :description, :type, :period,
            :condition, :locationNotes, :lat, :lng, :sensitive, :privateLand,
            :creditKnownArtist, :image, NOW()
        )";

        $versionStmt = $pdo->prepare($versionSql);
        $versionStmt->execute([
            ':art_id' => $artId,
            ':title' => $artwork['title'],
            ':description' => $artwork['description'],
            ':type' => $artwork['type'],
            ':period' => $artwork['period'],
            ':condition' => $artwork['condition'],
            ':locationNotes' => $artwork['locationNotes'],
            ':lat' => $artwork['lat'],
            ':lng' => $artwork['lng'],
            ':sensitive' => $artwork['sensitive'],
            ':privateLand' => $artwork['privateLand'],
            ':creditKnownArtist' => $artwork['creditKnownArtist'],
            ':image' => $artwork['image']
        ]);

        $versionId = (int)$pdo->lastInsertId();

        // Update arts table with current_version_id
        $updateSql = "UPDATE arts SET current_version_id = :version_id WHERE id = :art_id";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([
            ':version_id' => $versionId,
            ':art_id' => $artId
        ]);

        echo "  → Created art ID: $artId, version ID: $versionId\n";
    }

    $pdo->commit();

    // Verify migration
    $countSql = "SELECT COUNT(*) FROM arts WHERE deleted_at IS NULL";
    $totalCount = (int)$pdo->query($countSql)->fetchColumn();

    echo "\n✅ Migration completed successfully!\n";
    echo "Total artworks in database: $totalCount\n";
    echo "Mock artworks migrated: " . count($mockArtworks) . "\n";

} catch (Throwable $e) {
    $pdo->rollback();
    echo "\n❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>