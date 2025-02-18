<template>
  <div class="login-page">
    <h1>登录</h1>
    <form @submit.prevent="login">
      <div>
        <label for="username">用户名:</label>
        <input type="text" id="username" v-model="username" required />
      </div>
      <div>
        <label for="password">密码:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">登录</button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '', // 错误提示信息
    };
  },
  methods: {
    async login() {
      this.errorMessage = ''; // 清空错误提示
      try {
        const response = await axios.post('/api/auth/login', {
          username: this.username,
          password: this.password,
        });

        if (response.data.token) {
          // 登录成功，保存token到localStorage
          localStorage.setItem('token', response.data.token);
          // 跳转到聊天页面
          this.$router.push('/chat');
        }
      } catch (error) {
        // 登录失败，显示错误提示
        if (error.response && error.response.data.message) {
          this.errorMessage = error.response.data.message;
        } else {
          this.errorMessage = '登录失败，请稍后重试';
        }
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.error-message {
  color: red;
  margin-top: 10px;
}
</style>
