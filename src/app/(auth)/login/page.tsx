"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const loginSchema = z.object({
    email: z.string().email({ message: "Email inválido" }),
    password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export default function LoginPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!authLoading && user) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router]);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, values.email, values.password);
            toast.success("¡Bienvenido de nuevo!");
            router.push("/dashboard");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error("Error al iniciar sesión. Verifica tus credenciales.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (authLoading) return null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-zinc-900 to-black p-4">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
                        <CardHeader className="space-y-1 text-center">
                            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                                Entrenador IA
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">
                                Tu asistente personal para alcanzar tus metas
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">


                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white/80">Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="tu@email.com"
                                                        {...field}
                                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 transition-all"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white/80">Contraseña</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="******"
                                                            {...field}
                                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 transition-all pr-10"
                                                        />
                                                        <PremiumButton
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-white"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? (
                                                                <FaEyeSlash className="h-4 w-4" />
                                                            ) : (
                                                                <FaEye className="h-4 w-4" />
                                                            )}
                                                        </PremiumButton>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <PremiumButton
                                        type="submit"
                                        variant="gradient"
                                        glow
                                        className="w-full font-medium shadow-lg shadow-primary/25 transition-all"
                                        disabled={loading}
                                    >
                                        {loading ? "Iniciando sesión..." : "Ingresar"}
                                    </PremiumButton>
                                </form>
                            </Form>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground bg-zinc-950">
                                        O continuar con
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
                                        const provider = new GoogleAuthProvider();
                                        await signInWithPopup(auth, provider);
                                        // La redirección y creación de perfil la maneja AuthContext
                                        // No necesitamos toast aquí, AuthContext/OnAuthStateChange dispara redirect
                                    } catch (error) {
                                        console.error(error);
                                        toast.error("Error al iniciar sesión con Google");
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                            >
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Google
                            </Button>

                        </CardContent>
                        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                            <div>
                                ¿No tienes cuenta?{" "}
                                <Link href="/register" className="text-primary hover:text-primary/80 hover:underline transition-colors font-medium">
                                    Regístrate
                                </Link>
                            </div>


                        </CardFooter>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
