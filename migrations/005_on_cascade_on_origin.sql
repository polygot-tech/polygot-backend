--delete previous foreign key

ALTER TABLE origins DROP CONSTRAINT origins_app_id_fkey;

--create new on cascade foreign key

ALTER TABLE origins
ADD CONSTRAINT origins_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps (app_id) ON DELETE CASCADE;