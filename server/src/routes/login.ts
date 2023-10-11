import { FastifyInstance } from 'fastify'
import passport from '@fastify/passport'
import googlePassport from 'passport-google-oauth20'

import { env } from '../env'
import { knex } from '../database'

export type User = {
  id: string
  name: string
  email: string
  avatar_url: string
  created_at: string
  session_id: null | string
}

const GoogleStrategy = googlePassport.Strategy

export async function loginRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    if (request.isAuthenticated()) {
      reply.redirect('/meals')
    }

    reply.redirect('/login')
  })

  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:3333/login/auth/google/callback',
        passReqToCallback: true,
        scope: ['profile', 'email'],
      },
      async (request, accessToken, refreshToken, profile, done) => {
        const { sub, name, email, picture } = profile._json

        const user = await knex('users').where('id', sub).first()

        if (!user) {
          const newUser = await knex('users').insert({
            id: sub,
            name,
            email,
            avatar_url: picture,
          })

          if (newUser) {
            done(undefined, newUser)
          } else {
            done(undefined, user)
          }
        }
        done(undefined, user)
      },
    ),
  )

  passport.registerUserDeserializer(async (user) => {
    return user
  })

  passport.registerUserSerializer(async (user) => {
    return user
  })

  app.get(
    '/login/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }),
  )

  app.get(
    '/login/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/login/auth',
      successRedirect: '/login',
    }),
  )

  app.get('/login', async (request, reply) => {
    if (request.isAuthenticated()) {
      const { id } = request.user as User

      reply
        .setCookie('userId', id, {
          path: '/',
          maxAge: 1000 * 60 * 60 * 7, // 7 days
        })
        .redirect('/meals')
    }

    reply.redirect('/login/auth')
  })

  app.get('/logout', async (request) => {
    request.logout()

    return {
      success: true,
    }
  })
}
