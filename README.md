## 老娘舅春节抽奖活动服务端

## WIP

- 项目结构改为多模块项目结构
- 新增独立插件目录 (addons)
- 独立扩展模块目录 (modules)
- API 模块
- Nunjucks + bootstrap4 UI 定制
- graphql支持
- nuxtjs 支持
- ...

## 目录结构 
```bash
.
├── README.md                   # README
├── development.js              # dev 环境配置
├── nginx.conf
├── package.json
├── pm2.json
├── port                        # 服务启动端口配置
├── production.js               # 生产环境配置
├── src                         # 项目源文件
│   ├── addons                  # 插件目录
│   ├── admin                   # admin 业务模块
│   ├── api                     # api 业务模块
│   ├── common                  # 公共业务模块
│   ├── home                    # 默认业务模块
│   └── module                  # 扩展业务模块
├── test
│   └── index.js
├── view
│   ├── _ui
│   ├── admin
│   └── common
├── www
│   ├── static
│   ├── theme
│   └── upload
└── yarn.lock

```
