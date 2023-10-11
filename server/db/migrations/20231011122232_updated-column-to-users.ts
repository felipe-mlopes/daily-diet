import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('users', (table) => {
    table.renameColumn('create_at', 'created_at')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('users', (table) => {
    table.renameColumn('created_at', 'create_at')
  })
}
