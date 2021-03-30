-- up
create table if not exists headers (
  id integer PRIMARY key
);
create table if not exists urls (
  id integer primary key,
  url text,
  header_id integer REFERENCES headers(id),
  status_code integer,
  text text,
  site bool
);
create table if not exists links (
  id integer primary key,
  source_url_id integer references urls(id),
  dest_url_id integer references urls(id),
  text text
);
create table if not exists images (
  id integer primary key,
  source_url_id integer references urls(id),
  url_id integer references urls(id),
  alt text
);

-- down
drop table if exists images;
drop table if exists links;
drop table if exists urls;
drop table if exists headers;
