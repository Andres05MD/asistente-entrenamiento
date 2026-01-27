export default function CoachDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard del Entrenador</h1>
            <p className="text-gray-500">Bienvenido al panel de gestión.</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Widgets Placeholder */}
                <div className="rounded-lg border p-4 shadow-sm">
                    <h3 className="font-semibold">Atletas Activos</h3>
                    <p className="text-2xl font-bold">0</p>
                </div>
                <div className="rounded-lg border p-4 shadow-sm">
                    <h3 className="font-semibold">Rutinas Asignadas</h3>
                    <p className="text-2xl font-bold">0</p>
                </div>
            </div>
        </div>
    );
}
