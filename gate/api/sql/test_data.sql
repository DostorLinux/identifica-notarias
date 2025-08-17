-- use scripts/admin/gen_pass.php to hash the password

-- credentials admin/gate.2020
insert into user (doc_id, username, first_name, last_name, password, email, role)
values ('11.111.111-1', 'admin', 'Demo', 'Admin',
    '5c9802b57c4e7ceb363c4659da3bd469daa387e7ba6680585995ce24bac681ae', 'admin@home', 'admin');

insert into device (id, name, hasDependency, dependencyId, maxMinutes, hasPlate, placeId)
values (1, 'Barón', 0, 0, 0, 0, 1);

insert into device (id, name, hasDependency, dependencyId, maxMinutes, hasPlate, placeId)
values (2, 'PORTAL-1', 0, 0, 0, 0, 2);

insert into place (id, name, description) values (1, 'VAP', 'Valparaíso');
insert into place (id, name, description) values (2, 'SAI', 'San Antonio');