import DB from 'better-sqlite3-helper'

export let db = DB({
  path: 'data/db.sqlite3',
  migrate: {
    migrationsPath: './migrations',
  },
})

function getCols(table: string): Array<{ name: string }> {
  return db.prepare(`pragma table_info(${table})`).all()
}

let headerCols = new Set<string>()
getCols('headers').forEach(row => headerCols.add(row.name))

export function insertHeaders(headers: object) {
  Object.keys(headers).forEach(key => {
    if (headerCols.has(key)) return
    db.prepare(`alter table headers add column "${key}" json`).run()
    headerCols.add(key)
  })
  return db.insert('headers', headers)
}

export function insertPage(url: string) {}

let update_url_result = db.prepare(
  `update urls
   set status_code = :status_code,
       text        = :text,
       header_id   = :header_id
   where id = :id`,
)

export function updateUrlResult(row: {
  id: number
  status_code: number
  text: string
  header_id: number
}) {
  update_url_result.run(row)
}

let select_pending_url = db.prepare(
  `select id, url
   from urls
   where status_code is null
     and site`,
)

export function getPendingUrls(): { id: number; url: string }[] {
  return select_pending_url.all()
}

let select_url_id = db.prepare(`select id
                                from urls
                                where url = :url`)

export function insertUrl(url: string, site: string): number {
  let row = select_url_id.get({ url })
  if (row) {
    return row.id
  }
  return db.insert('urls', { url, site: Bool(url.includes(site)) })
}

export function insertImages(options: {
  imgs: { src: string; alt: string }[]
  site: string
  source_url_id: number
}) {
  let rows = options.imgs.map(img => {
    let url_id = insertUrl(img.src, options.site)
    return {
      url_id,
      source_url_id: options.source_url_id,
      alt: img.alt,
    }
  })
  if (rows.length === 0) return
  db.insert('images', rows)
}

export function insertLinks(options: {
  links: { text: string | null; href: string }[]
  site: string
  source_url_id: number
}) {
  let rows = options.links.map(link => {
    let dest_url_id = insertUrl(link.href, options.site)
    return {
      dest_url_id,
      source_url_id: options.source_url_id,
      text: link.text,
    }
  })
  if (rows.length === 0) return
  db.insert('links', rows)
}

let count_url = db.prepare(`select count(*) count
                            from urls`)

export function initDB(entryUrl: string) {
  let count = count_url.get().count
  if (count === 0) {
    db.insert('urls', { url: entryUrl, site: Bool(true) })
  }
}

function Bool(bool: boolean) {
  return bool ? 1 : 0
}
