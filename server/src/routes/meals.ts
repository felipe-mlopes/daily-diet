import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { z } from 'zod'

import { knex } from '../database'
import { checkSessionIdSession } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdSession],
    },
    async (request) => {
      const userId = request.cookies.userId

      const meals = await knex('meals').where({ user_id: userId }).select('*')

      return {
        meals,
      }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdSession],
    },
    async (request) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const userId = request.cookies.userId

      const meal = await knex('meals')
        .where({
          id,
          user_id: userId,
        })
        .first()

      return { meal }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdSession],
    },
    async (request) => {
      const userId = request.cookies.userId

      const amount = await knex('meals')
        .count('id', { as: 'allMealsAmount' })
        .where({ user_id: userId })

      const dietAmount = await knex('meals')
        .count('id', { as: 'mealsDietAmount' })
        .where({
          user_id: userId,
          isDiet: true,
        })

      const outDietAmount = await knex('meals')
        .count('id', { as: 'mealsOutDietAmount' })
        .where({
          user_id: userId,
          isDiet: false,
        })

      const dietMeals = await knex('meals').select('isDiet').where({
        user_id: userId,
      })

      const sequenceCounts = []
      let currentCount = 0

      for (const meal of dietMeals) {
        if (meal.isDiet === 1) {
          currentCount++
        } else {
          if (currentCount > 0) {
            sequenceCounts.push(currentCount)
          }
          currentCount = 0
        }
      }

      if (currentCount > 0) {
        sequenceCounts.push(currentCount)
      }

      const maxFrequency = Math.max(...sequenceCounts)

      const summary = {
        'Total meals recorded': amount[0].allMealsAmount,
        'Total meals recorded within the diet': dietAmount[0].mealsDietAmount,
        'Total meals recorded without the diet':
          outDietAmount[0].mealsOutDietAmount,
        'Greater Meal Sequence within the Diet': maxFrequency,
      }

      return { summary }
    },
  )

  app.post(
    '/',
    {
      preHandler: [checkSessionIdSession],
    },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        title: z.string(),
        description: z.string(),
        isDiet: z.boolean(),
      })

      const { title, description, isDiet } = createMealBodySchema.parse(
        request.body,
      )

      const userId = request.cookies.userId

      await knex('meals').insert({
        id: randomUUID(),
        title,
        description,
        isDiet,
        user_id: userId,
      })

      return reply.status(201).send()
    },
  )

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdSession],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const updateMealBodySchema = z.object({
        title: z.string(),
        description: z.string(),
        isDiet: z.boolean(),
      })

      const { id } = getMealParamsSchema.parse(request.params)
      const { title, description, isDiet } = updateMealBodySchema.parse(
        request.body,
      )

      const userId = request.cookies.userId

      const meal = await knex('meals')
        .where({
          id,
          user_id: userId,
        })
        .first()
        .update({
          title,
          description,
          isDiet,
          updated_at: new Date(),
        })

      if (!meal) {
        return reply.status(401).send({
          error: 'Meals not found.',
        })
      }

      return reply.status(202).send()
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdSession],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const userId = request.cookies.userId

      await knex('meals')
        .where({
          id,
          user_id: userId,
        })
        .del()

      return reply.status(204).send()
    },
  )
}
