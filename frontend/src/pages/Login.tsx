import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/firebase/firebase"; // adjust this path based on your setup

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.email && credentials.password) {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        name: 'John Doe',
        role: 'admin',
        email: credentials.email
      }));
      toast({
        title: "Logged in successfully",
        description: "Welcome back to NeoPOS!",
      });
      navigate('/dashboard');
    }
  };

  const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        console.log("✅ User Signed In:", user.displayName, user.email);
        localStorage.setItem('token', user.accessToken || 'firebase-token');
        localStorage.setItem('user', JSON.stringify({
          name: user.displayName,
          email: user.email,
        }));
        toast({
          title: "Google Sign-In Success",
          description: `Welcome, ${user.displayName}`,
        });
        navigate('/dashboard');
      })
      .catch((error) => {
        console.error("❌ Sign-in error", error.message);
        toast({
          title: "Login failed",
          description: error.message,
        });
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-light">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-white hover:bg-primary-dark"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              onClick={signInWithGoogle}
              className="w-full bg-red-500 text-white hover:bg-red-600"
            >
              Login with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
