<template>
  <div class="virtual-waterfall-container" ref="containerRef" @scroll="handleScroll">
      <PullRefresh v-model="refreshing" @refresh="onRefresh">
        <div class="virtual-waterfall-list" :style="listStyle">
          <template v-if="isShow">
            <div
              class="virtual-waterfall-item"
              v-for="{ item, style, imageHeight } in renderList"
              :key="item.id"
              :style="style"
            >
              <slot name="item" :item="item" :imageHeight="imageHeight"></slot>
            </div>
          </template>
          <div id="temporary-list" v-else>
            <div v-for="{ item, style, imageHeight } in temporaryList" :key="item.id" :style="style">
              <slot name="item" :item="item" :imageHeight="imageHeight"></slot>
            </div>
          </div>
        </div>
      </PullRefresh>
    </div>
</template>

<script setup lang="ts">
import { PullRefresh } from 'vant';
import type {CSSProperties} from "vue";
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import type { IVirtualWaterFallProps, ICardItem, IBookColumnQueue, IBookRenderItem, IBookItemRect } from "./type";
import { debounce, rafThrottle } from "./tool";
const refreshing = ref(false);
const onRefresh = (): void => {
  dataState.currentPage = 1
  dataState.isFinish = false;
  refreshing.value = true;
  dataState.list = []
  loadDataList()
};
const props = defineProps<IVirtualWaterFallProps>();

defineSlots<{
  item(props: { item: ICardItem; imageHeight: number }): any;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

const resizeObserver = new ResizeObserver(() => {
  handleResize();
});

const dataState = reactive({
  loading: false,
  isFinish: false,
  currentPage: 1,
  list: [] as ICardItem[],
});

const scrollState = reactive({
  viewWidth: 0,
  viewHeight: 0,
  start: 0,
});

const queueState = reactive({
  queue: new Array(props.column).fill(0).map<IBookColumnQueue>(() => ({ list: [], height: 0 })),
  len: 0,
});

const hasMoreData = computed(() => queueState.len < dataState.list.length);

const temporaryList = ref<IBookRenderItem[]>([]);

const isShow = ref(false);

const itemSizeInfo = ref(new Map<ICardItem["id"], IBookItemRect>());

const end = computed(() => scrollState.viewHeight + scrollState.start);

const cardList = computed(() => queueState.queue.reduce<IBookRenderItem[]>((pre, { list }) => pre.concat(list), []));

const renderList = computed(() => cardList.value.filter((i) => i.h + i.y > scrollState.start && i.y < end.value));

const computedHeight = computed(() => {
  let minIndex = 0,
    minHeight = Infinity,
    maxHeight = -Infinity;
  queueState.queue.forEach(({ height }, index) => {
    if (height < minHeight) {
      minHeight = height;
      minIndex = index;
    }
    if (height > maxHeight) {
      maxHeight = height;
    }
  });
  return {
    minIndex,
    minHeight,
    maxHeight,
  };
});

const listStyle = computed(() => ({ height: `${computedHeight.value.maxHeight}px` } as CSSProperties));

watch(
  () => props.column,
  () => {
    handleResize();
  }
);

const setItemSize = () => {
  itemSizeInfo.value = dataState.list.reduce<Map<ICardItem["id"], IBookItemRect>>((pre, current) => {
    const itemWidth = Math.floor((scrollState.viewWidth - (props.column - 1) * props.gap) / props.column);
    const rect = itemSizeInfo.value.get(current.id);
    pre.set(current.id, {
      width: itemWidth,
      height: rect ? rect.height : 0,
      imageHeight: Math.floor((itemWidth * current.height) / current.width),
    });
    return pre;
  }, new Map());
};

const updateItemSize = () => {
  temporaryList.value.forEach(({ item, h }) => {
    const rect = itemSizeInfo.value.get(item.id)!;
    itemSizeInfo.value.set(item.id, { ...rect, height: h });
  });
};

const addInQueue = (size = props.enterSize) => {
  for (let i = 0; i < size!; i++) {
    const minIndex = computedHeight.value.minIndex;
    const currentColumn = queueState.queue[minIndex];
    const before = currentColumn.list[currentColumn.list.length - 1] || null;
    const dataItem = dataState.list[queueState.len];
    const item = generatorItem(dataItem, before, minIndex);
    currentColumn.list.push(item);
    currentColumn.height = item.y;
    queueState.len++;
  }
};

const generatorItem = (item: ICardItem, before: IBookRenderItem | null, index: number): IBookRenderItem => {
  const rect = itemSizeInfo.value.get(item.id)!;
  const width = rect.width;
  const height = rect.height;
  const imageHeight = rect.imageHeight;
  let y = 0;
  if (before) y = before.y + before.h + props.gap;
  return {
    item,
    y,
    h: height,
    imageHeight,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate3d(${index === 0 ? 0 : (width + props.gap) * index}px, ${y}px, 0)`,
    },
  };
};

const loadDataList = async () => {
  if (dataState.isFinish) return;
  dataState.loading = true;
  const list = await props.request(dataState.currentPage++, props.pageSize);
  if (!list.length) {
    dataState.isFinish = true;
    return;
  }
  dataState.list.push(...list);
  dataState.loading = false;
  refreshing.value = false;
  return list.length;
};

const handleScroll = rafThrottle(() => {
  const { scrollTop, clientHeight } = containerRef.value!;
  scrollState.start = scrollTop;
  if (!dataState.loading && !hasMoreData.value) {
    loadDataList().then((len) => {
      len && setItemSize();
      len && mountTemporaryList();
    });
    return;
  }
  if (scrollTop + clientHeight > computedHeight.value.minHeight) {
    mountTemporaryList();
  }
});

const handleResize = debounce(() => {
  initScrollState();
  reComputedQueue();
}, 300);

const reComputedQueue = () => {
  setItemSize();
  queueState.queue = new Array(props.column).fill(0).map<IBookColumnQueue>(() => ({ list: [], height: 0 }));
  queueState.len = 0;
  if (containerRef.value) {
    containerRef.value!.scrollTop = 0;
  }
  mountTemporaryList(props.pageSize);
};

const mountTemporaryList = (size = props.enterSize) => {
  if (!hasMoreData.value) return;
  isShow.value = false;
  for (let i = 0; i < size!; i++) {
    const item = dataState.list[queueState.len + i];
    if (!item) break;
    const rect = itemSizeInfo.value.get(item.id)!;
    temporaryList.value.push({
      item,
      y: 0,
      h: 0,
      imageHeight: rect.imageHeight,
      style: {
        width: `${rect.width}px`,
      },
    });
  }

  nextTick(() => {
    const list = document.querySelector("#temporary-list")!;
    [...list.children].forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      temporaryList.value[index].h = rect.height;
    });
    isShow.value = true;
    updateItemSize();
    addInQueue(temporaryList.value.length);
    temporaryList.value = [];
  });
};

const initScrollState = () => {
  if (containerRef.value) {
    scrollState.viewWidth = containerRef.value!.clientWidth;
    scrollState.viewHeight = containerRef.value!.clientHeight;
    scrollState.start = containerRef.value!.scrollTop;
  }
};

const init = async () => {
  initScrollState();
  resizeObserver.observe(containerRef.value!);
  const len = await loadDataList();
  setItemSize();
  len && mountTemporaryList(len);
};

onMounted(() => {
  init();
});

onUnmounted(() => {
  if (containerRef.value) {
    resizeObserver.unobserve(containerRef.value!);
  }
});
</script>

<style scoped lang="scss">
.virtual-waterfall {
  &-container {
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
  }
  &-list {
    display: flex;
    position: relative;
    width: 100%;
    & > * {
      flex: 1;
    }
  }
  &-item {
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
  }
}
</style>
