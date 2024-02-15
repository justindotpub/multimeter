defmodule Multimeter.Repo.Migrations.AddItems do
  use Ecto.Migration

  def change do
    create table(:items, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :title, :text
      add :description, :text
    end
  end
end
