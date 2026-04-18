-- SmartResto ESMT - MySQL Schema

CREATE DATABASE IF NOT EXISTS smartresto;
USE smartresto;

-- Tables

CREATE TABLE IF NOT EXISTS utilisateurs (
    id CHAR(36) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    motDePasse VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'ADMINISTRATEUR', 'CUISINIER', 'GESTIONNAIRE', 'ETUDIANT') NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    emailVerifie BOOLEAN DEFAULT FALSE,
    dateCreation DATETIME DEFAULT CURRENT_TIMESTAMP,
    numeroEtudiant VARCHAR(50),
    classe VARCHAR(50),
    filiere VARCHAR(100),
    allergenes JSON,
    autresRestrictions TEXT,
    pointsESMT INT DEFAULT 0,
    niveauFidelite ENUM('BRONZE', 'ARGENT', 'OR', 'PLATINE') DEFAULT 'BRONZE',
    niveauAcces VARCHAR(20),
    estSuperAdmin BOOLEAN DEFAULT FALSE,
    poste VARCHAR(100),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

CREATE TABLE IF NOT EXISTS plats (
    id CHAR(36) PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    prixFCFA INT NOT NULL,
    categorie ENUM('entree', 'plat_principal', 'dessert', 'boisson') DEFAULT 'plat_principal',
    allergenes JSON,
    estDisponible BOOLEAN DEFAULT TRUE,
    estRepasEco BOOLEAN DEFAULT FALSE,
    noteMoyenne DECIMAL(3,1) DEFAULT 0,
    emoji VARCHAR(10),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categorie (categorie),
    INDEX idx_disponible (estDisponible)
);

CREATE TABLE IF NOT EXISTS commandes (
    id CHAR(36) PRIMARY KEY,
    etudiantId CHAR(36) NOT NULL,
    platId CHAR(36) NOT NULL,
    creneauId CHAR(36) NOT NULL,
    dateHeure DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('EN_ATTENTE', 'CONFIRME', 'EN_PREPARATION', 'PRETE', 'RETIREE', 'ANNULEE') DEFAULT 'EN_ATTENTE',
    montantFCFA INT NOT NULL,
    pointsGagnes INT DEFAULT 0,
    methodePaiement ENUM('WAVE', 'ORANGE_MONEY', 'CARTE', 'ESPECES') DEFAULT 'WAVE',
    qrCode TEXT,
    qrExpireA DATETIME,
    typeCommande ENUM('EN_LIGNE', 'SUR_PLACE') DEFAULT 'EN_LIGNE',
    retireeA DATETIME,
    FOREIGN KEY (etudiantId) REFERENCES utilisateurs(id),
    FOREIGN KEY (platId) REFERENCES plats(id),
    INDEX idx_etudiant (etudiantId),
    INDEX idx_statut (statut),
    INDEX idx_date (dateHeure)
);

CREATE TABLE IF NOT EXISTS paiements (
    id CHAR(36) PRIMARY KEY,
    commandeId CHAR(36) NOT NULL,
    montantFCFA INT NOT NULL,
    methode ENUM('WAVE', 'ORANGE_MONEY', 'CARTE', 'ESPECES') DEFAULT 'WAVE',
    statut ENUM('EN_ATTENTE', 'CONFIRME', 'ANNULEE') DEFAULT 'CONFIRME',
    referenceExterne VARCHAR(100),
    dateHeure DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commandeId) REFERENCES commandes(id)
);

CREATE TABLE IF NOT EXISTS feedbacks (
    id CHAR(36) PRIMARY KEY,
    commandeId CHAR(36) NOT NULL,
    etudiantId CHAR(36) NOT NULL,
    noteGout INT NOT NULL,
    noteTemperature INT NOT NULL,
    notePortion INT NOT NULL,
    commentaire TEXT,
    dateSoumission DATETIME DEFAULT CURRENT_TIMESTAMP,
    pointsCredites INT DEFAULT 5,
    FOREIGN KEY (commandeId) REFERENCES commandes(id),
    FOREIGN KEY (etudiantId) REFERENCES utilisateurs(id)
);

CREATE TABLE IF NOT EXISTS stocks (
    id CHAR(36) PRIMARY KEY,
    ingredient VARCHAR(200) NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    unite VARCHAR(20) DEFAULT 'kg',
    seuilAlerte DECIMAL(10,2) DEFAULT 5,
    dernierMaj DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ingredient (ingredient)
);

CREATE TABLE IF NOT EXISTS fournisseurs (
    id CHAR(36) PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    contact VARCHAR(100),
    delaiLivraison INT DEFAULT 1,
    ingredientsFournis JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creneaux (
    id CHAR(36) PRIMARY KEY,
    heureDebut TIME NOT NULL,
    heureFin TIME NOT NULL,
    capaciteMax INT DEFAULT 100,
    nbReservations INT DEFAULT 0,
    estCreneauCalme BOOLEAN DEFAULT FALSE,
    bonusPoints INT DEFAULT 5,
    INDEX idx_heure (heureDebut)
);

CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    destinataire CHAR(36) NOT NULL,
    lue BOOLEAN DEFAULT FALSE,
    dateEnvoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destinataire) REFERENCES utilisateurs(id),
    INDEX idx_dest (destinataire),
    INDEX idx_lue (lue)
);

-- Données initiales

INSERT INTO creneaux (id, heureDebut, heureFin, capaciteMax, nbReservations, estCreneauCalme, bonusPoints) VALUES
('c1', '07:30:00', '09:00:00', 80, 0, FALSE, 5),
('c2', '09:00:00', '10:30:00', 80, 0, TRUE, 20),
('c3', '12:00:00', '13:30:00', 150, 0, FALSE, 5),
('c4', '13:30:00', '15:00:00', 150, 0, TRUE, 15);

INSERT INTO stocks (id, ingredient, quantite, unite, seuilAlerte) VALUES
('s1', 'Riz', 50, 'kg', 10),
('s2', 'Poisson', 8, 'kg', 5),
('s3', 'Poulet', 4, 'kg', 5),
('s4', 'Oignons', 15, 'kg', 3),
('s5', 'Tomates', 2, 'kg', 3),
('s6', 'Pâte d''arachide', 6, 'kg', 2);

INSERT INTO fournisseurs (id, nom, contact, delaiLivraison, ingredientsFournis) VALUES
('f1', 'Marché Sandaga', '+221 77 123 45 67', 1, '["Légumes", "Poisson", "Viande"]'),
('f2', 'SEDIMA', '+221 33 456 78 90', 2, '["Poulet", "Oeufs"]');

INSERT INTO plats (id, nom, description, prixFCFA, categorie, allergenes, estDisponible, estRepasEco, noteMoyenne, emoji) VALUES
(UUID(), 'Thiéboudienne', 'Riz au poisson Sénégalais', 1500, 'plat_principal', '["poisson"]', TRUE, FALSE, 4.7, '🐟'),
(UUID(), 'Yassa Poulet', 'Poulet mariné aux oignons et citron', 1200, 'plat_principal', '[]', TRUE, FALSE, 4.5, '🍗'),
(UUID(), 'Mafé', 'Ragoût à la pâte d''arachide', 1000, 'plat_principal', '["arachides"]', TRUE, FALSE, 4.3, '🥜'),
(UUID(), 'Salade Composée', 'Salade fraîche de saison', 500, 'entree', '[]', TRUE, FALSE, 4.0, '🥗'),
(UUID(), 'Jus de Bissap', 'Jus d''hibiscus maison', 300, 'boisson', '[]', TRUE, FALSE, 4.8, '🍹'),
(UUID(), 'Repas Eco', 'Plat du jour anti-gaspillage -30%', 700, 'plat_principal', '[]', TRUE, TRUE, 4.1, '♻️');