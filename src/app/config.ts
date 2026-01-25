export const MAX_RESUME_FILE_BYTES = 7 * 1024 * 1024 // 7MB

export const JD_MIN_CHARS = 300

export const ALLOWED_RESUME_MIME_TYPES = Object.freeze([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export const ALLOWED_RESUME_EXTENSIONS = Object.freeze(['pdf', 'doc', 'docx'])
