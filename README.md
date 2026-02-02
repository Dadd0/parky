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

## Setup

1. `npm run build`
2. Start web server using python `python -m http.server --directory dist`
3. funnel with tailscale and test from phone `sudo tailscale funnel 8000`
