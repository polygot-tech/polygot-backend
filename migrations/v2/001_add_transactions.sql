CREATE TABLE transactions (
    t_id TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users (id),
    payment_method TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    payment_status TEXT NOT NULL
)