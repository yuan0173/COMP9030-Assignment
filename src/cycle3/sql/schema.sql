-- Database schema for Indigenous Art Atlas - Cycle 3
-- Version management system with complete audit trail

SET FOREIGN_KEY_CHECKS = 0;

-- Main arts table (holds current state pointer)
CREATE TABLE IF NOT EXISTS arts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    current_version_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_arts_deleted (deleted_at),
    INDEX idx_arts_current_version (current_version_id)
);

-- Art versions table (complete snapshot per version)
CREATE TABLE IF NOT EXISTS art_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    art_id INT NOT NULL,
    version_number INT NOT NULL,
    operation_type ENUM('create', 'edit', 'rollback') NOT NULL DEFAULT 'edit',

    -- Content snapshot (all fields stored per version)
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('Cave Art', 'Mural') NOT NULL,
    period ENUM('Ancient', 'Contemporary') NOT NULL,
    `condition` VARCHAR(100) DEFAULT NULL,
    locationNotes TEXT DEFAULT NULL,
    lat DECIMAL(10,8) DEFAULT NULL,
    lng DECIMAL(11,8) DEFAULT NULL,
    sensitive TINYINT(1) DEFAULT 0,
    privateLand TINYINT(1) DEFAULT 0,
    creditKnownArtist TINYINT(1) DEFAULT 0,
    image VARCHAR(500) DEFAULT NULL,

    -- Version tracking metadata
    content_source_version_id INT DEFAULT NULL,
    rollback_from_version_id INT DEFAULT NULL,
    rollback_to_version_id INT DEFAULT NULL,
    changed_fields JSON DEFAULT NULL,
    change_reason TEXT DEFAULT NULL,
    changed_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_art_version (art_id, version_number),
    INDEX idx_art_versions_art (art_id),
    INDEX idx_art_versions_version (version_number),
    INDEX idx_art_versions_operation (operation_type),
    INDEX idx_art_versions_created (created_at),

    FOREIGN KEY (art_id) REFERENCES arts(id) ON DELETE CASCADE,
    FOREIGN KEY (content_source_version_id) REFERENCES art_versions(id) ON DELETE SET NULL,
    FOREIGN KEY (rollback_from_version_id) REFERENCES art_versions(id) ON DELETE SET NULL,
    FOREIGN KEY (rollback_to_version_id) REFERENCES art_versions(id) ON DELETE SET NULL
);

-- Update foreign key constraint for arts table
ALTER TABLE arts
ADD CONSTRAINT fk_arts_current_version
FOREIGN KEY (current_version_id) REFERENCES art_versions(id) ON DELETE SET NULL;

-- Users table for authentication (basic structure)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
);

-- Reports table for problem reporting
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    art_id INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    reported_by INT DEFAULT NULL,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_reports_art (art_id),
    INDEX idx_reports_status (status),
    INDEX idx_reports_created (created_at),

    FOREIGN KEY (art_id) REFERENCES arts(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS = 1;

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@iaa.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');