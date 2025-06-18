
-- Ninety.io to L10 App Migration Script
-- Generated: 2025-06-18T11:38:23.115Z

-- Insert Teams
INSERT INTO teams (id, name, description, owner_id, settings, created_at, updated_at) VALUES
('65f5c6322caa0d001296501d', 'Leadership Team', 'Ganger Dermatology Leadership Team', '65f5d1f5f0607000125edb40', '{"meeting_day":"Monday","meeting_time":"09:00","timezone":"America/New_York","meeting_duration":90,"scorecard_frequency":"weekly","rock_quarters":["Q1 2025","Q2 2025","Q3 2025","Q4 2025"]}', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Insert Users/Team Members
INSERT INTO team_members (id, team_id, user_id, role, seat, joined_at, active) VALUES
(gen_random_uuid(), '65f5c6322caa0d001296501d', '65f5d1f5f0607000125edb40', 'leader', 'CEO/Visionary', NOW(), true),
(gen_random_uuid(), '65f5c6322caa0d001296501d', '65f5d1f95578b300132330d2', 'leader', 'Integrator', NOW(), true),
(gen_random_uuid(), '65f5c6322caa0d001296501d', '65f5c6322caa0d001296501c', 'member', 'Operations Manager', NOW(), true),
(gen_random_uuid(), '65f5c6322caa0d001296501d', '66a3e6eca71d580012b1def3', 'member', 'MA & Admin Lead', NOW(), true),
(gen_random_uuid(), '65f5c6322caa0d001296501d', '66b280e5983d6a0011e78f1d', 'member', 'Marketing & Growth', NOW(), true)
ON CONFLICT (team_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  seat = EXCLUDED.seat;

-- Insert Rocks (Quarterly Goals)
INSERT INTO rocks (id, team_id, owner_id, title, description, quarter, status, completion_percentage, priority, due_date, created_at, updated_at) VALUES
('67a4fc78dc9ba47dc811058c', '65f5c6322caa0d001296501d', '65f5d1f5f0607000125edb40', 'AC''s measurables', '<p>A.C. to create a rock about how to find data over 90 days, reports from EMA to know the numbers.</p>', '2025 Q1', 'on_track', 0, 5, '2025-05-07T08:00:00.000Z', '2025-02-06T18:16:24.000Z', NOW()),
('680958bb71c419b2ab69f4a8', '65f5c6322caa0d001296501d', '65f5d1f5f0607000125edb40', 'Define The Ganger Experience for Providers & Patients', '', '2025 Q2', 'on_track', 0, 5, '2025-07-22T08:00:00.000Z', '2025-04-23T21:16:43.000Z', NOW()),
('6809599380c03b02060947e1', '65f5c6322caa0d001296501d', '65f5d1f95578b300132330d2', 'Wixom Provider Schedule is Consistently 90%+ Full', '<p data-pm-slice="1 1 []" id="isPasted"><strong>EOS Rock Execution Plan: Wixom at 90% Fill Rate</strong></p><p><strong>Rock Goal:</strong>Achieve and sustain a 90% provider template fill rate at the Wixom location by July 22, 2025.</p><hr><h3><strong>WEEKLY ACTION PLAN</strong></h3><p><strong>Week 1 (Apr 29–May 3) – Audit &amp; Foundation</strong></p><ul data-spread="false"><li><p>Pull baseline fill rate report by day/time/provider/appointment type</p></li><li><p>Identify top 3 schedule gaps</p></li><li><p>Review provider templates for optimization opportunities</p></li><li><p>Identify referral sources and current booking trends</p></li><li><p>Share goal and urgency with providers/front desk</p></li></ul><p><strong>Milestone:</strong> Baseline report complete, top gaps identified</p><hr><p><strong>Week 2 (May 6–10) – Plan &amp; Internal Rebooking Drive</strong></p><ul data-spread="false"><li><p>Adjust templates to match demand</p></li><li><p>Create "Wixom Growth Plan" with fill targets</p></li><li><p>Launch internal rebooking: overdue patients prioritized</p></li><li><p>Staff incentive: Book 5 patients = $10 gift card</p></li><li><p>Prep soft marketing material for May 13 launch</p></li></ul><p><strong>Milestone:</strong> Templates optimized, internal booking drive launched</p><hr><p><strong>Week 3 (May 13–17) – Marketing Push #1</strong></p><ul data-spread="false"><li><p>Launch email/text/IG campaign: "Now Booking at Wixom"</p></li><li><p>Website banner/popup added for open availability</p></li><li><p>Call recent cancellations/no-shows for rebooking</p></li><li><p>Daily goal: 5 new bookings per front desk team member</p></li></ul><p><strong>Milestone:</strong> 40+ new bookings generated</p><hr><p><strong>Week 4 (May 20–24) – Incentives + Double Book Pilot</strong></p><ul data-spread="false"><li><p>Daily schedule huddles to identify double-booking slots</p></li><li><p>Allow double-booking for acne rechecks, low-acuity visits</p></li><li><p>Launch limited-time skincare gift for May bookings</p></li><li><p>Weekly progress tracking posted for visibility</p></li></ul><p><strong>Milestone:</strong> Double-booking and incentives in place</p><hr><p><strong>Week 5 (May 27–31) – Referral &amp; Retention</strong></p><ul data-spread="false"><li><p>Providers reach out to 1–2 referring PCPs/OBs</p></li><li><p>Launch Q1 patient recall campaign for overdue follow-ups</p></li><li><p>Emphasize follow-up scheduling at check-out</p></li></ul><p><strong>Milestone:</strong> Referrals activated, recall system running</p><hr><p><strong>Week 6 (June 3–7) – Provider Adjustments</strong></p><ul data-spread="false"><li><p>High-demand provider from another site opens 1 day at Wixom?</p></li><li><p>Low-fill provider coached with admin lead</p></li><li><p>Launch same-day appointment campaign online and via phone scripts</p></li></ul><p><strong>Milestone:</strong> New provider coverage + low-performer support</p><hr><p><strong>Week 7 (June 10–14) – Summer Skin Campaign</strong></p><ul data-spread="false"><li><p>Run second marketing wave: "Summer Skin Ready"</p></li><li><p>Offer free cosmetic consults to fill smaller holes</p></li><li><p>Add low-risk overbooks on low-show days</p></li></ul><p><strong>Milestone:</strong> June campaign drives 30+ bookings</p><hr><p><strong>Week 8 (June 17–21) – Sustain Momentum</strong></p><ul data-spread="false"><li><p>Review fill trend progress</p></li><li><p>Boosted IG post focused on short wait times</p></li><li><p>Prebook July follow-ups now</p></li></ul><p><strong>Milestone:</strong> Social engagement + pre-booking surge</p><hr><p><strong>Week 9–10 (June 24–July 5) – Holiday Coverage Prep</strong></p><ul data-spread="false"><li><p>Prebook July 4th week NOW to avoid dips</p></li><li><p>Consider special event: "Sunscreen Saturday" at Wixom</p></li><li><p>Begin August recall booking into late July</p></li></ul><p><strong>Milestone:</strong> July 4th holes filled; July-Aug sustained</p><hr><p><strong>Week 11 (July 8–12) – Final Push</strong></p><ul data-spread="false"><li><p>Call all patients with TBD follow-ups, offer July slots</p></li><li><p>Reactivate May-June patients for cosmetic or skin checks</p></li><li><p>Encourage providers to contact key patients personally</p></li></ul><p><strong>Milestone:</strong> Final week &gt;90% full</p><hr><p><strong>Week 12 (July 15–22) – Rock Completion Week</strong></p><ul data-spread="false"><li><p>Pull final fill rate report for July 15–22</p></li><li><p>Celebrate wins: lunch or team thank-you</p></li><li><p>Share Rock Completion recap at L10</p></li></ul><p><strong>Milestone:</strong> Rock completed and sustained at 90%</p><p><br></p><ul data-spread="false"><li><p>Integrate Rock into Scorecard tracking (weekly fill rate per provider)</p></li><li><p>Formalize "Wixom Booking Playbook" for future template challenges</p></li></ul><hr><p><strong>Optional Next Steps:</strong></p><p><br></p>', '2025 Q2', 'on_track', 0, 5, '2025-07-22T08:00:00.000Z', '2025-04-23T21:20:19.000Z', NOW()),
('680959bd80c03b02060948b3', '65f5c6322caa0d001296501d', '65f5d1f95578b300132330d2', 'Aesthetics Providers are Consistently Hitting their Revenue Targets', '', '2025 Q2', 'off_track', 0, 5, '2025-07-22T08:00:00.000Z', '2025-04-23T21:21:01.000Z', NOW()),
('680959d680c03b02060948ed', '65f5c6322caa0d001296501d', '66a3e6eca71d580012b1def3', 'Daily, Weekly, and Monthly Accountability Structure is In Place for MA & Admin Leads', '<table data-start="1476" data-end="2760" id="isPasted"><thead data-start="1476" data-end="1526"><tr data-start="1476" data-end="1526"><th data-start="1476" data-end="1492" data-col-size="md"><strong data-start="1478" data-end="1491">Milestone</strong></th><th data-start="1492" data-end="1507" data-col-size="sm"><strong data-start="1494" data-end="1506">Timeline</strong></th><th data-start="1507" data-end="1526" data-col-size="lg"><strong data-start="1509" data-end="1524">Description</strong></th></tr></thead><tbody data-start="1579" data-end="2760"><tr data-start="1579" data-end="1758"><td data-start="1579" data-end="1618" data-col-size="md"><strong data-start="1581" data-end="1617">1. Define Accountability Metrics</strong></td><td data-col-size="sm" data-start="1618" data-end="1627">Week 1</td><td data-col-size="lg" data-start="1627" data-end="1758">Decide what each lead is responsible for tracking (e.g., attendance, task completion, patient throughput, call response times).</td></tr><tr data-start="1759" data-end="1884"><td data-start="1759" data-end="1798" data-col-size="md"><strong data-start="1761" data-end="1797">2. Design Daily Check-In Process</strong></td><td data-col-size="sm" data-start="1798" data-end="1807">Week 2</td><td data-col-size="lg" data-start="1807" data-end="1884">Implement a 5-10 minute daily huddle/check-in for leads with their teams.</td></tr><tr data-start="1885" data-end="2026"><td data-start="1885" data-end="1928" data-col-size="md"><strong data-start="1887" data-end="1927">3. Create Weekly Reporting Template</strong></td><td data-col-size="sm" data-start="1928" data-end="1937">Week 3</td><td data-col-size="lg" data-start="1937" data-end="2026">Create a one-page format where leads summarize weekly performance, issues, and needs.</td></tr><tr data-start="2027" data-end="2191"><td data-start="2027" data-end="2076" data-col-size="md"><strong data-start="2029" data-end="2075">4. Schedule &amp; Launch Weekly Lead Check-Ins</strong></td><td data-col-size="sm" data-start="2076" data-end="2085">Week 4</td><td data-col-size="lg" data-start="2085" data-end="2191">Begin consistent 1:1 or small group meetings with each lead weekly to review reports and solve issues.</td></tr><tr data-start="2192" data-end="2349"><td data-start="2192" data-end="2238" data-col-size="md"><strong data-start="2194" data-end="2237">5. Establish Monthly KPI Review Meeting</strong></td><td data-col-size="sm" data-start="2238" data-end="2247">Week 5</td><td data-col-size="lg" data-start="2247" data-end="2349">Set recurring meetings to review team performance against key metrics, trends, and coaching needs.</td></tr><tr data-start="2350" data-end="2505"><td data-start="2350" data-end="2391" data-col-size="md"><strong data-start="2352" data-end="2390">6. Training &amp; Expectations Rollout</strong></td><td data-col-size="sm" data-start="2391" data-end="2400">Week 6</td><td data-col-size="lg" data-start="2400" data-end="2505">Communicate to all leads and staff what’s changing, and provide training on how to use the new tools.</td></tr><tr data-start="2506" data-end="2627"><td data-start="2506" data-end="2543" data-col-size="md"><strong data-start="2508" data-end="2542">7. Evaluate &amp; Adjust Processes</strong></td><td data-col-size="sm" data-start="2543" data-end="2552">Week 8</td><td data-col-size="lg" data-start="2552" data-end="2627">After 2–3 weeks of use, assess effectiveness and make necessary tweaks.</td></tr><tr data-start="2628" data-end="2760"><td data-start="2628" data-end="2667" data-col-size="md"><strong data-start="2630" data-end="2666">8. Finalize &amp; Document Processes</strong></td><td data-col-size="sm" data-start="2667" data-end="2680">Week 10–12</td><td data-col-size="lg" data-start="2680" data-end="2760">Turn this into a documented SOP that becomes part of your operations manual.</td></tr></tbody></table><p><br></p><ul><li data-start="489" data-end="725" id="isPasted"><p data-start="491" data-end="725">Clarify <strong data-start="499" data-end="524">core responsibilities</strong> for MA Leads (e.g., patient intake timeliness, documentation quality, scribing accuracy, procedure prep efficiency) and Admin Leads (e.g., call answer rates, scheduling accuracy, front desk workflow).</p></li><li data-start="726" data-end="927"><p data-start="728" data-end="927">Choose <strong data-start="735" data-end="759">quantitative metrics</strong> (e.g., % of patients roomed within 5 minutes, call abandonment rate, rebook errors per week) and <strong data-start="857" data-end="880">qualitative markers</strong> (e.g., professionalism, communication skills).</p></li><li data-start="928" data-end="1047"><p data-start="930" data-end="1047">Align metrics with larger clinic goals—like improving throughput, reducing errors, or enhancing patient satisfaction.</p></li></ul>', '2025 Q2', 'on_track', 0, 5, '2025-07-22T08:00:00.000Z', '2025-04-23T21:21:26.000Z', NOW()),
('680959e971c419b2ab69f7b6', '65f5c6322caa0d001296501d', '66b280e5983d6a0011e78f1d', 'Referral Outreach Program Documented & Launched', '', '2025 Q2', 'on_track', 0, 5, '2025-07-22T08:00:00.000Z', '2025-04-23T21:21:45.000Z', NOW()),
('68095a0a71c419b2ab69f7de', '65f5c6322caa0d001296501d', '65f5d1f5f0607000125edb40', 'Google Classroom Training Content Plan is Documented w/Content Creation Underway', '', '2025 Q2', 'on_track', 0, 5, '2025-07-22T08:00:00.000Z', '2025-04-23T21:22:18.000Z', NOW()),
('68095a1f71c419b2ab69f82a', '65f5c6322caa0d001296501d', '66b280e5983d6a0011e78f1d', 'Incentive Plan Options Identified w/Path Forward Selected', '', '2025 Q2', 'on_track', 0, 5, '2025-07-22T08:00:00.000Z', '2025-04-23T21:22:39.000Z', NOW()),
('undefined', 'undefined', 'undefined', 'Rocks', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'V/TO® | Revenue, Profit, Measurables', '', 'Q2 2025', 'not_started', 0, 5, 'Future Date:  April 23, 2025', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Company Rocks 6', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Company Rocks 6', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Title', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Wixom Provider Schedule is Consistently 90%+ Full  1', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Aesthetics Providers are Consistently Hitting their Revenue Targets', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Daily, Weekly, and Monthly Accountability Structure is In Place for MA & Admin Leads', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Referral Outreach Program Documented & Launched', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Google Classroom Training Content Plan is Documented w/Content Creation Underway', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Incentive Plan Options Identified w/Path Forward Selected', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'A.C. Ganger 3', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'A.C. Ganger 3', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Title', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'AC''s measurables', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Define The Ganger Experience for Providers & Patients', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Google Classroom Training Content Plan is Documented w/Content Creation Underway Company Rock', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'APAyesha Patel 1', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'APAyesha Patel 1', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Title', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Daily, Weekly, and Monthly Accountability Structure is In Place for MA & Admin Leads Company Rock', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'CCCasey Czuj 2', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'CCCasey Czuj 2', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Title', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Incentive Plan Options Identified w/Path Forward Selected Company Rock', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Referral Outreach Program Documented & Launched Company Rock', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'KKKathy Keeley 2', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'KKKathy Keeley 2', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Title', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Wixom Provider Schedule is Consistently 90%+ Full Company Rock  1', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Aesthetics Providers are Consistently Hitting their Revenue Targets Company Rock', '', 'Q2 2025', 'not_started', 0, 5, '', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'MRMarisa Rowland', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'MRMarisa Rowland', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', 'Title', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW()),
('undefined', 'undefined', 'undefined', '', '', 'Q2 2025', 'not_started', 0, 5, 'undefined', 'undefined', NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  due_date = EXCLUDED.due_date,
  updated_at = NOW();

-- Insert Rock Milestones
INSERT INTO rock_milestones (id, rock_id, title, description, due_date, completed, completed_at, created_at) VALUES
('6812f2092e9d75bccb6a106d', '6809599380c03b02060947e1', 'Baseline report complete, top gaps identified', '', '2025-05-07T03:59:59.999Z', true, '2025-05-01T13:29:47.250Z', NOW()),
('6812f25c2e9d75bccb6a1088', '6809599380c03b02060947e1', ' Templates optimized, internal booking drive launched', '', '2025-05-13T03:59:59.999Z', true, '2025-05-08T12:59:40.543Z', NOW()),
('6812f2cf2e9d75bccb6a10d0', '6809599380c03b02060947e1', 'Partner with Casey for Referring Provider Launch', '', '2025-05-17T03:59:59.999Z', true, '2025-05-29T02:04:02.091Z', NOW()),
('681bb1bc3dcf9b09758f1156', '680959e971c419b2ab69f7b6', 'Phase 1: Planning', '<p>Collect provider contact information for Brand Box and GD brand materials</p>', '2025-06-21T03:59:59.999Z', true, '2025-05-30T16:35:51.792Z', NOW()),
('681bb1d43dcf9b09758f117f', '680959e971c419b2ab69f7b6', 'Phase 2: Procurement', '<p data-start="278" data-end="314">Order custom boxes and brand items</p><p data-start="321" data-end="358">Deliver all materials to the office</p>', '2025-07-05T03:59:59.999Z', false, NULL, NOW()),
('681bb1f43dcf9b09758f11aa', '680959e971c419b2ab69f7b6', 'Phase 3: Launch', '<p data-start="393" data-end="453">Encourage GD provider to follow up with referring provider</p><p data-start="460" data-end="536">Have the admin team start to note patients coming from referring providers</p>', '2025-07-19T03:59:59.999Z', false, NULL, NOW()),
('681bb21c3dcf9b09758f11e9', '680959e971c419b2ab69f7b6', 'Phase 4: Post-Launch', '<p data-start="576" data-end="617">Create spreadsheet for patient tracking</p><p data-start="624" data-end="707">Use tracked data to refine approach for seasonal boxes and additional Brand Boxes</p>', '2025-08-09T03:59:59.999Z', false, NULL, NOW()),
('681bb2ef1e73578314690073', '68095a1f71c419b2ab69f82a', 'Phase 1: Identify Time Frame', '<p data-start="363" data-end="434">Identify the specific treatments to incentivize - treatment add-ons? new treatments? products?&nbsp;</p><p data-start="363" data-end="434">Set a clear timeframe for the incentive, i.e. 30 days, quarterly</p>', '2025-06-21T03:59:59.999Z', true, '2025-05-30T16:36:10.719Z', NOW()),
('681bb3631e73578314690292', '68095a1f71c419b2ab69f82a', 'Phase 2: Set the Incentive', '<p data-start="543" data-end="562">$X amount - % of bookings - after a specific dollar amount in treatment?&nbsp;</p><p data-start="543" data-end="562">How to gauge FT vs PT</p>', '2025-06-28T03:59:59.999Z', false, NULL, NOW()),
('681bb37d1e7357831469031b', '68095a1f71c419b2ab69f82a', 'Phase 3: Communicate to Team', '<p data-start="666" data-end="711">Share details in aesthetic L10 team meeting</p><p data-start="714" data-end="761">Provide examples of how to succeed and upsell</p><p data-start="714" data-end="761">Do we want to include admin in this?</p>', '2025-07-12T03:59:59.999Z', false, NULL, NOW()),
('681bb3961e73578314690390', '68095a1f71c419b2ab69f82a', 'Phase 4: Track', '<p>Can we track this in PARM or EMA?</p>', '2025-07-19T03:59:59.999Z', false, NULL, NOW()),
('681bb3ec3dcf9b09758f131b', '68095a1f71c419b2ab69f82a', 'Phase 5: Reward', '<p>Monthly?</p><p>Quarterly?</p><p>Review results individually or as a group?&nbsp;</p><p><br></p>', '2025-08-02T03:59:59.999Z', false, NULL, NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  completed = EXCLUDED.completed,
  completed_at = EXCLUDED.completed_at;

-- Insert Issues
INSERT INTO issues (id, team_id, title, description, type, priority, status, owner_id, created_by, created_at, updated_at) VALUES

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Insert Todos
INSERT INTO todos (id, team_id, title, description, assigned_to, created_by, due_date, status, priority, created_at, updated_at) VALUES
('undefined', 'undefined', '', '', 'undefined', 'undefined', '2025-06-25T11:38:23.115Z', 'pending', 'medium', 'undefined', NOW()),
('undefined', 'undefined', '', '', 'undefined', 'undefined', '2025-06-25T11:38:23.115Z', 'pending', 'medium', 'undefined', NOW()),
('undefined', 'undefined', '', '', 'undefined', 'undefined', '2025-06-25T11:38:23.115Z', 'pending', 'medium', 'undefined', NOW()),
('undefined', 'undefined', '', '', 'undefined', 'undefined', '2025-06-25T11:38:23.115Z', 'pending', 'medium', 'undefined', NOW()),
('undefined', 'undefined', '', '', 'undefined', 'undefined', '2025-06-25T11:38:23.115Z', 'pending', 'medium', 'undefined', NOW()),
('undefined', 'undefined', '', '', 'undefined', 'undefined', '2025-06-25T11:38:23.115Z', 'pending', 'medium', 'undefined', NOW()),
('undefined', 'undefined', '', '', 'undefined', 'undefined', '2025-06-25T11:38:23.115Z', 'pending', 'medium', 'undefined', NOW()),
('undefined', 'undefined', '', '', 'undefined', 'undefined', '2025-06-25T11:38:23.115Z', 'pending', 'medium', 'undefined', NOW()),
('undefined', 'undefined', '', '', 'undefined', 'undefined', '2025-06-25T11:38:23.115Z', 'pending', 'medium', 'undefined', NOW()),
('undefined', 'undefined', '', '', 'undefined', 'undefined', '2025-06-25T11:38:23.116Z', 'pending', 'medium', 'undefined', NOW()),
('undefined', 'undefined', '', '', 'undefined', 'undefined', '2025-06-25T11:38:23.116Z', 'completed', 'medium', 'undefined', NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();
