import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// --- API Configuration ---
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
export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ fullName, email, password, role, inviteCode }, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password, role, inviteCode }),
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      // Store JWT token
      localStorage.setItem(TOKEN_KEY, data.data.token);
      return data.data; // { token, user }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return rejectWithValue('No token');
      const data = await apiRequest('/auth/me');
      return data.data; // { user }
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      return rejectWithValue(error.message);
    }
  }
);

// --- Phase 2 Student Profile Thunks ---

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/student/profile', {
        method: 'GET',
      });
      return data; // { success, message, data: profileData }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createStudentProfile = createAsyncThunk(
  'auth/createProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/student/profile', {
        method: 'POST',
        body: JSON.stringify(profileData),
      });
      return data; // { success, message, data: profileData }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateStudentProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/student/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      return data; // { success, message, data: profileData }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadResumeFile = createAsyncThunk(
  'auth/uploadResume',
  async (file, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const formData = new FormData();
      formData.append('resume', file);

      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/student/profile/upload-resume`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload resume');
      }
      return data.data; // { resumeUrl }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- Phase 3 Recruiter Profile Thunks ---

export const fetchRecruiterProfile = createAsyncThunk(
  'auth/fetchRecruiterProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/recruiter/profile', { method: 'GET' });
      return data; // { success, message, data: profileData }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createRecruiterProfile = createAsyncThunk(
  'auth/createRecruiterProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/recruiter/profile', {
        method: 'POST',
        body: JSON.stringify(profileData),
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRecruiterProfile = createAsyncThunk(
  'auth/updateRecruiterProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/recruiter/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- Slice ---

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    role: null,
    loading: false,
    initialLoading: true, // Only for app-level mount gate (loadUser)
    error: null,
    recruiterProfile: null, // Phase 3: separate recruiter company data
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.role = null;
      state.loading = false;
      state.error = null;
      state.recruiterProfile = null;
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem('bypass_profile_setup');
    },
    clearError: (state) => {
      state.error = null;
    },
    // Keep a simple login action for Quick Demo buttons (uses mock data)
    loginDemo: (state, action) => {
      const { user, role } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
      state.role = role;
      state.loading = false;
      state.error = null;
      sessionStorage.removeItem('bypass_profile_setup');
    },
    // Backup offline local updater
    updateProfileOffline: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Login ---
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        const user = action.payload.user;
        state.user = { ...user, id: user._id };
        state.role = user.role;
        sessionStorage.removeItem('bypass_profile_setup');
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Load User (restore session) ---
      .addCase(loadUser.pending, (state) => {
        state.initialLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.initialLoading = false;
        state.isAuthenticated = true;
        const user = action.payload.user;
        state.user = { ...user, id: user._id };
        state.role = user.role;
      })
      .addCase(loadUser.rejected, (state) => {
        state.initialLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
      })
      // --- Register ---
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Fetch Profile ---
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        const profile = action.payload.data;
        if (state.user && profile) {
          state.user = {
            ...state.user,
            ...profile,
            hasProfile: true,
            id: state.user._id,
            name: state.user.fullName, // compatibility alias
            resume: profile.resumeUrl, // compatibility alias
          };
        }
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        // Suppress 404 error logs as they just mean profile has not been configured yet
      })
      // --- Create Profile ---
      .addCase(createStudentProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStudentProfile.fulfilled, (state, action) => {
        state.loading = false;
        const profile = action.payload.data;
        if (state.user) {
          state.user = {
            ...state.user,
            ...profile,
            hasProfile: true,
            id: state.user._id,
            name: state.user.fullName,
            resume: profile.resumeUrl,
          };
        }
      })
      .addCase(createStudentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Update Profile ---
      .addCase(updateStudentProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudentProfile.fulfilled, (state, action) => {
        state.loading = false;
        const profile = action.payload.data;
        if (state.user) {
          state.user = {
            ...state.user,
            ...profile,
            id: state.user._id,
            name: state.user.fullName,
            resume: profile.resumeUrl,
          };
        }
      })
      .addCase(updateStudentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Upload Resume ---
      .addCase(uploadResumeFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadResumeFile.fulfilled, (state, action) => {
        state.loading = false;
        const { resumeUrl } = action.payload;
        if (state.user) {
          state.user = {
            ...state.user,
            resumeUrl: resumeUrl,
            resume: resumeUrl,
          };
        }
      })
      .addCase(uploadResumeFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Fetch Recruiter Profile ---
      .addCase(fetchRecruiterProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecruiterProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.recruiterProfile = action.payload.data;
        if (state.user) {
          state.user = { ...state.user, hasProfile: true };
        }
      })
      .addCase(fetchRecruiterProfile.rejected, (state) => {
        state.loading = false;
        // 404 just means profile not created yet
      })
      // --- Create Recruiter Profile ---
      .addCase(createRecruiterProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRecruiterProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.recruiterProfile = action.payload.data;
        if (state.user) {
          state.user = { ...state.user, hasProfile: true };
        }
      })
      .addCase(createRecruiterProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Update Recruiter Profile ---
      .addCase(updateRecruiterProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRecruiterProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.recruiterProfile = action.payload.data;
      })
      .addCase(updateRecruiterProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, loginDemo, updateProfileOffline } = authSlice.actions;
export default authSlice.reducer;
