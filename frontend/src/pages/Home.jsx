import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import '../styles/Home.scss';

export default function Home() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="home">
      <h1>Store, preview, and find your media in one place</h1>
      <p>Upload images, videos, audio, and PDFs. Search by name or tag, ranked by relevance.</p>
      <Link to={user ? '/dashboard' : '/register'} className="home__cta">
        {user ? 'Go to dashboard' : 'Get started'}
      </Link>
    </div>
  );
}
