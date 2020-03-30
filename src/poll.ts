import {GitHub} from '@actions/github'
import {wait} from './wait'

export interface Options {
  client: GitHub
  log: (message: string) => void

  checkName: string
  timeoutSeconds: number
  intervalSeconds: number
  owner: string
  repo: string
  ref: string
}

export const poll = async (options: Options): Promise<string> => {
  const {
    client,
    log,
    checkName,
    timeoutSeconds,
    intervalSeconds,
    owner,
    repo,
    ref
  } = options

  const allowStateValues: string[] = ['success', 'failure']

  let now = new Date().getTime()
  const deadline = now + timeoutSeconds * 1000

  while (now <= deadline) {
    log(
      `Retrieving status on ${owner}/${repo}@${ref} and filtering by ${checkName}`
    )
    const result = await client.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref
    })

    log(`Retrieved ${result.data.statuses.length} status`)

    const completedCheck = result.data.statuses.find(
      status => status.context === checkName && allowStateValues.includes(status.state)
    )
    if (completedCheck) {
      log(
        `Found a status with id ${completedCheck.id} and state ${completedCheck.state}`
      )
      return completedCheck.state
    }

    log(
      `No status named ${checkName}, waiting for ${intervalSeconds} seconds...`
    )
    await wait(intervalSeconds * 1000)

    now = new Date().getTime()
  }

  log(
    `No completed checks after ${timeoutSeconds} seconds, exiting with conclusion 'timed_out'`
  )
  return 'timed_out'
}
