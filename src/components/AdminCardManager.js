'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/components/NotificationProvider';
import { fetchAllCards, fetchCardById } from '@/services/cardApiService';
import { isAdmin } from '@/utils/adminConfig';

/**
 * @typedef {Object} Card
 * @property {string} id
 * @property {string} name
 * @property {string} issuer
 * @property {string} type
 * @property {Object} rewards
 * @property {boolean} isActive
 */

const AdminCardManager = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const allCards = await fetchAllCards();
        setCards(allCards);
      } catch (err) {
        setError('Failed to load cards');
        showNotification('Error loading cards', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user && isAdmin(user)) {
      loadCards();
    }
  }, [user, showNotification]);

  if (!user || !isAdmin(user)) {
    return null;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="admin-card-manager">
      <h2>Card Management</h2>
      <div className="card-list">
        {cards.map((card) => (
          <div key={card.id} className="card-item">
            <h3>{card.name}</h3>
            <p>{card.description}</p>
            {/* Add more card details and management options here */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCardManager; 