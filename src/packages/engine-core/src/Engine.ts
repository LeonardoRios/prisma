import {
  RustLog,
  //  PanicLogFields,
  RustError,
  isRustError,
} from './log'
import { getLogs } from '@prisma/debug'
import { getGithubIssueUrl, link } from './util'
import stripAnsi from 'strip-ansi'
import os from 'os'
// import chalk from 'chalk'

export class PrismaQueryEngineError extends Error {
  /**
   * HTTP Code
   */
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

export function getMessage(log: string | RustLog | RustError | any): string {
  if (typeof log === 'string') {
    return log
  } else if (isRustError(log)) {
    return log.message
  } else if (log.fields && log.fields.message) {
    if (log.fields.reason) {
      return `${log.fields.message}: ${log.fields.reason}`
    }
    return log.fields.message
  } else {
    return JSON.stringify(log)
  }
}

export interface RequestError {
  error: string
  user_facing_error: {
    is_panic: boolean
    message: string
    meta?: object
    error_code?: string
  }
}

export class PrismaClientKnownRequestError extends Error {
  code: string
  meta?: object
  constructor(message: string, code: string, meta?: any) {
    super(message)
    this.code = code
    this.meta = meta
  }
}

export class PrismaClientUnknownRequestError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class PrismaClientRustPanicError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class PrismaClientInitializationError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export interface QueryEngineErrorWithLinkInput {
  version: string
  platform: string
  title: string
  description?: string
}

export class QueryEngineErrorWithLink extends Error {
  constructor({
    version,
    platform,
    title,
    description,
  }: QueryEngineErrorWithLinkInput) {
    const logs = getLogs()
    const moreInfo = description ? `# Description\n${description}` : ''
    const body = stripAnsi(
      `Hi Prisma Team! My Prisma Client just crashed. This is the report:
## Versions

| Name     | Version            |
|----------|--------------------|
| Node     | ${process.version.padEnd(19)}| 
| OS       | ${platform.padEnd(19)}|
| Prisma   | ${version.padEnd(19)}|

## Logs
\`\`\`
${logs}
\`\`\`
${moreInfo}`,
    )

    const url = getGithubIssueUrl({ title, body })
    const message = `${title}

This is a non-recoverable error which probably happens when the Prisma Query Engine has a panic.
If you want the Prisma team to look into it, please cmd+click on the link below 
and press the "Submit new issue" button 🙏

${link(url)}`
    super(message)
  }
}
