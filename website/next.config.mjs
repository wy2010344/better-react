import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  basePath: '/better-react', // 如果部署到 <user>.github.io/<repo> 必须填仓库名
  output: 'export',
  trailingSlash: true, // GitHub Pages 对无后缀路径更友好
}

export default withMDX(config)
