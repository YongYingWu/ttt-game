import type { ICardItem } from '@/components/Waterfall/type'
import data1 from './data1.json'
import data2 from './data2.json'

const colorArr = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399']

export const list1: ICardItem[] = data1.data.items.map((i) => ({
  id: i.id,
  width: i.note_card.cover.width,
  height: i.note_card.cover.height,
  title: i.note_card.display_title,
  author: i.note_card.user,
  like: i.note_card.interact_info.liked_count,
  type: i.note_card.type,
  game: '和平精英',
  bg: i.note_card.cover.url_default,
  videoUrl: 'http://vjs.zencdn.net/v/oceans.mp4',
}))

export const list2: ICardItem[] = data2.data.items.map((i) => ({
  id: i.id,
  width: i.note_card.cover.width,
  height: i.note_card.cover.height,
  title: i.note_card.display_title,
  author: i.note_card.user,
  type: i.note_card.type,
  game: '和平精英',
  like: i.note_card.interact_info.liked_count,
  bg: i.note_card.cover.url_default,
  videoUrl: 'http://vjs.zencdn.net/v/oceans.mp4',
}))
