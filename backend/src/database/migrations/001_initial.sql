CREATE TABLE users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE COLLATE NOCASE,
 password_hash TEXT, role TEXT NOT NULL CHECK(role IN ('admin','authority','community')),
 disabled INTEGER NOT NULL DEFAULT 0 CHECK(disabled IN (0,1)),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
) STRICT;
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE authorities (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE) STRICT;
CREATE TABLE incidents (
 id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL,
 lat REAL NOT NULL CHECK(lat BETWEEN -90 AND 90), lng REAL NOT NULL CHECK(lng BETWEEN -180 AND 180),
 severity TEXT NOT NULL CHECK(severity IN ('low','medium','high','critical')),
 hectares REAL NOT NULL CHECK(hectares >= 0), confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 100),
 date TEXT NOT NULL, time TEXT NOT NULL, resolved TEXT,
 status TEXT NOT NULL CHECK(status IN ('Monitoring','Reported','Escalated','Resolved')),
 color TEXT NOT NULL, notes TEXT NOT NULL, recommendation TEXT NOT NULL,
 created_by TEXT REFERENCES users(id) ON DELETE SET NULL
) STRICT;
CREATE INDEX incidents_date ON incidents(date DESC,time DESC);
CREATE TABLE incident_authorities (
 incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
 authority_id INTEGER NOT NULL REFERENCES authorities(id),
 PRIMARY KEY(incident_id,authority_id)
) STRICT;
CREATE INDEX incident_authorities_authority ON incident_authorities(authority_id);
CREATE TABLE community_sites (id TEXT PRIMARY KEY) STRICT;
CREATE TABLE community_reports (
 id TEXT PRIMARY KEY, site_id TEXT NOT NULL REFERENCES community_sites(id) ON DELETE CASCADE,
 reporter_id TEXT REFERENCES users(id),
 latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 accuracy REAL CHECK(accuracy >= 0), notes TEXT, reported_at TEXT NOT NULL,
 UNIQUE(site_id,reporter_id)
) STRICT;
CREATE INDEX community_reports_reporter ON community_reports(reporter_id);
CREATE TABLE prediction_runs (
 id TEXT PRIMARY KEY, site_id TEXT REFERENCES community_sites(id) ON DELETE SET NULL,
 analysed_at TEXT NOT NULL, source TEXT NOT NULL,
 latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 date_start TEXT, date_end TEXT, mining_detected INTEGER NOT NULL CHECK(mining_detected IN (0,1)),
 detection_level TEXT NOT NULL, mean_probability REAL NOT NULL, mining_fraction REAL NOT NULL,
 affected_area_m2 REAL NOT NULL, largest_component_pixels INTEGER NOT NULL,
 threshold REAL NOT NULL, model_version TEXT NOT NULL, result_json TEXT CHECK(result_json IS NULL OR json_valid(result_json))
) STRICT;
CREATE INDEX predictions_date ON prediction_runs(analysed_at DESC);
CREATE INDEX predictions_site ON prediction_runs(site_id,analysed_at DESC);
CREATE VIEW community_site_summary AS
 SELECT site_id AS id, avg(latitude) AS latitude, avg(longitude) AS longitude,
 count(*) AS reportCount, min(reported_at) AS firstReportedAt, max(reported_at) AS lastReportedAt
 FROM community_reports GROUP BY site_id;
