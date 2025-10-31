import { toast } from 'react-hot-toast';

const backendURL = import.meta.env.VITE_BACKEND_URL;

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  // Check if the response is JSON
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } else {
    // Handle non-JSON response (like HTML error pages)
    const text = await response.text();
    console.error('Non-JSON response received:', text.substring(0, 200)); // Log first 200 chars
    throw new Error(`Server returned ${response.status} ${response.statusText}`);
  }
};

export const getAllProblemsService = async () => {
  try {
    const response = await fetch(`${backendURL}/problem`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      credentials: 'include'
    });

    const data = await handleResponse(response);
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return { success: true, data, message: 'Problems retrieved successfully' };
    }
    
    if (data && data.success !== undefined) {
      return data;
    }

    return { 
      success: true, 
      data: data.data || [], 
      message: 'Problems retrieved successfully' 
    };
  } catch (error) {
    console.error('Error in getAllProblemsService:', error);
    toast.error(error.message || 'Failed to fetch problems');
    return { 
      success: false, 
      data: [], 
      message: error.message || 'Failed to fetch problems' 
    };
  }
};

export const getProblemService = async (id) => {
  try {
    const response = await fetch(`${backendURL}/problem/${id}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      credentials: 'include'
    });

    const data = await handleResponse(response);
    return { 
      success: true, 
      data: data.data || data, 
      message: 'Problem retrieved successfully' 
    };
  } catch (error) {
    console.error('Error in getProblemService:', error);
    toast.error(error.message || 'Failed to fetch problem');
    return { 
      success: false, 
      data: null, 
      message: error.message || 'Failed to fetch problem' 
    };
  }
};

export const updatedefaultlangService = async (lang) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${backendURL}/users/updatedefaultlang/${lang}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    await handleResponse(response);
    return { success: true, message: 'Default language updated successfully' };
  } catch (error) {
    console.error('Error in updatedefaultlangService:', error);
    toast.error(error.message || 'Failed to update default language');
    return { 
      success: false, 
      message: error.message || 'Failed to update default language' 
    };
  }
};

export const updateTemplateService = async (lang, userData) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${backendURL}/users/updatetemplate/${lang}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include'
    });

    await handleResponse(response);
    toast.success('Template updated successfully');
    return { success: true, message: 'Template updated successfully' };
  } catch (error) {
    console.error('Error in updateTemplateService:', error);
    toast.error(error.message || 'Failed to update template');
    return { 
      success: false, 
      message: error.message || 'Failed to update template' 
    };
  }
};

export const getdefaultlangtempService = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('No token found, returning default values');
      return null; // Return null to trigger default values in the component
    }

    const response = await fetch(`${backendURL}/users/getdeflangandtemplate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.log('Unauthorized, clearing token');
      localStorage.removeItem('accessToken');
      return null; // Return null to trigger default values
    }

    // Handle non-200 responses
    if (!response.ok) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }

    const data = await response.json().catch(() => ({}));
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }

    // Extract the actual data (handle both { data: {...} and direct response formats)
    const responseData = data.data || data;
    
    // Ensure we have required fields
    if (!responseData.template || !responseData.default_language) {
      console.warn('Incomplete response data, using defaults');
      return null; // Return null to trigger default values
    }

    return responseData;
    
  } catch (error) {
    console.error('Error in getdefaultlangtempService:', error);
    return null; // Return null to trigger default values in the component
  }
};
