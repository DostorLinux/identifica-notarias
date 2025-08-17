-- noinspection SqlNoDataSourceInspectionForFile
-- Updated schema based on current database dump
-- This schema reflects the actual structure of access_control_test database

CREATE TABLE `user` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `doc_id` VARCHAR(50) DEFAULT NULL,
    `sec_id` VARCHAR(50) DEFAULT NULL,
    `username` VARCHAR(50) DEFAULT NULL,
    `first_name` VARCHAR(100) DEFAULT NULL,
    `last_name` VARCHAR(100) DEFAULT NULL,
    `password` VARCHAR(100) DEFAULT NULL,
    `pub_id` VARCHAR(37) DEFAULT NULL,
    `email` VARCHAR(100) DEFAULT NULL,
    `role` VARCHAR(20) DEFAULT NULL,
    `active` CHAR(1) DEFAULT 'Y',
    `isDenied` TINYINT(1) DEFAULT '0',
    `deniedNote` TEXT,
    `pin` VARCHAR(10) DEFAULT NULL,
    `vector` TEXT,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT NULL,
    `nationality` VARCHAR(100) DEFAULT NULL,
    `created_by` INT DEFAULT '0',
    `has_expiration` TINYINT(1) DEFAULT '0',
    `expiration_date` DATE DEFAULT NULL,
    `user_type` VARCHAR(50) DEFAULT NULL,
    `create_invitation_allowed` TINYINT(1) DEFAULT '0',
    `phone` VARCHAR(10) DEFAULT NULL,
    `department` VARCHAR(10) DEFAULT NULL,
    `must_change_password` TINYINT(1) DEFAULT '0',
    PRIMARY KEY (`id`),
    KEY `ndx_user_doc` (`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Valid user roles: api, admin, normal, user, super_admin, worker, empresa

CREATE TABLE `session` (
    `userId` INT NOT NULL,
    `token` VARCHAR(200) DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `expire` TIMESTAMP NULL DEFAULT NULL,
    `updated` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `event` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `userId` INT DEFAULT NULL,
    `entry` VARCHAR(20) DEFAULT NULL,
    `deviceId` INT DEFAULT NULL,
    `lat` FLOAT DEFAULT NULL,
    `lng` FLOAT DEFAULT NULL,
    `hash` VARCHAR(100) DEFAULT NULL,
    `created` INT DEFAULT NULL,
    `plate` VARCHAR(10) DEFAULT NULL,
    `warning` VARCHAR(150) DEFAULT NULL,
    `is_carpool` TINYINT(1) DEFAULT '0',
    `carpool_id` INT DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `audit_log` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `userId` INT DEFAULT NULL,
    `type` VARCHAR(50) DEFAULT NULL,
    `ip` VARCHAR(50) DEFAULT NULL,
    `ip_public` VARCHAR(50) DEFAULT NULL,
    `message` TEXT,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `area` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(250) DEFAULT NULL,
    `lat` FLOAT DEFAULT NULL,
    `lng` FLOAT DEFAULT NULL,
    `radio` INT DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_group` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_group_user` (
    `userId` INT NOT NULL,
    `userGroupId` INT NOT NULL,
    PRIMARY KEY (`userId`, `userGroupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `area_group` (
    `userGroupId` INT NOT NULL,
    `areaId` INT NOT NULL,
    PRIMARY KEY (`userGroupId`, `areaId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `area_user` (
    `userId` INT NOT NULL,
    `areaId` INT NOT NULL,
    PRIMARY KEY (`userId`, `areaId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `device` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) DEFAULT NULL,
    `hasDependency` TINYINT(1) DEFAULT NULL,
    `dependencyId` INT DEFAULT NULL,
    `maxMinutes` INT DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `hasPlate` TINYINT(1) DEFAULT NULL,
    `placeId` INT DEFAULT NULL,
    `lat` FLOAT DEFAULT NULL,
    `lng` FLOAT DEFAULT NULL,
    `radio` INT DEFAULT NULL,
    `last_access` TIMESTAMP NULL DEFAULT NULL,
    `allowInvitation` TINYINT(1) DEFAULT '0',
    `location` TEXT,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `device_user_types` (
    `device_id` INT NOT NULL,
    `user_type` VARCHAR(20) NOT NULL,
    PRIMARY KEY (`device_id`, `user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_device` (
    `user_id` INT NOT NULL,
    `device_id` INT NOT NULL,
    PRIMARY KEY (`user_id`, `device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `company` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) DEFAULT NULL,
    `rut` VARCHAR(15) DEFAULT NULL,
    `address` TEXT,
    `notes` TEXT,
    `active` TINYINT(1) DEFAULT '1',
    `isDenied` TINYINT(1) DEFAULT '1',
    `deniedNote` TEXT,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vehicle` (
    `plate` VARCHAR(10) NOT NULL,
    `description` TEXT,
    `active` TINYINT(1) DEFAULT '1',
    `author` INT DEFAULT NULL,
    `isDenied` TINYINT(1) DEFAULT '1',
    `deniedNote` TEXT,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`plate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vehicle_in_company` (
    `plate` VARCHAR(10) NOT NULL,
    `companyId` INT NOT NULL,
    `author` INT DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`plate`, `companyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `driver` (
    `userId` INT NOT NULL,
    `plate` VARCHAR(10) NOT NULL,
    `author` INT DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`userId`, `plate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `worker` (
    `userId` INT NOT NULL,
    `companyId` INT NOT NULL,
    `author` INT DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`userId`, `companyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `place` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` TEXT,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `description` TEXT,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `place_user` (
    `userId` INT NOT NULL,
    `placeId` INT NOT NULL,
    PRIMARY KEY (`userId`, `placeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Control de acceso para visitas
CREATE TABLE `gate` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` TEXT,
    `description` TEXT,
    `placeId` INT DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `visitor` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `doc_id` VARCHAR(50) DEFAULT NULL,
    `first_name` VARCHAR(100) DEFAULT NULL,
    `last_name` VARCHAR(100) DEFAULT NULL,
    `enter_type` VARCHAR(20) DEFAULT NULL,
    `created_by` INT DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `logbook` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `visitorId` INT DEFAULT NULL,
    `gateId` INT DEFAULT NULL,
    `event_type` VARCHAR(30) DEFAULT NULL,
    `description` TEXT,
    `invited_by` TEXT,
    `notes` TEXT,
    `status` VARCHAR(30) DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `register_by` INT DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `allow_list` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT DEFAULT NULL,
    `plate` VARCHAR(10) DEFAULT NULL,
    `access_day` DATE DEFAULT NULL,
    `profile` VARCHAR(20) DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `company` TEXT,
    `area` VARCHAR(100) DEFAULT NULL,
    `group_id` INT DEFAULT NULL,
    `user_in_group` INT DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `parking_register` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `allow_list_id` INT DEFAULT NULL,
    `status` VARCHAR(20) DEFAULT NULL,
    `doc_id` VARCHAR(15) DEFAULT NULL,
    `plate` VARCHAR(10) DEFAULT NULL,
    `company` TEXT,
    `area` VARCHAR(100) DEFAULT NULL,
    `hash` VARCHAR(100) DEFAULT NULL,
    `enter_date` TIMESTAMP NULL DEFAULT NULL,
    `in_transit_date` TIMESTAMP NULL DEFAULT NULL,
    `in_port_date` TIMESTAMP NULL DEFAULT NULL,
    `out_port_date` TIMESTAMP NULL DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `has_notification` TINYINT(1) DEFAULT '0',
    `notification_date` TIMESTAMP NULL DEFAULT NULL,
    `notification_msg` VARCHAR(255) DEFAULT NULL,
    `doc_one` LONGTEXT,
    `doc_two` LONGTEXT,
    `doc_three` LONGTEXT,
    `comment` VARCHAR(50) DEFAULT NULL,
    `notification_user` INT DEFAULT NULL,
    `was_pending` TINYINT(1) DEFAULT '0',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `allow_group` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` TEXT,
    `description` TEXT,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted` TINYINT(1) DEFAULT '0',
    `company` VARCHAR(250) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `allow_group_user` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `allow_group_id` INT DEFAULT NULL,
    `plate` VARCHAR(10) DEFAULT NULL,
    `profile` VARCHAR(20) DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `first_name` VARCHAR(100) DEFAULT NULL,
    `last_name` VARCHAR(100) DEFAULT NULL,
    `doc_id` VARCHAR(15) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `match_history` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `device_id` INT DEFAULT NULL,
    `user_id` INT DEFAULT NULL,
    `shot_filename` VARCHAR(100) DEFAULT NULL,
    `deleted` TINYINT(1) DEFAULT '0',
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `worker_invitation` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `worker_id` INT DEFAULT NULL,
    `company` TEXT,
    `description` TEXT,
    `init` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `end` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `event_duration` INT DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `device_id` INT DEFAULT NULL,
    `status` VARCHAR(15) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `worker_invited` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `worker_invitation_id` INT DEFAULT NULL,
    `user_id` INT DEFAULT NULL,
    `name` TEXT,
    `qr_code` TEXT,
    `email` TEXT,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `status` VARCHAR(15) DEFAULT NULL,
    `img` MEDIUMBLOB,
    `event_id` INT DEFAULT NULL,
    `exit_time` TIMESTAMP NULL DEFAULT NULL,
    `enter_time` TIMESTAMP NULL DEFAULT NULL,
    `lat` FLOAT DEFAULT NULL,
    `lng` FLOAT DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_worker_invitation` (`worker_invitation_id`),
    KEY `idx_email` (`email`(255)),
    KEY `idx_qr_code` (`qr_code`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Scheduler/Appointment system
CREATE TABLE `scheduler_appointment` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `numero_contenedor` VARCHAR(100) NOT NULL,
    `rut_usuario` VARCHAR(20) NOT NULL,
    `nombre_conductor` VARCHAR(100) NOT NULL,
    `apellido_conductor` VARCHAR(100) NOT NULL,
    `patente_vehiculo` VARCHAR(20) NOT NULL,
    `fecha_asignacion` DATE NOT NULL,
    `status` VARCHAR(30) DEFAULT 'Pendiente',
    `en_puerta_status` VARCHAR(20) DEFAULT 'pendiente',
    `en_puerta_timestamp` TIMESTAMP NULL DEFAULT NULL,
    `gate_status` VARCHAR(20) DEFAULT 'pendiente',
    `gate_timestamp` TIMESTAMP NULL DEFAULT NULL,
    `patio_status` VARCHAR(20) DEFAULT 'pendiente',
    `patio_timestamp` TIMESTAMP NULL DEFAULT NULL,
    `salida_status` VARCHAR(20) DEFAULT 'pendiente',
    `salida_timestamp` TIMESTAMP NULL DEFAULT NULL,
    `created_by` INT DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Task processing system
CREATE TABLE `processor` (
    `id` VARCHAR(20) NOT NULL,
    `thread` INT NOT NULL,
    `status` VARCHAR(20) DEFAULT NULL,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`, `thread`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `task` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `processorId` VARCHAR(20) DEFAULT NULL,
    `thread` INT DEFAULT NULL,
    `status` VARCHAR(20) DEFAULT NULL,
    `data` TEXT,
    `error` TEXT,
    `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `ndx_task` (`processorId`, `thread`, `status`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;