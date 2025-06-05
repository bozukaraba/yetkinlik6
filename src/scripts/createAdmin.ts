import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');
    
    const adminEmail = 'yetkinlikxadmin@turksat.com.tr';
    const adminPassword = 'TkSat2024!@Admin#CV';
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    
    // Update display name
    await updateProfile(userCredential.user, {
      displayName: 'Yetkinlikx Admin'
    });

    console.log('Admin user created in auth:', userCredential.user.uid);

    // Insert into users collection
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDocRef, {
      id: userCredential.user.uid,
      email: adminEmail,
      name: 'Yetkinlikx Admin',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('UID:', userCredential.user.uid);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Run the script
createAdminUser(); 