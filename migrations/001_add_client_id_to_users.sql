alter table users add column IF NOT EXISTS client_id text not null UNIQUE default gen_random_uuid();

--to add client_id to users and providing default to gen_random_uuid()