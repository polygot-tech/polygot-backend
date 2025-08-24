ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_user_id_fkey;

ALTER TABLE subscriptions DROP COLUMN user_id;

ALTER TABLE subscriptions ADD COLUMN client_id TEXT,
ADD CONSTRAINT subscriptions_client_id_fkey FOREIGN KEY (client_id) REFERENCES users(client_id);