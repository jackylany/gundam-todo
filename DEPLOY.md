# Gundam Todo 部署指南

## 目录

1. [AI 部署（推荐）](#ai-部署推荐)
2. [人工部署](#人工部署)
3. [配置说明](#配置说明)
4. [常见问题](#常见问题)

---

## AI 郅署（推荐）

### 前置条件

- 已安装 Claude Code CLI（或其他 AI 编程助手）
- 已安装 Go 1.21+
- 已安装 Node.js 18+
- 已安装 MySQL 8.0+

### 步骤

**1. 克隆项目**

```bash
git clone https://github.com/jackylany/gundam-todo.git
cd gundam-todo
```

**2. 启动 AI 并告知数据库配置**

打开 Claude Code，进入项目目录，发送：

```
帮我部署这个 Gundam Todo 项目

数据库配置：
- 地址：你的数据库地址（如 127.0.0.1）
- 端口：3306
- 用户：你的用户名
- 密码：你的密码
```

**3. AI 会自动完成以下操作**

- 检查并安装后端 Go 依赖
- 检查并安装前端 npm 依赖
- 创建数据库（如不存在）
- 启动后端服务
- 启动前端开发服务器
- 处理任何依赖问题或配置错误

**4. 访问应用**

打开浏览器访问 `http://localhost:5173`

---

## 人工部署

### 环境要求

| 软件 | 版本 |
|------|------|
| Go | 1.21+ |
| Node.js | 18+ |
| MySQL | 8.0+ |

### 步骤一：数据库配置

**创建数据库**

```bash
mysql -h127.0.0.1 -uroot -p -e "CREATE DATABASE todo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

**修改后端数据库配置**

编辑 `backend/internal/config/config.go`，修改以下值：

```go
func LoadConfig() *Config {
    return &Config{
        DBHost:     "你的数据库地址",
        DBPort:     "3306",
        DBUser:     "你的用户名",
        DBPassword: "你的密码",
        DBName:     "todo_db",
        ServerPort: "8080",
    }
}
```

### 步骤二：后端部署

```bash
cd backend

# 安装依赖
go mod tidy

# 启动服务
go run cmd/server/main.go
```

后端将在 `http://localhost:8080` 启动

### 步骤三：前端部署

```bash
cd frontend

# 安装依赖
npm install

# 开发模式启动
npm run dev
```

前端将在 `http://localhost:5173` 启动

### 步骤四：生产环境部署

**构建前端**

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist/`

**构建后端**

```bash
cd backend
go build -o gundam-todo-server cmd/server/main.go
```

**使用 Nginx 部署**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/gundam-todo/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 配置说明

### 后端配置文件位置

`backend/internal/config/config.go`

### 可配置项

| 参数 | 说明 | 默认值 |
|------|------|--------|
| DBHost | 数据库地址 | 127.0.0.1 |
| DBPort | 数据库端口 | 3306 |
| DBUser | 数据库用户 | root |
| DBPassword | 数据库密码 | rootroot |
| DBName | 数据库名 | todo_db |
| ServerPort | 后端端口 | 8080 |

### 前端 API 地址

如需修改后端 API 地址，编辑 `frontend/src/api/todo.ts`：

```typescript
const API_BASE = 'http://your-backend-address:port/api';
```

---

## 常见问题

### Q: 数据库连接失败

检查：
1. MySQL 服务是否启动
2. 用户名密码是否正确
3. 数据库 `todo_db` 是否已创建

### Q: 前端无法连接后端

检查：
1. 后端是否在 8080 端口运行
2. CORS 配置是否正确（后端已配置允许 localhost:5173）
3. 如部署到其他地址，需修改 `backend/cmd/server/main.go` 的 CORS 配置

### Q: npm install 失败

尝试：
```bash
rm -rf node_modules package-lock.json
npm install
```

### Q: go mod tidy 失败

检查 Go 版本是否 >= 1.21：
```bash
go version
```

---

## 项目结构

```
gundam-todo/
├── backend/                # Go 后端
│   ├── cmd/server/main.go  # 入口
│   ├── internal/
│   │   ├── config/         # 配置
│   │   ├── models/         # 数据模型
│   │   └── handlers/       # API 处理器
│   └── go.mod
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── api/            # API 调用
│   │   ├── themes/         # 主题样式
│   │   └── hooks/          # 自定义 hooks
│   └── package.json
├── README.md
└── DEPLOY.md
```