use photosafe;

DROP TABLE users;
DROP TABLE images;
DROP TABLE keywords;

CREATE TABLE IF NOT EXISTS users (userID VARCHAR(255) NOT NULL, firstName VARCHAR(255), email VARCHAR(255));
CREATE TABLE IF NOT EXISTS images (imageKey INT NOT NULL AUTO_INCREMENT, filename VARCHAR(255), userID VARCHAR(255), PRIMARY KEY (imageKey));
CREATE TABLE IF NOT EXISTS keywords (imageKey INT, keyword VARCHAR(255));

INSERT INTO users (userID, firstName, email) VALUES ('test_user', 'Testy McTestface', 'test@photosafe.tk');

INSERT INTO images (imageKey, filename, userID) VALUES (1, 'soccer.jpg', 'test_user');
INSERT INTO images (imageKey, filename, userID) VALUES (2, 'poster.jpg', 'test_user');
INSERT INTO images (imageKey, filename, userID) VALUES (3, 'test.jpg', 'test_user');

INSERT INTO keywords (imageKey, keyword) VALUES (1, 'soccer');
INSERT INTO keywords (imageKey, keyword) VALUES (1, 'sports');
