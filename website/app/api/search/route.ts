// 静态搜索API，用于支持静态导出
import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export function GET() {
  // 返回一个空的搜索结果
  return NextResponse.json({
    hits: [],
    total: 0,
  })
}
