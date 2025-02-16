<template>
  <div class="chat-page">
    <div class="sidebar">
      <button class="new-chat-btn">新建聊天</button>
      <div class="sidebar-footer">
        <p>设置</p>
        <p>个人信息</p>
      </div>
    </div>
    <div class="chat-container">
      <div class="chat-messages">
        <!-- 聊天内容将显示在这里 -->
      </div>
      <div class="chat-input">
        <textarea v-model="message" placeholder="输入消息..." rows="4"></textarea>
        <button @click="sendMessage">发送</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: ''
    };
  },
  methods: {
    sendMessage() {
      // 这里可以添加发送消息的逻辑
      console.log('发送消息:', this.message);
      this.message = '';
    }
  }
};
</script>

<style scoped>
.chat-page {
  display: flex;
  height: 100vh; /* 使用视口高度 */
  overflow: hidden; /* 隐藏滚动条 */
}
.sidebar {
  width: 300px;
  background-color: #f4f4f4;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  overflow: hidden; /* 隐藏滚动条 */
}
.new-chat-btn {
  margin-bottom: 20px;
}
.sidebar-footer {
  margin-top: auto;
}
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 隐藏滚动条 */
}
.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto; /* 允许聊天内容区域滚动 */
}
.chat-input {
  display: flex;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ddd;
}
textarea {
  flex: 1;
  margin-right: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
</style>
