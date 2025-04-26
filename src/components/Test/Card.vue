<template>
  <div class="fs-book-card-container" style="display: flex; flex-direction: column;gap: 6px;">
    <div class="fs-book-card-image">
      <!-- srcset根据实际情况来 -->
      <Image
        class="img"
        :srcset="`160.jpg 20w,
               ${props.detail.bg} 200w,`"
        :src="props.detail.bg"
        alt="">
        <template v-slot:loading>
          <Loading type="spinner" size="20" />
        </template>
      </Image>
      <img v-if="props.detail.type === 'video'" class="video" src="@/assets/imgs/bofang.svg" alt="" height="15" width="15">
    </div>
    <div class="fs-book-card-footer">
      <div class="title">{{ props.detail.title }}</div>
      <div class="game">{{ props.detail.game }}</div>
      <div class="author">
        <div class="author-info">
          <Image round class="img avatar" :src="props.detail.author.avatar" alt="" />
          <span class="name">{{ props.detail.author.nickname }}</span>
        </div>
        <div class="like" style="display: flex;" @click.stop="handleLick">
          <img
            v-if="!like"
            class="img"
            src="@/assets/imgs/inactive.svg"
            alt=""
            style="height: 1rem;width: 1rem;">
          <img
            v-else
            class="img"
            src="@/assets/imgs/active.svg"
            alt=""
            style="height: 1rem;width: 1rem;">
          {{ props.detail.like }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Image, Loading } from 'vant'

interface Author {
  avatar: string,
  nickname: string,
}
interface ICardDetail {
  title: string;
  author: Author;
  imageHeight: number;
  likes: number,
  [key: string]: any;
}
const props = defineProps<{
  detail: ICardDetail;
}>();
const like = ref(false)
// const likeUrl = ref('@/assets/imgs/inactive.svg')
function handleLick() {
  console.log('click')
  like.value = !like.value
}
onMounted(() => {
  console.log(props.detail)
  // const img = new Image()
  // img.srcset = `160.jpg 20w,
  //              ${props.detail.bg} 1600w,`
  // img.src = props.detail.bg
  // img.onload = () => {
  //   // url.value = img.src
  // }
  // img.src
})
</script>

<style scoped lang="scss">
.img {
  width: 100%;
  object-fit: cover;
}
.video {
  position: absolute;
  right: 5px;
  top: 5px;
  z-index: 999;
}
.fs-book-card {
  &-container {
    width: 100%;
    height: 100%;
    background-color: #fff;
  }
  &-image {
    width: 100%;
    height: v-bind("`${props.detail.imageHeight}px`");
    border-radius: 10px;
    overflow: hidden;
  }
  &-footer {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    .title {
      word-break: break-all;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      color: rgba(51, 51, 51, 0.8);
    }
    .game {
      height: 0.7rem;
      width: fit-content;
      line-height: 0.7rem;
      font-size: 0.7rem;
      border-radius: 10%;
      font-weight: 400;
      opacity: .7;
      background-color: #ccc;
    }
    .author {
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
      .author-info {
        flex: 1;
        display: flex;
        align-items: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        .avatar {
          margin-right: 6px;
          width: 20px;
          height: 20px;
          border-radius: 20px;
        }
        .name {
          width: 80%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(51, 51, 51, 0.8);
        }
      }
      .like {
        height: 1rem;
        line-height: 1rem;
      }
    }
  }
}
</style>
