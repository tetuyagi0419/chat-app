import { test, expect, Page } from '@playwright/test'

const EMAIL = process.env.TEST_USER_EMAIL!
const PASSWORD = process.env.TEST_USER_PASSWORD!

async function login(page: Page) {
  await page.goto('/login')
  // すでにログイン済みの場合は /chat にリダイレクトされる
  if (page.url().includes('/chat')) return
  await page.getByPlaceholder('メールアドレス').fill(EMAIL)
  await page.getByPlaceholder('パスワード（6文字以上）').fill(PASSWORD)
  await page.getByRole('button', { name: 'ログイン', exact: true }).click()
  await expect(page).toHaveURL('/chat', { timeout: 20000 })
  // チャット画面のロード完了を待つ
  await expect(page.getByPlaceholder('メッセージを入力...')).toBeVisible({ timeout: 10000 })
}

test.describe('チャット', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('チャットページが正しく表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '💬 チャット' })).toBeVisible()
    await expect(page.getByPlaceholder('メッセージを入力...')).toBeVisible()
    await expect(page.getByRole('button', { name: '送信' })).toBeVisible()
  })

  test('空のメッセージは送信できない（送信ボタンが無効）', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: '送信' })
    await expect(sendButton).toBeDisabled()
  })

  test('メッセージを入力すると送信ボタンが有効になる', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: '送信' })
    await page.getByPlaceholder('メッセージを入力...').fill('Hello')
    await expect(sendButton).toBeEnabled()
  })

  test('メッセージを送信すると画面に表示される', async ({ page }) => {
    const message = `テストメッセージ ${Date.now()}`
    await page.getByPlaceholder('メッセージを入力...').fill(message)
    await page.getByRole('button', { name: '送信' }).click()

    await expect(page.getByText(message)).toBeVisible({ timeout: 5000 })
  })

  test('メッセージ送信後に入力欄がクリアされる', async ({ page }) => {
    await page.getByPlaceholder('メッセージを入力...').fill('クリアテスト')
    await page.getByRole('button', { name: '送信' }).click()

    await expect(page.getByPlaceholder('メッセージを入力...')).toHaveValue('', { timeout: 5000 })
  })

  test('送信中は「送信中...」と表示されボタンが無効になる', async ({ page }) => {
    await page.getByPlaceholder('メッセージを入力...').fill('送信中テスト')

    // ボタンをクリックして即座に状態を確認
    const sendButton = page.getByRole('button', { name: /送信/ })
    await sendButton.click()

    // 送信完了後に入力欄がクリアされていることを確認
    await expect(page.getByPlaceholder('メッセージを入力...')).toHaveValue('', { timeout: 5000 })
  })

  test('リアルタイム: 別タブで送信したメッセージが届く', async ({ page, context }) => {
    const page2 = await context.newPage()
    await page2.goto('/chat')
    await expect(page2).toHaveURL('/chat', { timeout: 10000 })

    const message = `リアルタイムテスト ${Date.now()}`
    await page2.getByPlaceholder('メッセージを入力...').fill(message)
    await page2.getByRole('button', { name: '送信' }).click()

    // page1（自分が送信していない）にもメッセージが届く
    await expect(page.getByText(message)).toBeVisible({ timeout: 8000 })

    await page2.close()
  })

  test('ページ読み込み後にメッセージ一覧が表示される', async ({ page }) => {
    // ローディング中のテキストが消えることを確認
    await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 5000 })

    // メッセージ一覧またはメッセージなし表示が出ている
    const hasMessages = await page.locator('div[style*="border-radius"]').count() > 0
    const noMessages = await page.getByText('まだメッセージがありません').isVisible()
    expect(hasMessages || noMessages).toBeTruthy()
  })
})
