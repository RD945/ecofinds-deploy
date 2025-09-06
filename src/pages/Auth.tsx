import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  identifier: z.string().min(1, { message: "Email or Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const otpSchema = z.object({
    otp: z.string().length(6, { message: "Your OTP must be 6 characters." }),
});

type FormSchema = z.infer<typeof loginSchema> | z.infer<typeof signupSchema> | z.infer<typeof otpSchema>;

export const Auth = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(searchParams.get('mode') || 'login' as 'login' | 'signup');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [userId, setUserId] = useState<number | null>(null);

  const formSchema = mode === 'login' && step === 'otp' ? otpSchema : mode === 'login' ? loginSchema : signupSchema;

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      identifier: "",
      otp: "",
    },
  });

  // Reset form and errors when switching modes
  useEffect(() => {
    form.reset();
    setError(null);
    setStep('credentials');
  }, [mode, form]);

  const onSubmit = async (values: FormSchema) => {
    setError(null);
    try {
        if (mode === 'login' && step === 'credentials') {
            const { data } = await api.post('/auth/login', values);
            if (data.twoFactorEnabled) {
                setUserId(data.userId);
                setStep('otp');
                form.reset({ otp: "" });
            } else {
                login(data.token, data.user);
                navigate("/dashboard");
            }
        } else if (mode === 'login' && step === 'otp') {
            const { data } = await api.post('/auth/verify-otp', { userId, ...values });
            login(data.token, data.user);
            navigate("/dashboard");
        } else { // Signup
            await api.post('/auth/register', values);
            setMode('login'); // Switch to login tab after successful registration
        }
    } catch (err: any) {
        if (axios.isAxiosError(err) && err.response) {
            if (err.response.status === 409) {
                setError("User with this email or username already exists.");
            } else {
                setError(err.response.data.message || "An unknown error occurred.");
            }
        } else {
            setError("An unexpected error occurred. Please check your network.");
        }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/50 p-4">
        <Button variant="ghost" className="absolute top-4 left-4" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
        </Button>
      <Tabs value={mode} onValueChange={(value) => setMode(value as 'login' | 'signup')} className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{step === 'credentials' ? 'Welcome Back' : 'Enter OTP'}</CardTitle>
                    <CardDescription>{step === 'credentials' ? 'Sign in to continue.' : 'Check your email for a 6-digit code.'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {step === 'credentials' ? (
                                <>
                                    <FormField control={form.control} name="identifier" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email or Username</FormLabel>
                                            <FormControl><Input placeholder="name@example.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </>
                            ) : (
                                <FormField control={form.control} name="otp" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>One-Time Password</FormLabel>
                                        <FormControl>
                                            <InputOTP maxLength={6} {...field}>
                                                <InputOTPGroup>
                                                    {[...Array(6)].map((_, i) => <InputOTPSlot key={i} index={i} />)}
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            )}
                            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Loading...' : step === 'credentials' ? 'Sign In' : 'Verify OTP'}
                            </Button>
                        </form>
                    </Form>
                    <div className="mt-4 text-center text-sm">
                        {step === 'credentials' && (
                            <Link to="/forgot-password"className="underline">Forgot your password?</Link>
                        )}
                        {step === 'otp' && (
                            <Button variant="link" onClick={() => setStep('credentials')}>Back to login</Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="signup">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Join Our Community</CardTitle>
                    <CardDescription>Create an account to start your sustainable journey.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField control={form.control} name="username" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl><Input placeholder="yourusername" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Loading...' : 'Create Account'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};