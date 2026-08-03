import React from 'react';
import { FaSearch, FaPlus, FaListUl } from 'react-icons/fa';
import { BiLibrary } from 'react-icons/bi';
import './styles/SpotifyTheme.css';

export default function MobileNav({
  onSearchClick,
  onLibraryClick,
  onQueueClick,
  onCreateClick,
  activeTab = 'library'
}) {
  return (
    <div className="spotify-mobile-nav">
      <button 
        className={`mobile-nav-btn ${activeTab === 'library' ? 'active' : ''}`} 
        onClick={onLibraryClick}
      >
        <BiLibrary size={24} />
        <span>Library</span>
      </button>
      
      <button 
        className={`mobile-nav-btn ${activeTab === 'search' ? 'active' : ''}`} 
        onClick={onSearchClick}
      >
        <FaSearch size={22} />
        <span>Search</span>
      </button>

      <button 
        className={`mobile-nav-btn ${activeTab === 'queue' ? 'active' : ''}`} 
        onClick={onQueueClick}
      >
        <FaListUl size={22} />
        <span>Queue</span>
      </button>
    </div>
  );
}
