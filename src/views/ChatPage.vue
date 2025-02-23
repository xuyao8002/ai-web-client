<template>
  <div class="chat-page">
    <div class="sidebar">
      <button class="new-chat-btn" @click="newChat">新建聊天</button>
      <div class="chat-list">
        <div v-for="chat in chatList" :key="chat._id" class="chat-item" :class="{ active: chat._id === currentChatId }"
          @click="selectChat(chat._id)">
          {{ chat.title }}
        </div>
      </div>
      <div class="sidebar-footer">
        <p @click="showSettings">设置</p>
        <p @click="toggleProfile">个人信息</p>
      </div>

      <!-- 个人信息弹窗 -->
      <div v-if="showProfileModal" class="profile-modal" @click.self="closeProfileModal">
        <div class="modal-content">
          <p>用户名: {{ user.username }}</p>
          <button @click="logout">退出登录</button>
        </div>
      </div>

      <!-- 设置弹窗 -->
      <div v-if="showSettingsModal" class="settings-modal" @click.self="closeSettingsModal">
      <div class="modal-content">
        <div class="form-group">
          <label>模型名称:</label>
          <select v-model="settings.selectedModel" @change="loadUserModelSettings(settings.selectedModel)">
            <option v-for="model in modelList" :key="model._id" :value="model._id">
              {{ model.model_name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>API Key:</label>
          <input type="text" v-model="settings.apiKey" />
        </div>
        <div class="form-group">
          <label>Base URL:</label>
          <input type="text" v-model="settings.baseUrl" />
        </div>
        <button @click="saveSettings">保存</button>
      </div>
    </div>
    </div>
    <div class="chat-container">
      <div class="chat-messages" ref="chatMessages">
        <div v-for="(message, index) in messages" :key="index" :class="message.position">
          {{ message.content }}
        </div>
      </div>
      <div class="chat-input">
        <textarea v-model="message" placeholder="输入消息..." rows="4"></textarea>
        <div class="input-actions">
          <button @click="sendMessage" :disabled="!message.trim()">发送</button>
          <select v-model="selectedModel">
            <option v-for="model in modelList" :key="model._id" :value="model._id">
              {{ model.model_name }}
            </option>
          </select>
        </div>
      </div>
    </div>  
</div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      message: '',
      chatList: [], // 聊天记录列表
      showProfileModal: false, // 是否显示个人信息弹窗
      showSettingsModal: false, // 是否显示设置弹窗
      user: JSON.parse(localStorage.getItem('user') || '{}'), // 用户信息
      modelList: [], // 模型列表
      selectedModel: '', // 当前选中的模型
      userModels: [], // 用户模型配置信息
      settings: {
        selectedModel: '', // 设置弹框中选中的模型
        apiKey: '', // 设置弹框中的apiKey
        baseUrl: '', // 设置弹框中的baseUrl
      },
      messages: [], // 聊天记录
      eventSource: null, // SSE 连接
      isStreaming: false, // 是否正在接收流式数据i
      currentChatId: null, // 当前聊天记录的 ID
    };
  },
  watch: {
    // 监听设置弹框中模型选择的变化
    'settings.selectedModel': {
      handler(newModelId) {
        this.loadUserModelSettings(newModelId);
      },
      immediate: true,
    },
    // 监听 messages 变化，确保每次更新后滚动到底部
    messages() {
      this.scrollToBottom();
    }, 
  },
  methods: {
    // 新建聊天
    newChat() {
      this.currentChatId = null; // 清空当前聊天 ID
      this.messages = []; // 清空当前聊天记录
      this.message = ''; // 清空输入框
    },
    // 选择聊天记录
    selectChat(chatId) {
      this.currentChatId = chatId;
      const selectedChat = this.chatList.find((chat) => chat._id === chatId);
      if (selectedChat) {
        if(!selectedChat.messages){
          const token = localStorage.getItem('token');
          if (!token) { 
            this.$router.push('/'); // 未登录，跳转到登录页面
            return;
          }
 
          axios.get('/api/message/get', {
            params: {
              id: `${selectedChat._id}`	
            },
            headers: {
              Authorization: `Bearer ${token}`, // 传递token
            },
          }).then(response => {
            selectedChat.messages = response.data;
            this.messages = selectedChat.messages.map((msg) => ({
            content: msg.content,
            position: msg.role === 'user' ? 'right' : 'left', // 用户消息在右侧，AI 回复在左侧
        }));
          });
        }else{
          this.messages = selectedChat.messages.map((msg) => ({
          content: msg.content,
          position: msg.role === 'user' ? 'right' : 'left', // 用户消息在右侧，AI 回复在左侧
        }));
        }
      }
    },  
    // 加载聊天记录
    async loadChatList() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/'); // 未登录，跳转到登录页面
          return;
        }

        const response = await axios.get('/api/message/list', {
          headers: {
            Authorization: `Bearer ${token}`, // 传递token
          },
        });
        this.chatList = response.data;
      } catch (error) {
        console.error('加载聊天记录失败:', error);
        if (error.response && error.response.status === 401) {
          // token无效，跳转到登录页面
          this.$router.push('/');
        }
      }
    },
    // 加载模型列表
    async loadModelList() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/'); // 未登录，跳转到登录页面
          return;
        }

        const response = await axios.get('/api/model/list', {
          headers: {
            Authorization: `Bearer ${token}`, // 传递token
          },
        });
        this.modelList = response.data;
        if (this.modelList.length > 0) {
          this.selectedModel = this.modelList[0]._id; // 默认选择第一条
          this.settings.selectedModel = this.modelList[0]._id; // 设置弹框默认选择第一条
        }
      } catch (error) {
        console.error('加载模型列表失败:', error);
        if (error.response && error.response.status === 401) {
          // token无效，跳转到登录页面
          this.$router.push('/');
        }
      }
    },
    // 加载用户模型配置信息
    async loadUserModels() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/'); // 未登录，跳转到登录页面
          return;
        }

        const response = await axios.get('/api/userModel/get', {
          headers: {
            Authorization: `Bearer ${token}`, // 传递token
          },
        });
        this.userModels = response.data;
      } catch (error) {
        console.error('加载用户模型配置失败:', error);
        if (error.response && error.response.status === 401) {
          // token无效，跳转到登录页面
          this.$router.push('/');
        }
      }
    },
    // 加载设置弹框中的用户模型配置
    loadUserModelSettings(modelId) {
      const userModel = this.userModels.find((um) => um.model_id === modelId);
      if (userModel) {
        this.settings.apiKey = userModel.api_key;
        this.settings.baseUrl = userModel.base_url;
      } else {
        this.settings.apiKey = '';
        this.settings.baseUrl = '';
      }
    },
    // 显示设置弹框
    showSettings() {
      this.showSettingsModal = true;
      // 显示弹框时，加载当前选中模型的配置
      this.loadUserModelSettings(this.settings.selectedModel);
    },
    // 关闭设置弹框
    closeSettingsModal() {
      this.showSettingsModal = false;
    },
    // 保存设置
    async saveSettings() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/'); // 未登录，跳转到登录页面
          return;
        }

        const payload = {
          model_id: this.settings.selectedModel,
          api_key: this.settings.apiKey,
          base_url: this.settings.baseUrl,
        };

        await axios.post('/api/userModel/save', payload, {
          headers: {
            Authorization: `Bearer ${token}`, // 传递token
          },
        });

        // 重新加载用户模型配置
        await this.loadUserModels();
        // 关闭设置弹框
        this.closeSettingsModal();
      } catch (error) {
        console.error('保存设置失败:', error);
      }
    },
    // 发送消息
    async sendMessage() {
      const userModel = this.userModels.find((um) => um.model_id === this.selectedModel);
      if (!userModel || !userModel.api_key || !userModel.base_url) {
        alert('请先去设置中配置api_key和base_url');
        return;
      }
      if (!this.message.trim()) return;
      
      // 如果当前没有聊天记录，创建一条新的聊天记录
      if (!this.currentChatId) {
        const newChat = {
          _id: -1, // 使用时间戳作为唯一 ID
          title: this.message.slice(0, 20), // 取消息的前 20 个字符作为标题
          messages: [], // 初始化消息列表
        };
        this.chatList.unshift(newChat); // 添加到 chatList 最上面
        this.currentChatId = newChat._id; // 设置为当前聊天记录
      }

      // 将用户消息添加到聊天记录
      //this.messages.push({ content: this.message, position: 'right' });
      
      // 将用户消息添加到当前聊天记录
      const currentChat = this.chatList.find((chat) => chat._id === this.currentChatId);
      if (currentChat) {
        currentChat.messages.push({ content: this.message, role: 'user' });
        this.messages.push({ content: this.message, position: 'right' });
      }

      // 获取 token
      const token = localStorage.getItem('token');
      if (!token) {
        alert('用户未登录');
        this.$router.push('/');
        return;
      }
      // 初始化 AI 回复的消息
      const aiMessage = { content: '', role: 'assistant' }; // AI 回复
      currentChat.messages.push(aiMessage); // 将 AI 回复添加到聊天记录
      this.messages.push({ content: '', position: 'left' });
      this.isStreaming = true;

      //if(!this.currentChatId){
//	this.currentChatId = -1;
  //    }
      // 调用后端 /message/chat 接口，将 token 作为查询参数
      this.eventSource = new EventSource(
        `/api/message/chat?id=${this.currentChatId}&model_id=${this.selectedModel}&content=${encodeURIComponent(
          this.message
        )}&token=${token}`
      );

      this.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'reasoning' || data.type === 'answer') {
          // 将 AI 回复添加到聊天记录
          const lastMessage = this.messages[this.messages.length - 1];
//	console.log('message: ' + lastMessage);
          lastMessage.content += data.content;
          // 强制更新视图
         // this.$forceUpdate();
       
          // 更新当前聊天记录的 AI 回复
          if (currentChat) {
            const lastChatMessage = currentChat.messages[currentChat.messages.length - 1];
            lastChatMessage.content += data.content; // 直接追加到 AI 回复中
          }
          // 滚动到底部
          this.scrollToBottom();
        } else if (data.type === 'error') {
          console.error('SSE 错误:', data.message);
        } else if(data.type === 'id'){
          this.currentChatId = data.content;
          this.chatList[0]._id = data.content;
        }
      };

      this.eventSource.onerror = () => {
        console.error('SSE 连接错误');
        this.eventSource.close();
        this.isStreaming = false;
      };
      // 清空多行文本框
      this.message = '';
      // 滚动到底部
      this.scrollToBottom();
    },
    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        const chatMessages = this.$refs.chatMessages;
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      });
    },
    // 切换个人信息弹窗
    toggleProfile() {
      this.showProfileModal = !this.showProfileModal;
    },
    // 关闭个人信息弹窗
    closeProfileModal() {
      this.showProfileModal = false;
    },
    // 退出登录
    async logout() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/'); // 未登录，跳转到登录页面
          return;
        }

        await axios.post('/api/auth/logout', null, {
          headers: {
            Authorization: `Bearer ${token}`, // 传递token
          },
        });

        // 清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // 关闭弹窗
        this.closeProfileModal();

        // 跳转到登录页面
        this.$router.push('/');
      } catch (error) {
        console.error('退出登录失败:', error);
        if (error.response && error.response.status === 401) {
          // token无效，跳转到登录页面
          this.$router.push('/');
        }
      }
    },
  },
  mounted() {
    // 检查用户是否登录
    const token = localStorage.getItem('token');
    if (!token) {
      // 未登录，跳转到登录页面
      this.$router.push('/');
    } else {
      // 加载聊天记录
      this.loadChatList();
      // 加载模型列表
      this.loadModelList();
      // 加载用户模型配置
      this.loadUserModels();
    }
  },
  beforeUnmount() {
    // 组件销毁时关闭 SSE 连接
    if (this.eventSource) {
      this.eventSource.close();
    }
  },
};
</script>

<style scoped>
.chat-page {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: 300px;
  background-color: #f4f4f4;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}
.new-chat-btn {
  margin-bottom: 20px;
}
.chat-list {
  flex: 1;
  width: 100%;
  overflow-y: auto;
}
.chat-item {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}
.chat-item:hover {
  background-color: #eee;
}
.chat-item.active {
  background-color: #007bff;
  color: white;
}
.sidebar-footer {
  margin-top: auto;
  width: 100%;
  text-align: center;
}
.sidebar-footer p {
  cursor: pointer;
  margin: 5px 0;
}
.sidebar-footer p:hover {
  color: #007bff;
}
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chat-messages .left {
  align-self: flex-start;
  background-color: #f1f1f1;
  padding: 10px;
  border-radius: 10px;
  max-width: 70%;
  white-space: pre-wrap; /* 允许自动换行 */
  word-wrap: break-word; /* 长单词或 URL 自动换行 */
}
.chat-messages .right {
  align-self: flex-end;
  background-color: #007bff;
  color: white;
  padding: 10px;
  border-radius: 10px;
  max-width: 70%;
  white-space: pre-wrap; /* 允许自动换行 */
  word-wrap: break-word; /* 长单词或 URL 自动换行 */
}
.chat-input {
  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ddd;
}
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}
.input-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
button:hover:not(:disabled) {
  background-color: #0056b3;
}
select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}
.profile-modal,
.settings-modal{
  position: fixed; /* 使用fixed定位，确保弹窗不受父元素限制 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5); /* 半透明背景 */
  z-index: 1000; /* 确保弹窗在最上层 */
}
.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}
.modal-content p {
  margin-bottom: 10px;
}
.form-group {
  margin-bottom: 15px;
  text-align: left;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
