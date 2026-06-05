import { useState } from 'react'

interface UploadResult {
  success: boolean
  path?: string
  url?: string
  name?: string
  size?: number
  error?: string
}

interface UseFileUploadOptions {
  bucket?: string
  folder?: string
  company_id: string
}

export function useFileUpload({
  bucket = 'company-files',
  folder = 'general',
  company_id,
}: UseFileUploadOptions) {
  const [uploading, setUploading] =
    useState(false)
  const [progress, setProgress] =
    useState(0)

  const upload = async (
    file: File
  ): Promise<UploadResult> => {
    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      formData.append('folder', folder)
      formData.append('company_id', company_id)

      setProgress(30)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      setProgress(80)

      const data = await res.json()

      if (!res.ok) {
        return {
          success: false,
          error: data.error,
        }
      }

      setProgress(100)
      return { success: true, ...data }
    } catch (error) {
      return {
        success: false,
        error: 'Error al subir archivo',
      }
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const deleteFile = async (
    path: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, bucket }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  const getSignedUrl = async (
    path: string
  ): Promise<string | null> => {
    try {
      const res = await fetch(
        `/api/files?path=${path}&bucket=${bucket}`
      )
      const data = await res.json()
      return data.url || null
    } catch {
      return null
    }
  }

  return {
    upload,
    deleteFile,
    getSignedUrl,
    uploading,
    progress,
  }
}
