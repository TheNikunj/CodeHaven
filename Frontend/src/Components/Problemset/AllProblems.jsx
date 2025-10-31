import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getAllProblemsService } from '../../Services/Problem.service';
import { getSolvedProblemService } from '../../Services/Submissions.service';
import { isLoggedIn } from '../../Services/Auth.service';
import Loading from '../Loading/Loading';

const difficultyColors = {
  easy: 'bg-green-500 text-white',
  medium: 'bg-yellow-500 text-white',
  hard: 'bg-red-600 text-white'
};

const AllProblems = () => {
  const [solvedProblems, setSolvedProblems] = useState(new Set());
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First check if user is logged in
        const loggedIn = isLoggedIn();
        
        // Always try to fetch problems (they might be public)
        const problemsPromise = getAllProblemsService()
          .then(response => {
            if (response.success) {
              return Array.isArray(response.data) ? response.data : [];
            }
            throw new Error(response.message || 'Failed to load problems');
          });
        
        // Only fetch solved problems if user is logged in
        const solvedPromise = loggedIn 
          ? getSolvedProblemService()
              .then(response => {
                if (response?.success && Array.isArray(response.data)) {
                  return new Set(response.data);
                }
                return new Set();
              })
              .catch(err => {
                console.error('Error fetching solved problems:', err);
                return new Set();
              })
          : Promise.resolve(new Set());
        
        const [problemsData, solvedSet] = await Promise.all([
          problemsPromise,
          solvedPromise
        ]);
        
        setProblems(problemsData);
        setSolvedProblems(solvedSet);
        
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'Failed to load problems');
        
        // Only show toast for non-401 errors
        if (!err.message?.includes('401')) {
          toast.error(err.message || 'Failed to load problems');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this effect runs once on mount

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-800 text-white p-10">
        <div className="text-center text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">
          Problems
        </h1>
        
        <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {problems.length > 0 ? (
                problems.map((problem, index) => (
                  <tr 
                    key={problem._id || index}
                    onClick={() => navigate(`/problems/${problem._id}`, { 
                      state: { 
                        solved: solvedProblems.has(problem._id),
                        problemData: problem // Pass the entire problem data
                      } 
                    })}
                    className="hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-100">
                        {index + 1}. {problem.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span 
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          difficultyColors[problem.difficulty?.toLowerCase()] || 'bg-gray-500'
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {solvedProblems.has(problem._id) && (
                        <svg
                          className="h-5 w-5 text-green-500 mx-auto"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-400">
                    No problems found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllProblems;
