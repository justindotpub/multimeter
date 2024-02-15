defmodule Multimeter.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    # In dev, check if we are running electric or multimeter
    if serve_electric?() do
      # Note that I had to start Electric here, to ensure that runtime config had been evaluated.
      {:ok, _} = Application.ensure_all_started(:electric)
      pid = Process.whereis(Electric.Supervisor)

      {:ok, pid}
    else
      children =
        [
          MultimeterWeb.Telemetry,
          Multimeter.Repo,
          {DNSCluster, query: Application.get_env(:multimeter, :dns_cluster_query) || :ignore},
          {Phoenix.PubSub, name: Multimeter.PubSub},
          # Start the Finch HTTP client for sending emails
          {Finch, name: Multimeter.Finch},
          # Start a worker by calling: Multimeter.Worker.start_link(arg)
          # {Multimeter.Worker, arg},
          # Start to serve requests, typically the last entry
          MultimeterWeb.Endpoint
        ]

      # See https://hexdocs.pm/elixir/Supervisor.html
      # for other strategies and supported options
      opts = [strategy: :one_for_one, name: Multimeter.Supervisor]
      Supervisor.start_link(children, opts)
    end
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    MultimeterWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp serve_electric? do
    Application.get_env(:multimeter, :serve_electric, false)
  end
end
