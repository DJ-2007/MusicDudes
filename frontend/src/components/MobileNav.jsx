import React from 'react';
import { FaHome, FaSearch, FaPlus } from 'react-icons/fa';
import { BiLibrary } from 'react-icons/bi';
import './styles/SpotifyTheme.css';

export default function MobileNav({ onHomeClick, onSearchClick, onLibraryClick, activeTab = 'home' }) {
  return (
    <div className="spotify-mobile-nav">
      <button 
        className={`mobile-nav-btn ${activeTab === 'home' ? 'active' : ''}`} 
        onClick={onHomeClick}
      >
        <FaHome size={24} />
        <span>Home</span>
      </button>
      
      <button 
        className={`mobile-nav-btn ${activeTab === 'search' ? 'active' : ''}`} 
        onClick={onSearchClick}
      >
        <FaSearch size={24} />
        <span>Search</span>
      </button>
      
      <button 
        className={`mobile-nav-btn ${activeTab === 'library' ? 'active' : ''}`} 
        onClick={onLibraryClick}
      >
        <BiLibrary size={26} />
        <span>Your Library</span>
      </button>

      <button className="mobile-nav-btn" onClick={() => {}}>
        <FaPlus size={24} />
        <span>Create</span>
      </button>
    </div>
  );
}
