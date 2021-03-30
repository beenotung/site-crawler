import { catchMain } from '@beenotung/tslib/node'
import { initBrowser } from './browser'
import { config } from './config'
import {
  getPendingUrls,
  initDB,
  insertHeaders,
  insertImages,
  insertLinks,
  insertUrls,
  updateUrlResult,
} from './db'

async function main() {
  let browser = await initBrowser(config.entry)
  initDB(config.entry)
  let hasError = false
  for (;;) {
    let urls = await getPendingUrls()
    console.log('pending urls:', urls.length)
    if (urls.length === 0) {
      break
    }
    for (let { id, url } of urls) {
      try {
        let { status, text, headers } = await browser.fetch(url)
        let header_id = insertHeaders(headers)
        updateUrlResult({ id, status_code: status, text, header_id })
        let { imgs, links } = await browser.parseHTML(text)
        insertImages({ imgs, site: config.site, source_url_id: id })
        insertLinks({ links, site: config.site, source_url_id: id })
      } catch (error) {
        console.error('Failed to fetch:', { url, error })
        hasError = true
        break
      }
    }
    if (hasError) {
      console.log('early terminate due to error, require manual debug')
    } else {
      console.log('finished crawling?')
    }
  }
  await browser.close()
}

catchMain(main())
