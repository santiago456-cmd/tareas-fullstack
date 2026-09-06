import { test, expect } from '@playwright/test'

const keycloak = 'http://127.0.0.1:18081'
const tokenPath = '/realms/tareas-e2e/protocol/openid-connect/token'
async function login(page, username = 'alice') {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await page.getByLabel('Username or email').fill(username)
  await page
    .getByLabel('Password', { exact: true })
    .fill('e2e-only-user-password')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Mis listas', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Salir', exact: true }),
  ).toBeVisible()
}

test('login PKCE, CRUD, recarga SSO y logout con tokens solo en memoria', async ({
  page,
}) => {
  let exchanges = 0
  page.on('request', (request) => {
    if (
      request.url().endsWith(tokenPath) &&
      new URLSearchParams(request.postData() || '').get('grant_type') ===
        'authorization_code'
    )
      exchanges++
  })
  await login(page)
  expect(exchanges).toBe(1)
  expect(
    await page.evaluate(() =>
      ['access_token', 'refresh_token', 'id_token'].some(
        (key) => localStorage.getItem(key) || sessionStorage.getItem(key),
      ),
    ),
  ).toBe(false)
  await page.getByRole('textbox').fill('Lista E2E')
  await page.getByRole('button', { name: 'Crear' }).click()
  await page.getByRole('link', { name: 'Lista E2E', exact: true }).click()
  await page.getByRole('link', { name: 'Nueva tarea' }).click()
  await page.getByLabel('Título', { exact: true }).fill('Tarea E2E')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Tarea E2E', exact: true }),
  ).toBeVisible()
  await page.getByTitle('Marcar completada', { exact: true }).click()
  await expect(
    page.getByTitle('Marcar completada', { exact: true }),
  ).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Mis listas', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Lista E2E', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Tarea E2E', exact: true }),
  ).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTitle('Eliminar', { exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Tarea E2E', exact: true }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Salir', exact: true }).click()
  await expect(
    page.getByRole('heading', {
      name: 'Necesitás iniciar sesión',
      exact: true,
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page.getByLabel('Username or email')).toBeVisible()
})

test('renueva al vencer y retira la vista protegida al revocar la sesión real', async ({
  page,
  request,
}) => {
  await login(page, 'bob')
  const renewed = await page.waitForResponse(
    (response) =>
      response.url().endsWith(tokenPath) &&
      new URLSearchParams(response.request().postData() || '').get(
        'grant_type',
      ) === 'refresh_token' &&
      response.status() === 200,
    { timeout: 55000 },
  )
  expect(renewed.ok()).toBe(true)
  await expect(
    page.getByRole('button', { name: 'Salir', exact: true }),
  ).toBeVisible()
  const adminResponse = await request.post(
    `${keycloak}/realms/master/protocol/openid-connect/token`,
    {
      form: {
        client_id: 'admin-cli',
        grant_type: 'password',
        username: 'e2e-admin',
        password: 'e2e-only-admin-password',
      },
    },
  )
  expect(adminResponse.ok()).toBe(true)
  const admin = await adminResponse.json()
  const headers = { Authorization: `Bearer ${admin.access_token}` }
  const users = await request.get(
    `${keycloak}/admin/realms/tareas-e2e/users?username=bob&exact=true`,
    { headers },
  )
  expect(users.ok()).toBe(true)
  const [user] = await users.json()
  expect(user.username).toBe('bob')
  const revoked = await request.post(
    `${keycloak}/admin/realms/tareas-e2e/users/${user.id}/logout`,
    { headers },
  )
  expect(revoked.status()).toBe(204)
  await expect(
    page.getByRole('heading', {
      name: 'Necesitás iniciar sesión',
      exact: true,
    }),
  ).toBeVisible({ timeout: 55000 })
  await expect(
    page.getByRole('button', { name: 'Salir', exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'Mis listas', exact: true }),
  ).toHaveCount(0)
})
