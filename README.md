# parky

## Database Schema

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│    cars     │       │ parking_events  │       │    users    │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (pk)     │◄──────┤ car_id (fk)     │       │ id (pk)     │
│ name        │       │ user_id (fk)    │──────►│ name        │
│             │       │ latitude        │       │ tailscale_ip│
│             │       │ longitude       │       │             │
│             │       │ parked_at       │       │             │
└─────────────┘       └─────────────────┘       └─────────────┘
```


