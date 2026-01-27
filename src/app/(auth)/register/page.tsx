"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, setDoc } from "firebase/firestore";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const registerSchema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
    email: z.string().email({ message: "Email inválido" }),
    password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
    confirmPassword: z.string(),
    age: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, { message: "Edad válida requerida" }),
    gender: z.string().min(1, { message: "Selecciona un género" }),
    level: z.string().min(1, { message: "Selecciona tu nivel" }),
    goal: z.string().min(1, { message: "Selecciona tu objetivo" }),
    equipment: z.string().min(1, { message: "Selecciona tu equipamiento" }),
    days: z.string().min(1, { message: "Selecciona los días disponibles" }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export default function RegisterPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!authLoading && user) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router]);

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            age: "",
            gender: "",
            level: "",
            goal: "",
            equipment: "",
            days: "",
        },
    });

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: values.name,
            });

            // Crear documento del usuario en Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: values.name,
                email: values.email,
                age: parseInt(values.age),
                gender: values.gender,
                level: values.level,
                goal: values.goal,
                equipment: values.equipment,
                days: parseInt(values.days),
                createdAt: new Date().toISOString(),
                settings: {
                    theme: "dark",
                    notifications: true,
                }
            });

            toast.success("¡Cuenta creada exitosamente!");
            router.push("/dashboard");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            toast.error("Error al registrarse. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    }

    if (authLoading) return null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-zinc-900 to-black p-4 py-8">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-2xl"
                >
                    <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
                        <CardHeader className="space-y-1 text-center">
                            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                                Crear Perfil de Atleta
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">
                                Completa tu perfil para que la IA diseñe tu plan perfecto
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                    {/* Información Personal */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">Datos Personales</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nombre Completo</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Juan Pérez" {...field} className="bg-white/5 border-white/10" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="age"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Edad</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" placeholder="25" {...field} className="bg-white/5 border-white/10" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="gender"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Género</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="bg-white/5 border-white/10">
                                                                        <SelectValue placeholder="Selecciona" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="bg-zinc-900 border-white/10">
                                                                    <SelectItem value="Hombre">Hombre</SelectItem>
                                                                    <SelectItem value="Mujer">Mujer</SelectItem>
                                                                    <SelectItem value="Otro">Otro</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Perfil Fitness */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">Perfil de Entrenamiento</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="level"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nivel de Experiencia</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                                    <SelectValue placeholder="Selecciona..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="bg-zinc-900 border-white/10">
                                                                <SelectItem value="Principiante">Principiante (0-6 meses)</SelectItem>
                                                                <SelectItem value="Intermedio">Intermedio (6m - 2 años)</SelectItem>
                                                                <SelectItem value="Avanzado">Avanzado (+2 años)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="goal"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Objetivo Principal</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                                    <SelectValue placeholder="Selecciona..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="bg-zinc-900 border-white/10">
                                                                <SelectItem value="Hipertrofia">Hipertrofia (Ganar Músculo)</SelectItem>
                                                                <SelectItem value="Fuerza">Fuerza Máxima</SelectItem>
                                                                <SelectItem value="Perdida de Peso">Pérdida de Peso</SelectItem>
                                                                <SelectItem value="Resistencia">Resistencia / Salud</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="days"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Días Disponibles/Semana</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                                    <SelectValue placeholder="Selecciona..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="bg-zinc-900 border-white/10">
                                                                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                                                    <SelectItem key={d} value={d.toString()}>{d} días</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="equipment"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Equipamiento Disponible</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                                    <SelectValue placeholder="Selecciona..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="bg-zinc-900 border-white/10">
                                                                <SelectItem value="Gimnasio Comercial">Gimnasio Comercial (Completo)</SelectItem>
                                                                <SelectItem value="Gimnasio en Casa">Gimnasio en Casa (Básico)</SelectItem>
                                                                <SelectItem value="Mancuernas">Solo Mancuernas</SelectItem>
                                                                <SelectItem value="Peso Corporal">Calistenia / Peso Corporal</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Credenciales */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">Cuenta y Seguridad</h3>
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="tu@email.com" {...field} className="bg-white/5 border-white/10" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Contraseña</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showPassword ? "text" : "password"}
                                                                    placeholder="******"
                                                                    {...field}
                                                                    className="bg-white/5 border-white/10 pr-10"
                                                                />
                                                                <PremiumButton
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute right-0 top-0 h-full px-3"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                >
                                                                    {showPassword ? <FaEyeSlash className="h-4 w-4 text-muted-foreground" /> : <FaEye className="h-4 w-4 text-muted-foreground" />}
                                                                </PremiumButton>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="confirmPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Confirmar Contraseña</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showConfirmPassword ? "text" : "password"}
                                                                    placeholder="******"
                                                                    {...field}
                                                                    className="bg-white/5 border-white/10 pr-10"
                                                                />
                                                                <PremiumButton
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute right-0 top-0 h-full px-3"
                                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                >
                                                                    {showConfirmPassword ? <FaEyeSlash className="h-4 w-4 text-muted-foreground" /> : <FaEye className="h-4 w-4 text-muted-foreground" />}
                                                                </PremiumButton>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <PremiumButton
                                        type="submit"
                                        variant="gradient"
                                        glow
                                        className="w-full font-bold py-6 text-lg shadow-lg shadow-primary/25 mt-4"
                                        disabled={loading}
                                    >
                                        {loading ? "Creando tu perfil..." : "Comenzar Mi Transformación 🚀"}
                                    </PremiumButton>
                                </form>
                            </Form>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground bg-zinc-950">
                                        O regístrate con
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
                                        // La redirección automática ocurrirá en AuthContext
                                    } catch (error) {
                                        console.error(error);
                                        toast.error("Error al registrarse con Google");
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
                        <CardFooter className="flex justify-center text-sm text-muted-foreground pb-6">
                            <div>
                                ¿Ya tienes cuenta?{" "}
                                <Link href="/login" className="text-primary hover:text-primary/80 hover:underline transition-colors font-medium">
                                    Inicia Sesión
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
