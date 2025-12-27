import { NextResponse } from 'next/server'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test simple de connexion
    const [result] = await db.execute('SELECT 1 as test, NOW() as current_time') as any[]
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully!',
      test: result[0],
      config: {
        hasHost: !!process.env.DB_HOST,
        hasUser: !!process.env.DB_USER,
        hasPassword: !!process.env.DB_PASSWORD ? '***' : false,
        hasDatabase: !!process.env.DB_NAME,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasMysqlUrl: !!process.env.MYSQL_URL,
        render: process.env.RENDER || false,
        ssl: process.env.DB_SSL || false,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      config: {
        hasHost: !!process.env.DB_HOST,
        hasUser: !!process.env.DB_USER,
        hasPassword: !!process.env.DB_PASSWORD ? '***' : false,
        hasDatabase: !!process.env.DB_NAME,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasMysqlUrl: !!process.env.MYSQL_URL,
        render: process.env.RENDER || false,
        ssl: process.env.DB_SSL || false,
        host: process.env.DB_HOST || 'not set',
        user: process.env.DB_USER || 'not set',
        database: process.env.DB_NAME || 'not set',
        port: process.env.DB_PORT || 'not set',
      }
    }, { status: 500 })
  }
}

