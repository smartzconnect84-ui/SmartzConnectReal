-- ============================================================================
-- Schema v16: Branding & background image config keys
-- ----------------------------------------------------------------------------
-- Seeds `site_config` with admin-controllable image fields (type = 'image')
-- for the site logo, favicon, homepage background, team page background, and
-- one background per public service/social page. These are additive and
-- optional: every consumer (Navbar, Footer, TeamPage, service pages) falls
-- back to the current hardcoded asset/gradient when the value is empty, so
-- this migration cannot break the existing look.
--
-- The React admin (Admin -> CMS -> Site Settings) also auto-seeds these same
-- rows on first load if missing, so running this SQL file is optional but
-- keeps the repo's schema history in sync with what the app creates at runtime.
-- ============================================================================

-- No repo-visible UNIQUE constraint on site_config.key (schema created ad hoc
-- on the live DB), so guard against duplicates with NOT EXISTS rather than
-- ON CONFLICT, which would error without a matching unique index.
insert into public.site_config (id, key, value, type, label, "group")
select gen_random_uuid(), k, '', 'image', l, g
from (values
  ('brand_logo_url',          'Site Logo',                      'Branding'),
  ('brand_favicon_url',       'Favicon',                         'Branding'),
  ('homepage_bg_url',         'Homepage Background',             'Backgrounds'),
  ('team_page_bg_url',        'Team Page Background',            'Backgrounds'),
  ('social_page_bg_url',      'SmartzSocial Page Background',    'Backgrounds'),
  ('service_dating_bg_url',   'SmartzDating Page Background',    'Backgrounds'),
  ('service_tv_bg_url',       'SmartzTV Page Background',        'Backgrounds'),
  ('service_market_bg_url',   'SmartzMarket Page Background',    'Backgrounds'),
  ('service_ride_bg_url',     'SmartzRide Page Background',      'Backgrounds'),
  ('service_delivery_bg_url', 'SmartzDelivery Page Background',  'Backgrounds'),
  ('service_ads_bg_url',      'SmartzAds Page Background',       'Backgrounds')
) as defaults(k, l, g)
where not exists (select 1 from public.site_config sc where sc.key = defaults.k);
