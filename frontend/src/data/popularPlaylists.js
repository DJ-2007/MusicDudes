// Curated Popular Spotify Playlists & Featured Content

export const POPULAR_PLAYLISTS = [
  {
    name: 'Hit Songs English',
    subtitle: 'Curated • Top Global Hits',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500',
    type: 'Playlist',
    isPinned: true,
    songs: [
      { id: 'eng-1', videoId: 'qod03PVTLqk', title: 'Cold Heart (PNAU Remix)', artist: 'Elton John & Dua Lipa', duration: 202, thumbnail: 'https://img.youtube.com/vi/qod03PVTLqk/hqdefault.jpg' },
      { id: 'eng-2', videoId: '34Na4j8AVgA', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', duration: 230, thumbnail: 'https://img.youtube.com/vi/34Na4j8AVgA/hqdefault.jpg' },
      { id: 'eng-3', videoId: 'H5v3kku4y6Q', title: 'As It Was', artist: 'Harry Styles', duration: 167, thumbnail: 'https://img.youtube.com/vi/H5v3kku4y6Q/hqdefault.jpg' },
      { id: 'eng-4', videoId: 'TUVcZfQe-Kw', title: 'Levitating', artist: 'Dua Lipa', duration: 203, thumbnail: 'https://img.youtube.com/vi/TUVcZfQe-Kw/hqdefault.jpg' },
    ]
  },
  {
    name: 'Same Beef & Punjabi Hits',
    subtitle: 'Curated • Bohemia, Sidhu Moose Wala',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
    type: 'Playlist',
    isPinned: true,
    songs: [
      { id: 'pun-1', videoId: '9xVp8m0n65I', title: 'Same Beef', artist: 'Bohemia & Sidhu Moose Wala', duration: 255, thumbnail: 'https://img.youtube.com/vi/9xVp8m0n65I/hqdefault.jpg' },
      { id: 'pun-2', videoId: 'cWMxCE248B0', title: 'Softly', artist: 'Karan Aujla', duration: 154, thumbnail: 'https://img.youtube.com/vi/cWMxCE248B0/hqdefault.jpg' },
      { id: 'pun-3', videoId: 'vX2cDW8LUWk', title: 'Excuses', artist: 'AP Dhillon & Gurinder Gill', duration: 176, thumbnail: 'https://img.youtube.com/vi/vX2cDW8LUWk/hqdefault.jpg' },
      { id: 'pun-4', videoId: 'n_FCrCQ6UT5', title: '295', artist: 'Sidhu Moose Wala', duration: 270, thumbnail: 'https://img.youtube.com/vi/n_FCrCQ6UT5/hqdefault.jpg' },
    ]
  },
  {
    name: 'Mind Relaxing Music 2026',
    subtitle: 'Playlist • Chill Vibes',
    cover: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500',
    type: 'Playlist',
    songs: [
      { id: 'chill-1', videoId: '2OEL4P1rub0', title: 'Mind Relaxing Rain & Flute', artist: 'Peaceful Chill', duration: 300, thumbnail: 'https://img.youtube.com/vi/2OEL4P1rub0/hqdefault.jpg' },
      { id: 'chill-2', videoId: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Beats to Relax', artist: 'Lofi Girl', duration: 240, thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg' },
    ]
  },
  {
    name: 'Morning peace 🕊️✌️',
    subtitle: 'Playlist • Soft & Peaceful',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
    type: 'Playlist',
    isPinned: false,
    songs: [
      { id: 'morn-1', videoId: 'V7LwfY5U_BU', title: 'Ranjha (From "Shershaah")', artist: 'Jasleen Royal, B Praak', duration: 228, thumbnail: 'https://img.youtube.com/vi/V7LwfY5U_BU/hqdefault.jpg' },
      { id: 'morn-2', videoId: 'BddP6PYo2gs', title: 'Kesariya', artist: 'Arijit Singh', duration: 268, thumbnail: 'https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg' },
    ]
  },
  {
    name: 'Sampoorna Geeta Saar 🕉️',
    subtitle: 'Podcast • Divine Audiobooks',
    cover: 'https://images.unsplash.com/photo-1609102026400-340363e8a931?w=500',
    type: 'Podcast',
    songs: [
      { id: 'geeta-1', videoId: '2v8K4T1d7yU', title: 'Sampoorna Geeta Saar - Main Verses', artist: 'Spiritual Discourses', duration: 360, thumbnail: 'https://img.youtube.com/vi/2v8K4T1d7yU/hqdefault.jpg' },
    ]
  },
  {
    name: 'Bharat Ke Aslee Superheroes',
    subtitle: 'Podcast • Spotify Studios',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500',
    type: 'Podcast',
    songs: [
      { id: 'hero-1', videoId: '3x4v5b6c7y8', title: 'Unsung Heroes of India', artist: 'Spotify Originals', duration: 420, thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500' },
    ]
  }
];

export const POPULAR_START_LISTENING = [
  {
    id: 'start-1',
    videoId: 'V7LwfY5U_BU',
    title: 'Ranjha (From "Shershaah")',
    artist: 'Jasleen Royal, B Praak, Romy',
    duration: 228,
    thumbnail: 'https://img.youtube.com/vi/V7LwfY5U_BU/hqdefault.jpg',
    liked: true,
  },
  {
    id: 'start-2',
    videoId: '9xVp8m0n65I',
    title: 'Same Beef',
    artist: 'Bohemia, Sidhu Moose Wala',
    duration: 255,
    thumbnail: 'https://img.youtube.com/vi/9xVp8m0n65I/hqdefault.jpg',
    liked: true,
  },
  {
    id: 'start-3',
    videoId: 'qod03PVTLqk',
    title: 'Cold Heart - PNAU Remix',
    artist: 'Elton John, Dua Lipa, PNAU',
    duration: 202,
    thumbnail: 'https://img.youtube.com/vi/qod03PVTLqk/hqdefault.jpg',
    liked: false,
  },
  {
    id: 'start-4',
    videoId: 'n_FCrCQ6UT5',
    title: '295',
    artist: 'Sidhu Moose Wala',
    duration: 270,
    thumbnail: 'https://img.youtube.com/vi/n_FCrCQ6UT5/hqdefault.jpg',
    liked: true,
  },
  {
    id: 'start-5',
    videoId: 'BddP6PYo2gs',
    title: 'Kesariya',
    artist: 'Arijit Singh, Pritam',
    duration: 268,
    thumbnail: 'https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg',
    liked: false,
  },
  {
    id: 'start-6',
    videoId: 'cWMxCE248B0',
    title: 'Softly',
    artist: 'Karan Aujla',
    duration: 154,
    thumbnail: 'https://img.youtube.com/vi/cWMxCE248B0/hqdefault.jpg',
    liked: true,
  }
];
