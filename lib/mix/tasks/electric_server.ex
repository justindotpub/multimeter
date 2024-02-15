defmodule Mix.Tasks.Electric.Server do
  use Mix.Task

  @shortdoc "Starts the ElectricSQL server."

  @moduledoc """
  Starts the ElectricSQL server.
  """

  @impl true
  def run(args) do
    Application.put_env(:multimeter, :serve_electric, true, persistent: true)
    Mix.Tasks.Run.run(run_args(args))
  end

  defp iex_running? do
    Code.ensure_loaded?(IEx) and IEx.started?()
  end

  defp run_args(args) do
    if iex_running?(), do: args, else: args ++ ["--no-halt"]
  end
end
