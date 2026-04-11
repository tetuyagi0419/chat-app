import { test, expect } from '@playwright/test'

const EMAIL = process.env.TEST_USER_EMAIL!
const PASSWORD = process.env.TEST_USER_PASSWORD!

test.describe('認証', () => {
  test('/ にアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('/chat に未認証でアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/chat')
    await expect(page).toHaveURL('/login')
  })

  test('ログインページが正しく表示される', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
    await expect(page.getByPlaceholder('メールアドレス')).toBeVisible()
    await expect(page.getByPlaceholder('パスワード（6文字以上）')).toBeVisible()
    await expect(page.getByRole('button', { name: 'ログイン', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Googleでログイン' })).toBeVisible()
  })

  test('「新規登録」でアカウント作成画面に切り替わる', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: '新規登録' }).click()
    await expect(page.getByRole('heading', { name: 'アカウント作成' })).toBeVisible()
    await expect(page.getByRole('button', { name: '登録する' })).toBeVisible()
  })

  test('「ログイン」でログイン画面に戻る', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: '新規登録' }).click()
    await page.getByRole('button', { name: 'ログイン', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
  })

  test('未入力のまま送信するとバリデーションが発動する', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'ログイン', exact: true }).click()
    // HTML5バリデーションによりメールフィールドにフォーカスが当たる
    await expect(page.getByPlaceholder('メールアドレス')).toBeFocused()
  })

  test('メールのみ入力してパスワード未入力で送信するとバリデーションが発動する', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('メールアドレス').fill('test@example.com')
    await page.getByRole('button', { name: 'ログイン', exact: true }).click()
    await expect(page.getByPlaceholder('パスワード（6文字以上）')).toBeFocused()
  })

  test('存在しないアカウントでログインするとエラーが表示される', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('メールアドレス').fill('notexist@example.com')
    await page.getByPlaceholder('パスワード（6文字以上）').fill('wrongpassword')
    await page.getByRole('button', { name: 'ログイン', exact: true }).click()
    await expect(page.locator('p[style*="color: rgb(239, 68, 68)"]')).toBeVisible({ timeout: 5000 })
  })

  test('正しい認証情報でログインすると /chat にリダイレクトされる', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('メールアドレス').fill(EMAIL)
    await page.getByPlaceholder('パスワード（6文字以上）').fill(PASSWORD)
    await page.getByRole('button', { name: 'ログイン', exact: true }).click()
    await expect(page).toHaveURL('/chat', { timeout: 10000 })
  })

  test('ログアウトすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('メールアドレス').fill(EMAIL)
    await page.getByPlaceholder('パスワード（6文字以上）').fill(PASSWORD)
    await page.getByRole('button', { name: 'ログイン', exact: true }).click()
    await expect(page).toHaveURL('/chat', { timeout: 10000 })

    await page.getByRole('button', { name: 'ログアウト' }).click()
    await expect(page).toHaveURL('/login')
  })
})
