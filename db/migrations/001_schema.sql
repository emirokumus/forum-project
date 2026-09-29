BEGIN;

CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username varchar(30) NOT NULL CHECK (username ~ '^[A-Za-z0-9_]{3,30}$'),
  email varchar(255) NOT NULL,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_username_lower_idx ON users (lower(username));
CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));

CREATE TABLE posts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title varchar(150) NOT NULL CHECK (length(trim(title)) >= 10),
  body text NOT NULL CHECK (length(body) BETWEEN 20 AND 30000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_user_id_idx ON posts (user_id);
CREATE INDEX posts_created_at_idx ON posts (created_at DESC);

CREATE TABLE comments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id bigint NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 20 AND 30000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_post_id_idx ON comments (post_id);
CREATE INDEX comments_user_id_idx ON comments (user_id);

CREATE TABLE post_votes (
  user_id bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  post_id bigint NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX post_votes_post_id_idx ON post_votes (post_id);

CREATE TABLE comment_votes (
  user_id bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  comment_id bigint NOT NULL REFERENCES comments (id) ON DELETE CASCADE,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);
CREATE INDEX comment_votes_comment_id_idx ON comment_votes (comment_id);

COMMIT;
