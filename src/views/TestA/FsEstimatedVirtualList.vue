// 流程归纳
// 监听数据，初始化position位置信息，根据预计高度，设置数据所在位置
// 监听数据和startIndex,在页面渲染时，获取真实高度，修改position的信息以及页面总高度
// 滚动事件，根据滚动高度获取可视区的startIndex
<template>
  <div class="fs-estimated-virtuallist-container">
    <div class="fs-estimated-virtuallist-content" ref="contentRef" @scroll="handleScroll">
      <div class="fs-estimated-virtuallist-list" ref="listRef" :style="scrollStyle">
        <div class="fs-estimated-virtuallist-list-item" v-for="i in renderList" :key="i.id" :id="String(i.id)">
          <slot name="item" :item="i"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends {id:number}">
import { type CSSProperties, computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import type { IEstimatedListProps, IPosInfo } from "./type";
import { rafThrottle } from "./tool";
import { start } from "repl";

const props = defineProps<IEstimatedListProps<T>>();

const emit = defineEmits<{
  getMoreData: [];
}>();

defineSlots<{
  item(props: { item: T }): any;
}>();

const contentRef = ref<HTMLDivElement>();

const listRef = ref<HTMLDivElement>();

const positions = ref<IPosInfo[]>([]);

const state = reactive({
  viewHeight: 0,
  listHeight: 0,
  startIndex: 0,
  maxCount: 0,
  preLen: 0, // 上次计算的长度
  preStart: 0,
});

const endIndex = computed(() => Math.min(props.dataSource.length, state.startIndex + state.maxCount));

const renderList = computed(() => props.dataSource.slice(state.startIndex, endIndex.value));

const offsetDis = computed(() => (state.startIndex > 0 ? positions.value[state.startIndex - 1].bottom : 0));

const scrollStyle = computed(
  () =>
    ({
      height: `${state.listHeight - offsetDis.value}px`,
      transform: `translate3d(0, ${offsetDis.value}px, 0)`,
    } as CSSProperties)
);

// 监听数据
watch(
  () => props.dataSource.length,
  () => {
    initPosition();
    nextTick(() => {
      setPosition();
    });
  }
);

// 监听起始位置
watch(
  () => state.startIndex,
  () => {
    setPosition();
  }
);

// 初始化：拿到数据, 初始化 position位置 数组
// 数据更新时调用
const initPosition = () => {
  console.log("initPosition");
  const pos: IPosInfo[] = [];
  // 计算新增数据长度
  const disLen = props.dataSource.length - state.preLen;
  const currentLen = positions.value.length;
  // 获取上次数据渲染总高度（position现在仍然是数据更新前的状态）
  const preBottom = positions.value[currentLen - 1] ? positions.value[currentLen - 1].bottom : 0;
  // 为新增数据初始化渲染位置的信息
  for (let i = 0; i < disLen; i++) {
    const item = props.dataSource[state.preLen + i];
    pos.push({
      index: item.id,
      height: props.estimatedHeight, // 初始化的高度按照预估高度计算
      top: preBottom ? preBottom + i * props.estimatedHeight : item.id * props.estimatedHeight,
      bottom: preBottom ? preBottom + (i + 1) * props.estimatedHeight : (item.id + 1) * props.estimatedHeight,
      dHeight: 0,
    });
  }
  positions.value = [...positions.value, ...pos];
  // 更新当前数据的高度
  state.preLen = props.dataSource.length;
};
// 但是存在一个问题，需要更频繁的更新总高度，滚动到最后看起来像抖动
// 数据 item 渲染完成后，更新数据item的真实高度
// 1. 数据更新时调用 2. 视图更新时调用（startIndex更新时)）
const setPosition2 = () => {
  console.log("setPosition");
  const nodes = listRef.value?.children;
  let sumDHeight = 0
  if (!nodes || !nodes.length) return;
  [...nodes].forEach((node) => {
    const rect = node.getBoundingClientRect();
    const item = positions.value[+node.id];
    const dHeight = item.height - rect.height;
    sumDHeight += dHeight
    if (dHeight) {
      item.height = rect.height;
      if (item.top === 0) {
        item.bottom = item.top + rect.height
      } else {
        item.top = positions.value[+node.id - 1].bottom;
        item.bottom = item.top + rect.height
      }
    }
  });

  // 只要更新endIndex+1的数据即可
  const startId = +nodes[nodes.length - 1].id;
  const len = positions.value.length;
  if (startId + 1 < len) {
    const item = positions.value[startId + 1];
    item.top = positions.value[startId].bottom;
    item.bottom = item.top + item.height;
  }
  // for (let i = startId + 1; i < len; i++) {
  //   const item = positions.value[i];
  //   item.top = positions.value[i - 1].bottom;
  //   item.bottom = item.top + item.height;
  // }
  // console.log('positions', positions.value);
  state.listHeight = positions.value[len - 1].bottom + sumDHeight;
};
const setPosition = () => {
  const nodes = listRef.value?.children;
  if (!nodes || !nodes.length) return;
  [...nodes].forEach((node) => {
    const rect = node.getBoundingClientRect();
    const item = positions.value[+node.id];
    const dHeight = item.height - rect.height;
    if (dHeight) {
      item.height = rect.height;
      item.bottom = item.bottom - dHeight;
      item.dHeight = dHeight;
    }
  });

  const startId = +nodes[0].id;
  const len = positions.value.length;
  let startHeight = positions.value[startId].dHeight;
  positions.value[startId].dHeight = 0;
  for (let i = startId + 1; i < len; i++) {
    const item = positions.value[i];
    item.top = positions.value[i - 1].bottom;
    item.bottom = item.bottom - startHeight;
    if (item.dHeight !== 0) {
      startHeight += item.dHeight;
      item.dHeight = 0;
    }
  }
  state.listHeight = positions.value[len - 1].bottom;
};
// 初始化入口
// 获取可见区高度，计算最大渲染数量
const init = () => {
  console.log("init");
  state.viewHeight = contentRef.value ? contentRef.value.offsetHeight : 0;
  state.maxCount = Math.ceil(state.viewHeight / props.estimatedHeight) + 1;
  // contentRef.value && contentRef.value.addEventListener("scroll", handleScroll);
};
const destory = () => {
  contentRef.value && contentRef.value.removeEventListener("scroll", handleScroll);
};

//**
// 滚动事件
// @description 控制下拉刷新和可见区域的数据
//  */
const handleScroll = rafThrottle(() => {
  console.log("handleScroll");
  const { scrollTop, clientHeight, scrollHeight } = contentRef.value!;
  console.log(scrollTop, clientHeight, scrollHeight);
  const startIndex = binarySearch(positions.value, scrollTop);
  state.startIndex = startIndex;
  state.preStart = state.startIndex;
  // 包含不可见区域的高度 - 可见区域的高度 - 滚动的高度 = 剩余高度
  const bottom = scrollHeight - clientHeight - scrollTop;
  if (bottom <= 20) {
    !props.loading && emit("getMoreData");
  }
});

// 二分查找可视区域的起始数据
const binarySearch = (list: IPosInfo[], value: number) => {
  console.log("binarySearch");
  let left = 0,
    right = list.length - 1,
    templateIndex = -1;
  while (left < right) {
    const midIndex = Math.floor((left + right) / 2);
    const midValue = list[midIndex].bottom;
    if (midValue === value) return midIndex + 1;
    else if (midValue < value) left = midIndex + 1;
    else if (midValue > value) {
      if (templateIndex === -1 || templateIndex > midIndex) templateIndex = midIndex;
      right = midIndex;
    }
  }
  return templateIndex;
};

onMounted(() => {
  init();
});

onUnmounted(() => {
  destory();
});
</script>

<style scoped lang="scss">
.fs-estimated-virtuallist {
  &-container {
    width: 100%;
    height: 100%;
  }
  &-content {
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  &-list-item {
    width: 100%;
    box-sizing: border-box;

  // 为元素添加min-height = 默认高度，防止元素高度小于总高度，出现空白
  // way2: 动态计算可视区域显示元素个数
    & > * {
      min-height: v-bind("`${props.estimatedHeight}px`"); ;
    }
  }
}
</style>
