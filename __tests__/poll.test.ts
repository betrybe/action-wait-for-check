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
      check_runs: [
        {
          id: '1',
          status: 'pending'
        },
        {
          id: '2',
          status: 'completed',
          conclusion: 'success'
        }
      ]
    }
  })

  const result = await run()

  expect(result).toBe('success')
  expect(client.repos.getCombinedStatusForRef).toHaveBeenCalledWith({
    owner: 'testOrg',
    repo: 'testRepo',
    ref: 'abcd',
    check_name: 'test'
  })
})

test('polls until check is completed', async () => {
  client.repos.getCombinedStatusForRef
    .mockResolvedValueOnce({
      data: {
        check_runs: [
          {
            id: '1',
            status: 'pending'
          }
        ]
      }
    })
    .mockResolvedValueOnce({
      data: {
        check_runs: [
          {
            id: '1',
            status: 'pending'
          }
        ]
      }
    })
    .mockResolvedValueOnce({
      data: {
        check_runs: [
          {
            id: '1',
            status: 'completed',
            conclusion: 'failure'
          }
        ]
      }
    })

  const result = await run()

  expect(result).toBe('failure')
  expect(client.repos.getCombinedStatusForRef).toHaveBeenCalledTimes(3)
})

test(`returns 'timed_out' if exceeding deadline`, async () => {
  client.repos.getCombinedStatusForRef.mockResolvedValue({
    data: {
      check_runs: [
        {
          id: '1',
          status: 'pending'
        }
      ]
    }
  })

  const result = await run()
  expect(result).toBe('timed_out')
})
