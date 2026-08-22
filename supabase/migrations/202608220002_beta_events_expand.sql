alter table public.beta_events drop constraint if exists beta_events_event_name_check;

alter table public.beta_events
  add constraint beta_events_event_name_check
  check (
    event_name in (
      'capture_made',
      'ask_made',
      'digest_viewed',
      'thought_deleted',
      'app_opened',
      'day_active',
      'source_chip_opened',
      'task_handoff_created',
      'trust_break_reported',
      'coins_earned',
      'theme_unlocked',
      'theme_applied',
      'analytics_exported'
    )
  );
