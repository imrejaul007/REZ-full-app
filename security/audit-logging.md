# Audit Logging Requirements

## Events to Log
- Authentication attempts
- Authorization failures
- Data access
- Configuration changes

## Log Format
```json
{
  "timestamp": "ISO8601",
  "service": "name",
  "event": "type",
  "user": "id",
  "resource": "id",
  "action": "what",
  "result": "success/failure"
}
```
