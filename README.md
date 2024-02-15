# Multimeter

This repo contains experiments with using [ElectricSQL](https://electric-sql.com) for local-first development.

## One-time Postgres setup
[Enable logical replication](https://electric-sql.com/docs/usage/installation/postgres#homebrew):
```
# Install postgresql and start the service
brew install postgresql
brew services start postgresql

# Enable logical replication
psql -U postgres -c 'ALTER SYSTEM SET wal_level = logical'
brew services restart postgresql

# Verify the wal_level is logical
psql -U postgres -c 'show wal_level'
```

[Database user](https://electric-sql.com/docs/api/service#permissions-for-logical-replication-mode):
```
CREATE ROLE electric
  WITH LOGIN
       PASSWORD 'electric'
       SUPERUSER;
```

## Use the right version of Elixir and Erlang/OTP
I use asdf to manage my Elixir and Erlang/OTP versions.  The `.tool-versions` file in this repo specifies the versions I'm using.
```
asdf install
```

## Ensure env vars are set
I use direnv to evaluate the vars in the `.envrc` file.
The electric project uses `dotenvy` but some of their npm commands also need the vars set,
so I just use direnv to ensure that the vars are set for all commands.
```
direnv allow
```

## Start the electric server
In a new terminal, run the following.
```
iex -S mix electric.server
```
This will start the server, which will fail to connect to the database because the database doesn't exist yet.  Keep this terminal open.

## Create database and run migrations.
In a new terminal, run the following.
```
mix ecto.create
mix ecto.migrate
```
This should succeed, and you'll notice some output in the electric terminal indicating that it successfully connected to the database.

## Start the Phoenix server
You can start your Phoenix server now as usual.
```
iex -S mix phx.server
```

## Generating prisma schema
```
cd assets
npx electric-sql generate
# I had to pass options at one point.  Come back and verify if this is still needed.
# npx electric-sql generate --database-name multimeter_dev --pg-proxy-password proxy_password
```

## Troubleshooting
- When you first create your database, if you also immediately run migrations, you might run into problems if electric hasn't already connected to the newly created database and run its own internal migrations, such as definining any necessary stored procedures that are used for its DDLX.
- You won't be able to drop your database without stopping the electric server.
- If you don't use `ELECTRIC_WRITE_TO_PG_MODE=direct_writes` like I do in my `.envrc` then even after stopping electric, you won't be able to drop your db
  unless you first run some fancy SQL to drop pg subscriptions first.
