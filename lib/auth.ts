export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId, email] = decoded.split(':')
    return { userId: parseInt(userId), email }
  } catch {
    return null
  }
}

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

