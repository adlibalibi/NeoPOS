import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

const UserProfile: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch user data when userId is available
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setProfileImage(data.photoURL || null);
        } else {
          // Create a default profile if none exists
          const defaultProfile = {
            name: auth.currentUser?.displayName || '',
            email: auth.currentUser?.email || '',
            photoURL: auth.currentUser?.photoURL || null,
            phone: '',
            language: 'en',
            timezone: 'ist',
            dateFormat: 'dmy'
          };
          
          setUserData(defaultProfile);
          if (auth.currentUser?.photoURL) {
            setProfileImage(auth.currentUser.photoURL);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        showNotification('Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setUserData((prevData: any) => ({ ...prevData, [id]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.includes('image/')) {
        showNotification('Please select an image file', 'error');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size should be less than 5MB', 'error');
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async () => {
    if (!userId || !imageFile) return null;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a storage reference with a unique name
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `profile-${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `users/${userId}/${fileName}`);
      
      // Upload file with progress monitoring
      const uploadTask = uploadBytesResumable(storageRef, imageFile);
      
      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Track upload progress
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setUploadProgress(progress);
          },
          (error) => {
            // Handle errors
            console.error("Upload failed:", error);
            reject(error);
          },
          async () => {
            // Upload completed successfully
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Image upload setup failed:", error);
      throw error;
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !userData) return;

    try {
      let photoURL = profileImage;

      // Upload image if there's a new one
      if (imageFile) {
        try {
          photoURL = await uploadProfileImage();
          setProfileImage(photoURL);
          setPreviewUrl(null);
          setImageFile(null);
        } catch (error) {
          console.error("Image upload failed:", error);
          showNotification('Failed to upload image. Please try again.', 'error');
          setIsUploading(false);
          return;
        }
      }

      // Update user data with new image URL
      const updatedUser = { ...userData, photoURL };

      // Save to Firestore
      await setDoc(doc(db, 'users', userId), updatedUser);
      setUserData(updatedUser);
      setIsEditing(false);
      setIsUploading(false);
      setUploadProgress(0);
      showNotification('Profile updated successfully!', 'success');
    } catch (err) {
      console.error("Error saving profile:", err);
      showNotification('Failed to update profile', 'error');
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPreviewUrl(null);
    setImageFile(null);
    setUploadProgress(0);
  };

  if (loading) {
    return (
      <div className="bg-[#f2f7fa] min-h-screen flex items-center justify-center">
        <div className="p-6 rounded-lg bg-white shadow-md">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-5 w-5 text-[#4f99ba]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="bg-[#f2f7fa] min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Please log in to view your profile</h2>
          <p className="text-gray-600">You need to be logged in to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f2f7fa] min-h-screen text-gray-800 relative">
      <Navbar />
      
      {/* Notification popup */}
      {showPopup && (
        <div className={`fixed top-6 right-6 px-6 py-3 rounded-md shadow-lg z-50 transition-all duration-300 ${
          popupType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {popupType === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
            <span>{popupMessage}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8 text-[#2d5d7b]">Your Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Image Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-center">
                <div className="relative w-40 h-40 mx-auto mb-6">
                  <div className="w-full h-full rounded-full bg-[#4f99ba]/10 overflow-hidden border-4 border-[#4f99ba]/20">
                    {(previewUrl || profileImage) ? (
                      <img 
                        src={previewUrl || profileImage || ''} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#4f99ba]">
                        <svg
                          width="70"
                          height="70"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-[#4f99ba] text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-[#3d7a95] transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <input 
                        id="profile-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold mb-1">{userData?.name || 'Your Name'}</h2>
                <p className="text-gray-500 mb-6">{userData?.email || 'email@example.com'}</p>
                
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-[#4f99ba] hover:bg-[#3d7a95] text-white py-3 px-6 rounded-lg transition duration-300 font-medium"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-y-3">
                    {isUploading && (
                      <div className="mb-4">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#4f99ba] rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Uploading: {uploadProgress}%</p>
                      </div>
                    )}
                    
                    <button
                      onClick={handleSave}
                      disabled={isUploading}
                      className="w-full bg-[#4f99ba] hover:bg-[#3d7a95] text-white py-3 px-6 rounded-lg transition duration-300 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </div>
                      ) : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg transition duration-300 font-medium hover:bg-gray-50"
                      disabled={isUploading}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Image upload guide */}
                {isEditing && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
                    <h4 className="font-medium text-blue-800 mb-2">Upload Tips:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Max file size: 5MB</li>
                      <li>• Supported formats: JPG, PNG, GIF</li>
                      <li>• Square images work best</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave(e);
              }}>
                {/* Personal Info Section */}
                <section className="mb-8">
                  <h3 className="text-xl font-semibold mb-6 flex items-center text-[#2d5d7b]">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        value={userData?.name || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f99ba] focus:border-transparent transition"
                        placeholder="Full Name"
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        value={userData?.email || ''}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                        placeholder="Email"
                        disabled
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        value={userData?.phone || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f99ba] focus:border-transparent transition"
                        placeholder="Phone Number"
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
                      <select
                        id="language"
                        value={userData?.language || 'en'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f99ba] focus:border-transparent transition"
                        disabled={!isEditing}
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="ta">Tamil</option>
                        <option value="te">Telugu</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Preferences Section */}
                <section>
                  <h3 className="text-xl font-semibold mb-6 flex items-center text-[#2d5d7b]">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Account Preferences
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                      <select
                        id="timezone"
                        value={userData?.timezone || 'ist'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f99ba] focus:border-transparent transition"
                        disabled={!isEditing}
                      >
                        <option value="ist">Indian Standard Time (IST)</option>
                        <option value="pst">Pacific Standard Time (PST)</option>
                        <option value="est">Eastern Standard Time (EST)</option>
                        <option value="gmt">Greenwich Mean Time (GMT)</option>
                        <option value="cet">Central European Time (CET)</option>
                        <option value="jst">Japan Standard Time (JST)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                      <select
                        id="dateFormat"
                        value={userData?.dateFormat || 'dmy'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f99ba] focus:border-transparent transition"
                        disabled={!isEditing}
                      >
                        <option value="dmy">DD/MM/YYYY</option>
                        <option value="mdy">MM/DD/YYYY</option>
                        <option value="ymd">YYYY/MM/DD</option>
                      </select>
                    </div>
                  </div>
                </section>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;