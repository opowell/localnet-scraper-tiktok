import { afterEach, describe, expect, it } from 'vitest'
import { parserLoader, resetPage, visit } from '#scraper-test'

// The parser, evaluated with the helpers it is injected with, as a scrape runs it.
const load = parserLoader(__dirname)

afterEach(resetPage)

// A page whose server wrote this scope for its app.
function rehydration(scope: object) {
  return `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">${JSON.stringify({ __DEFAULT_SCOPE__: scope })}</script>`
}

describe('tiktok', () => {
  it('reads a video as TikTok\'s player for it, its caption and its counts', async () => {
    const { parseTikTok } = load('tiktok.js', ['parseTikTok'])
    visit('https://www.tiktok.com/@nasa/video/7708867568920038669?lang=en', rehydration({
      'webapp.video-detail': { itemInfo: { itemStruct: {
        id: '7708867568920038669',
        desc: 'Could you be a NASA astronaut?\nApply now.',
        createTime: '1794860611',
        author: { uniqueId: 'nasa', nickname: 'NASA' },
        stats: { diggCount: 2364, shareCount: 69, commentCount: 105, playCount: 15200 },
        video: { cover: 'https://p16.tiktokcdn.com/cover.jpeg', duration: 63 },
        music: { title: 'Retro Sounds', authorName: 'DreamyBeats' },
        challenges: [{ title: 'space' }],
      } } },
    }))
    const parsed = await parseTikTok()
    expect(parsed.title).toBe('Could you be a NASA astronaut?')
    expect(parsed.content).toEqual([
      '<post author="NASA" author-url="https://www.tiktok.com/@nasa">',
      '[![](https://p16.tiktokcdn.com/cover.jpeg)](https://www.tiktok.com/player/v1/7708867568920038669)',
      'Could you be a NASA astronaut?\nApply now.',
    ])
    expect(parsed.links).toEqual([
      { url: 'https://www.tiktok.com/tag/space', title: '#space', score: 0.5 },
      { url: 'https://www.tiktok.com/@nasa', score: 1 },
    ])
    expect(Object.fromEntries(parsed.details)).toMatchObject({
      minutes: 1,
      views: 15200,
      published: '2026-11-16',
      likes: 2364,
      comments: 105,
      shares: 69,
      sound: 'Retro Sounds · DreamyBeats',
    })
  })

  it('reads a profile\'s bio and counts, as a listing of its videos', async () => {
    const { parseTikTok } = load('tiktok.js', ['parseTikTok'])
    visit('https://www.tiktok.com/@nasa', `${rehydration({
      'webapp.user-detail': { userInfo: { user: { uniqueId: 'nasa', nickname: 'NASA', signature: 'Exploring the universe' }, stats: { followerCount: 8000000, heartCount: 90000000, videoCount: 1200 } } },
    })}<a href="/@nasa/video/1?is_from_webapp=1">A</a>`)
    expect(await parseTikTok()).toEqual({
      listing: true,
      links: [{ url: 'https://www.tiktok.com/@nasa/video/1', score: 1 }],
      title: 'NASA (@nasa)',
      content: ['Exploring the universe'],
      details: [['followers', 8000000], ['likes', 90000000], ['videos', 1200]],
    })
  })
})
