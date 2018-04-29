CREATE TABLE cd (
  cdid   integer primary key,
  artist INTEGER,
  title  VARCHAR(255),
  year   CHAR(4)
);

CREATE TABLE artist (
    artistid integer primary key,
    name varchar(255)
);

create table track (
    trackid integer primary key,
    cd integer,
    position integer,
    title varchar(255)
);
