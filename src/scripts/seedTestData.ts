import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const seedTestData = async () => {
  try {
    // Add test expenses
    const expenses = [
      {
        amount: 120.50,
        category: 'dining',
        date: Timestamp.fromDate(new Date('2024-02-01')),
      },
      {
        amount: 450.75,
        category: 'travel',
        date: Timestamp.fromDate(new Date('2024-02-05')),
      },
      {
        amount: 85.25,
        category: 'grocery',
        date: Timestamp.fromDate(new Date('2024-02-08')),
      },
      {
        amount: 45.00,
        category: 'gas',
        date: Timestamp.fromDate(new Date('2024-02-10')),
      }
    ];

    console.log('Adding expenses...');
    for (const expense of expenses) {
      const docRef = await addDoc(collection(db, 'expenses'), expense);
      console.log('Added expense with ID: ', docRef.id);
    }

    // Add test user cards
    const userCards = [
      { cardId: 'chase-freedom-unlimited' },
      { cardId: 'citi-double-cash' }
    ];

    console.log('Adding user cards...');
    for (const card of userCards) {
      const docRef = await addDoc(collection(db, 'user-cards'), card);
      console.log('Added card with ID: ', docRef.id);
    }

    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
};

seedTestData();