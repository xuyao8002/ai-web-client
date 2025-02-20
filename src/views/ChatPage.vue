<template>
  <div class="chat-page">
    <div class="sidebar">
      <button class="new-chat-btn">新建聊天</button>
      <div class="chat-list">
        <div v-for="chat in chatList" :key="chat._id" class="chat-item">
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
      <div class="chat-messages">
        <!-- 聊天内容将显示在这里 -->
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
  },
  methods: {
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

      // 这里可以添加发送消息的逻辑
      console.log('发送消息:', this.message);
      console.log('选择的模型:', this.selectedModel);
      this.message = '';
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
  position: relative; /* 为弹窗定位提供参考 */
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
.sidebar-footer {
  margin-top: auto;
  width: 100%;
  text-align: center;
  position: relative; /* 为弹窗定位提供参考 */
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
.settings-modal {
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
