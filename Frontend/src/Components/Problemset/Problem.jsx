import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import Loading from '../Loading/Loading.jsx';
import { getProblemService } from '../../Services/Problem.service.js';
import Solution from './Solution.jsx';
import Description from './Description.jsx';
import DiscussProblem from './DiscussProblem.jsx';
import EditorBox from '../Editor/EditorBox.jsx';
import Submissions from '../Submission/Submissions.jsx';

const DIFFICULTY_COLORS = {
    easy: 'bg-green-500 text-white',
    medium: 'bg-yellow-500 text-white',
    hard: 'bg-red-600 text-white'
};

const TAB_OPTIONS = {
    DESCRIPTION: 'description',
    SOLUTION: 'solution',
    DISCUSS: 'discuss',
    SUBMISSIONS: 'submissions'
};

const Problem = () => {
    const { id } = useParams();
    const location = useLocation();
    const { solved, problem: initialProblem } = location.state || {};
    
    const [problem, setProblem] = useState(initialProblem || null);
    const [isLoading, setIsLoading] = useState(!initialProblem);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(TAB_OPTIONS.DESCRIPTION);

    const fetchProblem = useCallback(async () => {
        if (!id) return;
        
        try {
            setIsLoading(true);
            const response = await getProblemService(id);
            
            if (response?.success && response.data) {
                setProblem(response.data);
            } else {
                throw new Error(response?.message || 'Failed to load problem');
            }
        } catch (err) {
            console.error('Error fetching problem:', err);
            setError(err.message || 'Failed to load problem');
            toast.error(err.message || 'Failed to load problem');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!initialProblem) {
            fetchProblem();
        }
    }, [fetchProblem, initialProblem]);

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    const renderTabContent = useMemo(() => {
        if (isLoading) return <Loading />;
        if (error) return <div className="text-red-500 p-4">{error}</div>;
        if (!problem) return <div className="text-gray-400 p-4">Problem not found</div>;
        
        switch (activeTab) {
            case TAB_OPTIONS.SOLUTION:
                return <Solution solution={problem.solution} />;
            case TAB_OPTIONS.DISCUSS:
                return <DiscussProblem id={id} />;
            case TAB_OPTIONS.SUBMISSIONS:
                return <Submissions problem_id={id} displayproblem={false} />;
            case TAB_OPTIONS.DESCRIPTION:
            default:
                return (
                    <div className="prose prose-invert max-w-none">
                        <Description problem={problem} />
                    </div>
                );
        }
    }, [activeTab, error, id, isLoading, problem]);

    // Default values for when problem data is not available
    const displayProblem = problem || {
        title: "Two Sum",
        difficulty: "easy",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        test_cases: [
            {
                input: "[2,7,11,15]\n9",
                output: "[0,1]"
            },
            {
                input: "[3,2,4]\n6",
                output: "[1,2]"
            },
            {
                input: "[3,3]\n6",
                output: "[0,1]"
            }
        ]
    };

    return (
        <div className="min-h-screen bg-gray-800 text-white flex p-8">
            <div className="w-1/2 min-h-screen p-7 bg-gray-900 rounded-lg mr-3">
                <div className='flex justify-between bg-gray-900 pb-4 border-b-2 border-gray-700 mb-4'>
                    <div className="flex" role="tablist" aria-label="Problem navigation">
                        {Object.values(TAB_OPTIONS).map((value) => (
                            <button
                                key={value}
                                className={`mx-2 px-4 py-2 font-semibold rounded-lg focus:outline-none transition duration-300 ${
                                    activeTab === value 
                                        ? 'bg-yellow-500 text-white shadow-lg' 
                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                }`}
                                onClick={() => handleTabChange(value)}
                                role="tab"
                                aria-selected={activeTab === value}
                                aria-controls={`${value}-tab`}
                                id={`${value}-tab-btn`}
                            >
                                {value.charAt(0).toUpperCase() + value.slice(1)}
                            </button>
                        ))}
                    </div>
                    
                    {solved && (
                        <div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 bg-black rounded-full"
                                viewBox="0 0 20 20"
                                fill="green"
                                aria-label="Solved"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 4.707 7.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    )}
                </div>

                <h1 className="text-4xl font-semibold mb-4">{displayProblem.title}</h1>
                <div className="flex items-center mb-4">
                    <span 
                        className={`text-sm font-semibold px-4 py-1 rounded ${
                            DIFFICULTY_COLORS[displayProblem.difficulty] || 'bg-gray-500'
                        }`}
                        aria-label={`Difficulty: ${displayProblem.difficulty}`}
                    >
                        {displayProblem.difficulty}
                    </span>
                </div>

                <div role="tabpanel" id={`${activeTab}-tab`} aria-labelledby={`${activeTab}-tab-btn`}>
                    {renderTabContent}
                </div>
            </div>

            <div className="w-1/2 min-h-screen p-7 bg-gray-900 ml-3 rounded-lg">
                <EditorBox problem={displayProblem} />
            </div>
        </div>
    );
}

Problem.propTypes = {
    location: PropTypes.shape({
        state: PropTypes.shape({
            solved: PropTypes.bool,
            problem: PropTypes.object
        })
    })
};

export default Problem;
