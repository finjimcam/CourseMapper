// src/pages/Login.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button, Label, TextInput, Card } from 'flowbite-react';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // The second argument (payload) can be empty {} for this route
      // The third argument includes withCredentials to store the session cookie
      await axios.post(
        `${import.meta.env.VITE_API}/session/${username}`,
        {},
        { withCredentials: true }
      );
      // If successful, navigate to homepage or a protected route
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Login failed. Ensure username exists on the backend.');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="username" value="Username" />
            <TextInput
              id="username"
              type="text"
              placeholder="Enter your username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <Button type="submit" gradientDuoTone="cyanToBlue">
            Log In
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default Login;
