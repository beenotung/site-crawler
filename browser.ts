import { firefox } from 'playwright'

export async function initBrowser(entryUrl: string) {
  let browser = await firefox.launch({ headless: false })
  let page = await browser.newPage()
  await page.goto(entryUrl)

  async function close() {
    await page.close()
    await browser.close()
  }

  async function browserFetch(url: string) {
    return page.evaluate(
      (args: { url: string }) =>
        fetch(args.url).then(res =>
          res.text().then(text => ({
            status: res.status,
            text,
            headers: Object.fromEntries(Array.from(res.headers as any)),
          })),
        ),
      { url },
    )
  }

  async function parseHTML(html: string) {
    return page.evaluate(
      (args: { html: string }) => {
        let e = document.createElement('div')
        e.innerHTML = args.html
        let imgs: { src: string; alt: string }[] = []
        e.querySelectorAll('img').forEach((img: HTMLImageElement) =>
          imgs.push({
            src: img.src,
            alt: img.alt,
          }),
        )
        let links: { text: string | null; href: string }[] = []
        e.querySelectorAll('a').forEach((a: HTMLAnchorElement) =>
          links.push({
            text: a.textContent,
            href: a.href,
          }),
        )
        return { imgs, links }
      },
      { html },
    )
  }

  return {
    close,
    fetch: browserFetch,
    parseHTML,
  }
}
