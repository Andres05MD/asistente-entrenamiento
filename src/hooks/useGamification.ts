import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { toast } from "react-hot-toast";

// XP Formula: XP Required for Level L = 250 * L^2
// Inverse: Level = Math.sqrt(XP / 250)
const BASE_XP = 250;

export function useGamification() {
    const { user, profile } = useAuth();

    const currentXP = profile?.xp || 0;
    const currentLevel = Math.floor(Math.sqrt(currentXP / BASE_XP)) || 1;

    // XP required to reach the NEXT level
    const xpToNextLevel = BASE_XP * Math.pow(currentLevel + 1, 2);
    // XP required to reach CURRENT level (base of this level)
    const xpCurrentLevelBase = BASE_XP * Math.pow(currentLevel, 2);

    const xpInCurrentLevel = currentXP - xpCurrentLevelBase;
    const xpRequiredForNextLevel = xpToNextLevel - xpCurrentLevelBase;

    // Progress percentage (0-100)
    const progress = Math.min(100, Math.max(0, (xpInCurrentLevel / xpRequiredForNextLevel) * 100));

    const addXP = async (amount: number) => {
        if (!user) return;

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                xp: increment(amount)
            });

            // Calculate if level up occurred locally to show toast immediately
            const newXP = currentXP + amount;
            const newLevel = Math.floor(Math.sqrt(newXP / BASE_XP)) || 1;

            if (newLevel > currentLevel) {
                // Level Up!
                return { leveledUp: true, newLevel };
            }
            return { leveledUp: false, newLevel: currentLevel };
        } catch (error) {
            console.error("Error adding XP:", error);
            toast.error("Error al actualizar experiencia");
        }
    };

    return {
        currentXP,
        currentLevel,
        progress,
        xpToNextLevel,
        xpCurrentLevelBase,
        addXP
    };
}
