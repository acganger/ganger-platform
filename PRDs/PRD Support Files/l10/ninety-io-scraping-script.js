/**
 * Comprehensive ninety.io Platform Scraping Script
 * 
 * This script systematically explores and extracts data from the ninety.io EOS platform
 * for the Ganger Dermatology account (anand@gangerdermatology.com).
 * 
 * Run this script using the Puppeteer MCP server:
 * npx @modelcontextprotocol/server-puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class NinetyIOScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'https://app.ninety.io';
        this.outputDir = '/mnt/q/Projects/ganger-platform/PRDs/PRD Support files/l10';
        this.scrapedData = {
            dashboard: {},
            rocks: {},
            scorecard: {},
            issues: {},
            todos: {},
            meetings: {},
            headlines: {},
            team: {},
            navigation: {},
            features: []
        };
    }

    async initialize() {
        console.log('🚀 Initializing Puppeteer browser...');
        this.browser = await puppeteer.launch({
            headless: false, // Keep visible for OAuth authentication
            defaultViewport: { width: 1920, height: 1080 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Set up comprehensive request/response logging
        this.page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('api') || url.includes('graphql')) {
                console.log(`📡 API Response: ${response.status()} ${url}`);
                try {
                    const responseData = await response.json();
                    await this.saveApiData(url, responseData);
                } catch (e) {
                    console.log(`⚠️ Could not parse JSON response from: ${url}`);
                }
            }
        });

        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }

    async authenticateWithGoogle() {
        console.log('🔐 Starting Google OAuth authentication...');
        
        // Navigate to ninety.io login
        await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });
        await this.takeScreenshot('01-login-page');
        await this.savePageHTML('01-login-page');

        // Look for Google OAuth button
        const googleLoginSelector = 'button[data-testid="google-login"], .google-login, a[href*="google"], button:contains("Google")';
        
        try {
            await this.page.waitForSelector(googleLoginSelector, { timeout: 10000 });
            await this.page.click(googleLoginSelector);
            console.log('✅ Clicked Google login button');
        } catch (error) {
            console.log('⚠️ Google login button not found, looking for alternative...');
            // Try alternative selectors
            const alternativeSelectors = [
                'a[href*="oauth/google"]',
                'button[class*="google"]',
                '.auth-google',
                '[data-provider="google"]'
            ];
            
            for (const selector of alternativeSelectors) {
                try {
                    await this.page.click(selector);
                    console.log(`✅ Found and clicked: ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }
        }

        // Wait for redirect to Google OAuth
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // Handle Google OAuth flow
        const currentUrl = this.page.url();
        if (currentUrl.includes('accounts.google.com')) {
            console.log('🔍 On Google OAuth page, looking for account selection...');
            
            // Look for the anand@gangerdermatology.com account
            const accountSelector = '[data-email="anand@gangerdermatology.com"], [title*="anand@gangerdermatology.com"]';
            
            try {
                await this.page.waitForSelector(accountSelector, { timeout: 10000 });
                await this.page.click(accountSelector);
                console.log('✅ Selected anand@gangerdermatology.com account');
            } catch (error) {
                console.log('⚠️ Account selector not found, may need manual intervention');
                // Wait for manual intervention if needed
                console.log('Please manually complete the Google OAuth process...');
                await this.page.waitForFunction(
                    () => !window.location.href.includes('accounts.google.com'),
                    { timeout: 60000 }
                );
            }
        }

        // Wait for successful authentication and redirect back to ninety.io
        await this.page.waitForFunction(
            () => window.location.href.includes('app.ninety.io') && !window.location.href.includes('login'),
            { timeout: 30000 }
        );
        
        console.log('✅ Successfully authenticated with Google OAuth');
        await this.takeScreenshot('02-authenticated-home');
    }

    async scrapeDashboard() {
        console.log('📊 Scraping Dashboard/Home section...');
        
        await this.page.goto(`${this.baseUrl}/home`, { waitUntil: 'networkidle2' });
        await this.takeScreenshot('dashboard-overview');
        await this.savePageHTML('dashboard-home');

        // Extract dashboard widgets and data
        const dashboardData = await this.page.evaluate(() => {
            const widgets = [];
            
            // Look for common dashboard elements
            const widgetSelectors = [
                '.widget', '.dashboard-widget', '.card', '.panel',
                '[data-testid*="widget"]', '[class*="widget"]',
                '.metric', '.kpi', '.stat'
            ];

            widgetSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, index) => {
                    widgets.push({
                        selector: selector,
                        index: index,
                        text: el.textContent?.trim(),
                        html: el.innerHTML,
                        classes: Array.from(el.classList),
                        attributes: Array.from(el.attributes).reduce((acc, attr) => {
                            acc[attr.name] = attr.value;
                            return acc;
                        }, {})
                    });
                });
            });

            return {
                widgets: widgets,
                url: window.location.href,
                title: document.title,
                timestamp: new Date().toISOString()
            };
        });

        this.scrapedData.dashboard = dashboardData;
        await this.saveJSON('dashboard-data', dashboardData);
    }

    async scrapeRocks() {
        console.log('🎯 Scraping Rocks (Quarterly Goals) section...');
        
        const rocksUrls = [
            '/rocks',
            '/quarterly-rocks',
            '/goals',
            '/objectives'
        ];

        for (const url of rocksUrls) {
            try {
                await this.page.goto(`${this.baseUrl}${url}`, { waitUntil: 'networkidle2' });
                if (!this.page.url().includes('404') && !this.page.url().includes('not-found')) {
                    console.log(`✅ Found rocks section at: ${url}`);
                    break;
                }
            } catch (error) {
                console.log(`⚠️ Could not access: ${url}`);
                continue;
            }
        }

        await this.takeScreenshot('rocks-overview');
        await this.savePageHTML('rocks-section');

        const rocksData = await this.page.evaluate(() => {
            const rocks = [];
            
            // Look for rock/goal elements
            const rockSelectors = [
                '.rock', '.goal', '.objective', '.quarterly-rock',
                '[data-testid*="rock"]', '[class*="rock"]',
                '.card', '.list-item'
            ];

            rockSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, index) => {
                    // Extract rock details
                    const titleEl = el.querySelector('h1, h2, h3, h4, .title, .name, [class*="title"]');
                    const ownerEl = el.querySelector('.owner, .assignee, [class*="owner"], [class*="assignee"]');
                    const statusEl = el.querySelector('.status, .progress, [class*="status"], [class*="progress"]');
                    const dueDateEl = el.querySelector('.due-date, .deadline, [class*="date"]');

                    rocks.push({
                        selector: selector,
                        index: index,
                        title: titleEl?.textContent?.trim(),
                        owner: ownerEl?.textContent?.trim(),
                        status: statusEl?.textContent?.trim(),
                        dueDate: dueDateEl?.textContent?.trim(),
                        fullText: el.textContent?.trim(),
                        classes: Array.from(el.classList)
                    });
                });
            });

            return {
                rocks: rocks,
                totalCount: rocks.length,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        });

        this.scrapedData.rocks = rocksData;
        await this.saveJSON('rocks-data', rocksData);
    }

    async scrapeScorecard() {
        console.log('📈 Scraping Scorecard (Weekly Metrics) section...');
        
        const scorecardUrls = [
            '/scorecard',
            '/metrics',
            '/kpis',
            '/dashboard/scorecard'
        ];

        for (const url of scorecardUrls) {
            try {
                await this.page.goto(`${this.baseUrl}${url}`, { waitUntil: 'networkidle2' });
                if (!this.page.url().includes('404')) {
                    console.log(`✅ Found scorecard section at: ${url}`);
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        await this.takeScreenshot('scorecard-overview');
        await this.savePageHTML('scorecard-section');

        const scorecardData = await this.page.evaluate(() => {
            const metrics = [];
            
            // Look for metric/KPI elements
            const metricSelectors = [
                '.metric', '.kpi', '.scorecard-item', '.measurement',
                '[data-testid*="metric"]', '[class*="metric"]',
                'tr', '.row', '.list-item'
            ];

            metricSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, index) => {
                    const nameEl = el.querySelector('.name, .title, .metric-name, th, .label');
                    const valueEl = el.querySelector('.value, .number, .metric-value, td, .amount');
                    const targetEl = el.querySelector('.target, .goal, .benchmark');
                    const ownerEl = el.querySelector('.owner, .responsible');

                    if (nameEl || valueEl) {
                        metrics.push({
                            selector: selector,
                            index: index,
                            name: nameEl?.textContent?.trim(),
                            value: valueEl?.textContent?.trim(),
                            target: targetEl?.textContent?.trim(),
                            owner: ownerEl?.textContent?.trim(),
                            fullText: el.textContent?.trim()
                        });
                    }
                });
            });

            return {
                metrics: metrics,
                totalCount: metrics.length,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        });

        this.scrapedData.scorecard = scorecardData;
        await this.saveJSON('scorecard-data', scorecardData);
    }

    async scrapeIssues() {
        console.log('⚠️ Scraping Issues (IDS Tracking) section...');
        
        const issuesUrls = [
            '/issues',
            '/ids',
            '/problems',
            '/action-items'
        ];

        for (const url of issuesUrls) {
            try {
                await this.page.goto(`${this.baseUrl}${url}`, { waitUntil: 'networkidle2' });
                if (!this.page.url().includes('404')) {
                    console.log(`✅ Found issues section at: ${url}`);
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        await this.takeScreenshot('issues-overview');
        await this.savePageHTML('issues-section');

        const issuesData = await this.page.evaluate(() => {
            const issues = [];
            
            const issueSelectors = [
                '.issue', '.problem', '.ids-item', '.action-item',
                '[data-testid*="issue"]', '[class*="issue"]',
                '.list-item', '.card', 'tr'
            ];

            issueSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, index) => {
                    const titleEl = el.querySelector('.title, .name, .description, .summary');
                    const ownerEl = el.querySelector('.owner, .assignee, .responsible');
                    const statusEl = el.querySelector('.status, .state');
                    const priorityEl = el.querySelector('.priority, .level');
                    const dueDateEl = el.querySelector('.due-date, .deadline');

                    if (titleEl) {
                        issues.push({
                            selector: selector,
                            index: index,
                            title: titleEl?.textContent?.trim(),
                            owner: ownerEl?.textContent?.trim(),
                            status: statusEl?.textContent?.trim(),
                            priority: priorityEl?.textContent?.trim(),
                            dueDate: dueDateEl?.textContent?.trim(),
                            fullText: el.textContent?.trim()
                        });
                    }
                });
            });

            return {
                issues: issues,
                totalCount: issues.length,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        });

        this.scrapedData.issues = issuesData;
        await this.saveJSON('issues-data', issuesData);
    }

    async scrapeTodos() {
        console.log('✅ Scraping Todos (Task Management) section...');
        
        const todosUrls = [
            '/todos',
            '/tasks',
            '/action-items',
            '/to-dos'
        ];

        for (const url of todosUrls) {
            try {
                await this.page.goto(`${this.baseUrl}${url}`, { waitUntil: 'networkidle2' });
                if (!this.page.url().includes('404')) {
                    console.log(`✅ Found todos section at: ${url}`);
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        await this.takeScreenshot('todos-overview');
        await this.savePageHTML('todos-section');

        const todosData = await this.page.evaluate(() => {
            const todos = [];
            
            const todoSelectors = [
                '.todo', '.task', '.action-item', '.checklist-item',
                '[data-testid*="todo"]', '[class*="todo"]',
                '.list-item', '.checkbox-item', 'li'
            ];

            todoSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, index) => {
                    const taskEl = el.querySelector('.task, .title, .description, .text');
                    const ownerEl = el.querySelector('.owner, .assignee');
                    const statusEl = el.querySelector('.status, .completed');
                    const dueDateEl = el.querySelector('.due-date, .deadline');
                    const checkboxEl = el.querySelector('input[type="checkbox"]');

                    if (taskEl || el.textContent?.trim()) {
                        todos.push({
                            selector: selector,
                            index: index,
                            task: taskEl?.textContent?.trim() || el.textContent?.trim(),
                            owner: ownerEl?.textContent?.trim(),
                            status: statusEl?.textContent?.trim(),
                            dueDate: dueDateEl?.textContent?.trim(),
                            completed: checkboxEl?.checked || false,
                            fullText: el.textContent?.trim()
                        });
                    }
                });
            });

            return {
                todos: todos,
                totalCount: todos.length,
                completedCount: todos.filter(t => t.completed).length,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        });

        this.scrapedData.todos = todosData;
        await this.saveJSON('todos-data', todosData);
    }

    async scrapeMeetings() {
        console.log('🤝 Scraping Meetings (L10 Records) section...');
        
        const meetingsUrls = [
            '/meetings',
            '/l10',
            '/level-10',
            '/sessions'
        ];

        for (const url of meetingsUrls) {
            try {
                await this.page.goto(`${this.baseUrl}${url}`, { waitUntil: 'networkidle2' });
                if (!this.page.url().includes('404')) {
                    console.log(`✅ Found meetings section at: ${url}`);
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        await this.takeScreenshot('meetings-overview');
        await this.savePageHTML('meetings-section');

        // Try to access individual meeting records
        const meetingsData = await this.page.evaluate(() => {
            const meetings = [];
            
            const meetingSelectors = [
                '.meeting', '.session', '.l10-meeting', '.meeting-record',
                '[data-testid*="meeting"]', '[class*="meeting"]',
                '.list-item', '.card', 'tr'
            ];

            meetingSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, index) => {
                    const dateEl = el.querySelector('.date, .meeting-date, .timestamp');
                    const titleEl = el.querySelector('.title, .name, .meeting-title');
                    const attendeesEl = el.querySelector('.attendees, .participants');
                    const statusEl = el.querySelector('.status, .state');

                    if (dateEl || titleEl) {
                        meetings.push({
                            selector: selector,
                            index: index,
                            date: dateEl?.textContent?.trim(),
                            title: titleEl?.textContent?.trim(),
                            attendees: attendeesEl?.textContent?.trim(),
                            status: statusEl?.textContent?.trim(),
                            fullText: el.textContent?.trim()
                        });
                    }
                });
            });

            return {
                meetings: meetings,
                totalCount: meetings.length,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        });

        this.scrapedData.meetings = meetingsData;
        await this.saveJSON('meetings-data', meetingsData);
    }

    async scrapeHeadlines() {
        console.log('📰 Scraping Headlines (Company News) section...');
        
        const headlinesUrls = [
            '/headlines',
            '/news',
            '/updates',
            '/announcements'
        ];

        for (const url of headlinesUrls) {
            try {
                await this.page.goto(`${this.baseUrl}${url}`, { waitUntil: 'networkidle2' });
                if (!this.page.url().includes('404')) {
                    console.log(`✅ Found headlines section at: ${url}`);
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        await this.takeScreenshot('headlines-overview');
        await this.savePageHTML('headlines-section');

        const headlinesData = await this.page.evaluate(() => {
            const headlines = [];
            
            const headlineSelectors = [
                '.headline', '.news-item', '.announcement', '.update',
                '[data-testid*="headline"]', '[class*="headline"]',
                '.list-item', '.card', 'article'
            ];

            headlineSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, index) => {
                    const titleEl = el.querySelector('.title, .headline, .subject, h1, h2, h3');
                    const dateEl = el.querySelector('.date, .timestamp, .published');
                    const authorEl = el.querySelector('.author, .by, .created-by');
                    const contentEl = el.querySelector('.content, .body, .description');

                    if (titleEl) {
                        headlines.push({
                            selector: selector,
                            index: index,
                            title: titleEl?.textContent?.trim(),
                            date: dateEl?.textContent?.trim(),
                            author: authorEl?.textContent?.trim(),
                            content: contentEl?.textContent?.trim(),
                            fullText: el.textContent?.trim()
                        });
                    }
                });
            });

            return {
                headlines: headlines,
                totalCount: headlines.length,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        });

        this.scrapedData.headlines = headlinesData;
        await this.saveJSON('headlines-data', headlinesData);
    }

    async scrapeTeamSettings() {
        console.log('👥 Scraping Team Settings/Management section...');
        
        const teamUrls = [
            '/team',
            '/users',
            '/members',
            '/settings/team',
            '/admin/users'
        ];

        for (const url of teamUrls) {
            try {
                await this.page.goto(`${this.baseUrl}${url}`, { waitUntil: 'networkidle2' });
                if (!this.page.url().includes('404')) {
                    console.log(`✅ Found team section at: ${url}`);
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        await this.takeScreenshot('team-overview');
        await this.savePageHTML('team-section');

        const teamData = await this.page.evaluate(() => {
            const members = [];
            
            const memberSelectors = [
                '.member', '.user', '.team-member', '.person',
                '[data-testid*="member"]', '[class*="member"]',
                '.list-item', '.card', 'tr'
            ];

            memberSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, index) => {
                    const nameEl = el.querySelector('.name, .member-name, .user-name');
                    const emailEl = el.querySelector('.email, .user-email');
                    const roleEl = el.querySelector('.role, .position, .title');
                    const statusEl = el.querySelector('.status, .active, .state');

                    if (nameEl || emailEl) {
                        members.push({
                            selector: selector,
                            index: index,
                            name: nameEl?.textContent?.trim(),
                            email: emailEl?.textContent?.trim(),
                            role: roleEl?.textContent?.trim(),
                            status: statusEl?.textContent?.trim(),
                            fullText: el.textContent?.trim()
                        });
                    }
                });
            });

            return {
                members: members,
                totalCount: members.length,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        });

        this.scrapedData.team = teamData;
        await this.saveJSON('team-data', teamData);
    }

    async exploreNavigation() {
        console.log('🧭 Mapping Navigation and Discovering Additional Sections...');
        
        const navigationData = await this.page.evaluate(() => {
            const navItems = [];
            
            // Look for navigation elements
            const navSelectors = [
                'nav a', '.nav-item', '.menu-item', '.sidebar a',
                '[data-testid*="nav"]', '[class*="nav"]',
                '.navigation a', 'header a', '.menu a'
            ];

            navSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, index) => {
                    const href = el.getAttribute('href');
                    const text = el.textContent?.trim();
                    
                    if (href && text) {
                        navItems.push({
                            selector: selector,
                            index: index,
                            text: text,
                            href: href,
                            fullUrl: href.startsWith('http') ? href : `${window.location.origin}${href}`,
                            classes: Array.from(el.classList)
                        });
                    }
                });
            });

            // Also look for buttons that might trigger navigation
            const buttons = document.querySelectorAll('button[data-href], button[onclick*="navigate"], button[onclick*="location"]');
            buttons.forEach((btn, index) => {
                navItems.push({
                    selector: 'button[navigation]',
                    index: index,
                    text: btn.textContent?.trim(),
                    href: btn.dataset.href || 'javascript',
                    type: 'button',
                    classes: Array.from(btn.classList)
                });
            });

            return {
                navItems: navItems,
                totalCount: navItems.length,
                uniqueUrls: [...new Set(navItems.map(item => item.href))],
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        });

        this.scrapedData.navigation = navigationData;
        await this.saveJSON('navigation-data', navigationData);

        // Explore unique URLs found in navigation
        console.log(`🔍 Found ${navigationData.uniqueUrls.length} unique URLs to explore...`);
        
        for (const url of navigationData.uniqueUrls.slice(0, 10)) { // Limit to first 10 for time
            if (url.includes('app.ninety.io') && !url.includes('#') && !url.includes('logout')) {
                try {
                    console.log(`🔍 Exploring: ${url}`);
                    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
                    
                    const urlSlug = url.split('/').pop() || 'unknown';
                    await this.takeScreenshot(`explored-${urlSlug}`);
                    await this.savePageHTML(`explored-${urlSlug}`);
                    
                    // Brief pause between requests
                    await this.page.waitForTimeout(2000);
                } catch (error) {
                    console.log(`⚠️ Could not explore: ${url} - ${error.message}`);
                }
            }
        }
    }

    async identifyFeatures() {
        console.log('🔍 Identifying Platform Features...');
        
        // Go back to main dashboard for feature identification
        await this.page.goto(`${this.baseUrl}/home`, { waitUntil: 'networkidle2' });
        
        const featuresData = await this.page.evaluate(() => {
            const features = [];
            
            // Look for interactive elements that indicate features
            const interactiveSelectors = [
                'button', 'a[href]', 'input', 'select', 'textarea',
                '[onclick]', '[data-action]', '[role="button"]'
            ];

            interactiveSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const text = el.textContent?.trim();
                    const title = el.title || el.getAttribute('aria-label');
                    const action = el.getAttribute('data-action') || el.getAttribute('onclick');
                    
                    if (text || title) {
                        features.push({
                            type: el.tagName.toLowerCase(),
                            text: text,
                            title: title,
                            action: action,
                            classes: Array.from(el.classList),
                            href: el.getAttribute('href')
                        });
                    }
                });
            });

            // Look for form elements and their purposes
            const forms = document.querySelectorAll('form');
            forms.forEach((form, index) => {
                const formData = {
                    type: 'form',
                    index: index,
                    action: form.action,
                    method: form.method,
                    fields: []
                };

                const inputs = form.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    formData.fields.push({
                        name: input.name,
                        type: input.type,
                        placeholder: input.placeholder,
                        required: input.required
                    });
                });

                features.push(formData);
            });

            return {
                features: features,
                totalCount: features.length,
                formCount: forms.length,
                timestamp: new Date().toISOString()
            };
        });

        this.scrapedData.features = featuresData.features;
        await this.saveJSON('features-inventory', featuresData);
    }

    // Utility methods
    async takeScreenshot(name) {
        const filepath = path.join(this.outputDir, 'screenshots', `${name}.png`);
        await this.page.screenshot({ 
            path: filepath, 
            fullPage: true,
            type: 'png'
        });
        console.log(`📸 Screenshot saved: ${filepath}`);
    }

    async savePageHTML(name) {
        const html = await this.page.content();
        const filepath = path.join(this.outputDir, 'raw-html', `${name}.html`);
        await fs.writeFile(filepath, html, 'utf8');
        console.log(`💾 HTML saved: ${filepath}`);
    }

    async saveJSON(name, data) {
        const filepath = path.join(this.outputDir, 'json-data', `${name}.json`);
        await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`💾 JSON saved: ${filepath}`);
    }

    async saveApiData(url, data) {
        const filename = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filepath = path.join(this.outputDir, 'json-data', `api-${filename}.json`);
        await fs.writeFile(filepath, JSON.stringify({ url, data, timestamp: new Date().toISOString() }, null, 2), 'utf8');
    }

    async generateReport() {
        console.log('📋 Generating Comprehensive Report...');
        
        const report = {
            scrapingSession: {
                timestamp: new Date().toISOString(),
                platform: 'ninety.io',
                account: 'anand@gangerdermatology.com',
                totalDataPoints: Object.values(this.scrapedData).reduce((acc, section) => {
                    if (Array.isArray(section)) return acc + section.length;
                    if (section.totalCount) return acc + section.totalCount;
                    return acc;
                }, 0)
            },
            sections: {
                dashboard: {
                    scraped: !!this.scrapedData.dashboard.widgets,
                    dataPoints: this.scrapedData.dashboard.widgets?.length || 0
                },
                rocks: {
                    scraped: !!this.scrapedData.rocks.rocks,
                    dataPoints: this.scrapedData.rocks.totalCount || 0
                },
                scorecard: {
                    scraped: !!this.scrapedData.scorecard.metrics,
                    dataPoints: this.scrapedData.scorecard.totalCount || 0
                },
                issues: {
                    scraped: !!this.scrapedData.issues.issues,
                    dataPoints: this.scrapedData.issues.totalCount || 0
                },
                todos: {
                    scraped: !!this.scrapedData.todos.todos,
                    dataPoints: this.scrapedData.todos.totalCount || 0
                },
                meetings: {
                    scraped: !!this.scrapedData.meetings.meetings,
                    dataPoints: this.scrapedData.meetings.totalCount || 0
                },
                headlines: {
                    scraped: !!this.scrapedData.headlines.headlines,
                    dataPoints: this.scrapedData.headlines.totalCount || 0
                },
                team: {
                    scraped: !!this.scrapedData.team.members,
                    dataPoints: this.scrapedData.team.totalCount || 0
                }
            },
            features: {
                totalIdentified: this.scrapedData.features.length,
                interactiveElements: this.scrapedData.features.filter(f => f.type === 'button').length,
                forms: this.scrapedData.features.filter(f => f.type === 'form').length,
                navigation: this.scrapedData.navigation.totalCount || 0
            },
            recommendations: [
                'Review scraped data for data structure patterns',
                'Compare feature inventory with current L10 app capabilities',
                'Identify unique ninety.io features not in current implementation',
                'Plan data migration strategy based on discovered schemas',
                'Consider UX patterns and workflows found in ninety.io'
            ]
        };

        await this.saveJSON('comprehensive-report', report);
        return report;
    }

    async run() {
        try {
            console.log('🚀 Starting comprehensive ninety.io scraping...');
            
            await this.initialize();
            await this.authenticateWithGoogle();
            
            // Systematic scraping of all sections
            await this.scrapeDashboard();
            await this.scrapeRocks();
            await this.scrapeScorecard();
            await this.scrapeIssues();
            await this.scrapeTodos();
            await this.scrapeMeetings();
            await this.scrapeHeadlines();
            await this.scrapeTeamSettings();
            
            // Exploration and feature identification
            await this.exploreNavigation();
            await this.identifyFeatures();
            
            // Generate final report
            const report = await this.generateReport();
            
            console.log('✅ Scraping completed successfully!');
            console.log('📊 Summary:');
            console.log(`   - Total data points: ${report.scrapingSession.totalDataPoints}`);
            console.log(`   - Features identified: ${report.features.totalIdentified}`);
            console.log(`   - Navigation items: ${report.features.navigation}`);
            console.log(`   - All data saved to: ${this.outputDir}`);
            
        } catch (error) {
            console.error('❌ Scraping failed:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Export for use
module.exports = NinetyIOScraper;

// Run if called directly
if (require.main === module) {
    const scraper = new NinetyIOScraper();
    scraper.run().catch(console.error);
}