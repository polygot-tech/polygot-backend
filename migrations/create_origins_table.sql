create table origins (
    origin_id text not null PRIMARY KEY DEFAULT gen_random_uuid (),
    app_id text not null REFERENCES apps,
    origin text not null,
    UNIQUE (app_id, origin)
)

-- origins table to store valid origins per app