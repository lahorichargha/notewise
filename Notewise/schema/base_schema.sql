CREATE TABLE IF NOT EXISTS object_id (
    id MEDIUMINT UNSIGNED UNIQUE NOT NULL AUTO_INCREMENT,
    user MEDIUMINT UNSIGNED,
    type ENUM('kernel','note','relationship','sandbox') NOT NULL,
    INDEX userIndex (user),
    PRIMARY KEY (id),
    FOREIGN KEY (user) REFERENCES user (id)
) ENGINE = MYISAM;

CREATE TABLE IF NOT EXISTS kernel (
    object_id MEDIUMINT UNSIGNED NOT NULL,
    name TINYTEXT,
    uri TINYTEXT,
    source TEXT,
    created DATETIME NOT NULL,
    lastModified TIMESTAMP NOT NULL,
    lastViewed TIMESTAMP NOT NULL,
    FULLTEXT INDEX kernelnames (name),
    INDEX kernelModified (lastModified),
    INDEX kernelViewed (lastViewed),
    KEY (object_id),
    -- "KEY" doubles as "INDEX" in MySQL evidently...
    KEY (name(255)),
    PRIMARY KEY (object_id),
    -- The PRIMARY KEY declaration guarantees uniqueness; MySQL doesn't like
    --   the UNIQUE keyword explicitly on the name field.
    FOREIGN KEY (object_id) REFERENCES object_id(id)
    -- Warning: Foreign keys not honored in MyISAM tables!  (And we can't use
    --   InnoDB tables because they have no full text search, and are optimized
    --   for OLTP, not retrieval-only.)
) ENGINE = MYISAM;

CREATE TABLE IF NOT EXISTS note (
    container_object MEDIUMINT UNSIGNED NOT NULL,
    object_id MEDIUMINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    created DATETIME NOT NULL,
    lastModified TIMESTAMP NOT NULL,
    x float,
    y float,
    width float,
    height float,
    FULLTEXT INDEX notes (content),
    INDEX containerNotes (container_object),
    PRIMARY KEY (object_id),
    FOREIGN KEY (object_id) REFERENCES object_id(id),
    FOREIGN KEY (container_object) REFERENCES object_id(id)
) ENGINE = MYISAM;

CREATE TABLE IF NOT EXISTS relationship_type (
    type_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    relationship_type TINYTEXT,
    PRIMARY KEY (type_id),
    KEY (relationship_type(255))
    -- (See above note for PRIMARY KEY declaration.)
) ENGINE = MYISAM;

CREATE TABLE IF NOT EXISTS relationship (
    relationship_id MEDIUMINT UNSIGNED NOT NULL,
    part1 MEDIUMINT UNSIGNED NOT NULL,
    part2 MEDIUMINT UNSIGNED NOT NULL,
    nav ENUM('fromleft','fromright','bi','non') NOT NULL,
    type SMALLINT UNSIGNED,
    INDEX part1relIndex (part1),
    INDEX part2relIndex (part2),
    PRIMARY KEY (relationship_id),
    FOREIGN KEY (relationship_id) REFERENCES object_id(id),
    FOREIGN KEY (part1) REFERENCES object_id(id),
    FOREIGN KEY (part2) REFERENCES object_id(id),
    FOREIGN KEY (type) REFERENCES relationship_type(type_id)
) ENGINE = MYISAM;

CREATE TABLE IF NOT EXISTS masked_relationship (
    relationship INT NOT NULL,
    container INT NOT NULL,
    PRIMARY KEY (relationship, container),
    INDEX relidIndex (relationship),
    INDEX containeridIndex (container),
    FOREIGN KEY (relationship) REFERENCES relationship(id),
    FOREIGN KEY (container) REFERENCES kernel(id)
) ENGINE = MYISAM;

CREATE TABLE IF NOT EXISTS contained_object (
    id MEDIUMINT UNSIGNED UNIQUE NOT NULL AUTO_INCREMENT,
    container_object MEDIUMINT UNSIGNED NOT NULL,
    contained_object MEDIUMINT UNSIGNED NOT NULL,
    x float,
    y float,
    width float,
    height float,
    collapsed TINYINT,
    -- Note: MySQL "BOOLEAN" type is just a synonym for TINYINT(1).  As in C,
    --   zero is false, nonzero is true.
    PRIMARY KEY (id),
    FOREIGN KEY (container_object) REFERENCES object_id(id),
    FOREIGN KEY (contained_object) REFERENCES object_id(id),
    INDEX objectsContainingObjects (container_object),
    INDEX objectsContainedInObjects (contained_object)
) ENGINE = MYISAM;

CREATE TABLE IF NOT EXISTS preference (
    user MEDIUMINT UNSIGNED,
    prefkey TINYTEXT NOT NULL,
    prefvalue TEXT,
    INDEX userIndex (user),
    PRIMARY KEY (prefkey(255),user),
    FOREIGN KEY (user) REFERENCES user (id)
);

CREATE TABLE IF NOT EXISTS quicksearch_choice (
    user MEDIUMINT UNSIGNED,
    exactSearchString VARCHAR(255) NOT NULL,
    chosenKernel INT NOT NULL,
    numberOfTimes INT NOT NULL,
    lastChosen TIMESTAMP NOT NULL,
    INDEX searchStringIndex (exactSearchString),
    INDEX userIndex (user),
    PRIMARY KEY (exactSearchString, chosenKernel, user),
    FOREIGN KEY (chosenKernel) REFERENCES kernel(id),
    FOREIGN KEY (user) REFERENCES user (id)
);

CREATE TABLE IF NOT EXISTS user (
    id MEDIUMINT UNSIGNED UNIQUE NOT NULL AUTO_INCREMENT,
    name varchar(255) not null,
    username varchar(255) not null,
    email varchar(255) unique not null,
    password varchar(100) not null,
    user_type INT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_type) REFERENCES user_type (id)
);

CREATE TABLE IF NOT EXISTS user_type (
    id MEDIUMINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name varchar(255),
    description varchar(255)
);
