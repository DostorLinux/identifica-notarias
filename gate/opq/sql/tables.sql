create table processor (
    id varchar(20),
    thread int,
    status varchar(20),
    created timestamp DEFAULT CURRENT_TIMESTAMP,
    updated timestamp null,
    primary key (id,thread)
);

-- status IDLE, RUNNING

create table task (
    id int primary key auto_increment,
    processorId varchar(20),
    thread int,
    status varchar(20),
    data text,
    error text,
    created timestamp DEFAULT CURRENT_TIMESTAMP,
    updated timestamp null
);

create index ndx_task on task(processorId, thread, status, id);

-- status NEW, PROCESSING, PROCESSED

