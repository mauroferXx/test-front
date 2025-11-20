import { useState, useEffect } from 'react';
import useShoppingStore from '../store/useShoppingStore';
import './UserProfile.css';

function UserProfile() {
    const { user, updatePreferences } = useShoppingStore();
    const [dietary, setDietary] = useState({
        vegan: false,
        glutenFree: false,
        vegetarian: false,
        lactoseFree: false
    });

    const [weights, setWeights] = useState({
        economic: 0.4,
        environmental: 0.4,
        social: 0.2
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user && user.preferences) {
            if (user.preferences.dietaryRestrictions) {
                setDietary({ ...dietary, ...user.preferences.dietaryRestrictions });
            }
            if (user.preferences.sustainabilityWeights) {
                setWeights({ ...weights, ...user.preferences.sustainabilityWeights });
            }
        }
    }, [user]);

    const handleDietaryChange = (key) => {
        const newDietary = { ...dietary, [key]: !dietary[key] };
        setDietary(newDietary);
        handleSave({ dietaryRestrictions: newDietary, sustainabilityWeights: weights });
    };

    const handleWeightChange = (key, value) => {
        const newWeights = { ...weights, [key]: parseFloat(value) };
        setWeights(newWeights);
        // Debounce save for sliders could be better, but for now save on change end
    };

    const handleWeightCommit = () => {
        handleSave({ dietaryRestrictions: dietary, sustainabilityWeights: weights });
    };

    const handleSave = async (newPreferences) => {
        setSaving(true);
        await updatePreferences(newPreferences);
        setSaving(false);
    };

    if (!user) {
        return <div className="profile-container">Por favor inicia sesión para ver tu perfil.</div>;
    }

    return (
        <div className="profile-container">
            <h1>👤 Mi Perfil de Sostenibilidad</h1>

            <div className="profile-card">
                <h2>🥗 Preferencias Dietéticas</h2>
                <p className="section-desc">Selecciona tus restricciones para que el algoritmo filtre los productos adecuados.</p>

                <div className="dietary-grid">
                    <label className="checkbox-card">
                        <input
                            type="checkbox"
                            checked={dietary.vegan}
                            onChange={() => handleDietaryChange('vegan')}
                        />
                        <span className="checkmark"></span>
                        <span className="label-text">Vegano</span>
                    </label>

                    <label className="checkbox-card">
                        <input
                            type="checkbox"
                            checked={dietary.glutenFree}
                            onChange={() => handleDietaryChange('glutenFree')}
                        />
                        <span className="checkmark"></span>
                        <span className="label-text">Sin Gluten</span>
                    </label>

                    <label className="checkbox-card">
                        <input
                            type="checkbox"
                            checked={dietary.vegetarian}
                            onChange={() => handleDietaryChange('vegetarian')}
                        />
                        <span className="checkmark"></span>
                        <span className="label-text">Vegetariano</span>
                    </label>

                    <label className="checkbox-card">
                        <input
                            type="checkbox"
                            checked={dietary.lactoseFree}
                            onChange={() => handleDietaryChange('lactoseFree')}
                        />
                        <span className="checkmark"></span>
                        <span className="label-text">Sin Lactosa</span>
                    </label>
                </div>
            </div>

            <div className="profile-card">
                <h2>⚖️ Prioridades de Sostenibilidad</h2>
                <p className="section-desc">Ajusta qué tan importante es cada factor para ti (0 a 1). La suma no necesita ser 1.</p>

                <div className="weights-container">
                    <div className="weight-control">
                        <div className="weight-header">
                            <span>💰 Económico</span>
                            <span className="weight-value">{weights.economic}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={weights.economic}
                            onChange={(e) => handleWeightChange('economic', e.target.value)}
                            onMouseUp={handleWeightCommit}
                            onTouchEnd={handleWeightCommit}
                            className="slider economic"
                        />
                    </div>

                    <div className="weight-control">
                        <div className="weight-header">
                            <span>🌍 Ambiental (CO₂, Eco-Score)</span>
                            <span className="weight-value">{weights.environmental}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={weights.environmental}
                            onChange={(e) => handleWeightChange('environmental', e.target.value)}
                            onMouseUp={handleWeightCommit}
                            onTouchEnd={handleWeightCommit}
                            className="slider environmental"
                        />
                    </div>

                    <div className="weight-control">
                        <div className="weight-header">
                            <span>🤝 Social (Comercio Justo)</span>
                            <span className="weight-value">{weights.social}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={weights.social}
                            onChange={(e) => handleWeightChange('social', e.target.value)}
                            onMouseUp={handleWeightCommit}
                            onTouchEnd={handleWeightCommit}
                            className="slider social"
                        />
                    </div>
                </div>
            </div>

            {saving && <div className="saving-indicator">Guardando preferencias...</div>}
        </div>
    );
}

export default UserProfile;
