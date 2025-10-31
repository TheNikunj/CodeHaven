import PropTypes from 'prop-types';

function Description({ problem }) {
    // Debug logging with full object
    console.log('Raw problem data in Description component:', problem);
    
    if (!problem) {
        return (
            <div className="text-yellow-500 p-4 text-center">
                <p>⚠️ No problem data available.</p>
                <p>Please try refreshing the page or select another problem.</p>
            </div>
        );
    }
    
    // Extract the data we need from the problem object
    const {
        title = 'Untitled Problem',
        description = '',
        content = '',
        difficulty = 'Medium',
        examples = [],
        constraints = [],
        hints = [],
        tags = [],
        acceptance = '0%',
        likes = 0,
        dislikes = 0,
        isPremium = false,
        followUp = ''
    } = problem.data?.data || problem.data || problem;
    
    // Combine description and content
    const problemContent = description || content || '';
    
    // Format like/dislike count
    const formatCount = (num) => {
        if (num === undefined || num === null) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };
    
    // Safely render markdown content
    const renderMarkdown = (text) => {
        if (!text) return null;
        
        // Simple markdown to HTML conversion for common patterns
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 rounded">$1</code>'); // Inline code
            
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };
    
    // Helper to render a section with title and content
    const renderSection = (title, content, isCode = false, isConstraints = false) => {
        if ((!content || (Array.isArray(content) && content.length === 0)) && !isConstraints) return null;
        
        return (
            <div className="mb-6 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <h2 className="text-xl font-bold bg-gray-900 px-4 py-3 border-b border-gray-700">
                    {title}
                </h2>
                <div className={`p-4 ${isCode ? 'bg-gray-900 font-mono text-sm overflow-x-auto' : ''}`}>
                    {isCode ? (
                        <pre className="whitespace-pre-wrap">{content}</pre>
                    ) : isConstraints ? (
                        !content || content.length === 0 ? (
                            <p className="text-gray-400 italic">No constraints provided.</p>
                        ) : (
                            <ul className="list-disc pl-5 space-y-2">
                                {content.map((constraint, index) => (
                                    <li key={index} className="text-gray-300">
                                        {constraint}
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : (
                        <div className="prose prose-invert max-w-none">
                            {renderMarkdown(content)}
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    // Render examples
    const renderExamples = (examples) => {
        if (!examples || examples.length === 0) {
            return <p className="text-gray-400 italic">No examples provided.</p>;
        }

        return examples.map((example, index) => (
            <div key={index} className="mb-6">
                <div className="flex items-center px-4 py-2 bg-gray-900 rounded-t-lg border border-gray-700">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <h3 className="text-sm font-semibold text-gray-300">
                        Example {index + 1}
                    </h3>
                </div>
                <div className="p-4 space-y-4 bg-gray-800 rounded-b-lg border border-t-0 border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">Input:</p>
                            <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto border border-gray-700">
                                <code>{example.input || 'No input provided'}</code>
                            </pre>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">Output:</p>
                            <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto border border-gray-700">
                                <code>{example.output || 'No output provided'}</code>
                            </pre>
                        </div>
                    </div>
                    {example.explanation && (
                        <div className="text-sm text-gray-300 bg-blue-900 bg-opacity-20 p-3 rounded border-l-4 border-blue-500">
                            <div className="font-medium text-blue-300 mb-1">Explanation</div>
                            <div className="prose prose-invert max-w-none">
                                {renderMarkdown(example.explanation)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ));
    };
    
    // Render problem header
    const renderProblemHeader = () => (
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
            <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    difficulty === 'Easy' ? 'bg-green-900 text-green-300' :
                    difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                }`}>
                    {difficulty}
                </span>
                <span className="text-gray-400 text-sm">
                    Acceptance: <span className="text-white">{acceptance}</span>
                </span>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center text-green-400">
                        <span className="text-sm">👍 {formatCount(likes)}</span>
                    </div>
                    <div className="flex items-center text-red-400 ml-2">
                        <span className="text-sm">👎 {formatCount(dislikes)}</span>
                    </div>
                </div>
                {isPremium && (
                    <span className="text-yellow-400 text-sm">
                        🔒 Premium
                    </span>
                )}
            </div>
            {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-200">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
    
    // Render hints
    const renderHints = () => {
        if (!hints || hints.length === 0) return null;
        
        return (
            <div className="space-y-3">
                {hints.map((hint, index) => (
                    <div key={index} className="flex items-start bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <div className="prose prose-invert max-w-none">
                            {renderMarkdown(hint)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    
    return (
        <div className="text-gray-200">
            {renderProblemHeader()}

            {/* Problem Description */}
            {problemContent ? (
                renderSection('Description', problemContent)
            ) : (
                <div className="text-yellow-400 p-4 bg-gray-800 rounded-lg mb-6">
                    <p>No description available for this problem.</p>
                </div>
            )}
            
            {/* Examples */}
            {examples.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-3 text-white">Examples</h2>
                    {renderExamples(examples)}
                </div>
            )}

            {/* Constraints */}
            {constraints.length > 0 && (
                renderSection('Constraints', constraints, false, true)
            )}

            {/* Hints */}
            {hints.length > 0 && (
                renderSection('Hints', renderHints())
            )}

            {/* Follow-up */}
            {followUp && (
                <div className="mt-6 p-4 bg-blue-900 bg-opacity-20 border-l-4 border-blue-500 rounded-r">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2">Follow-up</h3>
                    <div className="prose prose-invert max-w-none">
                        {renderMarkdown(followUp)}
                    </div>
                </div>
            )}
        </div>
    );
}

Description.propTypes = {
    problem: PropTypes.shape({
        data: PropTypes.oneOfType([
            PropTypes.shape({
                data: PropTypes.shape({
                    title: PropTypes.string,
                    description: PropTypes.string,
                    content: PropTypes.string,
                    difficulty: PropTypes.string,
                    examples: PropTypes.arrayOf(PropTypes.shape({
                        input: PropTypes.string,
                        output: PropTypes.string,
                        explanation: PropTypes.string
                    })),
                    constraints: PropTypes.arrayOf(PropTypes.string),
                    hints: PropTypes.arrayOf(PropTypes.string),
                    tags: PropTypes.arrayOf(PropTypes.string),
                    acceptance: PropTypes.string,
                    likes: PropTypes.number,
                    dislikes: PropTypes.number,
                    isPremium: PropTypes.bool,
                    followUp: PropTypes.string
                })
            }),
            PropTypes.shape({
                title: PropTypes.string,
                description: PropTypes.string,
                content: PropTypes.string,
                difficulty: PropTypes.string,
                examples: PropTypes.arrayOf(PropTypes.shape({
                    input: PropTypes.string,
                    output: PropTypes.string,
                    explanation: PropTypes.string
                })),
                constraints: PropTypes.arrayOf(PropTypes.string),
                hints: PropTypes.arrayOf(PropTypes.string),
                tags: PropTypes.arrayOf(PropTypes.string),
                acceptance: PropTypes.string,
                likes: PropTypes.number,
                dislikes: PropTypes.number,
                isPremium: PropTypes.bool,
                followUp: PropTypes.string
            })
        ])
    })
};

export default Description;
