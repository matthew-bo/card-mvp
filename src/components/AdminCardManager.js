'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * @typedef {Object} Card
 * @property {string} id
 * @property {string} name
 * @property {string} issuer
 * @property {string} type
 * @property {Object} rewards
 * @property {boolean} isActive
 */

export const AdminCardManager = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState(null);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    const cardsSnap = await getDocs(collection(db, 'cards'));
    const cardsData = cardsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCards(cardsData);
    setLoading(false);
  };

  const handleUpdate = async (cardId, updates) => {
    try {
      await updateDoc(doc(db, 'cards', cardId), updates);
      await loadCards();
      setEditingCard(null);
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  const handleDelete = async (cardId) => {
    try {
      await deleteDoc(doc(db, 'cards', cardId));
      await loadCards();
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  if (loading) return <div>Loading cards...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Card Management</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issuer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cards.map((card) => (
              <tr key={card.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{card.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{card.issuer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{card.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {card.isActive ? 'Active' : 'Inactive'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => setEditingCard(card)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 