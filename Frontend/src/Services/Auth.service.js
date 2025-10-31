import { toast } from 'react-hot-toast';
const backendURL = import.meta.env.VITE_BACKEND_URL;

// Helper function to handle API responses
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } else {
    const text = await response.text();
    console.error('Non-JSON response received:', text.substring(0, 200));
    throw new Error(`Server returned ${response.status} ${response.statusText}`);
  }
};

/**
 * Logs in a user with the provided credentials
 * @param {Object} userData - The user's login credentials
 * @param {string} userData.email - The user's email
 * @param {string} userData.password - The user's password
 * @returns {Promise<boolean>} - True if login was successful, false otherwise
 */
export const loginUser = async (userData) => {
  try {
    const response = await fetch(`${backendURL}/users/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include' // Important for cookies/session
    });

    // First, get the response as text to handle both JSON and non-JSON responses
    const responseText = await response.text();
    let data;
    
    try {
      // Try to parse the response as JSON
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      // If we have a 401 status, it's an auth error
      if (response.status === 401) {
        throw new Error('Invalid email or password');
      }
      // For other errors, try to extract error message from HTML
      const errorMatch = responseText.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
      const errorMessage = errorMatch ? 
        errorMatch[1].replace(/<br\s*\/?>/gi, '\n').trim() : 
        'Login failed. Please try again.';
      throw new Error(errorMessage);
    }
    
    // Handle error responses (non-2xx status codes)
    if (!response.ok) {
      // Check if the response has a message field
      const errorMessage = data?.message || 
                         (response.status === 401 ? 'Invalid email or password' : 
                          response.status === 400 ? 'Invalid request data' :
                          response.status === 403 ? 'Access denied' :
                          response.status === 404 ? 'User not found' :
                          response.statusText || 'Login failed');
      throw new Error(errorMessage);
    }
    
    // Handle successful login (2xx status code)
    if (data) {
      // The API might return the data directly or nested under a 'data' property
      const responseData = data.data || data;
      const { accessToken, refreshToken, user } = responseData;
      
      if (!accessToken || !user) {
        console.error('Invalid response format:', responseData);
        throw new Error('Invalid server response: Missing token or user data');
      }
      
      // Store tokens and user data in localStorage
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show success message
      toast.success('Login successful!');
      return true;
    }
    
    // If we get here, the response format is unexpected
    console.error('Unexpected response format:', data);
    throw new Error('Invalid server response format');
  } catch (error) {
    console.error('Login error:', error);
    
    // Clean up any partial login state
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Show appropriate error message
    let errorMessage = 'Failed to login. Please try again.';
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.message.includes('NetworkError')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message) {
      // Clean up any HTML tags from the error message
      errorMessage = error.message.replace(/<[^>]*>?/gm, '');
    }
    
    // Re-throw the error so the Login component can handle it
    throw new Error(errorMessage);
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${backendURL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    if (response?.status === 200) {
      toast.success("Registration Successful");
      return true;
    } 
    else 
    {
      const data = await response.json();
      toast.error(data?.message || "Registration Failed")
      return false;
    }
  } catch (error) {
    toast.error('Server Error');
    console.error(error);
    return false;
  }
};

export const isLoggedIn = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  
  // Optional: Add token expiration check if your tokens have exp claim
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      // Token expired
      logoutUser();
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error checking token:', e);
    return false;
  }
};

export const getMyProfile = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    const response = await fetch(`${backendURL}/users/getcurrentuser`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (response.status === 200) {
      return data.data;
    } 
    else 
    {
      return null;
    }
  } 
  catch (error) 
  {
    toast.error('Failed to Load Profile');
    return null;
  }
};

export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${backendURL}/users/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      toast.success("Logged out");
      return true;
    } else {
      toast.error('Failed to log out');
      return false;
    }
  } catch (error) {
    toast.error('Server Error');
    console.log(error);
    return false;
  }
};

export const updateUserAvatar = async (formData) => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${backendURL}/users/updateavatar`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (response.status === 200) {
      localStorage.setItem('user', JSON.stringify(data.data));
      toast.success("Avatar updated successfully");
      return true;
    } 
    else 
    {
      toast.error(data?.message || 'Failed to update avatar');
      return false;
    }
  } catch (error) {
    toast.error('Server Error');
    return false;
  }
};

export const refreshTokenService = async () => {
  try {
    const token=localStorage.getItem('refreshToken');
    if(!token)return;
    
    const response=await fetch(`${backendURL}/users/refresh-token`,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({refreshToken:token})
    });

    const data = await response.json();
    if (response.status === 200) {
      const {refreshToken,accessToken}=data.data;
      console.log("New RT-",refreshToken);
      console.log("New AT-",accessToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      return true;
    } 
    else 
    {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};