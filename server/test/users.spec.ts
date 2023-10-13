import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import request from 'supertest'
import { execSync } from 'node:child_process'

import { app } from '../src/app'

describe('users routes', () => {
  beforeAll(async () => {
    await app.ready()

    console.log(app.server.listening)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new user', async () => {
    await request(app.server)
      .post('/users')
      .send({
        id: '1234',
        name: 'Fulano',
        email: 'fulano@test.com',
        avatar_url: 'fulano.png',
      })
      .expect(201)
  })
})
