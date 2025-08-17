-- 2022-07-12
alter table event add id int primary key auto_increment;
alter table user add pin varchar(10);

-- 2023-01-11
create table area (
    id      int auto_increment primary key,
    lat     float,
    lng     float,
    radio   int,
    created timestamp DEFAULT CURRENT_TIMESTAMP,
    updated timestamp null
);

-- 2023-03-29
create table user_group (
    id   int auto_increment primary key,
    name varchar(50)
);

create table user_group_user (
    userId int,
    userGroupId int,
    primary key(userId, userGroupId)
);

create table area_group (
    userGroupId int,
    areaId int,
    primary key(userGroupId, areaId)
);

create table area_user (
    userId int,
    areaId int,
    primary key(userId, areaId)
);

create table device (
        id   int auto_increment primary key,
        name varchar(50),
        hasDependency TINYINT(1),
        dependencyId int,
        maxMinutes int,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

create table company (
        id   int auto_increment primary key,
        name varchar(150),
        rut varchar(15),
        address varchar(500),
        notes varchar(1500),
        active TINYINT(1) default 1,
        isDenied TINYINT(1) default 1,
        deniedNote varchar(20000),
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

create table vehicle(
    plate varchar(10) primary key,
    description varchar(20000),
    active TINYINT(1) default 1,
    author int,
    isDenied TINYINT(1) default 1,
    deniedNote varchar(20000),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);
create table vehicle_in_company(
    plate varchar(10),
    companyId int,
    author int,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key(plate, companyId)
);
create table driver(
    userId int,
    plate varchar(10),
    author int,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key(userId, plate)
);

create table worker(
    userId int,
    companyId int,
    author int,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key(userId, companyId)
);

alter table user add isDenied TINYINT(1) default 0;
alter table user add deniedNote varchar(20000);
alter table event change location deviceId int;
alter table user add nationality varchar(100);
alter table event add plate varchar(10);
alter table event add warning  varchar(150);
alter table device add hasPlate TINYINT(1);

create table place(
    id int auto_increment primary key,
    name varchar(400),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
create table place_user(
    userId int,
    placeId int,
    primary key (userId, placeId)
);

alter table device add placeId int;

--2023-04-18
alter table area add name varchar(250);

--2023-05-24
alter table user add pub_id varchar(37);

---07/02/2024
alter table user add created_by int default 0;
alter table place add description varchar(1000);
create table gate(
                     id int auto_increment primary key,
                     name varchar(400),
                     description varchar(4000),
                     placeId int,
                     created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                     updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

create table visitor(
                        id int auto_increment primary key,
                        doc_id     varchar(50),
                        first_name varchar(100),
                        last_name  varchar(100),
                        enter_type varchar(20),
                        created_by int,
                        created    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

create table logbook(
                        id int auto_increment primary key,
                        visitorId int,
                        gateId int,
                        event_type varchar(30),
                        description varchar(4000),
                        invited_by varchar(4000),
                        notes varchar(4000),
                        status varchar(30),
                        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

alter table logbook add register_by int;

alter table user add has_expiration TINYINT(1) default 0;
alter table user add expiration_date date;
create table allow_list(
                           id int auto_increment primary key,
                           user_id int,
                           plate varchar(10),
                           access_day date,
                           profile    varchar(20),
                           created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

alter table allow_list add company varchar(400);

create table parking_register(
                                 id int auto_increment primary key,
                                 allow_list_id int,
                                 status varchar(20),
                                 doc_id varchar(15),
                                 plate varchar(10),
                                 company varchar(400),
                                 hash varchar(100),
                                 enter_date TIMESTAMP NULL,
                                 in_transit_date TIMESTAMP NULL,
                                 in_port_date TIMESTAMP NULL,
                                 out_port_date TIMESTAMP NULL,
                                 created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

alter table parking_register add has_notification TINYINT(1) default 0;
alter table parking_register add notification_date TIMESTAMP NULL;

create table allow_group(
    id int auto_increment primary key,
    name varchar(400),
    description varchar(4000),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

create table allow_group_user(
     id int auto_increment primary key,
     allow_group_id int,
     user_id int,
     plate varchar(10),
     company varchar(400),
     profile    varchar(20),
     created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

alter table allow_group add deleted TINYINT(1) default 0;

alter table allow_group_user add   first_name varchar(100);
alter table allow_group_user add   last_name varchar(100);
alter table allow_group_user add   doc_id varchar(15);
alter table allow_group_user drop column user_id;
alter table allow_group add company varchar(250);
alter table allow_group_user drop column company;
alter table allow_list add group_id int;
alter table allow_list add user_in_group int;

alter table device add lat float;
alter table device add lng float;
alter table device add radio int;
alter table device add last_access TIMESTAMP NULL;
alter table user add  user_type varchar(50);

create table device_user_types(
                                  device_id int,
                                  user_type varchar(20),
                                  primary key (device_id, user_type)
);
create table user_device(
                            user_id int,
                            device_id int,
                            primary key (user_id, device_id)
);

create table match_history (
    id int auto_increment primary key,
    device_id int,
    user_id int,
    shot_filename varchar(100),
    deleted TINYINT(1) default 0,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
alter table user add create_invitation_allowed TINYINT(1) default 0;
alter table user add phone varchar(10);
alter table user add department varchar(10);

alter table event add is_carpool TINYINT(1) default 0;
alter table event add carpool_id int;

create table worker_invitation(
    id int auto_increment primary key,
    worker_id int,
    company varchar(400),
    description varchar(4000),
    init TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    event_duration int,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
create table worker_invited(
    id int auto_increment primary key,
    worker_invitation_id int,
    user_id int,
    name varchar(400),
    qr_code varchar(400),
    email varchar(400),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

alter table worker_invitation add device_id int;
alter table worker_invited add status VARCHAR(15);
alter table worker_invited add img MEDIUMBLOB;
alter table worker_invitation add status VARCHAR(15);
alter table worker_invited add enter_time TIMESTAMP NULL;
alter table worker_invited add exit_time TIMESTAMP NULL;
alter table worker_invited add event_id int;
alter table worker_invited add lat float;
alter table worker_invited add lng float;

alter table device add allowInvitation TINYINT(1) default 0;
alter table device add location varchar(400);

alter table parking_register add notification_msg VARCHAR(255);
alter table parking_register add doc_one LONGTEXT;
alter table parking_register add doc_two LONGTEXT;
alter table parking_register add doc_three LONGTEXT;
alter table parking_register add comment VARCHAR(50);
alter table parking_register add notification_user INT;
alter table parking_register add was_pending TINYINT(1) default 0;

alter table allow_list add area VARCHAR(100);

-- 2025-01-31: Sistema de Agendamiento (Scheduler)
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

-- 2025-01-31: Sistema de Procesamiento de Tareas
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

-- 2025-08-01: Agregar rol empresa para creación de agendamientos
-- Los roles válidos ahora incluyen: api, admin, normal, user, super_admin, worker, empresa

-- 2025-08-06: Agregar campo must_change_password para contraseñas temporales
ALTER TABLE user ADD COLUMN must_change_password TINYINT(1) DEFAULT 0;