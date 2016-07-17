-- username: test1@test.de, password: test1
insert into users (username, pasword, token) values ('test1@test.de', '$2a$10$L6vSuCI85ABOhHdPeHGMjudHQsHWplXnDpiL03VvKWD.Hqy2PpFzW', '$2a$10$RZ76Wox5q4Um/IIobtnp0uHe59/S4dWv/CgnisDtGt5LFu.yB2TB6');
insert into roles (role, roledescription) values ('admin', 'The administrator of the application and the database!');
insert into roles (role, roledescription) values ('user', 'A user of the application.');
insert into user_role (user_id, role_id) values (1, 1);
insert into user_role (user_id, role_id) values (1, 2);
