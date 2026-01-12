create table roti_bank_inquiries (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  intent text not null,
  phone_number text,
  email text,
  inquiry_date date,
  created_at timestamp with time zone default now()
);
