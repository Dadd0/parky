#!/bin/sh
mkdir -p /app/backend/data
cp /app/default-data.db /app/backend/data/data.db
echo "Copied database from image"
exec "$@"
