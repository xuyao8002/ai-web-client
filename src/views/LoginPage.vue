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
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: ''
    };
  },
  methods: {
    login() {
      // 这里可以添加登录逻辑
      this.$router.push('/chat');
    }
  }
};
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh; /* 使用视口高度 */
  overflow: hidden; /* 隐藏滚动条 */
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
