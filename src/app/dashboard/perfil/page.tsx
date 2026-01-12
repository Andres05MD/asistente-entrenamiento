"use client";

import { useUser } from "@/hooks/useData";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaUser, FaSave, FaEnvelope, FaShieldAlt, FaDumbbell, FaTrophy, FaBolt, FaCheckCircle, FaCrown, FaStar } from "react-icons/fa";
import AnimatedBadge from "@/components/ui/animated-badge";
import CircularProgress from "@/components/ui/circular-progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAvances } from "@/hooks/useData";
import { useGamification } from "@/hooks/useGamification";
import { useEffect, useState } from "react";

const profileSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    age: z.number().min(13, "Debes tener al menos 13 años").max(100, "Edad inválida").optional(),
    level: z.string().optional(),
    goal: z.string().optional(),
    days: z.number().min(1).max(7).optional(),
    equipment: z.string().optional(),
    gender: z.string().optional(),
});

export default function PerfilPage() {
    const { user, profile, loading } = useUser();
    const { workoutLogs } = useAvances();
    const { currentLevel, progress, currentXP, xpToNextLevel } = useGamification();
    const [saving, setSaving] = useState(false);

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            age: "" as any,
            level: "Principiante",
            goal: "Hipertrofia",
            days: 4,
            equipment: "Gimnasio Comercial",
            gender: "Hombre"
        },
    });

    useEffect(() => {
        if (profile) {
            const validLevels = ["Principiante", "Intermedio", "Avanzado"];
            const validGoals = ["Hipertrofia", "Fuerza", "Perdida de Peso", "Resistencia"];
            const validEquipment = ["Gimnasio Comercial", "Mancuernas", "Peso Corporal", "Home Gym"];
            const validGenders = ["Hombre", "Mujer", "Otro"];

            form.reset({
                name: profile.displayName || user?.displayName || "",
                age: profile.age,
                level: validLevels.includes(profile.level || "") ? profile.level : "Principiante",
                goal: validGoals.includes(profile.goal || "") ? profile.goal : "Hipertrofia",
                days: profile.days || 4,
                equipment: validEquipment.includes(profile.equipment || "") ? profile.equipment : "Gimnasio Comercial",
                gender: validGenders.includes(profile.gender || "") ? profile.gender : "Hombre",
            });
        }
    }, [user, profile, form]);

    const onSubmit = async (values: z.infer<typeof profileSchema>) => {
        if (!user) return;
        setSaving(true);
        try {
            if (user.displayName !== values.name) {
                await updateProfile(user, { displayName: values.name });
            }

            // Clean undefined values to avoid Firestore errors
            const profileData = {
                name: values.name,
                age: values.age || null,
                level: values.level || "Principiante",
                goal: values.goal || "Hipertrofia",
                days: values.days || 4,
                equipment: values.equipment || "Gimnasio Comercial",
                gender: values.gender || "Hombre",
                email: user.email
            };

            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, profileData, { merge: true });

            toast.success("Perfil actualizado correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar el perfil");
        } finally {
            setSaving(false);
        }
    };

    // Calculate stats
    const totalWorkouts = workoutLogs.length;

    // Calculate profile completion
    const completedFields = [
        form.watch("name"),
        form.watch("age"),
        form.watch("level"),
        form.watch("goal"),
        form.watch("days"),
        form.watch("equipment"),
        form.watch("gender")
    ].filter(Boolean).length;
    const profileCompletion = Math.round((completedFields / 7) * 100);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando perfil...</div>;
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in-50 duration-500">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        Tu Perfil
                        {totalWorkouts >= 50 && <FaCrown className="text-yellow-400" />}
                    </h1>
                    <p className="text-muted-foreground">Gestiona tu información y ve tu progreso</p>
                </div>
                <AnimatedBadge variant="info" pulse>
                    {profileCompletion}% Completo
                </AnimatedBadge>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
                <Card className="glass-card hover:border-primary/20 transition-all group">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Entrenamientos</p>
                                <p className="text-2xl font-bold text-white">{totalWorkouts}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                <FaDumbbell className="text-blue-400 text-xl" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card hover:border-green-500/20 transition-all group border-green-500/30 bg-green-900/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-green-400 mb-1 font-bold flex items-center gap-1"><FaStar className="text-[10px]" /> Nivel de Atleta</p>
                                <p className="text-2xl font-bold text-white">Lvl {currentLevel}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                                <FaTrophy className="text-green-400 text-xl" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card hover:border-purple-500/20 transition-all group">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Objetivo</p>
                                <p className="text-sm font-semibold text-white">{profile?.goal || "Sin definir"}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                                <FaBolt className="text-purple-400 text-xl" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card hover:border-orange-500/20 transition-all group">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Días/Semana</p>
                                <p className="text-2xl font-bold text-white">{profile?.days || 0}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                                <FaCheckCircle className="text-orange-400 text-xl" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* User Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="md:col-span-1"
                >
                    <Card className="glass-card border-white/10 h-full overflow-hidden relative group">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                        <CardHeader className="text-center relative z-10">
                            <div className="mx-auto w-32 h-32 mb-4 relative">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <Avatar className="w-full h-full border-4 border-primary ring-4 ring-primary/20 shadow-xl shadow-primary/30">
                                        <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-3xl text-white">
                                            {user?.displayName?.charAt(0).toUpperCase() || <FaUser />}
                                        </AvatarFallback>
                                    </Avatar>
                                </motion.div>
                                {totalWorkouts >= 100 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-2 shadow-lg shadow-yellow-500/50"
                                    >
                                        <FaTrophy className="text-white text-sm" />
                                    </motion.div>
                                )}
                            </div>
                            <CardTitle className="text-2xl text-white font-bold">{user?.displayName || "Usuario"}</CardTitle>
                            <CardDescription className="text-sm">{user?.email}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10">
                            <div className="flex justify-center">
                                <CircularProgress
                                    value={profileCompletion}
                                    max={100}
                                    size={120}
                                    strokeWidth={8}
                                    variant={profileCompletion === 100 ? "success" : "default"}
                                    showValue
                                    label="Perfil"
                                />
                            </div>

                            {/* XP Progress Bar */}
                            <div className="w-full max-w-[200px] mx-auto space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Nivel {currentLevel}</span>
                                    <span>{Math.floor(progress)}%</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-green-400 to-emerald-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </div>
                                <div className="text-[10px] text-center text-muted-foreground font-mono">
                                    {Math.floor(currentXP)} / {Math.floor(xpToNextLevel)} XP
                                </div>
                            </div>

                            <div className="space-y-2 text-center">
                                <div className="text-xs text-muted-foreground uppercase tracking-widest">
                                    Miembro desde
                                </div>
                                <div className="font-mono text-sm text-white/80 bg-white/5 rounded-lg py-2 px-4 inline-block">
                                    {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                                </div>
                            </div>
                            {totalWorkouts >= 50 && (
                                <AnimatedBadge variant="warning" className="w-full justify-center">
                                    <FaCrown className="mr-1" /> Usuario VIP
                                </AnimatedBadge>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Edit Form */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="md:col-span-2 space-y-6"
                >
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Personal Information */}
                            <Card className="glass-card hover:border-primary/20 transition-all">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FaUser className="text-primary" />
                                        Información Personal
                                    </CardTitle>
                                    <CardDescription>Actualiza tus datos básicos</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white/80">Nombre Completo</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="bg-white/5 border-white/10 text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white/80">Email</div>
                                        <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-muted-foreground cursor-not-allowed opacity-80">
                                            <FaEnvelope size={14} />
                                            <span className="text-sm">{user?.email}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">El email no se puede cambiar.</p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="age"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white/80">Edad</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={13}
                                                        max={100}
                                                        placeholder="Ej: 25"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                                                        className="bg-white/5 border-white/10 text-white"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Training Profile */}
                            <Card className="glass-card hover:border-blue-500/20 transition-all">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FaDumbbell className="text-blue-400" />
                                        Perfil de Entrenamiento
                                    </CardTitle>
                                    <CardDescription>Personaliza tu experiencia para mejores resultados</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="level"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white/80">Nivel de Experiencia</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                                <SelectValue placeholder="Selecciona..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-zinc-900 border-white/10">
                                                            <SelectItem value="Principiante">Principiante</SelectItem>
                                                            <SelectItem value="Intermedio">Intermedio</SelectItem>
                                                            <SelectItem value="Avanzado">Avanzado</SelectItem>
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
                                                    <FormLabel className="text-white/80">Objetivo Principal</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                                <SelectValue placeholder="Selecciona..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-zinc-900 border-white/10">
                                                            <SelectItem value="Hipertrofia">Hipertrofia (Ganar Músculo)</SelectItem>
                                                            <SelectItem value="Fuerza">Fuerza Máxima</SelectItem>
                                                            <SelectItem value="Perdida de Peso">Pérdida de Peso</SelectItem>
                                                            <SelectItem value="Resistencia">Resistencia</SelectItem>
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
                                                    <FormLabel className="text-white/80">Días por Semana</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={7}
                                                            {...field}
                                                            value={field.value ?? ""}
                                                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                                                            className="bg-white/5 border-white/10 text-white"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="equipment"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white/80">Equipo Disponible</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                                <SelectValue placeholder="Selecciona..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-zinc-900 border-white/10">
                                                            <SelectItem value="Gimnasio Comercial">Gimnasio Completo</SelectItem>
                                                            <SelectItem value="Mancuernas">Solo Mancuernas</SelectItem>
                                                            <SelectItem value="Peso Corporal">Calistenia / Peso Corporal</SelectItem>
                                                            <SelectItem value="Home Gym">Home Gym Básico</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="gender"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white/80">Género</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                                <SelectValue placeholder="Selecciona..." />
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
                                </CardContent>
                            </Card>

                            <div className="flex justify-end sticky bottom-4 z-10">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-900/20 px-8 py-6 text-lg rounded-full"
                                >
                                    {saving ? (
                                        "Guardando..."
                                    ) : (
                                        <>
                                            <FaSave className="mr-2" /> Guardar Todos los Cambios
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>

                    <Card className="bg-card/50 backdrop-blur-xl border-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FaShieldAlt className="text-purple-400" />
                                Seguridad
                            </CardTitle>
                            <CardDescription>Opciones de seguridad de tu cuenta</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full justify-start text-white border-white/10 hover:bg-white/5 hover:text-white" onClick={() => toast.success("Próximamente: Cambio de contraseña")}>
                                Cambiar Contraseña
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
