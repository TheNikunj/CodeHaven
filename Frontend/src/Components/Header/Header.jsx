import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

const Header = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    try {
      const localUser = localStorage.getItem('user');
      if (localUser) {
        setUser(JSON.parse(localUser));
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
    }

    // Listen for storage changes to update user state
    const handleStorageChange = () => {
      const localUser = localStorage.getItem('user');
      setUser(localUser ? JSON.parse(localUser) : null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const navLinkClass = (isActive) => 
    `text-xl transition duration-300 ${
      isActive 
        ? 'text-yellow-500 font-bold underline underline-offset-8' 
        : 'text-gray-300 hover:text-yellow-500'
    }`;

  return (
    <header className="bg-gray-900 text-white shadow-lg pb-1">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        <NavLink to="/" className="flex items-center">
          <img 
            src="/logoicon.png" 
            alt="Logo" 
            className="w-10 h-auto mr-3" 
          />
          <span className="text-2xl font-bold text-yellow-500 underline underline-offset-8">
            CodeHaven
          </span>
        </NavLink>

        <nav className="flex space-x-8">
          {['/', '/problems', '/discuss', '/join-interview', '/host-interview'].map((path) => (
            <NavLink 
              key={path}
              to={path}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              {path === '/' ? 'Home' : path.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ').substring(1)}
            </NavLink>
          ))}
        </nav>

        {user ? (
          <Link to="/profile" className="flex items-center space-x-3">
            <img 
              src={user?.avatar || '/defaultuser.png'} 
              alt="User" 
              className="w-10 h-10 rounded-full border-2 border-yellow-500 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/defaultuser.png';
              }}
            />
            <span className="text-lg font-semibold text-gray-300">
              {user.username || 'User'}
            </span>
          </Link>
        ) : (
          <div className="flex items-center space-x-4">
            <NavLink 
              to="/login" 
              className="text-lg text-white bg-blue-600 hover:bg-yellow-500 transition duration-300 py-2 px-4 rounded-md shadow-md"
            >
              Login
            </NavLink>
            <NavLink 
              to="/register" 
              className="text-lg text-white bg-blue-600 hover:bg-yellow-500 transition duration-300 py-2 px-4 rounded-md shadow-md"
            >
              Register
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
