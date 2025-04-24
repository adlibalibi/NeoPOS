import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";

const db = getFirestore();

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
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password
        );
        const user = userCredential.user;
  
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
  
        const profile = userSnap.exists() ? userSnap.data() : {};
  
        const idToken = await user.getIdToken();
  
        localStorage.setItem("token", idToken);
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: profile.name || user.displayName || "User",
            email: user.email,
          })
        );
  
        toast({
          title: "Logged in successfully",
          description: "Welcome back to NeoPOS!",
        });
  
        navigate("/dashboard");
      } catch (error: any) {
        console.error("Login error", error);
        const friendlyMsg =
          error.code === "auth/user-not-found" || error.code === "auth/wrong-password"
            ? "This account doesn't exist or your password is incorrect."
            : error.message;
  
            toast({
              title: "Uh-oh!",
              description: "Wrong credentials! Check your email or password.",
            });            
      }
    }
  };
  
  const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
      .then(async (result) => {
        const user = result.user;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: user.displayName,
            email: user.email,
            createdAt: new Date().toISOString(),
          });
        }

        const idToken = await user.getIdToken();

        localStorage.setItem('token', idToken);
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
        console.error("Sign-in error", error.message);
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

            <div className="mt-4 text-center text-sm">
              New here?{" "}
              <span
                className="text-blue-600 cursor-pointer hover:underline"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
