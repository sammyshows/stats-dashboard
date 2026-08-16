# Elora Database Schema

## Tables

### account_tiers
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | |
| name | text | e.g. 'premium', 'free' |
| monthly_entry_limit | integer | e.g. 10000 (premium), 5 (free) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### ai_logs
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | |
| user_id | uuid | FK → user_profiles |
| log_type_id | integer | FK → log_types |
| model_id | uuid | FK → ? |
| model_name | text | e.g. 'claude-sonnet-4-20250514', 'voyage-3-large' |
| status | text | e.g. 'success' |
| cost | numeric | e.g. 0.004233 |
| tokens | integer | |
| prompt_tokens | integer | |
| completion_tokens | integer | |
| created_at | timestamptz | |
| ... (additional nullable columns) | | |

### explore_chats
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | FK → user_profiles |
| title | text | e.g. 'Confronting Personal Avoidance Patterns' |
| is_public | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### explore_chat_messages
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| chat_id | uuid | FK → explore_chats |
| content | text | |
| role | text | 'user' or 'ai' |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| is_edited | boolean | |
| is_deleted | boolean | |
| attachment_ids | uuid[] | array of attachment UUIDs |
| is_pinned | boolean | |

### journal_entries
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | FK → user_profiles |
| content | text | |
| embedding | numeric[] | 768-dim vector (voyage-3-large) |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| metadata | jsonb | e.g. {"model_used":"voyage-3-large","created_via":"web_app","message_count":1} |
| insight_title | text | e.g. 'Business Opportunity Doubt' |
| insight_emoji | text | e.g. '⚖️' |
| insight_summary | text | |
| insight_bio | text | |
| entry_date | date | user-facing date (timezone-aware) |
| tag_ids | uuid[] | array of tag UUIDs |
| word_count | integer | |

### journal_entry_tags
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | FK → user_profiles |
| name | text | e.g. 'physio', 'workout' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### log_types
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | |
| name | text | e.g. 'New entry recording transcribed', 'Journal entry embedded' |
| created_at | timestamptz | |

### logs
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | (same as ai_logs or separate) |
| ... | | (need more data to determine) |

### timelines
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | FK → user_profiles |
| content | jsonb | structured object with emoji, theme, entryIds[], timeline[], briefSummary |
| is_generated | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### user_profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| email | text? | (not visible in samples but likely) |
| device_os | text? | |
| device_model | text? | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### user_settings
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid (PK, FK) | FK → user_profiles |
| reminder_time | time | e.g. 18:00:00 |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| is_dark_mode | boolean | |
| entry_font | text? | |
| is_encrypted | boolean | |
| ... (additional settings) | | |

## Key Relationships

```
user_profiles 1──* journal_entries
user_profiles 1──* journal_entry_tags
user_profiles 1──* explore_chats
user_profiles 1──* timelines
user_profiles 1──* ai_logs
user_profiles 1──1 user_settings
user_profiles 1──1 account_tiers (via account_tier_id FK?)

explore_chats 1──* explore_chat_messages
ai_logs *──1 log_types
journal_entries *──* journal_entry_tags (M:N via tag_ids array)
```