<template>
  <div>
    <!-- closeable
    :close-on-click-overlay="false"
    @click-close-icon = "closePopup" -->
    <Popup
      v-model:show="modelValue"
      :close-on-click-overlay="false"
      class="wrap-pop" >
      <div class="img-box" @click="closePopup">
        <img class="img" src="@/assets/imgs/close.svg" alt="" @click="closePopup">
      </div>
      <video
        id="my_video"
        ref="myVideo"
        class="video"
        controls
        autoplay
        playsinline
        controlslist="nodownload noclose"
        disablepictureinpicture>
        <source :src="props.videoUrl" />
        您的浏览器不支持 video 播放。
      </video>
    </Popup>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { Popup } from 'vant'
const props = defineProps({
  videoUrl: String
})
const modelValue = defineModel('modelValue', { type: Boolean })
const $emit = defineEmits(['closePopup'])
const myVideo = ref<HTMLVideoElement | null>(null)
function showFullScreen(){
  nextTick(()=>{
    if (myVideo.value) {
      myVideo.value.play();
    }
  })
}
function closePopup(){
  console.log(232)
  modelValue.value = false
  nextTick(()=>{
    if (myVideo.value) {
      myVideo.value.load();
    }

  })
  $emit("closePopup")
}

watch(modelValue, (value) =>{
  if(value){
    showFullScreen()
  }
})
</script>

<style scoped lang="scss">
.img-box {
  width: 100%;
  height: 12px;
  position: relative;
  background-color: #000;
  .img {
    position: absolute;
    right: 0px;
    top: 2px;
    height: 10px;
    width: 15px;
  }
}
.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.wrap-pop{
  width: 100%;
  height: 188px;
  // overflow: hidden;
  background-color: #fff;

  #my_video{
    width: 100%;
    height: 100%;
  }
  .close-btn{
    position: absolute;
    width: 50px;
    height: 50px;
    top: -50px;
    left: 0;
    background-color: #fff;
    z-index: 2002;
  }
}
</style>

