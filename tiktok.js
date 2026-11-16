// What the page's server wrote for its app (__UNIVERSAL_DATA_FOR_REHYDRATION__): its default scope, or {} if none.
function tiktokData() {
  try {
    return JSON.parse(document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__')?.textContent || '{}').__DEFAULT_SCOPE__ || {}
  } catch {
    return {}
  }
}

// A video (/@nasa/video/7708867568920038669) reads as its caption's first line, then TikTok's player for it (which
// Read plays, see source.json) with its cover, headed by its author, then its caption. Its details are its author,
// hashtags, minutes, views, published day, likes, comments, shares and sound. It links with weight 1 to its author and
// with 0.5 to its hashtags' pages.
function tiktokVideo(item) {
  const author = item.author || {}
  const authorUrl = author.uniqueId ? `${location.origin}/@${author.uniqueId}` : null
  const caption = String(item.desc || '').trim()
  const firstLine = caption.split('\n')[0]
  const title = firstLine ? (firstLine.length > 100 ? `${firstLine.slice(0, 99)}…` : firstLine) : `${author.nickname || author.uniqueId} on TikTok`
  const stats = item.statsV2 || item.stats || {}
  const count = value => (value == null || value === '' ? null : Number(value))
  const tags = (item.challenges || []).map(tag => tag?.title).filter(Boolean)
    .map(name => ({ text: `#${name}`, url: `${location.origin}/tag/${encodeURIComponent(name)}` }))
  const parsed = videoPage({
    player: `https://www.tiktok.com/player/v1/${item.id}`,
    title,
    poster: item.video?.cover || item.video?.originCover || '',
    description: caption,
    authors: author.uniqueId ? [{ name: author.nickname || author.uniqueId, url: authorUrl }] : [],
    tags,
    seconds: item.video?.duration || null,
    views: count(stats.playCount),
    published: item.createTime ? new Date(Number(item.createTime) * 1000).toISOString() : null,
  })
  return {
    ...parsed,
    details: [
      ...parsed.details,
      ['likes', count(stats.diggCount)],
      ['comments', count(stats.commentCount)],
      ['shares', count(stats.shareCount)],
      ['sound', item.music?.title ? `${item.music.title}${item.music.authorName ? ` · ${item.music.authorName}` : ''}` : null],
    ],
  }
}

// A profile (/@nasa) reads as its name and handle and its bio, and is a listing of the videos it shows. Its details are
// its followers, likes and videos.
function tiktokProfile(detail) {
  const user = detail.userInfo?.user || {}
  const stats = detail.userInfo?.statsV2 || detail.userInfo?.stats || {}
  const videos = linkUrls('a[href*="/video/"]').map(url => url.split(/[?#]/)[0])
  const count = value => (value == null || value === '' ? null : Number(value))
  return {
    ...(listingOf(videos) ?? { listing: true }),
    title: `${user.nickname || user.uniqueId} (@${user.uniqueId})`,
    content: user.signature ? user.signature.split(/\n+/).map(line => line.trim()).filter(Boolean) : [],
    details: [
      ['followers', count(stats.followerCount)],
      ['likes', count(stats.heartCount)],
      ['videos', count(stats.videoCount)],
    ],
  }
}

// A page of TikTok: a video or a profile (see each), from the data its server writes for its app; any other page (a
// hashtag, /tag/…; a search; Explore) is a listing of the videos it shows. The page draws them with scripts, so they are
// waited for, up to 5 seconds.
async function parseTikTok(_profileId) {
  if (!/(?:^|\.)tiktok\.com$/.test(location.hostname)) {
    return null
  }
  const data = tiktokData()
  const item = data['webapp.video-detail']?.itemInfo?.itemStruct
  if (/\/video\/\d+/.test(location.pathname) && item?.id) {
    return tiktokVideo(item)
  }
  const user = data['webapp.user-detail']
  if (/^\/@[^/]+\/?$/.test(location.pathname) && user?.userInfo?.user) {
    await waitFor(() => document.querySelector('a[href*="/video/"]'), 5000)
    return tiktokProfile(user)
  }
  await waitFor(() => document.querySelector('a[href*="/video/"]'), 5000)
  return listingOf(linkUrls('a[href*="/video/"]').map(url => url.split(/[?#]/)[0])) ?? { listing: true }
}

// The parser a scrape calls.
registerParser(parseTikTok)
