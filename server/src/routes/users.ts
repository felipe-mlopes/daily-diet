import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const users = await knex('users').select()

    return {
      users,
    }
  })

  app.get('/:id', async (request) => {
    const getUserParamsSchema = z.object({
      id: z.string(),
    })

    const { id } = getUserParamsSchema.parse(request.params)

    const user = await knex('users').where({ id }).first()

    return {
      user,
    }
  })

  app.delete('/:id', async (request, reply) => {
    const getUserParamsSchema = z.object({
      id: z.string(),
    })

    const { id } = getUserParamsSchema.parse(request.params)

    await knex('users').where({ id }).del()

    return reply.status(204).send()
  })
}
