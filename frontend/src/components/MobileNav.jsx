import React from 'react';
import { FaHome, FaSearch, FaList } from 'react-icons/fa';
import './styles/SpotifyTheme.css';

export default function MobileNav({ onHomeClick, onSearchClick, onLibraryClick, activeTab = 'home' }) {
  return (
    <div className="spotify-mobile-nav">
      <button 
        className={`mobile-nav-btn ${activeTab === 'home' ? 'active' : ''}`} 
        onClick={onHomeClick}
      >
        <FaHome size={22} />
        <span>Home</span>
      </button>
      
      <button 
        className={`mobile-nav-btn ${activeTab === 'search' ? 'active' : ''}`} 
        onClick={onSearchClick}
      >
        <FaSearch size={22} />
        <span>Search</span>
      </button>
      
      <button 
        className={`mobile-nav-btn ${activeTab === 'library' ? 'active' : ''}`} 
        onClick={onLibraryClick}
      >
        <FaList size={22} />
        <span>Your Library</span>
      </button>
    </div>
  );
}
