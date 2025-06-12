# Platform Entrypoint Dashboard - Frontend Development PRD
*React/Next.js Frontend Implementation for Ganger Platform*

## 📋 Document Information
- **Application Name**: Platform Entrypoint Dashboard (Frontend)
- **Terminal Assignment**: TERMINAL 1 - FRONTEND
- **Priority**: High
- **Development Timeline**: 3-4 weeks
- **Dependencies**: @ganger/ui, @ganger/auth/client, @ganger/utils/client, @ganger/types
- **Integration Requirements**: Backend API endpoints, Real-time subscriptions, Widget system

---

## 🎯 Frontend Scope

### **Terminal 1 Responsibilities**
- React components for dashboard layout and widgets
- Drag & drop widget customization interface
- Real-time dashboard updates and subscriptions
- Application launcher and navigation
- Personalized user experience components
- Mobile-responsive dashboard design

### **Excluded from Frontend Terminal**
- API route implementations (Terminal 2)
- Widget data aggregation logic (Terminal 2)
- Background analytics processing (Terminal 2)
- Server-side personalization algorithms (Terminal 2)

---

## 🏗️ Frontend Technology Stack

### **Required Client-Side Packages**
```typescript
'use client'

// Client-safe imports only
import { 
  DashboardLayout, ApplicationCard, NotificationPanel, QuickActionGrid,
  UserProfile, PersonalizedGreeting, ActivityFeed, HelpCenter,
  StatisticCard, ProgressIndicator, MessageCenter, WidgetContainer,
  DragDropGrid, SearchOverlay, PresenceIndicator
} from '@ganger/ui';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { formatDate, formatTime, debounce } from '@ganger/utils/client';
import { 
  User, Application, Notification, UserActivity, DashboardWidget,
  QuickAction, PlatformAnnouncement, UserPreferences
} from '@ganger/types';
```

### **Frontend-Specific Technology**
- **Drag & Drop**: React DnD for widget arrangement
- **Real-time Updates**: Live notifications and presence indicators
- **Adaptive Layout**: Responsive grid system that adapts to user preferences
- **Progressive Web App**: Offline capability for critical functions
- **Widget Framework**: Extensible component system for new integrations
- **Search Interface**: Global search across applications and help content

---

## 🎨 User Interface Components

### **Main Dashboard Layout**
```typescript
'use client'

export default function PlatformDashboard() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);

  return (
    <DashboardLayout>
      {/* Header with user info and notifications */}
      <DashboardHeader 
        user={user}
        onSearch={handleGlobalSearch}
        onNotificationClick={handleNotificationClick}
      />
      
      {/* Announcements Banner */}
      {announcements.length > 0 && (
        <AnnouncementBanner 
          announcements={announcements}
          onDismiss={handleAnnouncementDismiss}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Personalized Greeting */}
          <PersonalizedGreeting 
            user={user}
            timeOfDay={getTimeOfDay()}
            weatherInfo={useWeatherInfo()}
          />
          
          {/* Widget Grid */}
          <WidgetGrid 
            widgets={widgets}
            preferences={preferences}
            onWidgetArrange={handleWidgetArrange}
            onWidgetResize={handleWidgetResize}
            onWidgetRemove={handleWidgetRemove}
          />
        </div>
      </div>
      
      {/* Floating Action Button for Quick Actions */}
      <QuickActionFAB 
        actions={getQuickActionsForUser(user)}
        onActionExecute={handleQuickAction}
      />
      
      {/* Search Overlay */}
      <GlobalSearchOverlay 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleSearchNavigate}
      />
    </DashboardLayout>
  );
}
```

### **Widget Grid Component**
```typescript
'use client'

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface WidgetGridProps {
  widgets: DashboardWidget[];
  preferences: UserPreferences | null;
  onWidgetArrange: (newArrangement: any[]) => void;
  onWidgetResize: (widgetId: string, newSize: any) => void;
  onWidgetRemove: (widgetId: string) => void;
}

export function WidgetGrid({ 
  widgets, 
  preferences, 
  onWidgetArrange, 
  onWidgetResize, 
  onWidgetRemove 
}: WidgetGridProps) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  const gridColumns = preferences?.layout_columns || 3;
  
  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      setDraggedWidget(null);
      return;
    }

    const newArrangement = Array.from(widgets);
    const [reorderedWidget] = newArrangement.splice(result.source.index, 1);
    newArrangement.splice(result.destination.index, 0, reorderedWidget);

    onWidgetArrange(newArrangement);
    setDraggedWidget(null);
  };

  return (
    <div className="space-y-6">
      {/* Customization Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Your Dashboard</h2>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            {isCustomizing ? 'Done Customizing' : 'Customize'}
          </Button>
          
          <LayoutSelector
            columns={gridColumns}
            onColumnsChange={(cols) => updateUserPreference('layout_columns', cols)}
          />
        </div>
      </div>

      {/* Widget Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widget-grid" direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`
                grid gap-6 transition-all duration-200
                ${gridColumns === 1 ? 'grid-cols-1' : ''}
                ${gridColumns === 2 ? 'grid-cols-1 md:grid-cols-2' : ''}
                ${gridColumns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
                ${gridColumns === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''}
                ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}
              `}
            >
              {widgets.map((widget, index) => (
                <Draggable 
                  key={widget.id} 
                  draggableId={widget.id} 
                  index={index}
                  isDragDisabled={!isCustomizing}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        ${snapshot.isDragging ? 'opacity-90 scale-105 z-50' : ''}
                        ${isCustomizing ? 'ring-2 ring-blue-200' : ''}
                      `}
                    >
                      <WidgetContainer
                        widget={widget}
                        isCustomizing={isCustomizing}
                        dragHandleProps={provided.dragHandleProps}
                        onResize={(newSize) => onWidgetResize(widget.id, newSize)}
                        onRemove={() => onWidgetRemove(widget.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Widget Button */}
      {isCustomizing && (
        <AddWidgetPanel
          availableWidgets={getAvailableWidgets()}
          onWidgetAdd={handleWidgetAdd}
        />
      )}
    </div>
  );
}
```

### **Individual Widget Components**
```typescript
'use client'

// Application Launcher Widget
export function ApplicationLauncherWidget({ applications }: { applications: Application[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentApps, setRecentApps] = useState<Application[]>([]);

  const filteredApps = applications.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Applications</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {/* Open all apps view */}}
        >
          View All
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search applications..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="pl-10"
        />
      </div>

      {/* Application Grid */}
      <div className="grid grid-cols-2 gap-3">
        {(searchTerm ? filteredApps : recentApps.slice(0, 6)).map(app => (
          <ApplicationCard
            key={app.id}
            application={app}
            onClick={() => handleAppLaunch(app)}
            className="hover:scale-105 transition-transform"
          />
        ))}
      </div>

      {/* Quick Launch Bar */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Launch</h4>
        <div className="flex space-x-2">
          {applications.slice(0, 4).map(app => (
            <button
              key={app.id}
              onClick={() => handleAppLaunch(app)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={app.name}
            >
              <img 
                src={app.icon_url || '/default-app-icon.png'} 
                alt={app.name}
                className="w-8 h-8"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Notifications Widget
export function NotificationCenterWidget() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <Badge className="bg-red-500 text-white">
            {unreadCount}
          </Badge>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BellIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No new notifications</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkAsRead}
              onClick={() => handleNotificationClick(notification)}
            />
          ))
        )}
      </div>

      {notifications.length > 3 && (
        <Button variant="outline" size="sm" className="w-full">
          View All Notifications
        </Button>
      )}
    </div>
  );
}

// Team Activity Widget
export function TeamActivityWidget() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Activity</h3>
        <Select
          value={selectedTimeframe}
          onChange={setSelectedTimeframe}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' }
          ]}
          size="sm"
        />
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.map(activity => (
          <ActivityTimelineItem
            key={activity.id}
            activity={activity}
            showAvatar={true}
            compact={true}
          />
        ))}
      </div>

      <div className="text-center">
        <Button variant="outline" size="sm">
          View Full Activity Feed
        </Button>
      </div>
    </div>
  );
}

// Quick Actions Widget
export function QuickActionsWidget({ actions }: { actions: QuickAction[] }) {
  const [isExecuting, setIsExecuting] = useState<string | null>(null);

  const handleActionExecute = async (action: QuickAction) => {
    setIsExecuting(action.id);
    
    try {
      await executeQuickAction(action);
    } catch (error) {
      console.error('Quick action failed:', error);
      toast.error('Action failed to execute');
    } finally {
      setIsExecuting(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => handleActionExecute(action)}
            disabled={isExecuting === action.id}
            className={`
              p-4 text-left rounded-lg border transition-all
              hover:border-blue-300 hover:shadow-sm
              ${isExecuting === action.id ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              <div className={`
                p-2 rounded-lg bg-${action.button_color || 'blue'}-100
                text-${action.button_color || 'blue'}-600
              `}>
                <LucideIcon name={action.icon_name} className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {action.display_name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {action.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Upcoming Meetings Widget
export function UpcomingMeetingsWidget() {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUpcomingMeetings();
  }, []);

  const loadUpcomingMeetings = async () => {
    try {
      const response = await fetch('/api/integrations/google-calendar/upcoming');
      const data = await response.json();
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Upcoming Meetings</h3>
      
      {meetings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No upcoming meetings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.slice(0, 3).map(meeting => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              compact={true}
              onJoin={handleJoinMeeting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### **Dashboard Header Component**
```typescript
'use client'

interface DashboardHeaderProps {
  user: User;
  onSearch: (query: string) => void;
  onNotificationClick: () => void;
}

export function DashboardHeader({ user, onSearch, onNotificationClick }: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const debouncedSearch = debounce(onSearch, 300);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery]);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <img 
              src="/ganger-logo.png" 
              alt="Ganger Dermatology" 
              className="h-8 w-auto"
            />
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-900">
                Ganger Platform
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user.first_name}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications, help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`
                  w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all duration-200
                  ${isSearchFocused ? 'shadow-lg' : ''}
                `}
              />
              
              {/* Search Results Dropdown */}
              {isSearchFocused && searchQuery && (
                <SearchResultsDropdown 
                  query={searchQuery}
                  onResultClick={handleSearchResultClick}
                />
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              onClick={onNotificationClick}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <BellIcon className="h-6 w-6" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* Help */}
            <button
              onClick={() => {/* Open help center */}}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <QuestionMarkCircleIcon className="h-6 w-6" />
            </button>

            {/* User Menu */}
            <UserProfileDropdown user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchResultsDropdown({ query, onResultClick }) {
  const [results, setResults] = useState({ applications: [], help: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.trim()) {
      searchContent(query);
    }
  }, [query]);

  const searchContent = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data.results || { applications: [], help: [] });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {isLoading ? (
        <div className="p-4 text-center">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <div className="py-2">
          {/* Applications */}
          {results.applications.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
                Applications
              </div>
              {results.applications.map(app => (
                <button
                  key={app.id}
                  onClick={() => onResultClick('app', app)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                >
                  <img src={app.icon_url} alt="" className="h-6 w-6" />
                  <div>
                    <p className="font-medium text-gray-900">{app.name}</p>
                    <p className="text-sm text-gray-500">{app.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Help Articles */}
          {results.help.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
                Help Articles
              </div>
              {results.help.map(article => (
                <button
                  key={article.id}
                  onClick={() => onResultClick('help', article)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">{article.title}</p>
                  <p className="text-sm text-gray-500">{article.excerpt}</p>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {results.applications.length === 0 && results.help.length === 0 && (
            <div className="px-3 py-4 text-center text-gray-500">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### **Real-time Features**
```typescript
'use client'

export function useRealtimeDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [userPresence, setUserPresence] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to real-time dashboard updates
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/ganger-icon.png'
            });
          }
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'platform_announcements' },
        (payload) => {
          const newAnnouncement = payload.new as PlatformAnnouncement;
          if (shouldShowAnnouncement(newAnnouncement)) {
            setAnnouncements(prev => [newAnnouncement, ...prev]);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Update user presence
    const presenceChannel = supabase.channel('user-presence');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        setUserPresence(Object.values(newState).flat());
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle user joining
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handle user leaving
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      subscription.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, []);

  return {
    notifications,
    announcements,
    userPresence,
    isConnected,
    clearNotifications: () => setNotifications([]),
    dismissAnnouncement: (id: string) => setAnnouncements(prev => 
      prev.filter(a => a.id !== id)
    )
  };
}

function shouldShowAnnouncement(announcement: PlatformAnnouncement): boolean {
  const now = new Date();
  const startDate = new Date(announcement.display_start);
  const endDate = announcement.display_end ? new Date(announcement.display_end) : null;
  
  // Check if announcement is currently active
  if (now < startDate || (endDate && now > endDate)) {
    return false;
  }
  
  // Check if user has already dismissed it
  const dismissedAnnouncements = JSON.parse(
    localStorage.getItem('dismissedAnnouncements') || '[]'
  );
  
  return !dismissedAnnouncements.includes(announcement.id);
}

// Presence indicator component
export function UserPresenceIndicator({ userId }: { userId: string }) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    // Subscribe to user presence
    const presenceChannel = supabase.channel(`user-${userId}`);
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const user = state[userId];
        setIsOnline(!!user && user.length > 0);
        
        if (user && user[0]) {
          setLastSeen(new Date(user[0].online_at));
        }
      })
      .subscribe();

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [userId]);

  return (
    <div className="flex items-center space-x-2">
      <div className={`
        w-2 h-2 rounded-full
        ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
      `} />
      <span className="text-sm text-gray-600">
        {isOnline ? 'Online' : lastSeen ? `Last seen ${formatRelativeTime(lastSeen)}` : 'Offline'}
      </span>
    </div>
  );
}
```

---

## 📱 Mobile Responsive Design

### **Mobile Dashboard Layout**
```typescript
'use client'

export function MobileDashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'apps' | 'notifications'>('home');
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 md:hidden">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/ganger-logo.png" alt="Ganger" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-semibold">Ganger Platform</h1>
              <p className="text-sm text-gray-600">Hi, {user.first_name}</p>
            </div>
          </div>
          
          <button className="p-2 text-gray-600">
            <BellIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pb-20">
        {activeTab === 'home' && <MobileHomeTab />}
        {activeTab === 'apps' && <MobileAppsTab />}
        {activeTab === 'notifications' && <MobileNotificationsTab />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-3">
          <TabButton
            active={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
            icon={<HomeIcon className="h-5 w-5" />}
            label="Home"
          />
          <TabButton
            active={activeTab === 'apps'}
            onClick={() => setActiveTab('apps')}
            icon={<ViewGridIcon className="h-5 w-5" />}
            label="Apps"
          />
          <TabButton
            active={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
            icon={<BellIcon className="h-5 w-5" />}
            label="Alerts"
          />
        </div>
      </div>
    </div>
  );
}

function MobileHomeTab() {
  return (
    <div className="p-4 space-y-6">
      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            title="New Ticket"
            icon={<PlusIcon className="h-6 w-6" />}
            color="blue"
            onClick={() => {/* Navigate to new ticket */}}
          />
          <QuickActionCard
            title="Time Off"
            icon={<CalendarIcon className="h-6 w-6" />}
            color="green"
            onClick={() => {/* Navigate to time off */}}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <div className="bg-white rounded-lg p-4">
          <MobileActivityFeed limit={5} />
        </div>
      </div>

      {/* Weather Widget */}
      <div className="bg-white rounded-lg p-4">
        <WeatherWidget compact={true} />
      </div>
    </div>
  );
}
```

---

## 🔄 API Integration

### **Client-Side API Calls**
```typescript
'use client'

export const dashboardApi = {
  // Dashboard data
  async getDashboardData() {
    const response = await fetch('/api/dashboard');
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return response.json();
  },

  async updatePreferences(preferences: Partial<UserPreferences>) {
    const response = await fetch('/api/dashboard/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    if (!response.ok) throw new Error('Failed to update preferences');
    return response.json();
  },

  // Widget management
  async getAvailableWidgets() {
    const response = await fetch('/api/dashboard/widgets');
    if (!response.ok) throw new Error('Failed to fetch widgets');
    return response.json();
  },

  async arrangeWidgets(arrangement: any[]) {
    const response = await fetch('/api/dashboard/widgets/arrange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arrangement })
    });
    if (!response.ok) throw new Error('Failed to arrange widgets');
    return response.json();
  },

  // Application launching
  async launchApplication(appId: string) {
    const response = await fetch(`/api/applications/launch/${appId}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to launch application');
    return response.json();
  },

  // Quick actions
  async executeQuickAction(actionId: string, parameters?: any) {
    const response = await fetch('/api/quick-actions/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId, parameters })
    });
    if (!response.ok) throw new Error('Failed to execute action');
    return response.json();
  },

  // Search
  async search(query: string) {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  },

  // Notifications
  async getNotifications(page = 1, limit = 25) {
    const response = await fetch(`/api/notifications?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  async markNotificationAsRead(notificationId: string) {
    const response = await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId })
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
  }
};
```

---

## 🧪 Frontend Testing

### **Component Testing**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlatformDashboard } from './PlatformDashboard';

describe('PlatformDashboard', () => {
  it('renders dashboard with user greeting', () => {
    const mockUser = { id: '1', first_name: 'John', email: 'john@gangerdermatology.com' };
    
    render(<PlatformDashboard />, {
      wrapper: ({ children }) => (
        <AuthProvider value={{ user: mockUser }}>
          {children}
        </AuthProvider>
      )
    });
    
    expect(screen.getByText('Welcome back, John')).toBeInTheDocument();
    expect(screen.getByText('Your Dashboard')).toBeInTheDocument();
  });

  it('handles widget drag and drop', async () => {
    const mockWidgets = [
      { id: '1', widget_id: 'app_launcher', display_name: 'Applications' },
      { id: '2', widget_id: 'notifications', display_name: 'Notifications' }
    ];

    render(<WidgetGrid widgets={mockWidgets} onWidgetArrange={jest.fn()} />);
    
    // Test drag and drop functionality
    const firstWidget = screen.getByTestId('widget-1');
    const secondWidget = screen.getByTestId('widget-2');
    
    // Simulate drag and drop
    fireEvent.dragStart(firstWidget);
    fireEvent.dragOver(secondWidget);
    fireEvent.drop(secondWidget);
    
    await waitFor(() => {
      expect(mockOnArrange).toHaveBeenCalled();
    });
  });

  it('searches applications and help content', async () => {
    render(<DashboardHeader user={mockUser} onSearch={jest.fn()} />);
    
    const searchInput = screen.getByPlaceholderText('Search applications, help articles...');
    fireEvent.change(searchInput, { target: { value: 'inventory' } });
    
    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument();
    });
  });
});

describe('Real-time Features', () => {
  it('receives and displays new notifications', async () => {
    const { rerender } = render(<NotificationCenterWidget />);
    
    // Simulate receiving a new notification
    act(() => {
      mockSupabaseChannel.trigger('postgres_changes', {
        event: 'INSERT',
        table: 'notifications',
        new: {
          id: '1',
          title: 'New Message',
          message: 'You have a new message',
          created_at: new Date().toISOString()
        }
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('New Message')).toBeInTheDocument();
    });
  });

  it('updates user presence indicators', () => {
    render(<UserPresenceIndicator userId="user-123" />);
    
    // Simulate user going online
    act(() => {
      mockPresenceChannel.trigger('presence', {
        event: 'sync',
        state: {
          'user-123': [{ online_at: new Date().toISOString() }]
        }
      });
    });
    
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
});
```

---

## 📈 Success Criteria

### **Frontend Launch Criteria**
- [ ] Dashboard loads with personalized greeting and widgets
- [ ] Drag & drop widget customization works across browsers
- [ ] Application launcher opens apps in new tabs correctly
- [ ] Real-time notifications appear within 3 seconds
- [ ] Global search returns relevant results in <500ms
- [ ] Mobile responsive design works on all device sizes
- [ ] Offline functionality caches critical dashboard data

### **Frontend Success Metrics**
- Dashboard initial load time <2 seconds
- Widget arrangement saves within 1 second
- Application launch completes in <1 second
- Search results appear in <300ms
- Real-time updates display within 100ms latency
- Mobile interface achieves 90%+ usability score
- Zero client-side JavaScript errors in production

---

*This frontend PRD provides comprehensive guidance for Terminal 1 to build all React components and user interfaces for the Platform Entrypoint Dashboard, with clear boundaries to prevent conflicts with Terminal 2's backend work.*