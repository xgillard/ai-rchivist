CREATE TABLE dataset(
    "id"         int  not null primary key,
    "project"    text not null,
    "file_id"    text not null,
    "text"       text not null,
    "subset"     text not null,
    "validated"  int  not null default 0,
    "labeling"   text 
);