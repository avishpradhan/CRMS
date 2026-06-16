import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { drives as mockDrives, applications as mockApplications, interviews as mockInterviews } from '../../data/mockData';

const API_BASE = '/api';
const TOKEN_KEY = 'crms_token';

// --- API Helper ---
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

// --- Async Thunks ---
export const fetchNotifications = createAsyncThunk(
  'data/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/notifications');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markNotificationReadThunk = createAsyncThunk(
  'data/markNotificationRead',
  async (id, { rejectWithValue }) => {
    try {
      const data = await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAllNotificationsReadThunk = createAsyncThunk(
  'data/markAllNotificationsRead',
  async (_, { rejectWithValue }) => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNotificationThunk = createAsyncThunk(
  'data/deleteNotification',
  async (id, { rejectWithValue }) => {
    try {
      await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const clearAllNotificationsThunk = createAsyncThunk(
  'data/clearAllNotifications',
  async (role, { rejectWithValue }) => {
    try {
      await apiRequest('/notifications/clear-all', { method: 'DELETE' });
      return role;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    drives: mockDrives,
    applications: mockApplications,
    interviews: mockInterviews,
    notifications: [],
    loading: false,
    error: null,
  },
  reducers: {
    addDrive: (state, action) => {
      state.drives.push({ ...action.payload, id: state.drives.length + 1 });
    },
    updateDrive: (state, action) => {
      const index = state.drives.findIndex(d => d.id === action.payload.id);
      if (index !== -1) state.drives[index] = action.payload;
    },
    deleteDrive: (state, action) => {
      state.drives = state.drives.filter(d => d.id !== action.payload);
    },
    addApplication: (state, action) => {
      state.applications.push({ ...action.payload, id: state.applications.length + 1 });
    },
    updateApplicationStatus: (state, action) => {
      const { id, status } = action.payload;
      const app = state.applications.find(a => a.id === id);
      if (app) {
        app.status = status;
        app.lastUpdated = new Date().toISOString().split('T')[0];
      }
    },
    addInterview: (state, action) => {
      state.interviews.push({ ...action.payload, id: state.interviews.length + 1 });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.map(n => ({
          ...n,
          id: n._id, // compatibility mapping
          timestamp: n.createdAt, // compatibility mapping
        }));
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark Read
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.notifications.findIndex(n => n.id === updated._id || n._id === updated._id);
        if (index !== -1) {
          state.notifications[index] = {
            ...updated,
            id: updated._id,
            timestamp: updated.createdAt,
          };
        }
      })
      // Mark All Read
      .addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
        state.notifications.forEach(n => {
          n.read = true;
        });
      })
      // Delete Notification
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.notifications = state.notifications.filter(n => n.id !== deletedId && n._id !== deletedId);
      })
      // Clear All Notifications
      .addCase(clearAllNotificationsThunk.fulfilled, (state, action) => {
        const targetRole = action.payload;
        state.notifications = state.notifications.filter(n => n.forRole !== targetRole);
      });
  },
});

export const {
  addDrive, updateDrive, deleteDrive,
  addApplication, updateApplicationStatus,
  addInterview,
} = dataSlice.actions;
export default dataSlice.reducer;
