ALTER TABLE subscriptions
ADD COLUMN t_id TEXT,
ADD CONSTRAINT subscriptions_t_id_fkey FOREIGN KEY (t_id) REFERENCES transactions (t_id);