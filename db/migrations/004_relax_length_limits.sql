BEGIN;

ALTER TABLE posts DROP CONSTRAINT posts_title_check;
ALTER TABLE posts DROP CONSTRAINT posts_body_check;
ALTER TABLE comments DROP CONSTRAINT comments_body_check;

ALTER TABLE posts
  ADD CONSTRAINT posts_title_check CHECK (length(trim(title)) > 0);
ALTER TABLE posts
  ADD CONSTRAINT posts_body_check CHECK (length(trim(body)) > 0 AND length(body) <= 30000);
ALTER TABLE comments
  ADD CONSTRAINT comments_body_check CHECK (length(trim(body)) > 0 AND length(body) <= 30000);

COMMIT;
