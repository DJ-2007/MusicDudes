import React from 'react';
import { FaHome, FaSearch, FaPlus, FaSpotify } from 'react-icons/fa';
import { BiLibrary } from 'react-icons/bi';
import './styles/SpotifyTheme.css';

export default function MobileNav({
  onHomeClick,
  onSearchClick,
  onLibraryClick,
  onPremiumClick,
  onCreateClick,
  activeTab = 'home'
}) {
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
        <BiLibrary size={24} />
        <span>Your Library</span>
      </button>

      <button 
        className={`mobile-nav-btn ${activeTab === 'premium' ? 'active' : ''}`} 
        onClick={onPremiumClick}
      >
        <FaSpotify size={22} />
        <span>Premium</span>
      </button>

      <button 
        className={`mobile-nav-btn ${activeTab === 'create' ? 'active' : ''}`} 
        onClick={onCreateClick}
      >
        <FaPlus size={22} />
        <span>Create</span>
      </button>
    </div>
  );
}
