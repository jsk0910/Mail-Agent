# Mail Action Retry Notes

## Scope

- Manual mail actions now write retry payload metadata into `AgentActionLog.metadata`.
- Supported retry actions are read-state, archive-state, delete, and Gmail label apply.

## API

- Retry endpoint: `POST /mail/actions/:actionLogId/retry`
- Only failed action logs with `result = failure` are accepted.

## Verification

- `npm run check`
- `npm run verify:mail-retry`
- `npm run verify:sync-replay`
