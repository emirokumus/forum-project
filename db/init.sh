#!/bin/sh
set -e

for file in /migrations/*.sql; do
  echo "Migration çalıştırılıyor: $file"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$file"
done

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v app_password="$APP_DB_PASSWORD" <<'EOF'
ALTER ROLE forum_app PASSWORD :'app_password';
EOF

echo "Veritabanı hazır"
