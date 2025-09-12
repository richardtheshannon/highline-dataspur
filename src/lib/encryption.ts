import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const secretKey = process.env.API_ENCRYPTION_KEY || 'default-key-for-dev-only-not-production-32'

// Ensure key is exactly 32 bytes for AES-256
function getKey(): Buffer {
  const key = secretKey.padEnd(32, '0').slice(0, 32)
  return Buffer.from(key, 'utf8')
}

export function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

export function decrypt(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
  const decipher = crypto.createDecipheriv(algorithm, getKey(), Buffer.from(encryptedData.iv, 'hex'))
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export function encryptString(text: string): string {
  if (!text) return text
  const encrypted = encrypt(text)
  return JSON.stringify(encrypted)
}

export function decryptString(encryptedText: string): string {
  if (!encryptedText) return encryptedText
  try {
    const encryptedData = JSON.parse(encryptedText)
    return decrypt(encryptedData)
  } catch (error) {
    console.error('Failed to decrypt string:', error)
    return encryptedText
  }
}