defmodule Multimeter.Repo.Migrations.ElectrifyItems do
  use Ecto.Migration

  def up do
    execute "ALTER TABLE items ENABLE ELECTRIC"
  end

  def down do
    execute "ALTER TABLE items DISABLE ELECTRIC"
  end
end
