<template>
  <div class="app">
    <div class="container" ref="fContainerRef">
      <VisualWaterfall :request="getData" :gap="15" :page-size="20" :column="column" :enter-size="column * 2">
        <template #item="{ item, imageHeight }">
          <Card
            @click="cardClick(item)"
            :detail="{
              imageHeight,
              title: item.title,
              game: item.game,
              author: item.author,
              likes: item.likes,
              avatar: item.avatar,
              ...item,
            }"
          />
        </template>
      </VisualWaterfall>
    </div>
    <transition-group>
      <VideoComponent v-if="showVideo" v-model="showVideo" :videoUrl="videoUrl" />
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onBeforeMount } from "vue";
import { showDialog } from 'vant';
import { useRoute } from "vue-router";
import Card from "@/components/Card/index.vue";
import VisualWaterfall from "@/components/Waterfall/index.vue";
import type { ICardItem } from "@/components/Waterfall/type";
import {list1, list2} from "@/config/index";
import VideoComponent from '@/components/VideoComponent/index.vue'

const fContainerRef = ref<HTMLDivElement | null>(null);
const column = ref(6);
const fContainerObserver = new ResizeObserver((entries) => {
  changeColumn(entries[0].target.clientWidth);
});
const showVideo = ref(false);
const videoUrl = ref("");
const changeColumn = (width: number) => {
  if (width > 960) {
    column.value = 5;
  } else if (width >= 690 && width < 960) {
    column.value = 4;
  } else if (width >= 500 && width < 690) {
    column.value = 3;
  } else {
    column.value = 2;
  }
};


const list = ref<ICardItem>([])
onBeforeMount(() => {
  console.log(useRoute())
  const query = useRoute().query;
  if  (!query.id) {
    list.value = list1
    return
  }
  if (query.id === '1') {
    list.value = list1
  } else if (query.id === '2') {
    list.value = list2
  } else {
    showDialog({
      title: '提示',
      message: '对应资源不存在！！！',
    }).then(() => {
      // on close
      // router.push('/home')
      list.value = list1
    });
  }
  // list.value = list1
})
onMounted(() => {
  fContainerRef.value && fContainerObserver.observe(fContainerRef.value);
});

onUnmounted(() => {
  fContainerRef.value && fContainerObserver.unobserve(fContainerRef.value);
});

const getData = (page: number, pageSize: number) => {
  return new Promise<ICardItem[]>((resolve) => {
    setTimeout(() => {
      resolve(list.value.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize));
    }, 1000);
  });
};
function cardClick(item: any):void {
  showVideo.value = true;
  videoUrl.value = item.videoUrl
  console.log(showVideo.value)
}
</script>

<style scoped lang="scss">
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  padding: 2px;
}
</style>
