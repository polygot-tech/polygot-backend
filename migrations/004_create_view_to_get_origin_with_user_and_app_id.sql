CREATE VIEW origin_app_users_view AS
SELECT u.id, u.client_id, a.app_id, a.is_active, a.production, a.api_calls, o.origin
FROM
    origins AS o
    JOIN apps AS a ON a.app_id = o.app_id
    JOIN users as u on a.client_id = u.client_id;