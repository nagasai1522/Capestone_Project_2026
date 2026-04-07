import { useState, useEffect, useCallback } from "react";
import { requestFirebaseNotificationPermission, onMessageListener } from '../../firebase';
import axios from "axios";
import {
  Bell,
  CloudRain,
  AlertTriangle,
  Leaf,
  CheckCircle,
  X,
} from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [fcmReady, setFcmReady] = useState(false);

  const tabs = ["All", "Weather", "Crops", "Alerts"];

  const [settings, setSettings] = useState({
    weatherAlerts: true,
    cropReminders: true,
    diseaseWarnings: true,
    systemUpdates: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Fetch ALL notifications from backend — single source of truth, no local generation
  const fetchNotifications = useCallback(async () => {
    setIsFetching(true);
    try {
      const fcmToken = localStorage.getItem('fcmToken');
      let backendNotifications = [];

      if (fcmToken) {
        const res = await axios.post(`${API_URL}/api/notifications/user`, { token: fcmToken });
        if (res.data.success) backendNotifications = res.data.notifications || [];
      } else {
        const res = await axios.get(`${API_URL}/api/notifications`);
        if (res.data.success) backendNotifications = res.data.notifications || [];
      }

      // Replace list entirely — backend is the single source of truth
      // Keep any pending Firebase foreground messages (source: 'firebase') that arrived since last fetch
      setNotifications(prev => {
        const firebaseLive = prev.filter(n => n.source === 'firebase' && n._local);
        const merged = [...firebaseLive, ...backendNotifications];
        const seen = new Set();
        return merged.filter(n => {
          const key = String(n.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 100);
      });

      setIsLive(true);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setIsLive(false);
    } finally {
      setIsFetching(false);
    }
  }, [API_URL]);

  const refreshData = () => {
    setIsLive(false);
    fetchNotifications();
  };

  // Called when user explicitly clicks "Enable Notifications"
  const enableNotifications = async () => {
    try {
      const token = await requestFirebaseNotificationPermission();
      if (token) {
        localStorage.setItem('fcmToken', token);
        await axios.post(`${API_URL}/api/notifications/register`, { token }).catch(() => {});
        setFcmReady(true);
        // Trigger immediate live push once enabled
        axios.post(`${API_URL}/api/notifications/push-live`, { token }).catch(() => {});
      }
    } catch (err) {
      console.error('FCM setup error:', err);
    }
  };

  // Firebase setup: restore existing token + continuous foreground message listener
  useEffect(() => {
    // Restore FCM ready state if token already saved (no permission prompt)
    const savedToken = localStorage.getItem('fcmToken');
    if (savedToken) {
      setFcmReady(true);
      axios.post(`${API_URL}/api/notifications/register`, { token: savedToken }).catch(() => {});
    }

    // Continuous Firebase foreground message listener — wrapped so any Firebase error
    // stays as a console warning instead of triggering the React Error Overlay
    let unsubscribeFirebase = null;
    try {
      unsubscribeFirebase = onMessageListener((payload) => {
        const newNotif = {
          id: Date.now(),
          type: payload.data?.type || 'system',
          category: payload.data?.category || payload.data?.type || 'system',
          title: payload.notification?.title || 'New Alert',
          message: payload.notification?.body || 'You have a new notification',
          time: 'Just now',
          priority: payload.data?.priority || 'medium',
          severity: payload.data?.priority || 'medium',
          read: false,
          crop_name: payload.data?.cropName || null,
          source: 'firebase',
          _local: true,
        };

        setNotifications(prev => [newNotif, ...prev].slice(0, 100));

        // Show OS desktop popup — use direct Notification API (most reliable in foreground)
        if (Notification.permission === 'granted') {
          try {
            new Notification(newNotif.title, {
              body: newNotif.message,
              icon: '/logo192.png',
              tag: `farmai-${newNotif.id}`,
              silent: false,
            });
          } catch (e) {
            // Fallback: try via service worker
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(newNotif.title, {
                  body: newNotif.message,
                  icon: '/logo192.png',
                });
              }).catch(() => {});
            }
          }
        }
      });
    } catch (err) {
      console.warn('Firebase listener not available:', err.message);
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      if (typeof unsubscribeFirebase === 'function') unsubscribeFirebase();
      clearInterval(interval);
    };
  }, [API_URL, fetchNotifications]);

  
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const clearAllNotifications = async () => {
    const fcmToken = localStorage.getItem('fcmToken');
    setNotifications([]);
    try {
      await axios.post(`${API_URL}/api/notifications/clear`, { token: fcmToken });
    } catch (err) {
      console.error('Clear error:', err);
    }
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    if (activeTab === "All") {
      return notifications;
    }
    
    const typeMap = {
      "Weather": ["weather"],
      "Crops": ["crop", "harvest", "health"],
      "Alerts": ["disease", "system", "warning", "error"]
    };
    
    const filterTypes = typeMap[activeTab] || [];
    return notifications.filter(n => 
      filterTypes.includes(n.type) || 
      filterTypes.includes(n.category) ||
      (activeTab === "Crops" && n.crop_name) ||
      (activeTab === "Weather" && n.category === "weather")
    );
  };

  const filteredNotifications = getFilteredNotifications();

  const getNotificationIcon = (type, category) => {
    // Use category first, then type
    const iconType = category || type;
    switch (iconType) {
      case "weather":
      case "temperature":
      case "rainfall":
      case "humidity":
        return CloudRain;
      case "crop":
      case "harvest":
      case "health":
      case "growth":
        return Leaf;
      case "disease":
      case "alert":
      case "warning":
      case "error":
        return AlertTriangle;
      case "system":
      case "info":
      default:
        return Bell;
    }
  };

  // Send test Firebase notification and refresh list
  const sendTestFirebaseNotification = async () => {
    try {
      const fcmToken = localStorage.getItem('fcmToken');
      if (!fcmToken) {
        alert('Please click "Enable Notifications" first.');
        return;
      }
      const response = await axios.post(`${API_URL}/api/notifications/send-test`, {
        title: "🧪 Test Firebase Notification",
        body: "This is a live Firebase push notification from FarmAI!",
        type: "system",
        token: fcmToken
      });
      if (response.data.success) {
        setTimeout(() => fetchNotifications(), 800);
      } else {
        // Token is expired — clear it so user gets a fresh one
        localStorage.removeItem('fcmToken');
        setFcmReady(false);
        alert('Push failed — token expired. Click "Enable Notifications" to refresh.');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      // Also clear token on network/server error
      localStorage.removeItem('fcmToken');
      setFcmReady(false);
    }
  };


  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 text-success fw-bold mb-1">Notifications</h1>
            <p className="text-muted">
              Manage your alerts and notification preferences
            </p>
            {lastUpdate && (
              <small className="text-muted d-block">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </small>
            )}
          </div>
          <div className="d-flex align-items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-outline-success d-flex align-items-center"
                onClick={markAllAsRead}
              >
                <i className="bi bi-check-circle me-2"></i> Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={clearAllNotifications}
              >
                🗑 Clear All
              </button>
            )}
            {!fcmReady && (
              <button
                type="button"
                className="btn btn-sm btn-warning fw-semibold"
                onClick={enableNotifications}
              >
                🔔 Enable Notifications
              </button>
            )}
            <span className="badge bg-warning text-dark">
              {unreadCount} Unread
            </span>
            <button
              type="button"
              onClick={refreshData}
              className="btn btn-sm btn-outline-secondary"
              title="Refresh notifications"
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              onClick={sendTestFirebaseNotification}
              className="btn btn-sm btn-outline-success"
              title="Send a test push notification to your browser"
            >
              🧪 Test Push
            </button>
           
            <div className="d-flex align-items-center gap-2">
              <span
                className="px-2 py-1 rounded-pill"
                style={{ backgroundColor: isLive ? '#28a745' : '#6c757d', color: 'white', fontSize: '11px', fontWeight: 'bold' }}
              >
                {isFetching ? '⏳ Updating…' : isLive ? '🟢 LIVE' : '🔴 OFFLINE'}
              </span>
             
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Notifications List */}
          <div className="col-lg-8">
            <div className="d-flex justify-content-center my-2">
              <div className="d-flex bg-light rounded-3 shadow-sm w-100" style={{maxWidth: "900px"}}>
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-fill btn border-0 fw-semibold py-2 ${
                      activeTab === tab
                        ? "bg-white text-success shadow-sm rounded-3"
                        : "text-muted"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="tab-content mt-3">
              {/* All Notifications */}
              <div className="tab-pane fade show active" id="all">
                {filteredNotifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type, notification.category);

                  // Normalise: backend may send severity without priority
                  const level = notification.priority || notification.severity || 'medium';

                  // Priority colors
                  const priorityColors = {
                    high: "bg-danger-subtle text-danger-emphasis",
                    medium: "bg-warning-subtle text-warning-emphasis",
                    low: "bg-success-subtle text-success-emphasis",
                  };
                  
                  const severityClass = priorityColors[level] || priorityColors.medium;

                  return (
                    <div
                      key={notification.id}
                      className={`p-3 mb-3 border-1 border-success  shadow-sm rounded-4 ${
                        !notification.read
                          ? "bg-success bg-opacity-10 border-1"
                          : "bg-light"
                      }`}
                    >
                      <div className="card-body d-flex justify-content-between align-items-start flex-wrap">
                        {/* Left Side */}
                        <div className="d-flex flex-grow-1 gap-3">
                          {/* Icon */}
                          <div
                            className="d-flex align-items-center justify-content-center rounded-circle bg-light shadow-sm"
                            style={{ width: "48px", height: "48px" }}
                          >
                            <IconComponent className="fs-4 text-success" />
                          </div>

                          {/* Text */}
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <h6
                                className={`fw-bold mb-0 ${
                                  !notification.read
                                    ? "text-success"
                                    : "text-dark"
                                }`}
                              >
                                {notification.title}
                              </h6>
                              {!notification.read && (
                                <span className="badge bg-danger rounded-circle" style={{width: '8px', height: '8px', padding: 0}}></span>
                              )}
                            </div>
                            
                            {/* Real Data Badges */}
                            <div className="d-flex gap-2 mb-2 flex-wrap">
                              {notification.category && (
                                <span className={`badge ${severityClass} text-capitalize`}>
                                  {notification.category}
                                </span>
                              )}
                              {notification.severity && (
                                <span className={`badge ${severityClass}`}>
                                  {notification.severity}
                                </span>
                              )}
                              {notification.crop_name && (
                                <span className="badge bg-info-subtle text-info-emphasis">
                                  🌱 {notification.crop_name}
                                </span>
                              )}
                              {notification.source === 'firebase' && (
                                <span className="badge bg-primary-subtle text-primary-emphasis">
                                  🔥 Firebase
                                </span>
                              )}
                            </div>
                            
                            <p className="text-muted small mb-2">
                              {notification.message}
                            </p>

                            {/* Time + Priority */}
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              <span className="small text-muted d-flex align-items-center gap-1">
                                <i className="bi bi-clock"></i>{" "}
                                {notification.time}
                              </span>
                              <span
                                className={`badge rounded-pill px-3 py-1 text-capitalize ${
                                  priorityColors[level]
                                }`}
                              >
                                {level}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
                          {!notification.read && (
                            <button
                              type="button"
                              className="btn btn-sm btn-light rounded-circle text-success"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-light rounded-circle text-muted"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Empty State */}
                {filteredNotifications.length === 0 && (
                  <div className="text-center py-5">
                   
                    <h5 className="text-muted">No {activeTab} Notifications</h5>
                    <p className="text-muted small">
                      {activeTab === "All" 
                        ? "You're all caught up! New notifications will appear here."
                        : `No ${activeTab.toLowerCase()} alerts at the moment.`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="col-lg-4">
            {/* Notification Settings */}
            <div className="card mb-4">
              <div className="p-0 fw-bold text-success">
                <i className="bi bi-gear me-2"></i> Notification Settings
                <hr/>
              </div>
              <div className="card-body">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.weatherAlerts}
                    onChange={(e) =>
                      updateSetting("weatherAlerts", e.target.checked)
                    }
                  />
                  <label className="form-check-label fw-semibold text-success">
                    Weather Alerts
                  </label>
                  <div className="small text-muted">
                    Rain, frost, and severe weather
                  </div>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.cropReminders}
                    onChange={(e) =>
                      updateSetting("cropReminders", e.target.checked)
                    }
                  />
                  <label className="form-check-label fw-semibold text-success">
                    Crop Reminders
                  </label>
                  <div className="small text-muted">
                    Fertilization and care tasks
                  </div>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.diseaseWarnings}
                    onChange={(e) =>
                      updateSetting("diseaseWarnings", e.target.checked)
                    }
                  />
                  <label className="form-check-label fw-semibold text-danger">
                    Disease Warnings
                  </label>
                  <div className="small text-muted">High-risk conditions</div>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.systemUpdates}
                    onChange={(e) =>
                      updateSetting("systemUpdates", e.target.checked)
                    }
                  />
                  <label className="form-check-label fw-semibold text-muted">
                    System Updates
                  </label>
                  <div className="small text-muted">
                    App updates and maintenance
                  </div>
                </div>
              </div>
            </div>
           

            {/* Quick Stats */}
            <div className="card">
              <div className="p-0 fw-bold text-success">
                Notification Stats
              </div>
              <hr/>

              <div className="card-body text-center">
                <div className="p-3 bg-light rounded mb-3">
                  <h2 className="fw-bold text-success">
                    {filteredNotifications.length}
                  </h2>
                  <div className="small text-muted">Total Notifications</div>
                </div>
                <div className="row g-2">
                  <div className="col">
                    <div className="p-2 bg-warning rounded">
                      <h5 className="fw-bold text-dark">
                        {filteredNotifications.filter((n) => !n.read).length}
                      </h5>
                      <div className="small text-muted">Unread</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="p-2 bg-success-subtle rounded">
                      <h5 className="fw-bold text-success">
                        {
                          filteredNotifications.filter((n) => n.priority === "high")
                            .length
                        }
                      </h5>
                      <div className="small text-muted">High Priority</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
