import fastify from 'fastify'
import cookie from '@fastify/cookie'
import fastifyPassport from '@fastify/passport'
import fastifySecureSession from '@fastify/secure-session'

import { loginRoutes } from './routes/login'
import { usersRoutes } from './routes/users'
import { mealsRoutes } from './routes/meals'
import { env } from './env'

export const app = fastify()

app.register(cookie)

app.register(fastifySecureSession, {
  secret: env.SECRET,
  salt: 'mq9hDxBVDbspDR6n',
  cookieName: 'sessionId',
  cookie: {
    path: '/',
  },
})
app.register(fastifyPassport.initialize())
app.register(fastifyPassport.secureSession())

app.register(loginRoutes)
app.register(usersRoutes, {
  prefix: 'users',
})
app.register(mealsRoutes, {
  prefix: 'meals',
})
