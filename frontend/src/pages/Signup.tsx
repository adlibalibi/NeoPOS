import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/firebase/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

const db = getFirestore();

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    language: 'en',
    timezone: 'ist',
    dateFormat: 'dmy',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
  
      await setDoc(doc(db, "users", user.uid), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        language: form.language,
        timezone: form.timezone,
        dateFormat: form.dateFormat,
        createdAt: new Date().toISOString(),
      });
  
      alert("Account created!");
      navigate("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      alert(err.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f7fa]">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center">Create Your Account</h2>

        <input id="name" placeholder="Full Name" value={form.name} onChange={handleChange} required
          className="w-full mb-4 p-3 border rounded" />
        <input id="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required
          className="w-full mb-4 p-3 border rounded" />
        <input id="phone" type="tel" placeholder="Phone Number" value={form.phone} onChange={handleChange}
          className="w-full mb-4 p-3 border rounded" />
        <input id="password" type="password" placeholder="Password" value={form.password} onChange={handleChange}
          required className="w-full mb-4 p-3 border rounded" />

        <select id="language" value={form.language} onChange={handleChange} className="w-full mb-4 p-3 border rounded">
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="ta">Tamil</option>
          <option value="te">Telugu</option>
        </select>

        <select id="timezone" value={form.timezone} onChange={handleChange} className="w-full mb-4 p-3 border rounded">
          <option value="ist">IST</option>
          <option value="pst">PST</option>
          <option value="est">EST</option>
          <option value="gmt">GMT</option>
        </select>

        <select id="dateFormat" value={form.dateFormat} onChange={handleChange} className="w-full mb-6 p-3 border rounded">
          <option value="dmy">DD/MM/YYYY</option>
          <option value="mdy">MM/DD/YYYY</option>
          <option value="ymd">YYYY/MM/DD</option>
        </select>

        <button type="submit" className="w-full bg-[#4f99ba] hover:bg-[#3d7a95] text-white py-3 rounded">
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Signup;

