import React, { useState } from 'react';
import PropTypes from 'prop-types';

function Solution({ solution }) {
  // Ensure solution is always an object
  const safeSolution = solution || {};
    const [openSolution, setOpenSolution] = useState(null);
    
    const toggleSolution = (lang) => {
        setOpenSolution((prev) => (prev === lang ? null : lang));
    };

    // Return early if no solutions
    if (Object.keys(safeSolution).length === 0) {
        return (
            <div className="bg-gray-700 rounded-xl p-4 text-center text-gray-300">
                No solutions available.
            </div>
        );
    }

    return (
        <div className='bg-gray-700 rounded-xl'>
            <div className="space-y-4 p-4 to-gray-800 rounded-lg shadow-lg">
                {Object.keys(safeSolution).map((lang, index) => (
                    <div key={index} className="border-l-4 border-yellow-500 px-4 py-1 bg-gray-900 rounded-lg">
                        <p 
                            className="cursor-pointer text-yellow-500 font-bold text-lg mb-2 p-4 flex justify-between items-center"
                            onClick={() => toggleSolution(lang)}
                        >
                            {lang.toUpperCase()} Solution
                            <span className={`transform ${openSolution === lang ? 'rotate-180' : ''}`}>
                                {openSolution === lang ? '▲' : '▼'}
                            </span>
                        </p>
                        {openSolution === lang && (
                            <pre className="p-4 bg-black text-yellow-100 rounded-lg overflow-auto">
                                {safeSolution[lang]}
                            </pre>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

Solution.propTypes = {
  solution: PropTypes.oneOfType([
    PropTypes.shape({
      // This will validate that solution is an object with string values
      // but won't require any specific keys
    }),
    PropTypes.oneOf([undefined, null])
  ])
};

// Set default props to ensure solution is always an object
export default Solution;
