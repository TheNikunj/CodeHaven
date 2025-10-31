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
    console.error('Non-JSON response received:', text.substring(0, 200));
    throw new Error(`Server returned ${response.status} ${response.statusText}`);
  }
};

export const getSubmissionService = async (problem_id) => {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${backendURL}/submissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ problem_id }),
            credentials: 'include'
        });
        
        const data = await handleResponse(response);
        return data.data || [];
    } catch (error) {
        console.error('Error in getSubmissionService:', error);
        toast.error(error.message || 'Failed to fetch submissions');
        return [];
    }
};

export const getSolvedProblemService = async () => {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            // If no token, return empty array (user not logged in)
            return [];
        }
        
        const response = await fetch(`${backendURL}/submissions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        // If 401, the token might be expired or invalid
        if (response.status === 401) {
            // Clear invalid token
            localStorage.removeItem('accessToken');
            return [];
        }
        
        const data = await handleResponse(response);
        return data.data || [];
    } catch (error) {
        console.error('Error in getSolvedProblemService:', error);
        // Don't show error toast for 401 (unauthorized) as it's expected when not logged in
        if (!error.message.includes('401')) {
            toast.error(error.message || 'Failed to fetch solved problems');
        }
        return [];
    }
};