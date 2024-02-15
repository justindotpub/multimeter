defmodule Multimeter.ProxyRepo do
  use Ecto.Repo,
    otp_app: :multimeter,
    adapter: Ecto.Adapters.Postgres
end
