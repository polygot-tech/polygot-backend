create table apps (
    app_id TEXT not null PRIMARY KEY DEFAULT gen_random_uuid (),
    app_name TEXT not null,
    is_active BOOLEAN DEFAULT true,
    production BOOLEAN DEFAULT false,
    translations_done BIGINT DEFAULT 0,
    api_calls BIGINT DEFAULT 0,
    client_id TEXT not null REFERENCES users (client_id) ON DELETE CASCADE
);

-- creates a  apps table referencing users with client-id for allowing users to manage different apps