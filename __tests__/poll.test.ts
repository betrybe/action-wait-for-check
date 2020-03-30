import {poll} from '../src/poll'

const client = {
  repos: {
    getCombinedStatusForRef: jest.fn()
  }
}

const run = () =>
  poll({
    client: client as any,
    log: () => {},
    checkName: 'test',
    owner: 'testOrg',
    repo: 'testRepo',
    ref: 'abcd',
    timeoutSeconds: 3,
    intervalSeconds: 0.1
  })

test('returns conclusion of completed check', async () => {
  client.repos.getCombinedStatusForRef.mockResolvedValue({
    data: {
      statuses: [
        {
          context: 'continuos-integration/travis-ci/pr',
          state: 'failure'
        },
        {
          context: 'test',
          state: 'success'
        }
      ]
    }
  })

  const result = await run()

  expect(result).toBe('success')
  expect(client.repos.getCombinedStatusForRef).toHaveBeenCalledWith({
    owner: 'testOrg',
    repo: 'testRepo',
    ref: 'abcd'
  })
})

test('polls until check is completed', async () => {
  client.repos.getCombinedStatusForRef
    .mockResolvedValueOnce({
      data: {
        statuses: [
          {
            context: 'continuos-integration/travis-ci/pr',
            state: 'failure'
          }
        ]
      }
    })
    .mockResolvedValueOnce({
      data: {
        statuses: [
          {
            context: 'continuos-integration/travis-ci/pr',
            state: 'failure'
          },
          {
            context: 'continuos-integration/travis-ci/push',
            state: 'success'
          }
        ]
      }
    })
    .mockResolvedValueOnce({
      data: {
        statuses: [
          {
            context: 'continuos-integration/travis-ci/pr',
            state: 'success'
          },
          {
            context: 'continuos-integration/travis-ci/push',
            state: 'success'
          },
          {
            context: 'test',
            state: 'pending'
          }
        ]
      }
    })
    .mockResolvedValueOnce({
      data: {
        statuses: [
          {
            context: 'continuos-integration/travis-ci/pr',
            state: 'success'
          },
          {
            context: 'continuos-integration/travis-ci/push',
            state: 'success'
          },
          {
            context: 'test',
            state: 'failure'
          }
        ]
      }
    })

  const result = await run()

  expect(result).toBe('failure')
  expect(client.repos.getCombinedStatusForRef).toHaveBeenCalledTimes(4)
})

test(`returns 'timed_out' if exceeding deadline`, async () => {
  client.repos.getCombinedStatusForRef.mockResolvedValue({
    data: {
      statuses: [
        {
          context: 'continuos-integration/travis-ci/pr',
          state: 'failure'
        },
        {
          context: 'continuos-integration/travis-ci/push',
          state: 'success'
        }
      ]
    }
  })

  const result = await run()
  expect(result).toBe('timed_out')
})
